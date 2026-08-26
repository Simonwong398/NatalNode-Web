import type {
  SaveVaultChartApiRequest,
  UpdateVaultChartMetadataApiRequest,
  VaultChartCategory
} from '@natalnode/contracts';
import { isChartRequest, isRecord } from './chart-request.js';

const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

const METADATA_UPDATE_KEYS = ['displayName', 'category', 'tags', 'favorite'] as const;
export const VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS = 120;
const SAVE_VAULT_CHART_KEYS = [
  'chart',
  'displayName',
  'category',
  'tags',
  'favorite'
] as const;

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.some((allowedKey) => allowedKey === key));
}

export function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
}

export function normalizeVaultChartDisplayName(displayName: string): string {
  return displayName.trim();
}

export function isValidVaultChartDisplayName(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedDisplayName = normalizeVaultChartDisplayName(value);

  return (
    normalizedDisplayName.length > 0 &&
    Array.from(normalizedDisplayName).length <=
      VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS
  );
}

export function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isMetadataUpdate(value: unknown): value is UpdateVaultChartMetadataApiRequest {
  if (!isRecord(value) || !hasOnlyKeys(value, METADATA_UPDATE_KEYS)) {
    return false;
  }

  return (
    (!hasOwn(value, 'displayName') || isValidVaultChartDisplayName(value.displayName)) &&
    (!hasOwn(value, 'category') || isVaultChartCategory(value.category)) &&
    (!hasOwn(value, 'tags') || isStringArray(value.tags)) &&
    (!hasOwn(value, 'favorite') || typeof value.favorite === 'boolean')
  );
}

export function isSaveVaultChartApiRequest(value: unknown): value is SaveVaultChartApiRequest {
  if (!isRecord(value) || !hasOnlyKeys(value, SAVE_VAULT_CHART_KEYS)) {
    return false;
  }

  return (
    SAVE_VAULT_CHART_KEYS.every((key) => hasOwn(value, key)) &&
    isChartRequest(value.chart) &&
    typeof value.displayName === 'string' &&
    isVaultChartCategory(value.category) &&
    isStringArray(value.tags) &&
    typeof value.favorite === 'boolean'
  );
}
