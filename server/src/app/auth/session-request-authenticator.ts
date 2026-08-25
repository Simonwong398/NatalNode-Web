import type { Clock } from '../creation-boundaries.js';
import type { AuthSessionRepository } from '../../persistence/auth-session-repository.js';
import {
  assertValidSessionCookiePolicy,
  extractSessionCookie
} from '../../auth-runtime/session-cookie.js';
import type { SessionCookiePolicy } from '../../auth-runtime/session-cookie.js';
import type { TokenHasher } from '../../auth-runtime/token-hasher.js';
import type { AuthenticatedPrincipal, RequestAuthenticator } from './request-authenticator.js';

export interface SessionRequestAuthenticatorDependencies {
  readonly authSessions: AuthSessionRepository;
  readonly tokenHasher: TokenHasher;
  readonly clock: Clock;
  readonly cookiePolicy: SessionCookiePolicy;
}

/** Authenticates requests using the configured opaque session cookie. */
export class SessionRequestAuthenticator implements RequestAuthenticator {
  public constructor(
    private readonly dependencies: SessionRequestAuthenticatorDependencies
  ) {
    assertValidSessionCookiePolicy(dependencies.cookiePolicy);
  }

  public async authenticate(request: Request): Promise<AuthenticatedPrincipal | null> {
    const sessionToken = extractSessionCookie(request, this.dependencies.cookiePolicy);

    if (sessionToken === null) {
      return null;
    }

    const sessionTokenHash = this.dependencies.tokenHasher.hash(sessionToken);
    const now = this.dependencies.clock.now();
    const session = await this.dependencies.authSessions.findActiveByTokenHash(
      sessionTokenHash,
      now
    );

    return session ? { userId: session.userId } : null;
  }
}
