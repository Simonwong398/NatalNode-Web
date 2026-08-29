import { fileURLToPath } from 'node:url';
import {
  loadPostgresPoolRuntimeEnvironment,
  runPostgresMigrations
} from '../runtime/index.js';

const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../../db/migrations/', import.meta.url)
);

export async function runMigrationExecutable(): Promise<void> {
  const postgresPoolRuntimeConfig = loadPostgresPoolRuntimeEnvironment();

  await runPostgresMigrations(
    postgresPoolRuntimeConfig,
    MIGRATIONS_DIRECTORY
  );
}
