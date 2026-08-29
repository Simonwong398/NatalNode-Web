import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import {
  GOOGLE_OIDC_SCOPES,
  serializeClearedGoogleOAuthCorrelationCookie,
  serializeGoogleOAuthCorrelationCookie
} from '../dist/index.js';
import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';
import {
  P0_STAGING_RATE_LIMIT_POLICIES,
  selectP0StagingRateLimitPolicy
} from '../dist/app/security/api-rate-limiting.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SESSION_COOKIE_POLICY = { name: 'nn_session', secure: true };
const NOW = '2026-08-29T12:00:00.000Z';
const SESSION_EXPIRES_AT = '2026-08-29T13:00:00.000Z';
const TRANSACTION_EXPIRES_AT = '2026-08-29T12:15:00.000Z';
const STATE = 'S'.repeat(43);
const BROWSER_BINDING = 'B'.repeat(43);
const PKCE_VERIFIER = 'P'.repeat(43);
const NONCE_HASH = 'a'.repeat(64);
const CODE = 'authorization-code';
const GOOGLE_IDENTITY = {
  provider: 'GOOGLE',
  providerSubject: 'google-subject-1',
  verifiedEmail: 'person@example.test'
};

function createPersistence() {
  return {
    users: {},
    authIdentities: {},
    authIdentityProvisioning: {},
    authSessions: {},
    emailMagicLinkChallenges: {},
    feedbackSubmissions: {},
    vaultCharts: {},
    chartNotes: {}
  };
}

function createTransactionService({ claim = true, order = [] } = {}) {
  const calls = {
    create: [],
    claim: [],
    terminalize: []
  };
  const claimValue = {
    transactionId: 'transaction-1',
    pkceVerifier: PKCE_VERIFIER,
    nonceHash: NONCE_HASH,
    postAuthRedirect: '/'
  };

  return {
    calls,
    async create(input) {
      calls.create.push(structuredClone(input));
      return {
        transactionId: 'transaction-1',
        state: STATE,
        codeChallenge: 'C'.repeat(43),
        nonce: 'N'.repeat(43),
        browserBinding: BROWSER_BINDING,
        expiresAt: TRANSACTION_EXPIRES_AT,
        postAuthRedirect: '/'
      };
    },
    async claim(input) {
      order.push('claim');
      calls.claim.push(structuredClone(input));

      if (typeof claim === 'function') {
        return claim(input);
      }

      return claim && input.state === STATE && input.browserBinding === BROWSER_BINDING
        ? structuredClone(claimValue)
        : null;
    },
    async terminalize(input) {
      calls.terminalize.push(structuredClone(input));
      return true;
    }
  };
}

function createProvider({
  identity = GOOGLE_IDENTITY,
  authorizationUrl = 'https://accounts.google.test/o/oauth2/v2/auth?scope=openid%20email',
  exchangeError = null,
  order = []
} = {}) {
  const calls = {
    authorization: [],
    exchange: []
  };

  return {
    calls,
    createAuthorizationRequest(input) {
      order.push('authorization');
      calls.authorization.push(structuredClone(input));
      return { authorizationUrl };
    },
    async exchangeAuthorizationCode(input) {
      order.push('exchange');
      calls.exchange.push(structuredClone(input));
      if (exchangeError !== null) {
        throw exchangeError;
      }
      return structuredClone(identity);
    }
  };
}

function createLifecycle({ outcome = 'authenticated', userId = 'google-user-1', error = null, order = [] } = {}) {
  const calls = [];

  return {
    calls,
    async resolveAndCreateSession(input) {
      order.push('lifecycle');
      calls.push(structuredClone(input));
      if (error !== null) {
        throw error;
      }
      return outcome === 'email-collision'
        ? { outcome }
        : { outcome: 'authenticated', userId };
    }
  };
}

function createDependencies({
  transactionService,
  provider,
  lifecycle,
  authenticatedPrincipal = null,
  withGoogle = true,
  token = 'session-token',
  idValues = ['proposed-user-1', 'proposed-identity-1']
} = {}) {
  const remainingIds = [...idValues];
  const authenticatorCalls = [];
  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        authenticatorCalls.push({
          method: request.method,
          cookie: request.headers.get('Cookie')
        });
        return authenticatedPrincipal;
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {
      generate() {
        const value = remainingIds.shift();
        if (value === undefined) {
          throw new Error('unexpected id generation');
        }
        return value;
      }
    },
    persistence: createPersistence(),
    engineClient: {},
    chartCalculator: {},
    clock: {
      now() {
        return NOW;
      }
    },
    secureTokenGenerator: {
      generate() {
        return token;
      }
    },
    tokenHasher: {
      hash(value) {
        return `hash:${value}`;
      }
    },
    authenticationExpirationPolicy: {
      sessionExpiresAt() {
        return SESSION_EXPIRES_AT;
      },
      magicLinkExpiresAt() {
        return TRANSACTION_EXPIRES_AT;
      }
    },
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: SESSION_COOKIE_POLICY
  };

  if (withGoogle) {
    dependencies.googleOidcProvider = provider;
    dependencies.googleOAuthTransactionService = transactionService;
    dependencies.googleAuthAccountSessionLifecycle = lifecycle;
  }

  return { dependencies, authenticatorCalls };
}

function createHarness(options = {}) {
  const transactionService = options.transactionService ?? createTransactionService({
    order: options.order
  });
  const provider = options.provider ?? createProvider({ order: options.order });
  const lifecycle = options.lifecycle ?? createLifecycle({ order: options.order });
  const { dependencies, authenticatorCalls } = createDependencies({
    ...options,
    transactionService,
    provider,
    lifecycle
  });
  const sink = options.sink ?? {
    records: [],
    write(record) {
      this.records.push(structuredClone(record));
    }
  };

  return {
    app: createApp(dependencies, { observabilitySink: sink }),
    dependencies,
    transactionService,
    provider,
    lifecycle,
    authenticatorCalls,
    sink
  };
}

function setCookies(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie();
  }

  const combined = response.headers.get('Set-Cookie');
  return combined === null ? [] : [combined];
}

function postGoogleStart(app, { ip = '198.51.100.10', body, headers = {} } = {}) {
  return app.request('/api/auth/google/start', {
    method: 'POST',
    headers: new Headers({
      Origin: PUBLIC_WEB_ORIGIN,
      'X-NatalNode-Client-IP': ip,
      ...headers
    }),
    ...(body === undefined ? {} : { body })
  });
}

function googleCallback(app, {
  state = STATE,
  code = CODE,
  error,
  errorDescription,
  binding = BROWSER_BINDING,
  includeCookie = true,
  headers = {}
} = {}) {
  const params = new URLSearchParams({ state });

  if (error !== undefined) {
    params.set('error', error);
    if (errorDescription !== undefined) {
      params.set('error_description', errorDescription);
    }
  } else {
    params.set('code', code);
  }

  return app.request(`/api/auth/google/callback?${params.toString()}`, {
    headers: new Headers({
      ...(includeCookie ? { Cookie: `nn_google_oauth_binding=${binding}` } : {}),
      ...headers
    })
  });
}

async function assertGenericFailure(response) {
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), '/auth/sign-in#google-auth-failed');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const cookies = setCookies(response);
  assert.equal(cookies.length, 1);
  assert.match(cookies[0], /^nn_google_oauth_binding=;/u);
  assert.match(cookies[0], /HttpOnly/u);
  assert.match(cookies[0], /SameSite=Lax/u);
  assert.match(cookies[0], /Path=\//u);
  assert.match(cookies[0], /Max-Age=0/u);
  assert.equal(cookies.some((cookie) => cookie.startsWith('nn_session=')), false);
  return response.headers.get('Location');
}

test('Google start creates one server transaction, requests only minimal scopes, and redirects safely', async () => {
  const harness = createHarness({ order: [] });
  const response = await postGoogleStart(harness.app);

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get('Location'),
    'https://accounts.google.test/o/oauth2/v2/auth?scope=openid%20email'
  );
  assert.deepEqual(harness.transactionService.calls.create, [{ now: NOW }]);
  assert.equal(harness.provider.calls.authorization.length, 1);
  assert.deepEqual(harness.provider.calls.authorization[0], {
    state: STATE,
    codeChallenge: 'C'.repeat(43),
    nonce: 'N'.repeat(43),
    scopes: [...GOOGLE_OIDC_SCOPES],
    redirectUri: `${PUBLIC_WEB_ORIGIN}/api/auth/google/callback`
  });
  assert.deepEqual(harness.lifecycle.calls, []);

  const cookies = setCookies(response);
  assert.equal(cookies.length, 1);
  assert.match(cookies[0], /^nn_google_oauth_binding=B{43};/u);
  assert.match(cookies[0], /Path=\//u);
  assert.match(cookies[0], /HttpOnly/u);
  assert.match(cookies[0], /SameSite=Lax/u);
  assert.match(cookies[0], /Expires=Sat, 29 Aug 2026 12:15:00 GMT/u);
  assert.match(cookies[0], /; Secure$/u);
  assert.doesNotMatch(cookies[0], /nn_session|state|nonce|pkce|email/iu);
  assert.equal(harness.sink.records.length, 1);
  assert.equal(harness.sink.records[0].endpointFamily, 'auth.google.start');
});

test('Google start is bodyless, anonymous-only, same-origin protected, and uses the existing auth initiation limit', async () => {
  const bodyHarness = createHarness();
  const bodyResponse = await postGoogleStart(bodyHarness.app, { body: 'not-empty' });
  assert.equal(bodyResponse.status, 400);
  assert.equal(bodyHarness.transactionService.calls.create.length, 0);

  const authenticatedHarness = createHarness({
    authenticatedPrincipal: {
      userId: 'already-signed-in',
      sessionCreatedAt: NOW
    }
  });
  const authenticatedResponse = await postGoogleStart(authenticatedHarness.app);
  assert.equal(authenticatedResponse.status, 403);
  assert.equal(authenticatedHarness.transactionService.calls.create.length, 0);

  const originHarness = createHarness();
  const originResponse = await originHarness.app.request('/api/auth/google/start', {
    method: 'POST',
    headers: {
      Origin: 'https://evil.example',
      'X-NatalNode-Client-IP': '198.51.100.11'
    }
  });
  assert.equal(originResponse.status, 403);
  assert.equal(originHarness.transactionService.calls.create.length, 0);
  assert.equal(originHarness.provider.calls.authorization.length, 0);

  assert.deepEqual(
    selectP0StagingRateLimitPolicy('POST', '/api/auth/google/start'),
    P0_STAGING_RATE_LIMIT_POLICIES.authEmailRequest
  );
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.authEmailRequest.limit, 5);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.authEmailRequest.windowMs, 600_000);

  const rateHarness = createHarness();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(
      (await postGoogleStart(rateHarness.app, { ip: '198.51.100.12' })).status,
      303
    );
  }
  const limitedResponse = await postGoogleStart(rateHarness.app, {
    ip: '198.51.100.12'
  });
  assert.equal(limitedResponse.status, 429);
  assert.deepEqual(await limitedResponse.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED'
  });
  assert.equal(rateHarness.transactionService.calls.create.length, 5);
});

test('valid callback claims before exchange, resolves through the existing session boundary, clears correlation, and redirects home', async () => {
  const order = [];
  const harness = createHarness({ order });
  const response = await googleCallback(harness.app, { headers: {} });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), '/');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(order, ['claim', 'exchange', 'lifecycle']);
  assert.deepEqual(harness.transactionService.calls.claim, [{
    state: STATE,
    browserBinding: BROWSER_BINDING,
    now: NOW
  }]);
  assert.deepEqual(harness.provider.calls.exchange, [{
    code: CODE,
    redirectUri: `${PUBLIC_WEB_ORIGIN}/api/auth/google/callback`,
    pkceVerifier: PKCE_VERIFIER,
    expectedNonceHash: NONCE_HASH
  }]);
  assert.equal(harness.lifecycle.calls.length, 1);
  assert.deepEqual(harness.lifecycle.calls[0], {
    transactionId: 'transaction-1',
    providerSubject: GOOGLE_IDENTITY.providerSubject,
    emailNormalized: GOOGLE_IDENTITY.verifiedEmail,
    proposedUserId: 'proposed-user-1',
    proposedIdentityId: 'proposed-identity-1',
    session: {
      sessionTokenHash: 'hash:session-token',
      userId: 'proposed-user-1',
      createdAt: NOW,
      expiresAt: SESSION_EXPIRES_AT
    },
    terminalAt: NOW
  });

  const cookies = setCookies(response);
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /^nn_google_oauth_binding=;/u);
  assert.match(cookies[0], /Max-Age=0/u);
  assert.match(cookies[1], /^nn_session=session-token;/u);
  assert.match(cookies[1], /Path=\//u);
  assert.match(cookies[1], /HttpOnly/u);
  assert.match(cookies[1], /SameSite=Lax/u);
  assert.match(cookies[1], /Expires=Sat, 29 Aug 2026 13:00:00 GMT/u);
  assert.match(cookies[1], /; Secure$/u);
  assert.deepEqual(selectP0StagingRateLimitPolicy('GET', '/api/auth/google/callback'), P0_STAGING_RATE_LIMIT_POLICIES.authEmailComplete);
  assert.equal(classifyApiEndpointFamily('/api/auth/google/callback'), 'auth.google.callback');
  assert.equal(harness.sink.records.length, 1);
  assert.equal(harness.sink.records[0].endpointFamily, 'auth.google.callback');
  assert.doesNotMatch(JSON.stringify(harness.sink.records[0]), /google-subject|person@example|authorization-code|nonce|pkce|state/iu);
});

test('callback replay and wrong or missing correlation binding never reach provider exchange', async () => {
  const replayHarness = createHarness({
    transactionService: createTransactionService({ claim: false })
  });
  await assertGenericFailure(await googleCallback(replayHarness.app));
  assert.equal(replayHarness.provider.calls.exchange.length, 0);
  assert.equal(replayHarness.transactionService.calls.terminalize.length, 0);

  const wrongCookieHarness = createHarness();
  await assertGenericFailure(await googleCallback(wrongCookieHarness.app, {
    binding: 'W'.repeat(43)
  }));
  assert.equal(wrongCookieHarness.provider.calls.exchange.length, 0);
  assert.equal(wrongCookieHarness.lifecycle.calls.length, 0);

  const missingCookieHarness = createHarness();
  await assertGenericFailure(await googleCallback(missingCookieHarness.app, {
    includeCookie: false
  }));
  assert.equal(missingCookieHarness.transactionService.calls.claim.length, 0);
  assert.equal(missingCookieHarness.provider.calls.exchange.length, 0);
});

test('provider errors, invalid callback values, invalid identities, collisions, and persistence failures converge to sanitized failure', async () => {
  const providerErrorHarness = createHarness();
  const providerErrorResponse = await googleCallback(providerErrorHarness.app, {
    error: 'access_denied',
    errorDescription: 'provider-secret-description'
  });
  await assertGenericFailure(providerErrorResponse);
  assert.equal(providerErrorHarness.provider.calls.exchange.length, 0);
  assert.deepEqual(providerErrorHarness.transactionService.calls.terminalize, [{
    transactionId: 'transaction-1',
    status: 'FAILED',
    terminalAt: NOW
  }]);

  const invalidQueryHarness = createHarness();
  const invalidQueryResponse = await invalidQueryHarness.app.request(
    `/api/auth/google/callback?state=${STATE}&code=${CODE}&unexpected=secret`,
    { headers: { Cookie: `nn_google_oauth_binding=${BROWSER_BINDING}` } }
  );
  await assertGenericFailure(invalidQueryResponse);
  assert.equal(invalidQueryHarness.transactionService.calls.claim.length, 0);
  assert.equal(invalidQueryHarness.provider.calls.exchange.length, 0);

  const invalidIdentityHarness = createHarness({
    provider: createProvider({
      identity: {
        provider: 'GOOGLE',
        providerSubject: 'google-subject-1',
        verifiedEmail: 'Not-Normalized@example.test'
      }
    })
  });
  const invalidIdentityResponse = await googleCallback(invalidIdentityHarness.app);
  await assertGenericFailure(invalidIdentityResponse);
  assert.equal(invalidIdentityHarness.lifecycle.calls.length, 0);
  assert.deepEqual(invalidIdentityHarness.transactionService.calls.terminalize, [{
    transactionId: 'transaction-1',
    status: 'FAILED',
    terminalAt: NOW
  }]);

  const collisionHarness = createHarness({
    lifecycle: createLifecycle({ outcome: 'email-collision' })
  });
  await assertGenericFailure(await googleCallback(collisionHarness.app));
  assert.equal(collisionHarness.lifecycle.calls.length, 1);

  const persistenceFailureHarness = createHarness({
    lifecycle: createLifecycle({ error: new Error('private database failure') })
  });
  const persistenceFailureResponse = await googleCallback(persistenceFailureHarness.app);
  await assertGenericFailure(persistenceFailureResponse);
  assert.equal(setCookies(persistenceFailureResponse).some((cookie) => cookie.startsWith('nn_session=')), false);
  assert.deepEqual(persistenceFailureHarness.transactionService.calls.terminalize, [{
    transactionId: 'transaction-1',
    status: 'FAILED',
    terminalAt: NOW
  }]);
  assert.doesNotMatch(persistenceFailureResponse.headers.get('Location'), /private|email|subject|code|state/iu);
});

test('an authenticated callback cannot silently become account linking, and unavailable Google configuration fails closed', async () => {
  const authenticatedHarness = createHarness({
    authenticatedPrincipal: {
      userId: 'existing-user',
      sessionCreatedAt: NOW
    }
  });
  await assertGenericFailure(await googleCallback(authenticatedHarness.app));
  assert.equal(authenticatedHarness.provider.calls.exchange.length, 0);
  assert.deepEqual(authenticatedHarness.transactionService.calls.terminalize, [{
    transactionId: 'transaction-1',
    status: 'FAILED',
    terminalAt: NOW
  }]);

  const unavailableHarness = createHarness({ withGoogle: false });
  const unavailableResponse = await postGoogleStart(unavailableHarness.app);
  assert.equal(unavailableResponse.status, 500);
  assert.deepEqual(await unavailableResponse.json(), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR',
    detail: 'An unexpected server error occurred.'
  });
  assert.equal(unavailableHarness.transactionService.calls.create.length, 0);
});

test('correlation cookie serializers remain separate from the first-party session cookie', () => {
  const correlation = serializeGoogleOAuthCorrelationCookie(
    BROWSER_BINDING,
    TRANSACTION_EXPIRES_AT,
    SESSION_COOKIE_POLICY
  );
  const cleared = serializeClearedGoogleOAuthCorrelationCookie(SESSION_COOKIE_POLICY);

  assert.match(correlation, /^nn_google_oauth_binding=/u);
  assert.match(correlation, /HttpOnly/u);
  assert.match(correlation, /SameSite=Lax/u);
  assert.match(correlation, /Path=\//u);
  assert.match(correlation, /Expires=Sat, 29 Aug 2026 12:15:00 GMT/u);
  assert.match(correlation, /; Secure$/u);
  assert.match(cleared, /^nn_google_oauth_binding=;/u);
  assert.match(cleared, /Max-Age=0/u);
  assert.doesNotMatch(correlation, /nn_session/iu);
  assert.doesNotMatch(cleared, /nn_session/iu);
});
