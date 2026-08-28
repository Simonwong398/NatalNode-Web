import type { IdGenerator } from '../app/creation-boundaries.js';
import type { EmailMagicLinkAuthLifecycle } from '../persistence/email-magic-link-auth-lifecycle.js';
import type { EmailMagicLinkChallengeRepository } from '../persistence/email-magic-link-challenge-repository.js';
import type { SecureTokenGenerator } from './secure-token.js';
import { normalizeEmailAddress } from './email-normalization.js';
import type { TokenHasher } from './token-hasher.js';
import type { EmailMagicLinkChallengeRecord } from './types.js';

/** The transient challenge token paired with its persistence-safe record. */
export interface IssuedEmailMagicLinkChallenge {
  readonly token: string;
  readonly record: EmailMagicLinkChallengeRecord;
}

export interface IssueEmailMagicLinkChallengeInput {
  readonly email: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly idGenerator: IdGenerator;
  readonly tokenGenerator: SecureTokenGenerator;
  readonly tokenHasher: TokenHasher;
  readonly authLifecycle: EmailMagicLinkAuthLifecycle;
}

/** Issues and persists one email magic-link challenge. */
export async function issueEmailMagicLinkChallenge(
  input: IssueEmailMagicLinkChallengeInput
): Promise<IssuedEmailMagicLinkChallenge> {
  const emailNormalized = normalizeEmailAddress(input.email);

  if (emailNormalized.length === 0) {
    throw new Error('Email address must not be empty.');
  }

  const challengeId = input.idGenerator.generate();
  const token = input.tokenGenerator.generate();

  if (token.length === 0) {
    throw new Error('Secure token generator returned an empty token.');
  }

  const tokenHash = input.tokenHasher.hash(token);
  const record: EmailMagicLinkChallengeRecord = {
    challengeId,
    tokenHash,
    emailNormalized,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    consumedAt: null
  };

  await input.authLifecycle.createChallenge(record);

  return { token, record };
}

export interface ConsumeEmailMagicLinkTokenInput {
  readonly token: string;
  readonly now: string;
  readonly consumedAt: string;
  readonly tokenHasher: TokenHasher;
  readonly emailMagicLinkChallenges: EmailMagicLinkChallengeRepository;
}

/** Hashes a presented token and delegates single-use consumption atomically. */
export async function consumeEmailMagicLinkToken(
  input: ConsumeEmailMagicLinkTokenInput
): Promise<EmailMagicLinkChallengeRecord | null> {
  if (input.token.trim().length === 0) {
    return null;
  }

  const tokenHash = input.tokenHasher.hash(input.token);

  return input.emailMagicLinkChallenges.consumeValidByTokenHash(
    tokenHash,
    input.now,
    input.consumedAt
  );
}
