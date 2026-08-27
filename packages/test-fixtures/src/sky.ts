import type {
  SkyEventsResult,
  SkySnapshotResult
} from '@natalnode/contracts';

// Fixed, invented development fixtures; never live or production astronomy.
export const SKY_FIXTURE_AT_UTC = '2026-09-01T12:00:00.000Z';
export const SKY_FIXTURE_START_UTC = '2026-09-01T00:00:00.000Z';
export const SKY_FIXTURE_END_UTC = '2026-09-08T00:00:00.000Z';

const SKY_FIXTURE_WARNINGS = [
  {
    code: 'UI_DEVELOPMENT_ONLY',
    message: 'UI DEVELOPMENT ONLY',
    severity: 'WARNING'
  },
  {
    code: 'NOT_SCIENTIFIC_EVIDENCE',
    message: 'NOT SCIENTIFIC EVIDENCE',
    severity: 'WARNING'
  },
  {
    code: 'NOT_PRODUCTION_ASTRONOMY',
    message: 'NOT PRODUCTION ASTRONOMY',
    severity: 'WARNING'
  }
] as const;

const SKY_FIXTURE_METADATA = {
  configurationStatus: 'INCOMPLETE_RESEARCH',
  astronomyConfigurationId: null,
  provenanceEnvelopeId: null,
  reason: 'INCOMPLETE_RESEARCH'
} as const;

export const SKY_SNAPSHOT_FIXTURE_V1 = {
  calculationStatus: 'INCOMPLETE_RESEARCH',
  schemaVersion: '1.0.0',
  engineVersion: 'SKY_UI_FIXTURE_V1',
  zodiacModel: 'TROPICAL',
  referenceFrame: 'GEOCENTRIC',
  atUtc: SKY_FIXTURE_AT_UTC,
  bodyPositions: [
    {
      bodyId: 'Sun',
      longitude: 158.4,
      sign: 'Virgo',
      motionState: 'DIRECT'
    },
    {
      bodyId: 'Moon',
      longitude: 248.75,
      sign: 'Sagittarius',
      motionState: 'DIRECT'
    },
    {
      bodyId: 'Mercury',
      longitude: 141.2,
      sign: 'Leo',
      motionState: 'DIRECT'
    },
    {
      bodyId: 'Venus',
      longitude: 201.8,
      sign: 'Libra',
      motionState: 'DIRECT'
    },
    {
      bodyId: 'Mars',
      longitude: 95.3,
      sign: 'Cancer',
      motionState: 'DIRECT'
    },
    {
      bodyId: 'Jupiter',
      longitude: 128.7,
      sign: 'Leo',
      motionState: 'DIRECT'
    },
    {
      bodyId: 'Saturn',
      longitude: 338.55,
      sign: 'Pisces',
      motionState: 'RETROGRADE'
    },
    {
      bodyId: 'Uranus',
      longitude: 62.4,
      sign: 'Gemini',
      motionState: 'STATIONARY'
    },
    {
      bodyId: 'Neptune',
      longitude: 1.9,
      sign: 'Aries',
      motionState: 'RETROGRADE'
    },
    {
      bodyId: 'Pluto',
      longitude: 303.7,
      sign: 'Aquarius',
      motionState: 'RETROGRADE'
    }
  ],
  currentAspects: [
    {
      firstBodyId: 'Sun',
      secondBodyId: 'Saturn',
      aspectType: 'opposition',
      orb: 0.15,
      phaseState: 'APPLYING'
    },
    {
      firstBodyId: 'Moon',
      secondBodyId: 'Jupiter',
      aspectType: 'trine',
      orb: 0.05,
      phaseState: 'SEPARATING'
    },
    {
      firstBodyId: 'Mercury',
      secondBodyId: 'Venus',
      aspectType: 'sextile',
      orb: 0.6,
      phaseState: 'APPLYING'
    }
  ],
  warnings: SKY_FIXTURE_WARNINGS,
  metadata: SKY_FIXTURE_METADATA
} satisfies SkySnapshotResult;

export const SKY_EVENTS_FIXTURE_V1 = {
  calculationStatus: 'INCOMPLETE_RESEARCH',
  schemaVersion: '1.0.0',
  engineVersion: 'SKY_UI_FIXTURE_V1',
  zodiacModel: 'TROPICAL',
  referenceFrame: 'GEOCENTRIC',
  startUtc: SKY_FIXTURE_START_UTC,
  endUtc: SKY_FIXTURE_END_UTC,
  events: [
    {
      eventType: 'INGRESS',
      bodyId: 'Venus',
      fromSign: 'Libra',
      toSign: 'Scorpio',
      exactAt: '2026-09-02T08:15:00.000Z'
    },
    {
      eventType: 'STATION',
      bodyId: 'Uranus',
      resultingMotionState: 'RETROGRADE',
      exactAt: '2026-09-03T16:40:00.000Z'
    },
    {
      eventType: 'EXACT_MAJOR_ASPECT',
      firstBodyId: 'Sun',
      secondBodyId: 'Saturn',
      aspectType: 'opposition',
      exactAt: '2026-09-05T10:30:00.000Z',
      activeFromUtc: '2026-09-04T18:00:00.000Z',
      activeUntilUtc: '2026-09-05T22:00:00.000Z'
    },
    {
      eventType: 'LUNATION',
      kind: 'FULL_MOON',
      exactAt: '2026-09-06T21:05:00.000Z'
    }
  ],
  warnings: SKY_FIXTURE_WARNINGS,
  metadata: SKY_FIXTURE_METADATA
} satisfies SkyEventsResult;
