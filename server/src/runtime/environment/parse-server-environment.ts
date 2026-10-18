import type {
  EnvironmentSource,
  ServerEnvironmentConfig
} from './server-environment-config.js';
import {
  invalidVariable,
  parseCanonicalInteger,
  parseOptionalBoolean,
  parseOptionalInteger,
  parseRequiredBoolean,
  readRequired
} from './parse-environment-values.js';
import {
  createWebPushCapability,
  WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE
} from '../../notification-platform/web-push-capability.js';
import {
  createWebPushVapidReadiness,
  WEB_PUSH_VAPID_PRIVATE_KEY_ENVIRONMENT_VARIABLE,
  WEB_PUSH_VAPID_SUBJECT_ENVIRONMENT_VARIABLE
} from '../../notification-platform/web-push-vapid.js';
import { parseServerOperationalConfig } from './parse-server-operational-config.js';
import { isValidGeoNamesUsername } from '../../location-resolution/geonames-web-provider.js';
import { isAbsolute } from 'node:path';

function parseGoogleIssuer(value: string): void {
  let issuer: URL;

  try {
    issuer = new URL(value);
  } catch (_error) {
    return invalidVariable('GOOGLE_OIDC_ISSUER', 'Google OIDC issuer');
  }

  if (
    issuer.protocol !== 'https:' ||
    issuer.username.length > 0 ||
    issuer.password.length > 0 ||
    issuer.search.length > 0 ||
    issuer.hash.length > 0
  ) {
    return invalidVariable('GOOGLE_OIDC_ISSUER', 'Google OIDC issuer');
  }
}

function validateGoogleConfiguration(
  env: EnvironmentSource,
  enabled: boolean,
  publicWebOrigin: string
): void {
  if (!enabled) {
    return;
  }

  parseGoogleIssuer(readRequired(env, 'GOOGLE_OIDC_ISSUER'));
  readRequired(env, 'GOOGLE_OIDC_CLIENT_ID');
  readRequired(env, 'GOOGLE_OIDC_CLIENT_SECRET');

  const expectedRedirectUri = new URL(
    '/api/auth/google/callback',
    publicWebOrigin
  ).toString();
  const configuredRedirectUri = env.GOOGLE_OIDC_REDIRECT_URI;

  if (configuredRedirectUri !== undefined && configuredRedirectUri !== expectedRedirectUri) {
    return invalidVariable(
      'GOOGLE_OIDC_REDIRECT_URI',
      'Google OIDC redirect URI'
    );
  }
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

function parseGeoNamesUsername(env: EnvironmentSource): string | null {
  const value = env.GEONAMES_USERNAME;

  if (value === undefined) {
    return null;
  }

  if (!isValidGeoNamesUsername(value)) {
    return invalidVariable('GEONAMES_USERNAME', 'GeoNames username');
  }

  return value;
}

function isLoopbackHost(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return value === 'localhost' || value === '127.0.0.1' || value === '::1' || value === '[::1]';
}

function parseVaultResearchSnapshotCapture(
  env: EnvironmentSource,
  runtimeMode: string,
  hostname: string,
  publicWebOrigin: string,
  connectionString: string,
  databaseSslEnabled: boolean
): { readonly ownerUserId: string; readonly sourceDirectory: string } | undefined {
  const enabled = parseOptionalBoolean(
    env,
    'NATALNODE_VAULT_RESEARCH_SNAPSHOT_ENABLED',
    false
  );

  if (!enabled) {
    return undefined;
  }

  let database: URL;
  let publicOrigin: URL;
  try {
    database = new URL(connectionString);
    publicOrigin = new URL(publicWebOrigin);
  } catch (_error) {
    return invalidVariable(
      'NATALNODE_VAULT_RESEARCH_SNAPSHOT_ENABLED',
      'isolated local Vault research database'
    );
  }

  const databaseName = decodeURIComponent(database.pathname.slice(1));
  if (
    runtimeMode !== 'local' ||
    !isLoopbackHost(hostname) ||
    publicOrigin.protocol !== 'http:' ||
    !isLoopbackHost(publicOrigin.hostname) ||
    !isLoopbackHost(database.hostname) ||
    !databaseName.startsWith('nn_vault_snapshot_test_') ||
    databaseSslEnabled
  ) {
    return invalidVariable(
      'NATALNODE_VAULT_RESEARCH_SNAPSHOT_ENABLED',
      'isolated local Vault research runtime'
    );
  }

  const ownerUserId = readRequired(env, 'NATALNODE_VAULT_RESEARCH_SNAPSHOT_USER_ID');
  const sourceDirectory = readRequired(
    env,
    'NATALNODE_VAULT_RESEARCH_SNAPSHOT_DIRECTORY'
  );
  if (
    ownerUserId.length > 128 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(ownerUserId) ||
    !isAbsolute(sourceDirectory)
  ) {
    return invalidVariable(
      'NATALNODE_VAULT_RESEARCH_SNAPSHOT_DIRECTORY',
      'absolute local capture directory and account binding'
    );
  }

  return { ownerUserId, sourceDirectory };
}

export function parseServerEnvironment(
  env: EnvironmentSource
): ServerEnvironmentConfig {
  const operationalConfig = parseServerOperationalConfig(env);
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
  const geonamesUsername = parseGeoNamesUsername(env);

  if (publicWebOrigin.startsWith('https://') && !sessionCookieSecure) {
    return invalidVariable(
      'AUTH_SESSION_COOKIE_SECURE',
      'secure cookie policy'
    );
  }

  if (operationalConfig.runtimeMode === 'production') {
    if (!databaseSslEnabled) {
      return invalidVariable('DATABASE_SSL_ENABLED', 'production database SSL');
    }

    if (!publicWebOrigin.startsWith('https://')) {
      return invalidVariable('PUBLIC_WEB_ORIGIN', 'production public web origin');
    }

    if (!operationalConfig.authentication.emailEnabled) {
      return invalidVariable('AUTH_EMAIL_ENABLED', 'production email authentication');
    }

    if (!operationalConfig.authentication.googleEnabled) {
      return invalidVariable('AUTH_GOOGLE_ENABLED', 'production Google authentication');
    }
  }

  validateGoogleConfiguration(
    env,
    operationalConfig.authentication.googleEnabled,
    publicWebOrigin
  );

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
  const vaultResearchSnapshotCapture = parseVaultResearchSnapshotCapture(
    env,
    operationalConfig.runtimeMode,
    hostname,
    publicWebOrigin,
    connectionString,
    databaseSslEnabled
  );

  return {
    serverRuntimeConfig: {
      publicWebOrigin,
      locationResolution: {
        geonamesUsername
      },
      operational: operationalConfig,
      webPush: {
        applicationServerKey: webPushCapability.applicationServerKey,
        deliveryReadiness: webPushDeliveryReadiness
      },
      authentication: {
        magicLinkTtlSeconds,
        sessionTtlSeconds,
        sessionCookieName,
        sessionCookieSecure
      },
      ...(vaultResearchSnapshotCapture === undefined
        ? {}
        : { vaultResearchSnapshotCapture })
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
