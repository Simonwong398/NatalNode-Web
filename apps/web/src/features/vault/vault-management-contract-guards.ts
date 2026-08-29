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

function isVaultChartRecord(value: unknown): value is VaultChartRecord {
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
    isRecord(value.canonicalChartResult) &&
    typeof value.engineVersion === 'string' &&
    typeof value.chartSchemaVersion === 'string' &&
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
