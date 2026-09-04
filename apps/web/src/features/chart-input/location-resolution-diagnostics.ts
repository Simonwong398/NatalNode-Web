import type { LocationResolutionState } from './location-resolution';
import type {
  LocationClientErrorKind,
  LocationClientStage,
  LocationFetchExceptionName,
  LocationRequestOriginRelation,
  LocationRequestTarget,
  LocationSignalState
} from './location-resolution-client';

export interface LocationResolutionDiagnostics {
  readonly requestGeneration: number;
  readonly resolutionState: LocationResolutionState;
  readonly lastHttpStatus: number | null;
  readonly candidateCount: number;
  readonly lastClientStage: LocationClientStage;
  readonly lastErrorKind: LocationClientErrorKind;
  readonly fetchExceptionName: LocationFetchExceptionName | null;
  readonly signalStateAtDispatch: LocationSignalState | null;
  readonly requestOrigin: LocationRequestOriginRelation | null;
  readonly requestTarget: LocationRequestTarget | null;
  readonly panelMounted: boolean;
}

export const EMPTY_LOCATION_RESOLUTION_DIAGNOSTICS: LocationResolutionDiagnostics =
  Object.freeze({
    requestGeneration: 0,
    resolutionState: 'EMPTY',
    lastHttpStatus: null,
    candidateCount: 0,
    lastClientStage: 'IDLE',
    lastErrorKind: 'NONE',
    fetchExceptionName: null,
    signalStateAtDispatch: null,
    requestOrigin: null,
    requestTarget: null,
    panelMounted: false
  });

export function updateLocationResolutionDiagnostics(
  current: LocationResolutionDiagnostics,
  patch: Partial<LocationResolutionDiagnostics>
): LocationResolutionDiagnostics {
  return Object.freeze({ ...current, ...patch });
}
