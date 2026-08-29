BEGIN;

CREATE TABLE notification_channel_preferences (
    user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT notification_channel_preferences_pk
        PRIMARY KEY (user_id, channel),
    CONSTRAINT notification_channel_preferences_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT notification_channel_preferences_user_id_length_check
        CHECK (char_length(user_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_channel_preferences_channel_check
        CHECK (channel = 'WEB_PUSH'),
    CONSTRAINT notification_channel_preferences_timestamps_check
        CHECK (updated_at >= created_at)
);

CREATE TABLE notification_category_preferences (
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT notification_category_preferences_pk
        PRIMARY KEY (user_id, category),
    CONSTRAINT notification_category_preferences_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT notification_category_preferences_user_id_length_check
        CHECK (char_length(user_id) BETWEEN 1 AND 256),
    CONSTRAINT notification_category_preferences_category_check
        CHECK (category IN ('ACCOUNT', 'SYSTEM', 'ASTROLOGY_ALERT')),
    CONSTRAINT notification_category_preferences_timestamps_check
        CHECK (updated_at >= created_at)
);

CREATE TABLE push_subscriptions (
    subscription_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    endpoint_hash TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_success_at TIMESTAMPTZ,
    status TEXT NOT NULL,
    invalidated_at TIMESTAMPTZ,
    CONSTRAINT push_subscriptions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT push_subscriptions_subscription_id_length_check
        CHECK (char_length(subscription_id) BETWEEN 1 AND 256),
    CONSTRAINT push_subscriptions_user_id_length_check
        CHECK (char_length(user_id) BETWEEN 1 AND 256),
    CONSTRAINT push_subscriptions_endpoint_length_check
        CHECK (char_length(endpoint) BETWEEN 1 AND 2048),
    CONSTRAINT push_subscriptions_endpoint_hash_check
        CHECK (endpoint_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT push_subscriptions_p256dh_check
        CHECK (
            char_length(p256dh) BETWEEN 1 AND 512
            AND p256dh ~ '^[A-Za-z0-9_-]+$'
        ),
    CONSTRAINT push_subscriptions_auth_check
        CHECK (
            char_length(auth) BETWEEN 1 AND 512
            AND auth ~ '^[A-Za-z0-9_-]+$'
        ),
    CONSTRAINT push_subscriptions_status_check
        CHECK (status IN ('ACTIVE', 'INVALIDATED')),
    CONSTRAINT push_subscriptions_status_shape_check
        CHECK (
            (status = 'ACTIVE' AND invalidated_at IS NULL)
            OR (status = 'INVALIDATED' AND invalidated_at IS NOT NULL)
        ),
    CONSTRAINT push_subscriptions_timestamps_check
        CHECK (updated_at >= created_at)
);

CREATE UNIQUE INDEX push_subscriptions_active_endpoint_hash_unique_idx
    ON push_subscriptions (endpoint_hash)
    WHERE status = 'ACTIVE';

CREATE INDEX push_subscriptions_active_user_id_idx
    ON push_subscriptions (user_id)
    WHERE status = 'ACTIVE';

COMMIT;
