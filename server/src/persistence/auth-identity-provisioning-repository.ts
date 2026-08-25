import type { AuthIdentity, AuthProvider } from '@natalnode/contracts';

export interface AuthIdentityProvisioningInput {
  readonly provider: AuthProvider;
  readonly providerSubject: string;
  readonly proposedUserId: string;
  readonly proposedIdentityId: string;
  readonly now: string;
}

/** Resolves an identity or provisions its owning account atomically. */
export interface AuthIdentityProvisioningRepository {
  resolveOrCreate(input: AuthIdentityProvisioningInput): Promise<AuthIdentity>;
}
