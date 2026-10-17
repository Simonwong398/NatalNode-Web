import type {
  CanonicalResolvedLocation,
  CivilBirthTime,
  CivilTimeAuthorityProfile,
  TimeDisambiguation,
  TimeResolutionError,
  TimeResolutionEvidence
} from '@natalnode/contracts';

export type CanonicalLocation = CanonicalResolvedLocation;

/** Internal input assembled only after server canonical lookup and binding. */
export interface TimeResolutionRequest {
  readonly civilTime: CivilBirthTime;
  readonly location: CanonicalLocation;
  readonly disambiguation: TimeDisambiguation;
  readonly expectedTimezoneDatabaseVersion: string | null;
}

declare const verifiedUtcInstantBrand: unique symbol;

/** Runtime issuance membership is checked in addition to this nominal type. */
export interface VerifiedUtcInstant extends TimeResolutionEvidence {
  readonly [verifiedUtcInstantBrand]: true;
}

export type TimeResolutionResult =
  | { readonly outcome: 'VERIFIED'; readonly value: VerifiedUtcInstant }
  | { readonly outcome: 'REJECTED'; readonly error: TimeResolutionError };

export interface CivilTimeAuthority {
  readonly profile: CivilTimeAuthorityProfile;
  resolve(request: TimeResolutionRequest): TimeResolutionResult;
}

/** BFF boundary: validates untrusted assertions and reads the live location owner. */
export interface BirthTimeResolutionService {
  readonly profile: CivilTimeAuthorityProfile;
  resolve(input: unknown): TimeResolutionResult;
}
