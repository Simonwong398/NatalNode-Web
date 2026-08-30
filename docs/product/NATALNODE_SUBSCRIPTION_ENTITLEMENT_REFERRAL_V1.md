# NatalNode Subscription, Entitlement, and Referral Product Policy V1

| Field | Value |
| --- | --- |
| Status | **PRODUCT POLICY FREEZE / IMPLEMENTATION DEFERRED** |
| Task | `WEB-COMMERCIAL-001A` |
| Reviewed baseline | `172247dfb53675d19a4f23f6de3e34504c783840` (`feat: refine learn brand instrument`) |
| Decision date | 2026-08-30 |
| Scope | Subscription tiers, account entitlement, downgrade semantics, referral rewards, and cross-system commercial boundaries |
| Product source of truth | `docs/PRD.md` |
| Scientific/provider status | **PROVIDER DECISION DEFERRED** |

## 1. Purpose and authority

This document freezes the V1 product semantics for Subscription, Entitlement,
and Referral so that later Account, Vault, Personal Transits, Astrology Alerts,
Notification, Billing, Advertising, Privacy, Export, and deletion work can use
one compatible boundary.

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
| **FUTURE IMPLEMENTATION REQUIREMENT** | A constraint that an eventual implementation must satisfy after the required product decisions are complete. It does not choose code, schema, provider, or deployment. |
| **OPEN PRODUCT DECISION** | A second-layer product question that must be explicitly resolved before the corresponding architecture freeze. No fallback is silently chosen. |
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

### FUTURE IMPLEMENTATION REQUIREMENT

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
- renewal and cancellation timing;
- payment retry and failure behavior; and
- payment-provider terms.

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

### FUTURE IMPLEMENTATION REQUIREMENT

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

### FUTURE IMPLEMENTATION REQUIREMENT

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

### OPEN PRODUCT DECISION

The exact point at which a cancellation, failed payment, refund, chargeback, or
other commercial event makes Pro “actually inactive” remains open. The
preservation rule applies once that effective state is explicitly defined.

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

Account creation alone never creates an earned or applied reward.

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

The ordering and overlap rules for paid Pro time, referral-earned Pro time,
annual periods, and other possible granted time remain open in Section 21.
The rules above establish the reward value and eligibility direction without
silently choosing a stacking algorithm.

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

Exact retention, erasure, refund, chargeback, support-correction, and
accounting-treatment semantics for future commercial records are not frozen by
this document. They must be resolved with the relevant legal, privacy,
security, and operations owners before a commercial architecture freeze.

## 20. Cross-domain contradiction audit

The following audit was performed at the product-semantic level before this
freeze. It does not create schema or implementation answers for unresolved
second-layer questions.

| Boundary checked | Result and resolution |
| --- | --- |
| Free vs Pro | **Resolved.** Free receives a genuine complete baseline astrology experience; Pro adds depth, continuity, personalization, automation, scale, advanced presentation/export, and Ad-Free status. |
| Free accuracy vs monetization | **Resolved.** Accuracy is not a tier lever. Free and Pro cannot use different scientific truth standards. |
| Free Vault quota vs Pro unlimited Vault | **Resolved.** Free creation is capped at three saved charts; Pro has unlimited capacity in product direction. Existing excess data is preserved on downgrade. |
| Downgrade vs user-owned data | **Resolved.** Capability downgrades; historical user-owned data is preserved, viewable, and deletable where specified. |
| Historical Pro content vs new Pro generation | **Resolved.** Stored Pro content remains viewable; new Pro-only generation requires active Pro entitlement. |
| Notification preference vs entitlement | **Resolved.** Preferences and PushSubscription remain independent capability state; Pro Astrology Alert execution separately requires account eligibility. |
| Browser PushSubscription vs paid access | **Resolved.** A PushSubscription never proves Pro entitlement. |
| Paid Pro vs referral-granted Pro time | **Compatible but second-layer ordering open.** Both may represent Pro entitlement value, but overlap and precedence are explicitly not invented. |
| Referral reward vs registration | **Resolved.** Registration creates no mature reward; successful first purchase plus 14-day maturation is required. |
| Pending reward vs refund/chargeback/reversal/fraud | **Resolved.** Pending rewards may be revoked before maturation. The exact later-refund effect on matured/applied rewards remains open. |
| Referral purchase discount vs referrer reward | **Resolved.** They are separate concepts; a purchase discount does not erase a qualifying referrer reward unless a campaign explicitly excludes it. |
| Referral vs advertising engagement | **Resolved.** Referral rewards never depend on ad clicks, impressions, refreshes, views, or shares. |
| Free advertising vs Pro Ad-Free | **Resolved.** Free may receive ads only on a future approved surface whitelist; Pro is Ad-Free. |
| Public editorial pages vs private personalized output | **Resolved.** Public Learn/Tools may be considered as future inventory; personalized chart/transit/output surfaces are default no-ad and not primary ad inventory. |
| Consent vs page load | **Resolved.** Page load is not consent. Advertising eligibility must follow the future Consent State -> Advertising Eligibility -> Permitted Advertising Mode chain. |
| Account deletion vs commercial records | **Compatible with an explicit future gate.** Future commercial records must be classified and added to the privacy lifecycle contract before implementation; no retention exception is implied. |
| Product Analytics vs Advertising Targeting | **Resolved.** They are separate systems and purposes; analytics must not become an ad-tech export backdoor. |

Audit conclusion:

```text
No product contradiction blocks the V1 boundary freeze.
Second-layer commercial questions remain explicitly OPEN and block the next
architecture freeze until the product owner resolves them.
```

## 21. Open product decisions — must be resolved before architecture freeze

The following questions are intentionally preserved as:

```text
OPEN PRODUCT DECISIONS — MUST BE RESOLVED BEFORE ARCHITECTURE FREEZE
```

No implementation may silently answer them:

1. Exact cancellation effective-date behavior.
2. Payment-failure grace-period duration.
3. Payment retry and recovery semantics.
4. Exact refund effect on already-used paid entitlement.
5. Chargeback effect on entitlement.
6. Refund effect on a matured referral reward.
7. Whether a later refund after the 14-day maturation period can revoke
   already-applied referral Pro days.
8. Ordering between paid subscription time and referral-granted Pro time.
9. Whether referral-earned Pro time runs immediately or extends a paid period.
10. What happens when annual paid Pro overlaps referral reward days.
11. Administrator-granted Pro entitlement.
12. Promotional or otherwise granted entitlement.
13. Customer-support corrections to payment, entitlement, attribution, or
    reward state.
14. Exact historical Pro-generated-content persistence scope, including which
    generated artifacts remain viewable after downgrade or account events.
15. Exact commercial price points.
16. Regional pricing.
17. Tax handling.
18. Payment provider.
19. Advertising provider.
20. Consent-management provider.
21. Exact advertising-slot inventory.
22. Exact advertising-launch geography.
23. Commercial-record retention, export, deletion, backup, and accounting
    treatment where those decisions are not already covered by an approved
    successor privacy contract.

These questions do not weaken the already frozen principles: Free accuracy,
account-level entitlement, data-preserving downgrade, non-cash referral value,
the 14-day maturation rule, the rolling 12-month reward cap, the
PushSubscription/entitlement separation, and the advertising/privacy
firewalls.

## 22. External, legal, and provider gates

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

## 23. Explicit implementation non-goals

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

Future architecture must be issued as a separate bounded task after the open
product decisions above are explicitly resolved.

## 24. Source review and evidence basis

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

## 25. Freeze conclusion

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
Push capability vs entitlement   = SEPARATE
Open second-layer decisions       = PRESERVED; BLOCK ARCHITECTURE FREEZE
Implementation                    = DEFERRED
```

The commercial product-policy boundary is frozen at this semantic level. The
next action is:

> **PRODUCT DISCUSSION — SUBSCRIPTION / ENTITLEMENT SECOND-LAYER RULES**

Do not begin implementation, schema design, migrations, billing integration,
or provider selection before that discussion resolves the open decisions.
