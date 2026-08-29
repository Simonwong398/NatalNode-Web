import { useId, useState } from 'react';
import { duplicateVaultChart } from './vault-management.js';

const SIGN_IN_PATH = '/auth/sign-in';

interface VaultChartDuplicationPanelProps {
  readonly chartId: string;
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
}

export default function VaultChartDuplicationPanel({
  chartId
}: VaultChartDuplicationPanelProps) {
  const [duplicateStatus, setDuplicateStatus] = useState<
    'idle' | 'duplicating' | 'error'
  >('idle');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const duplicationTitleId = useId();

  const handleDuplicateChart = async () => {
    if (duplicateStatus === 'duplicating') {
      return;
    }

    setDuplicateStatus('duplicating');
    setDuplicateError(null);

    const result = await duplicateVaultChart(chartId);

    if (result.status === 'success') {
      window.location.replace(
        `/vault/chart?chartId=${encodeURIComponent(result.chart.chartId)}`
      );
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setDuplicateStatus('error');
    setDuplicateError(
      result.status === 'not-found'
        ? 'This saved chart is no longer available.'
        : "We couldn't duplicate this chart. Please try again."
    );
  };

  return (
    <section
      aria-labelledby={duplicationTitleId}
      className="mt-6 border-t border-[color:var(--nn-border-subtle)] pt-5"
    >
      <h3 className="nn-type-section-title" id={duplicationTitleId}>
        Duplicate saved chart
      </h3>
      <p className="nn-type-body-small mt-2">
        Create a separate saved chart with this chart's input and metadata.
      </p>
      <button
        className="nn-button nn-button--quiet mt-4"
        disabled={duplicateStatus === 'duplicating'}
        onClick={() => void handleDuplicateChart()}
        type="button"
      >
        {duplicateStatus === 'duplicating' ? 'Duplicating…' : 'Duplicate chart'}
      </button>
      {duplicateError ? (
        <p className="nn-status nn-status--error mt-3" role="alert">
          {duplicateError}
        </p>
      ) : null}
    </section>
  );
}
