import { Hono } from 'hono';
import type { ServerDependencies } from './dependencies.js';
import {
  createRuntimeHealthStatus,
  type RuntimeHealthStatus
} from '../runtime/server-runtime-config.js';
import {
  observeApiRequests,
  type ObservabilitySink
} from './observability/api-request-observability.js';
import { applyApiSecurityHeaders } from './security/api-security-headers.js';
import {
  enforceP0StagingRateLimits,
  InMemoryP0StagingRateLimiter,
  type RateLimitAuthority
} from './security/api-rate-limiting.js';
import { enforceSameOriginUnsafeApiRequests } from './security/enforce-same-origin-unsafe-api-requests.js';
import {
  assertRuntimeOperationalBoundary,
  enforceOperationalSurface
} from './security/runtime-operational-boundary.js';
import { createChartRoute } from './routes/chart.js';
import { registerLocationResolutionRoutes } from './routes/location.js';
import { registerBirthTimeResolutionRoutes } from './routes/birth-time.js';
import { createProblemDetailsContextResponse } from './problem-details/context-response.js';
import { registerEmailAuthenticationRoutes } from './routes/auth-email.js';
import { registerGoogleAuthenticationRoutes } from './routes/google-auth.js';
import { registerSessionAuthenticationRoutes } from './routes/auth-session.js';
import { registerFeedbackRoutes } from './routes/feedback.js';
import { registerSkyRoutes } from './routes/sky.js';
import { registerVaultChartRoutes } from './routes/vault-charts.js';
import { registerVaultNoteRoutes } from './routes/vault-notes.js';
import { registerAccountRoutes } from './routes/account.js';
import { registerAccountExportRoutes } from './routes/account-export.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { registerFoundationsLearningRoutes } from './routes/learn-foundations.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerPractitionerRoutes } from './routes/practitioner.js';

const HEALTH_RESPONSE = {
  service: 'natalnode-web-bff',
  status: 'ok'
} as const;

const READY_RESPONSE = {
  service: 'natalnode-web-bff',
  status: 'ready'
} as const;

const NOT_READY_RESPONSE = {
  service: 'natalnode-web-bff',
  status: 'not_ready'
} as const;

const NOT_FOUND_RESPONSE = {
  error: {
    code: 'NOT_FOUND',
    message: 'API route not found.'
  }
} as const;

const INTERNAL_ERROR_RESPONSE = {
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected server error occurred.'
  }
} as const;

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function resolveRuntimeHealth(
  dependencies: ServerDependencies
): RuntimeHealthStatus {
  if (dependencies.runtimeHealth !== undefined) {
    return dependencies.runtimeHealth;
  }

  return createRuntimeHealthStatus(
    dependencies.operationalConfig?.runtimeMode ?? 'local'
  );
}

export interface CreateAppOptions {
  readonly observabilitySink?: ObservabilitySink;
  /** Explicitly identifies an externally durable sink at composition time. */
  readonly observabilitySinkDurable?: boolean;
  readonly rateLimiter?: RateLimitAuthority;
}

export function createApp(
  dependencies: ServerDependencies,
  options: CreateAppOptions = {}
): Hono {
  const app = new Hono();
  const rateLimiter = options.rateLimiter ?? new InMemoryP0StagingRateLimiter();
  const runtimeHealth = resolveRuntimeHealth(dependencies);

  assertRuntimeOperationalBoundary(
    dependencies,
    rateLimiter,
    options.observabilitySink !== undefined &&
      options.observabilitySinkDurable === true
  );

  app.use('/api/*', observeApiRequests({ sink: options.observabilitySink }));
  app.use('/api/*', applyApiSecurityHeaders());
  app.use(
    '/api/*',
    enforceSameOriginUnsafeApiRequests(dependencies.publicWebOrigin)
  );
  app.use('/api/*', enforceP0StagingRateLimits(rateLimiter));
  app.use(
    '/api/community',
    enforceOperationalSurface(dependencies, 'community')
  );
  app.use(
    '/api/community/*',
    enforceOperationalSurface(dependencies, 'community')
  );
  app.use(
    '/api/account/community-profile',
    enforceOperationalSurface(dependencies, 'community')
  );
  app.use(
    '/api/practitioners',
    enforceOperationalSurface(dependencies, 'practitioner')
  );
  app.use(
    '/api/practitioners/*',
    enforceOperationalSurface(dependencies, 'practitioner')
  );
  app.use(
    '/api/practitioner',
    enforceOperationalSurface(dependencies, 'practitioner')
  );
  app.use(
    '/api/practitioner/*',
    enforceOperationalSurface(dependencies, 'practitioner')
  );
  app.get('/api/health', (context) => context.json(HEALTH_RESPONSE));
  app.get('/api/ready', (context) =>
    runtimeHealth.readiness === 'READY'
      ? context.json(READY_RESPONSE)
      : context.json(NOT_READY_RESPONSE, 503)
  );
  app.post('/api/chart', createChartRoute(dependencies));
  registerLocationResolutionRoutes(app, dependencies);
  registerBirthTimeResolutionRoutes(app, dependencies);
  registerSkyRoutes(app, dependencies);
  registerEmailAuthenticationRoutes(app, dependencies);
  registerGoogleAuthenticationRoutes(app, dependencies);
  registerSessionAuthenticationRoutes(app, dependencies);
  registerAccountRoutes(app, dependencies);
  registerAccountExportRoutes(app, dependencies, rateLimiter);
  registerNotificationRoutes(app, dependencies, rateLimiter);
  registerFoundationsLearningRoutes(app, dependencies, rateLimiter);
  registerCommunityRoutes(app, dependencies, rateLimiter);
  registerPractitionerRoutes(app, dependencies, rateLimiter);
  registerFeedbackRoutes(app, dependencies, rateLimiter);
  registerVaultChartRoutes(app, dependencies, rateLimiter);
  registerVaultNoteRoutes(app, dependencies, rateLimiter);

  app.notFound((context) =>
    isApiPath(context.req.path)
      ? createProblemDetailsContextResponse(context, { code: 'NOT_FOUND' })
      : context.json(NOT_FOUND_RESPONSE, 404)
  );

  app.onError((_error, context) => {
    return isApiPath(context.req.path)
      ? createProblemDetailsContextResponse(context, {
          code: 'INTERNAL_ERROR'
        })
      : context.json(INTERNAL_ERROR_RESPONSE, 500);
  });

  return app;
}
