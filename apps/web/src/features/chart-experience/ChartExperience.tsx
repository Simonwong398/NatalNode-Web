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
        className="nn-surface nn-surface--elevated mt-12 p-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="nn-eyebrow">
              Engine Client
            </p>
            <h2 className="nn-type-card-title mt-1" id="chart-calculation-title">
              {isCalculating
                ? 'Calculating the development chart…'
                : snapshot
                  ? 'Development chart calculated'
                  : 'Ready for resolved birth input'}
            </h2>
            {!snapshot && !isCalculating ? (
              <p className="nn-type-body-small mt-2">
                Resolve valid birth details to start a chart calculation.
              </p>
            ) : null}
          </div>
          <div
            aria-label="Development provenance"
            className="flex max-w-sm flex-wrap gap-2"
          >
            <span className="nn-badge">
              UI DEVELOPMENT ONLY
            </span>
            <span className="nn-badge">
              NOT SCIENTIFIC EVIDENCE
            </span>
            <span className="nn-badge">
              NOT PRODUCTION ASTRONOMY
            </span>
          </div>
        </div>

        {calculationError ? (
          <p
            className="nn-notice nn-notice--error mt-4"
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
