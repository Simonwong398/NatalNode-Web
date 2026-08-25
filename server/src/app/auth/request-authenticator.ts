export interface AuthenticatedPrincipal {
  readonly userId: string;
}

export interface RequestAuthenticator {
  authenticate(request: Request): Promise<AuthenticatedPrincipal | null>;
}
