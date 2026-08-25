import type { EngineClient } from '@natalnode/engine-client';
import type { PersistenceRepositories } from '../persistence/index.js';
import type { RequestAuthenticator } from './auth/index.js';
import type { Clock, IdGenerator } from './creation-boundaries.js';

export interface ServerDependencies {
  readonly authenticator: RequestAuthenticator;
  readonly idGenerator: IdGenerator;
  readonly persistence: PersistenceRepositories;
  readonly engineClient: EngineClient;
  readonly clock: Clock;
}
