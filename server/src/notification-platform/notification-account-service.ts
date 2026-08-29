import type {
  NotificationCategoryPreferenceApiResponse,
  NotificationChannelPreferenceApiResponse,
  NotificationCategoryPreferenceApiRequest,
  NotificationChannelPreferenceApiRequest,
  NotificationStateApiResponse,
  RegisterPushSubscriptionApiRequest,
  RegisterPushSubscriptionApiResponse,
  SafePushSubscriptionMetadata
} from '@natalnode/contracts';
import {
  assertAuthKey,
  assertOwnerAccountId,
  assertP256dhKey,
  assertPushSubscriptionEndpoint,
  assertServerIdentifier,
  NOTIFICATION_CATEGORIES,
} from './notification-domain.js';
import {
  createNotificationCategoryPreference,
  createNotificationChannelPreference
} from './preferences.js';
import { toPushSubscriptionSafeMetadata } from './push-subscription.js';
import type { NotificationPreferenceRepository, PushSubscriptionRepository } from './repositories.js';
import type { PushSubscriptionRecord, PushSubscriptionRegistration } from './push-subscription.js';
import type { Clock, IdGenerator } from '../app/creation-boundaries.js';

export interface NotificationAccountServiceDependencies {
  readonly notificationPreferences: NotificationPreferenceRepository;
  readonly pushSubscriptions: PushSubscriptionRepository;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
}

export type RegisterNotificationPushSubscriptionResult =
  | {
      readonly outcome: 'success';
      readonly response: RegisterPushSubscriptionApiResponse;
    }
  | { readonly outcome: 'conflict' };

function safeMetadata(
  subscription: PushSubscriptionRecord
): SafePushSubscriptionMetadata {
  return toPushSubscriptionSafeMetadata(subscription);
}

function channelPreferenceResponse(
  preference: Awaited<
    ReturnType<NotificationPreferenceRepository['setChannelPreference']>
  >
): NotificationChannelPreferenceApiResponse {
  return {
    preference: {
      channel: preference.channel,
      enabled: preference.enabled,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt
    }
  };
}

function categoryPreferenceResponse(
  preference: Awaited<
    ReturnType<NotificationPreferenceRepository['setCategoryPreference']>
  >
): NotificationCategoryPreferenceApiResponse {
  return {
    preference: {
      category: preference.category,
      enabled: preference.enabled,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt
    }
  };
}

export class NotificationAccountService {
  public constructor(
    private readonly dependencies: NotificationAccountServiceDependencies
  ) {}

  public async getNotificationState(
    ownerId: string
  ): Promise<NotificationStateApiResponse> {
    const validatedOwnerId = assertOwnerAccountId(ownerId);
    const [channelPreference, ...categoryPreferences] = await Promise.all([
      this.dependencies.notificationPreferences.findChannelPreference(
        validatedOwnerId,
        'WEB_PUSH'
      ),
      ...NOTIFICATION_CATEGORIES.map((category) =>
        this.dependencies.notificationPreferences.findCategoryPreference(
          validatedOwnerId,
          category
        )
      )
    ]);
    const subscriptions =
      await this.dependencies.pushSubscriptions.listActiveForOwner(
        validatedOwnerId
      );
    const [accountPreference, systemPreference, astrologyPreference] =
      categoryPreferences;

    return {
      channelPreferences: {
        WEB_PUSH: channelPreference?.enabled ?? null
      },
      categoryPreferences: {
        ACCOUNT: accountPreference?.enabled ?? null,
        SYSTEM: systemPreference?.enabled ?? null,
        ASTROLOGY_ALERT: astrologyPreference?.enabled ?? null
      },
      pushSubscriptions: subscriptions.map(safeMetadata)
    };
  }

  public async setChannelPreference(
    ownerId: string,
    request: NotificationChannelPreferenceApiRequest
  ): Promise<NotificationChannelPreferenceApiResponse> {
    const timestamp = this.dependencies.clock.now();
    const preference = createNotificationChannelPreference({
      ownerId: assertOwnerAccountId(ownerId),
      channel: request.channel,
      enabled: request.enabled,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    return channelPreferenceResponse(
      await this.dependencies.notificationPreferences.setChannelPreference(
        preference
      )
    );
  }

  public async setCategoryPreference(
    ownerId: string,
    request: NotificationCategoryPreferenceApiRequest
  ): Promise<NotificationCategoryPreferenceApiResponse> {
    const timestamp = this.dependencies.clock.now();
    const preference = createNotificationCategoryPreference({
      ownerId: assertOwnerAccountId(ownerId),
      category: request.category,
      enabled: request.enabled,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    return categoryPreferenceResponse(
      await this.dependencies.notificationPreferences.setCategoryPreference(
        preference
      )
    );
  }

  public async registerPushSubscription(
    ownerId: string,
    request: RegisterPushSubscriptionApiRequest
  ): Promise<RegisterNotificationPushSubscriptionResult> {
    const validatedOwnerId = assertOwnerAccountId(ownerId);
    const endpoint = assertPushSubscriptionEndpoint(request.endpoint);
    const p256dh = assertP256dhKey(request.keys.p256dh);
    const auth = assertAuthKey(request.keys.auth);
    const timestamp = this.dependencies.clock.now();
    const registration: PushSubscriptionRegistration = {
      subscriptionId: this.dependencies.idGenerator.generate(),
      ownerId: validatedOwnerId,
      endpoint,
      p256dh,
      auth,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const result = await this.dependencies.pushSubscriptions.register(
      registration
    );

    if (result.outcome === 'OWNERSHIP_CONFLICT') {
      return { outcome: 'conflict' };
    }

    return {
      outcome: 'success',
      response: { subscription: safeMetadata(result.subscription) }
    };
  }

  public async removePushSubscription(
    ownerId: string,
    subscriptionId: string
  ): Promise<void> {
    await this.dependencies.pushSubscriptions.removeForOwner(
      assertOwnerAccountId(ownerId),
      assertServerIdentifier(subscriptionId, 'subscriptionId')
    );
  }
}
