import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { Hono } from 'hono';
import { createChartRoute } from '../dist/app/routes/chart.js';
import { registerLocationResolutionRoutes } from '../dist/app/routes/location.js';
import {
  classifyApiEndpointFamily,
  observeApiRequests
} from '../dist/app/observability/api-request-observability.js';
import {
  P0_STAGING_RATE_LIMIT_POLICIES,
  selectP0StagingRateLimitPolicy
} from '../dist/app/security/api-rate-limiting.js';
import {
  InvalidLocationProviderDataError,
  LOCATION_VISIBLE_CANDIDATE_LIMIT,
  ProviderLocationResolutionService,
  deduplicateLocationCandidates,
  rankLocationCandidates
} from '../dist/location-resolution/location-resolution-service.js';
import { SHANGHAI_OWNER_OBSERVED_CANDIDATES } from './support/geonames-shanghai-owner-output.mjs';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';

const candidate = {
  candidateId: 'geo-record-1',
  canonicalDisplayName: 'Los Angeles, California, United States',
  locality: 'Los Angeles',
  region: 'California',
  country: 'United States',
  countryCode: 'US',
  coordinates: { latitude: 34.0522, longitude: -118.2437 },
  authority: {
    kind: 'GEOCODING',
    sourceId: 'provider-neutral-test',
    recordId: 'geo-record-1'
  },
  source: { sourceVersion: 'test-v1', datasetVersion: 'test-dataset-v1' }
};

const resolvedLocation = {
  resolutionId: 'resolution-1',
  canonicalDisplayName: candidate.canonicalDisplayName,
  locality: candidate.locality,
  region: candidate.region,
  country: candidate.country,
  countryCode: candidate.countryCode,
  coordinates: candidate.coordinates,
  ianaTimeZone: 'America/Los_Angeles',
  status: 'RESOLVED',
  authority: candidate.authority,
  source: candidate.source
};

function makeLocationCandidate({
  candidateId,
  locality,
  region,
  country = 'China',
  countryCode = 'CN',
  sourceId = 'provider-neutral-test',
  recordId = candidateId,
  canonicalDisplayName = [locality, region, country].filter(Boolean).join(', '),
  coordinates = { latitude: 31.2, longitude: 121.4 }
}) {
  return {
    candidateId,
    canonicalDisplayName,
    locality,
    region,
    country,
    countryCode,
    coordinates,
    authority: {
      kind: 'GEOCODING',
      sourceId,
      recordId
    },
    source: { sourceVersion: 'test-v1', datasetVersion: null }
  };
}

function createProvider(overrides = {}) {
  return {
    async search() {
      return [candidate];
    },
    async resolve() {
      return resolvedLocation;
    },
    ...overrides
  };
}

function createRouteApp(service, sink) {
  const app = new Hono();
  if (sink !== undefined) {
    app.use('/api/*', observeApiRequests({ sink }));
  }
  registerLocationResolutionRoutes(app, {
    locationResolutionService: service
  });
  return app;
}

function postJson(app, path, body) {
  return app.request(path, {
    method: 'POST',
    headers: {
      Origin: PUBLIC_WEB_ORIGIN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

function postRaw(app, path, body) {
  return app.request(path, {
    method: 'POST',
    headers: {
      Origin: PUBLIC_WEB_ORIGIN,
      'Content-Type': 'application/json'
    },
    body
  });
}

async function problemPayload(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  const payload = await response.json();
  assert.equal(payload.status, status);
  assert.equal(payload.code, code);
  assert.equal('message' in payload, false);
  return payload;
}

function createChartRequest(overrides = {}) {
  return {
    birth: {
      localDate: '1990-01-01',
      localTime: '12:00',
      locationLabel: 'Shanghai China',
      latitude: 40.7128,
      longitude: -74.006,
      ianaTimeZone: 'America/New_York',
      resolvedUtcInstant: '1990-01-01T17:00:00.000Z',
      utcOffsetSeconds: -18_000,
      timezoneDatabaseVersion: 'fixture',
      timezoneResolutionMethod: 'UI_DEVELOPMENT_ONLY',
      ambiguityStatus: 'EXACT',
      ...overrides
    },
    houseSystem: 'PLACIDUS'
  };
}

test('provider-neutral service keeps raw query, candidate identity, and resolved authority separate', async () => {
  const calls = [];
  const service = new ProviderLocationResolutionService({
    async search(query, locale) {
      calls.push({ kind: 'search', query, locale });
      return [candidate];
    },
    async resolve(candidateId, locale) {
      calls.push({ kind: 'resolve', candidateId, locale });
      return resolvedLocation;
    }
  });

  assert.equal(service.getResolvedLocation('resolution-1'), null);
  const search = await service.search({ query: '  la usa  ', locale: 'en' });
  assert.equal(search.state, 'CANDIDATES');
  assert.equal(search.candidates[0].canonicalDisplayName, candidate.canonicalDisplayName);
  assert.equal(service.getResolvedLocation('resolution-1'), null);

  const resolved = await service.resolve({ candidateId: candidate.candidateId, locale: 'en' });
  assert.equal(resolved.state, 'RESOLVED');
  assert.equal(resolved.location.resolutionId, resolvedLocation.resolutionId);
  assert.equal(resolved.location.ianaTimeZone, 'America/Los_Angeles');
  assert.equal(service.getResolvedLocation('resolution-1').status, 'RESOLVED');
  assert.equal(Object.isFrozen(resolved.location), true);
  assert.equal(Object.isFrozen(resolved.location.coordinates), true);
  assert.deepEqual(calls, [
    { kind: 'search', query: '  la usa  ', locale: 'en' },
    { kind: 'resolve', candidateId: candidate.candidateId, locale: 'en' }
  ]);
});

test('location search ranking is deterministic, authority-safe, and visibly bounded', async () => {
  const mainShanghai = makeLocationCandidate({
    candidateId: 'shanghai-main',
    locality: 'Shanghai',
    region: 'Shanghai'
  });
  const minorYunnanShanghai = makeLocationCandidate({
    candidateId: 'shanghai-yunnan',
    locality: 'Shanghai',
    region: 'Yunnan'
  });
  const minorSichuanShanghai = makeLocationCandidate({
    candidateId: 'shanghai-sichuan',
    locality: 'Shanghai',
    region: 'Sichuan'
  });
  const exactAuthorityDuplicate = makeLocationCandidate({
    candidateId: 'shanghai-main-duplicate',
    locality: 'Shanghai',
    region: 'Shanghai',
    recordId: 'shanghai-main'
  });
  const candidates = [
    makeLocationCandidate({
      candidateId: 'shanghai-huacheng',
      locality: 'Shanghai Huacheng',
      region: 'Shanghai'
    }),
    minorYunnanShanghai,
    mainShanghai,
    minorSichuanShanghai,
    makeLocationCandidate({
      candidateId: 'xinzhuang',
      locality: 'Xinzhuang',
      region: 'Shanghai'
    }),
    makeLocationCandidate({
      candidateId: 'shanghai-laluo',
      locality: 'Shanghai Laluo',
      region: 'Guizhou'
    }),
    makeLocationCandidate({
      candidateId: 'shanghai-other',
      locality: 'Shanghai Other',
      region: 'Hunan'
    }),
    exactAuthorityDuplicate
  ];

  const rankedOnce = rankLocationCandidates('Shanghai China', candidates);
  const rankedTwice = rankLocationCandidates('Shanghai China', candidates);
  assert.deepEqual(
    rankedOnce.map(({ candidateId }) => candidateId),
    rankedTwice.map(({ candidateId }) => candidateId)
  );
  assert.equal(rankedOnce[0].candidateId, 'shanghai-main');
  assert.ok(
    rankedOnce.findIndex(({ candidateId }) => candidateId === 'shanghai-main') <
      rankedOnce.findIndex(({ candidateId }) => candidateId === 'shanghai-yunnan')
  );
  assert.ok(
    rankedOnce.findIndex(({ candidateId }) => candidateId === 'shanghai-main') <
      rankedOnce.findIndex(({ candidateId }) => candidateId === 'shanghai-sichuan')
  );

  const unique = deduplicateLocationCandidates(candidates);
  assert.equal(unique.length, candidates.length - 1);
  assert.equal(
    unique.filter(({ authority }) => authority.recordId === 'shanghai-main').length,
    1
  );

  const service = new ProviderLocationResolutionService({
    async search() {
      return candidates;
    },
    async resolve() {
      return null;
    }
  });
  const result = await service.search({ query: 'Shanghai China', locale: 'en' });

  assert.equal(result.state, 'CANDIDATES');
  assert.equal(result.candidates.length, LOCATION_VISIBLE_CANDIDATE_LIMIT);
  assert.equal('selectedLocation' in result, false);
  assert.equal(
    result.candidates.filter(({ authority }) => authority.recordId === 'shanghai-main').length,
    1
  );
  assert.equal(
    result.candidates.some(({ candidateId }) => candidateId === 'shanghai-yunnan'),
    true
  );
  assert.equal(
    result.candidates.some(({ candidateId }) => candidateId === 'shanghai-sichuan'),
    true
  );
  assert.equal(
    result.candidates.some(({ candidateId }) => candidateId === 'shanghai-main-duplicate'),
    false
  );
});

test('owner-observed Shanghai result shape keeps distinct same-name places and puts the municipality first', async () => {
  const observedCandidates = SHANGHAI_OWNER_OBSERVED_CANDIDATES.map((observed, index) =>
    makeLocationCandidate({
      ...observed,
      candidateId: `owner-observed-${index + 1}`,
      recordId: `owner-observed-${index + 1}`,
      coordinates: null
    })
  );
  const service = new ProviderLocationResolutionService({
    async search() {
      return observedCandidates;
    },
    async resolve() {
      return null;
    }
  });

  const result = await service.search({ query: 'Shanghai China', locale: 'en' });
  assert.equal(result.state, 'CANDIDATES');
  assert.equal(result.candidates.length, LOCATION_VISIBLE_CANDIDATE_LIMIT);
  assert.equal(result.candidates[0].locality, 'Shanghai');
  assert.equal(result.candidates[0].region, 'Shanghai');
  assert.equal(
    result.candidates.filter(
      ({ locality, region }) => locality === 'Shanghai' && region === 'Yunnan'
    ).length,
    3
  );
  assert.equal(
    new Set(result.candidates.map(({ authority }) => authority.recordId)).size,
    result.candidates.length
  );
});

test('invalid provider data fails closed instead of becoming a canonical location', async () => {
  const invalid = new ProviderLocationResolutionService(createProvider({
    async search() {
      return [{ ...candidate, coordinates: { latitude: 91, longitude: 0 } }];
    }
  }));

  await assert.rejects(
    invalid.search({ query: 'Somewhere', locale: 'en' }),
    InvalidLocationProviderDataError
  );

  const app = createRouteApp(invalid);
  const response = await postJson(app, '/api/location/search', {
    query: 'Somewhere',
    locale: 'en'
  });
  await problemPayload(response, 503, 'LOCATION_RESOLUTION_UNAVAILABLE');
});

test('location BFF routes enforce bounded payloads, provider-neutral success, and unavailable states', async () => {
  const unavailable = createRouteApp(undefined);
  await problemPayload(
    await postJson(unavailable, '/api/location/search', { query: 'Paris', locale: 'en' }),
    503,
    'LOCATION_RESOLUTION_UNAVAILABLE'
  );
  await problemPayload(
    await postJson(unavailable, '/api/location/search', {}),
    400,
    'INVALID_REQUEST'
  );
  await problemPayload(
    await postJson(unavailable, '/api/location/resolve', { candidateId: '', locale: 'en' }),
    400,
    'INVALID_REQUEST'
  );
  await problemPayload(
    await postRaw(unavailable, '/api/location/search', 'not-json'),
    400,
    'INVALID_REQUEST'
  );
  await problemPayload(
    await postJson(unavailable, '/api/location/search', {
      query: 'x'.repeat(161),
      locale: 'en'
    }),
    400,
    'INVALID_REQUEST'
  );

  const service = new ProviderLocationResolutionService(createProvider());
  const app = createRouteApp(service);
  const searchResponse = await postJson(app, '/api/location/search', {
    query: 'Shanghai China',
    locale: 'zh-Hant'
  });
  assert.equal(searchResponse.status, 200);
  assert.deepEqual(await searchResponse.json(), {
    state: 'CANDIDATES',
    candidates: [candidate]
  });

  const mismatchedLocaleResponse = await postJson(app, '/api/location/resolve', {
    candidateId: candidate.candidateId,
    locale: 'en'
  });
  assert.equal(mismatchedLocaleResponse.status, 200);
  assert.deepEqual(await mismatchedLocaleResponse.json(), {
    state: 'UNRESOLVED'
  });

  const resolveResponse = await postJson(app, '/api/location/resolve', {
    candidateId: candidate.candidateId,
    locale: 'zh-Hant'
  });
  assert.equal(resolveResponse.status, 200);
  assert.deepEqual(await resolveResponse.json(), {
    state: 'RESOLVED',
    location: resolvedLocation
  });
});

test('production chart submission fails closed without an explicit resolved location and never calls the calculator', async () => {
  let calculationCalls = 0;
  const chartCalculator = {
    async calculateChartWithOutcome() {
      calculationCalls += 1;
      throw new Error('must not be called');
    }
  };
  const productionDependencies = {
    operationalConfig: { runtimeMode: 'production' },
    chartCalculator
  };
  const app = new Hono();
  app.post('/api/chart', createChartRoute(productionDependencies));

  await problemPayload(
    await postJson(app, '/api/chart', { chart: createChartRequest() }),
    503,
    'LOCATION_RESOLUTION_UNAVAILABLE'
  );
  assert.equal(calculationCalls, 0);

  const service = {
    getResolvedLocation() {
      return null;
    }
  };
  const serviceApp = new Hono();
  serviceApp.post('/api/chart', createChartRoute({
    ...productionDependencies,
    locationResolutionService: service
  }));

  await problemPayload(
    await postJson(serviceApp, '/api/chart', { chart: createChartRequest() }),
    400,
    'LOCATION_RESOLUTION_REQUIRED'
  );
  assert.equal(calculationCalls, 0);
});

test('location requests are observable by endpoint family without raw birthplace payloads', async () => {
  const records = [];
  const app = createRouteApp(undefined, {
    write(record) {
      records.push(record);
    }
  });

  await postJson(app, '/api/location/search', {
    query: 'Shanghai China',
    locale: 'en'
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].endpointFamily, 'location.search');
  assert.equal(JSON.stringify(records).includes('Shanghai China'), false);
  assert.equal(JSON.stringify(records).includes('latitude'), false);
  assert.equal(JSON.stringify(records).includes('birth'), false);
});

test('location routes have explicit classifier and bounded staging rate-limit policies', () => {
  assert.equal(classifyApiEndpointFamily('/api/location/search'), 'location.search');
  assert.equal(classifyApiEndpointFamily('/api/location/resolve'), 'location.resolve');
  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/location/search'),
    P0_STAGING_RATE_LIMIT_POLICIES.locationSearch
  );
  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/location/resolve'),
    P0_STAGING_RATE_LIMIT_POLICIES.locationResolve
  );
});

test('development resolver and browser surface contain no provider or title-case authority shortcut', () => {
  const developmentResolver = readFileSync(
    new URL('../../apps/web/src/features/chart-input/development-resolver.ts', import.meta.url),
    'utf8'
  );
  const browserLocationSurface = [
    readFileSync(
      new URL('../../apps/web/src/features/chart-input/location-resolution.ts', import.meta.url),
      'utf8'
    ),
    readFileSync(
      new URL('../../apps/web/src/features/chart-input/LocationResolutionPanel.tsx', import.meta.url),
      'utf8'
    )
  ].join('\n');
  const serverLocationSurface = readFileSync(
    new URL('../src/location-resolution/location-resolution-service.ts', import.meta.url),
    'utf8'
  );

  assert.match(developmentResolver, /UI DEVELOPMENT ONLY/u);
  assert.match(developmentResolver, /NOT PRODUCTION RESOLUTION/u);
  assert.doesNotMatch(developmentResolver, /GeocodingProvider/u);
  assert.doesNotMatch(browserLocationSurface, /titleCase|toTitleCase|fetch\s*\(/u);
  assert.doesNotMatch(serverLocationSurface, /@googlemaps|mapbox|geonames|nominatim|here-sdk/iu);
});
