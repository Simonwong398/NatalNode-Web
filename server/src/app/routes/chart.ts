import type { Context } from 'hono';
import type { ChartCalculationApiResponse } from '@natalnode/contracts';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  isChartCalculationApiRequest,
  readBoundedJson
} from '../validation/index.js';

const CHART_REQUEST_MAXIMUM_BYTES = 16 * 1024;

export function createChartRoute(dependencies: ServerDependencies) {
  return async (context: Context) => {
    const parsed = await readBoundedJson(
      context.req.raw,
      CHART_REQUEST_MAXIMUM_BYTES
    );

    if (parsed.outcome === 'unsupported-media-type') {
      return createProblemDetailsContextResponse(context, {
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }

    if (parsed.outcome === 'too-large') {
      return createProblemDetailsContextResponse(context, {
        code: 'PAYLOAD_TOO_LARGE'
      });
    }

    if (parsed.outcome === 'invalid') {
      return createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
    }

    const payload = parsed.value;

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
