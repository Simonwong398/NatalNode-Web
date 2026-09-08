import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  certifyChartResultForRequest,
  getChartRequestAuthorityIssue
} from '@natalnode/contracts';
import { HttpEngineClient } from '@natalnode/engine-client/http';
import { CachedChartCalculator } from '../dist/app/cache/cached-chart-calculator.js';
import { createApp } from '../dist/app/create-app.js';
import {
  assertVaultRecordAuthority,
  createVaultRecord,
  VaultRecordEligibilityError
} from '../dist/vault/vault-record-domain.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SAVED_AT = '2026-09-08T10:00:00.000Z';
const LOCATION_ID = 'location-1';
const CACHE_IDENTITY = {
  runtimeNamespace: 'authority-test',
  engineResultGeneration: 'engine-v1',
  chartResultContractVersion: '1.0.0'
};

const RESOLVED_LOCATION = {
  resolutionId: LOCATION_ID,
  canonicalDisplayName: 'New York, NY, United States',
  locality: 'New York',
  region: 'New York',
  country: 'United States',
  countryCode: 'US',
  coordinates: {
    latitude: 40.7128,
    longitude: -74.006
  },
  ianaTimeZone: 'America/New_York',
  status: 'RESOLVED',
  authority: {
    kind: 'GEOCODING',
    sourceId: 'authority-test',
    recordId: LOCATION_ID
  },
  source: {
    sourceVersion: null,
    datasetVersion: null,
    attribution: null
  }
};

function clone(value) {
  return structuredClone(value);
}

function createKnownRequest(overrides = {}) {
  return {
    birth: {
      localDate: '1990-01-01',
      localTime: '12:00',
      locationLabel: 'New York, NY, United States',
      locationResolutionId: LOCATION_ID,
      latitude: 40.7128,
      longitude: -74.006,
      ianaTimeZone: 'America/New_York',
      resolvedUtcInstant: '1990-01-01T17:00:00.000Z',
      utcOffsetSeconds: -18_000,
      timezoneDatabaseVersion: 'tzdb-test-v1',
      timezoneResolutionMethod: 'authority-test',
      ambiguityStatus: 'EXACT',
      ...overrides.birth
    },
    houseSystem: overrides.houseSystem ?? 'Placidus'
  };
}

function createUnknownRequest(overrides = {}) {
  return createKnownRequest({
    ...overrides,
    birth: {
      localTime: null,
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      ambiguityStatus: 'UNKNOWN_TIME',
      ...overrides.birth
    }
  });
}

function createBody(overrides = {}) {
  return {
    bodyId: 'Sun',
    longitude: 11,
    sign: 'Aries',
    house: null,
    retrograde: false,
    ...overrides
  };
}

function createResult(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    engineVersion: 'engine-v1',
    bodies: [],
    angles: [],
    houses: null,
    aspects: [],
    warnings: [],
    calculationStatus: 'COMPLETE',
    metadata: {
      configurationStatus: 'COMPLETE',
      astronomyConfigurationId: 'astro-config-v1',
      provenanceEnvelopeId: 'provenance-v1'
    },
    ...overrides
  };
}

function createFullKnownTimeResult() {
  return createResult({
    bodies: [createBody({ house: 1 })],
    angles: [
      { angleId: 'ASC', longitude: 101, sign: 'Cancer' },
      { angleId: 'MC', longitude: 11, sign: 'Aries' }
    ],
    houses: {
      system: 'Placidus',
      cusps: [{ house: 1, longitude: 101 }]
    },
    aspects: [
      {
        firstBodyId: 'Sun',
        secondBodyId: 'Moon',
        type: 'opposition',
        orb: 1.5,
        phaseState: 'EXACT'
      }
    ]
  });
}

function createLocationResolutionService() {
  return {
    getResolvedLocation(resolutionId) {
      return resolutionId === LOCATION_ID ? RESOLVED_LOCATION : null;
    }
  };
}

function createEngineClient(resultFactory) {
  const calls = [];

  return {
    calls,
    async calculateChart(request) {
      calls.push(clone(request));
      return clone(resultFactory(request, calls.length));
    },
    async getSkySnapshot() {
      throw new Error('Sky is outside this focused authority test.');
    },
    async getSkyEvents() {
      throw new Error('Sky is outside this focused authority test.');
    }
  };
}

function createCalculator(engineClient) {
  return new CachedChartCalculator({
    engineClient,
    clock: { now: () => SAVED_AT },
    cacheIdentity: CACHE_IDENTITY
  });
}

function createRouteHarness({ resultFactory = () => createResult() } = {}) {
  const engineClient = createEngineClient(resultFactory);
  const chartCalculator = createCalculator(engineClient);
  const savedCharts = [];
  let nextChartId = 0;
  const vaultCharts = {
    async create(chart) {
      savedCharts.push(clone(chart));
    },
    async findById(userId, chartId) {
      return savedCharts.find(
        (chart) => chart.userId === userId && chart.chartId === chartId
      ) ?? null;
    },
    async listForUser(userId) {
      return savedCharts.filter((chart) => chart.userId === userId);
    },
    async updateMetadata() {
      return null;
    },
    async deleteById() {
      return false;
    }
  };
  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null ? null : { userId };
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {
      generate() {
        nextChartId += 1;
        return `chart-${nextChartId}`;
      }
    },
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts,
      chartNotes: {}
    },
    engineClient,
    chartCalculator,
    clock: { now: () => SAVED_AT },
    locationResolutionService: createLocationResolutionService(),
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies),
    engineClient,
    savedCharts,
    dependencies
  };
}

function postChart(app, chart, edgeIp = '203.0.113.10') {
  return app.request('/api/chart', {
    method: 'POST',
    headers: {
      Origin: PUBLIC_WEB_ORIGIN,
      'Content-Type': 'application/json',
      'X-NatalNode-Client-IP': edgeIp
    },
    body: JSON.stringify({ chart })
  });
}

async function assertProblem(response, status, code) {
  assert.equal(response.status, status);
  assert.equal((await response.json()).code, code);
}

function createVaultRecordInput(chart, result = null, saveMode = 'INPUT_ONLY') {
  return {
    userId: 'owner-1',
    displayName: 'Authority test chart',
    category: 'SELF',
    tags: ['authority-test'],
    favorite: false,
    chart,
    idGenerator: { generate: () => 'record-1' },
    clock: { now: () => SAVED_AT },
    locationResolutionService: createLocationResolutionService(),
    saveMode,
    canonicalChartResult: result
  };
}

test('canonical request authority uses ambiguityStatus and rejects contradictory cross-field states', () => {
  assert.equal(getChartRequestAuthorityIssue(createUnknownRequest()), null);
  assert.deepEqual(
    getChartRequestAuthorityIssue(
      createUnknownRequest({ birth: { localTime: '12:00' } })
    ),
    {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'UNKNOWN_TIME_HAS_TIME_FIELDS'
    }
  );
  assert.deepEqual(
    getChartRequestAuthorityIssue(
      createKnownRequest({
        birth: {
          localTime: null,
          resolvedUtcInstant: null,
          utcOffsetSeconds: null
        }
      })
    ),
    {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'EXACT_TIME_MISSING_REQUIRED_FIELDS'
    }
  );
  assert.deepEqual(
    getChartRequestAuthorityIssue(
      createKnownRequest({
        birth: {
          localTime: '',
          resolvedUtcInstant: '   '
        }
      })
    ),
    {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'EXACT_TIME_MISSING_REQUIRED_FIELDS'
    }
  );
  assert.deepEqual(
    getChartRequestAuthorityIssue(
      createKnownRequest({
        birth: {
          ambiguityStatus: 'AMBIGUOUS',
          resolvedUtcInstant: '1990-01-01T17:00:00.000Z'
        }
      })
    ),
    {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'NON_EXACT_TIME_HAS_RESOLVED_FIELDS'
    }
  );
});

test('request-aware certification accepts known-time categories but closes unresolved-time categories', () => {
  const knownRequest = createKnownRequest();
  const knownResult = createFullKnownTimeResult();
  const knownBefore = clone(knownResult);
  const knownCertification = certifyChartResultForRequest(knownRequest, knownResult);

  assert.equal(knownCertification.outcome, 'CERTIFIED');
  assert.deepEqual(knownResult, knownBefore);
  assert.equal('astronomyConfigurationId' in knownCertification, false);

  const unknownRequest = createUnknownRequest();
  const cleanUnknown = certifyChartResultForRequest(
    unknownRequest,
    createResult()
  );
  assert.equal(cleanUnknown.outcome, 'CERTIFIED');
  assert.equal(cleanUnknown.authorityBasis, 'NO_TIME_DEPENDENT_FACTS');

  const bodyCertification = certifyChartResultForRequest(
    unknownRequest,
    createResult({ bodies: [createBody()] })
  );
  assert.equal(bodyCertification.outcome, 'REJECTED');
  assert.equal(
    bodyCertification.failureCode,
    'UNSUPPORTED_UNKNOWN_TIME_FACT_CERTIFICATION'
  );
  assert.deepEqual(bodyCertification.rejectedFactCategories, ['BODY_POSITIONS']);

  const houseCertification = certifyChartResultForRequest(
    unknownRequest,
    createResult({ houses: { system: 'Placidus', cusps: [] } })
  );
  assert.equal(houseCertification.outcome, 'REJECTED');
  assert.equal(
    houseCertification.failureCode,
    'TIME_DEPENDENT_FACT_WITH_UNKNOWN_TIME'
  );
  assert.deepEqual(houseCertification.rejectedFactCategories, ['HOUSES']);

  const assignmentCertification = certifyChartResultForRequest(
    unknownRequest,
    createResult({ bodies: [createBody({ house: 1 })] })
  );
  assert.equal(assignmentCertification.outcome, 'REJECTED');
  assert.deepEqual(assignmentCertification.rejectedFactCategories, [
    'BODY_HOUSE_ASSIGNMENTS'
  ]);

  const aspectCertification = certifyChartResultForRequest(
    unknownRequest,
    createResult({
      aspects: [
        {
          firstBodyId: 'Sun',
          secondBodyId: 'Moon',
          type: 'trine',
          orb: 0.5,
          phaseState: null
        }
      ]
    })
  );
  assert.equal(aspectCertification.outcome, 'REJECTED');
  assert.deepEqual(aspectCertification.rejectedFactCategories, ['ASPECTS']);

  const angleRelationCertification = certifyChartResultForRequest(
    unknownRequest,
    createResult({
      aspects: [
        {
          firstBodyId: 'ASC',
          secondBodyId: 'Sun',
          type: 'square',
          orb: 1,
          phaseState: null
        }
      ]
    })
  );
  assert.deepEqual(angleRelationCertification.rejectedFactCategories, [
    'ASPECTS',
    'ANGLE_RELATIONS'
  ]);
});

test('HttpEngineClient preserves UNKNOWN_TIME exactly and rejects uncertified responses', async () => {
  const request = createUnknownRequest();
  let observedBody;
  const client = new HttpEngineClient(async (_input, init) => {
    observedBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ chart: createResult() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  });

  const result = await client.calculateChart(request);
  assert.deepEqual(observedBody.chart, request);
  assert.equal(observedBody.chart.birth.ambiguityStatus, 'UNKNOWN_TIME');
  assert.equal(observedBody.chart.birth.localTime, null);
  assert.equal(observedBody.chart.birth.resolvedUtcInstant, null);
  assert.equal(observedBody.chart.birth.utcOffsetSeconds, null);
  assert.deepEqual(result, createResult());

  const rejectingClient = new HttpEngineClient(async () =>
    new Response(
      JSON.stringify({ chart: createResult({ bodies: [createBody()] }) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  );
  await assert.rejects(
    rejectingClient.calculateChart(request),
    /Chart calculation request failed/u
  );
});

test('BFF rejects contradictory requests and passes UNKNOWN_TIME unchanged to EngineClient', async () => {
  const harness = createRouteHarness({ resultFactory: () => createResult() });
  const unknownRequest = createUnknownRequest();
  const response = await postChart(harness.app, unknownRequest);

  assert.equal(response.status, 200);
  assert.deepEqual(harness.engineClient.calls[0], unknownRequest);

  const contradictory = createUnknownRequest({
    birth: {
      localTime: '12:00'
    }
  });
  const contradictoryResponse = await postChart(
    harness.app,
    contradictory,
    '203.0.113.11'
  );
  await assertProblem(contradictoryResponse, 400, 'INVALID_REQUEST');
  assert.equal(harness.engineClient.calls.length, 1);

  const clientSuppliedFactResponse = await postChart(
    harness.app,
    {
      ...unknownRequest,
      angles: [{ angleId: 'ASC', longitude: 1, sign: 'Aries' }]
    },
    '203.0.113.12'
  );
  await assertProblem(clientSuppliedFactResponse, 400, 'INVALID_REQUEST');
  assert.equal(harness.engineClient.calls.length, 1);
});

test('BFF result certification rejects illegal unknown-time results and keeps known-time results valid', async () => {
  const unknownBodyHarness = createRouteHarness({
    resultFactory: () => createResult({ bodies: [createBody()] })
  });
  await assertProblem(
    await postChart(unknownBodyHarness.app, createUnknownRequest()),
    503,
    'CALCULATION_UNAVAILABLE'
  );
  assert.equal(unknownBodyHarness.engineClient.calls.length, 1);

  const unknownHouseHarness = createRouteHarness({
    resultFactory: () =>
      createResult({ houses: { system: 'Placidus', cusps: [] } })
  });
  await assertProblem(
    await postChart(unknownHouseHarness.app, createUnknownRequest()),
    503,
    'CALCULATION_UNAVAILABLE'
  );

  const knownHarness = createRouteHarness({
    resultFactory: () => createFullKnownTimeResult()
  });
  const knownResponse = await postChart(knownHarness.app, createKnownRequest());
  assert.equal(knownResponse.status, 200);
  assert.deepEqual(await knownResponse.json(), {
    chart: createFullKnownTimeResult()
  });
});

test('CachedChartCalculator certifies cache hits and never caches rejected authority results', async () => {
  const emptyEngine = createEngineClient(() => createResult());
  const emptyCalculator = createCalculator(emptyEngine);
  const unknownRequest = createUnknownRequest();
  await emptyCalculator.calculateChart(unknownRequest);
  await emptyCalculator.calculateChart(unknownRequest);
  assert.equal(emptyEngine.calls.length, 1);

  const bodyEngine = createEngineClient(() => createResult({ bodies: [createBody()] }));
  const bodyCalculator = createCalculator(bodyEngine);
  await assert.rejects(
    bodyCalculator.calculateChart(unknownRequest),
    /UNSUPPORTED_UNKNOWN_TIME_FACT_CERTIFICATION/u
  );
  await assert.rejects(
    bodyCalculator.calculateChart(unknownRequest),
    /UNSUPPORTED_UNKNOWN_TIME_FACT_CERTIFICATION/u
  );
  assert.equal(bodyEngine.calls.length, 2);

  const knownEngine = createEngineClient(() => createFullKnownTimeResult());
  const knownCalculator = createCalculator(knownEngine);
  const knownResult = await knownCalculator.calculateChart(createKnownRequest());
  assert.equal(knownResult.houses.system, 'Placidus');
});

test('Vault input-only unknown time preserves authority and calculated saves require result coherence', () => {
  const unknownRequest = createUnknownRequest();
  const inputOnly = createVaultRecord(
    createVaultRecordInput(unknownRequest)
  );

  assert.equal(inputOnly.scientificStatus, 'INPUT_ONLY');
  assert.equal(inputOnly.canonicalChartResult, null);
  assert.equal(inputOnly.timeAuthorityState, 'UNKNOWN_BIRTH_TIME');
  assert.equal(inputOnly.normalizedChartRequest.birth.localTime, null);
  assert.equal(inputOnly.normalizedChartRequest.birth.resolvedUtcInstant, null);
  assert.equal(inputOnly.normalizedChartRequest.birth.utcOffsetSeconds, null);
  assert.doesNotThrow(() => assertVaultRecordAuthority(inputOnly));

  const knownRecord = createVaultRecord(
    createVaultRecordInput(
      createKnownRequest(),
      createFullKnownTimeResult(),
      'CHART_RESULT_AVAILABLE'
    )
  );
  assert.equal(knownRecord.scientificStatus, 'CHART_RESULT_AVAILABLE');
  assert.doesNotThrow(() => assertVaultRecordAuthority(knownRecord));

  assert.throws(
    () =>
      createVaultRecord(
        createVaultRecordInput(
          unknownRequest,
          createFullKnownTimeResult(),
          'CHART_RESULT_AVAILABLE'
        )
      ),
    (error) =>
      error instanceof VaultRecordEligibilityError &&
      error.code === 'INVALID_STATE'
  );

  assert.throws(
    () =>
      createVaultRecord(
        createVaultRecordInput(
          unknownRequest,
          createResult({ bodies: [createBody()] }),
          'CHART_RESULT_AVAILABLE'
        )
      ),
    (error) =>
      error instanceof VaultRecordEligibilityError &&
      error.code === 'INVALID_STATE'
  );
});

test('Vault reload accepts coherent unknown input and rejects persisted authority mismatch', async () => {
  const harness = createRouteHarness();
  const inputOnly = createVaultRecord(
    createVaultRecordInput(createUnknownRequest())
  );
  harness.savedCharts.push(inputOnly);

  const response = await harness.app.request(
    `/api/vault/charts/${inputOnly.chartId}`,
    {
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'X-Test-User': 'owner-1'
      }
    }
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(
    payload.chart.normalizedChartRequest.birth.ambiguityStatus,
    'UNKNOWN_TIME'
  );
  assert.equal(payload.chart.canonicalChartResult, null);

  const malformed = clone(inputOnly);
  malformed.scientificStatus = 'CHART_RESULT_AVAILABLE';
  malformed.calculationAuthorityState = 'AUTHORITATIVE';
  malformed.recordOrigin = 'USER_INPUT';
  malformed.canonicalChartResult = createFullKnownTimeResult();
  harness.savedCharts[0] = malformed;

  const malformedResponse = await harness.app.request(
    `/api/vault/charts/${inputOnly.chartId}`,
    {
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'X-Test-User': 'owner-1'
      }
    }
  );
  await assertProblem(malformedResponse, 409, 'INVALID_STATE');
});

test('authority implementation contains no Web astronomy inference or fallback time', () => {
  const source = readFileSync(
    new URL('../../packages/contracts/src/chart-authority.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /Moon|speed|orb|same sign|noon|midnight|12:00|00:00/iu);
  assert.match(source, /does not recalculate astronomy/iu);
  assert.match(source, /birth\.ambiguityStatus/iu);
});

test('Vault reload never infers authority from ChartResult presence', () => {
  const savedExperience = readFileSync(
    new URL(
      '../../apps/web/src/features/vault/SavedVaultChartExperience.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const recordDetails = readFileSync(
    new URL('../../apps/web/src/features/vault/VaultRecordDetails.tsx', import.meta.url),
    'utf8'
  );
  const recordGuard = readFileSync(
    new URL(
      '../../apps/web/src/features/vault/vault-management-contract-guards.ts',
      import.meta.url
    ),
    'utf8'
  );

  for (const source of [savedExperience, recordDetails, recordGuard]) {
    assert.doesNotMatch(source, /scientificStatus\s*===\s*undefined/iu);
  }
});
