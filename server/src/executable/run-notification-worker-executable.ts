import { Pool } from 'pg';
import {
  createUnavailableNotificationDeliveryEligibility,
  createWebPushTransport,
  NotificationDeliveryWorker,
  NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS,
  PostgresNotificationDeliveryWorkerRepository
} from '../notification-platform/index.js';
import {
  createWebPushVapidConfiguration,
  WEB_PUSH_VAPID_PRIVATE_KEY_ENVIRONMENT_VARIABLE,
  WEB_PUSH_VAPID_SUBJECT_ENVIRONMENT_VARIABLE
} from '../notification-platform/web-push-vapid.js';
import {
  loadServerEnvironment,
  NodeIdGenerator
} from '../runtime/index.js';
import { createPostgresPoolConfig } from '../runtime/postgres/postgres-pool-config.js';
import { WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE } from '../notification-platform/web-push-capability.js';

/**
 * Runs one bounded consumer delivery drain. This executable is intentionally
 * not part of the HTTP, local-development, or public-development runtimes.
 */
export async function runNotificationWorkerExecutable(): Promise<void> {
  const environmentConfig = loadServerEnvironment();
  const vapidConfiguration = createWebPushVapidConfiguration({
    publicKey:
      process.env[WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE],
    privateKey:
      process.env[WEB_PUSH_VAPID_PRIVATE_KEY_ENVIRONMENT_VARIABLE],
    subject: process.env[WEB_PUSH_VAPID_SUBJECT_ENVIRONMENT_VARIABLE]
  });
  const pool = new Pool(
    createPostgresPoolConfig(environmentConfig.postgresPoolRuntimeConfig)
  );
  const transport = createWebPushTransport({ vapidConfiguration });
  const worker = new NotificationDeliveryWorker({
    readiness: environmentConfig.serverRuntimeConfig.webPush.deliveryReadiness,
    repository: new PostgresNotificationDeliveryWorkerRepository(
      pool,
      new NodeIdGenerator()
    ),
    transport,
    eligibility: createUnavailableNotificationDeliveryEligibility(),
    transportAttemptTimeoutMillis:
      NOTIFICATION_DELIVERY_ATTEMPT_TIMEOUT_MILLISECONDS
  });
  const requestShutdown = (): void => {
    worker.requestShutdown();
  };

  process.once('SIGINT', requestShutdown);
  process.once('SIGTERM', requestShutdown);

  try {
    await worker.runOnce();
  } finally {
    process.off('SIGINT', requestShutdown);
    process.off('SIGTERM', requestShutdown);
    await pool.end();
  }
}
