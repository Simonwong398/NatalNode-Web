import type {
  NotificationCategory,
  NotificationTypeDescriptor
} from './notification-domain.js';
import type {
  NotificationEnqueueResult
} from './notification-delivery-domain.js';

/** The only payload-producing callback accepted by the persistence boundary. */
export interface NotificationEnqueuePersistenceInput {
  readonly ownerId: string;
  readonly category: NotificationCategory;
  readonly notificationTypeKey: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly dedupeKey: string;
  readonly trustedEligibility: boolean;
  readonly deliverAt: string;
  readonly createdAt: string;
  readonly renderPayload: () => unknown;
}

export interface NotificationEnqueueRepository {
  enqueue(
    input: NotificationEnqueuePersistenceInput
  ): Promise<NotificationEnqueueResult>;
}

/** Server-owned metadata and renderer resolved from a private type registry. */
export interface ServerOwnedNotificationTemplate {
  readonly category: NotificationCategory;
  readonly notificationTypeKey: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  render(): unknown;
}

export interface ServerOwnedNotificationTemplateRegistry {
  resolve(
    notificationType: NotificationTypeDescriptor
  ): ServerOwnedNotificationTemplate | null;
}
