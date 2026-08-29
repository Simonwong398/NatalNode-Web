import { createHash } from 'node:crypto';
import type { ChartRequest } from '@natalnode/contracts';

export const CACHE_FORMAT_VERSION = 'v1' as const;

const MAX_CACHE_IDENTITY_STRING_LENGTH = 256;

export interface ChartResultCacheIdentity {
  readonly runtimeNamespace: string;
  readonly engineResultGeneration: string;
  readonly chartResultContractVersion: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function assertNonEmptyBoundedString(
  value: unknown,
  name: string
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > MAX_CACHE_IDENTITY_STRING_LENGTH
  ) {
    throw new Error(`${name} must be a non-empty bounded string.`);
  }
}

export function assertChartResultCacheIdentity(
  identity: ChartResultCacheIdentity
): void {
  if (!isRecord(identity)) {
    throw new Error('Chart result cache identity is invalid.');
  }

  assertNonEmptyBoundedString(
    identity.runtimeNamespace,
    'runtimeNamespace'
  );
  assertNonEmptyBoundedString(
    identity.engineResultGeneration,
    'engineResultGeneration'
  );
  assertNonEmptyBoundedString(
    identity.chartResultContractVersion,
    'chartResultContractVersion'
  );
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }
}

function assertStringOrNull(
  value: unknown,
  name: string
): asserts value is string | null {
  if (typeof value !== 'string' && value !== null) {
    throw new Error(`${name} must be a string or null.`);
  }
}

function normalizeFiniteNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }

  return Object.is(value, -0) ? 0 : value;
}

function normalizeNullableFiniteNumber(
  value: unknown,
  name: string
): number | null {
  if (value === null) {
    return null;
  }

  return normalizeFiniteNumber(value, name);
}

/**
 * Builds the only serialized input representation used by the cache key.
 * This intentionally does not serialize the arbitrary ChartRequest object.
 */
export function createCanonicalChartInputJson(
  request: ChartRequest
): string {
  if (!isRecord(request) || !isRecord(request.birth)) {
    throw new Error('Chart request is invalid for cache key derivation.');
  }

  const birth = request.birth;

  assertString(birth.localDate, 'localDate');
  assertStringOrNull(birth.localTime, 'localTime');
  assertString(birth.ianaTimeZone, 'ianaTimeZone');
  assertStringOrNull(birth.resolvedUtcInstant, 'resolvedUtcInstant');
  assertString(
    birth.timezoneDatabaseVersion,
    'timezoneDatabaseVersion'
  );
  assertString(
    birth.timezoneResolutionMethod,
    'timezoneResolutionMethod'
  );
  assertString(birth.ambiguityStatus, 'ambiguityStatus');
  assertString(request.houseSystem, 'houseSystem');

  const canonicalInput = {
    localDate: birth.localDate,
    localTime: birth.localTime,
    latitude: normalizeFiniteNumber(birth.latitude, 'latitude'),
    longitude: normalizeFiniteNumber(birth.longitude, 'longitude'),
    ianaTimeZone: birth.ianaTimeZone,
    resolvedUtcInstant: birth.resolvedUtcInstant,
    utcOffsetSeconds: normalizeNullableFiniteNumber(
      birth.utcOffsetSeconds,
      'utcOffsetSeconds'
    ),
    timezoneDatabaseVersion: birth.timezoneDatabaseVersion,
    timezoneResolutionMethod: birth.timezoneResolutionMethod,
    ambiguityStatus: birth.ambiguityStatus,
    houseSystem: request.houseSystem
  };

  return JSON.stringify(canonicalInput);
}

export function createChartResultCacheKey(
  request: ChartRequest,
  identity: ChartResultCacheIdentity
): string {
  assertChartResultCacheIdentity(identity);

  const canonicalInputJson = createCanonicalChartInputJson(request);
  const inputDigest = createHash('sha256')
    .update(canonicalInputJson, 'utf8')
    .digest('hex');

  return [
    CACHE_FORMAT_VERSION,
    identity.runtimeNamespace,
    identity.engineResultGeneration,
    identity.chartResultContractVersion,
    inputDigest
  ].join(':');
}
