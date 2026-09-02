# NatalNode Foundations V1 Product and Curriculum Freeze

**Status:** FROZEN PRODUCT / CURRICULUM BASELINE
**Task:** `WEB-LEARN-001A`
**Source of truth:** [`docs/PRD.md`](../PRD.md)
**Related localization policy:** [`NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`](./NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md)
**Related learning architecture:** [`NATALNODE_LEARNING_ARCHITECTURE_V1.md`](../architecture/NATALNODE_LEARNING_ARCHITECTURE_V1.md)
**Scope:** NatalNode Foundations V1 product positioning, curriculum sequence, pedagogy, content quality, learner state, assessment, reward policy, and future implementation boundary
**Date:** 2026-08-31

This document freezes the product and learning-content architecture for the
first concrete NatalNode Foundations course. It does not publish lesson prose,
implement a Learn runtime, create a course database, or authorize any
commercial entitlement write. It is a product/content decision record for a
later separately scoped implementation.

## Current launch-readiness implementation amendment

The implementation-deferred statements above are historical scope boundaries.
The approved Foundations Core is now available locally as `12 x 7 = 84/84`,
with authenticated progress and assessment runtime covered by later approved
tracks. This document still does not authorize new course content or feature
expansion. Account-erasure and launch-gate treatment are consolidated in
[`NATALNODE_P0_LAUNCH_READINESS_V1.md`](./NATALNODE_P0_LAUNCH_READINESS_V1.md).

Normative words in this document have their usual meanings: **MUST**,
**MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**, **DEFERRED**, and
**FROZEN**.

## 1. Product decision summary

NatalNode Foundations V1 is one beginner course with exactly twelve lessons.
It teaches the vocabulary and structure needed to approach a natal chart with
clarity, while keeping calculated facts distinct from astrological
interpretation.

The course is:

- self-paced and revisitable;
- browsable out of order;
- presented with a recommended sequence rather than hard prerequisites;
- grounded in the chart concepts already admitted to the Web glossary and
  current contracts; and
- deliberately small enough to establish a coherent foundation without
  turning V1 into an astrology encyclopedia.

The fixed product promise is:

> Learn the structure of a natal chart, understand its professional language,
> and practice a careful path from chart facts to interpretation.

The course does not claim professional certification, scientific validation of
astrology, predictive certainty, or a substitute for qualified medical,
legal, financial, or mental-health advice.

### 1.1 Frozen scope boundary

Foundations V1 includes only the twelve-lesson backbone in Section 5, the
pedagogical template in Section 6, the final check in Section 10, and the
completion reward policy in Section 11. The following remain outside this
freeze:

- all twelve lesson bodies and final-check question bodies;
- runtime course or lesson UI;
- progress APIs, persistence, migrations, or analytics implementation;
- chart calculation, chart rendering, Birth Input, or Engine integration;
- a second terminology dictionary or an unapproved glossary expansion;
- advanced techniques such as transits, synastry, solar returns, profections,
  lots, minor aspects, or a full dignity curriculum;
- a new subscription, tier, purchase flow, or reward clock; and
- Learn search, filtering, or broad editorial redesign.

## 2. Audience, role, and relationship to Learn

Foundations is the structured entry point for:

1. a complete beginner who needs a vocabulary and a reliable order of
   operations;
2. a returning learner who wants to consolidate existing informal knowledge;
3. a NatalNode chart user who wants to understand what the chart surface is
   showing; and
4. an astrology-curious reader who wants a clear boundary between astronomy,
   calculation, convention, and interpretation.

Learn remains a Class C editorial/professional-content surface. Class A
interface labels, Class B professional terms, and Class C lesson content must
remain separate even when they appear on the same page. Professional terms in
lesson content must use the approved production glossary from
`NATALNODE_ASTROLOGY_GLOSSARY_V1.md` and its admitted multilingual variants;
Foundations does not create a competing terminology source.

The existing NatalNode visual language and editorial shell remain
authoritative. This freeze does not redesign the Learn landing page, change
existing article metadata, or prescribe a new visual component system.

## 3. Benchmark method and copyright boundary

The benchmark used publicly available course descriptions and curriculum
outlines from four reputable astrology education providers. The comparison is
limited to structure, sequencing, learner level, pedagogy, practice,
assessment, and stated outcomes. It does not reproduce lesson prose,
interpretations, worksheets, quizzes, handouts, paid materials, or long
excerpts.

The public pages were inspected on 2026-08-31. Public course structures can
change; the URLs below are evidence for this freeze, not a claim that NatalNode
is affiliated with any provider.

### 3.1 Required curriculum benchmark

| Provider and course | Public structure and audience | Sequence and learning pattern observed | NatalNode decision |
|---|---|---|---|
| [Faculty of Astrological Studies — Foundation Course](https://astrology.org.uk/astrology-learning-options/foundation-course/) | Beginner-friendly Foundation Course presented as three core modules, with optional practice and formal examination/credit pathways. It also serves learners consolidating prior study. | Starts with chart construction, astronomical foundations, planets, signs, and houses; moves to time/space, angles, aspects, and the Sun–Moon relationship; then develops calculation, retrograde, hand-drawn chart, and whole-chart interpretation skills. It combines self-study material, quizzes, exercises, reflection, and tutor feedback. | Adopt staged movement from chart structure to components to synthesis; include practice and whole-chart work; keep formal qualification and tutor workflow out of V1. Do not copy its module text, examination materials, or advanced topics. |
| [Kepler College — RN101 Fundamentals I: Introduction to Astrology](https://www.keplercollege.org/wp-content/uploads/2024/08/Course-catalogue-2024-v24-08.pdf) | RN101 is a no-prerequisite introductory course within a larger Fundamentals Certificate. The public catalog describes core natal-chart components and the learner outcome of a basic coherent synthesis. | Connects astronomical underpinnings with planets, signs, houses, major aspects, retrograde, historical/modern approaches, and comparison of methods. It explicitly frames how individual pieces combine for interpretation and acknowledges differing approaches. | Adopt component-to-synthesis learning outcomes, explicit tradition comparison, and an early distinction between facts and interpretive methods. Do not import the full certificate, proprietary teaching materials, dignities, dispositors, or specialized techniques into Foundations V1. |
| [Astrology University — Beginning Astrology: A Language of Life](https://www.astrologyuniversity.com/shop/search-by-astrologer/robert-blaschke-1/beginning-astrology-a-language-of-life/) | An originally eight-week beginner workshop, also positioned as a review course. The public outline is organized week by week and includes homework/handout material. | Moves from elements, modes, and signs to planets and houses; introduces major aspects before minor aspects and patterns; then covers chart emphases, lunar phases, and student chart examples. | Adopt a compact cadence, deliberate vocabulary build-up, major-aspect-first ordering, worked examples, and learner practice. Do not copy the recording, handouts, homework, minor-aspect scope, or distinctive interpretive teaching. |
| [The Astrology School — Hellenistic Astrology Course](https://courses.theastrologyschool.com/courses/hellenistic-astrology-course) | A broad online course for newer and experienced learners, publicly organized into an orientation plus thirteen parts. It is explicitly historical, philosophical, and technical, with a certificate of completion. | Places history and philosophy before planets, signs, configurations, houses/places, and later traditional techniques. It uses quizzes, live Q&A, reading groups, diagrams, text study, and many chart examples. | Adopt an explicit multi-school/history boundary, the idea that methods need context, regular formative checks, and chart examples. Do not turn a traditional-school curriculum or its proprietary readings, texts, techniques, or advanced sequence into the Foundations core. |

No additional curriculum was required for this freeze. The four required
benchmarks are sufficient to establish the common beginner backbone and the
important differences between modern, academic, and traditional teaching
paths.

### 3.2 Benchmark synthesis

The common beginner pattern is:

```text
chart structure and inputs
    -> vocabulary: signs and planets
    -> houses and relationships between factors
    -> examples and bounded practice
    -> whole-chart synthesis
    -> method, uncertainty, and responsible use
```

The sources disagree on timing, house doctrine, traditional versus modern
emphasis, the breadth of planets and points, and how much calculation or
prediction belongs in a foundation course. Foundations therefore teaches
shared beginner concepts first and names school-dependent choices when they
matter. It does not present one provider, school, or interpretive authority as
the exclusive meaning of astrology.

## 4. Learning outcomes

After completing Foundations V1, a learner should be able to:

1. identify the principal parts of a natal chart and read common chart
   notation without treating a glyph or display label as a scientific claim;
2. explain the beginner-level roles of planets, zodiac signs, houses, and
   aspects as distinct layers of an astrological model;
3. describe polarity, elements, and modes as zodiac-organization vocabulary;
4. explain how date, local time, and place become chart input and why time-zone
   and historical-time handling matter to a calculated result;
5. distinguish `CALCULATED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, and
   `RESEARCH` information, including the rule: “Calculated with astronomy.
   Interpreted through astrology.”;
6. read the notation for the ten admitted chart bodies, the twelve signs,
   angles, houses, five major aspects, orb, and available aspect phase without
   expanding the admitted production glossary;
7. combine a planet, its sign, and its house as a beginner-level
   `Planet × Sign × House` synthesis, while stating which inputs support the
   claim;
8. recognize conjunction, opposition, trine, square, and sextile as the five
   Foundations major-aspect types and understand `Orb`, `Applying`, `Exact`,
   and `Separating` as controlled professional vocabulary;
9. use a repeatable whole-chart workflow that prioritizes clear, supported
   signals over an unbounded list of placements; and
10. approach astrology responsibly: preserve uncertainty, avoid fatalistic or
    diagnostic claims, distinguish traditions, and keep agency with the
    person reading the chart.

These are learning outcomes, not a promise that a learner is qualified to
practice professionally or to make high-stakes decisions for another person.

## 5. Frozen twelve-lesson backbone

The following order and titles are frozen. A learner may open any lesson at
any time. The order is a recommended learning path, not an access-control
graph.

| # | Stable lesson ID | Frozen title | Coverage and outcome | Practice/check emphasis | Conceptual My Chart hook |
|---:|---|---|---|---|---|
| 1 | `foundations.natal_chart` | What a Natal Chart Actually Is | Establish the chart as a structured representation; name inputs, chart layers, and the calculation/interpretation boundary. | Label chart regions and sort examples into calculated versus interpreted. | `my_chart.chart_structure` |
| 2 | `foundations.zodiac_structure` | The Zodiac: Polarity, Elements, and Modes | Introduce the twelve-sign framework and its polarity, element, and mode groupings without turning groupings into personality determinism. | Classify sign-group examples and explain what the grouping does and does not establish. | `my_chart.zodiac_structure` |
| 3 | `foundations.chart_calculation` | How the Sky Becomes a Chart | Explain the high-level date/time/place input path, time-zone responsibility, chart notation, warnings, and research/incomplete states. | Trace an input-to-chart flow and identify why an unknown birth time limits claims. | `my_chart.calculation_details` |
| 4 | `foundations.sun_moon` | The Sun and Moon | Introduce the luminaries as chart components and compare their roles within broad beginner vocabulary, without universalizing one school’s interpretation. | Compare two bounded placement examples and identify the supporting chart facts. | `my_chart.luminaries` |
| 5 | `foundations.mercury_venus_mars` | Mercury, Venus, and Mars | Build a first vocabulary for the personal planets and show how planet meaning remains distinct from sign and house context. | Identify the planet layer in short chart statements and keep interpretation qualified. | `my_chart.personal_planets` |
| 6 | `foundations.jupiter_saturn_outer_planets` | Jupiter, Saturn, and the Outer Planets | Introduce the social and outer-planet grouping used by the course, including the difference between broad cohort context and personal placement claims. | Compare a planet-group label with a chart-specific fact; flag claims that need more context. | `my_chart.planet_overview` |
| 7 | `foundations.houses_angles` | The Twelve Houses and the Angles | Explain the twelve houses, ASC/MC, time sensitivity, and why house-based claims require supported birth-time input. | Match a house/angle notation example to its layer and identify unavailable unknown-time fields. | `my_chart.houses_angles` |
| 8 | `foundations.planet_sign_house` | Planet × Sign × House | Teach the three-layer synthesis pattern and how to write a bounded interpretation from explicit inputs. | Complete a Planet × Sign × House synthesis using a provided example, not invented chart facts. | `my_chart.placement` |
| 9 | `foundations.aspects` | Aspects: Relationships Between Planets | Introduce the five major aspects, orb, and applying/exact/separating phase vocabulary; separate geometry from interpretation. | Classify aspect examples and explain why one aspect is not a complete reading. | `my_chart.major_aspects` |
| 10 | `foundations.chart_priorities` | What Matters First in a Chart | Establish a prioritization method: input quality, chart structure, prominent/explicit facts, relationships, then synthesis. | Rank a small set of chart facts and justify the order without adding unsupported techniques. | `my_chart.chart_priorities` |
| 11 | `foundations.whole_chart` | Reading the Chart as a Whole | Combine the course vocabulary into a repeatable whole-chart workflow and show how competing signals remain qualified. | Produce a short structured reading outline from an approved example and cite its inputs. | `my_chart.whole_chart` |
| 12 | `foundations.responsible_astrology` | Using Astrology Responsibly | Close with epistemic status, uncertainty, multi-school humility, privacy, agency, and non-diagnostic/non-deterministic use. | Identify overclaims, repair them into bounded language, and complete the final-check preparation. | `my_chart.responsible_use` |

The table describes instructional coverage only. It is not the lesson body,
does not create a chart fixture, and does not authorize a new glossary concept.

## 6. Standard lesson pedagogy

Every published Foundations lesson should follow the same ten-part shape. The
template is a teaching contract, not a requirement to fill a page with
repetitive prose.

1. **Orientation** — state what the learner will be able to notice or explain
   and where the lesson fits in the recommended path.
2. **Core Concept** — teach one bounded idea in plain language before adding
   nuance or school-specific variation.
3. **Professional Vocabulary** — introduce only approved Class B terms and
   link them to stable semantic concepts; do not create a second glossary.
4. **Example** — use a small, clearly labeled chart or notation example whose
   facts and interpretive commentary are visibly separate.
5. **My Chart** — offer the approved semantic integration hook when a chart is
   available; follow the no-chart and unknown-time rules in Section 8.
6. **Practice** — ask the learner to classify, compare, trace, prioritize, or
   synthesize; do not require unsupported birth data or invented facts.
7. **Check Understanding** — provide a lightweight formative check. It is not
   the final completion check and does not auto-complete the lesson.
8. **Key Takeaway** — summarize the bounded idea, its evidence lane, and its
   main limitation.
9. **Mark Complete** — provide an explicit user-controlled action; completion
   is never inferred from loading, scrolling, time, or tab visibility.
10. **Next Lesson** — recommend the next lesson while keeping all lessons
    browsable and revisitable.

Lesson content should be readable without a personal chart. Chart-linked
examples are an optional application layer, not a hidden prerequisite.

## 7. Product surfaces and route identity

The conceptual Foundations surfaces are:

| Surface | Conceptual route | Responsibility |
|---|---|---|
| Learn landing | `/<locale>/learn/` | Existing Learn entry point and editorial discovery. |
| Foundations course landing | `/<locale>/learn/foundations/` | Course promise, outcomes, recommended sequence, availability, and progress summary. |
| Lesson detail | `/<locale>/learn/foundations/<lesson-route>/` | One lesson, its semantic lesson ID, pedagogy template, practice, and explicit completion action. |
| Foundations final check | `/<locale>/learn/foundations/check/` | Ten-question lightweight comprehension check and score/pass state. |
| Completion and reward state | `/<locale>/learn/foundations/complete/` | 12/12 state, final-check result, reward eligibility/claim state, and bounded commercial explanation. |

These are conceptual routes for later implementation. Locale prefixes and
lesson slugs are presentation/routing concerns; they MUST NOT become course
or lesson identity. Foundations V1 does not add search or filter controls.

## 8. Birth-time, My Chart, and epistemic boundaries

### 8.1 Unknown birth time

An unknown birth time is a valid input state, not a missing value to be
silently repaired. NatalNode MUST NOT substitute noon, midnight, or another
artificial time and MUST NOT describe time-dependent outputs as precise.

When birth time is unknown, future Foundations integration MUST:

- keep the uncertainty visible;
- permit learning from time-independent chart concepts when supported;
- suppress or clearly qualify ASC, MC, houses, house cusps, and house-based
  interpretations;
- avoid implying that an unknown-time chart is equivalent to a fully resolved
  timed chart; and
- preserve the Engine/BFF boundary rather than deriving facts in Learn.

### 8.2 Conceptual My Chart hooks

The hook names in Section 5 are semantic integration points, not components or
routes. A future implementation must preserve their capability, no-chart
behavior, unknown-time behavior, and safe navigation target.

| Hook family | Capability | If no chart exists | If birth time is unknown | Safe future target |
|---|---|---|---|---|
| `my_chart.chart_structure`, `my_chart.zodiac_structure` | Open the user’s chart overview or the relevant chart-structure context. | Explain that a chart must be created before personal facts can be shown; offer the chart entry boundary without fabricating a result. | Show only supported time-independent context; do not imply precise angles or houses. | `/<locale>/` chart entry/workspace boundary. |
| `my_chart.calculation_details` | Open calculation, input, warning, and provenance context. | Offer the methodology/calculation explanation; do not expose a fictional calculation record. | Make the unknown-time status and suppressed fields explicit. | `/<locale>/methodology/` or a later Calculation Details surface. |
| `my_chart.luminaries`, `my_chart.personal_planets`, `my_chart.planet_overview` | Show relevant body facts already returned by the chart boundary. | Keep the lesson example available and offer chart creation; no personal placement is displayed. | Show only facts supported by the resolved result and keep the time limitation visible. | `/<locale>/` chart workspace boundary. |
| `my_chart.houses_angles`, `my_chart.placement` | Show house/angle or Planet × Sign × House context. | Explain that personal context is unavailable until a chart exists. | Suppress ASC/MC, houses, cusps, and house-based synthesis; do not substitute a time. | `/<locale>/` chart workspace boundary. |
| `my_chart.major_aspects`, `my_chart.chart_priorities`, `my_chart.whole_chart`, `my_chart.responsible_use` | Show supported aspect facts or return the learner to the chart-reading/trust context. | Keep a generic example and provide a safe chart entry link. | Do not add time-dependent claims; disclose the result limitations. | `/<locale>/` or `/<locale>/methodology/`, depending on capability. |

No hook may read birth data from lesson progress. No hook may ask the browser
or a client-side lesson to calculate astronomy. Exact UI behavior is deferred
to implementation.

### 8.3 Evidence lanes and language

Foundations must keep three evidence lanes visible:

1. **Astronomical/calculation facts** — dates, positions, geometry, input
   handling, time-zone resolution, and Engine warnings;
2. **Astrology conventions** — school-specific vocabulary, symbolic models,
   and interpretive practices; and
3. **NatalNode behavior** — what the product displays, suppresses, labels, or
   makes available.

The course must not blur these lanes. The trust statement remains:

```text
Calculated with astronomy. Interpreted through astrology.
```

The status identities `CALCULATED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, and
`RESEARCH` must retain their strength and limitations in every locale. NatalNode
must never say or imply that astronomical precision proves astrological
interpretation.

The course presents broad beginner concepts first and identifies meaningful
disagreements between modern and traditional or otherwise distinct schools.
Where a doctrine is school-specific, the content must name that scope rather
than presenting it as the only valid system.

## 9. Progress and completion product policy

### 9.1 Browsing and lesson states

All twelve lessons are available for browsing when their content is published.
There are no hard locks, forced prerequisite edges, or completion gates
between lessons. The recommended sequence is a navigation aid.

The only lesson progress states are:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

The course progress summary is the derived count:

```text
completedLessonCount / 12
```

The count is based on distinct stable lesson IDs, not client-supplied totals.

### 9.2 Explicit completion action

The learner must intentionally select `MARK COMPLETE`. The product MUST NOT
auto-complete a lesson because of page load, scroll depth, elapsed time, tab
visibility, video position, or navigation to the next lesson.

Lessons remain revisitable after completion. Before a reward is claimed, a
clean future product implementation may allow a learner to reverse completion
explicitly. A reward claim is a separate durable commercial event and must not
be automatically reversed merely because a learner later revisits or changes a
lesson state.

### 9.3 Anonymous and authenticated progress

Anonymous progress is a local-browser convenience state only. It is not an
account authority, paid entitlement, cross-device record, or reward proof.

Authenticated progress is server-authoritative, account-scoped, locale
independent, and keyed by the stable course/version/lesson identities defined
by the learning architecture. A browser must never be trusted to award the
completion reward by itself.

When anonymous progress is merged into an authenticated account, the product
uses a conservative semantic-ID set union:

- completed authenticated lessons are never removed;
- locally completed lessons may add completion for the same course version;
- `COMPLETED` wins over `IN_PROGRESS` or `NOT_STARTED` for a matching stable
  lesson ID;
- a client must not overwrite authoritative completion history with a stale
  local timestamp; and
- duplicate merge/retry events converge to one account state.

The merge contains no birth date, time, place, chart facts, interpretation
text, or reward entitlement.

## 10. Foundations final check

The final check is a lightweight comprehension check, not a professional
qualification and not a copy of any benchmark provider’s assessment.

Frozen rules:

- exactly 10 independently authored questions;
- pass threshold: at least 8 correct answers out of 10;
- unlimited retries;
- questions cover chart structure, components, calculation versus
  interpretation, uncertainty, synthesis, and responsible use;
- a passed attempt remains evidence for the course-version reward eligibility;
  and
- question bodies, answer choices, scoring code, and attempt persistence are
  deferred to a later implementation task.

The check must not ask the learner to provide or disclose birth data. It must
not reward memorization of unadmitted glossary terms or school-specific
advanced techniques.

## 11. Completion reward product policy

### 11.1 Reward value and meaning

The frozen reward is:

```text
FOUNDATIONS COMPLETION REWARD
7 days of the existing appropriate standard paid NatalNode entitlement
```

It is a learning completion benefit, not a purchase, cash value, marketing
points balance, or new subscription tier. NatalNode continues to expose only
the existing user-facing `FREE` and `PRO` product tiers.

The reward must be applied through the existing canonical commercial
entitlement/time-bank boundary when a later commercial integration is
authorized. It must extend usable entitlement without creating an ad hoc
browser clock or double-consuming a paid period. If the existing source model
cannot represent the benefit cleanly while preserving source provenance, the
mapping is an explicit dependency/blocker for the reward implementation; this
freeze does not invent a new commercial source type or a provider-specific
mechanism.

### 11.2 Eligibility

A reward may be claimed only when all of the following are true:

- the learner is authenticated;
- all twelve stable lessons are `COMPLETED` (`12/12`);
- the final check has a passing score of at least `8/10`; and
- the same account has not already claimed the reward for
  `foundations.v1`.

Anonymous completion, a local progress flag, a page visit, or a client-side
score cannot establish eligibility.

### 11.3 Idempotency and provenance

The stable conceptual reward source identity is:

```text
LEARNING_FOUNDATIONS_V1
```

This identity is not a production enum in this task. It must remain distinct
from purchase, renewal, referral, promotion, admin, and support-grant audit
origins even if the future canonical commercial source representation uses an
existing approved source category.

The future claim operation must be idempotent across refreshes, repeated
clicks, retries, duplicate delivery, concurrent sessions, process restarts,
and replayed client requests. One eligible account may receive at most one
reward for one course version. A later durable implementation must preserve a
stable claim/reward identity and an attributable reference to the canonical
entitlement/time-bank result.

Reward claiming must not happen automatically on lesson load or on a passing
score alone. Claim status, eligibility, and any commercial error must be
server-authoritative. A later correction or content revisit must not silently
reverse an already claimed entitlement.

### 11.4 Existing subscribers

For an existing subscriber, the preferred behavior is to credit seven days
through the existing canonical entitlement/time-bank and coverage projection
so that the user receives substantive usable value. Paid coverage and the
learning reward must not be consumed twice for the same effective period.

The exact physical source mapping, stacking order with every commercial source,
and provider mechanics remain a separate commercial integration decision. No
new subscription, trial clock, payment provider, or billing dependency is
selected here.

## 12. Localization and content quality

### 12.1 Foundations Core seven-locale target

Foundations V1 Core is a deliberate product exception to the general
progressive availability of Class C Learn/editorial content. Its exact target
is all seven V1 product locales:

```text
en, es, fr, de, ja, ko, zh-Hant
```

The twelve lessons must not be represented as a fully available Foundations
course in a locale until each lesson has an approved/current content
adaptation in that locale. A course shell or Class A navigation label can
exist independently, but incomplete Class C lesson coverage must be disclosed
and must not be disguised as parity.

This exception applies only to the Foundations V1 Core defined here. Advanced
Learn articles and later editorial families remain progressive per locale and
retain the deterministic English-fallback/omission policy from the existing
localization documents.

### 12.2 Three content classes

- **Class A — General Product UI:** ordinary course navigation, buttons,
  progress labels, and accessibility copy are localizable through the normal
  UI policy across all seven locales.
- **Class B — Professional Astrology Terminology:** terms such as planets,
  signs, houses, aspects, orb, and phase states resolve through the approved
  production glossary and stable semantic concept IDs.
- **Class C — Lesson prose and interpretation/editorial knowledge:** each
  locale version requires reviewed professional adaptation against the
  canonical English content revision. Literal sentence translation is not the
  quality standard; semantic and epistemic fidelity is.

Runtime machine translation, runtime LLM translation, unreviewed browser
translation presented as official NatalNode content, and automatic
`zh-Hans`/`zh-Hant` conversion are prohibited. AI may assist drafting only
under accountable human and professional review; it cannot publish content or
approve terminology.

## 13. Privacy, accessibility, and bounded analytics

Progress records contain the minimum course state necessary to resume study:
stable course/version/lesson identity, progress state, timestamps, and the
final-check/reward state needed for eligibility. They MUST NOT contain birth
date, birth time, birth place, coordinates, chart facts, chart IDs, or
interpretation text.

The future UI must preserve the PRD accessibility baseline: semantic headings,
keyboard operation, visible focus, sufficient contrast, labeled controls,
screen-reader-readable progress/check states, and no meaning conveyed by
color alone. The explicit `MARK COMPLETE` action and final-check result must
be understandable without animation or hover-only behavior.

Analytics is conceptual only in this freeze. Later measurement may use
bounded events such as lesson opened, lesson completed, check submitted, and
reward claimed, but must minimize data, avoid lesson/birth payloads, and never
turn course progress into an advertising profile.

## 14. Deferred implementation boundary

This product freeze authorizes no:

- Astro, React, MDX/content collection, or lesson runtime implementation;
- course cards, lesson UI, final-check UI, or progress components;
- progress API, account merge endpoint, database table, migration, or
  entitlement write;
- reward claim handler, scheduler, browser timer, or billing integration;
- lesson prose, translated content, final-check questions, or professional
  interpretations;
- chart calculation, EngineClient, BFF, Birth Input, renderer, Vault, Auth,
  notification, Tools, SEO, or deployment change; or
- search/filter, gamification, badges, streaks, points, leaderboards, or
  social-learning expansion.

The next implementation slice must be separately reviewed against this product
freeze and the learning architecture. It must not silently resolve the open
commercial mapping or localization workflow decisions.

## 15. Product freeze conclusion

```text
NatalNode Foundations V1
    = EXACTLY 12 LESSONS
    = RECOMMENDED SEQUENCE, NO HARD LOCKS
    = EXPLICIT USER-CONTROLLED PROGRESS
    = WHOLE-CHART + RESPONSIBLE-USE FOUNDATION
    = SEVEN-LOCALE CORE PARITY TARGET
    = CALCULATION / INTERPRETATION BOUNDARY PRESERVED
    = NO RUNTIME IMPLEMENTATION IN THIS TASK
```

This closes the product/content architecture decision boundary for
`WEB-LEARN-001A`. It does not start `WEB-LEARN-001B`.
