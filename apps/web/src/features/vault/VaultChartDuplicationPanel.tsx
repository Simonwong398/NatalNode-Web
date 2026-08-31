import { useEffect, useId, useRef, useState } from 'react';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import type { SupportedLocale } from '../../lib/localization.js';
import { duplicateVaultChart } from './vault-management.js';
import { vaultUi } from './vault-ui.js';

const SIGN_IN_PATH = '/auth/sign-in';

interface VaultChartDuplicationPanelProps {
  readonly chartId: string;
  readonly locale?: SupportedLocale;
}

function redirectToSignIn(): void {
  window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
}

export default function VaultChartDuplicationPanel({
  chartId,
  locale
}: VaultChartDuplicationPanelProps) {
  const [duplicateStatus, setDuplicateStatus] = useState<
    'idle' | 'duplicating' | 'error'
  >('idle');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const duplicationRequestRef = useRef<AbortController | null>(null);
  const duplicationTitleId = useId();

  useEffect(() => {
    setDuplicateStatus('idle');
    setDuplicateError(null);

    return () => {
      duplicationRequestRef.current?.abort();
      duplicationRequestRef.current = null;
    };
  }, [chartId]);

  const handleDuplicateChart = async () => {
    if (duplicateStatus === 'duplicating') {
      return;
    }

    setDuplicateStatus('duplicating');
    setDuplicateError(null);

    const abortController = new AbortController();
    duplicationRequestRef.current = abortController;
    const result = await duplicateVaultChart(chartId, abortController.signal);

    if (abortController.signal.aborted) {
      return;
    }

    if (duplicationRequestRef.current === abortController) {
      duplicationRequestRef.current = null;
    }

    if (result.status === 'success') {
      window.location.replace(
        getLocalizedCurrentPath(
          window.location.pathname,
          `/vault/chart?chartId=${encodeURIComponent(result.chart.chartId)}`
        )
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
        ? vaultUi(locale, 'vault.chartUnavailable')
        : vaultUi(locale, 'vault.duplicateError')
    );
  };

  return (
    <section
      aria-labelledby={duplicationTitleId}
      className="mt-6 border-t border-[color:var(--nn-border-subtle)] pt-5"
    >
      <h3 className="nn-type-section-title" id={duplicationTitleId}>
        {vaultUi(locale, 'vault.duplicateTitle')}
      </h3>
      <p className="nn-type-body-small mt-2">
        {vaultUi(locale, 'vault.duplicateDescription')}
      </p>
      <button
        className="nn-button nn-button--quiet mt-4"
        disabled={duplicateStatus === 'duplicating'}
        onClick={() => void handleDuplicateChart()}
        type="button"
      >
        {duplicateStatus === 'duplicating'
          ? vaultUi(locale, 'vault.duplicating')
          : vaultUi(locale, 'vault.duplicate')}
      </button>
      {duplicateError ? (
        <p className="nn-status nn-status--error mt-3" role="alert">
          {duplicateError}
        </p>
      ) : null}
    </section>
  );
}
