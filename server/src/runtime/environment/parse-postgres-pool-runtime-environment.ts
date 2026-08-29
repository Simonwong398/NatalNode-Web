import type { PostgresPoolRuntimeConfig } from '../postgres/index.js';
import {
  parseOptionalInteger,
  parseRequiredBoolean,
  readRequired
} from './parse-environment-values.js';
import type { EnvironmentSource } from './server-environment-config.js';

export function parsePostgresPoolRuntimeEnvironment(
  env: EnvironmentSource
): PostgresPoolRuntimeConfig {
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

  return {
    connectionString,
    ssl: databaseSslEnabled,
    ...(poolMax === undefined ? {} : { max: poolMax }),
    ...(idleTimeoutMillis === undefined ? {} : { idleTimeoutMillis }),
    ...(connectionTimeoutMillis === undefined
      ? {}
      : { connectionTimeoutMillis })
  };
}

export function loadPostgresPoolRuntimeEnvironment(): PostgresPoolRuntimeConfig {
  return parsePostgresPoolRuntimeEnvironment(process.env);
}
