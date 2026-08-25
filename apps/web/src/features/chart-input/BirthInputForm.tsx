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

const inputClassName =
  'mt-2 block w-full rounded-lg border border-natal-border bg-slate-950/40 px-3 py-2.5 text-sm text-white shadow-sm outline-none placeholder:text-slate-500 focus-visible:border-natal-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent disabled:cursor-not-allowed disabled:opacity-50';

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
    <p className="mt-2 text-sm text-rose-300" id={id} role="alert">
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
      className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4"
      role="status"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Resolution</p>
      <h3 className="mt-2 text-lg font-semibold text-white" id="birth-time-resolved-title">
        Birth time resolved
      </h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-400">Location</dt>
          <dd className="mt-1 break-words font-medium text-white">{resolution.locationLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Timezone</dt>
          <dd className="mt-1 break-words font-medium text-white">{resolution.ianaTimeZone}</dd>
        </div>
        <div>
          <dt className="text-slate-400">UTC offset</dt>
          <dd className="mt-1 font-medium text-white">{formatUtcOffset(resolution.utcOffsetSeconds)}</dd>
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
      className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4"
      role="alert"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Resolution needed</p>
      <h3 className="mt-2 text-lg font-semibold text-white" id="ambiguous-time-title">
        This local time occurred twice
      </h3>
      <p className="mt-2 text-sm leading-6 text-amber-50/80">
        Choose which occurrence matches the birth record. NatalNode will not silently choose one.
      </p>
      <fieldset className="mt-4 grid gap-3">
        <legend className="text-sm font-medium text-white">Select an occurrence</legend>
        {resolution.candidates.map((candidate) => {
          const isEarlier = candidate.occurrence === 'EARLIER';

          return (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200/20 bg-slate-950/20 p-3 text-sm text-slate-100 focus-within:border-natal-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-natal-accent"
              key={candidate.occurrence}
            >
              <input
                className="mt-1 size-4 accent-natal-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent"
                disabled={isDisabled}
                name="ambiguous-occurrence"
                onChange={() => onSelectCandidate(candidate)}
                required
                type="radio"
                value={candidate.occurrence}
              />
              <span>
                <span className="block font-medium text-white">
                  {isEarlier ? 'Earlier occurrence' : 'Later occurrence'}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
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
      className="mt-5 rounded-xl border border-rose-300/40 bg-rose-300/10 p-4"
      role="alert"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Birth time needs editing</p>
      <h3 className="mt-2 text-lg font-semibold text-white" id="nonexistent-time-title">
        This local time did not exist
      </h3>
      <p className="mt-2 text-sm leading-6 text-rose-50/80">
        The entered local time did not exist at this location and date. It was not shifted or replaced.
      </p>
      <button
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200/40 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent"
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
      className="mt-5 rounded-xl border border-slate-400/30 bg-slate-400/10 p-4"
      role="status"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Resolution</p>
      <h3 className="mt-2 text-lg font-semibold text-white" id="unknown-time-title">
        Exact birth time unknown
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Exact-time-dependent chart features will be unavailable later. Ascendant, Midheaven, and houses will not be treated as exact.
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
      className="mt-10 rounded-2xl border border-natal-border bg-natal-surface/90 p-5 shadow-2xl shadow-black/10 sm:p-7"
      aria-labelledby="birth-input-title"
    >
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">Birth Input</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white" id="birth-input-title">
          Start with the details you know
        </h2>
        <p className="mt-2 text-sm leading-6 text-natal-muted">
          Timezone resolution stays explicit, so an uncertain birth time is never replaced with a guessed value.
        </p>
        <p className="mt-4 rounded-lg border border-dashed border-natal-border px-3 py-2 text-xs leading-5 text-slate-400">
          {DEVELOPMENT_RESOLVER_NOTICE}. Use <code>UI FIXTURE: AMBIGUOUS</code> or{' '}
          <code>UI FIXTURE: NONEXISTENT</code> in Birth place to preview those states.
        </p>
      </div>

      <form className="mt-6 grid gap-5" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-100" htmlFor="birth-date">
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

          <div>
            <label className="text-sm font-medium text-slate-100" htmlFor="birth-time">
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
            <p className="mt-2 text-xs leading-5 text-slate-400" id="birth-time-help">
              Use the local time recorded at the birth place.
            </p>
            <FieldError id="birth-time-error" message={errors.localTime} />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="birth-place">
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
          </div>
        </div>

        <div className="rounded-xl border border-natal-border/80 bg-slate-950/20 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200" htmlFor="unknown-time">
            <input
              checked={unknownTime}
              className="mt-0.5 size-4 accent-natal-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent"
              disabled={isInteractionDisabled}
              id="unknown-time"
              name="unknownTime"
              onChange={(event) => handleUnknownTimeChange(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="font-medium text-white">I don&apos;t know my exact birth time</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">
                The time is kept unknown until a later resolution step.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-100" htmlFor="house-system">
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

        <div className="flex flex-col gap-3 border-t border-natal-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-natal-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-natal-primary/20 hover:bg-natal-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent disabled:cursor-wait disabled:opacity-60"
            disabled={isInteractionDisabled}
            type="submit"
          >
            {isCalculationPending
              ? 'Calculating chart…'
              : isResolving
                ? 'Resolving birth time…'
                : 'Resolve birth input'}
          </button>
          {isResolving ? (
            <p className="text-sm leading-6 text-natal-muted" role="status" aria-live="polite">
              Reading the development resolver result…
            </p>
          ) : null}
        </div>
      </form>

      {resolutionError ? (
        <p className="mt-5 rounded-xl border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100" role="alert">
          {resolutionError}
        </p>
      ) : null}
      <ResolutionPanel
        isInteractionDisabled={isInteractionDisabled}
        onEditBirthTime={() => timeInputRef.current?.focus()}
        onSelectCandidate={handleCandidateSelection}
        resolution={resolution}
      />
    </section>
  );
}
