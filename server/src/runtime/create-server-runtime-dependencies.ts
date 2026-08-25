import type { ServerDependencies } from '../app/dependencies.js';
import { SessionRequestAuthenticator } from '../app/auth/session-request-authenticator.js';
import {
  assertValidSessionCookiePolicy,
  type SessionCookiePolicy
} from '../auth-runtime/session-cookie.js';
import { PublicWebOriginMagicLinkUrlBuilder } from '../auth-runtime/magic-link-url-builder.js';
import { NodeSecureTokenGenerator } from '../auth-runtime/secure-token.js';
import { Sha256TokenHasher } from '../auth-runtime/token-hasher.js';
import { createPostgresPersistence } from '../persistence/postgres/create-postgres-persistence.js';
import { DurationAuthenticationExpirationPolicy } from './duration-authentication-expiration-policy.js';
import type { ServerRuntimeBindings } from './server-runtime-bindings.js';
import type { ServerRuntimeConfig } from './server-runtime-config.js';
import { NodeIdGenerator } from './node-id-generator.js';
import { SystemClock } from './system-clock.js';

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

  const persistence = createPostgresPersistence(bindings.sqlExecutor);
  const authenticator = new SessionRequestAuthenticator({
    authSessions: persistence.authSessions,
    tokenHasher,
    clock,
    cookiePolicy: sessionCookiePolicy
  });

  return {
    publicWebOrigin: config.publicWebOrigin,
    authenticator,
    idGenerator,
    persistence,
    engineClient: bindings.engineClient,
    clock,
    secureTokenGenerator,
    tokenHasher,
    authenticationExpirationPolicy,
    emailMagicLinkDelivery: bindings.emailMagicLinkDelivery,
    magicLinkUrlBuilder,
    sessionCookiePolicy
  };
}
