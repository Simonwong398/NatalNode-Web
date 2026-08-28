import { Pool } from 'pg';
import type { SqlExecutor } from '../../db/index.js';
import {
  createPostgresPoolConfig,
  type PostgresPoolRuntimeConfig
} from './postgres-pool-config.js';
import { PostgresSqlExecutor } from './postgres-sql-executor.js';
import type {
  AccountErasureRepository,
  EmailMagicLinkAuthLifecycle
} from '../../persistence/index.js';
import { PostgresAccountErasureRepository } from '../../persistence/postgres/postgres-account-erasure-repository.js';
import { PostgresEmailMagicLinkAuthLifecycle } from '../../persistence/postgres/postgres-email-magic-link-auth-lifecycle.js';

export type { PostgresPoolRuntimeConfig } from './postgres-pool-config.js';

export interface PostgresPoolRuntime {
  readonly sqlExecutor: SqlExecutor;
  readonly accountErasure: AccountErasureRepository;
  readonly emailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle;
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
    accountErasure: new PostgresAccountErasureRepository(pool),
    emailMagicLinkAuthLifecycle: new PostgresEmailMagicLinkAuthLifecycle(pool),
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
