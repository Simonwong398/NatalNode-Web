import type { CalculatedChartSnapshot } from '@/features/chart-experience/types';
import SaveChartPanel from '@/features/vault/SaveChartPanel';
import ChartWorkspaceView from './ChartWorkspaceView';

export type ChartWorkspaceProps = {
  snapshot: CalculatedChartSnapshot;
};

export default function ChartWorkspace({ snapshot }: ChartWorkspaceProps) {
  return (
    <ChartWorkspaceView chart={snapshot.result}>
      <SaveChartPanel chartRequest={snapshot.request} />
    </ChartWorkspaceView>
  );
}
