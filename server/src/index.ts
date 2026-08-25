export { requireAuthentication } from './app/auth/index.js';
export type {
  AuthenticatedContextVariables,
  AuthenticatedPrincipal,
  AuthenticatedRequestEnv,
  RequestAuthenticator,
  SessionRequestAuthenticatorDependencies
} from './app/auth/index.js';
export { SessionRequestAuthenticator } from './app/auth/index.js';

export type {
  AuthenticationExpirationPolicy,
  AuthSessionRecord,
  CompleteEmailMagicLinkAuthenticationInput,
  ConsumeEmailMagicLinkTokenInput,
  CompletedEmailMagicLinkAuthentication,
  EmailMagicLinkDelivery,
  EmailMagicLinkDeliveryRequest,
  EmailMagicLinkChallengeRecord,
  IssuedAuthSession,
  IssuedEmailMagicLinkChallenge,
  IssueEmailMagicLinkChallengeInput,
  IssueAuthSessionInput,
  SessionCookiePolicy,
  SecureTokenGenerator,
  TokenHasher
} from './auth-runtime/index.js';
export {
  completeEmailMagicLinkAuthentication,
  consumeEmailMagicLinkToken,
  issueAuthSession,
  issueEmailMagicLinkChallenge,
  normalizeEmailAddress,
  NodeSecureTokenGenerator,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  Sha256TokenHasher,
  extractSessionCookie
} from './auth-runtime/index.js';

export { createApp } from './app/index.js';
export type { Clock, IdGenerator, ServerDependencies } from './app/index.js';

export type {
  AuthSessionRepository,
  AuthIdentityRepository,
  AuthIdentityProvisioningInput,
  AuthIdentityProvisioningRepository,
  ChartNoteContentUpdate,
  ChartNoteRepository,
  EmailMagicLinkChallengeRepository,
  PersistenceRepositories,
  UserRepository,
  VaultChartMetadataUpdate,
  VaultChartRepository
} from './persistence/index.js';

export type { SqlExecutor, SqlQueryResult } from './db/index.js';
export {
  createPostgresPersistence,
  PostgresAuthSessionRepository,
  PostgresAuthIdentityRepository,
  PostgresAuthIdentityProvisioningRepository,
  PostgresChartNoteRepository,
  PostgresEmailMagicLinkChallengeRepository,
  PostgresUserRepository,
  PostgresVaultChartRepository
} from './persistence/postgres/index.js';
