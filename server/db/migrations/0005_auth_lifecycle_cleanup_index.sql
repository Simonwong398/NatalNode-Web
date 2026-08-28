CREATE INDEX email_magic_link_challenges_consumed_at_idx
    ON email_magic_link_challenges (consumed_at, challenge_id)
    WHERE consumed_at IS NOT NULL;
