export interface AuthenticatedPrincipal {
  readonly userId: string;
  /** Immutable creation timestamp from the verified server-side session row. */
  readonly sessionCreatedAt: string;
}

export interface RequestAuthenticator {
  authenticate(request: Request): Promise<AuthenticatedPrincipal | null>;
}
