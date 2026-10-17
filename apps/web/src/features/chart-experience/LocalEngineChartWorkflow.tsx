import { useMemo, useRef, useState } from 'react';
import type { ChartResultV2 } from '@natalnode/contracts';
import { ChartRenderer } from '@/core/chart';
import { createChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';
import { chartUi } from '@/core/chart/chart-ui';
import { BirthInputForm, useLocationResolution } from '@/features/chart-input';
import type { ResolvedBirthInputSelection } from '@/features/chart-input';
import { ServerBackedDevelopmentBirthInputResolver } from '@/features/chart-input/server-backed-development-resolver';
import type { SupportedLocale } from '@/lib/localization';
import { toChartRequest } from './chart-request';

interface LocalEngineChartWorkflowProps {
  readonly locale?: SupportedLocale;
}

interface DevelopmentChartReceipt {
  readonly chart: ChartResultV2;
  readonly assessment: {
    readonly engineResult: 'ENGINE_RESULT_VALID';
    readonly webMapping: 'WEB_RESULT_SEMANTICALLY_MAPPABLE';
    readonly providerScientificAdmission: 'NOT_ADMITTED';
    readonly productionResultCertification: 'NOT_CERTIFIED';
  };
}

interface DevelopmentChartSnapshot {
  readonly request: ReturnType<typeof toChartRequest>;
  readonly receipt: DevelopmentChartReceipt;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseReceipt(value: unknown): DevelopmentChartReceipt | null {
  if (!isRecord(value) || !isRecord(value.receipt)) return null;
  const receipt = value.receipt;
  const chart = receipt.chart;
  const assessment = receipt.assessment;
  if (
    !isRecord(chart) || chart.schemaVersion !== '2.0.0' ||
    !Array.isArray(chart.bodies) || chart.bodies.length !== 10 ||
    !Array.isArray(chart.angles) || chart.angles.length !== 2 ||
    !isRecord(chart.houses) || !Array.isArray(chart.houses.cusps) ||
    !Array.isArray(chart.aspects) || !Array.isArray(chart.warnings) ||
    !isRecord(assessment) ||
    assessment.engineResult !== 'ENGINE_RESULT_VALID' ||
    assessment.webMapping !== 'WEB_RESULT_SEMANTICALLY_MAPPABLE' ||
    assessment.providerScientificAdmission !== 'NOT_ADMITTED' ||
    assessment.productionResultCertification !== 'NOT_CERTIFIED'
  ) {
    return null;
  }
  return {
    chart: chart as unknown as ChartResultV2,
    assessment: {
      engineResult: 'ENGINE_RESULT_VALID',
      webMapping: 'WEB_RESULT_SEMANTICALLY_MAPPABLE',
      providerScientificAdmission: 'NOT_ADMITTED',
      productionResultCertification: 'NOT_CERTIFIED'
    }
  };
}

async function calculateDevelopmentChart(
  request: ReturnType<typeof toChartRequest>
): Promise<DevelopmentChartReceipt> {
  const response = await fetch('/api/dev/chart/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ chart: request })
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The local chart response was invalid.');
  }

  if (!response.ok) {
    throw new Error('The chart calculation could not be completed.');
  }

  const receipt = parseReceipt(payload);
  if (receipt === null) {
    throw new Error('The local chart response was invalid.');
  }
  return receipt;
}

export default function LocalEngineChartWorkflow({
  locale
}: LocalEngineChartWorkflowProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [snapshot, setSnapshot] = useState<DevelopmentChartSnapshot | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const calculationInFlight = useRef(false);
  const location = useLocationResolution({ locale });
  const resolver = useMemo(
    () => new ServerBackedDevelopmentBirthInputResolver(),
    []
  );

  const handleInputChanged = () => {
    setSnapshot(null);
    setCalculationError(null);
  };

  const handleResolvedInput = async ({
    resolution,
    houseSystem,
    locationResolutionId
  }: ResolvedBirthInputSelection) => {
    if (calculationInFlight.current) return;
    const selectedLocation = location.resolution.selectedLocation;
    if (
      selectedLocation === null ||
      selectedLocation.status !== 'RESOLVED' ||
      selectedLocation.resolutionId !== locationResolutionId
    ) {
      setCalculationError(chartUi(locale, 'birthInput.location.resolutionRequired'));
      return;
    }

    calculationInFlight.current = true;
    setIsCalculating(true);
    setCalculationError(null);
    const request = toChartRequest(resolution, houseSystem, selectedLocation.resolutionId);
    try {
      const receipt = await calculateDevelopmentChart(request);
      setSnapshot({ request, receipt });
    } catch {
      setSnapshot(null);
      setCalculationError(chartUi(locale, 'calculate.error'));
    } finally {
      calculationInFlight.current = false;
      setIsCalculating(false);
    }
  };

  return (
    <div data-local-engine-chart-workflow="enabled">
      <section
        aria-label="Synthetic chart disclosure"
        className="nn-notice nn-notice--research mb-6 border-2 p-5"
        data-testid="synthetic-chart-disclosure"
      >
        <p className="nn-eyebrow font-semibold">ENGINEERING TEST DATA</p>
        <p className="nn-type-card-title mt-1">NOT REAL ASTRONOMICAL OUTPUT</p>
        <p className="nn-type-body-small mt-2">
          This local workflow uses an isolated FakeAstronomyProvider. Results are not scientifically admitted or production certified.
        </p>
      </section>

      <BirthInputForm
        isCalculationPending={isCalculating}
        locale={locale}
        onInputChanged={handleInputChanged}
        onResolvedInput={handleResolvedInput}
        resolver={resolver}
        locationDiagnostics={location.diagnostics}
        locationResolution={location.resolution}
        onLocationCandidateSelect={location.selectCandidate}
        onLocationPanelMounted={location.setPanelMounted}
        onLocationQueryChange={location.setRawQuery}
        requireResolvedLocation
        showDevelopmentDiagnostics={false}
        showDevelopmentInformation={false}
        showInputSavePanel={false}
      />

      <section
        aria-labelledby="local-engine-calculation-title"
        className="nn-surface mt-8 p-5"
      >
        <p className="nn-eyebrow">{chartUi(locale, 'calculate.eyebrow')}</p>
        <h2 className="nn-type-card-title mt-1" id="local-engine-calculation-title">
          {isCalculating
            ? chartUi(locale, 'calculate.status.calculating')
            : snapshot
              ? chartUi(locale, 'calculate.status.completed')
              : chartUi(locale, 'calculate.status.ready')}
        </h2>
        {calculationError ? (
          <p className="nn-notice nn-notice--error mt-4" role="alert">
            {calculationError}
          </p>
        ) : null}
        {snapshot ? (
          <p className="nn-notice nn-notice--success mt-4" role="status" data-testid="chart-calculation-success">
            {chartUi(locale, 'calculate.status.completed')} · {snapshot.request.birth.resolvedUtcInstant}
          </p>
        ) : null}
      </section>

      {snapshot ? (
        <section
          aria-labelledby="local-engine-chart-result-title"
          className="nn-surface mt-8 p-4 sm:p-6"
          data-testid="rendered-development-chart"
        >
          <h2 className="nn-type-card-title" id="local-engine-chart-result-title">
            {chartUi(locale, 'calculate.title')}
          </h2>
          <ChartRenderer
            chart={snapshot.receipt.chart}
            chartKind="natal"
            locale={locale}
            presentationPolicy={createChartPresentationPolicy(snapshot.request)}
          />
        </section>
      ) : null}
    </div>
  );
}
