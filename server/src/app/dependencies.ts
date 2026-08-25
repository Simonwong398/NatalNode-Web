import type { EngineClient } from '@natalnode/engine-client';
import type { PersistenceRepositories } from '../persistence/index.js';

export interface ServerDependencies {
  readonly persistence: PersistenceRepositories;
  readonly engineClient: EngineClient;
}
