import {
  certifyChartResultForRequest,
  getChartRequestAuthorityIssue,
  type CanonicalResolvedLocation,
  type ChartRequest,
  type ChartResult,
  type VaultChartCategory,
  type VaultChartRecord,
  type VaultRecordOrigin,
  type VaultRecordProvenance,
  type VaultScientificStatus,
  type VaultTimeAuthorityState
} from '@natalnode/contracts';
import { isChartResult } from '@natalnode/engine-client';
import type { LocationResolutionService } from '../location-resolution/location-resolution-service.js';
import type { Clock, IdGenerator } from '../app/creation-boundaries.js';
import {
  assertVaultResearchSnapshotIntegrity,
  type VerifiedVaultResearchCapture
} from './vault-research-capture.js';

export const VAULT_FREE_RECORD_LIMIT = 3;
export const VAULT_RECORD_SOURCE_CONTEXT = 'chart-workspace';

export type VaultRecordSaveMode = Extract<
  VaultScientificStatus,
  'INPUT_ONLY' | 'CHART_RESULT_AVAILABLE'
>;

export type VaultRecordEligibilityCode =
  | 'INVALID_INPUT'
  | 'INVALID_STATE'
  | 'PERSISTED_AUTHORITY_MISMATCH';

export class VaultRecordEligibilityError extends Error {
  public readonly code: VaultRecordEligibilityCode;

  public constructor(code: VaultRecordEligibilityCode) {
    super('Vault record eligibility was not satisfied.');
    this.name = 'VaultRecordEligibilityError';
    this.code = code;
  }
}

export interface CreateVaultRecordInput {
  readonly userId: string;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly chart: ChartRequest;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly locationResolutionService?: LocationResolutionService;
  readonly saveMode: VaultRecordSaveMode;
  readonly canonicalChartResult?: ChartResult | null;
  /** Non-production compatibility path for development-only UI metadata. */
  readonly allowDevelopmentFixtureSnapshot?: boolean;
  /** Allows the non-production input form to retain its explicit fixture metadata. */
  readonly allowDevelopmentOnlyMetadata?: boolean;
}

const DEVELOPMENT_ONLY_MARKER = 'DEVELOPMENT_ONLY';
const CHART_INPUT_TEXT_MAXIMUM_CHARACTERS = 256;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const IANA_TIME_ZONE_PATTERN = /^(?:UTC|GMT|[A-Za-z0-9._+-]+(?:\/[A-Za-z0-9._+-]+)+)$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isSafeBoundedString(value: unknown, allowEmpty = false): value is string {
  return (
    typeof value === 'string' &&
    Array.from(value).length <= CHART_INPUT_TEXT_MAXIMUM_CHARACTERS &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value) &&
    (allowEmpty || value.trim() !== '')
  );
}

function isNullableSafeBoundedString(value: unknown): value is string | null {
  return value === null || isSafeBoundedString(value);
}

function isValidAmbiguityStatus(value: unknown): boolean {
  return (
    value === 'EXACT' ||
    value === 'AMBIGUOUS' ||
    value === 'NONEXISTENT' ||
    value === 'UNKNOWN_TIME'
  );
}

function isValidCoordinate(
  value: unknown,
  minimum: number,
  maximum: number
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidIanaTimeZone(value: string): boolean {
  if (!IANA_TIME_ZONE_PATTERN.test(value)) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch (_error) {
    return false;
  }
}

function isValidInstant(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u.test(
      value
    ) && !Number.isNaN(Date.parse(value))
  );
}

function timeAuthorityState(
  chart: ChartRequest
): VaultTimeAuthorityState {
  switch (chart.birth.ambiguityStatus) {
    case 'EXACT':
      return 'RESOLVED';
    case 'AMBIGUOUS':
      return 'AMBIGUOUS';
    case 'NONEXISTENT':
      return 'NONEXISTENT';
    case 'UNKNOWN_TIME':
      return 'UNKNOWN_BIRTH_TIME';
    default:
      return 'UNRESOLVED';
  }
}

function assertCanonicalLocation(
  chart: ChartRequest,
  locationResolutionService: LocationResolutionService | undefined
): CanonicalResolvedLocation {
  const resolutionId = chart.birth.locationResolutionId;
  const location =
    resolutionId === undefined || locationResolutionService === undefined
      ? null
      : locationResolutionService.getResolvedLocation(resolutionId);

  if (
    location === null ||
    location.status !== 'RESOLVED' ||
    location.coordinates.latitude !== chart.birth.latitude ||
    location.coordinates.longitude !== chart.birth.longitude ||
    location.ianaTimeZone !== chart.birth.ianaTimeZone
  ) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  return location;
}

/**
 * Validates only authority and consistency already present in the request.
 * This function deliberately does not resolve time, calculate astronomy, or
 * turn a display label into a location authority.
 */
export function assertEligibleVaultRecordInput(
  chart: ChartRequest,
  locationResolutionService?: LocationResolutionService,
  options: {
    readonly allowDevelopmentFixture?: boolean;
    readonly allowDevelopmentOnlyMetadata?: boolean;
  } = {}
): CanonicalResolvedLocation | null {
  if (!isRecord(chart) || !isRecord(chart.birth)) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  const birth = chart.birth;

  if (
    !isSafeBoundedString(birth.localDate) ||
    !isNullableSafeBoundedString(birth.localTime) ||
    !isSafeBoundedString(birth.locationLabel) ||
    (birth.locationResolutionId !== undefined &&
      !isSafeBoundedString(birth.locationResolutionId)) ||
    !isValidCoordinate(birth.latitude, -90, 90) ||
    !isValidCoordinate(birth.longitude, -180, 180) ||
    !isSafeBoundedString(birth.ianaTimeZone) ||
    !isNullableSafeBoundedString(birth.resolvedUtcInstant) ||
    (birth.utcOffsetSeconds !== null &&
      (typeof birth.utcOffsetSeconds !== 'number' ||
        !Number.isFinite(birth.utcOffsetSeconds))) ||
    !isSafeBoundedString(birth.timezoneDatabaseVersion) ||
    !isSafeBoundedString(birth.timezoneResolutionMethod) ||
    !isValidAmbiguityStatus(birth.ambiguityStatus) ||
    !isSafeBoundedString(chart.houseSystem) ||
    !isValidIsoDate(birth.localDate) ||
    !isValidIanaTimeZone(birth.ianaTimeZone)
  ) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  if (
    birth.localTime !== null &&
    !LOCAL_TIME_PATTERN.test(birth.localTime)
  ) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  if (
    birth.resolvedUtcInstant !== null &&
    !isValidInstant(birth.resolvedUtcInstant)
  ) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  if (
    birth.utcOffsetSeconds !== null &&
    (!Number.isInteger(birth.utcOffsetSeconds) ||
      Math.abs(birth.utcOffsetSeconds) > 86_400)
  ) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  if (getChartRequestAuthorityIssue(chart) !== null) {
    throw new VaultRecordEligibilityError('INVALID_INPUT');
  }

  const hasDevelopmentMarker =
    birth.timezoneDatabaseVersion.includes(DEVELOPMENT_ONLY_MARKER) ||
    birth.timezoneResolutionMethod.includes(DEVELOPMENT_ONLY_MARKER);

  if (
    hasDevelopmentMarker &&
    !options.allowDevelopmentFixture &&
    !options.allowDevelopmentOnlyMetadata
  ) {
    throw new VaultRecordEligibilityError('INVALID_STATE');
  }

  if (options.allowDevelopmentFixture) {
    return null;
  }

  return assertCanonicalLocation(chart, locationResolutionService);
}

function isDevelopmentFixtureResult(result: ChartResult): boolean {
  return (
    result.calculationStatus !== 'COMPLETE' ||
    result.engineVersion.toUpperCase().includes('FIXTURE') ||
    result.engineVersion.toLowerCase().includes('mock') ||
    result.metadata.configurationStatus !== 'COMPLETE'
  );
}

function createProvenance(
  origin: Exclude<VaultRecordOrigin, 'SERVER_RESEARCH_CAPTURE'>,
  savedAt: string,
  result: ChartResult | null,
  timeState: VaultTimeAuthorityState,
  sourceContext: string = VAULT_RECORD_SOURCE_CONTEXT
): VaultRecordProvenance {
  return {
    schemaVersion: '1',
    recordOrigin: origin,
    sourceContext,
    savedAt,
    timeAuthorityState: timeState,
    calculationAuthorityState:
      result?.calculationStatus === 'COMPLETE' ? 'AUTHORITATIVE' : 'AUTHORITY_INCOMPLETE',
    chartResultContractVersion: result?.schemaVersion ?? null,
    scientificConfigurationIdentity:
      result?.metadata.configurationStatus === 'COMPLETE'
        ? result.metadata.astronomyConfigurationId
        : null,
    provenanceEnvelopeId:
      result?.metadata.configurationStatus === 'COMPLETE'
        ? result.metadata.provenanceEnvelopeId
        : null
  };
}

export interface CreateVaultResearchSnapshotRecordInput {
  readonly userId: string;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly capture: VerifiedVaultResearchCapture;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
}

/** Creates the approved preserved research record without any calculation. */
export function createVaultResearchSnapshotRecord(
  input: CreateVaultResearchSnapshotRecordInput
): VaultChartRecord {
  const capture = input.capture;
  assertVaultResearchSnapshotIntegrity(capture.snapshot, capture.chartRequest);
  const timestamp = input.clock.now();
  const timeState = timeAuthorityState(capture.chartRequest);
  const provenance: VaultRecordProvenance = {
    schemaVersion: '2',
    recordOrigin: 'SERVER_RESEARCH_CAPTURE',
    sourceContext: 'vault.research-capture',
    savedAt: timestamp,
    timeAuthorityState: timeState,
    calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
    chartResultContractVersion: capture.engineSchemaVersion,
    scientificConfigurationIdentity: capture.astronomyConfigurationId,
    provenanceEnvelopeId: null,
    captureId: capture.captureId,
    captureReportSha256: capture.snapshot.captureReportSha256,
    captureResponseSha256: capture.snapshot.responseSha256
  };

  return {
    chartId: input.idGenerator.generate(),
    userId: input.userId,
    displayName: input.displayName,
    category: input.category,
    tags: [...input.tags],
    favorite: input.favorite,
    normalizedChartRequest: clone(capture.chartRequest),
    canonicalChartResult: null,
    researchSnapshot: clone(capture.snapshot),
    engineVersion: capture.engineVersion,
    chartSchemaVersion: capture.presentationSchemaVersion,
    astronomyConfigurationId: capture.astronomyConfigurationId,
    provenanceEnvelopeId: null,
    recordVersion: 2,
    scientificStatus: 'RESEARCH_ONLY_SNAPSHOT',
    calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
    recordOrigin: 'SERVER_RESEARCH_CAPTURE',
    sourceContext: 'vault.research-capture',
    timeAuthorityState: timeState,
    chartResultContractVersion: capture.engineSchemaVersion,
    scientificConfigurationIdentity: capture.astronomyConfigurationId,
    scientificProvenance: provenance,
    savedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function duplicateVaultResearchSnapshotRecord(input: {
  readonly userId: string;
  readonly source: VaultChartRecord;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
}): VaultChartRecord {
  assertVaultRecordAuthority(input.source);
  const source = input.source;
  if (
    source.userId !== input.userId ||
    source.scientificStatus !== 'RESEARCH_ONLY_SNAPSHOT' ||
    source.researchSnapshot === undefined ||
    source.researchSnapshot === null ||
    source.scientificProvenance.schemaVersion !== '2'
  ) {
    throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
  }

  const timestamp = input.clock.now();
  return {
    ...source,
    chartId: input.idGenerator.generate(),
    userId: input.userId,
    tags: [...source.tags],
    normalizedChartRequest: clone(source.normalizedChartRequest),
    canonicalChartResult: null,
    researchSnapshot: clone(source.researchSnapshot),
    scientificProvenance: {
      ...source.scientificProvenance,
      savedAt: timestamp
    },
    savedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createRecordBase(input: CreateVaultRecordInput, timestamp: string): {
  readonly chartId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: ChartRequest;
  readonly savedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
} {
  return {
    chartId: input.idGenerator.generate(),
    userId: input.userId,
    displayName: input.displayName,
    category: input.category,
    tags: [...input.tags],
    favorite: input.favorite,
    normalizedChartRequest: clone(input.chart),
    savedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createVaultRecord(input: CreateVaultRecordInput): VaultChartRecord {
  const timestamp = input.clock.now();
  const result = input.canonicalChartResult ?? null;
  const allowDevelopmentFixture = input.allowDevelopmentFixtureSnapshot === true;
  const location = assertEligibleVaultRecordInput(
    input.chart,
    input.locationResolutionService,
    {
      allowDevelopmentFixture,
      allowDevelopmentOnlyMetadata: input.allowDevelopmentOnlyMetadata
    }
  );
  const timeState = timeAuthorityState(input.chart);

  if (input.saveMode === 'INPUT_ONLY') {
    if (result !== null) {
      throw new VaultRecordEligibilityError('INVALID_INPUT');
    }

    const provenance = createProvenance('USER_INPUT', timestamp, null, timeState);
    return {
      ...createRecordBase(input, timestamp),
      canonicalChartResult: null,
      engineVersion: null,
      chartSchemaVersion: null,
      astronomyConfigurationId: null,
      provenanceEnvelopeId: null,
      recordVersion: 1,
      scientificStatus: 'INPUT_ONLY',
      calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
      recordOrigin: 'USER_INPUT',
      sourceContext: VAULT_RECORD_SOURCE_CONTEXT,
      timeAuthorityState: timeState,
      chartResultContractVersion: null,
      scientificConfigurationIdentity: null,
      scientificProvenance: provenance
    };
  }

  if (result === null) {
    throw new VaultRecordEligibilityError('INVALID_STATE');
  }

  if (!isChartResult(result)) {
    throw new VaultRecordEligibilityError('INVALID_STATE');
  }

  if (isDevelopmentFixtureResult(result)) {
    if (!allowDevelopmentFixture) {
      throw new VaultRecordEligibilityError('INVALID_STATE');
    }

    const provenance = createProvenance(
      'DEVELOPMENT_FIXTURE',
      timestamp,
      result,
      timeState,
      'chart-workspace.development-fixture'
    );
    return {
      ...createRecordBase(input, timestamp),
      canonicalChartResult: clone(result),
      engineVersion: result.engineVersion,
      chartSchemaVersion: result.schemaVersion,
      astronomyConfigurationId: null,
      provenanceEnvelopeId: null,
      recordVersion: 1,
      scientificStatus: 'INPUT_ONLY',
      calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
      recordOrigin: 'DEVELOPMENT_FIXTURE',
      sourceContext: 'chart-workspace.development-fixture',
      timeAuthorityState: timeState,
      chartResultContractVersion: result.schemaVersion,
      scientificConfigurationIdentity: null,
      scientificProvenance: provenance
    };
  }

  if (
    input.saveMode !== 'CHART_RESULT_AVAILABLE' ||
    result.calculationStatus !== 'COMPLETE' ||
    result.metadata.configurationStatus !== 'COMPLETE' ||
    location === null
  ) {
    throw new VaultRecordEligibilityError('INVALID_STATE');
  }

  const certification = certifyChartResultForRequest(input.chart, result);

  if (certification.outcome === 'REJECTED') {
    throw new VaultRecordEligibilityError('INVALID_STATE');
  }

  const provenance = createProvenance('USER_INPUT', timestamp, result, timeState);
  return {
    ...createRecordBase(input, timestamp),
    canonicalChartResult: clone(result),
    engineVersion: result.engineVersion,
    chartSchemaVersion: result.schemaVersion,
    astronomyConfigurationId: result.metadata.astronomyConfigurationId,
    provenanceEnvelopeId: result.metadata.provenanceEnvelopeId,
    recordVersion: 1,
    scientificStatus: 'CHART_RESULT_AVAILABLE',
    calculationAuthorityState: 'AUTHORITATIVE',
    recordOrigin: 'USER_INPUT',
    sourceContext: VAULT_RECORD_SOURCE_CONTEXT,
    timeAuthorityState: timeState,
    chartResultContractVersion: result.schemaVersion,
    scientificConfigurationIdentity: result.metadata.astronomyConfigurationId,
    scientificProvenance: provenance
  };
}

/**
 * Revalidates the authority relationship of a persisted record before it can
 * cross the Vault read/reload boundary. This never repairs or sanitizes a
 * contradictory historical record.
 */
export function assertVaultRecordAuthority(record: VaultChartRecord): void {
  if (getChartRequestAuthorityIssue(record.normalizedChartRequest) !== null) {
    throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
  }

  const expectedTimeState = timeAuthorityState(record.normalizedChartRequest);

  if (
    record.timeAuthorityState !== expectedTimeState ||
    record.scientificProvenance.timeAuthorityState !== expectedTimeState
  ) {
    throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
  }

  if (record.scientificStatus === 'RESEARCH_ONLY_SNAPSHOT') {
    const provenance = record.scientificProvenance;
    if (
      record.recordVersion !== 2 ||
      record.recordOrigin !== 'SERVER_RESEARCH_CAPTURE' ||
      record.sourceContext !== 'vault.research-capture' ||
      record.calculationAuthorityState !== 'AUTHORITY_INCOMPLETE' ||
      record.canonicalChartResult !== null ||
      record.researchSnapshot === undefined ||
      record.researchSnapshot === null ||
      record.engineVersion === null ||
      record.chartSchemaVersion === null ||
      record.chartResultContractVersion === null ||
      record.scientificConfigurationIdentity === null ||
      provenance.schemaVersion !== '2' ||
      provenance.recordOrigin !== 'SERVER_RESEARCH_CAPTURE' ||
      provenance.sourceContext !== 'vault.research-capture' ||
      provenance.calculationAuthorityState !== 'AUTHORITY_INCOMPLETE' ||
      provenance.provenanceEnvelopeId !== null ||
      provenance.captureId !== record.researchSnapshot.captureId ||
      provenance.captureReportSha256 !== record.researchSnapshot.captureReportSha256 ||
      provenance.captureResponseSha256 !== record.researchSnapshot.responseSha256 ||
      provenance.chartResultContractVersion !== record.chartResultContractVersion ||
      provenance.scientificConfigurationIdentity !==
        record.scientificConfigurationIdentity ||
      record.astronomyConfigurationId !== record.scientificConfigurationIdentity
    ) {
      throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
    }

    try {
      assertVaultResearchSnapshotIntegrity(
        record.researchSnapshot,
        record.normalizedChartRequest
      );
    } catch (_error) {
      throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
    }

    return;
  }

  if (
    record.scientificProvenance.schemaVersion !== '1' ||
    (record.researchSnapshot !== undefined && record.researchSnapshot !== null)
  ) {
    throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
  }

  if (record.scientificStatus === 'INPUT_ONLY') {
    if (
      record.calculationAuthorityState !== 'AUTHORITY_INCOMPLETE' ||
      record.scientificProvenance.calculationAuthorityState !==
        'AUTHORITY_INCOMPLETE' ||
      (record.canonicalChartResult !== null &&
        !isChartResult(record.canonicalChartResult)) ||
      (record.canonicalChartResult !== null &&
        record.recordOrigin !== 'DEVELOPMENT_FIXTURE')
    ) {
      throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
    }

    return;
  }

  if (
    record.recordOrigin !== 'USER_INPUT' ||
    record.calculationAuthorityState !== 'AUTHORITATIVE' ||
    record.scientificProvenance.calculationAuthorityState !== 'AUTHORITATIVE' ||
    record.canonicalChartResult === null ||
    !isChartResult(record.canonicalChartResult)
  ) {
    throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
  }

  const certification = certifyChartResultForRequest(
    record.normalizedChartRequest,
    record.canonicalChartResult
  );

  if (certification.outcome === 'REJECTED') {
    throw new VaultRecordEligibilityError('PERSISTED_AUTHORITY_MISMATCH');
  }
}

/** Returns whether a result is a development-only fixture snapshot. */
export function isDevelopmentVaultFixtureResult(result: ChartResult): boolean {
  return isDevelopmentFixtureResult(result);
}

/** Keeps the structural check local without exposing persistence details. */
export function isVaultRecordProvenance(value: unknown): value is VaultRecordProvenance {
  return (
    isRecord(value) &&
    (value.schemaVersion === '1' || value.schemaVersion === '2')
  );
}
