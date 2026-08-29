# NatalNode Privacy Access Audit Technical Contract V1

| Field | Value |
|---|---|
| Status | **APPROVED TECHNICAL CONTRACT / IMPLEMENTATION DEFERRED** |
| Runtime status | **NOT IMPLEMENTED** |
| Task | `WEB-PRIVACY-AUDIT-001A` |
| Scope | P0 privacy access accountability for privileged non-owner access |
| Decision date | 2026-08-29 |
| Reviewed baseline | `ed6303640f759a33ee67998338c4bf9cbfb4262d` (`fix: harden vault chart duplication`) |

`PROVIDER DECISION DEFERRED.`

This document freezes a provider-neutral, privacy-minimized technical contract
for a future P0 Privacy Access Audit stream. It does not implement an audit
subsystem, create a database table, add a repository, add routes, or authorize
any role. It is not legal advice, a regulatory certification, a retention
schedule, or a public privacy-policy statement.

The contract deliberately keeps two concepts separate:

```text
P0 Privacy Access Audit
    -> durable accountability for approved privileged access to private data

P0 Operational Observability
    -> bounded service availability, outcome, latency, and compatibility facts
```

## 1. Purpose and authority

The PRD requires least privilege, deletion/export capability, retention
policy, and access audit for sensitive birth and chart data. The current
repository has bounded operational request observability but no durable
privacy-access audit mechanism. This contract supplies the missing technical
boundary without inventing an operational role model or a retention period.

The contract is authoritative for future implementation planning until an
approved successor changes it. The source-of-truth product boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
```

No audit event may create a direct browser-to-provider path, reveal an
astronomy provider, or move scientific responsibility into the Website API.

## 2. Sources and bounded review

The following authoritative documents were read in full for this freeze:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/product/NATALNODE_P0_READINESS_CHECKPOINT_V1.md`
- `docs/product/NATALNODE_OBSERVABILITY_V1.md`

The minimum supporting product contracts inspected were:

- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`
- `docs/product/NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md`
- `docs/product/NATALNODE_ACCOUNT_DATA_EXPORT_V1.md`
- `docs/product/NATALNODE_AUTH_LIFECYCLE_CLEANUP_V1.md`
- `docs/product/NATALNODE_API_PROBLEM_DETAILS_V1.md`

The minimum current implementation/schema boundaries inspected were:

- `server/src/app/observability/api-request-observability.ts`;
- `server/src/app/auth/request-authenticator.ts`,
  `server/src/app/auth/require-authentication.ts`, and
  `server/src/app/auth/authenticated-context.ts`;
- the current Auth session, account deletion, account export, Vault chart,
  Vault note, and Feedback route modules under `server/src/app/routes/`;
- `server/src/persistence/vault-chart-repository.ts`,
  `server/src/persistence/chart-note-repository.ts`,
  `server/src/persistence/feedback-submission-repository.ts`,
  `server/src/persistence/user-repository.ts`, and
  `server/src/persistence/auth-session-repository.ts`;
- the current Auth/Vault/Feedback migrations under
  `server/db/migrations/`; and
- `server/src/maintenance/auth-lifecycle-maintenance.ts` and its internal
  executable boundary.

The separate `C:\NatalNode` repository was not accessed.

## 3. Current repository reality

### 3.1 No current privileged data-access surface

The current repository has no implemented staff, support, administrative, or
other non-owner surface that reads, exports, reviews, or deletes another
account's private product data. It has no approved privileged role taxonomy,
impersonation flow, break-glass path, or audit-review API.

The current `AuthenticatedPrincipal` contains only:

- a server-derived `userId`; and
- an immutable server-derived `sessionCreatedAt`.

It does not carry a role, staff identity, support identity, authorization
grant, or service identity. `requireAuthentication` establishes ordinary
authenticated-owner access; it is not a privileged-access authorization
boundary.

The current account deletion, account export, Vault, Vault-note, and Feedback
routes derive ownership from that authenticated principal. The browser cannot
select a different account, and the normal user endpoints have no admin mode.
The internal Auth lifecycle maintenance executable is bounded housekeeping
for expired/consumed Auth rows. It is not a user-data review surface and does
not establish a general privileged-access model. Whether category-level Auth
maintenance is separately auditable remains policy-gated.

### 3.2 No current durable audit mechanism

The current migrations contain users, Auth, Vault, notes, and private Feedback
tables, but no `audit_events` table. The current persistence interfaces contain
no privacy-access audit repository. No application route or UI exposes audit
records.

This contract therefore defines future hook points without claiming that a
current access event is being recorded.

### 3.3 Observability remains a different stream

The existing `api.request.completed` record is an operational record. It is
bounded to server-generated request correlation, method, endpoint family,
status, duration, and approved internal calculation projections where
applicable. It intentionally excludes account/resource identity, request and
response content, Vault IDs, and private data.

Operational records answer whether a bounded API boundary handled a request.
They do not prove which actor accessed which user's data. They must not be
redefined, enriched with actor/subject identity, or treated as durable
privacy-access evidence.

## 4. Privacy access boundary

### 4.1 `PrivilegedPrivacyAccess`

For this contract, `PrivilegedPrivacyAccess` is a server-side authorization
decision that would allow a non-owner human or an approved internal service to
read, export, delete, or review account/private-product data outside the
ordinary authenticated owner's self-service flow.

The concept is a technical boundary, not a role name. It becomes valid only
after the server has:

1. authenticated or otherwise server-established the actor identity;
2. resolved the subject account from trusted server state, never from an
   arbitrary client-supplied audit field;
3. classified the requested resource into the bounded category enum below;
4. evaluated an approved authorization policy; and
5. reached the mandatory audit append boundary.

No role, staff title, support title, or permission taxonomy is invented here.
The future implementation must consume an approved authorization policy.

### 4.2 In-scope resource categories

The future event model uses this bounded category set:

| `resourceCategory` | Technical scope | Current status |
|---|---|---|
| `ACCOUNT` | Account/profile records that are actually present in the approved application graph | No privileged surface |
| `AUTH` | Category-level access to account/authentication security records | Ordinary Auth exists; no privileged review surface |
| `VAULT` | Saved charts, normalized birth input, chart snapshots, metadata, and notes | Owner self-service only |
| `ACCOUNT_EXPORT` | A future staff-assisted or internal export operation | Owner self-service export is not privileged access |
| `ACCOUNT_DELETION` | A future staff-assisted or internal deletion/erasure operation | Current deletion is owner self-service only |
| `FEEDBACK` | Identifiable/private Feedback submissions | Current surface is authenticated create-only |
| `AUDIT` | The privacy-access audit records themselves during an approved review operation | Reserved for future privileged review |

`AUDIT` is included only to give the audit trail's own review access a bounded
technical category. It does not create a current review endpoint or a generic
event-log category. `SKY`, `LEARN`, `TRANSITS`, Engine/provider data, public
scientific reference data, analytics, and advertising are not audit categories
in this contract.

### 4.3 What is not privileged privacy access

The following remain outside the durable Privacy Access Audit unless a later
approved contract creates a genuinely privileged operation:

- an authenticated owner reading, saving, duplicating, renaming, tagging,
  favoriting, annotating, or deleting the owner's own Vault data;
- an authenticated owner using the owner's own account export;
- an authenticated owner deleting the owner's own account;
- ordinary owner authentication, session inspection, and logout;
- a user submitting private Feedback through the current create-only route;
- unauthenticated requests, invalid requests, ordinary 401/403 responses,
  rate-limit outcomes, origin failures, and server failures with no evaluated
  privileged access decision;
- current Auth lifecycle cleanup of technically unusable rows, unless a
  future policy explicitly classifies that maintenance as an auditable
  privileged operation; and
- operational observability, security events, metrics, analytics, or general
  application logs.

Owner self-service is an authorization boundary, but it is not automatically a
privileged non-owner privacy access event merely because the data is sensitive.

## 5. Minimal durable event model

The following is a private technical shape for the future repository. It is a
contract illustration, not a new exported package type in this task:

```ts
interface PrivacyAccessAuditEvent {
  readonly auditEventId: string;
  readonly occurredAt: string;
  readonly actorType: 'HUMAN' | 'SERVICE';
  readonly actorId: string;
  readonly subjectAccountId?: string;
  readonly action: 'READ' | 'EXPORT' | 'DELETE' | 'REVIEW';
  readonly resourceCategory:
    | 'ACCOUNT'
    | 'AUTH'
    | 'VAULT'
    | 'ACCOUNT_EXPORT'
    | 'ACCOUNT_DELETION'
    | 'FEEDBACK'
    | 'AUDIT';
  readonly outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  readonly requestId?: string;
  readonly reasonCode?: string;
}
```

`subjectAccountId` is required for account-scoped product categories. It may
be absent only for a bounded `AUDIT` review that legitimately spans multiple
subjects; a review narrowed to one subject includes that subject's opaque
account identifier. The event never stores a display name, email, or content
to compensate for a missing subject.

### 5.1 Field classification

| Field or concept | Classification | Frozen rule |
|---|---|---|
| `auditEventId` | REQUIRED | Server-generated opaque event identifier; never client-supplied and never a scientific/provider ID |
| `occurredAt` | REQUIRED | Server-generated UTC timestamp from the server clock; no client timestamp |
| `actorType` | REQUIRED | Bounded `HUMAN` or `SERVICE`; technical identity kind only, not a role taxonomy |
| `actorId` | REQUIRED | Server-derived opaque/stable actor identity; authenticated human or approved internal service only |
| `subjectAccountId` | REQUIRED conditionally | Opaque server-resolved account identifier for account-scoped data; optional only for multi-subject `AUDIT` review |
| `action` | REQUIRED | Bounded `READ`, `EXPORT`, `DELETE`, or `REVIEW`; no endpoint-generated free-form action strings |
| `resourceCategory` | REQUIRED | The bounded enum in section 4.2 |
| `outcome` | REQUIRED | Bounded `SUCCESS`, `DENIED`, or `FAILED` |
| `requestId` | OPTIONAL | Current server-generated request ID when an API request exists; correlation only, never actor or subject identity |
| `reasonCode` | POLICY-GATED | Absent until an approved finite reason-code policy exists; no arbitrary client string |
| Human-entered reason/comment | PROHIBITED by V1 | No free-form justification, comment, exception text, or support note in the audit event |
| Role/title/permission label | PROHIBITED by V1 | No unapproved role taxonomy and no arbitrary actor labels are persisted |
| Specific resource ID | PROHIBITED by V1 | No chart ID, note ID, Feedback ID, export ID, or other resource locator in the minimal event |
| Generic metadata/payload field | PROHIBITED | No `metadata JSON`, request/response copy, or arbitrary key/value extension |

The required event is intentionally small. A successor contract may add a
bounded field only after a separate privacy/security review proves that the
account category and action are insufficient and defines the field's source,
cardinality, retention, and deletion behavior.

## 6. Actor semantics

Actor identity must be attributable where technically possible, but it must
not be supplied by the browser or copied from a free-form header.

- For `HUMAN`, `actorId` comes from a server-authenticated privileged actor
  context established by an approved authorization policy. It is opaque and
  stable; it is not an email, display name, session ID, token, or role label.
- For `SERVICE`, `actorId` comes from a server-controlled bounded service
  identity. It is not a provider name, provider URL, Engine request ID, API
  key, deployment secret, or arbitrary request label.
- `actorType` is the only technical actor-kind field in V1. It does not grant
  access. Authentication, service identity, and authorization must be
  separately verified before the audit boundary is reached.
- If a server cannot establish a valid actor identity, it has not reached a
  `PrivilegedPrivacyAccess` decision. The request remains an ordinary
  authentication/security outcome and must not manufacture an audit actor.

The future implementation must reject, normalize, or omit any actor metadata
that did not originate from a trusted server boundary. It must not let a
caller choose `HUMAN`, `SERVICE`, `actorId`, or an audit outcome in a request
body.

## 7. Subject semantics

The subject is the account whose private data would be accessed. The minimum
accountability identity is one opaque, server-resolved account identifier.

The subject field must not contain:

- email, phone number, display name, legal name, or location;
- birth date, birth time, coordinates, timezone, or location label;
- a chart name, note text, Feedback body, export content, or account payload;
- a client-selected account selector; or
- a provider, Engine, or external identity.

The subject account identifier is not copied into ordinary operational
observability. It exists only in the restricted audit stream and is subject to
the separate audit retention/access policy. It must not be used to turn the
audit trail into a general analytics dimension.

## 8. Specific-resource-ID decision

V1 does not include a specific resource ID. The current product contracts
already provide a meaningful accountability boundary through actor, subject
account, bounded resource category, action, and outcome. A chart/note/Feedback
ID would increase linkability and sensitivity without being required by any
current privileged surface.

If a future support workflow proves that category-level accountability is
insufficient, adding one opaque server-controlled resource identifier is a
policy-gated successor decision. It must never include or be derived from a
display name, birth data, note text, Feedback content, export payload, URL, or
client-supplied value. It is not part of `WEB-PRIVACY-AUDIT-001B1` by default.

## 9. Action and outcome semantics

### 9.1 Action enum

The action set is intentionally bounded:

- `READ` — a privileged non-owner read/access to a product-data category;
- `EXPORT` — a privileged export of a product-data category;
- `DELETE` — a privileged deletion/erasure operation;
- `REVIEW` — a privileged review of the audit trail itself, used with
  `resourceCategory: AUDIT`.

No current route is granted any of these actions. There is no endpoint-name
action, arbitrary phrase, or one action per future route. An operation that
does not fit this set requires a successor contract rather than a free-form
string.

### 9.2 Outcome enum

- `SUCCESS` means the approved privileged operation completed at its defined
  boundary and the relevant result was made available only after the durable
  event append succeeded.
- `DENIED` means a valid privileged-access decision was evaluated and the
  approved authorization policy rejected it. No private result is released.
- `FAILED` means an authorized operation could not complete because of a
  bounded internal/dependency failure. The event contains no exception text,
  stack, SQL, provider response, or sensitive result.

An unauthenticated request or a request that never resolves a valid privileged
actor/subject is not a `DENIED` privacy-access event; it remains an ordinary
security/operational outcome. This prevents arbitrary internet traffic from
being turned into a subject-bearing audit stream.

## 10. Append and failure semantics

### 10.1 Append-only application contract

The future application boundary is narrowly equivalent to:

```ts
interface PrivacyAccessAuditRepository {
  append(event: PrivacyAccessAuditEvent): Promise<void>;
}
```

The repository must accept the typed bounded event only. It must not expose a
generic `save(any)`, `log(object)`, arbitrary metadata map, or caller-selected
database target. Normal application semantics are:

- create an event;
- permit restricted review through a separately authorized boundary when that
  policy exists;
- never update an event;
- never rewrite history; and
- do not provide a normal operator-delete API.

### 10.2 Fail-closed default

The audit append is part of the privileged access gate. If a privileged
privacy-sensitive operation would otherwise succeed but the durable append
fails, the technical default is **FAIL CLOSED**:

1. do not return, stream, or otherwise release the private result;
2. do not commit the privileged mutation as a successful operation;
3. return a bounded internal failure where an HTTP boundary exists;
4. do not invent an emergency exception or silently downgrade to ordinary
   operational logging; and
5. emit only a bounded non-sensitive operational signal if the existing
   observability boundary can record it, without treating that signal as audit
   evidence.

Supported integrations must hold the result until the audit event is durably
appended, or coordinate the operation and append in one transaction where the
storage boundary permits it. If an integration cannot prevent a successful
private result or mutation from escaping before an append decision, that
integration is not ready for `WEB-PRIVACY-AUDIT-001B2`.

An append failure must not trigger unbounded retries, fallback payloads,
recursive logging, or raw error serialization. If a failure event itself
cannot be appended, the operation remains failed closed; its absence is an
operational incident requiring the future operations policy rather than a
reason to bypass the gate.

### 10.3 Failure event truthfulness

An event with `FAILED` is written only when the operation failure can itself be
recorded through a successful append. A failed append never becomes a fake
`FAILED` event. No event may claim `SUCCESS` merely because authorization
passed or an HTTP response was constructed.

## 11. Privacy minimization and prohibited content

Privacy access audit records are themselves security/privacy-sensitive data.
They reveal who accessed which user's data category and when. They therefore
require stricter access controls than normal application logs.

The following content is prohibited in audit events, audit repository errors,
audit review responses, and audit-related operational records unless a later
explicit policy/successor contract says otherwise:

- birth date, birth time, latitude, longitude, timezone, offset, or
  `locationLabel`;
- `ChartRequest`, `ChartResult`, planetary positions, signs, houses, aspects,
  angles, retrograde state, warnings, or scientific calculation details;
- canonical input, normalized input, chart snapshots, interpretation text,
  Vault chart content, Vault notes, display names, tags, or favorites;
- Feedback body, category, email content, export payload, or account payload;
- email address, phone number, display name, legal name, or raw user identity;
- magic-link tokens, challenge secrets, token hashes, OAuth tokens, session
  tokens, cookies, API keys, credentials, or lock material;
- raw client IP unless a separate approved policy explicitly permits it;
- raw User-Agent, Origin, Referer, URL, query string, or route parameter;
- raw Error objects, messages, causes, stack traces, SQL, database errors,
  provider responses, cache keys, request hashes, or deployment details; and
- arbitrary metadata, unbounded labels, or provider-specific identifiers.

The minimal event fields are the entire approved payload for V1. In
particular, a bounded event must not be used as a hidden copy of the data that
was accessed.

## 12. Audit-read access and audit-read auditing

### 12.1 Restricted audit-read boundary

Audit records must be readable only through a future narrowly scoped internal
review boundary. There is no public API, ordinary authenticated-user API,
Vault UI, export inclusion, or browser endpoint for audit records.

Concrete reviewer authorization is unresolved and must be supplied by an
approved role/access policy. The audit repository and any review service must
enforce that policy server-side; an actor may not self-declare reviewer status.

### 12.2 Audit the audit trail without recursion

Future access to audit records should itself create a bounded audit event when
the review operation is actually performed. The event uses:

```text
action           = REVIEW
resourceCategory = AUDIT
```

If the review is scoped to one account, it may include that opaque
`subjectAccountId`; a multi-subject review may omit it. The append operation
that records this review event is not recursively audited. No second audit
event is generated for the act of appending the first event.

This is a technical requirement for a future review surface, not a current
review route. If policy later rejects auditing audit-read access, that must be
recorded as an explicit successor decision rather than silently omitted.

## 13. Corrections and tamper evidence

An audit record is immutable after append. If a bounded factual correction is
needed, append an additional corrective/superseding event under a separately
approved action/category convention. Do not mutate or delete the original
record through a normal operator API.

P0 does not introduce hash chains, blockchain, Merkle trees, digital
signatures, or another cryptographic ledger. Application-level append-only
semantics, restricted database permissions, and later infrastructure controls
are sufficient for this contract unless a new source-backed requirement says
otherwise.

## 14. Retention and account-lifecycle interaction

The contract intentionally freezes no duration:

```text
AUDIT RETENTION DURATION — POLICY REQUIRED
```

Audit retention is distinct from:

- operational-observability retention;
- Vault chart/note retention;
- Auth session/challenge cleanup;
- account deletion/erasure behavior; and
- database-backup or processor retention.

No cleanup code, scheduled deletion, TTL column, or retention job is added by
this task. Future enforcement must follow an approved retention policy,
including scope, duration, exception handling, backup/restore treatment,
review access, and deletion/correction semantics.

The account export contract excludes operational records and audit rows. The
account-erasure contract keeps privacy-access auditing separate from the
active owner-linked deletion transaction. Therefore:

- owner self-service export/deletion does not automatically create a
  privileged privacy-access event;
- a future staff-assisted export/deletion must be audited under
  `ACCOUNT_EXPORT` or `ACCOUNT_DELETION`; and
- the fate of audit records whose subject account is later deleted is
  **POLICY REQUIRED**. The future table must not attach an accidental
  `ON DELETE CASCADE` to `users` and must not silently promise either
  indefinite retention or immediate erasure.

## 15. Storage direction

PostgreSQL is the future durable storage direction because it is the current
application persistence boundary and the PRD already names `audit_events` in
the launch database direction. This is a direction only; no migration is
created here.

The future table should use narrow typed columns equivalent to:

```text
audit_event_id       opaque event identifier
occurred_at          server UTC timestamp
actor_type           bounded actor-kind value
actor_id             opaque server-derived actor identity
subject_account_id   opaque account identifier, nullable only for multi-subject audit review
action               bounded action value
resource_category    bounded category value
outcome              bounded outcome value
request_id           nullable server-generated request correlation
reason_code          nullable and policy-gated
```

The table must not use a generic JSON metadata blob, store payload copies, or
depend on a client-selected owner. Database constraints and grants should
enforce bounded values and append/review separation. A foreign-key cascade
from `users` is not selected because audit retention versus account erasure is
policy-gated; this does not authorize retaining records indefinitely.

Future migrations must follow the repository's existing numbered SQL
convention and transaction style. No table, index, grant, trigger, or
repository is part of this documentation task.

## 16. Implementation-readiness matrix

| Decision area | Status | Frozen result or dependency |
|---|---|---|
| Operational observability separation | FROZEN TECHNICAL | `api.request.completed` remains operational only; it is not audit evidence |
| Privileged-access definition | FROZEN TECHNICAL | Non-owner human/service access outside ordinary owner self-service |
| Actor type/identity source | FROZEN TECHNICAL | `HUMAN`/`SERVICE`, server-derived opaque identity only |
| Subject identity | FROZEN TECHNICAL | Opaque server-resolved account ID only for account-scoped access |
| Resource/action/outcome enums | FROZEN TECHNICAL | Bounded category, action, and outcome sets in this document |
| Specific resource ID | FROZEN TECHNICAL | Omitted in V1; successor addition requires policy/security review |
| Required reason/comment | POLICY REQUIRED | No free-form reason; finite `reasonCode` only after approval |
| Authorized human/service roles | POLICY REQUIRED | Approved role/authorization policy is absent and must not be invented |
| Audit-reviewer authorization | POLICY REQUIRED | No reviewer role or public/read API exists |
| Break-glass behavior | POLICY REQUIRED | No emergency exception is defined |
| Audit retention duration/scope | POLICY REQUIRED | `AUDIT RETENTION DURATION — POLICY REQUIRED` |
| Audit record treatment on account deletion | POLICY REQUIRED | Do not infer cascade, deletion, or indefinite retention |
| Audit storage direction | FROZEN TECHNICAL | Future typed PostgreSQL `audit_events` direction; no migration now |
| Append/failure semantics | FROZEN TECHNICAL | Append-only and fail closed for privileged privacy-sensitive access |
| Database grants, backups, alerting, and review operations | EXTERNAL / OPERATIONS REQUIRED | Must be designed and verified for the deployed environment |
| Runtime schema/repository implementation | IMPLEMENTATION DEFERRED | B1 only after this contract is accepted |
| Integration into privileged surfaces | IMPLEMENTATION DEFERRED / POLICY-GATED | B2 waits for real surfaces and approved authorization policy |

## 17. Future implementation slices

### `WEB-PRIVACY-AUDIT-001B1` — Implement Durable Privacy Access Audit Core

**READY as a local technical slice**, provided it remains limited to the
provider-neutral core and does not invent authorization.

The slice may add:

- a typed private `PrivacyAccessAuditEvent` contract;
- a narrow `PrivacyAccessAuditRepository.append(event)` boundary;
- a PostgreSQL migration for a typed, bounded append-only table;
- database/application constraints for the frozen enums and field bounds; and
- focused tests for serialization, prohibited content, append-only behavior,
  server-derived identity handoff, and failure handling.

It must not add roles, staff accounts, support consoles, audit routes, audit
UI, retention cleanup, break-glass, provider fields, or a public API. It must
not make the current owner routes emit subject-bearing audit records.

### `WEB-PRIVACY-AUDIT-001B2` — Integrate mandatory hooks into actual privileged surfaces

**POLICY-GATED / BLOCKED until such surfaces exist.**

This slice may integrate the append gate into approved staff/support/service
operations only after:

- an authorized role/service policy exists;
- a real privileged non-owner surface is defined;
- actor and subject resolution are server-derived;
- action/category coverage is approved; and
- the fail-closed release/transaction behavior is testable.

If no such surface exists when B1 completes, B2 remains deferred; the absence
of an admin route is not a reason to invent one.

### `WEB-PRIVACY-AUDIT-001C` — Adversarial privacy/authorization/failure review

Review the durable core and any later integrations for cross-account access,
actor spoofing, subject leakage, append failure, denial semantics, audit-read
recursion, retention interaction, deletion/export interaction, log injection,
and provider-boundary preservation. This is a focused review, not a broad
repository audit.

## 18. Explicit non-goals and integrity constraints

This contract does not authorize:

- admin/support/staff role creation or permission assignment;
- impersonation, break-glass, support console, or multi-account public APIs;
- changes to Auth, Vault, Feedback, account export, or account deletion routes;
- treating owner self-service as privileged access;
- audit access through ordinary user-facing APIs;
- general security-event or analytics logging;
- provider/Engine identity, provider URLs, scientific facts, or astronomy
  logic;
- changes to `ChartRequest`, `ChartResult`, the EngineClient, resolver,
  renderer, BFF, or scientific provenance contracts;
- legal/privacy pages, legal claims, or retention durations;
- Google OAuth, deployment, staging, credentials, or external services; or
- any access to or modification of `C:\NatalNode`.

Expected runtime/dependency impact of this task is zero. The only intended
repository changes are this contract and the living P0 checkpoint update.

## 19. Freeze conclusion

The repository now has an approved technical contract for Privacy Access
Audit, but it does not have an implemented audit subsystem or a current
privileged data-access surface.

The frozen decision is:

```text
Operational observability      = separate, non-audit evidence
Privileged privacy access      = bounded non-owner human/service boundary
Audit event                    = typed, minimal, append-only, privacy-minimized
Audit append failure           = FAIL CLOSED
Audit retention                = POLICY REQUIRED
Authorized roles/reviewers     = POLICY REQUIRED
Current privileged surface    = NONE
B1 durable core                = READY
B2 surface integration         = POLICY-GATED / DEFERRED
Provider decision              = DEFERRED
```

Exactly one next action is recommended:

> **WEB-PRIVACY-AUDIT-001B1 — Implement Durable Privacy Access Audit Core.**

This recommendation is not executed by `WEB-PRIVACY-AUDIT-001A`.
