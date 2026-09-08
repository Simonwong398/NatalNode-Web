import type { VaultChartRecord } from '@natalnode/contracts';
import {
  DEFAULT_LOCALE,
  getLocalizedPath,
  type SupportedLocale
} from '@/lib/localization';
import { formatVaultUi, vaultUi } from './vault-ui.js';

interface VaultRecordDetailsProps {
  readonly chart: VaultChartRecord;
  readonly locale?: SupportedLocale;
}

function timeStateKey(chart: VaultChartRecord):
  | 'vault.timeState.resolved'
  | 'vault.timeState.ambiguous'
  | 'vault.timeState.nonexistent'
  | 'vault.timeState.unknown'
  | 'vault.timeState.unresolved' {
  switch (chart.timeAuthorityState) {
    case 'RESOLVED':
      return 'vault.timeState.resolved';
    case 'AMBIGUOUS':
      return 'vault.timeState.ambiguous';
    case 'NONEXISTENT':
      return 'vault.timeState.nonexistent';
    case 'UNKNOWN_BIRTH_TIME':
      return 'vault.timeState.unknown';
    default:
      return 'vault.timeState.unresolved';
  }
}

function scientificStateKey(chart: VaultChartRecord):
  | 'vault.state.authoritative'
  | 'vault.state.inputOnly'
  | 'vault.state.developmentFixture' {
  if (chart.recordOrigin === 'DEVELOPMENT_FIXTURE') {
    return 'vault.state.developmentFixture';
  }

  return chart.scientificStatus === 'CHART_RESULT_AVAILABLE'
    ? 'vault.state.authoritative'
    : 'vault.state.inputOnly';
}

function hasAuthoritativeChartResult(chart: VaultChartRecord): boolean {
  return chart.scientificStatus === 'CHART_RESULT_AVAILABLE';
}

export default function VaultRecordDetails({
  chart,
  locale
}: VaultRecordDetailsProps) {
  const birth = chart.normalizedChartRequest.birth;
  const savedAt = chart.savedAt ?? chart.createdAt;
  const isAuthoritative = hasAuthoritativeChartResult(chart);
  const calculatePath = getLocalizedPath(
    locale ?? DEFAULT_LOCALE,
    `/?vaultRecordId=${encodeURIComponent(chart.chartId)}`
  );

  return (
    <section
      aria-labelledby="vault-record-details-title"
      className="nn-surface nn-surface--elevated mb-6 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="nn-eyebrow">{vaultUi(locale, 'vault.recordDetailsEyebrow')}</p>
          <h2 className="nn-type-section-title mt-1" id="vault-record-details-title">
            {vaultUi(locale, 'vault.recordDetailsTitle')}
          </h2>
        </div>
        <span className="nn-badge" role="status">
          {vaultUi(locale, scientificStateKey(chart))}
        </span>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.recordName')}</dt>
          <dd className="nn-type-body-small mt-1 break-words">{chart.displayName}</dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.birthDate')}</dt>
          <dd className="nn-type-body-small mt-1">{birth.localDate}</dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.birthTimeState')}</dt>
          <dd className="nn-type-body-small mt-1">
            {vaultUi(locale, timeStateKey(chart))}
            {birth.localTime === null ? '' : ` · ${birth.localTime}`}
          </dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.canonicalPlace')}</dt>
          <dd className="nn-type-body-small mt-1 break-words">{birth.locationLabel}</dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.timezone')}</dt>
          <dd className="nn-type-body-small mt-1 break-words">{birth.ianaTimeZone}</dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.coordinates')}</dt>
          <dd className="nn-type-body-small mt-1">
            {birth.latitude}, {birth.longitude}
          </dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.savedAt')}</dt>
          <dd className="nn-type-body-small mt-1">
            <time dateTime={savedAt}>
              {formatVaultUi(locale, 'vault.savedPrefix', { date: savedAt })}
            </time>
          </dd>
        </div>
        <div>
          <dt className="nn-type-label">{vaultUi(locale, 'vault.updatedAt')}</dt>
          <dd className="nn-type-body-small mt-1">
            <time dateTime={chart.updatedAt}>
              {formatVaultUi(locale, 'vault.updatedPrefix', { date: chart.updatedAt })}
            </time>
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-[color:var(--nn-border-subtle)] pt-5">
        <p className="nn-type-label">{vaultUi(locale, 'vault.provenance')}</p>
        <p className="nn-type-body-small mt-1">
          {chart.recordOrigin === 'DEVELOPMENT_FIXTURE'
            ? vaultUi(locale, 'vault.provenanceDevelopmentFixture')
            : isAuthoritative
              ? vaultUi(locale, 'vault.provenanceAuthoritative')
              : vaultUi(locale, 'vault.provenanceInputOnly')}
        </p>
      </div>

      <a className="nn-button nn-button--secondary mt-6" href={calculatePath}>
        {vaultUi(locale, 'vault.openInCalculate')}
      </a>
    </section>
  );
}
