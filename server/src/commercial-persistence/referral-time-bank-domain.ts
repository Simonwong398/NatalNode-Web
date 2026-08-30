import { createHash } from 'node:crypto';

import {
  CommercialDomainValidationError,
  assertCommercialIdentifier,
  assertCommercialRevision
} from './commercial-domain.js';
import {
  REFERRAL_REWARD_DURATION_US,
  assertReferralDurationMicroseconds,
  assertReferralRewardState,
  assertReferralTimestamp,
  type ReferralRewardState
} from './referral-domain.js';

export const MAX_REFERRAL_TIME_BANK_REWARDS = 4096;
export const MAX_REFERRAL_TIME_BANK_SEGMENTS = 16384;
export const MAX_REFERRAL_PAID_BLOCKING_INTERVALS = 16384;

const MICROSECONDS_PER_MILLISECOND = 1000n;
const MICROSECONDS_PER_SECOND = 1_000_000n;
const TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:?\d{2})$/u;

export type ReferralPaidBlockingKind = 'COVERAGE' | 'GRACE';

export interface ReferralPaidBlockingInterval {
  readonly sourceEntityId: string;
  readonly kind: ReferralPaidBlockingKind;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface ReferralTimeBankRewardInput {
  readonly referralRewardId: string;
  readonly state: ReferralRewardState;
  readonly maturesAt: string;
  readonly admittedAt: string;
  readonly earnedAt: string | null;
  readonly appliedAt: string | null;
  readonly revokedAt: string | null;
  readonly earnedDurationUs: string;
  readonly appliedDurationUs: string;
  readonly consumedDurationUs: string;
  readonly revokedDurationUs: string;
  readonly activeConsumptionStartedAt: string | null;
  readonly sourceRevision: string;
}

export interface ReferralConsumptionSegmentPlan {
  readonly referralConsumptionSegmentId: string;
  readonly referralRewardId: string;
  readonly consumedFrom: string;
  readonly consumedUntil: string;
  readonly consumedDurationUs: string;
}

export interface ReferralRewardSettlement {
  readonly referralRewardId: string;
  readonly state: ReferralRewardState;
  readonly appliedAt: string | null;
  readonly appliedDurationUs: string;
  readonly consumedDurationUs: string;
  readonly revokedDurationUs: string;
  readonly activeConsumptionStartedAt: string | null;
}

export interface ReferralTimeBankSourceSnapshot {
  readonly commercialAuthorityId: string;
  readonly sourceRevision: string;
  readonly evaluatedAt: string;
  readonly paidActive: boolean;
  readonly currentReferralRewardId: string | null;
  readonly currentEffectiveFrom: string | null;
  readonly currentEffectiveUntil: string | null;
  readonly queuedReferralDurationUs: string;
  readonly nextEvaluationAt: string | null;
}

export interface ReferralTimeBankSettlement {
  readonly rewards: readonly ReferralRewardSettlement[];
  readonly segments: readonly ReferralConsumptionSegmentPlan[];
  readonly source: ReferralTimeBankSourceSnapshot;
}

interface NormalizedReward extends ReferralTimeBankRewardInput {
  readonly maturesAtUs: bigint;
  readonly admittedAtUs: bigint;
  readonly revokedAtUs: bigint | null;
  readonly earnedDuration: bigint;
}

interface NormalizedInterval {
  readonly start: bigint;
  readonly end: bigint;
}

function invalid(message: string): never {
  throw new CommercialDomainValidationError(message);
}

export function referralTimestampToEpochMicroseconds(
  value: unknown,
  fieldName: string
): bigint {
  const timestamp = assertReferralTimestamp(value, fieldName);
  const match = timestamp.match(TIMESTAMP_PATTERN);
  if (match === null) {
    return invalid(`${fieldName} is invalid.`);
  }
  const prefix = match[1];
  const fraction = (match[2] ?? '').padEnd(6, '0');
  const timezone = match[3];
  const wholeSecondMilliseconds = Date.parse(`${prefix}.000${timezone}`);
  if (!Number.isFinite(wholeSecondMilliseconds)) {
    return invalid(`${fieldName} is invalid.`);
  }
  return (
    BigInt(wholeSecondMilliseconds) * MICROSECONDS_PER_MILLISECOND +
    BigInt(fraction || '0')
  );
}

export function referralEpochMicrosecondsToTimestamp(value: bigint): string {
  if (value < 0n) {
    return invalid('timestamp is invalid.');
  }
  const wholeSeconds = value / MICROSECONDS_PER_SECOND;
  const fraction = value % MICROSECONDS_PER_SECOND;
  const base = new Date(Number(wholeSeconds * 1000n));
  if (!Number.isFinite(base.getTime())) {
    return invalid('timestamp is invalid.');
  }
  if (fraction % MICROSECONDS_PER_MILLISECOND === 0n) {
    return new Date(Number(value / MICROSECONDS_PER_MILLISECOND)).toISOString();
  }
  return `${base.toISOString().slice(0, 19)}.${fraction
    .toString()
    .padStart(6, '0')}Z`;
}

function compareBigInt(left: bigint, right: bigint): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function minimum(values: readonly bigint[]): bigint | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((current, value) => (value < current ? value : current));
}

function mergePaidIntervals(
  intervals: readonly ReferralPaidBlockingInterval[]
): readonly NormalizedInterval[] {
  if (intervals.length > MAX_REFERRAL_PAID_BLOCKING_INTERVALS) {
    return invalid('paid blocking interval bound exceeded.');
  }
  const sorted = intervals
    .map((interval) => {
      assertCommercialIdentifier(interval.sourceEntityId, 'sourceEntityId');
      if (interval.kind !== 'COVERAGE' && interval.kind !== 'GRACE') {
        return invalid('paid blocking interval kind is invalid.');
      }
      const start = referralTimestampToEpochMicroseconds(
        interval.startsAt,
        'startsAt'
      );
      const end = referralTimestampToEpochMicroseconds(interval.endsAt, 'endsAt');
      if (start >= end) {
        return invalid('paid blocking interval is invalid.');
      }
      return { start, end };
    })
    .sort((left, right) => {
      const byStart = compareBigInt(left.start, right.start);
      return byStart === 0 ? compareBigInt(left.end, right.end) : byStart;
    });

  const merged: Array<{ start: bigint; end: bigint }> = [];
  for (const interval of sorted) {
    const current = merged.at(-1);
    if (current !== undefined && interval.start <= current.end) {
      if (interval.end > current.end) {
        current.end = interval.end;
      }
      continue;
    }
    merged.push({ ...interval });
  }
  return Object.freeze(merged.map((interval) => Object.freeze(interval)));
}

function normalizeRewards(
  rewards: readonly ReferralTimeBankRewardInput[]
): readonly NormalizedReward[] {
  if (rewards.length > MAX_REFERRAL_TIME_BANK_REWARDS) {
    return invalid('Referral reward settlement bound exceeded.');
  }
  const seen = new Set<string>();
  const normalized = rewards.map((reward) => {
    const referralRewardId = assertCommercialIdentifier(
      reward.referralRewardId,
      'referralRewardId'
    );
    if (seen.has(referralRewardId)) {
      return invalid('Referral reward identity is duplicated.');
    }
    seen.add(referralRewardId);
    const state = assertReferralRewardState(reward.state);
    const maturesAt = assertReferralTimestamp(reward.maturesAt, 'maturesAt');
    const admittedAt = assertReferralTimestamp(reward.admittedAt, 'admittedAt');
    const earnedDurationUs = assertReferralDurationMicroseconds(
      reward.earnedDurationUs,
      'earnedDurationUs'
    );
    const appliedDurationUs = assertReferralDurationMicroseconds(
      reward.appliedDurationUs,
      'appliedDurationUs'
    );
    const consumedDurationUs = assertReferralDurationMicroseconds(
      reward.consumedDurationUs,
      'consumedDurationUs'
    );
    const revokedDurationUs = assertReferralDurationMicroseconds(
      reward.revokedDurationUs,
      'revokedDurationUs'
    );
    const earnedDuration = BigInt(earnedDurationUs);
    if (
      earnedDuration > BigInt(REFERRAL_REWARD_DURATION_US) ||
      BigInt(appliedDurationUs) > earnedDuration ||
      BigInt(consumedDurationUs) + BigInt(revokedDurationUs) > earnedDuration
    ) {
      return invalid('Referral reward duration shape is invalid.');
    }
    if (state === 'PENDING' && earnedDuration !== 0n) {
      return invalid('Pending Referral reward cannot contain earned duration.');
    }
    if (state !== 'PENDING' && earnedDuration !== BigInt(REFERRAL_REWARD_DURATION_US)) {
      return invalid('Mature Referral reward duration is invalid.');
    }
    const revokedAt =
      reward.revokedAt === null
        ? null
        : assertReferralTimestamp(reward.revokedAt, 'revokedAt');
    if ((state === 'REVOKED') !== (revokedAt !== null)) {
      return invalid('Referral reward revocation shape is invalid.');
    }
    return {
      ...reward,
      referralRewardId,
      state,
      maturesAt,
      admittedAt,
      earnedDurationUs,
      appliedDurationUs,
      consumedDurationUs,
      revokedDurationUs,
      sourceRevision: assertCommercialRevision(reward.sourceRevision),
      maturesAtUs: referralTimestampToEpochMicroseconds(maturesAt, 'maturesAt'),
      admittedAtUs: referralTimestampToEpochMicroseconds(admittedAt, 'admittedAt'),
      revokedAtUs:
        revokedAt === null
          ? null
          : referralTimestampToEpochMicroseconds(revokedAt, 'revokedAt'),
      earnedDuration
    };
  });
  return Object.freeze(
    normalized.sort((left, right) => {
      const byMaturity = compareBigInt(left.maturesAtUs, right.maturesAtUs);
      if (byMaturity !== 0) {
        return byMaturity;
      }
      const byAdmission = compareBigInt(left.admittedAtUs, right.admittedAtUs);
      return byAdmission === 0
        ? left.referralRewardId.localeCompare(right.referralRewardId)
        : byAdmission;
    })
  );
}

function segmentId(
  commercialAuthorityId: string,
  referralRewardId: string,
  start: bigint,
  end: bigint
): string {
  const digest = createHash('sha256')
    .update(`${commercialAuthorityId}\u0000${referralRewardId}\u0000${start}\u0000${end}`)
    .digest('hex');
  return `refseg_${digest}`;
}

function isPaidAt(
  intervals: readonly NormalizedInterval[],
  instant: bigint
): boolean {
  return intervals.some(
    (interval) => interval.start <= instant && instant < interval.end
  );
}

function paidIntervalAt(
  intervals: readonly NormalizedInterval[],
  instant: bigint
): NormalizedInterval | null {
  return (
    intervals.find(
      (interval) => interval.start <= instant && instant < interval.end
    ) ?? null
  );
}

function firstAvailableReward(
  rewards: readonly NormalizedReward[],
  allocated: ReadonlyMap<string, bigint>,
  instant: bigint
): NormalizedReward | null {
  return (
    rewards.find((reward) => {
      const consumed = allocated.get(reward.referralRewardId) ?? 0n;
      return (
        reward.earnedDuration > consumed &&
        reward.maturesAtUs <= instant &&
        (reward.revokedAtUs === null || instant < reward.revokedAtUs)
      );
    }) ?? null
  );
}

export function settleReferralTimeBank(input: {
  readonly commercialAuthorityId: string;
  readonly sourceRevision: string;
  readonly asOf: string;
  readonly rewards: readonly ReferralTimeBankRewardInput[];
  readonly paidBlockingIntervals: readonly ReferralPaidBlockingInterval[];
}): ReferralTimeBankSettlement {
  const commercialAuthorityId = assertCommercialIdentifier(
    input.commercialAuthorityId,
    'commercialAuthorityId'
  );
  const sourceRevision = assertCommercialRevision(input.sourceRevision);
  const asOf = assertReferralTimestamp(input.asOf, 'asOf');
  const asOfUs = referralTimestampToEpochMicroseconds(asOf, 'asOf');
  const rewards = normalizeRewards(input.rewards);
  const paidIntervals = mergePaidIntervals(input.paidBlockingIntervals);
  const allocatable = rewards.filter(
    (reward) =>
      reward.state !== 'PENDING' &&
      reward.earnedDuration > 0n &&
      // A D4A pre-consumption reversal has no application provenance. It must
      // remain fully revoked rather than being retroactively replayed as time
      // that had consumed between maturity and revocation.
      (reward.state !== 'REVOKED' ||
        BigInt(reward.appliedDurationUs) > 0n ||
        BigInt(reward.consumedDurationUs) > 0n)
  );
  const allocated = new Map<string, bigint>(
    allocatable.map((reward) => [reward.referralRewardId, 0n])
  );
  const segments: ReferralConsumptionSegmentPlan[] = [];
  let currentReward: NormalizedReward | null = null;
  let currentStart: bigint | null = null;
  let currentElapsed = 0n;
  let cursor = minimum(
    allocatable
      .filter(
        (reward) =>
          reward.revokedAtUs === null || reward.maturesAtUs < reward.revokedAtUs
      )
      .map((reward) => reward.maturesAtUs)
  );

  while (cursor !== null && cursor < asOfUs) {
    const paid = paidIntervalAt(paidIntervals, cursor);
    if (paid !== null) {
      cursor = paid.end;
      continue;
    }

    const reward = firstAvailableReward(allocatable, allocated, cursor);
    if (reward === null) {
      const nextMaturity = minimum(
        allocatable
          .filter((candidate) => {
            const consumed = allocated.get(candidate.referralRewardId) ?? 0n;
            return (
              candidate.earnedDuration > consumed &&
              candidate.maturesAtUs > cursor! &&
              (candidate.revokedAtUs === null ||
                candidate.maturesAtUs < candidate.revokedAtUs)
            );
          })
          .map((candidate) => candidate.maturesAtUs)
      );
      cursor = nextMaturity === null || nextMaturity > asOfUs ? asOfUs : nextMaturity;
      continue;
    }

    const consumed = allocated.get(reward.referralRewardId) ?? 0n;
    const remaining = reward.earnedDuration - consumed;
    const nextPaidStart = minimum(
      paidIntervals
        .filter((interval) => interval.start > cursor!)
        .map((interval) => interval.start)
    );
    const exhaustion = cursor + remaining;
    const boundaries = [asOfUs, exhaustion];
    if (nextPaidStart !== null) {
      boundaries.push(nextPaidStart);
    }
    if (reward.revokedAtUs !== null) {
      boundaries.push(reward.revokedAtUs);
    }
    const end = minimum(boundaries);
    if (end === null || end <= cursor) {
      return invalid('Referral settlement did not advance.');
    }
    const materialBoundary =
      end === exhaustion ||
      end === nextPaidStart ||
      end === reward.revokedAtUs;

    if (end === asOfUs && !materialBoundary) {
      currentReward = reward;
      currentStart = cursor;
      currentElapsed = end - cursor;
      break;
    }

    const duration = end - cursor;
    allocated.set(reward.referralRewardId, consumed + duration);
    segments.push(
      Object.freeze({
        referralConsumptionSegmentId: segmentId(
          commercialAuthorityId,
          reward.referralRewardId,
          cursor,
          end
        ),
        referralRewardId: reward.referralRewardId,
        consumedFrom: referralEpochMicrosecondsToTimestamp(cursor),
        consumedUntil: referralEpochMicrosecondsToTimestamp(end),
        consumedDurationUs: duration.toString()
      })
    );
    if (segments.length > MAX_REFERRAL_TIME_BANK_SEGMENTS) {
      return invalid('Referral consumption segment bound exceeded.');
    }
    cursor = end;
  }

  if (currentReward === null && !isPaidAt(paidIntervals, asOfUs)) {
    const reward = firstAvailableReward(allocatable, allocated, asOfUs);
    if (reward !== null) {
      currentReward = reward;
      currentStart = asOfUs;
      currentElapsed = 0n;
    }
  }

  const settlements = rewards.map((reward): ReferralRewardSettlement => {
    if (reward.state === 'PENDING') {
      return Object.freeze({
        referralRewardId: reward.referralRewardId,
        state: reward.state,
        appliedAt: reward.appliedAt,
        appliedDurationUs: reward.appliedDurationUs,
        consumedDurationUs: reward.consumedDurationUs,
        revokedDurationUs: reward.revokedDurationUs,
        activeConsumptionStartedAt: reward.activeConsumptionStartedAt
      });
    }
    const consumed = allocated.get(reward.referralRewardId) ?? 0n;
    const isCurrent = currentReward?.referralRewardId === reward.referralRewardId;
    const hasApplied =
      reward.state === 'APPLIED' ||
      (reward.state === 'REVOKED' && BigInt(reward.appliedDurationUs) > 0n) ||
      consumed > 0n ||
      isCurrent;
    const state: ReferralRewardState =
      reward.state === 'REVOKED'
        ? 'REVOKED'
        : hasApplied
          ? 'APPLIED'
          : 'EARNED';
    const firstSegment = segments.find(
      (segment) => segment.referralRewardId === reward.referralRewardId
    );
    const applicationBoundary = firstSegment?.consumedFrom ??
      (isCurrent && currentStart !== null
        ? referralEpochMicrosecondsToTimestamp(currentStart)
        : null);
    return Object.freeze({
      referralRewardId: reward.referralRewardId,
      state,
      appliedAt: reward.appliedAt ?? (hasApplied ? applicationBoundary : null),
      appliedDurationUs: hasApplied
        ? reward.earnedDuration.toString()
        : reward.appliedDurationUs,
      consumedDurationUs: consumed.toString(),
      revokedDurationUs:
        state === 'REVOKED'
          ? (reward.earnedDuration - consumed).toString()
          : '0',
      activeConsumptionStartedAt:
        isCurrent && currentStart !== null
          ? referralEpochMicrosecondsToTimestamp(currentStart)
          : null
    });
  });

  let currentEffectiveUntil: string | null = null;
  if (currentReward !== null && currentStart !== null) {
    const consumed = allocated.get(currentReward.referralRewardId) ?? 0n;
    const remainingAtAsOf =
      currentReward.earnedDuration - consumed - currentElapsed;
    const exhaustionAt = asOfUs + remainingAtAsOf;
    const nextPaidStart = minimum(
      paidIntervals
        .filter((interval) => interval.start > asOfUs)
        .map((interval) => interval.start)
    );
    currentEffectiveUntil = referralEpochMicrosecondsToTimestamp(
      nextPaidStart !== null && nextPaidStart < exhaustionAt
        ? nextPaidStart
        : exhaustionAt
    );
  }

  const queuedDuration = settlements.reduce((total, settlement) => {
    if (settlement.state === 'PENDING' || settlement.state === 'REVOKED') {
      return total;
    }
    const reward = rewards.find(
      (candidate) => candidate.referralRewardId === settlement.referralRewardId
    );
    if (reward === undefined) {
      return total;
    }
    let remaining =
      reward.earnedDuration -
      BigInt(settlement.consumedDurationUs) -
      BigInt(settlement.revokedDurationUs);
    if (currentReward?.referralRewardId === settlement.referralRewardId) {
      remaining -= currentElapsed;
    }
    return total + (remaining > 0n ? remaining : 0n);
  }, 0n);

  const paidAtAsOf = paidIntervalAt(paidIntervals, asOfUs);
  const futureMaturity = minimum(
    rewards
      .filter((reward) => reward.state === 'PENDING' && reward.maturesAtUs > asOfUs)
      .map((reward) => reward.maturesAtUs)
  );
  const futurePaidStart = minimum(
    paidIntervals
      .filter((interval) => interval.start > asOfUs)
      .map((interval) => interval.start)
  );
  const nextBoundaries: bigint[] = [];
  if (paidAtAsOf !== null) {
    nextBoundaries.push(paidAtAsOf.end);
  }
  if (futureMaturity !== null) {
    nextBoundaries.push(futureMaturity);
  }
  if (futurePaidStart !== null) {
    nextBoundaries.push(futurePaidStart);
  }
  if (currentEffectiveUntil !== null) {
    nextBoundaries.push(
      referralTimestampToEpochMicroseconds(
        currentEffectiveUntil,
        'currentEffectiveUntil'
      )
    );
  }
  const nextEvaluation = minimum(
    nextBoundaries.filter((boundary) => boundary > asOfUs)
  );

  return Object.freeze({
    rewards: Object.freeze(settlements),
    segments: Object.freeze(segments),
    source: Object.freeze({
      commercialAuthorityId,
      sourceRevision,
      evaluatedAt: asOf,
      paidActive: paidAtAsOf !== null,
      currentReferralRewardId: currentReward?.referralRewardId ?? null,
      currentEffectiveFrom:
        currentStart === null
          ? null
          : referralEpochMicrosecondsToTimestamp(currentStart),
      currentEffectiveUntil,
      queuedReferralDurationUs: queuedDuration.toString(),
      nextEvaluationAt:
        nextEvaluation === null
          ? null
          : referralEpochMicrosecondsToTimestamp(nextEvaluation)
    })
  });
}
