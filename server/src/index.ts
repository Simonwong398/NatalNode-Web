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
  MagicLinkUrlBuilder,
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
  PublicWebOriginMagicLinkUrlBuilder,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  Sha256TokenHasher,
  extractSessionCookie
} from './auth-runtime/index.js';

export { createApp } from './app/index.js';
export type { Clock, IdGenerator, ServerDependencies } from './app/index.js';

export {
  createServerBootstrap,
  createServerRuntimeDependencies,
  createPostgresPoolRuntime,
  DurationAuthenticationExpirationPolicy,
  loadServerEnvironment,
  loadServerBootstrap,
  createServerProcessRuntime,
  loadServerProcessRuntime,
  NodeIdGenerator,
  parseServerEnvironment,
  PostgresMigrationError,
  PostgresSqlExecutor,
  runPostgresMigrations,
  runServerProcess,
  ServerEnvironmentConfigurationError,
  SystemClock,
  createResendEmailMagicLinkDelivery
} from './runtime/index.js';
export type {
  EnvironmentSource,
  PostgresMigrationRunResult,
  PostgresPoolRuntime,
  PostgresPoolRuntimeConfig,
  ServerBootstrap,
  ServerBootstrapBindings,
  ServerEnvironmentConfig,
  NodeHttpListenerConfig,
  NodeHttpListenerRuntime,
  ServerProcessRuntime,
  ServerRuntimeBindings,
  ServerRuntimeConfig,
  ResendEmailMagicLinkDeliveryConfig
} from './runtime/index.js';

export type {
  AccountErasureRepository,
  AccountErasureResult,
  AuthSessionRepository,
  AuthIdentityRepository,
  AuthIdentityProvisioningInput,
  AuthIdentityProvisioningRepository,
  ChartNoteContentUpdate,
  ChartNoteRepository,
  EmailMagicLinkChallengeRepository,
  EmailMagicLinkAuthLifecycle,
  FeedbackSubmissionRecord,
  FeedbackSubmissionRepository,
  PersistenceRepositories,
  UserRepository,
  VaultChartMetadataUpdate,
  VaultChartRepository
} from './persistence/index.js';

export type { SqlExecutor, SqlQueryResult } from './db/index.js';
export {
  createPostgresPersistence,
  PostgresAccountErasureRepository,
  PostgresAuthSessionRepository,
  PostgresAuthIdentityRepository,
  PostgresAuthIdentityProvisioningRepository,
  PostgresChartNoteRepository,
  PostgresEmailMagicLinkChallengeRepository,
  PostgresEmailMagicLinkAuthLifecycle,
  PostgresFeedbackSubmissionRepository,
  PostgresUserRepository,
  PostgresVaultChartRepository
} from './persistence/postgres/index.js';
