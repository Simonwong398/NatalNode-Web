import assert from 'node:assert/strict';
import test from 'node:test';
import { createBirthTimeResolutionService } from '../dist/time-resolution/index.js';
import { ProviderLocationResolutionService } from '../dist/location-resolution/location-resolution-service.js';
import { createLocalBrowserChartBffApp } from './support/local-browser-chart-bff.mjs';
import { startLoopbackHonoServer } from './support/private-engine-http-adapter.mjs';

const WEB_ORIGIN = 'http://127.0.0.1:4321';
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
