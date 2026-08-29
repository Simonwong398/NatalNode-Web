import { Hono } from 'hono';
import type { ServerDependencies } from './dependencies.js';
import {
  observeApiRequests,
  type ObservabilitySink
} from './observability/api-request-observability.js';
import { applyApiSecurityHeaders } from './security/api-security-headers.js';
import {
  enforceP0StagingRateLimits,
  InMemoryP0StagingRateLimiter
} from './security/api-rate-limiting.js';
import { enforceSameOriginUnsafeApiRequests } from './security/enforce-same-origin-unsafe-api-requests.js';
import { createChartRoute } from './routes/chart.js';
import { createProblemDetailsContextResponse } from './problem-details/context-response.js';
import { registerEmailAuthenticationRoutes } from './routes/auth-email.js';
import { registerSessionAuthenticationRoutes } from './routes/auth-session.js';
import { registerFeedbackRoutes } from './routes/feedback.js';
import { registerSkyRoutes } from './routes/sky.js';
import { registerVaultChartRoutes } from './routes/vault-charts.js';
import { registerVaultNoteRoutes } from './routes/vault-notes.js';
import { registerAccountRoutes } from './routes/account.js';
import { registerAccountExportRoutes } from './routes/account-export.js';

const HEALTH_RESPONSE = {
  service: 'natalnode-web-bff',
  status: 'ok'
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

export interface CreateAppOptions {
  readonly observabilitySink?: ObservabilitySink;
}

export function createApp(
  dependencies: ServerDependencies,
  options: CreateAppOptions = {}
): Hono {
  const app = new Hono();
  const rateLimiter = new InMemoryP0StagingRateLimiter();

  app.use('/api/*', observeApiRequests({ sink: options.observabilitySink }));
  app.use('/api/*', applyApiSecurityHeaders());
  app.use(
    '/api/*',
    enforceSameOriginUnsafeApiRequests(dependencies.publicWebOrigin)
  );
  app.use('/api/*', enforceP0StagingRateLimits(rateLimiter));
  app.get('/api/health', (context) => context.json(HEALTH_RESPONSE));
  app.post('/api/chart', createChartRoute(dependencies));
  registerSkyRoutes(app, dependencies);
  registerEmailAuthenticationRoutes(app, dependencies);
  registerSessionAuthenticationRoutes(app, dependencies);
  registerAccountRoutes(app, dependencies);
  registerAccountExportRoutes(app, dependencies, rateLimiter);
  registerFeedbackRoutes(app, dependencies, rateLimiter);
  registerVaultChartRoutes(app, dependencies);
  registerVaultNoteRoutes(app, dependencies);

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
