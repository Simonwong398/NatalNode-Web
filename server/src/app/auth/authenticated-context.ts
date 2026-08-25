import type { AuthenticatedPrincipal } from './request-authenticator.js';

export interface AuthenticatedContextVariables {
  authenticatedPrincipal: AuthenticatedPrincipal;
}

export type AuthenticatedRequestEnv = {
  Variables: AuthenticatedContextVariables;
};

declare module 'hono' {
  interface ContextVariableMap extends AuthenticatedContextVariables {}
}
