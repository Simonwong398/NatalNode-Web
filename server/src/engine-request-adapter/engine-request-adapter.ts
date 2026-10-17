import {
  type ChartRequest,
  type CivilTimeAuthorityProfile,
  type TimeResolutionError,
  type CivilTimeResolutionApiRequest
} from '@natalnode/contracts';
import { isChartRequest } from '../app/validation/chart-request.js';
import {
  assertVerifiedUtcInstant
} from '../time-resolution/birth-time-resolution-service.js';
import type {
  BirthTimeResolutionService,
  VerifiedUtcInstant
} from '../time-resolution/time-resolution-contract.js';

/** The Web UI's admitted house systems and their Engine public API IDs. */
export type EngineRequestHouseSystem = 'placidus' | 'whole-sign' | 'equal';

/** Wire shape structurally checked against the delivered Engine source types. */
export interface EngineCalculationRequest {
  readonly input: {
    readonly instant: string;
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly options: {
    readonly houseSystem: EngineRequestHouseSystem;
  };
}

export type EngineRequestPreparationError = TimeResolutionError | {
  readonly code: 'UNSUPPORTED_HOUSE_SYSTEM';
  readonly field: 'houseSystem';
};

export type EngineRequestPreparation =
  | {
      readonly outcome: 'READY';
      readonly request: EngineCalculationRequest;
      /** Internal proof remains in-process and is never returned by the test BFF. */
      readonly verifiedTime: VerifiedUtcInstant;
    }
  | {
      readonly outcome: 'REJECTED';
      readonly error: EngineRequestPreparationError;
    };

const HOUSE_SYSTEM_MAPPING: Readonly<Record<string, EngineRequestHouseSystem>> =
  Object.freeze({
    Placidus: 'placidus',
    'Whole Sign': 'whole-sign',
    Equal: 'equal'
  });

function rejected(error: EngineRequestPreparationError): EngineRequestPreparation {
  return Object.freeze({ outcome: 'REJECTED', error: Object.freeze(error) });
}

function mapHouseSystem(value: string): EngineRequestHouseSystem | null {
  return HOUSE_SYSTEM_MAPPING[value] ?? null;
}

function createAuthorityRequest(
  request: ChartRequest,
  disambiguation: CivilTimeResolutionApiRequest['disambiguation'],
  expectedTimezoneDatabaseVersion: string | null
): CivilTimeResolutionApiRequest {
  const { birth } = request;
  return {
    civilTime: {
      localDate: birth.localDate,
      localTime: birth.localTime,
      calendar: 'ISO_8601_GREGORIAN',
      precision: 'MINUTE'
    },
    location: {
      resolutionId: birth.locationResolutionId ?? '',
      coordinates: {
        latitude: birth.latitude,
        longitude: birth.longitude
      },
      ianaTimeZone: birth.ianaTimeZone
    },
    disambiguation,
    expectedTimezoneDatabaseVersion
  };
}

function resolveTime(
  authority: BirthTimeResolutionService,
  request: CivilTimeResolutionApiRequest
) {
  try {
    return authority.resolve(request);
  } catch {
    return {
      outcome: 'REJECTED' as const,
      error: { code: 'TIME_AUTHORITY_UNAVAILABLE' as const, field: null }
    };
  }
}

function clientClaimsMatchVerifiedTime(
  request: ChartRequest,
  verifiedTime: VerifiedUtcInstant,
  profile: CivilTimeAuthorityProfile
): boolean {
  const { birth } = request;
  const { location } = verifiedTime;

  return (
    birth.ambiguityStatus === 'EXACT' &&
    birth.localDate === verifiedTime.civilTime.localDate &&
    birth.localTime === verifiedTime.civilTime.localTime &&
    birth.locationResolutionId === location.resolutionId &&
    birth.latitude === location.coordinates.latitude &&
    birth.longitude === location.coordinates.longitude &&
    birth.ianaTimeZone === location.ianaTimeZone &&
    birth.resolvedUtcInstant === verifiedTime.resolvedUtcInstant &&
    birth.utcOffsetSeconds === verifiedTime.utcOffsetSeconds &&
    birth.timezoneDatabaseVersion === profile.timezoneDatabaseVersion &&
    birth.timezoneResolutionMethod === profile.profileId
  );
}

/**
 * Pure mapping boundary. It accepts only a live proof issued by the existing
 * Civil TimeAuthority and checks every Web claim against that proof. The
 * Engine remains the owner of its optional scientific calculation defaults.
 */
function adaptVerifiedChartRequest(
  request: ChartRequest,
  verifiedTime: VerifiedUtcInstant
): EngineCalculationRequest {
  try {
    assertVerifiedUtcInstant(verifiedTime);
  } catch {
    throw new TypeError('A current server-issued UTC instant is required.');
  }

  if (!isChartRequest(request) || !clientClaimsMatchVerifiedTime(
    request,
    verifiedTime,
    verifiedTime.authority
  )) {
    throw new TypeError('The Web chart request does not match verified birth-time evidence.');
  }

  const houseSystem = mapHouseSystem(request.houseSystem);
  if (houseSystem === null) {
    throw new RangeError('The requested house system is not admitted by the Web adapter.');
  }

  return Object.freeze({
    input: Object.freeze({
      instant: verifiedTime.resolvedUtcInstant,
      latitude: verifiedTime.location.coordinates.latitude,
      longitude: verifiedTime.location.coordinates.longitude
    }),
    options: Object.freeze({ houseSystem })
  });
}

/**
 * Same-request BFF preparation: resolve against the live canonical location,
 * verify client claims, then map only the resulting proof to Engine input.
 */
export function prepareEngineCalculationRequest(
  input: unknown,
  timeAuthority: BirthTimeResolutionService
): EngineRequestPreparation {
  if (!timeAuthority || typeof timeAuthority.resolve !== 'function' || !timeAuthority.profile) {
    return rejected({ code: 'TIME_AUTHORITY_UNAVAILABLE', field: null });
  }
  if (!isChartRequest(input)) {
    return rejected({ code: 'INVALID_REQUEST', field: 'request' });
  }

  if (mapHouseSystem(input.houseSystem) === null) {
    return rejected({ code: 'UNSUPPORTED_HOUSE_SYSTEM', field: 'houseSystem' });
  }

  const initial = resolveTime(timeAuthority, createAuthorityRequest(input, 'REJECT', null));
  if (initial.outcome === 'VERIFIED') {
    if (!clientClaimsMatchVerifiedTime(input, initial.value, timeAuthority.profile)) {
      return rejected({ code: 'CLIENT_TIME_CLAIM_MISMATCH', field: 'request' });
    }
    return Object.freeze({
      outcome: 'READY',
      request: adaptVerifiedChartRequest(input, initial.value),
      verifiedTime: initial.value
    });
  }

  if (initial.error.code !== 'AMBIGUOUS_LOCAL_TIME') {
    return rejected(initial.error);
  }

  // The browser's UTC value is used only to select one of the server-produced
  // overlap candidates. It cannot create a candidate or prove its own validity.
  if (
    input.birth.ambiguityStatus !== 'EXACT' ||
    input.birth.timezoneDatabaseVersion !== timeAuthority.profile.timezoneDatabaseVersion ||
    input.birth.timezoneResolutionMethod !== timeAuthority.profile.profileId
  ) {
    return rejected(initial.error);
  }

  const selectedIndex = initial.error.candidates.findIndex((candidate) =>
    candidate.resolvedUtcInstant === input.birth.resolvedUtcInstant &&
    candidate.utcOffsetSeconds === input.birth.utcOffsetSeconds
  );
  if (selectedIndex < 0) {
    return rejected({ code: 'CLIENT_TIME_CLAIM_MISMATCH', field: 'request' });
  }

  const disambiguation = selectedIndex === 0 ? 'EARLIER' : 'LATER';
  const selected = resolveTime(timeAuthority, createAuthorityRequest(
    input,
    disambiguation,
    timeAuthority.profile.timezoneDatabaseVersion
  ));
  if (selected.outcome === 'REJECTED') {
    return rejected(selected.error);
  }
  if (!clientClaimsMatchVerifiedTime(input, selected.value, timeAuthority.profile)) {
    return rejected({ code: 'CLIENT_TIME_CLAIM_MISMATCH', field: 'request' });
  }

  return Object.freeze({
    outcome: 'READY',
    request: adaptVerifiedChartRequest(input, selected.value),
    verifiedTime: selected.value
  });
}
