import assert from 'node:assert/strict';

export function makeVaultChart(overrides = {}) {
  return {
    chartId: 'chart-fixture',
    userId: 'user-fixture',
    displayName: 'Fixture chart',
    category: 'SELF',
    tags: ['fixture'],
    favorite: false,
    normalizedChartRequest: {},
    canonicalChartResult: {},
    engineVersion: 'fixture-engine',
    chartSchemaVersion: 'fixture-schema',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    recordVersion: 1,
    scientificStatus: 'INPUT_ONLY',
    calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
    recordOrigin: 'DEVELOPMENT_FIXTURE',
    sourceContext: 'chart-workspace.development-fixture',
    timeAuthorityState: 'UNKNOWN_BIRTH_TIME',
    chartResultContractVersion: 'fixture-schema',
    scientificConfigurationIdentity: null,
    scientificProvenance: {
      schemaVersion: '1',
      recordOrigin: 'DEVELOPMENT_FIXTURE',
      sourceContext: 'chart-workspace.development-fixture',
      savedAt: '2026-08-25T00:00:00.000Z',
      timeAuthorityState: 'UNKNOWN_BIRTH_TIME',
      calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
      chartResultContractVersion: 'fixture-schema',
      scientificConfigurationIdentity: null,
      provenanceEnvelopeId: null
    },
    savedAt: '2026-08-25T00:00:00.000Z',
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
    ...overrides
  };
}

export function makeChartNote(overrides = {}) {
  return {
    noteId: 'note-fixture',
    chartId: 'chart-fixture',
    userId: 'user-fixture',
    content: 'Fixture note',
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
    ...overrides
  };
}

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function invalidJsonResponse(status) {
  return new Response('{not valid JSON', {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function withCapturedFetch(responder, exercise) {
  const priorFetch = globalThis.fetch;
  const calls = [];
  const fetchStub = async (input, init) => {
    calls.push({ input, init });
    return responder(input, init, calls.length - 1);
  };

  globalThis.fetch = fetchStub;

  try {
    return await exercise(calls, fetchStub);
  } finally {
    globalThis.fetch = priorFetch;
  }
}

export function assertJsonRequest(call, expected) {
  assert.equal(call.input, expected.url);
  assert.deepEqual(call.init, {
    method: expected.method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(expected.body),
    signal: expected.signal
  });
}

export function assertBodylessRequest(call, expected) {
  assert.equal(call.input, expected.url);
  assert.deepEqual(call.init, {
    method: expected.method,
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    signal: expected.signal
  });
  assert.equal(Object.hasOwn(call.init, 'body'), false);
}
