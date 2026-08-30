CREATE TABLE referral_public_identities (
    referral_public_identity_id TEXT PRIMARY KEY,
    commercial_authority_id TEXT NOT NULL,
    public_value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    supersedes_identity_id TEXT,
    CONSTRAINT referral_public_identities_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_public_identities_supersedes_fk
        FOREIGN KEY (supersedes_identity_id)
        REFERENCES referral_public_identities (referral_public_identity_id)
        ON DELETE SET NULL,
    CONSTRAINT referral_public_identities_identity_authority_unique
        UNIQUE (referral_public_identity_id, commercial_authority_id),
    CONSTRAINT referral_public_identities_id_check
        CHECK (
            char_length(referral_public_identity_id) BETWEEN 1 AND 256
            AND referral_public_identity_id = btrim(referral_public_identity_id)
            AND referral_public_identity_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_public_identities_authority_id_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_public_identities_public_value_check
        CHECK (public_value ~ '^nnr_[A-Za-z0-9_-]{43}$'),
    CONSTRAINT referral_public_identities_status_check
        CHECK (status IN ('ACTIVE', 'REVOKED')),
    CONSTRAINT referral_public_identities_lifecycle_check
        CHECK (
            (status = 'ACTIVE' AND revoked_at IS NULL)
            OR (status = 'REVOKED' AND revoked_at IS NOT NULL)
        ),
    CONSTRAINT referral_public_identities_supersedes_self_check
        CHECK (supersedes_identity_id IS NULL OR supersedes_identity_id <> referral_public_identity_id),
    CONSTRAINT referral_public_identities_timestamp_check
        CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE UNIQUE INDEX referral_public_identities_one_active_authority_idx
    ON referral_public_identities (commercial_authority_id)
    WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX referral_public_identities_public_value_unique
    ON referral_public_identities (public_value);

CREATE INDEX referral_public_identities_public_lookup_idx
    ON referral_public_identities (public_value)
    WHERE status = 'ACTIVE';

CREATE OR REPLACE FUNCTION enforce_referral_public_identity_update_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.referral_public_identity_id IS DISTINCT FROM OLD.referral_public_identity_id
        OR NEW.commercial_authority_id IS DISTINCT FROM OLD.commercial_authority_id
        OR NEW.public_value IS DISTINCT FROM OLD.public_value
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
        OR NEW.supersedes_identity_id IS DISTINCT FROM OLD.supersedes_identity_id
    THEN
        RAISE EXCEPTION 'Referral public identity linkage is immutable.'
            USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'REVOKED' AND NEW.status <> 'REVOKED' THEN
        RAISE EXCEPTION 'Revoked referral public identity cannot be reactivated.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.status = 'ACTIVE' AND NEW.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Active referral public identity cannot have a revocation time.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.status = 'REVOKED' AND NEW.revoked_at IS NULL THEN
        RAISE EXCEPTION 'Revoked referral public identity requires a revocation time.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER referral_public_identities_update_guard
BEFORE UPDATE ON referral_public_identities
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_public_identity_update_v1();

CREATE TABLE referral_attributions (
    referral_attribution_id TEXT PRIMARY KEY,
    referral_public_identity_id TEXT NOT NULL,
    referrer_authority_id TEXT NOT NULL,
    referred_authority_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'ATTRIBUTED',
    attributed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_at TIMESTAMPTZ,
    qualifying_paid_coverage_id TEXT,
    invalidation_reason TEXT,
    invalidated_at TIMESTAMPTZ,
    campaign_reference TEXT,
    last_event_id TEXT NOT NULL,
    source_revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT referral_attributions_identity_referrer_fk
        FOREIGN KEY (referral_public_identity_id, referrer_authority_id)
        REFERENCES referral_public_identities (
            referral_public_identity_id,
            commercial_authority_id
        )
        ON DELETE CASCADE,
    CONSTRAINT referral_attributions_referrer_authority_fk
        FOREIGN KEY (referrer_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_attributions_referred_authority_fk
        FOREIGN KEY (referred_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_attributions_qualifying_coverage_fk
        FOREIGN KEY (qualifying_paid_coverage_id)
        REFERENCES paid_coverages (paid_coverage_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_attributions_last_event_fk
        FOREIGN KEY (last_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_attributions_referrer_unique
        UNIQUE (referral_attribution_id, referrer_authority_id),
    CONSTRAINT referral_attributions_referred_unique
        UNIQUE (referred_authority_id),
    CONSTRAINT referral_attributions_coverage_unique
        UNIQUE (qualifying_paid_coverage_id),
    CONSTRAINT referral_attributions_id_check
        CHECK (
            char_length(referral_attribution_id) BETWEEN 1 AND 256
            AND referral_attribution_id = btrim(referral_attribution_id)
            AND referral_attribution_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_attributions_authority_id_check
        CHECK (
            char_length(referrer_authority_id) BETWEEN 1 AND 256
            AND char_length(referred_authority_id) BETWEEN 1 AND 256
            AND referrer_authority_id = btrim(referrer_authority_id)
            AND referred_authority_id = btrim(referred_authority_id)
            AND referrer_authority_id !~ '[[:cntrl:]]'
            AND referred_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_attributions_not_self_check
        CHECK (referrer_authority_id <> referred_authority_id),
    CONSTRAINT referral_attributions_state_check
        CHECK (state IN ('ATTRIBUTED', 'LOCKED', 'INVALIDATED')),
    CONSTRAINT referral_attributions_state_shape_check
        CHECK (
            (
                state = 'ATTRIBUTED'
                AND locked_at IS NULL
                AND qualifying_paid_coverage_id IS NULL
                AND invalidation_reason IS NULL
                AND invalidated_at IS NULL
            )
            OR (
                state = 'LOCKED'
                AND locked_at IS NOT NULL
                AND qualifying_paid_coverage_id IS NOT NULL
                AND invalidation_reason IS NULL
                AND invalidated_at IS NULL
            )
            OR (
                state = 'INVALIDATED'
                AND invalidation_reason IS NOT NULL
                AND invalidated_at IS NOT NULL
                AND (
                    qualifying_paid_coverage_id IS NULL
                    OR locked_at IS NOT NULL
                )
            )
        ),
    CONSTRAINT referral_attributions_coverage_id_check
        CHECK (
            qualifying_paid_coverage_id IS NULL
            OR (
                char_length(qualifying_paid_coverage_id) BETWEEN 1 AND 256
                AND qualifying_paid_coverage_id = btrim(qualifying_paid_coverage_id)
                AND qualifying_paid_coverage_id !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT referral_attributions_reason_check
        CHECK (
            invalidation_reason IS NULL
            OR (
                char_length(invalidation_reason) BETWEEN 1 AND 256
                AND invalidation_reason = btrim(invalidation_reason)
                AND invalidation_reason !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT referral_attributions_campaign_reference_check
        CHECK (
            campaign_reference IS NULL
            OR campaign_reference ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$'
        ),
    CONSTRAINT referral_attributions_last_event_id_check
        CHECK (
            char_length(last_event_id) BETWEEN 1 AND 256
            AND last_event_id = btrim(last_event_id)
            AND last_event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_attributions_revision_check
        CHECK (source_revision >= 0),
    CONSTRAINT referral_attributions_timestamp_check
        CHECK (
            locked_at IS NULL OR locked_at >= attributed_at
        ),
    CONSTRAINT referral_attributions_invalidation_timestamp_check
        CHECK (
            invalidated_at IS NULL OR invalidated_at >= attributed_at
        ),
    CONSTRAINT referral_attributions_updated_timestamp_check
        CHECK (updated_at >= created_at)
);

CREATE INDEX referral_attributions_referrer_lookup_idx
    ON referral_attributions (referrer_authority_id, state, referral_attribution_id);

CREATE INDEX referral_attributions_referred_lookup_idx
    ON referral_attributions (referred_authority_id, state, referral_attribution_id);

CREATE OR REPLACE FUNCTION enforce_referral_attribution_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_identity_authority_id TEXT;
    resolved_identity_status TEXT;
    resolved_event_authority_id TEXT;
    resolved_event_source_type TEXT;
    resolved_event_type TEXT;
    resolved_coverage_authority_id TEXT;
    resolved_coverage_success_event_id TEXT;
    resolved_success_event_authority_id TEXT;
    resolved_success_event_source_type TEXT;
    resolved_success_event_type TEXT;
BEGIN
    IF NEW.referrer_authority_id = NEW.referred_authority_id THEN
        RAISE EXCEPTION 'Referral attribution cannot link an authority to itself.'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.referral_attribution_id IS DISTINCT FROM OLD.referral_attribution_id
            OR NEW.referral_public_identity_id IS DISTINCT FROM OLD.referral_public_identity_id
            OR NEW.referrer_authority_id IS DISTINCT FROM OLD.referrer_authority_id
            OR NEW.referred_authority_id IS DISTINCT FROM OLD.referred_authority_id
            OR NEW.attributed_at IS DISTINCT FROM OLD.attributed_at
            OR NEW.campaign_reference IS DISTINCT FROM OLD.campaign_reference
            OR NEW.created_at IS DISTINCT FROM OLD.created_at
        THEN
            RAISE EXCEPTION 'Referral attribution ownership and linkage are immutable.'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.state = 'LOCKED'
            AND NEW.state NOT IN ('LOCKED', 'INVALIDATED')
        THEN
            RAISE EXCEPTION 'Locked referral attribution cannot be reopened.'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.state = 'INVALIDATED' AND NEW.state <> 'INVALIDATED' THEN
            RAISE EXCEPTION 'Invalidated referral attribution cannot be reactivated.'
                USING ERRCODE = '23514';
        END IF;

        IF NEW.source_revision < OLD.source_revision THEN
            RAISE EXCEPTION 'Referral attribution revision cannot move backward.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        SELECT
            rpi.commercial_authority_id,
            rpi.status
        INTO
            resolved_identity_authority_id,
            resolved_identity_status
        FROM referral_public_identities AS rpi
        WHERE rpi.referral_public_identity_id = NEW.referral_public_identity_id;

        IF NOT FOUND
            OR resolved_identity_authority_id IS DISTINCT FROM NEW.referrer_authority_id
            OR resolved_identity_status <> 'ACTIVE'
        THEN
            RAISE EXCEPTION 'Referral attribution public identity is not active for the referrer.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    SELECT
        ce.commercial_authority_id,
        ce.source_type,
        ce.event_type
    INTO
        resolved_event_authority_id,
        resolved_event_source_type,
        resolved_event_type
    FROM commercial_events AS ce
    WHERE ce.event_id = NEW.last_event_id;

    IF NOT FOUND
        OR resolved_event_authority_id IS DISTINCT FROM NEW.referred_authority_id
        OR resolved_event_source_type <> 'REFERRAL'
        OR resolved_event_type NOT IN (
            'REFERRAL_ATTRIBUTION_RECORDED',
            'REFERRAL_ATTRIBUTION_LOCKED',
            'REFERRAL_ATTRIBUTION_INVALIDATED'
        )
    THEN
        RAISE EXCEPTION 'Referral attribution event provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM commercial_events AS attribution_event
        WHERE attribution_event.event_id = NEW.last_event_id
          AND attribution_event.source_entity_id = NEW.referral_attribution_id
    )
    THEN
        RAISE EXCEPTION 'Referral attribution event identity is invalid.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.qualifying_paid_coverage_id IS NOT NULL THEN
        SELECT
            pc.commercial_authority_id,
            pc.success_event_id,
            success_event.commercial_authority_id,
            success_event.source_type,
            success_event.event_type
        INTO
            resolved_coverage_authority_id,
            resolved_coverage_success_event_id,
            resolved_success_event_authority_id,
            resolved_success_event_source_type,
            resolved_success_event_type
        FROM paid_coverages AS pc
        JOIN commercial_events AS success_event
            ON success_event.event_id = pc.success_event_id
        WHERE pc.paid_coverage_id = NEW.qualifying_paid_coverage_id;

        IF NOT FOUND
            OR resolved_coverage_authority_id IS DISTINCT FROM NEW.referred_authority_id
            OR resolved_success_event_authority_id IS DISTINCT FROM NEW.referred_authority_id
            OR resolved_success_event_source_type <> 'PAID'
            OR resolved_success_event_type <> 'PAID_PURCHASE_SUCCEEDED'
            OR resolved_coverage_success_event_id IS NULL
        THEN
            RAISE EXCEPTION 'Referral qualifying coverage provenance is invalid.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER referral_attributions_update_guard
BEFORE INSERT OR UPDATE ON referral_attributions
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_attribution_v1();

CREATE TABLE referral_rewards (
    referral_reward_id TEXT PRIMARY KEY,
    referrer_authority_id TEXT NOT NULL,
    referral_attribution_id TEXT NOT NULL,
    qualifying_paid_coverage_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'PENDING',
    qualifying_payment_at TIMESTAMPTZ NOT NULL,
    admitted_at TIMESTAMPTZ NOT NULL,
    matures_at TIMESTAMPTZ NOT NULL,
    earned_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    granted_duration_us BIGINT NOT NULL DEFAULT 2592000000000,
    earned_duration_us BIGINT NOT NULL DEFAULT 0,
    applied_duration_us BIGINT NOT NULL DEFAULT 0,
    consumed_duration_us BIGINT NOT NULL DEFAULT 0,
    revoked_duration_us BIGINT NOT NULL DEFAULT 0,
    active_consumption_started_at TIMESTAMPTZ,
    revocation_reason TEXT,
    reversal_event_id TEXT,
    pending_event_id TEXT NOT NULL,
    maturation_event_id TEXT,
    application_event_id TEXT,
    source_revision BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT referral_rewards_referrer_authority_fk
        FOREIGN KEY (referrer_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_attribution_referrer_fk
        FOREIGN KEY (referral_attribution_id, referrer_authority_id)
        REFERENCES referral_attributions (
            referral_attribution_id,
            referrer_authority_id
        )
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_qualifying_coverage_fk
        FOREIGN KEY (qualifying_paid_coverage_id)
        REFERENCES paid_coverages (paid_coverage_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_pending_event_fk
        FOREIGN KEY (pending_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_maturation_event_fk
        FOREIGN KEY (maturation_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_application_event_fk
        FOREIGN KEY (application_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_reversal_event_fk
        FOREIGN KEY (reversal_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT referral_rewards_attribution_unique
        UNIQUE (referral_attribution_id),
    CONSTRAINT referral_rewards_coverage_unique
        UNIQUE (qualifying_paid_coverage_id),
    CONSTRAINT referral_rewards_id_check
        CHECK (
            char_length(referral_reward_id) BETWEEN 1 AND 256
            AND referral_reward_id = btrim(referral_reward_id)
            AND referral_reward_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_rewards_authority_id_check
        CHECK (
            char_length(referrer_authority_id) BETWEEN 1 AND 256
            AND referrer_authority_id = btrim(referrer_authority_id)
            AND referrer_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_rewards_attribution_id_check
        CHECK (
            char_length(referral_attribution_id) BETWEEN 1 AND 256
            AND referral_attribution_id = btrim(referral_attribution_id)
            AND referral_attribution_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_rewards_coverage_id_check
        CHECK (
            char_length(qualifying_paid_coverage_id) BETWEEN 1 AND 256
            AND qualifying_paid_coverage_id = btrim(qualifying_paid_coverage_id)
            AND qualifying_paid_coverage_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT referral_rewards_state_check
        CHECK (state IN ('PENDING', 'EARNED', 'APPLIED', 'REVOKED')),
    CONSTRAINT referral_rewards_maturation_boundary_check
        CHECK (
            matures_at = (
                (
                    (qualifying_payment_at AT TIME ZONE 'UTC')
                    + INTERVAL '14 days'
                ) AT TIME ZONE 'UTC'
            )
            AND matures_at > qualifying_payment_at
        ),
    CONSTRAINT referral_rewards_standard_duration_check
        CHECK (granted_duration_us = 2592000000000),
    CONSTRAINT referral_rewards_duration_non_negative_check
        CHECK (
            earned_duration_us >= 0
            AND applied_duration_us >= 0
            AND consumed_duration_us >= 0
            AND revoked_duration_us >= 0
            AND earned_duration_us <= granted_duration_us
            AND applied_duration_us <= earned_duration_us
            AND consumed_duration_us <= applied_duration_us
            AND consumed_duration_us + revoked_duration_us <= earned_duration_us
        ),
    CONSTRAINT referral_rewards_pending_shape_check
        CHECK (
            state <> 'PENDING'
            OR (
                earned_at IS NULL
                AND applied_at IS NULL
                AND revoked_at IS NULL
                AND earned_duration_us = 0
                AND applied_duration_us = 0
                AND consumed_duration_us = 0
                AND revoked_duration_us = 0
                AND active_consumption_started_at IS NULL
                AND revocation_reason IS NULL
                AND reversal_event_id IS NULL
                AND maturation_event_id IS NULL
                AND application_event_id IS NULL
            )
        ),
    CONSTRAINT referral_rewards_earned_shape_check
        CHECK (
            state <> 'EARNED'
            OR (
                earned_at IS NOT NULL
                AND earned_duration_us = granted_duration_us
                AND applied_at IS NULL
                AND applied_duration_us = 0
                AND consumed_duration_us = 0
                AND revoked_duration_us = 0
                AND active_consumption_started_at IS NULL
                AND revoked_at IS NULL
                AND revocation_reason IS NULL
                AND reversal_event_id IS NULL
                AND maturation_event_id IS NOT NULL
                AND application_event_id IS NULL
            )
        ),
    CONSTRAINT referral_rewards_applied_shape_check
        CHECK (
            state <> 'APPLIED'
            OR (
                earned_at IS NOT NULL
                AND earned_duration_us = granted_duration_us
                AND applied_at IS NOT NULL
                AND applied_duration_us > 0
                AND application_event_id IS NOT NULL
                AND revoked_at IS NULL
                AND revocation_reason IS NULL
                AND reversal_event_id IS NULL
            )
        ),
    CONSTRAINT referral_rewards_revoked_shape_check
        CHECK (
            state <> 'REVOKED'
            OR (
                revoked_at IS NOT NULL
                AND revocation_reason IS NOT NULL
                AND active_consumption_started_at IS NULL
                AND (
                    (
                        earned_duration_us = 0
                        AND earned_at IS NULL
                        AND applied_duration_us = 0
                        AND consumed_duration_us = 0
                        AND revoked_duration_us = 0
                        AND maturation_event_id IS NULL
                    )
                    OR (
                        earned_duration_us = granted_duration_us
                        AND earned_at IS NOT NULL
                        AND maturation_event_id IS NOT NULL
                        AND revoked_duration_us =
                            earned_duration_us - consumed_duration_us
                    )
                )
            )
        ),
    CONSTRAINT referral_rewards_event_id_check
        CHECK (
            char_length(pending_event_id) BETWEEN 1 AND 256
            AND pending_event_id = btrim(pending_event_id)
            AND pending_event_id !~ '[[:cntrl:]]'
            AND (
                maturation_event_id IS NULL
                OR (
                    char_length(maturation_event_id) BETWEEN 1 AND 256
                    AND maturation_event_id = btrim(maturation_event_id)
                    AND maturation_event_id !~ '[[:cntrl:]]'
                )
            )
            AND (
                application_event_id IS NULL
                OR (
                    char_length(application_event_id) BETWEEN 1 AND 256
                    AND application_event_id = btrim(application_event_id)
                    AND application_event_id !~ '[[:cntrl:]]'
                )
            )
            AND (
                reversal_event_id IS NULL
                OR (
                    char_length(reversal_event_id) BETWEEN 1 AND 256
                    AND reversal_event_id = btrim(reversal_event_id)
                    AND reversal_event_id !~ '[[:cntrl:]]'
                )
            )
        ),
    CONSTRAINT referral_rewards_reason_check
        CHECK (
            revocation_reason IS NULL
            OR (
                char_length(revocation_reason) BETWEEN 1 AND 256
                AND revocation_reason = btrim(revocation_reason)
                AND revocation_reason !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT referral_rewards_revision_check
        CHECK (source_revision >= 0),
    CONSTRAINT referral_rewards_timestamp_order_check
        CHECK (
            (earned_at IS NULL OR earned_at >= qualifying_payment_at)
            AND (applied_at IS NULL OR applied_at >= earned_at)
            AND (revoked_at IS NULL OR revoked_at >= qualifying_payment_at)
            AND (
                active_consumption_started_at IS NULL
                OR active_consumption_started_at >= applied_at
            )
            AND updated_at >= created_at
        )
);

CREATE INDEX referral_rewards_referrer_order_idx
    ON referral_rewards (
        referrer_authority_id,
        matures_at,
        earned_at,
        referral_reward_id
    );

CREATE INDEX referral_rewards_cap_window_idx
    ON referral_rewards (
        referrer_authority_id,
        admitted_at,
        referral_reward_id
    );

CREATE INDEX referral_rewards_pending_maturation_idx
    ON referral_rewards (matures_at, referral_reward_id)
    WHERE state = 'PENDING';

CREATE UNIQUE INDEX referral_rewards_one_active_consumption_idx
    ON referral_rewards (referrer_authority_id)
    WHERE state = 'APPLIED'
      AND active_consumption_started_at IS NOT NULL;

CREATE OR REPLACE FUNCTION enforce_referral_reward_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_attribution_referrer_authority_id TEXT;
    resolved_attribution_referred_authority_id TEXT;
    resolved_attribution_coverage_id TEXT;
    resolved_coverage_authority_id TEXT;
    resolved_coverage_success_event_id TEXT;
    resolved_success_event_authority_id TEXT;
    resolved_success_event_source_type TEXT;
    resolved_success_event_type TEXT;
    resolved_success_event_effective_at TIMESTAMPTZ;
    resolved_pending_event_authority_id TEXT;
    resolved_pending_event_source_type TEXT;
    resolved_pending_event_type TEXT;
    resolved_maturation_event_authority_id TEXT;
    resolved_maturation_event_source_type TEXT;
    resolved_maturation_event_type TEXT;
    resolved_reversal_event_authority_id TEXT;
    resolved_reversal_event_source_type TEXT;
    resolved_reversal_event_type TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.state <> 'PENDING' THEN
        RAISE EXCEPTION 'Referral rewards must be created in PENDING state.'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.referral_reward_id IS DISTINCT FROM OLD.referral_reward_id
            OR NEW.referrer_authority_id IS DISTINCT FROM OLD.referrer_authority_id
            OR NEW.referral_attribution_id IS DISTINCT FROM OLD.referral_attribution_id
            OR NEW.qualifying_paid_coverage_id IS DISTINCT FROM OLD.qualifying_paid_coverage_id
            OR NEW.qualifying_payment_at IS DISTINCT FROM OLD.qualifying_payment_at
            OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at
            OR NEW.matures_at IS DISTINCT FROM OLD.matures_at
            OR NEW.granted_duration_us IS DISTINCT FROM OLD.granted_duration_us
            OR NEW.pending_event_id IS DISTINCT FROM OLD.pending_event_id
            OR NEW.created_at IS DISTINCT FROM OLD.created_at
        THEN
            RAISE EXCEPTION 'Referral reward provenance is immutable.'
                USING ERRCODE = '23514';
        END IF;

        IF NEW.source_revision < OLD.source_revision THEN
            RAISE EXCEPTION 'Referral reward revision cannot move backward.'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.state = 'PENDING'
            AND NEW.state NOT IN ('PENDING', 'EARNED', 'REVOKED')
        THEN
            RAISE EXCEPTION 'Pending referral reward cannot skip maturation.'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.state = 'EARNED'
            AND NEW.state NOT IN ('EARNED', 'APPLIED', 'REVOKED')
        THEN
            RAISE EXCEPTION 'Earned referral reward cannot move backward.'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.state = 'APPLIED' AND NEW.state NOT IN ('APPLIED', 'REVOKED') THEN
            RAISE EXCEPTION 'Applied referral reward cannot move backward.'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.state = 'REVOKED' AND NEW.state <> 'REVOKED' THEN
            RAISE EXCEPTION 'Revoked referral reward cannot be reactivated.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    SELECT
        ra.referrer_authority_id,
        ra.referred_authority_id,
        ra.qualifying_paid_coverage_id
    INTO
        resolved_attribution_referrer_authority_id,
        resolved_attribution_referred_authority_id,
        resolved_attribution_coverage_id
    FROM referral_attributions AS ra
    WHERE ra.referral_attribution_id = NEW.referral_attribution_id;

    IF NOT FOUND
        OR resolved_attribution_referrer_authority_id IS DISTINCT FROM NEW.referrer_authority_id
        OR resolved_attribution_coverage_id IS DISTINCT FROM NEW.qualifying_paid_coverage_id
        OR resolved_attribution_referred_authority_id IS NULL
    THEN
        RAISE EXCEPTION 'Referral reward attribution provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    SELECT
        pc.commercial_authority_id,
        pc.success_event_id,
            success_event.commercial_authority_id,
            success_event.source_type,
            success_event.event_type,
            success_event.effective_at
    INTO
        resolved_coverage_authority_id,
        resolved_coverage_success_event_id,
            resolved_success_event_authority_id,
            resolved_success_event_source_type,
            resolved_success_event_type,
            resolved_success_event_effective_at
    FROM paid_coverages AS pc
    JOIN commercial_events AS success_event
        ON success_event.event_id = pc.success_event_id
    WHERE pc.paid_coverage_id = NEW.qualifying_paid_coverage_id;

    IF NOT FOUND
        OR resolved_coverage_authority_id IS DISTINCT FROM resolved_attribution_referred_authority_id
        OR resolved_success_event_authority_id IS DISTINCT FROM resolved_attribution_referred_authority_id
        OR resolved_coverage_success_event_id IS NULL
        OR resolved_success_event_source_type <> 'PAID'
        OR resolved_success_event_type <> 'PAID_PURCHASE_SUCCEEDED'
        OR resolved_success_event_effective_at IS DISTINCT FROM NEW.qualifying_payment_at
    THEN
        RAISE EXCEPTION 'Referral reward qualifying purchase provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    SELECT
        ce.commercial_authority_id,
        ce.source_type,
        ce.event_type
    INTO
        resolved_pending_event_authority_id,
        resolved_pending_event_source_type,
        resolved_pending_event_type
    FROM commercial_events AS ce
    WHERE ce.event_id = NEW.pending_event_id;

    IF NOT FOUND
        OR resolved_pending_event_authority_id IS DISTINCT FROM NEW.referrer_authority_id
        OR resolved_pending_event_source_type <> 'REFERRAL'
        OR resolved_pending_event_type <> 'REFERRAL_REWARD_PENDING'
    THEN
        RAISE EXCEPTION 'Referral reward pending event provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM commercial_events AS pending_event
        WHERE pending_event.event_id = NEW.pending_event_id
          AND pending_event.source_entity_id = NEW.referral_reward_id
    )
    THEN
        RAISE EXCEPTION 'Referral reward pending event identity is invalid.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.maturation_event_id IS NOT NULL THEN
        SELECT
            ce.commercial_authority_id,
            ce.source_type,
            ce.event_type
        INTO
            resolved_maturation_event_authority_id,
            resolved_maturation_event_source_type,
            resolved_maturation_event_type
        FROM commercial_events AS ce
        WHERE ce.event_id = NEW.maturation_event_id;

        IF NOT FOUND
            OR resolved_maturation_event_authority_id IS DISTINCT FROM NEW.referrer_authority_id
            OR resolved_maturation_event_source_type <> 'REFERRAL'
            OR resolved_maturation_event_type <> 'REFERRAL_REWARD_MATURED'
        THEN
            RAISE EXCEPTION 'Referral reward maturation event provenance is invalid.'
                USING ERRCODE = '23514';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM commercial_events AS maturation_event
            WHERE maturation_event.event_id = NEW.maturation_event_id
              AND maturation_event.source_entity_id = NEW.referral_reward_id
        )
        THEN
            RAISE EXCEPTION 'Referral reward maturation event identity is invalid.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    IF NEW.reversal_event_id IS NOT NULL THEN
        SELECT
            ce.commercial_authority_id,
            ce.source_type,
            ce.event_type
        INTO
            resolved_reversal_event_authority_id,
            resolved_reversal_event_source_type,
            resolved_reversal_event_type
        FROM commercial_events AS ce
        WHERE ce.event_id = NEW.reversal_event_id;

        IF NOT FOUND
            OR resolved_reversal_event_authority_id IS DISTINCT FROM resolved_attribution_referred_authority_id
            OR resolved_reversal_event_source_type <> 'PAID'
            OR resolved_reversal_event_type NOT IN (
                'PAID_COVERAGE_REFUNDED',
                'PAID_COVERAGE_CHARGEBACKED',
                'COMMERCIAL_CORRECTION_RECORDED'
            )
        THEN
            RAISE EXCEPTION 'Referral reward reversal event provenance is invalid.'
                USING ERRCODE = '23514';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM paid_coverages AS reversed_coverage
            WHERE reversed_coverage.paid_coverage_id = NEW.qualifying_paid_coverage_id
              AND reversed_coverage.reversal_event_id = NEW.reversal_event_id
        )
        THEN
            RAISE EXCEPTION 'Referral reward reversal is not linked to the qualifying coverage.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER referral_rewards_update_guard
BEFORE INSERT OR UPDATE ON referral_rewards
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_reward_v1();

CREATE OR REPLACE FUNCTION enforce_referral_cap_decision_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM referral_rewards AS rr
        WHERE rr.referral_attribution_id = NEW.source_entity_id
          AND rr.qualifying_paid_coverage_id =
              NEW.attributes ->> 'qualifying_paid_coverage_id'
    )
    THEN
        RAISE EXCEPTION 'Referral cap decision cannot coexist with a reward.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_events_referral_cap_decision_guard
BEFORE INSERT ON commercial_events
FOR EACH ROW
WHEN (
    NEW.source_type = 'REFERRAL'
    AND NEW.event_type = 'REFERRAL_REWARD_CAP_REJECTED'
)
EXECUTE FUNCTION enforce_referral_cap_decision_v1();

CREATE OR REPLACE FUNCTION enforce_referral_reward_cap_exclusion_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM commercial_events AS cap_event
        WHERE cap_event.source_type = 'REFERRAL'
          AND cap_event.event_type = 'REFERRAL_REWARD_CAP_REJECTED'
          AND cap_event.source_entity_id = NEW.referral_attribution_id
          AND cap_event.attributes ->> 'qualifying_paid_coverage_id' =
              NEW.qualifying_paid_coverage_id
    )
    THEN
        RAISE EXCEPTION 'Referral reward cannot coexist with a cap decision.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER referral_rewards_cap_exclusion_guard
BEFORE INSERT OR UPDATE ON referral_rewards
FOR EACH ROW
EXECUTE FUNCTION enforce_referral_reward_cap_exclusion_v1();

COMMENT ON TABLE referral_public_identities IS
    'Opaque, authority-scoped Referral locator; not authentication or entitlement state.';
COMMENT ON TABLE referral_attributions IS
    'Account-level first-valid Referral attribution and qualifying Paid purchase linkage.';
COMMENT ON TABLE referral_rewards IS
    'Provider-neutral Referral Pro-time reward state; D4A does not consume APPLIED time.';
