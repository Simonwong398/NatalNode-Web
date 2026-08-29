CREATE TABLE google_oauth_transactions (
    transaction_id VARCHAR(256) PRIMARY KEY,
    flow_kind VARCHAR(14) NOT NULL,
    state_hash VARCHAR(64) NOT NULL UNIQUE,
    pkce_verifier VARCHAR(128),
    nonce_hash VARCHAR(64) NOT NULL,
    browser_binding_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    post_auth_redirect VARCHAR(1) NOT NULL,
    status VARCHAR(9) NOT NULL,
    claimed_at TIMESTAMPTZ,
    terminal_at TIMESTAMPTZ,
    CONSTRAINT google_oauth_transactions_transaction_id_length_check
        CHECK (char_length(transaction_id) BETWEEN 1 AND 256),
    CONSTRAINT google_oauth_transactions_flow_kind_check
        CHECK (flow_kind = 'GOOGLE_SIGN_IN'),
    CONSTRAINT google_oauth_transactions_state_hash_check
        CHECK (state_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT google_oauth_transactions_pkce_verifier_check
        CHECK (
            pkce_verifier IS NULL
            OR (
                char_length(pkce_verifier) BETWEEN 43 AND 128
                AND pkce_verifier ~ '^[A-Za-z0-9_-]+$'
            )
        ),
    CONSTRAINT google_oauth_transactions_nonce_hash_check
        CHECK (nonce_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT google_oauth_transactions_browser_binding_hash_check
        CHECK (browser_binding_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT google_oauth_transactions_timestamps_check
        CHECK (created_at < expires_at),
    CONSTRAINT google_oauth_transactions_post_auth_redirect_check
        CHECK (post_auth_redirect = '/'),
    CONSTRAINT google_oauth_transactions_status_check
        CHECK (status IN ('PENDING', 'CLAIMED', 'COMPLETED', 'FAILED', 'EXPIRED')),
    CONSTRAINT google_oauth_transactions_state_shape_check
        CHECK (
            (
                status = 'PENDING'
                AND pkce_verifier IS NOT NULL
                AND claimed_at IS NULL
                AND terminal_at IS NULL
            )
            OR (
                status = 'CLAIMED'
                AND pkce_verifier IS NOT NULL
                AND claimed_at IS NOT NULL
                AND terminal_at IS NULL
            )
            OR (
                status IN ('COMPLETED', 'FAILED')
                AND pkce_verifier IS NULL
                AND claimed_at IS NOT NULL
                AND terminal_at IS NOT NULL
            )
            OR (
                status = 'EXPIRED'
                AND pkce_verifier IS NULL
                AND claimed_at IS NULL
                AND terminal_at IS NOT NULL
            )
        ),
    CONSTRAINT google_oauth_transactions_claimed_at_order_check
        CHECK (claimed_at IS NULL OR claimed_at >= created_at),
    CONSTRAINT google_oauth_transactions_terminal_at_order_check
        CHECK (
            terminal_at IS NULL
            OR (
                terminal_at >= created_at
                AND (claimed_at IS NULL OR terminal_at >= claimed_at)
            )
        )
);

CREATE INDEX google_oauth_transactions_expiry_idx
    ON google_oauth_transactions (expires_at)
    WHERE status IN ('PENDING', 'CLAIMED');
