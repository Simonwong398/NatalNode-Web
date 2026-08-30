import {
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialRevision,
  assertCommercialTimestamp,
  assertOptionalCommercialTimestamp
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  ReferralAttributionConflictError,
  ReferralRewardConflictError
} from '../commercial-persistence-errors.js';
import {
  REFERRAL_REWARD_DURATION_US,
  assertReferralAttributionState,
  assertReferralDurationMicroseconds,
  assertReferralPublicIdentityStatus,
  assertReferralReason,
  assertReferralRewardState,
  assertReferralStandardRewardDuration
} from '../referral-domain.js';
import type {
  ReferralAttributionRecord,
  ReferralPublicIdentityRecord,
  ReferralRewardRecord
} from '../repositories.js';

export interface ReferralPublicIdentityRow {
  readonly referral_public_identity_id: string;
  readonly commercial_authority_id: string;
  readonly public_value: string;
  readonly status: string;
  readonly created_at: Date | string;
  readonly revoked_at: Date | string | null;
  readonly supersedes_identity_id: string | null;
}

export interface ReferralAttributionRow {
  readonly referral_attribution_id: string;
  readonly referral_public_identity_id: string;
  readonly referrer_authority_id: string;
  readonly referred_authority_id: string;
  readonly state: string;
  readonly attributed_at: Date | string;
  readonly locked_at: Date | string | null;
  readonly qualifying_paid_coverage_id: string | null;
  readonly invalidation_reason: string | null;
  readonly invalidated_at: Date | string | null;
  readonly campaign_reference: string | null;
  readonly last_event_id: string;
  readonly source_revision: string | number | bigint;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface ReferralRewardRow {
  readonly referral_reward_id: string;
  readonly referrer_authority_id: string;
  readonly referral_attribution_id: string;
  readonly qualifying_paid_coverage_id: string;
  readonly state: string;
  readonly qualifying_payment_at: Date | string;
  readonly matures_at: Date | string;
  readonly earned_at: Date | string | null;
  readonly applied_at: Date | string | null;
  readonly revoked_at: Date | string | null;
  readonly granted_duration_us: string | number | bigint;
  readonly earned_duration_us: string | number | bigint;
  readonly applied_duration_us: string | number | bigint;
  readonly consumed_duration_us: string | number | bigint;
  readonly revoked_duration_us: string | number | bigint;
  readonly active_consumption_started_at: Date | string | null;
  readonly revocation_reason: string | null;
  readonly reversal_event_id: string | null;
  readonly pending_event_id: string;
  readonly maturation_event_id: string | null;
  readonly application_event_id: string | null;
  readonly source_revision: string | number | bigint;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export const REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL = `
  referral_public_identity_id,
  commercial_authority_id,
  public_value,
  status,
  created_at,
  revoked_at,
  supersedes_identity_id
`;

export const REFERRAL_ATTRIBUTION_COLUMNS_SQL = `
  referral_attribution_id,
  referral_public_identity_id,
  referrer_authority_id,
  referred_authority_id,
  state,
  attributed_at,
  locked_at,
  qualifying_paid_coverage_id,
  invalidation_reason,
  invalidated_at,
  campaign_reference,
  last_event_id,
  source_revision,
  created_at,
  updated_at
`;

export const REFERRAL_REWARD_COLUMNS_SQL = `
  referral_reward_id,
  referrer_authority_id,
  referral_attribution_id,
  qualifying_paid_coverage_id,
  state,
  qualifying_payment_at,
  matures_at,
  earned_at,
  applied_at,
  revoked_at,
  granted_duration_us,
  earned_duration_us,
  applied_duration_us,
  consumed_duration_us,
  revoked_duration_us,
  active_consumption_started_at,
  revocation_reason,
  reversal_event_id,
  pending_event_id,
  maturation_event_id,
  application_event_id,
  source_revision,
  created_at,
  updated_at
`;

export const REFERRAL_REWARD_COLUMNS_QUALIFIED_SQL = REFERRAL_REWARD_COLUMNS_SQL
  .split(',')
  .map((column) => `rr.${column.trim()}`)
  .join(',\n    ');

function optionalIdentifier(value: unknown, fieldName: string): string | null {
  return value === null || value === undefined
    ? null
    : assertCommercialIdentifier(value, fieldName);
}

function mapDuration(value: unknown, fieldName: string): string {
  return assertReferralDurationMicroseconds(value, fieldName);
}

export function mapReferralPublicIdentityRow(
  row: ReferralPublicIdentityRow
): ReferralPublicIdentityRecord {
  return Object.freeze({
    referralPublicIdentityId: assertCommercialIdentifier(
      row.referral_public_identity_id,
      'referralPublicIdentityId'
    ),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    publicValue: assertCommercialIdentifier(row.public_value, 'publicValue'),
    status: assertReferralPublicIdentityStatus(row.status),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    revokedAt: assertOptionalCommercialTimestamp(row.revoked_at, 'revokedAt'),
    supersedesIdentityId: optionalIdentifier(
      row.supersedes_identity_id,
      'supersedesIdentityId'
    )
  });
}

export function mapReferralAttributionRow(
  row: ReferralAttributionRow
): ReferralAttributionRecord {
  const state = assertReferralAttributionState(row.state);
  const qualifyingPaidCoverageId = optionalIdentifier(
    row.qualifying_paid_coverage_id,
    'qualifyingPaidCoverageId'
  );
  const lockedAt = assertOptionalCommercialTimestamp(row.locked_at, 'lockedAt');
  const invalidationReason =
    row.invalidation_reason === null
      ? null
      : assertReferralReason(row.invalidation_reason, 'invalidationReason');
  const invalidatedAt = assertOptionalCommercialTimestamp(
    row.invalidated_at,
    'invalidatedAt'
  );

  if (
    (state === 'ATTRIBUTED' && (lockedAt !== null || qualifyingPaidCoverageId !== null)) ||
    (state === 'LOCKED' && (lockedAt === null || qualifyingPaidCoverageId === null)) ||
    (state !== 'INVALIDATED' &&
      (invalidationReason !== null || invalidatedAt !== null)) ||
    (state === 'INVALIDATED' &&
      ((invalidationReason === null) !== (invalidatedAt === null)))
  ) {
    throw new ReferralAttributionConflictError();
  }

  return Object.freeze({
    referralAttributionId: assertCommercialIdentifier(
      row.referral_attribution_id,
      'referralAttributionId'
    ),
    referralPublicIdentityId: assertCommercialIdentifier(
      row.referral_public_identity_id,
      'referralPublicIdentityId'
    ),
    referrerAuthorityId: assertCommercialIdentifier(
      row.referrer_authority_id,
      'referrerAuthorityId'
    ),
    referredAuthorityId: assertCommercialIdentifier(
      row.referred_authority_id,
      'referredAuthorityId'
    ),
    state,
    attributedAt: assertCommercialTimestamp(row.attributed_at, 'attributedAt'),
    lockedAt,
    qualifyingPaidCoverageId,
    invalidationReason,
    invalidatedAt,
    campaignReference: optionalIdentifier(
      row.campaign_reference,
      'campaignReference'
    ),
    lastEventId: assertCommercialIdentifier(row.last_event_id, 'lastEventId'),
    sourceRevision: assertCommercialRevision(row.source_revision),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    updatedAt: assertCommercialTimestamp(row.updated_at, 'updatedAt')
  });
}

export function mapReferralRewardRow(row: ReferralRewardRow): ReferralRewardRecord {
  const state = assertReferralRewardState(row.state);
  const grantedDurationUs = assertReferralStandardRewardDuration(
    row.granted_duration_us,
    'grantedDurationUs'
  );
  const earnedDurationUs = mapDuration(
    row.earned_duration_us,
    'earnedDurationUs'
  );
  const appliedDurationUs = mapDuration(
    row.applied_duration_us,
    'appliedDurationUs'
  );
  const consumedDurationUs = mapDuration(
    row.consumed_duration_us,
    'consumedDurationUs'
  );
  const revokedDurationUs = mapDuration(
    row.revoked_duration_us,
    'revokedDurationUs'
  );
  const earned = BigInt(earnedDurationUs);
  const consumed = BigInt(consumedDurationUs);
  const revoked = BigInt(revokedDurationUs);
  const applied = BigInt(appliedDurationUs);
  if (
    earned > BigInt(grantedDurationUs) ||
    applied > earned ||
    consumed > applied ||
    consumed + revoked > earned
  ) {
    throw new ReferralRewardConflictError();
  }
  const remainingUnconsumedDurationUs = (earned - consumed - revoked).toString();
  const availableDurationUs =
    state === 'APPLIED' ? remainingUnconsumedDurationUs : '0';

  return Object.freeze({
    referralRewardId: assertCommercialIdentifier(
      row.referral_reward_id,
      'referralRewardId'
    ),
    referrerAuthorityId: assertCommercialIdentifier(
      row.referrer_authority_id,
      'referrerAuthorityId'
    ),
    referralAttributionId: assertCommercialIdentifier(
      row.referral_attribution_id,
      'referralAttributionId'
    ),
    qualifyingPaidCoverageId: assertCommercialIdentifier(
      row.qualifying_paid_coverage_id,
      'qualifyingPaidCoverageId'
    ),
    state,
    qualifyingPaymentAt: assertCommercialTimestamp(
      row.qualifying_payment_at,
      'qualifyingPaymentAt'
    ),
    maturesAt: assertCommercialTimestamp(row.matures_at, 'maturesAt'),
    earnedAt: assertOptionalCommercialTimestamp(row.earned_at, 'earnedAt'),
    appliedAt: assertOptionalCommercialTimestamp(row.applied_at, 'appliedAt'),
    revokedAt: assertOptionalCommercialTimestamp(row.revoked_at, 'revokedAt'),
    grantedDurationUs,
    earnedDurationUs,
    appliedDurationUs,
    consumedDurationUs,
    revokedDurationUs,
    activeConsumptionStartedAt: assertOptionalCommercialTimestamp(
      row.active_consumption_started_at,
      'activeConsumptionStartedAt'
    ),
    remainingUnconsumedDurationUs,
    availableDurationUs,
    revocationReason:
      row.revocation_reason === null
        ? null
        : assertReferralReason(row.revocation_reason, 'revocationReason'),
    reversalEventId: optionalIdentifier(row.reversal_event_id, 'reversalEventId'),
    pendingEventId: assertCommercialIdentifier(
      row.pending_event_id,
      'pendingEventId'
    ),
    maturationEventId: optionalIdentifier(
      row.maturation_event_id,
      'maturationEventId'
    ),
    applicationEventId: optionalIdentifier(
      row.application_event_id,
      'applicationEventId'
    ),
    sourceRevision: assertCommercialRevision(row.source_revision),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    updatedAt: assertCommercialTimestamp(row.updated_at, 'updatedAt')
  });
}

export function normalizeReferralCampaignReference(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return assertCommercialNamespace(value, 'campaignReference');
}

export function ensureD4ARewardShape(record: ReferralRewardRecord): void {
  if (record.grantedDurationUs !== REFERRAL_REWARD_DURATION_US) {
    throw new CommercialPersistenceIntegrityError();
  }
  if (record.state === 'PENDING') {
    if (
      record.earnedDurationUs !== '0' ||
      record.appliedDurationUs !== '0' ||
      record.consumedDurationUs !== '0' ||
      record.revokedDurationUs !== '0'
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
  }
  if (
    (record.state === 'PENDING' || record.state === 'EARNED') &&
    record.appliedDurationUs !== '0'
  ) {
    throw new CommercialPersistenceIntegrityError();
  }
}
