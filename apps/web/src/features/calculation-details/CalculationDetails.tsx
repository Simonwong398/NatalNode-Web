import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '../../lib/localization.js';
import { resolveAstrologyDomainTerm } from '@/core/astrology-taxonomy/astrology-glossary';
import {
  chartUi,
  chartCalculationStatus,
  chartWarningMessage,
  chartWarningSeverity
} from '@/core/chart/chart-ui';
import type { ChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';

export type CalculationDetailsProps = {
  chart: ChartResult;
  locale?: SupportedLocale;
  presentationPolicy: ChartPresentationPolicy;
  requestedHouseSystem: string;
};

type DetailRowProps = {
  label: string;
  value: string;
  identifier?: boolean;
};

function DetailRow({ label, value, identifier = false }: DetailRowProps) {
  return (
    <div className="grid min-w-0 gap-1 md:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.2fr)] md:items-baseline md:gap-4">
      <dt className="nn-type-metadata">{label}</dt>
      <dd
        className={`nn-type-numeric min-w-0 text-left sm:text-right ${
          identifier
            ? 'nn-calculation-details__identifier font-mono text-xs leading-5'
            : 'break-words'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function CalculationDetails({
  chart,
  locale,
  presentationPolicy,
  requestedHouseSystem
}: CalculationDetailsProps) {
  const detailsId = useId();
  const titleId = `${detailsId}-title`;
  const researchTitleId = `${detailsId}-research-title`;
  const warningsTitleId = `${detailsId}-warnings-title`;
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';
  const isUiFixture = chart.engineVersion === 'UI_FIXTURE_V1';
  const unavailable = chartUi(locale, 'calculation.unavailable');
  const astronomyConfiguration = chart.metadata.astronomyConfigurationId ?? unavailable;
  const provenanceEnvelope = chart.metadata.provenanceEnvelopeId ?? unavailable;
  const houseSystemValue = presentationPolicy.showHouses
    ? chart.houses?.system
    : requestedHouseSystem;
  const houseSystem = resolveAstrologyDomainTerm(
    'house_system',
    houseSystemValue,
    locale ?? DEFAULT_LOCALE
  )?.displayTerm ?? houseSystemValue ?? unavailable;
  const houseSystemLabel = presentationPolicy.showHouses
    ? chartUi(locale, 'calculation.houseSystem')
    : chartUi(locale, 'calculation.requestedHouseSystem');
  const researchReason = chart.calculationStatus === 'INCOMPLETE_RESEARCH'
    ? chart.metadata.reason
    : null;

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated overflow-hidden"
    >
      <h3 className="nn-type-section-title px-5 pt-5 sm:px-7" id={titleId}>
        {chartUi(locale, 'workspace.calculationDetails')}
      </h3>

      <div className="nn-calculation-details__grid mt-5 grid min-w-0 gap-5 border-t border-natal-border/50 px-5 pb-6 pt-5 sm:px-7 lg:grid-cols-2">
        <dl className="grid min-w-0 gap-3 text-sm">
          {isUiFixture ? (
            <>
              <DetailRow
                label={chartUi(locale, 'calculation.developmentSource')}
                value={chartUi(locale, 'calculation.uiFixture')}
              />
              <DetailRow
                identifier
                label={chartUi(locale, 'calculation.fixtureId')}
                value={chart.engineVersion}
              />
            </>
          ) : (
            <DetailRow
              label={chartUi(locale, 'calculation.engineVersion')}
              value={chart.engineVersion}
            />
          )}
          <DetailRow
            label={chartUi(locale, 'calculation.chartSchema')}
            value={chart.schemaVersion}
          />
          <DetailRow
            label={chartUi(locale, 'calculation.calculationStatus')}
            value={chartCalculationStatus(locale, chart.calculationStatus)}
          />
          <DetailRow
            label={chartUi(locale, 'calculation.configurationStatus')}
            value={chartCalculationStatus(locale, chart.metadata.configurationStatus)}
          />
          <DetailRow
            label={chartUi(locale, 'calculation.astronomyConfiguration')}
            value={astronomyConfiguration}
            identifier={chart.metadata.astronomyConfigurationId !== null}
          />
          <DetailRow
            label={chartUi(locale, 'calculation.provenanceEnvelope')}
            value={provenanceEnvelope}
            identifier={chart.metadata.provenanceEnvelopeId !== null}
          />
          <DetailRow label={houseSystemLabel} value={houseSystem} />
        </dl>

        {isResearchConfiguration ? (
          <section
            aria-labelledby={researchTitleId}
            className="nn-calculation-details__research nn-notice nn-notice--research min-w-0 flex-col"
            data-calculation-research="true"
          >
            <h4 className="nn-type-label" id={researchTitleId}>
              {chartUi(locale, 'workspace.researchConfiguration')}
            </h4>
            <dl className="mt-3 grid min-w-0 gap-2">
              <DetailRow
                label={chartUi(locale, 'calculation.calculationStatus')}
                value={chartCalculationStatus(locale, chart.calculationStatus)}
              />
              <DetailRow
                label={chartUi(locale, 'calculation.astronomyConfiguration')}
                value={unavailable}
              />
              <DetailRow
                label={chartUi(locale, 'calculation.reason')}
                value={researchReason
                  ? chartCalculationStatus(locale, researchReason)
                  : unavailable}
              />
            </dl>
            <p className="mt-3">
              {chartUi(locale, 'calculation.scientificUnavailable')}
            </p>
          </section>
        ) : null}

        <section
          aria-labelledby={warningsTitleId}
          className="nn-calculation-details__warnings min-w-0 lg:col-span-2"
        >
          <h4 className="nn-type-label" id={warningsTitleId}>
            {chartUi(locale, 'workspace.warnings')}
          </h4>
          {chart.warnings.length === 0 ? (
            <p className="nn-type-body-small mt-2">{chartUi(locale, 'workspace.none')}</p>
          ) : (
            <ul className="mt-3 grid min-w-0 gap-3">
              {chart.warnings.map((warning, index) => (
                <li
                  className="nn-surface min-w-0 p-3"
                  key={`${warning.code}-${index}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="nn-calculation-details__identifier nn-type-metadata font-mono font-semibold">
                      {warning.code}
                    </span>
                    <span className="nn-type-metadata font-semibold uppercase tracking-[0.12em]">
                      {chartWarningSeverity(locale, warning.severity)}
                    </span>
                  </div>
                  <p className="nn-type-body-small mt-2 break-words">{chartWarningMessage(locale, warning)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
