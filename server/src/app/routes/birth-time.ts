import type { Context, Hono } from 'hono';
import type {
  CivilTimeResolutionApiResponse,
  TimeResolutionError
} from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import { readBoundedJson } from '../validation/bounded-json.js';
import { CIVIL_TIME_AUTHORITY_PROFILE } from '../../time-resolution/civil-time-profile.js';

const BIRTH_TIME_REQUEST_MAXIMUM_BYTES = 4 * 1024;

function rejectedResponse(
  context: Context,
  error: TimeResolutionError,
  status: 422 | 503,
  authority = CIVIL_TIME_AUTHORITY_PROFILE
): Response {
  const response: CivilTimeResolutionApiResponse = {
    outcome: 'REJECTED',
    authority,
    error
  };
  return context.json(response, status, { 'Cache-Control': 'no-store' });
}

function isUnavailableError(error: TimeResolutionError): boolean {
  return error.code === 'LOCATION_RESOLUTION_UNAVAILABLE' ||
    error.code === 'TIME_AUTHORITY_UNAVAILABLE' ||
    error.code === 'TIME_AUTHORITY_DATA_INVALID';
}

async function resolveBirthTime(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    BIRTH_TIME_REQUEST_MAXIMUM_BYTES
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
  if (parsed.outcome !== 'parsed') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  const service = dependencies.birthTimeResolutionService;
  if (service === undefined) {
    return rejectedResponse(context, {
      code: 'TIME_AUTHORITY_UNAVAILABLE',
      field: null
    }, 503);
  }

  try {
    const result = service.resolve(parsed.value);
    if (result.outcome === 'VERIFIED') {
      const response: CivilTimeResolutionApiResponse = {
        outcome: 'VERIFIED',
        evidence: result.value
      };
      return context.json(response, 200, { 'Cache-Control': 'no-store' });
    }

    return rejectedResponse(
      context,
      result.error,
      isUnavailableError(result.error) ? 503 : 422,
      service.profile
    );
  } catch (_error) {
    return rejectedResponse(context, {
      code: 'TIME_AUTHORITY_UNAVAILABLE',
      field: null
    }, 503, service.profile);
  }
}

/** Uses createApp's existing same-origin, API security-header and rate-limit boundary. */
export function registerBirthTimeResolutionRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.post('/api/birth-time/resolve', (context) =>
    resolveBirthTime(context, dependencies)
  );
}
