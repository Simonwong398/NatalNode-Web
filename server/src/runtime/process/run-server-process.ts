import type { ServerBootstrapBindings } from '../bootstrap/index.js';
import { loadServerProcessRuntime } from './load-server-process-runtime.js';
import { waitForProcessShutdown } from './wait-for-process-shutdown.js';

export async function runServerProcess(
  bindings: ServerBootstrapBindings
): Promise<void> {
  const runtime = await loadServerProcessRuntime(bindings);

  await waitForProcessShutdown(runtime);
}
