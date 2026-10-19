import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';

export const J2000_WIRE = Object.freeze({
  input: Object.freeze({ instant: '2000-01-01T12:00:00Z', latitude: 51.4779, longitude: -0.0015 }),
  options: Object.freeze({ houseSystem: 'placidus', zodiac: 'tropical' })
});
const J2000_REQUEST_IDENTITY = `sha256:${createHash('sha256').update(JSON.stringify(J2000_WIRE)).digest('hex')}`;

const SUPPORTED_SINGLE_USE_TASK = Object.freeze({
  taskId: 'NN-ENGINE-WEB-CORRECTED-J2000-E2E-001',
  engineHead: '9cde9285d5ed74a1837d8be0dd5c807ca0134bc3',
  runtimeIdentity: 'a72e614ce632a5f94bb9864e45446781212fff740cd4a4d3f79987944535cfa4',
  manifestSha256: 'b5efee74acc01a702d429298afa8d6d3dd839de8b930328f21589f768e663d50',
  namespace: 'nn-engine-web-corrected-j2000-e2e-001'
});
const CAPTURE_ARGUMENT = '--capture-single-use-j2000';

export function parseSingleUseJ2000TaskId(argumentsList) {
  const selections = argumentsList.filter((argument) =>
    argument === CAPTURE_ARGUMENT || argument.startsWith(`${CAPTURE_ARGUMENT}=`));
  if (selections.length > 1) throw new Error('SINGLE_USE_TASK_ID_AMBIGUOUS');
  if (selections.length === 0) return null;
  if (selections[0] === CAPTURE_ARGUMENT || selections[0] === `${CAPTURE_ARGUMENT}=`) {
    throw new Error('SINGLE_USE_TASK_ID_REQUIRED');
  }
  return selections[0].slice(CAPTURE_ARGUMENT.length + 1);
}

function bindIdentity({ taskId, engineHead, webHead, runtimeIdentity, manifestSha256 }) {
  if (taskId !== SUPPORTED_SINGLE_USE_TASK.taskId) throw new Error('SINGLE_USE_TASK_ID_UNSUPPORTED');
  if (engineHead !== SUPPORTED_SINGLE_USE_TASK.engineHead ||
      runtimeIdentity !== SUPPORTED_SINGLE_USE_TASK.runtimeIdentity ||
      manifestSha256 !== SUPPORTED_SINGLE_USE_TASK.manifestSha256) {
    throw new Error('SINGLE_USE_IDENTITY_MISMATCH');
  }
  if (!/^[0-9a-f]{40}$/u.test(webHead)) throw new Error('SINGLE_USE_WEB_HEAD_INVALID');

  return Object.freeze({
    taskId,
    engineHead,
    webHead,
    runtimeIdentity,
    manifestSha256,
    requestIdentity: J2000_REQUEST_IDENTITY,
    canonicalRequest: J2000_WIRE,
    maximumBrowserSubmissions: 1,
    maximumEngineChartRequests: 1
  });
}

// Selects a task-local evidence namespace. It records evidence only; it does
// not grant, infer, or consume owner authorization by itself.
export function selectSingleUseJ2000EvidenceBinding(taskId, identities) {
  const identity = bindIdentity({ ...identities, taskId });
  const directory = join(resolve(identities.webRoot), 'dist', SUPPORTED_SINGLE_USE_TASK.namespace);
  return Object.freeze({ directory, identity });
}

// Task-local evidence, not a service or authorization authority. An existing
// directory is deliberately not resumable: a restart must never renew a budget.
export function createSingleUseJ2000Evidence(directory, identity, fetchOperation = fetch) {
  const boundIdentity = bindIdentity(identity);
  const absoluteDirectory = resolve(directory);
  if (basename(absoluteDirectory) !== SUPPORTED_SINGLE_USE_TASK.namespace ||
      basename(dirname(absoluteDirectory)) !== 'dist' ||
      !absoluteDirectory.endsWith(`${sep}dist${sep}${SUPPORTED_SINGLE_USE_TASK.namespace}`)) {
    throw new Error('SINGLE_USE_EVIDENCE_NAMESPACE_INVALID');
  }
  if (existsSync(absoluteDirectory)) throw new Error('SINGLE_USE_EVIDENCE_NAMESPACE_EXISTS');
  mkdirSync(absoluteDirectory);
  const runId = randomUUID();
  let consumed = false;
  let closed = false;
  let engineRequests = 0;
  let browserRequests = 0;
  function record(name, value) {
    const fd = openSync(join(absoluteDirectory, `${name}.json`), 'wx');
    try {
      writeFileSync(fd, `${JSON.stringify({ ...value, ...boundIdentity, runId, observedAt: new Date().toISOString() }, null, 2)}\n`);
      fsyncSync(fd);
    } finally { closeSync(fd); }
  }
  record('preflight', { consumed: false, browserBudgetConsumed: false });
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
      if (client.expectedRuntimeIdentity !== boundIdentity.runtimeIdentity) {
        throw new Error('SINGLE_USE_CLIENT_RUNTIME_IDENTITY_MISMATCH');
      }
      return {
        expectedRuntimeIdentity: client.expectedRuntimeIdentity,
        async calculateChart(request, signal) {
          if (closed || consumed) throw new Error('SINGLE_USE_BUDGET_CONSUMED');
          assert.deepEqual(request, J2000_WIRE);
          // Synchronous exclusive, fsynced claim precedes any client/transport work.
          consumed = true;
          record('budget-consumed', { consumed: true, engineClientRequest: request });
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
      if (closed || browserRequests !== 0) throw new Error('SINGLE_USE_BROWSER_BUDGET_CONSUMED');
      browserRequests += 1;
      const ordinal = browserRequests;
      record('browser-budget-consumed', { browserBudgetConsumed: true, requestCount: ordinal });
      const browserRequest = await context.req.raw.clone().json();
      record(`browser-request-${ordinal}`, { requestCount: ordinal, browserRequest });
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
