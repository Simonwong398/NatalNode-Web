import { useEffect, useId, useRef, useState } from 'react';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import type { SupportedLocale } from '../../lib/localization.js';
import { deleteVaultChart } from './vault-management.js';
import { formatVaultUi, vaultUi } from './vault-ui.js';

const SIGN_IN_PATH = '/auth/sign-in';

interface VaultChartDeletionPanelProps {
  readonly chartId: string;
  readonly chartName: string;
  readonly onDeleted: () => void;
  readonly locale?: SupportedLocale;
}

function redirectToSignIn(): void {
  window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
}

export default function VaultChartDeletionPanel({
  chartId,
  chartName,
  onDeleted,
  locale
}: VaultChartDeletionPanelProps) {
  const [chartDeleteStatus, setChartDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [chartDeleteError, setChartDeleteError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const deleteTitleId = useId();
  const confirmationTitleId = useId();
  const confirmationDescriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirming) {
      cancelButtonRef.current?.focus();
    }
  }, [isConfirming]);

  const handleDeleteChart = async () => {
    if (chartDeleteStatus === 'deleting') {
      return;
    }

    setIsConfirming(false);
    setChartDeleteStatus('deleting');
    setChartDeleteError(null);

    const result = await deleteVaultChart(chartId);

    if (result.status === 'success') {
      onDeleted();
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setChartDeleteStatus('error');
    setIsConfirming(false);
    setChartDeleteError(
      result.status === 'not-found'
        ? vaultUi(locale, 'vault.chartUnavailable')
        : vaultUi(locale, 'vault.deleteError')
    );
  };

  return (
    <section
      aria-labelledby={deleteTitleId}
      className="nn-notice nn-notice--error mt-6 flex-col items-start"
    >
      <div>
        <h3 className="nn-type-section-title" id={deleteTitleId}>
          {vaultUi(locale, 'vault.deleteTitle')}
        </h3>
        <p className="nn-type-body-small mt-2">
          {vaultUi(locale, 'vault.deleteDescription')}
        </p>
      </div>
      <button
        className="nn-button nn-button--secondary"
        disabled={chartDeleteStatus === 'deleting' || isConfirming}
        onClick={() => {
          setChartDeleteError(null);
          setIsConfirming(true);
        }}
        type="button"
      >
        {chartDeleteStatus === 'deleting'
          ? vaultUi(locale, 'vault.deleting')
          : vaultUi(locale, 'vault.deleteChart')}
      </button>
      {isConfirming ? (
        <div
          aria-describedby={confirmationDescriptionId}
          aria-labelledby={confirmationTitleId}
          aria-modal="true"
          className="nn-surface nn-surface--elevated mt-4 w-full p-4"
          role="alertdialog"
        >
          <h4 className="nn-type-card-title" id={confirmationTitleId}>
            {vaultUi(locale, 'vault.deleteConfirmTitle')}
          </h4>
          <p className="nn-type-body-small mt-2" id={confirmationDescriptionId}>
            {formatVaultUi(locale, 'vault.deleteConfirmNamed', { name: chartName })}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="nn-button nn-button--quiet"
              disabled={chartDeleteStatus === 'deleting'}
              onClick={() => setIsConfirming(false)}
              ref={cancelButtonRef}
              type="button"
            >
              {vaultUi(locale, 'vault.cancel')}
            </button>
            <button
              className="nn-button nn-button--secondary"
              disabled={chartDeleteStatus === 'deleting'}
              onClick={() => void handleDeleteChart()}
              type="button"
            >
              {chartDeleteStatus === 'deleting'
                ? vaultUi(locale, 'vault.deleting')
                : vaultUi(locale, 'vault.deleteChart')}
            </button>
          </div>
        </div>
      ) : null}
      {chartDeleteError ? (
        <p className="nn-status nn-status--error" role="alert">
          {chartDeleteError}
        </p>
      ) : null}
    </section>
  );
}
