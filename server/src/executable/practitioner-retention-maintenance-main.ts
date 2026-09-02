import { isMainModule } from './is-main-module.js';
import {
  runPractitionerRetentionMaintenanceExecutable,
  type PractitionerRetentionMaintenanceExecutableDependencies
} from './run-practitioner-retention-maintenance-executable.js';
import type { PractitionerRetentionMaintenanceResult } from '../maintenance/index.js';

export interface PractitionerRetentionMaintenanceOutput {
  readonly stdout: { write(chunk: string): void };
  readonly stderr: { write(chunk: string): void };
}

function unexpectedFailure(): PractitionerRetentionMaintenanceResult {
  return {
    status: 'error',
    failedPhase: 'runtime',
    error: 'runtime_failed'
  };
}

export function writePractitionerRetentionMaintenanceResult(
  result: PractitionerRetentionMaintenanceResult,
  output: PractitionerRetentionMaintenanceOutput
): void {
  const serialized = `${JSON.stringify(result)}\n`;
  if (result.status === 'ok') {
    output.stdout.write(serialized);
    return;
  }
  output.stderr.write(serialized);
}

export async function runPractitionerRetentionMaintenanceMain(
  dependencies?: PractitionerRetentionMaintenanceExecutableDependencies,
  output: PractitionerRetentionMaintenanceOutput = {
    stdout: process.stdout,
    stderr: process.stderr
  }
): Promise<number> {
  let result: PractitionerRetentionMaintenanceResult;
  try {
    result = await runPractitionerRetentionMaintenanceExecutable(dependencies);
  } catch (_error) {
    result = unexpectedFailure();
  }
  writePractitionerRetentionMaintenanceResult(result, output);
  return result.status === 'ok' ? 0 : 1;
}

if (isMainModule(import.meta.url)) {
  void runPractitionerRetentionMaintenanceMain().then(
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
