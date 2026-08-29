import type { Context } from 'hono';
import {
  createProblemDetailsResponse,
  type CreateProblemDetailsInput
} from './index.js';

/**
 * Preserve headers prepared by Hono middleware while reusing the canonical
 * Problem Details serializer.
 */
export function createProblemDetailsContextResponse(
  context: Context,
  input: CreateProblemDetailsInput
): Response {
  const response = createProblemDetailsResponse(input);
  context.set('problemCode', input.code);
  return context.newResponse(response.body, response);
}
