import {
  assertNotificationCategory,
  assertNotificationDedupeKey,
  assertNotificationTypeKey,
  assertOwnerAccountId,
  assertServerIdentifier,
  assertServerTimestamp,
  type NotificationCategory
} from './notification-domain.js';
import {
  assertWebPushPayloadV1,
  type WebPushPayloadV1
} from './web-push-payload.js';

export const NOTIFICATION_DELIVERY_STATES = [
  'PENDING',
  'RETRYABLE',
  'PROCESSING',
  'DELIVERED',
  'DEAD',
  'CANCELLED'
] as const;

export type NotificationDeliveryState =
  (typeof NOTIFICATION_DELIVERY_STATES)[number];

export const NOTIFICATION_FAILURE_CLASSES = [
  'SUBSCRIPTION_INVALID',
  'THROTTLED',
  'TRANSIENT_UPSTREAM',
  'TIMEOUT_AMBIGUOUS',
  'CONFIGURATION_UNAVAILABLE',
  'PAYLOAD_INVALID',
  'PERMANENT_FAILURE'
] as const;

export type NotificationFailureClass =
  (typeof NOTIFICATION_FAILURE_CLASSES)[number];

export const NOTIFICATION_CANCEL_REASONS = [
  'INELIGIBLE',
  'CHANNEL_NOT_ENABLED',
  'CATEGORY_NOT_ENABLED',
  'SUBSCRIPTION_NOT_ACTIVE',
  'TRUSTED_ELIGIBILITY_REVOKED'
] as const;

export type NotificationCancelReason =
  (typeof NOTIFICATION_CANCEL_REASONS)[number];

export const MAX_NOTIFICATION_TEMPLATE_VERSION = 2147483647;

export function assertNotificationTemplateVersion(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > MAX_NOTIFICATION_TEMPLATE_VERSION
  ) {
    throw new Error('Notification template version is invalid.');
  }

  return value;
}

export interface NotificationIntentRecord {
  readonly intentId: string;
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly channel: 'WEB_PUSH';
  readonly notificationTypeKey: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly payloadVersion: 1;
  readonly payload: WebPushPayloadV1;
  readonly dedupeKey: string;
  readonly deliverAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export interface NotificationDeliveryRecord {
  readonly deliveryId: string;
  readonly intentId: string;
  readonly ownerId: string;
  readonly subscriptionId: string;
  readonly state: NotificationDeliveryState;
  readonly attemptCount: number;
  readonly nextAttemptAt: string | null;
  readonly claimToken: string | null;
  readonly claimExpiresAt: string | null;
  readonly lastFailureClass: NotificationFailureClass | null;
  readonly cancelReason: NotificationCancelReason | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastAttemptAt: string | null;
  readonly firstAttemptAt: string | null;
  readonly deliveredAt: string | null;
  readonly terminalAt: string | null;
}

export type NotificationNotEnqueuedReason =
  | 'INELIGIBLE'
  | 'CHANNEL_NOT_ENABLED'
  | 'CATEGORY_NOT_ENABLED'
  | 'NO_ACTIVE_SUBSCRIPTIONS';

export type NotificationEnqueueResult =
  | {
      readonly outcome: 'CREATED';
      readonly intent: NotificationIntentRecord;
      readonly deliveries: readonly NotificationDeliveryRecord[];
    }
  | {
      readonly outcome: 'DUPLICATE';
      readonly intent: NotificationIntentRecord;
      readonly deliveries: readonly NotificationDeliveryRecord[];
    }
  | {
      readonly outcome: 'NOT_ENQUEUED';
      readonly reason: NotificationNotEnqueuedReason;
    };

export function isNotificationDeliveryState(
  value: unknown
): value is NotificationDeliveryState {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_DELIVERY_STATES as readonly string[]).includes(value)
  );
}

export function isNotificationFailureClass(
  value: unknown
): value is NotificationFailureClass {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_FAILURE_CLASSES as readonly string[]).includes(value)
  );
}

export function isNotificationCancelReason(
  value: unknown
): value is NotificationCancelReason {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_CANCEL_REASONS as readonly string[]).includes(value)
  );
}

function assertTimestampOrder(
  start: string,
  end: string,
  message: string
): void {
  if (Date.parse(end) < Date.parse(start)) {
    throw new Error(message);
  }
}

export function createNotificationIntentRecord(input: {
  readonly intentId: string;
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly notificationTypeKey: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly payload: unknown;
  readonly dedupeKey: string;
  readonly deliverAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}): NotificationIntentRecord {
  const intentId = assertServerIdentifier(input.intentId, 'intentId');
  const ownerId = assertOwnerAccountId(input.ownerId);
  const category = assertNotificationCategory(input.category);
  const notificationTypeKey = assertNotificationTypeKey(
    input.notificationTypeKey
  );
  const templateKey = assertServerIdentifier(input.templateKey, 'templateKey');
  const templateVersion = assertNotificationTemplateVersion(
    input.templateVersion
  );
  const payload = assertWebPushPayloadV1(input.payload);
  const dedupeKey = assertNotificationDedupeKey(input.dedupeKey);
  const deliverAt = assertServerTimestamp(input.deliverAt, 'deliverAt');
  const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
  const updatedAt = assertServerTimestamp(input.updatedAt, 'updatedAt');
  const completedAt =
    input.completedAt === null
      ? null
      : assertServerTimestamp(input.completedAt, 'completedAt');

  assertTimestampOrder(
    createdAt,
    updatedAt,
    'Notification intent timestamps are invalid.'
  );
  if (completedAt !== null) {
    assertTimestampOrder(
      createdAt,
      completedAt,
      'Notification intent completion timestamp is invalid.'
    );
  }

  return Object.freeze({
    intentId,
    ownerId,
    category,
    channel: 'WEB_PUSH' as const,
    notificationTypeKey,
    templateKey,
    templateVersion,
    payloadVersion: 1 as const,
    payload,
    dedupeKey,
    deliverAt,
    createdAt,
    updatedAt,
    completedAt
  });
}

export function createNotificationDeliveryRecord(input: {
  readonly deliveryId: string;
  readonly intentId: string;
  readonly ownerId: string;
  readonly subscriptionId: string;
  readonly state: NotificationDeliveryState;
  readonly attemptCount: number;
  readonly nextAttemptAt: string | null;
  readonly claimToken: string | null;
  readonly claimExpiresAt: string | null;
  readonly lastFailureClass: NotificationFailureClass | null;
  readonly cancelReason: NotificationCancelReason | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastAttemptAt: string | null;
  readonly firstAttemptAt: string | null;
  readonly deliveredAt: string | null;
  readonly terminalAt: string | null;
}): NotificationDeliveryRecord {
  const deliveryId = assertServerIdentifier(input.deliveryId, 'deliveryId');
  const intentId = assertServerIdentifier(input.intentId, 'intentId');
  const ownerId = assertOwnerAccountId(input.ownerId);
  const subscriptionId = assertServerIdentifier(
    input.subscriptionId,
    'subscriptionId'
  );
  if (!isNotificationDeliveryState(input.state)) {
    throw new Error('Notification delivery state is invalid.');
  }
  if (
    !Number.isSafeInteger(input.attemptCount) ||
    input.attemptCount < 0 ||
    input.attemptCount > 5
  ) {
    throw new Error('Notification delivery attempt count is invalid.');
  }
  if (input.nextAttemptAt !== null) {
    assertServerTimestamp(input.nextAttemptAt, 'nextAttemptAt');
  }
  if (input.claimToken !== null) {
    assertServerIdentifier(input.claimToken, 'claimToken');
  }
  if (input.claimExpiresAt !== null) {
    assertServerTimestamp(input.claimExpiresAt, 'claimExpiresAt');
  }
  if (
    input.lastFailureClass !== null &&
    !isNotificationFailureClass(input.lastFailureClass)
  ) {
    throw new Error('Notification delivery failure class is invalid.');
  }
  if (
    input.cancelReason !== null &&
    !isNotificationCancelReason(input.cancelReason)
  ) {
    throw new Error('Notification delivery cancel reason is invalid.');
  }
  const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
  const updatedAt = assertServerTimestamp(input.updatedAt, 'updatedAt');
  const lastAttemptAt =
    input.lastAttemptAt === null
      ? null
      : assertServerTimestamp(input.lastAttemptAt, 'lastAttemptAt');
  const firstAttemptAt =
    input.firstAttemptAt === null
      ? null
      : assertServerTimestamp(input.firstAttemptAt, 'firstAttemptAt');
  const deliveredAt =
    input.deliveredAt === null
      ? null
      : assertServerTimestamp(input.deliveredAt, 'deliveredAt');
  const terminalAt =
    input.terminalAt === null
      ? null
      : assertServerTimestamp(input.terminalAt, 'terminalAt');

  const requiresDueTimestamp =
    input.state === 'PENDING' || input.state === 'RETRYABLE';
  if (requiresDueTimestamp !== (input.nextAttemptAt !== null)) {
    throw new Error('Notification delivery due timestamp is invalid.');
  }
  if (input.state === 'PENDING' && input.attemptCount !== 0) {
    throw new Error('Pending notification delivery attempt count is invalid.');
  }

  if ((input.attemptCount === 0) !== (firstAttemptAt === null)) {
    throw new Error('Notification delivery first attempt timestamp is invalid.');
  }

  const isProcessing = input.state === 'PROCESSING';
  if (
    isProcessing !==
      (input.claimToken !== null && input.claimExpiresAt !== null) ||
    (!isProcessing &&
      (input.claimToken !== null || input.claimExpiresAt !== null))
  ) {
    throw new Error('Notification delivery claim fields are invalid.');
  }

  const isCancelled = input.state === 'CANCELLED';
  if (isCancelled !== (input.cancelReason !== null)) {
    throw new Error('Notification delivery cancel reason is invalid.');
  }

  const isTerminal =
    input.state === 'DELIVERED' ||
    input.state === 'DEAD' ||
    input.state === 'CANCELLED';
  if (isTerminal !== (terminalAt !== null)) {
    throw new Error('Notification delivery terminal timestamp is invalid.');
  }

  if ((input.state === 'DELIVERED') !== (deliveredAt !== null)) {
    throw new Error('Notification delivery completion timestamp is invalid.');
  }

  assertTimestampOrder(
    createdAt,
    updatedAt,
    'Notification delivery timestamps are invalid.'
  );
  if (firstAttemptAt !== null) {
    assertTimestampOrder(
      createdAt,
      firstAttemptAt,
      'Notification delivery first attempt timestamp is invalid.'
    );
  }

  return Object.freeze({
    deliveryId,
    intentId,
    ownerId,
    subscriptionId,
    state: input.state,
    attemptCount: input.attemptCount,
    nextAttemptAt: input.nextAttemptAt,
    claimToken: input.claimToken,
    claimExpiresAt: input.claimExpiresAt,
    lastFailureClass: input.lastFailureClass,
    cancelReason: input.cancelReason,
    createdAt,
    updatedAt,
    lastAttemptAt,
    firstAttemptAt,
    deliveredAt,
    terminalAt
  });
}
