import type { FeedbackCategory } from '@natalnode/contracts';

export interface FeedbackSubmissionRecord {
  readonly feedbackId: string;
  readonly userId: string;
  readonly category: FeedbackCategory;
  readonly message: string;
  /** ISO 8601 timestamp supplied by the server Clock. */
  readonly createdAt: string;
}

/** Create-only persistence boundary for the private Feedback MVP. */
export interface FeedbackSubmissionRepository {
  create(submission: FeedbackSubmissionRecord): Promise<void>;
}
