import type { ServerEnvironmentConfig } from './server-environment-config.js';
import { parseServerEnvironment } from './parse-server-environment.js';

export function loadServerEnvironment(): ServerEnvironmentConfig {
  return parseServerEnvironment(process.env);
}
