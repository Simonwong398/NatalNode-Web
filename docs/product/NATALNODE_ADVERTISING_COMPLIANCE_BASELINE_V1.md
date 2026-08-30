# NatalNode Advertising Compliance Baseline V1

| Field | Value |
| --- | --- |
| Status | **PRODUCT / ENGINEERING BASELINE FROZEN / ADVERTISING IMPLEMENTATION DEFERRED** |
| Task | `WEB-COMMERCIAL-001A` |
| Reviewed baseline | `172247dfb53675d19a4f23f6de3e34504c783840` (`feat: refine learn brand instrument`) |
| Decision date | 2026-08-30 |
| Scope | Advertising eligibility, publisher-review safety, privacy/consent boundaries, and ad-system firewalls |
| Companion policy | `docs/product/NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md` |
| Scientific/provider status | **PROVIDER DECISION DEFERRED** |

## 1. Purpose and authority

This document freezes the V1 advertising and advertising-review safety baseline
for NatalNode. It is intended to prevent later Subscription, Learn, Tools,
Privacy, Analytics, Account, Workspace, Chart, and Notification work from
creating incompatible commercial or data-flow behavior.

This is a product and engineering policy baseline. It is not:

- an advertising implementation;
- an advertising-provider or publisher-account selection;
- an AdSense approval or eligibility guarantee;
- a consent-management platform selection or consent implementation;
- legal advice or a final Privacy Policy/Terms document;
- an ad-slot design or inventory map; or
- authorization to add scripts, cookies, tracking, ad components, or
  advertising endpoints.

The current repository records advertising, analytics, and CMP runtime as
absent or deferred. This document freezes the boundary that a future
implementation must respect; it does not claim that NatalNode currently serves
ads or performs advertising tracking.

The fixed product boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
```

Advertising belongs to the Website/product layer, not the Engine. No
advertising behavior may move astronomy calculation, chart facts, provider
selection, or provenance decisions into the Website.

## 2. Decision vocabulary

Every statement in this document uses one of these categories:

| Category | Meaning |
| --- | --- |
| **CURRENT REPOSITORY FACT** | An observed baseline fact used for context. It is not a new product commitment and does not prove future behavior is live. |
| **FROZEN PRODUCT RULE** | A V1 product rule that future work must preserve. It is not evidence that advertising is live. |
| **FUTURE IMPLEMENTATION REQUIREMENT** | A constraint for a later implementation after provider, consent, privacy, and product approvals. It does not choose code or a vendor. |
| **OPEN PRODUCT DECISION** | An unresolved product question that must not receive a silent implementation default. |
| **EXTERNAL / LEGAL / PROVIDER GATE** | A condition controlled by law, regional requirements, an advertising/consent provider, publisher review, operations, or another external owner. |

## 3. Current advertising status

### CURRENT REPOSITORY FACT

The reviewed repository documentation establishes:

- no current advertising script, ad SDK, ad component, targeting integration,
  analytics integration, or CMP;
- no selected advertising provider or publisher identity;
- Learn and educational Tools as potential future ad-eligible surfaces;
- Calculate, Birth Input, Chart Workspace, Interpretation, Calculation
  Details, Vault, and Auth as approved ad-free core surfaces; and
- the prohibition on sending birth data, chart facts, or astrology
  interpretations directly to advertising platforms as targeting profiles.

The PRD also excludes popup ads, interstitials, rewarded video, and chart
overlay advertising from the launch direction. The Product Roadmap keeps
monetization and CMP/privacy readiness deferred.

### FROZEN PRODUCT RULE

NatalNode is not permitted to describe current advertising use, current
personalized ad targeting, or current CMP behavior unless those facts are
actually implemented and verified in the publication environment.

## 4. Advertising business model

### FROZEN PRODUCT RULE

NatalNode may monetize Free traffic using advertising only on approved,
surface-whitelisted inventory.

```text
FREE
    -> may receive advertisements on approved surfaces only

PRO
    -> Ad-Free product experience
```

The existence of an approved surface does not mean every Free page must carry
an advertisement. There is no global ad-injection entitlement and no promise
that a particular Free page will contain ads.

Ad-Free is part of the Pro entitlement defined by the companion commercial
policy. A future implementation must ensure that a Pro user does not receive
first-party advertising inventory or provider-delivered ads through an
eligible surface, subject to the exact provider/implementation boundary being
approved before launch.

### FUTURE IMPLEMENTATION REQUIREMENT

Advertising eligibility must be decided by the account/product boundary and
approved surface policy. It must not be inferred from a client flag, a browser
cookie, a PushSubscription, a referral event, an analytics event, or a page
load alone.

No exact ad-slot position, ad density, refresh schedule, or provider behavior
is frozen here.

## 5. Global advertising-review safety rule

### FROZEN PRODUCT RULE

No NatalNode feature may intentionally introduce:

- low-value advertising inventory;
- deceptive navigation;
- accidental-click risk;
- ad-linked incentives;
- premature ad tracking;
- sensitive-data leakage to ad systems;
- misleading content structure;
- ad-heavy pages whose primary purpose is displaying advertisements; or
- page design likely to undermine mainstream publisher-review eligibility.

Future implementation must preserve eligibility for mainstream
advertising-review systems. Google Publisher/AdSense review is the minimum
reference baseline unless a later product decision supersedes it.

This is a system-wide product constraint, not an Ads-page-only rule. It applies
to Learn, Tools, Calculate, Chart Result, Workspace, Vault, Auth, Account,
Referral, Billing, and any future page that could expose advertising or
advertising-related navigation.

This baseline is intended to reduce foreseeable publisher-review and trust
risk. It does not state that NatalNode is legally compliant, that a provider
will approve the site, or that approval is guaranteed.

## 6. Approved advertising surface direction

### FROZEN PRODUCT RULE

Prefer future advertising on public, editorial, or educational inventory such
as:

- a Learn landing page when it contains sufficient publisher content;
- substantive Learn articles;
- high-quality public astrology educational pages; and
- public Tools or future public micro-tools only when accompanied by
  sufficient original publisher value.

The phrase “sufficient publisher content/value” is a quality gate, not an
arbitrary article-count threshold. No minimum article count is frozen by this
document.

### FUTURE IMPLEMENTATION REQUIREMENT

Each eligible route must be reviewed as a complete page experience before
advertising is enabled. A route is not eligible merely because it is public,
indexable, or technically capable of rendering an ad.

No advertising surface is approved automatically by a shared layout, global
script, or route wildcard.

## 7. Default no-ad surfaces

### FROZEN PRODUCT RULE

The following V1 surfaces are default no-ad surfaces for Free and Pro users:

- Login;
- Sign-up;
- Account;
- Subscription;
- Checkout;
- Billing management;
- Vault;
- Workspace;
- Notification settings;
- Privacy;
- Terms;
- Error pages;
- empty-state-only pages;
- confirmation and success pages;
- natal birth-data input forms;
- personalized Natal Chart Result pages;
- Personal Transits;
- highly personalized astrology output; and
- pages exposing private account or personal data.

The following core surfaces are also frozen ad-free by the existing visual and
product system:

- Calculate primary task area;
- Chart Workspace and chart instrument;
- Interpretation; and
- Calculation Details/provenance.

The list may become more restrictive later. It must not become less
restrictive without explicit product review.

### FUTURE IMPLEMENTATION REQUIREMENT

No ad may obscure, cover, shift, or visually compete with a private-data
surface, primary calculation interaction, chart instrument, trust notice,
consent control, or destructive/account action.

## 8. Public editorial and Tools quality boundary

### FROZEN PRODUCT RULE

Learn is simultaneously:

- an educational product surface;
- an SEO surface;
- a brand-trust surface; and
- a potential future advertising inventory surface.

Learn must preserve:

- original editorial value;
- substantive and useful content;
- clear authorship/editorial ownership where later appropriate;
- meaningful human product/editorial review;
- coherent navigation;
- non-duplicative article value; and
- a people-first reading experience.

NatalNode must not become a bulk low-value AI-content farm. AI may assist
editorial production, but quantity must not override publisher value. No ad
inventory may be used to justify mass content generation or thin pages.

Public Tools may be considered for advertising only when the page supplies
original educational/publisher value beyond a thin interaction wrapper. The
primary tool interaction remains the product responsibility and must not be
made subordinate to an advertisement.

### FUTURE IMPLEMENTATION REQUIREMENT

Advertising review must evaluate content quality, authorship, navigation,
originality, and user value before route-level eligibility is enabled. Do not
use advertising as a reason to alter Learn copy, fabricate articles, add
keyword filler, or introduce a content-count badge.

## 9. Advertising and user interaction separation

### FROZEN PRODUCT RULE

Future advertisements must be meaningfully separated from:

- Calculate;
- Save;
- Delete;
- Export;
- Subscribe;
- Checkout;
- Share;
- Next;
- navigation controls;
- chart interaction controls; and
- consent controls.

Advertisements must not:

- cover content;
- obscure navigation;
- imitate NatalNode controls;
- resemble system alerts;
- create accidental-click traps; or
- make a user mistake an advertisement for a product action.

No visual ad slot, ad label, or placement geometry is designed by this task.

### FUTURE IMPLEMENTATION REQUIREMENT

The route owner must retain semantic and visual ownership of product actions.
Ad rendering must fail safely when it cannot preserve separation, rather than
compressing or overlaying core UI to force inventory into a page.

## 10. Personalized and generated astrology content

### FROZEN PRODUCT RULE

NatalNode must not depend on personalized or algorithmically generated Natal
Chart, Transit Result, or similarly private output pages as primary advertising
inventory.

Those experiences are monetized primarily through Pro entitlement and product
value. Public editorial traffic, not private personalized computation output,
is the primary direction for future advertising revenue.

The following remain default no-ad and must not be used as primary ad inventory:

- personalized Natal Chart Result;
- Personal Transits;
- highly personalized astrology output; and
- pages exposing private chart, account, or workflow data.

### FUTURE IMPLEMENTATION REQUIREMENT

The ad system must not use a private chart result, generated interpretation,
transit configuration, or account workflow as an advertising placement context
or targeting profile. Contextual public content may describe broad editorial
topics such as astrology education without disclosing private chart data.

## 11. Referral and advertising firewall

### FROZEN PRODUCT RULE

Referral rewards must never depend on:

- ad clicks;
- ad impressions;
- ad refreshes;
- watching advertisements;
- viewing more advertisements; or
- sharing an advertisement.

Advertising engagement must never generate:

- Pro time;
- referral credit;
- purchase discounts;
- points;
- Vault capacity; or
- feature unlocks.

Referral conversion depends on legitimate qualifying Pro purchase behavior as
defined by the companion commercial policy, not advertising engagement.

The separation is bidirectional: referral conversion and reward state must not
be used to create artificial ad engagement, and ad engagement must not alter
referral or entitlement state.

## 12. Sensitive data and advertising-system firewall

### FROZEN PRODUCT RULE

The following data must not be intentionally sent to advertising systems for
targeting or ad personalization:

- birth date;
- birth time;
- birth location;
- exact birth coordinates;
- natal placements;
- aspect data associated with an identifiable account;
- chart IDs where they identify private user charts;
- Vault contents;
- transit configurations;
- personalized interpretation text;
- account email;
- private notification preferences; and
- private astrology workflow history.

NatalNode must not create identifiable/private ad-targeting segments such as:

```text
sun_sign=...
moon_sign=...
birth_location=...
specific_transit=...
```

The prohibition covers direct payloads, derived audience attributes,
advertising identifiers, event forwarding, server-to-server enrichment, and
equivalent re-identification paths. It is not defeated by hashing, renaming,
aggregating, or placing the data in a generic analytics event.

### FUTURE IMPLEMENTATION REQUIREMENT

Any future public contextual advertising must be reviewed to ensure that the
context is broad publisher context, such as “astrology education,” and does
not carry private personal-chart data or an identifiable account link.

Ad systems must receive only the minimum data required for the approved
non-sensitive advertising mode. No provider SDK may be added before this
boundary, the consent decision, and the provider contract are reviewed.

## 13. Consent state and advertising eligibility

### FROZEN PRODUCT RULE

Future advertising architecture must follow this order:

```text
Consent State
    -> Advertising Eligibility
    -> Permitted Advertising Mode
```

Advertising code must not assume that page load equals consent. Consent state,
regional requirements, and the permitted mode must be resolved before any
non-essential advertising or targeting behavior is enabled.

Future regional behavior must be able to represent, where legally or provider
policy requires:

- consent management;
- personalized versus non-personalized advertising;
- restricted data processing or an equivalent mode; and
- no-ad/no-tracking behavior where required.

The exact fallback behavior when consent is absent or denied is intentionally
not selected here; it depends on law, geography, provider capability, and the
later consent decision.

### FUTURE IMPLEMENTATION REQUIREMENT

The entitlement system and consent system are separate authorities:

- Pro Ad-Free status does not equal consent to tracking;
- consent does not grant Pro entitlement;
- a Free user with a PushSubscription has not consented to advertising; and
- a referral conversion does not imply advertising consent.

No CMP, consent cookie, tracking pixel, ad SDK, or advertising script is added
by this baseline.

## 14. Privacy disclosure timing

### FROZEN PRODUCT RULE

NatalNode's Privacy Policy must accurately disclose advertising-related
collection and use before advertising is enabled in production.

Advertising policy language must match the actual deployed behavior, region,
provider, consent mode, and data flow at integration time.

Until that integration occurs, existing privacy documentation must not be
rewritten to claim that NatalNode currently uses advertising technology when it
does not.

### EXTERNAL / LEGAL / PROVIDER GATE

The final public Privacy Policy, Terms, consent notices, processor disclosures,
and regional language require legal/privacy review against the actual deployed
configuration. This product baseline does not provide legal wording.

## 15. Ads.txt and site-authorization requirements

### FUTURE IMPLEMENTATION REQUIREMENT

When advertising is actually enabled, launch readiness must include, where
applicable:

- publisher/site verification;
- a correct authorized-seller declaration;
- `ads.txt` or equivalent authorization file;
- production-domain verification;
- publisher-account configuration;
- consent readiness;
- policy-ready Privacy disclosure;
- approved ad-surface inventory; and
- invalid-traffic operational monitoring.

### OPEN PRODUCT DECISION

No advertising provider, publisher identity, authorized seller, exact
`ads.txt` contents, or production advertising domain is selected here.
Therefore no `ads.txt` file is created now.

## 16. Invalid-traffic boundary

### FROZEN PRODUCT RULE

Future implementation must not:

- programmatically generate ad impressions for revenue;
- encourage ad clicks;
- reward ad interaction;
- repeatedly auto-refresh inventory outside permitted provider policy;
- create hidden ad placements;
- simulate user activity; or
- incentivize users to interact with advertisements.

Product Analytics must remain conceptually separate from artificial ad
engagement generation. NatalNode must not create a metric or reward loop whose
purpose is to manufacture advertising activity.

### FUTURE IMPLEMENTATION REQUIREMENT

Provider-approved traffic controls, monitoring, and incident handling must be
defined before launch. No local script or test may generate artificial ad
traffic.

## 17. Product Analytics and advertising separation

### FROZEN PRODUCT RULE

```text
Product Analytics != Advertising Targeting
```

Future Product Analytics may measure legitimate product behavior under its own
privacy, retention, access, and consent decision. It must not become a backdoor
for exporting sensitive natal or user data into advertising systems.

No future implementation may automatically forward arbitrary Product Analytics
event payloads into ad-tech. Events containing birth data, chart facts,
personalized interpretation, account identity, private notification state,
referral reward state, or Vault/workflow history are prohibited from ad-targeting
use under this baseline.

The existing observability contract is narrower than analytics and advertising
and remains separate. No analytics provider is selected or enabled here.

## 18. Account deletion, retention, and external data boundaries

### FROZEN PRODUCT RULE

Advertising data flows must not weaken the existing account-deletion and
retention boundaries:

- account-owned product data remains governed by the account-erasure contract;
- commercial and advertising consent records must be classified before they
  are persisted;
- external advertising-provider records are not treated as part of the active
  PostgreSQL deletion transaction without an approved provider-specific
  contract;
- no ad identifier or targeting profile may be retained merely because it is
  convenient for future marketing; and
- a browser-held or provider-held copy must not be described as erased without
  verified evidence and an approved policy.

### FUTURE IMPLEMENTATION REQUIREMENT

Before enabling advertising, the responsible policy and privacy documents must
define the minimum data inventory, purpose, access, retention, export,
deletion, backup, regional, and processor treatment for:

- consent state;
- advertising eligibility decisions;
- non-personalized or personalized ad requests, if allowed;
- provider identifiers;
- publisher reports; and
- operational invalid-traffic evidence.

The account/data-erasure contract, retention policy, and privacy-access-audit
contract must be updated where the actual advertising integration introduces
account-linked records or privileged access.

### OPEN PRODUCT DECISION

No advertising identifier retention duration, provider record deletion
semantics, backup treatment, or legal exception is selected here.

## 19. Advertising-specific consistency audit

The following compatibility audit was completed before freezing this baseline.
It resolves only product semantics; it does not choose providers, slots, or
schema.

| Boundary checked | Result and resolution |
| --- | --- |
| Free advertising vs Pro Ad-Free | **Resolved.** Free may receive ads only on an approved whitelist; Pro is Ad-Free. |
| Public Learn/Tools vs private personalized output | **Resolved.** Public editorial/educational pages may be considered; private personalized results are default no-ad and not primary inventory. |
| Advertising vs core interaction | **Resolved.** Ads cannot cover, imitate, or compete with calculation, chart, account, consent, or destructive controls. |
| Surface whitelist vs global injection | **Resolved.** Eligibility is route/surface-specific; no global ad injection is permitted. |
| Consent vs page load | **Resolved.** Page load is not consent; the future consent chain gates permitted advertising mode. |
| Referral vs advertising engagement | **Resolved.** Referral reward and ad engagement are hard-separated in both directions. |
| Analytics vs advertising targeting | **Resolved.** Product Analytics is a separate purpose and cannot forward arbitrary sensitive events to ad-tech. |
| Birth/chart data vs contextual advertising | **Resolved.** Broad public context may be used; identifiable birth/chart facts and derived profiles may not be used for targeting. |
| Privacy disclosure vs future ads | **Resolved.** Actual advertising use must be disclosed before production enablement; current docs must not claim ads are live prematurely. |
| Ads.txt/provider identity vs current deferred state | **Resolved.** Launch authorization is future-gated; no provider, publisher identity, or `ads.txt` is created now. |
| Publisher quality vs monetization pressure | **Resolved.** Original, substantive, human-reviewed content is required; ad revenue cannot justify thin or mass-generated inventory. |
| Account deletion/retention vs provider copies | **Compatible with an explicit future gate.** External copies require their own verified provider, legal, retention, and deletion treatment; no unsupported erasure claim is made. |

Audit conclusion:

```text
No advertising-policy contradiction blocks this V1 baseline.
Provider, consent, geography, exact inventory, and legal/operations questions
remain OPEN or EXTERNAL and block advertising implementation.
```

## 20. Open advertising and commercial decisions

### OPEN PRODUCT DECISIONS — MUST BE RESOLVED BEFORE ARCHITECTURE FREEZE

The following questions remain open and are not silently answered:

- advertising provider;
- consent-management provider;
- exact ad-slot inventory and route-by-route placement;
- exact ad-launch geography and regional availability;
- personalized versus non-personalized mode by region;
- no-consent/no-tracking fallback behavior;
- provider identifiers and retention treatment;
- provider-side deletion and account-erasure interaction;
- publisher identity and authorized-seller configuration;
- operational invalid-traffic monitoring owner;
- exact content-quality review gate for each public route; and
- any commercial reporting, support, refund, or dispute interaction involving
  advertising data.

The companion Subscription/Entitlement/Referral policy additionally preserves
the second-layer questions about cancellation, payment failure, refunds,
chargebacks, paid time, referral time, grants, promotions, commercial prices,
tax, and commercial-record retention.

## 21. Legal, provider, and operational gates

### EXTERNAL / LEGAL / PROVIDER GATE

Final advertising readiness depends on:

- applicable law and production geography;
- the selected advertising provider's current policies and technical modes;
- the selected CMP/consent solution and its current behavior;
- the actual production-domain and publisher configuration;
- privacy and Terms review;
- publisher/site verification;
- approved inventory and content quality;
- invalid-traffic monitoring and operational response; and
- any processor, backup, access, and deletion obligations.

This baseline preserves eligibility and reduces foreseeable publisher-review
risk. It does not state that NatalNode is legally compliant, does not guarantee
Google Publisher/AdSense approval, and does not guarantee approval by any
other advertising system.

## 22. Explicit implementation non-goals

This task authorizes none of the following:

- advertising scripts, ad components, provider SDKs, or ad endpoints;
- Google AdSense or any other provider integration;
- a CMP, consent banner, consent cookie, tracking pixel, or analytics SDK;
- ad-slot CSS, route placement, refresh logic, or ad density configuration;
- an `ads.txt` file or publisher-account configuration;
- referral rewards tied to advertising engagement;
- targeting segments or chart-derived audience profiles;
- changes to Learn copy, article data, SEO content, Tools, Calculate,
  Workspace, Vault, Auth, Notification, Account, or Chart surfaces;
- changes to the EngineClient, ChartRequest, ChartResult, astronomy logic, or
  provider boundary;
- database tables, migrations, billing code, checkout, webhooks, or
  entitlement evaluator code; or
- Language / Localization work.

Future implementation must be separately authorized after the open commercial,
privacy, consent, provider, geography, and operations decisions are resolved.

## 23. Source review and evidence basis

This baseline was reviewed against:

- `docs/PRD.md`, especially the product tiers, privacy boundary, API/BFF
  responsibility, Ads section, Pro section, feature flags, release gates, P1
  sequencing, and prohibition on Rewarded Ads/Header Bidding in v1;
- `docs/ARCHITECTURE.md` for the fixed Website/BFF -> Engine Public API
  boundary and scoped implementation governance;
- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md` for current absence of
  advertising/analytics/CMP runtime, approved core ad-free surfaces, Learn and
  Tools future eligibility, sensitive birth/chart prohibition, disclosure
  limits, and unresolved legal/privacy decisions;
- `docs/product/NATALNODE_PRODUCT_ROADMAP_V1.md` for deferred monetization,
  editorial quality, and CMP/privacy readiness;
- `docs/design/NATALNODE_VISUAL_SYSTEM_V1.md` for content-first Learn/Tools
  behavior, ad-free chart/core surfaces, interaction separation, accessibility,
  and performance boundaries;
- `docs/product/NATALNODE_NOTIFICATION_PLATFORM_V1.md` for the separation of
  notification capability from entitlement, the closed notification
  foundation, account deletion, retention, and billing/trigger separation;
- `docs/product/NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md` and
  `docs/product/NATALNODE_ACCOUNT_DATA_EXPORT_V1.md` for account ownership,
  active-database erasure, export, processor, and external-copy boundaries;
- `docs/product/NATALNODE_DATA_RETENTION_V1.md` for technical expiry versus
  retention, external processor treatment, backup boundaries, and
  policy-required lifecycle values; and
- `docs/product/NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md` and
  `docs/product/NATALNODE_OBSERVABILITY_V1.md` for the separation of
  privileged access audit and privacy-minimized operational telemetry from
  future advertising targeting.

No runtime source, test, migration, manifest, lockfile, package, provider,
consent system, or `C:\NatalNode` path is modified by this baseline.

## 24. Freeze conclusion

```text
Free advertising                  = APPROVED SURFACES ONLY / NOT GUARANTEED
Pro advertising                   = AD-FREE
Ad injection                      = SURFACE-WHITELISTED, NEVER GLOBAL
Default no-ad core                = ACCOUNT / AUTH / CALCULATE / CHART / VAULT / PRIVATE DATA
Primary future inventory          = PUBLIC, SUBSTANTIVE LEARN / EDUCATIONAL TOOLS
Personalized result inventory     = NOT PRIMARY ADS / DEFAULT NO-AD
Ad review safety                  = SYSTEM-WIDE FROZEN CONSTRAINT
Referral ↔ advertising            = HARD FIREWALL
Birth/chart data → ad targeting   = PROHIBITED
Consent chain                     = CONSENT -> ELIGIBILITY -> PERMITTED MODE
Privacy disclosure                = BEFORE PRODUCTION AD ENABLEMENT
Ads.txt/site authorization        = FUTURE LAUNCH GATE, NOT CREATED NOW
Invalid traffic                   = PROHIBITED
Product Analytics                 = SEPARATE FROM ADVERTISING TARGETING
Provider/CMP/geography/slots      = OPEN / EXTERNAL GATES
Advertising runtime               = DEFERRED
```

The Advertising Compliance Baseline V1 is frozen as a product/engineering
boundary. It is not a legal-compliance conclusion or an advertising-provider
approval. The next action is:

> **PRODUCT DISCUSSION — SUBSCRIPTION / ENTITLEMENT SECOND-LAYER RULES**

Do not begin advertising, consent, analytics, billing, referral, or
Subscription/Entitlement implementation before the required product and
external decisions are explicitly approved.
