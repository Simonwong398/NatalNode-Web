import { createAdaptorServer } from '@hono/node-server';
import { Hono } from 'hono';
import { prepareEngineCalculationRequest } from '../../dist/engine-request-adapter/index.js';

const LOOPBACK_HOST = '127.0.0.1';
const CALCULATE_PATH = '/v1/chart/calculate';
const TEST_BFF_PATH = '/_test/private-engine/chart';
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_RESPONSE_BYTES = 512 * 1024;
const DEFAULT_CALCULATION_TIMEOUT_MS = 2_000;
const DEFAULT_CLIENT_TIMEOUT_MS = 3_000;
const TEST_DATA_TRANSPORT = Object.freeze({
  dataClassification: 'ENGINEERING TEST DATA',
  astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT',
  scientificValidation: 'NOT_PERFORMED'
});

const ERROR_RESPONSES = Object.freeze({
  METHOD_NOT_ALLOWED: { status: 405, message: 'Only POST is supported.' },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: 'A JSON request is required.' },
  INVALID_REQUEST: { status: 400, message: 'The Engine request is invalid.' },
  PAYLOAD_TOO_LARGE: { status: 413, message: 'The Engine request is too large.' },
  ENGINE_INPUT_REJECTED: { status: 422, message: 'The Engine rejected the calculation input.' },
  ENGINE_CALCULATION_FAILED: { status: 502, message: 'Engine calculation is unavailable.' },
  ENGINE_RESPONSE_INVALID: { status: 502, message: 'Engine response is unavailable.' },
  ENGINE_TIMEOUT: { status: 504, message: 'Engine calculation timed out.' },
  ENGINE_UNAVAILABLE: { status: 502, message: 'Engine service is unavailable.' },
  ENGINE_PROTOCOL_INVALID: { status: 502, message: 'Engine response is invalid.' },
  NOT_FOUND: { status: 404, message: 'Engine route not found.' }
});

const ENGINE_INPUT_ERROR_CODES = new Set([
  'INVALID_INPUT',
  'UNSUPPORTED_LATITUDE',
  'UNSUPPORTED_HOUSE_SYSTEM',
  'UNSUPPORTED_TIME_DOMAIN',
  'INVALID_CIVIL_INSTANT'
]);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isRecord(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function isEngineCalculationRequest(value) {
  if (!hasExactKeys(value, ['input', 'options'])) return false;
  if (!hasExactKeys(value.input, ['instant', 'latitude', 'longitude'])) return false;
  if (!hasExactKeys(value.options, ['houseSystem'])) return false;

  return typeof value.input.instant === 'string'
    && value.input.instant.length <= 32
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value.input.instant)
    && Number.isFinite(value.input.latitude)
    && value.input.latitude >= -90
    && value.input.latitude <= 90
    && Number.isFinite(value.input.longitude)
    && value.input.longitude >= -180
    && value.input.longitude <= 180
    && ['placidus', 'whole-sign', 'equal'].includes(value.options.houseSystem);
}

function isEngineChartResult(value) {
  return isRecord(value)
    && typeof value.schemaVersion === 'string'
    && typeof value.engineVersion === 'string'
    && isRecord(value.provider)
    && Array.isArray(value.bodies)
    && isRecord(value.angles)
    && isRecord(value.houses)
    && Array.isArray(value.aspects)
    && Array.isArray(value.warnings)
    && isRecord(value.metadata)
    && Array.isArray(value.metadata.provenance);
}

function jsonResponse(context, status, value, headers = {}) {
  return context.body(JSON.stringify(value), status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  });
}

function errorResponse(context, code, headers = {}) {
  const definition = ERROR_RESPONSES[code] ?? ERROR_RESPONSES.ENGINE_UNAVAILABLE;
  return jsonResponse(context, definition.status, {
    error: { code, message: definition.message }
  }, headers);
}

async function readBoundedJson(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return { outcome: 'invalid' };
    }
    if (declaredLength > MAX_REQUEST_BYTES) {
      return { outcome: 'too-large' };
    }
  }

  const reader = request.body?.getReader();
  if (reader === undefined) return { outcome: 'invalid' };

  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => {});
        return { outcome: 'too-large' };
      }
      chunks.push(Buffer.from(value));
    }
  } catch (_error) {
    return { outcome: 'invalid' };
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    return { outcome: 'parsed', value: JSON.parse(text) };
  } catch (_error) {
    return { outcome: 'invalid' };
  }
}

function timeoutPromise(timeoutMs) {
  let timeoutHandle;
  const promise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const error = new Error('Private Engine calculation deadline exceeded.');
      error.code = 'ENGINE_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });
  return { promise, clear: () => clearTimeout(timeoutHandle) };
}

export function createPrivateEngineHttpApp(engine, {
  calculationTimeoutMs = DEFAULT_CALCULATION_TIMEOUT_MS
} = {}) {
  if (!engine || typeof engine.calculateChart !== 'function') {
    throw new TypeError('An explicitly constructed Engine is required.');
  }
  if (!Number.isSafeInteger(calculationTimeoutMs) || calculationTimeoutMs < 1 || calculationTimeoutMs > 30_000) {
    throw new TypeError('calculationTimeoutMs must be an integer from 1 to 30000.');
  }

  const app = new Hono();
  app.all(CALCULATE_PATH, async (context) => {
    if (context.req.method !== 'POST') {
      return errorResponse(context, 'METHOD_NOT_ALLOWED', { Allow: 'POST' });
    }

    const contentType = context.req.header('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (contentType !== 'application/json') {
      return errorResponse(context, 'UNSUPPORTED_MEDIA_TYPE');
    }

    const parsed = await readBoundedJson(context.req.raw);
    if (parsed.outcome === 'too-large') return errorResponse(context, 'PAYLOAD_TOO_LARGE');
    if (parsed.outcome !== 'parsed' || !isEngineCalculationRequest(parsed.value)) {
      return errorResponse(context, 'INVALID_REQUEST');
    }

    const timeout = timeoutPromise(calculationTimeoutMs);
    try {
      const calculation = Promise.resolve().then(() => engine.calculateChart(
        parsed.value.input,
        parsed.value.options
      ));
      const chart = await Promise.race([calculation, timeout.promise]);
      if (!isEngineChartResult(chart)) return errorResponse(context, 'ENGINE_RESPONSE_INVALID');

      let serialized;
      try {
        serialized = JSON.stringify({ chart });
      } catch (_error) {
        return errorResponse(context, 'ENGINE_RESPONSE_INVALID');
      }
      if (Buffer.byteLength(serialized, 'utf8') > MAX_RESPONSE_BYTES) {
        return errorResponse(context, 'ENGINE_RESPONSE_INVALID');
      }
      const responseBody = JSON.stringify({ chart, transport: TEST_DATA_TRANSPORT });
      if (Buffer.byteLength(responseBody, 'utf8') > MAX_RESPONSE_BYTES) {
        return errorResponse(context, 'ENGINE_RESPONSE_INVALID');
      }
      return context.body(responseBody, 200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      });
    } catch (error) {
      if (error?.code === 'ENGINE_TIMEOUT') return errorResponse(context, 'ENGINE_TIMEOUT');
      if (ENGINE_INPUT_ERROR_CODES.has(error?.code)) return errorResponse(context, 'ENGINE_INPUT_REJECTED');
      return errorResponse(context, 'ENGINE_CALCULATION_FAILED');
    } finally {
      timeout.clear();
    }
  });

  app.notFound((context) => errorResponse(context, 'NOT_FOUND'));
  return app;
}

export async function startLoopbackHonoServer(app, { port = 0 } = {}) {
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new TypeError('port must be an integer from 0 to 65535.');
  }

  const server = createAdaptorServer({ fetch: app.fetch, hostname: LOOPBACK_HOST });
  server.headersTimeout = 5_000;
  server.requestTimeout = 10_000;
  server.keepAliveTimeout = 1_000;

  await new Promise((resolve, reject) => {
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    server.once('listening', onListening);
    server.once('error', onError);
    server.listen(port, LOOPBACK_HOST);
  });

  const address = server.address();
  if (address === null || typeof address === 'string' || address.address !== LOOPBACK_HOST) {
    await new Promise((resolve) => server.close(() => resolve()));
    throw new Error('Private Engine listener did not bind to IPv4 loopback.');
  }

  let closePromise;
  return {
    host: address.address,
    port: address.port,
    origin: `http://${LOOPBACK_HOST}:${address.port}`,
    close() {
      if (closePromise === undefined) {
        closePromise = new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
        });
      }
      return closePromise;
    }
  };
}

export async function startPrivateEngineHttpService(engine, options = {}) {
  return startLoopbackHonoServer(createPrivateEngineHttpApp(engine, options), options);
}

export class PrivateEngineHttpClientError extends Error {
  constructor(code) {
    super(ERROR_RESPONSES[code]?.message ?? ERROR_RESPONSES.ENGINE_UNAVAILABLE.message);
    this.name = 'PrivateEngineHttpClientError';
    this.code = code;
  }
}

export class PrivateEngineHttpClient {
  constructor({ baseUrl, timeoutMs = DEFAULT_CLIENT_TIMEOUT_MS, fetchImplementation = globalThis.fetch }) {
    let url;
    try {
      url = new URL(baseUrl);
    } catch (_error) {
      throw new TypeError('Private Engine baseUrl must be an absolute loopback HTTP URL.');
    }
    if (url.protocol !== 'http:' || url.hostname !== LOOPBACK_HOST
      || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== ''
      || (url.pathname !== '' && url.pathname !== '/')) {
      throw new TypeError('Private Engine baseUrl must use 127.0.0.1 without credentials or a path.');
    }
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
      throw new TypeError('timeoutMs must be an integer from 1 to 30000.');
    }
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('A fetch implementation is required.');
    }

    this.endpoint = new URL(CALCULATE_PATH, url).href;
    this.timeoutMs = timeoutMs;
    this.fetchImplementation = fetchImplementation;
  }

  async calculateChart(request) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImplementation(this.endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      let payload;
      try {
        payload = await response.json();
      } catch (_error) {
        throw new PrivateEngineHttpClientError('ENGINE_PROTOCOL_INVALID');
      }

      if (!response.ok) {
        const code = isRecord(payload?.error) && Object.hasOwn(ERROR_RESPONSES, payload.error.code)
          ? payload.error.code
          : 'ENGINE_UNAVAILABLE';
        throw new PrivateEngineHttpClientError(code);
      }
      if (!isRecord(payload) || !isEngineChartResult(payload.chart)
        || payload.transport?.dataClassification !== TEST_DATA_TRANSPORT.dataClassification
        || payload.transport?.astronomicalStatus !== TEST_DATA_TRANSPORT.astronomicalStatus
        || payload.transport?.scientificValidation !== TEST_DATA_TRANSPORT.scientificValidation) {
        throw new PrivateEngineHttpClientError('ENGINE_PROTOCOL_INVALID');
      }
      return payload.chart;
    } catch (error) {
      if (error instanceof PrivateEngineHttpClientError) throw error;
      if (controller.signal.aborted) throw new PrivateEngineHttpClientError('ENGINE_TIMEOUT');
      throw new PrivateEngineHttpClientError('ENGINE_UNAVAILABLE');
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createPrivateEngineBffHarness(engineClient) {
  if (!engineClient || typeof engineClient.calculateChart !== 'function') {
    throw new TypeError('The BFF harness requires an explicit private Engine client.');
  }

  const app = new Hono();
  app.all(TEST_BFF_PATH, async (context) => {
    if (context.req.method !== 'POST') {
      return errorResponse(context, 'METHOD_NOT_ALLOWED', { Allow: 'POST' });
    }
    let request;
    try {
      request = await context.req.json();
    } catch (_error) {
      return errorResponse(context, 'INVALID_REQUEST');
    }
    try {
      const chart = await engineClient.calculateChart(request);
      return jsonResponse(context, 200, { chart, transport: TEST_DATA_TRANSPORT });
    } catch (error) {
      const code = Object.hasOwn(ERROR_RESPONSES, error?.code) ? error.code : 'ENGINE_UNAVAILABLE';
      return errorResponse(context, code);
    }
  });
  return app;
}

/** Test-only BFF flow that resolves Web civil input before the private Engine HTTP hop. */
export function createVerifiedPrivateEngineBffHarness({ engineClient, timeAuthority }) {
  if (!engineClient || typeof engineClient.calculateChart !== 'function') {
    throw new TypeError('The verified BFF harness requires an explicit private Engine client.');
  }
  if (!timeAuthority || typeof timeAuthority.resolve !== 'function') {
    throw new TypeError('The verified BFF harness requires the server Civil TimeAuthority.');
  }

  const app = new Hono();
  app.all(TEST_BFF_PATH, async (context) => {
    if (context.req.method !== 'POST') {
      return errorResponse(context, 'METHOD_NOT_ALLOWED', { Allow: 'POST' });
    }

    const parsed = await readBoundedJson(context.req.raw);
    if (parsed.outcome === 'too-large') return errorResponse(context, 'PAYLOAD_TOO_LARGE');
    if (parsed.outcome !== 'parsed' || !hasExactKeys(parsed.value, ['chart'])) {
      return errorResponse(context, 'INVALID_REQUEST');
    }

    const prepared = prepareEngineCalculationRequest(parsed.value.chart, timeAuthority);
    if (prepared.outcome === 'REJECTED') {
      return jsonResponse(context, 422, {
        error: { code: prepared.error.code, message: 'Birth input could not be verified.' }
      });
    }

    try {
      const chart = await engineClient.calculateChart(prepared.request);
      return jsonResponse(context, 200, { chart, transport: TEST_DATA_TRANSPORT });
    } catch (error) {
      const code = Object.hasOwn(ERROR_RESPONSES, error?.code) ? error.code : 'ENGINE_UNAVAILABLE';
      return errorResponse(context, code);
    }
  });
  return app;
}

export const PRIVATE_ENGINE_HTTP_CONTRACT = Object.freeze({
  path: CALCULATE_PATH,
  method: 'POST',
  maxRequestBytes: MAX_REQUEST_BYTES,
  maxResponseBytes: MAX_RESPONSE_BYTES,
  timeoutMs: DEFAULT_CALCULATION_TIMEOUT_MS
});
