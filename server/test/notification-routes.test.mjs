import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../dist/app/index.js';
import {
  createActivePushSubscription,
  createNotificationCategoryPreference,
  createNotificationChannelPreference,
  createPushSubscriptionRecord,
  NotificationAccountService
} from '../dist/notification-platform/index.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.example';
const API_ORIGIN = 'http://localhost';
const AUTH_SESSION_CREATED_AT = '2026-08-29T00:00:00.000Z';

function createClock() {
  const timestamps = [
    '2026-08-29T01:00:00.000Z',
    '2026-08-29T01:01:00.000Z',
    '2026-08-29T01:02:00.000Z',
    '2026-08-29T01:03:00.000Z',
    '2026-08-29T01:04:00.000Z',
    '2026-08-29T01:05:00.000Z',
    '2026-08-29T01:06:00.000Z',
    '2026-08-29T01:07:00.000Z',
    '2026-08-29T01:08:00.000Z',
    '2026-08-29T01:09:00.000Z'
  ];
  let index = 0;

  return {
    now() {
      const timestamp = timestamps[index] ?? timestamps.at(-1);
      index += 1;
      return timestamp;
    }
  };
}

function createIdGenerator() {
  let index = 0;

  return {
    generate() {
      index += 1;
      return `server-subscription-${index}`;
    }
  };
}

class InMemoryNotificationPreferenceRepository {
  channelPreferences = new Map();
  categoryPreferences = new Map();

  async findChannelPreference(ownerId) {
    return this.channelPreferences.get(ownerId) ?? null;
  }

  async findCategoryPreference(ownerId, category) {
    return this.categoryPreferences.get(`${ownerId}:${category}`) ?? null;
  }

  async setChannelPreference(preference) {
    this.channelPreferences.set(preference.ownerId, preference);
    return preference;
  }

  async setCategoryPreference(preference) {
    this.categoryPreferences.set(
      `${preference.ownerId}:${preference.category}`,
      preference
    );
    return preference;
  }
}

class InMemoryPushSubscriptionRepository {
  subscriptions = new Map();

  async register(registration) {
    const candidate = createActivePushSubscription(registration);
    const existing = [...this.subscriptions.values()].find(
      (subscription) =>
        subscription.status === 'ACTIVE' &&
        subscription.endpointHash === candidate.endpointHash
    );

    if (existing !== undefined) {
      if (existing.ownerId !== candidate.ownerId) {
        return { outcome: 'OWNERSHIP_CONFLICT' };
      }

      const updated = createPushSubscriptionRecord({
        subscriptionId: existing.subscriptionId,
        ownerId: existing.ownerId,
        endpoint: candidate.endpoint,
        endpointHash: candidate.endpointHash,
        p256dh: candidate.p256dh,
        auth: candidate.auth,
        createdAt: existing.createdAt,
        updatedAt: candidate.updatedAt,
        lastSuccessAt: existing.lastSuccessAt,
        status: existing.status,
        invalidatedAt: existing.invalidatedAt
      });
      this.subscriptions.set(updated.subscriptionId, updated);
      return {
        outcome: 'UPDATED_EXISTING_OWNER',
        subscription: updated
      };
    }

    this.subscriptions.set(candidate.subscriptionId, candidate);
    return { outcome: 'CREATED', subscription: candidate };
  }

  async listActiveForOwner(ownerId) {
    return [...this.subscriptions.values()]
      .filter(
        (subscription) =>
          subscription.ownerId === ownerId && subscription.status === 'ACTIVE'
      )
      .sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.subscriptionId.localeCompare(right.subscriptionId)
      );
  }

  async removeForOwner(ownerId, subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);

    if (subscription?.ownerId !== ownerId) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);
    return true;
  }

  async invalidate(subscriptionId, invalidatedAt) {
    const subscription = this.subscriptions.get(subscriptionId);

    if (subscription === undefined || subscription.status !== 'ACTIVE') {
      return false;
    }

    const invalidated = createPushSubscriptionRecord({
      ...subscription,
      status: 'INVALIDATED',
      updatedAt: invalidatedAt,
      invalidatedAt
    });
    this.subscriptions.set(subscriptionId, invalidated);
    return true;
  }

  activeForOwner(ownerId) {
    return [...this.subscriptions.values()].filter(
      (subscription) =>
        subscription.ownerId === ownerId && subscription.status === 'ACTIVE'
    );
  }
}

function createAuthenticator() {
  return {
    async authenticate(request) {
      const userId = request.headers.get('x-test-user');

      return userId === null
        ? null
        : { userId, sessionCreatedAt: AUTH_SESSION_CREATED_AT };
    }
  };
}

function createDependencies({ service } = {}) {
  const preferences = new InMemoryNotificationPreferenceRepository();
  const subscriptions = new InMemoryPushSubscriptionRepository();
  const clock = createClock();
  const idGenerator = createIdGenerator();
  const notificationAccountService =
    service ??
    new NotificationAccountService({
      notificationPreferences: preferences,
      pushSubscriptions: subscriptions,
      idGenerator,
      clock
    });

  return {
    dependencies: {
      publicWebOrigin: PUBLIC_WEB_ORIGIN,
      authenticator: createAuthenticator(),
      notificationAccountService
    },
    preferences,
    subscriptions
  };
}

function request(app, method, pathname, options = {}) {
  const headers = new Headers(options.headers);

  if (options.user !== undefined) {
    headers.set('x-test-user', options.user);
  }

  if (options.origin !== undefined) {
    headers.set('origin', options.origin);
  }

  let body;
  if (options.body !== undefined) {
    body = typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body);
    headers.set('content-type', 'application/json');
  }

  return app.fetch(
    new Request(`${API_ORIGIN}${pathname}`, {
      method,
      headers,
      body
    })
  );
}

function sameOriginRequest(app, method, pathname, user, body) {
  return request(app, method, pathname, {
    user,
    origin: PUBLIC_WEB_ORIGIN,
    body
  });
}

async function responseJson(response) {
  const text = await response.text();
  assert.notEqual(text, '', `expected JSON response, received ${response.status}`);
  return JSON.parse(text);
}

async function assertProblem(response, status, code) {
  assert.equal(response.status, status);
  const problem = await responseJson(response);
  assert.deepEqual(problem, {
    type: 'about:blank',
    title:
      status === 409
        ? 'Conflict'
        : status === 503
          ? 'Service Unavailable'
          : status === 400
            ? 'Bad Request'
      : status === 401
              ? 'Unauthorized'
              : 'Forbidden',
    status,
    code,
    ...(code === 'INVALID_REQUEST'
      ? { detail: 'The request is invalid.' }
      : code === 'PUSH_SUBSCRIPTION_UNAVAILABLE'
      ? { detail: 'This browser notification subscription is unavailable for this account.' }
      : code === 'NOTIFICATION_UNAVAILABLE'
        ? { detail: 'Notification settings are currently unavailable.' }
        : {})
  });
  return problem;
}

function assertResponseDoesNotContain(responseBody, secrets) {
  const serialized = JSON.stringify(responseBody);

  for (const secret of secrets) {
    assert.equal(serialized.includes(secret), false, secret);
  }
}

const ENDPOINT_A = 'https://push.example.test/subscription-a';
const ENDPOINT_B = 'https://push.example.test/subscription-b';
const KEY_A_1 = 'p256dh-key-A-1_';
const AUTH_A_1 = 'auth-key-A-1_';
const KEY_A_2 = 'p256dh-key-A-2_';
const AUTH_A_2 = 'auth-key-A-2_';
const KEY_B = 'p256dh-key-B-1_';
const AUTH_B = 'auth-key-B-1_';

function registrationBody(endpoint, p256dh, auth) {
  return { endpoint, keys: { p256dh, auth } };
}

test('notification routes require authentication before reading request bodies', async () => {
  const { dependencies } = createDependencies();
  const app = createApp(dependencies);
  const unauthenticatedRegistration = await request(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    {
      origin: PUBLIC_WEB_ORIGIN,
      body: registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1)
    }
  );
  const registrationProblem = await assertProblem(
    unauthenticatedRegistration,
    401,
    'UNAUTHORIZED'
  );
  assertResponseDoesNotContain(registrationProblem, [
    ENDPOINT_A,
    KEY_A_1,
    AUTH_A_1
  ]);

  for (const [method, pathname, bodyValue] of [
    ['GET', '/api/account/notifications'],
    [
      'PUT',
      '/api/account/notifications/preferences/channel',
      { channel: 'WEB_PUSH', enabled: true }
    ],
    [
      'PUT',
      '/api/account/notifications/preferences/category',
      { category: 'ACCOUNT', enabled: true }
    ],
    [
      'DELETE',
      '/api/account/notifications/web-push/subscriptions/server-subscription-1'
    ]
  ]) {
    const response = await request(app, method, pathname, {
      origin: method === 'GET' ? undefined : PUBLIC_WEB_ORIGIN,
      body: bodyValue
    });
    await assertProblem(response, 401, 'UNAUTHORIZED');
  }
});

test('notification mutations enforce the existing exact same-origin policy', async () => {
  const { dependencies, subscriptions, preferences } = createDependencies();
  const app = createApp(dependencies);
  const beforeSubscriptions = subscriptions.activeForOwner('user-a');

  for (const [method, pathname, body] of [
    [
      'PUT',
      '/api/account/notifications/preferences/channel',
      { channel: 'WEB_PUSH', enabled: true }
    ],
    [
      'PUT',
      '/api/account/notifications/preferences/category',
      { category: 'ACCOUNT', enabled: true }
    ],
    [
      'POST',
      '/api/account/notifications/web-push/subscriptions',
      registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1)
    ],
    [
      'DELETE',
      '/api/account/notifications/web-push/subscriptions/server-subscription-1'
    ]
  ]) {
    const response = await request(app, method, pathname, {
      user: 'user-a',
      origin: 'https://evil.example',
      body
    });
    await assertProblem(response, 403, 'FORBIDDEN');
  }

  assert.deepEqual(subscriptions.activeForOwner('user-a'), beforeSubscriptions);
  assert.equal(preferences.channelPreferences.size, 0);
  assert.equal(preferences.categoryPreferences.size, 0);
});

test('safe notification state is owner scoped and preserves missing preferences', async () => {
  const { dependencies, subscriptions } = createDependencies();
  const app = createApp(dependencies);

  let response = await sameOriginRequest(
    app,
    'PUT',
    '/api/account/notifications/preferences/channel',
    'user-a',
    { channel: 'WEB_PUSH', enabled: true }
  );
  assert.equal(response.status, 200);

  response = await sameOriginRequest(
    app,
    'PUT',
    '/api/account/notifications/preferences/category',
    'user-a',
    { category: 'ACCOUNT', enabled: false }
  );
  assert.equal(response.status, 200);

  response = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-a',
    registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1)
  );
  const registrationA = await responseJson(response);
  assert.equal(response.status, 200);

  response = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-b',
    registrationBody(ENDPOINT_B, KEY_B, AUTH_B)
  );
  assert.equal(response.status, 200);
  const registrationB = await responseJson(response);

  response = await request(app, 'GET', '/api/account/notifications', {
    user: 'user-a'
  });
  const stateA = await responseJson(response);
  assert.deepEqual(stateA, {
    channelPreferences: { WEB_PUSH: true },
    categoryPreferences: {
      ACCOUNT: false,
      SYSTEM: null,
      ASTROLOGY_ALERT: null
    },
    pushSubscriptions: [registrationA.subscription]
  });
  assert.equal(stateA.pushSubscriptions.some(
    (subscription) => subscription.subscriptionId === registrationB.subscription.subscriptionId
  ), false);
  assertResponseDoesNotContain(stateA, [
    ENDPOINT_A,
    ENDPOINT_B,
    KEY_A_1,
    AUTH_A_1,
    KEY_B,
    AUTH_B,
    'endpointHash'
  ]);

  response = await request(app, 'GET', '/api/account/notifications', {
    user: 'user-c'
  });
  assert.deepEqual(await responseJson(response), {
    channelPreferences: { WEB_PUSH: null },
    categoryPreferences: {
      ACCOUNT: null,
      SYSTEM: null,
      ASTROLOGY_ALERT: null
    },
    pushSubscriptions: []
  });

  assert.equal(subscriptions.activeForOwner('user-a').length, 1);
});

test('preferences accept explicit bounded values and reject client-owned or unknown fields', async () => {
  const { dependencies } = createDependencies();
  const app = createApp(dependencies);
  const channelPath = '/api/account/notifications/preferences/channel';
  const categoryPath = '/api/account/notifications/preferences/category';

  for (const enabled of [true, false]) {
    const response = await sameOriginRequest(
      app,
      'PUT',
      channelPath,
      'user-a',
      { channel: 'WEB_PUSH', enabled }
    );
    assert.equal(response.status, 200);
    assert.deepEqual((await responseJson(response)).preference, {
      channel: 'WEB_PUSH',
      enabled,
      createdAt: enabled
        ? '2026-08-29T01:00:00.000Z'
        : '2026-08-29T01:01:00.000Z',
      updatedAt: enabled
        ? '2026-08-29T01:00:00.000Z'
        : '2026-08-29T01:01:00.000Z'
    });
  }

  for (const category of ['ACCOUNT', 'SYSTEM', 'ASTROLOGY_ALERT']) {
    const response = await sameOriginRequest(
      app,
      'PUT',
      categoryPath,
      'user-a',
      { category, enabled: true }
    );
    assert.equal(response.status, 200);
  }

  for (const body of [
    { channel: 'EMAIL', enabled: true },
    { channel: 'WEB_PUSH', enabled: true, ownerId: 'user-b' },
    { category: 'DEVELOPER', enabled: true },
    { category: 'ACCOUNT', enabled: 'true' }
  ]) {
    const response = await sameOriginRequest(
      app,
      'PUT',
      body.category === undefined ? channelPath : categoryPath,
      'user-a',
      body
    );
    await assertProblem(response, 400, 'INVALID_REQUEST');
  }
});

test('registration is server-owned, idempotent for one owner, and conflict-safe across owners', async () => {
  const { dependencies, subscriptions } = createDependencies();
  const app = createApp(dependencies);

  const firstResponse = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-a',
    registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1)
  );
  assert.equal(firstResponse.status, 200);
  const first = await responseJson(firstResponse);
  assert.deepEqual(first.subscription, {
    subscriptionId: 'server-subscription-1',
    channel: 'WEB_PUSH',
    status: 'ACTIVE',
    createdAt: '2026-08-29T01:00:00.000Z',
    updatedAt: '2026-08-29T01:00:00.000Z',
    lastSuccessAt: null,
    invalidatedAt: null
  });
  assertResponseDoesNotContain(first, [ENDPOINT_A, KEY_A_1, AUTH_A_1, 'endpointHash']);
  assert.deepEqual(subscriptions.activeForOwner('user-a')[0], {
    subscriptionId: 'server-subscription-1',
    ownerId: 'user-a',
    endpoint: ENDPOINT_A,
    endpointHash: subscriptions.activeForOwner('user-a')[0].endpointHash,
    p256dh: KEY_A_1,
    auth: AUTH_A_1,
    createdAt: '2026-08-29T01:00:00.000Z',
    updatedAt: '2026-08-29T01:00:00.000Z',
    lastSuccessAt: null,
    status: 'ACTIVE',
    invalidatedAt: null
  });

  const updateResponse = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-a',
    registrationBody(ENDPOINT_A, KEY_A_2, AUTH_A_2)
  );
  assert.equal(updateResponse.status, 200);
  const update = await responseJson(updateResponse);
  assert.equal(update.subscription.subscriptionId, first.subscription.subscriptionId);
  assert.equal(subscriptions.activeForOwner('user-a').length, 1);
  assert.equal(subscriptions.activeForOwner('user-a')[0].p256dh, KEY_A_2);
  assert.equal(subscriptions.activeForOwner('user-a')[0].auth, AUTH_A_2);
  assert.equal(subscriptions.activeForOwner('user-a')[0].createdAt, first.subscription.createdAt);
  assert.equal(subscriptions.activeForOwner('user-a')[0].updatedAt, '2026-08-29T01:01:00.000Z');
  assertResponseDoesNotContain(update, [ENDPOINT_A, KEY_A_2, AUTH_A_2, 'endpointHash']);

  const conflictResponse = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-b',
    registrationBody(ENDPOINT_A, KEY_B, AUTH_B)
  );
  const conflict = await assertProblem(
    conflictResponse,
    409,
    'PUSH_SUBSCRIPTION_UNAVAILABLE'
  );
  assertResponseDoesNotContain(conflict, [
    'user-a',
    'server-subscription-1',
    ENDPOINT_A,
    KEY_B,
    AUTH_B,
    'endpointHash'
  ]);
  assert.equal(subscriptions.activeForOwner('user-b').length, 0);
  assert.equal(subscriptions.activeForOwner('user-a').length, 1);
});

test('subscription removal is owner scoped, idempotent, and separate from preferences', async () => {
  const { dependencies } = createDependencies();
  const app = createApp(dependencies);

  let response = await sameOriginRequest(
    app,
    'PUT',
    '/api/account/notifications/preferences/channel',
    'user-a',
    { channel: 'WEB_PUSH', enabled: true }
  );
  assert.equal(response.status, 200);

  response = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-a',
    registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1)
  );
  const registration = await responseJson(response);
  const subscriptionId = registration.subscription.subscriptionId;

  response = await sameOriginRequest(
    app,
    'DELETE',
    `/api/account/notifications/web-push/subscriptions/${subscriptionId}`,
    'user-b'
  );
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');

  response = await request(app, 'GET', '/api/account/notifications', {
    user: 'user-a'
  });
  let state = await responseJson(response);
  assert.equal(state.pushSubscriptions.length, 1);
  assert.equal(state.channelPreferences.WEB_PUSH, true);

  for (const path of [
    `/api/account/notifications/web-push/subscriptions/${subscriptionId}`,
    '/api/account/notifications/web-push/subscriptions/server-subscription-unknown',
    `/api/account/notifications/web-push/subscriptions/${subscriptionId}`
  ]) {
    response = await sameOriginRequest(app, 'DELETE', path, 'user-a');
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
  }

  response = await request(app, 'GET', '/api/account/notifications', {
    user: 'user-a'
  });
  state = await responseJson(response);
  assert.deepEqual(state.pushSubscriptions, []);
  assert.equal(state.channelPreferences.WEB_PUSH, true);
});

test('notification service absence fails closed without fake state', async () => {
  const { dependencies } = createDependencies();
  delete dependencies.notificationAccountService;
  const app = createApp(dependencies);

  const getResponse = await request(app, 'GET', '/api/account/notifications', {
    user: 'user-a'
  });
  await assertProblem(getResponse, 503, 'NOTIFICATION_UNAVAILABLE');

  const postResponse = await sameOriginRequest(
    app,
    'POST',
    '/api/account/notifications/web-push/subscriptions',
    'user-a',
    registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1)
  );
  const problem = await assertProblem(postResponse, 503, 'NOTIFICATION_UNAVAILABLE');
  assertResponseDoesNotContain(problem, [ENDPOINT_A, KEY_A_1, AUTH_A_1]);
});

test('registration validation rejects non-HTTPS, invalid credentials, unknown fields, and malformed JSON', async () => {
  const { dependencies } = createDependencies();
  const app = createApp(dependencies);
  const path = '/api/account/notifications/web-push/subscriptions';

  for (const body of [
    registrationBody('http://push.example.test/insecure', KEY_A_1, AUTH_A_1),
    registrationBody(ENDPOINT_A, 'not-base64=', AUTH_A_1),
    {
      ...registrationBody(ENDPOINT_A, KEY_A_1, AUTH_A_1),
      ownerId: 'user-b'
    }
  ]) {
    const response = await sameOriginRequest(app, 'POST', path, 'user-a', body);
    const problem = await assertProblem(response, 400, 'INVALID_REQUEST');
    assertResponseDoesNotContain(problem, ['user-b']);
  }

  const malformed = await request(app, 'POST', path, {
    user: 'user-a',
    origin: PUBLIC_WEB_ORIGIN,
    body: '{"endpoint":'
  });
  await assertProblem(malformed, 400, 'INVALID_REQUEST');
});
