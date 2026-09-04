import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { Context, MiddlewareHandler } from 'hono';
import type { ProblemCode } from '../problem-details/index.js';
import type { CalculationObservability } from './calculation-observability.js';

export const REQUEST_ID_HEADER = 'X-Request-Id';

export type EndpointFamily =
  | 'health'
  | 'chart'
  | 'location.search'
  | 'location.resolve'
  | 'sky.snapshot'
  | 'sky.events'
  | 'auth.email.request'
  | 'auth.email.complete'
  | 'auth.google.start'
  | 'auth.google.callback'
  | 'auth.session'
  | 'auth.logout'
  | 'account.delete'
  | 'account.export'
  | 'account.export.prepare'
  | 'account.notifications'
  | 'community'
  | 'practitioner'
  | 'feedback'
  | 'vault.charts'
  | 'vault.chart'
  | 'vault.notes'
  | 'unknown-api';

export type HttpMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OTHER';

interface ApiRequestContextVariables {
  requestId: string;
  problemCode: ProblemCode | undefined;
  calculationObservability: CalculationObservability | undefined;
}

declare module 'hono' {
  interface ContextVariableMap extends ApiRequestContextVariables {}
}

export interface OperationalRequestRecord {
  readonly timestamp: string;
  readonly level: 'info' | 'error';
  readonly event: 'api.request.completed';
  readonly requestId: string;
  readonly method: HttpMethod;
  readonly endpointFamily: EndpointFamily;
  readonly status: number;
  readonly durationMs: number;
  readonly problemCode?: ProblemCode;
  readonly cacheStatus?: CalculationObservability['cacheStatus'];
  readonly engineResultGeneration?: string;
  readonly chartResultContractVersion?: string;
  readonly scientificStatus?: CalculationObservability['scientificStatus'];
  readonly engineDurationMs?: number;
}

export interface ObservabilitySink {
  write(record: OperationalRequestRecord): void;
}

const KNOWN_HTTP_METHODS: ReadonlySet<string> = new Set([
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT'
]);

function boundedMethod(method: string): HttpMethod {
  return KNOWN_HTTP_METHODS.has(method)
    ? (method as Exclude<HttpMethod, 'OTHER'>)
    : 'OTHER';
}

export function classifyApiEndpointFamily(pathname: string): EndpointFamily {
  if (pathname === '/api/health') return 'health';
  if (pathname === '/api/chart') return 'chart';
  if (pathname === '/api/location/search') return 'location.search';
  if (pathname === '/api/location/resolve') return 'location.resolve';
  if (pathname === '/api/sky/snapshot') return 'sky.snapshot';
  if (pathname === '/api/sky/events') return 'sky.events';
  if (pathname === '/api/auth/email/request') return 'auth.email.request';
  if (pathname === '/api/auth/email/complete') return 'auth.email.complete';
  if (pathname === '/api/auth/google/start') return 'auth.google.start';
  if (pathname === '/api/auth/google/callback') return 'auth.google.callback';
  if (pathname === '/api/auth/session') return 'auth.session';
  if (pathname === '/api/auth/logout') return 'auth.logout';
  if (pathname === '/api/account') return 'account.delete';
  if (pathname === '/api/account/export/prepare') return 'account.export.prepare';
  if (pathname === '/api/account/export') return 'account.export';
  if (
    pathname === '/api/account/notifications' ||
    pathname.startsWith('/api/account/notifications/')
  ) {
    return 'account.notifications';
  }
  if (
    pathname === '/api/account/community-profile' ||
    pathname === '/api/community' ||
    pathname.startsWith('/api/community/')
  ) {
    return 'community';
  }
  if (
    pathname === '/api/practitioner' ||
    pathname.startsWith('/api/practitioner/') ||
    pathname === '/api/practitioners' ||
    pathname.startsWith('/api/practitioners/')
  ) {
    return 'practitioner';
  }
  if (pathname === '/api/feedback') return 'feedback';
  if (pathname === '/api/vault/charts') return 'vault.charts';
  if (/^\/api\/vault\/charts\/[^/]+\/duplicate$/u.test(pathname)) {
    return 'vault.chart';
  }
  if (/^\/api\/vault\/charts\/[^/]+$/u.test(pathname)) return 'vault.chart';
  if (/^\/api\/vault\/charts\/[^/]+\/notes(?:\/[^/]+)?$/u.test(pathname)) {
    return 'vault.notes';
  }

  return 'unknown-api';
}

function createDefaultObservabilitySink(): ObservabilitySink {
  return {
    write(record) {
      const line = JSON.stringify(record) + '\n';
      const stream = record.level === 'error' ? process.stderr : process.stdout;
      stream.write(line);
    }
  };
}

function requestFacts(context: Context): {
  readonly requestId: string;
  readonly method: HttpMethod;
  readonly endpointFamily: EndpointFamily;
  readonly problemCode?: ProblemCode;
  readonly cacheStatus?: CalculationObservability['cacheStatus'];
  readonly engineResultGeneration?: string;
  readonly chartResultContractVersion?: string;
  readonly scientificStatus?: CalculationObservability['scientificStatus'];
  readonly engineDurationMs?: number;
} {
  const problemCode = context.get('problemCode');
  const calculationObservability = context.get('calculationObservability');

  return {
    requestId: context.get('requestId'),
    method: boundedMethod(context.req.raw.method),
    endpointFamily: classifyApiEndpointFamily(context.req.path),
    ...(problemCode === undefined ? {} : { problemCode }),
    ...(calculationObservability === undefined
      ? {}
      : {
          cacheStatus: calculationObservability.cacheStatus,
          engineResultGeneration:
            calculationObservability.engineResultGeneration,
          chartResultContractVersion:
            calculationObservability.chartResultContractVersion,
          scientificStatus: calculationObservability.scientificStatus,
          ...(calculationObservability.engineDurationMs === undefined
            ? {}
            : { engineDurationMs: calculationObservability.engineDurationMs })
        })
  };
}

function emitOperationalRecord(
  sink: ObservabilitySink,
  record: OperationalRequestRecord
): void {
  try {
    sink.write(record);
  } catch (_error) {
    // Operational logging must never change authoritative request behavior.
  }
}

export interface ObserveApiRequestsOptions {
  readonly sink?: ObservabilitySink;
}

export function observeApiRequests(
  options: ObserveApiRequestsOptions = {}
): MiddlewareHandler {
  const sink = options.sink ?? createDefaultObservabilitySink();

  return async (context, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();

    context.set('requestId', requestId);
    context.header(REQUEST_ID_HEADER, requestId);

    await next();

    emitOperationalRecord(sink, {
      timestamp: new Date().toISOString(),
      level: context.res.status >= 500 ? 'error' : 'info',
      event: 'api.request.completed',
      ...requestFacts(context),
      status: context.res.status,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt))
    });
  };
}
