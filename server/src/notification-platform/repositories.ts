import type {
  NotificationCategoryPreference,
  NotificationChannelPreference
} from './preferences.js';
import type {
  NotificationCategory,
  NotificationChannel
} from './notification-domain.js';
import type {
  PushSubscriptionRecord,
  PushSubscriptionRegistration
} from './push-subscription.js';

export interface NotificationPreferenceRepository {
  findChannelPreference(
    ownerId: string,
    channel: NotificationChannel
  ): Promise<NotificationChannelPreference | null>;
  findCategoryPreference(
    ownerId: string,
    category: NotificationCategory
  ): Promise<NotificationCategoryPreference | null>;
  setChannelPreference(
    preference: NotificationChannelPreference
  ): Promise<NotificationChannelPreference>;
  setCategoryPreference(
    preference: NotificationCategoryPreference
  ): Promise<NotificationCategoryPreference>;
}

export type RegisterPushSubscriptionResult =
  | {
      readonly outcome: 'CREATED';
      readonly subscription: PushSubscriptionRecord;
    }
  | {
      readonly outcome: 'UPDATED_EXISTING_OWNER';
      readonly subscription: PushSubscriptionRecord;
    }
  | { readonly outcome: 'OWNERSHIP_CONFLICT' };

export interface PushSubscriptionRepository {
  register(
    registration: PushSubscriptionRegistration
  ): Promise<RegisterPushSubscriptionResult>;
  listActiveForOwner(ownerId: string): Promise<readonly PushSubscriptionRecord[]>;
  removeForOwner(ownerId: string, subscriptionId: string): Promise<boolean>;
  invalidate(subscriptionId: string, invalidatedAt: string): Promise<boolean>;
}
