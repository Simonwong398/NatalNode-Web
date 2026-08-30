CREATE TABLE paid_billing_relationships (
    paid_relationship_id TEXT PRIMARY KEY,
    commercial_authority_id TEXT NOT NULL,
    provider_namespace TEXT,
    provider_context TEXT,
    provider_relationship_ref TEXT,
    billing_interval TEXT NOT NULL,
    lifecycle_state TEXT NOT NULL,
    renewal_intent TEXT NOT NULL DEFAULT 'ENABLED',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    grace_started_at TIMESTAMPTZ,
    grace_until TIMESTAMPTZ,
    failed_renewal_identity TEXT,
    ended_at TIMESTAMPTZ,
    end_reason TEXT,
    last_reconciled_event_id TEXT NOT NULL,
    source_revision BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT paid_billing_relationships_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_billing_relationships_event_fk
        FOREIGN KEY (last_reconciled_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_billing_relationships_id_length_check
        CHECK (
            char_length(paid_relationship_id) BETWEEN 1 AND 256
            AND paid_relationship_id = btrim(paid_relationship_id)
            AND paid_relationship_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_billing_relationships_authority_id_length_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_billing_relationships_provider_namespace_check
        CHECK (
            provider_namespace IS NULL
            OR (
                char_length(provider_namespace) BETWEEN 1 AND 64
                AND provider_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
            )
        ),
    CONSTRAINT paid_billing_relationships_provider_context_check
        CHECK (
            provider_context IS NULL
            OR (
                char_length(provider_context) BETWEEN 1 AND 256
                AND provider_context = btrim(provider_context)
                AND provider_context !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT paid_billing_relationships_provider_ref_check
        CHECK (
            provider_relationship_ref IS NULL
            OR (
                char_length(provider_relationship_ref) BETWEEN 1 AND 256
                AND provider_relationship_ref = btrim(provider_relationship_ref)
                AND provider_relationship_ref !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT paid_billing_relationships_provider_shape_check
        CHECK (
            num_nonnulls(
                provider_namespace,
                provider_context,
                provider_relationship_ref
            ) IN (0, 3)
        ),
    CONSTRAINT paid_billing_relationships_provider_identity_unique
        UNIQUE (
            provider_namespace,
            provider_context,
            provider_relationship_ref
        ),
    CONSTRAINT paid_billing_relationships_authority_identity_unique
        UNIQUE (paid_relationship_id, commercial_authority_id),
    CONSTRAINT paid_billing_relationships_interval_check
        CHECK (billing_interval IN ('MONTHLY', 'ANNUAL')),
    CONSTRAINT paid_billing_relationships_lifecycle_check
        CHECK (
            lifecycle_state IN (
                'PENDING_FIRST_PAYMENT',
                'ACTIVE',
                'RECOVERY_GRACE',
                'ENDED',
                'FIRST_PAYMENT_FAILED'
            )
        ),
    CONSTRAINT paid_billing_relationships_renewal_intent_check
        CHECK (
            renewal_intent IN (
                'ENABLED',
                'CANCEL_AT_PERIOD_END',
                'DISABLED'
            )
        ),
    CONSTRAINT paid_billing_relationships_lifecycle_intent_shape_check
        CHECK (
            (
                lifecycle_state IN ('PENDING_FIRST_PAYMENT', 'FIRST_PAYMENT_FAILED')
                AND renewal_intent = 'ENABLED'
            )
            OR (
                lifecycle_state = 'RECOVERY_GRACE'
                AND renewal_intent = 'ENABLED'
            )
            OR (
                lifecycle_state = 'ENDED'
                AND renewal_intent = 'DISABLED'
            )
            OR lifecycle_state = 'ACTIVE'
        ),
    CONSTRAINT paid_billing_relationships_period_shape_check
        CHECK (
            (
                current_period_start IS NULL
                AND current_period_end IS NULL
            )
            OR (
                current_period_start IS NOT NULL
                AND current_period_end IS NOT NULL
                AND current_period_start < current_period_end
            )
        ),
    CONSTRAINT paid_billing_relationships_active_period_check
        CHECK (
            lifecycle_state NOT IN ('ACTIVE', 'RECOVERY_GRACE')
            OR (
                current_period_start IS NOT NULL
                AND current_period_end IS NOT NULL
            )
        ),
    CONSTRAINT paid_billing_relationships_grace_shape_check
        CHECK (
            (
                lifecycle_state = 'RECOVERY_GRACE'
                AND grace_started_at IS NOT NULL
                AND grace_until IS NOT NULL
                AND grace_until = grace_started_at + INTERVAL '7 days'
            )
            OR (
                lifecycle_state <> 'RECOVERY_GRACE'
                AND grace_started_at IS NULL
                AND grace_until IS NULL
            )
        ),
    CONSTRAINT paid_billing_relationships_failed_renewal_identity_check
        CHECK (
            failed_renewal_identity IS NULL
            OR (
                char_length(failed_renewal_identity) BETWEEN 1 AND 256
                AND failed_renewal_identity = btrim(failed_renewal_identity)
                AND failed_renewal_identity !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT paid_billing_relationships_ended_shape_check
        CHECK (
            (
                lifecycle_state = 'ENDED'
                AND ended_at IS NOT NULL
                AND end_reason IS NOT NULL
            )
            OR (
                lifecycle_state <> 'ENDED'
                AND ended_at IS NULL
                AND end_reason IS NULL
            )
        ),
    CONSTRAINT paid_billing_relationships_end_reason_check
        CHECK (
            end_reason IS NULL
            OR end_reason IN (
                'PERIOD_END',
                'REFUND',
                'CHARGEBACK',
                'REVERSAL',
                'TERMINATION',
                'GRACE_EXPIRED'
            )
        ),
    CONSTRAINT paid_billing_relationships_event_id_length_check
        CHECK (
            char_length(last_reconciled_event_id) BETWEEN 1 AND 256
            AND last_reconciled_event_id = btrim(last_reconciled_event_id)
            AND last_reconciled_event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_billing_relationships_source_revision_check
        CHECK (
            source_revision >= 0
            AND source_revision <= 9223372036854775807
        )
);

CREATE TABLE paid_coverages (
    paid_coverage_id TEXT PRIMARY KEY,
    paid_relationship_id TEXT NOT NULL,
    commercial_authority_id TEXT NOT NULL,
    purchase_namespace TEXT NOT NULL,
    purchase_identity TEXT NOT NULL,
    billing_interval TEXT NOT NULL,
    coverage_start_at TIMESTAMPTZ NOT NULL,
    scheduled_coverage_end_at TIMESTAMPTZ NOT NULL,
    effective_coverage_end_at TIMESTAMPTZ NOT NULL,
    coverage_state TEXT NOT NULL DEFAULT 'VALID',
    success_event_id TEXT NOT NULL,
    reversal_event_id TEXT,
    reversed_at TIMESTAMPTZ,
    reversal_reason TEXT,
    source_revision BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT paid_coverages_relationship_authority_fk
        FOREIGN KEY (paid_relationship_id, commercial_authority_id)
        REFERENCES paid_billing_relationships (
            paid_relationship_id,
            commercial_authority_id
        )
        ON DELETE CASCADE,
    CONSTRAINT paid_coverages_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_coverages_success_event_fk
        FOREIGN KEY (success_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_coverages_reversal_event_fk
        FOREIGN KEY (reversal_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_coverages_purchase_identity_unique
        UNIQUE (
            commercial_authority_id,
            purchase_namespace,
            purchase_identity
        ),
    CONSTRAINT paid_coverages_success_event_unique
        UNIQUE (success_event_id),
    CONSTRAINT paid_coverages_id_length_check
        CHECK (
            char_length(paid_coverage_id) BETWEEN 1 AND 256
            AND paid_coverage_id = btrim(paid_coverage_id)
            AND paid_coverage_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverages_relationship_id_length_check
        CHECK (
            char_length(paid_relationship_id) BETWEEN 1 AND 256
            AND paid_relationship_id = btrim(paid_relationship_id)
            AND paid_relationship_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverages_authority_id_length_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverages_purchase_namespace_check
        CHECK (
            char_length(purchase_namespace) BETWEEN 1 AND 64
            AND purchase_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
        ),
    CONSTRAINT paid_coverages_purchase_identity_check
        CHECK (
            char_length(purchase_identity) BETWEEN 1 AND 256
            AND purchase_identity = btrim(purchase_identity)
            AND purchase_identity !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverages_interval_check
        CHECK (billing_interval IN ('MONTHLY', 'ANNUAL')),
    CONSTRAINT paid_coverages_state_check
        CHECK (coverage_state IN ('VALID', 'ENDED', 'REVERSED')),
    CONSTRAINT paid_coverages_half_open_interval_check
        CHECK (
            coverage_start_at < scheduled_coverage_end_at
            AND effective_coverage_end_at >= coverage_start_at
            AND effective_coverage_end_at <= scheduled_coverage_end_at
        ),
    CONSTRAINT paid_coverages_success_event_id_check
        CHECK (
            char_length(success_event_id) BETWEEN 1 AND 256
            AND success_event_id = btrim(success_event_id)
            AND success_event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverages_reversal_shape_check
        CHECK (
            (
                coverage_state = 'REVERSED'
                AND reversal_event_id IS NOT NULL
                AND reversed_at IS NOT NULL
                AND reversal_reason IS NOT NULL
            )
            OR (
                coverage_state <> 'REVERSED'
                AND reversal_event_id IS NULL
                AND reversed_at IS NULL
                AND reversal_reason IS NULL
            )
        ),
    CONSTRAINT paid_coverages_reversal_event_id_check
        CHECK (
            reversal_event_id IS NULL
            OR (
                char_length(reversal_event_id) BETWEEN 1 AND 256
                AND reversal_event_id = btrim(reversal_event_id)
                AND reversal_event_id !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT paid_coverages_reversal_reason_check
        CHECK (
            reversal_reason IS NULL
            OR reversal_reason IN ('REFUND', 'CHARGEBACK', 'CORRECTION')
        ),
    CONSTRAINT paid_coverages_source_revision_check
        CHECK (
            source_revision >= 0
            AND source_revision <= 9223372036854775807
    )
);

CREATE TABLE paid_coverage_reversal_intents (
    paid_coverage_reversal_id TEXT PRIMARY KEY,
    paid_coverage_id TEXT NOT NULL,
    paid_relationship_id TEXT NOT NULL,
    commercial_authority_id TEXT NOT NULL,
    purchase_namespace TEXT NOT NULL,
    purchase_identity TEXT NOT NULL,
    reversal_event_id TEXT NOT NULL,
    reversed_at TIMESTAMPTZ NOT NULL,
    reversal_reason TEXT NOT NULL,
    effective_coverage_end_at TIMESTAMPTZ NOT NULL,
    source_revision BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT paid_coverage_reversal_intents_relationship_authority_fk
        FOREIGN KEY (paid_relationship_id, commercial_authority_id)
        REFERENCES paid_billing_relationships (
            paid_relationship_id,
            commercial_authority_id
        )
        ON DELETE CASCADE,
    CONSTRAINT paid_coverage_reversal_intents_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_coverage_reversal_intents_event_fk
        FOREIGN KEY (reversal_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE CASCADE,
    CONSTRAINT paid_coverage_reversal_intents_purchase_unique
        UNIQUE (
            commercial_authority_id,
            purchase_namespace,
            purchase_identity
        ),
    CONSTRAINT paid_coverage_reversal_intents_coverage_unique
        UNIQUE (paid_coverage_id),
    CONSTRAINT paid_coverage_reversal_intents_event_unique
        UNIQUE (reversal_event_id),
    CONSTRAINT paid_coverage_reversal_intents_id_length_check
        CHECK (
            char_length(paid_coverage_reversal_id) BETWEEN 1 AND 256
            AND paid_coverage_reversal_id = btrim(paid_coverage_reversal_id)
            AND paid_coverage_reversal_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverage_reversal_intents_coverage_id_length_check
        CHECK (
            char_length(paid_coverage_id) BETWEEN 1 AND 256
            AND paid_coverage_id = btrim(paid_coverage_id)
            AND paid_coverage_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverage_reversal_intents_relationship_id_length_check
        CHECK (
            char_length(paid_relationship_id) BETWEEN 1 AND 256
            AND paid_relationship_id = btrim(paid_relationship_id)
            AND paid_relationship_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverage_reversal_intents_authority_id_length_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverage_reversal_intents_namespace_check
        CHECK (
            char_length(purchase_namespace) BETWEEN 1 AND 64
            AND purchase_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
        ),
    CONSTRAINT paid_coverage_reversal_intents_identity_check
        CHECK (
            char_length(purchase_identity) BETWEEN 1 AND 256
            AND purchase_identity = btrim(purchase_identity)
            AND purchase_identity !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverage_reversal_intents_event_id_check
        CHECK (
            char_length(reversal_event_id) BETWEEN 1 AND 256
            AND reversal_event_id = btrim(reversal_event_id)
            AND reversal_event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT paid_coverage_reversal_intents_reason_check
        CHECK (reversal_reason IN ('REFUND', 'CHARGEBACK', 'CORRECTION')),
    CONSTRAINT paid_coverage_reversal_intents_source_revision_check
        CHECK (
            source_revision >= 0
            AND source_revision <= 9223372036854775807
        )
);

CREATE OR REPLACE FUNCTION enforce_paid_relationship_update_v1()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.paid_relationship_id IS DISTINCT FROM OLD.paid_relationship_id
        OR NEW.commercial_authority_id IS DISTINCT FROM OLD.commercial_authority_id
        OR NEW.provider_namespace IS DISTINCT FROM OLD.provider_namespace
        OR NEW.provider_context IS DISTINCT FROM OLD.provider_context
        OR NEW.provider_relationship_ref IS DISTINCT FROM OLD.provider_relationship_ref
        OR NEW.billing_interval IS DISTINCT FROM OLD.billing_interval
    THEN
        RAISE EXCEPTION 'Paid billing relationship identity is immutable.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.source_revision < OLD.source_revision THEN
        RAISE EXCEPTION 'Paid billing relationship revision cannot move backward.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER paid_billing_relationships_update_guard
BEFORE UPDATE ON paid_billing_relationships
FOR EACH ROW
EXECUTE FUNCTION enforce_paid_relationship_update_v1();

CREATE OR REPLACE FUNCTION enforce_paid_relationship_event_v1()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_event_authority_id TEXT;
    resolved_event_source_type TEXT;
    resolved_event_type TEXT;
BEGIN
    SELECT
        ce.commercial_authority_id,
        ce.source_type,
        ce.event_type
    INTO
        resolved_event_authority_id,
        resolved_event_source_type,
        resolved_event_type
    FROM commercial_events AS ce
    WHERE ce.event_id = NEW.last_reconciled_event_id;

    IF NOT FOUND
        OR resolved_event_authority_id IS DISTINCT FROM NEW.commercial_authority_id
        OR resolved_event_source_type <> 'PAID'
        OR resolved_event_type NOT IN (
            'PAID_RELATIONSHIP_OPENED',
            'PAID_FIRST_PURCHASE_FAILED',
            'PAID_CANCELLATION_SCHEDULED',
            'PAID_RENEWAL_RESTORED',
            'PAID_RELATIONSHIP_ENDED',
            'PAID_PURCHASE_SUCCEEDED',
            'PAID_RENEWAL_SUCCEEDED',
            'PAID_RENEWAL_FAILED',
            'PAID_GRACE_EXPIRED',
            'PAID_COVERAGE_ENDED',
            'PAID_COVERAGE_REFUNDED',
            'PAID_COVERAGE_CHARGEBACKED',
            'COMMERCIAL_CORRECTION_RECORDED'
        )
    THEN
        RAISE EXCEPTION 'Paid billing relationship event provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER paid_billing_relationships_event_guard
BEFORE INSERT OR UPDATE ON paid_billing_relationships
FOR EACH ROW
EXECUTE FUNCTION enforce_paid_relationship_event_v1();

CREATE OR REPLACE FUNCTION enforce_paid_coverage_update_v1()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.paid_coverage_id IS DISTINCT FROM OLD.paid_coverage_id
        OR NEW.paid_relationship_id IS DISTINCT FROM OLD.paid_relationship_id
        OR NEW.commercial_authority_id IS DISTINCT FROM OLD.commercial_authority_id
        OR NEW.purchase_namespace IS DISTINCT FROM OLD.purchase_namespace
        OR NEW.purchase_identity IS DISTINCT FROM OLD.purchase_identity
        OR NEW.billing_interval IS DISTINCT FROM OLD.billing_interval
        OR NEW.coverage_start_at IS DISTINCT FROM OLD.coverage_start_at
        OR NEW.scheduled_coverage_end_at IS DISTINCT FROM OLD.scheduled_coverage_end_at
        OR NEW.success_event_id IS DISTINCT FROM OLD.success_event_id
    THEN
        RAISE EXCEPTION 'Paid coverage source provenance is immutable.'
            USING ERRCODE = '23514';
    END IF;

    IF OLD.coverage_state = 'REVERSED'
        AND (
            NEW.coverage_state IS DISTINCT FROM OLD.coverage_state
            OR NEW.reversal_event_id IS DISTINCT FROM OLD.reversal_event_id
            OR NEW.reversed_at IS DISTINCT FROM OLD.reversed_at
            OR NEW.reversal_reason IS DISTINCT FROM OLD.reversal_reason
            OR NEW.effective_coverage_end_at IS DISTINCT FROM OLD.effective_coverage_end_at
        )
    THEN
        RAISE EXCEPTION 'Paid coverage reversal provenance is immutable.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.source_revision < OLD.source_revision THEN
        RAISE EXCEPTION 'Paid coverage revision cannot move backward.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER paid_coverages_update_guard
BEFORE UPDATE ON paid_coverages
FOR EACH ROW
EXECUTE FUNCTION enforce_paid_coverage_update_v1();

CREATE OR REPLACE FUNCTION enforce_paid_coverage_event_v1()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    success_authority_id TEXT;
    success_source_type TEXT;
    success_event_type TEXT;
    reversal_authority_id TEXT;
    reversal_source_type TEXT;
    reversal_event_type TEXT;
BEGIN
    SELECT
        ce.commercial_authority_id,
        ce.source_type,
        ce.event_type
    INTO
        success_authority_id,
        success_source_type,
        success_event_type
    FROM commercial_events AS ce
    WHERE ce.event_id = NEW.success_event_id;

    IF NOT FOUND
        OR success_authority_id IS DISTINCT FROM NEW.commercial_authority_id
        OR success_source_type <> 'PAID'
        OR success_event_type NOT IN (
            'PAID_PURCHASE_SUCCEEDED',
            'PAID_RENEWAL_SUCCEEDED'
        )
    THEN
        RAISE EXCEPTION 'Paid coverage success provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.reversal_event_id IS NOT NULL THEN
        SELECT
            ce.commercial_authority_id,
            ce.source_type,
            ce.event_type
        INTO
            reversal_authority_id,
            reversal_source_type,
            reversal_event_type
        FROM commercial_events AS ce
        WHERE ce.event_id = NEW.reversal_event_id;

        IF NOT FOUND
            OR reversal_authority_id IS DISTINCT FROM NEW.commercial_authority_id
            OR reversal_source_type <> 'PAID'
            OR reversal_event_type NOT IN (
                'PAID_COVERAGE_REFUNDED',
                'PAID_COVERAGE_CHARGEBACKED',
                'COMMERCIAL_CORRECTION_RECORDED'
            )
        THEN
            RAISE EXCEPTION 'Paid coverage reversal provenance is invalid.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER paid_coverages_event_guard
BEFORE INSERT OR UPDATE ON paid_coverages
FOR EACH ROW
EXECUTE FUNCTION enforce_paid_coverage_event_v1();

CREATE OR REPLACE FUNCTION enforce_paid_coverage_reversal_intent_update_v1()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_event_authority_id TEXT;
    resolved_event_source_type TEXT;
    resolved_event_type TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.paid_coverage_reversal_id IS DISTINCT FROM OLD.paid_coverage_reversal_id
            OR NEW.paid_coverage_id IS DISTINCT FROM OLD.paid_coverage_id
            OR NEW.paid_relationship_id IS DISTINCT FROM OLD.paid_relationship_id
            OR NEW.commercial_authority_id IS DISTINCT FROM OLD.commercial_authority_id
            OR NEW.purchase_namespace IS DISTINCT FROM OLD.purchase_namespace
            OR NEW.purchase_identity IS DISTINCT FROM OLD.purchase_identity
            OR NEW.reversal_event_id IS DISTINCT FROM OLD.reversal_event_id
            OR NEW.reversed_at IS DISTINCT FROM OLD.reversed_at
            OR NEW.reversal_reason IS DISTINCT FROM OLD.reversal_reason
            OR NEW.effective_coverage_end_at IS DISTINCT FROM OLD.effective_coverage_end_at
        THEN
            RAISE EXCEPTION 'Paid coverage reversal intent provenance is immutable.'
                USING ERRCODE = '23514';
        END IF;

        IF NEW.source_revision < OLD.source_revision THEN
            RAISE EXCEPTION 'Paid coverage reversal intent revision cannot move backward.'
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
    WHERE ce.event_id = NEW.reversal_event_id;

    IF NOT FOUND
        OR resolved_event_authority_id IS DISTINCT FROM NEW.commercial_authority_id
        OR resolved_event_source_type <> 'PAID'
        OR resolved_event_type NOT IN (
            'PAID_COVERAGE_REFUNDED',
            'PAID_COVERAGE_CHARGEBACKED',
            'COMMERCIAL_CORRECTION_RECORDED'
        )
    THEN
        RAISE EXCEPTION 'Paid coverage reversal intent provenance is invalid.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER paid_coverage_reversal_intents_update_guard
BEFORE INSERT OR UPDATE ON paid_coverage_reversal_intents
FOR EACH ROW
EXECUTE FUNCTION enforce_paid_coverage_reversal_intent_update_v1();

CREATE INDEX paid_billing_relationships_authority_lookup_idx
    ON paid_billing_relationships (
        commercial_authority_id,
        lifecycle_state,
        paid_relationship_id
    );

CREATE INDEX paid_coverages_relationship_history_idx
    ON paid_coverages (
        commercial_authority_id,
        paid_relationship_id,
        coverage_start_at,
        paid_coverage_id
    );

CREATE INDEX paid_coverages_authority_boundary_idx
    ON paid_coverages (
        commercial_authority_id,
        effective_coverage_end_at,
        paid_coverage_id
    );

CREATE INDEX paid_coverages_reversal_event_idx
    ON paid_coverages (reversal_event_id, paid_coverage_id)
    WHERE reversal_event_id IS NOT NULL;

CREATE INDEX paid_coverage_reversal_intents_relationship_idx
    ON paid_coverage_reversal_intents (
        commercial_authority_id,
        paid_relationship_id,
        paid_coverage_reversal_id
    );

COMMENT ON TABLE paid_billing_relationships IS
    'Provider-neutral normalized Paid relationship source state for later authorization reads.';

COMMENT ON TABLE paid_coverages IS
    'Attributable half-open Paid coverage intervals with source-local reversal provenance.';

COMMENT ON COLUMN paid_coverages.effective_coverage_end_at IS
    'Current attributable end after a source-local reversal; never earlier than coverage_start_at.';

COMMENT ON TABLE paid_coverage_reversal_intents IS
    'Durable source-local reversal intent used when a reversal precedes delayed success attribution.';
