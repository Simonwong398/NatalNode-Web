/** Consumer notification channel supported by the current account API. */
export type NotificationChannel = 'WEB_PUSH';

/** Consumer notification categories exposed by the current account API. */
export type NotificationCategory =
  | 'ACCOUNT'
  | 'SYSTEM'
  | 'ASTROLOGY_ALERT';

export type NotificationSubscriptionStatus = 'ACTIVE' | 'INVALIDATED';

export interface NotificationChannelPreferenceApiRequest {
  readonly channel: 'WEB_PUSH';
  readonly enabled: boolean;
}

export interface NotificationCategoryPreferenceApiRequest {
  readonly category: NotificationCategory;
  readonly enabled: boolean;
}

export interface RegisterPushSubscriptionApiRequest {
  readonly endpoint: string;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
}

export interface NotificationChannelPreferenceApiResponse {
  readonly preference: {
    readonly channel: 'WEB_PUSH';
    readonly enabled: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
}

export interface NotificationCategoryPreferenceApiResponse {
  readonly preference: {
    readonly category: NotificationCategory;
    readonly enabled: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
}

/** Safe owner-facing metadata. Push credentials are intentionally absent. */
export interface SafePushSubscriptionMetadata {
  readonly subscriptionId: string;
  readonly channel: 'WEB_PUSH';
  readonly status: NotificationSubscriptionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSuccessAt: string | null;
  readonly invalidatedAt: string | null;
}

export interface NotificationStateApiResponse {
  readonly channelPreferences: {
    readonly WEB_PUSH: boolean | null;
  };
  readonly categoryPreferences: {
    readonly ACCOUNT: boolean | null;
    readonly SYSTEM: boolean | null;
    readonly ASTROLOGY_ALERT: boolean | null;
  };
  readonly pushSubscriptions: readonly SafePushSubscriptionMetadata[];
}

export interface RegisterPushSubscriptionApiResponse {
  readonly subscription: SafePushSubscriptionMetadata;
}
