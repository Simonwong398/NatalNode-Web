import type { Clock } from '../app/creation-boundaries.js';
import {
  loadServerEnvironment,
  type PostgresPoolRuntimeConfig,
  type ServerEnvironmentConfig
} from '../runtime/index.js';
import { createPostgresPoolRuntime } from '../runtime/index.js';
import { SystemClock } from '../runtime/system-clock.js';
import {
  runCommunityRetentionMaintenanceWithRuntime,
  type CommunityRetentionMaintenanceResult,
  type CommunityRetentionMaintenanceRuntime
} from '../maintenance/index.js';

export interface CommunityRetentionMaintenanceExecutableDependencies {
  readonly loadEnvironment: () => ServerEnvironmentConfig;
  readonly createRuntime: (
    config: PostgresPoolRuntimeConfig
  ) => CommunityRetentionMaintenanceRuntime;
  readonly clock: Clock;
}

function createDefaultDependencies(): CommunityRetentionMaintenanceExecutableDependencies {
  return {
    loadEnvironment: loadServerEnvironment,
    createRuntime: (config) => createPostgresPoolRuntime(config),
    clock: new SystemClock()
  };
}

function failure(
  failedPhase: 'configuration' | 'runtime',
  error: 'configuration_invalid' | 'runtime_failed'
): CommunityRetentionMaintenanceResult {
  return { status: 'error', failedPhase, error };
}

export async function runCommunityRetentionMaintenanceExecutable(
  dependencies: CommunityRetentionMaintenanceExecutableDependencies =
    createDefaultDependencies()
): Promise<CommunityRetentionMaintenanceResult> {
  let environmentConfig: ServerEnvironmentConfig;
  try {
    environmentConfig = dependencies.loadEnvironment();
  } catch (_error) {
    return failure('configuration', 'configuration_invalid');
  }

  let runtime: CommunityRetentionMaintenanceRuntime;
  try {
    runtime = dependencies.createRuntime(
      environmentConfig.postgresPoolRuntimeConfig
    );
  } catch (_error) {
    return failure('runtime', 'runtime_failed');
  }

  return runCommunityRetentionMaintenanceWithRuntime(runtime, dependencies.clock);
}
