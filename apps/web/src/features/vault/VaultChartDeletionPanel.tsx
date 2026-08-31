import { useId, useState } from 'react';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import type { SupportedLocale } from '../../lib/localization.js';
import { deleteVaultChart } from './vault-management.js';
import { vaultUi } from './vault-ui.js';

const SIGN_IN_PATH = '/auth/sign-in';

interface VaultChartDeletionPanelProps {
  readonly chartId: string;
  readonly onDeleted: () => void;
  readonly locale?: SupportedLocale;
}

function redirectToSignIn(): void {
  window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
}

export default function VaultChartDeletionPanel({
  chartId,
  onDeleted,
  locale
}: VaultChartDeletionPanelProps) {
  const [chartDeleteStatus, setChartDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [chartDeleteError, setChartDeleteError] = useState<string | null>(null);
  const deleteTitleId = useId();

  const handleDeleteChart = async () => {
    if (
      !window.confirm(
        vaultUi(locale, 'vault.deleteConfirm')
      )
    ) {
      return;
    }

    if (chartDeleteStatus === 'deleting') {
      return;
    }

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
        disabled={chartDeleteStatus === 'deleting'}
        onClick={() => void handleDeleteChart()}
        type="button"
      >
        {chartDeleteStatus === 'deleting'
          ? vaultUi(locale, 'vault.deleting')
          : vaultUi(locale, 'vault.deleteChart')}
      </button>
      {chartDeleteError ? (
        <p className="nn-status nn-status--error" role="alert">
          {chartDeleteError}
        </p>
      ) : null}
    </section>
  );
}
