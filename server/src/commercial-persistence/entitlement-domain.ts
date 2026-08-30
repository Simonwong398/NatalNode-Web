import {
  PAID_RENEWAL_GRACE_HOURS,
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialTimestamp,
  assertOptionalCommercialTimestamp,
  assertPaidBillingInterval,
  assertPaidCoverageState,
  assertPaidRelationshipEndReason,
  assertPaidRelationshipLifecycleState,
  assertPaidRenewalIntent
} from './commercial-domain.js';
import type {
  CommercialTimestampInput,
  PaidBillingRelationshipRecord,
  PaidCoverageRecord
} from './repositories.js';
import {
  referralEpochMicrosecondsToTimestamp,
  referralTimestampToEpochMicroseconds,
  type ReferralTimeBankSourceSnapshot
} from './referral-time-bank-domain.js';
import { assertReferralTimestamp } from './referral-domain.js';
import {
  ENTITLEMENT_ALERT_ELIGIBILITY_CLASSES,
  ENTITLEMENT_CAPABILITIES,
  ENTITLEMENT_EVALUATOR_POLICY_VERSION,
  ENTITLEMENT_INDETERMINATE_REASONS,
  ENTITLEMENT_PROJECTION_SCHEMA_VERSION,
  ENTITLEMENT_PROJECTION_STATUSES,
  ENTITLEMENT_SOURCE_CLASSES,
  ENTITLEMENT_TIERS,
  ENTITLEMENT_VAULT_CAPACITY_CLASSES,
  type DeterminateEntitlementEvaluation,
  type EffectiveEntitlementDeterminate,
  type EffectiveEntitlementIndeterminate,
  type EffectiveEntitlementResult,
  type EntitlementAlertEligibilityClass,
  type EntitlementCapability,
  type EntitlementCapabilityDecision,
  type EntitlementEvaluationResult,
  type EntitlementIndeterminateReason,
  type EntitlementProjectionRecord,
  type EntitlementProjectionStatus,
  type EntitlementSourceClass,
  type EntitlementTier,
  type EntitlementVaultCapacityClass
} from './entitlement-types.js';

const MICROSECONDS_PER_HOUR = 60n * 60n * 1_000_000n;
const RENEWAL_GRACE_MICROSECONDS =
  BigInt(PAID_RENEWAL_GRACE_HOURS) * MICROSECONDS_PER_HOUR;
const PRECISE_FRACTION_PATTERN = /\.\d{4,6}(?:Z|[+-]\d{2}:?\d{2})$/u;

export class EntitlementDomainValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'EntitlementDomainValidationError';
  }
}

class EvaluationFailure extends Error {
  public constructor(
    public readonly reason: EntitlementIndeterminateReason
  ) {
    super(reason);
    this.name = 'EvaluationFailure';
  }
}

function fail(reason: EntitlementIndeterminateReason): never {
  throw new EvaluationFailure(reason);
}

function normalizeEntitlementTimestamp(value: unknown, fieldName: string): string {
  const canonical = assertCommercialTimestamp(value, fieldName);
  return typeof value === 'string' && PRECISE_FRACTION_PATTERN.test(value)
    ? assertReferralTimestamp(value, fieldName)
    : canonical;
}

function timestampMicroseconds(value: string): bigint {
  try {
    return referralTimestampToEpochMicroseconds(value, 'timestamp');
  } catch {
    return fail('INVALID_SOURCE_STATE');
  }
}

function isoTimestamp(microseconds: bigint): string {
  return referralEpochMicrosecondsToTimestamp(microseconds);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function isEntitlementSourceClass(value: unknown): value is EntitlementSourceClass {
  return (
    typeof value === 'string' &&
    (ENTITLEMENT_SOURCE_CLASSES as readonly string[]).includes(value)
  );
}

function isProjectionStatus(value: unknown): value is EntitlementProjectionStatus {
  return (
    typeof value === 'string' &&
    (ENTITLEMENT_PROJECTION_STATUSES as readonly string[]).includes(value)
  );
}

function indeterminate(
  reasonClass: EntitlementIndeterminateReason,
  entitlementRevision: string | null = null,
  retryable = false
): EffectiveEntitlementIndeterminate {
  return Object.freeze({
    determination: 'INDETERMINATE' as const,
    entitlementRevision,
    retryable,
    reasonClass
  });
}

export function createIndeterminateEntitlement(
  reasonClass: EntitlementIndeterminateReason,
  entitlementRevision: string | null = null,
  retryable = false
): EffectiveEntitlementIndeterminate {
  if (
    !(ENTITLEMENT_INDETERMINATE_REASONS as readonly string[]).includes(
      reasonClass
    )
  ) {
    throw new EntitlementDomainValidationError('reasonClass is invalid.');
  }

  const normalizedRevision =
    entitlementRevision === null
      ? null
      : assertCommercialRevision(entitlementRevision);
  return indeterminate(reasonClass, normalizedRevision, retryable);
}

function normalizeOptionalTimestamp(
  value: string | null,
  fieldName: string
): string | null {
  return value === null
    ? null
    : normalizeEntitlementTimestamp(value, fieldName);
}

interface NormalizedRelationship {
  readonly paidRelationshipId: string;
  readonly commercialAuthorityId: string;
  readonly billingInterval: PaidBillingRelationshipRecord['billingInterval'];
  readonly lifecycleState: PaidBillingRelationshipRecord['lifecycleState'];
  readonly renewalIntent: PaidBillingRelationshipRecord['renewalIntent'];
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly graceStartedAt: string | null;
  readonly graceUntil: string | null;
  readonly failedRenewalIdentity: string | null;
  readonly endedAt: string | null;
  readonly endReason: PaidBillingRelationshipRecord['endReason'];
  readonly sourceRevision: string;
}

function assertRelationshipShape(
  relationship: NormalizedRelationship
): void {
  const periodStart =
    relationship.currentPeriodStart === null
      ? null
      : timestampMicroseconds(relationship.currentPeriodStart);
  const periodEnd =
    relationship.currentPeriodEnd === null
      ? null
      : timestampMicroseconds(relationship.currentPeriodEnd);

  if (
    (periodStart === null) !== (periodEnd === null) ||
    (periodStart !== null &&
      periodEnd !== null &&
      !(periodStart < periodEnd))
  ) {
    fail('INVALID_SOURCE_STATE');
  }

  const graceStart =
    relationship.graceStartedAt === null
      ? null
      : timestampMicroseconds(relationship.graceStartedAt);
  const graceEnd =
    relationship.graceUntil === null
      ? null
      : timestampMicroseconds(relationship.graceUntil);

  if (
    (graceStart === null) !== (graceEnd === null) ||
    (graceStart !== null &&
      graceEnd !== null &&
      graceEnd - graceStart !== RENEWAL_GRACE_MICROSECONDS)
  ) {
    fail('INVALID_SOURCE_STATE');
  }

  if (
    relationship.lifecycleState === 'PENDING_FIRST_PAYMENT' ||
    relationship.lifecycleState === 'FIRST_PAYMENT_FAILED'
  ) {
    if (
      relationship.renewalIntent !== 'ENABLED' ||
      periodStart !== null ||
      periodEnd !== null ||
      graceStart !== null ||
      graceEnd !== null ||
      relationship.endedAt !== null ||
      relationship.endReason !== null
    ) {
      fail('INVALID_SOURCE_STATE');
    }
    return;
  }

  if (relationship.lifecycleState === 'ACTIVE') {
    if (
      periodStart === null ||
      periodEnd === null ||
      graceStart !== null ||
      graceEnd !== null ||
      relationship.endedAt !== null ||
      relationship.endReason !== null
    ) {
      fail('INVALID_SOURCE_STATE');
    }
    return;
  }

  if (relationship.lifecycleState === 'RECOVERY_GRACE') {
    if (
      relationship.renewalIntent !== 'ENABLED' ||
      periodEnd === null ||
      graceStart === null ||
      graceEnd === null ||
      graceStart < periodEnd ||
      relationship.endedAt !== null ||
      relationship.endReason !== null
    ) {
      fail('INVALID_SOURCE_STATE');
    }
    return;
  }

  if (
    relationship.lifecycleState === 'ENDED' &&
    (relationship.renewalIntent !== 'DISABLED' ||
      relationship.endedAt === null ||
      relationship.endReason === null ||
      graceStart !== null ||
      graceEnd !== null)
  ) {
    fail('INVALID_SOURCE_STATE');
  }
}

function normalizeRelationship(
  relationship: PaidBillingRelationshipRecord,
  commercialAuthorityId: string,
  authorityRevision: bigint
): NormalizedRelationship {
  const paidRelationshipId = assertCommercialIdentifier(
    relationship.paidRelationshipId,
    'paidRelationshipId'
  );
  const relationshipAuthorityId = assertCommercialIdentifier(
    relationship.commercialAuthorityId,
    'commercialAuthorityId'
  );
  if (relationshipAuthorityId !== commercialAuthorityId) {
    fail('SOURCE_SCOPE_MISMATCH');
  }

  const billingInterval = assertPaidBillingInterval(
    relationship.billingInterval
  );
  const lifecycleState = assertPaidRelationshipLifecycleState(
    relationship.lifecycleState
  );
  const renewalIntent = assertPaidRenewalIntent(relationship.renewalIntent);
  const sourceRevision = assertCommercialRevision(relationship.sourceRevision);
  if (BigInt(sourceRevision) > authorityRevision) {
    fail('SOURCE_SCOPE_MISMATCH');
  }

  const currentPeriodStart = normalizeOptionalTimestamp(
    relationship.currentPeriodStart,
    'currentPeriodStart'
  );
  const currentPeriodEnd = normalizeOptionalTimestamp(
    relationship.currentPeriodEnd,
    'currentPeriodEnd'
  );
  const graceStartedAt = normalizeOptionalTimestamp(
    relationship.graceStartedAt,
    'graceStartedAt'
  );
  const graceUntil = normalizeOptionalTimestamp(
    relationship.graceUntil,
    'graceUntil'
  );
  const failedRenewalIdentity =
    relationship.failedRenewalIdentity === null
      ? null
      : assertCommercialIdentifier(
          relationship.failedRenewalIdentity,
          'failedRenewalIdentity'
        );
  const endedAt = normalizeOptionalTimestamp(relationship.endedAt, 'endedAt');
  const endReason =
    relationship.endReason === null
      ? null
      : assertPaidRelationshipEndReason(relationship.endReason);

  const normalized = {
    paidRelationshipId,
    commercialAuthorityId: relationshipAuthorityId,
    billingInterval,
    lifecycleState,
    renewalIntent,
    currentPeriodStart,
    currentPeriodEnd,
    graceStartedAt,
    graceUntil,
    failedRenewalIdentity,
    endedAt,
    endReason,
    sourceRevision
  } satisfies NormalizedRelationship;

  assertRelationshipShape(normalized);
  return normalized;
}

interface NormalizedCoverage {
  readonly paidCoverageId: string;
  readonly paidRelationshipId: string;
  readonly commercialAuthorityId: string;
  readonly billingInterval: PaidCoverageRecord['billingInterval'];
  readonly coverageStartAt: string;
  readonly scheduledCoverageEndAt: string;
  readonly effectiveCoverageEndAt: string;
  readonly coverageState: PaidCoverageRecord['coverageState'];
  readonly sourceRevision: string;
}

function normalizeCoverage(
  coverage: PaidCoverageRecord,
  commercialAuthorityId: string,
  authorityRevision: bigint
): NormalizedCoverage {
  const paidCoverageId = assertCommercialIdentifier(
    coverage.paidCoverageId,
    'paidCoverageId'
  );
  const paidRelationshipId = assertCommercialIdentifier(
    coverage.paidRelationshipId,
    'paidRelationshipId'
  );
  const coverageAuthorityId = assertCommercialIdentifier(
    coverage.commercialAuthorityId,
    'commercialAuthorityId'
  );
  if (coverageAuthorityId !== commercialAuthorityId) {
    fail('SOURCE_SCOPE_MISMATCH');
  }

  const billingInterval = assertPaidBillingInterval(coverage.billingInterval);
  const coverageState = assertPaidCoverageState(coverage.coverageState);
  const coverageStartAt = normalizeEntitlementTimestamp(
    coverage.coverageStartAt,
    'coverageStartAt'
  );
  const scheduledCoverageEndAt = normalizeEntitlementTimestamp(
    coverage.scheduledCoverageEndAt,
    'scheduledCoverageEndAt'
  );
  const effectiveCoverageEndAt = normalizeEntitlementTimestamp(
    coverage.effectiveCoverageEndAt,
    'effectiveCoverageEndAt'
  );
  const coverageStart = timestampMicroseconds(coverageStartAt);
  const scheduledEnd = timestampMicroseconds(scheduledCoverageEndAt);
  const effectiveEnd = timestampMicroseconds(effectiveCoverageEndAt);
  if (
    !(coverageStart < scheduledEnd) ||
    effectiveEnd < coverageStart ||
    effectiveEnd > scheduledEnd ||
    (coverageState === 'VALID' && !(coverageStart < effectiveEnd))
  ) {
    fail('INVALID_SOURCE_STATE');
  }

  const sourceRevision = assertCommercialRevision(coverage.sourceRevision);
  if (BigInt(sourceRevision) > authorityRevision) {
    fail('SOURCE_SCOPE_MISMATCH');
  }

  return {
    paidCoverageId,
    paidRelationshipId,
    commercialAuthorityId: coverageAuthorityId,
    billingInterval,
    coverageStartAt,
    scheduledCoverageEndAt,
    effectiveCoverageEndAt,
    coverageState,
    sourceRevision
  };
}

interface PaidInterval {
  readonly start: bigint;
  readonly end: bigint;
  readonly sourceEntityId: string;
  readonly kind: 'COVERAGE' | 'GRACE';
}

interface MergedPaidSegment {
  readonly start: bigint;
  readonly end: bigint;
  readonly intervals: readonly PaidInterval[];
}

function mergePaidIntervals(
  intervals: readonly PaidInterval[]
): readonly MergedPaidSegment[] {
  const sorted = [...intervals].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start < right.start ? -1 : 1;
    }
    if (left.end !== right.end) {
      return left.end < right.end ? -1 : 1;
    }
    return left.sourceEntityId.localeCompare(right.sourceEntityId);
  });
  const merged: Array<{
    start: bigint;
    end: bigint;
    intervals: PaidInterval[];
  }> = [];

  for (const interval of sorted) {
    const current = merged.at(-1);
    if (current !== undefined && interval.start <= current.end) {
      current.end = current.end > interval.end ? current.end : interval.end;
      current.intervals.push(interval);
      continue;
    }
    merged.push({
      start: interval.start,
      end: interval.end,
      intervals: [interval]
    });
  }

  return Object.freeze(
    merged.map((segment) =>
      Object.freeze({
        start: segment.start,
        end: segment.end,
        intervals: Object.freeze([...segment.intervals])
      })
    )
  );
}

function completeDeterminateEvaluation(input: {
  readonly commercialAuthorityId: string;
  readonly entitlementRevision: string;
  readonly evaluatedAt: string;
  readonly effectivePro: boolean;
  readonly effectiveFrom: string | null;
  readonly effectiveUntil: string | null;
  readonly currentSourceClass: EntitlementSourceClass | null;
  readonly currentSourceClasses: readonly EntitlementSourceClass[];
  readonly currentSourceEntityId: string | null;
  readonly paidCoverageEndAt: string | null;
  readonly graceUntil: string | null;
  readonly transitionToFreeAt: string | null;
  readonly nextEvaluationAt: string | null;
  readonly queuedReferralDurationUs?: string | null;
  readonly currentReferralRewardId?: string | null;
}): DeterminateEntitlementEvaluation {
  const effectivePro = input.effectivePro;
  const tier: EntitlementTier = effectivePro ? 'PRO' : 'FREE';
  const vaultCapacityClass: EntitlementVaultCapacityClass = effectivePro
    ? 'PRO_UNLIMITED'
    : 'FREE_LIMIT_3';
  const astrologyAlertsEligible = effectivePro;

  return Object.freeze({
    determination: 'DETERMINATE' as const,
    commercialAuthorityId: input.commercialAuthorityId,
    tier,
    effectivePro,
    entitlementRevision: input.entitlementRevision,
    evaluatedAt: input.evaluatedAt,
    effectiveFrom: input.effectiveFrom,
    effectiveUntil: input.effectiveUntil,
    currentSourceClass: input.currentSourceClass,
    currentSourceClasses: Object.freeze([...input.currentSourceClasses]),
    adFree: effectivePro,
    vaultCapacityClass,
    astrologyAlertsEligible,
    currentSourceEntityId: input.currentSourceEntityId,
    paidCoverageEndAt: input.paidCoverageEndAt,
    graceUntil: input.graceUntil,
    queuedReferralDurationUs: input.queuedReferralDurationUs ?? null,
    currentReferralRewardId: input.currentReferralRewardId ?? null,
    transitionToFreeAt: input.transitionToFreeAt,
    nextEvaluationAt: input.nextEvaluationAt
  });
}

export interface EffectiveEntitlementEvaluationInput {
  readonly commercialAuthorityId: string;
  readonly entitlementRevision: string;
  readonly evaluatedAt: CommercialTimestampInput;
  readonly paidBillingRelationships: readonly PaidBillingRelationshipRecord[];
  readonly paidCoverages: readonly PaidCoverageRecord[];
  readonly referralSource?: ReferralTimeBankSourceSnapshot | null;
}

function earliestFutureTimestamp(
  evaluatedAtMicroseconds: bigint,
  values: readonly (string | null)[]
): string | null {
  const future = values
    .filter((value): value is string => value !== null)
    .map(timestampMicroseconds)
    .filter((value) => value > evaluatedAtMicroseconds);
  if (future.length === 0) {
    return null;
  }
  const earliest = future.reduce((current, value) =>
    value < current ? value : current
  );
  return isoTimestamp(earliest);
}

/**
 * Pure D3 evaluator. It consumes only normalized commercial source state and
 * an authoritative instant; it performs no database, provider, or astronomy
 * work. Future source classes can join the interval set without changing the
 * product-level result contract.
 */
export function evaluateEffectiveEntitlement(
  input: EffectiveEntitlementEvaluationInput
): EntitlementEvaluationResult {
  let entitlementRevision: string | null = null;

  try {
    if (typeof input !== 'object' || input === null) {
      return indeterminate('INVALID_INPUT');
    }
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    entitlementRevision = assertCommercialRevision(input.entitlementRevision);
    const authorityRevision = BigInt(entitlementRevision);
    const evaluatedAt = normalizeEntitlementTimestamp(
      input.evaluatedAt,
      'evaluatedAt'
    );
    const evaluatedAtMicroseconds = timestampMicroseconds(evaluatedAt);
    const referralSource = input.referralSource ?? null;
    if (referralSource !== null) {
      if (
        assertCommercialIdentifier(
          referralSource.commercialAuthorityId,
          'commercialAuthorityId'
        ) !== commercialAuthorityId ||
        assertCommercialRevision(referralSource.sourceRevision) !==
          entitlementRevision ||
        timestampMicroseconds(referralSource.evaluatedAt) !==
          evaluatedAtMicroseconds
      ) {
        fail('SOURCE_SCOPE_MISMATCH');
      }
      if (
        BigInt(
          assertCommercialRevision(referralSource.queuedReferralDurationUs)
        ) < 0n ||
        (referralSource.currentReferralRewardId === null) !==
          (referralSource.currentEffectiveFrom === null) ||
        (referralSource.currentReferralRewardId === null) !==
          (referralSource.currentEffectiveUntil === null)
      ) {
        fail('INVALID_SOURCE_STATE');
      }
      if (referralSource.currentReferralRewardId !== null) {
        assertCommercialIdentifier(
          referralSource.currentReferralRewardId,
          'currentReferralRewardId'
        );
        const referralStart = timestampMicroseconds(
          referralSource.currentEffectiveFrom!
        );
        const referralEnd = timestampMicroseconds(
          referralSource.currentEffectiveUntil!
        );
        if (
          referralStart > evaluatedAtMicroseconds ||
          referralEnd <= evaluatedAtMicroseconds
        ) {
          fail('INVALID_SOURCE_STATE');
        }
      }
    }

    if (
      !Array.isArray(input.paidBillingRelationships) ||
      !Array.isArray(input.paidCoverages)
    ) {
      return indeterminate('INVALID_INPUT', entitlementRevision);
    }

    const relationships = input.paidBillingRelationships.map((relationship) =>
      normalizeRelationship(relationship, commercialAuthorityId, authorityRevision)
    );
    const relationshipById = new Map<string, NormalizedRelationship>();
    for (const relationship of relationships) {
      if (relationshipById.has(relationship.paidRelationshipId)) {
        fail('INVALID_SOURCE_STATE');
      }
      relationshipById.set(relationship.paidRelationshipId, relationship);
    }

    const coverages = input.paidCoverages.map((coverage) =>
      normalizeCoverage(coverage, commercialAuthorityId, authorityRevision)
    );
    const coverageIds = new Set<string>();
    for (const coverage of coverages) {
      if (coverageIds.has(coverage.paidCoverageId)) {
        fail('INVALID_SOURCE_STATE');
      }
      coverageIds.add(coverage.paidCoverageId);
      if (!relationshipById.has(coverage.paidRelationshipId)) {
        fail('SOURCE_SCOPE_MISMATCH');
      }
    }

    const paidIntervals: PaidInterval[] = [];
    const currentGraceIntervals: PaidInterval[] = [];

    for (const relationship of relationships) {
      const relationshipCoverages = coverages.filter(
        (coverage) =>
          coverage.paidRelationshipId === relationship.paidRelationshipId
      );

      if (
        relationship.lifecycleState === 'PENDING_FIRST_PAYMENT' ||
        relationship.lifecycleState === 'FIRST_PAYMENT_FAILED'
      ) {
        if (
          relationshipCoverages.some(
            (coverage) => coverage.coverageState === 'VALID'
          )
        ) {
          fail('INVALID_SOURCE_STATE');
        }
        continue;
      }

      if (relationship.lifecycleState === 'ENDED') {
        // D2 may retain a VALID historical row after the relationship ends.
        // Its interval is not an active source and is intentionally ignored.
        continue;
      }

      for (const coverage of relationshipCoverages) {
        if (coverage.billingInterval !== relationship.billingInterval) {
          fail('INVALID_SOURCE_STATE');
        }
        // A reversal or explicit ending clamps the attributable interval;
        // it does not retroactively erase access before that boundary. The
        // interval remains eligible until effectiveCoverageEndAt, while an
        // already expired row naturally contributes nothing.
        paidIntervals.push({
          start: timestampMicroseconds(coverage.coverageStartAt),
          end: timestampMicroseconds(coverage.effectiveCoverageEndAt),
          sourceEntityId: coverage.paidCoverageId,
          kind: 'COVERAGE'
        });
      }

      if (relationship.lifecycleState === 'RECOVERY_GRACE') {
        if (
          relationship.graceStartedAt === null ||
          relationship.graceUntil === null
        ) {
          fail('INVALID_SOURCE_STATE');
        }
        const graceInterval: PaidInterval = {
          start: timestampMicroseconds(relationship.graceStartedAt),
          end: timestampMicroseconds(relationship.graceUntil),
          sourceEntityId: relationship.paidRelationshipId,
          kind: 'GRACE'
        };
        paidIntervals.push(graceInterval);
        currentGraceIntervals.push(graceInterval);
      }
    }

    const mergedSegments = mergePaidIntervals(paidIntervals);
    const currentSegment = mergedSegments.find(
      (segment) =>
        segment.start <= evaluatedAtMicroseconds &&
        evaluatedAtMicroseconds < segment.end
    );

    if (currentSegment === undefined) {
      const nextSegment = mergedSegments.find(
        (segment) => segment.start > evaluatedAtMicroseconds
      );
      if (referralSource?.paidActive === true) {
        fail('INVALID_SOURCE_STATE');
      }
      if (referralSource !== null && referralSource.currentReferralRewardId !== null) {
        return completeDeterminateEvaluation({
          commercialAuthorityId,
          entitlementRevision,
          evaluatedAt,
          effectivePro: true,
          effectiveFrom: referralSource.currentEffectiveFrom,
          effectiveUntil: referralSource.currentEffectiveUntil,
          currentSourceClass: 'REFERRAL',
          currentSourceClasses: ['REFERRAL'],
          currentSourceEntityId: referralSource.currentReferralRewardId,
          paidCoverageEndAt: null,
          graceUntil: null,
          queuedReferralDurationUs: referralSource.queuedReferralDurationUs,
          currentReferralRewardId: referralSource.currentReferralRewardId,
          transitionToFreeAt: referralSource.currentEffectiveUntil,
          nextEvaluationAt: earliestFutureTimestamp(
            evaluatedAtMicroseconds,
            [
              nextSegment === undefined ? null : isoTimestamp(nextSegment.start),
              referralSource.nextEvaluationAt
            ]
          )
        });
      }
      return completeDeterminateEvaluation({
        commercialAuthorityId,
        entitlementRevision,
        evaluatedAt,
        effectivePro: false,
        effectiveFrom: null,
        effectiveUntil: null,
        currentSourceClass: null,
        currentSourceClasses: [],
        currentSourceEntityId: null,
        paidCoverageEndAt: null,
        graceUntil: null,
        transitionToFreeAt: null,
        queuedReferralDurationUs:
          referralSource?.queuedReferralDurationUs ?? null,
        currentReferralRewardId: null,
        nextEvaluationAt: earliestFutureTimestamp(
          evaluatedAtMicroseconds,
          [
            nextSegment === undefined ? null : isoTimestamp(nextSegment.start),
            referralSource?.nextEvaluationAt ?? null
          ]
        )
      });
    }

    if (
      referralSource !== null &&
      (!referralSource.paidActive || referralSource.currentReferralRewardId !== null)
    ) {
      fail('INVALID_SOURCE_STATE');
    }

    const currentIntervals = currentSegment.intervals.filter(
      (interval) =>
        interval.start <= evaluatedAtMicroseconds &&
        evaluatedAtMicroseconds < interval.end
    );
    const currentSourceEntityIds = uniqueSorted(
      currentIntervals.map((interval) => interval.sourceEntityId)
    );
    const coverageEnds = currentIntervals
      .filter((interval) => interval.kind === 'COVERAGE')
      .map((interval) => interval.end);
    const graceEnds = currentGraceIntervals
      .filter(
        (interval) =>
          interval.start <= evaluatedAtMicroseconds &&
          evaluatedAtMicroseconds < interval.end
      )
      .map((interval) => interval.end);

    return completeDeterminateEvaluation({
      commercialAuthorityId,
      entitlementRevision,
      evaluatedAt,
      effectivePro: true,
      effectiveFrom: isoTimestamp(currentSegment.start),
      effectiveUntil: isoTimestamp(currentSegment.end),
      currentSourceClass: 'PAID',
      currentSourceClasses: ['PAID'],
      currentSourceEntityId:
        currentSourceEntityIds.length === 1
          ? currentSourceEntityIds[0]
          : null,
      paidCoverageEndAt:
        coverageEnds.length === 0
          ? null
          : isoTimestamp(
              coverageEnds.reduce((current, value) =>
                value > current ? value : current
              )
            ),
      graceUntil:
        graceEnds.length === 0
          ? null
          : isoTimestamp(
              graceEnds.reduce((current, value) =>
                value < current ? value : current
              )
            ),
      transitionToFreeAt: isoTimestamp(currentSegment.end),
      queuedReferralDurationUs: referralSource?.queuedReferralDurationUs ?? null,
      currentReferralRewardId: null,
      nextEvaluationAt: earliestFutureTimestamp(evaluatedAtMicroseconds, [
        isoTimestamp(currentSegment.end),
        referralSource?.nextEvaluationAt ?? null
      ])
    });
  } catch (error) {
    if (error instanceof EvaluationFailure) {
      return indeterminate(error.reason, entitlementRevision);
    }
    return indeterminate(
      entitlementRevision === null ? 'INVALID_INPUT' : 'INVALID_SOURCE_STATE',
      entitlementRevision
    );
  }
}

export function createEntitlementProjection(
  evaluation: DeterminateEntitlementEvaluation,
  computedAtInput: CommercialTimestampInput = evaluation.evaluatedAt
): EntitlementProjectionRecord {
  if (evaluation.determination !== 'DETERMINATE') {
    throw new EntitlementDomainValidationError(
      'Only determinate evaluations can create a projection.'
    );
  }
  const computedAt = assertCommercialTimestamp(computedAtInput, 'computedAt');
  const currentSourceClasses = Object.freeze([
    ...evaluation.currentSourceClasses
  ]);
  return Object.freeze({
    commercialAuthorityId: assertCommercialIdentifier(
      evaluation.commercialAuthorityId,
      'commercialAuthorityId'
    ),
    sourceRevision: assertCommercialRevision(evaluation.entitlementRevision),
    projectionSchemaVersion: ENTITLEMENT_PROJECTION_SCHEMA_VERSION,
    evaluatorPolicyVersion: ENTITLEMENT_EVALUATOR_POLICY_VERSION,
    projectionStatus: 'CURRENT' as const,
    tier: evaluation.tier,
    effectivePro: evaluation.effectivePro,
    effectiveFrom: evaluation.effectiveFrom,
    effectiveUntil: evaluation.effectiveUntil,
    currentSourceClasses,
    currentSourceClass: evaluation.currentSourceClass,
    currentSourceEntityId: evaluation.currentSourceEntityId,
    paidCoverageEndAt: evaluation.paidCoverageEndAt,
    graceUntil: evaluation.graceUntil,
    queuedReferralDurationUs: evaluation.queuedReferralDurationUs,
    currentReferralRewardId: evaluation.currentReferralRewardId,
    transitionToFreeAt: evaluation.transitionToFreeAt,
    adFree: evaluation.adFree,
    vaultCapacityClass: evaluation.vaultCapacityClass,
    astrologyAlertsEligibilityClass: evaluation.astrologyAlertsEligible
      ? 'ELIGIBLE'
      : 'INELIGIBLE',
    nextEvaluationAt: evaluation.nextEvaluationAt,
    computedAt
  });
}

export function toEffectiveEntitlementResult(
  evaluation: EntitlementEvaluationResult
): EffectiveEntitlementResult {
  if (evaluation.determination === 'INDETERMINATE') {
    return evaluation;
  }
  const {
    determination,
    tier,
    effectivePro,
    entitlementRevision,
    evaluatedAt,
    effectiveFrom,
    effectiveUntil,
    currentSourceClass,
    currentSourceClasses,
    adFree,
    vaultCapacityClass,
    astrologyAlertsEligible
  } = evaluation;
  return Object.freeze({
    determination,
    tier,
    effectivePro,
    entitlementRevision,
    evaluatedAt,
    effectiveFrom,
    effectiveUntil,
    currentSourceClass,
    currentSourceClasses: Object.freeze([...currentSourceClasses]),
    adFree,
    vaultCapacityClass,
    astrologyAlertsEligible
  });
}

export function assertEntitlementCapability(
  value: unknown
): EntitlementCapability {
  if (
    typeof value !== 'string' ||
    !(ENTITLEMENT_CAPABILITIES as readonly string[]).includes(value)
  ) {
    throw new EntitlementDomainValidationError('capability is invalid.');
  }
  return value as EntitlementCapability;
}

export function evaluateEntitlementCapability(
  entitlement: EffectiveEntitlementResult,
  capabilityInput: EntitlementCapability
): EntitlementCapabilityDecision {
  const capability = assertEntitlementCapability(capabilityInput);
  if (entitlement.determination !== 'DETERMINATE') {
    return 'INDETERMINATE';
  }

  // Every bounded capability is a current-Pro capability. The switch is
  // intentionally explicit so a future capability cannot become allowed by
  // accident when this contract grows.
  switch (capability) {
    case 'VAULT_UNLIMITED':
    case 'PERSONAL_TRANSITS':
    case 'ASTROLOGY_ALERTS':
    case 'ADVANCED_INTERPRETATION':
    case 'ADVANCED_EXPORT':
    case 'ADVANCED_WORKSPACE':
    case 'AD_FREE':
      return entitlement.effectivePro ? 'ALLOWED' : 'DENIED';
    default:
      return 'INDETERMINATE';
  }
}

export type EntitlementProjectionFreshness =
  | 'CURRENT'
  | 'STALE'
  | 'INTEGRITY_CONFLICT';

export function assessEntitlementProjectionFreshness(
  projection: EntitlementProjectionRecord,
  authorityRevisionInput: string,
  authoritativeNowInput: CommercialTimestampInput
): EntitlementProjectionFreshness {
  const authorityRevision = BigInt(
    assertCommercialRevision(authorityRevisionInput)
  );
  const projectionRevision = BigInt(
    assertCommercialRevision(projection.sourceRevision)
  );
  if (projectionRevision > authorityRevision) {
    return 'INTEGRITY_CONFLICT';
  }
  if (
    projectionRevision < authorityRevision ||
    projection.projectionStatus !== 'CURRENT' ||
    projection.projectionSchemaVersion !== ENTITLEMENT_PROJECTION_SCHEMA_VERSION ||
    projection.evaluatorPolicyVersion !== ENTITLEMENT_EVALUATOR_POLICY_VERSION
  ) {
    return 'STALE';
  }

  const authoritativeNow = timestampMicroseconds(
    normalizeEntitlementTimestamp(authoritativeNowInput, 'authoritativeNow')
  );
  if (
    projection.nextEvaluationAt !== null &&
    authoritativeNow >= timestampMicroseconds(projection.nextEvaluationAt)
  ) {
    return 'STALE';
  }
  return 'CURRENT';
}

export function projectionToEffectiveEntitlement(
  projection: EntitlementProjectionRecord
): EffectiveEntitlementResult {
  let revision: string | null = null;
  try {
    revision = assertCommercialRevision(projection.sourceRevision);
    if (
      projection.projectionStatus !== 'CURRENT' ||
      !isProjectionStatus(projection.projectionStatus) ||
      projection.projectionSchemaVersion !== ENTITLEMENT_PROJECTION_SCHEMA_VERSION ||
      projection.evaluatorPolicyVersion !== ENTITLEMENT_EVALUATOR_POLICY_VERSION ||
      projection.tier === null ||
      projection.effectivePro === null ||
      projection.adFree === null ||
      projection.vaultCapacityClass === null ||
      projection.astrologyAlertsEligibilityClass === null ||
      projection.effectiveFrom === undefined ||
      projection.effectiveUntil === undefined
    ) {
      return indeterminate('PROJECTION_INTEGRITY', revision);
    }

    if (
      !(ENTITLEMENT_TIERS as readonly string[]).includes(projection.tier) ||
      !(ENTITLEMENT_VAULT_CAPACITY_CLASSES as readonly string[]).includes(
        projection.vaultCapacityClass
      ) ||
      !(ENTITLEMENT_ALERT_ELIGIBILITY_CLASSES as readonly string[]).includes(
        projection.astrologyAlertsEligibilityClass
      ) ||
      !projection.currentSourceClasses.every(isEntitlementSourceClass) ||
      (projection.currentSourceClass !== null &&
        !isEntitlementSourceClass(projection.currentSourceClass)) ||
      (projection.currentSourceClass !== null &&
        !projection.currentSourceClasses.includes(projection.currentSourceClass)) ||
      typeof projection.effectivePro !== 'boolean' ||
      typeof projection.adFree !== 'boolean'
    ) {
      return indeterminate('PROJECTION_INTEGRITY', revision);
    }

    const effectivePro = projection.effectivePro;
    const shapeMatches = effectivePro
      ? projection.tier === 'PRO' &&
        projection.adFree === true &&
        projection.vaultCapacityClass === 'PRO_UNLIMITED' &&
        projection.astrologyAlertsEligibilityClass === 'ELIGIBLE' &&
        projection.currentSourceClasses.length > 0 &&
        projection.effectiveFrom !== null &&
        projection.effectiveUntil !== null
      : projection.tier === 'FREE' &&
        projection.adFree === false &&
        projection.vaultCapacityClass === 'FREE_LIMIT_3' &&
        projection.astrologyAlertsEligibilityClass === 'INELIGIBLE' &&
        projection.currentSourceClasses.length === 0 &&
        projection.currentSourceClass === null &&
        projection.currentSourceEntityId === null &&
        projection.effectiveFrom === null &&
        projection.effectiveUntil === null;
    if (!shapeMatches) {
      return indeterminate('PROJECTION_INTEGRITY', revision);
    }

    assertOptionalCommercialTimestamp(
      projection.effectiveFrom,
      'effectiveFrom'
    );
    assertOptionalCommercialTimestamp(
      projection.effectiveUntil,
      'effectiveUntil'
    );
    assertOptionalCommercialTimestamp(
      projection.paidCoverageEndAt,
      'paidCoverageEndAt'
    );
    assertOptionalCommercialTimestamp(projection.graceUntil, 'graceUntil');
    assertOptionalCommercialTimestamp(
      projection.transitionToFreeAt,
      'transitionToFreeAt'
    );
    assertOptionalCommercialTimestamp(
      projection.nextEvaluationAt,
      'nextEvaluationAt'
    );
    assertCommercialIdentifier(
      projection.commercialAuthorityId,
      'commercialAuthorityId'
    );
    if (projection.currentSourceEntityId !== null) {
      assertCommercialIdentifier(
        projection.currentSourceEntityId,
        'currentSourceEntityId'
      );
    }
    if (projection.currentReferralRewardId !== null) {
      assertCommercialIdentifier(
        projection.currentReferralRewardId,
        'currentReferralRewardId'
      );
    }
    if (projection.queuedReferralDurationUs !== null) {
      assertCommercialRevision(projection.queuedReferralDurationUs);
    }

    const evaluatedAt = assertCommercialTimestamp(
      projection.computedAt,
      'computedAt'
    );
    return Object.freeze({
      determination: 'DETERMINATE' as const,
      tier: projection.tier,
      effectivePro,
      entitlementRevision: revision,
      evaluatedAt,
      effectiveFrom: projection.effectiveFrom,
      effectiveUntil: projection.effectiveUntil,
      currentSourceClass: projection.currentSourceClass,
      currentSourceClasses: Object.freeze([...projection.currentSourceClasses]),
      adFree: projection.adFree,
      vaultCapacityClass: projection.vaultCapacityClass,
      astrologyAlertsEligible:
        projection.astrologyAlertsEligibilityClass === 'ELIGIBLE'
    });
  } catch {
    return indeterminate('PROJECTION_INTEGRITY', revision);
  }
}
