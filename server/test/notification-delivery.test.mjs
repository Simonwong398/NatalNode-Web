import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertWebPushPayloadV1,
  NotificationEnqueueService,
  NotificationPayloadValidationError,
  PostgresNotificationEnqueueRepository,
  createServerOwnedNotificationTypeDescriptor
} from '../dist/notification-platform/index.js';

const OWNER_ID = 'user-1';
const OTHER_OWNER_ID = 'user-2';
const CATEGORY = 'SYSTEM';
const NOTIFICATION_TYPE = createServerOwnedNotificationTypeDescriptor({
  category: CATEGORY,
  key: 'system.digest'
});
const NOW = '2026-08-29T12:00:00.000Z';
const LATER = '2026-08-29T12:05:00.000Z';
const VALID_PAYLOAD = {
  version: 1,
  title: 'NatalNode',
  body: 'A bounded system update is available.',
  path: '/account/notifications'
};

function preferenceKey(ownerId, category) {
  return ownerId + '|' + category;
}

function createState() {
  return {
    users: new Set(),
    channelPreferences: new Map(),
    categoryPreferences: new Map(),
    subscriptions: new Map(),
    intents: new Map(),
    deliveries: new Map()
  };
}

function cloneState(source) {
  return {
    users: new Set(source.users),
    channelPreferences: new Map(source.channelPreferences),
    categoryPreferences: new Map(source.categoryPreferences),
    subscriptions: new Map(
      Array.from(source.subscriptions, ([key, value]) => [
        key,
        structuredClone(value)
      ])
    ),
    intents: new Map(
      Array.from(source.intents, ([key, value]) => [
        key,
        structuredClone(value)
      ])
    ),
    deliveries: new Map(
      Array.from(source.deliveries, ([key, value]) => [
        key,
        structuredClone(value)
      ])
    )
  };
}

class FakePool {
  constructor() {
    this.state = createState();
    this.advisoryLocks = new Map();
    this.failDeliveryInsertAt = null;
    this.hideNextIntentLookup = false;
    this.forceUniqueConflict = false;
  }

  async connect() {
    return new FakePoolClient(this);
  }

  addUser(userId) {
    this.state.users.add(userId);
  }

  setChannelPreference(ownerId, enabled) {
    this.state.channelPreferences.set(ownerId, enabled);
  }

  setCategoryPreference(ownerId, category, enabled) {
    this.state.categoryPreferences.set(
      preferenceKey(ownerId, category),
      enabled
    );
  }

  addSubscription({
    subscriptionId,
    ownerId = OWNER_ID,
    status = 'ACTIVE',
    createdAt = NOW
  }) {
    this.state.subscriptions.set(subscriptionId, {
      subscription_id: subscriptionId,
      user_id: ownerId,
      status,
      created_at: createdAt,
      endpoint: 'https://push.example.test/' + subscriptionId,
      p256dh: 'transport-credential-p256dh',
      auth: 'transport-credential-auth'
    });
  }

  deleteSubscription(subscriptionId) {
    this.state.subscriptions.delete(subscriptionId);
    for (const [deliveryId, delivery] of this.state.deliveries) {
      if (delivery.subscription_id === subscriptionId) {
        this.state.deliveries.delete(deliveryId);
      }
    }
  }

  deleteUser(userId) {
    const subscriptionIds = new Set(
      Array.from(this.state.subscriptions.values())
        .filter((subscription) => subscription.user_id === userId)
        .map((subscription) => subscription.subscription_id)
    );
    const intentIds = new Set(
      Array.from(this.state.intents.values())
        .filter((intent) => intent.owner_id === userId)
        .map((intent) => intent.intent_id)
    );

    this.state.users.delete(userId);
    this.state.channelPreferences.delete(userId);
    this.state.categoryPreferences.delete(preferenceKey(userId, CATEGORY));

    for (const subscriptionId of subscriptionIds) {
      this.state.subscriptions.delete(subscriptionId);
    }
    for (const intentId of intentIds) {
      this.state.intents.delete(intentId);
    }
    for (const [deliveryId, delivery] of this.state.deliveries) {
      if (
        delivery.owner_id === userId ||
        intentIds.has(delivery.intent_id) ||
        subscriptionIds.has(delivery.subscription_id)
      ) {
        this.state.deliveries.delete(deliveryId);
      }
    }
  }
}

class FakePoolClient {
  constructor(pool) {
    this.pool = pool;
    this.state = null;
    this.inTransaction = false;
    this.advisoryRelease = null;
    this.deliveryInsertCount = 0;
    this.released = false;
  }

  async query(sql, params = []) {
    const normalized = sql.replace(/\s+/gu, ' ').trim();

    if (normalized === 'BEGIN') {
      this.state = cloneState(this.pool.state);
      this.inTransaction = true;
      return { rows: [] };
    }

    if (normalized === 'COMMIT') {
      assert.equal(this.inTransaction, true);
      this.pool.state = this.state;
      this.finishAdvisoryLock();
      this.state = null;
      this.inTransaction = false;
      return { rows: [] };
    }

    if (normalized === 'ROLLBACK') {
      this.finishAdvisoryLock();
      this.state = null;
      this.inTransaction = false;
      return { rows: [] };
    }

    if (normalized.startsWith('SELECT pg_advisory_xact_lock(')) {
      await this.acquireAdvisoryLock(String(params[0]) + ':' + String(params[1]));
      return { rows: [] };
    }

    assert.equal(this.inTransaction, true);

    if (
      normalized.startsWith(
        'SELECT user_id FROM users WHERE user_id = $1 FOR KEY SHARE'
      )
    ) {
      return {
        rows: this.state.users.has(params[0])
          ? [{ user_id: params[0] }]
          : []
      };
    }

    if (
      normalized.startsWith(
        'SELECT intent_id, owner_id, category, channel, notification_type_key'
      )
    ) {
      if (this.pool.hideNextIntentLookup) {
        this.pool.hideNextIntentLookup = false;
        return { rows: [] };
      }
      const row = Array.from(this.state.intents.values()).find(
        (intent) =>
          intent.owner_id === params[0] &&
          intent.category === params[1] &&
          intent.channel === 'WEB_PUSH' &&
          intent.notification_type_key === params[2] &&
          intent.dedupe_key === params[3]
      );
      return { rows: row === undefined ? [] : [structuredClone(row)] };
    }

    if (
      normalized.startsWith(
        'SELECT delivery_id, intent_id, owner_id, subscription_id'
      )
    ) {
      return {
        rows: Array.from(this.state.deliveries.values())
          .filter((delivery) => delivery.intent_id === params[0])
          .sort((left, right) =>
            left.delivery_id.localeCompare(right.delivery_id)
          )
          .map((delivery) => structuredClone(delivery))
      };
    }

    if (
      normalized.startsWith(
        'SELECT enabled FROM notification_channel_preferences'
      )
    ) {
      const enabled = this.state.channelPreferences.get(params[0]);
      return { rows: enabled === undefined ? [] : [{ enabled }] };
    }

    if (
      normalized.startsWith(
        'SELECT enabled FROM notification_category_preferences'
      )
    ) {
      const enabled = this.state.categoryPreferences.get(
        preferenceKey(params[0], params[1])
      );
      return { rows: enabled === undefined ? [] : [{ enabled }] };
    }

    if (
      normalized.startsWith(
        'SELECT subscription_id, user_id FROM push_subscriptions'
      )
    ) {
      return {
        rows: Array.from(this.state.subscriptions.values())
          .filter(
            (subscription) =>
              subscription.user_id === params[0] &&
              subscription.status === 'ACTIVE'
          )
          .sort(
            (left, right) =>
              left.created_at.localeCompare(right.created_at) ||
              left.subscription_id.localeCompare(right.subscription_id)
          )
          .map(({ subscription_id, user_id }) => ({
            subscription_id,
            user_id
          }))
      };
    }

    if (normalized.startsWith('INSERT INTO notification_intents')) {
      const intent = {
        intent_id: params[0],
        owner_id: params[1],
        category: params[2],
        channel: 'WEB_PUSH',
        notification_type_key: params[3],
        template_key: params[4],
        template_version: params[5],
        payload_version: params[6],
        payload_json: structuredClone(params[7]),
        dedupe_key: params[8],
        deliver_at: params[9],
        created_at: params[10],
        updated_at: params[11],
        completed_at: params[12]
      };
      const duplicate = Array.from(this.state.intents.values()).some(
        (existing) =>
          existing.owner_id === intent.owner_id &&
          existing.category === intent.category &&
          existing.channel === intent.channel &&
          existing.notification_type_key === intent.notification_type_key &&
          existing.dedupe_key === intent.dedupe_key
      );
      if (duplicate) {
        if (this.pool.forceUniqueConflict) {
          this.pool.forceUniqueConflict = false;
          return { rows: [] };
        }
        throw new Error('duplicate notification intent');
      }
      this.state.intents.set(intent.intent_id, intent);
      return { rows: [{ intent_id: intent.intent_id }] };
    }

    if (normalized.startsWith('INSERT INTO notification_deliveries')) {
      this.deliveryInsertCount += 1;
      if (this.pool.failDeliveryInsertAt === this.deliveryInsertCount) {
        throw new Error('simulated delivery insert failure');
      }
      const delivery = {
        delivery_id: params[0],
        intent_id: params[1],
        owner_id: params[2],
        subscription_id: params[3],
        state: params[4],
        attempt_count: params[5],
        next_attempt_at: params[6],
        claim_token: params[7],
        claim_expires_at: params[8],
        last_failure_class: params[9],
        cancel_reason: params[10],
        created_at: params[11],
        updated_at: params[12],
        last_attempt_at: params[13],
        delivered_at: params[14],
        terminal_at: params[15]
      };
      this.state.deliveries.set(delivery.delivery_id, delivery);
      return { rows: [] };
    }

    throw new Error('Unsupported fake SQL: ' + normalized);
  }

  async acquireAdvisoryLock(key) {
    const previous = this.pool.advisoryLocks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    this.pool.advisoryLocks.set(key, current);
    await previous;
    this.state = cloneState(this.pool.state);
    this.advisoryRelease = () => {
      release();
      if (this.pool.advisoryLocks.get(key) === current) {
        this.pool.advisoryLocks.delete(key);
      }
    };
  }

  finishAdvisoryLock() {
    if (this.advisoryRelease !== null) {
      const release = this.advisoryRelease;
      this.advisoryRelease = null;
      release();
    }
  }

  release() {
    this.finishAdvisoryLock();
    this.released = true;
  }
}

function createHarness({
  channelPreference = true,
  categoryPreference = true,
  subscriptions = [{ subscriptionId: 'subscription-1', status: 'ACTIVE' }],
  renderPayload = () => VALID_PAYLOAD
} = {}) {
  const pool = new FakePool();
  pool.addUser(OWNER_ID);
  pool.addUser(OTHER_OWNER_ID);

  if (channelPreference !== 'missing') {
    pool.setChannelPreference(OWNER_ID, channelPreference);
  }
  if (categoryPreference !== 'missing') {
    pool.setCategoryPreference(OWNER_ID, CATEGORY, categoryPreference);
  }
  for (const [index, subscription] of subscriptions.entries()) {
    const record =
      typeof subscription === 'string'
        ? {
            subscriptionId: 'subscription-' + String(index + 1),
            status: subscription
          }
        : subscription;
    pool.addSubscription(record);
  }

  let nextId = 0;
  const renderCount = { value: 0 };
  const templates = {
    resolve(notificationType) {
      return {
        category: notificationType.category,
        notificationTypeKey: notificationType.key,
        templateKey: 'system-digest',
        templateVersion: 1,
        render() {
          renderCount.value += 1;
          return renderPayload();
        }
      };
    }
  };
  const repository = new PostgresNotificationEnqueueRepository(pool, {
    generate() {
      nextId += 1;
      return 'notification-' + String(nextId);
    }
  });
  const service = new NotificationEnqueueService({
    repository,
    templates,
    clock: {
      now() {
        return NOW;
      }
    }
  });

  return {
    pool,
    service,
    renderCount,
    enqueue(overrides = {}) {
      return service.enqueue({
        ownerId: OWNER_ID,
        category: CATEGORY,
        notificationType: NOTIFICATION_TYPE,
        dedupeKey: 'system-digest-2026-08-29',
        trustedEligibility: true,
        ...overrides
      });
    }
  };
}

test('0009 migration freezes the B4B1 tables, indexes, cascades, and privacy boundary', async () => {
  const migration = await readFile(
    new URL('../db/migrations/0009_notification_delivery_foundation.sql', import.meta.url),
    'utf8'
  );
  const accountExportSource = await readFile(
    new URL(
      '../src/persistence/postgres/postgres-account-data-export-repository.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(migration, /CREATE TABLE notification_intents/u);
  assert.match(migration, /CREATE TABLE notification_deliveries/u);
  assert.match(migration, /template_version INTEGER NOT NULL/u);
  assert.match(
    migration,
    /UNIQUE\s*\(\s*owner_id,\s*category,\s*channel,\s*notification_type_key,\s*dedupe_key\s*\)/u
  );
  assert.match(
    migration,
    /notification_intents_owner_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    migration,
    /notification_deliveries_intent_fk[\s\S]*REFERENCES notification_intents \(intent_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    migration,
    /notification_deliveries_owner_fk[\s\S]*REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(
    migration,
    /notification_deliveries_subscription_fk[\s\S]*REFERENCES push_subscriptions \(subscription_id\)[\s\S]*ON DELETE CASCADE/u
  );
  for (const state of [
    'PENDING',
    'RETRYABLE',
    'PROCESSING',
    'DELIVERED',
    'DEAD',
    'CANCELLED'
  ]) {
    assert.match(migration, new RegExp("'" + state + "'", 'u'));
  }
  assert.match(migration, /notification_deliveries_due_idx/u);
  assert.match(migration, /notification_deliveries_expired_lease_idx/u);
  assert.match(migration, /notification_deliveries_owner_state_idx/u);
  assert.match(migration, /notification_deliveries_subscription_state_idx/u);
  assert.match(migration, /position\(chr\(92\) in/u);
  assert.doesNotMatch(migration, /endpoint|p256dh|auth|VAPID/iu);
  assert.doesNotMatch(
    accountExportSource,
    /notification_(?:intents|deliveries)/u
  );
});

test('enqueue gates fail closed for missing or disabled preferences, eligibility, and subscriptions', async () => {
  const cases = [
    {
      name: 'missing channel preference',
      options: { channelPreference: 'missing' },
      reason: 'CHANNEL_NOT_ENABLED'
    },
    {
      name: 'null channel preference',
      options: { channelPreference: null },
      reason: 'CHANNEL_NOT_ENABLED'
    },
    {
      name: 'false channel preference',
      options: { channelPreference: false },
      reason: 'CHANNEL_NOT_ENABLED'
    },
    {
      name: 'missing category preference',
      options: { categoryPreference: 'missing' },
      reason: 'CATEGORY_NOT_ENABLED'
    },
    {
      name: 'null category preference',
      options: { categoryPreference: null },
      reason: 'CATEGORY_NOT_ENABLED'
    },
    {
      name: 'false category preference',
      options: { categoryPreference: false },
      reason: 'CATEGORY_NOT_ENABLED'
    },
    {
      name: 'trusted eligibility false',
      options: {},
      enqueue: { trustedEligibility: false },
      reason: 'INELIGIBLE'
    },
    {
      name: 'no active subscription',
      options: { subscriptions: [] },
      reason: 'NO_ACTIVE_SUBSCRIPTIONS'
    },
    {
      name: 'only invalidated subscriptions',
      options: {
        subscriptions: [
          { subscriptionId: 'subscription-invalidated', status: 'INVALIDATED' }
        ]
      },
      reason: 'NO_ACTIVE_SUBSCRIPTIONS'
    }
  ];

  for (const entry of cases) {
    const harness = createHarness(entry.options);
    const result = await harness.enqueue(entry.enqueue);
    assert.deepEqual(result, {
      outcome: 'NOT_ENQUEUED',
      reason: entry.reason
    }, entry.name);
    assert.equal(harness.pool.state.intents.size, 0, entry.name);
    assert.equal(harness.pool.state.deliveries.size, 0, entry.name);
    assert.equal(harness.renderCount.value, 0, entry.name);
  }
});

test('eligible enqueue persists one immutable intent and one delivery for one active subscription', async () => {
  const sourcePayload = {
    version: 1,
    title: 'NatalNode',
    body: 'A bounded system update is available.',
    path: '/account/notifications'
  };
  const harness = createHarness({
    renderPayload: () => sourcePayload
  });
  const result = await harness.enqueue({ deliverAt: LATER });

  assert.equal(result.outcome, 'CREATED');
  assert.equal(result.intent.payloadVersion, 1);
  assert.deepEqual(result.intent.payload, sourcePayload);
  assert.equal(result.intent.deliverAt, LATER);
  assert.equal(result.deliveries.length, 1);
  assert.equal(result.deliveries[0].subscriptionId, 'subscription-1');
  assert.equal(result.deliveries[0].state, 'PENDING');
  assert.equal(result.deliveries[0].attemptCount, 0);
  assert.equal(result.deliveries[0].nextAttemptAt, LATER);
  assert.equal(harness.renderCount.value, 1);
  assert.equal(Object.isFrozen(result.intent), true);
  assert.equal(Object.isFrozen(result.intent.payload), true);

  sourcePayload.title = 'Changed after enqueue';
  assert.equal(result.intent.payload.title, 'NatalNode');
  assert.throws(() => {
    result.intent.payload.title = 'Caller mutation';
  }, TypeError);

  const persistedIntent = Array.from(harness.pool.state.intents.values())[0];
  const persistedDelivery = Array.from(
    harness.pool.state.deliveries.values()
  )[0];
  assert.equal(persistedIntent.payload_json.title, 'NatalNode');
  assert.equal('endpoint' in persistedIntent, false);
  assert.equal('p256dh' in persistedIntent, false);
  assert.equal('auth' in persistedIntent, false);
  assert.equal('endpoint' in persistedDelivery, false);
  assert.equal('p256dh' in persistedDelivery, false);
  assert.equal('auth' in persistedDelivery, false);
});

test('fan-out includes every active subscription and excludes invalidated subscriptions', async () => {
  const harness = createHarness({
    subscriptions: [
      { subscriptionId: 'subscription-a', status: 'ACTIVE', createdAt: NOW },
      { subscriptionId: 'subscription-b', status: 'INVALIDATED', createdAt: NOW },
      { subscriptionId: 'subscription-c', status: 'ACTIVE', createdAt: LATER }
    ]
  });
  const result = await harness.enqueue();

  assert.equal(result.outcome, 'CREATED');
  assert.deepEqual(
    result.deliveries.map((delivery) => delivery.subscriptionId),
    ['subscription-a', 'subscription-c']
  );
  assert.equal(harness.pool.state.intents.size, 1);
  assert.equal(harness.pool.state.deliveries.size, 2);
  assert.equal(
    new Set(
      Array.from(harness.pool.state.deliveries.values()).map(
        (delivery) => delivery.intent_id
      )
    ).size,
    1
  );
});

test('unsafe payload is rejected before any persistence', async () => {
  const harness = createHarness({
    renderPayload: () => ({
      version: 1,
      title: 'Unsafe',
      body: 'This must not be persisted.',
      path: 'https://outside.example'
    })
  });

  await assert.rejects(
    harness.enqueue(),
    (error) => error instanceof NotificationPayloadValidationError
  );
  assert.equal(harness.pool.state.intents.size, 0);
  assert.equal(harness.pool.state.deliveries.size, 0);
  assert.equal(harness.renderCount.value, 1);
});

test('payload Unicode bounds count code points and reject over-bound emoji', () => {
  const valid = assertWebPushPayloadV1({
    version: 1,
    title: '😀'.repeat(80),
    body: '🪐'.repeat(160)
  });
  assert.equal(Array.from(valid.title).length, 80);
  assert.equal(Array.from(valid.body).length, 160);

  assert.throws(() => {
    assertWebPushPayloadV1({
      version: 1,
      title: '😀'.repeat(81),
      body: 'Within the bound.'
    });
  }, NotificationPayloadValidationError);
});

test('duplicate enqueue reuses the existing intent without re-rendering or refanning', async () => {
  const harness = createHarness({
    subscriptions: [
      { subscriptionId: 'subscription-a', status: 'ACTIVE' },
      { subscriptionId: 'subscription-b', status: 'ACTIVE' }
    ]
  });
  const first = await harness.enqueue();
  const second = await harness.enqueue();

  assert.equal(first.outcome, 'CREATED');
  assert.equal(second.outcome, 'DUPLICATE');
  assert.equal(second.intent.intentId, first.intent.intentId);
  assert.deepEqual(
    second.deliveries.map((delivery) => delivery.deliveryId),
    first.deliveries.map((delivery) => delivery.deliveryId)
  );
  assert.equal(harness.renderCount.value, 1);
  assert.equal(harness.pool.state.intents.size, 1);
  assert.equal(harness.pool.state.deliveries.size, 2);
});

test('concurrent duplicate enqueue serializes the frozen dedupe tuple', async () => {
  const harness = createHarness();
  const results = await Promise.all(
    Array.from({ length: 5 }, () => harness.enqueue())
  );

  assert.deepEqual(
    results.map((result) => result.outcome).sort(),
    ['CREATED', 'DUPLICATE', 'DUPLICATE', 'DUPLICATE', 'DUPLICATE']
  );
  assert.equal(harness.renderCount.value, 1);
  assert.equal(harness.pool.state.intents.size, 1);
  assert.equal(harness.pool.state.deliveries.size, 1);
});

test('database unique conflict is resolved without leaving the transaction aborted', async () => {
  const harness = createHarness();
  const first = await harness.enqueue();

  harness.pool.hideNextIntentLookup = true;
  harness.pool.forceUniqueConflict = true;
  const conflicted = await harness.enqueue();
  const afterConflict = await harness.enqueue();

  assert.equal(first.outcome, 'CREATED');
  assert.equal(conflicted.outcome, 'DUPLICATE');
  assert.equal(afterConflict.outcome, 'DUPLICATE');
  assert.equal(conflicted.intent.intentId, first.intent.intentId);
  assert.equal(afterConflict.intent.intentId, first.intent.intentId);
  assert.equal(harness.pool.state.intents.size, 1);
  assert.equal(harness.pool.state.deliveries.size, 1);
});

test('intent and fan-out creation roll back atomically on delivery failure', async () => {
  const harness = createHarness({
    subscriptions: [
      { subscriptionId: 'subscription-a', status: 'ACTIVE' },
      { subscriptionId: 'subscription-b', status: 'ACTIVE' }
    ]
  });
  harness.pool.failDeliveryInsertAt = 2;

  await assert.rejects(harness.enqueue());
  assert.equal(harness.pool.state.intents.size, 0);
  assert.equal(harness.pool.state.deliveries.size, 0);

  harness.pool.failDeliveryInsertAt = null;
  const result = await harness.enqueue();
  assert.equal(result.outcome, 'CREATED');
  assert.equal(harness.pool.state.intents.size, 1);
  assert.equal(harness.pool.state.deliveries.size, 2);
});

test('account deletion removes account-owned intents and deliveries through cascade semantics', async () => {
  const harness = createHarness();
  const result = await harness.enqueue();
  assert.equal(result.outcome, 'CREATED');

  harness.pool.deleteUser(OWNER_ID);

  assert.equal(harness.pool.state.users.has(OWNER_ID), false);
  assert.equal(harness.pool.state.intents.size, 0);
  assert.equal(harness.pool.state.deliveries.size, 0);
});

test('hard subscription deletion removes only target deliveries and preserves the intent and other devices', async () => {
  const harness = createHarness({
    subscriptions: [
      { subscriptionId: 'subscription-a', status: 'ACTIVE' },
      { subscriptionId: 'subscription-b', status: 'ACTIVE' }
    ]
  });
  const result = await harness.enqueue();
  assert.equal(result.outcome, 'CREATED');

  harness.pool.deleteSubscription('subscription-a');

  assert.equal(harness.pool.state.intents.size, 1);
  assert.deepEqual(
    Array.from(harness.pool.state.deliveries.values()).map(
      (delivery) => delivery.subscription_id
    ),
    ['subscription-b']
  );
  assert.equal(harness.pool.state.users.has(OWNER_ID), true);
});
