import type { Context, MiddlewareHandler } from 'hono';
import type { AuthenticatedRequestEnv } from './authenticated-context.js';
import type { RequestAuthenticator } from './request-authenticator.js';

const UNAUTHORIZED_RESPONSE = {
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication is required.'
  }
} as const;

export function requireAuthentication(
  authenticator: RequestAuthenticator,
  onUnauthenticated: (
    context: Context<AuthenticatedRequestEnv>
  ) => Response = (context) => context.json(UNAUTHORIZED_RESPONSE, 401)
): MiddlewareHandler<AuthenticatedRequestEnv> {
  return async (context, next) => {
    const principal = await authenticator.authenticate(context.req.raw);

    if (!principal) {
      return onUnauthenticated(context);
    }

    context.set('authenticatedPrincipal', principal);
    await next();
  };
}
