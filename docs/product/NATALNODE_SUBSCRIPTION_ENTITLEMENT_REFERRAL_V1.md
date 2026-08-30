# NatalNode Subscription, Entitlement, and Referral Product Policy V1

| Field | Value |
| --- | --- |
| Status | **SUBSCRIPTION / ENTITLEMENT SECOND-LAYER PRODUCT RULES V1 FROZEN / IMPLEMENTATION DEFERRED** |
| Task | `WEB-COMMERCIAL-001B` |
| Reviewed baseline | `7038cc63b75ce7f9df556dfc050bf120f403cd70` (`docs: freeze commercial product boundaries`) |
| Decision date | 2026-08-30 |
| Scope | Subscription tiers, account entitlement, downgrade semantics, referral rewards, and cross-system commercial boundaries |
| Product source of truth | `docs/PRD.md` |
| Architecture status | **NOT YET FROZEN** |
| Implementation status | **DEFERRED** |
| Scientific/provider status | **PROVIDER DECISION DEFERRED** |

## 1. Purpose and authority

This document freezes the V1 product semantics for Subscription, Entitlement,
and Referral so that later Account, Vault, Personal Transits, Astrology Alerts,
Notification, Billing, Advertising, Privacy, Export, and deletion work can use
one compatible boundary. The first-layer commercial boundary from
`WEB-COMMERCIAL-001A` is preserved, and Section 20 now freezes the approved
second-layer rules for cancellation, payment failure, refunds, chargebacks,
entitlement sources, referral-time consumption, grants, and cross-domain
interactions.

This is a product-policy document. It is not:

- application code;
- a billing-provider selection;
- a checkout or webhook contract;
- a database schema or migration;
- a payment, tax, refund, or legal Terms document;
- an authorization to implement referral runtime behavior; or
- proof that any paid feature is currently live.

The current repository documents subscription, billing, referral, advertising,
and consent runtime as absent or deferred. This freeze establishes future
product meaning; it does not convert a planned capability into an implemented
one. Repository behavior remains authoritative for current availability until
implementation is separately approved and verified.

The fixed system boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
```

Commercial policy belongs to the Website/BFF and account boundary. It must not
move astronomy calculation, provider selection, scientific configuration, or
provenance decisions into the Website. **PROVIDER DECISION DEFERRED** remains
unchanged.

## 2. Decision vocabulary

Every statement in this document uses one of these categories:

| Category | Meaning |
| --- | --- |
| **CURRENT REPOSITORY FACT** | An observed baseline fact used for context. It is not a new product commitment and does not prove future behavior is live. |
| **FROZEN PRODUCT RULE** | Product behavior that later implementation must preserve. It is not evidence that the behavior is live. |
| **ARCHITECTURE REQUIREMENT** | A constraint that a later entitlement/billing architecture must satisfy after the required product decisions are complete. It does not choose code, schema, provider, or deployment. |
| **FUTURE IMPLEMENTATION REQUIREMENT** | A concrete later implementation constraint derived from a frozen product rule. It does not authorize implementation in this document. |
| **OPEN PRODUCT / IMPLEMENTATION DECISION** | An unresolved product, architecture, implementation, or operations question that must be explicitly resolved before the corresponding freeze. No fallback is silently chosen. |
| **EXTERNAL / LEGAL / PROVIDER GATE** | A dependency on law, legal review, operations, a payment/advertising/consent provider, production geography, or another external owner. |

The words **Free**, **Pro**, **active Pro entitlement**, **subscription**, and
**referral reward** are product concepts in this document. They are not names
for database tables, API fields, payment-provider states, or implementation
classes.

## 3. Current repository status

The reviewed product and technical documents establish the following current
boundary:

- The PRD describes a Free + Pro direction, Free Vault access, larger Pro
  storage, advanced Pro capabilities, and Pro no-ad behavior.
- The PRD places Pro and Ads in P1 and does not freeze commercial price points.
- The Notification Platform contract deliberately did not freeze plan names,
  billing, checkout, a subscription table, or a billing provider.
- The Privacy & Terms policy records no current subscription, payment, billing,
  checkout, advertising provider, analytics provider, or CMP implementation.
- The Product Roadmap keeps monetization and CMP/privacy readiness deferred.

Therefore:

> **FROZEN PRODUCT RULE:** This document freezes the target V1 commercial
> semantics while the current product remains non-commercial at runtime until
> separate implementation, provider, legal, privacy, and release gates pass.

## 4. Account-level entitlement model

### FROZEN PRODUCT RULE

NatalNode V1 has exactly two user-facing entitlement tiers:

```text
FREE
PRO
```

No additional user-facing paid tier exists in V1. In particular, V1 does not
include a Lifetime, Premium, Plus, Ultimate, or another parallel paid tier.

Entitlement belongs to the NatalNode Account. The same account receives the
same effective entitlement on supported devices and sessions. Entitlement is
not device-bound and must not depend on a device fingerprint.

The account is the product authority for whether a user may use a Pro-class
capability. A browser flag, PushSubscription, cookie, local storage value,
client claim, or UI-only state is never sufficient authority for paid access.

### ARCHITECTURE REQUIREMENT / FUTURE IMPLEMENTATION REQUIREMENT

The Website/BFF and future clients must consume a server-owned, account-scoped
effective entitlement decision. They must not independently derive paid access
from a plan label, browser state, payment-provider response, or notification
capability.

The exact evaluator, persistence shape, provider adapter, and API projection
remain outside this task.

## 5. Pro billing duration semantics

### FROZEN PRODUCT RULE

Pro may be purchased using:

- Monthly billing; or
- Annual billing.

Monthly Pro and Annual Pro provide identical product entitlements. They differ
only in billing duration and price. A customer must not receive a different
scientific calculation, accuracy level, chart-fact set, or feature class solely
because the customer selected monthly rather than annual billing.

### OPEN PRODUCT DECISION

The following are intentionally not frozen here:

- exact monthly and annual price points;
- regional pricing;
- tax treatment and display;
- exact payment retry cadence inside the frozen renewal grace period;
- exact dunning or billing-recovery message schedule; and
- payment-provider terms.

The product-level cancellation and renewal-failure rules are frozen in
Section 20. Provider mechanics and operational recovery details remain open.

## 6. Free product boundary

### FROZEN PRODUCT RULE

Free must provide a genuine, useful astrology experience. Free includes the
following product boundary:

- complete natal-chart calculation;
- no intentionally degraded astronomical calculation accuracy;
- core planet, sign, house, and aspect data;
- the baseline Chart Result experience;
- Learn access;
- public Tools and future public micro-tools; and
- a Vault capacity of three saved charts for a Free account.

Free is not a deliberately crippled scientific product. NatalNode must never
monetize by sending Free users through a less accurate astronomy calculation,
removing scientific inputs, lowering precision, selecting a weaker provider,
or withholding core chart facts that are part of the baseline result.

### FROZEN PRODUCT RULE — ACCURACY SEPARATION

Pro monetizes:

- depth;
- continuity;
- personalization;
- automation;
- storage and workflow scale; and
- advanced presentation/export.

Pro does not monetize scientific accuracy. The Free and Pro product paths must
not become two different truth standards.

### ARCHITECTURE REQUIREMENT / FUTURE IMPLEMENTATION REQUIREMENT

Any Free/Pro gate must be applied after the account and product boundary has
received the complete Engine-backed baseline result. It must not alter the
Engine request, calculation path, scientific metadata, provider-neutral
contract, or provenance truth.

The PRD's Guest path remains separate from a Registered Free account: a Guest
may calculate without registration but has no permanent cross-device Vault.
This document does not create guest persistence or change the existing Guest
privacy boundary.

The existence of this Free boundary does not make every roadmap item live. A
future P1/P2 capability still needs its own product and implementation gate.

## 7. Pro capability classes

### FROZEN PRODUCT RULE

The following capability classes are Pro-class in V1/product direction:

- unlimited Vault capacity;
- Personal Transits;
- Astrology Alerts;
- deeper interpretation and synthesis;
- advanced chart workflows;
- advanced Workspace functionality where applicable;
- advanced export, including PDF or image export where applicable;
- future high-value personalized astrology workflows;
- future Synastry/Composite-class advanced workflows unless explicitly
  reclassified by a later product decision; and
- an Ad-Free product experience.

This is an entitlement classification, not a claim that all listed features
are implemented, launched, or available in the current repository. No exact
unfinished-feature interaction, quota, output format, or UI is invented here.

The PRD prohibition on an “Unlimited AI” promise remains in force. Any future
AI capability must preserve an explicit quota/Fair Use boundary approved by a
separate product decision.

Public Current Sky or Current Planet information is distinct from personalized
Personal Transits. This policy does not remove the PRD's public/free direction
for current-sky or public-tool experiences; any future feature-specific gate
must preserve that distinction rather than treating every present-time sky
view as a Pro Personal Transits workflow.

### ARCHITECTURE REQUIREMENT / FUTURE IMPLEMENTATION REQUIREMENT

Future feature surfaces must ask the account/BFF boundary for eligibility and
must fail closed when entitlement is unavailable or indeterminate. They must
not treat the presence of a Pro label in browser state as authorization.

## 8. No traditional free trial

### FROZEN PRODUCT RULE

V1 does not use a conventional free trial. In particular, V1 does not promise
or create:

- a 7-day trial;
- a 14-day trial; or
- a payment-method trial.

Free itself is the long-term acquisition and evaluation tier. A referral
purchase discount is a purchase promotion, not a free trial and must not be
described as one.

### OPEN PRODUCT DECISION

Future experimentation with a trial may occur only through a later explicit
product decision. No trial duration, payment-method requirement, or conversion
rule is implied by this document.

## 9. Downgrade and data-preservation principle

### FROZEN PRODUCT RULE

The V1 downgrade principle is:

```text
DATA PRESERVATION + CAPABILITY DOWNGRADE
```

When Pro actually becomes inactive, NatalNode must not delete user-owned
historical data merely because the account no longer has active Pro
entitlement.

### Vault behavior

If the Free limit is three charts and a former Pro account has more than three
saved charts:

- preserve all saved charts;
- allow the owner to view existing charts;
- allow the owner to delete existing charts;
- prevent creation above the active Free quota; and
- once the account is below the Free quota, allow creation normally again.

No automatic deletion of excess charts is permitted. A quota is a creation
capability boundary, not a data-hostage mechanism.

### Personal Transits and Astrology Alerts

- Preserve configuration where safe.
- Stop Pro-only execution when the required Pro entitlement is inactive.
- Do not silently continue paid automation after downgrade.
- Do not erase configuration merely because execution is currently ineligible.

### Notification preferences and browser capability

- Preserve notification preferences.
- A Pro-only Astrology Alert becomes ineligible when Pro entitlement is
  inactive.
- Browser notification permission is a capability state, not paid entitlement.
- An active owner-bound PushSubscription is a delivery capability, not paid
  entitlement.

### Historical generated Pro content

- Already generated and durably stored Pro content remains viewable after
  downgrade.
- New Pro-only generation requires active Pro entitlement.
- This rule preserves the user's historical work and does not grant new Pro
  generation after downgrade.

### FUTURE IMPLEMENTATION REQUIREMENT

Downgrade enforcement must be capability-specific and must preserve owner
access to data that the product has already durably stored. It must not use
destructive cleanup as a substitute for entitlement evaluation.

### OPEN PRODUCT / IMPLEMENTATION BOUNDARY

Section 20 freezes the product-level transitions for cancellation, renewal
failure, grace expiration, refund, and chargeback. The exact provider event
mapping, operational recovery messaging, and any remaining granted-source
expiry mechanics still require later decisions. The preservation rule applies
whenever the resulting effective entitlement is Free.

## 10. Notification and entitlement boundary

### FROZEN PRODUCT RULE

The Consumer Notification Platform local engineering foundation is closed and
its architecture remains unchanged. This commercial policy adds only the
product distinction below:

```text
Web Push capability != paid notification entitlement
```

A user may simultaneously have:

- browser push permission;
- an ACTIVE owner-bound PushSubscription; and
- saved notification preferences;

without having active Pro entitlement.

Pro Astrology Alert execution requires current account-level entitlement
eligibility. A Free user must not receive Pro-only Astrology Alert execution
merely because a PushSubscription exists.

### FUTURE IMPLEMENTATION REQUIREMENT

The future notification eligibility boundary may consume a bounded account-level
entitlement answer:

```text
Account entitlement eligibility
    -> NotificationEligibilityService
    -> existing preference/planner/outbox/channel/transport path
```

Billing/entitlement changes an eligibility input; it must not redesign browser
permission, PushSubscription ownership, service-worker validation, delivery
mechanics, deduplication, or outbox state.

No notification plan, billing source, notification history, or delivery schema
is created by this document.

## 11. Referral V1: product purpose and economic shape

### FROZEN PRODUCT RULE

Referral is a formal NatalNode growth mechanism with two distinct sides:

```text
GIVE = customer purchase discount
GET  = referrer NatalNode Pro entitlement time
```

These are separate concepts. A customer price discount must not be confused
with a referrer reward, and a referrer reward is not cash compensation.

### GIVE: referred customer purchase discount

For a qualifying referred user making their first qualifying Pro purchase:

| Purchase | First-purchase referral discount |
| --- | ---: |
| Monthly Pro | 50% off the first paid month |
| Annual Pro | 15% off the first paid year |

The exact qualifying and reversal semantics are defined below and by the open
second-layer decisions. This table does not set a general price or a renewal
discount.

### GET: referrer reward

For each qualifying referred customer, the referrer earns:

```text
30 days of NatalNode Pro entitlement value
```

The reward is substantive Pro entitlement time, not abstract points, a badge,
an engagement score, or a promise of cash value.

## 12. Referral qualification and maturation

### FROZEN PRODUCT RULE

A referral reward does not mature at registration. The conceptual qualification
sequence is:

```text
referral attribution
    -> new user registration/account association
    -> first qualifying Pro purchase
    -> successful payment
    -> 14-day maturation period
    -> reward becomes earned
```

During the 14-day maturation period, the reward is `PENDING`.

If, before maturation, any of the following occurs, the pending reward may be
revoked:

- refund;
- chargeback;
- payment reversal; or
- confirmed fraudulent or self-referral transaction.

Account creation alone never creates an earned or applied reward. The
post-maturation treatment of a later reversal is frozen in Section 20; this
does not authorize any referral runtime implementation.

### FUTURE IMPLEMENTATION REQUIREMENT

The eventual referral implementation must represent the conceptual sequence
and must not grant the reward before the successful-purchase and maturation
conditions are satisfied. It must preserve a bounded, reviewable reason when a
pending reward is revoked without exposing unnecessary payment or personal
data in product logs.

No schema, event payload, fraud score, clock source, or payment-provider API is
selected here.

## 13. Referral reward lifecycle states

### FROZEN PRODUCT RULE

The product-level lifecycle terminology is:

| State | Product meaning |
| --- | --- |
| `PENDING` | A qualifying purchase occurred, but the 14-day maturation period is incomplete. |
| `EARNED` | The reward successfully matured. |
| `APPLIED` | The earned Pro-time value has been incorporated into the referrer's effective entitlement. |
| `REVOKED` | The reward was invalidated by a qualifying reversal or fraud/self-referral policy. |

These are product semantics, not a database schema or a required enum name in
implementation. No unlisted state is needed to explain the product contract;
implementation may use private technical states only if they preserve these
user-facing meanings.

## 14. Referral reward application and cap

### FROZEN PRODUCT RULE

If the referrer currently has active paid Pro, a matured/applied 30-day reward
extends the referrer's effective Pro access.

If the referrer is Free, a matured/applied reward grants 30 days of Pro access.

Rewards may accumulate. Examples:

| Valid qualifying referrals | Standard reward value |
| ---: | ---: |
| 3 | 90 days |
| 6 | 180 days |
| 12 | 360 days |

The standard V1 rolling reward cap is:

```text
maximum 12 standard qualifying referral rewards per rolling 12 months
maximum 360 standard reward days per rolling 12 months
```

Users whose behavior exceeds this standard profile may later belong in a
separate Creator/Affiliate program. V1 does not build or imply an Affiliate
Program.

### FUTURE IMPLEMENTATION REQUIREMENT

The implementation must enforce the cap against qualifying reward events, not
against arbitrary clicks, registrations, ad engagement, or client-provided
counts. It must preserve the difference between a reward that is earned and a
reward that has been applied to effective entitlement.

### OPEN PRODUCT DECISION

The paid/referral sequencing and no-double-consumption rules are frozen in
Section 20. The ordering and overlap rules among Promotion, Admin Grant, and
Support Grant remain open in Section 22. The rules above establish the reward
value and eligibility direction without silently selecting an architecture.

## 15. Referral attribution and identity boundary

### FROZEN PRODUCT RULE

- One user may produce only one first-purchase referral conversion.
- The referral relationship becomes locked after the first qualifying Pro
  purchase.
- A historical paid user cannot later be reclassified as a first-purchase
  referral conversion.
- A referrer cannot legitimately refer themselves.
- Referral codes are conceptually separate from internal user IDs.
- Referral codes should be non-predictable.
- Safe regeneration and revocation may be supported later without changing the
  separation from internal IDs.

### FUTURE IMPLEMENTATION REQUIREMENT

Attribution must be account-scoped, server-authoritative, and resistant to
replay or reassignment. The browser may carry an attribution signal, but it
must not choose the final referrer, rewrite a locked relationship, or claim a
reward.

No code format, table, cookie lifetime, or attribution window is frozen here.

## 16. Referral abuse and privacy boundary

### FROZEN PRODUCT RULE

V1 does not adopt invasive device fingerprinting as its referral fraud policy.
The following alone are not fraud classifications:

- VPN usage alone;
- a shared household IP alone;
- a shared office IP alone; or
- cookie clearing alone.

Reasonable future signals may include:

- same account identity;
- clear self-referral;
- the same payment instrument where legally and technically available;
- repeated payment reversals;
- known historical customer state; and
- an explicit abuse pattern.

Fraud controls must be proportionate and privacy-conscious. The purpose is to
protect the referral program, not to create a generalized identity-surveillance
system.

### FUTURE IMPLEMENTATION REQUIREMENT

Any fraud decision must use a bounded, documented signal set, preserve a
reviewable outcome, minimize retained personal data, and keep ordinary
operations separate from sensitive advertising targeting. No unapproved
fingerprint, cross-site identity graph, or invasive tracking is authorized.

## 17. Promotion stacking

### FROZEN PRODUCT RULE

The referral purchase discount must not stack multiplicatively or additively
with another purchase discount.

If multiple eligible purchase promotions exist, apply the single best customer
purchase discount unless a future campaign explicitly defines another rule.

Example:

```text
Referral Annual: 15%
Campaign:        25%
Customer gets:   25%
Customer does not get: 40%
```

Valid referral attribution may still generate the referrer's standard reward
unless the campaign explicitly excludes referral rewards.

The customer's purchase price discount and the referrer's entitlement reward
remain distinct concepts throughout billing, support, reporting, and future
export/erasure review.

### FUTURE IMPLEMENTATION REQUIREMENT

Promotion evaluation must be server-owned and auditable without logging raw
payment credentials, unnecessary personal data, or ad engagement. A campaign
may explicitly exclude a referral reward only when the campaign's product
policy says so.

## 18. Cross-system commercial boundary

| Product area | Frozen commercial meaning | Future implementation constraint |
| --- | --- | --- |
| Account | Entitlement belongs to the NatalNode Account and is consistent across supported devices/sessions. | Account/BFF is the authority; no device-bound entitlement. |
| Chart calculation | Free receives the complete baseline chart path and is never made less accurate. | Tier logic must not alter Engine facts or provider-neutral contracts. |
| Vault | Free has capacity for three saved charts; Pro has unlimited Vault capacity in product direction. | Downgrade preserves existing charts and gates new creation above the active Free quota. |
| Personal Transits | Pro-class capability. | Inactive entitlement stops Pro-only execution and preserves safe configuration. |
| Astrology Alerts | Pro-class capability. | Notification eligibility must check account entitlement in addition to preferences and push capability. |
| Notification Platform | Web Push capability is separate from paid entitlement. | Do not redesign the closed notification foundation. |
| Learn | Free access remains part of the useful baseline and may be future ad-eligible under the separate advertising baseline. | Preserve editorial quality, privacy, and surface whitelist. |
| Public Tools | Free access to public Tools/future public micro-tools is part of the useful baseline. | A future ad decision must require sufficient original publisher value and must not disrupt the primary interaction. |
| Chart Result / Workspace | Baseline result is Free; deeper and advanced workflows are Pro-class direction. | UI reads server-owned eligibility and never manufactures chart facts or paid state. |
| Export | Advanced export is Pro-class direction where applicable. | Exact formats and entitlement checks require later feature contracts. |
| Advertising | Pro is Ad-Free; Free may receive ads only on approved surfaces. | Detailed surfaces, consent, provider, and targeting policy are governed by `NATALNODE_ADVERTISING_COMPLIANCE_BASELINE_V1.md`. |
| Product Analytics | Product measurement is conceptually separate from advertising targeting. | Do not forward arbitrary commercial, referral, chart, or user payloads into ad-tech. |

This table is a responsibility boundary, not a schema proposal.

## 19. Privacy, deletion, retention, and commercial records

### FROZEN PRODUCT RULE

Future commercial work must distinguish at least:

- user-owned product data;
- entitlement records;
- legally or accountingly required transaction records;
- fraud and security evidence; and
- advertising consent records where legally necessary.

An entitlement or payment event must not become a reason to retain unrelated
birth data, Vault contents, chart facts, interpretations, notification
preferences, or referral history indefinitely.

The existing account-erasure contract remains the active privacy boundary for
the current account graph. Future commercial persistence must update the
account-owned data graph and its export/erasure/retention contracts before
implementation. No commercial record is silently exempt from deletion merely
because it is convenient to retain.

### FUTURE IMPLEMENTATION REQUIREMENT

Before any billing or referral persistence is implemented, the owning product
and privacy contracts must identify:

- whether the record is account-owned, operational, legally required, or
  fraud/security evidence;
- the minimum necessary fields and access roles;
- export representation or explicit exclusion;
- account-deletion behavior;
- retention and backup treatment; and
- the boundary to payment, advertising, analytics, and support processors.

The implementation must not weaken the hard active-database account-erasure
direction or create an identity-bearing deletion workaround without an
explicit privacy/security decision.

### OPEN PRODUCT DECISION

The product consequences for full refund, partial refund, chargeback, source-
specific revocation, and support/admin correction are frozen in Section 20.
Exact commercial-record retention, backup, export, erasure, accounting, tax,
provider, and operational treatment remains subject to the open and external
gates in Sections 22 and 23. Nothing here creates a retention exception for
user-owned product data.

## 20. Subscription / entitlement second-layer product rules

### FROZEN PRODUCT RULE

The following second-layer product rules are now frozen for V1. They define
product meaning only. They do not freeze an entitlement architecture, a
database shape, a billing provider, an event protocol, or an implementation.

The commercial state after this section is:

```text
Subscription / entitlement second-layer rules = V1 FROZEN
Architecture                                   = NOT YET FROZEN
Implementation                                 = DEFERRED
Provider selection                             = DEFERRED
```

### 20.1 Cancellation and reversal before period end

### FROZEN PRODUCT RULE

User cancellation takes effect at the end of the current paid billing period.
Cancellation means:

- automatic renewal is disabled;
- current paid Pro access continues through the already-paid period;
- cancellation does not immediately remove the already-paid entitlement;
- cancellation does not delete user data; and
- cancellation does not revoke already-earned referral entitlement.

If the user reverses cancellation before the current paid period ends, renewal
may be restored. Reversal does not create a new subscription period or duplicate
paid entitlement. The exact provider API or billing-portal mechanics remain
outside this policy.

### 20.2 Renewal failure, grace, and first-payment failure

### FROZEN PRODUCT RULE

The V1 renewal-payment grace period is **7 days**. It applies only to a
previously valid paid Pro relationship whose renewal payment fails. During the
seven-day grace period:

- effective Pro access remains active;
- Pro features continue;
- Pro Ad-Free remains active;
- Pro-only Astrology Alerts may remain eligible subject to the normal
  Notification eligibility contract;
- future billing-recovery messaging may be shown; and
- the user is not temporarily downgraded merely because recovery is pending.

If payment successfully recovers within the grace period, Pro continues
without a downgrade event, duplicate entitlement period, or new free trial.
Retry cadence and dunning-message timing remain open decisions.

A failed first Pro purchase is different from a failed renewal. It receives no
renewal grace period:

- no successful first payment means no paid Pro entitlement;
- no conventional trial is created;
- no seven-day grace is granted; and
- the referral conversion does not qualify until a successful qualifying
  payment exists.

When the seven-day grace period ends without successful recovery, the paid
renewal source ends and the account soft-downgrades to Free if no other
legitimate Pro entitlement source remains. The existing data-preservation
rules apply: user-owned data and safe historical content remain, new Pro-only
capability use and Pro-only automated execution stop, preferences remain, and
PushSubscription is not deleted merely because Pro expires. Pro Ad-Free ends;
Free advertising eligibility may resume only on otherwise approved ad surfaces.

If valid Referral Pro time or another legitimate Pro source immediately
continues access, the effective account does not pass through an unnecessary
Free interval. This continuity is defined in Section 20.5 and does not select
provider retry or renewal-rescheduling mechanics.

### 20.3 Refunds, partial refunds, and chargebacks

### FROZEN PRODUCT RULE

A confirmed full refund removes the remaining paid entitlement associated with
the refunded purchase. It does not:

- delete the NatalNode account;
- delete user-owned product data merely because of the refund;
- erase historical charts solely because payment was refunded;
- create negative entitlement time; or
- retroactively charge the user for already-used Pro time.

After the affected paid source is no longer valid, effective access is
recomputed from any other legitimate source, such as Referral, Promotion,
Admin Grant, or Support Grant. A valid other source remains valid; a refund
does not revoke unrelated entitlement.

V1 does not define a general self-service partial-refund entitlement model. A
partial refund may be handled only as an explicit exceptional commercial
operation when required by law, provider capability, or customer-support
policy. It must not silently create proportional entitlement arithmetic until
a later policy explicitly defines that behavior. No accounting or tax
treatment is selected here.

A confirmed chargeback or payment reversal removes the remaining paid
entitlement associated with that payment. The account is not automatically
deleted. Effective access is recomputed from remaining legitimate sources; if
none remain, the account soft-downgrades to Free. A chargeback does not create
negative entitlement time or automatically equal account termination.

Refund and chargeback consequences are source-specific. For example, a
refunded paid purchase does not revoke a valid Admin Grant, and a revoked
Referral reward does not revoke valid paid Pro. Any payment restriction,
fraud hold, account restriction, or additional security action belongs to a
separate fraud/security policy.

### EXTERNAL / LEGAL / PROVIDER GATE

These are NatalNode's product-level default rules. They remain subject to
applicable law, mandatory consumer rights, payment-provider requirements, and
later operational policy. They are not a claim that a provider will process a
refund or chargeback in a particular way.

### 20.4 Entitlement sources, effective Pro, and negative time

### FROZEN PRODUCT RULE

Effective Pro may arise from distinct conceptual entitlement sources. At
minimum, the sources remain distinguishable as:

```text
PAID
REFERRAL
PROMOTION
ADMIN_GRANT
SUPPORT_GRANT
```

These sources must not masquerade as one another. A Support Grant is not an
Annual paid subscription, a Referral reward is not customer payment, and a
paid subscription is not an Admin Grant.

A simple persistent `is_pro = true` value is not the authoritative commercial
model. The reason is product-semantic: effective Pro can arise from multiple
independently auditable sources with different origins, durations, refund
semantics, cancellation semantics, revocation semantics, and audit needs.

### ARCHITECTURE REQUIREMENT / FUTURE IMPLEMENTATION REQUIREMENT

The conceptual product rule is:

```text
EFFECTIVE PRO = at least one legitimate current entitlement source grants Pro
```

Later architecture must derive effective access from authoritative entitlement
state and preserve source attribution. This section does not define a
precedence algorithm, evaluator API, cache, table, enum, or database model.

Entitlement time must never become negative. This applies to refunds,
chargebacks, Referral revocation, Admin/Support correction, and promotional
reversal. Consumed legitimate historical access is never converted into a
debt or negative future Pro balance.

Access precedence and time-consumption order are different concepts. Any
legitimate active source may make the user Effective Pro. The only fully
frozen time-consumption sequencing rule beyond a source-specific revocation is
the paid/Referral rule in Section 20.5. Ordering or overlap among Promotion,
Admin Grant, and Support Grant remains open.

### 20.5 Referral entitlement time

### FROZEN PRODUCT RULE

A standard Referral reward is **30 real days of Pro access**. It is substantive
entitlement time, not marketing points, a nominal credit, a cosmetic status, or
value that disappears under an overlapping paid period.

Paid Pro time and Referral Pro time must not be simultaneously consumed for the
same effective access period. The frozen V1 product sequence is:

```text
ACTIVE PAID TIME
    -> REFERRAL PRO TIME
    -> NEXT PAID RENEWAL
```

Referral days extend the effective Pro timeline. For example, if paid Pro is
valid through `2027-03-01` and the user has 90 valid Referral days, those 90
days supply Pro access after the paid coverage rather than disappearing under
it. This rule applies equally to Monthly and Annual Pro; an Annual subscriber
does not lose Referral days because the paid period is longer, and a qualifying
referral still grants 30 days.

Referral rewards accumulate sequentially and do not run concurrently. One
qualifying reward provides 30 days, three provide 90 days, and six provide 180
days, subject to the existing rolling 12-month cap of 12 standard rewards / a
maximum of 360 standard reward days per rolling 12 months. For a Free user, a
newly earned and applied reward may begin Pro access immediately. Additional
Referral days append to the remaining Referral entitlement period; they do not
start parallel clocks.

Cancellation of paid auto-renewal does not revoke already-earned Referral
days. A cancelled paid period may end, the earned Referral days may then be
consumed, and the user becomes Free only when no renewal or other legitimate
Pro source remains. A renewal failure follows the same continuity principle:
the seven-day grace belongs to the existing paid renewal relationship; when it
ends, valid Referral time begins or continues immediately instead of creating
an unnecessary Free interval.

The 14-day maturation rule remains unchanged. A qualifying reward is `PENDING`
until the successful qualifying payment has matured. A refund, chargeback,
reversal, or confirmed fraudulent/self-referral transaction before maturation
may move it to `REVOKED`; no 30-day reward becomes earned.

If the underlying referred purchase is validly refunded, charged back, or
reversed after maturation, only the remaining unconsumed Referral value
attributable to that reversed purchase may be revoked. The later revocation:

- never creates negative Pro time;
- never requires repayment of already-consumed Pro days;
- never claws back unrelated Referral rewards;
- never claws back unrelated paid or granted entitlement; and
- preserves an auditable history that the reward was later revoked.

If all of that reward's days were already consumed, the reversal/revocation
semantics may still be recorded, but no future unrelated Pro days are
subtracted and no debt is created. If only part was consumed, only the
unconsumed attributable remainder is affected. The public lifecycle vocabulary
remains `PENDING`, `EARNED`, `APPLIED`, and `REVOKED`; a private reason such as
"revoked after partial/full consumption" may be retained later without
creating a new public lifecycle state.

Earned, non-revoked Referral days do not automatically expire merely because
the rolling 12-month cap limits new earning volume. Unless a later approved
policy says otherwise, they remain available until consumed. Any future
abandonment or inactivity rule is open.

### ARCHITECTURE REQUIREMENT / FUTURE IMPLEMENTATION REQUIREMENT

Later billing and entitlement architecture must deliver the promised Referral
time without paid/Referral double-consumption and must attribute any later
revocation to the affected referral source. It must not silently invent a
provider-specific pause, renewal deferral, clock, or reward arithmetic here.

### 20.6 Grants, promotions, and commercial corrections

### FROZEN PRODUCT RULE

`ADMIN_GRANT` is an explicit, bounded, attributable, and auditable Pro
entitlement source. Product meaning must be able to explain its source, reason,
operator or authority, duration or effective-until boundary, and creation time.
NatalNode must not rely on a permanent unaudited "make user Pro forever"
switch.

`SUPPORT_GRANT` is an explicit compensation source, such as 14 days of Pro for
a service incident. It remains distinguishable from paid subscription and
Referral, is auditable, and is bounded unless a later explicit policy permits
otherwise.

`PROMOTION` is a distinct non-paid source. It may later cover a launch campaign,
partner promotion, or limited access, but it must not masquerade as paid
subscription, must have explicit campaign terms, and does not alter the frozen
Referral reward value.

Commercial corrections must be explainable and auditable. A future
support/admin correction may add entitlement, revoke unconsumed erroneous
entitlement, or correct source metadata, but it must respect the no-negative-
entitlement rule and must not rewrite unrelated commercial history.

No Admin Grant, Support Grant, Promotion, or correction tooling is authorized
by this document.

### 20.7 Historical Pro content, Vault, Notification, advertising, and records

### FROZEN PRODUCT RULE

Already generated and durably stored Pro content remains viewable after
entitlement downgrade. "Remains viewable" is not a permanent-storage
guarantee: the content remains subject to user deletion, account deletion /
erasure, applicable retention policy, technical lifecycle rules, and legally
required deletion or retention boundaries. Subscription expiration alone is
not a data-deletion reason. A refund alone is not a general user-content
deletion instruction.

The Free Vault capacity remains three charts. If no effective Pro source
remains and the account has more than three saved charts, all existing charts
are preserved, viewing and deletion remain available, new creation is blocked
while the count is at or above the Free capacity, and normal Free creation
resumes once the count falls below three. Paid expiry, Referral expiry, grant
expiry, refund, and chargeback converge on this same effective-Free behavior
when no other Pro source remains.

Web Push capability remains distinct from paid notification entitlement. While
any legitimate source supplies Effective Pro, Pro Astrology Alert eligibility
may exist subject to the existing Notification eligibility contract. When no
effective Pro source remains, Pro-only alert execution stops, preferences
remain, and an active owner-bound PushSubscription is not automatically
deleted. Notification Platform is not redesigned by this policy.

Effective Pro from **any** legitimate source is Ad-Free:

```text
PAID / REFERRAL / PROMOTION / ADMIN_GRANT / SUPPORT_GRANT -> AD-FREE
```

During the seven-day renewal grace period, the user remains Effective Pro and
must not receive Free ads merely because renewal payment is unresolved. When
Effective Pro ends, Free advertising eligibility may resume only on the
approved surface whitelist. No default no-ad surface becomes ad-eligible merely
because the user downgraded. The Advertising Compliance Baseline remains the
authority for consent, targeting, privacy, and publisher-review boundaries.

Commercial entitlement records, payment/accounting records, Referral history,
fraud/security evidence, consent/compliance records, and user-owned product
content are distinct categories. Account deletion/erasure and retention may
therefore treat them differently where lawful, but no commercial category is
silently exempt from the existing privacy lifecycle. This section selects no
retention period and does not weaken active-database erasure or export policy.

### ARCHITECTURE REQUIREMENT / FUTURE IMPLEMENTATION REQUIREMENT

Before commercial persistence is implemented, the owning privacy, retention,
export, deletion, security, and operations contracts must classify each
commercial record, define its minimum necessary data and access, and specify
its export, erasure, retention, backup, and processor boundaries. No billing,
referral, grant, advertising, or provider implementation is authorized here.

### PROVIDER DECISION DEFERRED

No payment provider, billing provider, advertising provider, consent-management
provider, retry mechanism, or provider-specific subscription state is selected
by these rules.

## 21. Cross-domain contradiction audit

The following audit was performed at the product-semantic level as part of
this freeze. It does not create schema or implementation answers for unresolved
residual questions.

| Boundary checked | Result and resolution |
| --- | --- |
| Free vs Pro | **Resolved.** Free receives a genuine complete baseline astrology experience; Pro adds depth, continuity, personalization, automation, scale, advanced presentation/export, and Ad-Free status. |
| Free accuracy vs monetization | **Resolved.** Accuracy is not a tier lever. Free and Pro cannot use different scientific truth standards. |
| Free Vault quota vs Pro unlimited Vault | **Resolved.** Free creation is capped at three saved charts; Pro has unlimited capacity in product direction. Existing excess data is preserved on downgrade. |
| Downgrade vs user-owned data | **Resolved.** Capability downgrades; historical user-owned data is preserved, viewable, and deletable where specified. |
| Historical Pro content vs new Pro generation | **Resolved.** Stored Pro content remains viewable; new Pro-only generation requires active Pro entitlement. |
| Notification preference vs entitlement | **Resolved.** Preferences and PushSubscription remain independent capability state; Pro Astrology Alert execution separately requires account eligibility. |
| Browser PushSubscription vs paid access | **Resolved.** A PushSubscription never proves Pro entitlement. |
| Paid Pro vs referral-granted Pro time | **Resolved.** Paid time supplies access first, Referral time is delivered sequentially after it, and the next paid renewal must not economically consume Referral time. |
| Referral reward vs registration | **Resolved.** Registration creates no mature reward; successful first purchase plus 14-day maturation is required. |
| Pending or matured reward vs refund/chargeback/reversal/fraud | **Resolved.** Pending rewards may be revoked before maturation; after maturation only the unconsumed value attributable to the reversed referral may be revoked, without debt or unrelated clawback. |
| Referral purchase discount vs referrer reward | **Resolved.** They are separate concepts; a purchase discount does not erase a qualifying referrer reward unless a campaign explicitly excludes it. |
| Referral vs advertising engagement | **Resolved.** Referral rewards never depend on ad clicks, impressions, refreshes, views, or shares. |
| Free advertising vs Pro Ad-Free | **Resolved.** Free may receive ads only on a future approved surface whitelist; Pro is Ad-Free. |
| Public editorial pages vs private personalized output | **Resolved.** Public Learn/Tools may be considered as future inventory; personalized chart/transit/output surfaces are default no-ad and not primary ad inventory. |
| Consent vs page load | **Resolved.** Page load is not consent. Advertising eligibility must follow the future Consent State -> Advertising Eligibility -> Permitted Advertising Mode chain. |
| Account deletion vs commercial records | **Compatible with an explicit future gate.** Future commercial records must be classified and added to the privacy lifecycle contract before implementation; no retention exception is implied. |
| Product Analytics vs Advertising Targeting | **Resolved.** They are separate systems and purposes; analytics must not become an ad-tech export backdoor. |
| Cancellation vs paid access | **Resolved.** Cancellation disables automatic renewal but preserves already-paid Pro access through the current paid period and does not delete data or revoke earned Referral entitlement. |
| Renewal failure vs first-payment failure | **Resolved.** Only a previously valid paid relationship receives the seven-day renewal grace; a failed first purchase receives no paid entitlement, trial, or grace. |
| Renewal grace vs Referral balance | **Resolved.** Grace belongs to the paid renewal relationship; when it ends, valid Referral time can continue Pro immediately without an unnecessary Free interval. |
| Refund/chargeback vs other entitlement sources | **Resolved.** Only the affected paid source or affected Referral remainder is removed; unrelated paid, Referral, Promotion, Admin Grant, or Support Grant sources remain. |
| Partial refund vs entitlement arithmetic | **Resolved.** V1 has no general automated partial-refund formula; exceptional handling cannot silently create proportional time. |
| Entitlement sources vs `is_pro` | **Resolved.** Effective Pro is conceptually granted by at least one legitimate source; a persistent boolean is not authoritative. |
| Entitlement reversal vs negative time | **Resolved.** No refund, chargeback, revocation, correction, or promotional reversal creates negative time or a debt. |
| Historical Pro content vs retention/erasure | **Resolved.** Expiration/refund alone does not delete stored content, but user deletion, account erasure, retention policy, technical lifecycle, and legal boundaries still apply. |
| Any Effective Pro source vs Ad-Free | **Resolved.** Paid, Referral, Promotion, Admin Grant, and Support Grant all receive Ad-Free while valid; Free ads remain surface-whitelisted. |

### Required second-layer edge combinations

| Edge | Product-semantic result |
| --- | --- |
| A. Paid Pro + Referral days + cancellation | Paid access continues through the already-paid period; cancellation disables renewal only; earned Referral days remain and are consumed after paid time. |
| B. Annual Pro + 90 Referral days | Annual and Monthly Pro have the same reward semantics; 90 Referral days append after the paid Annual coverage and are not consumed concurrently. |
| C. Paid renewal failure + seven-day grace + Referral balance | Grace preserves Effective Pro under the existing paid renewal relationship; if recovery fails, valid Referral time continues immediately without an unnecessary Free interval. |
| D. Grace expires while Referral balance exists | The paid renewal source ends, but valid Referral time supplies Effective Pro; Free begins only after all legitimate Pro sources end. |
| E. Full refund while Referral entitlement exists | Remove only the affected remaining paid source; valid unrelated Referral time remains. If the refund is the referred purchase, apply the separate post-maturation attribution rule. |
| F. Chargeback while Admin Grant exists | Remove the affected paid source; the valid Admin Grant remains and Effective Pro continues. Account termination is not automatic. |
| G. Free user receives Referral reward | Once earned and applied, the 30 real days may begin immediately; additional Referral days append sequentially. |
| H. Matured Referral reward, then underlying purchase refunds later | Revoke only the unconsumed remainder attributable to that referral; consumed days are not repaid and unrelated sources are untouched. |
| I. Referral partly consumed, then underlying purchase chargebacks | Revoke only the remaining unconsumed attributable Referral value; never create debt, negative time, or unrelated clawback. |
| J. Support Grant + Free advertising eligibility | An active Support Grant makes the user Effective Pro and Ad-Free; Free advertising resumes only after it and every other legitimate Pro source end, and only on approved surfaces. |
| K. Effective Pro ends while PushSubscription remains `ACTIVE` | Stop Pro-only alert execution, preserve preferences and the owner-bound PushSubscription, and do not treat push capability as entitlement. |
| L. Account deletion while commercial records may have legal retention | Apply the active account-erasure contract to the account-owned graph; classify any separately retained commercial/legal record under later approved privacy and legal rules without inventing durations here. |

Audit conclusion:

```text
No product contradiction blocks the V1 boundary freeze.
Residual second-layer product, implementation, provider, legal, and operational
questions remain explicitly OPEN and block the next architecture freeze until
the appropriate owner resolves them.
```

## 22. Open product decisions — must be resolved before architecture freeze

The following questions are intentionally preserved as:

```text
OPEN PRODUCT DECISIONS — MUST BE RESOLVED BEFORE ARCHITECTURE FREEZE
```

No implementation may silently answer them:

1. Exact Monthly and Annual price points.
2. Regional pricing, currencies, and tax handling.
3. Payment provider and billing portal/provider boundary.
4. Exact payment retry cadence inside the seven-day grace period.
5. Exact dunning or billing-recovery message schedule.
6. Exact provider mechanics for deferring renewal while Referral days are
   consumed.
7. Exact ordering or overlap policy among Promotion, Admin Grant, and Support
   Grant.
8. Whether non-Referral grants can stack sequentially or overlap.
9. Maximum Admin Grant duration.
10. Maximum Support Grant duration.
11. Promotional campaign terms.
12. Legal refund windows by jurisdiction.
13. Statutory cooling-off rights.
14. Involuntary provider-cancellation behavior.
15. Account reactivation after a long lapse.
16. Earned Referral inactivity or abandonment policy, if ever needed.
17. Final entitlement architecture.
18. Final entitlement ledger model.
19. Payment webhook architecture and provider-isolation design.
20. Commercial-record retention periods and their export, deletion, backup,
    and accounting treatment where not already covered by an approved
    successor privacy contract.
21. Fraud/security enforcement policy.
22. Customer-support operational permissions.
23. Exact advertising-slot inventory, launch geography, advertising provider,
    and consent-management provider.

These questions do not weaken the already frozen principles: Free accuracy,
account-level entitlement, data-preserving downgrade, non-cash referral value,
the 14-day maturation rule, the rolling 12-month reward cap, the
PushSubscription/entitlement separation, and the advertising/privacy
firewalls.

## 23. External, legal, and provider gates

### EXTERNAL / LEGAL / PROVIDER GATE

The following remain outside this product-policy freeze and require the
appropriate owners:

- legal entity, consumer terms, refund rights, cancellation disclosures, tax,
  accounting, and jurisdiction-specific obligations;
- payment-provider selection, merchant-of-record or equivalent operating
  model, payment security scope, and processor terms;
- regional pricing and availability;
- advertising provider and current publisher policies;
- consent-management provider and regional consent behavior;
- operational fraud review, dispute handling, and support authority;
- production privacy disclosure for actual commercial processing; and
- production astronomy/provider rights and scientific release gates.

This document does not state that NatalNode is legally compliant, does not
guarantee a provider review outcome, and does not guarantee advertising
approval. It establishes a product boundary intended to reduce foreseeable
incompatibility and trust risk.

## 24. Explicit implementation non-goals

This task authorizes none of the following:

- TypeScript, Astro, React, API, BFF, or server implementation;
- subscription or entitlement evaluator code;
- payment, checkout, webhook, invoice, tax, or billing code;
- referral attribution, reward, fraud, or campaign runtime;
- database tables, schema changes, migrations, or retention jobs;
- a payment provider or advertising provider;
- ad scripts, CMP/consent UI, cookies, or tracking;
- changes to the Notification Platform contract or transport;
- changes to EngineClient, ChartRequest, ChartResult, astronomy, or provider
  behavior;
- changes to Account, Vault, Learn, Tools, Auth, server, deployment, or
  production configuration; or
- Language / Localization work.

Future architecture must be issued as a separate bounded task after the
remaining open product decisions above and the external/legal/provider gates
are explicitly resolved. This document does not authorize implementation.

## 25. Source review and evidence basis

The policy was reviewed against the following repository sources:

- `docs/PRD.md`, especially the user tiers, product principles, Vault,
  Learning Hub, Website API/BFF, Privacy, Ads, Pro, feature flags, release
  gates, P1 sequencing, and Codex boundary sections;
- `docs/ARCHITECTURE.md` for the Website/BFF -> Engine Public API boundary and
  the prohibition on speculative implementation/refactoring;
- `docs/product/NATALNODE_NOTIFICATION_PLATFORM_V1.md`, especially
  eligibility/entitlement separation, account deletion, retention, paid UX,
  billing/trigger separation, future subscription compatibility, and deferred
  decisions;
- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md` for the current absence of
  commercial runtime, approved advertising boundary, public-copy limits, and
  unresolved subscription/advertising/CMP decisions;
- `docs/product/NATALNODE_ADVERTISING_COMPLIANCE_BASELINE_V1.md` for the
  approved-surface whitelist, Effective-Pro Ad-Free boundary, consent and
  targeting firewall, and publisher-review safety constraints;
- `docs/product/NATALNODE_DATA_RETENTION_V1.md` for technical expiry versus
  retention, account-erasure interaction, external processor boundaries, and
  policy-required commercial lifecycle values;
- `docs/product/NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md` and
  `docs/product/NATALNODE_ACCOUNT_DATA_EXPORT_V1.md` for the active account
  ownership graph, hard-erasure direction, export boundary, and external
  backup/processor limitations;
- `docs/product/NATALNODE_PRODUCT_ROADMAP_V1.md` for deferred monetization,
  Learn/editorial quality, and the independent Web Product track;
- `docs/design/NATALNODE_VISUAL_SYSTEM_V1.md` for Learn/Tools editorial
  content-first behavior, ad-free core surfaces, privacy, and performance
  boundaries; and
- `docs/design/NATALNODE_BRAND_SYSTEM_V1.md` for the Learn-only editorial
  instrument scope and frozen shared brand boundary.

No runtime source, migration, manifest, lockfile, package, provider, or
scientific repository is changed by this policy. `C:\NatalNode` is outside the
review and implementation boundary.

## 26. Freeze conclusion

```text
User-facing tiers                 = FREE + PRO only
Free scientific accuracy          = MUST NOT be degraded for monetization
Pro billing durations             = MONTHLY + ANNUAL, identical entitlements
Traditional free trial            = NOT USED IN V1
Entitlement ownership             = ACCOUNT-LEVEL, NOT DEVICE-BOUND
Downgrade                         = DATA PRESERVATION + CAPABILITY DOWNGRADE
Referral purchase discount       = 50% Monthly / 15% Annual first purchase
Referral reward                   = 30 days Pro value per qualifying customer
Referral maturation               = 14 days after successful qualifying payment
Referral lifecycle                = PENDING / EARNED / APPLIED / REVOKED
Referral reward cap               = 12 standard rewards / rolling 12 months
Referral reward type              = NON-CASH PRO ENTITLEMENT TIME
Cancellation                       = END OF CURRENT PAID BILLING PERIOD
Renewal payment grace             = 7 DAYS FOR PREVIOUSLY VALID PAID PRO
First-payment failure             = NO PAID ENTITLEMENT / NO TRIAL / NO GRACE
Full refund / chargeback           = REMOVE AFFECTED REMAINING PAID SOURCE ONLY
Partial refund                     = NO GENERAL AUTOMATED PROPORTIONAL MODEL
Entitlement sources                = PAID / REFERRAL / PROMOTION / ADMIN_GRANT / SUPPORT_GRANT
Persistent is_pro boolean          = NOT AUTHORITATIVE
Negative entitlement time          = PROHIBITED
Paid -> Referral -> next Paid     = FROZEN NO-DOUBLE-CONSUMPTION SEQUENCE
Referral reversal after maturity   = REVOKE UNCONSUMED ATTRIBUTABLE REMAINDER ONLY
Any legitimate Pro source          = AD-FREE WHILE VALID
Push capability vs entitlement   = SEPARATE
Second-layer product rules         = FROZEN
Architecture                       = NOT YET FROZEN
Residual open decisions            = PRESERVED; BLOCK ARCHITECTURE FREEZE
Implementation                    = DEFERRED
```

The commercial product-policy boundary, including the second-layer product
rules, is frozen at this semantic level. The architecture is intentionally not
yet frozen, and implementation remains deferred. The next action is:

> **SUBSCRIPTION / ENTITLEMENT ARCHITECTURE V1 — DESIGN DISCUSSION / FREEZE**

Do not begin implementation, schema design, migrations, billing integration,
or provider selection as part of this task.
