import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  GOOGLE_OIDC_PROVIDER,
  GoogleOidcProviderError,
  GoogleOAuthTransactionService,
  PostgresGoogleOAuthTransactionRepository,
  Sha256TokenHasher,
  deriveS256PkceCodeChallenge,
  verifyGoogleOAuthSecretHash
} from '../dist/index.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const MIGRATION_PATH = new URL(
  'server/db/migrations/0007_google_oauth_transactions.sql',
  REPOSITORY_ROOT
);
const PROVIDER_SOURCE_PATH = new URL(
  '../src/auth-runtime/google-oidc-provider.ts',
  import.meta.url
);

const NOW = '2026-08-29T12:00:00.000Z';
const LATER = '2026-08-29T12:05:00.000Z';
const EXPIRED_NOW = '2026-08-29T12:11:00.000Z';
const SECRETS = [
  'A'.repeat(43),
  'B'.repeat(43),
  'C'.repeat(43),
  'D'.repeat(43)
];
const WRONG_STATE = 'E'.repeat(43);
const WRONG_BROWSER_BINDING = 'F'.repeat(43);
const tokenHasher = new Sha256TokenHasher();

function sequentialTokenGenerator(values = SECRETS) {
  const remaining = [...values];

  return {
    generate() {
      const next = remaining.shift();
      if (next === undefined) {
        throw new Error('Unexpected protocol secret generation.');
      }
      return next;
    }
  };
}

function createIdGenerator(value = 'transaction-1') {
  return {
    generate() {
      return value;
    }
  };
}

function createFakeRepository({ failCreate = false } = {}) {
  const repository = {
    records: [],
    claimInputs: [],
    terminalizeInputs: [],
    async create(record) {
      if (failCreate) {
        throw new Error('forced transaction persistence failure');
      }
      this.records.push(structuredClone(record));
    },
    async claimPending(input) {
      this.claimInputs.push(structuredClone(input));
      return null;
    },
    async terminalize(input) {
      this.terminalizeInputs.push(structuredClone(input));
      return true;
    }
  };

  return repository;
}

function createService(repository, values = SECRETS, policy = { ttlSeconds: 300 }) {
  return new GoogleOAuthTransactionService({
    repository,
    idGenerator: createIdGenerator(),
    secureTokenGenerator: sequentialTokenGenerator(values),
    tokenHasher,
    policy
  });
}

function createRecord(overrides = {}) {
  return {
    transactionId: 'transaction-1',
    flowKind: 'GOOGLE_SIGN_IN',
    stateHash: tokenHasher.hash(SECRETS[0]),
    pkceVerifier: SECRETS[3],
    nonceHash: tokenHasher.hash(SECRETS[1]),
    browserBindingHash: tokenHasher.hash(SECRETS[2]),
    createdAt: NOW,
    expiresAt: LATER,
    postAuthRedirect: '/',
    status: 'PENDING',
    claimedAt: null,
    terminalAt: null,
    ...overrides
  };
}

class AtomicClaimExecutor {
  constructor({ expiresAt = LATER } = {}) {
    this.state = {
      status: 'PENDING',
      expiresAt,
      pkceVerifier: SECRETS[3]
    };
    this.calls = [];
  }

  async query(sql, params = []) {
    const normalized = sql.replace(/\s+/gu, ' ').trim();
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (normalized.startsWith('INSERT INTO google_oauth_transactions')) {
      return { rows: [] };
    }

    if (normalized.startsWith('UPDATE google_oauth_transactions')) {
      if (
        this.state.status !== 'PENDING' ||
        params[0] !== tokenHasher.hash(SECRETS[0]) ||
        params[1] !== tokenHasher.hash(SECRETS[2])
      ) {
        return { rows: [] };
      }

      const expired = Date.parse(this.state.expiresAt) <= Date.parse(params[2]);
      if (expired) {
        this.state.status = 'EXPIRED';
        this.state.pkceVerifier = null;
        return {
          rows: [{
            transaction_id: 'transaction-1',
            status: 'EXPIRED',
            pkce_verifier: null,
            nonce_hash: tokenHasher.hash(SECRETS[1]),
            post_auth_redirect: '/'
          }]
        };
      }

      this.state.status = 'CLAIMED';
      return {
        rows: [{
          transaction_id: 'transaction-1',
          status: 'CLAIMED',
          pkce_verifier: this.state.pkceVerifier,
          nonce_hash: tokenHasher.hash(SECRETS[1]),
          post_auth_redirect: '/'
        }]
      };
    }

    throw new Error(`Unexpected SQL in Google OAuth transaction test: ${normalized}`);
  }
}

test('provider boundary exposes only verified identity concepts and no network implementation', async () => {
  assert.equal(GOOGLE_OIDC_PROVIDER, 'GOOGLE');
  const error = new GoogleOidcProviderError('VERIFICATION_FAILED');
  assert.equal(error.code, 'VERIFICATION_FAILED');
  assert.match(error.message, /identity verification failed/u);
  assert.doesNotMatch(error.message, /provider response|token|claims/iu);

  const providerSource = await readFile(PROVIDER_SOURCE_PATH, 'utf8');
  assert.doesNotMatch(providerSource, /\b(?:fetch|axios|googleapis|jwks|discovery)\b/iu);
});

test('transaction creation independently generates and safely persists protocol material', async () => {
  const repository = createFakeRepository();
  const service = createService(repository);

  const material = await service.create({ now: NOW });
  const record = repository.records[0];

  assert.equal(new Set([
    material.state,
    material.nonce,
    material.browserBinding,
    record.pkceVerifier
  ]).size, 4);
  for (const value of [
    material.state,
    material.nonce,
    material.browserBinding,
    record.pkceVerifier
  ]) {
    assert.match(value, /^[A-Za-z0-9_-]{43,128}$/u);
  }
  assert.equal(record.stateHash, tokenHasher.hash(material.state));
  assert.equal(record.nonceHash, tokenHasher.hash(material.nonce));
  assert.equal(
    record.browserBindingHash,
    tokenHasher.hash(material.browserBinding)
  );
  assert.equal(record.pkceVerifier, SECRETS[3]);
  assert.equal(record.createdAt, NOW);
  assert.equal(record.expiresAt, '2026-08-29T12:05:00.000Z');
  assert.equal(record.flowKind, 'GOOGLE_SIGN_IN');
  assert.equal(record.postAuthRedirect, '/');
  assert.equal(record.status, 'PENDING');
  assert.equal(record.claimedAt, null);
  assert.equal(record.terminalAt, null);
  assert.deepEqual(Object.keys(record).sort(), [
    'browserBindingHash',
    'claimedAt',
    'createdAt',
    'expiresAt',
    'flowKind',
    'nonceHash',
    'pkceVerifier',
    'postAuthRedirect',
    'stateHash',
    'status',
    'terminalAt',
    'transactionId'
  ]);
  assert.doesNotMatch(JSON.stringify(record), new RegExp(material.state, 'u'));
  assert.doesNotMatch(JSON.stringify(record), new RegExp(material.nonce, 'u'));
  assert.doesNotMatch(
    JSON.stringify(record),
    new RegExp(material.browserBinding, 'u')
  );
  assert.equal(material.codeChallenge.includes('='), false);
  assert.equal(material.codeChallenge.includes('+'), false);
  assert.equal(material.codeChallenge.includes('/'), false);
  assert.equal(
    verifyGoogleOAuthSecretHash(material.nonce, record.nonceHash),
    true
  );
  assert.equal(
    verifyGoogleOAuthSecretHash(WRONG_STATE, record.nonceHash),
    false
  );
});

test('PKCE S256 derivation matches the RFC 7636 known vector', () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(
    deriveS256PkceCodeChallenge(verifier),
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  );
});

test('claim hashes state and browser binding, then returns only approved server material', async () => {
  const repository = createFakeRepository();
  const service = createService(repository);
  const material = await service.create({ now: NOW });
  const record = repository.records[0];
  const claim = {
    transactionId: record.transactionId,
    pkceVerifier: record.pkceVerifier,
    nonceHash: record.nonceHash,
    postAuthRedirect: record.postAuthRedirect
  };
  repository.claimPending = async (input) => {
    repository.claimInputs.push(structuredClone(input));
    if (
      input.stateHash === record.stateHash &&
      input.browserBindingHash === record.browserBindingHash
    ) {
      return claim;
    }
    return null;
  };

  assert.deepEqual(await service.claim({
    state: material.state,
    browserBinding: material.browserBinding,
    now: NOW
  }), claim);
  assert.deepEqual(repository.claimInputs[0], {
    stateHash: record.stateHash,
    browserBindingHash: record.browserBindingHash,
    now: NOW
  });
  assert.deepEqual(Object.keys(claim).sort(), [
    'nonceHash',
    'pkceVerifier',
    'postAuthRedirect',
    'transactionId'
  ]);
  assert.equal(claim.postAuthRedirect, '/');
  assert.equal(claim.pkceVerifier, SECRETS[3]);
  assert.equal(claim.nonceHash, record.nonceHash);
});

test('state and browser-binding mismatches fail without exposing claim material', async () => {
  const repository = createFakeRepository();
  const service = createService(repository);
  const material = await service.create({ now: NOW });
  const record = repository.records[0];
  repository.claimPending = async (input) => {
    repository.claimInputs.push(structuredClone(input));
    return input.stateHash === record.stateHash &&
      input.browserBindingHash === record.browserBindingHash
      ? {
          transactionId: record.transactionId,
          pkceVerifier: record.pkceVerifier,
          nonceHash: record.nonceHash,
          postAuthRedirect: '/'
        }
      : null;
  };

  assert.equal(await service.claim({
    state: WRONG_STATE,
    browserBinding: material.browserBinding,
    now: NOW
  }), null);
  assert.equal(await service.claim({
    state: material.state,
    browserBinding: WRONG_BROWSER_BINDING,
    now: NOW
  }), null);
  assert.equal(repository.claimInputs.length, 2);
  for (const input of repository.claimInputs) {
    assert.doesNotMatch(JSON.stringify(input), /authorization|token|nonce|email|user/iu);
  }
});

test('atomic PostgreSQL claim permits one competing callback and rejects replay', async () => {
  const executor = new AtomicClaimExecutor();
  const repository = new PostgresGoogleOAuthTransactionRepository(executor);
  const input = {
    stateHash: tokenHasher.hash(SECRETS[0]),
    browserBindingHash: tokenHasher.hash(SECRETS[2]),
    now: NOW
  };

  const results = await Promise.all([
    repository.claimPending(input),
    repository.claimPending(input)
  ]);
  assert.equal(results.filter((result) => result !== null).length, 1);
  assert.equal(results.filter((result) => result === null).length, 1);
  assert.deepEqual(results.find((result) => result !== null), {
    transactionId: 'transaction-1',
    pkceVerifier: SECRETS[3],
    nonceHash: tokenHasher.hash(SECRETS[1]),
    postAuthRedirect: '/'
  });
  assert.match(executor.calls[0].sql, /UPDATE google_oauth_transactions/u);
  assert.match(executor.calls[0].sql, /CASE WHEN expires_at > \$3/u);
  assert.match(executor.calls[0].sql, /status = 'PENDING'/u);
  assert.doesNotMatch(executor.calls[0].sql, /SELECT .*PENDING/iu);
});

test('expired matching transaction becomes non-reusable and loses the verifier at the claim boundary', async () => {
  const executor = new AtomicClaimExecutor({ expiresAt: '2026-08-29T12:10:00.000Z' });
  const repository = new PostgresGoogleOAuthTransactionRepository(executor);
  const input = {
    stateHash: tokenHasher.hash(SECRETS[0]),
    browserBindingHash: tokenHasher.hash(SECRETS[2]),
    now: EXPIRED_NOW
  };

  assert.equal(await repository.claimPending(input), null);
  assert.equal(executor.state.status, 'EXPIRED');
  assert.equal(executor.state.pkceVerifier, null);
  assert.equal(await repository.claimPending(input), null);
});

test('repository persists only the bounded transaction columns and clears verifier on terminalization', async () => {
  const calls = [];
  const repository = new PostgresGoogleOAuthTransactionRepository({
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes('RETURNING transaction_id')) {
        return { rows: [{ transaction_id: 'transaction-1' }] };
      }
      return { rows: [] };
    }
  });
  const record = createRecord();

  await repository.create(record);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO google_oauth_transactions/u);
  assert.deepEqual(calls[0].params, [
    record.transactionId,
    record.flowKind,
    record.stateHash,
    record.pkceVerifier,
    record.nonceHash,
    record.browserBindingHash,
    record.createdAt,
    record.expiresAt,
    record.postAuthRedirect,
    record.status,
    record.claimedAt,
    record.terminalAt
  ]);
  assert.doesNotMatch(calls[0].sql, /(?:email|user|account|token|metadata|payload|JSON)/iu);

  assert.equal(await repository.terminalize({
    transactionId: record.transactionId,
    status: 'FAILED',
    terminalAt: LATER
  }), true);
  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /pkce_verifier = NULL/u);
  assert.match(calls[1].sql, /status = 'CLAIMED'/u);
});

test('invalid bounded values are rejected before SQL and persistence errors propagate', async () => {
  const calls = [];
  const repository = new PostgresGoogleOAuthTransactionRepository({
    async query(sql, params = []) {
      calls.push({ sql, params });
      throw new Error('unexpected SQL');
    }
  });

  await assert.rejects(
    repository.create(createRecord({ transactionId: 'x'.repeat(257) })),
    /transactionId/u
  );
  await assert.rejects(
    repository.claimPending({
      stateHash: 'not-a-hash',
      browserBindingHash: tokenHasher.hash(SECRETS[2]),
      now: NOW
    }),
    /stateHash/u
  );
  assert.equal(calls.length, 0);

  const failingRepository = createFakeRepository({ failCreate: true });
  const service = createService(failingRepository);
  await assert.rejects(
    service.create({ now: NOW }),
    /forced transaction persistence failure/u
  );
});

test('migration defines only bounded technical transaction storage', async () => {
  const migration = await readFile(MIGRATION_PATH, 'utf8');

  assert.match(migration, /CREATE TABLE google_oauth_transactions/u);
  assert.match(migration, /transaction_id VARCHAR\(256\) PRIMARY KEY/u);
  assert.match(migration, /flow_kind VARCHAR\(14\) NOT NULL/u);
  assert.match(migration, /state_hash VARCHAR\(64\) NOT NULL UNIQUE/u);
  assert.match(migration, /pkce_verifier VARCHAR\(128\)/u);
  assert.match(migration, /nonce_hash VARCHAR\(64\) NOT NULL/u);
  assert.match(migration, /browser_binding_hash VARCHAR\(64\) NOT NULL/u);
  assert.match(migration, /created_at TIMESTAMPTZ NOT NULL/u);
  assert.match(migration, /expires_at TIMESTAMPTZ NOT NULL/u);
  assert.match(migration, /post_auth_redirect VARCHAR\(1\) NOT NULL/u);
  assert.match(migration, /status VARCHAR\(9\) NOT NULL/u);
  assert.match(migration, /status IN \('PENDING', 'CLAIMED', 'COMPLETED', 'FAILED', 'EXPIRED'\)/u);
  assert.match(migration, /flow_kind = 'GOOGLE_SIGN_IN'/u);
  assert.match(migration, /created_at < expires_at/u);
  assert.match(migration, /google_oauth_transactions_expiry_idx/u);
  assert.doesNotMatch(
    migration,
    /(?:raw_state|raw_nonce|authorization_code|access_token|refresh_token|id_token|email|user_id|account_id|metadata|payload|json|FOREIGN KEY|REFERENCES|ON DELETE CASCADE|BEGIN|COMMIT)/iu
  );
});

test('service requires an explicit bounded security TTL and terminalization stays server-side', async () => {
  assert.throws(
    () => createService(createFakeRepository(), SECRETS, { ttlSeconds: 0 }),
    /ttlSeconds/u
  );
  assert.throws(
    () => createService(
      createFakeRepository(),
      SECRETS,
      { ttlSeconds: 901 }
    ),
    /ttlSeconds/u
  );

  const repository = createFakeRepository();
  const service = createService(repository);
  assert.equal(await service.terminalize({
    transactionId: 'transaction-1',
    status: 'FAILED',
    terminalAt: LATER
  }), true);
  assert.deepEqual(repository.terminalizeInputs, [{
    transactionId: 'transaction-1',
    status: 'FAILED',
    terminalAt: LATER
  }]);
});
