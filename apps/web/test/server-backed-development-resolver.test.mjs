import assert from 'node:assert/strict';
import test from 'node:test';
import { ServerBackedDevelopmentBirthInputResolver } from '../dist/server-backed-development-resolver-characterization/features/chart-input/server-backed-development-resolver.js';

const LOCATION = Object.freeze({
  resolutionId: 'geonames-london-2643743',
  canonicalDisplayName: 'London, England, United Kingdom',
  locality: 'London',
  region: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  coordinates: Object.freeze({ latitude: 51.5074, longitude: -0.1278 }),
  ianaTimeZone: 'Europe/London',
  status: 'RESOLVED',
  authority: Object.freeze({ kind: 'GEOCODING', sourceId: 'geonames', recordId: '2643743' }),
  source: Object.freeze({ sourceVersion: 'test', datasetVersion: null })
});

const DRAFT = Object.freeze({
  localDate: '2025-10-22',
  localTime: '10:52',
  locationLabel: 'London',
  latitude: null,
  longitude: null,
  ianaTimeZone: null,
  resolvedUtcInstant: null,
  utcOffsetSeconds: null,
  timezoneDatabaseVersion: null,
  timezoneResolutionMethod: null,
  ambiguityStatus: 'UNRESOLVED',
  houseSystem: 'Placidus'
});

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const authority = Object.freeze({
  timezoneDatabaseVersion: '2026e',
  profileId: 'NN_WEB_CIVIL_TIME_JS_JODA_6.3.0_TZ_3.1.0_FULL_2026e_1970_2100_V1'
});

test('resolver sends only the selected canonical place and accepts server-owned UTC fields', async () => {
  let captured;
  const resolver = new ServerBackedDevelopmentBirthInputResolver(async (url, init) => {
    captured = { url, init };
    return response({
      outcome: 'VERIFIED',
      authority,
      resolution: {
        resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
        utcOffsetSeconds: 3_600
      }
    });
  });

  const result = await resolver.resolve(DRAFT, LOCATION);
  assert.equal(captured.url, '/api/dev/chart/resolve-time');
  assert.equal(captured.init.method, 'POST');
  assert.deepEqual(JSON.parse(captured.init.body), {
    civilTime: {
      localDate: '2025-10-22',
      localTime: '10:52',
      calendar: 'ISO_8601_GREGORIAN',
      precision: 'MINUTE'
    },
    location: {
      resolutionId: LOCATION.resolutionId,
      coordinates: LOCATION.coordinates,
      ianaTimeZone: 'Europe/London'
    },
    disambiguation: 'REJECT',
    expectedTimezoneDatabaseVersion: null
  });
  assert.deepEqual(result, {
    localDate: '2025-10-22',
    localTime: '10:52',
    locationLabel: LOCATION.canonicalDisplayName,
    latitude: 51.5074,
    longitude: -0.1278,
    ianaTimeZone: 'Europe/London',
    timezoneDatabaseVersion: '2026e',
    timezoneResolutionMethod: authority.profileId,
    resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
    utcOffsetSeconds: 3_600,
    ambiguityStatus: 'EXACT'
  });
});

test('resolver binds the native fetch receiver to globalThis', async () => {
  let receiver;
  const resolver = new ServerBackedDevelopmentBirthInputResolver(function () {
    receiver = this;
    return response({ outcome: 'VERIFIED', authority, resolution: {
      resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
      utcOffsetSeconds: 3_600
    } });
  });

  await resolver.resolve(DRAFT, LOCATION);
  assert.equal(receiver, globalThis);
});

test('resolver refuses missing canonical selection instead of inventing coordinates or time', async () => {
  let called = false;
  const resolver = new ServerBackedDevelopmentBirthInputResolver(async () => {
    called = true;
    return response({});
  });
  await assert.rejects(resolver.resolve(DRAFT, null), /canonical birthplace/u);
  assert.equal(called, false);
});

test('server ambiguity, nonexistent time, and unknown time remain distinct outcomes', async () => {
  const ambiguous = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    outcome: 'REJECTED',
    authority,
    error: {
      code: 'AMBIGUOUS_LOCAL_TIME',
      candidates: [
        { occurrence: 'EARLIER', resolvedUtcInstant: '2025-10-26T00:30:00.000Z', utcOffsetSeconds: 3_600 },
        { occurrence: 'LATER', resolvedUtcInstant: '2025-10-26T01:30:00.000Z', utcOffsetSeconds: 0 }
      ]
    }
  }, 422));
  assert.equal((await ambiguous.resolve({ ...DRAFT, localDate: '2025-10-26', localTime: '01:30' }, LOCATION)).ambiguityStatus, 'AMBIGUOUS');

  const nonexistent = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    outcome: 'REJECTED', authority, error: { code: 'NONEXISTENT_LOCAL_TIME', field: 'localTime' }
  }, 422));
  assert.equal((await nonexistent.resolve({ ...DRAFT, localDate: '2025-03-30', localTime: '01:30' }, LOCATION)).ambiguityStatus, 'NONEXISTENT');

  const unknown = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    outcome: 'REJECTED', authority, error: { code: 'UNKNOWN_BIRTH_TIME', field: 'localTime' }
  }, 422));
  const unknownResult = await unknown.resolve({ ...DRAFT, localTime: null }, LOCATION);
  assert.equal(unknownResult.ambiguityStatus, 'UNKNOWN_TIME');
  assert.equal(unknownResult.resolvedUtcInstant, null);
});

test('unavailable or malformed BFF responses fail closed', async () => {
  const unavailable = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    outcome: 'REJECTED', authority, error: { code: 'LOCATION_RESOLUTION_UNAVAILABLE' }
  }, 503));
  await assert.rejects(
    unavailable.resolve(DRAFT, LOCATION),
    /LOCATION_RESOLUTION_UNAVAILABLE/u
  );

  const malformed = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    outcome: 'VERIFIED',
    authority,
    resolution: { resolvedUtcInstant: 'not-a-utc-instant', utcOffsetSeconds: 0 }
  }));
  await assert.rejects(malformed.resolve(DRAFT, LOCATION), /response was invalid/u);
});

test('resolver exposes only a bounded BFF error code for rejected or unreachable requests', async () => {
  const rejected = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    error: { code: 'SAME_ORIGIN_REQUIRED', message: 'do not expose this server message' }
  }, 403));
  await assert.rejects(rejected.resolve(DRAFT, LOCATION), (error) => {
    assert.match(error.message, /SAME_ORIGIN_REQUIRED/u);
    assert.doesNotMatch(error.message, /do not expose/u);
    return true;
  });

  const unreachable = new ServerBackedDevelopmentBirthInputResolver(async () => {
    throw new TypeError('sensitive transport detail');
  });
  await assert.rejects(unreachable.resolve(DRAFT, LOCATION), (error) => {
    assert.match(error.message, /could not be reached/u);
    assert.doesNotMatch(error.message, /sensitive transport detail/u);
    return true;
  });
});
