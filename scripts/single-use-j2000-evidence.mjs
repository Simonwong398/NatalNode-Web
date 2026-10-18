import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const J2000_WIRE = Object.freeze({
  input: { instant: '2000-01-01T12:00:00Z', latitude: 51.4779, longitude: -0.0015 },
  options: { houseSystem: 'placidus', zodiac: 'tropical' }
});

// Task-local evidence, not a service or authorization authority. An existing
// directory is deliberately not resumable: a restart must never renew a budget.
export function createSingleUseJ2000Evidence(directory, identity, fetchOperation = fetch) {
  if (existsSync(directory)) throw new Error('SINGLE_USE_EVIDENCE_NAMESPACE_EXISTS');
  mkdirSync(directory);
  const runId = randomUUID();
  let consumed = false;
  let closed = false;
  let engineRequests = 0;
  let browserRequests = 0;
  function record(name, value) {
    const fd = openSync(join(directory, `${name}.json`), 'wx');
    try {
      writeFileSync(fd, `${JSON.stringify({ runId, observedAt: new Date().toISOString(), ...value }, null, 2)}\n`);
      fsyncSync(fd);
    } finally { closeSync(fd); }
  }
  record('preflight', { ...identity, budgetMaximum: 1, consumed: false });
  return {
    record,
    async fetchOperation(url, init) {
      // The accepted launcher has only these two non-calculating probes.
      if (!init.body || init.body === '{}') return fetchOperation(url, init);
      assert.deepEqual(JSON.parse(init.body), J2000_WIRE);
      if (!consumed || closed || engineRequests !== 0) throw new Error('SINGLE_USE_FORWARD_REJECTED');
      engineRequests += 1;
      record('engine-request', { requestCount: engineRequests, wire: JSON.parse(init.body) });
      const response = await fetchOperation(url, init);
      record('engine-http-response', { status: response.status });
      return response;
    },
    wrapClient(client) {
      return {
        expectedRuntimeIdentity: client.expectedRuntimeIdentity,
        async calculateChart(request, signal) {
          if (closed || consumed) throw new Error('SINGLE_USE_BUDGET_CONSUMED');
          // Synchronous exclusive, fsynced claim precedes any client/transport work.
          consumed = true;
          record('budget-consumed', { ...identity, consumed: true, request });
          try {
            const reply = await client.calculateChart(request, signal);
            record('validated-engine-result', reply);
            return reply;
          } finally { closed = true; }
        }
      };
    },
    async observeBff(context, next) {
      if (context.req.path !== '/api/dev/chart/calculate') return next();
      browserRequests += 1;
      const ordinal = browserRequests;
      record(`browser-request-${ordinal}`, { requestCount: ordinal, request: await context.req.raw.clone().json() });
      await next();
      const payload = await context.res.clone().json();
      record(`browser-response-${ordinal}`, { status: context.res.status, payload });
    },
    close(results) {
      closed = true;
      record('closed', { gate: 'CLOSED', consumed, engineRequests, browserRequests, cleanup: results });
    }
  };
}
