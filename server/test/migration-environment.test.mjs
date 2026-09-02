import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  parsePostgresPoolRuntimeEnvironment,
  parseServerEnvironment
} from '../dist/runtime/index.js';

const MIGRATION_EXECUTABLE_SOURCE = new URL(
  '../src/executable/run-migration-executable.ts',
  import.meta.url
);

function postgresEnvironment(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://migration-test.invalid/natalnode',
    DATABASE_SSL_ENABLED: 'true',
    ...overrides
  };
}

function serverEnvironment(overrides = {}) {
  return {
    ...postgresEnvironment(),
    AUTH_MAGIC_LINK_TTL_SECONDS: '600',
    AUTH_SESSION_TTL_SECONDS: '3600',
    AUTH_SESSION_COOKIE_NAME: 'nn_session',
    AUTH_SESSION_COOKIE_SECURE: 'true',
    PUBLIC_WEB_ORIGIN: 'https://natalnode.example',
    HOST: '127.0.0.1',
    PORT: '4322',
    ...overrides
  };
}

test('migration environment accepts only the required PostgreSQL variables', () => {
  assert.deepEqual(
    parsePostgresPoolRuntimeEnvironment(postgresEnvironment()),
    {
      connectionString: 'postgresql://migration-test.invalid/natalnode',
      ssl: true
    }
  );
});

test('migration environment preserves optional PostgreSQL pool parsing', () => {
  assert.deepEqual(
    parsePostgresPoolRuntimeEnvironment(postgresEnvironment({
      DATABASE_POOL_MAX: '4',
      DATABASE_IDLE_TIMEOUT_MS: '1000',
      DATABASE_CONNECTION_TIMEOUT_MS: '2000'
    })),
    {
      connectionString: 'postgresql://migration-test.invalid/natalnode',
      ssl: true,
      max: 4,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 2000
    }
  );
});

test('missing PostgreSQL migration variables fail closed', () => {
  assert.throws(
    () => parsePostgresPoolRuntimeEnvironment({
      DATABASE_SSL_ENABLED: 'true'
    }),
    {
      name: 'ServerEnvironmentConfigurationError',
      message: 'Missing required environment variable: DATABASE_URL'
    }
  );

  assert.throws(
    () => parsePostgresPoolRuntimeEnvironment({
      DATABASE_URL: 'postgresql://migration-test.invalid/natalnode'
    }),
    {
      name: 'ServerEnvironmentConfigurationError',
      message: 'Missing required environment variable: DATABASE_SSL_ENABLED'
    }
  );
});

test('invalid PostgreSQL SSL configuration fails closed', () => {
  assert.throws(
    () => parsePostgresPoolRuntimeEnvironment(postgresEnvironment({
      DATABASE_SSL_ENABLED: 'TRUE'
    })),
    {
      name: 'ServerEnvironmentConfigurationError',
      message: 'Invalid strict boolean environment variable: DATABASE_SSL_ENABLED'
    }
  );
});

test('full server environment parsing remains complete and unchanged', () => {
  const parsed = parseServerEnvironment(serverEnvironment());

  assert.equal(parsed.postgresPoolRuntimeConfig.connectionString,
    'postgresql://migration-test.invalid/natalnode');
  assert.equal(parsed.serverRuntimeConfig.authentication.magicLinkTtlSeconds, 600);
  assert.equal(parsed.nodeHttpListenerConfig.hostname, '127.0.0.1');
  assert.equal(parsed.nodeHttpListenerConfig.port, 4322);

  assert.throws(
    () => parseServerEnvironment(postgresEnvironment()),
    {
      name: 'ServerEnvironmentConfigurationError',
      message: /AUTH_MAGIC_LINK_TTL_SECONDS/u
    }
  );
});

test('HTTPS public origins require Secure session cookies', () => {
  assert.throws(
    () => parseServerEnvironment(serverEnvironment({
      AUTH_SESSION_COOKIE_SECURE: 'false'
    })),
    {
      name: 'ServerEnvironmentConfigurationError',
      message: 'Invalid secure cookie policy environment variable: AUTH_SESSION_COOKIE_SECURE'
    }
  );
});

test('migration executable uses the dedicated PostgreSQL environment boundary', async () => {
  const source = await readFile(MIGRATION_EXECUTABLE_SOURCE, 'utf8');

  assert.match(source, /loadPostgresPoolRuntimeEnvironment/u);
  assert.doesNotMatch(source, /loadServerEnvironment/u);
  assert.match(source, /runPostgresMigrations\(\s*postgresPoolRuntimeConfig/u);
});
