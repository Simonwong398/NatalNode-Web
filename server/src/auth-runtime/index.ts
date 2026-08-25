export type {
  AuthSessionRecord,
  EmailMagicLinkChallengeRecord
} from './types.js';

export { NodeSecureTokenGenerator } from './secure-token.js';
export type { SecureTokenGenerator } from './secure-token.js';

export { Sha256TokenHasher } from './token-hasher.js';
export type { TokenHasher } from './token-hasher.js';

export { issueAuthSession } from './issue-auth-session.js';
export type {
  IssuedAuthSession,
  IssueAuthSessionInput
} from './issue-auth-session.js';
