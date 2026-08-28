import type { Context, MiddlewareHandler } from 'hono';
import type { AuthenticatedRequestEnv } from './authenticated-context.js';
import type { RequestAuthenticator } from './request-authenticator.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';

export function requireAuthentication(
  authenticator: RequestAuthenticator,
  onUnauthenticated: (
    context: Context<AuthenticatedRequestEnv>
  ) => Response = (context) =>
    createProblemDetailsContextResponse(context, {
      code: 'UNAUTHORIZED'
    })
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
