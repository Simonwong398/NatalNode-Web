import assert from 'node:assert/strict';
import test from 'node:test';

import {
  presentAccountDataExportIdentity
} from '../dist/account/account-data-export.js';
import { PostgresAccountDataExportRepository } from '../dist/persistence/postgres/postgres-account-data-export-repository.js';

const USER_ID = 'google-user';
const GOOGLE_SUBJECT = 'google-subject-secret';

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim().toUpperCase();
}

class FakeClient {
  constructor() {
    this.calls = [];
    this.releaseCalls = [];
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ normalized, params: structuredClone(params) });

    if (normalized === 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY') {
      return { rows: [] };
    }
    if (normalized === 'COMMIT' || normalized === 'ROLLBACK') {
      return { rows: [] };
    }
    if (normalized.includes('SELECT USER_ID, CREATED_AT, UPDATED_AT FROM USERS')) {
      return {
        rows: [{
          user_id: USER_ID,
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-29T00:00:00.000Z'
        }]
      };
    }
    if (normalized.includes('SELECT DISTINCT PROVIDER')) {
      return { rows: [{ provider: 'GOOGLE' }] };
    }
    if (normalized.includes('SELECT IDENTITY_ID, PROVIDER, PROVIDER_SUBJECT')) {
      return {
        rows: [{
          identity_id: 'google-identity',
          user_id: USER_ID,
          provider: 'GOOGLE',
          provider_subject: GOOGLE_SUBJECT,
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-29T00:00:00.000Z'
        }]
      };
    }

    throw new Error(`Unexpected SQL: ${normalized}`);
  }

  release(error) {
    this.releaseCalls.push(error);
  }
}

class FakePool {
  constructor() {
    this.clients = [];
  }

  async connect() {
    const client = new FakeClient();
    this.clients.push(client);
    return client;
  }
}

test('Google Account Export presents the existing identity pipeline without provider subject or OAuth material', async () => {
  const direct = presentAccountDataExportIdentity({
    provider: 'GOOGLE',
    providerSubject: GOOGLE_SUBJECT,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z'
  });
  assert.deepEqual(direct, {
    type: 'GOOGLE',
    linkedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z'
  });
  assert.equal('providerSubject' in direct, false);

  const pool = new FakePool();
  const repository = new PostgresAccountDataExportRepository(pool);
  const opened = await repository.openSnapshot(USER_ID);
  assert.equal(opened.outcome, 'opened');

  const page = await opened.snapshot.listIdentities();
  assert.deepEqual(page, {
    items: [{
      type: 'GOOGLE',
      linkedAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-29T00:00:00.000Z'
    }],
    nextCursor: null
  });
  const serialized = JSON.stringify(page);
  assert.doesNotMatch(serialized, /google-subject-secret|access_token|refresh_token|id_token|authorization_code|state|nonce|pkce/iu);

  await opened.snapshot.commit();
  const client = pool.clients[0];
  assert.equal(client.calls.some((call) => call.normalized.includes('SELECT DISTINCT PROVIDER')), true);
  assert.equal(client.calls.at(-1).normalized, 'COMMIT');
  assert.deepEqual(client.releaseCalls, [undefined]);
});
