import type { ReactNode } from 'react';
import type {
  GetVaultChartApiResponse,
  VaultChartRecord
} from '@natalnode/contracts';
import type { SupportedLocale } from '../../lib/localization.js';
import VaultChartDuplicationPanel from './VaultChartDuplicationPanel.js';
import VaultChartDeletionPanel from './VaultChartDeletionPanel.js';
import VaultChartMetadataForm from './VaultChartMetadataForm.js';
import VaultChartNotesManager from './VaultChartNotesManager.js';
import { formatVaultUi, vaultCategoryLabel } from './vault-ui.js';

export interface VaultChartManagementProps {
  readonly chart: GetVaultChartApiResponse['chart'];
  readonly children: ReactNode;
  readonly onChartUpdated: (chart: VaultChartRecord) => void;
  readonly onDeleted: () => void;
  readonly locale?: SupportedLocale;
}

export default function VaultChartManagement({
  chart,
  children,
  onChartUpdated,
  onDeleted,
  locale
}: VaultChartManagementProps) {
  return (
    <div>
      <header className="nn-surface nn-surface--elevated mb-6 p-5 sm:p-6">
        <p className="nn-badge">{vaultCategoryLabel(locale, chart.category)}</p>
        <h2 className="nn-type-card-title mt-4 break-words">{chart.displayName}</h2>
        <time className="nn-type-metadata mt-4 block" dateTime={chart.createdAt}>
          {formatVaultUi(locale, 'vault.savedPrefix', { date: chart.createdAt })}
        </time>

        <VaultChartMetadataForm chart={chart} onChartUpdated={onChartUpdated} locale={locale} />
        <VaultChartDuplicationPanel chartId={chart.chartId} locale={locale} />
      </header>

      {children}

      <VaultChartNotesManager chartId={chart.chartId} locale={locale} />

      <VaultChartDeletionPanel chartId={chart.chartId} onDeleted={onDeleted} locale={locale} />

    </div>
  );
}
