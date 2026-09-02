export type BoundedJsonResult =
  | { outcome: 'parsed'; value: unknown }
  | { outcome: 'too-large' }
  | { outcome: 'unsupported-media-type' }
  | { outcome: 'invalid' };

function hasOversizedDeclaredLength(request: Request, maximumBytes: number): boolean {
  const contentLength = request.headers.get('content-length');

  if (contentLength === null) {
    return false;
  }

  const parsedContentLength = Number(contentLength);

  return (
    !Number.isSafeInteger(parsedContentLength) ||
    parsedContentLength < 0 ||
    parsedContentLength > maximumBytes
  );
}

function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get('content-type');

  if (contentType === null) {
    return false;
  }

  return contentType.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';
}

export async function readBoundedJson(
  request: Request,
  maximumBytes: number
): Promise<BoundedJsonResult> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0) {
    throw new RangeError('maximumBytes must be a positive safe integer');
  }

  if (!hasJsonContentType(request)) {
    return { outcome: 'unsupported-media-type' };
  }

  if (hasOversizedDeclaredLength(request, maximumBytes)) {
    return { outcome: 'too-large' };
  }

  if (request.body === null) {
    return { outcome: 'invalid' };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value === undefined || value.byteLength > maximumBytes - byteLength) {
        await reader.cancel();
        return { outcome: 'too-large' };
      }

      chunks.push(value);
      byteLength += value.byteLength;
    }
  } catch (_error) {
    return { outcome: 'invalid' };
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
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { outcome: 'parsed', value: JSON.parse(text) as unknown };
  } catch (_error) {
    return { outcome: 'invalid' };
  }
}
