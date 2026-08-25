import type { BirthInputResolver } from './resolver';
import type {
  AmbiguousBirthInputResolution,
  BirthInputDraft,
  BirthInputResolution,
  ExactBirthInputResolution,
  NonexistentBirthInputResolution,
  ResolvedBirthInputBase,
  UnknownTimeBirthInputResolution
} from './types';

export const DEVELOPMENT_RESOLVER_NOTICE =
  'UI DEVELOPMENT ONLY — NOT HISTORICAL TIMEZONE EVIDENCE — NOT PRODUCTION RESOLUTION';

const DEVELOPMENT_TIMEZONE = 'America/New_York';
const DEVELOPMENT_TIMEZONE_METADATA = 'UI_DEVELOPMENT_ONLY';

const developmentLocation = {
  latitude: 40.7128,
  longitude: -74.006,
  ianaTimeZone: DEVELOPMENT_TIMEZONE,
  timezoneDatabaseVersion: DEVELOPMENT_TIMEZONE_METADATA,
  timezoneResolutionMethod: DEVELOPMENT_TIMEZONE_METADATA
};

function createResolvedBase(input: BirthInputDraft): ResolvedBirthInputBase {
  if (input.localTime === null) {
    throw new Error('DevelopmentBirthInputResolver requires a local time for this fixture.');
  }

  return {
    localDate: input.localDate,
    localTime: input.localTime,
    locationLabel: input.locationLabel,
    ...developmentLocation
  };
}

function createUnknownTimeResolution(input: BirthInputDraft): UnknownTimeBirthInputResolution {
  return {
    localDate: input.localDate,
    localTime: null,
    locationLabel: input.locationLabel,
    ...developmentLocation,
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    ambiguityStatus: 'UNKNOWN_TIME'
  };
}

function createExactResolution(input: BirthInputDraft): ExactBirthInputResolution {
  return {
    ...createResolvedBase(input),
    ambiguityStatus: 'EXACT',
    resolvedUtcInstant: '2000-01-01T16:00:00.000Z',
    utcOffsetSeconds: -14_400
  };
}

function createAmbiguousResolution(input: BirthInputDraft): AmbiguousBirthInputResolution {
  return {
    ...createResolvedBase(input),
    ambiguityStatus: 'AMBIGUOUS',
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    candidates: [
      {
        occurrence: 'EARLIER',
        resolvedUtcInstant: '2000-11-05T05:30:00.000Z',
        utcOffsetSeconds: -14_400
      },
      {
        occurrence: 'LATER',
        resolvedUtcInstant: '2000-11-05T06:30:00.000Z',
        utcOffsetSeconds: -18_000
      }
    ]
  };
}

function createNonexistentResolution(input: BirthInputDraft): NonexistentBirthInputResolution {
  return {
    ...createResolvedBase(input),
    ambiguityStatus: 'NONEXISTENT',
    resolvedUtcInstant: null,
    utcOffsetSeconds: null
  };
}

/**
 * UI DEVELOPMENT ONLY.
 * This deterministic simulator is NOT HISTORICAL TIMEZONE EVIDENCE and is
 * NOT PRODUCTION RESOLUTION. It contains no timezone or DST calculations.
 *
 * Use a birth-place label containing `UI FIXTURE: AMBIGUOUS` or
 * `UI FIXTURE: NONEXISTENT` to exercise those panels. All other known-time
 * inputs use the fixed EXACT fixture; unknown time returns UNKNOWN_TIME.
 */
export class DevelopmentBirthInputResolver implements BirthInputResolver {
  async resolve(input: BirthInputDraft): Promise<BirthInputResolution> {
    if (input.localTime === null || input.ambiguityStatus === 'UNKNOWN_TIME') {
      return createUnknownTimeResolution(input);
    }

    const fixtureLabel = input.locationLabel.trim().toUpperCase();

    if (fixtureLabel.includes('UI FIXTURE: AMBIGUOUS')) {
      return createAmbiguousResolution(input);
    }

    if (fixtureLabel.includes('UI FIXTURE: NONEXISTENT')) {
      return createNonexistentResolution(input);
    }

    return createExactResolution(input);
  }
}
