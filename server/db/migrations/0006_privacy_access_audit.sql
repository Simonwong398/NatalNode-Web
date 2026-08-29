CREATE TABLE audit_events (
    audit_event_id VARCHAR(256) PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL,
    actor_type VARCHAR(7) NOT NULL,
    actor_id VARCHAR(256) NOT NULL,
    subject_account_id VARCHAR(256),
    action VARCHAR(6) NOT NULL,
    resource_category VARCHAR(16) NOT NULL,
    outcome VARCHAR(7) NOT NULL,
    request_id VARCHAR(256),
    CONSTRAINT audit_events_audit_event_id_length_check
        CHECK (char_length(audit_event_id) BETWEEN 1 AND 256),
    CONSTRAINT audit_events_actor_type_check
        CHECK (actor_type IN ('HUMAN', 'SERVICE')),
    CONSTRAINT audit_events_actor_id_length_check
        CHECK (char_length(actor_id) BETWEEN 1 AND 256),
    CONSTRAINT audit_events_subject_account_id_length_check
        CHECK (
            subject_account_id IS NULL
            OR char_length(subject_account_id) BETWEEN 1 AND 256
        ),
    CONSTRAINT audit_events_action_check
        CHECK (action IN ('READ', 'EXPORT', 'DELETE', 'REVIEW')),
    CONSTRAINT audit_events_resource_category_check
        CHECK (resource_category IN (
            'ACCOUNT',
            'AUTH',
            'VAULT',
            'ACCOUNT_EXPORT',
            'ACCOUNT_DELETION',
            'FEEDBACK',
            'AUDIT'
        )),
    CONSTRAINT audit_events_outcome_check
        CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
    CONSTRAINT audit_events_request_id_length_check
        CHECK (
            request_id IS NULL
            OR char_length(request_id) BETWEEN 1 AND 256
        ),
    CONSTRAINT audit_events_subject_scope_check
        CHECK (
            resource_category = 'AUDIT'
            OR subject_account_id IS NOT NULL
        ),
    CONSTRAINT audit_events_review_scope_check
        CHECK (
            (resource_category = 'AUDIT' AND action = 'REVIEW')
            OR (resource_category <> 'AUDIT' AND action <> 'REVIEW')
        )
);

CREATE INDEX audit_events_occurred_at_idx
    ON audit_events (occurred_at);

CREATE INDEX audit_events_subject_account_id_idx
    ON audit_events (subject_account_id)
    WHERE subject_account_id IS NOT NULL;
