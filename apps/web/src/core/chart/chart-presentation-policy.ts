import type { ChartRequest } from '@natalnode/contracts';

export type ChartPresentationMode = 'embedded' | 'workspace' | 'expanded' | 'showcase';

export interface ChartPresentationPolicy {
  readonly showAngles: boolean;
  readonly showHouses: boolean;
  readonly showHouseInterpretation: boolean;
  readonly mode: ChartPresentationMode;
}

export function createChartPresentationPolicy(
  request: ChartRequest
): ChartPresentationPolicy {
  const isUnknownTime = request.birth.ambiguityStatus === 'UNKNOWN_TIME';

  return {
    showAngles: !isUnknownTime,
    showHouses: !isUnknownTime,
    showHouseInterpretation: !isUnknownTime,
    mode: 'workspace'
  };
}

export function createSkyPresentationPolicy(): ChartPresentationPolicy {
  return {
    showAngles: false,
    showHouses: false,
    showHouseInterpretation: false,
    mode: 'showcase'
  };
}

export function withChartPresentationMode(
  policy: ChartPresentationPolicy,
  mode: ChartPresentationMode
): ChartPresentationPolicy {
  return { ...policy, mode };
}
