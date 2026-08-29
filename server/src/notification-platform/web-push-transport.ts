import { ECDH } from 'node:crypto';
import { request as httpsRequest } from 'node:https';
import { performance } from 'node:perf_hooks';
import * as webpush from 'web-push';
import {
  assertAuthKey,
  assertP256dhKey,
  assertPushSubscriptionEndpoint
} from './notification-domain.js';
import {
  assertWebPushPayloadV1,
  type WebPushPayloadV1
} from './web-push-payload.js';
import {
  createWebPushVapidConfiguration,
  type WebPushVapidConfiguration
} from './web-push-vapid.js';

const RETRY_AFTER_MAXIMUM_SECONDS = 3_600;
const CONSUMER_WEB_PUSH_TTL_SECONDS = 3_600;
const DEFAULT_ATTEMPT_TIMEOUT_MILLISECONDS = 30_000;
const MAXIMUM_ATTEMPT_TIMEOUT_MILLISECONDS = 30_000;
const MINIMUM_ATTEMPT_TIMEOUT_MILLISECONDS = 1;
const DECIMAL_SECONDS_PATTERN = /^(?:0|[1-9]\d*)$/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const P256DH_KEY_LENGTH = 65;
const AUTH_KEY_LENGTH = 16;

const TIMEOUT_ERROR_CODES = new Set([
  'ABORT_ERR',
  'ECONNABORTED',
  'ECONNRESET',
  'ERR_CANCELED',
  'ERR_SOCKET_TIMEOUT',
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT'
]);

const PRE_SEND_TRANSIENT_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ENETUNREACH',
  'ENOTFOUND',
  'EHOSTUNREACH'
]);

export const WEB_PUSH_TRANSPORT_OUTCOMES = [
  'ACCEPTED',
  'SUBSCRIPTION_INVALID',
  'THROTTLED',
  'TRANSIENT_UPSTREAM',
  'TIMEOUT_AMBIGUOUS',
  'PAYLOAD_INVALID',
  'CONFIGURATION_UNAVAILABLE',
  'PERMANENT_FAILURE'
] as const;

export type WebPushTransportOutcomeKind =
  (typeof WEB_PUSH_TRANSPORT_OUTCOMES)[number];

export interface WebPushTransportSubscription {
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
}

export interface WebPushTransportInput {
  readonly subscription: WebPushTransportSubscription;
  readonly payload: WebPushPayloadV1;
}

export type WebPushTransportOutcome =
  | { readonly outcome: 'ACCEPTED' }
  | { readonly outcome: 'SUBSCRIPTION_INVALID' }
  | {
      readonly outcome: 'THROTTLED';
      readonly retryAfterSeconds?: number;
    }
  | { readonly outcome: 'TRANSIENT_UPSTREAM' }
  | { readonly outcome: 'TIMEOUT_AMBIGUOUS' }
  | { readonly outcome: 'PAYLOAD_INVALID' }
  | { readonly outcome: 'CONFIGURATION_UNAVAILABLE' }
  | { readonly outcome: 'PERMANENT_FAILURE' };

export interface WebPushProtocolSubscription {
  readonly endpoint: string;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
}

/** @internal Protocol request; credentials and VAPID secrets stay in this server boundary. */
export interface WebPushProtocolRequest {
  readonly subscription: WebPushProtocolSubscription;
  readonly payload: string;
  readonly vapidDetails: WebPushVapidConfiguration;
  readonly timeoutMillis: number;
}

/** @internal Injectable seam used by focused tests; the default uses the standards library. */
export interface WebPushProtocolClient {
  send(request: WebPushProtocolRequest): Promise<unknown>;
}

/** @internal Server-side construction options; never use in browser-facing code. */
export interface WebPushTransportOptions {
  /** Complete VAPID configuration; omitted configuration is unavailable by design. */
  readonly vapidConfiguration?: WebPushVapidConfiguration | null;
  /** Optional fake/protocol seam for tests; production construction uses web-push. */
  readonly protocolClient?: WebPushProtocolClient;
  /** Per-attempt wall-clock timeout, bounded to the future worker's 30-second limit. */
  readonly attemptTimeoutMillis?: number;
}

export interface WebPushTransport {
  send(input: WebPushTransportInput): Promise<WebPushTransportOutcome>;
}

const ACCEPTED_OUTCOME: WebPushTransportOutcome = Object.freeze({
  outcome: 'ACCEPTED'
});

const SUBSCRIPTION_INVALID_OUTCOME: WebPushTransportOutcome = Object.freeze({
  outcome: 'SUBSCRIPTION_INVALID'
});

const TRANSIENT_UPSTREAM_OUTCOME: WebPushTransportOutcome = Object.freeze({
  outcome: 'TRANSIENT_UPSTREAM'
});

const TIMEOUT_AMBIGUOUS_OUTCOME: WebPushTransportOutcome = Object.freeze({
  outcome: 'TIMEOUT_AMBIGUOUS'
});

const PAYLOAD_INVALID_OUTCOME: WebPushTransportOutcome = Object.freeze({
  outcome: 'PAYLOAD_INVALID'
});

const CONFIGURATION_UNAVAILABLE_OUTCOME: WebPushTransportOutcome = Object.freeze(
  { outcome: 'CONFIGURATION_UNAVAILABLE' }
);

const PERMANENT_FAILURE_OUTCOME: WebPushTransportOutcome = Object.freeze({
  outcome: 'PERMANENT_FAILURE'
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readProperty(value: unknown, propertyName: string): unknown {
  if (!isRecord(value)) {
    return undefined;
  }

  try {
    return value[propertyName];
  } catch (_error) {
    return undefined;
  }
}

function readStatusCode(value: unknown): number | null {
  const statusCode = readProperty(value, 'statusCode');

  return typeof statusCode === 'number' &&
    Number.isInteger(statusCode) &&
    statusCode >= 100 &&
    statusCode <= 599
    ? statusCode
    : null;
}

function readRetryAfterHeader(headers: unknown): string | undefined {
  if (!isRecord(headers)) {
    return undefined;
  }

  try {
    let retryAfter: string | undefined;
    let sawRetryAfter = false;

    for (const [name, value] of Object.entries(headers)) {
      if (name.toLowerCase() === 'retry-after') {
        if (sawRetryAfter || typeof value !== 'string') {
          return undefined;
        }

        sawRetryAfter = true;
        retryAfter = value;
      }
    }

    return retryAfter;
  } catch (_error) {
    return undefined;
  }
}

function parseRetryAfterSeconds(headers: unknown): number | undefined {
  const rawValue = readRetryAfterHeader(headers);

  if (
    rawValue === undefined ||
    !DECIMAL_SECONDS_PATTERN.test(rawValue)
  ) {
    return undefined;
  }

  const seconds = Number(rawValue);

  return Number.isSafeInteger(seconds) &&
    seconds <= RETRY_AFTER_MAXIMUM_SECONDS
    ? seconds
    : undefined;
}

function throttledOutcome(headers: unknown): WebPushTransportOutcome {
  const retryAfterSeconds = parseRetryAfterSeconds(headers);

  return Object.freeze({
    outcome: 'THROTTLED' as const,
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds })
  });
}

function classifyStatusCode(
  statusCode: number,
  headers: unknown
): WebPushTransportOutcome {
  if (statusCode === 404 || statusCode === 410) {
    return SUBSCRIPTION_INVALID_OUTCOME;
  }

  if (statusCode === 429) {
    return throttledOutcome(headers);
  }

  if (statusCode === 401 || statusCode === 403) {
    return CONFIGURATION_UNAVAILABLE_OUTCOME;
  }

  if (statusCode === 408) {
    return TIMEOUT_AMBIGUOUS_OUTCOME;
  }

  if (statusCode >= 500) {
    return TRANSIENT_UPSTREAM_OUTCOME;
  }

  if (statusCode >= 200 && statusCode <= 299) {
    return ACCEPTED_OUTCOME;
  }

  return PERMANENT_FAILURE_OUTCOME;
}

function classifyProtocolResult(result: unknown): WebPushTransportOutcome {
  const statusCode = readStatusCode(result);

  return statusCode === null
    ? TIMEOUT_AMBIGUOUS_OUTCOME
    : classifyStatusCode(statusCode, readProperty(result, 'headers'));
}

function readErrorCode(error: unknown): string | undefined {
  const code = readProperty(error, 'code');

  return typeof code === 'string' ? code : undefined;
}

function readErrorName(error: unknown): string | undefined {
  const name = readProperty(error, 'name');

  return typeof name === 'string' ? name : undefined;
}

function classifyProtocolError(error: unknown): WebPushTransportOutcome {
  const statusCode = readStatusCode(error);

  if (statusCode !== null) {
    return classifyStatusCode(statusCode, readProperty(error, 'headers'));
  }

  const errorCode = readErrorCode(error);
  const errorName = readErrorName(error);

  if (
    (errorCode !== undefined && TIMEOUT_ERROR_CODES.has(errorCode)) ||
    errorName === 'AbortError' ||
    errorName === 'TimeoutError'
  ) {
    return TIMEOUT_AMBIGUOUS_OUTCOME;
  }

  if (errorCode !== undefined && PRE_SEND_TRANSIENT_ERROR_CODES.has(errorCode)) {
    return TRANSIENT_UPSTREAM_OUTCOME;
  }

  // Unknown protocol failures are conservatively ambiguous rather than being
  // treated as a definitive non-acceptance. No raw error crosses the boundary.
  return TIMEOUT_AMBIGUOUS_OUTCOME;
}

function decodeCanonicalBase64Url(
  value: string,
  expectedLength: number
): Buffer | null {
  if (
    value.length === 0 ||
    value.trim() !== value ||
    !BASE64URL_PATTERN.test(value)
  ) {
    return null;
  }

  let decoded: Buffer;

  try {
    decoded = Buffer.from(value, 'base64url');
  } catch (_error) {
    return null;
  }

  return decoded.length === expectedLength &&
    decoded.toString('base64url') === value
    ? decoded
    : null;
}

function isValidSubscriptionP256dh(value: string): boolean {
  const publicKey = decodeCanonicalBase64Url(value, P256DH_KEY_LENGTH);

  if (publicKey === null || publicKey[0] !== 0x04) {
    return false;
  }

  try {
    ECDH.convertKey(
      publicKey,
      'prime256v1',
      undefined,
      undefined,
      'uncompressed'
    );
    return true;
  } catch (_error) {
    return false;
  }
}

function isValidSubscriptionAuth(value: string): boolean {
  return decodeCanonicalBase64Url(value, AUTH_KEY_LENGTH) !== null;
}

function validateSubscription(
  value: unknown
): WebPushProtocolSubscription | null {
  if (!isRecord(value)) {
    return null;
  }

  try {
    const endpoint = assertPushSubscriptionEndpoint(value.endpoint);
    const p256dh = assertP256dhKey(value.p256dh);
    const auth = assertAuthKey(value.auth);

    if (!isValidSubscriptionP256dh(p256dh) || !isValidSubscriptionAuth(auth)) {
      return null;
    }

    const authority = endpoint.slice('https://'.length).split(/[\/?#]/u, 1)[0];

    if (authority.includes('@') || endpoint.includes('#')) {
      return null;
    }

    return Object.freeze({
      endpoint,
      keys: Object.freeze({ p256dh, auth })
    });
  } catch (_error) {
    return null;
  }
}

function readAttemptTimeoutMillis(value: number | undefined): number {
  const timeoutMillis = value ?? DEFAULT_ATTEMPT_TIMEOUT_MILLISECONDS;

  if (
    !Number.isSafeInteger(timeoutMillis) ||
    timeoutMillis < MINIMUM_ATTEMPT_TIMEOUT_MILLISECONDS ||
    timeoutMillis > MAXIMUM_ATTEMPT_TIMEOUT_MILLISECONDS
  ) {
    throw new Error('Web Push attempt timeout is outside the bounded limit.');
  }

  return timeoutMillis;
}

function createTimeoutError(): Error {
  const error = new Error('Web Push attempt timed out.');

  Object.defineProperty(error, 'code', {
    value: 'ETIMEDOUT',
    enumerable: false
  });

  return error;
}

function sendBoundedWebPushRequest(
  request: WebPushProtocolRequest
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const abortController = new AbortController();
    const startedAt = performance.now();
    const timeoutError = createTimeoutError();
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (callback: () => void): void => {
      if (settled) {
        return;
      }

      settled = true;

      if (timer !== undefined) {
        clearTimeout(timer);
      }

      callback();
    };
    const finishResolve = (value: unknown): void => {
      finish(() => resolve(value));
    };
    const finishReject = (error: unknown): void => {
      finish(() => reject(error));
    };
    const expire = (): void => {
      if (settled) {
        return;
      }

      abortController.abort();
      finishReject(timeoutError);
    };

    try {
      // web-push supplies encryption, VAPID headers, and the request shape
      // without starting network activity. Its sendNotification timeout is a
      // socket-inactivity timeout, so the transport owns the wall-clock bound.
      const requestDetails = webpush.generateRequestDetails(
        request.subscription,
        request.payload,
        {
          vapidDetails: request.vapidDetails,
          TTL: CONSUMER_WEB_PUSH_TTL_SECONDS
        }
      );
      const remainingMillis = request.timeoutMillis -
        (performance.now() - startedAt);

      if (remainingMillis <= 0) {
        expire();
        return;
      }

      timer = setTimeout(expire, remainingMillis);
      const endpoint = new URL(requestDetails.endpoint);
      const pushRequest = httpsRequest(
        {
          protocol: endpoint.protocol,
          hostname: endpoint.hostname,
          ...(endpoint.port.length === 0 ? {} : { port: endpoint.port }),
          path: `${endpoint.pathname}${endpoint.search}`,
          method: requestDetails.method,
          headers: requestDetails.headers,
          signal: abortController.signal
        },
        (pushResponse) => {
          pushResponse.once('error', finishReject);
          pushResponse.once('aborted', () => {
            finishReject(new Error('Web Push response was aborted.'));
          });
          pushResponse.once('end', () => {
            finishResolve({
              statusCode: pushResponse.statusCode,
              headers: pushResponse.headers
            });
          });
          pushResponse.resume();
        }
      );

      pushRequest.once('error', finishReject);

      if (requestDetails.body === null) {
        pushRequest.end();
      } else {
        pushRequest.end(requestDetails.body);
      }
    } catch (error: unknown) {
      finishReject(error);
    }
  });
}

function createDefaultWebPushProtocolClient(): WebPushProtocolClient {
  return {
    send(request): Promise<unknown> {
      // VAPID details are supplied per request; the library's global setters
      // are intentionally never used.
      return sendBoundedWebPushRequest(request);
    }
  };
}

const DEFAULT_WEB_PUSH_PROTOCOL_CLIENT = createDefaultWebPushProtocolClient();

export class DefaultWebPushTransport implements WebPushTransport {
  private readonly vapidConfiguration: WebPushVapidConfiguration | null;

  private readonly protocolClient: WebPushProtocolClient;

  private readonly attemptTimeoutMillis: number;

  public constructor(options: WebPushTransportOptions = {}) {
    this.vapidConfiguration = createWebPushVapidConfiguration(
      options.vapidConfiguration
    );
    this.protocolClient =
      options.protocolClient ?? DEFAULT_WEB_PUSH_PROTOCOL_CLIENT;
    this.attemptTimeoutMillis = readAttemptTimeoutMillis(
      options.attemptTimeoutMillis
    );
  }

  public async send(input: WebPushTransportInput): Promise<WebPushTransportOutcome> {
    if (this.vapidConfiguration === null) {
      return CONFIGURATION_UNAVAILABLE_OUTCOME;
    }

    let payload: WebPushPayloadV1;

    try {
      payload = assertWebPushPayloadV1(
        readProperty(input, 'payload')
      );
    } catch (_error) {
      return PAYLOAD_INVALID_OUTCOME;
    }

    const subscription = validateSubscription(
      readProperty(input, 'subscription')
    );

    if (subscription === null) {
      // Local persisted-shape failure is not evidence that the remote
      // subscription expired, so do not authorize future target invalidation.
      return PERMANENT_FAILURE_OUTCOME;
    }

    try {
      const result = await this.protocolClient.send({
        subscription,
        payload: JSON.stringify(payload),
        vapidDetails: this.vapidConfiguration,
        timeoutMillis: this.attemptTimeoutMillis
      });

      return classifyProtocolResult(result);
    } catch (error: unknown) {
      return classifyProtocolError(error);
    }
  }
}

export function createWebPushTransport(
  options: WebPushTransportOptions = {}
): WebPushTransport {
  return new DefaultWebPushTransport(options);
}
