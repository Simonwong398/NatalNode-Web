import type {
  ChartRequest,
  ChartResult,
  VaultChartCategory,
  VaultChartRecord,
  VaultRecordProvenance,
  VaultResearchSnapshot,
  VaultTimeAuthorityState
} from '@natalnode/contracts';
import type { SqlExecutor, TransactionRunner } from '../../db/index.js';
import type {
  VaultChartListOptions,
  VaultChartListPage,
  VaultChartRepository
} from '../vault-chart-repository.js';
import type { VaultChartMetadataUpdate } from '../types.js';

interface VaultChartRow {
  chart_id: string;
  user_id: string;
  display_name: string;
  category: VaultChartCategory;
  tags: readonly string[];
  favorite: boolean;
  normalized_input: ChartRequest;
  canonical_result: ChartResult | null;
  engine_version: string | null;
  chart_schema_version: string | null;
  astronomy_configuration_id: string | null;
  provenance_envelope_id: string | null;
  record_version?: number;
  scientific_status?: VaultChartRecord['scientificStatus'];
  calculation_authority_state?: VaultChartRecord['calculationAuthorityState'];
  record_origin?: VaultChartRecord['recordOrigin'];
  source_context?: string;
  time_authority_state?: VaultTimeAuthorityState;
  chart_result_contract_version?: string | null;
  scientific_configuration_identity?: string | null;
  scientific_provenance?: VaultRecordProvenance;
  research_snapshot?: VaultResearchSnapshot | null;
  saved_at?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

const CHART_COLUMNS = `
  chart_id,
  user_id,
  display_name,
  category,
  tags,
  favorite,
  normalized_input,
  canonical_result,
  engine_version,
  chart_schema_version,
  astronomy_configuration_id,
  provenance_envelope_id,
  record_version,
  scientific_status,
  calculation_authority_state,
  record_origin,
  source_context,
  time_authority_state,
  chart_result_contract_version,
  scientific_configuration_identity,
  scientific_provenance,
  research_snapshot,
  saved_at,
  created_at,
  updated_at`;

const INSERT_CHART_SQL = `
  INSERT INTO charts (
    chart_id,
    user_id,
    display_name,
    category,
    tags,
    favorite,
    normalized_input,
    canonical_result,
    engine_version,
    chart_schema_version,
    astronomy_configuration_id,
    provenance_envelope_id,
    record_version,
    scientific_status,
    calculation_authority_state,
    record_origin,
    source_context,
    time_authority_state,
    chart_result_contract_version,
    scientific_configuration_identity,
    scientific_provenance,
    research_snapshot,
    saved_at,
    created_at,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`;

const LOCK_OWNER_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR UPDATE`;

const COUNT_CHARTS_SQL = `
  SELECT COUNT(*)::int AS count
  FROM charts
  WHERE user_id = $1`;

const FIND_CHART_SQL = `
  SELECT${CHART_COLUMNS}
  FROM charts
  WHERE user_id = $1
    AND chart_id = $2`;

const LIST_CHARTS_SQL = `
  SELECT${CHART_COLUMNS}
  FROM charts
  WHERE user_id = $1
  ORDER BY created_at DESC, chart_id ASC`;

const LIST_CHARTS_PAGE_SQL = `
  SELECT${CHART_COLUMNS}
  FROM charts
  WHERE user_id = $1
    AND (
      $2::timestamptz IS NULL
      OR created_at < $2::timestamptz
      OR (created_at = $2::timestamptz AND chart_id > $3)
    )
  ORDER BY created_at DESC, chart_id ASC
  LIMIT $4`;

const DELETE_CHART_SQL = `
  DELETE FROM charts
  WHERE user_id = $1
    AND chart_id = $2
  RETURNING chart_id`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function legacyTimeAuthorityState(chart: ChartRequest): VaultTimeAuthorityState {
  switch (chart.birth.ambiguityStatus) {
    case 'EXACT':
      return 'RESOLVED';
    case 'AMBIGUOUS':
      return 'AMBIGUOUS';
    case 'NONEXISTENT':
      return 'NONEXISTENT';
    case 'UNKNOWN_TIME':
      return 'UNKNOWN_BIRTH_TIME';
    default:
      return 'UNRESOLVED';
  }
}

function legacyProvenance(
  row: VaultChartRow,
  savedAt: string,
  calculationAuthorityState: VaultChartRecord['calculationAuthorityState'],
  recordOrigin: VaultChartRecord['recordOrigin'],
  sourceContext: string,
  timeAuthorityState: VaultTimeAuthorityState
): VaultRecordProvenance {
  if (row.scientific_provenance !== undefined && row.scientific_provenance !== null) {
    return row.scientific_provenance;
  }
  if (recordOrigin === 'SERVER_RESEARCH_CAPTURE') {
    throw new Error('Research Vault records require versioned persisted provenance.');
  }
  return {
      schemaVersion: '1',
      recordOrigin,
      sourceContext,
      savedAt,
      timeAuthorityState,
      calculationAuthorityState,
      chartResultContractVersion: row.chart_result_contract_version ?? row.chart_schema_version,
      scientificConfigurationIdentity:
        row.scientific_configuration_identity ?? row.astronomy_configuration_id,
      provenanceEnvelopeId: row.provenance_envelope_id
    };
}

function mapVaultChartRow(row: VaultChartRow): VaultChartRecord {
  const savedAt = toTimestampString(row.saved_at ?? row.created_at);
  const scientificStatus =
    row.scientific_status ??
    (row.canonical_result === null ? 'INPUT_ONLY' : 'CHART_RESULT_AVAILABLE');
  const calculationAuthorityState =
    row.calculation_authority_state ??
    (scientificStatus === 'CHART_RESULT_AVAILABLE'
      ? 'AUTHORITATIVE'
      : 'AUTHORITY_INCOMPLETE');
  const recordOrigin = row.record_origin ?? 'USER_INPUT';
  const sourceContext = row.source_context ?? 'vault.legacy';
  const timeAuthorityState =
    row.time_authority_state ?? legacyTimeAuthorityState(row.normalized_input);

  return {
    chartId: row.chart_id,
    userId: row.user_id,
    displayName: row.display_name,
    category: row.category,
    tags: row.tags,
    favorite: row.favorite,
    normalizedChartRequest: row.normalized_input,
    canonicalChartResult: row.canonical_result,
    engineVersion: row.engine_version,
    chartSchemaVersion: row.chart_schema_version,
    astronomyConfigurationId: row.astronomy_configuration_id,
    provenanceEnvelopeId: row.provenance_envelope_id,
    recordVersion: row.record_version ?? 1,
    scientificStatus,
    calculationAuthorityState,
    recordOrigin,
    sourceContext,
    timeAuthorityState,
    chartResultContractVersion:
      row.chart_result_contract_version ?? row.chart_schema_version,
    scientificConfigurationIdentity:
      row.scientific_configuration_identity ?? row.astronomy_configuration_id,
    scientificProvenance: legacyProvenance(
      row,
      savedAt,
      calculationAuthorityState,
      recordOrigin,
      sourceContext,
      timeAuthorityState
    ),
    ...(row.research_snapshot === undefined || row.research_snapshot === null
      ? {}
      : { researchSnapshot: row.research_snapshot }),
    savedAt,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  };
}

interface MetadataUpdateQuery {
  readonly sql: string;
  readonly params: readonly unknown[];
}

function buildMetadataUpdateQuery(
  userId: string,
  chartId: string,
  update: VaultChartMetadataUpdate
): MetadataUpdateQuery | null {
  const assignments: string[] = [];
  const params: unknown[] = [];

  if (update.displayName !== undefined) {
    assignments.push(`display_name = $${params.length + 1}`);
    params.push(update.displayName);
  }

  if (update.category !== undefined) {
    assignments.push(`category = $${params.length + 1}`);
    params.push(update.category);
  }

  if (update.tags !== undefined) {
    assignments.push(`tags = $${params.length + 1}`);
    params.push(update.tags);
  }

  if (update.favorite !== undefined) {
    assignments.push(`favorite = $${params.length + 1}`);
    params.push(update.favorite);
  }

  if (assignments.length === 0) {
    return null;
  }

  const userParam = params.length + 1;
  const chartParam = params.length + 2;

  return {
    sql: `
      UPDATE charts
      SET ${[...assignments, 'updated_at = CURRENT_TIMESTAMP'].join(', ')}
      WHERE user_id = $${userParam}
        AND chart_id = $${chartParam}
      RETURNING${CHART_COLUMNS}`,
    params: [...params, userId, chartId]
  };
}

export class PostgresVaultChartRepository implements VaultChartRepository {
  public constructor(
    private readonly executor: SqlExecutor,
    private readonly transactionRunner?: TransactionRunner
  ) {}

  private async insert(executor: SqlExecutor, chart: VaultChartRecord): Promise<void> {
    await executor.query<never>(INSERT_CHART_SQL, [
      chart.chartId,
      chart.userId,
      chart.displayName,
      chart.category,
      chart.tags,
      chart.favorite,
      chart.normalizedChartRequest,
      chart.canonicalChartResult,
      chart.engineVersion,
      chart.chartSchemaVersion,
      chart.astronomyConfigurationId,
      chart.provenanceEnvelopeId,
      chart.recordVersion,
      chart.scientificStatus,
      chart.calculationAuthorityState,
      chart.recordOrigin,
      chart.sourceContext,
      chart.timeAuthorityState,
      chart.chartResultContractVersion,
      chart.scientificConfigurationIdentity,
      chart.scientificProvenance,
      chart.researchSnapshot ?? null,
      chart.savedAt,
      chart.createdAt,
      chart.updatedAt
    ]);
  }

  public async create(chart: VaultChartRecord): Promise<void> {
    await this.insert(this.executor, chart);
  }

  public async createWithCapacity(
    chart: VaultChartRecord,
    capacity: number
  ): Promise<'created' | 'capacity-reached'> {
    if (!Number.isSafeInteger(capacity) || capacity <= 0) {
      throw new TypeError('Vault capacity is invalid.');
    }

    if (this.transactionRunner === undefined) {
      await this.create(chart);
      return 'created';
    }

    return this.transactionRunner.run(async (executor) => {
      const ownerResult = await executor.query<{ user_id: string }>(
        LOCK_OWNER_SQL,
        [chart.userId]
      );

      if (ownerResult.rows.length === 0) {
        throw new Error('Vault record owner does not exist.');
      }

      const countResult = await executor.query<{ count: number | string }>(
        COUNT_CHARTS_SQL,
        [chart.userId]
      );
      const count = Number(countResult.rows[0]?.count ?? 0);

      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error('Vault record count is invalid.');
      }

      if (count >= capacity) {
        return 'capacity-reached';
      }

      await this.insert(executor, chart);
      return 'created';
    });
  }

  public async countForUser(userId: string): Promise<number> {
    const result = await this.executor.query<{ count: number | string }>(
      COUNT_CHARTS_SQL,
      [userId]
    );
    const count = Number(result.rows[0]?.count ?? 0);

    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Vault record count is invalid.');
    }

    return count;
  }

  public async findById(userId: string, chartId: string): Promise<VaultChartRecord | null> {
    const result = await this.executor.query<VaultChartRow>(FIND_CHART_SQL, [userId, chartId]);
    const row = result.rows[0];

    return row ? mapVaultChartRow(row) : null;
  }

  public async listForUser(userId: string): Promise<readonly VaultChartRecord[]> {
    const result = await this.executor.query<VaultChartRow>(LIST_CHARTS_SQL, [userId]);

    return result.rows.map(mapVaultChartRow);
  }

  public async listPageForUser(
    userId: string,
    options: VaultChartListOptions
  ): Promise<VaultChartListPage> {
    if (
      !Number.isSafeInteger(options.limit) ||
      options.limit <= 0 ||
      options.limit > 100
    ) {
      throw new Error('Vault chart list limit is invalid.');
    }

    const result = await this.executor.query<VaultChartRow>(
      LIST_CHARTS_PAGE_SQL,
      [
        userId,
        options.cursor?.createdAt ?? null,
        options.cursor?.chartId ?? null,
        options.limit + 1
      ]
    );
    const rows = result.rows.slice(0, options.limit);
    const charts = rows.map(mapVaultChartRow);
    const last = charts[charts.length - 1];

    return {
      charts,
      nextCursor:
        result.rows.length > options.limit && last !== undefined
          ? { createdAt: last.createdAt, chartId: last.chartId }
          : null
    };
  }

  public async updateMetadata(
    userId: string,
    chartId: string,
    update: VaultChartMetadataUpdate
  ): Promise<VaultChartRecord | null> {
    const query = buildMetadataUpdateQuery(userId, chartId, update);

    if (!query) {
      return this.findById(userId, chartId);
    }

    const result = await this.executor.query<VaultChartRow>(query.sql, query.params);
    const row = result.rows[0];

    return row ? mapVaultChartRow(row) : null;
  }

  public async deleteById(userId: string, chartId: string): Promise<boolean> {
    const result = await this.executor.query<{ chart_id: string }>(DELETE_CHART_SQL, [
      userId,
      chartId
    ]);

    return result.rows.length > 0;
  }
}
