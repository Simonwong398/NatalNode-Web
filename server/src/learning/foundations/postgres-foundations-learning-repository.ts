import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialSourceType
} from '../../commercial-persistence/commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../../commercial-persistence/commercial-persistence-errors.js';
import { assertReferralTimestamp } from '../../commercial-persistence/referral-domain.js';
import type { CommercialTimestampInput } from '../../commercial-persistence/repositories.js';
import {
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_COURSE_VERSION,
  FOUNDATIONS_FINAL_ASSESSMENT_ID,
  FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT,
  FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD,
  FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
  FOUNDATIONS_LESSON_IDS,
  FOUNDATIONS_REWARD_SOURCE,
  FOUNDATIONS_REWARD_DURATION_US,
  assertFoundationsLessonId,
  assertFoundationsUserId,
  type FoundationsLessonId
} from './foundations-learning-domain.js';

interface CompletionRow {
  readonly lesson_id: string;
}

interface AttemptRow {
  readonly attempt_id: string;
  readonly user_id: string;
  readonly course_id: string;
  readonly assessment_id: string;
  readonly assessment_revision: number;
  readonly score: number;
  readonly correct_count: number;
  readonly passed: boolean;
  readonly created_at: string;
}

interface RewardRow {
  readonly reward_grant_id: string;
  readonly user_id: string;
  readonly commercial_authority_id: string;
  readonly course_id: string;
  readonly reward_source: string;
  readonly duration_us: string | number | bigint;
  readonly granted_at: string;
  readonly starts_at: string;
  readonly expires_at: string;
  readonly commercial_grant_credit_id: string;
  readonly event_id: string;
  readonly created_at: string;
}

const PRECISE_TIMESTAMP_FORMAT = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

const LOCK_USER_FOR_UPDATE_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR UPDATE
`;

const FIND_COMPLETED_LESSONS_SQL = `
  SELECT lesson_id
  FROM foundations_lesson_completions
  WHERE user_id = $1
    AND course_id = '${FOUNDATIONS_COURSE_ID}'
    AND course_version = '${FOUNDATIONS_COURSE_VERSION}'
  ORDER BY lesson_id ASC
  LIMIT ${FOUNDATIONS_LESSON_IDS.length + 1}
`;

const INSERT_COMPLETED_LESSON_SQL = `
  INSERT INTO foundations_lesson_completions (
    user_id,
    course_id,
    course_version,
    lesson_id,
    completed_at
  )
  VALUES ($1, '${FOUNDATIONS_COURSE_ID}', '${FOUNDATIONS_COURSE_VERSION}', $2, $3::timestamptz)
  ON CONFLICT (user_id, course_id, lesson_id) DO NOTHING
`;

const FIND_PASS_EVER_SQL = `
  SELECT attempt_id
  FROM foundations_assessment_attempts
  WHERE user_id = $1
    AND course_id = '${FOUNDATIONS_COURSE_ID}'
    AND assessment_id = '${FOUNDATIONS_FINAL_ASSESSMENT_ID}'
    AND assessment_revision = ${FOUNDATIONS_FINAL_ASSESSMENT_REVISION}
    AND passed = TRUE
  LIMIT 1
`;

const INSERT_ATTEMPT_SQL = `
  INSERT INTO foundations_assessment_attempts (
    attempt_id,
    user_id,
    course_id,
    assessment_id,
    assessment_revision,
    score,
    correct_count,
    passed,
    created_at
  )
  VALUES (
    $1,
    $2,
    '${FOUNDATIONS_COURSE_ID}',
    '${FOUNDATIONS_FINAL_ASSESSMENT_ID}',
    ${FOUNDATIONS_FINAL_ASSESSMENT_REVISION},
    $3,
    $3,
    $4,
    $5::timestamptz
  )
  RETURNING
    attempt_id,
    user_id,
    course_id,
    assessment_id,
    assessment_revision,
    score,
    correct_count,
    passed,
    to_char(created_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS created_at
`;

const REWARD_COLUMNS_SQL = `
  reward_grant_id,
  user_id,
  commercial_authority_id,
  course_id,
  reward_source,
  duration_us,
  to_char(granted_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS granted_at,
  to_char(starts_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS starts_at,
  to_char(expires_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS expires_at,
  commercial_grant_credit_id,
  event_id,
  to_char(created_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS created_at
`;

const FIND_REWARD_SQL = (forUpdate: boolean): string => `
  SELECT ${REWARD_COLUMNS_SQL}
  FROM foundations_reward_grants
  WHERE user_id = $1
    AND course_id = $2
  ${forUpdate ? 'FOR UPDATE' : ''}
`;

const INSERT_REWARD_SQL = `
  INSERT INTO foundations_reward_grants (
    reward_grant_id,
    user_id,
    commercial_authority_id,
    course_id,
    reward_source,
    duration_us,
    granted_at,
    starts_at,
    expires_at,
    commercial_grant_credit_id,
    event_id
  )
  VALUES (
    $1,
    $2,
    $3,
    '${FOUNDATIONS_COURSE_ID}',
    '${FOUNDATIONS_REWARD_SOURCE}',
    ${FOUNDATIONS_REWARD_DURATION_US}::bigint,
    $4::timestamptz,
    $5::timestamptz,
    $6::timestamptz,
    $1,
    $7
  )
  ON CONFLICT (user_id, course_id) DO NOTHING
  RETURNING ${REWARD_COLUMNS_SQL}
`;

export interface FoundationsAssessmentAttemptRecord {
  readonly attemptId: string;
  readonly userId: string;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly assessmentId: typeof FOUNDATIONS_FINAL_ASSESSMENT_ID;
  readonly assessmentRevision: typeof FOUNDATIONS_FINAL_ASSESSMENT_REVISION;
  readonly score: number;
  readonly correctCount: number;
  readonly passed: boolean;
  readonly createdAt: string;
}

export interface FoundationsRewardGrantRecord {
  readonly rewardGrantId: string;
  readonly userId: string;
  readonly commercialAuthorityId: string;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly rewardSource: typeof FOUNDATIONS_REWARD_SOURCE;
  readonly durationUs: typeof FOUNDATIONS_REWARD_DURATION_US;
  readonly grantedAt: string;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly commercialGrantCreditId: string;
  readonly eventId: string;
  readonly createdAt: string;
}

export interface CreateFoundationsAssessmentAttemptInput {
  readonly attemptId: string;
  readonly userId: string;
  readonly score: number;
  readonly correctCount: number;
  readonly passed: boolean;
  readonly createdAt: CommercialTimestampInput;
}

export interface CreateFoundationsRewardGrantInput {
  readonly rewardGrantId: string;
  readonly userId: string;
  readonly commercialAuthorityId: string;
  readonly grantedAt: CommercialTimestampInput;
  readonly startsAt: CommercialTimestampInput;
  readonly expiresAt: CommercialTimestampInput;
  readonly eventId: string;
}

function mapAttemptRow(row: AttemptRow): FoundationsAssessmentAttemptRecord {
  if (
    row.course_id !== FOUNDATIONS_COURSE_ID ||
    row.assessment_id !== FOUNDATIONS_FINAL_ASSESSMENT_ID ||
    row.assessment_revision !== FOUNDATIONS_FINAL_ASSESSMENT_REVISION ||
    row.score !== row.correct_count ||
    row.passed !== row.score >= FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD
  ) {
    throw new CommercialPersistenceIntegrityError();
  }

  return Object.freeze({
    attemptId: assertCommercialIdentifier(row.attempt_id, 'attemptId'),
    userId: assertFoundationsUserId(row.user_id),
    courseId: FOUNDATIONS_COURSE_ID,
    assessmentId: FOUNDATIONS_FINAL_ASSESSMENT_ID,
    assessmentRevision: FOUNDATIONS_FINAL_ASSESSMENT_REVISION,
    score: row.score,
    correctCount: row.correct_count,
    passed: row.passed,
    createdAt: assertReferralTimestamp(row.created_at, 'createdAt')
  });
}

function mapRewardRow(row: RewardRow): FoundationsRewardGrantRecord {
  if (
    row.course_id !== FOUNDATIONS_COURSE_ID ||
    row.reward_source !== FOUNDATIONS_REWARD_SOURCE ||
    BigInt(row.duration_us) !== BigInt(FOUNDATIONS_REWARD_DURATION_US)
  ) {
    throw new CommercialPersistenceIntegrityError();
  }

  const grantedAt = assertReferralTimestamp(row.granted_at, 'grantedAt');
  const startsAt = assertReferralTimestamp(row.starts_at, 'startsAt');
  const expiresAt = assertReferralTimestamp(row.expires_at, 'expiresAt');
  if (!(grantedAt <= startsAt && startsAt < expiresAt)) {
    throw new CommercialPersistenceIntegrityError();
  }

  return Object.freeze({
    rewardGrantId: assertCommercialIdentifier(row.reward_grant_id, 'rewardGrantId'),
    userId: assertFoundationsUserId(row.user_id),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    courseId: FOUNDATIONS_COURSE_ID,
    rewardSource: FOUNDATIONS_REWARD_SOURCE,
    durationUs: FOUNDATIONS_REWARD_DURATION_US,
    grantedAt,
    startsAt,
    expiresAt,
    commercialGrantCreditId: assertCommercialIdentifier(
      row.commercial_grant_credit_id,
      'commercialGrantCreditId'
    ),
    eventId: assertCommercialIdentifier(row.event_id, 'eventId'),
    createdAt: assertReferralTimestamp(row.created_at, 'createdAt')
  });
}

/** Caller-transaction-owned persistence for Foundations authority state. */
export class PostgresFoundationsLearningRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async lockUserForUpdate(userIdInput: string): Promise<void> {
    const userId = assertFoundationsUserId(userIdInput);

    try {
      const result = await this.executor.query<{ user_id: string }>(
        LOCK_USER_FOR_UPDATE_SQL,
        [userId]
      );
      if (result.rows.length !== 1) {
        throw new CommercialPersistenceIntegrityError();
      }
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async listCompletedLessonIds(
    userIdInput: string
  ): Promise<readonly FoundationsLessonId[]> {
    const userId = assertFoundationsUserId(userIdInput);

    try {
      const result = await this.executor.query<CompletionRow>(
        FIND_COMPLETED_LESSONS_SQL,
        [userId]
      );
      if (result.rows.length > FOUNDATIONS_LESSON_IDS.length) {
        throw new CommercialPersistenceIntegrityError();
      }
      const seen = new Set<FoundationsLessonId>();
      for (const row of result.rows) {
        const lessonId = assertFoundationsLessonId(row.lesson_id);
        if (seen.has(lessonId)) {
          throw new CommercialPersistenceIntegrityError();
        }
        seen.add(lessonId);
      }
      return Object.freeze(
        FOUNDATIONS_LESSON_IDS.filter((lessonId) => seen.has(lessonId))
      );
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async completeLesson(input: {
    readonly userId: string;
    readonly lessonId: FoundationsLessonId;
    readonly completedAt: CommercialTimestampInput;
  }): Promise<void> {
    const userId = assertFoundationsUserId(input.userId);
    const lessonId = assertFoundationsLessonId(input.lessonId);
    const completedAt = assertReferralTimestamp(input.completedAt, 'completedAt');

    try {
      await this.executor.query(INSERT_COMPLETED_LESSON_SQL, [
        userId,
        lessonId,
        completedAt
      ]);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async hasPassEver(userIdInput: string): Promise<boolean> {
    const userId = assertFoundationsUserId(userIdInput);

    try {
      const result = await this.executor.query<{ attempt_id: string }>(
        FIND_PASS_EVER_SQL,
        [userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async createAttempt(
    input: CreateFoundationsAssessmentAttemptInput
  ): Promise<FoundationsAssessmentAttemptRecord> {
    const attemptId = assertCommercialIdentifier(input.attemptId, 'attemptId');
    const userId = assertFoundationsUserId(input.userId);
    const createdAt = assertReferralTimestamp(input.createdAt, 'createdAt');

    if (
      !Number.isInteger(input.score) ||
      !Number.isInteger(input.correctCount) ||
      input.score !== input.correctCount ||
      input.score < 0 ||
      input.score > FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT ||
      input.passed !== input.score >= FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD
    ) {
      throw new CommercialPersistenceIntegrityError();
    }

    try {
      const result = await this.executor.query<AttemptRow>(INSERT_ATTEMPT_SQL, [
        attemptId,
        userId,
        input.score,
        input.passed,
        createdAt
      ]);
      const row = result.rows[0];
      if (row === undefined) {
        throw new CommercialPersistenceIntegrityError();
      }
      return mapAttemptRow(row);
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new CommercialPersistenceIntegrityError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getReward(
    userIdInput: string,
    forUpdate = false
  ): Promise<FoundationsRewardGrantRecord | null> {
    const userId = assertFoundationsUserId(userIdInput);

    try {
      const result = await this.executor.query<RewardRow>(
        FIND_REWARD_SQL(forUpdate),
        [userId, FOUNDATIONS_COURSE_ID]
      );
      const row = result.rows[0];
      if (row === undefined) {
        return null;
      }
      if (result.rows.length !== 1) {
        throw new CommercialPersistenceIntegrityError();
      }
      const reward = mapRewardRow(row);
      if (reward.userId !== userId) {
        throw new CommercialPersistenceIntegrityError();
      }
      return reward;
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async createReward(
    input: CreateFoundationsRewardGrantInput
  ): Promise<FoundationsRewardGrantRecord> {
    const rewardGrantId = assertCommercialIdentifier(
      input.rewardGrantId,
      'rewardGrantId'
    );
    const userId = assertFoundationsUserId(input.userId);
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    const grantedAt = assertReferralTimestamp(input.grantedAt, 'grantedAt');
    const startsAt = assertReferralTimestamp(input.startsAt, 'startsAt');
    const expiresAt = assertReferralTimestamp(input.expiresAt, 'expiresAt');
    const eventId = assertCommercialIdentifier(input.eventId, 'eventId');
    if (!(grantedAt <= startsAt && startsAt < expiresAt)) {
      throw new CommercialPersistenceIntegrityError();
    }

    try {
      const inserted = await this.executor.query<RewardRow>(INSERT_REWARD_SQL, [
        rewardGrantId,
        userId,
        commercialAuthorityId,
        grantedAt,
        startsAt,
        expiresAt,
        eventId
      ]);
      const row = inserted.rows[0];
      if (row !== undefined) {
        return mapRewardRow(row);
      }

      const existing = await this.getReward(userId, true);
      if (existing === null) {
        throw new CommercialPersistenceIntegrityError();
      }
      if (
        existing.courseId !== FOUNDATIONS_COURSE_ID ||
        existing.rewardGrantId !== rewardGrantId ||
        existing.commercialAuthorityId !== commercialAuthorityId ||
        existing.startsAt !== startsAt ||
        existing.expiresAt !== expiresAt ||
        existing.eventId !== eventId
      ) {
        throw new CommercialPersistenceIntegrityError();
      }
      return existing;
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new CommercialPersistenceIntegrityError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
