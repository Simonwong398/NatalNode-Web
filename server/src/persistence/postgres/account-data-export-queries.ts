export const ACCOUNT_DATA_EXPORT_BEGIN_SQL =
  'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY';

export const ACCOUNT_DATA_EXPORT_COMMIT_SQL = 'COMMIT';
export const ACCOUNT_DATA_EXPORT_ROLLBACK_SQL = 'ROLLBACK';

export const ACCOUNT_DATA_EXPORT_STATEMENT_TIMEOUT_SQL =
  "SELECT set_config('statement_timeout', $1, true)";
export const ACCOUNT_DATA_EXPORT_IDLE_TIMEOUT_SQL =
  "SELECT set_config('idle_in_transaction_session_timeout', $1, true)";

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

export const ACCOUNT_DATA_EXPORT_PRACTITIONER_APPLICATION_SQL = `
  SELECT
    application_id,
    requested_display_name,
    professional_headline,
    bio,
    practice_areas,
    languages,
    country_or_region,
    website_url,
    practice_statement,
    evidence_urls,
    consent_to_public_profile,
    submitted_at,
    status,
    finalized_at,
    purge_eligible_at
  FROM practitioner_applications
  WHERE user_id = $1
  ORDER BY submitted_at DESC, application_id DESC
  LIMIT 1`;

export const ACCOUNT_DATA_EXPORT_PRACTITIONER_STATUS_HISTORY_SQL = `
  SELECT
    action,
    created_at
  FROM practitioner_review_events
  WHERE application_id = $1
    AND subject_type = 'APPLICATION'
  ORDER BY created_at ASC, review_event_id ASC`;

export const ACCOUNT_DATA_EXPORT_PRACTITIONER_PROFILE_SQL = `
  SELECT
    practitioner_id,
    display_name,
    professional_headline,
    bio,
    practice_areas,
    languages,
    country_or_region,
    website_url,
    founding_practitioner,
    approved_at,
    profile_status,
    created_at,
    updated_at
  FROM practitioner_profiles
  WHERE user_id = $1
  ORDER BY created_at DESC, practitioner_id DESC
  LIMIT 1`;

export const ACCOUNT_DATA_EXPORT_PRACTITIONER_PROFILE_REVISIONS_SQL = `
  SELECT
    revisions.professional_headline,
    revisions.display_name,
    revisions.bio,
    revisions.practice_areas,
    revisions.languages,
    revisions.country_or_region,
    revisions.website_url,
    revisions.status,
    revisions.submitted_at,
    revisions.reviewed_at
  FROM practitioner_profile_revisions AS revisions
  INNER JOIN practitioner_profiles AS profiles
    ON profiles.practitioner_id = revisions.practitioner_id
   AND profiles.user_id = $1
  ORDER BY revisions.submitted_at ASC, revisions.revision_id ASC`;

export const ACCOUNT_DATA_EXPORT_NOTIFICATION_CHANNEL_PREFERENCES_SQL = `
  SELECT
    channel,
    enabled,
    created_at,
    updated_at
  FROM notification_channel_preferences
  WHERE user_id = $1
  ORDER BY channel ASC`;

export const ACCOUNT_DATA_EXPORT_NOTIFICATION_CATEGORY_PREFERENCES_SQL = `
  SELECT
    category,
    enabled,
    created_at,
    updated_at
  FROM notification_category_preferences
  WHERE user_id = $1
  ORDER BY category ASC`;

export const ACCOUNT_DATA_EXPORT_PUSH_SUBSCRIPTIONS_SQL = `
  SELECT
    subscription_id,
    status,
    created_at,
    updated_at,
    last_success_at,
    invalidated_at
  FROM push_subscriptions
  WHERE user_id = $1
    AND (
      $2::timestamptz IS NULL
      OR (created_at, subscription_id) > ($2::timestamptz, $3::text)
    )
  ORDER BY created_at ASC, subscription_id ASC
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

export interface AccountDataExportPractitionerApplicationRow {
  readonly application_id: string;
  readonly requested_display_name: string;
  readonly professional_headline: string;
  readonly bio: string;
  readonly practice_areas: readonly string[];
  readonly languages: readonly string[];
  readonly country_or_region: string;
  readonly website_url: string | null;
  readonly practice_statement: string;
  readonly evidence_urls: readonly string[];
  readonly consent_to_public_profile: true;
  readonly submitted_at: Date | string;
  readonly status: string;
  readonly finalized_at: Date | string | null;
  readonly purge_eligible_at: Date | string | null;
}

export interface AccountDataExportPractitionerStatusHistoryRow {
  readonly action: string;
  readonly created_at: Date | string;
}

export interface AccountDataExportPractitionerProfileRow {
  readonly practitioner_id: string;
  readonly display_name: string;
  readonly professional_headline: string;
  readonly bio: string;
  readonly practice_areas: readonly string[];
  readonly languages: readonly string[];
  readonly country_or_region: string;
  readonly website_url: string | null;
  readonly founding_practitioner: boolean;
  readonly approved_at: Date | string;
  readonly profile_status: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportPractitionerProfileRevisionRow {
  readonly display_name: string;
  readonly professional_headline: string;
  readonly bio: string;
  readonly practice_areas: readonly string[];
  readonly languages: readonly string[];
  readonly country_or_region: string;
  readonly website_url: string | null;
  readonly status: string;
  readonly submitted_at: Date | string;
  readonly reviewed_at: Date | string | null;
}

export interface AccountDataExportNotificationChannelPreferenceRow {
  readonly channel: 'WEB_PUSH';
  readonly enabled: boolean;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportNotificationCategoryPreferenceRow {
  readonly category: 'ACCOUNT' | 'SYSTEM' | 'ASTROLOGY_ALERT';
  readonly enabled: boolean;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface AccountDataExportPushSubscriptionRow {
  readonly subscription_id: string;
  readonly status: 'ACTIVE' | 'INVALIDATED';
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly last_success_at: Date | string | null;
  readonly invalidated_at: Date | string | null;
}
