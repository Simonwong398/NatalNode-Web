import { Pool } from 'pg';
import type { SqlExecutor } from '../../db/index.js';
import {
  createPostgresPoolConfig,
  type PostgresPoolRuntimeConfig
} from './postgres-pool-config.js';
import { PostgresSqlExecutor } from './postgres-sql-executor.js';

export type { PostgresPoolRuntimeConfig } from './postgres-pool-config.js';

export interface PostgresPoolRuntime {
  readonly sqlExecutor: SqlExecutor;
  close(): Promise<void>;
}

export function createPostgresPoolRuntime(
  config: PostgresPoolRuntimeConfig
): PostgresPoolRuntime {
  const pool = new Pool(createPostgresPoolConfig(config));
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
