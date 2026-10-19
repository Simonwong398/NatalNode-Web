import type { BirthRequest } from './chart.js';
import type { CanonicalResolvedLocation, LocationCoordinates } from './location.js';

export interface CivilBirthTime {
  readonly localDate: BirthRequest['localDate'];
  readonly localTime: BirthRequest['localTime'];
  readonly calendar: 'ISO_8601_GREGORIAN';
  readonly precision: 'MINUTE';
}

export type TimeDisambiguation = 'REJECT' | 'EARLIER' | 'LATER';

/** Client location fields are assertions, never a canonical record. */
export interface CivilTimeResolutionApiRequest {
  readonly civilTime: CivilBirthTime;
  readonly location: {
    readonly resolutionId: CanonicalResolvedLocation['resolutionId'];
    readonly coordinates: LocationCoordinates;
    readonly ianaTimeZone: CanonicalResolvedLocation['ianaTimeZone'];
  };
  readonly disambiguation: TimeDisambiguation;
  readonly expectedTimezoneDatabaseVersion: string | null;
}

export interface CivilTimeAuthorityProfile {
  readonly policyId: 'NATALNODE_WEB_CIVIL_TIME_V1';
  readonly profileId:
    'NN_WEB_CIVIL_TIME_JS_JODA_6.3.0_TZ_3.1.0_FULL_2026e_1970_2100_V1';
  readonly implementation: 'JS_JODA_PACKAGED_TZDB';
  readonly coreVersion: '6.3.0';
  readonly timezonePackageVersion: '3.1.0';
  readonly timezoneDatabaseVersion: '2026e';
  readonly bundle: 'FULL';
  /** Dependency artifact integrity, not an astronomical fingerprint. */
  readonly rulesArtifactSha256:
    '38e0555a127a04afa0e357bd95cd1a4e7271dd722a547f297aaffd071f90404d';
  readonly coveragePolicyId: 'IANA_1970_2100_V1';
  readonly minimumLocalDate: '1970-01-01';
  readonly maximumLocalDate: '2100-12-31';
  readonly minimumUtcInclusive: '1970-01-01T00:00:00.000Z';
  readonly maximumUtcExclusive: '2101-01-01T00:00:00.000Z';
}

export type CanonicalLocationBinding = Readonly<Pick<
  CanonicalResolvedLocation,
  'resolutionId' | 'coordinates' | 'ianaTimeZone' | 'authority' | 'source'
>>;

export interface UtcCandidate {
  readonly resolvedUtcInstant: string;
  /** Local civil time = UTC + offset; retain integer seconds. */
  readonly utcOffsetSeconds: number;
}

/** Serializable provenance; possession does not authorize calculation. */
export interface TimeResolutionEvidence extends UtcCandidate {
  readonly schemaVersion: '1';
  readonly authority: CivilTimeAuthorityProfile;
  readonly civilTime: CivilBirthTime & { readonly localTime: string };
  readonly location: CanonicalLocationBinding;
  readonly selection:
    | { readonly kind: 'UNAMBIGUOUS' }
    | {
        readonly kind: 'USER_DISAMBIGUATED_OVERLAP';
        readonly occurrence: 'EARLIER' | 'LATER';
        readonly candidates: readonly [UtcCandidate, UtcCandidate];
      };
}

interface SimpleTimeResolutionErrorFields {
  INVALID_REQUEST: 'request';
  INVALID_LOCAL_DATE: 'localDate';
  INVALID_LOCAL_TIME: 'localTime';
  INVALID_TIME_ZONE: 'ianaTimeZone';
  INVALID_COORDINATES: 'coordinates';
  LOCATION_RESOLUTION_REQUIRED: 'locationResolutionId';
  LOCATION_RESOLUTION_UNAVAILABLE: 'locationResolutionId';
  LOCATION_BINDING_MISMATCH: 'locationResolutionId';
  NONEXISTENT_LOCAL_TIME: 'localTime';
  UNKNOWN_BIRTH_TIME: 'localTime';
  DISAMBIGUATION_VERSION_REQUIRED: 'timezoneDatabaseVersion';
  DISAMBIGUATION_NOT_APPLICABLE: 'disambiguation';
  DEVELOPMENT_FIXTURE_REJECTED: 'request';
  CLIENT_TIME_AUTHORITY_FORBIDDEN: 'request';
  CLIENT_TIME_CLAIM_MISMATCH: 'request';
  UNVERIFIED_UTC_INSTANT: null;
  TIME_AUTHORITY_UNAVAILABLE: null;
  TIME_AUTHORITY_DATA_INVALID: null;
}

type SimpleTimeResolutionError = {
  [C in keyof SimpleTimeResolutionErrorFields]: {
    readonly code: C;
    readonly field: SimpleTimeResolutionErrorFields[C];
  }
}[keyof SimpleTimeResolutionErrorFields];

export type TimeResolutionError =
  | SimpleTimeResolutionError
  | {
      readonly code: 'AMBIGUOUS_LOCAL_TIME';
      readonly field: 'localTime';
      readonly candidates: readonly [UtcCandidate, UtcCandidate];
      readonly timezoneDatabaseVersion: string;
    }
  | {
      readonly code: 'UNSUPPORTED_TIME_RANGE';
      readonly field: 'localDate';
      readonly reason:
        | 'PRE_1970_NOT_ADMITTED'
        | 'AFTER_2100'
        | 'UTC_OUTSIDE_ADMITTED_RANGE';
      readonly minimumLocalDate: '1970-01-01';
      readonly maximumLocalDate: '2100-12-31';
    }
  | {
      readonly code: 'TZDB_VERSION_MISMATCH';
      readonly field: 'timezoneDatabaseVersion';
      readonly expectedVersion: string;
      readonly actualVersion: string;
    };

/**
 * Guest-safe BFF response. Serialized evidence is for display/provenance only;
 * a later server calculation must resolve the input again against live state.
 */
export type CivilTimeResolutionApiResponse =
  | {
      readonly outcome: 'VERIFIED';
      readonly evidence: TimeResolutionEvidence;
    }
  | {
      readonly outcome: 'REJECTED';
      readonly authority: CivilTimeAuthorityProfile;
      readonly error: TimeResolutionError;
    };
