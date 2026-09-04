import type {
  ChartRequest,
  ChartResult,
  SaveVaultChartApiRequest,
  VaultChartCategory
} from '@natalnode/contracts';

/** Development and test result labels must never be promoted by the UI. */
const NON_AUTHORITATIVE_ENGINE_MARKER = /(fixture|mock)/iu;

export type VaultSaveIntent =
  | 'INPUT_ONLY'
  | 'CHART_RESULT_AVAILABLE';

export interface CreateSaveVaultChartRequestInput {
  readonly chart: ChartRequest;
  readonly chartResult: ChartResult;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
}

/**
 * Classifies the visible result without deriving or rewriting any scientific
 * data. The server remains the authority for the persisted calculation.
 */
export function resolveVaultSaveIntent(
  chartResult: ChartResult
): VaultSaveIntent {
  if (
    chartResult.calculationStatus === 'COMPLETE' &&
    chartResult.metadata.configurationStatus === 'COMPLETE' &&
    !NON_AUTHORITATIVE_ENGINE_MARKER.test(chartResult.engineVersion)
  ) {
    return 'CHART_RESULT_AVAILABLE';
  }

  return 'INPUT_ONLY';
}

/** Builds the exact browser save request; the chart result is never sent. */
export function createSaveVaultChartRequest(
  input: CreateSaveVaultChartRequestInput
): SaveVaultChartApiRequest {
  return {
    chart: input.chart,
    displayName: input.displayName,
    category: input.category,
    tags: input.tags,
    favorite: input.favorite,
    saveMode: resolveVaultSaveIntent(input.chartResult)
  };
}
