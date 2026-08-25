import type { ServerBootstrapBindings } from '../bootstrap/index.js';
import { loadServerProcessRuntime } from './load-server-process-runtime.js';

export async function runServerProcess(
  bindings: ServerBootstrapBindings
): Promise<void> {
  const runtime = await loadServerProcessRuntime(bindings);

  await new Promise<void>((resolve, reject) => {
    const onSignal = (): void => {
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);

      try {
        void runtime.close().then(resolve, reject);
      } catch (error) {
        reject(error);
      }
    };

    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  });
}
