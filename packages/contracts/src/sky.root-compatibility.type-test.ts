import type {
  AspectPhaseState,
  CalculationWarning,
  ScientificMetadata,
  SkyBodyId,
  SkyBodyPosition,
  SkyCurrentAspect,
  SkyDirectionalMotionState,
  SkyEclipseEvent,
  SkyEvent,
  SkyEventsRequest,
  SkyEventsResult,
  SkyEventType,
  SkyExactMajorAspectEvent,
  SkyIngressEvent,
  SkyLunarPhaseEvent,
  SkyLunarPhaseKind,
  SkyLunationEvent,
  SkyLunationKind,
  SkyMajorAspectType,
  SkyMotionState,
  SkyReferenceFrame,
  SkySnapshotRequest,
  SkySnapshotResult,
  SkyStationEvent,
  SkyZodiacModel,
  ZodiacSign
} from '@natalnode/contracts';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;

type Assert<Condition extends true> = Condition;
type KeysOfUnion<Value> = Value extends Value ? keyof Value : never;

type SnapshotRequestShape = Assert<
  Equal<SkySnapshotRequest, { readonly atUtc: string }>
>;
type EventsRequestShape = Assert<
  Equal<
    SkyEventsRequest,
    { readonly startUtc: string; readonly endUtc: string }
  >
>;

type BodyIdValues = Assert<
  Equal<
    SkyBodyId,
    | 'Sun'
    | 'Moon'
    | 'Mercury'
    | 'Venus'
    | 'Mars'
    | 'Jupiter'
    | 'Saturn'
    | 'Uranus'
    | 'Neptune'
    | 'Pluto'
  >
>;
type ZodiacSignValues = Assert<
  Equal<
    ZodiacSign,
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
    | 'Pisces'
  >
>;
type MajorAspectValues = Assert<
  Equal<
    SkyMajorAspectType,
    'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile'
  >
>;
type MotionStateValues = Assert<
  Equal<SkyMotionState, 'DIRECT' | 'RETROGRADE' | 'STATIONARY'>
>;
type DirectionalMotionStateValues = Assert<
  Equal<SkyDirectionalMotionState, 'DIRECT' | 'RETROGRADE'>
>;
type EventTypeValues = Assert<
  Equal<
    SkyEventType,
    | 'INGRESS'
    | 'STATION'
    | 'EXACT_MAJOR_ASPECT'
    | 'LUNATION'
    | 'LUNAR_PHASE'
    | 'ECLIPSE'
  >
>;
type EventTypeRelationship = Assert<Equal<SkyEventType, SkyEvent['eventType']>>;

type ZodiacModelValue = Assert<Equal<SkyZodiacModel, 'TROPICAL'>>;
type ReferenceFrameValue = Assert<Equal<SkyReferenceFrame, 'GEOCENTRIC'>>;
type SnapshotZodiacModel = Assert<
  Equal<SkySnapshotResult['zodiacModel'], 'TROPICAL'>
>;
type SnapshotReferenceFrame = Assert<
  Equal<SkySnapshotResult['referenceFrame'], 'GEOCENTRIC'>
>;
type EventsZodiacModel = Assert<
  Equal<SkyEventsResult['zodiacModel'], 'TROPICAL'>
>;
type EventsReferenceFrame = Assert<
  Equal<SkyEventsResult['referenceFrame'], 'GEOCENTRIC'>
>;

type BodyPositionBody = Assert<Equal<SkyBodyPosition['bodyId'], SkyBodyId>>;
type BodyPositionSign = Assert<Equal<SkyBodyPosition['sign'], ZodiacSign>>;
type BodyPositionMotion = Assert<
  Equal<SkyBodyPosition['motionState'], SkyMotionState | null>
>;
type CurrentAspectBodies = Assert<
  Equal<
    SkyCurrentAspect['firstBodyId'] | SkyCurrentAspect['secondBodyId'],
    SkyBodyId
  >
>;
type CurrentAspectPhase = Assert<
  Equal<SkyCurrentAspect['phaseState'], AspectPhaseState | null>
>;
type CurrentAspectIsNotEvent = Assert<
  Equal<SkyCurrentAspect extends SkyEvent ? true : false, false>
>;
type CurrentAspectHasNoEventTiming = Assert<
  Equal<Extract<keyof SkyCurrentAspect, 'eventType' | 'exactAt'>, never>
>;

type EventUnion = Assert<
  Equal<
    SkyEvent,
    | SkyIngressEvent
    | SkyStationEvent
    | SkyExactMajorAspectEvent
    | SkyLunationEvent
    | SkyLunarPhaseEvent
    | SkyEclipseEvent
  >
>;
type IngressEventFields = Assert<
  Equal<
    Pick<SkyIngressEvent, 'eventType' | 'bodyId' | 'fromSign' | 'toSign'>,
    {
      readonly eventType: 'INGRESS';
      readonly bodyId: SkyBodyId;
      readonly fromSign: ZodiacSign;
      readonly toSign: ZodiacSign;
    }
  >
>;
type StationEventFields = Assert<
  Equal<
    Pick<SkyStationEvent, 'eventType' | 'bodyId' | 'resultingMotionState'>,
    {
      readonly eventType: 'STATION';
      readonly bodyId: SkyBodyId;
      readonly resultingMotionState: SkyDirectionalMotionState;
    }
  >
>;
type ExactAspectEventFields = Assert<
  Equal<
    Pick<
      SkyExactMajorAspectEvent,
      'eventType' | 'firstBodyId' | 'secondBodyId' | 'aspectType' | 'exactAt'
    >,
    {
      readonly eventType: 'EXACT_MAJOR_ASPECT';
      readonly firstBodyId: SkyBodyId;
      readonly secondBodyId: SkyBodyId;
      readonly aspectType: SkyMajorAspectType;
      readonly exactAt: string;
    }
  >
>;
type ExactAspectDiscriminator = Assert<
  Equal<
    Extract<SkyEvent, { eventType: 'EXACT_MAJOR_ASPECT' }>,
    SkyExactMajorAspectEvent
  >
>;
type LunationKinds = Assert<
  Equal<SkyLunationKind, 'NEW_MOON' | 'FULL_MOON'>
>;
type LunationEventFields = Assert<
  Equal<
    Pick<SkyLunationEvent, 'eventType' | 'kind' | 'exactAt'>,
    {
      readonly eventType: 'LUNATION';
      readonly kind: SkyLunationKind;
      readonly exactAt: string;
    }
  >
>;
type LunarPhaseKinds = Assert<
  Equal<SkyLunarPhaseKind, 'FIRST_QUARTER' | 'LAST_QUARTER'>
>;
type LunarPhaseEventFields = Assert<
  Equal<
    Pick<SkyLunarPhaseEvent, 'eventType' | 'kind' | 'exactAt'>,
    {
      readonly eventType: 'LUNAR_PHASE';
      readonly kind: SkyLunarPhaseKind;
      readonly exactAt: string;
    }
  >
>;
type EclipseEventFields = Assert<
  Equal<
    Pick<SkyEclipseEvent, 'eventType' | 'exactAt'>,
    { readonly eventType: 'ECLIPSE'; readonly exactAt: string }
  >
>;
type SharedEventTiming = Assert<
  Equal<
    Pick<SkyEvent, 'exactAt' | 'activeFromUtc' | 'activeUntilUtc'>,
    {
      readonly exactAt: string | null;
      readonly activeFromUtc?: string;
      readonly activeUntilUtc?: string;
    }
  >
>;

type PublicSkyKeys =
  | keyof SkySnapshotRequest
  | keyof SkyEventsRequest
  | keyof SkySnapshotResult
  | keyof SkyEventsResult
  | keyof SkyBodyPosition
  | keyof SkyCurrentAspect
  | KeysOfUnion<SkyEvent>;
type LocationDerivedKeys =
  | 'house'
  | 'houses'
  | 'houseSystem'
  | 'angles'
  | 'angleId'
  | 'location'
  | 'locationLabel'
  | 'latitude'
  | 'ianaTimeZone'
  | 'longitudeOfPlace';
type NoLocationDerivedFields = Assert<
  Equal<Extract<PublicSkyKeys, LocationDerivedKeys>, never>
>;

type EditorialOrInterpretiveKeys =
  | 'salience'
  | 'salienceScore'
  | 'importance'
  | 'importanceScore'
  | 'scientificImportance'
  | 'priority'
  | 'priorityScore'
  | 'displayCategory'
  | 'meaning'
  | 'interpretation'
  | 'forecast'
  | 'advice'
  | 'mood'
  | 'theme'
  | 'energy';
type NoEditorialOrInterpretiveEventFields = Assert<
  Equal<Extract<KeysOfUnion<SkyEvent>, EditorialOrInterpretiveKeys>, never>
>;

type SnapshotMetadataRelationship = Assert<
  Equal<SkySnapshotResult['metadata'], ScientificMetadata>
>;
type EventsMetadataRelationship = Assert<
  Equal<SkyEventsResult['metadata'], ScientificMetadata>
>;
type SnapshotWarningRelationship = Assert<
  Equal<SkySnapshotResult['warnings'][number], CalculationWarning>
>;
type EventsWarningRelationship = Assert<
  Equal<SkyEventsResult['warnings'][number], CalculationWarning>
>;
