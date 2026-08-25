import type { ChartResult } from '@natalnode/contracts';

export const WEB_UI_FIXTURE_METADATA = {
  usage: 'UI DEVELOPMENT ONLY',
  evidence: 'NOT SCIENTIFIC EVIDENCE',
  production: 'NOT PRODUCTION ASTRONOMY'
} as const;

export const WEB_UI_FIXTURE_V1 = {
  calculationStatus: 'INCOMPLETE_RESEARCH',
  schemaVersion: '1.0.0',
  engineVersion: 'UI_FIXTURE_V1',
  bodies: [
    {
      bodyId: 'Sun',
      longitude: 45.25,
      sign: 'Taurus',
      house: 11,
      retrograde: false
    },
    {
      bodyId: 'Moon',
      longitude: 183.75,
      sign: 'Libra',
      house: 4,
      retrograde: false
    },
    {
      bodyId: 'Mercury',
      longitude: 27.1,
      sign: 'Aries',
      house: 10,
      retrograde: false
    },
    {
      bodyId: 'Venus',
      longitude: 68.4,
      sign: 'Gemini',
      house: 12,
      retrograde: false
    },
    {
      bodyId: 'Mars',
      longitude: 109.8,
      sign: 'Cancer',
      house: 1,
      retrograde: false
    },
    {
      bodyId: 'Jupiter',
      longitude: 162.6,
      sign: 'Virgo',
      house: 3,
      retrograde: true
    },
    {
      bodyId: 'Saturn',
      longitude: 336.9,
      sign: 'Pisces',
      house: 9,
      retrograde: true
    },
    {
      bodyId: 'Uranus',
      longitude: 292.15,
      sign: 'Capricorn',
      house: 7,
      retrograde: true
    },
    {
      bodyId: 'Neptune',
      longitude: 298.3,
      sign: 'Capricorn',
      house: 7,
      retrograde: true
    },
    {
      bodyId: 'Pluto',
      longitude: 242.45,
      sign: 'Sagittarius',
      house: 5,
      retrograde: true
    }
  ],
  angles: [
    {
      angleId: 'ASC',
      longitude: 109.8,
      sign: 'Cancer'
    },
    {
      angleId: 'MC',
      longitude: 7.1,
      sign: 'Aries'
    }
  ],
  houses: {
    system: 'Placidus',
    cusps: [
      { house: 1, longitude: 109.8 },
      { house: 2, longitude: 138.6 },
      { house: 3, longitude: 169.25 },
      { house: 4, longitude: 199.8 },
      { house: 5, longitude: 229.35 },
      { house: 6, longitude: 259.1 },
      { house: 7, longitude: 289.8 },
      { house: 8, longitude: 318.6 },
      { house: 9, longitude: 349.25 },
      { house: 10, longitude: 7.1 },
      { house: 11, longitude: 37.35 },
      { house: 12, longitude: 68.6 }
    ]
  },
  aspects: [
    {
      firstBodyId: 'Sun',
      secondBodyId: 'Moon',
      type: 'opposition',
      orb: 1.5,
      phaseState: 'APPLYING'
    },
    {
      firstBodyId: 'Sun',
      secondBodyId: 'Saturn',
      type: 'sextile',
      orb: 0.15,
      phaseState: 'EXACT'
    },
    {
      firstBodyId: 'Moon',
      secondBodyId: 'Mars',
      type: 'square',
      orb: 3.2,
      phaseState: 'SEPARATING'
    },
    {
      firstBodyId: 'Mercury',
      secondBodyId: 'Venus',
      type: 'conjunction',
      orb: 2.15,
      phaseState: 'APPLYING'
    },
    {
      firstBodyId: 'Venus',
      secondBodyId: 'Jupiter',
      type: 'trine',
      orb: 4.05,
      phaseState: 'SEPARATING'
    },
    {
      firstBodyId: 'Mars',
      secondBodyId: 'Uranus',
      type: 'opposition',
      orb: 1.9,
      phaseState: 'EXACT'
    },
    {
      firstBodyId: 'Saturn',
      secondBodyId: 'Pluto',
      type: 'square',
      orb: 2.65,
      phaseState: 'SEPARATING'
    }
  ],
  warnings: [
    {
      code: 'UI_DEVELOPMENT_ONLY',
      message: WEB_UI_FIXTURE_METADATA.usage,
      severity: 'WARNING'
    },
    {
      code: 'NOT_SCIENTIFIC_EVIDENCE',
      message: WEB_UI_FIXTURE_METADATA.evidence,
      severity: 'WARNING'
    },
    {
      code: 'NOT_PRODUCTION_ASTRONOMY',
      message: WEB_UI_FIXTURE_METADATA.production,
      severity: 'WARNING'
    }
  ],
  metadata: {
    configurationStatus: 'INCOMPLETE_RESEARCH',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    reason: 'INCOMPLETE_RESEARCH'
  }
} satisfies ChartResult;
