export { requireAuthentication } from './app/auth/index.js';
export type {
  AuthenticatedContextVariables,
  AuthenticatedPrincipal,
  AuthenticatedRequestEnv,
  RequestAuthenticator
} from './app/auth/index.js';

export { createApp } from './app/index.js';
export type { ServerDependencies } from './app/index.js';

export type {
  AuthIdentityRepository,
  ChartNoteContentUpdate,
  ChartNoteRepository,
  PersistenceRepositories,
  UserRepository,
  VaultChartMetadataUpdate,
  VaultChartRepository
} from './persistence/index.js';

export type { SqlExecutor, SqlQueryResult } from './db/index.js';
export {
  createPostgresPersistence,
  PostgresAuthIdentityRepository,
  PostgresChartNoteRepository,
  PostgresUserRepository,
  PostgresVaultChartRepository
} from './persistence/postgres/index.js';
