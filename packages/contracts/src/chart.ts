import type { SkyBodyId, SkyMotionState, ZodiacSign } from './sky.js';

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
  /** Opaque canonical location identity; required by a production boundary. */
  locationResolutionId?: string;
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

/** Complete development-only Web view of a validated Engine result. */
export type BodyFactV2 = Readonly<
  Omit<BodyFact, 'bodyId' | 'retrograde' | 'house' | 'sign'> & {
    bodyId: SkyBodyId;
    sign: ZodiacSign;
    house: number;
    motionState: SkyMotionState;
  }
>;

export type AngleFactV2 = Readonly<
  Omit<AngleFact, 'angleId' | 'sign'> & {
    angleId: 'ASC' | 'MC';
    sign: ZodiacSign;
  }
>;

export type AspectFactV2 = Readonly<
  Omit<AspectFact, 'firstBodyId' | 'secondBodyId' | 'phaseState'> & {
    firstBodyId: SkyBodyId;
    secondBodyId: SkyBodyId;
    phaseState: AspectPhaseState;
    exactAngle: number;
    separation: number;
    orbLimit: number;
  }
>;

export interface EngineChartWarningV2 {
  readonly owner: 'ENGINE';
  readonly code: string;
  readonly subject: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, string | number | boolean>>;
  /** Null records that the Engine source does not supply severity. */
  readonly severity: null;
}

/** Versioned fact view; deliberately excluded from production ChartResult. */
export interface ChartResultV2 {
  readonly schemaVersion: '2.0.0';
  readonly engineVersion: string;
  readonly bodies: readonly BodyFactV2[];
  readonly angles: readonly AngleFactV2[];
  readonly houses: Readonly<HouseFacts>;
  readonly aspects: readonly AspectFactV2[];
  readonly warnings: readonly EngineChartWarningV2[];
}
