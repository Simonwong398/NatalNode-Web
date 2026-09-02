import { useEffect, useRef, useState } from 'react';
import { BirthInputForm, type ResolvedBirthInputSelection } from '@/features/chart-input';
import { ChartWorkspace } from '@/features/chart-workspace';
import { engineClient } from '@/lib/engine-client';
import type { SupportedLocale } from '@/lib/localization';
import { toChartRequest } from './chart-request';
import { chartUi } from './chart-ui.js';
import type { CalculatedChartSnapshot } from './types';

interface ChartExperienceProps {
  readonly locale?: SupportedLocale;
}

export default function ChartExperience({ locale }: ChartExperienceProps) {
  const [snapshot, setSnapshot] = useState<CalculatedChartSnapshot | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [successfulCalculationSequence, setSuccessfulCalculationSequence] = useState(0);
  const calculationInFlightRef = useRef(false);
  const handledResultTransitionRef = useRef(0);
  const resultTargetRef = useRef<HTMLElement>(null);

  // These canonical fixture identities remain explicit in the localized UI:
  // UI DEVELOPMENT ONLY, NOT SCIENTIFIC EVIDENCE, NOT PRODUCTION ASTRONOMY.

  useEffect(() => {
    if (
      successfulCalculationSequence === 0 ||
      handledResultTransitionRef.current === successfulCalculationSequence
    ) {
      return;
    }

    const resultTarget = resultTargetRef.current;

    if (!resultTarget) {
      return;
    }

    handledResultTransitionRef.current = successfulCalculationSequence;
    resultTarget.focus({ preventScroll: true });
    resultTarget.scrollIntoView({ block: 'start' });
  }, [successfulCalculationSequence]);

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
      setSuccessfulCalculationSequence((current) => current + 1);
    } catch {
      setCalculationError(chartUi(locale, 'calculate.error'));
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
        locale={locale}
      />

      <section
        aria-labelledby="chart-calculation-title"
        className="nn-surface mt-8 p-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="nn-eyebrow">
              {chartUi(locale, 'calculate.engineClient')}
            </p>
            <h2 className="nn-type-card-title mt-1" id="chart-calculation-title">
              {isCalculating
                ? chartUi(locale, 'calculate.status.calculating')
                : snapshot
                  ? chartUi(locale, 'calculate.status.completed')
                  : chartUi(locale, 'calculate.status.ready')}
            </h2>
            {!snapshot && !isCalculating ? (
              <p className="nn-type-body-small mt-2">
                {chartUi(locale, 'calculate.status.readyHelp')}
              </p>
            ) : null}
          </div>
          <div
            aria-label={chartUi(locale, 'calculate.provenanceLabel')}
            className="flex max-w-sm flex-wrap gap-2"
          >
            <span className="nn-badge">
              {chartUi(locale, 'calculate.provenance.uiDevelopment')}
            </span>
            <span className="nn-badge">
              {chartUi(locale, 'calculate.provenance.notScientific')}
            </span>
            <span className="nn-badge">
              {chartUi(locale, 'calculate.provenance.notProductionAstronomy')}
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

      {snapshot ? (
        <ChartWorkspace
          key={successfulCalculationSequence}
          locale={locale}
          resultTargetRef={resultTargetRef}
          snapshot={snapshot}
        />
      ) : null}
    </>
  );
}
