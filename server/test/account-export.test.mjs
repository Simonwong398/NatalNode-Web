import assert from 'node:assert/strict';
import test from 'node:test';

import { Hono } from 'hono';
import { createApp } from '../dist/app/create-app.js';
import {
  createAccountExportDeadline
} from '../dist/app/account-export-lifecycle.js';
import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';
import { registerAccountExportRoutes } from '../dist/app/routes/account-export.js';
import {
  P0_STAGING_RATE_LIMIT_POLICIES,
  selectP0StagingRateLimitPolicy,
  InMemoryP0StagingRateLimiter
} from '../dist/app/security/api-rate-limiting.js';
import { PostgresAccountDataExportRepository } from '../dist/persistence/postgres/postgres-account-data-export-repository.js';
import {
  ACCOUNT_EXPORT_RECENT_AUTH_MAX_AGE_SECONDS,
  isRecentAccountExportAuthentication
} from '../dist/account/account-export-policy.js';
import { UnsupportedAccountDataExportIdentityError } from '../dist/account/account-data-export.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const RECENT_SESSION = '2026-08-27T12:00:00.000Z';
const SERVER_NOW = '2026-08-27T12:09:59.999Z';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function defaultIdentity() {
  return {
    type: 'EMAIL_MAGIC_LINK',
    email: 'person@example.test',
    linkedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  };
}

function createChartItem() {
  return {
    chart: {
      displayName: 'Chart with "quotes", \\slashes\\, </script>, and 🚀',
      category: 'SELF',
      tags: ['stored', '研究'],
      favorite: true,
      normalizedChartRequest: {
        legacyRequest: true,
        birth: {
          localDate: '1990-01-01',
          locationLabel: 'Stored place <unsafe>'
        }
      },
      canonicalChartResult: {
        legacyResult: true,
        metadata: {
          configurationStatus: 'INCOMPLETE_RESEARCH',
          astronomyConfigurationId: null,
          provenanceEnvelopeId: null
        }
      },
      calculation: {
        engineVersion: 'stored-engine',
        chartSchemaVersion: 'stored-schema',
        astronomyConfigurationId: null,
        provenanceEnvelopeId: 'stored-provenance'
      },
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T01:00:00.000Z'
    },
    async listNotes() {
      return {
        items: [{
          content: 'Note with newline\nand unicode 星',
          createdAt: '2026-08-27T02:00:00.000Z',
          updatedAt: '2026-08-27T02:00:00.000Z'
        }],
        nextCursor: null
      };
    }
  };
}

function createSnapshot(options = {}) {
  const events = [];
  const identities = options.identities ?? [defaultIdentity()];
  const charts = options.charts ?? [];
  const feedback = options.feedback ?? [{
    category: 'SUGGESTION',
    message: 'Feedback with "quotes" and unicode 星',
    createdAt: '2026-08-27T03:00:00.000Z'
  }];
  const notificationData = options.notificationData ?? {
    channelPreferences: [{
      channel: 'WEB_PUSH',
      enabled: true,
      createdAt: '2026-08-27T04:00:00.000Z',
      updatedAt: '2026-08-27T04:00:00.000Z'
    }],
    categoryPreferences: [{
      category: 'ACCOUNT',
      enabled: false,
      createdAt: '2026-08-27T04:01:00.000Z',
      updatedAt: '2026-08-27T04:01:00.000Z'
    }],
    pushSubscriptions: [{
      subscriptionId: 'subscription-a',
      channel: 'WEB_PUSH',
      status: 'ACTIVE',
      createdAt: '2026-08-27T04:02:00.000Z',
      updatedAt: '2026-08-27T04:02:00.000Z',
      lastSuccessAt: null,
      invalidatedAt: null
    }]
  };
  let commits = 0;
  let rollbacks = 0;

  const snapshot = {
    account: {
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z'
    },
    async listIdentities(cursor) {
      events.push(`identities:${cursor ?? 'initial'}`);
      options.onIdentitiesStarted?.();

      if (options.identityGate !== undefined && cursor === undefined) {
        return options.identityGate.promise;
      }

      if (options.failIdentities) {
        throw new Error('private identity query failure');
      }

      return options.identityPages?.[cursor ?? 'initial'] ?? {
        items: identities,
        nextCursor: null
      };
    },
    async listCharts(cursor) {
      events.push(`charts:${cursor ?? 'initial'}`);
      options.onChartsStarted?.();

      if (options.chartGate !== undefined && cursor === undefined) {
        return options.chartGate.promise;
      }

      if (options.failCharts) {
        throw new Error('private chart query failure');
      }

      return options.chartPages?.[cursor ?? 'initial'] ?? {
        items: charts,
        nextCursor: null
      };
    },
    async listFeedback(cursor) {
      events.push(`feedback:${cursor ?? 'initial'}`);
      if (options.failFeedback) {
        throw new Error('private feedback query failure');
      }

      return options.feedbackPages?.[cursor ?? 'initial'] ?? {
        items: feedback,
        nextCursor: null
      };
    },
    async listNotifications() {
      events.push('notifications:initial');
      if (options.failNotifications) {
        throw new Error('private notification query failure');
      }

      return notificationData;
    },
    async commit() {
      commits += 1;
      events.push('commit');
      if (options.failCommit) {
        throw new Error('private commit failure');
      }
    },
    async rollback() {
      rollbacks += 1;
      events.push('rollback');
    }
  };

  return {
    snapshot,
    events,
    get commits() {
      return commits;
    },
    get rollbacks() {
      return rollbacks;
    }
  };
}

function createHarness({
  snapshotFactory = () => createSnapshot(),
  sessionCreatedAt = RECENT_SESSION,
  connectionTimeoutMs = 5_000
} = {}) {
  const openCalls = [];
  const snapshots = [];
  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        if (userId === null) {
          return null;
        }

        return {
          userId,
          sessionCreatedAt: request.headers.get('x-session-created-at') ?? sessionCreatedAt
        };
      }
    },
    accountDataExport: {
      async openSnapshot(userId, options) {
        openCalls.push({ userId, options });
        const created = snapshotFactory(userId, openCalls.length);

        if (created.outcome !== undefined) {
          return created;
        }

        snapshots.push(created);
        return { outcome: 'opened', snapshot: created.snapshot };
      }
    },
    postgresConnectionTimeoutMillis: connectionTimeoutMs,
    accountErasure: {
      async eraseAccount() {
        throw new Error('account deletion must not run');
      }
    },
    idGenerator: {
      generate() {
        return 'unused-id';
      }
    },
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
    engineClient: {
      async calculateChart() {
        throw new Error('Engine must not run during account export');
      }
    },
    clock: {
      now() {
        return SERVER_NOW;
      }
    },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {
      async sendMagicLink() {
        throw new Error('email delivery must not run during account export');
      }
    },
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies),
    dependencies,
    openCalls,
    snapshots
  };
}

async function postExport(
  app,
  {
    path = '/api/account/export',
    userId = 'user-a',
    edgeIp = '203.0.113.10',
    origin = PUBLIC_WEB_ORIGIN,
    body,
    contentType,
    sessionCreatedAt,
    headers: suppliedHeaders
  } = {}
) {
  const headers = suppliedHeaders ?? new Headers();

  if (origin !== undefined) {
    headers.set('Origin', origin);
  }
  headers.set('X-NatalNode-Client-IP', edgeIp);

  if (userId !== null) {
    headers.set('X-Test-User', userId);
  }
  if (sessionCreatedAt !== undefined) {
    headers.set('X-Session-Created-At', sessionCreatedAt);
  }
  if (contentType !== undefined) {
    headers.set('Content-Type', contentType);
  }

  const init = { method: 'POST', headers };
  if (body !== undefined) {
    init.body = body;
  }

  return app.request(path, init);
}

async function readStreamUntilFailure(response) {
  const reader = response.body.getReader();
  const chunks = [];
  let failure;

  while (true) {
    try {
      const result = await reader.read();
      if (result.done) {
        return { text: new TextDecoder().decode(Buffer.concat(chunks)), failure: null };
      }

      chunks.push(Buffer.from(result.value));
    } catch (error) {
      failure = error;
      break;
    }
  }

  return { text: Buffer.concat(chunks).toString('utf8'), failure };
}

test('export recent-auth policy is export-named and uses the exact 600-second boundary', () => {
  assert.equal(ACCOUNT_EXPORT_RECENT_AUTH_MAX_AGE_SECONDS, 600);
  assert.equal(
    isRecentAccountExportAuthentication(
      RECENT_SESSION,
      '2026-08-27T12:10:00.000Z'
    ),
    true
  );
  assert.equal(
    isRecentAccountExportAuthentication(
      RECENT_SESSION,
      '2026-08-27T12:10:00.001Z'
    ),
    false
  );
  assert.equal(
    isRecentAccountExportAuthentication(
      RECENT_SESSION,
      '2026-08-27T11:59:59.999Z'
    ),
    false
  );
  assert.equal(
    isRecentAccountExportAuthentication('not-a-timestamp', SERVER_NOW),
    false
  );
  assert.equal(
    classifyApiEndpointFamily('/api/account/export/prepare'),
    'account.export.prepare'
  );
});

test('account export prepare returns an advisory 204 without export resources', async () => {
  const harness = createHarness({
    snapshotFactory: () => {
      throw new Error('prepare must not open an export snapshot');
    }
  });

  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/account/export/prepare'),
    null
  );

  const response = await postExport(harness.app, {
    path: '/api/account/export/prepare'
  });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.has('content-disposition'), false);
  assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/u);
  assert.equal(harness.openCalls.length, 0);
  assert.equal(harness.snapshots.length, 0);

  const directHarness = createHarness({
    snapshotFactory: () => {
      throw new Error('prepare must not open an export snapshot');
    }
  });
  let capacityCalls = 0;
  const directApp = new Hono();
  registerAccountExportRoutes(
    directApp,
    directHarness.dependencies,
    new InMemoryP0StagingRateLimiter(),
    {
      capacity: {
        tryAcquire() {
          capacityCalls += 1;
          throw new Error('prepare must not acquire export capacity');
        }
      }
    }
  );

  const directResponse = await postExport(directApp, {
    path: '/api/account/export/prepare',
    edgeIp: '203.0.113.102'
  });
  assert.equal(directResponse.status, 204);
  assert.equal(capacityCalls, 0);
  assert.equal(directHarness.openCalls.length, 0);
});

test('account export prepare uses canonical route-owned Problem Details', async () => {
  const anonymousHarness = createHarness();
  const anonymousResponse = await postExport(anonymousHarness.app, {
    path: '/api/account/export/prepare',
    userId: null
  });
  assert.equal(anonymousResponse.status, 401);
  assert.equal(
    anonymousResponse.headers.get('content-type'),
    'application/problem+json; charset=utf-8'
  );
  assert.deepEqual(await anonymousResponse.json(), {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED',
    detail: 'Authentication is required.'
  });

  const staleHarness = createHarness({
    sessionCreatedAt: '2026-08-27T11:59:59.998Z'
  });
  const staleResponse = await postExport(staleHarness.app, {
    path: '/api/account/export/prepare'
  });
  assert.equal(staleResponse.status, 403);
  assert.deepEqual(await staleResponse.json(), {
    type: 'about:blank',
    title: 'Forbidden',
    status: 403,
    code: 'RECENT_AUTHENTICATION_REQUIRED',
    detail: 'Recent authentication is required.'
  });

  const invalidCases = [
    { path: '/api/account/export/prepare?format=json' },
    { path: '/api/account/export/prepare', body: 'unexpected body' },
    {
      path: '/api/account/export/prepare',
      headers: new Headers({ 'Content-Length': '1' })
    },
    {
      path: '/api/account/export/prepare',
      headers: new Headers({ 'Content-Length': '00' })
    },
    {
      path: '/api/account/export/prepare',
      headers: new Headers({ 'Transfer-Encoding': 'chunked' })
    }
  ];

  for (const [index, invalidCase] of invalidCases.entries()) {
    const invalidHarness = createHarness();
    const invalidResponse = await postExport(invalidHarness.app, {
      ...invalidCase,
      edgeIp: `203.0.113.${103 + index}`
    });
    assert.equal(invalidResponse.status, 400, invalidCase.path);
    assert.deepEqual(await invalidResponse.json(), {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'INVALID_REQUEST',
      detail: 'The request is invalid.'
    });
    assert.equal(invalidHarness.openCalls.length, 0);
  }

  const duplicateLengthHeaders = new Headers({ 'Content-Length': '0' });
  duplicateLengthHeaders.append('Content-Length', '0');
  const duplicateHarness = createHarness();
  const duplicateResponse = await postExport(duplicateHarness.app, {
    path: '/api/account/export/prepare',
    headers: duplicateLengthHeaders,
    edgeIp: '203.0.113.108'
  });
  assert.equal(duplicateResponse.status, 400);
  assert.equal(duplicateHarness.openCalls.length, 0);
});

test('account export prepare has its own edge bucket and does not consume transfer attempts', async () => {
  const prepareHarness = createHarness();

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const response = await postExport(prepareHarness.app, {
      path: '/api/account/export/prepare',
      edgeIp: '203.0.113.110'
    });
    assert.equal(response.status, 204);
  }

  const limitedPrepareResponse = await postExport(prepareHarness.app, {
    path: '/api/account/export/prepare',
    edgeIp: '203.0.113.110'
  });
  assert.equal(limitedPrepareResponse.status, 429);
  assert.equal(
    limitedPrepareResponse.headers.get('content-type'),
    'application/problem+json; charset=utf-8'
  );
  assert.deepEqual(await limitedPrepareResponse.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED',
    detail: 'Too many requests. Please try again later.'
  });
  assert.ok(Number(limitedPrepareResponse.headers.get('retry-after')) >= 1);

  const transferHarness = createHarness();
  const prepareResponse = await postExport(transferHarness.app, {
    path: '/api/account/export/prepare'
  });
  assert.equal(prepareResponse.status, 204);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await postExport(transferHarness.app, {
      body: 'not empty',
      userId: 'transfer-user',
      edgeIp: `203.0.113.${120 + attempt}`
    });
    assert.equal(response.status, 400);
  }

  const limitedTransferResponse = await postExport(transferHarness.app, {
    body: 'not empty',
    userId: 'transfer-user',
    edgeIp: '203.0.113.126'
  });
  assert.equal(limitedTransferResponse.status, 429);
  assert.deepEqual(await limitedTransferResponse.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED',
    detail: 'Too many requests. Please try again later.'
  });
  assert.equal(transferHarness.openCalls.length, 0);
});

test('account export streams the approved envelope with safe attachment headers and commits before closing', async () => {
  const chart = createChartItem();
  const harness = createHarness({
    snapshotFactory: () => createSnapshot({ charts: [chart] })
  });

  const response = await postExport(harness.app, { contentType: 'text/plain' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(
    response.headers.get('content-disposition'),
    'attachment; filename="natalnode-data-export-2026-08-27.json"'
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('content-length'), null);
  assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/u);
  assert.deepEqual(harness.openCalls[0].userId, 'user-a');
  assert.ok(harness.openCalls[0].options.timeoutMs > 0);

  const body = await response.text();
  const exportValue = JSON.parse(body);

  assert.equal(exportValue.exportSchemaVersion, '1.1');
  assert.equal(exportValue.exportedAt, SERVER_NOW);
  assert.deepEqual(exportValue.account.identities, [defaultIdentity()]);
  assert.equal(exportValue.account.createdAt, '2026-08-01T00:00:00.000Z');
  assert.equal(exportValue.charts.length, 1);
  assert.equal(exportValue.charts[0].displayName, chart.chart.displayName);
  assert.deepEqual(exportValue.charts[0].notes, [{
    content: 'Note with newline\nand unicode 星',
    createdAt: '2026-08-27T02:00:00.000Z',
    updatedAt: '2026-08-27T02:00:00.000Z'
  }]);
  assert.deepEqual(exportValue.feedback, [{
    category: 'SUGGESTION',
    message: 'Feedback with "quotes" and unicode 星',
    createdAt: '2026-08-27T03:00:00.000Z'
  }]);
  assert.deepEqual(exportValue.notifications, {
    channelPreferences: [{
      channel: 'WEB_PUSH',
      enabled: true,
      createdAt: '2026-08-27T04:00:00.000Z',
      updatedAt: '2026-08-27T04:00:00.000Z'
    }],
    categoryPreferences: [{
      category: 'ACCOUNT',
      enabled: false,
      createdAt: '2026-08-27T04:01:00.000Z',
      updatedAt: '2026-08-27T04:01:00.000Z'
    }],
    pushSubscriptions: [{
      subscriptionId: 'subscription-a',
      channel: 'WEB_PUSH',
      status: 'ACTIVE',
      createdAt: '2026-08-27T04:02:00.000Z',
      updatedAt: '2026-08-27T04:02:00.000Z',
      lastSuccessAt: null,
      invalidatedAt: null
    }]
  });
  assert.equal(body.includes('endpoint'), false);
  assert.equal(body.includes('p256dh'), false);
  assert.equal(body.includes('auth'), false);
  assert.equal(body.includes('user-a'), false);
  assert.equal(body.includes('chart-id'), false);

  const snapshot = harness.snapshots[0];
  assert.equal(snapshot.commits, 1);
  assert.equal(snapshot.rollbacks, 0);
  assert.equal(snapshot.events.at(-1), 'commit');
});

test('account export preserves an explicit empty notification state', async () => {
  const harness = createHarness({
    snapshotFactory: () => createSnapshot({
      notificationData: {
        channelPreferences: [],
        categoryPreferences: [],
        pushSubscriptions: []
      }
    })
  });

  const response = await postExport(harness.app, { edgeIp: '198.51.100.81' });
  assert.equal(response.status, 200);
  const exportValue = JSON.parse(await response.text());

  assert.deepEqual(exportValue.notifications, {
    channelPreferences: [],
    categoryPreferences: [],
    pushSubscriptions: []
  });
  assert.equal(Object.prototype.hasOwnProperty.call(exportValue.notifications, 'channel'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(exportValue.notifications, 'enabled'), false);
});

test('empty request framing, authentication, Origin, and recent-auth gates fail before checkout', async () => {
  const invalidCases = [
    { path: '/api/account/export?format=json', body: undefined },
    { path: '/api/account/export', body: 'unexpected body' },
    { path: '/api/account/export', headers: new Headers({ 'Content-Length': '1' }) },
    { path: '/api/account/export', headers: new Headers({ 'Content-Length': '00' }) },
    { path: '/api/account/export', headers: new Headers({ 'Transfer-Encoding': 'chunked' }) }
  ];

  for (const [index, invalidCase] of invalidCases.entries()) {
    const harness = createHarness();
    const response = await postExport(harness.app, {
      ...invalidCase,
      edgeIp: `198.51.100.${index + 1}`
    });
    assert.equal(response.status, 400, invalidCase.path);
    assert.deepEqual(await response.json(), {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'INVALID_REQUEST',
      detail: 'The request is invalid.'
    });
    assert.equal(harness.openCalls.length, 0);
  }

  const duplicateLengthHeaders = new Headers({ 'Content-Length': '0' });
  duplicateLengthHeaders.append('Content-Length', '0');
  const duplicateHarness = createHarness();
  const duplicateResponse = await postExport(duplicateHarness.app, {
    headers: duplicateLengthHeaders
  });
  assert.equal(duplicateResponse.status, 400);
  assert.equal(duplicateHarness.openCalls.length, 0);

  const originHarness = createHarness();
  const originResponse = await postExport(originHarness.app, {
    origin: 'https://evil.example'
  });
  assert.equal(originResponse.status, 403);
  assert.equal(originHarness.openCalls.length, 0);

  const anonymousHarness = createHarness();
  const anonymousResponse = await postExport(anonymousHarness.app, {
    userId: null
  });
  assert.equal(anonymousResponse.status, 401);
  assert.deepEqual(await anonymousResponse.json(), {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED',
    detail: 'Authentication is required.'
  });
  assert.equal(anonymousHarness.openCalls.length, 0);

  const staleHarness = createHarness({ sessionCreatedAt: '2026-08-27T11:59:59.998Z' });
  const staleResponse = await postExport(staleHarness.app);
  assert.equal(staleResponse.status, 403);
  assert.deepEqual(await staleResponse.json(), {
    type: 'about:blank',
    title: 'Forbidden',
    status: 403,
    code: 'RECENT_AUTHENTICATION_REQUIRED',
    detail: 'Recent authentication is required.'
  });
  assert.equal(staleHarness.openCalls.length, 0);
});

test('account export accepts a bodyless request without Content-Type and uses the account attempt policy', async () => {
  assert.deepEqual(
    selectP0StagingRateLimitPolicy('POST', '/api/account/export'),
    P0_STAGING_RATE_LIMIT_POLICIES.accountExportEdge
  );
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.accountExportAccount.limit, 5);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.accountExportAccount.windowMs, 600_000);

  const harness = createHarness();
  const response = await postExport(harness.app);
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(await response.text()).account.identities, [defaultIdentity()]);

  const missingTimeoutHarness = createHarness();
  delete missingTimeoutHarness.dependencies.postgresConnectionTimeoutMillis;
  const missingTimeoutResponse = await postExport(missingTimeoutHarness.app, {
    edgeIp: '203.0.113.15'
  });
  assert.equal(missingTimeoutResponse.status, 500);
  assert.deepEqual(await missingTimeoutResponse.json(), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR',
    detail: 'An unexpected server error occurred.'
  });
  assert.equal(missingTimeoutHarness.openCalls.length, 0);
});

test('unsupported identity representation and missing account fail before attachment headers', async () => {
  const unsupportedHarness = createHarness({
    snapshotFactory: () => {
      throw new UnsupportedAccountDataExportIdentityError('UNSUPPORTED_PROVIDER');
    }
  });
  const unsupportedResponse = await postExport(unsupportedHarness.app);
  assert.equal(unsupportedResponse.status, 500);
  assert.equal(unsupportedResponse.headers.has('content-disposition'), false);
  assert.deepEqual(await unsupportedResponse.json(), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR',
    detail: 'An unexpected server error occurred.'
  });

  const missingHarness = createHarness({
    snapshotFactory: () => ({ outcome: 'account-not-found' })
  });
  const missingResponse = await postExport(missingHarness.app, {
    edgeIp: '203.0.113.51'
  });
  assert.equal(missingResponse.status, 401);
  assert.equal(missingResponse.headers.has('content-disposition'), false);
  assert.deepEqual(await missingResponse.json(), {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED',
    detail: 'Authentication is required.'
  });
});

test('account export account attempt throttle runs after authentication and before body parsing', async () => {
  const harness = createHarness();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await postExport(harness.app, {
      body: 'not empty',
      userId: 'limited-user',
      edgeIp: `203.0.113.${attempt}`
    });
    assert.equal(response.status, 400);
  }

  const limitedResponse = await postExport(harness.app, {
    body: 'not empty',
    userId: 'limited-user',
    edgeIp: '203.0.113.6'
  });
  assert.equal(limitedResponse.status, 429);
  assert.ok(Number(limitedResponse.headers.get('retry-after')) >= 1);
  assert.deepEqual(await limitedResponse.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED',
    detail: 'Too many requests. Please try again later.'
  });
  assert.equal(harness.openCalls.length, 0);

  const otherUserResponse = await postExport(harness.app, {
    body: 'not empty',
    userId: 'other-user',
    edgeIp: '203.0.113.7'
  });
  assert.equal(otherUserResponse.status, 400);
});

test('active export capacity rejects a duplicate account before a second repository checkout', async () => {
  const identityGate = deferred();
  let identityStarted;
  const started = new Promise((resolve) => {
    identityStarted = resolve;
  });
  const pending = createSnapshot({
    identityGate,
    onIdentitiesStarted: identityStarted
  });
  const harness = createHarness({ snapshotFactory: () => pending });

  const firstResponsePromise = postExport(harness.app, {
    userId: 'same-user',
    edgeIp: '203.0.113.21'
  });
  await started;

  const secondResponse = await postExport(harness.app, {
    userId: 'same-user',
    edgeIp: '203.0.113.22'
  });
  assert.equal(secondResponse.status, 429);
  assert.deepEqual(await secondResponse.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED',
    detail: 'Too many requests. Please try again later.'
  });
  assert.equal(harness.openCalls.length, 1);

  identityGate.resolve({ items: [defaultIdentity()], nextCursor: null });
  const firstResponse = await firstResponsePromise;
  assert.equal(firstResponse.status, 200);
  await firstResponse.arrayBuffer();
  assert.equal(pending.commits, 1);
  assert.equal(pending.rollbacks, 0);
});

test('active export capacity is limited to two process-local transactions', async () => {
  const gates = new Map();
  const startedByUser = new Map();
  const harness = createHarness({
    snapshotFactory: (userId) => {
      const gate = deferred();
      gates.set(userId, gate);
      const started = deferred();
      startedByUser.set(userId, started);
      return createSnapshot({
        identityGate: gate,
        onIdentitiesStarted: () => started.resolve()
      });
    }
  });

  const firstPromise = postExport(harness.app, {
    userId: 'user-one',
    edgeIp: '203.0.113.31'
  });
  await new Promise((resolve) => setImmediate(resolve));
  await startedByUser.get('user-one').promise;

  const secondPromise = postExport(harness.app, {
    userId: 'user-two',
    edgeIp: '203.0.113.32'
  });
  await new Promise((resolve) => setImmediate(resolve));
  await startedByUser.get('user-two').promise;

  const thirdResponse = await postExport(harness.app, {
    userId: 'user-three',
    edgeIp: '203.0.113.33'
  });
  assert.equal(thirdResponse.status, 429);
  assert.deepEqual(await thirdResponse.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED',
    detail: 'Too many requests. Please try again later.'
  });
  assert.equal(harness.openCalls.length, 2);

  for (const userId of ['user-one', 'user-two']) {
    gates.get(userId).resolve({ items: [defaultIdentity()], nextCursor: null });
  }
  await (await firstPromise).arrayBuffer();
  await (await secondPromise).arrayBuffer();
});

test('stream failure truncates JSON, avoids a second error document, and rolls back', async () => {
  const harness = createHarness({
    snapshotFactory: () => createSnapshot({ failFeedback: true })
  });
  const response = await postExport(harness.app);
  assert.equal(response.status, 200);

  const result = await readStreamUntilFailure(response);
  assert.equal(result.failure, null);
  assert.notEqual(result.text.endsWith(']}'), true);
  assert.throws(() => JSON.parse(result.text));
  assert.doesNotMatch(result.text, /INTERNAL_ERROR|private feedback query failure/u);
  assert.equal(harness.snapshots[0].commits, 0);
  assert.equal(harness.snapshots[0].rollbacks, 1);
});

test('snapshot pagination is consumed in order and commit failure prevents final delimiters', async () => {
  const secondIdentity = {
    type: 'EMAIL_MAGIC_LINK',
    email: 'second@example.test',
    linkedAt: '2026-08-27T04:00:00.000Z',
    updatedAt: '2026-08-27T04:00:00.000Z'
  };
  const harness = createHarness({
    snapshotFactory: () => createSnapshot({
      identityPages: {
        initial: {
          items: [defaultIdentity()],
          nextCursor: 'identity-next'
        },
        'identity-next': {
          items: [secondIdentity],
          nextCursor: null
        }
      }
    })
  });

  const response = await postExport(harness.app);
  const body = await response.text();
  const exportValue = JSON.parse(body);
  assert.deepEqual(exportValue.account.identities, [defaultIdentity(), secondIdentity]);
  assert.deepEqual(harness.snapshots[0].events, [
    'identities:initial',
    'notifications:initial',
    'identities:identity-next',
    'charts:initial',
    'feedback:initial',
    'commit'
  ]);

  const failingHarness = createHarness({
    snapshotFactory: () => createSnapshot({ failCommit: true })
  });
  const failingResponse = await postExport(failingHarness.app, {
    edgeIp: '203.0.113.61'
  });
  const failedStream = await readStreamUntilFailure(failingResponse);
  assert.equal(failingResponse.status, 200);
  assert.equal(failedStream.failure, null);
  assert.notEqual(failedStream.text.endsWith(']}'), true);
  assert.throws(() => JSON.parse(failedStream.text));
  assert.equal(failingHarness.snapshots[0].commits, 1);
  assert.equal(failingHarness.snapshots[0].rollbacks, 0);
});

test('reader cancellation aborts production, rolls back once, and releases active capacity', async () => {
  const chartGate = deferred();
  let chartsStarted;
  const chartStarted = new Promise((resolve) => {
    chartsStarted = resolve;
  });
  const pending = createSnapshot({
    chartGate,
    onChartsStarted: chartsStarted
  });
  const harness = createHarness({ snapshotFactory: () => pending });
  const response = await postExport(harness.app, { userId: 'cancel-user' });
  const reader = response.body.getReader();
  const firstChunk = await reader.read();
  assert.equal(firstChunk.done, false);

  const secondChunk = await reader.read();
  assert.equal(secondChunk.done, false);

  const thirdChunk = await reader.read();
  assert.equal(thirdChunk.done, false);

  const pendingRead = reader.read().catch(() => undefined);
  await chartStarted;
  await reader.cancel();
  assert.equal(pending.rollbacks, 1);
  assert.equal(pending.commits, 0);

  chartGate.resolve({ items: [], nextCursor: null });
  await pendingRead;

  const retry = await postExport(harness.app, {
    userId: 'cancel-user',
    edgeIp: '203.0.113.41'
  });
  assert.equal(retry.status, 200);
  await retry.arrayBuffer();
});

test('monotonic lifecycle deadline aborts and late PostgreSQL checkout is discarded', async () => {
  const deadline = createAccountExportDeadline({ deadlineMs: 5 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(deadline.signal.aborted, true);
  assert.equal(deadline.deadlineExceeded(), true);
  assert.equal(deadline.remainingMs(), 0);
  deadline.dispose();

  let resolveClient;
  let beginCalls = 0;
  const client = {
    async query() {
      beginCalls += 1;
      return { rows: [] };
    },
    releaseCalls: [],
    release(error) {
      this.releaseCalls.push(error);
    }
  };
  const pool = {
    connect() {
      return new Promise((resolve) => {
        resolveClient = resolve;
      });
    }
  };
  const repository = new PostgresAccountDataExportRepository(pool);
  const controller = new AbortController();
  const opening = repository.openSnapshot('user-a', { signal: controller.signal });
  controller.abort();

  await assert.rejects(opening);
  resolveClient(client);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(client.releaseCalls, [true]);
  assert.equal(beginCalls, 0);
});

test('server dependency wiring keeps the export repository explicit and does not call Engine', async () => {
  const harness = createHarness();
  const response = await postExport(harness.app);
  assert.equal(response.status, 200);
  await response.arrayBuffer();
  assert.equal(harness.openCalls[0].userId, 'user-a');
});

test('focused route registration can use a short test deadline without changing production defaults', async () => {
  const harness = createHarness({
    snapshotFactory: () => createSnapshot({ identityGate: deferred() })
  });
  const app = new Hono();
  const limiter = new InMemoryP0StagingRateLimiter();
  registerAccountExportRoutes(app, harness.dependencies, limiter, {
    lifecycleDeadlineMs: 5
  });

  const response = await postExport(app, {
    edgeIp: '198.51.100.90'
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR',
    detail: 'An unexpected server error occurred.'
  });
});
