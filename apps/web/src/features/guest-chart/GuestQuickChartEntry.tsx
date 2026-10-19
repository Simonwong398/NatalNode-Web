import { useState } from 'react';
import { chartUi } from '@/core/chart/chart-ui';
import BirthInputForm from '@/features/chart-input/BirthInputForm';
import { useLocationResolution } from '@/features/chart-input/useLocationResolution';
import { ServerBackedBirthInputResolver } from '@/features/chart-input/server-backed-development-resolver';
import type { SupportedLocale } from '@/lib/localization';

interface GuestQuickChartEntryProps {
  readonly locale: SupportedLocale;
}

export default function GuestQuickChartEntry({ locale }: GuestQuickChartEntryProps) {
  const [verified, setVerified] = useState(false);
  const location = useLocationResolution({ locale });
  const [resolver] = useState(() => new ServerBackedBirthInputResolver());

  return (
    <>
      <p className="nn-notice nn-notice--info mb-6 max-w-4xl" role="note">
        {chartUi(locale, 'quickChart.verificationDisclosure')}
      </p>
      <BirthInputForm
        locale={locale}
        onInputChanged={() => setVerified(false)}
        onResolvedInput={({ resolution }) =>
          setVerified(resolution.ambiguityStatus === 'EXACT')
        }
        resolver={resolver}
        locationDiagnostics={location.diagnostics}
        locationResolution={location.resolution}
        onLocationCandidateSelect={location.selectCandidate}
        onLocationPanelMounted={location.setPanelMounted}
        onLocationQueryChange={location.setRawQuery}
        requireResolvedLocation
        showDevelopmentInformation={false}
        showInputSavePanel={false}
        submitButtonLabel={chartUi(locale, 'quickChart.verifyBirthDetails')}
      />
      {verified ? (
        <p
          className="nn-notice nn-notice--info mt-6 max-w-4xl"
          role="status"
          aria-live="polite"
        >
          {chartUi(locale, 'quickChart.verifiedNoCalculation')}
        </p>
      ) : null}
    </>
  );
}
