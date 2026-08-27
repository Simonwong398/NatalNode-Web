import type { ChartRequest, ChartResult } from './chart.js';

/** Registered-user categories supported by the Chart Vault. */
export type VaultChartCategory = 'SELF' | 'PARTNER' | 'FAMILY' | 'FRIEND' | 'CLIENT';

/**
 * Persistence-neutral saved Engine calculation snapshot.
 *
 * User-editable fields are kept alongside, but distinct from, the normalized
 * request and canonical Engine result. Persistence code must not mutate the
 * scientific snapshot when changing labels, tags, or favorite state.
 */
export interface VaultChartRecord {
  readonly chartId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: ChartRequest;
  readonly canonicalChartResult: ChartResult;
  readonly engineVersion: string;
  readonly chartSchemaVersion: string;
  readonly astronomyConfigurationId: string | null;
  readonly provenanceEnvelopeId: string | null;
  /** ISO 8601 timestamp. */
  readonly createdAt: string;
  /** ISO 8601 timestamp. */
  readonly updatedAt: string;
}

/**
 * A user-owned note attached to a saved chart.
 *
 * The `userId` must correspond to the owning user of the referenced chart;
 * this relationship is an application invariant, not a database concern of
 * this contract-only patch.
 */
export interface ChartNoteRecord {
  readonly noteId: string;
  readonly chartId: string;
  readonly userId: string;
  readonly content: string;
  /** ISO 8601 timestamp. */
  readonly createdAt: string;
  /** ISO 8601 timestamp. */
  readonly updatedAt: string;
}
