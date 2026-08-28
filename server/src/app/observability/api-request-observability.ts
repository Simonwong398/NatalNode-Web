import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { Context, MiddlewareHandler } from 'hono';

export const REQUEST_ID_HEADER = 'X-Request-Id';

type EndpointFamily =
  | 'health'
  | 'chart'
  | 'sky.snapshot'
  | 'sky.events'
  | 'auth.email.request'
  | 'auth.email.complete'
  | 'auth.session'
  | 'auth.logout'
  | 'account.delete'
  | 'account.export'
  | 'account.export.prepare'
  | 'feedback'
  | 'vault.charts'
  | 'vault.chart'
  | 'vault.notes'
  | 'unknown-api';

interface ApiRequestContextVariables {
  requestId: string;
}

declare module 'hono' {
  interface ContextVariableMap extends ApiRequestContextVariables {}
}

interface OperationalRequestRecord {
  readonly timestamp: string;
  readonly level: 'info' | 'error';
  readonly event: 'api.request.completed' | 'api.request.error';
  readonly requestId: string;
  readonly method: string;
  readonly endpointFamily: EndpointFamily;
  readonly status: number;
  readonly durationMs?: number;
}

const KNOWN_HTTP_METHODS = new Set([
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT'
]);

function boundedMethod(method: string): string {
  return KNOWN_HTTP_METHODS.has(method) ? method : 'OTHER';
}

export function classifyApiEndpointFamily(pathname: string): EndpointFamily {
  if (pathname === '/api/health') return 'health';
  if (pathname === '/api/chart') return 'chart';
  if (pathname === '/api/sky/snapshot') return 'sky.snapshot';
  if (pathname === '/api/sky/events') return 'sky.events';
  if (pathname === '/api/auth/email/request') return 'auth.email.request';
  if (pathname === '/api/auth/email/complete') return 'auth.email.complete';
  if (pathname === '/api/auth/session') return 'auth.session';
  if (pathname === '/api/auth/logout') return 'auth.logout';
  if (pathname === '/api/account') return 'account.delete';
  if (pathname === '/api/account/export/prepare') return 'account.export.prepare';
  if (pathname === '/api/account/export') return 'account.export';
  if (pathname === '/api/feedback') return 'feedback';
  if (pathname === '/api/vault/charts') return 'vault.charts';
  if (/^\/api\/vault\/charts\/[^/]+$/u.test(pathname)) return 'vault.chart';
  if (/^\/api\/vault\/charts\/[^/]+\/notes(?:\/[^/]+)?$/u.test(pathname)) {
    return 'vault.notes';
  }

  return 'unknown-api';
}

function writeOperationalRecord(record: OperationalRequestRecord): void {
  try {
    const line = `${JSON.stringify(record)}\n`;
    const stream = record.level === 'error' ? process.stderr : process.stdout;
    stream.write(line);
  } catch (_error) {
    // Operational logging must never change authoritative request behavior.
  }
}

function requestFacts(context: Context): {
  readonly requestId: string;
  readonly method: string;
  readonly endpointFamily: EndpointFamily;
} {
  return {
    requestId: context.get('requestId'),
    method: boundedMethod(context.req.raw.method),
    endpointFamily: classifyApiEndpointFamily(context.req.path)
  };
}

export function observeApiRequests(): MiddlewareHandler {
  return async (context, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();

    context.set('requestId', requestId);
    context.header(REQUEST_ID_HEADER, requestId);

    await next();

    writeOperationalRecord({
      timestamp: new Date().toISOString(),
      level: context.res.status >= 500 ? 'error' : 'info',
      event: 'api.request.completed',
      ...requestFacts(context),
      status: context.res.status,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt))
    });
  };
}

export function logUnhandledApiError(context: Context): void {
  writeOperationalRecord({
    timestamp: new Date().toISOString(),
    level: 'error',
    event: 'api.request.error',
    ...requestFacts(context),
    status: 500
  });
}
