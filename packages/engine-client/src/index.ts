import type {
  ChartRequest,
  ChartResult
} from '@natalnode/contracts';

export interface EngineClient {
  calculateChart(request: ChartRequest): Promise<ChartResult>;
}

export { MockEngineClient } from './mock-engine-client.js';
