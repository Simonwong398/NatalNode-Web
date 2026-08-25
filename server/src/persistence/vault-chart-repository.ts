import type { VaultChartRecord } from '@natalnode/contracts';
import type { VaultChartMetadataUpdate } from './types.js';

export interface VaultChartRepository {
  create(chart: VaultChartRecord): Promise<void>;
  findById(userId: string, chartId: string): Promise<VaultChartRecord | null>;
  listForUser(userId: string): Promise<readonly VaultChartRecord[]>;
  updateMetadata(
    userId: string,
    chartId: string,
    update: VaultChartMetadataUpdate
  ): Promise<VaultChartRecord | null>;
  deleteById(userId: string, chartId: string): Promise<boolean>;
}
