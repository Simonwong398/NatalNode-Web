import assert from 'node:assert/strict';
import test from 'node:test';

import { CHART_NOTE_MAXIMUM_CHARACTERS } from '../dist/app/validation/index.js';
import { createHarness, request } from './support/vault-harness.mjs';

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
