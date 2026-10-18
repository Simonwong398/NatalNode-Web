import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { ProviderLocationResolutionService } from '../../dist/location-resolution/location-resolution-service.js';
import { registerLocationResolutionRoutes } from '../../dist/app/routes/location.js';
import { readBoundedJson } from '../../dist/app/validation/bounded-json.js';
import { prepareEngineCalculationRequest } from '../../dist/engine-request-adapter/index.js';
import {
  createEngineAngleSignPresentationV1,
  createWebEngineResearchResultReceiptV2,
  createWebEngineResultReceiptV2
} from '../../dist/development/engine-result-adapter/engine-result-adapter.js';
import {
  RealEnginePrivateServiceError
} from '../../dist/development/real-engine-private-service-client.js';
import { createVerifiedPrivateEngineBffHarness } from './private-engine-http-adapter.mjs';

const RESOLVE_TIME_PATH = '/api/dev/chart/resolve-time';
const CALCULATE_PATH = '/api/dev/chart/calculate';
const MAX_RESOLUTION_REQUEST_BYTES = 8 * 1024;
const MAX_RESEARCH_BFF_RESPONSE_BYTES = 2 * 1024 * 1024 + MAX_RESOLUTION_REQUEST_BYTES;
const R5_FIXTURE_ID = 'NN-ENGINE-REAL-J2000-CHART-R5-001';
const R5_CHART = JSON.parse(readFileSync(
  new URL('../fixtures/r5-canonical-chart-result.json', import.meta.url),
  'utf8'
));

export const ARCHIVED_R5_FIXTURE_LOCATION = Object.freeze({
  resolutionId: 'r5-j2000-greenwich-fixture',
  canonicalDisplayName: 'Greenwich, United Kingdom (test fixture)',
  locality: 'Greenwich',
  region: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  coordinates: Object.freeze({ latitude: R5_CHART.input.latitude, longitude: R5_CHART.input.longitude }),
  ianaTimeZone: 'Europe/London',
  status: 'RESOLVED',
  authority: Object.freeze({
    kind: 'GEOCODING',
    sourceId: 'archived-r5-browser-fixture',
    recordId: 'r5-j2000-greenwich-fixture'
  }),
  source: Object.freeze({ sourceVersion: 'archived-r5-fixture-v1', datasetVersion: null })
});

export function createArchivedR5FixtureLocationResolutionService() {
  return new ProviderLocationResolutionService({
    async search(query) {
      const normalized = typeof query === 'string' ? query.trim().toLowerCase() : '';
      return normalized === 'greenwich' || normalized === 'london'
        ? [{
            candidateId: ARCHIVED_R5_FIXTURE_LOCATION.resolutionId,
            canonicalDisplayName: ARCHIVED_R5_FIXTURE_LOCATION.canonicalDisplayName,
            locality: ARCHIVED_R5_FIXTURE_LOCATION.locality,
            region: ARCHIVED_R5_FIXTURE_LOCATION.region,
            country: ARCHIVED_R5_FIXTURE_LOCATION.country,
            countryCode: ARCHIVED_R5_FIXTURE_LOCATION.countryCode,
            coordinates: ARCHIVED_R5_FIXTURE_LOCATION.coordinates,
            authority: ARCHIVED_R5_FIXTURE_LOCATION.authority,
            source: ARCHIVED_R5_FIXTURE_LOCATION.source
          }]
        : [];
    },
    async resolve(candidateId) {
      return candidateId === ARCHIVED_R5_FIXTURE_LOCATION.resolutionId ? ARCHIVED_R5_FIXTURE_LOCATION : null;
    }
  });
}

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
  fixtureEngineApi,
  requiredChartContext,
  observeRequest,
  locationResolutionService,
  timeAuthority
}) {
  const origin = new URL(allowedOrigin);
  if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1') {
    throw new TypeError('The local browser chart workflow requires an IPv4 loopback origin.');
  }

  const app = new Hono();
  let realResearchCalculationStarted = false;
  if (requiredChartContext !== undefined && (
    !isRecord(requiredChartContext) ||
    typeof requiredChartContext.instant !== 'string' ||
    typeof requiredChartContext.latitude !== 'number' ||
    typeof requiredChartContext.longitude !== 'number' ||
    typeof requiredChartContext.houseSystem !== 'string'
  )) {
    throw new TypeError('The required local chart context is invalid.');
  }

  const matchesRequiredContext = (request) => requiredChartContext === undefined || (
    request.input.instant === requiredChartContext.instant &&
    request.input.latitude === requiredChartContext.latitude &&
    request.input.longitude === requiredChartContext.longitude &&
    request.options.houseSystem === requiredChartContext.houseSystem
  );
  app.use('*', async (context, next) => {
    if (context.req.header('origin') !== origin.origin) {
      return jsonError(context, 403, 'SAME_ORIGIN_REQUIRED', 'Use the local chart page to submit this request.');
    }
    await next();
  });

  if (observeRequest) app.use('*', observeRequest);
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
  } else if (workflowMode === 'archived-r5-fixture') {
    if (typeof fixtureEngineApi?.signForLongitude !== 'function' ||
        !isRecord(fixtureEngineApi.NATALNODE_POLICY)) {
      throw new TypeError('The archived R5 fixture requires the verified Engine sign policy.');
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

      const fixtureInstant = new Date(R5_CHART.input.instant).toISOString();
      if (prepared.request.input.instant !== fixtureInstant ||
          prepared.request.input.latitude !== R5_CHART.input.latitude ||
          prepared.request.input.longitude !== R5_CHART.input.longitude ||
          prepared.request.options.houseSystem !== 'placidus') {
        return jsonError(context, 422, 'FIXTURE_CONTEXT_MISMATCH', 'The archived chart fixture only supports its original J2000 controls.');
      }

      const fixtureChart = structuredClone(R5_CHART);
      // Preserve the same instant while matching the canonical Engine wire-format milliseconds.
      fixtureChart.input.instant = prepared.request.input.instant;
      const presentation = createEngineAngleSignPresentationV1({
        rawResult: fixtureChart,
        expectedRequest: prepared.request,
        signForLongitude: fixtureEngineApi.signForLongitude,
        policy: fixtureEngineApi.NATALNODE_POLICY
      });
      if (presentation.outcome !== 'CREATED') {
        return jsonError(context, 502, 'ENGINE_RESPONSE_INVALID', 'The archived chart fixture could not be validated.');
      }

      const adapted = createWebEngineResultReceiptV2({
        rawResult: fixtureChart,
        expectedRequest: prepared.request,
        anglePresentation: presentation.presentation,
        verifiedTime: prepared.verifiedTime,
        webRequest: parsed.value.chart
      });
      if (adapted.outcome !== 'CREATED') {
        return jsonError(context, 502, 'ENGINE_RESPONSE_INVALID', 'The archived chart fixture could not be validated.');
      }
      const serialized = JSON.stringify({
        receipt: adapted.receipt,
        fixture: {
          id: R5_FIXTURE_ID,
          classification: 'ARCHIVED_RESEARCH_FIXTURE',
          calculationPerformed: false,
          locationResolution: 'FIXTURE_ONLY_NO_GEONAMES'
        }
      });
      if (Buffer.byteLength(serialized, 'utf8') > MAX_RESEARCH_BFF_RESPONSE_BYTES) {
        return jsonError(context, 502, 'ENGINE_RESPONSE_INVALID', 'The archived chart fixture could not be validated.');
      }
      return context.body(serialized, 200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      });
    });
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

      if (!matchesRequiredContext(prepared.request)) {
        return jsonError(context, 422, 'REAL_CALL_CONTEXT_MISMATCH', 'This local run is restricted to its frozen test-chart context.');
      }

      if (realResearchCalculationStarted) {
        return jsonError(context, 409, 'SINGLE_USE_REAL_CALL_CONSUMED', 'This local research run permits one calculation request.');
      }
      realResearchCalculationStarted = true;

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

export const LOCAL_BROWSER_CHART_FIXTURE_ID = R5_FIXTURE_ID;
