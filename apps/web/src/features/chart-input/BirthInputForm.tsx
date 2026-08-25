import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  INITIAL_BIRTH_INPUT_STATE,
  type BirthInputDraft,
  type HouseSystem
} from './types';

type ValidationField = 'localDate' | 'localTime' | 'locationLabel' | 'houseSystem';

type ValidationErrors = Partial<Record<ValidationField, string>>;

type EditableDraft = Pick<
  BirthInputDraft,
  'localDate' | 'localTime' | 'locationLabel' | 'houseSystem'
>;

const inputClassName =
  'mt-2 block w-full rounded-lg border border-natal-border bg-slate-950/40 px-3 py-2.5 text-sm text-white shadow-sm outline-none placeholder:text-slate-500 focus-visible:border-natal-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent disabled:cursor-not-allowed disabled:opacity-50';

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

export default function BirthInputForm() {
  const [draft, setDraft] = useState<BirthInputDraft>(INITIAL_BIRTH_INPUT_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const unknownTime = draft.ambiguityStatus === 'UNKNOWN_TIME';

  const updateEditableDraft = (patch: Partial<EditableDraft>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
      ambiguityStatus: current.ambiguityStatus === 'UNKNOWN_TIME' ? 'UNKNOWN_TIME' : 'UNRESOLVED'
    }));
    setSubmitStatus(null);
  };

  const handleUnknownTimeChange = (checked: boolean) => {
    setDraft((current) => ({
      ...current,
      localTime: checked ? null : '',
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
    setSubmitStatus(null);
  };

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const nextErrors = validateDraft(draft, unknownTime);
    setErrors(nextErrors);
    setSubmitStatus(
      Object.keys(nextErrors).length === 0
        ? 'Birth input captured. Timezone resolution pending.'
        : null
    );
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
              disabled={unknownTime}
              id="birth-time"
              name="localTime"
              onChange={(event) => updateEditableDraft({ localTime: event.target.value })}
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
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-natal-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-natal-primary/20 hover:bg-natal-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent"
            type="submit"
          >
            Capture birth input
          </button>
          {submitStatus ? (
            <p className="text-sm leading-6 text-natal-muted" role="status" aria-live="polite">
              {submitStatus}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
