import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  PUSH_SUBSCRIPTION_STATUSES,
  PostgresNotificationPreferenceRepository,
  PostgresPushSubscriptionRepository,
  assertAuthKey,
  assertNotificationChannel,
  assertP256dhKey,
  assertPushSubscriptionEndpoint,
  createActivePushSubscription,
  createNotificationCategoryPreference,
  createNotificationChannelPreference,
  createNotificationIntent,
  createServerOwnedNotificationTypeDescriptor,
  toPushSubscriptionSafeMetadata,
  hashPushSubscriptionEndpoint
} from '../dist/notification-platform/index.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const NOW = '2026-08-29T12:00:00.000Z';
const LATER = '2026-08-29T13:00:00.000Z';
const ENDPOINT = 'https://push.example.test/subscription/opaque?token=a%2Fb';

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

function copyRow(row) {
  return row === undefined ? undefined : { ...row };
}

class NotificationSqlExecutor {
  constructor() {
    this.calls = [];
    this.channelPreferences = new Map();
    this.categoryPreferences = new Map();
    this.subscriptions = new Map();
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: [...params] });

    if (normalized.includes('INSERT INTO notification_channel_preferences')) {
      const [userId, channel, enabled, createdAt, updatedAt] = params;
      const key = `${userId}:${channel}`;
      const existing = this.channelPreferences.get(key);
      const row = {
        user_id: userId,
        channel,
        enabled,
        created_at: existing?.created_at ?? createdAt,
        updated_at: updatedAt
      };
      this.channelPreferences.set(key, row);
      return { rows: [copyRow(row)] };
    }

    if (normalized.startsWith('SELECT user_id, channel')) {
      const [userId, channel] = params;
      return {
        rows: [copyRow(this.channelPreferences.get(`${userId}:${channel}`))].filter(
          (row) => row !== undefined
        )
      };
    }

    if (normalized.includes('INSERT INTO notification_category_preferences')) {
      const [userId, category, enabled, createdAt, updatedAt] = params;
      const key = `${userId}:${category}`;
      const existing = this.categoryPreferences.get(key);
      const row = {
        user_id: userId,
        category,
        enabled,
        created_at: existing?.created_at ?? createdAt,
        updated_at: updatedAt
      };
      this.categoryPreferences.set(key, row);
      return { rows: [copyRow(row)] };
    }

    if (normalized.startsWith('SELECT user_id, category')) {
      const [userId, category] = params;
      return {
        rows: [copyRow(this.categoryPreferences.get(`${userId}:${category}`))].filter(
          (row) => row !== undefined
        )
      };
    }

    if (normalized.includes('INSERT INTO push_subscriptions')) {
      const [subscriptionId, userId, endpoint, endpointHash, p256dh, auth, createdAt, updatedAt] =
        params;
      const existing = [...this.subscriptions.values()].find(
        (row) => row.endpoint_hash === endpointHash && row.status === 'ACTIVE'
      );

      if (existing !== undefined) {
        if (existing.user_id !== userId) {
          return { rows: [] };
        }

        existing.endpoint = endpoint;
        existing.p256dh = p256dh;
        existing.auth = auth;
        existing.updated_at = updatedAt;
        return { rows: [copyRow(existing)] };
      }

      const row = {
        subscription_id: subscriptionId,
        user_id: userId,
        endpoint,
        endpoint_hash: endpointHash,
        p256dh,
        auth,
        created_at: createdAt,
        updated_at: updatedAt,
        last_success_at: null,
        status: 'ACTIVE',
        invalidated_at: null
      };
      this.subscriptions.set(subscriptionId, row);
      return { rows: [copyRow(row)] };
    }

    if (normalized.startsWith('SELECT 1 AS active')) {
      const [endpointHash] = params;
      return {
        rows: [...this.subscriptions.values()].some(
          (row) => row.endpoint_hash === endpointHash && row.status === 'ACTIVE'
        )
          ? [{ active: 1 }]
          : []
      };
    }

    if (normalized.startsWith('SELECT subscription_id, user_id')) {
      const [userId] = params;
      return {
        rows: [...this.subscriptions.values()]
          .filter((row) => row.user_id === userId && row.status === 'ACTIVE')
          .sort(
            (left, right) =>
              left.created_at.localeCompare(right.created_at) ||
              left.subscription_id.localeCompare(right.subscription_id)
          )
          .map(copyRow)
      };
    }

    if (normalized.startsWith('DELETE FROM push_subscriptions')) {
      const [userId, subscriptionId] = params;
      const row = this.subscriptions.get(subscriptionId);
      if (row === undefined || row.user_id !== userId) {
        return { rows: [] };
      }

      this.subscriptions.delete(subscriptionId);
      return { rows: [{ subscription_id: subscriptionId }] };
    }

    if (normalized.startsWith('UPDATE push_subscriptions')) {
      const [subscriptionId, invalidatedAt] = params;
      const row = this.subscriptions.get(subscriptionId);
      if (row === undefined || row.status !== 'ACTIVE') {
        return { rows: [] };
      }

      row.status = 'INVALIDATED';
      row.invalidated_at = invalidatedAt;
      row.updated_at = invalidatedAt;
      return { rows: [{ subscription_id: subscriptionId }] };
    }

    throw new Error(`Unexpected notification SQL: ${normalized}`);
  }
}

function registration(
  subscriptionId,
  ownerId,
  {
    endpoint = ENDPOINT,
    p256dh = 'p256dh-key',
    auth = 'auth-key',
    createdAt = NOW,
    updatedAt = NOW
  } = {}
) {
  return {
    subscriptionId,
    ownerId,
    endpoint,
    p256dh,
    auth,
    createdAt,
    updatedAt
  };
}

test('notification domain is closed, minimal, provider-neutral, and sanitized', () => {
  assert.deepEqual(NOTIFICATION_CATEGORIES, [
    'ACCOUNT',
    'SYSTEM',
    'ASTROLOGY_ALERT'
  ]);
  assert.deepEqual(NOTIFICATION_CHANNELS, ['WEB_PUSH']);
  assert.deepEqual(PUSH_SUBSCRIPTION_STATUSES, ['ACTIVE', 'INVALIDATED']);
  assert.throws(() => assertNotificationChannel('EMAIL'), /channel is invalid/u);

  const notificationType = createServerOwnedNotificationTypeDescriptor({
    category: 'SYSTEM',
    key: 'test-only.future-type'
  });
  const intentInput = {
    intentId: 'intent-1',
    ownerId: 'user-1',
    category: 'SYSTEM',
    notificationType,
    createdAt: NOW,
    deliverAt: LATER,
    dedupeKey: 'dedupe-1',
    referenceId: 'server-reference-1'
  };
  const originalInput = { ...intentInput };
  const intent = createNotificationIntent(intentInput);

  assert.deepEqual(intentInput, originalInput);
  assert.equal(Object.isFrozen(intent), true);
  assert.equal(Object.isFrozen(notificationType), true);
  assert.equal('endpoint' in intent, false);
  assert.equal('payload' in intent, false);
  assert.equal('title' in intent, false);
  assert.equal('body' in intent, false);
  assert.equal('birthData' in intent, false);
  assert.throws(
    () =>
      createNotificationIntent({
        ...intentInput,
        category: 'ACCOUNT'
      }),
    /notificationType is invalid/u
  );

  const secretEndpoint = 'https://push.example.test/private/secret-token';
  assert.throws(
    () => assertPushSubscriptionEndpoint(`http://push.example.test/${secretEndpoint}`),
    (error) => {
      assert.equal(error.message.includes(secretEndpoint), false);
      return true;
    }
  );
  assert.throws(() => assertPushSubscriptionEndpoint(`${ENDPOINT}#fragment`), /endpoint is invalid/u);
  assert.throws(() => assertPushSubscriptionEndpoint('https://user:pass@push.example.test/sub'), /endpoint is invalid/u);
  assert.throws(() => assertP256dhKey('p256dh=with-padding'), /p256dh is invalid/u);
  assert.throws(() => assertAuthKey('auth key with spaces'), /auth is invalid/u);
});

test('preferences remain explicit, owner-scoped, and separate from entitlement', async () => {
  const executor = new NotificationSqlExecutor();
  const repository = new PostgresNotificationPreferenceRepository(executor);

  assert.equal(await repository.findChannelPreference('user-a', 'WEB_PUSH'), null);
  assert.equal(await repository.findCategoryPreference('user-a', 'ACCOUNT'), null);

  const channel = createNotificationChannelPreference({
    ownerId: 'user-a',
    channel: 'WEB_PUSH',
    enabled: false,
    createdAt: NOW,
    updatedAt: NOW
  });
  const category = createNotificationCategoryPreference({
    ownerId: 'user-a',
    category: 'ACCOUNT',
    enabled: true,
    createdAt: NOW,
    updatedAt: LATER
  });

  assert.deepEqual(await repository.setChannelPreference(channel), channel);
  assert.deepEqual(await repository.setCategoryPreference(category), category);
  assert.deepEqual(
    await repository.findChannelPreference('user-a', 'WEB_PUSH'),
    channel
  );
  assert.deepEqual(
    await repository.findCategoryPreference('user-a', 'ACCOUNT'),
    category
  );
  assert.equal(await repository.findChannelPreference('user-b', 'WEB_PUSH'), null);
  assert.equal(await repository.findCategoryPreference('user-b', 'ACCOUNT'), null);
  await assert.rejects(
    () => repository.findCategoryPreference('user-a', 'EMAIL'),
    /category is invalid/u
  );
});

test('same-owner registration is idempotent and updates only the owner subscription material', async () => {
  const executor = new NotificationSqlExecutor();
  const repository = new PostgresPushSubscriptionRepository(executor);
  const first = await repository.register(registration('subscription-a', 'user-a'));
  const second = await repository.register(
    registration('subscription-b', 'user-a', {
      p256dh: 'new-p256dh-key',
      auth: 'new-auth-key',
      updatedAt: LATER
    })
  );

  assert.equal(first.outcome, 'CREATED');
  assert.equal(second.outcome, 'UPDATED_EXISTING_OWNER');
  assert.equal(second.subscription.subscriptionId, 'subscription-a');
  assert.equal(second.subscription.p256dh, 'new-p256dh-key');
  assert.equal(second.subscription.auth, 'new-auth-key');
  assert.equal(second.subscription.createdAt, NOW);
  assert.equal(second.subscription.updatedAt, LATER);
  assert.equal((await repository.listActiveForOwner('user-a')).length, 1);
});

test('cross-owner registration returns a bounded conflict without transfer or owner disclosure', async () => {
  const executor = new NotificationSqlExecutor();
  const repository = new PostgresPushSubscriptionRepository(executor);
  const first = await repository.register(registration('subscription-a', 'user-a'));
  const before = structuredClone(first.subscription);
  const conflict = await repository.register(
    registration('subscription-b', 'user-b', {
      p256dh: 'user-b-p256dh',
      auth: 'user-b-auth',
      updatedAt: LATER
    })
  );

  assert.deepEqual(conflict, { outcome: 'OWNERSHIP_CONFLICT' });
  assert.deepEqual(await repository.listActiveForOwner('user-a'), [before]);
  assert.deepEqual(await repository.listActiveForOwner('user-b'), []);
  assert.equal('ownerId' in conflict, false);
  assert.equal('endpoint' in conflict, false);
  assert.equal('p256dh' in conflict, false);
  assert.equal('auth' in conflict, false);
});

test('the unique active-owner boundary handles simultaneous competing registrations', async () => {
  const executor = new NotificationSqlExecutor();
  const repository = new PostgresPushSubscriptionRepository(executor);
  const results = await Promise.all([
    repository.register(registration('subscription-a', 'user-a')),
    repository.register(registration('subscription-b', 'user-b'))
  ]);

  assert.deepEqual(
    results.map((result) => result.outcome).sort(),
    ['CREATED', 'OWNERSHIP_CONFLICT']
  );
  assert.equal(
    [...executor.subscriptions.values()].filter((row) => row.status === 'ACTIVE').length,
    1
  );
});

test('invalidation releases an endpoint while preserving preferences and allowing later explicit registration', async () => {
  const executor = new NotificationSqlExecutor();
  const preferences = new PostgresNotificationPreferenceRepository(executor);
  const subscriptions = new PostgresPushSubscriptionRepository(executor);
  await preferences.setCategoryPreference(
    createNotificationCategoryPreference({
      ownerId: 'user-a',
      category: 'SYSTEM',
      enabled: true,
      createdAt: NOW,
      updatedAt: NOW
    })
  );
  const first = await subscriptions.register(registration('subscription-a', 'user-a'));

  assert.equal(await subscriptions.invalidate('subscription-a', LATER), true);
  assert.deepEqual(await subscriptions.listActiveForOwner('user-a'), []);
  assert.deepEqual(
    await preferences.findCategoryPreference('user-a', 'SYSTEM'),
    createNotificationCategoryPreference({
      ownerId: 'user-a',
      category: 'SYSTEM',
      enabled: true,
      createdAt: NOW,
      updatedAt: NOW
    })
  );

  const later = await subscriptions.register(
    registration('subscription-b', 'user-a', {
      p256dh: 'later-p256dh-key',
      auth: 'later-auth-key',
      createdAt: LATER,
      updatedAt: LATER
    })
  );
  assert.equal(later.outcome, 'CREATED');
  assert.equal(later.subscription.status, 'ACTIVE');
  assert.equal(executor.subscriptions.get(first.subscription.subscriptionId).status, 'INVALIDATED');
  assert.equal((await subscriptions.listActiveForOwner('user-a')).length, 1);
});

test('removal is owner-scoped and safe metadata excludes all transport credentials', async () => {
  const executor = new NotificationSqlExecutor();
  const repository = new PostgresPushSubscriptionRepository(executor);
  const created = await repository.register(registration('subscription-a', 'user-a'));
  const record = created.subscription;
  const metadata = toPushSubscriptionSafeMetadata(record);

  assert.equal(await repository.removeForOwner('user-b', record.subscriptionId), false);
  assert.equal(await repository.removeForOwner('user-a', record.subscriptionId), true);
  assert.equal(await repository.invalidate(record.subscriptionId, LATER), false);
  assert.equal('endpoint' in metadata, false);
  assert.equal('endpointHash' in metadata, false);
  assert.equal('p256dh' in metadata, false);
  assert.equal('auth' in metadata, false);
  assert.deepEqual(metadata, {
    subscriptionId: 'subscription-a',
    channel: 'WEB_PUSH',
    status: 'ACTIVE',
    createdAt: NOW,
    updatedAt: NOW,
    lastSuccessAt: null,
    invalidatedAt: null
  });
});

test('migration and source assertions preserve bounded persistence and atomic ownership semantics', async () => {
  const migrationNames = (await readdir(new URL('server/db/migrations/', REPOSITORY_ROOT)))
    .filter((fileName) => fileName.startsWith('0008_'));
  assert.deepEqual(migrationNames, ['0008_notification_persistence_foundation.sql']);

  const migration = await readFile(
    new URL(
      'server/db/migrations/0008_notification_persistence_foundation.sql',
      REPOSITORY_ROOT
    ),
    'utf8'
  );
  assert.match(migration, /CREATE TABLE notification_channel_preferences/u);
  assert.match(migration, /CREATE TABLE notification_category_preferences/u);
  assert.match(migration, /CREATE TABLE push_subscriptions/u);
  assert.match(migration, /channel = 'WEB_PUSH'/u);
  assert.match(migration, /category IN \('ACCOUNT', 'SYSTEM', 'ASTROLOGY_ALERT'\)/u);
  assert.match(migration, /status IN \('ACTIVE', 'INVALIDATED'\)/u);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX push_subscriptions_active_endpoint_hash_unique_idx[\s\S]*WHERE status = 'ACTIVE'/u
  );
  assert.match(migration, /notification_channel_preferences_user_fk[\s\S]*ON DELETE CASCADE/u);
  assert.match(migration, /notification_category_preferences_user_fk[\s\S]*ON DELETE CASCADE/u);
  assert.match(migration, /push_subscriptions_user_fk[\s\S]*ON DELETE CASCADE/u);
  assert.doesNotMatch(
    migration,
    /notification_intents|outbox|delivery|billing|entitlement|scheduler/iu
  );

  const pushRepository = await readFile(
    new URL(
      'server/src/notification-platform/postgres/postgres-push-subscription-repository.ts',
      REPOSITORY_ROOT
    ),
    'utf8'
  );
  assert.match(
    pushRepository,
    /ON CONFLICT \(endpoint_hash\) WHERE status = 'ACTIVE'[\s\S]*WHERE push_subscriptions\.user_id = EXCLUDED\.user_id/u
  );
  assert.doesNotMatch(pushRepository, /SET\s+user_id\s*=/u);
  assert.match(pushRepository, /SELECT 1 AS active[\s\S]*endpoint_hash = \$1/u);

  const sourceFiles = await Promise.all(
    [
      'server/src/notification-platform/notification-domain.ts',
      'server/src/notification-platform/preferences.ts',
      'server/src/notification-platform/push-subscription.ts',
      'server/src/notification-platform/repositories.ts',
      'server/src/notification-platform/postgres/postgres-notification-preference-repository.ts',
      'server/src/notification-platform/postgres/postgres-push-subscription-repository.ts'
    ].map((fileName) => readFile(new URL(fileName, REPOSITORY_ROOT), 'utf8'))
  );
  const source = sourceFiles.join('\n');
  assert.doesNotMatch(source, /fetch\s*\(|navigator\.|serviceWorker|VAPID|console\.|logger/iu);
  assert.doesNotMatch(source, /notificationType.*(?:title|body|birth|chart|transit|aspect)/isu);
  assert.equal(hashPushSubscriptionEndpoint(ENDPOINT).length, 64);
  assert.equal(createActivePushSubscription(registration('subscription-test', 'user-a')).endpoint, ENDPOINT);
});
