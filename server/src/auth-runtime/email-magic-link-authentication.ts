import type { IdGenerator } from '../app/creation-boundaries.js';
import type { AuthIdentityProvisioningRepository } from '../persistence/auth-identity-provisioning-repository.js';
import type { AuthSessionRepository } from '../persistence/auth-session-repository.js';
import type { EmailMagicLinkChallengeRepository } from '../persistence/email-magic-link-challenge-repository.js';
import { consumeEmailMagicLinkToken } from './email-magic-link.js';
import { issueAuthSession } from './issue-auth-session.js';
import type { SecureTokenGenerator } from './secure-token.js';
import type { TokenHasher } from './token-hasher.js';

export interface CompletedEmailMagicLinkAuthentication {
  readonly userId: string;
  readonly sessionToken: string;
  readonly sessionExpiresAt: string;
}

export interface CompleteEmailMagicLinkAuthenticationInput {
  readonly presentedToken: string;
  readonly now: string;
  readonly sessionExpiresAt: string;
  readonly idGenerator: IdGenerator;
  readonly tokenGenerator: SecureTokenGenerator;
  readonly tokenHasher: TokenHasher;
  readonly emailMagicLinkChallenges: EmailMagicLinkChallengeRepository;
  readonly authIdentityProvisioning: AuthIdentityProvisioningRepository;
  readonly authSessions: AuthSessionRepository;
}

/** Completes one consumed email magic-link challenge into a persisted session. */
export async function completeEmailMagicLinkAuthentication(
  input: CompleteEmailMagicLinkAuthenticationInput
): Promise<CompletedEmailMagicLinkAuthentication | null> {
  const consumedChallenge = await consumeEmailMagicLinkToken({
    token: input.presentedToken,
    now: input.now,
    consumedAt: input.now,
    tokenHasher: input.tokenHasher,
    emailMagicLinkChallenges: input.emailMagicLinkChallenges
  });

  if (!consumedChallenge) {
    return null;
  }

  const proposedUserId = input.idGenerator.generate();
  const proposedIdentityId = input.idGenerator.generate();
  const returnedIdentity = await input.authIdentityProvisioning.resolveOrCreate({
    provider: 'EMAIL_MAGIC_LINK',
    providerSubject: consumedChallenge.emailNormalized,
    proposedUserId,
    proposedIdentityId,
    now: input.now
  });
  const issuedSession = issueAuthSession({
    userId: returnedIdentity.userId,
    createdAt: input.now,
    expiresAt: input.sessionExpiresAt,
    tokenGenerator: input.tokenGenerator,
    tokenHasher: input.tokenHasher
  });

  await input.authSessions.create(issuedSession.record);

  return {
    userId: returnedIdentity.userId,
    sessionToken: issuedSession.token,
    sessionExpiresAt: input.sessionExpiresAt
  };
}
