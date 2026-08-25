BEGIN;

ALTER TABLE auth_identities
    DROP CONSTRAINT auth_identities_user_fk;

ALTER TABLE auth_identities
    ADD CONSTRAINT auth_identities_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED;

COMMIT;
