CREATE TABLE feedback_submissions (
    feedback_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT feedback_submissions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT feedback_submissions_category_check
        CHECK (category IN (
            'BUG',
            'SUGGESTION',
            'CALCULATION_CONCERN',
            'OTHER'
        )),
    CONSTRAINT feedback_submissions_message_length_check
        CHECK (char_length(message) BETWEEN 10 AND 5000),
    CONSTRAINT feedback_submissions_message_line_endings_check
        CHECK (position(E'\r' in message) = 0)
);

CREATE INDEX feedback_submissions_user_id_idx
    ON feedback_submissions (user_id);
