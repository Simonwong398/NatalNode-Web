import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  AuthLifecycleCleanup,
  PostgresAuthLifecycleCleanupRepository
} from '../dist/index.js';
import {
  AUTH_LIFECYCLE_CLEANUP_DEFAULT_BATCH_SIZE
} from '../dist/persistence/index.js';

const NOW = '2026-08-28T12:00:00.000Z';
const EARLIER = '2026-08-28T11:00:00.000Z';
const LATER = '2026-08-28T13:00:00.000Z';

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

function cloneState(state) {
  return structuredClone(state);
}

function session(sessionTokenHash, userId, expiresAt) {
  return { sessionTokenHash, userId, expiresAt };
}

function challenge(challengeId, emailNormalized, expiresAt, consumedAt = null) {
  return { challengeId, emailNormalized, expiresAt, consumedAt };
}

function isExpired(expiresAt, now) {
  return Date.parse(expiresAt) <= Date.parse(now);
}

function sortByExpiration(left, right) {
  return (
    left.expiresAt.localeCompare(right.expiresAt) ||
    (left.sessionTokenHash ?? left.challengeId).localeCompare(
      right.sessionTokenHash ?? right.challengeId
    )
  );
}

function sortByConsumption(left, right) {
  return (
    left.consumedAt.localeCompare(right.consumedAt) ||
    left.challengeId.localeCompare(right.challengeId)
  );
}

class ScriptedCleanupClient {
  constructor(pool) {
    this.pool = pool;
    this.calls = [];
    this.releaseCalls = 0;
    this.releasedDiscarded = false;
    this.snapshot = null;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (normalized === 'BEGIN') {
      this.snapshot = cloneState(this.pool.state);
      return { rows: [] };
    }

    if (normalized === 'ROLLBACK') {
      if (this.pool.failRollback) {
        throw new Error('forced cleanup rollback failure');
      }

      this.pool.state = cloneState(this.snapshot);
      this.snapshot = null;
      return { rows: [] };
    }

    if (normalized === 'COMMIT') {
      this.snapshot = null;

      if (
        this.pool.commitFailureAfterApply &&
        !this.pool.commitFailureRaised
      ) {
        this.pool.commitFailureRaised = true;
        throw new Error('forced cleanup commit acknowledgement failure');
      }

      return { rows: [] };
    }

    if (normalized.includes('DELETE FROM auth_sessions')) {
      return this.deleteSessions(normalized, params);
    }

    if (
      normalized.includes('DELETE FROM email_magic_link_challenges')
    ) {
      return this.deleteChallenges(normalized, params);
    }

    throw new Error(`Unexpected cleanup SQL: ${normalized}`);
  }

  deleteSessions(normalized, params) {
    if (this.pool.failPhase === 'expired-sessions') {
      throw new Error('forced expired-session cleanup failure');
    }

    const now = params[0];
    const batchSize = params[1];
    const selected = this.pool.state.sessions
      .filter((candidate) => isExpired(candidate.expiresAt, now))
      .sort(sortByExpiration)
      .slice(0, batchSize);
    const selectedHashes = new Set(
      selected.map((candidate) => candidate.sessionTokenHash)
    );

    this.pool.state.sessions = this.pool.state.sessions.filter(
      (candidate) => !selectedHashes.has(candidate.sessionTokenHash)
    );

    assert.match(normalized, /FOR UPDATE SKIP LOCKED/u);
    return {
      rows: selected.map((candidate) => ({
        session_token_hash: candidate.sessionTokenHash
      }))
    };
  }

  deleteChallenges(normalized, params) {
    const consumedPhase = normalized.includes(
      'WHERE consumed_at IS NOT NULL'
    );
    const phase = consumedPhase
      ? 'consumed-challenges'
      : 'expired-unconsumed-challenges';

    if (this.pool.failPhase === phase) {
      throw new Error(`forced ${phase} cleanup failure`);
    }

    const batchSize = params.at(-1);
    const selected = this.pool.state.challenges
      .filter((candidate) =>
        consumedPhase
          ? candidate.consumedAt !== null
          : candidate.consumedAt === null && isExpired(candidate.expiresAt, params[0])
      )
      .sort(consumedPhase ? sortByConsumption : sortByExpiration)
      .slice(0, batchSize);
    const selectedIds = new Set(
      selected.map((candidate) => candidate.challengeId)
    );

    this.pool.state.challenges = this.pool.state.challenges.filter(
      (candidate) => !selectedIds.has(candidate.challengeId)
    );

    assert.match(normalized, /FOR UPDATE SKIP LOCKED/u);
    return {
      rows: selected.map((candidate) => ({
        challenge_id: candidate.challengeId
      }))
    };
  }

  release(discard) {
    this.releaseCalls += 1;
    this.releasedDiscarded = discard === true;

    if (this.pool.failRelease) {
      throw new Error('forced cleanup client release failure');
    }
  }
}

class ScriptedCleanupPool {
  constructor(state, options = {}) {
    this.state = state;
    this.failPhase = options.failPhase;
    this.failRollback = options.failRollback ?? false;
    this.failRelease = options.failRelease ?? false;
    this.commitFailureAfterApply = options.commitFailureAfterApply ?? false;
    this.commitFailureRaised = false;
    this.clients = [];
  }

  async connect() {
    const client = new ScriptedCleanupClient(this);
    this.clients.push(client);
    return client;
  }
}

function emptyState() {
  return { sessions: [], challenges: [] };
}

function phaseCallCounts(client) {
  return {
    begin: client.calls.filter((call) => call.sql === 'BEGIN').length,
    commit: client.calls.filter((call) => call.sql === 'COMMIT').length,
    rollback: client.calls.filter((call) => call.sql === 'ROLLBACK').length,
    cleanup: client.calls.filter((call) => call.sql.includes('DELETE FROM')).length
  };
}

test('AuthLifecycleCleanup captures one Clock instant per phase and validates the bounded policy', async () => {
  const calls = [];
  let clockCalls = 0;
  const repository = {
    async cleanupExpiredSessions(input) {
      calls.push(['sessions', input]);
      return { moreWork: false };
    },
    async cleanupExpiredUnconsumedChallenges(input) {
      calls.push(['expired-challenges', input]);
      return { moreWork: false };
    },
    async cleanupConsumedChallenges(input) {
      calls.push(['consumed-challenges', input]);
      return { moreWork: false };
    }
  };
  const cleanup = new AuthLifecycleCleanup(
    repository,
    {
      now() {
        clockCalls += 1;
        return NOW;
      }
    },
    { batchSize: 7 }
  );

  await cleanup.cleanupExpiredSessions();
  await cleanup.cleanupExpiredUnconsumedChallenges();
  await cleanup.cleanupConsumedChallenges();

  assert.equal(clockCalls, 3);
  assert.deepEqual(calls, [
    ['sessions', { now: NOW, batchSize: 7 }],
    ['expired-challenges', { now: NOW, batchSize: 7 }],
    ['consumed-challenges', { now: NOW, batchSize: 7 }]
  ]);
  assert.equal(AUTH_LIFECYCLE_CLEANUP_DEFAULT_BATCH_SIZE, 100);
  assert.throws(
    () => new AuthLifecycleCleanup(repository, { now: () => NOW }, { batchSize: 101 }),
    /batch size must be an integer/u
  );
});

test('expired-session cleanup deletes only expired rows and preserves valid sessions across users', async () => {
  const state = emptyState();
  state.sessions = [
    session('expired-a', 'user-a', EARLIER),
    session('valid-a', 'user-a', LATER),
    session('valid-b', 'user-b', LATER)
  ];
  const pool = new ScriptedCleanupPool(state);
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  const result = await repository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 100
  });

  assert.deepEqual(result, { moreWork: false });
  assert.deepEqual(state.sessions, [
    session('valid-a', 'user-a', LATER),
    session('valid-b', 'user-b', LATER)
  ]);
  assert.deepEqual(phaseCallCounts(pool.clients[0]), {
    begin: 1,
    commit: 1,
    rollback: 0,
    cleanup: 1
  });
  assert.equal(pool.clients[0].releasedDiscarded, false);
  assert.equal(pool.clients[0].releaseCalls, 1);
  assert.deepEqual(pool.clients[0].calls[1].params, [NOW, 100]);
});

test('expired-session selection is bounded and ordered by expiration then session hash', async () => {
  const state = emptyState();
  state.sessions = [
    session('later', 'user-a', LATER),
    session('tie-b', 'user-a', EARLIER),
    session('tie-a', 'user-b', EARLIER)
  ];
  const pool = new ScriptedCleanupPool(state);
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  const first = await repository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 2
  });
  const second = await repository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 2
  });

  assert.deepEqual(first, { moreWork: true });
  assert.deepEqual(second, { moreWork: false });
  assert.deepEqual(state.sessions, [session('later', 'user-a', LATER)]);
  assert.equal(pool.clients[0].calls[1].params[1], 2);
  assert.equal(pool.clients[1].calls[1].params[1], 2);
});

test('expired-unconsumed challenge cleanup preserves active and unrelated challenges', async () => {
  const state = emptyState();
  state.challenges = [
    challenge('expired-a', 'a@example.test', EARLIER),
    challenge('active-a', 'a@example.test', LATER),
    challenge('active-b', 'b@example.test', LATER),
    challenge('consumed-a', 'a@example.test', LATER, NOW)
  ];
  const pool = new ScriptedCleanupPool(state);
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  const result = await repository.cleanupExpiredUnconsumedChallenges({
    now: NOW,
    batchSize: 100
  });

  assert.deepEqual(result, { moreWork: false });
  assert.deepEqual(state.challenges, [
    challenge('active-a', 'a@example.test', LATER),
    challenge('active-b', 'b@example.test', LATER),
    challenge('consumed-a', 'a@example.test', LATER, NOW)
  ]);
  assert.deepEqual(pool.clients[0].calls[1].params, [NOW, 100]);
});

test('consumed challenge cleanup deletes committed consumed rows without touching active rows', async () => {
  const state = emptyState();
  state.challenges = [
    challenge('consumed-later', 'a@example.test', LATER, LATER),
    challenge('active', 'a@example.test', LATER),
    challenge('consumed-earlier', 'b@example.test', EARLIER, EARLIER)
  ];
  const pool = new ScriptedCleanupPool(state);
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  const result = await repository.cleanupConsumedChallenges({
    now: NOW,
    batchSize: 100
  });

  assert.deepEqual(result, { moreWork: false });
  assert.deepEqual(state.challenges, [
    challenge('active', 'a@example.test', LATER)
  ]);
  assert.deepEqual(pool.clients[0].calls[1].params, [100]);
});

test('repeated cleanup safely converges and returns only the bounded moreWork result', async () => {
  const state = emptyState();
  state.challenges = [
    challenge('consumed-1', 'a@example.test', LATER, NOW),
    challenge('consumed-2', 'b@example.test', LATER, NOW)
  ];
  const pool = new ScriptedCleanupPool(state);
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  const first = await repository.cleanupConsumedChallenges({
    now: NOW,
    batchSize: 1
  });
  const second = await repository.cleanupConsumedChallenges({
    now: NOW,
    batchSize: 1
  });
  const third = await repository.cleanupConsumedChallenges({
    now: NOW,
    batchSize: 1
  });

  assert.deepEqual(first, { moreWork: true });
  assert.deepEqual(second, { moreWork: true });
  assert.deepEqual(third, { moreWork: false });
  assert.deepEqual(state.challenges, []);
  assert.deepEqual(Object.keys(third), ['moreWork']);
});

test('each phase uses one client transaction and SKIP LOCKED without an email advisory lock', async () => {
  const state = emptyState();
  state.sessions = [session('expired', 'user-a', EARLIER)];
  state.challenges = [
    challenge('expired', 'a@example.test', EARLIER),
    challenge('consumed', 'a@example.test', LATER, NOW)
  ];
  const pool = new ScriptedCleanupPool(state);
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  await repository.cleanupExpiredSessions({ now: NOW, batchSize: 100 });
  await repository.cleanupExpiredUnconsumedChallenges({
    now: NOW,
    batchSize: 100
  });
  await repository.cleanupConsumedChallenges({ now: NOW, batchSize: 100 });

  assert.equal(pool.clients.length, 3);
  for (const client of pool.clients) {
    const counts = phaseCallCounts(client);
    assert.deepEqual(counts, {
      begin: 1,
      commit: 1,
      rollback: 0,
      cleanup: 1
    });
    assert.equal(client.releaseCalls, 1);
    assert.equal(client.releasedDiscarded, false);
    assert.equal(
      client.calls.some((call) => call.sql.includes('pg_advisory_xact_lock')),
      false
    );
    assert.equal(
      client.calls.some((call) => call.sql.includes('FOR UPDATE SKIP LOCKED')),
      true
    );
  }
});

test('independent workers converge safely without duplicate deletion ownership', async () => {
  const state = emptyState();
  state.sessions = [
    session('expired-a', 'user-a', EARLIER),
    session('expired-b', 'user-b', EARLIER)
  ];
  const firstPool = new ScriptedCleanupPool(state);
  const secondPool = new ScriptedCleanupPool(state);
  const firstRepository = new PostgresAuthLifecycleCleanupRepository(firstPool);
  const secondRepository = new PostgresAuthLifecycleCleanupRepository(secondPool);

  const first = await firstRepository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 1
  });
  const second = await secondRepository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 1
  });
  const repeat = await secondRepository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 1
  });

  assert.deepEqual(first, { moreWork: true });
  assert.deepEqual(second, { moreWork: true });
  assert.deepEqual(repeat, { moreWork: false });
  assert.deepEqual(state.sessions, []);
  assert.match(firstPool.clients[0].calls[1].sql, /FOR UPDATE SKIP LOCKED/u);
  assert.match(secondPool.clients[0].calls[1].sql, /FOR UPDATE SKIP LOCKED/u);
});

test('pre-commit cleanup failure rolls back and discards a client when rollback is unsafe', async () => {
  const state = emptyState();
  state.sessions = [session('expired', 'user-a', EARLIER)];
  const pool = new ScriptedCleanupPool(state, {
    failPhase: 'expired-sessions',
    failRollback: true
  });
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  await assert.rejects(
    repository.cleanupExpiredSessions({ now: NOW, batchSize: 100 }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.match(error.errors[0].message, /forced expired-session cleanup failure/u);
      assert.match(error.errors[1].message, /forced cleanup rollback failure/u);
      return true;
    }
  );

  assert.deepEqual(state.sessions, [session('expired', 'user-a', EARLIER)]);
  assert.deepEqual(phaseCallCounts(pool.clients[0]), {
    begin: 1,
    commit: 0,
    rollback: 1,
    cleanup: 1
  });
  assert.equal(pool.clients[0].releasedDiscarded, true);
  assert.equal(pool.clients[0].releaseCalls, 1);
});

test('ambiguous commit is not retried and a later invocation safely converges', async () => {
  const state = emptyState();
  state.sessions = [session('expired', 'user-a', EARLIER)];
  const pool = new ScriptedCleanupPool(state, {
    commitFailureAfterApply: true
  });
  const repository = new PostgresAuthLifecycleCleanupRepository(pool);

  await assert.rejects(
    repository.cleanupExpiredSessions({ now: NOW, batchSize: 100 }),
    /forced cleanup commit acknowledgement failure/u
  );

  assert.equal(pool.clients.length, 1);
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'COMMIT').length,
    1
  );
  assert.equal(
    pool.clients[0].calls.filter((call) => call.sql === 'ROLLBACK').length,
    0
  );
  assert.equal(pool.clients[0].releasedDiscarded, true);
  assert.deepEqual(state.sessions, []);

  const later = await repository.cleanupExpiredSessions({
    now: NOW,
    batchSize: 100
  });
  assert.deepEqual(later, { moreWork: false });
  assert.equal(pool.clients.length, 2);
});

test('consumed cleanup migration has the required narrow partial index shape', async () => {
  const migration = await readFile(
    new URL('../db/migrations/0005_auth_lifecycle_cleanup_index.sql', import.meta.url),
    'utf8'
  );
  const existingRuntimeMigration = await readFile(
    new URL('../db/migrations/0002_auth_runtime.sql', import.meta.url),
    'utf8'
  );

  assert.match(
    migration,
    /CREATE INDEX email_magic_link_challenges_consumed_at_idx[\s\S]*ON email_magic_link_challenges \(consumed_at, challenge_id\)[\s\S]*WHERE consumed_at IS NOT NULL/u
  );
  assert.equal((migration.match(/CREATE INDEX/gu) ?? []).length, 1);
  assert.doesNotMatch(migration, /BEGIN|COMMIT|ALTER TABLE|CREATE TABLE/iu);
  assert.match(
    existingRuntimeMigration,
    /auth_sessions_expires_at_idx[\s\S]*email_magic_link_challenges_expires_at_idx/u
  );
  assert.doesNotMatch(
    existingRuntimeMigration,
    /email_magic_link_challenges_consumed_at_idx/u
  );
});
