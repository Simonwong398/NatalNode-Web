import type {
  CivilTimeAuthorityProfile,
  TimeResolutionEvidence
} from '@natalnode/contracts';
import type { CanonicalResolvedLocation } from './location-resolution';
import {
  BirthInputResolverError,
  type BirthInputResolver,
  type BirthInputResolverOptions
} from './resolver.js';
import type {
  AmbiguousTimeCandidate,
  BirthInputDraft,
  BirthInputResolution
} from './types';

const PUBLIC_RESOLUTION_ENDPOINT = '/api/birth-time/resolve';
const DEVELOPMENT_RESOLUTION_ENDPOINT = '/api/dev/chart/resolve-time';
const UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUtcInstant(value: unknown): value is string {
  if (typeof value !== 'string' || !UTC_INSTANT_PATTERN.test(value)) return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function safeText(value: unknown, maximum = 256): value is string {
  return typeof value === 'string' && value.trim() !== '' &&
    Array.from(value).length <= maximum &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}

function invalidResponse(): BirthInputResolverError {
  return new BirthInputResolverError(
    'INVALID_TIME_RESOLUTION_RESPONSE',
    'Birth-time verification returned an invalid response.'
  );
}

function parseAuthorityMetadata(value: unknown): {
  readonly timezoneDatabaseVersion: string;
  readonly profileId: string;
} {
  if (
    !isRecord(value) ||
    !safeText(value.timezoneDatabaseVersion, 128) ||
    !safeText(value.profileId, 256)
  ) {
    throw invalidResponse();
  }
  return {
    timezoneDatabaseVersion: value.timezoneDatabaseVersion,
    profileId: value.profileId
  };
}

function isCivilTimeAuthorityProfile(
  value: unknown
): value is CivilTimeAuthorityProfile {
  if (
    !isRecord(value) ||
    value.policyId !== 'NATALNODE_WEB_CIVIL_TIME_V1' ||
    value.implementation !== 'JS_JODA_PACKAGED_TZDB' ||
    value.bundle !== 'FULL' ||
    value.coveragePolicyId !== 'IANA_1970_2100_V1' ||
    value.minimumLocalDate !== '1970-01-01' ||
    value.maximumLocalDate !== '2100-12-31' ||
    value.minimumUtcInclusive !== '1970-01-01T00:00:00.000Z' ||
    value.maximumUtcExclusive !== '2101-01-01T00:00:00.000Z' ||
    !safeText(value.coreVersion, 32) ||
    !safeText(value.timezonePackageVersion, 32) ||
    !safeText(value.timezoneDatabaseVersion, 32) ||
    !safeText(value.profileId, 256) ||
    typeof value.rulesArtifactSha256 !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(value.rulesArtifactSha256)
  ) {
    return false;
  }

  return value.profileId ===
    `NN_WEB_CIVIL_TIME_JS_JODA_${value.coreVersion}_TZ_${value.timezonePackageVersion}_${value.bundle}_${value.timezoneDatabaseVersion}_1970_2100_V1`;
}

function resolutionBase(
  draft: BirthInputDraft,
  location: CanonicalResolvedLocation,
  timezoneDatabaseVersion: string,
  timezoneResolutionMethod: string
) {
  return {
    localDate: draft.localDate,
    localTime: draft.localTime,
    locationLabel: location.canonicalDisplayName,
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude,
    ianaTimeZone: location.ianaTimeZone,
    timezoneDatabaseVersion,
    timezoneResolutionMethod
  };
}

function parseCandidate(
  candidate: unknown,
  occurrence: AmbiguousTimeCandidate['occurrence']
): AmbiguousTimeCandidate {
  if (
    !isRecord(candidate) ||
    (candidate.occurrence !== undefined && candidate.occurrence !== occurrence) ||
    !isUtcInstant(candidate.resolvedUtcInstant) ||
    typeof candidate.utcOffsetSeconds !== 'number' ||
    !Number.isSafeInteger(candidate.utcOffsetSeconds)
  ) {
    throw invalidResponse();
  }
  return {
    occurrence,
    resolvedUtcInstant: candidate.resolvedUtcInstant,
    utcOffsetSeconds: candidate.utcOffsetSeconds
  };
}

function parseCandidates(value: unknown): readonly [AmbiguousTimeCandidate, AmbiguousTimeCandidate] {
  if (!Array.isArray(value) || value.length !== 2) throw invalidResponse();
  // The public contract orders UTC candidates; legacy development responses
  // additionally label the same order. Neither path silently selects one.
  const earlier = parseCandidate(value[0], 'EARLIER');
  const later = parseCandidate(value[1], 'LATER');
  if (earlier.resolvedUtcInstant >= later.resolvedUtcInstant) throw invalidResponse();
  return [earlier, later];
}

function sameAuthority(
  left: unknown,
  right: CanonicalResolvedLocation['authority']
): boolean {
  return isRecord(left) && left.kind === right.kind &&
    left.sourceId === right.sourceId && left.recordId === right.recordId;
}

function sameSource(
  left: unknown,
  right: CanonicalResolvedLocation['source']
): boolean {
  if (
    !isRecord(left) ||
    left.sourceVersion !== right.sourceVersion ||
    left.datasetVersion !== right.datasetVersion
  ) return false;
  const actualAttribution = left.attribution;
  const expectedAttribution = right.attribution;
  if (actualAttribution === undefined || expectedAttribution === undefined) {
    return actualAttribution === expectedAttribution;
  }
  if (actualAttribution === null || expectedAttribution === null) {
    return actualAttribution === expectedAttribution;
  }
  return isRecord(actualAttribution) && actualAttribution.label === expectedAttribution.label &&
    actualAttribution.url === expectedAttribution.url;
}

function parseEvidence(
  value: unknown,
  draft: BirthInputDraft,
  location: CanonicalResolvedLocation,
  options: BirthInputResolverOptions
): TimeResolutionEvidence {
  if (
    !isRecord(value) ||
    value.schemaVersion !== '1' ||
    !isCivilTimeAuthorityProfile(value.authority) ||
    !isRecord(value.civilTime) ||
    value.civilTime.localDate !== draft.localDate ||
    value.civilTime.localTime !== draft.localTime ||
    value.civilTime.calendar !== 'ISO_8601_GREGORIAN' ||
    value.civilTime.precision !== 'MINUTE' ||
    !isRecord(value.location) ||
    value.location.resolutionId !== location.resolutionId ||
    value.location.ianaTimeZone !== location.ianaTimeZone ||
    !isRecord(value.location.coordinates) ||
    value.location.coordinates.latitude !== location.coordinates.latitude ||
    value.location.coordinates.longitude !== location.coordinates.longitude ||
    !sameAuthority(value.location.authority, location.authority) ||
    !sameSource(value.location.source, location.source) ||
    !isUtcInstant(value.resolvedUtcInstant) ||
    !Number.isSafeInteger(value.utcOffsetSeconds) ||
    !isRecord(value.selection)
  ) {
    throw invalidResponse();
  }

  if (
    options.expectedTimezoneDatabaseVersion !== undefined &&
    options.expectedTimezoneDatabaseVersion !== null &&
    value.authority.timezoneDatabaseVersion !==
      options.expectedTimezoneDatabaseVersion
  ) {
    throw invalidResponse();
  }

  if (options.disambiguation === undefined || options.disambiguation === 'REJECT') {
    if (value.selection.kind !== 'UNAMBIGUOUS') throw invalidResponse();
  } else {
    if (
      value.selection.kind !== 'USER_DISAMBIGUATED_OVERLAP' ||
      value.selection.occurrence !== options.disambiguation ||
      !Array.isArray(value.selection.candidates)
    ) throw invalidResponse();
    const candidates = parseCandidates(value.selection.candidates);
    const selected = candidates.find(({ occurrence }) => occurrence === options.disambiguation);
    if (
      selected === undefined ||
      selected.resolvedUtcInstant !== value.resolvedUtcInstant ||
      selected.utcOffsetSeconds !== value.utcOffsetSeconds
    ) throw invalidResponse();
  }

  return value as unknown as TimeResolutionEvidence;
}

type ParsedTimeResolutionError = Record<string, unknown> & {
  readonly code: string;
};

function isTimeResolutionError(value: unknown): value is ParsedTimeResolutionError {
  return isRecord(value) && safeText(value.code, 64);
}

function timeResolutionError(value: unknown): ParsedTimeResolutionError {
  if (!isTimeResolutionError(value)) throw invalidResponse();
  return value;
}

function rejectedResolution(
  payload: Record<string, unknown>,
  response: Response,
  draft: BirthInputDraft,
  location: CanonicalResolvedLocation,
  authority: { readonly timezoneDatabaseVersion: string; readonly profileId: string }
): BirthInputResolution {
  const error = timeResolutionError(payload.error);
  const base = resolutionBase(
    draft,
    location,
    authority.timezoneDatabaseVersion,
    authority.profileId
  );

  switch (error.code) {
    case 'AMBIGUOUS_LOCAL_TIME':
      return {
        ...base,
        localTime: draft.localTime as string,
        resolvedUtcInstant: null,
        utcOffsetSeconds: null,
        ambiguityStatus: 'AMBIGUOUS',
        candidates: parseCandidates(error.candidates)
      };
    case 'NONEXISTENT_LOCAL_TIME':
      return {
        ...base,
        localTime: draft.localTime as string,
        resolvedUtcInstant: null,
        utcOffsetSeconds: null,
        ambiguityStatus: 'NONEXISTENT'
      };
    case 'UNKNOWN_BIRTH_TIME':
      return {
        ...base,
        localTime: null,
        resolvedUtcInstant: null,
        utcOffsetSeconds: null,
        ambiguityStatus: 'UNKNOWN_TIME'
      };
    default: {
      const code = error.code;
      if (!response.ok || payload.outcome === 'REJECTED') {
        throw new BirthInputResolverError(code, 'Birth details could not be verified.');
      }
      throw invalidResponse();
    }
  }
}

export class ServerBackedBirthInputResolver implements BirthInputResolver {
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly endpoint: string;

  public constructor(
    fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
    endpoint = PUBLIC_RESOLUTION_ENDPOINT
  ) {
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('A browser fetch implementation is required.');
    }
    if (!endpoint.startsWith('/api/')) {
      throw new TypeError('The birth-time resolver must use a same-origin API path.');
    }
    this.fetchImplementation = fetchImplementation.bind(globalThis);
    this.endpoint = endpoint;
  }

  public async resolve(
    draft: BirthInputDraft,
    selectedLocation?: CanonicalResolvedLocation | null,
    options: BirthInputResolverOptions = {}
  ): Promise<BirthInputResolution> {
    if (
      selectedLocation === undefined || selectedLocation === null ||
      selectedLocation.status !== 'RESOLVED'
    ) {
      throw new BirthInputResolverError(
        'CANONICAL_LOCATION_REQUIRED',
        'Select a canonical birthplace before resolving birth time.'
      );
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          civilTime: {
            localDate: draft.localDate,
            localTime: draft.localTime,
            calendar: 'ISO_8601_GREGORIAN',
            precision: 'MINUTE'
          },
          location: {
            resolutionId: selectedLocation.resolutionId,
            coordinates: selectedLocation.coordinates,
            ianaTimeZone: selectedLocation.ianaTimeZone
          },
          disambiguation: options.disambiguation ?? 'REJECT',
          expectedTimezoneDatabaseVersion:
            options.expectedTimezoneDatabaseVersion ?? null
        })
      });
    } catch {
      throw new BirthInputResolverError(
        'TIME_AUTHORITY_UNAVAILABLE',
        'Birth-time verification is unavailable.'
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw invalidResponse();
    }
    if (!isRecord(payload)) throw invalidResponse();

    const problemCode = payload.code;
    if (
      !response.ok &&
      typeof problemCode === 'string' &&
      safeText(problemCode, 64) &&
      /^[A-Z0-9_]+$/u.test(problemCode)
    ) {
      throw new BirthInputResolverError(
        problemCode,
        'Birth details could not be verified.'
      );
    }

    if (payload.outcome === 'VERIFIED' && payload.evidence !== undefined) {
      if (draft.localTime === null || response.status !== 200) throw invalidResponse();
      const evidence = parseEvidence(payload.evidence, draft, selectedLocation, options);
      const base = resolutionBase(
        draft,
        selectedLocation,
        evidence.authority.timezoneDatabaseVersion,
        evidence.authority.profileId
      );
      return {
        ...base,
        localTime: draft.localTime,
        resolvedUtcInstant: evidence.resolvedUtcInstant,
        utcOffsetSeconds: evidence.utcOffsetSeconds,
        ambiguityStatus: 'EXACT',
        timeResolutionEvidence: evidence
      };
    }

    if (
      this.endpoint === DEVELOPMENT_RESOLUTION_ENDPOINT &&
      payload.outcome === 'VERIFIED' &&
      isRecord(payload.resolution)
    ) {
      if (response.status !== 200) throw invalidResponse();
      const authority = parseAuthorityMetadata(payload.authority);
      const instant = payload.resolution.resolvedUtcInstant;
      const offset = payload.resolution.utcOffsetSeconds;
      if (
        draft.localTime === null ||
        !isUtcInstant(instant) ||
        !Number.isSafeInteger(offset)
      ) throw invalidResponse();
      return {
        ...resolutionBase(draft, selectedLocation, authority.timezoneDatabaseVersion, authority.profileId),
        localTime: draft.localTime,
        resolvedUtcInstant: instant,
        utcOffsetSeconds: offset as number,
        ambiguityStatus: 'EXACT'
      };
    }

    if (
      payload.outcome !== 'REJECTED' ||
      (response.status !== 422 && response.status !== 503)
    ) throw invalidResponse();
    const authority = parseAuthorityMetadata(payload.authority);
    return rejectedResolution(payload, response, draft, selectedLocation, authority);
  }
}

/** Kept on the isolated chart-development endpoint for existing research pages. */
export class ServerBackedDevelopmentBirthInputResolver extends ServerBackedBirthInputResolver {
  public constructor(fetchImplementation: typeof globalThis.fetch = globalThis.fetch) {
    super(fetchImplementation, DEVELOPMENT_RESOLUTION_ENDPOINT);
  }
}
