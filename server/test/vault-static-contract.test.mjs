import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);

test('Vault management frontend reuses existing endpoints and keeps deferred features absent', async () => {
  const management = (
    await Promise.all(
      [
        'VaultChartManagement.tsx',
        'VaultChartMetadataForm.tsx',
        'VaultChartNotesManager.tsx',
        'VaultChartNoteEditor.tsx',
        'VaultChartDeletionPanel.tsx'
      ].map((fileName) =>
        readFile(
          new URL(`apps/web/src/features/vault/${fileName}`, REPOSITORY_ROOT),
          'utf8'
        )
      )
    )
  ).join('\n');
  const api = await readFile(
    new URL(
      'apps/web/src/features/vault/vault-management-client.ts',
      REPOSITORY_ROOT
    ),
    'utf8'
  );
  const savedExperience = await readFile(
    new URL('apps/web/src/features/vault/SavedVaultChartExperience.tsx', REPOSITORY_ROOT),
    'utf8'
  );
  const migration = await readFile(
    new URL('server/db/migrations/0001_auth_vault_baseline.sql', REPOSITORY_ROOT),
    'utf8'
  );

  assert.match(management, /Save changes/u);
  assert.match(management, /<label[\s\S]*Chart name/u);
  assert.match(management, /<select[\s\S]*Category/u);
  assert.match(management, /Add note/u);
  assert.match(management, /Save note/u);
  assert.match(management, /Delete chart/u);
  assert.match(management, /window\.confirm/u);
  assert.match(api, /jsonRequest\('PATCH'/u);
  assert.match(api, /jsonRequest\('POST'/u);
  assert.match(api, /method: 'DELETE'/u);
  assert.match(api, /\/notes/u);
  assert.doesNotMatch(management, /\b(?:tags|favorite|duplicate)\b/iu);
  assert.match(savedExperience, /VaultChartManagement/u);
  assert.match(migration, /CONSTRAINT chart_notes_chart_fk[\s\S]*ON DELETE CASCADE/u);
});
