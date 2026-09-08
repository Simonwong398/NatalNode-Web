import { isChartResult, type EngineClient } from '@natalnode/engine-client';
import { performance } from 'node:perf_hooks';
import {
  certifyChartResultForRequest,
  getChartRequestAuthorityIssue,
  type ChartRequest,
  type ChartResult
} from '@natalnode/contracts';
import type { Clock } from '../creation-boundaries.js';
import {
  ChartResultCache
} from './chart-result-cache.js';
import type { ChartResultCacheIdentity } from './chart-result-cache-key.js';
import type { CalculationObservability } from '../observability/calculation-observability.js';

const INCOMPATIBLE_CHART_RESULT_ERROR =
  'Chart calculation result is incompatible.';
const INVALID_CHART_REQUEST_AUTHORITY_ERROR =
  'Chart calculation request authority is invalid.';
const INCOMPATIBLE_CHART_RESULT_AUTHORITY_ERROR =
  'Chart calculation result authority is incompatible.';

export interface ChartCalculationService {
  calculateChart(request: ChartRequest): Promise<ChartResult>;
  calculateChartWithOutcome(
    request: ChartRequest
  ): Promise<ChartCalculationOutcome>;
}

export interface ChartCalculationOutcome {
  readonly chart: ChartResult;
  readonly observability: CalculationObservability;
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
    const outcome = await this.calculateChartWithOutcome(request);
    return outcome.chart;
  }

  public async calculateChartWithOutcome(
    request: ChartRequest
  ): Promise<ChartCalculationOutcome> {
    if (getChartRequestAuthorityIssue(request) !== null) {
      throw new Error(INVALID_CHART_REQUEST_AUTHORITY_ERROR);
    }

    const cacheLookup = this.cache.lookup(request);

    if (cacheLookup.status === 'hit') {
      this.assertResultAuthority(request, cacheLookup.value);
      return {
        chart: cacheLookup.value,
        observability: this.createCalculationObservability(
          'hit',
          cacheLookup.value,
          undefined
        )
      };
    }

    const engineStartedAt = performance.now();
    const freshResult = await this.engineClient.calculateChart(request);
    const engineDurationMs = this.engineDurationMs(engineStartedAt);

    if (
      !isChartResult(freshResult) ||
      freshResult.schemaVersion !== this.chartResultContractVersion ||
      freshResult.engineVersion !== this.engineResultGeneration
    ) {
      throw new Error(INCOMPATIBLE_CHART_RESULT_ERROR);
    }

    this.assertResultAuthority(request, freshResult);

    const cacheStore = this.cache.store(request, freshResult);
    const cacheStatus =
      cacheLookup.status === 'error' || cacheStore.status === 'error'
        ? 'error'
        : 'miss';

    return {
      chart: freshResult,
      observability: this.createCalculationObservability(
        cacheStatus,
        freshResult,
        engineDurationMs
      )
    };
  }

  private createCalculationObservability(
    cacheStatus: CalculationObservability['cacheStatus'],
    chart: ChartResult,
    engineDurationMs: number | undefined
  ): CalculationObservability {
    return {
      cacheStatus,
      engineResultGeneration: this.engineResultGeneration,
      chartResultContractVersion: this.chartResultContractVersion,
      scientificStatus: chart.calculationStatus,
      ...(engineDurationMs === undefined ? {} : { engineDurationMs })
    };
  }

  private assertResultAuthority(
    request: ChartRequest,
    result: ChartResult
  ): void {
    const certification = certifyChartResultForRequest(request, result);

    if (certification.outcome === 'REJECTED') {
      throw new Error(
        `${INCOMPATIBLE_CHART_RESULT_AUTHORITY_ERROR} ${certification.failureCode}`
      );
    }
  }

  private engineDurationMs(startedAt: number): number {
    const durationMs = Math.round(performance.now() - startedAt);

    return Number.isSafeInteger(durationMs) && durationMs >= 0
      ? durationMs
      : 0;
  }
}
