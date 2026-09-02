import type {
  VaultChartListCursor,
  VaultChartListOptions
} from '../../persistence/vault-chart-repository.js';
import { isVaultChartIdentifier } from './vault-chart.js';

export const VAULT_CHART_LIST_DEFAULT_LIMIT = 50;
export const VAULT_CHART_LIST_MAXIMUM_LIMIT = 100;
const VAULT_CHART_CURSOR_MAXIMUM_CHARACTERS = 1_024;

interface EncodedVaultChartCursor {
  readonly v: 1;
  readonly u: string;
  readonly t: string;
  readonly i: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value;
}

function isEncodedCursor(
  value: unknown,
  userId: string
): value is EncodedVaultChartCursor {
  return (
    isRecord(value) &&
    value.v === 1 &&
    value.u === userId &&
    typeof value.u === 'string' &&
    isCanonicalTimestamp(value.t) &&
    typeof value.i === 'string' &&
    isVaultChartIdentifier(value.i) &&
    Object.keys(value).every((key) => ['v', 'u', 't', 'i'].includes(key))
  );
}

export function encodeVaultChartListCursor(
  userId: string,
  cursor: VaultChartListCursor
): string {
  const encoded: EncodedVaultChartCursor = {
    v: 1,
    u: userId,
    t: cursor.createdAt,
    i: cursor.chartId
  };
  const value = Buffer.from(JSON.stringify(encoded), 'utf8').toString('base64url');

  if (value.length > VAULT_CHART_CURSOR_MAXIMUM_CHARACTERS) {
    throw new Error('Vault chart cursor is too large.');
  }

  return value;
}

function decodeVaultChartListCursor(
  value: string,
  userId: string
): VaultChartListCursor | null {
  if (
    value.length === 0 ||
    value.length > VAULT_CHART_CURSOR_MAXIMUM_CHARACTERS ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8')
    ) as unknown;

    return isEncodedCursor(decoded, userId)
      ? { createdAt: decoded.t, chartId: decoded.i }
      : null;
  } catch (_error) {
    return null;
  }
}

function parseLimit(value: string | undefined): number | null {
  if (value === undefined) {
    return VAULT_CHART_LIST_DEFAULT_LIMIT;
  }

  if (!/^[1-9]\d*$/u.test(value)) {
    return null;
  }

  const limit = Number(value);
  return Number.isSafeInteger(limit) && limit <= VAULT_CHART_LIST_MAXIMUM_LIMIT
    ? limit
    : null;
}

export function parseVaultChartListQuery(
  limitValue: string | undefined,
  cursorValue: string | undefined,
  userId: string
): VaultChartListOptions | null {
  const limit = parseLimit(limitValue);

  if (limit === null) {
    return null;
  }

  if (cursorValue === undefined) {
    return { limit, cursor: null };
  }

  const cursor = decodeVaultChartListCursor(cursorValue, userId);
  return cursor === null ? null : { limit, cursor };
}
