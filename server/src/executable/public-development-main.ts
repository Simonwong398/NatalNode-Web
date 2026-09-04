import { isMainModule } from './is-main-module.js';
import { runPublicDevelopmentComposition } from './run-public-development-composition.js';
import { formatSafeStartupError } from './safe-startup-error.js';

if (isMainModule(import.meta.url)) {
  void runPublicDevelopmentComposition().catch((error: unknown) => {
    process.stderr.write(
      `NatalNode public-development startup failed: ${formatSafeStartupError(error)}\n`
    );
    process.exitCode = 1;
  });
}
