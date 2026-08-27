import type { SyntheticEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  UpdateVaultChartMetadataApiRequest,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import {
  normalizeDisplayName,
  updateVaultChartMetadata,
  validateDisplayName,
  VAULT_CHART_CATEGORIES,
  DISPLAY_NAME_MAXIMUM_CHARACTERS
} from './vault-management.js';

const SIGN_IN_PATH = '/auth/sign-in';

type MetadataStatus = 'idle' | 'saving' | 'success' | 'error';

interface VaultChartMetadataFormProps {
  readonly chart: VaultChartRecord;
  readonly onChartUpdated: (chart: VaultChartRecord) => void;
}

function categoryLabel(category: VaultChartCategory): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
}

function isSameChartMetadata(
  chart: VaultChartRecord,
  displayName: string,
  category: VaultChartCategory
): boolean {
  return normalizeDisplayName(displayName) === chart.displayName && category === chart.category;
}

export default function VaultChartMetadataForm({
  chart,
  onChartUpdated
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
      setMetadataError(displayNameError);
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
        ? 'This saved chart is no longer available.'
        : result.status === 'invalid-request'
          ? 'Check the chart name and category, then try again.'
          : "We couldn't save these changes. Please try again."
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
        Edit metadata
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <label className="nn-type-label" htmlFor={nameId}>
            Chart name
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
            Category
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
                {categoryLabel(option)}
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
          {metadataBusy ? 'Saving…' : 'Save changes'}
        </button>
        {hasMetadataChanges ? (
          <button
            className="nn-button nn-button--quiet"
            disabled={metadataBusy}
            onClick={handleMetadataCancel}
            type="button"
          >
            Cancel
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
          Metadata updated.
        </p>
      ) : null}
    </form>
  );
}
