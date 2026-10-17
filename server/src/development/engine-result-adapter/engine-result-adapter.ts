/**
 * Private, development-only wire validator and inspection projection for the
 * pinned Engine ChartResult. This is deliberately not a Web ChartResult
 * adapter and is not exported from the server package root.
 */

const ENGINE_SCHEMA_VERSION = '1.0.0';
const ENGINE_VERSION = '0.1.0-foundation';
const ENGINE_RESULT_PROJECTION_VERSION = 'ENGINE_RESULT_INSPECTION_V1';

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

interface EngineChartResultV1 {
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
  | 'ENGINE_RESULT_PROVENANCE_INVALID';

export interface EngineDevelopmentResultProjection {
  readonly projectionType: typeof ENGINE_RESULT_PROJECTION_VERSION;
  readonly authority: {
    readonly structuralValidation: 'STRUCTURALLY_VALID';
    readonly semanticMapping: 'PARTIAL';
    readonly scientificAdmission: 'NOT_ADMITTED';
    readonly dataClassification: 'ENGINEERING TEST DATA';
    readonly astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT';
    readonly scientificValidation: 'NOT_PERFORMED';
    readonly resultCertification: 'NOT_CREATED';
  };
  readonly engineIdentity: {
    readonly schemaVersion: string;
    readonly engineVersion: string;
  };
  readonly requestBinding: EngineResultExpectation;
  readonly provider: EngineChartResultV1['provider'];
  readonly modelVersions: EngineChartResultV1['modelVersions'];
  readonly bodies: readonly {
    readonly bodyId: BodyId;
    readonly longitude: number;
    readonly sign: SignName;
    readonly house: number;
    readonly engineMotion: Motion;
  }[];
  /** ASC and MC longitude only; this is not Web AngleFact (which requires sign). */
  readonly angles: readonly {
    readonly angleId: 'ASC' | 'MC';
    readonly longitude: number;
  }[];
  readonly houses: {
    readonly system: HouseSystem;
    readonly cusps: readonly { readonly house: number; readonly longitude: number }[];
  };
  readonly aspects: readonly {
    readonly firstBodyId: BodyId;
    readonly secondBodyId: BodyId;
    readonly type: AspectType;
    readonly orb: number;
    readonly phaseState: 'APPLYING' | 'EXACT' | 'SEPARATING';
  }[];
  /** Kept in the Engine warning shape; no Web severity is inferred. */
  readonly engineWarnings: EngineChartResultV1['warnings'];
  /** Kept byte-for-byte as received; COMPLETE does not mean production admitted. */
  readonly engineMetadata: EngineChartResultV1['metadata'];
  readonly resultContractGaps: readonly string[];
}

export type EngineResultProjection =
  | { readonly outcome: 'PROJECTED'; readonly projection: EngineDevelopmentResultProjection }
  | { readonly outcome: 'REJECTED'; readonly error: { readonly code: EngineResultValidationErrorCode } };

const RESULT_CONTRACT_GAPS = Object.freeze([
  'ANGLE_SIGN_NOT_SUPPLIED_FOR_WEB_ANGLE_FACT',
  'ENGINE_WARNING_SEVERITY_HAS_NO_WEB_MAPPING',
  'ENGINE_STATION_STATE_CANNOT_BE_REDUCED_TO_WEB_RETROGRADE_BOOLEAN',
  'WEB_ASPECT_FACT_OMITS_ENGINE_EXACT_ANGLE_SEPARATION_AND_ORB_LIMIT',
  'ENGINE_PROVIDER_AND_MODEL_PROVENANCE_HAVE_NO_WEB_CHART_RESULT_FIELDS',
  'ENGINE_RESULT_HAS_NO_CIVIL_TIME_AUTHORITY_EVIDENCE',
  'WEB_CHART_RESULT_HAS_NO_SYNTHETIC_AUTHORITY_CLASSIFICATION',
  'ENGINE_PRECISION_QUALITY_HAS_NO_WEB_CHART_RESULT_FIELD'
]);

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
    isInRange(value.orbLimit, 0, 180.0000000001) && value.orbLimit <= 180 &&
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

function reject(code: EngineResultValidationErrorCode): EngineResultProjection {
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

/**
 * Validates the pinned Engine wire result against the exact submitted request,
 * then projects only inspectable source-owned fields. It never creates a Web
 * ChartResult, production certification, or scientific admission.
 */
export function projectEngineResultForDevelopmentInspection(
  rawResult: unknown,
  expectedRequest: EngineResultExpectation
): EngineResultProjection {
  const validated = validateEngineChartResult(rawResult, expectedRequest);
  if ('error' in validated) return reject(validated.error);
  const chart = validated.chart;

  const projection: EngineDevelopmentResultProjection = Object.freeze({
    projectionType: ENGINE_RESULT_PROJECTION_VERSION,
    authority: Object.freeze({
      structuralValidation: 'STRUCTURALLY_VALID',
      semanticMapping: 'PARTIAL',
      scientificAdmission: 'NOT_ADMITTED',
      dataClassification: 'ENGINEERING TEST DATA',
      astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT',
      scientificValidation: 'NOT_PERFORMED',
      resultCertification: 'NOT_CREATED'
    }),
    engineIdentity: Object.freeze({
      schemaVersion: chart.schemaVersion,
      engineVersion: chart.engineVersion
    }),
    requestBinding: expectedRequest,
    provider: chart.provider,
    modelVersions: chart.modelVersions,
    bodies: Object.freeze(chart.bodies.map((body) => Object.freeze({
      bodyId: body.id,
      longitude: body.longitude,
      sign: body.sign,
      house: body.house,
      engineMotion: body.motion
    }))),
    angles: Object.freeze([
      Object.freeze({ angleId: 'ASC' as const, longitude: chart.angles.ascendant }),
      Object.freeze({ angleId: 'MC' as const, longitude: chart.angles.midheaven })
    ]),
    houses: Object.freeze({
      system: chart.houses.system,
      cusps: Object.freeze(chart.houses.cusps.map((longitude, index) =>
        Object.freeze({ house: index + 1, longitude })
      ))
    }),
    aspects: Object.freeze(chart.aspects.map((aspect) => Object.freeze({
      firstBodyId: aspect.bodyA,
      secondBodyId: aspect.bodyB,
      type: aspect.type,
      orb: aspect.orb,
      phaseState: aspect.phase.toUpperCase() as 'APPLYING' | 'EXACT' | 'SEPARATING'
    }))),
    engineWarnings: chart.warnings,
    engineMetadata: chart.metadata,
    resultContractGaps: RESULT_CONTRACT_GAPS
  });
  return Object.freeze({ outcome: 'PROJECTED', projection });
}
