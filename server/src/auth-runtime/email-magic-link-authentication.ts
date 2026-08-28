import type { IdGenerator } from '../app/creation-boundaries.js';
import type { EmailMagicLinkAuthLifecycle } from '../persistence/email-magic-link-auth-lifecycle.js';
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
  readonly authLifecycle: EmailMagicLinkAuthLifecycle;
}

/** Completes one consumed email magic-link challenge into a persisted session. */
export async function completeEmailMagicLinkAuthentication(
  input: CompleteEmailMagicLinkAuthenticationInput
): Promise<CompletedEmailMagicLinkAuthentication | null> {
  if (input.presentedToken.trim().length === 0) {
    return null;
  }

  const tokenHash = input.tokenHasher.hash(input.presentedToken);

  return input.authLifecycle.withConsumedChallenge({
    tokenHash,
    now: input.now,
    consumedAt: input.now
  }, async ({ challenge, authIdentityProvisioning, authSessions }) => {
    const proposedUserId = input.idGenerator.generate();
    const proposedIdentityId = input.idGenerator.generate();
    const returnedIdentity = await authIdentityProvisioning.resolveOrCreate({
      provider: 'EMAIL_MAGIC_LINK',
      providerSubject: challenge.emailNormalized,
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

    await authSessions.create(issuedSession.record);

    return {
      userId: returnedIdentity.userId,
      sessionToken: issuedSession.token,
      sessionExpiresAt: input.sessionExpiresAt
    };
  });
}
