# NatalNode Subscription / Entitlement Architecture V1

| Field | Value |
| --- | --- |
| Status | **ARCHITECTURE FREEZE / IMPLEMENTATION DEFERRED** |
| Task | `WEB-COMMERCIAL-001C` |
| Reviewed baseline | `f22f188af0b3fb54ac899f60bcd21e61b4f313a6` (`docs: freeze entitlement edge rules`) |
| Product-policy authority | `docs/product/NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md` |
| Advertising-policy authority | `docs/product/NATALNODE_ADVERTISING_COMPLIANCE_BASELINE_V1.md` |
| Provider status | **PROVIDER DECISION DEFERRED** |
| Implementation status | **DEFERRED** |
| Next bounded task | `SUBSCRIPTION / ENTITLEMENT PERSISTENCE & API CONTRACT DESIGN` |

## 1. Purpose and authority

This document freezes the provider-neutral V1 architecture direction that
future Subscription, Entitlement, Billing, Referral, Account, Vault,
Notification, Advertising, Export, Erasure, and observability work must obey.
It translates the already-frozen commercial product semantics into durable
architectural boundaries without selecting a provider, designing a concrete
persistence schema, or implementing runtime behavior.

The upstream product-policy documents remain authoritative for product meaning:

- `docs/product/NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md` freezes
  Free/Pro, cancellation, grace, refund, chargeback, Referral-time,
  entitlement-source, downgrade, and Ad-Free semantics.
- `docs/product/NATALNODE_ADVERTISING_COMPLIANCE_BASELINE_V1.md` freezes
  advertising surfaces, consent boundaries, privacy firewalls, and publisher-
  review safety requirements.

This document must not weaken, reinterpret, or silently complete an upstream
OPEN product, legal, provider, or operational decision. Where this document
uses words such as **must**, **canonical**, or **authoritative**, that wording
describes the architectural boundary future implementation must preserve; it
does not claim that the boundary is live in the current repository.

The product and architecture state after this freeze is:

```text
Commercial product semantics       = FROZEN
Subscription / entitlement architecture = FROZEN V1
Concrete persistence and API design = DEFERRED TO NEXT TASK
Runtime implementation              = DEFERRED
Payment/provider selection          = DEFERRED
```

## 2. Decision vocabulary and layer classification

The following classifications prevent historical facts, current source state,
derived authorization, cache values, and external provider state from being
treated as interchangeable.

| Classification | Architectural meaning | What may trust it |
| --- | --- | --- |
| **AUTHORITATIVE COMMERCIAL FACT** | A canonical, accepted record of something that happened commercially. Facts are append-oriented and are not silently rewritten. | Reconciliation and source-state rebuilding. |
| **AUTHORITATIVE NORMALIZED SOURCE STATE** | The current reconciled state of one account-scoped entitlement source, derived from accepted commercial facts and source-local rules. It is authoritative for current source validity while remaining rebuildable from the commercial history. | The canonical Effective Entitlement Evaluator. |
| **DERIVED ENTITLEMENT PROJECTION** | A rebuildable current/future coverage view, including effective coverage segments, source attribution, and transition boundaries. It is an authorization aid, not immutable commercial history. | The evaluator when its revision matches authoritative source state; otherwise it must be rebuilt or bypassed. |
| **CACHE** | An owner-scoped, version-aware performance copy of normalized source state or projection. | No component may treat it as sole commercial truth. |
| **EXTERNAL PROVIDER STATE** | Payment-provider state received through the provider boundary, including provider events and provider-side status. | The adapter and reconciliation input path only; never universal product authority. |
| **PRODUCT AUTHORIZATION** | The final account-scoped answer about Effective Pro and permitted capability classes. | Product surfaces through the Website/BFF boundary. |

Product authorization trusts **authoritative normalized source state**, evaluated
by one canonical Effective Entitlement Evaluator. A matching derived projection
may accelerate that evaluation, but an untrusted, stale, or missing projection
must not silently grant new Pro capability. External provider state and cache
state are never sufficient authority by themselves.

## 3. Scope and explicit non-goals

### In scope

This freeze defines:

- separation among commercial facts, normalized source state, projections, and
  product authorization;
- an append-oriented commercial event journal direction;
- a provider-neutral billing anti-corruption boundary;
- the source types `PAID`, `REFERRAL`, `PROMOTION`, `ADMIN_GRANT`, and
  `SUPPORT_GRANT`;
- one canonical Effective Entitlement Evaluator;
- the seven-day paid renewal grace treatment;
- Referral lifecycle, maturation, provenance, time-bank, and revocation
  requirements;
- the `PAID -> REFERRAL -> NEXT PAID` sequencing requirement;
- source-local reversal and the no-negative-entitlement invariant;
- idempotency, out-of-order reconciliation, owner-scoped concurrency,
  transactional consistency, revisioning, and rebuildability;
- integration boundaries for Notification, Advertising, Vault, historical Pro
  content, Account Erasure, Retention, Export, and Observability;
- provider capability requirements without selecting a provider; and
- the architecture invariants, failure-mode review, and bounded threat review
  required before persistence/API design.

### Explicit non-goals

This task does not authorize:

- application runtime code, TypeScript, Astro, React, or server changes;
- concrete database schema, table names, fields, types, indexes, constraints,
  ORM models, or migrations;
- API contracts, webhook routes, checkout, billing portal, or provider SDKs;
- payment-provider or advertising-provider selection;
- referral runtime, maturation scheduler, reconciliation scheduler, or admin /
  support tooling;
- advertising, consent, analytics, or Language / Localization implementation;
- changes to EngineClient, Engine contracts, astronomy, provider, or scientific
  provenance behavior; or
- access to or modification of `C:\NatalNode`.

## 4. Fixed system and ownership boundary

The existing system boundary remains unchanged:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
```

Subscription and entitlement are Website/BFF and account-boundary concerns.
They must not move astronomy calculation, provider selection, scientific
configuration, or provenance decisions into the Website. The entitlement
architecture authorizes product capabilities after the account/product
boundary has received the complete Engine-backed baseline result; it does not
change the Engine request or calculation path.

The commercial ownership boundary is:

```text
Account/BFF boundary
    -> canonical commercial boundary
    -> entitlement state and projection
    -> product authorization
    -> feature-specific product systems
```

The account is the scope for consumer entitlement. Browser state, cookies,
local storage, PushSubscription, UI labels, referral links, or client-supplied
account identifiers are not entitlement authority. The current Consumer
Notification Platform remains account-owned and separate from Billing
Platform. The Developer operational-notification domain remains separate from
Consumer entitlement policy.

## 5. Frozen architecture overview

The conceptual flow is:

```text
External billing provider state
        |
        v
Provider adapter / anti-corruption boundary
        |
        v
Canonical commercial event ingestion
        |
        v
Append-oriented commercial event journal
        |
        v
Account-scoped source reconciliation
        |
        +--> Authoritative normalized source state
        |          |
        |          v
        +--> Derived entitlement coverage projection
                   |
                   v
       Effective Entitlement Evaluator
                   |
                   v
           Product authorization
          /          |          \
       Vault   Notifications   Advertising
```

Account-facing purchase, cancellation, support, and other commercial actions
enter the same canonical commercial boundary. A provider webhook is one input
to that boundary, not a privileged bypass around it.

The flow must preserve four separations:

1. **Commercial facts** record what happened.
2. **Source state** records the reconciled current state of each entitlement
   source.
3. **Entitlement projection** derives current and future coverage/timeline.
4. **Product authorization** answers whether the account may perform a
   capability now.

No layer may impersonate another layer merely to simplify implementation.

## 6. Commercial facts and event journal

### ARCHITECTURE REQUIREMENT

Commercially significant state changes require durable, auditable history. The
preferred direction is an append-oriented Commercial Event Journal. A
correction, reversal, or support adjustment is normally represented by a new
canonical fact or compensating fact related to the earlier fact; it must not
silently rewrite the historical record.

The conceptual journal must preserve enough information to explain:

- the event identity;
- the account/owner scope;
- the entitlement source affected or created;
- the canonical commercial operation;
- occurrence or effective time;
- NatalNode ingestion/recording time;
- source and provenance;
- canonical idempotency identity;
- correction, reversal, or supersession relationship where applicable; and
- the authority or actor responsible when the operation is not provider-
  generated.

These are conceptual information requirements, not a field list or persistence
schema. Exact representation belongs to the next persistence/API design task.

The journal may contain canonical facts such as:

- qualifying purchase success;
- renewal success;
- renewal payment failure;
- cancellation requested or cancellation reversed;
- confirmed full refund;
- exceptional partial-refund operation;
- confirmed chargeback or payment reversal;
- Referral reward maturation;
- Referral reward application;
- Referral reward revocation;
- Promotion issuance or reversal;
- Admin Grant issuance or correction; and
- Support Grant issuance or correction.

The journal is not a provider-payload dump. Provider-specific payloads remain
behind the adapter boundary, are minimized before entering product domains, and
are not logged in full by default. A later persistence decision may retain
bounded evidence needed for reconciliation and audit, but it must not leak
payment secrets, full credentials, sensitive natal data, or unnecessary
provider personal data.

### AUTHORITATIVE COMMERCIAL FACT

Once a canonical commercial fact is accepted inside the NatalNode boundary, it
is durable historical truth for reconciliation. It is not removed or rewritten
because a later projection changes. A later fact may correct or reverse its
commercial effect, but it does not erase the historical occurrence.

## 7. Provider-neutral billing boundary

### FROZEN ARCHITECTURAL DECISION

Future payment-provider objects must stop at a provider adapter / anti-
corruption boundary. The adapter is responsible for provider-specific
verification, translation, and reconciliation input. Internal systems consume
canonical NatalNode commercial facts and normalized source state.

Provider-specific object names, status strings, customer objects, invoice
objects, subscription objects, signatures, and payload shapes must not spread
through Account, Vault, Notification, Referral, Advertising, or entitlement
evaluation.

The canonical direction is:

```text
provider event or provider reconciliation result
    -> verify/authenticate at provider boundary
    -> normalize to canonical commercial fact
    -> idempotently journal the fact
    -> reconcile affected account/source
```

The provider boundary must not directly scatter mutations into Vault,
Notifications, Advertising, Learn, or Account UI. It must not make an external
provider call part of ordinary product authorization.

No provider is selected. `PROVIDER DECISION DEFERRED` remains unchanged.

## 8. Billing relationship versus entitlement

### FROZEN ARCHITECTURAL DECISION

```text
BILLING RELATIONSHIP != EFFECTIVE ENTITLEMENT
```

A paid billing relationship may be represented conceptually as:

- active paid coverage;
- cancellation scheduled at the end of the current paid period;
- renewal recovery / seven-day grace;
- ended paid coverage;
- refunded or reversed paid coverage.

These are states of the `PAID` source and its billing relationship. They are
not interchangeable with a universal Effective Pro answer.

An account may have Effective Pro from Referral, Promotion, Admin Grant, or
Support Grant without an active paid subscription. Conversely, an active paid
relationship may coexist with other sources, and removing the paid source must
not remove valid other sources.

No product surface may use a local shortcut such as “subscription status is
active” as its universal entitlement rule. The canonical evaluator must
consider legitimate source state and the frozen time/coverage rules.

## 9. Normalized entitlement source state

### AUTHORITATIVE NORMALIZED SOURCE STATE

Each account-scoped entitlement source has current normalized state that can be
reconciled from the Commercial Event Journal. Source state is the current
semantic authority for whether that source is valid, pending, consumed,
revoked, ended, or otherwise unable to grant Pro.

Source state must remain source-local. A refund or chargeback affecting a paid
source changes that paid source; it does not perform a broad account-level
`set Free` mutation before surviving sources are evaluated.

The normalized state must support, conceptually:

- source identity and source type;
- owning account scope;
- source-specific lifecycle and validity;
- effective and expected end boundaries where meaningful;
- provenance back to commercial facts;
- revocation/correction relationship;
- consumption information for time-bearing sources; and
- the account entitlement-state revision at which the state was reconciled.

These are architectural capabilities, not concrete persistence fields.

The source-state layer is rebuildable from accepted commercial facts. A rebuild
must preserve the same source-local semantics and must not rely on provider
network availability at request time.

## 10. Canonical Effective Entitlement Evaluator

### FROZEN ARCHITECTURAL DECISION

NatalNode has one conceptual **Effective Entitlement Evaluator**. All
Pro-sensitive product surfaces must eventually depend on its same authoritative
semantic answer rather than inventing feature-specific checks.

The evaluator reasons over authoritative normalized source state and the
derived coverage projection when its revision is current. Conceptually it can
answer:

- whether the account has Effective Pro now;
- which legitimate source or coverage segment supplies access;
- which capability classes are permitted;
- the as-of entitlement-state revision;
- whether the answer is authoritative, unavailable, or indeterminate; and
- whether the request concerns new Pro capability or retained historical
  content.

This is a conceptual authority, not an API contract. The next task may define
the exact request/response shape and persistence representation.

The evaluator must preserve the product distinction between:

```text
authorization to generate or use a new Pro capability
authorization to view retained historical Pro content
```

It must not turn a missing projection, stale cache, or temporary operational
failure into destructive data cleanup.

## 11. Fail-closed commercial authorization

### FROZEN ARCHITECTURAL DECISION

If authoritative entitlement state cannot be safely determined, new Pro-only
operations must fail closed. The failure must not silently grant paid
capability, and it must not mutate or delete entitlement state.

Fail-closed means:

- no new Pro-only generation or automation starts on an indeterminate answer;
- no browser flag or stale cached Pro result is accepted as a fallback;
- historical stored Pro content continues to follow its separate viewability
  and deletion/retention policy; and
- an operational outage does not destructively downgrade or delete user data.

This architecture does not require a live provider call to recover an answer.
Canonical NatalNode state and reconciliation are the normal source of
authorization truth.

## 12. Entitlement-source provenance

### ARCHITECTURE REQUIREMENT

Every entitlement source must preserve provenance sufficient to answer:

- why the account has Pro;
- which source granted the access;
- when that source became effective;
- when it is expected to end, if bounded;
- whether it may be revoked;
- what caused revocation or correction; and
- which payment, referral, campaign, operator, or support authority is
  responsible where applicable.

Provenance is required even when a future implementation maintains an
aggregate coverage projection or cache. Aggregate state may accelerate reads;
it may not erase source-level explanation.

## 13. Source types and product tiers

### FROZEN ARCHITECTURAL DECISION

The architecture supports these minimum source types:

```text
PAID
REFERRAL
PROMOTION
ADMIN_GRANT
SUPPORT_GRANT
```

Source type explains why Pro exists; it is not an additional user-facing tier.
The user-facing product remains exactly:

```text
FREE
PRO
```

The architecture must not introduce `PRO_PLUS`, `PREMIUM`, `ULTIMATE`, or
another unnecessary user-facing tier. A Support Grant must not masquerade as
Annual paid subscription; Referral must not masquerade as customer payment;
and paid coverage must not masquerade as an Admin Grant.

## 14. Renewal grace architecture

### FROZEN ARCHITECTURAL DECISION

The seven-day renewal grace period belongs to the existing `PAID` billing
relationship. It is not a new user-facing entitlement source.

Conceptually:

```text
PAID source remains the source
    -> paid relationship enters recovery/grace condition
    -> Effective Pro remains available through the grace boundary
    -> recovery or source expiry is reconciled
```

Grace must not be represented as:

- a fake successful payment;
- a free trial;
- a Referral reward;
- an Admin Grant;
- a Support Grant; or
- a Promotion.

If an internal state distinction is required, it remains inside paid billing
semantics and must not be exposed as a new user-facing source.

If payment recovers during grace, paid Pro continues without a downgrade event,
duplicate coverage, or new trial. If grace ends without recovery, the paid
source ends and the evaluator considers valid Referral or other sources before
returning Free.

A failed first Pro purchase has no paid entitlement, no conventional trial, and
no seven-day renewal grace. This distinction must remain visible in source
state and commercial facts.

## 15. Referral lifecycle architecture

### FROZEN ARCHITECTURAL DECISION

The architecture preserves the product lifecycle vocabulary:

```text
PENDING -> EARNED -> APPLIED
     \                 |
      ------> REVOKED <
```

The lifecycle meanings are:

- `PENDING`: a qualifying purchase exists but the 14-day maturation period is
  incomplete;
- `EARNED`: the reward has successfully matured;
- `APPLIED`: earned Pro-time value has been incorporated into the referrer's
  effective entitlement timeline; and
- `REVOKED`: the reward was invalidated by an allowed reversal or fraud/self-
  referral decision.

The architecture must support a 30-real-day Pro reward per qualifying referred
customer. Reward identity, qualifying purchase provenance, maturation,
application, consumption, and revocation remain auditable.

No browser timer is authoritative for maturation. Maturation must be
server-authoritative and restart-safe. A later scheduler or worker may be
designed separately, but no scheduler is implemented by this freeze.

## 16. Referral time-bank and provenance

### ARCHITECTURE REQUIREMENT

Earned Referral Pro time is a duration bank / entitlement value that must be
substantively delivered. The architecture must preserve:

- one distinguishable reward identity per qualifying reward;
- sequential accumulation;
- no parallel consumption of multiple Referral rewards;
- no paid/Referral double-consumption;
- cancellation that does not erase earned Referral time;
- source-local revocation of unconsumed attributable value after an underlying
  reversal; and
- consumed time that never becomes negative debt.

An aggregate Referral balance or coverage projection may be used for
performance, but a single unattributed aggregate duration is insufficient. The
architecture must still answer which reward supplied, consumed, or revoked
which duration. This is required for post-maturation refund, chargeback,
partial consumption, fraud review, support explanation, and audit.

The existing rolling cap of 12 standard rewards / 360 standard reward days per
rolling 12 months is a product rule. Architecture must enforce it against
qualifying reward events rather than clicks, registrations, ad engagement, or
client-provided counts.

## 17. Paid -> Referral -> next Paid requirement

### FROZEN ARCHITECTURAL DECISION

The coverage architecture must support:

```text
ACTIVE PAID COVERAGE
    -> REFERRAL PRO COVERAGE
    -> NEXT PAID COVERAGE
```

Paid Pro time and Referral Pro time must not be consumed simultaneously for the
same effective access period. Referral days must extend the user's substantive
Pro timeline rather than disappear beneath overlapping paid coverage.

The requirement applies equally to Monthly and Annual Pro. Cancellation does
not revoke earned Referral time. When paid coverage, including its seven-day
grace where applicable, ends and valid Referral coverage exists, Referral Pro
must begin or continue without an unnecessary Free interval.

No provider-specific pause, renewal rescheduling, or billing API is selected.
The later provider integration must demonstrate a safe strategy for honoring
this product rule. If a provider cannot honor it safely, the provider cannot
force NatalNode to weaken the product promise.

## 18. Coverage projection and timeline segments

### DERIVED ENTITLEMENT PROJECTION

The architecture uses a derived, rebuildable entitlement coverage projection.
It may conceptually contain non-overlapping, provenance-bearing segments such
as:

```text
[paid coverage]
[referral coverage]
[promotion or grant coverage]
```

The projection must be able to answer:

- whether the account is Effective Pro now;
- current source of access;
- current paid coverage boundary;
- grace boundary;
- future queued Referral duration;
- future source transition; and
- future transition to Free if no legitimate source remains.

Coverage segments are authorization projections, not immutable commercial
history. When an authoritative refund, chargeback, maturation, revocation,
correction, or late event changes source state, future segment placement may be
recomputed. The historical commercial fact remains intact.

The paid/Referral ordering is frozen. Exact time-consumption ordering or
overlap among `PROMOTION`, `ADMIN_GRANT`, and `SUPPORT_GRANT` remains open.
The architecture must support fixed effective windows, duration grants, and an
explicit later overlap policy without destructive redesign.

## 19. Source-local reversal and no negative entitlement

### FROZEN ARCHITECTURAL DECISION

Refund, chargeback, reversal, or correction affects only the attributable
source state:

```text
Paid source revoked
    + valid Admin Grant
    = Admin Grant remains; Effective Pro continues

Referral reward revoked
    + valid paid source
    = paid source remains; Effective Pro continues
```

The evaluator recomputes Effective Pro from surviving legitimate sources. No
broad account-level “set Free” mutation is allowed without evaluating those
sources.

### ARCHITECTURE INVARIANT

Effective entitlement duration and source balances must never become negative.
A reversal may reduce only unconsumed attributable value. Consumed historical
access is never converted into negative future days, user debt, or unrelated
entitlement clawback.

## 20. Idempotency architecture

### FROZEN ARCHITECTURAL DECISION

Commercial operations must be idempotent across retries, duplicate delivery,
process restart, and concurrent reconciliation. Every accepted operation needs
a canonical idempotency identity that remains stable across transport retries.
The exact key format belongs to the next persistence/API task.

| Operation | Canonical idempotency identity concept | Duplicate result |
| --- | --- | --- |
| Provider payment-event ingestion | Verified provider event identity within its provider context, associated with the affected canonical source/account | One canonical commercial fact; no duplicate source effect. |
| Successful first purchase | Canonical purchase identity tied to the paid source and account | No duplicate paid coverage and no duplicate Referral qualification. |
| Renewal | Canonical renewal occurrence/coverage identity | No duplicate renewal period or double extension. |
| Refund | Canonical refund identity and affected purchase/source relationship | The paid source is reversed once. |
| Chargeback/payment reversal | Canonical dispute/reversal identity and affected source relationship | The paid source is withdrawn once; no negative time. |
| Cancellation update | Canonical cancellation operation for the paid relationship and effective period | Renewal intent changes once; no duplicate period. |
| Referral maturation | Canonical reward identity plus the maturation decision | A reward becomes earned at most once. |
| Referral revocation | Canonical reward/reversal relationship and revocation reason | Only the attributable unconsumed remainder is revoked once. |
| Referral application | Canonical reward application identity | Referral time is applied once and not double-extended. |
| Admin/Support Grant | Canonical grant issuance identity tied to source and authority | No duplicate grant. |
| Commercial correction | Canonical correction identity tied to the affected source/fact | One bounded compensating effect; history is not silently rewritten. |

Duplicate delivery must never duplicate paid coverage, Referral rewards,
grants, Referral consumption, or Pro extension. Idempotency is not a substitute
for authorization, event verification, or account ownership.

## 21. Out-of-order events and reconciliation

### FROZEN ARCHITECTURAL DECISION

Network arrival order is not commercial truth. Events may be late, duplicated,
out of order, retried, or delivered after process restart. Reconciliation must
preserve, where trustworthy:

- provider occurrence/effective time;
- NatalNode ingestion time;
- provider event identity;
- canonical source relationship; and
- the resulting normalized source state and revision.

The architecture must not implement “last webhook received wins.” A late
refund can reverse a source whose purchase event was received earlier; a
refund event may also arrive before a retried purchase-success event. In either
case, the canonical journal and source reconciliation must converge on the
commercially supported result without duplicating entitlement.

If an event cannot be safely associated with an account or source, the adapter
must not guess. It may retain a bounded reconciliation-pending outcome for a
later controlled reconciliation, without granting or revoking unrelated
entitlement.

## 22. Webhook and provider-ingestion boundary

### FROZEN ARCHITECTURAL DECISION

Future webhook handling must be:

- provider-adapter scoped;
- authenticated and verified at the boundary;
- idempotent;
- bounded in work and data;
- durable before downstream side effects where appropriate; and
- safe under retry and process restart.

The conceptual flow is:

```text
provider webhook
    -> verify/authenticate
    -> normalize to canonical commercial fact
    -> durable journal acceptance
    -> account/source reconciliation
    -> projection refresh or invalidation
    -> product systems consume canonical entitlement
```

Webhook ingestion must not directly mutate Vault, Notifications,
Advertising, Learn, or Account UI. No exact provider signature scheme, route,
payload, or provider SDK is designed here.

## 23. Owner-scoped concurrency control

### FROZEN ARCHITECTURAL DECISION

Concurrent commercial changes must be serialized at the account/owner scope
for authoritative reconciliation. The design must cover, at minimum:

- renewal and cancellation racing each other;
- refund racing Referral maturation;
- chargeback racing Referral consumption;
- duplicate webhooks racing each other;
- Admin Grant racing paid expiry; and
- entitlement reads occurring while source state changes.

The preferred direction is deterministic, account-scoped ownership of the
authoritative reconciliation operation. Source-local operations affecting one
account must share the relevant serialization boundary. Global commercial
locks are not required and should not be introduced as a substitute for
ownership scope.

The later persistence design must define transaction ownership and retry
behavior without relying on client ordering or provider arrival order.

## 24. Transactional consistency and external consistency domains

### FROZEN ARCHITECTURAL DECISION

One logically coupled NatalNode commercial operation should be able to update
its accepted canonical fact, affected normalized source state, and projection
revision/invalidation consistently within the NatalNode boundary. A permanent
state in which the fact is accepted but the source can never be reconciled is
not acceptable.

External payment providers and NatalNode are separate consistency domains. The
architecture must not attempt a distributed transaction with a provider. It
must use verified durable ingestion, idempotent reconciliation, and repairable
projection refresh instead.

If a process fails after the journal fact is durable but before the projection
refreshes, the durable fact remains the source for reconciliation; the
projection is stale/invalid and must be rebuilt. The failure must not cause
duplicate entitlement or data deletion.

## 25. Versioned entitlement state

### FROZEN ARCHITECTURAL DECISION

Each account has a monotonically changing entitlement-state revision. The
revision changes when accepted commercial facts or normalized source state
changes in a way that can affect authorization or coverage.

The revision exists conceptually for:

- projection invalidation;
- cache validation;
- stale-read detection;
- concurrent reconciliation safety;
- audit/debug explanation; and
- distinguishing an entitlement answer's as-of state.

The revision is not a user-visible tier, a payment-provider value, or a
concrete numeric-storage decision. The next persistence task may choose its
representation while preserving monotonicity and account scope.

## 26. Cache authority decision

### FROZEN ARCHITECTURAL DECISION

Cache and projection state are never the commercial source of truth. Any future
cache must be:

- owner/account scoped;
- invalidatable;
- rebuildable from authoritative commercial facts/source state;
- revision-aware where applicable; and
- safe to discard on process restart.

A stale cache must not permanently grant Pro. If its revision does not match
the authoritative account revision, the system must rebuild, use a trusted
authoritative path, or fail closed for a new Pro-only operation. Cache failure
must not delete user-owned data or rewrite commercial history.

No cache technology is selected here.

## 27. Ordinary online authorization path

### FROZEN ARCHITECTURAL DECISION

An ordinary product authorization request must not require a live payment-
provider API call. It normally reads NatalNode-owned canonical source state,
the current revision, and the evaluator/projection boundary.

Payment providers synchronize through verified webhooks, reconciliation, and
explicit billing workflows, not per-request remote authorization. This keeps
provider details out of ordinary product latency and availability paths.

If NatalNode-owned authoritative state is indeterminate, new Pro-only
authorization fails closed. It must not synchronously call an arbitrary
provider as an undocumented fallback.

## 28. Notification Platform integration boundary

### FROZEN ARCHITECTURAL DECISION

The existing Notification Platform remains separate from Billing Platform and
its transport is not redesigned. The conceptual path is:

```text
current account/source state
    -> canonical Effective Pro decision
    -> Notification eligibility
    -> existing preference/planner/outbox/channel/transport path
```

The architecture must not:

- make PushSubscription imply Pro;
- put payment-provider checks inside notification transport;
- make browser permission a paid entitlement;
- delete PushSubscription merely because Pro expires; or
- redesign the existing notification worker/outbox boundary.

When no Effective Pro source remains, Pro-only Astrology Alert execution
stops, while notification preferences and active owner-bound PushSubscription
state remain subject to the existing Notification and privacy contracts.

## 29. Advertising integration boundary

### FROZEN ARCHITECTURAL DECISION

Advertising must consume the same canonical Effective Pro decision as other
product surfaces. The conceptual chain is:

```text
Consent State
    + Page/Surface Advertising Eligibility
    + Canonical Effective Pro
    -> Permitted Advertising Mode
```

Any legitimate Effective Pro source is Ad-Free:

```text
PAID / REFERRAL / PROMOTION / ADMIN_GRANT / SUPPORT_GRANT -> AD-FREE
```

The advertising boundary must not independently inspect provider subscription
status, payment cookies, referral clicks, PushSubscription, or a client Pro
flag. It must preserve the approved surface whitelist, default no-ad surfaces,
no personalized/private astrology-result inventory, no Referral/ad incentive
coupling, and no sensitive natal-data targeting from the Advertising
Compliance Baseline.

During paid renewal grace, Effective Pro and Ad-Free remain active. When no
legitimate Pro source remains, Free advertising may resume only on approved
surfaces and only through the approved consent/eligibility path.

No advertising provider, ad script, CMP, or advertising runtime is selected or
implemented here.

## 30. Vault integration boundary

### FROZEN ARCHITECTURAL DECISION

Vault quota authorization consumes canonical Effective Pro:

```text
Effective Pro -> unlimited product-direction Vault capacity
Free          -> three saved charts
```

If Pro ends and the account has more than three saved charts, the architecture
must preserve the charts, allow viewing and deletion, and block new creation
until the account falls below the Free capacity. It must not use quota
enforcement as destructive cleanup or a data-hostage mechanism.

Vault persistence remains an independent product boundary. Entitlement state
may authorize create or workflow capability; it must not alter stored chart
facts, Engine metadata, or scientific provenance.

## 31. Historical Pro-content authorization

### FROZEN ARCHITECTURAL DECISION

Historical stored Pro content must not rely exclusively on current Effective
Pro for viewability. Architecture must distinguish:

```text
authorization to generate/use new Pro capability
authorization to view retained historical Pro content
```

Stored Pro content remains viewable after entitlement downgrade under the
frozen product rule. This is not a permanent-storage guarantee. User deletion,
account deletion/erasure, applicable retention policy, technical lifecycle, and
legally required deletion or retention boundaries remain independent controls.

Subscription expiration or refund alone must not delete historical charts or
stored Pro content. A stale evaluator or provider outage must not hide or
delete retained content merely because new Pro operations fail closed.

## 32. Account erasure and retention boundary

### FROZEN ARCHITECTURAL DECISION

Commercial architecture must distinguish at least:

- product-owned user data;
- Commercial Event Journal/history;
- normalized entitlement source state and projections;
- payment/accounting records;
- Referral reward history;
- Admin/Support Grant audit;
- fraud/security evidence; and
- consent/compliance records.

The existing Account Deletion / Erasure contract remains authoritative for the
current account-owned application graph. Future commercial persistence must be
added to the reviewed ownership, erasure, retention, export, backup, and
processor analysis before implementation.

Account erasure may treat records differently where lawful retention duties
apply, but the architecture must not assume every commercial record is
identical or silently exempt every commercial record for convenience. No
retention duration is defined here. No commercial design may weaken user
deletion guarantees or turn subscription expiration into a data-deletion
instruction.

## 33. Account Export boundary

### ARCHITECTURE REQUIREMENT

Commercial and entitlement data must be flagged for future Account Export
reconciliation. The next export-policy and API design may consider:

- user-visible current entitlement state;
- user-visible Referral reward history;
- user-visible or support-visible grant information where appropriate; and
- bounded source/provenance explanations safe for account disclosure.

The architecture must not automatically declare every internal commercial,
provider, fraud, security, or accounting record part of user export. It must
not export provider secrets, payment credentials, sensitive fraud signals, or
raw provider payloads merely because they exist in the commercial boundary.

The existing Account Data Export contract remains authoritative until a later
approved commercial export contract reconciles these categories.

## 34. Observability and audit explanation

### ARCHITECTURE REQUIREMENT

Future commercial observability must be capable of explaining, with bounded
privacy-minimized metadata:

- why Effective Pro is active or inactive;
- which entitlement source supplied the answer;
- source-state and coverage transitions;
- duplicate suppression and idempotent outcomes;
- reconciliation failures or pending association;
- webhook verification or processing failure; and
- projection or rebuild failure.

Operational observability remains distinct from Privacy Access Audit. Neither
stream may log full provider payloads by default, payment secrets, full card
credentials, raw webhook bodies, birth information, coordinates, chart facts,
private interpretations, Vault content, or unnecessary account identifiers.

The later observability design must keep event explanations bounded and
reviewable without turning commercial logs into a sensitive astrology or
advertising data export.

## 35. Security and privacy boundary

### FROZEN ARCHITECTURAL DECISION

Commercial entitlement architecture must not become a new path for leaking:

- birth date or birth time;
- birth coordinates or timezone-resolution detail;
- natal chart facts;
- private interpretations;
- Vault contents or notes; or
- private notification content.

into:

- billing-provider metadata;
- advertising systems;
- Referral payloads;
- ordinary commercial observability; or
- support records beyond the minimum needed for an authorized operation.

Payment, Referral, grant, and advertising boundaries must receive only data
genuinely necessary for their approved commercial purpose. The Advertising
Compliance Baseline's prohibition on sensitive astrology targeting remains
unchanged.

## 36. Referral attribution boundary

### FROZEN ARCHITECTURAL DECISION

Referral attribution remains separate from internal account IDs exposed
publicly. Architecture must preserve:

- a non-predictable public referral identity;
- one first-purchase referral conversion per user;
- attribution lock after the qualifying first purchase;
- exclusion of historical paid users from first-purchase conversion;
- server-authoritative self-referral prevention; and
- privacy-conscious, bounded abuse review.

The browser may carry an attribution signal, but it must not choose the final
referrer, rewrite a locked relationship, or claim a reward. No referral-code
format, cookie lifetime, attribution window, or fraud engine is designed here.

## 37. Referral maturation and post-maturation reversal

### ARCHITECTURE REQUIREMENT

The durable conceptual maturation path is:

```text
successful qualifying purchase
    -> PENDING
    -> 14-day maturation
    -> EARNED
    -> APPLIED
```

Before maturation, a verified refund, chargeback, reversal, or confirmed
fraudulent/self-referral decision may produce:

```text
PENDING -> REVOKED
```

After maturation, a later reversal of the underlying referred purchase may
revoke only the unconsumed reward value attributable to that purchase. The
architecture must preserve:

- consumed historical duration;
- no negative entitlement;
- unrelated Referral reward history;
- unrelated paid entitlement; and
- unrelated Promotion/Admin/Support Grant entitlement.

The operation must be idempotent, account-scoped, source-local, and auditable.
The public lifecycle vocabulary remains `PENDING`, `EARNED`, `APPLIED`, and
`REVOKED`. A private reason for later revocation after partial or full
consumption may be retained later without creating a new public lifecycle
state.

## 38. Commercial reconciliation service/process

### FROZEN ARCHITECTURAL DECISION

The architecture includes a conceptual account-scoped reconciliation process
that can rebuild or verify normalized source state and the derived entitlement
projection from authoritative commercial facts.

Reconciliation must support:

- a missed or delayed webhook;
- a duplicate event;
- an out-of-order event;
- provider-state reconciliation;
- projection corruption or invalidation;
- support diagnosis; and
- recovery after an application outage.

Reconciliation is not a request-time provider call and is not necessarily a
scheduled worker. Scheduler cadence, polling, operational ownership, and repair
controls remain open for the next task.

A reconciliation run must be owner/account scoped, idempotent, revision-aware,
and capable of explaining what it accepted, ignored, corrected, or left
pending. It must not invent facts from missing data or mutate an unrelated
account.

## 39. Provider capability requirements

### EXTERNAL / PROVIDER GATE

No provider is selected. Future provider candidates must be evaluated against
the frozen product and architecture requirements, including:

- Monthly and Annual recurring billing;
- cancellation effective at the end of the paid period;
- renewal failure and recovery with the seven-day grace boundary;
- confirmed refund and chargeback/reversal events;
- verified webhook delivery;
- stable event identities suitable for idempotent ingestion;
- support for, or a safe provider-neutral model of, delayed next paid coverage
  while Referral days are delivered;
- future regional, currency, tax, and consumer-rights requirements;
- customer billing-management needs; and
- operational reliability and reconciliation capability.

Provider-specific mechanics remain outside this freeze. If a provider cannot
honor the Referral timing promise, source-local reversal, auditability, and
grace semantics safely, it must not force NatalNode to weaken those frozen
product rules.

## 40. Frozen architecture invariants

The following are dedicated V1 architecture invariants. A later persistence,
API, provider, or runtime design must preserve all of them:

1. No authoritative persistent `is_pro` boolean exists as a substitute for
   entitlement evaluation.
2. Effective Pro derives from at least one legitimate entitlement source.
3. Entitlement source provenance remains explainable and recoverable.
4. Commercial events are idempotent.
5. Duplicate provider events cannot duplicate entitlement.
6. Refund, chargeback, and reversal affect only the attributable source.
7. Entitlement time and source balances never become negative.
8. Paid and Referral time do not double-consume the same access period.
9. Referral rewards retain per-reward provenance.
10. Renewal grace remains Effective Pro and Ad-Free while valid.
11. Any legitimate Effective Pro source is Ad-Free while valid.
12. PushSubscription does not imply Pro.
13. Free status does not delete user-owned historical data.
14. Projection and cache are rebuildable and are not sole commercial truth.
15. Ordinary product authorization does not require a live provider API call.
16. Provider-specific objects do not leak into product domains.
17. Commercial reconciliation is account/owner scoped.
18. Sensitive natal data is not commercial or advertising metadata.
19. Historical Pro-content viewability is distinct from new Pro authorization.
20. The account entitlement revision is monotonic and guards stale projection
    or cache decisions.
21. Provider outage or projection failure does not destructively erase data.
22. Corrections are attributable and do not silently rewrite unrelated history.

## 41. Failure-mode audit

The following audit is architectural only. It defines expected convergence and
safety behavior without specifying persistence syntax.

| Case | Failure or race | Expected architectural behavior |
| --- | --- | --- |
| A | Provider sends the same renewal event twice. | The provider boundary verifies and deduplicates the canonical provider event identity. One commercial fact and one renewal coverage effect result; paid coverage is not duplicated. |
| B | Refund webhook arrives before the purchase-success webhook retry. | The verified refund fact may be journaled with its stable source/purchase relationship. Reconciliation does not grant from an unconfirmed purchase and does not guess an unsafe association; when the purchase fact arrives, source state converges to the refunded result. If association is not safe, the event remains bounded and pending rather than mutating unrelated entitlement. |
| C | Referral maturation and refund race. | Account-scoped reconciliation serializes the reward and underlying purchase decision. Before maturation, the reward can become `REVOKED`; after maturation, only the unconsumed attributable value is revocable. Duplicate processing cannot earn and revoke competing copies or create debt. |
| D | Referral reward is partly consumed when chargeback arrives. | The affected reward's unconsumed attributable remainder is revoked. Consumed days remain historical access; unrelated rewards and paid/granted sources remain; no negative balance or repayment is created. |
| E | Paid subscription expires while Referral days exist. | The paid source ends, then the coverage projection places valid Referral time next. Effective Pro continues without an unnecessary Free interval. |
| F | Renewal fails while Referral balance exists. | The paid source enters the seven-day grace condition and remains Effective Pro/Ad-Free during grace. If recovery fails, Referral coverage follows immediately when valid. No fake grace source or duplicate paid period is created. |
| G | Grace expires with Referral balance. | The paid renewal source ends, but Referral time supplies Effective Pro. Free begins only after all legitimate sources end; Free ads do not appear between contiguous valid Pro sources. |
| H | Admin Grant is active when the paid source is refunded. | Only the paid source is removed. The valid Admin Grant remains and the evaluator continues Effective Pro. The account is not broadly set to Free. |
| I | Promotion and paid source overlap. | The projection can represent both valid windows without silently freezing an ordering not approved by product policy. Effective Pro is available from a legitimate source; paid/Referral sequencing remains enforced; Promotion/Admin/Support overlap policy remains open. |
| J | Two commercial events for one owner reconcile concurrently. | The account-scoped serialization boundary and monotonic revision prevent lost updates, duplicate effects, and stale projection publication. One deterministic reconciled state is produced. |
| K | Entitlement projection is stale. | Revision mismatch invalidates or bypasses the projection. The system rebuilds from authoritative source state or fails closed for a new Pro-only operation. It does not grant from stale data or delete historical content. |
| L | Billing provider is temporarily unavailable. | Ordinary authorization uses NatalNode-owned canonical state and does not call the provider. If local authoritative state is indeterminate, new Pro operations fail closed; no destructive downgrade or data deletion occurs. |
| M | Webhook is accepted but reconciliation crashes before projection refresh. | The durable canonical fact remains. The affected projection is stale/invalid and is rebuilt by later reconciliation. Retry is idempotent and cannot duplicate coverage. |
| N | Account deletion occurs while commercial records have separate retention obligations. | The active account-owned graph follows the Account Erasure contract. Commercial, payment, fraud, and compliance records are separately classified for approved legal/retention treatment; no retention period or silent deletion exception is invented here. |

## 42. Threat and abuse boundary audit

This is a bounded architecture review, not a full fraud engine or operational
security policy.

| Threat or abuse case | Required architectural control |
| --- | --- |
| Forged billing webhook | Provider-adapter verification/authentication occurs before a canonical fact can be accepted. Unverified input cannot mutate source state. |
| Duplicate webhook replay | Stable provider event identity and canonical idempotency prevent duplicate journal effects and duplicate entitlement. |
| Referral self-award | Server-authoritative account attribution, locked first-purchase relationship, historical paid-user exclusion, and bounded self-referral checks prevent client-claimed reward. |
| Referral reward duplication | Reward identity, maturation identity, application identity, account serialization, and source-level provenance make repeat delivery converge to one reward. |
| Operator grant abuse | Grants are explicit, bounded, attributable, auditable, and tied to future authorized operator/authority controls; no permanent unaudited Pro switch is allowed. |
| Unauthorized entitlement correction | Corrections enter the canonical commercial boundary, require later authorized operations policy, create attributable compensating facts, and cannot rewrite unrelated history or create negative time. |
| Stale-cache Pro access | Cache is never authority; account revision mismatch invalidates it, and indeterminate new Pro authorization fails closed. |
| Cross-account entitlement mutation | Account/owner-scoped reconciliation and server-derived ownership prevent client account selectors from changing another account's source state. |
| IDOR against billing or Referral resources | Future account-facing APIs must derive owner scope from the authenticated account and must not trust public IDs, referral identifiers, or provider identifiers as authorization. Exact API controls remain in the next task. |
| Sensitive-data leakage into provider metadata | Provider adapter and commercial event projections use an allowlist of necessary commercial data; birth data, chart facts, interpretations, and credentials are excluded. |
| Advertising eligibility incorrectly ignores Pro | Advertising consumes canonical Effective Pro together with consent and surface policy; it cannot independently infer Free from provider status, cookies, or PushSubscription. |

No invasive device fingerprinting, cross-site identity graph, or generalized
surveillance system is authorized by this architecture. Fraud/security
enforcement policy remains a separate open decision.

## 43. Open architecture decisions

The following remain explicitly OPEN for the next persistence/API design or a
later external gate. They must not be silently decided by implementation:

- concrete persistence schema, conceptual-to-physical mapping, table names,
  fields, types, indexes, constraints, and migration strategy;
- exact commercial event vocabulary, state names, correction/reversal encoding,
  and event payload contract;
- exact source-state representation and coverage-projection representation;
- exact Effective Entitlement Evaluator API, capability vocabulary, error
  contract, and authorization projection;
- exact account-revision representation and conflict/retry mechanics;
- exact provider webhook verification/signature scheme and raw-evidence policy;
- concrete payment provider and billing portal/provider boundary;
- exact provider mechanics for delaying or rescheduling the next paid coverage
  while Referral time is consumed;
- exact payment retry cadence and dunning-message schedule;
- exact ordering or overlap policy among Promotion, Admin Grant, and Support
  Grant, including whether those sources stack sequentially or overlap;
- maximum Admin Grant and Support Grant duration;
- exact Referral-code format, attribution window, cookie lifetime, and public
  identity rotation behavior;
- cache technology, invalidation transport, and rebuild triggers;
- reconciliation scheduler, polling, repair, and operational ownership;
- commercial-record retention, backup, legal hold, deletion, and accounting
  treatment;
- future commercial Account Export representation and exclusions;
- operator RBAC implementation, support permissions, and correction approval;
- exact tax, currency, regional pricing, and consumer-rights architecture; and
- external provider, legal, fraud/security, and operations requirements.

These open decisions do not weaken the frozen layer separation, source-local
reversal, Referral sequence, idempotency, fail-closed authorization, privacy
firewall, or provider-neutral boundary.

## 44. Source review and evidence basis

This architecture freeze was reviewed against the following repository
documents:

- `C:\NatalNode-Web\docs\PRD.md` for Free/Pro product boundaries, Engine-first
  and provider-neutral principles, Vault, Alerts, Ads, privacy, release gates,
  and the Website API/BFF boundary;
- `C:\NatalNode-Web\docs\ARCHITECTURE.md` for the fixed
  Website/BFF -> Engine Public API boundary and no speculative cleanup;
- `C:\NatalNode-Web\docs\product\NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md`
  for the upstream frozen first- and second-layer commercial semantics;
- `C:\NatalNode-Web\docs\product\NATALNODE_ADVERTISING_COMPLIANCE_BASELINE_V1.md`
  for Ad-Free, surface whitelist, consent, privacy, and targeting boundaries;
- `C:\NatalNode-Web\docs\product\NATALNODE_NOTIFICATION_PLATFORM_V1.md`
  for Consumer notification ownership, eligibility separation, PushSubscription,
  account deletion, export, retention, and billing separation;
- `C:\NatalNode-Web\docs\product\NATALNODE_PRIVACY_TERMS_POLICY_V1.md`
  for current absence of commercial runtime, public-copy boundaries, and
  unresolved legal/privacy decisions;
- `C:\NatalNode-Web\docs\product\NATALNODE_DATA_RETENTION_V1.md` for
  technical expiry versus retention, account-erasure interaction, external
  processor boundaries, and policy-gated commercial lifecycle values;
- `C:\NatalNode-Web\docs\product\NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md`
  for the account-owned erasure graph and active-database deletion boundary;
- `C:\NatalNode-Web\docs\product\NATALNODE_ACCOUNT_DATA_EXPORT_V1.md` for
  safe account export scope, secret exclusions, and future commercial-data
  reconciliation;
- `C:\NatalNode-Web\docs\product\NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md`
  for restricted audit semantics and separation from ordinary observability;
- `C:\NatalNode-Web\docs\product\NATALNODE_OBSERVABILITY_V1.md` for bounded
  operational observability and prohibited sensitive logging;
- `C:\NatalNode-Web\docs\product\NATALNODE_PRODUCT_ROADMAP_V1.md` for
  deferred monetization, privacy/CMP gates, and independent product tracks;
- `C:\NatalNode-Web\docs\design\NATALNODE_VISUAL_SYSTEM_V1.md` for the
  content-first, ad-free core-surface and privacy/performance direction; and
- `C:\NatalNode-Web\docs\design\NATALNODE_BRAND_SYSTEM_V1.md` for the
  existing shared brand boundary.

No upstream product-policy document is modified by this architecture freeze.
No runtime, package, manifest, dependency, lockfile, migration, or scientific
repository is changed. `C:\NatalNode` remains outside the review and
implementation boundary.

## 45. Freeze conclusion

```text
Commercial facts                  = DURABLE, APPEND-ORIENTED, AUDITABLE
Normalized source state            = AUTHORITATIVE, ACCOUNT-SCOPED, REBUILDABLE
Entitlement projection             = DERIVED, REVISION-AWARE, REBUILDABLE
Product authorization              = ONE CANONICAL EFFECTIVE ENTITLEMENT EVALUATOR
User-facing tiers                  = FREE + PRO ONLY
Entitlement sources                = PAID / REFERRAL / PROMOTION / ADMIN_GRANT / SUPPORT_GRANT
Authoritative is_pro boolean       = PROHIBITED
Renewal grace                     = PAID-SOURCE SEMANTICS, 7 DAYS, NOT A NEW SOURCE
Referral lifecycle                 = PENDING / EARNED / APPLIED / REVOKED
Referral value                     = 30 REAL PRO DAYS PER QUALIFYING REWARD
Coverage order                     = PAID -> REFERRAL -> NEXT PAID
Refund/reversal scope              = AFFECTED ATTRIBUTABLE SOURCE ONLY
Negative entitlement               = PROHIBITED
Idempotency                        = REQUIRED FOR COMMERCIAL OPERATIONS
Event ordering                     = OCCURRENCE/EFFECTIVE TIME + RECONCILIATION, NOT LAST-WEBHOOK-WINS
Concurrency                        = ACCOUNT/OWNER-SCOPED SERIALIZATION
Entitlement revision               = MONOTONIC PER ACCOUNT
Cache authority                    = NEVER COMMERCIAL SOURCE OF TRUTH
Ordinary provider call             = NOT REQUIRED FOR AUTHORIZATION
Notification                       = CANONICAL ENTITLEMENT -> EXISTING ELIGIBILITY PATH
Advertising                       = CANONICAL ENTITLEMENT + CONSENT + SURFACE POLICY
Vault                              = CANONICAL ENTITLEMENT; FREE CAPACITY 3
Historical Pro content             = VIEWABILITY SEPARATE FROM NEW PRO AUTHORIZATION
Account erasure/retention          = SEPARATE CLASSIFICATION; NO RETENTION PERIOD HERE
Provider selection                 = DEFERRED
Runtime implementation             = DEFERRED
```

Subscription / Entitlement Architecture V1 is frozen at this conceptual,
provider-neutral level. The next task is:

> **SUBSCRIPTION / ENTITLEMENT PERSISTENCE & API CONTRACT DESIGN**

Do not begin implementation, provider selection, concrete persistence design,
or API contract work as part of `WEB-COMMERCIAL-001C`.
