import { createApp } from '../../dist/app/create-app.js';
import { CachedChartCalculator } from '../../dist/app/cache/cached-chart-calculator.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SOURCE_CHART_ID = 'source-chart';
const OWNER_ID = 'owner-1';
const SOURCE_TIMESTAMP = '2026-08-25T12:00:00.000Z';
const DUPLICATE_TIMESTAMP = '2026-08-28T12:00:00.000Z';

function createChartRequest() {
  return {
    birth: {
      localDate: '1990-01-01',
      localTime: '12:00',
      locationLabel: 'Source location',
      latitude: 40.7128,
      longitude: -74.006,
      ianaTimeZone: 'America/New_York',
      resolvedUtcInstant: '1990-01-01T17:00:00.000Z',
      utcOffsetSeconds: -18_000,
      timezoneDatabaseVersion: 'tzdb-test-v1',
      timezoneResolutionMethod: 'fixture-exact',
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'PLACIDUS'
  };
}

function createChartResult(longitude) {
  return {
    schemaVersion: '1.0.0',
    engineVersion: 'mock-v1',
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
    calculationStatus: 'INCOMPLETE_RESEARCH',
    metadata: {
      configurationStatus: 'INCOMPLETE_RESEARCH',
      astronomyConfigurationId: null,
      provenanceEnvelopeId: null,
      reason: 'INCOMPLETE_RESEARCH'
    }
  };
}

function createSourceChart() {
  return {
    chartId: SOURCE_CHART_ID,
    userId: OWNER_ID,
    displayName: 'Source chart',
    category: 'PARTNER',
    tags: ['source', 'reusable'],
    favorite: true,
    normalizedChartRequest: createChartRequest(),
    canonicalChartResult: {
      ...createChartResult(11),
      schemaVersion: 'source-schema',
      engineVersion: 'source-engine'
    },
    engineVersion: 'source-engine',
    chartSchemaVersion: 'source-schema',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    createdAt: SOURCE_TIMESTAMP,
    updatedAt: SOURCE_TIMESTAMP
  };
}

function createDependencies({ calls, charts, notes, calculatedChart, engineFailure, persistenceFailure }) {
  const engineClient = {
    async calculateChart() {
      calls.engine += 1;

      if (engineFailure) {
        throw new Error('private engine failure sentinel');
      }

      return structuredClone(calculatedChart);
    }
  };
  const vaultCharts = {
    async create(chart) {
      calls.create += 1;

      if (persistenceFailure) {
        throw new Error('private persistence failure sentinel');
      }

      charts.set(chart.chartId, chart);
      calls.persisted.push(chart);
    },
    async findById(userId, chartId) {
      calls.findById += 1;
      const chart = charts.get(chartId);

      return chart !== undefined && chart.userId === userId ? chart : null;
    },
    async listForUser(userId) {
      return [...charts.values()].filter((chart) => chart.userId === userId);
    },
    async updateMetadata() {
      return null;
    },
    async deleteById() {
      return false;
    }
  };
  const clock = {
    now() {
      return DUPLICATE_TIMESTAMP;
    }
  };
  const chartCalculator = new CachedChartCalculator({
    engineClient,
    clock,
    cacheIdentity: {
      runtimeNamespace: 'test',
      engineResultGeneration: 'mock-v1',
      chartResultContractVersion: '1.0.0'
    }
  });

  return {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        calls.authenticate += 1;
        const userId = request.headers.get('x-test-user');

        return userId === null ? null : { userId };
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {
      generate() {
        calls.generated += 1;
        return `duplicate-${calls.generated}`;
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
      chartNotes: {
        async create(note) {
          notes.push(note);
        },
        async listForChart(userId, chartId) {
          return notes.filter(
            (note) => note.userId === userId && note.chartId === chartId
          );
        },
        async updateContent() {
          return null;
        },
        async deleteById() {
          return false;
        }
      }
    },
    engineClient,
    chartCalculator,
    clock,
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };
}

export function createDuplicateHarness(options = {}) {
  const sourceChart = createSourceChart();
  const charts = new Map([[sourceChart.chartId, sourceChart]]);
  const notes = [
    {
      noteId: 'source-note',
      chartId: sourceChart.chartId,
      userId: sourceChart.userId,
      content: 'Source note must not be copied.',
      createdAt: SOURCE_TIMESTAMP,
      updatedAt: SOURCE_TIMESTAMP
    }
  ];
  const calls = {
    authenticate: 0,
    findById: 0,
    engine: 0,
    create: 0,
    generated: 0,
    persisted: []
  };
  const calculatedChart = options.calculatedChart ?? createChartResult(222);
  const dependencies = createDependencies({
    calls,
    charts,
    notes,
    calculatedChart,
    engineFailure: options.engineFailure === true,
    persistenceFailure: options.persistenceFailure === true
  });
  const records = [];
  const app = createApp(dependencies, {
    observabilitySink: {
      write(record) {
        records.push(structuredClone(record));
      }
    }
  });

  return {
    app,
    calls,
    charts,
    notes,
    records,
    sourceChart,
    calculatedChart
  };
}

export function request(
  app,
  path,
  { method = 'POST', userId = OWNER_ID, body, origin = PUBLIC_WEB_ORIGIN } = {}
) {
  const headers = { Origin: origin };

  if (userId !== null) {
    headers['X-Test-User'] = userId;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return app.request(path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

export { DUPLICATE_TIMESTAMP, OWNER_ID, SOURCE_CHART_ID };
