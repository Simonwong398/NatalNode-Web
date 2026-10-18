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
  readonly mode?: 'synthetic' | 'real-research';
}

interface DevelopmentChartReceipt {
  readonly chart: ChartResultV2;
  readonly assessment: {
    readonly engineResult: 'ENGINE_RESULT_VALID';
    readonly webMapping: 'WEB_RESULT_SEMANTICALLY_MAPPABLE';
    readonly providerScientificAdmission: 'NOT_ADMITTED';
    readonly productionResultCertification: 'NOT_CERTIFIED';
    readonly dataClassification: 'ENGINEERING TEST DATA' | 'REAL ASTRONOMICAL RESEARCH OUTPUT';
    readonly astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT' | 'NOT SCIENTIFICALLY OR PRODUCTION APPROVED';
  };
  readonly source?: {
    readonly engineResult: {
      readonly provider: { readonly id: string; readonly version: string };
      readonly metadata: { readonly provenance: readonly Record<string, unknown>[] };
    };
  };
  readonly execution?: {
    readonly serviceInstanceId: string;
    readonly requestExecutionId: string;
    readonly runtimeIdentity: string;
    readonly status: 'RESEARCH_ONLY';
    readonly provenance: 'INCOMPLETE_RESEARCH';
  };
}

interface DevelopmentChartSnapshot {
  readonly request: ReturnType<typeof toChartRequest>;
  readonly receipt: DevelopmentChartReceipt;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseReceipt(
  value: unknown,
  mode: 'synthetic' | 'real-research'
): DevelopmentChartReceipt | null {
  if (!isRecord(value) || !isRecord(value.receipt)) return null;
  const receipt = value.receipt;
  const chart = receipt.chart;
  const assessment = receipt.assessment;
  const expectedClassification = mode === 'real-research'
    ? 'REAL ASTRONOMICAL RESEARCH OUTPUT'
    : 'ENGINEERING TEST DATA';
  const expectedAstronomicalStatus = mode === 'real-research'
    ? 'NOT SCIENTIFICALLY OR PRODUCTION APPROVED'
    : 'NOT REAL ASTRONOMICAL OUTPUT';
  const source = receipt.source;
  const execution = receipt.execution;
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
    assessment.productionResultCertification !== 'NOT_CERTIFIED' ||
    assessment.dataClassification !== expectedClassification ||
    assessment.astronomicalStatus !== expectedAstronomicalStatus ||
    (mode === 'real-research' && (
      !isRecord(source) || !isRecord(source.engineResult) ||
      !isRecord(source.engineResult.provider) ||
      typeof source.engineResult.provider.id !== 'string' ||
      typeof source.engineResult.provider.version !== 'string' ||
      !isRecord(source.engineResult.metadata) ||
      !Array.isArray(source.engineResult.metadata.provenance) ||
      !source.engineResult.metadata.provenance.every(isRecord) ||
      !isRecord(execution) ||
      typeof execution.serviceInstanceId !== 'string' ||
      typeof execution.requestExecutionId !== 'string' ||
      typeof execution.runtimeIdentity !== 'string' ||
      execution.status !== 'RESEARCH_ONLY' ||
      execution.provenance !== 'INCOMPLETE_RESEARCH'
    ))
  ) {
    return null;
  }
  return {
    chart: chart as unknown as ChartResultV2,
    assessment: {
      engineResult: 'ENGINE_RESULT_VALID',
      webMapping: 'WEB_RESULT_SEMANTICALLY_MAPPABLE',
      providerScientificAdmission: 'NOT_ADMITTED',
      productionResultCertification: 'NOT_CERTIFIED',
      dataClassification: expectedClassification,
      astronomicalStatus: expectedAstronomicalStatus
    },
    ...(mode === 'real-research' ? {
      source: source as DevelopmentChartReceipt['source'],
      execution: execution as DevelopmentChartReceipt['execution']
    } : {})
  };
}

async function calculateDevelopmentChart(
  request: ReturnType<typeof toChartRequest>,
  mode: 'synthetic' | 'real-research'
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
    let code: unknown;
    try {
      const errorPayload: unknown = payload;
      if (isRecord(errorPayload) && isRecord(errorPayload.error)) code = errorPayload.error.code;
    } catch {
      code = null;
    }
    if (mode === 'real-research' && code === 'CALCULATION_BUSY') {
      throw new Error('The private Engine is busy. Try again shortly.');
    }
    if (mode === 'real-research' && code === 'CALCULATION_TIMEOUT') {
      throw new Error('The private Engine calculation timed out.');
    }
    if (mode === 'real-research' && code === 'SERVICE_UNAVAILABLE') {
      throw new Error('The private Engine service is unavailable.');
    }
    throw new Error('The chart calculation could not be completed.');
  }

  const receipt = parseReceipt(payload, mode);
  if (receipt === null) {
    throw new Error('The local chart response was invalid.');
  }
  return receipt;
}

export default function LocalEngineChartWorkflow({
  locale,
  mode = 'synthetic'
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
      const receipt = await calculateDevelopmentChart(request, mode);
      setSnapshot({ request, receipt });
    } catch (error) {
      setSnapshot(null);
      setCalculationError(error instanceof Error ? error.message : chartUi(locale, 'calculate.error'));
    } finally {
      calculationInFlight.current = false;
      setIsCalculating(false);
    }
  };

  return (
    <div data-local-engine-chart-workflow="enabled">
      {mode === 'real-research' ? (
        <section
          aria-label="Real astronomical research output disclosure"
          className="nn-notice nn-notice--research mb-6 border-2 p-5"
          data-testid="real-research-chart-disclosure"
        >
          <p className="nn-eyebrow font-semibold">REAL ASTRONOMICAL RESEARCH OUTPUT</p>
          <p className="nn-type-card-title mt-1">NOT SCIENTIFICALLY OR PRODUCTION APPROVED</p>
          <p className="nn-type-body-small mt-2">
            This result preserves the Engine&apos;s research provenance. It has not been scientifically admitted or approved for production use.
          </p>
        </section>
      ) : (
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
      )}

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

      {mode === 'real-research' && snapshot?.receipt.source && snapshot.receipt.execution ? (
        <details className="nn-surface mt-4 p-4" data-testid="real-research-provenance">
          <summary className="cursor-pointer font-semibold">Engine research provenance</summary>
          <p className="nn-type-body-small mt-3">
            {snapshot.receipt.source.engineResult.provider.id} · {snapshot.receipt.source.engineResult.provider.version}
          </p>
          <p className="nn-type-body-small mt-1">
            Runtime identity: {snapshot.receipt.execution.runtimeIdentity}
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(snapshot.receipt.source.engineResult.metadata.provenance, null, 2)}
          </pre>
        </details>
      ) : null}

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
