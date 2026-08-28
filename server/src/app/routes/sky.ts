import type { Context, Hono } from 'hono';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  isSkyEventsRequest,
  isSkySnapshotRequest
} from '../validation/index.js';

async function readJson(context: Context): Promise<unknown> {
  try {
    return await context.req.json();
  } catch (_error) {
    return undefined;
  }
}

async function getSkySnapshot(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const request = await readJson(context);

  if (!isSkySnapshotRequest(request)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  try {
    const result = await dependencies.engineClient.getSkySnapshot(request);
    return context.json(result);
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'CALCULATION_UNAVAILABLE'
    });
  }
}

async function getSkyEvents(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const request = await readJson(context);

  if (!isSkyEventsRequest(request)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  try {
    const result = await dependencies.engineClient.getSkyEvents(request);
    return context.json(result);
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'CALCULATION_UNAVAILABLE'
    });
  }
}

export function registerSkyRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.post('/api/sky/snapshot', (context) =>
    getSkySnapshot(context, dependencies)
  );
  app.post('/api/sky/events', (context) =>
    getSkyEvents(context, dependencies)
  );
}
