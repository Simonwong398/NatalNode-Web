import type { EngineClient } from '@natalnode/engine-client';
import type { PersistenceRepositories } from '../persistence/index.js';
import type { RequestAuthenticator } from './auth/index.js';

export interface ServerDependencies {
  readonly authenticator: RequestAuthenticator;
  readonly persistence: PersistenceRepositories;
  readonly engineClient: EngineClient;
}
