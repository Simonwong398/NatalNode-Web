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
  return value === null || isBoundedString(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const CHART_REQUEST_STRING_MAXIMUM_CHARACTERS = 256;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

function isBoundedString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    Array.from(value).length <= CHART_REQUEST_STRING_MAXIMUM_CHARACTERS &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function isBirthTimeAmbiguityStatus(value: unknown): value is BirthTimeAmbiguityStatus {
  return BIRTH_TIME_AMBIGUITY_STATUSES.some((status) => status === value);
}

export function isBirthRequest(value: unknown): value is BirthRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoundedString(value.localDate) &&
    isStringOrNull(value.localTime) &&
    isBoundedString(value.locationLabel) &&
    isFiniteNumber(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    isFiniteNumber(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    isBoundedString(value.ianaTimeZone) &&
    isStringOrNull(value.resolvedUtcInstant) &&
    (value.utcOffsetSeconds === null ||
      (isFiniteNumber(value.utcOffsetSeconds) &&
        Math.abs(value.utcOffsetSeconds) <= 86_400)) &&
    isBoundedString(value.timezoneDatabaseVersion) &&
    isBoundedString(value.timezoneResolutionMethod) &&
    isBirthTimeAmbiguityStatus(value.ambiguityStatus)
  );
}

export function isChartRequest(value: unknown): value is ChartRequest {
  return isRecord(value) && isBirthRequest(value.birth) && isBoundedString(value.houseSystem);
}

export function isChartCalculationApiRequest(value: unknown): value is ChartCalculationApiRequest {
  return isRecord(value) && isChartRequest(value.chart);
}
