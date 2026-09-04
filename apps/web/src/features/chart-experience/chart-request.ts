import type { ChartRequest } from '@natalnode/contracts';
import type {
  CalculationReadyBirthInputResolution,
  HouseSystem
} from '@/features/chart-input';

export function toChartRequest(
  resolution: CalculationReadyBirthInputResolution,
  houseSystem: HouseSystem,
  locationResolutionId?: string
): ChartRequest {
  return {
    birth: {
      localDate: resolution.localDate,
      localTime: resolution.localTime,
      locationLabel: resolution.locationLabel,
      ...(locationResolutionId === undefined ? {} : { locationResolutionId }),
      latitude: resolution.latitude,
      longitude: resolution.longitude,
      ianaTimeZone: resolution.ianaTimeZone,
      resolvedUtcInstant: resolution.resolvedUtcInstant,
      utcOffsetSeconds: resolution.utcOffsetSeconds,
      timezoneDatabaseVersion: resolution.timezoneDatabaseVersion,
      timezoneResolutionMethod: resolution.timezoneResolutionMethod,
      ambiguityStatus: resolution.ambiguityStatus
    },
    houseSystem
  };
}
