import type {
  AngleFact,
  AspectFact,
  AspectPhaseState,
  BirthRequest,
  BirthTimeAmbiguityStatus,
  BodyFact,
  CalculationWarning,
  ChartRequest,
  ChartResult,
  ChartResultV2,
  CompleteScientificMetadata,
  HouseCusp,
  HouseFacts,
  IncompleteResearchScientificMetadata,
  ScientificMetadata,
  WarningSeverity
} from '@natalnode/contracts';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;

type Assert<Condition extends true> = Condition;

type BirthAmbiguityRelationship = Assert<
  Equal<BirthRequest['ambiguityStatus'], BirthTimeAmbiguityStatus>
>;
type ChartRequestRelationship = Assert<Equal<ChartRequest['birth'], BirthRequest>>;
type BodyRelationship = Assert<Equal<ChartResult['bodies'][number], BodyFact>>;
type AngleRelationship = Assert<Equal<ChartResult['angles'][number], AngleFact>>;
type HouseCuspRelationship = Assert<Equal<HouseFacts['cusps'][number], HouseCusp>>;
type HouseRelationship = Assert<Equal<ChartResult['houses'], HouseFacts | null>>;
type AspectPhaseRelationship = Assert<
  Equal<AspectFact['phaseState'], AspectPhaseState | null>
>;
type AspectRelationship = Assert<Equal<ChartResult['aspects'][number], AspectFact>>;
type WarningSeverityRelationship = Assert<
  Equal<CalculationWarning['severity'], WarningSeverity>
>;
type WarningRelationship = Assert<
  Equal<ChartResult['warnings'][number], CalculationWarning>
>;
type ScientificMetadataRelationship = Assert<
  Equal<
    ScientificMetadata,
    CompleteScientificMetadata | IncompleteResearchScientificMetadata
  >
>;
type ChartMetadataRelationship = Assert<Equal<ChartResult['metadata'], ScientificMetadata>>;

declare const developmentResultV2: ChartResultV2;
// @ts-expect-error V2 has no production calculation status or scientific metadata.
const productionResultCannotUseV2: ChartResult = developmentResultV2;
void productionResultCannotUseV2;
