CREATE TABLE entitlement_projections (
    commercial_authority_id TEXT PRIMARY KEY,
    source_revision BIGINT NOT NULL,
    projection_schema_version INTEGER NOT NULL,
    evaluator_policy_version TEXT NOT NULL,
    projection_status TEXT NOT NULL,
    tier TEXT,
    effective_pro BOOLEAN,
    effective_from TIMESTAMPTZ,
    effective_until TIMESTAMPTZ,
    current_source_classes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    current_source_class TEXT,
    current_source_entity_id TEXT,
    paid_coverage_end_at TIMESTAMPTZ,
    grace_until TIMESTAMPTZ,
    queued_referral_duration_us BIGINT,
    current_referral_reward_id TEXT,
    transition_to_free_at TIMESTAMPTZ,
    ad_free BOOLEAN,
    vault_capacity_class TEXT,
    astrology_alerts_eligibility_class TEXT,
    next_evaluation_at TIMESTAMPTZ,
    computed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT entitlement_projections_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT entitlement_projections_revision_check
        CHECK (source_revision >= 0),
    CONSTRAINT entitlement_projections_schema_version_check
        CHECK (projection_schema_version = 1),
    CONSTRAINT entitlement_projections_evaluator_version_check
        CHECK (
            char_length(evaluator_policy_version) BETWEEN 1 AND 64
            AND evaluator_policy_version = btrim(evaluator_policy_version)
            AND evaluator_policy_version !~ '[[:cntrl:]]'
        ),
    CONSTRAINT entitlement_projections_status_check
        CHECK (projection_status IN ('CURRENT', 'STALE', 'INDETERMINATE')),
    CONSTRAINT entitlement_projections_tier_check
        CHECK (tier IS NULL OR tier IN ('FREE', 'PRO')),
    CONSTRAINT entitlement_projections_source_classes_check
        CHECK (
            cardinality(current_source_classes) BETWEEN 0 AND 5
            AND array_position(current_source_classes, NULL) IS NULL
            AND current_source_classes <@
                ARRAY[
                    'ADMIN_GRANT',
                    'PAID',
                    'PROMOTION',
                    'REFERRAL',
                    'SUPPORT_GRANT'
                ]::TEXT[]
        ),
    CONSTRAINT entitlement_projections_current_source_class_check
        CHECK (
            current_source_class IS NULL
            OR current_source_class IN (
                'ADMIN_GRANT',
                'PAID',
                'PROMOTION',
                'REFERRAL',
                'SUPPORT_GRANT'
            )
        ),
    CONSTRAINT entitlement_projections_current_source_membership_check
        CHECK (
            current_source_class IS NULL
            OR current_source_class = ANY(current_source_classes)
        ),
    CONSTRAINT entitlement_projections_entity_id_check
        CHECK (
            current_source_entity_id IS NULL
            OR (
                char_length(current_source_entity_id) BETWEEN 1 AND 256
                AND current_source_entity_id = btrim(current_source_entity_id)
                AND current_source_entity_id !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT entitlement_projections_queued_referral_duration_check
        CHECK (queued_referral_duration_us IS NULL OR queued_referral_duration_us >= 0),
    CONSTRAINT entitlement_projections_referral_id_check
        CHECK (
            current_referral_reward_id IS NULL
            OR (
                char_length(current_referral_reward_id) BETWEEN 1 AND 256
                AND current_referral_reward_id = btrim(current_referral_reward_id)
                AND current_referral_reward_id !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT entitlement_projections_vault_class_check
        CHECK (
            vault_capacity_class IS NULL
            OR vault_capacity_class IN ('FREE_LIMIT_3', 'PRO_UNLIMITED')
        ),
    CONSTRAINT entitlement_projections_alert_class_check
        CHECK (
            astrology_alerts_eligibility_class IS NULL
            OR astrology_alerts_eligibility_class IN ('ELIGIBLE', 'INELIGIBLE')
        ),
    CONSTRAINT entitlement_projections_time_shape_check
        CHECK (
            (effective_from IS NULL AND effective_until IS NULL)
            OR (
                effective_from IS NOT NULL
                AND effective_until IS NOT NULL
                AND effective_from < effective_until
            )
        ),
    CONSTRAINT entitlement_projections_next_evaluation_shape_check
        CHECK (
            next_evaluation_at IS NULL
            OR next_evaluation_at > computed_at
        ),
    CONSTRAINT entitlement_projections_determination_shape_check
        CHECK (
            (
                projection_status = 'INDETERMINATE'
                AND tier IS NULL
                AND effective_pro IS NULL
                AND effective_from IS NULL
                AND effective_until IS NULL
                AND cardinality(current_source_classes) = 0
                AND current_source_class IS NULL
                AND current_source_entity_id IS NULL
                AND ad_free IS NULL
                AND vault_capacity_class IS NULL
                AND astrology_alerts_eligibility_class IS NULL
            )
            OR (
                projection_status IN ('CURRENT', 'STALE')
                AND tier IS NOT NULL
                AND effective_pro IS NOT NULL
                AND ad_free IS NOT NULL
                AND vault_capacity_class IS NOT NULL
                AND astrology_alerts_eligibility_class IS NOT NULL
                AND (
                    (
                        effective_pro = TRUE
                        AND tier = 'PRO'
                        AND ad_free = TRUE
                        AND vault_capacity_class = 'PRO_UNLIMITED'
                        AND astrology_alerts_eligibility_class = 'ELIGIBLE'
                        AND cardinality(current_source_classes) >= 1
                        AND effective_from IS NOT NULL
                        AND effective_until IS NOT NULL
                    )
                    OR (
                        effective_pro = FALSE
                        AND tier = 'FREE'
                        AND ad_free = FALSE
                        AND vault_capacity_class = 'FREE_LIMIT_3'
                        AND astrology_alerts_eligibility_class = 'INELIGIBLE'
                        AND cardinality(current_source_classes) = 0
                        AND current_source_class IS NULL
                        AND current_source_entity_id IS NULL
                        AND effective_from IS NULL
                        AND effective_until IS NULL
                        AND transition_to_free_at IS NULL
                    )
                )
            )
        ),
    CONSTRAINT entitlement_projections_computed_at_check
        CHECK (computed_at IS NOT NULL)
);

CREATE INDEX entitlement_projections_next_evaluation_idx
    ON entitlement_projections (next_evaluation_at)
    WHERE next_evaluation_at IS NOT NULL;

CREATE FUNCTION enforce_entitlement_projection_revision_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    authority_revision BIGINT;
BEGIN
    SELECT ca.entitlement_revision
    INTO authority_revision
    FROM commercial_authorities AS ca
    WHERE ca.commercial_authority_id = NEW.commercial_authority_id
    FOR KEY SHARE;

    IF authority_revision IS NULL
        OR NEW.source_revision > authority_revision THEN
        RAISE EXCEPTION 'Entitlement projection revision cannot exceed authority revision.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER entitlement_projections_revision_guard
BEFORE INSERT OR UPDATE ON entitlement_projections
FOR EACH ROW
EXECUTE FUNCTION enforce_entitlement_projection_revision_v1();
