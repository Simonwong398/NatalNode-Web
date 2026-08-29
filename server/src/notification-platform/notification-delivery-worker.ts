import type { NotificationCategory } from './notification-domain.js';
import type {
  WebPushTransport,
  WebPushTransportOutcome
} from './web-push-transport.js';
import type { WebPushVapidReadiness } from './web-push-vapid.js';

export const NOTIFICATION_DELIVERY_CLAIM_BATCH_SIZE = 50;
export const NOTIFICATION_DELIVERY_LEASE_SECONDS = 120;
export const NOTIFICATION_DELIVERY_MAX_ATTEMPTS = 5;
export const NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS = 30_000;
export const NOTIFICATION_RETRY_AFTER_MAXIMUM_SECONDS = 3_600;
export const NOTIFICATION_DELIVERY_RETRY_DELAYS_SECONDS = Object.freeze({
  1: 60,
  2: 300,
  3: 1_800,
  4: 7_200
} as const);

export type NotificationDeliveryPersistedState =
  | 'DELIVERED'
  | 'RETRYABLE'
  | 'DEAD'
  | 'CANCELLED';

export interface NotificationDeliveryClaim {
  readonly deliveryId: string;
  readonly intentId: string;
  readonly ownerId: string;
  readonly subscriptionId: string;
  readonly category: NotificationCategory;
  readonly channel: 'WEB_PUSH';
  readonly notificationTypeKey: string;
  readonly claimToken: string;
  readonly claimExpiresAt: string;
  readonly attemptCount: number;
  readonly firstAttemptAt: string;
}

export interface CurrentNotificationDeliveryEligibilityInput {
  readonly ownerId: string;
  readonly intentId: string;
  readonly category: NotificationCategory;
  readonly notificationTypeKey: string;
}

/**
 * Server-internal current-policy dependency. A worker must not substitute a
 * universal allow decision when this dependency is unavailable.
 */
export interface CurrentNotificationDeliveryEligibility {
  readonly available: boolean;
  isEligible(
    input: CurrentNotificationDeliveryEligibilityInput
  ): Promise<boolean>;
}

export type NotificationDeliverySkipReason =
  | 'STALE_CLAIM'
  | 'INSUFFICIENT_LEASE'
  | 'MISSING_TARGET';

export type NotificationDeliveryProcessingResult =
  | {
      readonly outcome: 'PERSISTED';
      readonly deliveryId: string;
      readonly state: NotificationDeliveryPersistedState;
    }
  | {
      readonly outcome: 'SKIPPED';
      readonly deliveryId: string;
      readonly reason: NotificationDeliverySkipReason;
    }
  | {
      readonly outcome: 'CONFIGURATION_UNAVAILABLE';
      readonly deliveryId: string;
    }
  | {
      readonly outcome: 'ELIGIBILITY_UNAVAILABLE';
      readonly deliveryId: string;
    };

export interface NotificationDeliveryWorkerRepository {
  recoverExpiredClaims(limit: number): Promise<number>;
  claimDueDeliveries(
    limit: number
  ): Promise<readonly NotificationDeliveryClaim[]>;
  processClaimedDelivery(
    claim: NotificationDeliveryClaim,
    input: {
      readonly eligibility: CurrentNotificationDeliveryEligibility;
      readonly transport: WebPushTransport;
      readonly transportAttemptTimeoutMillis: number;
    }
  ): Promise<NotificationDeliveryProcessingResult>;
}

export interface NotificationDeliveryWorkerDependencies {
  readonly readiness: WebPushVapidReadiness;
  readonly repository: NotificationDeliveryWorkerRepository;
  readonly transport: WebPushTransport;
  readonly eligibility: CurrentNotificationDeliveryEligibility;
  readonly claimBatchSize?: number;
  readonly transportAttemptTimeoutMillis?: number;
}

export interface NotificationDeliveryWorkerRunResult {
  readonly status:
    | 'COMPLETED'
    | 'CONFIGURATION_UNAVAILABLE'
    | 'ELIGIBILITY_UNAVAILABLE'
    | 'SHUTDOWN';
  readonly recovered: number;
  readonly claimed: number;
  readonly persisted: number;
  readonly skipped: number;
  readonly configurationUnavailable: number;
}

function assertBatchSize(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > NOTIFICATION_DELIVERY_CLAIM_BATCH_SIZE
  ) {
    throw new Error('Notification delivery claim batch size is invalid.');
  }

  return value;
}

function assertAttemptTimeoutMillis(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS
  ) {
    throw new Error('Notification delivery attempt timeout is invalid.');
  }

  return value;
}

export function notificationRetryDelaySeconds(
  attemptCount: number
): number | null {
  if (!Number.isSafeInteger(attemptCount)) {
    return null;
  }

  return (
    NOTIFICATION_DELIVERY_RETRY_DELAYS_SECONDS[
      attemptCount as keyof typeof NOTIFICATION_DELIVERY_RETRY_DELAYS_SECONDS
    ] ?? null
  );
}

export function boundedRetryAfterSeconds(value: unknown): number | undefined {
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= NOTIFICATION_RETRY_AFTER_MAXIMUM_SECONDS
    ? value
    : undefined;
}

export function isRetryableTransportOutcome(
  outcome: WebPushTransportOutcome['outcome']
): outcome is 'THROTTLED' | 'TRANSIENT_UPSTREAM' | 'TIMEOUT_AMBIGUOUS' {
  return (
    outcome === 'THROTTLED' ||
    outcome === 'TRANSIENT_UPSTREAM' ||
    outcome === 'TIMEOUT_AMBIGUOUS'
  );
}

/** Fail-closed placeholder until an authoritative current-policy source exists. */
export function createUnavailableNotificationDeliveryEligibility(): CurrentNotificationDeliveryEligibility {
  return Object.freeze({
    available: false,
    async isEligible(
      _input: CurrentNotificationDeliveryEligibilityInput
    ): Promise<boolean> {
      return false;
    }
  });
}

/**
 * One bounded consumer-worker drain. It is deliberately separate from the
 * HTTP runtime and never starts a polling loop or claims work after shutdown.
 */
export class NotificationDeliveryWorker {
  private readonly claimBatchSize: number;

  private readonly transportAttemptTimeoutMillis: number;

  private shutdownRequested = false;

  private activeRun: Promise<NotificationDeliveryWorkerRunResult> | undefined;

  public constructor(
    private readonly dependencies: NotificationDeliveryWorkerDependencies
  ) {
    this.claimBatchSize = assertBatchSize(
      dependencies.claimBatchSize ?? NOTIFICATION_DELIVERY_CLAIM_BATCH_SIZE
    );
    this.transportAttemptTimeoutMillis = assertAttemptTimeoutMillis(
      dependencies.transportAttemptTimeoutMillis ??
        NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS
    );
  }

  public requestShutdown(): void {
    this.shutdownRequested = true;
  }

  public runOnce(): Promise<NotificationDeliveryWorkerRunResult> {
    if (this.activeRun !== undefined) {
      return this.activeRun;
    }

    const run = this.executeOnce();
    const activeRun = run.finally(() => {
      if (this.activeRun === activeRun) {
        this.activeRun = undefined;
      }
    });
    this.activeRun = activeRun;

    return activeRun;
  }

  private async executeOnce(): Promise<NotificationDeliveryWorkerRunResult> {
    const emptyResult = {
      recovered: 0,
      claimed: 0,
      persisted: 0,
      skipped: 0,
      configurationUnavailable: 0
    } as const;

    if (this.shutdownRequested) {
      return { status: 'SHUTDOWN', ...emptyResult };
    }

    if (this.dependencies.readiness.status !== 'READY') {
      return {
        status: 'CONFIGURATION_UNAVAILABLE',
        ...emptyResult
      };
    }

    if (this.dependencies.eligibility.available !== true) {
      return {
        status: 'ELIGIBILITY_UNAVAILABLE',
        ...emptyResult
      };
    }

    const recovered = await this.dependencies.repository.recoverExpiredClaims(
      this.claimBatchSize
    );

    if (this.shutdownRequested) {
      return { ...emptyResult, status: 'SHUTDOWN', recovered };
    }

    const claims = await this.dependencies.repository.claimDueDeliveries(
      this.claimBatchSize
    );
    let persisted = 0;
    let skipped = 0;
    let configurationUnavailable = 0;
    let status: NotificationDeliveryWorkerRunResult['status'] = 'COMPLETED';

    for (const claim of claims) {
      if (this.shutdownRequested) {
        status = 'SHUTDOWN';
        break;
      }

      const result =
        await this.dependencies.repository.processClaimedDelivery(claim, {
          eligibility: this.dependencies.eligibility,
          transport: this.dependencies.transport,
          transportAttemptTimeoutMillis: this.transportAttemptTimeoutMillis
        });

      if (result.outcome === 'PERSISTED') {
        persisted += 1;
      } else if (result.outcome === 'SKIPPED') {
        skipped += 1;
      } else if (result.outcome === 'CONFIGURATION_UNAVAILABLE') {
        configurationUnavailable += 1;
        status = 'CONFIGURATION_UNAVAILABLE';
        break;
      } else {
        status = 'ELIGIBILITY_UNAVAILABLE';
        break;
      }
    }

    return {
      status,
      recovered,
      claimed: claims.length,
      persisted,
      skipped,
      configurationUnavailable
    };
  }
}
