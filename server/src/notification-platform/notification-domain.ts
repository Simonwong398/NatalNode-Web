import { createHash } from 'node:crypto';

export const NOTIFICATION_CATEGORIES = [
  'ACCOUNT',
  'SYSTEM',
  'ASTROLOGY_ALERT'
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CHANNELS = ['WEB_PUSH'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const PUSH_SUBSCRIPTION_STATUSES = ['ACTIVE', 'INVALIDATED'] as const;

export type PushSubscriptionStatus = (typeof PUSH_SUBSCRIPTION_STATUSES)[number];

export const MAX_NOTIFICATION_IDENTIFIER_LENGTH = 256;
export const MAX_NOTIFICATION_TYPE_KEY_LENGTH = 128;
export const MAX_NOTIFICATION_DEDUPE_KEY_LENGTH = 256;
export const MAX_NOTIFICATION_ENDPOINT_LENGTH = 2048;
export const MAX_WEB_PUSH_KEY_LENGTH = 512;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const NOTIFICATION_TYPE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/u;

export class NotificationDomainValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'NotificationDomainValidationError';
  }
}

function invalidField(fieldName: string): never {
  throw new NotificationDomainValidationError(`${fieldName} is invalid.`);
}

function assertBoundedString(
  value: unknown,
  fieldName: string,
  maximumLength: number
): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maximumLength ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    return invalidField(fieldName);
  }

  return value;
}

export function assertServerIdentifier(value: unknown, fieldName: string): string {
  const identifier = assertBoundedString(
    value,
    fieldName,
    MAX_NOTIFICATION_IDENTIFIER_LENGTH
  );

  if (identifier.trim() !== identifier) {
    return invalidField(fieldName);
  }

  return identifier;
}

export function assertOwnerAccountId(value: unknown): string {
  return assertServerIdentifier(value, 'ownerId');
}

export function isNotificationCategory(value: unknown): value is NotificationCategory {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_CATEGORIES as readonly string[]).includes(value)
  );
}

export function assertNotificationCategory(value: unknown): NotificationCategory {
  if (!isNotificationCategory(value)) {
    return invalidField('category');
  }

  return value;
}

export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_CHANNELS as readonly string[]).includes(value)
  );
}

export function assertNotificationChannel(value: unknown): NotificationChannel {
  if (!isNotificationChannel(value)) {
    return invalidField('channel');
  }

  return value;
}

export function isPushSubscriptionStatus(value: unknown): value is PushSubscriptionStatus {
  return (
    typeof value === 'string' &&
    (PUSH_SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
  );
}

export function assertPushSubscriptionStatus(value: unknown): PushSubscriptionStatus {
  if (!isPushSubscriptionStatus(value)) {
    return invalidField('status');
  }

  return value;
}

export function assertServerTimestamp(value: unknown, fieldName: string): string {
  const timestamp = assertBoundedString(value, fieldName, 64);

  if (!Number.isFinite(Date.parse(timestamp))) {
    return invalidField(fieldName);
  }

  return timestamp;
}

export function assertOptionalServerTimestamp(
  value: unknown,
  fieldName: string
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return assertServerTimestamp(value, fieldName);
}

export function assertNotificationTypeKey(value: unknown): string {
  const key = assertBoundedString(
    value,
    'notificationTypeKey',
    MAX_NOTIFICATION_TYPE_KEY_LENGTH
  );

  if (!NOTIFICATION_TYPE_KEY_PATTERN.test(key)) {
    return invalidField('notificationTypeKey');
  }

  return key;
}

export function assertNotificationDedupeKey(value: unknown): string {
  return assertServerIdentifier(value, 'dedupeKey').slice(
    0,
    MAX_NOTIFICATION_DEDUPE_KEY_LENGTH
  );
}

export function assertPushSubscriptionEndpoint(value: unknown): string {
  const endpoint = assertBoundedString(
    value,
    'endpoint',
    MAX_NOTIFICATION_ENDPOINT_LENGTH
  );

  if (endpoint.trim() !== endpoint) {
    return invalidField('endpoint');
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    return invalidField('endpoint');
  }

  if (
    parsedEndpoint.protocol !== 'https:' ||
    parsedEndpoint.hostname.length === 0 ||
    parsedEndpoint.username.length > 0 ||
    parsedEndpoint.password.length > 0 ||
    parsedEndpoint.hash.length > 0
  ) {
    return invalidField('endpoint');
  }

  return endpoint;
}

function assertWebPushKey(value: unknown, fieldName: string): string {
  const key = assertBoundedString(value, fieldName, MAX_WEB_PUSH_KEY_LENGTH);

  if (!BASE64URL_PATTERN.test(key)) {
    return invalidField(fieldName);
  }

  return key;
}

export function assertP256dhKey(value: unknown): string {
  return assertWebPushKey(value, 'p256dh');
}

export function assertAuthKey(value: unknown): string {
  return assertWebPushKey(value, 'auth');
}

export function hashPushSubscriptionEndpoint(endpoint: string): string {
  const validatedEndpoint = assertPushSubscriptionEndpoint(endpoint);

  return createHash('sha256')
    .update(validatedEndpoint, 'utf8')
    .digest('hex');
}

const notificationTypeDescriptorBrand = Symbol('notificationTypeDescriptor');

export interface NotificationTypeDescriptor {
  readonly category: NotificationCategory;
  readonly key: string;
  readonly [notificationTypeDescriptorBrand]: true;
}

/** Creates an opaque descriptor for a server-owned future type registry. */
export function createServerOwnedNotificationTypeDescriptor(input: {
  readonly category: NotificationCategory;
  readonly key: string;
}): NotificationTypeDescriptor {
  const category = assertNotificationCategory(input.category);
  const key = assertNotificationTypeKey(input.key);

  return Object.freeze({
    category,
    key,
    [notificationTypeDescriptorBrand]: true as const
  });
}

export interface NotificationIntent {
  readonly intentId: string;
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly notificationType: NotificationTypeDescriptor;
  readonly createdAt: string;
  readonly deliverAt?: string;
  readonly dedupeKey?: string;
  readonly referenceId?: string;
}

export interface CreateNotificationIntentInput {
  readonly intentId: string;
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly notificationType: NotificationTypeDescriptor;
  readonly createdAt: string;
  readonly deliverAt?: string;
  readonly dedupeKey?: string;
  readonly referenceId?: string;
}

/** Creates the smallest internal intent shape; it has no persistence or payload fields. */
export function createNotificationIntent(
  input: CreateNotificationIntentInput
): NotificationIntent {
  const intentId = assertServerIdentifier(input.intentId, 'intentId');
  const ownerId = assertOwnerAccountId(input.ownerId);
  const category = assertNotificationCategory(input.category);
  const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
  const deliverAt = assertOptionalServerTimestamp(input.deliverAt, 'deliverAt');

  if (input.notificationType.category !== category) {
    return invalidField('notificationType');
  }

  const dedupeKey =
    input.dedupeKey === undefined
      ? undefined
      : assertBoundedString(
          input.dedupeKey,
          'dedupeKey',
          MAX_NOTIFICATION_DEDUPE_KEY_LENGTH
        );
  const referenceId =
    input.referenceId === undefined
      ? undefined
      : assertServerIdentifier(input.referenceId, 'referenceId');

  return Object.freeze({
    intentId,
    ownerId,
    category,
    notificationType: input.notificationType,
    createdAt,
    ...(deliverAt === null ? {} : { deliverAt }),
    ...(dedupeKey === undefined ? {} : { dedupeKey }),
    ...(referenceId === undefined ? {} : { referenceId })
  });
}
