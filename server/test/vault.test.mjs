import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import {
  CHART_NOTE_MAXIMUM_CHARACTERS,
  isChartNoteContentRequest,
  isMetadataUpdate,
  isValidVaultChartDisplayName,
  normalizeChartNoteContent,
  normalizeVaultChartDisplayName,
  VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS
} from '../dist/app/validation/index.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const INITIAL_TIMESTAMP = '2026-08-26T12:00:00.000Z';

function createInitialChart() {
  return {
    chartId: 'chart-1',
    userId: 'owner-1',
    displayName: 'Original chart',
    category: 'SELF',
    tags: [],
    favorite: false,
    normalizedChartRequest: {
      birth: {
        localDate: '1990-01-01',
        localTime: null,
        locationLabel: 'Unknown',
        latitude: 0,
        longitude: 0,
        ianaTimeZone: 'UTC',
        resolvedUtcInstant: null,
        utcOffsetSeconds: null,
        timezoneDatabaseVersion: 'research',
        timezoneResolutionMethod: 'research',
        ambiguityStatus: 'UNKNOWN_TIME'
      },
      houseSystem: 'PLACIDUS'
    },
    canonicalChartResult: {
      schemaVersion: 'fixture-v1',
      engineVersion: 'mock-v1',
      bodies: [{ bodyId: 'SUN', longitude: 1, sign: 'ARIES', house: null, retrograde: null }],
      angles: [],
      houses: null,
      aspects: [],
      warnings: [],
      calculationStatus: 'INCOMPLETE_RESEARCH',
      metadata: {
        configurationStatus: 'INCOMPLETE_RESEARCH',
        astronomyConfigurationId: null,
        provenanceEnvelopeId: null,
        reason: 'INCOMPLETE_RESEARCH'
      }
    },
    engineVersion: 'mock-v1',
    chartSchemaVersion: 'fixture-v1',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP
  };
}

function createHarness() {
  let chart = createInitialChart();
  const notes = [];
  const calls = { engine: 0 };
  let nextNoteId = 0;

  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null ? null : { userId };
      }
    },
    idGenerator: {
      generate() {
        nextNoteId += 1;
        return `note-${nextNoteId}`;
      }
    },
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts: {
        async create(nextChart) {
          chart = nextChart;
        },
        async findById(userId, chartId) {
          return chart !== null && chart.userId === userId && chart.chartId === chartId
            ? chart
            : null;
        },
        async listForUser(userId) {
          return chart !== null && chart.userId === userId ? [chart] : [];
        },
        async updateMetadata(userId, chartId, update) {
          if (
            chart === null ||
            chart.userId !== userId ||
            chart.chartId !== chartId
          ) {
            return null;
          }

          chart = {
            ...chart,
            ...(update.displayName === undefined
              ? {}
              : { displayName: update.displayName }),
            ...(update.category === undefined ? {} : { category: update.category }),
            ...(update.tags === undefined ? {} : { tags: [...update.tags] }),
            ...(update.favorite === undefined ? {} : { favorite: update.favorite }),
            updatedAt: '2026-08-26T12:01:00.000Z'
          };

          return chart;
        },
        async deleteById(userId, chartId) {
          if (
            chart === null ||
            chart.userId !== userId ||
            chart.chartId !== chartId
          ) {
            return false;
          }

          chart = null;
          notes.length = 0;
          return true;
        }
      },
      chartNotes: {
        async create(note) {
          notes.push(note);
        },
        async listForChart(userId, chartId) {
          return notes.filter((note) => note.userId === userId && note.chartId === chartId);
        },
        async updateContent(userId, chartId, noteId, update) {
          const note = notes.find(
            (candidate) =>
              candidate.userId === userId &&
              candidate.chartId === chartId &&
              candidate.noteId === noteId
          );

          if (note === undefined) {
            return null;
          }

          Object.assign(note, {
            content: update.content,
            updatedAt: '2026-08-26T12:02:00.000Z'
          });
          return note;
        },
        async deleteById(userId, chartId, noteId) {
          const noteIndex = notes.findIndex(
            (candidate) =>
              candidate.userId === userId &&
              candidate.chartId === chartId &&
              candidate.noteId === noteId
          );

          if (noteIndex < 0) {
            return false;
          }

          notes.splice(noteIndex, 1);
          return true;
        }
      }
    },
    engineClient: {
      async calculateChart() {
        calls.engine += 1;
        throw new Error('Vault management must not call EngineClient.');
      }
    },
    clock: {
      now() {
        return INITIAL_TIMESTAMP;
      }
    },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies),
    calls,
    getChart: () => chart,
    notes
  };
}

function request(
  app,
  path,
  {
    method = 'GET',
    userId = 'owner-1',
    body,
    origin = PUBLIC_WEB_ORIGIN
  } = {}
) {
  const headers = { Origin: origin };

  if (userId !== null) {
    headers['X-Test-User'] = userId;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

test('Vault validation normalizes and bounds chart names and note content', () => {
  assert.equal(VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS, 120);
  assert.equal(CHART_NOTE_MAXIMUM_CHARACTERS, 5_000);
  assert.equal(normalizeVaultChartDisplayName('  My chart  '), 'My chart');
  assert.equal(isValidVaultChartDisplayName('  My chart  '), true);
  assert.equal(isValidVaultChartDisplayName('   '), false);
  assert.equal(
    isValidVaultChartDisplayName('🙂'.repeat(VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS)),
    true
  );
  assert.equal(
    isValidVaultChartDisplayName('🙂'.repeat(VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS + 1)),
    false
  );
  assert.equal(isMetadataUpdate({ displayName: '  Renamed  ' }), true);
  assert.equal(isMetadataUpdate({ displayName: ' ' }), false);
  assert.equal(isMetadataUpdate({ displayName: 'x'.repeat(121) }), false);
  assert.equal(isMetadataUpdate({ category: 'CLIENT' }), true);
  assert.equal(isMetadataUpdate({ category: 'UNKNOWN' }), false);

  assert.equal(
    normalizeChartNoteContent('  first\r\nsecond\rthird  '),
    'first\nsecond\nthird'
  );
  assert.equal(isChartNoteContentRequest({ content: '  first\r\nsecond  ' }), true);
  assert.equal(isChartNoteContentRequest({ content: '   ' }), false);
  assert.equal(
    isChartNoteContentRequest({ content: 'x'.repeat(CHART_NOTE_MAXIMUM_CHARACTERS + 1) }),
    false
  );
  assert.equal(isChartNoteContentRequest({ content: 'valid\u0000note' }), false);
  assert.equal(isChartNoteContentRequest({ content: 'valid\tnote' }), false);
  assert.equal(isChartNoteContentRequest({ content: `valid${'\uD800'}note` }), false);
});

test('metadata PATCH is owner-scoped, confirmed, normalized, and Engine-free', async () => {
  const harness = createHarness();
  const scientificSnapshot = structuredClone(harness.getChart());

  const unauthenticatedResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    userId: null,
    body: { displayName: 'Unauthenticated' }
  });
  assert.equal(unauthenticatedResponse.status, 401);

  const response = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    body: { displayName: '  Renamed chart  ', category: 'FAMILY' }
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.chart.displayName, 'Renamed chart');
  assert.equal(payload.chart.category, 'FAMILY');
  assert.deepEqual(payload.chart.normalizedChartRequest, scientificSnapshot.normalizedChartRequest);
  assert.deepEqual(payload.chart.canonicalChartResult, scientificSnapshot.canonicalChartResult);
  assert.equal(payload.chart.engineVersion, scientificSnapshot.engineVersion);
  assert.equal(payload.chart.chartSchemaVersion, scientificSnapshot.chartSchemaVersion);
  assert.equal(payload.chart.astronomyConfigurationId, scientificSnapshot.astronomyConfigurationId);
  assert.equal(payload.chart.provenanceEnvelopeId, scientificSnapshot.provenanceEnvelopeId);
  assert.equal(harness.calls.engine, 0);

  const callerOwnedFieldResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    body: { displayName: 'Another name', userId: 'attacker-selected-owner' }
  });
  assert.equal(callerOwnedFieldResponse.status, 400);

  const blankResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    body: { displayName: '  ' }
  });
  assert.equal(blankResponse.status, 400);

  const longResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    body: { displayName: 'x'.repeat(121) }
  });
  assert.equal(longResponse.status, 400);

  const invalidCategoryResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    body: { category: 'UNKNOWN' }
  });
  assert.equal(invalidCategoryResponse.status, 400);

  const nonOwnerResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'PATCH',
    userId: 'other-user',
    body: { displayName: 'Not yours' }
  });
  assert.equal(nonOwnerResponse.status, 404);
  assert.equal(harness.getChart().displayName, 'Renamed chart');
  assert.equal(harness.calls.engine, 0);
});

test('notes support owner CRUD, normalization, bounded errors, and no Engine calls', async () => {
  const harness = createHarness();

  const initialResponse = await request(harness.app, '/api/vault/charts/chart-1/notes');
  assert.equal(initialResponse.status, 200);
  assert.deepEqual(await initialResponse.json(), { notes: [] });

  const createResponse = await request(harness.app, '/api/vault/charts/chart-1/notes', {
    method: 'POST',
    body: { content: '  first\r\nsecond  ' }
  });
  assert.equal(createResponse.status, 201);
  const createdPayload = await createResponse.json();
  assert.equal(createdPayload.note.content, 'first\nsecond');
  const noteId = createdPayload.note.noteId;

  const blankResponse = await request(harness.app, '/api/vault/charts/chart-1/notes', {
    method: 'POST',
    body: { content: '  ' }
  });
  assert.equal(blankResponse.status, 400);

  const longResponse = await request(harness.app, '/api/vault/charts/chart-1/notes', {
    method: 'POST',
    body: { content: 'x'.repeat(CHART_NOTE_MAXIMUM_CHARACTERS + 1) }
  });
  assert.equal(longResponse.status, 400);

  const invalidControlResponse = await request(harness.app, '/api/vault/charts/chart-1/notes', {
    method: 'POST',
    body: { content: 'bad\tnote' }
  });
  assert.equal(invalidControlResponse.status, 400);

  const editResponse = await request(
    harness.app,
    `/api/vault/charts/chart-1/notes/${noteId}`,
    {
      method: 'PATCH',
      body: { content: '  edited\rcontent  ' }
    }
  );
  assert.equal(editResponse.status, 200);
  assert.equal((await editResponse.json()).note.content, 'edited\ncontent');

  const crossOwnerReadResponse = await request(harness.app, '/api/vault/charts/chart-1/notes', {
    userId: 'other-user'
  });
  assert.equal(crossOwnerReadResponse.status, 404);

  const crossOwnerDeleteResponse = await request(
    harness.app,
    `/api/vault/charts/chart-1/notes/${noteId}`,
    { method: 'DELETE', userId: 'other-user' }
  );
  assert.equal(crossOwnerDeleteResponse.status, 404);

  const deleteResponse = await request(
    harness.app,
    `/api/vault/charts/chart-1/notes/${noteId}`,
    { method: 'DELETE' }
  );
  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), { deleted: true });
  assert.equal(harness.notes.length, 0);
  assert.equal(harness.calls.engine, 0);
});

test('chart delete is owner-scoped, confirms the API result, and removes notes by cascade relationship', async () => {
  const harness = createHarness();

  const noteResponse = await request(harness.app, '/api/vault/charts/chart-1/notes', {
    method: 'POST',
    body: { content: 'A note to cascade.' }
  });
  assert.equal(noteResponse.status, 201);
  assert.equal(harness.notes.length, 1);

  const nonOwnerResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'DELETE',
    userId: 'other-user'
  });
  assert.equal(nonOwnerResponse.status, 404);
  assert.notEqual(harness.getChart(), null);

  const deleteResponse = await request(harness.app, '/api/vault/charts/chart-1', {
    method: 'DELETE'
  });
  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), { deleted: true });
  assert.equal(harness.getChart(), null);
  assert.equal(harness.notes.length, 0);
  assert.equal(harness.calls.engine, 0);
});

test('Vault management frontend reuses existing endpoints and keeps deferred features absent', async () => {
  const management = await readFile(
    new URL('apps/web/src/features/vault/VaultChartManagement.tsx', REPOSITORY_ROOT),
    'utf8'
  );
  const api = await readFile(
    new URL('apps/web/src/features/vault/vault-management.ts', REPOSITORY_ROOT),
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
