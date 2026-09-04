import type {
  SaveVaultChartApiRequest,
  SaveVaultChartApiResponse,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import { isVaultChartRecord } from './vault-management-contract-guards.js';

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
  | { readonly status: 'capacity-reached' }
  | { readonly status: 'invalid-state' }
  | { readonly status: 'failed' }
  | { readonly status: 'redirected' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
}

function isSaveVaultChartApiResponse(
  value: unknown
): value is SaveVaultChartApiResponse {
  return isRecord(value) && isVaultChartRecord(value.chart);
}

function isInvalidRequestProblem(value: unknown): boolean {
  return isRecord(value) && value.code === 'INVALID_REQUEST';
}

/** Saves the normalized input; the server owns eligibility and scientific state. */
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

    if (response.status === 409) {
      const payload: unknown = await response.json();

      if (isRecord(payload) && payload.code === 'CAPACITY_REACHED') {
        return { status: 'capacity-reached' };
      }

      if (isRecord(payload) && payload.code === 'INVALID_STATE') {
        return { status: 'invalid-state' };
      }
    }

    return { status: 'failed' };
  } catch (_error) {
    return { status: 'failed' };
  }
}
