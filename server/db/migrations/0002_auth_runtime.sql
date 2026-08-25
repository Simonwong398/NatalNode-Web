BEGIN;

CREATE TABLE auth_sessions (
    session_token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT auth_sessions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);

CREATE INDEX auth_sessions_user_id_idx
    ON auth_sessions (user_id);

CREATE INDEX auth_sessions_expires_at_idx
    ON auth_sessions (expires_at);

CREATE TABLE email_magic_link_challenges (
    challenge_id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    email_normalized TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL
);

CREATE INDEX email_magic_link_challenges_expires_at_idx
    ON email_magic_link_challenges (expires_at);

CREATE INDEX email_magic_link_challenges_email_normalized_idx
    ON email_magic_link_challenges (email_normalized);

COMMIT;
