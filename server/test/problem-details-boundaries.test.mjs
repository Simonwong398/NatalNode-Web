import assert from 'node:assert/strict';
import test from 'node:test';

import { MockEngineClient } from '@natalnode/engine-client';
import {
  SKY_FIXTURE_AT_UTC,
  WEB_UI_FIXTURE_V1
} from '@natalnode/test-fixtures';
import { createApp } from '../dist/app/create-app.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';

const VALID_CHART_API_REQUEST = {
  chart: {
    birth: {
      localDate: '1990-01-01',
      localTime: '12:00',
      locationLabel: 'Test location',
      latitude: 0,
      longitude: 0,
      ianaTimeZone: 'UTC',
      resolvedUtcInstant: '1990-01-01T12:00:00.000Z',
      utcOffsetSeconds: 0,
      timezoneDatabaseVersion: 'test',
      timezoneResolutionMethod: 'test',
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'PLACIDUS'
  }
};

function createDependencies(engineClient) {
  return {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate() {
        throw new Error('authentication must not run in this test');
      }
    },
    accountErasure: {},
    accountDataExport: {},
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts: {},
      chartNotes: {}
    },
    engineClient,
    clock: {},
    idGenerator: {},
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };
}

function createAppHarness(engineClient = new MockEngineClient()) {
  return createApp(createDependencies(engineClient));
}

function postJson(app, path, body) {
  return app.request(path, {
    method: 'POST',
    headers: {
      Origin: PUBLIC_WEB_ORIGIN,
      'Content-Type': 'application/json'
    },
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
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.match(response.headers.get('X-Request-Id') ?? '', /^[0-9a-f-]{36}$/u);

  const payload = await response.json();
  const titleByStatus = {
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
  assert.deepEqual(payload, {
    type: 'about:blank',
    title: titleByStatus[status],
    status,
    code
  });
  assert.equal('error' in payload, false);
  assert.equal('message' in payload, false);
  assert.equal('instance' in payload, false);
  assert.equal('requestId' in payload, false);
  return payload;
}

test('Chart invalid requests use canonical Problem Details', async () => {
  const response = await postJson(createAppHarness(), '/api/chart', {});

  await assertProblemResponse(response, 400, 'INVALID_REQUEST');
});

test('Chart calculation failures remain provider-neutral 503 Problem Details', async () => {
  const privateFailure = new Error('provider secret must not be public');
  privateFailure.cause = new Error('private upstream cause');
  const failingClient = {
    async calculateChart() {
      throw privateFailure;
    },
    async getSkySnapshot() {
      throw privateFailure;
    },
    async getSkyEvents() {
      throw privateFailure;
    }
  };

  const response = await postJson(
    createAppHarness(failingClient),
    '/api/chart',
    VALID_CHART_API_REQUEST
  );

  await assertProblemResponse(response, 503, 'CALCULATION_UNAVAILABLE');
});

test('Sky errors use canonical Problem Details without changing success payloads', async () => {
  const app = createAppHarness();

  await assertProblemResponse(
    await postJson(app, '/api/sky/snapshot', {}),
    400,
    'INVALID_REQUEST'
  );

  const successResponse = await postJson(app, '/api/sky/snapshot', {
    atUtc: SKY_FIXTURE_AT_UTC
  });
  assert.equal(successResponse.status, 200);
  assert.equal(
    successResponse.headers.get('Content-Type'),
    'application/json'
  );
  const successPayload = await successResponse.json();
  assert.equal(successPayload.atUtc, SKY_FIXTURE_AT_UTC);
  assert.equal(successPayload.calculationStatus, 'INCOMPLETE_RESEARCH');
});

test('API-only not-found responses use Problem Details and non-API responses remain legacy', async () => {
  const app = createAppHarness();

  await assertProblemResponse(
    await app.request('/api/not-a-route'),
    404,
    'NOT_FOUND'
  );

  const nonApiResponse = await app.request('/not-a-route');
  assert.equal(nonApiResponse.status, 404);
  assert.deepEqual(await nonApiResponse.json(), {
    error: {
      code: 'NOT_FOUND',
      message: 'API route not found.'
    }
  });
  assert.equal(
    nonApiResponse.headers.get('Content-Type'),
    'application/json'
  );
});

test('shared API onError normalizes unknown failures and preserves non-API fallback scope', async () => {
  const app = createAppHarness();
  app.get('/api/test/unhandled', () => {
    const error = new Error('private error message');
    error.cause = new Error('private cause');
    throw error;
  });
  app.get('/website/test/unhandled', () => {
    throw new Error('private page error');
  });

  const response = await app.request('/api/test/unhandled');
  const payload = await assertProblemResponse(response, 500, 'INTERNAL_ERROR');
  assert.doesNotMatch(JSON.stringify(payload), /private error message|private cause/iu);

  const nonApiErrorResponse = await app.request('/website/test/unhandled');
  assert.equal(nonApiErrorResponse.status, 500);
  assert.equal(nonApiErrorResponse.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(await nonApiErrorResponse.json(), {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.'
    }
  });
});

test('default authentication and explicit Auth errors use canonical Problem Details', async () => {
  const unauthenticatedApp = createApp({
    ...createDependencies(new MockEngineClient()),
    authenticator: { async authenticate() { return null; } }
  });
  await assertProblemResponse(
    await postJson(unauthenticatedApp, '/api/feedback', {}),
    401,
    'UNAUTHORIZED'
  );

  const response = await postJson(
    createAppHarness(),
    '/api/auth/email/request',
    {}
  );

  await assertProblemResponse(response, 400, 'INVALID_REQUEST');
});

test('Chart success response remains the existing chart envelope', async () => {
  const response = await postJson(
    createAppHarness(),
    '/api/chart',
    VALID_CHART_API_REQUEST
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(await response.json(), { chart: WEB_UI_FIXTURE_V1 });
});
