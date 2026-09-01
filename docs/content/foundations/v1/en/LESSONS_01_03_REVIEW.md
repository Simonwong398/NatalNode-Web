---
title: "Foundations V1 Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
contentRevision: 2
publicationStatus: REVIEW
productionAdmission: NOT_APPROVED
documentKind: CONTENT_REVIEW_MANIFEST
---

# Foundations V1 Lessons 01–03 Review Manifest

## Review status and boundary

This manifest records the research and editorial review boundary for exactly three canonical-English Class C lesson drafts. It is a review artifact, not runtime content and not a publication approval. The three drafts use the frozen Foundations identities `foundations.v1`, `v1`, `en`, and content revision `2`.

The editorial revision is complete for this batch. It teaches the astrology first, keeps the astronomy/astrology boundary clear, and remains pending final editorial approval.

The drafts do not replace the existing Learn runtime scaffold. They do not change the lesson registry, route resolution, UI Catalog, progress state, final check, rewards, commercial state, API/BFF, Engine, calculation behavior, or localization runtime. No translation or multilingual adaptation was performed.

## Draft inventory

| Order | Lesson ID | Canonical title | Draft path | Approximate body words | Publication state | Production admission |
| ---: | --- | --- | --- | ---: | --- | --- |
| 1 | `foundations.natal_chart` | What a Natal Chart Actually Is | `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md` | ~1,226 | `REVIEW` | `NOT_APPROVED` |
| 2 | `foundations.zodiac_structure` | The Zodiac: Elements and Modes | `docs/content/foundations/v1/en/02-the-zodiac-structure.md` | ~1,338 | `REVIEW` | `NOT_APPROVED` |
| 3 | `foundations.chart_calculation` | How the Sky Becomes a Chart | `docs/content/foundations/v1/en/03-how-the-sky-becomes-a-chart.md` | ~1,426 | `REVIEW` | `NOT_APPROVED` |

Each draft contains exactly these nine pedagogical sections, in this order: Orientation; Core Concept; Professional Vocabulary; Example; My Chart; Practice; Check Understanding; Key Takeaway; Sources and Further Reading. Each contains exactly two Check Understanding questions with answers and explanations.

## Curriculum benchmark research

The four public curriculum references from WEB-LEARN-001C were reused for this editorial revision. No broad web research and no narrow source verification were performed for R1; no course prose was copied.

| Benchmark | Public source | How it informed this batch |
| --- | --- | --- |
| Faculty of Astrological Studies — Foundation Course | https://astrology.org.uk/astrology-learning-options/foundation-course/ | Existing source set for beginner progression from chart foundations and planets-signs-houses vocabulary into chart skills and interpretation. |
| Kepler College — RN101 Fundamentals I: Introduction to Astrology | https://www.keplercollege.org/wp-content/uploads/2024/08/Course-catalogue-2024-v24-08.pdf | Existing source set for astronomical underpinnings, natal-chart components, and bounded introductory interpretation. |
| Astrology University — Beginning Astrology: A Language of Life | https://www.astrologyuniversity.com/shop/search-by-astrologer/robert-blaschke-1/beginning-astrology-a-language-of-life/ | Existing source set for teaching elements and modes before planets, houses, and aspects. |
| The Astrology School — Hellenistic Astrology Course | https://courses.theastrologyschool.com/courses/hellenistic-astrology-course | Existing source set for naming school-level conventions rather than presenting one tradition as universal. |

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

## Editorial revision record

- Editorial revision completed for Lessons 01–03; all three remain canonical-English Class C review drafts.
- Lesson 02 title changed to **The Zodiac: Elements and Modes** without changing its semantic lesson ID.
- Polarity was removed as a primary lesson axis and reduced to a short optional school-level note. No glossary expansion or polarity semantic ID was added.
- Lesson 02 now teaches conventional interpretive vocabulary for Fire, Earth, Air, Water, Cardinal, Fixed, and Mutable, including an element × mode synthesis exercise.
- Lesson 03 was technically simplified around the birth-input-to-chart sequence. BFF/API, provider, and ownership language was removed from learner-facing prose; UT1/TT teaching was removed from the lesson body while the existing technical references remain traceable below.
- Cross-lesson repetition around calculation versus interpretation, unknown time, and epistemic safeguards was reduced while intentional reinforcement was retained.
- Narrow additional source verification: none. The existing WEB-LEARN-001C source set was reused.
- Unresolved review issues: final editorial approval is still required. The drafts remain outside production runtime and are not approved for translation or multilingual adaptation.

## Lesson-specific research notes

### Lesson 01 — `foundations.natal_chart`

- Editorial revision: added a beginner map of body/planet, sign, house, aspect, and angle so the learner can see how chart layers answer different questions.
- Core claim: a natal chart is a structured representation tied to a specific date, local time, and place; it is not a photograph or a complete account of a person.
- Boundary claim: calculation and interpretation remain distinct. `Calculated with astronomy. Interpreted through astrology.` is retained as a trust statement, not as a scientific-validation claim.
- Input-quality rule: unknown time remains unknown; noon, midnight, and other artificial substitutions are not used. Detailed time-sensitive consequences remain primarily in Lesson 03.
- Product behavior checked: chart type, returned chart layers, visible limitations, and the distinction between a returned chart fact and an interpretation. The internal chart-surface hook is not shown in learner-facing prose.
- Advanced topics intentionally omitted: predictive techniques, synastry, transits, dignity/condition, nodes, and personal chart speculation.

### Lesson 02 — `foundations.zodiac_structure`

- Editorial revision: title changed to **The Zodiac: Elements and Modes** while the semantic lesson ID remains unchanged.
- Core claim: the twelve signs are an astrological coordinate/category framework, distinct from IAU astronomical constellation regions.
- Current product claim: the learner-facing prose says only that NatalNode currently uses the tropical zodiac; internal enum and semantic-ID language is retained here for review traceability, not displayed as lesson instruction.
- Structural and teaching claim: Fire/Earth/Air/Water and Cardinal/Fixed/Mutable remain the current sign-grouping vocabulary. The revision adds conventional interpretive vocabulary for each and teaches element × mode composition without deterministic personality claims.
- Polarity decision: polarity is reduced to a short optional school-level note. No glossary expansion, no `sign_polarity.*` ID, no product field, and no polarity exercise were added.
- Product behavior checked: returned sign labels and the current glossary mapping for all twelve signs, four elements, three modalities, and Tropical. The internal chart-surface hook is not shown in learner-facing prose.

### Lesson 03 — `foundations.chart_calculation`

- Editorial revision: rebuilt the Core Concept around the beginner sequence birth date + local time + place → time normalization → astronomical positions → zodiac mapping → angles → house system → presentation → interpretation.
- Technical simplification: kept local civil time, historical timezone/DST nuance, ecliptic longitude, ASC/MC, the zenith distinction, and the three admitted house systems while removing UT1/TT teaching from the lesson body.
- Unknown-time rule: preserved the explicit no-noon/no-midnight rule and the limitation on Ascendant, Midheaven, houses, house cusps, and house-based interpretation.
- Product behavior checked only where learner use benefits: Calculation Details, returned values, selected house system, warnings, and unknown-time status. The Website API/BFF chain, provider language, and internal ownership decisions were removed from learner-facing prose and remain architecture concerns.
- Advanced topics intentionally omitted from the lesson body: provider names, implementation selection, accuracy benchmarks, extra house systems, predictive techniques, and unsupported chart points. Technical time references remain traceable in the review/source record.

## Class B terminology audit

The following is a review mapping of current glossary concepts to the revised lessons. Internal semantic IDs are not displayed in learner-facing prose. Science, time, provenance, and epistemic statuses remain boundary terms rather than invented astrology glossary IDs.

| Lesson | Current Class B concepts used |
| --- | --- |
| 01 | `chart_type.natal`; generic `body.*`, `sign.*`, `angle.ascendant`, `angle.midheaven`, `house.*`, and `house.cusp` concepts are taught without exposing IDs |
| 02 | The twelve `sign.*` identities, four `sign_element.*` concepts, three `sign_modality.*` concepts, and `zodiac_model.tropical` are mapped in review; IDs are not exposed in learner prose |
| 03 | `chart_type.natal`, `zodiac_model.tropical`, `angle.ascendant`, `angle.midheaven`, `house.cusp`, and the three admitted `house_system.*` concepts are mapped in review; IDs are not exposed in learner prose |

The generic words “body,” “zodiac sign,” “angle,” and “house” in Lesson 01 are explanatory Class C context around current product terminology; no new semantic IDs are created. The glossary-scope decision for this revision is sign polarity: the course scope permits a brief optional note, but the frozen V1 glossary has no admitted identity. No glossary task is opened and no product concept is silently created.

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
| Lesson 02 element interpretive vocabulary added as convention | PASS |
| Lesson 02 mode interpretive vocabulary added as convention | PASS |
| Element × mode synthesis taught without personality diagnosis | PASS |
| Polarity reduced to optional note and removed from title | PASS |
| Learner-facing internal hook IDs removed | PASS |
| Learner-facing BFF/provider/ownership language removed | PASS |
| Learner-facing UT1/TT teaching removed | PASS |
| Cross-lesson repetition reduced | PASS |
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
contentRevision       = 2
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
