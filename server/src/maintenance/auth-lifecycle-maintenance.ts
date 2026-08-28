import type { Clock } from '../app/creation-boundaries.js';
import { AuthLifecycleCleanup } from '../auth-runtime/auth-lifecycle-cleanup.js';
import type {
  AuthLifecycleCleanupRepository,
  AuthLifecycleCleanupResult
} from '../persistence/auth-lifecycle-cleanup-repository.js';

export type AuthLifecycleMaintenanceCleanupPhase =
  | 'expiredSessions'
  | 'expiredUnconsumedChallenges'
  | 'consumedChallenges';

export type AuthLifecycleMaintenanceFailurePhase =
  | AuthLifecycleMaintenanceCleanupPhase
  | 'configuration'
  | 'runtime'
  | 'shutdown';

export interface AuthLifecycleMaintenanceCleanup {
  cleanupExpiredSessions(): Promise<AuthLifecycleCleanupResult>;
  cleanupExpiredUnconsumedChallenges(): Promise<AuthLifecycleCleanupResult>;
  cleanupConsumedChallenges(): Promise<AuthLifecycleCleanupResult>;
}

export interface AuthLifecycleMaintenanceRuntime {
  readonly authLifecycleCleanupRepository: AuthLifecycleCleanupRepository;
  close(): Promise<void>;
}

export interface AuthLifecycleMaintenanceSuccess {
  readonly status: 'ok';
  readonly phases: {
    readonly expiredSessions: AuthLifecycleCleanupResult;
    readonly expiredUnconsumedChallenges: AuthLifecycleCleanupResult;
    readonly consumedChallenges: AuthLifecycleCleanupResult;
  };
}

export interface AuthLifecycleMaintenanceFailure {
  readonly status: 'error';
  readonly failedPhase: AuthLifecycleMaintenanceFailurePhase;
  readonly error:
    | 'cleanup_failed'
    | 'configuration_invalid'
    | 'runtime_failed'
    | 'shutdown_failed';
}

export type AuthLifecycleMaintenanceResult =
  | AuthLifecycleMaintenanceSuccess
  | AuthLifecycleMaintenanceFailure;

function phaseFailure(
  failedPhase: AuthLifecycleMaintenanceFailurePhase,
  error: AuthLifecycleMaintenanceFailure['error']
): AuthLifecycleMaintenanceFailure {
  return {
    status: 'error',
    failedPhase,
    error
  };
}

/** Runs one bounded, fail-fast invocation of the three independent phases. */
export async function runAuthLifecycleMaintenance(
  cleanup: AuthLifecycleMaintenanceCleanup
): Promise<AuthLifecycleMaintenanceResult> {
  let expiredSessions: AuthLifecycleCleanupResult;

  try {
    expiredSessions = await cleanup.cleanupExpiredSessions();
  } catch (_error) {
    return phaseFailure('expiredSessions', 'cleanup_failed');
  }

  let expiredUnconsumedChallenges: AuthLifecycleCleanupResult;

  try {
    expiredUnconsumedChallenges =
      await cleanup.cleanupExpiredUnconsumedChallenges();
  } catch (_error) {
    return phaseFailure(
      'expiredUnconsumedChallenges',
      'cleanup_failed'
    );
  }

  let consumedChallenges: AuthLifecycleCleanupResult;

  try {
    consumedChallenges = await cleanup.cleanupConsumedChallenges();
  } catch (_error) {
    return phaseFailure('consumedChallenges', 'cleanup_failed');
  }

  return {
    status: 'ok',
    phases: {
      expiredSessions,
      expiredUnconsumedChallenges,
      consumedChallenges
    }
  };
}

/** Wires B1 to a short-lived runtime and always attempts runtime shutdown. */
export async function runAuthLifecycleMaintenanceWithRuntime(
  runtime: AuthLifecycleMaintenanceRuntime,
  clock: Clock
): Promise<AuthLifecycleMaintenanceResult> {
  let result: AuthLifecycleMaintenanceResult;

  try {
    const cleanup = new AuthLifecycleCleanup(
      runtime.authLifecycleCleanupRepository,
      clock
    );
    result = await runAuthLifecycleMaintenance(cleanup);
  } catch (_error) {
    result = phaseFailure('runtime', 'runtime_failed');
  }

  try {
    await runtime.close();
  } catch (_error) {
    return phaseFailure('shutdown', 'shutdown_failed');
  }

  return result;
}
