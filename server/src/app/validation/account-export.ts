export type EmptyAccountExportRequestValidation =
  | { readonly outcome: 'valid' }
  | { readonly outcome: 'invalid' }
  | { readonly outcome: 'aborted' };

function hasQueryComponent(request: Request): boolean {
  const queryIndex = request.url.indexOf('?');
  const fragmentIndex = request.url.indexOf('#');
  return (
    queryIndex >= 0 &&
    (fragmentIndex < 0 || queryIndex < fragmentIndex)
  );
}

function hasValidContentLength(request: Request): boolean {
  const contentLength = request.headers.get('content-length');
  return contentLength === null || contentLength === '0';
}

function hasValidFraming(request: Request): boolean {
  return (
    hasValidContentLength(request) &&
    !request.headers.has('transfer-encoding')
  );
}

class RequestBodyReadAbortedError extends Error {
  public constructor() {
    super('Account export request validation was cancelled.');
  }
}

async function readWithAbort(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal
): Promise<ReadableStreamReadResult<Uint8Array>> {
  const readPromise = reader.read();

  if (signal.aborted) {
    void readPromise.catch(() => undefined);
    throw new RequestBodyReadAbortedError();
  }

  let abortHandler: (() => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    abortHandler = () => reject(new RequestBodyReadAbortedError());
    signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    return await Promise.race([readPromise, abortPromise]);
  } finally {
    if (abortHandler !== undefined) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
}

async function hasOnlyEndOfBody(
  request: Request,
  signal: AbortSignal
): Promise<'valid' | 'invalid' | 'aborted'> {
  if (signal.aborted) {
    return 'aborted';
  }

  if (request.body === null) {
    return 'valid';
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>;

  try {
    reader = request.body.getReader();
  } catch (_error) {
    return 'invalid';
  }

  let result: 'valid' | 'invalid' | 'aborted' = 'valid';

  try {
    while (true) {
      const chunk = await readWithAbort(reader, signal);

      if (chunk.done) {
        break;
      }

      if (chunk.value.byteLength > 0) {
        result = 'invalid';
        void reader.cancel().catch(() => undefined);
        break;
      }
    }
  } catch (error) {
    result =
      error instanceof RequestBodyReadAbortedError || signal.aborted
        ? 'aborted'
        : 'invalid';

    void reader.cancel().catch(() => undefined);
  } finally {
    try {
      reader.releaseLock();
    } catch (_error) {
      // Validation outcome is already bounded and authoritative.
    }
  }

  return result;
}

/** Proves the request has no selector, framing ambiguity, or body bytes. */
export async function validateEmptyAccountExportRequest(
  request: Request,
  signal: AbortSignal
): Promise<EmptyAccountExportRequestValidation> {
  if (
    hasQueryComponent(request) ||
    !hasValidFraming(request)
  ) {
    return { outcome: 'invalid' };
  }

  const bodyOutcome = await hasOnlyEndOfBody(request, signal);
  return { outcome: bodyOutcome };
}
