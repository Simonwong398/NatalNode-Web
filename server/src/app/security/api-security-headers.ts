import type { MiddlewareHandler } from 'hono';

export const API_SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
} as const;

export function applyApiSecurityHeaders(): MiddlewareHandler {
  return async (context, next) => {
    for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) {
      context.header(name, value);
    }

    await next();
  };
}
