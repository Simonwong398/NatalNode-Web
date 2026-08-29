import {
  assertNotificationCategory,
  assertNotificationDedupeKey,
  assertNotificationTypeKey,
  assertOwnerAccountId,
  assertOptionalServerTimestamp,
  assertServerIdentifier,
  assertServerTimestamp,
  createServerOwnedNotificationTypeDescriptor,
  type NotificationCategory,
  type NotificationTypeDescriptor
} from './notification-domain.js';
import type {
  NotificationEnqueueRepository,
  ServerOwnedNotificationTemplateRegistry
} from './notification-enqueue-repository.js';
import {
  assertNotificationTemplateVersion,
  type NotificationEnqueueResult
} from './notification-delivery-domain.js';
import type { Clock } from '../app/creation-boundaries.js';

export interface NotificationEnqueueServiceDependencies {
  readonly repository: NotificationEnqueueRepository;
  readonly templates: ServerOwnedNotificationTemplateRegistry;
  readonly clock: Clock;
}

export interface NotificationEnqueueInput {
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly notificationType: NotificationTypeDescriptor;
  readonly dedupeKey: string;
  readonly trustedEligibility: boolean;
  readonly deliverAt?: string;
}

export class NotificationTemplateUnavailableError extends Error {
  public constructor(notificationTypeKey: string) {
    super(`Notification template is unavailable: ${notificationTypeKey}`);
    this.name = 'NotificationTemplateUnavailableError';
  }
}

function assertTrustedEligibility(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new Error('Trusted notification eligibility is invalid.');
  }

  return value;
}

export class NotificationEnqueueService {
  public constructor(
    private readonly dependencies: NotificationEnqueueServiceDependencies
  ) {}

  public enqueue(
    input: NotificationEnqueueInput
  ): Promise<NotificationEnqueueResult> {
    const ownerId = assertOwnerAccountId(input.ownerId);
    const category = assertNotificationCategory(input.category);
    const notificationType = createServerOwnedNotificationTypeDescriptor({
      category: input.notificationType.category,
      key: input.notificationType.key
    });

    if (notificationType.category !== category) {
      throw new Error('Notification type category does not match input category.');
    }

    const notificationTypeKey = assertNotificationTypeKey(
      notificationType.key
    );
    const dedupeKey = assertNotificationDedupeKey(input.dedupeKey);
    const trustedEligibility = assertTrustedEligibility(
      input.trustedEligibility
    );
    const createdAt = assertServerTimestamp(
      this.dependencies.clock.now(),
      'createdAt'
    );
    const requestedDeliverAt = assertOptionalServerTimestamp(
      input.deliverAt,
      'deliverAt'
    );
    const deliverAt = requestedDeliverAt ?? createdAt;
    const template = this.dependencies.templates.resolve(notificationType);

    if (
      template === null ||
      template.category !== category ||
      template.notificationTypeKey !== notificationTypeKey
    ) {
      throw new NotificationTemplateUnavailableError(notificationTypeKey);
    }

    const templateKey = assertServerIdentifier(template.templateKey, 'templateKey');
    const templateVersion = assertNotificationTemplateVersion(
      template.templateVersion
    );

    return this.dependencies.repository.enqueue({
      ownerId,
      category,
      notificationTypeKey,
      templateKey,
      templateVersion,
      dedupeKey,
      trustedEligibility,
      deliverAt,
      createdAt,
      renderPayload: () => template.render()
    });
  }
}
