import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DEVELOPMENT_RESOLVER_NOTICE,
  DevelopmentBirthInputResolver
} from './development-resolver';
import type { BirthInputResolver } from './resolver';
import {
  INITIAL_BIRTH_INPUT_STATE,
  type AmbiguousTimeCandidate,
  type BirthInputDraft,
  type BirthInputResolution,
  type CalculationReadyBirthInputResolution,
  type HouseSystem
} from './types';

type ValidationField = 'localDate' | 'localTime' | 'locationLabel' | 'houseSystem';

type ValidationErrors = Partial<Record<ValidationField, string>>;

type EditableDraft = Pick<
  BirthInputDraft,
  'localDate' | 'localTime' | 'locationLabel' | 'houseSystem'
>;

type ExactResolution = Extract<BirthInputResolution, { ambiguityStatus: 'EXACT' }>;

type AmbiguousResolution = Extract<BirthInputResolution, { ambiguityStatus: 'AMBIGUOUS' }>;

const inputClassName = 'nn-field';

const defaultResolver: BirthInputResolver = new DevelopmentBirthInputResolver();

export interface BirthInputFormProps {
  isCalculationPending?: boolean;
  onResolvedInput: (selection: ResolvedBirthInputSelection) => void;
  resolver?: BirthInputResolver;
}

export interface ResolvedBirthInputSelection {
  resolution: CalculationReadyBirthInputResolution;
  houseSystem: HouseSystem;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="nn-status nn-status--error mt-2" id={id} role="alert">
      {message}
    </p>
  );
}

function validateDraft(draft: BirthInputDraft, unknownTime: boolean): ValidationErrors {
  const nextErrors: ValidationErrors = {};

  if (!draft.localDate) {
    nextErrors.localDate = 'Enter a birth date.';
  }

  if (!unknownTime && !draft.localTime) {
    nextErrors.localTime = 'Enter a birth time or choose the unknown-time option.';
  }

  if (!draft.locationLabel.trim()) {
    nextErrors.locationLabel = 'Enter a birth place.';
  }

  if (!draft.houseSystem) {
    nextErrors.houseSystem = 'Choose a house system.';
  }

  return nextErrors;
}

function applyResolutionToDraft(
  current: BirthInputDraft,
  resolution: BirthInputResolution
): BirthInputDraft {
  return {
    ...current,
    localDate: resolution.localDate,
    localTime: resolution.localTime,
    locationLabel: resolution.locationLabel,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    ianaTimeZone: resolution.ianaTimeZone,
    resolvedUtcInstant: resolution.resolvedUtcInstant,
    utcOffsetSeconds: resolution.utcOffsetSeconds,
    timezoneDatabaseVersion: resolution.timezoneDatabaseVersion,
    timezoneResolutionMethod: resolution.timezoneResolutionMethod,
    ambiguityStatus: resolution.ambiguityStatus
  };
}

function toExactResolution(
  resolution: AmbiguousResolution,
  candidate: AmbiguousTimeCandidate
): ExactResolution {
  return {
    localDate: resolution.localDate,
    localTime: resolution.localTime,
    locationLabel: resolution.locationLabel,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    ianaTimeZone: resolution.ianaTimeZone,
    resolvedUtcInstant: candidate.resolvedUtcInstant,
    utcOffsetSeconds: candidate.utcOffsetSeconds,
    timezoneDatabaseVersion: resolution.timezoneDatabaseVersion,
    timezoneResolutionMethod: resolution.timezoneResolutionMethod,
    ambiguityStatus: 'EXACT'
  };
}

// Presentation-only formatting of the offset supplied by the resolver.
function formatUtcOffset(utcOffsetSeconds: number): string {
  const sign = utcOffsetSeconds < 0 ? '-' : '+';
  const absoluteSeconds = Math.abs(utcOffsetSeconds);
  const hours = Math.floor(absoluteSeconds / 3_600);
  const minutes = Math.floor((absoluteSeconds % 3_600) / 60);

  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function ExactResolutionPanel({ resolution }: { resolution: ExactResolution }) {
  return (
    <section
      aria-labelledby="birth-time-resolved-title"
      aria-live="polite"
      className="nn-notice nn-notice--info mt-5 min-w-0 flex-col"
      role="status"
    >
      <p className="nn-eyebrow nn-status--success">Resolution confirmed</p>
      <h3 className="nn-type-card-title" id="birth-time-resolved-title">
        Birth time resolved
      </h3>
      <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
        <div>
          <dt className="nn-type-metadata">Location</dt>
          <dd className="nn-type-body-small mt-1 break-words">{resolution.locationLabel}</dd>
        </div>
        <div>
          <dt className="nn-type-metadata">Timezone</dt>
          <dd className="nn-type-body-small mt-1 break-words">{resolution.ianaTimeZone}</dd>
        </div>
        <div>
          <dt className="nn-type-metadata">UTC offset</dt>
          <dd className="nn-type-numeric mt-1">{formatUtcOffset(resolution.utcOffsetSeconds)}</dd>
        </div>
      </dl>
    </section>
  );
}

function AmbiguousResolutionPanel({
  isDisabled,
  resolution,
  onSelectCandidate
}: {
  isDisabled: boolean;
  resolution: AmbiguousResolution;
  onSelectCandidate: (candidate: AmbiguousTimeCandidate) => void;
}) {
  return (
    <section
      aria-labelledby="ambiguous-time-title"
      className="nn-notice nn-notice--trust mt-5 min-w-0 flex-col"
      role="alert"
    >
      <p className="nn-eyebrow nn-status--warning">Resolution needed</p>
      <h3 className="nn-type-card-title" id="ambiguous-time-title">
        This local time occurred twice
      </h3>
      <p className="nn-type-body-small mt-2">
        Choose which occurrence matches the birth record. NatalNode will not silently choose one.
      </p>
      <fieldset className="mt-4 grid gap-3">
        <legend className="nn-type-label">Select an occurrence</legend>
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
  onEditBirthTime
}: {
  isDisabled: boolean;
  onEditBirthTime: () => void;
}) {
  return (
    <section
      aria-labelledby="nonexistent-time-title"
      className="nn-notice nn-notice--error mt-5 min-w-0 flex-col"
      role="alert"
    >
      <p className="nn-eyebrow nn-status--error">Birth time needs editing</p>
      <h3 className="nn-type-card-title" id="nonexistent-time-title">
        This local time did not exist
      </h3>
      <p className="nn-type-body-small mt-2">
        The entered local time did not exist at this location and date. It was not shifted or replaced.
      </p>
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

function UnknownTimeResolutionPanel() {
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
    </section>
  );
}

function ResolutionPanel({
  isInteractionDisabled,
  resolution,
  onSelectCandidate,
  onEditBirthTime
}: {
  isInteractionDisabled: boolean;
  resolution: BirthInputResolution | null;
  onSelectCandidate: (candidate: AmbiguousTimeCandidate) => void;
  onEditBirthTime: () => void;
}) {
  if (!resolution) {
    return null;
  }

  switch (resolution.ambiguityStatus) {
    case 'EXACT':
      return <ExactResolutionPanel resolution={resolution} />;
    case 'AMBIGUOUS':
      return (
        <AmbiguousResolutionPanel
          isDisabled={isInteractionDisabled}
          onSelectCandidate={onSelectCandidate}
          resolution={resolution}
        />
      );
    case 'NONEXISTENT':
      return (
        <NonexistentResolutionPanel
          isDisabled={isInteractionDisabled}
          onEditBirthTime={onEditBirthTime}
        />
      );
    case 'UNKNOWN_TIME':
      return <UnknownTimeResolutionPanel />;
  }
}

export default function BirthInputForm({
  isCalculationPending = false,
  onResolvedInput,
  resolver = defaultResolver
}: BirthInputFormProps) {
  const [draft, setDraft] = useState<BirthInputDraft>(INITIAL_BIRTH_INPUT_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [resolution, setResolution] = useState<BirthInputResolution | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const latestRequestRef = useRef(0);
  const unknownTime = draft.ambiguityStatus === 'UNKNOWN_TIME';
  const isInteractionDisabled = isResolving || isCalculationPending;

  const invalidateResolution = () => {
    latestRequestRef.current += 1;
    setResolution(null);
    setResolutionError(null);
    setIsResolving(false);
  };

  const updateEditableDraft = (patch: Partial<EditableDraft>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
      latitude: null,
      longitude: null,
      ianaTimeZone: null,
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      timezoneDatabaseVersion: null,
      timezoneResolutionMethod: null,
      ambiguityStatus: current.ambiguityStatus === 'UNKNOWN_TIME' ? 'UNKNOWN_TIME' : 'UNRESOLVED'
    }));
    invalidateResolution();
  };

  const handleUnknownTimeChange = (checked: boolean) => {
    setDraft((current) => ({
      ...current,
      localTime: checked ? null : '',
      latitude: null,
      longitude: null,
      ianaTimeZone: null,
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      timezoneDatabaseVersion: null,
      timezoneResolutionMethod: null,
      ambiguityStatus: checked ? 'UNKNOWN_TIME' : 'UNRESOLVED'
    }));
    setErrors((current) => {
      if (!current.localTime) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.localTime;
      return nextErrors;
    });
    invalidateResolution();
  };

  const handleCandidateSelection = (candidate: AmbiguousTimeCandidate) => {
    if (
      resolution?.ambiguityStatus !== 'AMBIGUOUS' ||
      isCalculationPending ||
      !draft.houseSystem
    ) {
      return;
    }

    const exactResolution = toExactResolution(resolution, candidate);
    setResolution(exactResolution);
    setDraft((current) => applyResolutionToDraft(current, exactResolution));
    setResolutionError(null);
    setIsResolving(false);
    latestRequestRef.current += 1;
    onResolvedInput({ resolution: exactResolution, houseSystem: draft.houseSystem });
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (isCalculationPending) {
      return;
    }

    const nextErrors = validateDraft(draft, unknownTime);
    setErrors(nextErrors);
    setResolutionError(null);

    if (Object.keys(nextErrors).length > 0 || !draft.houseSystem) {
      invalidateResolution();
      return;
    }

    const selectedHouseSystem = draft.houseSystem;

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsResolving(true);

    try {
      const nextResolution = await resolver.resolve({ ...draft });

      if (latestRequestRef.current !== requestId) {
        return;
      }

      setResolution(nextResolution);
      setDraft((current) => applyResolutionToDraft(current, nextResolution));

      if (
        nextResolution.ambiguityStatus === 'EXACT' ||
        nextResolution.ambiguityStatus === 'UNKNOWN_TIME'
      ) {
        onResolvedInput({ resolution: nextResolution, houseSystem: selectedHouseSystem });
      }
    } catch {
      if (latestRequestRef.current !== requestId) {
        return;
      }

      setResolution(null);
      setResolutionError('Birth input resolution is unavailable in this development environment.');
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsResolving(false);
      }
    }
  };

  return (
    <section
      aria-labelledby="birth-input-title"
      className="nn-surface nn-surface--elevated mt-10 min-w-0 p-5 sm:p-7"
    >
      <header className="nn-section-header max-w-3xl">
        <p className="nn-eyebrow">Birth Input</p>
        <h2 className="nn-type-section-title" id="birth-input-title">
          Start with the details you know
        </h2>
        <p className="nn-type-body-small">
          Timezone resolution stays explicit, so an uncertain birth time is never replaced with a guessed value.
        </p>
      </header>

      <form className="mt-6 grid gap-5" noValidate onSubmit={handleSubmit}>
        <section
          aria-labelledby="birth-date-time-title"
          className="nn-surface min-w-0 p-4 sm:p-5"
        >
          <div className="nn-section-header">
            <p className="nn-eyebrow">Group 1</p>
            <h3 className="nn-type-card-title" id="birth-date-time-title">
              Birth Date &amp; Time
            </h3>
            <p className="nn-type-body-small">
              Enter the local date and time recorded at the birth place.
            </p>
          </div>

          <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="nn-type-label" htmlFor="birth-date">
                Birth date
              </label>
              <input
                aria-describedby={errors.localDate ? 'birth-date-error' : undefined}
                aria-invalid={Boolean(errors.localDate)}
                className={inputClassName}
                disabled={isInteractionDisabled}
                id="birth-date"
                name="localDate"
                onChange={(event) => updateEditableDraft({ localDate: event.target.value })}
                required
                type="date"
                value={draft.localDate}
              />
              <FieldError id="birth-date-error" message={errors.localDate} />
            </div>

            <div className="min-w-0">
              <label className="nn-type-label" htmlFor="birth-time">
                Birth time
              </label>
              <input
                aria-describedby={errors.localTime ? 'birth-time-error' : 'birth-time-help'}
                aria-invalid={Boolean(errors.localTime)}
                className={inputClassName}
                disabled={unknownTime || isInteractionDisabled}
                id="birth-time"
                name="localTime"
                onChange={(event) => updateEditableDraft({ localTime: event.target.value })}
                ref={timeInputRef}
                required={!unknownTime}
                step="60"
                type="time"
                value={draft.localTime ?? ''}
              />
              <p className="nn-type-metadata mt-2" id="birth-time-help">
                Use the local time recorded at the birth place.
              </p>
              <label
                className="nn-surface mt-4 flex min-h-11 cursor-pointer items-start gap-3 p-3 focus-within:border-[color:var(--nn-accent-supporting)]"
                htmlFor="unknown-time"
              >
                <input
                  checked={unknownTime}
                  className="nn-checkbox mt-0.5 shrink-0"
                  disabled={isInteractionDisabled}
                  id="unknown-time"
                  name="unknownTime"
                  onChange={(event) => handleUnknownTimeChange(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="nn-type-label block">I don&apos;t know my exact birth time</span>
                  <span className="nn-type-metadata mt-1 block">
                    Keep time unknown; this is a trust limitation, not an input error.
                  </span>
                </span>
              </label>
              <FieldError id="birth-time-error" message={errors.localTime} />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="place-timezone-title"
          className="nn-surface min-w-0 p-4 sm:p-5"
        >
          <div className="nn-section-header">
            <p className="nn-eyebrow">Group 2</p>
            <h3 className="nn-type-card-title" id="place-timezone-title">
              Place &amp; Timezone Resolution
            </h3>
            <p className="nn-type-body-small">
              Birth place establishes the development resolver&apos;s timezone and historical-time context.
            </p>
          </div>

          <div className="mt-5 max-w-3xl">
            <label className="nn-type-label" htmlFor="birth-place">
              Birth place
            </label>
            <input
              aria-describedby={errors.locationLabel ? 'birth-place-error' : undefined}
              aria-invalid={Boolean(errors.locationLabel)}
              className={inputClassName}
              disabled={isInteractionDisabled}
              id="birth-place"
              name="locationLabel"
              onChange={(event) => updateEditableDraft({ locationLabel: event.target.value })}
              placeholder="City, region, country"
              required
              type="text"
              value={draft.locationLabel}
            />
            <FieldError id="birth-place-error" message={errors.locationLabel} />

            {resolutionError ? (
              <p className="nn-notice nn-notice--error mt-5" role="alert">
                {resolutionError}
              </p>
            ) : null}
            <ResolutionPanel
              isInteractionDisabled={isInteractionDisabled}
              onEditBirthTime={() => timeInputRef.current?.focus()}
              onSelectCandidate={handleCandidateSelection}
              resolution={resolution}
            />
          </div>
        </section>

        <section
          aria-labelledby="chart-settings-title"
          className="nn-surface min-w-0 p-4 sm:p-5"
        >
          <div className="nn-section-header">
            <p className="nn-eyebrow">Group 3</p>
            <h3 className="nn-type-card-title" id="chart-settings-title">
              Chart Settings
            </h3>
            <p className="nn-type-body-small">
              Choose the house system for the resolved chart.
            </p>
          </div>

          <div className="mt-5 max-w-sm">
            <label className="nn-type-label" htmlFor="house-system">
              House system
            </label>
            <select
              aria-describedby={errors.houseSystem ? 'house-system-error' : undefined}
              aria-invalid={Boolean(errors.houseSystem)}
              className={cn(inputClassName, 'appearance-auto')}
              disabled={isInteractionDisabled}
              id="house-system"
              name="houseSystem"
              onChange={(event) =>
                updateEditableDraft({ houseSystem: event.target.value as HouseSystem | '' })
              }
              required
              value={draft.houseSystem}
            >
              <option disabled value="">
                Choose a house system
              </option>
              <option value="Placidus">Placidus</option>
              <option value="Whole Sign">Whole Sign</option>
              <option value="Equal">Equal</option>
            </select>
            <FieldError id="house-system-error" message={errors.houseSystem} />
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-[color:var(--nn-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="nn-button nn-button--primary w-full sm:w-auto"
            disabled={isInteractionDisabled}
            type="submit"
          >
            {isCalculationPending
              ? 'Calculating chart…'
              : isResolving
                ? 'Resolving birth time…'
                : 'Calculate Chart'}
          </button>
          {isResolving ? (
            <p className="nn-status nn-status--info" role="status" aria-live="polite">
              Reading the development resolver result…
            </p>
          ) : null}
        </div>
      </form>

      <div className="nn-notice nn-notice--research mt-5 max-w-3xl flex-col">
        <p className="nn-eyebrow nn-status--research">Development resolver</p>
        <p className="nn-type-metadata">{DEVELOPMENT_RESOLVER_NOTICE}</p>
        <p className="nn-type-metadata">
          Fixture states: enter <code>UI FIXTURE: AMBIGUOUS</code> or{' '}
          <code>UI FIXTURE: NONEXISTENT</code> in Birth place.
        </p>
      </div>
    </section>
  );
}
