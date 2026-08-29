import type {
  EnvironmentSource,
  ServerEnvironmentConfig
} from './server-environment-config.js';
import { ServerEnvironmentConfigurationError } from './server-environment-configuration-error.js';
import {
  createWebPushCapability,
  WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE
} from '../../notification-platform/web-push-capability.js';
import {
  createWebPushVapidReadiness,
  WEB_PUSH_VAPID_PRIVATE_KEY_ENVIRONMENT_VARIABLE,
  WEB_PUSH_VAPID_SUBJECT_ENVIRONMENT_VARIABLE
} from '../../notification-platform/web-push-vapid.js';

const CANONICAL_NON_NEGATIVE_INTEGER = /^(?:0|[1-9]\d*)$/u;
const CANONICAL_POSITIVE_INTEGER = /^[1-9]\d*$/u;

function missingVariable(variableName: string): never {
  throw new ServerEnvironmentConfigurationError(
    `Missing required environment variable: ${variableName}`
  );
}

function invalidVariable(variableName: string, description: string): never {
  throw new ServerEnvironmentConfigurationError(
    `Invalid ${description} environment variable: ${variableName}`
  );
}

function readRequired(env: EnvironmentSource, variableName: string): string {
  const value = env[variableName];

  if (value === undefined) {
    return missingVariable(variableName);
  }

  if (typeof value !== 'string' || value.length === 0 || value.trim().length === 0) {
    return invalidVariable(variableName, 'required value');
  }

  return value;
}

function parseRequiredBoolean(
  env: EnvironmentSource,
  variableName: string
): boolean {
  const value = readRequired(env, variableName);

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return invalidVariable(variableName, 'strict boolean');
}

function parseCanonicalInteger(
  value: string,
  variableName: string,
  minimum: 0 | 1,
  description: string
): number {
  const pattern = minimum === 1
    ? CANONICAL_POSITIVE_INTEGER
    : CANONICAL_NON_NEGATIVE_INTEGER;
  const parsed = Number(value);

  if (
    !pattern.test(value) ||
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    !Number.isSafeInteger(parsed) ||
    parsed < minimum
  ) {
    return invalidVariable(variableName, description);
  }

  return parsed;
}

function parseRequiredPositiveInteger(
  env: EnvironmentSource,
  variableName: string
): number {
  return parseCanonicalInteger(
    readRequired(env, variableName),
    variableName,
    1,
    'positive integer'
  );
}

function parseRequiredPort(env: EnvironmentSource): number {
  const port = parseCanonicalInteger(
    readRequired(env, 'PORT'),
    'PORT',
    1,
    'port'
  );

  if (port > 65_535) {
    return invalidVariable('PORT', 'port');
  }

  return port;
}

function parseOptionalInteger(
  env: EnvironmentSource,
  variableName: string,
  minimum: 0 | 1,
  description: string
): number | undefined {
  const value = env[variableName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return invalidVariable(variableName, description);
  }

  return parseCanonicalInteger(value, variableName, minimum, description);
}

function isExplicitLocalHttpHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1' ||
    normalizedHostname === '[::1]'
  );
}

function parsePublicWebOrigin(env: EnvironmentSource): string {
  const value = readRequired(env, 'PUBLIC_WEB_ORIGIN');

  if (
    /\s/u.test(value) ||
    value.includes('?') ||
    value.includes('#') ||
    value.includes('@')
  ) {
    return invalidVariable('PUBLIC_WEB_ORIGIN', 'public web origin');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch (_error) {
    return invalidVariable('PUBLIC_WEB_ORIGIN', 'public web origin');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return invalidVariable('PUBLIC_WEB_ORIGIN', 'public web origin');
  }

  if (
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0 ||
    url.pathname !== '/'
  ) {
    return invalidVariable('PUBLIC_WEB_ORIGIN', 'public web origin');
  }

  if (url.protocol === 'http:' && !isExplicitLocalHttpHost(url.hostname)) {
    return invalidVariable('PUBLIC_WEB_ORIGIN', 'public web origin');
  }

  return url.origin;
}

export function parseServerEnvironment(
  env: EnvironmentSource
): ServerEnvironmentConfig {
  const connectionString = readRequired(env, 'DATABASE_URL');
  const databaseSslEnabled = parseRequiredBoolean(env, 'DATABASE_SSL_ENABLED');
  const poolMax = parseOptionalInteger(
    env,
    'DATABASE_POOL_MAX',
    1,
    'positive integer'
  );
  const idleTimeoutMillis = parseOptionalInteger(
    env,
    'DATABASE_IDLE_TIMEOUT_MS',
    0,
    'non-negative integer'
  );
  const connectionTimeoutMillis = parseOptionalInteger(
    env,
    'DATABASE_CONNECTION_TIMEOUT_MS',
    0,
    'non-negative integer'
  );
  const magicLinkTtlSeconds = parseRequiredPositiveInteger(
    env,
    'AUTH_MAGIC_LINK_TTL_SECONDS'
  );
  const sessionTtlSeconds = parseRequiredPositiveInteger(
    env,
    'AUTH_SESSION_TTL_SECONDS'
  );
  const sessionCookieName = readRequired(env, 'AUTH_SESSION_COOKIE_NAME');
  const sessionCookieSecure = parseRequiredBoolean(
    env,
    'AUTH_SESSION_COOKIE_SECURE'
  );
  const publicWebOrigin = parsePublicWebOrigin(env);
  const webPushCapability = createWebPushCapability(
    env[WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE]
  );
  const webPushDeliveryReadiness = createWebPushVapidReadiness({
    publicKey: env[WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE],
    privateKey: env[WEB_PUSH_VAPID_PRIVATE_KEY_ENVIRONMENT_VARIABLE],
    subject: env[WEB_PUSH_VAPID_SUBJECT_ENVIRONMENT_VARIABLE]
  });
  const hostname = readRequired(env, 'HOST');

  if (hostname !== hostname.trim()) {
    return invalidVariable('HOST', 'host');
  }

  const port = parseRequiredPort(env);

  return {
    serverRuntimeConfig: {
      publicWebOrigin,
      webPush: {
        applicationServerKey: webPushCapability.applicationServerKey,
        deliveryReadiness: webPushDeliveryReadiness
      },
      authentication: {
        magicLinkTtlSeconds,
        sessionTtlSeconds,
        sessionCookieName,
        sessionCookieSecure
      }
    },
    postgresPoolRuntimeConfig: {
      connectionString,
      ssl: databaseSslEnabled,
      ...(poolMax === undefined ? {} : { max: poolMax }),
      ...(idleTimeoutMillis === undefined ? {} : { idleTimeoutMillis }),
      ...(connectionTimeoutMillis === undefined
        ? {}
        : { connectionTimeoutMillis })
    },
    nodeHttpListenerConfig: {
      hostname,
      port
    }
  };
}
