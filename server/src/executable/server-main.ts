import { isMainModule } from './is-main-module.js';
import { runServerExecutable } from './run-server-executable.js';

if (isMainModule(import.meta.url)) {
  void runServerExecutable().catch(() => {
    process.stderr.write('NatalNode API startup failed.\n');
    process.exitCode = 1;
  });
}
