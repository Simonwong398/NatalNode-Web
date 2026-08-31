import type { Ref } from 'react';
import type { CalculatedChartSnapshot } from '@/features/chart-experience/types';
import type { SupportedLocale } from '@/lib/localization';
import SaveChartPanel from '@/features/vault/SaveChartPanel';
import { createChartPresentationPolicy } from './chart-presentation-policy';
import ChartWorkspaceView from './ChartWorkspaceView';

export type ChartWorkspaceProps = {
  locale?: SupportedLocale;
  resultTargetRef?: Ref<HTMLElement>;
  snapshot: CalculatedChartSnapshot;
};

export default function ChartWorkspace({ locale, resultTargetRef, snapshot }: ChartWorkspaceProps) {
  const presentationPolicy = createChartPresentationPolicy(snapshot.request);

  return (
    <ChartWorkspaceView
      chart={snapshot.result}
      presentationPolicy={presentationPolicy}
      requestedHouseSystem={snapshot.request.houseSystem}
      resultTargetRef={resultTargetRef}
    >
      <SaveChartPanel chartRequest={snapshot.request} locale={locale} />
    </ChartWorkspaceView>
  );
}
