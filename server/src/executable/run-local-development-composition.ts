import { fileURLToPath } from 'node:url';
import {
  createServerProcessRuntime,
  loadServerEnvironment,
  type ServerProcessRuntime
} from '../runtime/index.js';
import { waitForProcessShutdown } from '../runtime/process/index.js';
import { createExecutableServerBindings } from './create-executable-server-bindings.js';
import { loadExecutableServerConfig } from './executable-server-config.js';
import { parseLocalDevelopmentConfig } from './local-development-config.js';
import {
  startLocalPublicEdge,
  type LocalPublicEdgeRuntime
} from './local-public-edge.js';

const ASTRO_STATIC_DIRECTORY = fileURLToPath(
  new URL('../../../apps/web/dist/', import.meta.url)
);

async function closeLocalResources(
  publicEdge: LocalPublicEdgeRuntime,
  apiRuntime: ServerProcessRuntime
): Promise<void> {
  const failures: unknown[] = [];

  try {
    await publicEdge.close();
  } catch (error) {
    failures.push(error);
  }

  try {
    await apiRuntime.close();
  } catch (error) {
    failures.push(error);
  }

  if (failures.length === 1) {
    throw failures[0];
  }

  if (failures.length > 1) {
    throw new AggregateError(
      failures,
      'Local public edge and API shutdown both failed.'
    );
  }
}

async function closeAfterPublicEdgeFailure(
  apiRuntime: ServerProcessRuntime,
  publicEdgeError: unknown
): Promise<never> {
  try {
    await apiRuntime.close();
  } catch (cleanupError) {
    throw new AggregateError(
      [publicEdgeError, cleanupError],
      'Local public edge startup and API cleanup both failed.'
    );
  }

  throw publicEdgeError;
}

export async function runLocalDevelopmentComposition(): Promise<void> {
  const environmentConfig = loadServerEnvironment();
  const executableConfig = loadExecutableServerConfig();
  const localConfig = parseLocalDevelopmentConfig(
    process.env,
    environmentConfig
  );
  const bindings = createExecutableServerBindings(executableConfig);
  const apiRuntime = await createServerProcessRuntime(
    environmentConfig,
    bindings
  );
  let publicEdge: LocalPublicEdgeRuntime;

  try {
    publicEdge = await startLocalPublicEdge({
      ...localConfig,
      staticDirectory: ASTRO_STATIC_DIRECTORY
    });
  } catch (publicEdgeError) {
    return closeAfterPublicEdgeFailure(apiRuntime, publicEdgeError);
  }

  let closePromise: Promise<void> | undefined;

  await waitForProcessShutdown({
    close(): Promise<void> {
      if (closePromise === undefined) {
        closePromise = closeLocalResources(publicEdge, apiRuntime);
      }

      return closePromise;
    }
  });
}
