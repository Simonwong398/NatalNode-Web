import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  PostgresMigrationError,
  runPostgresMigrations
} from '../dist/runtime/index.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const POSTGRES_CONFIG = {
  connectionString: 'postgresql://migration-test.invalid/natalnode',
  ssl: true
};

async function withMigrationDirectory(files, callback) {
  const directory = await mkdtemp(join(tmpdir(), 'natalnode-migration-test-'));

  try {
    await Promise.all(
      Object.entries(files).map(([filename, sql]) =>
        writeFile(join(directory, filename), sql, 'utf8')
      )
    );
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function createFakePool({ appliedRows = [], failWhen } = {}) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });

      if (sql.includes('SELECT version, filename, checksum_sha256')) {
        return { rows: appliedRows };
      }

      if (sql.includes('pg_advisory_unlock')) {
        return { rows: [{ pg_advisory_unlock: true }] };
      }

      if (failWhen?.(sql, params)) {
        throw new Error('fixture migration failure');
      }

      return { rows: [] };
    },
    release() {
      calls.push({ sql: 'CLIENT_RELEASE' });
    }
  };

  const pool = {
    async connect() {
      calls.push({ sql: 'POOL_CONNECT' });
      return client;
    },
    async end() {
      calls.push({ sql: 'POOL_END' });
    }
  };

  return { calls, pool };
}

const migrationFiles = {
  '0001_first.sql': 'CREATE TABLE migration_one (id INTEGER);',
  '0002_second.sql': 'CREATE TABLE migration_two (id INTEGER);',
  '0003_third.sql': 'CREATE TABLE migration_three (id INTEGER);'
};

function createPoolFactory(fakePool) {
  return {
    createPool() {
      return fakePool;
    }
  };
}

test('migration runner applies ordered migrations and records a complete result', async () => {
  await withMigrationDirectory(migrationFiles, async (directory) => {
    const fake = createFakePool();
    const result = await runPostgresMigrations(
      POSTGRES_CONFIG,
      directory,
      createPoolFactory(fake.pool)
    );

    assert.deepEqual(result, {
      appliedVersions: ['0001', '0002', '0003'],
      alreadyAppliedVersions: []
    });
    assert.deepEqual(
      fake.calls
        .filter(({ sql }) => sql.startsWith('CREATE TABLE migration_'))
        .map(({ sql }) => sql),
      [
        'CREATE TABLE migration_one (id INTEGER);',
        'CREATE TABLE migration_two (id INTEGER);',
        'CREATE TABLE migration_three (id INTEGER);'
      ]
    );
  });
});

test('already-applied migrations are verified and never rerun', async () => {
  await withMigrationDirectory(migrationFiles, async (directory) => {
    const migrations = await loadPostgresMigrations(directory);
    const fake = createFakePool({
      appliedRows: [
        {
          version: migrations[0].version,
          filename: migrations[0].filename,
          checksum_sha256: migrations[0].checksumSha256
        }
      ]
    });

    const result = await runPostgresMigrations(
      POSTGRES_CONFIG,
      directory,
      createPoolFactory(fake.pool)
    );

    assert.deepEqual(result, {
      appliedVersions: ['0002', '0003'],
      alreadyAppliedVersions: ['0001']
    });
    assert.equal(
      fake.calls.filter(({ sql }) => sql === 'CREATE TABLE migration_one (id INTEGER);').length,
      0
    );
  });
});

test('migration failure rolls back and stops the sequence without success', async () => {
  await withMigrationDirectory(migrationFiles, async (directory) => {
    const fake = createFakePool({
      failWhen: (sql) => sql === 'CREATE TABLE migration_two (id INTEGER);'
    });

    await assert.rejects(
      () => runPostgresMigrations(
        POSTGRES_CONFIG,
        directory,
        createPoolFactory(fake.pool)
      ),
      /fixture migration failure/u
    );

    assert.equal(
      fake.calls.filter(({ sql }) => sql === 'CREATE TABLE migration_three (id INTEGER);').length,
      0
    );
    assert.equal(
      fake.calls.filter(({ sql }) => sql === 'ROLLBACK').length,
      1
    );
    assert.equal(
      fake.calls.filter(({ sql }) => sql === 'COMMIT').length,
      1
    );
    assert.equal(
      fake.calls.filter(({ sql, params }) =>
        sql.includes('INSERT INTO natalnode_schema_migrations') &&
        params?.[0] === '0002'
      ).length,
      0
    );
  });
});

test('migration identity is stable and unknown applied history fails closed', async () => {
  await withMigrationDirectory(migrationFiles, async (directory) => {
    const firstLoad = await loadPostgresMigrations(directory);
    const secondLoad = await loadPostgresMigrations(directory);
    assert.deepEqual(secondLoad, firstLoad);

    const fake = createFakePool({
      appliedRows: [{
        version: '9999',
        filename: '9999_removed.sql',
        checksum_sha256: '0'.repeat(64)
      }]
    });

    await assert.rejects(
      () => runPostgresMigrations(
        POSTGRES_CONFIG,
        directory,
        createPoolFactory(fake.pool)
      ),
      (error) =>
        error instanceof PostgresMigrationError &&
        error.message.includes('missing from the supplied migrations directory')
    );
    assert.equal(
      fake.calls.filter(({ sql }) => sql.startsWith('CREATE TABLE migration_')).length,
      0
    );
  });
});
