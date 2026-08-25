import type { SecureTokenGenerator } from './secure-token.js';
import type { TokenHasher } from './token-hasher.js';
import type { AuthSessionRecord } from './types.js';

/** The transient bearer token paired with its persistence-safe session record. */
export interface IssuedAuthSession {
  readonly token: string;
  readonly record: AuthSessionRecord;
}

export interface IssueAuthSessionInput {
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly tokenGenerator: SecureTokenGenerator;
  readonly tokenHasher: TokenHasher;
}

/**
 * Creates session material from trusted orchestration inputs without choosing
 * a lifetime or coupling issuance to persistence.
 */
export function issueAuthSession(input: IssueAuthSessionInput): IssuedAuthSession {
  const token = input.tokenGenerator.generate();

  if (token.length === 0) {
    throw new Error('Secure token generator returned an empty token.');
  }

  const sessionTokenHash = input.tokenHasher.hash(token);

  return {
    token,
    record: {
      sessionTokenHash,
      userId: input.userId,
      createdAt: input.createdAt,
      expiresAt: input.expiresAt
    }
  };
}
