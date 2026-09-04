import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import {
  assertEligibleVaultRecordInput,
  createVaultRecord,
  VaultRecordEligibilityError
} from '../dist/vault/vault-record-domain.js';
import { PostgresVaultChartRepository } from '../dist/persistence/postgres/postgres-vault-chart-repository.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SAVED_AT = '2026-09-04T16:00:00.000Z';
const LOCATION_ID = 'location-1';

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
    sourceId: 'test-geocoder',
    recordId: LOCATION_ID
  },
  source: {
    sourceVersion: null,
    datasetVersion: null,
    attribution: null
  }
};

function createLocationResolutionService() {
  return {
    getResolvedLocation(resolutionId) {
      return resolutionId === LOCATION_ID ? RESOLVED_LOCATION : null;
    }
  };
}

function createChartRequest(overrides = {}) {
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
      timezoneResolutionMethod: 'geonames-test',
      ambiguityStatus: 'EXACT',
      ...overrides.birth
    },
    houseSystem: overrides.houseSystem ?? 'Placidus'
  };
}

function createUnknownTimeRequest() {
  return createChartRequest({
    birth: {
      localTime: null,
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      ambiguityStatus: 'UNKNOWN_TIME'
    }
  });
}

function createCompleteChartResult(longitude = 11) {
  return {
    schemaVersion: '1.0.0',
    engineVersion: 'engine-v1',
    bodies: [
      {
        bodyId: 'SUN',
        longitude,
        sign: 'ARIES',
        house: null,
        retrograde: null
      }
    ],
    angles: [],
    houses: null,
    aspects: [],
    warnings: [],
    calculationStatus: 'COMPLETE',
    metadata: {
      configurationStatus: 'COMPLETE',
      astronomyConfigurationId: 'astro-config-v1',
      provenanceEnvelopeId: 'provenance-v1'
    }
  };
}

function createDevelopmentFixtureResult() {
  return {
    ...createCompleteChartResult(22),
    schemaVersion: 'fixture-v1',
    engineVersion: 'mock-v1',
    calculationStatus: 'INCOMPLETE_RESEARCH',
    metadata: {
      configurationStatus: 'INCOMPLETE_RESEARCH',
      astronomyConfigurationId: null,
      provenanceEnvelopeId: null,
      reason: 'INCOMPLETE_RESEARCH'
    }
  };
}

function createRecordInput(overrides = {}) {
  return {
    userId: 'owner-1',
    displayName: 'My saved chart',
    category: 'SELF',
    tags: ['personal'],
    favorite: false,
    chart: createChartRequest(),
    idGenerator: {
      generate() {
        return 'vault-record-1';
      }
    },
    clock: {
      now() {
        return SAVED_AT;
      }
    },
    locationResolutionService: createLocationResolutionService(),
    saveMode: 'INPUT_ONLY',
    canonicalChartResult: null,
    ...overrides
  };
}

function assertEligibilityError(callback, code) {
  assert.throws(
    callback,
    (error) =>
      error instanceof VaultRecordEligibilityError && error.code === code
  );
}

test('Vault domain preserves input authority and creates authoritative snapshots without deriving facts', () => {
  const chart = createChartRequest();
  const authoritativeResult = createCompleteChartResult();
  const inputOnly = createVaultRecord(
    createRecordInput({ chart, saveMode: 'INPUT_ONLY' })
  );

  assert.equal(inputOnly.scientificStatus, 'INPUT_ONLY');
  assert.equal(inputOnly.calculationAuthorityState, 'AUTHORITY_INCOMPLETE');
  assert.equal(inputOnly.recordOrigin, 'USER_INPUT');
  assert.equal(inputOnly.canonicalChartResult, null);
  assert.equal(inputOnly.timeAuthorityState, 'RESOLVED');
  assert.deepEqual(inputOnly.normalizedChartRequest, chart);

  chart.birth.localDate = '2001-02-03';
  assert.equal(inputOnly.normalizedChartRequest.birth.localDate, '1990-01-01');

  const available = createVaultRecord(
    createRecordInput({
      idGenerator: { generate: () => 'vault-record-2' },
      chart: createChartRequest(),
      saveMode: 'CHART_RESULT_AVAILABLE',
      canonicalChartResult: authoritativeResult
    })
  );

  assert.equal(available.scientificStatus, 'CHART_RESULT_AVAILABLE');
  assert.equal(available.calculationAuthorityState, 'AUTHORITATIVE');
  assert.equal(available.recordOrigin, 'USER_INPUT');
  assert.equal(available.astronomyConfigurationId, 'astro-config-v1');
  assert.equal(available.provenanceEnvelopeId, 'provenance-v1');
  assert.notStrictEqual(available.canonicalChartResult, authoritativeResult);
  available.canonicalChartResult.bodies[0].longitude = 99;
  assert.equal(authoritativeResult.bodies[0].longitude, 11);
});

test('Vault eligibility fails closed for malformed time, unselected location, mismatched authority, and fixture masquerading', () => {
  assertEligibilityError(
    () =>
      assertEligibleVaultRecordInput(
        createChartRequest({ birth: { ianaTimeZone: 'Mars/Not_A_Timezone' } }),
        createLocationResolutionService()
      ),
    'INVALID_INPUT'
  );

  assertEligibilityError(
    () =>
      assertEligibleVaultRecordInput(
        createChartRequest({ birth: { locationResolutionId: undefined } }),
        createLocationResolutionService()
      ),
    'INVALID_INPUT'
  );

  assertEligibilityError(
    () =>
      assertEligibleVaultRecordInput(
        createChartRequest({ birth: { latitude: 41 } }),
        createLocationResolutionService()
      ),
    'INVALID_INPUT'
  );

  assertEligibilityError(
    () =>
      createVaultRecord(
        createRecordInput({
          saveMode: 'CHART_RESULT_AVAILABLE',
          canonicalChartResult: createDevelopmentFixtureResult()
        })
      ),
    'INVALID_STATE'
  );
});

test('UNKNOWN_TIME remains an explicit input state and never gains derived time authority', () => {
  const record = createVaultRecord(
    createRecordInput({
      chart: createUnknownTimeRequest(),
      saveMode: 'INPUT_ONLY'
    })
  );

  assert.equal(record.timeAuthorityState, 'UNKNOWN_BIRTH_TIME');
  assert.equal(record.normalizedChartRequest.birth.localTime, null);
  assert.equal(record.normalizedChartRequest.birth.resolvedUtcInstant, null);
  assert.equal(record.normalizedChartRequest.birth.utcOffsetSeconds, null);
  assert.equal(record.scientificProvenance.timeAuthorityState, 'UNKNOWN_BIRTH_TIME');
  assert.equal(record.scientificProvenance.calculationAuthorityState, 'AUTHORITY_INCOMPLETE');
});

test('development fixture snapshots remain explicitly non-authoritative and are cloned', () => {
  const fixture = createDevelopmentFixtureResult();
  const developmentChart = createChartRequest({
    birth: {
      localTime: null,
      locationResolutionId: undefined,
      latitude: 0,
      longitude: 0,
      ianaTimeZone: 'UTC',
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      timezoneDatabaseVersion: 'UI_DEVELOPMENT_ONLY',
      timezoneResolutionMethod: 'UI_DEVELOPMENT_ONLY',
      ambiguityStatus: 'UNKNOWN_TIME'
    }
  });
  const record = createVaultRecord(
    createRecordInput({
      chart: developmentChart,
      saveMode: 'CHART_RESULT_AVAILABLE',
      canonicalChartResult: fixture,
      locationResolutionService: undefined,
      allowDevelopmentFixtureSnapshot: true
    })
  );

  assert.equal(record.scientificStatus, 'INPUT_ONLY');
  assert.equal(record.calculationAuthorityState, 'AUTHORITY_INCOMPLETE');
  assert.equal(record.recordOrigin, 'DEVELOPMENT_FIXTURE');
  assert.equal(record.sourceContext, 'chart-workspace.development-fixture');
  assert.notStrictEqual(record.canonicalChartResult, fixture);
  record.canonicalChartResult.bodies[0].longitude = 77;
  assert.equal(fixture.bodies[0].longitude, 22);
});

function createCapacitySqlHarness(initialCount = 0) {
  let storedCount = initialCount;
  const calls = [];
  const executor = {
    async query(sql, params = []) {
      const normalizedSql = sql.replace(/\s+/gu, ' ').trim();
      calls.push({ sql: normalizedSql, params });

      if (normalizedSql.startsWith('SELECT user_id FROM users')) {
        return { rows: [{ user_id: params[0] }] };
      }

      if (normalizedSql.startsWith('SELECT COUNT(*)::int AS count')) {
        return { rows: [{ count: storedCount }] };
      }

      if (normalizedSql.startsWith('INSERT INTO charts')) {
        storedCount += 1;
        return { rows: [], rowCount: 1 };
      }

      return { rows: [] };
    }
  };
  let queue = Promise.resolve();
  const transactionRunner = {
    run(operation) {
      const current = queue.then(() => operation(executor));
      queue = current.then(
        () => undefined,
        () => undefined
      );
      return current;
    }
  };

  return {
    calls,
    executor,
    getStoredCount: () => storedCount,
    transactionRunner
  };
}

function createCapacityRecord(id) {
  return createVaultRecord(
    createRecordInput({
      idGenerator: { generate: () => id },
      saveMode: 'CHART_RESULT_AVAILABLE',
      canonicalChartResult: createCompleteChartResult()
    })
  );
}

test('PostgreSQL Vault capacity uses an owner lock and remains race-safe', async () => {
  const harness = createCapacitySqlHarness();
  const repository = new PostgresVaultChartRepository(
    harness.executor,
    harness.transactionRunner
  );

  const results = await Promise.all([
    repository.createWithCapacity(createCapacityRecord('record-a'), 1),
    repository.createWithCapacity(createCapacityRecord('record-b'), 1)
  ]);

  assert.deepEqual([...results].sort(), ['capacity-reached', 'created']);
  assert.equal(harness.getStoredCount(), 1);
  assert.equal(
    harness.calls.filter((call) => call.sql.startsWith('INSERT INTO charts')).length,
    1
  );
  assert.equal(
    harness.calls.filter((call) => call.sql.includes('FOR UPDATE')).length,
    2
  );
  assert.equal(await repository.countForUser('owner-1'), 1);
});

test('Vault API saves input-only records without calculation, enforces capacity, and hides foreign records', async () => {
  const records = [];
  const calls = { calculate: 0 };
  let nextId = 0;
  const vaultCharts = {
    async create(chart) {
      records.push(chart);
    },
    async createWithCapacity(chart, capacity) {
      if (records.filter((record) => record.userId === chart.userId).length >= capacity) {
        return 'capacity-reached';
      }

      records.push(chart);
      return 'created';
    },
    async countForUser(userId) {
      return records.filter((record) => record.userId === userId).length;
    },
    async findById(userId, chartId) {
      return records.find(
        (record) => record.userId === userId && record.chartId === chartId
      ) ?? null;
    },
    async listForUser(userId) {
      return records.filter((record) => record.userId === userId);
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
        nextId += 1;
        return `api-record-${nextId}`;
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
    engineClient: {
      async calculateChart() {
        throw new Error('input-only save must not call EngineClient');
      }
    },
    chartCalculator: {
      async calculateChartWithOutcome() {
        calls.calculate += 1;
        return {
          chart: calculatedResult,
          observability: {}
        };
      }
    },
    clock: { now: () => SAVED_AT },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {},
    locationResolutionService: createLocationResolutionService()
  };
  const app = createApp(dependencies);
  let calculatedResult = createCompleteChartResult();

  const requestBody = {
    chart: createChartRequest(),
    displayName: 'Input snapshot',
    category: 'SELF',
    tags: [],
    favorite: false,
    saveMode: 'INPUT_ONLY'
  };

  const save = async (userId = 'owner-1') =>
    app.request('/api/vault/charts', {
      method: 'POST',
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'X-Test-User': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

  for (let index = 0; index < 3; index += 1) {
    const response = await save();
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.chart.scientificStatus, 'INPUT_ONLY');
    assert.equal(payload.capacity.used, index + 1);
  }

  const capacityResponse = await save();
  assert.equal(capacityResponse.status, 409);
  assert.equal((await capacityResponse.json()).code, 'CAPACITY_REACHED');
  assert.equal(calls.calculate, 0);
  assert.equal(records.length, 3);

  calculatedResult = createDevelopmentFixtureResult();
  const contradictoryFixtureResponse = await app.request('/api/vault/charts', {
    method: 'POST',
    headers: {
      Origin: PUBLIC_WEB_ORIGIN,
      'X-Test-User': 'owner-1',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...requestBody,
      saveMode: 'CHART_RESULT_AVAILABLE'
    })
  });
  assert.equal(contradictoryFixtureResponse.status, 409);
  assert.equal((await contradictoryFixtureResponse.json()).code, 'INVALID_STATE');
  assert.equal(calls.calculate, 1);
  assert.equal(records.length, 3);

  const foreignResponse = await app.request(
    `/api/vault/charts/${records[0].chartId}`,
    {
      headers: {
        Origin: PUBLIC_WEB_ORIGIN,
        'X-Test-User': 'other-user'
      }
    }
  );
  assert.equal(foreignResponse.status, 404);
});

test('Vault foundation migration is forward-only and declares the durable state contract', () => {
  const migration = readFileSync(
    new URL('../db/migrations/0020_vault_record_foundation.sql', import.meta.url),
    'utf8'
  );
  const baseline = readFileSync(
    new URL('../db/migrations/0001_auth_vault_baseline.sql', import.meta.url),
    'utf8'
  );

  assert.match(migration, /ALTER TABLE charts/u);
  assert.match(migration, /record_version/u);
  assert.match(migration, /charts_display_name_length_check/u);
  assert.match(migration, /scientific_status/u);
  assert.match(migration, /scientific_provenance/u);
  assert.match(migration, /charts_user_created_at_idx/u);
  assert.doesNotMatch(migration, /DROP TABLE/u);
  assert.doesNotMatch(migration, /\b0017\b/u);
  assert.match(
    baseline,
    /CONSTRAINT charts_user_fk[\s\S]*ON DELETE CASCADE/u
  );
});
