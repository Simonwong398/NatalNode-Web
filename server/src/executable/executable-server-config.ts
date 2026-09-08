import type { EnvironmentSource } from '../runtime/environment/index.js';
import { parseServerOperationalConfig } from '../runtime/environment/parse-server-operational-config.js';
import type { ServerRuntimeMode } from '../runtime/server-runtime-config.js';

export const DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE = 'development-mock';

export interface ExecutableServerConfig {
  readonly runtimeMode: ServerRuntimeMode;
  readonly resendApiKey: string;
  readonly authEmailFrom: string;
  readonly engineClientMode: typeof DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE;
}

function configurationError(variableName: string): never {
  throw new Error(
    `Executable server configuration is invalid: ${variableName}`
  );
}

function readRequired(
  environment: EnvironmentSource,
  variableName: string
): string {
  const value = environment[variableName];

  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.trim().length === 0
  ) {
    return configurationError(variableName);
  }

  return value;
}

export function parseExecutableServerConfig(
  environment: EnvironmentSource
): ExecutableServerConfig {
  const operationalConfig = parseServerOperationalConfig(environment);
  const resendApiKey = readRequired(environment, 'RESEND_API_KEY');
  const authEmailFrom = readRequired(environment, 'AUTH_EMAIL_FROM');
  const engineClientMode = readRequired(environment, 'ENGINE_CLIENT_MODE');

  if (engineClientMode !== DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE) {
    return configurationError('ENGINE_CLIENT_MODE');
  }

  if (operationalConfig.runtimeMode === 'production') {
    return configurationError('ENGINE_CLIENT_MODE');
  }

  return {
    runtimeMode: operationalConfig.runtimeMode,
    resendApiKey,
    authEmailFrom,
    engineClientMode
  };
}

export function loadExecutableServerConfig(): ExecutableServerConfig {
  return parseExecutableServerConfig(process.env);
}
