import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  NotificationDeliveryWorker,
  PostgresNotificationDeliveryWorkerRepository,
  boundedRetryAfterSeconds,
  notificationRetryDelaySeconds
} from '../dist/notification-platform/index.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const OWNER_ID = 'user-1';
const INTENT_ID = 'intent-1';
const SUBSCRIPTION_ID = 'subscription-1';
const DELIVERY_ID = 'delivery-1';
const CLAIM_TOKEN = 'claim-token-1';
const NOTIFICATION_TYPE_KEY = 'system.digest';
const CATEGORY = 'SYSTEM';
const NOW = new Date('2026-08-29T12:00:00.000Z');
const FIRST_ATTEMPT_AT = new Date('2026-08-29T12:00:00.000Z');
const CLAIM_EXPIRES_AT = new Date('2026-08-29T12:02:00.000Z');
const ENDPOINT = 'https://push.example.test/subscription-1';
const ENDPOINT_HASH = createHash('sha256').update(ENDPOINT).digest('hex');
const VALID_PAYLOAD = {
  version: 1,
  title: 'NatalNode',
  body: 'A bounded notification is available.',
  path: '/account/notifications'
};

function clone(value) {
  return structuredClone(value);
}

function makeDueRow(deliveryId = DELIVERY_ID) {
  return {
    delivery_id: deliveryId,
    intent_id: INTENT_ID,
    owner_id: OWNER_ID,
    subscription_id: SUBSCRIPTION_ID,
    category: CATEGORY,
    channel: 'WEB_PUSH',
    notification_type_key: NOTIFICATION_TYPE_KEY
  };
}

function makeClaimedRow({
  deliveryId = DELIVERY_ID,
  claimToken = CLAIM_TOKEN,
  claimExpiresAt = CLAIM_EXPIRES_AT,
  attemptCount = 1,
  firstAttemptAt = FIRST_ATTEMPT_AT
} = {}) {
  return {
    delivery_id: deliveryId,
    claim_token: claimToken,
    claim_expires_at: claimExpiresAt,
    attempt_count: attemptCount,
    first_attempt_at: firstAttemptAt
  };
}

function makeSubscriptionRow({
  subscriptionId = SUBSCRIPTION_ID,
  ownerId = OWNER_ID,
  status = 'ACTIVE'
} = {}) {
  return {
    subscription_id: subscriptionId,
    user_id: ownerId,
    endpoint: ENDPOINT,
    endpoint_hash: ENDPOINT_HASH,
    p256dh: 'transport-credential-p256dh',
    auth: 'transport-credential-auth',
    created_at: NOW,
    updated_at: NOW,
    last_success_at: null,
    status,
    invalidated_at: status === 'ACTIVE' ? null : NOW
  };
}

function makeDeliveryRow({
  deliveryId = DELIVERY_ID,
  intentId = INTENT_ID,
  ownerId = OWNER_ID,
  subscriptionId = SUBSCRIPTION_ID,
  state = 'PROCESSING',
  attemptCount = 1,
  claimToken = CLAIM_TOKEN,
  claimExpiresAt = CLAIM_EXPIRES_AT,
  firstAttemptAt = FIRST_ATTEMPT_AT,
  databaseNow = NOW
} = {}) {
  return {
    delivery_id: deliveryId,
    intent_id: intentId,
    owner_id: ownerId,
    subscription_id: subscriptionId,
    state,
    attempt_count: attemptCount,
    claim_token: claimToken,
    claim_expires_at: claimExpiresAt,
    first_attempt_at: firstAttemptAt,
    database_now: databaseNow
  };
}

function makeIntentRow({
  intentId = INTENT_ID,
  ownerId = OWNER_ID,
  category = CATEGORY,
  channel = 'WEB_PUSH',
  notificationTypeKey = NOTIFICATION_TYPE_KEY,
  payload = VALID_PAYLOAD,
  payloadVersion = 1
} = {}) {
  return {
    intent_id: intentId,
    owner_id: ownerId,
    category,
    channel,
    notification_type_key: notificationTypeKey,
    payload_version: payloadVersion,
    payload_json: clone(payload)
  };
}

class ScriptedPool {
  constructor({
    dueRows = [],
    claimedRows = [],
    databaseNow = NOW,
    expiredRows = [],
    ownerRows = [{ user_id: OWNER_ID }],
    channelPreferenceRows = [{ enabled: true }],
    categoryPreferenceRows = [{ enabled: true }],
    subscriptionRows = [makeSubscriptionRow()],
    deliveryRows = [makeDeliveryRow()],
    intentRows = [makeIntentRow()],
    mutationRowCounts = []
  } = {}) {
    this.dueRows = dueRows.map(clone);
    this.claimedRows = claimedRows.map(clone);
    this.databaseNow = databaseNow;
    this.expiredRows = expiredRows.map(clone);
    this.ownerRows = ownerRows.map(clone);
    this.channelPreferenceRows = channelPreferenceRows.map(clone);
    this.categoryPreferenceRows = categoryPreferenceRows.map(clone);
    this.subscriptionRows = subscriptionRows.map(clone);
    this.deliveryRows = deliveryRows.map(clone);
    this.intentRows = intentRows.map(clone);
    this.mutationRowCounts = [...mutationRowCounts];
    this.calls = [];
    this.clients = [];
  }

  async connect() {
    const client = new ScriptedPoolClient(this);
    this.clients.push(client);
    return client;
  }
}

class ScriptedPoolClient {
  constructor(pool) {
    this.pool = pool;
    this.released = false;
    this.inTransaction = false;
  }

  async query(sql, params = []) {
    const normalized = sql.replace(/\s+/gu, ' ').trim();
    this.pool.calls.push({ sql: normalized, params: [...params] });

    if (normalized === 'BEGIN') {
      this.inTransaction = true;
      return { rows: [] };
    }
    if (normalized === 'COMMIT') {
      assert.equal(this.inTransaction, true);
      this.inTransaction = false;
      return { rows: [] };
    }
    if (normalized === 'ROLLBACK') {
      this.inTransaction = false;
      return { rows: [] };
    }

    assert.equal(this.inTransaction, true, normalized);

    if (normalized.startsWith('SELECT CURRENT_TIMESTAMP AS database_now')) {
      return { rows: [{ database_now: this.pool.databaseNow }] };
    }
    if (normalized.startsWith('SELECT d.delivery_id')) {
      return { rows: this.pool.dueRows.map(clone) };
    }
    if (normalized.startsWith("UPDATE notification_deliveries SET state = 'PROCESSING'")) {
      const row = this.pool.claimedRows.length > 0
        ? this.pool.claimedRows.shift()
        : makeClaimedRow({ claimToken: params[1] });
      return { rows: [clone({ ...row, claim_token: params[1] })] };
    }
    if (normalized.startsWith('SELECT delivery_id, attempt_count, first_attempt_at')) {
      return { rows: this.pool.expiredRows.map(clone) };
    }
    if (normalized.startsWith('SELECT user_id FROM users')) {
      return { rows: this.pool.ownerRows.map(clone) };
    }
    if (normalized.startsWith('SELECT enabled FROM notification_channel_preferences')) {
      return { rows: this.pool.channelPreferenceRows.map(clone) };
    }
    if (normalized.startsWith('SELECT enabled FROM notification_category_preferences')) {
      return { rows: this.pool.categoryPreferenceRows.map(clone) };
    }
    if (normalized.startsWith('SELECT subscription_id, user_id, endpoint')) {
      return { rows: this.pool.subscriptionRows.map(clone) };
    }
    if (normalized.startsWith('SELECT delivery_id, intent_id, owner_id, subscription_id')) {
      return { rows: this.pool.deliveryRows.map(clone) };
    }
    if (normalized.startsWith('SELECT intent_id, owner_id, category, channel')) {
      return { rows: this.pool.intentRows.map(clone) };
    }
    if (normalized.startsWith('UPDATE notification_deliveries')) {
      const rowCount = this.pool.mutationRowCounts.length > 0
        ? this.pool.mutationRowCounts.shift()
        : 1;
      return { rows: [], rowCount };
    }
    if (normalized.startsWith('UPDATE push_subscriptions')) {
      const rowCount = this.pool.mutationRowCounts.length > 0
        ? this.pool.mutationRowCounts.shift()
        : 1;
      return { rows: [], rowCount };
    }

    throw new Error('Unsupported scripted SQL: ' + normalized);
  }

  release() {
    this.released = true;
  }
}

function makeRepositoryPool(options = {}) {
  return new ScriptedPool(options);
}

function makeRepository(pool) {
  let tokenCounter = 0;
  return new PostgresNotificationDeliveryWorkerRepository(pool, {
    generate() {
      tokenCounter += 1;
      return 'generated-claim-' + String(tokenCounter);
    }
  });
}

function makeClaim(overrides = {}) {
  return {
    deliveryId: DELIVERY_ID,
    intentId: INTENT_ID,
    ownerId: OWNER_ID,
    subscriptionId: SUBSCRIPTION_ID,
    category: CATEGORY,
    channel: 'WEB_PUSH',
    notificationTypeKey: NOTIFICATION_TYPE_KEY,
    claimToken: CLAIM_TOKEN,
    claimExpiresAt: CLAIM_EXPIRES_AT.toISOString(),
    attemptCount: 1,
    firstAttemptAt: FIRST_ATTEMPT_AT.toISOString(),
    ...overrides
  };
}

function makeEligibility(result = true) {
  return {
    available: true,
    async isEligible() {
      return result;
    }
  };
}

function makeTransport(outcome, calls = []) {
  return {
    async send(input) {
      calls.push(input);
      return outcome;
    }
  };
}

function mutationCalls(pool) {
  return pool.calls.filter((call) => call.sql.startsWith('UPDATE '));
}

test('migration adds a durable first-attempt timestamp without rewriting 0009', async () => {
  const migration = await readFile(
    new URL('../db/migrations/0010_notification_delivery_first_attempt_at.sql', import.meta.url),
    'utf8'
  );
  const previousMigration = await readFile(
    new URL('../db/migrations/0009_notification_delivery_foundation.sql', import.meta.url),
    'utf8'
  );

  assert.match(migration, /ALTER TABLE notification_deliveries/u);
  assert.match(migration, /ADD COLUMN first_attempt_at TIMESTAMPTZ/u);
  assert.doesNotMatch(migration, /created_at|deliver_at|BEGIN|COMMIT/iu);
  assert.doesNotMatch(previousMigration, /first_attempt_at/u);
});

test('migration loader accepts the additive 0010 artifact', async () => {
  const migrations = await loadPostgresMigrations(
    fileURLToPath(new URL('../db/migrations/', import.meta.url))
  );
  const migration = migrations.find(({ version }) => version === '0010');

  assert.equal(migration?.filename, '0010_notification_delivery_first_attempt_at.sql');
  assert.match(migration?.executableSql ?? '', /ALTER TABLE notification_deliveries/u);
  assert.match(migration?.executableSql ?? '', /ADD COLUMN first_attempt_at TIMESTAMPTZ/u);
});

test('claim uses deterministic order, SKIP LOCKED, fresh tokens, two-minute leases, and first-attempt persistence', async () => {
  const pool = makeRepositoryPool({
    dueRows: [makeDueRow('delivery-a'), makeDueRow('delivery-b')]
  });
  const repository = makeRepository(pool);

  const claims = await repository.claimDueDeliveries(2);

  assert.deepEqual(
    claims.map((claim) => claim.claimToken),
    ['generated-claim-1', 'generated-claim-2']
  );
  const dueQuery = pool.calls.find((call) => call.sql.startsWith('SELECT d.delivery_id'));
  assert.match(dueQuery.sql, /ORDER BY d\.next_attempt_at ASC, d\.delivery_id ASC/u);
  assert.match(dueQuery.sql, /FOR UPDATE OF d SKIP LOCKED/u);
  const claimQueries = pool.calls.filter((call) => call.sql.startsWith("UPDATE notification_deliveries SET state = 'PROCESSING'"));
  assert.equal(claimQueries.length, 2);
  assert.equal(claimQueries[0].params[2], 120);
  assert.equal(claimQueries[0].params[3], 5);
  assert.equal(claimQueries[0].params[1], 'generated-claim-1');
  assert.equal(claimQueries[1].params[1], 'generated-claim-2');
  assert.match(claimQueries[0].sql, /first_attempt_at = COALESCE\(first_attempt_at, CURRENT_TIMESTAMP\)/u);
  assert.equal(pool.clients[0].released, true);
});

test('expired recovery schedules remaining attempts and terminalizes exhausted or horizon-invalid claims', async () => {
  const pool = makeRepositoryPool({
    expiredRows: [
      {
        delivery_id: 'delivery-retry',
        attempt_count: 1,
        first_attempt_at: FIRST_ATTEMPT_AT
      },
      {
        delivery_id: 'delivery-dead',
        attempt_count: 5,
        first_attempt_at: FIRST_ATTEMPT_AT
      }
    ]
  });
  const repository = makeRepository(pool);

  assert.equal(await repository.recoverExpiredClaims(50), 2);
  const recoveries = mutationCalls(pool);
  assert.equal(recoveries.length, 2);
  assert.match(recoveries[0].sql, /state = 'RETRYABLE'/u);
  assert.equal(recoveries[0].params[0], 'delivery-retry');
  assert.equal(recoveries[0].params[1].toISOString(), '2026-08-29T12:01:00.000Z');
  assert.match(recoveries[1].sql, /state = 'DEAD'/u);
  assert.equal(recoveries[1].params[0], 'delivery-dead');
});

test('final-send transaction locks authority rows in order and persists ACCEPTED without exposing credentials', async () => {
  const pool = makeRepositoryPool();
  const repository = makeRepository(pool);
  const transportCalls = [];

  const result = await repository.processClaimedDelivery(makeClaim(), {
    eligibility: makeEligibility(true),
    transport: makeTransport({ outcome: 'ACCEPTED' }, transportCalls),
    transportAttemptTimeoutMillis: 30_000
  });

  assert.deepEqual(result, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'DELIVERED'
  });
  assert.equal(transportCalls.length, 1);
  assert.deepEqual(transportCalls[0].payload, VALID_PAYLOAD);
  assert.equal(transportCalls[0].subscription.endpoint, ENDPOINT);
  const selectCalls = pool.calls.filter((call) => call.sql.startsWith('SELECT '));
  assert.match(selectCalls[0].sql, /FROM users/u);
  assert.match(selectCalls[0].sql, /FOR KEY SHARE/u);
  assert.match(selectCalls[1].sql, /notification_channel_preferences/u);
  assert.match(selectCalls[1].sql, /FOR SHARE/u);
  assert.match(selectCalls[2].sql, /notification_category_preferences/u);
  assert.match(selectCalls[2].sql, /FOR SHARE/u);
  assert.match(selectCalls[3].sql, /FROM push_subscriptions/u);
  assert.match(selectCalls[3].sql, /FOR UPDATE/u);
  assert.match(selectCalls[4].sql, /FROM notification_deliveries/u);
  assert.match(selectCalls[4].sql, /FOR UPDATE/u);
  assert.equal(mutationCalls(pool).length, 1);
  assert.match(mutationCalls(pool)[0].sql, /state = 'DELIVERED'/u);
  assert.equal(pool.calls.some((call) => call.sql.includes('console')), false);
});

test('wrong token and insufficient lease cannot invoke transport or overwrite delivery state', async () => {
  const transportCalls = [];
  const wrongTokenPool = makeRepositoryPool({
    deliveryRows: [makeDeliveryRow({ claimToken: 'newer-token' })]
  });
  const wrongTokenResult = await makeRepository(wrongTokenPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'ACCEPTED' }, transportCalls),
      transportAttemptTimeoutMillis: 30_000
    }
  );

  assert.deepEqual(wrongTokenResult, {
    outcome: 'SKIPPED',
    deliveryId: DELIVERY_ID,
    reason: 'STALE_CLAIM'
  });
  assert.equal(transportCalls.length, 0);
  assert.equal(mutationCalls(wrongTokenPool).length, 0);

  const shortLeasePool = makeRepositoryPool({
    deliveryRows: [
      makeDeliveryRow({
        claimExpiresAt: new Date('2026-08-29T12:00:20.000Z')
      })
    ]
  });
  const shortLeaseResult = await makeRepository(shortLeasePool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'ACCEPTED' }, transportCalls),
      transportAttemptTimeoutMillis: 30_000
    }
  );

  assert.deepEqual(shortLeaseResult, {
    outcome: 'SKIPPED',
    deliveryId: DELIVERY_ID,
    reason: 'INSUFFICIENT_LEASE'
  });
  assert.equal(transportCalls.length, 0);
  assert.equal(mutationCalls(shortLeasePool).length, 0);
});

test('final authority revalidation cancels for disabled preferences, revoked eligibility, and inactive or cross-owner targets', async () => {
  const disabledChannelPool = makeRepositoryPool({ channelPreferenceRows: [] });
  const disabledChannelResult = await makeRepository(disabledChannelPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'ACCEPTED' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(disabledChannelResult, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'CANCELLED'
  });
  assert.equal(mutationCalls(disabledChannelPool)[0].params[2], 'CHANNEL_NOT_ENABLED');

  const disabledCategoryPool = makeRepositoryPool({ categoryPreferenceRows: [] });
  const disabledCategoryResult = await makeRepository(disabledCategoryPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'ACCEPTED' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(disabledCategoryResult, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'CANCELLED'
  });
  assert.equal(mutationCalls(disabledCategoryPool)[0].params[2], 'CATEGORY_NOT_ENABLED');

  const revokedPool = makeRepositoryPool();
  const revokedResult = await makeRepository(revokedPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(false),
      transport: makeTransport({ outcome: 'ACCEPTED' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(revokedResult, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'CANCELLED'
  });
  assert.equal(mutationCalls(revokedPool)[0].params[2], 'TRUSTED_ELIGIBILITY_REVOKED');

  const inactivePool = makeRepositoryPool({
    subscriptionRows: [makeSubscriptionRow({ status: 'INVALIDATED' })]
  });
  const inactiveResult = await makeRepository(inactivePool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'ACCEPTED' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(inactiveResult, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'CANCELLED'
  });
  assert.equal(mutationCalls(inactivePool)[0].params[2], 'SUBSCRIPTION_NOT_ACTIVE');

  const crossOwnerPool = makeRepositoryPool({
    subscriptionRows: [makeSubscriptionRow({ ownerId: 'user-2' })]
  });
  const crossOwnerResult = await makeRepository(crossOwnerPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'ACCEPTED' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(crossOwnerResult, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'CANCELLED'
  });
  assert.equal(mutationCalls(crossOwnerPool)[0].params[2], 'INELIGIBLE');
});

test('all bounded transport outcomes persist only their frozen state transitions', async () => {
  const cases = [
    { outcome: { outcome: 'ACCEPTED' }, state: 'DELIVERED' },
    { outcome: { outcome: 'SUBSCRIPTION_INVALID' }, state: 'DEAD' },
    { outcome: { outcome: 'THROTTLED', retryAfterSeconds: 3_600 }, state: 'RETRYABLE' },
    { outcome: { outcome: 'TRANSIENT_UPSTREAM' }, state: 'RETRYABLE' },
    { outcome: { outcome: 'TIMEOUT_AMBIGUOUS' }, state: 'RETRYABLE' },
    { outcome: { outcome: 'PAYLOAD_INVALID' }, state: 'DEAD' },
    { outcome: { outcome: 'PERMANENT_FAILURE' }, state: 'DEAD' }
  ];

  for (const entry of cases) {
    const pool = makeRepositoryPool();
    const result = await makeRepository(pool).processClaimedDelivery(makeClaim(), {
      eligibility: makeEligibility(true),
      transport: makeTransport(entry.outcome),
      transportAttemptTimeoutMillis: 30_000
    });

    assert.deepEqual(result, {
      outcome: 'PERSISTED',
      deliveryId: DELIVERY_ID,
      state: entry.state
    }, entry.outcome.outcome);

    if (entry.outcome.outcome === 'SUBSCRIPTION_INVALID') {
      const invalidation = mutationCalls(pool)[0];
      assert.match(invalidation.sql, /WHERE subscription_id = \$1 AND status = 'ACTIVE'/u);
      assert.deepEqual(invalidation.params, [SUBSCRIPTION_ID]);
    }
  }
});

test('Retry-After is bounded and never reduces the deterministic base delay or exceeds the horizon', async () => {
  assert.equal(notificationRetryDelaySeconds(1), 60);
  assert.equal(notificationRetryDelaySeconds(2), 300);
  assert.equal(notificationRetryDelaySeconds(3), 1_800);
  assert.equal(notificationRetryDelaySeconds(4), 7_200);
  assert.equal(notificationRetryDelaySeconds(5), null);
  assert.equal(boundedRetryAfterSeconds(3_600), 3_600);
  assert.equal(boundedRetryAfterSeconds(3_601), undefined);
  assert.equal(boundedRetryAfterSeconds(-1), undefined);

  const pool = makeRepositoryPool();
  const result = await makeRepository(pool).processClaimedDelivery(makeClaim(), {
    eligibility: makeEligibility(true),
    transport: makeTransport({
      outcome: 'THROTTLED',
      retryAfterSeconds: 3_600
    }),
    transportAttemptTimeoutMillis: 30_000
  });
  assert.deepEqual(result, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'RETRYABLE'
  });
  const retry = mutationCalls(pool).find((call) => call.sql.includes("state = 'RETRYABLE'"));
  assert.equal(retry.params[2].toISOString(), '2026-08-29T13:00:00.000Z');

  const exhaustedPool = makeRepositoryPool({
    deliveryRows: [makeDeliveryRow({ attemptCount: 5 })]
  });
  const exhausted = await makeRepository(exhaustedPool).processClaimedDelivery(makeClaim(), {
    eligibility: makeEligibility(true),
    transport: makeTransport({ outcome: 'TIMEOUT_AMBIGUOUS' }),
    transportAttemptTimeoutMillis: 30_000
  });
  assert.deepEqual(exhausted, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'DEAD'
  });
  assert.match(mutationCalls(exhaustedPool).at(-1).sql, /state = 'DEAD'/u);

  const horizonPool = makeRepositoryPool({
    deliveryRows: [
      makeDeliveryRow({
        firstAttemptAt: new Date('2026-08-28T11:59:00.000Z')
      })
    ]
  });
  const beyondHorizon = await makeRepository(horizonPool).processClaimedDelivery(makeClaim(), {
    eligibility: makeEligibility(true),
    transport: makeTransport({ outcome: 'TRANSIENT_UPSTREAM' }),
    transportAttemptTimeoutMillis: 30_000
  });
  assert.deepEqual(beyondHorizon, {
    outcome: 'PERSISTED',
    deliveryId: DELIVERY_ID,
    state: 'DEAD'
  });
});

test('defensive configuration or eligibility unavailability stops without invalidation or success', async () => {
  const configurationPool = makeRepositoryPool();
  const configurationResult = await makeRepository(configurationPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: makeEligibility(true),
      transport: makeTransport({ outcome: 'CONFIGURATION_UNAVAILABLE' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(configurationResult, {
    outcome: 'CONFIGURATION_UNAVAILABLE',
    deliveryId: DELIVERY_ID
  });
  assert.equal(mutationCalls(configurationPool).length, 0);

  const eligibilityPool = makeRepositoryPool();
  const eligibilityResult = await makeRepository(eligibilityPool).processClaimedDelivery(
    makeClaim(),
    {
      eligibility: {
        available: false,
        async isEligible() {
          return true;
        }
      },
      transport: makeTransport({ outcome: 'ACCEPTED' }),
      transportAttemptTimeoutMillis: 30_000
    }
  );
  assert.deepEqual(eligibilityResult, {
    outcome: 'ELIGIBILITY_UNAVAILABLE',
    deliveryId: DELIVERY_ID
  });
  assert.equal(mutationCalls(eligibilityPool).length, 0);
});

test('bounded worker gates readiness, keeps HTTP-independent repository orchestration, and honors shutdown', async () => {
  class FakeWorkerRepository {
    constructor(resultQueue = []) {
      this.resultQueue = [...resultQueue];
      this.recoverCalls = 0;
      this.claimCalls = 0;
      this.processCalls = 0;
    }

    async recoverExpiredClaims() {
      this.recoverCalls += 1;
      return 2;
    }

    async claimDueDeliveries() {
      this.claimCalls += 1;
      return [makeClaim({ deliveryId: 'delivery-a' }), makeClaim({ deliveryId: 'delivery-b' })];
    }

    async processClaimedDelivery() {
      this.processCalls += 1;
      return this.resultQueue.shift() ?? {
        outcome: 'PERSISTED',
        deliveryId: DELIVERY_ID,
        state: 'DELIVERED'
      };
    }
  }

  const unavailableRepository = new FakeWorkerRepository();
  const unavailableWorker = new NotificationDeliveryWorker({
    readiness: { status: 'UNCONFIGURED' },
    repository: unavailableRepository,
    transport: makeTransport({ outcome: 'ACCEPTED' }),
    eligibility: makeEligibility(true)
  });
  assert.equal((await unavailableWorker.runOnce()).status, 'CONFIGURATION_UNAVAILABLE');
  assert.equal(unavailableRepository.claimCalls, 0);

  const stopRepository = new FakeWorkerRepository([
    { outcome: 'CONFIGURATION_UNAVAILABLE', deliveryId: 'delivery-a' },
    { outcome: 'PERSISTED', deliveryId: 'delivery-b', state: 'DELIVERED' }
  ]);
  const stopWorker = new NotificationDeliveryWorker({
    readiness: { status: 'READY' },
    repository: stopRepository,
    transport: makeTransport({ outcome: 'ACCEPTED' }),
    eligibility: makeEligibility(true)
  });
  const stopResult = await stopWorker.runOnce();
  assert.equal(stopResult.status, 'CONFIGURATION_UNAVAILABLE');
  assert.equal(stopRepository.processCalls, 1);

  const shutdownRepository = new FakeWorkerRepository();
  const shutdownWorker = new NotificationDeliveryWorker({
    readiness: { status: 'READY' },
    repository: shutdownRepository,
    transport: makeTransport({ outcome: 'ACCEPTED' }),
    eligibility: makeEligibility(true)
  });
  shutdownWorker.requestShutdown();
  const shutdownResult = await shutdownWorker.runOnce();
  assert.equal(shutdownResult.status, 'SHUTDOWN');
  assert.equal(shutdownRepository.recoverCalls, 0);
  assert.equal(shutdownRepository.claimCalls, 0);
});

test('worker source keeps the dedicated boundary out of HTTP and public development composition', async () => {
  const runLocalSource = await readFile(
    new URL('../src/executable/run-local-development-composition.ts', import.meta.url),
    'utf8'
  );
  const bootstrapSource = await readFile(
    new URL('../src/runtime/bootstrap/create-server-bootstrap.ts', import.meta.url),
    'utf8'
  );
  const workerSource = await readFile(
    new URL('../src/notification-platform/postgres/postgres-notification-delivery-worker-repository.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(runLocalSource, /NotificationDeliveryWorker|notification-worker/u);
  assert.doesNotMatch(bootstrapSource, /NotificationDeliveryWorker|notification-worker/u);
  assert.match(workerSource, /FOR KEY SHARE/u);
  assert.match(workerSource, /FOR SHARE/u);
  assert.match(workerSource, /FOR UPDATE/u);
  assert.match(workerSource, /claim_token = \$2/u);
  assert.doesNotMatch(workerSource, /console\.(?:log|error|warn)/u);
});
