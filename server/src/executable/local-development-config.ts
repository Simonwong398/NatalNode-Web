import type {
  EnvironmentSource,
  ServerEnvironmentConfig
} from '../runtime/index.js';

const CANONICAL_POSITIVE_INTEGER = /^[1-9]\d*$/u;

export interface LocalDevelopmentConfig {
  readonly publicPort: number;
  readonly apiHostname: string;
  readonly apiPort: number;
}

function configurationError(variableName: string): never {
  throw new Error(
    `Local deployment configuration is invalid: ${variableName}`
  );
}

function parsePublicPort(environment: EnvironmentSource): number {
  const value = environment.LOCAL_PUBLIC_PORT;
  const parsed = Number(value);

  if (
    typeof value !== 'string' ||
    !CANONICAL_POSITIVE_INTEGER.test(value) ||
    !Number.isSafeInteger(parsed) ||
    parsed > 65_535
  ) {
    return configurationError('LOCAL_PUBLIC_PORT');
  }

  return parsed;
}

export function parseLocalDevelopmentConfig(
  environment: EnvironmentSource,
  serverEnvironment: ServerEnvironmentConfig
): LocalDevelopmentConfig {
  const publicPort = parsePublicPort(environment);
  const expectedPublicOrigin = new URL(
    `http://localhost:${publicPort}`
  ).origin;

  if (
    serverEnvironment.serverRuntimeConfig.publicWebOrigin !==
    expectedPublicOrigin
  ) {
    return configurationError('PUBLIC_WEB_ORIGIN');
  }

  if (serverEnvironment.nodeHttpListenerConfig.port === publicPort) {
    return configurationError('LOCAL_PUBLIC_PORT');
  }

  return {
    publicPort,
    apiHostname: serverEnvironment.nodeHttpListenerConfig.hostname,
    apiPort: serverEnvironment.nodeHttpListenerConfig.port
  };
}
