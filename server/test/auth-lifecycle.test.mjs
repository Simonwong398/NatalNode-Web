import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionRequestAuthenticator } from '../dist/app/auth/session-request-authenticator.js';
import { completeEmailMagicLinkAuthentication } from '../dist/auth-runtime/email-magic-link-authentication.js';
import { issueEmailMagicLinkChallenge } from '../dist/auth-runtime/email-magic-link.js';
import { deriveAuthLifecycleLockKey } from '../dist/persistence/postgres/auth-lifecycle-lock.js';
import { PostgresEmailMagicLinkAuthLifecycle } from '../dist/persistence/postgres/postgres-email-magic-link-auth-lifecycle.js';

const NOW = '2026-08-27T12:00:00.000Z';
const MAGIC_LINK_EXPIRES_AT = '2026-08-27T12:15:00.000Z';
const SESSION_EXPIRES_AT = '2026-08-28T12:00:00.000Z';
const EMAIL_NORMALIZED = 'owner@example.test';

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

class ScriptedLifecycleClient {
  constructor({ failSessionInsert = false } = {}) {
    this.failSessionInsert = failSessionInsert;
    this.calls = [];
    this.releaseCount = 0;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(normalized)) {
      return { rows: [] };
    }

    if (normalized.includes('pg_advisory_xact_lock')) {
      return { rows: [] };
    }

    if (normalized.startsWith('INSERT INTO email_magic_link_challenges')) {
      return { rows: [] };
    }

    if (
      normalized.startsWith(
        'SELECT email_normalized FROM email_magic_link_challenges'
      )
    ) {
      return { rows: [{ email_normalized: EMAIL_NORMALIZED }] };
    }

    if (normalized.startsWith('UPDATE email_magic_link_challenges')) {
      return {
        rows: [{
          challenge_id: 'challenge-1',
          token_hash: 'hash:magic-secret',
          email_normalized: EMAIL_NORMALIZED,
          created_at: NOW,
          expires_at: MAGIC_LINK_EXPIRES_AT,
          consumed_at: NOW
        }]
      };
    }

    if (normalized.startsWith('WITH resolved_identity AS')) {
      return {
        rows: [{
          identity_id: 'identity-existing',
          user_id: 'user-existing',
          provider: 'EMAIL_MAGIC_LINK',
          provider_subject: EMAIL_NORMALIZED,
          created_at: NOW,
          updated_at: NOW
        }]
      };
    }

    if (normalized.startsWith('INSERT INTO auth_sessions')) {
      if (this.failSessionInsert) {
        throw new Error('forced session insert failure');
      }

      return { rows: [] };
    }

    throw new Error(`Unexpected SQL in Auth lifecycle test: ${normalized}`);
  }

  release() {
    this.releaseCount += 1;
  }
}

class ScriptedLifecyclePool {
  constructor(options) {
    this.client = new ScriptedLifecycleClient(options);
  }

  async connect() {
    return this.client;
  }
}

function sequentialIdGenerator(values) {
  const remaining = [...values];

  return {
    generate() {
      const next = remaining.shift();

      if (next === undefined) {
        throw new Error('Unexpected ID generation.');
      }

      return next;
    }
  };
}

const tokenHasher = {
  hash(token) {
    return `hash:${token}`;
  }
};

test('SessionRequestAuthenticator preserves immutable server-side session created_at', async () => {
  const authenticator = new SessionRequestAuthenticator({
    authSessions: {
      async findActiveByTokenHash(sessionTokenHash, now) {
        assert.equal(sessionTokenHash, 'hash:session-secret');
        assert.equal(now, NOW);
        return {
          sessionTokenHash,
          userId: 'user-existing',
          createdAt: '2026-08-27T11:55:00.000Z',
          expiresAt: SESSION_EXPIRES_AT
        };
      }
    },
    tokenHasher,
    clock: {
      now() {
        return NOW;
      }
    },
    cookiePolicy: {
      name: 'nn_session',
      secure: true
    }
  });
  const request = new Request('https://natalnode.test/api/account', {
    headers: { Cookie: 'nn_session=session-secret' }
  });

  assert.deepEqual(await authenticator.authenticate(request), {
    userId: 'user-existing',
    sessionCreatedAt: '2026-08-27T11:55:00.000Z'
  });
});

test('challenge issuance acquires the shared database lifecycle lock before insert', async () => {
  const pool = new ScriptedLifecyclePool();
  const authLifecycle = new PostgresEmailMagicLinkAuthLifecycle(pool);
  const issued = await issueEmailMagicLinkChallenge({
    email: '  Owner@Example.Test ',
    createdAt: NOW,
    expiresAt: MAGIC_LINK_EXPIRES_AT,
    idGenerator: sequentialIdGenerator(['challenge-1']),
    tokenGenerator: {
      generate() {
        return 'magic-secret';
      }
    },
    tokenHasher,
    authLifecycle
  });

  assert.equal(issued.record.emailNormalized, EMAIL_NORMALIZED);
  assert.equal(issued.record.tokenHash, 'hash:magic-secret');

  const calls = pool.client.calls;
  const beginIndex = calls.findIndex((call) => call.sql === 'BEGIN');
  const lockIndex = calls.findIndex((call) =>
    call.sql.includes('pg_advisory_xact_lock')
  );
  const insertIndex = calls.findIndex((call) =>
    call.sql.startsWith('INSERT INTO email_magic_link_challenges')
  );
  const commitIndex = calls.findIndex((call) => call.sql === 'COMMIT');

  assert.ok(beginIndex < lockIndex);
  assert.ok(lockIndex < insertIndex);
  assert.ok(insertIndex < commitIndex);
  assert.equal(
    calls[lockIndex].params[0],
    deriveAuthLifecycleLockKey(EMAIL_NORMALIZED)
  );
  assert.equal(pool.client.releaseCount, 1);
});

test('challenge consumption, identity provisioning, and session creation share one locked transaction', async () => {
  const pool = new ScriptedLifecyclePool();
  const authLifecycle = new PostgresEmailMagicLinkAuthLifecycle(pool);
  const completed = await completeEmailMagicLinkAuthentication({
    presentedToken: 'magic-secret',
    now: NOW,
    sessionExpiresAt: SESSION_EXPIRES_AT,
    idGenerator: sequentialIdGenerator(['user-proposed', 'identity-proposed']),
    tokenGenerator: {
      generate() {
        return 'session-secret';
      }
    },
    tokenHasher,
    authLifecycle
  });

  assert.deepEqual(completed, {
    userId: 'user-existing',
    sessionToken: 'session-secret',
    sessionExpiresAt: SESSION_EXPIRES_AT
  });

  const calls = pool.client.calls;
  const indexOf = (pattern) => calls.findIndex((call) => pattern.test(call.sql));
  const beginIndex = indexOf(/^BEGIN$/u);
  const candidateIndex = indexOf(/^SELECT email_normalized/u);
  const lockIndex = indexOf(/pg_advisory_xact_lock/u);
  const consumeIndex = indexOf(/^UPDATE email_magic_link_challenges/u);
  const provisionIndex = indexOf(/^WITH resolved_identity AS/u);
  const sessionIndex = indexOf(/^INSERT INTO auth_sessions/u);
  const commitIndex = indexOf(/^COMMIT$/u);

  assert.ok(beginIndex < candidateIndex);
  assert.ok(candidateIndex < lockIndex);
  assert.ok(lockIndex < consumeIndex);
  assert.ok(consumeIndex < provisionIndex);
  assert.ok(provisionIndex < sessionIndex);
  assert.ok(sessionIndex < commitIndex);
  assert.equal(
    calls[lockIndex].params[0],
    deriveAuthLifecycleLockKey(EMAIL_NORMALIZED)
  );
  assert.deepEqual(calls[sessionIndex].params, [
    'hash:session-secret',
    'user-existing',
    NOW,
    SESSION_EXPIRES_AT
  ]);
  assert.equal(pool.client.releaseCount, 1);
});

test('Auth lifecycle failure rolls back challenge consumption and session creation together', async () => {
  const pool = new ScriptedLifecyclePool({ failSessionInsert: true });
  const authLifecycle = new PostgresEmailMagicLinkAuthLifecycle(pool);

  await assert.rejects(
    completeEmailMagicLinkAuthentication({
      presentedToken: 'magic-secret',
      now: NOW,
      sessionExpiresAt: SESSION_EXPIRES_AT,
      idGenerator: sequentialIdGenerator(['user-proposed', 'identity-proposed']),
      tokenGenerator: {
        generate() {
          return 'session-secret';
        }
      },
      tokenHasher,
      authLifecycle
    }),
    /forced session insert failure/u
  );

  assert.equal(
    pool.client.calls.filter((call) => call.sql === 'ROLLBACK').length,
    1
  );
  assert.equal(
    pool.client.calls.filter((call) => call.sql === 'COMMIT').length,
    0
  );
  assert.equal(pool.client.releaseCount, 1);
});
