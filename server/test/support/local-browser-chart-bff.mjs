import { Hono } from 'hono';
import { registerLocationResolutionRoutes } from '../../dist/app/routes/location.js';
import { readBoundedJson } from '../../dist/app/validation/bounded-json.js';
import { prepareEngineCalculationRequest } from '../../dist/engine-request-adapter/index.js';
import {
  createWebEngineResearchResultReceiptV2
} from '../../dist/development/engine-result-adapter/engine-result-adapter.js';
import {
  RealEnginePrivateServiceError
} from '../../dist/development/real-engine-private-service-client.js';
import { createVerifiedPrivateEngineBffHarness } from './private-engine-http-adapter.mjs';

const RESOLVE_TIME_PATH = '/api/dev/chart/resolve-time';
const CALCULATE_PATH = '/api/dev/chart/calculate';
const MAX_RESOLUTION_REQUEST_BYTES = 8 * 1024;
const MAX_RESEARCH_BFF_RESPONSE_BYTES = 2 * 1024 * 1024 + MAX_RESOLUTION_REQUEST_BYTES;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isRecord(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function jsonError(context, status, code, message) {
  return context.json({ error: { code, message } }, status, {
    'Cache-Control': 'no-store'
  });
}

export function createLocalBrowserChartBffApp({
  allowedOrigin,
  engineClient,
  realResearchClient,
  workflowMode = 'synthetic',
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

  if (workflowMode === 'synthetic') {
    app.route('/', createVerifiedPrivateEngineBffHarness({
      engineClient,
      timeAuthority,
      routePath: CALCULATE_PATH
    }));
  } else if (workflowMode === 'real-research') {
    if (!realResearchClient || typeof realResearchClient.calculateChart !== 'function' ||
        typeof realResearchClient.expectedRuntimeIdentity !== 'string') {
      throw new TypeError('The real research workflow requires an explicitly configured private service client.');
    }
    app.all(CALCULATE_PATH, async (context) => {
      if (context.req.method !== 'POST') {
        return jsonError(context, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.');
      }
      const parsed = await readBoundedJson(context.req.raw, MAX_RESOLUTION_REQUEST_BYTES);
      if (parsed.outcome === 'unsupported-media-type') {
        return jsonError(context, 415, 'UNSUPPORTED_MEDIA_TYPE', 'A JSON request is required.');
      }
      if (parsed.outcome === 'too-large') {
        return jsonError(context, 413, 'PAYLOAD_TOO_LARGE', 'The chart request is too large.');
      }
      if (parsed.outcome !== 'parsed' || !hasExactKeys(parsed.value, ['chart'])) {
        return jsonError(context, 400, 'INVALID_REQUEST', 'The chart request is invalid.');
      }

      const prepared = prepareEngineCalculationRequest(parsed.value.chart, timeAuthority);
      if (prepared.outcome === 'REJECTED') {
        return context.json({
          error: { code: prepared.error.code, message: 'Birth input could not be verified.' }
        }, 422, { 'Cache-Control': 'no-store' });
      }

      try {
        const reply = await realResearchClient.calculateChart(prepared.request, context.req.raw.signal);
        const adapted = createWebEngineResearchResultReceiptV2({
          rawResult: reply.chart,
          expectedRequest: prepared.request,
          execution: reply.execution,
          expectedRuntimeIdentity: realResearchClient.expectedRuntimeIdentity,
          verifiedTime: prepared.verifiedTime,
          webRequest: parsed.value.chart
        });
        if (adapted.outcome !== 'CREATED') {
          return jsonError(context, 502, 'ENGINE_RESPONSE_INVALID', 'The private Engine response could not be validated.');
        }
        const serialized = JSON.stringify({ receipt: adapted.receipt });
        if (Buffer.byteLength(serialized, 'utf8') > MAX_RESEARCH_BFF_RESPONSE_BYTES) {
          return jsonError(context, 502, 'ENGINE_RESPONSE_INVALID', 'The private Engine response could not be validated.');
        }
        return context.body(serialized, 200, {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json; charset=utf-8'
        });
      } catch (error) {
        if (error instanceof RealEnginePrivateServiceError) {
          return jsonError(context, error.status, error.code, error.message);
        }
        return jsonError(context, 503, 'SERVICE_UNAVAILABLE', 'The private Engine service is unavailable.');
      }
    });
  } else {
    throw new TypeError('The local browser chart workflow mode is unsupported.');
  }

  return app;
}

export const LOCAL_BROWSER_CHART_BFF_PATHS = Object.freeze({
  resolveTime: RESOLVE_TIME_PATH,
  calculate: CALCULATE_PATH
});
