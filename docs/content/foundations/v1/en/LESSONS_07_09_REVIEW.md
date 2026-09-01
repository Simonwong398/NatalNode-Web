---
title: "Foundations V1 Lessons 07–09 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
documentKind: CONTENT_REVIEW_MANIFEST
---

# Foundations V1 Lessons 07–09 Review Manifest

## Review status and authoring boundary

This manifest records the first canonical-English authoring batch for the structural bridge from chart bodies to later whole-chart work. It covers exactly three Class C Foundations lesson records: houses and angles in Lesson 07, Planet × Sign × House synthesis in Lesson 08, and major aspects in Lesson 09.

All three records are initial professional drafts at `contentRevision = 1` and `canonicalContentRevision = 1`. They remain `contentState = REVIEW` and are not runtime-admitted. `currentness = CURRENT` means the drafts are intended to represent the current canonical meaning for their frozen lesson identities; under the frozen availability rule, REVIEW content remains `UNAVAILABLE`.

`WEB-LEARN-003A` is content authoring only. No Product Owner approval was performed or claimed, no runtime registry/importer/route was changed, no translation was created, no Lesson 10–12 content was started, and no implementation or provider decision was introduced.

## Canonical English inventory

| Order | Lesson ID | Canonical title | Source path | Content revision | Approximate body words | Content state | Currentness | Runtime availability |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 7 | `foundations.houses_angles` | The Twelve Houses and the Angles | `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md` | 1 | ~1,656 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 8 | `foundations.planet_sign_house` | Planet × Sign × House | `docs/content/foundations/v1/en/08-planet-sign-house.md` | 1 | ~1,650 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 9 | `foundations.aspects` | Aspects: Relationships Between Planets | `docs/content/foundations/v1/en/09-aspects-relationships-between-planets.md` | 1 | ~1,653 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |

The file titles, semantic IDs, slugs, order, My Chart capabilities, and birth-time requirements follow the frozen repository registry. No title, slug, semantic ID, revision, or registry value was changed by this authoring batch.

## Pedagogical and scope audit

Each lesson uses the established nine-section sequence, in order:

1. Orientation
2. Core Concept
3. Professional Vocabulary
4. Example
5. My Chart
6. Practice
7. Check Understanding
8. Key Takeaway
9. Sources and Further Reading

Each lesson contains exactly two Check Understanding questions, each with a correct answer and concise explanation. The examples are synthetic and keep chart facts separate from interpretive commentary.

### Lesson 07 — `foundations.houses_angles`

- Houses are taught as twelve ordered chart-space sectors, distinct from zodiac signs and chart bodies.
- Houses 1–12 receive concise conventional domains, not twelve deterministic personality or event descriptions.
- ASC, DSC, MC, and IC are named and explained as two opposite axes: `ASC ↔ DSC` and `MC ↔ IC`.
- The MC is described through the ecliptic/local-meridian and upper-culmination relationship and is explicitly kept distinct from the astronomical zenith.
- House, house cusp, angle, and sign are distinguished; not every cusp is an angle.
- Only Placidus, Whole Sign, and Equal House are introduced, with neutral language about differing boundaries and placements.
- Reliable birth time and location are identified as generally necessary for reliable house/angle claims. Unknown time remains unknown; no noon, midnight, or fabricated angle/house is used.
- The signs-versus-houses misconception and the “natural zodiac” oversimplification are corrected.
- An empty house is explained as a present but body-free sector, not an absent or irrelevant life domain.

### Lesson 08 — `foundations.planet_sign_house`

- Body/function, sign/style, and house/context remain separate before cautious combination.
- “What / how / where” is explicitly labeled a beginner interpretive scaffold, not a complete or universal formula.
- The order is body/function → sign/style → supported house/context → cautious combination → qualification.
- Synthetic comparisons show the same Sun with a changed sign and with a changed house, without cookbook conclusions.
- The lesson states that aspects, chart priorities, and whole-chart synthesis remain later context.
- When reliable birth time is unavailable, supported body/sign facts may be used while the house layer remains unavailable or qualified; no substitute time is introduced.

### Lesson 09 — `foundations.aspects`

- Aspect geometry is separated from astrological interpretation.
- The frozen five-aspect set is used: conjunction 0°, opposition 180°, square 90°, trine 120°, sextile 60°.
- Conjunction, opposition, square, trine, and sextile are framed with nuanced conventional vocabulary rather than good/bad formulas.
- Orb is introduced as target-angle tolerance without a universal table or implementation disclosure.
- Applying, exact, and separating are introduced only at the frozen Foundations vocabulary level; no phase algorithm is invented.
- Manual longitude checks are included for conjunction, opposition, square, trine, and sextile examples.
- Minor aspects, harmonics, declination relationships, midpoints, aspect patterns, complex orb weighting, and scoring are not introduced.

## Terminology and glossary considerations

The drafts reuse the existing glossary families and do not modify the runtime glossary or create new semantic IDs.

| Lesson | Existing concepts used or mapped in review |
| --- | --- |
| 07 | `angle.ascendant`, `angle.midheaven`, `house.1`–`house.12`, `house.cusp`, `house_system.placidus`, `house_system.whole_sign`, `house_system.equal`; horizon, meridian, and zenith remain science/geometry boundary terms. |
| 08 | Generic body/sign/house layers and the registry-supported `body.sun`, `sign.aries`, `house.1` concepts; the “interpretive scaffold” and synthesis prose remain Class C, not glossary entries. |
| 09 | `aspect.conjunction`, `aspect.opposition`, `aspect.square`, `aspect.trine`, `aspect.sextile`, `aspect.orb`, `aspect_phase.applying`, `aspect_phase.exact`, and `aspect_phase.separating`. |

The frozen glossary currently defers `angle.descendant` and `angle.imum_coeli` because the current Web contract/surfaces do not represent them. This task explicitly requires the four-angle teaching coverage, so DSC/Descendant and IC/Imum Coeli are used only in these learner-facing drafts and are recorded here as a potential glossary-governance gap for later owner decision. No glossary runtime term, contract field, or semantic ID was added. The drafts also use descriptive language for houses associated with angles without admitting an angular/succedent/cadent classification.

## Research, sources, and evidence lanes

No uncontrolled broad research was performed. The authoring reused the existing Foundations source set and performed narrow manual verification of the requested chart geometry and terminology boundaries. The source sections in each lesson identify the public references used for the relevant beginner vocabulary.

| Evidence lane | Sources or authority reused | Use in this batch |
| --- | --- | --- |
| Astrology conventions | Faculty of Astrological Studies Foundation Course; Astrodienst, *A Brief Introduction to Astrology*; Skyscript houses references; Astrology University beginner course; The Astrology School course | Introductory house domains, angle/axis language, house-system descriptions, Planet × Sign × House teaching, and major-aspect interpretive vocabulary. |
| Astronomy/geometry boundary | NASA reference-system and ecliptic overviews; already-approved Lesson 03 angle/zenith boundary | Ecliptic/horizon/meridian wording and separation of chart geometry from astrological meaning. |
| NatalNode product behavior | `docs/PRD.md`; `docs/product/NATALNODE_FOUNDATIONS_V1.md`; `docs/architecture/NATALNODE_LEARNING_ARCHITECTURE_V1.md`; `docs/product/NATALNODE_ASTROLOGY_GLOSSARY_V1.md`; `docs/product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`; frozen `apps/web/src/features/learn/foundations/registry.ts` | Lesson identity, revision/state model, My Chart hooks, birth-time behavior, glossary boundary, source-of-truth and no-runtime-change constraints. |

The three lanes remain distinct. Astronomy/geometry references support statements about coordinate and local-sky relationships; astrology sources support conventional interpretive language; NatalNode documents support product behavior and epistemic limits. No lesson implies that astronomical precision scientifically validates astrological interpretation.

## Geometry checks

### Lesson 07 axis example

- 14° Gemini = 74° and 14° Sagittarius = 254°; the difference is 180°, so the synthetic ASC/DSC pair is opposite.
- 3° Aquarius = 303° and 3° Leo = 123°; the smaller separation is 180°, so the synthetic MC/IC pair is opposite.

### Lesson 09 aspect examples

| Pair | Longitudes | Smallest separation | Target | Result |
| --- | --- | ---: | ---: | --- |
| Sun 20° Taurus / Mercury 22° Taurus | 50° / 52° | 2° | 0° | conjunction within 2° orb |
| Sun 10° Aries / Moon 10° Libra | 10° / 190° | 180° | 180° | opposition |
| Mars 15° Cancer / Saturn 15° Libra | 105° / 195° | 90° | 90° | square |
| Venus 12° Leo / Jupiter 12° Sagittarius | 132° / 252° | 120° | 120° | trine |
| Mercury 5° Gemini / Venus 5° Leo | 65° / 125° | 60° | 60° | sextile |

All stated degree relationships were checked manually using the zodiac order. The first pair is intentionally near, not exact; no universal orb table is asserted.

## Evidence-lane and cross-lesson safety audit

| Check | Result |
| --- | --- |
| Houses distinct from signs and bodies | PASS |
| Twelve-house coverage remains introductory | PASS |
| Four angle names and two axis relationships included | PASS |
| MC kept distinct from zenith | PASS |
| Angle, cusp, house, and sign terminology separated | PASS |
| Only Placidus, Whole Sign, and Equal House referenced | PASS |
| Unknown birth time preserved without substitution | PASS |
| Natural-zodiac identity misconception corrected | PASS |
| Empty-house misconception corrected without rulership expansion | PASS |
| Planet/sign/house layers separated before synthesis | PASS |
| Bounded, non-cookbook Planet × Sign × House examples | PASS |
| House-unavailable behavior preserved | PASS |
| Five frozen major aspects only | PASS |
| Aspect degrees and manual examples checked | PASS |
| Orb introduced without provider/algorithm disclosure | PASS |
| Applying/exact/separating kept introductory | PASS |
| Square/trine/conjunction not reduced to good/bad formulas | PASS |
| Aspect interpretation tied to bodies and wider context | PASS |
| Advanced aspect topics omitted | PASS |
| Calculation facts separated from interpretation | PASS |
| Responsible non-deterministic language | PASS |
| Causal planetary-force claims | NO |
| Scientific-validation implication | NO |
| Famous-person chart speculation | NO |
| External course prose copied | NO |
| Translation performed | NO |
| Product Owner approval performed or claimed | NO |
| Runtime admission performed | NO |
| Runtime source changed | NO |
| Lessons 01–06 changed | NO |
| Lessons 10–12 started | NO |
| UI/CSS/API/BFF/commercial/database/Engine work | NO |

## My Chart, localization, and publication boundary

The frozen hooks are preserved as review metadata only:

| Lesson | My Chart hook | Birth-time requirement |
| --- | --- | --- |
| 07 | `my_chart.houses_angles` | `REQUIRED_FOR_TIME_DEPENDENT_FACTS` |
| 08 | `my_chart.placement` | `REQUIRED_FOR_TIME_DEPENDENT_FACTS` |
| 09 | `my_chart.major_aspects` | `NOT_REQUIRED` |

The lessons contain no personal chart data and do not implement the hooks. No non-English variant was authored or translated. These canonical-English Class C drafts are not approved, not runtime-admitted, and do not satisfy the seven-locale Foundations Core gate.

## Files in this authoring batch

Exactly these four new documentation files belong to `WEB-LEARN-003A`:

1. `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/en/08-planet-sign-house.md`
3. `docs/content/foundations/v1/en/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/en/LESSONS_07_09_REVIEW.md`

No existing lesson, runtime registry, route, importer, UI, CSS, glossary implementation, server, API/BFF, database, migration, Auth, Vault, Feedback, Notification, Commercial, Engine, provider, translation, or deployment file belongs to this batch. `C:\NatalNode` is outside scope and was not accessed.
