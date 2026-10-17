/** Private, development-only validator and lossless Web V2 result projection. */

import type {
  ChartRequest,
  ChartResultV2,
  EngineChartWarningV2,
  SkyBodyId,
  SkyMotionState,
  TimeResolutionEvidence,
  ZodiacSign
} from '@natalnode/contracts';
import { assertVerifiedUtcInstant } from '../../time-resolution/birth-time-resolution-service.js';
import type { VerifiedUtcInstant } from '../../time-resolution/time-resolution-contract.js';

const ENGINE_SCHEMA_VERSION = '1.0.0';
const ENGINE_VERSION = '0.1.0-foundation';
const WEB_RESULT_SCHEMA_VERSION = '2.0.0';
const MAPPING_POLICY_ID = 'ENGINE_WEB_RESULT_MAPPING_V2';
const SIGN_POLICY_VERSION = 'NatalNode boundary policy v1';

const BODY_IDS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
] as const;
const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;
const HOUSE_SYSTEMS = ['placidus', 'whole-sign', 'equal'] as const;
const ASPECT_TYPES = [
  'conjunction', 'opposition', 'trine', 'square', 'sextile',
  'quincunx', 'semi-sextile', 'semi-square', 'sesquiquadrate', 'quintile', 'bi-quintile'
] as const;
const MOTIONS = ['direct', 'station', 'retrograde'] as const;
const WARNING_CODES = [
  'NEAR_SIGN_BOUNDARY', 'NEAR_HOUSE_CUSP', 'NEAR_ASPECT_BOUNDARY', 'NEAR_STATION'
] as const;
const REDISTRIBUTION_STATUSES = ['cleared', 'pending', 'blocked', 'reference-only', 'unknown'] as const;
const COMPLETENESS_DIAGNOSTIC_CODES = [
  'MISSING_PROVENANCE_SCHEMA', 'MISSING_ENGINE_IDENTITY', 'MISSING_TIME_POLICY_IDENTITY',
  'MISSING_PROVIDER_IDENTITY', 'MISSING_PROVIDER_IMPLEMENTATION_IDENTITY', 'MISSING_BODY_MODEL_ROUTE',
  'MISSING_MODEL_IDENTITY', 'MISSING_ARTIFACT_IDENTITY', 'MISSING_ARTIFACT_PROVENANCE_IDENTITY',
  'INVALID_SHA256_IDENTITY', 'INVALID_ARTIFACT_PAYLOAD_SHA256', 'INVALID_ARTIFACT_MANIFEST_IDENTITY',
  'MISSING_SOURCE_IDENTITY', 'MISSING_GENERATOR_IDENTITY', 'MISSING_SCIENTIFIC_POLICY_IDENTITY',
  'MISSING_VALIDATION_EVIDENCE_IDENTITY', 'MISSING_GOVERNANCE_EVIDENCE_IDENTITY',
  'MISSING_RIGHTS_STATUS_IDENTITY', 'MISSING_CONFIGURATION_IDENTITY', 'INVALID_PROVENANCE_SCHEMA',
  'MISSING_RUNTIME_SOURCE_BINDING', 'INVALID_RUNTIME_SOURCE_BINDING'
] as const;

const FORBIDDEN_ADMISSION_KEYS = new Set([
  'productionAdmission', 'productionStatus', 'productionVerified', 'scientificAdmission',
  'scientificallyCertified', 'scientificCertification', 'resultCertification', 'certificationToken'
]);

type BodyId = (typeof BODY_IDS)[number];
type SignName = (typeof SIGN_NAMES)[number];
type HouseSystem = (typeof HOUSE_SYSTEMS)[number];
type AspectType = (typeof ASPECT_TYPES)[number];
type Motion = (typeof MOTIONS)[number];
type WarningCode = (typeof WARNING_CODES)[number];

const BODY_ID_TO_WEB: Readonly<Record<BodyId, SkyBodyId>> = Object.freeze({
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto'
});
const MOTION_TO_WEB: Readonly<Record<Motion, SkyMotionState>> = Object.freeze({
  direct: 'DIRECT', station: 'STATIONARY', retrograde: 'RETROGRADE'
});
const PHASE_TO_WEB = Object.freeze({
  applying: 'APPLYING', exact: 'EXACT', separating: 'SEPARATING'
} as const);
const HOUSE_SYSTEM_TO_WEB: Readonly<Record<HouseSystem, string>> = Object.freeze({
  placidus: 'Placidus', 'whole-sign': 'Whole Sign', equal: 'Equal'
});
const HOUSE_SYSTEM_TO_ENGINE: Readonly<Record<string, HouseSystem>> = Object.freeze({
  Placidus: 'placidus', 'Whole Sign': 'whole-sign', Equal: 'equal'
});

export interface EngineResultExpectation {
  readonly input: {
    readonly instant: string;
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly options: { readonly houseSystem: HouseSystem };
}

interface EngineProvenance {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly scientificSource: string;
  readonly dataSource: string;
  readonly generator: string;
  readonly artifactHash: string;
  readonly license: string;
  readonly attribution: string;
  readonly redistributionStatus: (typeof REDISTRIBUTION_STATUSES)[number];
  readonly validationReferences: readonly string[];
  readonly accuracyProfile: string;
}

interface EngineDiagnostic {
  readonly code: (typeof COMPLETENESS_DIAGNOSTIC_CODES)[number];
  readonly field: string;
  readonly message: string;
}

interface EngineResultBody {
  readonly id: BodyId;
  readonly longitude: number;
  readonly latitude?: number;
  readonly distance?: number;
  readonly speedLongitude: number;
  readonly motion: Motion;
  readonly sign: SignName;
  readonly signDegree: number;
  readonly house: number;
}

interface EngineResultAspect {
  readonly type: AspectType;
  readonly bodyA: BodyId;
  readonly bodyB: BodyId;
  readonly exactAngle: number;
  readonly separation: number;
  readonly orb: number;
  readonly orbLimit: number;
  readonly phase: 'applying' | 'exact' | 'separating';
}

interface EngineResultWarning {
  readonly code: WarningCode;
  readonly subject: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, string | number | boolean>>;
}

interface EngineResultMetadata {
  readonly policyVersion: string;
  readonly zodiac: 'tropical';
  readonly houseSystem: HouseSystem;
  readonly calculationMode: 'geocentric-apparent-true-equinox-of-date';
  readonly orbProfileId: string;
  readonly provenance: readonly EngineProvenance[];
  readonly astronomyConfigurationStatus: 'COMPLETE' | 'INCOMPLETE_RESEARCH';
  readonly astronomyConfigurationId?: string;
  readonly astronomyConfigurationDiagnostics?: readonly EngineDiagnostic[];
  readonly provenanceEnvelopeStatus: 'COMPLETE' | 'INCOMPLETE_RESEARCH';
  readonly provenanceEnvelopeId?: string;
  readonly provenanceEnvelopeDiagnostics?: readonly EngineDiagnostic[];
}

export interface ValidatedEngineChartResultV1 {
  readonly schemaVersion: typeof ENGINE_SCHEMA_VERSION;
  readonly engineVersion: typeof ENGINE_VERSION;
  readonly provider: { readonly id: string; readonly version: string };
  readonly modelVersions: Readonly<Record<string, string>>;
  readonly input: EngineResultExpectation['input'];
  readonly bodies: readonly EngineResultBody[];
  readonly angles: {
    readonly ascendant: number;
    readonly midheaven: number;
    readonly armc: number;
    readonly obliquity: number;
  };
  readonly houses: { readonly system: HouseSystem; readonly cusps: readonly number[] };
  readonly aspects: readonly EngineResultAspect[];
  readonly warnings: readonly EngineResultWarning[];
  readonly metadata: EngineResultMetadata;
}

type EngineChartResultV1 = ValidatedEngineChartResultV1;

export type EngineResultValidationErrorCode =
  | 'ENGINE_RESULT_EXPECTATION_INVALID'
  | 'ENGINE_RESULT_VERSION_UNSUPPORTED'
  | 'ENGINE_RESULT_SHAPE_INVALID'
  | 'ENGINE_RESULT_FORGED_ADMISSION_METADATA'
  | 'ENGINE_RESULT_REQUEST_MISMATCH'
  | 'ENGINE_RESULT_BODY_SET_INVALID'
  | 'ENGINE_RESULT_ANGLE_STRUCTURE_INVALID'
  | 'ENGINE_RESULT_HOUSE_STRUCTURE_INVALID'
  | 'ENGINE_RESULT_ASPECT_REFERENCE_INVALID'
  | 'ENGINE_RESULT_SCIENTIFIC_CONFIGURATION_INVALID'
  | 'ENGINE_RESULT_PROVENANCE_INVALID'
  | 'ANGLE_SIGN_PRESENTATION_REQUIRED'
  | 'ANGLE_SIGN_PRESENTATION_MISMATCH'
  | 'ANGLE_SIGN_POLICY_UNSUPPORTED'
  | 'TEMPORAL_PROVENANCE_BINDING_MISMATCH';

export interface EngineAngleSignPresentationV1 {
  readonly schemaVersion: '1';
  readonly operation: 'ENGINE_PUBLIC_API_SIGN_FOR_LONGITUDE';
  readonly policyVersion: typeof SIGN_POLICY_VERSION;
  readonly zodiac: 'tropical';
  readonly angles: readonly [
    { readonly angleId: 'ASC'; readonly longitude: number; readonly sign: ZodiacSign },
    { readonly angleId: 'MC'; readonly longitude: number; readonly sign: ZodiacSign }
  ];
}

export interface WebEngineResultReceiptV2 {
  readonly mappingPolicyId: typeof MAPPING_POLICY_ID;
  readonly chart: ChartResultV2;
  readonly source: {
    readonly engineResult: ValidatedEngineChartResultV1;
    readonly webCivilTime: {
      readonly owner: 'NATALNODE_WEB_BFF';
      readonly evidence: TimeResolutionEvidence;
    };
  };
  readonly presentation: EngineAngleSignPresentationV1;
  readonly assessment: {
    readonly engineResult: 'ENGINE_RESULT_VALID';
    readonly webMapping: 'WEB_RESULT_SEMANTICALLY_MAPPABLE';
    readonly providerScientificAdmission: 'NOT_ADMITTED';
    readonly productionResultCertification: 'NOT_CERTIFIED';
    readonly dataClassification: 'ENGINEERING TEST DATA';
    readonly astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT';
  };
}

export type EngineResultMappingResult =
  | { readonly outcome: 'MAPPED'; readonly chart: ChartResultV2 }
  | { readonly outcome: 'REJECTED'; readonly error: { readonly code: EngineResultValidationErrorCode } };

export type EngineResultReceiptResult =
  | { readonly outcome: 'CREATED'; readonly receipt: WebEngineResultReceiptV2 }
  | { readonly outcome: 'REJECTED'; readonly error: { readonly code: EngineResultValidationErrorCode } };

export type EngineAngleSignPresentationResult =
  | { readonly outcome: 'CREATED'; readonly presentation: EngineAngleSignPresentationV1 }
  | { readonly outcome: 'REJECTED'; readonly error: { readonly code: EngineResultValidationErrorCode } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = []
): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.hasOwn(value, key)) && keys.every((key) => allowed.has(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isInRange(value: unknown, minimum: number, maximumExclusive: number): value is number {
  return isFiniteNumber(value) && value >= minimum && value < maximumExclusive;
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isUtcInstant(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value);
}

function isExpectation(value: unknown): value is EngineResultExpectation {
  if (!hasExactKeys(value, ['input', 'options']) ||
      !hasExactKeys(value.input, ['instant', 'latitude', 'longitude']) ||
      !hasExactKeys(value.options, ['houseSystem'])) return false;
  return isUtcInstant(value.input.instant) &&
    isInRange(value.input.latitude, -90, 90.0000000001) &&
    value.input.latitude <= 90 &&
    isInRange(value.input.longitude, -180, 180.0000000001) &&
    value.input.longitude <= 180 &&
    isOneOf(value.options.houseSystem, HOUSE_SYSTEMS);
}

function hasForgedAdmissionMetadata(value: Record<string, unknown>): boolean {
  if (Object.keys(value).some((key) => FORBIDDEN_ADMISSION_KEYS.has(key))) return true;
  return isRecord(value.metadata) &&
    Object.keys(value.metadata).some((key) => FORBIDDEN_ADMISSION_KEYS.has(key));
}

function isEngineDiagnostic(value: unknown): value is EngineDiagnostic {
  return hasExactKeys(value, ['code', 'field', 'message']) &&
    isOneOf(value.code, COMPLETENESS_DIAGNOSTIC_CODES) &&
    isNonEmptyString(value.field) && isNonEmptyString(value.message);
}

function validIdentityStatus(
  metadata: Record<string, unknown>,
  statusKey: 'astronomyConfigurationStatus' | 'provenanceEnvelopeStatus',
  idKey: 'astronomyConfigurationId' | 'provenanceEnvelopeId',
  diagnosticsKey: 'astronomyConfigurationDiagnostics' | 'provenanceEnvelopeDiagnostics'
): boolean {
  const status = metadata[statusKey];
  if (status === 'COMPLETE') {
    return typeof metadata[idKey] === 'string' &&
      /^sha256:[a-f0-9]{64}$/u.test(metadata[idKey] as string) &&
      !Object.hasOwn(metadata, diagnosticsKey);
  }
  if (status === 'INCOMPLETE_RESEARCH') {
    const diagnostics = metadata[diagnosticsKey];
    return !Object.hasOwn(metadata, idKey) && Array.isArray(diagnostics) &&
      diagnostics.length > 0 && diagnostics.every(isEngineDiagnostic);
  }
  return false;
}

function isEngineProvenance(value: unknown): value is EngineProvenance {
  return hasExactKeys(value, [
    'modelId', 'modelVersion', 'scientificSource', 'dataSource', 'generator',
    'artifactHash', 'license', 'attribution', 'redistributionStatus',
    'validationReferences', 'accuracyProfile'
  ]) &&
    ['modelId', 'modelVersion', 'scientificSource', 'dataSource', 'generator',
      'artifactHash', 'license', 'attribution', 'accuracyProfile']
      .every((key) => isNonEmptyString(value[key])) &&
    isOneOf(value.redistributionStatus, REDISTRIBUTION_STATUSES) &&
    Array.isArray(value.validationReferences) &&
    value.validationReferences.every(isNonEmptyString);
}

function modelVersionsMatchProvenance(
  modelVersions: Record<string, unknown>,
  provenance: readonly EngineProvenance[]
): boolean {
  const expected = new Map<string, string>();
  for (const model of provenance) {
    if (expected.has(model.modelId)) return false;
    expected.set(model.modelId, model.modelVersion);
  }
  const actualEntries = Object.entries(modelVersions).sort(([left], [right]) => left.localeCompare(right));
  const expectedEntries = [...expected.entries()].sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(actualEntries) === JSON.stringify(expectedEntries);
}

function isEngineBody(value: unknown): value is EngineResultBody {
  if (!hasExactKeys(value,
    ['id', 'longitude', 'speedLongitude', 'motion', 'sign', 'signDegree', 'house'],
    ['latitude', 'distance'])) return false;
  const house = value.house;
  return isOneOf(value.id, BODY_IDS) &&
    isInRange(value.longitude, 0, 360) &&
    (value.latitude === undefined || isInRange(value.latitude, -90, 90.0000000001) && value.latitude <= 90) &&
    (value.distance === undefined || isFiniteNumber(value.distance) && value.distance >= 0) &&
    isFiniteNumber(value.speedLongitude) &&
    isOneOf(value.motion, MOTIONS) &&
    isOneOf(value.sign, SIGN_NAMES) &&
    isInRange(value.signDegree, 0, 30) &&
    typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12;
}

function isEngineAspect(value: unknown): value is EngineResultAspect {
  return hasExactKeys(value, [
    'type', 'bodyA', 'bodyB', 'exactAngle', 'separation', 'orb', 'orbLimit', 'phase'
  ]) &&
    isOneOf(value.type, ASPECT_TYPES) &&
    isOneOf(value.bodyA, BODY_IDS) &&
    isOneOf(value.bodyB, BODY_IDS) && value.bodyA !== value.bodyB &&
    isInRange(value.exactAngle, 0, 180.0000000001) && value.exactAngle <= 180 &&
    isInRange(value.separation, 0, 180.0000000001) && value.separation <= 180 &&
    isInRange(value.orb, 0, 180.0000000001) && value.orb <= 180 &&
    isFiniteNumber(value.orbLimit) && value.orbLimit >= 0 && value.orb <= value.orbLimit &&
    isOneOf(value.phase, ['applying', 'exact', 'separating'] as const);
}

function isEngineWarning(value: unknown): value is EngineResultWarning {
  if (!hasExactKeys(value, ['code', 'subject', 'message'], ['details']) ||
      !isOneOf(value.code, WARNING_CODES) ||
      !isNonEmptyString(value.subject) || !isNonEmptyString(value.message)) return false;
  if (value.details === undefined) return true;
  return isRecord(value.details) && Object.values(value.details).every((detail) =>
    typeof detail === 'string' || typeof detail === 'boolean' || isFiniteNumber(detail)
  );
}

function isEngineMetadata(value: unknown): value is EngineResultMetadata {
  const required = [
    'policyVersion', 'zodiac', 'houseSystem', 'calculationMode', 'orbProfileId',
    'provenance', 'astronomyConfigurationStatus', 'provenanceEnvelopeStatus'
  ];
  const optional = [
    'astronomyConfigurationId', 'astronomyConfigurationDiagnostics',
    'provenanceEnvelopeId', 'provenanceEnvelopeDiagnostics'
  ];
  if (!hasExactKeys(value, required, optional) ||
      !isNonEmptyString(value.policyVersion) || value.zodiac !== 'tropical' ||
      !isOneOf(value.houseSystem, HOUSE_SYSTEMS) ||
      value.calculationMode !== 'geocentric-apparent-true-equinox-of-date' ||
      !isNonEmptyString(value.orbProfileId)) return false;

  return validIdentityStatus(value, 'astronomyConfigurationStatus',
    'astronomyConfigurationId', 'astronomyConfigurationDiagnostics') &&
    validIdentityStatus(value, 'provenanceEnvelopeStatus',
      'provenanceEnvelopeId', 'provenanceEnvelopeDiagnostics') &&
    Array.isArray(value.provenance) && value.provenance.length > 0 &&
    value.provenance.every(isEngineProvenance);
}

function rejected(code: EngineResultValidationErrorCode): EngineResultMappingResult {
  return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code }) });
}

function rejectedReceipt(code: EngineResultValidationErrorCode): EngineResultReceiptResult {
  return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code }) });
}

function validateEngineChartResult(
  value: unknown,
  expected: EngineResultExpectation
): { readonly chart: EngineChartResultV1 } | { readonly error: EngineResultValidationErrorCode } {
  if (!isExpectation(expected)) return { error: 'ENGINE_RESULT_EXPECTATION_INVALID' };
  if (!isRecord(value)) return { error: 'ENGINE_RESULT_SHAPE_INVALID' };
  if (hasForgedAdmissionMetadata(value)) return { error: 'ENGINE_RESULT_FORGED_ADMISSION_METADATA' };
  if (value.schemaVersion !== ENGINE_SCHEMA_VERSION || value.engineVersion !== ENGINE_VERSION) {
    return { error: 'ENGINE_RESULT_VERSION_UNSUPPORTED' };
  }
  if (!hasExactKeys(value, [
    'schemaVersion', 'engineVersion', 'provider', 'modelVersions', 'input',
    'bodies', 'angles', 'houses', 'aspects', 'warnings', 'metadata'
  ])) return { error: 'ENGINE_RESULT_SHAPE_INVALID' };
  const provider = value.provider;
  const modelVersions = value.modelVersions;
  const input = value.input;
  const bodyRows = value.bodies;
  const angleValues = value.angles;
  const houseResult = value.houses;
  const aspectRows = value.aspects;
  const warningRows = value.warnings;
  const metadata = value.metadata;

  if (!hasExactKeys(provider, ['id', 'version']) ||
      !isNonEmptyString(provider.id) || !isNonEmptyString(provider.version) ||
      !isRecord(modelVersions) || Object.keys(modelVersions).length === 0 ||
      !Object.entries(modelVersions).every(([id, version]) => isNonEmptyString(id) && isNonEmptyString(version)) ||
      !hasExactKeys(input, ['instant', 'latitude', 'longitude']) ||
      !isUtcInstant(input.instant) || !isFiniteNumber(input.latitude) ||
      input.latitude < -90 || input.latitude > 90 ||
      !isFiniteNumber(input.longitude) || input.longitude < -180 || input.longitude > 180 ||
      !Array.isArray(bodyRows) || !Array.isArray(aspectRows) || !Array.isArray(warningRows)) {
    return { error: 'ENGINE_RESULT_SHAPE_INVALID' };
  }

  if (!isRecord(metadata)) return { error: 'ENGINE_RESULT_SHAPE_INVALID' };
  if (!Array.isArray(metadata.provenance) || metadata.provenance.length === 0 ||
      !metadata.provenance.every(isEngineProvenance)) {
    return { error: 'ENGINE_RESULT_PROVENANCE_INVALID' };
  }
  if (!isRecord(modelVersions) || !modelVersionsMatchProvenance(
    modelVersions,
    metadata.provenance as EngineProvenance[]
  )) return { error: 'ENGINE_RESULT_PROVENANCE_INVALID' };
  if (!validIdentityStatus(metadata, 'astronomyConfigurationStatus',
    'astronomyConfigurationId', 'astronomyConfigurationDiagnostics') ||
      !validIdentityStatus(metadata, 'provenanceEnvelopeStatus',
        'provenanceEnvelopeId', 'provenanceEnvelopeDiagnostics')) {
    return { error: 'ENGINE_RESULT_SCIENTIFIC_CONFIGURATION_INVALID' };
  }
  if (!isEngineMetadata(metadata)) return { error: 'ENGINE_RESULT_SHAPE_INVALID' };

  if (input.instant !== expected.input.instant ||
      input.latitude !== expected.input.latitude ||
      input.longitude !== expected.input.longitude ||
      metadata.houseSystem !== expected.options.houseSystem) {
    return { error: 'ENGINE_RESULT_REQUEST_MISMATCH' };
  }

  if (bodyRows.length !== BODY_IDS.length ||
      !bodyRows.every(isEngineBody) ||
      !BODY_IDS.every((bodyId, index) => isRecord(bodyRows[index]) && bodyRows[index].id === bodyId)) {
    return { error: 'ENGINE_RESULT_BODY_SET_INVALID' };
  }

  if (!hasExactKeys(angleValues, ['ascendant', 'midheaven', 'armc', 'obliquity']) ||
      !isInRange(angleValues.ascendant, 0, 360) ||
      !isInRange(angleValues.midheaven, 0, 360) ||
      !isInRange(angleValues.armc, 0, 360) ||
      !isInRange(angleValues.obliquity, 0, 180)) {
    return { error: 'ENGINE_RESULT_ANGLE_STRUCTURE_INVALID' };
  }

  if (!hasExactKeys(houseResult, ['system', 'cusps']) ||
      !isOneOf(houseResult.system, HOUSE_SYSTEMS) ||
      !Array.isArray(houseResult.cusps) || houseResult.cusps.length !== 12 ||
      !houseResult.cusps.every((cusp) => isInRange(cusp, 0, 360))) {
    return { error: 'ENGINE_RESULT_HOUSE_STRUCTURE_INVALID' };
  }
  if (houseResult.system !== expected.options.houseSystem) {
    return { error: 'ENGINE_RESULT_REQUEST_MISMATCH' };
  }

  if (!aspectRows.every(isEngineAspect) || aspectRows.some((aspect) =>
    !bodyRows.some((body) => (body as EngineResultBody).id === (aspect as EngineResultAspect).bodyA) ||
    !bodyRows.some((body) => (body as EngineResultBody).id === (aspect as EngineResultAspect).bodyB)
  )) return { error: 'ENGINE_RESULT_ASPECT_REFERENCE_INVALID' };
  if (!warningRows.every(isEngineWarning)) return { error: 'ENGINE_RESULT_SHAPE_INVALID' };

  return { chart: value as unknown as EngineChartResultV1 };
}

function validateAngleSignPresentation(
  value: unknown,
  chart: EngineChartResultV1
): { readonly presentation: EngineAngleSignPresentationV1 }
  | { readonly error: EngineResultValidationErrorCode } {
  if (value === null || value === undefined) return { error: 'ANGLE_SIGN_PRESENTATION_REQUIRED' };
  if (!hasExactKeys(value, ['schemaVersion', 'operation', 'policyVersion', 'zodiac', 'angles']) ||
      value.schemaVersion !== '1' ||
      value.operation !== 'ENGINE_PUBLIC_API_SIGN_FOR_LONGITUDE' ||
      value.policyVersion !== SIGN_POLICY_VERSION || value.zodiac !== 'tropical') {
    return { error: 'ANGLE_SIGN_POLICY_UNSUPPORTED' };
  }
  const angles = value.angles;
  if (!Array.isArray(angles) || angles.length !== 2 ||
      !hasExactKeys(angles[0], ['angleId', 'longitude', 'sign']) ||
      !hasExactKeys(angles[1], ['angleId', 'longitude', 'sign']) ||
      angles[0].angleId !== 'ASC' || angles[0].longitude !== chart.angles.ascendant ||
      !isOneOf(angles[0].sign, SIGN_NAMES) ||
      angles[1].angleId !== 'MC' || angles[1].longitude !== chart.angles.midheaven ||
      !isOneOf(angles[1].sign, SIGN_NAMES)) {
    return { error: 'ANGLE_SIGN_PRESENTATION_MISMATCH' };
  }
  return { presentation: value as unknown as EngineAngleSignPresentationV1 };
}

function mapValidatedEngineResult(
  chart: EngineChartResultV1,
  presentation: EngineAngleSignPresentationV1
): ChartResultV2 {
  const mapped: ChartResultV2 = {
    schemaVersion: WEB_RESULT_SCHEMA_VERSION,
    engineVersion: chart.engineVersion,
    bodies: chart.bodies.map((body): ChartResultV2['bodies'][number] => ({
      bodyId: BODY_ID_TO_WEB[body.id],
      longitude: body.longitude,
      sign: body.sign,
      house: body.house,
      motionState: MOTION_TO_WEB[body.motion]
    })),
    angles: presentation.angles.map((angle): ChartResultV2['angles'][number] => ({
      angleId: angle.angleId,
      longitude: angle.longitude,
      sign: angle.sign
    })),
    houses: {
      system: HOUSE_SYSTEM_TO_WEB[chart.houses.system],
      cusps: chart.houses.cusps.map((longitude, index) => ({ house: index + 1, longitude }))
    },
    aspects: chart.aspects.map((aspect): ChartResultV2['aspects'][number] => ({
      firstBodyId: BODY_ID_TO_WEB[aspect.bodyA],
      secondBodyId: BODY_ID_TO_WEB[aspect.bodyB],
      type: aspect.type,
      orb: aspect.orb,
      phaseState: PHASE_TO_WEB[aspect.phase],
      exactAngle: aspect.exactAngle,
      separation: aspect.separation,
      orbLimit: aspect.orbLimit
    })),
    warnings: chart.warnings.map((warning): EngineChartWarningV2 => ({
      owner: 'ENGINE',
      code: warning.code,
      subject: warning.subject,
      message: warning.message,
      ...(Object.hasOwn(warning, 'details') ? { details: warning.details } : {}),
      severity: null
    }))
  };
  return mapped;
}

export function projectEngineResultToWebV2(
  rawResult: unknown,
  expectedRequest: EngineResultExpectation,
  anglePresentation: unknown
): EngineResultMappingResult {
  const validated = validateEngineChartResult(rawResult, expectedRequest);
  if ('error' in validated) return rejected(validated.error);
  const presentation = validateAngleSignPresentation(anglePresentation, validated.chart);
  if ('error' in presentation) return rejected(presentation.error);
  return Object.freeze({
    outcome: 'MAPPED',
    chart: Object.freeze(mapValidatedEngineResult(validated.chart, presentation.presentation))
  });
}

function isTimeEvidenceBoundToRequest(
  evidence: VerifiedUtcInstant,
  request: ChartRequest,
  expected: EngineResultExpectation
): boolean {
  const birth = request.birth;
  return birth.ambiguityStatus === 'EXACT' &&
    expected.options.houseSystem === HOUSE_SYSTEM_TO_ENGINE[request.houseSystem] &&
    evidence.civilTime.localDate === birth.localDate &&
    evidence.civilTime.localTime === birth.localTime &&
    evidence.location.resolutionId === birth.locationResolutionId &&
    evidence.location.coordinates.latitude === birth.latitude &&
    evidence.location.coordinates.longitude === birth.longitude &&
    evidence.location.ianaTimeZone === birth.ianaTimeZone &&
    evidence.resolvedUtcInstant === birth.resolvedUtcInstant &&
    evidence.resolvedUtcInstant === expected.input.instant &&
    evidence.utcOffsetSeconds === birth.utcOffsetSeconds &&
    evidence.authority.timezoneDatabaseVersion === birth.timezoneDatabaseVersion &&
    evidence.authority.profileId === birth.timezoneResolutionMethod &&
    expected.input.latitude === evidence.location.coordinates.latitude &&
    expected.input.longitude === evidence.location.coordinates.longitude;
}

export function createWebEngineResultReceiptV2(input: {
  readonly rawResult: unknown;
  readonly expectedRequest: EngineResultExpectation;
  readonly anglePresentation: unknown;
  readonly verifiedTime: unknown;
  readonly webRequest: ChartRequest;
}): EngineResultReceiptResult {
  const validated = validateEngineChartResult(input.rawResult, input.expectedRequest);
  if ('error' in validated) return rejectedReceipt(validated.error);
  const presentation = validateAngleSignPresentation(input.anglePresentation, validated.chart);
  if ('error' in presentation) return rejectedReceipt(presentation.error);
  try {
    assertVerifiedUtcInstant(input.verifiedTime);
  } catch {
    return rejectedReceipt('TEMPORAL_PROVENANCE_BINDING_MISMATCH');
  }
  if (!isTimeEvidenceBoundToRequest(input.verifiedTime, input.webRequest, input.expectedRequest)) {
    return rejectedReceipt('TEMPORAL_PROVENANCE_BINDING_MISMATCH');
  }

  const receipt: WebEngineResultReceiptV2 = {
    mappingPolicyId: MAPPING_POLICY_ID,
    chart: mapValidatedEngineResult(validated.chart, presentation.presentation),
    source: {
      engineResult: structuredClone(validated.chart),
      webCivilTime: {
        owner: 'NATALNODE_WEB_BFF',
        evidence: structuredClone(input.verifiedTime) as TimeResolutionEvidence
      }
    },
    presentation: structuredClone(presentation.presentation),
    assessment: {
      engineResult: 'ENGINE_RESULT_VALID',
      webMapping: 'WEB_RESULT_SEMANTICALLY_MAPPABLE',
      providerScientificAdmission: 'NOT_ADMITTED',
      productionResultCertification: 'NOT_CERTIFIED',
      dataClassification: 'ENGINEERING TEST DATA',
      astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT'
    }
  };
  return Object.freeze({ outcome: 'CREATED', receipt: Object.freeze(receipt) });
}

/** Runs only in the explicitly constructed private Engine test service. */
export function createEngineAngleSignPresentationV1(input: {
  readonly rawResult: unknown;
  readonly expectedRequest: EngineResultExpectation;
  readonly signForLongitude?: unknown;
  readonly policy?: unknown;
}): EngineAngleSignPresentationResult {
  const validated = validateEngineChartResult(input.rawResult, input.expectedRequest);
  if ('error' in validated) {
    return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code: validated.error }) });
  }
  if (typeof input.signForLongitude !== 'function') {
    return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code: 'ANGLE_SIGN_PRESENTATION_REQUIRED' }) });
  }
  if (!isRecord(input.policy) || input.policy.version !== SIGN_POLICY_VERSION ||
      !isRecord(input.policy.sign) ||
      input.policy.sign.interval !== '[boundary, nextBoundary)' ||
      input.policy.sign.exactBoundaryBelongsTo !== 'next sign' ||
      input.policy.sign.assignmentEpsilonDeg !== 1e-9 ||
      validated.chart.metadata.zodiac !== 'tropical') {
    return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code: 'ANGLE_SIGN_POLICY_UNSUPPORTED' }) });
  }
  try {
    const signForLongitude = input.signForLongitude as (longitude: number) => unknown;
    const ascendant = signForLongitude(validated.chart.angles.ascendant);
    const midheaven = signForLongitude(validated.chart.angles.midheaven);
    if (!isOneOf(ascendant, SIGN_NAMES) || !isOneOf(midheaven, SIGN_NAMES)) {
      return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code: 'ANGLE_SIGN_PRESENTATION_MISMATCH' }) });
    }
    const presentation: EngineAngleSignPresentationV1 = Object.freeze({
      schemaVersion: '1',
      operation: 'ENGINE_PUBLIC_API_SIGN_FOR_LONGITUDE',
      policyVersion: SIGN_POLICY_VERSION,
      zodiac: 'tropical',
      angles: Object.freeze([
        Object.freeze({ angleId: 'ASC', longitude: validated.chart.angles.ascendant, sign: ascendant }),
        Object.freeze({ angleId: 'MC', longitude: validated.chart.angles.midheaven, sign: midheaven })
      ]) as EngineAngleSignPresentationV1['angles']
    });
    return Object.freeze({ outcome: 'CREATED', presentation });
  } catch {
    return Object.freeze({ outcome: 'REJECTED', error: Object.freeze({ code: 'ANGLE_SIGN_PRESENTATION_MISMATCH' }) });
  }
}
