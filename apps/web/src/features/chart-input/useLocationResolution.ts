import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_LOCALE, type SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '@/core/chart/chart-ui';
import {
  applyLocationCandidates,
  beginLocationSearch,
  EMPTY_LOCATION_RESOLUTION_STATE,
  markLocationError,
  markLocationUnresolved,
  selectCanonicalLocation,
  LOCATION_SEARCH_DEBOUNCE_MS,
  LOCATION_SEARCH_MINIMUM_CHARACTERS,
  type LocationCandidate,
  type LocationResolutionViewState
} from './location-resolution';
import {
  createLocationResolutionClient,
  LocationResolutionClientError,
  type LocationResolutionClient,
  type LocationResolutionClientDiagnosticEvent,
  type LocationSearchClientResult
} from './location-resolution-client';
import {
  EMPTY_LOCATION_RESOLUTION_DIAGNOSTICS,
  updateLocationResolutionDiagnostics,
  type LocationResolutionDiagnostics
} from './location-resolution-diagnostics';

export interface UseLocationResolutionOptions {
  readonly client?: LocationResolutionClient;
  readonly debounceMs?: number;
  readonly locale?: SupportedLocale;
  readonly minimumQueryCharacters?: number;
}

export interface LocationResolutionController {
  readonly diagnostics: LocationResolutionDiagnostics;
  readonly resolution: LocationResolutionViewState;
  readonly setPanelMounted: (mounted: boolean) => void;
  readonly setRawQuery: (rawQuery: string) => void;
  readonly selectCandidate: (candidate: LocationCandidate) => void;
}

const defaultClient = createLocationResolutionClient();

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError')
  );
}

function searchingWithCandidates(
  current: LocationResolutionViewState
): LocationResolutionViewState {
  return Object.freeze({
    ...current,
    state: 'SEARCHING' as const,
    selectedLocation: null,
    errorMessage: null
  });
}

function resolutionStateForSearchResult(
  result: LocationSearchClientResult
): LocationResolutionViewState['state'] {
  if (result.state === 'UNRESOLVED' || result.candidates.length === 0) {
    return 'UNRESOLVED';
  }

  return result.candidates.length > 1 ? 'AMBIGUOUS' : 'CANDIDATES';
}

function isDiagnosticFailureStage(
  stage: LocationResolutionClientDiagnosticEvent['stage']
): boolean {
  return (
    stage === 'NETWORK_FAILED' ||
    stage === 'HTTP_FAILED' ||
    stage === 'JSON_PARSE_FAILED' ||
    stage === 'CONTRACT_PARSE_FAILED'
  );
}

function applyClientDiagnosticEvent(
  current: LocationResolutionDiagnostics,
  event: LocationResolutionClientDiagnosticEvent
): LocationResolutionDiagnostics {
  return updateLocationResolutionDiagnostics(current, {
    lastClientStage: event.stage,
    lastErrorKind: event.errorKind,
    lastHttpStatus: event.httpStatus,
    ...(event.candidateCount === undefined
      ? {}
      : { candidateCount: event.candidateCount }),
    ...(isDiagnosticFailureStage(event.stage)
      ? { resolutionState: 'ERROR' as const }
      : {})
  });
}

function diagnosticFailureFromError(error: unknown): Pick<
  LocationResolutionDiagnostics,
  'lastClientStage' | 'lastErrorKind' | 'lastHttpStatus'
> {
  if (error instanceof LocationResolutionClientError) {
    return {
      lastClientStage: error.stage,
      lastErrorKind: error.kind,
      lastHttpStatus: error.httpStatus
    };
  }

  return {
    lastClientStage: 'UNKNOWN',
    lastErrorKind: 'UNKNOWN',
    lastHttpStatus: null
  };
}

export function useLocationResolution(
  options: UseLocationResolutionOptions = {}
): LocationResolutionController {
  const client = options.client ?? defaultClient;
  const locale = options.locale ?? DEFAULT_LOCALE;
  const debounceMs = options.debounceMs ?? LOCATION_SEARCH_DEBOUNCE_MS;
  const minimumQueryCharacters =
    options.minimumQueryCharacters ?? LOCATION_SEARCH_MINIMUM_CHARACTERS;
  const [resolution, setResolution] = useState<LocationResolutionViewState>(
    EMPTY_LOCATION_RESOLUTION_STATE
  );
  const [diagnostics, setDiagnostics] = useState<LocationResolutionDiagnostics>(
    EMPTY_LOCATION_RESOLUTION_DIAGNOSTICS
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const requestSequenceRef = useRef(0);

  const updateDiagnosticsForGeneration = useCallback(
    (
      requestGeneration: number,
      patch: Partial<LocationResolutionDiagnostics>
    ) => {
      setDiagnostics((current) =>
        current.requestGeneration === requestGeneration
          ? updateLocationResolutionDiagnostics(current, patch)
          : current
      );
    },
    []
  );

  const startDiagnosticsGeneration = useCallback(
    (
      requestGeneration: number,
      patch: Partial<LocationResolutionDiagnostics>
    ) => {
      setDiagnostics((current) =>
        updateLocationResolutionDiagnostics(current, {
          ...patch,
          requestGeneration
        })
      );
    },
    []
  );

  const recordClientDiagnosticEvent = useCallback(
    (
      requestGeneration: number,
      event: LocationResolutionClientDiagnosticEvent
    ) => {
      setDiagnostics((current) =>
        current.requestGeneration === requestGeneration
          ? applyClientDiagnosticEvent(current, event)
          : current
      );
    },
    []
  );

  const setPanelMounted = useCallback((mounted: boolean) => {
    setDiagnostics((current) =>
      updateLocationResolutionDiagnostics(current, { panelMounted: mounted })
    );
  }, []);

  const cancelPendingRequest = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = undefined;
  }, []);

  const setRawQuery = useCallback(
    (rawQuery: string) => {
      requestSequenceRef.current += 1;
      const requestSequence = requestSequenceRef.current;
      cancelPendingRequest();

      const searching = beginLocationSearch(rawQuery);
      setResolution(searching);
      startDiagnosticsGeneration(requestSequence, {
        resolutionState: searching.state,
        lastHttpStatus: null,
        candidateCount: 0,
        lastClientStage: rawQuery.trim() === '' ? 'IDLE' : 'DEBOUNCE_PENDING',
        lastErrorKind: 'NONE'
      });
      if (rawQuery.trim() === '') {
        return;
      }

      if (Array.from(rawQuery.trim()).length < minimumQueryCharacters) {
        const unresolved = markLocationUnresolved(searching);
        setResolution(unresolved);
        updateDiagnosticsForGeneration(requestSequence, {
          resolutionState: unresolved.state,
          lastClientStage: 'IDLE'
        });
        return;
      }

      timerRef.current = setTimeout(async () => {
        timerRef.current = undefined;
        if (requestSequenceRef.current !== requestSequence) {
          return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        updateDiagnosticsForGeneration(requestSequence, {
          lastClientStage: 'REQUEST_STARTED',
          lastErrorKind: 'NONE',
          lastHttpStatus: null
        });

        try {
          const result = await client.search(
            { query: rawQuery.trim(), locale },
            controller.signal,
            (event) => recordClientDiagnosticEvent(requestSequence, event)
          );

          if (
            requestSequenceRef.current !== requestSequence ||
            controller.signal.aborted
          ) {
            return;
          }

          const nextState = resolutionStateForSearchResult(result);
          setResolution((current) =>
            result.state === 'UNRESOLVED'
              ? markLocationUnresolved(current)
              : applyLocationCandidates(current, result.candidates)
          );
          updateDiagnosticsForGeneration(requestSequence, {
            resolutionState: nextState,
            candidateCount: result.candidates.length,
            lastClientStage:
              result.state === 'CANDIDATES'
                ? 'CANDIDATES_ACCEPTED'
                : 'RESPONSE_PARSED',
            lastErrorKind: 'NONE'
          });
        } catch (error) {
          if (
            requestSequenceRef.current !== requestSequence ||
            controller.signal.aborted ||
            isAbortError(error)
          ) {
            return;
          }

          updateDiagnosticsForGeneration(requestSequence, {
            ...diagnosticFailureFromError(error),
            resolutionState: 'ERROR'
          });
          setResolution((current) =>
            markLocationError(
              current,
              chartUi(locale, 'birthInput.location.errorMessage')
            )
          );
        } finally {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = undefined;
          }
        }
      }, debounceMs);
    },
    [
      cancelPendingRequest,
      client,
      debounceMs,
      locale,
      minimumQueryCharacters,
      recordClientDiagnosticEvent,
      startDiagnosticsGeneration,
      updateDiagnosticsForGeneration
    ]
  );

  const selectCandidate = useCallback(
    (candidate: LocationCandidate) => {
      requestSequenceRef.current += 1;
      const requestSequence = requestSequenceRef.current;
      cancelPendingRequest();

      setResolution((current) => searchingWithCandidates(current));
      startDiagnosticsGeneration(requestSequence, {
        resolutionState: 'SEARCHING',
        lastHttpStatus: null,
        lastClientStage: 'RESOLVE_STARTED',
        lastErrorKind: 'NONE'
      });
      const controller = new AbortController();
      abortControllerRef.current = controller;

      void client
        .resolve(
          { candidateId: candidate.candidateId, locale },
          controller.signal,
          (event) => recordClientDiagnosticEvent(requestSequence, event)
        )
        .then((location) => {
          if (
            requestSequenceRef.current !== requestSequence ||
            controller.signal.aborted
          ) {
            return;
          }

          setResolution((current) =>
            location === null
              ? markLocationUnresolved(current)
              : selectCanonicalLocation(current, location)
          );
          updateDiagnosticsForGeneration(requestSequence, {
            resolutionState: location === null ? 'UNRESOLVED' : 'RESOLVED',
            lastClientStage: location === null ? 'RESPONSE_PARSED' : 'RESOLVED_ACCEPTED',
            lastErrorKind: 'NONE'
          });
        })
        .catch((error: unknown) => {
          if (
            requestSequenceRef.current !== requestSequence ||
            controller.signal.aborted ||
            isAbortError(error)
          ) {
            return;
          }

          updateDiagnosticsForGeneration(requestSequence, {
            ...diagnosticFailureFromError(error),
            resolutionState: 'ERROR'
          });
          setResolution((current) =>
            markLocationError(
              current,
              chartUi(locale, 'birthInput.location.errorMessage')
            )
          );
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = undefined;
          }
        });
    },
    [
      cancelPendingRequest,
      client,
      locale,
      recordClientDiagnosticEvent,
      startDiagnosticsGeneration,
      updateDiagnosticsForGeneration
    ]
  );

  useEffect(() => {
    return () => {
      requestSequenceRef.current += 1;
      cancelPendingRequest();
    };
  }, [cancelPendingRequest]);

  return {
    diagnostics,
    resolution,
    setPanelMounted,
    setRawQuery,
    selectCandidate
  };
}
