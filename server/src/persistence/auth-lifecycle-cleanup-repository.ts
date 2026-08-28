export const AUTH_LIFECYCLE_CLEANUP_DEFAULT_BATCH_SIZE = 100;
export const AUTH_LIFECYCLE_CLEANUP_MAX_BATCH_SIZE = 100;

export interface AuthLifecycleCleanupBatchInput {
  /** One server-clock instant shared by all predicates in this phase. */
  readonly now: string;
  /** Internal-only bounded batch size; never supplied by a browser. */
  readonly batchSize: number;
}

export interface AuthLifecycleCleanupResult {
  /** True when a full batch means eligible work may still remain. */
  readonly moreWork: boolean;
}

export interface AuthLifecycleCleanupRepository {
  cleanupExpiredSessions(
    input: AuthLifecycleCleanupBatchInput
  ): Promise<AuthLifecycleCleanupResult>;

  cleanupExpiredUnconsumedChallenges(
    input: AuthLifecycleCleanupBatchInput
  ): Promise<AuthLifecycleCleanupResult>;

  cleanupConsumedChallenges(
    input: AuthLifecycleCleanupBatchInput
  ): Promise<AuthLifecycleCleanupResult>;
}

export function assertAuthLifecycleCleanupBatchSize(batchSize: number): void {
  if (
    !Number.isSafeInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > AUTH_LIFECYCLE_CLEANUP_MAX_BATCH_SIZE
  ) {
    throw new Error(
      `Auth lifecycle cleanup batch size must be an integer from 1 to ${AUTH_LIFECYCLE_CLEANUP_MAX_BATCH_SIZE}.`
    );
  }
}
