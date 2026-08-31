import type {
  SaveVaultChartApiRequest,
  SaveVaultChartApiResponse,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import { getLocalizedCurrentPath } from '../../lib/localization.js';

const VAULT_CHARTS_ENDPOINT = '/api/vault/charts';
const SIGN_IN_PATH = '/auth/sign-in';

export const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

export type SaveVaultChartResult =
  | { readonly status: 'saved'; readonly chart: VaultChartRecord }
  | { readonly status: 'invalid-request' }
  | { readonly status: 'failed' }
  | { readonly status: 'redirected' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
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
    isNullableString(value.astronomyConfigurationId) &&
    isNullableString(value.provenanceEnvelopeId) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isSaveVaultChartApiResponse(
  value: unknown
): value is SaveVaultChartApiResponse {
  return isRecord(value) && isVaultChartRecord(value.chart);
}

function isInvalidRequestProblem(value: unknown): boolean {
  return isRecord(value) && value.code === 'INVALID_REQUEST';
}

/** Saves metadata plus the normalized input; the server recalculates all scientific output. */
export async function saveVaultChart(
  request: SaveVaultChartApiRequest
): Promise<SaveVaultChartResult> {
  try {
    const response = await fetch(VAULT_CHARTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(request)
    });

    if (response.status === 401) {
      window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
      return { status: 'redirected' };
    }

    if (response.status === 201) {
      const payload: unknown = await response.json();

      return isSaveVaultChartApiResponse(payload)
        ? { status: 'saved', chart: payload.chart }
        : { status: 'failed' };
    }

    if (response.status === 400) {
      const payload: unknown = await response.json();

      return isInvalidRequestProblem(payload)
        ? { status: 'invalid-request' }
        : { status: 'failed' };
    }

    return { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}
