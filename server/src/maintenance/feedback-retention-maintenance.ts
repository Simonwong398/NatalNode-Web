import type { Clock } from '../app/creation-boundaries.js';
import type {
  FeedbackRetentionPurgeResult,
  FeedbackRetentionRepository
} from '../persistence/index.js';

export interface FeedbackRetentionMaintenanceRuntime {
  readonly feedbackRetentionRepository: FeedbackRetentionRepository;
  close(): Promise<void>;
}

export interface FeedbackRetentionMaintenanceSuccess {
  readonly status: 'ok';
  readonly now: string;
  readonly purge: FeedbackRetentionPurgeResult;
}

export interface FeedbackRetentionMaintenanceFailure {
  readonly status: 'error';
  readonly failedPhase: 'configuration' | 'runtime' | 'purge' | 'shutdown';
  readonly error:
    | 'configuration_invalid'
    | 'runtime_failed'
    | 'purge_failed'
    | 'shutdown_failed';
}

export type FeedbackRetentionMaintenanceResult =
  | FeedbackRetentionMaintenanceSuccess
  | FeedbackRetentionMaintenanceFailure;

function failure(
  failedPhase: FeedbackRetentionMaintenanceFailure['failedPhase'],
  error: FeedbackRetentionMaintenanceFailure['error']
): FeedbackRetentionMaintenanceFailure {
  return { status: 'error', failedPhase, error };
}

function normalizeTimestamp(value: string): string {
  const timestamp = new Date(value);

  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== value) {
    throw new Error('Feedback retention timestamp is invalid.');
  }

  return value;
}

/** Runs one bounded, idempotent Feedback retention batch. */
export async function runFeedbackRetentionMaintenance(
  repository: FeedbackRetentionRepository,
  clock: Clock
): Promise<FeedbackRetentionMaintenanceResult> {
  let now: string;

  try {
    now = normalizeTimestamp(clock.now());
  } catch (_error) {
    return failure('configuration', 'configuration_invalid');
  }

  try {
    return {
      status: 'ok',
      now,
      purge: await repository.purgeExpiredRetention(now)
    };
  } catch (_error) {
    return failure('purge', 'purge_failed');
  }
}

/** Always closes the short-lived runtime after the one-shot operation. */
export async function runFeedbackRetentionMaintenanceWithRuntime(
  runtime: FeedbackRetentionMaintenanceRuntime,
  clock: Clock
): Promise<FeedbackRetentionMaintenanceResult> {
  let result: FeedbackRetentionMaintenanceResult;

  try {
    result = await runFeedbackRetentionMaintenance(
      runtime.feedbackRetentionRepository,
      clock
    );
  } catch (_error) {
    result = failure('runtime', 'runtime_failed');
  }

  try {
    await runtime.close();
  } catch (_error) {
    return failure('shutdown', 'shutdown_failed');
  }

  return result;
}
