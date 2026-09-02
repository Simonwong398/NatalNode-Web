import type { VaultChartRecord } from '@natalnode/contracts';
import type { VaultChartMetadataUpdate } from './types.js';

export interface VaultChartListCursor {
  readonly createdAt: string;
  readonly chartId: string;
}

export interface VaultChartListPage {
  readonly charts: readonly VaultChartRecord[];
  readonly nextCursor: VaultChartListCursor | null;
}

export interface VaultChartListOptions {
  readonly limit: number;
  readonly cursor: VaultChartListCursor | null;
}

export interface VaultChartRepository {
  create(chart: VaultChartRecord): Promise<void>;
  findById(userId: string, chartId: string): Promise<VaultChartRecord | null>;
  listForUser(userId: string): Promise<readonly VaultChartRecord[]>;
  /** Cursor page used by the HTTP boundary; optional for legacy test doubles. */
  listPageForUser?(
    userId: string,
    options: VaultChartListOptions
  ): Promise<VaultChartListPage>;
  updateMetadata(
    userId: string,
    chartId: string,
    update: VaultChartMetadataUpdate
  ): Promise<VaultChartRecord | null>;
  deleteById(userId: string, chartId: string): Promise<boolean>;
}
