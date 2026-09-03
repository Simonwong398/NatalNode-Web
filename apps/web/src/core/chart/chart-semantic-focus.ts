export const CHART_SEMANTIC_FOCUSES = [
  'none',
  'planets',
  'signs',
  'houses',
  'aspects'
] as const;

export type ChartSemanticFocus = (typeof CHART_SEMANTIC_FOCUSES)[number];

export function isChartSemanticFocus(value: unknown): value is ChartSemanticFocus {
  return (
    typeof value === 'string' &&
    (CHART_SEMANTIC_FOCUSES as readonly string[]).includes(value)
  );
}
