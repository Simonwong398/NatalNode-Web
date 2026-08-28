import type { Clock } from '../app/creation-boundaries.js';
import {
  loadServerEnvironment,
  type ServerEnvironmentConfig
} from '../runtime/index.js';
import {
  createPostgresPoolRuntime,
  type PostgresPoolRuntimeConfig
} from '../runtime/index.js';
import { SystemClock } from '../runtime/system-clock.js';
import {
  runAuthLifecycleMaintenanceWithRuntime,
  type AuthLifecycleMaintenanceResult,
  type AuthLifecycleMaintenanceRuntime
} from '../maintenance/index.js';

export interface AuthLifecycleMaintenanceExecutableDependencies {
  readonly loadEnvironment: () => ServerEnvironmentConfig;
  readonly createRuntime: (
    config: PostgresPoolRuntimeConfig
  ) => AuthLifecycleMaintenanceRuntime;
  readonly clock: Clock;
}

function createDefaultDependencies(): AuthLifecycleMaintenanceExecutableDependencies {
  return {
    loadEnvironment: loadServerEnvironment,
    createRuntime: (config) => createPostgresPoolRuntime(config),
    clock: new SystemClock()
  };
}

function configurationFailure(): AuthLifecycleMaintenanceResult {
  return {
    status: 'error',
    failedPhase: 'configuration',
    error: 'configuration_invalid'
  };
}

function runtimeFailure(): AuthLifecycleMaintenanceResult {
  return {
    status: 'error',
    failedPhase: 'runtime',
    error: 'runtime_failed'
  };
}

export async function runAuthLifecycleMaintenanceExecutable(
  dependencies: AuthLifecycleMaintenanceExecutableDependencies =
    createDefaultDependencies()
): Promise<AuthLifecycleMaintenanceResult> {
  let environmentConfig: ServerEnvironmentConfig;

  try {
    environmentConfig = dependencies.loadEnvironment();
  } catch (_error) {
    return configurationFailure();
  }

  let runtime: AuthLifecycleMaintenanceRuntime;

  try {
    runtime = dependencies.createRuntime(
      environmentConfig.postgresPoolRuntimeConfig
    );
  } catch (_error) {
    return runtimeFailure();
  }

  return runAuthLifecycleMaintenanceWithRuntime(runtime, dependencies.clock);
}
