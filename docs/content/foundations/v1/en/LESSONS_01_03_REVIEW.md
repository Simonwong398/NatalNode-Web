---
title: "Foundations V1 Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
contentRevision: 1
publicationStatus: REVIEW
productionAdmission: NOT_APPROVED
documentKind: CONTENT_REVIEW_MANIFEST
---

# Foundations V1 Lessons 01–03 Review Manifest

## Review status and boundary

This manifest records the research and editorial review boundary for exactly three canonical-English Class C lesson drafts. It is a review artifact, not runtime content and not a publication approval. The three drafts use the frozen Foundations identities `foundations.v1`, `v1`, `en`, and content revision `1`.

The drafts do not replace the existing Learn runtime scaffold. They do not change the lesson registry, route resolution, UI Catalog, progress state, final check, rewards, commercial state, API/BFF, Engine, calculation behavior, or localization runtime. No translation or multilingual adaptation was performed.

## Draft inventory

| Order | Lesson ID | Canonical title | Draft path | Approximate body words | Publication state | Production admission |
| ---: | --- | --- | --- | ---: | --- | --- |
| 1 | `foundations.natal_chart` | What a Natal Chart Actually Is | `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md` | ~1,295 | `REVIEW` | `NOT_APPROVED` |
| 2 | `foundations.zodiac_structure` | The Zodiac: Polarity, Elements, and Modes | `docs/content/foundations/v1/en/02-the-zodiac-structure.md` | ~1,387 | `REVIEW` | `NOT_APPROVED` |
| 3 | `foundations.chart_calculation` | How the Sky Becomes a Chart | `docs/content/foundations/v1/en/03-how-the-sky-becomes-a-chart.md` | ~1,688 | `REVIEW` | `NOT_APPROVED` |

Each draft contains exactly these nine pedagogical sections, in this order: Orientation; Core Concept; Professional Vocabulary; Example; My Chart; Practice; Check Understanding; Key Takeaway; Sources and Further Reading. Each contains exactly two Check Understanding questions with answers and explanations.

## Curriculum benchmark research

The four required public curriculum references were consulted on 2026-08-31. They were used to validate sequencing, scope, and depth only; no course prose was copied.

| Benchmark | Public source | How it informed this batch |
| --- | --- | --- |
| Faculty of Astrological Studies — Foundation Course | https://astrology.org.uk/astrology-learning-options/foundation-course/ | Supported a beginner progression from chart/celestial foundations and the planets-signs-houses vocabulary into chart skills, time/space, angles, and later interpretation. This batch keeps the first three lessons structural and technical before later planet/house/aspect lessons. |
| Kepler College — RN101 Fundamentals I: Introduction to Astrology | https://www.keplercollege.org/wp-content/uploads/2024/08/Course-catalogue-2024-v24-08.pdf | Validated starting with the astronomical underpinnings and core natal-chart components, then combining them for a basic bounded interpretation. The draft intentionally omits the catalog's later dignities/dispositors and other out-of-scope material. |
| Astrology University — Beginning Astrology: A Language of Life | https://www.astrologyuniversity.com/shop/search-by-astrologer/robert-blaschke-1/beginning-astrology-a-language-of-life/ | Validated a distinct beginner order of elements/modes/signs before planets, houses, and aspects. Lesson 02 therefore teaches classification before interpretation and does not collapse the groupings into traits. |
| The Astrology School — Hellenistic Astrology Course | https://courses.theastrologyschool.com/courses/hellenistic-astrology-course | Validated that traditional/Hellenistic study has its own historical, philosophical, and technical progression. The draft uses this as a boundary reminder to name school-level convention and not present modern or traditional doctrine as the only universal reading. |

## Public source and evidence-lane matrix

The source lists in each lesson carry the required title, organization/author, URL, source type, and claim note. The following matrix summarizes their role.

| Lesson | Astrology education/reference sources | Astronomy/time/technical sources | NatalNode internal sources |
| --- | --- | --- | --- |
| 01 | Faculty Foundation Course; Astrodienst, A Brief Introduction to Astrology | NASA Science, Chapter 2: Reference Systems; NASA, What Is the Plane of the Ecliptic? | Foundations V1 product freeze; PRD |
| 02 | Faculty Foundation Course; Skyscript Lessons 3 and 8; Astrology University beginner course | IAU astroEDU, What Is a Constellation?; IAU Astronomy FAQs | Astrology Glossary V1 |
| 03 | Faculty Foundation Course; Skyscript Lesson 5 and Houses; The Astrology School Hellenistic course | NASA Reference Systems; NASA ecliptic overview; USNO Julian Date, UT, TT, and glossary; IANA Time Zones and `tz` theory | Learning Architecture V1; PRD |

The three evidence lanes remain separate:

1. **Astronomical/calculation facts:** NASA, IAU, USNO, and IANA sources plus the Web's frozen contracts support ecliptic, time-scale, local-time, and historical-time explanations.
2. **Astrology conventions:** Faculty, Kepler, Astrology University, The Astrology School, Astrodienst, and Skyscript sources support the explicitly scoped chart, zodiac, sign-grouping, angle, and house vocabulary.
3. **NatalNode product behavior:** the PRD and frozen Foundations/learning/glossary documents support identities, hooks, unknown-time handling, provider neutrality, status/provenance boundaries, and current admitted terminology.

## Lesson-specific research notes

### Lesson 01 — `foundations.natal_chart`

- Core claim: a natal chart is a structured representation tied to a specific date, local time, and place; it is not a photograph or a complete account of a person.
- Boundary claim: calculation, input/provenance, and interpretation are different layers. `Calculated with astronomy. Interpreted through astrology.` is retained as a trust statement, not as a scientific-validation claim.
- Input-quality rule: unknown time remains unknown; noon, midnight, and other artificial substitutions are expressly prohibited.
- Product behavior checked: `my_chart.chart_structure`, chart type `natal`, the Engine-owned facts boundary, warnings/status, and unavailable/incomplete metadata behavior.
- Advanced topics intentionally omitted: predictive techniques, synastry, transits, dignity/condition, nodes, and personal chart speculation.

### Lesson 02 — `foundations.zodiac_structure`

- Core claim: the twelve signs are an astrological coordinate/category framework, distinct from IAU astronomical constellation regions.
- Current product claim: NatalNode's current sky-facing contract/glossary represents `TROPICAL` as `zodiac_model.tropical`. The lesson does not infer an algorithm or scientific reference frame from that enum.
- Structural claim: Fire/Earth/Air/Water and Cardinal/Fixed/Mutable are the current admitted element and modality vocabulary. The full twelve-sign classification is given as a table.
- Polarity note: the frozen Foundations course scope names polarity, but the frozen Class B glossary does not admit a `sign_polarity.*` ID. The draft labels polarity as a school-dependent, content-level review candidate and does not emit it as product terminology.
- Safety rule: no deterministic personality, moral ranking, causal force, or stereotype claims.
- Product behavior checked: `my_chart.zodiac_structure` and current glossary IDs for all twelve signs, four elements, three modalities, and Tropical.

### Lesson 03 — `foundations.chart_calculation`

- Core claim: the high-level sequence is local civil input → historical time normalization → astronomical position values → zodiac mapping → local angles/house convention → presentation → interpretation.
- Time claim: local time is not UTC; IANA location rules and historical DST transitions can produce ambiguity or nonexistent local times. USNO materials distinguish UTC, UT1, and TT; the draft does not prescribe a calculation implementation.
- Geometry claim: ecliptic longitude is a coordinate; Ascendant and Midheaven are chart angles tied to local horizon/meridian geometry. Midheaven is not equated with the astronomical zenith.
- House claim: only Placidus, Whole Sign, and Equal House are introduced, matching the current Web's admitted options. No house algorithm is described or implemented.
- Product behavior checked: `my_chart.calculation_details`, the Website API/BFF → NatalNode Engine Public API boundary, `UNKNOWN_TIME`, `INCOMPLETE_RESEARCH`, unavailable identifiers, warnings, and `PROVIDER DECISION DEFERRED`.
- Advanced topics intentionally omitted: provider names, ephemeris implementation selection, accuracy benchmarks, extra house systems, predictive techniques, and unsupported chart points.

## Class B terminology audit

The lesson prose uses the following current glossary concepts. Science, time, provenance, and epistemic statuses are kept as boundary terms rather than being invented as astrology glossary IDs.

| Lesson | Current Class B concepts used |
| --- | --- |
| 01 | `chart_type.natal`; `body.*` and `sign.*` are used only as generic vocabulary examples, not as a complete placement lesson; `angle.ascendant`; `angle.midheaven`; `house.*`; `house.cusp` |
| 02 | `sign.aries`, `sign.taurus`, `sign.gemini`, `sign.cancer`, `sign.leo`, `sign.virgo`, `sign.libra`, `sign.scorpio`, `sign.sagittarius`, `sign.capricorn`, `sign.aquarius`, `sign.pisces`; `sign_element.fire`, `sign_element.earth`, `sign_element.air`, `sign_element.water`; `sign_modality.cardinal`, `sign_modality.fixed`, `sign_modality.mutable`; `zodiac_model.tropical` |
| 03 | `chart_type.natal`; `zodiac_model.tropical`; `angle.ascendant`; `angle.midheaven`; `house.cusp`; `house_system.placidus`; `house_system.whole_sign`; `house_system.equal` |

The generic words “body,” “zodiac sign,” “angle,” and “house” in Lesson 01 are explanatory Class C context around current product terminology; no new semantic IDs are created. The glossary-scope review candidate discovered in this batch is sign polarity: the course scope names it, but the frozen V1 glossary has no admitted identity. A later glossary task may decide whether it needs a stable ID; this content draft does not silently create one.

## Cross-lesson safety audit

| Check | Result |
| --- | --- |
| Astronomy and astrology evidence lanes separated | PASS |
| NatalNode product-behavior lane separated | PASS |
| Calculation versus interpretation boundary preserved | PASS |
| Unknown birth time preserved without substitution | PASS |
| Signs distinguished from astronomical constellations | PASS |
| Tropical statement tied to current Web behavior | PASS |
| Historical timezone/DST nuance included | PASS |
| Midheaven kept distinct from astronomical zenith | PASS |
| Only Placidus, Whole Sign, and Equal House introduced | PASS |
| Provider/algorithm/accuracy details disclosed | NO |
| Deterministic or essentialist personality language | NO |
| Causal planetary-force claim | NO |
| Scientific-validation implication | NO |
| Famous-person chart speculation | NO |
| External course prose copied | NO |
| Translation or runtime localization performed | NO |
| P1/P2/P3 feature work performed | NO |

## Publication and runtime gate

All three lesson files declare:

```text
courseId              = foundations.v1
courseVersion         = v1
canonicalLocale       = en
contentRevision       = 1
contentState          = REVIEW
publicationStatus     = REVIEW
productionAdmission   = NOT_APPROVED
```

These drafts are not `APPROVED`, `APPROVED_CURRENT`, or `CURRENT_FOR_PRODUCTION`. They must not be admitted to the Foundations runtime or represented as satisfying the seven-locale Core gate until accountable content/professional review and the frozen publication checks are complete. No translation, multilingual adaptation, or runtime content-state change is part of this batch.

## Files in this review batch

Exactly these four documentation files are intended for this task:

1. `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/en/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/en/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/en/LESSONS_01_03_REVIEW.md`

No `.gitkeep`, runtime source, route, style, package, test, API, BFF, database, migration, Engine, provider, or translation file belongs to this batch.
