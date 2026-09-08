import type {
  ChartRequest,
  ChartResult,
  SkyEventsRequest,
  SkyEventsResult,
  SkySnapshotRequest,
  SkySnapshotResult
} from '@natalnode/contracts';

export interface EngineClient {
  calculateChart(request: ChartRequest): Promise<ChartResult>;
  getSkySnapshot(request: SkySnapshotRequest): Promise<SkySnapshotResult>;
  getSkyEvents(request: SkyEventsRequest): Promise<SkyEventsResult>;
}

export { HttpEngineClient } from './http-engine-client.js';
export { isChartResult } from './chart-result-validation.js';
