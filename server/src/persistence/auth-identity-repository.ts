import type { AuthIdentity, AuthProvider } from '@natalnode/contracts';

export interface AuthIdentityRepository {
  create(identity: AuthIdentity): Promise<void>;
  findByProviderSubject(
    provider: AuthProvider,
    providerSubject: string
  ): Promise<AuthIdentity | null>;
  listForUser(userId: string): Promise<readonly AuthIdentity[]>;
}
