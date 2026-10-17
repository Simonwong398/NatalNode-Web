export {
  assertVerifiedUtcInstant,
  createBirthTimeResolutionService
} from './birth-time-resolution-service.js';
export type { BirthTimeResolutionServiceDependencies } from './birth-time-resolution-service.js';
export { CIVIL_TIME_AUTHORITY_PROFILE, CivilTimeAuthorityError } from './civil-time-profile.js';
export type {
  BirthTimeResolutionService,
  CanonicalLocation,
  CivilTimeAuthority,
  TimeResolutionRequest,
  TimeResolutionResult,
  VerifiedUtcInstant
} from './time-resolution-contract.js';
