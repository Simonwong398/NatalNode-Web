import type {
  AspectPhaseState,
  CalculationWarning,
  CompleteScientificMetadata,
  IncompleteResearchScientificMetadata
} from './chart.js';

export interface SkySnapshotRequest {
  /** ISO 8601 UTC serialization of the instant to calculate. */
  readonly atUtc: string;
}

export interface SkyEventsRequest {
  /** ISO 8601 UTC serialization of the interval start. */
  readonly startUtc: string;
  /** ISO 8601 UTC serialization of the interval end. */
  readonly endUtc: string;
}

export type SkyZodiacModel = 'TROPICAL';
export type SkyReferenceFrame = 'GEOCENTRIC';

export type SkyBodyId =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type SkyMotionState = 'DIRECT' | 'RETROGRADE' | 'STATIONARY';
export type SkyDirectionalMotionState = Exclude<SkyMotionState, 'STATIONARY'>;

/** Engine-supplied position and motion facts for a supported Sky body. */
export interface SkyBodyPosition {
  readonly bodyId: SkyBodyId;
  readonly longitude: number;
  readonly sign: ZodiacSign;
  readonly motionState: SkyMotionState | null;
}

export type SkyMajorAspectType =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile';

/** Engine-supplied major-aspect fact active at a snapshot instant. */
export interface SkyCurrentAspect {
  readonly firstBodyId: SkyBodyId;
  readonly secondBodyId: SkyBodyId;
  readonly aspectType: SkyMajorAspectType;
  readonly orb: number | null;
  readonly phaseState: AspectPhaseState | null;
}

interface SkyEventTiming {
  /** ISO 8601 UTC serialization, or null when the Engine supplies no exact instant. */
  readonly exactAt: string | null;
  /** Optional Engine-supplied ISO 8601 UTC serialization; never inferred by Web. */
  readonly activeFromUtc?: string;
  /** Optional Engine-supplied ISO 8601 UTC serialization; never inferred by Web. */
  readonly activeUntilUtc?: string;
}

export interface SkyIngressEvent extends SkyEventTiming {
  readonly eventType: 'INGRESS';
  readonly bodyId: SkyBodyId;
  readonly fromSign: ZodiacSign;
  readonly toSign: ZodiacSign;
}

export interface SkyStationEvent extends SkyEventTiming {
  readonly eventType: 'STATION';
  readonly bodyId: SkyBodyId;
  readonly resultingMotionState: SkyDirectionalMotionState;
}

export interface SkyExactMajorAspectEvent extends SkyEventTiming {
  readonly eventType: 'EXACT_MAJOR_ASPECT';
  readonly firstBodyId: SkyBodyId;
  readonly secondBodyId: SkyBodyId;
  readonly aspectType: SkyMajorAspectType;
  readonly exactAt: string;
}

export type SkyLunationKind = 'NEW_MOON' | 'FULL_MOON';

export interface SkyLunationEvent extends SkyEventTiming {
  readonly eventType: 'LUNATION';
  readonly kind: SkyLunationKind;
  readonly exactAt: string;
}

export type SkyLunarPhaseKind = 'FIRST_QUARTER' | 'LAST_QUARTER';

export interface SkyLunarPhaseEvent extends SkyEventTiming {
  readonly eventType: 'LUNAR_PHASE';
  readonly kind: SkyLunarPhaseKind;
  readonly exactAt: string;
}

export interface SkyEclipseEvent extends SkyEventTiming {
  readonly eventType: 'ECLIPSE';
  readonly exactAt: string;
}

export type SkyEvent =
  | SkyIngressEvent
  | SkyStationEvent
  | SkyExactMajorAspectEvent
  | SkyLunationEvent
  | SkyLunarPhaseEvent
  | SkyEclipseEvent;

export type SkyEventType = SkyEvent['eventType'];

interface SkyResultBase {
  readonly schemaVersion: string;
  readonly engineVersion: string;
  readonly zodiacModel: SkyZodiacModel;
  readonly referenceFrame: SkyReferenceFrame;
  readonly warnings: readonly CalculationWarning[];
}

interface SkySnapshotResultBase extends SkyResultBase {
  /** ISO 8601 UTC serialization of the calculated snapshot instant. */
  readonly atUtc: string;
  readonly bodyPositions: readonly SkyBodyPosition[];
  readonly currentAspects: readonly SkyCurrentAspect[];
}

interface SkyEventsResultBase extends SkyResultBase {
  /** ISO 8601 UTC serialization of the calculated interval start. */
  readonly startUtc: string;
  /** ISO 8601 UTC serialization of the calculated interval end. */
  readonly endUtc: string;
  readonly events: readonly SkyEvent[];
}

type SkyCalculationResult<ResultBase> =
  | (ResultBase & {
      readonly calculationStatus: 'COMPLETE';
      readonly metadata: CompleteScientificMetadata;
    })
  | (ResultBase & {
      readonly calculationStatus: 'INCOMPLETE_RESEARCH';
      readonly metadata: IncompleteResearchScientificMetadata;
    });

export type SkySnapshotResult = SkyCalculationResult<SkySnapshotResultBase>;
export type SkyEventsResult = SkyCalculationResult<SkyEventsResultBase>;
