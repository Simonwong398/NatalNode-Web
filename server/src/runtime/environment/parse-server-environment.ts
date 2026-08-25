import type {
  EnvironmentSource,
  ServerEnvironmentConfig
} from './server-environment-config.js';
import { ServerEnvironmentConfigurationError } from './server-environment-configuration-error.js';

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
  const hostname = readRequired(env, 'HOST');

  if (hostname !== hostname.trim()) {
    return invalidVariable('HOST', 'host');
  }

  const port = parseRequiredPort(env);

  return {
    serverRuntimeConfig: {
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
