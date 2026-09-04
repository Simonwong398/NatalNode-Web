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
  type LocationResolutionClient
} from './location-resolution-client';

export interface UseLocationResolutionOptions {
  readonly client?: LocationResolutionClient;
  readonly debounceMs?: number;
  readonly locale?: SupportedLocale;
  readonly minimumQueryCharacters?: number;
}

export interface LocationResolutionController {
  readonly resolution: LocationResolutionViewState;
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const requestSequenceRef = useRef(0);

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
      if (rawQuery.trim() === '') {
        return;
      }

      if (Array.from(rawQuery.trim()).length < minimumQueryCharacters) {
        setResolution(markLocationUnresolved(searching));
        return;
      }

      timerRef.current = setTimeout(async () => {
        timerRef.current = undefined;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const result = await client.search(
            { query: rawQuery.trim(), locale },
            controller.signal
          );

          if (
            requestSequenceRef.current !== requestSequence ||
            controller.signal.aborted
          ) {
            return;
          }

          setResolution((current) =>
            result.state === 'UNRESOLVED'
              ? markLocationUnresolved(current)
              : applyLocationCandidates(current, result.candidates)
          );
        } catch (error) {
          if (
            requestSequenceRef.current !== requestSequence ||
            isAbortError(error)
          ) {
            return;
          }

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
    [cancelPendingRequest, client, debounceMs, locale, minimumQueryCharacters]
  );

  const selectCandidate = useCallback(
    (candidate: LocationCandidate) => {
      requestSequenceRef.current += 1;
      const requestSequence = requestSequenceRef.current;
      cancelPendingRequest();

      setResolution((current) => searchingWithCandidates(current));
      const controller = new AbortController();
      abortControllerRef.current = controller;

      void client
        .resolve(
          { candidateId: candidate.candidateId, locale },
          controller.signal
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
        })
        .catch((error: unknown) => {
          if (
            requestSequenceRef.current !== requestSequence ||
            isAbortError(error)
          ) {
            return;
          }

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
    [cancelPendingRequest, client, locale]
  );

  useEffect(() => cancelPendingRequest, [cancelPendingRequest]);

  return { resolution, setRawQuery, selectCandidate };
}
