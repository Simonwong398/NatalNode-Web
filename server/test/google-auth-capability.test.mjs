import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';

function createDependencies({ configured = false } = {}) {
  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate() {
        return null;
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
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
    engineClient: {},
    chartCalculator: {},
    clock: {},
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  if (configured) {
    dependencies.googleOidcProvider = {};
    dependencies.googleOAuthTransactionService = {};
    dependencies.googleAuthAccountSessionLifecycle = {};
  }

  return dependencies;
}

async function readSession(app) {
  const response = await app.request('/api/auth/session');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  return response.json();
}

test('unconfigured Auth session capability is false and reveals no configuration', async () => {
  const payload = await readSession(createApp(createDependencies()));

  assert.deepEqual(payload, {
    authenticated: false,
    googleSignInAvailable: false
  });
  assert.equal(Object.keys(payload).sort().join(','), 'authenticated,googleSignInAvailable');
});

test('configured injected Auth capability is true without requiring authentication', async () => {
  const payload = await readSession(
    createApp(createDependencies({ configured: true }))
  );

  assert.deepEqual(payload, {
    authenticated: false,
    googleSignInAvailable: true
  });
});

test('public-development reports false and direct Google Start remains unavailable', async () => {
  const { createPublicDevelopmentApp } = await import(
    '../dist/executable/public-development-dependencies.js'
  );
  const app = createPublicDevelopmentApp({ NODE_ENV: 'test' });
  const payload = await readSession(app);

  assert.deepEqual(payload, {
    authenticated: false,
    googleSignInAvailable: false
  });

  const response = await app.request('/api/auth/google/start', {
    method: 'POST',
    headers: { Origin: 'http://localhost:4321' }
  });
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR',
    detail: 'An unexpected server error occurred.'
  });
});
