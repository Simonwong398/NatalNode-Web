import { Pool, type PoolConfig } from 'pg';
import type { SqlExecutor } from '../../db/index.js';
import { PostgresSqlExecutor } from './postgres-sql-executor.js';

export interface PostgresPoolRuntimeConfig {
  readonly connectionString: string;
  readonly ssl?: PoolConfig['ssl'];
  readonly max?: number;
  readonly idleTimeoutMillis?: number;
  readonly connectionTimeoutMillis?: number;
}

export interface PostgresPoolRuntime {
  readonly sqlExecutor: SqlExecutor;
  close(): Promise<void>;
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

function toPoolConfig(config: PostgresPoolRuntimeConfig): PoolConfig {
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

export function createPostgresPoolRuntime(
  config: PostgresPoolRuntimeConfig
): PostgresPoolRuntime {
  assertValidConfig(config);

  const pool = new Pool(toPoolConfig(config));
  const sqlExecutor = new PostgresSqlExecutor(pool);
  let closePromise: Promise<void> | undefined;

  return {
    sqlExecutor,
    close(): Promise<void> {
      if (closePromise === undefined) {
        try {
          closePromise = pool.end();
        } catch (error) {
          closePromise = Promise.reject(error);
        }
      }

      return closePromise;
    }
  };
}
