export type BirthInputAmbiguityStatus =
  | 'UNRESOLVED'
  | 'EXACT'
  | 'AMBIGUOUS'
  | 'NONEXISTENT'
  | 'UNKNOWN_TIME';

export type HouseSystem = 'Placidus' | 'Whole Sign' | 'Equal';

export type HouseSystemSelection = HouseSystem | '';

export type AmbiguousTimeOccurrence = 'EARLIER' | 'LATER';

export interface AmbiguousTimeCandidate {
  occurrence: AmbiguousTimeOccurrence;
  resolvedUtcInstant: string;
  utcOffsetSeconds: number;
}

export interface BirthInputState {
  localDate: string;
  localTime: string | null;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  ianaTimeZone: string | null;
  resolvedUtcInstant: string | null;
  utcOffsetSeconds: number | null;
  timezoneDatabaseVersion: string | null;
  timezoneResolutionMethod: string | null;
  ambiguityStatus: BirthInputAmbiguityStatus;
  houseSystem: HouseSystemSelection;
}

export type BirthInputDraft = BirthInputState;

export interface ResolvedBirthInputBase {
  localDate: string;
  localTime: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  timezoneDatabaseVersion: string;
  timezoneResolutionMethod: string;
}

export interface ExactBirthInputResolution extends ResolvedBirthInputBase {
  ambiguityStatus: 'EXACT';
  resolvedUtcInstant: string;
  utcOffsetSeconds: number;
}

export interface AmbiguousBirthInputResolution extends ResolvedBirthInputBase {
  ambiguityStatus: 'AMBIGUOUS';
  resolvedUtcInstant: null;
  utcOffsetSeconds: null;
  candidates: readonly [AmbiguousTimeCandidate, AmbiguousTimeCandidate];
}

export interface NonexistentBirthInputResolution extends ResolvedBirthInputBase {
  ambiguityStatus: 'NONEXISTENT';
  resolvedUtcInstant: null;
  utcOffsetSeconds: null;
}

export interface UnknownTimeBirthInputResolution {
  localDate: string;
  localTime: null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  resolvedUtcInstant: null;
  utcOffsetSeconds: null;
  timezoneDatabaseVersion: string;
  timezoneResolutionMethod: string;
  ambiguityStatus: 'UNKNOWN_TIME';
}

export type CalculationReadyBirthInputResolution =
  | ExactBirthInputResolution
  | UnknownTimeBirthInputResolution;

export type BirthInputResolution =
  | CalculationReadyBirthInputResolution
  | AmbiguousBirthInputResolution
  | NonexistentBirthInputResolution;

export const INITIAL_BIRTH_INPUT_STATE: BirthInputState = {
  localDate: '',
  localTime: '',
  locationLabel: '',
  latitude: null,
  longitude: null,
  ianaTimeZone: null,
  resolvedUtcInstant: null,
  utcOffsetSeconds: null,
  timezoneDatabaseVersion: null,
  timezoneResolutionMethod: null,
  ambiguityStatus: 'UNRESOLVED',
  houseSystem: 'Placidus'
};
