import { Pool } from 'pg';
import type { SqlExecutor, TransactionRunner } from '../../db/index.js';
import {
  createPostgresPoolConfig,
  type PostgresPoolRuntimeConfig
} from './postgres-pool-config.js';
import { PostgresSqlExecutor } from './postgres-sql-executor.js';
import { PostgresTransactionRunner } from './postgres-transaction-runner.js';
import type {
  AccountDataExportRepository,
  AccountErasureRepository,
  AuthLifecycleCleanupRepository,
  EmailMagicLinkAuthLifecycle,
  GoogleAuthAccountSessionLifecycle
} from '../../persistence/index.js';
import { PostgresAccountDataExportRepository } from '../../persistence/postgres/postgres-account-data-export-repository.js';
import { PostgresAccountErasureRepository } from '../../persistence/postgres/postgres-account-erasure-repository.js';
import { PostgresAuthLifecycleCleanupRepository } from '../../persistence/postgres/postgres-auth-lifecycle-cleanup-repository.js';
import { PostgresEmailMagicLinkAuthLifecycle } from '../../persistence/postgres/postgres-email-magic-link-auth-lifecycle.js';
import { PostgresGoogleAuthAccountSessionLifecycle } from '../../persistence/postgres/postgres-google-auth-account-session-lifecycle.js';

export type { PostgresPoolRuntimeConfig } from './postgres-pool-config.js';

const ACCOUNT_EXPORT_MINIMUM_POOL_MAX = 4;
const POSTGRES_DEFAULT_POOL_MAX = 10;

function assertAccountExportPoolCapacity(
  config: PostgresPoolRuntimeConfig
): void {
  const maximum = config.max ?? POSTGRES_DEFAULT_POOL_MAX;

  if (!Number.isSafeInteger(maximum) || maximum < ACCOUNT_EXPORT_MINIMUM_POOL_MAX) {
    throw new Error(
      'Postgres pool max must be at least four for account export capacity.'
    );
  }
}

export interface PostgresPoolRuntime {
  readonly sqlExecutor: SqlExecutor;
  readonly transactionRunner: TransactionRunner;
  readonly accountDataExport: AccountDataExportRepository;
  readonly connectionTimeoutMillis?: number;
  readonly accountErasure: AccountErasureRepository;
  readonly authLifecycleCleanupRepository: AuthLifecycleCleanupRepository;
  readonly emailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle;
  readonly googleAuthAccountSessionLifecycle: GoogleAuthAccountSessionLifecycle;
  close(): Promise<void>;
}

export function createPostgresPoolRuntime(
  config: PostgresPoolRuntimeConfig
): PostgresPoolRuntime {
  assertAccountExportPoolCapacity(config);
  const pool = new Pool(createPostgresPoolConfig(config));
  const sqlExecutor = new PostgresSqlExecutor(pool);
  const transactionRunner = new PostgresTransactionRunner(pool);
  let closePromise: Promise<void> | undefined;

  return {
    sqlExecutor,
    transactionRunner,
    accountDataExport: new PostgresAccountDataExportRepository(pool),
    connectionTimeoutMillis: config.connectionTimeoutMillis,
    accountErasure: new PostgresAccountErasureRepository(pool),
    authLifecycleCleanupRepository: new PostgresAuthLifecycleCleanupRepository(pool),
    emailMagicLinkAuthLifecycle: new PostgresEmailMagicLinkAuthLifecycle(pool),
    googleAuthAccountSessionLifecycle:
      new PostgresGoogleAuthAccountSessionLifecycle(pool),
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
