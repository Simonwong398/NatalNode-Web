import type { SupportedLocale } from '../../lib/localization.js';
import type {
  CanonicalResolvedLocation,
  LocationCandidate,
  LocationCoordinates,
  LocationSourceMetadata
} from './location-resolution.js';

const LOCATION_SEARCH_ENDPOINT = '/api/location/search';
const LOCATION_RESOLVE_ENDPOINT = '/api/location/resolve';
const MAXIMUM_TEXT_CHARACTERS = 256;
const MAXIMUM_TIMEZONE_CHARACTERS = 128;
const IANA_TIMEZONE_PATTERN = /^(?:UTC|GMT|[A-Za-z0-9._+-]+(?:\/[A-Za-z0-9._+-]+)+)$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

export interface LocationSearchClientResult {
  readonly state: 'CANDIDATES' | 'UNRESOLVED';
  readonly candidates: readonly LocationCandidate[];
}

export interface LocationResolutionClient {
  search(
    input: { readonly query: string; readonly locale: SupportedLocale },
    signal?: AbortSignal
  ): Promise<LocationSearchClientResult>;
  resolve(
    input: { readonly candidateId: string; readonly locale: SupportedLocale },
    signal?: AbortSignal
  ): Promise<CanonicalResolvedLocation | null>;
}

export class LocationResolutionClientError extends Error {
  public constructor() {
    super('Location resolution is unavailable.');
    this.name = 'LocationResolutionClientError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, maximum = MAXIMUM_TEXT_CHARACTERS): value is string {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Array.from(value).length <= maximum &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function parseCoordinates(value: unknown, nullable: boolean): LocationCoordinates | null {
  if (nullable && value === null) {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    value.latitude < -90 ||
    value.latitude > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    value.longitude < -180 ||
    value.longitude > 180
  ) {
    throw new LocationResolutionClientError();
  }

  return Object.freeze({
    latitude: value.latitude,
    longitude: value.longitude
  });
}

function parseAuthority(value: unknown) {
  if (
    !isRecord(value) ||
    value.kind !== 'GEOCODING' ||
    !isBoundedString(value.sourceId) ||
    !isBoundedString(value.recordId)
  ) {
    throw new LocationResolutionClientError();
  }

  return Object.freeze({
    kind: 'GEOCODING' as const,
    sourceId: value.sourceId,
    recordId: value.recordId
  });
}

function parseSource(value: unknown): LocationSourceMetadata {
  if (!isRecord(value)) {
    throw new LocationResolutionClientError();
  }

  const sourceVersion = value.sourceVersion;
  const datasetVersion = value.datasetVersion;
  if (
    (sourceVersion !== null && !isBoundedString(sourceVersion)) ||
    (datasetVersion !== null && !isBoundedString(datasetVersion))
  ) {
    throw new LocationResolutionClientError();
  }

  let attribution: LocationSourceMetadata['attribution'];
  if (value.attribution === undefined || value.attribution === null) {
    attribution = value.attribution === null ? null : undefined;
  } else if (
    isRecord(value.attribution) &&
    isBoundedString(value.attribution.label) &&
    isBoundedString(value.attribution.url) &&
    value.attribution.url.startsWith('https://')
  ) {
    attribution = Object.freeze({
      label: value.attribution.label,
      url: value.attribution.url
    });
  } else {
    throw new LocationResolutionClientError();
  }

  return Object.freeze({
    sourceVersion,
    datasetVersion,
    ...(attribution === undefined ? {} : { attribution })
  });
}

function parseCandidate(value: unknown): LocationCandidate {
  if (!isRecord(value)) {
    throw new LocationResolutionClientError();
  }

  const locality = value.locality;
  const region = value.region;
  const countryCode = value.countryCode;
  if (
    !isBoundedString(value.candidateId) ||
    !isBoundedString(value.canonicalDisplayName) ||
    (locality !== null && !isBoundedString(locality)) ||
    (region !== null && !isBoundedString(region)) ||
    !isBoundedString(value.country) ||
    (countryCode !== null && !isBoundedString(countryCode, 16))
  ) {
    throw new LocationResolutionClientError();
  }

  return Object.freeze({
    candidateId: value.candidateId,
    canonicalDisplayName: value.canonicalDisplayName,
    locality,
    region,
    country: value.country,
    countryCode,
    coordinates: parseCoordinates(value.coordinates, true),
    authority: parseAuthority(value.authority),
    source: parseSource(value.source)
  });
}

function parseResolvedLocation(value: unknown): CanonicalResolvedLocation {
  if (!isRecord(value)) {
    throw new LocationResolutionClientError();
  }

  const candidate = parseCandidate({
    ...value,
    candidateId: value.resolutionId
  });

  if (
    !isBoundedString(value.resolutionId) ||
    !isBoundedString(value.ianaTimeZone, MAXIMUM_TIMEZONE_CHARACTERS) ||
    !IANA_TIMEZONE_PATTERN.test(value.ianaTimeZone) ||
    value.status !== 'RESOLVED'
  ) {
    throw new LocationResolutionClientError();
  }

  return Object.freeze({
    resolutionId: value.resolutionId,
    canonicalDisplayName: candidate.canonicalDisplayName,
    locality: candidate.locality,
    region: candidate.region,
    country: candidate.country,
    countryCode: candidate.countryCode,
    coordinates: parseCoordinates(value.coordinates, false)!,
    ianaTimeZone: value.ianaTimeZone,
    status: 'RESOLVED' as const,
    authority: candidate.authority,
    source: candidate.source
  });
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError') ||
    (isRecord(error) && error.name === 'AbortError')
  );
}

export class FetchLocationResolutionClient implements LocationResolutionClient {
  public constructor(
    private readonly fetchImplementation: typeof globalThis.fetch = globalThis.fetch
  ) {
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('A native fetch implementation is required.');
    }
  }

  public async search(
    input: { readonly query: string; readonly locale: SupportedLocale },
    signal?: AbortSignal
  ): Promise<LocationSearchClientResult> {
    const payload = await this.post(LOCATION_SEARCH_ENDPOINT, input, signal);
    if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
      throw new LocationResolutionClientError();
    }

    const candidates = Object.freeze(payload.candidates.map(parseCandidate));
    if (
      payload.state !== 'CANDIDATES' &&
      payload.state !== 'UNRESOLVED'
    ) {
      throw new LocationResolutionClientError();
    }

    if (
      payload.state === 'CANDIDATES' && candidates.length === 0 ||
      payload.state === 'UNRESOLVED' && candidates.length > 0
    ) {
      throw new LocationResolutionClientError();
    }

    return Object.freeze({ state: payload.state, candidates });
  }

  public async resolve(
    input: { readonly candidateId: string; readonly locale: SupportedLocale },
    signal?: AbortSignal
  ): Promise<CanonicalResolvedLocation | null> {
    const payload = await this.post(LOCATION_RESOLVE_ENDPOINT, input, signal);
    if (!isRecord(payload)) {
      throw new LocationResolutionClientError();
    }

    if (payload.state === 'UNRESOLVED') {
      return null;
    }

    if (payload.state !== 'RESOLVED' || !('location' in payload)) {
      throw new LocationResolutionClientError();
    }

    return parseResolvedLocation(payload.location);
  }

  private async post(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal
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
        body: JSON.stringify(body),
        signal
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new LocationResolutionClientError();
    }

    if (!response.ok) {
      throw new LocationResolutionClientError();
    }

    try {
      return await response.json();
    } catch (_error) {
      throw new LocationResolutionClientError();
    }
  }
}

export function createLocationResolutionClient(): LocationResolutionClient {
  return new FetchLocationResolutionClient();
}
