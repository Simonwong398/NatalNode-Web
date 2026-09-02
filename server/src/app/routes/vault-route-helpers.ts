import type { Context } from 'hono';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import { isVaultChartIdentifier } from '../validation/index.js';

export function readVaultRouteIdentifier(
  context: Context,
  parameterName: string
): string | Response {
  const identifier = context.req.param(parameterName);

  if (!isVaultChartIdentifier(identifier)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return identifier;
}
