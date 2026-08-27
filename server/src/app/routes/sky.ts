import type { Context, Hono } from 'hono';
import type { ApiErrorResponse } from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';
import {
  isSkyEventsRequest,
  isSkySnapshotRequest
} from '../validation/index.js';

const INVALID_SNAPSHOT_REQUEST_RESPONSE: ApiErrorResponse = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid Sky snapshot request.'
  }
};

const INVALID_EVENTS_REQUEST_RESPONSE: ApiErrorResponse = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid Sky events request.'
  }
};

const CALCULATION_UNAVAILABLE_RESPONSE: ApiErrorResponse = {
  error: {
    code: 'CALCULATION_UNAVAILABLE',
    message: 'Sky calculation is currently unavailable.'
  }
};

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
    return context.json(INVALID_SNAPSHOT_REQUEST_RESPONSE, 400);
  }

  try {
    const result = await dependencies.engineClient.getSkySnapshot(request);
    return context.json(result);
  } catch (_error) {
    return context.json(CALCULATION_UNAVAILABLE_RESPONSE, 503);
  }
}

async function getSkyEvents(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const request = await readJson(context);

  if (!isSkyEventsRequest(request)) {
    return context.json(INVALID_EVENTS_REQUEST_RESPONSE, 400);
  }

  try {
    const result = await dependencies.engineClient.getSkyEvents(request);
    return context.json(result);
  } catch (_error) {
    return context.json(CALCULATION_UNAVAILABLE_RESPONSE, 503);
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
