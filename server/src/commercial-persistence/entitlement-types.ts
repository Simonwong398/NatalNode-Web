export const ENTITLEMENT_SOURCE_CLASSES = [
  'ADMIN_GRANT',
  'PAID',
  'PROMOTION',
  'REFERRAL',
  'SUPPORT_GRANT'
] as const;

export type EntitlementSourceClass = (typeof ENTITLEMENT_SOURCE_CLASSES)[number];

export const ENTITLEMENT_PROJECTION_STATUSES = [
  'CURRENT',
  'STALE',
  'INDETERMINATE'
] as const;

export type EntitlementProjectionStatus =
  (typeof ENTITLEMENT_PROJECTION_STATUSES)[number];

export const ENTITLEMENT_DETERMINATIONS = [
  'DETERMINATE',
  'INDETERMINATE'
] as const;

export type EntitlementDetermination =
  (typeof ENTITLEMENT_DETERMINATIONS)[number];

export const ENTITLEMENT_TIERS = ['FREE', 'PRO'] as const;

export type EntitlementTier = (typeof ENTITLEMENT_TIERS)[number];

export const ENTITLEMENT_VAULT_CAPACITY_CLASSES = [
  'FREE_LIMIT_3',
  'PRO_UNLIMITED'
] as const;

export type EntitlementVaultCapacityClass =
  (typeof ENTITLEMENT_VAULT_CAPACITY_CLASSES)[number];

export const ENTITLEMENT_ALERT_ELIGIBILITY_CLASSES = [
  'ELIGIBLE',
  'INELIGIBLE'
] as const;

export type EntitlementAlertEligibilityClass =
  (typeof ENTITLEMENT_ALERT_ELIGIBILITY_CLASSES)[number];

export const ENTITLEMENT_CAPABILITIES = [
  'VAULT_UNLIMITED',
  'PERSONAL_TRANSITS',
  'ASTROLOGY_ALERTS',
  'ADVANCED_INTERPRETATION',
  'ADVANCED_EXPORT',
  'ADVANCED_WORKSPACE',
  'AD_FREE'
] as const;

export type EntitlementCapability = (typeof ENTITLEMENT_CAPABILITIES)[number];

export const ENTITLEMENT_CAPABILITY_DECISIONS = [
  'ALLOWED',
  'DENIED',
  'INDETERMINATE'
] as const;

export type EntitlementCapabilityDecision =
  (typeof ENTITLEMENT_CAPABILITY_DECISIONS)[number];

export const ENTITLEMENT_INDETERMINATE_REASONS = [
  'INVALID_INPUT',
  'INVALID_SOURCE_STATE',
  'SOURCE_SCOPE_MISMATCH',
  'PROJECTION_INTEGRITY',
  'PERSISTENCE_UNAVAILABLE',
  'REVISION_CONFLICT',
  'UNSUPPORTED_VERSION'
] as const;

export type EntitlementIndeterminateReason =
  (typeof ENTITLEMENT_INDETERMINATE_REASONS)[number];

export const ENTITLEMENT_PROJECTION_SCHEMA_VERSION = 1 as const;
export const ENTITLEMENT_EVALUATOR_POLICY_VERSION =
  'D4B_PAID_REFERRAL_V1' as const;

/** The stable, server-only entitlement contract consumed by product domains. */
export interface EffectiveEntitlementDeterminate {
  readonly determination: 'DETERMINATE';
  readonly tier: EntitlementTier;
  readonly effectivePro: boolean;
  readonly entitlementRevision: string;
  readonly evaluatedAt: string;
  readonly effectiveFrom: string | null;
  readonly effectiveUntil: string | null;
  readonly currentSourceClass: EntitlementSourceClass | null;
  readonly currentSourceClasses: readonly EntitlementSourceClass[];
  readonly adFree: boolean;
  readonly vaultCapacityClass: EntitlementVaultCapacityClass;
  readonly astrologyAlertsEligible: boolean;
}

export interface EffectiveEntitlementIndeterminate {
  readonly determination: 'INDETERMINATE';
  readonly entitlementRevision: string | null;
  readonly retryable: boolean;
  readonly reasonClass: EntitlementIndeterminateReason;
}

export type EffectiveEntitlementResult =
  | EffectiveEntitlementDeterminate
  | EffectiveEntitlementIndeterminate;

/** Additional derived boundaries kept for projection materialization only. */
export interface DeterminateEntitlementEvaluation
  extends EffectiveEntitlementDeterminate {
  readonly commercialAuthorityId: string;
  readonly currentSourceEntityId: string | null;
  readonly paidCoverageEndAt: string | null;
  readonly graceUntil: string | null;
  readonly queuedReferralDurationUs: string | null;
  readonly currentReferralRewardId: string | null;
  readonly transitionToFreeAt: string | null;
  readonly nextEvaluationAt: string | null;
}

export type EntitlementEvaluationResult =
  | DeterminateEntitlementEvaluation
  | EffectiveEntitlementIndeterminate;

/** Durable derived state. It never becomes commercial source authority. */
export interface EntitlementProjectionRecord {
  readonly commercialAuthorityId: string;
  readonly sourceRevision: string;
  readonly projectionSchemaVersion: number;
  readonly evaluatorPolicyVersion: string;
  readonly projectionStatus: EntitlementProjectionStatus;
  readonly tier: EntitlementTier | null;
  readonly effectivePro: boolean | null;
  readonly effectiveFrom: string | null;
  readonly effectiveUntil: string | null;
  readonly currentSourceClasses: readonly EntitlementSourceClass[];
  readonly currentSourceClass: EntitlementSourceClass | null;
  readonly currentSourceEntityId: string | null;
  readonly paidCoverageEndAt: string | null;
  readonly graceUntil: string | null;
  readonly queuedReferralDurationUs: string | null;
  readonly currentReferralRewardId: string | null;
  readonly transitionToFreeAt: string | null;
  readonly adFree: boolean | null;
  readonly vaultCapacityClass: EntitlementVaultCapacityClass | null;
  readonly astrologyAlertsEligibilityClass:
    | EntitlementAlertEligibilityClass
    | null;
  readonly nextEvaluationAt: string | null;
  readonly computedAt: string;
}
