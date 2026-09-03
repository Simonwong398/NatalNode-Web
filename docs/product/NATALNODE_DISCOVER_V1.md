# NatalNode Discover V1

Status: implementation baseline for Discover V1 and Zodiac Explorer.

## 1. Purpose

Discover is NatalNode’s approachable entry point for people who are curious about
astrology but are not ready to begin with a full natal-chart workflow. V1 offers
one real experience: a guided exploration of the twelve zodiac signs.

## 2. Acquisition role

Discover lowers the first interaction cost without lowering the product standard.
Its job is to create curiosity, teach a useful structural idea, and provide a
clear path toward Learn and Calculate. It is not a second chart calculator.

## 3. Core product rule

**DISCOVER SIMPLIFIES THE ENTRY POINT, NOT THE SCIENTIFIC STANDARD.**

The interface may be simple. Claims remain bounded, transparent, and consistent
with NatalNode’s calculation and provenance boundaries.

## 4. Relationship to Learn

Discover introduces the sign, element, and modality vocabulary at a low-friction
level. The Zodiac Explorer links to the canonical Foundations lesson for zodiac
structure. Discover does not copy, renumber, or modify Foundations content.

## 5. Relationship to Calculate

Discover offers a second path to the existing Calculate route. It does not collect
birth information, prefill a chart, infer a user’s sign, or suggest that a selected
sign is a calculated personal placement.

## 6. Simplified-lens policy

The selected sign is described as one structural layer of a natal chart. The
interface names the information it uses: stable sign taxonomy, element, modality,
glyph, and restrained editorial content. It does not present a complete natal
reading, personality diagnosis, or prediction.

## 7. Scientific boundary

Zodiac Explorer uses stable Web taxonomy and curated editorial content only. It
does not calculate Sun position, current positions, houses, aspects, transits,
timezones, or ephemerides, and it does not require the Engine at runtime.

The authoritative boundary remains:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
→ AstronomyProvider
```

`PROVIDER DECISION DEFERRED` remains unchanged.

## 8. Editorial and interpretation boundary

Structural statements identify a sign’s taxonomy. Traditional interpretive
language is qualified and kept subordinate to the structure. Copy uses placement
language and chart context rather than claims about people born under a sign.

The product must not diagnose, prescribe, predict, rank, or imply certainty.

## 9. Zodiac Explorer V1 scope

V1 includes:

- all twelve signs in canonical zodiac order;
- localized sign terminology and glyphs;
- element and modality for the selected sign;
- concise sign-specific structural copy;
- derived element and modality family membership;
- a localized Foundations bridge and the existing Calculate bridge;
- canonical localized sign routes for direct navigation.

V1 does not include date-range sign calculation, birth input, compatibility,
synastry, share-card generation, or live-sky data.

## 10. Taxonomy ownership

`core/astrology-taxonomy` remains authoritative for sign IDs, order, elements,
modalities, and glyph resolution. Discover derives relationship lists from that
taxonomy. Discover content is stored separately from the taxonomy, and interaction
is implemented separately from both.

## 11. Future Sign Match direction

Sign Match belongs to the next Discover campaign. Any future compatibility or
comparison experience must disclose its inputs and avoid percentages, rankings,
soulmate claims, or deterministic relationship conclusions. No Sign Match runtime
or UI is part of V1.

## 12. Future Share direction

Deep-linked sign pages keep future sharing possible without adding a share system
now. Share Cards, image export, downloadable graphics, and OG image generation
remain deferred to the dedicated share workstream.

## 13. Prohibited low-quality patterns

Discover must not add horoscope clickbait, deterministic personality claims,
fortune-telling, fear-based predictions, medical or psychological claims, lucky
numbers or colors, best/worst rankings, “toxic sign” lists, soulmate percentages,
or claims that one sign describes a whole person.

## 14. Localization policy

The supported locale set is exactly `en`, `es`, `fr`, `de`, `ja`, `ko`, and
`zh-Hant`. English is canonical; each V1 Discover route has an explicit localized
UI catalog entry and an admitted editorial content variant. `zh-Hans` is not
supported. URL locale wins, and each localized sign route has a localized canonical
URL and locale alternates.

## 15. SEO and indexability policy

Discover landing, Explorer, and sign pages are public and indexable. Each route has
one H1, meaningful crawlable text, a localized title and description, a localized
canonical URL, and valid `hreflang` alternates including `x-default`. Discover
routes are included in the public sitemap. No site-wide robots or staging policy is
changed.

## 16. Accessibility policy

The selector uses native buttons on the Explorer and native links on sign detail
pages. All twelve signs are reachable without hover, selected state is exposed with
`aria-pressed` or `aria-current`, glyphs are decorative beside visible names, and
focus-visible styles come from the shared shell. The grid remains usable at 320px
without horizontal scrolling.

## 17. Visual and motion policy

Discover uses the existing Modern Observatory Astrology language: shared typography,
panel hierarchy, borders, cyan accent, and first-class light/dark tokens. V1 adds
no continuous motion, wheel animation, or decorative library. The experience must
remain understandable with reduced motion enabled.

## 18. Tools relationship

Tools remains a reference and utility surface, including the existing Sign Lookup.
Discover is a guided consumer exploration surface with a profile, family context,
and bridges to Learn and Calculate. The Tools landing provides one restrained entry
path; existing Tools functionality is not deleted or cosmetically wrapped.

## 19. Non-goals and freeze

This document does not authorize changes to Calculate, Chart Renderer, Educational
Chart, Learn, Vault, Community, Practitioner, Feedback, Auth, Privacy, Public Sky,
Engine integration, providers, deployment, billing, or runtime configuration.

Do not begin Sign Match, Elements & Modes Explorer, Share Cards, Personal Sky, or
transits as part of Discover V1.
