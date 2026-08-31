import { useRef, useState } from 'react';
import type { SupportedLocale } from '../../lib/localization.js';
import BirthAdvancedSettings from './BirthAdvancedSettings';
import BirthDateTimeFields from './BirthDateTimeFields';
import BirthLocationFields from './BirthLocationFields';
import BirthResolutionFeedback from './BirthResolutionFeedback';
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
import {
  EMPTY_BIRTH_DATE_PARTS,
  composeBirthDate,
  getBirthDateValidationError,
  sanitizeBirthDatePart,
  toBirthDateParts,
  type BirthDatePart,
  type BirthDateParts
} from './birth-date-input';
import { useBirthInputResolution } from './useBirthInputResolution';
import { chartUi } from '../chart-experience/chart-ui.js';

type ValidationField = 'localDate' | 'localTime' | 'locationLabel' | 'houseSystem';

type ValidationErrors = Partial<Record<ValidationField, string>>;

type EditableDraft = Pick<
  BirthInputDraft,
  'localTime' | 'locationLabel' | 'houseSystem'
>;

const defaultResolver: BirthInputResolver = new DevelopmentBirthInputResolver();

export interface BirthInputFormProps {
  isCalculationPending?: boolean;
  locale?: SupportedLocale;
  onResolvedInput: (selection: ResolvedBirthInputSelection) => void;
  resolver?: BirthInputResolver;
}

export interface ResolvedBirthInputSelection {
  resolution: CalculationReadyBirthInputResolution;
  houseSystem: HouseSystem;
}

function validateDraft(
  draft: BirthInputDraft,
  unknownTime: boolean,
  birthDateParts: BirthDateParts,
  locale: SupportedLocale | undefined
): ValidationErrors {
  const nextErrors: ValidationErrors = {};
  const birthDateError = getBirthDateValidationError(birthDateParts);

  if (birthDateError) {
    nextErrors.localDate = birthDateError === 'Enter a birth date.'
      ? chartUi(locale, 'birthInput.error.birthDateRequired')
      : birthDateError === 'Enter a complete birth date.'
        ? chartUi(locale, 'birthInput.error.birthDateIncomplete')
        : chartUi(locale, 'birthInput.error.birthDateInvalid');
  }

  if (!unknownTime && !draft.localTime) {
    nextErrors.localTime = chartUi(locale, 'birthInput.error.birthTimeRequired');
  }

  if (!draft.locationLabel.trim()) {
    nextErrors.locationLabel = chartUi(locale, 'birthInput.error.birthPlaceRequired');
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

function BirthDataTrustSection() {
  return (
    <section
      aria-labelledby="birth-data-trust-title"
      className="nn-calculate-trust mt-8 border-t border-[color:var(--nn-border-subtle)] pt-7"
    >
      <p className="nn-eyebrow">Trust and methodology</p>
      <h2 className="nn-type-card-title mt-1" id="birth-data-trust-title">
        How NatalNode handles your birth data
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        <li className="border-t border-[color:var(--nn-border-subtle)] pt-3">
          <p className="nn-type-body-small">
            Birth date, local time, birth place, timezone context, and a resolved UTC instant remain explicit chart inputs when available.
          </p>
        </li>
        <li className="border-t border-[color:var(--nn-border-subtle)] pt-3">
          <p className="nn-type-body-small">
            NatalNode does not silently substitute noon when the exact birth time is unknown.
          </p>
        </li>
        <li className="border-t border-[color:var(--nn-border-subtle)] pt-3">
          <p className="nn-type-body-small">
            Time-dependent chart facts remain unavailable when the required birth-time information is missing.
          </p>
        </li>
      </ul>
    </section>
  );
}

export default function BirthInputForm({
  isCalculationPending = false,
  locale,
  onResolvedInput,
  resolver = defaultResolver
}: BirthInputFormProps) {
  const [draft, setDraft] = useState<BirthInputDraft>(INITIAL_BIRTH_INPUT_STATE);
  const [birthDateParts, setBirthDateParts] = useState<BirthDateParts>(EMPTY_BIRTH_DATE_PARTS);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const {
    clearResolutionError,
    invalidateResolution,
    isResolving,
    resolution,
    resolutionError,
    resolveDraft,
    selectCandidate
  } = useBirthInputResolution(resolver);
  const unknownTime = draft.ambiguityStatus === 'UNKNOWN_TIME';
  const isInteractionDisabled = isResolving || isCalculationPending;
  const isDevelopmentFixtureResolver = resolver instanceof DevelopmentBirthInputResolver;

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

  const handleBirthDatePartChange = (part: BirthDatePart, value: string) => {
    const nextParts = {
      ...birthDateParts,
      [part]: sanitizeBirthDatePart(value, part === 'year' ? 4 : 2)
    };
    const nextLocalDate = composeBirthDate(nextParts);

    setBirthDateParts(nextParts);
    setDraft((current) => ({
      ...current,
      localDate: nextLocalDate ?? '',
      latitude: null,
      longitude: null,
      ianaTimeZone: null,
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      timezoneDatabaseVersion: null,
      timezoneResolutionMethod: null,
      ambiguityStatus: current.ambiguityStatus === 'UNKNOWN_TIME' ? 'UNKNOWN_TIME' : 'UNRESOLVED'
    }));
    setErrors((current) => {
      if (!current.localDate) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.localDate;
      return nextErrors;
    });
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

    const exactResolution = selectCandidate(candidate);
    if (!exactResolution) {
      return;
    }

    const nextBirthDateParts = toBirthDateParts(exactResolution.localDate);

    if (nextBirthDateParts) {
      setBirthDateParts(nextBirthDateParts);
    }
    setDraft((current) => applyResolutionToDraft(current, exactResolution));
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (isCalculationPending) {
      return;
    }

    const nextErrors = validateDraft(draft, unknownTime, birthDateParts, locale);
    setErrors(nextErrors);
    clearResolutionError();

    if (nextErrors.houseSystem) {
      setIsAdvancedSettingsOpen(true);
    }

    if (Object.keys(nextErrors).length > 0 || !draft.houseSystem) {
      invalidateResolution();
      return;
    }

    const selectedHouseSystem = draft.houseSystem;

    if (resolution?.ambiguityStatus === 'EXACT') {
      onResolvedInput({ resolution, houseSystem: selectedHouseSystem });
      return;
    }

    await resolveDraft(draft, (nextResolution) => {
      const nextBirthDateParts = toBirthDateParts(nextResolution.localDate);

      if (nextBirthDateParts) {
        setBirthDateParts(nextBirthDateParts);
      }
      setDraft((current) => applyResolutionToDraft(current, nextResolution));

      if (
        nextResolution.ambiguityStatus === 'EXACT' ||
        nextResolution.ambiguityStatus === 'UNKNOWN_TIME'
      ) {
        onResolvedInput({ resolution: nextResolution, houseSystem: selectedHouseSystem });
      }
    });
  };

  return (
    <>
      <section
        aria-label={chartUi(locale, 'birthInput.detailsLabel')}
        className="nn-surface nn-surface--elevated nn-calculate-principal-surface mt-8 min-w-0 p-5 sm:p-7"
      >
        <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
          <BirthDateTimeFields
            birthDateParts={birthDateParts}
            dateError={errors.localDate}
            isInteractionDisabled={isInteractionDisabled}
            localTime={draft.localTime}
            locale={locale}
            onBirthDatePartChange={handleBirthDatePartChange}
            onLocalTimeChange={(localTime) => updateEditableDraft({ localTime })}
            onUnknownTimeChange={handleUnknownTimeChange}
            timeError={errors.localTime}
            timeInputRef={timeInputRef}
            unknownTime={unknownTime}
          />

          <section
            aria-label={chartUi(locale, 'birthInput.placeAndSystemFeedbackLabel')}
            className="min-w-0 border-t border-[color:var(--nn-border-subtle)] pt-6"
          >
            <BirthLocationFields
              error={errors.locationLabel}
              isInteractionDisabled={isInteractionDisabled}
              locale={locale}
              locationLabel={draft.locationLabel}
              onLocationLabelChange={(locationLabel) => updateEditableDraft({ locationLabel })}
            />
            <BirthResolutionFeedback
              isDevelopmentFixture={isDevelopmentFixtureResolver}
              isInteractionDisabled={isInteractionDisabled}
              locale={locale}
              onEditBirthTime={() => timeInputRef.current?.focus()}
              onSelectCandidate={handleCandidateSelection}
              placement="blocking"
              resolution={resolution}
              resolutionError={resolutionError}
            />
          </section>

          <BirthAdvancedSettings
            error={errors.houseSystem}
            houseSystem={draft.houseSystem}
            isInteractionDisabled={isInteractionDisabled}
            isOpen={isAdvancedSettingsOpen}
            locale={locale}
            onHouseSystemChange={(houseSystem) => updateEditableDraft({ houseSystem })}
            onOpenChange={setIsAdvancedSettingsOpen}
          />

          <div className="flex flex-col gap-3 border-t border-[color:var(--nn-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="nn-button nn-button--primary w-full sm:w-auto"
              disabled={isInteractionDisabled}
              type="submit"
            >
              {isCalculationPending
                ? chartUi(locale, 'birthInput.calculating')
                : isResolving
                  ? chartUi(locale, 'birthInput.resolving')
                  : chartUi(locale, 'birthInput.calculate')}
            </button>
            {isResolving ? (
              <p className="nn-status nn-status--info" role="status" aria-live="polite">
                Reading the development resolver result…
              </p>
            ) : null}
          </div>

          <BirthResolutionFeedback
            isDevelopmentFixture={isDevelopmentFixtureResolver}
            isInteractionDisabled={isInteractionDisabled}
            locale={locale}
            onEditBirthTime={() => timeInputRef.current?.focus()}
            onSelectCandidate={handleCandidateSelection}
            placement="non-blocking"
            resolution={resolution}
            resolutionError={resolutionError}
          />
        </form>
      </section>

      <BirthDataTrustSection />

      <div className="nn-notice nn-notice--research mt-6 max-w-3xl flex-col">
        <p className="nn-eyebrow nn-status--research">Development information</p>
        <p className="nn-type-metadata">{DEVELOPMENT_RESOLVER_NOTICE}</p>
        <p className="nn-type-metadata">
          Fixture states: enter <code>UI FIXTURE: AMBIGUOUS</code> or{' '}
          <code>UI FIXTURE: NONEXISTENT</code> in Birth place.
        </p>
      </div>
    </>
  );
}
