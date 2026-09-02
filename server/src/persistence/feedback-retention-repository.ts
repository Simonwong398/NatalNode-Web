export interface FeedbackRetentionPurgeResult {
  readonly deleted: number;
  readonly cutoffAt: string;
  readonly batchSize: number;
}

/** Separate maintenance boundary; normal Feedback remains create-only. */
export interface FeedbackRetentionRepository {
  purgeExpiredRetention(now: string): Promise<FeedbackRetentionPurgeResult>;
}
