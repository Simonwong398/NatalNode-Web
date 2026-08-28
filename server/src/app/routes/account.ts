import type { Context, Hono } from 'hono';
import { isRecentAuthentication } from '../../account/account-deletion-policy.js';
import { serializeClearedSessionCookie } from '../../auth-runtime/index.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { isAccountDeletionApiRequest } from '../validation/account-deletion.js';

export const ACCOUNT_DELETION_REQUEST_MAXIMUM_BYTES = 1_024;

const INVALID_REQUEST_RESPONSE = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid account deletion request.'
  }
} as const;

const UNAUTHORIZED_RESPONSE = {
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication is required.'
  }
} as const;

const RECENT_AUTHENTICATION_REQUIRED_RESPONSE = {
  error: {
    code: 'RECENT_AUTHENTICATION_REQUIRED',
    message: 'Recent authentication is required.'
  }
} as const;

type BoundedBodyReadResult =
  | { readonly outcome: 'read'; readonly bytes: Uint8Array }
  | { readonly outcome: 'too-large' }
  | { readonly outcome: 'invalid' };

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
  return (
    Number.isSafeInteger(byteLength) &&
    byteLength > ACCOUNT_DELETION_REQUEST_MAXIMUM_BYTES
  );
}

async function readBoundedRequestBody(
  request: Request
): Promise<BoundedBodyReadResult> {
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

      if (byteLength > ACCOUNT_DELETION_REQUEST_MAXIMUM_BYTES) {
        try {
          await reader.cancel();
        } catch (_error) {
          // The bounded validation response remains authoritative.
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

async function parseAccountDeletionRequest(
  context: Context
): Promise<{ readonly confirmation: 'DELETE' } | Response> {
  if (!isApplicationJson(context.req.raw)) {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  const body = await readBoundedRequestBody(context.req.raw);

  if (body.outcome !== 'read') {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  let payload: unknown;

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body.bytes);
    payload = JSON.parse(text) as unknown;
  } catch (_error) {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  return isAccountDeletionApiRequest(payload)
    ? payload
    : context.json(INVALID_REQUEST_RESPONSE, 400);
}

export function registerAccountRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.delete(
    '/api/account',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const request = await parseAccountDeletionRequest(context);

      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');

      if (
        !isRecentAuthentication(
          principal.sessionCreatedAt,
          dependencies.clock.now()
        )
      ) {
        return context.json(RECENT_AUTHENTICATION_REQUIRED_RESPONSE, 403);
      }

      const result = await dependencies.accountErasure.eraseAccount(
        principal.userId
      );

      if (result.outcome === 'account-not-found') {
        return context.json(UNAUTHORIZED_RESPONSE, 401);
      }

      context.header(
        'Set-Cookie',
        serializeClearedSessionCookie(dependencies.sessionCookiePolicy)
      );
      return context.body(null, 204);
    }
  );
}
