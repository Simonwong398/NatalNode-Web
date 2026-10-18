import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { serializeEngineUtcInstant } from '../dist/development/engine-utc-wire.js';
import {
  RealEnginePrivateServiceClient,
  RealEnginePrivateServiceError
} from '../dist/development/real-engine-private-service-client.js';

const checkout = process.env.NATALNODE_ENGINE_CHECKOUT;
assert.ok(checkout, 'Set NATALNODE_ENGINE_CHECKOUT to the verified Engine checkout.');
// Import only the existing request validator and pure time authority; no Provider or listener is constructed.
const { validateRequest } = await import(pathToFileURL(join(checkout,
  'packages/engine/research/nn-engine-private-service-runtime-unblock-001/src/service.mjs')).href);
const { createTimeContext } = await import(pathToFileURL(join(checkout,
  'packages/engine/dist/src/time/authority.js')).href);
const CHART = JSON.parse(readFileSync(new URL('./fixtures/r5-canonical-chart-result.json', import.meta.url), 'utf8'));
const RUNTIME = 'a'.repeat(64);
const EXECUTION = {
  serviceInstanceId: 'service-550e8400-e29b-41d4-a716-446655440000',
  requestExecutionId: 'request-550e8400-e29b-41d4-a716-446655440001',
  runtimeIdentity: RUNTIME,
  status: 'RESEARCH_ONLY',
  provenance: 'INCOMPLETE_RESEARCH'
};
const request = instant => ({
  input: { instant, latitude: 51.4779, longitude: -0.0015 },
  options: { houseSystem: 'placidus' }
});
const client = fetchImplementation => new RealEnginePrivateServiceClient({
  baseUrl: 'http://127.0.0.1:1',
  bearerToken: 'explicit-utc-wire-contract-test-token-1234',
  expectedRuntimeIdentity: RUNTIME,
  fetchImplementation
});

test('UTC wire serialization matches the actual Engine validator without changing the instant', async context => {
  for (const [input, expected] of [
    ['2000-01-01T12:00:00.000Z', '2000-01-01T12:00:00Z'],
    ['2000-01-01T12:00:00Z', '2000-01-01T12:00:00Z'],
    ['1999-12-31T23:59:59.999Z', '1999-12-31T23:59:59.999Z'],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T00:00:00Z'],
    ['2000-02-29T23:59:59.001Z', '2000-02-29T23:59:59.001Z'],
    ['2000-01-01T12:00:00.1Z', '2000-01-01T12:00:00.100Z'],
    ['2000-01-01T12:00:00.12Z', '2000-01-01T12:00:00.120Z'],
    ['2000-01-01T12:00:00.123Z', '2000-01-01T12:00:00.123Z']
  ]) {
    await context.test(input, () => {
      const instant = serializeEngineUtcInstant(input);
      assert.equal(instant, expected);
      assert.equal(Date.parse(instant), Date.parse(input));
      assert.equal(createTimeContext(input).canonicalInput.instant, instant);
      const wire = { ...request(instant), options: { houseSystem: 'placidus', zodiac: 'tropical' } };
      assert.deepEqual(validateRequest(wire, createTimeContext), wire);
    });
  }
});

test('actual client serializes J2000 before validation and retains the complete canonical response', async () => {
  const input = request('2000-01-01T12:00:00.000Z');
  const before = structuredClone(input);
  let calls = 0;
  const transport = client(async (_url, init) => {
    calls += 1;
    const wire = JSON.parse(init.body);
    assert.deepEqual(wire, {
      input: CHART.input,
      options: { houseSystem: 'placidus', zodiac: 'tropical' }
    });
    assert.deepEqual(validateRequest(wire, createTimeContext), wire);
    return new Response(JSON.stringify({ chart: CHART, execution: EXECUTION }), {
      headers: { 'Content-Type': 'application/json' }
    });
  });
  const reply = await transport.calculateChart(input);
  assert.equal(calls, 1);
  assert.deepEqual(input, before);
  assert.deepEqual(reply.chart, CHART);
  assert.deepEqual(reply.execution, EXECUTION);
});

test('invalid UTC or unsupported precision fails before any transport call without loss', async () => {
  let calls = 0;
  const transport = client(async () => { calls += 1; throw new Error('Transport must not run.'); });
  for (const instant of [
    '2000-01-01T12:00:00.1234Z', '2000-01-01T12:00:00.0000Z',
    '2000-01-01T12:00:00+00:00', '2000-02-30T12:00:00Z',
    '2000-01-01T24:00:00Z', '2000-01-01T12:00:60Z', 'invalid'
  ]) {
    assert.throws(() => serializeEngineUtcInstant(instant), TypeError);
    await assert.rejects(transport.calculateChart(request(instant)), error =>
      error instanceof RealEnginePrivateServiceError && error.code === 'REQUEST_SCHEMA_INVALID');
  }
  assert.equal(calls, 0);
});

test('UTC serialization does not relax exact response identity checks', async () => {
  const changedChart = structuredClone(CHART);
  changedChart.input.instant = '2000-01-01T12:00:01Z';
  const transport = client(async () => new Response(JSON.stringify({ chart: changedChart, execution: EXECUTION }), {
    headers: { 'Content-Type': 'application/json' }
  }));
  await assert.rejects(transport.calculateChart(request('2000-01-01T12:00:00.000Z')), error =>
    error instanceof RealEnginePrivateServiceError && error.code === 'SERVICE_RESPONSE_INVALID');
});
