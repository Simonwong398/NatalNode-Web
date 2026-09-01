import type { SqlExecutor, TransactionRunner } from '../db/index.js';
import {
  COMMUNITY_ANONYMIZED_AUTHOR_LABEL,
  normalizeCommunityTimestamp,
  type CommunityContentStatus,
  type CommunityModerationAction,
  type CommunityModerationReasonCode,
  type CommunityReportCategory,
  type CommunityReportState,
  type CommunityReportTargetType,
  type CommunityTopicId
} from './community-domain.js';
import type {
  CommunityAnswerRecord,
  CommunityModerationOutcome,
  CommunityOwnershipOutcome,
  CommunityProfileRecord,
  CommunityQuestionDetailRecord,
  CommunityQuestionPage,
  CommunityQuestionRecord,
  CommunityReportCreateOutcome,
  CommunityReportRecord,
  CommunityRepository,
  CommunityRetentionPurgeResult
} from './community-repository.js';

type RetentionHold = 'NONE' | 'LEGAL' | 'SECURITY';

interface QuestionRow {
  question_id: string;
  author_user_id: string | null;
  anonymized_author_label: string | null;
  author_display_name: string;
  title: string;
  body: string;
  topic_id: CommunityTopicId;
  status: CommunityContentStatus;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  retention_expires_at: Date | string | null;
  retention_hold: RetentionHold;
}

interface AnswerRow {
  answer_id: string;
  question_id: string;
  author_user_id: string | null;
  anonymized_author_label: string | null;
  author_display_name: string;
  body: string;
  status: CommunityContentStatus;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  retention_expires_at: Date | string | null;
  retention_hold: RetentionHold;
}

interface ProfileRow {
  user_id: string;
  display_name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ReportRow {
  report_id: string;
  reporter_user_id: string | null;
  target_type: CommunityReportTargetType;
  target_id: string;
  category: CommunityReportCategory;
  details: string;
  state: CommunityReportState;
  created_at: Date | string;
  resolved_at: Date | string | null;
  retention_expires_at: Date | string | null;
  retention_hold: RetentionHold;
}

interface StringRow {
  value: string;
}

interface StatusRow {
  status: CommunityContentStatus;
}

const QUESTION_COLUMNS = `
  q.question_id,
  q.author_user_id,
  q.anonymized_author_label,
  COALESCE(p.display_name, q.anonymized_author_label, '${COMMUNITY_ANONYMIZED_AUTHOR_LABEL}') AS author_display_name,
  q.title,
  q.body,
  q.topic_id,
  q.status,
  q.created_at,
  q.updated_at,
  q.deleted_at,
  q.retention_expires_at,
  q.retention_hold`;

const ANSWER_COLUMNS = `
  a.answer_id,
  a.question_id,
  a.author_user_id,
  COALESCE(p.display_name, a.anonymized_author_label, '${COMMUNITY_ANONYMIZED_AUTHOR_LABEL}') AS author_display_name,
  a.anonymized_author_label,
  a.body,
  a.status,
  a.created_at,
  a.updated_at,
  a.deleted_at,
  a.retention_expires_at,
  a.retention_hold`;

const FIND_PROFILE_SQL = `
  SELECT user_id, display_name, created_at, updated_at
  FROM community_profiles
  WHERE user_id = $1`;

const UPSERT_PROFILE_SQL = `
  INSERT INTO community_profiles (user_id, display_name, created_at, updated_at)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      updated_at = EXCLUDED.updated_at
  RETURNING user_id, display_name, created_at, updated_at`;

const LIST_QUESTIONS_SQL = `
  SELECT${QUESTION_COLUMNS}
  FROM community_questions AS q
  LEFT JOIN community_profiles AS p ON p.user_id = q.author_user_id
  WHERE q.status = 'VISIBLE'
    AND (
      $1::timestamptz IS NULL
      OR q.created_at < $1::timestamptz
      OR (q.created_at = $1::timestamptz AND q.question_id < $2::text)
    )
  ORDER BY q.created_at DESC, q.question_id DESC
  LIMIT $3`;

const FIND_QUESTION_SQL = `
  SELECT${QUESTION_COLUMNS}
  FROM community_questions AS q
  LEFT JOIN community_profiles AS p ON p.user_id = q.author_user_id
  WHERE q.question_id = $1`;

const FIND_VISIBLE_QUESTION_SQL = `
  SELECT${QUESTION_COLUMNS}
  FROM community_questions AS q
  LEFT JOIN community_profiles AS p ON p.user_id = q.author_user_id
  WHERE q.question_id = $1
    AND q.status = 'VISIBLE'`;

const FIND_ANSWER_SQL = `
  SELECT${ANSWER_COLUMNS}
  FROM community_answers AS a
  LEFT JOIN community_profiles AS p ON p.user_id = a.author_user_id
  WHERE a.answer_id = $1`;

const FIND_VISIBLE_ANSWERS_SQL = `
  SELECT${ANSWER_COLUMNS}
  FROM community_answers AS a
  LEFT JOIN community_profiles AS p ON p.user_id = a.author_user_id
  INNER JOIN community_questions AS q ON q.question_id = a.question_id
  LEFT JOIN community_question_acceptances AS accepted
    ON accepted.answer_id = a.answer_id
  WHERE a.question_id = $1
    AND q.status = 'VISIBLE'
    AND a.status = 'VISIBLE'
  ORDER BY
    CASE WHEN accepted.answer_id IS NULL THEN 1 ELSE 0 END ASC,
    a.created_at ASC,
    a.answer_id ASC`;

const FIND_ACCEPTED_ANSWER_SQL = `
  SELECT answer_id AS value
  FROM community_question_acceptances
  WHERE question_id = $1`;

const INSERT_QUESTION_SQL = `
  INSERT INTO community_questions (
    question_id,
    author_user_id,
    title,
    body,
    topic_id,
    status,
    created_at,
    updated_at
  )
  SELECT $1, $2, $3, $4, $5, 'VISIBLE', $6, $7
  WHERE EXISTS (
    SELECT 1 FROM community_profiles WHERE user_id = $2
  )
  RETURNING question_id`;

const UPDATE_QUESTION_SQL = `
  UPDATE community_questions
  SET title = $3,
      body = $4,
      topic_id = $5,
      updated_at = $6
  WHERE question_id = $1
    AND author_user_id = $2
    AND status <> 'DELETED'
  RETURNING question_id`;

const INSERT_ANSWER_SQL = `
  INSERT INTO community_answers (
    answer_id,
    question_id,
    author_user_id,
    body,
    status,
    created_at,
    updated_at
  )
  SELECT $1, $2, $3, $4, 'VISIBLE', $5, $6
  WHERE EXISTS (
    SELECT 1
    FROM community_profiles AS p
    INNER JOIN community_questions AS q ON q.status = 'VISIBLE'
    WHERE p.user_id = $3
      AND q.question_id = $2
  )
  RETURNING answer_id`;

const UPDATE_ANSWER_SQL = `
  UPDATE community_answers
  SET body = $3,
      updated_at = $4
  WHERE answer_id = $1
    AND author_user_id = $2
    AND status <> 'DELETED'
  RETURNING answer_id`;

const LOCK_QUESTION_SQL = `
  SELECT author_user_id, status
  FROM community_questions
  WHERE question_id = $1
  FOR UPDATE`;

const LOCK_ANSWER_SQL = `
  SELECT question_id, author_user_id, status
  FROM community_answers
  WHERE answer_id = $1
  FOR UPDATE`;

const DELETE_ACCEPTED_BY_QUESTION_SQL = `
  DELETE FROM community_question_acceptances
  WHERE question_id = $1`;

const DELETE_ACCEPTED_BY_ANSWER_SQL = `
  DELETE FROM community_question_acceptances
  WHERE answer_id = $1`;

const DELETE_QUESTION_BY_OWNER_SQL = `
  UPDATE community_questions
  SET status = 'DELETED',
      deleted_at = COALESCE(deleted_at, $3),
      retention_expires_at = COALESCE(retention_expires_at, $4),
      updated_at = $3
  WHERE question_id = $1
    AND author_user_id = $2
    AND status <> 'DELETED'
  RETURNING question_id`;

const DELETE_ANSWER_BY_OWNER_SQL = `
  UPDATE community_answers
  SET status = 'DELETED',
      deleted_at = COALESCE(deleted_at, $3),
      retention_expires_at = COALESCE(retention_expires_at, $4),
      updated_at = $3
  WHERE answer_id = $1
    AND author_user_id = $2
    AND status <> 'DELETED'
  RETURNING answer_id`;

const ACCEPT_ANSWER_SQL = `
  INSERT INTO community_question_acceptances (question_id, answer_id, accepted_at)
  VALUES ($1, $2, $3)
  ON CONFLICT (question_id) DO UPDATE
  SET answer_id = EXCLUDED.answer_id,
      accepted_at = EXCLUDED.accepted_at`;

const MODERATOR_EXISTS_SQL = `
  SELECT 1 AS value
  FROM community_moderators
  WHERE user_id = $1`;

const TARGET_EXISTS_SQL = `
  SELECT 1 AS value
  FROM community_questions
  WHERE question_id = $1
    AND status = 'VISIBLE'
  UNION ALL
  SELECT 1 AS value
  FROM community_answers AS a
  INNER JOIN community_questions AS q ON q.question_id = a.question_id
  WHERE a.answer_id = $2
    AND a.status = 'VISIBLE'
    AND q.status = 'VISIBLE'`;

const DUPLICATE_REPORT_SQL = `
  SELECT report_id
  FROM community_reports
  WHERE reporter_user_id = $1
    AND target_type = $2
    AND target_id = $3
    AND state = 'OPEN'
  FOR UPDATE`;

const INSERT_REPORT_SQL = `
  INSERT INTO community_reports (
    report_id,
    reporter_user_id,
    target_type,
    target_id,
    category,
    details,
    state,
    created_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7)
  RETURNING
    report_id,
    reporter_user_id,
    target_type,
    target_id,
    category,
    details,
    state,
    created_at,
    resolved_at,
    retention_expires_at,
    retention_hold`;

const LIST_OPEN_REPORTS_SQL = `
  SELECT
    report_id,
    reporter_user_id,
    target_type,
    target_id,
    category,
    details,
    state,
    created_at,
    resolved_at,
    retention_expires_at,
    retention_hold
  FROM community_reports
  WHERE state = 'OPEN'
  ORDER BY created_at ASC, report_id ASC`;

const LOCK_TARGET_QUESTION_SQL = `
  SELECT status
  FROM community_questions
  WHERE question_id = $1
  FOR UPDATE`;

const LOCK_TARGET_ANSWER_SQL = `
  SELECT status, question_id
  FROM community_answers
  WHERE answer_id = $1
  FOR UPDATE`;

const UPDATE_TARGET_STATUS_SQL = `
  UPDATE %TABLE%
  SET status = $2,
      updated_at = $3,
      deleted_at = CASE WHEN $2 = 'DELETED' THEN COALESCE(deleted_at, $3) ELSE NULL END,
      retention_expires_at = CASE WHEN $2 = 'DELETED' THEN COALESCE(retention_expires_at, $4) ELSE NULL END
  WHERE %ID_COLUMN% = $1
  RETURNING status`;

const RESOLVE_TARGET_REPORTS_SQL = `
  UPDATE community_reports
  SET state = 'RESOLVED',
      resolved_at = $3,
      retention_expires_at = $4,
      resolved_by_user_id = $5
  WHERE target_type = $1
    AND target_id = $2
    AND state = 'OPEN'`;

const INSERT_MODERATION_EVENT_SQL = `
  INSERT INTO community_moderation_events (
    moderation_event_id,
    actor_user_id,
    target_type,
    target_id,
    action,
    reason_code,
    note,
    created_at,
    retention_expires_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

const LOCK_REPORT_SQL = `
  SELECT target_type, target_id, state
  FROM community_reports
  WHERE report_id = $1
  FOR UPDATE`;

const DISMISS_REPORT_SQL = `
  UPDATE community_reports
  SET state = 'DISMISSED',
      resolved_at = $2,
      retention_expires_at = $3,
      resolved_by_user_id = $4
  WHERE report_id = $1
    AND state = 'OPEN'`;

const DELETE_EXPIRED_ANSWERS_SQL = `
  DELETE FROM community_answers AS a
  WHERE a.status = 'DELETED'
    AND a.retention_expires_at IS NOT NULL
    AND a.retention_expires_at <= $1
    AND a.retention_hold = 'NONE'
    AND NOT EXISTS (
      SELECT 1
      FROM community_reports AS r
      WHERE r.target_type = 'ANSWER'
        AND r.target_id = a.answer_id
        AND r.state = 'OPEN'
    )
  RETURNING a.answer_id`;

const PURGE_EXPIRED_QUESTION_CONTENT_SQL = `
  UPDATE community_questions AS q
  SET title = '',
      body = '',
      content_purged_at = $1,
      retention_expires_at = NULL
  WHERE q.status = 'DELETED'
    AND q.retention_expires_at IS NOT NULL
    AND q.retention_expires_at <= $1
    AND q.retention_hold = 'NONE'
    AND NOT EXISTS (
      SELECT 1
      FROM community_reports AS r
      WHERE r.target_type = 'QUESTION'
        AND r.target_id = q.question_id
        AND r.state = 'OPEN'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM community_answers AS a
      INNER JOIN community_reports AS r
        ON r.target_type = 'ANSWER'
       AND r.target_id = a.answer_id
       AND r.state = 'OPEN'
      WHERE a.question_id = q.question_id
    )
  RETURNING q.question_id`;

const DELETE_EMPTY_EXPIRED_QUESTIONS_SQL = `
  DELETE FROM community_questions AS q
  WHERE q.status = 'DELETED'
    AND q.content_purged_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM community_answers AS a WHERE a.question_id = q.question_id
    )
  RETURNING q.question_id`;

const DELETE_EXPIRED_REPORTS_SQL = `
  DELETE FROM community_reports
  WHERE state <> 'OPEN'
    AND retention_expires_at IS NOT NULL
    AND retention_expires_at <= $1
    AND retention_hold = 'NONE'
  RETURNING report_id`;

const DELETE_EXPIRED_MODERATION_EVENTS_SQL = `
  DELETE FROM community_moderation_events
  WHERE retention_expires_at <= $1
    AND retention_hold = 'NONE'
  RETURNING moderation_event_id`;

function toTimestampString(value: Date | string): string {
  return normalizeCommunityTimestamp(value);
}

function toNullableTimestampString(value: Date | string | null): string | null {
  return value === null ? null : toTimestampString(value);
}

function mapProfile(row: ProfileRow): CommunityProfileRecord {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  };
}

function mapQuestion(row: QuestionRow): CommunityQuestionRecord {
  return {
    questionId: row.question_id,
    authorUserId: row.author_user_id,
    anonymizedAuthorLabel: row.anonymized_author_label,
    authorDisplayName: row.author_display_name,
    title: row.title,
    body: row.body,
    topicId: row.topic_id,
    status: row.status,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at),
    deletedAt: toNullableTimestampString(row.deleted_at),
    retentionExpiresAt: toNullableTimestampString(row.retention_expires_at),
    retentionHold: row.retention_hold
  };
}

function mapAnswer(row: AnswerRow): CommunityAnswerRecord {
  return {
    answerId: row.answer_id,
    questionId: row.question_id,
    authorUserId: row.author_user_id,
    anonymizedAuthorLabel: row.anonymized_author_label,
    authorDisplayName: row.author_display_name,
    body: row.body,
    status: row.status,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at),
    deletedAt: toNullableTimestampString(row.deleted_at),
    retentionExpiresAt: toNullableTimestampString(row.retention_expires_at),
    retentionHold: row.retention_hold
  };
}

function mapReport(row: ReportRow): CommunityReportRecord {
  return {
    reportId: row.report_id,
    reporterUserId: row.reporter_user_id,
    targetType: row.target_type,
    targetId: row.target_id,
    category: row.category,
    details: row.details,
    state: row.state,
    createdAt: toTimestampString(row.created_at),
    resolvedAt: toNullableTimestampString(row.resolved_at),
    retentionExpiresAt: toNullableTimestampString(row.retention_expires_at),
    retentionHold: row.retention_hold
  };
}

function encodeCursor(question: CommunityQuestionRecord): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: question.createdAt,
      questionId: question.questionId
    }),
    'utf8'
  ).toString('base64url');
}

export interface CommunityCursorPosition {
  readonly createdAt: string;
  readonly questionId: string;
}

export function decodeCommunityCursor(cursor: string | null): CommunityCursorPosition | null {
  if (cursor === null) {
    return null;
  }

  if (
    cursor.length === 0 ||
    cursor.length > 512 ||
    !/^[A-Za-z0-9_-]+$/u.test(cursor)
  ) {
    throw new Error('Community cursor is invalid.');
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8')
    ) as unknown;

    if (
      decoded === null ||
      typeof decoded !== 'object' ||
      Array.isArray(decoded) ||
      typeof (decoded as { createdAt?: unknown }).createdAt !== 'string' ||
      typeof (decoded as { questionId?: unknown }).questionId !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(
        (decoded as { createdAt: string }).createdAt
      ) ||
      !/^[^\u0000-\u001F\u007F-\u009F]{1,256}$/u.test(
        (decoded as { questionId: string }).questionId
      )
    ) {
      throw new Error('Community cursor shape is invalid.');
    }

    const position = decoded as CommunityCursorPosition;
    if (!Number.isFinite(Date.parse(position.createdAt))) {
      throw new Error('Community cursor timestamp is invalid.');
    }

    return position;
  } catch (_error) {
    throw new Error('Community cursor is invalid.');
  }
}

function tableUpdateSql(targetType: CommunityReportTargetType): string {
  const table = targetType === 'QUESTION' ? 'community_questions' : 'community_answers';
  const idColumn = targetType === 'QUESTION' ? 'question_id' : 'answer_id';

  return UPDATE_TARGET_STATUS_SQL
    .replace('%TABLE%', table)
    .replace('%ID_COLUMN%', idColumn);
}

/** PostgreSQL implementation of the narrow Community / Questions V1 store. */
export class PostgresCommunityRepository implements CommunityRepository {
  public constructor(
    private readonly executor: SqlExecutor,
    private readonly transactionRunner: TransactionRunner
  ) {}

  public async getProfile(userId: string): Promise<CommunityProfileRecord | null> {
    const result = await this.executor.query<ProfileRow>(FIND_PROFILE_SQL, [userId]);
    const row = result.rows[0];
    return row === undefined ? null : mapProfile(row);
  }

  public async saveProfile(
    profile: CommunityProfileRecord
  ): Promise<CommunityProfileRecord> {
    const result = await this.executor.query<ProfileRow>(UPSERT_PROFILE_SQL, [
      profile.userId,
      profile.displayName,
      profile.createdAt,
      profile.updatedAt
    ]);
    const row = result.rows[0];

    if (row === undefined) {
      throw new Error('Community profile was not persisted.');
    }

    return mapProfile(row);
  }

  public async listVisibleQuestions(input: {
    readonly limit: number;
    readonly cursor: string | null;
  }): Promise<CommunityQuestionPage> {
    const position = decodeCommunityCursor(input.cursor);
    const result = await this.executor.query<QuestionRow>(LIST_QUESTIONS_SQL, [
      position?.createdAt ?? null,
      position?.questionId ?? null,
      input.limit + 1
    ]);
    const rows = result.rows.slice(0, input.limit);
    const questions = rows.map(mapQuestion);

    return {
      questions,
      nextCursor:
        result.rows.length > input.limit && questions.length > 0
          ? encodeCursor(questions[questions.length - 1] as CommunityQuestionRecord)
          : null
    };
  }

  public async getQuestion(
    questionId: string
  ): Promise<CommunityQuestionDetailRecord | null> {
    const questionResult = await this.executor.query<QuestionRow>(
      FIND_VISIBLE_QUESTION_SQL,
      [questionId]
    );
    const question = questionResult.rows[0];

    if (question === undefined) {
      return null;
    }

    const [answerResult, acceptedResult] = await Promise.all([
      this.executor.query<AnswerRow>(FIND_VISIBLE_ANSWERS_SQL, [questionId]),
      this.executor.query<StringRow>(FIND_ACCEPTED_ANSWER_SQL, [questionId])
    ]);

    return {
      question: mapQuestion(question),
      answers: answerResult.rows.map(mapAnswer),
      acceptedAnswerId: acceptedResult.rows[0]?.value ?? null
    };
  }

  public async getQuestionRecord(
    questionId: string
  ): Promise<CommunityQuestionRecord | null> {
    const result = await this.executor.query<QuestionRow>(FIND_QUESTION_SQL, [
      questionId
    ]);
    const row = result.rows[0];
    return row === undefined ? null : mapQuestion(row);
  }

  public async getAnswerRecord(answerId: string): Promise<CommunityAnswerRecord | null> {
    const result = await this.executor.query<AnswerRow>(FIND_ANSWER_SQL, [answerId]);
    const row = result.rows[0];
    return row === undefined ? null : mapAnswer(row);
  }

  public async createQuestion(question: {
    readonly questionId: string;
    readonly authorUserId: string;
    readonly title: string;
    readonly body: string;
    readonly topicId: CommunityTopicId;
    readonly createdAt: string;
    readonly updatedAt: string;
  }): Promise<CommunityQuestionRecord | null> {
    const result = await this.executor.query<StringRow>(INSERT_QUESTION_SQL, [
      question.questionId,
      question.authorUserId,
      question.title,
      question.body,
      question.topicId,
      question.createdAt,
      question.updatedAt
    ]);

    return result.rows.length === 0
      ? null
      : this.getQuestionRecord(question.questionId);
  }

  public async updateQuestion(question: {
    readonly questionId: string;
    readonly authorUserId: string;
    readonly title: string;
    readonly body: string;
    readonly topicId: CommunityTopicId;
    readonly updatedAt: string;
  }): Promise<CommunityQuestionRecord | null> {
    const result = await this.executor.query<StringRow>(UPDATE_QUESTION_SQL, [
      question.questionId,
      question.authorUserId,
      question.title,
      question.body,
      question.topicId,
      question.updatedAt
    ]);

    return result.rows.length === 0
      ? null
      : this.getQuestionRecord(question.questionId);
  }

  public async deleteQuestion(input: {
    readonly questionId: string;
    readonly authorUserId: string;
    readonly deletedAt: string;
    readonly retentionExpiresAt: string;
  }): Promise<CommunityOwnershipOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const locked = await executor.query<{
        author_user_id: string | null;
        status: CommunityContentStatus;
      }>(LOCK_QUESTION_SQL, [input.questionId]);
      const row = locked.rows[0];

      if (row === undefined) {
        return 'not-found';
      }
      if (row.author_user_id !== input.authorUserId) {
        return 'forbidden';
      }

      await executor.query<never>(DELETE_ACCEPTED_BY_QUESTION_SQL, [
        input.questionId
      ]);

      if (row.status !== 'DELETED') {
        await executor.query<StringRow>(DELETE_QUESTION_BY_OWNER_SQL, [
          input.questionId,
          input.authorUserId,
          input.deletedAt,
          input.retentionExpiresAt
        ]);
      }

      return 'deleted';
    });
  }

  public async createAnswer(answer: {
    readonly answerId: string;
    readonly questionId: string;
    readonly authorUserId: string;
    readonly body: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  }): Promise<CommunityAnswerRecord | null> {
    const result = await this.executor.query<StringRow>(INSERT_ANSWER_SQL, [
      answer.answerId,
      answer.questionId,
      answer.authorUserId,
      answer.body,
      answer.createdAt,
      answer.updatedAt
    ]);

    return result.rows.length === 0 ? null : this.getAnswerRecord(answer.answerId);
  }

  public async updateAnswer(answer: {
    readonly answerId: string;
    readonly authorUserId: string;
    readonly body: string;
    readonly updatedAt: string;
  }): Promise<CommunityAnswerRecord | null> {
    const result = await this.executor.query<StringRow>(UPDATE_ANSWER_SQL, [
      answer.answerId,
      answer.authorUserId,
      answer.body,
      answer.updatedAt
    ]);

    return result.rows.length === 0 ? null : this.getAnswerRecord(answer.answerId);
  }

  public async deleteAnswer(input: {
    readonly answerId: string;
    readonly authorUserId: string;
    readonly deletedAt: string;
    readonly retentionExpiresAt: string;
  }): Promise<CommunityOwnershipOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const locked = await executor.query<{
        question_id: string;
        author_user_id: string | null;
        status: CommunityContentStatus;
      }>(LOCK_ANSWER_SQL, [input.answerId]);
      const row = locked.rows[0];

      if (row === undefined) {
        return 'not-found';
      }
      if (row.author_user_id !== input.authorUserId) {
        return 'forbidden';
      }

      await executor.query<never>(DELETE_ACCEPTED_BY_ANSWER_SQL, [input.answerId]);

      if (row.status !== 'DELETED') {
        await executor.query<StringRow>(DELETE_ANSWER_BY_OWNER_SQL, [
          input.answerId,
          input.authorUserId,
          input.deletedAt,
          input.retentionExpiresAt
        ]);
      }

      return 'deleted';
    });
  }

  public async setAcceptedAnswer(input: {
    readonly questionId: string;
    readonly questionAuthorUserId: string;
    readonly answerId: string | null;
    readonly acceptedAt: string;
  }): Promise<CommunityOwnershipOutcome | 'accepted' | 'removed'> {
    return this.transactionRunner.run(async (executor) => {
      const questionResult = await executor.query<{
        author_user_id: string | null;
        status: CommunityContentStatus;
      }>(LOCK_QUESTION_SQL, [input.questionId]);
      const question = questionResult.rows[0];

      if (question === undefined || question.status !== 'VISIBLE') {
        return 'not-found';
      }
      if (question.author_user_id !== input.questionAuthorUserId) {
        return 'forbidden';
      }

      if (input.answerId === null) {
        await executor.query<never>(DELETE_ACCEPTED_BY_QUESTION_SQL, [
          input.questionId
        ]);
        return 'removed';
      }

      const answerResult = await executor.query<{
        question_id: string;
        status: CommunityContentStatus;
      }>(LOCK_ANSWER_SQL, [input.answerId]);
      const answer = answerResult.rows[0];

      if (
        answer === undefined ||
        answer.question_id !== input.questionId ||
        answer.status !== 'VISIBLE'
      ) {
        return 'not-found';
      }

      await executor.query<never>(ACCEPT_ANSWER_SQL, [
        input.questionId,
        input.answerId,
        input.acceptedAt
      ]);
      return 'accepted';
    });
  }

  public async createReport(report: {
    readonly reportId: string;
    readonly reporterUserId: string;
    readonly targetType: CommunityReportTargetType;
    readonly targetId: string;
    readonly category: CommunityReportCategory;
    readonly details: string;
    readonly createdAt: string;
  }): Promise<CommunityReportCreateOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const targetResult = await executor.query<StringRow>(TARGET_EXISTS_SQL, [
        report.targetType === 'QUESTION' ? report.targetId : '',
        report.targetType === 'ANSWER' ? report.targetId : ''
      ]);

      if (targetResult.rows.length === 0) {
        return { outcome: 'invalid-target' };
      }

      const duplicateResult = await executor.query<StringRow>(DUPLICATE_REPORT_SQL, [
        report.reporterUserId,
        report.targetType,
        report.targetId
      ]);

      if (duplicateResult.rows.length > 0) {
        return { outcome: 'duplicate' };
      }

      const result = await executor.query<ReportRow>(INSERT_REPORT_SQL, [
        report.reportId,
        report.reporterUserId,
        report.targetType,
        report.targetId,
        report.category,
        report.details,
        report.createdAt
      ]);
      const row = result.rows[0];

      if (row === undefined) {
        throw new Error('Community report was not persisted.');
      }

      return { outcome: 'created', report: mapReport(row) };
    });
  }

  public async isModerator(userId: string): Promise<boolean> {
    const result = await this.executor.query<StringRow>(MODERATOR_EXISTS_SQL, [
      userId
    ]);
    return result.rows.length > 0;
  }

  public async listOpenReports(): Promise<readonly CommunityReportRecord[]> {
    const result = await this.executor.query<ReportRow>(LIST_OPEN_REPORTS_SQL);
    return result.rows.map(mapReport);
  }

  public async moderate(input: {
    readonly moderationEventId: string;
    readonly actorUserId: string;
    readonly targetType: CommunityReportTargetType;
    readonly targetId: string;
    readonly action: CommunityModerationAction;
    readonly reasonCode: CommunityModerationReasonCode;
    readonly note: string | null;
    readonly createdAt: string;
    readonly retentionExpiresAt: string;
    readonly reportId: string | null;
  }): Promise<CommunityModerationOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const moderator = await executor.query<StringRow>(MODERATOR_EXISTS_SQL, [
        input.actorUserId
      ]);

      if (moderator.rows.length === 0) {
        return { outcome: 'forbidden' };
      }

      let targetType = input.targetType;
      let targetId = input.targetId;
      let targetStatus: CommunityContentStatus | 'DISMISSED' = 'VISIBLE';

      if (input.action === 'DISMISS_REPORT') {
        if (input.reportId === null) {
          return { outcome: 'invalid-target' };
        }

        const reportResult = await executor.query<{
          target_type: CommunityReportTargetType;
          target_id: string;
          state: CommunityReportState;
        }>(LOCK_REPORT_SQL, [input.reportId]);
        const report = reportResult.rows[0];

        if (report === undefined || report.state !== 'OPEN') {
          return { outcome: 'not-found' };
        }

        targetType = report.target_type;
        targetId = report.target_id;
        await executor.query<never>(DISMISS_REPORT_SQL, [
          input.reportId,
          input.createdAt,
          input.retentionExpiresAt,
          input.actorUserId
        ]);
        targetStatus = 'DISMISSED';
      } else {
        const targetResult =
          input.targetType === 'QUESTION'
            ? await executor.query<StatusRow>(LOCK_TARGET_QUESTION_SQL, [
                input.targetId
              ])
            : await executor.query<StatusRow>(LOCK_TARGET_ANSWER_SQL, [
                input.targetId
              ]);
        const target = targetResult.rows[0];

        if (target === undefined) {
          return { outcome: 'not-found' };
        }

        if (input.action === 'RESTORE' && target.status === 'DELETED') {
          return { outcome: 'invalid-target' };
        }

        targetStatus =
          input.action === 'HIDE'
            ? 'HIDDEN'
            : input.action === 'RESTORE'
              ? 'VISIBLE'
              : 'DELETED';

        await executor.query<StatusRow>(
          tableUpdateSql(input.targetType),
          [
            input.targetId,
            targetStatus,
            input.createdAt,
            input.retentionExpiresAt
          ]
        );

        if (targetStatus === 'DELETED') {
          await executor.query<never>(
            input.targetType === 'QUESTION'
              ? DELETE_ACCEPTED_BY_QUESTION_SQL
              : DELETE_ACCEPTED_BY_ANSWER_SQL,
            [input.targetId]
          );
        }

        await executor.query<never>(RESOLVE_TARGET_REPORTS_SQL, [
          input.targetType,
          input.targetId,
          input.createdAt,
          input.retentionExpiresAt,
          input.actorUserId
        ]);
      }

      await executor.query<never>(INSERT_MODERATION_EVENT_SQL, [
        input.moderationEventId,
        input.actorUserId,
        targetType,
        targetId,
        input.action,
        input.reasonCode,
        input.note,
        input.createdAt,
        input.retentionExpiresAt
      ]);

      return {
        outcome: 'updated',
        targetType,
        targetId,
        status: targetStatus
      };
    });
  }

  public async purgeExpiredRetention(
    now: string
  ): Promise<CommunityRetentionPurgeResult> {
    return this.transactionRunner.run(async (executor) => {
      const answers = await executor.query<StringRow>(DELETE_EXPIRED_ANSWERS_SQL, [
        now
      ]);
      const purgedQuestionContent = await executor.query<StringRow>(
        PURGE_EXPIRED_QUESTION_CONTENT_SQL,
        [now]
      );
      const questions = await executor.query<StringRow>(
        DELETE_EMPTY_EXPIRED_QUESTIONS_SQL,
        [now]
      );
      const reports = await executor.query<StringRow>(DELETE_EXPIRED_REPORTS_SQL, [
        now
      ]);
      const moderationEvents = await executor.query<StringRow>(
        DELETE_EXPIRED_MODERATION_EVENTS_SQL,
        [now]
      );

      return {
        deletedAnswers: answers.rows.length,
        deletedQuestions:
          questions.rows.length + purgedQuestionContent.rows.length,
        deletedReports: reports.rows.length,
        deletedModerationEvents: moderationEvents.rows.length
      };
    });
  }
}
