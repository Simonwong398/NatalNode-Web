CREATE TABLE commercial_authorities (
    commercial_authority_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    entitlement_revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT commercial_authorities_owner_fk
        FOREIGN KEY (owner_id)
        REFERENCES users (user_id)
        ON DELETE RESTRICT,
    CONSTRAINT commercial_authorities_owner_unique
        UNIQUE (owner_id),
    CONSTRAINT commercial_authorities_id_length_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_authorities_owner_id_length_check
        CHECK (
            char_length(owner_id) BETWEEN 1 AND 256
            AND owner_id = btrim(owner_id)
            AND owner_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_authorities_revision_check
        CHECK (entitlement_revision >= 0),
    CONSTRAINT commercial_authorities_timestamps_check
        CHECK (updated_at >= created_at)
);

CREATE FUNCTION enforce_commercial_authority_update_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.commercial_authority_id <> OLD.commercial_authority_id
        OR NEW.owner_id <> OLD.owner_id THEN
        RAISE EXCEPTION 'Commercial authority identity is immutable.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.entitlement_revision <> OLD.entitlement_revision + 1 THEN
        RAISE EXCEPTION 'Commercial authority revision must advance by one.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.updated_at < OLD.updated_at THEN
        RAISE EXCEPTION 'Commercial authority update time cannot move backward.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_authorities_update_guard
BEFORE UPDATE ON commercial_authorities
FOR EACH ROW
EXECUTE FUNCTION enforce_commercial_authority_update_v1();

CREATE TABLE provider_ingestion_receipts (
    provider_receipt_id TEXT PRIMARY KEY,
    provider_namespace TEXT NOT NULL,
    provider_context TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    processing_status TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    normalized_event_type TEXT,
    operation_digest TEXT NOT NULL,
    failure_class TEXT,
    processed_at TIMESTAMPTZ,
    reconciled_at TIMESTAMPTZ,
    CONSTRAINT provider_ingestion_receipts_provider_identity_unique
        UNIQUE (provider_namespace, provider_context, provider_event_id),
    CONSTRAINT provider_ingestion_receipts_link_identity_unique
        UNIQUE (
            provider_receipt_id,
            provider_namespace,
            provider_context,
            provider_event_id
        ),
    CONSTRAINT provider_ingestion_receipts_id_length_check
        CHECK (
            char_length(provider_receipt_id) BETWEEN 1 AND 256
            AND provider_receipt_id = btrim(provider_receipt_id)
            AND provider_receipt_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT provider_ingestion_receipts_namespace_check
        CHECK (
            char_length(provider_namespace) BETWEEN 1 AND 64
            AND provider_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
        ),
    CONSTRAINT provider_ingestion_receipts_context_check
        CHECK (
            char_length(provider_context) BETWEEN 1 AND 256
            AND provider_context = btrim(provider_context)
            AND provider_context !~ '[[:cntrl:]]'
        ),
    CONSTRAINT provider_ingestion_receipts_event_id_check
        CHECK (
            char_length(provider_event_id) BETWEEN 1 AND 512
            AND provider_event_id = btrim(provider_event_id)
            AND provider_event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT provider_ingestion_receipts_verification_status_check
        CHECK (verification_status IN ('VERIFIED', 'REJECTED', 'INDETERMINATE')),
    CONSTRAINT provider_ingestion_receipts_processing_status_check
        CHECK (processing_status IN (
            'PENDING',
            'PROCESSED',
            'RECONCILIATION_PENDING',
            'FAILED_TERMINAL'
        )),
    CONSTRAINT provider_ingestion_receipts_event_type_check
        CHECK (
            normalized_event_type IS NULL
            OR normalized_event_type IN (
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
                'REFERRAL_ATTRIBUTION_RECORDED',
                'REFERRAL_ATTRIBUTION_LOCKED',
                'REFERRAL_ATTRIBUTION_INVALIDATED',
                'REFERRAL_REWARD_PENDING',
                'REFERRAL_REWARD_CAP_REJECTED',
                'REFERRAL_REWARD_MATURED',
                'REFERRAL_REWARD_APPLIED',
                'REFERRAL_REWARD_CONSUMPTION_STARTED',
                'REFERRAL_REWARD_EXHAUSTED',
                'REFERRAL_REWARD_REVOKED',
                'GRANT_ISSUED',
                'GRANT_ACTIVATED',
                'GRANT_EXPIRED',
                'GRANT_EXHAUSTED',
                'GRANT_REVOKED',
                'COMMERCIAL_CORRECTION_RECORDED'
            )
        ),
    CONSTRAINT provider_ingestion_receipts_digest_check
        CHECK (operation_digest ~ '^[0-9a-f]{64}$'),
    CONSTRAINT provider_ingestion_receipts_failure_class_check
        CHECK (
            failure_class IS NULL
            OR failure_class IN (
                'VERIFICATION',
                'ASSOCIATION',
                'NORMALIZATION',
                'RECONCILIATION',
                'PERSISTENCE'
            )
        ),
    CONSTRAINT provider_ingestion_receipts_attempt_count_check
        CHECK (attempt_count BETWEEN 1 AND 2147483647),
    CONSTRAINT provider_ingestion_receipts_timestamp_order_check
        CHECK (
            last_seen_at >= first_seen_at
            AND (processed_at IS NULL OR processed_at >= first_seen_at)
            AND (reconciled_at IS NULL OR reconciled_at >= first_seen_at)
        ),
    CONSTRAINT provider_ingestion_receipts_verification_shape_check
        CHECK (
            (verification_status = 'VERIFIED')
            OR (
                verification_status = 'REJECTED'
                AND processing_status = 'FAILED_TERMINAL'
                AND failure_class = 'VERIFICATION'
                AND normalized_event_type IS NULL
            )
            OR (
                verification_status = 'INDETERMINATE'
                AND processing_status = 'PENDING'
                AND failure_class = 'VERIFICATION'
                AND normalized_event_type IS NULL
            )
        ),
    CONSTRAINT provider_ingestion_receipts_processing_shape_check
        CHECK (
            (
                processing_status = 'PENDING'
                AND processed_at IS NULL
                AND reconciled_at IS NULL
                AND normalized_event_type IS NULL
                AND (
                    failure_class IS NULL
                    OR failure_class = 'VERIFICATION'
                )
            )
            OR (
                processing_status = 'PROCESSED'
                AND verification_status = 'VERIFIED'
                AND normalized_event_type IS NOT NULL
                AND failure_class IS NULL
                AND processed_at IS NOT NULL
            )
            OR (
                processing_status = 'RECONCILIATION_PENDING'
                AND verification_status = 'VERIFIED'
                AND normalized_event_type IS NOT NULL
                AND failure_class IN ('ASSOCIATION', 'RECONCILIATION')
                AND processed_at IS NULL
                AND reconciled_at IS NULL
            )
            OR (
                processing_status = 'FAILED_TERMINAL'
                AND failure_class IS NOT NULL
                AND processed_at IS NULL
                AND reconciled_at IS NULL
            )
        )
);

CREATE TABLE commercial_events (
    event_id TEXT PRIMARY KEY,
    commercial_authority_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_entity_id TEXT NOT NULL,
    source_namespace TEXT NOT NULL,
    provider_namespace TEXT,
    provider_context TEXT,
    provider_event_id TEXT,
    provider_receipt_id TEXT,
    idempotency_namespace TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    operation_digest TEXT NOT NULL,
    occurred_at TIMESTAMPTZ,
    effective_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    caused_by_event_id TEXT,
    corrects_event_id TEXT,
    reverses_event_id TEXT,
    attributes JSONB NOT NULL,
    attributes_version INTEGER NOT NULL,
    schema_version INTEGER NOT NULL,
    actor_class TEXT,
    actor_reference TEXT,
    CONSTRAINT commercial_events_authority_fk
        FOREIGN KEY (commercial_authority_id)
        REFERENCES commercial_authorities (commercial_authority_id)
        ON DELETE CASCADE,
    CONSTRAINT commercial_events_provider_receipt_fk
        FOREIGN KEY (
            provider_receipt_id,
            provider_namespace,
            provider_context,
            provider_event_id
        )
        REFERENCES provider_ingestion_receipts (
            provider_receipt_id,
            provider_namespace,
            provider_context,
            provider_event_id
        )
        MATCH FULL,
    CONSTRAINT commercial_events_caused_by_fk
        FOREIGN KEY (caused_by_event_id)
        REFERENCES commercial_events (event_id)
        ON DELETE SET NULL
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT commercial_events_source_identity_unique
        UNIQUE (
            event_id,
            commercial_authority_id,
            source_type,
            source_entity_id
        ),
    CONSTRAINT commercial_events_corrects_source_fk
        FOREIGN KEY (
            corrects_event_id,
            commercial_authority_id,
            source_type,
            source_entity_id
        )
        REFERENCES commercial_events (
            event_id,
            commercial_authority_id,
            source_type,
            source_entity_id
        )
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT commercial_events_reverses_source_fk
        FOREIGN KEY (
            reverses_event_id,
            commercial_authority_id,
            source_type,
            source_entity_id
        )
        REFERENCES commercial_events (
            event_id,
            commercial_authority_id,
            source_type,
            source_entity_id
        )
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT commercial_events_business_idempotency_unique
        UNIQUE (idempotency_namespace, idempotency_key),
    CONSTRAINT commercial_events_event_id_length_check
        CHECK (
            char_length(event_id) BETWEEN 1 AND 256
            AND event_id = btrim(event_id)
            AND event_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_events_authority_id_length_check
        CHECK (
            char_length(commercial_authority_id) BETWEEN 1 AND 256
            AND commercial_authority_id = btrim(commercial_authority_id)
            AND commercial_authority_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_events_event_type_check
        CHECK (event_type IN (
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
            'REFERRAL_ATTRIBUTION_RECORDED',
            'REFERRAL_ATTRIBUTION_LOCKED',
            'REFERRAL_ATTRIBUTION_INVALIDATED',
            'REFERRAL_REWARD_PENDING',
            'REFERRAL_REWARD_CAP_REJECTED',
            'REFERRAL_REWARD_MATURED',
            'REFERRAL_REWARD_APPLIED',
            'REFERRAL_REWARD_CONSUMPTION_STARTED',
            'REFERRAL_REWARD_EXHAUSTED',
            'REFERRAL_REWARD_REVOKED',
            'GRANT_ISSUED',
            'GRANT_ACTIVATED',
            'GRANT_EXPIRED',
            'GRANT_EXHAUSTED',
            'GRANT_REVOKED',
            'COMMERCIAL_CORRECTION_RECORDED'
        )),
    CONSTRAINT commercial_events_source_type_check
        CHECK (source_type IN (
            'PAID',
            'REFERRAL',
            'PROMOTION',
            'ADMIN_GRANT',
            'SUPPORT_GRANT'
        )),
    CONSTRAINT commercial_events_source_entity_id_check
        CHECK (
            char_length(source_entity_id) BETWEEN 1 AND 256
            AND source_entity_id = btrim(source_entity_id)
            AND source_entity_id !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_events_source_namespace_check
        CHECK (
            char_length(source_namespace) BETWEEN 1 AND 64
            AND source_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
        ),
    CONSTRAINT commercial_events_provider_namespace_check
        CHECK (
            provider_namespace IS NULL
            OR (
                char_length(provider_namespace) BETWEEN 1 AND 64
                AND provider_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
            )
        ),
    CONSTRAINT commercial_events_provider_context_check
        CHECK (
            provider_context IS NULL
            OR (
                char_length(provider_context) BETWEEN 1 AND 256
                AND provider_context = btrim(provider_context)
                AND provider_context !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT commercial_events_provider_event_id_check
        CHECK (
            provider_event_id IS NULL
            OR (
                char_length(provider_event_id) BETWEEN 1 AND 512
                AND provider_event_id = btrim(provider_event_id)
                AND provider_event_id !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT commercial_events_provider_receipt_id_check
        CHECK (
            provider_receipt_id IS NULL
            OR (
                char_length(provider_receipt_id) BETWEEN 1 AND 256
                AND provider_receipt_id = btrim(provider_receipt_id)
                AND provider_receipt_id !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT commercial_events_provider_shape_check
        CHECK (
            num_nonnulls(
                provider_namespace,
                provider_context,
                provider_event_id,
                provider_receipt_id
            ) IN (0, 4)
        ),
    CONSTRAINT commercial_events_idempotency_namespace_check
        CHECK (
            char_length(idempotency_namespace) BETWEEN 1 AND 64
            AND idempotency_namespace ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
        ),
    CONSTRAINT commercial_events_idempotency_key_check
        CHECK (
            char_length(idempotency_key) BETWEEN 1 AND 256
            AND idempotency_key = btrim(idempotency_key)
            AND idempotency_key !~ '[[:cntrl:]]'
        ),
    CONSTRAINT commercial_events_digest_check
        CHECK (operation_digest ~ '^[0-9a-f]{64}$'),
    CONSTRAINT commercial_events_reference_shape_check
        CHECK (
            event_id IS DISTINCT FROM caused_by_event_id
            AND event_id IS DISTINCT FROM corrects_event_id
            AND event_id IS DISTINCT FROM reverses_event_id
            AND num_nonnulls(corrects_event_id, reverses_event_id) <= 1
        ),
    CONSTRAINT commercial_events_attributes_check
        CHECK (
            jsonb_typeof(attributes) = 'object'
            AND octet_length(attributes::text) <= 8192
        ),
    CONSTRAINT commercial_events_attributes_version_check
        CHECK (attributes_version BETWEEN 1 AND 2147483647),
    CONSTRAINT commercial_events_schema_version_check
        CHECK (schema_version = 1),
    CONSTRAINT commercial_events_actor_class_check
        CHECK (
            actor_class IS NULL
            OR actor_class IN ('USER', 'PROVIDER', 'OPERATOR', 'SERVICE', 'SYSTEM')
        ),
    CONSTRAINT commercial_events_actor_reference_check
        CHECK (
            actor_reference IS NULL
            OR (
                char_length(actor_reference) BETWEEN 1 AND 256
                AND actor_reference = btrim(actor_reference)
                AND actor_reference !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT commercial_events_actor_shape_check
        CHECK (num_nonnulls(actor_class, actor_reference) IN (0, 2))
);

CREATE INDEX commercial_events_authority_history_idx
    ON commercial_events (commercial_authority_id, ingested_at DESC, event_id DESC);

CREATE INDEX commercial_events_provider_receipt_idx
    ON commercial_events (provider_receipt_id, event_id)
    WHERE provider_receipt_id IS NOT NULL;

COMMENT ON TABLE commercial_authorities IS
    'Owner-scoped commercial serialization and monotonic revision authority; not entitlement state.';

COMMENT ON TABLE commercial_events IS
    'Append-oriented canonical commercial fact journal; normal repositories expose no update/delete operation.';

COMMENT ON COLUMN commercial_events.attributes IS
    'Bounded versioned normalized attributes only; never raw provider, payment credential, natal, chart, or notification payload data.';

COMMENT ON TABLE provider_ingestion_receipts IS
    'Provider-neutral replay receipt; never entitlement authority and intentionally stores no owner identifier.';
