import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from 'pg';
import {
  createPostgresPoolConfig,
  type PostgresPoolRuntimeConfig
} from '../postgres-pool-config.js';
import { loadPostgresMigrations } from './load-postgres-migrations.js';
import { PostgresMigrationError } from './postgres-migration-error.js';
import type { PostgresMigration } from './postgres-migration.js';
import type { PostgresMigrationRunResult } from './postgres-migration-result.js';

const MIGRATION_LOCK_KEY_PARTS = [0x4e4e, 0x4d47] as const;

const ACQUIRE_MIGRATION_LOCK_SQL =
  'SELECT pg_advisory_lock($1, $2)';
const RELEASE_MIGRATION_LOCK_SQL =
  'SELECT pg_advisory_unlock($1, $2)';
const CREATE_MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS natalnode_schema_migrations (
  version TEXT PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  checksum_sha256 TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL
)
`;
const READ_APPLIED_MIGRATIONS_SQL = `
SELECT version, filename, checksum_sha256
FROM natalnode_schema_migrations
ORDER BY version
`;
const BEGIN_TRANSACTION_SQL = 'BEGIN';
const ROLLBACK_TRANSACTION_SQL = 'ROLLBACK';
const COMMIT_TRANSACTION_SQL = 'COMMIT';
const RECORD_MIGRATION_SQL = `
INSERT INTO natalnode_schema_migrations (
  version,
  filename,
  checksum_sha256,
  applied_at
)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
`;

interface AppliedMigrationRow extends QueryResultRow {
  readonly version: string;
  readonly filename: string;
  readonly checksum_sha256: string;
}

function combineFailures(failures: readonly unknown[]): unknown {
  if (failures.length === 1) {
    return failures[0];
  }

  return new AggregateError(
    failures,
    'PostgreSQL migration execution and cleanup both failed.'
  );
}

async function applyMigration(
  client: PoolClient,
  migration: PostgresMigration
): Promise<void> {
  let transactionStarted = false;

  try {
    await client.query(BEGIN_TRANSACTION_SQL);
    transactionStarted = true;
    await client.query(migration.executableSql);
    await client.query(RECORD_MIGRATION_SQL, [
      migration.version,
      migration.filename,
      migration.checksumSha256
    ]);
    await client.query(COMMIT_TRANSACTION_SQL);
  } catch (error) {
    if (!transactionStarted) {
      throw error;
    }

    try {
      await client.query(ROLLBACK_TRANSACTION_SQL);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'PostgreSQL migration failed and rollback also failed.'
      );
    }

    throw error;
  }
}

async function executeMigrationRun(
  client: PoolClient,
  migrations: readonly PostgresMigration[]
): Promise<PostgresMigrationRunResult> {
  await client.query(CREATE_MIGRATION_TABLE_SQL);

  const appliedResult = await client.query<AppliedMigrationRow>(
    READ_APPLIED_MIGRATIONS_SQL
  );
  const appliedByVersion = new Map<string, AppliedMigrationRow>();
  for (const appliedMigration of appliedResult.rows) {
    appliedByVersion.set(appliedMigration.version, appliedMigration);
  }

  const migrationsByVersion = new Map(
    migrations.map((migration) => [migration.version, migration])
  );
  for (const appliedMigration of appliedByVersion.values()) {
    if (!migrationsByVersion.has(appliedMigration.version)) {
      throw new PostgresMigrationError(
        `Applied migration version "${appliedMigration.version}" is missing from the supplied migrations directory.`
      );
    }
  }

  const appliedVersions: string[] = [];
  const alreadyAppliedVersions: string[] = [];

  for (const migration of migrations) {
    const appliedMigration = appliedByVersion.get(migration.version);
    if (appliedMigration !== undefined) {
      if (
        appliedMigration.filename !== migration.filename ||
        appliedMigration.checksum_sha256 !== migration.checksumSha256
      ) {
        throw new PostgresMigrationError(
          `Applied migration drift detected for version "${migration.version}".`
        );
      }

      alreadyAppliedVersions.push(migration.version);
      continue;
    }

    await applyMigration(client, migration);
    appliedVersions.push(migration.version);
  }

  return { appliedVersions, alreadyAppliedVersions };
}

async function releaseMigrationResources(
  pool: Pick<Pool, 'end'>,
  client: PoolClient | undefined,
  lockAcquired: boolean
): Promise<readonly unknown[]> {
  const cleanupErrors: unknown[] = [];

  if (client !== undefined && lockAcquired) {
    try {
      const unlockResult = await client.query<{
        pg_advisory_unlock: boolean;
      } & QueryResultRow>(RELEASE_MIGRATION_LOCK_SQL, [
        ...MIGRATION_LOCK_KEY_PARTS
      ]);

      if (unlockResult.rows[0]?.pg_advisory_unlock !== true) {
        throw new PostgresMigrationError(
          'PostgreSQL migration advisory lock was not released.'
        );
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  if (client !== undefined) {
    try {
      client.release();
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  try {
    await pool.end();
  } catch (error) {
    cleanupErrors.push(error);
  }

  return cleanupErrors;
}

export interface PostgresMigrationRuntimeDependencies {
  readonly createPool?: (
    config: PoolConfig
  ) => Pick<Pool, 'connect' | 'end'>;
}

export async function runPostgresMigrations(
  postgresConfig: PostgresPoolRuntimeConfig,
  migrationsDirectory: string,
  dependencies: PostgresMigrationRuntimeDependencies = {}
): Promise<PostgresMigrationRunResult> {
  const poolConfig = createPostgresPoolConfig(postgresConfig);
  const migrations = await loadPostgresMigrations(migrationsDirectory);
  const pool = dependencies.createPool?.(poolConfig) ?? new Pool(poolConfig);
  let client: PoolClient | undefined;
  let lockAcquired = false;
  let migrationResult: PostgresMigrationRunResult | undefined;
  let operationError: unknown;
  let operationFailed = false;

  try {
    client = await pool.connect();
    await client.query(ACQUIRE_MIGRATION_LOCK_SQL, [
      ...MIGRATION_LOCK_KEY_PARTS
    ]);
    lockAcquired = true;
    migrationResult = await executeMigrationRun(client, migrations);
  } catch (error) {
    operationFailed = true;
    operationError = error;
  }

  const cleanupErrors = await releaseMigrationResources(
    pool,
    client,
    lockAcquired
  );

  if (operationFailed) {
    throw combineFailures([operationError, ...cleanupErrors]);
  }

  if (cleanupErrors.length > 0) {
    throw combineFailures(cleanupErrors);
  }

  if (migrationResult === undefined) {
    throw new Error('PostgreSQL migration runtime completed without a result.');
  }

  return migrationResult;
}
