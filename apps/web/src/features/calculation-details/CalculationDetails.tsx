import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';

export type CalculationDetailsProps = {
  chart: ChartResult;
};

type DetailRowProps = {
  label: string;
  value: string;
  identifier?: boolean;
};

function DetailRow({ label, value, identifier = false }: DetailRowProps) {
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.2fr)] sm:items-baseline sm:gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd
        className={`min-w-0 text-left font-medium text-white sm:text-right ${
          identifier ? 'break-all font-mono text-xs leading-5' : 'break-words'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function CalculationDetails({ chart }: CalculationDetailsProps) {
  const detailsId = useId();
  const researchTitleId = `${detailsId}-research-title`;
  const warningsTitleId = `${detailsId}-warnings-title`;
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';
  const astronomyConfiguration = chart.metadata.astronomyConfigurationId ?? 'Unavailable';
  const provenanceEnvelope = chart.metadata.provenanceEnvelopeId ?? 'Unavailable';
  const houseSystem = chart.houses?.system ?? 'Unavailable';

  return (
    <details className="border-t border-natal-border/70">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white outline-none focus-visible:bg-natal-night/40 focus-visible:text-natal-accent sm:px-7">
        Calculation Details
      </summary>

      <div className="grid min-w-0 gap-5 border-t border-natal-border/50 px-5 pb-6 pt-5 sm:px-7 sm:grid-cols-2">
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
          <DetailRow label="House System" value={houseSystem} />
        </dl>

        {isResearchConfiguration ? (
          <section
            aria-labelledby={researchTitleId}
            className="min-w-0 rounded-lg border border-amber-200/30 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50/90"
          >
            <h3 className="font-semibold text-amber-100" id={researchTitleId}>
              Research configuration
            </h3>
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
          <h3 className="text-sm font-semibold text-white" id={warningsTitleId}>
            Warnings
          </h3>
          {chart.warnings.length === 0 ? (
            <p className="mt-2 text-sm text-slate-300">None</p>
          ) : (
            <ul className="mt-3 grid min-w-0 gap-3">
              {chart.warnings.map((warning, index) => (
                <li
                  className="min-w-0 rounded-lg border border-natal-border/70 bg-natal-night/30 p-3 text-sm"
                  key={`${warning.code}-${index}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="break-all font-mono text-xs font-semibold text-white">{warning.code}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                      {warning.severity}
                    </span>
                  </div>
                  <p className="mt-2 break-words leading-6 text-slate-300">{warning.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </details>
  );
}
