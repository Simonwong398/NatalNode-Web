# NatalNode Subscription / Entitlement Persistence & API Contract V1

| Field | Value |
| --- | --- |
| Status | **PERSISTENCE / API / TRANSACTION CONTRACT V1 FROZEN / IMPLEMENTATION DEFERRED** |
| Task | `WEB-COMMERCIAL-001D` |
| Reviewed baseline | `2540433dede5d7a9647d43361d532311cf227a95` (`fix: refine mobile learn brand position`) |
| Product-policy authority | `docs/product/NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md` |
| Advertising-policy authority | `docs/product/NATALNODE_ADVERTISING_COMPLIANCE_BASELINE_V1.md` |
| Architecture authority | `docs/architecture/NATALNODE_SUBSCRIPTION_ENTITLEMENT_ARCHITECTURE_V1.md` |
| Provider status | **PROVIDER DECISION DEFERRED** |
| Implementation status | **DEFERRED** |

## 1. Purpose and authority

This document freezes the provider-neutral V1 persistence, API, idempotency,
transaction, locking, revision, privacy, and operational contract for future
Subscription and Entitlement implementation. It turns the frozen product and
architecture semantics into a concrete design without creating executable SQL,
runtime code, routes, provider integration, or migrations.

The upstream documents remain authoritative for product meaning. If this
document appears to conflict with an upstream frozen product rule, the upstream
rule wins and implementation must stop for contract review. This design does
not select a payment provider, billing portal, advertising provider, consent
management platform, pricing, tax treatment, geography, or retention duration.

The fixed system boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
```

Commercial persistence belongs to the Website/BFF and Account boundary. It
must not store or calculate astronomy facts, call an astronomy provider, alter
Engine requests, or become an alternative scientific authority.

## 2. Frozen layer and authority hierarchy

The following hierarchy is normative:

1. **AUTHORITATIVE COMMERCIAL FACTS** — accepted, append-oriented canonical
   facts in `CommercialEvent`.
2. **AUTHORITATIVE NORMALIZED SOURCE STATE** — current source-local paid,
   Referral, or grant state reconciled from accepted facts.
3. **DERIVED ENTITLEMENT PROJECTION** — owner-scoped, revision-aware,
   rebuildable current/future coverage.
4. **CACHE** — optional revision-aware performance data with no independent
   authority.
5. **EXTERNAL PROVIDER STATE** — verified reconciliation input behind the
   adapter boundary, never ordinary product authorization truth.

Product authorization uses the normalized source state through one canonical
evaluator. It may use a projection only when the projection revision and time
validity are current. It never trusts provider state, a cache, a browser flag,
a cookie, a payment response, a Referral link, or `isPro` by itself.

## 3. Scope and non-goals

This contract freezes:

- the minimum durable entity set and its conceptual fields;
- source provenance, identities, uniqueness, and referential integrity;
- paid, Referral, grant, receipt, projection, and revision semantics;
- state machines and source-local correction/reversal behavior;
- business idempotency and provider replay protection;
- database transaction boundaries and deterministic lock order;
- canonical entitlement and capability read contracts;
- user, provider-ingestion, internal, and operator API classifications;
- Vault, Notification, Advertising, historical-content, deletion, retention,
  export, observability, and security boundaries; and
- future migration, implementation, and real-PostgreSQL acceptance slices.

This contract does not authorize:

- executable DDL, migrations, ORM models, TypeScript, APIs, webhooks, workers,
  schedulers, tests, UI, checkout, billing portal, or provider SDKs;
- a payment, advertising, consent, cache, scheduler, or billing provider;
- Referral code format, attribution window, fraud engine, operator RBAC, or
  final non-Referral grant precedence;
- price, tax, currency, geography, dunning, retention, backup, or legal rules;
- changes to Vault, Notification transport, Advertising, Account Export,
  Account Erasure, EngineClient, or scientific behavior; or
- access to or modification of `C:\NatalNode`.

All schema names below are conceptual and may be adapted to repository naming
conventions in a separately authorized migration. Their semantics and
invariants may not be weakened.

## 4. Minimum durable entity model

### 4.1 Entity set

| Entity | Classification | Purpose |
| --- | --- | --- |
| `CommercialAuthority` | Authoritative owner/serialization state | Maps a live Account to one commercial authority, owns the monotonic revision, and supplies the owner-scoped lock. |
| `CommercialEvent` | Authoritative commercial fact | Append-oriented canonical journal with provenance, causation, correction, reversal, and idempotency identity. |
| `ProviderIngestionReceipt` | Ingestion/replay evidence | Provider-neutral verification, duplicate, processing, reconciliation, and bounded failure record. |
| `PaidBillingRelationship` | Authoritative normalized source state | Canonical NatalNode paid relationship and renewal intent, distinct from provider enums and entitlement. |
| `PaidCoverage` | Authoritative normalized source state | Purchase/renewal-attributable paid coverage boundaries and source-local reversal. |
| `ReferralPublicIdentity` | Public identity boundary | Non-predictable, revocable public Referral identity separate from Account and internal authority IDs. |
| `ReferralAttribution` | Authoritative normalized source state | Referrer/referred first-purchase attribution, eligibility, and lock. |
| `ReferralReward` | Authoritative normalized source state | Per-conversion 30-day reward, maturation, application, consumption, and attributable revocation. |
| `GrantEntitlement` | Authoritative normalized source state | Provider-neutral Promotion, Admin Grant, and Support Grant with fixed-window or duration-bank capability. |
| `EntitlementProjection` | Derived projection | Rebuildable, owner-scoped effective entitlement and bounded future transition view. |

### 4.2 Deliberate merges

`EntitlementRevision` is not a separate history table in V1. The current
monotonic `entitlement_revision` belongs to `CommercialAuthority`; accepted
events explain why it advanced, and `EntitlementProjection.source_revision`
records which revision it consumed. A separate revision-history table would
duplicate the journal without adding authority.

`CommercialCorrection` is not a separate entity. A correction or reversal is
a new `CommercialEvent` with a canonical correction identity and a typed
`corrects_event_id` or `reverses_event_id`; its attributable normalized source
state is reconciled in the same transaction. This keeps history append-oriented.

A single unattributed `owner.referral_days_balance` is prohibited as source
state. An aggregate may appear only in a revision-matched projection or cache.

### 4.3 Commercial authority and privacy indirection

`CommercialAuthority` has these conceptual fields:

| Field | Contract |
| --- | --- |
| `commercial_authority_id` | Opaque server-generated primary identity; never public and never a scientific/provider ID. |
| `owner_id` | Unique live Account link. It is server-resolved, never client-selected, and may be detached only by the approved account-erasure flow. |
| `entitlement_revision` | Non-negative, monotonically increasing owner-scoped integer. |
| `created_at`, `updated_at` | Database-authoritative UTC instants. |
| `detached_at` | Null while linked; set only by approved account erasure when a policy permits a pseudonymous commercial subject to remain. |

All commercial entities reference `commercial_authority_id`. They do not copy
email, birth data, or a public Referral identity. The logical `owner_id` of an
event or source is resolved through the authority record while the account is
live. This indirection permits a future approved erasure transaction to remove
the direct Account link and active entitlement state without rewriting journal
facts or retaining a direct user identifier merely for convenience.

The existing Account Erasure contract predates commercial tables. Before any
commercial migration can ship, its ownership graph must be updated so that it
deliberately handles this authority link. `owner_id` must use a restrictive
relationship rather than an accidental cascade or orphan: erasure must either
delete the entire commercial subject where no retention basis exists, or
atomically detach the direct owner link and remove active source/projection
state under an approved policy. No retention duration is selected here.

## 5. CommercialEvent journal contract

`CommercialEvent` is the accepted NatalNode commercial-history authority. Its
conceptual fields are:

| Field | Contract |
| --- | --- |
| `event_id` | Opaque server-generated primary identity. |
| `commercial_authority_id` / logical `owner_id` | Required authority scope for an accepted owner-affecting fact; logical owner resolves through `CommercialAuthority`, avoiding duplicated Account IDs in retained history. |
| `event_type` | Bounded canonical NatalNode event vocabulary, not a provider status string. |
| `source_type` | `PAID`, `REFERRAL`, `PROMOTION`, `ADMIN_GRANT`, or `SUPPORT_GRANT`. |
| `source_entity_id` | Required canonical source-state identity affected or created by the fact. |
| `source_namespace` | Bounded internal producer namespace such as billing adapter, Referral policy, operator, support, promotion, or time reconciliation. |
| `provider_namespace` | Nullable bounded adapter namespace; absent for NatalNode-native facts. No provider is selected by defining the field. |
| `provider_context` | Nullable restricted provider account/environment scope used with provider identity; never exposed to ordinary product domains. |
| `provider_event_id` | Nullable provider event identity when applicable. It is evidence, not a public API field. |
| `provider_receipt_id` | Nullable link to the accepted ingestion receipt. One receipt may cause multiple owner/source events. |
| `idempotency_namespace` | Bounded business-operation namespace. |
| `idempotency_key` | Stable canonical business identity, not a random transport request ID alone. |
| `operation_digest` | Hash of the normalized semantic operation used to detect same-key/different-operation conflict; not a payload dump. |
| `occurred_at` | Trusted source occurrence instant when available. It does not decide state by arrival order alone. |
| `effective_at` | Canonical UTC instant at which the fact affects source semantics. |
| `ingested_at` | Database time at first durable NatalNode acceptance. |
| `caused_by_event_id` | Nullable prior canonical fact that caused this one. |
| `corrects_event_id` | Nullable fact whose bounded metadata/effect is corrected. |
| `reverses_event_id` | Nullable fact whose attributable commercial effect is reversed. |
| `attributes` | Bounded, allowlisted normalized attributes needed to rebuild source state. No arbitrary metadata map. |
| `attributes_version` | Version of the canonical attributes schema for this event type. |
| `schema_version` | Journal-envelope schema/version marker. |
| `actor_class`, `actor_reference` | Nullable bounded server/provider/operator/service provenance. Operator identity is opaque and server-derived. |

### 5.1 Canonical V1 event vocabulary

The V1 event vocabulary is finite. A provider adapter maps external events to
these NatalNode meanings; it never inserts a provider status as `event_type`.

| Family | Canonical event types |
| --- | --- |
| Paid relationship | `PAID_RELATIONSHIP_OPENED`, `PAID_FIRST_PURCHASE_FAILED`, `PAID_CANCELLATION_SCHEDULED`, `PAID_RENEWAL_RESTORED`, `PAID_RELATIONSHIP_ENDED` |
| Paid coverage | `PAID_PURCHASE_SUCCEEDED`, `PAID_RENEWAL_SUCCEEDED`, `PAID_RENEWAL_FAILED`, `PAID_GRACE_EXPIRED`, `PAID_COVERAGE_ENDED`, `PAID_COVERAGE_REFUNDED`, `PAID_COVERAGE_CHARGEBACKED` |
| Referral attribution | `REFERRAL_ATTRIBUTION_RECORDED`, `REFERRAL_ATTRIBUTION_LOCKED`, `REFERRAL_ATTRIBUTION_INVALIDATED` |
| Referral reward | `REFERRAL_REWARD_PENDING`, `REFERRAL_REWARD_CAP_REJECTED`, `REFERRAL_REWARD_MATURED`, `REFERRAL_REWARD_APPLIED`, `REFERRAL_REWARD_CONSUMPTION_STARTED`, `REFERRAL_REWARD_EXHAUSTED`, `REFERRAL_REWARD_REVOKED` |
| Grant | `GRANT_ISSUED`, `GRANT_ACTIVATED`, `GRANT_EXPIRED`, `GRANT_EXHAUSTED`, `GRANT_REVOKED` |
| Correction | `COMMERCIAL_CORRECTION_RECORDED` |

`PAID_COVERAGE_REFUNDED` means a confirmed full refund for the attributable
coverage. Exceptional partial-refund handling uses
`COMMERCIAL_CORRECTION_RECORDED`; it does not infer proportional time.
`PAID_COVERAGE_CHARGEBACKED` covers a confirmed chargeback or equivalent
payment reversal. `GRANT_*` carries `source_type` to distinguish Promotion,
Admin Grant, and Support Grant.

Because a cap-rejected conversion creates no `ReferralReward`, its
`REFERRAL_REWARD_CAP_REJECTED` event uses the locked `ReferralAttribution` as
`source_entity_id` and carries only the qualifying PaidCoverage reference and
bounded cap-decision attributes. This preserves the required source identity
without inventing a reward row.

Each event type has a versioned, allowlisted attributes schema containing only
the identities, bounded reasons, intervals, duration values, and prior-event
references needed by the corresponding source contract. An event type outside
this table requires a reviewed contract version; arbitrary strings are
rejected. Provider receipts, projection rebuilds, cache writes, and ordinary
reads are not CommercialEvents.

### 5.2 Immutability

- Accepted events are append-only application records.
- Business fields, timestamps, identities, attributes, and links are never
  updated to manufacture a different history.
- Corrections and reversals append new attributable events.
- Only narrowly technical metadata that cannot alter business meaning may be
  mutable, such as a bounded archival classification after approved policy.
- Provider replay, source-state rebuild, and projection rebuild never rewrite
  the original event.
- Normal application code exposes no update or delete API for journal facts.

### 5.3 Raw provider evidence

Raw provider bodies are not canonical business truth and are not stored in
`CommercialEvent`. If future legal/security/operations review requires raw or
near-raw evidence, it must use a separately access-controlled, encrypted,
bounded, retention-classified evidence store with its own size limit,
redaction, access audit, and deletion policy. Its existence is OPEN and is not
authorized here. Hashes and allowlisted normalized attributes are preferred.

## 6. ProviderIngestionReceipt contract

The receipt isolates provider transport/replay handling from commercial truth.
Its conceptual fields are:

| Field | Contract |
| --- | --- |
| `provider_receipt_id` | Opaque server-generated identity. |
| `provider_namespace` | Bounded adapter namespace. |
| `provider_context` | Restricted merchant/account/environment scope. |
| `provider_event_id` | Stable provider-supplied event identity. |
| `verification_status` | `VERIFIED`, `REJECTED`, or `INDETERMINATE`. |
| `processing_status` | `PENDING`, `PROCESSED`, `RECONCILIATION_PENDING`, or `FAILED_TERMINAL`. |
| `first_seen_at`, `last_seen_at` | Database UTC instants; `last_seen_at` is technical duplicate metadata only. |
| `attempt_count` | Bounded technical processing count; does not imply multiple business effects. |
| `normalized_event_type` | Nullable bounded adapter result. |
| `commercial_authority_id` | Nullable until safely associated; never guessed. |
| `operation_digest` | Digest of the bounded normalized operation for replay conflict detection. |
| `failure_class` | Nullable finite class such as verification, association, normalization, or reconciliation failure; no raw error. |
| `processed_at`, `reconciled_at` | Nullable database UTC instants. |

The database uniqueness identity is exactly the provider event identity within
its provider scope:

```text
(provider_namespace, provider_context, provider_event_id)
```

One receipt may link to multiple `CommercialEvent` rows when one verified
provider fact legitimately affects more than one authority, such as a referred
customer source and an attributable referrer reward. A receipt does not itself
grant entitlement.

An unverified or indeterminate event cannot append a canonical fact or mutate
source state. A duplicate with the same normalized digest returns the prior
bounded result and causes no event, revision, or coverage duplication. The
same provider identity with a different normalized digest is an idempotency
conflict requiring controlled reconciliation; it never silently overwrites the
first receipt.

## 7. PaidBillingRelationship contract

The relationship is NatalNode-normalized source state, not a copy of a future
provider enum.

| Field | Contract |
| --- | --- |
| `paid_relationship_id` | Opaque canonical source identity. |
| `commercial_authority_id` | Required owner authority. |
| `provider_namespace`, `provider_context`, `provider_relationship_ref` | Restricted adapter linkage; absent from ordinary product APIs. |
| `billing_interval` | `MONTHLY` or `ANNUAL`; both produce identical product entitlement. |
| `lifecycle_state` | `PENDING_FIRST_PAYMENT`, `ACTIVE`, `RECOVERY_GRACE`, `ENDED`, or `FIRST_PAYMENT_FAILED`. |
| `renewal_intent` | `ENABLED`, `CANCEL_AT_PERIOD_END`, or `DISABLED`; kept separate from lifecycle to avoid provider-shaped combinatorial states. |
| `current_period_start`, `current_period_end` | Nullable canonical UTC paid-period boundaries, supported by accepted facts. |
| `grace_started_at`, `grace_until` | Nullable together and present only for `RECOVERY_GRACE`. |
| `failed_renewal_identity` | Nullable canonical business identity for the renewal that entered recovery. |
| `ended_at`, `end_reason` | Nullable lifecycle boundary and bounded reason such as period end, refund, chargeback, reversal, or provider-neutral termination. |
| `last_reconciled_event_id` | Provenance to the accepted fact that established current state. |
| `source_revision` | Authority revision at which this normalized state was reconciled. |

`PENDING_FIRST_PAYMENT` and `FIRST_PAYMENT_FAILED` never grant Paid access and
never receive grace. Cancellation changes renewal intent, preserves current
paid coverage, and does not create a new coverage period. `RECOVERY_GRACE` is
part of the existing Paid relationship, not a trial or a new entitlement
source. `ENDED` plus `end_reason` preserves refunded/reversed meaning without
making one relationship row a universal Effective Pro answer.

## 8. PaidCoverage contract

Each successful purchase or renewal that establishes attributable paid time
has one normalized coverage record:

| Field | Contract |
| --- | --- |
| `paid_coverage_id` | Opaque source identity. |
| `paid_relationship_id`, `commercial_authority_id` | Required relationship and owner authority. |
| `purchase_identity` | Stable canonical purchase/renewal identity; unique in its source namespace. |
| `billing_interval` | `MONTHLY` or `ANNUAL`. |
| `coverage_start_at`, `scheduled_coverage_end_at` | Canonical half-open interval `[start, end)`. |
| `effective_coverage_end_at` | Current attributable end after source-local reversal; never earlier than start. |
| `coverage_state` | `VALID`, `ENDED`, or `REVERSED`. |
| `success_event_id` | Accepted purchase/renewal success fact. |
| `reversal_event_id`, `reversed_at`, `reversal_reason` | Nullable together; source-local refund/chargeback/correction provenance. |
| `source_revision` | Authority revision of current normalized state. |

A relationship alone does not universally imply Pro. Paid authorization comes
from a valid coverage interval or the relationship's valid seven-day renewal
grace. Full refund/chargeback clamps only the affected remaining coverage to
the canonical reversal boundary; it preserves historical elapsed access and
does not create negative time. V1 has no automatic proportional partial-refund
arithmetic. An exceptional partial-refund effect requires an explicit
commercial correction fact and policy-approved bounded outcome.

Cancellation at period end leaves coverage unchanged. A successful recovery
creates/reconciles one renewal coverage identity and clears grace without a
duplicate period. Future paid coverage may have a canonical start after queued
Referral time, but the provider mechanism for scheduling that start remains
OPEN.

## 9. Referral identity and attribution contract

### 9.1 ReferralPublicIdentity

The public identity is a separate durable boundary because an Account needs a
shareable Referral link before any referred-customer attribution exists.

| Field | Contract |
| --- | --- |
| `referral_public_identity_id` | Opaque internal primary identity. |
| `commercial_authority_id` | Required issuing/referrer authority. |
| `public_value` | Unique non-predictable public value; not derived from Account, authority, email, or sequential IDs. Exact format remains OPEN. |
| `status` | `ACTIVE` or `REVOKED`. |
| `created_at`, `revoked_at` | Database UTC lifecycle instants. |
| `supersedes_identity_id` | Nullable prior identity when a future approved rotation occurs. |

At most one public identity is active per authority. The public value is an
attribution locator, not authentication, entitlement, or a secret payment
credential. Rotation/revocation never rewrites a locked attribution or moves a
reward. Account erasure makes every public value non-resolving and removes the
live authority link; any retained internal identity is minimized under the
commercial retention gate.

### 9.2 ReferralAttribution

| Field | Contract |
| --- | --- |
| `referral_attribution_id` | Opaque internal identity. |
| `referral_public_identity_id` | Required reference to the non-predictable public identity used at attribution; no final code format is frozen. |
| `referrer_authority_id` | Server-resolved referrer. |
| `referred_authority_id` | Server-resolved referred Account. |
| `state` | `ATTRIBUTED`, `LOCKED`, or `INVALIDATED`. |
| `attributed_at` | Database-authoritative UTC instant. |
| `locked_at` | Required when first qualifying purchase locks the relationship. |
| `qualifying_paid_coverage_id` | Nullable until locked; unique when present. |
| `invalidation_reason`, `invalidated_at` | Nullable bounded reason/timestamp. |
| `campaign_reference` | Nullable bounded future campaign/source reference; no ad-engagement value. |
| `last_event_id` | Provenance to the accepted attribution fact. |

There is at most one current attribution row per referred authority. Before
lock, any later approved reassignment policy must append a fact; this contract
does not choose an attribution window or reassignment rule. After a qualifying
first purchase, the attribution is locked and cannot be rewritten. The
database and server must reject `referrer_authority_id =
referred_authority_id`. Historical paid status is checked server-side before
qualification. Browser signals never choose the final referrer.

Rejected or suspicious attempts do not need a permanent attribution row.
Fraud evidence, if approved, belongs to a separately minimized and
retention-classified security boundary.

## 10. ReferralReward durable contract

Each qualifying conversion can mint at most one standard reward.

| Field | Contract |
| --- | --- |
| `referral_reward_id` | Opaque source identity. |
| `referrer_authority_id` | Owner receiving Pro time. |
| `referral_attribution_id` | Required origin; unique for the standard reward. |
| `qualifying_paid_coverage_id` | Required referred purchase linkage; unique for the standard reward. |
| `state` | `PENDING`, `EARNED`, `APPLIED`, or `REVOKED`. |
| `qualifying_payment_at` | Effective instant of successful qualifying payment. |
| `matures_at` | Exactly `qualifying_payment_at + 14 * 24 hours`. |
| `earned_at`, `applied_at`, `revoked_at` | Nullable lifecycle instants consistent with state/history. |
| `granted_duration_us` | Exactly `2,592,000,000,000` microseconds for the standard 30-day reward. |
| `earned_duration_us` | Zero before maturation; exactly granted duration after successful maturation. A pre-maturation invalidation earns zero. |
| `applied_duration_us` | Duration admitted to the Referral time bank; zero before application and never above earned duration. |
| `consumed_duration_us` | Materialized elapsed coverage already supplied by this reward. |
| `revoked_duration_us` | Unconsumed attributable duration removed by an allowed reversal. |
| `active_consumption_started_at` | Nullable UTC instant from which this reward is currently supplying access. |
| `remaining_unconsumed_duration_us` | Derived as `earned - consumed - revoked`, never negative. |
| `available_duration_us` | Equal to remaining unconsumed duration only while state is `APPLIED`; otherwise zero. |
| `revocation_reason`, `reversal_event_id` | Nullable bounded reason and attributable reversal provenance. |
| `maturation_event_id`, `application_event_id` | Nullable lifecycle provenance. |
| `source_revision` | Authority revision of current normalized state. |

For `PENDING`, earned/applied/consumed/revoked duration is zero. A pre-
maturation invalidation remains `REVOKED` with zero earned value. `EARNED`
preserves earned-but-not-yet-applied value; only `APPLIED` duration supplies
access. For the standard V1 reward, application admits all non-revoked earned
duration once; no fractional marketing value is invented. A later underlying
refund can revoke only the reward's `remaining_unconsumed_duration_us`;
consumed duration remains historical access and is never debt.

Rolling-cap eligibility is decided when a successful qualifying first purchase
would create its `PENDING` standard reward. Under both owner-authority locks,
the system counts prior standard reward origins in the half-open UTC interval:

```text
[qualifying_payment_at - 12 calendar months, qualifying_payment_at)
```

The count includes `PENDING`, `EARNED`, and `APPLIED` standard rewards and any
later-revoked reward that had already reached `EARNED`; it excludes a reward
revoked before maturation. If the count is already 12, no ReferralReward row
is created and `REFERRAL_REWARD_CAP_REJECTED` records the bounded decision
against the attribution/purchase. It does not invent a fifth reward state or a
deferred reward. A duplicate purchase decision is idempotent and cannot consume
another cap slot.

The cap is therefore 12 standard rewards and 360 standard reward days. It is
not based on clicks, registrations, client counters, or a loose 360-day
approximation. Earned rewards do not expire merely because they later leave
the rolling window. Commercial database sessions use UTC for this calendar-
month boundary so daylight-saving or local-session settings cannot move it.

## 11. Referral consumption contract

Referral rewards are consumed sequentially in this deterministic order:

```text
1. earliest matures_at
2. earliest earned_at
3. lexical referral_reward_id tie-breaker
```

This freezes the preferred oldest-matured-first rule while making ties
deterministic. The order is owner-local and independent of provider arrival
order.

Only one reward per authority may have `active_consumption_started_at` at a
time. Before any state-changing operation, reconciliation materializes elapsed
consumption for the active reward using database time, clamps it to remaining
duration, closes an exhausted reward, and activates the next reward if no Paid
coverage or grace owns the interval. If elapsed time spans more than one
reward, the unused elapsed interval is carried through the ordered rewards:
each next reward begins at the exact prior exhaustion instant, not at the late
reconciliation time. The operation runs under the owner commercial-authority
lock.

The active timestamp means reward time continues to elapse during user
inactivity, service outage, timezone change, or daylight-saving change. It is
not request-count time or logged-in time. A process outage may delay
materialization but cannot pause or extend the elapsed entitlement interval.

Paid and Referral are never consumed for the same projected interval. A paid
or grace segment takes precedence for time consumption; Referral remains
queued. A future paid segment resumes only at its canonical start after the
Referral boundary. No provider-specific pause mechanism is selected here.

## 12. GrantEntitlement contract

One provider-neutral grant model supports all three non-paid grant classes:

```text
PROMOTION
ADMIN_GRANT
SUPPORT_GRANT
```

| Field | Contract |
| --- | --- |
| `grant_entitlement_id` | Opaque source identity. |
| `commercial_authority_id` | Required recipient authority. |
| `grant_type` | `PROMOTION`, `ADMIN_GRANT`, or `SUPPORT_GRANT`. |
| `grant_mode` | `FIXED_WINDOW` or `DURATION_BANK`. |
| `state` | `PENDING`, `ACTIVE`, `EXHAUSTED`, `EXPIRED`, or `REVOKED`. |
| `reason_code` | Required bounded reason; no arbitrary public note. |
| `issuer_class` | `CAMPAIGN`, `OPERATOR`, or `SERVICE`. |
| `issuer_reference` | Opaque server-derived authority/campaign reference. |
| `issuance_identity` | Stable canonical idempotency identity. |
| `effective_start_at`, `effective_end_at` | Required half-open interval for fixed-window grants. |
| `granted_duration_us`, `consumed_duration_us`, `active_consumption_started_at` | Duration-bank fields; constrained and absent for fixed-window grants. |
| `policy_version` | Explicit policy/evaluator version controlling future overlap/consumption behavior. |
| `created_at`, `activated_at`, `ended_at` | Database UTC lifecycle instants. |
| `issuance_event_id`, `reversal_event_id` | Journal provenance. |
| `revocation_reason` | Nullable bounded correction/revocation reason. |
| `source_revision` | Authority revision of current normalized state. |

An Admin or Support grant must be bounded unless a later explicit product
policy permits otherwise. A grant never masquerades as paid coverage. Operator
authorization and RBAC are not defined by this persistence shape.

### 12.1 Non-Referral overlap remains open

The schema supports fixed windows, duration banks, overlap, and sequential
consumption without redesign. Exact precedence and whether duration banks pause
under Paid, Referral, Promotion, Admin Grant, or Support Grant remain **OPEN**.
Until policy supplies `policy_version` behavior, a duration-bank grant whose
consumption would depend on that unresolved overlap must not be activated.
Fixed-window grants remain active according to their own explicit interval and
may coexist as independent legitimate sources.

## 13. EntitlementProjection contract

The projection is one owner-scoped rebuildable record, optionally with bounded
provenance-bearing coverage segments. It contains:

| Field | Contract |
| --- | --- |
| `commercial_authority_id` | Primary owner scope. |
| `source_revision` | Authority revision consumed by this projection. |
| `projection_schema_version`, `evaluator_policy_version` | Bounded internal versions. |
| `projection_status` | `CURRENT`, `STALE`, or `INDETERMINATE`. |
| `tier` | `FREE` or `PRO`; derived only. |
| `effective_pro` | Derived convenience value that is never commercial history. |
| `effective_from`, `effective_until` | Current effective interval; end is null only when not safely knowable. |
| `current_source_classes` | Deterministically sorted set of all legitimate source classes active now. |
| `current_source_class`, `current_source_entity_id` | Singular supplying source only when unambiguous under frozen sequencing/policy; null when multiple unresolved-priority sources coexist. Internal ID is not user-facing. |
| `paid_coverage_end_at` | Current paid boundary if any. |
| `grace_until` | Current paid grace boundary if any. |
| `queued_referral_duration_us` | Aggregate projection only; reward rows remain authoritative. |
| `current_referral_reward_id` | Internal supplying reward identity, if any. |
| `transition_to_free_at` | Earliest safely known Free boundary if no later valid source exists. |
| `ad_free` | True exactly while Effective Pro is true from any legitimate source. |
| `vault_capacity_class` | `FREE_LIMIT_3` or `PRO_UNLIMITED`. |
| `astrology_alerts_eligibility_class` | `ELIGIBLE` or `INELIGIBLE`; trigger/preferences remain separate. |
| `next_evaluation_at` | Earliest source/time boundary after which this projection must not authorize without reconciliation. |
| `computed_at` | Database UTC computation instant. |

Projection coverage segments, if physically persisted, are half-open UTC
intervals with source class, source entity, start, end, and source revision.
Paid and Referral segments may not overlap. Non-Referral grant overlap must be
representable without choosing the open precedence policy.

The projection is valid for authorization only when all are true:

1. `projection_status = CURRENT`;
2. `source_revision = CommercialAuthority.entitlement_revision`;
3. database time is earlier than `next_evaluation_at`, when present; and
4. its schema/evaluator version is supported.

Otherwise the system rebuilds from authoritative state under the appropriate
lock or fails closed for a new Pro-only operation. A stale projection never
permanently downgrades or deletes data.

## 14. Entitlement revision semantics

`CommercialAuthority.entitlement_revision` starts at zero and advances by
exactly one per affected authority for each committed logical reconciliation
transaction that changes authorization-relevant authoritative facts or source
state. One transaction touching two owners advances each owner's revision once.

It advances after, at minimum:

- paid purchase, renewal, cancellation/restore, recovery, grace transition,
  end, refund, chargeback, or correction affecting coverage;
- Referral attribution lock when it can affect reward qualification;
- Referral maturation, application, consumption boundary, exhaustion,
  revocation, or value correction;
- grant issuance, activation, expiry, exhaustion, revocation, or correction;
- another accepted source-local reversal; and
- a time-driven source transition that changes current/future authorization.

A rejected or exact duplicate provider receipt, read-only query, cache write,
or projection-only rebuild does not advance revision. A projection rebuild
consumes the already advanced revision and stores it as `source_revision`; it
never advances revision merely because it was rebuilt.

Revision update is an atomic `current + 1` operation under the authority row
lock. Callers cannot assign an arbitrary revision. The transaction must either
publish a matching projection or mark/invalidate the old projection before
commit. Time-driven transitions are materialized under the same lock; a read
that reaches `next_evaluation_at` cannot continue authorizing from the prior
projection.

## 15. State-machine contracts

### 15.1 Paid normalized relationship

Lifecycle and renewal intent are separate state dimensions.

| Current | Input | Next / effect | Classification |
| --- | --- | --- | --- |
| `PENDING_FIRST_PAYMENT` | verified successful first purchase | `ACTIVE`; create one PaidCoverage | Valid |
| `PENDING_FIRST_PAYMENT` | confirmed failure | `FIRST_PAYMENT_FAILED`; no coverage or grace | Valid |
| `PENDING_FIRST_PAYMENT` | renewal-failure input | no transition | Invalid |
| `ACTIVE` | cancellation request | lifecycle unchanged; renewal intent `CANCEL_AT_PERIOD_END` | Valid |
| `ACTIVE` + cancel intent | restore before end | renewal intent `ENABLED`; no new coverage | Valid |
| `ACTIVE` | verified renewal success | remain `ACTIVE`; reconcile one renewal coverage | Valid |
| `ACTIVE` | confirmed renewal failure for expected renewal | `RECOVERY_GRACE`; set exact grace fields | Valid |
| `RECOVERY_GRACE` | verified recovery before expiry | `ACTIVE`; reconcile one renewal coverage; clear grace | Valid |
| `RECOVERY_GRACE` | database time reaches grace end without recovery | `ENDED`; reevaluate surviving sources | Valid time transition |
| `ACTIVE` or `RECOVERY_GRACE` | attributable full refund/chargeback/reversal | clamp affected PaidCoverage; remain or become `ENDED` according to surviving paid state | Valid source-local transition |
| `ACTIVE` + no renewal | paid period end | `ENDED`; reevaluate surviving sources | Valid time transition |
| terminal state | exact same business identity/digest | no effect | Idempotent replay |
| any state | same identity with different digest or impossible source relation | no mutation; conflict/reconciliation | Invalid/conflict |

Out-of-order events reconcile by accepted facts, effective time, purchase
identity, and source relation. They never use last-arrival-wins.

### 15.2 ReferralReward

| Current | Input | Next / effect | Classification |
| --- | --- | --- | --- |
| `PENDING` | maturation boundary reached and purchase still valid | `EARNED` | Valid |
| `PENDING` | qualifying reversal/fraud/self-referral decision | `REVOKED`; zero applied value | Valid |
| `EARNED` | apply once to owner Referral bank | `APPLIED` | Valid |
| `EARNED` | attributable reversal before application | `REVOKED` | Valid |
| `APPLIED` | elapsed consumption | remain `APPLIED`; materialize bounded consumption | Valid |
| `APPLIED` | attributable later reversal | `REVOKED`; revoke only remaining value | Valid |
| `APPLIED` exhausted | later reversal | `REVOKED`; consumed value preserved, zero remainder | Valid/audit-only effect |
| `REVOKED` | exact repeat of same revocation | no effect | Idempotent replay |
| any | maturation/application/revocation with conflicting identity or provenance | no mutation | Invalid/conflict |

Maturation and application may occur in one database transaction while still
appending distinct canonical facts. `EARNED` may remain durable when application
cannot safely complete; a retry uses the same identities.

### 15.3 GrantEntitlement

| Current | Input | Next / effect | Classification |
| --- | --- | --- | --- |
| absent | valid issuance | `PENDING` or `ACTIVE` according to start | Valid |
| `PENDING` | effective start reached | `ACTIVE` | Valid time transition |
| `PENDING` | authorized revocation | `REVOKED` | Valid |
| `ACTIVE` fixed window | effective end reached | `EXPIRED` | Valid time transition |
| `ACTIVE` duration bank | all value consumed under approved policy | `EXHAUSTED` | Valid |
| `ACTIVE` | authorized source-local revocation | `REVOKED`; never negative | Valid |
| terminal | exact same issuance/revocation identity | no effect | Idempotent replay |
| terminal | ordinary reactivation or mutation | no mutation; new grant/correction required | Invalid |

### 15.4 ProviderIngestionReceipt

| Current | Input | Next / effect | Classification |
| --- | --- | --- | --- |
| absent | safely bounded event envelope | receipt with verification decision | Valid |
| `INDETERMINATE/PENDING` | later successful verification | `VERIFIED/PENDING` | Valid retry |
| any | failed authenticity | `REJECTED`; no commercial mutation | Valid terminal security outcome |
| `VERIFIED/PENDING` | normalized and owner-associated | `VERIFIED/PROCESSED` with linked events | Valid |
| `VERIFIED/PENDING` | safe association unavailable | `VERIFIED/RECONCILIATION_PENDING`; no guessed mutation | Valid bounded deferment |
| `VERIFIED/RECONCILIATION_PENDING` | controlled reconciliation succeeds | `VERIFIED/PROCESSED` | Valid |
| any | exact same provider identity and digest | preserve prior result; update only bounded technical duplicate metadata | Idempotent replay |
| any | same provider identity, different digest | no overwrite or source mutation | Conflict |

## 16. Canonical idempotency identities

Every identity is namespaced, persisted, unique, and compared with a normalized
operation digest. Random HTTP request IDs may correlate a request but are not
the sole business identity when a stable business fact exists.

| Operation | Canonical identity components |
| --- | --- |
| Provider ingestion | provider namespace + provider context + provider event ID |
| Purchase success | paid relationship/source namespace + canonical purchase identity + successful coverage interval identity |
| Renewal success | paid relationship + canonical renewal occurrence/period boundary + successful payment identity |
| Refund | canonical refund identity + affected purchase/PaidCoverage identity |
| Chargeback/reversal | canonical dispute/reversal identity + affected purchase/PaidCoverage identity |
| Cancellation update | paid relationship + current period identity + desired renewal intent + canonical provider/user command identity |
| Referral maturation | ReferralReward ID + fixed maturation boundary + policy version |
| Referral application | ReferralReward ID + one standard application operation |
| Referral revocation | ReferralReward ID + attributable purchase reversal event ID + bounded reason |
| Grant issuance | issuer namespace + issuer issuance identity + owner authority + grant type/mode |
| Grant revocation | Grant ID + canonical revocation/correction identity |
| Commercial correction | correction namespace + affected event/source + operator/service command identity |

For future operator commands, an `Idempotency-Key` may be required as a
transport component, but server-derived actor, target, operation type, and
semantic body digest must also participate. Reusing a key for different
semantics returns `IDEMPOTENCY_CONFLICT`; it never overwrites the first result.

## 17. Transaction and concurrency contract

### 17.1 Live-owner lock order

The `CommercialAuthority` row is the authoritative commercial serialization
primitive. To remain compatible with the existing Account Erasure and
Notification lock hierarchy, live-owner operations acquire locks in this
order:

```text
1. live users root row(s), sorted by owner_id, with an erasure-conflicting
   ownership-preserving lock appropriate to the operation
2. CommercialAuthority row(s), in the same sorted owner order, FOR UPDATE
3. source rows, when involved, in this fixed type order and then primary-key
   order: PaidBillingRelationship, PaidCoverage, ReferralPublicIdentity,
   ReferralAttribution, ReferralReward, GrantEntitlement
4. projection row
```

For ordinary commercial mutation, the live `users` lock may be `FOR KEY SHARE`
so account deletion's `FOR UPDATE` serializes with it. The authority `FOR
UPDATE` lock serializes revision and source reconciliation. No global
commercial lock is used.

Provider receipt uniqueness is claimed before owner mutation locks because a
receipt may be duplicate or not yet safely associated. Every provider-ingestion
path follows the same receipt-first rule; no path may acquire an owner/source
lock and then attempt to claim the same receipt in reverse order.

Detached retained commercial subjects have no ordinary product authorization
path. Any future policy-approved legal/accounting reconciliation uses the
authority lock through a separately authorized internal boundary.

### 17.2 Multi-owner Referral order

Operations involving referrer and referred customer:

1. resolve both authorities server-side;
2. sort immutable live `owner_id` values lexically;
3. acquire all live Account-root locks in that order;
4. acquire both `CommercialAuthority` rows in the same order;
5. lock PaidCoverage, ReferralAttribution, and ReferralReward rows by fixed
   type order and primary identity; and
6. advance each changed authority revision once.

The system never assumes “referrer first” or “referred first.” Refund ingestion,
Referral maturation, revocation, and correction use the same order, preventing
opposing deadlock paths.

### 17.3 Verified provider-event transaction

Provider authenticity verification and bounded normalization occur before the
commercial database transaction. No provider network call occurs inside it.

Within one NatalNode transaction:

1. claim or lock the unique ProviderIngestionReceipt;
2. return the prior result for an exact duplicate, or stop on digest conflict;
3. resolve the affected authority/source without trusting client selectors;
4. acquire live-owner and authority locks in canonical order;
5. append the accepted CommercialEvent fact(s);
6. reconcile only attributable normalized source state;
7. materialize any elapsed source boundary needed for the decision;
8. advance each changed authority revision once;
9. rebuild the projection at that revision or atomically mark it stale;
10. link the receipt to the event(s), record bounded processing result, and
    commit; and
11. acknowledge the provider only after commit.

If source association is unsafe, the verified receipt may commit as
`RECONCILIATION_PENDING` without a commercial event or authority revision. It
must not guess an owner. External provider state and NatalNode remain separate
consistency domains.

### 17.4 Referral maturation transaction

The restart-safe operation is:

```text
select a bounded ordered set of candidate PENDING reward IDs with
    matures_at <= database time, without treating selection as authority
    -> for each candidate, begin transaction
    -> lock referred and referrer roots/authorities in canonical order
    -> lock qualifying PaidCoverage, attribution, and reward in canonical
       source/identity order
    -> re-check state and underlying purchase validity
    -> append maturation and, when safe, application facts
    -> update reward/source state
    -> advance referrer revision once
    -> rebuild/invalidate projection
    -> commit
```

Candidate selection is only a bounded work hint and takes no reward lock ahead
of the owner lock hierarchy. Duplicate workers may select the same ID; the
first canonical transaction changes it and the second observes a terminal or
already-matured state under lock and performs an idempotent no-op. Correctness
comes from the locked state recheck and unique maturation/application
identities. Duplicate schedulers, concurrent workers, and process restart
therefore converge to one result. Browser timers are never authority.

### 17.5 Maturation/refund race

The qualifying PaidCoverage and ReferralReward, plus both authority locks,
decide the race. If refund/reversal commits first, maturation observes invalid
coverage and moves/remains `REVOKED`. If maturation commits first, a later
refund revokes only that reward's then-unconsumed remainder. No interleaving
can mint a second reward, consume below zero, or mutate another source. Both
operations are idempotent and use the same multi-owner lock order.

## 18. Time semantics and source continuity

### 18.1 Time authority

Commercial time is server/database authoritative and represented as UTC
instants (`TIMESTAMPTZ` direction). Client clocks, timezones, locale calendars,
browser timers, request counts, and login activity are not authority. This is
commercial time authority and is unrelated to NatalNode astronomical
TimeAuthority.

Duration arithmetic uses non-negative integer microseconds or an equivalently
exact integer unit. It does not use floating-point “days.” Half-open intervals
`[start, end)` avoid double authorization at boundaries.

Frozen elapsed durations are:

| Rule | Exact duration |
| --- | --- |
| Standard Referral reward | `30 * 24 hours` |
| Referral maturation | `14 * 24 hours` after qualifying successful payment |
| Renewal grace | `7 * 24 hours` from canonical recovery/grace start |

### 18.2 Seven-day grace

Grace starts only when a renewal that should extend a previously valid Paid
relationship is canonically confirmed failed or in recovery. It never applies
to failed first purchase. `grace_until = grace_started_at + 7 * 24 hours`.

Recovery before the half-open grace boundary reconciles Paid coverage and
continues Pro without a downgrade or duplicate period. At the boundary,
reconciliation ends grace, advances revision, and immediately evaluates
Referral and other sources. A projection whose `next_evaluation_at` is the
grace boundary cannot authorize Paid after that instant without reconciliation.

### 18.3 Paid -> Referral -> next Paid

At valid Paid coverage/grace end:

- if valid applied Referral duration exists, the oldest eligible reward begins
  at the same instant with no Free gap;
- Referral consumption proceeds sequentially and never overlaps Paid;
- at Referral exhaustion, a valid next Paid coverage beginning at that instant
  resumes Paid; otherwise other legitimate grants are evaluated under their
  approved policy, then the account becomes Free; and
- immediately contiguous legitimate Pro segments remain Ad-Free throughout.

Provider scheduling mechanics for the next paid period are separate and OPEN.
The canonical coverage start stored by NatalNode must honor the frozen
sequence; no provider can force Referral value to disappear under paid time.

## 19. Canonical authorization reads

### 19.1 GetEffectiveEntitlement(owner)

The server-only semantic result is a discriminated outcome:

```text
DETERMINATE
  tier: FREE | PRO
  effectivePro: boolean
  entitlementRevision: decimal string
  evaluatedAt: UTC instant
  effectiveFrom: UTC instant | null
  effectiveUntil: UTC instant | null
  currentSourceClass: PAID | REFERRAL | PROMOTION | ADMIN_GRANT |
                      SUPPORT_GRANT | null
  currentSourceClasses: bounded sorted source-class set
  adFree: boolean
  vaultCapacityClass: FREE_LIMIT_3 | PRO_UNLIMITED
  astrologyAlertsEligible: boolean

INDETERMINATE
  entitlementRevision: decimal string | null
  retryable: boolean
  reasonClass: bounded internal class
```

Provider IDs, raw payment status, reward/source IDs, operator notes, fraud
signals, and commercial journal data are absent. The decimal-string revision
avoids JSON integer-width ambiguity.

`INDETERMINATE` is not converted to `FREE`. New Pro-only operations fail
closed with the commercial Problem Details class. The system does not delete
data, rewrite source state, permanently downgrade a projection, or call a
provider synchronously because a read failed.

### 19.2 EvaluateCapability(owner, capability)

All Pro-sensitive domains consume one server-side evaluator equivalent to:

```text
EvaluateCapability(owner, capability)
    -> ALLOWED | DENIED | INDETERMINATE
```

The bounded capability registry begins with semantic equivalents of:

- unlimited Vault;
- Personal Transits;
- Astrology Alerts;
- advanced interpretation;
- advanced export;
- advanced Workspace; and
- Ad-Free.

Exact code enum names may be frozen with runtime contracts, but feature code
must not read PaidBillingRelationship, ReferralReward, GrantEntitlement,
provider status, or a client tier flag directly.

### 19.3 Historical durable content

Viewing retained historical Pro output uses a separate ownership/lifecycle
authorization contract:

```text
AuthorizeRetainedContentView(authenticatedOwner, storedResource)
    -> ownership + deletion + retention + erasure + technical lifecycle
```

Current Effective Pro is not a prerequisite for viewing already generated,
durably stored owner content. New generation or new Pro-only workflow use
calls `EvaluateCapability`. Expiry, refund, stale projection, or provider
outage alone never deletes or hides historical content.

## 20. Cross-domain write and eligibility contracts

### 20.1 Vault create quota

The Free capacity is three saved charts; Pro capacity is unlimited in product
direction. Reads and deletes remain owner-authorized regardless of a downgrade.
When a Free account has three or more charts, create is blocked until count is
below three.

After any required Engine calculation completes outside the database
transaction, Vault create performs one bounded transaction:

1. derive owner from authenticated principal;
2. lock the live `users` root in the established lifecycle order;
3. lock the owner's `CommercialAuthority` row so entitlement revision and
   concurrent saves serialize;
4. resolve a determinate entitlement from current source/projection state;
5. when Free, count owner charts in the same transaction;
6. if count is at least three, return `FREE_VAULT_LIMIT_REACHED` without insert;
7. otherwise insert exactly one owner chart and commit.

Two concurrent Free saves therefore cannot both pass a stale count: one owns
the authority lock first; the second observes the committed count. No Engine
or provider network call occurs while these locks are held. Account deletion
uses the compatible Account-root-first hierarchy.

### 20.2 Notification eligibility

Notification Platform receives only the bounded capability answer for the
authenticated owner and notification type. Pro Astrology Alert planning and
final-send revalidation require current `ASTROLOGY_ALERTS` capability in
addition to existing explicit channel/category preferences and an active
owner-bound PushSubscription.

PushSubscription, browser permission, and preference state never imply Pro.
Entitlement integration does not change notification persistence, outbox,
worker, payload, transport, retries, or subscription ownership.

### 20.3 Advertising eligibility

The frozen chain remains:

```text
Consent State
    + Surface Eligibility
    + Canonical Effective Pro
    -> Permitted Advertising Mode
```

Every legitimate Pro source is Ad-Free, including grace. Advertising code may
not inspect provider state, payment or Referral cookies, PushSubscription, or
client `isPro`. Free status does not make a default no-ad surface eligible.

## 21. API and BFF contract classification

Route spellings below are the frozen provider-independent BFF direction. They
remain unimplemented. All user targets come from the authenticated principal;
normal user requests accept no owner/account selector.

| Boundary | Classification | Contract |
| --- | --- | --- |
| `GET /api/account/entitlement` | Authenticated user-facing | Bounded current effective entitlement response. |
| `GET /api/account/subscription` | Authenticated user-facing | Paid relationship summary, cancellation/grace state, Referral queue summary, and billing-management availability. |
| `POST /api/account/subscription/cancel` | Authenticated user-facing mutation | Strict empty body; request cancellation for current relationship; idempotent desired-state semantics. |
| `POST /api/account/subscription/restore` | Authenticated user-facing mutation | Strict empty body; restore renewal when canonically allowed; no duplicate coverage. |
| `GET /api/account/referral` | Authenticated user-facing | Public share URL/identity presentation plus aggregate status; no final code format frozen. |
| `GET /api/account/referral/rewards` | Authenticated user-facing | Privacy-minimized reward history and aggregate durations. |
| `GET /api/account/entitlement-grants` | Authenticated user-facing | Only grants approved for user visibility; no operator/security notes. |
| Provider adapter ingestion | Provider-ingestion-only | Non-browser verified adapter boundary; exact route/signature deferred to provider selection. |
| Commercial reconciliation command/service | Internal-only | Server/operations-owned, no public arbitrary-owner endpoint. |
| Effective entitlement/capability evaluator | Internal-only | Used by Vault, Notification, Advertising, and feature domains. |
| Grant/correction/provenance inspection | Operator-only | Future authenticated authorized operator boundary with reason, idempotency, and audit. |

Unsafe user-facing mutations retain exact-Origin, session, no-store,
rate-limit, and security-header conventions. Billing-provider redirection or
portal mechanics remain OPEN and cannot alter these provider-independent
responses.

## 22. User-facing response boundaries

### 22.1 Current entitlement

```json
{
  "contractVersion": "1.0",
  "tier": "PRO",
  "effectivePro": true,
  "entitlementRevision": "42",
  "evaluatedAt": "2026-08-30T12:00:00.000Z",
  "effectiveFrom": "2026-08-01T12:00:00.000Z",
  "effectiveUntil": "2026-09-01T12:00:00.000Z",
  "currentSourceClass": "PAID",
  "currentSourceClasses": ["PAID"],
  "adFree": true,
  "vaultCapacityClass": "PRO_UNLIMITED",
  "astrologyAlertsEligible": true
}
```

Unknown safe end time is JSON `null`; it is never guessed. An indeterminate
read returns Problem Details rather than a fake Free or Pro response.

### 22.2 Subscription summary

The V1 bounded response fields are:

- `contractVersion`;
- `billingInterval: MONTHLY | ANNUAL | null`;
- `paidState: NONE | ACTIVE | CANCELLATION_SCHEDULED | RECOVERY_GRACE | ENDED`;
- `currentPaidPeriodEndsAt: UTC instant | null`;
- `graceUntil: UTC instant | null`;
- `referralAvailableDurationSeconds` and `referralPendingCount`;
- `billingManagementAvailable` as a capability, not provider identity; and
- current tier/Ad-Free/Vault capacity from the canonical evaluator.

It does not expose raw provider customer/subscription/payment IDs, payloads,
fraud signals, operator notes, private referred-user payment data, or internal
source identities.

Cancel and restore mutations return a bounded desired-state result plus this
same subscription summary. The result class is `APPLIED`, `NO_CHANGE`, or
`PENDING_EXTERNAL_CONFIRMATION`; it reports only what NatalNode can
canonically establish and never claims provider completion before verified
reconciliation. An incompatible transition returns Problem Details. Exact
HTTP success status and any billing-management redirect remain provider-gated.

### 22.3 Referral privacy

User-visible reward history is limited to reward status, earned/applied/revoked
date where applicable, standard value, consumed/remaining value, and a bounded
non-sensitive reason class. It may use an anonymized presentation such as
“qualifying referral” but must not expose the referred user's email, identity,
birth data, charts, payment details, provider IDs, or fraud evidence.

### 22.4 User-visible grants

A grant summary may expose grant type, bounded user-safe reason, start/end or
remaining duration, and status. It excludes issuer credentials, operator
identity, private support notes, approval workflow, and security evidence.

## 23. Operator and support contract

Future operator operations may:

- issue a bounded Promotion/Admin/Support grant;
- revoke only unconsumed erroneous grant value;
- append a commercial correction; and
- inspect bounded entitlement provenance needed for authorized support.

Every operation requires server-authenticated operator authority, future RBAC,
a bounded reason, canonical idempotency, attributable actor identity,
CommercialEvent append, source-local mutation, owner locks, revision advance,
and auditability. No permanent unaudited “make Pro” switch exists.

Privileged non-owner access to account-scoped commercial data must integrate
with the Privacy Access Audit contract before release. If required audit append
fails, the privileged operation fails closed. Operator RBAC, approval levels,
break-glass behavior, and UI remain OPEN.

## 24. Account deletion, retention, and export

### 24.1 Account deletion

Commercial categories are separated as follows:

| Category | Deletion direction |
| --- | --- |
| Derived projection/cache | Delete/invalidate; never retained as legal history. |
| Active normalized source state | Remove from the active account graph when the account is erased; it cannot continue authorizing. |
| Live Account-to-CommercialAuthority link | Remove atomically so no retained commercial record remains directly owner-addressable. |
| User-owned commercial presentation/preferences | Follow the approved active-database erasure graph. |
| Commercial journal/payment/accounting records | Retain only when a separately approved legal/accounting/security classification requires it; detach direct owner identity and minimize/pseudonymize. |
| Fraud/security evidence | Separate restricted policy category; no automatic indefinite retention. |

Account erasure must not be blocked merely because commercial records exist.
Before implementation, the Account Erasure and Data Retention contracts must
approve the exact category handling and transaction order. The erasure flow
must lock the live Account and CommercialAuthority in the established order,
remove active entitlement/projection state, then either delete the authority
and journal or detach the direct `owner_id` link according to approved policy.
It must not retain email, public Referral code, birth data, or a reversible
application-owned identity bridge merely for convenience.

Referral integrity may preserve a minimized pseudonymous source relationship
when required to avoid duplicating or clawing back another owner's valid
reward. It must not disclose or reactivate the deleted account. No retention,
backup, legal-hold, or provider-copy duration is frozen here.

### 24.2 Data export classification

Candidates for a later reviewed Account Export schema evolution are:

- current user-visible entitlement and subscription summary;
- current/queued Referral duration and user-visible reward history;
- earned/applied/revoked reward status and dates; and
- user-visible Promotion/Admin/Support grant summaries.

Internal-only/excluded categories are:

- provider verification/signature details and raw payloads;
- provider/internal commercial identities;
- fraud signals and security evidence;
- operator-only notes, actor identities, and approval traces;
- receipt/reconciliation diagnostics, locks, revisions beyond the bounded
  user-facing current revision, and internal correction mechanics; and
- another user's identity or payment details.

Commercial fields do not enter the current export automatically. They require
a versioned named-field presenter, classification review, coherent snapshot
semantics, and explicit Account Export contract update. No provider call,
recalculation, reconciliation repair, or raw-row spread occurs during export.

### 24.3 Retention

No commercial retention duration is selected. Each journal, receipt, source,
grant, Referral, operator-audit, observability, backup, and provider-copy
category needs an approved owner, purpose, duration/fate, access, erasure,
backup/restore, and processor rule before cleanup or launch. Missing policy
never becomes an undocumented permanent-retention default or guessed cleanup
period.

## 25. Observability boundary

Commercial observability uses finite structured fields sufficient to diagnose
an operation without becoming a user ledger or provider-payload log. Approved
conceptual fields are:

- fixed event family such as `commercial.reconciliation.completed`;
- opaque request/commercial-operation correlation identity when necessary;
- bounded event type and source class;
- authority revision before/after, without logging `owner_id`;
- projection source revision and `CURRENT/STALE/INDETERMINATE` result;
- duplicate/idempotency outcome;
- reconciliation result;
- source-local reversal yes/no and bounded reversal class;
- Referral maturation/application/revocation result;
- grant issuance/revocation result; and
- bounded duration and failure class.

`owner-scoped` means the operation and revision are scoped by the locked
authority, not that the Account ID is copied into ordinary logs. Secure
operator provenance inspection uses restricted canonical data and Privacy
Access Audit, not ordinary observability.

Do not log raw card/payment credentials, secrets, provider bodies, signatures,
email, owner/account IDs, Referral codes, birth data, locations, chart facts,
Vault content, interpretations, notification content, raw errors, SQL, dynamic
event names, or unrestricted identifiers. Observability is fail-open and
non-authoritative; audit append requirements remain a separate fail-closed
boundary.

## 26. Security boundary

| Threat | Required control |
| --- | --- |
| Forged webhook | Provider adapter authenticates/verifies before canonical mutation; rejected/indeterminate input grants nothing. |
| Replayed webhook | Provider receipt uniqueness plus business idempotency and digest comparison. |
| Cross-account mutation / IDOR | Authenticated principal or trusted adapter resolves owner server-side; user APIs accept no owner selector; ownership predicates and authority locks are mandatory. |
| Self-referral | Database inequality, server-resolved identities, historical-paid check, and locked first-purchase attribution. |
| Reward duplication | Unique attribution/purchase reward identity, maturation/application idempotency, and owner locks. |
| Grant abuse | Operator authentication, future RBAC, bounded grant, reason, idempotency, audit, and no unaudited switch. |
| Unauthorized correction | Operator/service authority, append-only correction fact, source-local effect, and auditability. |
| Stale projection grants Pro | Exact revision/time/version validation; rebuild or fail closed. |
| Client forges `isPro` | Client value is ignored; server evaluator is sole authority. |
| Advertising ignores Pro | Ad decision consumes canonical Effective Pro with consent and surface policy. |
| Provider metadata leak | Adapter isolation, named allowlists, restricted receipt/journal fields, bounded responses/logs. |
| Concurrency/deadlock | Account-root-first hierarchy, authority serialization, canonical multi-owner ordering, bounded transactions, conflict-safe retry. |

Secrets remain outside the repository. Commercial persistence contains no
birth/chart/interpretation data and no payment credential material.

## 27. Database constraint direction

Future PostgreSQL DDL must enforce, where practical:

1. primary keys and owner/source foreign-key integrity for every entity;
2. one live Account link per `CommercialAuthority` and one authority per live
   owner;
3. unique provider receipt identity over provider namespace/context/event ID;
4. unique journal business idempotency namespace/key plus digest conflict
   detection;
5. unique public Referral value and at most one active ReferralPublicIdentity
   per authority;
6. one current Referral attribution per referred authority;
7. referrer and referred authority inequality;
8. one locked first-purchase conversion per referred authority and one
   attribution per qualifying PaidCoverage;
9. one standard ReferralReward or one cap-rejected canonical decision per
   attribution/qualifying conversion, never both or duplicates;
10. unique canonical PaidCoverage purchase/renewal identity;
11. unique grant issuance identity within issuer namespace;
12. bounded source/state/type/interval/version vocabularies;
13. valid half-open timestamp ordering and grace field shape;
14. reward/grant durations non-negative; for Referral, earned is not above
    granted, applied is not above earned, consumed is not above applied,
    consumed plus revoked is not above earned, and remaining is never negative;
15. at most one actively consuming Referral reward per authority, using a
    partial unique constraint or equivalent locked invariant;
16. correction/reversal links cannot self-reference and must target compatible
    source/event relationships;
17. provider receipt/event linkage cannot cross an unrelated normalized
    operation;
18. projection source revision cannot exceed authority revision; authorization
    requires equality;
19. revision updates use locked increment-only repository operations rather
    than caller-assigned values; and
20. state transitions use expected-state predicates and transaction locks,
    with database CHECK constraints for state/field shape.

If coverage segments are physically persisted, a conditional exclusion or
equivalent constraint must prevent Paid and Referral segment overlap for one
authority. No generic non-Referral overlap exclusion may accidentally decide
the still-open grant precedence policy.

## 28. RFC 9457 commercial error contract

Commercial API errors use the existing canonical shape:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "code": "FREE_VAULT_LIMIT_REACHED",
  "detail": "The Free Vault capacity has been reached."
}
```

They use `application/problem+json; charset=utf-8`, `Cache-Control: no-store`,
existing security headers, fixed HTTP titles, optional centrally allowlisted
detail no longer than 256 characters, and the server-issued `X-Request-Id`
header. No raw errors, IDs, provider state, or commercial internals enter the
body.

The minimum commercial code registry direction is:

| Code | HTTP | Meaning |
| --- | ---: | --- |
| `ENTITLEMENT_REQUIRED` | 403 | Authenticated owner lacks the current capability. |
| `ENTITLEMENT_INDETERMINATE` | 503 | Canonical state cannot safely authorize a new Pro operation. |
| `FREE_VAULT_LIMIT_REACHED` | 409 | Free create quota is currently full; reads/deletes remain allowed. |
| `BILLING_STATE_CONFLICT` | 409 | Requested cancel/restore transition is incompatible with canonical paid state. |
| `REFERRAL_NOT_ELIGIBLE` | 403 | Server-side referral qualification rule is not satisfied. |
| `REFERRAL_ALREADY_ATTRIBUTED` | 409 | Locked first-purchase attribution cannot be reassigned. |
| `REFERRAL_REWARD_NOT_REVOCABLE` | 409 | Requested revocation has no attributable unconsumed value or valid authority. |
| `COMMERCIAL_OPERATION_CONFLICT` | 409 | Canonical state prevents the requested commercial mutation. |
| `IDEMPOTENCY_CONFLICT` | 409 | Same idempotency identity was reused for different semantics. |
| `OPERATOR_AUTHORIZATION_REQUIRED` | 403 | Operator-only authority is absent. |

Implementation must add these through the central finite Problem Details
registry in a bounded API contract slice. Repositories return semantic
outcomes/errors and never construct HTTP responses.

## 29. API versioning

Product-facing responses carry `contractVersion: "1.0"`. Compatible additive
fields require reviewed minor-version evolution; removal, renaming, meaning,
nesting, or type changes require a major version. Clients branch on bounded
fields and Problem Details status/code, never provider payloads.

Provider adapter envelope versions, canonical event `attributes_version`,
projection schema/evaluator versions, and user API contract versions are
independent. Replacing a provider or adapter version cannot force Vault,
Notification, Advertising, or user clients to understand provider objects.

Exact internal provider-ingestion route/version syntax remains provider-gated;
the canonical normalized operation and receipt contract are stable.

## 30. Data minimization

Commercial tables and APIs must not store or transmit birth date, birth time,
birth location, coordinates, timezone-resolution details, ChartRequest,
ChartResult, placements, aspects, interpretations, Vault notes, or private
notification content. Account/commercial identity references are the minimum
opaque identifiers necessary for ownership, provenance, and source-local
reversal.

Referral records never become an ad audience, analytics profile, or public
identity graph. Payment/provider metadata remains restricted to adapter,
receipt, reconciliation, and approved accounting/security roles. The
Advertising Compliance Baseline remains unchanged.

## 31. Future migration strategy

Repository evidence shows numbered, forward-only PostgreSQL migrations through
`0010_notification_delivery_first_attempt_at.sql`. The migration runner owns
the transaction and tracking commit; future migrations should omit outer
`BEGIN`/`COMMIT` wrappers. Although `0011` is the next numerical prefix at this
baseline, this document does not reserve or assign a migration number. A future
slice must re-check repository state immediately before creating one.

Recommended staged migration direction:

1. **Commercial authority, journal, and receipt foundation** — authority/revision
   row, append-only CommercialEvent, ProviderIngestionReceipt, keys, FKs,
   uniqueness, restricted repositories; no provider endpoint.
2. **Normalized Paid source** — PaidBillingRelationship and PaidCoverage,
   canonical state/interval constraints and source reconciliation.
3. **Projection/revision read model** — EntitlementProjection, evaluator,
   stale/time-boundary handling, and Paid-only capability contracts.
4. **Referral source state** — ReferralAttribution and ReferralReward with
   source-local maturation, consumption, and reversal constraints.
5. **Grant source state** — GrantEntitlement only after policy gates required
   for active duration grants.
6. **API/runtime integrations** — user APIs, provider adapter, Vault,
   Notification, Advertising, Account lifecycle, and observability in bounded
   separately reviewed slices.

No executable migration or migration checksum changes are part of this task.

## 32. Recommended implementation slices

1. `WEB-COMMERCIAL-001D1` — **Implement Commercial Authority, Event Journal,
   and Provider Receipt Persistence Foundation.** Add only persistence
   contracts, one forward migration chosen against then-current numbering,
   PostgreSQL repositories, and focused constraint/idempotency tests. Do not
   add provider routes, SDKs, paid evaluation, Referral, grants, or UI.
2. `WEB-COMMERCIAL-001D2` — Implement normalized Paid relationship/coverage
   persistence and owner-scoped reconciliation service.
3. `WEB-COMMERCIAL-001D3` — Implement entitlement revision, projection, and
   canonical effective/capability read boundary for Paid-only state.
4. `WEB-COMMERCIAL-001D4` — Implement Referral attribution/reward persistence,
   maturation/application/consumption/revocation transactions, and bounded
   internal worker contract.
5. `WEB-COMMERCIAL-001D5` — Implement GrantEntitlement persistence after the
   required overlap/activation policy gates; no operator UI.
6. `WEB-COMMERCIAL-001D6` — Add authenticated user-facing entitlement,
   subscription, and privacy-minimized Referral/grant API contracts.
7. `WEB-COMMERCIAL-001D7` — Add one provider-neutral adapter interface and
   verified ingestion boundary only after provider selection; keep product
   domains provider-independent.
8. `WEB-COMMERCIAL-001D8` — Integrate Vault quota, Notification eligibility,
   and Advertising eligibility in independent bounded slices.
9. `WEB-COMMERCIAL-001D9` — Reconcile Account Erasure, Retention, Export,
   Privacy Access Audit, and commercial observability contracts before launch.
10. `WEB-COMMERCIAL-001D10` — Focused adversarial concurrency/security review
    and real-PostgreSQL acceptance.

Each slice revalidates only its actual diff and does not silently start the
next slice.

## 33. Real PostgreSQL concurrency acceptance plan

Future acceptance must use real PostgreSQL transactions and prove:

| Case | Required result |
| --- | --- |
| Duplicate provider event, two claimers | One receipt/business effect/revision; exact duplicate observes prior result. |
| Concurrent renewal and refund | Deterministic attributable PaidCoverage result; no duplicate or negative coverage. |
| Referral maturation and refund race | One locked final reward outcome; only valid unconsumed value remains. |
| Two Referral workers, same reward | One maturation/application; the other is idempotent/no-op. |
| Cross-owner Referral operations | Canonical owner lock order avoids deadlock and cross-owner mutation. |
| Paid expiry with Referral balance | Contiguous Pro; Referral starts exactly at Paid end. |
| Grace expiry with Referral balance | Contiguous Pro; no ad-visible Free gap. |
| Paid refund with surviving Admin Grant | Paid source reverses; grant and Effective Pro remain. |
| Concurrent Free Vault saves at count two | At most one insert succeeds; final count is three. |
| Concurrent Free Vault saves at count three | Both are blocked; reads/deletes remain available. |
| Stale revision/projection | Stale projection cannot grant; rebuild or fail closed. |
| Source-local reversal | Only attributable source/reward/coverage changes. |
| Partially consumed Referral revocation | Consumed duration preserved; only remainder revoked. |
| No-negative remainder | Database/application constraints reject underflow under retries/races. |
| Refund before delayed purchase-success event | Source converges to reversed/no-active coverage when success arrives later. |
| Duplicate operator grant | One grant/event/revision under same canonical identity. |
| Account deletion racing commercial mutation | Account-root-first hierarchy yields either committed mutation before erasure or no post-erasure authorization. |

The harness must validate rollback, ambiguous-commit handling, lock timeouts,
deadlock-free canonical ordering, clean retry, and final invariant queries. It
is not implemented by this contract.

## 34. Persistence invariants

1. CommercialEvent history is append-oriented.
2. Provider event identity is unique per provider namespace/context.
3. Canonical business idempotency prevents duplicate entitlement.
4. Effective Pro is never authoritative from one boolean.
5. Every entitlement source has provenance.
6. Reversal affects only the attributable source.
7. Referral remaining duration cannot be negative.
8. Consumed Referral duration cannot be clawed into debt.
9. Paid and Referral coverage do not double-consume.
10. One qualifying referred purchase cannot mint multiple standard rewards.
11. Referral attribution is one first-purchase conversion.
12. Projection is rebuildable.
13. Projection revision is owner-scoped and monotonic.
14. Cache is non-authoritative.
15. Provider state is non-authoritative by itself.
16. Product authorization never trusts client `isPro`.
17. Pro from any legitimate source is Ad-Free.
18. PushSubscription does not imply Pro.
19. Subscription expiry alone does not delete historical product data.
20. Commercial records never require natal/birth metadata.
21. Duplicate or rejected receipts do not advance entitlement revision.
22. Projection rebuild consumes rather than advances revision.
23. Account deletion cannot leave active entitlement for a detached owner.
24. Ordinary authorization never requires a live provider call.
25. Every multi-owner mutation uses canonical owner lock order.

## 35. Required contradiction audit

| Case | Contract result | Status |
| --- | --- | --- |
| A. Monthly cancellation + queued Referral | Renewal intent changes only; paid coverage continues to period end, then oldest Referral begins. | Resolved |
| B. Annual + 90 Referral days | Annual coverage remains first; three standard rewards supply 90 sequential elapsed days afterward. | Resolved |
| C. Renewal failure + grace + Referral | Paid relationship owns exactly seven elapsed grace days; Referral remains queued. | Resolved |
| D. Grace expiry + Referral | At the half-open grace boundary, revision/reconciliation starts Referral with no Free gap. | Resolved |
| E. Refund + Admin Grant | Only affected PaidCoverage is clamped/reversed; valid Admin Grant remains Effective Pro and Ad-Free. | Resolved |
| F. Chargeback + Support Grant | Paid source reverses; Support Grant survives; no account-wide set-Free mutation. | Resolved |
| G. Free user receives 30 Referral days | On maturation/application, oldest reward starts immediately for exactly `30 * 24 hours`. | Resolved |
| H. Post-maturation refund after partial Referral consumption | Materialize elapsed consumption, preserve it, revoke only that reward's remainder, never debt. | Resolved |
| I. Duplicate webhook | Unique receipt and business identity produce one event/effect/revision; digest mismatch is conflict. | Resolved |
| J. Refund before delayed purchase-success webhook | Verified refund remains safely associated/pending; late purchase fact reconciles to reversed coverage and grants no transient unsafe entitlement. | Resolved |
| K. Referral maturation and refund concurrent | Both lock purchase, reward, and sorted authorities; one commits first and the second converges source-locally. | Resolved |
| L. Two duplicate Admin Grant requests | Issuer issuance identity and digest produce one grant/event; mismatch conflicts. | Resolved |
| M. User downgraded above Vault quota | All charts remain readable/deletable; same-transaction quota check blocks create while count is at least three. | Resolved |
| N. Account deletion with retained commercial obligations | Active entitlement/projection and direct owner link are removed; only policy-approved minimized/pseudonymous commercial records may remain; duration stays open. | Resolved with explicit privacy-policy implementation gate |
| O. Effective Pro from Promotion and advertising | Promotion is a legitimate Pro source; canonical evaluator returns Ad-Free regardless of payment state. | Resolved |

No persistence/API contradiction blocks this freeze. Case N requires the
already-anticipated Account Erasure/Retention contract evolution before any
commercial schema is implemented; it does not authorize retained records or a
duration by itself.

## 36. Open decisions preserved

The following remain OPEN or external:

- payment provider, billing portal provider, and provider signature scheme;
- advertising provider and CMP;
- Monthly/Annual prices, regional pricing, currency, tax, and launch geography;
- retry cadence inside grace and dunning schedule;
- exact provider mechanism for delayed next Paid coverage;
- Promotion/Admin/Support overlap and duration-consumption precedence;
- maximum Admin/Support Grant duration and campaign terms;
- Referral inactivity/abandonment policy, attribution window, cookie lifetime,
  and public code format;
- cache technology and invalidation transport;
- reconciliation and maturation scheduler cadence/topology;
- operator RBAC, approval, and break-glass policy;
- commercial retention durations, backup/restore, legal hold, and processor
  treatment;
- fraud policy and evidence retention;
- provider raw-evidence storage;
- billing management mechanics; and
- final production legal/privacy disclosures.

Absent decisions cause deferred or fail-closed behavior, not guessed defaults.

## 37. Source review and repository compatibility

This contract was reviewed against:

- the three frozen upstream commercial/advertising/architecture authorities;
- `docs/PRD.md` and `docs/ARCHITECTURE.md` for the Website/BFF, PostgreSQL,
  RFC 9457, provider-neutral, security, and scientific boundaries;
- Account Deletion / Erasure, Data Retention, Account Data Export, Privacy
  Access Audit, Notification Platform, Observability, and Problem Details
  contracts;
- current Vault contracts and Account ownership direction;
- current PostgreSQL migration-runner conventions through migration `0010`;
- existing Account-erasure Account-root locking and transaction ownership;
- existing Notification owner/dedupe/row-lock, `FOR UPDATE SKIP LOCKED`, lease,
  and idempotency patterns; and
- the current finite Problem Details registry and request-observability
  conventions.

No frozen upstream document, runtime source, package, migration, manifest,
lockfile, provider integration, or scientific repository is changed by this
contract.

## 38. Freeze conclusion

```text
Commercial facts                   = APPEND-ORIENTED / ATTRIBUTABLE
Normalized source state             = AUTHORITATIVE / SOURCE-LOCAL / REBUILDABLE
Commercial serialization            = LIVE ACCOUNT ROOT -> COMMERCIAL AUTHORITY
Entitlement revision                = MONOTONIC PER AUTHORITY / +1 PER LOGICAL CHANGE
Projection                          = DERIVED / REVISION- AND TIME-AWARE
Provider receipt                    = UNIQUE / REPLAY-SAFE / NON-AUTHORIZING
Paid relationship                   = PROVIDER-NEUTRAL / NOT UNIVERSAL ENTITLEMENT
Paid coverage                       = PURCHASE-ATTRIBUTABLE / SOURCE-LOCAL REVERSAL
Referral reward                     = PER-CONVERSION / 30 ELAPSED DAYS / NO DEBT
Referral consumption                = OLDEST MATURED FIRST / SEQUENTIAL
Grant model                         = FIXED WINDOW + DURATION BANK CAPABLE
Non-Referral grant precedence       = OPEN
Grace                               = PAID SOURCE / 7 * 24 HOURS
Coverage order                      = PAID -> REFERRAL -> NEXT PAID
Authorization                       = CANONICAL SERVER EVALUATOR / FAIL CLOSED
Historical content                  = CURRENT PRO NOT REQUIRED FOR RETAINED VIEW
Vault                               = FREE 3 / PRO UNLIMITED / TRANSACTIONAL QUOTA
Notification                        = ENTITLEMENT INPUT ONLY / PUSH != PRO
Advertising                         = ANY EFFECTIVE PRO -> AD-FREE
Account deletion                    = ACTIVE STATE ERASED; RETAINED FACTS POLICY-GATED
Commercial retention duration       = OPEN
Provider selection                  = DEFERRED
Concrete migration                  = NOT CREATED
Runtime implementation              = NOT PERFORMED
```

Subscription / Entitlement Persistence & API Contract V1 is frozen at the
documentation level. The first bounded implementation slice is:

> **`WEB-COMMERCIAL-001D1` — Implement Commercial Authority, Event Journal,
> and Provider Receipt Persistence Foundation.**

Do not begin that slice automatically.
