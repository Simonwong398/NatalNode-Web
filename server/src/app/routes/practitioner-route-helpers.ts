import type { Context } from 'hono';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import type { PractitionerRepository } from '../../practitioner/practitioner-repository.js';
import type { ServerDependencies } from '../dependencies.js';
import { PRACTITIONER_REQUEST_MAXIMUM_BYTES } from '../validation/practitioner.js';

type BodyReadResult =
  | { readonly outcome: 'read'; readonly bytes: Uint8Array }
  | { readonly outcome: 'too-large' }
  | { readonly outcome: 'invalid' };

export function practitionerRepository(
  dependencies: ServerDependencies
): PractitionerRepository {
  return dependencies.persistence.practitioner;
}

export function practitionerProblem(
  context: Context,
  code: Parameters<typeof createProblemDetailsContextResponse>[1]['code']
): Response {
  return createProblemDetailsContextResponse(context, { code });
}

export function practitionerRouteId(
  context: Context,
  name: string
): string | Response {
  const value = context.req.param(name);
  return typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 256 &&
    value === value.trim() &&
    !/[\u0000-\u001F\u007F-\u009F/]/u.test(value)
    ? value
    : practitionerProblem(context, 'INVALID_REQUEST');
}

function isApplicationJson(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  if (contentType === null) {
    return false;
  }
  const [mediaType] = contentType.split(';', 1);
  return mediaType?.trim().toLowerCase() === 'application/json';
}

function hasOversizedDeclaredLength(request: Request): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength === null || !/^\d+$/u.test(contentLength)) {
    return false;
  }
  const byteLength = Number(contentLength);
  return Number.isSafeInteger(byteLength) && byteLength > PRACTITIONER_REQUEST_MAXIMUM_BYTES;
}

async function readBoundedBody(request: Request): Promise<BodyReadResult> {
  if (hasOversizedDeclaredLength(request)) {
    return { outcome: 'too-large' };
  }
  if (request.body === null) {
    return { outcome: 'read', bytes: new Uint8Array() };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      byteLength += chunk.value.byteLength;
      if (byteLength > PRACTITIONER_REQUEST_MAXIMUM_BYTES) {
        try {
          await reader.cancel();
        } catch (_error) {
          // A bounded rejection remains authoritative if cancellation fails.
        }
        return { outcome: 'too-large' };
      }
      chunks.push(chunk.value);
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
  return { outcome: 'read', bytes };
}

export async function parsePractitionerJson<T>(
  context: Context,
  normalize: (value: unknown) => T | null
): Promise<T | Response> {
  if (!isApplicationJson(context.req.raw)) {
    return practitionerProblem(context, 'UNSUPPORTED_MEDIA_TYPE');
  }
  const body = await readBoundedBody(context.req.raw);
  if (body.outcome === 'too-large') {
    return practitionerProblem(context, 'PAYLOAD_TOO_LARGE');
  }
  if (body.outcome === 'invalid') {
    return practitionerProblem(context, 'INVALID_REQUEST');
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body.bytes)) as unknown;
  } catch (_error) {
    return practitionerProblem(context, 'INVALID_REQUEST');
  }

  return normalize(value) ?? practitionerProblem(context, 'INVALID_REQUEST');
}

export function practitionerInternalError(context: Context): Response {
  return practitionerProblem(context, 'INTERNAL_ERROR');
}

export function practitionerNotFound(context: Context): Response {
  return practitionerProblem(context, 'NOT_FOUND');
}

export function practitionerForbidden(context: Context): Response {
  return practitionerProblem(context, 'FORBIDDEN');
}

export function practitionerConflict(context: Context): Response {
  return practitionerProblem(context, 'CONFLICT');
}
