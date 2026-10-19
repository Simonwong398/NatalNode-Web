import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createSingleUseJ2000Evidence,
  J2000_ENGINE_REQUEST,
  J2000_WIRE,
  parseSingleUseJ2000TaskId,
  selectSingleUseJ2000EvidenceBinding
} from './single-use-j2000-evidence.mjs';

const TASK_ID = 'NN-ENGINE-WEB-CORRECTED-J2000-E2E-001';
const HTTP_TASK_ID = 'NN-ENGINE-WEB-CORRECTED-HTTP-E2E-001';
const ENGINE_HEAD = '9cde9285d5ed74a1837d8be0dd5c807ca0134bc3';
const RUNTIME_IDENTITY = 'a72e614ce632a5f94bb9864e45446781212fff740cd4a4d3f79987944535cfa4';
const MANIFEST_SHA256 = 'b5efee74acc01a702d429298afa8d6d3dd839de8b930328f21589f768e663d50';
const HISTORICAL_NAMESPACE = 'nn-windows-single-real-browser-j2000-e2e-001-resume';
function bindingFor(webRoot, webHead = 'b'.repeat(40), overrides = {}) {
  return selectSingleUseJ2000EvidenceBinding(TASK_ID, {
    webRoot,
    engineHead: ENGINE_HEAD,
    webHead,
    runtimeIdentity: RUNTIME_IDENTITY,
    manifestSha256: MANIFEST_SHA256,
    ...overrides
  });
}

function harness(transport) {
  const parent = mkdtempSync(join(tmpdir(), 'nn-j2000-evidence-test-'));
  mkdirSync(join(parent, 'dist'));
  const binding = bindingFor(parent);
  const directory = binding.directory;
  const evidence = createSingleUseJ2000Evidence(directory, binding.identity, transport);
  return { directory, evidence, read: (name) => JSON.parse(readFileSync(join(directory, `${name}.json`), 'utf8')) };
}

function httpHarness(transport) {
  const parent = mkdtempSync(join(tmpdir(), 'nn-j2000-http-evidence-test-'));
  mkdirSync(join(parent, 'dist'));
  const binding = selectSingleUseJ2000EvidenceBinding(HTTP_TASK_ID, {
    webRoot: parent,
    engineHead: ENGINE_HEAD,
    webHead: 'b'.repeat(40),
    runtimeIdentity: RUNTIME_IDENTITY,
    manifestSha256: MANIFEST_SHA256
  });
  const directory = binding.directory;
  const evidence = createSingleUseJ2000Evidence(directory, binding.identity, transport);
  return { directory, evidence, binding, read: (name) => JSON.parse(readFileSync(join(directory, `${name}.json`), 'utf8')) };
}

test('launcher task selector requires one explicit task identity', () => {
  assert.equal(parseSingleUseJ2000TaskId(['node', 'launcher.mjs']), null);
  assert.equal(parseSingleUseJ2000TaskId([
    'node', 'launcher.mjs', `--capture-single-use-j2000=${TASK_ID}`
  ]), TASK_ID);
  assert.throws(() => parseSingleUseJ2000TaskId(['node', 'launcher.mjs', '--capture-single-use-j2000']), /TASK_ID_REQUIRED/);
  assert.throws(() => parseSingleUseJ2000TaskId([
    'node', 'launcher.mjs', `--capture-single-use-j2000=${TASK_ID}`,
    `--capture-single-use-j2000=${TASK_ID}`
  ]), /TASK_ID_AMBIGUOUS/);
});

test('selection is limited to the corrected J2000 task and binds committed identities', () => {
  const parent = mkdtempSync(join(tmpdir(), 'nn-j2000-selection-test-'));
  const binding = bindingFor(parent, 'c'.repeat(40));
  assert.equal(binding.directory, join(parent, 'dist', 'nn-engine-web-corrected-j2000-e2e-001'));
  assert.notEqual(binding.directory.split(/[\\/]/u).at(-1), HISTORICAL_NAMESPACE);
  assert.deepEqual({
    taskId: binding.identity.taskId,
    engineHead: binding.identity.engineHead,
    webHead: binding.identity.webHead,
    runtimeIdentity: binding.identity.runtimeIdentity,
    manifestSha256: binding.identity.manifestSha256,
    canonicalRequest: binding.identity.canonicalRequest,
    evidenceNamespace: binding.identity.evidenceNamespace,
    dispatchChannel: binding.identity.dispatchChannel,
    maximumBrowserSubmissions: binding.identity.maximumBrowserSubmissions,
    maximumBffHttpSubmissions: binding.identity.maximumBffHttpSubmissions,
    maximumEngineChartRequests: binding.identity.maximumEngineChartRequests
  }, {
    taskId: TASK_ID,
    engineHead: ENGINE_HEAD,
    webHead: 'c'.repeat(40),
    runtimeIdentity: RUNTIME_IDENTITY,
    manifestSha256: MANIFEST_SHA256,
    canonicalRequest: J2000_WIRE,
    evidenceNamespace: 'nn-engine-web-corrected-j2000-e2e-001',
    dispatchChannel: 'BROWSER',
    maximumBrowserSubmissions: 1,
    maximumBffHttpSubmissions: 0,
    maximumEngineChartRequests: 1
  });
  assert.match(binding.identity.requestIdentity, /^sha256:[0-9a-f]{64}$/u);
  assert.throws(() => selectSingleUseJ2000EvidenceBinding('UNSUPPORTED_TASK', {
    webRoot: parent, engineHead: ENGINE_HEAD, webHead: 'c'.repeat(40),
    runtimeIdentity: RUNTIME_IDENTITY, manifestSha256: MANIFEST_SHA256
  }), /TASK_ID_UNSUPPORTED/);
  assert.throws(() => bindingFor(parent, 'c'.repeat(40), { engineHead: 'd'.repeat(40) }), /IDENTITY_MISMATCH/);
  assert.throws(() => bindingFor(parent, 'c'.repeat(40), { runtimeIdentity: 'd'.repeat(64) }), /IDENTITY_MISMATCH/);
  assert.throws(() => bindingFor(parent, 'c'.repeat(40), { manifestSha256: 'd'.repeat(64) }), /IDENTITY_MISMATCH/);
  assert.throws(() => bindingFor(parent, 'not-a-commit'), /WEB_HEAD_INVALID/);
  assert.equal(Object.isFrozen(J2000_WIRE.input), true);
  assert.equal(Object.isFrozen(J2000_WIRE.options), true);
  assert.throws(() => { J2000_WIRE.input.latitude = 0; }, TypeError);
});

test('HTTP task selects a distinct namespace and records no browser submission budget', () => {
  const parent = mkdtempSync(join(tmpdir(), 'nn-j2000-http-selection-test-'));
  assert.equal(parseSingleUseJ2000TaskId([
    'node', 'launcher.mjs', `--capture-single-use-j2000=${HTTP_TASK_ID}`
  ]), HTTP_TASK_ID);
  const binding = selectSingleUseJ2000EvidenceBinding(HTTP_TASK_ID, {
    webRoot: parent,
    engineHead: ENGINE_HEAD,
    webHead: 'e'.repeat(40),
    runtimeIdentity: RUNTIME_IDENTITY,
    manifestSha256: MANIFEST_SHA256
  });
  assert.equal(binding.directory, join(parent, 'dist', 'nn-engine-web-corrected-http-e2e-001'));
  assert.notEqual(binding.directory, join(parent, 'dist', 'nn-engine-web-corrected-j2000-e2e-001'));
  assert.equal(binding.identity.webHead, 'e'.repeat(40));
  assert.equal(binding.identity.dispatchChannel, 'BFF_HTTP');
  assert.equal(binding.identity.maximumBrowserSubmissions, 0);
  assert.equal(binding.identity.maximumBffHttpSubmissions, 1);
  assert.equal(binding.identity.maximumEngineChartRequests, 1);

  assert.throws(() => selectSingleUseJ2000EvidenceBinding(HTTP_TASK_ID, {
    webRoot: parent,
    engineHead: 'd'.repeat(40),
    webHead: 'e'.repeat(40),
    runtimeIdentity: RUNTIME_IDENTITY,
    manifestSha256: MANIFEST_SHA256
  }), /IDENTITY_MISMATCH/);
});

test('claim is durable before forwarding; concurrent call and process restart fail closed', async () => {
  let finish;
  let calls = 0;
  let h;
  h = harness(async () => {
    calls += 1;
    assert.equal(h.read('budget-consumed').consumed, true);
    assert.equal(h.read('engine-request').requestCount, 1);
    return new Promise((resolve) => { finish = () => resolve(new Response('{}')); });
  });
  const client = h.evidence.wrapClient({ expectedRuntimeIdentity: RUNTIME_IDENTITY, async calculateChart() {
    await h.evidence.fetchOperation('http://127.0.0.1:1/v1/chart/calculate', { body: JSON.stringify(J2000_WIRE) });
    return { chart: { explicitlySynthetic: true } };
  } });
  const first = client.calculateChart(J2000_ENGINE_REQUEST);
  await assert.rejects(client.calculateChart(J2000_ENGINE_REQUEST), /SINGLE_USE_BUDGET_CONSUMED/);
  assert.throws(() => createSingleUseJ2000Evidence(h.directory, bindingFor('C:\\isolated').identity), /NAMESPACE_EXISTS/);
  finish();
  await first;
  await assert.rejects(h.evidence.fetchOperation('http://127.0.0.1:1/v1/chart/calculate', {
    body: JSON.stringify(J2000_WIRE)
  }), /SINGLE_USE_FORWARD_REJECTED/);
  assert.equal(calls, 1);
  h.evidence.close(['synthetic transport only']);
  assert.equal(h.read('closed').gate, 'CLOSED');
  assert.equal(h.read('closed').engineRequests, 1);
  assert.equal(h.read('closed').maximumBrowserSubmissions, 1);
  assert.equal(h.read('closed').maximumEngineChartRequests, 1);
  assert.equal(h.read('closed').taskId, TASK_ID);
});

test('transport failure consumes budget without retries or fallback', async () => {
  let calls = 0;
  const h = harness(async () => { calls += 1; throw new Error('synthetic timeout'); });
  const client = h.evidence.wrapClient({ expectedRuntimeIdentity: RUNTIME_IDENTITY, async calculateChart() {
    return h.evidence.fetchOperation('http://127.0.0.1:1/v1/chart/calculate', { body: JSON.stringify(J2000_WIRE) });
  } });
  await assert.rejects(client.calculateChart(J2000_ENGINE_REQUEST), /synthetic timeout/);
  await assert.rejects(client.calculateChart(J2000_ENGINE_REQUEST), /BUDGET_CONSUMED/);
  assert.equal(calls, 1);
  h.evidence.close([]);
  assert.equal(h.read('closed').consumed, true);
});

test('unclaimed chart transport is rejected, while only negative probes bypass the claim', async () => {
  let calls = 0;
  const h = harness(async () => { calls += 1; return new Response('{}'); });
  await assert.rejects(h.evidence.fetchOperation('http://127.0.0.1:1', { body: JSON.stringify(J2000_WIRE) }), /FORWARD_REJECTED/);
  await h.evidence.fetchOperation('http://127.0.0.1:1', {});
  await h.evidence.fetchOperation('http://127.0.0.1:1', { body: '{}' });
  assert.equal(calls, 2);
  assert.throws(() => h.read('budget-consumed'), /ENOENT/);
});

test('browser submission claim is durable before BFF dispatch and later submissions are rejected', async () => {
  const h = harness(async () => new Response('{}'));
  let dispatches = 0;
  const context = () => ({
    req: {
      path: '/api/dev/chart/calculate',
      raw: new Request('http://127.0.0.1/api/dev/chart/calculate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: { instant: '2000-01-01T12:00:00.000Z' } })
      })
    },
    res: new Response('{}', { headers: { 'content-type': 'application/json' } })
  });
  const first = context();
  await h.evidence.observeBff(first, async () => {
    dispatches += 1;
    assert.equal(h.read('browser-budget-consumed').browserBudgetConsumed, true);
    assert.equal(h.read('browser-budget-consumed').maximumBrowserSubmissions, 1);
    first.res = new Response('{"accepted":true}', { headers: { 'content-type': 'application/json' } });
  });
  const replay = context();
  await assert.rejects(h.evidence.observeBff(replay, async () => { dispatches += 1; }), /SINGLE_USE_BROWSER_BUDGET_CONSUMED/);
  assert.equal(dispatches, 1);
  assert.equal(h.read('browser-request-1').taskId, TASK_ID);
  h.evidence.close([]);
  assert.equal(h.read('closed').browserRequests, 1);
});

test('HTTP BFF submission has its own durable budget and cannot be mislabeled or replayed as browser traffic', async () => {
  let transportCalls = 0;
  let h;
  h = httpHarness(async () => {
    transportCalls += 1;
    assert.equal(h.read('bff-http-budget-consumed').bffHttpBudgetConsumed, true);
    assert.equal(h.read('bff-http-budget-consumed').maximumBffHttpSubmissions, 1);
    assert.equal(h.read('engine-request').requestCount, 1);
    return new Response('{"chart":{"synthetic":true}}', { headers: { 'content-type': 'application/json' } });
  });
  let engineDispatches = 0;
  const client = h.evidence.wrapClient({
    expectedRuntimeIdentity: RUNTIME_IDENTITY,
    async calculateChart(request) {
      engineDispatches += 1;
      return h.evidence.fetchOperation('http://127.0.0.1/private/v1/chart/calculate', {
        method: 'POST',
        headers: { Authorization: 'Bearer synthetic-only' },
        body: JSON.stringify(J2000_WIRE)
      });
    }
  });
  const context = () => ({
    req: {
      path: '/api/dev/chart/calculate',
      raw: new Request('http://127.0.0.1/api/dev/chart/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:4321' },
        body: JSON.stringify({ chart: { frozen: 'J2000' } })
      })
    },
    res: new Response('{"accepted":true}', { headers: { 'content-type': 'application/json' } })
  });
  const first = context();
  await h.evidence.observeBff(first, async () => {
    assert.equal(h.read('bff-http-budget-consumed').dispatchChannel, 'BFF_HTTP');
    await client.calculateChart(J2000_ENGINE_REQUEST);
  });
  assert.equal(h.read('bff-http-request-1').browserSubmission, false);
  assert.equal(h.read('bff-http-request-1').dispatchChannel, 'BFF_HTTP');
  assert.equal(engineDispatches, 1);
  assert.equal(transportCalls, 1);
  await assert.rejects(h.evidence.observeBff(context(), async () => {
    engineDispatches += 1;
  }), /SINGLE_USE_BFF_HTTP_BUDGET_CONSUMED/);
  assert.equal(engineDispatches, 1);
  assert.throws(() => h.read('browser-budget-consumed'), /ENOENT/);
  assert.throws(() => h.read('browser-request-1'), /ENOENT/);
  h.evidence.close([]);
  assert.equal(h.read('closed').browserRequests, 0);
  assert.equal(h.read('closed').bffHttpSubmissions, 1);
  assert.equal(h.read('closed').engineRequests, 1);
  assert.equal(h.read('preflight').bffHttpBudgetConsumed, false);
  assert.equal(h.read('preflight').browserBudgetConsumed, undefined);
});

test('client runtime identity mismatch fails before a one-shot call can be made', () => {
  const h = harness(async () => new Response('{}'));
  assert.throws(() => h.evidence.wrapClient({ expectedRuntimeIdentity: '0'.repeat(64) }), /CLIENT_RUNTIME_IDENTITY_MISMATCH/);
  assert.throws(() => h.evidence.wrapClient({}), /CLIENT_RUNTIME_IDENTITY_MISMATCH/);
});

test('a closed task namespace cannot be reopened and identity errors do not create one', () => {
  const h = harness(async () => new Response('{}'));
  const invalidIdentity = { ...bindingFor('C:\\isolated').identity, webHead: 'not-a-commit' };
  assert.throws(() => createSingleUseJ2000Evidence(h.directory, invalidIdentity), /WEB_HEAD_INVALID/);
  assert.equal(h.read('preflight').taskId, TASK_ID);
  h.evidence.close([]);
  assert.equal(h.read('closed').gate, 'CLOSED');
  assert.throws(() => createSingleUseJ2000Evidence(h.directory, bindingFor('C:\\isolated').identity), /NAMESPACE_EXISTS/);
});
