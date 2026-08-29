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

export {
  GOOGLE_OIDC_PROVIDER,
  GoogleOidcProviderError,
  type GoogleOidcAuthorizationCodeExchangeInput,
  type GoogleOidcAuthorizationRequest,
  type GoogleOidcAuthorizationRequestInput,
  type GoogleOidcProvider,
  type GoogleOidcProviderErrorCode,
  type VerifiedGoogleIdentity
} from './google-oidc-provider.js';

export {
  deriveS256PkceCodeChallenge,
  GoogleOAuthTransactionService,
  verifyGoogleOAuthSecretHash,
  GOOGLE_OAUTH_FLOW_KIND,
  GOOGLE_OAUTH_POST_AUTH_REDIRECT,
  GOOGLE_OAUTH_TRANSACTION_MAX_TTL_SECONDS
} from './google-oauth-transaction.js';
export type {
  ClaimGoogleOAuthTransactionInput,
  CreateGoogleOAuthTransactionInput,
  GoogleOAuthTransactionFlowKind,
  GoogleOAuthTransactionPolicy,
  GoogleOAuthTransactionRecord,
  GoogleOAuthTransactionServiceDependencies,
  GoogleOAuthTransactionStartMaterial,
  GoogleOAuthTransactionStatus,
  GoogleOAuthTransactionTerminalStatus,
  TerminalizeGoogleOAuthTransactionInput
} from './google-oauth-transaction.js';

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
