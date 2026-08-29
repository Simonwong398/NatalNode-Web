import type { ChartResult } from '@natalnode/contracts';
import {
  hasMatchingScientificMetadata,
  isCalculationWarning
} from './sky-result-validation.js';

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

export function isChartResult(value: unknown): value is ChartResult {
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
