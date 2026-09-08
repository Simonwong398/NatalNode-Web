import { isMainModule } from './is-main-module.js';
import { formatSafeStartupError } from './safe-startup-error.js';
import {
  createServerRuntimePreflight,
  readPreflightProfile
} from '../runtime/runtime-preflight.js';

function runServerPreflight(): void {
  const profile = readPreflightProfile(process.env);
  const report = createServerRuntimePreflight(process.env, profile);

  process.stdout.write(`${JSON.stringify(report)}\n`);

  if (report.readiness.status !== 'READY') {
    process.exitCode = 2;
  }
}

if (isMainModule(import.meta.url)) {
  try {
    runServerPreflight();
  } catch (error) {
    process.stderr.write(
      `NatalNode runtime preflight failed: ${formatSafeStartupError(error)}\n`
    );
    process.exitCode = 1;
  }
}
