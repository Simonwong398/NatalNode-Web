import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  RealEnginePrivateServiceClient,
  RealEnginePrivateServiceError
} from '../dist/development/real-engine-private-service-client.js';

const CHART = JSON.parse(readFileSync(new URL('./fixtures/r5-canonical-chart-result.json', import.meta.url), 'utf8'));
const TOKEN = 'r5-private-service-test-token-1234567890';
const RUNTIME_IDENTITY = 'a'.repeat(64);
const EXECUTION = Object.freeze({
  serviceInstanceId: 'service-550e8400-e29b-41d4-a716-446655440000',
  requestExecutionId: 'request-550e8400-e29b-41d4-a716-446655440001',
  runtimeIdentity: RUNTIME_IDENTITY,
  status: 'RESEARCH_ONLY',
  provenance: 'INCOMPLETE_RESEARCH'
});
const REQUEST = Object.freeze({
  input: Object.freeze({ ...CHART.input }),
  options: Object.freeze({ houseSystem: CHART.metadata.houseSystem })
});

function response(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

function createClient(fetchImplementation, overrides = {}) {
  return new RealEnginePrivateServiceClient({
    baseUrl: 'http://127.0.0.1:45873',
    bearerToken: TOKEN,
    expectedRuntimeIdentity: RUNTIME_IDENTITY,
    timeoutMs: 2_000,
    fetchImplementation,
    ...overrides
  });
}

function envelope({ chart = CHART, execution = EXECUTION } = {}) {
  return { chart, execution };
}

async function assertClientError(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof RealEnginePrivateServiceError);
    assert.equal(error.code, code);
    assert.equal(error.message.includes(TOKEN), false);
    return true;
  });
}

test('real research client sends the exact authenticated R5 service request and validates its response', async () => {
  let captured;
  const client = createClient(async (url, init) => {
    captured = { url, init, headers: new Headers(init.headers) };
    return response(envelope());
  });

  const reply = await client.calculateChart(REQUEST);
  assert.equal(captured.url, 'http://127.0.0.1:45873/v1/chart/calculate');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.headers.get('authorization'), `Bearer ${TOKEN}`);
  assert.equal(captured.headers.get('content-type'), 'application/json');
  assert.equal(captured.init.cache, 'no-store');
  assert.equal(captured.init.redirect, 'error');
  assert.deepEqual(JSON.parse(captured.init.body), {
    input: REQUEST.input,
    options: { houseSystem: REQUEST.options.houseSystem, zodiac: 'tropical' }
  });
  assert.ok(Buffer.byteLength(captured.init.body, 'utf8') <= 4 * 1024);
  assert.equal(captured.init.signal instanceof AbortSignal, true);
  assert.deepEqual(reply.chart, CHART);
  assert.deepEqual(reply.execution, EXECUTION);
  assert.equal(JSON.stringify(reply).includes(TOKEN), false);
});

test('real research client rejects runtime identity mismatch and malformed ChartResult', async () => {
  const mismatch = createClient(async () => response(envelope({
    execution: { ...EXECUTION, runtimeIdentity: 'b'.repeat(64) }
  })));
  await assertClientError(mismatch.calculateChart(REQUEST), 'SERVICE_RESPONSE_INVALID');

  const malformedChart = structuredClone(CHART);
  malformedChart.bodies.pop();
  const malformed = createClient(async () => response(envelope({ chart: malformedChart })));
  await assertClientError(malformed.calculateChart(REQUEST), 'SERVICE_RESPONSE_INVALID');
});

test('real research client maps exact Engine error statuses and sanitizes non-contract 403 responses', async (context) => {
  const cases = [
    { status: 401, payload: { error: 'UNAUTHORIZED' }, code: 'UNAUTHORIZED' },
    { status: 403, payload: { error: 'FORBIDDEN' }, code: 'SERVICE_UNAVAILABLE' },
    { status: 429, payload: { error: 'CALCULATION_BUSY' }, code: 'CALCULATION_BUSY' },
    { status: 503, payload: { error: 'SERVICE_SHUTTING_DOWN' }, code: 'SERVICE_SHUTTING_DOWN' }
  ];

  for (const item of cases) {
    await context.test(`${item.status} ${item.code}`, async () => {
      const client = createClient(async () => response(item.payload, item.status));
      await assertClientError(client.calculateChart(REQUEST), item.code);
    });
  }
});

test('real research client bounds response bytes and converts timeout/caller abort safely', async () => {
  const oversized = createClient(async () => response(
    { error: 'UNAUTHORIZED' }, 401, { 'Content-Length': String(1024 * 1024 + 1) }
  ));
  await assertClientError(oversized.calculateChart(REQUEST), 'SERVICE_RESPONSE_INVALID');

  const timedOut = createClient((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('local transport detail')), { once: true });
  }), { timeoutMs: 10 });
  await assertClientError(timedOut.calculateChart(REQUEST), 'CALCULATION_TIMEOUT');

  const controller = new AbortController();
  let outboundSignal;
  const callerCancelled = createClient((_url, init) => new Promise((_resolve, reject) => {
    outboundSignal = init.signal;
    init.signal.addEventListener('abort', () => reject(new Error('local transport detail')), { once: true });
  }));
  const pending = callerCancelled.calculateChart(REQUEST, controller.signal);
  await Promise.resolve();
  controller.abort();
  await assertClientError(pending, 'CALCULATION_CANCELLED');
  assert.equal(outboundSignal.aborted, true);
});

test('real research client fails closed on non-loopback endpoints and invalid request shapes', async () => {
  assert.throws(() => new RealEnginePrivateServiceClient({
    baseUrl: 'http://192.0.2.10:45873',
    bearerToken: TOKEN,
    expectedRuntimeIdentity: RUNTIME_IDENTITY
  }), /IPv4 loopback/u);

  const client = createClient(async () => response(envelope()));
  await assertClientError(client.calculateChart({
    ...REQUEST,
    options: { ...REQUEST.options, zodiac: 'sidereal' }
  }), 'REQUEST_SCHEMA_INVALID');
});
