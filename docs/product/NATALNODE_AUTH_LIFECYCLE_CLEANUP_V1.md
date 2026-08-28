# NatalNode Auth Lifecycle Cleanup Technical Contract V1

**TASK ID: `WEB-PRIVACY-003A`**  
**STATUS: APPROVED TECHNICAL DIRECTION**  
**RUNTIME IMPLEMENTATION DEFERRED**

## 1. Purpose and authority

This document freezes the technical direction for removing Auth persistence
records that are already unusable under the current authentication contract.
It addresses the P0 data-minimization gap for:

- expired rows in `auth_sessions`;
- expired, unconsumed rows in `email_magic_link_challenges`; and
- consumed rows in `email_magic_link_challenges`.

This is a cleanup contract, not an authentication-validity change. Existing
Auth validity remains authoritative and synchronous. A row may remain in the
database after it becomes invalid; its physical deletion must never be needed
to make the credential invalid.

The contract is based on the clean repository baseline
`f80a125de88d1b4cc45f47ef705eb8ca7bfc2f2c` (`feat: add account data export ux`)
and the following approved product and architecture sources:

- [`docs/PRD.md`](../PRD.md)
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`NATALNODE_P0_READINESS_CHECKPOINT_V1.md`](./NATALNODE_P0_READINESS_CHECKPOINT_V1.md)
- [`NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md`](./NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md)
- [`NATALNODE_ACCOUNT_DATA_EXPORT_V1.md`](./NATALNODE_ACCOUNT_DATA_EXPORT_V1.md)
- [`docs/adr/WEB-AUTH-002A-email-magic-link-delivery.md`](../adr/WEB-AUTH-002A-email-magic-link-delivery.md)

The inspected runtime and schema boundaries are limited to the Auth tables,
Auth repositories, session authentication/creation/logout, Magic Link
issuance/consumption, PostgreSQL lifecycle locking, and account erasure. No
runtime, migration, test, dependency, or deployment change is part of this
task.

## 2. Scope and explicit non-goals

### 2.1 In scope

The future implementation may remove only technically unusable records from
the live application PostgreSQL database:

1. expired `auth_sessions` rows;
2. expired and still-unconsumed Magic Link challenge rows; and
3. consumed Magic Link challenge rows.

The future implementation must be an internal maintenance capability. It is
not a user-facing product feature.

### 2.2 Out of scope

This contract does not define or implement:

- a general product, legal, or regulatory retention schedule;
- account deletion or account-erasure semantics;
- account export semantics;
- infrastructure-log, database-backup, or email-provider retention;
- Vault, Feedback, chart, note, or user-data cleanup;
- Google Sign-In or any other provider integration;
- a public cleanup API or browser-triggered maintenance;
- a queue, worker service, Redis, event bus, cron microservice, or new Auth framework;
- a deployment scheduler selection;
- astronomy, Engine, provider, or scientific behavior; or
- any access to `C:\NatalNode`.

Cleanup must not be presented as “deleted immediately everywhere.” This
contract concerns only the live application database rows named above.

## 3. Current Auth persistence inventory

The following is the repository-verified graph at this baseline.

| Relation | Current fields relevant to this contract | Ownership and current behavior | Current indexes / operations |
| --- | --- | --- | --- |
| `users` | `user_id` primary key; `created_at`; `updated_at` | Account root. It is not an expiry-cleanup target. | No Auth-lifecycle cleanup operation. |
| `auth_identities` | `identity_id` primary key; `user_id`; `provider`; `provider_subject`; `created_at`; `updated_at` | `EMAIL_MAGIC_LINK.provider_subject` is the normalized email used by Magic Link provisioning. The `user_id` foreign key references `users` with `ON DELETE CASCADE`; the provisioning migration makes that FK deferrable and initially deferred. | Unique `(provider, provider_subject)` and `user_id` index. Identity resolution/provisioning is separate from scheduled cleanup. |
| `auth_sessions` | `session_token_hash` primary key; `user_id`; `created_at`; `expires_at` | Stores only the one-way session-token hash, not the bearer token. `user_id` references `users` with `ON DELETE CASCADE`. There is no `consumed_at` field. | `user_id` index and `expires_at` index. Current repository operations are create, active lookup by token hash and caller-supplied `now`, and delete by the presented token hash during logout. |
| `email_magic_link_challenges` | `challenge_id` primary key; `token_hash` unique; `email_normalized`; `created_at`; `expires_at`; nullable `consumed_at` | Stores only the one-way Magic Link token hash and normalized email. It has no `user_id` field and no foreign key to `users` or `auth_identities`. | `expires_at` index and `email_normalized` index. Current repository operations are create and atomic consume; no cleanup operation exists. |

The absence of a foreign key from `email_magic_link_challenges` to a user is
material. Account erasure identifies every normalized email attached through
the account’s `EMAIL_MAGIC_LINK` identities, deletes matching challenge rows,
and then deletes the user root. Scheduled cleanup must not attempt to infer
ownership from a challenge row or replace that explicit erasure behavior.

No plaintext session token or Magic Link token is persisted by these records.
The cleanup primitive must preserve that property and must address rows by
database keys/predicates, never by a raw bearer secret.

## 4. Current session lifecycle

The verified session path is:

1. Successful authentication generates an opaque high-entropy session token.
2. The runtime hashes the token and persists `session_token_hash`, `user_id`,
   `created_at`, and a policy-provided `expires_at`.
3. The browser receives the plaintext token only in the configured HttpOnly
   cookie. The cookie’s expiration is not the server-side validity source.
4. `SessionRequestAuthenticator` extracts one unambiguous cookie, hashes it,
   obtains the existing server `Clock.now()` value, and calls
   `findActiveByTokenHash(hash, now)`.
5. The PostgreSQL query requires the matching hash and `expires_at > now`.
   The returned `created_at` is preserved for the recent-authentication
   boundary.
6. Logout deletes only the matching session hash and always clears the
   browser cookie. It does not revoke another session for the same user.

There is no current refresh, sliding expiration, or session-touch operation.
`created_at` is not an expiry substitute.

## 5. Current Magic Link challenge lifecycle

The verified Magic Link path is:

1. The submitted email is normalized by trim plus lowercase.
2. A challenge ID, opaque token, token hash, creation time, and policy-provided
   expiration time are produced. Only the hash and challenge metadata are
   persisted; the plaintext token is transient delivery material.
3. Challenge creation runs in a PostgreSQL transaction under the existing
   normalized-email advisory transaction lock.
4. Completion hashes the presented token and first searches for a candidate
   with the exact `token_hash`, `consumed_at IS NULL`, and `expires_at > now`.
5. When a candidate exists, completion acquires the same normalized-email
   advisory transaction lock and repeats the validity condition through an
   atomic `UPDATE ... SET consumed_at = ...`.
6. The consumed challenge, identity resolution/provisioning, session issuance,
   and `auth_sessions` insert share one PostgreSQL transaction. The transaction
   commits before session material is returned to the HTTP boundary.
7. An unknown, expired, or already-consumed link produces the same invalid
   result and the route returns the generic unauthorized response. No
   account-existence detail is disclosed.

The challenge table therefore represents both active and historical technical
states without a user foreign key. The `created_at` value is descriptive and
ordering metadata; it is not a validity condition.

## 6. Challenge state machine

The following classification uses only fields that actually exist.

| State | Database condition at the authoritative `now` | Can authenticate? | Cleanup direction |
| --- | --- | --- | --- |
| Active / unconsumed / unexpired | `consumed_at IS NULL` and `expires_at > now` | Yes, subject to the normal token-hash match and transaction race rules | Preserve. Cleanup must not shorten this window. |
| Expired / unconsumed | `consumed_at IS NULL` and `expires_at <= now` | No; the current consume predicate rejects it | Eligible for deletion. |
| Consumed / not necessarily expired | `consumed_at IS NOT NULL` | No; the current consume predicate requires `consumed_at IS NULL` | Eligible for the consumed-row cleanup phase as soon as consumption is committed. |
| Consumed and expired | `consumed_at IS NOT NULL` and `expires_at <= now` | No for both reasons | Eligible for the consumed-row phase; it must not be double-counted as an unconsumed-expired row. |

There is no approved cleanup state that changes `expires_at`, clears
`consumed_at`, replaces `token_hash`, or moves a challenge back to active.

## 7. Validity versus cleanup invariant

The following distinction is frozen:

**Authentication validity** is enforced synchronously by current Auth
repositories and orchestration. A session is accepted only while its existing
`expires_at > now` condition holds. A Magic Link is accepted only while its
hash matches a present row with `consumed_at IS NULL` and `expires_at > now`.

**Cleanup** is persistence hygiene after that existing condition is false.
Cleanup lag must not weaken authentication security, and cleanup success must
not be part of an authentication request’s correctness path.

Consequences:

- an expired session remains invalid before its row is deleted;
- an expired challenge remains invalid before its row is deleted;
- a consumed challenge remains invalid before its row is deleted;
- cleanup must not use browser cookie expiry, request age, `created_at`, or a
  new independent TTL to determine validity; and
- cleanup must not modify authentication-duration configuration.

## 8. Frozen cleanup eligibility

### 8.1 Expired sessions

The minimum safe condition is:

```sql
expires_at <= :authoritative_now
```

The future persistence primitive may delete only session rows satisfying that
condition. It must not:

- delete a session merely because it is old;
- delete a session whose expiration is still in the future;
- delete every session belonging to a user because one session expired; or
- derive the cutoff from the browser cookie.

Account-wide session deletion remains owned by account erasure and any future
separately approved all-session-revocation capability.

### 8.2 Expired, unconsumed challenges

The minimum safe condition is:

```sql
consumed_at IS NULL
AND expires_at <= :authoritative_now
```

Such a row has no current authentication path and may be deleted. An active
unconsumed row (`consumed_at IS NULL AND expires_at > now`) must be preserved;
cleanup must not change the configured Magic Link lifetime or create a shorter
authentication window.

No current runtime or security path requires an expired challenge row after
the existing expiry predicate rejects it. Account erasure remains a separate,
immediate operation for all challenge rows matching the account’s authoritative
normalized email identity set.

### 8.3 Consumed challenges — recommended P0 direction

The recommended direction is **bounded maintenance cleanup of committed
consumed rows with no product or legal grace interval**:

```sql
consumed_at IS NOT NULL
```

This is a separate cleanup phase, not a change to the user-facing completion
transaction. The future implementation must not delete a challenge between
the current `UPDATE` and the completion callback/transaction commit. Once the
successful completion transaction has committed, the row is immediately
technically unusable and may be removed by a later short maintenance
transaction. Existing consumed rows are covered by the same bounded phase.

This direction is selected because:

- the current completion path does not require a consumed row after its
  transaction commits;
- the current candidate and atomic-consume predicates already reject a
  consumed row;
- retaining consumed rows for hypothetical analytics is not approved;
- application logging is intentionally insufficient for, and must not become,
  a per-token forensic store; and
- an invented grace interval would be a new retention decision rather than a
  current Auth requirement.

Immediate deletion inside the successful completion transaction is not the V1
execution shape. It would couple housekeeping to login latency and would not
help the existing backlog without an additional cleanup path. It is also not
needed for replay safety. A future implementation must preserve the current
consume/provision/session commit boundary whether it deletes in that
transaction or in the selected maintenance phase.

If a future legal, incident-response, or product decision requires retaining a
consumed artifact, that is **POLICY DECISION REQUIRED** and must supersede this
technical direction before implementation. No such retention basis exists in
the inspected repository.

## 9. Replay-safety proof and duplicate-request behavior

Deleting a consumed or expired challenge cannot make the old token reusable
under the current completion lookup:

1. Completion hashes the presented token.
2. The candidate query requires a present row with the exact hash,
   `consumed_at IS NULL`, and `expires_at > now`.
3. A deleted consumed row produces no candidate, so
   `withConsumedChallenge` returns `null` and the route emits the same generic
   `401` invalid-link response.
4. A deleted expired row also produces no candidate. Keeping it would not
   make it valid because the expiry predicate would still fail.
5. Cleanup does not insert a row, reset `consumed_at`, change a token hash, or
   invoke identity provisioning. It therefore cannot create a new
   authentication path for an old token.

The current high-entropy token generator and unique `token_hash` constraint
remain unchanged. Cleanup does not generate or reuse tokens. A future
implementation must not weaken those existing assumptions or use database-row
presence as a substitute for the active-row validity predicate.

The relevant races are safe under the current predicates:

- If cleanup runs before an active consumption commits, it does not see an
  uncommitted consumed state and does not match the active row.
- If cleanup runs after consumption commits, a later completion sees either
  the committed consumed state or no row and fails closed.
- If two completion requests observe the same candidate, the existing
  normalized-email lock and the second atomic validity check allow only one
  consumption/provisioning transaction to commit. A duplicate returns the
  generic invalid result.
- Cleanup never provisions an identity or session and never reopens a
  challenge.

This is not a security blocker for consumed-row deletion. The proof depends on
the actual current candidate and consume predicates, not on an assumption that
the consumed row must remain present.

## 10. Concurrency and lifecycle locking

### 10.1 Existing Email Magic Link lock

Issuance, completion, identity provisioning, and account erasure use the
existing PostgreSQL transaction-scoped advisory lock derived from normalized
email. Lock keys are deduplicated and acquired in deterministic sorted order
when an operation has multiple email identities.

The cleanup primitive is deletion-only and does not inspect or alter active
identity state. V1 does **not** require acquiring a normalized-email advisory
lock for every cleanup row. That is the narrow repository-truth-driven choice:

- issuance creates only an active future-expiry row, which the cleanup
  predicates cannot match;
- consumption can match only an active row, while cleanup matches only an
  expired or already-consumed row;
- PostgreSQL transaction visibility prevents cleanup from treating an
  uncommitted active consumption as committed consumed state; and
- account erasure and cleanup both delete rows, so either ordering leaves no
  row that can recreate an account, identity, or authentication path.

The future implementation must not create a second distributed lock. If a
future cleanup design reads a challenge by email and then makes a decision
about active state, or changes any eligibility predicate, it must be reviewed
again and reuse the existing normalized-email lifecycle lock rather than
inventing a new locking domain.

### 10.2 Session concurrency

Session cleanup can use a simple bounded deletion predicate without a new
session-level advisory lock:

- session creation inserts a future-expiry row, so it cannot match the expired
  predicate;
- authentication already rejects a row at `expires_at <= now`, so deleting an
  eligible row cannot turn a valid request into an invalid one under the same
  clock contract;
- logout deletes one matching token hash and can safely race with cleanup; and
- account erasure deletes the user root and cascades sessions, so a concurrent
  cleanup delete is redundant but not semantically conflicting.

The database’s ordinary row locks and transaction isolation remain sufficient.
No user-wide session lock or “delete all sessions for this user” operation is
part of cleanup.

## 11. Account-erasure interaction

The existing account-erasure contract remains authoritative and unchanged.
It:

1. discovers the account’s authoritative `EMAIL_MAGIC_LINK` identity subjects;
2. acquires the existing normalized-email advisory locks;
3. locks the user root and rechecks the identity set;
4. deletes every challenge row matching those normalized emails, regardless of
   whether each row is active, consumed, or expired; and
5. deletes the user root, allowing the approved user-linked cascades to remove
   identities, sessions, Vault records, notes, and Feedback.

Scheduled Auth cleanup is not a substitute for that transaction. It must not
join challenge rows to users, preserve an account-linked challenge because it
cannot prove ownership, or create a tombstone/blacklist.

Safe interleavings are:

- cleanup before erasure: it may remove only already-ineligible rows; erasure
  still removes every remaining challenge for the authoritative email set;
- erasure before cleanup: the user-linked rows and account-email challenges
  are already gone; cleanup has nothing to recreate; and
- cleanup concurrent with erasure: both operations are deletion-only for
  their respective eligible sets, and the erasure lock/root transaction
  remains the authority for account-wide deletion.

No cleanup result may be reported as account erasure, and no cleanup failure
may roll back or block an unrelated account-erasure request beyond ordinary
database lock behavior.

## 12. Recommended execution model

The smallest P0 execution model is **an explicit internal maintenance
command** (candidate C from the task evaluation), backed by the persistence
primitive and invoked outside normal Auth request handling.

This is preferred over opportunistic request cleanup and a per-process timer
because:

- Magic Link request, Magic Link completion, and session authentication do not
  pay cleanup latency;
- process restarts do not change the correctness contract;
- multiple Web instances can run the same command safely;
- one command invocation can be bounded and retried by operations; and
- no queue, worker fleet, or new distributed coordination service is needed.

The command is an operational/internal entry point, not an HTTP route. Normal
users must never receive `POST /api/auth/cleanup` or an equivalent browser
trigger. The command must not accept arbitrary Auth identifiers or expose row
contents to a caller.

The command should perform one bounded batch for each independent cleanup
phase and then exit with a bounded outcome. It must not drain an arbitrarily
large table in one invocation. Repeated scheduled invocations provide
eventual hygiene without making correctness depend on exactly-once execution.

## 13. Idempotency and multi-instance behavior

Cleanup is idempotent by predicate. Re-running it after a successful delete
finds fewer eligible rows and produces the same safe state. No caller may
assume that a particular row is deleted by a particular instance.

Concurrent instances are allowed:

- `FOR UPDATE SKIP LOCKED` or an equivalent database-safe batch selection may
  avoid waiting on rows already being processed;
- a row selected by two instances cannot be deleted twice in a way that
  changes Auth semantics; one transaction deletes it and the other observes no
  matching row after its lock/visibility boundary; and
- a timeout, process restart, or ambiguous command result is recovered by a
  later invocation rather than an unsafe automatic transaction retry.

Exactly-once scheduler delivery is not a correctness requirement.

## 14. Batch and resource strategy

Each future cleanup phase must use a short PostgreSQL transaction with a
bounded selection. The preferred shape is a primary-key-selected CTE (or an
equivalent PostgreSQL-supported bounded delete):

1. select at most the configured batch cap of eligible primary keys in stable
   order;
2. optionally use `FOR UPDATE SKIP LOCKED` for concurrent maintenance
   invocations;
3. delete only those selected keys; and
4. commit promptly.

The keys are:

- `session_token_hash` for `auth_sessions`; and
- `challenge_id` for `email_magic_link_challenges`.

The future implementation must freeze a positive, operationally appropriate
batch cap and statement timeout at its implementation boundary. Those values
are deployment/resource tuning, not a reason to invent a new Auth lifetime.
One invocation must process no more than one bounded batch per phase. It may
return a “more work” outcome without looping over the complete table.

The recommended independent phases are:

1. expired sessions;
2. expired and unconsumed challenges; and
3. consumed challenges.

The phases are semantically independent; their order is not a validity or
security dependency. Separate short transactions isolate failures and avoid
holding a housekeeping transaction across unrelated tables or phases.

## 15. Index and migration feasibility

The current schema contains the indexes needed to make the expired predicates
addressable:

- `auth_sessions_expires_at_idx` supports expired-session selection;
- `email_magic_link_challenges_expires_at_idx` supports expiry-based
  challenge selection; and
- `email_magic_link_challenges_email_normalized_idx` supports the existing
  account-erasure email cleanup, not the scheduled eligibility scan.

There is no current index on `email_magic_link_challenges.consumed_at`. The
consumed phase is intentionally broader than the expiry phase: it deletes
committed consumed rows even when `expires_at` is still in the future. A
bounded selection ordered by consumed time and the primary-key tie-breaker
therefore cannot rely on the existing `expires_at` or `email_normalized`
indexes without potentially scanning an arbitrary portion of the table.

**MIGRATION REQUIRED** before activating the consumed-row phase in B1. The
narrow semantic index shape is a partial index beginning with
`(consumed_at, challenge_id)` and restricted to `consumed_at IS NOT NULL`.
This directly supports the consumed eligibility predicate, deterministic
ordering, and bounded candidate selection without indexing active rows. B1
must verify that PostgreSQL uses the index with the selected batch query, but
that query-plan check validates the required migration; it does not defer the
decision whether the index is needed. The migration, exact DDL, and checksum
belong to B1; no migration is created here.

No speculative index is approved for `users` or `auth_identities`, and no
index change is needed for the expired-session or expired-unconsumed-challenge
direction based on the inspected schema.

## 16. Authoritative clock and timezone semantics

The existing Auth repositories compare expiration against a server-generated
`now` parameter obtained from the runtime `Clock`. The cleanup primitive must
use that same server-side clock contract and bind one ISO timestamp as a
PostgreSQL `TIMESTAMPTZ` parameter for each batch transaction:

```sql
expires_at <= :now
```

The first implementation must not switch cleanup to a second, divergent
`CURRENT_TIMESTAMP` policy while Auth validity continues to use the server
parameter. It must not use browser time or cookie expiry. A future deliberate
change to the authoritative Auth clock would require updating validity and
cleanup together under a separate contract.

`TIMESTAMPTZ` values represent absolute instants; the runtime’s ISO UTC form
is the serialization convention. Normal deployment clock synchronization is
an operational prerequisite for a multi-instance process, but cleanup must
not add a new expiry duration or safety policy silently.

Consumed-row eligibility does not require a clock: a non-null committed
`consumed_at` is already invalid. `created_at` remains ordering/diagnostic
metadata only.

## 17. Transaction strategy and failure semantics

Each bounded phase uses one short checked-out PostgreSQL transaction:

```text
BEGIN
→ bounded eligible-key selection
→ delete selected keys
→ COMMIT
→ release client
```

On query or selection failure, the phase rolls back and releases the client.
On a commit or rollback/release failure, the implementation must follow the
existing repository discipline and must not return a client whose transaction
state is uncertain to the pool. It must not automatically retry an ambiguous
commit as if the first commit definitely failed; idempotent later invocation
is the recovery mechanism.

Session and challenge phases use separate transactions. Cleanup must not share
the account-erasure transaction, the Magic Link completion transaction, or an
unbounded transaction spanning all tables.

Because the command is auxiliary, a failed cleanup phase must:

- leave that phase’s batch rolled back;
- leave unrelated account data untouched;
- leave normal Auth validity exactly as before;
- not block or invalidate an otherwise valid Auth request; and
- report a bounded operational failure so a later invocation can retry.

If the command is hosted inside a long-lived Web process in a future slice,
its failure must be caught at the maintenance boundary and must not crash the
HTTP server. If it is run as a separate internal command, a non-success exit
is an operational retry signal, not an application-authentication result.

## 18. Logging and privacy minimization

Cleanup observability must use the existing bounded operational logging
boundary. A permitted event may include only non-identifying maintenance
metadata such as:

- a bounded event family such as `auth.lifecycle.cleanup`;
- phase/outcome values from a finite allow-list;
- duration; and
- optionally a bounded “more work” indication.

V1 does not require deleted-row counts in application logs. If a later
operations review establishes that an aggregate count is necessary, it must
be bounded, non-identifying, and never used as a per-user signal.

Never log:

- email or normalized email;
- session token hashes or challenge token hashes;
- user IDs, identity IDs, challenge IDs, or session identifiers;
- raw row contents, SQL parameters, cookies, tokens, request bodies, or
  response payloads; or
- per-account cleanup records.

The application log event is not a retention guarantee. Downstream host,
database, provider, and infrastructure-log storage remains outside this
contract.

## 19. Deployment and scheduler boundary

The repository’s deployment status is currently deferred/paused. This
contract therefore defines the persistence semantics and internal command
boundary without selecting Railway cron, a database scheduler, a hosting
scheduler, or another external mechanism.

**DEPLOYMENT / OPERATIONS BINDING DEFERRED.**

Once an approved deployment mechanism exists, it may invoke the internal
command periodically. That binding must preserve:

- no public/browser trigger;
- bounded invocations;
- safe duplicate execution across instances;
- retry after failed/ambiguous execution; and
- no claim that scheduler delivery is exactly once.

Scheduler selection, credentials, process topology, live interval, alerting,
and staging/live verification are not frozen by this document.

## 20. Account-export integrity

The existing account export contract intentionally excludes Auth sessions and
Magic Link challenges. Cleanup changes no export shape, serialization,
authorization, or route behavior. It must not modify:

- `POST /api/account/export`;
- export snapshot semantics;
- export UI; or
- the distinction between a user data export and internal Auth-security
  records.

Auth cleanup is not an export implementation and export is not a cleanup
trigger.

## 21. Legal and retention boundary

This document approves a technical deletion direction for records that the
current Auth semantics already make unusable. It does not select:

- a general legal retention period;
- a privacy-policy statement;
- a backup deletion period;
- an infrastructure-log period;
- a Resend/provider retention period; or
- an exception ledger.

The only technical grace is none: consumed rows are eligible after committed
consumption, and expired rows are eligible at the existing expiry boundary.
That statement is not a legal promise about every system that may have
received, backed up, logged, or cached related data. Any contrary retention
obligation requires **POLICY DECISION REQUIRED** before implementation.

## 22. Future implementation slices

The following slices are intentionally bounded and remain unimplemented by
this task.

### `WEB-PRIVACY-003B1` — Implement bounded Auth lifecycle cleanup persistence primitive

- Add the narrow persistence contract and PostgreSQL adapter for one bounded
  batch per phase.
- Use the existing server `Clock` timestamp parameter and exact eligibility
  predicates from this document.
- Preserve the existing Auth repositories and completion transaction
  semantics.
- Add the narrow `(consumed_at, challenge_id) WHERE consumed_at IS NOT NULL`
  index migration before activating the consumed phase, and verify its use
  with the bounded candidate query.
- Add focused persistence/concurrency tests without changing Auth validity.

### `WEB-PRIVACY-003B2` — Integrate safe internal maintenance trigger

- Expose only an internal command/process boundary.
- Keep cleanup off the Magic Link request, completion, session-authentication,
  and ordinary browser paths.
- Make failure auxiliary, bounded, retryable, and privacy-minimized.
- Do not bind an unapproved external scheduler or create a worker system.

### `WEB-PRIVACY-003C` — Operational/live verification

- Select and approve the deployment-native scheduler or command invocation.
- Verify staging/live query plans, batch duration, pool capacity, duplicate
  execution, clock behavior, failure recovery, and log minimization.
- Verify account erasure, export integrity, and authentication validity remain
  unchanged under cleanup activity.

No slice above should start automatically from this documentation task.

## 23. Focused future test plan

Tests are not created in this task. Future implementation should cover only
the cleanup contract and its direct boundaries.

### Session cases

- an expired session is deleted;
- a currently valid session is preserved;
- another user’s valid session is preserved;
- an old-but-not-expired session is preserved;
- logout and cleanup can race without reviving or incorrectly deleting a
  valid session; and
- repeated cleanup is idempotent.

### Challenge cases

- an expired unconsumed challenge is deleted;
- an active unconsumed challenge is preserved until its normal expiry;
- a committed consumed challenge is deleted by the consumed phase;
- a consumed-and-expired challenge is handled once by the selected phase;
- replay after a consumed-row delete remains impossible and returns the same
  generic invalid result;
- an unrelated email’s challenge is preserved;
- issuance, consumption, cleanup, and account erasure races are safe; and
- no cleanup operation provisions an identity or session.

### Account-erasure and export cases

- account deletion remains immediately authoritative for all challenge rows
  matching every authoritative account email;
- cleanup cannot reconnect, preserve, or recreate an erased account;
- user-linked cascade behavior remains unchanged; and
- account export continues to exclude Auth sessions and challenges.

### Resource and failure cases

- each phase never deletes more than its batch cap;
- concurrent cleanup invocations safely use row-level selection/skip-locked
  behavior where selected;
- a query, timeout, rollback, release, or ambiguous commit failure leaves
  normal Auth validity unchanged;
- a failed phase can be retried by a later invocation; and
- no privacy-sensitive row content or identifier is logged.

## 24. Explicit anti-patterns

Future work must not:

- make cleanup necessary for Auth expiration correctness;
- trigger cleanup from the browser or expose a public cleanup endpoint;
- delete valid sessions or active valid challenges;
- delete all sessions for a user because one expired;
- change Magic Link/session expiry durations;
- use `created_at` as an invented expiry rule;
- store raw tokens or use raw tokens as cleanup input;
- log email, token hashes, user IDs, identity IDs, row contents, or per-user
  cleanup events;
- run an unbounded table sweep in one operation;
- assume exactly-once scheduler delivery;
- add a distributed queue, worker service, Redis, event bus, or new Auth
  framework without a separately approved need;
- merge scheduled cleanup into account erasure or account export;
- introduce a legal/retention claim for records outside this live database;
- mix Vault, Feedback, backup, provider, or infrastructure-log retention into
  Auth cleanup; or
- access or modify `C:\NatalNode`.

## 25. Readiness decision

This document is the single approved technical direction for
`WEB-PRIVACY-003A`:

- current schema and lifecycle semantics are verified;
- validity and physical cleanup are explicitly separate;
- expired-session and expired-challenge eligibility is frozen;
- active sessions and active challenges are protected;
- consumed-row deletion is frozen as separate bounded cleanup after commit;
- replay safety follows from the actual candidate and consume predicates;
- account-erasure and lifecycle-lock boundaries are preserved;
- execution is explicit, internal, bounded, idempotent, and multi-instance-safe;
- the consumed-state migration is explicitly required before the consumed
  phase is activated;
- the server `Clock` is the authoritative cleanup cutoff;
- failures cannot weaken Auth correctness;
- export, legal, deployment, scientific, and provider boundaries remain
  unchanged; and
- runtime implementation remains deferred to the separately approved next
  task.

The next action is a review gate, not implementation:

> **REVIEW WEB-PRIVACY-003A CONTRACT BEFORE IMPLEMENTATION.**
