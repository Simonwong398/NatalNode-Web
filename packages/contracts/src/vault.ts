import type { ChartRequest, ChartResult } from './chart.js';

/** Registered-user categories supported by the Chart Vault. */
export type VaultChartCategory = 'SELF' | 'PARTNER' | 'FAMILY' | 'FRIEND' | 'CLIENT';

/** Truthful scientific state persisted with a user-owned Vault record. */
export type VaultScientificStatus =
  | 'INPUT_ONLY'
  | 'CHART_RESULT_AVAILABLE';

/** Authority state for the saved scientific snapshot. */
export type VaultCalculationAuthorityState =
  | 'AUTHORITY_INCOMPLETE'
  | 'AUTHORITATIVE';

/** Origin of the saved record; development fixtures are never authoritative. */
export type VaultRecordOrigin = 'USER_INPUT' | 'DEVELOPMENT_FIXTURE';

/** Provider-neutral time authority state retained with the input snapshot. */
export type VaultTimeAuthorityState =
  | 'UNRESOLVED'
  | 'RESOLVED'
  | 'AMBIGUOUS'
  | 'NONEXISTENT'
  | 'UNKNOWN_BIRTH_TIME';

/** Stable, public provenance fields; provider-internal payloads are excluded. */
export interface VaultRecordProvenance {
  readonly schemaVersion: '1';
  readonly recordOrigin: VaultRecordOrigin;
  readonly sourceContext: string;
  readonly savedAt: string;
  readonly timeAuthorityState: VaultTimeAuthorityState;
  readonly calculationAuthorityState: VaultCalculationAuthorityState;
  readonly chartResultContractVersion: string | null;
  readonly scientificConfigurationIdentity: string | null;
  readonly provenanceEnvelopeId: string | null;
}

/**
 * Persistence-neutral saved chart/input snapshot.
 *
 * `chartId` and `userId` are the established repository names for the
 * `vaultRecordId` and `ownerUserId` concepts. They are retained so existing
 * Vault API consumers remain compatible while the record now carries an
 * explicit, truthful scientific state.
 */
export interface VaultRecord {
  readonly chartId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly category: VaultChartCategory;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: ChartRequest;
  readonly canonicalChartResult: ChartResult | null;
  readonly engineVersion: string | null;
  readonly chartSchemaVersion: string | null;
  readonly astronomyConfigurationId: string | null;
  readonly provenanceEnvelopeId: string | null;
  readonly recordVersion: number;
  readonly scientificStatus: VaultScientificStatus;
  readonly calculationAuthorityState: VaultCalculationAuthorityState;
  readonly recordOrigin: VaultRecordOrigin;
  readonly sourceContext: string;
  readonly timeAuthorityState: VaultTimeAuthorityState;
  readonly chartResultContractVersion: string | null;
  readonly scientificConfigurationIdentity: string | null;
  readonly scientificProvenance: VaultRecordProvenance;
  /** Immutable timestamp for the historical saved snapshot. */
  readonly savedAt: string;
  /** ISO 8601 timestamp. */
  readonly createdAt: string;
  /** ISO 8601 timestamp. */
  readonly updatedAt: string;
}

/** Backwards-compatible name used by the existing chart-oriented API. */
export type VaultChartRecord = VaultRecord;

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
