import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HttpEngineClient,
  isChartResult
} from '@natalnode/engine-client';
import { WEB_UI_FIXTURE_V1 } from '@natalnode/test-fixtures';
import { CachedChartCalculator } from '../dist/app/cache/cached-chart-calculator.js';
import { createApp } from '../dist/app/create-app.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const CACHE_IDENTITY = {
  runtimeNamespace: 'development-mock',
  engineResultGeneration: 'UI_FIXTURE_V1',
  chartResultContractVersion: '1.0.0'
};
const CACHE_CLOCK = {
  now() {
    return '2026-08-28T12:00:00.000Z';
  }
};

function createChartRequest({
  localDate = '1990-01-01',
  locationLabel = 'Test location'
} = {}) {
  return {
    birth: {
      localDate,
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

function createCountingEngine(resultFactory = () => structuredClone(WEB_UI_FIXTURE_V1)) {
  const calls = [];

  return {
    calls,
    async calculateChart(request) {
      calls.push(request);
      return resultFactory(request, calls.length);
    },
    async getSkySnapshot() {
      throw new Error('Sky is outside this focused test.');
    },
    async getSkyEvents() {
      throw new Error('Sky is outside this focused test.');
    }
  };
}

function createCalculator(engineClient, clock = CACHE_CLOCK) {
  return new CachedChartCalculator({
    engineClient,
    clock,
    cacheIdentity: CACHE_IDENTITY
  });
}

function createRouteHarness({
  engineClient = createCountingEngine(),
  authenticate = true,
  clock = CACHE_CLOCK
} = {}) {
  const savedCharts = [];
  let nextChartId = 0;
  const chartCalculator = createCalculator(engineClient, clock);
  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        if (!authenticate) {
          return null;
        }

        const userId = request.headers.get('x-test-user');
        return userId === null ? null : { userId };
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {
      generate() {
        nextChartId += 1;
        return `chart-${nextChartId}`;
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
        async create(chart) {
          savedCharts.push(structuredClone(chart));
        }
      },
      chartNotes: {}
    },
    engineClient,
    chartCalculator,
    clock,
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies),
    engineClient,
    savedCharts
  };
}

function postJson(app, path, body, { userId = null, edgeIp = '203.0.113.10' } = {}) {
  const headers = {
    Origin: PUBLIC_WEB_ORIGIN,
    'Content-Type': 'application/json',
    'X-NatalNode-Client-IP': edgeIp
  };

  if (userId !== null) {
    headers['X-Test-User'] = userId;
  }

  return app.request(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
}

async function assertProblemResponse(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), {
    type: 'about:blank',
    title:
      status === 400
        ? 'Bad Request'
        : status === 401
          ? 'Unauthorized'
          : status === 429
            ? 'Too Many Requests'
            : 'Service Unavailable',
    status,
    code
  });
}

function createVaultSaveRequest(chart, displayName = 'Saved chart') {
  return {
    chart,
    displayName,
    category: 'SELF',
    tags: ['focused-test'],
    favorite: false
  };
}

test('shared calculator caches compatible results and keeps returned values clone-safe', async () => {
  const engineClient = createCountingEngine();
  const calculator = createCalculator(engineClient);
  const request = createChartRequest();
  const requestBeforeCalculation = structuredClone(request);

  const first = await calculator.calculateChart(request);
  first.bodies[0].longitude = 999;
  const second = await calculator.calculateChart(request);

  assert.equal(engineClient.calls.length, 1);
  assert.deepEqual(request, requestBeforeCalculation);
  assert.equal(second.bodies[0].longitude, WEB_UI_FIXTURE_V1.bodies[0].longitude);
  assert.notStrictEqual(first, second);
});

test('semantically different ChartRequests calculate separately', async () => {
  const engineClient = createCountingEngine();
  const calculator = createCalculator(engineClient);

  await calculator.calculateChart(createChartRequest({ localDate: '1990-01-01' }));
  await calculator.calculateChart(createChartRequest({ localDate: '1990-01-02' }));

  assert.equal(engineClient.calls.length, 2);
});

test('structurally invalid or incompatible fresh results are not cached or returned', async () => {
  const invalidResults = [
    { ...structuredClone(WEB_UI_FIXTURE_V1), bodies: 'invalid' },
    { ...structuredClone(WEB_UI_FIXTURE_V1), schemaVersion: '9.9.9' },
    { ...structuredClone(WEB_UI_FIXTURE_V1), engineVersion: 'other-generation' }
  ];

  for (const invalidResult of invalidResults) {
    let resultIndex = 0;
    const engineClient = createCountingEngine(() => {
      const result =
        resultIndex++ === 0
          ? invalidResult
          : structuredClone(WEB_UI_FIXTURE_V1);
      return result;
    });
    const calculator = createCalculator(engineClient);
    const request = createChartRequest();

    await assert.rejects(
      calculator.calculateChart(request),
      /incompatible/u
    );
    const recovered = await calculator.calculateChart(request);

    assert.deepEqual(recovered, WEB_UI_FIXTURE_V1);
    assert.equal(engineClient.calls.length, 2);
  }
});

test('cache write failure does not fail a valid fresh result or create a false hit', async () => {
  const engineClient = createCountingEngine(() => ({
    ...structuredClone(WEB_UI_FIXTURE_V1),
    unsupported: () => undefined
  }));
  const calculator = createCalculator(engineClient);
  const request = createChartRequest();

  const first = await calculator.calculateChart(request);
  const second = await calculator.calculateChart(request);

  assert.equal(engineClient.calls.length, 2);
  assert.equal(first.engineVersion, 'UI_FIXTURE_V1');
  assert.equal(second.engineVersion, 'UI_FIXTURE_V1');
});

test('EngineClient failures are propagated and never cached', async () => {
  const engineClient = createCountingEngine(() => {
    throw new Error('private Engine failure');
  });
  const calculator = createCalculator(engineClient);
  const request = createChartRequest();

  await assert.rejects(calculator.calculateChart(request), /private Engine failure/u);
  await assert.rejects(calculator.calculateChart(request), /private Engine failure/u);

  assert.equal(engineClient.calls.length, 2);
});

test('Chart route reuses the shared calculator without changing its success envelope', async () => {
  const harness = createRouteHarness();
  const firstRequest = createChartRequest({ locationLabel: 'First label' });
  const secondRequest = createChartRequest({ locationLabel: 'Second label' });

  const firstResponse = await postJson(harness.app, '/api/chart', {
    chart: firstRequest
  });
  const secondResponse = await postJson(harness.app, '/api/chart', {
    chart: secondRequest
  });

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(firstResponse.headers.get('Cache-Control'), 'no-store');
  assert.equal(secondResponse.headers.get('Cache-Control'), 'no-store');

  const firstPayload = await firstResponse.json();
  const secondPayload = await secondResponse.json();
  assert.deepEqual(firstPayload, { chart: WEB_UI_FIXTURE_V1 });
  assert.deepEqual(secondPayload, firstPayload);
  assert.deepEqual(Object.keys(firstPayload), ['chart']);
  assert.equal(JSON.stringify(firstPayload).includes('cache'), false);
  assert.equal(harness.engineClient.calls.length, 1);
});

test('Chart validation rejects before the shared calculator or EngineClient runs', async () => {
  const harness = createRouteHarness();

  await assertProblemResponse(
    await postJson(harness.app, '/api/chart', {}),
    400,
    'INVALID_REQUEST'
  );

  assert.equal(harness.engineClient.calls.length, 0);
});

test('Chart route maps an incompatible fresh result to canonical 503 and retries later', async () => {
  let resultIndex = 0;
  const engineClient = createCountingEngine(() =>
    resultIndex++ === 0
      ? { ...structuredClone(WEB_UI_FIXTURE_V1), schemaVersion: 'wrong-schema' }
      : structuredClone(WEB_UI_FIXTURE_V1)
  );
  const harness = createRouteHarness({ engineClient });
  const request = createChartRequest();

  await assertProblemResponse(
    await postJson(harness.app, '/api/chart', { chart: request }),
    503,
    'CALCULATION_UNAVAILABLE'
  );
  const recoveredResponse = await postJson(harness.app, '/api/chart', {
    chart: request
  });

  assert.equal(recoveredResponse.status, 200);
  assert.deepEqual(await recoveredResponse.json(), { chart: WEB_UI_FIXTURE_V1 });
  assert.equal(harness.engineClient.calls.length, 2);
});

test('Chart rate limiting remains in force for cache hits', async () => {
  const harness = createRouteHarness();
  const request = { chart: createChartRequest() };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await postJson(harness.app, '/api/chart', request);
    assert.equal(response.status, 200);
  }

  await assertProblemResponse(
    await postJson(harness.app, '/api/chart', request),
    429,
    'RATE_LIMITED'
  );
  assert.equal(harness.engineClient.calls.length, 1);
});

test('Vault saves persist on every successful call while scientifically identical requests reuse the cache', async () => {
  const harness = createRouteHarness();
  const firstChart = createChartRequest({ locationLabel: 'First private label' });
  const secondChart = createChartRequest({ locationLabel: 'Second private label' });

  const firstResponse = await postJson(
    harness.app,
    '/api/vault/charts',
    createVaultSaveRequest(firstChart, 'First saved chart'),
    { userId: 'user-a' }
  );
  const secondResponse = await postJson(
    harness.app,
    '/api/vault/charts',
    createVaultSaveRequest(secondChart, 'Second saved chart'),
    { userId: 'user-a' }
  );

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(harness.engineClient.calls.length, 1);
  assert.equal(harness.savedCharts.length, 2);
  assert.deepEqual(
    harness.savedCharts[0].canonicalChartResult,
    WEB_UI_FIXTURE_V1
  );
  assert.deepEqual(
    harness.savedCharts[1].canonicalChartResult,
    WEB_UI_FIXTURE_V1
  );
  assert.equal(
    harness.savedCharts[0].normalizedChartRequest.birth.locationLabel,
    'First private label'
  );
  assert.equal(
    harness.savedCharts[1].normalizedChartRequest.birth.locationLabel,
    'Second private label'
  );
});

test('Vault authentication runs before a cache hit can be used', async () => {
  const harness = createRouteHarness();
  const chart = createChartRequest();

  assert.equal(
    (
      await postJson(harness.app, '/api/chart', { chart })
    ).status,
    200
  );
  await assertProblemResponse(
    await postJson(
      harness.app,
      '/api/vault/charts',
      createVaultSaveRequest(chart),
      { userId: null }
    ),
    401,
    'UNAUTHORIZED'
  );

  assert.equal(harness.engineClient.calls.length, 1);
  assert.equal(harness.savedCharts.length, 0);
});

test('browser-supplied ChartResult data is rejected before Vault calculation', async () => {
  const harness = createRouteHarness();
  const body = {
    ...createVaultSaveRequest(createChartRequest()),
    canonicalChartResult: structuredClone(WEB_UI_FIXTURE_V1)
  };

  await assertProblemResponse(
    await postJson(harness.app, '/api/vault/charts', body, { userId: 'user-a' }),
    400,
    'INVALID_REQUEST'
  );
  assert.equal(harness.engineClient.calls.length, 0);
  assert.equal(harness.savedCharts.length, 0);
});

test('the same process cache is reused across public Chart and authenticated Vault boundaries', async () => {
  const harness = createRouteHarness();
  const publicRequest = createChartRequest({ locationLabel: 'Public label' });
  const vaultRequest = createChartRequest({ locationLabel: 'Vault label' });

  assert.equal(
    (
      await postJson(harness.app, '/api/chart', { chart: publicRequest })
    ).status,
    200
  );
  const vaultResponse = await postJson(
    harness.app,
    '/api/vault/charts',
    createVaultSaveRequest(vaultRequest),
    { userId: 'user-b' }
  );

  assert.equal(vaultResponse.status, 201);
  assert.equal(harness.engineClient.calls.length, 1);
  assert.equal(harness.savedCharts.length, 1);
  assert.equal(harness.savedCharts[0].userId, 'user-b');
  assert.equal(
    harness.savedCharts[0].normalizedChartRequest.birth.locationLabel,
    'Vault label'
  );
  assert.deepEqual(
    harness.savedCharts[0].canonicalChartResult,
    WEB_UI_FIXTURE_V1
  );
});

test('HttpEngineClient and the shared calculator use the same structural ChartResult guard', async () => {
  assert.equal(isChartResult(WEB_UI_FIXTURE_V1), true);
  const invalidChart = {
    ...structuredClone(WEB_UI_FIXTURE_V1),
    bodies: 'invalid'
  };
  assert.equal(isChartResult(invalidChart), false);

  const client = new HttpEngineClient(async () =>
    new Response(JSON.stringify({ chart: invalidChart }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );

  await assert.rejects(
    client.calculateChart(createChartRequest()),
    (error) =>
      error instanceof Error &&
      error.message === 'Chart calculation request failed.'
  );
});
