import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import {
  FoundationsLearningValidationError,
  PostgresFoundationsLearningService,
  evaluateEffectiveEntitlement,
  referralEpochMicrosecondsToTimestamp,
  referralTimestampToEpochMicroseconds
} from '../dist/index.js';
import {
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_FINAL_ASSESSMENT_ID,
  FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD,
  FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
  FOUNDATIONS_LESSON_IDS,
  FOUNDATIONS_REWARD_DURATION_US,
  FOUNDATIONS_REWARD_SOURCE,
  normalizeFoundationsCompletedLessonIds,
  scoreFoundationsAssessmentAnswers
} from '../dist/learning/foundations/foundations-learning-domain.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.example';
const NOW = '2026-09-01T00:00:00.000000Z';
const DAY_US = 86_400_000_000n;
const QUESTION_IDS = [
  'foundations.final_check.q01.chart_fact_interpretation',
  'foundations.final_check.q02.sign_constellation_distinction',
  'foundations.final_check.q03.unknown_birth_time',
  'foundations.final_check.q04.local_time_and_timezone',
  'foundations.final_check.q05.planet_sign_house_synthesis',
  'foundations.final_check.q06.major_aspect_geometry',
  'foundations.final_check.q07.houses_angles_cusps',
  'foundations.final_check.q08.prioritization_and_synthesis',
  'foundations.final_check.q09.precision_is_not_validation',
  'foundations.final_check.q10.responsible_use'
];
const ANSWER_KEY = ['C', 'B', 'A', 'D', 'B', 'C', 'A', 'D', 'C', 'B'];

function answersForCorrectCount(correctCount) {
  return QUESTION_IDS.map((questionId, index) => ({
    questionId,
    answerId:
      index < correctCount
        ? ANSWER_KEY[index]
        : ANSWER_KEY[index] === 'A'
          ? 'B'
          : 'A'
  }));
}

function assessmentRequest(correctCount = 10, overrides = {}) {
  return {
    courseId: FOUNDATIONS_COURSE_ID,
    assessmentId: FOUNDATIONS_FINAL_ASSESSMENT_ID,
    assessmentRevision: FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
    answers: answersForCorrectCount(correctCount),
    ...overrides
  };
}

function authority(commercialAuthorityId, ownerId, entitlementRevision = '0') {
  return Object.freeze({
    commercialAuthorityId,
    ownerId,
    entitlementRevision,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function createFoundationsHarness({
  initialAuthorities = {},
  initialRelationships = {},
  initialCoverages = {},
  initialGrantCredits = {}
} = {}) {
  const states = new Map();
  const authorities = new Map(Object.entries(initialAuthorities));
  const relationships = new Map(Object.entries(initialRelationships));
  const coverages = new Map(Object.entries(initialCoverages));
  const grantCredits = new Map(Object.entries(initialGrantCredits));
  const events = new Map();
  let generatedId = 0;

  function stateFor(userId) {
    let state = states.get(userId);
    if (state === undefined) {
      state = {
        completed: new Set(),
        attempts: [],
        reward: null
      };
      states.set(userId, state);
    }
    return state;
  }

  const learningRepository = {
    async lockUserForUpdate() {},

    async listCompletedLessonIds(userId) {
      const state = stateFor(userId);
      return Object.freeze(
        FOUNDATIONS_LESSON_IDS.filter((lessonId) => state.completed.has(lessonId))
      );
    },

    async completeLesson({ userId, lessonId }) {
      stateFor(userId).completed.add(lessonId);
    },

    async hasPassEver(userId) {
      return stateFor(userId).attempts.some((attempt) => attempt.passed);
    },

    async createAttempt(input) {
      const state = stateFor(input.userId);
      const attempt = Object.freeze({
        attemptId: input.attemptId,
        userId: input.userId,
        courseId: FOUNDATIONS_COURSE_ID,
        assessmentId: FOUNDATIONS_FINAL_ASSESSMENT_ID,
        assessmentRevision: FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
        score: input.score,
        correctCount: input.correctCount,
        passed: input.passed,
        createdAt: input.createdAt
      });
      state.attempts.push(attempt);
      return attempt;
    },

    async getReward(userId) {
      return stateFor(userId).reward;
    },

    async createReward(input) {
      const state = stateFor(input.userId);
      if (state.reward !== null) {
        return state.reward;
      }
      state.reward = Object.freeze({
        rewardGrantId: input.rewardGrantId,
        userId: input.userId,
        commercialAuthorityId: input.commercialAuthorityId,
        courseId: FOUNDATIONS_COURSE_ID,
        rewardSource: FOUNDATIONS_REWARD_SOURCE,
        durationUs: FOUNDATIONS_REWARD_DURATION_US,
        grantedAt: input.grantedAt,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        commercialGrantCreditId: input.rewardGrantId,
        eventId: input.eventId,
        createdAt: NOW
      });
      return state.reward;
    }
  };

  const commercialPersistence = {
    authorities: {
      async getByOwnerId(userId) {
        return authorities.get(userId) ?? null;
      },

      async ensureAndLockForUpdate({ commercialAuthorityId, ownerId }) {
        const existing = authorities.get(ownerId);
        if (existing !== undefined) {
          return { outcome: 'EXISTING', authority: existing };
        }
        const created = authority(commercialAuthorityId, ownerId);
        authorities.set(ownerId, created);
        return { outcome: 'CREATED', authority: created };
      },

      async advanceRevisionAfterLock({
        commercialAuthorityId,
        ownerId,
        expectedRevision
      }) {
        const existing = authorities.get(ownerId);
        assert.ok(existing);
        assert.equal(existing.commercialAuthorityId, commercialAuthorityId);
        assert.equal(existing.entitlementRevision, expectedRevision);
        const advanced = authority(
          existing.commercialAuthorityId,
          existing.ownerId,
          (BigInt(existing.entitlementRevision) + 1n).toString()
        );
        authorities.set(ownerId, advanced);
        return advanced;
      }
    },

    events: {
      async appendIdempotent(input) {
        const idempotencyKey = `${input.idempotencyNamespace}:${input.idempotencyKey}`;
        const existing = events.get(idempotencyKey);
        if (existing !== undefined) {
          return { outcome: 'EXISTING', event: existing };
        }
        const event = Object.freeze({
          eventId: input.eventId,
          commercialAuthorityId: input.commercialAuthorityId,
          sourceType: input.sourceType,
          sourceEntityId: input.sourceEntityId,
          eventType: input.eventType
        });
        events.set(idempotencyKey, event);
        return { outcome: 'CREATED', event };
      }
    },

    grantCredits: {
      async create(input) {
        const existing = [...grantCredits.values()].find(
          (credit) => credit.grantCreditId === input.grantCreditId
        );
        if (existing !== undefined) {
          return existing;
        }
        const created = Object.freeze({
          grantCreditId: input.grantCreditId,
          commercialAuthorityId: input.commercialAuthorityId,
          sourceClass: input.sourceClass,
          sourceEntityId: input.sourceEntityId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          sourceRevision: input.sourceRevision,
          eventId: input.eventId,
          createdAt: NOW
        });
        const list = grantCredits.get(input.commercialAuthorityId) ?? [];
        grantCredits.set(input.commercialAuthorityId, [...list, created]);
        return created;
      },

      async listByAuthority(commercialAuthorityId) {
        const list = grantCredits.get(commercialAuthorityId) ?? [];
        return Object.freeze([...list]);
      }
    },

    paidBillingRelationships: {
      async getByAuthority(userId) {
        return Object.freeze([...(relationships.get(userId) ?? [])]);
      }
    },

    paidCoverages: {
      async listByRelationship(_userId, _authorityId, paidRelationshipId) {
        return Object.freeze([...(coverages.get(paidRelationshipId) ?? [])]);
      }
    },

    providerReceipts: {},
    paidReconciliation: {},
    entitlementProjections: {},
    referralPublicIdentities: {},
    referralAttributions: {},
    referralRewards: {},
    referralReconciliation: undefined,
    referralTimeBank: undefined
  };

  const executor = {
    async query(sql) {
      return sql.includes('clock_timestamp')
        ? { rows: [{ now: NOW }] }
        : { rows: [] };
    }
  };

  let transactionTail = Promise.resolve();
  const transactionRunner = {
    run(operation) {
      const result = transactionTail.then(() => operation(executor));
      transactionTail = result.catch(() => undefined);
      return result;
    }
  };

  const service = new PostgresFoundationsLearningService({
    transactionRunner,
    idGenerator: {
      generate() {
        generatedId += 1;
        return `foundations-test-${generatedId}`;
      }
    },
    commercialPersistenceFactory: () => commercialPersistence,
    foundationsRepositoryFactory: () => learningRepository
  });

  return {
    service,
    states,
    authorities,
    grantCredits,
    events,
    getState: stateFor
  };
}

function createRouteDependencies(service, authenticatedUser = null) {
  return {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null
          ? authenticatedUser
          : { userId, sessionCreatedAt: NOW };
      }
    },
    foundationsLearningService: service,
    idGenerator: {},
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts: {},
      chartNotes: {}
    },
    engineClient: {},
    clock: {},
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkAuthLifecycle: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {},
    accountErasure: {},
    accountDataExport: {}
  };
}

test('Foundations canonical scoring enforces the exact question set and pass threshold', () => {
  assert.deepEqual(scoreFoundationsAssessmentAnswers(answersForCorrectCount(10)), {
    score: 10,
    correctCount: 10,
    passed: true
  });
  assert.equal(
    scoreFoundationsAssessmentAnswers(answersForCorrectCount(FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD)).passed,
    true
  );
  assert.equal(scoreFoundationsAssessmentAnswers(answersForCorrectCount(7)).passed, false);

  assert.throws(
    () =>
      scoreFoundationsAssessmentAnswers([
        ...answersForCorrectCount(10).slice(0, 9),
        answersForCorrectCount(10)[0]
      ]),
    FoundationsLearningValidationError
  );
  assert.throws(
    () =>
      scoreFoundationsAssessmentAnswers([
        ...answersForCorrectCount(10).slice(0, 9),
        { questionId: 'unknown.question', answerId: 'A' }
      ]),
    FoundationsLearningValidationError
  );
  assert.throws(
    () =>
      scoreFoundationsAssessmentAnswers([
        ...answersForCorrectCount(10).slice(0, 9),
        { questionId: QUESTION_IDS[9], answerId: 'E' }
      ]),
    FoundationsLearningValidationError
  );
});

test('local Foundations completion merge keeps only the frozen semantic union', () => {
  const normalized = normalizeFoundationsCompletedLessonIds([
    FOUNDATIONS_LESSON_IDS[4],
    'foundations.future.lesson',
    FOUNDATIONS_LESSON_IDS[0],
    FOUNDATIONS_LESSON_IDS[4],
    { lessonId: FOUNDATIONS_LESSON_IDS[1] }
  ]);

  assert.deepEqual(normalized, [FOUNDATIONS_LESSON_IDS[0], FOUNDATIONS_LESSON_IDS[4]]);
});

test('authenticated assessment attempts are server-scored, immutable in history, and PASS-EVER', async () => {
  const harness = createFoundationsHarness();
  const first = await harness.service.submitAssessment(
    'user-a',
    assessmentRequest(8, { score: 0, correctCount: 0, passed: false, userId: 'user-b' })
  );
  const second = await harness.service.submitAssessment(
    'user-a',
    assessmentRequest(7, { score: 10, correctCount: 10, passed: true })
  );

  assert.equal(first.score, 8);
  assert.equal(first.correctCount, 8);
  assert.equal(first.passed, true);
  assert.equal(first.passEver, true);
  assert.equal(second.score, 7);
  assert.equal(second.passed, false);
  assert.equal(second.passEver, true);
  assert.equal(harness.getState('user-a').attempts.length, 2);
  assert.notEqual(first.attemptId, second.attemptId);
  assert.equal(first.reward.status, 'NOT_ELIGIBLE');

  await assert.rejects(
    harness.service.submitAssessment(
      'user-a',
      assessmentRequest(10, { assessmentRevision: 2 })
    ),
    FoundationsLearningValidationError
  );
});

test('authenticated Foundations progress is account-scoped, monotonic, and exact at 12 of 12', async () => {
  const harness = createFoundationsHarness();

  const partial = await harness.service.mergeProgress('user-a', {
    courseId: FOUNDATIONS_COURSE_ID,
    completedLessonIds: [FOUNDATIONS_LESSON_IDS[0], 'unknown.lesson']
  });
  assert.deepEqual(partial.completedLessonIds, [FOUNDATIONS_LESSON_IDS[0]]);

  await harness.service.completeLesson('user-a', {
    courseId: FOUNDATIONS_COURSE_ID,
    lessonId: FOUNDATIONS_LESSON_IDS[0]
  });
  const repeated = await harness.service.completeLesson('user-a', {
    courseId: FOUNDATIONS_COURSE_ID,
    lessonId: FOUNDATIONS_LESSON_IDS[0]
  });
  assert.equal(repeated.completedLessonCount, 1);

  await assert.rejects(
    harness.service.completeLesson('user-a', {
      courseId: FOUNDATIONS_COURSE_ID,
      lessonId: 'unknown.lesson'
    }),
    FoundationsLearningValidationError
  );

  const complete = await harness.service.mergeProgress('user-a', {
    courseId: FOUNDATIONS_COURSE_ID,
    completedLessonIds: [...FOUNDATIONS_LESSON_IDS, FOUNDATIONS_LESSON_IDS[0]]
  });
  assert.equal(complete.completedLessonCount, 12);
  assert.equal(complete.courseCompleted, true);
  assert.equal(complete.reward.status, 'NOT_ELIGIBLE');
  assert.equal((await harness.service.getProgress('user-a')).completedLessonCount, 12);
  assert.equal((await harness.service.getProgress('user-b')).completedLessonCount, 0);
});

test('Reward V1 grants exactly one seven-day PRO credit after both authorities become true', async () => {
  const harness = createFoundationsHarness();

  const beforePass = await harness.service.mergeProgress('user-a', {
    courseId: FOUNDATIONS_COURSE_ID,
    completedLessonIds: FOUNDATIONS_LESSON_IDS
  });
  assert.equal(beforePass.courseCompleted, true);
  assert.equal(beforePass.reward.status, 'NOT_ELIGIBLE');

  const granted = await harness.service.submitAssessment(
    'user-a',
    assessmentRequest(8)
  );
  assert.equal(granted.passEver, true);
  assert.equal(granted.reward.status, 'GRANTED');
  assert.equal(granted.reward.source, FOUNDATIONS_REWARD_SOURCE);
  assert.equal(granted.reward.durationHours, 168);
  assert.equal(granted.reward.startsAt, '2026-09-01T00:00:00.000Z');
  assert.equal(granted.reward.expiresAt, '2026-09-08T00:00:00.000Z');
  assert.equal(harness.events.size, 1);
  assert.equal([...harness.grantCredits.values()].flat().length, 1);

  const retry = await harness.service.submitAssessment(
    'user-a',
    assessmentRequest(10)
  );
  const repeatedMerge = await harness.service.mergeProgress('user-a', {
    courseId: FOUNDATIONS_COURSE_ID,
    completedLessonIds: FOUNDATIONS_LESSON_IDS
  });
  assert.equal(retry.reward.status, 'GRANTED');
  assert.equal(repeatedMerge.reward.status, 'GRANTED');
  assert.equal(harness.events.size, 1);
  assert.equal([...harness.grantCredits.values()].flat().length, 1);
  assert.equal(harness.getState('user-a').attempts.length, 2);
});

test('Reward V1 preserves seven-day value after paid and temporary grant coverage', async () => {
  const authorityId = 'authority-paid';
  const paidRelationshipId = 'paid-relationship';
  const coverageEnds = '2026-09-03T00:00:00.000000Z';
  const promotionEnds = '2026-09-05T00:00:00.000000Z';
  const harness = createFoundationsHarness({
    initialAuthorities: {
      'user-paid': authority(authorityId, 'user-paid', '4')
    },
    initialRelationships: {
      'user-paid': [
        {
          paidRelationshipId,
          lifecycleState: 'ACTIVE',
          graceStartedAt: null,
          graceUntil: null
        }
      ]
    },
    initialCoverages: {
      [paidRelationshipId]: [
        {
          coverageStartAt: '2026-08-01T00:00:00.000000Z',
          effectiveCoverageEndAt: coverageEnds
        }
      ]
    },
    initialGrantCredits: {
      [authorityId]: [
        {
          grantCreditId: 'existing-promotion',
          commercialAuthorityId: authorityId,
          sourceClass: 'PROMOTION',
          sourceEntityId: 'existing-promotion',
          startsAt: '2026-08-31T00:00:00.000000Z',
          endsAt: promotionEnds,
          sourceRevision: '4',
          eventId: 'existing-event',
          createdAt: NOW
        }
      ]
    }
  });

  await harness.service.mergeProgress('user-paid', {
    courseId: FOUNDATIONS_COURSE_ID,
    completedLessonIds: FOUNDATIONS_LESSON_IDS
  });
  const result = await harness.service.submitAssessment(
    'user-paid',
    assessmentRequest(10)
  );

  assert.equal(result.reward.status, 'GRANTED');
  assert.equal(result.reward.startsAt, '2026-09-05T00:00:00.000Z');
  assert.equal(result.reward.expiresAt, '2026-09-12T00:00:00.000Z');
  assert.equal(
    referralEpochMicrosecondsToTimestamp(
      referralTimestampToEpochMicroseconds(result.reward.expiresAt, 'expiresAt') -
        referralTimestampToEpochMicroseconds(result.reward.startsAt, 'startsAt')
    ),
    '1970-01-08T00:00:00.000Z'
  );
});

test('concurrent eligibility reconciliation converges on one account reward and one credit', async () => {
  const harness = createFoundationsHarness();
  const state = harness.getState('user-concurrent');
  for (const lessonId of FOUNDATIONS_LESSON_IDS) {
    state.completed.add(lessonId);
  }
  state.attempts.push({ passed: true });

  const [first, second] = await Promise.all([
    harness.service.getProgress('user-concurrent'),
    harness.service.getProgress('user-concurrent')
  ]);

  assert.equal(first.reward.status, 'GRANTED');
  assert.equal(second.reward.status, 'GRANTED');
  assert.equal(harness.events.size, 1);
  assert.equal([...harness.grantCredits.values()].flat().length, 1);
  const reward = harness.getState('user-concurrent').reward;
  assert.ok(reward);
  assert.equal(reward.rewardGrantId, reward.commercialGrantCreditId);
});

test('Commercial entitlement evaluator treats the Foundations credit as finite PRO coverage', () => {
  const grant = {
    grantCreditId: 'foundations-credit',
    commercialAuthorityId: 'authority-a',
    sourceClass: 'PROMOTION',
    sourceEntityId: 'foundations-credit',
    startsAt: '2026-09-01T00:00:00.000000Z',
    endsAt: '2026-09-08T00:00:00.000000Z',
    sourceRevision: '1',
    eventId: 'event-a',
    createdAt: NOW
  };
  const active = evaluateEffectiveEntitlement({
    commercialAuthorityId: 'authority-a',
    entitlementRevision: '1',
    evaluatedAt: NOW,
    paidBillingRelationships: [],
    paidCoverages: [],
    grantCredits: [grant]
  });
  assert.equal(active.determination, 'DETERMINATE');
  assert.equal(active.effectivePro, true);
  assert.equal(active.currentSourceClass, 'PROMOTION');

  const expired = evaluateEffectiveEntitlement({
    commercialAuthorityId: 'authority-a',
    entitlementRevision: '1',
    evaluatedAt: '2026-09-08T00:00:00.000000Z',
    paidBillingRelationships: [],
    paidCoverages: [],
    grantCredits: [grant]
  });
  assert.equal(expired.determination, 'DETERMINATE');
  assert.equal(expired.effectivePro, false);
});

test('Foundations routes require session authority and reject client authority fields', async () => {
  const harness = createFoundationsHarness();
  const app = createApp(createRouteDependencies(harness.service));
  const validBody = {
    courseId: FOUNDATIONS_COURSE_ID,
    lessonId: FOUNDATIONS_LESSON_IDS[0]
  };

  const unauthenticated = await app.request(
    new Request(`${PUBLIC_WEB_ORIGIN}/api/learn/foundations/progress/complete`, {
      method: 'POST',
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validBody)
    })
  );
  assert.equal(unauthenticated.status, 401);

  const crossUser = await app.request(
    new Request(`${PUBLIC_WEB_ORIGIN}/api/learn/foundations/progress/complete`, {
      method: 'POST',
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'Content-Type': 'application/json',
        'x-test-user': 'user-a'
      },
      body: JSON.stringify({ ...validBody, userId: 'user-b' })
    })
  );
  assert.equal(crossUser.status, 400);
  assert.equal(harness.getState('user-a').completed.size, 0);
  assert.equal(harness.getState('user-b').completed.size, 0);

  const forgedAssessment = await app.request(
    new Request(`${PUBLIC_WEB_ORIGIN}/api/learn/foundations/assessment/attempts`, {
      method: 'POST',
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'Content-Type': 'application/json',
        'x-test-user': 'user-a'
      },
      body: JSON.stringify(
        assessmentRequest(10, {
          userId: 'user-b',
          score: 0,
          correctCount: 0,
          passed: false,
          rewardEligible: true
        })
      )
    })
  );
  assert.equal(forgedAssessment.status, 400);
  assert.equal(harness.getState('user-a').attempts.length, 0);

  const directGrant = await app.request(
    new Request(`${PUBLIC_WEB_ORIGIN}/api/learn/foundations/reward/grant`, {
      method: 'POST',
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'Content-Type': 'application/json',
        'x-test-user': 'user-a'
      },
      body: JSON.stringify({
        courseId: FOUNDATIONS_COURSE_ID,
        rewardEligible: true,
        durationHours: 168
      })
    })
  );
  assert.equal(directGrant.status, 404);

  const accepted = await app.request(
    new Request(`${PUBLIC_WEB_ORIGIN}/api/learn/foundations/progress/complete`, {
      method: 'POST',
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'Content-Type': 'application/json',
        'x-test-user': 'user-a'
      },
      body: JSON.stringify(validBody)
    })
  );
  assert.equal(accepted.status, 200);
  assert.equal(harness.getState('user-a').completed.has(FOUNDATIONS_LESSON_IDS[0]), true);
});

test('migration keeps Foundations authority narrow and uniqueness/idempotency explicit', async () => {
  const migration = await readFile(
    new URL('../db/migrations/0017_foundations_reward_v1.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /CREATE TABLE foundations_lesson_completions/u);
  assert.match(migration, /PRIMARY KEY \(user_id, course_id, lesson_id\)/u);
  assert.match(migration, /CREATE TABLE foundations_assessment_attempts/u);
  assert.match(migration, /CREATE TABLE commercial_grant_credits/u);
  assert.match(migration, /UNIQUE \(user_id, course_id\)/u);
  assert.match(migration, /604800000000/u);
  assert.match(migration, /168 hours/u);
  assert.match(migration, /append-only/u);
  assert.match(migration, /assessment_revision = 1/u);

  const foundationsTables = migration.slice(
    migration.indexOf('CREATE TABLE foundations_lesson_completions'),
    migration.indexOf('CREATE INDEX foundations_reward_grants_authority_lookup_idx')
  );
  assert.doesNotMatch(
    foundationsTables,
    /(birth|latitude|longitude|timezone|chart_facts|planet_placements)/iu
  );
  assert.doesNotMatch(foundationsTables, /answers?\s+(JSON|JSONB|TEXT)/iu);
});

test('reward response duration is the exact frozen seven-day interval', () => {
  const start = referralTimestampToEpochMicroseconds(NOW, 'start');
  const end = referralTimestampToEpochMicroseconds(
    '2026-09-08T00:00:00.000000Z',
    'end'
  );
  assert.equal(end - start, BigInt(FOUNDATIONS_REWARD_DURATION_US));
  assert.equal(end - start, 7n * DAY_US);
});
