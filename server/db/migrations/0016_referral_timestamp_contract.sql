ALTER TABLE referral_rewards
    DROP CONSTRAINT referral_rewards_timestamp_order_check;

ALTER TABLE referral_rewards
    ADD CONSTRAINT referral_rewards_timestamp_order_check
    CHECK (
        (earned_at IS NULL OR earned_at >= qualifying_payment_at)
        AND (applied_at IS NULL OR applied_at >= earned_at)
        AND (revoked_at IS NULL OR revoked_at >= qualifying_payment_at)
        AND updated_at >= created_at
    );
