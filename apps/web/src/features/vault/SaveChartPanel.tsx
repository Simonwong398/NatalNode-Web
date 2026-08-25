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

const DISPLAY_NAME_MAX_LENGTH = 120;
const SAVE_FAILURE_MESSAGE = "We couldn't save this chart. Please try again.";
const INVALID_METADATA_MESSAGE = 'Check the chart name and category, then try again.';

type SaveState = 'idle' | 'saving' | 'saved' | 'invalid-request' | 'failed';

export interface SaveChartPanelProps {
  chartRequest: ChartRequest;
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

export default function SaveChartPanel({ chartRequest }: SaveChartPanelProps) {
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
      setNameError('Enter a chart name.');
      setSaveState('idle');
      return;
    }

    if (trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH) {
      setNameError(`Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`);
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
      className="border-t border-natal-border/70 bg-slate-950/15 px-5 py-5 sm:px-7"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">
          Chart Vault
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white" id={titleId}>
          Save this chart
        </h3>
        <p className="mt-2 text-sm leading-6 text-natal-muted">
          Add a name and category. The server will verify and recalculate this chart before
          saving it.
        </p>

        <form
          className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
          noValidate
          onSubmit={handleSubmit}
        >
          <div>
            <label className="text-sm font-medium text-slate-100" htmlFor={displayNameId}>
              Chart name
            </label>
            <input
              aria-describedby={nameError ? displayNameErrorId : undefined}
              aria-invalid={Boolean(nameError)}
              className="mt-2 block w-full rounded-lg border border-natal-border bg-slate-950/40 px-3 py-2.5 text-sm text-white shadow-sm outline-none placeholder:text-slate-500 focus-visible:border-natal-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent disabled:cursor-wait disabled:opacity-60"
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
              <p className="mt-2 text-sm text-rose-300" id={displayNameErrorId} role="alert">
                {nameError}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-100" htmlFor={categoryId}>
              Category
            </label>
            <select
              className="mt-2 block w-full appearance-auto rounded-lg border border-natal-border bg-slate-950/40 px-3 py-2.5 text-sm text-white shadow-sm outline-none focus-visible:border-natal-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent disabled:cursor-wait disabled:opacity-60"
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
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-natal-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-natal-primary/20 hover:bg-natal-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent disabled:cursor-wait disabled:opacity-60"
            disabled={saveState === 'saving'}
            type="submit"
          >
            {saveState === 'saving' ? 'Saving…' : 'Save to Vault'}
          </button>
        </form>

        <div className="mt-3 min-h-6">
          {saveState === 'saved' ? (
            <p className="text-sm text-emerald-200" role="status">
              Saved to Vault.{' '}
              <a className="font-medium underline underline-offset-4 hover:text-white" href="/vault">
                View Vault
              </a>
            </p>
          ) : null}
          {saveState === 'invalid-request' ? (
            <p className="text-sm text-rose-300" role="alert">
              {INVALID_METADATA_MESSAGE}
            </p>
          ) : null}
          {saveState === 'failed' ? (
            <p className="text-sm text-rose-300" role="alert">
              {SAVE_FAILURE_MESSAGE}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
