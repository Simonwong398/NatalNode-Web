import type { SqlExecutor } from '../../db/index.js';
import {
  assertNotificationCategory,
  assertNotificationChannel,
  assertOwnerAccountId,
  type NotificationCategory,
  type NotificationChannel
} from '../notification-domain.js';
import {
  createNotificationCategoryPreference,
  createNotificationChannelPreference,
  type NotificationCategoryPreference,
  type NotificationChannelPreference
} from '../preferences.js';
import type { NotificationPreferenceRepository } from '../repositories.js';

interface NotificationChannelPreferenceRow {
  readonly user_id: string;
  readonly channel: NotificationChannel;
  readonly enabled: boolean;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

interface NotificationCategoryPreferenceRow {
  readonly user_id: string;
  readonly category: NotificationCategory;
  readonly enabled: boolean;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

const CHANNEL_COLUMNS = `
  user_id,
  channel,
  enabled,
  created_at,
  updated_at`;

const CATEGORY_COLUMNS = `
  user_id,
  category,
  enabled,
  created_at,
  updated_at`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapChannelPreference(
  row: NotificationChannelPreferenceRow
): NotificationChannelPreference {
  return createNotificationChannelPreference({
    ownerId: row.user_id,
    channel: row.channel,
    enabled: row.enabled,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  });
}

function mapCategoryPreference(
  row: NotificationCategoryPreferenceRow
): NotificationCategoryPreference {
  return createNotificationCategoryPreference({
    ownerId: row.user_id,
    category: row.category,
    enabled: row.enabled,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  });
}

export class PostgresNotificationPreferenceRepository
  implements NotificationPreferenceRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async findChannelPreference(
    ownerId: string,
    channel: NotificationChannel
  ): Promise<NotificationChannelPreference | null> {
    const validatedOwnerId = assertOwnerAccountId(ownerId);
    const validatedChannel = assertNotificationChannel(channel);
    const result = await this.executor.query<NotificationChannelPreferenceRow>(
      `
        SELECT${CHANNEL_COLUMNS}
        FROM notification_channel_preferences
        WHERE user_id = $1
          AND channel = $2`,
      [validatedOwnerId, validatedChannel]
    );

    const row = result.rows[0];
    return row === undefined ? null : mapChannelPreference(row);
  }

  public async findCategoryPreference(
    ownerId: string,
    category: NotificationCategory
  ): Promise<NotificationCategoryPreference | null> {
    const validatedOwnerId = assertOwnerAccountId(ownerId);
    const validatedCategory = assertNotificationCategory(category);
    const result = await this.executor.query<NotificationCategoryPreferenceRow>(
      `
        SELECT${CATEGORY_COLUMNS}
        FROM notification_category_preferences
        WHERE user_id = $1
          AND category = $2`,
      [validatedOwnerId, validatedCategory]
    );

    const row = result.rows[0];
    return row === undefined ? null : mapCategoryPreference(row);
  }

  public async setChannelPreference(
    preference: NotificationChannelPreference
  ): Promise<NotificationChannelPreference> {
    const validatedPreference = createNotificationChannelPreference(preference);
    const result = await this.executor.query<NotificationChannelPreferenceRow>(
      `
        INSERT INTO notification_channel_preferences (
          user_id,
          channel,
          enabled,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, channel)
        DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = EXCLUDED.updated_at
        RETURNING${CHANNEL_COLUMNS}`,
      [
        validatedPreference.ownerId,
        validatedPreference.channel,
        validatedPreference.enabled,
        validatedPreference.createdAt,
        validatedPreference.updatedAt
      ]
    );

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Notification channel preference persistence returned no row.');
    }

    return mapChannelPreference(row);
  }

  public async setCategoryPreference(
    preference: NotificationCategoryPreference
  ): Promise<NotificationCategoryPreference> {
    const validatedPreference = createNotificationCategoryPreference(preference);
    const result = await this.executor.query<NotificationCategoryPreferenceRow>(
      `
        INSERT INTO notification_category_preferences (
          user_id,
          category,
          enabled,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, category)
        DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = EXCLUDED.updated_at
        RETURNING${CATEGORY_COLUMNS}`,
      [
        validatedPreference.ownerId,
        validatedPreference.category,
        validatedPreference.enabled,
        validatedPreference.createdAt,
        validatedPreference.updatedAt
      ]
    );

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Notification category preference persistence returned no row.');
    }

    return mapCategoryPreference(row);
  }
}
