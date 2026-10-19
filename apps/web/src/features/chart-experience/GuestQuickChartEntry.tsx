import { useState } from 'react';
import { chartUi } from '@/core/chart/chart-ui';
import { BirthInputForm } from '@/features/chart-input';
import { BirthInputResolverError, type BirthInputResolver } from '@/features/chart-input/resolver';
import type { SupportedLocale } from '@/lib/localization';

interface GuestQuickChartEntryProps {
  readonly locale: SupportedLocale;
}

const unavailablePublicResolver: BirthInputResolver = {
  async resolve() {
    throw new BirthInputResolverError(
      'PUBLIC_TIME_AUTHORITY_UNAVAILABLE',
      'Public location and birth-time verification is unavailable.'
    );
  }
};

export default function GuestQuickChartEntry({ locale }: GuestQuickChartEntryProps) {
  const [inputValidated, setInputValidated] = useState(false);

  return (
    <>
      <p className="nn-notice nn-notice--info mb-6 max-w-4xl" role="note">
        {chartUi(locale, 'quickChart.unavailable')}
      </p>
      <BirthInputForm
        locale={locale}
        onInputChanged={() => setInputValidated(false)}
        onInputValidated={() => setInputValidated(true)}
        onResolvedInput={() => setInputValidated(false)}
        resolver={unavailablePublicResolver}
        showDevelopmentInformation={false}
        showInputSavePanel={false}
        submitButtonLabel={chartUi(locale, 'quickChart.checkInputs')}
      />
      {inputValidated ? (
        <p
          className="nn-notice nn-notice--info mt-6 max-w-4xl"
          role="status"
          aria-live="polite"
        >
          {chartUi(locale, 'quickChart.inputValidated')}
        </p>
      ) : null}
    </>
  );
}
