/**
 * Provider-neutral contracts for the future Interpretation Signal layer.
 *
 * These types describe supplied facts and derived semantic candidates. They do
 * not calculate astronomy, contain prose, or identify a scientific provider.
 */

export const INTERPRETATION_SIGNAL_DOMAINS = Object.freeze([
  'SELF',
  'EMOTIONAL',
  'RELATIONSHIP',
  'COMMUNICATION',
  'WORK_CREATION',
  'ACTION_DECISION'
] as const);

export type InterpretationSignalDomain =
  (typeof INTERPRETATION_SIGNAL_DOMAINS)[number];

export const INTERPRETATION_SIGNAL_DIRECTIONS = Object.freeze([
  'SUPPORTIVE',
  'CHALLENGING',
  'MIXED',
  'NEUTRAL'
] as const);

export type InterpretationSignalDirection =
  (typeof INTERPRETATION_SIGNAL_DIRECTIONS)[number];

export const INTERPRETATION_SIGNAL_INTENSITIES = Object.freeze([
  'SUBTLE',
  'NOTICEABLE',
  'STRONG',
  'DOMINANT'
] as const);

export type InterpretationSignalIntensity =
  (typeof INTERPRETATION_SIGNAL_INTENSITIES)[number];

export const INTERPRETATION_CONFIDENCE_LEVELS = Object.freeze([
  'HIGH',
  'MEDIUM',
  'LOW'
] as const);

export type InterpretationConfidence =
  (typeof INTERPRETATION_CONFIDENCE_LEVELS)[number];

export const INTERPRETATION_PRIORITIES = Object.freeze([
  'BACKGROUND',
  'THEMATIC',
  'ACTIVE',
  'MOMENTARY'
] as const);

export type InterpretationPriority = (typeof INTERPRETATION_PRIORITIES)[number];

export type InterpretationSignalSourceAuthority =
  | 'AUTHORITATIVE_ENGINE'
  | 'DEVELOPMENT_FIXTURE'
  | 'INCOMPLETE_RESEARCH';

export type InterpretationSignalAuthority =
  | 'AUTHORITATIVE'
  | 'DEVELOPMENT_ONLY';

/**
 * The vocabulary names the kind of supplied fact a rule may reference. It is
 * not a promise that every kind is currently available from the Engine.
 */
export type InterpretationFactKind =
  | 'NATAL_BODY_POSITION'
  | 'NATAL_ANGLE_POSITION'
  | 'NATAL_HOUSE_PLACEMENT'
  | 'NATAL_ASPECT'
  | 'TRANSIT_BODY_POSITION'
  | 'TRANSIT_NATAL_ASPECT'
  | 'TRANSIT_NATAL_ANGLE'
  | 'TRANSIT_HOUSE_PLACEMENT'
  | 'MOON_POSITION'
  | 'MOON_PHASE'
  | 'MOTION_STATE'
  | 'TIME_AUTHORITY'
  | 'OTHER';

export interface InterpretationRulesVersion {
  readonly id: string;
  readonly version: string;
}

export interface InterpretationRuleIdentity {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly interpretationRulesVersion: InterpretationRulesVersion;
}

/**
 * A narrow pointer into an Engine result. A caller may include a stable fact
 * identity only when the Engine supplies one; this layer never invents one.
 */
export interface InterpretationFactReference {
  readonly factKind: InterpretationFactKind;
  readonly canonicalPath: string;
  readonly canonicalFactIdentity?: string;
  readonly scientificConfigurationIdentity?: string;
  readonly provenanceEnvelopeId?: string;
}

export interface InterpretationTemporalWindow {
  /** Values are supplied by the authoritative source; no window is inferred. */
  readonly startsAt: string;
  readonly peaksAt: string | null;
  readonly endsAt: string;
  readonly canonicalTimezone: string;
}

export interface InterpretationSignalRankingMetadata {
  /** All values are normalized internal metadata and are never user-facing. */
  readonly baseImportance: number;
  readonly evidenceStrength: number;
  readonly temporalRelevance: number;
  readonly durationWeight: number;
  readonly repetitionPenalty: number;
}

export interface InterpretationSignalProvenance {
  readonly sourceAuthority: InterpretationSignalSourceAuthority;
  /** A supplied Engine-result identity or canonical result path. */
  readonly engineResultReference: string;
  readonly sourceFactRefs: readonly InterpretationFactReference[];
  readonly scientificConfigurationIdentity: string | null;
  readonly provenanceEnvelopeId: string | null;
}

export interface InterpretationSignal {
  /** Interpretation namespace only; never a scientific fact identity. */
  readonly signalId: string;
  readonly domain: InterpretationSignalDomain;
  readonly direction: InterpretationSignalDirection;
  /** Internal normalized strength. It must not be presented as user precision. */
  readonly internalStrength: number;
  readonly intensity: InterpretationSignalIntensity;
  /** Evidence quality, not probability and not a promise of an outcome. */
  readonly confidence: InterpretationConfidence;
  readonly priority: InterpretationPriority;
  /** A stable semantic theme key or label supplied by the rule. */
  readonly theme: string;
  readonly temporalWindow?: InterpretationTemporalWindow;
  readonly rule: InterpretationRuleIdentity;
  readonly ranking: InterpretationSignalRankingMetadata;
  readonly provenance: InterpretationSignalProvenance;
  readonly authority: InterpretationSignalAuthority;
}

/** A rule cannot declare authority; the registry derives it from its input. */
export type InterpretationSignalDraft = Omit<
  InterpretationSignal,
  'authority' | 'provenance'
> & {
  readonly provenance: Omit<InterpretationSignalProvenance, 'sourceAuthority'>;
};

export interface InterpretationFactInput {
  readonly reference: InterpretationFactReference;
  readonly available: boolean;
  /** Only normalized scalar attributes cross this foundation boundary. */
  readonly attributes: Readonly<
    Record<string, string | number | boolean | null>
  >;
}

export type InterpretationBirthTimeAuthority = 'KNOWN' | 'UNKNOWN';

export interface InterpretationRuleContext {
  readonly sourceAuthority: InterpretationSignalSourceAuthority;
  readonly birthTimeAuthority: InterpretationBirthTimeAuthority;
  readonly facts: readonly InterpretationFactInput[];
}

export interface InterpretationRulePrerequisites {
  readonly requiredFactKinds?: readonly InterpretationFactKind[];
  readonly requiresKnownBirthTime?: boolean;
  readonly allowedSourceAuthorities?: readonly InterpretationSignalSourceAuthority[];
}

export interface InterpretationSignalRule {
  readonly identity: InterpretationRuleIdentity;
  readonly prerequisites: InterpretationRulePrerequisites;
  readonly matches: (context: InterpretationRuleContext) => boolean;
  readonly createSignal: (
    context: InterpretationRuleContext
  ) => InterpretationSignalDraft;
}

export type InterpretationPeriodKind = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface InterpretationPeriodIdentity {
  readonly kind: InterpretationPeriodKind;
  /** Local calendar key supplied by the period authority. */
  readonly periodKey: string;
  readonly canonicalTimezone: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface InterpretationSignalSection {
  readonly signalIds: readonly string[];
}

export interface InterpretationTimelineSegment {
  readonly segmentKey: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly signalIds: readonly string[];
}

export interface InterpretationQuoteSlot {
  readonly signalIds: readonly string[];
  readonly maxCharacters: number | null;
}

export interface DailySignalSet {
  readonly period: InterpretationPeriodIdentity & { readonly kind: 'DAILY' };
  readonly signals: readonly InterpretationSignal[];
  readonly heroSignalId: string | null;
  readonly supportingSignalIds: readonly string[];
  readonly themes: readonly string[];
  readonly watchOuts: readonly string[];
  readonly actionSuggestions: readonly string[];
  readonly provenance: readonly InterpretationSignalProvenance[];
}

export interface WeeklySignalSet {
  readonly period: InterpretationPeriodIdentity & { readonly kind: 'WEEKLY' };
  readonly signals: readonly InterpretationSignal[];
  readonly heroTheme: string | null;
  readonly coreThemes: readonly string[];
  readonly timelineSegments: readonly InterpretationTimelineSegment[];
  readonly relationship: InterpretationSignalSection;
  readonly workCreation: InterpretationSignalSection;
  readonly innerState: InterpretationSignalSection;
  readonly actionDecision: InterpretationSignalSection;
  readonly watchOut: InterpretationSignalSection;
  readonly bestWindow: InterpretationSignalSection | null;
  readonly astrologerView: InterpretationSignalSection;
  readonly quoteSlot: InterpretationQuoteSlot | null;
  readonly provenance: readonly InterpretationSignalProvenance[];
}

export interface MonthlySignalSet {
  readonly period: InterpretationPeriodIdentity & { readonly kind: 'MONTHLY' };
  readonly signals: readonly InterpretationSignal[];
  readonly theme: string | null;
  readonly majorPeriods: readonly InterpretationTimelineSegment[];
  readonly relationship: InterpretationSignalSection;
  readonly workCreation: InterpretationSignalSection;
  readonly innerState: InterpretationSignalSection;
  readonly actionDecision: InterpretationSignalSection;
  readonly lunarMoments: readonly InterpretationSignalSection[];
  readonly reflectionPrompt: InterpretationSignalSection | null;
  readonly provenance: readonly InterpretationSignalProvenance[];
}

export type InterpretationContentStyle =
  | 'CLEAR'
  | 'CASUAL'
  | 'ASTROLOGER'
  | 'SHARE';

export interface InterpretationApprovedFactExcerpt {
  readonly factReference: InterpretationFactReference;
  readonly text: string;
}

/** Future renderer input; it intentionally excludes raw chart and birth input. */
export interface InterpretationContentInput {
  readonly approvedSignals: readonly InterpretationSignal[];
  readonly approvedFactExcerpts: readonly InterpretationApprovedFactExcerpt[];
  readonly period: InterpretationPeriodIdentity;
  readonly locale: string;
  readonly style: InterpretationContentStyle;
  readonly contentPolicyVersion: string;
}

export interface InterpretationSignalComposition {
  readonly direction: InterpretationSignalDirection;
  readonly dominantSignalId: string;
  readonly supportingSignalIds: readonly string[];
  readonly sourceSignalIds: readonly string[];
  readonly supportiveSignalIds: readonly string[];
  readonly challengingSignalIds: readonly string[];
  readonly sourceFactRefs: readonly InterpretationFactReference[];
}
