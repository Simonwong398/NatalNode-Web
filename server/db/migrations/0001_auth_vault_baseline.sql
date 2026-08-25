BEGIN;

CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE auth_identities (
    identity_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_subject TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT auth_identities_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT auth_identities_provider_check
        CHECK (provider IN ('EMAIL_MAGIC_LINK', 'GOOGLE')),
    CONSTRAINT auth_identities_provider_subject_unique
        UNIQUE (provider, provider_subject)
);

CREATE INDEX auth_identities_user_id_idx
    ON auth_identities (user_id);

CREATE TABLE charts (
    chart_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] NOT NULL,
    favorite BOOLEAN NOT NULL,
    normalized_input JSONB NOT NULL,
    canonical_result JSONB NOT NULL,
    engine_version TEXT NOT NULL,
    chart_schema_version TEXT NOT NULL,
    astronomy_configuration_id TEXT,
    provenance_envelope_id TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT charts_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT charts_category_check
        CHECK (category IN ('SELF', 'PARTNER', 'FAMILY', 'FRIEND', 'CLIENT'))
);

CREATE INDEX charts_user_id_idx
    ON charts (user_id);

CREATE TABLE chart_notes (
    note_id TEXT PRIMARY KEY,
    chart_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chart_notes_chart_fk
        FOREIGN KEY (chart_id)
        REFERENCES charts (chart_id)
        ON DELETE CASCADE,
    CONSTRAINT chart_notes_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);

CREATE INDEX chart_notes_chart_id_idx
    ON chart_notes (chart_id);

CREATE INDEX chart_notes_user_id_idx
    ON chart_notes (user_id);

COMMIT;
