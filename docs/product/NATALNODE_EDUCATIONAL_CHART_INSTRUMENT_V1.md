# NatalNode Educational Chart Instrument V1

Status: implemented as the first Learn product-surface consumer of Chart Core.

## Purpose

Learn uses a fixed teaching example to introduce four structural layers of a
chart: planets, signs, houses, and aspects. The instrument is a guided view of
supplied chart facts, not a live-sky view, a user's chart, or an interpretation
surface.

The Learn hero remains content-first. Its existing editorial eyebrow, heading,
supporting copy, and page links remain the source of the page hierarchy. The
educational instrument replaces the large hero teaching surface while the
existing dynamic NatalNode brand instrument remains in the repository for its
other approved uses.

## Ownership and boundaries

- `apps/web/src/core/chart/ChartRenderer.tsx` remains the single shared SVG
  renderer.
- `ChartSemanticFocus` is an optional presentation hint owned by Chart Core.
  Its default is `none`, and it does not change chart facts, geometry, SVG
  dimensions, or the existing presentation policy.
- `apps/web/src/features/learn/EducationalChartInstrument.tsx` owns selected
  focus, hover preview, controls, localized structural copy, and Foundation
  links. It does not own chart geometry, astrology taxonomy, or scientific
  calculation.
- Learn obtains the teaching result through the existing asynchronous
  `MockEngineClient` boundary during Astro rendering. The browser component
  receives the returned result and does not call an Engine or calculate facts.

## Teaching layers

The default overview keeps all supplied layers visible. Selecting or previewing
a layer changes only emphasis through presentation styling:

| Layer | Emphasized surface | Foundation registry hook |
| --- | --- | --- |
| Planets | supplied bodies, glyphs, locations, and labels | `PLANET_OVERVIEW` |
| Signs | supplied zodiac sectors and glyphs | `ZODIAC_STRUCTURE` |
| Houses | supplied house divisions, labels, ASC, and MC | `HOUSES_AND_ANGLES` |
| Aspects | supplied aspect paths and their body endpoints | `MAJOR_ASPECTS` |

The Foundation links are resolved from the existing registry by hook capability;
slugs are not guessed, changed, or renumbered. The houses layer is shown only
because the canonical fixture includes legitimate house and angle facts and the
showcase policy permits them.

## Interaction and accessibility

Desktop pointer hover provides a temporary preview. Pointer exit restores the
pinned selection. Click pins a layer; clicking the pinned layer again returns
to the overview. On touch layouts, tapping the semantic buttons is sufficient;
the feature does not depend on hover. Native buttons provide Enter and Space
keyboard behavior, `aria-pressed` exposes the pinned state, and visible focus
styles remain available. The changing structural explanation is announced
politely without adding predictive, diagnostic, or deterministic personal
meaning.

The instrument uses the existing seven-locale UI catalog: `en`, `es`, `fr`,
`de`, `ja`, `ko`, and `zh-Hant`. No `zh-Hans` catalog or live-language path is
introduced. Reduced-motion rules remove the new emphasis transitions while
leaving layout and facts unchanged.

## Fixture and science boundary

The source result is the existing `WEB_UI_FIXTURE_V1` returned by
`MockEngineClient`. Its incomplete-research status, warnings, null scientific
identities, supplied bodies, houses, angles, and aspects remain unchanged.
The fixed request exists only to satisfy the current `EngineClient` contract;
the mock ignores it. No astronomy dependency, provider selection, timezone
resolution, data fabrication, or request-derived chart fact is introduced.

Provider selection remains deferred: `PROVIDER DECISION DEFERRED`.

## Non-goals

This slice does not implement Birth Input, HTTP or production Engine
integration, Chart Renderer geometry, chart interpretation, live transits,
Discover, authentication, Vault, BFF, or any new product feature outside the
Learn hero instrument.
