import { useEffect, useRef, useState } from 'react';
import {
  getChartRequestAuthorityIssue,
  type BirthRequest,
  type ChartRequest
} from '@natalnode/contracts';
import {
  BirthInputForm,
  type CanonicalResolvedLocation,
  type ResolvedBirthInputSelection,
  useLocationResolution
} from '@/features/chart-input';
import { ChartWorkspace } from '@/features/chart-workspace';
import { engineClient } from '@/lib/engine-client';
import { getLocalizedCurrentPath, type SupportedLocale } from '@/lib/localization';
import { IS_DEVELOPMENT_RUNTIME } from '@/lib/runtime';
import { toChartRequest } from './chart-request';
import { chartUi } from '@/core/chart/chart-ui';
import { resolveVaultSaveIntent } from '@/features/vault/vault-save-intent';
import type { CalculatedChartSnapshot } from './types';
import { DevelopmentBirthInputResolver } from '@/features/chart-input/development-resolver';

const developmentResolver = new DevelopmentBirthInputResolver();

interface ChartExperienceProps {
  readonly locale?: SupportedLocale;
  /** Optional authenticated Vault record to reopen as input. */
  readonly initialVaultRecordId?: string | null;
  /** Production compositions opt into the explicit location authority gate. */
  readonly requireResolvedLocation?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isChartRequest(value: unknown): value is ChartRequest {
  if (!isRecord(value) || !isRecord(value.birth)) {
    return false;
  }

  const birth = value.birth;

  if (
    typeof value.houseSystem !== 'string' ||
    value.houseSystem.trim() === '' ||
    typeof birth.localDate !== 'string' ||
    (typeof birth.localTime !== 'string' && birth.localTime !== null) ||
    typeof birth.locationLabel !== 'string' ||
    (birth.locationResolutionId !== undefined &&
      (typeof birth.locationResolutionId !== 'string' ||
        birth.locationResolutionId === '')) ||
    !isFiniteNumber(birth.latitude) ||
    !isFiniteNumber(birth.longitude) ||
    typeof birth.ianaTimeZone !== 'string' ||
    (typeof birth.resolvedUtcInstant !== 'string' &&
      birth.resolvedUtcInstant !== null) ||
    (!isFiniteNumber(birth.utcOffsetSeconds) &&
      birth.utcOffsetSeconds !== null) ||
    typeof birth.timezoneDatabaseVersion !== 'string' ||
    typeof birth.timezoneResolutionMethod !== 'string' ||
    (birth.ambiguityStatus !== 'EXACT' &&
      birth.ambiguityStatus !== 'AMBIGUOUS' &&
      birth.ambiguityStatus !== 'NONEXISTENT' &&
      birth.ambiguityStatus !== 'UNKNOWN_TIME')
  ) {
    return false;
  }

  const request: ChartRequest = {
    birth: {
      localDate: birth.localDate,
      localTime: birth.localTime,
      locationLabel: birth.locationLabel,
      locationResolutionId:
        typeof birth.locationResolutionId === 'string'
          ? birth.locationResolutionId
          : undefined,
      latitude: birth.latitude,
      longitude: birth.longitude,
      ianaTimeZone: birth.ianaTimeZone,
      resolvedUtcInstant: birth.resolvedUtcInstant,
      utcOffsetSeconds: birth.utcOffsetSeconds,
      timezoneDatabaseVersion: birth.timezoneDatabaseVersion,
      timezoneResolutionMethod: birth.timezoneResolutionMethod,
      ambiguityStatus: birth.ambiguityStatus
    } satisfies BirthRequest,
    houseSystem: value.houseSystem
  };

  return getChartRequestAuthorityIssue(request) === null;
}

function savedLocationFromChartRequest(
  chartRequest: ChartRequest
): CanonicalResolvedLocation | null {
  const birth = chartRequest.birth;
  const resolutionId = birth.locationResolutionId;

  if (resolutionId === undefined) {
    return null;
  }

  return {
    resolutionId,
    canonicalDisplayName: birth.locationLabel,
    locality: null,
    region: null,
    country: birth.locationLabel,
    countryCode: null,
    coordinates: {
      latitude: birth.latitude,
      longitude: birth.longitude
    },
    ianaTimeZone: birth.ianaTimeZone,
    status: 'RESOLVED',
    authority: {
      kind: 'GEOCODING',
      sourceId: 'vault-record',
      recordId: resolutionId
    },
    source: {
      sourceVersion: null,
      datasetVersion: null,
      attribution: null
    }
  };
}

function isVaultRecordResponse(
  value: unknown,
  requestedRecordId: string
): value is { readonly chart: { readonly normalizedChartRequest: ChartRequest } } {
  return (
    isRecord(value) &&
    isRecord(value.chart) &&
    value.chart.chartId === requestedRecordId &&
    isChartRequest(value.chart.normalizedChartRequest)
  );
}

export default function ChartExperience({
  locale,
  initialVaultRecordId = null,
  requireResolvedLocation = false
}: ChartExperienceProps) {
  const [snapshot, setSnapshot] = useState<CalculatedChartSnapshot | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [reopenedChartRequest, setReopenedChartRequest] =
    useState<ChartRequest | null>(null);
  const [reopenedLocation, setReopenedLocation] =
    useState<CanonicalResolvedLocation | null>(null);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [successfulCalculationSequence, setSuccessfulCalculationSequence] = useState(0);
  const calculationInFlightRef = useRef(false);
  const handledResultTransitionRef = useRef(0);
  const resultTargetRef = useRef<HTMLElement>(null);
  const locationResolution = useLocationResolution({
    locale,
    initialResolvedLocation: reopenedLocation ?? undefined
  });

  // These canonical fixture identities remain explicit in the localized UI:
  // UI DEVELOPMENT ONLY, NOT SCIENTIFIC EVIDENCE, NOT PRODUCTION ASTRONOMY.

  useEffect(() => {
    if (initialVaultRecordId === null || initialVaultRecordId === undefined) {
      setReopenedChartRequest(null);
      setReopenedLocation(null);
      setReopenError(null);
      return;
    }

    const requestedRecordId = initialVaultRecordId;
    const abortController = new AbortController();

    async function loadVaultRecord(): Promise<void> {
      try {
        const response = await fetch(
          `/api/vault/charts/${encodeURIComponent(requestedRecordId)}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
            signal: abortController.signal
          }
        );

        if (response.status === 401) {
          window.location.replace(
            getLocalizedCurrentPath(window.location.pathname, '/auth/sign-in')
          );
          return;
        }

        if (response.status !== 200) {
          setReopenError(chartUi(locale, 'vault.savedChartLoadError'));
          return;
        }

        const payload: unknown = await response.json();

        if (!isVaultRecordResponse(payload, requestedRecordId)) {
          setReopenError(chartUi(locale, 'vault.savedChartLoadError'));
          return;
        }

        setReopenedChartRequest(payload.chart.normalizedChartRequest);
        setReopenedLocation(
          savedLocationFromChartRequest(payload.chart.normalizedChartRequest)
        );
        setReopenError(null);
      } catch (_error) {
        if (!abortController.signal.aborted) {
          setReopenError(chartUi(locale, 'vault.savedChartLoadError'));
        }
      }
    }

    void loadVaultRecord();

    return () => abortController.abort();
  }, [initialVaultRecordId, locale]);

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
    houseSystem,
    locationResolutionId
  }: ResolvedBirthInputSelection) => {
    if (calculationInFlightRef.current) {
      return;
    }

    calculationInFlightRef.current = true;
    setIsCalculating(true);
    setCalculationError(null);

    const request = toChartRequest(
      resolution,
      houseSystem,
      locationResolutionId
    );

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

  const handleInputChanged = () => {
    setSnapshot(null);
    setCalculationError(null);
  };

  const handleLocationQueryChange = (rawQuery: string) => {
    handleInputChanged();
    locationResolution.setRawQuery(rawQuery);
  };

  const handleLocationCandidateSelect = (candidate: Parameters<typeof locationResolution.selectCandidate>[0]) => {
    handleInputChanged();
    locationResolution.selectCandidate(candidate);
  };

  const showInputSavePanel =
    snapshot === null || resolveVaultSaveIntent(snapshot.result) === 'INPUT_ONLY';

  return (
    <>
      <BirthInputForm
        resolver={developmentResolver}
        key={
          reopenedChartRequest === null
            ? initialVaultRecordId === null ? 'new-input' : 'vault-input-loading'
            : `vault-input-${initialVaultRecordId}`
        }
        initialChartRequest={reopenedChartRequest ?? undefined}
        isCalculationPending={isCalculating}
        onInputChanged={handleInputChanged}
        onResolvedInput={handleResolvedInput}
        locale={locale}
        locationDiagnostics={locationResolution.diagnostics}
        locationResolution={locationResolution.resolution}
        onLocationCandidateSelect={handleLocationCandidateSelect}
        onLocationPanelMounted={locationResolution.setPanelMounted}
        onLocationQueryChange={handleLocationQueryChange}
        requireResolvedLocation={requireResolvedLocation}
        showInputSavePanel={showInputSavePanel}
        showDevelopmentDiagnostics={IS_DEVELOPMENT_RUNTIME}
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
        {reopenError ? (
          <p className="nn-notice nn-notice--error mt-4" role="alert">
            {reopenError}
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
