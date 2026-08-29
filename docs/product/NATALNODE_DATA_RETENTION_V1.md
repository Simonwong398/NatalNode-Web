# NatalNode P0 Data Retention Technical Contract V1

- **Status:** APPROVED TECHNICAL CONTRACT / POLICY VALUES REQUIRED / IMPLEMENTATION DEFERRED
- **Task:** `WEB-RETENTION-001A`
- **Reviewed baseline:** `51c8b0857ed0a581b35c7d96d4a64c6d59539745` (`feat: add privacy access audit core`)
- **Date:** 2026-08-29
- **Scope:** P0 website-owned application data lifecycle and external-retention boundary
- **Deployment:** `PAUSED`
- **Production astronomy/provider:** `PROVIDER DECISION DEFERRED`

This document freezes the technical vocabulary, category inventory, lifecycle
boundaries, enforcement classes, and readiness gates for P0 data retention.
It does not select retention durations, create a legal or regulatory schedule,
make a processor promise, or authorize runtime implementation. Any value that
is not already a source-defined technical expiry is explicitly
`POLICY REQUIRED`.

The contract distinguishes active-database erasure, technical expiry, cache
freshness, backup lifecycle, infrastructure logging, and processor-held
records. It is based on repository truth at the reviewed baseline. No source,
migration, manifest, dependency, deployment setting, or test is changed by
this document.

## 1. Scope

This contract covers the P0 categories that are present in, or explicitly
bounded by, the current Web repository:

- Auth sessions, Email Magic Link challenges, accounts, and identities;
- account-owned Vault charts, chart notes, and private Feedback;
- the typed privacy-access audit storage core;
- operational request observability;
- the process-local ChartResult cache;
- account export generation and transfer;
- account-deletion residual systems;
- PostgreSQL backups/snapshots, infrastructure logs, and email-processor
  records as external boundaries; and
- future OAuth-provider records only as a not-yet-present category.

The fixed product boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
```

Retention work must not move chart computation, provider selection, or
astronomy logic into the Website. `C:\NatalNode` is outside this repository
and outside this contract.

This is a technical contract, not legal advice and not a public retention
representation. No GDPR, CCPA, SOC 2, or other legal conclusion is made here.

## 2. Definitions

### 2.1 Technical expiration

Technical expiration is a source-defined condition under which a value is no
longer valid or should no longer be served. Examples are an Auth
`expires_at` predicate and the ChartResult cache TTL. Expiration is not proof
that a row has been physically deleted and is not, by itself, a product or
legal retention period.

### 2.2 Retention

Retention is the approved purpose, scope, and duration for keeping a category
after it is no longer needed for its immediate operation. A duration is not
invented in this document. The exact marker `POLICY REQUIRED` means the
runtime must not silently choose a fallback value.

### 2.3 Erasure

Erasure is an owner-triggered or account-triggered removal of active
application records under the account-deletion contract. It is not the same as
scheduled minimization and does not claim synchronous removal from backups,
platform logs, processor systems, or a file already delivered to a browser.

### 2.4 Backup lifecycle

Backup lifecycle is the creation, retention, access, restore, expiry, and
reconciliation of historical database copies or snapshots. It is external to
the active PostgreSQL transaction unless an explicitly approved operational
design says otherwise.

### 2.5 Ephemeral compute cache

An ephemeral compute cache is process-local derived state with a bounded
technical TTL/capacity and no account-owned persistence contract. Its expiry is
a freshness and memory/privacy control, not a user-data retention schedule.

### 2.6 Cleanup and enforcement

Cleanup is a bounded operation that removes rows eligible under a frozen
technical predicate and an approved policy. Enforcement also includes
owner-triggered deletion, account-wide erasure, cache expiry, provider
configuration, and backup operations. A cleanup executable is not evidence
that a scheduler, policy, or target environment is in place.

### 2.7 Readiness statuses

The following statuses are used in this document:

- `READY` — the bounded technical lifecycle is complete for the stated
  scope; this is not a production or legal-readiness claim.
- `POLICY-GATED` — a retention, access, exception, or erasure-fate decision
  is required before enforcement.
- `EXTERNAL/OPERATIONS-GATED` — a deployment, scheduler, platform, backup,
  sink, or operations control is required.
- `PROVIDER-DEPENDENT` — a not-yet-selected or not-yet-implemented provider
  controls the category.
- `NOT REQUIRED` — the category is not present or is intentionally not
  persisted for the current P0 scope.

## 3. Data-category inventory

The inventory below records the current owner/subject, purpose and persistence,
technical lifecycle, policy state, erasure/backup/processor interaction, and
future ownership. “Current” describes repository evidence; it does not
authorize a new implementation.

| ID | Category, owner, and subject | Purpose and current persistence | Current technical lifecycle | Policy status | Erasure, backup, and processor interaction | Future owner / readiness |
| --- | --- | --- | --- | --- | --- | --- |
| A | Auth sessions; account subject, owned by Auth/runtime | Bearer-session authorization in PostgreSQL `auth_sessions`; only a token hash, user ID, creation time, and expiry are persisted | Valid only while `expires_at > now`; logout deletes the matching row; expired rows remain until the bounded cleanup executable removes them | Session TTL is a source-defined security expiry, not retention; physical cleanup execution remains operationally gated | Account-root deletion removes sessions through the verified cascade; backups and host logs are outside the transaction; no separate processor record is created by the app | Auth/runtime plus Operations; expired-row enforcement `EXTERNAL/OPERATIONS-GATED` |
| B | Email Magic Link challenges; email identity subject, owned by Auth/runtime | One-time credential lifecycle in PostgreSQL `email_magic_link_challenges`; token hash and normalized email are persisted, never plaintext token | Active when unconsumed and unexpired; expired-unconsumed rows are eligible at the existing expiry predicate; consumed rows are invalid and have a separate cleanup phase | `AUTH_CONSUMED_CHALLENGE_RETENTION` — `POLICY REQUIRED`; no consumed-row duration or grace interval is selected | Account erasure explicitly deletes rows for the account’s normalized email identities; email delivery records are external; backups/host logs are outside the transaction | Auth/runtime plus Operations; expired phase `EXTERNAL/OPERATIONS-GATED`, consumed phase `POLICY-GATED` |
| C | Account and Auth identities; account owner is the user, subject is the account/email identity | `users` is the active account root; `auth_identities` stores provider and provider subject; PostgreSQL persistence | No normal time-based expiry for an active account; identity resolution/provisioning is event-driven; account deletion is a separate transaction | No automatic active-account deletion duration is approved; any post-deletion residual rule is `POLICY REQUIRED` | Deletion locks the account lifecycle, removes matching challenges, and deletes the user root with cascades; backups/logs/processors are not transaction participants | Auth/account owner plus Privacy/Operations; active lifecycle `READY` for current scope, residual reconciliation `EXTERNAL/OPERATIONS-GATED` |
| D | Vault charts; account-owned, subject is the user and chart | `charts` stores normalized birth input, canonical `ChartResult`, metadata, timestamps, and calculation/provenance fields in PostgreSQL | Create, update metadata, duplicate, owner-scoped read, and owner-scoped delete; no automatic time-based chart deletion exists | `VAULT_CHART_RETENTION` — `POLICY REQUIRED` only if time-based cleanup is later desired; no automatic active-chart deletion is invented | Account erasure removes charts through `users` cascade; individual chart deletion is not account erasure; backup behavior is external; no third-party processor is selected for the row | Vault owner plus Privacy/Product; owner/account erasure `READY`, time cleanup `POLICY-GATED` |
| E | Vault notes; account-owned, subject is the user and parent chart | `chart_notes` stores note content, chart/user ownership, and created/updated timestamps in PostgreSQL | Create, list, update content, and owner/parent-scoped delete; no time-based note cleanup exists | `VAULT_NOTE_RETENTION` — `POLICY REQUIRED`; no note TTL is invented | Account erasure removes notes through the verified user/chart cascades; individual note deletion is distinct; backups are external; no processor is selected | Vault owner plus Privacy/Product; owner/account erasure `READY`, time cleanup `POLICY-GATED` |
| F | Private Feedback; account-owned, subject is the authenticated user | Create-only `feedback_submissions` row with category, normalized message, owner ID, and creation time in PostgreSQL | Immutable after creation in the MVP; no history/delete route or cleanup job exists | `FEEDBACK_RETENTION` — `POLICY REQUIRED`; no review or support duration is invented | Account erasure removes the owner’s Feedback by cascade; any internal review access is future policy; backups/logs are external; no external processor is called by the route | Feedback owner plus authorized internal Operations; time cleanup `POLICY-GATED` |
| G | Privacy Access Audit events; restricted audit owner, subject may be an account | Typed append-only `audit_events` storage core with bounded opaque actor/subject IDs, action, resource category, outcome, request ID, and timestamp; no user FK/cascade | Append-only repository and migration exist; no privileged data-access surface or route integration exists; no cleanup is implemented | **AUDIT RETENTION DURATION — POLICY REQUIRED**; account-deletion fate and any non-identifying reconciliation are also `POLICY REQUIRED` | No automatic account cascade because the table intentionally has no account FK; backup/log/processor handling is external; operational request logs are not audit evidence | Privacy/Security with Operations; `POLICY-GATED` |
| H | Operational observability; operations subject is a request/process, not a user record | Bounded structured request completion record emitted as JSON Lines to stdout/stderr; fields include request ID, endpoint family, status, duration, bounded error/cache/scientific metadata | Emitted at request completion; no durable vendor or production sink is selected; no user-content logging is part of the contract | `OBSERVABILITY_RETENTION` — `POLICY REQUIRED`; sink ownership and access are also operational decisions | Not an erasure transaction participant and not proof of erasure; platform log copies/backups are external; no processor retention is inferred | Engineering/Operations; `POLICY-GATED` and `EXTERNAL/OPERATIONS-GATED` |
| I | ChartResult process-local cache; no account subject, derived from a calculation request | In-memory `Map` of complete `ChartResult` values keyed by canonical input plus versioned identity; not persisted | Fixed 15-minute TTL, hard maximum 512 entries, lazy expiry/LRU, clone on store/read, cleared on process restart | Technical cache TTL/capacity are source-defined; this is **EPHEMERAL COMPUTE CACHE**, not account retention | Not included in account export or active-database erasure; it is process-local and has no backup or processor archive | Calculation/cache owner; `READY` for the current ephemeral scope |
| J | Account export generation/transfer; subject is the requesting account | Read-only repeatable-read snapshot streams named account, identity, chart, note, and Feedback fields; no export row/job/token/archive is persisted | Two-stage prepare/transfer protocol; bounded lifecycle deadline and streamed JSON; transaction is committed/rolled back and resources released at stream end | `EXPORT_ARTIFACT_RETENTION` — `POLICY REQUIRED` only if a future design persists an artifact; current preferred outcome is no server archive | No server archive to erase or back up; a browser-held download is outside the app’s control; logs must not contain exported content; no Engine/provider call | Account/Privacy owner; current no-archive boundary `READY`, future artifact `POLICY-GATED` |
| K | Account-deletion/erasure lifecycle artifacts; subject is the deleted account | Current implementation owns an active-database transaction, not a tombstone, deletion ledger, export record, or durable deletion artifact | Lock account lifecycle, delete matching challenges, delete user root, rely on cascades, commit or roll back; no post-delete row is intentionally created | `ERASURE_RESIDUAL_RECONCILIATION` — `POLICY REQUIRED` for systems outside active PostgreSQL | Active rows are removed on commit; audit table is not cascaded; backups, infrastructure logs, provider records, and user-held exports are external residual systems | Privacy/Security/Operations; active DB `READY`, residual systems `EXTERNAL/OPERATIONS-GATED` |
| L | PostgreSQL backups/snapshots; infrastructure/operations owner, account subjects may be present | No backup provider, schedule, snapshot inventory, retention setting, or restore control is represented in repository source | External backup/restore lifecycle is not verified; active database migrations/pool do not establish backup semantics | **BACKUP RETENTION — EXTERNAL / OPERATIONS / POLICY REQUIRED** | Active erasure cannot claim immediate physical removal from historical copies; restore must reconcile deletion state before reactivation | Operations/hosting owner; `EXTERNAL/OPERATIONS-GATED` |
| M | Infrastructure/proxy/platform logs; infrastructure owner, request/process subjects | The app emits bounded stdout/stderr records; deployment/platform access-log retention is not verified because deployment is paused | External platform may retain operational records under its own configuration; no repository-controlled retention control exists | `INFRASTRUCTURE_LOG_RETENTION` — `EXTERNAL / OPERATIONS / POLICY REQUIRED` | Not an active account row and not synchronously erased by account deletion; no deletion or access claim is made for unverified platform logs | Operations/security owner; `EXTERNAL/OPERATIONS-GATED` |
| N | Email-provider/external processor records; Resend for P0 Auth email, email recipient is subject | Resend adapter sends normalized destination email plus sender, subject, text, and HTML containing the application-generated link; app stores no Resend account row | One provider request per delivery; provider delivery/event history is outside the Web repository | `EMAIL_PROCESSOR_RETENTION` — `EXTERNAL / PROCESSOR POLICY REQUIRED`; do not infer provider terms | Account deletion has no verified synchronous Resend delete step; processor logs and backups are external; no processor guarantee is claimed | Privacy/Operations with processor owner; `EXTERNAL/OPERATIONS-GATED` |
| O | Future OAuth-provider records; future account identity subject | Google is only a schema allowance; no OAuth route, state/PKCE flow, token exchange, provider adapter, or stored OAuth record exists | Not present in current P0 runtime; no future provider record is invented | `OAUTH_PROCESSOR_RETENTION` — `POLICY REQUIRED` and `PROVIDER-DEPENDENT` if Google Sign-In is approved | No current erasure, backup, or processor behavior to classify; future rollout needs its own security/privacy contract and export/erasure decision | Auth/Security plus selected provider; `NOT REQUIRED` now, `PROVIDER-DEPENDENT` later |

## 4. Current lifecycle matrix

### 4.1 Auth sessions

The runtime accepts only a session row whose `expires_at` is later than the
server-supplied `now`. `AUTH_SESSION_TTL_SECONDS` is a required positive
integer configuration input used by the authentication expiration policy. It
is a validity boundary, not a statement that the row is physically removed at
that instant.

The current cleanup implementation has a bounded `expired sessions` phase.
The PostgreSQL adapter selects rows satisfying `expires_at <= now`, deletes a
bounded batch in a short transaction, and reports whether more work may
remain. A user request does not depend on this cleanup for security: an
expired session is rejected before physical deletion. Logout remains a
separate owner-triggered revocation operation.

The cleanup executable exists, but no scheduler or target-environment
invocation is configured or verified. Therefore the technical predicate is
frozen while enforcement is `EXTERNAL/OPERATIONS-GATED`.

### 4.2 Email Magic Link challenges

The challenge state machine is:

| State | Authoritative database condition | Authentication meaning | Lifecycle action |
| --- | --- | --- | --- |
| Active/unconsumed/unexpired | `consumed_at IS NULL` and `expires_at > now` | May be consumed once | Preserve; no cleanup may shorten this window |
| Expired/unconsumed | `consumed_at IS NULL` and `expires_at <= now` | Cannot authenticate | Eligible for the expired-unconsumed phase |
| Consumed | `consumed_at IS NOT NULL` | Cannot authenticate again | Separate consumed-row cleanup phase; no duration or grace interval is selected |

`AUTH_MAGIC_LINK_TTL_SECONDS` is a required positive integer used to compute
`expires_at`. It is not a challenge-retention value. The current cleanup
primitive has independent expired-unconsumed and consumed phases. The
consumed predicate is based on committed consumption, but its operational
activation requires an approved `AUTH_CONSUMED_CHALLENGE_RETENTION` decision;
this contract does not turn that predicate into an unapproved retention
duration.

The challenge table has no `user_id` foreign key. Account erasure therefore
locks the normalized Email Magic Link identity set and explicitly deletes
matching challenge rows before deleting the user root. Scheduled cleanup must
not infer ownership from email or delete an unrelated account’s records.

### 4.3 Accounts and identities

An active `users` row and its `auth_identities` rows do not have a normal
time-based expiry. Identity provisioning and session issuance are event-driven.
Account deletion is an explicit, authenticated transaction: it serializes the
identity set, removes matching challenges, deletes exactly one user root, and
uses verified `ON DELETE CASCADE` relationships for identities, sessions,
charts, notes, and Feedback.

No inactive-account timer, soft-delete period, identity tombstone, blacklist,
or re-registration delay is added here. Any policy that would retain or
restrict post-deletion identity state is a separate `POLICY REQUIRED`
decision.

### 4.4 Vault charts and notes

Charts and notes are distinct account-owned categories even though notes have
a chart parent. Existing owner-scoped repositories support creation, reads,
metadata/content updates, duplication where applicable, and individual
deletion. The current schema and routes do not define automatic time-based
deletion for either category.

Account erasure removes both categories through the account root’s verified
cascades. This is not a chart retention schedule and does not authorize
unbounded cleanup, anonymization, or deletion of another account’s rows.

### 4.5 Private Feedback

Feedback is a private, immutable-after-creation PostgreSQL record owned by the
authenticated account. The current MVP has a create-only persistence
boundary; it has no support-history or standalone deletion/cleanup operation.
Account erasure removes the owner’s Feedback through the user cascade. A
separate policy is required before any time-based Feedback cleanup or internal
review retention is implemented.

### 4.6 Privacy Access Audit

The current B1 durable core provides a typed append-only repository and
`audit_events` migration. Events use bounded opaque identifiers and finite
actor/action/resource/outcome values. The table deliberately has no account
foreign key so a future governance-approved audit-retention design cannot be
assumed to cascade from ordinary account deletion.

No privileged data-access surface, reviewer role, audit-event integration, or
cleanup operation exists in the current P0 runtime. The audit stream is not
the request-observability stream, and neither export nor account deletion is
automatically a privacy-access audit event. Retention and deletion fate are
both policy-gated.

### 4.7 Operational observability

The current request middleware emits one bounded completion record to
stdout/stderr. It records operational facts such as timestamp, level, event,
opaque request ID, method, endpoint family, status, duration, bounded problem
code, cache status, Engine result generation, ChartResult contract version,
scientific status, and Engine duration where applicable.

It must not contain raw request bodies, email, account/user identifiers,
birth data, Vault names, Feedback text, cookies, tokens, raw IP addresses, or
user-agent strings. No durable production sink, platform retention setting, or
operations owner is verified. Retention is therefore policy- and
operations-gated.

### 4.8 ChartResult cache

The current cache is an in-memory `Map` of complete `ChartResult` values. The
source-defined technical controls are:

- fixed 15-minute TTL beginning at store time, without sliding extension;
- hard maximum of 512 entries per process;
- lazy expiry and LRU eviction;
- clone on store and clone on hit so callers do not share internal state; and
- process restart clears all entries.

The cache is an `EPHEMERAL COMPUTE CACHE`. It is not exported, not persisted
in PostgreSQL, not included in account erasure, and not evidence that an
account’s data has been removed from every system. A future persistent or
identity-sensitive cache would require a new contract.

### 4.9 Account export

The current export design uses a bounded prepare request followed by a native
stream transfer. Stage 2 owns a read-only repeatable-read PostgreSQL snapshot,
streams named account-owned fields, and commits or rolls back the snapshot at
the stream lifecycle boundary. It creates no export row, job, token, audit row,
archive, object-store file, temporary file, or reusable URL. Stage 1 is only a
bounded advisory preflight; it creates no preparation record. Stage 2 emits
incremental stream chunks and does not materialize a complete export object or
whole-document buffer in application storage.

The current preferred retention outcome for server-generated export material
is therefore no retained archive. The browser-held download is outside the
application’s storage boundary. If a future design introduces a persisted
export artifact, its retention, access, deletion, backup, and processor
semantics require a new policy decision before implementation.

### 4.10 Account deletion and residual systems

Committed account deletion is authoritative for the active application graph:
the user root, Auth identities/sessions, owner-linked charts/notes, and
Feedback are removed, and account-linked challenges are explicitly deleted.
The transaction has no distributed participant for infrastructure logs,
backups, Resend history, or a file already transferred to a browser.

The current erasure implementation does not create a tombstone, exception
ledger, durable deletion proof, or identity-bearing audit record. This is a
data-minimization outcome, not a claim that external systems are synchronously
erased. Backup restore reconciliation and any policy-preserved audit fate
remain unresolved decisions.

## 5. Policy-parameter registry

The registry separates source-defined technical inputs from policy values that
must be supplied by Privacy/Product/Security/Operations owners. No row below
may receive an undocumented default fallback.

| Parameter | Category / consumer | Current status | Safe consequence when absent |
| --- | --- | --- | --- |
| `AUTH_MAGIC_LINK_TTL_SECONDS` | Auth challenge validity; environment parser and expiration policy | Source-defined required positive integer; not a retention value | Configuration remains invalid; do not infer a lifetime |
| `AUTH_SESSION_TTL_SECONDS` | Auth session validity; environment parser and expiration policy | Source-defined required positive integer; not a retention value | Configuration remains invalid; do not infer a lifetime |
| `AUTH_CONSUMED_CHALLENGE_RETENTION` | Committed consumed-challenge cleanup phase | **POLICY REQUIRED**; no duration/grace value approved | Do not enable/schedule consumed-row enforcement; preserve existing validity semantics |
| `VAULT_CHART_RETENTION` | Optional time-based chart cleanup | **POLICY REQUIRED**; no automatic active-chart deletion exists | Do not add time-based chart cleanup; retain current owner/account deletion behavior |
| `VAULT_NOTE_RETENTION` | Optional time-based note cleanup | **POLICY REQUIRED**; no note TTL exists | Do not add time-based note cleanup; retain current owner/account deletion behavior |
| `FEEDBACK_RETENTION` | Feedback cleanup/review lifecycle | **POLICY REQUIRED**; current MVP is create-only | Do not add a cleanup job or review-retention claim |
| `AUDIT_RETENTION_DURATION` | Privacy Access Audit cleanup and access governance | **AUDIT RETENTION DURATION — POLICY REQUIRED** | Do not schedule audit cleanup; preserve the separate append-only core and resolve deletion interaction first |
| `OBSERVABILITY_RETENTION` | Application operational sink | **POLICY REQUIRED**; durable production sink is not selected | Do not claim downstream log deletion or configure an invented sink policy |
| `INFRASTRUCTURE_LOG_RETENTION` | Proxy/platform/hosting logs | **EXTERNAL / OPERATIONS / POLICY REQUIRED** | No repository-side claim; deployment remains paused |
| `BACKUP_RETENTION` | PostgreSQL backup/snapshot lifecycle | **EXTERNAL / OPERATIONS / POLICY REQUIRED** | Do not claim backup erasure, restore safety, or a backup duration |
| `EMAIL_PROCESSOR_RETENTION` | Resend delivery/event records | **EXTERNAL / PROCESSOR POLICY REQUIRED** | Do not infer provider terms or add an unsupported synchronous delete |
| `EXPORT_ARTIFACT_RETENTION` | Future persisted export artifact only | **POLICY REQUIRED if artifact storage is introduced**; no current artifact exists | Keep the current no-archive design; do not create export jobs/files |
| `ERASURE_RESIDUAL_RECONCILIATION` | Backups, platform logs, processors, and restore handling | **POLICY REQUIRED / OPERATIONS REQUIRED** | Limit claims to active PostgreSQL erasure and keep external behavior unresolved |
| `OAUTH_PROCESSOR_RETENTION` | Future Google/OAuth identity/provider records | **POLICY REQUIRED / PROVIDER-DEPENDENT**; no current OAuth record exists | Keep Google Sign-In unimplemented; `PROVIDER DECISION DEFERRED` |

The registry is a policy input boundary, not a new environment-variable
proposal. Retention parameters must be approved and owned before a cleanup
consumer is enabled. Technical TTLs may remain source-defined where they
already protect validity or ephemeral memory.

## 6. Erasure interaction

Retention cleanup and account erasure are separate mechanisms with different
authorities:

1. Account erasure uses the authenticated principal; the browser cannot choose
   an arbitrary account or email.
2. The PostgreSQL erasure repository owns one transaction, locks the relevant
   Auth lifecycle identity set, explicitly deletes matching Email Magic Link
   challenges, and deletes exactly one `users` root.
3. Verified cascades remove `auth_identities`, `auth_sessions`, `charts`,
   `chart_notes`, and `feedback_submissions` belonging to the root.
4. Individual chart/note deletion remains an owner-scoped operation and must
   not be represented as account deletion.
5. Scheduled retention cleanup must never replace, delay, or weaken account
   erasure. It may safely race only under its own bounded predicates and must
   not recreate rows.
6. The current `audit_events` table has no account FK/cascade. Whether a
   future policy-preserved audit event survives account erasure, is minimized,
   or is excluded from a future integration is **POLICY REQUIRED**.
7. Operational logs, infrastructure logs, backups, Resend records, and a
   browser-held export are not PostgreSQL transaction participants. No
   distributed atomic-erasure claim is made.
8. The preferred no-retention outcome is preserved where data is not stored:
   the export path stores no archive, the cache stores no persistent account
   row, and deletion creates no tombstone or identity-bearing ledger.

An account deletion response may truthfully establish active-database
erasure. It must not be described as instant deletion from every external or
historical system without approved evidence and policy.

## 7. Backup/restore interaction

The repository contains PostgreSQL migration and pool code but no verified
backup schedule, snapshot inventory, backup-retention setting, restore job,
restore ledger, or production backup provider. Backup behavior is therefore
`EXTERNAL / OPERATIONS / POLICY REQUIRED`.

The technical contract is:

- active account erasure must not be represented as immediate physical removal
  from historical backups;
- an approved restore process must prevent a deleted account from silently
  becoming durably active again after restore;
- the restore reconciliation mechanism, suppression state, or equivalent
  control must be approved by Privacy/Security/Operations before live claims;
- backup copies are not an account-export source and must not be added to the
  export payload; and
- no backup frequency, retention duration, recovery objective, or deletion
  guarantee is invented here.

This contract does not choose a deletion ledger. A future restore design may
require one or another reconciliation control, but it must minimize identity
state and be separately reviewed rather than being smuggled into application
retention code.

## 8. External processor interaction

### 8.1 PostgreSQL and hosting

The active account graph is represented in PostgreSQL and is covered by the
application erasure transaction. Hosting-provider backups, storage snapshots,
access logs, and operator access are external to that transaction. No
deployment or backup implementation is present in this task.

### 8.2 Resend email delivery

The implemented Resend adapter sends one request containing the configured
sender, normalized recipient email, subject, text, and HTML. The adapter
receives the final application-generated magic-link URL and does not receive
or persist a raw token in the application. The Web repository has no verified
Resend-side account row or deletion API to call during account erasure.

Resend delivery/event retention, provider access, backups, and deletion
behavior remain `EXTERNAL / PROCESSOR POLICY REQUIRED`. Resend terms are not
reproduced or inferred here, and no retention duration is assigned.

### 8.3 Future OAuth

Google Sign-In is not implemented. The `GOOGLE` schema allowance is not an
active processor record and does not authorize OAuth state/PKCE, credentials,
token exchange, or provider disclosure. If OAuth is later approved, its
provider record, export, erasure, retention, and processor boundary require a
separate security/privacy contract. `PROVIDER DECISION DEFERRED` remains
authoritative.

## 9. Enforcement mechanisms

| Enforcement class | Current or future use | Contract boundary | Readiness |
| --- | --- | --- | --- |
| Logical expiry | Auth sessions and unconsumed challenges | Reject expired values from the request path; cleanup lag must not extend validity | `READY` for validity; physical enforcement is separately gated |
| Scheduled database cleanup | Auth expired/consumed rows; future Vault/Feedback/Audit cleanup | Explicit internal command, policy-approved predicates, bounded batches, no browser route | `POLICY-GATED` or `EXTERNAL/OPERATIONS-GATED` by category |
| Owner-triggered deletion | Individual Vault chart/note deletion and future owner-scoped operations | Authenticated principal and owner/parent predicates; not a retention timer | `READY` for existing current operations |
| Account-wide erasure | User root, identities, sessions, charts, notes, Feedback, matching challenges | One transactional active-database boundary; no distributed processor claim | `READY` for active DB, external residuals gated |
| Ephemeral memory expiry | ChartResult cache | Source-defined TTL/capacity, clone boundaries, restart clearing, no PostgreSQL persistence | `READY` for current cache scope |
| Provider/infra configuration | Resend records and platform logs | Provider/hosting owner controls storage and access; repository cannot infer terms | `EXTERNAL/OPERATIONS-GATED` |
| Backup lifecycle and restore | PostgreSQL backups/snapshots | Operations-owned retention, restore reconciliation, and access controls | `EXTERNAL/OPERATIONS-GATED` |
| Policy-preserved append-only retention | Future privacy-access audit governance | Requires explicit access role, subject treatment, retention, deletion interaction, and review workflow | `POLICY-GATED` |

### 9.1 Scheduler boundary

The current Auth cleanup implementation is an explicit internal maintenance
executable, not an HTTP endpoint and not a browser-triggered operation. It runs
the three independent phases with a server `Clock`, bounded batch input, short
PostgreSQL transactions, and a bounded result. A full batch reports
`moreWork`; it does not loop until a table is empty.

No scheduler cadence, cloud cron, database scheduler, hosting scheduler,
worker fleet, or deployment binding is selected. A future scheduler must
provide reliable invocation, bounded retries, idempotent execution,
multi-instance safety, and failure observability. Exactly-once delivery is not
required for correctness. Scheduler binding is `EXTERNAL/OPERATIONS-GATED`.

## 10. Failure semantics

### 10.1 Cleanup failures

Every database cleanup phase must be a short transaction over a bounded set of
eligible keys. On query or selection failure it rolls back. On an ambiguous
commit or unsafe client state it must not return the client to the pool as
healthy. A later invocation is the recovery mechanism; an ambiguous commit is
not silently retried as though it definitely failed.

A cleanup failure must:

- leave the failed batch rolled back where the transaction outcome is known;
- leave active/valid account data and Auth validity unchanged;
- expose a bounded operational failure to the maintenance boundary;
- support safe, idempotent retry; and
- avoid a fake success or a claim that all copies were deleted.

If a policy value is missing, the consumer remains disabled or unenforced
according to its category. It must not substitute a guessed duration.

### 10.2 Account erasure failures

Account erasure is authoritative only after its active-database transaction
commits. Errors before commit roll back the account graph and must not return
success or clear the cookie as if deletion succeeded. External logs, backups,
processors, and browser-held files are not incorrectly reported as rolled back
or erased by that transaction.

### 10.3 Export and cache failures

The export stream must omit the final JSON delimiters when a read,
serialization, backpressure, timeout, or client-disconnect failure occurs
before successful transaction completion. It must release or discard resources
according to the existing lifecycle boundary and must not persist a partial
archive.

The ChartResult cache is an optimization. Clone, read, or write failure
evicts/discards the unsafe cache value and allows a fresh calculation where
the current calculation boundary permits it. Cache failure is not account
erasure and does not create a retention exception.

### 10.4 Batching policy

Cleanup operations must use stable eligible-key ordering, a bounded batch, and
a short transaction. The current Auth cleanup source freezes a default and
maximum batch size of 100; this is an implementation/resource bound, not a
retention duration. No future category cleanup may issue an unbounded full-table
delete or accept a browser-supplied batch size.

## 11. Logging and privacy rules

Retention and cleanup logging must remain within the existing bounded
operational observability boundary. A future maintenance event may contain
only finite phase/outcome values, duration, bounded `moreWork` state, and an
aggregate count only if Operations later proves it necessary. Current Auth
maintenance output contains bounded phase outcomes and does not require row
counts.

Never log or emit from cleanup:

- email or normalized email;
- session/token hashes, challenge tokens, cookies, or request bodies;
- user, account, identity, session, challenge, chart, note, or Feedback IDs;
- birth date, time, place, normalized chart input, `ChartResult`, note content,
  Feedback text, or SQL parameters; or
- per-account deletion/cleanup records.

The privacy-access audit stream is separate. Its contract permits bounded
opaque actor and subject identifiers for a future authorized audit purpose,
but does not authorize putting those fields into ordinary operational logs.
Operational request logs do not prove privileged access, export receipt,
account erasure, backup deletion, or processor deletion.

## 12. Implementation-readiness matrix

Readiness is assessed for the lifecycle boundary named in the row, not as a
claim that the whole product is launch-ready.

| Boundary | What is technically present | Missing precondition | Readiness |
| --- | --- | --- | --- |
| Auth expired sessions | Expiry predicate, bounded PostgreSQL cleanup, internal executable | Target scheduler/operations binding and target-environment runbook | `EXTERNAL/OPERATIONS-GATED` |
| Auth expired unconsumed challenges | Expiry predicate, bounded cleanup phase, account-erasure separation | Target scheduler/operations binding and target-environment verification | `EXTERNAL/OPERATIONS-GATED` |
| Auth consumed challenges | Separate committed-consumed cleanup predicate and phase | Approved consumed-row retention/fate policy plus scheduler activation | `POLICY-GATED` |
| Auth active account/identity | No active-account timer; transactional erasure boundary exists | External residual/restore policy for a complete release claim | `READY` for current active-DB boundary |
| Vault charts | Owner operations and account cascade exist | Policy value and bounded design for optional time cleanup | `POLICY-GATED` for time cleanup |
| Vault notes | Owner/parent operations and account cascades exist | Policy value and bounded design for optional time cleanup | `POLICY-GATED` for time cleanup |
| Private Feedback | Create-only owner persistence and account cascade exist | Feedback retention/review policy and cleanup design | `POLICY-GATED` |
| Privacy Access Audit | Typed append-only core and migration exist | Privileged surface, roles, retention duration, deletion interaction, operations | `POLICY-GATED` |
| Operational observability | Bounded request records to stdout/stderr | Production sink, owner, access, and retention policy | `EXTERNAL/OPERATIONS-GATED` |
| ChartResult cache | Process-local TTL/capacity/clone/eviction behavior | None for current ephemeral scope; future persistence would need review | `READY` |
| Account export | Streaming no-archive boundary and resource lifecycle | None for current no-archive technical scope; future artifact policy if changed | `READY` |
| Active account erasure | Transactional root deletion and cascades | Backup/restore, infra-log, processor reconciliation | `EXTERNAL/OPERATIONS-GATED` for external completeness |
| PostgreSQL backups | No repository-controlled backup lifecycle | Operations owner, retention, restore reconciliation, access | `EXTERNAL/OPERATIONS-GATED` |
| Infrastructure/platform logs | App log minimization only | Platform retention/access configuration and deployment evidence | `EXTERNAL/OPERATIONS-GATED` |
| Resend records | Provider-neutral adapter boundary | Processor retention/access decision and verified provider behavior | `EXTERNAL/OPERATIONS-GATED` |
| Future OAuth records | No current record or implementation | Approved provider, security contract, processor policy | `NOT REQUIRED` now; `PROVIDER-DEPENDENT` later |

`READY` in this matrix does not authorize deployment, a public claim, or an
unreviewed policy value. A boundary that needs a duration is not marked
`READY` for its time-based enforcement.

## 13. Future implementation slices

The following are candidate sequencing boundaries, not automatic task
authorization. They must not be collapsed into a generic retention framework.

### Candidate A — P0 retention policy and ownership decision

Approve the registry values, scope, owners, exceptions, audit deletion fate,
backup/restore reconciliation principle, processor disclosures, and scheduler
ownership. This is the next decision gate and is not runtime implementation.

### Candidate B1 — Auth maintenance binding

After policy and Operations approve the consumed-challenge treatment and
choose a scheduler, bind the existing internal Auth maintenance executable to
that controlled invocation. Preserve the source-backed expiry predicates,
server clock, bounded batches, idempotence, failure outcome, and privacy
minimization. Do not expose a browser/API cleanup route.

### Candidate B2 — Category-specific cleanup after policy

Only after category-specific values and owners are approved, implement focused
cleanup for Vault, notes, Feedback, Privacy Access Audit, or durable
observability sinks where a real need exists. Each category requires its own
predicate, owner boundary, batch behavior, erasure interaction, and tests. No
automatic chart/note/Feedback deletion is authorized by this document.

### Candidate B3 — Backup/restore operations

Operations and Privacy/Security must define backup access, retention, restore
reconciliation, and the control that prevents an erased account from being
silently reactivated. This is not a reason to add speculative application
tables or a backup provider to the Web repository.

### Candidate C — Focused adversarial review

Before a release claim, review the contract against account erasure, export,
Auth cleanup, audit, observability, cache, backups, infrastructure logs,
Resend, and future OAuth boundaries. Verify that no duration, legal claim,
provider guarantee, or privacy-sensitive log field was introduced by
implementation.

## 14. Release blockers

The following are P0 release blockers or launch-claim blockers, even though
some are outside local implementation:

- retention duration/scope and owners for Auth consumed challenges, Vault,
  notes, Feedback, audit, observability, infrastructure logs, backups, and
  processor records;
- the policy decision governing Privacy Access Audit retention and its
  interaction with account erasure;
- reliable scheduler/operations binding and target-environment verification
  for Auth cleanup;
- production sink/access/retention controls for operational logs;
- backup/restore reconciliation that respects committed erasure;
- processor/privacy decisions for Resend records;
- privileged access roles and integration for the audit core;
- deployment, database, credential, DNS/TLS, and live-environment evidence;
- legal/public copy decisions outside this technical contract; and
- production Engine/AstronomyProvider gates, which remain
  `PROVIDER DECISION DEFERRED`.

The absence of a policy value must not be hidden by a fallback cleanup period.
The absence of a verified external system must not be described as a failed
local deletion or as a successful external deletion.

## 15. Deferred, policy, and external decisions

The following decisions remain explicitly open:

1. Every parameter marked `POLICY REQUIRED` in section 5, including scope,
   exceptions, owners, and effective enforcement boundary.
2. Whether committed consumed challenge rows receive any policy-preserved
   period or are only technically eligible after consumption; no duration is
   selected here.
3. Whether any time-based Vault, note, or Feedback cleanup is needed at all.
4. Privacy Access Audit access roles, privileged surfaces, reviewer workflow,
   retention, and account-deletion treatment.
5. Operational observability sink, retention, access, and failure ownership.
6. PostgreSQL backup frequency, retention, access, restore process, and
   deletion reconciliation.
7. Infrastructure/proxy/platform log retention and access.
8. Resend processor retention and deletion behavior that can be truthfully
   disclosed.
9. Any future OAuth provider, record shape, processor policy, export, and
   erasure behavior.
10. The deployment-native scheduler and target-environment verification.

No item above is resolved by this document. `PROVIDER DECISION DEFERRED`
continues to govern production astronomy/provider selection.

The single recommended next action is:

> **P0 retention policy/operations approval — approve the section 5 parameter registry, category owners, Privacy Access Audit deletion interaction, backup/restore reconciliation principle, processor boundaries, and scheduler owner before any retention-enforcement implementation.**

This is one policy/operations decision task. It is recommended, not executed
by `WEB-RETENTION-001A`.

## 16. Explicit non-goals

This task does not:

- modify `server/src`, `apps/web`, `packages`, `scripts`, tests, migrations,
  manifests, lockfiles, or runtime configuration;
- implement or schedule cleanup;
- add a generic retention framework, worker, queue, cron, or provider;
- choose a retention duration or legal exception;
- implement privileged audit access or reviewer tooling;
- change account deletion, export, Auth validity, Vault, Feedback,
  observability, or cache behavior;
- implement backup/restore, platform-log, Resend, or OAuth deletion;
- access or modify `C:\NatalNode`;
- implement HTTP or production Engine integration;
- add astronomy/provider logic, Current Transits, or any P1/P2/P3 feature; or
- start the recommended policy/operations action automatically.

The contract is complete at the technical-boundary level while policy values,
external controls, and enforcement implementation remain deferred.
