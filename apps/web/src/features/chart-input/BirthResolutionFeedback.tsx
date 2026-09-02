import { cn } from '@/lib/utils';
import type { SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '../chart-experience/chart-ui.js';
import { formatCoordinate } from './resolution-telemetry';
import type {
  AmbiguousTimeCandidate,
  BirthInputResolution,
  UnknownTimeBirthInputResolution
} from './types';

type ExactResolution = Extract<BirthInputResolution, { ambiguityStatus: 'EXACT' }>;

type AmbiguousResolution = Extract<BirthInputResolution, { ambiguityStatus: 'AMBIGUOUS' }>;

type ResolutionFeedbackPlacement = 'blocking' | 'non-blocking';

// Presentation-only formatting of the offset supplied by the resolver.
function formatUtcOffset(utcOffsetSeconds: number): string {
  const sign = utcOffsetSeconds < 0 ? '-' : '+';
  const absoluteSeconds = Math.abs(utcOffsetSeconds);
  const hours = Math.floor(absoluteSeconds / 3_600);
  const minutes = Math.floor((absoluteSeconds % 3_600) / 60);

  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

interface ResolutionTelemetryData {
  locationLabel: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  utcOffsetSeconds: number | null;
}

function ResolvedLocationTelemetry({
  heading,
  isDevelopmentFixture = false,
  locale,
  resolution
}: {
  heading: string;
  isDevelopmentFixture?: boolean;
  locale?: SupportedLocale;
  resolution: ResolutionTelemetryData;
}) {
  const latitude = formatCoordinate(resolution.latitude, 'latitude');
  const longitude = formatCoordinate(resolution.longitude, 'longitude');
  const fixtureCoordinates = [latitude, longitude]
    .filter((coordinate): coordinate is string => coordinate !== null)
    .join(' · ');

  if (!resolution.locationLabel && !latitude && !longitude && !resolution.ianaTimeZone) {
    return null;
  }

  return (
    <div className="mt-4 min-w-0">
      <p className="nn-eyebrow">{heading}</p>
      {isDevelopmentFixture ? (
        <p className="nn-type-body-small mt-2">
          {chartUi(locale, 'birthInput.resolution.fixtureExplanation')}
        </p>
      ) : null}
      <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
        {resolution.locationLabel ? (
          <div className="min-w-0">
            <dt className="nn-type-metadata">
              {isDevelopmentFixture
                ? chartUi(locale, 'birthInput.resolution.locationInput')
                : chartUi(locale, 'birthInput.resolution.location')}
            </dt>
            <dd className="nn-type-body-small mt-1 break-words">{resolution.locationLabel}</dd>
          </div>
        ) : null}
        {isDevelopmentFixture ? (
          fixtureCoordinates ? (
            <div className="min-w-0">
              <dt className="nn-type-metadata">
                {chartUi(locale, 'birthInput.resolution.fixtureCoordinates')}
              </dt>
              <dd className="nn-type-numeric mt-1">{fixtureCoordinates}</dd>
            </div>
          ) : null
        ) : (
          <>
            {latitude ? (
              <div className="min-w-0">
                <dt className="nn-type-metadata">
                  {chartUi(locale, 'birthInput.resolution.latitude')}
                </dt>
                <dd className="nn-type-numeric mt-1">{latitude}</dd>
              </div>
            ) : null}
            {longitude ? (
              <div className="min-w-0">
                <dt className="nn-type-metadata">
                  {chartUi(locale, 'birthInput.resolution.longitude')}
                </dt>
                <dd className="nn-type-numeric mt-1">{longitude}</dd>
              </div>
            ) : null}
          </>
        )}
        {resolution.ianaTimeZone ? (
          <div className="min-w-0">
            <dt className="nn-type-metadata">
              {isDevelopmentFixture
                ? chartUi(locale, 'birthInput.resolution.fixtureTimezone')
                : chartUi(locale, 'birthInput.resolution.ianaTimezone')}
            </dt>
            <dd className="nn-type-numeric mt-1 break-words">{resolution.ianaTimeZone}</dd>
          </div>
        ) : null}
        {resolution.utcOffsetSeconds !== null ? (
          <div className="min-w-0">
            <dt className="nn-type-metadata">
              {isDevelopmentFixture
                ? chartUi(locale, 'birthInput.resolution.fixtureUtcOffset')
                : chartUi(locale, 'birthInput.resolution.utcOffset')}
            </dt>
            <dd className="nn-type-numeric mt-1">{formatUtcOffset(resolution.utcOffsetSeconds)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function ExactResolutionPanel({
  isDevelopmentFixture,
  locale,
  resolution
}: {
  isDevelopmentFixture: boolean;
  locale?: SupportedLocale;
  resolution: ExactResolution;
}) {
  return (
    <section
      aria-labelledby="timezone-resolved-title"
      aria-live="polite"
      className={cn(
        'nn-notice mt-5 min-w-0 flex-col',
        isDevelopmentFixture ? 'nn-notice--research' : 'nn-notice--info'
      )}
      role="status"
    >
      <p
        className={cn(
          'nn-eyebrow',
          isDevelopmentFixture ? 'nn-status--research' : 'nn-status--success'
        )}
      >
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.developmentFixture')
          : chartUi(locale, 'birthInput.resolution.confirmed')}
      </p>
      <h3 className="nn-type-card-title" id="timezone-resolved-title">
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.developmentFixtureData')
          : chartUi(locale, 'birthInput.resolution.timezoneResolved')}
      </h3>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.fixtureDetails')
          : chartUi(locale, 'birthInput.resolution.locationResolved')}
        isDevelopmentFixture={isDevelopmentFixture}
        locale={locale}
        resolution={resolution}
      />
    </section>
  );
}

function AmbiguousResolutionPanel({
  isDisabled,
  isDevelopmentFixture,
  locale,
  resolution,
  onSelectCandidate
}: {
  isDisabled: boolean;
  isDevelopmentFixture: boolean;
  locale?: SupportedLocale;
  resolution: AmbiguousResolution;
  onSelectCandidate: (candidate: AmbiguousTimeCandidate) => void;
}) {
  return (
    <section
      aria-labelledby="ambiguous-time-title"
      className="nn-notice nn-notice--trust mt-5 min-w-0 flex-col"
      role="alert"
    >
      <p
        className={cn(
          'nn-eyebrow',
          isDevelopmentFixture ? 'nn-status--research' : 'nn-status--warning'
        )}
      >
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.developmentFixture')
          : chartUi(locale, 'birthInput.resolution.needed')}
      </p>
      <h3 className="nn-type-card-title" id="ambiguous-time-title">
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.ambiguousFixtureState')
          : chartUi(locale, 'birthInput.resolution.localTimeTwice')}
      </h3>
      <p className="nn-type-body-small mt-2">
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.ambiguousFixtureDescription')
          : chartUi(locale, 'birthInput.resolution.ambiguousDescription')}
      </p>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.fixtureContext')
          : chartUi(locale, 'birthInput.resolution.locationContext')}
        isDevelopmentFixture={isDevelopmentFixture}
        locale={locale}
        resolution={resolution}
      />
      <fieldset className="mt-4 grid gap-3">
        <legend className="nn-type-label">
          {isDevelopmentFixture
            ? chartUi(locale, 'birthInput.resolution.selectFixtureCandidate')
            : chartUi(locale, 'birthInput.resolution.selectOccurrence')}
        </legend>
        {resolution.candidates.map((candidate) => {
          const isEarlier = candidate.occurrence === 'EARLIER';

          return (
            <label
              className="nn-surface flex min-h-11 cursor-pointer items-start gap-3 p-3 focus-within:border-[color:var(--nn-accent-supporting)] has-[:checked]:border-[color:var(--nn-accent-primary)] has-[:checked]:bg-[color:var(--nn-surface-selected)]"
              key={candidate.occurrence}
            >
              <input
                className="nn-checkbox mt-0.5"
                disabled={isDisabled}
                name="ambiguous-occurrence"
                onChange={() => onSelectCandidate(candidate)}
                required
                type="radio"
                value={candidate.occurrence}
              />
              <span>
                <span className="nn-type-label block">
                  {isEarlier
                    ? chartUi(locale, 'birthInput.resolution.earlierOccurrence')
                    : chartUi(locale, 'birthInput.resolution.laterOccurrence')}
                </span>
                <span className="nn-type-metadata mt-1 block">
                  {isEarlier
                    ? chartUi(locale, 'birthInput.resolution.firstOccurrence')
                    : chartUi(locale, 'birthInput.resolution.secondOccurrence')}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}

function NonexistentResolutionPanel({
  isDisabled,
  isDevelopmentFixture,
  locale,
  onEditBirthTime,
  resolution
}: {
  isDisabled: boolean;
  isDevelopmentFixture: boolean;
  locale?: SupportedLocale;
  onEditBirthTime: () => void;
  resolution: Extract<BirthInputResolution, { ambiguityStatus: 'NONEXISTENT' }>;
}) {
  return (
    <section
      aria-labelledby="nonexistent-time-title"
      className="nn-notice nn-notice--error mt-5 min-w-0 flex-col"
      role="alert"
    >
      <p className="nn-eyebrow nn-status--error">
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.developmentFixture')
          : chartUi(locale, 'birthInput.resolution.birthTimeNeedsEditing')}
      </p>
      <h3 className="nn-type-card-title" id="nonexistent-time-title">
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.nonexistentFixtureState')
          : chartUi(locale, 'birthInput.resolution.localTimeDidNotExist')}
      </h3>
      <p className="nn-type-body-small mt-2">
        {isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.nonexistentFixtureDescription')
          : chartUi(locale, 'birthInput.resolution.nonexistentDescription')}
      </p>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.fixtureContext')
          : chartUi(locale, 'birthInput.resolution.locationContext')}
        isDevelopmentFixture={isDevelopmentFixture}
        locale={locale}
        resolution={resolution}
      />
      <button
        className="nn-button nn-button--secondary mt-4 self-start"
        disabled={isDisabled}
        onClick={onEditBirthTime}
        type="button"
      >
        {chartUi(locale, 'birthInput.editBirthTime')}
      </button>
    </section>
  );
}

function UnknownTimeResolutionPanel({
  isDevelopmentFixture,
  locale,
  resolution
}: {
  isDevelopmentFixture: boolean;
  locale?: SupportedLocale;
  resolution: UnknownTimeBirthInputResolution;
}) {
  return (
    <section
      aria-labelledby="unknown-time-title"
      aria-live="polite"
      className="nn-notice nn-notice--trust mt-5 min-w-0 flex-col"
      role="status"
    >
      <p className="nn-eyebrow nn-status--trust">
        {chartUi(locale, 'birthInput.resolution.trustLimitation')}
      </p>
      <h3 className="nn-type-card-title" id="unknown-time-title">
        {chartUi(locale, 'birthInput.resolution.exactTimeUnknown')}
      </h3>
      <p className="nn-type-body-small mt-2">
        {chartUi(locale, 'birthInput.resolution.unknownTimeDescription')}
      </p>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture
          ? chartUi(locale, 'birthInput.resolution.fixtureContext')
          : chartUi(locale, 'birthInput.resolution.locationResolved')}
        isDevelopmentFixture={isDevelopmentFixture}
        locale={locale}
        resolution={resolution}
      />
    </section>
  );
}

interface BirthResolutionFeedbackProps {
  isDevelopmentFixture: boolean;
  isInteractionDisabled: boolean;
  locale?: SupportedLocale;
  onEditBirthTime: () => void;
  onSelectCandidate: (candidate: AmbiguousTimeCandidate) => void;
  placement: ResolutionFeedbackPlacement;
  resolution: BirthInputResolution | null;
  resolutionError: string | null;
}

export default function BirthResolutionFeedback({
  isDevelopmentFixture,
  isInteractionDisabled,
  locale,
  onEditBirthTime,
  onSelectCandidate,
  placement,
  resolution,
  resolutionError
}: BirthResolutionFeedbackProps) {
  let resolutionPanel = null;

  switch (resolution?.ambiguityStatus) {
    case 'EXACT':
      resolutionPanel = (
        <ExactResolutionPanel
          isDevelopmentFixture={isDevelopmentFixture}
          locale={locale}
          resolution={resolution}
        />
      );
      break;
    case 'AMBIGUOUS':
      resolutionPanel = (
        <AmbiguousResolutionPanel
          isDisabled={isInteractionDisabled}
          isDevelopmentFixture={isDevelopmentFixture}
          locale={locale}
          onSelectCandidate={onSelectCandidate}
          resolution={resolution}
        />
      );
      break;
    case 'NONEXISTENT':
      resolutionPanel = (
        <NonexistentResolutionPanel
          isDisabled={isInteractionDisabled}
          isDevelopmentFixture={isDevelopmentFixture}
          locale={locale}
          onEditBirthTime={onEditBirthTime}
          resolution={resolution}
        />
      );
      break;
    case 'UNKNOWN_TIME':
      resolutionPanel = (
        <UnknownTimeResolutionPanel
          isDevelopmentFixture={isDevelopmentFixture}
          locale={locale}
          resolution={resolution}
        />
      );
      break;
  }

  const isBlockingResolution =
    resolution?.ambiguityStatus === 'AMBIGUOUS' || resolution?.ambiguityStatus === 'NONEXISTENT';
  const isNonBlockingResolution =
    resolution?.ambiguityStatus === 'EXACT' || resolution?.ambiguityStatus === 'UNKNOWN_TIME';
  const shouldRenderResolutionPanel =
    placement === 'blocking' ? isBlockingResolution : isNonBlockingResolution;

  return (
    <>
      {placement === 'blocking' && resolutionError ? (
        <p className="nn-notice nn-notice--error mt-5 max-w-3xl" role="alert">
          {resolutionError}
        </p>
      ) : null}
      {shouldRenderResolutionPanel ? resolutionPanel : null}
    </>
  );
}
