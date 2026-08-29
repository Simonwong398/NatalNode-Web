import { createHmac, randomBytes } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import type { AuthenticatedRequestEnv } from '../auth/authenticated-context.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import { resolveRateLimitClientIdentity } from './trusted-edge-client-identity.js';

export interface RateLimitPolicy {
  readonly identifier: string;
  readonly limit: number;
  readonly windowMs: number;
}

/** Centralized P0 staging defaults, not production traffic/SLA policy. */
export const P0_STAGING_RATE_LIMIT_POLICIES = {
  authEmailRequest: {
    identifier: 'AUTH_EMAIL_REQUEST',
    limit: 5,
    windowMs: 10 * 60 * 1_000
  },
  authEmailComplete: {
    identifier: 'AUTH_EMAIL_COMPLETE',
    limit: 10,
    windowMs: 10 * 60 * 1_000
  },
  chartCalculation: {
    identifier: 'CHART_CALCULATION',
    limit: 20,
    windowMs: 10 * 60 * 1_000
  },
  feedbackSubmissionEdge: {
    identifier: 'FEEDBACK_SUBMISSION_EDGE',
    limit: 20,
    windowMs: 10 * 60 * 1_000
  },
  feedbackSubmissionAccount: {
    identifier: 'FEEDBACK_SUBMISSION_ACCOUNT',
    limit: 5,
    windowMs: 60 * 60 * 1_000
  },
  accountExportEdge: {
    identifier: 'ACCOUNT_EXPORT_EDGE',
    limit: 20,
    windowMs: 10 * 60 * 1_000
  },
  accountExportPrepareEdge: {
    identifier: 'ACCOUNT_EXPORT_PREPARE_EDGE',
    limit: 20,
    windowMs: 10 * 60 * 1_000
  },
  accountExportAccount: {
    identifier: 'ACCOUNT_EXPORT_ACCOUNT',
    limit: 5,
    windowMs: 10 * 60 * 1_000
  },
  accountDeletion: {
    identifier: 'ACCOUNT_DELETION',
    limit: 5,
    windowMs: 10 * 60 * 1_000
  },
  vaultMutation: {
    identifier: 'VAULT_MUTATION',
    limit: 60,
    windowMs: 10 * 60 * 1_000
  }
} as const satisfies Readonly<Record<string, RateLimitPolicy>>;

export const P0_STAGING_RATE_LIMIT_MAXIMUM_TRACKED_KEYS = 10_000;
const EXPIRED_ENTRY_PRUNE_INTERVAL_MS = 60_000;

interface RateLimitEntry {
  count: number;
  readonly resetAtMs: number;
}

export type RateLimitDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

function assertPolicy(policy: RateLimitPolicy): void {
  if (
    policy.identifier.length === 0 ||
    !Number.isSafeInteger(policy.limit) ||
    policy.limit <= 0 ||
    !Number.isSafeInteger(policy.windowMs) ||
    policy.windowMs <= 0
  ) {
    throw new Error('Rate-limit policy is invalid.');
  }
}

function secondsUntil(resetAtMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((resetAtMs - nowMs) / 1_000));
}

/**
 * Process-local fixed-window limiter for P0 staging. The map contains only
 * policy identifiers and per-process HMAC keys, never raw client addresses.
 */
export class InMemoryP0StagingRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly keySalt = randomBytes(32);
  private nextPruneAtMs = 0;

  public constructor(
    private readonly maximumTrackedKeys = P0_STAGING_RATE_LIMIT_MAXIMUM_TRACKED_KEYS,
    private readonly pruneIntervalMs = EXPIRED_ENTRY_PRUNE_INTERVAL_MS
  ) {
    if (!Number.isSafeInteger(maximumTrackedKeys) || maximumTrackedKeys <= 0) {
      throw new Error('Rate-limit maximum tracked keys must be positive.');
    }

    if (!Number.isSafeInteger(pruneIntervalMs) || pruneIntervalMs <= 0) {
      throw new Error('Rate-limit prune interval must be positive.');
    }
  }

  public attempt(
    policy: RateLimitPolicy,
    clientIdentity: string,
    nowMs: number = Date.now()
  ): RateLimitDecision {
    assertPolicy(policy);

    if (!Number.isFinite(nowMs)) {
      throw new Error('Rate-limit clock value is invalid.');
    }

    if (nowMs >= this.nextPruneAtMs) {
      this.pruneExpired(nowMs);
      this.nextPruneAtMs = nowMs + this.pruneIntervalMs;
    }

    const key = this.deriveKey(policy.identifier, clientIdentity);
    const existing = this.entries.get(key);

    if (existing !== undefined && nowMs < existing.resetAtMs) {
      if (existing.count >= policy.limit) {
        return {
          allowed: false,
          retryAfterSeconds: secondsUntil(existing.resetAtMs, nowMs)
        };
      }

      existing.count += 1;
      return { allowed: true };
    }

    if (existing !== undefined) {
      this.entries.delete(key);
    }

    if (this.entries.size >= this.maximumTrackedKeys) {
      this.pruneExpired(nowMs);
    }

    if (this.entries.size >= this.maximumTrackedKeys) {
      return {
        allowed: false,
        retryAfterSeconds: this.capacityRetryAfterSeconds(nowMs)
      };
    }

    this.entries.set(key, {
      count: 1,
      resetAtMs: nowMs + policy.windowMs
    });

    return { allowed: true };
  }

  private deriveKey(policyIdentifier: string, clientIdentity: string): string {
    const clientKey = createHmac('sha256', this.keySalt)
      .update(clientIdentity, 'utf8')
      .digest('hex');

    return `${policyIdentifier}:${clientKey}`;
  }

  private pruneExpired(nowMs: number): void {
    for (const [key, entry] of this.entries) {
      if (nowMs >= entry.resetAtMs) {
        this.entries.delete(key);
      }
    }
  }

  private capacityRetryAfterSeconds(nowMs: number): number {
    let earliestResetAtMs = Number.POSITIVE_INFINITY;

    for (const entry of this.entries.values()) {
      earliestResetAtMs = Math.min(earliestResetAtMs, entry.resetAtMs);
    }

    return Number.isFinite(earliestResetAtMs)
      ? secondsUntil(earliestResetAtMs, nowMs)
      : 1;
  }
}

function isVaultMutation(method: string, pathname: string): boolean {
  if (pathname === '/api/vault/charts') {
    return method === 'POST';
  }

  if (/^\/api\/vault\/charts\/[^/]+$/u.test(pathname)) {
    return method === 'PATCH' || method === 'DELETE';
  }

  if (/^\/api\/vault\/charts\/[^/]+\/duplicate$/u.test(pathname)) {
    return method === 'POST';
  }

  if (/^\/api\/vault\/charts\/[^/]+\/notes$/u.test(pathname)) {
    return method === 'POST';
  }

  if (/^\/api\/vault\/charts\/[^/]+\/notes\/[^/]+$/u.test(pathname)) {
    return method === 'PATCH' || method === 'DELETE';
  }

  return false;
}

export function selectP0StagingRateLimitPolicy(
  method: string,
  pathname: string
): RateLimitPolicy | null {
  if (method === 'POST' && pathname === '/api/auth/email/request') {
    return P0_STAGING_RATE_LIMIT_POLICIES.authEmailRequest;
  }

  if (method === 'POST' && pathname === '/api/auth/email/complete') {
    return P0_STAGING_RATE_LIMIT_POLICIES.authEmailComplete;
  }

  if (method === 'POST' && pathname === '/api/auth/google/start') {
    return P0_STAGING_RATE_LIMIT_POLICIES.authEmailRequest;
  }

  if (method === 'GET' && pathname === '/api/auth/google/callback') {
    return P0_STAGING_RATE_LIMIT_POLICIES.authEmailComplete;
  }

  if (method === 'POST' && pathname === '/api/chart') {
    return P0_STAGING_RATE_LIMIT_POLICIES.chartCalculation;
  }

  if (method === 'POST' && pathname === '/api/feedback') {
    return P0_STAGING_RATE_LIMIT_POLICIES.feedbackSubmissionEdge;
  }

  if (method === 'POST' && pathname === '/api/account/export') {
    return P0_STAGING_RATE_LIMIT_POLICIES.accountExportEdge;
  }

  if (method === 'DELETE' && pathname === '/api/account') {
    return P0_STAGING_RATE_LIMIT_POLICIES.accountDeletion;
  }

  return isVaultMutation(method, pathname)
    ? P0_STAGING_RATE_LIMIT_POLICIES.vaultMutation
    : null;
}

export function enforceP0StagingRateLimits(
  limiter: InMemoryP0StagingRateLimiter
): MiddlewareHandler {
  return async (context, next) => {
    const policy = selectP0StagingRateLimitPolicy(
      context.req.raw.method,
      context.req.path
    );

    if (policy === null) {
      await next();
      return;
    }

    const clientIdentity = resolveRateLimitClientIdentity(
      context.req.raw.headers
    );
    const decision = limiter.attempt(policy, clientIdentity);

    if (!decision.allowed) {
      context.header('Retry-After', decision.retryAfterSeconds.toString());
      return createProblemDetailsContextResponse(context, {
        code: 'RATE_LIMITED'
      });
    }

    await next();
  };
}

export function enforceFeedbackAccountRateLimit(
  limiter: InMemoryP0StagingRateLimiter
): MiddlewareHandler<AuthenticatedRequestEnv> {
  return async (context, next) => {
    const principal = context.get('authenticatedPrincipal');
    const decision = limiter.attempt(
      P0_STAGING_RATE_LIMIT_POLICIES.feedbackSubmissionAccount,
      principal.userId
    );

    if (!decision.allowed) {
      context.header('Retry-After', decision.retryAfterSeconds.toString());
      return createProblemDetailsContextResponse(context, {
        code: 'RATE_LIMITED'
      });
    }

    await next();
  };
}

export function enforceAccountExportAccountRateLimit(
  limiter: InMemoryP0StagingRateLimiter
): MiddlewareHandler<AuthenticatedRequestEnv> {
  return async (context, next) => {
    const principal = context.get('authenticatedPrincipal');
    const decision = limiter.attempt(
      P0_STAGING_RATE_LIMIT_POLICIES.accountExportAccount,
      principal.userId
    );

    if (!decision.allowed) {
      context.header('Retry-After', decision.retryAfterSeconds.toString());
      return createProblemDetailsContextResponse(context, {
        code: 'RATE_LIMITED',
        detailKey: 'RATE_LIMITED'
      });
    }

    await next();
  };
}

export function enforceAccountExportPrepareRateLimit(
  limiter: InMemoryP0StagingRateLimiter
): MiddlewareHandler {
  return async (context, next) => {
    const clientIdentity = resolveRateLimitClientIdentity(
      context.req.raw.headers
    );
    const decision = limiter.attempt(
      P0_STAGING_RATE_LIMIT_POLICIES.accountExportPrepareEdge,
      clientIdentity
    );

    if (!decision.allowed) {
      context.header('Retry-After', decision.retryAfterSeconds.toString());
      return createProblemDetailsContextResponse(context, {
        code: 'RATE_LIMITED',
        detailKey: 'RATE_LIMITED'
      });
    }

    await next();
  };
}
