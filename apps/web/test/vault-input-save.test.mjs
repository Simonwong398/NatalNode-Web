import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL(
  '../dist/vault-input-save-characterization/features/vault/vault-input-authority.js',
  import.meta.url
);
const {
  canAttemptVaultInputSave,
  resolveVaultInputSaveEligibility
} = await import(moduleUrl.href);

const locationA = {
  resolutionId: 'location-a',
  canonicalDisplayName: 'Location A, United States',
  locality: 'Location A',
  region: null,
  country: 'United States',
  countryCode: 'US',
  coordinates: { latitude: 40.7128, longitude: -74.006 },
  ianaTimeZone: 'America/New_York',
  status: 'RESOLVED',
  authority: {
    kind: 'GEOCODING',
    sourceId: 'geonames-free-web-services',
    recordId: 'location-a'
  },
  source: {
    sourceVersion: 'geonames-free-web-services-v1',
    datasetVersion: null,
    attribution: null
  }
};

const locationB = {
  ...locationA,
  resolutionId: 'location-b',
  canonicalDisplayName: 'Shanghai, China',
  locality: 'Shanghai',
  country: 'China',
  countryCode: 'CN',
  coordinates: { latitude: 31.22222, longitude: 121.45806 },
  ianaTimeZone: 'Asia/Shanghai',
  authority: {
    ...locationA.authority,
    recordId: 'location-b'
  }
};

const exactResolution = {
  localDate: '1990-05-15',
  localTime: '07:05',
  locationLabel: 'Shanghai China',
  latitude: 40.7128,
  longitude: -74.006,
  ianaTimeZone: 'America/New_York',
  resolvedUtcInstant: '1990-05-15T11:05:00.000Z',
  utcOffsetSeconds: -14_400,
  timezoneDatabaseVersion: 'UI_DEVELOPMENT_ONLY',
  timezoneResolutionMethod: 'UI_DEVELOPMENT_ONLY',
  ambiguityStatus: 'EXACT'
};

const baseDraft = {
  localDate: '1990-05-15',
  localTime: '07:05',
  locationLabel: 'Shanghai China',
  latitude: null,
  longitude: null,
  ianaTimeZone: null,
  resolvedUtcInstant: null,
  utcOffsetSeconds: null,
  timezoneDatabaseVersion: null,
  timezoneResolutionMethod: null,
  ambiguityStatus: 'UNRESOLVED',
  houseSystem: 'Placidus'
};

function locationState(selectedLocation, rawQuery = 'Shanghai China') {
  return {
    state: selectedLocation === null ? 'UNRESOLVED' : 'RESOLVED',
    rawQuery,
    candidates: [],
    selectedLocation,
    errorMessage: null
  };
}

test('a canonical location is required; raw location text alone is not save authority', () => {
  const input = {
    draft: baseDraft,
    resolution: exactResolution,
    locationResolution: locationState(null)
  };

  assert.equal(canAttemptVaultInputSave(input), false);
  assert.deepEqual(resolveVaultInputSaveEligibility(input), {
    eligible: false,
    reason: 'LOCATION_NOT_RESOLVED'
  });
});

test('current resolved input becomes input-only save-eligible without a chart result', () => {
  const input = {
    draft: baseDraft,
    resolution: exactResolution,
    locationResolution: locationState(locationB)
  };
  const eligibility = resolveVaultInputSaveEligibility(input);

  assert.equal(canAttemptVaultInputSave({ ...input, resolution: null }), true);
  assert.equal(eligibility.eligible, true);
  assert.deepEqual(eligibility.chartRequest, {
    birth: {
      localDate: '1990-05-15',
      localTime: '07:05',
      locationLabel: 'Shanghai, China',
      locationResolutionId: 'location-b',
      latitude: 31.22222,
      longitude: 121.45806,
      ianaTimeZone: 'Asia/Shanghai',
      resolvedUtcInstant: '1990-05-15T11:05:00.000Z',
      utcOffsetSeconds: -14_400,
      timezoneDatabaseVersion: 'UI_DEVELOPMENT_ONLY',
      timezoneResolutionMethod: 'UI_DEVELOPMENT_ONLY',
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'Placidus'
  });
});

test('the newly selected location wins over any earlier location snapshot', () => {
  const eligibility = resolveVaultInputSaveEligibility({
    draft: baseDraft,
    resolution: exactResolution,
    locationResolution: locationState(locationB)
  });

  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.chartRequest.birth.locationResolutionId, 'location-b');
  assert.equal(eligibility.chartRequest.birth.locationLabel, 'Shanghai, China');
  assert.equal(eligibility.chartRequest.birth.ianaTimeZone, 'Asia/Shanghai');
  assert.equal(eligibility.chartRequest.birth.latitude, 31.22222);
  assert.equal(eligibility.chartRequest.birth.longitude, 121.45806);
  assert.doesNotMatch(JSON.stringify(eligibility.chartRequest), /location-a/u);
});

test('unknown birth time remains an explicit save-eligible input state', () => {
  const unknownDraft = {
    ...baseDraft,
    localTime: null,
    ambiguityStatus: 'UNKNOWN_TIME'
  };
  const unknownResolution = {
    ...exactResolution,
    localTime: null,
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    ambiguityStatus: 'UNKNOWN_TIME'
  };
  const eligibility = resolveVaultInputSaveEligibility({
    draft: unknownDraft,
    resolution: unknownResolution,
    locationResolution: locationState(locationB)
  });

  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.chartRequest.birth.localTime, null);
  assert.equal(eligibility.chartRequest.birth.resolvedUtcInstant, null);
  assert.equal(eligibility.chartRequest.birth.utcOffsetSeconds, null);
  assert.equal(eligibility.chartRequest.birth.ambiguityStatus, 'UNKNOWN_TIME');
});

test('a resolution for a previous date or time cannot authorize the current draft', () => {
  const eligibility = resolveVaultInputSaveEligibility({
    draft: { ...baseDraft, localDate: '1990-05-16' },
    resolution: exactResolution,
    locationResolution: locationState(locationB)
  });

  assert.deepEqual(eligibility, {
    eligible: false,
    reason: 'BIRTH_TIME_NOT_RESOLVED'
  });
});
