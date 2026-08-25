import type {
  ChartRequest,
  ChartResult,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import type { SqlExecutor } from '../../db/index.js';
import type { VaultChartRepository } from '../vault-chart-repository.js';
import type { VaultChartMetadataUpdate } from '../types.js';

interface VaultChartRow {
  chart_id: string;
  user_id: string;
  display_name: string;
  category: VaultChartCategory;
  tags: readonly string[];
  favorite: boolean;
  normalized_input: ChartRequest;
  canonical_result: ChartResult;
  engine_version: string;
  chart_schema_version: string;
  astronomy_configuration_id: string | null;
  provenance_envelope_id: string | null;
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
    created_at,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`;

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

const DELETE_CHART_SQL = `
  DELETE FROM charts
  WHERE user_id = $1
    AND chart_id = $2
  RETURNING chart_id`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapVaultChartRow(row: VaultChartRow): VaultChartRecord {
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
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(chart: VaultChartRecord): Promise<void> {
    await this.executor.query<never>(INSERT_CHART_SQL, [
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
      chart.createdAt,
      chart.updatedAt
    ]);
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
