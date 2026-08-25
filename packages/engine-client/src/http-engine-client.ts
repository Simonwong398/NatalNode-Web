import type {
  ChartCalculationApiRequest,
  ChartCalculationApiResponse,
  ChartRequest,
  ChartResult
} from '@natalnode/contracts';
import type { EngineClient } from './index.js';

const CHART_CALCULATION_ENDPOINT = '/api/chart';
const CALCULATION_FAILURE_MESSAGE = 'Chart calculation request failed.';

const defaultFetch: typeof globalThis.fetch = (input, init) =>
  globalThis.fetch(input, init);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
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

function isCalculationWarning(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    (value.severity === 'INFO' ||
      value.severity === 'WARNING' ||
      value.severity === 'ERROR')
  );
}

function hasMatchingScientificMetadata(value: Record<string, unknown>): boolean {
  if (!isRecord(value.metadata)) {
    return false;
  }

  if (value.calculationStatus === 'COMPLETE') {
    return (
      value.metadata.configurationStatus === 'COMPLETE' &&
      typeof value.metadata.astronomyConfigurationId === 'string' &&
      isNullableString(value.metadata.provenanceEnvelopeId)
    );
  }

  if (value.calculationStatus === 'INCOMPLETE_RESEARCH') {
    return (
      value.metadata.configurationStatus === 'INCOMPLETE_RESEARCH' &&
      value.metadata.astronomyConfigurationId === null &&
      value.metadata.provenanceEnvelopeId === null &&
      value.metadata.reason === 'INCOMPLETE_RESEARCH'
    );
  }

  return false;
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
}
