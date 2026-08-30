import type { SqlExecutor } from '../../db/index.js';
import type { CommercialPersistenceRepositories } from '../repositories.js';
import { PostgresCommercialAuthorityRepository } from './postgres-commercial-authority-repository.js';
import { PostgresCommercialEventRepository } from './postgres-commercial-event-repository.js';
import { PostgresProviderIngestionReceiptRepository } from './postgres-provider-ingestion-receipt-repository.js';

/**
 * Creates repositories over one executor. For reconciliation, pass a
 * PostgresClientSqlExecutor backed by the caller's already-started transaction.
 */
export function createPostgresCommercialPersistence(
  executor: SqlExecutor
): CommercialPersistenceRepositories {
  return Object.freeze({
    authorities: new PostgresCommercialAuthorityRepository(executor),
    events: new PostgresCommercialEventRepository(executor),
    providerReceipts: new PostgresProviderIngestionReceiptRepository(executor)
  });
}
