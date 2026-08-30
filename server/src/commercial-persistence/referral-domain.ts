import {
  CommercialDomainValidationError,
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialTimestamp,
  assertPaidBillingInterval,
  type PaidBillingInterval
} from './commercial-domain.js';

export const REFERRAL_PUBLIC_IDENTITY_STATUSES = [
  'ACTIVE',
  'REVOKED'
] as const;

export type ReferralPublicIdentityStatus =
  (typeof REFERRAL_PUBLIC_IDENTITY_STATUSES)[number];

export const REFERRAL_ATTRIBUTION_STATES = [
  'ATTRIBUTED',
  'LOCKED',
  'INVALIDATED'
] as const;

export type ReferralAttributionState =
  (typeof REFERRAL_ATTRIBUTION_STATES)[number];

export const REFERRAL_REWARD_STATES = [
  'PENDING',
  'EARNED',
  'APPLIED',
  'REVOKED'
] as const;

export type ReferralRewardState = (typeof REFERRAL_REWARD_STATES)[number];

export const REFERRAL_GIVE_OFFER_CLASSES = [
  'FIRST_PAID_MONTH_50_PERCENT_OFF',
  'FIRST_PAID_YEAR_15_PERCENT_OFF',
  'NOT_ELIGIBLE',
  'CONSUMED'
] as const;

export type ReferralGiveOfferClass =
  (typeof REFERRAL_GIVE_OFFER_CLASSES)[number];

export const REFERRAL_GIVE_OFFER_OUTCOMES = [
  'ELIGIBLE',
  'NOT_ELIGIBLE'
] as const;

export type ReferralGiveOfferOutcome =
  (typeof REFERRAL_GIVE_OFFER_OUTCOMES)[number];

/** The frozen standard reward cap is twelve admissions in twelve UTC months. */
export const REFERRAL_REWARD_CAP = 12;
export const REFERRAL_REWARD_WINDOW_MONTHS = 12;
export const REFERRAL_REWARD_MATURATION_DAYS = 14;
export const REFERRAL_REWARD_DURATION_DAYS = 30;

/** Exact integer microseconds; this is elapsed time, not a calendar month. */
export const REFERRAL_REWARD_DURATION_US = '2592000000000';
export const REFERRAL_REWARD_MATURATION_DURATION_US = '1209600000000';

const MAX_INT64 = 9223372036854775807n;

function invalid(fieldName: string): never {
  throw new CommercialDomainValidationError(`${fieldName} is invalid.`);
}

function isFrom<const Values extends readonly string[]>(
  values: Values,
  value: unknown
): value is Values[number] {
  return typeof value === 'string' && values.includes(value);
}

export function assertReferralPublicIdentityStatus(
  value: unknown
): ReferralPublicIdentityStatus {
  return isFrom(REFERRAL_PUBLIC_IDENTITY_STATUSES, value)
    ? value
    : invalid('status');
}

export function assertReferralAttributionState(
  value: unknown
): ReferralAttributionState {
  return isFrom(REFERRAL_ATTRIBUTION_STATES, value)
    ? value
    : invalid('state');
}

export function assertReferralRewardState(
  value: unknown
): ReferralRewardState {
  return isFrom(REFERRAL_REWARD_STATES, value)
    ? value
    : invalid('state');
}

export function assertReferralGiveOfferClass(
  value: unknown
): ReferralGiveOfferClass {
  return isFrom(REFERRAL_GIVE_OFFER_CLASSES, value)
    ? value
    : invalid('offerClass');
}

export function assertReferralDurationMicroseconds(
  value: unknown,
  fieldName: string
): string {
  const normalized =
    typeof value === 'bigint'
      ? value.toString()
      : typeof value === 'number' && Number.isSafeInteger(value)
        ? value.toString()
        : value;
  if (
    typeof normalized !== 'string' ||
    !/^(?:0|[1-9][0-9]*)$/u.test(normalized)
  ) {
    return invalid(fieldName);
  }
  try {
    if (BigInt(normalized) > MAX_INT64) {
      return invalid(fieldName);
    }
  } catch {
    return invalid(fieldName);
  }
  return normalized;
}

export function assertReferralReason(
  value: unknown,
  fieldName: string
): string {
  return assertCommercialIdentifier(value, fieldName);
}

export function exactReferralMaturesAt(qualifyingPaymentAtInput: unknown): string {
  const qualifyingPaymentAt = assertCommercialTimestamp(
    qualifyingPaymentAtInput,
    'qualifyingPaymentAt'
  );
  const epochMilliseconds = Date.parse(qualifyingPaymentAt);
  const maturationMilliseconds =
    REFERRAL_REWARD_MATURATION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(epochMilliseconds + maturationMilliseconds).toISOString();
}

export interface ReferralGiveOfferEligibility {
  readonly outcome: ReferralGiveOfferOutcome;
  readonly offerClass: ReferralGiveOfferClass;
  readonly billingInterval: PaidBillingInterval;
  readonly reason:
    | 'ATTRIBUTION_AVAILABLE'
    | 'NO_ATTRIBUTION'
    | 'CONSUMED'
    | 'FIRST_PURCHASE_ALREADY_EXISTS';
}

/**
 * Provider-neutral Give-side policy. This only returns a frozen eligibility
 * class; it never calculates money or creates a provider promotion.
 */
export function getReferralGiveOfferEligibility(input: {
  readonly attributionState: ReferralAttributionState | null;
  readonly qualifyingPaidCoverageId: string | null;
  readonly hasSuccessfulFirstPurchase: boolean;
  readonly billingInterval: PaidBillingInterval;
}): ReferralGiveOfferEligibility {
  const billingInterval = assertPaidBillingInterval(input.billingInterval);
  if (input.attributionState === null) {
    return Object.freeze({
      outcome: 'NOT_ELIGIBLE',
      offerClass: 'NOT_ELIGIBLE',
      billingInterval,
      reason: 'NO_ATTRIBUTION'
    });
  }

  if (
    input.hasSuccessfulFirstPurchase ||
    input.qualifyingPaidCoverageId !== null ||
    input.attributionState !== 'ATTRIBUTED'
  ) {
    return Object.freeze({
      outcome: 'NOT_ELIGIBLE',
      offerClass: 'CONSUMED',
      billingInterval,
      reason: input.hasSuccessfulFirstPurchase
        ? 'FIRST_PURCHASE_ALREADY_EXISTS'
        : 'CONSUMED'
    });
  }

  return Object.freeze({
    outcome: 'ELIGIBLE',
    offerClass:
      billingInterval === 'MONTHLY'
        ? 'FIRST_PAID_MONTH_50_PERCENT_OFF'
        : 'FIRST_PAID_YEAR_15_PERCENT_OFF',
    billingInterval,
    reason: 'ATTRIBUTION_AVAILABLE'
  });
}

export function assertReferralStandardRewardDuration(
  value: unknown,
  fieldName = 'grantedDurationUs'
): string {
  const duration = assertReferralDurationMicroseconds(value, fieldName);
  if (duration !== REFERRAL_REWARD_DURATION_US) {
    return invalid(fieldName);
  }
  return duration;
}

export function assertReferralRevision(value: unknown): string {
  return assertCommercialRevision(value);
}
