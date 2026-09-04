import {
  LOCATION_SUPPORTED_LOCALES,
  type CanonicalResolvedLocation,
  type LocationCandidate,
  type LocationLocale
} from '@natalnode/contracts';

export const LOCATION_PROVIDER_TIMEOUT_MS = 1_500;
export const LOCATION_RESOLUTION_ID_MAXIMUM_CHARACTERS = 256;
export const LOCATION_DISPLAY_MAXIMUM_CHARACTERS = 256;
export const LOCATION_TIMEZONE_MAXIMUM_CHARACTERS = 128;

export interface GeocodingProvider {
  search(
    query: string,
    locale: LocationLocale
  ): Promise<readonly LocationCandidate[]>;
  resolve(
    candidateId: string,
    locale: LocationLocale
  ): Promise<CanonicalResolvedLocation | null>;
}

export interface LocationSearchInput {
  readonly query: string;
  readonly locale: LocationLocale;
}

export interface LocationResolveInput {
  readonly candidateId: string;
  readonly locale: LocationLocale;
}

export type LocationSearchOutcome = {
  readonly state: 'CANDIDATES' | 'UNRESOLVED';
  readonly candidates: readonly LocationCandidate[];
};

export type LocationResolveOutcome =
  | {
      readonly state: 'RESOLVED';
      readonly location: CanonicalResolvedLocation;
    }
  | {
      readonly state: 'UNRESOLVED';
    };

export interface LocationResolutionService {
  search(input: LocationSearchInput): Promise<LocationSearchOutcome>;
  resolve(input: LocationResolveInput): Promise<LocationResolveOutcome>;
  getResolvedLocation(resolutionId: string): CanonicalResolvedLocation | null;
}

export class LocationResolutionProviderUnavailableError extends Error {
  public constructor() {
    super('Location resolution provider is unavailable.');
    this.name = 'LocationResolutionProviderUnavailableError';
  }
}

export class InvalidLocationProviderDataError extends Error {
  public constructor() {
    super('Location resolution provider data is invalid.');
    this.name = 'InvalidLocationProviderDataError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedString(
  value: unknown,
  maximumCharacters: number,
  allowEmpty = false
): value is string {
  return (
    typeof value === 'string' &&
    Array.from(value).length <= maximumCharacters &&
    (allowEmpty || value.trim() !== '') &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value)
  );
}

function isNullableBoundedString(value: unknown, maximumCharacters: number): boolean {
  return value === null || isBoundedString(value, maximumCharacters);
}

function isLocationLocale(value: unknown): value is LocationLocale {
  return LOCATION_SUPPORTED_LOCALES.some((locale) => locale === value);
}

function isCoordinatePair(value: unknown, nullable: boolean): boolean {
  if (nullable && value === null) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function isAuthority(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.kind === 'GEOCODING' &&
    isBoundedString(value.sourceId, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isBoundedString(value.recordId, LOCATION_DISPLAY_MAXIMUM_CHARACTERS)
  );
}

function isSourceMetadata(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNullableBoundedString(value.sourceVersion, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.datasetVersion, LOCATION_DISPLAY_MAXIMUM_CHARACTERS)
  );
}

function isLocationCandidate(value: unknown): value is LocationCandidate {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoundedString(value.candidateId, LOCATION_RESOLUTION_ID_MAXIMUM_CHARACTERS) &&
    isBoundedString(value.canonicalDisplayName, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.locality, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.region, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isBoundedString(value.country, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.countryCode, 16) &&
    isCoordinatePair(value.coordinates, true) &&
    isAuthority(value.authority) &&
    isSourceMetadata(value.source)
  );
}

function isCanonicalResolvedLocation(
  value: unknown
): value is CanonicalResolvedLocation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoundedString(value.resolutionId, LOCATION_RESOLUTION_ID_MAXIMUM_CHARACTERS) &&
    isBoundedString(value.canonicalDisplayName, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.locality, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.region, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isBoundedString(value.country, LOCATION_DISPLAY_MAXIMUM_CHARACTERS) &&
    isNullableBoundedString(value.countryCode, 16) &&
    isCoordinatePair(value.coordinates, false) &&
    isBoundedString(value.ianaTimeZone, LOCATION_TIMEZONE_MAXIMUM_CHARACTERS) &&
    value.status === 'RESOLVED' &&
    isAuthority(value.authority) &&
    isSourceMetadata(value.source)
  );
}

function cloneSource(value: CanonicalResolvedLocation['source']): CanonicalResolvedLocation['source'] {
  return Object.freeze({
    sourceVersion: value.sourceVersion,
    datasetVersion: value.datasetVersion
  });
}

function cloneAuthority(
  value: CanonicalResolvedLocation['authority']
): CanonicalResolvedLocation['authority'] {
  return Object.freeze({
    kind: 'GEOCODING' as const,
    sourceId: value.sourceId,
    recordId: value.recordId
  });
}

function cloneCandidate(value: LocationCandidate): LocationCandidate {
  return Object.freeze({
    candidateId: value.candidateId,
    canonicalDisplayName: value.canonicalDisplayName,
    locality: value.locality,
    region: value.region,
    country: value.country,
    countryCode: value.countryCode,
    coordinates:
      value.coordinates === null
        ? null
        : Object.freeze({
            latitude: value.coordinates.latitude,
            longitude: value.coordinates.longitude
          }),
    authority: cloneAuthority(value.authority),
    source: cloneSource(value.source)
  });
}

function cloneResolvedLocation(
  value: CanonicalResolvedLocation
): CanonicalResolvedLocation {
  return Object.freeze({
    resolutionId: value.resolutionId,
    canonicalDisplayName: value.canonicalDisplayName,
    locality: value.locality,
    region: value.region,
    country: value.country,
    countryCode: value.countryCode,
    coordinates: Object.freeze({
      latitude: value.coordinates.latitude,
      longitude: value.coordinates.longitude
    }),
    ianaTimeZone: value.ianaTimeZone,
    status: 'RESOLVED' as const,
    authority: cloneAuthority(value.authority),
    source: cloneSource(value.source)
  });
}

function assertSearchInput(input: LocationSearchInput): void {
  if (
    !isBoundedString(input.query, 160) ||
    !isLocationLocale(input.locale)
  ) {
    throw new TypeError('Location search input is invalid.');
  }
}

function assertResolveInput(input: LocationResolveInput): void {
  if (
    !isBoundedString(input.candidateId, LOCATION_RESOLUTION_ID_MAXIMUM_CHARACTERS) ||
    !isLocationLocale(input.locale)
  ) {
    throw new TypeError('Location resolve input is invalid.');
  }
}

async function withProviderDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new LocationResolutionProviderUnavailableError()),
      timeoutMs
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } catch (error) {
    if (error instanceof LocationResolutionProviderUnavailableError) {
      throw error;
    }

    throw new LocationResolutionProviderUnavailableError();
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Provider-neutral application service. It validates the provider boundary,
 * keeps resolved selections in process memory for the current composition,
 * and deliberately records no raw query or birth data.
 */
export class ProviderLocationResolutionService
  implements LocationResolutionService
{
  private readonly resolvedLocations = new Map<
    string,
    CanonicalResolvedLocation
  >();

  public constructor(
    private readonly provider: GeocodingProvider,
    private readonly providerTimeoutMs = LOCATION_PROVIDER_TIMEOUT_MS
  ) {
    if (
      !Number.isSafeInteger(providerTimeoutMs) ||
      providerTimeoutMs <= 0
    ) {
      throw new RangeError('Location provider timeout must be positive.');
    }
  }

  public async search(
    input: LocationSearchInput
  ): Promise<LocationSearchOutcome> {
    assertSearchInput(input);

    let candidates: readonly LocationCandidate[];
    try {
      candidates = await withProviderDeadline(
        this.provider.search(input.query, input.locale),
        this.providerTimeoutMs
      );
    } catch (error) {
      if (error instanceof InvalidLocationProviderDataError) {
        throw error;
      }
      throw new LocationResolutionProviderUnavailableError();
    }

    if (!Array.isArray(candidates) || !candidates.every(isLocationCandidate)) {
      throw new InvalidLocationProviderDataError();
    }

    const safeCandidates = Object.freeze(candidates.map(cloneCandidate));

    return safeCandidates.length === 0
      ? { state: 'UNRESOLVED', candidates: safeCandidates }
      : { state: 'CANDIDATES', candidates: safeCandidates };
  }

  public async resolve(
    input: LocationResolveInput
  ): Promise<LocationResolveOutcome> {
    assertResolveInput(input);

    let location: CanonicalResolvedLocation | null;
    try {
      location = await withProviderDeadline(
        this.provider.resolve(input.candidateId, input.locale),
        this.providerTimeoutMs
      );
    } catch (error) {
      if (error instanceof InvalidLocationProviderDataError) {
        throw error;
      }
      throw new LocationResolutionProviderUnavailableError();
    }

    if (location === null) {
      return { state: 'UNRESOLVED' };
    }

    if (!isCanonicalResolvedLocation(location)) {
      throw new InvalidLocationProviderDataError();
    }

    const safeLocation = cloneResolvedLocation(location);
    this.resolvedLocations.set(safeLocation.resolutionId, safeLocation);

    return { state: 'RESOLVED', location: safeLocation };
  }

  public getResolvedLocation(
    resolutionId: string
  ): CanonicalResolvedLocation | null {
    if (!isBoundedString(resolutionId, LOCATION_RESOLUTION_ID_MAXIMUM_CHARACTERS)) {
      return null;
    }

    return this.resolvedLocations.get(resolutionId) ?? null;
  }
}

export function createProviderLocationResolutionService(
  provider: GeocodingProvider,
  providerTimeoutMs = LOCATION_PROVIDER_TIMEOUT_MS
): LocationResolutionService {
  return new ProviderLocationResolutionService(provider, providerTimeoutMs);
}
