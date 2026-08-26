export type BirthTimeAmbiguityStatus =
  | 'EXACT'
  | 'AMBIGUOUS'
  | 'NONEXISTENT'
  | 'UNKNOWN_TIME';

/** Normalized birth data supplied to the Engine public API. */
export interface BirthRequest {
  localDate: string;
  localTime: string | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  resolvedUtcInstant: string | null;
  utcOffsetSeconds: number | null;
  timezoneDatabaseVersion: string;
  timezoneResolutionMethod: string;
  ambiguityStatus: BirthTimeAmbiguityStatus;
}

/** Normalized calculation intent; this is not UI form state. */
export interface ChartRequest {
  birth: BirthRequest;
  houseSystem: string;
}

export interface BodyFact {
  bodyId: string;
  longitude: number;
  sign: string;
  house: number | null;
  retrograde: boolean | null;
}

export interface AngleFact {
  angleId: string;
  longitude: number;
  sign: string;
}

export interface HouseCusp {
  house: number;
  longitude: number;
}

export interface HouseFacts {
  system: string;
  cusps: HouseCusp[];
}

export type AspectPhaseState = 'APPLYING' | 'EXACT' | 'SEPARATING';

export interface AspectFact {
  firstBodyId: string;
  secondBodyId: string;
  type: string;
  orb: number;
  phaseState: AspectPhaseState | null;
}

export type WarningSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface CalculationWarning {
  code: string;
  message: string;
  severity: WarningSeverity;
}

export interface CompleteScientificMetadata {
  configurationStatus: 'COMPLETE';
  astronomyConfigurationId: string;
  provenanceEnvelopeId: string | null;
}

export interface IncompleteResearchScientificMetadata {
  configurationStatus: 'INCOMPLETE_RESEARCH';
  astronomyConfigurationId: null;
  provenanceEnvelopeId: null;
  reason: 'INCOMPLETE_RESEARCH';
}

export type ScientificMetadata =
  | CompleteScientificMetadata
  | IncompleteResearchScientificMetadata;

interface ChartResultBase {
  schemaVersion: string;
  engineVersion: string;
  bodies: BodyFact[];
  angles: AngleFact[];
  houses: HouseFacts | null;
  aspects: AspectFact[];
  warnings: CalculationWarning[];
}

export type ChartResult =
  | (ChartResultBase & {
      calculationStatus: 'COMPLETE';
      metadata: CompleteScientificMetadata;
    })
  | (ChartResultBase & {
      calculationStatus: 'INCOMPLETE_RESEARCH';
      metadata: IncompleteResearchScientificMetadata;
    });

export * from './auth.js';
export * from './api/index.js';
export * from './feedback.js';
export * from './vault.js';
