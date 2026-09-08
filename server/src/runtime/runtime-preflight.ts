import {
  parseExecutableServerConfig
} from '../executable/executable-server-config.js';
import {
  assertPublicDevelopmentEnvironment
} from '../executable/public-development-config.js';
import type {
  EnvironmentSource,
  ServerEnvironmentConfig
} from './environment/index.js';
import { parseServerEnvironment } from './environment/index.js';
import {
  parseProductionRuntimeConfig,
  type RuntimeDependencyAdmissionState,
  type RuntimeDependencyConfigurationState
} from './production-runtime-config.js';

export type RuntimePreflightProfile =
  | 'development'
  | 'local-integration'
  | 'production';

export type RuntimePreflightConfigurationStatus = 'VALID';
export type RuntimePreflightReadinessStatus = 'READY' | 'NOT_READY';

export interface RuntimeDependencyPreflightState {
  readonly configuration: RuntimeDependencyConfigurationState;
  readonly admission: RuntimeDependencyAdmissionState;
  readonly developmentOnly?: boolean;
  readonly correctnessAuthority?: boolean;
}

export interface ServerRuntimePreflightReport {
  readonly profile: RuntimePreflightProfile;
  readonly configurationStatus: RuntimePreflightConfigurationStatus;
  readonly runtimeAdmission: RuntimeDependencyAdmissionState;
  readonly listenerStarted: false;
  readonly listener: {
    readonly hostname: string | null;
    readonly port: number | null;
  };
  readonly publicOrigin: string | null;
  readonly readiness: {
    readonly status: RuntimePreflightReadinessStatus;
    readonly reasons: readonly string[];
  };
  readonly dependencies: {
    readonly database: RuntimeDependencyPreflightState;
    readonly cache: RuntimeDependencyPreflightState;
    readonly rateLimiting: RuntimeDependencyPreflightState & {
      readonly authority: 'process-local' | 'distributed' | 'not-configured';
    };
    readonly email: RuntimeDependencyPreflightState;
    readonly auth: RuntimeDependencyPreflightState;
    readonly engine: RuntimeDependencyPreflightState;
  };
}

function localIntegrationReport(
  environment: EnvironmentSource,
  serverEnvironment: ServerEnvironmentConfig
): ServerRuntimePreflightReport {
  const executable = parseExecutableServerConfig(environment);

  if (executable.runtimeMode === 'production') {
    throw new Error(
      'Local-integration preflight cannot use production runtime mode.'
    );
  }

  return {
    profile: 'local-integration',
    configurationStatus: 'VALID',
    runtimeAdmission: 'ADMITTED',
    listenerStarted: false,
    listener: {
      hostname: serverEnvironment.nodeHttpListenerConfig.hostname,
      port: serverEnvironment.nodeHttpListenerConfig.port
    },
    publicOrigin: serverEnvironment.serverRuntimeConfig.publicWebOrigin,
    readiness: {
      status: 'READY',
      reasons: []
    },
    dependencies: {
      database: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED'
      },
      cache: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        correctnessAuthority: false
      },
      rateLimiting: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        authority:
          serverEnvironment.serverRuntimeConfig.operational.rateLimiting.authority
      },
      email: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      },
      auth: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      },
      engine: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      }
    }
  };
}

function developmentReport(): ServerRuntimePreflightReport {
  return {
    profile: 'development',
    configurationStatus: 'VALID',
    runtimeAdmission: 'ADMITTED',
    listenerStarted: false,
    listener: {
      hostname: null,
      port: null
    },
    publicOrigin: 'http://localhost:4321',
    readiness: {
      status: 'READY',
      reasons: []
    },
    dependencies: {
      database: {
        configuration: 'NOT_CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      },
      cache: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true,
        correctnessAuthority: false
      },
      rateLimiting: {
        configuration: 'NOT_CONFIGURED',
        admission: 'ADMITTED',
        authority: 'not-configured',
        developmentOnly: true
      },
      email: {
        configuration: 'NOT_CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      },
      auth: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      },
      engine: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED',
        developmentOnly: true
      }
    }
  };
}

function productionReport(
  environment: EnvironmentSource
): ServerRuntimePreflightReport {
  const config = parseProductionRuntimeConfig(environment);
  const operational = config.serverEnvironment.serverRuntimeConfig.operational;

  return {
    profile: 'production',
    configurationStatus: 'VALID',
    runtimeAdmission: 'NOT_ADMITTED',
    listenerStarted: false,
    listener: {
      hostname: config.serverEnvironment.nodeHttpListenerConfig.hostname,
      port: config.serverEnvironment.nodeHttpListenerConfig.port
    },
    publicOrigin: config.serverEnvironment.serverRuntimeConfig.publicWebOrigin,
    readiness: {
      status: 'NOT_READY',
      reasons: [
        'ENGINE_NOT_ADMITTED',
        'PRODUCTION_HTTP_COMPOSITION_NOT_ADMITTED'
      ]
    },
    dependencies: {
      database: {
        configuration: 'CONFIGURED',
        admission: 'ADMITTED'
      },
      cache: {
        configuration: 'NOT_CONFIGURED',
        admission: 'ADMITTED',
        correctnessAuthority: false
      },
      rateLimiting: {
        configuration: 'CONFIGURED',
        admission: 'NOT_ADMITTED',
        authority: operational.rateLimiting.authority
      },
      email: {
        configuration: 'CONFIGURED',
        admission: 'NOT_ADMITTED'
      },
      auth: {
        configuration: 'CONFIGURED',
        admission: 'NOT_ADMITTED'
      },
      engine: {
        configuration: config.engine.configuration,
        admission: config.engine.admission
      }
    }
  };
}

/**
 * Pure configuration/admission preflight. It never constructs a listener,
 * database pool, Engine client, email sender, or migration runtime.
 */
export function createServerRuntimePreflight(
  environment: EnvironmentSource,
  profile: RuntimePreflightProfile
): ServerRuntimePreflightReport {
  if (profile === 'development') {
    assertPublicDevelopmentEnvironment({ NODE_ENV: environment.NODE_ENV });
    return developmentReport();
  }

  if (profile === 'local-integration') {
    return localIntegrationReport(environment, parseServerEnvironment(environment));
  }

  return productionReport(environment);
}

export function readPreflightProfile(
  environment: EnvironmentSource
): RuntimePreflightProfile {
  const value = environment.NATALNODE_PREFLIGHT_PROFILE;

  if (
    value === 'development' ||
    value === 'local-integration' ||
    value === 'production'
  ) {
    return value;
  }

  throw new Error(
    'NATALNODE_PREFLIGHT_PROFILE must be development, local-integration, or production.'
  );
}
