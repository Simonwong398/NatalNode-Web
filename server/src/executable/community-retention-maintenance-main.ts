import { isMainModule } from './is-main-module.js';
import {
  runCommunityRetentionMaintenanceExecutable,
  type CommunityRetentionMaintenanceExecutableDependencies
} from './run-community-retention-maintenance-executable.js';
import type { CommunityRetentionMaintenanceResult } from '../maintenance/index.js';

export interface CommunityRetentionMaintenanceOutput {
  readonly stdout: { write(chunk: string): void };
  readonly stderr: { write(chunk: string): void };
}

function unexpectedFailure(): CommunityRetentionMaintenanceResult {
  return {
    status: 'error',
    failedPhase: 'runtime',
    error: 'runtime_failed'
  };
}

export function writeCommunityRetentionMaintenanceResult(
  result: CommunityRetentionMaintenanceResult,
  output: CommunityRetentionMaintenanceOutput
): void {
  const serialized = `${JSON.stringify(result)}\n`;
  if (result.status === 'ok') {
    output.stdout.write(serialized);
    return;
  }
  output.stderr.write(serialized);
}

export async function runCommunityRetentionMaintenanceMain(
  dependencies?: CommunityRetentionMaintenanceExecutableDependencies,
  output: CommunityRetentionMaintenanceOutput = {
    stdout: process.stdout,
    stderr: process.stderr
  }
): Promise<number> {
  let result: CommunityRetentionMaintenanceResult;
  try {
    result = await runCommunityRetentionMaintenanceExecutable(dependencies);
  } catch (_error) {
    result = unexpectedFailure();
  }
  writeCommunityRetentionMaintenanceResult(result, output);
  return result.status === 'ok' ? 0 : 1;
}

if (isMainModule(import.meta.url)) {
  void runCommunityRetentionMaintenanceMain().then(
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
