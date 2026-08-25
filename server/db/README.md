# Database schema baseline

PostgreSQL is the Launch persistence target. This directory currently contains a schema-only migration for the P0 Auth + Chart Vault boundary:

- `users`
- `auth_identities`
- `charts`
- `chart_notes`

No ORM has been selected, no runtime database connection exists, and this repository does not yet include a migration runner. The migration is not executed by this patch.

Saved charts store the normalized chart input and canonical Engine result as JSONB snapshots. Scientific configuration and provenance IDs may legitimately be null for an `INCOMPLETE_RESEARCH` result. Website persistence stores Engine snapshots and user metadata; it never performs astronomy calculations.
