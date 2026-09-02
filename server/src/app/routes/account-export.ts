import type { Hono } from 'hono';
import {
  isRecentAccountExportAuthentication
} from '../../account/account-export-policy.js';
import type { AccountDataExportSnapshot } from '../../persistence/index.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  createAccountExportDeadline,
  awaitAccountExportOperation,
  type AccountExportDeadline
} from '../account-export-lifecycle.js';
import {
  createAccountExportStream,
  validateAccountExportInitialRepresentation
} from '../account-export-stream.js';
import {
  enforceAccountExportAccountRateLimit,
  enforceAccountExportPrepareRateLimit,
  type InMemoryP0StagingRateLimiter
} from '../security/api-rate-limiting.js';
import {
  InMemoryAccountExportCapacity,
  type AccountExportCapacityLease
} from '../security/account-export-capacity.js';
import { validateEmptyAccountExportRequest } from '../validation/account-export.js';

export interface AccountExportRouteOptions {
  readonly capacity?: InMemoryAccountExportCapacity;
  readonly lifecycleDeadlineMs?: number;
  readonly monotonicNow?: () => number;
}

function exportDate(exportedAt: string): string {
  const timestamp = Date.parse(exportedAt);
  const normalizedTimestamp = Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : null;

  if (normalizedTimestamp !== exportedAt) {
    throw new Error('Server export timestamp is invalid.');
  }

  return normalizedTimestamp.slice(0, 10);
}

function responseHeaders(exportedAt: string): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition':
      `attachment; filename="natalnode-data-export-${exportDate(exportedAt)}.json"`,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
}

function isSafeConnectionTimeout(value: number | undefined): boolean {
  return (
    value !== undefined && Number.isSafeInteger(value) && value > 0
  );
}

async function safelyRollback(
  snapshot: AccountDataExportSnapshot | undefined,
  committed: () => boolean,
  releaseLease: () => void,
  deadline: AccountExportDeadline
): Promise<void> {
  try {
    if (snapshot !== undefined && !committed()) {
      await snapshot.rollback();
    }
  } catch (_error) {
    // The repository owns poisoned-client disposal; the HTTP error stays bounded.
  } finally {
    releaseLease();
    deadline.dispose();
  }
}

export function registerAccountExportRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: InMemoryP0StagingRateLimiter,
  options: AccountExportRouteOptions = {}
): void {
  const capacity = options.capacity ?? new InMemoryAccountExportCapacity();

  app.post(
    '/api/account/export/prepare',
    enforceAccountExportPrepareRateLimit(rateLimiter),
    requireAuthentication(
      dependencies.authenticator,
      (context) =>
        createProblemDetailsContextResponse(context, {
          code: 'UNAUTHORIZED',
          detailKey: 'AUTHENTICATION_REQUIRED'
        })
    ),
    async (context) => {
      const deadline = createAccountExportDeadline({
        deadlineMs: options.lifecycleDeadlineMs,
        monotonicNow: options.monotonicNow,
        requestSignal: context.req.raw.signal
      });

      try {
        const principal = context.get('authenticatedPrincipal');

        if (
          !isRecentAccountExportAuthentication(
            principal.sessionCreatedAt,
            dependencies.clock.now()
          )
        ) {
          return createProblemDetailsContextResponse(context, {
            code: 'RECENT_AUTHENTICATION_REQUIRED',
            detailKey: 'RECENT_AUTHENTICATION_REQUIRED'
          });
        }

        const requestValidation = await validateEmptyAccountExportRequest(
          context.req.raw,
          deadline.signal
        );

        if (
          requestValidation.outcome === 'aborted' ||
          deadline.signal.aborted ||
          deadline.remainingMs() <= 0
        ) {
          return createProblemDetailsContextResponse(context, {
            code: 'INTERNAL_ERROR',
            detailKey: 'INTERNAL_ERROR'
          });
        }

        if (requestValidation.outcome === 'invalid') {
          return createProblemDetailsContextResponse(context, {
            code: 'INVALID_REQUEST',
            detailKey: 'INVALID_REQUEST'
          });
        }

        return context.body(null, 204);
      } catch (_error) {
        return createProblemDetailsContextResponse(context, {
          code: 'INTERNAL_ERROR',
          detailKey: 'INTERNAL_ERROR'
        });
      } finally {
        deadline.dispose();
      }
    }
  );

  app.post(
    '/api/account/export',
    requireAuthentication(
      dependencies.authenticator,
      (context) =>
        createProblemDetailsContextResponse(context, {
          code: 'UNAUTHORIZED',
          detailKey: 'AUTHENTICATION_REQUIRED'
        })
    ),
    enforceAccountExportAccountRateLimit(rateLimiter),
    async (context) => {
      const deadline = createAccountExportDeadline({
        deadlineMs: options.lifecycleDeadlineMs,
        monotonicNow: options.monotonicNow,
        requestSignal: context.req.raw.signal
      });
      let snapshot: AccountDataExportSnapshot | undefined;
      let capacityLease: AccountExportCapacityLease | undefined;
      let committed = false;
      let cleanupPromise: Promise<void> | undefined;

      const releaseLease = () => {
        const currentLease = capacityLease;
        capacityLease = undefined;
        currentLease?.release();
      };

      const cleanupFailure = (): Promise<void> => {
        if (cleanupPromise === undefined) {
          cleanupPromise = safelyRollback(
            snapshot,
            () => committed,
            releaseLease,
            deadline
          );
        }

        return cleanupPromise;
      };

      const cleanupSuccess = async (): Promise<void> => {
        if (cleanupPromise !== undefined) {
          return cleanupPromise;
        }

        cleanupPromise = (async () => {
          try {
            if (deadline.signal.aborted || deadline.deadlineExceeded()) {
              throw new Error('Account export lifecycle deadline exceeded.');
            }

            if (snapshot !== undefined) {
              await snapshot.commit();
              committed = true;
            }
          } finally {
            releaseLease();
          }
        })();

        return cleanupPromise;
      };

      const internalError = async (): Promise<Response> => {
        await cleanupFailure();
        return createProblemDetailsContextResponse(context, {
          code: 'INTERNAL_ERROR',
          detailKey: 'INTERNAL_ERROR'
        });
      };

      try {
        const principal = context.get('authenticatedPrincipal');

        if (
          !isRecentAccountExportAuthentication(
            principal.sessionCreatedAt,
            dependencies.clock.now()
          )
        ) {
          deadline.dispose();
          return createProblemDetailsContextResponse(context, {
            code: 'RECENT_AUTHENTICATION_REQUIRED',
            detailKey: 'RECENT_AUTHENTICATION_REQUIRED'
          });
        }

        const requestValidation = await validateEmptyAccountExportRequest(
          context.req.raw,
          deadline.signal
        );

        if (requestValidation.outcome === 'aborted') {
          return internalError();
        }

        if (requestValidation.outcome === 'invalid') {
          deadline.dispose();
          return createProblemDetailsContextResponse(context, {
            code: 'INVALID_REQUEST',
            detailKey: 'INVALID_REQUEST'
          });
        }

        if (deadline.signal.aborted || deadline.remainingMs() <= 0) {
          return internalError();
        }

        const capacityDecision = capacity.tryAcquire(principal.userId);

        if (!capacityDecision.allowed) {
          deadline.dispose();
          context.header(
            'Retry-After',
            capacityDecision.retryAfterSeconds.toString()
          );
          return createProblemDetailsContextResponse(context, {
            code: 'RATE_LIMITED',
            detailKey: 'RATE_LIMITED'
          });
        }

        capacityLease = capacityDecision.lease;

        const configuredConnectionTimeout =
          dependencies.postgresConnectionTimeoutMillis;
        const remainingMs = deadline.remainingMs();

        if (
          !isSafeConnectionTimeout(configuredConnectionTimeout) ||
          (configuredConnectionTimeout !== undefined &&
            remainingMs <= configuredConnectionTimeout)
        ) {
          return internalError();
        }

        const opened = await awaitAccountExportOperation(
          () =>
            dependencies.accountDataExport.openSnapshot(principal.userId, {
              signal: deadline.signal,
              timeoutMs: remainingMs
            }),
          deadline.signal
        );

        if (deadline.signal.aborted || deadline.remainingMs() <= 0) {
          return internalError();
        }

        if (opened.outcome === 'account-not-found') {
          releaseLease();
          deadline.dispose();
          return createProblemDetailsContextResponse(context, {
            code: 'UNAUTHORIZED',
            detailKey: 'AUTHENTICATION_REQUIRED'
          });
        }

        const openedSnapshot = opened.snapshot;
        snapshot = openedSnapshot;
        const exportedAt = dependencies.clock.now();
        const initialIdentityPage = await awaitAccountExportOperation(
          () => openedSnapshot.listIdentities(),
          deadline.signal
        );

        if (deadline.signal.aborted || deadline.remainingMs() <= 0) {
          return internalError();
        }

        const initialNotificationPage = await awaitAccountExportOperation(
          () => openedSnapshot.listNotifications(),
          deadline.signal
        );

        if (deadline.signal.aborted || deadline.remainingMs() <= 0) {
          return internalError();
        }

        const initialPractitioner =
          openedSnapshot.getPractitioner === undefined
            ? {
                application: null,
                profile: null,
                profileRevisions: []
              }
            : await awaitAccountExportOperation(
                () => openedSnapshot.getPractitioner!(),
                deadline.signal
              );

        if (deadline.signal.aborted || deadline.remainingMs() <= 0) {
          return internalError();
        }

        validateAccountExportInitialRepresentation(
          snapshot,
          initialIdentityPage,
          exportedAt,
          initialNotificationPage,
          initialPractitioner
        );

        if (deadline.signal.aborted) {
          return internalError();
        }

        const headers = responseHeaders(exportedAt);
        const body = createAccountExportStream({
          snapshot,
          initialIdentityPage,
          initialNotificationPage,
          initialPractitioner,
          exportedAt,
          signal: deadline.signal,
          onSuccess: cleanupSuccess,
          onFailure: cleanupFailure,
          onCancel: deadline.abort,
          onClosed: deadline.dispose
        });

        return context.newResponse(body, 200, headers);
      } catch (_error) {
        return internalError();
      }
    }
  );
}
