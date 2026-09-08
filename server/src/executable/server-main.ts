import { isMainModule } from './is-main-module.js';
import { runServerExecutable } from './run-server-executable.js';
import { formatSafeStartupError } from './safe-startup-error.js';

if (isMainModule(import.meta.url)) {
  void runServerExecutable().catch((error: unknown) => {
    process.stderr.write(
      `NatalNode API startup failed: ${formatSafeStartupError(error)}\n`
    );
    process.exitCode = 1;
  });
}
