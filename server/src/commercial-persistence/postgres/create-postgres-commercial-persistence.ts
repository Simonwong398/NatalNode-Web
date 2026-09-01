import type { SqlExecutor } from '../../db/index.js';
import type { CommercialPersistenceRepositories } from '../repositories.js';
import { PostgresCommercialAuthorityRepository } from './postgres-commercial-authority-repository.js';
import { PostgresCommercialEventRepository } from './postgres-commercial-event-repository.js';
import { PostgresPaidBillingRelationshipRepository } from './postgres-paid-billing-relationship-repository.js';
import { PostgresPaidCoverageRepository } from './postgres-paid-coverage-repository.js';
import { PostgresPaidReconciliationPrimitives } from './postgres-paid-reconciliation-primitives.js';
import { PostgresProviderIngestionReceiptRepository } from './postgres-provider-ingestion-receipt-repository.js';
import { PostgresEntitlementProjectionRepository } from './postgres-entitlement-projection-repository.js';
import { PostgresReferralAttributionRepository } from './postgres-referral-attribution-repository.js';
import { PostgresReferralPublicIdentityRepository } from './postgres-referral-public-identity-repository.js';
import { PostgresReferralReconciliationPrimitives } from './postgres-referral-reconciliation-primitives.js';
import { PostgresReferralRewardRepository } from './postgres-referral-reward-repository.js';
import { PostgresReferralTimeBankRepository } from './postgres-referral-time-bank-repository.js';
import { PostgresReferralTimeBankReconciliation } from './postgres-referral-time-bank-reconciliation.js';
import { PostgresCommercialGrantCreditRepository } from './postgres-commercial-grant-credit-repository.js';

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
  const events = new PostgresCommercialEventRepository(executor);
  const grantCredits = new PostgresCommercialGrantCreditRepository(executor);
  const referralPublicIdentities =
    new PostgresReferralPublicIdentityRepository(executor);
  const referralAttributions = new PostgresReferralAttributionRepository(
    executor
  );
  const referralRewards = new PostgresReferralRewardRepository(executor);
  const referralTimeBank = new PostgresReferralTimeBankReconciliation(
    executor,
    authorities,
    events,
    new PostgresReferralTimeBankRepository(executor)
  );
  return Object.freeze({
    authorities,
    events,
    providerReceipts: new PostgresProviderIngestionReceiptRepository(executor),
    paidBillingRelationships,
    paidCoverages,
    grantCredits,
    paidReconciliation: new PostgresPaidReconciliationPrimitives(
      executor,
      authorities,
      paidBillingRelationships,
      paidCoverages
    ),
    entitlementProjections: new PostgresEntitlementProjectionRepository(
      executor
    ),
    referralPublicIdentities,
    referralAttributions,
    referralRewards,
    referralReconciliation: new PostgresReferralReconciliationPrimitives(
      executor,
      authorities,
      events,
      referralPublicIdentities,
      referralAttributions,
      referralRewards,
      referralTimeBank
    ),
    referralTimeBank
  });
}
