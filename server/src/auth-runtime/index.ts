export type {
  AuthSessionRecord,
  EmailMagicLinkChallengeRecord
} from './types.js';

export { AuthLifecycleCleanup } from './auth-lifecycle-cleanup.js';
export type { AuthLifecycleCleanupOptions } from './auth-lifecycle-cleanup.js';

export type { AuthenticationExpirationPolicy } from './authentication-expiration-policy.js';
export type {
  EmailMagicLinkDelivery,
  EmailMagicLinkDeliveryRequest
} from './email-magic-link-delivery.js';

export { PublicWebOriginMagicLinkUrlBuilder } from './magic-link-url-builder.js';
export type { MagicLinkUrlBuilder } from './magic-link-url-builder.js';

export { NodeSecureTokenGenerator } from './secure-token.js';
export type { SecureTokenGenerator } from './secure-token.js';

export { Sha256TokenHasher } from './token-hasher.js';
export type { TokenHasher } from './token-hasher.js';

export { issueAuthSession } from './issue-auth-session.js';
export type {
  IssuedAuthSession,
  IssueAuthSessionInput
} from './issue-auth-session.js';

export { normalizeEmailAddress } from './email-normalization.js';
export {
  consumeEmailMagicLinkToken,
  issueEmailMagicLinkChallenge
} from './email-magic-link.js';
export type {
  ConsumeEmailMagicLinkTokenInput,
  IssueEmailMagicLinkChallengeInput,
  IssuedEmailMagicLinkChallenge
} from './email-magic-link.js';

export { completeEmailMagicLinkAuthentication } from './email-magic-link-authentication.js';
export type {
  CompleteEmailMagicLinkAuthenticationInput,
  CompletedEmailMagicLinkAuthentication
} from './email-magic-link-authentication.js';

export {
  extractSessionCookie,
  serializeClearedSessionCookie,
  serializeSessionCookie
} from './session-cookie.js';
export type { SessionCookiePolicy } from './session-cookie.js';
