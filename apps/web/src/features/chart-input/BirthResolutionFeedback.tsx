import { cn } from '@/lib/utils';
import { formatCoordinate } from './resolution-telemetry';
import type {
  AmbiguousTimeCandidate,
  BirthInputResolution,
  UnknownTimeBirthInputResolution
} from './types';

type ExactResolution = Extract<BirthInputResolution, { ambiguityStatus: 'EXACT' }>;

type AmbiguousResolution = Extract<BirthInputResolution, { ambiguityStatus: 'AMBIGUOUS' }>;

const DEVELOPMENT_FIXTURE_EXPLANATION =
  'This development resolver preserves your entered place label but uses fixed New York coordinate/timezone fixture data for UI testing; the fixture data is not derived from that place, is not historical timezone evidence, and is not production resolution.';

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
  resolution
}: {
  heading: string;
  isDevelopmentFixture?: boolean;
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
        <p className="nn-type-body-small mt-2">{DEVELOPMENT_FIXTURE_EXPLANATION}</p>
      ) : null}
      <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
        {resolution.locationLabel ? (
          <div className="min-w-0">
            <dt className="nn-type-metadata">
              {isDevelopmentFixture ? 'Location input' : 'Location'}
            </dt>
            <dd className="nn-type-body-small mt-1 break-words">{resolution.locationLabel}</dd>
          </div>
        ) : null}
        {isDevelopmentFixture ? (
          fixtureCoordinates ? (
            <div className="min-w-0">
              <dt className="nn-type-metadata">Fixture coordinates</dt>
              <dd className="nn-type-numeric mt-1">{fixtureCoordinates}</dd>
            </div>
          ) : null
        ) : (
          <>
            {latitude ? (
              <div className="min-w-0">
                <dt className="nn-type-metadata">Latitude</dt>
                <dd className="nn-type-numeric mt-1">{latitude}</dd>
              </div>
            ) : null}
            {longitude ? (
              <div className="min-w-0">
                <dt className="nn-type-metadata">Longitude</dt>
                <dd className="nn-type-numeric mt-1">{longitude}</dd>
              </div>
            ) : null}
          </>
        )}
        {resolution.ianaTimeZone ? (
          <div className="min-w-0">
            <dt className="nn-type-metadata">
              {isDevelopmentFixture ? 'Fixture timezone' : 'IANA timezone'}
            </dt>
            <dd className="nn-type-numeric mt-1 break-words">{resolution.ianaTimeZone}</dd>
          </div>
        ) : null}
        {resolution.utcOffsetSeconds !== null ? (
          <div className="min-w-0">
            <dt className="nn-type-metadata">
              {isDevelopmentFixture ? 'Fixture UTC offset' : 'UTC offset'}
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
  resolution
}: {
  isDevelopmentFixture: boolean;
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
        {isDevelopmentFixture ? 'Development fixture' : 'Resolution confirmed'}
      </p>
      <h3 className="nn-type-card-title" id="timezone-resolved-title">
        {isDevelopmentFixture ? 'Development fixture data' : 'Timezone resolved'}
      </h3>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture ? 'Fixture details' : 'Location resolved'}
        isDevelopmentFixture={isDevelopmentFixture}
        resolution={resolution}
      />
    </section>
  );
}

function AmbiguousResolutionPanel({
  isDisabled,
  isDevelopmentFixture,
  resolution,
  onSelectCandidate
}: {
  isDisabled: boolean;
  isDevelopmentFixture: boolean;
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
        {isDevelopmentFixture ? 'Development fixture' : 'Resolution needed'}
      </p>
      <h3 className="nn-type-card-title" id="ambiguous-time-title">
        {isDevelopmentFixture ? 'Ambiguous fixture state' : 'This local time occurred twice'}
      </h3>
      <p className="nn-type-body-small mt-2">
        {isDevelopmentFixture
          ? 'This development fixture simulates two candidate occurrences for UI testing. Choose one; NatalNode will not silently choose one.'
          : 'Choose which occurrence matches the birth record. NatalNode will not silently choose one.'}
      </p>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture ? 'Fixture context' : 'Location context'}
        isDevelopmentFixture={isDevelopmentFixture}
        resolution={resolution}
      />
      <fieldset className="mt-4 grid gap-3">
        <legend className="nn-type-label">
          {isDevelopmentFixture ? 'Select a fixture candidate' : 'Select an occurrence'}
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
                  {isEarlier ? 'Earlier occurrence' : 'Later occurrence'}
                </span>
                <span className="nn-type-metadata mt-1 block">
                  {isEarlier
                    ? 'The first occurrence of this local clock time.'
                    : 'The second occurrence of this local clock time.'}
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
  onEditBirthTime,
  resolution
}: {
  isDisabled: boolean;
  isDevelopmentFixture: boolean;
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
        {isDevelopmentFixture ? 'Development fixture' : 'Birth time needs editing'}
      </p>
      <h3 className="nn-type-card-title" id="nonexistent-time-title">
        {isDevelopmentFixture ? 'Nonexistent fixture state' : 'This local time did not exist'}
      </h3>
      <p className="nn-type-body-small mt-2">
        {isDevelopmentFixture
          ? 'This development fixture simulates a nonexistent local time for UI testing. It does not establish a real historical DST gap for the entered place and date. The fixture was not shifted or replaced.'
          : 'The entered local time did not exist at this location and date. It was not shifted or replaced.'}
      </p>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture ? 'Fixture context' : 'Location context'}
        isDevelopmentFixture={isDevelopmentFixture}
        resolution={resolution}
      />
      <button
        className="nn-button nn-button--secondary mt-4 self-start"
        disabled={isDisabled}
        onClick={onEditBirthTime}
        type="button"
      >
        Edit birth time
      </button>
    </section>
  );
}

function UnknownTimeResolutionPanel({
  isDevelopmentFixture,
  resolution
}: {
  isDevelopmentFixture: boolean;
  resolution: UnknownTimeBirthInputResolution;
}) {
  return (
    <section
      aria-labelledby="unknown-time-title"
      aria-live="polite"
      className="nn-notice nn-notice--trust mt-5 min-w-0 flex-col"
      role="status"
    >
      <p className="nn-eyebrow nn-status--trust">Trust limitation</p>
      <h3 className="nn-type-card-title" id="unknown-time-title">
        Exact birth time unknown
      </h3>
      <p className="nn-type-body-small mt-2">
        Without an exact birth time, Ascendant, Midheaven, houses, and house-based interpretation will be unavailable.
      </p>
      <ResolvedLocationTelemetry
        heading={isDevelopmentFixture ? 'Fixture context' : 'Location resolved'}
        isDevelopmentFixture={isDevelopmentFixture}
        resolution={resolution}
      />
    </section>
  );
}

interface BirthResolutionFeedbackProps {
  isDevelopmentFixture: boolean;
  isInteractionDisabled: boolean;
  onEditBirthTime: () => void;
  onSelectCandidate: (candidate: AmbiguousTimeCandidate) => void;
  resolution: BirthInputResolution | null;
  resolutionError: string | null;
}

export default function BirthResolutionFeedback({
  isDevelopmentFixture,
  isInteractionDisabled,
  onEditBirthTime,
  onSelectCandidate,
  resolution,
  resolutionError
}: BirthResolutionFeedbackProps) {
  let resolutionPanel = null;

  switch (resolution?.ambiguityStatus) {
    case 'EXACT':
      resolutionPanel = (
        <ExactResolutionPanel
          isDevelopmentFixture={isDevelopmentFixture}
          resolution={resolution}
        />
      );
      break;
    case 'AMBIGUOUS':
      resolutionPanel = (
        <AmbiguousResolutionPanel
          isDisabled={isInteractionDisabled}
          isDevelopmentFixture={isDevelopmentFixture}
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
          onEditBirthTime={onEditBirthTime}
          resolution={resolution}
        />
      );
      break;
    case 'UNKNOWN_TIME':
      resolutionPanel = (
        <UnknownTimeResolutionPanel
          isDevelopmentFixture={isDevelopmentFixture}
          resolution={resolution}
        />
      );
      break;
  }

  return (
    <>
      {resolutionError ? (
        <p className="nn-notice nn-notice--error mt-5 max-w-3xl" role="alert">
          {resolutionError}
        </p>
      ) : null}
      {resolutionPanel}
    </>
  );
}
