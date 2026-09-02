# NatalNode Account Deletion and Account-Wide Erasure Contract V1

| Field | Value |
|---|---|
| Status | **APPROVED TECHNICAL DIRECTION** |
| Runtime status | **RUNTIME IMPLEMENTATION DEFERRED** |
| Task | WEB-PRIVACY-001A |
| Scope | P0 account deletion and active application-data erasure |
| Decision date | 2026-08-27 |

## Current launch-readiness implementation amendment

The header and implementation-deferred language above preserve the original
technical decision record. The current repository has the authenticated,
recent-authentication-gated account erasure route and PostgreSQL transaction.
Its current graph includes later Foundations, Reward/commercial, notification,
Community, and Practitioner relationships according to migrations `0017`–`0019`.
Backups, infrastructure logs, processors, privacy-audit rows, and browser-held
exports remain external residual boundaries. See the current reconciliation in
[`NATALNODE_P0_LAUNCH_READINESS_V1.md`](./NATALNODE_P0_LAUNCH_READINESS_V1.md).

## 1. Purpose

This document freezes the executable technical contract for self-service account deletion before runtime implementation begins. It defines the account-linked data graph, the authoritative deletion root, authorization and confirmation requirements, transaction and rollback semantics, magic-link and session treatment, truthful limits for logs and backups, and bounded implementation phases.

This is a technical architecture decision. It is not runtime code, a database migration, legal copy, a retention schedule, a processor selection, or a deployment approval.

The approved direction is **hard deletion** of the active account root and ordinary owner-linked application data. NatalNode must not describe chart deletion, account deactivation, or a hidden/disabled identity as account deletion.

## 2. Sources and repository scope

The contract is based on repository truth at baseline `0d1bbeca1082c786010c3f4c40b08ec0315ea3fc` (`docs: checkpoint p0 readiness`), principally:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`
- `docs/product/NATALNODE_P0_READINESS_CHECKPOINT_V1.md`
- `docs/adr/WEB-AUTH-002A-email-magic-link-delivery.md`
- `docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md`
- `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`
- `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`
- `server/db/migrations/0001_auth_vault_baseline.sql`
- `server/db/migrations/0002_auth_runtime.sql`
- `server/db/migrations/0003_auth_identity_provisioning_fk.sql`
- `server/db/migrations/0004_private_feedback.sql`
- the corresponding Auth, Vault, Feedback, PostgreSQL persistence, origin-enforcement, cookie, observability, and runtime-composition code under `server/src/`

No evidence was found in the current migrations or repositories of another persisted row containing `user_id`, `account_id`, `identity_id`, or normalized email beyond the entities catalogued below. Future schema additions must update this contract or an approved successor before account deletion ships against the expanded graph.

## 3. Current-state audit

### 3.1 Account and identity model

- The authoritative account entity is `users`; its primary identifier is `users.user_id`.
- `users` does not store email.
- Login identities are rows in `auth_identities`, linked through `auth_identities.user_id -> users.user_id ON DELETE CASCADE`.
- The current email identity has `provider = 'EMAIL_MAGIC_LINK'`; its normalized email is stored as `auth_identities.provider_subject` and is unique with the provider.
- A normalized email is also stored in `email_magic_link_challenges.email_normalized`. That table has no foreign key to `users` or `auth_identities`.
- A challenge can therefore exist before and without an account.
- The current completion flow consumes a valid challenge first, then calls identity provisioning. `PostgresAuthIdentityProvisioningRepository.resolveOrCreate()` uses a single data-modifying PostgreSQL statement and the deferred identity-to-user foreign key to resolve an existing identity or create a new `users` row and identity together.
- An account/identity is not provisioned merely because a challenge was issued. Provisioning occurs only after successful challenge consumption.
- The schema can hold multiple identities per user, although the only implemented sign-in provider is Email Magic Link.

### 3.2 Session model

- `auth_sessions.session_token_hash` is the server-side primary key; raw session tokens are not persisted.
- Each session belongs to one account through `auth_sessions.user_id -> users.user_id ON DELETE CASCADE`.
- Authentication reads the host-only session cookie, hashes the token, loads an active unexpired session, and produces an `AuthenticatedPrincipal` containing `userId`.
- The session record has `created_at`, but the current principal does not expose it. Current runtime code therefore cannot yet enforce recent authentication at the deletion boundary.
- The current repository can delete one session by token hash for sign-out; it has no explicit delete-all-by-user method. Deleting the `users` root already provides database-enforced all-session revocation.
- The cookie policy is host-only, `HttpOnly`, `SameSite=Lax`, `Path=/`, with `Secure` controlled by validated deployment configuration.

### 3.3 Vault and birth/chart data

- `charts.user_id -> users.user_id ON DELETE CASCADE`.
- A `charts` row contains the saved chart's display name, category, tags, favorite state, normalized birth input, canonical `ChartResult` snapshot, engine/schema/config/provenance metadata, and timestamps.
- `chart_notes` is owner-linked both to `charts` and `users`, with `ON DELETE CASCADE` on each foreign key.
- Existing repositories support owner-scoped individual chart and note deletion. Those operations are not account deletion.
- Persisted personal birth input and saved chart output found in the current application schema reside in owner-linked `charts` rows. Guest calculation state is in-memory/client state rather than an account-owned database row.
- Public/current Sky facts are not user-owned and are outside this erasure graph.

### 3.4 Private Feedback

- `feedback_submissions.user_id -> users.user_id ON DELETE CASCADE`.
- Private Feedback is created from `authenticatedPrincipal.userId`; the request cannot nominate another owner.
- The Feedback repository is create-only. No explicit repository deletion is needed for account erasure because the database cascade is authoritative.
- The account Feedback rate limiter derives a process-local HMAC key from `userId`. It does not persist `userId`, Feedback text, or another account row, and entries expire/prune or disappear with the process. It is not part of the authoritative database transaction.

### 3.5 Current gaps

- There is no account-erasure repository, route, account-management page, recent-auth deletion guard, or focused erasure test suite.
- `EmailMagicLinkChallengeRepository` has no account/email cleanup operation.
- The general `SqlExecutor` exposes individual queries and no application-composable transaction API. Independent calls to the existing repositories cannot satisfy this contract's atomicity requirement.
- Challenge issue, challenge consumption/provisioning, session creation, and future account erasure do not yet share a normalized-email lifecycle serialization boundary.
- Backup retention, restore reconciliation, infrastructure-log retention, and Resend retention are not verified by repository code.

## 4. Account-linked data graph

| Data entity | Storage location/table | Ownership/linkage | Personal or sensitive data? | Current `ON DELETE` behavior | Current repository deletion behavior | Required account-erasure behavior | Implementation gap | Policy dependency |
|---|---|---|---|---|---|---|---|---|
| Account root | `users` | `user_id` is authoritative account ID | Pseudonymous account identifier and timestamps | Root; no parent FK | Create/find only | Hard-delete exactly the authenticated account row | No account-erasure operation | None for technical hard-delete direction |
| Auth identities | `auth_identities` | `user_id`; normalized email is `provider_subject` for `EMAIL_MAGIC_LINK` | Yes: login identity and normalized email | `user_id -> users.user_id ON DELETE CASCADE`; FK is deferrable | Create/find/list; provision resolve-or-create | Delete all identities through user-root cascade | Erasure implementation must capture email subjects before root deletion | Re-registration policy confirmation |
| Auth sessions | `auth_sessions` | `user_id`; hashed session token | Yes: authentication credential linkage | `user_id -> users.user_id ON DELETE CASCADE` | Create/find active/delete one token hash | Delete every account session through user-root cascade | Route must clear current browser cookie only after commit | Recent-auth maximum age |
| Magic-link challenges | `email_magic_link_challenges` | Normalized email only; no account FK | Yes: normalized email and hashed one-time credential | No cascade | Create/consume by token hash only | Delete all challenge rows matching every account-linked email identity, regardless of consumed/expired state | Email cleanup and auth-lifecycle concurrency control absent | Scheduled cleanup for unrelated rows is separate |
| Vault charts and saved snapshots | `charts` | `user_id` | Yes: birth inputs, canonical chart snapshot, names/tags/category/favorite, metadata | `user_id -> users.user_id ON DELETE CASCADE` | Owner-scoped create/read/list/update/delete-one | Delete through user-root cascade | Verify cascade in focused integration tests | None |
| Vault notes | `chart_notes` | `user_id` and `chart_id` | Yes: owner-authored text and relationships | Both FKs use `ON DELETE CASCADE` | Owner-scoped create/read/update/delete-one | Delete through user/chart cascades | Verify no reachable notes after deletion | None |
| Private Feedback | `feedback_submissions` | `user_id` | Yes: authenticated message/category | `user_id -> users.user_id ON DELETE CASCADE` | Authenticated create only | Delete through user-root cascade | Verify cascade in focused integration tests | Standalone Feedback history/delete remains separate P1 work |
| Account rate-limit state | Process-local HMAC map | HMAC derived transiently from `userId`; no raw ID persisted | Privacy-relevant but pseudonymized and ephemeral | Not applicable | Expiry/pruning/process lifetime | No transaction work; allow natural bounded expiry | None in active database | Infrastructure operations still govern process/runtime telemetry |
| Request observability | Application operational log records | Request ID and bounded endpoint family, not account linkage | Intended to be non-identifying | Not applicable | Emitted per request | Emit only bounded deletion endpoint/status metadata; never email, user ID, confirmation, row counts, or payload | Infrastructure retention/access unknown | Operations policy required |

No public Sky record, shared scientific fact, contract fixture, or scientific/provider implementation is an account-owned row in this graph.

## 5. Approved deletion scope

Successful account deletion means all of the following have committed in the active application database:

1. the authenticated `users` root no longer exists;
2. every linked `auth_identities` row is gone;
3. every linked `auth_sessions` row is gone;
4. every `email_magic_link_challenges` row for each normalized email linked to that account at deletion time is gone, including outstanding, consumed, and expired rows;
5. all owner-linked `charts` rows, including normalized birth input, canonical result snapshots, display metadata, categories, tags, favorite state, and provenance stored in those rows, are gone;
6. all owner-linked `chart_notes` rows are gone;
7. all owner-linked `feedback_submissions` rows are gone.

The operation is hard deletion, not deactivation or soft deletion. It introduces no account tombstone, blacklist, or identity-bearing deletion ledger. No active application row is approved to remain for a technical or invented legal-retention reason.

### 5.1 Explicit exclusions

The following are outside the authoritative account-data transaction:

- public/current Sky facts and other non-user-owned scientific data;
- guest chart state held only in browser memory;
- application bundles, fixtures, contracts, and shared scientific reference data;
- privacy-minimized operational logs that contain no account/email/content fields;
- historical infrastructure backups governed by a separately approved retention and restore policy;
- processor-side delivery/operational records whose existence and retention are controlled by the processor and operations policy;
- scheduled cleanup of challenge rows belonging to emails not linked to the deleting account;
- data export, retention enforcement, privacy-access auditing, Privacy/Terms publication, Google Sign-In, and staging deployment.

These exclusions do not permit owner-linked active database rows to survive deletion. They limit only claims about data outside that graph.

## 6. Authorization and destructive confirmation

### 6.1 Deletion authority

- The authenticated session is the sole source of the deletion target.
- The normal user endpoint must not accept `userId`, `accountId`, email, identity ID, or another target selector from the browser.
- The endpoint is self-service for the current account owner only. It is not an admin deletion endpoint.
- It must reuse `requireAuthentication` and the established exact-Origin protection for unsafe same-origin API requests.
- Cookies remain the session-authentication mechanism. No session or magic-link token belongs in the JSON body.

### 6.2 Explicit confirmation

Deletion must require a deliberate destructive confirmation surface, not one click. The frozen functional pattern is:

1. the user opens **Delete account** from the account-management surface;
2. the surface states, as policy-reviewable functional placeholder copy, that deletion permanently removes the NatalNode account and saved data;
3. the user types the exact, case-sensitive confirmation phrase `DELETE`;
4. only then is the final destructive action enabled and submitted.

The phrase prevents accidental activation; it is not authentication and does not replace recent auth. No email address or account identifier is required as a phrase. Final public wording remains subject to privacy/product review and must not invent backup, legal, or jurisdictional promises.

### 6.3 Recent authentication

The approved security mechanism is:

**authenticated session + explicit `DELETE` confirmation + a finite recent-authentication requirement.**

Because NatalNode is passwordless, recent auth means the current session was newly issued by successful Email Magic Link completion within an approved maximum age. It does not mean password entry and does not introduce a reauthentication token in the deletion body.

Implementation must preserve the verified session's `created_at` in the authenticated deletion context, or load it through a narrowly scoped deletion authorization path, and reject a session older than the approved maximum. The current `AuthenticatedPrincipal` exposes only `userId`, so this is a bounded runtime gap.

The exact maximum age is not selected by current approved policy and **blocks WEB-PRIVACY-001B**. The implementation must not invent it. WEB-PRIVACY-001C may use the existing magic-link flow to obtain a new ordinary session and return only to a fixed `/account` destination; it must not introduce arbitrary return URLs.

## 7. Browser/BFF API contract

### 7.1 Request

The proposed route is:

```http
DELETE /api/account
Content-Type: application/json
Cookie: <host-only HttpOnly session cookie>
Origin: <exact configured public web origin>

{"confirmation":"DELETE"}
```

`DELETE` matches the existing resource-deletion convention. The body is strict JSON containing exactly one string field, `confirmation`. Unknown fields, missing fields, a non-string value, malformed JSON, or a non-matching phrase are invalid. The body never contains an account target or authentication credential.

The existing same-origin unsafe-request middleware must run before the route. The endpoint must also receive an appropriately bounded rate-limit policy consistent with existing P0 staging controls; rate limiting is defense in depth and never deletion authority.

### 7.2 Success

```http
204 No Content
Set-Cookie: <expired session cookie using the existing cookie policy>
```

Success has no response body and returns no deleted personal data, identifiers, counts, or snapshots. A `204` is sent only after the authoritative database transaction commits. The current browser cookie is expired in the committed success response; all other issued cookies become unusable because their backing session rows were deleted.

### 7.3 Error model

Until a coordinated repository-wide error-envelope migration occurs, the endpoint uses the current bounded JSON shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Bounded non-sensitive message."
  }
}
```

| Condition | HTTP | Code | Contract |
|---|---:|---|---|
| Malformed/extra request fields or wrong confirmation phrase | 400 | `INVALID_REQUEST` | Generic validation failure; do not echo the phrase or payload |
| Missing, expired, invalid, or already-deleted session | 401 | `UNAUTHORIZED` | Same response regardless of account/email existence |
| Authenticated session is older than the approved recent-auth window | 403 | `RECENT_AUTHENTICATION_REQUIRED` | Instruct the client to complete fresh passwordless auth without revealing account data |
| Database transaction, serialization, or commit failure | 500 | `INTERNAL_ERROR` | Roll back and emit no topology, row count, or partial-state detail |
| Unexpected internal failure | 500 | `INTERNAL_ERROR` | Use the existing generic boundary |

There is no “deletion in progress” state, tombstone, or asynchronous database workflow in this contract, so `409 Conflict` is not part of V1. A repeat after a committed deletion normally receives `401 UNAUTHORIZED` because the session and account are gone.

## 8. Canonical erasure sequence

The implementation must preserve this sequence and its security properties:

1. Apply standard API observability and security headers, exact-Origin enforcement, and bounded rate limiting in the established middleware order.
2. Authenticate the host-only session cookie. Derive `userId` only from the verified server-side session.
3. Strictly validate the `DELETE` request body and exact confirmation phrase.
4. Verify that the authenticated session satisfies the approved recent-auth maximum age.
5. Enter one account-erasure database transaction owned by a narrowly scoped account-erasure persistence boundary.
6. Read the candidate set of `auth_identities.provider_subject` values for that user where `provider = 'EMAIL_MAGIC_LINK'`; this read does not retarget deletion by email.
7. Acquire the shared normalized-email Auth lifecycle serialization boundary for the candidate subjects in deterministic order, before locking or mutating account rows. Challenge issuance, challenge consumption/provisioning/session creation, and account erasure must all use this same lock order.
8. Lock the target `users` row and fail as unauthenticated/not found if it no longer exists. Never retarget by email.
9. Re-read the user's Email Magic Link subjects while the account row is locked. If the set differs from the locked candidate set, roll back and retry the whole transaction with the complete set; never acquire newly discovered email locks out of order.
10. Delete every `email_magic_link_challenges` row whose `email_normalized` matches any collected subject.
11. Delete exactly one `users` root row. Database cascades delete all linked identities, all sessions, Vault charts and notes, and Private Feedback.
12. Verify that exactly one user root was deleted and commit. Do not execute independent “best effort” deletes after commit.
13. Only after commit, send `204 No Content` and expire the current browser session cookie.
14. The client clears authenticated/private cached state, becomes signed out, and navigates to `/`.

The preferred concurrency mechanism is a transaction-scoped PostgreSQL advisory lock keyed from a stable, non-logged digest of normalized email. Another implementation is acceptable only if it provides the same cross-operation database serialization without persisting a personal-data lock/tombstone. Merely deleting currently visible challenge rows without coordinating concurrent issue/consume operations does not satisfy this contract.

Future identity-linking flows must participate in the same lifecycle boundary before they can add or consume an email identity during erasure.

## 9. Transaction, cascade, and repository policy

### 9.1 Atomicity

- All authoritative application-database changes in the canonical sequence must occur in **one PostgreSQL transaction**.
- The `users` row is the authoritative deletion root. Existing verified `ON DELETE CASCADE` constraints own deletion of identities, sessions, charts, notes, and Feedback.
- Magic-link challenges require an explicit delete in the same transaction because they have only email linkage and no user foreign key.
- Database-managed cascades must not be duplicated with unordered application deletes merely to count or log personal rows.
- The operation must verify deletion of exactly one root account before commit.

### 9.2 Persistence boundary

Current `SqlExecutor` query calls do not form a safe multi-query transaction. WEB-PRIVACY-001B must introduce a narrowly scoped `AccountErasureRepository` (or equivalently explicit account-erasure persistence service) backed by a single checked-out PostgreSQL transaction. A single atomic data-modifying statement is also acceptable if it fully implements the locking, challenge cleanup, root deletion, and exact-root-count requirements.

The implementation must not compose existing repositories as independent calls and must not add a generic repository-wide “delete everything” helper. The transaction boundary owns only this account graph. No schema migration is intrinsically required by the current graph; implementation must stop for review if satisfying the concurrency invariant reveals a genuine migration requirement.

### 9.3 Failure and rollback

- Validation, authentication, and recent-auth failure occur before destructive database work.
- Any error before commit rolls back the entire account-erasure transaction. Ordinary application failure must leave the authoritative account graph intact rather than partly erased.
- A failed/rolled-back request returns a generic error and does not expire the browser cookie or claim success.
- The server-side session rows are deleted inside the transaction through the root cascade. Cookie expiration is a response action only after commit.
- External logs, backups, and processor retention are not falsely treated as transaction participants. This contract does not claim distributed atomicity.

## 10. Authentication lifecycle treatment

### 10.1 All-session revocation

A committed root deletion must leave zero `auth_sessions` rows for the account. This invalidates the current session and every other device session atomically. Cookies on other devices may remain physically stored until the browser replaces/expires them, but authentication must fail immediately because no backing token hash exists.

The deleting browser receives the standard expired-cookie serialization after commit. Cookie clearing alone is never considered session revocation.

### 10.2 Magic-link challenges

All challenge rows matching every normalized Email Magic Link identity attached to the account are deleted, not only unconsumed rows. This removes outstanding credentials and minimizes historical email linkage without requiring account linkage that the table does not have.

Expired/consumed challenge rows for unrelated emails remain the responsibility of separate scheduled Auth cleanup and retention work. Account deletion must not perform a global challenge purge.

A challenge issued before deletion must not remain usable after the transaction. The shared normalized-email lifecycle serialization requirement prevents issuance or consumption from racing past erasure. A challenge explicitly requested after deletion commits is a new authentication event and may provision a new account under the re-registration policy below.

## 11. Product-data treatment

### 11.1 Vault

Root deletion cascades through `charts.user_id` and both `chart_notes` foreign keys. This erases saved normalized birth input, canonical `ChartResult` snapshots, engine/schema/config/provenance metadata, chart display names, categories, tags, favorites, timestamps, and notes.

No chart-by-chart repository loop is permitted or needed. Focused tests must demonstrate that charts and notes belonging to the deleted user are absent, while another user's records remain untouched. Individual chart/note deletion remains a separate Vault behavior and must never be represented as account deletion.

### 11.2 Private Feedback

Root deletion cascades through `feedback_submissions.user_id`. No explicit Feedback repository delete is required. Focused tests must prove only the deleting user's Feedback disappears. Standalone Feedback history/delete remains separate P1 work and is not a prerequisite for account-wide erasure.

### 11.3 Scientific boundary

The workflow deletes only owner-linked persisted application rows. It does not modify chart calculations, canonical contracts, Engine/provider behavior, public Sky facts, scientific reference data, or scientific ownership semantics. Public/shared scientific data is not pulled into erasure merely because the product displays it.

## 12. Retry and idempotency semantics

- A double submission that reaches the server serializes on the account lifecycle. At most one request can delete the root and receive `204`.
- A later request using a session removed by the first committed deletion receives `401 UNAUTHORIZED`.
- If the network fails after commit, the account remains deleted. A retry normally receives `401`; this is truthful and does not mean rollback occurred.
- If the transaction fails before commit, the caller may retry using the still-valid session, subject to recent-auth age and rate limits.
- V1 requires no idempotency key and no deletion-in-progress record. The system must never recreate account state or retain a tombstone to manufacture a repeat `204`.

## 13. Re-registration semantics

The safe technical default is to allow a deleted email to complete a newly requested, valid magic link and create a **new** account with new internal user and identity identifiers. The new account must not reconnect to deleted charts, notes, Feedback, sessions, metadata, or other former account state.

No email blacklist or permanent identity tombstone is approved. Any policy decision to prohibit or delay re-registration would require a separately approved retention basis and design before implementation; runtime code must not invent one. A token issued before deletion is invalidated by deletion and is not a valid re-registration path. Only a challenge issued after committed deletion can begin the new-account path.

## 14. Logs, backups, and processor boundary

### 14.1 Application logs

Current application observability is deliberately bounded to operational fields such as timestamp, level, event, request ID, method, endpoint family, status, and duration. The audited logging path does not intentionally include email, account ID, birth data, Vault names, Feedback text, cookies, raw request bodies, raw IP addresses, or user-agent strings.

The deletion route must preserve that minimization. It may emit a bounded endpoint family such as `account.delete` and status/duration, but must never log normalized email, `userId`, identity/session identifiers, confirmation content, personal payloads, deleted row counts, or SQL details. Application-database erasure is not a promise of instant removal from infrastructure logs. Infrastructure-log retention and access remain **POLICY / OPERATIONS DECISION REQUIRED**.

### 14.2 Backups and restore

The workflow deletes active application data. It cannot truthfully promise immediate physical removal from historical infrastructure backups because no verified backup topology or retention/reconciliation mechanism exists in repository truth.

Backup retention and restore handling are policy/operations launch gates. An approved restore process must prevent a deleted account from silently becoming durably active again; the exact suppression or reconciliation design is intentionally not invented here. Public copy must distinguish active-data deletion from backup lifecycle where policy requires disclosure.

### 14.3 Third-party processors

- PostgreSQL is the active application persistence category represented in repository code. Its active user-linked rows are covered by the transaction above; hosting-specific backup/log behavior is not yet verified.
- Resend is the implemented email-delivery adapter. It receives the destination email and message needed to send a magic link, but repository truth shows no NatalNode account row managed at Resend and no processor-side account-deletion API. Account deletion therefore has no synchronous Resend deletion step. Resend delivery/log retention remains an operations and policy-disclosure question.
- Railway is an accepted staging architecture, not evidence of a currently live processor environment. Deferred providers must not be classified as active and do not participate in this contract.

## 15. Interaction with other P0 privacy work

### 15.1 Data export

Data export is separate P0 work. Account deletion must never require export first. When export exists, the UI may offer “Download your data before deletion,” but failure or refusal to export cannot prevent deletion.

### 15.2 Retention and scheduled cleanup

Account deletion is user-initiated erasure. Scheduled retention/minimization is a separate lifecycle mechanism for expired challenges, inactive data, infrastructure logs, backups, and other policy-scoped records. This contract neither selects retention periods nor replaces scheduled cleanup.

### 15.3 Privacy-access auditing

Privacy access auditing remains separate P0 work. V1 does not add an audit-event table or retain an email/account-linked deletion ledger. Existing privacy-minimized operational request logging is the technical default for the deletion event. If governance later requires durable proof, it must approve a non-identifying or explicitly justified data model that does not recreate deleted identity state.

## 16. Account-management and post-deletion UX

No account/profile page currently exists. The smallest P0 surface is a private, `noindex` `/account` page in the Vault/account-management context, discoverable through a quiet signed-in **Account** link from the existing authenticated session control and/or Vault navigation. The destructive action must not be placed in Calculate, Chart, Interpretation, Feedback, or the public homepage.

After a committed `204`:

- the current browser cookie is expired;
- authenticated and Vault client caches/state are cleared;
- the UI becomes signed out;
- Vault content and authenticated Feedback can no longer be accessed because all server sessions are invalid;
- the client navigates to the public homepage `/`.

If the response is lost after commit, the next authenticated request fails with `401`, and the client must recover to the same signed-out public state. Functional destructive-action copy is a placeholder until policy/product review; this document does not author Privacy Policy, Terms, retention representations, or legal-rights claims.

## 17. Security invariants

1. The verified server session determines the only deletion target.
2. The endpoint accepts no arbitrary account, user, identity, or email target.
3. Cross-account and unauthenticated email-only deletion are impossible through the normal endpoint.
4. Exact same-origin protection, strict request validation, secure cookie policy, authentication, and bounded rate limiting are reused.
5. Explicit destructive confirmation is mandatory and is not treated as authentication.
6. A finite, policy-approved recent-auth maximum is mandatory; no password system is invented.
7. Every server-side account session is invalid after success.
8. No challenge issued before deletion remains usable to preserve or recover stale identity state.
9. Challenge issue, consumption/provisioning, and erasure share a normalized-email concurrency boundary.
10. No deleted Vault or Feedback data remains reachable through account APIs.
11. The active database operation is atomic; ordinary failures cannot leave a partially erased graph.
12. Failure never returns fake success or clears the cookie as though commit succeeded.
13. Success returns no deleted data, identifiers, or sensitive row counts.
14. Re-registration never reconnects former data or sessions.
15. Another account's rows are never affected.
16. No backup, infrastructure-log, processor, or legal guarantee is fabricated.

## 18. Privacy invariants

1. All active owner-linked application data in the audited graph is erased on committed deletion.
2. Hard deletion of the account root is the default; deactivation and indefinite soft deletion do not satisfy this contract.
3. Chart deletion is not account deletion.
4. Guest in-memory chart state is outside persisted account erasure.
5. Public/shared Sky and scientific data is not user-owned and is not deleted.
6. Application logs must not gain email, account identifiers, birth data, Vault names, Feedback text, confirmation content, or request bodies for this workflow.
7. No unnecessary identity-bearing tombstone, blacklist, or deletion ledger is introduced.
8. Backup, infrastructure-log, and processor limitations are represented truthfully and remain policy/operations controlled.
9. Deletion does not depend on data export.
10. Scheduled retention and privacy-access auditing remain separate mechanisms.
11. No invented legal-retention period or exception is used to retain active owner-linked rows.

## 19. Policy decision register

| Decision | Why required | Safe technical default | Owner / policy dependency | Blocks WEB-PRIVACY-001B? |
|---|---|---|---|---|
| Maximum recent-auth age | Server must compare session `created_at` to one finite threshold | Require a newly issued ordinary magic-link session; do not ship until the threshold is approved | Security + Privacy/Product | **Yes** |
| Re-registration after deletion | Determines whether a new valid magic link may provision a new account | Allow a new account with new IDs and no reconnection; retain no blacklist/tombstone | Privacy/Product | No, unless owner rejects the default |
| Backup retention and restore reconciliation | Active deletion cannot guarantee historical backup removal or safe restore behavior | Limit technical claim to active application data; require approved restore controls before live claims | Privacy + Operations | No for 001B; yes for live launch/claims |
| Infrastructure-log retention and access | Repository logging is minimized, but platform retention/access is not verified | Add no identifiers or payloads; make no instant-log-erasure promise | Security + Privacy + Operations | No for 001B; launch/disclosure gate |
| Resend delivery/log retention | Provider may retain delivery metadata outside NatalNode's database | No synchronous processor delete without evidence of an account record/API; disclose only verified behavior | Privacy + Operations | No for 001B; disclosure gate |
| Durable deletion audit event | A retained identity-bearing proof could undermine erasure | No account/email-linked ledger; bounded non-identifying operational event only | Security + Privacy | No, unless governance requires a durable record |
| Final destructive-action copy | Public wording must match actual backup/log/processor guarantees | Use only restrained functional placeholder copy during implementation | Privacy/Product/Legal review as applicable | No for 001B; required for public UI/release |
| Verified manual fallback | A support path may be needed when self-service auth cannot be completed | Do not create an admin-like user endpoint; define a separately verified operational process if approved | Privacy + Security + Operations | No for 001B; launch-process gate |

Decisions marked “No” do not authorize unsupported public claims. They permit the bounded active-database implementation to proceed once the sole implementation-blocking recent-auth threshold is approved.

## 20. Bounded implementation phases

### WEB-PRIVACY-001B — Server account erasure

After security/privacy review selects the recent-auth maximum:

- implement the strict `DELETE /api/account` contract;
- preserve verified session creation time for recent-auth enforcement;
- add the narrow account-erasure transaction boundary and normalized-email Auth lifecycle serialization;
- delete account-linked challenge rows and the user root, relying on verified cascades;
- clear the cookie only after commit;
- add focused authorization, validation, cross-account isolation, cascade, concurrency, rollback, all-session, stale-challenge, and retry tests.

Do not add a provider, deployment, export, retention schedule, generic deletion framework, or account UI in this phase.

### WEB-PRIVACY-001C — Account-management UI

- add the smallest private/noindex `/account` surface in the Vault/account context;
- add explicit `DELETE` confirmation and accessible destructive-action states;
- provide a fixed safe fresh-magic-link return path for stale sessions;
- clear private client state and transition to signed-out `/` after success;
- finalize public functional copy only after required policy review.

### WEB-PRIVACY-001D — Operational/live verification

When a real PostgreSQL/live-like environment is available:

- verify transaction/cascade/session/challenge behavior against live PostgreSQL;
- verify concurrent issue/consume/delete serialization;
- verify cookie expiration and multi-session invalidation;
- verify platform logs remain free of prohibited fields;
- close backup/restore, infrastructure retention, Resend retention, manual fallback, and public-disclosure gates with operations/privacy owners.

Full data export, scheduled Auth cleanup, retention enforcement, privacy-access auditing, public Privacy/Terms pages, Google Sign-In, and staging deployment remain separately governed P0 work.

## 21. Explicit anti-patterns

The implementation must not:

- **A.** Delete only the account row while leaving owner-linked data orphaned.
- **B.** Delete only Vault content and call it account deletion.
- **C.** Accept arbitrary `userId` or `accountId` from the browser as authority.
- **D.** Perform email-only unauthenticated deletion.
- **E.** Execute irreversible deletion from a single click without explicit confirmation.
- **F.** Clear only the current cookie while other server sessions remain valid.
- **G.** Leave a usable outstanding magic-link challenge tied to stale identity state.
- **H.** Perform partial multi-table deletion without transactional safety.
- **I.** Return success after partial failure or failed commit.
- **J.** Soft-delete identity indefinitely without an approved retention need.
- **K.** Retain email/account identifiers in a tombstone merely for convenience.
- **L.** Promise instant deletion from backups or infrastructure logs without evidence.
- **M.** Require export before deletion.
- **N.** Reconnect a re-registered email to old Vault, Feedback, session, or other deleted data.
- **O.** Invent legal-retention periods.
- **P.** Modify scientific/chart ownership or provider logic to solve privacy lifecycle.
- **Q.** Create a generic repository-wide “delete everything” helper with unclear ownership.

## 22. Approval boundary

This document approves the technical direction only. Runtime implementation remains deferred. No route, migration, test, source, dependency, provider, deployment, or legal-copy change is approved by WEB-PRIVACY-001A.

The next action is security/privacy product review of this contract, with explicit selection of the recent-authentication maximum before WEB-PRIVACY-001B begins.
