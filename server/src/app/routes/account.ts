import type { Context, Hono } from 'hono';
import { isRecentAuthentication } from '../../account/account-deletion-policy.js';
import { serializeClearedSessionCookie } from '../../auth-runtime/index.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import { isAccountDeletionApiRequest } from '../validation/account-deletion.js';

export const ACCOUNT_DELETION_REQUEST_MAXIMUM_BYTES = 1_024;

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
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  const body = await readBoundedRequestBody(context.req.raw);

  if (body.outcome !== 'read') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  let payload: unknown;

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body.bytes);
    payload = JSON.parse(text) as unknown;
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return isAccountDeletionApiRequest(payload)
    ? payload
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

export function registerAccountRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.delete(
    '/api/account',
    requireAuthentication(
      dependencies.authenticator,
      (context) =>
        createProblemDetailsContextResponse(context, {
          code: 'UNAUTHORIZED'
        })
    ),
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
        return createProblemDetailsContextResponse(context, {
          code: 'RECENT_AUTHENTICATION_REQUIRED'
        });
      }

      try {
        const result = await dependencies.accountErasure.eraseAccount(
          principal.userId
        );

        if (result.outcome === 'account-not-found') {
          return createProblemDetailsContextResponse(context, {
            code: 'UNAUTHORIZED'
          });
        }
      } catch (_error) {
        return createProblemDetailsContextResponse(context, {
          code: 'INTERNAL_ERROR'
        });
      }

      context.header(
        'Set-Cookie',
        serializeClearedSessionCookie(dependencies.sessionCookiePolicy)
      );
      return context.body(null, 204);
    }
  );
}
