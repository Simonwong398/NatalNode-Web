import type { ValidatedEngineChartResultV1 } from './engine-result-adapter/engine-result-adapter.js';
import {
  validateEngineChartResultV1,
  type EngineResearchExecutionEvidence
} from './engine-result-adapter/engine-result-adapter.js';
import type { EngineCalculationRequest } from '../engine-request-adapter/engine-request-adapter.js';
import { serializeEngineUtcInstant } from './engine-utc-wire.js';

const LOOPBACK_HOST = '127.0.0.1';
const CALCULATE_PATH = '/v1/chart/calculate';
const MAX_REQUEST_BYTES = 4 * 1024;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_SERVICE_BUDGET_MS = 120_000;
const MAX_CANCELLATION_CLEANUP_MS = 11_000;
const NETWORK_ALLOWANCE_MS = 1_000;
const DEFAULT_TIMEOUT_MS = MAX_SERVICE_BUDGET_MS + MAX_CANCELLATION_CLEANUP_MS + NETWORK_ALLOWANCE_MS;
const NON_CALCULATING_PROBE_TIMEOUT_MS = 3_000;
const HOUSE_SYSTEMS = ['placidus', 'whole-sign', 'equal'] as const;
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

interface RealEngineWireRequest {
  readonly input: EngineCalculationRequest['input'];
  readonly options: EngineCalculationRequest['options'] & { readonly zodiac: 'tropical' };
}

export const REAL_ENGINE_PRIVATE_SERVICE_LIMITS = Object.freeze({
  path: CALCULATE_PATH,
  maxRequestBytes: MAX_REQUEST_BYTES,
  maxResponseBytes: MAX_RESPONSE_BYTES,
  timeoutMs: DEFAULT_TIMEOUT_MS
});

export type RealEnginePrivateServiceErrorCode =
  | 'UNAUTHORIZED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'REQUEST_SCHEMA_INVALID'
  | 'REQUEST_TOO_LARGE'
  | 'CALCULATION_BUSY'
  | 'CALCULATION_TIMEOUT'
  | 'CALCULATION_CANCELLED'
  | 'CALCULATION_UNAVAILABLE'
  | 'SERVICE_SHUTTING_DOWN'
  | 'SERVICE_UNAVAILABLE'
  | 'NOT_FOUND'
  | 'SERVICE_RESPONSE_INVALID';

const ERROR_DEFINITIONS: Readonly<Record<RealEnginePrivateServiceErrorCode, {
  readonly status: number;
  readonly message: string;
}>> = Object.freeze({
  UNAUTHORIZED: { status: 401, message: 'The private Engine service rejected this request.' },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: 'The private Engine service rejected this request format.' },
  REQUEST_SCHEMA_INVALID: { status: 400, message: 'The private Engine service rejected this request.' },
  REQUEST_TOO_LARGE: { status: 413, message: 'The private Engine service rejected this request.' },
  CALCULATION_BUSY: { status: 429, message: 'The private Engine is busy. Try again shortly.' },
  CALCULATION_TIMEOUT: { status: 504, message: 'The private Engine calculation timed out.' },
  CALCULATION_CANCELLED: { status: 499, message: 'The private Engine calculation was cancelled.' },
  CALCULATION_UNAVAILABLE: { status: 503, message: 'The private Engine calculation is unavailable.' },
  SERVICE_SHUTTING_DOWN: { status: 503, message: 'The private Engine service is shutting down.' },
  SERVICE_UNAVAILABLE: { status: 503, message: 'The private Engine service is unavailable.' },
  NOT_FOUND: { status: 404, message: 'The private Engine route is unavailable.' },
  SERVICE_RESPONSE_INVALID: { status: 502, message: 'The private Engine response is invalid.' }
});

const RESPONSE_ERROR_STATUS = new Map<number, RealEnginePrivateServiceErrorCode>([
  [401, 'UNAUTHORIZED'],
  [415, 'UNSUPPORTED_MEDIA_TYPE'],
  [400, 'REQUEST_SCHEMA_INVALID'],
  [413, 'REQUEST_TOO_LARGE'],
  [429, 'CALCULATION_BUSY'],
  [504, 'CALCULATION_TIMEOUT'],
  [499, 'CALCULATION_CANCELLED'],
  [503, 'CALCULATION_UNAVAILABLE'],
  [404, 'NOT_FOUND']
]);

const RESPONSE_ERROR_CODES = new Set<RealEnginePrivateServiceErrorCode>([
  'UNAUTHORIZED', 'UNSUPPORTED_MEDIA_TYPE', 'REQUEST_SCHEMA_INVALID', 'REQUEST_TOO_LARGE',
  'CALCULATION_BUSY', 'CALCULATION_TIMEOUT', 'CALCULATION_CANCELLED', 'CALCULATION_UNAVAILABLE',
  'SERVICE_SHUTTING_DOWN', 'SERVICE_UNAVAILABLE', 'NOT_FOUND'
]);

export class RealEnginePrivateServiceError extends Error {
  readonly code: RealEnginePrivateServiceErrorCode;
  readonly status: number;

  constructor(code: RealEnginePrivateServiceErrorCode) {
    super(ERROR_DEFINITIONS[code].message);
    this.name = 'RealEnginePrivateServiceError';
    this.code = code;
    this.status = ERROR_DEFINITIONS[code].status;
  }
}

export interface RealEnginePrivateServiceReply {
  readonly chart: ValidatedEngineChartResultV1;
  readonly execution: EngineResearchExecutionEvidence;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return isRecord(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function isValidCalculationRequest(value: unknown): value is EngineCalculationRequest {
  if (!hasExactKeys(value, ['input', 'options']) ||
      !hasExactKeys(value.input, ['instant', 'latitude', 'longitude']) ||
      !hasExactKeys(value.options, ['houseSystem'])) return false;
  return typeof value.input.instant === 'string' && value.input.instant.length > 0 &&
    value.input.instant.length <= 64 &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value.input.instant) &&
    typeof value.input.latitude === 'number' && Number.isFinite(value.input.latitude) &&
    value.input.latitude >= -90 && value.input.latitude <= 90 &&
    typeof value.input.longitude === 'number' && Number.isFinite(value.input.longitude) &&
    value.input.longitude >= -180 && value.input.longitude <= 180 &&
    typeof value.options.houseSystem === 'string' &&
    HOUSE_SYSTEMS.includes(value.options.houseSystem as (typeof HOUSE_SYSTEMS)[number]);
}

function toRealEngineWireRequest(request: EngineCalculationRequest): RealEngineWireRequest {
  return Object.freeze({
    input: Object.freeze({
      ...request.input,
      instant: serializeEngineUtcInstant(request.input.instant)
    }),
    options: Object.freeze({ houseSystem: request.options.houseSystem, zodiac: 'tropical' })
  });
}

function isExecutionEvidence(value: unknown, expectedRuntimeIdentity: string): value is EngineResearchExecutionEvidence {
  return hasExactKeys(value, [
    'serviceInstanceId', 'requestExecutionId', 'runtimeIdentity', 'status', 'provenance'
  ]) &&
    typeof value.serviceInstanceId === 'string' &&
    new RegExp(`^service-${UUID}$`, 'u').test(value.serviceInstanceId) &&
    typeof value.requestExecutionId === 'string' &&
    new RegExp(`^request-${UUID}$`, 'u').test(value.requestExecutionId) &&
    value.runtimeIdentity === expectedRuntimeIdentity &&
    value.status === 'RESEARCH_ONLY' &&
    value.provenance === 'INCOMPLETE_RESEARCH';
}

function validateResponseLength(response: Response): void {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength === null) return;
  if (!/^\d+$/u.test(declaredLength)) {
    throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
  }
  const parsedLength = Number(declaredLength);
  if (!Number.isSafeInteger(parsedLength) || parsedLength > MAX_RESPONSE_BYTES) {
    throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
  }
}

async function readBoundedResponse(response: Response): Promise<unknown> {
  validateResponseLength(response);
  if (response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') {
    throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
  }
  const reader = response.body?.getReader();
  if (reader === undefined) throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined || value.byteLength > MAX_RESPONSE_BYTES - byteLength) {
        await reader.cancel().catch(() => {});
        throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
      }
      chunks.push(value);
      byteLength += value.byteLength;
    }
  } catch (error) {
    if (error instanceof RealEnginePrivateServiceError) throw error;
    throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
  }
}

function serviceErrorCode(status: number, payload: unknown): RealEnginePrivateServiceErrorCode {
  const expectedCode = RESPONSE_ERROR_STATUS.get(status);
  if (expectedCode === undefined || !hasExactKeys(payload, ['error']) ||
      typeof payload.error !== 'string' || !RESPONSE_ERROR_CODES.has(payload.error as RealEnginePrivateServiceErrorCode)) {
    return 'SERVICE_UNAVAILABLE';
  }
  const code = payload.error as RealEnginePrivateServiceErrorCode;
  if (code !== expectedCode && !(status === 503 && ['SERVICE_SHUTTING_DOWN', 'SERVICE_UNAVAILABLE'].includes(code))) {
    return 'SERVICE_UNAVAILABLE';
  }
  return code;
}

export interface RealEnginePrivateServiceClientOptions {
  readonly baseUrl: string;
  readonly bearerToken: string;
  readonly expectedRuntimeIdentity: string;
  readonly timeoutMs?: number;
  readonly fetchImplementation?: typeof fetch;
}

export class RealEnginePrivateServiceClient {
  readonly endpoint: string;
  readonly expectedRuntimeIdentity: string;
  readonly timeoutMs: number;
  readonly #bearerToken: string;
  readonly #fetchImplementation: typeof fetch;

  constructor(options: RealEnginePrivateServiceClientOptions) {
    let baseUrl: URL;
    try {
      baseUrl = new URL(options.baseUrl);
    } catch {
      throw new TypeError('The private Engine endpoint must be an IPv4 loopback HTTP origin.');
    }
    if (baseUrl.protocol !== 'http:' || baseUrl.hostname !== LOOPBACK_HOST || baseUrl.port === '' ||
        baseUrl.username !== '' || baseUrl.password !== '' || baseUrl.search !== '' || baseUrl.hash !== '' ||
        (baseUrl.pathname !== '' && baseUrl.pathname !== '/')) {
      throw new TypeError('The private Engine endpoint must be an IPv4 loopback HTTP origin.');
    }
    if (typeof options.bearerToken !== 'string' || options.bearerToken.length > 256 ||
        Buffer.byteLength(options.bearerToken, 'utf8') < 32 || !/^[\x21-\x7e]+$/u.test(options.bearerToken)) {
      throw new TypeError('The private Engine bearer token is invalid.');
    }
    if (!/^[a-f0-9]{64}$/u.test(options.expectedRuntimeIdentity)) {
      throw new TypeError('The expected private Engine runtime identity is invalid.');
    }
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > DEFAULT_TIMEOUT_MS) {
      throw new TypeError('The private Engine timeout must be between 1 and 132000 milliseconds.');
    }
    const fetchImplementation = options.fetchImplementation ?? globalThis.fetch;
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('A server-side fetch implementation is required.');
    }
    this.endpoint = new URL(CALCULATE_PATH, baseUrl).href;
    this.expectedRuntimeIdentity = options.expectedRuntimeIdentity;
    this.timeoutMs = timeoutMs;
    this.#bearerToken = options.bearerToken;
    this.#fetchImplementation = fetchImplementation;
  }

  async verifyNonCalculatingBoundary(): Promise<Readonly<{
    unauthenticated: Readonly<{ status: number; error: string }>;
    malformedAuthenticated: Readonly<{ status: number; error: string }>;
  }>> {
    const verify = async (
      request: RequestInit,
      expectedStatus: number,
      expectedError: string
    ): Promise<Readonly<{ status: number; error: string }>> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), NON_CALCULATING_PROBE_TIMEOUT_MS);
      try {
        const response = await this.#fetchImplementation(this.endpoint, {
          ...request,
          method: 'POST',
          cache: 'no-store',
          redirect: 'error',
          signal: controller.signal
        });
        const payload = await readBoundedResponse(response);
        if (response.status !== expectedStatus || !hasExactKeys(payload, ['error']) ||
            payload.error !== expectedError) {
          throw new RealEnginePrivateServiceError('SERVICE_UNAVAILABLE');
        }
        return Object.freeze({ status: response.status, error: expectedError });
      } catch (error) {
        if (error instanceof RealEnginePrivateServiceError) throw error;
        throw new RealEnginePrivateServiceError('SERVICE_UNAVAILABLE');
      } finally {
        clearTimeout(timeout);
      }
    };

    const unauthenticated = await verify({ headers: { Accept: 'application/json' } }, 401, 'UNAUTHORIZED');
    const malformedAuthenticated = await verify({
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.#bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    }, 400, 'REQUEST_SCHEMA_INVALID');
    return Object.freeze({ unauthenticated, malformedAuthenticated });
  }

  async calculateChart(
    request: EngineCalculationRequest,
    signal?: AbortSignal
  ): Promise<RealEnginePrivateServiceReply> {
    if (!isValidCalculationRequest(request)) {
      throw new RealEnginePrivateServiceError('REQUEST_SCHEMA_INVALID');
    }
    if (signal?.aborted) throw new RealEnginePrivateServiceError('CALCULATION_CANCELLED');

    let wireRequest: RealEngineWireRequest;
    try {
      wireRequest = toRealEngineWireRequest(request);
    } catch {
      throw new RealEnginePrivateServiceError('REQUEST_SCHEMA_INVALID');
    }
    const body = JSON.stringify(wireRequest);
    if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) {
      throw new RealEnginePrivateServiceError('REQUEST_TOO_LARGE');
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error('Calculation deadline exceeded.'));
    }, this.timeoutMs);
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();

    try {
      const response = await this.#fetchImplementation(this.endpoint, {
        method: 'POST',
        cache: 'no-store',
        redirect: 'error',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.#bearerToken}`,
          'Content-Type': 'application/json'
        },
        body,
        signal: controller.signal
      });
      if (signal?.aborted) throw new RealEnginePrivateServiceError('CALCULATION_CANCELLED');
      if (timedOut) throw new RealEnginePrivateServiceError('CALCULATION_TIMEOUT');
      const payload = await readBoundedResponse(response);
      if (signal?.aborted) throw new RealEnginePrivateServiceError('CALCULATION_CANCELLED');
      if (timedOut) throw new RealEnginePrivateServiceError('CALCULATION_TIMEOUT');
      if (response.status !== 200) {
        throw new RealEnginePrivateServiceError(serviceErrorCode(response.status, payload));
      }
      if (!hasExactKeys(payload, ['chart', 'execution']) ||
          !isExecutionEvidence(payload.execution, this.expectedRuntimeIdentity)) {
        throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
      }
      const validated = validateEngineChartResultV1(payload.chart, wireRequest);
      if (validated.outcome !== 'VALID') {
        throw new RealEnginePrivateServiceError('SERVICE_RESPONSE_INVALID');
      }
      if (signal?.aborted) throw new RealEnginePrivateServiceError('CALCULATION_CANCELLED');
      if (timedOut) throw new RealEnginePrivateServiceError('CALCULATION_TIMEOUT');
      return Object.freeze({
        chart: validated.chart,
        execution: payload.execution
      });
    } catch (error) {
      if (signal?.aborted) throw new RealEnginePrivateServiceError('CALCULATION_CANCELLED');
      if (timedOut) throw new RealEnginePrivateServiceError('CALCULATION_TIMEOUT');
      if (error instanceof RealEnginePrivateServiceError) throw error;
      throw new RealEnginePrivateServiceError('SERVICE_UNAVAILABLE');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}

export function createRealEnginePrivateServiceClientFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): RealEnginePrivateServiceClient {
  const baseUrl = environment.NATALNODE_REAL_ENGINE_SERVICE_URL;
  const bearerToken = environment.NATALNODE_REAL_ENGINE_BEARER_TOKEN;
  const expectedRuntimeIdentity = environment.NATALNODE_REAL_ENGINE_RUNTIME_IDENTITY;
  if (!baseUrl || !bearerToken || !expectedRuntimeIdentity) {
    throw new Error('Configure NATALNODE_REAL_ENGINE_SERVICE_URL, NATALNODE_REAL_ENGINE_BEARER_TOKEN, and NATALNODE_REAL_ENGINE_RUNTIME_IDENTITY for the research workflow.');
  }
  return new RealEnginePrivateServiceClient({ baseUrl, bearerToken, expectedRuntimeIdentity });
}
