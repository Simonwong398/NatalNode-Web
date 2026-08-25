import { runServerProcess } from '../runtime/index.js';
import { createExecutableServerBindings } from './create-executable-server-bindings.js';
import { loadExecutableServerConfig } from './executable-server-config.js';

export function runServerExecutable(): Promise<void> {
  const executableConfig = loadExecutableServerConfig();
  const bindings = createExecutableServerBindings(executableConfig);

  return runServerProcess(bindings);
}
