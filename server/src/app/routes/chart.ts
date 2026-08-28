import type { Context } from 'hono';
import type { ChartCalculationApiResponse } from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import { isChartCalculationApiRequest } from '../validation/index.js';

export function createChartRoute(dependencies: ServerDependencies) {
  return async (context: Context) => {
    let payload: unknown;

    try {
      payload = await context.req.json();
    } catch (_error) {
      return createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
    }

    if (!isChartCalculationApiRequest(payload)) {
      return createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
    }

    try {
      const chart = await dependencies.engineClient.calculateChart(payload.chart);
      const response: ChartCalculationApiResponse = { chart };

      return context.json(response);
    } catch (_error) {
      return createProblemDetailsContextResponse(context, {
        code: 'CALCULATION_UNAVAILABLE'
      });
    }
  };
}
