export const ACCOUNT_DATA_EXPORT_BEGIN_SQL =
  'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY';

export const ACCOUNT_DATA_EXPORT_COMMIT_SQL = 'COMMIT';
export const ACCOUNT_DATA_EXPORT_ROLLBACK_SQL = 'ROLLBACK';

export const ACCOUNT_DATA_EXPORT_ACCOUNT_SQL = `
  SELECT user_id, created_at, updated_at
  FROM users
  WHERE user_id = $1`;

export const ACCOUNT_DATA_EXPORT_IDENTITY_PROVIDERS_SQL = `
  SELECT DISTINCT provider
  FROM auth_identities
  WHERE user_id = $1
  ORDER BY provider ASC`;

export const ACCOUNT_DATA_EXPORT_IDENTITIES_SQL = `
  SELECT
    identity_id,
    provider,
    provider_subject,
    created_at,
    updated_at
  FROM auth_identities
  WHERE user_id = $1
    AND (
      $2::timestamptz IS NULL
      OR (created_at, identity_id) > ($2::timestamptz, $3::text)
    )
  ORDER BY created_at ASC, identity_id ASC
  LIMIT $4`;

export const ACCOUNT_DATA_EXPORT_CHARTS_SQL = `
  SELECT
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
  FROM charts
  WHERE user_id = $1
    AND (
      $2::timestamptz IS NULL
      OR (created_at, chart_id) > ($2::timestamptz, $3::text)
    )
  ORDER BY created_at ASC, chart_id ASC
  LIMIT $4`;

export const ACCOUNT_DATA_EXPORT_NOTES_SQL = `
  SELECT
    notes.note_id,
    notes.chart_id,
    notes.user_id,
    notes.content,
    notes.created_at,
    notes.updated_at
  FROM chart_notes AS notes
  INNER JOIN charts AS charts
    ON charts.chart_id = notes.chart_id
   AND charts.user_id = $1
  WHERE notes.user_id = $1
    AND notes.chart_id = $2
    AND (
      $3::timestamptz IS NULL
      OR (notes.created_at, notes.note_id) > ($3::timestamptz, $4::text)
    )
  ORDER BY notes.created_at ASC, notes.note_id ASC
  LIMIT $5`;

export const ACCOUNT_DATA_EXPORT_FEEDBACK_SQL = `
  SELECT
    feedback_id,
    user_id,
    category,
    message,
    created_at
  FROM feedback_submissions
  WHERE user_id = $1
    AND (
      $2::timestamptz IS NULL
      OR (created_at, feedback_id) > ($2::timestamptz, $3::text)
    )
  ORDER BY created_at ASC, feedback_id ASC
  LIMIT $4`;

export interface AccountDataExportUserRow {
  readonly user_id: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportProviderRow {
  readonly provider: string;
}

export interface AccountDataExportIdentityRow {
  readonly identity_id: string;
  readonly provider: string;
  readonly provider_subject: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportChartRow {
  readonly chart_id: string;
  readonly user_id: string;
  readonly display_name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalized_input: unknown;
  readonly canonical_result: unknown;
  readonly engine_version: string;
  readonly chart_schema_version: string;
  readonly astronomy_configuration_id: string | null;
  readonly provenance_envelope_id: string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportNoteRow {
  readonly note_id: string;
  readonly chart_id: string;
  readonly user_id: string;
  readonly content: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportFeedbackRow {
  readonly feedback_id: string;
  readonly user_id: string;
  readonly category: string;
  readonly message: string;
  readonly created_at: Date | string;
}
