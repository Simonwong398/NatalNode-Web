import type { SqlExecutor } from '../../db/index.js';
import {
  assertOwnerAccountId,
  assertServerIdentifier,
  assertServerTimestamp
} from '../notification-domain.js';
import {
  createActivePushSubscription,
  createPushSubscriptionRecord,
  type PushSubscriptionRecord,
  type PushSubscriptionRegistration
} from '../push-subscription.js';
import type {
  PushSubscriptionRepository,
  RegisterPushSubscriptionResult
} from '../repositories.js';

interface PushSubscriptionRow {
  readonly subscription_id: string;
  readonly user_id: string;
  readonly endpoint: string;
  readonly endpoint_hash: string;
  readonly p256dh: string;
  readonly auth: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly last_success_at: Date | string | null;
  readonly status: 'ACTIVE' | 'INVALIDATED';
  readonly invalidated_at: Date | string | null;
}

interface ActiveEndpointMarker {
  readonly active: number;
}

const PUSH_SUBSCRIPTION_COLUMNS = `
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
  invalidated_at`;

const ACTIVE_ENDPOINT_LOOKUP_RETRY_LIMIT = 3;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toNullableTimestampString(value: Date | string | null): string | null {
  return value === null ? null : toTimestampString(value);
}

function mapPushSubscriptionRow(row: PushSubscriptionRow): PushSubscriptionRecord {
  return createPushSubscriptionRecord({
    subscriptionId: row.subscription_id,
    ownerId: row.user_id,
    endpoint: row.endpoint,
    endpointHash: row.endpoint_hash,
    p256dh: row.p256dh,
    auth: row.auth,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at),
    lastSuccessAt: toNullableTimestampString(row.last_success_at),
    status: row.status,
    invalidatedAt: toNullableTimestampString(row.invalidated_at)
  });
}

export class PostgresPushSubscriptionRepository
  implements PushSubscriptionRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async register(
    registration: PushSubscriptionRegistration
  ): Promise<RegisterPushSubscriptionResult> {
    const candidate = createActivePushSubscription(registration);

    for (
      let attempt = 1;
      attempt <= ACTIVE_ENDPOINT_LOOKUP_RETRY_LIMIT;
      attempt += 1
    ) {
      const result = await this.executor.query<PushSubscriptionRow>(
        `
          INSERT INTO push_subscriptions (
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
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (endpoint_hash) WHERE status = 'ACTIVE'
          DO UPDATE SET
            endpoint = EXCLUDED.endpoint,
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            updated_at = EXCLUDED.updated_at
          WHERE push_subscriptions.user_id = EXCLUDED.user_id
          RETURNING${PUSH_SUBSCRIPTION_COLUMNS}`,
        [
          candidate.subscriptionId,
          candidate.ownerId,
          candidate.endpoint,
          candidate.endpointHash,
          candidate.p256dh,
          candidate.auth,
          candidate.createdAt,
          candidate.updatedAt,
          candidate.lastSuccessAt,
          candidate.status,
          candidate.invalidatedAt
        ]
      );

      const row = result.rows[0];
      if (row !== undefined) {
        const subscription = mapPushSubscriptionRow(row);
        return {
          outcome:
            subscription.subscriptionId === candidate.subscriptionId
              ? 'CREATED'
              : 'UPDATED_EXISTING_OWNER',
          subscription
        };
      }

      const activeEndpoint = await this.executor.query<ActiveEndpointMarker>(
        `
          SELECT 1 AS active
          FROM push_subscriptions
          WHERE endpoint_hash = $1
            AND status = 'ACTIVE'
          LIMIT 1`,
        [candidate.endpointHash]
      );

      if (activeEndpoint.rows.length > 0) {
        return { outcome: 'OWNERSHIP_CONFLICT' };
      }
    }

    throw new Error('Push subscription registration could not be completed safely.');
  }

  public async listActiveForOwner(
    ownerId: string
  ): Promise<readonly PushSubscriptionRecord[]> {
    const validatedOwnerId = assertOwnerAccountId(ownerId);
    const result = await this.executor.query<PushSubscriptionRow>(
      `
        SELECT${PUSH_SUBSCRIPTION_COLUMNS}
        FROM push_subscriptions
        WHERE user_id = $1
          AND status = 'ACTIVE'
        ORDER BY created_at ASC, subscription_id ASC`,
      [validatedOwnerId]
    );

    return result.rows.map(mapPushSubscriptionRow);
  }

  public async removeForOwner(
    ownerId: string,
    subscriptionId: string
  ): Promise<boolean> {
    const validatedOwnerId = assertOwnerAccountId(ownerId);
    const validatedSubscriptionId = assertServerIdentifier(
      subscriptionId,
      'subscriptionId'
    );
    const result = await this.executor.query<{ subscription_id: string }>(
      `
        DELETE FROM push_subscriptions
        WHERE user_id = $1
          AND subscription_id = $2
        RETURNING subscription_id`,
      [validatedOwnerId, validatedSubscriptionId]
    );

    return result.rows.length > 0;
  }

  public async invalidate(
    subscriptionId: string,
    invalidatedAt: string
  ): Promise<boolean> {
    const validatedSubscriptionId = assertServerIdentifier(
      subscriptionId,
      'subscriptionId'
    );
    const validatedInvalidatedAt = assertServerTimestamp(
      invalidatedAt,
      'invalidatedAt'
    );
    const result = await this.executor.query<{ subscription_id: string }>(
      `
        UPDATE push_subscriptions
        SET status = 'INVALIDATED',
            invalidated_at = $2,
            updated_at = $2
        WHERE subscription_id = $1
          AND status = 'ACTIVE'
        RETURNING subscription_id`,
      [validatedSubscriptionId, validatedInvalidatedAt]
    );

    return result.rows.length > 0;
  }
}
