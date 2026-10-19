import { useRef, useState } from 'react';
import { chartUi } from '@/core/chart/chart-ui';
import { DEFAULT_LOCALE, type SupportedLocale } from '@/lib/localization';
import {
  BirthInputResolverError,
  type BirthInputResolver,
  type BirthInputResolverOptions
} from './resolver.js';
import type { CanonicalResolvedLocation } from './location-resolution';
import type {
  AmbiguousTimeCandidate,
  BirthInputDraft,
  BirthInputResolution
} from './types';

function resolverErrorMessage(code: string, locale: SupportedLocale): string {
  switch (code) {
    case 'TIME_AUTHORITY_UNAVAILABLE':
    case 'TIME_AUTHORITY_DATA_INVALID':
      return chartUi(locale, 'quickChart.timeVerificationUnavailable');
    case 'LOCATION_RESOLUTION_UNAVAILABLE':
      return chartUi(locale, 'quickChart.locationVerificationUnavailable');
    case 'LOCATION_BINDING_MISMATCH':
      return chartUi(locale, 'quickChart.locationSelectionExpired');
    case 'UNSUPPORTED_TIME_RANGE':
      return chartUi(locale, 'quickChart.timeOutsideSupportedRange');
    default:
      return chartUi(locale, 'quickChart.verificationFailed');
  }
}

export function useBirthInputResolution(
  resolver: BirthInputResolver,
  initialResolution: BirthInputResolution | null = null,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  const [resolution, setResolution] = useState<BirthInputResolution | null>(
    initialResolution
  );
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const latestRequestRef = useRef(0);

  const clearResolutionError = () => {
    setResolutionError(null);
  };

  const invalidateResolution = () => {
    latestRequestRef.current += 1;
    setResolution(null);
    setResolutionError(null);
    setIsResolving(false);
  };

  const resolveDraft = async (
    draft: BirthInputDraft,
    onResolutionAccepted: (resolution: BirthInputResolution) => void,
    selectedLocation?: CanonicalResolvedLocation | null,
    resolverOptions?: BirthInputResolverOptions
  ): Promise<BirthInputResolution | null> => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsResolving(true);

    try {
      const nextResolution = await resolver.resolve(
        { ...draft },
        selectedLocation,
        resolverOptions
      );

      if (latestRequestRef.current !== requestId) {
        return null;
      }

      setResolution(nextResolution);
      onResolutionAccepted(nextResolution);
      return nextResolution;
    } catch (error) {
      if (latestRequestRef.current !== requestId) {
        return null;
      }

      setResolution(null);
      setResolutionError(
        resolverErrorMessage(
          error instanceof BirthInputResolverError ? error.code : 'UNKNOWN',
          locale
        )
      );
      return null;
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsResolving(false);
      }
    }
  };

  const selectCandidate = async (
    draft: BirthInputDraft,
    selectedLocation: CanonicalResolvedLocation | null,
    candidate: AmbiguousTimeCandidate
  ): Promise<Extract<BirthInputResolution, { ambiguityStatus: 'EXACT' }> | null> => {
    if (resolution?.ambiguityStatus !== 'AMBIGUOUS') {
      return null;
    }

    const selected = await resolveDraft(
      draft,
      () => undefined,
      selectedLocation,
      {
        disambiguation: candidate.occurrence,
        expectedTimezoneDatabaseVersion: resolution.timezoneDatabaseVersion
      }
    );
    return selected?.ambiguityStatus === 'EXACT' ? selected : null;
  };

  return {
    clearResolutionError,
    invalidateResolution,
    isResolving,
    resolution,
    resolutionError,
    resolveDraft,
    selectCandidate
  };
}
