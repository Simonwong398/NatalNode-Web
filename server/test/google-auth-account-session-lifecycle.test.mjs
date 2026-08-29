import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { PostgresGoogleAuthAccountSessionLifecycle } from '../dist/persistence/postgres/postgres-google-auth-account-session-lifecycle.js';

const NOW = '2026-08-29T12:00:00.000Z';
const EXPIRES_AT = '2026-08-29T13:00:00.000Z';

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim().toUpperCase();
}

function createState({ users = [], identities = [] } = {}) {
  return {
    users: structuredClone(users),
    identities: structuredClone(identities),
    sessions: [],
    locks: []
  };
}

class FakeClient {
  constructor(state, options) {
    this.state = state;
    this.options = options;
    this.calls = [];
    this.releaseCalls = [];
    this.transactionSnapshot = null;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    const copiedParams = structuredClone(params);
    this.calls.push({ normalized, params: copiedParams });

    if (normalized === 'BEGIN') {
      this.transactionSnapshot = structuredClone(this.state);
      return { rows: [] };
    }

    if (normalized === 'COMMIT') {
      this.transactionSnapshot = null;
      return { rows: [] };
    }

    if (normalized === 'ROLLBACK') {
      if (this.options.failRollback) {
        throw new Error('rollback failed');
      }

      if (this.transactionSnapshot !== null) {
        this.state.users = this.transactionSnapshot.users;
        this.state.identities = this.transactionSnapshot.identities;
        this.state.sessions = this.transactionSnapshot.sessions;
        this.state.locks = this.transactionSnapshot.locks;
      }
      this.transactionSnapshot = null;
      return { rows: [] };
    }

    if (normalized.includes('PG_ADVISORY_XACT_LOCK')) {
      this.state.locks.push(copiedParams[0]);
      return { rows: [] };
    }

    if (
      normalized.includes('FROM AUTH_IDENTITIES') &&
      normalized.includes("PROVIDER = 'GOOGLE'")
    ) {
      return {
        rows: this.state.identities
          .filter(
            (identity) =>
              identity.provider === 'GOOGLE' &&
              identity.provider_subject === copiedParams[0]
          )
          .map((identity) => ({ user_id: identity.user_id }))
      };
    }

    if (
      normalized.includes('FROM AUTH_IDENTITIES') &&
      normalized.includes("PROVIDER = 'EMAIL_MAGIC_LINK'")
    ) {
      return {
        rows: this.state.identities
          .filter(
            (identity) =>
              identity.provider === 'EMAIL_MAGIC_LINK' &&
              identity.provider_subject === copiedParams[0]
          )
          .map((identity) => ({ user_id: identity.user_id }))
      };
    }

    if (normalized.startsWith('INSERT INTO USERS')) {
      this.state.users.push({
        user_id: copiedParams[0],
        created_at: copiedParams[1],
        updated_at: copiedParams[2]
      });
      return { rows: [] };
    }

    if (normalized.startsWith('INSERT INTO AUTH_IDENTITIES')) {
      this.state.identities.push({
        identity_id: copiedParams[0],
        user_id: copiedParams[1],
        provider: copiedParams[2],
        provider_subject: copiedParams[3],
        created_at: copiedParams[4],
        updated_at: copiedParams[5]
      });
      return { rows: [] };
    }

    if (normalized.startsWith('INSERT INTO AUTH_SESSIONS')) {
      this.state.sessions.push({
        session_token_hash: copiedParams[0],
        user_id: copiedParams[1],
        created_at: copiedParams[2],
        expires_at: copiedParams[3]
      });
      return { rows: [] };
    }

    if (normalized.startsWith('UPDATE GOOGLE_OAUTH_TRANSACTIONS')) {
      if (this.options.terminalizeRows === false) {
        return { rows: [] };
      }

      return { rows: [{ transaction_id: copiedParams[0] }] };
    }

    throw new Error(`Unexpected SQL: ${normalized}`);
  }

  release(error) {
    this.releaseCalls.push(error);
  }
}

class FakePool {
  constructor(state, options = {}) {
    this.state = state;
    this.options = options;
    this.clients = [];
  }

  async connect() {
    const client = new FakeClient(this.state, this.options);
    this.clients.push(client);
    return client;
  }
}

function createInput({
  providerSubject = 'google-subject-1',
  emailNormalized = 'person@example.test',
  proposedUserId = 'proposed-user-1',
  proposedIdentityId = 'proposed-identity-1'
} = {}) {
  return {
    transactionId: 'transaction-1',
    providerSubject,
    emailNormalized,
    proposedUserId,
    proposedIdentityId,
    session: {
      sessionTokenHash: 'session-token-hash',
      userId: proposedUserId,
      createdAt: NOW,
      expiresAt: EXPIRES_AT
    },
    terminalAt: NOW
  };
}

function createLifecycle(state, options) {
  const pool = new FakePool(state, options);
  return {
    lifecycle: new PostgresGoogleAuthAccountSessionLifecycle(pool),
    pool
  };
}

test('existing Google subject wins over current email and receives a fresh session for the existing user', async () => {
  const state = createState({
    users: [{ user_id: 'google-owner' }, { user_id: 'email-owner' }],
    identities: [
      {
        identity_id: 'google-identity',
        user_id: 'google-owner',
        provider: 'GOOGLE',
        provider_subject: 'google-subject-1'
      },
      {
        identity_id: 'email-identity',
        user_id: 'email-owner',
        provider: 'EMAIL_MAGIC_LINK',
        provider_subject: 'person@example.test'
      }
    ]
  });
  const { lifecycle, pool } = createLifecycle(state);

  const result = await lifecycle.resolveAndCreateSession(createInput());

  assert.deepEqual(result, {
    outcome: 'authenticated',
    userId: 'google-owner'
  });
  assert.equal(state.users.length, 2);
  assert.equal(state.identities.length, 2);
  assert.deepEqual(state.sessions, [{
    session_token_hash: 'session-token-hash',
    user_id: 'google-owner',
    created_at: NOW,
    expires_at: EXPIRES_AT
  }]);
  assert.equal(state.locks.length, 0);
  assert.equal(pool.clients[0].calls.some((call) => call.normalized.includes('COMMIT')), true);
  assert.equal(pool.clients[0].releaseCalls.length, 1);
});

test('new Google subject with an unused email creates only a Google identity and one first-party session', async () => {
  const state = createState();
  const { lifecycle, pool } = createLifecycle(state);

  const result = await lifecycle.resolveAndCreateSession(createInput());

  assert.deepEqual(result, {
    outcome: 'authenticated',
    userId: 'proposed-user-1'
  });
  assert.deepEqual(state.users, [{
    user_id: 'proposed-user-1',
    created_at: NOW,
    updated_at: NOW
  }]);
  assert.deepEqual(state.identities, [{
    identity_id: 'proposed-identity-1',
    user_id: 'proposed-user-1',
    provider: 'GOOGLE',
    provider_subject: 'google-subject-1',
    created_at: NOW,
    updated_at: NOW
  }]);
  assert.deepEqual(state.sessions, [{
    session_token_hash: 'session-token-hash',
    user_id: 'proposed-user-1',
    created_at: NOW,
    expires_at: EXPIRES_AT
  }]);
  assert.equal(state.identities.some((identity) => identity.provider === 'EMAIL_MAGIC_LINK'), false);
  assert.equal(state.locks.length, 1);
  const terminalCall = pool.clients[0].calls.find((call) => call.normalized.startsWith('UPDATE GOOGLE_OAUTH_TRANSACTIONS'));
  assert.deepEqual(terminalCall.params, ['transaction-1', 'COMPLETED', NOW]);
  assert.equal(
    pool.clients[0].calls.filter((call) => call.normalized.includes('FROM AUTH_IDENTITIES')).length,
    3
  );
});

test('new Google subject colliding with an Email Magic Link identity creates no account, identity, or session and fails the transaction', async () => {
  const state = createState({
    users: [{ user_id: 'email-owner' }],
    identities: [{
      identity_id: 'email-identity',
      user_id: 'email-owner',
      provider: 'EMAIL_MAGIC_LINK',
      provider_subject: 'person@example.test'
    }]
  });
  const { lifecycle, pool } = createLifecycle(state);

  const result = await lifecycle.resolveAndCreateSession(createInput());

  assert.deepEqual(result, { outcome: 'email-collision' });
  assert.deepEqual(state.users, [{ user_id: 'email-owner' }]);
  assert.equal(state.identities.length, 1);
  assert.deepEqual(state.sessions, []);
  assert.equal(state.locks.length, 1);
  const terminalCall = pool.clients[0].calls.find((call) => call.normalized.startsWith('UPDATE GOOGLE_OAUTH_TRANSACTIONS'));
  assert.deepEqual(terminalCall.params, ['transaction-1', 'FAILED', NOW]);
  assert.equal(pool.clients[0].calls.some((call) => call.normalized.startsWith('INSERT INTO USERS')), false);
  assert.equal(pool.clients[0].calls.some((call) => call.normalized.startsWith('INSERT INTO AUTH_IDENTITIES')), false);
  assert.equal(pool.clients[0].calls.some((call) => call.normalized.startsWith('INSERT INTO AUTH_SESSIONS')), false);
});

test('different Google subjects with the same verified email are never linked by email', async () => {
  const state = createState();
  const first = createLifecycle(state);
  const second = createLifecycle(state);

  const firstResult = await first.lifecycle.resolveAndCreateSession(createInput({
    providerSubject: 'google-subject-a',
    proposedUserId: 'user-a',
    proposedIdentityId: 'identity-a'
  }));
  const secondResult = await second.lifecycle.resolveAndCreateSession(createInput({
    providerSubject: 'google-subject-b',
    proposedUserId: 'user-b',
    proposedIdentityId: 'identity-b'
  }));

  assert.deepEqual(firstResult, { outcome: 'authenticated', userId: 'user-a' });
  assert.deepEqual(secondResult, { outcome: 'authenticated', userId: 'user-b' });
  assert.deepEqual(
    state.identities.map((identity) => [identity.provider_subject, identity.user_id]),
    [['google-subject-a', 'user-a'], ['google-subject-b', 'user-b']]
  );
  assert.deepEqual(
    state.sessions.map((session) => session.user_id),
    ['user-a', 'user-b']
  );
  assert.notEqual(state.identities[0].user_id, state.identities[1].user_id);
});

test('account, identity, session, and transaction completion are rolled back together when terminalization cannot complete', async () => {
  const state = createState();
  const { lifecycle, pool } = createLifecycle(state, { terminalizeRows: false });

  await assert.rejects(
    () => lifecycle.resolveAndCreateSession(createInput()),
    /could not be completed/u
  );

  assert.deepEqual(state, createState());
  assert.equal(pool.clients[0].calls.at(-1).normalized, 'ROLLBACK');
  assert.deepEqual(pool.clients[0].releaseCalls, [undefined]);
});

test('the local account/session transaction reuses the normalized-email lock and provider-subject uniqueness boundary', async () => {
  const lifecycleSource = await readFile(
    new URL('../src/persistence/postgres/postgres-google-auth-account-session-lifecycle.ts', import.meta.url),
    'utf8'
  );
  const identityMigration = await readFile(
    new URL('../db/migrations/0001_auth_vault_baseline.sql', import.meta.url),
    'utf8'
  );

  assert.match(lifecycleSource, /client\.query\('BEGIN'\)/u);
  assert.match(lifecycleSource, /acquireAuthLifecycleLocks\(executor, \[input\.emailNormalized\]\)/u);
  assert.match(lifecycleSource, /FOR UPDATE/u);
  assert.match(lifecycleSource, /PostgresGoogleOAuthTransactionRepository/u);
  const firstLookup = lifecycleSource.indexOf('const existingGoogleIdentity =');
  const lock = lifecycleSource.indexOf('await acquireAuthLifecycleLocks');
  const secondLookup = lifecycleSource.indexOf('const existingGoogleIdentityAfterLock =');
  assert.equal(firstLookup < lock && lock < secondLookup, true);
  assert.match(identityMigration, /UNIQUE \(provider, provider_subject\)/u);
});
