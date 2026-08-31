# NatalNode Localization Product Policy V1

| Field | Value |
|---|---|
| Status | **FROZEN V1 PRODUCT POLICY** |
| Task | `WEB-LOCALIZATION-001A` |
| Reviewed source | `docs/PRD.md` |
| Date | 2026-08-31 |
| Scope | Product language selection, localization, and professional astrology content boundaries |
| Default locale | `en` |
| Production astronomy/provider | `PROVIDER DECISION DEFERRED` |
| Implementation status | Policy only; runtime localization is not implemented by this document |

This document freezes NatalNode V1 product policy for language and
localization. It is the authoritative localization policy for the Web Product
until a later explicit product decision supersedes it. It records product
behavior and content boundaries; it does not select an i18n framework, define
translation-file formats, design persistence schemas, or authorize runtime
implementation.

The governing principle is:

```text
localization changes presentation and approved content
but never changes astronomical or commercial semantic truth
```

The product source of truth remains `docs/PRD.md`. This policy must be read
with the fixed NatalNode boundary:

```text
NatalNode.com
    → Website API / BFF
    → NatalNode Engine Public API
```

No localization decision in this document authorizes access to
`C:\NatalNode`, astronomy implementation, provider selection, or changes to
the Engine contract.

## 1. V1 supported product locales

NatalNode V1 supports exactly these seven product languages and canonical
locale identifiers:

| Product order | Language | Canonical locale |
|---:|---|---|
| 1 | English | `en` |
| 2 | Español | `es` |
| 3 | Français | `fr` |
| 4 | Deutsch | `de` |
| 5 | 日本語 | `ja` |
| 6 | 한국어 | `ko` |
| 7 | 繁體中文 | `zh-Hant` |

This registry is closed for V1. English MUST remain first in the
product-language selector. The order MUST NOT change unless a later explicit
product decision changes it.

V1 MUST NOT add Portuguese, Simplified Chinese, Italian, Russian, or any
other product locale. Future languages are product-expansion decisions and
are outside this policy.

The canonical locale identifiers above are product identifiers, not a
complete statement of every browser locale or regional publishing variant.

## 2. Canonical English role

English is not merely one peer translation among seven languages. English is
the:

- default product language;
- canonical source language;
- canonical fallback language;
- canonical terminology-definition language; and
- canonical interpretation-content source language.

All future localization architecture MUST assume a canonical English source.
Changing a locale-specific label MUST NOT change the identity, calculation,
routing, persistence, or interpretation lookup of the underlying concept.

## 3. Language selection policy

### 3.1 First visit and browser detection

On a first visit, the product MAY use the browser's locale as a presentation
language signal. Supported browser locales MUST map to the nearest supported
NatalNode product locale according to this policy:

| Browser locale pattern | NatalNode locale |
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

Browser detection is presentation-language selection only. It MUST NOT be
used to infer birth location, place-resolution behavior, latitude, longitude,
timezone, historical timezone policy, chart settings, or any Engine input.

`zh-Hans`, Simplified Chinese, and other unsupported Chinese browser locales
MUST NOT be treated as automatic professional Traditional Chinese
localization. They map to the safe V1 fallback `en` unless a later explicit
product decision defines another supported locale.

The exact detection behavior for anonymous and authenticated users remains a
deferred decision listed in section 12.

### 3.2 Explicit user choice

Once a user explicitly chooses a supported NatalNode language, that explicit
choice MUST override browser-language detection.

The product MUST persist the explicit preference using an appropriate future
implementation mechanism so that an explicit choice is not silently replaced
by a later browser-locale observation. The storage mechanism, precedence
details across anonymous and authenticated sessions, and migration behavior
are not defined by this policy.

If an explicit preference is missing, invalid, unsupported, or unavailable,
the product MUST fall back safely to the canonical English behavior rather
than exposing a translation key or selecting an unrelated language.

### 3.3 Regional variants

V1 uses one neutral or international product locale for each of Spanish,
French, and German. V1 MUST NOT split these into regional product locales:

- `es-ES`, `es-MX`, or `es-419`;
- `fr-FR` or `fr-CA`; or
- `de-DE`, `de-AT`, or `de-CH`.

Traditional Chinese uses `zh-Hant` as the V1 product locale. V1 MUST NOT
define the product language solely as `zh-TW`, and `zh-Hant` MUST NOT be
treated as Taiwan-only.

Future variants such as `zh-Hant-TW` or `zh-Hant-HK` MAY be introduced only
when real terminology or content differences justify independent product
content. They require a later explicit product decision and are not implied
by browser detection.

## 4. Language is not astronomical input

The UI locale is a presentation/content value. It MUST NOT alter:

- birth location;
- place-resolution semantics;
- latitude or longitude;
- timezone;
- historical timezone resolution;
- astronomical calculations;
- chart geometry;
- house calculations;
- aspect calculations;
- celestial positions;
- scientific provenance;
- Engine request or response semantics; or
- any other scientific input or output meaning.

The invariant is:

```text
same canonical chart request
    + different supported UI locale
    = same Engine semantics and same chart facts
```

For example, a Japanese-language user MAY calculate a chart for Paris using
the `Europe/Paris` timezone. Japanese UI does not imply a Japanese location,
timezone, calendar interpretation, or astronomy policy. The result MUST be
identical to the same request rendered under English UI.

Locale selection MUST NOT be part of the scientific identity of a chart. It
MUST NOT be persisted as a substitute for birth-data semantics, included in a
scientific cache key unless a future contract explicitly distinguishes
presentation variants, or used to choose a provider. `PROVIDER DECISION
DEFERRED` remains in force.

## 5. Three localization content classes

NatalNode MUST distinguish these content classes. They have different
translation, review, identity, fallback, and release policies.

| Class | Name | Examples | Primary policy |
|---|---|---|---|
| A | General Product UI | Navigation, buttons, form labels, Auth, Account, Subscription, Vault, Workspace, Calculate UI, notification UI, validation, ordinary errors, settings, accessibility copy | Fully localizable across all seven V1 locales |
| B | Professional Astrology Terminology | Domicile, detriment, exaltation, fall, angular, succedent, cadent, applying/separating aspect, orb, sect, dispositor, profection, reception, essential/accidental dignity | Controlled glossary with stable language-neutral concept identity |
| C | Astrological Interpretation / Editorial Knowledge | Natal interpretations, synthesis, aspect interpretations, planetary or house interpretation, transit interpretation, Learn articles, expert explanatory content | Professionally authored or adapted editorial content with stable semantic/content identity |

A page MAY contain all three classes. A single generic translation policy MUST
NOT be applied to all three classes merely because they appear in the same UI.

## 6. Class A — General Product UI

General Product UI MUST be fully localizable across all seven V1 locales.
Class A includes ordinary product interaction copy, including navigation,
buttons, labels, authentication, account and subscription UI, Vault,
Workspace, Calculate UI, notifications, validation messages, ordinary errors,
settings, and generic accessibility copy.

Traditional internationalization mechanisms MAY be used for Class A. Future
architecture MAY use translation keys, locale dictionaries, and locale-aware
formatting, but this product-policy document does not select a library,
framework, file format, or runtime loading strategy.

Class A copy MUST NOT be used as a hidden substitute for the controlled
professional terminology or editorial-content policies below. A product
label may point to a Class B concept or Class C content record, but its
localized display string is not the semantic identity of that record.

## 7. Class B — Professional Astrology Terminology

Professional astrology terminology MUST NOT be freely machine-translated or
treated as ordinary UI copy. NatalNode MUST use a future controlled astrology
glossary.

Every professional concept MUST have a stable, language-neutral semantic
identifier. Conceptual examples are:

```text
aspect.opposition
aspect.square
house.angular
house.cadent
planetary_condition.domicile
planetary_condition.detriment
dignity.exaltation
dignity.fall
```

These examples illustrate the requirement; they do not freeze the final
identifier taxonomy.

Each locale-specific professional term MUST be:

- intentionally selected;
- glossary-controlled;
- professionally reviewed;
- semantically equivalent to the canonical concept; and
- changeable without changing the underlying concept identity.

The target-language professional community MAY justify an English loanword,
transliteration, hybrid term, bilingual professional expression, or another
non-literal choice. Professional correctness is more important than
translation purity.

Arbitrary runtime translation of professional terms MUST NOT be allowed.
Unreviewed terms MUST NOT silently appear as authoritative professional
terminology in production.

Astrological logic MUST operate on the stable semantic identifier, never on a
localized display string. The following conceptual pattern is forbidden:

```text
if (aspectName === "Opposition")
```

The required direction is:

```text
stable concept identity
    → locale-specific glossary label
```

Changing the display of `aspect.opposition` MUST NOT alter calculation,
routing, persistence identity, cache semantics, or interpretation lookup.

## 8. Class C — Interpretation and editorial knowledge

Professional astrological interpretation content MUST NOT use ordinary Class A
translation-key semantics as its primary content policy. It MUST be treated
as professionally authored or adapted editorial content associated with a
stable, language-neutral semantic content identity.

The conceptual relationship is:

```text
one interpretation concept
    → canonical English content
    → independently approved locale adaptations
```

Locale adaptations do not need to be literal sentence-level translations.
They MUST preserve the canonical claim's meaning, epistemic strength,
limitations, and professional intent. A locale version MUST be traceable to
the canonical semantic/content identity from which it was authored or
adapted.

### 8.1 No runtime machine translation

NatalNode V1 MUST NOT automatically machine-translate official professional
astrology interpretation content at runtime. This prohibition includes:

- generic machine translation;
- LLM translation;
- third-party automatic translation APIs; and
- browser translation presented as an official NatalNode localized-content
  mechanism.

Users may use browser or user-side tools independently. NatalNode MUST NOT
present unreviewed machine translation as an authoritative localized
interpretation.

This prohibition concerns official professional terminology and
interpretation/editorial content. It does not select the future mechanism for
ordinary Class A UI translation.

### 8.2 English fallback and progressive content availability

If a professionally reviewed interpretation is unavailable in the selected
locale, the product MUST fall back to the canonical English interpretation.
It MUST NOT generate an automatic localized substitute. The UI MAY explain
that the interpretation is currently available in English; exact wording is
deferred to future UX work.

All seven V1 locales are expected to support complete Class A UI
localization. Class B and Class C professional content do not need complete
seven-language parity at launch. Professional content MAY be released
progressively by locale and content family.

Therefore, the intended V1 behavior is:

```text
complete localized General UI
    + partial approved professional content
    + deterministic English fallback for unavailable professional content
```

Partial professional-content availability is intentional product behavior,
not a defect or a reason to fabricate a translation.

### 8.3 Learn policy

Learn is Class C editorial/professional astrology content, not Class A
ordinary UI. Learn content MUST be professionally adapted, editorially
controlled, locale-aware, and independently publishable.

NatalNode MUST NOT bulk machine-translate Learn merely to create multilingual
SEO inventory. If an approved localized Learn article does not exist, the
product MAY fall back to English or omit the localized article route according
to a later SEO/content architecture decision. The exact route behavior is
deferred and MUST NOT be silently selected by implementation work.

### 8.4 Tools policy

Ordinary Tools UI is Class A. Professional astrology terminology inside a
Tool is Class B. Any professional astrological interpretation generated or
displayed inside a Tool is Class C. The future architecture MUST preserve
this separation even when a single Tool page contains all three classes.

## 9. Deterministic fallback and localization safety

The authoritative professional-content fallback chain is:

```text
requested supported locale
    → approved locale-specific professional content, if available
    → canonical English professional content
```

Fallback MUST be explicit and deterministic. It MUST NOT cascade
unpredictably through unrelated languages. For example, missing `zh-Hant`
professional content MUST fall back to English, not Japanese, Korean,
Simplified Chinese, or another arbitrary locale.

Localization data that is missing, invalid, or unapproved MUST degrade safely.
For authoritative professional content, the product MUST prefer canonical
English over:

- empty content;
- fabricated content;
- exposed translation keys;
- an unreviewed translation; or
- an unrelated-language substitute.

The same safety principle applies to future Class A runtime failure handling:
the product MUST not expose raw keys or broken content to users, and the
implementation MUST define an explicit safe fallback without changing the
semantic meaning of the UI action.

## 10. Traditional Chinese policy

`zh-Hant` is the sole V1 Traditional Chinese product locale. It is a neutral
V1 product locale and is not equivalent to Taiwan-only `zh-TW`.

NatalNode MUST NOT treat automatic `zh-Hans` ↔ `zh-Hant` character conversion
as professional astrology localization. Traditional Chinese professional
terminology and content MUST be independently glossary-controlled and/or
editorially approved. Script conversion alone MUST NOT be treated as proof of
professional semantic equivalence.

No `zh-TW`, `zh-HK`, or other regional content fork is authorized by this
policy. Regional Traditional Chinese variants are a deferred future product
decision.

## 11. Epistemic status, science boundary, and versioning

### 11.1 Epistemic-status preservation

NatalNode's epistemic-status model MUST be preserved across localization:

```text
CALCULATED
DERIVED
INTERPRETED
UNKNOWN
RESEARCH
```

Localization MUST NOT blur, omit, or strengthen these statuses. A localized
interpretation MUST remain explicitly `INTERPRETED`. A translated label MUST
NOT make an interpreted claim appear to be a scientifically calculated fact.

### 11.2 Science/astrology boundary

Localization MUST preserve NatalNode's trust principle:

```text
astronomical precision does not scientifically validate astrological interpretation
```

Localized professional content MUST preserve the canonical English source's
epistemic strength, limitations, caveats, and uncertainty. It MUST NOT
introduce stronger scientific claims, implied validation, or production
provenance that is absent from the canonical source.

Localization MUST NOT alter the distinction between Engine facts, derived
presentation, interpretation, research status, and unknown or incomplete
information.

### 11.3 Content identity and approval

Professional localized content MUST be traceable to a stable canonical
semantic/content identity. Future architecture MUST be able to determine, at
minimum:

- which canonical interpretation or content concept a locale version belongs
  to;
- whether the locale version is approved;
- whether it is outdated relative to canonical content; and
- whether English fallback is required.

Professional terminology and interpretation content MUST support a future
approval workflow. Conceptual lifecycle ideas such as `DRAFT`, `REVIEW`,
`APPROVED`, and `OUTDATED` are illustrative only; exact enum values are not
frozen here unless an existing contract already defines them.

Unreviewed professional localized content MUST NOT silently appear as
authoritative production content.

This policy freezes the requirement, not a database schema, content CMS,
translation-management system, reviewer role model, or exact approval enum.

## 12. Formatting versus content

Locale formatting MAY affect presentation, including:

- dates;
- numbers;
- punctuation; and
- ordinary UI formatting conventions.

Locale formatting MUST NOT alter persisted scientific or commercial semantic
values. It MUST NOT change birth-data meaning, timezone meaning, Engine
request/response semantics, entitlement state, subscription state, event
identity, content identity, or provenance identity.

This policy does not select a date/number formatting library or freeze
formatting implementation details.

## 13. V1 non-goals

The following are explicit V1 non-goals:

- full seven-language professional interpretation parity at launch;
- full seven-language Learn parity at launch;
- runtime AI translation of astrology interpretations;
- automatic professional terminology translation;
- regional Spanish variants;
- regional French variants;
- regional German variants;
- `zh-TW` / `zh-HK` content forks;
- Simplified Chinese;
- Portuguese;
- Italian, Russian, or any other additional V1 product locale;
- detailed multilingual SEO implementation;
- localization-specific changes to the astronomy Engine; and
- changing astronomy, place resolution, timezone resolution, chart geometry,
  provenance, or provider behavior based on UI language.

No non-goal in this section prevents future explicit product decisions. It
does prevent implementation from silently treating a future possibility as a
V1 requirement.

## 14. Deferred product and architecture decisions

The following decisions are intentionally deferred and MUST be resolved by
later scoped product or architecture work. They are not implementation
decisions in `WEB-LOCALIZATION-001A`:

**A. Multilingual SEO URL architecture**

Whether localized content uses locale subpaths, subdomains, another URL
structure, or a different route policy.

**B. `hreflang` and canonical strategy**

How localized and English-fallback pages express canonical URLs,
`hreflang`, indexing, and duplicate-content relationships.

**C. Localized editorial publishing workflow**

How canonical and locale-specific Learn or interpretation content is drafted,
adapted, reviewed, approved, published, unpublished, and updated.

**D. Professional reviewer workflow**

Who reviews terminology and professional content, what evidence is required,
and how review decisions are recorded.

**E. Glossary governance ownership**

Which product, editorial, and professional owners govern the controlled
astrology glossary and resolve terminology disputes.

**F. Locale-specific content rollout order**

Which professional content families and locales are adapted first after the
complete Class A UI baseline.

**G. Portuguese sequencing**

Whether Portuguese becomes the next product locale after V1.

**H. Regional Traditional Chinese variants**

Whether real terminology or content differences ever justify variants such as
`zh-Hant-TW` or `zh-Hant-HK`.

**I. Translation-management tooling**

Whether and how a translation-management or editorial content tool is used.

**J. Content-versioning persistence architecture**

How canonical content identity, locale versions, approval state, outdated
state, and fallback eligibility are persisted.

**K. Locale preference storage architecture**

How explicit language preference is stored, synchronized, scoped, and removed
for anonymous and authenticated users.

**L. Anonymous versus authenticated browser detection**

The exact precedence and timing of browser detection for anonymous users,
authenticated users, existing explicit preferences, and account switching.

## 15. Implementation boundary

This document authorizes no runtime localization infrastructure. It does not
authorize:

- source-code changes;
- package or dependency changes;
- translation files or locale dictionaries;
- database schema or migration changes;
- SEO route changes;
- Learn route/content changes;
- browser-detection implementation;
- locale-preference storage;
- glossary or CMS implementation;
- machine-translation integration;
- changes to `ChartRequest`, `ChartResult`, `EngineClient`, or the BFF;
- astronomy or provider work; or
- access to `C:\NatalNode`.

Future localization architecture MUST preserve the product rules in this
document and the fixed Website API / BFF → NatalNode Engine Public API
boundary. Where this document is silent, the behavior is deferred rather
than implicitly selected by implementation convenience.

## 16. Consistency audit

This policy was checked for the following contradictions before freeze:

- It requires complete seven-locale parity for Class A General UI only; it
  does not require complete seven-language parity for professional
  interpretation or Learn content at launch.
- It prohibits runtime machine translation for official professional
  terminology and interpretation/editorial content; it does not claim that
  ordinary UI must use a particular translation technology.
- It requires language-neutral semantic identifiers for professional
  concepts; localized labels are never semantic identities.
- It separates UI locale from location, timezone, chart input, Engine facts,
  calculations, provenance, and provider semantics.
- It defines `zh-Hant` as a neutral Traditional Chinese V1 locale, not as a
  Taiwan-only locale, and does not authorize regional forks.
- It defines missing professional `zh-Hant` content to fall back to canonical
  English, not to an arbitrary Asian language or automatic Simplified Chinese
  conversion.
- It preserves `CALCULATED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, and
  `RESEARCH` status distinctions.
- It preserves the boundary that astronomical precision does not scientifically
  validate astrological interpretation.
- It requires professional content approval and safe English fallback without
  fabricating authoritative localized content.
- It leaves detailed multilingual SEO, persistence, reviewer, glossary
  governance, and anonymous/authenticated detection behavior explicitly
  deferred.

The resulting V1 contract is:

```text
seven complete General UI locales
+ controlled professional terminology
+ progressively approved professional content
+ deterministic English fallback
+ unchanged astronomical and commercial semantics
```

This document freezes product policy only. Localization architecture and
implementation require a later separately scoped task.
