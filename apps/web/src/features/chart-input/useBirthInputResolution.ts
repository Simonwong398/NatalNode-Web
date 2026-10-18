import { useRef, useState } from 'react';
import { BirthInputResolverError, type BirthInputResolver } from './resolver.js';
import type { CanonicalResolvedLocation } from './location-resolution';
import type {
  AmbiguousTimeCandidate,
  BirthInputDraft,
  BirthInputResolution
} from './types';

type ExactResolution = Extract<BirthInputResolution, { ambiguityStatus: 'EXACT' }>;

type AmbiguousResolution = Extract<BirthInputResolution, { ambiguityStatus: 'AMBIGUOUS' }>;

const RESOLUTION_ERROR =
  'Birth input resolution is unavailable in this development environment.';

function toExactResolution(
  resolution: AmbiguousResolution,
  candidate: AmbiguousTimeCandidate
): ExactResolution {
  return {
    localDate: resolution.localDate,
    localTime: resolution.localTime,
    locationLabel: resolution.locationLabel,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    ianaTimeZone: resolution.ianaTimeZone,
    resolvedUtcInstant: candidate.resolvedUtcInstant,
    utcOffsetSeconds: candidate.utcOffsetSeconds,
    timezoneDatabaseVersion: resolution.timezoneDatabaseVersion,
    timezoneResolutionMethod: resolution.timezoneResolutionMethod,
    ambiguityStatus: 'EXACT'
  };
}

export function useBirthInputResolution(
  resolver: BirthInputResolver,
  initialResolution: BirthInputResolution | null = null
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

  const selectCandidate = (candidate: AmbiguousTimeCandidate): ExactResolution | null => {
    if (resolution?.ambiguityStatus !== 'AMBIGUOUS') {
      return null;
    }

    const exactResolution = toExactResolution(resolution, candidate);
    setResolution(exactResolution);
    setResolutionError(null);
    setIsResolving(false);
    latestRequestRef.current += 1;

    return exactResolution;
  };

  const resolveDraft = async (
    draft: BirthInputDraft,
    onResolutionAccepted: (resolution: BirthInputResolution) => void,
    selectedLocation?: CanonicalResolvedLocation | null
  ): Promise<BirthInputResolution | null> => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsResolving(true);

    try {
      const nextResolution = await resolver.resolve({ ...draft }, selectedLocation);

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
        error instanceof BirthInputResolverError ? error.message : RESOLUTION_ERROR
      );
      return null;
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsResolving(false);
      }
    }
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
