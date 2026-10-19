import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import { CIVIL_TIME_AUTHORITY_PROFILE } from '../dist/time-resolution/civil-time-profile.js';
import { createPublicDevelopmentDependencies } from '../dist/executable/public-development-dependencies.js';
import { createBirthTimeResolutionService } from '../dist/time-resolution/index.js';

const ORIGIN = 'http://localhost:4321';
const INPUT = Object.freeze({
  civilTime: {
    localDate: '2025-10-22',
    localTime: '10:52',
    calendar: 'ISO_8601_GREGORIAN',
    precision: 'MINUTE'
  },
  location: {
    resolutionId: 'geonames-london-2643743',
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    ianaTimeZone: 'Europe/London'
  },
  disambiguation: 'REJECT',
  expectedTimezoneDatabaseVersion: null
});

const EVIDENCE = Object.freeze({
  schemaVersion: '1',
  authority: CIVIL_TIME_AUTHORITY_PROFILE,
  civilTime: {
    localDate: '2025-10-22',
    localTime: '10:52',
    calendar: 'ISO_8601_GREGORIAN',
    precision: 'MINUTE'
  },
  location: {
    resolutionId: INPUT.location.resolutionId,
    coordinates: INPUT.location.coordinates,
    ianaTimeZone: INPUT.location.ianaTimeZone,
    authority: { kind: 'GEOCODING', sourceId: 'geonames', recordId: '2643743' },
    source: { sourceVersion: 'test-v1', datasetVersion: null }
  },
  resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
  utcOffsetSeconds: 3_600,
  selection: { kind: 'UNAMBIGUOUS' }
});

function createDependencies(overrides = {}) {
  return createPublicDevelopmentDependencies({ NODE_ENV: 'test', ...overrides });
}

function post(app, body, { origin = ORIGIN, contentType = 'application/json' } = {}) {
  return app.request('/api/birth-time/resolve', {
    method: 'POST',
    headers: {
      ...(origin === null ? {} : { Origin: origin }),
      'Content-Type': contentType
    },
    body
  });
}

test('guest time route returns server-issued evidence and logs endpoint metadata only', async () => {
  const calls = [];
  const records = [];
  const dependencies = createDependencies();
  dependencies.birthTimeResolutionService = {
    profile: CIVIL_TIME_AUTHORITY_PROFILE,
    resolve(input) {
      calls.push(input);
      return { outcome: 'VERIFIED', value: EVIDENCE };
    }
  };
  const app = createApp(dependencies, {
    observabilitySink: { write(record) { records.push(record); } }
  });

  const response = await post(app, JSON.stringify(INPUT));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { outcome: 'VERIFIED', evidence: EVIDENCE });
  assert.deepEqual(calls, [INPUT]);
  assert.equal(records.length, 1);
  assert.equal(records[0].endpointFamily, 'birth-time.resolve');
  assert.doesNotMatch(JSON.stringify(records), /2025-10-22|10:52|51\.5074|Europe\/London/u);
});

test('guest time route inherits exact same-origin protection before authority dispatch', async () => {
  let called = false;
  const dependencies = createDependencies();
  dependencies.birthTimeResolutionService = {
    profile: CIVIL_TIME_AUTHORITY_PROFILE,
    resolve() {
      called = true;
      return { outcome: 'VERIFIED', value: EVIDENCE };
    }
  };
  const app = createApp(dependencies);

  const response = await post(app, JSON.stringify(INPUT), { origin: 'https://attacker.invalid' });
  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test('guest time route rejects oversized payloads and fails closed without a configured authority', async () => {
  const app = createApp(createDependencies());

  const oversized = await post(app, JSON.stringify({ value: 'x'.repeat(5_000) }));
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).code, 'PAYLOAD_TOO_LARGE');

  const unavailable = await post(app, JSON.stringify(INPUT));
  assert.equal(unavailable.status, 503);
  const payload = await unavailable.json();
  assert.equal(payload.outcome, 'REJECTED');
  assert.equal(payload.error.code, 'TIME_AUTHORITY_UNAVAILABLE');
});

test('time endpoint shares the established bounded location-resolution rate policy', async () => {
  const { selectP0StagingRateLimitPolicy, P0_STAGING_RATE_LIMIT_POLICIES } =
    await import('../dist/app/security/api-rate-limiting.js');
  assert.deepEqual(
    selectP0StagingRateLimitPolicy('POST', '/api/birth-time/resolve'),
    P0_STAGING_RATE_LIMIT_POLICIES.locationResolve
  );
});

test('guest BFF serializes the actual civil-time authority for unique, gap, overlap and unknown-time inputs', async () => {
  // Isolated canonical-owner fixture; no GeoNames or astronomy request is made.
  const canonical = {
    ...EVIDENCE.location,
    canonicalDisplayName: 'London, England, United Kingdom',
    locality: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB',
    status: 'RESOLVED'
  };
  const dependencies = createDependencies();
  dependencies.birthTimeResolutionService = createBirthTimeResolutionService({
    locationResolutionService: {
      getResolvedLocation(id) { return id === canonical.resolutionId ? canonical : null; }
    }
  });
  dependencies.engineClient.calculateChart = () => assert.fail('Time verification must not calculate a chart');
  dependencies.persistence.vaultCharts.create = () => assert.fail('Guest birth details must not be persisted');
  const app = createApp(dependencies, { observabilitySink: { write() {} } });
  const unique = await post(app, JSON.stringify(INPUT));
  assert.equal(unique.status, 200);
  const uniquePayload = await unique.json();
  assert.equal(uniquePayload.evidence.resolvedUtcInstant, '2025-10-22T09:52:00.000Z');
  assert.deepEqual(uniquePayload.evidence.location, EVIDENCE.location);

  const overlap = {
    ...INPUT, civilTime: { ...INPUT.civilTime, localDate: '2025-10-26', localTime: '01:30' }
  };
  const ambiguous = await post(app, JSON.stringify(overlap));
  assert.equal(ambiguous.status, 422);
  const error = (await ambiguous.json()).error;
  assert.equal(error.code, 'AMBIGUOUS_LOCAL_TIME');
  assert.deepEqual(error.candidates, [
    { resolvedUtcInstant: '2025-10-26T00:30:00.000Z', utcOffsetSeconds: 3_600 },
    { resolvedUtcInstant: '2025-10-26T01:30:00.000Z', utcOffsetSeconds: 0 }
  ]);
  const chosen = await post(app, JSON.stringify({
    ...overlap, disambiguation: 'LATER', expectedTimezoneDatabaseVersion: error.timezoneDatabaseVersion
  }));
  assert.equal(chosen.status, 200);
  assert.equal((await chosen.json()).evidence.resolvedUtcInstant, '2025-10-26T01:30:00.000Z');

  for (const [civilTime, code] of [
    [{ ...INPUT.civilTime, localDate: '2025-03-30', localTime: '01:30' }, 'NONEXISTENT_LOCAL_TIME'],
    [{ ...INPUT.civilTime, localTime: null }, 'UNKNOWN_BIRTH_TIME']
  ]) {
    const rejected = await post(app, JSON.stringify({ ...INPUT, civilTime }));
    assert.equal(rejected.status, 422);
    const payload = await rejected.json();
    assert.equal(payload.error.code, code);
    assert.equal('evidence' in payload, false);
  }
  const forged = await post(app, JSON.stringify({ ...INPUT, evidence: EVIDENCE }));
  assert.equal((await forged.json()).error.code, 'CLIENT_TIME_AUTHORITY_FORBIDDEN');
  const devRoute = await app.request('/api/dev/chart/resolve-time', {
    method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify(INPUT)
  });
  assert.equal(devRoute.status, 404);
});
