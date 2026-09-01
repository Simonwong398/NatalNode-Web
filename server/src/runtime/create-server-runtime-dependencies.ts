import type { ServerDependencies } from '../app/dependencies.js';
import { CachedChartCalculator } from '../app/cache/cached-chart-calculator.js';
import { SessionRequestAuthenticator } from '../app/auth/session-request-authenticator.js';
import {
  assertValidSessionCookiePolicy,
  type SessionCookiePolicy
} from '../auth-runtime/session-cookie.js';
import { PublicWebOriginMagicLinkUrlBuilder } from '../auth-runtime/magic-link-url-builder.js';
import { NodeSecureTokenGenerator } from '../auth-runtime/secure-token.js';
import { Sha256TokenHasher } from '../auth-runtime/token-hasher.js';
import {
  GoogleOAuthTransactionService
} from '../auth-runtime/google-oauth-transaction.js';
import { createPostgresPersistence } from '../persistence/postgres/create-postgres-persistence.js';
import { PostgresGoogleOAuthTransactionRepository } from '../persistence/postgres/postgres-google-oauth-transaction-repository.js';
import { createPostgresCommercialPersistence } from '../commercial-persistence/index.js';
import { DurationAuthenticationExpirationPolicy } from './duration-authentication-expiration-policy.js';
import type { ServerRuntimeBindings } from './server-runtime-bindings.js';
import type { ServerRuntimeConfig } from './server-runtime-config.js';
import { NodeIdGenerator } from './node-id-generator.js';
import { SystemClock } from './system-clock.js';
import { NotificationAccountService } from '../notification-platform/notification-account-service.js';
import { createWebPushCapability } from '../notification-platform/web-push-capability.js';
import { PostgresFoundationsLearningService } from '../learning/foundations/postgres-foundations-learning-service.js';

function assertValidTtl(seconds: number, name: string): void {
  if (!Number.isFinite(seconds) || !Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(`${name} must be a finite positive integer.`);
  }
}

function assertValidRuntimeConfig(config: ServerRuntimeConfig): void {
  assertValidTtl(
    config.authentication.magicLinkTtlSeconds,
    'magicLinkTtlSeconds'
  );
  assertValidTtl(config.authentication.sessionTtlSeconds, 'sessionTtlSeconds');
}

export function createServerRuntimeDependencies(
  bindings: ServerRuntimeBindings,
  config: ServerRuntimeConfig
): ServerDependencies {
  assertValidRuntimeConfig(config);

  const clock = new SystemClock();
  const chartCalculator = new CachedChartCalculator({
    engineClient: bindings.engineClient,
    clock,
    cacheIdentity: bindings.chartResultCacheIdentity
  });
  const idGenerator = new NodeIdGenerator();
  const secureTokenGenerator = new NodeSecureTokenGenerator();
  const tokenHasher = new Sha256TokenHasher();
  const authenticationExpirationPolicy = new DurationAuthenticationExpirationPolicy(
    config.authentication.magicLinkTtlSeconds,
    config.authentication.sessionTtlSeconds
  );
  const sessionCookiePolicy: SessionCookiePolicy = {
    name: config.authentication.sessionCookieName,
    secure: config.authentication.sessionCookieSecure
  };
  const magicLinkUrlBuilder = new PublicWebOriginMagicLinkUrlBuilder(
    config.publicWebOrigin
  );

  assertValidSessionCookiePolicy(sessionCookiePolicy);

  const persistence = createPostgresPersistence(
    bindings.sqlExecutor,
    bindings.transactionRunner
  );
  const notificationAccountService = new NotificationAccountService({
    notificationPreferences: persistence.notificationPreferences,
    pushSubscriptions: persistence.pushSubscriptions,
    idGenerator,
    clock,
    webPushCapability: createWebPushCapability(
      config.webPush.applicationServerKey
    )
  });
  const foundationsLearningService = new PostgresFoundationsLearningService({
    transactionRunner: bindings.transactionRunner,
    idGenerator,
    commercialPersistenceFactory: createPostgresCommercialPersistence
  });
  const authenticator = new SessionRequestAuthenticator({
    authSessions: persistence.authSessions,
    tokenHasher,
    clock,
    cookiePolicy: sessionCookiePolicy
  });

  const googleOAuthTransactionService =
    bindings.googleOidcProvider === undefined
      ? undefined
      : createGoogleOAuthTransactionService(bindings, {
          idGenerator,
          secureTokenGenerator,
          tokenHasher
        });

  return {
    publicWebOrigin: config.publicWebOrigin,
    authenticator,
    accountErasure: bindings.accountErasure,
    accountDataExport: bindings.accountDataExport,
    postgresConnectionTimeoutMillis: bindings.postgresConnectionTimeoutMillis,
    emailMagicLinkAuthLifecycle: bindings.emailMagicLinkAuthLifecycle,
    idGenerator,
    persistence,
    engineClient: bindings.engineClient,
    chartCalculator,
    clock,
    notificationAccountService,
    foundationsLearningService,
    secureTokenGenerator,
    tokenHasher,
    authenticationExpirationPolicy,
    emailMagicLinkDelivery: bindings.emailMagicLinkDelivery,
    magicLinkUrlBuilder,
    sessionCookiePolicy,
    googleOidcProvider: bindings.googleOidcProvider,
    googleOAuthTransactionService,
    googleAuthAccountSessionLifecycle:
      bindings.googleAuthAccountSessionLifecycle
  };
}

function createGoogleOAuthTransactionService(
  bindings: ServerRuntimeBindings,
  dependencies: {
    readonly idGenerator: NodeIdGenerator;
    readonly secureTokenGenerator: NodeSecureTokenGenerator;
    readonly tokenHasher: Sha256TokenHasher;
  }
): GoogleOAuthTransactionService {
  if (bindings.googleOAuthTransactionTtlSeconds === undefined) {
    throw new Error(
      'Google OAuth transaction TTL is required with an injected provider.'
    );
  }

  if (bindings.googleAuthAccountSessionLifecycle === undefined) {
    throw new Error(
      'Google authentication account/session lifecycle is unavailable.'
    );
  }

  return new GoogleOAuthTransactionService({
    repository: new PostgresGoogleOAuthTransactionRepository(
      bindings.sqlExecutor
    ),
    idGenerator: dependencies.idGenerator,
    secureTokenGenerator: dependencies.secureTokenGenerator,
    tokenHasher: dependencies.tokenHasher,
    policy: {
      ttlSeconds: bindings.googleOAuthTransactionTtlSeconds
    }
  });
}
