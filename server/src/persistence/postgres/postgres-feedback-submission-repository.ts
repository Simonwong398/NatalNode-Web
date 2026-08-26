import type { SqlExecutor } from '../../db/index.js';
import type {
  FeedbackSubmissionRecord,
  FeedbackSubmissionRepository
} from '../feedback-submission-repository.js';

const INSERT_FEEDBACK_SUBMISSION_SQL = `
  INSERT INTO feedback_submissions (
    feedback_id,
    user_id,
    category,
    message,
    created_at
  )
  VALUES ($1, $2, $3, $4, $5)`;

export class PostgresFeedbackSubmissionRepository
implements FeedbackSubmissionRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(submission: FeedbackSubmissionRecord): Promise<void> {
    await this.executor.query<never>(INSERT_FEEDBACK_SUBMISSION_SQL, [
      submission.feedbackId,
      submission.userId,
      submission.category,
      submission.message,
      submission.createdAt
    ]);
  }
}
