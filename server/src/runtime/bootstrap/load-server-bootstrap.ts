import { loadServerEnvironment } from '../environment/index.js';
import type { ServerBootstrapBindings } from './server-bootstrap-bindings.js';
import { createServerBootstrap } from './create-server-bootstrap.js';
import type { ServerBootstrap } from './server-bootstrap.js';

export function loadServerBootstrap(
  bindings: ServerBootstrapBindings
): Promise<ServerBootstrap> {
  const environmentConfig = loadServerEnvironment();

  return createServerBootstrap(environmentConfig, bindings);
}
