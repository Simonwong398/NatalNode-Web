import type { Clock } from '../app/creation-boundaries.js';
import {
  normalizePractitionerTimestamp
} from '../practitioner/practitioner-domain.js';
import type {
  PractitionerRepository,
  PractitionerRetentionPurgeResult
} from '../practitioner/practitioner-repository.js';

export interface PractitionerRetentionMaintenanceRuntime {
  readonly practitionerRepository: PractitionerRepository;
  close(): Promise<void>;
}

export interface PractitionerRetentionMaintenanceSuccess {
  readonly status: 'ok';
  readonly now: string;
  readonly purge: PractitionerRetentionPurgeResult;
}

export interface PractitionerRetentionMaintenanceFailure {
  readonly status: 'error';
  readonly failedPhase: 'configuration' | 'runtime' | 'purge' | 'shutdown';
  readonly error:
    | 'configuration_invalid'
    | 'runtime_failed'
    | 'purge_failed'
    | 'shutdown_failed';
}

export type PractitionerRetentionMaintenanceResult =
  | PractitionerRetentionMaintenanceSuccess
  | PractitionerRetentionMaintenanceFailure;

function failure(
  failedPhase: PractitionerRetentionMaintenanceFailure['failedPhase'],
  error: PractitionerRetentionMaintenanceFailure['error']
): PractitionerRetentionMaintenanceFailure {
  return { status: 'error', failedPhase, error };
}

/** Runs one bounded retention purge; repository policy applies hold checks. */
export async function runPractitionerRetentionMaintenance(
  repository: PractitionerRepository,
  clock: Clock
): Promise<PractitionerRetentionMaintenanceResult> {
  let now: string;
  try {
    now = normalizePractitionerTimestamp(clock.now());
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
export async function runPractitionerRetentionMaintenanceWithRuntime(
  runtime: PractitionerRetentionMaintenanceRuntime,
  clock: Clock
): Promise<PractitionerRetentionMaintenanceResult> {
  let result: PractitionerRetentionMaintenanceResult;
  try {
    result = await runPractitionerRetentionMaintenance(
      runtime.practitionerRepository,
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
