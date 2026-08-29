import type {
  ChartCalculationApiRequest,
  ChartCalculationApiResponse,
  ChartRequest,
  ChartResult,
  SkyEventsRequest,
  SkyEventsResult,
  SkySnapshotRequest,
  SkySnapshotResult
} from '@natalnode/contracts';
import type { EngineClient } from './index.js';
import {
  isSkyEventsResult,
  isSkySnapshotResult
} from './sky-result-validation.js';
import { isChartResult } from './chart-result-validation.js';

const CHART_CALCULATION_ENDPOINT = '/api/chart';
const SKY_SNAPSHOT_ENDPOINT = '/api/sky/snapshot';
const SKY_EVENTS_ENDPOINT = '/api/sky/events';
const CALCULATION_FAILURE_MESSAGE = 'Chart calculation request failed.';
const SKY_CALCULATION_FAILURE_MESSAGE = 'Sky calculation request failed.';

const defaultFetch: typeof globalThis.fetch = (input, init) =>
  globalThis.fetch(input, init);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isChartCalculationApiResponse(
  value: unknown
): value is ChartCalculationApiResponse {
  return isRecord(value) && isChartResult(value.chart);
}

function calculationFailure(): Error {
  return new Error(CALCULATION_FAILURE_MESSAGE);
}

function skyCalculationFailure(): Error {
  return new Error(SKY_CALCULATION_FAILURE_MESSAGE);
}

export class HttpEngineClient implements EngineClient {
  constructor(
    private readonly fetchImplementation: typeof globalThis.fetch = defaultFetch
  ) {}

  async calculateChart(request: ChartRequest): Promise<ChartResult> {
    const apiRequest: ChartCalculationApiRequest = { chart: request };
    let response: Response;

    try {
      response = await this.fetchImplementation(CHART_CALCULATION_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });
    } catch (_error) {
      throw calculationFailure();
    }

    if (!response.ok) {
      throw calculationFailure();
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch (_error) {
      throw calculationFailure();
    }

    if (!isChartCalculationApiResponse(payload)) {
      throw calculationFailure();
    }

    return payload.chart;
  }

  async getSkySnapshot(
    request: SkySnapshotRequest
  ): Promise<SkySnapshotResult> {
    const payload = await this.postSkyRequest(SKY_SNAPSHOT_ENDPOINT, request);

    if (!isSkySnapshotResult(payload) || payload.atUtc !== request.atUtc) {
      throw skyCalculationFailure();
    }

    return payload;
  }

  async getSkyEvents(request: SkyEventsRequest): Promise<SkyEventsResult> {
    const payload = await this.postSkyRequest(SKY_EVENTS_ENDPOINT, request);

    if (
      !isSkyEventsResult(payload) ||
      payload.startUtc !== request.startUtc ||
      payload.endUtc !== request.endUtc
    ) {
      throw skyCalculationFailure();
    }

    return payload;
  }

  private async postSkyRequest(
    endpoint: string,
    request: SkySnapshotRequest | SkyEventsRequest
  ): Promise<unknown> {
    let response: Response;

    try {
      response = await this.fetchImplementation(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
    } catch (_error) {
      throw skyCalculationFailure();
    }

    if (!response.ok) {
      throw skyCalculationFailure();
    }

    try {
      return await response.json();
    } catch (_error) {
      throw skyCalculationFailure();
    }
  }
}
