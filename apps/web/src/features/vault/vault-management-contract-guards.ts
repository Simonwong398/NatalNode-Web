import type {
  ChartNoteRecord,
  CreateChartNoteApiResponse,
  DeleteChartNoteApiResponse,
  DeleteVaultChartApiResponse,
  DuplicateVaultChartApiResponse,
  ListChartNotesApiResponse,
  UpdateChartNoteApiResponse,
  UpdateVaultChartMetadataApiResponse,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return (
    value === 'SELF' ||
    value === 'PARTNER' ||
    value === 'FAMILY' ||
    value === 'FRIEND' ||
    value === 'CLIENT'
  );
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isVaultChartRecordState(value: Record<string, unknown>): boolean {
  if (value.scientificStatus === undefined) {
    return (
      isRecord(value.canonicalChartResult) &&
      typeof value.engineVersion === 'string' &&
      typeof value.chartSchemaVersion === 'string'
    );
  }

  const isInputOnly = value.scientificStatus === 'INPUT_ONLY';
  const isAvailable = value.scientificStatus === 'CHART_RESULT_AVAILABLE';

  if (!isInputOnly && !isAvailable) {
    return false;
  }

  if (
    typeof value.recordVersion !== 'number' ||
    !Number.isSafeInteger(value.recordVersion) ||
    value.recordVersion < 1 ||
    (isInputOnly && value.calculationAuthorityState !== 'AUTHORITY_INCOMPLETE') ||
    (isAvailable && value.calculationAuthorityState !== 'AUTHORITATIVE') ||
    (isAvailable && value.recordOrigin !== 'USER_INPUT') ||
    (!isAvailable &&
      value.recordOrigin !== 'USER_INPUT' &&
      value.recordOrigin !== 'DEVELOPMENT_FIXTURE') ||
    typeof value.sourceContext !== 'string' ||
    ![
      'UNRESOLVED',
      'RESOLVED',
      'AMBIGUOUS',
      'NONEXISTENT',
      'UNKNOWN_BIRTH_TIME'
    ].includes(value.timeAuthorityState as string) ||
    !isNullableString(value.chartResultContractVersion) ||
    !isNullableString(value.scientificConfigurationIdentity) ||
    !isRecord(value.scientificProvenance) ||
    value.scientificProvenance.schemaVersion !== '1' ||
    typeof value.savedAt !== 'string'
  ) {
    return false;
  }

  if (isAvailable) {
    return (
      isRecord(value.canonicalChartResult) &&
      typeof value.engineVersion === 'string' &&
      typeof value.chartSchemaVersion === 'string'
    );
  }

  return (
    value.canonicalChartResult === null ||
    (value.recordOrigin === 'DEVELOPMENT_FIXTURE' &&
      isRecord(value.canonicalChartResult))
  );
}

export function isVaultChartRecord(value: unknown): value is VaultChartRecord {
  return (
    isRecord(value) &&
    typeof value.chartId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.displayName === 'string' &&
    isVaultChartCategory(value.category) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.favorite === 'boolean' &&
    isRecord(value.normalizedChartRequest) &&
    isVaultChartRecordState(value) &&
    (typeof value.astronomyConfigurationId === 'string' ||
      value.astronomyConfigurationId === null) &&
    (typeof value.provenanceEnvelopeId === 'string' ||
      value.provenanceEnvelopeId === null) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isChartNoteRecord(value: unknown): value is ChartNoteRecord {
  return (
    isRecord(value) &&
    typeof value.noteId === 'string' &&
    typeof value.chartId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function isUpdateVaultChartMetadataApiResponse(
  value: unknown
): value is UpdateVaultChartMetadataApiResponse {
  return isRecord(value) && isVaultChartRecord(value.chart);
}

export function isDuplicateVaultChartApiResponse(
  value: unknown
): value is DuplicateVaultChartApiResponse {
  return isRecord(value) && isVaultChartRecord(value.chart);
}

export function isListChartNotesApiResponse(
  value: unknown
): value is ListChartNotesApiResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.notes) &&
    value.notes.every((note) => isChartNoteRecord(note))
  );
}

export function isCreateChartNoteApiResponse(
  value: unknown
): value is CreateChartNoteApiResponse {
  return isRecord(value) && isChartNoteRecord(value.note);
}

export function isUpdateChartNoteApiResponse(
  value: unknown
): value is UpdateChartNoteApiResponse {
  return isRecord(value) && isChartNoteRecord(value.note);
}

export function isDeleteChartResponse(
  value: unknown
): value is DeleteVaultChartApiResponse {
  return isRecord(value) && value.deleted === true;
}

export function isDeleteNoteResponse(
  value: unknown
): value is DeleteChartNoteApiResponse {
  return isRecord(value) && value.deleted === true;
}
