import { isMainModule } from './is-main-module.js';
import { runNotificationWorkerExecutable } from './run-notification-worker-executable.js';

if (isMainModule(import.meta.url)) {
  void runNotificationWorkerExecutable().catch(() => {
    process.stderr.write('NatalNode notification worker failed.\n');
    process.exitCode = 1;
  });
}
