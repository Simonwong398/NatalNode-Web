import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  RECENT_AUTH_MAX_AGE_SECONDS,
  isRecentAuthentication
} from '../dist/account/account-deletion-policy.js';
import { createApp } from '../dist/app/create-app.js';
import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';
import {
  P0_STAGING_RATE_LIMIT_POLICIES,
  selectP0StagingRateLimitPolicy
} from '../dist/app/security/api-rate-limiting.js';
import {
  deriveAuthLifecycleLockKey,
  sortNormalizedEmailsForAuthLifecycle
} from '../dist/persistence/postgres/auth-lifecycle-lock.js';
import { PostgresAccountErasureRepository } from '../dist/persistence/postgres/postgres-account-erasure-repository.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const NOW = '2026-08-27T12:10:00.000Z';
const EXACTLY_600_SECONDS_OLD = '2026-08-27T12:00:00.000Z';
const MORE_THAN_600_SECONDS_OLD = '2026-08-27T11:59:59.999Z';
const REPOSITORY_ROOT = new URL('../../', import.meta.url);

function emptyPersistence() {
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

function createRouteHarness({ failErasure = false, accountExists = true } = {}) {
  const deletedUsers = new Set();
  const eraseCalls = [];

  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');

        if (userId === null || deletedUsers.has(userId)) {
          return null;
        }

        return {
          userId,
          sessionCreatedAt:
            request.headers.get('x-test-session-created-at') ??
            EXACTLY_600_SECONDS_OLD
        };
      }
    },
    accountErasure: {
      async eraseAccount(userId) {
        eraseCalls.push(userId);

        if (failErasure) {
          throw new Error('private database detail');
        }

        if (!accountExists) {
          return { outcome: 'account-not-found' };
        }

        deletedUsers.add(userId);
        return { outcome: 'deleted' };
      }
    },
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {},
    persistence: emptyPersistence(),
    engineClient: {},
    clock: {
      now() {
        return NOW;
      }
    },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {
      name: 'nn_session',
      secure: true
    }
  };

  return {
    app: createApp(dependencies),
    eraseCalls
  };
}

function deleteAccount(
  app,
  {
    body = JSON.stringify({ confirmation: 'DELETE' }),
    contentType = 'application/json',
    origin = PUBLIC_WEB_ORIGIN,
    sessionCreatedAt = EXACTLY_600_SECONDS_OLD,
    userId = 'user-a',
    edgeIp = '203.0.113.20'
  } = {}
) {
  const headers = {
    Origin: origin,
    'Content-Type': contentType,
    'X-NatalNode-Client-IP': edgeIp
  };

  if (userId !== null) {
    headers['X-Test-User'] = userId;
    headers['X-Test-Session-Created-At'] = sessionCreatedAt;
  }

  return app.request('/api/account', {
    method: 'DELETE',
    headers,
    body
  });
}

function createGraphState() {
  return {
    users: [{ userId: 'user-a' }, { userId: 'user-b' }],
    identities: [
      { userId: 'user-a', provider: 'EMAIL_MAGIC_LINK', subject: 'z@example.test' },
      { userId: 'user-a', provider: 'EMAIL_MAGIC_LINK', subject: 'a@example.test' },
      { userId: 'user-b', provider: 'EMAIL_MAGIC_LINK', subject: 'b@example.test' }
    ],
    sessions: [
      { userId: 'user-a', tokenHash: 'session-a-1' },
      { userId: 'user-a', tokenHash: 'session-a-2' },
      { userId: 'user-b', tokenHash: 'session-b' }
    ],
    challenges: [
      { email: 'a@example.test', status: 'outstanding' },
      { email: 'a@example.test', status: 'consumed' },
      { email: 'z@example.test', status: 'expired' },
      { email: 'b@example.test', status: 'outstanding' }
    ],
    charts: [
      { userId: 'user-a', chartId: 'chart-a' },
      { userId: 'user-b', chartId: 'chart-b' }
    ],
    notes: [
      { userId: 'user-a', chartId: 'chart-a', noteId: 'note-a' },
      { userId: 'user-b', chartId: 'chart-b', noteId: 'note-b' }
    ],
    feedback: [
      { userId: 'user-a', feedbackId: 'feedback-a' },
      { userId: 'user-b', feedbackId: 'feedback-b' }
    ]
  };
}

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

class InMemoryAccountErasureClient {
  constructor(pool) {
    this.pool = pool;
    this.calls = [];
    this.snapshot = null;
    this.identityQueryCount = 0;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (normalized === 'BEGIN') {
      this.snapshot = structuredClone(this.pool.state);
      return { rows: [] };
    }

    if (normalized === 'COMMIT') {
      if (this.pool.failCommit) {
        throw new Error('forced commit failure');
      }

      this.snapshot = null;
      return { rows: [] };
    }

    if (normalized === 'ROLLBACK') {
      this.pool.state = structuredClone(this.snapshot);
      this.snapshot = null;
      return { rows: [] };
    }

    if (normalized.includes('pg_advisory_xact_lock')) {
      return { rows: [] };
    }

    if (
      normalized.startsWith('SELECT provider_subject FROM auth_identities')
    ) {
      const userId = params[0];
      this.identityQueryCount += 1;

      if (
        this.pool.identityMismatchOnce &&
        !this.pool.lateIdentityCommitted &&
        this.identityQueryCount === 2
      ) {
        this.pool.lateIdentityCommitted = true;
      }

      const identities = this.pool.state.identities
          .filter(
            (identity) =>
              identity.userId === userId &&
              identity.provider === 'EMAIL_MAGIC_LINK'
          )
          .map((identity) => ({ provider_subject: identity.subject }));

      if (
        userId === 'user-a' &&
        (
          this.pool.lateIdentityCommitted ||
          (this.pool.identityMismatchEveryAttempt &&
            this.identityQueryCount === 2)
        )
      ) {
        identities.push({ provider_subject: 'late@example.test' });
      }

      return {
        rows: identities.sort((left, right) => {
          if (this.pool.reverseIdentityQueryOrder) {
            return left.provider_subject < right.provider_subject
              ? 1
              : left.provider_subject > right.provider_subject
                ? -1
                : 0;
          }

          return left.provider_subject.localeCompare(right.provider_subject);
        })
      };
    }

    if (normalized.includes('FROM users') && normalized.endsWith('FOR UPDATE')) {
      const userId = params[0];
      return {
        rows: this.pool.state.users
          .filter((user) => user.userId === userId)
          .map((user) => ({ user_id: user.userId }))
      };
    }

    if (normalized.startsWith('DELETE FROM email_magic_link_challenges')) {
      const emails = new Set(params[0]);
      this.pool.state.challenges = this.pool.state.challenges.filter(
        (challenge) => !emails.has(challenge.email)
      );
      return { rows: [] };
    }

    if (normalized.startsWith('DELETE FROM users')) {
      if (this.pool.failBeforeUserDelete) {
        throw new Error('forced user-root deletion failure');
      }

      const userId = params[0];
      const userExists = this.pool.state.users.some(
        (user) => user.userId === userId
      );

      if (!userExists) {
        return { rows: [] };
      }

      const deletedChartIds = new Set(
        this.pool.state.charts
          .filter((chart) => chart.userId === userId)
          .map((chart) => chart.chartId)
      );

      this.pool.state.users = this.pool.state.users.filter(
        (user) => user.userId !== userId
      );
      this.pool.state.identities = this.pool.state.identities.filter(
        (identity) => identity.userId !== userId
      );
      this.pool.state.sessions = this.pool.state.sessions.filter(
        (session) => session.userId !== userId
      );
      this.pool.state.charts = this.pool.state.charts.filter(
        (chart) => chart.userId !== userId
      );
      this.pool.state.notes = this.pool.state.notes.filter(
        (note) => note.userId !== userId && !deletedChartIds.has(note.chartId)
      );
      this.pool.state.feedback = this.pool.state.feedback.filter(
        (submission) => submission.userId !== userId
      );

      return {
        rows: Array.from(
          { length: this.pool.deletedRootRowCount },
          () => ({ user_id: userId })
        )
      };
    }

    throw new Error(`Unexpected SQL in account-erasure test: ${normalized}`);
  }

  release() {
    this.pool.releaseCount += 1;
  }
}

class InMemoryAccountErasurePool {
  constructor(
    state,
    {
      deletedRootRowCount = 1,
      failBeforeUserDelete = false,
      failCommit = false,
      identityMismatchEveryAttempt = false,
      identityMismatchOnce = false,
      reverseIdentityQueryOrder = false
    } = {}
  ) {
    this.state = structuredClone(state);
    this.deletedRootRowCount = deletedRootRowCount;
    this.failBeforeUserDelete = failBeforeUserDelete;
    this.failCommit = failCommit;
    this.identityMismatchEveryAttempt = identityMismatchEveryAttempt;
    this.identityMismatchOnce = identityMismatchOnce;
    this.reverseIdentityQueryOrder = reverseIdentityQueryOrder;
    this.lateIdentityCommitted = false;
    this.clients = [];
    this.releaseCount = 0;
  }

  async connect() {
    const client = new InMemoryAccountErasureClient(this);
    this.clients.push(client);
    return client;
  }
}

test('recent-auth policy freezes and enforces the exact 600-second boundary', () => {
  assert.equal(RECENT_AUTH_MAX_AGE_SECONDS, 600);
  assert.equal(isRecentAuthentication(EXACTLY_600_SECONDS_OLD, NOW), true);
  assert.equal(isRecentAuthentication(MORE_THAN_600_SECONDS_OLD, NOW), false);
  assert.equal(isRecentAuthentication('invalid', NOW), false);
  assert.equal(
    isRecentAuthentication('2026-08-27T12:10:00.001Z', NOW),
    false
  );
});

test('DELETE /api/account requires authentication and exact configured Origin', async () => {
  const unauthenticatedHarness = createRouteHarness();
  const unauthenticated = await deleteAccount(unauthenticatedHarness.app, {
    userId: null
  });
  assert.equal(unauthenticated.status, 401);
  assert.equal(
    unauthenticated.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  assert.deepEqual(await unauthenticated.json(), {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED'
  });
  assert.equal(unauthenticatedHarness.eraseCalls.length, 0);

  const crossOriginHarness = createRouteHarness();
  const crossOrigin = await deleteAccount(crossOriginHarness.app, {
    origin: 'https://attacker.example'
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOriginHarness.eraseCalls.length, 0);
});

test('DELETE /api/account strictly validates media type, JSON, fields, and phrase', async () => {
  const invalidRequests = [
    { contentType: 'text/plain' },
    { body: '' },
    { body: '{not-json' },
    { body: 'null' },
    { body: '[]' },
    { body: '"DELETE"' },
    { body: JSON.stringify({}) },
    { body: JSON.stringify({ confirmation: 'delete' }) },
    { body: JSON.stringify({ confirmation: 'Delete' }) },
    { body: JSON.stringify({ confirmation: ' DELETE' }) },
    { body: JSON.stringify({ confirmation: 'DELETE ' }) },
    {
      body: JSON.stringify({
        confirmation: 'DELETE',
        userId: 'browser-controlled-target'
      })
    },
    {
      body: JSON.stringify({
        confirmation: 'DELETE',
        accountId: 'browser-controlled-target'
      })
    },
    {
      body: JSON.stringify({
        confirmation: 'DELETE',
        email: 'attacker@example.test'
      })
    },
    {
      body: JSON.stringify({
        confirmation: 'DELETE',
        identityId: 'browser-controlled-target'
      })
    }
  ];

  for (const [index, request] of invalidRequests.entries()) {
    const harness = createRouteHarness();
    const response = await deleteAccount(harness.app, {
      ...request,
      edgeIp: `203.0.113.${30 + index}`
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'INVALID_REQUEST'
    });
    assert.equal(harness.eraseCalls.length, 0);
    assert.equal(response.headers.get('Set-Cookie'), null);
  }
});

test('DELETE /api/account accepts JSON media-type parameters and enforces UTF-8 and byte bounds', async () => {
  const acceptedHarness = createRouteHarness();
  const accepted = await deleteAccount(acceptedHarness.app, {
    contentType: 'application/json; charset=utf-8'
  });
  assert.equal(accepted.status, 204);
  assert.deepEqual(acceptedHarness.eraseCalls, ['user-a']);

  const invalidBodies = [
    new Uint8Array([0xc3, 0x28]),
    'x'.repeat(1_025)
  ];

  for (const [index, body] of invalidBodies.entries()) {
    const harness = createRouteHarness();
    const response = await deleteAccount(harness.app, {
      body,
      edgeIp: `203.0.113.${80 + index}`
    });
    assert.equal(response.status, 400);
    assert.equal(harness.eraseCalls.length, 0);
    assert.equal(response.headers.get('Set-Cookie'), null);
  }
});

test('exactly 600 seconds is accepted and 600 seconds plus 1 ms is rejected', async () => {
  const acceptedHarness = createRouteHarness();
  const accepted = await deleteAccount(acceptedHarness.app, {
    sessionCreatedAt: EXACTLY_600_SECONDS_OLD
  });
  assert.equal(accepted.status, 204);
  assert.deepEqual(acceptedHarness.eraseCalls, ['user-a']);

  const rejectedHarness = createRouteHarness();
  const rejected = await deleteAccount(rejectedHarness.app, {
    sessionCreatedAt: MORE_THAN_600_SECONDS_OLD
  });
  assert.equal(rejected.status, 403);
  assert.deepEqual(await rejected.json(), {
    type: 'about:blank',
    title: 'Forbidden',
    status: 403,
    code: 'RECENT_AUTHENTICATION_REQUIRED'
  });
  assert.equal(rejectedHarness.eraseCalls.length, 0);
  assert.equal(rejected.headers.get('Set-Cookie'), null);
});

test('successful deletion returns empty 204, then clears the cookie and invalidates retry auth', async () => {
  const harness = createRouteHarness();
  const firstResponse = await deleteAccount(harness.app);

  assert.equal(firstResponse.status, 204);
  assert.equal(await firstResponse.text(), '');
  assert.equal(firstResponse.headers.get('Cache-Control'), 'no-store');
  assert.equal(firstResponse.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(firstResponse.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(firstResponse.headers.get('X-Frame-Options'), 'DENY');
  assert.ok(firstResponse.headers.get('X-Request-Id'));
  assert.match(firstResponse.headers.get('Set-Cookie'), /^nn_session=;/u);
  assert.match(firstResponse.headers.get('Set-Cookie'), /Max-Age=0/u);
  assert.deepEqual(harness.eraseCalls, ['user-a']);

  const retryResponse = await deleteAccount(harness.app, {
    edgeIp: '203.0.113.21'
  });
  assert.equal(retryResponse.status, 401);
  assert.deepEqual(await retryResponse.json(), {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED'
  });
  assert.equal(retryResponse.headers.get('Set-Cookie'), null);
  assert.deepEqual(harness.eraseCalls, ['user-a']);
});

test('database failure is bounded and never emits deletion-success cookie semantics', async () => {
  const harness = createRouteHarness({ failErasure: true });
  const response = await deleteAccount(harness.app);
  const responseText = await response.text();

  assert.equal(response.status, 500);
  assert.deepEqual(JSON.parse(responseText), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR'
  });
  assert.doesNotMatch(responseText, /private database detail/iu);
  assert.equal(response.headers.get('Set-Cookie'), null);
});

test('an unexpectedly missing authenticated root returns bounded 401 without a success cookie', async () => {
  const harness = createRouteHarness({ accountExists: false });
  const response = await deleteAccount(harness.app);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED'
  });
  assert.equal(response.headers.get('Set-Cookie'), null);
  assert.deepEqual(harness.eraseCalls, ['user-a']);
});

test('account deletion has bounded rate limiting and privacy-minimized endpoint classification', () => {
  assert.equal(
    selectP0StagingRateLimitPolicy('DELETE', '/api/account'),
    P0_STAGING_RATE_LIMIT_POLICIES.accountDeletion
  );
  assert.equal(classifyApiEndpointFamily('/api/account'), 'account.delete');
});

test('lock derivation and multiple-identity ordering are stable and deterministic', () => {
  assert.deepEqual(
    sortNormalizedEmailsForAuthLifecycle([
      'z@example.test',
      'a@example.test',
      'z@example.test'
    ]),
    ['a@example.test', 'z@example.test']
  );
  assert.equal(
    deriveAuthLifecycleLockKey('a@example.test'),
    deriveAuthLifecycleLockKey('a@example.test')
  );
  assert.notEqual(
    deriveAuthLifecycleLockKey('a@example.test'),
    deriveAuthLifecycleLockKey('z@example.test')
  );
});

test('account-erasure repository atomically removes User A graph and preserves User B', async () => {
  const pool = new InMemoryAccountErasurePool(createGraphState());
  const repository = new PostgresAccountErasureRepository(pool);
  const result = await repository.eraseAccount('user-a');

  assert.deepEqual(result, { outcome: 'deleted' });
  assert.deepEqual(pool.state.users, [{ userId: 'user-b' }]);
  assert.deepEqual(pool.state.identities, [
    { userId: 'user-b', provider: 'EMAIL_MAGIC_LINK', subject: 'b@example.test' }
  ]);
  assert.deepEqual(pool.state.sessions, [
    { userId: 'user-b', tokenHash: 'session-b' }
  ]);
  assert.deepEqual(pool.state.challenges, [
    { email: 'b@example.test', status: 'outstanding' }
  ]);
  assert.deepEqual(pool.state.charts, [
    { userId: 'user-b', chartId: 'chart-b' }
  ]);
  assert.deepEqual(pool.state.notes, [
    { userId: 'user-b', chartId: 'chart-b', noteId: 'note-b' }
  ]);
  assert.deepEqual(pool.state.feedback, [
    { userId: 'user-b', feedbackId: 'feedback-b' }
  ]);

  const calls = pool.clients[0].calls;
  const lockCalls = calls.filter((call) =>
    call.sql.includes('pg_advisory_xact_lock')
  );
  assert.deepEqual(
    lockCalls.map((call) => call.params[0]),
    [
      deriveAuthLifecycleLockKey('a@example.test'),
      deriveAuthLifecycleLockKey('z@example.test')
    ]
  );
  assert.equal(calls.filter((call) => call.sql === 'BEGIN').length, 1);
  assert.equal(calls.filter((call) => call.sql === 'COMMIT').length, 1);
  assert.equal(calls.filter((call) => call.sql === 'ROLLBACK').length, 0);
  assert.equal(
    calls.some((call) => /DELETE FROM (?:charts|chart_notes|auth_sessions|feedback_submissions)/u.test(call.sql)),
    false
  );
  assert.equal(pool.releaseCount, 1);
});

test('forced user-root failure rolls back challenge cleanup and the complete graph', async () => {
  const initialState = createGraphState();
  const pool = new InMemoryAccountErasurePool(initialState, {
    failBeforeUserDelete: true
  });
  const repository = new PostgresAccountErasureRepository(pool);

  await assert.rejects(
    repository.eraseAccount('user-a'),
    /forced user-root deletion failure/u
  );
  assert.deepEqual(pool.state, initialState);

  const calls = pool.clients[0].calls;
  assert.equal(calls.filter((call) => call.sql === 'BEGIN').length, 1);
  assert.equal(calls.filter((call) => call.sql === 'ROLLBACK').length, 1);
  assert.equal(calls.filter((call) => call.sql === 'COMMIT').length, 0);
  assert.equal(pool.releaseCount, 1);
});

test('identity-set change rolls back and retries with the newly authoritative lock set', async () => {
  const pool = new InMemoryAccountErasurePool(createGraphState(), {
    identityMismatchOnce: true
  });
  const repository = new PostgresAccountErasureRepository(pool);
  const result = await repository.eraseAccount('user-a');

  assert.deepEqual(result, { outcome: 'deleted' });
  assert.equal(pool.clients.length, 2);
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'ROLLBACK').length,
    1
  );
  assert.equal(
    pool.clients[0].calls.some((call) =>
      call.sql.startsWith('DELETE FROM email_magic_link_challenges')
    ),
    false
  );

  const retryLockKeys = pool.clients[1].calls
    .filter((call) => call.sql.includes('pg_advisory_xact_lock'))
    .map((call) => call.params[0]);
  assert.deepEqual(retryLockKeys, [
    deriveAuthLifecycleLockKey('a@example.test'),
    deriveAuthLifecycleLockKey('late@example.test'),
    deriveAuthLifecycleLockKey('z@example.test')
  ]);
  assert.equal(
    pool.clients[1].calls.filter((call) => call.sql === 'COMMIT').length,
    1
  );
});

test('identity equality is independent of PostgreSQL result collation order', async () => {
  const pool = new InMemoryAccountErasurePool(createGraphState(), {
    reverseIdentityQueryOrder: true
  });
  const repository = new PostgresAccountErasureRepository(pool);

  assert.deepEqual(
    await repository.eraseAccount('user-a'),
    { outcome: 'deleted' }
  );
  assert.equal(pool.clients.length, 1);
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'ROLLBACK').length,
    0
  );
});

test('identity-set retry is finite and performs no deletion when every attempt changes', async () => {
  const initialState = createGraphState();
  const pool = new InMemoryAccountErasurePool(initialState, {
    identityMismatchEveryAttempt: true
  });
  const repository = new PostgresAccountErasureRepository(pool);

  await assert.rejects(
    repository.eraseAccount('user-a'),
    /identity set changed during erasure/u
  );
  assert.equal(pool.clients.length, 3);
  assert.equal(pool.releaseCount, 3);
  assert.deepEqual(pool.state, initialState);

  for (const client of pool.clients) {
    assert.equal(
      client.calls.filter((call) => call.sql === 'ROLLBACK').length,
      1
    );
    assert.equal(
      client.calls.some((call) =>
        call.sql.startsWith('DELETE FROM email_magic_link_challenges')
      ),
      false
    );
  }
});

test('root deletion must return exactly one row or the complete transaction rolls back', async () => {
  const initialState = createGraphState();
  const pool = new InMemoryAccountErasurePool(initialState, {
    deletedRootRowCount: 2
  });
  const repository = new PostgresAccountErasureRepository(pool);

  await assert.rejects(
    repository.eraseAccount('user-a'),
    /did not delete exactly one user root/u
  );
  assert.deepEqual(pool.state, initialState);
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'ROLLBACK').length,
    1
  );
  assert.equal(pool.releaseCount, 1);
});

test('COMMIT failure is surfaced without an unsafe automatic transaction retry', async () => {
  const initialState = createGraphState();
  const pool = new InMemoryAccountErasurePool(initialState, {
    failCommit: true
  });
  const repository = new PostgresAccountErasureRepository(pool);

  await assert.rejects(
    repository.eraseAccount('user-a'),
    /forced commit failure/u
  );
  assert.equal(pool.clients.length, 1);
  assert.equal(pool.releaseCount, 1);
  assert.deepEqual(pool.state, initialState);
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'COMMIT').length,
    1
  );
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'ROLLBACK').length,
    1
  );
});

test('migrations freeze all required account-root cascade relationships', async () => {
  const authVaultMigration = await readFile(
    new URL('server/db/migrations/0001_auth_vault_baseline.sql', REPOSITORY_ROOT),
    'utf8'
  );
  const authRuntimeMigration = await readFile(
    new URL('server/db/migrations/0002_auth_runtime.sql', REPOSITORY_ROOT),
    'utf8'
  );
  const provisioningMigration = await readFile(
    new URL(
      'server/db/migrations/0003_auth_identity_provisioning_fk.sql',
      REPOSITORY_ROOT
    ),
    'utf8'
  );
  const feedbackMigration = await readFile(
    new URL('server/db/migrations/0004_private_feedback.sql', REPOSITORY_ROOT),
    'utf8'
  );

  assert.match(
    authVaultMigration,
    /auth_identities_user_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    provisioningMigration,
    /auth_identities_user_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE[\s\S]*DEFERRABLE INITIALLY DEFERRED/u
  );
  assert.match(
    authVaultMigration,
    /charts_user_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    authVaultMigration,
    /chart_notes_chart_fk[\s\S]*REFERENCES charts \(chart_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    authVaultMigration,
    /chart_notes_user_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    authRuntimeMigration,
    /auth_sessions_user_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    feedbackMigration,
    /feedback_submissions_user_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.doesNotMatch(
    authRuntimeMigration,
    /email_magic_link_challenges[\s\S]*REFERENCES users/iu
  );
});
