import { Hono } from 'hono';
import { registerLocationResolutionRoutes } from '../../dist/app/routes/location.js';
import { readBoundedJson } from '../../dist/app/validation/bounded-json.js';
import { createVerifiedPrivateEngineBffHarness } from './private-engine-http-adapter.mjs';

const RESOLVE_TIME_PATH = '/api/dev/chart/resolve-time';
const CALCULATE_PATH = '/api/dev/chart/calculate';
const MAX_RESOLUTION_REQUEST_BYTES = 8 * 1024;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonError(context, status, code, message) {
  return context.json({ error: { code, message } }, status, {
    'Cache-Control': 'no-store'
  });
}

export function createLocalBrowserChartBffApp({
  allowedOrigin,
  engineClient,
  locationResolutionService,
  timeAuthority
}) {
  const origin = new URL(allowedOrigin);
  if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1') {
    throw new TypeError('The local browser chart workflow requires an IPv4 loopback origin.');
  }

  const app = new Hono();
  app.use('*', async (context, next) => {
    if (context.req.header('origin') !== origin.origin) {
      return jsonError(context, 403, 'SAME_ORIGIN_REQUIRED', 'Use the local chart page to submit this request.');
    }
    await next();
  });

  registerLocationResolutionRoutes(app, { locationResolutionService });

  app.post(RESOLVE_TIME_PATH, async (context) => {
    const parsed = await readBoundedJson(context.req.raw, MAX_RESOLUTION_REQUEST_BYTES);
    if (parsed.outcome === 'unsupported-media-type') {
      return jsonError(context, 415, 'UNSUPPORTED_MEDIA_TYPE', 'A JSON request is required.');
    }
    if (parsed.outcome === 'too-large') {
      return jsonError(context, 413, 'PAYLOAD_TOO_LARGE', 'The birth-time request is too large.');
    }
    if (parsed.outcome !== 'parsed') {
      return jsonError(context, 400, 'INVALID_REQUEST', 'The birth-time request is invalid.');
    }

    let result;
    try {
      result = timeAuthority.resolve(parsed.value);
    } catch (_error) {
      return jsonError(context, 503, 'TIME_AUTHORITY_UNAVAILABLE', 'Birth time verification is unavailable.');
    }
    if (!isRecord(result)) {
      return jsonError(context, 503, 'TIME_AUTHORITY_UNAVAILABLE', 'Birth time verification is unavailable.');
    }

    const authority = {
      timezoneDatabaseVersion: timeAuthority.profile.timezoneDatabaseVersion,
      profileId: timeAuthority.profile.profileId
    };
    if (result.outcome === 'VERIFIED' && isRecord(result.value)) {
      return context.json({
        outcome: 'VERIFIED',
        authority,
        resolution: {
          resolvedUtcInstant: result.value.resolvedUtcInstant,
          utcOffsetSeconds: result.value.utcOffsetSeconds
        }
      }, 200, { 'Cache-Control': 'no-store' });
    }
    if (result.outcome === 'REJECTED' && isRecord(result.error)) {
      return context.json({ outcome: 'REJECTED', authority, error: result.error }, 422, {
        'Cache-Control': 'no-store'
      });
    }
    return jsonError(context, 503, 'TIME_AUTHORITY_UNAVAILABLE', 'Birth time verification is unavailable.');
  });

  app.route('/', createVerifiedPrivateEngineBffHarness({
    engineClient,
    timeAuthority,
    routePath: CALCULATE_PATH
  }));

  return app;
}

export const LOCAL_BROWSER_CHART_BFF_PATHS = Object.freeze({
  resolveTime: RESOLVE_TIME_PATH,
  calculate: CALCULATE_PATH
});
