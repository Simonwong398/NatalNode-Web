import type { Pool, PoolClient } from 'pg';
import {
  presentAccountDataExportAccount,
  presentAccountDataExportChartMetadata,
  presentAccountDataExportFeedback,
  presentAccountDataExportIdentity,
  presentAccountDataExportNote,
  UnsupportedAccountDataExportIdentityError
} from '../../account/account-data-export.js';
import type {
  AccountDataExportAccountMetadata,
  AccountDataExportChartMetadata,
  AccountDataExportFeedback,
  AccountDataExportIdentity,
  AccountDataExportNote
} from '../../account/account-data-export.js';
import { PostgresClientSqlExecutor } from './postgres-client-sql-executor.js';
import type {
  AccountDataExportChartRow,
  AccountDataExportFeedbackRow,
  AccountDataExportIdentityRow,
  AccountDataExportNoteRow,
  AccountDataExportProviderRow,
  AccountDataExportUserRow
} from './account-data-export-queries.js';
import {
  ACCOUNT_DATA_EXPORT_ACCOUNT_SQL,
  ACCOUNT_DATA_EXPORT_BEGIN_SQL,
  ACCOUNT_DATA_EXPORT_CHARTS_SQL,
  ACCOUNT_DATA_EXPORT_COMMIT_SQL,
  ACCOUNT_DATA_EXPORT_FEEDBACK_SQL,
  ACCOUNT_DATA_EXPORT_IDLE_TIMEOUT_SQL,
  ACCOUNT_DATA_EXPORT_IDENTITIES_SQL,
  ACCOUNT_DATA_EXPORT_IDENTITY_PROVIDERS_SQL,
  ACCOUNT_DATA_EXPORT_NOTES_SQL,
  ACCOUNT_DATA_EXPORT_ROLLBACK_SQL,
  ACCOUNT_DATA_EXPORT_STATEMENT_TIMEOUT_SQL
} from './account-data-export-queries.js';
import type {
  AccountDataExportChartPageItem,
  AccountDataExportCursor,
  AccountDataExportPage,
  AccountDataExportRepository,
  AccountDataExportSnapshot,
  AccountDataExportSnapshotOpenOptions,
  AccountDataExportSnapshotOpenResult
} from '../account-data-export-repository.js';

const NORMAL_PAGE_SIZE = 100;
const CHART_PAGE_SIZE = 1;

interface CursorPosition {
  readonly createdAt: string;
  readonly internalId: string;
}

function encodeCursor(position: CursorPosition): AccountDataExportCursor {
  return Buffer.from(JSON.stringify(position), 'utf8').toString(
    'base64url'
  ) as AccountDataExportCursor;
}

function decodeCursor(cursor?: AccountDataExportCursor): CursorPosition | null {
  if (cursor === undefined) {
    return null;
  }

  if (typeof cursor !== 'string' || cursor.length === 0) {
    throw new Error('Invalid account export cursor.');
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8')
    );

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      typeof (parsed as { createdAt?: unknown }).createdAt !== 'string' ||
      typeof (parsed as { internalId?: unknown }).internalId !== 'string'
    ) {
      throw new Error('Invalid cursor shape.');
    }

    return {
      createdAt: (parsed as { createdAt: string }).createdAt,
      internalId: (parsed as { internalId: string }).internalId
    };
  } catch (_error) {
    throw new Error('Invalid account export cursor.');
  }
}

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function cursorParams(cursor: CursorPosition | null): readonly unknown[] {
  return cursor === null ? [null, null] : [cursor.createdAt, cursor.internalId];
}

function createPage<Row extends { readonly created_at: Date | string }, Item>(
  rows: readonly Row[],
  pageSize: number,
  present: (row: Row) => Item,
  internalId: (row: Row) => string
): AccountDataExportPage<Item> {
  const items = rows.map(present);
  const lastRow = rows[rows.length - 1];

  return {
    items,
    nextCursor:
      rows.length === pageSize && lastRow !== undefined
        ? encodeCursor({
            createdAt: toTimestampString(lastRow.created_at),
            internalId: internalId(lastRow)
          })
        : null
  };
}

class AccountDataExportSnapshotClosedError extends Error {
  public constructor() {
    super('Account export snapshot is no longer open.');
    this.name = 'AccountDataExportSnapshotClosedError';
  }
}

class AccountDataExportSnapshotAbortedError extends Error {
  public constructor() {
    super('Account export snapshot was cancelled.');
    this.name = 'AccountDataExportSnapshotAbortedError';
  }
}

function assertSnapshotNotAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new AccountDataExportSnapshotAbortedError();
  }
}

/** Races setup queries against cancellation before the snapshot owns the client. */
async function awaitAccountDataExportOperation<Result>(
  operation: () => Promise<Result>,
  signal: AbortSignal | undefined
): Promise<Result> {
  if (signal === undefined) {
    return operation();
  }

  if (signal.aborted) {
    throw new AccountDataExportSnapshotAbortedError();
  }

  const operationPromise = operation();
  let abortHandler: (() => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    abortHandler = () => reject(new AccountDataExportSnapshotAbortedError());
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

function assertSnapshotTimeout(timeoutMs: number | undefined): void {
  if (
    timeoutMs !== undefined &&
    (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)
  ) {
    throw new Error('Account export snapshot timeout must be positive.');
  }
}

async function checkoutClient(
  pool: Pool,
  signal: AbortSignal | undefined
): Promise<PoolClient> {
  const checkoutPromise = pool.connect();

  if (signal === undefined) {
    return checkoutPromise;
  }

  if (signal.aborted) {
    void checkoutPromise.then(
      (lateClient) => {
        try {
          lateClient.release(true);
        } catch (_error) {
          // The caller already observed cancellation; late cleanup is best effort.
        }
      },
      () => undefined
    );
    throw new AccountDataExportSnapshotAbortedError();
  }

  let abortHandler: (() => void) | undefined;
  let clientDelivered = false;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    abortHandler = () => reject(new AccountDataExportSnapshotAbortedError());
    signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    const client = await Promise.race([checkoutPromise, abortPromise]);
    clientDelivered = true;

    if (abortHandler !== undefined) {
      signal.removeEventListener('abort', abortHandler);
    }

    if (signal.aborted) {
      client.release(true);
      throw new AccountDataExportSnapshotAbortedError();
    }

    return client;
  } catch (error) {
    if (abortHandler !== undefined) {
      signal.removeEventListener('abort', abortHandler);
    }

    if (!clientDelivered) {
      void checkoutPromise.then(
        (lateClient) => {
          try {
            lateClient.release(true);
          } catch (_error) {
            // The checkout lost the lifecycle race; never return it to the pool.
          }
        },
        () => undefined
      );
    }

    throw error;
  }
}

interface AccountDataExportOpenClientLease {
  readonly released: boolean;
  release(discard?: boolean): void;
  dispose(): void;
}

function createAccountDataExportOpenClientLease(
  client: PoolClient,
  signal: AbortSignal | undefined
): AccountDataExportOpenClientLease {
  let released = false;
  let abortHandler: (() => void) | undefined;

  const removeAbortHandler = () => {
    if (signal !== undefined && abortHandler !== undefined) {
      signal.removeEventListener('abort', abortHandler);
      abortHandler = undefined;
    }
  };

  const release = (discard?: boolean) => {
    if (released) {
      return;
    }

    released = true;
    removeAbortHandler();
    if (discard === undefined) {
      client.release();
    } else {
      client.release(discard);
    }
  };

  if (signal !== undefined) {
    abortHandler = () => {
      try {
        release(true);
      } catch (_error) {
        // Cancellation cleanup must not throw from an AbortSignal callback.
      }
    };
    signal.addEventListener('abort', abortHandler, { once: true });

    if (signal.aborted) {
      abortHandler();
    }
  }

  return {
    get released() {
      return released;
    },
    release,
    dispose: removeAbortHandler
  };
}

class PostgresAccountDataExportSnapshot implements AccountDataExportSnapshot {
  private state: 'open' | 'committed' | 'rolled-back' | 'failed' = 'open';
  private terminalPromise: Promise<void> | undefined;
  private clientReleased = false;
  private readonly abortHandler: (() => void) | undefined;

  public constructor(
    private readonly client: PoolClient,
    private readonly executor: PostgresClientSqlExecutor,
    private readonly userId: string,
    private readonly signal: AbortSignal | undefined,
    public readonly account: AccountDataExportAccountMetadata
  ) {
    if (signal !== undefined) {
      this.abortHandler = () => this.abortAndDiscardClient();
      signal.addEventListener('abort', this.abortHandler, { once: true });

      if (signal.aborted) {
        this.abortAndDiscardClient();
      }
    }
  }

  public listIdentities(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportIdentity>> {
    return this.read(async () => {
      const position = decodeCursor(cursor);
      const result = await this.executor.query<AccountDataExportIdentityRow>(
        ACCOUNT_DATA_EXPORT_IDENTITIES_SQL,
        [this.userId, ...cursorParams(position), NORMAL_PAGE_SIZE]
      );

      return createPage(
        result.rows,
        NORMAL_PAGE_SIZE,
        (row) =>
          presentAccountDataExportIdentity({
            provider: row.provider,
            providerSubject: row.provider_subject,
            createdAt: toTimestampString(row.created_at),
            updatedAt: toTimestampString(row.updated_at)
          }),
        (row) => row.identity_id
      );
    });
  }

  public listCharts(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportChartPageItem>> {
    return this.read(async () => {
      const position = decodeCursor(cursor);
      const result = await this.executor.query<AccountDataExportChartRow>(
        ACCOUNT_DATA_EXPORT_CHARTS_SQL,
        [this.userId, ...cursorParams(position), CHART_PAGE_SIZE]
      );

      return createPage(
        result.rows,
        CHART_PAGE_SIZE,
        (row) => ({
          chart: presentAccountDataExportChartMetadata({
            displayName: row.display_name,
            category: row.category,
            tags: row.tags,
            favorite: row.favorite,
            normalizedChartRequest: row.normalized_input,
            canonicalChartResult: row.canonical_result,
            engineVersion: row.engine_version,
            chartSchemaVersion: row.chart_schema_version,
            astronomyConfigurationId: row.astronomy_configuration_id,
            provenanceEnvelopeId: row.provenance_envelope_id,
            createdAt: toTimestampString(row.created_at),
            updatedAt: toTimestampString(row.updated_at)
          }),
          listNotes: (noteCursor?: AccountDataExportCursor) =>
            this.listNotesForChart(row.chart_id, noteCursor)
        }),
        (row) => row.chart_id
      );
    });
  }

  public listFeedback(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportFeedback>> {
    return this.read(async () => {
      const position = decodeCursor(cursor);
      const result = await this.executor.query<AccountDataExportFeedbackRow>(
        ACCOUNT_DATA_EXPORT_FEEDBACK_SQL,
        [this.userId, ...cursorParams(position), NORMAL_PAGE_SIZE]
      );

      return createPage(
        result.rows,
        NORMAL_PAGE_SIZE,
        (row) =>
          presentAccountDataExportFeedback({
            category: row.category,
            message: row.message,
            createdAt: toTimestampString(row.created_at)
          }),
        (row) => row.feedback_id
      );
    });
  }

  public commit(): Promise<void> {
    if (this.terminalPromise !== undefined) {
      return this.terminalPromise;
    }

    if (this.state !== 'open') {
      return Promise.resolve();
    }

    this.terminalPromise = this.finishCommit();
    return this.terminalPromise;
  }

  public rollback(): Promise<void> {
    if (this.terminalPromise !== undefined) {
      return this.terminalPromise;
    }

    if (this.state !== 'open') {
      return Promise.resolve();
    }

    this.terminalPromise = this.finishRollback();
    return this.terminalPromise;
  }

  private async read<Result>(operation: () => Promise<Result>): Promise<Result> {
    if (this.state !== 'open' || this.terminalPromise !== undefined) {
      throw new AccountDataExportSnapshotClosedError();
    }

    assertSnapshotNotAborted(this.signal);

    try {
      const result = await operation();
      assertSnapshotNotAborted(this.signal);
      return result;
    } catch (error) {
      try {
        await this.rollback();
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          'Account export snapshot read and rollback both failed.'
        );
      }

      throw error;
    }
  }

  private listNotesForChart(
    chartId: string,
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportNote>> {
    return this.read(async () => {
      const position = decodeCursor(cursor);
      const result = await this.executor.query<AccountDataExportNoteRow>(
        ACCOUNT_DATA_EXPORT_NOTES_SQL,
        [this.userId, chartId, ...cursorParams(position), NORMAL_PAGE_SIZE]
      );

      return createPage(
        result.rows,
        NORMAL_PAGE_SIZE,
        (row) =>
          presentAccountDataExportNote({
            content: row.content,
            createdAt: toTimestampString(row.created_at),
            updatedAt: toTimestampString(row.updated_at)
          }),
        (row) => row.note_id
      );
    });
  }

  private async finishCommit(): Promise<void> {
    try {
      await this.client.query(ACCOUNT_DATA_EXPORT_COMMIT_SQL);
      assertSnapshotNotAborted(this.signal);
      this.state = 'committed';
      this.removeAbortHandler();
      this.releaseClient();
    } catch (error) {
      this.state = 'failed';
      this.removeAbortHandler();

      try {
        this.releaseClient(true);
      } catch (releaseError) {
        throw new AggregateError(
          [error, releaseError],
          'Account export snapshot commit and client cleanup both failed.'
        );
      }

      throw error;
    }
  }

  private async finishRollback(): Promise<void> {
    try {
      await this.client.query(ACCOUNT_DATA_EXPORT_ROLLBACK_SQL);
      this.state = 'rolled-back';
      this.removeAbortHandler();
      this.releaseClient();
    } catch (error) {
      this.state = 'failed';
      this.removeAbortHandler();

      try {
        this.releaseClient(true);
      } catch (releaseError) {
        throw new AggregateError(
          [error, releaseError],
          'Account export snapshot rollback and client cleanup both failed.'
        );
      }

      throw error;
    }
  }

  private abortAndDiscardClient(): void {
    if (this.state !== 'open' || this.clientReleased) {
      return;
    }

    this.state = 'failed';
    this.removeAbortHandler();

    try {
      this.releaseClient(true);
    } catch (_error) {
      // Cancellation cleanup must not throw from an AbortSignal callback.
    }
  }

  private removeAbortHandler(): void {
    if (this.signal !== undefined && this.abortHandler !== undefined) {
      this.signal.removeEventListener('abort', this.abortHandler);
    }
  }

  private releaseClient(discard = false): void {
    if (this.clientReleased) {
      return;
    }

    this.clientReleased = true;

    if (discard) {
      this.client.release(true);
      return;
    }

    this.client.release();
  }
}

export class PostgresAccountDataExportRepository
  implements AccountDataExportRepository
{
  public constructor(private readonly pool: Pool) {}

  public async openSnapshot(
    userId: string,
    options?: AccountDataExportSnapshotOpenOptions
  ): Promise<AccountDataExportSnapshotOpenResult> {
    let client: PoolClient | undefined;
    let clientLease: AccountDataExportOpenClientLease | undefined;
    let transactionStarted = false;
    const signal = options?.signal;
    const timeoutMs = options?.timeoutMs;

    assertSnapshotTimeout(timeoutMs);
    assertSnapshotNotAborted(signal);

    try {
      client = await checkoutClient(this.pool, signal);
      const checkedOutClient = client;
      clientLease = createAccountDataExportOpenClientLease(
        checkedOutClient,
        signal
      );
      const executor = new PostgresClientSqlExecutor(checkedOutClient);

      assertSnapshotNotAborted(signal);
      await awaitAccountDataExportOperation(
        () => checkedOutClient.query(ACCOUNT_DATA_EXPORT_BEGIN_SQL),
        signal
      );
      transactionStarted = true;
      assertSnapshotNotAborted(signal);

      if (timeoutMs !== undefined) {
        const timeoutParameter = `${timeoutMs}ms`;
        await awaitAccountDataExportOperation(
          () =>
            executor.query(ACCOUNT_DATA_EXPORT_STATEMENT_TIMEOUT_SQL, [
              timeoutParameter
            ]),
          signal
        );
        assertSnapshotNotAborted(signal);
        await awaitAccountDataExportOperation(
          () =>
            executor.query(ACCOUNT_DATA_EXPORT_IDLE_TIMEOUT_SQL, [
              timeoutParameter
            ]),
          signal
        );
        assertSnapshotNotAborted(signal);
      }

      const accountResult = await awaitAccountDataExportOperation(
        () =>
          executor.query<AccountDataExportUserRow>(
            ACCOUNT_DATA_EXPORT_ACCOUNT_SQL,
            [userId]
          ),
        signal
      );
      assertSnapshotNotAborted(signal);
      const accountRow = accountResult.rows[0];

      if (accountRow === undefined) {
        assertSnapshotNotAborted(signal);
        await awaitAccountDataExportOperation(
          () => checkedOutClient.query(ACCOUNT_DATA_EXPORT_COMMIT_SQL),
          signal
        );
        assertSnapshotNotAborted(signal);
        clientLease.release();
        clientLease = undefined;
        client = undefined;
        return { outcome: 'account-not-found' };
      }

      const providerResult = await awaitAccountDataExportOperation(
        () =>
          executor.query<AccountDataExportProviderRow>(
            ACCOUNT_DATA_EXPORT_IDENTITY_PROVIDERS_SQL,
            [userId]
          ),
        signal
      );
      assertSnapshotNotAborted(signal);

      for (const providerRow of providerResult.rows) {
        if (
          providerRow.provider !== 'EMAIL_MAGIC_LINK' &&
          providerRow.provider !== 'GOOGLE'
        ) {
          throw new UnsupportedAccountDataExportIdentityError(
            providerRow.provider
          );
        }
      }

      const snapshot = new PostgresAccountDataExportSnapshot(
        checkedOutClient,
        executor,
        userId,
        signal,
        presentAccountDataExportAccount({
          createdAt: toTimestampString(accountRow.created_at),
          updatedAt: toTimestampString(accountRow.updated_at)
        })
      );
      clientLease.dispose();
      clientLease = undefined;
      client = undefined;
      transactionStarted = false;

      return { outcome: 'opened', snapshot };
    } catch (error) {
      if (client !== undefined) {
        await cleanupAfterOpenFailure(
          client,
          transactionStarted,
          error,
          clientLease
        );
      } else {
        clientLease?.dispose();
      }

      throw error;
    }
  }
}

async function cleanupAfterOpenFailure(
  client: PoolClient,
  transactionStarted: boolean,
  originalError: unknown,
  clientLease?: AccountDataExportOpenClientLease
): Promise<never> {
  const cleanupErrors: unknown[] = [];

  if (transactionStarted && !clientLease?.released) {
    try {
      await client.query(ACCOUNT_DATA_EXPORT_ROLLBACK_SQL);
    } catch (rollbackError) {
      cleanupErrors.push(rollbackError);
    }
  }

  if (!clientLease?.released) {
    try {
      if (clientLease !== undefined) {
        clientLease.release(!transactionStarted || cleanupErrors.length > 0);
      } else {
        client.release(!transactionStarted || cleanupErrors.length > 0);
      }
    } catch (releaseError) {
      cleanupErrors.push(releaseError);
    }
  }

  clientLease?.dispose();

  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      [originalError, ...cleanupErrors],
      'Account export snapshot setup and client cleanup both failed.'
    );
  }

  throw originalError;
}
