import type { Context, Hono } from 'hono';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  isSkyEventsRequest,
  isSkySnapshotRequest,
  readBoundedJson
} from '../validation/index.js';

const SKY_REQUEST_MAXIMUM_BYTES = 8 * 1024;

async function readJson(context: Context): Promise<unknown | Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    SKY_REQUEST_MAXIMUM_BYTES
  );

  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (parsed.outcome === 'invalid') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return parsed.value;
}

async function getSkySnapshot(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const request = await readJson(context);

  if (request instanceof Response) {
    return request;
  }

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

  if (request instanceof Response) {
    return request;
  }

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
