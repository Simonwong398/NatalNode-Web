# NatalNode Web Production Operations Runbook V1

Status: CODE OPERATIONS READY; EXTERNAL OPERATIONS INCOMPLETE

Scope: Web release engineering and pre-production operations only. This
runbook does not provision infrastructure, send real email, access a production
database, call Engine, choose an astronomy provider, or certify a public
launch.

The machine-readable release source of truth is
[`PRODUCTION_RELEASE_GATES_V1.json`](./PRODUCTION_RELEASE_GATES_V1.json).
Its `externalPrelaunchChecklist` is the only prelaunch checklist. This document
explains how to execute and verify the work; operators must not create a second
independently maintained checklist.

## Readiness vocabulary

- `CODE READY` means the repository's release boundary, validation, migration,
  logging, and rollback contracts are implemented and testable.
- `INFRASTRUCTURE PROVISIONED` means the external database, secret store,
  backup system, rate-limit authority, email/auth consoles, DNS/TLS, durable
  observability, and alert routes exist and are owned.
- `RELEASE CERTIFIED` means an owner has attached evidence for every
  launch-blocking gate.
- `DEPLOYED` is not `HEALTHY`; `HEALTHY` is not `READY FOR TRAFFIC`.

Current release posture:

```text
CODE_GATES=PASS
EXTERNAL_GATES=INCOMPLETE
PUBLIC_RELEASE=BLOCKED
PROVIDER DECISION DEFERRED
```

Engine, scientific authority, production interpretation, and My Chart remain
outside this Web operations gate. Runtime admission remains `NO`.

## 1. Ownership and abort rules

| Area | Authoritative owner | Abort when |
| --- | --- | --- |
| Web build, runtime, migration command, health/readiness | Web engineering | build, preflight, migration, liveness, or readiness is not green |
| PostgreSQL, backups, restore target, schema evidence | Database operations | database is public, migration fails, restore target is production, or schema evidence is missing |
| Secrets and deployment variables | Deployment operations | a secret is committed, logged, browser-exposed, generated into an image, or unavailable for rollback |
| Email and authentication | Auth operations | sender/domain/callback/secret is unverified, a placeholder is present, or token/session boundary is changed |
| Rate limiting, logs, alerts | Web operations | production still depends on a single process-local authority or operator signals are unowned |
| Retention and legal configuration | Product, privacy, and legal owner | policy, deletion, hold, or public notice is undecided |
| Engine/scientific authority | Separate Engine/scientific owner | `PROVIDER DECISION DEFERRED`, production authority, or provenance is unresolved |
| Release approval | Release owner | any launch-blocking manifest item lacks evidence |

Abort is fail-closed. Do not bypass readiness, substitute a fixture, print a
credential, run a destructive database command, or report a mock or research
result as production success.

## 2. Configuration and secret ownership

The source of truth for variable names is the current parser and executable
source (`server/src/runtime/environment/` and
`server/src/runtime/production-runtime-config.ts`). The classifications below
describe existing names only; they do not add variables.

### Required for production process start and readiness

The deployment must inject valid values for:

```text
NATALNODE_RUNTIME_MODE=production
NATALNODE_RATE_LIMIT_AUTHORITY=distributed
NATALNODE_OBSERVABILITY_DURABLE_SINK_CONFIGURED=true
NATALNODE_PRIVACY_ACCESS_AUDIT_REQUIRED=true
HOST
PORT
DATABASE_URL
DATABASE_SSL_ENABLED=true
AUTH_MAGIC_LINK_TTL_SECONDS
AUTH_SESSION_TTL_SECONDS
AUTH_SESSION_COOKIE_NAME
AUTH_SESSION_COOKIE_SECURE=true
PUBLIC_WEB_ORIGIN=https://...
AUTH_EMAIL_ENABLED=true
AUTH_GOOGLE_ENABLED=true
RESEND_API_KEY
AUTH_EMAIL_FROM
```

Google authentication additionally requires the existing
`GOOGLE_OIDC_ISSUER`, `GOOGLE_OIDC_CLIENT_ID`, and
`GOOGLE_OIDC_CLIENT_SECRET`; `GOOGLE_OIDC_REDIRECT_URI` is an optional exact
match assertion when supplied. This documents the current parser contract; it
does not add a Google provider or perform OAuth console setup.

`ENGINE_CLIENT_MODE` must not be present in production. The development value
`ENGINE_CLIENT_MODE=development-mock` belongs only to local development.
`NATALNODE_ENGINE_URL`, when supplied, is configuration metadata only at the
current production boundary and does not admit an Engine client.

### Optional or feature-readiness configuration

These names are read by current source but are not universal production-start
secrets:

| Classification | Variables | Ownership |
| --- | --- | --- |
| Optional pool tuning | `DATABASE_POOL_MAX`, `DATABASE_IDLE_TIMEOUT_MS`, `DATABASE_CONNECTION_TIMEOUT_MS` | Database operations |
| Optional capability | `GEONAMES_USERNAME`, `NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY`, `NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY`, `NATALNODE_WEB_PUSH_VAPID_SUBJECT` | Feature owner; private key remains secret-manager-only |
| Feature readiness | `COMMUNITY_ENABLED`, `COMMUNITY_OPERATOR_CONFIGURED`, `PRACTITIONER_ENABLED`, `PRACTITIONER_OPERATOR_CONFIGURED` | Product/operator owner |
| Local-only composition | `LOCAL_PUBLIC_PORT`, `ENGINE_CLIENT_MODE=development-mock` | Local development only |
| Preflight selector | `NATALNODE_PREFLIGHT_PROFILE` | Operator command input; never a secret |

`DATABASE_URL`, `RESEND_API_KEY`, `GOOGLE_OIDC_CLIENT_SECRET`, and
`NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY` are deployment-injected sensitive
values. They must not be committed, copied into `.env.example`, printed in
diagnostics, logged, sent to the browser, or placed in build artifacts. Sender
and origin values are configuration, but are still validated and must not be
invented at runtime.

`.env.example` contains safe placeholders only. The local `.env` is ignored by
Git and is not a production configuration source. This task does not inspect,
copy, stage, or alter any untracked root `env` file.

## 3. Build and release lifecycle

The controlled lifecycle is:

```text
BUILD
  -> CONFIG VALIDATION
  -> MIGRATION
  -> VERIFY
  -> START
  -> LIVENESS
  -> READINESS
  -> TRAFFIC
```

The repository commands are:

```text
npm run build
npm run release:check
npm run server:preflight       # with NATALNODE_PREFLIGHT_PROFILE=production
npm run db:migrate             # explicit, before application start
npm run server:start
```

`release:check` is deterministic and local-only. It does not bind a listener,
contact a database, call Engine, send email, or read production secrets.
`server:preflight` is also a pure configuration/admission check. The migration
runner is a separate operation; application startup never runs migrations.

Before a rollout, attach the build identity, release-check output, production
preflight output, migration result, and the selected deployment revision to the
release record. Do not attach environment values or raw logs containing
secrets.

## 4. Migration lifecycle

The canonical migration owner is
`server/src/runtime/postgres/migrations/run-postgres-migrations.ts`.

- Migrations are numbered, forward-only SQL artifacts.
- The runner sorts by stable version/filename identity.
- A session advisory lock serializes concurrent migration runners.
- Applied version, filename, and full-artifact SHA-256 are immutable.
- Already-applied migrations are verified and skipped.
- Each new migration runs in its own transaction; recording metadata commits in
  that transaction.
- A failure rolls back that migration, stops the sequence, and fails the
  release. Later migrations must not run.
- Unknown applied history and filename/checksum drift fail closed.
- Web startup and health endpoints never apply migrations.

The deployment pre-deploy phase must run `npm run db:migrate` successfully
before starting the new Web revision. Do not run it against an unverified target
or use destructive reset/rollback SQL. A migration failure means no traffic
promotion.

## 5. Backup, restore, and verification

The database owner selects the backup system and documents its immutable backup
policy, access controls, encryption, retention, and failure notification. This
repository does not claim a backup provider, cloud SLA, RPO, or RTO.

Required restore procedure:

1. Select a `NON_PRODUCTION_ISOLATED_DATABASE` target with no production
   traffic, separate credentials, and a known owner.
2. Identify the backup artifact and preserve its identity in the change record;
   never paste credentials or sensitive row contents into the record.
3. Restore into that isolated target. Never restore over production as a
   verification step.
4. Run the canonical migration/schema compatibility checks and verify the
   expected migration metadata/checksum and required tables/columns.
5. Run the read-only application verification path, including liveness,
   readiness/configuration checks, and bounded repository smoke checks. Do not
   send real email or invoke Engine for this runbook drill.
6. Record pass/fail, operator, timestamp, backup identity, target identity, and
   cleanup/retention decision. Remove the isolated target through its approved
   owner workflow after evidence is retained.

If the target, backup identity, permissions, schema, or verification result is
uncertain, abort. Restore verification is not complete until the external owner
attaches evidence. `RPO=OWNER_DECISION_REQUIRED_LATER` and
`RTO=OWNER_DECISION_REQUIRED_LATER` remain intentionally unfrozen.

## 6. Retention ownership

Retention is an ownership classification, not a legal conclusion:

| Data class | Current owner | Operational boundary |
| --- | --- | --- |
| Account, session, chart, notes, feedback, community, practitioner, notification persistence | `DATABASE_OWNED` / application repository | Existing bounded maintenance jobs and forward-only schema own execution; final durations and holds remain policy-controlled |
| Request IDs, bounded operational completion records | `APPLICATION_OWNED` until a durable sink is selected | Logs exclude PII, credentials, cookies, tokens, bodies, query strings, chart data, and client addresses |
| Resend delivery metadata | `EXTERNAL_PROVIDER_OWNED` plus application delivery boundary | Provider retention and tracking settings require external verification; auth tracking remains disabled per ADR |
| Legal holds, public notices, account-deletion policy, regional obligations | `POLICY_NOT_FROZEN` | Product/privacy/legal owner must approve before release |

Existing maintenance paths are bounded operational jobs, not proof that a final
legal retention policy has been approved.

## 7. Rate limits and distributed authority

The current implementation is explicitly process-local and bounded. It uses
the trusted edge client identity boundary, does not persist raw addresses, and
does not become a database authority. Process-local limits are acceptable for
local development and explicitly single-replica staging only.

Production requires `NATALNODE_RATE_LIMIT_AUTHORITY=distributed` and an
external edge or distributed authority with an owner. This patch does not add
Redis, a cloud service, replica coordination, thresholds, or an SLA. If the
distributed authority is unavailable or its ownership is unclear, readiness and
traffic promotion abort.

## 8. Logging, observability, and alerts

The current request sink emits bounded structured records containing timestamp,
level, event, request ID, method, endpoint family, status, duration, bounded
problem code, cache status, result generation, contract version, scientific
status, and engine duration when available. It must never contain request
bodies, response payloads, query strings, dynamic resource IDs, headers,
cookies, tokens, email addresses, birth/chart/Vault data, client addresses,
`DATABASE_URL`, `RESEND_API_KEY`, or other credentials.

Minimum signals to make externally observable:

- process liveness failure;
- readiness failure and reason category;
- migration failure or schema drift;
- database pool/connectivity failure;
- elevated 5xx responses and auth/email infrastructure failures;
- rate-limit authority unavailable or fail-closed;
- backup/restore verification failure;
- rollout/rollback failure.

`LOG != ALERT`. The application may emit a privacy-safe event; an operator
system must separately decide whether and how to alert. Alert categories,
owners, escalation path, and notification destination must be recorded in the
release evidence. This patch does not invent thresholds or paging SLAs.

Caches are performance layers only. A cache hit, warm process, or stale
artifact must never become the authority for user state, chart persistence,
authorization, readiness, or release certification. Cold/empty/disabled-cache
behavior remains the correctness path.

## 9. Email, authentication, and session boundary

Production email uses the existing provider-neutral delivery boundary with the
selected P0 Resend adapter. Before release, the auth owner must verify:

- the sender identity and preferred `auth.natalnode.com` sending domain;
- SPF, DKIM, DMARC, and provider tracking configuration as required by the
  accepted email ADR;
- a deployment-injected `RESEND_API_KEY` and valid `AUTH_EMAIL_FROM`;
- the exact `PUBLIC_WEB_ORIGIN` used in the generated magic-link URL;
- no `onboarding@resend.dev`, local placeholder, test key, or localhost sender
  reaches production;
- a controlled real delivery check is approved and separately executed by the
  owner. This patch performs no email delivery test.

The current auth contract keeps magic-link tokens one-time and server-consumed,
persists only hashes, uses a generic completion failure, and issues a host-only
HttpOnly `SameSite=Lax` session cookie. Production HTTPS requires `Secure=true`.
Session tokens must not be placed in localStorage, sessionStorage, browser
application state, logs, analytics, or bearer headers.

The current parser also requires Google authentication enabled in production and
validates the exact callback shape when configured. The OAuth console, client
secret, redirect registration, consent/configuration review, and external
provider availability remain external checklist items. No Google feature is
added by this runbook.

## 10. Deployment, health, readiness, and rollback

Deploy a new revision with this order:

1. Build the immutable Web artifact.
2. Run `release:check` and production configuration preflight.
3. Run migrations as a separate pre-deploy operation.
4. Verify migration/schema evidence and deployment configuration ownership.
5. Start the new revision without traffic.
6. Check `GET /api/health` for liveness.
7. Check `GET /api/ready` for readiness. A live process is not traffic-ready.
8. Promote traffic only after the external release owner approves the
   manifest evidence.

The current production runtime remains readiness-fail-closed while Engine
composition is not admitted. Do not turn a 503 readiness result into traffic by
operator override.

Rollback procedure:

1. Stop or prevent traffic to the new revision when liveness, readiness,
   migration, or smoke verification fails.
2. Preserve the failed revision identity, safe diagnostics, and migration
   outcome; do not copy secrets into the incident record.
3. Remove traffic from the new revision and restore the previously certified
   revision only if its database compatibility is confirmed.
4. Do not automatically reverse an applied forward migration. A schema rollback
   requires a separately reviewed forward-compatible repair migration and
   database-owner approval.
5. Re-run liveness/readiness on the previous revision and record the owner
   decision. If no compatible previous revision exists, keep traffic blocked.

This is a controlled rollout and rollback model. It does not claim zero
downtime, automatic recovery, or a production SLA.

## 11. Future Engine and scientific authority boundary

`PROVIDER DECISION DEFERRED` remains exact policy. No production Engine URL,
provider, astronomy result, scientific configuration, or interpretation fact is
selected by this gate. The Web production entrypoint continues to fail closed
before listener admission when production Engine composition is not admitted.

Any future Engine admission requires its own authority, provenance,
configuration identity, timeout/error, unknown-time, and independent validation
contract. It must not be smuggled in as a release-operations fix.

## 12. Verification record

The release owner should attach, without secrets:

- commit SHA and build artifact identity;
- `npm run release:check` output;
- production preflight result;
- migration result and schema compatibility result;
- liveness/readiness results for the new revision;
- backup/restore drill evidence and target classification;
- distributed rate-limit evidence;
- email/auth/DNS/TLS ownership evidence;
- durable logging and alert ownership evidence;
- retention/legal owner decision;
- rollback owner and previous compatible revision;
- final manifest review and certification decision.

The repository can establish code operations readiness. It cannot manufacture
the external evidence listed above, and no public release claim may be made
without it.
