import { isMainModule } from './is-main-module.js';
import { runLocalDevelopmentComposition } from './run-local-development-composition.js';

if (isMainModule(import.meta.url)) {
  void runLocalDevelopmentComposition().catch(() => {
    process.stderr.write('NatalNode local deployment startup failed.\n');
    process.exitCode = 1;
  });
}
