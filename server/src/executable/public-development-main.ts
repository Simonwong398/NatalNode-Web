import { isMainModule } from './is-main-module.js';
import { runPublicDevelopmentComposition } from './run-public-development-composition.js';

if (isMainModule(import.meta.url)) {
  void runPublicDevelopmentComposition().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown startup error.';
    process.stderr.write(
      `NatalNode public-development startup failed: ${message}\n`
    );
    process.exitCode = 1;
  });
}
