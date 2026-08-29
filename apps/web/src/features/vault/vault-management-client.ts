import type {
  ChartNoteRecord,
  UpdateVaultChartMetadataApiRequest,
  VaultChartRecord
} from '@natalnode/contracts';

import {
  isCreateChartNoteApiResponse,
  isDeleteChartResponse,
  isDeleteNoteResponse,
  isDuplicateVaultChartApiResponse,
  isListChartNotesApiResponse,
  isUpdateChartNoteApiResponse,
  isUpdateVaultChartMetadataApiResponse
} from './vault-management-contract-guards.js';

const VAULT_CHARTS_ENDPOINT = '/api/vault/charts';

type VaultRequestFailure =
  | { readonly status: 'invalid-request' }
  | { readonly status: 'unauthorized' }
  | { readonly status: 'not-found' }
  | { readonly status: 'failed' };

export type UpdateVaultChartResult =
  | { readonly status: 'success'; readonly chart: VaultChartRecord }
  | VaultRequestFailure;

export type DuplicateVaultChartResult =
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

export async function duplicateVaultChart(
  chartId: string,
  signal?: AbortSignal
): Promise<DuplicateVaultChartResult> {
  try {
    const response = await fetch(
      `${VAULT_CHARTS_ENDPOINT}/${encodeURIComponent(chartId)}/duplicate`,
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal
      }
    );
    const failure = readFailureOrContinue(response, 201);

    if (failure) {
      return failure;
    }

    const payload: unknown = await response.json();

    return isDuplicateVaultChartApiResponse(payload)
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
