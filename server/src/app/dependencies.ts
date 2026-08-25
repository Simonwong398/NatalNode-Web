import type { PersistenceRepositories } from '../persistence/index.js';

export interface ServerDependencies {
  readonly persistence: PersistenceRepositories;
}
