import {
  assertAuthKey,
  assertOwnerAccountId,
  assertP256dhKey,
  assertPushSubscriptionEndpoint,
  assertPushSubscriptionStatus,
  assertServerIdentifier,
  assertServerTimestamp,
  hashPushSubscriptionEndpoint,
  type PushSubscriptionStatus
} from './notification-domain.js';

export interface PushSubscriptionRegistration {
  readonly subscriptionId: string;
  readonly ownerId: string;
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Internal record containing transport credentials; never use as an owner-facing DTO. */
export interface PushSubscriptionRecord extends PushSubscriptionRegistration {
  readonly endpointHash: string;
  readonly lastSuccessAt: string | null;
  readonly status: PushSubscriptionStatus;
  readonly invalidatedAt: string | null;
}

/** Safe metadata intentionally excludes endpoint, endpointHash, p256dh, and auth. */
export interface PushSubscriptionSafeMetadata {
  readonly subscriptionId: string;
  readonly channel: 'WEB_PUSH';
  readonly status: PushSubscriptionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSuccessAt: string | null;
  readonly invalidatedAt: string | null;
}

function assertTimestampOrder(createdAt: string, updatedAt: string): void {
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error('Push subscription timestamps are invalid.');
  }
}

export function createActivePushSubscription(
  input: PushSubscriptionRegistration
): PushSubscriptionRecord {
  return createPushSubscriptionRecord({
    ...input,
    endpointHash: hashPushSubscriptionEndpoint(input.endpoint),
    lastSuccessAt: null,
    status: 'ACTIVE',
    invalidatedAt: null
  });
}

export function createPushSubscriptionRecord(input: {
  readonly subscriptionId: string;
  readonly ownerId: string;
  readonly endpoint: string;
  readonly endpointHash: string;
  readonly p256dh: string;
  readonly auth: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSuccessAt: string | null;
  readonly status: PushSubscriptionStatus;
  readonly invalidatedAt: string | null;
}): PushSubscriptionRecord {
  const subscriptionId = assertServerIdentifier(
    input.subscriptionId,
    'subscriptionId'
  );
  const ownerId = assertOwnerAccountId(input.ownerId);
  const endpoint = assertPushSubscriptionEndpoint(input.endpoint);
  const endpointHash = assertServerIdentifier(input.endpointHash, 'endpointHash');
  const p256dh = assertP256dhKey(input.p256dh);
  const auth = assertAuthKey(input.auth);
  const createdAt = assertServerTimestamp(input.createdAt, 'createdAt');
  const updatedAt = assertServerTimestamp(input.updatedAt, 'updatedAt');
  const lastSuccessAt =
    input.lastSuccessAt === null
      ? null
      : assertServerTimestamp(input.lastSuccessAt, 'lastSuccessAt');
  const status = assertPushSubscriptionStatus(input.status);
  const invalidatedAt =
    input.invalidatedAt === null
      ? null
      : assertServerTimestamp(input.invalidatedAt, 'invalidatedAt');

  assertTimestampOrder(createdAt, updatedAt);

  if (endpointHash !== hashPushSubscriptionEndpoint(endpoint)) {
    throw new Error('Push subscription endpoint hash is invalid.');
  }

  if (
    (status === 'ACTIVE' && invalidatedAt !== null) ||
    (status === 'INVALIDATED' && invalidatedAt === null)
  ) {
    throw new Error('Push subscription status state is invalid.');
  }

  return Object.freeze({
    subscriptionId,
    ownerId,
    endpoint,
    endpointHash,
    p256dh,
    auth,
    createdAt,
    updatedAt,
    lastSuccessAt,
    status,
    invalidatedAt
  });
}

export function toPushSubscriptionSafeMetadata(
  subscription: PushSubscriptionRecord
): PushSubscriptionSafeMetadata {
  return Object.freeze({
    subscriptionId: subscription.subscriptionId,
    channel: 'WEB_PUSH',
    status: subscription.status,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    lastSuccessAt: subscription.lastSuccessAt,
    invalidatedAt: subscription.invalidatedAt
  });
}
