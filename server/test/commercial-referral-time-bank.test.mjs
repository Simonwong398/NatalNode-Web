import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  ENTITLEMENT_EVALUATOR_POLICY_VERSION,
  REFERRAL_REWARD_DURATION_US,
  PostgresReferralTimeBankReconciliation,
  assessEntitlementProjectionFreshness,
  createEntitlementProjection,
  evaluateEffectiveEntitlement,
  evaluateEntitlementCapability,
  referralEpochMicrosecondsToTimestamp,
  referralTimestampToEpochMicroseconds,
  settleReferralTimeBank
} from '../dist/index.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('server/db/migrations/', REPOSITORY_ROOT)
);
const AUTHORITY_ID = 'authority-a';
const OWNER_ID = 'owner-a';
const DAY_US = 86_400_000_000n;
const REWARD_US = BigInt(REFERRAL_REWARD_DURATION_US);
const BASE_US = referralTimestampToEpochMicroseconds(
  '2025-01-01T00:00:00.000000Z',
  'base'
);

function at(day = 0, microseconds = 0n) {
  return referralEpochMicrosecondsToTimestamp(
    BASE_US + BigInt(day) * DAY_US + microseconds
  );
}

function preciseTimestamp(value) {
  if (value === null) return null;
  const timestamp = value.replace(/Z$/u, '');
  const [whole, fraction = ''] = timestamp.split('.');
  return `${whole}.${fraction.padEnd(6, '0')}Z`;
}

function preciseAt(day = 0, microseconds = 0n) {
  return preciseTimestamp(at(day, microseconds));
}

function days(value) {
  return (BigInt(value) * DAY_US).toString();
}

function reward({
  id = 'reward-a',
  state = 'EARNED',
  maturityDay = 0,
  admittedDay = -14,
  earnedAt = state === 'PENDING' ? null : at(maturityDay),
  appliedAt = state === 'APPLIED' ? at(maturityDay) : null,
  revokedAt = null,
  consumedDurationUs = '0',
  activeConsumptionStartedAt = null,
  sourceRevision = '3'
} = {}) {
  const earned = state === 'PENDING' ? '0' : REFERRAL_REWARD_DURATION_US;
  const applied =
    state === 'APPLIED' ||
    (state === 'REVOKED' && (appliedAt !== null || consumedDurationUs !== '0'))
      ? REFERRAL_REWARD_DURATION_US
      : '0';
  return Object.freeze({
    referralRewardId: id,
    state,
    maturesAt: at(maturityDay),
    admittedAt: at(admittedDay),
    earnedAt,
    appliedAt,
    revokedAt,
    earnedDurationUs: earned,
    appliedDurationUs: applied,
    consumedDurationUs,
    revokedDurationUs:
      state === 'REVOKED'
        ? (REWARD_US - BigInt(consumedDurationUs)).toString()
        : '0',
    activeConsumptionStartedAt,
    sourceRevision
  });
}

function postgresRewardRoundTrip(input) {
  return Object.freeze({
    ...input,
    maturesAt: preciseTimestamp(input.maturesAt),
    admittedAt: preciseTimestamp(input.admittedAt),
    earnedAt: preciseTimestamp(input.earnedAt),
    appliedAt: preciseTimestamp(input.appliedAt),
    revokedAt: preciseTimestamp(input.revokedAt),
    activeConsumptionStartedAt: preciseTimestamp(
      input.activeConsumptionStartedAt
    )
  });
}

function postgresSegmentRoundTrip(segment) {
  return Object.freeze({
    ...segment,
    consumedFrom: preciseTimestamp(segment.consumedFrom),
    consumedUntil: preciseTimestamp(segment.consumedUntil)
  });
}

function paid(startDay, endDay, {
  id = `paid-${startDay}-${endDay}`,
  kind = 'COVERAGE',
  startMicroseconds = 0n,
  endMicroseconds = 0n
} = {}) {
  return Object.freeze({
    sourceEntityId: id,
    kind,
    startsAt: at(startDay, startMicroseconds),
    endsAt: at(endDay, endMicroseconds)
  });
}

function settle({
  asOfDay,
  asOfMicroseconds = 0n,
  rewards = [reward()],
  blockers = [],
  sourceRevision = '3'
}) {
  return settleReferralTimeBank({
    commercialAuthorityId: AUTHORITY_ID,
    sourceRevision,
    asOf: at(asOfDay, asOfMicroseconds),
    rewards,
    paidBlockingIntervals: blockers
  });
}

function activeElapsed(result) {
  if (result.source.currentEffectiveFrom === null) {
    return 0n;
  }
  return (
    referralTimestampToEpochMicroseconds(result.source.evaluatedAt, 'evaluatedAt') -
    referralTimestampToEpochMicroseconds(
      result.source.currentEffectiveFrom,
      'currentEffectiveFrom'
    )
  );
}

test('matured reward applies lazily, remains APPLIED, and ordinary replay is deterministic', () => {
  const first = settle({ asOfDay: 5 });
  assert.equal(first.rewards[0].state, 'APPLIED');
  assert.equal(first.rewards[0].appliedAt, preciseAt(5));
  assert.equal(first.rewards[0].activeConsumptionStartedAt, at(0));
  assert.equal(first.rewards[0].consumedDurationUs, '0');
  assert.equal(first.source.currentReferralRewardId, 'reward-a');
  assert.equal(first.source.queuedReferralDurationUs, days(25));
  assert.equal(first.source.currentEffectiveUntil, at(30));
  assert.deepEqual(settle({ asOfDay: 5 }), first);
});

test('late catch-up separates application time from the historical consumption start', () => {
  const lateReward = reward({
    maturityDay: 0,
    earnedAt: at(3)
  });
  const settled = settle({
    asOfDay: 5,
    rewards: [lateReward]
  });
  const application = settled.rewards[0];

  assert.equal(application.state, 'APPLIED');
  assert.equal(lateReward.maturesAt, at(0));
  assert.equal(lateReward.earnedAt, at(3));
  assert.equal(application.appliedAt, preciseAt(5));
  assert.equal(application.activeConsumptionStartedAt, at(0));
  assert.ok(
    referralTimestampToEpochMicroseconds(lateReward.maturesAt, 'maturesAt') <
      referralTimestampToEpochMicroseconds(lateReward.earnedAt, 'earnedAt')
  );
  assert.ok(
    referralTimestampToEpochMicroseconds(lateReward.earnedAt, 'earnedAt') <=
      referralTimestampToEpochMicroseconds(application.appliedAt, 'appliedAt')
  );
  assert.ok(
    referralTimestampToEpochMicroseconds(application.activeConsumptionStartedAt, 'activeConsumptionStartedAt') <
      referralTimestampToEpochMicroseconds(application.appliedAt, 'appliedAt')
  );
  assert.equal(application.appliedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(application.consumedDurationUs, '0');
  assert.equal(application.revokedDurationUs, '0');
});

test('immediate application keeps application and active-start timestamps equal', () => {
  const settled = settle({ asOfDay: 0 });
  const application = settled.rewards[0];

  assert.equal(application.state, 'APPLIED');
  assert.equal(application.appliedAt, preciseAt(0));
  assert.equal(application.activeConsumptionStartedAt, at(0));
});

test('Paid and grace block maturation consumption and Referral starts at exact Paid end', () => {
  for (const kind of ['COVERAGE', 'GRACE']) {
    const blocked = settle({
      asOfDay: 5,
      blockers: [paid(-1, 10, { kind, id: `${kind.toLowerCase()}-a` })]
    });
    assert.equal(blocked.rewards[0].state, 'EARNED');
    assert.equal(blocked.rewards[0].consumedDurationUs, '0');
    assert.equal(blocked.source.paidActive, true);
    assert.equal(blocked.source.currentReferralRewardId, null);
    assert.equal(blocked.source.queuedReferralDurationUs, REFERRAL_REWARD_DURATION_US);
    assert.equal(blocked.source.nextEvaluationAt, at(10));

    const resumed = settle({
      asOfDay: 10,
      blockers: [paid(-1, 10, { kind, id: `${kind.toLowerCase()}-a` })]
    });
    assert.equal(resumed.source.paidActive, false);
    assert.equal(resumed.source.currentReferralRewardId, 'reward-a');
    assert.equal(resumed.source.currentEffectiveFrom, at(10));
  }
});

test('Paid wins at exact maturity start and Referral starts when Paid ends at maturity', () => {
  const paidStarts = settle({ asOfDay: 0, blockers: [paid(0, 10)] });
  assert.equal(paidStarts.source.paidActive, true);
  assert.equal(paidStarts.source.currentReferralRewardId, null);

  const paidEnds = settle({ asOfDay: 0, blockers: [paid(-10, 0)] });
  assert.equal(paidEnds.source.paidActive, false);
  assert.equal(paidEnds.source.currentReferralRewardId, 'reward-a');
  assert.equal(paidEnds.source.currentEffectiveFrom, at(0));
});

test('Referral pauses at Paid start, preserves five consumed days, and resumes at Paid end', () => {
  const paused = settle({ asOfDay: 10, blockers: [paid(5, 15)] });
  assert.equal(paused.rewards[0].state, 'APPLIED');
  assert.equal(paused.rewards[0].consumedDurationUs, days(5));
  assert.equal(paused.rewards[0].activeConsumptionStartedAt, null);
  assert.equal(paused.source.queuedReferralDurationUs, days(25));
  assert.deepEqual(
    paused.segments.map(({ consumedFrom, consumedUntil }) => [
      consumedFrom,
      consumedUntil
    ]),
    [[at(0), at(5)]]
  );

  const resumed = settle({ asOfDay: 20, blockers: [paid(5, 15)] });
  assert.equal(resumed.rewards[0].consumedDurationUs, days(5));
  assert.equal(resumed.source.currentEffectiveFrom, at(15));
  assert.equal(activeElapsed(resumed), 5n * DAY_US);
  assert.equal(resumed.source.queuedReferralDurationUs, days(20));
});

test('reward ordering and long-offline catch-up hand off without overlap or gap', () => {
  const rewards = [
    reward({ id: 'reward-b', maturityDay: 0, admittedDay: -14 }),
    reward({ id: 'reward-a', maturityDay: -28, admittedDay: -42 })
  ];
  const result = settle({ asOfDay: 10, rewards });
  assert.equal(result.rewards.find(({ referralRewardId }) => referralRewardId === 'reward-a').consumedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(result.source.currentReferralRewardId, 'reward-b');
  assert.equal(result.source.currentEffectiveFrom, at(2));
  assert.equal(activeElapsed(result), 8n * DAY_US);
  assert.deepEqual(
    result.segments.map(({ referralRewardId, consumedFrom, consumedUntil }) => [
      referralRewardId,
      consumedFrom,
      consumedUntil
    ]),
    [['reward-a', at(-28), at(2)]]
  );
});

test('equal maturity orders by admission then reward id', () => {
  const byAdmission = settle({
    asOfDay: 31,
    rewards: [
      reward({ id: 'reward-later', admittedDay: -13 }),
      reward({ id: 'reward-earlier', admittedDay: -14 })
    ]
  });
  assert.equal(byAdmission.segments[0].referralRewardId, 'reward-earlier');
  assert.equal(byAdmission.source.currentReferralRewardId, 'reward-later');

  const byId = settle({
    asOfDay: 31,
    rewards: [reward({ id: 'reward-b' }), reward({ id: 'reward-a' })]
  });
  assert.equal(byId.segments[0].referralRewardId, 'reward-a');
  assert.equal(byId.source.currentReferralRewardId, 'reward-b');
});

test('unused earned reward has no expiry after more than one year of Paid', () => {
  const result = settle({ asOfDay: 366, blockers: [paid(0, 366)] });
  assert.equal(result.rewards[0].state, 'APPLIED');
  assert.equal(result.rewards[0].consumedDurationUs, '0');
  assert.equal(result.source.currentEffectiveFrom, at(366));
  assert.equal(result.source.queuedReferralDurationUs, REFERRAL_REWARD_DURATION_US);
});

test('late Paid overlap restores exact Referral time and replay reallocates across rewards', () => {
  const oneReward = settle({ asOfDay: 10, blockers: [paid(5, 10)] });
  assert.equal(oneReward.rewards[0].consumedDurationUs, days(5));
  assert.equal(oneReward.source.queuedReferralDurationUs, days(25));

  const twoRewards = settle({
    asOfDay: 10,
    rewards: [
      reward({ id: 'reward-a', maturityDay: -28, admittedDay: -42 }),
      reward({ id: 'reward-b', maturityDay: 0, admittedDay: -14 })
    ],
    blockers: [paid(0, 5)]
  });
  const a = twoRewards.rewards.find(({ referralRewardId }) => referralRewardId === 'reward-a');
  const b = twoRewards.rewards.find(({ referralRewardId }) => referralRewardId === 'reward-b');
  assert.equal(a.consumedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(b.consumedDurationUs, '0');
  assert.equal(twoRewards.source.currentReferralRewardId, 'reward-b');
  assert.equal(twoRewards.source.currentEffectiveFrom, at(7));
  assert.equal(activeElapsed(twoRewards), 3n * DAY_US);
  assert.deepEqual(
    twoRewards.segments.map(({ referralRewardId, consumedFrom, consumedUntil }) => [
      referralRewardId,
      consumedFrom,
      consumedUntil
    ]),
    [
      ['reward-a', at(-28), at(0)],
      ['reward-a', at(5), at(7)]
    ]
  );
});

test('partial, full, and restore-then-reverse settlement preserve only legitimate consumption', () => {
  const partial = settle({
    asOfDay: 12,
    rewards: [
      reward({
        state: 'REVOKED',
        appliedAt: at(0),
        revokedAt: at(12),
        consumedDurationUs: days(12)
      })
    ]
  });
  assert.equal(partial.rewards[0].state, 'REVOKED');
  assert.equal(partial.rewards[0].consumedDurationUs, days(12));
  assert.equal(partial.rewards[0].revokedDurationUs, days(18));
  assert.equal(partial.rewards[0].activeConsumptionStartedAt, null);

  const full = settle({
    asOfDay: 31,
    rewards: [
      reward({
        state: 'REVOKED',
        appliedAt: at(0),
        revokedAt: at(31),
        consumedDurationUs: REFERRAL_REWARD_DURATION_US
      })
    ]
  });
  assert.equal(full.rewards[0].consumedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(full.rewards[0].revokedDurationUs, '0');

  const corrected = settle({
    asOfDay: 12,
    rewards: [
      reward({
        state: 'REVOKED',
        appliedAt: at(0),
        revokedAt: at(12),
        consumedDurationUs: days(12)
      })
    ],
    blockers: [paid(4, 8)]
  });
  assert.equal(corrected.rewards[0].consumedDurationUs, days(8));
  assert.equal(corrected.rewards[0].revokedDurationUs, days(22));
});

test('pre-consumption D4A reversal never becomes retroactive consumption', () => {
  const result = settle({
    asOfDay: 20,
    rewards: [
      reward({
        state: 'REVOKED',
        revokedAt: at(12),
        appliedAt: null,
        consumedDurationUs: '0'
      })
    ]
  });
  assert.equal(result.rewards[0].consumedDurationUs, '0');
  assert.equal(result.rewards[0].revokedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(result.segments.length, 0);
});

test('microsecond Paid boundaries are half-open with no missing or doubled unit', () => {
  const result = settle({
    asOfDay: 0,
    asOfMicroseconds: 4n,
    blockers: [
      paid(0, 0, {
        id: 'micro-paid',
        startMicroseconds: 1n,
        endMicroseconds: 3n
      })
    ]
  });
  assert.equal(result.segments.length, 1);
  assert.equal(result.segments[0].consumedFrom, at(0));
  assert.equal(result.segments[0].consumedUntil, at(0, 1n));
  assert.equal(result.segments[0].consumedDurationUs, '1');
  assert.equal(result.source.currentEffectiveFrom, at(0, 3n));
  assert.equal(activeElapsed(result), 1n);
  assert.equal(result.source.queuedReferralDurationUs, (REWARD_US - 2n).toString());

  const graceEnd = settle({
    asOfDay: 0,
    asOfMicroseconds: 3n,
    blockers: [
      paid(0, 0, {
        id: 'micro-grace',
        kind: 'GRACE',
        startMicroseconds: 1n,
        endMicroseconds: 3n
      })
    ]
  });
  assert.equal(graceEnd.source.paidActive, false);
  assert.equal(graceEnd.source.currentEffectiveFrom, at(0, 3n));
  assert.equal(graceEnd.segments[0].consumedDurationUs, '1');
});

test('reward exhaustion at exact Paid start consumes once and leaves Paid active', () => {
  const result = settle({ asOfDay: 30, blockers: [paid(30, 40)] });
  assert.equal(result.rewards[0].consumedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(result.rewards[0].activeConsumptionStartedAt, null);
  assert.equal(result.source.paidActive, true);
  assert.equal(result.source.currentReferralRewardId, null);
  assert.equal(result.segments.length, 1);
  assert.equal(result.segments[0].consumedUntil, at(30));
});

function paidRelationship(overrides = {}) {
  return {
    paidRelationshipId: 'relationship-a',
    commercialAuthorityId: AUTHORITY_ID,
    providerNamespace: null,
    providerContext: null,
    providerRelationshipRef: null,
    billingInterval: 'MONTHLY',
    lifecycleState: 'ACTIVE',
    renewalIntent: 'ENABLED',
    currentPeriodStart: at(0),
    currentPeriodEnd: at(10),
    graceStartedAt: null,
    graceUntil: null,
    failedRenewalIdentity: null,
    endedAt: null,
    endReason: null,
    lastReconciledEventId: 'event-paid',
    sourceRevision: '3',
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides
  };
}

function paidCoverage(overrides = {}) {
  return {
    paidCoverageId: 'coverage-a',
    paidRelationshipId: 'relationship-a',
    commercialAuthorityId: AUTHORITY_ID,
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-a',
    billingInterval: 'MONTHLY',
    coverageStartAt: at(0),
    scheduledCoverageEndAt: at(10),
    effectiveCoverageEndAt: at(10),
    coverageState: 'VALID',
    successEventId: 'event-paid',
    reversalEventId: null,
    reversedAt: null,
    reversalReason: null,
    sourceRevision: '3',
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides
  };
}

function referralSource({
  evaluatedAt,
  paidActive = false,
  currentReferralRewardId = 'reward-a',
  currentEffectiveFrom = at(0),
  currentEffectiveUntil = at(30),
  queuedReferralDurationUs = days(25),
  nextEvaluationAt = currentEffectiveUntil
}) {
  return {
    commercialAuthorityId: AUTHORITY_ID,
    sourceRevision: '3',
    evaluatedAt,
    paidActive,
    currentReferralRewardId,
    currentEffectiveFrom,
    currentEffectiveUntil,
    queuedReferralDurationUs,
    nextEvaluationAt
  };
}

function evaluate({
  evaluatedAt = at(5),
  relationships = [],
  coverages = [],
  source = referralSource({ evaluatedAt })
} = {}) {
  return evaluateEffectiveEntitlement({
    commercialAuthorityId: AUTHORITY_ID,
    entitlementRevision: '3',
    evaluatedAt,
    paidBillingRelationships: relationships,
    paidCoverages: coverages,
    referralSource: source
  });
}

test('canonical evaluator enforces Paid > Referral > Free and Referral-backed Pro capabilities', () => {
  assert.equal(ENTITLEMENT_EVALUATOR_POLICY_VERSION, 'D4B_PAID_REFERRAL_V1');

  const referral = evaluate();
  assert.equal(referral.determination, 'DETERMINATE');
  assert.equal(referral.tier, 'PRO');
  assert.equal(referral.currentSourceClass, 'REFERRAL');
  assert.equal(referral.currentSourceEntityId, 'reward-a');
  assert.equal(referral.adFree, true);
  assert.equal(referral.vaultCapacityClass, 'PRO_UNLIMITED');
  assert.equal(referral.astrologyAlertsEligible, true);
  for (const capability of [
    'VAULT_UNLIMITED',
    'PERSONAL_TRANSITS',
    'ASTROLOGY_ALERTS',
    'ADVANCED_INTERPRETATION',
    'ADVANCED_EXPORT',
    'ADVANCED_WORKSPACE',
    'AD_FREE'
  ]) {
    assert.equal(evaluateEntitlementCapability(referral, capability), 'ALLOWED');
  }

  const paidResult = evaluate({
    relationships: [paidRelationship()],
    coverages: [paidCoverage()],
    source: referralSource({
      evaluatedAt: at(5),
      paidActive: true,
      currentReferralRewardId: null,
      currentEffectiveFrom: null,
      currentEffectiveUntil: null,
      queuedReferralDurationUs: REFERRAL_REWARD_DURATION_US,
      nextEvaluationAt: at(10)
    })
  });
  assert.equal(paidResult.determination, 'DETERMINATE');
  assert.equal(paidResult.currentSourceClass, 'PAID');

  const free = evaluate({
    source: referralSource({
      evaluatedAt: at(5),
      currentReferralRewardId: null,
      currentEffectiveFrom: null,
      currentEffectiveUntil: null,
      queuedReferralDurationUs: '0',
      nextEvaluationAt: null
    })
  });
  assert.equal(free.determination, 'DETERMINATE');
  assert.equal(free.tier, 'FREE');

  const conflict = evaluate({
    relationships: [paidRelationship()],
    coverages: [paidCoverage()]
  });
  assert.equal(conflict.determination, 'INDETERMINATE');
  assert.equal(conflict.reasonClass, 'INVALID_SOURCE_STATE');
});

test('canonical evaluator preserves microsecond boundaries and earliest next evaluation', () => {
  const evaluatedAt = at(0, 1n);
  const result = evaluate({
    evaluatedAt,
    source: referralSource({
      evaluatedAt,
      currentEffectiveFrom: at(0, 1n),
      currentEffectiveUntil: at(0, 3n),
      queuedReferralDurationUs: (REWARD_US - 1n).toString(),
      nextEvaluationAt: at(0, 3n)
    })
  });
  assert.equal(result.determination, 'DETERMINATE');
  assert.equal(result.effectiveFrom, at(0, 1n));
  assert.equal(result.effectiveUntil, at(0, 3n));
  assert.equal(result.nextEvaluationAt, at(0, 3n));
});

test('old evaluator projection is stale and D4B projection keeps authority revision', () => {
  const evaluation = evaluate();
  assert.equal(evaluation.determination, 'DETERMINATE');
  const projection = createEntitlementProjection(evaluation, at(5));
  assert.equal(projection.sourceRevision, '3');
  assert.equal(projection.evaluatorPolicyVersion, 'D4B_PAID_REFERRAL_V1');
  assert.equal(
    assessEntitlementProjectionFreshness(
      { ...projection, evaluatorPolicyVersion: 'D3_PAID_V1' },
      '3',
      at(5)
    ),
    'STALE'
  );
});

function rewardRecord(input) {
  const remaining =
    input.state === 'REVOKED'
      ? 0n
      : REWARD_US - BigInt(input.consumedDurationUs);
  return Object.freeze({
    referralRewardId: input.referralRewardId,
    referrerAuthorityId: AUTHORITY_ID,
    referralAttributionId: `attribution-${input.referralRewardId}`,
    qualifyingPaidCoverageId: `qualifying-${input.referralRewardId}`,
    state: input.state,
    qualifyingPaymentAt: at(-14),
    admittedAt: input.admittedAt,
    maturesAt: input.maturesAt,
    earnedAt: input.earnedAt,
    appliedAt: input.appliedAt,
    revokedAt: input.revokedAt,
    grantedDurationUs: REFERRAL_REWARD_DURATION_US,
    earnedDurationUs: input.earnedDurationUs,
    appliedDurationUs: input.appliedDurationUs,
    consumedDurationUs: input.consumedDurationUs,
    revokedDurationUs: input.revokedDurationUs,
    remainingUnconsumedDurationUs: remaining.toString(),
    availableDurationUs: remaining.toString(),
    activeConsumptionStartedAt: input.activeConsumptionStartedAt,
    revocationReason: input.state === 'REVOKED' ? 'QUALIFYING_PURCHASE_REVERSED' : null,
    reversalEventId: input.state === 'REVOKED' ? 'reversal-a' : null,
    pendingEventId: 'pending-a',
    maturationEventId: 'maturation-a',
    applicationEventId: input.appliedAt === null ? null : 'application-a',
    sourceRevision: input.sourceRevision,
    createdAt: at(-14),
    updatedAt: at(0)
  });
}

function reconciliationHarness({
  inputReward = reward(),
  blockers = [],
  segments = [],
  postgresTimestampRoundTrip = false
} = {}) {
  const persistedInputReward = postgresTimestampRoundTrip
    ? postgresRewardRoundTrip(inputReward)
    : inputReward;
  let authority = {
    commercialAuthorityId: AUTHORITY_ID,
    ownerId: OWNER_ID,
    entitlementRevision: persistedInputReward.sourceRevision,
    createdAt: at(-30),
    updatedAt: at(-30)
  };
  let loaded = {
    input: persistedInputReward,
    record: rewardRecord(persistedInputReward)
  };
  let storedSegments = postgresTimestampRoundTrip
    ? segments.map(postgresSegmentRoundTrip)
    : [...segments];
  let advances = 0;
  const events = [];
  const authorities = {
    async advanceRevisionAfterLock({ expectedRevision }) {
      assert.equal(expectedRevision, authority.entitlementRevision);
      advances += 1;
      authority = {
        ...authority,
        entitlementRevision: (BigInt(expectedRevision) + 1n).toString()
      };
      return authority;
    }
  };
  const eventRepository = {
    async appendIdempotent(draft) {
      events.push(draft);
      return { outcome: 'APPLIED', event: { ...draft } };
    }
  };
  const timeBank = {
    async listPaidBlockingIntervals() {
      return blockers;
    },
    async lockRewards() {
      return [loaded];
    },
    async lockSegments() {
      return storedSegments;
    },
    async updateReward(
      commercialAuthorityId,
      planned,
      applicationEventId,
      sourceRevision,
      revocation
    ) {
      assert.equal(commercialAuthorityId, AUTHORITY_ID);
      const nextInputDraft = {
        ...loaded.input,
        ...planned,
        revokedAt: revocation?.revokedAt ?? loaded.input.revokedAt,
        sourceRevision
      };
      const nextInput = postgresTimestampRoundTrip
        ? postgresRewardRoundTrip(nextInputDraft)
        : Object.freeze(nextInputDraft);
      loaded = {
        input: nextInput,
        record: Object.freeze({
          ...rewardRecord(nextInput),
          applicationEventId:
            loaded.record.applicationEventId ?? applicationEventId,
          revocationReason:
            revocation?.revocationReason ?? loaded.record.revocationReason,
          reversalEventId:
            revocation?.reversalEventId ?? loaded.record.reversalEventId
        })
      };
      return loaded.record;
    },
    async replaceSegments(commercialAuthorityId, nextSegments, sourceRevision) {
      assert.equal(commercialAuthorityId, AUTHORITY_ID);
      storedSegments = nextSegments.map((segment) => {
        const stored = { ...segment, sourceRevision };
        return postgresTimestampRoundTrip
          ? postgresSegmentRoundTrip(stored)
          : stored;
      });
    }
  };
  const service = new PostgresReferralTimeBankReconciliation(
    { query: async () => ({ rows: [] }) },
    authorities,
    eventRepository,
    timeBank
  );
  return {
    service,
    get authority() {
      return authority;
    },
    get reward() {
      return loaded.record;
    },
    get segments() {
      return storedSegments;
    },
    get advances() {
      return advances;
    },
    events
  };
}

test('material application advances once and exact canonical replay advances zero', async () => {
  const harness = reconciliationHarness();
  const first = await harness.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: harness.authority,
    asOf: at(1)
  });
  assert.equal(first.outcome, 'APPLIED');
  assert.equal(harness.reward.state, 'APPLIED');
  assert.equal(harness.reward.appliedAt, preciseAt(1));
  assert.equal(harness.advances, 1);
  const applicationEvent = harness.events.find(
    ({ eventType }) => eventType === 'REFERRAL_REWARD_APPLIED'
  );
  assert.ok(applicationEvent);
  assert.equal(applicationEvent.occurredAt, preciseAt(1));
  assert.equal(applicationEvent.effectiveAt, preciseAt(1));

  const replay = await harness.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: harness.authority,
    asOf: at(1)
  });
  assert.equal(replay.outcome, 'NO_OP');
  assert.equal(harness.advances, 1);
});

test('later-asOf replay remains durable NO_OP after PostgreSQL timestamp round-trip', async () => {
  const harness = reconciliationHarness({ postgresTimestampRoundTrip: true });
  const first = await harness.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: harness.authority,
    asOf: at(5)
  });
  assert.equal(first.outcome, 'APPLIED');
  assert.equal(harness.advances, 1);
  assert.equal(harness.reward.state, 'APPLIED');
  assert.equal(harness.reward.consumedDurationUs, '0');
  assert.equal(harness.segments.length, 0);
  assert.equal(first.source.queuedReferralDurationUs, days(25));
  assert.equal(first.source.nextEvaluationAt, at(30));

  const checkpoint = harness.reward.activeConsumptionStartedAt;
  const eventCount = harness.events.length;
  const replay = await harness.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: harness.authority,
    asOf: at(6)
  });

  assert.equal(replay.outcome, 'NO_OP');
  assert.equal(harness.advances, 1);
  assert.equal(harness.reward.state, 'APPLIED');
  assert.equal(harness.reward.activeConsumptionStartedAt, checkpoint);
  assert.equal(harness.reward.consumedDurationUs, '0');
  assert.equal(harness.segments.length, 0);
  assert.equal(harness.events.length, eventCount);
  assert.equal(replay.source.currentReferralRewardId, 'reward-a');
  assert.equal(replay.source.queuedReferralDurationUs, days(24));
  assert.equal(replay.source.currentEffectiveUntil, at(30));
  assert.equal(replay.source.nextEvaluationAt, at(30));
});

test('late application and Paid resume keep lifecycle and entitlement event times distinct', async () => {
  const blockers = [paid(5, 15)];
  const harness = reconciliationHarness({ blockers });

  const applied = await harness.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: harness.authority,
    asOf: at(10)
  });
  assert.equal(applied.outcome, 'APPLIED');
  assert.equal(harness.reward.state, 'APPLIED');
  assert.equal(harness.reward.appliedAt, preciseAt(10));
  assert.equal(harness.reward.activeConsumptionStartedAt, null);
  assert.deepEqual(
    harness.segments.map(({ consumedFrom, consumedUntil }) => [
      consumedFrom,
      consumedUntil
    ]),
    [[at(0), at(5)]]
  );

  const resumed = await harness.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: applied.authority,
    asOf: at(20)
  });
  assert.equal(resumed.outcome, 'APPLIED');
  assert.equal(harness.reward.appliedAt, preciseAt(10));
  assert.equal(harness.reward.activeConsumptionStartedAt, at(15));
  assert.ok(
    referralTimestampToEpochMicroseconds(harness.reward.appliedAt, 'appliedAt') <
      referralTimestampToEpochMicroseconds(
        harness.reward.activeConsumptionStartedAt,
        'activeConsumptionStartedAt'
      )
  );

  const applicationEvent = harness.events.find(
    ({ eventType }) => eventType === 'REFERRAL_REWARD_APPLIED'
  );
  const consumptionStartEvent = harness.events.find(
    ({ eventType }) => eventType === 'REFERRAL_REWARD_CONSUMPTION_STARTED'
  );
  assert.ok(applicationEvent);
  assert.ok(consumptionStartEvent);
  assert.equal(applicationEvent.occurredAt, preciseAt(10));
  assert.equal(applicationEvent.effectiveAt, preciseAt(10));
  assert.equal(consumptionStartEvent.occurredAt, preciseAt(20));
  assert.equal(consumptionStartEvent.effectiveAt, at(15));
});

test('late Paid correction and partial reversal each advance exactly once, then replay no-op', async () => {
  const oldSegment = {
    referralConsumptionSegmentId: 'old-segment',
    referralRewardId: 'reward-a',
    consumedFrom: at(0),
    consumedUntil: at(10),
    consumedDurationUs: days(10),
    sourceRevision: '3'
  };
  const correction = reconciliationHarness({
    inputReward: reward({
      state: 'APPLIED',
      appliedAt: at(0),
      consumedDurationUs: days(10)
    }),
    blockers: [paid(5, 10)],
    segments: [oldSegment],
    postgresTimestampRoundTrip: true
  });
  const corrected = await correction.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: correction.authority,
    asOf: at(10)
  });
  assert.equal(corrected.outcome, 'APPLIED');
  assert.equal(correction.reward.consumedDurationUs, days(5));
  assert.equal(correction.advances, 1);
  assert.equal(correction.segments.length, 1);
  assert.equal(correction.segments[0].consumedUntil, preciseAt(5));

  const correctionReplay = await correction.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: correction.authority,
    asOf: at(10)
  });
  assert.equal(correctionReplay.outcome, 'NO_OP');
  assert.equal(correction.advances, 1);

  const reversal = reconciliationHarness({
    inputReward: reward({ state: 'APPLIED', appliedAt: at(0) })
  });
  const reversed = await reversal.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: reversal.authority,
    asOf: at(12),
    revocation: {
      referralRewardId: 'reward-a',
      revokedAt: at(12),
      revocationReason: 'QUALIFYING_PURCHASE_REVERSED',
      reversalEventId: 'reversal-a'
    }
  });
  assert.equal(reversed.outcome, 'APPLIED');
  assert.equal(reversal.reward.state, 'REVOKED');
  assert.equal(reversal.reward.consumedDurationUs, days(12));
  assert.equal(reversal.reward.revokedDurationUs, days(18));
  assert.equal(reversal.advances, 1);

  const reversalReplay = await reversal.service.reconcileAfterAuthorityLock({
    ownerId: OWNER_ID,
    authority: reversal.authority,
    asOf: at(12),
    revocation: {
      referralRewardId: 'reward-a',
      revokedAt: at(12),
      revocationReason: 'QUALIFYING_PURCHASE_REVERSED',
      reversalEventId: 'reversal-a'
    }
  });
  assert.equal(reversalReplay.outcome, 'NO_OP');
  assert.equal(reversal.advances, 1);
});

test('migration 0015 is loader-valid, rebuildable, collision-safe, and erasure-cascading', async () => {
  const migration = await readFile(
    new URL('server/db/migrations/0015_referral_time_bank.sql', REPOSITORY_ROOT),
    'utf8'
  );
  assert.match(migration, /CREATE TABLE referral_consumption_segments/u);
  assert.match(migration, /consumed_from TIMESTAMPTZ NOT NULL/u);
  assert.match(migration, /consumed_until TIMESTAMPTZ NOT NULL/u);
  assert.match(migration, /consumed_duration_us BIGINT NOT NULL/u);
  assert.match(migration, /source_revision BIGINT NOT NULL/u);
  assert.match(migration, /ON DELETE CASCADE/u);
  assert.match(migration, /consumed_from < consumed_until/u);
  assert.match(migration, /EXTRACT\(EPOCH FROM \(consumed_until - consumed_from\)\)/u);
  assert.match(migration, /CREATE CONSTRAINT TRIGGER referral_consumption_segments_totals_guard/u);
  assert.match(migration, /FROM referral_consumption_segments AS rcs/u);
  assert.match(migration, /FROM referral_rewards AS rr/u);
  assert.match(migration, /FROM commercial_events AS ce/u);
  assert.doesNotMatch(migration, /\b(?:BEGIN|COMMIT)\s*;/u);
  assert.doesNotMatch(migration, /\b(?:stripe|paddle|paypal)\b/iu);

  const loaded = await loadPostgresMigrations(MIGRATIONS_DIRECTORY);
  const artifact = loaded.find(({ version }) => version === '0015');
  assert.equal(artifact?.filename, '0015_referral_time_bank.sql');
  assert.match(artifact?.checksumSha256 ?? '', /^[0-9a-f]{64}$/u);
  assert.doesNotMatch(artifact?.executableSql ?? '', /\b(?:BEGIN|COMMIT)\s*;/u);
  const timestampArtifact = loaded.find(({ version }) => version === '0016');
  assert.equal(timestampArtifact?.filename, '0016_referral_timestamp_contract.sql');
  assert.match(timestampArtifact?.checksumSha256 ?? '', /^[0-9a-f]{64}$/u);
  assert.doesNotMatch(timestampArtifact?.executableSql ?? '', /\b(?:BEGIN|COMMIT)\s*;/u);

  const [projectionMigration, referralMigration, erasureRepository] =
    await Promise.all([
      readFile(
        new URL(
          'server/db/migrations/0013_entitlement_projection.sql',
          REPOSITORY_ROOT
        ),
        'utf8'
      ),
      readFile(
        new URL(
          'server/db/migrations/0014_referral_persistence.sql',
          REPOSITORY_ROOT
        ),
        'utf8'
      ),
      readFile(
        new URL(
          'server/src/persistence/postgres/postgres-account-erasure-repository.ts',
          REPOSITORY_ROOT
        ),
        'utf8'
      )
    ]);
  assert.match(
    projectionMigration,
    /FOREIGN KEY \(commercial_authority_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    referralMigration,
    /FOREIGN KEY \(referrer_authority_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(erasureRepository, /DELETE FROM commercial_authorities/u);
  assert.match(erasureRepository, /DELETE FROM users/u);
  assert.ok(
    erasureRepository.indexOf('DELETE FROM commercial_authorities') <
      erasureRepository.indexOf('DELETE FROM users')
  );
});
