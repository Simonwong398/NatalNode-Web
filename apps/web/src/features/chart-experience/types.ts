import type { ChartRequest, ChartResult } from '@natalnode/contracts';

export interface CalculatedChartSnapshot {
  readonly request: ChartRequest;
  readonly result: ChartResult;
}
