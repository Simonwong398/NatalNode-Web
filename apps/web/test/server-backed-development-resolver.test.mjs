import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ServerBackedBirthInputResolver,
  ServerBackedDevelopmentBirthInputResolver
} from '../dist/server-backed-development-resolver-characterization/features/chart-input/server-backed-development-resolver.js';

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

const evidence = Object.freeze({
  schemaVersion: '1',
  authority: {
    policyId: 'NATALNODE_WEB_CIVIL_TIME_V1',
    profileId: authority.profileId,
    implementation: 'JS_JODA_PACKAGED_TZDB',
    coreVersion: '6.3.0',
    timezonePackageVersion: '3.1.0',
    timezoneDatabaseVersion: '2026e',
    bundle: 'FULL',
    rulesArtifactSha256: '38e0555a127a04afa0e357bd95cd1a4e7271dd722a547f297aaffd071f90404d',
    coveragePolicyId: 'IANA_1970_2100_V1',
    minimumLocalDate: '1970-01-01',
    maximumLocalDate: '2100-12-31',
    minimumUtcInclusive: '1970-01-01T00:00:00.000Z',
    maximumUtcExclusive: '2101-01-01T00:00:00.000Z'
  },
  civilTime: {
    localDate: DRAFT.localDate,
    localTime: DRAFT.localTime,
    calendar: 'ISO_8601_GREGORIAN',
    precision: 'MINUTE'
  },
  location: {
    resolutionId: LOCATION.resolutionId,
    coordinates: LOCATION.coordinates,
    ianaTimeZone: LOCATION.ianaTimeZone,
    authority: LOCATION.authority,
    source: LOCATION.source
  },
  resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
  utcOffsetSeconds: 3_600,
  selection: { kind: 'UNAMBIGUOUS' }
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

test('guest resolver uses the public BFF contract and preserves validated authority evidence', async () => {
  let captured;
  const resolver = new ServerBackedBirthInputResolver(async (url, init) => {
    captured = { url, init };
    return response({ outcome: 'VERIFIED', evidence });
  });

  const result = await resolver.resolve(DRAFT, LOCATION);
  assert.equal(captured.url, '/api/birth-time/resolve');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.credentials, 'same-origin');
  assert.equal(captured.init.cache, 'no-store');
  assert.equal(Object.hasOwn(captured.init.headers, 'Authorization'), false);
  assert.deepEqual(JSON.parse(captured.init.body), {
    civilTime: {
      localDate: DRAFT.localDate,
      localTime: DRAFT.localTime,
      calendar: 'ISO_8601_GREGORIAN',
      precision: 'MINUTE'
    },
    location: {
      resolutionId: LOCATION.resolutionId,
      coordinates: LOCATION.coordinates,
      ianaTimeZone: LOCATION.ianaTimeZone
    },
    disambiguation: 'REJECT',
    expectedTimezoneDatabaseVersion: null
  });
  assert.equal(result.resolvedUtcInstant, '2025-10-22T09:52:00.000Z');
  assert.deepEqual(result.timeResolutionEvidence, evidence);
  assert.equal(result.timezoneDatabaseVersion, '2026e');
  assert.equal(result.timezoneResolutionMethod, authority.profileId);
});

test('guest resolver rejects evidence bound to another location or timezone-rule version', async () => {
  const wrongLocation = new ServerBackedBirthInputResolver(async () => response({
    outcome: 'VERIFIED',
    evidence: {
      ...evidence,
      location: { ...evidence.location, resolutionId: 'stale-place' }
    }
  }));
  await assert.rejects(
    wrongLocation.resolve(DRAFT, LOCATION),
    (error) => error.code === 'INVALID_TIME_RESOLUTION_RESPONSE'
  );

  const matchingEvidence = new ServerBackedBirthInputResolver(async () => response({
    outcome: 'VERIFIED', evidence
  }));
  await assert.rejects(
    matchingEvidence.resolve(DRAFT, LOCATION, {
      disambiguation: 'REJECT',
      expectedTimezoneDatabaseVersion: '2026d'
    }),
    (error) => error.code === 'INVALID_TIME_RESOLUTION_RESPONSE'
  );
});

test('guest overlap candidates follow the public ordered UTC contract and choices are verified again', async () => {
  const candidates = [
    { resolvedUtcInstant: '2025-10-26T00:30:00.000Z', utcOffsetSeconds: 3_600 },
    { resolvedUtcInstant: '2025-10-26T01:30:00.000Z', utcOffsetSeconds: 0 }
  ];
  const draft = { ...DRAFT, localDate: '2025-10-26', localTime: '01:30' };
  const requests = [];
  const resolver = new ServerBackedBirthInputResolver(async (_url, init) => {
    const request = JSON.parse(init.body);
    requests.push(request);
    if (request.disambiguation === 'REJECT') {
      return response({
        outcome: 'REJECTED',
        authority: evidence.authority,
        error: {
          code: 'AMBIGUOUS_LOCAL_TIME', field: 'localTime',
          candidates, timezoneDatabaseVersion: '2026e'
        }
      }, 422);
    }
    const selected = candidates[request.disambiguation === 'EARLIER' ? 0 : 1];
    return response({
      outcome: 'VERIFIED',
      evidence: {
        ...evidence,
        civilTime: { ...evidence.civilTime, localDate: draft.localDate, localTime: draft.localTime },
        ...selected,
        selection: {
          kind: 'USER_DISAMBIGUATED_OVERLAP',
          occurrence: request.disambiguation,
          candidates
        }
      }
    });
  });
  const ambiguous = await resolver.resolve(draft, LOCATION);
  assert.equal(ambiguous.ambiguityStatus, 'AMBIGUOUS');
  assert.deepEqual(ambiguous.candidates, candidates.map((candidate, index) => ({
    ...candidate, occurrence: index === 0 ? 'EARLIER' : 'LATER'
  })));
  for (const [index, occurrence] of ['EARLIER', 'LATER'].entries()) {
    const selected = await resolver.resolve(draft, LOCATION, {
      disambiguation: occurrence,
      expectedTimezoneDatabaseVersion: ambiguous.timezoneDatabaseVersion
    });
    assert.equal(selected.ambiguityStatus, 'EXACT');
    assert.equal(selected.resolvedUtcInstant, candidates[index].resolvedUtcInstant);
    assert.equal(selected.timeResolutionEvidence.selection.occurrence, occurrence);
    assert.deepEqual(selected.timeResolutionEvidence.selection.candidates, candidates);
    assert.equal(requests[index + 1].expectedTimezoneDatabaseVersion, '2026e');
  }
});

test('guest verification rejects the legacy development-only success envelope', async () => {
  const resolver = new ServerBackedBirthInputResolver(async () => response({
    outcome: 'VERIFIED', authority,
    resolution: { resolvedUtcInstant: evidence.resolvedUtcInstant, utcOffsetSeconds: 3_600 }
  }));
  await assert.rejects(
    resolver.resolve(DRAFT, LOCATION),
    (error) => error.code === 'INVALID_TIME_RESOLUTION_RESPONSE'
  );
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
    (error) => error.code === 'LOCATION_RESOLUTION_UNAVAILABLE'
  );

  const malformed = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    outcome: 'VERIFIED',
    authority,
    resolution: { resolvedUtcInstant: 'not-a-utc-instant', utcOffsetSeconds: 0 }
  }));
  await assert.rejects(
    malformed.resolve(DRAFT, LOCATION),
    (error) => error.code === 'INVALID_TIME_RESOLUTION_RESPONSE'
  );
});

test('resolver exposes only a bounded BFF problem code for rejected or unreachable requests', async () => {
  const rejected = new ServerBackedDevelopmentBirthInputResolver(async () => response({
    code: 'SAME_ORIGIN_REQUIRED',
    detail: 'do not expose this server message'
  }, 403));
  await assert.rejects(rejected.resolve(DRAFT, LOCATION), (error) => {
    assert.equal(error.code, 'SAME_ORIGIN_REQUIRED');
    assert.doesNotMatch(error.message, /do not expose/u);
    return true;
  });

  const unreachable = new ServerBackedDevelopmentBirthInputResolver(async () => {
    throw new TypeError('sensitive transport detail');
  });
  await assert.rejects(unreachable.resolve(DRAFT, LOCATION), (error) => {
    assert.equal(error.code, 'TIME_AUTHORITY_UNAVAILABLE');
    assert.doesNotMatch(error.message, /sensitive transport detail/u);
    return true;
  });
});
