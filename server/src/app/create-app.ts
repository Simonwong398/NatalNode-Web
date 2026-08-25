import { Hono } from 'hono';
import type { ServerDependencies } from './dependencies.js';
import { createChartRoute } from './routes/chart.js';
import { registerVaultChartRoutes } from './routes/vault-charts.js';

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

export function createApp(dependencies: ServerDependencies): Hono {
  const app = new Hono();

  app.get('/api/health', (context) => context.json(HEALTH_RESPONSE));
  app.post('/api/chart', createChartRoute(dependencies));
  registerVaultChartRoutes(app, dependencies);

  app.notFound((context) => context.json(NOT_FOUND_RESPONSE, 404));

  app.onError((_error, context) => context.json(INTERNAL_ERROR_RESPONSE, 500));

  return app;
}
