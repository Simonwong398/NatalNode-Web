import type {
  AccountDataExportAccountMetadata,
  AccountDataExportChartMetadata,
  AccountDataExportFeedback,
  AccountDataExportIdentity,
  AccountDataExportNote,
  AccountDataExportNotificationCategoryPreference,
  AccountDataExportNotificationChannelPreference,
  AccountDataExportNotificationPushSubscription,
  AccountDataExportPractitioner
} from '../account/account-data-export.js';

declare const accountDataExportCursorBrand: unique symbol;

/** Opaque continuation position owned by the account-export repository. */
export type AccountDataExportCursor = string & {
  readonly [accountDataExportCursorBrand]: true;
};

export interface AccountDataExportPage<Item> {
  readonly items: readonly Item[];
  readonly nextCursor: AccountDataExportCursor | null;
}

export interface AccountDataExportNotificationsPage {
  readonly channelPreferences: readonly AccountDataExportNotificationChannelPreference[];
  readonly categoryPreferences: readonly AccountDataExportNotificationCategoryPreference[];
  readonly pushSubscriptions: AccountDataExportPage<AccountDataExportNotificationPushSubscription>;
}

export interface AccountDataExportChartPageItem {
  readonly chart: AccountDataExportChartMetadata;
  listNotes(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportNote>>;
}

export interface AccountDataExportSnapshot {
  readonly account: AccountDataExportAccountMetadata;
  listIdentities(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportIdentity>>;
  listCharts(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportChartPageItem>>;
  listFeedback(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportFeedback>>;
  /** Optional for backwards-compatible test/dry-run snapshots; PostgreSQL implements it. */
  getPractitioner?(): Promise<AccountDataExportPractitioner>;
  listNotifications(): Promise<AccountDataExportNotificationsPage>;
  listNotificationPushSubscriptions(
    cursor?: AccountDataExportCursor
  ): Promise<AccountDataExportPage<AccountDataExportNotificationPushSubscription>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface AccountDataExportSnapshotOpenOptions {
  /** Cancels checkout/snapshot reads without changing account authority. */
  readonly signal?: AbortSignal;
  /** Finite transaction-local timeout in milliseconds for PostgreSQL work. */
  readonly timeoutMs?: number;
}

export type AccountDataExportSnapshotOpenResult =
  | { readonly outcome: 'account-not-found' }
  | {
      readonly outcome: 'opened';
      readonly snapshot: AccountDataExportSnapshot;
    };

/** Dedicated read boundary for one complete account-export snapshot. */
export interface AccountDataExportRepository {
  openSnapshot(
    userId: string,
    options?: AccountDataExportSnapshotOpenOptions
  ): Promise<AccountDataExportSnapshotOpenResult>;
}
