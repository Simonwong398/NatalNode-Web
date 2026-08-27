import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import type { BirthDatePart, BirthDateParts } from './birth-date-input';

const inputClassName = 'nn-field';

interface BirthDateTimeFieldsProps {
  birthDateParts: BirthDateParts;
  dateError?: string;
  isInteractionDisabled: boolean;
  localTime: string | null;
  onBirthDatePartChange: (part: BirthDatePart, value: string) => void;
  onLocalTimeChange: (value: string) => void;
  onUnknownTimeChange: (checked: boolean) => void;
  timeError?: string;
  timeInputRef: RefObject<HTMLInputElement | null>;
  unknownTime: boolean;
}

export default function BirthDateTimeFields({
  birthDateParts,
  dateError,
  isInteractionDisabled,
  localTime,
  onBirthDatePartChange,
  onLocalTimeChange,
  onUnknownTimeChange,
  timeError,
  timeInputRef,
  unknownTime
}: BirthDateTimeFieldsProps) {
  return (
    <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <fieldset
        aria-describedby={dateError ? 'birth-date-error' : 'birth-date-help'}
        className="min-w-0 border-0 p-0"
      >
        <legend className="nn-type-label">Birth date</legend>
        <p className="nn-type-metadata mt-2" id="birth-date-help">
          Use the date recorded at the birth place.
        </p>
        <div className="mt-4 grid min-w-0 grid-cols-[minmax(4.5rem,0.65fr)_minmax(0,1.35fr)] gap-3 sm:grid-cols-[minmax(4.5rem,0.7fr)_minmax(9rem,1.35fr)_minmax(5.5rem,0.8fr)]">
          <div className="min-w-0">
            <label className="nn-type-label" htmlFor="birth-date-day">
              Day
            </label>
            <input
              aria-describedby={dateError ? 'birth-date-error' : 'birth-date-help'}
              aria-invalid={Boolean(dateError)}
              autoComplete="bday-day"
              className={inputClassName}
              disabled={isInteractionDisabled}
              id="birth-date-day"
              inputMode="numeric"
              maxLength={2}
              onChange={(event) => onBirthDatePartChange('day', event.target.value)}
              placeholder="DD"
              required
              type="text"
              value={birthDateParts.day}
            />
          </div>
          <div className="min-w-0">
            <label className="nn-type-label" htmlFor="birth-date-month">
              Month
            </label>
            <select
              aria-describedby={dateError ? 'birth-date-error' : 'birth-date-help'}
              aria-invalid={Boolean(dateError)}
              autoComplete="bday-month"
              className={cn(inputClassName, 'appearance-auto')}
              disabled={isInteractionDisabled}
              id="birth-date-month"
              onChange={(event) => onBirthDatePartChange('month', event.target.value)}
              required
              value={birthDateParts.month}
            >
              <option value="">Month</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <label className="nn-type-label" htmlFor="birth-date-year">
              Year
            </label>
            <input
              aria-describedby={dateError ? 'birth-date-error' : 'birth-date-help'}
              aria-invalid={Boolean(dateError)}
              autoComplete="bday-year"
              className={inputClassName}
              disabled={isInteractionDisabled}
              id="birth-date-year"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => onBirthDatePartChange('year', event.target.value)}
              placeholder="YYYY"
              required
              type="text"
              value={birthDateParts.year}
            />
          </div>
        </div>
        {dateError ? (
          <p className="nn-status nn-status--error mt-2" id="birth-date-error" role="alert">
            {dateError}
          </p>
        ) : null}
      </fieldset>

      <fieldset
        aria-describedby={timeError ? 'birth-time-error' : 'birth-time-help'}
        className="min-w-0 border-0 p-0"
      >
        <legend className="nn-type-label">Birth time</legend>
        <p className="nn-type-metadata mt-2" id="birth-time-help">
          Use the local time recorded at the birth place.
        </p>
        <input
          aria-describedby={timeError ? 'birth-time-error' : 'birth-time-help'}
          aria-invalid={Boolean(timeError)}
          className="nn-field mt-4"
          disabled={unknownTime || isInteractionDisabled}
          id="birth-time"
          name="localTime"
          onChange={(event) => onLocalTimeChange(event.target.value)}
          ref={timeInputRef}
          required={!unknownTime}
          step="60"
          type="time"
          value={localTime ?? ''}
        />
        <label
          className="nn-surface mt-4 flex min-h-11 min-w-0 cursor-pointer items-start gap-3 p-3 focus-within:border-[color:var(--nn-accent-supporting)]"
          htmlFor="unknown-time"
        >
          <input
            checked={unknownTime}
            className="nn-checkbox mt-0.5 shrink-0"
            disabled={isInteractionDisabled}
            id="unknown-time"
            name="unknownTime"
            onChange={(event) => onUnknownTimeChange(event.target.checked)}
            type="checkbox"
          />
          <span className="min-w-0">
            <span className="nn-type-label block">I don&apos;t know my exact birth time</span>
            <span className="nn-type-metadata mt-1 block">
              Keep time unknown; this is a trust limitation, not an input error.
            </span>
          </span>
        </label>
        {timeError ? (
          <p className="nn-status nn-status--error mt-2" id="birth-time-error" role="alert">
            {timeError}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}
