import type { Context } from 'hono';
import type { ApiErrorResponse, ChartCalculationApiResponse } from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';
import { isChartCalculationApiRequest } from '../validation/index.js';

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
