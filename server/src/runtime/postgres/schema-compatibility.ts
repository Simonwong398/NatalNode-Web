import type { SqlExecutor } from '../../db/index.js';
import { loadPostgresMigrations } from './migrations/load-postgres-migrations.js';

export const VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION = '0020';

const REQUIRED_VAULT_COLUMNS = [
  'record_version',
  'scientific_status',
  'calculation_authority_state',
  'record_origin',
  'source_context',
  'time_authority_state',
  'chart_result_contract_version',
  'scientific_configuration_identity',
  'scientific_provenance',
  'saved_at'
] as const;

const READ_APPLIED_MIGRATION_SQL = `
  SELECT version, filename, checksum_sha256
  FROM natalnode_schema_migrations
  WHERE version = $1
`;

const READ_REQUIRED_COLUMNS_SQL = `
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'charts'
    AND column_name = ANY($1::text[])
`;

interface AppliedMigrationRow {
  readonly version: string;
  readonly filename: string;
  readonly checksum_sha256: string;
}

interface ColumnRow {
  readonly column_name: string;
}

function readSqlState(error: unknown): string | undefined {
  if (
    error === null ||
    typeof error !== 'object' ||
    !('code' in error) ||
    typeof error.code !== 'string' ||
    !/^[0-9A-Z]{5}$/u.test(error.code)
  ) {
    return undefined;
  }

  return error.code;
}

function compatibilityFailure(
  operation: string,
  error: unknown
): PostgresSchemaCompatibilityError {
  const sqlState = readSqlState(error);
  const sqlStateSuffix = sqlState === undefined ? '' : ` (SQLSTATE ${sqlState})`;

  return new PostgresSchemaCompatibilityError(
    `PostgreSQL schema compatibility check failed while ${operation}${sqlStateSuffix}. Run "npm run db:migrate" before starting the server.`,
    sqlState
  );
}

export class PostgresSchemaCompatibilityError extends Error {
  public readonly sqlState: string | undefined;

  public constructor(message: string, sqlState?: string) {
    super(message);
    this.name = 'PostgresSchemaCompatibilityError';
    this.sqlState = sqlState;
  }
}

/**
 * Performs a read-only check for the schema required by the current Vault
 * repository. Migrations remain a separate explicit release operation.
 */
export async function assertVaultSchemaCompatibility(
  executor: SqlExecutor,
  migrationsDirectory: string
): Promise<void> {
  const migrations = await loadPostgresMigrations(migrationsDirectory);
  const requiredMigration = migrations.find(
    (migration) =>
      migration.version === VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION
  );

  if (requiredMigration === undefined) {
    throw new PostgresSchemaCompatibilityError(
      `The repository does not contain required Vault migration ${VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION}.`
    );
  }

  let appliedMigrationResult;
  try {
    appliedMigrationResult = await executor.query<AppliedMigrationRow>(
      READ_APPLIED_MIGRATION_SQL,
      [VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION]
    );
  } catch (error) {
    throw compatibilityFailure('reading migration metadata', error);
  }

  const appliedMigration = appliedMigrationResult.rows[0];
  if (appliedMigration === undefined) {
    throw new PostgresSchemaCompatibilityError(
      `PostgreSQL schema is missing required Vault migration ${VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION}. Run "npm run db:migrate" before starting the server.`
    );
  }

  if (
    appliedMigration.version !== requiredMigration.version ||
    appliedMigration.filename !== requiredMigration.filename ||
    appliedMigration.checksum_sha256 !== requiredMigration.checksumSha256
  ) {
    throw new PostgresSchemaCompatibilityError(
      `PostgreSQL Vault migration ${VAULT_REQUIRED_SCHEMA_MIGRATION_VERSION} does not match the repository artifact. Run "npm run db:migrate" after resolving migration drift.`
    );
  }

  let requiredColumnsResult;
  try {
    requiredColumnsResult = await executor.query<ColumnRow>(
      READ_REQUIRED_COLUMNS_SQL,
      [REQUIRED_VAULT_COLUMNS]
    );
  } catch (error) {
    throw compatibilityFailure('reading Vault table columns', error);
  }

  const actualColumns = new Set(
    requiredColumnsResult.rows.map((row) => row.column_name)
  );
  const missingColumns = REQUIRED_VAULT_COLUMNS.filter(
    (column) => !actualColumns.has(column)
  );

  if (missingColumns.length > 0) {
    throw new PostgresSchemaCompatibilityError(
      `PostgreSQL charts schema is missing required Vault columns: ${missingColumns.join(', ')}. Run "npm run db:migrate" before starting the server.`
    );
  }
}
