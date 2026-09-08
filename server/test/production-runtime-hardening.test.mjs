import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createApp } from '../dist/app/create-app.js';
import {
  createPublicDevelopmentDependencies
} from '../dist/executable/public-development-dependencies.js';
import {
  formatSafeStartupError
} from '../dist/executable/safe-startup-error.js';
import {
  createServerRuntimePreflight
} from '../dist/runtime/runtime-preflight.js';
import {
  parseProductionRuntimeConfig,
  PRODUCTION_ENGINE_CLIENT_ADMISSION
} from '../dist/runtime/production-runtime-config.js';
import { ServerEnvironmentConfigurationError } from '../dist/runtime/environment/server-environment-configuration-error.js';

const PRODUCTION_ORIGIN = 'https://natalnode.test';
const SERVER_MAIN = fileURLToPath(
  new URL('../dist/executable/server-main.js', import.meta.url)
);

function productionEnvironment(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://preflight.invalid/natalnode',
    DATABASE_SSL_ENABLED: 'true',
    AUTH_MAGIC_LINK_TTL_SECONDS: '600',
    AUTH_SESSION_TTL_SECONDS: '3600',
    AUTH_SESSION_COOKIE_NAME: 'nn_session',
    AUTH_SESSION_COOKIE_SECURE: 'true',
    PUBLIC_WEB_ORIGIN: PRODUCTION_ORIGIN,
    HOST: '127.0.0.1',
    PORT: '4322',
    NATALNODE_RUNTIME_MODE: 'production',
    AUTH_GOOGLE_ENABLED: 'true',
    NATALNODE_RATE_LIMIT_AUTHORITY: 'distributed',
    NATALNODE_SINGLE_REPLICA_CONFIRMED: 'false',
    NATALNODE_OBSERVABILITY_DURABLE_SINK_CONFIGURED: 'true',
    NATALNODE_PRIVACY_ACCESS_AUDIT_REQUIRED: 'true',
    GOOGLE_OIDC_ISSUER: 'https://accounts.google.com',
    GOOGLE_OIDC_CLIENT_ID: 'synthetic-client-id',
    GOOGLE_OIDC_CLIENT_SECRET: 'synthetic-client-secret',
    RESEND_API_KEY: 're_synthetic_runtime_key',
    AUTH_EMAIL_FROM: 'NatalNode <noreply@natalnode.test>',
    ...overrides
  };
}

function localIntegrationEnvironment(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://local.invalid/natalnode',
    DATABASE_SSL_ENABLED: 'false',
    AUTH_MAGIC_LINK_TTL_SECONDS: '600',
    AUTH_SESSION_TTL_SECONDS: '3600',
    AUTH_SESSION_COOKIE_NAME: 'nn_session',
    AUTH_SESSION_COOKIE_SECURE: 'false',
    PUBLIC_WEB_ORIGIN: 'http://localhost:4321',
    HOST: '127.0.0.1',
    PORT: '4322',
    LOCAL_PUBLIC_PORT: '4321',
    NATALNODE_RUNTIME_MODE: 'local',
    RESEND_API_KEY: 're_local_synthetic_key',
    AUTH_EMAIL_FROM: 'NatalNode <noreply@localhost.test>',
    ENGINE_CLIENT_MODE: 'development-mock',
    ...overrides
  };
}

test('production config is complete, secret-free in diagnostics, and Engine remains non-admitted', () => {
  const config = parseProductionRuntimeConfig(productionEnvironment({
    NATALNODE_ENGINE_URL: 'https://engine.example.invalid'
  }));

  assert.equal(config.engine.configuration, 'CONFIGURED');
  assert.equal(config.engine.admission, PRODUCTION_ENGINE_CLIENT_ADMISSION);

  const report = createServerRuntimePreflight(
    productionEnvironment({
      NATALNODE_ENGINE_URL: 'https://engine.example.invalid'
    }),
    'production'
  );
  const serialized = JSON.stringify(report);

  assert.equal(report.configurationStatus, 'VALID');
  assert.equal(report.runtimeAdmission, 'NOT_ADMITTED');
  assert.equal(report.readiness.status, 'NOT_READY');
  assert.deepEqual(report.readiness.reasons, [
    'ENGINE_NOT_ADMITTED',
    'PRODUCTION_HTTP_COMPOSITION_NOT_ADMITTED'
  ]);
  assert.equal(report.listenerStarted, false);
  assert.equal(report.dependencies.engine.admission, 'NOT_ADMITTED');
  assert.equal(report.dependencies.cache.correctnessAuthority, false);
  assert.equal(report.dependencies.rateLimiting.authority, 'distributed');
  assert.equal(serialized.includes('postgresql://preflight.invalid/natalnode'), false);
  assert.equal(serialized.includes('re_synthetic_runtime_key'), false);
  assert.equal(serialized.includes('synthetic-client-secret'), false);
});

test('production configuration rejects missing, invalid, placeholder, and development-only values before composition', () => {
  assert.throws(
    () => parseProductionRuntimeConfig(productionEnvironment({ DATABASE_URL: undefined })),
    (error) =>
      error instanceof ServerEnvironmentConfigurationError &&
      error.message === 'Missing required environment variable: DATABASE_URL'
  );
  assert.throws(
    () => parseProductionRuntimeConfig(productionEnvironment({ PUBLIC_WEB_ORIGIN: 'http://public.invalid' })),
    /PUBLIC_WEB_ORIGIN/u
  );
  assert.throws(
    () => parseProductionRuntimeConfig(productionEnvironment({ RESEND_API_KEY: 're_test_key' })),
    /RESEND_API_KEY/u
  );
  assert.throws(
    () => parseProductionRuntimeConfig(productionEnvironment({ AUTH_EMAIL_FROM: 'noreply@example.com' })),
    /AUTH_EMAIL_FROM/u
  );
  assert.throws(
    () => parseProductionRuntimeConfig(productionEnvironment({ ENGINE_CLIENT_MODE: 'development-mock' })),
    /ENGINE_CLIENT_MODE/u
  );
  assert.throws(
    () => parseProductionRuntimeConfig(productionEnvironment({ NATALNODE_RATE_LIMIT_AUTHORITY: 'process-local' })),
    /NATALNODE_RATE_LIMIT_AUTHORITY/u
  );
});

test('server:start fails before listener creation and never falls back when config or Engine admission is missing', () => {
  const missingConfig = spawnSync(process.execPath, [SERVER_MAIN], {
    env: { PATH: process.env.PATH ?? '' },
    encoding: 'utf8'
  });
  assert.equal(missingConfig.status, 1);
  assert.equal(
    missingConfig.stderr,
    'NatalNode API startup failed: ServerEnvironmentConfigurationError: details redacted.\n'
  );
  assert.doesNotMatch(missingConfig.stderr, /listening/u);

  const blockedProduction = spawnSync(process.execPath, [SERVER_MAIN], {
    env: {
      PATH: process.env.PATH ?? '',
      ...productionEnvironment()
    },
    encoding: 'utf8'
  });
  assert.equal(blockedProduction.status, 1);
  assert.match(
    blockedProduction.stderr,
    /Production EngineClient composition is not admitted/u
  );
  assert.doesNotMatch(blockedProduction.stderr, /listening/u);
  assert.doesNotMatch(blockedProduction.stderr, /re_synthetic_runtime_key/u);
});

test('development and local-integration profiles are explicit and do not become production', () => {
  const development = createServerRuntimePreflight(
    { NODE_ENV: 'test' },
    'development'
  );
  assert.equal(development.profile, 'development');
  assert.equal(development.runtimeAdmission, 'ADMITTED');
  assert.equal(development.dependencies.engine.developmentOnly, true);
  assert.equal(development.listenerStarted, false);

  const localIntegration = createServerRuntimePreflight(
    localIntegrationEnvironment(),
    'local-integration'
  );
  assert.equal(localIntegration.profile, 'local-integration');
  assert.equal(localIntegration.runtimeAdmission, 'ADMITTED');
  assert.equal(localIntegration.dependencies.engine.developmentOnly, true);
  assert.equal(localIntegration.dependencies.rateLimiting.authority, 'process-local');
  assert.equal(localIntegration.listenerStarted, false);

  assert.throws(
    () => createServerRuntimePreflight(
      localIntegrationEnvironment({ NATALNODE_RUNTIME_MODE: 'production' }),
      'local-integration'
    ),
    /production/u
  );
});

test('preflight is repeatable and does not import listener, database, Engine, or email construction', () => {
  const environment = productionEnvironment();
  const first = createServerRuntimePreflight(environment, 'production');
  const second = createServerRuntimePreflight(environment, 'production');

  assert.deepEqual(second, first);

  const source = readFileSync(
    new URL('../src/runtime/runtime-preflight.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /startNodeHttpListener|createPostgresPoolRuntime|MockEngineClient|createResendEmailMagicLinkDelivery/u);
});

test('liveness remains green while readiness fails closed for a production runtime', async () => {
  const dependencies = createPublicDevelopmentDependencies({ NODE_ENV: 'test' });
  const app = createApp({
    ...dependencies,
    runtimeHealth: {
      mode: 'PRODUCTION',
      liveness: 'ALIVE',
      readiness: 'NOT_READY',
      readinessReasons: ['ENGINE_NOT_ADMITTED']
    }
  });

  const health = await app.request('/api/health');
  const ready = await app.request('/api/ready');

  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {
    service: 'natalnode-web-bff',
    status: 'ok'
  });
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), {
    service: 'natalnode-web-bff',
    status: 'not_ready'
  });
});

test('safe startup diagnostics preserve bounded errors without secrets or stacks', () => {
  const diagnostic = formatSafeStartupError(
    new Error(
      'DATABASE_URL=postgresql://user:password@db.example.invalid/natalnode\n' +
        'Error: private stack'
    )
  );

  assert.equal(diagnostic, 'Error: details redacted.');
  assert.equal(diagnostic.includes('password'), false);
  assert.equal(diagnostic.includes('private stack'), false);
});
