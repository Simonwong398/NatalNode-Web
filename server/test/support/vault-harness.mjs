import { createApp } from '../../dist/app/create-app.js';
import { CachedChartCalculator } from '../../dist/app/cache/cached-chart-calculator.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const INITIAL_TIMESTAMP = '2026-08-26T12:00:00.000Z';
const CACHE_IDENTITY = {
  runtimeNamespace: 'development-mock',
  engineResultGeneration: 'UI_FIXTURE_V1',
  chartResultContractVersion: '1.0.0'
};

function createInitialChart() {
  return {
    chartId: 'chart-1',
    userId: 'owner-1',
    displayName: 'Original chart',
    category: 'SELF',
    tags: [],
    favorite: false,
    normalizedChartRequest: {
      birth: {
        localDate: '1990-01-01',
        localTime: null,
        locationLabel: 'Unknown',
        latitude: 0,
        longitude: 0,
        ianaTimeZone: 'UTC',
        resolvedUtcInstant: null,
        utcOffsetSeconds: null,
        timezoneDatabaseVersion: 'research',
        timezoneResolutionMethod: 'research',
        ambiguityStatus: 'UNKNOWN_TIME'
      },
      houseSystem: 'PLACIDUS'
    },
    canonicalChartResult: {
      schemaVersion: 'fixture-v1',
      engineVersion: 'mock-v1',
      bodies: [{ bodyId: 'SUN', longitude: 1, sign: 'ARIES', house: null, retrograde: null }],
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
    },
    engineVersion: 'mock-v1',
    chartSchemaVersion: 'fixture-v1',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    recordVersion: 1,
    scientificStatus: 'INPUT_ONLY',
    calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
    recordOrigin: 'DEVELOPMENT_FIXTURE',
    sourceContext: 'chart-workspace.development-fixture',
    timeAuthorityState: 'UNKNOWN_BIRTH_TIME',
    chartResultContractVersion: 'fixture-v1',
    scientificConfigurationIdentity: null,
    scientificProvenance: {
      schemaVersion: '1',
      recordOrigin: 'DEVELOPMENT_FIXTURE',
      sourceContext: 'chart-workspace.development-fixture',
      savedAt: INITIAL_TIMESTAMP,
      timeAuthorityState: 'UNKNOWN_BIRTH_TIME',
      calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
      chartResultContractVersion: 'fixture-v1',
      scientificConfigurationIdentity: null,
      provenanceEnvelopeId: null
    },
    savedAt: INITIAL_TIMESTAMP,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP
  };
}

function createHarness() {
  let chart = createInitialChart();
  const notes = [];
  const calls = { engine: 0 };
  let nextNoteId = 0;

  const engineClient = {
    async calculateChart() {
      calls.engine += 1;
      throw new Error('Vault management must not call EngineClient.');
    }
  };
  const clock = {
    now() {
      return INITIAL_TIMESTAMP;
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
    idGenerator: {
      generate() {
        nextNoteId += 1;
        return `note-${nextNoteId}`;
      }
    },
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts: {
        async create(nextChart) {
          chart = nextChart;
        },
        async findById(userId, chartId) {
          return chart !== null && chart.userId === userId && chart.chartId === chartId
            ? chart
            : null;
        },
        async listForUser(userId) {
          return chart !== null && chart.userId === userId ? [chart] : [];
        },
        async updateMetadata(userId, chartId, update) {
          if (
            chart === null ||
            chart.userId !== userId ||
            chart.chartId !== chartId
          ) {
            return null;
          }

          chart = {
            ...chart,
            ...(update.displayName === undefined
              ? {}
              : { displayName: update.displayName }),
            ...(update.category === undefined ? {} : { category: update.category }),
            ...(update.tags === undefined ? {} : { tags: [...update.tags] }),
            ...(update.favorite === undefined ? {} : { favorite: update.favorite }),
            updatedAt: '2026-08-26T12:01:00.000Z'
          };

          return chart;
        },
        async deleteById(userId, chartId) {
          if (
            chart === null ||
            chart.userId !== userId ||
            chart.chartId !== chartId
          ) {
            return false;
          }

          chart = null;
          notes.length = 0;
          return true;
        }
      },
      chartNotes: {
        async create(note) {
          notes.push(note);
        },
        async listForChart(userId, chartId) {
          return notes.filter((note) => note.userId === userId && note.chartId === chartId);
        },
        async updateContent(userId, chartId, noteId, update) {
          const note = notes.find(
            (candidate) =>
              candidate.userId === userId &&
              candidate.chartId === chartId &&
              candidate.noteId === noteId
          );

          if (note === undefined) {
            return null;
          }

          Object.assign(note, {
            content: update.content,
            updatedAt: '2026-08-26T12:02:00.000Z'
          });
          return note;
        },
        async deleteById(userId, chartId, noteId) {
          const noteIndex = notes.findIndex(
            (candidate) =>
              candidate.userId === userId &&
              candidate.chartId === chartId &&
              candidate.noteId === noteId
          );

          if (noteIndex < 0) {
            return false;
          }

          notes.splice(noteIndex, 1);
          return true;
        }
      }
    },
    engineClient,
    chartCalculator: new CachedChartCalculator({
      engineClient,
      clock,
      cacheIdentity: CACHE_IDENTITY
    }),
    clock,
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies),
    calls,
    getChart: () => chart,
    notes
  };
}

function request(
  app,
  path,
  {
    method = 'GET',
    userId = 'owner-1',
    body,
    origin = PUBLIC_WEB_ORIGIN
  } = {}
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
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export { createHarness, request };
