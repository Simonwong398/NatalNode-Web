import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { createBirthTimeResolutionService } from '../dist/time-resolution/index.js';
import { ProviderLocationResolutionService } from '../dist/location-resolution/location-resolution-service.js';
import { RealEnginePrivateServiceClient } from '../dist/development/real-engine-private-service-client.js';
import {
  ARCHIVED_R5_FIXTURE_LOCATION,
  createArchivedR5FixtureLocationResolutionService,
  createLocalBrowserChartBffApp
} from './support/local-browser-chart-bff.mjs';
import { startLoopbackHonoServer } from './support/private-engine-http-adapter.mjs';
import {
  createSingleUseJ2000Evidence,
  J2000_WIRE,
  selectSingleUseJ2000EvidenceBinding
} from '../../scripts/single-use-j2000-evidence.mjs';

const WEB_ORIGIN = 'http://127.0.0.1:4321';
// `canonicalChartResult` from the verified Engine R5 delivery at 4f707309edd65299b953527477222c7387cc16f4.
const R5_CHART = JSON.parse(readFileSync(new URL('./fixtures/r5-canonical-chart-result.json', import.meta.url), 'utf8'));
const RESEARCH_TOKEN = 'r5-private-service-bff-test-token-123456';
const RUNTIME_IDENTITY = 'a'.repeat(64);
const HTTP_TASK_ID = 'NN-ENGINE-WEB-CORRECTED-HTTP-E2E-001';
const HTTP_RUNTIME_IDENTITY = 'a72e614ce632a5f94bb9864e45446781212fff740cd4a4d3f79987944535cfa4';
const HTTP_ENGINE_HEAD = '9cde9285d5ed74a1837d8be0dd5c807ca0134bc3';
const HTTP_MANIFEST_SHA256 = 'b5efee74acc01a702d429298afa8d6d3dd839de8b930328f21589f768e663d50';
const RESEARCH_EXECUTION = Object.freeze({
  serviceInstanceId: 'service-550e8400-e29b-41d4-a716-446655440000',
  requestExecutionId: 'request-550e8400-e29b-41d4-a716-446655440001',
  runtimeIdentity: RUNTIME_IDENTITY,
  status: 'RESEARCH_ONLY',
  provenance: 'INCOMPLETE_RESEARCH'
});
const LONDON = Object.freeze({
  resolutionId: 'london-greenwich-fixture',
  canonicalDisplayName: 'London, United Kingdom',
  locality: 'London',
  region: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  coordinates: Object.freeze({ latitude: 51.4779, longitude: -0.0015 }),
  ianaTimeZone: 'Europe/London',
  status: 'RESOLVED',
  authority: Object.freeze({
    kind: 'GEOCODING',
    sourceId: 'explicit-bff-test-fixture',
    recordId: 'london-greenwich-fixture'
  }),
  source: Object.freeze({ sourceVersion: 'bff-fixture-v1', datasetVersion: null })
});

function createLocationOwner() {
  const provider = {
    async search(query) {
      return query.toLowerCase().includes('london') ? [{
        candidateId: LONDON.resolutionId,
        canonicalDisplayName: LONDON.canonicalDisplayName,
        locality: LONDON.locality,
        region: LONDON.region,
        country: LONDON.country,
        countryCode: LONDON.countryCode,
        coordinates: LONDON.coordinates,
        authority: LONDON.authority,
        source: LONDON.source
      }] : [];
    },
    async resolve(candidateId) {
      return candidateId === LONDON.resolutionId ? LONDON : null;
    }
  };
  return new ProviderLocationResolutionService(provider);
}

async function createHarness() {
  const locationResolutionService = createLocationOwner();
  const candidates = await locationResolutionService.search({ query: 'London', locale: 'en' });
  assert.equal(candidates.state, 'CANDIDATES');
  const selected = await locationResolutionService.resolve({
    candidateId: candidates.candidates[0].candidateId,
    locale: 'en'
  });
  assert.equal(selected.state, 'RESOLVED');
  const timeAuthority = createBirthTimeResolutionService({ locationResolutionService });
  let engineCalls = 0;
  const engineClient = {
    async calculateChart() { engineCalls += 1; throw new Error('Unexpected calculation call.'); },
    async calculateChartWithPresentation() { engineCalls += 1; throw new Error('Unexpected calculation call.'); }
  };
  const app = createLocalBrowserChartBffApp({
    allowedOrigin: WEB_ORIGIN,
    engineClient,
    locationResolutionService,
    timeAuthority
  });
  const server = await startLoopbackHonoServer(app);
  return { server, engineCalls: () => engineCalls };
}

async function createResearchHarness({
  fetchImplementation,
  onSyntheticFallback = () => {}
} = {}) {
  const locationResolutionService = createLocationOwner();
  const candidates = await locationResolutionService.search({ query: 'London', locale: 'en' });
  const selected = await locationResolutionService.resolve({
    candidateId: candidates.candidates[0].candidateId,
    locale: 'en'
  });
  assert.equal(selected.state, 'RESOLVED');
  const timeAuthority = createBirthTimeResolutionService({ locationResolutionService });
  let serviceCalls = 0;
  const fetchOperation = fetchImplementation ?? (async (_url, init) => {
    const request = JSON.parse(init.body);
    assert.equal(request.input.instant, R5_CHART.input.instant, 'The real-service wire uses Engine canonical UTC.');
    return new Response(JSON.stringify({ chart: R5_CHART, execution: RESEARCH_EXECUTION }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  });
  const fixtureFetch = async (...args) => {
    serviceCalls += 1;
    return fetchOperation(...args);
  };
  const realResearchClient = new RealEnginePrivateServiceClient({
    baseUrl: 'http://127.0.0.1:45873',
    bearerToken: RESEARCH_TOKEN,
    expectedRuntimeIdentity: RUNTIME_IDENTITY,
    fetchImplementation: fixtureFetch
  });
  const app = createLocalBrowserChartBffApp({
    allowedOrigin: WEB_ORIGIN,
    engineClient: {
      async calculateChart() { onSyntheticFallback(); throw new Error('Synthetic fallback must not run.'); },
      async calculateChartWithPresentation() { onSyntheticFallback(); throw new Error('Synthetic fallback must not run.'); }
    },
    realResearchClient,
    workflowMode: 'real-research',
    locationResolutionService,
    timeAuthority
  });
  const server = await startLoopbackHonoServer(app);
  return { server, timeAuthority, serviceCalls: () => serviceCalls };
}

async function post(server, path, value, origin = WEB_ORIGIN) {
  return fetch(`${server.origin}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin
    },
    body: JSON.stringify(value)
  });
}

function timeRequest({ date = '2025-10-22', time = '10:52', coordinates = LONDON.coordinates } = {}) {
  return {
    civilTime: {
      localDate: date,
      localTime: time,
      calendar: 'ISO_8601_GREGORIAN',
      precision: 'MINUTE'
    },
    location: {
      resolutionId: LONDON.resolutionId,
      coordinates,
      ianaTimeZone: LONDON.ianaTimeZone
    },
    disambiguation: 'REJECT',
    expectedTimezoneDatabaseVersion: null
  };
}

function r5BrowserChartRequest(timeAuthority, location = LONDON, localTime = '12:00') {
  const localDate = '2000-01-01';
  const resolution = timeAuthority.resolve({
    civilTime: {
      localDate,
      localTime,
      calendar: 'ISO_8601_GREGORIAN',
      precision: 'MINUTE'
    },
    location: {
      resolutionId: location.resolutionId,
      coordinates: location.coordinates,
      ianaTimeZone: location.ianaTimeZone
    },
    disambiguation: 'REJECT',
    expectedTimezoneDatabaseVersion: null
  });
  assert.equal(resolution.outcome, 'VERIFIED');
  if (localTime === '12:00') {
    assert.equal(
      new Date(resolution.value.resolvedUtcInstant).toISOString(),
      new Date(R5_CHART.input.instant).toISOString()
    );
  }
  return {
    birth: {
      localDate,
      localTime,
      locationLabel: location.canonicalDisplayName,
      locationResolutionId: location.resolutionId,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      ianaTimeZone: location.ianaTimeZone,
      resolvedUtcInstant: resolution.value.resolvedUtcInstant,
      utcOffsetSeconds: resolution.value.utcOffsetSeconds,
      timezoneDatabaseVersion: timeAuthority.profile.timezoneDatabaseVersion,
      timezoneResolutionMethod: timeAuthority.profile.profileId,
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'Placidus'
  };
}

async function createArchivedFixtureHarness({ onEngineCall = () => {} } = {}) {
  const checkout = process.env.NATALNODE_ENGINE_CHECKOUT;
  assert.ok(typeof checkout === 'string' && checkout.trim() !== '',
    'Set NATALNODE_ENGINE_CHECKOUT to the verified Engine checkout for this test.');
  const engineApi = await import(pathToFileURL(join(
    checkout,
    'packages/engine/dist/src/index.js'
  )).href);
  const locationResolutionService = createArchivedR5FixtureLocationResolutionService();
  const candidates = await locationResolutionService.search({ query: 'Greenwich', locale: 'en' });
  assert.equal(candidates.state, 'CANDIDATES');
  const selected = await locationResolutionService.resolve({
    candidateId: candidates.candidates[0].candidateId,
    locale: 'en'
  });
  assert.equal(selected.state, 'RESOLVED');
  const timeAuthority = createBirthTimeResolutionService({ locationResolutionService });
  const app = createLocalBrowserChartBffApp({
    allowedOrigin: WEB_ORIGIN,
    engineClient: {
      async calculateChart() { onEngineCall(); throw new Error('Engine calculation must not run for the archived fixture.'); },
      async calculateChartWithPresentation() { onEngineCall(); throw new Error('Engine calculation must not run for the archived fixture.'); }
    },
    fixtureEngineApi: engineApi,
    workflowMode: 'archived-r5-fixture',
    locationResolutionService,
    timeAuthority
  });
  const server = await startLoopbackHonoServer(app);
  return { server, timeAuthority, locationResolutionService };
}

test('browser BFF uses the canonical location owner and resolves London civil time server-side', async (context) => {
  const harness = await createHarness();
  context.after(() => harness.server.close());

  const searchResponse = await post(harness.server, '/api/location/search', {
    query: 'London',
    locale: 'en'
  });
  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json();
  assert.equal(search.state, 'CANDIDATES');
  assert.equal(search.candidates[0].canonicalDisplayName, 'London, United Kingdom');

  const selectionResponse = await post(harness.server, '/api/location/resolve', {
    candidateId: search.candidates[0].candidateId,
    locale: 'en'
  });
  assert.equal(selectionResponse.status, 200);
  const selection = await selectionResponse.json();
  assert.equal(selection.state, 'RESOLVED');
  assert.equal(selection.location.ianaTimeZone, 'Europe/London');
  assert.deepEqual(selection.location.coordinates, LONDON.coordinates);

  const response = await post(harness.server, '/api/dev/chart/resolve-time', timeRequest());
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.outcome, 'VERIFIED');
  assert.equal(payload.resolution.resolvedUtcInstant, '2025-10-22T09:52:00.000Z');
  assert.equal(payload.resolution.utcOffsetSeconds, 3_600);
  assert.equal(payload.authority.timezoneDatabaseVersion, '2026e');
  assert.equal(harness.engineCalls(), 0);
});

test('browser BFF preserves nonexistent, ambiguous, unknown-time and stale-location failures', async (context) => {
  const harness = await createHarness();
  context.after(() => harness.server.close());

  const nonexistent = await post(harness.server, '/api/dev/chart/resolve-time', timeRequest({
    date: '2025-03-30',
    time: '01:30'
  }));
  assert.equal(nonexistent.status, 422);
  assert.equal((await nonexistent.json()).error.code, 'NONEXISTENT_LOCAL_TIME');

  const ambiguous = await post(harness.server, '/api/dev/chart/resolve-time', timeRequest({
    date: '2025-10-26',
    time: '01:30'
  }));
  assert.equal(ambiguous.status, 422);
  assert.equal((await ambiguous.json()).error.code, 'AMBIGUOUS_LOCAL_TIME');

  const unknown = await post(harness.server, '/api/dev/chart/resolve-time', timeRequest({
    time: null
  }));
  assert.equal(unknown.status, 422);
  assert.equal((await unknown.json()).error.code, 'UNKNOWN_BIRTH_TIME');

  const staleLocation = await post(harness.server, '/api/dev/chart/resolve-time', timeRequest({
    coordinates: { latitude: 40.7128, longitude: -74.006 }
  }));
  assert.equal(staleLocation.status, 422);
  assert.equal((await staleLocation.json()).error.code, 'LOCATION_BINDING_MISMATCH');
  assert.equal(harness.engineCalls(), 0);
});

test('browser BFF requires the exact local page origin and does not expose the test route cross-origin', async (context) => {
  const harness = await createHarness();
  context.after(() => harness.server.close());

  const rejected = await post(
    harness.server,
    '/api/dev/chart/resolve-time',
    timeRequest(),
    'https://attacker.example'
  );
  assert.equal(rejected.status, 403);
  assert.equal((await rejected.json()).error.code, 'SAME_ORIGIN_REQUIRED');
  assert.equal(harness.engineCalls(), 0);
});

test('real research BFF maps the archived R5 fixture, retaining full chart, execution and scientific provenance', async (context) => {
  let syntheticFallbackCalls = 0;
  const harness = await createResearchHarness({
    onSyntheticFallback() { syntheticFallbackCalls += 1; }
  });
  context.after(() => harness.server.close());

  const chartRequest = r5BrowserChartRequest(harness.timeAuthority);
  const response = await post(harness.server, '/api/dev/chart/calculate', { chart: chartRequest });
  assert.equal(response.status, 200);
  const responseText = await response.text();
  assert.equal(responseText.includes(RESEARCH_TOKEN), false, 'Bearer credentials never reach the browser.');
  const payload = JSON.parse(responseText);
  assert.equal(Object.hasOwn(payload, 'transport'), false, 'Research output does not use the fake-only transport envelope.');
  const receipt = payload.receipt;
  assert.equal(receipt.assessment.dataClassification, 'REAL ASTRONOMICAL RESEARCH OUTPUT');
  assert.equal(receipt.assessment.astronomicalStatus, 'NOT SCIENTIFICALLY OR PRODUCTION APPROVED');
  assert.equal(receipt.assessment.providerScientificAdmission, 'NOT_ADMITTED');
  assert.equal(receipt.assessment.productionResultCertification, 'NOT_CERTIFIED');
  assert.equal(receipt.chart.bodies.length, 10);
  assert.equal(receipt.chart.angles.length, 2);
  assert.equal(receipt.chart.houses.cusps.length, 12);
  assert.equal(receipt.chart.aspects.length, R5_CHART.aspects.length);
  assert.deepEqual(receipt.presentation.angles.map(({ sign }) => sign), ['Aries', 'Capricorn']);
  assert.equal(receipt.source.engineResult.provider.id, R5_CHART.provider.id);
  assert.deepEqual(receipt.source.engineResult.metadata.provenance, R5_CHART.metadata.provenance);
  assert.deepEqual(receipt.source.engineResult.modelVersions, R5_CHART.modelVersions);
  assert.deepEqual(receipt.source.engineResult, R5_CHART, 'The canonical Engine result is retained without rewriting its input.');
  assert.equal(receipt.source.webCivilTime.evidence.resolvedUtcInstant, '2000-01-01T12:00:00.000Z');
  assert.equal(chartRequest.birth.resolvedUtcInstant, '2000-01-01T12:00:00.000Z');
  assert.equal(receipt.execution.runtimeIdentity, RUNTIME_IDENTITY);
  assert.equal(receipt.execution.status, 'RESEARCH_ONLY');
  assert.equal(receipt.execution.provenance, 'INCOMPLETE_RESEARCH');
  assert.equal(syntheticFallbackCalls, 0);
  assert.equal(harness.serviceCalls(), 1);

  const replay = await post(harness.server, '/api/dev/chart/calculate', { chart: chartRequest });
  assert.equal(replay.status, 409);
  assert.equal((await replay.json()).error.code, 'SINGLE_USE_REAL_CALL_CONSUMED');
  assert.equal(harness.serviceCalls(), 1, 'The BFF does not send a second authenticated request.');
});

test('single-use HTTP task records one direct BFF submission and one Engine request without browser traffic or fixture fallback', async (context) => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'nn-corrected-http-e2e-test-'));
  mkdirSync(join(tempRoot, 'dist'));
  const binding = selectSingleUseJ2000EvidenceBinding(HTTP_TASK_ID, {
    webRoot: tempRoot,
    engineHead: HTTP_ENGINE_HEAD,
    webHead: 'c'.repeat(40),
    runtimeIdentity: HTTP_RUNTIME_IDENTITY,
    manifestSha256: HTTP_MANIFEST_SHA256
  });
  const readEvidence = (name) => JSON.parse(readFileSync(join(binding.directory, `${name}.json`), 'utf8'));
  let serviceCalls = 0;
  let syntheticFallbackCalls = 0;
  const execution = Object.freeze({
    ...RESEARCH_EXECUTION,
    runtimeIdentity: HTTP_RUNTIME_IDENTITY
  });
  const evidence = createSingleUseJ2000Evidence(binding.directory, binding.identity, async (_url, init) => {
    serviceCalls += 1;
    assert.equal(readEvidence('bff-http-budget-consumed').bffHttpBudgetConsumed, true,
      'BFF submission budget is durable before the Engine request.');
    assert.equal(readEvidence('engine-request').requestCount, 1,
      'Engine request budget is durable before the private-service transport.');
    assert.deepEqual(JSON.parse(init.body), J2000_WIRE);
    return new Response(JSON.stringify({ chart: R5_CHART, execution }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  });
  const client = new RealEnginePrivateServiceClient({
    baseUrl: 'http://127.0.0.1:45873',
    bearerToken: RESEARCH_TOKEN,
    expectedRuntimeIdentity: HTTP_RUNTIME_IDENTITY,
    fetchImplementation: evidence.fetchOperation
  });
  const locationResolutionService = createArchivedR5FixtureLocationResolutionService();
  const timeAuthority = createBirthTimeResolutionService({ locationResolutionService });
  const app = createLocalBrowserChartBffApp({
    allowedOrigin: WEB_ORIGIN,
    engineClient: {
      async calculateChart() { syntheticFallbackCalls += 1; throw new Error('Synthetic fallback must not run.'); },
      async calculateChartWithPresentation() { syntheticFallbackCalls += 1; throw new Error('Synthetic fallback must not run.'); }
    },
    realResearchClient: evidence.wrapClient(client),
    workflowMode: 'real-research',
    requiredChartContext: {
      instant: '2000-01-01T12:00:00.000Z',
      latitude: 51.4779,
      longitude: -0.0015,
      houseSystem: 'placidus'
    },
    observeRequest: evidence.observeBff,
    locationResolutionService,
    timeAuthority
  });
  const server = await startLoopbackHonoServer(app);
  let evidenceClosed = false;
  context.after(async () => {
    await server.close();
    if (!evidenceClosed) {
      evidence.close(['simulated HTTP BFF integration cleanup']);
      evidenceClosed = true;
    }
  });

  const search = await (await post(server, '/api/location/search', {
    query: 'Greenwich', locale: 'en'
  })).json();
  assert.equal(search.state, 'CANDIDATES');
  const selectionResponse = await post(server, '/api/location/resolve', {
    candidateId: search.candidates[0].candidateId, locale: 'en'
  });
  assert.equal(selectionResponse.status, 200);
  const selection = await selectionResponse.json();
  assert.equal(selection.state, 'RESOLVED');
  const timeResponse = await post(server, '/api/dev/chart/resolve-time', {
    civilTime: {
      localDate: '2000-01-01',
      localTime: '12:00',
      calendar: 'ISO_8601_GREGORIAN',
      precision: 'MINUTE'
    },
    location: {
      resolutionId: selection.location.resolutionId,
      coordinates: selection.location.coordinates,
      ianaTimeZone: selection.location.ianaTimeZone
    },
    disambiguation: 'REJECT',
    expectedTimezoneDatabaseVersion: null
  });
  assert.equal(timeResponse.status, 200);
  const time = await timeResponse.json();
  assert.equal(time.outcome, 'VERIFIED');
  const chartRequest = {
    birth: {
      localDate: '2000-01-01',
      localTime: '12:00',
      locationLabel: selection.location.canonicalDisplayName,
      locationResolutionId: selection.location.resolutionId,
      latitude: selection.location.coordinates.latitude,
      longitude: selection.location.coordinates.longitude,
      ianaTimeZone: selection.location.ianaTimeZone,
      resolvedUtcInstant: time.resolution.resolvedUtcInstant,
      utcOffsetSeconds: time.resolution.utcOffsetSeconds,
      timezoneDatabaseVersion: time.authority.timezoneDatabaseVersion,
      timezoneResolutionMethod: time.authority.profileId,
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'Placidus'
  };
  const response = await post(server, '/api/dev/chart/calculate', { chart: chartRequest });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.receipt.chart.bodies.length, 10);
  assert.equal(payload.receipt.chart.angles.length, 2);
  assert.equal(payload.receipt.chart.houses.cusps.length, 12);
  assert.equal(payload.receipt.execution.runtimeIdentity, HTTP_RUNTIME_IDENTITY);
  assert.equal(payload.receipt.execution.status, 'RESEARCH_ONLY');
  assert.equal(payload.receipt.execution.provenance, 'INCOMPLETE_RESEARCH');
  assert.equal(payload.receipt.assessment.providerScientificAdmission, 'NOT_ADMITTED');
  assert.equal(payload.receipt.assessment.productionResultCertification, 'NOT_CERTIFIED');
  assert.equal(serviceCalls, 1);
  assert.equal(syntheticFallbackCalls, 0);
  assert.equal(readEvidence('bff-http-request-1').dispatchChannel, 'BFF_HTTP');
  assert.equal(readEvidence('bff-http-request-1').browserSubmission, false);
  assert.equal(readEvidence('bff-http-response-1').status, 200);
  assert.equal(readEvidence('budget-consumed').consumed, true);
  assert.throws(() => readEvidence('browser-request-1'), /ENOENT/);

  const replay = await post(server, '/api/dev/chart/calculate', { chart: chartRequest });
  assert.notEqual(replay.status, 200);
  assert.equal(serviceCalls, 1, 'A repeated HTTP submission never reaches the Engine transport.');
  assert.equal(syntheticFallbackCalls, 0);
  evidence.close(['simulated HTTP BFF integration complete']);
  evidenceClosed = true;
  assert.equal(readEvidence('closed').bffHttpSubmissions, 1);
  assert.equal(readEvidence('closed').browserRequests, 0);
  assert.equal(readEvidence('closed').engineRequests, 1);
});

test('archived R5 browser fixture is context-bound, visibly non-executing, and preserves historical provenance', async (context) => {
  let engineCalls = 0;
  const harness = await createArchivedFixtureHarness({ onEngineCall() { engineCalls += 1; } });
  context.after(() => harness.server.close());

  const candidates = await post(harness.server, '/api/location/search', { query: 'Greenwich', locale: 'en' });
  assert.equal(candidates.status, 200);
  const candidatePayload = await candidates.json();
  assert.equal(candidatePayload.state, 'CANDIDATES');
  assert.equal(candidatePayload.candidates[0].coordinates.latitude, R5_CHART.input.latitude);
  assert.equal(candidatePayload.candidates[0].coordinates.longitude, R5_CHART.input.longitude);
  assert.equal(candidatePayload.candidates[0].authority.sourceId, 'archived-r5-browser-fixture');

  const chartRequest = r5BrowserChartRequest(harness.timeAuthority, ARCHIVED_R5_FIXTURE_LOCATION);
  const response = await post(harness.server, '/api/dev/chart/calculate', { chart: chartRequest });
  assert.equal(response.status, 200);
  const responseText = await response.text();
  assert.equal(responseText.includes('C:\\NatalNode'), false, 'Machine-local source paths are not returned.');
  const payload = JSON.parse(responseText);
  assert.deepEqual(payload.fixture, {
    id: 'NN-ENGINE-REAL-J2000-CHART-R5-001',
    classification: 'ARCHIVED_RESEARCH_FIXTURE',
    calculationPerformed: false,
    locationResolution: 'FIXTURE_ONLY_NO_GEONAMES'
  });
  assert.equal(payload.receipt.assessment.dataClassification, 'ENGINEERING TEST DATA');
  assert.equal(payload.receipt.assessment.astronomicalStatus, 'NOT REAL ASTRONOMICAL OUTPUT');
  assert.equal(payload.receipt.chart.bodies.length, 10);
  assert.equal(payload.receipt.chart.angles.length, 2);
  assert.equal(payload.receipt.chart.houses.cusps.length, 12);
  assert.equal(payload.receipt.chart.aspects.length, R5_CHART.aspects.length);
  assert.equal(payload.receipt.source.engineResult.provider.id, R5_CHART.provider.id);
  assert.deepEqual(payload.receipt.source.engineResult.metadata.provenance, R5_CHART.metadata.provenance);
  assert.equal(engineCalls, 0, 'Neither the Engine Provider nor synthetic Engine client is invoked.');

  const mismatchedRequest = r5BrowserChartRequest(harness.timeAuthority, ARCHIVED_R5_FIXTURE_LOCATION, '12:01');
  const mismatch = await post(harness.server, '/api/dev/chart/calculate', { chart: mismatchedRequest });
  assert.equal(mismatch.status, 422);
  assert.equal((await mismatch.json()).error.code, 'FIXTURE_CONTEXT_MISMATCH');
  assert.equal(engineCalls, 0);
});

test('real research BFF preserves Engine busy status and never falls back to the synthetic client', async (context) => {
  let syntheticFallbackCalls = 0;
  const harness = await createResearchHarness({
    fetchImplementation: async () => new Response(JSON.stringify({ error: 'CALCULATION_BUSY' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }),
    onSyntheticFallback() { syntheticFallbackCalls += 1; }
  });
  context.after(() => harness.server.close());

  const response = await post(harness.server, '/api/dev/chart/calculate', {
    chart: r5BrowserChartRequest(harness.timeAuthority)
  });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, 'CALCULATION_BUSY');
  assert.equal(syntheticFallbackCalls, 0);
  const replay = await post(harness.server, '/api/dev/chart/calculate', {
    chart: r5BrowserChartRequest(harness.timeAuthority)
  });
  assert.equal(replay.status, 409);
  assert.equal(harness.serviceCalls(), 1, 'An unsuccessful forwarded request is still consumed.');
});

test('real research BFF atomically rejects a concurrent submission before a second forward', async (context) => {
  let finish;
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  const harness = await createResearchHarness({ fetchImplementation: async () => {
    markStarted();
    return new Promise((resolve) => {
      finish = () => resolve(new Response(JSON.stringify({ chart: R5_CHART, execution: RESEARCH_EXECUTION }), {
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  } });
  context.after(() => harness.server.close());
  const body = { chart: r5BrowserChartRequest(harness.timeAuthority) };
  const first = post(harness.server, '/api/dev/chart/calculate', body);
  await started;
  const second = await post(harness.server, '/api/dev/chart/calculate', body);
  assert.equal(second.status, 409);
  assert.equal(harness.serviceCalls(), 1);
  finish();
  assert.equal((await first).status, 200);
});

test('real research BFF rejects stale canonical location claims before making a service call', async (context) => {
  let serviceCalls = 0;
  const harness = await createResearchHarness({
    fetchImplementation: async () => {
      serviceCalls += 1;
      return new Response(JSON.stringify({ chart: R5_CHART, execution: RESEARCH_EXECUTION }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  });
  context.after(() => harness.server.close());

  const chart = r5BrowserChartRequest(harness.timeAuthority);
  chart.birth.longitude = -0.1278;
  const response = await post(harness.server, '/api/dev/chart/calculate', { chart });
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error.code, 'LOCATION_BINDING_MISMATCH');
  assert.equal(serviceCalls, 0);
});

test('browser request cancellation reaches the private service fetch signal', async (context) => {
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  let markOutboundAborted;
  const outboundAbort = new Promise((resolve) => { markOutboundAborted = resolve; });
  let outboundAborted = false;
  const harness = await createResearchHarness({
    fetchImplementation: async (_url, init) => new Promise((_resolve, reject) => {
      markStarted();
      init.signal.addEventListener('abort', () => {
        outboundAborted = true;
        markOutboundAborted();
        reject(new Error('private transport detail'));
      }, { once: true });
    })
  });
  context.after(() => harness.server.close());

  const controller = new AbortController();
  const request = fetch(`${harness.server.origin}/api/dev/chart/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify({ chart: r5BrowserChartRequest(harness.timeAuthority) }),
    signal: controller.signal
  }).catch(() => null);
  await started;
  controller.abort();
  await request;
  let timeout;
  try {
    await Promise.race([
      outboundAbort,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('BFF did not propagate request cancellation.')), 2_000);
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
  assert.equal(outboundAborted, true);
});
