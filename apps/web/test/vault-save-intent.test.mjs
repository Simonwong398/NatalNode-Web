import assert from 'node:assert/strict';
import test from 'node:test';

import { WEB_UI_FIXTURE_V1 } from '@natalnode/test-fixtures';

const moduleUrl = new URL(
  '../dist/vault-save-intent-characterization/features/vault/vault-save-intent.js',
  import.meta.url
);
const {
  createSaveVaultChartRequest,
  resolveVaultSaveIntent
} = await import(moduleUrl.href);

const chartRequest = {
  birth: {
    localDate: '1990-05-15',
    localTime: '07:05',
    locationLabel: 'Shanghai, China',
    locationResolutionId: 'resolved-location-1',
    latitude: 31.2304,
    longitude: 121.4737,
    ianaTimeZone: 'Asia/Shanghai',
    resolvedUtcInstant: '1990-05-14T23:05:00.000Z',
    utcOffsetSeconds: 28800,
    timezoneDatabaseVersion: 'tzdb-test-v1',
    timezoneResolutionMethod: 'geonames-test',
    ambiguityStatus: 'EXACT'
  },
  houseSystem: 'Placidus'
};

const completeResult = {
  ...WEB_UI_FIXTURE_V1,
  engineVersion: 'engine-v1',
  calculationStatus: 'COMPLETE',
  metadata: {
    configurationStatus: 'COMPLETE',
    astronomyConfigurationId: 'astro-config-v1',
    provenanceEnvelopeId: null
  }
};

function createInput(chartResult) {
  return {
    chart: chartRequest,
    chartResult,
    displayName: 'Shanghai chart',
    category: 'SELF',
    tags: [],
    favorite: false
  };
}

test('development fixture results produce an explicit input-only request', () => {
  const input = createInput(WEB_UI_FIXTURE_V1);
  const before = structuredClone(input);
  const request = createSaveVaultChartRequest(input);

  assert.equal(resolveVaultSaveIntent(WEB_UI_FIXTURE_V1), 'INPUT_ONLY');
  assert.equal(request.saveMode, 'INPUT_ONLY');
  assert.deepEqual(request.chart, chartRequest);
  assert.equal(Object.hasOwn(request, 'chartResult'), false);
  assert.deepEqual(input, before);
});

test('complete non-fixture results produce a distinct result-save request', () => {
  const request = createSaveVaultChartRequest(createInput(completeResult));

  assert.equal(resolveVaultSaveIntent(completeResult), 'CHART_RESULT_AVAILABLE');
  assert.equal(request.saveMode, 'CHART_RESULT_AVAILABLE');
  assert.equal(Object.hasOwn(request, 'chartResult'), false);
});

test('fixture and mock markers remain input-only even with complete-shaped metadata', () => {
  const fixtureComplete = { ...completeResult, engineVersion: 'UI_FIXTURE_V1' };
  const mockComplete = { ...completeResult, engineVersion: 'mock-engine-v1' };

  assert.equal(resolveVaultSaveIntent(fixtureComplete), 'INPUT_ONLY');
  assert.equal(resolveVaultSaveIntent(mockComplete), 'INPUT_ONLY');
});
