import type {
  FoundationsAssessmentAttemptApiResponse,
  FoundationsAssessmentAttemptApiRequest,
  FoundationsCompleteLessonApiRequest,
  FoundationsMergeProgressApiRequest,
  FoundationsProgressApiResponse,
  FoundationsRewardApiState
} from '@natalnode/contracts';
import type { IdGenerator } from '../../app/creation-boundaries.js';
import type { SqlExecutor, TransactionRunner } from '../../db/index.js';
import {
  COMMERCIAL_EVENT_SCHEMA_VERSION,
  assertCommercialIdentifier,
  digestCanonicalCommercialOperation
} from '../../commercial-persistence/commercial-domain.js';
import {
  CommercialPersistenceIntegrityError
} from '../../commercial-persistence/commercial-persistence-errors.js';
import {
  createPostgresCommercialPersistence,
  type CommercialPersistenceRepositories,
  type CommercialAuthorityRecord
} from '../../commercial-persistence/index.js';
import {
  referralEpochMicrosecondsToTimestamp,
  referralTimestampToEpochMicroseconds,
  type ReferralTimeBankSourceSnapshot
} from '../../commercial-persistence/referral-time-bank-domain.js';
import { assertReferralTimestamp } from '../../commercial-persistence/referral-domain.js';
import {
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_COURSE_VERSION,
  FOUNDATIONS_FINAL_ASSESSMENT_ID,
  FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD,
  FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
  FOUNDATIONS_LESSON_IDS,
  FOUNDATIONS_REWARD_DURATION_HOURS,
  FOUNDATIONS_REWARD_DURATION_US,
  FOUNDATIONS_REWARD_SOURCE,
  FoundationsLearningValidationError,
  assertFoundationsLessonId,
  assertFoundationsServerRevision,
  assertFoundationsUserId,
  normalizeFoundationsCompletedLessonIds,
  scoreFoundationsAssessmentAnswers,
  type FoundationsAssessmentAnswerInput,
  type FoundationsLessonId
} from './foundations-learning-domain.js';
export { FoundationsLearningValidationError } from './foundations-learning-domain.js';
import {
  PostgresFoundationsLearningRepository,
  type FoundationsAssessmentAttemptRecord,
  type FoundationsRewardGrantRecord
} from './postgres-foundations-learning-repository.js';

const REWARD_EVENT_NAMESPACE = 'learn.foundations.reward.v1';
const REWARD_IDEMPOTENCY_NAMESPACE = 'learn.foundations.reward.v1';
const REWARD_ACTOR_REFERENCE = 'foundations-reward-v1';
const MAX_REWARD_COVERAGE_INTERVALS = 16_384;
const MAX_AUTHORITY_REVISION = 9_223_372_036_854_775_807n;

interface DatabaseNowRow {
  readonly now: string;
}

interface EntitlementInterval {
  readonly startsAt: bigint;
  readonly endsAt: bigint;
}

export interface FoundationsLearningRepository {
  lockUserForUpdate(userId: string): Promise<void>;
  listCompletedLessonIds(userId: string): Promise<readonly FoundationsLessonId[]>;
  completeLesson(input: {
    readonly userId: string;
    readonly lessonId: FoundationsLessonId;
    readonly completedAt: string;
  }): Promise<void>;
  hasPassEver(userId: string): Promise<boolean>;
  createAttempt(input: {
    readonly attemptId: string;
    readonly userId: string;
    readonly score: number;
    readonly correctCount: number;
    readonly passed: boolean;
    readonly createdAt: string;
  }): Promise<FoundationsAssessmentAttemptRecord>;
  getReward(userId: string, forUpdate?: boolean): Promise<FoundationsRewardGrantRecord | null>;
  createReward(input: {
    readonly rewardGrantId: string;
    readonly userId: string;
    readonly commercialAuthorityId: string;
    readonly grantedAt: string;
    readonly startsAt: string;
    readonly expiresAt: string;
    readonly eventId: string;
  }): Promise<FoundationsRewardGrantRecord>;
}

export interface FoundationsLearningServiceDependencies {
  readonly transactionRunner: TransactionRunner;
  readonly idGenerator: IdGenerator;
  readonly commercialPersistenceFactory?: (
    executor: SqlExecutor
  ) => CommercialPersistenceRepositories;
  readonly foundationsRepositoryFactory?: (
    executor: SqlExecutor
  ) => FoundationsLearningRepository;
}

export interface FoundationsLearningService {
  getProgress(userId: string): Promise<FoundationsProgressApiResponse>;
  completeLesson(
    userId: string,
    request: FoundationsCompleteLessonApiRequest
  ): Promise<FoundationsProgressApiResponse>;
  mergeProgress(
    userId: string,
    request: FoundationsMergeProgressApiRequest
  ): Promise<FoundationsProgressApiResponse>;
  submitAssessment(
    userId: string,
    request: FoundationsAssessmentAttemptApiRequest
  ): Promise<FoundationsAssessmentAttemptApiResponse>;
}

function nextAuthorityRevision(revisionInput: string): string {
  const revision = BigInt(assertFoundationsServerRevision(revisionInput));
  if (revision >= MAX_AUTHORITY_REVISION) {
    throw new CommercialPersistenceIntegrityError();
  }
  return (revision + 1n).toString();
}

async function databaseNow(executor: SqlExecutor): Promise<string> {
  const result = await executor.query<DatabaseNowRow>(`
    SELECT to_char(
      clock_timestamp() AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
    ) AS now
  `);
  const row = result.rows[0];
  if (row === undefined) {
    throw new CommercialPersistenceIntegrityError();
  }
  return assertReferralTimestamp(row.now, 'authoritativeNow');
}

function rewardState(
  reward: FoundationsRewardGrantRecord | null
): FoundationsRewardApiState {
  if (reward === null) {
    return Object.freeze({
      status: 'NOT_ELIGIBLE',
      source: null,
      durationHours: null,
      grantedAt: null,
      startsAt: null,
      expiresAt: null
    });
  }

  return Object.freeze({
    status: 'GRANTED',
    source: FOUNDATIONS_REWARD_SOURCE,
    durationHours: FOUNDATIONS_REWARD_DURATION_HOURS,
    grantedAt: reward.grantedAt,
    startsAt: reward.startsAt,
    expiresAt: reward.expiresAt
  });
}

function progressResponse(
  completedLessonIds: readonly FoundationsLessonId[],
  passEver: boolean,
  reward: FoundationsRewardGrantRecord | null
): FoundationsProgressApiResponse {
  const completed = Object.freeze([...completedLessonIds]);
  return Object.freeze({
    authoritative: true,
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: FOUNDATIONS_COURSE_VERSION,
    lessonCount: FOUNDATIONS_LESSON_IDS.length,
    completedLessonIds: completed,
    completedLessonCount: completed.length,
    courseCompleted: completed.length === FOUNDATIONS_LESSON_IDS.length,
    passEver,
    reward: rewardState(reward)
  });
}

function attemptResponse(
  attempt: FoundationsAssessmentAttemptRecord,
  passEver: boolean,
  reward: FoundationsRewardGrantRecord | null
): FoundationsAssessmentAttemptApiResponse {
  return Object.freeze({
    attemptId: attempt.attemptId,
    courseId: FOUNDATIONS_COURSE_ID,
    assessmentId: FOUNDATIONS_FINAL_ASSESSMENT_ID,
    assessmentRevision: FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
    score: attempt.score,
    correctCount: attempt.correctCount,
    passed: attempt.passed,
    passEver,
    reward: rewardState(reward)
  });
}

function mergeIntervals(
  intervals: readonly EntitlementInterval[]
): readonly EntitlementInterval[] {
  if (intervals.length > MAX_REWARD_COVERAGE_INTERVALS) {
    throw new CommercialPersistenceIntegrityError();
  }

  const merged = [...intervals]
    .filter((interval) => interval.startsAt < interval.endsAt)
    .sort((left, right) => {
      if (left.startsAt !== right.startsAt) {
        return left.startsAt < right.startsAt ? -1 : 1;
      }
      if (left.endsAt !== right.endsAt) {
        return left.endsAt < right.endsAt ? -1 : 1;
      }
      return 0;
    })
    .reduce<Array<{ startsAt: bigint; endsAt: bigint }>>(
      (mergedIntervals, interval) => {
        const current = mergedIntervals.at(-1);
        if (current !== undefined && interval.startsAt <= current.endsAt) {
          if (interval.endsAt > current.endsAt) {
            current.endsAt = interval.endsAt;
          }
        } else {
          mergedIntervals.push({ ...interval });
        }
        return mergedIntervals;
      },
      []
    )
    .map((interval) => Object.freeze(interval));

  return Object.freeze(merged);
}

function referralTimeBankEnd(
  asOf: bigint,
  source: ReferralTimeBankSourceSnapshot | null,
  blockingIntervals: readonly EntitlementInterval[]
): bigint {
  if (source === null) {
    return asOf;
  }

  let remaining: bigint;
  try {
    remaining = BigInt(assertFoundationsServerRevision(source.queuedReferralDurationUs));
  } catch {
    throw new CommercialPersistenceIntegrityError();
  }
  if (remaining <= 0n) {
    return asOf;
  }

  const intervals = mergeIntervals(blockingIntervals);
  let cursor = asOf;
  let guard = 0;

  while (remaining > 0n) {
    guard += 1;
    if (guard > intervals.length + 2) {
      throw new CommercialPersistenceIntegrityError();
    }

    const active = intervals.find(
      (interval) => interval.startsAt <= cursor && cursor < interval.endsAt
    );
    if (active !== undefined) {
      cursor = active.endsAt;
      continue;
    }

    const nextBlocking = intervals.find((interval) => interval.startsAt > cursor);
    if (nextBlocking === undefined) {
      return cursor + remaining;
    }

    const available = nextBlocking.startsAt - cursor;
    if (available >= remaining) {
      return cursor + remaining;
    }
    remaining -= available;
    cursor = nextBlocking.startsAt;
  }

  return cursor;
}

function addExistingCoverage(
  intervals: EntitlementInterval[],
  startsAt: string | null,
  endsAt: string | null,
  asOf: bigint
): void {
  if (startsAt === null || endsAt === null) {
    return;
  }
  const start = referralTimestampToEpochMicroseconds(startsAt, 'startsAt');
  const end = referralTimestampToEpochMicroseconds(endsAt, 'endsAt');
  if (end > asOf && start < end) {
    intervals.push({ startsAt: start, endsAt: end });
  }
}

async function existingCoverageEnd(
  repositories: CommercialPersistenceRepositories,
  userId: string,
  authority: CommercialAuthorityRecord,
  asOfTimestamp: string,
  referralSource: ReferralTimeBankSourceSnapshot | null
): Promise<string> {
  const asOf = referralTimestampToEpochMicroseconds(asOfTimestamp, 'asOf');
  const intervals: EntitlementInterval[] = [];
  const relationships = await repositories.paidBillingRelationships.getByAuthority(
    userId,
    authority.commercialAuthorityId
  );

  for (const relationship of relationships) {
    if (relationship.lifecycleState === 'ENDED') {
      continue;
    }
    const coverages = await repositories.paidCoverages.listByRelationship(
      userId,
      authority.commercialAuthorityId,
      relationship.paidRelationshipId
    );
    for (const coverage of coverages) {
      addExistingCoverage(
        intervals,
        coverage.coverageStartAt,
        coverage.effectiveCoverageEndAt,
        asOf
      );
    }
    addExistingCoverage(
      intervals,
      relationship.graceStartedAt,
      relationship.graceUntil,
      asOf
    );
  }

  const grants = await repositories.grantCredits.listByAuthority(
    authority.commercialAuthorityId
  );
  for (const grant of grants) {
    addExistingCoverage(intervals, grant.startsAt, grant.endsAt, asOf);
  }

  if (
    referralSource !== null &&
    referralSource.currentReferralRewardId !== null
  ) {
    if (
      referralSource.currentEffectiveFrom === null ||
      referralSource.currentEffectiveUntil === null
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
    // The current Referral interval is already-provided PRO coverage. It
    // must block the Foundations credit before the queued Referral balance is
    // considered, otherwise a reward could begin underneath active access.
    addExistingCoverage(
      intervals,
      referralSource.currentEffectiveFrom,
      referralSource.currentEffectiveUntil,
      asOf
    );
  }

  const referralEnd = referralTimeBankEnd(asOf, referralSource, intervals);
  const end = intervals.reduce(
    (current, interval) => (interval.endsAt > current ? interval.endsAt : current),
    referralEnd
  );
  return referralEpochMicrosecondsToTimestamp(end);
}

function hasAllFoundationsLessons(
  lessonIds: readonly FoundationsLessonId[]
): boolean {
  return (
    lessonIds.length === FOUNDATIONS_LESSON_IDS.length &&
    new Set(lessonIds).size === FOUNDATIONS_LESSON_IDS.length &&
    FOUNDATIONS_LESSON_IDS.every((lessonId) => lessonIds.includes(lessonId))
  );
}

/** Authenticated, transaction-owned Foundations progress and reward authority. */
export class PostgresFoundationsLearningService
  implements FoundationsLearningService
{
  private readonly commercialPersistenceFactory: (
    executor: SqlExecutor
  ) => CommercialPersistenceRepositories;

  private readonly foundationsRepositoryFactory: (
    executor: SqlExecutor
  ) => FoundationsLearningRepository;

  public constructor(
    private readonly dependencies: FoundationsLearningServiceDependencies
  ) {
    this.commercialPersistenceFactory =
      dependencies.commercialPersistenceFactory ?? createPostgresCommercialPersistence;
    this.foundationsRepositoryFactory =
      dependencies.foundationsRepositoryFactory ??
      ((executor) => new PostgresFoundationsLearningRepository(executor));
  }

  public async getProgress(
    userIdInput: string
  ): Promise<FoundationsProgressApiResponse> {
    const userId = assertFoundationsUserId(userIdInput);
    return this.dependencies.transactionRunner.run(async (executor) => {
      const learning = this.foundationsRepositoryFactory(executor);
      const commercial = this.commercialPersistenceFactory(executor);
      await learning.lockUserForUpdate(userId);
      const authoritativeNow = await databaseNow(executor);
      await this.reconcileReward(
        learning,
        commercial,
        userId,
        authoritativeNow
      );
      return this.readProgress(learning, userId);
    });
  }

  public async completeLesson(
    userIdInput: string,
    request: FoundationsCompleteLessonApiRequest
  ): Promise<FoundationsProgressApiResponse> {
    const userId = assertFoundationsUserId(userIdInput);
    if (request.courseId !== FOUNDATIONS_COURSE_ID) {
      throw new FoundationsLearningValidationError();
    }
    const lessonId = assertFoundationsLessonId(request.lessonId);

    return this.dependencies.transactionRunner.run(async (executor) => {
      const learning = this.foundationsRepositoryFactory(executor);
      const commercial = this.commercialPersistenceFactory(executor);
      await learning.lockUserForUpdate(userId);
      const authoritativeNow = await databaseNow(executor);
      await learning.completeLesson({ userId, lessonId, completedAt: authoritativeNow });
      await this.reconcileReward(
        learning,
        commercial,
        userId,
        authoritativeNow
      );
      return this.readProgress(learning, userId);
    });
  }

  public async mergeProgress(
    userIdInput: string,
    request: FoundationsMergeProgressApiRequest
  ): Promise<FoundationsProgressApiResponse> {
    const userId = assertFoundationsUserId(userIdInput);
    if (request.courseId !== FOUNDATIONS_COURSE_ID) {
      throw new FoundationsLearningValidationError();
    }
    const lessonIds = normalizeFoundationsCompletedLessonIds(
      request.completedLessonIds
    );

    return this.dependencies.transactionRunner.run(async (executor) => {
      const learning = this.foundationsRepositoryFactory(executor);
      const commercial = this.commercialPersistenceFactory(executor);
      await learning.lockUserForUpdate(userId);
      const authoritativeNow = await databaseNow(executor);
      for (const lessonId of lessonIds) {
        await learning.completeLesson({
          userId,
          lessonId,
          completedAt: authoritativeNow
        });
      }
      await this.reconcileReward(
        learning,
        commercial,
        userId,
        authoritativeNow
      );
      return this.readProgress(learning, userId);
    });
  }

  public async submitAssessment(
    userIdInput: string,
    request: FoundationsAssessmentAttemptApiRequest
  ): Promise<FoundationsAssessmentAttemptApiResponse> {
    const userId = assertFoundationsUserId(userIdInput);
    if (
      request.courseId !== FOUNDATIONS_COURSE_ID ||
      request.assessmentId !== FOUNDATIONS_FINAL_ASSESSMENT_ID ||
      request.assessmentRevision !== FOUNDATIONS_FINAL_ASSESSMENT_REVISION
    ) {
      throw new FoundationsLearningValidationError(
        'Foundations assessment revision or identity is unsupported.'
      );
    }
    const score = scoreFoundationsAssessmentAnswers(
      request.answers as readonly FoundationsAssessmentAnswerInput[]
    );

    return this.dependencies.transactionRunner.run(async (executor) => {
      const learning = this.foundationsRepositoryFactory(executor);
      const commercial = this.commercialPersistenceFactory(executor);
      await learning.lockUserForUpdate(userId);
      const authoritativeNow = await databaseNow(executor);
      const attempt = await learning.createAttempt({
        attemptId: assertCommercialIdentifier(
          this.dependencies.idGenerator.generate(),
          'attemptId'
        ),
        userId,
        score: score.score,
        correctCount: score.correctCount,
        passed: score.passed,
        createdAt: authoritativeNow
      });
      const reward = await this.reconcileReward(
        learning,
        commercial,
        userId,
        authoritativeNow
      );
      const passEver = await learning.hasPassEver(userId);
      return attemptResponse(attempt, passEver, reward);
    });
  }

  private async readProgress(
    learning: FoundationsLearningRepository,
    userId: string
  ): Promise<FoundationsProgressApiResponse> {
    const [completedLessonIds, passEver, reward] = await Promise.all([
      learning.listCompletedLessonIds(userId),
      learning.hasPassEver(userId),
      learning.getReward(userId)
    ]);
    return progressResponse(completedLessonIds, passEver, reward);
  }

  private async reconcileReward(
    learning: FoundationsLearningRepository,
    commercial: CommercialPersistenceRepositories,
    userId: string,
    grantedAt: string
  ): Promise<FoundationsRewardGrantRecord | null> {
    const existing = await learning.getReward(userId, true);
    if (existing !== null) {
      return existing;
    }

    const [completedLessonIds, passEver] = await Promise.all([
      learning.listCompletedLessonIds(userId),
      learning.hasPassEver(userId)
    ]);
    if (!hasAllFoundationsLessons(completedLessonIds) || !passEver) {
      return null;
    }

    const existingAuthority = await commercial.authorities.getByOwnerId(userId);
    if (
      existingAuthority !== null &&
      commercial.referralReconciliation !== undefined
    ) {
      await commercial.referralReconciliation.matureEligibleRewards({
        ownerId: userId
      });
    }

    const ensured = await commercial.authorities.ensureAndLockForUpdate({
      commercialAuthorityId: assertCommercialIdentifier(
        this.dependencies.idGenerator.generate(),
        'commercialAuthorityId'
      ),
      ownerId: userId
    });
    let authority = ensured.authority;

    const afterLock = await learning.getReward(userId, true);
    if (afterLock !== null) {
      return afterLock;
    }

    let referralSource: ReferralTimeBankSourceSnapshot | null = null;
    if (commercial.referralTimeBank !== undefined) {
      const reconciliation = await commercial.referralTimeBank.reconcileAfterAuthorityLock({
        ownerId: userId,
        authority,
        asOf: grantedAt
      });
      authority = reconciliation.authority;
      referralSource = reconciliation.source;
    }

    const [lockedCompletedLessonIds, lockedPassEver] = await Promise.all([
      learning.listCompletedLessonIds(userId),
      learning.hasPassEver(userId)
    ]);
    if (!hasAllFoundationsLessons(lockedCompletedLessonIds) || !lockedPassEver) {
      return null;
    }

    const rewardAfterReconciliation = await learning.getReward(userId, true);
    if (rewardAfterReconciliation !== null) {
      return rewardAfterReconciliation;
    }

    const startsAt = await existingCoverageEnd(
      commercial,
      userId,
      authority,
      grantedAt,
      referralSource
    );
    const expiresAt = referralEpochMicrosecondsToTimestamp(
      referralTimestampToEpochMicroseconds(startsAt, 'startsAt') +
        BigInt(FOUNDATIONS_REWARD_DURATION_US)
    );
    const rewardGrantId = assertCommercialIdentifier(
      this.dependencies.idGenerator.generate(),
      'rewardGrantId'
    );
    const eventId = assertCommercialIdentifier(
      this.dependencies.idGenerator.generate(),
      'eventId'
    );
    const nextRevision = nextAuthorityRevision(authority.entitlementRevision);
    const attributes = {
      course_id: FOUNDATIONS_COURSE_ID,
      duration_us: FOUNDATIONS_REWARD_DURATION_US,
      effective_from: startsAt,
      effective_until: expiresAt,
      reward_source: FOUNDATIONS_REWARD_SOURCE
    } as const;
    const operationDigest = digestCanonicalCommercialOperation({
      event_type: 'GRANT_ISSUED',
      source_entity_id: rewardGrantId,
      effective_at: startsAt,
      attributes
    });

    const event = await commercial.events.appendIdempotent({
      eventId,
      ownerId: userId,
      commercialAuthorityId: authority.commercialAuthorityId,
      eventType: 'GRANT_ISSUED',
      sourceType: 'PROMOTION',
      sourceEntityId: rewardGrantId,
      sourceNamespace: REWARD_EVENT_NAMESPACE,
      providerNamespace: null,
      providerContext: null,
      providerEventId: null,
      providerReceiptId: null,
      idempotencyNamespace: REWARD_IDEMPOTENCY_NAMESPACE,
      idempotencyKey: `${FOUNDATIONS_COURSE_ID}:${userId}`,
      operationDigest,
      occurredAt: grantedAt,
      effectiveAt: startsAt,
      causedByEventId: null,
      correctsEventId: null,
      reversesEventId: null,
      attributes,
      attributesVersion: 1,
      schemaVersion: COMMERCIAL_EVENT_SCHEMA_VERSION,
      actorClass: 'SYSTEM',
      actorReference: REWARD_ACTOR_REFERENCE
    });

    const credit = await commercial.grantCredits.create({
      grantCreditId: rewardGrantId,
      commercialAuthorityId: authority.commercialAuthorityId,
      sourceClass: 'PROMOTION',
      sourceEntityId: rewardGrantId,
      startsAt,
      endsAt: expiresAt,
      sourceRevision: nextRevision,
      eventId: event.event.eventId
    });
    if (
      credit.eventId !== event.event.eventId ||
      credit.sourceClass !== 'PROMOTION' ||
      credit.sourceEntityId !== rewardGrantId
    ) {
      throw new CommercialPersistenceIntegrityError();
    }

    const reward = await learning.createReward({
      rewardGrantId,
      userId,
      commercialAuthorityId: authority.commercialAuthorityId,
      grantedAt,
      startsAt,
      expiresAt,
      eventId: event.event.eventId
    });
    const advancedAuthority = await commercial.authorities.advanceRevisionAfterLock({
      commercialAuthorityId: authority.commercialAuthorityId,
      ownerId: userId,
      expectedRevision: authority.entitlementRevision
    });
    if (advancedAuthority.entitlementRevision !== nextRevision) {
      throw new CommercialPersistenceIntegrityError();
    }
    return reward;
  }
}

export function createPostgresFoundationsLearningService(
  dependencies: FoundationsLearningServiceDependencies
): PostgresFoundationsLearningService {
  return new PostgresFoundationsLearningService(dependencies);
}
