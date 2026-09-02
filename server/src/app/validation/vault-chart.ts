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
export const VAULT_CHART_IDENTIFIER_MAXIMUM_CHARACTERS = 256;
export const VAULT_CHART_TAG_MAXIMUM_COUNT = 20;
export const VAULT_CHART_TAG_MAXIMUM_CHARACTERS = 64;
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

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

function isSafeText(value: string, maximumCharacters: number): boolean {
  return (
    Array.from(value).length <= maximumCharacters &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
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
    isSafeText(normalizedDisplayName, VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS)
  );
}

export function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length <= VAULT_CHART_TAG_MAXIMUM_COUNT &&
    value.every(
      (item) =>
        typeof item === 'string' &&
        item.trim().length > 0 &&
        isSafeText(item.trim(), VAULT_CHART_TAG_MAXIMUM_CHARACTERS)
    )
  );
}

export function normalizeVaultChartTags(tags: readonly string[]): string[] {
  return tags.map((tag) => tag.trim());
}

export function isVaultChartIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    isSafeText(value, VAULT_CHART_IDENTIFIER_MAXIMUM_CHARACTERS) &&
    !value.includes('/')
  );
}

export function isMetadataUpdate(value: unknown): value is UpdateVaultChartMetadataApiRequest {
  if (
    !isRecord(value) ||
    Object.keys(value).length === 0 ||
    !hasOnlyKeys(value, METADATA_UPDATE_KEYS)
  ) {
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
    isValidVaultChartDisplayName(value.displayName) &&
    isVaultChartCategory(value.category) &&
    isStringArray(value.tags) &&
    typeof value.favorite === 'boolean'
  );
}
