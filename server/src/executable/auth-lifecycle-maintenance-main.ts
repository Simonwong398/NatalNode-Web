import { isMainModule } from './is-main-module.js';
import {
  runAuthLifecycleMaintenanceExecutable,
  type AuthLifecycleMaintenanceExecutableDependencies
} from './run-auth-lifecycle-maintenance-executable.js';
import type { AuthLifecycleMaintenanceResult } from '../maintenance/index.js';

export interface AuthLifecycleMaintenanceOutput {
  readonly stdout: { write(chunk: string): void };
  readonly stderr: { write(chunk: string): void };
}

function unexpectedFailure(): AuthLifecycleMaintenanceResult {
  return {
    status: 'error',
    failedPhase: 'runtime',
    error: 'runtime_failed'
  };
}

export function writeAuthLifecycleMaintenanceResult(
  result: AuthLifecycleMaintenanceResult,
  output: AuthLifecycleMaintenanceOutput
): void {
  const serialized = `${JSON.stringify(result)}\n`;

  if (result.status === 'ok') {
    output.stdout.write(serialized);
    return;
  }

  output.stderr.write(serialized);
}

export async function runAuthLifecycleMaintenanceMain(
  dependencies?: AuthLifecycleMaintenanceExecutableDependencies,
  output: AuthLifecycleMaintenanceOutput = {
    stdout: process.stdout,
    stderr: process.stderr
  }
): Promise<number> {
  let result: AuthLifecycleMaintenanceResult;

  try {
    result = await runAuthLifecycleMaintenanceExecutable(dependencies);
  } catch (_error) {
    result = unexpectedFailure();
  }

  writeAuthLifecycleMaintenanceResult(result, output);
  return result.status === 'ok' ? 0 : 1;
}

if (isMainModule(import.meta.url)) {
  void runAuthLifecycleMaintenanceMain().then(
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
