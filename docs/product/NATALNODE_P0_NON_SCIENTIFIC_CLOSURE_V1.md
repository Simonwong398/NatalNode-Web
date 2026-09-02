# NatalNode Web P0 Non-Scientific Closure V1

- **Status:** `LOCAL NON-SCIENTIFIC PRODUCTION CLOSURE COMPLETE`
- **Task:** `WEB-P0-002B`
- **Starting baseline:** `a6ceb86c0e7bff0fd51b2f9b62ae682a04e69800`
- **Starting message:** `fix: harden mutation limits and HTTP lifecycle`
- **Closure date:** 2026-09-02
- **Execution model:** `Luna Max`
- **Reasoning:** `MAX`
- **Overall P0 release:** `NOT READY`
- **Production astronomy/provider:** `PROVIDER DECISION DEFERRED`

This document is the current implementation amendment for the bounded
non-scientific Web P0 closure campaign. It records what is closed in the
repository and what still needs policy, live-environment, credential,
infrastructure, legal, or scientific evidence. It does not authorize a public
production astrology release.

The fixed boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
    -> approved production astronomy provider
```

The Web repository does not calculate astronomy, select a provider, call a
provider directly, or create scientific provenance. `C:\NatalNode` is outside
this campaign and was not accessed.

## 1. Product Owner decision record

The Product Owner decisions authorized for this campaign are recorded as
approved inputs, not as live evidence:

| Decision set | Recorded result |
| --- | --- |
| DP-01 | No production astrology while scientific authority, commercial rights, provenance, and real acceptance remain open. Research/staging and explicitly labeled fixtures remain allowed. |
| DP-02 | Isolated, non-indexable staging with separate database, secrets, auth configuration, and explicit staging identity. |
| DP-03 | One primary managed region; Singapore/APAC is preferred. Final selection remains external and must not be silently inferred. |
| DP-04 | Database RPO `<= 1 hour`, RTO `<= 4 hours`, and at least quarterly restore drills. |
| DP-05 | Operational logs 30 days; security/auth/audit operations 180 days; Privacy Access Audit 365 days; raw Feedback at most 180 days, subject to a later legal shortening. |
| DP-06 | Privacy Access Audit is limited to Community Moderator and Practitioner Reviewer surfaces. No Feedback browser, generic explorer, or administrator data dashboard. |
| DP-07 | Community and Practitioner production availability requires a responsible operator. Roles remain server-authoritative and auditable. |
| DP-08 | Process-local limits are local/single-replica staging only. Multi-replica production requires a distributed or trusted-edge authority. No vendor is selected. |
| DP-09 | Full P0 Auth is Email Magic Link plus Google Sign-In. Staging may explicitly disable Google. Existing origin, cookie, state, PKCE, nonce, issuer, audience, and anti-enumeration boundaries remain in force. |
| DP-10 | `FREE` / `PRO` remains the domain model, with `FREE-FIRST / NO PURCHASABLE PRO` for initial P0. No billing, ads, or third tier. |
| DP-11 | P0 is founder-operated by functional roles: Release, Security/Privacy, Operations/Infrastructure, Community Moderation, and Practitioner Review. |

The bounded approvals A-01 through A-09 are also recorded: cursor Vault
listing (default 50, maximum 100), a 10-second Resend deadline with no
automatic retry, an 8-second future Engine baseline with no retry, explicit
fail-closed production configuration, narrow operational availability gates,
technical legal-route preparation without invented copy, one-shot maintenance,
provider-neutral observability, and a backup/restore operations pack without an
application backup engine.

Each item above has three separate states:

1. **Policy decided:** Product Owner input is present in the campaign brief.
2. **Local implementation:** the repository boundary is implemented where it
   is safe and well-defined.
3. **External evidence:** live credentials, providers, infrastructure,
   operations, legal approval, or scientific authority are verified separately.

Approval of policy never changes an external state to complete.

## 2. Local implementation closure

The following bounded repository work is complete:

- `ServerRuntimeMode` explicitly distinguishes `local`, `staging`, and
  `production`.
- Production environment parsing rejects remote HTTP origins, insecure
  database SSL, disabled required Auth providers, missing enabled Google
  configuration, unsafe mock Engine mode, and incomplete operational
  invariants. Secrets are validated at the executable boundary and are not
  stored in public runtime policy objects.
- The rate-limit contract is provider-neutral. The existing process-local
  limiter remains available for local and isolated staging; production cannot
  start with a mismatched or unconfirmed process-local authority.
- Existing HARDEN-001 body limits, strict media types, malformed-body handling,
  request timeouts, and mutation rate-limit coverage remain in the route path.
- Vault chart listing has deterministic account-bound keyset pagination with a
  default page size of 50 and a maximum of 100. Cursor tokens carry only the
  account-bound ordering tuple and cannot be reused across accounts. Ownership,
  ordering, Free capacity 3, Pro direction, and earned-Pro semantics remain
  unchanged.
- The existing append-only Privacy Access Audit repository is wired into the
  PostgreSQL composition. Approved Community Moderator and Practitioner
  Reviewer queue access and successful review/moderation actions append only
  the minimum server-side `HUMAN` / `REVIEW` / `AUDIT` event with actor, time,
  generated event ID, and optional request correlation. No private queue
  content or target identifiers are copied into the audit event.
- Community and Practitioner surfaces have a server-authoritative operational
  availability boundary. They fail closed when disabled or when their
  operator is not configured; no browser role grant or admin product was
  added.
- Resend delivery has a total 10-second application deadline and no automatic
  retry. Timeout and provider failures retain generic outward error behavior.
- Observability remains one bounded structured completion event at the API
  boundary. It includes request ID, safe endpoint family (including
  Practitioner), status, duration, and approved error/calculation dimensions;
  it does not include request bodies, secrets, tokens, raw IPs, birth data,
  account IDs, or product content. Sink failures remain isolated.
- Raw Feedback has a separate bounded 180-day PostgreSQL retention repository
  and one-shot executable. The normal Feedback create-only contract is not
  widened. The purge uses a bounded `SKIP LOCKED` batch and emits sanitized
  JSONL outcomes with safe exit codes.
- `/privacy` and `/terms` routes, localized route wrappers, footer links, and a
  typed approved-content source boundary exist. The source is intentionally
  empty while legal approval is absent; routes redirect to the 404 boundary
  rather than publish placeholder or generated legal text.
- A repository-local Railway/Caddy staging handoff exists at
  `deploy/staging/`. It is non-indexable, carries an explicit staging identity,
  keeps the API private, overwrites the trusted client identity at the edge,
  and prevents unknown API paths from falling through to static HTML.
- This document records the backup/restore, scheduler, ownership, retention,
  and release evidence contracts without pretending that any external service
  has been provisioned.

## 3. External evidence still open

The following are intentionally not claimed as complete:

- approved final Privacy and Terms copy and associated legal/processor review;
- verified production Resend sender/domain and production email acceptance;
- Google OAuth project, exact approved origins/redirect registration, and live
  provider verification;
- production secret-manager material, rotation, DNS/TLS, HSTS/CSP review, and
  environment access controls;
- isolated Railway staging provisioning, selected region, private-network
  verification, migration evidence, browser smoke evidence, and staging
  scheduler binding;
- a production distributed/atomic rate-limit authority or trusted-edge proof;
- a durable observability sink, access review, alerting, and retention proof;
- managed PostgreSQL backup/PITR configuration, isolated restore evidence, and
  quarterly drill records;
- production operations ownership evidence and release certification; and
- Engine production authority, scientific configuration, astronomy-provider
  decision/commercial rights, production resolver/timezone authority, and real
  scientific acceptance.

These remain `EXTERNAL_EVIDENCE`, `CREDENTIAL_EXTERNAL`,
`INFRASTRUCTURE_EXTERNAL`, `LEGAL_EXTERNAL`, or
`SCIENTIFIC_EXTERNAL` gates as applicable. None is replaced by a local mock,
fixture, migration, source contract, or passing local test.

## 4. Staging composition contract

The accepted staging topology remains:

```text
staging.natalnode.com
    -> public web-edge / Caddy
       |-- static Astro artifact for non-API paths
       `-- private API service for /api and /api/*
           `-- private managed PostgreSQL
```

The staging API must use:

```text
NATALNODE_RUNTIME_MODE=staging
PUBLIC_WEB_ORIGIN=https://staging.natalnode.com
AUTH_SESSION_COOKIE_SECURE=true
ENGINE_CLIENT_MODE=development-mock
AUTH_GOOGLE_ENABLED=false       # until Google binding/credentials exist
```

The API must receive a staging-only database and secrets. Production data and
production secrets are not copied by default. The static artifact remains
non-indexable through the edge; fixture-backed scientific output remains
explicitly labeled as development/research output.

The Caddy contract is intentionally a handoff, not a provisioning action. It
requires `PORT` and a platform-resolved private `API_UPSTREAM`; neither has a
repository default. See `deploy/staging/Caddyfile` and its README for the
exact header, proxy, and evidence contract.

## 5. Retention and maintenance runbook contract

Maintenance remains external-scheduler invoked, bounded, one-shot, and
single-flight at the deployment boundary. No in-process cron loop or worker was
added to the API server.

Current commands are:

```text
npm run maintenance:auth-cleanup --workspace=server
npm run maintenance:community-retention --workspace=server
npm run maintenance:practitioner-retention --workspace=server
npm run maintenance:feedback-retention --workspace=server
```

The scheduler must provide the appropriate environment, prevent overlapping
invocations of the same maintenance job, capture the sanitized stdout/stderr
JSONL result, alert on a non-zero exit, and retain only the approved
operational evidence. The application does not claim scheduler delivery,
frequency, or external retention merely because these commands exist.

Approved local retention boundaries are preserved: Auth technical expiry,
Community and Practitioner product-retention predicates, and raw Feedback at
most 180 days. Legal or security holds continue to take precedence where the
existing repositories define them. No Vault, notes, audit, backup, provider,
or infrastructure-log deletion policy is invented here.

## 6. Backup and restore runbook

The external Operations owner must record one evidence packet for every
quarterly restore drill:

1. Record the source database, environment, provider region, backup/PITR
   capability, operator, timestamp, and target restore point without exposing
   credentials.
2. Restore into an isolated non-production environment with no production
   traffic or public DNS.
3. Verify migration/schema state and application compatibility against the
   deployed release.
4. Verify Auth/account sanity and representative Vault, Community, and
   Practitioner records using synthetic or approved test identities.
5. Confirm the measured restore duration is within the `RTO <= 4 hours` target
   and the selected recovery point is within the `RPO <= 1 hour` target.
6. Record anomalies, corrective actions, evidence location, and owner sign-off.
7. Remove or securely dispose of the isolated restore environment and its
   temporary data according to the approved operational policy.

No successful backup, restore, RPO, or RTO result is recorded by this
repository-only campaign.

## 7. Release and ownership contract

At P0 the Product Owner may hold all five functional responsibilities:

| Role | Required responsibility |
| --- | --- |
| Release Owner | Release checklist, rollback decision, and final go/no-go record. |
| Security/Privacy Owner | Access review, incident coordination, erasure/retention reconciliation, and privacy gate. |
| Operations/Infrastructure Owner | Hosting, region, database, backups, restore drills, scheduler, alerts, and runtime access. |
| Community Moderation Owner | Moderator assignment, queue coverage, and moderation audit review. |
| Practitioner Review Owner | Reviewer assignment, application/revision/report coverage, and review audit review. |

Each release should record the commit, environment, migration result, health
result, Auth status, privacy/security checks, backup evidence status, open
external gates, rollback owner, and final decision. Personal contact details
and secrets do not belong in source.

## 8. Scientific containment

This closure does not authorize `WEB-P0-002C` and does not change:

```text
PROVIDER DECISION DEFERRED
```

There is no production Engine binding, provider SDK, direct astronomy call,
Web-owned astronomy calculation, production fixture authority, or fabricated
provenance. Existing development/research fixture and Public Sky boundaries
remain explicitly non-production. Any production chart path requiring
scientific authority must remain unavailable until the separately authorized
scientific integration task.

## 9. Final classification

| Dimension | Classification |
| --- | --- |
| `PRODUCT_UI` | `CLOSED / PRESERVED` |
| `LOCAL_SECURITY` | `CLOSED FOR REPOSITORY BOUNDARY` |
| `LOCAL_RELIABILITY` | `CLOSED FOR REPOSITORY BOUNDARY` |
| `LOCAL_PRIVACY` | `CLOSED FOR REPOSITORY BOUNDARY` |
| `LOCAL_OPERATIONS` | `CLOSED AS RUNBOOK/CONTRACT; LIVE EVIDENCE OPEN` |
| `LOCAL_STAGING` | `READY FOR EXTERNAL COMPOSITION; NOT PROVISIONED` |
| `LEGAL_EXTERNAL` | `OPEN` |
| `CREDENTIAL_EXTERNAL` | `OPEN` |
| `INFRASTRUCTURE_EXTERNAL` | `OPEN` |
| `SCIENTIFIC_EXTERNAL` | `OPEN` |
| `PROVIDER_GATE` | `PROVIDER DECISION DEFERRED` |
| `OVERALL_P0_RELEASE` | `NOT READY` |

The correct campaign result is therefore:

```text
WEB-P0-002B
=
LOCAL NON-SCIENTIFIC PRODUCTION CLOSURE COMPLETE

P0 public production release
=
NOT READY — external and scientific evidence remains
```

Recommended next action: stop this campaign. Do not begin
`WEB-P0-002C`, production Engine integration, provider selection, deployment,
or another P1/P2/P3 slice from this document.
