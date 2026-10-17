import assert from 'node:assert/strict';
import test from 'node:test';

import {
  prepareEngineCalculationRequest
} from '../dist/engine-request-adapter/engine-request-adapter.js';
import {
  assertVerifiedUtcInstant,
  CIVIL_TIME_AUTHORITY_PROFILE,
  createBirthTimeResolutionService
} from '../dist/time-resolution/index.js';
import { ProviderLocationResolutionService } from '../dist/location-resolution/location-resolution-service.js';

const GREENWICH = Object.freeze({
  resolutionId: 'london-greenwich',
  canonicalDisplayName: 'London, United Kingdom',
  locality: 'London',
  region: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  coordinates: Object.freeze({ latitude: 51.4779, longitude: -0.0015 }),
  ianaTimeZone: 'Europe/London',
  status: 'RESOLVED',
  authority: Object.freeze({ kind: 'GEOCODING', sourceId: 'isolated-adapter-test', recordId: 'london-greenwich' }),
  source: Object.freeze({ sourceVersion: 'isolated-fixture-v1', datasetVersion: null,
    attribution: Object.freeze({ label: 'Isolated engineering fixture', url: 'https://natalnode.test/location' }) })
});

const LONDON_CENTRE = Object.freeze({
  ...GREENWICH,
  resolutionId: 'london-centre',
  coordinates: Object.freeze({ latitude: 51.5074, longitude: -0.1278 }),
  authority: Object.freeze({ kind: 'GEOCODING', sourceId: 'isolated-adapter-test', recordId: 'london-centre' })
});

function birthRequest(location = GREENWICH, overrides = {}) {
  return {
    localDate: '2025-10-22',
    localTime: '10:52',
    locationLabel: location.canonicalDisplayName,
    locationResolutionId: location.resolutionId,
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude,
    ianaTimeZone: location.ianaTimeZone,
    resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
    utcOffsetSeconds: 3_600,
    timezoneDatabaseVersion: CIVIL_TIME_AUTHORITY_PROFILE.timezoneDatabaseVersion,
    timezoneResolutionMethod: CIVIL_TIME_AUTHORITY_PROFILE.profileId,
    ambiguityStatus: 'EXACT',
    ...overrides
  };
}

function chartRequest(location = GREENWICH, overrides = {}) {
  return {
    birth: birthRequest(location, overrides.birth),
    houseSystem: overrides.houseSystem ?? 'Placidus',
    ...(overrides.extra === undefined ? {} : overrides.extra)
  };
}

async function createHarness(locations = [GREENWICH, LONDON_CENTRE]) {
  const provider = {
    async search(query) {
      return locations.filter((location) => location.resolutionId === query).map((location) => ({
        candidateId: location.resolutionId,
        canonicalDisplayName: location.canonicalDisplayName,
        locality: location.locality,
        region: location.region,
        country: location.country,
        countryCode: location.countryCode,
        coordinates: location.coordinates,
        authority: location.authority,
        source: location.source
      }));
    },
    async resolve(candidateId) {
      return locations.find((location) => location.resolutionId === candidateId) ?? null;
    }
  };
  const locationOwner = new ProviderLocationResolutionService(provider);
  for (const location of locations) {
    const candidates = await locationOwner.search({ query: location.resolutionId, locale: 'en' });
    assert.equal(candidates.state, 'CANDIDATES');
    assert.equal((await locationOwner.resolve({
      candidateId: candidates.candidates[0].candidateId,
      locale: 'en'
    })).state, 'RESOLVED');
  }
  let resolutionCalls = 0;
  const authority = createBirthTimeResolutionService({ locationResolutionService: {
    getResolvedLocation(id) {
      resolutionCalls += 1;
      return locationOwner.getResolvedLocation(id);
    }
  } });
  return { authority, resolutionCalls: () => resolutionCalls };
}

function assertRejected(result, code) {
  assert.equal(result.outcome, 'REJECTED', JSON.stringify(result));
  assert.equal(result.error.code, code);
  assert.equal('request' in result, false);
  return result.error;
}

test('verified London birth input maps only proof-backed fields to Engine public input', async () => {
  const { authority, resolutionCalls } = await createHarness();
  const prepared = prepareEngineCalculationRequest(chartRequest(), authority);

  assert.equal(prepared.outcome, 'READY');
  assert.doesNotThrow(() => assertVerifiedUtcInstant(prepared.verifiedTime));
  assert.equal(prepared.verifiedTime.resolvedUtcInstant, '2025-10-22T09:52:00.000Z');
  assert.deepEqual(prepared.request, {
    input: {
      instant: '2025-10-22T09:52:00.000Z',
      latitude: 51.4779,
      longitude: -0.0015
    },
    options: { houseSystem: 'placidus' }
  });
  assert.equal(resolutionCalls(), 1, 'Every calculation preparation reads current canonical state.');
  assert.equal(Object.hasOwn(prepared.request.options, 'zodiac'), false);
  assert.equal(Object.hasOwn(prepared.request.options, 'orbProfile'), false);
  assert.equal(Object.hasOwn(prepared.request.options, 'calculationMode'), false);
});

test('Greenwich and central London coordinates require and preserve their own canonical identities', async () => {
  const { authority } = await createHarness();
  const greenwich = prepareEngineCalculationRequest(chartRequest(GREENWICH), authority);
  const centre = prepareEngineCalculationRequest(chartRequest(LONDON_CENTRE), authority);

  assert.equal(greenwich.outcome, 'READY');
  assert.equal(centre.outcome, 'READY');
  assert.deepEqual(greenwich.request.input, {
    instant: '2025-10-22T09:52:00.000Z', latitude: 51.4779, longitude: -0.0015
  });
  assert.deepEqual(centre.request.input, {
    instant: '2025-10-22T09:52:00.000Z', latitude: 51.5074, longitude: -0.1278
  });

  const staleCoordinate = chartRequest(GREENWICH);
  staleCoordinate.birth.latitude = LONDON_CENTRE.coordinates.latitude;
  staleCoordinate.birth.longitude = LONDON_CENTRE.coordinates.longitude;
  assertRejected(prepareEngineCalculationRequest(staleCoordinate, authority), 'LOCATION_BINDING_MISMATCH');

  const wrongId = chartRequest(GREENWICH);
  wrongId.birth.locationResolutionId = 'stale-location-id';
  assertRejected(prepareEngineCalculationRequest(wrongId, authority), 'LOCATION_RESOLUTION_UNAVAILABLE');
});

test('only the three Web house systems map to Engine IDs', async () => {
  const { authority } = await createHarness();
  for (const [web, engine] of [
    ['Placidus', 'placidus'],
    ['Whole Sign', 'whole-sign'],
    ['Equal', 'equal']
  ]) {
    const prepared = prepareEngineCalculationRequest(chartRequest(GREENWICH, { houseSystem: web }), authority);
    assert.equal(prepared.outcome, 'READY');
    assert.equal(prepared.request.options.houseSystem, engine);
  }

  const unsupported = prepareEngineCalculationRequest(chartRequest(GREENWICH, { houseSystem: 'Koch' }), authority);
  assertRejected(unsupported, 'UNSUPPORTED_HOUSE_SYSTEM');
  assertRejected(prepareEngineCalculationRequest(chartRequest(GREENWICH, {
    extra: { calculationOptions: { zodiac: 'sidereal' } }
  }), authority), 'INVALID_REQUEST');
});

test('London DST gap and unselected overlap fail closed', async () => {
  const { authority } = await createHarness();
  const gap = chartRequest(GREENWICH, { birth: {
    localDate: '2025-03-30', localTime: '01:30', resolvedUtcInstant: null,
    utcOffsetSeconds: null, ambiguityStatus: 'NONEXISTENT'
  } });
  assertRejected(prepareEngineCalculationRequest(gap, authority), 'NONEXISTENT_LOCAL_TIME');

  const overlap = chartRequest(GREENWICH, { birth: {
    localDate: '2025-10-26', localTime: '01:30', resolvedUtcInstant: null,
    utcOffsetSeconds: null, ambiguityStatus: 'AMBIGUOUS'
  } });
  const error = assertRejected(prepareEngineCalculationRequest(overlap, authority), 'AMBIGUOUS_LOCAL_TIME');
  assert.deepEqual(error.candidates, [
    { resolvedUtcInstant: '2025-10-26T00:30:00.000Z', utcOffsetSeconds: 3_600 },
    { resolvedUtcInstant: '2025-10-26T01:30:00.000Z', utcOffsetSeconds: 0 }
  ]);
});

test('only a server candidate selected by the user resolves the London overlap', async () => {
  const { authority } = await createHarness();
  for (const [occurrence, instant, offset] of [
    ['EARLIER', '2025-10-26T00:30:00.000Z', 3_600],
    ['LATER', '2025-10-26T01:30:00.000Z', 0]
  ]) {
    const selected = chartRequest(GREENWICH, { birth: {
      localDate: '2025-10-26', localTime: '01:30', resolvedUtcInstant: instant,
      utcOffsetSeconds: offset, ambiguityStatus: 'EXACT'
    } });
    const prepared = prepareEngineCalculationRequest(selected, authority);
    assert.equal(prepared.outcome, 'READY');
    assert.equal(prepared.verifiedTime.selection.kind, 'USER_DISAMBIGUATED_OVERLAP');
    assert.equal(prepared.verifiedTime.selection.occurrence, occurrence);
    assert.equal(prepared.request.input.instant, instant);
  }

  const forged = chartRequest(GREENWICH, { birth: {
    localDate: '2025-10-26', localTime: '01:30',
    resolvedUtcInstant: '2025-10-26T08:00:00.000Z', utcOffsetSeconds: 0,
    ambiguityStatus: 'EXACT'
  } });
  assertRejected(prepareEngineCalculationRequest(forged, authority), 'CLIENT_TIME_CLAIM_MISMATCH');
});

test('invalid timezone, mismatched zone, fixture location, and unavailable identity are rejected', async () => {
  const { authority } = await createHarness();
  assertRejected(prepareEngineCalculationRequest(chartRequest(GREENWICH, {
    birth: { ianaTimeZone: 'Europe London' }
  }), authority), 'INVALID_TIME_ZONE');
  assertRejected(prepareEngineCalculationRequest(chartRequest(GREENWICH, {
    birth: { ianaTimeZone: 'America/New_York' }
  }), authority), 'LOCATION_BINDING_MISMATCH');

  const fixtureLocation = {
    ...GREENWICH,
    resolutionId: 'fixture-location',
    authority: { ...GREENWICH.authority, recordId: 'fixture-location' },
    source: { ...GREENWICH.source, sourceVersion: 'UI_DEVELOPMENT_ONLY' }
  };
  const fixtureHarness = await createHarness([fixtureLocation]);
  assertRejected(prepareEngineCalculationRequest(chartRequest(fixtureLocation), fixtureHarness.authority),
    'DEVELOPMENT_FIXTURE_REJECTED');

  const malformed = { ...chartRequest(), birth: { ...chartRequest().birth, locationResolutionId: undefined } };
  assertRejected(prepareEngineCalculationRequest(malformed, authority), 'LOCATION_RESOLUTION_REQUIRED');
});

test('forged UTC, method, tzdb metadata, and offsets cannot authorize Engine input', async () => {
  const { authority } = await createHarness();
  for (const overrides of [
    { resolvedUtcInstant: '2000-01-01T00:00:00.000Z' },
    { utcOffsetSeconds: 0 },
    { timezoneDatabaseVersion: '2026b' },
    { timezoneResolutionMethod: 'CLIENT_ASSERTED_VERIFIED' }
  ]) {
    assertRejected(prepareEngineCalculationRequest(chartRequest(GREENWICH, { birth: overrides }), authority),
      'CLIENT_TIME_CLAIM_MISMATCH');
  }

  const { value: verifiedTime } = authority.resolve({
    civilTime: { localDate: '2025-10-22', localTime: '10:52', calendar: 'ISO_8601_GREGORIAN', precision: 'MINUTE' },
    location: { resolutionId: GREENWICH.resolutionId, coordinates: GREENWICH.coordinates, ianaTimeZone: GREENWICH.ianaTimeZone },
    disambiguation: 'REJECT', expectedTimezoneDatabaseVersion: null
  });
  assert.equal(verifiedTime.resolvedUtcInstant, '2025-10-22T09:52:00.000Z');
  assert.throws(() => assertVerifiedUtcInstant(JSON.parse(JSON.stringify(verifiedTime))),
    (error) => error.code === 'UNVERIFIED_UTC_INSTANT');
  assert.throws(() => assertVerifiedUtcInstant(null),
    (error) => error.code === 'UNVERIFIED_UTC_INSTANT');
});

test('unknown time and unsupported historical range never produce an Engine request', async () => {
  const { authority } = await createHarness();
  const unknown = chartRequest(GREENWICH, { birth: {
    localTime: null, resolvedUtcInstant: null, utcOffsetSeconds: null,
    ambiguityStatus: 'UNKNOWN_TIME'
  } });
  assertRejected(prepareEngineCalculationRequest(unknown, authority), 'UNKNOWN_BIRTH_TIME');

  const unsupportedDate = chartRequest(GREENWICH, { birth: {
    localDate: '1969-12-31', resolvedUtcInstant: '1969-12-31T10:52:00.000Z'
  } });
  assertRejected(prepareEngineCalculationRequest(unsupportedDate, authority), 'UNSUPPORTED_TIME_RANGE');
});

test('fresh resolution is deterministic and the adapter does not mutate Web input', async () => {
  const { authority, resolutionCalls } = await createHarness();
  const request = chartRequest();
  const before = structuredClone(request);
  const first = prepareEngineCalculationRequest(request, authority);
  const second = prepareEngineCalculationRequest(request, authority);

  assert.deepEqual(first, second);
  assert.deepEqual(request, before);
  assert.equal(resolutionCalls(), 2);
});
