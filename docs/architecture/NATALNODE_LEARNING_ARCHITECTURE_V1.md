# NatalNode Learning Architecture V1

**Status:** FROZEN LEARNING ARCHITECTURE BASELINE
**Task:** `WEB-LEARN-001A`
**Source of truth:** [`docs/PRD.md`](../PRD.md)
**Product freeze:** [`NATALNODE_FOUNDATIONS_V1.md`](../product/NATALNODE_FOUNDATIONS_V1.md)
**Localization policy:** [`NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`](../product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md)
**Localization architecture:** [`NATALNODE_LOCALIZATION_ARCHITECTURE_V1.md`](./NATALNODE_LOCALIZATION_ARCHITECTURE_V1.md)
**Commercial authority:** existing subscription/entitlement architecture and time-bank policy
**Scope:** stable course/content identity, locale publication, progress, assessment, My Chart hooks, reward boundary, privacy, and future implementation constraints
**Date:** 2026-08-31

This document freezes the semantic architecture for NatalNode Foundations V1.
It does not implement a course runtime, lesson content, progress persistence,
assessment delivery, or commercial entitlement mutation. It is intentionally a
contract for later bounded implementation work.

Normative words in this document have their usual meanings: **MUST**,
**MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**, **DEFERRED**, and
**FROZEN**.

## 1. Authority, scope, and non-goals

The product decisions in `NATALNODE_FOUNDATIONS_V1.md` own course positioning,
curriculum intent, pedagogy, learner promise, assessment policy, and reward
meaning. This document owns the stable identities and boundaries required to
implement those decisions without coupling them to locale, URL slugs, chart
data, or a payment provider.

In scope:

- the `foundations.v1` course identity and twelve stable lesson IDs;
- course/version/content-revision semantics;
- lesson-locale publication and seven-locale readiness;
- conceptual Learn routes and semantic My Chart hooks;
- anonymous and authenticated progress behavior and merge rules;
- final-check and completion eligibility state;
- the completion-reward boundary to existing canonical entitlement/time-bank
  infrastructure; and
- privacy, accessibility, evidence-lane, and implementation invariants.

Explicitly out of scope:

- Astro, React, MDX, content-collection, API, BFF, database, migration, or
  server implementation;
- all lesson prose, locale adaptations, final-check questions, answer keys,
  or professional interpretation bodies;
- chart calculation, Birth Input, chart rendering, EngineClient, or Engine
  integration;
- purchase, payment, billing, provider, subscription, or new reward-source
  implementation;
- runtime machine translation, translation-management tooling, or a second
  glossary;
- search, filtering, gamification, streaks, leaderboards, badges, or social
  learning; and
- any change inside `C:\NatalNode`.

## 2. Frozen architecture invariants

The following invariants are the acceptance boundary for a future runtime:

1. The course contains exactly twelve lessons.
2. Lesson identity is stable, language neutral, and independent of URL slug,
   display title, or locale.
3. A recommended sequence exists, but all published lessons are browsable out
   of order and no hard lesson lock is used.
4. `COMPLETED` is produced only by an explicit user-controlled completion
   action; page load, scroll, elapsed time, tab visibility, or navigation does
   not complete a lesson.
5. Progress is a small semantic state graph and contains no birth data, chart
   facts, or interpretation payload.
6. Anonymous progress is convenience state, not account, entitlement, or
   reward authority.
7. Authenticated progress is account-scoped and server-authoritative; locale
   switching never creates a second progress record.
8. A conservative anonymous-to-authenticated merge never discards
   authoritative authenticated completion and is safe to retry.
9. Minor content revisions do not normally erase completion; a new curriculum
   requires a new course version.
10. Foundations Core is fully available only when approved/current lesson
    content exists for all twelve lessons in all seven V1 locales.
11. My Chart hooks consume an existing chart boundary; they never calculate,
    guess, or persist chart facts from a lesson.
12. Reward eligibility is server-authoritative and reward application reuses
    the existing canonical entitlement/time-bank boundary without creating a
    new tier or ad hoc browser clock.

## 3. Course, lesson, and content identity

### 3.1 Frozen course identity

The exact initial identity is:

```text
courseFamilyId       = foundations
courseId             = foundations.v1
courseVersion        = v1
canonicalLocale      = en
initialContentRevision = 1
lessonCount          = 12
```

`courseId` is the stable product identity used by progress and reward
eligibility. `courseVersion` makes curriculum evolution explicit even though
the initial course ID already includes the version for human reviewability.
No locale code, URL slug, translated title, provider name, or generated chart
ID may be part of course identity.

### 3.2 Frozen lesson IDs

These are the exact stable lesson IDs for `foundations.v1`:

```text
foundations.natal_chart
foundations.zodiac_structure
foundations.chart_calculation
foundations.sun_moon
foundations.mercury_venus_mars
foundations.jupiter_saturn_outer_planets
foundations.houses_angles
foundations.planet_sign_house
foundations.aspects
foundations.chart_priorities
foundations.whole_chart
foundations.responsible_astrology
```

The frozen order and titles are:

| Order | Stable lesson ID | Canonical English title |
|---:|---|---|
| 1 | `foundations.natal_chart` | What a Natal Chart Actually Is |
| 2 | `foundations.zodiac_structure` | The Zodiac: Polarity, Elements, and Modes |
| 3 | `foundations.chart_calculation` | How the Sky Becomes a Chart |
| 4 | `foundations.sun_moon` | The Sun and Moon |
| 5 | `foundations.mercury_venus_mars` | Mercury, Venus, and Mars |
| 6 | `foundations.jupiter_saturn_outer_planets` | Jupiter, Saturn, and the Outer Planets |
| 7 | `foundations.houses_angles` | The Twelve Houses and the Angles |
| 8 | `foundations.planet_sign_house` | Planet × Sign × House |
| 9 | `foundations.aspects` | Aspects: Relationships Between Planets |
| 10 | `foundations.chart_priorities` | What Matters First in a Chart |
| 11 | `foundations.whole_chart` | Reading the Chart as a Whole |
| 12 | `foundations.responsible_astrology` | Using Astrology Responsibly |

Lesson IDs are not localized, translated, re-slugged, or reused for a
different lesson meaning. A route slug is a presentation alias that resolves
to one of these IDs. A material curriculum change must use a new course
version and an explicit migration decision; it must not silently reinterpret a
published lesson ID.

### 3.3 Content-version semantics

Every future lesson locale record must be addressable by the semantic tuple:

```text
courseId
courseVersion
lessonId
locale
contentRevision
```

The record must also retain its canonical revision linkage and publication
state. `contentRevision = 1` is the initial Foundations V1 content baseline.
An editorial correction or bounded clarification may advance the content
revision without creating a new course, subject to review. It must not
normally reset completion. A material change to learning outcomes, lesson
meaning, lesson order, or the course backbone requires a new course version.

Progress identity deliberately does not include locale, slug, or content
revision:

```text
progressIdentity = accountScope + courseId + courseVersion + lessonId
```

This keeps completion stable across locale switching and minor editorial
updates while still allowing the renderer and review tooling to see which
content revision was used.

## 4. Lesson-locale publication and availability

### 4.1 Conceptual content record

The future repository or content service must preserve, at minimum:

```text
courseId
courseVersion
lessonId
canonicalLocale
locale
contentRevision
canonicalContentRevision
contentState
currentness
contentPayload
```

The exact storage schema, CMS, file format, and runtime API remain deferred.
The `contentPayload` is Class C editorial content and must not be treated as a
plain UI translation string.

### 4.2 Frozen state model

For Foundations content governance, the conceptual states are frozen as:

```text
contentState = MISSING | DRAFT | REVIEW | APPROVED
currentness  = CURRENT | OUTDATED
```

The derived publication result is:

```text
AVAILABLE   = contentState == APPROVED and currentness == CURRENT
UNAVAILABLE = otherwise
```

`APPROVED` means accountable language/editorial/professional review has
accepted the content for the linked canonical revision. `CURRENT` means it
still matches the current canonical meaning. A locale variant that is
approved but outdated is not publishable as current official content.

### 4.3 Foundations Core readiness gate

The full Foundations Core availability condition is:

```text
FOUNDATIONS_CORE_READY
  = every frozen lesson ID
  × every V1 locale
  × APPROVED and CURRENT content
```

The V1 locale set is exactly:

```text
en, es, fr, de, ja, ko, zh-Hant
```

The English canonical source must itself be approved/current. A course shell,
Class A navigation, or internal draft may exist before the gate passes, but
the product must not label a locale as having a fully available Foundations
course when any of its twelve Class C lesson variants is missing,
unreviewed, or outdated.

This is a deliberate Foundations V1 Core exception to the general progressive
availability of advanced Learn/editorial content. Advanced Learn remains
progressive per locale and retains the existing approved/current locale
variant → canonical English fallback or route-omission decision boundary.

### 4.4 Class A, B, and C resolution

The future runtime must preserve three separate resource planes:

- Class A course UI uses ordinary localized interface messages.
- Class B professional terms resolve through the approved production
  astrology glossary and stable semantic concept IDs.
- Class C lesson prose and interpretive explanation resolve through the
  content record above and require reviewed professional adaptation.

No runtime machine translation, LLM translation, browser translation presented
as official NatalNode content, or automatic `zh-Hans`/`zh-Hant` conversion may
make a nonpublishable Class B or Class C record available. The locale is a
presentation attribute, never a domain or content identity.

## 5. Conceptual routes and surface boundaries

Future route resolution may expose these semantic surfaces:

| Surface | Conceptual route | Stable identity responsibility |
|---|---|---|
| Learn landing | `/<locale>/learn/` | Existing editorial discovery boundary. |
| Foundations course | `/<locale>/learn/foundations/` | Resolves `courseId = foundations.v1`, readiness, outcomes, and progress summary. |
| Lesson detail | `/<locale>/learn/foundations/<lesson-route>/` | Resolves one frozen `lessonId`; the route slug is not identity. |
| Final check | `/<locale>/learn/foundations/check/` | Resolves `checkId = foundations.v1.final_check`. |
| Completion/reward state | `/<locale>/learn/foundations/complete/` | Resolves course completion, check outcome, eligibility, and claim state. |

These routes are conceptual only. The current localization route helpers and
existing Learn pages remain authoritative for future integration. No route,
page, metadata, sitemap, or article is changed by this freeze.

## 6. Progress architecture

### 6.1 Lesson state and derived course progress

The only lesson progress states are:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

The course count is derived from the distinct stable lesson IDs whose state is
`COMPLETED`:

```text
completedLessonCount / 12
```

The count is never accepted as an authoritative client-supplied number. A
future service recalculates it from the account-scoped semantic records.

`COMPLETED` requires the explicit user action `MARK COMPLETE`. A future UI may
record `IN_PROGRESS` through intentional learner interaction, but it must not
infer completion from loading, scroll depth, elapsed time, tab visibility,
video position, or opening the next lesson. All lessons stay browsable and
revisitable; there is no hard lock graph.

Before a reward is claimed, a later product implementation may support an
explicit reversal of completion. A reward claim is a separate durable
commercial event and must never be automatically reversed by a later lesson
revisit or progress edit.

### 6.2 Conceptual progress record

A future progress record contains only the minimum semantic state needed to
resume learning, conceptually:

```text
accountScope
courseId
courseVersion
lessonId
state
completedAt (when completed)
contentRevisionSeen (optional)
updatedAt
```

It must not contain birth date, birth time, birth place, coordinates, chart
ID, chart facts, calculation payload, interpretation text, or reward value.

### 6.3 Anonymous convenience state

Anonymous progress may be stored in the local browser as a convenience for
resuming the current learner’s course view. It is not:

- an authenticated account record;
- cross-device state;
- proof of identity or completion;
- paid entitlement or reward authority; or
- a substitute for server-side validation.

The local state must use the same stable course/version/lesson IDs and must be
safe to discard. It must not contain birth data or a hidden chart snapshot.

### 6.4 Authenticated authority

Authenticated progress is account-scoped, server-authoritative, locale
independent, and keyed by the frozen semantic identity. A browser may request
an operation, but it cannot grant itself a reward by changing local state,
spoofing a count, or submitting a passing result without server acceptance.

The future authenticated boundary must make duplicate requests converge and
must preserve an auditable distinction between lesson completion, final-check
pass, reward eligibility, and reward claim.

### 6.5 Anonymous-to-authenticated merge

At sign-in, anonymous state may be merged conservatively into the authenticated
account for the same `courseId` and `courseVersion`:

```text
remote COMPLETED ∪ local COMPLETED
```

For each matching lesson ID, state precedence is:

```text
COMPLETED > IN_PROGRESS > NOT_STARTED
```

The merge must:

1. never remove an authenticated completion;
2. never let a stale local timestamp overwrite authoritative account history;
3. preserve locale independence;
4. remain safe under retry, duplicate delivery, refresh, and concurrent
   sessions; and
5. contain no birth data, chart facts, interpretation payload, or entitlement
   mutation.

The merge alone does not award the completion reward. The server must
recalculate 12/12, verify the final-check pass, and verify the unclaimed
course-version reward condition.

## 7. My Chart integration boundary

### 7.1 Hook identity

Foundations uses semantic hooks, not lesson-specific URLs or embedded chart
data. The frozen hook identities are:

```text
my_chart.chart_structure
my_chart.zodiac_structure
my_chart.calculation_details
my_chart.luminaries
my_chart.personal_planets
my_chart.planet_overview
my_chart.houses_angles
my_chart.placement
my_chart.major_aspects
my_chart.chart_priorities
my_chart.whole_chart
my_chart.responsible_use
```

A hook names a capability. It does not authorize a new chart endpoint,
calculation, fixture, or client-side interpretation engine.

### 7.2 Capability and safe behavior

| Hook capability | No chart | Unknown birth time | Safe target boundary |
|---|---|---|---|
| Chart structure, zodiac, luminaries, personal/planet overview | Keep the lesson example available and offer chart creation; never fabricate personal facts. | Show only facts supported by the returned chart result; do not imply precise angles or houses. | `/<locale>/` chart entry/workspace boundary. |
| Calculation details | Explain the methodology/calculation boundary without inventing a calculation record. | Show the unknown-time status, warnings, and suppressed fields when a result exists. | `/<locale>/methodology/` or a later Calculation Details surface. |
| Houses, angles, and Planet × Sign × House placement | Explain that a personal chart is required before personal context can be shown. | Suppress or clearly qualify ASC, MC, houses, cusps, and house-based synthesis; never substitute noon, midnight, or another artificial time. | `/<locale>/` chart workspace boundary. |
| Major aspects, chart priorities, whole-chart, responsible-use context | Keep a bounded generic example and offer safe chart entry. | Do not add time-dependent claims; disclose result limitations and preserve the calculation/interpretation boundary. | `/<locale>/` or `/<locale>/methodology/`, by capability. |

Future hook consumers must use the existing Website API/BFF → Engine Public API
boundary where personal chart facts are needed. Learn code must not inspect an
astronomy provider or derive planets, signs, houses, aspects, orb, phase,
retrograde, timezone, or scientific IDs.

## 8. Foundations final-check architecture

The final check has the frozen identity:

```text
checkId       = foundations.v1.final_check
questionCount = 10
passThreshold = 8 / 10
retryPolicy   = unlimited
```

Questions must be independently authored for NatalNode and cover the
course’s own learning outcomes: chart structure, chart components, notation,
calculation versus interpretation, uncertainty/unknown time, Planet × Sign ×
House synthesis, major aspects, whole-chart reasoning, and responsible use.

The check is lightweight comprehension, not professional certification. It
must not copy benchmark provider questions, handouts, quizzes, or proprietary
assessment language. A passing attempt is evidence for reward eligibility,
not a purchase or entitlement write.

A future implementation may retain attempt history and best/latest score, but
the exact attempt schema and scoring API are deferred. Only an authenticated,
server-accepted passing result can participate in reward eligibility.

## 9. Completion reward and commercial boundary

### 9.1 Frozen reward identity and value

The conceptual reward identity is:

```text
rewardSourceIdentity = LEARNING_FOUNDATIONS_V1
rewardValue          = 7 days of existing appropriate standard paid NatalNode entitlement
```

`LEARNING_FOUNDATIONS_V1` is a stable audit/source identity, not a production
enum created by this task. The reward is not a purchase, cash balance, points
system, trial clock, or new user-facing tier. The product remains `FREE` and
`PRO`.

### 9.2 Eligibility predicate

The future authoritative eligibility predicate is:

```text
authenticated
AND courseId == foundations.v1
AND every lesson is COMPLETED
AND completedLessonCount == 12
AND final check score >= 8 / 10
AND no prior claim for this account + course version
```

Anonymous local state, a client-supplied count, a page visit, or a passing
browser-only score cannot satisfy the predicate.

### 9.3 Existing entitlement/time-bank reuse

Reward application must pass through the existing canonical commercial
boundary, including the Effective Entitlement Evaluator and the existing
entitlement/time-bank or coverage-projection semantics. It must preserve
source provenance, account scope, non-negative time, and no double-consumption
of paid coverage.

For an existing subscriber, the preferred product result is seven substantive
usable days credited through the canonical entitlement/time-bank boundary so
that the benefit extends usable access rather than creating a parallel
browser-only clock. The exact physical mapping to the existing commercial
source categories, stacking rule with every source, and provider mechanics are
deferred to a separate commercial integration decision. If no clean mapping
can preserve the existing source-local, auditable model, reward implementation
is blocked until the commercial owner resolves it.

This learning architecture does not add a `LEARNING` subscription tier, alter
the existing PAID/REFERRAL/PROMOTION/ADMIN_GRANT/SUPPORT_GRANT model, choose a
payment provider, or modify commercial persistence.

### 9.4 Claim idempotency and non-reversal

The future claim boundary must converge to at most one reward per account per
course version. Its conceptual idempotency key is:

```text
accountScope + rewardSourceIdentity + courseVersion
```

It must remain idempotent across refresh, repeated clicks, retries, duplicate
delivery, replayed client requests, concurrent sessions, process restarts, and
reconciliation. A durable claim record must retain the stable source identity
and an attributable reference to the canonical entitlement/time-bank result.

Claiming does not happen automatically on lesson load, final-check pass, or
scroll. A later content revisit or explicit pre-claim progress reversal must
not silently reverse an already claimed entitlement. Any future correction is
a separate authorized commercial operation and must remain source-local and
auditable.

## 10. Localization architecture relationship

Foundations content is Class C. The seven-locale Core gate is intentionally
stricter than the advanced Learn/editorial progressive rule:

```text
Foundations V1 Core = 12 lessons × 7 locales, approved/current before full availability
Advanced Learn       = progressive locale publication with deterministic English fallback or omission
```

The exact locale set is `en`, `es`, `fr`, `de`, `ja`, `ko`, and `zh-Hant`.
Class A UI remains normally localizable. Class B terms use the approved
production glossary. Class C lesson content requires reviewed adaptations
against the canonical revision. No runtime machine translation or automatic
Traditional/Simplified Chinese conversion is allowed.

Changing locale changes presentation/content selection only. It must not
change course identity, lesson identity, progress identity, chart facts,
scientific provenance, entitlement state, or reward claim identity.

## 11. Evidence, authorship, and epistemic boundary

### 11.1 Evidence lanes

Every future lesson authoring review must keep these lanes distinct:

1. **Astronomical/calculation facts** — authoritative astronomy, time, and
   timezone sources plus Engine/BFF contracts;
2. **Astrology conventions** — reputable astrology education/reference sources
   and explicitly scoped school traditions; and
3. **NatalNode behavior** — product decisions about labels, availability,
   warnings, suppression, progress, and links.

The trust statement remains:

```text
Calculated with astronomy. Interpreted through astrology.
```

The epistemic identities `CALCULATED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`,
and `RESEARCH` must not be strengthened, collapsed, or hidden by lesson
localization. Astronomical precision does not scientifically validate
astrological interpretation.

### 11.2 Authoring evidence minimum

For later lesson authoring, conventional or interpretive claims must be
checked against at least two reputable astrology education/reference sources
where the claim is material. Calculation, time, timezone, and astronomy
claims must use authoritative astronomy/time/timezone references and the
existing provider-neutral Web contracts. This is an authoring quality gate,
not a request to copy any source.

Foundations must identify meaningful differences between modern and
traditional or otherwise distinct schools. It may teach a broad shared
beginner concept, but it must not present one school’s doctrine as the sole
universal interpretation. Dignities, dispositors, minor aspects, lots,
profections, transits, synastry, solar returns, and other deferred techniques
are not admitted merely because they appeared in benchmark curricula.

## 12. Privacy, accessibility, and bounded observability

### 12.1 Privacy

Progress and check state are course state, not a place to retain birth data.
Future APIs and storage must minimize fields and must not accept chart payloads
as progress metadata. Reward and progress records must be account-scoped and
must not be used as advertising targeting profiles.

### 12.2 Accessibility

Future course UI must preserve semantic headings, keyboard navigation, visible
focus, sufficient contrast, labeled controls, screen-reader-readable states,
and meaning that does not depend on color, animation, hover, or timing. The
`MARK COMPLETE` action, final-check score, and reward state must be operable
and understandable with assistive technology.

### 12.3 Bounded observability

Later conceptual events may include lesson opened, lesson completed, final
check submitted, and reward claimed. They must be minimized and must not log
birth data, chart facts, interpretation prose, answer payloads, or private
content. Analytics implementation is deferred.

## 13. Deferred implementation sequence

This freeze does not start implementation. A later separately scoped sequence
may be:

1. `WEB-LEARN-001B` — establish the content/progress runtime boundary against
   these identities, without inventing lesson bodies or commercial writes;
2. a separate reviewed lesson-authoring/adaptation task for approved/current
   Class C content; and
3. a separate commercial integration task only after the canonical entitlement
   mapping is confirmed.

Each later task must preserve this document, the product freeze, the existing
localization policy/architecture, and the Website API/BFF → NatalNode Engine
Public API boundary. No later task may silently resolve an open payment,
reviewer, CMS, SEO, or provider decision.

## 14. Architecture freeze conclusion

```text
courseId                 = foundations.v1
lessonCount              = 12
lesson identity          = stable / locale-independent / slug-independent
progress states          = NOT_STARTED / IN_PROGRESS / COMPLETED
completion               = explicit MARK COMPLETE only
course lock              = NONE
Core locale gate         = 12 × 7 approved/current lesson variants
final check              = 10 questions / pass 8 / unlimited retries
reward                   = 7 days existing entitlement, one-time, idempotent
commercial integration   = existing canonical entitlement/time-bank boundary
runtime implementation   = NOT AUTHORIZED BY WEB-LEARN-001A
```

This closes the learning architecture freeze for `WEB-LEARN-001A` without
starting `WEB-LEARN-001B`.
