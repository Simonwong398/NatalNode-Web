import type { ChartRequest } from '@natalnode/contracts';

export type ChartPresentationMode = 'embedded' | 'workspace' | 'expanded' | 'showcase';

export interface ChartPresentationPolicy {
  readonly showAngles: boolean;
  readonly showHouses: boolean;
  readonly showHouseInterpretation: boolean;
  /**
   * Aspect rendering is disabled for unresolved time unless an upstream
   * authority contract explicitly certifies it. The current contract does
   * not provide that certification.
   */
  readonly showAspects: boolean;
  readonly mode: ChartPresentationMode;
}

export function createChartPresentationPolicy(
  request: ChartRequest
): ChartPresentationPolicy {
  const hasResolvedTime = request.birth.ambiguityStatus === 'EXACT';

  return {
    showAngles: hasResolvedTime,
    showHouses: hasResolvedTime,
    showHouseInterpretation: hasResolvedTime,
    showAspects: hasResolvedTime,
    mode: 'workspace'
  };
}

export function createSkyPresentationPolicy(): ChartPresentationPolicy {
  return {
    showAngles: false,
    showHouses: false,
    showHouseInterpretation: false,
    showAspects: true,
    mode: 'showcase'
  };
}

export function withChartPresentationMode(
  policy: ChartPresentationPolicy,
  mode: ChartPresentationMode
): ChartPresentationPolicy {
  return { ...policy, mode };
}
