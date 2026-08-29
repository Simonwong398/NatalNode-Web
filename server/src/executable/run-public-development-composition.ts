import { fileURLToPath } from 'node:url';
import { startLocalPublicEdge, type LocalPublicEdgeRuntime } from './local-public-edge.js';
import {
  PUBLIC_DEVELOPMENT_API_HOSTNAME,
  PUBLIC_DEVELOPMENT_API_PORT,
  PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN,
  PUBLIC_DEVELOPMENT_PUBLIC_PORT,
  assertPublicDevelopmentEnvironment
} from './public-development-config.js';
import { createPublicDevelopmentApp } from './public-development-dependencies.js';
import { startNodeHttpListener, type NodeHttpListenerRuntime } from '../runtime/http/index.js';
import { waitForProcessShutdown } from '../runtime/process/index.js';

const ASTRO_STATIC_DIRECTORY = fileURLToPath(
  new URL('../../../apps/web/dist/', import.meta.url)
);

export interface PublicDevelopmentRuntime {
  close(): Promise<void>;
}

async function closeRuntimeResources(
  publicEdge: LocalPublicEdgeRuntime,
  apiListener: NodeHttpListenerRuntime
): Promise<void> {
  const failures: unknown[] = [];

  try {
    await publicEdge.close();
  } catch (error) {
    failures.push(error);
  }

  try {
    await apiListener.close();
  } catch (error) {
    failures.push(error);
  }

  if (failures.length === 1) {
    throw failures[0];
  }

  if (failures.length > 1) {
    throw new AggregateError(
      failures,
      'Public-development edge and API shutdown both failed.'
    );
  }
}

async function closeAfterEdgeFailure(
  apiListener: NodeHttpListenerRuntime,
  edgeError: unknown
): Promise<never> {
  try {
    await apiListener.close();
  } catch (cleanupError) {
    throw new AggregateError(
      [edgeError, cleanupError],
      'Public-development edge startup and API cleanup both failed.'
    );
  }

  throw edgeError;
}

export async function createPublicDevelopmentRuntime(
  environment?: { readonly NODE_ENV?: string }
): Promise<PublicDevelopmentRuntime> {
  assertPublicDevelopmentEnvironment(environment);

  const app = createPublicDevelopmentApp(environment);
  const apiListener = await startNodeHttpListener(app, {
    hostname: PUBLIC_DEVELOPMENT_API_HOSTNAME,
    port: PUBLIC_DEVELOPMENT_API_PORT
  });

  let publicEdge: LocalPublicEdgeRuntime;

  try {
    publicEdge = await startLocalPublicEdge({
      publicPort: PUBLIC_DEVELOPMENT_PUBLIC_PORT,
      apiHostname: PUBLIC_DEVELOPMENT_API_HOSTNAME,
      apiPort: PUBLIC_DEVELOPMENT_API_PORT,
      staticDirectory: ASTRO_STATIC_DIRECTORY
    });
  } catch (edgeError) {
    return closeAfterEdgeFailure(apiListener, edgeError);
  }

  let closePromise: Promise<void> | undefined;

  return {
    close(): Promise<void> {
      if (closePromise === undefined) {
        closePromise = closeRuntimeResources(publicEdge, apiListener);
      }

      return closePromise;
    }
  };
}

export async function runPublicDevelopmentComposition(): Promise<void> {
  const runtime = await createPublicDevelopmentRuntime();

  process.stdout.write(
    `NatalNode public-development runtime ready at ${PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN}\n`
  );

  await waitForProcessShutdown(runtime);
}
