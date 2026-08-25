import { fileURLToPath } from 'node:url';
import {
  loadServerEnvironment,
  runPostgresMigrations
} from '../runtime/index.js';

const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../../db/migrations/', import.meta.url)
);

export async function runMigrationExecutable(): Promise<void> {
  const environmentConfig = loadServerEnvironment();

  await runPostgresMigrations(
    environmentConfig.postgresPoolRuntimeConfig,
    MIGRATIONS_DIRECTORY
  );
}
