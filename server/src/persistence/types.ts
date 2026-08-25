import type { VaultChartCategory } from '@natalnode/contracts';

/** User-editable fields allowed by the Vault chart metadata boundary. */
export type VaultChartMetadataUpdate = {
  readonly displayName?: string;
  readonly category?: VaultChartCategory;
  readonly tags?: readonly string[];
  readonly favorite?: boolean;
};

/** Narrow update contract for note content only. */
export type ChartNoteContentUpdate = {
  readonly content: string;
};
