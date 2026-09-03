import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import type { SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '@/core/chart/chart-ui';
import type { BirthDatePart, BirthDateParts } from './birth-date-input';

const inputClassName = 'nn-field';

interface BirthDateTimeFieldsProps {
  birthDateParts: BirthDateParts;
  dateError?: string;
  isInteractionDisabled: boolean;
  localTime: string | null;
  locale?: SupportedLocale;
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
  locale,
  onBirthDatePartChange,
  onLocalTimeChange,
  onUnknownTimeChange,
  timeError,
  timeInputRef,
  unknownTime
}: BirthDateTimeFieldsProps) {
  const monthFormatter = new Intl.DateTimeFormat(locale ?? 'en', {
    month: 'long',
    timeZone: 'UTC'
  });
  const monthLabel = (month: number) =>
    monthFormatter.format(new Date(Date.UTC(2000, month - 1, 1)));

  return (
    <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <fieldset
        aria-describedby={dateError ? 'birth-date-error' : 'birth-date-help'}
        className="min-w-0 border-0 p-0"
      >
        <legend className="nn-type-label">
          {chartUi(locale, 'birthInput.birthDate')}
        </legend>
        <p className="nn-type-metadata mt-2" id="birth-date-help">
          {chartUi(locale, 'birthInput.birthDateHelp')}
        </p>
        <div className="mt-4 grid min-w-0 grid-cols-[minmax(4.5rem,0.65fr)_minmax(0,1.35fr)] gap-3 sm:grid-cols-[minmax(4.5rem,0.7fr)_minmax(9rem,1.35fr)_minmax(5.5rem,0.8fr)]">
          <div className="min-w-0">
            <label className="nn-type-label" htmlFor="birth-date-day">
              {chartUi(locale, 'birthInput.day')}
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
              {chartUi(locale, 'birthInput.month')}
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
              <option value="">{chartUi(locale, 'birthInput.monthPlaceholder')}</option>
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                return (
                  <option key={month} value={String(month).padStart(2, '0')}>
                    {monthLabel(month)}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <label className="nn-type-label" htmlFor="birth-date-year">
              {chartUi(locale, 'birthInput.year')}
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
        <legend className="nn-type-label">
          {chartUi(locale, 'birthInput.birthTime')}
        </legend>
        <p className="nn-type-metadata mt-2" id="birth-time-help">
          {chartUi(locale, 'birthInput.birthTimeHelp')}
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
            <span className="nn-type-label block">
              {chartUi(locale, 'birthInput.unknownTimeLabel')}
            </span>
            <span className="nn-type-metadata mt-1 block">
              {chartUi(locale, 'birthInput.unknownTimeHelp')}
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
