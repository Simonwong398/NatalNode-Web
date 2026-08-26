import type {
  ChartNoteRecord,
  CreateChartNoteApiResponse,
  DeleteChartNoteApiResponse,
  DeleteVaultChartApiResponse,
  ListChartNotesApiResponse,
  UpdateChartNoteApiResponse,
  UpdateVaultChartMetadataApiRequest,
  UpdateVaultChartMetadataApiResponse,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';

const VAULT_CHARTS_ENDPOINT = '/api/vault/charts';

export const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

export const DISPLAY_NAME_MAXIMUM_CHARACTERS = 120;
export const CHART_NOTE_MAXIMUM_CHARACTERS = 5_000;

type VaultRequestFailure =
  | { readonly status: 'invalid-request' }
  | { readonly status: 'unauthorized' }
  | { readonly status: 'not-found' }
  | { readonly status: 'failed' };

export type UpdateVaultChartResult =
  | { readonly status: 'success'; readonly chart: VaultChartRecord }
  | VaultRequestFailure;

export type ChartNotesResult =
  | { readonly status: 'success'; readonly notes: readonly ChartNoteRecord[] }
  | VaultRequestFailure;

export type ChartNoteResult =
  | { readonly status: 'success'; readonly note: ChartNoteRecord }
  | VaultRequestFailure;

export type DeleteResult =
  | { readonly status: 'success' }
  | VaultRequestFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
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

function isUpdateVaultChartMetadataApiResponse(
  value: unknown
): value is UpdateVaultChartMetadataApiResponse {
  return isRecord(value) && isVaultChartRecord(value.chart);
}

function isListChartNotesApiResponse(value: unknown): value is ListChartNotesApiResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.notes) &&
    value.notes.every((note) => isChartNoteRecord(note))
  );
}

function isCreateChartNoteApiResponse(value: unknown): value is CreateChartNoteApiResponse {
  return isRecord(value) && isChartNoteRecord(value.note);
}

function isUpdateChartNoteApiResponse(value: unknown): value is UpdateChartNoteApiResponse {
  return isRecord(value) && isChartNoteRecord(value.note);
}

function isDeleteChartResponse(value: unknown): value is DeleteVaultChartApiResponse {
  return isRecord(value) && value.deleted === true;
}

function isDeleteNoteResponse(value: unknown): value is DeleteChartNoteApiResponse {
  return isRecord(value) && value.deleted === true;
}

function responseFailure(response: Response): VaultRequestFailure {
  if (response.status === 400) {
    return { status: 'invalid-request' };
  }

  if (response.status === 401) {
    return { status: 'unauthorized' };
  }

  if (response.status === 404) {
    return { status: 'not-found' };
  }

  return { status: 'failed' };
}

function jsonRequest(
  method: 'PATCH' | 'POST',
  body: unknown,
  signal?: AbortSignal
): RequestInit {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(body),
    signal
  };
}

function readFailureOrContinue(
  response: Response,
  expectedStatus: number
): VaultRequestFailure | null {
  return response.status === expectedStatus ? null : responseFailure(response);
}

export function normalizeDisplayName(value: string): string {
  return value.trim();
}

export function normalizeNoteContent(value: string): string {
  return value.replace(/\r\n?/gu, '\n').trim();
}

function containsOnlyUnicodeScalarValues(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);

      if (
        index + 1 >= value.length ||
        nextCodeUnit < 0xdc00 ||
        nextCodeUnit > 0xdfff
      ) {
        return false;
      }

      index += 1;
      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
}

const DISALLOWED_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/u;

export function validateDisplayName(value: string): string | null {
  const normalizedValue = normalizeDisplayName(value);

  if (normalizedValue.length === 0) {
    return 'Enter a chart name.';
  }

  if (Array.from(normalizedValue).length > DISPLAY_NAME_MAXIMUM_CHARACTERS) {
    return `Use ${DISPLAY_NAME_MAXIMUM_CHARACTERS} characters or fewer.`;
  }

  return null;
}

export function validateNoteContent(value: string): string | null {
  const normalizedValue = normalizeNoteContent(value);

  if (normalizedValue.length === 0) {
    return 'Enter a note.';
  }

  if (Array.from(normalizedValue).length > CHART_NOTE_MAXIMUM_CHARACTERS) {
    return `Use ${CHART_NOTE_MAXIMUM_CHARACTERS.toLocaleString()} characters or fewer.`;
  }

  if (
    DISALLOWED_CONTROL_CHARACTER_PATTERN.test(normalizedValue) ||
    !containsOnlyUnicodeScalarValues(normalizedValue)
  ) {
    return 'Remove unsupported control characters from the note.';
  }

  return null;
}

export async function updateVaultChartMetadata(
  chartId: string,
  request: UpdateVaultChartMetadataApiRequest,
  signal?: AbortSignal
): Promise<UpdateVaultChartResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}`,
      jsonRequest('PATCH', request, signal)
    );
    const failure = readFailureOrContinue(response, 200);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isUpdateVaultChartMetadataApiResponse(payload)
      ? { status: 'success', chart: payload.chart }
      : { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}

export async function listChartNotes(
  chartId: string,
  signal?: AbortSignal
): Promise<ChartNotesResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}/notes`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal
      }
    );
    const failure = readFailureOrContinue(response, 200);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isListChartNotesApiResponse(payload)
      ? { status: 'success', notes: payload.notes }
      : { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}

export async function createChartNote(
  chartId: string,
  content: string,
  signal?: AbortSignal
): Promise<ChartNoteResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}/notes`,
      jsonRequest('POST', { content }, signal)
    );
    const failure = readFailureOrContinue(response, 201);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isCreateChartNoteApiResponse(payload)
      ? { status: 'success', note: payload.note }
      : { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}

export async function updateChartNote(
  chartId: string,
  noteId: string,
  content: string,
  signal?: AbortSignal
): Promise<ChartNoteResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}/notes/${encodeURIComponent(noteId)}`,
      jsonRequest('PATCH', { content }, signal)
    );
    const failure = readFailureOrContinue(response, 200);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isUpdateChartNoteApiResponse(payload)
      ? { status: 'success', note: payload.note }
      : { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}

export async function deleteChartNote(
  chartId: string,
  noteId: string,
  signal?: AbortSignal
): Promise<DeleteResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}/notes/${encodeURIComponent(noteId)}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal
      }
    );
    const failure = readFailureOrContinue(response, 200);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isDeleteNoteResponse(payload) ? { status: 'success' } : { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}

export async function deleteVaultChart(
  chartId: string,
  signal?: AbortSignal
): Promise<DeleteResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal
      }
    );
    const failure = readFailureOrContinue(response, 200);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isDeleteChartResponse(payload) ? { status: 'success' } : { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}
