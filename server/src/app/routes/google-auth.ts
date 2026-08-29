import type { Context, Hono } from 'hono';
import {
  completeGoogleAuthentication,
  GOOGLE_OIDC_SCOPES,
  GOOGLE_OAUTH_POST_AUTH_REDIRECT,
  serializeClearedGoogleOAuthCorrelationCookie,
  serializeGoogleOAuthCorrelationCookie,
  extractGoogleOAuthCorrelationCookie,
  serializeSessionCookie
} from '../../auth-runtime/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  parseGoogleCallbackQuery,
  validateEmptyGoogleStartRequest
} from '../validation/google-auth.js';

export const GOOGLE_AUTH_CALLBACK_PATH = '/api/auth/google/callback' as const;
export const GOOGLE_AUTH_FAILURE_REDIRECT =
  '/auth/sign-in#google-auth-failed' as const;

function markAuthenticationResponse(context: Context): void {
  context.header('Cache-Control', 'no-store');
}

function createGoogleCallbackUri(publicWebOrigin: string): string {
  return new URL(GOOGLE_AUTH_CALLBACK_PATH, publicWebOrigin).toString();
}

function isSafeAuthorizationUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4_096) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.hash.length === 0
    );
  } catch (_error) {
    return false;
  }
}

export function isGoogleAuthenticationAvailable(
  dependencies: ServerDependencies
): boolean {
  return (
    dependencies.googleOidcProvider !== undefined &&
    dependencies.googleOAuthTransactionService !== undefined &&
    dependencies.googleAuthAccountSessionLifecycle !== undefined
  );
}

function hasGoogleAuthDependencies(
  dependencies: ServerDependencies
): dependencies is ServerDependencies & {
  readonly googleOidcProvider: NonNullable<ServerDependencies['googleOidcProvider']>;
  readonly googleOAuthTransactionService: NonNullable<
    ServerDependencies['googleOAuthTransactionService']
  >;
  readonly googleAuthAccountSessionLifecycle: NonNullable<
    ServerDependencies['googleAuthAccountSessionLifecycle']
  >;
} {
  return isGoogleAuthenticationAvailable(dependencies);
}

function redirectToFailure(
  context: Context,
  dependencies: ServerDependencies
): Response {
  context.header(
    'Set-Cookie',
    serializeClearedGoogleOAuthCorrelationCookie(
      dependencies.sessionCookiePolicy
    )
  );
  return context.redirect(GOOGLE_AUTH_FAILURE_REDIRECT, 303);
}

async function terminalizeClaimedFailure(
  dependencies: ServerDependencies,
  transactionId: string
): Promise<void> {
  const transactionService = dependencies.googleOAuthTransactionService;

  if (transactionService === undefined) {
    return;
  }

  try {
    await transactionService.terminalize({
      transactionId,
      status: 'FAILED',
      terminalAt: dependencies.clock.now()
    });
  } catch (_error) {
    // Failure stays sanitized and fail-closed when terminalization is unavailable.
  }
}

async function startGoogleAuthentication(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  markAuthenticationResponse(context);

  if (!(await validateEmptyGoogleStartRequest(context.req.raw))) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  try {
    if ((await dependencies.authenticator.authenticate(context.req.raw)) !== null) {
      return createProblemDetailsContextResponse(context, {
        code: 'FORBIDDEN'
      });
    }

    if (!hasGoogleAuthDependencies(dependencies)) {
      return createProblemDetailsContextResponse(context, {
        code: 'INTERNAL_ERROR',
        detailKey: 'INTERNAL_ERROR'
      });
    }

    const now = dependencies.clock.now();
    const transaction = await dependencies.googleOAuthTransactionService.create({
      now
    });
    const redirectUri = createGoogleCallbackUri(dependencies.publicWebOrigin);
    const authorizationRequest =
      dependencies.googleOidcProvider.createAuthorizationRequest({
        state: transaction.state,
        codeChallenge: transaction.codeChallenge,
        nonce: transaction.nonce,
        scopes: GOOGLE_OIDC_SCOPES,
        redirectUri
      });

    if (!isSafeAuthorizationUrl(authorizationRequest.authorizationUrl)) {
      throw new Error('Google authorization URL is invalid.');
    }

    context.header(
      'Set-Cookie',
      serializeGoogleOAuthCorrelationCookie(
        transaction.browserBinding,
        transaction.expiresAt,
        dependencies.sessionCookiePolicy
      )
    );

    return context.redirect(authorizationRequest.authorizationUrl, 303);
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'INTERNAL_ERROR',
      detailKey: 'INTERNAL_ERROR'
    });
  }
}

async function callbackGoogleAuthentication(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  markAuthenticationResponse(context);

  const query = parseGoogleCallbackQuery(context.req.raw);
  let browserBinding: string | null = null;

  try {
    browserBinding = extractGoogleOAuthCorrelationCookie(
      context.req.raw,
      dependencies.sessionCookiePolicy
    );
  } catch (_error) {
    browserBinding = null;
  }

  if (query === null || browserBinding === null) {
    return redirectToFailure(context, dependencies);
  }

  if (!hasGoogleAuthDependencies(dependencies)) {
    return redirectToFailure(context, dependencies);
  }

  let claim;

  try {
    claim = await dependencies.googleOAuthTransactionService.claim({
      state: query.state,
      browserBinding,
      now: dependencies.clock.now()
    });
  } catch (_error) {
    return redirectToFailure(context, dependencies);
  }

  if (claim === null) {
    return redirectToFailure(context, dependencies);
  }

  const failedClaim = async (): Promise<Response> => {
    await terminalizeClaimedFailure(
      dependencies,
      claim.transactionId
    );
    return redirectToFailure(context, dependencies);
  };

  try {
    if ((await dependencies.authenticator.authenticate(context.req.raw)) !== null) {
      return failedClaim();
    }

    if (query.providerError) {
      return failedClaim();
    }

    const identity =
      await dependencies.googleOidcProvider.exchangeAuthorizationCode({
        code: query.code,
        redirectUri: createGoogleCallbackUri(dependencies.publicWebOrigin),
        pkceVerifier: claim.pkceVerifier,
        expectedNonceHash: claim.nonceHash
      });
    const completed = await completeGoogleAuthentication({
      transactionId: claim.transactionId,
      identity,
      now: dependencies.clock.now(),
      idGenerator: dependencies.idGenerator,
      tokenGenerator: dependencies.secureTokenGenerator,
      tokenHasher: dependencies.tokenHasher,
      authenticationExpirationPolicy:
        dependencies.authenticationExpirationPolicy,
      accountSessionLifecycle:
        dependencies.googleAuthAccountSessionLifecycle
    });

    if (completed.outcome === 'email-collision') {
      return redirectToFailure(context, dependencies);
    }

    const sessionCookie = serializeSessionCookieForGoogleAuthentication(
      completed.session.sessionToken,
      completed.session.sessionExpiresAt,
      dependencies
    );
    context.header(
      'Set-Cookie',
      serializeClearedGoogleOAuthCorrelationCookie(
        dependencies.sessionCookiePolicy
      )
    );
    context.header('Set-Cookie', sessionCookie, { append: true });
    return context.redirect(GOOGLE_OAUTH_POST_AUTH_REDIRECT, 303);
  } catch (_error) {
    return failedClaim();
  }
}

function serializeSessionCookieForGoogleAuthentication(
  token: string,
  expiresAt: string,
  dependencies: ServerDependencies
): string {
  return serializeSessionCookie(token, expiresAt, dependencies.sessionCookiePolicy);
}

export function registerGoogleAuthenticationRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.post('/api/auth/google/start', (context) =>
    startGoogleAuthentication(context, dependencies)
  );
  app.get(GOOGLE_AUTH_CALLBACK_PATH, (context) =>
    callbackGoogleAuthentication(context, dependencies)
  );
}
