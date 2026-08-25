export type BirthInputAmbiguityStatus =
  | 'UNRESOLVED'
  | 'EXACT'
  | 'AMBIGUOUS'
  | 'NONEXISTENT'
  | 'UNKNOWN_TIME';

export type HouseSystem = 'Placidus' | 'Whole Sign' | 'Equal';

export type HouseSystemSelection = HouseSystem | '';

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

export type BirthInputResolution = Omit<BirthInputState, 'houseSystem'>;

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
  houseSystem: ''
};
