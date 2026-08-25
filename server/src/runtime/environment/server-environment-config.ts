import type { PostgresPoolRuntimeConfig } from '../postgres/index.js';
import type { ServerRuntimeConfig } from '../server-runtime-config.js';

export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface ServerEnvironmentConfig {
  readonly serverRuntimeConfig: ServerRuntimeConfig;
  readonly postgresPoolRuntimeConfig: PostgresPoolRuntimeConfig;
}
