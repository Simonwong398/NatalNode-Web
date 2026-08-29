import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MockEngineClient
} from '@natalnode/engine-client';
import {
  SKY_EVENTS_FIXTURE_V1,
  SKY_FIXTURE_END_UTC,
  SKY_FIXTURE_START_UTC,
  SKY_FIXTURE_AT_UTC,
  SKY_SNAPSHOT_FIXTURE_V1,
  WEB_UI_FIXTURE_V1
} from '@natalnode/test-fixtures';
import { createApp } from '../dist/app/create-app.js';
import { CachedChartCalculator } from '../dist/app/cache/cached-chart-calculator.js';
import {
  PUBLIC_DEVELOPMENT_API_HOSTNAME,
  PUBLIC_DEVELOPMENT_API_PORT,
  PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN,
  PUBLIC_DEVELOPMENT_PUBLIC_PORT
} from '../dist/executable/public-development-config.js';
import {
  createPublicDevelopmentApp,
  createPublicDevelopmentDependencies,
  PublicDevelopmentRequestAuthenticator
} from '../dist/executable/public-development-dependencies.js';

function createChartRequest() {
  return {
    birth: {
      localDate: '1990-01-01',
      localTime: '12:00',
      locationLabel: 'Public development fixture',
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

function postJson(app, path, body, origin = PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN) {
  return app.request(path, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json'
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
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.match(response.headers.get('X-Request-Id') ?? '', /^[0-9a-f-]{36}$/u);

  const payload = await response.json();
  assert.equal(payload.code, code);
  assert.equal(payload.status, status);
  assert.equal(payload.type, 'about:blank');
  assert.equal('message' in payload, false);
  assert.equal('requestId' in payload, false);
}

test('public-development composition uses code-owned defaults without full runtime configuration', async () => {
  const dependencies = createPublicDevelopmentDependencies({ NODE_ENV: 'test' });
  const app = createApp(dependencies);

  assert.equal(dependencies.publicWebOrigin, PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN);
  assert.equal(
    dependencies.authenticator instanceof PublicDevelopmentRequestAuthenticator,
    true
  );
  assert.equal(dependencies.engineClient instanceof MockEngineClient, true);
  assert.equal(dependencies.chartCalculator instanceof CachedChartCalculator, true);

  const response = await app.request('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    service: 'natalnode-web-bff',
    status: 'ok'
  });
});

test('public-development composition rejects explicit production mode', () => {
  assert.throws(
    () => createPublicDevelopmentApp({ NODE_ENV: 'production' }),
    /cannot start with NODE_ENV=production/u
  );
});

test('public-development session is always signed out, including with a stale cookie', async () => {
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });
  const response = await app.request('/api/auth/session', {
    headers: {
      Cookie: 'nn_session=stale-session-token'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { authenticated: false });
});

test('public-development logout clears a cookie without persistence', async () => {
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });
  const response = await app.request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Origin: PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN,
      Cookie: 'nn_session=stale-session-token'
    }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { signedOut: true });
  assert.match(response.headers.get('Set-Cookie') ?? '', /^nn_session=;/u);
});

test('public-development protected Vault routes fail before unavailable repositories', async () => {
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });
  const response = await app.request('/api/vault/charts');

  await assertProblem(response, 401, 'UNAUTHORIZED');
});

test('public-development email operations cannot create or complete authentication', async () => {
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });

  const requestResponse = await postJson(app, '/api/auth/email/request', {
    email: 'person@example.com'
  });
  await assertProblem(requestResponse, 500, 'INTERNAL_ERROR');

  const completeResponse = await postJson(app, '/api/auth/email/complete', {
    token: 'not-a-real-token'
  });
  await assertProblem(completeResponse, 401, 'UNAUTHORIZED');
});

test('public-development Chart uses MockEngine through the shared cache', async () => {
  const dependencies = createPublicDevelopmentDependencies({ NODE_ENV: 'test' });
  let engineCalls = 0;
  const originalCalculateChart = dependencies.engineClient.calculateChart.bind(
    dependencies.engineClient
  );

  dependencies.engineClient.calculateChart = async (request) => {
    engineCalls += 1;
    return originalCalculateChart(request);
  };

  const app = createApp(dependencies);
  const body = { chart: createChartRequest() };
  const firstResponse = await postJson(app, '/api/chart', body);
  const secondResponse = await postJson(app, '/api/chart', body);

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(firstResponse.headers.get('Cache-Control'), 'no-store');
  assert.match(firstResponse.headers.get('X-Request-Id') ?? '', /^[0-9a-f-]{36}$/u);

  const firstPayload = await firstResponse.json();
  firstPayload.chart.bodies[0].longitude = 999;
  const secondPayload = await secondResponse.json();

  assert.deepEqual(secondPayload, { chart: WEB_UI_FIXTURE_V1 });
  assert.equal(engineCalls, 1);
});

test('public-development Sky uses the existing snapshot and event fixtures', async () => {
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });

  const snapshotResponse = await postJson(app, '/api/sky/snapshot', {
    atUtc: SKY_FIXTURE_AT_UTC
  });
  const eventsResponse = await postJson(app, '/api/sky/events', {
    startUtc: SKY_FIXTURE_START_UTC,
    endUtc: SKY_FIXTURE_END_UTC
  });

  assert.equal(snapshotResponse.status, 200);
  assert.equal(eventsResponse.status, 200);
  assert.deepEqual(await snapshotResponse.json(), SKY_SNAPSHOT_FIXTURE_V1);
  assert.deepEqual(await eventsResponse.json(), SKY_EVENTS_FIXTURE_V1);
});

test('public-development preserves exact same-origin enforcement', async () => {
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });
  const response = await postJson(
    app,
    '/api/sky/snapshot',
    { atUtc: SKY_FIXTURE_AT_UTC },
    'http://127.0.0.1:4321'
  );

  await assertProblem(response, 403, 'FORBIDDEN');
});

test('public-development defaults keep public edge and API listeners distinct', () => {
  assert.equal(PUBLIC_DEVELOPMENT_PUBLIC_PORT, 4_321);
  assert.equal(PUBLIC_DEVELOPMENT_API_HOSTNAME, '127.0.0.1');
  assert.equal(PUBLIC_DEVELOPMENT_API_PORT, 4_322);
  assert.notEqual(PUBLIC_DEVELOPMENT_PUBLIC_PORT, PUBLIC_DEVELOPMENT_API_PORT);
});
