BEGIN;

CREATE TABLE community_profiles (
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT community_profiles_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT community_profiles_display_name_length_check
        CHECK (char_length(display_name) BETWEEN 3 AND 40),
    CONSTRAINT community_profiles_display_name_normalized_check
        CHECK (
            display_name = btrim(display_name)
            AND display_name !~ '[[:cntrl:]]'
        ),
    CONSTRAINT community_profiles_timestamp_check
        CHECK (created_at <= updated_at)
);

CREATE TABLE community_questions (
    question_id TEXT PRIMARY KEY,
    author_user_id TEXT,
    anonymized_author_label TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'VISIBLE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    retention_expires_at TIMESTAMPTZ,
    content_purged_at TIMESTAMPTZ,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT community_questions_author_fk
        FOREIGN KEY (author_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT community_questions_status_check
        CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED')),
    CONSTRAINT community_questions_topic_check
        CHECK (topic_id IN (
            'FOUNDATIONS',
            'CHART_READING',
            'PLANETS_SIGNS_HOUSES',
            'ASPECTS',
            'BIRTH_TIME_AND_CALCULATION',
            'NATALNODE_PRODUCT',
            'OTHER'
        )),
    CONSTRAINT community_questions_title_length_check
        CHECK (
            status = 'DELETED'
            OR char_length(title) BETWEEN 10 AND 180
        ),
    CONSTRAINT community_questions_body_length_check
        CHECK (
            status = 'DELETED'
            OR char_length(body) BETWEEN 20 AND 10000
        ),
    CONSTRAINT community_questions_status_metadata_check
        CHECK (
            (status = 'DELETED' AND deleted_at IS NOT NULL)
            OR (status <> 'DELETED' AND deleted_at IS NULL)
        ),
    CONSTRAINT community_questions_retention_check
        CHECK (
            retention_expires_at IS NULL
            OR deleted_at IS NOT NULL
            AND retention_expires_at >= deleted_at
        ),
    CONSTRAINT community_questions_identity_check
        CHECK (
            (author_user_id IS NOT NULL AND anonymized_author_label IS NULL)
            OR (
                author_user_id IS NULL
                AND anonymized_author_label = 'Deleted User'
            )
        ),
    CONSTRAINT community_questions_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY')),
    CONSTRAINT community_questions_timestamp_check
        CHECK (created_at <= updated_at)
);

CREATE INDEX community_questions_visible_order_idx
    ON community_questions (created_at DESC, question_id DESC)
    WHERE status = 'VISIBLE';

CREATE INDEX community_questions_author_idx
    ON community_questions (author_user_id)
    WHERE author_user_id IS NOT NULL;

CREATE TABLE community_answers (
    answer_id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    author_user_id TEXT,
    anonymized_author_label TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'VISIBLE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    retention_expires_at TIMESTAMPTZ,
    content_purged_at TIMESTAMPTZ,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT community_answers_question_fk
        FOREIGN KEY (question_id)
        REFERENCES community_questions (question_id)
        ON DELETE CASCADE,
    CONSTRAINT community_answers_author_fk
        FOREIGN KEY (author_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT community_answers_status_check
        CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED')),
    CONSTRAINT community_answers_body_length_check
        CHECK (
            status = 'DELETED'
            OR char_length(body) BETWEEN 10 AND 10000
        ),
    CONSTRAINT community_answers_status_metadata_check
        CHECK (
            (status = 'DELETED' AND deleted_at IS NOT NULL)
            OR (status <> 'DELETED' AND deleted_at IS NULL)
        ),
    CONSTRAINT community_answers_retention_check
        CHECK (
            retention_expires_at IS NULL
            OR deleted_at IS NOT NULL
            AND retention_expires_at >= deleted_at
        ),
    CONSTRAINT community_answers_identity_check
        CHECK (
            (author_user_id IS NOT NULL AND anonymized_author_label IS NULL)
            OR (
                author_user_id IS NULL
                AND anonymized_author_label = 'Deleted User'
            )
        ),
    CONSTRAINT community_answers_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY')),
    CONSTRAINT community_answers_timestamp_check
        CHECK (created_at <= updated_at)
);

CREATE INDEX community_answers_question_order_idx
    ON community_answers (question_id, created_at ASC, answer_id ASC)
    WHERE status = 'VISIBLE';

CREATE INDEX community_answers_author_idx
    ON community_answers (author_user_id)
    WHERE author_user_id IS NOT NULL;

CREATE TABLE community_question_acceptances (
    question_id TEXT PRIMARY KEY,
    answer_id TEXT NOT NULL UNIQUE,
    accepted_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT community_acceptances_question_fk
        FOREIGN KEY (question_id)
        REFERENCES community_questions (question_id)
        ON DELETE CASCADE,
    CONSTRAINT community_acceptances_answer_fk
        FOREIGN KEY (answer_id)
        REFERENCES community_answers (answer_id)
        ON DELETE CASCADE
);

CREATE FUNCTION enforce_community_acceptance_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    answer_question_id TEXT;
    answer_status TEXT;
    question_status TEXT;
BEGIN
    SELECT question_id, status
    INTO answer_question_id, answer_status
    FROM community_answers
    WHERE answer_id = NEW.answer_id;

    SELECT status
    INTO question_status
    FROM community_questions
    WHERE question_id = NEW.question_id;

    IF answer_question_id IS DISTINCT FROM NEW.question_id
        OR answer_status IS DISTINCT FROM 'VISIBLE'
        OR question_status IS DISTINCT FROM 'VISIBLE'
    THEN
        RAISE EXCEPTION 'Community accepted answer relationship is invalid.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER community_acceptance_guard
BEFORE INSERT OR UPDATE ON community_question_acceptances
FOR EACH ROW
EXECUTE FUNCTION enforce_community_acceptance_v1();

CREATE FUNCTION clear_community_acceptance_on_visibility_change_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status IN ('HIDDEN', 'DELETED') THEN
        IF TG_TABLE_NAME = 'community_questions' THEN
            DELETE FROM community_question_acceptances
            WHERE question_id = NEW.question_id;
        ELSE
            DELETE FROM community_question_acceptances
            WHERE answer_id = NEW.answer_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER community_question_acceptance_visibility_guard
BEFORE UPDATE OF status ON community_questions
FOR EACH ROW
EXECUTE FUNCTION clear_community_acceptance_on_visibility_change_v1();

CREATE TRIGGER community_answer_acceptance_visibility_guard
BEFORE UPDATE OF status ON community_answers
FOR EACH ROW
EXECUTE FUNCTION clear_community_acceptance_on_visibility_change_v1();

CREATE TABLE community_reports (
    report_id TEXT PRIMARY KEY,
    reporter_user_id TEXT,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    category TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id TEXT,
    retention_expires_at TIMESTAMPTZ,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT community_reports_reporter_fk
        FOREIGN KEY (reporter_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT community_reports_resolver_fk
        FOREIGN KEY (resolved_by_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT community_reports_target_type_check
        CHECK (target_type IN ('QUESTION', 'ANSWER')),
    CONSTRAINT community_reports_category_check
        CHECK (category IN (
            'SPAM',
            'HARASSMENT',
            'HATE_OR_ABUSE',
            'DANGEROUS_OR_HIGH_STAKES_ADVICE',
            'PRIVACY',
            'COPYRIGHT_OR_IP',
            'OTHER'
        )),
    CONSTRAINT community_reports_state_check
        CHECK (state IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    CONSTRAINT community_reports_details_check
        CHECK (char_length(details) <= 1000),
    CONSTRAINT community_reports_resolution_check
        CHECK (
            (state = 'OPEN' AND resolved_at IS NULL AND retention_expires_at IS NULL)
            OR (state <> 'OPEN' AND resolved_at IS NOT NULL AND retention_expires_at IS NOT NULL)
        ),
    CONSTRAINT community_reports_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY')),
    CONSTRAINT community_reports_timestamp_check
        CHECK (resolved_at IS NULL OR created_at <= resolved_at)
);

CREATE UNIQUE INDEX community_reports_active_report_unique
    ON community_reports (reporter_user_id, target_type, target_id)
    WHERE state = 'OPEN' AND reporter_user_id IS NOT NULL;

CREATE INDEX community_reports_queue_idx
    ON community_reports (state, created_at ASC, report_id ASC);

CREATE INDEX community_reports_target_idx
    ON community_reports (target_type, target_id, state);

CREATE TABLE community_moderators (
    user_id TEXT PRIMARY KEY,
    granted_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT community_moderators_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);

CREATE TABLE community_moderation_events (
    moderation_event_id TEXT PRIMARY KEY,
    actor_user_id TEXT,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    retention_expires_at TIMESTAMPTZ NOT NULL,
    retention_hold TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT community_moderation_events_actor_fk
        FOREIGN KEY (actor_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT community_moderation_events_target_type_check
        CHECK (target_type IN ('QUESTION', 'ANSWER')),
    CONSTRAINT community_moderation_events_action_check
        CHECK (action IN ('HIDE', 'RESTORE', 'DELETE', 'DISMISS_REPORT')),
    CONSTRAINT community_moderation_events_reason_check
        CHECK (reason_code IN (
            'SPAM',
            'HARASSMENT',
            'HATE_OR_ABUSE',
            'DANGEROUS_OR_HIGH_STAKES_ADVICE',
            'PRIVACY',
            'COPYRIGHT_OR_IP',
            'DUPLICATE',
            'CONTENT_POLICY',
            'OTHER'
        )),
    CONSTRAINT community_moderation_events_note_check
        CHECK (note IS NULL OR char_length(note) <= 1000),
    CONSTRAINT community_moderation_events_retention_check
        CHECK (retention_expires_at >= created_at),
    CONSTRAINT community_moderation_events_hold_check
        CHECK (retention_hold IN ('NONE', 'LEGAL', 'SECURITY'))
);

CREATE INDEX community_moderation_events_target_idx
    ON community_moderation_events (target_type, target_id, created_at ASC);

CREATE FUNCTION reject_community_moderation_event_update_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Community moderation events are append-only.'
        USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER community_moderation_event_update_guard
BEFORE UPDATE ON community_moderation_events
FOR EACH ROW
EXECUTE FUNCTION reject_community_moderation_event_update_v1();

CREATE FUNCTION anonymize_community_content_on_user_delete_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE community_questions
    SET author_user_id = NULL,
        anonymized_author_label = 'Deleted User'
    WHERE author_user_id = OLD.user_id;

    UPDATE community_answers
    SET author_user_id = NULL,
        anonymized_author_label = 'Deleted User'
    WHERE author_user_id = OLD.user_id;

    RETURN OLD;
END;
$$;

CREATE TRIGGER users_community_anonymization_guard
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION anonymize_community_content_on_user_delete_v1();

COMMIT;
