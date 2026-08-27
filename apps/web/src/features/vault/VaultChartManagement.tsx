import type { ReactNode } from 'react';
import type {
  GetVaultChartApiResponse,
  VaultChartRecord
} from '@natalnode/contracts';
import VaultChartDeletionPanel from './VaultChartDeletionPanel.js';
import VaultChartMetadataForm from './VaultChartMetadataForm.js';
import VaultChartNotesManager from './VaultChartNotesManager.js';

export interface VaultChartManagementProps {
  readonly chart: GetVaultChartApiResponse['chart'];
  readonly children: ReactNode;
  readonly onChartUpdated: (chart: VaultChartRecord) => void;
  readonly onDeleted: () => void;
}

export default function VaultChartManagement({
  chart,
  children,
  onChartUpdated,
  onDeleted
}: VaultChartManagementProps) {
  return (
    <div>
      <header className="nn-surface nn-surface--elevated mb-6 p-5 sm:p-6">
        <p className="nn-badge">{chart.category}</p>
        <h2 className="nn-type-card-title mt-4 break-words">{chart.displayName}</h2>
        <time className="nn-type-metadata mt-4 block" dateTime={chart.createdAt}>
          Saved {chart.createdAt}
        </time>

        <VaultChartMetadataForm chart={chart} onChartUpdated={onChartUpdated} />
      </header>

      {children}

      <VaultChartNotesManager chartId={chart.chartId} />

      <VaultChartDeletionPanel chartId={chart.chartId} onDeleted={onDeleted} />

    </div>
  );
}
