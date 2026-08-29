import type { Context, Hono } from 'hono';
import type {
  CurrentSessionApiResponse,
  LogoutApiResponse
} from '@natalnode/contracts';
import {
  extractSessionCookie,
  serializeClearedSessionCookie
} from '../../auth-runtime/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { isGoogleAuthenticationAvailable } from './google-auth.js';

function markAuthenticationResponse(context: Context): void {
  context.header('Cache-Control', 'no-store');
}

function attachClearedSessionCookie(
  context: Context,
  dependencies: ServerDependencies
): void {
  const clearedSessionCookie = serializeClearedSessionCookie(
    dependencies.sessionCookiePolicy
  );
  context.header('Set-Cookie', clearedSessionCookie);
}

async function logout(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  markAuthenticationResponse(context);

  const sessionToken = extractSessionCookie(
    context.req.raw,
    dependencies.sessionCookiePolicy
  );

  if (sessionToken !== null) {
    try {
      const sessionTokenHash = dependencies.tokenHasher.hash(sessionToken);
      await dependencies.persistence.authSessions.deleteByTokenHash(sessionTokenHash);
    } catch (error) {
      attachClearedSessionCookie(context, dependencies);
      throw error;
    }
  }

  attachClearedSessionCookie(context, dependencies);

  const response: LogoutApiResponse = { signedOut: true };
  return context.json(response);
}

async function getCurrentSession(
  context: Context,
  dependencies: ServerDependencies
): Promise<Response> {
  markAuthenticationResponse(context);

  const principal = await dependencies.authenticator.authenticate(context.req.raw);
  const response: CurrentSessionApiResponse = {
    authenticated: principal !== null,
    googleSignInAvailable: isGoogleAuthenticationAvailable(dependencies)
  };

  return context.json(response);
}

export function registerSessionAuthenticationRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.get('/api/auth/session', (context) =>
    getCurrentSession(context, dependencies)
  );
  app.post('/api/auth/logout', (context) => logout(context, dependencies));
}
