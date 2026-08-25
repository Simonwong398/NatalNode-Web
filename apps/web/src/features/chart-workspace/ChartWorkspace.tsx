import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import { CalculationDetails } from '@/features/calculation-details';
import type { CalculatedChartSnapshot } from '@/features/chart-experience/types';
import { ChartRenderer } from '@/features/chart-renderer';
import { InterpretationPanel } from '@/features/interpretation';
import SaveChartPanel from '@/features/vault/SaveChartPanel';

export type ChartWorkspaceProps = {
  snapshot: CalculatedChartSnapshot;
};

export default function ChartWorkspace({ snapshot }: ChartWorkspaceProps) {
  const chart: ChartResult = snapshot.result;
  const workspaceId = useId();
  const titleId = `${workspaceId}-title`;
  const wheelTitleId = `${workspaceId}-wheel-title`;
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';

  return (
    <section
      aria-labelledby={titleId}
      className="mt-2 min-w-0 overflow-hidden rounded-2xl border border-natal-border bg-natal-surface/90 shadow-2xl shadow-black/10"
    >
      <header className="flex flex-col gap-4 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">Chart Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white" id={titleId}>
            Natal Chart
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-200" aria-label="Chart status">
          <span className="rounded-full border border-natal-border px-3 py-1.5">
            Schema {chart.schemaVersion}
          </span>
          <span className="rounded-full border border-natal-border px-3 py-1.5">
            {chart.calculationStatus}
          </span>
          {isResearchConfiguration ? (
            <span className="rounded-full border border-amber-200/40 bg-amber-200/10 px-3 py-1.5 text-amber-100">
              Research configuration
            </span>
          ) : null}
        </div>
      </header>

      <SaveChartPanel chartRequest={snapshot.request} />

      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section
          aria-labelledby={wheelTitleId}
          className="min-w-0 border-t border-natal-border/70 p-4 sm:p-6 lg:border-r lg:p-7"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">Chart Wheel</p>
            <h3 className="mt-2 text-lg font-semibold text-white" id={wheelTitleId}>
              Engine-provided chart facts
            </h3>
          </div>
          <div className="mt-5 min-w-0">
            <ChartRenderer chart={chart} />
          </div>
        </section>

        <InterpretationPanel chart={chart} />
      </div>

      <CalculationDetails chart={chart} />
    </section>
  );
}
