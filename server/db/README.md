# Database schema baseline

PostgreSQL is the Launch persistence target. This directory contains forward-only migrations for the P0 Auth + Chart Vault boundary:

- `users`
- `auth_identities`
- `auth_sessions`
- `email_magic_link_challenges`
- `charts`
- `chart_notes`

No ORM has been selected. The server has a concrete PostgreSQL pool/runtime and PostgreSQL repository adapters. It also has an explicit migration runtime and the `npm run db:migrate` executable, which applies these migrations through a dedicated pool.

Migrations remain a separate, explicit release operation. Application startup, server bootstrap, and the health endpoint do not run migrations automatically.

Saved charts store the normalized chart input and canonical Engine result as JSONB snapshots. Scientific configuration and provenance IDs may legitimately be null for an `INCOMPLETE_RESEARCH` result. Website persistence stores Engine snapshots and user metadata; it never performs astronomy calculations.
