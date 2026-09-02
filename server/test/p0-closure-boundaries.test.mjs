import assert from 'node:assert/strict';
import test from 'node:test';

import { Hono } from 'hono';
import { parseExecutableServerConfig } from '../dist/executable/executable-server-config.js';
import { registerCommunityRoutes } from '../dist/app/routes/community.js';
import { registerPractitionerRoutes } from '../dist/app/routes/practitioner.js';
import { isGoogleAuthenticationAvailable } from '../dist/app/routes/google-auth.js';
import {
  InMemoryP0StagingRateLimiter
} from '../dist/app/security/api-rate-limiting.js';
import {
  assertRuntimeOperationalBoundary,
  enforceOperationalSurface
} from '../dist/app/security/runtime-operational-boundary.js';
import { appendPrivilegedSurfaceAuditReview } from '../dist/app/security/privileged-surface-audit.js';
import {
  encodeVaultChartListCursor,
  parseVaultChartListQuery
} from '../dist/app/validation/vault-chart-list.js';
import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';
import { parseServerEnvironment } from '../dist/runtime/environment/parse-server-environment.js';
import { runFeedbackRetentionMaintenanceWithRuntime } from '../dist/maintenance/feedback-retention-maintenance.js';
import {
  FEEDBACK_RAW_RETENTION_DAYS,
  FEEDBACK_RETENTION_PURGE_BATCH_SIZE,
  PostgresFeedbackRetentionRepository
} from '../dist/persistence/postgres/postgres-feedback-retention-repository.js';
import { PostgresVaultChartRepository } from '../dist/persistence/postgres/postgres-vault-chart-repository.js';

const NOW = '2026-09-02T12:00:00.000Z';
const PUBLIC_WEB_ORIGIN = 'https://staging.natalnode.test';

function serverEnvironment(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://example.invalid/natalnode',
    DATABASE_SSL_ENABLED: 'true',
    AUTH_MAGIC_LINK_TTL_SECONDS: '600',
    AUTH_SESSION_TTL_SECONDS: '3600',
    AUTH_SESSION_COOKIE_NAME: 'nn_session',
    AUTH_SESSION_COOKIE_SECURE: 'true',
    PUBLIC_WEB_ORIGIN,
    HOST: '127.0.0.1',
    PORT: '4322',
    NATALNODE_RUNTIME_MODE: 'staging',
    ...overrides
  };
}

function productionEnvironment(overrides = {}) {
  return serverEnvironment({
    NATALNODE_RUNTIME_MODE: 'production',
    PUBLIC_WEB_ORIGIN: 'https://natalnode.com',
    AUTH_GOOGLE_ENABLED: 'true',
    NATALNODE_RATE_LIMIT_AUTHORITY: 'distributed',
    NATALNODE_SINGLE_REPLICA_CONFIRMED: 'true',
    NATALNODE_OBSERVABILITY_DURABLE_SINK_CONFIGURED: 'true',
    GOOGLE_OIDC_ISSUER: 'https://accounts.google.com',
    GOOGLE_OIDC_CLIENT_ID: 'client-id',
    GOOGLE_OIDC_CLIENT_SECRET: 'client-secret',
    ...overrides
  });
}

function executableEnvironment(overrides = {}) {
  return serverEnvironment({
    RESEND_API_KEY: 're_test_key',
    AUTH_EMAIL_FROM: 'NatalNode <noreply@example.test>',
    ENGINE_CLIENT_MODE: 'development-mock',
    ...overrides
  });
}

function rateLimiter(kind) {
  return {
    kind,
    attempt() {
      return { allowed: true };
    }
  };
}

function operationalDependencies(operationalConfig, overrides = {}) {
  return {
    operationalConfig,
    persistence: {
      privacyAccessAudit: {
        async append() {}
      }
    },
    googleOidcProvider: {},
    googleOAuthTransactionService: {},
    googleAuthAccountSessionLifecycle: {},
    ...overrides
  };
}

async function problemPayload(response) {
  assert.equal(response.headers.get('Content-Type'), 'application/problem+json; charset=utf-8');
  return response.json();
}

test('runtime modes and production configuration fail closed around the mock Engine', () => {
  const staging = parseServerEnvironment(serverEnvironment());
  assert.equal(staging.serverRuntimeConfig.operational.runtimeMode, 'staging');
  assert.equal(staging.serverRuntimeConfig.operational.authentication.googleEnabled, false);
  assert.equal(
    isGoogleAuthenticationAvailable(
      operationalDependencies(staging.serverRuntimeConfig.operational)
    ),
    false
  );

  const executable = parseExecutableServerConfig(executableEnvironment());
  assert.equal(executable.runtimeMode, 'staging');
  assert.equal(executable.engineClientMode, 'development-mock');

  assert.throws(
    () => parseServerEnvironment(productionEnvironment({ AUTH_GOOGLE_ENABLED: 'false' })),
    /AUTH_GOOGLE_ENABLED/u
  );
  assert.throws(
    () => parseExecutableServerConfig(executableEnvironment({ NATALNODE_RUNTIME_MODE: 'production' })),
    /ENGINE_CLIENT_MODE/u
  );

  const production = parseServerEnvironment(productionEnvironment());
  assert.equal(production.serverRuntimeConfig.operational.runtimeMode, 'production');
  assert.equal(production.serverRuntimeConfig.operational.rateLimiting.authority, 'distributed');
  assert.throws(
    () => parseServerEnvironment(productionEnvironment({ GOOGLE_OIDC_REDIRECT_URI: 'https://wrong.test/callback' })),
    /GOOGLE_OIDC_REDIRECT_URI/u
  );
});

test('production operational boundary requires distributed limits, durable sink, and audit storage', () => {
  const stagingConfig = parseServerEnvironment(serverEnvironment()).serverRuntimeConfig.operational;
  assert.doesNotThrow(() =>
    assertRuntimeOperationalBoundary(
      operationalDependencies(stagingConfig),
      new InMemoryP0StagingRateLimiter(),
      false
    )
  );

  const productionConfig = parseServerEnvironment(productionEnvironment()).serverRuntimeConfig.operational;
  const dependencies = operationalDependencies(productionConfig);

  assert.throws(
    () => assertRuntimeOperationalBoundary(dependencies, rateLimiter('process-local'), true),
    /does not match/u
  );
  assert.throws(
    () => assertRuntimeOperationalBoundary(
      {
        ...dependencies,
        operationalConfig: {
          ...productionConfig,
          rateLimiting: {
            ...productionConfig.rateLimiting,
            authority: 'process-local',
            singleReplicaConfirmed: true
          }
        }
      },
      rateLimiter('process-local'),
      true
    ),
    /distributed/u
  );
  assert.throws(
    () => assertRuntimeOperationalBoundary(dependencies, rateLimiter('distributed'), false),
    /durable observability/u
  );
  assert.doesNotThrow(() =>
    assertRuntimeOperationalBoundary(dependencies, rateLimiter('distributed'), true)
  );

  assert.equal(classifyApiEndpointFamily('/api/practitioner/review/reports'), 'practitioner');
});

test('Community and Practitioner privileged queue reads append an attributable audit review', async () => {
  const auditEvents = [];
  const common = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null ? null : { userId };
      }
    },
    idGenerator: {
      generate() {
        return `audit-${auditEvents.length + 1}`;
      }
    },
    clock: { now: () => NOW },
    operationalConfig: {
      ...parseServerEnvironment(serverEnvironment()).serverRuntimeConfig.operational,
      privacyAccessAuditRequired: true
    },
    persistence: {
      privacyAccessAudit: {
        async append(event) {
          auditEvents.push(event);
        }
      },
      community: {
        async isModerator(userId) {
          return userId === 'moderator-1';
        },
        async listOpenReports() {
          return [];
        }
      },
      practitioner: {
        async isReviewer(userId) {
          return userId === 'reviewer-1';
        },
        async listOpenProfileReports() {
          return [];
        }
      }
    }
  };

  const communityApp = new Hono();
  registerCommunityRoutes(communityApp, common, new InMemoryP0StagingRateLimiter());
  const communityResponse = await communityApp.request('/api/community/moderation/reports', {
    headers: { 'X-Test-User': 'moderator-1' }
  });
  assert.equal(communityResponse.status, 200);

  const practitionerApp = new Hono();
  registerPractitionerRoutes(practitionerApp, common, new InMemoryP0StagingRateLimiter());
  const practitionerResponse = await practitionerApp.request('/api/practitioner/review/reports', {
    headers: { 'X-Test-User': 'reviewer-1' }
  });
  assert.equal(practitionerResponse.status, 200);

  assert.equal(auditEvents.length, 2);
  for (const [index, event] of auditEvents.entries()) {
    assert.deepEqual(event, {
      auditEventId: `audit-${index + 1}`,
      occurredAt: NOW,
      actorType: 'HUMAN',
      actorId: index === 0 ? 'moderator-1' : 'reviewer-1',
      action: 'REVIEW',
      resourceCategory: 'AUDIT',
      outcome: 'SUCCESS'
    });
  }
});

test('operational surface middleware fails closed without an assigned operator', async () => {
  const app = new Hono();
  const config = parseServerEnvironment(serverEnvironment()).serverRuntimeConfig.operational;
  const dependencies = {
    operationalConfig: {
      ...config,
      community: { enabled: true, operatorConfigured: false }
    }
  };

  app.use('/community', enforceOperationalSurface(dependencies, 'community'));
  app.get('/community', (context) => context.text('available'));

  const response = await app.request('/community');
  assert.equal(response.status, 503);
  assert.deepEqual(await problemPayload(response), {
    type: 'about:blank',
    title: 'Service Unavailable',
    status: 503,
    code: 'OPERATIONAL_SURFACE_UNAVAILABLE'
  });
});

test('Vault cursor pagination is account-bound and uses a bounded keyset query', async () => {
  const cursor = { createdAt: NOW, chartId: 'chart-2' };
  const encoded = encodeVaultChartListCursor('user-1', cursor);

  assert.deepEqual(parseVaultChartListQuery(undefined, undefined, 'user-1'), {
    limit: 50,
    cursor: null
  });
  assert.deepEqual(parseVaultChartListQuery('100', encoded, 'user-1'), {
    limit: 100,
    cursor
  });
  assert.equal(parseVaultChartListQuery('101', encoded, 'user-1'), null);
  assert.equal(parseVaultChartListQuery('50', encoded, 'user-2'), null);

  const rows = [1, 2, 3].map((number) => ({
    chart_id: `chart-${number}`,
    user_id: 'user-1',
    display_name: `Chart ${number}`,
    category: 'SELF',
    tags: [],
    favorite: false,
    normalized_input: {},
    canonical_result: {},
    engine_version: 'fixture',
    chart_schema_version: '1',
    astronomy_configuration_id: null,
    provenance_envelope_id: null,
    created_at: `2026-09-0${4 - number}T12:00:00.000Z`,
    updated_at: NOW
  }));
  const calls = [];
  const repository = new PostgresVaultChartRepository({
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows };
    }
  });

  const page = await repository.listPageForUser('user-1', { limit: 2, cursor: null });
  assert.equal(page.charts.length, 2);
  assert.deepEqual(page.nextCursor, {
    createdAt: '2026-09-02T12:00:00.000Z',
    chartId: 'chart-2'
  });
  assert.match(calls[0].sql, /ORDER BY created_at DESC, chart_id ASC/u);
  assert.match(calls[0].sql, /LIMIT \$4/u);
  assert.deepEqual(calls[0].params, ['user-1', null, null, 3]);
});

test('Feedback retention remains a bounded one-shot maintenance boundary', async () => {
  assert.equal(FEEDBACK_RAW_RETENTION_DAYS, 180);
  assert.equal(FEEDBACK_RETENTION_PURGE_BATCH_SIZE, 500);

  const calls = [];
  const repository = new PostgresFeedbackRetentionRepository({
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [{ feedback_id: 'feedback-1' }, { feedback_id: 'feedback-2' }] };
    }
  });
  const purge = await repository.purgeExpiredRetention(NOW);

  assert.equal(purge.deleted, 2);
  assert.equal(purge.cutoffAt, '2026-03-06T12:00:00.000Z');
  assert.match(calls[0].sql, /FOR UPDATE SKIP LOCKED/u);
  assert.deepEqual(calls[0].params, [purge.cutoffAt, FEEDBACK_RETENTION_PURGE_BATCH_SIZE]);

  let closed = false;
  const result = await runFeedbackRetentionMaintenanceWithRuntime(
    {
      feedbackRetentionRepository: {
        async purgeExpiredRetention(now) {
          assert.equal(now, NOW);
          return purge;
        }
      },
      async close() {
        closed = true;
      }
    },
    { now: () => NOW }
  );
  assert.equal(result.status, 'ok');
  assert.equal(closed, true);
});

test('standalone audit helper has no content-bearing fields and fails closed when required storage is absent', async () => {
  const app = new Hono();
  const dependencies = {
    idGenerator: { generate: () => 'audit-1' },
    clock: { now: () => NOW },
    operationalConfig: { privacyAccessAuditRequired: true },
    persistence: { privacyAccessAudit: { append: async (event) => { app.event = event; } } }
  };

  app.get('/audit', async (context) => {
    context.set('requestId', 'request-1');
    await appendPrivilegedSurfaceAuditReview(context, dependencies, 'operator-1');
    return context.text('ok');
  });
  const response = await app.request('/audit');
  assert.equal(response.status, 200);
  assert.deepEqual(app.event, {
    auditEventId: 'audit-1',
    occurredAt: NOW,
    actorType: 'HUMAN',
    actorId: 'operator-1',
    action: 'REVIEW',
    resourceCategory: 'AUDIT',
    outcome: 'SUCCESS',
    requestId: 'request-1'
  });

  const missingRepository = new Hono();
  missingRepository.onError(() => new Response('failed', { status: 500 }));
  missingRepository.get('/audit', async (context) => {
    await appendPrivilegedSurfaceAuditReview(
      context,
      { idGenerator: { generate: () => 'audit-2' }, clock: { now: () => NOW }, operationalConfig: { privacyAccessAuditRequired: true }, persistence: {} },
      'operator-1'
    );
    return context.text('unreachable');
  });
  const missingResponse = await missingRepository.request('/audit');
  assert.equal(missingResponse.status, 500);
});
