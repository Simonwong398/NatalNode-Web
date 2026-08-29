import { assertGoogleOAuthProtocolSecret } from '../../auth-runtime/google-oauth-transaction.js';

const MAX_AUTHORIZATION_CODE_LENGTH = 2_048;
const MAX_PROVIDER_ERROR_LENGTH = 128;
const MAX_PROVIDER_ERROR_DESCRIPTION_LENGTH = 512;
const MAX_PROVIDER_ERROR_URI_LENGTH = 2_048;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const ALLOWED_CALLBACK_PARAMETERS = new Set([
  'state',
  'code',
  'error',
  'error_description',
  'error_uri'
]);

export type GoogleCallbackQuery =
  | {
      readonly state: string;
      readonly code: string;
      readonly providerError: false;
    }
  | {
      readonly state: string;
      readonly code: null;
      readonly providerError: true;
    };

function hasQueryComponent(request: Request): boolean {
  const queryIndex = request.url.indexOf('?');
  const fragmentIndex = request.url.indexOf('#');
  return queryIndex >= 0 && (fragmentIndex < 0 || queryIndex < fragmentIndex);
}

function hasValidContentLength(request: Request): boolean {
  const contentLength = request.headers.get('content-length');
  return contentLength === null || contentLength === '0';
}

function isBoundedProtocolParameter(
  value: string,
  maximumLength: number
): boolean {
  return (
    value.length > 0 &&
    value.length <= maximumLength &&
    value.trim() === value &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function readSingleParameter(
  searchParams: URLSearchParams,
  name: string,
  maximumLength: number
): string | null | undefined {
  const values = searchParams.getAll(name);

  if (values.length === 0) {
    return null;
  }

  if (values.length !== 1 || !isBoundedProtocolParameter(values[0], maximumLength)) {
    return undefined;
  }

  return values[0];
}

/** Validates that Google start owns an empty, unambiguous request body. */
export async function validateEmptyGoogleStartRequest(
  request: Request
): Promise<boolean> {
  if (
    hasQueryComponent(request) ||
    !hasValidContentLength(request) ||
    request.headers.has('transfer-encoding')
  ) {
    return false;
  }

  if (request.body === null) {
    return true;
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>;

  try {
    reader = request.body.getReader();
  } catch (_error) {
    return false;
  }

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        return true;
      }

      if (chunk.value.byteLength > 0) {
        void reader.cancel().catch(() => undefined);
        return false;
      }
    }
  } catch (_error) {
    return false;
  } finally {
    try {
      reader.releaseLock();
    } catch (_error) {
      // The request has already been classified as invalid or empty.
    }
  }
}

/** Parses only the bounded callback fields required by the local OAuth flow. */
export function parseGoogleCallbackQuery(
  request: Request
): GoogleCallbackQuery | null {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch (_error) {
    return null;
  }

  for (const key of url.searchParams.keys()) {
    if (!ALLOWED_CALLBACK_PARAMETERS.has(key)) {
      return null;
    }
  }

  const state = readSingleParameter(url.searchParams, 'state', 128);
  const code = readSingleParameter(
    url.searchParams,
    'code',
    MAX_AUTHORIZATION_CODE_LENGTH
  );
  const error = readSingleParameter(
    url.searchParams,
    'error',
    MAX_PROVIDER_ERROR_LENGTH
  );
  const errorDescription = readSingleParameter(
    url.searchParams,
    'error_description',
    MAX_PROVIDER_ERROR_DESCRIPTION_LENGTH
  );
  const errorUri = readSingleParameter(
    url.searchParams,
    'error_uri',
    MAX_PROVIDER_ERROR_URI_LENGTH
  );

  if (
    state === undefined ||
    code === undefined ||
    error === undefined ||
    errorDescription === undefined ||
    errorUri === undefined ||
    state === null
  ) {
    return null;
  }

  try {
    assertGoogleOAuthProtocolSecret(state, 'state');
  } catch (_error) {
    return null;
  }

  if (error !== null) {
    if (code !== null) {
      return null;
    }

    return {
      state,
      code: null,
      providerError: true
    };
  }

  if (errorDescription !== null || errorUri !== null || code === null) {
    return null;
  }

  return {
    state,
    code,
    providerError: false
  };
}
