import type { CalculatedChartSnapshot } from '@/features/chart-experience/types';
import SaveChartPanel from '@/features/vault/SaveChartPanel';
import { createChartPresentationPolicy } from './chart-presentation-policy';
import ChartWorkspaceView from './ChartWorkspaceView';

export type ChartWorkspaceProps = {
  snapshot: CalculatedChartSnapshot;
};

export default function ChartWorkspace({ snapshot }: ChartWorkspaceProps) {
  const presentationPolicy = createChartPresentationPolicy(snapshot.request);

  return (
    <ChartWorkspaceView
      chart={snapshot.result}
      presentationPolicy={presentationPolicy}
      requestedHouseSystem={snapshot.request.houseSystem}
    >
      <SaveChartPanel chartRequest={snapshot.request} />
    </ChartWorkspaceView>
  );
}
