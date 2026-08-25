import { useRef, useState } from 'react';
import { BirthInputForm, type ResolvedBirthInputSelection } from '@/features/chart-input';
import { ChartWorkspace } from '@/features/chart-workspace';
import { engineClient } from '@/lib/engine-client';
import { toChartRequest } from './chart-request';
import type { CalculatedChartSnapshot } from './types';

const CALCULATION_ERROR = 'Chart calculation could not be completed. Please try again.';

export default function ChartExperience() {
  const [snapshot, setSnapshot] = useState<CalculatedChartSnapshot | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const calculationInFlightRef = useRef(false);

  const handleResolvedInput = async ({
    resolution,
    houseSystem
  }: ResolvedBirthInputSelection) => {
    if (calculationInFlightRef.current) {
      return;
    }

    calculationInFlightRef.current = true;
    setIsCalculating(true);
    setCalculationError(null);

    const request = toChartRequest(resolution, houseSystem);

    try {
      const result = await engineClient.calculateChart(request);

      setSnapshot({ request, result });
    } catch {
      setCalculationError(CALCULATION_ERROR);
    } finally {
      calculationInFlightRef.current = false;
      setIsCalculating(false);
    }
  };

  return (
    <>
      <BirthInputForm
        isCalculationPending={isCalculating}
        onResolvedInput={handleResolvedInput}
      />

      <section
        aria-labelledby="chart-calculation-title"
        className="mt-12 rounded-xl border border-natal-border bg-natal-surface/80 p-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">
              Engine Client
            </p>
            <h2 className="mt-1 text-sm font-medium text-white" id="chart-calculation-title">
              {isCalculating
                ? 'Calculating the development chart…'
                : snapshot
                  ? 'Development chart calculated'
                  : 'Ready for resolved birth input'}
            </h2>
            {!snapshot && !isCalculating ? (
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Resolve valid birth details to start a chart calculation.
              </p>
            ) : null}
          </div>
          <div
            aria-label="Development provenance"
            className="flex max-w-sm flex-wrap gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-300"
          >
            <span className="rounded-full border border-natal-border px-2.5 py-1">
              UI DEVELOPMENT ONLY
            </span>
            <span className="rounded-full border border-natal-border px-2.5 py-1">
              NOT SCIENTIFIC EVIDENCE
            </span>
            <span className="rounded-full border border-natal-border px-2.5 py-1">
              NOT PRODUCTION ASTRONOMY
            </span>
          </div>
        </div>

        {calculationError ? (
          <p
            className="mt-4 rounded-lg border border-rose-300/40 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100"
            role="alert"
          >
            {calculationError}
          </p>
        ) : null}
      </section>

      {snapshot ? <ChartWorkspace snapshot={snapshot} /> : null}
    </>
  );
}
