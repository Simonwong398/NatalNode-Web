import {
  ACCOUNT_DATA_EXPORT_SCHEMA_VERSION,
  type AccountDataExportChartMetadata,
  type AccountDataExportFeedback,
  type AccountDataExportIdentity,
  type AccountDataExportNote,
  type AccountDataExportNotifications
} from '../account/account-data-export.js';
import type {
  AccountDataExportCursor,
  AccountDataExportPage,
  AccountDataExportSnapshot
} from '../persistence/index.js';
import { awaitAccountExportOperation } from './account-export-lifecycle.js';

const STREAM_STOPPED_ERROR = new Error('Account export stream stopped.');

export interface AccountExportStreamOptions {
  readonly snapshot: AccountDataExportSnapshot;
  readonly initialIdentityPage: AccountDataExportPage<AccountDataExportIdentity>;
  readonly initialNotificationData: AccountDataExportNotifications;
  readonly exportedAt: string;
  readonly signal: AbortSignal;
  readonly onSuccess: () => Promise<void>;
  readonly onFailure: () => Promise<void>;
  readonly onCancel: () => void;
  readonly onClosed: () => void;
}

export function serializeAccountExportValue(value: unknown): string {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new Error('Account export value is not JSON serializable.');
  }

  return serialized;
}

export function validateAccountExportInitialRepresentation(
  snapshot: AccountDataExportSnapshot,
  initialIdentityPage: AccountDataExportPage<AccountDataExportIdentity>,
  exportedAt: string,
  notificationData: AccountDataExportNotifications
): void {
  serializeAccountExportValue(ACCOUNT_DATA_EXPORT_SCHEMA_VERSION);
  serializeAccountExportValue(exportedAt);
  serializeAccountExportValue(snapshot.account.createdAt);
  serializeAccountExportValue(snapshot.account.updatedAt);

  for (const identity of initialIdentityPage.items) {
    serializeAccountExportValue(identity);
  }

  serializeAccountExportValue(notificationData);
}

function assertStreamActive(signal: AbortSignal): void {
  if (signal.aborted) {
    throw STREAM_STOPPED_ERROR;
  }
}

function serializeChartStart(chart: AccountDataExportChartMetadata): string {
  return (
    '{"displayName":' +
    serializeAccountExportValue(chart.displayName) +
    ',"category":' +
    serializeAccountExportValue(chart.category) +
    ',"tags":' +
    serializeAccountExportValue(chart.tags) +
    ',"favorite":' +
    serializeAccountExportValue(chart.favorite) +
    ',"normalizedChartRequest":' +
    serializeAccountExportValue(chart.normalizedChartRequest) +
    ',"canonicalChartResult":' +
    serializeAccountExportValue(chart.canonicalChartResult) +
    ',"calculation":' +
    serializeAccountExportValue(chart.calculation) +
    ',"createdAt":' +
    serializeAccountExportValue(chart.createdAt) +
    ',"updatedAt":' +
    serializeAccountExportValue(chart.updatedAt) +
    ',"notes":['
  );
}

async function* accountExportChunks(
  options: AccountExportStreamOptions
): AsyncGenerator<string> {
  const { snapshot, signal } = options;
  const serialize = serializeAccountExportValue;

  yield (
    '{"exportSchemaVersion":' +
    serialize(ACCOUNT_DATA_EXPORT_SCHEMA_VERSION) +
    ',"exportedAt":' +
    serialize(options.exportedAt) +
    ',"account":{"createdAt":' +
    serialize(snapshot.account.createdAt) +
    ',"updatedAt":' +
    serialize(snapshot.account.updatedAt) +
    ',"identities":['
  );

  let first = true;
  let identityPage = options.initialIdentityPage;

  while (true) {
    for (const identity of identityPage.items) {
      assertStreamActive(signal);
      yield (first ? '' : ',') + serialize(identity);
      first = false;
    }

    const nextIdentityCursor = identityPage.nextCursor;

    if (nextIdentityCursor === null) {
      break;
    }

    assertStreamActive(signal);
    identityPage = await awaitAccountExportOperation(
      () => snapshot.listIdentities(nextIdentityCursor),
      signal
    );
  }

  yield ']},"charts":[';
  first = true;
  let chartCursor: AccountDataExportCursor | undefined;

  while (true) {
    assertStreamActive(signal);
    const chartPage = await awaitAccountExportOperation(
      () => snapshot.listCharts(chartCursor),
      signal
    );

    for (const chartItem of chartPage.items) {
      assertStreamActive(signal);
      yield (first ? '' : ',') + serializeChartStart(chartItem.chart);
      first = false;

      let noteFirst = true;
      let noteCursor: AccountDataExportCursor | undefined;

      while (true) {
        assertStreamActive(signal);
        const notePage = await awaitAccountExportOperation(
          () => chartItem.listNotes(noteCursor),
          signal
        );

        for (const note of notePage.items) {
          assertStreamActive(signal);
          yield (noteFirst ? '' : ',') + serialize(note);
          noteFirst = false;
        }

        if (notePage.nextCursor === null) {
          break;
        }

        noteCursor = notePage.nextCursor;
      }

      yield ']}'
    }

    if (chartPage.nextCursor === null) {
      break;
    }

    chartCursor = chartPage.nextCursor;
  }

  yield '],"feedback":[';
  first = true;
  let feedbackCursor: AccountDataExportCursor | undefined;

  while (true) {
    assertStreamActive(signal);
    const feedbackPage = await awaitAccountExportOperation(
      () => snapshot.listFeedback(feedbackCursor),
      signal
    );

    for (const feedback of feedbackPage.items) {
      assertStreamActive(signal);
      yield (first ? '' : ',') + serialize(feedback);
      first = false;
    }

    if (feedbackPage.nextCursor === null) {
      break;
    }

    feedbackCursor = feedbackPage.nextCursor;
  }

  assertStreamActive(signal);
  await options.onSuccess();
  assertStreamActive(signal);
  yield (
    '],"notifications":' +
    serialize(options.initialNotificationData) +
    '}'
  );
}

export function createAccountExportStream(
  options: AccountExportStreamOptions
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = accountExportChunks(options);
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  let streamEnded = false;
  let failurePromise: Promise<void> | undefined;
  let abortListenerRemoved = false;
  let closedCallbackCalled = false;

  const removeAbortListener = () => {
    if (abortListenerRemoved) {
      return;
    }

    abortListenerRemoved = true;
    options.signal.removeEventListener('abort', abortListener);
  };

  const notifyClosed = () => {
    if (closedCallbackCalled) {
      return;
    }

    closedCallbackCalled = true;
    removeAbortListener();

    try {
      options.onClosed();
    } catch (_error) {
      // Lifecycle disposal is idempotent and cannot change stream semantics.
    }
  };

  const closeController = () => {
    if (controller === undefined) {
      return;
    }

    try {
      controller.close();
    } catch (_error) {
      // The stream may already be closed or cancelled.
    }
  };

  const fail = (): Promise<void> => {
    if (failurePromise === undefined) {
      failurePromise = (async () => {
        try {
          await options.onFailure();
        } catch (_error) {
          // The body is already failed; cleanup remains best effort and bounded.
        } finally {
          notifyClosed();
        }
      })();
    }

    return failurePromise;
  };

  const abortListener = () => {
    streamEnded = true;
    void fail().then(closeController, closeController);
  };

  options.signal.addEventListener('abort', abortListener, { once: true });

  return new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;

      if (options.signal.aborted) {
        abortListener();
      }
    },
    async pull(streamController) {
      if (streamEnded) {
        return;
      }

      try {
        assertStreamActive(options.signal);
        const next = await iterator.next();
        assertStreamActive(options.signal);

        if (next.done) {
          streamEnded = true;
          streamController.close();
          notifyClosed();
          return;
        }

        streamController.enqueue(encoder.encode(next.value));
      } catch (_error) {
        streamEnded = true;
        await fail();
        closeController();
      }
    },
    async cancel() {
      streamEnded = true;
      options.onCancel();
      await fail();
    }
  }, { highWaterMark: 0 });
}
