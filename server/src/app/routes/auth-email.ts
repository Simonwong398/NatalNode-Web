import type { Context, Hono } from 'hono';
import type {
  CompleteEmailMagicLinkApiRequest,
  CompleteEmailMagicLinkApiResponse,
  RequestEmailMagicLinkApiRequest,
  RequestEmailMagicLinkApiResponse
} from '@natalnode/contracts';
import {
  completeEmailMagicLinkAuthentication,
  issueEmailMagicLinkChallenge,
  serializeSessionCookie
} from '../../auth-runtime/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  isCompleteEmailMagicLinkApiRequest,
  isRequestEmailMagicLinkApiRequest
} from '../validation/auth-email.js';
import { readBoundedJson } from '../validation/index.js';

const AUTH_EMAIL_REQUEST_MAXIMUM_BYTES = 8 * 1024;

function markAuthenticationResponse(context: Context): void {
  context.header('Cache-Control', 'no-store');
}

async function parseRequestEmailMagicLinkRequest(
  context: Context
): Promise<RequestEmailMagicLinkApiRequest | Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    AUTH_EMAIL_REQUEST_MAXIMUM_BYTES
  );

  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (parsed.outcome === 'invalid') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return isRequestEmailMagicLinkApiRequest(parsed.value)
    ? parsed.value
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

async function parseCompleteEmailMagicLinkRequest(
  context: Context
): Promise<CompleteEmailMagicLinkApiRequest | Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    AUTH_EMAIL_REQUEST_MAXIMUM_BYTES
  );

  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (parsed.outcome === 'invalid') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return isCompleteEmailMagicLinkApiRequest(parsed.value)
    ? parsed.value
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

async function requestEmailMagicLink(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  markAuthenticationResponse(context);

  const request = await parseRequestEmailMagicLinkRequest(context);

  if (request instanceof Response) {
    return request;
  }

  const now = dependencies.clock.now();
  const expiresAt = dependencies.authenticationExpirationPolicy.magicLinkExpiresAt(now);
  const issued = await issueEmailMagicLinkChallenge({
    email: request.email,
    createdAt: now,
    expiresAt,
    idGenerator: dependencies.idGenerator,
    tokenGenerator: dependencies.secureTokenGenerator,
    tokenHasher: dependencies.tokenHasher,
    authLifecycle: dependencies.emailMagicLinkAuthLifecycle
  });

  await dependencies.emailMagicLinkDelivery.sendMagicLink({
    emailNormalized: issued.record.emailNormalized,
    magicLinkUrl: dependencies.magicLinkUrlBuilder.build(issued.token),
    expiresAt: issued.record.expiresAt
  });

  const response: RequestEmailMagicLinkApiResponse = { accepted: true };
  return context.json(response, 202);
}

async function completeEmailMagicLink(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  markAuthenticationResponse(context);

  const request = await parseCompleteEmailMagicLinkRequest(context);

  if (request instanceof Response) {
    return request;
  }

  const now = dependencies.clock.now();
  const sessionExpiresAt = dependencies.authenticationExpirationPolicy.sessionExpiresAt(now);
  const completed = await completeEmailMagicLinkAuthentication({
    presentedToken: request.token,
    now,
    sessionExpiresAt,
    idGenerator: dependencies.idGenerator,
    tokenGenerator: dependencies.secureTokenGenerator,
    tokenHasher: dependencies.tokenHasher,
    authLifecycle: dependencies.emailMagicLinkAuthLifecycle
  });

  if (completed === null) {
    return createProblemDetailsContextResponse(context, {
      code: 'UNAUTHORIZED'
    });
  }

  const sessionCookie = serializeSessionCookie(
    completed.sessionToken,
    completed.sessionExpiresAt,
    dependencies.sessionCookiePolicy
  );
  context.header('Set-Cookie', sessionCookie);

  const response: CompleteEmailMagicLinkApiResponse = { authenticated: true };
  return context.json(response);
}

export function registerEmailAuthenticationRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.post('/api/auth/email/request', (context) =>
    requestEmailMagicLink(context, dependencies)
  );
  app.post('/api/auth/email/complete', (context) =>
    completeEmailMagicLink(context, dependencies)
  );
}
