BEGIN;

CREATE TABLE notification_intents (
    intent_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    category TEXT NOT NULL,
    channel TEXT NOT NULL,
    notification_type_key TEXT NOT NULL,
    template_key TEXT NOT NULL,
    template_version INTEGER NOT NULL,
    payload_version INTEGER NOT NULL,
    payload_json JSONB NOT NULL,
    dedupe_key TEXT NOT NULL,
    deliver_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT notification_intents_owner_fk
        FOREIGN KEY (owner_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT notification_intents_intent_id_length_check
        CHECK (char_length(intent_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_intents_owner_id_length_check
        CHECK (char_length(owner_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_intents_category_check
        CHECK (category IN ('ACCOUNT', 'SYSTEM', 'ASTROLOGY_ALERT')),
    CONSTRAINT notification_intents_channel_check
        CHECK (channel = 'WEB_PUSH'),
    CONSTRAINT notification_intents_type_key_check
        CHECK (
            char_length(notification_type_key) BETWEEN 1 AND 128
            AND notification_type_key ~ '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
        ),
    CONSTRAINT notification_intents_template_key_check
        CHECK (
            char_length(template_key) BETWEEN 1 AND 256
            AND template_key = btrim(template_key)
            AND template_key !~ '[[:cntrl:]]'
        ),
    CONSTRAINT notification_intents_template_version_check
        CHECK (template_version BETWEEN 1 AND 2147483647),
    CONSTRAINT notification_intents_payload_version_check
        CHECK (payload_version = 1),
    CONSTRAINT notification_intents_payload_shape_check
        CHECK (
            jsonb_typeof(payload_json) = 'object'
            AND payload_json ? 'version'
            AND payload_json ? 'title'
            AND payload_json ? 'body'
            AND (payload_json - 'version' - 'title' - 'body' - 'path') = '{}'::jsonb
            AND jsonb_typeof(payload_json -> 'version') = 'number'
            AND payload_json ->> 'version' = '1'
            AND jsonb_typeof(payload_json -> 'title') = 'string'
            AND char_length(payload_json ->> 'title') BETWEEN 1 AND 80
            AND (payload_json ->> 'title') !~ '[[:cntrl:]]'
            AND jsonb_typeof(payload_json -> 'body') = 'string'
            AND char_length(payload_json ->> 'body') BETWEEN 1 AND 160
            AND (payload_json ->> 'body') !~ '[[:cntrl:]]'
            AND (
                NOT (payload_json ? 'path')
                OR (
                    jsonb_typeof(payload_json -> 'path') = 'string'
                    AND char_length(payload_json ->> 'path') BETWEEN 1 AND 256
                    AND (payload_json ->> 'path') LIKE '/%'
                    AND (payload_json ->> 'path') NOT LIKE '//%'
                    AND (payload_json ->> 'path') NOT LIKE '%?%'
                    AND (payload_json ->> 'path') NOT LIKE '%#%'
                    AND position(chr(92) in (payload_json ->> 'path')) = 0
                    AND (payload_json ->> 'path') !~ '[[:cntrl:]]'
                    AND (
                        payload_json ->> 'path' = '/'
                        OR payload_json ->> 'path' = '/account'
                        OR payload_json ->> 'path' LIKE '/account/%'
                        OR payload_json ->> 'path' = '/about'
                        OR payload_json ->> 'path' LIKE '/about/%'
                        OR payload_json ->> 'path' = '/learn'
                        OR payload_json ->> 'path' LIKE '/learn/%'
                        OR payload_json ->> 'path' = '/methodology'
                        OR payload_json ->> 'path' LIKE '/methodology/%'
                        OR payload_json ->> 'path' = '/tools'
                        OR payload_json ->> 'path' LIKE '/tools/%'
                        OR payload_json ->> 'path' = '/vault'
                        OR payload_json ->> 'path' LIKE '/vault/%'
                    )
                )
            )
        ),
    CONSTRAINT notification_intents_dedupe_key_check
        CHECK (
            char_length(dedupe_key) BETWEEN 1 AND 256
            AND dedupe_key = btrim(dedupe_key)
            AND dedupe_key !~ '[[:cntrl:]]'
        ),
    CONSTRAINT notification_intents_timestamps_check
        CHECK (updated_at >= created_at),
    CONSTRAINT notification_intents_completed_at_check
        CHECK (completed_at IS NULL OR completed_at >= created_at),
    CONSTRAINT notification_intents_dedupe_unique
        UNIQUE (owner_id, category, channel, notification_type_key, dedupe_key)
);

CREATE TABLE notification_deliveries (
    delivery_id TEXT PRIMARY KEY,
    intent_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    state TEXT NOT NULL,
    attempt_count INTEGER NOT NULL,
    next_attempt_at TIMESTAMPTZ,
    claim_token TEXT,
    claim_expires_at TIMESTAMPTZ,
    last_failure_class TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_attempt_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    terminal_at TIMESTAMPTZ,
    CONSTRAINT notification_deliveries_intent_fk
        FOREIGN KEY (intent_id)
        REFERENCES notification_intents (intent_id)
        ON DELETE CASCADE,
    CONSTRAINT notification_deliveries_owner_fk
        FOREIGN KEY (owner_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT notification_deliveries_subscription_fk
        FOREIGN KEY (subscription_id)
        REFERENCES push_subscriptions (subscription_id)
        ON DELETE CASCADE,
    CONSTRAINT notification_deliveries_delivery_id_length_check
        CHECK (char_length(delivery_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_deliveries_intent_id_length_check
        CHECK (char_length(intent_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_deliveries_owner_id_length_check
        CHECK (char_length(owner_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_deliveries_subscription_id_length_check
        CHECK (char_length(subscription_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_deliveries_state_check
        CHECK (state IN (
            'PENDING',
            'RETRYABLE',
            'PROCESSING',
            'DELIVERED',
            'DEAD',
            'CANCELLED'
        )),
    CONSTRAINT notification_deliveries_attempt_count_check
        CHECK (attempt_count BETWEEN 0 AND 5),
    CONSTRAINT notification_deliveries_pending_attempt_check
        CHECK (state <> 'PENDING' OR attempt_count = 0),
    CONSTRAINT notification_deliveries_due_timestamp_check
        CHECK (
            (state IN ('PENDING', 'RETRYABLE') AND next_attempt_at IS NOT NULL)
            OR (state NOT IN ('PENDING', 'RETRYABLE') AND next_attempt_at IS NULL)
        ),
    CONSTRAINT notification_deliveries_claim_shape_check
        CHECK (
            (
                state = 'PROCESSING'
                AND claim_token IS NOT NULL
                AND claim_expires_at IS NOT NULL
            )
            OR (
                state <> 'PROCESSING'
                AND claim_token IS NULL
                AND claim_expires_at IS NULL
            )
        ),
    CONSTRAINT notification_deliveries_claim_token_check
        CHECK (
            claim_token IS NULL
            OR (
                char_length(claim_token) BETWEEN 1 AND 256
                AND claim_token = btrim(claim_token)
                AND claim_token !~ '[[:cntrl:]]'
            )
        ),
    CONSTRAINT notification_deliveries_failure_class_check
        CHECK (
            last_failure_class IS NULL
            OR last_failure_class IN (
                'SUBSCRIPTION_INVALID',
                'THROTTLED',
                'TRANSIENT_UPSTREAM',
                'TIMEOUT_AMBIGUOUS',
                'CONFIGURATION_UNAVAILABLE',
                'PAYLOAD_INVALID',
                'PERMANENT_FAILURE'
            )
        ),
    CONSTRAINT notification_deliveries_cancel_reason_check
        CHECK (
            cancel_reason IS NULL
            OR cancel_reason IN (
                'INELIGIBLE',
                'CHANNEL_NOT_ENABLED',
                'CATEGORY_NOT_ENABLED',
                'SUBSCRIPTION_NOT_ACTIVE',
                'TRUSTED_ELIGIBILITY_REVOKED'
            )
        ),
    CONSTRAINT notification_deliveries_cancel_shape_check
        CHECK (
            (state = 'CANCELLED' AND cancel_reason IS NOT NULL)
            OR (state <> 'CANCELLED' AND cancel_reason IS NULL)
        ),
    CONSTRAINT notification_deliveries_terminal_shape_check
        CHECK (
            (
                state IN ('DELIVERED', 'DEAD', 'CANCELLED')
                AND terminal_at IS NOT NULL
            )
            OR (
                state IN ('PENDING', 'RETRYABLE', 'PROCESSING')
                AND terminal_at IS NULL
            )
        ),
    CONSTRAINT notification_deliveries_delivered_shape_check
        CHECK (
            (state = 'DELIVERED' AND delivered_at IS NOT NULL)
            OR (state <> 'DELIVERED' AND delivered_at IS NULL)
        ),
    CONSTRAINT notification_deliveries_timestamp_order_check
        CHECK (
            updated_at >= created_at
            AND (last_attempt_at IS NULL OR last_attempt_at >= created_at)
            AND (delivered_at IS NULL OR delivered_at >= created_at)
            AND (terminal_at IS NULL OR terminal_at >= created_at)
        )
);

CREATE INDEX notification_deliveries_due_idx
    ON notification_deliveries (next_attempt_at, delivery_id)
    WHERE state IN ('PENDING', 'RETRYABLE');

CREATE INDEX notification_deliveries_expired_lease_idx
    ON notification_deliveries (claim_expires_at, delivery_id)
    WHERE state = 'PROCESSING';

CREATE INDEX notification_deliveries_owner_state_idx
    ON notification_deliveries (owner_id, state);

CREATE INDEX notification_deliveries_subscription_state_idx
    ON notification_deliveries (subscription_id, state);

COMMIT;
