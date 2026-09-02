import type { Clock } from '../app/creation-boundaries.js';
import {
  normalizeCommunityTimestamp
} from '../community/community-domain.js';
import type {
  CommunityRepository,
  CommunityRetentionPurgeResult
} from '../community/community-repository.js';

export interface CommunityRetentionMaintenanceRuntime {
  readonly communityRepository: CommunityRepository;
  close(): Promise<void>;
}

export interface CommunityRetentionMaintenanceSuccess {
  readonly status: 'ok';
  readonly now: string;
  readonly purge: CommunityRetentionPurgeResult;
}

export interface CommunityRetentionMaintenanceFailure {
  readonly status: 'error';
  readonly failedPhase: 'configuration' | 'runtime' | 'purge' | 'shutdown';
  readonly error:
    | 'configuration_invalid'
    | 'runtime_failed'
    | 'purge_failed'
    | 'shutdown_failed';
}

export type CommunityRetentionMaintenanceResult =
  | CommunityRetentionMaintenanceSuccess
  | CommunityRetentionMaintenanceFailure;

function failure(
  failedPhase: CommunityRetentionMaintenanceFailure['failedPhase'],
  error: CommunityRetentionMaintenanceFailure['error']
): CommunityRetentionMaintenanceFailure {
  return { status: 'error', failedPhase, error };
}

/** Runs one retention purge using the frozen Community retention predicates. */
export async function runCommunityRetentionMaintenance(
  repository: CommunityRepository,
  clock: Clock
): Promise<CommunityRetentionMaintenanceResult> {
  let now: string;
  try {
    now = normalizeCommunityTimestamp(clock.now());
  } catch (_error) {
    return failure('configuration', 'configuration_invalid');
  }

  try {
    const purge = await repository.purgeExpiredRetention(now);
    return { status: 'ok', now, purge };
  } catch (_error) {
    return failure('purge', 'purge_failed');
  }
}

/** Runs one retention purge and always attempts to close its short-lived runtime. */
export async function runCommunityRetentionMaintenanceWithRuntime(
  runtime: CommunityRetentionMaintenanceRuntime,
  clock: Clock
): Promise<CommunityRetentionMaintenanceResult> {
  let result: CommunityRetentionMaintenanceResult;
  try {
    result = await runCommunityRetentionMaintenance(
      runtime.communityRepository,
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
