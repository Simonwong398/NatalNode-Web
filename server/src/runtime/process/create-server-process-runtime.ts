import type { ServerEnvironmentConfig } from '../environment/index.js';
import type { ServerBootstrapBindings } from '../bootstrap/index.js';
import { createServerBootstrap } from '../bootstrap/index.js';
import {
  startNodeHttpListener,
  type NodeHttpListenerRuntime
} from '../http/index.js';
import type { ServerBootstrap } from '../bootstrap/index.js';
import type { ServerProcessRuntime } from './server-process-runtime.js';

async function closeAfterListenerFailure(
  bootstrap: ServerBootstrap,
  listenerError: unknown
): Promise<never> {
  try {
    await bootstrap.close();
  } catch (cleanupError) {
    throw new AggregateError(
      [listenerError, cleanupError],
      'Node HTTP listener startup and server bootstrap cleanup both failed.'
    );
  }

  throw listenerError;
}

async function closeProcessResources(
  listener: NodeHttpListenerRuntime,
  bootstrap: ServerBootstrap
): Promise<void> {
  let listenerFailed = false;
  let listenerError: unknown;

  try {
    await listener.close();
  } catch (error) {
    listenerFailed = true;
    listenerError = error;
  }

  let bootstrapFailed = false;
  let bootstrapError: unknown;

  try {
    await bootstrap.close();
  } catch (error) {
    bootstrapFailed = true;
    bootstrapError = error;
  }

  if (listenerFailed && bootstrapFailed) {
    throw new AggregateError(
      [listenerError, bootstrapError],
      'Node HTTP listener and server bootstrap shutdown both failed.'
    );
  }

  if (listenerFailed) {
    throw listenerError;
  }

  if (bootstrapFailed) {
    throw bootstrapError;
  }
}

export async function createServerProcessRuntime(
  environmentConfig: ServerEnvironmentConfig,
  bindings: ServerBootstrapBindings
): Promise<ServerProcessRuntime> {
  const bootstrap = await createServerBootstrap(environmentConfig, bindings);

  try {
    const listener = await startNodeHttpListener(
      bootstrap.app,
      environmentConfig.nodeHttpListenerConfig
    );
    let closePromise: Promise<void> | undefined;

    return {
      close(): Promise<void> {
        if (closePromise === undefined) {
          closePromise = closeProcessResources(listener, bootstrap);
        }

        return closePromise;
      }
    };
  } catch (listenerError) {
    return closeAfterListenerFailure(bootstrap, listenerError);
  }
}
