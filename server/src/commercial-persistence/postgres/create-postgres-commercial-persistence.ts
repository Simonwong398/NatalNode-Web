import type { SqlExecutor } from '../../db/index.js';
import type { CommercialPersistenceRepositories } from '../repositories.js';
import { PostgresCommercialAuthorityRepository } from './postgres-commercial-authority-repository.js';
import { PostgresCommercialEventRepository } from './postgres-commercial-event-repository.js';
import { PostgresPaidBillingRelationshipRepository } from './postgres-paid-billing-relationship-repository.js';
import { PostgresPaidCoverageRepository } from './postgres-paid-coverage-repository.js';
import { PostgresPaidReconciliationPrimitives } from './postgres-paid-reconciliation-primitives.js';
import { PostgresProviderIngestionReceiptRepository } from './postgres-provider-ingestion-receipt-repository.js';

/**
 * Creates repositories over one executor. For reconciliation, pass a
 * PostgresClientSqlExecutor backed by the caller's already-started transaction.
 */
export function createPostgresCommercialPersistence(
  executor: SqlExecutor
): CommercialPersistenceRepositories {
  const authorities = new PostgresCommercialAuthorityRepository(executor);
  const paidBillingRelationships =
    new PostgresPaidBillingRelationshipRepository(executor);
  const paidCoverages = new PostgresPaidCoverageRepository(executor);
  return Object.freeze({
    authorities,
    events: new PostgresCommercialEventRepository(executor),
    providerReceipts: new PostgresProviderIngestionReceiptRepository(executor),
    paidBillingRelationships,
    paidCoverages,
    paidReconciliation: new PostgresPaidReconciliationPrimitives(
      executor,
      authorities,
      paidBillingRelationships,
      paidCoverages
    )
  });
}
