import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';
import { selectP0StagingRateLimitPolicy } from '../dist/app/security/api-rate-limiting.js';
import {
  createDuplicateHarness,
  DUPLICATE_TIMESTAMP,
  request,
  SOURCE_CHART_ID
} from './support/vault-duplicate-harness.mjs';

const PROBLEM_TITLE_BY_STATUS = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};

async function assertProblemResponse(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  const payload = await response.json();
  assert.deepEqual(payload, {
    type: 'about:blank',
    title: PROBLEM_TITLE_BY_STATUS[status],
    status,
    code
  });
  assert.equal('error' in payload, false);
  assert.equal('message' in payload, false);
}

test('duplicate route uses the existing bounded Vault family and write limit', () => {
  const path = `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`;

  assert.equal(classifyApiEndpointFamily(path), 'vault.chart');
  assert.equal(
    selectP0StagingRateLimitPolicy('POST', path).identifier,
    'VAULT_MUTATION'
  );
});

test('authenticated owner duplicates a chart with a new identity and recalculated result', async () => {
  const harness = createDuplicateHarness();
  const sourceSnapshot = structuredClone(harness.sourceChart);

  const response = await request(
    harness.app,
    `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`
  );

  assert.equal(response.status, 201);
  const payload = await response.json();
  const duplicate = payload.chart;

  assert.equal(duplicate.chartId, 'duplicate-1');
  assert.notEqual(duplicate.chartId, SOURCE_CHART_ID);
  assert.equal(duplicate.userId, sourceSnapshot.userId);
  assert.equal(duplicate.displayName, sourceSnapshot.displayName);
  assert.equal(duplicate.category, sourceSnapshot.category);
  assert.deepEqual(duplicate.tags, sourceSnapshot.tags);
  assert.equal(duplicate.favorite, sourceSnapshot.favorite);
  assert.deepEqual(duplicate.normalizedChartRequest, sourceSnapshot.normalizedChartRequest);
  assert.deepEqual(duplicate.canonicalChartResult, harness.calculatedChart);
  assert.notDeepEqual(duplicate.canonicalChartResult, sourceSnapshot.canonicalChartResult);
  assert.equal(duplicate.createdAt, DUPLICATE_TIMESTAMP);
  assert.equal(duplicate.updatedAt, DUPLICATE_TIMESTAMP);
  assert.notEqual(duplicate.createdAt, sourceSnapshot.createdAt);
  assert.deepEqual(harness.charts.get(SOURCE_CHART_ID), sourceSnapshot);
  assert.strictEqual(harness.charts.get(duplicate.chartId), harness.calls.persisted[0]);
  assert.equal(harness.calls.findById, 1);
  assert.equal(harness.calls.engine, 1);
  assert.equal(harness.calls.create, 1);
  assert.equal(harness.notes.filter((note) => note.chartId === duplicate.chartId).length, 0);
  assert.equal(harness.notes.length, 1);

  for (const field of [
    'calculationOutcome',
    'cacheStatus',
    'engineDurationMs',
    'engineResultGeneration',
    'cacheKey'
  ]) {
    assert.equal(Object.hasOwn(payload, field), false, `${field} leaked into the response`);
    assert.equal(Object.hasOwn(duplicate, field), false, `${field} leaked into the chart`);
  }

  assert.equal(harness.records.length, 1);
  const [record] = harness.records;
  assert.equal(record.event, 'api.request.completed');
  assert.equal(record.endpointFamily, 'vault.chart');
  assert.equal(record.status, 201);
  assert.equal(record.cacheStatus, 'miss');
  assert.equal(record.engineResultGeneration, 'mock-v1');
  assert.equal(record.chartResultContractVersion, '1.0.0');
  assert.equal(JSON.stringify(record).includes(SOURCE_CHART_ID), false);
  assert.equal(JSON.stringify(record).includes('owner-1'), false);
});

test('duplicate persists the server calculator outcome instead of the source result', async () => {
  const recalculatedChart = {
    ...createDuplicateHarness().calculatedChart,
    bodies: [
      {
        bodyId: 'SUN',
        longitude: 333,
        sign: 'ARIES',
        house: null,
        retrograde: null
      }
    ]
  };
  const harness = createDuplicateHarness({ calculatedChart: recalculatedChart });

  const response = await request(
    harness.app,
    `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.chart.canonicalChartResult.bodies[0].longitude, 333);
  assert.equal(harness.sourceChart.canonicalChartResult.bodies[0].longitude, 11);
  assert.equal(harness.calls.engine, 1);
});

test('signed-out duplicate requests stop before owner lookup and calculation', async () => {
  const harness = createDuplicateHarness();

  const response = await request(
    harness.app,
    `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`,
    { userId: null }
  );

  await assertProblemResponse(response, 401, 'UNAUTHORIZED');
  assert.equal(harness.calls.findById, 0);
  assert.equal(harness.calls.engine, 0);
  assert.equal(harness.calls.create, 0);
  assert.equal(harness.records.length, 1);
  assert.equal(harness.records[0].endpointFamily, 'vault.chart');
  assert.equal(harness.records[0].problemCode, 'UNAUTHORIZED');
  assert.equal(Object.hasOwn(harness.records[0], 'cacheStatus'), false);
});

test('cross-owner duplicate requests preserve anti-enumeration and do not calculate or persist', async () => {
  const harness = createDuplicateHarness();
  const sourceSnapshot = structuredClone(harness.sourceChart);

  const response = await request(
    harness.app,
    `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`,
    { userId: 'owner-2' }
  );

  await assertProblemResponse(response, 404, 'NOT_FOUND');
  assert.equal(harness.calls.findById, 1);
  assert.equal(harness.calls.engine, 0);
  assert.equal(harness.calls.create, 0);
  assert.deepEqual(harness.charts.get(SOURCE_CHART_ID), sourceSnapshot);
});

test('missing source duplicate requests return the canonical not-found response without calculation', async () => {
  const harness = createDuplicateHarness();

  const response = await request(
    harness.app,
    '/api/vault/charts/missing-chart/duplicate'
  );

  await assertProblemResponse(response, 404, 'NOT_FOUND');
  assert.equal(harness.calls.findById, 1);
  assert.equal(harness.calls.engine, 0);
  assert.equal(harness.calls.create, 0);
  assert.equal(harness.charts.size, 1);
});

test('calculation failure returns sanitized Problem Details and creates no duplicate', async () => {
  const harness = createDuplicateHarness({ engineFailure: true });
  const sourceSnapshot = structuredClone(harness.sourceChart);

  const response = await request(
    harness.app,
    `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`
  );

  await assertProblemResponse(response, 503, 'CALCULATION_UNAVAILABLE');
  assert.equal(harness.calls.engine, 1);
  assert.equal(harness.calls.create, 0);
  assert.equal(harness.charts.size, 1);
  assert.deepEqual(harness.charts.get(SOURCE_CHART_ID), sourceSnapshot);
  assert.equal(
    JSON.stringify(harness.records).includes('private engine failure sentinel'),
    false
  );
});

test('persistence failure returns sanitized server failure and creates no visible duplicate', async () => {
  const harness = createDuplicateHarness({ persistenceFailure: true });
  const sourceSnapshot = structuredClone(harness.sourceChart);

  const response = await request(
    harness.app,
    `/api/vault/charts/${SOURCE_CHART_ID}/duplicate`
  );

  await assertProblemResponse(response, 500, 'INTERNAL_ERROR');
  assert.equal(harness.calls.engine, 1);
  assert.equal(harness.calls.create, 1);
  assert.equal(harness.charts.size, 1);
  assert.deepEqual(harness.charts.get(SOURCE_CHART_ID), sourceSnapshot);
  assert.equal(
    JSON.stringify(harness.records).includes('private persistence failure sentinel'),
    false
  );
});
