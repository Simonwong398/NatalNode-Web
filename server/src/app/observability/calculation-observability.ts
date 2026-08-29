import type { ChartResult } from '@natalnode/contracts';

export type CalculationCacheStatus = 'hit' | 'miss' | 'error';

export interface CalculationObservability {
  readonly cacheStatus: CalculationCacheStatus;
  readonly engineResultGeneration: string;
  readonly chartResultContractVersion: string;
  readonly scientificStatus: ChartResult['calculationStatus'];
  readonly engineDurationMs?: number;
}
