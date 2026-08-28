import type { MiddlewareHandler } from 'hono';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';

const UNSAFE_METHODS = new Set(['POST', 'PATCH', 'DELETE']);

function isExactCanonicalOrigin(
  originHeader: string | null,
  expectedOrigin: string
): boolean {
  if (
    originHeader === null ||
    originHeader.length === 0 ||
    originHeader !== originHeader.trim() ||
    originHeader.includes(',')
  ) {
    return false;
  }

  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(originHeader);
  } catch (_error) {
    return false;
  }

  if (
    parsedOrigin.origin === 'null' ||
    parsedOrigin.username.length > 0 ||
    parsedOrigin.password.length > 0 ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search.length > 0 ||
    parsedOrigin.hash.length > 0
  ) {
    return false;
  }

  return (
    parsedOrigin.origin === expectedOrigin &&
    originHeader === parsedOrigin.origin
  );
}

export function enforceSameOriginUnsafeApiRequests(
  expectedOrigin: string
): MiddlewareHandler {
  return async (context, next) => {
    const method = context.req.raw.method;

    if (!UNSAFE_METHODS.has(method)) {
      await next();
      return;
    }

    const originHeader = context.req.raw.headers.get('origin');

    if (!isExactCanonicalOrigin(originHeader, expectedOrigin)) {
      return createProblemDetailsContextResponse(context, {
        code: 'FORBIDDEN'
      });
    }

    await next();
  };
}
