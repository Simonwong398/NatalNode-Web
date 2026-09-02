import type { SqlExecutor } from '../../db/index.js';
import type {
  FeedbackRetentionPurgeResult,
  FeedbackRetentionRepository
} from '../feedback-retention-repository.js';

export const FEEDBACK_RAW_RETENTION_DAYS = 180;
export const FEEDBACK_RETENTION_PURGE_BATCH_SIZE = 500;

const DELETE_EXPIRED_FEEDBACK_SQL = `
  WITH expired AS (
    SELECT feedback_id
    FROM feedback_submissions
    WHERE created_at < $1
    ORDER BY created_at ASC, feedback_id ASC
    LIMIT $2
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM feedback_submissions AS feedback
  USING expired
  WHERE feedback.feedback_id = expired.feedback_id
  RETURNING feedback.feedback_id`;

function normalizeNow(value: string): string {
  const timestamp = new Date(value);

  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== value) {
    throw new Error('Feedback retention timestamp is invalid.');
  }

  return value;
}

function cutoffFor(now: string): string {
  const timestamp = Date.parse(now);
  return new Date(
    timestamp - FEEDBACK_RAW_RETENTION_DAYS * 24 * 60 * 60 * 1_000
  ).toISOString();
}

/** Deletes one bounded batch; repeated invocations are idempotent. */
export class PostgresFeedbackRetentionRepository
  implements FeedbackRetentionRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async purgeExpiredRetention(
    now: string
  ): Promise<FeedbackRetentionPurgeResult> {
    const normalizedNow = normalizeNow(now);
    const cutoffAt = cutoffFor(normalizedNow);
    const result = await this.executor.query<{ feedback_id: string }>(
      DELETE_EXPIRED_FEEDBACK_SQL,
      [cutoffAt, FEEDBACK_RETENTION_PURGE_BATCH_SIZE]
    );

    return {
      deleted: result.rows.length,
      cutoffAt,
      batchSize: FEEDBACK_RETENTION_PURGE_BATCH_SIZE
    };
  }
}
