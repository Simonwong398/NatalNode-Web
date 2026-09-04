import { isMainModule } from './is-main-module.js';
import { runLocalDevelopmentComposition } from './run-local-development-composition.js';
import { formatSafeStartupError } from './safe-startup-error.js';

if (isMainModule(import.meta.url)) {
  void runLocalDevelopmentComposition().catch((error: unknown) => {
    process.stderr.write(
      `NatalNode local deployment startup failed: ${formatSafeStartupError(error)}\n`
    );
    process.exitCode = 1;
  });
}
