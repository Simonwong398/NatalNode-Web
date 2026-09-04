import type {
  Context,
  Hono
} from 'hono';
import type {
  LocationResolveApiResponse,
  LocationSearchApiResponse
} from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  isLocationResolveApiRequest,
  isLocationSearchApiRequest,
  readBoundedJson
} from '../validation/index.js';

const LOCATION_REQUEST_MAXIMUM_BYTES = 4 * 1024;

async function readJson(context: Context): Promise<unknown | Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    LOCATION_REQUEST_MAXIMUM_BYTES
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

async function searchLocations(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const request = await readJson(context);

  if (request instanceof Response) {
    return request;
  }

  if (!isLocationSearchApiRequest(request)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  if (dependencies.locationResolutionService === undefined) {
    return createProblemDetailsContextResponse(context, {
      code: 'LOCATION_RESOLUTION_UNAVAILABLE'
    });
  }

  try {
    const result = await dependencies.locationResolutionService.search(request);
    const response: LocationSearchApiResponse = result;
    return context.json(response);
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'LOCATION_RESOLUTION_UNAVAILABLE'
    });
  }
}

async function resolveLocation(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const request = await readJson(context);

  if (request instanceof Response) {
    return request;
  }

  if (!isLocationResolveApiRequest(request)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  if (dependencies.locationResolutionService === undefined) {
    return createProblemDetailsContextResponse(context, {
      code: 'LOCATION_RESOLUTION_UNAVAILABLE'
    });
  }

  try {
    const result = await dependencies.locationResolutionService.resolve(request);
    const response: LocationResolveApiResponse = result;
    return context.json(response);
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'LOCATION_RESOLUTION_UNAVAILABLE'
    });
  }
}

export function registerLocationResolutionRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.post('/api/location/search', (context) =>
    searchLocations(context, dependencies)
  );
  app.post('/api/location/resolve', (context) =>
    resolveLocation(context, dependencies)
  );
}
