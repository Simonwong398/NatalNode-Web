import type { ChartRequest } from '@natalnode/contracts';

export interface ChartPresentationPolicy {
  readonly showAngles: boolean;
  readonly showHouses: boolean;
  readonly showHouseInterpretation: boolean;
}

export function createChartPresentationPolicy(
  request: ChartRequest
): ChartPresentationPolicy {
  const isUnknownTime = request.birth.ambiguityStatus === 'UNKNOWN_TIME';

  return {
    showAngles: !isUnknownTime,
    showHouses: !isUnknownTime,
    showHouseInterpretation: !isUnknownTime
  };
}
