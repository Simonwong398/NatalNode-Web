import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  assertVaultSchemaCompatibility,
  PostgresSchemaCompatibilityError,
  VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION
} from '../dist/runtime/postgres/schema-compatibility.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../db/migrations/', import.meta.url)
);

const REQUIRED_COLUMNS = [
  'record_version',
  'scientific_status',
  'calculation_authority_state',
  'record_origin',
  'source_context',
  'time_authority_state',
  'chart_result_contract_version',
  'scientific_configuration_identity',
  'scientific_provenance',
  'research_snapshot',
  'saved_at'
];

async function readRequiredMigration() {
  const migrations = await loadPostgresMigrations(MIGRATIONS_DIRECTORY);
  const migration = migrations.find(
    (candidate) =>
      candidate.version === VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION
  );
  assert.ok(migration);
  return migration;
}

function compatibleExecutor(migration, columns = REQUIRED_COLUMNS) {
  const calls = [];

  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });

      if (sql.includes('natalnode_schema_migrations')) {
        return {
          rows: [
            {
              version: migration.version,
              filename: migration.filename,
              checksum_sha256: migration.checksumSha256
            }
          ]
        };
      }

      if (sql.includes('information_schema.columns')) {
        return { rows: columns.map((column_name) => ({ column_name })) };
      }

      throw new Error('Unexpected compatibility query.');
    }
  };
}

test('Vault schema compatibility passes only when migration and columns match', async () => {
  const migration = await readRequiredMigration();
  const executor = compatibleExecutor(migration);

  await assertVaultSchemaCompatibility(executor, MIGRATIONS_DIRECTORY);

  assert.equal(executor.calls.length, 2);
});

test('Vault schema compatibility fails closed when migration metadata is unavailable', async () => {
  const executor = {
    async query() {
      throw Object.assign(new Error('relation is missing'), { code: '42P01' });
    }
  };

  await assert.rejects(
    () => assertVaultSchemaCompatibility(executor, MIGRATIONS_DIRECTORY),
    (error) =>
      error instanceof PostgresSchemaCompatibilityError &&
      error.sqlState === '42P01' &&
      error.message.includes('npm run db:migrate') &&
      !error.message.includes('DATABASE_URL')
  );
});

test('Vault schema compatibility rejects a partially applied schema', async () => {
  const migration = await readRequiredMigration();
  const executor = compatibleExecutor(migration, REQUIRED_COLUMNS.slice(0, -1));

  await assert.rejects(
    () => assertVaultSchemaCompatibility(executor, MIGRATIONS_DIRECTORY),
    (error) =>
      error instanceof PostgresSchemaCompatibilityError &&
      !error.message.includes('scientific_provenance') &&
      error.message.includes('saved_at') &&
      error.message.includes('npm run db:migrate')
  );
});

test('Vault schema compatibility rejects migration drift', async () => {
  const migration = await readRequiredMigration();
  const executor = compatibleExecutor({
    ...migration,
    checksumSha256: '0'.repeat(64)
  });

  await assert.rejects(
    () => assertVaultSchemaCompatibility(executor, MIGRATIONS_DIRECTORY),
    (error) =>
      error instanceof PostgresSchemaCompatibilityError &&
      error.message.includes('does not match the repository artifact')
  );
});
