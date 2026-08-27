import { useId, useState } from 'react';
import { deleteVaultChart } from './vault-management.js';

const SIGN_IN_PATH = '/auth/sign-in';

interface VaultChartDeletionPanelProps {
  readonly chartId: string;
  readonly onDeleted: () => void;
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
}

export default function VaultChartDeletionPanel({
  chartId,
  onDeleted
}: VaultChartDeletionPanelProps) {
  const [chartDeleteStatus, setChartDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [chartDeleteError, setChartDeleteError] = useState<string | null>(null);
  const deleteTitleId = useId();

  const handleDeleteChart = async () => {
    if (
      !window.confirm(
        'Delete this saved chart? The saved chart and all associated notes will be removed.'
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
        ? 'This saved chart is no longer available.'
        : "We couldn't delete this chart. Please try again."
    );
  };

  return (
    <section
      aria-labelledby={deleteTitleId}
      className="nn-notice nn-notice--error mt-6 flex-col items-start"
    >
      <div>
        <h3 className="nn-type-section-title" id={deleteTitleId}>
          Delete saved chart
        </h3>
        <p className="nn-type-body-small mt-2">
          This removes the saved chart and all associated notes from your Vault.
        </p>
      </div>
      <button
        className="nn-button nn-button--secondary"
        disabled={chartDeleteStatus === 'deleting'}
        onClick={() => void handleDeleteChart()}
        type="button"
      >
        {chartDeleteStatus === 'deleting' ? 'Deleting…' : 'Delete chart'}
      </button>
      {chartDeleteError ? (
        <p className="nn-status nn-status--error" role="alert">
          {chartDeleteError}
        </p>
      ) : null}
    </section>
  );
}
