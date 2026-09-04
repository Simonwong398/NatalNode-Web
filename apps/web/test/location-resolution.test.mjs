import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EMPTY_LOCATION_RESOLUTION_STATE,
  applyLocationCandidates,
  beginLocationSearch,
  canSubmitProductionCalculation,
  LOCATION_SEARCH_DEBOUNCE_MS,
  LOCATION_SEARCH_MINIMUM_CHARACTERS,
  markLocationError,
  markLocationUnresolved,
  selectCanonicalLocation
} from '../dist/location-resolution-characterization/features/chart-input/location-resolution.js';
import {
  UI_CATALOGS,
  UI_MESSAGE_KEYS,
  getUiMessage
} from '../dist/location-resolution-characterization/lib/ui-catalog.js';
import { formatLocationPresentation } from '../dist/location-resolution-characterization/features/chart-input/location-presentation.js';

const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];

const candidate = {
  candidateId: 'authority-record-1',
  canonicalDisplayName: 'Los Angeles, California, United States',
  locality: 'Los Angeles',
  region: 'California',
  country: 'United States',
  countryCode: 'US',
  coordinates: { latitude: 34.0522, longitude: -118.2437 },
  authority: {
    kind: 'GEOCODING',
    sourceId: 'future-provider',
    recordId: 'authority-record-1'
  },
  source: { sourceVersion: '1', datasetVersion: '1' }
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

test('raw location text stays separate from canonical authority', () => {
  const searching = beginLocationSearch('  la usa  ');

  assert.equal(searching.state, 'SEARCHING');
  assert.equal(searching.rawQuery, '  la usa  ');
  assert.equal(searching.selectedLocation, null);
  assert.equal(canSubmitProductionCalculation(searching), false);

  const candidates = applyLocationCandidates(searching, [candidate]);
  assert.equal(candidates.state, 'CANDIDATES');
  assert.equal(candidates.rawQuery, '  la usa  ');
  assert.equal(candidates.selectedLocation, null);
  assert.equal(candidates.candidates[0].canonicalDisplayName, candidate.canonicalDisplayName);
  assert.equal(candidates.candidates[0].canonicalDisplayName, 'Los Angeles, California, United States');
  assert.equal(canSubmitProductionCalculation(candidates), false);

  const edited = beginLocationSearch('Los Angeles');
  assert.equal(edited.selectedLocation, null);
  assert.equal(canSubmitProductionCalculation(edited), false);
});

test('location presentation localizes country labels without mutating authority fields', () => {
  const location = {
    locality: 'Shanghai',
    region: 'Shanghai',
    country: 'China',
    countryCode: 'CN',
    coordinates: { latitude: 31.22222, longitude: 121.45806 },
    ianaTimeZone: 'Asia/Shanghai',
    authority: {
      kind: 'GEOCODING',
      sourceId: 'geonames-free-web-services',
      recordId: 'candidate-shanghai'
    }
  };
  const authoritySnapshot = structuredClone(location);

  assert.deepEqual(
    Object.fromEntries(
      ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'].map((locale) => [
        locale,
        formatLocationPresentation(location, locale)
      ])
    ),
    {
      en: 'Shanghai, China',
      es: 'Shanghai, China',
      fr: 'Shanghai, Chine',
      de: 'Shanghai, China',
      ja: 'Shanghai, 中国',
      ko: 'Shanghai, 중국',
      'zh-Hant': 'Shanghai，中國'
    }
  );
  assert.deepEqual(location, authoritySnapshot);
  assert.equal(
    formatLocationPresentation(
      { locality: '上海', region: '上海市', country: '中国', countryCode: 'CN' },
      'zh-Hant'
    ),
    '上海，上海市，中國'
  );
  assert.equal(
    formatLocationPresentation(
      { locality: 'Shanghai', region: 'Shanghai', country: '中国', countryCode: null },
      'zh-Hant'
    ),
    'Shanghai，中国'
  );
});

test('explicit selection produces RESOLVED and retains canonical identity fields', () => {
  const selected = selectCanonicalLocation(
    applyLocationCandidates(beginLocationSearch('Paris'), [candidate]),
    resolvedLocation
  );

  assert.equal(selected.state, 'RESOLVED');
  assert.equal(selected.rawQuery, 'Paris');
  assert.deepEqual(selected.selectedLocation, resolvedLocation);
  assert.equal(canSubmitProductionCalculation(selected), true);
  assert.notEqual(selected.selectedLocation.canonicalDisplayName, selected.rawQuery);
});

test('ambiguous, unresolved, error, and empty states cannot submit production calculation', () => {
  const searching = beginLocationSearch('Springfield');
  const ambiguous = applyLocationCandidates(searching, [candidate, {
    ...candidate,
    candidateId: 'authority-record-2',
    canonicalDisplayName: 'Springfield, Illinois, United States',
    locality: 'Springfield',
    region: 'Illinois'
  }]);
  const unresolved = markLocationUnresolved(ambiguous);
  const error = markLocationError(unresolved, 'Location resolution is unavailable.');

  assert.equal(EMPTY_LOCATION_RESOLUTION_STATE.state, 'EMPTY');
  assert.equal(ambiguous.state, 'AMBIGUOUS');
  assert.equal(unresolved.state, 'UNRESOLVED');
  assert.equal(error.state, 'ERROR');
  for (const state of [EMPTY_LOCATION_RESOLUTION_STATE, ambiguous, unresolved, error]) {
    assert.equal(canSubmitProductionCalculation(state), false, state.state);
  }
});

test('location UI labels have exact seven-locale parity and no zh-Hans catalog', () => {
  const locationKeys = UI_MESSAGE_KEYS.filter((key) => key.startsWith('birthInput.location.'));

  assert.equal(locationKeys.length, 17);
  assert.equal(LOCATION_SEARCH_MINIMUM_CHARACTERS, 3);
  assert.equal(LOCATION_SEARCH_DEBOUNCE_MS, 400);
  assert.deepEqual(Object.keys(UI_CATALOGS), LOCALES);
  assert.equal(Object.hasOwn(UI_CATALOGS, 'zh-Hans'), false);

  for (const locale of LOCALES) {
    for (const key of locationKeys) {
      assert.notEqual(getUiMessage(locale, key).trim(), '', `${locale}.${key}`);
      assert.equal(getUiMessage(locale, key), UI_CATALOGS[locale][key]);
    }
  }
});
