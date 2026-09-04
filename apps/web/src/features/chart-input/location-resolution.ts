/**
 * Browser-facing location state. The raw query and the selected canonical
 * record are deliberately separate so typed text never becomes authority.
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

export interface LocationAuthority {
  readonly kind: 'GEOCODING';
  readonly sourceId: string;
  readonly recordId: string;
}

export interface LocationSourceMetadata {
  readonly sourceVersion: string | null;
  readonly datasetVersion: string | null;
}

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

export interface LocationResolutionViewState {
  readonly state: LocationResolutionState;
  readonly rawQuery: string;
  readonly candidates: readonly LocationCandidate[];
  readonly selectedLocation: CanonicalResolvedLocation | null;
  readonly errorMessage: string | null;
}

export const EMPTY_LOCATION_RESOLUTION_STATE: LocationResolutionViewState =
  Object.freeze({
    state: 'EMPTY' as const,
    rawQuery: '',
    candidates: Object.freeze([]) as readonly LocationCandidate[],
    selectedLocation: null,
    errorMessage: null
  });

export function beginLocationSearch(
  rawQuery: string
): LocationResolutionViewState {
  return Object.freeze({
    state: rawQuery.trim() === '' ? ('EMPTY' as const) : ('SEARCHING' as const),
    rawQuery,
    candidates: Object.freeze([]) as readonly LocationCandidate[],
    selectedLocation: null,
    errorMessage: null
  });
}

export function applyLocationCandidates(
  current: LocationResolutionViewState,
  candidates: readonly LocationCandidate[]
): LocationResolutionViewState {
  const safeCandidates = Object.freeze([...candidates]);
  const state =
    safeCandidates.length > 1
      ? 'AMBIGUOUS'
      : safeCandidates.length === 1
        ? 'CANDIDATES'
        : 'UNRESOLVED';

  return Object.freeze({
    state,
    rawQuery: current.rawQuery,
    candidates: safeCandidates,
    selectedLocation: null,
    errorMessage: null
  });
}

export function selectCanonicalLocation(
  current: LocationResolutionViewState,
  location: CanonicalResolvedLocation
): LocationResolutionViewState {
  return Object.freeze({
    state: 'RESOLVED' as const,
    rawQuery: current.rawQuery,
    candidates: current.candidates,
    selectedLocation: location,
    errorMessage: null
  });
}

export function markLocationUnresolved(
  current: LocationResolutionViewState
): LocationResolutionViewState {
  return Object.freeze({
    state: 'UNRESOLVED' as const,
    rawQuery: current.rawQuery,
    candidates: Object.freeze([]) as readonly LocationCandidate[],
    selectedLocation: null,
    errorMessage: null
  });
}

export function markLocationError(
  current: LocationResolutionViewState,
  errorMessage: string
): LocationResolutionViewState {
  return Object.freeze({
    state: 'ERROR' as const,
    rawQuery: current.rawQuery,
    candidates: Object.freeze([]) as readonly LocationCandidate[],
    selectedLocation: null,
    errorMessage
  });
}

/** Production chart submission is possible only after explicit selection. */
export function canSubmitProductionCalculation(
  state: LocationResolutionViewState
): boolean {
  return state.state === 'RESOLVED' && state.selectedLocation?.status === 'RESOLVED';
}
