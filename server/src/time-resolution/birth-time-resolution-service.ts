import type {
  CanonicalLocationBinding,
  CivilTimeResolutionApiRequest,
  TimeResolutionError,
  TimeResolutionEvidence,
  UtcCandidate
} from '@natalnode/contracts';
import type { LocalDateTime } from '@js-joda/core';
import {
  isCanonicalResolvedLocation,
  type LocationResolutionService
} from '../location-resolution/location-resolution-service.js';
import {
  CIVIL_TIME_AUTHORITY_PROFILE,
  CivilTimeAuthorityError,
  loadPinnedCivilTimeRules,
  type PinnedCivilTimeRules
} from './civil-time-profile.js';
import type {
  BirthTimeResolutionService,
  CanonicalLocation,
  TimeResolutionRequest,
  TimeResolutionResult,
  VerifiedUtcInstant
} from './time-resolution-contract.js';

const issuedInstants = new WeakSet<object>();
const profile = CIVIL_TIME_AUTHORITY_PROFILE;
const forbiddenClaims = new Set([
  'verified', 'verifiedUtcInstant', 'evidence', 'timeResolution', 'authority',
  'profile', 'resolvedUtcInstant', 'utcOffsetSeconds', 'timezoneResolutionMethod',
  'timezoneDatabaseVersion', 'certification', 'token'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

function isText(value: unknown, maximum = 256): value is string {
  return typeof value === 'string' && value.trim() !== '' && Array.from(value).length <= maximum &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}

function validCoordinates(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ['latitude', 'longitude']) &&
    typeof value.latitude === 'number' && Number.isFinite(value.latitude) &&
    value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === 'number' && Number.isFinite(value.longitude) &&
    value.longitude >= -180 && value.longitude <= 180;
}

function reject(error: TimeResolutionError): TimeResolutionResult {
  return Object.freeze({ outcome: 'REJECTED', error: Object.freeze(error) });
}

function rangeError(
  reason: Extract<TimeResolutionError, { code: 'UNSUPPORTED_TIME_RANGE' }>['reason']
): TimeResolutionResult {
  return reject({
    code: 'UNSUPPORTED_TIME_RANGE', field: 'localDate', reason,
    minimumLocalDate: profile.minimumLocalDate,
    maximumLocalDate: profile.maximumLocalDate
  });
}

function parseInput(input: unknown): CivilTimeResolutionApiRequest | TimeResolutionError {
  if (!isRecord(input)) return { code: 'INVALID_REQUEST', field: 'request' };
  const civil = input.civilTime;
  const location = input.location;
  const coordinates = isRecord(location) ? location.coordinates : null;
  // Inspect only the closed DTO levels; client certificates are never consumed.
  for (const record of [input, civil, location, coordinates]) {
    if (isRecord(record) && Object.keys(record).some((key) => forbiddenClaims.has(key))) {
      return { code: 'CLIENT_TIME_AUTHORITY_FORBIDDEN', field: 'request' };
    }
  }
  if (
    !hasExactKeys(input, [
      'civilTime', 'location', 'disambiguation', 'expectedTimezoneDatabaseVersion'
    ]) || !isRecord(civil) || !isRecord(location) ||
    !hasExactKeys(civil, ['localDate', 'localTime', 'calendar', 'precision']) ||
    civil.calendar !== 'ISO_8601_GREGORIAN' || civil.precision !== 'MINUTE' ||
    !['REJECT', 'EARLIER', 'LATER'].includes(input.disambiguation as string) ||
    (input.expectedTimezoneDatabaseVersion !== null &&
      !isText(input.expectedTimezoneDatabaseVersion, 128))
  ) return { code: 'INVALID_REQUEST', field: 'request' };

  if (typeof civil.localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(civil.localDate) ||
    civil.localDate.startsWith('0000-')) {
    return { code: 'INVALID_LOCAL_DATE', field: 'localDate' };
  }
  if (civil.localTime !== null &&
    (typeof civil.localTime !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(civil.localTime))) {
    return { code: 'INVALID_LOCAL_TIME', field: 'localTime' };
  }
  if (!isText(location.resolutionId)) {
    return { code: 'LOCATION_RESOLUTION_REQUIRED', field: 'locationResolutionId' };
  }
  if (!validCoordinates(coordinates)) return { code: 'INVALID_COORDINATES', field: 'coordinates' };
  if (!isText(location.ianaTimeZone, 128)) {
    return { code: 'INVALID_TIME_ZONE', field: 'ianaTimeZone' };
  }
  if (!hasExactKeys(location, ['resolutionId', 'coordinates', 'ianaTimeZone'])) {
    return { code: 'INVALID_REQUEST', field: 'request' };
  }
  return input as unknown as CivilTimeResolutionApiRequest;
}

function snapshotLocation(location: CanonicalLocation): CanonicalLocationBinding {
  const attribution = location.source.attribution;
  return Object.freeze({
    resolutionId: location.resolutionId,
    coordinates: Object.freeze({
      latitude: location.coordinates.latitude, longitude: location.coordinates.longitude
    }),
    ianaTimeZone: location.ianaTimeZone,
    authority: Object.freeze({
      kind: location.authority.kind,
      sourceId: location.authority.sourceId, recordId: location.authority.recordId
    }),
    source: Object.freeze({
      sourceVersion: location.source.sourceVersion,
      datasetVersion: location.source.datasetVersion,
      ...(attribution === undefined ? {} : {
        attribution: attribution === null ? null : Object.freeze({
          label: attribution.label, url: attribution.url
        })
      })
    })
  });
}

function resolveCanonical(
  request: TimeResolutionRequest,
  local: LocalDateTime,
  runtime: PinnedCivilTimeRules
): TimeResolutionResult {
  const expected = request.expectedTimezoneDatabaseVersion;
  if (expected !== null && expected !== profile.timezoneDatabaseVersion) {
    return reject({
      code: 'TZDB_VERSION_MISMATCH', field: 'timezoneDatabaseVersion',
      expectedVersion: expected, actualVersion: profile.timezoneDatabaseVersion
    });
  }
  if (request.disambiguation !== 'REJECT' && expected === null) {
    return reject({ code: 'DISAMBIGUATION_VERSION_REQUIRED', field: 'timezoneDatabaseVersion' });
  }
  if (request.civilTime.localDate < profile.minimumLocalDate) {
    return rangeError('PRE_1970_NOT_ADMITTED');
  }
  if (request.civilTime.localDate > profile.maximumLocalDate) return rangeError('AFTER_2100');

  const zone = runtime.core.ZoneId.of(request.location.ianaTimeZone);
  const rules = zone.rules();
  const offsets = rules.validOffsets(local);
  if (offsets.length === 0) return reject({ code: 'NONEXISTENT_LOCAL_TIME', field: 'localTime' });
  if (offsets.length !== 1 && offsets.length !== 2) {
    return reject({ code: 'TIME_AUTHORITY_DATA_INVALID', field: null });
  }
  const candidates = offsets.map((offset): UtcCandidate => {
    const instant = local.toInstant(offset);
    const utcOffsetSeconds = offset.totalSeconds();
    if (
      !Number.isSafeInteger(utcOffsetSeconds) ||
      !runtime.core.LocalDateTime.ofInstant(instant, zone).equals(local) ||
      rules.offsetOfInstant(instant).totalSeconds() !== utcOffsetSeconds
    ) throw new CivilTimeAuthorityError('TIME_AUTHORITY_DATA_INVALID');
    return Object.freeze({
      resolvedUtcInstant: new Date(instant.toEpochMilli()).toISOString(),
      utcOffsetSeconds
    });
  }).sort((a, b) => a.resolvedUtcInstant < b.resolvedUtcInstant ? -1 :
    a.resolvedUtcInstant > b.resolvedUtcInstant ? 1 : 0);

  if (new Set(candidates.map((candidate) => candidate.resolvedUtcInstant)).size !== offsets.length) {
    return reject({ code: 'TIME_AUTHORITY_DATA_INVALID', field: null });
  }
  if (candidates.some(({ resolvedUtcInstant }) =>
    resolvedUtcInstant < profile.minimumUtcInclusive || resolvedUtcInstant >= profile.maximumUtcExclusive
  )) return rangeError('UTC_OUTSIDE_ADMITTED_RANGE');

  let selected = candidates[0];
  let selection: TimeResolutionEvidence['selection'];
  if (candidates.length === 1) {
    if (request.disambiguation !== 'REJECT') {
      return reject({ code: 'DISAMBIGUATION_NOT_APPLICABLE', field: 'disambiguation' });
    }
    selection = Object.freeze({ kind: 'UNAMBIGUOUS' });
  } else {
    const pair = Object.freeze([candidates[0], candidates[1]] as const);
    if (request.disambiguation === 'REJECT') {
      return reject({
        code: 'AMBIGUOUS_LOCAL_TIME', field: 'localTime', candidates: pair,
        timezoneDatabaseVersion: profile.timezoneDatabaseVersion
      });
    }
    selected = pair[request.disambiguation === 'EARLIER' ? 0 : 1];
    selection = Object.freeze({
      kind: 'USER_DISAMBIGUATED_OVERLAP', occurrence: request.disambiguation, candidates: pair
    });
  }
  // This is the sole issuance point, after live canonical binding and rule checks.
  const value = Object.freeze({
    schemaVersion: '1', authority: profile,
    civilTime: Object.freeze({ ...request.civilTime, localTime: request.civilTime.localTime as string }),
    location: snapshotLocation(request.location), ...selected, selection
  }) as VerifiedUtcInstant;
  issuedInstants.add(value);
  return Object.freeze({ outcome: 'VERIFIED', value });
}

export function assertVerifiedUtcInstant(value: unknown): asserts value is VerifiedUtcInstant {
  if (!isRecord(value) || !issuedInstants.has(value) || value.authority !== profile) {
    throw new CivilTimeAuthorityError('UNVERIFIED_UTC_INSTANT');
  }
}

export interface BirthTimeResolutionServiceDependencies {
  readonly locationResolutionService: Pick<LocationResolutionService, 'getResolvedLocation'>;
}

/**
 * Internal BFF service only. Every call re-reads the existing canonical owner;
 * it performs no geocoding network call, Engine calculation or persistence.
 */
export function createBirthTimeResolutionService(
  dependencies: BirthTimeResolutionServiceDependencies
): BirthTimeResolutionService {
  const runtime = loadPinnedCivilTimeRules();
  const owner = dependencies.locationResolutionService;
  return Object.freeze({
    profile,
    resolve(input: unknown): TimeResolutionResult {
      const parsed = parseInput(input);
      if ('code' in parsed) return reject(parsed);
      let civil: LocalDateTime;
      try {
        runtime.core.LocalDate.parse(parsed.civilTime.localDate);
      } catch {
        return reject({ code: 'INVALID_LOCAL_DATE', field: 'localDate' });
      }
      if (parsed.civilTime.localTime === null) {
        return reject({ code: 'UNKNOWN_BIRTH_TIME', field: 'localTime' });
      }
      if (!runtime.zoneIds.has(parsed.location.ianaTimeZone)) {
        return reject({ code: 'INVALID_TIME_ZONE', field: 'ianaTimeZone' });
      }
      let location: CanonicalLocation | null;
      try {
        location = owner.getResolvedLocation(parsed.location.resolutionId);
      } catch {
        return reject({ code: 'LOCATION_RESOLUTION_UNAVAILABLE', field: 'locationResolutionId' });
      }
      if (location === null) {
        return reject({ code: 'LOCATION_RESOLUTION_UNAVAILABLE', field: 'locationResolutionId' });
      }
      if (!isCanonicalResolvedLocation(location) || !runtime.zoneIds.has(location.ianaTimeZone)) {
        return reject({ code: 'TIME_AUTHORITY_DATA_INVALID', field: null });
      }
      if (
        location.resolutionId !== parsed.location.resolutionId ||
        location.ianaTimeZone !== parsed.location.ianaTimeZone ||
        location.coordinates.latitude !== parsed.location.coordinates.latitude ||
        location.coordinates.longitude !== parsed.location.coordinates.longitude
      ) return reject({ code: 'LOCATION_BINDING_MISMATCH', field: 'locationResolutionId' });

      if ([location.authority.sourceId, location.source.sourceVersion, location.source.datasetVersion]
        .some((value) => value === 'UI_DEVELOPMENT_ONLY' || value === 'EDUCATIONAL_CHART_FIXTURE')) {
        return reject({ code: 'DEVELOPMENT_FIXTURE_REJECTED', field: 'request' });
      }
      try {
        civil = runtime.core.LocalDateTime.parse(
          `${parsed.civilTime.localDate}T${parsed.civilTime.localTime}:00`
        );
        return resolveCanonical({
          civilTime: parsed.civilTime, location, disambiguation: parsed.disambiguation,
          expectedTimezoneDatabaseVersion: parsed.expectedTimezoneDatabaseVersion
        }, civil, runtime);
      } catch {
        return reject({ code: 'TIME_AUTHORITY_DATA_INVALID', field: null });
      }
    }
  });
}
