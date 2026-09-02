import { useEffect, useId, useRef, useState } from 'react';
import type {
  ChartRequest,
  SaveVaultChartApiRequest,
  VaultChartCategory
} from '@natalnode/contracts';
import {
  isVaultChartCategory,
  saveVaultChart,
  VAULT_CHART_CATEGORIES,
  type SaveVaultChartResult
} from './save-vault-chart';
import {
  DEFAULT_LOCALE,
  getLocalizedPath,
  type SupportedLocale
} from '@/lib/localization';
import { formatVaultUi, vaultCategoryLabel, vaultUi } from './vault-ui.js';

const DISPLAY_NAME_MAX_LENGTH = 120;

type SaveState = 'idle' | 'saving' | 'saved' | 'invalid-request' | 'failed';

export interface SaveChartPanelProps {
  chartRequest: ChartRequest;
  locale?: SupportedLocale;
}

function toSaveState(result: SaveVaultChartResult): SaveState {
  switch (result.status) {
    case 'saved':
      return 'saved';
    case 'invalid-request':
      return 'invalid-request';
    case 'failed':
      return 'failed';
    case 'redirected':
      return 'idle';
  }
}

export default function SaveChartPanel({ chartRequest, locale }: SaveChartPanelProps) {
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState<VaultChartCategory>('SELF');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const saveInFlightRef = useRef(false);
  const currentChartRequestRef = useRef(chartRequest);
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const displayNameId = `${panelId}-display-name`;
  const displayNameErrorId = `${panelId}-display-name-error`;
  const categoryId = `${panelId}-category`;
  const vaultPath = getLocalizedPath(locale ?? DEFAULT_LOCALE, '/vault');
  currentChartRequestRef.current = chartRequest;

  useEffect(() => {
    setNameError(null);
    setSaveState(saveInFlightRef.current ? 'saving' : 'idle');
  }, [chartRequest]);

  const resetFeedback = () => {
    setNameError(null);
    setSaveState('idle');
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (saveInFlightRef.current) {
      return;
    }

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      setNameError(vaultUi(locale, 'vault.chartNameRequired'));
      setSaveState('idle');
      return;
    }

    if (trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH) {
      setNameError(
        formatVaultUi(locale, 'vault.chartNameTooLong', {
          count: DISPLAY_NAME_MAX_LENGTH
        })
      );
      setSaveState('idle');
      return;
    }

    const submittedChartRequest = chartRequest;
    const request: SaveVaultChartApiRequest = {
      chart: submittedChartRequest,
      displayName: trimmedDisplayName,
      category,
      tags: [],
      favorite: false
    };

    saveInFlightRef.current = true;
    setNameError(null);
    setSaveState('saving');

    try {
      const result = await saveVaultChart(request);

      if (currentChartRequestRef.current === submittedChartRequest) {
        setSaveState(toSaveState(result));
      }
    } finally {
      saveInFlightRef.current = false;

      if (currentChartRequestRef.current !== submittedChartRequest) {
        setSaveState('idle');
      }
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated min-w-0 px-5 py-5 sm:px-7"
    >
      <div className="max-w-3xl">
        <p className="nn-eyebrow">
          {vaultUi(locale, 'workspace.chartVault')}
        </p>
        <h3 className="nn-type-section-title mt-2" id={titleId}>
          {vaultUi(locale, 'workspace.saveChartTitle')}
        </h3>
        <p className="nn-type-body-small mt-2">
          {vaultUi(locale, 'workspace.saveChartDescription')}
        </p>

        <form
          className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
          noValidate
          onSubmit={handleSubmit}
        >
          <div>
            <label className="nn-type-label" htmlFor={displayNameId}>
              {vaultUi(locale, 'vault.chartName')}
            </label>
            <input
              aria-describedby={nameError ? displayNameErrorId : undefined}
              aria-invalid={Boolean(nameError)}
              className="nn-field mt-2"
              disabled={saveState === 'saving'}
              id={displayNameId}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              name="displayName"
              onChange={(event) => {
                setDisplayName(event.target.value);
                resetFeedback();
              }}
              required
              type="text"
              value={displayName}
            />
            {nameError ? (
              <p className="nn-status nn-status--error mt-2" id={displayNameErrorId} role="alert">
                {nameError}
              </p>
            ) : null}
          </div>

          <div>
            <label className="nn-type-label" htmlFor={categoryId}>
              {vaultUi(locale, 'vault.category')}
            </label>
            <select
              className="nn-field mt-2 appearance-auto"
              disabled={saveState === 'saving'}
              id={categoryId}
              name="category"
              onChange={(event) => {
                if (isVaultChartCategory(event.target.value)) {
                  setCategory(event.target.value);
                  resetFeedback();
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

          <button
            className="nn-button nn-button--primary"
            disabled={saveState === 'saving'}
            type="submit"
          >
            {saveState === 'saving'
              ? vaultUi(locale, 'vault.saving')
              : vaultUi(locale, 'workspace.saveChartAction')}
          </button>
        </form>

        <div className="mt-3 min-h-6">
          {saveState === 'saved' ? (
            <p className="nn-status nn-status--success" role="status">
              {vaultUi(locale, 'workspace.chartSaved')}{' '}
              <a className="font-medium underline underline-offset-4 hover:text-white" href={vaultPath}>
                {vaultUi(locale, 'workspace.viewVault')}
              </a>
            </p>
          ) : null}
          {saveState === 'invalid-request' ? (
            <p className="nn-status nn-status--error" role="alert">
              {vaultUi(locale, 'vault.invalidMetadata')}
            </p>
          ) : null}
          {saveState === 'failed' ? (
            <p className="nn-status nn-status--error" role="alert">
              {vaultUi(locale, 'workspace.saveChartError')}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
