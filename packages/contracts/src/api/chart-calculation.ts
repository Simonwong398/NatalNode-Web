import type { ChartRequest, ChartResult } from '../index.js';

export interface ChartCalculationApiRequest {
  readonly chart: ChartRequest;
}

export interface ChartCalculationApiResponse {
  readonly chart: ChartResult;
}

export type ChartCalculationApiErrorCode =
  | 'INVALID_REQUEST'
  | 'CALCULATION_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  readonly error: {
    readonly code: ChartCalculationApiErrorCode;
    readonly message: string;
  };
}
