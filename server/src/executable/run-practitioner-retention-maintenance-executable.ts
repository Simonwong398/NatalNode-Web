import type { Clock } from '../app/creation-boundaries.js';
import {
  loadServerEnvironment,
  type ServerEnvironmentConfig,
  type PostgresPoolRuntimeConfig
} from '../runtime/index.js';
import { createPostgresPoolRuntime } from '../runtime/index.js';
import { SystemClock } from '../runtime/system-clock.js';
import {
  runPractitionerRetentionMaintenanceWithRuntime,
  type PractitionerRetentionMaintenanceResult,
  type PractitionerRetentionMaintenanceRuntime
} from '../maintenance/index.js';

export interface PractitionerRetentionMaintenanceExecutableDependencies {
  readonly loadEnvironment: () => ServerEnvironmentConfig;
  readonly createRuntime: (
    config: PostgresPoolRuntimeConfig
  ) => PractitionerRetentionMaintenanceRuntime;
  readonly clock: Clock;
}

function createDefaultDependencies(): PractitionerRetentionMaintenanceExecutableDependencies {
  return {
    loadEnvironment: loadServerEnvironment,
    createRuntime: (config) => createPostgresPoolRuntime(config),
    clock: new SystemClock()
  };
}

function failure(
  failedPhase: 'configuration' | 'runtime',
  error: 'configuration_invalid' | 'runtime_failed'
): PractitionerRetentionMaintenanceResult {
  return { status: 'error', failedPhase, error };
}

export async function runPractitionerRetentionMaintenanceExecutable(
  dependencies: PractitionerRetentionMaintenanceExecutableDependencies =
    createDefaultDependencies()
): Promise<PractitionerRetentionMaintenanceResult> {
  let environmentConfig: ServerEnvironmentConfig;
  try {
    environmentConfig = dependencies.loadEnvironment();
  } catch (_error) {
    return failure('configuration', 'configuration_invalid');
  }

  let runtime: PractitionerRetentionMaintenanceRuntime;
  try {
    runtime = dependencies.createRuntime(
      environmentConfig.postgresPoolRuntimeConfig
    );
  } catch (_error) {
    return failure('runtime', 'runtime_failed');
  }

  return runPractitionerRetentionMaintenanceWithRuntime(runtime, dependencies.clock);
}
