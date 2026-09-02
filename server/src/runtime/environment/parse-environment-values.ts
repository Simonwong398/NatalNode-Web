import type { EnvironmentSource } from './server-environment-config.js';
import { ServerEnvironmentConfigurationError } from './server-environment-configuration-error.js';

const CANONICAL_NON_NEGATIVE_INTEGER = /^(?:0|[1-9]\d*)$/u;

function missingVariable(variableName: string): never {
  throw new ServerEnvironmentConfigurationError(
    `Missing required environment variable: ${variableName}`
  );
}

export function invalidVariable(variableName: string, description: string): never {
  throw new ServerEnvironmentConfigurationError(
    `Invalid ${description} environment variable: ${variableName}`
  );
}

export function readRequired(
  env: EnvironmentSource,
  variableName: string
): string {
  const value = env[variableName];

  if (value === undefined) {
    return missingVariable(variableName);
  }

  if (typeof value !== 'string' || value.length === 0 || value.trim().length === 0) {
    return invalidVariable(variableName, 'required value');
  }

  return value;
}

export function parseRequiredBoolean(
  env: EnvironmentSource,
  variableName: string
): boolean {
  const value = readRequired(env, variableName);

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return invalidVariable(variableName, 'strict boolean');
}

export function parseOptionalBoolean(
  env: EnvironmentSource,
  variableName: string,
  defaultValue: boolean
): boolean {
  const value = env[variableName];

  if (value === undefined) {
    return defaultValue;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return invalidVariable(variableName, 'strict boolean');
}

export function parseCanonicalInteger(
  value: string,
  variableName: string,
  minimum: 0 | 1,
  description: string
): number {
  const pattern = minimum === 1
    ? /^[1-9]\d*$/u
    : CANONICAL_NON_NEGATIVE_INTEGER;
  const parsed = Number(value);

  if (
    !pattern.test(value) ||
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    !Number.isSafeInteger(parsed) ||
    parsed < minimum
  ) {
    return invalidVariable(variableName, description);
  }

  return parsed;
}

export function parseOptionalInteger(
  env: EnvironmentSource,
  variableName: string,
  minimum: 0 | 1,
  description: string
): number | undefined {
  const value = env[variableName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return invalidVariable(variableName, description);
  }

  return parseCanonicalInteger(value, variableName, minimum, description);
}
