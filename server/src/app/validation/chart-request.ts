import type {
  BirthRequest,
  BirthTimeAmbiguityStatus,
  ChartCalculationApiRequest,
  ChartRequest
} from '@natalnode/contracts';

const BIRTH_TIME_AMBIGUITY_STATUSES: readonly BirthTimeAmbiguityStatus[] = [
  'EXACT',
  'AMBIGUOUS',
  'NONEXISTENT',
  'UNKNOWN_TIME'
];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBirthTimeAmbiguityStatus(value: unknown): value is BirthTimeAmbiguityStatus {
  return BIRTH_TIME_AMBIGUITY_STATUSES.some((status) => status === value);
}

export function isBirthRequest(value: unknown): value is BirthRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.localDate === 'string' &&
    isStringOrNull(value.localTime) &&
    typeof value.locationLabel === 'string' &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    typeof value.ianaTimeZone === 'string' &&
    isStringOrNull(value.resolvedUtcInstant) &&
    (isFiniteNumber(value.utcOffsetSeconds) || value.utcOffsetSeconds === null) &&
    typeof value.timezoneDatabaseVersion === 'string' &&
    typeof value.timezoneResolutionMethod === 'string' &&
    isBirthTimeAmbiguityStatus(value.ambiguityStatus)
  );
}

export function isChartRequest(value: unknown): value is ChartRequest {
  return isRecord(value) && isBirthRequest(value.birth) && typeof value.houseSystem === 'string';
}

export function isChartCalculationApiRequest(value: unknown): value is ChartCalculationApiRequest {
  return isRecord(value) && isChartRequest(value.chart);
}
