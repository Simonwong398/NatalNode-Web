import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';

import { registerAccountRoutes } from '../dist/app/routes/account.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const ACCOUNT_CREATED_AT = '2026-08-20T12:00:00.000Z';

function createHarness() {
  const users = new Map([
    ['user-a', {
      userId: 'user-a',
      createdAt: ACCOUNT_CREATED_AT,
      updatedAt: '2026-08-21T12:00:00.000Z'
    }],
    ['user-b', {
      userId: 'user-b',
      createdAt: '2026-08-22T12:00:00.000Z',
      updatedAt: '2026-08-23T12:00:00.000Z'
    }]
  ]);
  const identities = new Map([
    ['user-a', [
      {
        identityId: 'identity-a-email',
        userId: 'user-a',
        provider: 'EMAIL_MAGIC_LINK',
        providerSubject: 'owner-a@example.test',
        createdAt: ACCOUNT_CREATED_AT,
        updatedAt: ACCOUNT_CREATED_AT
      },
      {
        identityId: 'identity-a-google',
        userId: 'user-a',
        provider: 'GOOGLE',
        providerSubject: 'google-subject-a',
        createdAt: ACCOUNT_CREATED_AT,
        updatedAt: ACCOUNT_CREATED_AT
      }
    ]],
    ['user-b', [{
      identityId: 'identity-b-google',
      userId: 'user-b',
      provider: 'GOOGLE',
      providerSubject: 'google-subject-b',
      createdAt: ACCOUNT_CREATED_AT,
      updatedAt: ACCOUNT_CREATED_AT
    }]]
  ]);
  const vaultCounts = new Map([
    ['user-a', 2],
    ['user-b', 1]
  ]);
  const calls = {
    users: [],
    identities: [],
    vaultCounts: []
  };

  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');

        return userId === null
          ? null
          : { userId, sessionCreatedAt: ACCOUNT_CREATED_AT };
      }
    },
    persistence: {
      users: {
        async findById(userId) {
          calls.users.push(userId);
          return users.get(userId) ?? null;
        }
      },
      authIdentities: {
        async listForUser(userId) {
          calls.identities.push(userId);
          return identities.get(userId) ?? [];
        }
      },
      vaultCharts: {
        async countForUser(userId) {
          calls.vaultCounts.push(userId);
          return vaultCounts.get(userId) ?? 0;
        }
      }
    }
  };
  const app = new Hono();
  registerAccountRoutes(app, dependencies);

  return { app, calls };
}

function getAccount(app, userId, path = '/api/account') {
  const headers = userId === undefined ? {} : { 'x-test-user': userId };

  return app.request(`${PUBLIC_WEB_ORIGIN}${path}`, {
    method: 'GET',
    headers
  });
}

test('GET /api/account rejects unauthenticated requests before reading account state', async () => {
  const { app, calls } = createHarness();
  const response = await getAccount(app);

  assert.equal(response.status, 401);
  assert.deepEqual(calls, {
    users: [],
    identities: [],
    vaultCounts: []
  });
});

test('GET /api/account returns only the authenticated owner overview', async () => {
  const { app, calls } = createHarness();
  const response = await getAccount(app, 'user-a', '/api/account?userId=user-b');

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');

  const payload = await response.json();
  assert.deepEqual(payload, {
    authentication: {
      methods: ['EMAIL_MAGIC_LINK', 'GOOGLE'],
      emailAddresses: ['owner-a@example.test']
    },
    account: {
      createdAt: ACCOUNT_CREATED_AT
    },
    vaultCapacity: {
      used: 2,
      limit: 3,
      tier: 'FREE',
      proExpansionAvailable: false
    }
  });
  assert.deepEqual(calls, {
    users: ['user-a'],
    identities: ['user-a'],
    vaultCounts: ['user-a']
  });

  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /user-a|identity-a|providerSubject|google-subject|updatedAt/u);
});

test('GET /api/account keeps Google provider subjects and foreign account state out of the response', async () => {
  const { app } = createHarness();
  const response = await getAccount(app, 'user-b');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    authentication: {
      methods: ['GOOGLE'],
      emailAddresses: []
    },
    account: {
      createdAt: '2026-08-22T12:00:00.000Z'
    },
    vaultCapacity: {
      used: 1,
      limit: 3,
      tier: 'FREE',
      proExpansionAvailable: false
    }
  });
});

test('GET /api/account fails closed when the authenticated account root is unavailable', async () => {
  const { app } = createHarness();
  const response = await getAccount(app, 'unknown-user');

  assert.equal(response.status, 401);
});
