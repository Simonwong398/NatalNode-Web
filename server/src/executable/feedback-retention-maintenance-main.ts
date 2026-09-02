import { isMainModule } from './is-main-module.js';
import {
  runFeedbackRetentionMaintenanceExecutable,
  type FeedbackRetentionMaintenanceExecutableDependencies
} from './run-feedback-retention-maintenance-executable.js';
import type { FeedbackRetentionMaintenanceResult } from '../maintenance/index.js';

export interface FeedbackRetentionMaintenanceOutput {
  readonly stdout: { write(chunk: string): void };
  readonly stderr: { write(chunk: string): void };
}

function unexpectedFailure(): FeedbackRetentionMaintenanceResult {
  return {
    status: 'error',
    failedPhase: 'runtime',
    error: 'runtime_failed'
  };
}

export function writeFeedbackRetentionMaintenanceResult(
  result: FeedbackRetentionMaintenanceResult,
  output: FeedbackRetentionMaintenanceOutput
): void {
  const serialized = `${JSON.stringify(result)}\n`;
  if (result.status === 'ok') {
    output.stdout.write(serialized);
    return;
  }
  output.stderr.write(serialized);
}

export async function runFeedbackRetentionMaintenanceMain(
  dependencies?: FeedbackRetentionMaintenanceExecutableDependencies,
  output: FeedbackRetentionMaintenanceOutput = {
    stdout: process.stdout,
    stderr: process.stderr
  }
): Promise<number> {
  let result: FeedbackRetentionMaintenanceResult;

  try {
    result = await runFeedbackRetentionMaintenanceExecutable(dependencies);
  } catch (_error) {
    result = unexpectedFailure();
  }

  writeFeedbackRetentionMaintenanceResult(result, output);
  return result.status === 'ok' ? 0 : 1;
}

if (isMainModule(import.meta.url)) {
  void runFeedbackRetentionMaintenanceMain().then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    () => {
      process.stderr.write(
        '{"status":"error","failedPhase":"runtime","error":"runtime_failed"}\n'
      );
      process.exitCode = 1;
    }
  );
}
