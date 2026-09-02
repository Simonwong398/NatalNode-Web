import {
  invalidVariable,
  parseOptionalBoolean
} from './parse-environment-values.js';
import type {
  EnvironmentSource
} from './server-environment-config.js';
import type {
  RateLimitAuthorityKind,
  ServerOperationalConfig,
  ServerRuntimeMode
} from '../server-runtime-config.js';

function parseRuntimeMode(env: EnvironmentSource): ServerRuntimeMode {
  const value = env.NATALNODE_RUNTIME_MODE;

  if (value === undefined) {
    if (env.NODE_ENV?.trim().toLowerCase() === 'production') {
      return invalidVariable(
        'NATALNODE_RUNTIME_MODE',
        'explicit production runtime mode'
      );
    }

    return 'local';
  }

  if (value === 'local' || value === 'staging' || value === 'production') {
    return value;
  }

  return invalidVariable('NATALNODE_RUNTIME_MODE', 'runtime mode');
}

function parseRateLimitAuthority(env: EnvironmentSource): RateLimitAuthorityKind {
  const value = env.NATALNODE_RATE_LIMIT_AUTHORITY;

  if (value === undefined || value === 'process-local') {
    return 'process-local';
  }

  if (value === 'distributed') {
    return 'distributed';
  }

  return invalidVariable(
    'NATALNODE_RATE_LIMIT_AUTHORITY',
    'rate-limit authority'
  );
}

export function parseServerOperationalConfig(
  env: EnvironmentSource
): ServerOperationalConfig {
  const runtimeMode = parseRuntimeMode(env);
  const localDefaults = runtimeMode === 'local';

  return {
    runtimeMode,
    authentication: {
      emailEnabled: parseOptionalBoolean(env, 'AUTH_EMAIL_ENABLED', true),
      googleEnabled: parseOptionalBoolean(env, 'AUTH_GOOGLE_ENABLED', false)
    },
    community: {
      enabled: parseOptionalBoolean(env, 'COMMUNITY_ENABLED', true),
      operatorConfigured: parseOptionalBoolean(
        env,
        'COMMUNITY_OPERATOR_CONFIGURED',
        localDefaults
      )
    },
    practitioner: {
      enabled: parseOptionalBoolean(env, 'PRACTITIONER_ENABLED', true),
      operatorConfigured: parseOptionalBoolean(
        env,
        'PRACTITIONER_OPERATOR_CONFIGURED',
        localDefaults
      )
    },
    rateLimiting: {
      authority: parseRateLimitAuthority(env),
      singleReplicaConfirmed: parseOptionalBoolean(
        env,
        'NATALNODE_SINGLE_REPLICA_CONFIRMED',
        runtimeMode !== 'production'
      )
    },
    observability: {
      durableSinkConfigured: parseOptionalBoolean(
        env,
        'NATALNODE_OBSERVABILITY_DURABLE_SINK_CONFIGURED',
        false
      )
    },
    privacyAccessAuditRequired: parseOptionalBoolean(
      env,
      'NATALNODE_PRIVACY_ACCESS_AUDIT_REQUIRED',
      runtimeMode !== 'local'
    )
  };
}
