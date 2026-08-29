import {
  assertNotificationCategory,
  assertNotificationChannel,
  assertOwnerAccountId,
  assertServerTimestamp,
  type NotificationCategory,
  type NotificationChannel
} from './notification-domain.js';

export interface NotificationChannelPreference {
  readonly ownerId: string;
  readonly channel: NotificationChannel;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationCategoryPreference {
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function assertEnabled(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new Error('Notification preference enabled state is invalid.');
  }

  return value;
}

function assertTimestampOrder(createdAt: string, updatedAt: string): void {
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error('Notification preference timestamps are invalid.');
  }
}

export function createNotificationChannelPreference(input: {
  readonly ownerId: string;
  readonly channel: NotificationChannel;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}): NotificationChannelPreference {
  const ownerId = assertOwnerAccountId(input.ownerId);
  const channel = assertNotificationChannel(input.channel);
  const enabled = assertEnabled(input.enabled);
  const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
  const updatedAt = assertServerTimestamp(input.updatedAt, 'updatedAt');
  assertTimestampOrder(createdAt, updatedAt);

  return Object.freeze({ ownerId, channel, enabled, createdAt, updatedAt });
}

export function createNotificationCategoryPreference(input: {
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}): NotificationCategoryPreference {
  const ownerId = assertOwnerAccountId(input.ownerId);
  const category = assertNotificationCategory(input.category);
  const enabled = assertEnabled(input.enabled);
  const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
  const updatedAt = assertServerTimestamp(input.updatedAt, 'updatedAt');
  assertTimestampOrder(createdAt, updatedAt);

  return Object.freeze({ ownerId, category, enabled, createdAt, updatedAt });
}
