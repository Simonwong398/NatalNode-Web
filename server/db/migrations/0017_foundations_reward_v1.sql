CREATE UNIQUE INDEX commercial_authorities_id_owner_unique_v1
    ON commercial_authorities (commercial_authority_id, owner_id);

CREATE TABLE foundations_lesson_completions (
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_version TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT foundations_lesson_completions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT foundations_lesson_completions_identity_pk
        PRIMARY KEY (user_id, course_id, lesson_id),
    CONSTRAINT foundations_lesson_completions_course_check
        CHECK (
            course_id = 'foundations.v1'
            AND course_version = 'v1'
        ),
    CONSTRAINT foundations_lesson_completions_lesson_check
        CHECK (lesson_id IN (
            'foundations.natal_chart',
            'foundations.zodiac_structure',
            'foundations.chart_calculation',
            'foundations.sun_moon',
            'foundations.mercury_venus_mars',
            'foundations.jupiter_saturn_outer_planets',
            'foundations.houses_angles',
            'foundations.planet_sign_house',
            'foundations.aspects',
            'foundations.chart_priorities',
            'foundations.whole_chart',
            'foundations.responsible_astrology'
        )),
    CONSTRAINT foundations_lesson_completions_user_id_check
        CHECK (
            char_length(user_id) BETWEEN 1 AND 256
            AND user_id = btrim(user_id)
            AND user_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_lesson_completions_course_id_check
        CHECK (course_id = btrim(course_id) AND course_id !~ '[[:cntrl:]]'),
    CONSTRAINT foundations_lesson_completions_version_check
        CHECK (course_version = btrim(course_version) AND course_version !~ '[[:cntrl:]]'),
    CONSTRAINT foundations_lesson_completions_lesson_id_check
        CHECK (
            char_length(lesson_id) BETWEEN 1 AND 256
            AND lesson_id = btrim(lesson_id)
            AND lesson_id !~ '[[:cntrl:]]'
        )
);

CREATE INDEX foundations_lesson_completions_course_lookup_idx
    ON foundations_lesson_completions (user_id, course_id, lesson_id);

CREATE FUNCTION reject_foundations_lesson_completion_update_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Foundations lesson completion is append-only.'
        USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER foundations_lesson_completions_update_guard
BEFORE UPDATE ON foundations_lesson_completions
FOR EACH ROW
EXECUTE FUNCTION reject_foundations_lesson_completion_update_v1();

CREATE TABLE foundations_assessment_attempts (
    attempt_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    assessment_revision INTEGER NOT NULL,
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT foundations_assessment_attempts_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT foundations_assessment_attempts_course_check
        CHECK (
            course_id = 'foundations.v1'
            AND assessment_id = 'foundations.v1.final_check'
        ),
    CONSTRAINT foundations_assessment_attempts_revision_check
        CHECK (assessment_revision = 1),
    CONSTRAINT foundations_assessment_attempts_score_check
        CHECK (
            score BETWEEN 0 AND 10
            AND correct_count = score
            AND passed = (score >= 8)
        ),
    CONSTRAINT foundations_assessment_attempts_attempt_id_check
        CHECK (
            char_length(attempt_id) BETWEEN 1 AND 256
            AND attempt_id = btrim(attempt_id)
            AND attempt_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_assessment_attempts_user_id_check
        CHECK (
            char_length(user_id) BETWEEN 1 AND 256
            AND user_id = btrim(user_id)
            AND user_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_assessment_attempts_course_id_check
        CHECK (course_id = btrim(course_id) AND course_id !~ '[[:cntrl:]]'),
    CONSTRAINT foundations_assessment_attempts_assessment_id_check
        CHECK (
            char_length(assessment_id) BETWEEN 1 AND 256
            AND assessment_id = btrim(assessment_id)
            AND assessment_id !~ '[[:cntrl:]]'
        )
);

CREATE INDEX foundations_assessment_attempts_pass_lookup_idx
    ON foundations_assessment_attempts (
        user_id,
        course_id,
        assessment_id,
        passed,
        score DESC,
        created_at DESC,
        attempt_id DESC
    );

CREATE FUNCTION reject_foundations_assessment_attempt_update_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Foundations assessment attempts are append-only.'
        USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER foundations_assessment_attempts_update_guard
BEFORE UPDATE ON foundations_assessment_attempts
FOR EACH ROW
EXECUTE FUNCTION reject_foundations_assessment_attempt_update_v1();

CREATE TABLE commercial_grant_credits (
    grant_credit_id TEXT PRIMARY KEY,
    commercial_authority_id TEXT NOT NULL,
    source_class TEXT NOT NULL,
    source_entity_id TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    source_revision BIGINT NOT NULL,
    event_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT commercial_grant_credits_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT commercial_grant_credits_event_fk
        FOREIGN KEY (
            event_id,
            commercial_authority_id,
            source_class,
            source_entity_id
        )
        REFERENCES commercial_events (
            event_id,
            commercial_authority_id,
            source_type,
            source_entity_id
        )
        ON DELETE CASCADE,
    CONSTRAINT commercial_grant_credits_identity_unique
        UNIQUE (grant_credit_id, commercial_authority_id),
    CONSTRAINT commercial_grant_credits_event_identity_unique
        UNIQUE (event_id, commercial_authority_id, source_class, source_entity_id),
    CONSTRAINT commercial_grant_credits_source_class_check
        CHECK (source_class IN (
            'PAID',
            'REFERRAL',
            'PROMOTION',
            'ADMIN_GRANT',
            'SUPPORT_GRANT'
        )),
    CONSTRAINT commercial_grant_credits_grant_id_check
        CHECK (
            char_length(grant_credit_id) BETWEEN 1 AND 256
            AND grant_credit_id = btrim(grant_credit_id)
            AND grant_credit_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_grant_credits_authority_id_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_grant_credits_source_entity_id_check
        CHECK (
            char_length(source_entity_id) BETWEEN 1 AND 256
            AND source_entity_id = btrim(source_entity_id)
            AND source_entity_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_grant_credits_event_id_check
        CHECK (
            char_length(event_id) BETWEEN 1 AND 256
            AND event_id = btrim(event_id)
            AND event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_grant_credits_interval_check
        CHECK (starts_at < ends_at),
    CONSTRAINT commercial_grant_credits_revision_check
        CHECK (source_revision >= 0)
);

CREATE INDEX commercial_grant_credits_authority_timeline_idx
    ON commercial_grant_credits (commercial_authority_id, starts_at, ends_at, grant_credit_id);

CREATE FUNCTION enforce_commercial_grant_credit_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    authority_revision BIGINT;
    event_authority_id TEXT;
    event_source_type TEXT;
    event_source_entity_id TEXT;
    event_type TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Commercial grant credits are append-only.'
            USING ERRCODE = '23514';
    END IF;

    SELECT ca.entitlement_revision
    INTO authority_revision
    FROM commercial_authorities AS ca
    WHERE ca.commercial_authority_id = NEW.commercial_authority_id
    FOR KEY SHARE;

    IF authority_revision IS NULL
        OR NEW.source_revision > authority_revision + 1 THEN
        RAISE EXCEPTION 'Commercial grant credit revision is invalid.'
            USING ERRCODE = '23514';
    END IF;

    SELECT
        ce.commercial_authority_id,
        ce.source_type,
        ce.source_entity_id,
        ce.event_type
    INTO
        event_authority_id,
        event_source_type,
        event_source_entity_id,
        event_type
    FROM commercial_events AS ce
    WHERE ce.event_id = NEW.event_id;

    IF event_authority_id IS DISTINCT FROM NEW.commercial_authority_id
        OR event_source_type IS DISTINCT FROM NEW.source_class
        OR event_source_entity_id IS DISTINCT FROM NEW.source_entity_id
        OR event_type IS DISTINCT FROM 'GRANT_ISSUED'
    THEN
        RAISE EXCEPTION 'Commercial grant credit event provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_grant_credits_guard
BEFORE INSERT OR UPDATE ON commercial_grant_credits
FOR EACH ROW
EXECUTE FUNCTION enforce_commercial_grant_credit_v1();

CREATE TABLE foundations_reward_grants (
    reward_grant_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    commercial_authority_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    reward_source TEXT NOT NULL,
    duration_us BIGINT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    commercial_grant_credit_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT foundations_reward_grants_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT foundations_reward_grants_authority_owner_fk
        FOREIGN KEY (commercial_authority_id, user_id)
        REFERENCES commercial_authorities (commercial_authority_id, owner_id)
        ON DELETE CASCADE,
    CONSTRAINT foundations_reward_grants_credit_fk
        FOREIGN KEY (commercial_grant_credit_id, commercial_authority_id)
        REFERENCES commercial_grant_credits (grant_credit_id, commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT foundations_reward_grants_event_fk
        FOREIGN KEY (event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT foundations_reward_grants_user_course_unique
        UNIQUE (user_id, course_id),
    CONSTRAINT foundations_reward_grants_credit_unique
        UNIQUE (commercial_grant_credit_id),
    CONSTRAINT foundations_reward_grants_event_unique
        UNIQUE (event_id),
    CONSTRAINT foundations_reward_grants_course_check
        CHECK (course_id = 'foundations.v1'),
    CONSTRAINT foundations_reward_grants_source_check
        CHECK (reward_source = 'LEARNING_FOUNDATIONS_V1'),
    CONSTRAINT foundations_reward_grants_duration_check
        CHECK (
            duration_us = 604800000000
            AND expires_at = starts_at + INTERVAL '168 hours'
        ),
    CONSTRAINT foundations_reward_grants_time_check
        CHECK (granted_at <= starts_at AND starts_at < expires_at),
    CONSTRAINT foundations_reward_grants_reward_id_check
        CHECK (
            char_length(reward_grant_id) BETWEEN 1 AND 256
            AND reward_grant_id = btrim(reward_grant_id)
            AND reward_grant_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_reward_grants_user_id_check
        CHECK (
            char_length(user_id) BETWEEN 1 AND 256
            AND user_id = btrim(user_id)
            AND user_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_reward_grants_authority_id_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_reward_grants_credit_id_check
        CHECK (
            char_length(commercial_grant_credit_id) BETWEEN 1 AND 256
            AND commercial_grant_credit_id = btrim(commercial_grant_credit_id)
            AND commercial_grant_credit_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT foundations_reward_grants_event_id_check
        CHECK (
            char_length(event_id) BETWEEN 1 AND 256
            AND event_id = btrim(event_id)
            AND event_id !~ '[[:cntrl:]]'
        )
);

CREATE INDEX foundations_reward_grants_authority_lookup_idx
    ON foundations_reward_grants (commercial_authority_id, course_id, reward_grant_id);

CREATE FUNCTION enforce_foundations_reward_grant_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    credit_authority_id TEXT;
    credit_source_class TEXT;
    credit_source_entity_id TEXT;
    credit_starts_at TIMESTAMPTZ;
    credit_ends_at TIMESTAMPTZ;
    credit_event_id TEXT;
    event_authority_id TEXT;
    event_source_type TEXT;
    event_source_entity_id TEXT;
    event_type TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Foundations reward grants are append-only.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.reward_grant_id IS DISTINCT FROM NEW.commercial_grant_credit_id THEN
        RAISE EXCEPTION 'Foundations reward grant identity is invalid.'
            USING ERRCODE = '23514';
    END IF;

    SELECT
        cgc.commercial_authority_id,
        cgc.source_class,
        cgc.source_entity_id,
        cgc.starts_at,
        cgc.ends_at,
        cgc.event_id
    INTO
        credit_authority_id,
        credit_source_class,
        credit_source_entity_id,
        credit_starts_at,
        credit_ends_at,
        credit_event_id
    FROM commercial_grant_credits AS cgc
    WHERE cgc.grant_credit_id = NEW.commercial_grant_credit_id;

    IF credit_authority_id IS DISTINCT FROM NEW.commercial_authority_id
        OR credit_source_class IS DISTINCT FROM 'PROMOTION'
        OR credit_source_entity_id IS DISTINCT FROM NEW.reward_grant_id
        OR credit_starts_at IS DISTINCT FROM NEW.starts_at
        OR credit_ends_at IS DISTINCT FROM NEW.expires_at
        OR credit_event_id IS DISTINCT FROM NEW.event_id
    THEN
        RAISE EXCEPTION 'Foundations reward grant credit provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    SELECT
        ce.commercial_authority_id,
        ce.source_type,
        ce.source_entity_id,
        ce.event_type
    INTO
        event_authority_id,
        event_source_type,
        event_source_entity_id,
        event_type
    FROM commercial_events AS ce
    WHERE ce.event_id = NEW.event_id;

    IF event_authority_id IS DISTINCT FROM NEW.commercial_authority_id
        OR event_source_type IS DISTINCT FROM 'PROMOTION'
        OR event_source_entity_id IS DISTINCT FROM NEW.reward_grant_id
        OR event_type IS DISTINCT FROM 'GRANT_ISSUED'
    THEN
        RAISE EXCEPTION 'Foundations reward grant event provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER foundations_reward_grants_guard
BEFORE INSERT OR UPDATE ON foundations_reward_grants
FOR EACH ROW
EXECUTE FUNCTION enforce_foundations_reward_grant_v1();

COMMENT ON TABLE foundations_lesson_completions IS
    'Server-authoritative monotonic Foundations V1 semantic lesson completion; no localized prose or chart data.';
COMMENT ON TABLE foundations_assessment_attempts IS
    'Append-only server-scored Foundations V1 assessment attempts; PASS-EVER is derived from these rows.';
COMMENT ON TABLE commercial_grant_credits IS
    'Provider-neutral finite commercial coverage credits consumed by the canonical entitlement evaluator.';
COMMENT ON TABLE foundations_reward_grants IS
    'One account-scoped Foundations V1 reward ledger row linked to the canonical Commercial grant credit.';
