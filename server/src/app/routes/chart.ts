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
      const outcome =
        await dependencies.chartCalculator.calculateChartWithOutcome(
          payload.chart
        );
      context.set('calculationObservability', outcome.observability);
      const { chart } = outcome;
      const response: ChartCalculationApiResponse = { chart };

      return context.json(response);
    } catch (_error) {
      return createProblemDetailsContextResponse(context, {
        code: 'CALCULATION_UNAVAILABLE'
      });
    }
  };
}
