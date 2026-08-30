ALTER TABLE referral_rewards
    ADD CONSTRAINT referral_rewards_identity_authority_unique
    UNIQUE (referral_reward_id, referrer_authority_id);

CREATE TABLE referral_consumption_segments (
    referral_consumption_segment_id TEXT PRIMARY KEY,
    commercial_authority_id TEXT NOT NULL,
    referral_reward_id TEXT NOT NULL,
    consumed_from TIMESTAMPTZ NOT NULL,
    consumed_until TIMESTAMPTZ NOT NULL,
    consumed_duration_us BIGINT NOT NULL,
    source_revision BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT referral_consumption_segments_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_consumption_segments_reward_authority_fk
        FOREIGN KEY (referral_reward_id, commercial_authority_id)
        REFERENCES referral_rewards (
            referral_reward_id,
            referrer_authority_id
        )
        ON DELETE CASCADE,
    CONSTRAINT referral_consumption_segments_id_check
        CHECK (
            char_length(referral_consumption_segment_id) BETWEEN 1 AND 256
            AND referral_consumption_segment_id = btrim(referral_consumption_segment_id)
            AND referral_consumption_segment_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_consumption_segments_authority_id_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_consumption_segments_reward_id_check
        CHECK (
            char_length(referral_reward_id) BETWEEN 1 AND 256
            AND referral_reward_id = btrim(referral_reward_id)
            AND referral_reward_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_consumption_segments_half_open_check
        CHECK (consumed_from < consumed_until),
    CONSTRAINT referral_consumption_segments_duration_check
        CHECK (
            consumed_duration_us > 0
            AND consumed_duration_us =
                (EXTRACT(EPOCH FROM (consumed_until - consumed_from)) * 1000000)::BIGINT
        ),
    CONSTRAINT referral_consumption_segments_revision_check
        CHECK (source_revision >= 0)
);

CREATE UNIQUE INDEX referral_consumption_segments_identity_idx
    ON referral_consumption_segments (
        commercial_authority_id,
        referral_reward_id,
        consumed_from,
        consumed_until
    );

CREATE INDEX referral_consumption_segments_authority_timeline_idx
    ON referral_consumption_segments (
        commercial_authority_id,
        consumed_from,
        consumed_until,
        referral_consumption_segment_id
    );

CREATE INDEX referral_consumption_segments_reward_timeline_idx
    ON referral_consumption_segments (
        referral_reward_id,
        consumed_from,
        consumed_until,
        referral_consumption_segment_id
    );

CREATE OR REPLACE FUNCTION enforce_referral_consumption_segment_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_authority_revision BIGINT;
BEGIN
    SELECT ca.entitlement_revision
    INTO resolved_authority_revision
    FROM commercial_authorities AS ca
    WHERE ca.commercial_authority_id = NEW.commercial_authority_id
    FOR KEY SHARE;

    IF NOT FOUND OR (
        NEW.source_revision > resolved_authority_revision
        AND NEW.source_revision - resolved_authority_revision > 1
    ) THEN
        RAISE EXCEPTION 'Referral consumption segment revision is invalid.'
            USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM referral_consumption_segments AS existing_segment
        WHERE existing_segment.commercial_authority_id = NEW.commercial_authority_id
          AND existing_segment.referral_consumption_segment_id <>
              NEW.referral_consumption_segment_id
          AND existing_segment.consumed_from < NEW.consumed_until
          AND NEW.consumed_from < existing_segment.consumed_until
    ) THEN
        RAISE EXCEPTION 'Referral consumption segments cannot overlap.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER referral_consumption_segments_guard
BEFORE INSERT OR UPDATE ON referral_consumption_segments
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_consumption_segment_v1();

CREATE OR REPLACE FUNCTION enforce_referral_consumption_totals_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected_reward_id TEXT;
    persisted_consumed_duration_us BIGINT;
    segment_consumed_duration_us BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        affected_reward_id := OLD.referral_reward_id;
    ELSE
        affected_reward_id := NEW.referral_reward_id;
    END IF;

    SELECT rr.consumed_duration_us
    INTO persisted_consumed_duration_us
    FROM referral_rewards AS rr
    WHERE rr.referral_reward_id = affected_reward_id;

    IF NOT FOUND THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    SELECT COALESCE(SUM(rcs.consumed_duration_us), 0)::BIGINT
    INTO segment_consumed_duration_us
    FROM referral_consumption_segments AS rcs
    WHERE rcs.referral_reward_id = affected_reward_id;

    IF persisted_consumed_duration_us IS DISTINCT FROM segment_consumed_duration_us THEN
        RAISE EXCEPTION 'Referral reward consumed duration must equal its segment total.'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER referral_consumption_segments_totals_guard
AFTER INSERT OR UPDATE OR DELETE ON referral_consumption_segments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_consumption_totals_v1();

CREATE CONSTRAINT TRIGGER referral_rewards_consumption_totals_guard
AFTER UPDATE OF consumed_duration_us ON referral_rewards
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_consumption_totals_v1();

CREATE OR REPLACE FUNCTION enforce_referral_reward_application_event_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_event_authority_id TEXT;
    resolved_event_source_type TEXT;
    resolved_event_type TEXT;
    resolved_event_source_entity_id TEXT;
BEGIN
    IF TG_OP = 'UPDATE'
        AND OLD.application_event_id IS NOT NULL
        AND NEW.application_event_id IS DISTINCT FROM OLD.application_event_id
    THEN
        RAISE EXCEPTION 'Referral reward application provenance is immutable.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.application_event_id IS NOT NULL THEN
        SELECT
            ce.commercial_authority_id,
            ce.source_type,
            ce.event_type,
            ce.source_entity_id
        INTO
            resolved_event_authority_id,
            resolved_event_source_type,
            resolved_event_type,
            resolved_event_source_entity_id
        FROM commercial_events AS ce
        WHERE ce.event_id = NEW.application_event_id;

        IF NOT FOUND
            OR resolved_event_authority_id IS DISTINCT FROM NEW.referrer_authority_id
            OR resolved_event_source_type <> 'REFERRAL'
            OR resolved_event_type <> 'REFERRAL_REWARD_APPLIED'
            OR resolved_event_source_entity_id IS DISTINCT FROM NEW.referral_reward_id
        THEN
            RAISE EXCEPTION 'Referral reward application event provenance is invalid.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER referral_rewards_application_event_guard
BEFORE INSERT OR UPDATE ON referral_rewards
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_reward_application_event_v1();

COMMENT ON TABLE referral_consumption_segments IS
    'Rebuildable, current-authority Referral supply intervals used for exact Paid-precedence correction and deterministic reward replay.';

COMMENT ON COLUMN referral_consumption_segments.consumed_duration_us IS
    'Exact elapsed microseconds for the half-open interval; never signed debt.';

COMMENT ON TABLE referral_rewards IS
    'Provider-neutral Referral Pro-time reward state with D4B time-bank consumption aggregates.';
