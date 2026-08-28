import type { Clock } from '../app/creation-boundaries.js';
import {
  assertAuthLifecycleCleanupBatchSize,
  AUTH_LIFECYCLE_CLEANUP_DEFAULT_BATCH_SIZE,
  type AuthLifecycleCleanupBatchInput,
  type AuthLifecycleCleanupRepository,
  type AuthLifecycleCleanupResult
} from '../persistence/auth-lifecycle-cleanup-repository.js';

export interface AuthLifecycleCleanupOptions {
  /** Internal-only override for focused operations; defaults to 100. */
  readonly batchSize?: number;
}

/** Supplies one server-clock cutoff to one independent cleanup phase. */
export class AuthLifecycleCleanup {
  private readonly batchSize: number;

  public constructor(
    private readonly repository: AuthLifecycleCleanupRepository,
    private readonly clock: Clock,
    options: AuthLifecycleCleanupOptions = {}
  ) {
    this.batchSize = options.batchSize ?? AUTH_LIFECYCLE_CLEANUP_DEFAULT_BATCH_SIZE;
    assertAuthLifecycleCleanupBatchSize(this.batchSize);
  }

  public cleanupExpiredSessions(): Promise<AuthLifecycleCleanupResult> {
    return this.repository.cleanupExpiredSessions(this.createBatchInput());
  }

  public cleanupExpiredUnconsumedChallenges(): Promise<AuthLifecycleCleanupResult> {
    return this.repository.cleanupExpiredUnconsumedChallenges(
      this.createBatchInput()
    );
  }

  public cleanupConsumedChallenges(): Promise<AuthLifecycleCleanupResult> {
    return this.repository.cleanupConsumedChallenges(this.createBatchInput());
  }

  private createBatchInput(): AuthLifecycleCleanupBatchInput {
    return {
      now: this.clock.now(),
      batchSize: this.batchSize
    };
  }
}
