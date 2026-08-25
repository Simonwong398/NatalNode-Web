import type { SqlExecutor } from '../../db/index.js';
import type { PersistenceRepositories } from '../persistence-repositories.js';
import { PostgresAuthIdentityRepository } from './postgres-auth-identity-repository.js';
import { PostgresChartNoteRepository } from './postgres-chart-note-repository.js';
import { PostgresUserRepository } from './postgres-user-repository.js';
import { PostgresVaultChartRepository } from './postgres-vault-chart-repository.js';

export function createPostgresPersistence(executor: SqlExecutor): PersistenceRepositories {
  return {
    users: new PostgresUserRepository(executor),
    authIdentities: new PostgresAuthIdentityRepository(executor),
    vaultCharts: new PostgresVaultChartRepository(executor),
    chartNotes: new PostgresChartNoteRepository(executor)
  };
}
