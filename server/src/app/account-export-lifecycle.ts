import { performance } from 'node:perf_hooks';

export const ACCOUNT_EXPORT_LIFECYCLE_DEADLINE_MS = 120_000;

export interface AccountExportDeadlineOptions {
  readonly deadlineMs?: number;
  readonly monotonicNow?: () => number;
  readonly requestSignal?: AbortSignal;
}

export interface AccountExportDeadline {
  readonly signal: AbortSignal;
  readonly deadlineExceeded: () => boolean;
  readonly remainingMs: () => number;
  abort(): void;
  dispose(): void;
}

class AccountExportOperationAbortedError extends Error {
  public constructor() {
    super('Account export operation was cancelled.');
    this.name = 'AccountExportOperationAbortedError';
  }
}

/** Races non-signal-aware repository calls against the shared lifecycle. */
export async function awaitAccountExportOperation<Result>(
  operation: () => Promise<Result>,
  signal: AbortSignal
): Promise<Result> {
  if (signal.aborted) {
    throw new AccountExportOperationAbortedError();
  }

  const operationPromise = operation();
  let abortHandler: (() => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    abortHandler = () => reject(new AccountExportOperationAbortedError());
    signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    return await Promise.race([operationPromise, abortPromise]);
  } catch (error) {
    if (signal.aborted) {
      void operationPromise.catch(() => undefined);
    }

    throw error;
  } finally {
    if (abortHandler !== undefined) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
}

function assertDeadlineMs(deadlineMs: number): void {
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0) {
    throw new Error('Account export lifecycle deadline must be positive.');
  }
}

/** Owns the monotonic timer and request-abort bridge for one export attempt. */
export function createAccountExportDeadline(
  options: AccountExportDeadlineOptions = {}
): AccountExportDeadline {
  const deadlineMs = options.deadlineMs ?? ACCOUNT_EXPORT_LIFECYCLE_DEADLINE_MS;
  const monotonicNow = options.monotonicNow ?? (() => performance.now());
  assertDeadlineMs(deadlineMs);

  const startedAt = monotonicNow();

  if (!Number.isFinite(startedAt)) {
    throw new Error('Account export monotonic clock is invalid.');
  }

  const deadlineAt = startedAt + deadlineMs;
  const controller = new AbortController();
  let deadlineReached = false;
  let disposed = false;
  let requestAbortHandler: (() => void) | undefined;

  const timer = setTimeout(() => {
    deadlineReached = true;
    controller.abort();
  }, deadlineMs);
  timer.unref?.();

  const requestSignal = options.requestSignal;

  if (requestSignal !== undefined) {
    requestAbortHandler = () => controller.abort();

    if (requestSignal.aborted) {
      controller.abort();
    } else {
      requestSignal.addEventListener('abort', requestAbortHandler, {
        once: true
      });
    }
  }

  return {
    signal: controller.signal,
    deadlineExceeded: () =>
      deadlineReached || monotonicNow() >= deadlineAt,
    remainingMs: () =>
      Math.max(0, Math.floor(deadlineAt - monotonicNow())),
    abort: () => controller.abort(),
    dispose: () => {
      if (disposed) {
        return;
      }

      disposed = true;
      clearTimeout(timer);

      if (requestSignal !== undefined && requestAbortHandler !== undefined) {
        requestSignal.removeEventListener('abort', requestAbortHandler);
      }
    }
  };
}
