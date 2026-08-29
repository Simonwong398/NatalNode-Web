import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import {
  assertNotificationCategory,
  assertNotificationDedupeKey,
  assertNotificationTypeKey,
  assertOwnerAccountId,
  assertServerIdentifier,
  assertServerTimestamp,
  type NotificationCategory
} from '../notification-domain.js';
import {
  assertNotificationTemplateVersion,
  createNotificationDeliveryRecord,
  createNotificationIntentRecord,
  isNotificationCancelReason,
  isNotificationDeliveryState,
  isNotificationFailureClass,
  type NotificationDeliveryRecord,
  type NotificationEnqueueResult,
  type NotificationFailureClass,
  type NotificationCancelReason,
  type NotificationIntentRecord
} from '../notification-delivery-domain.js';
import type {
  NotificationEnqueuePersistenceInput,
  NotificationEnqueueRepository
} from '../notification-enqueue-repository.js';
import { PostgresClientSqlExecutor } from '../../persistence/postgres/postgres-client-sql-executor.js';
import { assertWebPushPayloadV1 } from '../web-push-payload.js';
import type { IdGenerator } from '../../app/creation-boundaries.js';

interface NotificationIntentRow {
  readonly intent_id: string;
  readonly owner_id: string;
  readonly category: NotificationCategory;
  readonly channel: 'WEB_PUSH';
  readonly notification_type_key: string;
  readonly template_key: string;
  readonly template_version: number;
  readonly payload_version: number;
  readonly payload_json: unknown;
  readonly dedupe_key: string;
  readonly deliver_at: Date | string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly completed_at: Date | string | null;
}

interface InsertedIntentRow {
  readonly intent_id: string;
}

interface NotificationDeliveryRow {
  readonly delivery_id: string;
  readonly intent_id: string;
  readonly owner_id: string;
  readonly subscription_id: string;
  readonly state: string;
  readonly attempt_count: number;
  readonly next_attempt_at: Date | string | null;
  readonly claim_token: string | null;
  readonly claim_expires_at: Date | string | null;
  readonly last_failure_class: string | null;
  readonly cancel_reason: string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly last_attempt_at: Date | string | null;
  readonly delivered_at: Date | string | null;
  readonly terminal_at: Date | string | null;
}

interface PreferenceRow {
  readonly enabled: boolean;
}

interface ActiveSubscriptionRow {
  readonly subscription_id: string;
  readonly user_id: string;
}

interface UserRow {
  readonly user_id: string;
}

const LOCK_OWNER_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR KEY SHARE`;

const ACQUIRE_DEDUPE_LOCK_SQL =
  'SELECT pg_advisory_xact_lock($1, $2)';

const FIND_INTENT_BY_DEDUPE_SQL = `
  SELECT
    intent_id,
    owner_id,
    category,
    channel,
    notification_type_key,
    template_key,
    template_version,
    payload_version,
    payload_json,
    dedupe_key,
    deliver_at,
    created_at,
    updated_at,
    completed_at
  FROM notification_intents
  WHERE owner_id = $1
    AND category = $2
    AND channel = 'WEB_PUSH'
    AND notification_type_key = $3
    AND dedupe_key = $4`;

const FIND_DELIVERIES_BY_INTENT_SQL = `
  SELECT
    delivery_id,
    intent_id,
    owner_id,
    subscription_id,
    state,
    attempt_count,
    next_attempt_at,
    claim_token,
    claim_expires_at,
    last_failure_class,
    cancel_reason,
    created_at,
    updated_at,
    last_attempt_at,
    delivered_at,
    terminal_at
  FROM notification_deliveries
  WHERE intent_id = $1
  ORDER BY delivery_id ASC`;

const FIND_CHANNEL_PREFERENCE_SQL = `
  SELECT enabled
  FROM notification_channel_preferences
  WHERE user_id = $1
    AND channel = 'WEB_PUSH'
  FOR SHARE`;

const FIND_CATEGORY_PREFERENCE_SQL = `
  SELECT enabled
  FROM notification_category_preferences
  WHERE user_id = $1
    AND category = $2
  FOR SHARE`;

const FIND_ACTIVE_SUBSCRIPTIONS_SQL = `
  SELECT subscription_id, user_id
  FROM push_subscriptions
  WHERE user_id = $1
    AND status = 'ACTIVE'
  ORDER BY created_at ASC, subscription_id ASC
  FOR SHARE`;

const INSERT_INTENT_SQL = `
  INSERT INTO notification_intents (
    intent_id,
    owner_id,
    category,
    channel,
    notification_type_key,
    template_key,
    template_version,
    payload_version,
    payload_json,
    dedupe_key,
    deliver_at,
    created_at,
    updated_at,
    completed_at
  )
  VALUES ($1, $2, $3, 'WEB_PUSH', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  ON CONFLICT (
    owner_id,
    category,
    channel,
    notification_type_key,
    dedupe_key
  ) DO NOTHING
  RETURNING intent_id`;

const INSERT_DELIVERY_SQL = `
  INSERT INTO notification_deliveries (
    delivery_id,
    intent_id,
    owner_id,
    subscription_id,
    state,
    attempt_count,
    next_attempt_at,
    claim_token,
    claim_expires_at,
    last_failure_class,
    cancel_reason,
    created_at,
    updated_at,
    last_attempt_at,
    delivered_at,
    terminal_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toNullableTimestampString(
  value: Date | string | null
): string | null {
  return value === null ? null : toTimestampString(value);
}

async function rollbackAfterFailure(
  client: PoolClient,
  transactionError: unknown
): Promise<never> {
  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    throw new AggregateError(
      [transactionError, rollbackError],
      'Notification enqueue transaction and rollback both failed.'
    );
  }

  throw transactionError;
}

function dedupeLockKey(
  input: Pick<
    NotificationEnqueuePersistenceInput,
    'ownerId' | 'category' | 'notificationTypeKey' | 'dedupeKey'
  >
): readonly [number, number] {
  const canonicalTuple = [
    input.ownerId,
    input.category,
    'WEB_PUSH',
    input.notificationTypeKey,
    input.dedupeKey
  ]
    .map((value) => `${value.length}:${value}`)
    .join('|');
  const digest = createHash('sha256').update(canonicalTuple, 'utf8').digest();

  return [digest.readInt32BE(0), digest.readInt32BE(4)];
}

function mapIntentRow(row: NotificationIntentRow): NotificationIntentRecord {
  if (row.payload_version !== 1 || row.channel !== 'WEB_PUSH') {
    throw new Error('Notification intent row has an invalid payload or channel.');
  }

  return createNotificationIntentRecord({
    intentId: row.intent_id,
    ownerId: row.owner_id,
    category: row.category,
    notificationTypeKey: row.notification_type_key,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    payload: row.payload_json,
    dedupeKey: row.dedupe_key,
    deliverAt: toTimestampString(row.deliver_at),
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at),
    completedAt: toNullableTimestampString(row.completed_at)
  });
}

type DuplicateNotificationEnqueueResult = Extract<
  NotificationEnqueueResult,
  { readonly outcome: 'DUPLICATE' }
>;

async function findExistingEnqueueResult(
  executor: PostgresClientSqlExecutor,
  identity: Pick<
    NotificationEnqueuePersistenceInput,
    'ownerId' | 'category' | 'notificationTypeKey' | 'dedupeKey'
  >
): Promise<DuplicateNotificationEnqueueResult | null> {
  const existingIntentResult =
    await executor.query<NotificationIntentRow>(FIND_INTENT_BY_DEDUPE_SQL, [
      identity.ownerId,
      identity.category,
      identity.notificationTypeKey,
      identity.dedupeKey
    ]);
  const existingIntentRow = existingIntentResult.rows[0];

  if (existingIntentRow === undefined) {
    return null;
  }

  const existingIntent = mapIntentRow(existingIntentRow);
  const existingDeliveryResult = await executor.query<NotificationDeliveryRow>(
    FIND_DELIVERIES_BY_INTENT_SQL,
    [existingIntent.intentId]
  );

  return {
    outcome: 'DUPLICATE',
    intent: existingIntent,
    deliveries: existingDeliveryResult.rows.map(mapDeliveryRow)
  };
}

function nullableFailureClass(
  value: string | null
): NotificationFailureClass | null {
  if (value === null) {
    return null;
  }
  if (!isNotificationFailureClass(value)) {
    throw new Error('Notification delivery row has an invalid failure class.');
  }
  return value;
}

function nullableCancelReason(
  value: string | null
): NotificationCancelReason | null {
  if (value === null) {
    return null;
  }
  if (!isNotificationCancelReason(value)) {
    throw new Error('Notification delivery row has an invalid cancel reason.');
  }
  return value;
}

function mapDeliveryRow(row: NotificationDeliveryRow): NotificationDeliveryRecord {
  if (!isNotificationDeliveryState(row.state)) {
    throw new Error('Notification delivery row has an invalid state.');
  }

  return createNotificationDeliveryRecord({
    deliveryId: row.delivery_id,
    intentId: row.intent_id,
    ownerId: row.owner_id,
    subscriptionId: row.subscription_id,
    state: row.state,
    attemptCount: row.attempt_count,
    nextAttemptAt: toNullableTimestampString(row.next_attempt_at),
    claimToken: row.claim_token,
    claimExpiresAt: toNullableTimestampString(row.claim_expires_at),
    lastFailureClass: nullableFailureClass(row.last_failure_class),
    cancelReason: nullableCancelReason(row.cancel_reason),
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at),
    lastAttemptAt: toNullableTimestampString(row.last_attempt_at),
    deliveredAt: toNullableTimestampString(row.delivered_at),
    terminalAt: toNullableTimestampString(row.terminal_at)
  });
}

/** PostgreSQL-owned atomic persistence for the B4B1 enqueue/fan-out boundary. */
export class PostgresNotificationEnqueueRepository
  implements NotificationEnqueueRepository
{
  public constructor(
    private readonly pool: Pool,
    private readonly idGenerator: IdGenerator
  ) {}

  public async enqueue(
    input: NotificationEnqueuePersistenceInput
  ): Promise<NotificationEnqueueResult> {
    const ownerId = assertOwnerAccountId(input.ownerId);
    const category = assertNotificationCategory(input.category);
    const notificationTypeKey = assertNotificationTypeKey(
      input.notificationTypeKey
    );
    const templateKey = assertServerIdentifier(input.templateKey, 'templateKey');
    const templateVersion = assertNotificationTemplateVersion(
      input.templateVersion
    );
    const dedupeKey = assertNotificationDedupeKey(input.dedupeKey);
    const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
    const deliverAt = assertServerTimestamp(input.deliverAt, 'deliverAt');

    if (typeof input.trustedEligibility !== 'boolean') {
      throw new Error('Trusted notification eligibility is invalid.');
    }

    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const executor = new PostgresClientSqlExecutor(client);

      const ownerResult = await executor.query<UserRow>(LOCK_OWNER_SQL, [ownerId]);
      if (ownerResult.rows.length === 0) {
        await client.query('COMMIT');
        return { outcome: 'NOT_ENQUEUED', reason: 'INELIGIBLE' };
      }

      const [lockKeyPartA, lockKeyPartB] = dedupeLockKey({
        ownerId,
        category,
        notificationTypeKey,
        dedupeKey
      });
      await executor.query<never>(ACQUIRE_DEDUPE_LOCK_SQL, [
        lockKeyPartA,
        lockKeyPartB
      ]);

      const existingResult = await findExistingEnqueueResult(executor, {
        ownerId,
        category,
        notificationTypeKey,
        dedupeKey
      });

      if (existingResult !== null) {
        await client.query('COMMIT');
        return existingResult;
      }

      if (!input.trustedEligibility) {
        await client.query('COMMIT');
        return { outcome: 'NOT_ENQUEUED', reason: 'INELIGIBLE' };
      }

      const channelPreference = await executor.query<PreferenceRow>(
        FIND_CHANNEL_PREFERENCE_SQL,
        [ownerId]
      );
      if (channelPreference.rows[0]?.enabled !== true) {
        await client.query('COMMIT');
        return {
          outcome: 'NOT_ENQUEUED',
          reason: 'CHANNEL_NOT_ENABLED'
        };
      }

      const categoryPreference = await executor.query<PreferenceRow>(
        FIND_CATEGORY_PREFERENCE_SQL,
        [ownerId, category]
      );
      if (categoryPreference.rows[0]?.enabled !== true) {
        await client.query('COMMIT');
        return {
          outcome: 'NOT_ENQUEUED',
          reason: 'CATEGORY_NOT_ENABLED'
        };
      }

      const activeSubscriptions = await executor.query<ActiveSubscriptionRow>(
        FIND_ACTIVE_SUBSCRIPTIONS_SQL,
        [ownerId]
      );
      if (activeSubscriptions.rows.length === 0) {
        await client.query('COMMIT');
        return {
          outcome: 'NOT_ENQUEUED',
          reason: 'NO_ACTIVE_SUBSCRIPTIONS'
        };
      }

      const payload = assertWebPushPayloadV1(input.renderPayload());
      const intent = createNotificationIntentRecord({
        intentId: this.idGenerator.generate(),
        ownerId,
        category,
        notificationTypeKey,
        templateKey,
        templateVersion,
        payload,
        dedupeKey,
        deliverAt,
        createdAt,
        updatedAt: createdAt,
        completedAt: null
      });
      const insertedIntentResult = await executor.query<InsertedIntentRow>(
        INSERT_INTENT_SQL,
        [
          intent.intentId,
          intent.ownerId,
          intent.category,
          intent.notificationTypeKey,
          intent.templateKey,
          intent.templateVersion,
          intent.payloadVersion,
          intent.payload,
          intent.dedupeKey,
          intent.deliverAt,
          intent.createdAt,
          intent.updatedAt,
          intent.completedAt
        ]
      );

      if (insertedIntentResult.rows.length === 0) {
        const conflictedResult = await findExistingEnqueueResult(executor, {
          ownerId,
          category,
          notificationTypeKey,
          dedupeKey
        });
        if (conflictedResult === null) {
          throw new Error(
            'Notification intent uniqueness conflict could not be resolved.'
          );
        }

        await client.query('COMMIT');
        return conflictedResult;
      }

      const deliveries = activeSubscriptions.rows.map((subscription) => {
        if (subscription.user_id !== ownerId) {
          throw new Error('Notification subscription owner does not match.');
        }

        return createNotificationDeliveryRecord({
          deliveryId: this.idGenerator.generate(),
          intentId: intent.intentId,
          ownerId,
          subscriptionId: subscription.subscription_id,
          state: 'PENDING',
          attemptCount: 0,
          nextAttemptAt: deliverAt,
          claimToken: null,
          claimExpiresAt: null,
          lastFailureClass: null,
          cancelReason: null,
          createdAt,
          updatedAt: createdAt,
          lastAttemptAt: null,
          deliveredAt: null,
          terminalAt: null
        });
      });

      for (const delivery of deliveries) {
        await executor.query<never>(INSERT_DELIVERY_SQL, [
          delivery.deliveryId,
          delivery.intentId,
          delivery.ownerId,
          delivery.subscriptionId,
          delivery.state,
          delivery.attemptCount,
          delivery.nextAttemptAt,
          delivery.claimToken,
          delivery.claimExpiresAt,
          delivery.lastFailureClass,
          delivery.cancelReason,
          delivery.createdAt,
          delivery.updatedAt,
          delivery.lastAttemptAt,
          delivery.deliveredAt,
          delivery.terminalAt
        ]);
      }

      await client.query('COMMIT');
      return { outcome: 'CREATED', intent, deliveries };
    } catch (error) {
      if (transactionStarted) {
        return rollbackAfterFailure(client, error);
      }

      throw error;
    } finally {
      client.release();
    }
  }
}
