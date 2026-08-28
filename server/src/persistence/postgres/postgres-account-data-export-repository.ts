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
  ACCOUNT_DATA_EXPORT_IDENTITIES_SQL,
  ACCOUNT_DATA_EXPORT_IDENTITY_PROVIDERS_SQL,
  ACCOUNT_DATA_EXPORT_NOTES_SQL,
  ACCOUNT_DATA_EXPORT_ROLLBACK_SQL
} from './account-data-export-queries.js';
import type {
  AccountDataExportChartPageItem,
  AccountDataExportCursor,
  AccountDataExportPage,
  AccountDataExportRepository,
  AccountDataExportSnapshot,
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

class PostgresAccountDataExportSnapshot implements AccountDataExportSnapshot {
  private state: 'open' | 'committed' | 'rolled-back' | 'failed' = 'open';
  private terminalPromise: Promise<void> | undefined;

  public constructor(
    private readonly client: PoolClient,
    private readonly executor: PostgresClientSqlExecutor,
    private readonly userId: string,
    public readonly account: AccountDataExportAccountMetadata
  ) {}

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

    try {
      return await operation();
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
      this.state = 'committed';
      this.client.release();
    } catch (error) {
      this.state = 'failed';

      try {
        this.client.release(true);
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
      this.client.release();
    } catch (error) {
      this.state = 'failed';

      try {
        this.client.release(true);
      } catch (releaseError) {
        throw new AggregateError(
          [error, releaseError],
          'Account export snapshot rollback and client cleanup both failed.'
        );
      }

      throw error;
    }
  }
}

export class PostgresAccountDataExportRepository
  implements AccountDataExportRepository
{
  public constructor(private readonly pool: Pool) {}

  public async openSnapshot(
    userId: string
  ): Promise<AccountDataExportSnapshotOpenResult> {
    let client: PoolClient | undefined;
    let transactionStarted = false;

    try {
      client = await this.pool.connect();
      const executor = new PostgresClientSqlExecutor(client);

      await client.query(ACCOUNT_DATA_EXPORT_BEGIN_SQL);
      transactionStarted = true;

      const accountResult = await executor.query<AccountDataExportUserRow>(
        ACCOUNT_DATA_EXPORT_ACCOUNT_SQL,
        [userId]
      );
      const accountRow = accountResult.rows[0];

      if (accountRow === undefined) {
        await client.query(ACCOUNT_DATA_EXPORT_COMMIT_SQL);
        client.release();
        return { outcome: 'account-not-found' };
      }

      const providerResult =
        await executor.query<AccountDataExportProviderRow>(
          ACCOUNT_DATA_EXPORT_IDENTITY_PROVIDERS_SQL,
          [userId]
        );

      for (const providerRow of providerResult.rows) {
        if (providerRow.provider !== 'EMAIL_MAGIC_LINK') {
          throw new UnsupportedAccountDataExportIdentityError(
            providerRow.provider
          );
        }
      }

      const snapshot = new PostgresAccountDataExportSnapshot(
        client,
        executor,
        userId,
        presentAccountDataExportAccount({
          createdAt: toTimestampString(accountRow.created_at),
          updatedAt: toTimestampString(accountRow.updated_at)
        })
      );
      client = undefined;
      transactionStarted = false;

      return { outcome: 'opened', snapshot };
    } catch (error) {
      if (client !== undefined) {
        await cleanupAfterOpenFailure(client, transactionStarted, error);
      }

      throw error;
    }
  }
}

async function cleanupAfterOpenFailure(
  client: PoolClient,
  transactionStarted: boolean,
  originalError: unknown
): Promise<never> {
  const cleanupErrors: unknown[] = [];

  if (transactionStarted) {
    try {
      await client.query(ACCOUNT_DATA_EXPORT_ROLLBACK_SQL);
    } catch (rollbackError) {
      cleanupErrors.push(rollbackError);
    }
  }

  try {
    client.release(!transactionStarted || cleanupErrors.length > 0);
  } catch (releaseError) {
    cleanupErrors.push(releaseError);
  }

  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      [originalError, ...cleanupErrors],
      'Account export snapshot setup and client cleanup both failed.'
    );
  }

  throw originalError;
}
