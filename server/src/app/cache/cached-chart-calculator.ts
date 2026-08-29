import {
  isChartResult,
  type EngineClient
} from '@natalnode/engine-client';
import type { ChartRequest, ChartResult } from '@natalnode/contracts';
import type { Clock } from '../creation-boundaries.js';
import { ChartResultCache } from './chart-result-cache.js';
import type { ChartResultCacheIdentity } from './chart-result-cache-key.js';

const INCOMPATIBLE_CHART_RESULT_ERROR =
  'Chart calculation result is incompatible.';

export interface ChartCalculationService {
  calculateChart(request: ChartRequest): Promise<ChartResult>;
}

export interface CachedChartCalculatorConfig {
  readonly engineClient: EngineClient;
  readonly clock: Clock;
  readonly cacheIdentity: ChartResultCacheIdentity;
}

export class CachedChartCalculator implements ChartCalculationService {
  private readonly cache: ChartResultCache;
  private readonly engineClient: EngineClient;
  private readonly engineResultGeneration: string;
  private readonly chartResultContractVersion: string;

  public constructor(config: CachedChartCalculatorConfig) {
    this.cache = new ChartResultCache({
      ...config.cacheIdentity,
      clock: config.clock
    });
    this.engineClient = config.engineClient;
    this.engineResultGeneration = config.cacheIdentity.engineResultGeneration;
    this.chartResultContractVersion =
      config.cacheIdentity.chartResultContractVersion;
  }

  public async calculateChart(request: ChartRequest): Promise<ChartResult> {
    const cachedResult = this.cache.get(request);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const freshResult = await this.engineClient.calculateChart(request);

    if (
      !isChartResult(freshResult) ||
      freshResult.schemaVersion !== this.chartResultContractVersion ||
      freshResult.engineVersion !== this.engineResultGeneration
    ) {
      throw new Error(INCOMPATIBLE_CHART_RESULT_ERROR);
    }

    this.cache.set(request, freshResult);
    return freshResult;
  }
}
