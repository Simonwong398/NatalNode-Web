import { createAdaptorServer } from '@hono/node-server';
import { createServer, type Server } from 'node:http';
import type { ServerBootstrap } from '../bootstrap/index.js';
import type { NodeHttpListenerConfig } from './node-http-listener-config.js';
import type { NodeHttpListenerRuntime } from './node-http-listener-runtime.js';

function waitForListening(
  server: Server,
  config: NodeHttpListenerConfig
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      server.off('listening', onListening);
      server.off('error', onError);
    };
    const onListening = (): void => {
      cleanup();
      resolve();
    };
    const onError = (error: Error): void => {
      cleanup();
      reject(error);
    };

    server.once('listening', onListening);
    server.once('error', onError);

    try {
      server.listen(config.port, config.hostname);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function startNodeHttpListener(
  app: ServerBootstrap['app'],
  config: NodeHttpListenerConfig
): Promise<NodeHttpListenerRuntime> {
  const server = createAdaptorServer({
    createServer,
    fetch: app.fetch,
    hostname: config.hostname
  }) as Server;

  await waitForListening(server, config);

  let closePromise: Promise<void> | undefined;

  return {
    close(): Promise<void> {
      if (closePromise === undefined) {
        closePromise = closeServer(server);
      }

      return closePromise;
    }
  };
}
