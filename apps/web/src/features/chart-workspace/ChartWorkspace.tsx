import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import { ChartRenderer } from '@/features/chart-renderer';

export type ChartWorkspaceProps = {
  chart: ChartResult;
};

export default function ChartWorkspace({ chart }: ChartWorkspaceProps) {
  const workspaceId = useId();
  const titleId = `${workspaceId}-title`;
  const wheelTitleId = `${workspaceId}-wheel-title`;
  const interpretationTitleId = `${workspaceId}-interpretation-title`;
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

        <section
          aria-labelledby={interpretationTitleId}
          className="min-w-0 border-t border-natal-border/70 p-5 sm:p-7"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">Next layer</p>
          <h3 className="mt-2 text-lg font-semibold text-white" id={interpretationTitleId}>
            Interpretation
          </h3>
          <p className="mt-3 text-sm leading-6 text-natal-muted">
            Structured interpretation will appear here from confirmed chart facts.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-natal-border/70 bg-natal-night/30 p-3">
              <dt className="text-slate-400">Bodies</dt>
              <dd className="mt-1 text-lg font-semibold text-white">{chart.bodies.length}</dd>
            </div>
            <div className="rounded-lg border border-natal-border/70 bg-natal-night/30 p-3">
              <dt className="text-slate-400">Aspects</dt>
              <dd className="mt-1 text-lg font-semibold text-white">{chart.aspects.length}</dd>
            </div>
          </dl>
        </section>
      </div>

      <details className="border-t border-natal-border/70">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white outline-none focus-visible:bg-natal-night/40 focus-visible:text-natal-accent sm:px-7">
          Calculation Details
        </summary>
        <div className="grid gap-5 border-t border-natal-border/50 px-5 pb-6 pt-5 sm:px-7 sm:grid-cols-2">
          <dl className="grid gap-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-400">Engine Version</dt>
              <dd className="text-right font-medium text-white">{chart.engineVersion}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-400">Chart Schema</dt>
              <dd className="text-right font-medium text-white">{chart.schemaVersion}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-400">Calculation Status</dt>
              <dd className="text-right font-medium text-white">{chart.calculationStatus}</dd>
            </div>
          </dl>
          {isResearchConfiguration ? (
            <div className="rounded-lg border border-amber-200/30 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50/90">
              <p className="font-semibold text-amber-100">Research configuration</p>
              <p className="mt-1">UI development data; scientific and provenance identities are not available for this result.</p>
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}
