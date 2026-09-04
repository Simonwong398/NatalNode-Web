/** The closed Web locale set accepted by the location-resolution boundary. */
export const LOCATION_SUPPORTED_LOCALES = [
  'en',
  'es',
  'fr',
  'de',
  'ja',
  'ko',
  'zh-Hant'
] as const;

export type LocationLocale = (typeof LOCATION_SUPPORTED_LOCALES)[number];

/**
 * A UI state, not a claim that a place has been geocoded. The raw query is
 * intentionally carried separately from the selected canonical location.
 */
export type LocationResolutionState =
  | 'EMPTY'
  | 'SEARCHING'
  | 'CANDIDATES'
  | 'RESOLVED'
  | 'AMBIGUOUS'
  | 'UNRESOLVED'
  | 'ERROR';

export interface LocationCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/** Provider-neutral authority identity. It must not expose vendor schema. */
export interface LocationAuthority {
  readonly kind: 'GEOCODING';
  readonly sourceId: string;
  readonly recordId: string;
}

/** Human-readable provenance that may be shown when a source-backed result is used. */
export interface LocationAttribution {
  readonly label: string;
  readonly url: string;
}

/** Versioned provenance for a canonical location record. */
export interface LocationSourceMetadata {
  readonly sourceVersion: string | null;
  readonly datasetVersion: string | null;
  readonly attribution?: LocationAttribution | null;
}

/** A search candidate is not authoritative until the user explicitly selects it. */
export interface LocationCandidate {
  readonly candidateId: string;
  readonly canonicalDisplayName: string;
  readonly locality: string | null;
  readonly region: string | null;
  readonly country: string;
  readonly countryCode: string | null;
  readonly coordinates: LocationCoordinates | null;
  readonly authority: LocationAuthority;
  readonly source: LocationSourceMetadata;
}

/**
 * The only location shape that can be attached to a production calculation.
 * The resolution ID is an opaque stable identity; display text is never used
 * as authority and no field is derived by title-casing the user's query.
 */
export interface CanonicalResolvedLocation {
  readonly resolutionId: string;
  readonly canonicalDisplayName: string;
  readonly locality: string | null;
  readonly region: string | null;
  readonly country: string;
  readonly countryCode: string | null;
  readonly coordinates: LocationCoordinates;
  readonly ianaTimeZone: string;
  readonly status: 'RESOLVED';
  readonly authority: LocationAuthority;
  readonly source: LocationSourceMetadata;
}

export interface LocationSearchApiRequest {
  readonly query: string;
  readonly locale: LocationLocale;
}

export interface LocationSearchApiResponse {
  readonly state: 'CANDIDATES' | 'UNRESOLVED';
  readonly candidates: readonly LocationCandidate[];
}

export interface LocationResolveApiRequest {
  readonly candidateId: string;
  readonly locale: LocationLocale;
}

export type LocationResolveApiResponse =
  | {
      readonly state: 'RESOLVED';
      readonly location: CanonicalResolvedLocation;
    }
  | {
      readonly state: 'UNRESOLVED';
    };
