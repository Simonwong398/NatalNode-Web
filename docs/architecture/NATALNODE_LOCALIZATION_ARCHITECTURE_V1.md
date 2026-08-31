# NatalNode Localization Architecture V1

| Field | Value |
|---|---|
| Status | **V1 ARCHITECTURE FREEZE / IMPLEMENTATION DEFERRED** |
| Task | `WEB-LOCALIZATION-001B` |
| Reviewed baseline | `78bf58ae25aba1cd97d28c2c6132f457573c1baa` (`docs: freeze localization product policy`) |
| Product-policy authority | `docs/product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md` |
| Product source of truth | `docs/PRD.md` |
| Date | 2026-08-31 |
| Scope | Web locale registry, page routing, SSR resolution, resource planes, professional-content resolution, and future implementation boundaries |
| Provider status | **PROVIDER DECISION DEFERRED** |
| Implementation status | **DEFERRED**; this document creates no runtime localization infrastructure |

This document freezes the V1 Web localization architecture that future
implementation must follow. It translates the frozen localization product
policy into semantic boundaries and resolution rules without selecting a
framework, creating locale catalogs, designing a database schema, or
implementing runtime behavior.

The upstream product-policy document remains authoritative for product
meaning. If this document appears to conflict with
`docs/product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`, the product
policy wins and implementation must stop for contract review. This document
must not silently complete a deferred product, SEO, editorial, storage, or
professional-review decision.

The fixed system boundary remains:

```text
NatalNode.com
    → Website API / BFF
    → NatalNode Engine Public API
```

Localization is a Web presentation and approved-content concern. It must not
become an astronomy provider boundary, an alternative scientific authority,
or an unrestricted content translation service.

The architectural outcome of this freeze is:

```text
locale-aware user-visible page routes
+ non-localized machine/API/infrastructure routes
+ URL-authoritative SSR locale resolution
+ three separate localization resource planes
+ stable language-neutral domain/content identities
+ repository-backed V1 resources
+ approved/current professional-content fallback to English
+ runtime implementation deferred
```

## 1. Authority, scope, and non-goals

### 1.1 Frozen policy authority

`docs/product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md` freezes:

- exactly seven V1 product locales and their display order;
- English as default, canonical source, and canonical fallback;
- first-visit browser-locale normalization;
- explicit user preference precedence;
- the separation between UI language and astronomical input;
- Class A General UI, Class B Professional Astrology Terminology, and Class C
  Interpretation/Editorial Knowledge;
- controlled glossary and language-neutral semantic identity requirements;
- professional approval, currentness, and English-fallback requirements;
- progressive professional-content availability;
- Learn and Tools content classification;
- epistemic-status and science/astrology trust boundaries; and
- V1 non-goals and deferred product decisions.

This architecture document preserves those rules. It does not redefine the
supported locale set or the content-policy classes.

### 1.2 In scope

This architecture freeze defines:

- the closed V1 locale registry and browser normalization boundary;
- explicit locale prefixes for all user-visible page routes;
- non-locale exceptions for machine, API, and infrastructure endpoints;
- root negotiation-entry behavior;
- URL-locale authority and language-switch behavior;
- two-context locale-resolution precedence;
- SSR-first resolution requirements;
- the conceptual locale-preference storage boundary;
- three separate resource planes for UI, glossary, and professional content;
- repository-backed V1 resource storage;
- semantic retrieval boundaries that do not expose raw file layout to consumers;
- UI key parity and professional-content availability capabilities;
- approved/current professional-content publication and fallback;
- chart identity, Engine, API/BFF, cache, and domain-state separation;
- private-page routing and bounded public SEO routing decisions;
- release validation, observability, accessibility, and closed-set security
  requirements; and
- a recommended later implementation sequence without executing it.

### 1.3 Explicit non-goals

This task does not authorize:

- runtime localization code;
- route files, middleware, redirects, or locale negotiation implementation;
- locale dictionaries, translation assets, or professional content assets;
- a translation-management system or CMS;
- an account preference schema, cookie definition, or migration;
- a glossary taxonomy or interpretation semantic-ID taxonomy;
- a professional reviewer workflow implementation;
- `hreflang`, canonical tags, sitemap, or multilingual SEO implementation;
- a translated-slug decision;
- API contract changes;
- changes to `ChartRequest`, `ChartResult`, `EngineClient`, or the BFF;
- astronomy calculations, timezone calculations, place resolution, or provider
  selection;
- package dependencies or configuration changes; or
- access to or modification of `C:\NatalNode`.

The only artifact authorized by `WEB-LOCALIZATION-001B` is this architecture
contract document.

## 2. V1 locale registry

The V1 architecture supports exactly the product locales frozen by 001A:

| Product order | Display language | Canonical locale |
|---:|---|---|
| 1 | English | `en` |
| 2 | Español | `es` |
| 3 | Français | `fr` |
| 4 | Deutsch | `de` |
| 5 | 日本語 | `ja` |
| 6 | 한국어 | `ko` |
| 7 | 繁體中文 | `zh-Hant` |

The locale registry is a closed set. Future implementation MUST validate all
locale input against this allow-list before it reaches routing, resource
loading, persistence, templates, or presentation.

English remains:

- the default locale;
- the canonical source locale;
- the canonical fallback locale;
- the canonical terminology-definition locale; and
- the canonical professional-content source locale.

English is not modeled as an unprefixed special case and is not treated as a
translation peer for source-authority purposes.

The language selector MUST preserve the order in the table unless a later
explicit product decision changes it.

V1 MUST NOT add Portuguese, Simplified Chinese, Italian, Russian, or another
locale. A future language is a new product decision, not an implementation
fallback.

## 3. Browser-locale normalization

The architecture exposes one normalization boundary for browser locale
signals. It produces only one of the seven supported product locales:

| Browser locale pattern | Resolved product locale |
|---|---|
| `en-*` | `en` |
| `es-*` | `es` |
| `fr-*` | `fr` |
| `de-*` | `de` |
| `ja-*` | `ja` |
| `ko-*` | `ko` |
| `zh-TW` | `zh-Hant` |
| `zh-HK` | `zh-Hant` |
| `zh-MO` | `zh-Hant` |
| `zh-Hant-*` | `zh-Hant` |
| unsupported locale | `en` |

The normalization boundary MUST NOT map `zh-CN`, `zh-SG`, `zh-Hans-*`, or
another Simplified Chinese locale to `zh-Hant` as professional localization.
An unsupported Simplified Chinese browser environment falls back to English.

Browser normalization is a presentation signal only. It MUST NOT infer or
mutate:

- birth location;
- place-resolution semantics;
- latitude or longitude;
- timezone or historical timezone resolution;
- chart settings;
- scientific provenance;
- Engine input or output semantics; or
- commercial, account, Vault, notification, or entitlement identity.

The exact anonymous-versus-authenticated timing and precedence of browser
normalization is deferred to section 20, decision L.

## 4. Locale-aware page routing

### 4.1 Explicit prefix for every user-visible page

All user-visible Web page routes use an explicit locale prefix. This applies
to public pages and authenticated/private product pages.

Conceptual examples are:

```text
/en/
/es/learn/...
/fr/tools/...
/ja/calculate
/ko/workspace
/zh-Hant/vault
/en/chart/<stable-chart-id>
/ja/chart/<same-stable-chart-id>
```

English MUST use `/en/...` exactly like every other V1 locale. There is no
unprefixed duplicate English page route, and `/learn` MUST NOT be a hidden
English alias for `/en/learn`.

The locale prefix is a presentation and route-selection input. It is not a
domain identity, scientific input, or reason to duplicate persisted data.

### 4.2 Machine, API, and infrastructure exceptions

Machine and infrastructure endpoints MUST NOT be locale-prefixed merely for
presentation consistency. Conceptual examples include:

```text
/api/...
/health
/static/...
robots/sitemap infrastructure as appropriate
OAuth/provider callback endpoints
webhook endpoints
service-worker/static-resource endpoints where applicable
```

Exact framework-specific path names are not frozen here beyond existing
application reality. The governing distinction is:

```text
PAGE ROUTES                 = locale-aware
MACHINE/API/INFRASTRUCTURE  = not presentation-localized
```

Non-locale endpoints still require their own existing authentication,
authorization, security, caching, and content-type rules. Their exclusion
from locale prefixes does not make them public or bypass other boundaries.

### 4.3 Root negotiation entry

The bare root `/` is a locale-negotiation entry point. It MUST NOT host a
second English homepage or become an unprefixed page-route family.

For an anonymous first visit without an explicit page locale, the conceptual
resolution order is:

```text
explicit persisted user locale preference, if available
    → supported browser locale
    → en
    → redirect or navigate to the corresponding explicit locale route
```

For an authenticated user, an authoritative saved account preference MAY
participate as the persisted preference according to the preference boundary
in section 6.

The root redirect/navigate mechanism, status code, and caching behavior are
deferred implementation decisions. They MUST not be implemented by this
freeze.

### 4.4 Explicit URL locale authority

For an explicit valid locale page request, the URL locale controls the
presentation for that request:

```text
/ja/...      → render Japanese presentation
/en/...      → render English presentation
/zh-Hant/... → render Traditional Chinese presentation
```

A stored preference MUST NOT silently redirect `/ja/...` to `/en/...` merely
because the stored preference is English. This authority rule supports:

- shared links;
- intentional cross-language browsing;
- deterministic server rendering;
- reproducible debugging; and
- language-specific public links.

The current explicit URL wins over browser and stored preferences. A
preference may affect future negotiation-entry resolution, not the meaning of
the current explicit page URL.

### 4.5 Language-selector switching

When a user explicitly changes language through NatalNode, the future
implementation MUST perform both actions:

1. navigate to the equivalent route under the selected locale prefix; and
2. persist the selected locale as the user's future preference.

Conceptually:

```text
/en/chart/abc
    → select 日本語
/ja/chart/abc
```

The chart identity remains `abc`. Language switching changes presentation and
approved content selection only. It MUST NOT recalculate astronomy, create a
second chart, alter birth data, alter timezone, change Vault ownership, alter
commercial entitlement, or mutate notification eligibility.

### 4.6 Invalid or unsupported locale prefixes

An unsupported locale-like prefix MUST NOT be silently interpreted as an
arbitrary supported language. The architecture requires one deterministic
safe strategy, selected during implementation according to router context:

```text
invalid/unsupported explicit locale route
    → canonical locale negotiation or not-found behavior
    → never machine-translate into an unsupported locale
```

No unsupported alias becomes a V1 product language. The implementation must
also avoid turning untrusted URL input into a raw filesystem path, module
path, SQL identifier, or template path.

### 4.7 Private product routes

Authenticated/private user-facing pages use locale prefixes for the same
deterministic page-router model:

```text
/en/workspace
/ja/workspace
/en/vault
/ko/vault
/en/chart/abc
/fr/chart/abc
```

A private route does not become public or indexable merely because it has a
locale prefix. Authorization, authentication, robots behavior, and indexing
are separate concerns.

### 4.8 Public SEO route boundary

The architecture freezes only that public localized page routes use explicit
locale prefixes. It does not freeze:

- `hreflang` implementation;
- canonical-tag implementation;
- whether English-fallback professional content receives a localized
  indexable URL;
- localized sitemap behavior;
- indexing rules for partially localized Learn content; or
- translated metadata requirements.

These remain explicit SEO architecture follow-ups. No SEO behavior may be
inferred from the existence of a locale prefix.

### 4.9 Route identity and slugs

The locale prefix is sufficient for V1 language routing. Professionally
translated slugs are not required by this architecture.

Whether public article or Tool slugs remain canonical-language stable or
become locale-specific translated slugs is deferred. The architecture MUST
not silently select either behavior.

## 5. Locale-resolution contexts and SSR

### 5.1 Two separate contexts

Locale resolution MUST distinguish two contexts rather than merge all signals
into one ambiguous resolver chain.

**Context A — explicit locale URL request**

```text
URL locale
    → render that locale
```

Stored preference and browser locale do not override the current explicit
valid URL locale.

**Context B — locale-negotiation entry without an explicit page locale**

```text
explicit persisted user preference
    → supported browser locale
    → en
```

An authenticated account preference may supply the persisted preference once
the future synchronization contract is implemented.

### 5.2 SSR-first requirement

The locale MUST be resolved before server-rendered page content is produced.
For a locale-prefixed page, the URL is deterministic locale input to SSR.

V1 MUST NOT be architected around:

```text
render English
    → client JavaScript detects language
    → replace content after hydration
```

That approach creates localization flash, hydration mismatch risk, and
non-deterministic first render. Client-side enhancements MAY support later
navigation, but the initial page language and document metadata must already
be correct at SSR time.

### 5.3 Resolution result

The conceptual result of locale resolution should contain a supported locale
from the closed registry and enough context for presentation to know why it
was selected. The exact type and field names are deferred.

At minimum, future consumers must be able to distinguish:

- explicit URL locale;
- persisted explicit preference;
- normalized browser locale; and
- canonical English fallback.

This distinction must not be used to weaken URL authority or to expose
sensitive preference data in page output.

## 6. Locale preference boundary

### 6.1 Conceptual storage abstraction

Future implementation should define a stable preference boundary, such as:

```text
LocalePreferenceStore
```

The name is illustrative. The responsibility is to:

- read and write a supported explicit locale;
- distinguish explicit preference from transient browser detection;
- provide SSR-readable negotiation input; and
- support deterministic synchronization when account state exists.

Presentation and route consumers should depend on this semantic boundary, not
on a raw cookie name, browser storage API, or account table.

### 6.2 Anonymous users

Anonymous users require an SSR-readable first-party preference mechanism,
preferably a same-site cookie or an equivalent server-readable mechanism.

The preference MUST be available before SSR for future negotiation entries.
`localStorage` MUST NOT be the sole source because the server cannot reliably
consume it before rendering.

The exact cookie name, lifetime, security attributes, consent interaction,
serialization, and invalid-value behavior are deferred.

### 6.3 Authenticated users

When account preference persistence is implemented, an authenticated account
preference is the authoritative long-term preference for future
locale-negotiation entries. It is not authority over an explicit current URL
locale.

The account preference boundary MUST remain separate from:

- birth-data persistence;
- chart identity;
- scientific provenance;
- subscription or entitlement state;
- Vault ownership; and
- notification eligibility.

This task does not create an account column, API, migration, or persistence
adapter.

### 6.4 Synchronization principles

Future preference synchronization MUST preserve these rules:

- the explicit current URL controls the current rendered page;
- an explicit language-selector action updates the stored preference;
- an authenticated saved preference participates in future negotiation;
- an anonymous preference may survive ordinary navigation/session boundaries;
- login must not unexpectedly rewrite an explicitly requested locale page
  mid-request; and
- account/cookie conflict resolution is deterministic.

Detailed conflict resolution between anonymous cookie state and account state
is deferred to implementation design where the existing Auth architecture
requires it.

## 7. Three localization resource planes

V1 MUST maintain three separate resource planes:

```text
PLANE A: UI CATALOG
PLANE B: ASTROLOGY GLOSSARY
PLANE C: PROFESSIONAL CONTENT REGISTRY
```

The planes may share lower-level repository or loading infrastructure later,
but they MUST NOT be collapsed into one generic translation dictionary. A
single page may consume all three planes simultaneously.

The reason for separation is semantic governance:

| Plane | Governs | Must not become |
|---|---|---|
| A — UI Catalog | Ordinary interaction copy and accessibility copy | Professional terminology identity or interpretation authority |
| B — Astrology Glossary | Controlled professional terms and semantic concepts | A free-form UI dictionary or calculation input |
| C — Professional Content Registry | Approved editorial and interpretation variants | A generic sentence-translation map or scientific fact source |

The resource planes are presentation/content authorities only. They do not
own astronomy calculations, account ownership, entitlement mutation, or
provider selection.

## 8. Plane A — UI Catalog architecture

### 8.1 Repository-backed catalogs

General UI uses repository-backed static locale catalogs in V1. A conceptual
shape may resemble:

```text
locales/
  en/
  es/
  fr/
  de/
  ja/
  ko/
  zh-Hant/
```

This is conceptual only. The exact filesystem and package layout is deferred
and no catalog directory is created by this task.

### 8.2 Stable UI message keys

UI entries use stable language-neutral message keys. Conceptual examples are:

```text
navigation.calculate
account.signOut
subscription.manage
validation.required
```

Keys identify an ordinary UI message, not a domain object, professional
concept, scientific fact, or editorial interpretation. A localized message
string MUST NOT become the identity used by business logic.

Professional astrology interpretations MUST NOT be stored as ordinary UI
catalog entries merely because they appear in a component.

### 8.3 UI parity contract

Class A General UI requires seven-locale parity for V1 release. Future
implementation should provide:

- a canonical English UI catalog;
- locale-specific catalogs for all seven supported locales;
- required-key-set validation;
- deterministic English safety fallback; and
- development diagnostics for missing keys.

English runtime fallback is an operational safety mechanism. It is not
permission to intentionally ship incomplete V1 General UI dictionaries.

A release-time completeness gate for required UI keys is required by this
architecture, but the validator and its exact failure policy are not
implemented here.

## 9. Plane B — Controlled Astrology Glossary

### 9.1 Semantic concept identity

Professional astrology terminology uses a dedicated repository-backed glossary
registry. Every glossary concept has a stable language-neutral semantic
identity.

Conceptual examples are:

```text
aspect.opposition
aspect.square
house.angular
house.cadent
condition.domicile
condition.detriment
```

These examples illustrate the boundary and do not freeze an exhaustive
taxonomy. The actual taxonomy must be derived from product and domain needs
in a later scoped task.

A localized display term MUST never become the identity used by:

- calculation;
- persistence;
- routing;
- interpretation lookup;
- cache identity; or
- business logic.

### 9.2 Conceptual glossary record

Future architecture should support, conceptually:

```text
semanticConceptId
canonicalEnglishTerm
locale variants
approval state
canonical/version linkage where needed
professional/editorial notes where useful
```

Exact field names, schema, storage representation, and final identifier
taxonomy are deferred. The semantic requirements are frozen.

### 9.3 Glossary publication

A locale-specific professional terminology variant is publishable only when
it is both:

```text
APPROVED
and
semantically current under the canonical concept contract
```

Conceptual non-publishable conditions include `MISSING`, `DRAFT`, `REVIEW`,
and `OUTDATED`. These names illustrate states and do not freeze exact future
enum values.

When an approved/current localized term is unavailable, the resolver MUST
fall back directly to the canonical English term. It MUST NOT runtime-machine-
translate the term or select an unrelated locale.

## 10. Plane C — Professional Content Registry

### 10.1 Semantic-content-centered identity

Interpretation and professional editorial content use a semantic-content-
centered registry. The primary identity is the semantic content identity,
not a language file.

The architecture MUST NOT organize professional content primarily as:

```text
en.json
ja.json
fr.json
```

with translated sentences keyed only by language. Locale variants attach to a
stable canonical content identity.

Conceptual examples are:

```text
natal.aspect.sun.square.saturn
natal.planet.moon.house.4
transit.saturn.conjunct.natal.sun
```

The examples do not freeze the interpretation taxonomy.

### 10.2 Conceptual content record

Future architecture should support, conceptually:

```text
contentId
canonical English content/version
locale-specific variant
locale
content version
canonical version the locale variant was reviewed against
approval/publication state
content payload
optional editorial metadata
```

Exact field names and persistence are deferred. The registry must preserve
stable semantic identity, canonical linkage, locale, version, currentness,
approval, and bounded content payload semantics.

### 10.3 Strict professional publication

Only professional content that is:

```text
APPROVED
and
CURRENT relative to the canonical English content/version
```

may be shown as official localized professional content.

If a locale variant is missing, draft, under review, outdated, invalid, or
otherwise not current, it MUST NOT be shown as authoritative localized
content. The resolution path is:

```text
requested locale
    → approved/current locale variant
    → canonical English
```

There is no intermediate-language fallback.

### 10.4 Version drift

Architecture MUST make content-version drift observable. Conceptually:

```text
canonicalVersion = 5
localeVariantReviewedAgainst = 4
```

must be detectable and must make the locale variant operationally
non-publishable until it is reviewed against the current canonical version.
The resolver then returns canonical English.

Professional localization MUST NOT be modeled only as:

```text
translated = true
```

The future representation must distinguish at least the concepts of exists,
reviewed, approved, and current relative to canonical content.

## 11. Professional resolution and fallback boundaries

### 11.1 Semantic retrieval interfaces

Future consumers should use semantic retrieval boundaries similar to:

```text
UiCatalogResolver
AstrologyGlossaryRepository
ProfessionalContentRepository
ProfessionalContentResolver
ContentAvailabilityResolver
```

Names are illustrative. The architecture requires the responsibilities, not
these exact TypeScript names.

Presentation consumers MUST depend on semantic retrieval interfaces rather
than arbitrary JSON paths, raw filesystem layout, language-file naming, or
database details.

### 11.2 Availability before rendering

The architecture MUST support determining professional localization
availability before rendering an authoritative professional result. The UI
should not discover professional status only after an arbitrary string lookup
fails.

Conceptually, for locale `ja`, availability may be represented as:

```text
UI catalog:
    AVAILABLE

Glossary concept X:
    APPROVED_LOCALIZED
    or ENGLISH_FALLBACK

Interpretation family Y:
    APPROVED_LOCALIZED
    or ENGLISH_FALLBACK

Learn article Z:
    APPROVED_LOCALIZED
    or ENGLISH_ONLY
```

These labels are conceptual and do not freeze exact enum names. The
capability and its trust meaning are frozen.

### 11.3 Fallback provenance metadata

Professional resolution should return enough metadata for presentation to
distinguish:

- approved/current requested-locale content; and
- canonical English fallback content.

The result must not hide fallback provenance. This enables controlled
disclosure such as an indication that an interpretation is currently
available in English. Exact copy is deferred to future UX work.

### 11.4 UI fallback versus professional fallback

The architecture keeps two mechanisms separate:

| Fallback | Meaning | Governing condition |
|---|---|---|
| UI catalog fallback | Operational safety for missing ordinary UI keys | Catalog/key availability and safe rendering |
| Professional fallback | Editorial trust decision | Locale variant is approved and current relative to canonical English |

Professional resolution MUST NOT be reduced to an unannotated expression such
as:

```text
translation[key] ?? english[key]
```

without preserving approval, version, currentness, semantic identity, and
fallback provenance.

### 11.5 No runtime professional machine translation

No runtime AI, LLM, generic machine translation, browser translation, or
third-party automatic translation service may fill missing:

- glossary terms;
- interpretations;
- Learn content; or
- expert astrology editorial content.

The fallback resolver goes to canonical English. The architecture MUST NOT
add a translation-provider interface for professional fallback.

## 12. Repository-backed V1 storage and future compatibility

### 12.1 V1 storage decision

For V1, the three resource planes are repository-backed:

```text
UI catalogs                       = repository-backed
Astrology glossary                = repository-backed
Professional content registry     = repository-backed
```

Repository-backed content is selected for:

- Git diffability;
- reviewability;
- rollback;
- deterministic deployment;
- semantic-content governance; and
- reduced accidental editorial mutation.

V1 does not require a CMS or database for localization resources. No CMS or
database is introduced by this task.

### 12.2 Storage abstraction

Even with repository-backed V1 storage, consumers MUST NOT be coupled to raw
filesystem layout. Semantic retrieval boundaries allow a future storage
change without changing presentation-facing meaning.

Repository/service abstractions MAY later be implemented for the UI catalog,
glossary, professional content, and availability resolution. This document
does not freeze their package location, API shape, serialization, or loading
strategy.

### 12.3 Future CMS or database compatibility

Future storage MAY move to a CMS, database, or remote editorial platform
without changing:

- semantic concept IDs;
- semantic content IDs;
- canonical-version linkage;
- approval/currentness rules;
- fallback behavior; or
- presentation-facing semantic contracts.

Storage migration is a future architecture and persistence task. It is not a
V1 requirement and must not be implemented as part of localization foundation
work.

## 13. Learn and Tools architecture

### 13.1 Learn

Learn belongs to the Professional Content Registry/editorial plane, Class C.
A Learn article may have:

- stable semantic/article identity;
- canonical English version; and
- approved locale adaptations.

Learn MUST NOT be bulk-machine-translated to create multilingual SEO
inventory. Complete seven-language Learn parity is not required at launch.

If an approved localized article does not exist, future content/SEO behavior
may use English fallback or omit a localized article route according to a
later explicit decision. The architecture does not select that route policy.

### 13.2 Tools

A single Tool page may consume all three planes:

```text
Class A: localized ordinary interface
Class B: approved localized glossary terms
Class C: approved professional interpretation/editorial content
```

The resource and governance boundaries MUST remain separate even when the
page renders them together. Tool UI must not turn professional content into a
Class A message or use a localized term as a domain identity.

## 14. Chart, Engine, API, cache, and domain-state boundaries

### 14.1 Chart identity is locale-independent

A chart has one stable domain identity independent of language:

```text
/en/chart/abc
/ja/chart/abc
/zh-Hant/chart/abc
```

all refer to:

```text
chart identity = abc
```

Locale switching MUST NOT duplicate chart persistence, generate a locale-
specific chart ID, alter saved birth data, or create a second chart.

### 14.2 Engine calculation is locale-independent

Locale MUST NOT become an astronomy-calculation input merely because
localization exists. The calculation request identity and astronomical result
semantics are locale-independent.

Future implementation MUST NOT alter, solely because of UI locale:

- EngineClient scientific input;
- birth location semantics;
- timezone semantics;
- place-resolution semantics;
- chart calculation semantics;
- house, aspect, or celestial calculation semantics; or
- scientific provenance.

The fixed provider-neutral boundary remains:

```text
NatalNode.com
    → Website API / BFF
    → NatalNode Engine Public API
```

No locale-aware provider selection or astronomy implementation is permitted.

### 14.3 Cache boundaries

The architecture distinguishes cache classes:

| Cache class | Locale rule |
|---|---|
| Scientific/domain computation cache | MUST NOT vary merely because UI locale changed |
| Presentation/localized-render cache | MAY include locale in its key |
| Professional content-resolution cache | Must account for semantic content identity, locale, canonical/current version, and approval state as appropriate |

Concrete cache infrastructure, key encoding, invalidation, and TTL policy are
deferred. Locale must not be smuggled into scientific identity as a shortcut
for localized presentation.

### 14.4 API/BFF semantic boundary

Domain and API layers MUST expose stable semantic identities, calculated
values, provenance, and epistemic status rather than localized display strings
as core identities.

Ordinary user-facing API error copy MAY later use locale-aware presentation
handling, but the underlying error identity remains stable. Localization
must not change API routing, persistence identity, business rules, or
commercial authorization.

### 14.5 Locale switching and domain state

Switching locale MUST NOT:

- recalculate chart astronomy;
- create a second chart;
- alter saved birth data;
- alter timezone;
- alter commercial entitlement;
- alter Vault ownership;
- alter notification eligibility;
- mutate scientific provenance; or
- change semantic interpretation identity.

Only presentation and approved-content selection changes.

## 15. Epistemic status and trust boundaries

### 15.1 Stable epistemic status identities

The architecture preserves stable semantic identities for:

```text
CALCULATED
DERIVED
INTERPRETED
UNKNOWN
RESEARCH
```

Display labels may be localized, but the underlying status identity MUST NOT
change. Professional localization MUST NOT alter the epistemic category.

A localized interpretation remains `INTERPRETED`; a translated label must not
make it appear to be a calculated scientific fact.

### 15.2 Science/astrology boundary

Localization architecture preserves the trust principle:

```text
astronomical accuracy does not scientifically validate astrological interpretation
```

A localized editorial variant MUST NOT strengthen the epistemic claim relative
to canonical English. Future approval review must include semantic and
epistemic fidelity.

Localization is not a scientific provenance source and does not authorize
stronger claims such as production validation, commercial clearance, or
highest accuracy when those claims are absent from the canonical source.

## 16. Release validation, observability, accessibility, and security

### 16.1 Future release validation

Future Class A release validation should verify:

- the canonical UI key set;
- required-key coverage in all seven locale catalogs;
- absence of invalid locale identifiers; and
- no accidental professional content in the ordinary UI catalog where
  detectable.

Future glossary validation should verify:

- stable semantic IDs;
- a canonical English term;
- no duplicate concept IDs;
- valid locale IDs; and
- approval/currentness metadata consistency.

Future professional-content validation should verify:

- stable content IDs;
- a canonical English source and version;
- valid locale variants;
- approval/currentness relationship;
- deterministic fallback; and
- no unsupported locale identities.

These are architectural requirements for later validation. No validator,
test framework, CI gate, or release tooling is implemented in 001B.

### 16.2 Bounded observability

Future implementation should make localization fallback observable without
logging sensitive chart, birth, private interpretation, or content payload
data. Useful bounded metadata may include:

- requested locale;
- resolved locale;
- professional fallback occurrence; and
- missing or invalid content-identity counts.

The architecture MUST NOT log:

- birth data;
- private interpretation text;
- chart-sensitive content payloads; or
- other private user content merely to explain localization behavior.

Telemetry implementation is deferred.

### 16.3 Accessibility

Locale routing and rendering must support correct document-language metadata
for the active locale. Future implementation should provide:

- the correct `lang` attribute;
- localized accessible names and screen-reader-visible UI; and
- directionality support if a future locale requires it.

All V1 locales are left-to-right. The architecture does not require
speculative RTL implementation, but future designs should not make a later
directionality decision impossible.

### 16.4 Closed-set security

Locale values from URLs, browser signals, cookies, and account preferences are
presentation inputs. They MUST be validated against the seven supported
locales before use.

Untrusted locale input MUST NOT become an unrestricted:

- filesystem path;
- dynamic module path;
- SQL identifier;
- template path; or
- remote resource selector.

Allow-list resolution is required. A locale prefix is not permission to load
arbitrary files or modules.

## 17. Architectural module boundaries

Future implementation should use cohesive semantic boundaries similar to the
following:

| Conceptual boundary | Responsibility | Must not own |
|---|---|---|
| `LocaleRegistry` | Closed supported-locale set, order, and browser normalization rules | Account persistence, astronomy, arbitrary aliases |
| `LocaleResolver` | URL-authoritative or negotiation-entry resolution before SSR | Translation text, chart facts, provider choice |
| `LocalePreference` / `LocalePreferenceStore` | Explicit preference semantics and future persistence boundary | Browser-only detection authority, birth data, entitlement |
| `UiCatalog` / `UiCatalogResolver` | General UI message retrieval and Class A safety fallback | Professional approval, domain identity, interpretation authority |
| `AstrologyGlossary` / glossary repository | Controlled Class B concept and locale-term retrieval | Free-form MT, calculation logic, localized string identity |
| `ProfessionalContentRegistry` | Canonical content, locale variants, versions, approval/currentness | Scientific facts, generic UI keys, raw unrestricted text dispatch |
| `ProfessionalContentResolver` | Approved/current locale resolution and English fallback | Cross-locale fallback, runtime MT, commercial mutation |
| `ContentAvailability` / `ContentAvailabilityResolver` | Pre-render availability and fallback-provenance status | Publishing approval decisions, arbitrary content fabrication |
| `LocalizedPresentation` | Combines resolved locale and approved resource results for rendering | Chart identity, Engine input, account authority |

Exact implementation names and package locations are not frozen. The
responsibility boundaries and prohibited couplings are frozen.

## 18. Prohibited couplings

Future implementation MUST explicitly avoid these couplings:

- UI dictionary → astronomy logic;
- localized term → semantic/domain identity;
- locale → timezone inference;
- locale → place inference;
- locale → chart calculation;
- professional fallback → runtime machine translation;
- content registry → direct commercial entitlement mutation;
- language switch → chart duplication;
- browser locale → silent override of explicit URL locale;
- private locale route → SEO indexability assumption; and
- locale preference → scientific or commercial identity.

Additional invariants are:

- a missing `zh-Hant` professional variant falls back to English, never to
  Japanese, Korean, Simplified Chinese, or another unrelated language;
- a stale locale variant is not authoritative merely because it was once
  approved;
- a display label is not a provider, chart, concept, content, or event ID;
- a content availability result does not itself publish or approve content;
- a repository path is not a semantic content identity; and
- a locale prefix does not grant access to a private page or API endpoint.

## 19. Recommended implementation sequencing

The following is sequencing guidance only. No phase begins in `WEB-LOCALIZATION-001B`.

### Phase 1 — Locale registry and routing/resolution foundation

Implement the closed locale registry, explicit page-prefix route model,
non-locale machine-route exceptions, two-context resolver, invalid-locale
handling, root negotiation entry, and SSR-first integration.

### Phase 2 — Class A UI catalog and language selector

Implement repository-backed UI catalogs for all seven locales, key-set
validation, safe UI fallback, document-language metadata, and equivalent-route
language switching with preference persistence at the already-defined
abstraction boundary.

### Phase 3 — Controlled glossary registry and resolver

Implement stable semantic concept IDs, canonical English terms, reviewed
locale variants, and glossary publication/currentness handling without using
display strings in logic.

### Phase 4 — Professional content registry and fallback

Implement semantic content identities, canonical versions, locale variants,
approval/currentness checks, and direct English fallback without runtime
machine translation.

### Phase 5 — Availability and fallback disclosure

Implement pre-render availability resolution, fallback provenance metadata,
bounded English-availability disclosure, and safe observability.

### Phase 6 — Public SEO localization and editorial publishing architecture

Resolve the deferred SEO route, canonical, indexing, editorial publishing,
reviewer, and content-management decisions before implementing that surface.

This sequence does not authorize a CMS, database, translated slugs, or
professional content parity at launch.

## 20. Explicitly deferred implementation decisions

The following decisions are deliberately deferred and MUST NOT be silently
implemented in 001B:

**A. Exact i18n framework or library**

Which runtime, catalog, formatting, or extraction technology is used for
ordinary Class A UI.

**B. Exact filesystem and package layout**

Where catalogs, glossary records, content records, and semantic resolvers
live in the repository.

**C. Account-preference persistence schema and API**

How authenticated locale preference is represented, authorized, exposed, and
updated.

**D. Cookie name, lifetime, and security attributes**

The concrete cookie name, lifetime, serialization details, and operational
security attributes remain deferred. The storage class and authority role for
the V1 static-delivery boundary are frozen in section 22.

**E. Exact locale-negotiation redirect behavior**

Deployment-specific edge/server status codes and cache headers remain
deferred. The V1 browser root-shell behavior, selector navigation contract,
and no-JavaScript fallback are frozen in section 22.

**F. Translated versus stable public slugs**

Whether article and Tool slugs remain canonical-language stable or become
locale-specific.

**G. `hreflang` implementation**

The emitted relationships and their source of truth.

**H. Canonical URL rules**

Canonical tags and duplicate-content behavior for localized and English-
fallback pages.

**I. Localized sitemap and indexing policy**

Which localized, private, or partially localized routes are discoverable and
indexable.

**J. English-fallback editorial page SEO behavior**

Whether a requested locale route may exist, redirect, omit, or remain
non-indexable when only canonical English content is available.

**K. Glossary exact taxonomy**

The complete professional concept set and naming convention.

**L. Interpretation semantic-ID taxonomy**

The complete canonical interpretation/content identity model.

**M. Exact professional approval enum or state machine**

The final lifecycle values, transitions, and publication gates.

**N. Editorial reviewer tooling**

The reviewer roles, evidence, workflow, and decision-recording mechanism.

**O. Translation-management tooling**

Whether and how an external or internal translation-management tool is used.

**P. Future CMS or database migration**

Whether repository-backed resources move to a CMS, database, or another
editorial platform and how that migration is operated.

**Q. Portuguese expansion**

Whether Portuguese becomes the next product locale after V1.

**R. Regional Traditional Chinese variants**

Whether real terminology/content differences justify `zh-Hant-TW`,
`zh-Hant-HK`, or another future variant.

The product-policy deferred decisions in
`docs/product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md` remain active in
addition to this architecture-specific list.

## 21. Consistency audit against 001A

The architecture was checked against the frozen 001A product policy. The
following invariants remain unchanged:

- The V1 locale set is exactly `en`, `es`, `fr`, `de`, `ja`, `ko`, and
  `zh-Hant`.
- English remains the default, canonical source, terminology-definition
  language, professional-content source, and fallback language.
- All user-visible page routes use explicit locale prefixes, including
  private Workspace, Vault, and Chart routes.
- The root `/` is only a negotiation entry point and does not host a second
  English page route.
- Machine, API, OAuth callback, webhook, service-worker, and other
  infrastructure endpoints are not presentation-localized merely for route
  consistency.
- An explicit valid URL locale controls the current request and cannot be
  silently overridden by a stored preference or browser locale.
- Locale resolution occurs before SSR content is produced.
- General UI targets complete seven-locale parity; professional content and
  Learn do not require complete seven-language parity at launch.
- Professional terminology is controlled through a glossary with
  language-neutral semantic IDs.
- Professional interpretation is not ordinary Class A i18n content.
- Only approved/current professional localization is publishable.
- Outdated, missing, invalid, or unapproved professional localization falls
  back directly to canonical English.
- No runtime professional machine translation is permitted.
- Learn remains Class C professional/editorial content.
- `zh-Hant` remains neutral Traditional Chinese, not Taiwan-only `zh-TW`.
- Automatic `zh-Hans`↔`zh-Hant` conversion is not professional localization.
- No cross-locale professional fallback is permitted.
- Chart identity, Engine semantics, scientific cache identity, API/domain
  identity, and commercial state remain locale-independent.
- Epistemic status identities and the science/astrology trust boundary remain
  unchanged.
- Repository-backed V1 storage is selected without creating a CMS/database
  requirement.
- SEO details, content publishing, reviewer workflow, preference schema,
  exact i18n technology, and future storage are explicitly deferred.

No contradiction remains between the product policy and this architecture
freeze.

## 22. Static delivery and locale preference reconciliation

`WEB-LOCALIZATION-001G` reconciles this architecture with the repository's
actual static-delivery topology. This is an architecture-only addendum. It
does not implement the root shell, a selector, a preference store, an account
field, an API route, or deployment behavior.

### 22.1 Observed repository baseline

The current repository establishes the following facts:

| Boundary | Observed implementation | Architectural consequence |
|---|---|---|
| Astro production output | `apps/web/astro.config.mjs` uses the React integration and the Tailwind Vite plugin, but no server adapter or non-static output mode. Astro therefore emits the static frontend artifact. | Production page negotiation cannot depend on a per-request Astro render unless the deployment topology is changed by a separate decision. |
| Locale-prefixed routes | `apps/web/src/pages/[locale]/*` uses `getLocaleStaticPaths()`. The locale registry is the closed seven-locale registry in `apps/web/src/lib/localization.ts`. | Explicit locale pages are independently generated static URLs. |
| Development/request middleware | `apps/web/src/middleware.ts` resolves the URL first. For non-prerendered requests it reads `Accept-Language`, assigns `Astro.locals.locale`, and redirects unlocalized presentation routes. | `astro dev` can observe request headers and perform request-time behavior; that behavior is not evidence that a production static host can do the same. |
| Static build behavior | During prerendering the middleware deliberately supplies no request `Accept-Language` value. The inspected generated root artifact is a small `noindex` redirect shell to `/en/`, while the locale-prefixed pages contain the product pages. | A static HTTP request serves already-generated bytes. Cookies and `Accept-Language` are not evaluated by Astro at request time. |
| Browser/API topology | `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md` assigns normal routes/assets to the Astro artifact and `/api/*` to the Hono BFF on one public origin. `server/src/app/create-app.ts` is API assembly; it is not a page renderer. | The BFF is not a page-negotiation runtime in the current topology. A future edge/server layer may add negotiation without moving scientific or presentation logic into the BFF. |
| Local composition | `server/src/runtime/README.md` describes a local edge serving `apps/web/dist` and proxying `/api/*`. The repository does not provide a request-aware static web negotiation layer. | The repository-supported static composition does not remove the production root-negotiation constraint. |
| Account persistence | The current account/server contracts and migrations contain authentication, Vault, export, deletion, and notification state, but no locale preference contract. | Authenticated locale persistence is a future account/API slice; this task must not add schema, migration, or API behavior. |

The current built root is therefore a negotiation entry shell, not a second
English product route. Its fixed English redirect text is fallback chrome, not
duplicate product content. The implementation task that follows this freeze
must preserve that distinction.

### 22.2 Development versus generated static production

These two execution modes must remain explicit in implementation reviews:

| Mode | Available inputs before page output | Current behavior | Contract status |
|---|---|---|---|
| `astro dev` / request-aware runtime | URL, request headers, and request cookies if a future implementation reads them | Current middleware can use `Accept-Language` for an unlocalized request and can set `Astro.locals.locale`. A valid URL locale remains authoritative. | Useful development behavior, but not the production static contract. |
| Generated static production | Build-time route parameters and build-time environment only; no visitor-specific request headers or cookies | Astro emits fixed locale-prefixed HTML and a fixed root negotiation shell. The static host serves those bytes. | Authoritative V1 delivery baseline. |

No implementation may claim that static Astro has performed per-visitor SSR
negotiation merely because `astro dev` can inspect a request. If a future
deployment edge or server negotiates `/`, it must be treated as an additional
request-aware delivery layer with the same semantic contract defined here.

### 22.3 Delivery options evaluated

The following options were considered against the accepted one-origin
topology, the current static Astro artifact, and the absence of a production
hosting-provider decision:

| Option | Shape | Benefits | Costs / boundary impact | Decision |
|---|---|---|---|---|
| A | Switch Astro to server or hybrid output | Server can read a preference cookie and `Accept-Language` before rendering every page. | Changes the accepted static frontend ownership, introduces a frontend server runtime/adapter, and expands deployment scope. It is not required for explicit locale URLs. | Not selected for V1. |
| B | Keep static Astro and negotiate `/` at CDN/edge | Retains static page artifacts and can use request headers/cookies before serving or redirecting the root entry. | Depends on an as-yet unselected hosting/edge product and requires a separate cache/security implementation. | Preserved as a future optimization/compatibility path, not required for the first Web runtime slice. |
| C | Keep static Astro and make `/` a minimal browser negotiation shell | Works with the current generated artifact, avoids English product-content flash, and needs no heavy runtime. Explicit locale pages remain ordinary static URLs. | The root shell can use only browser-readable state and browser locale. A static browser cannot provide request-time negotiation for an already explicit locale page. | Selected as the V1 implementation direction. |
| D | Use an existing repository-supported better mechanism | Would avoid new runtime infrastructure if the repository already supplied request-aware negotiation. | The inspected local edge only serves the static artifact and proxies `/api/*`; the Hono BFF does not render pages. No better existing mechanism was found. | No alternative selected. |

### 22.4 Frozen V1 delivery strategy

V1 keeps Astro static. The root `/` is a minimal negotiation entry shell,
not a localized product page. The shell MUST:

1. contain no normal English product content and remain `noindex`;
2. execute a deterministic, small inline/browser bootstrap when JavaScript is
   available;
3. resolve a valid anonymous explicit preference first, then a supported
   browser locale, then `en`;
4. navigate to the equivalent explicit locale URL, using replace-style
   navigation for the root entry so the negotiation shell does not remain as a
   misleading history entry; and
5. expose a direct safe no-JavaScript fallback to the canonical `/en/` route.

The bootstrap is a delivery primitive, not a second translation system. It
must not render product copy in English and replace it after hydration. It may
read only the locale preference contract described below and the browser's
language list. It must not inspect chart data, birth data, account data,
subscription state, notification state, or any provider/runtime signal.

An edge or server may later perform the same negotiation before the static
artifact is selected. That is an implementation optimization, not a change to
the presentation contract. The concrete edge product, status code, cache
headers, and deployment configuration remain outside this task.

### 22.5 Locale-resolution contract at delivery boundaries

The two contexts remain separate:

**Context A — explicit locale URL**

```text
/ja/learn/article
    → render Japanese
```

The explicit valid URL locale wins absolutely. A cookie, account preference,
browser locale, middleware request header, or root bootstrap MUST NOT rewrite
the locale of the current explicit URL. This applies equally to public,
private, Learn, Tools, Vault, and chart routes.

**Context B — root negotiation entry**

```text
valid persisted explicit preference
    → supported browser locale
    → en
```

At the static browser boundary, “persisted explicit preference” means the
valid first-party locale cookie defined in section 22.6. At a future edge or
server boundary, the same semantic value may be read before selecting the
static artifact. Browser detection is only a fallback presentation signal;
it MUST NOT infer birth location, timezone, chart settings, Engine input, or
provider selection.

The existing `resolveRequestLocale(...)`, `getLocalizedPath(...)`, and related
locale helpers remain the repository's route/resolution integration points.
This addendum does not change those helpers.

### 22.6 Anonymous preference storage contract

The V1 anonymous preference contract is frozen at the semantic level:

- The authoritative anonymous preference is one first-party,
  browser-readable locale cookie carrying exactly one canonical supported
  locale ID from the closed registry.
- The cookie is a presentation preference, not a session credential. It must
  never contain an account identifier, authentication token, chart ID, birth
  data, location, timezone, entitlement, notification state, referral data,
  analytics data, or arbitrary URL content.
- Because the static root bootstrap must be able to read the preference, this
  preference is not the existing `HttpOnly` authentication session cookie. Its
  exact name, lifetime, serialization, `Secure` behavior, `SameSite` value,
  `Path`, and deployment-specific headers remain an operational follow-up,
  subject to the existing same-origin security policy.
- A preference is written only after an explicit language-selector action. A
  browser locale observation or a root fallback MUST NOT silently persist a
  choice.
- A valid preference survives ordinary anonymous navigation. Whether it also
  survives a browser-session boundary follows the future cookie lifetime
  decision. Clearing or blocking the cookie MUST degrade to browser-locale
  negotiation and then English; it must not block explicit locale URLs.

`localStorage` is not the authority for V1 negotiation. It is not readable by
an edge/server request and therefore cannot satisfy the SSR-readable
preference boundary. A future client implementation MAY mirror the selected
locale there for UI ergonomics or same-device recovery, but it MUST NOT let a
localStorage value override a valid preference cookie, become the only stored
preference, or change explicit URL authority. If the cookie is unavailable,
the frozen safe fallback is supported browser locale and then `en`.

### 22.7 Browser-locale and invalid-preference behavior

The closed-set browser mapping is:

| Browser input | Product locale |
|---|---|
| `en-*` | `en` |
| `es-*` | `es` |
| `fr-*` | `fr` |
| `de-*` | `de` |
| `ja-*` | `ja` |
| `ko-*` | `ko` |
| `zh-TW`, `zh-HK`, `zh-MO`, and `zh-Hant-*` | `zh-Hant` |
| `zh-CN`, `zh-Hans-*`, and unsupported values | `en` |

The same normalization already represented by the locale helper is the
semantic source for the future root bootstrap and any future edge/server
implementation. A malformed, expired, unsupported, or arbitrary stored value
is ignored. It never becomes a raw URL segment, a translation key, a provider
input, or a reason to select an unrelated language. Resolution then proceeds
to the supported browser locale and finally `en`.

### 22.8 Selector placement and accessible switching contract

The future language selector is a global presentation control, not an
Account-only feature. It is placed in the existing `SiteLayout` header utility
area alongside the primary navigation, with a compact desktop treatment and
an equivalent discoverable mobile treatment inside the existing navigation
surface. It must be available on public and authenticated pages wherever the
shared shell is rendered.

The selector MUST:

- show the current locale clearly;
- use the native names and frozen order `English / Español / Français /
  Deutsch / 日本語 / 한국어 / 繁體中文`;
- use no flags, country inference, decorative telemetry, or unrelated
  badges;
- remain keyboard-operable, screen-reader discoverable, and focus-visible;
- preserve the existing heading, navigation, authentication, and page-content
  semantics; and
- change presentation language without changing product/domain identity.

This is a placement and behavior contract only. No selector component or
runtime preference implementation is started by `WEB-LOCALIZATION-001G`.

### 22.9 Equivalent-route switching and preference write

Selecting a target locale resolves the current route's locale-independent
identity through the existing locale-aware helpers and navigates to the
equivalent explicit locale URL. The switch MUST preserve:

- the full path remainder, including the article/Tool slug;
- query parameters;
- the URL fragment; and
- any chart ID or other domain identifier exactly as-is.

The switch is a URL navigation, not an in-place content swap and not a chart
recalculation. It must not change birth data, timezone, chart ownership,
entitlement, notification eligibility, or scientific cache identity.

The preference write happens as part of the same explicit selector action and
must be best-effort with respect to storage availability: a failed cookie
write must not prevent navigation to the selected explicit URL. A selector
does not write a preference merely because the user opened the menu or
because browser detection selected a fallback.

### 22.10 Authenticated preference and login conflict rule

Authenticated account preference persistence is a future contract, not a
schema or API in this task. When implemented:

- the account preference is the long-term preference for future negotiation
  entries;
- the account preference remains separate from birth data, chart identity,
  scientific provenance, subscription/entitlement, Vault ownership, and
  notification eligibility;
- an authenticated selector action updates the anonymous preference cookie and
  the account preference through the future authorized account boundary; and
- an explicit URL still controls the current page even when the account
  preference differs.

The deterministic anonymous-to-authenticated conflict rule is:

1. preserve the current explicit URL and do not redirect it during login;
2. if a valid anonymous preference exists at authentication time, treat that
   explicit selector choice as the user's current language intent and
   synchronize it into the account preference for future negotiation; and
3. if no valid anonymous preference exists, retain the existing account
   preference for future negotiation.

This rule avoids a silent language jump on the page that is already open. It
does not authorize login handlers, account APIs, or persistence changes in
this task.

### 22.11 No-JavaScript, cache, privacy, and SEO invariants

**No JavaScript.** Explicit locale URLs remain directly usable without
JavaScript. The root shell provides a direct `/en/` fallback and no product
content that depends on a client redirect. A user may still use a bookmarked
or manually entered explicit locale URL. No-JavaScript behavior must not
invent a translated page or expose a misleading English product duplicate at
`/`.

**Cache.** `/en/page`, `/ja/page`, and every other explicit locale URL are
independently cacheable static resources whose content is determined by the
URL. They MUST NOT vary between languages because of a locale cookie. A
future edge implementation may negotiate only the root entry and must ensure
that a response selected from a cookie or `Accept-Language` is not reused as
localized product content for another request. Exact cache directives and
status codes remain deployment work.

**Privacy.** The preference boundary stores only the user's selected
presentation locale. It is not tracking, advertising, analytics, referral,
commercial, notification, authentication, chart, or birth-data state. No
locale preference may be included in a scientific calculation request or
cache key unless a future contract explicitly distinguishes presentation
variants. `PROVIDER DECISION DEFERRED` remains in force.

**SEO.** The root is a `noindex` negotiation entry and does not contain
duplicate English product content. Explicit locale-prefixed pages are the
product URL surface. Canonical tags, `hreflang`, localized sitemaps, and
English-fallback editorial indexing remain separate SEO/content decisions and
are not implemented or silently resolved here.

### 22.12 Smallest implementation sequence after this freeze

The smallest sequence that respects this contract is:

```text
G1  static root negotiation shell + anonymous preference primitive
G2  global accessible selector + equivalent-route switching + preference write
G3  authenticated account preference persistence and synchronization
```

G1 must not turn the root into a product page or add a server adapter. G2
must not introduce chart, Vault, Auth, commercial, notification, or SEO
behavior beyond the selector boundary. G3 requires a separately reviewed
account contract, API authorization, persistence design, and migration
decision before implementation.

The exact concrete cookie name/attributes, edge product, account schema/API,
and detailed SEO behavior remain deferred. The semantic delivery and
preference decisions above are the frozen V1 baseline for those later slices.

## 23. Closure and implementation gate

The V1 localization architecture is frozen at the semantic-boundary level.
The implementation gate is:

```text
ARCHITECTURE FROZEN
RUNTIME LOCALIZATION NOT IMPLEMENTED
```

Any subsequent runtime task must preserve this document and the 001A product
policy. It must be separately scoped, must not silently resolve a deferred
decision, and must not expand into astronomy, provider, commercial, Auth,
Vault, notification, or unrelated SEO implementation.
