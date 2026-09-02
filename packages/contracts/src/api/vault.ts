import type { ChartRequest } from '../chart.js';
import type { ChartNoteRecord, VaultChartCategory, VaultChartRecord } from '../vault.js';

export interface SaveVaultChartApiRequest {
  readonly chart: ChartRequest;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
}

export interface SaveVaultChartApiResponse {
  readonly chart: VaultChartRecord;
}

export interface DuplicateVaultChartApiResponse {
  readonly chart: VaultChartRecord;
}

export interface ListVaultChartsApiResponse {
  readonly charts: readonly VaultChartRecord[];
  readonly nextCursor: string | null;
}

export interface GetVaultChartApiResponse {
  readonly chart: VaultChartRecord;
}

export interface UpdateVaultChartMetadataApiRequest {
  readonly displayName?: string;
  readonly category?: VaultChartCategory;
  readonly tags?: readonly string[];
  readonly favorite?: boolean;
}

export interface UpdateVaultChartMetadataApiResponse {
  readonly chart: VaultChartRecord;
}

export interface DeleteVaultChartApiResponse {
  readonly deleted: true;
}

export interface CreateChartNoteApiRequest {
  readonly content: string;
}

export interface CreateChartNoteApiResponse {
  readonly note: ChartNoteRecord;
}

export interface ListChartNotesApiResponse {
  readonly notes: readonly ChartNoteRecord[];
}

export interface UpdateChartNoteApiRequest {
  readonly content: string;
}

export interface UpdateChartNoteApiResponse {
  readonly note: ChartNoteRecord;
}

export interface DeleteChartNoteApiResponse {
  readonly deleted: true;
}

export type VaultApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CALCULATION_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface VaultApiErrorResponse {
  readonly error: {
    readonly code: VaultApiErrorCode;
    readonly message: string;
  };
}
