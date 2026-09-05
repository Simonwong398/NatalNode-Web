import type { Ref } from 'react';
import type { CalculatedChartSnapshot } from '@/features/chart-experience/types';
import type { SupportedLocale } from '@/lib/localization';
import SaveChartPanel from '@/features/vault/SaveChartPanel';
import { resolveVaultSaveIntent } from '@/features/vault/vault-save-intent';
import { createChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';
import ChartWorkspaceView from './ChartWorkspaceView';

export type ChartWorkspaceProps = {
  locale?: SupportedLocale;
  resultTargetRef?: Ref<HTMLElement>;
  snapshot: CalculatedChartSnapshot;
};

export default function ChartWorkspace({ locale, resultTargetRef, snapshot }: ChartWorkspaceProps) {
  const presentationPolicy = createChartPresentationPolicy(snapshot.request);
  const showChartResultSavePanel =
    resolveVaultSaveIntent(snapshot.result) === 'CHART_RESULT_AVAILABLE';

  return (
    <ChartWorkspaceView
      chart={snapshot.result}
      locale={locale}
      presentationPolicy={presentationPolicy}
      requestedHouseSystem={snapshot.request.houseSystem}
      resultTargetRef={resultTargetRef}
    >
      {showChartResultSavePanel ? (
        <SaveChartPanel
          chartRequest={snapshot.request}
          chartResult={snapshot.result}
          locale={locale}
        />
      ) : null}
    </ChartWorkspaceView>
  );
}
