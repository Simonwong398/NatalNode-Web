import { useEffect, useId, useRef, useState } from 'react';
import type {
  ChartRequest,
  ChartResult,
  VaultChartCategory
} from '@natalnode/contracts';
import {
  isVaultChartCategory,
  saveVaultChart,
  VAULT_CHART_CATEGORIES,
  type SaveVaultChartResult
} from './save-vault-chart';
import {
  createSaveVaultChartRequest,
  resolveVaultSaveIntent
} from './vault-save-intent.js';
import {
  DEFAULT_LOCALE,
  getLocalizedPath,
  type SupportedLocale
} from '@/lib/localization';
import { formatVaultUi, vaultCategoryLabel, vaultUi } from './vault-ui.js';

const DISPLAY_NAME_MAX_LENGTH = 120;

type SaveState =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'invalid-request'
  | 'capacity-reached'
  | 'invalid-state'
  | 'failed';

export interface SaveChartPanelProps {
  /** Current request when already resolved, or null for a prepare-on-save flow. */
  chartRequest: ChartRequest | null;
  chartResult?: ChartResult | null;
  locale?: SupportedLocale;
  /** Lets the owning input flow resolve and return its current request at submit time. */
  onPrepareSave?: () => Promise<ChartRequest | null>;
  /** Presentation-only gate; the server remains authoritative. */
  isSaveEligible?: boolean;
  disabledReason?: string;
}

function chartRequestKey(chartRequest: ChartRequest | null): string | null {
  return chartRequest === null ? null : JSON.stringify(chartRequest);
}

function toSaveState(result: SaveVaultChartResult): SaveState {
  switch (result.status) {
    case 'saved':
      return 'saved';
    case 'invalid-request':
      return 'invalid-request';
    case 'capacity-reached':
      return 'capacity-reached';
    case 'invalid-state':
      return 'invalid-state';
    case 'failed':
      return 'failed';
    case 'redirected':
      return 'idle';
  }
}

export default function SaveChartPanel({
  chartRequest,
  chartResult,
  locale,
  onPrepareSave,
  isSaveEligible = chartRequest !== null,
  disabledReason
}: SaveChartPanelProps) {
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState<VaultChartCategory>('SELF');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const saveInFlightRef = useRef(false);
  const currentChartRequestKeyRef = useRef(chartRequestKey(chartRequest));
  const preparedChartRequestKeyRef = useRef<string | null>(null);
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const displayNameId = `${panelId}-display-name`;
  const displayNameErrorId = `${panelId}-display-name-error`;
  const categoryId = `${panelId}-category`;
  const vaultPath = getLocalizedPath(locale ?? DEFAULT_LOCALE, '/vault');
  const saveIntent = resolveVaultSaveIntent(chartResult);
  const isCurrentInputSave =
    saveIntent === 'INPUT_ONLY' &&
    (chartResult === null || chartResult === undefined);
  const currentChartRequestKey = chartRequestKey(chartRequest);
  currentChartRequestKeyRef.current = currentChartRequestKey;

  useEffect(() => {
    if (preparedChartRequestKeyRef.current === currentChartRequestKey) {
      return;
    }

    preparedChartRequestKeyRef.current = null;
    setNameError(null);
    setSaveState(saveInFlightRef.current ? 'saving' : 'idle');
  }, [currentChartRequestKey]);

  const resetFeedback = () => {
    setNameError(null);
    setSaveState('idle');
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (saveInFlightRef.current) {
      return;
    }

    if (!isSaveEligible) {
      setSaveState('invalid-state');
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

    saveInFlightRef.current = true;
    setNameError(null);
    setSaveState('saving');
    let submittedChartRequestKey = currentChartRequestKey;

    try {
      const submittedChartRequest =
        onPrepareSave === undefined
          ? chartRequest
          : await onPrepareSave();

      if (submittedChartRequest === null) {
        setSaveState('invalid-state');
        return;
      }

      const request = createSaveVaultChartRequest({
        chart: submittedChartRequest,
        chartResult,
        displayName: trimmedDisplayName,
        category,
        tags: [],
        favorite: false
      });
      submittedChartRequestKey = chartRequestKey(submittedChartRequest);
      preparedChartRequestKeyRef.current = submittedChartRequestKey;
      currentChartRequestKeyRef.current = submittedChartRequestKey;
      const result = await saveVaultChart(request);

      if (currentChartRequestKeyRef.current === submittedChartRequestKey) {
        setSaveState(toSaveState(result));
      }
    } finally {
      saveInFlightRef.current = false;

      if (currentChartRequestKeyRef.current !== submittedChartRequestKey) {
        setSaveState('idle');
      }
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated min-w-0 px-5 py-5 sm:px-7"
      data-vault-save-mode={saveIntent}
    >
      <div className="max-w-3xl">
        <p className="nn-eyebrow">
          {vaultUi(locale, 'workspace.chartVault')}
        </p>
        <h3 className="nn-type-section-title mt-2" id={titleId}>
          {vaultUi(
            locale,
            isCurrentInputSave
              ? 'vault.saveInputTitle'
              : 'workspace.saveChartTitle'
          )}
        </h3>
        <p className="nn-type-body-small mt-2">
          {isCurrentInputSave
            ? vaultUi(locale, 'vault.inputOnlySaveDescription')
            : saveIntent === 'INPUT_ONLY'
              ? vaultUi(locale, 'vault.provenanceInputOnly')
              : vaultUi(locale, 'workspace.saveChartDescription')}
        </p>
        {!isSaveEligible && disabledReason ? (
          <p className="nn-status nn-status--info mt-3" role="status">
            {disabledReason}
          </p>
        ) : null}

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
            disabled={saveState === 'saving' || !isSaveEligible}
            type="submit"
          >
            {saveState === 'saving'
              ? vaultUi(locale, 'vault.saving')
              : vaultUi(
                  locale,
                  isCurrentInputSave
                    ? 'vault.saveInputAction'
                    : 'workspace.saveChartAction'
                )}
          </button>
        </form>

        <div className="mt-3 min-h-6">
          {saveState === 'saved' ? (
            <p className="nn-status nn-status--success" role="status">
              {vaultUi(
                locale,
                saveIntent === 'INPUT_ONLY'
                  ? 'vault.inputSaved'
                  : 'workspace.chartSaved'
              )}{' '}
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
          {saveState === 'capacity-reached' ? (
            <p className="nn-status nn-status--error" role="alert">
              {vaultUi(locale, 'vault.capacityReachedShort')}
            </p>
          ) : null}
          {saveState === 'invalid-state' ? (
            <p className="nn-status nn-status--error" role="alert">
              {vaultUi(locale, 'vault.inputUnavailable')}
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
