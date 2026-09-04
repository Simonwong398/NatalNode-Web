# NatalNode Discover V2

Status: implementation baseline for Sign Match and Elements & Modes Explorer.

## 1. Product rule

**DISCOVER SIMPLIFIES THE ENTRY POINT, NOT THE SCIENTIFIC STANDARD.**

Discover V2 adds two approachable, non-calculating experiences to the V1 Zodiac
Explorer. They make familiar sign questions easier to enter while keeping the
limits of sign-level astrology visible.

## 2. Scope

Discover V2 contains exactly three public experiences:

- Zodiac Explorer: explore one of the twelve canonical signs;
- Sign Match: compare two manually selected signs through stable structure;
- Elements & Modes Explorer: see how four elements and three modalities organize
  the twelve signs.

The experiences use the existing Web taxonomy and localized editorial content.
They do not require birth data and do not call the Engine.

## 3. Sign Match purpose

Sign Match provides a low-friction way to ask how two signs relate without
pretending to perform full relationship astrology. The user manually selects
Sign A and Sign B. The interface never infers a sign and never asks for a date,
time, place, name, gender, or relationship status.

The stable inputs are the two Core sign IDs. Core supplies each sign’s element
and modality. Discover content supplies the bounded editorial descriptions of
their element and modality relationships.

## 4. Sign Match interpretation basis

The output is composed from four layers:

1. the two sign identities and their glyphs;
2. the unordered element relationship;
3. the unordered modality relationship;
4. a concise simplified-lens disclosure.

The content model contains ten unordered element relationships and six unordered
modality relationships. It does not contain sign-pair essays. Reversing the
selection order therefore reuses the same relationship records. A same-sign pair
is valid and shows the shared element and modality without treating that fact as
an automatic personal outcome.

The language uses bounded framing such as “in a simplified sign-level
comparison” and “in traditional astrological interpretation.” It describes
classifications and study prompts, not deterministic facts about people.

## 5. Prohibited Sign Match behavior

Sign Match must never present a percentage, numeric score, ranking, traffic-light
verdict, soulmate claim, marriage prediction, sexual-chemistry rating, or
“best/worst” sign list. It must not tell users that a relationship will work,
fail, or require a personal decision.

There is no final compatibility verdict. The product encourages understanding of
the two structural dimensions and states that the result is not a complete
relationship reading.

## 6. Sign Match URL and indexability

The base page is available at `/discover/match/` and its supported localized
routes. A selected pair is restorable through query state such as
`?a=scorpio&b=pisces`. Only canonical sign IDs are accepted. Invalid values fall
back to the neutral sample selection and never create a new route or content
record. Browser history is supported when the pair changes.

The localized base route is canonical for every query combination. Query pairs
are not static routes, are not independently indexed, and do not produce a
12-by-12-by-7 page set. No pair-specific OG image or share-card system is part
of V2.

## 7. Elements & Modes Explorer

Elements & Modes teaches the relationship:

```text
12 zodiac signs = 4 elements × 3 modalities
```

It presents exactly Fire, Earth, Air, and Water, plus exactly Cardinal, Fixed,
and Mutable. Each family has localized structural copy and links to its member
sign profiles. Membership is derived from `core/astrology-taxonomy` through the
existing Core-backed Discover records; it is never independently re-authored in
the feature.

The 4×3 cross-classification view gives every sign one cell. Desktop uses an
accessible table with row and column headers. Narrow layouts use a stacked
representation of the same Core-derived cells so the reading order remains
clear without requiring page-level horizontal overflow.

## 8. Relationship to Zodiac Explorer

Zodiac Explorer remains the sign-level profile surface. Elements & Modes adds
family and cross-classification context, while Sign Match combines two selected
sign classifications. Contextual links connect all three surfaces and the
existing sign profile routes; none of them copies the Core taxonomy or creates a
parallel sign identity system.

## 9. Learn and Calculate bridges

Discover resolves its Learn link through the Foundations registry’s canonical
`ZODIAC_STRUCTURE` hook. It does not guess or duplicate a lesson slug. Both new
experiences link to the existing localized Calculate route for users who want a
full chart. Neither surface collects or pre-fills birth information.

## 10. Future Synastry boundary

Sign Match is not Synastry. A full relationship comparison requires complete
natal charts and the facts supported by the Engine. V2 does not add second-person
birth input, relationship-chart contracts, compatibility calculations, or a
future-feature simulation. The disclosure points toward full-chart context
without making a promise about availability.

## 11. Localization

The admitted locale set remains exactly `en`, `es`, `fr`, `de`, `ja`, `ko`, and
`zh-Hant`; `zh-Hans` is not introduced. New page labels, relationship copy,
family descriptions, matrix headings, selectors, disclosures, CTAs, accessible
labels, titles, descriptions, and route alternates are explicit for all seven
locales. English is not used as a silent fallback for new Discover editorial
records.

## 12. SEO and navigation

The Discover landing, Sign Match base route, Elements & Modes route, and existing
Zodiac routes are public and indexable. Each has one H1, localized metadata,
localized canonical identity, `hreflang` alternates, and sitemap coverage. Query
state on Sign Match is excluded from canonical identity. Discover remains an
internal product surface; V2 does not add it to primary navigation.

## 13. Editorial, safety, and scientific boundaries

Discover may explain traditional structural language, but it must not diagnose,
predict, prescribe, manipulate, or make medical, mental-health, financial, or
relationship decisions for a person. It must not use fear language, lucky
numbers or colors, rankings, or deterministic claims.

Neither feature calculates Sun position, current sky, houses, aspects, timezones,
transits, or ephemerides. No Engine, provider, BFF, contract, or dependency
change is authorized. The immutable system direction remains:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
→ AstronomyProvider
```

`PROVIDER DECISION DEFERRED` remains unchanged.

## 14. Accessibility and visual policy

Both selectors are native form controls with visible labels, keyboard support,
touch-safe sizing, and visible focus. Sign links remain ordinary crawlable links.
The matrix has meaningful table headers on desktop and a labeled, ordered stacked
view on narrow screens. No interaction depends on hover. Existing reduced-motion
and Light/Dark theme behavior remains authoritative.

The visual language remains Modern Observatory Astrology: glyphs, restrained
cyan hierarchy, precise panels, and the existing typography and contrast tokens.
No dating-app styling, compatibility meter, social card, animation library, or
decorative prediction device is introduced.

## 15. Non-goals and freeze

This document does not authorize Synastry, composite charts, Share Cards, Big
Three, Personal Sky, transits, notifications, horoscope prediction, new
calculation flows, or any change to Learn, Calculate, Chart Renderer, Vault,
Community, Practitioner, Auth, Feedback, Privacy, Engine integration, provider
selection, or deployment.
