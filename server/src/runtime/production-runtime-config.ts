import type {
  EnvironmentSource,
  ServerEnvironmentConfig
} from './environment/index.js';
import { parseServerEnvironment } from './environment/index.js';
import {
  invalidVariable,
  readRequired
} from './environment/parse-environment-values.js';

export const PRODUCTION_ENGINE_CLIENT_ADMISSION = 'NOT_ADMITTED' as const;

export type RuntimeDependencyConfigurationState =
  | 'CONFIGURED'
  | 'NOT_CONFIGURED';

export type RuntimeDependencyAdmissionState = 'ADMITTED' | 'NOT_ADMITTED';

export interface ProductionRuntimeConfig {
  readonly serverEnvironment: ServerEnvironmentConfig;
  /** Retained at the composition boundary; never included in diagnostics. */
  readonly email: {
    readonly resendApiKey: string;
    readonly authEmailFrom: string;
  };
  readonly engine: {
    readonly configuration: RuntimeDependencyConfigurationState;
    readonly admission: typeof PRODUCTION_ENGINE_CLIENT_ADMISSION;
  };
}

function isObviousProductionPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === 'changeme' ||
    normalized === 'change-me' ||
    normalized === 'example-secret' ||
    normalized === 'example-key' ||
    normalized === 'test-secret' ||
    normalized === 'test-key' ||
    normalized === 're_xxx' ||
    normalized === 're_xxxxxxxxx' ||
    normalized.startsWith('your-') ||
    normalized.startsWith('replace-') ||
    normalized.startsWith('re_test') ||
    normalized.includes('placeholder') ||
    normalized.includes('dummy') ||
    normalized.includes('example.') ||
    normalized.includes('@resend.dev') ||
    normalized.includes('localhost') ||
    normalized.includes('example-secret')
  );
}

function readProductionSensitiveValue(
  environment: EnvironmentSource,
  variableName: string
): string {
  const value = readRequired(environment, variableName);

  if (isObviousProductionPlaceholder(value)) {
    return invalidVariable(variableName, 'production-safe value');
  }

  return value;
}

function validateProductionEmailFrom(value: string): void {
  const address = value.match(/<?([^<>\s@]+@[^<>\s@]+)>?$/u)?.[1];

  if (address === undefined || isObviousProductionPlaceholder(address)) {
    return invalidVariable('AUTH_EMAIL_FROM', 'production sender identity');
  }
}

function validateProductionOperationalConfig(
  environment: EnvironmentSource,
  serverEnvironment: ServerEnvironmentConfig
): void {
  const operational = serverEnvironment.serverRuntimeConfig.operational;

  if (operational.runtimeMode !== 'production') {
    return invalidVariable(
      'NATALNODE_RUNTIME_MODE',
      'explicit production runtime mode'
    );
  }

  if (operational.rateLimiting.authority !== 'distributed') {
    return invalidVariable(
      'NATALNODE_RATE_LIMIT_AUTHORITY',
      'production distributed rate-limit authority'
    );
  }

  if (!operational.observability.durableSinkConfigured) {
    return invalidVariable(
      'NATALNODE_OBSERVABILITY_DURABLE_SINK_CONFIGURED',
      'production durable observability'
    );
  }

  if (!operational.privacyAccessAuditRequired) {
    return invalidVariable(
      'NATALNODE_PRIVACY_ACCESS_AUDIT_REQUIRED',
      'production privacy access audit'
    );
  }

  const engineClientMode = environment.ENGINE_CLIENT_MODE;

  if (engineClientMode !== undefined) {
    return invalidVariable(
      'ENGINE_CLIENT_MODE',
      'production Engine client admission'
    );
  }
}

/**
 * Parses the complete production configuration without constructing a
 * network listener, database pool, Engine client, or email sender.
 *
 * Engine configuration and Engine admission intentionally remain separate:
 * an optional endpoint value is only reported as configured and is never
 * consumed by this boundary.
 */
export function parseProductionRuntimeConfig(
  environment: EnvironmentSource
): ProductionRuntimeConfig {
  const serverEnvironment = parseServerEnvironment(environment);
  validateProductionOperationalConfig(environment, serverEnvironment);

  const resendApiKey = readProductionSensitiveValue(
    environment,
    'RESEND_API_KEY'
  );
  const authEmailFrom = readProductionSensitiveValue(
    environment,
    'AUTH_EMAIL_FROM'
  );
  validateProductionEmailFrom(authEmailFrom);

  return {
    serverEnvironment,
    email: {
      resendApiKey,
      authEmailFrom
    },
    engine: {
      configuration:
        environment.NATALNODE_ENGINE_URL === undefined
          ? 'NOT_CONFIGURED'
          : 'CONFIGURED',
      admission: PRODUCTION_ENGINE_CLIENT_ADMISSION
    }
  };
}

export function loadProductionRuntimeConfig(): ProductionRuntimeConfig {
  return parseProductionRuntimeConfig(process.env);
}

/** Production server:start remains closed until an explicit Engine binding is admitted. */
export function assertProductionRuntimeAdmission(
  _config: ProductionRuntimeConfig
): never {
  throw new Error('Production EngineClient composition is not admitted.');
}
