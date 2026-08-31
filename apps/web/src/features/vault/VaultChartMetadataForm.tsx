import type { SyntheticEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import type {
  UpdateVaultChartMetadataApiRequest,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import type { SupportedLocale } from '../../lib/localization.js';
import {
  normalizeDisplayName,
  updateVaultChartMetadata,
  validateDisplayName,
  VAULT_CHART_CATEGORIES,
  DISPLAY_NAME_MAXIMUM_CHARACTERS
} from './vault-management.js';
import { formatVaultUi, vaultCategoryLabel, vaultUi } from './vault-ui.js';

const SIGN_IN_PATH = '/auth/sign-in';

type MetadataStatus = 'idle' | 'saving' | 'success' | 'error';

interface VaultChartMetadataFormProps {
  readonly chart: VaultChartRecord;
  readonly onChartUpdated: (chart: VaultChartRecord) => void;
  readonly locale?: SupportedLocale;
}

function redirectToSignIn(): void {
  window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
}

function isSameChartMetadata(
  chart: VaultChartRecord,
  displayName: string,
  category: VaultChartCategory
): boolean {
  return normalizeDisplayName(displayName) === chart.displayName && category === chart.category;
}

function localizeDisplayNameError(
  message: string,
  locale: SupportedLocale | undefined
): string {
  if (message === 'Enter a chart name.') {
    return vaultUi(locale, 'vault.chartNameRequired');
  }

  if (/^Use [0-9,]+ characters or fewer\.$/u.test(message)) {
    return formatVaultUi(locale, 'vault.chartNameTooLong', {
      count: DISPLAY_NAME_MAXIMUM_CHARACTERS
    });
  }

  return message;
}

export default function VaultChartMetadataForm({
  chart,
  onChartUpdated,
  locale
}: VaultChartMetadataFormProps) {
  const [displayName, setDisplayName] = useState(chart.displayName);
  const [category, setCategory] = useState<VaultChartCategory>(chart.category);
  const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>('idle');
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const metadataStatusRef = useRef<HTMLParagraphElement>(null);
  const metadataTitleId = useId();
  const nameId = useId();
  const nameErrorId = useId();
  const categoryId = useId();

  useEffect(() => {
    setDisplayName(chart.displayName);
    setCategory(chart.category);
    setMetadataStatus('idle');
    setMetadataError(null);
  }, [chart.chartId]);

  useEffect(() => {
    if (metadataStatus === 'success' || metadataStatus === 'error') {
      metadataStatusRef.current?.focus();
    }
  }, [metadataStatus]);

  const hasMetadataChanges = !isSameChartMetadata(chart, displayName, category);
  const metadataBusy = metadataStatus === 'saving';

  const handleMetadataSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const displayNameError = validateDisplayName(displayName);

    if (displayNameError !== null) {
      setMetadataError(localizeDisplayNameError(displayNameError, locale));
      setMetadataStatus('error');
      return;
    }

    if (!hasMetadataChanges || metadataBusy) {
      return;
    }

    const normalizedDisplayName = normalizeDisplayName(displayName);
    const request: UpdateVaultChartMetadataApiRequest = {
      ...(normalizedDisplayName !== chart.displayName
        ? { displayName: normalizedDisplayName }
        : {}),
      ...(category !== chart.category ? { category } : {})
    };

    if (Object.keys(request).length === 0) {
      return;
    }

    setMetadataStatus('saving');
    setMetadataError(null);

    const result = await updateVaultChartMetadata(chart.chartId, request);

    if (result.status === 'success') {
      setDisplayName(result.chart.displayName);
      setCategory(result.chart.category);
      setMetadataStatus('success');
      setMetadataError(null);
      onChartUpdated(result.chart);
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setMetadataStatus('error');
    setMetadataError(
      result.status === 'not-found'
        ? vaultUi(locale, 'vault.chartUnavailable')
        : result.status === 'invalid-request'
          ? vaultUi(locale, 'vault.invalidMetadata')
          : vaultUi(locale, 'vault.saveError')
    );
  };

  const handleMetadataCancel = () => {
    setDisplayName(chart.displayName);
    setCategory(chart.category);
    setMetadataStatus('idle');
    setMetadataError(null);
  };

  return (
    <form
      aria-labelledby={metadataTitleId}
      className="mt-6 border-t border-[color:var(--nn-border-subtle)] pt-5"
      noValidate
      onSubmit={handleMetadataSubmit}
    >
      <h3 className="nn-type-section-title" id={metadataTitleId}>
        {vaultUi(locale, 'vault.editMetadata')}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <label className="nn-type-label" htmlFor={nameId}>
            {vaultUi(locale, 'vault.chartName')}
          </label>
          <input
            aria-describedby={metadataError ? nameErrorId : undefined}
            aria-invalid={Boolean(metadataError)}
            className="nn-field mt-2"
            disabled={metadataBusy}
            id={nameId}
            maxLength={DISPLAY_NAME_MAXIMUM_CHARACTERS}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setMetadataError(null);
              setMetadataStatus('idle');
            }}
            required
            type="text"
            value={displayName}
          />
          {metadataError ? (
            <p
              className="nn-status nn-status--error mt-2"
              id={nameErrorId}
              ref={metadataStatusRef}
              role="alert"
              tabIndex={-1}
            >
              {metadataError}
            </p>
          ) : null}
        </div>

        <div>
          <label className="nn-type-label" htmlFor={categoryId}>
            {vaultUi(locale, 'vault.category')}
          </label>
          <select
            className="nn-field mt-2 appearance-auto"
            disabled={metadataBusy}
            id={categoryId}
            onChange={(event) => {
              const nextCategory = event.target.value;

              if (VAULT_CHART_CATEGORIES.includes(nextCategory as VaultChartCategory)) {
                setCategory(nextCategory as VaultChartCategory);
                setMetadataError(null);
                setMetadataStatus('idle');
              }
            }}
            value={category}
          >
            {VAULT_CHART_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {vaultCategoryLabel(locale, option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="nn-button nn-button--secondary"
          disabled={metadataBusy || !hasMetadataChanges}
          type="submit"
        >
          {metadataBusy
            ? vaultUi(locale, 'vault.saving')
            : vaultUi(locale, 'vault.saveChanges')}
        </button>
        {hasMetadataChanges ? (
          <button
            className="nn-button nn-button--quiet"
            disabled={metadataBusy}
            onClick={handleMetadataCancel}
            type="button"
          >
            {vaultUi(locale, 'vault.cancel')}
          </button>
        ) : null}
      </div>

      {metadataStatus === 'success' ? (
        <p
          className="nn-status nn-status--success mt-3"
          ref={metadataStatusRef}
          role="status"
          tabIndex={-1}
        >
          {vaultUi(locale, 'vault.metadataUpdated')}
        </p>
      ) : null}
    </form>
  );
}
