export {
  assertAuthKey,
  assertNotificationCategory,
  assertNotificationChannel,
  assertNotificationDedupeKey,
  assertNotificationTypeKey,
  assertOwnerAccountId,
  assertP256dhKey,
  assertPushSubscriptionEndpoint,
  assertPushSubscriptionStatus,
  assertServerIdentifier,
  assertServerTimestamp,
  createNotificationIntent,
  createServerOwnedNotificationTypeDescriptor,
  hashPushSubscriptionEndpoint,
  isNotificationCategory,
  isNotificationChannel,
  isPushSubscriptionStatus,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  PUSH_SUBSCRIPTION_STATUSES,
  NotificationDomainValidationError
} from './notification-domain.js';
export type {
  CreateNotificationIntentInput,
  NotificationCategory,
  NotificationChannel,
  NotificationIntent,
  NotificationTypeDescriptor,
  PushSubscriptionStatus
} from './notification-domain.js';

export {
  createNotificationCategoryPreference,
  createNotificationChannelPreference
} from './preferences.js';
export type {
  NotificationCategoryPreference,
  NotificationChannelPreference
} from './preferences.js';

export {
  createActivePushSubscription,
  createPushSubscriptionRecord,
  toPushSubscriptionSafeMetadata
} from './push-subscription.js';
export type {
  PushSubscriptionRecord,
  PushSubscriptionRegistration,
  PushSubscriptionSafeMetadata
} from './push-subscription.js';

export type {
  NotificationPreferenceRepository,
  PushSubscriptionRepository,
  RegisterPushSubscriptionResult
} from './repositories.js';

export {
  NotificationAccountService
} from './notification-account-service.js';
export type {
  NotificationAccountServiceDependencies,
  RegisterNotificationPushSubscriptionResult
} from './notification-account-service.js';

export {
  PostgresNotificationPreferenceRepository,
  PostgresPushSubscriptionRepository
} from './postgres/index.js';
