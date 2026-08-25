import type { PoolConfig } from 'pg';

export interface PostgresPoolRuntimeConfig {
  readonly connectionString: string;
  readonly ssl?: PoolConfig['ssl'];
  readonly max?: number;
  readonly idleTimeoutMillis?: number;
  readonly connectionTimeoutMillis?: number;
}

function assertConnectionString(connectionString: string): void {
  if (typeof connectionString !== 'string' || connectionString.trim().length === 0) {
    throw new Error('Postgres connectionString must be a non-empty string.');
  }
}

function assertOptionalPositiveInteger(value: number | undefined, name: string): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive integer.`);
  }
}

function assertOptionalNonNegativeInteger(value: number | undefined, name: string): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative integer.`);
  }
}

function assertValidConfig(config: PostgresPoolRuntimeConfig): void {
  assertConnectionString(config.connectionString);
  assertOptionalPositiveInteger(config.max, 'max');
  assertOptionalNonNegativeInteger(
    config.idleTimeoutMillis,
    'idleTimeoutMillis'
  );
  assertOptionalNonNegativeInteger(
    config.connectionTimeoutMillis,
    'connectionTimeoutMillis'
  );
}

export function createPostgresPoolConfig(
  config: PostgresPoolRuntimeConfig
): PoolConfig {
  assertValidConfig(config);

  const poolConfig: PoolConfig = {
    connectionString: config.connectionString
  };

  if (config.ssl !== undefined) {
    poolConfig.ssl = config.ssl;
  }
  if (config.max !== undefined) {
    poolConfig.max = config.max;
  }
  if (config.idleTimeoutMillis !== undefined) {
    poolConfig.idleTimeoutMillis = config.idleTimeoutMillis;
  }
  if (config.connectionTimeoutMillis !== undefined) {
    poolConfig.connectionTimeoutMillis = config.connectionTimeoutMillis;
  }

  return poolConfig;
}
