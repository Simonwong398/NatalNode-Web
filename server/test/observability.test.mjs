import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';

function createChartRequest(locationLabel = 'Test location') {
  return {
    birth: {
      localDate: '1990-01-01',
      localTime: '12:00',
      locationLabel,
      latitude: 40.7128,
      longitude: -74.006,
      ianaTimeZone: 'America/New_York',
      resolvedUtcInstant: '1990-01-01T17:00:00.000Z',
      utcOffsetSeconds: -18_000,
      timezoneDatabaseVersion: 'tzdb-test-v1',
      timezoneResolutionMethod: 'fixture-exact',
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'PLACIDUS'
  };
}

function createSink() {
  const records = [];

  return {
    records,
    write(record) {
      records.push(structuredClone(record));
    }
  };
}

function createDependencies({
  authenticate = async () => null,
  calculateChart = async () => ({ ok: true }),
  listVaultCharts = async () => []
} = {}) {
  return {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        return authenticate(request);
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {
      generate() {
        return 'generated-id';
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
        async listForUser(userId) {
          return listVaultCharts(userId);
        }
      },
      chartNotes: {}
    },
    engineClient: {
      async calculateChart() {
        return { ok: true };
      },
      async getSkySnapshot() {
        return { ok: true };
      },
      async getSkyEvents() {
        return { ok: true };
      }
    },
    chartCalculator: {
      async calculateChart(request) {
        return calculateChart(request);
      }
    },
    clock: {
      now() {
        return '2026-08-28T12:00:00.000Z';
      }
    },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };
}

function createHarness(options = {}) {
  const sink = createSink();
  const app = createApp(createDependencies(options), {
    observabilitySink: sink
  });

  return { app, sink };
}

function apiRequest(
  app,
  pathname,
  { method = 'GET', headers = {}, body } = {}
) {
  return app.request(pathname, {
    method,
    headers: new Headers({
      Origin: PUBLIC_WEB_ORIGIN,
      ...headers
    }),
    ...(body === undefined ? {} : { body })
  });
}

function postJson(app, pathname, body, edgeIp = '198.51.100.10', origin = PUBLIC_WEB_ORIGIN) {
  return app.request(pathname, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-NatalNode-Client-IP': edgeIp
    },
    body: JSON.stringify(body)
  });
}

async function assertProblem(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  const payload = await response.json();
  assert.equal(payload.status, status);
  assert.equal(payload.code, code);
}

function assertBoundedCompletion(record) {
  assert.equal(record.event, 'api.request.completed');
  assert.equal(typeof record.timestamp, 'string');
  assert.equal(record.level === 'info' || record.level === 'error', true);
  assert.equal(typeof record.requestId, 'string');
  assert.equal(record.requestId.length > 0, true);
  assert.equal(
    ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'OTHER'].includes(
      record.method
    ),
    true
  );
  assert.equal(typeof record.endpointFamily, 'string');
  assert.equal(Number.isSafeInteger(record.status), true);
  assert.equal(Number.isSafeInteger(record.durationMs), true);
  assert.equal(record.durationMs >= 0, true);

  for (const field of [
    'cacheStatus',
    'engineResultGeneration',
    'chartResultContractVersion',
    'scientificStatus',
    'provenanceStatus',
    'warningCount',
    'engineDurationMs',
    'astronomyConfigurationId'
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(record, field), false, field);
  }
}

function assertSingleCompletion(sink) {
  assert.equal(sink.records.length, 1);
  const [record] = sink.records;
  assertBoundedCompletion(record);
  return record;
}

test('emits one completion record with a server-generated request ID', async () => {
  const { app, sink } = createHarness();
  const response = await apiRequest(app, '/api/health', {
    headers: { 'X-Request-Id': 'client-supplied-id' }
  });

  assert.equal(response.status, 200);
  assert.notEqual(response.headers.get('X-Request-Id'), 'client-supplied-id');

  const record = assertSingleCompletion(sink);
  assert.equal(record.level, 'info');
  assert.equal(record.method, 'GET');
  assert.equal(record.endpointFamily, 'health');
  assert.equal(record.status, 200);
  assert.equal(record.problemCode, undefined);
  assert.equal(record.requestId, response.headers.get('X-Request-Id'));
});

test('records supported methods and keeps endpoint families static', async () => {
  const { app, sink } = createHarness();
  const response = await apiRequest(app, '/api/health', { method: 'HEAD' });

  assert.equal(response.status, 200);

  const record = assertSingleCompletion(sink);
  assert.equal(record.method, 'HEAD');
  assert.equal(record.endpointFamily, 'health');
  assert.equal(record.problemCode, undefined);
});

test('records canonical ProblemCodes without raw paths or request data', async () => {
  const cases = [
    {
      name: 'invalid request',
      status: 400,
      code: 'INVALID_REQUEST',
      endpointFamily: 'chart',
      request(app) {
        return postJson(app, '/api/chart', {
          chart: 'private-body-sentinel'
        });
      },
      secret: 'private-body-sentinel'
    },
    {
      name: 'unauthenticated vault request',
      status: 401,
      code: 'UNAUTHORIZED',
      endpointFamily: 'vault.notes',
      request(app) {
        return apiRequest(
          app,
          '/api/vault/charts/private-chart-id/notes'
        );
      },
      secret: 'private-chart-id'
    },
    {
      name: 'wrong origin',
      status: 403,
      code: 'FORBIDDEN',
      endpointFamily: 'chart',
      request(app) {
        return postJson(
          app,
          '/api/chart',
          { chart: 'private-origin-body' },
          '198.51.100.11',
          'https://evil.example'
        );
      },
      secret: 'private-origin-body'
    },
    {
      name: 'unknown API route',
      status: 404,
      code: 'NOT_FOUND',
      endpointFamily: 'unknown-api',
      request(app) {
        return apiRequest(app, '/api/private-route/private-id');
      },
      secret: 'private-id'
    }
  ];

  for (const currentCase of cases) {
    const { app, sink } = createHarness();
    const response = await currentCase.request(app);

    await assertProblem(response, currentCase.status, currentCase.code);

    const record = assertSingleCompletion(sink);
    assert.equal(record.problemCode, currentCase.code, currentCase.name);
    assert.equal(
      record.endpointFamily,
      currentCase.endpointFamily,
      currentCase.name
    );
    assert.equal(JSON.stringify(record).includes(currentCase.secret), false);
  }
});

test('maps an unexpected API failure to one redacted 500 completion', async () => {
  const { app, sink } = createHarness({
    authenticate: async () => ({
      userId: 'user-a',
      sessionCreatedAt: '2026-08-28T12:00:00.000Z'
    }),
    listVaultCharts: async () => {
      throw new Error('private persistence sentinel');
    }
  });
  const response = await apiRequest(app, '/api/vault/charts');

  await assertProblem(response, 500, 'INTERNAL_ERROR');

  const record = assertSingleCompletion(sink);
  assert.equal(record.level, 'error');
  assert.equal(record.endpointFamily, 'vault.charts');
  assert.equal(record.problemCode, 'INTERNAL_ERROR');
  assert.equal(JSON.stringify(record).includes('private persistence sentinel'), false);
});

test('maps calculation failure to one 503 completion without calculation details', async () => {
  const { app, sink } = createHarness({
    calculateChart: async () => {
      throw new Error('private calculation sentinel');
    }
  });
  const response = await postJson(app, '/api/chart', {
    chart: createChartRequest('private birth label')
  });

  await assertProblem(response, 503, 'CALCULATION_UNAVAILABLE');

  const record = assertSingleCompletion(sink);
  assert.equal(record.level, 'error');
  assert.equal(record.endpointFamily, 'chart');
  assert.equal(record.problemCode, 'CALCULATION_UNAVAILABLE');
  assert.equal(JSON.stringify(record).includes('private calculation sentinel'), false);
  assert.equal(JSON.stringify(record).includes('private birth label'), false);
});

test('records rate-limit completion without creating a second error event', async () => {
  const { app, sink } = createHarness();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await postJson(app, '/api/chart', {});
    assert.equal(response.status, 400);
  }

  const limitedResponse = await postJson(app, '/api/chart', {});
  await assertProblem(limitedResponse, 429, 'RATE_LIMITED');

  assert.equal(sink.records.length, 21);
  const record = sink.records.at(-1);
  assertBoundedCompletion(record);
  assert.equal(record.level, 'info');
  assert.equal(record.endpointFamily, 'chart');
  assert.equal(record.status, 429);
  assert.equal(record.problemCode, 'RATE_LIMITED');
  assert.equal(
    sink.records.every((entry) => entry.event === 'api.request.completed'),
    true
  );
});

test('continues authoritative responses when the injected sink fails', async () => {
  const sink = {
    write() {
      throw new Error('sink failure sentinel');
    }
  };
  const app = createApp(createDependencies(), { observabilitySink: sink });

  const response = await apiRequest(app, '/api/health');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    service: 'natalnode-web-bff',
    status: 'ok'
  });
});

test('continues authoritative error responses when the injected sink fails', async () => {
  const dependencies = createDependencies({
    calculateChart: async () => {
      throw new Error('private calculation sentinel');
    }
  });
  const healthyApp = createApp(dependencies, {
    observabilitySink: createSink()
  });
  const failingApp = createApp(dependencies, {
    observabilitySink: {
      write() {
        throw new Error('sink failure sentinel');
      }
    }
  });
  const requestBody = { chart: createChartRequest('private birth label') };

  const healthyResponse = await postJson(
    healthyApp,
    '/api/chart',
    requestBody,
    '198.51.100.12'
  );
  const failingResponse = await postJson(
    failingApp,
    '/api/chart',
    requestBody,
    '198.51.100.12'
  );

  assert.equal(failingResponse.status, healthyResponse.status);
  assert.equal(
    await failingResponse.text(),
    await healthyResponse.text()
  );
  for (const header of ['Content-Type', 'Cache-Control']) {
    assert.equal(
      failingResponse.headers.get(header),
      healthyResponse.headers.get(header),
      header
    );
  }
  assert.equal(failingResponse.headers.has('X-Request-Id'), true);
});
