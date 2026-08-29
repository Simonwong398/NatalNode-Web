import type {
  NotificationCategory,
  NotificationCategoryPreferenceApiResponse,
  NotificationChannelPreferenceApiResponse,
  NotificationStateApiResponse,
  RegisterPushSubscriptionApiRequest,
  RegisterPushSubscriptionApiResponse,
  SafePushSubscriptionMetadata
} from '@natalnode/contracts';

const NOTIFICATION_STATE_ENDPOINT = '/api/account/notifications';
const CHANNEL_PREFERENCE_ENDPOINT =
  '/api/account/notifications/preferences/channel';
const CATEGORY_PREFERENCE_ENDPOINT =
  '/api/account/notifications/preferences/category';
const PUSH_SUBSCRIPTIONS_ENDPOINT =
  '/api/account/notifications/web-push/subscriptions';

export type NotificationRequestFailureStatus =
  | 'invalid-request'
  | 'unauthorized'
  | 'conflict'
  | 'unavailable'
  | 'rate-limited'
  | 'failed';

export interface NotificationRequestFailure {
  readonly status: NotificationRequestFailureStatus;
}

export type NotificationStateResult =
  | { readonly status: 'success'; readonly state: NotificationStateApiResponse }
  | NotificationRequestFailure;

export type NotificationChannelPreferenceResult =
  | {
      readonly status: 'success';
      readonly preference: NotificationChannelPreferenceApiResponse;
    }
  | NotificationRequestFailure;

export type NotificationCategoryPreferenceResult =
  | {
      readonly status: 'success';
      readonly preference: NotificationCategoryPreferenceApiResponse;
    }
  | NotificationRequestFailure;

export type NotificationRegistrationResult =
  | {
      readonly status: 'success';
      readonly subscription: RegisterPushSubscriptionApiResponse['subscription'];
    }
  | NotificationRequestFailure;

export type NotificationRemovalResult =
  | { readonly status: 'success' }
  | NotificationRequestFailure;

export interface NotificationClient {
  getState(signal?: AbortSignal): Promise<NotificationStateResult>;
  setChannelPreference(
    enabled: boolean,
    signal?: AbortSignal
  ): Promise<NotificationChannelPreferenceResult>;
  setCategoryPreference(
    category: NotificationCategory,
    enabled: boolean,
    signal?: AbortSignal
  ): Promise<NotificationCategoryPreferenceResult>;
  registerPushSubscription(
    request: RegisterPushSubscriptionApiRequest,
    signal?: AbortSignal
  ): Promise<NotificationRegistrationResult>;
  removePushSubscription(
    subscriptionId: string,
    signal?: AbortSignal
  ): Promise<NotificationRemovalResult>;
}

export type NotificationFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBooleanOrNull(value: unknown): value is boolean | null {
  return value === null || typeof value === 'boolean';
}

function isSafeSubscriptionMetadata(
  value: unknown
): value is SafePushSubscriptionMetadata {
  return (
    isRecord(value) &&
    typeof value.subscriptionId === 'string' &&
    value.channel === 'WEB_PUSH' &&
    (value.status === 'ACTIVE' || value.status === 'INVALIDATED') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (typeof value.lastSuccessAt === 'string' || value.lastSuccessAt === null) &&
    (typeof value.invalidatedAt === 'string' || value.invalidatedAt === null)
  );
}

function isNotificationStateResponse(
  value: unknown
): value is NotificationStateApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  const capability = value.webPushCapability;
  const channelPreferences = value.channelPreferences;
  const categoryPreferences = value.categoryPreferences;
  const subscriptions = value.pushSubscriptions;

  if (
    !isRecord(capability) ||
    typeof capability.configured !== 'boolean' ||
    (capability.configured
      ? typeof capability.applicationServerKey !== 'string' ||
        capability.applicationServerKey.length === 0
      : capability.applicationServerKey !== null) ||
    !isRecord(channelPreferences) ||
    !isBooleanOrNull(channelPreferences.WEB_PUSH) ||
    !isRecord(categoryPreferences) ||
    !isBooleanOrNull(categoryPreferences.ACCOUNT) ||
    !isBooleanOrNull(categoryPreferences.SYSTEM) ||
    !isBooleanOrNull(categoryPreferences.ASTROLOGY_ALERT) ||
    !Array.isArray(subscriptions)
  ) {
    return false;
  }

  return subscriptions.every(isSafeSubscriptionMetadata);
}

function isChannelPreferenceResponse(
  value: unknown
): value is NotificationChannelPreferenceApiResponse {
  if (!isRecord(value) || !isRecord(value.preference)) {
    return false;
  }

  return (
    value.preference.channel === 'WEB_PUSH' &&
    typeof value.preference.enabled === 'boolean' &&
    typeof value.preference.createdAt === 'string' &&
    typeof value.preference.updatedAt === 'string'
  );
}

function isCategoryPreferenceResponse(
  value: unknown
): value is NotificationCategoryPreferenceApiResponse {
  if (!isRecord(value) || !isRecord(value.preference)) {
    return false;
  }

  return (
    (value.preference.category === 'ACCOUNT' ||
      value.preference.category === 'SYSTEM' ||
      value.preference.category === 'ASTROLOGY_ALERT') &&
    typeof value.preference.enabled === 'boolean' &&
    typeof value.preference.createdAt === 'string' &&
    typeof value.preference.updatedAt === 'string'
  );
}

function isRegistrationResponse(
  value: unknown
): value is RegisterPushSubscriptionApiResponse {
  return isRecord(value) && isSafeSubscriptionMetadata(value.subscription);
}

function responseFailure(response: Response): NotificationRequestFailure {
  if (response.status === 400) {
    return { status: 'invalid-request' };
  }

  if (response.status === 401) {
    return { status: 'unauthorized' };
  }

  if (response.status === 409) {
    return { status: 'conflict' };
  }

  if (response.status === 429) {
    return { status: 'rate-limited' };
  }

  if (response.status === 503) {
    return { status: 'unavailable' };
  }

  return { status: 'failed' };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function jsonRequest(
  method: 'POST' | 'PUT',
  body: unknown,
  signal?: AbortSignal
): RequestInit {
  return {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(body),
    signal
  };
}

function defaultFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

export function createNotificationClient(
  fetchImplementation: NotificationFetch = defaultFetch
): NotificationClient {
  return {
    async getState(signal): Promise<NotificationStateResult> {
      try {
        const response = await fetchImplementation(NOTIFICATION_STATE_ENDPOINT, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
          signal
        });

        if (response.status !== 200) {
          return responseFailure(response);
        }

        const payload = await readJson(response);

        return isNotificationStateResponse(payload)
          ? { status: 'success', state: payload }
          : { status: 'failed' };
      } catch (_error) {
        return { status: 'failed' };
      }
    },

    async setChannelPreference(
      enabled,
      signal
    ): Promise<NotificationChannelPreferenceResult> {
      try {
        const response = await fetchImplementation(
          CHANNEL_PREFERENCE_ENDPOINT,
          jsonRequest('PUT', { channel: 'WEB_PUSH', enabled }, signal)
        );

        if (response.status !== 200) {
          return responseFailure(response);
        }

        const payload = await readJson(response);

        return isChannelPreferenceResponse(payload)
          ? { status: 'success', preference: payload }
          : { status: 'failed' };
      } catch (_error) {
        return { status: 'failed' };
      }
    },

    async setCategoryPreference(
      category,
      enabled,
      signal
    ): Promise<NotificationCategoryPreferenceResult> {
      try {
        const response = await fetchImplementation(
          CATEGORY_PREFERENCE_ENDPOINT,
          jsonRequest('PUT', { category, enabled }, signal)
        );

        if (response.status !== 200) {
          return responseFailure(response);
        }

        const payload = await readJson(response);

        return isCategoryPreferenceResponse(payload)
          ? { status: 'success', preference: payload }
          : { status: 'failed' };
      } catch (_error) {
        return { status: 'failed' };
      }
    },

    async registerPushSubscription(
      request,
      signal
    ): Promise<NotificationRegistrationResult> {
      try {
        const response = await fetchImplementation(
          PUSH_SUBSCRIPTIONS_ENDPOINT,
          jsonRequest('POST', request, signal)
        );

        if (response.status !== 200) {
          return responseFailure(response);
        }

        const payload = await readJson(response);

        return isRegistrationResponse(payload)
          ? { status: 'success', subscription: payload.subscription }
          : { status: 'failed' };
      } catch (_error) {
        return { status: 'failed' };
      }
    },

    async removePushSubscription(
      subscriptionId,
      signal
    ): Promise<NotificationRemovalResult> {
      try {
        const response = await fetchImplementation(
          `${PUSH_SUBSCRIPTIONS_ENDPOINT}/${encodeURIComponent(subscriptionId)}`,
          {
            method: 'DELETE',
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
            signal
          }
        );

        return response.status === 204
          ? { status: 'success' }
          : responseFailure(response);
      } catch (_error) {
        return { status: 'failed' };
      }
    }
  };
}
