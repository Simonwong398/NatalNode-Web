import { useEffect } from 'react';
import type { SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '@/core/chart/chart-ui';
import { LOCATION_SEARCH_MINIMUM_CHARACTERS } from './location-resolution';
import LocationResolutionDiagnostics from './LocationResolutionDiagnostics';
import type {
  LocationCandidate,
  LocationResolutionViewState
} from './location-resolution';
import type { LocationResolutionDiagnostics as LocationResolutionDiagnosticsState } from './location-resolution-diagnostics';

interface LocationResolutionPanelProps {
  readonly diagnostics?: LocationResolutionDiagnosticsState;
  readonly isInteractionDisabled?: boolean;
  readonly locale?: SupportedLocale;
  readonly onPanelMounted?: (mounted: boolean) => void;
  readonly onSelectCandidate?: (candidate: LocationCandidate) => void;
  readonly resolution: LocationResolutionViewState;
  readonly showDevelopmentDiagnostics?: boolean;
}

function candidateLabel(candidate: LocationCandidate): string {
  return candidate.canonicalDisplayName;
}

function statusDescription(
  locale: SupportedLocale | undefined,
  resolution: LocationResolutionViewState
): string | null {
  if (resolution.state === 'UNRESOLVED') {
    return Array.from(resolution.rawQuery.trim()).length < LOCATION_SEARCH_MINIMUM_CHARACTERS
      ? chartUi(locale, 'birthInput.location.minimumQuery')
      : chartUi(locale, 'birthInput.location.noResults');
  }

  if (resolution.state === 'ERROR') {
    return resolution.errorMessage ?? chartUi(locale, 'birthInput.location.errorMessage');
  }

  return null;
}

export default function LocationResolutionPanel({
  diagnostics,
  isInteractionDisabled = false,
  locale,
  onPanelMounted,
  onSelectCandidate,
  resolution,
  showDevelopmentDiagnostics = false
}: LocationResolutionPanelProps) {
  useEffect(() => {
    onPanelMounted?.(true);
    return () => onPanelMounted?.(false);
  }, [onPanelMounted]);

  const { state } = resolution;
  const shouldShow = state !== 'EMPTY';
  const attribution =
    resolution.selectedLocation?.source.attribution ??
    resolution.candidates.find((candidate) => candidate.source.attribution !== undefined)
      ?.source.attribution;
  const description = statusDescription(locale, resolution);

  return (
    <div
      aria-live="polite"
      className="mt-4 border-t border-[color:var(--nn-border-subtle)] pt-4"
      data-location-resolution-state={state}
      hidden={!shouldShow}
    >
      <p className="nn-type-label" role="status">
        {state === 'SEARCHING'
          ? chartUi(locale, 'birthInput.location.searching')
          : state === 'CANDIDATES'
            ? chartUi(locale, 'birthInput.location.candidates')
            : state === 'AMBIGUOUS'
              ? chartUi(locale, 'birthInput.location.ambiguous')
              : state === 'RESOLVED'
                ? chartUi(locale, 'birthInput.location.selected')
                : state === 'UNRESOLVED'
                  ? chartUi(locale, 'birthInput.location.unresolved')
                : chartUi(locale, 'birthInput.location.error')}
      </p>

      {description ? (
        <p className="nn-type-body-small mt-2" role={state === 'ERROR' ? 'alert' : undefined}>
          {description}
        </p>
      ) : null}

      {resolution.rawQuery ? (
        <dl className="mt-3 grid gap-2 nn-type-body-small" data-location-raw-query>
          <div>
            <dt className="font-semibold text-natal-primary">
              {chartUi(locale, 'birthInput.location.rawQuery')}
            </dt>
            <dd className="break-words">{resolution.rawQuery}</dd>
          </div>
        </dl>
      ) : null}

      {state === 'CANDIDATES' || state === 'AMBIGUOUS' ? (
        <ul className="mt-3 grid gap-2" data-location-candidates>
          {resolution.candidates.map((candidate) => (
            <li key={candidate.candidateId}>
              <button
                className="nn-button nn-button--quiet w-full justify-between text-left"
                data-location-candidate-id={candidate.candidateId}
                disabled={isInteractionDisabled || onSelectCandidate === undefined}
                onClick={() => onSelectCandidate?.(candidate)}
                type="button"
              >
                <span>{candidateLabel(candidate)}</span>
                <span aria-hidden="true">→</span>
                <span className="sr-only">
                  {chartUi(locale, 'birthInput.location.chooseCandidate')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {state === 'RESOLVED' && resolution.selectedLocation !== null ? (
        <dl className="mt-3 grid gap-2 nn-type-body-small" data-location-canonical>
          <div>
            <dt className="font-semibold text-natal-primary">
              {chartUi(locale, 'birthInput.location.canonicalLocation')}
            </dt>
            <dd>{resolution.selectedLocation.canonicalDisplayName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-natal-primary">
              {chartUi(locale, 'birthInput.location.coordinates')}
            </dt>
            <dd>
              {resolution.selectedLocation.coordinates.latitude}, {resolution.selectedLocation.coordinates.longitude}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-natal-primary">
              {chartUi(locale, 'birthInput.location.timezone')}
            </dt>
            <dd>{resolution.selectedLocation.ianaTimeZone}</dd>
          </div>
        </dl>
      ) : null}

      {state === 'ERROR' && resolution.errorMessage ? (
        description === resolution.errorMessage ? null : (
          <p className="nn-status nn-status--error mt-2" role="alert">
            {resolution.errorMessage}
          </p>
        )
      ) : null}

      {attribution ? (
        <p className="nn-type-metadata mt-3" data-location-attribution>
          {chartUi(locale, 'birthInput.location.attribution')}{' '}
          <a
            href={attribution.url}
            rel="noreferrer noopener"
            target="_blank"
          >
            {attribution.label}
          </a>
        </p>
      ) : null}

      {showDevelopmentDiagnostics && diagnostics ? (
        <LocationResolutionDiagnostics diagnostics={diagnostics} />
      ) : null}
    </div>
  );
}
