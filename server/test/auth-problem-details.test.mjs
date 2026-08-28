import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SESSION_COOKIE = {
  name: 'nn_session',
  secure: true
};

function emptyPersistence() {
  return {
    users: {},
    authIdentities: {},
    authIdentityProvisioning: {},
    authSessions: {
      async deleteByTokenHash() {}
    },
    emailMagicLinkChallenges: {},
    feedbackSubmissions: {},
    vaultCharts: {},
    chartNotes: {}
  };
}

function createDependencies({
  authenticator = { async authenticate() { return null; } },
  authLifecycle = {
    async createChallenge() {},
    async withConsumedChallenge() { return null; }
  }
} = {}) {
  return {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator,
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: authLifecycle,
    idGenerator: {
      generate() {
        return 'generated-id';
      }
    },
    persistence: emptyPersistence(),
    engineClient: {},
    clock: {
      now() {
        return '2026-08-28T12:00:00.000Z';
      }
    },
    secureTokenGenerator: {
      generate() {
        return 'generated-token';
      }
    },
    tokenHasher: {
      hash(token) {
        return `hash:${token}`;
      }
    },
    authenticationExpirationPolicy: {
      magicLinkExpiresAt() {
        return '2026-08-28T12:10:00.000Z';
      },
      sessionExpiresAt() {
        return '2026-08-28T13:00:00.000Z';
      }
    },
    emailMagicLinkDelivery: {
      async sendMagicLink() {}
    },
    magicLinkUrlBuilder: {
      build() {
        return 'https://natalnode.test/auth/complete';
      }
    },
    sessionCookiePolicy: SESSION_COOKIE
  };
}

function createAuthApp(options) {
  return createApp(createDependencies(options));
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

async function readProblem(response, status, code) {
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
  assert.deepEqual(payload, {
    type: 'about:blank',
    title: status === 400 ? 'Bad Request' : 'Unauthorized',
    status,
    code
  });
  assert.equal('error' in payload, false);
  assert.equal('message' in payload, false);
  assert.equal('instance' in payload, false);
  assert.equal('requestId' in payload, false);
  return payload;
}

test('Magic Link request validation uses canonical Problem Details', async () => {
  const app = createAuthApp();

  await readProblem(
    await postJson(app, '/api/auth/email/request', { email: 'not-an-email' }),
    400,
    'INVALID_REQUEST'
  );

  const malformed = await app.request('/api/auth/email/request', {
    method: 'POST',
    headers: {
      Origin: PUBLIC_WEB_ORIGIN,
      'Content-Type': 'application/json'
    },
    body: '{not-json'
  });
  await readProblem(malformed, 400, 'INVALID_REQUEST');
});

test('unknown, expired, and consumed Magic Links remain indistinguishable 401 responses', async () => {
  const app = createAuthApp();
  const responses = [];

  for (const token of ['unknown-token', 'expired-token', 'consumed-token']) {
    const response = await postJson(app, '/api/auth/email/complete', { token });
    const payload = await readProblem(response, 401, 'UNAUTHORIZED');
    responses.push(JSON.stringify(payload));
  }

  assert.equal(new Set(responses).size, 1);
  assert.doesNotMatch(responses[0], /unknown|expired|consumed|token/iu);
});

test('Auth session status and logout success responses remain unchanged', async () => {
  const app = createAuthApp();

  const sessionResponse = await app.request('/api/auth/session');
  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionResponse.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(await sessionResponse.json(), { authenticated: false });

  const logoutResponse = await app.request('/api/auth/logout', {
    method: 'POST',
    headers: { Origin: PUBLIC_WEB_ORIGIN }
  });
  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutResponse.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(await logoutResponse.json(), { signedOut: true });
  assert.match(logoutResponse.headers.get('Set-Cookie') ?? '', /^nn_session=;/u);
  assert.equal(logoutResponse.headers.get('Cache-Control'), 'no-store');
  assert.equal(logoutResponse.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(logoutResponse.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(logoutResponse.headers.get('X-Frame-Options'), 'DENY');
  assert.ok(logoutResponse.headers.get('X-Request-Id'));
});

test('Magic Link invalid request remains generic and does not expose account state', async () => {
  const authLifecycle = {
    async createChallenge() {},
    async withConsumedChallenge() {
      return null;
    }
  };
  const app = createAuthApp({ authLifecycle });
  const responses = await Promise.all([
    postJson(app, '/api/auth/email/complete', { token: 'does-not-exist' }),
    postJson(app, '/api/auth/email/complete', { token: 'already-consumed' })
  ]);

  const payloads = await Promise.all(responses.map((response) => response.json()));
  assert.deepEqual(payloads[0], payloads[1]);
  assert.equal(payloads[0].code, 'UNAUTHORIZED');
  assert.equal('detail' in payloads[0], false);
});
