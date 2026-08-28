import type { Ref } from 'react';
import type { CalculatedChartSnapshot } from '@/features/chart-experience/types';
import SaveChartPanel from '@/features/vault/SaveChartPanel';
import { createChartPresentationPolicy } from './chart-presentation-policy';
import ChartWorkspaceView from './ChartWorkspaceView';

export type ChartWorkspaceProps = {
  resultTargetRef?: Ref<HTMLElement>;
  snapshot: CalculatedChartSnapshot;
};

export default function ChartWorkspace({ resultTargetRef, snapshot }: ChartWorkspaceProps) {
  const presentationPolicy = createChartPresentationPolicy(snapshot.request);

  return (
    <ChartWorkspaceView
      chart={snapshot.result}
      presentationPolicy={presentationPolicy}
      requestedHouseSystem={snapshot.request.houseSystem}
      resultTargetRef={resultTargetRef}
    >
      <SaveChartPanel chartRequest={snapshot.request} />
    </ChartWorkspaceView>
  );
}
