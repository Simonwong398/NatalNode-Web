import type { LocationResolutionState } from './location-resolution';
import type {
  LocationClientErrorKind,
  LocationClientStage
} from './location-resolution-client';

export interface LocationResolutionDiagnostics {
  readonly requestGeneration: number;
  readonly resolutionState: LocationResolutionState;
  readonly lastHttpStatus: number | null;
  readonly candidateCount: number;
  readonly lastClientStage: LocationClientStage;
  readonly lastErrorKind: LocationClientErrorKind;
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
    panelMounted: false
  });

export function updateLocationResolutionDiagnostics(
  current: LocationResolutionDiagnostics,
  patch: Partial<LocationResolutionDiagnostics>
): LocationResolutionDiagnostics {
  return Object.freeze({ ...current, ...patch });
}
