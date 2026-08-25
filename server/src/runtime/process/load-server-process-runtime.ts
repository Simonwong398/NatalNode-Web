import { loadServerEnvironment } from '../environment/index.js';
import type { ServerBootstrapBindings } from '../bootstrap/index.js';
import { createServerProcessRuntime } from './create-server-process-runtime.js';
import type { ServerProcessRuntime } from './server-process-runtime.js';

export function loadServerProcessRuntime(
  bindings: ServerBootstrapBindings
): Promise<ServerProcessRuntime> {
  const environmentConfig = loadServerEnvironment();

  return createServerProcessRuntime(environmentConfig, bindings);
}
