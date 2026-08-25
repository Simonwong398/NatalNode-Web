import { isMainModule } from './is-main-module.js';
import { runMigrationExecutable } from './run-migration-executable.js';

if (isMainModule(import.meta.url)) {
  void runMigrationExecutable().catch(() => {
    process.stderr.write('NatalNode database migration failed.\n');
    process.exitCode = 1;
  });
}
