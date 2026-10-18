import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createSingleUseJ2000Evidence, J2000_WIRE } from './single-use-j2000-evidence.mjs';

const identity = { taskId: 'SYNTHETIC_ONLY', engineHead: 'a'.repeat(40), webHead: 'b'.repeat(40) };
function harness(transport) {
  const parent = mkdtempSync(join(tmpdir(), 'nn-j2000-evidence-test-'));
  const directory = join(parent, 'run');
  const evidence = createSingleUseJ2000Evidence(directory, identity, transport);
  return { directory, evidence, read: (name) => JSON.parse(readFileSync(join(directory, `${name}.json`), 'utf8')) };
}

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
  const client = h.evidence.wrapClient({ expectedRuntimeIdentity: 'c'.repeat(64), async calculateChart() {
    await h.evidence.fetchOperation('http://127.0.0.1:1/v1/chart/calculate', { body: JSON.stringify(J2000_WIRE) });
    return { chart: { explicitlySynthetic: true } };
  } });
  const first = client.calculateChart(J2000_WIRE);
  await assert.rejects(client.calculateChart(J2000_WIRE), /SINGLE_USE_BUDGET_CONSUMED/);
  assert.throws(() => createSingleUseJ2000Evidence(h.directory, identity), /NAMESPACE_EXISTS/);
  finish();
  await first;
  assert.equal(calls, 1);
  h.evidence.close(['synthetic transport only']);
  assert.equal(h.read('closed').gate, 'CLOSED');
  assert.equal(h.read('closed').engineRequests, 1);
});

test('transport failure consumes budget without retries or fallback', async () => {
  let calls = 0;
  const h = harness(async () => { calls += 1; throw new Error('synthetic timeout'); });
  const client = h.evidence.wrapClient({ async calculateChart() {
    return h.evidence.fetchOperation('http://127.0.0.1:1/v1/chart/calculate', { body: JSON.stringify(J2000_WIRE) });
  } });
  await assert.rejects(client.calculateChart(J2000_WIRE), /synthetic timeout/);
  await assert.rejects(client.calculateChart(J2000_WIRE), /BUDGET_CONSUMED/);
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
