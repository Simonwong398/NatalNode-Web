import type { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  assertNotificationCategory,
  assertNotificationTypeKey,
  assertOwnerAccountId,
  assertServerIdentifier,
  type NotificationCategory
} from '../notification-domain.js';
import {
  createPushSubscriptionRecord,
  type PushSubscriptionRecord
} from '../push-subscription.js';
import { assertWebPushPayloadV1 } from '../web-push-payload.js';
import type {
  IdGenerator
} from '../../app/creation-boundaries.js';
import {
  boundedRetryAfterSeconds,
  isRetryableTransportOutcome,
  notificationRetryDelaySeconds,
  NOTIFICATION_DELIVERY_CLAIM_BATCH_SIZE,
  NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS,
  NOTIFICATION_DELIVERY_LEASE_SECONDS,
  NOTIFICATION_DELIVERY_MAX_ATTEMPTS,
  type CurrentNotificationDeliveryEligibility,
  type NotificationDeliveryClaim,
  type NotificationDeliveryProcessingResult,
  type NotificationDeliveryWorkerRepository
} from '../notification-delivery-worker.js';
import type {
  WebPushTransport,
  WebPushTransportOutcome
} from '../web-push-transport.js';

const MILLISECONDS_PER_SECOND = 1_000;
const NOTIFICATION_DELIVERY_RETRY_HORIZON_MILLISECONDS =
  24 * 60 * 60 * MILLISECONDS_PER_SECOND;

interface DueDeliveryRow extends QueryResultRow {
  readonly delivery_id: string;
  readonly intent_id: string;
  readonly owner_id: string;
  readonly subscription_id: string;
  readonly category: NotificationCategory;
  readonly channel: 'WEB_PUSH';
  readonly notification_type_key: string;
}

interface ClaimedDeliveryRow extends QueryResultRow {
  readonly delivery_id: string;
  readonly claim_token: string;
  readonly claim_expires_at: Date | string;
  readonly attempt_count: number;
  readonly first_attempt_at: Date | string;
}

interface ExpiredDeliveryRow extends QueryResultRow {
  readonly delivery_id: string;
  readonly attempt_count: number;
  readonly first_attempt_at: Date | string | null;
}

interface DatabaseNowRow extends QueryResultRow {
  readonly database_now: Date | string;
}

interface UserRow extends QueryResultRow {
  readonly user_id: string;
}

interface PreferenceRow extends QueryResultRow {
  readonly enabled: boolean;
}

interface SubscriptionRow extends QueryResultRow {
  readonly subscription_id: string;
  readonly user_id: string;
  readonly endpoint: string;
  readonly endpoint_hash: string;
  readonly p256dh: string;
  readonly auth: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly last_success_at: Date | string | null;
  readonly status: string;
  readonly invalidated_at: Date | string | null;
}

interface DeliveryAuthorityRow extends QueryResultRow {
  readonly delivery_id: string;
  readonly intent_id: string;
  readonly owner_id: string;
  readonly subscription_id: string;
  readonly state: string;
  readonly attempt_count: number;
  readonly claim_token: string | null;
  readonly claim_expires_at: Date | string | null;
  readonly first_attempt_at: Date | string | null;
  readonly database_now: Date | string;
}

interface IntentAuthorityRow extends QueryResultRow {
  readonly intent_id: string;
  readonly owner_id: string;
  readonly category: string;
  readonly channel: string;
  readonly notification_type_key: string;
  readonly payload_version: number;
  readonly payload_json: unknown;
}

const FIND_DUE_DELIVERIES_SQL = `
  SELECT
    d.delivery_id,
    d.intent_id,
    d.owner_id,
    d.subscription_id,
    i.category,
    i.channel,
    i.notification_type_key
  FROM notification_deliveries AS d
  INNER JOIN notification_intents AS i
    ON i.intent_id = d.intent_id
  WHERE d.state IN ('PENDING', 'RETRYABLE')
    AND d.next_attempt_at <= clock_timestamp()
    AND (
      (d.attempt_count = 0 AND d.first_attempt_at IS NULL)
      OR (d.attempt_count > 0 AND d.first_attempt_at IS NOT NULL)
    )
    AND d.attempt_count < $2
  ORDER BY d.next_attempt_at ASC, d.delivery_id ASC
  LIMIT $1
  FOR UPDATE OF d SKIP LOCKED`;

const CLAIM_DELIVERY_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'PROCESSING',
    claim_token = $2,
    claim_expires_at = clock_timestamp() + ($3 * INTERVAL '1 second'),
    attempt_count = attempt_count + 1,
    next_attempt_at = NULL,
    last_attempt_at = clock_timestamp(),
    first_attempt_at = COALESCE(first_attempt_at, clock_timestamp()),
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state IN ('PENDING', 'RETRYABLE')
    AND next_attempt_at <= clock_timestamp()
    AND (
      (attempt_count = 0 AND first_attempt_at IS NULL)
      OR (attempt_count > 0 AND first_attempt_at IS NOT NULL)
    )
    AND attempt_count < $4
  RETURNING delivery_id, claim_token, claim_expires_at, attempt_count, first_attempt_at`;

const FIND_DATABASE_NOW_SQL =
  'SELECT clock_timestamp() AS database_now';

const FIND_EXPIRED_DELIVERIES_SQL = `
  SELECT delivery_id, attempt_count, first_attempt_at
  FROM notification_deliveries
  WHERE state = 'PROCESSING'
    AND claim_expires_at <= clock_timestamp()
  ORDER BY claim_expires_at ASC, delivery_id ASC
  LIMIT $1
  FOR UPDATE SKIP LOCKED`;

const RECOVER_TO_RETRYABLE_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'RETRYABLE',
    next_attempt_at = $2,
    claim_token = NULL,
    claim_expires_at = NULL,
    last_failure_class = 'TIMEOUT_AMBIGUOUS',
    cancel_reason = NULL,
    delivered_at = NULL,
    terminal_at = NULL,
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state = 'PROCESSING'
    AND claim_expires_at <= clock_timestamp()`;

const RECOVER_TO_DEAD_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'DEAD',
    next_attempt_at = NULL,
    claim_token = NULL,
    claim_expires_at = NULL,
    last_failure_class = 'TIMEOUT_AMBIGUOUS',
    cancel_reason = NULL,
    delivered_at = NULL,
    terminal_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state = 'PROCESSING'
    AND claim_expires_at <= clock_timestamp()`;

const LOCK_OWNER_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR KEY SHARE`;

const LOCK_CHANNEL_PREFERENCE_SQL = `
  SELECT enabled
  FROM notification_channel_preferences
  WHERE user_id = $1
    AND channel = 'WEB_PUSH'
  FOR SHARE`;

const LOCK_CATEGORY_PREFERENCE_SQL = `
  SELECT enabled
  FROM notification_category_preferences
  WHERE user_id = $1
    AND category = $2
  FOR SHARE`;

const LOCK_SUBSCRIPTION_SQL = `
  SELECT
    subscription_id,
    user_id,
    endpoint,
    endpoint_hash,
    p256dh,
    auth,
    created_at,
    updated_at,
    last_success_at,
    status,
    invalidated_at
  FROM push_subscriptions
  WHERE subscription_id = $1
  FOR UPDATE`;

const LOCK_DELIVERY_SQL = `
  SELECT
    delivery_id,
    intent_id,
    owner_id,
    subscription_id,
    state,
    attempt_count,
    claim_token,
    claim_expires_at,
    first_attempt_at,
    clock_timestamp() AS database_now
  FROM notification_deliveries
  WHERE delivery_id = $1
  FOR UPDATE`;

const FIND_INTENT_BY_ID_SQL = `
  SELECT
    intent_id,
    owner_id,
    category,
    channel,
    notification_type_key,
    payload_version,
    payload_json
  FROM notification_intents
  WHERE intent_id = $1`;

const CANCEL_DELIVERY_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'CANCELLED',
    next_attempt_at = NULL,
    claim_token = NULL,
    claim_expires_at = NULL,
    last_failure_class = NULL,
    cancel_reason = $3,
    delivered_at = NULL,
    terminal_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state = 'PROCESSING'
    AND claim_token = $2`;

const DEAD_DELIVERY_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'DEAD',
    next_attempt_at = NULL,
    claim_token = NULL,
    claim_expires_at = NULL,
    last_failure_class = $3,
    cancel_reason = NULL,
    delivered_at = NULL,
    terminal_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state = 'PROCESSING'
    AND claim_token = $2`;

const DELIVERED_DELIVERY_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'DELIVERED',
    next_attempt_at = NULL,
    claim_token = NULL,
    claim_expires_at = NULL,
    last_failure_class = NULL,
    cancel_reason = NULL,
    delivered_at = clock_timestamp(),
    terminal_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state = 'PROCESSING'
    AND claim_token = $2`;

const RETRYABLE_DELIVERY_SQL = `
  UPDATE notification_deliveries
  SET
    state = 'RETRYABLE',
    next_attempt_at = $3,
    claim_token = NULL,
    claim_expires_at = NULL,
    last_failure_class = $4,
    cancel_reason = NULL,
    delivered_at = NULL,
    terminal_at = NULL,
    updated_at = clock_timestamp()
  WHERE delivery_id = $1
    AND state = 'PROCESSING'
    AND claim_token = $2`;

const INVALIDATE_SUBSCRIPTION_SQL = `
  UPDATE push_subscriptions
  SET
    status = 'INVALIDATED',
    invalidated_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE subscription_id = $1
    AND status = 'ACTIVE'`;

function timestampToString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function timestampToDate(value: Date | string | null): Date | null {
  if (value === null) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function assertBatchLimit(limit: number): number {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > NOTIFICATION_DELIVERY_CLAIM_BATCH_SIZE
  ) {
    throw new Error('Notification delivery batch limit is invalid.');
  }

  return limit;
}

function assertTransportAttemptTimeoutMillis(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS
  ) {
    throw new Error('Notification delivery attempt timeout is invalid.');
  }

  return value;
}

function readRows<Row extends QueryResultRow>(
  result: { readonly rows: readonly Row[] }
): readonly Row[] {
  return result.rows;
}

async function queryRows<Row extends QueryResultRow>(
  client: PoolClient,
  sql: string,
  params: readonly unknown[] = []
): Promise<readonly Row[]> {
  const result = await client.query<Row & QueryResultRow, unknown[]>(sql, [
    ...params
  ]);

  return readRows(result);
}

async function executeMutation(
  client: PoolClient,
  sql: string,
  params: readonly unknown[]
): Promise<boolean> {
  const result = await client.query(sql, [...params]);

  return result.rowCount === 1;
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
      'Notification delivery transaction and rollback both failed.'
    );
  }

  throw transactionError;
}

function makeClaim(
  due: DueDeliveryRow,
  claimed: ClaimedDeliveryRow
): NotificationDeliveryClaim {
  const category = assertNotificationCategory(due.category);
  const notificationTypeKey = assertNotificationTypeKey(
    due.notification_type_key
  );
  const claimToken = assertServerIdentifier(claimed.claim_token, 'claimToken');
  const claimExpiresAt = timestampToString(claimed.claim_expires_at);
  const firstAttemptAt = timestampToString(claimed.first_attempt_at);

  return Object.freeze({
    deliveryId: due.delivery_id,
    intentId: due.intent_id,
    ownerId: assertOwnerAccountId(due.owner_id),
    subscriptionId: assertServerIdentifier(
      due.subscription_id,
      'subscriptionId'
    ),
    category,
    channel: 'WEB_PUSH' as const,
    notificationTypeKey,
    claimToken,
    claimExpiresAt,
    attemptCount: claimed.attempt_count,
    firstAttemptAt
  });
}

function recoveryNextAttemptAt(
  databaseNow: Date,
  attemptCount: number,
  firstAttemptAt: Date | null
): Date | null {
  const retryDelaySeconds = notificationRetryDelaySeconds(attemptCount);

  if (retryDelaySeconds === null || firstAttemptAt === null) {
    return null;
  }

  const nextAttemptAt = new Date(
    databaseNow.getTime() + retryDelaySeconds * MILLISECONDS_PER_SECOND
  );
  const retryHorizon = new Date(
    firstAttemptAt.getTime() +
      NOTIFICATION_DELIVERY_RETRY_HORIZON_MILLISECONDS
  );

  return nextAttemptAt.getTime() <= retryHorizon.getTime()
    ? nextAttemptAt
    : null;
}

function normalizeTransportOutcome(
  value: WebPushTransportOutcome
): WebPushTransportOutcome {
  const outcome =
    typeof value === 'object' && value !== null
      ? (value as { readonly outcome?: unknown }).outcome
      : undefined;

  switch (outcome) {
    case 'ACCEPTED':
    case 'SUBSCRIPTION_INVALID':
    case 'TRANSIENT_UPSTREAM':
    case 'TIMEOUT_AMBIGUOUS':
    case 'PAYLOAD_INVALID':
    case 'CONFIGURATION_UNAVAILABLE':
    case 'PERMANENT_FAILURE':
      return { outcome };
    case 'THROTTLED': {
      const retryAfterSeconds = boundedRetryAfterSeconds(
        (value as { readonly retryAfterSeconds?: unknown }).retryAfterSeconds
      );

      return retryAfterSeconds === undefined
        ? { outcome: 'THROTTLED' }
        : { outcome: 'THROTTLED', retryAfterSeconds };
    }
    default:
      return { outcome: 'PERMANENT_FAILURE' };
  }
}

function subscriptionFromRow(
  row: SubscriptionRow
): PushSubscriptionRecord | null {
  try {
    return createPushSubscriptionRecord({
      subscriptionId: row.subscription_id,
      ownerId: row.user_id,
      endpoint: row.endpoint,
      endpointHash: row.endpoint_hash,
      p256dh: row.p256dh,
      auth: row.auth,
      createdAt: timestampToString(row.created_at),
      updatedAt: timestampToString(row.updated_at),
      lastSuccessAt:
        row.last_success_at === null
          ? null
          : timestampToString(row.last_success_at),
      status: row.status as 'ACTIVE' | 'INVALIDATED',
      invalidatedAt:
        row.invalidated_at === null
          ? null
          : timestampToString(row.invalidated_at)
    });
  } catch (_error) {
    return null;
  }
}

function finalResult(
  deliveryId: string,
  state: 'DELIVERED' | 'RETRYABLE' | 'DEAD' | 'CANCELLED'
): NotificationDeliveryProcessingResult {
  return { outcome: 'PERSISTED', deliveryId, state };
}

/** PostgreSQL claim, fencing, retry, and final-send persistence boundary. */
export class PostgresNotificationDeliveryWorkerRepository
  implements NotificationDeliveryWorkerRepository
{
  public constructor(
    private readonly pool: Pool,
    private readonly claimTokenGenerator: IdGenerator
  ) {}

  public async recoverExpiredClaims(limit: number): Promise<number> {
    const boundedLimit = assertBatchLimit(limit);
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const nowRows = await queryRows<DatabaseNowRow>(
        client,
        FIND_DATABASE_NOW_SQL
      );
      const databaseNow = timestampToDate(nowRows[0]?.database_now ?? null);

      if (databaseNow === null) {
        throw new Error('Database time is invalid.');
      }

      const expiredRows = await queryRows<ExpiredDeliveryRow>(
        client,
        FIND_EXPIRED_DELIVERIES_SQL,
        [boundedLimit]
      );
      let recovered = 0;

      for (const row of expiredRows) {
        const firstAttemptAt = timestampToDate(row.first_attempt_at);
        const nextAttemptAt = recoveryNextAttemptAt(
          databaseNow,
          row.attempt_count,
          firstAttemptAt
        );
        const updated =
          nextAttemptAt === null
            ? await executeMutation(client, RECOVER_TO_DEAD_SQL, [
                row.delivery_id
              ])
            : await executeMutation(client, RECOVER_TO_RETRYABLE_SQL, [
                row.delivery_id,
                nextAttemptAt
              ]);

        if (updated) {
          recovered += 1;
        }
      }

      await client.query('COMMIT');
      return recovered;
    } catch (error) {
      if (!transactionStarted) {
        throw error;
      }

      return rollbackAfterFailure(client, error);
    } finally {
      client.release();
    }
  }

  public async claimDueDeliveries(
    limit: number
  ): Promise<readonly NotificationDeliveryClaim[]> {
    const boundedLimit = assertBatchLimit(limit);
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const dueRows = await queryRows<DueDeliveryRow>(
        client,
        FIND_DUE_DELIVERIES_SQL,
        [boundedLimit, NOTIFICATION_DELIVERY_MAX_ATTEMPTS]
      );
      const claims: NotificationDeliveryClaim[] = [];

      for (const dueRow of dueRows) {
        const claimToken = assertServerIdentifier(
          this.claimTokenGenerator.generate(),
          'claimToken'
        );
        const claimedRows = await queryRows<ClaimedDeliveryRow>(
          client,
          CLAIM_DELIVERY_SQL,
          [
            dueRow.delivery_id,
            claimToken,
            NOTIFICATION_DELIVERY_LEASE_SECONDS,
            NOTIFICATION_DELIVERY_MAX_ATTEMPTS
          ]
        );
        const claimedRow = claimedRows[0];

        if (claimedRow !== undefined) {
          claims.push(makeClaim(dueRow, claimedRow));
        }
      }

      await client.query('COMMIT');
      return Object.freeze(claims);
    } catch (error) {
      if (!transactionStarted) {
        throw error;
      }

      return rollbackAfterFailure(client, error);
    } finally {
      client.release();
    }
  }

  public async processClaimedDelivery(
    claim: NotificationDeliveryClaim,
    input: {
      readonly eligibility: CurrentNotificationDeliveryEligibility;
      readonly transport: WebPushTransport;
      readonly transportAttemptTimeoutMillis: number;
    }
  ): Promise<NotificationDeliveryProcessingResult> {
    const deliveryId = assertServerIdentifier(claim.deliveryId, 'deliveryId');
    const ownerId = assertOwnerAccountId(claim.ownerId);
    const subscriptionId = assertServerIdentifier(
      claim.subscriptionId,
      'subscriptionId'
    );
    const intentId = assertServerIdentifier(claim.intentId, 'intentId');
    const category = assertNotificationCategory(claim.category);
    const notificationTypeKey = assertNotificationTypeKey(
      claim.notificationTypeKey
    );
    const claimToken = assertServerIdentifier(claim.claimToken, 'claimToken');
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      // Keep this order stable: owner, channel, category, target, delivery.
      const ownerRows = await queryRows<UserRow>(client, LOCK_OWNER_SQL, [
        ownerId
      ]);
      const channelPreferenceRows = await queryRows<PreferenceRow>(
        client,
        LOCK_CHANNEL_PREFERENCE_SQL,
        [ownerId]
      );
      const categoryPreferenceRows = await queryRows<PreferenceRow>(
        client,
        LOCK_CATEGORY_PREFERENCE_SQL,
        [ownerId, category]
      );
      const subscriptionRows = await queryRows<SubscriptionRow>(
        client,
        LOCK_SUBSCRIPTION_SQL,
        [subscriptionId]
      );
      const deliveryRows = await queryRows<DeliveryAuthorityRow>(
        client,
        LOCK_DELIVERY_SQL,
        [deliveryId]
      );
      const delivery = deliveryRows[0];

      if (delivery === undefined) {
        await client.query('COMMIT');
        return {
          outcome: 'SKIPPED',
          deliveryId,
          reason: 'MISSING_TARGET'
        };
      }

      if (
        delivery.state !== 'PROCESSING' ||
        delivery.claim_token !== claimToken
      ) {
        await client.query('COMMIT');
        return { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      const databaseNow = timestampToDate(delivery.database_now);
      const claimExpiresAt = timestampToDate(delivery.claim_expires_at);
      const firstAttemptAt = timestampToDate(delivery.first_attempt_at);

      if (databaseNow === null || claimExpiresAt === null) {
        await client.query('COMMIT');
        return { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      const remainingLeaseMillis =
        claimExpiresAt.getTime() - databaseNow.getTime();
      if (remainingLeaseMillis <= 0) {
        await client.query('COMMIT');
        return { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }
      const transportAttemptTimeoutMillis =
        assertTransportAttemptTimeoutMillis(input.transportAttemptTimeoutMillis);
      if (remainingLeaseMillis <= transportAttemptTimeoutMillis) {
        await client.query('COMMIT');
        return {
          outcome: 'SKIPPED',
          deliveryId,
          reason: 'INSUFFICIENT_LEASE'
        };
      }

      const intentRows = await queryRows<IntentAuthorityRow>(
        client,
        FIND_INTENT_BY_ID_SQL,
        [intentId]
      );
      const intent = intentRows[0];
      const subscriptionRow = subscriptionRows[0];

      if (intent === undefined || subscriptionRow === undefined) {
        await client.query('COMMIT');
        return {
          outcome: 'SKIPPED',
          deliveryId,
          reason: 'MISSING_TARGET'
        };
      }

      if (ownerRows.length === 0) {
        const cancelled = await executeMutation(client, CANCEL_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'INELIGIBLE'
        ]);
        await client.query('COMMIT');
        return cancelled
          ? finalResult(deliveryId, 'CANCELLED')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (channelPreferenceRows[0]?.enabled !== true) {
        const cancelled = await executeMutation(client, CANCEL_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'CHANNEL_NOT_ENABLED'
        ]);
        await client.query('COMMIT');
        return cancelled
          ? finalResult(deliveryId, 'CANCELLED')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (categoryPreferenceRows[0]?.enabled !== true) {
        const cancelled = await executeMutation(client, CANCEL_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'CATEGORY_NOT_ENABLED'
        ]);
        await client.query('COMMIT');
        return cancelled
          ? finalResult(deliveryId, 'CANCELLED')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (
        delivery.owner_id !== ownerId ||
        delivery.subscription_id !== subscriptionId ||
        delivery.intent_id !== intentId
      ) {
        await client.query('COMMIT');
        return { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (
        subscriptionRow.user_id !== ownerId ||
        subscriptionRow.status !== 'ACTIVE'
      ) {
        const cancelled = await executeMutation(client, CANCEL_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          subscriptionRow.status === 'ACTIVE'
            ? 'INELIGIBLE'
            : 'SUBSCRIPTION_NOT_ACTIVE'
        ]);
        await client.query('COMMIT');
        return cancelled
          ? finalResult(deliveryId, 'CANCELLED')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (
        intent.intent_id !== intentId ||
        intent.owner_id !== ownerId ||
        intent.category !== category ||
        intent.channel !== 'WEB_PUSH' ||
        intent.notification_type_key !== notificationTypeKey ||
        intent.payload_version !== 1
      ) {
        const dead = await executeMutation(client, DEAD_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'PERMANENT_FAILURE'
        ]);
        await client.query('COMMIT');
        return dead
          ? finalResult(deliveryId, 'DEAD')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      let payload;
      try {
        payload = assertWebPushPayloadV1(intent.payload_json);
      } catch (_error) {
        const dead = await executeMutation(client, DEAD_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'PAYLOAD_INVALID'
        ]);
        await client.query('COMMIT');
        return dead
          ? finalResult(deliveryId, 'DEAD')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      const subscription = subscriptionFromRow(subscriptionRow);
      if (subscription === null || subscription.status !== 'ACTIVE') {
        const dead = await executeMutation(client, DEAD_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'PERMANENT_FAILURE'
        ]);
        await client.query('COMMIT');
        return dead
          ? finalResult(deliveryId, 'DEAD')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (firstAttemptAt === null) {
        const dead = await executeMutation(client, DEAD_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'PERMANENT_FAILURE'
        ]);
        await client.query('COMMIT');
        return dead
          ? finalResult(deliveryId, 'DEAD')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (input.eligibility.available !== true) {
        await client.query('COMMIT');
        return { outcome: 'ELIGIBILITY_UNAVAILABLE', deliveryId };
      }

      let eligible: boolean;
      try {
        eligible = await input.eligibility.isEligible({
          ownerId,
          intentId,
          category,
          notificationTypeKey
        });
      } catch (_error) {
        await client.query('COMMIT');
        return { outcome: 'ELIGIBILITY_UNAVAILABLE', deliveryId };
      }

      if (eligible !== true) {
        const cancelled = await executeMutation(client, CANCEL_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'TRUSTED_ELIGIBILITY_REVOKED'
        ]);
        await client.query('COMMIT');
        return cancelled
          ? finalResult(deliveryId, 'CANCELLED')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      // Eligibility evaluation and local validation may have consumed part of
      // the lease. Re-check the database wall clock immediately before the
      // bounded transport attempt so lock/evaluator latency cannot start a
      // send after the lease is no longer sufficient.
      const preTransportNowRows = await queryRows<DatabaseNowRow>(
        client,
        FIND_DATABASE_NOW_SQL
      );
      const preTransportDatabaseNow = timestampToDate(
        preTransportNowRows[0]?.database_now ?? null
      );

      if (preTransportDatabaseNow === null) {
        await client.query('COMMIT');
        return { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      const preTransportRemainingLeaseMillis =
        claimExpiresAt.getTime() - preTransportDatabaseNow.getTime();
      if (preTransportRemainingLeaseMillis <= transportAttemptTimeoutMillis) {
        await client.query('COMMIT');
        return {
          outcome: 'SKIPPED',
          deliveryId,
          reason: 'INSUFFICIENT_LEASE'
        };
      }

      let transportOutcome: WebPushTransportOutcome;
      const transportSubscription = {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth
      };
      try {
        transportOutcome = normalizeTransportOutcome(
          await input.transport.send({
            subscription: transportSubscription,
            payload
          })
        );
      } catch (_error) {
        transportOutcome = { outcome: 'TIMEOUT_AMBIGUOUS' };
      }

      if (transportOutcome.outcome === 'CONFIGURATION_UNAVAILABLE') {
        // Preserve PROCESSING plus its lease. The worker stops; normal lease
        // recovery will decide the next safe state without inventing one.
        await client.query('COMMIT');
        return { outcome: 'CONFIGURATION_UNAVAILABLE', deliveryId };
      }

      if (transportOutcome.outcome === 'ACCEPTED') {
        const delivered = await executeMutation(client, DELIVERED_DELIVERY_SQL, [
          deliveryId,
          claimToken
        ]);
        await client.query('COMMIT');
        return delivered
          ? finalResult(deliveryId, 'DELIVERED')
          : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
      }

      if (transportOutcome.outcome === 'SUBSCRIPTION_INVALID') {
        const invalidated = await executeMutation(client, INVALIDATE_SUBSCRIPTION_SQL, [
          subscriptionId
        ]);
        const dead = await executeMutation(client, DEAD_DELIVERY_SQL, [
          deliveryId,
          claimToken,
          'SUBSCRIPTION_INVALID'
        ]);
        if (!invalidated || !dead) {
          await client.query('ROLLBACK');
          return { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
        }
        await client.query('COMMIT');
        return finalResult(deliveryId, 'DEAD');
      }

      if (isRetryableTransportOutcome(transportOutcome.outcome)) {
        const outcomeNowRows = await queryRows<DatabaseNowRow>(
          client,
          FIND_DATABASE_NOW_SQL
        );
        const outcomeDatabaseNow = timestampToDate(
          outcomeNowRows[0]?.database_now ?? null
        );

        if (outcomeDatabaseNow === null) {
          throw new Error('Database time is invalid.');
        }

        const baseDelaySeconds = notificationRetryDelaySeconds(
          delivery.attempt_count
        );
        const retryAfterSeconds =
          transportOutcome.outcome === 'THROTTLED'
            ? boundedRetryAfterSeconds(transportOutcome.retryAfterSeconds)
            : undefined;
        const effectiveDelaySeconds =
          baseDelaySeconds === null
            ? null
            : Math.max(baseDelaySeconds, retryAfterSeconds ?? 0);
        const retryHorizon = new Date(
          firstAttemptAt.getTime() +
            NOTIFICATION_DELIVERY_RETRY_HORIZON_MILLISECONDS
        );
        const nextAttemptAt =
          effectiveDelaySeconds === null
            ? null
            : new Date(
                outcomeDatabaseNow.getTime() +
                  effectiveDelaySeconds * MILLISECONDS_PER_SECOND
              );
        const retryable =
          nextAttemptAt !== null &&
          nextAttemptAt.getTime() <= retryHorizon.getTime() &&
          delivery.attempt_count < NOTIFICATION_DELIVERY_MAX_ATTEMPTS;

        if (retryable) {
          const retry = await executeMutation(client, RETRYABLE_DELIVERY_SQL, [
            deliveryId,
            claimToken,
            nextAttemptAt,
            transportOutcome.outcome
          ]);
          await client.query('COMMIT');
          return retry
            ? finalResult(deliveryId, 'RETRYABLE')
            : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
        }
      }

      const dead = await executeMutation(client, DEAD_DELIVERY_SQL, [
        deliveryId,
        claimToken,
        transportOutcome.outcome
      ]);
      await client.query('COMMIT');
      return dead
        ? finalResult(deliveryId, 'DEAD')
        : { outcome: 'SKIPPED', deliveryId, reason: 'STALE_CLAIM' };
    } catch (error) {
      if (!transactionStarted) {
        throw error;
      }

      return rollbackAfterFailure(client, error);
    } finally {
      client.release();
    }
  }
}
