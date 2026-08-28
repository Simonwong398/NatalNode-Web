export { requireAuthentication } from './app/auth/index.js';
export type {
  AuthenticatedContextVariables,
  AuthenticatedPrincipal,
  AuthenticatedRequestEnv,
  RequestAuthenticator,
  SessionRequestAuthenticatorDependencies
} from './app/auth/index.js';
export { SessionRequestAuthenticator } from './app/auth/index.js';

export {
  ACCOUNT_DATA_EXPORT_SCHEMA_VERSION,
  assertAccountDataExportJsonValue,
  presentAccountDataExportAccount,
  presentAccountDataExportChart,
  presentAccountDataExportChartMetadata,
  presentAccountDataExportFeedback,
  presentAccountDataExportIdentity,
  presentAccountDataExportNote,
  UnsupportedAccountDataExportIdentityError,
  UnsafeAccountDataExportValueError
} from './account/account-data-export.js';
export type {
  AccountChartExportV1,
  AccountDataExportAccount,
  AccountDataExportAccountMetadata,
  AccountDataExportAccountPresentationSource,
  AccountDataExportChart,
  AccountDataExportChartCalculation,
  AccountDataExportChartMetadata,
  AccountDataExportChartPresentationSource,
  AccountDataExportFeedback,
  AccountDataExportFeedbackPresentationSource,
  AccountDataExportIdentity,
  AccountDataExportIdentityPresentationSource,
  AccountDataExportNote,
  AccountDataExportNotePresentationSource,
  AccountDataExportV1,
  ChartNoteExportV1,
  EmailMagicLinkExportIdentityV1,
  FeedbackExportV1,
  JsonPrimitive,
  JsonValue,
  NatalNodeAccountDataExportV1
} from './account/account-data-export.js';

export type {
  AuthenticationExpirationPolicy,
  AuthLifecycleCleanupOptions,
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
  AuthLifecycleCleanup,
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
  AccountDataExportChartPageItem,
  AccountDataExportCursor,
  AccountDataExportPage,
  AccountDataExportRepository,
  AccountDataExportSnapshot,
  AccountDataExportSnapshotOpenOptions,
  AccountDataExportSnapshotOpenResult,
  AuthLifecycleCleanupBatchInput,
  AuthLifecycleCleanupRepository,
  AuthLifecycleCleanupResult,
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
  PostgresAccountDataExportRepository,
  PostgresAccountErasureRepository,
  PostgresAuthLifecycleCleanupRepository,
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
