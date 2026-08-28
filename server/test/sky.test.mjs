import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HttpEngineClient,
  MockEngineClient
} from '@natalnode/engine-client';
import {
  SKY_EVENTS_FIXTURE_V1,
  SKY_FIXTURE_AT_UTC,
  SKY_FIXTURE_END_UTC,
  SKY_FIXTURE_START_UTC,
  SKY_SNAPSHOT_FIXTURE_V1
} from '@natalnode/test-fixtures';
import { createApp } from '../dist/app/create-app.js';
import { parseExecutableServerConfig } from '../dist/executable/executable-server-config.js';
import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SKY_CALCULATION_UNAVAILABLE_RESPONSE = {
  type: 'about:blank',
  title: 'Service Unavailable',
  status: 503,
  code: 'CALCULATION_UNAVAILABLE'
};

function createDependencies(engineClient) {
  const calls = { authenticator: 0 };

  return {
    calls,
    dependencies: {
      publicWebOrigin: PUBLIC_WEB_ORIGIN,
      authenticator: {
        async authenticate() {
          calls.authenticator += 1;
          throw new Error('Public Sky must not invoke authentication.');
        }
      },
      idGenerator: {},
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
      secureTokenGenerator: {},
      tokenHasher: {},
      authenticationExpirationPolicy: {},
      emailMagicLinkDelivery: {},
      magicLinkUrlBuilder: {},
      sessionCookiePolicy: {}
    }
  };
}

function createAppHarness(engineClient = new MockEngineClient()) {
  const { calls, dependencies } = createDependencies(engineClient);
  return { app: createApp(dependencies), calls };
}

function createAppFetch(app, observedRequests = []) {
  return async (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set('Origin', PUBLIC_WEB_ORIGIN);
    observedRequests.push({ input, init });

    return app.request(input, { ...init, headers });
  };
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

function collectKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, keys);
    }
    return keys;
  }

  if (typeof value !== 'object' || value === null) {
    return keys;
  }

  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }

  return keys;
}

test('supported fixed snapshot crosses HttpEngineClient, BFF, and MockEngineClient unchanged', async () => {
  const { app, calls } = createAppHarness();
  const observedRequests = [];
  const client = new HttpEngineClient(createAppFetch(app, observedRequests));
  const request = { atUtc: SKY_FIXTURE_AT_UTC };

  const first = await client.getSkySnapshot(request);
  const second = await client.getSkySnapshot(request);

  assert.deepEqual(first, SKY_SNAPSHOT_FIXTURE_V1);
  assert.deepEqual(second, first);
  assert.notStrictEqual(second, first);
  assert.equal(first.calculationStatus, 'INCOMPLETE_RESEARCH');
  assert.equal(first.bodyPositions.length, 10);
  assert.equal(first.currentAspects.length, 3);
  assert.deepEqual(
    first.warnings.map(({ message }) => message),
    [
      'UI DEVELOPMENT ONLY',
      'NOT SCIENTIFIC EVIDENCE',
      'NOT PRODUCTION ASTRONOMY'
    ]
  );
  assert.equal(calls.authenticator, 0);
  assert.equal(observedRequests.length, 2);

  for (const observed of observedRequests) {
    assert.equal(observed.input, '/api/sky/snapshot');
    assert.equal(observed.init.method, 'POST');
    assert.equal(observed.init.credentials, 'same-origin');
    assert.equal(observed.init.cache, 'no-store');
    assert.deepEqual(JSON.parse(observed.init.body), request);
  }
});

test('MockEngineClient returns independent deterministic Sky fixture clones', async () => {
  const client = new MockEngineClient();
  const snapshotRequest = { atUtc: SKY_FIXTURE_AT_UTC };
  const eventsRequest = {
    startUtc: SKY_FIXTURE_START_UTC,
    endUtc: SKY_FIXTURE_END_UTC
  };
  const firstSnapshot = await client.getSkySnapshot(snapshotRequest);
  const firstEvents = await client.getSkyEvents(eventsRequest);

  firstSnapshot.bodyPositions[0].longitude = -1;
  firstSnapshot.currentAspects[0].orb = 999;
  firstSnapshot.warnings[0].message = 'mutated';
  firstEvents.events[0].exactAt = null;

  assert.deepEqual(
    await client.getSkySnapshot(snapshotRequest),
    SKY_SNAPSHOT_FIXTURE_V1
  );
  assert.deepEqual(
    await client.getSkyEvents(eventsRequest),
    SKY_EVENTS_FIXTURE_V1
  );
});

test('unsupported snapshot time is unavailable and never relabeled as fixture data', async () => {
  const { app } = createAppHarness();
  const unsupportedRequest = { atUtc: '2026-09-01T12:00:01.000Z' };
  const response = await postJson(app, '/api/sky/snapshot', unsupportedRequest);

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), SKY_CALCULATION_UNAVAILABLE_RESPONSE);

  const client = new HttpEngineClient(createAppFetch(app));
  await assert.rejects(
    client.getSkySnapshot(unsupportedRequest),
    (error) =>
      error instanceof Error && error.message === 'Sky calculation request failed.'
  );
});

test('exact fixture interval returns ordered events with event semantics distinct from current aspects', async () => {
  const { app, calls } = createAppHarness();
  const client = new HttpEngineClient(createAppFetch(app));
  const events = await client.getSkyEvents({
    startUtc: SKY_FIXTURE_START_UTC,
    endUtc: SKY_FIXTURE_END_UTC
  });
  const snapshot = await client.getSkySnapshot({ atUtc: SKY_FIXTURE_AT_UTC });

  assert.deepEqual(events, SKY_EVENTS_FIXTURE_V1);
  assert.deepEqual(
    events.events.map(({ eventType }) => eventType),
    ['INGRESS', 'STATION', 'EXACT_MAJOR_ASPECT', 'LUNATION']
  );

  const currentAspect = snapshot.currentAspects.find(
    ({ firstBodyId, secondBodyId }) =>
      firstBodyId === 'Sun' && secondBodyId === 'Saturn'
  );
  const exactAspectEvent = events.events.find(
    (event) =>
      event.eventType === 'EXACT_MAJOR_ASPECT' &&
      event.firstBodyId === 'Sun' &&
      event.secondBodyId === 'Saturn'
  );

  assert.ok(currentAspect);
  assert.equal('eventType' in currentAspect, false);
  assert.equal('exactAt' in currentAspect, false);
  assert.ok(exactAspectEvent);
  assert.equal(exactAspectEvent.eventType, 'EXACT_MAJOR_ASPECT');
  assert.equal(typeof exactAspectEvent.exactAt, 'string');
  assert.equal(calls.authenticator, 0);

  const serializedKeys = collectKeys({ snapshot, events });
  for (const prohibitedKey of [
    'salience',
    'interpretation',
    'birth',
    'birthDate',
    'birthTime',
    'location',
    'userId',
    'accountId',
    'chartId',
    'natal',
    'transit'
  ]) {
    assert.equal(serializedKeys.has(prohibitedKey), false, prohibitedKey);
  }
});

test('invalid Sky event intervals are rejected before EngineClient invocation', async () => {
  const mockClient = new MockEngineClient();
  let eventCalls = 0;
  const countingClient = {
    calculateChart: (request) => mockClient.calculateChart(request),
    getSkySnapshot: (request) => mockClient.getSkySnapshot(request),
    getSkyEvents(request) {
      eventCalls += 1;
      return mockClient.getSkyEvents(request);
    }
  };
  const { app } = createAppHarness(countingClient);

  for (const body of [
    {
      startUtc: SKY_FIXTURE_START_UTC,
      endUtc: SKY_FIXTURE_START_UTC
    },
    {
      startUtc: SKY_FIXTURE_END_UTC,
      endUtc: SKY_FIXTURE_START_UTC
    },
    {
      startUtc: '2026-09-01T00:00:00Z',
      endUtc: SKY_FIXTURE_END_UTC
    },
    {
      startUtc: SKY_FIXTURE_START_UTC,
      endUtc: SKY_FIXTURE_END_UTC,
      period: '7D'
    }
  ]) {
    const response = await postJson(app, '/api/sky/events', body);
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.code, 'INVALID_REQUEST');
    assert.equal('error' in payload, false);
  }

  assert.equal(eventCalls, 0);
});

test('snapshot request validation rejects extras and non-canonical or non-UTC timestamps', async () => {
  const { app } = createAppHarness();

  for (const body of [
    { atUtc: SKY_FIXTURE_AT_UTC, period: 'NOW' },
    { atUtc: '2026-09-01T12:00:00Z' },
    { atUtc: '2026-09-01T12:00:00.000+00:00' },
    { atUtc: 'not-a-date' }
  ]) {
    const response = await postJson(app, '/api/sky/snapshot', body);
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.code, 'INVALID_REQUEST');
    assert.equal('error' in payload, false);
  }
});

test('an interval outside the exact fixture range returns 503 without extrapolation', async () => {
  const { app } = createAppHarness();
  const response = await postJson(app, '/api/sky/events', {
    startUtc: SKY_FIXTURE_START_UTC,
    endUtc: '2026-09-09T00:00:00.000Z'
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), SKY_CALCULATION_UNAVAILABLE_RESPONSE);
});

test('EngineClient failures produce bounded generic 503 responses and no empty success data', async () => {
  const failingClient = {
    async calculateChart() {
      throw new Error('not used');
    },
    async getSkySnapshot() {
      throw new Error('private upstream snapshot detail');
    },
    async getSkyEvents() {
      throw new Error('private upstream events detail');
    }
  };
  const { app } = createAppHarness(failingClient);

  const responses = await Promise.all([
    postJson(app, '/api/sky/snapshot', { atUtc: SKY_FIXTURE_AT_UTC }),
    postJson(app, '/api/sky/events', {
      startUtc: SKY_FIXTURE_START_UTC,
      endUtc: SKY_FIXTURE_END_UTC
    })
  ]);

  for (const response of responses) {
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.deepEqual(body, SKY_CALCULATION_UNAVAILABLE_RESPONSE);
    assert.equal('bodyPositions' in body, false);
    assert.equal('events' in body, false);
    assert.doesNotMatch(JSON.stringify(body), /private upstream/u);
  }
});

test('HttpEngineClient rejects malformed Sky success payloads at its response boundary', async () => {
  const invalidSnapshot = structuredClone(SKY_SNAPSHOT_FIXTURE_V1);
  invalidSnapshot.bodyPositions[0].bodyId = 'Chiron';
  const invalidEvents = structuredClone(SKY_EVENTS_FIXTURE_V1);
  invalidEvents.metadata.astronomyConfigurationId = 'invented-production-id';
  const payloads = [invalidSnapshot, invalidEvents];
  const client = new HttpEngineClient(async () =>
    new Response(JSON.stringify(payloads.shift()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );

  await assert.rejects(
    client.getSkySnapshot({ atUtc: SKY_FIXTURE_AT_UTC }),
    /Sky calculation request failed\./u
  );
  await assert.rejects(
    client.getSkyEvents({
      startUtc: SKY_FIXTURE_START_UTC,
      endUtc: SKY_FIXTURE_END_UTC
    }),
    /Sky calculation request failed\./u
  );
});

test('Sky endpoints have explicit observability families', () => {
  assert.equal(
    classifyApiEndpointFamily('/api/sky/snapshot'),
    'sky.snapshot'
  );
  assert.equal(classifyApiEndpointFamily('/api/sky/events'), 'sky.events');
});

test('unsupported EngineClient modes fail configuration instead of falling back to fixtures', () => {
  const environment = {
    RESEND_API_KEY: 'test-resend-key',
    AUTH_EMAIL_FROM: 'auth@natalnode.test'
  };

  assert.equal(
    parseExecutableServerConfig({
      ...environment,
      ENGINE_CLIENT_MODE: 'development-mock'
    }).engineClientMode,
    'development-mock'
  );
  assert.throws(
    () => parseExecutableServerConfig({
      ...environment,
      ENGINE_CLIENT_MODE: 'production'
    }),
    /ENGINE_CLIENT_MODE/u
  );
});
