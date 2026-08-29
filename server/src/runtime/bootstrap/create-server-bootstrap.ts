import { createApp } from '../../app/index.js';
import type { ServerEnvironmentConfig } from '../environment/index.js';
import { createServerRuntimeDependencies } from '../create-server-runtime-dependencies.js';
import {
  createPostgresPoolRuntime,
  type PostgresPoolRuntime
} from '../postgres/index.js';
import type { ServerBootstrapBindings } from './server-bootstrap-bindings.js';
import type { ServerBootstrap } from './server-bootstrap.js';

async function closeAfterCompositionFailure(
  postgresRuntime: PostgresPoolRuntime,
  compositionError: unknown
): Promise<never> {
  try {
    await postgresRuntime.close();
  } catch (cleanupError) {
    throw new AggregateError(
      [compositionError, cleanupError],
      'Server bootstrap composition and PostgreSQL cleanup both failed.'
    );
  }

  throw compositionError;
}

export async function createServerBootstrap(
  environmentConfig: ServerEnvironmentConfig,
  bindings: ServerBootstrapBindings
): Promise<ServerBootstrap> {
  const postgresRuntime = createPostgresPoolRuntime(
    environmentConfig.postgresPoolRuntimeConfig
  );

  try {
    const serverDependencies = createServerRuntimeDependencies(
      {
        sqlExecutor: postgresRuntime.sqlExecutor,
        accountDataExport: postgresRuntime.accountDataExport,
        postgresConnectionTimeoutMillis:
          postgresRuntime.connectionTimeoutMillis,
        accountErasure: postgresRuntime.accountErasure,
        emailMagicLinkAuthLifecycle:
          postgresRuntime.emailMagicLinkAuthLifecycle,
        engineClient: bindings.engineClient,
        chartResultCacheIdentity: bindings.chartResultCacheIdentity,
        emailMagicLinkDelivery: bindings.emailMagicLinkDelivery
      },
      environmentConfig.serverRuntimeConfig
    );
    const app = createApp(serverDependencies);

    return {
      app,
      close(): Promise<void> {
        return postgresRuntime.close();
      }
    };
  } catch (compositionError) {
    return closeAfterCompositionFailure(postgresRuntime, compositionError);
  }
}
