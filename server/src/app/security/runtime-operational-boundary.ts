import type { MiddlewareHandler } from 'hono';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import type { RateLimitAuthority } from './api-rate-limiting.js';

export type OperationalSurface = 'community' | 'practitioner';

function surfaceIsAvailable(
  dependencies: ServerDependencies,
  surface: OperationalSurface
): boolean {
  const config = dependencies.operationalConfig;

  if (config === undefined) {
    // Existing in-memory and public-development compositions deliberately
    // have no deployment claims and retain their prior route behavior.
    return true;
  }

  const surfaceConfig = config[surface];
  return surfaceConfig.enabled && surfaceConfig.operatorConfigured;
}

/** Fail closed when an operationally gated surface has no approved operator. */
export function enforceOperationalSurface(
  dependencies: ServerDependencies,
  surface: OperationalSurface
): MiddlewareHandler {
  return async (context, next) => {
    if (!surfaceIsAvailable(dependencies, surface)) {
      return createProblemDetailsContextResponse(context, {
        code: 'OPERATIONAL_SURFACE_UNAVAILABLE'
      });
    }

    await next();
  };
}

/**
 * Checks the small provider-neutral production invariants at composition
 * time. A production process must not start while it can only make staging
 * or local safety claims.
 */
export function assertRuntimeOperationalBoundary(
  dependencies: ServerDependencies,
  rateLimiter: RateLimitAuthority,
  observabilitySinkPresent: boolean
): void {
  const config = dependencies.operationalConfig;

  if (config === undefined) {
    return;
  }

  if (config.rateLimiting.authority !== rateLimiter.kind) {
    throw new Error('Configured rate-limit authority does not match the runtime.');
  }

  if (
    rateLimiter.kind === 'process-local' &&
    !config.rateLimiting.singleReplicaConfirmed
  ) {
    throw new Error(
      'Process-local rate limiting requires explicit single-replica confirmation.'
    );
  }

  if (
    config.authentication.googleEnabled &&
    (dependencies.googleOidcProvider === undefined ||
      dependencies.googleOAuthTransactionService === undefined ||
      dependencies.googleAuthAccountSessionLifecycle === undefined)
  ) {
    throw new Error(
      'Enabled Google authentication requires a complete server binding.'
    );
  }

  if (config.runtimeMode !== 'production') {
    return;
  }

  if (
    config.rateLimiting.authority !== 'distributed' ||
    rateLimiter.kind !== 'distributed'
  ) {
    throw new Error(
      'Production runtime requires a distributed rate-limit authority.'
    );
  }

  if (!config.authentication.emailEnabled || !config.authentication.googleEnabled) {
    throw new Error(
      'Production runtime requires both configured authentication providers.'
    );
  }

  if (!config.observability.durableSinkConfigured || !observabilitySinkPresent) {
    throw new Error('Production runtime requires a durable observability sink.');
  }

  if (
    config.privacyAccessAuditRequired &&
    dependencies.persistence.privacyAccessAudit === undefined
  ) {
    throw new Error('Production runtime requires the privacy access audit repository.');
  }
}
