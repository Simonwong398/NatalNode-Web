import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { canonicalizeMigrationSql, deriveExecutableMigrationSql } from './migration-sql-normalization.js';
import { PostgresMigrationError } from './postgres-migration-error.js';
import type { PostgresMigration } from './postgres-migration.js';

const MIGRATION_FILENAME_PATTERN = /^([0-9]{4})_[a-z0-9_]+\.sql$/;

interface MigrationFile {
  readonly filename: string;
  readonly version: string;
}

function compareFilenames(left: MigrationFile, right: MigrationFile): number {
  if (left.filename < right.filename) {
    return -1;
  }
  if (left.filename > right.filename) {
    return 1;
  }
  return 0;
}

function discoverMigrationFiles(
  entries: readonly import('node:fs').Dirent[]
): readonly MigrationFile[] {
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const match = MIGRATION_FILENAME_PATTERN.exec(entry.name);
      if (match === null) {
        return undefined;
      }

      return {
        filename: entry.name,
        version: match[1]
      };
    })
    .filter((file): file is MigrationFile => file !== undefined)
    .sort(compareFilenames);

  const filenamesByVersion = new Map<string, string>();
  for (const file of files) {
    const existingFilename = filenamesByVersion.get(file.version);
    if (existingFilename !== undefined) {
      throw new PostgresMigrationError(
        `Duplicate migration version "${file.version}" in "${existingFilename}" and "${file.filename}".`
      );
    }
    filenamesByVersion.set(file.version, file.filename);
  }

  return files;
}

function checksumSha256(canonicalArtifactSql: string): string {
  return createHash('sha256').update(canonicalArtifactSql, 'utf8').digest('hex');
}

export async function loadPostgresMigrations(
  migrationsDirectory: string
): Promise<readonly PostgresMigration[]> {
  if (typeof migrationsDirectory !== 'string' || migrationsDirectory.trim().length === 0) {
    throw new PostgresMigrationError('migrationsDirectory must be a non-empty string.');
  }

  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const migrationFiles = discoverMigrationFiles(entries);
  const migrations: PostgresMigration[] = [];

  for (const migrationFile of migrationFiles) {
    const artifactSql = await readFile(
      join(migrationsDirectory, migrationFile.filename),
      'utf8'
    );
    const canonicalArtifactSql = canonicalizeMigrationSql(artifactSql);
    const executableSql = deriveExecutableMigrationSql(canonicalArtifactSql);

    migrations.push({
      version: migrationFile.version,
      filename: migrationFile.filename,
      checksumSha256: checksumSha256(canonicalArtifactSql),
      executableSql
    });
  }

  return migrations;
}
