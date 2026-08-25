import { useEffect, useState } from 'react';
import type {
  ChartResult,
  GetVaultChartApiResponse,
  VaultChartCategory
} from '@natalnode/contracts';
import ChartWorkspaceView from '@/features/chart-workspace/ChartWorkspaceView';

const VAULT_CHART_ENDPOINT = '/api/vault/charts';
const SIGN_IN_PATH = '/auth/sign-in';
const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

type SavedChartState =
  | { readonly status: 'loading' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'failed' }
  | {
      readonly status: 'loaded';
      readonly chart: GetVaultChartApiResponse['chart'];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
}

function isBodyFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.bodyId === 'string' &&
    isFiniteNumber(value.longitude) &&
    typeof value.sign === 'string' &&
    (value.house === null || isFiniteNumber(value.house)) &&
    (value.retrograde === null || typeof value.retrograde === 'boolean')
  );
}

function isAngleFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.angleId === 'string' &&
    isFiniteNumber(value.longitude) &&
    typeof value.sign === 'string'
  );
}

function isHouseFacts(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.system === 'string' &&
    Array.isArray(value.cusps) &&
    value.cusps.every(
      (cusp) =>
        isRecord(cusp) &&
        isFiniteNumber(cusp.house) &&
        isFiniteNumber(cusp.longitude)
    )
  );
}

function isAspectFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.firstBodyId === 'string' &&
    typeof value.secondBodyId === 'string' &&
    typeof value.type === 'string' &&
    isFiniteNumber(value.orb) &&
    (value.phaseState === null ||
      value.phaseState === 'APPLYING' ||
      value.phaseState === 'EXACT' ||
      value.phaseState === 'SEPARATING')
  );
}

function isCalculationWarning(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    (value.severity === 'INFO' ||
      value.severity === 'WARNING' ||
      value.severity === 'ERROR')
  );
}

function hasValidScientificMetadata(value: Record<string, unknown>): boolean {
  if (!isRecord(value.metadata)) {
    return false;
  }

  if (value.calculationStatus === 'COMPLETE') {
    return (
      value.metadata.configurationStatus === 'COMPLETE' &&
      typeof value.metadata.astronomyConfigurationId === 'string' &&
      isNullableString(value.metadata.provenanceEnvelopeId)
    );
  }

  if (value.calculationStatus === 'INCOMPLETE_RESEARCH') {
    return (
      value.metadata.configurationStatus === 'INCOMPLETE_RESEARCH' &&
      value.metadata.astronomyConfigurationId === null &&
      value.metadata.provenanceEnvelopeId === null &&
      value.metadata.reason === 'INCOMPLETE_RESEARCH'
    );
  }

  return false;
}

function isChartResult(value: unknown): value is ChartResult {
  return (
    isRecord(value) &&
    typeof value.schemaVersion === 'string' &&
    typeof value.engineVersion === 'string' &&
    Array.isArray(value.bodies) &&
    value.bodies.every((body) => isBodyFact(body)) &&
    Array.isArray(value.angles) &&
    value.angles.every((angle) => isAngleFact(angle)) &&
    (value.houses === null || isHouseFacts(value.houses)) &&
    Array.isArray(value.aspects) &&
    value.aspects.every((aspect) => isAspectFact(aspect)) &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => isCalculationWarning(warning)) &&
    hasValidScientificMetadata(value)
  );
}

function isGetVaultChartApiResponse(
  value: unknown,
  requestedChartId: string
): value is GetVaultChartApiResponse {
  return (
    isRecord(value) &&
    isRecord(value.chart) &&
    value.chart.chartId === requestedChartId &&
    typeof value.chart.displayName === 'string' &&
    isVaultChartCategory(value.chart.category) &&
    typeof value.chart.createdAt === 'string' &&
    isChartResult(value.chart.canonicalChartResult)
  );
}

function readRequestedChartId(): string | null {
  const chartIds = new URL(window.location.href).searchParams.getAll('chartId');

  return chartIds.length === 1 && chartIds[0] !== '' ? chartIds[0] : null;
}

function SavedChartStatus({ state }: { state: Exclude<SavedChartState, { status: 'loaded' }> }) {
  if (state.status === 'loading') {
    return (
      <p className="text-sm text-natal-muted" role="status" aria-live="polite">
        Loading saved chart…
      </p>
    );
  }

  if (state.status === 'unavailable') {
    return (
      <section
        aria-labelledby="saved-chart-unavailable-title"
        className="rounded-2xl border border-natal-border bg-natal-surface/75 p-6 sm:p-8"
      >
        <h2 className="text-xl font-semibold text-white" id="saved-chart-unavailable-title">
          Saved chart unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-natal-muted">
          This saved chart is unavailable.
        </p>
      </section>
    );
  }

  return (
    <p
      className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-5 text-sm text-rose-100"
      role="alert"
    >
      We couldn't load this saved chart. Please try again.
    </p>
  );
}

export default function SavedVaultChartExperience() {
  const [state, setState] = useState<SavedChartState>({ status: 'loading' });

  useEffect(() => {
    let parsedChartId: string | null;

    try {
      parsedChartId = readRequestedChartId();
    } catch (_error) {
      setState({ status: 'unavailable' });
      return;
    }

    if (parsedChartId === null) {
      setState({ status: 'unavailable' });
      return;
    }

    const requestedChartId = parsedChartId;
    const abortController = new AbortController();

    async function loadSavedChart(): Promise<void> {
      try {
        const response = await fetch(
          `${VAULT_CHART_ENDPOINT}/${encodeURIComponent(requestedChartId)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            },
            credentials: 'same-origin',
            cache: 'no-store',
            signal: abortController.signal
          }
        );

        if (response.status === 401) {
          window.location.replace(SIGN_IN_PATH);
          return;
        }

        if (response.status === 404) {
          setState({ status: 'unavailable' });
          return;
        }

        if (response.status !== 200) {
          setState({ status: 'failed' });
          return;
        }

        const payload: unknown = await response.json();

        if (!isGetVaultChartApiResponse(payload, requestedChartId)) {
          setState({ status: 'failed' });
          return;
        }

        setState({ status: 'loaded', chart: payload.chart });
      } catch (_error) {
        if (!abortController.signal.aborted) {
          setState({ status: 'failed' });
        }
      }
    }

    void loadSavedChart();

    return () => abortController.abort();
  }, []);

  if (state.status !== 'loaded') {
    return <SavedChartStatus state={state} />;
  }

  return (
    <div>
      <header className="mb-6 rounded-2xl border border-natal-border bg-natal-surface/75 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-natal-accent">
          {state.chart.category}
        </p>
        <h2 className="mt-2 break-words text-2xl font-semibold text-white">
          {state.chart.displayName}
        </h2>
        <time className="mt-3 block text-sm text-natal-muted" dateTime={state.chart.createdAt}>
          Saved {state.chart.createdAt}
        </time>
      </header>

      <ChartWorkspaceView chart={state.chart.canonicalChartResult} />
    </div>
  );
}
