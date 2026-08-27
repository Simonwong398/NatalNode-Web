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
  hasMatchingScientificMetadata,
  isCalculationWarning,
  isSkyEventsResult,
  isSkySnapshotResult
} from './sky-result-validation.js';

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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBodyFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.bodyId === 'string' &&
    isFiniteNumber(value.longitude) &&
    typeof value.sign === 'string' &&
    (value.house === null || isFiniteNumber(value.house)) &&
    (value.retrograde === null || typeof value.retrograde === 'boolean')
  );
}

function isAngleFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.angleId === 'string' &&
    isFiniteNumber(value.longitude) &&
    typeof value.sign === 'string'
  );
}

function isHouseFacts(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.system === 'string' &&
    Array.isArray(value.cusps) &&
    value.cusps.every(
      (cusp) =>
        isRecord(cusp) &&
        isFiniteNumber(cusp.house) &&
        isFiniteNumber(cusp.longitude)
    )
  );
}

function isAspectFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.firstBodyId === 'string' &&
    typeof value.secondBodyId === 'string' &&
    typeof value.type === 'string' &&
    isFiniteNumber(value.orb) &&
    (value.phaseState === null ||
      value.phaseState === 'APPLYING' ||
      value.phaseState === 'EXACT' ||
      value.phaseState === 'SEPARATING')
  );
}

function isChartResult(value: unknown): value is ChartResult {
  return (
    isRecord(value) &&
    typeof value.schemaVersion === 'string' &&
    typeof value.engineVersion === 'string' &&
    Array.isArray(value.bodies) &&
    value.bodies.every(isBodyFact) &&
    Array.isArray(value.angles) &&
    value.angles.every(isAngleFact) &&
    (value.houses === null || isHouseFacts(value.houses)) &&
    Array.isArray(value.aspects) &&
    value.aspects.every(isAspectFact) &&
    Array.isArray(value.warnings) &&
    value.warnings.every(isCalculationWarning) &&
    hasMatchingScientificMetadata(value)
  );
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
