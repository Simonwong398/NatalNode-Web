import type {
  SkyEventsResult,
  SkySnapshotResult
} from '@natalnode/contracts';

const SKY_BODY_IDS = new Set([
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto'
]);

const ZODIAC_SIGNS = new Set([
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
]);

const SKY_MOTION_STATES = new Set([
  'DIRECT',
  'RETROGRADE',
  'STATIONARY'
]);

const SKY_MAJOR_ASPECT_TYPES = new Set([
  'conjunction',
  'opposition',
  'trine',
  'square',
  'sextile'
]);

const ASPECT_PHASE_STATES = new Set([
  'APPLYING',
  'EXACT',
  'SEPARATING'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCanonicalUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function isCalculationWarning(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    (value.severity === 'INFO' ||
      value.severity === 'WARNING' ||
      value.severity === 'ERROR')
  );
}

export function hasMatchingScientificMetadata(
  value: Record<string, unknown>
): boolean {
  if (!isRecord(value.metadata)) {
    return false;
  }

  if (value.calculationStatus === 'COMPLETE') {
    return (
      value.metadata.configurationStatus === 'COMPLETE' &&
      typeof value.metadata.astronomyConfigurationId === 'string' &&
      (typeof value.metadata.provenanceEnvelopeId === 'string' ||
        value.metadata.provenanceEnvelopeId === null)
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

function isSkyBodyId(value: unknown): boolean {
  return typeof value === 'string' && SKY_BODY_IDS.has(value);
}

function isZodiacSign(value: unknown): boolean {
  return typeof value === 'string' && ZODIAC_SIGNS.has(value);
}

function isSkyMajorAspectType(value: unknown): boolean {
  return typeof value === 'string' && SKY_MAJOR_ASPECT_TYPES.has(value);
}

function isSkyBodyPosition(value: unknown): boolean {
  return (
    isRecord(value) &&
    isSkyBodyId(value.bodyId) &&
    isFiniteNumber(value.longitude) &&
    isZodiacSign(value.sign) &&
    (value.motionState === null ||
      (typeof value.motionState === 'string' &&
        SKY_MOTION_STATES.has(value.motionState)))
  );
}

function isSkyCurrentAspect(value: unknown): boolean {
  return (
    isRecord(value) &&
    isSkyBodyId(value.firstBodyId) &&
    isSkyBodyId(value.secondBodyId) &&
    isSkyMajorAspectType(value.aspectType) &&
    (value.orb === null || isFiniteNumber(value.orb)) &&
    (value.phaseState === null ||
      (typeof value.phaseState === 'string' &&
        ASPECT_PHASE_STATES.has(value.phaseState)))
  );
}

function hasValidEventTiming(value: Record<string, unknown>): boolean {
  return (
    (value.exactAt === null || isCanonicalUtcTimestamp(value.exactAt)) &&
    (value.activeFromUtc === undefined ||
      isCanonicalUtcTimestamp(value.activeFromUtc)) &&
    (value.activeUntilUtc === undefined ||
      isCanonicalUtcTimestamp(value.activeUntilUtc))
  );
}

function isSkyEvent(value: unknown): boolean {
  if (!isRecord(value) || !hasValidEventTiming(value)) {
    return false;
  }

  switch (value.eventType) {
    case 'INGRESS':
      return (
        isSkyBodyId(value.bodyId) &&
        isZodiacSign(value.fromSign) &&
        isZodiacSign(value.toSign)
      );
    case 'STATION':
      return (
        isSkyBodyId(value.bodyId) &&
        (value.resultingMotionState === 'DIRECT' ||
          value.resultingMotionState === 'RETROGRADE')
      );
    case 'EXACT_MAJOR_ASPECT':
      return (
        isSkyBodyId(value.firstBodyId) &&
        isSkyBodyId(value.secondBodyId) &&
        isSkyMajorAspectType(value.aspectType) &&
        isCanonicalUtcTimestamp(value.exactAt)
      );
    case 'LUNATION':
      return (
        (value.kind === 'NEW_MOON' || value.kind === 'FULL_MOON') &&
        isCanonicalUtcTimestamp(value.exactAt)
      );
    case 'LUNAR_PHASE':
      return (
        (value.kind === 'FIRST_QUARTER' || value.kind === 'LAST_QUARTER') &&
        isCanonicalUtcTimestamp(value.exactAt)
      );
    case 'ECLIPSE':
      return isCanonicalUtcTimestamp(value.exactAt);
    default:
      return false;
  }
}

function hasValidSkyResultBase(value: Record<string, unknown>): boolean {
  return (
    typeof value.schemaVersion === 'string' &&
    typeof value.engineVersion === 'string' &&
    value.zodiacModel === 'TROPICAL' &&
    value.referenceFrame === 'GEOCENTRIC' &&
    Array.isArray(value.warnings) &&
    value.warnings.every(isCalculationWarning) &&
    hasMatchingScientificMetadata(value)
  );
}

export function isSkySnapshotResult(
  value: unknown
): value is SkySnapshotResult {
  return (
    isRecord(value) &&
    hasValidSkyResultBase(value) &&
    isCanonicalUtcTimestamp(value.atUtc) &&
    Array.isArray(value.bodyPositions) &&
    value.bodyPositions.every(isSkyBodyPosition) &&
    Array.isArray(value.currentAspects) &&
    value.currentAspects.every(isSkyCurrentAspect)
  );
}

export function isSkyEventsResult(value: unknown): value is SkyEventsResult {
  if (
    !isRecord(value) ||
    !hasValidSkyResultBase(value) ||
    !isCanonicalUtcTimestamp(value.startUtc) ||
    !isCanonicalUtcTimestamp(value.endUtc) ||
    !Array.isArray(value.events) ||
    !value.events.every(isSkyEvent)
  ) {
    return false;
  }

  return Date.parse(value.startUtc) < Date.parse(value.endUtc);
}
