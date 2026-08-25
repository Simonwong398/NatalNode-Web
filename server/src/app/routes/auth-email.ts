import type { Context, Hono } from 'hono';
import type {
  AuthApiErrorResponse,
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
import {
  isCompleteEmailMagicLinkApiRequest,
  isRequestEmailMagicLinkApiRequest
} from '../validation/auth-email.js';

const INVALID_REQUEST_RESPONSE: AuthApiErrorResponse = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid authentication request.'
  }
};

const INVALID_MAGIC_LINK_RESPONSE: AuthApiErrorResponse = {
  error: {
    code: 'UNAUTHORIZED',
    message: 'The sign-in link is invalid or has expired.'
  }
};

function markAuthenticationResponse(context: Context): void {
  context.header('Cache-Control', 'no-store');
}

async function parseRequestEmailMagicLinkRequest(
  context: Context
): Promise<RequestEmailMagicLinkApiRequest | Response> {
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch (_error) {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  return isRequestEmailMagicLinkApiRequest(payload)
    ? payload
    : context.json(INVALID_REQUEST_RESPONSE, 400);
}

async function parseCompleteEmailMagicLinkRequest(
  context: Context
): Promise<CompleteEmailMagicLinkApiRequest | Response> {
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch (_error) {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  return isCompleteEmailMagicLinkApiRequest(payload)
    ? payload
    : context.json(INVALID_REQUEST_RESPONSE, 400);
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
    emailMagicLinkChallenges: dependencies.persistence.emailMagicLinkChallenges
  });

  await dependencies.emailMagicLinkDelivery.sendMagicLink({
    emailNormalized: issued.record.emailNormalized,
    token: issued.token,
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
    emailMagicLinkChallenges: dependencies.persistence.emailMagicLinkChallenges,
    authIdentityProvisioning: dependencies.persistence.authIdentityProvisioning,
    authSessions: dependencies.persistence.authSessions
  });

  if (completed === null) {
    return context.json(INVALID_MAGIC_LINK_RESPONSE, 401);
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
