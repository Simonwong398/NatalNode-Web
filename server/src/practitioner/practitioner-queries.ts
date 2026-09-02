export const FIND_PRACTITIONER_APPLICATION_FOR_USER_SQL = `
  SELECT
    application_id,
    user_id,
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
    version,
    finalized_at,
    purge_eligible_at,
    retention_hold,
    account_deleted_at
  FROM practitioner_applications
  WHERE user_id = $1
  ORDER BY submitted_at DESC, application_id DESC
  LIMIT 1`;

export const FIND_ACTIVE_PRACTITIONER_APPLICATION_SQL = `
  SELECT application_id
  FROM practitioner_applications
  WHERE user_id = $1
    AND status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
  LIMIT 1`;

export const FIND_LATEST_FINAL_PRACTITIONER_APPLICATION_SQL = `
  SELECT status, finalized_at, purge_eligible_at, retention_hold
  FROM practitioner_applications
  WHERE user_id = $1
    AND status IN ('REJECTED', 'WITHDRAWN', 'REVOKED')
    AND finalized_at IS NOT NULL
  ORDER BY finalized_at DESC, application_id DESC
  LIMIT 1`;

export const INSERT_PRACTITIONER_APPLICATION_SQL = `
  INSERT INTO practitioner_applications (
    application_id,
    user_id,
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
    status
  ) VALUES ($1, $2, $3, $4, $5, $6::text[], $7::text[], $8, $9, $10, $11::text[], $12, $13, 'SUBMITTED')
  ON CONFLICT DO NOTHING
  RETURNING *`;

export const LOCK_PRACTITIONER_APPLICATION_SQL = `
  SELECT *
  FROM practitioner_applications
  WHERE application_id = $1
  FOR UPDATE`;

export const RESUBMIT_PRACTITIONER_APPLICATION_SQL = `
  UPDATE practitioner_applications
  SET requested_display_name = $3,
      professional_headline = $4,
      bio = $5,
      practice_areas = $6::text[],
      languages = $7::text[],
      country_or_region = $8,
      website_url = $9,
      practice_statement = $10,
      evidence_urls = $11::text[],
      consent_to_public_profile = $12,
      submitted_at = $13,
      status = 'SUBMITTED',
      version = version + 1,
      finalized_at = NULL,
      purge_eligible_at = NULL,
      account_deleted_at = NULL
  WHERE application_id = $1
    AND user_id = $2
    AND status = 'CHANGES_REQUESTED'
  RETURNING *`;

export const WITHDRAW_PRACTITIONER_APPLICATION_SQL = `
  UPDATE practitioner_applications
  SET status = 'WITHDRAWN',
      finalized_at = $3,
      purge_eligible_at = $4,
      version = version + 1
  WHERE application_id = $1
    AND user_id = $2
    AND status IN ('SUBMITTED', 'CHANGES_REQUESTED')
  RETURNING *`;

export const PRACTITIONER_REVIEWER_EXISTS_SQL = `
  SELECT user_id
  FROM practitioner_reviewers
  WHERE user_id = $1`;

export const LIST_PRACTITIONER_REVIEW_APPLICATIONS_SQL = `
  SELECT
    application_id,
    user_id,
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
    version,
    finalized_at,
    purge_eligible_at,
    retention_hold,
    account_deleted_at
  FROM practitioner_applications
  WHERE (
    ($1::text IS NULL AND status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED'))
    OR ($1::text IS NOT NULL AND status = $1)
  )
  ORDER BY submitted_at ASC, application_id ASC`;

export const LIST_PRACTITIONER_REVIEW_EVENTS_SQL = `
  SELECT
    review_event_id,
    reviewer_user_id,
    application_id,
    revision_id,
    action,
    reason_code,
    note,
    application_version,
    created_at,
    purge_eligible_at,
    retention_hold
  FROM practitioner_review_events
  WHERE application_id = $1
  ORDER BY created_at ASC, review_event_id ASC`;

export const UPDATE_REVIEWED_PRACTITIONER_APPLICATION_SQL = `
  UPDATE practitioner_applications
  SET status = $2,
      version = version + 1,
      finalized_at = $3,
      purge_eligible_at = $4
  WHERE application_id = $1
  RETURNING *`;

export const INSERT_PRACTITIONER_PROFILE_FROM_APPLICATION_SQL = `
  INSERT INTO practitioner_profiles (
    practitioner_id,
    application_id,
    user_id,
    display_name,
    professional_headline,
    bio,
    practice_areas,
    languages,
    country_or_region,
    website_url,
    approved_at,
    created_at,
    updated_at
  )
  SELECT
    $2,
    application_id,
    user_id,
    requested_display_name,
    professional_headline,
    bio,
    practice_areas,
    languages,
    country_or_region,
    website_url,
    $3,
    $3,
    $3
  FROM practitioner_applications
  WHERE application_id = $1
  RETURNING *`;

export const UPDATE_REVOKED_PRACTITIONER_PROFILE_SQL = `
  UPDATE practitioner_profiles
  SET profile_status = 'REVOKED',
      ended_at = $2,
      updated_at = $2
  WHERE application_id = $1
    AND profile_status = 'APPROVED'
  RETURNING practitioner_id`;

export const INSERT_PRACTITIONER_REVIEW_EVENT_SQL = `
  INSERT INTO practitioner_review_events (
    review_event_id,
    reviewer_user_id,
    application_id,
    revision_id,
    subject_type,
    action,
    reason_code,
    note,
    application_version,
    created_at,
    purge_eligible_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  RETURNING *`;

export const GET_PRACTITIONER_PROFILE_FOR_USER_SQL = `
  SELECT *
  FROM practitioner_profiles
  WHERE user_id = $1
    AND profile_status = 'APPROVED'
  ORDER BY approved_at DESC, practitioner_id DESC
  LIMIT 1`;

export const GET_PUBLIC_PRACTITIONER_PROFILE_SQL = `
  SELECT *
  FROM practitioner_profiles
  WHERE practitioner_id = $1
    AND profile_status = 'APPROVED'`;

export const LIST_PUBLIC_PRACTITIONER_PROFILES_SQL = `
  SELECT *
  FROM practitioner_profiles
  WHERE profile_status = 'APPROVED'
    AND (
      $1::text IS NULL
      OR (display_name, practitioner_id) > ($1::text, $2::text)
    )
  ORDER BY display_name ASC, practitioner_id ASC
  LIMIT $3`;

export const LIST_PRACTITIONER_CONTRIBUTIONS_SQL = `
  SELECT
    'QUESTION'::text AS kind,
    q.question_id AS contribution_id,
    q.title,
    q.question_id AS question_id,
    q.created_at
  FROM community_questions AS q
  WHERE q.author_user_id = $1
    AND q.status = 'VISIBLE'
  UNION ALL
  SELECT
    'ANSWER'::text AS kind,
    a.answer_id AS contribution_id,
    q.title,
    q.question_id AS question_id,
    a.created_at
  FROM community_answers AS a
  INNER JOIN community_questions AS q ON q.question_id = a.question_id
  WHERE a.author_user_id = $1
    AND a.status = 'VISIBLE'
    AND q.status = 'VISIBLE'
  ORDER BY created_at DESC, contribution_id ASC`;

export const GET_PENDING_PRACTITIONER_PROFILE_REVISION_FOR_USER_SQL = `
  SELECT r.*
  FROM practitioner_profile_revisions AS r
  INNER JOIN practitioner_profiles AS p
    ON p.practitioner_id = r.practitioner_id
   AND p.user_id = $1
   AND p.profile_status = 'APPROVED'
  WHERE r.status = 'PENDING'
  LIMIT 1`;

export const LIST_PENDING_PRACTITIONER_PROFILE_REVISIONS_SQL = `
  SELECT r.*, p.application_id, p.user_id AS profile_user_id,
         p.profile_status, a.version AS application_version
  FROM practitioner_profile_revisions AS r
  INNER JOIN practitioner_profiles AS p ON p.practitioner_id = r.practitioner_id
  INNER JOIN practitioner_applications AS a ON a.application_id = p.application_id
  WHERE r.status = 'PENDING'
    AND p.profile_status = 'APPROVED'
  ORDER BY r.submitted_at ASC, r.revision_id ASC`;

export const LOCK_PRACTITIONER_PROFILE_FOR_USER_SQL = `
  SELECT *
  FROM practitioner_profiles
  WHERE user_id = $1
    AND profile_status = 'APPROVED'
  FOR UPDATE`;

export const INSERT_PRACTITIONER_PROFILE_REVISION_SQL = `
  INSERT INTO practitioner_profile_revisions (
    revision_id,
    practitioner_id,
    submitted_by_user_id,
    display_name,
    professional_headline,
    bio,
    practice_areas,
    languages,
    country_or_region,
    website_url,
    submitted_at,
    purge_eligible_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8::text[], $9, $10, $11, $12)
  RETURNING *`;

export const LOCK_PRACTITIONER_PROFILE_REVISION_SQL = `
  SELECT r.*, p.application_id, p.user_id AS profile_user_id, p.profile_status,
         a.version AS application_version
  FROM practitioner_profile_revisions AS r
  INNER JOIN practitioner_profiles AS p ON p.practitioner_id = r.practitioner_id
  INNER JOIN practitioner_applications AS a ON a.application_id = p.application_id
  WHERE r.revision_id = $1
  FOR UPDATE OF r, p, a`;

export const UPDATE_PRACTITIONER_PROFILE_REVISION_SQL = `
  UPDATE practitioner_profile_revisions
  SET status = $2,
      reviewed_at = $3
  WHERE revision_id = $1
    AND status = 'PENDING'
  RETURNING *`;

export const PROMOTE_PRACTITIONER_PROFILE_REVISION_SQL = `
  UPDATE practitioner_profiles AS p
  SET display_name = r.display_name,
      professional_headline = r.professional_headline,
      bio = r.bio,
      practice_areas = r.practice_areas,
      languages = r.languages,
      country_or_region = r.country_or_region,
      website_url = r.website_url,
      updated_at = $2
  FROM practitioner_profile_revisions AS r
  WHERE p.practitioner_id = r.practitioner_id
    AND r.revision_id = $1
    AND p.profile_status = 'APPROVED'
  RETURNING p.*`;

export const SET_PRACTITIONER_FOUNDING_LABEL_SQL = `
  UPDATE practitioner_profiles
  SET founding_practitioner = TRUE,
      updated_at = CURRENT_TIMESTAMP
  WHERE practitioner_id = $1
    AND profile_status = 'APPROVED'
  RETURNING practitioner_id`;

export const LOCK_PRACTITIONER_PROFILE_SQL = `
  SELECT practitioner_id, profile_status
  FROM practitioner_profiles
  WHERE practitioner_id = $1
    AND profile_status = 'APPROVED'
  FOR UPDATE`;

export const DUPLICATE_PRACTITIONER_REPORT_SQL = `
  SELECT report_id
  FROM practitioner_profile_reports
  WHERE reporter_user_id = $1
    AND practitioner_id = $2
    AND state = 'OPEN'
  LIMIT 1`;

export const INSERT_PRACTITIONER_REPORT_SQL = `
  INSERT INTO practitioner_profile_reports (
    report_id,
    reporter_user_id,
    practitioner_id,
    category,
    details,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT DO NOTHING
  RETURNING *`;

export const LIST_OPEN_PRACTITIONER_REPORTS_SQL = `
  SELECT *
  FROM practitioner_profile_reports
  WHERE state = 'OPEN'
  ORDER BY created_at ASC, report_id ASC`;

export const LOCK_PRACTITIONER_REPORT_SQL = `
  SELECT *
  FROM practitioner_profile_reports
  WHERE report_id = $1
  FOR UPDATE`;

export const UPDATE_PRACTITIONER_REPORT_SQL = `
  UPDATE practitioner_profile_reports
  SET state = $2,
      resolved_at = $3,
      resolved_by_user_id = $4,
      purge_eligible_at = $5
  WHERE report_id = $1
    AND state = 'OPEN'
  RETURNING *`;

export const DELETE_EXPIRED_PRACTITIONER_REPORTS_SQL = `
  DELETE FROM practitioner_profile_reports
  WHERE state <> 'OPEN'
    AND purge_eligible_at IS NOT NULL
    AND purge_eligible_at <= $1
    AND retention_hold = 'NONE'
  RETURNING report_id`;

export const DELETE_EXPIRED_PRACTITIONER_REVISIONS_SQL = `
  DELETE FROM practitioner_profile_revisions AS r
  WHERE r.purge_eligible_at <= $1
    AND r.retention_hold = 'NONE'
    AND (
      r.status <> 'PENDING'
      OR EXISTS (
        SELECT 1
        FROM practitioner_profiles AS p
        WHERE p.practitioner_id = r.practitioner_id
          AND p.profile_status <> 'APPROVED'
      )
    )
  RETURNING r.revision_id`;

export const DELETE_EXPIRED_PRACTITIONER_REVIEW_EVENTS_SQL = `
  DELETE FROM practitioner_review_events AS e
  WHERE e.retention_hold = 'NONE'
    AND COALESCE(e.purge_eligible_at, (
      SELECT a.purge_eligible_at
      FROM practitioner_applications AS a
      WHERE a.application_id = e.application_id
    )) <= $1
  RETURNING e.review_event_id`;

export const DELETE_EXPIRED_ENDED_PRACTITIONER_PROFILES_SQL = `
  DELETE FROM practitioner_profiles AS p
  USING practitioner_applications AS a
  WHERE a.application_id = p.application_id
    AND p.profile_status <> 'APPROVED'
    AND a.purge_eligible_at IS NOT NULL
    AND a.purge_eligible_at <= $1
    AND a.retention_hold = 'NONE'
    AND NOT EXISTS (
      SELECT 1 FROM practitioner_profile_revisions AS r
      WHERE r.practitioner_id = p.practitioner_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM practitioner_profile_reports AS r
      WHERE r.practitioner_id = p.practitioner_id
    )
  RETURNING p.practitioner_id`;

export const DELETE_EXPIRED_PRACTITIONER_APPLICATIONS_SQL = `
  DELETE FROM practitioner_applications AS a
  WHERE a.status IN ('REJECTED', 'WITHDRAWN', 'REVOKED')
    AND a.purge_eligible_at IS NOT NULL
    AND a.purge_eligible_at <= $1
    AND a.retention_hold = 'NONE'
    AND NOT EXISTS (
      SELECT 1 FROM practitioner_review_events AS e
      WHERE e.application_id = a.application_id
        AND e.retention_hold <> 'NONE'
    )
  RETURNING a.application_id`;
