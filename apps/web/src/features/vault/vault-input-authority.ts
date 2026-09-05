import type { ChartRequest } from '@natalnode/contracts';
import type {
  BirthInputDraft,
  BirthInputResolution
} from '@/features/chart-input/types';
import type {
  LocationResolutionViewState
} from '@/features/chart-input/location-resolution';

export type VaultInputSaveIneligibilityReason =
  | 'BIRTH_DATE_REQUIRED'
  | 'BIRTH_TIME_REQUIRED'
  | 'BIRTH_TIME_NOT_RESOLVED'
  | 'LOCATION_REQUIRED'
  | 'LOCATION_NOT_RESOLVED'
  | 'HOUSE_SYSTEM_REQUIRED';

export type VaultInputSaveEligibility =
  | {
      readonly eligible: true;
      readonly chartRequest: ChartRequest;
    }
  | {
      readonly eligible: false;
      readonly reason: VaultInputSaveIneligibilityReason;
    };

export interface VaultInputSaveEligibilityInput {
  readonly draft: BirthInputDraft;
  readonly resolution: BirthInputResolution | null;
  readonly locationResolution?: LocationResolutionViewState;
}

const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const IANA_TIME_ZONE_PATTERN = /^(?:UTC|GMT|[A-Za-z0-9._+-]+(?:\/[A-Za-z0-9._+-]+)+)$/u;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidIanaTimeZone(value: string): boolean {
  if (!IANA_TIME_ZONE_PATTERN.test(value)) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch (_error) {
    return false;
  }
}

function isValidLocationResolution(
  locationResolution: LocationResolutionViewState | undefined
): locationResolution is LocationResolutionViewState & {
  readonly selectedLocation: NonNullable<LocationResolutionViewState['selectedLocation']>;
} {
  const location = locationResolution?.selectedLocation;

  return (
    locationResolution?.state === 'RESOLVED' &&
    location?.status === 'RESOLVED' &&
    Number.isFinite(location.coordinates.latitude) &&
    location.coordinates.latitude >= -90 &&
    location.coordinates.latitude <= 90 &&
    Number.isFinite(location.coordinates.longitude) &&
    location.coordinates.longitude >= -180 &&
    location.coordinates.longitude <= 180 &&
    isValidIanaTimeZone(location.ianaTimeZone)
  );
}

function resolutionMatchesCurrentBirthTime(
  draft: BirthInputDraft,
  resolution: BirthInputResolution
): boolean {
  if (draft.localDate !== resolution.localDate) {
    return false;
  }

  if (resolution.ambiguityStatus === 'UNKNOWN_TIME') {
    return draft.localTime === null;
  }

  return draft.localTime === resolution.localTime;
}

/**
 * Returns whether the current editable input is sufficiently complete to
 * attempt an input-only save. It deliberately does not require time
 * resolution: the save action may finish the existing resolver step without
 * invoking chart calculation.
 */
export function canAttemptVaultInputSave(
  input: VaultInputSaveEligibilityInput
): boolean {
  const { draft } = input;

  if (
    !isValidIsoDate(draft.localDate) ||
    (draft.localTime !== null && !LOCAL_TIME_PATTERN.test(draft.localTime)) ||
    (draft.localTime === null && draft.ambiguityStatus !== 'UNKNOWN_TIME') ||
    (draft.localTime !== null && draft.ambiguityStatus === 'UNKNOWN_TIME') ||
    draft.locationLabel.trim() === '' ||
    !draft.houseSystem ||
    !isValidLocationResolution(input.locationResolution)
  ) {
    return false;
  }

  return true;
}

/**
 * Builds the Vault request from the live form resolution and the currently
 * selected canonical location. No chart result, fixture, or prior snapshot
 * participates in this request.
 */
export function resolveVaultInputSaveEligibility(
  input: VaultInputSaveEligibilityInput
): VaultInputSaveEligibility {
  const { draft, resolution, locationResolution } = input;

  if (!isValidIsoDate(draft.localDate)) {
    return { eligible: false, reason: 'BIRTH_DATE_REQUIRED' };
  }

  if (draft.localTime === null) {
    if (draft.ambiguityStatus !== 'UNKNOWN_TIME') {
      return { eligible: false, reason: 'BIRTH_TIME_REQUIRED' };
    }
  } else if (!LOCAL_TIME_PATTERN.test(draft.localTime)) {
    return { eligible: false, reason: 'BIRTH_TIME_REQUIRED' };
  }

  if (draft.locationLabel.trim() === '') {
    return { eligible: false, reason: 'LOCATION_REQUIRED' };
  }

  if (!draft.houseSystem) {
    return { eligible: false, reason: 'HOUSE_SYSTEM_REQUIRED' };
  }

  if (!isValidLocationResolution(locationResolution)) {
    return { eligible: false, reason: 'LOCATION_NOT_RESOLVED' };
  }

  if (resolution === null || !resolutionMatchesCurrentBirthTime(draft, resolution)) {
    return { eligible: false, reason: 'BIRTH_TIME_NOT_RESOLVED' };
  }

  if (
    resolution.ambiguityStatus !== 'EXACT' &&
    resolution.ambiguityStatus !== 'UNKNOWN_TIME'
  ) {
    return { eligible: false, reason: 'BIRTH_TIME_NOT_RESOLVED' };
  }

  const location = locationResolution.selectedLocation;
  const birth = {
    localDate: resolution.localDate,
    localTime: resolution.localTime,
    locationLabel: location.canonicalDisplayName,
    locationResolutionId: location.resolutionId,
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude,
    ianaTimeZone: location.ianaTimeZone,
    resolvedUtcInstant: resolution.resolvedUtcInstant,
    utcOffsetSeconds: resolution.utcOffsetSeconds,
    timezoneDatabaseVersion: resolution.timezoneDatabaseVersion,
    timezoneResolutionMethod: resolution.timezoneResolutionMethod,
    ambiguityStatus: resolution.ambiguityStatus
  } as const;

  return {
    eligible: true,
    chartRequest: {
      birth,
      houseSystem: draft.houseSystem
    }
  };
}
