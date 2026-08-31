import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '../../lib/localization.js';
import { resolveAstrologyDomainTerm } from '../../lib/astrology-glossary.js';
import { chartUi } from '../chart-experience/chart-ui.js';
import type { ChartPresentationPolicy } from '@/features/chart-workspace/chart-presentation-policy';

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
    <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.2fr)] sm:items-baseline sm:gap-4">
      <dt className="nn-type-metadata">{label}</dt>
      <dd
        className={`nn-type-numeric min-w-0 text-left sm:text-right ${
          identifier ? 'break-all font-mono text-xs leading-5' : 'break-words'
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
  const astronomyConfiguration = chart.metadata.astronomyConfigurationId ?? 'Unavailable';
  const provenanceEnvelope = chart.metadata.provenanceEnvelopeId ?? 'Unavailable';
  const houseSystem = presentationPolicy.showHouses
    ? resolveAstrologyDomainTerm(
      'house_system',
      chart.houses?.system,
      locale ?? DEFAULT_LOCALE
    )?.displayTerm ?? chart.houses?.system ?? 'Unavailable'
    : requestedHouseSystem;
  const houseSystemLabel = presentationPolicy.showHouses
    ? 'House System'
    : 'Requested House System';

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated overflow-hidden"
    >
      <h3 className="nn-type-section-title px-5 pt-5 sm:px-7" id={titleId}>
        {chartUi(locale, 'workspace.calculationDetails')}
      </h3>

      <div className="mt-5 grid min-w-0 gap-5 border-t border-natal-border/50 px-5 pb-6 pt-5 sm:px-7 sm:grid-cols-2">
        <dl className="grid min-w-0 gap-3 text-sm">
          <DetailRow label="Engine Version" value={chart.engineVersion} />
          <DetailRow label="Chart Schema" value={chart.schemaVersion} />
          <DetailRow
            label="Calculation Status"
            value={isResearchConfiguration ? 'Research configuration' : chart.calculationStatus}
          />
          <DetailRow label="Configuration Status" value={chart.metadata.configurationStatus} />
          <DetailRow
            label="Astronomy Configuration"
            value={astronomyConfiguration}
            identifier={astronomyConfiguration !== 'Unavailable'}
          />
          <DetailRow
            label="Provenance Envelope"
            value={provenanceEnvelope}
            identifier={provenanceEnvelope !== 'Unavailable'}
          />
          <DetailRow label={houseSystemLabel} value={houseSystem} />
        </dl>

        {isResearchConfiguration ? (
          <section
            aria-labelledby={researchTitleId}
            className="nn-notice nn-notice--research min-w-0 flex-col"
          >
            <h4 className="nn-type-label" id={researchTitleId}>
              Research configuration
            </h4>
            <dl className="mt-3 grid min-w-0 gap-2">
              <DetailRow label="Calculation Status" value="Research configuration" />
              <DetailRow label="Astronomy Configuration" value="Unavailable" />
              <DetailRow label="Reason" value="Incomplete research configuration" />
            </dl>
            <p className="mt-3">
              Scientific and provenance identities are not available for this result.
            </p>
          </section>
        ) : null}

        <section aria-labelledby={warningsTitleId} className="min-w-0 sm:col-span-2">
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
                    <span className="nn-type-metadata break-all font-mono font-semibold">{warning.code}</span>
                    <span className="nn-type-metadata font-semibold uppercase tracking-[0.12em]">
                      {warning.severity}
                    </span>
                  </div>
                  <p className="nn-type-body-small mt-2 break-words">{warning.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
