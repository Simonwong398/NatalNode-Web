import type { CanonicalResolvedLocation } from './location-resolution';
import { BirthInputResolverError, type BirthInputResolver } from './resolver.js';
import type {
  AmbiguousTimeCandidate,
  BirthInputDraft,
  BirthInputResolution
} from './types';

const RESOLUTION_ENDPOINT = '/api/dev/chart/resolve-time';
const UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolutionBase(
  draft: BirthInputDraft,
  location: CanonicalResolvedLocation,
  timezoneDatabaseVersion: string,
  timezoneResolutionMethod: string
) {
  if (!isRecord(location.coordinates)) {
    throw new Error('A selected canonical location is required.');
  }

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

function parseCandidates(value: unknown): readonly [AmbiguousTimeCandidate, AmbiguousTimeCandidate] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error('The time-resolution response is invalid.');
  }
  const candidates = value.map((candidate) => {
    if (
      !isRecord(candidate) ||
      (candidate.occurrence !== 'EARLIER' && candidate.occurrence !== 'LATER') ||
      typeof candidate.resolvedUtcInstant !== 'string' ||
      !UTC_INSTANT_PATTERN.test(candidate.resolvedUtcInstant) ||
      !Number.isSafeInteger(candidate.utcOffsetSeconds)
    ) {
      throw new Error('The time-resolution response is invalid.');
    }
    return {
      occurrence: candidate.occurrence,
      resolvedUtcInstant: candidate.resolvedUtcInstant,
      utcOffsetSeconds: candidate.utcOffsetSeconds as number
    };
  });
  if (candidates[0].occurrence !== 'EARLIER' || candidates[1].occurrence !== 'LATER') {
    throw new Error('The time-resolution response is invalid.');
  }
  return candidates as unknown as readonly [AmbiguousTimeCandidate, AmbiguousTimeCandidate];
}

export class ServerBackedDevelopmentBirthInputResolver implements BirthInputResolver {
  private readonly fetchImplementation: typeof globalThis.fetch;

  public constructor(
    fetchImplementation: typeof globalThis.fetch = globalThis.fetch
  ) {
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('A browser fetch implementation is required.');
    }
    this.fetchImplementation = fetchImplementation.bind(globalThis);
  }

  public async resolve(
    draft: BirthInputDraft,
    selectedLocation?: CanonicalResolvedLocation | null
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
      response = await this.fetchImplementation(RESOLUTION_ENDPOINT, {
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
          disambiguation: 'REJECT',
          expectedTimezoneDatabaseVersion: null
        })
      });
    } catch {
      throw new BirthInputResolverError(
        'LOCAL_BFF_UNAVAILABLE',
        'The local birth-time verification service could not be reached.'
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new BirthInputResolverError(
        'INVALID_TIME_RESOLUTION_RESPONSE',
        'The local birth-time verification response was invalid.'
      );
    }
    if (
      !response.ok && isRecord(payload) && isRecord(payload.error) &&
      !(payload.outcome === 'REJECTED' && isRecord(payload.authority))
    ) {
      const code = payload.error.code;
      const safeCode = typeof code === 'string' && /^[A-Z0-9_]{1,64}$/u.test(code)
        ? code
        : 'LOCAL_BFF_REJECTED';
      throw new BirthInputResolverError(
        safeCode,
        `The local birth-time verification service rejected the request (${safeCode}).`
      );
    }
    if (
      !isRecord(payload) ||
      !isRecord(payload.authority) ||
      typeof payload.authority.timezoneDatabaseVersion !== 'string' ||
      typeof payload.authority.profileId !== 'string'
    ) {
      throw new BirthInputResolverError(
        'INVALID_TIME_RESOLUTION_RESPONSE',
        'The local birth-time verification response was invalid.'
      );
    }

    const base = resolutionBase(
      draft,
      selectedLocation,
      payload.authority.timezoneDatabaseVersion,
      payload.authority.profileId
    );

    if (payload.outcome === 'VERIFIED' && isRecord(payload.resolution)) {
      const instant = payload.resolution.resolvedUtcInstant;
      const offset = payload.resolution.utcOffsetSeconds;
      if (
        typeof instant !== 'string' || !UTC_INSTANT_PATTERN.test(instant) ||
        !Number.isSafeInteger(offset)
      ) {
        throw new BirthInputResolverError(
          'INVALID_TIME_RESOLUTION_RESPONSE',
          'The local birth-time verification response was invalid.'
        );
      }
      return {
        ...base,
        localTime: draft.localTime as string,
        resolvedUtcInstant: instant,
        utcOffsetSeconds: offset as number,
        ambiguityStatus: 'EXACT'
      };
    }

    if (payload.outcome !== 'REJECTED' || !isRecord(payload.error)) {
      throw new BirthInputResolverError(
        'INVALID_TIME_RESOLUTION_RESPONSE',
        'The local birth-time verification response was invalid.'
      );
    }

    switch (payload.error.code) {
      case 'AMBIGUOUS_LOCAL_TIME':
        return {
          ...base,
          localTime: draft.localTime as string,
          resolvedUtcInstant: null,
          utcOffsetSeconds: null,
          ambiguityStatus: 'AMBIGUOUS',
          candidates: parseCandidates(payload.error.candidates)
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
      default:
        if (!response.ok) {
          const code = typeof payload.error.code === 'string' &&
            /^[A-Z0-9_]{1,64}$/u.test(payload.error.code)
            ? payload.error.code
            : 'TIME_RESOLUTION_REJECTED';
          throw new BirthInputResolverError(
            code,
            `The local birth-time verification service rejected the request (${code}).`
          );
        }
        throw new BirthInputResolverError(
          'INVALID_TIME_RESOLUTION_RESPONSE',
          'The local birth-time verification response was invalid.'
        );
    }
  }
}
