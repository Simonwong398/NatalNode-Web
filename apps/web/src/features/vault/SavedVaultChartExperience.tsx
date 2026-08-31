import { useEffect, useState } from 'react';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import type { SupportedLocale } from '../../lib/localization.js';
import type {
  BirthRequest,
  BirthTimeAmbiguityStatus,
  ChartRequest,
  ChartResult,
  GetVaultChartApiResponse,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import ChartWorkspaceView from '@/features/chart-workspace/ChartWorkspaceView';
import { createChartPresentationPolicy } from '@/features/chart-workspace/chart-presentation-policy';
import VaultChartManagement from './VaultChartManagement';
import { vaultUi } from './vault-ui.js';

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

const BIRTH_TIME_AMBIGUITY_STATUSES: readonly BirthTimeAmbiguityStatus[] = [
  'EXACT',
  'AMBIGUOUS',
  'NONEXISTENT',
  'UNKNOWN_TIME'
];

function isBirthTimeAmbiguityStatus(value: unknown): value is BirthTimeAmbiguityStatus {
  return BIRTH_TIME_AMBIGUITY_STATUSES.some((status) => status === value);
}

function isBirthRequest(value: unknown): value is BirthRequest {
  return (
    isRecord(value) &&
    typeof value.localDate === 'string' &&
    isNullableString(value.localTime) &&
    typeof value.locationLabel === 'string' &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    typeof value.ianaTimeZone === 'string' &&
    isNullableString(value.resolvedUtcInstant) &&
    (isFiniteNumber(value.utcOffsetSeconds) || value.utcOffsetSeconds === null) &&
    typeof value.timezoneDatabaseVersion === 'string' &&
    typeof value.timezoneResolutionMethod === 'string' &&
    isBirthTimeAmbiguityStatus(value.ambiguityStatus)
  );
}

function isChartRequest(value: unknown): value is ChartRequest {
  return isRecord(value) && isBirthRequest(value.birth) && typeof value.houseSystem === 'string';
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
    isChartRequest(value.chart.normalizedChartRequest) &&
    isChartResult(value.chart.canonicalChartResult)
  );
}

function readRequestedChartId(): string | null {
  const chartIds = new URL(window.location.href).searchParams.getAll('chartId');

  return chartIds.length === 1 && chartIds[0] !== '' ? chartIds[0] : null;
}

function SavedChartStatus({
  state,
  locale
}: {
  readonly state: Exclude<SavedChartState, { status: 'loaded' }>;
  readonly locale?: SupportedLocale;
}) {
  if (state.status === 'loading') {
    return (
      <p className="nn-async-state" role="status" aria-live="polite">
        {vaultUi(locale, 'vault.savedChartLoading')}
      </p>
    );
  }

  if (state.status === 'unavailable') {
    return (
      <section
        aria-labelledby="saved-chart-unavailable-title"
        className="nn-async-state nn-async-state--empty max-w-2xl"
      >
        <h2 className="nn-type-section-title" id="saved-chart-unavailable-title">
          {vaultUi(locale, 'vault.savedChartUnavailableTitle')}
        </h2>
        <p className="nn-type-body-small mt-2">
          {vaultUi(locale, 'vault.savedChartUnavailableBody')}
        </p>
      </section>
    );
  }

  return (
    <p className="nn-async-state nn-async-state--error" role="alert">
      {vaultUi(locale, 'vault.savedChartLoadError')}
    </p>
  );
}

export default function SavedVaultChartExperience({
  locale
}: {
  readonly locale?: SupportedLocale;
}) {
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
          window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
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
    return <SavedChartStatus state={state} locale={locale} />;
  }

  const presentationPolicy = createChartPresentationPolicy(state.chart.normalizedChartRequest);

  const handleChartUpdated = (updatedChart: VaultChartRecord) => {
    setState((currentState) => {
      if (currentState.status !== 'loaded') {
        return currentState;
      }

      return {
        status: 'loaded',
        chart: {
          ...currentState.chart,
          displayName: updatedChart.displayName,
          category: updatedChart.category,
          tags: updatedChart.tags,
          favorite: updatedChart.favorite,
          updatedAt: updatedChart.updatedAt
        }
      };
    });
  };

  return (
    <VaultChartManagement
      chart={state.chart}
      onChartUpdated={handleChartUpdated}
      locale={locale}
      onDeleted={() => window.location.replace(getLocalizedCurrentPath(window.location.pathname, '/vault'))}
    >
      <ChartWorkspaceView
        chart={state.chart.canonicalChartResult}
        presentationPolicy={presentationPolicy}
        requestedHouseSystem={state.chart.normalizedChartRequest.houseSystem}
      />
    </VaultChartManagement>
  );
}
