import type { Clock } from '../app/creation-boundaries.js';
import {
  loadServerEnvironment,
  type PostgresPoolRuntimeConfig,
  type ServerEnvironmentConfig
} from '../runtime/index.js';
import { createPostgresPoolRuntime } from '../runtime/index.js';
import { SystemClock } from '../runtime/system-clock.js';
import {
  runFeedbackRetentionMaintenanceWithRuntime,
  type FeedbackRetentionMaintenanceResult,
  type FeedbackRetentionMaintenanceRuntime
} from '../maintenance/index.js';
import { PostgresFeedbackRetentionRepository } from '../persistence/postgres/postgres-feedback-retention-repository.js';

export interface FeedbackRetentionMaintenanceExecutableDependencies {
  readonly loadEnvironment: () => ServerEnvironmentConfig;
  readonly createRuntime: (
    config: PostgresPoolRuntimeConfig
  ) => FeedbackRetentionMaintenanceRuntime;
  readonly clock: Clock;
}

function createDefaultDependencies(): FeedbackRetentionMaintenanceExecutableDependencies {
  return {
    loadEnvironment: loadServerEnvironment,
    createRuntime: (config) => {
      const runtime = createPostgresPoolRuntime(config);
      return {
        feedbackRetentionRepository: new PostgresFeedbackRetentionRepository(
          runtime.sqlExecutor
        ),
        close: runtime.close
      };
    },
    clock: new SystemClock()
  };
}

function failure(
  failedPhase: 'configuration' | 'runtime',
  error: 'configuration_invalid' | 'runtime_failed'
): FeedbackRetentionMaintenanceResult {
  return { status: 'error', failedPhase, error };
}

export async function runFeedbackRetentionMaintenanceExecutable(
  dependencies: FeedbackRetentionMaintenanceExecutableDependencies =
    createDefaultDependencies()
): Promise<FeedbackRetentionMaintenanceResult> {
  let environmentConfig: ServerEnvironmentConfig;

  try {
    environmentConfig = dependencies.loadEnvironment();
  } catch (_error) {
    return failure('configuration', 'configuration_invalid');
  }

  let runtime: FeedbackRetentionMaintenanceRuntime;

  try {
    runtime = dependencies.createRuntime(
      environmentConfig.postgresPoolRuntimeConfig
    );
  } catch (_error) {
    return failure('runtime', 'runtime_failed');
  }

  return runFeedbackRetentionMaintenanceWithRuntime(runtime, dependencies.clock);
}
