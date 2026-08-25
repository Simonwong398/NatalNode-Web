import type { Context } from 'hono';
import type {
  ApiErrorResponse,
  BirthRequest,
  BirthTimeAmbiguityStatus,
  ChartCalculationApiRequest,
  ChartCalculationApiResponse,
  ChartRequest
} from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';

const INVALID_REQUEST_RESPONSE: ApiErrorResponse = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid chart request.'
  }
};

const CALCULATION_UNAVAILABLE_RESPONSE: ApiErrorResponse = {
  error: {
    code: 'CALCULATION_UNAVAILABLE',
    message: 'Chart calculation is currently unavailable.'
  }
};

const BIRTH_TIME_AMBIGUITY_STATUSES: readonly BirthTimeAmbiguityStatus[] = [
  'EXACT',
  'AMBIGUOUS',
  'NONEXISTENT',
  'UNKNOWN_TIME'
];

function isRecord(value: unknown): value is Record<string, unknown> {
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

function isBirthRequest(value: unknown): value is BirthRequest {
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

function isChartRequest(value: unknown): value is ChartRequest {
  return isRecord(value) && isBirthRequest(value.birth) && typeof value.houseSystem === 'string';
}

function isChartCalculationApiRequest(value: unknown): value is ChartCalculationApiRequest {
  return isRecord(value) && isChartRequest(value.chart);
}

export function createChartRoute(dependencies: ServerDependencies) {
  return async (context: Context) => {
    let payload: unknown;

    try {
      payload = await context.req.json();
    } catch (_error) {
      return context.json(INVALID_REQUEST_RESPONSE, 400);
    }

    if (!isChartCalculationApiRequest(payload)) {
      return context.json(INVALID_REQUEST_RESPONSE, 400);
    }

    try {
      const chart = await dependencies.engineClient.calculateChart(payload.chart);
      const response: ChartCalculationApiResponse = { chart };

      return context.json(response);
    } catch (_error) {
      return context.json(CALCULATION_UNAVAILABLE_RESPONSE, 503);
    }
  };
}
