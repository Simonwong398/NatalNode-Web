import type {
  CanonicalCommercialAttributes,
  CommercialActorClass,
  CommercialEventType,
  CommercialSourceType,
  ProviderProcessingStatus,
  ProviderReceiptFailureClass,
  ProviderVerificationStatus,
  PaidBillingInterval,
  PaidCoverageReversalReason,
  PaidCoverageState,
  PaidRelationshipEndReason,
  PaidRelationshipLifecycleState,
  PaidRenewalIntent
} from './commercial-domain.js';
import type { EntitlementProjectionRecord } from './entitlement-types.js';
import type { ReferralTimeBankSourceSnapshot } from './referral-time-bank-domain.js';
import type {
  ReferralAttributionState,
  ReferralGiveOfferEligibility,
  ReferralPublicIdentityStatus,
  ReferralRewardState
} from './referral-domain.js';

export type CommercialTimestampInput = string | Date;

export interface CommercialAuthorityRecord {
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
  readonly entitlementRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EnsureCommercialAuthorityInput {
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
}

export type EnsureCommercialAuthorityResult =
  | {
      readonly outcome: 'CREATED';
      readonly authority: CommercialAuthorityRecord;
    }
  | {
      readonly outcome: 'EXISTING';
      readonly authority: CommercialAuthorityRecord;
    };

export interface AdvanceCommercialRevisionInput {
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
  readonly expectedRevision: string;
}

/**
 * Transaction-scoped authority primitives. Locking methods require a
 * caller-owned transaction and preserve live users root -> authority order.
 */
export interface CommercialAuthorityRepository {
  ensureAndLockForUpdate(
    input: EnsureCommercialAuthorityInput
  ): Promise<EnsureCommercialAuthorityResult>;
  lockForUpdate(ownerId: string): Promise<CommercialAuthorityRecord>;
  getByOwnerId(ownerId: string): Promise<CommercialAuthorityRecord | null>;
  advanceRevisionAfterLock(
    input: AdvanceCommercialRevisionInput
  ): Promise<CommercialAuthorityRecord>;
}

export interface CommercialEventRecord {
  readonly eventId: string;
  readonly commercialAuthorityId: string;
  readonly eventType: CommercialEventType;
  readonly sourceType: CommercialSourceType;
  readonly sourceEntityId: string;
  readonly sourceNamespace: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerEventId: string | null;
  readonly providerReceiptId: string | null;
  readonly idempotencyNamespace: string;
  readonly idempotencyKey: string;
  readonly operationDigest: string;
  readonly occurredAt: string | null;
  readonly effectiveAt: string;
  readonly ingestedAt: string;
  readonly causedByEventId: string | null;
  readonly correctsEventId: string | null;
  readonly reversesEventId: string | null;
  readonly attributes: CanonicalCommercialAttributes;
  readonly attributesVersion: number;
  readonly schemaVersion: 1;
  readonly actorClass: CommercialActorClass | null;
  readonly actorReference: string | null;
}

export interface AppendCommercialEventInput {
  readonly eventId: string;
  /** Guard-only live owner identity; not duplicated into CommercialEvent. */
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly eventType: CommercialEventType;
  readonly sourceType: CommercialSourceType;
  readonly sourceEntityId: string;
  readonly sourceNamespace: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerEventId: string | null;
  readonly providerReceiptId: string | null;
  readonly idempotencyNamespace: string;
  readonly idempotencyKey: string;
  readonly operationDigest: string;
  readonly occurredAt: string | null;
  readonly effectiveAt: string;
  readonly causedByEventId: string | null;
  readonly correctsEventId: string | null;
  readonly reversesEventId: string | null;
  readonly attributes: unknown;
  readonly attributesVersion: number;
  readonly schemaVersion: 1;
  readonly actorClass: CommercialActorClass | null;
  readonly actorReference: string | null;
}

export type AppendCommercialEventResult =
  | {
      readonly outcome: 'APPENDED';
      readonly event: CommercialEventRecord;
    }
  | {
      readonly outcome: 'DUPLICATE';
      readonly event: CommercialEventRecord;
    };

/** Append-only journal surface; deliberately has no update/delete operation. */
export interface CommercialEventRepository {
  appendIdempotent(
    input: AppendCommercialEventInput
  ): Promise<AppendCommercialEventResult>;
  getByIdempotencyIdentity(
    idempotencyNamespace: string,
    idempotencyKey: string
  ): Promise<CommercialEventRecord | null>;
}

export interface ProviderIngestionReceiptRecord {
  readonly providerReceiptId: string;
  readonly providerNamespace: string;
  readonly providerContext: string;
  readonly providerEventId: string;
  readonly verificationStatus: ProviderVerificationStatus;
  readonly processingStatus: ProviderProcessingStatus;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly attemptCount: number;
  readonly normalizedEventType: CommercialEventType | null;
  readonly operationDigest: string;
  readonly failureClass: ProviderReceiptFailureClass | null;
  readonly processedAt: string | null;
  readonly reconciledAt: string | null;
}

export interface ClaimProviderIngestionReceiptInput {
  readonly providerReceiptId: string;
  readonly providerNamespace: string;
  readonly providerContext: string;
  readonly providerEventId: string;
  readonly operationDigest: string;
  readonly verificationStatus: ProviderVerificationStatus;
  readonly failureClass: ProviderReceiptFailureClass | null;
}

export type ClaimProviderIngestionReceiptResult =
  | {
      readonly outcome: 'CLAIMED';
      readonly receipt: ProviderIngestionReceiptRecord;
    }
  | {
      readonly outcome: 'DUPLICATE';
      readonly receipt: ProviderIngestionReceiptRecord;
    };

export interface TransitionProviderIngestionReceiptInput {
  readonly providerReceiptId: string;
  readonly expectedVerificationStatus: ProviderVerificationStatus;
  readonly expectedProcessingStatus: ProviderProcessingStatus;
  readonly nextVerificationStatus: ProviderVerificationStatus;
  readonly nextProcessingStatus: ProviderProcessingStatus;
  readonly normalizedEventType: CommercialEventType | null;
  readonly failureClass: ProviderReceiptFailureClass | null;
}

/**
 * Transaction-scoped provider receipt surface. Claiming precedes owner locks;
 * processing transitions compose with event append in the caller transaction.
 */
export interface ProviderIngestionReceiptRepository {
  claimIdempotent(
    input: ClaimProviderIngestionReceiptInput
  ): Promise<ClaimProviderIngestionReceiptResult>;
  transition(
    input: TransitionProviderIngestionReceiptInput
  ): Promise<ProviderIngestionReceiptRecord>;
  getByProviderIdentity(
    providerNamespace: string,
    providerContext: string,
    providerEventId: string
  ): Promise<ProviderIngestionReceiptRecord | null>;
}

export interface PaidBillingRelationshipRecord {
  readonly paidRelationshipId: string;
  readonly commercialAuthorityId: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerRelationshipRef: string | null;
  readonly billingInterval: PaidBillingInterval;
  readonly lifecycleState: PaidRelationshipLifecycleState;
  readonly renewalIntent: PaidRenewalIntent;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly graceStartedAt: string | null;
  readonly graceUntil: string | null;
  readonly failedRenewalIdentity: string | null;
  readonly endedAt: string | null;
  readonly endReason: PaidRelationshipEndReason | null;
  readonly lastReconciledEventId: string;
  readonly sourceRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaidRelationshipOwnerScope {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly paidRelationshipId: string;
}

export interface CreatePendingPaidBillingRelationshipInput {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly paidRelationshipId: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerRelationshipRef: string | null;
  readonly billingInterval: PaidBillingInterval;
  readonly lastReconciledEventId: string;
  readonly sourceRevision: string;
}

export interface TransitionPaidBillingRelationshipInput
  extends PaidRelationshipOwnerScope {
  readonly expectedLifecycleState: PaidRelationshipLifecycleState;
  readonly expectedRenewalIntent: PaidRenewalIntent;
  readonly nextLifecycleState: PaidRelationshipLifecycleState;
  readonly nextRenewalIntent: PaidRenewalIntent;
  readonly currentPeriodStart: CommercialTimestampInput | null;
  readonly currentPeriodEnd: CommercialTimestampInput | null;
  readonly graceStartedAt: CommercialTimestampInput | null;
  readonly graceUntil: CommercialTimestampInput | null;
  readonly failedRenewalIdentity: string | null;
  readonly endedAt: CommercialTimestampInput | null;
  readonly endReason: PaidRelationshipEndReason | null;
  readonly lastReconciledEventId: string;
  readonly sourceRevision: string;
}

/** Caller-owned transaction primitives for normalized paid relationship state. */
export interface PaidBillingRelationshipRepository {
  createPending(
    input: CreatePendingPaidBillingRelationshipInput
  ): Promise<PaidBillingRelationshipRecord>;
  getById(
    paidRelationshipId: string
  ): Promise<PaidBillingRelationshipRecord | null>;
  getByAuthority(
    ownerId: string,
    commercialAuthorityId: string
  ): Promise<readonly PaidBillingRelationshipRecord[]>;
  lockForUpdate(
    input: PaidRelationshipOwnerScope
  ): Promise<PaidBillingRelationshipRecord>;
  transition(
    input: TransitionPaidBillingRelationshipInput
  ): Promise<PaidBillingRelationshipRecord>;
}

export interface PaidCoverageRecord {
  readonly paidCoverageId: string;
  readonly paidRelationshipId: string;
  readonly commercialAuthorityId: string;
  readonly purchaseNamespace: string;
  readonly purchaseIdentity: string;
  readonly billingInterval: PaidBillingInterval;
  readonly coverageStartAt: string;
  readonly scheduledCoverageEndAt: string;
  readonly effectiveCoverageEndAt: string;
  readonly coverageState: PaidCoverageState;
  readonly successEventId: string;
  readonly reversalEventId: string | null;
  readonly reversedAt: string | null;
  readonly reversalReason: PaidCoverageReversalReason | null;
  readonly sourceRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaidCoverageReversalRecord {
  readonly paidCoverageReversalId: string;
  readonly paidCoverageId: string;
  readonly paidRelationshipId: string;
  readonly commercialAuthorityId: string;
  readonly purchaseNamespace: string;
  readonly purchaseIdentity: string;
  readonly reversalEventId: string;
  readonly reversedAt: string;
  readonly reversalReason: PaidCoverageReversalReason;
  readonly effectiveCoverageEndAt: string;
  readonly sourceRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaidCoverageOwnerScope {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly paidRelationshipId: string;
  readonly paidCoverageId: string;
}

export interface CreatePaidCoverageInput {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly paidRelationshipId: string;
  readonly paidCoverageId: string;
  readonly purchaseNamespace: string;
  readonly purchaseIdentity: string;
  readonly billingInterval: PaidBillingInterval;
  readonly coverageStartAt: CommercialTimestampInput;
  readonly scheduledCoverageEndAt: CommercialTimestampInput;
  readonly effectiveCoverageEndAt: CommercialTimestampInput;
  readonly successEventId: string;
  readonly sourceRevision: string;
}

export interface CreatePendingPaidCoverageReversalInput
  extends PaidReconciliationContext {
  readonly paidCoverageReversalId: string;
  readonly paidCoverageId: string;
  readonly paidRelationshipId: string;
  readonly purchaseNamespace: string;
  readonly purchaseIdentity: string;
  readonly reversalReason: PaidCoverageReversalReason;
  readonly effectiveCoverageEndAt: CommercialTimestampInput;
  readonly sourceRevision: string;
}

export interface ApplyPaidCoverageReversalInput
  extends PaidCoverageOwnerScope {
  readonly expectedCoverageState: PaidCoverageState;
  readonly reversalEventId: string;
  readonly reversedAt: CommercialTimestampInput;
  readonly reversalReason: PaidCoverageReversalReason;
  readonly effectiveCoverageEndAt: CommercialTimestampInput;
  readonly sourceRevision: string;
}

export interface EndPaidCoverageInput extends PaidCoverageOwnerScope {
  readonly expectedCoverageState: PaidCoverageState;
  readonly endedAt: CommercialTimestampInput;
  readonly effectiveCoverageEndAt: CommercialTimestampInput;
  readonly sourceRevision: string;
  readonly eventId: string;
}

/** Caller-owned transaction primitives for attributable paid intervals. */
export interface PaidCoverageRepository {
  createAttributable(
    input: CreatePaidCoverageInput
  ): Promise<PaidCoverageRecord>;
  getById(paidCoverageId: string): Promise<PaidCoverageRecord | null>;
  getByPurchaseIdentity(
    commercialAuthorityId: string,
    purchaseNamespace: string,
    purchaseIdentity: string
  ): Promise<PaidCoverageRecord | null>;
  getPendingReversal(
    commercialAuthorityId: string,
    purchaseNamespace: string,
    purchaseIdentity: string
  ): Promise<PaidCoverageReversalRecord | null>;
  recordPendingReversal(
    input: CreatePendingPaidCoverageReversalInput
  ): Promise<PaidCoverageReversalRecord>;
  listByRelationship(
    ownerId: string,
    commercialAuthorityId: string,
    paidRelationshipId: string
  ): Promise<readonly PaidCoverageRecord[]>;
  lockForUpdate(input: PaidCoverageOwnerScope): Promise<PaidCoverageRecord>;
  applyReversal(
    input: ApplyPaidCoverageReversalInput
  ): Promise<PaidCoverageRecord>;
  end(input: EndPaidCoverageInput): Promise<PaidCoverageRecord>;
}

export interface ReferralPublicIdentityRecord {
  readonly referralPublicIdentityId: string;
  readonly commercialAuthorityId: string;
  readonly publicValue: string;
  readonly status: ReferralPublicIdentityStatus;
  readonly createdAt: string;
  readonly revokedAt: string | null;
  readonly supersedesIdentityId: string | null;
}

export interface EnsureReferralPublicIdentityInput {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
}

export type EnsureReferralPublicIdentityResult =
  | {
      readonly outcome: 'CREATED';
      readonly identity: ReferralPublicIdentityRecord;
    }
  | {
      readonly outcome: 'EXISTING';
      readonly identity: ReferralPublicIdentityRecord;
    };

/** Transaction-scoped, non-public referral identity persistence. */
export interface ReferralPublicIdentityRepository {
  getById(
    referralPublicIdentityId: string
  ): Promise<ReferralPublicIdentityRecord | null>;
  getByAuthority(
    commercialAuthorityId: string
  ): Promise<ReferralPublicIdentityRecord | null>;
  getByPublicValue(
    publicValue: string
  ): Promise<ReferralPublicIdentityRecord | null>;
  ensure(
    input: EnsureReferralPublicIdentityInput
  ): Promise<EnsureReferralPublicIdentityResult>;
}

export interface ReferralAttributionRecord {
  readonly referralAttributionId: string;
  readonly referralPublicIdentityId: string;
  readonly referrerAuthorityId: string;
  readonly referredAuthorityId: string;
  readonly state: ReferralAttributionState;
  readonly attributedAt: string;
  readonly lockedAt: string | null;
  readonly qualifyingPaidCoverageId: string | null;
  readonly invalidationReason: string | null;
  readonly invalidatedAt: string | null;
  readonly campaignReference: string | null;
  readonly lastEventId: string;
  readonly sourceRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EstablishReferralAttributionInput {
  readonly referrerOwnerId: string;
  readonly referredOwnerId: string;
  readonly referralAttributionId: string;
  readonly referralPublicIdentityId: string;
  readonly referrerAuthorityId: string;
  readonly referredAuthorityId: string;
  readonly attributedAt: CommercialTimestampInput;
  readonly campaignReference: string | null;
  readonly lastEventId: string;
  readonly sourceRevision: string;
}

export interface AttachReferralQualifyingPurchaseInput {
  readonly referredOwnerId: string;
  readonly referredAuthorityId: string;
  readonly referralAttributionId: string;
  readonly qualifyingPaidCoverageId: string;
  readonly lockedAt: CommercialTimestampInput;
  readonly lastEventId: string;
  readonly sourceRevision: string;
}

/** Account-level first-valid-attribution persistence surface. */
export interface ReferralAttributionRepository {
  getById(referralAttributionId: string): Promise<ReferralAttributionRecord | null>;
  getByReferredAuthority(
    referredAuthorityId: string
  ): Promise<ReferralAttributionRecord | null>;
  getByQualifyingPaidCoverage(
    qualifyingPaidCoverageId: string
  ): Promise<ReferralAttributionRecord | null>;
  lockForUpdate(
    referralAttributionId: string
  ): Promise<ReferralAttributionRecord | null>;
  lockByReferredAuthority(
    referredAuthorityId: string
  ): Promise<ReferralAttributionRecord | null>;
  establish(
    input: EstablishReferralAttributionInput
  ): Promise<ReferralAttributionRecord>;
  attachQualifyingPurchase(
    input: AttachReferralQualifyingPurchaseInput
  ): Promise<ReferralAttributionRecord>;
}

export interface ReferralRewardRecord {
  readonly referralRewardId: string;
  readonly referrerAuthorityId: string;
  readonly referralAttributionId: string;
  readonly qualifyingPaidCoverageId: string;
  readonly state: ReferralRewardState;
  readonly qualifyingPaymentAt: string;
  readonly admittedAt: string;
  readonly maturesAt: string;
  readonly earnedAt: string | null;
  readonly appliedAt: string | null;
  readonly revokedAt: string | null;
  readonly grantedDurationUs: string;
  readonly earnedDurationUs: string;
  readonly appliedDurationUs: string;
  readonly consumedDurationUs: string;
  readonly revokedDurationUs: string;
  readonly activeConsumptionStartedAt: string | null;
  readonly remainingUnconsumedDurationUs: string;
  readonly availableDurationUs: string;
  readonly revocationReason: string | null;
  readonly reversalEventId: string | null;
  readonly pendingEventId: string;
  readonly maturationEventId: string | null;
  readonly applicationEventId: string | null;
  readonly sourceRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReferralRewardMaturationCandidate
  extends ReferralRewardRecord {
  readonly referredOwnerId: string;
  readonly referredAuthorityId: string;
}

export interface CreatePendingReferralRewardInput {
  readonly referrerOwnerId: string;
  readonly referrerAuthorityId: string;
  readonly referralRewardId: string;
  readonly referralAttributionId: string;
  readonly qualifyingPaidCoverageId: string;
  readonly qualifyingPaymentAt: CommercialTimestampInput;
  readonly admittedAt: CommercialTimestampInput;
  readonly pendingEventId: string;
  readonly sourceRevision: string;
}

export interface MatureReferralRewardInput {
  readonly referrerOwnerId: string;
  readonly referrerAuthorityId: string;
  readonly referralRewardId: string;
  readonly maturationEventId: string;
  readonly earnedAt: CommercialTimestampInput;
  readonly sourceRevision: string;
}

export interface RevokeReferralRewardInput {
  readonly referrerOwnerId: string;
  readonly referrerAuthorityId: string;
  readonly referralRewardId: string;
  readonly revokedAt: CommercialTimestampInput;
  readonly revocationReason: string;
  readonly reversalEventId: string | null;
  readonly sourceRevision: string;
}

/** Transaction-scoped Referral reward source persistence. */
export interface ReferralRewardRepository {
  getById(referralRewardId: string): Promise<ReferralRewardRecord | null>;
  getByAttribution(
    referralAttributionId: string
  ): Promise<ReferralRewardRecord | null>;
  getByQualifyingPaidCoverage(
    qualifyingPaidCoverageId: string
  ): Promise<ReferralRewardRecord | null>;
  listByOwner(
    ownerId: string,
    referrerAuthorityId: string
  ): Promise<readonly ReferralRewardRecord[]>;
  listMaturationCandidates(
    ownerId: string,
    limit: number
  ): Promise<readonly ReferralRewardMaturationCandidate[]>;
  lockForUpdate(
    referralRewardId: string,
    referrerAuthorityId: string
  ): Promise<ReferralRewardRecord | null>;
  lockByIds(
    referralRewardIds: readonly string[],
    referrerAuthorityId: string
  ): Promise<readonly ReferralRewardRecord[]>;
  lockCapWindow(
    referrerAuthorityId: string,
    admittedAt: CommercialTimestampInput
  ): Promise<readonly ReferralRewardRecord[]>;
  createPending(
    input: CreatePendingReferralRewardInput
  ): Promise<ReferralRewardRecord>;
  mature(input: MatureReferralRewardInput): Promise<ReferralRewardRecord>;
  revoke(input: RevokeReferralRewardInput): Promise<ReferralRewardRecord>;
}

export interface EstablishReferralAttributionResult {
  readonly outcome: 'APPLIED' | 'DUPLICATE';
  readonly referrerAuthority: CommercialAuthorityRecord;
  readonly referredAuthority: CommercialAuthorityRecord;
  readonly attribution: ReferralAttributionRecord;
}

export interface GetReferralGiveOfferEligibilityInput {
  readonly referredOwnerId: string;
  readonly billingInterval: PaidBillingInterval;
}

export interface QualifyReferralFirstPurchaseInput {
  readonly referrerOwnerId: string;
  readonly referredOwnerId: string;
  readonly referralAttributionId: string;
  readonly qualifyingPaidCoverageId: string;
}

export type QualifyReferralFirstPurchaseOutcome =
  | 'APPLIED'
  | 'DUPLICATE'
  | 'CAP_REJECTED';

export interface QualifyReferralFirstPurchaseResult {
  readonly outcome: QualifyReferralFirstPurchaseOutcome;
  readonly referrerAuthority: CommercialAuthorityRecord;
  readonly referredAuthority: CommercialAuthorityRecord;
  readonly attribution: ReferralAttributionRecord;
  readonly reward: ReferralRewardRecord | null;
}

export interface MatureEligibleReferralRewardsInput {
  readonly ownerId: string;
  readonly limit?: number;
}

export interface MatureEligibleReferralRewardsResult {
  readonly outcome: 'APPLIED' | 'NO_OP';
  readonly authority: CommercialAuthorityRecord;
  readonly rewards: readonly ReferralRewardRecord[];
}

export interface RevokeReferralRewardForPaidReversalInput {
  readonly referrerOwnerId: string;
  readonly referralRewardId: string;
}

export interface RevokeReferralRewardResult {
  readonly outcome: 'APPLIED' | 'DUPLICATE';
  readonly authority: CommercialAuthorityRecord;
  readonly reward: ReferralRewardRecord;
}

/** Bounded D4A orchestration; it does not apply Referral time-bank access. */
export interface ReferralReconciliationService {
  establishAttribution(
    input: Omit<EstablishReferralAttributionInput, 'referrerAuthorityId' | 'referredAuthorityId' | 'attributedAt' | 'lastEventId' | 'sourceRevision'>
  ): Promise<EstablishReferralAttributionResult>;
  getGiveOfferEligibility(
    input: GetReferralGiveOfferEligibilityInput
  ): Promise<ReferralGiveOfferEligibility>;
  qualifyFirstPurchase(
    input: QualifyReferralFirstPurchaseInput
  ): Promise<QualifyReferralFirstPurchaseResult>;
  matureEligibleRewards(
    input: MatureEligibleReferralRewardsInput
  ): Promise<MatureEligibleReferralRewardsResult>;
  revokeForPaidReversal(
    input: RevokeReferralRewardForPaidReversalInput
  ): Promise<RevokeReferralRewardResult>;
}

export interface ReferralTimeBankRevocationInput {
  readonly referralRewardId: string;
  readonly revokedAt: CommercialTimestampInput;
  readonly revocationReason: string;
  readonly reversalEventId: string;
}

export interface ReconcileReferralTimeBankInput {
  readonly ownerId: string;
  readonly authority: CommercialAuthorityRecord;
  readonly asOf: CommercialTimestampInput;
  readonly revocation?: ReferralTimeBankRevocationInput;
}

export interface ReconcileReferralTimeBankResult {
  readonly outcome: 'APPLIED' | 'NO_OP';
  readonly authority: CommercialAuthorityRecord;
  readonly rewards: readonly ReferralRewardRecord[];
  readonly source: ReferralTimeBankSourceSnapshot;
}

/** Caller-transaction-owned, authority-locked Referral settlement surface. */
export interface ReferralTimeBankReconciliationService {
  reconcileAfterAuthorityLock(
    input: ReconcileReferralTimeBankInput
  ): Promise<ReconcileReferralTimeBankResult>;
}

export interface PaidReconciliationContext {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly eventId: string;
}

export interface OpenPaidRelationshipInput extends PaidReconciliationContext {
  readonly paidRelationshipId: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerRelationshipRef: string | null;
  readonly billingInterval: PaidBillingInterval;
}

export interface PaidCoverageOperationInput extends PaidReconciliationContext {
  readonly paidRelationshipId: string;
  readonly paidCoverageId: string;
  readonly purchaseNamespace: string;
  readonly purchaseIdentity: string;
  readonly billingInterval: PaidBillingInterval;
  readonly coverageStartAt: CommercialTimestampInput;
  readonly scheduledCoverageEndAt: CommercialTimestampInput;
}

export interface PaidRelationshipOperationInput
  extends PaidReconciliationContext {
  readonly paidRelationshipId: string;
}

export interface EnterPaidRecoveryInput extends PaidRelationshipOperationInput {
  readonly failedRenewalIdentity: string;
}

export interface EndPaidRelationshipInput
  extends PaidRelationshipOperationInput {
  readonly endReason: PaidRelationshipEndReason;
}

export interface EndPaidCoverageOperationInput
  extends PaidReconciliationContext {
  readonly paidRelationshipId: string;
  readonly paidCoverageId: string;
  readonly effectiveCoverageEndAt: CommercialTimestampInput;
}

export interface ReversePaidCoverageInput
  extends PaidReconciliationContext {
  readonly paidRelationshipId: string;
  readonly paidCoverageId: string;
  readonly purchaseNamespace: string;
  readonly purchaseIdentity: string;
  readonly effectiveCoverageEndAt: CommercialTimestampInput;
}

export type PaidReconciliationOutcome = 'APPLIED' | 'DUPLICATE' | 'NO_OP';

export interface PaidReconciliationResult {
  readonly outcome: PaidReconciliationOutcome;
  readonly authority: CommercialAuthorityRecord;
  readonly relationship: PaidBillingRelationshipRecord | null;
  readonly coverage: PaidCoverageRecord | null;
}

/**
 * Bounded owner-scoped paid reconciliation surface. Every method uses the
 * caller's transaction and advances the authority revision at most once.
 */
export interface PaidReconciliationPrimitives {
  openFirstPaidRelationship(
    input: OpenPaidRelationshipInput
  ): Promise<PaidReconciliationResult>;
  recordSuccessfulFirstPurchase(
    input: PaidCoverageOperationInput
  ): Promise<PaidReconciliationResult>;
  recordFailedFirstPurchase(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult>;
  scheduleCancellation(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult>;
  restoreRenewal(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult>;
  recordSuccessfulRenewal(
    input: PaidCoverageOperationInput
  ): Promise<PaidReconciliationResult>;
  enterRenewalRecovery(
    input: EnterPaidRecoveryInput
  ): Promise<PaidReconciliationResult>;
  recoverFromRenewalRecovery(
    input: PaidCoverageOperationInput
  ): Promise<PaidReconciliationResult>;
  expireRenewalRecovery(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult>;
  endPaidRelationship(
    input: EndPaidRelationshipInput
  ): Promise<PaidReconciliationResult>;
  endPaidCoverage(
    input: EndPaidCoverageOperationInput
  ): Promise<PaidReconciliationResult>;
  applyRefund(
    input: ReversePaidCoverageInput
  ): Promise<PaidReconciliationResult>;
  applyChargeback(
    input: ReversePaidCoverageInput
  ): Promise<PaidReconciliationResult>;
}

export interface UpsertEntitlementProjectionInput {
  /** Guard-only live owner identity; not duplicated into the projection row. */
  readonly ownerId: string;
  readonly projection: EntitlementProjectionRecord;
}

/** Transaction-scoped, revision-guarded derived entitlement read model. */
export interface EntitlementProjectionRepository {
  getByAuthority(
    commercialAuthorityId: string
  ): Promise<EntitlementProjectionRecord | null>;
  getByOwner(ownerId: string): Promise<EntitlementProjectionRecord | null>;
  upsertAtRevision(
    input: UpsertEntitlementProjectionInput
  ): Promise<EntitlementProjectionRecord>;
}

export interface CommercialPersistenceRepositories {
  readonly authorities: CommercialAuthorityRepository;
  readonly events: CommercialEventRepository;
  readonly providerReceipts: ProviderIngestionReceiptRepository;
  readonly paidBillingRelationships: PaidBillingRelationshipRepository;
  readonly paidCoverages: PaidCoverageRepository;
  readonly paidReconciliation: PaidReconciliationPrimitives;
  readonly entitlementProjections: EntitlementProjectionRepository;
  readonly referralPublicIdentities: ReferralPublicIdentityRepository;
  readonly referralAttributions: ReferralAttributionRepository;
  readonly referralRewards: ReferralRewardRepository;
  readonly referralReconciliation: ReferralReconciliationService;
  readonly referralTimeBank: ReferralTimeBankReconciliationService;
}
