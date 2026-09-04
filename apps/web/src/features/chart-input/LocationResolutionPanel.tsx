import type { SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '@/core/chart/chart-ui';
import type {
  LocationCandidate,
  LocationResolutionViewState
} from './location-resolution';

interface LocationResolutionPanelProps {
  readonly isInteractionDisabled?: boolean;
  readonly locale?: SupportedLocale;
  readonly onSelectCandidate?: (candidate: LocationCandidate) => void;
  readonly resolution: LocationResolutionViewState;
}

function candidateLabel(candidate: LocationCandidate): string {
  return [candidate.canonicalDisplayName, candidate.locality, candidate.region, candidate.country]
    .filter((part): part is string => part !== null && part.trim() !== '')
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
}

export default function LocationResolutionPanel({
  isInteractionDisabled = false,
  locale,
  onSelectCandidate,
  resolution
}: LocationResolutionPanelProps) {
  const { state } = resolution;
  const shouldShow = state !== 'EMPTY';

  return (
    <div
      aria-live="polite"
      className="mt-4 border-t border-[color:var(--nn-border-subtle)] pt-4"
      data-location-resolution-state={state}
      hidden={!shouldShow}
    >
      <p className="nn-type-label">
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
        <p className="nn-status nn-status--error mt-2" role="alert">
          {resolution.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
