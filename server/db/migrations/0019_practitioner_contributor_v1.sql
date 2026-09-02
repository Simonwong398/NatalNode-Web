BEGIN;

CREATE TABLE practitioner_reviewers (
    user_id TEXT PRIMARY KEY,
    granted_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT practitioner_reviewers_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);

CREATE TABLE practitioner_applications (
    application_id TEXT PRIMARY KEY,
    user_id TEXT,
    requested_display_name TEXT NOT NULL,
    professional_headline TEXT NOT NULL,
    bio TEXT NOT NULL,
    practice_areas TEXT[] NOT NULL,
    languages TEXT[] NOT NULL,
    country_or_region TEXT NOT NULL,
    website_url TEXT,
    practice_statement TEXT NOT NULL,
    evidence_urls TEXT[] NOT NULL,
    consent_to_public_profile BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    finalized_at TIMESTAMPTZ,
    purge_eligible_at TIMESTAMPTZ,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    account_deleted_at TIMESTAMPTZ,
    CONSTRAINT practitioner_applications_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT practitioner_applications_status_check
        CHECK (status IN (
            'SUBMITTED',
            'CHANGES_REQUESTED',
            'APPROVED',
            'REJECTED',
            'WITHDRAWN',
            'REVOKED'
        )),
    CONSTRAINT practitioner_applications_practice_areas_check
        CHECK (
            cardinality(practice_areas) BETWEEN 1 AND 7
            AND practice_areas <@ ARRAY[
                'NATAL_ASTROLOGY',
                'CHART_INTERPRETATION',
                'ASTROLOGY_EDUCATION',
                'ASTROLOGY_RESEARCH',
                'RELATIONSHIP_ASTROLOGY',
                'TIMING_AND_CYCLES',
                'OTHER'
            ]::TEXT[]
        ),
    CONSTRAINT practitioner_applications_languages_check
        CHECK (
            cardinality(languages) BETWEEN 1 AND 7
            AND languages <@ ARRAY[
                'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'
            ]::TEXT[]
        ),
    CONSTRAINT practitioner_applications_evidence_check
        CHECK (cardinality(evidence_urls) BETWEEN 1 AND 5),
    CONSTRAINT practitioner_applications_website_check
        CHECK (website_url IS NULL OR website_url LIKE 'https://%'),
    CONSTRAINT practitioner_applications_public_consent_check
        CHECK (consent_to_public_profile IS TRUE),
    CONSTRAINT practitioner_applications_version_check
        CHECK (version >= 1),
    CONSTRAINT practitioner_applications_retention_check
        CHECK (
            (status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
                AND finalized_at IS NULL
                AND purge_eligible_at IS NULL)
            OR
            (status IN ('REJECTED', 'WITHDRAWN', 'REVOKED')
                AND finalized_at IS NOT NULL
                AND purge_eligible_at IS NOT NULL
                AND purge_eligible_at >= finalized_at)
        ),
    CONSTRAINT practitioner_applications_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY')),
    CONSTRAINT practitioner_applications_timestamp_check
        CHECK (submitted_at <= COALESCE(finalized_at, submitted_at))
);

CREATE UNIQUE INDEX practitioner_applications_one_active_user_idx
    ON practitioner_applications (user_id)
    WHERE user_id IS NOT NULL
      AND status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED');

CREATE INDEX practitioner_applications_review_queue_idx
    ON practitioner_applications (status, submitted_at ASC, application_id ASC);

CREATE INDEX practitioner_applications_retention_idx
    ON practitioner_applications (purge_eligible_at, retention_hold)
    WHERE purge_eligible_at IS NOT NULL;

CREATE TABLE practitioner_profiles (
    practitioner_id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    display_name TEXT NOT NULL,
    professional_headline TEXT NOT NULL,
    bio TEXT NOT NULL,
    practice_areas TEXT[] NOT NULL,
    languages TEXT[] NOT NULL,
    country_or_region TEXT NOT NULL,
    website_url TEXT,
    founding_practitioner BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ NOT NULL,
    profile_status TEXT NOT NULL DEFAULT 'APPROVED',
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT practitioner_profiles_application_fk
        FOREIGN KEY (application_id)
        REFERENCES practitioner_applications (application_id)
        ON DELETE RESTRICT,
    CONSTRAINT practitioner_profiles_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT practitioner_profiles_status_check
        CHECK (profile_status IN ('APPROVED', 'REVOKED', 'WITHDRAWN', 'DELETED')),
    CONSTRAINT practitioner_profiles_website_check
        CHECK (website_url IS NULL OR website_url LIKE 'https://%'),
    CONSTRAINT practitioner_profiles_ended_check
        CHECK (
            (profile_status = 'APPROVED' AND ended_at IS NULL)
            OR (profile_status <> 'APPROVED' AND ended_at IS NOT NULL)
        ),
    CONSTRAINT practitioner_profiles_timestamp_check
        CHECK (created_at <= updated_at AND approved_at >= created_at)
);

CREATE UNIQUE INDEX practitioner_profiles_one_public_user_idx
    ON practitioner_profiles (user_id)
    WHERE user_id IS NOT NULL AND profile_status = 'APPROVED';

CREATE INDEX practitioner_profiles_public_order_idx
    ON practitioner_profiles (display_name ASC, practitioner_id ASC)
    WHERE profile_status = 'APPROVED';

CREATE TABLE practitioner_profile_revisions (
    revision_id TEXT PRIMARY KEY,
    practitioner_id TEXT NOT NULL,
    submitted_by_user_id TEXT,
    display_name TEXT NOT NULL,
    professional_headline TEXT NOT NULL,
    bio TEXT NOT NULL,
    practice_areas TEXT[] NOT NULL,
    languages TEXT[] NOT NULL,
    country_or_region TEXT NOT NULL,
    website_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    purge_eligible_at TIMESTAMPTZ NOT NULL,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT practitioner_profile_revisions_profile_fk
        FOREIGN KEY (practitioner_id)
        REFERENCES practitioner_profiles (practitioner_id)
        ON DELETE RESTRICT,
    CONSTRAINT practitioner_profile_revisions_submitter_fk
        FOREIGN KEY (submitted_by_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT practitioner_profile_revisions_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT practitioner_profile_revisions_website_check
        CHECK (website_url IS NULL OR website_url LIKE 'https://%'),
    CONSTRAINT practitioner_profile_revisions_review_check
        CHECK (
            (status = 'PENDING' AND reviewed_at IS NULL)
            OR (status <> 'PENDING' AND reviewed_at IS NOT NULL)
        ),
    CONSTRAINT practitioner_profile_revisions_retention_check
        CHECK (purge_eligible_at >= submitted_at),
    CONSTRAINT practitioner_profile_revisions_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY'))
);

CREATE UNIQUE INDEX practitioner_profile_revisions_one_pending_idx
    ON practitioner_profile_revisions (practitioner_id)
    WHERE status = 'PENDING';

CREATE TABLE practitioner_review_events (
    review_event_id TEXT PRIMARY KEY,
    reviewer_user_id TEXT,
    application_id TEXT NOT NULL,
    revision_id TEXT,
    subject_type TEXT NOT NULL DEFAULT 'APPLICATION',
    action TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    note TEXT,
    application_version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    purge_eligible_at TIMESTAMPTZ,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT practitioner_review_events_reviewer_fk
        FOREIGN KEY (reviewer_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT practitioner_review_events_application_fk
        FOREIGN KEY (application_id)
        REFERENCES practitioner_applications (application_id)
        ON DELETE RESTRICT,
    CONSTRAINT practitioner_review_events_revision_fk
        FOREIGN KEY (revision_id)
        REFERENCES practitioner_profile_revisions (revision_id)
        ON DELETE RESTRICT,
    CONSTRAINT practitioner_review_events_subject_check
        CHECK (
            (subject_type = 'APPLICATION' AND revision_id IS NULL)
            OR (subject_type = 'PROFILE_REVISION' AND revision_id IS NOT NULL)
        ),
    CONSTRAINT practitioner_review_events_action_check
        CHECK (action IN ('APPROVE', 'REQUEST_CHANGES', 'REJECT', 'REVOKE')),
    CONSTRAINT practitioner_review_events_reason_check
        CHECK (reason_code IN (
            'ELIGIBILITY',
            'INCOMPLETE',
            'EVIDENCE',
            'MISREPRESENTATION',
            'HIGH_STAKES_CLAIM',
            'POLICY',
            'OTHER'
        )),
    CONSTRAINT practitioner_review_events_note_check
        CHECK (note IS NULL OR char_length(note) <= 1_000),
    CONSTRAINT practitioner_review_events_version_check
        CHECK (application_version >= 1),
    CONSTRAINT practitioner_review_events_retention_check
        CHECK (purge_eligible_at IS NULL OR purge_eligible_at >= created_at),
    CONSTRAINT practitioner_review_events_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY'))
);

CREATE INDEX practitioner_review_events_application_idx
    ON practitioner_review_events (application_id, created_at ASC, review_event_id ASC);

CREATE FUNCTION reject_practitioner_review_event_update_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Practitioner review events are append-only.'
        USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER practitioner_review_event_update_guard
BEFORE UPDATE ON practitioner_review_events
FOR EACH ROW
EXECUTE FUNCTION reject_practitioner_review_event_update_v1();

CREATE TABLE practitioner_profile_reports (
    report_id TEXT PRIMARY KEY,
    reporter_user_id TEXT,
    practitioner_id TEXT NOT NULL,
    category TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id TEXT,
    purge_eligible_at TIMESTAMPTZ,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT practitioner_profile_reports_reporter_fk
        FOREIGN KEY (reporter_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT practitioner_profile_reports_profile_fk
        FOREIGN KEY (practitioner_id)
        REFERENCES practitioner_profiles (practitioner_id)
        ON DELETE RESTRICT,
    CONSTRAINT practitioner_profile_reports_resolver_fk
        FOREIGN KEY (resolved_by_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT practitioner_profile_reports_category_check
        CHECK (category IN (
            'IMPERSONATION',
            'MISLEADING_CLAIM',
            'PRIVACY',
            'DANGEROUS_OR_HIGH_STAKES_ADVICE',
            'SPAM',
            'OTHER'
        )),
    CONSTRAINT practitioner_profile_reports_state_check
        CHECK (state IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    CONSTRAINT practitioner_profile_reports_details_check
        CHECK (char_length(details) <= 1_000),
    CONSTRAINT practitioner_profile_reports_resolution_check
        CHECK (
            (state = 'OPEN' AND resolved_at IS NULL AND purge_eligible_at IS NULL)
            OR
            (state <> 'OPEN' AND resolved_at IS NOT NULL AND purge_eligible_at IS NOT NULL)
        ),
    CONSTRAINT practitioner_profile_reports_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY'))
);

CREATE UNIQUE INDEX practitioner_profile_reports_active_unique
    ON practitioner_profile_reports (reporter_user_id, practitioner_id)
    WHERE reporter_user_id IS NOT NULL AND state = 'OPEN';

CREATE INDEX practitioner_profile_reports_queue_idx
    ON practitioner_profile_reports (state, created_at ASC, report_id ASC);

CREATE FUNCTION anonymize_practitioner_identity_on_user_delete_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    now_at TIMESTAMPTZ := clock_timestamp();
BEGIN
    UPDATE practitioner_profiles
    SET user_id = NULL,
        profile_status = 'DELETED',
        ended_at = COALESCE(ended_at, now_at),
        updated_at = now_at
    WHERE user_id = OLD.user_id;

    UPDATE practitioner_applications
    SET user_id = NULL,
        account_deleted_at = now_at,
        status = CASE
            WHEN status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
                THEN 'WITHDRAWN'
            ELSE status
        END,
        finalized_at = CASE
            WHEN status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
                THEN now_at
            ELSE finalized_at
        END,
        purge_eligible_at = CASE
            WHEN status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
                THEN now_at + INTERVAL '365 days'
            ELSE purge_eligible_at
        END
    WHERE user_id = OLD.user_id;

    RETURN OLD;
END;
$$;

CREATE TRIGGER users_practitioner_anonymization_guard
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION anonymize_practitioner_identity_on_user_delete_v1();

COMMIT;
