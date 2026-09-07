# NatalNode Personal Editorial Architecture V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-PERSONAL-EDITORIAL-001` |
| Status | `ARCHITECTURE_FROZEN_WITH_CONDITIONS` |
| Scope | Personal interpretation composition and editorial policy |
| Runtime changes authorized by this document | `ZERO` |
| Product source of truth | [`docs/PRD.md`](../PRD.md) |
| Existing semantic authority | [`NATALNODE_INTERPRETATION_SYSTEM_V1.md`](../architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md) |
| Existing content authority | [`NATALNODE_CONTENT_VALUE_ARCHITECTURE_V1.md`](./NATALNODE_CONTENT_VALUE_ARCHITECTURE_V1.md) |
| Provider status | `PROVIDER DECISION DEFERRED` |
| Runtime admission | `NOT_ADMITTED` |
| Bounded next decision | `PERSONAL_SYNTHESIS_POC`, separately scoped |

This document freezes the editorial architecture for future personal
interpretation. It defines how admitted chart-derived meaning may become a
selective, useful, and traceable personal reading. It does not calculate a
chart, create a Signal, expand the Knowledge Canon, implement a renderer, or
authorize production personal interpretation.

The document sits between the existing semantic and content boundaries:

```text
Engine / approved ChartFacts
    -> Signal and semantic composition
    -> Candidate Personal Themes
    -> Deterministic Theme Ranking
    -> Personal Editorial Rendering
    -> WHY / LEARN / ASTROLOGER VIEW projections
    -> Product surface
```

The existing Fact, Signal, Knowledge Canon, Learning, provider, provenance,
and presentation authorities remain authoritative in their own scopes. This
document adds one bounded personal-editorial layer; it does not replace those
authorities or create a competing source of truth.

## 1. Product objective and reading priority

NatalNode personal interpretation should help a reader recognize a supported
personal pattern, understand its constructive potential and trade-offs, and
choose a useful next observation. It should make the astrological reason
inspectable without requiring technical vocabulary before the first useful
meaning.

The product objective is:

```text
specific personal relevance
+ constructive usefulness
+ visible limits
+ traceable astrology
+ optional learning depth
```

This is not a prediction promise, a personality test, a diagnosis, a
therapeutic substitute, or a guarantee of an external outcome. Personal
interpretation is a bounded symbolic reading of admitted chart evidence and
the declared astrological method.

The default reading priority is frozen as:

```text
THIS IS ABOUT ME
    -> WHY THIS SHOWS UP
        -> LET ME LEARN MORE
```

The order is a reader-facing priority, not permission to hide evidence. A
reader must be able to reach the supporting facts, method, limits, and
learning context at the appropriate depth.

### 1.1 Content allocation bands

For a personal reading, editorial planning should use these soft content
bands:

| Layer | Target share | Editorial job |
| --- | ---: | --- |
| Personal meaning | 60–75% | Recognition, constructive potential, pattern, tension, and useful lever. |
| Why / evidence / astrology explanation | 15–25% | Show what contributed, how it was connected, and what authority or method limit applies. |
| Learn / technical | 10–20% | Teach the relevant concept and expose optional technical depth. |

These are planning ranges, not per-page arithmetic and never user-facing
percentages. A thin or authority-limited reading must omit unsupported blocks
rather than pad a ratio. A short reading can be complete when it says all the
available evidence supports.

The bands refine the existing Content Value Architecture's progressive-depth
model. They do not create three separate products, three independent prose
libraries, or a requirement that every surface render the same amount of text.

## 2. Frozen narrative model

The canonical personal narrative sequence is:

```text
RECOGNITION -> STRENGTH -> PATTERN -> TENSION -> LEVER -> WHY -> DEEPER
```

The sequence is a semantic and editorial order. It is not a requirement to
render every node as a separate card or paragraph.

| Stage | Frozen meaning | Boundary |
| --- | --- | --- |
| Recognition | A specific, bounded pattern that may be relevant to lived experience. | No generic identity label, universal claim, or unsupported “this is you.” |
| Strength | A constructive potential supported by the same structure. | Not praise, superiority, guaranteed success, or a hidden positive score. |
| Pattern | How the structure may organize behavior, attention, response, relationship, work, or decisions when context supports that reading. | Must remain a possibility or observation, not a diagnosis or fixed type. |
| Tension | The trade-off, friction, or cost that can arise from the same structure. | Must be structurally related to the strength; no unrelated warning paragraph. |
| Lever | A useful observation, choice, or adjustment that follows from the tension. | Must be bounded and actionable without becoming therapy, generic advice, or fate management. |
| Why | The actual astrology evidence and method behind the reading. | Must not be a post-hoc rationale for unsupported prose. |
| Deeper | Optional learning, astrologer, or technical context. | Cannot introduce a new fact, stronger certainty, or a new doctrine. |

The personal renderer may compress Recognition and Pattern, or Strength and
Tension, when the meaning remains clear. It must not remove the underlying
trade-off merely to make copy sound positive. It must not add a tension or
lever when the admitted structure cannot support one.

One semantic meaning has one visible owner. Repetition across the personal,
Why, Learn, and technical projections is allowed only when each projection
adds a distinct job; otherwise the later copy is omitted or linked.

## 3. Constructive asymmetry and voice

Personal interpretation leads with useful or constructive potential. This is a
constructive asymmetry, not a positivity bias. The tension must remain visible
and must come from the same structure that supports the constructive reading.

Allowed language may include:

- tact, restraint, pacing, and deliberate response;
- a trade-off between momentum and reflection;
- a need to distinguish familiar response from deliberate choice;
- a question about how a pattern works in a particular context; and
- an observation that leaves room for agency and lived circumstances.

The following are not admitted:

- empty praise or universal affirmation;
- moral superiority attached to a sign, body, element, modality, or aspect;
- guaranteed strengths or outcomes;
- “you are special,” “gifted,” “magnetic,” or equivalent unsupported identity
  claims;
- “born to …”, destiny, fate, or inevitable life-path claims;
- certainty theater based on fluent wording;
- disguised Barnum statements that most readers could accept without the
  named evidence; and
- a flattering opening that hides a generic or unrelated tension.

The preferred voice is clear, calm, specific, human, and non-deterministic.
Ordinary language comes before specialist terminology. A sentence may be warm
without flattering the reader and practical without pretending to know the
reader's full life.

## 4. Emotional value model

The emotional value of a personal reading has three parts:

```text
RECOGNITION + AFFIRMATION + INSIGHT
```

| Value | Meaning | What it is not |
| --- | --- | --- |
| Recognition | The reader can see a supported pattern expressed in bounded, ordinary language. | A claim that the product knows the reader completely. |
| Affirmation | The constructive potential or understandable human trade-off in the pattern is acknowledged without judgment. | Praise, status assignment, emotional dependency, or a promise that the reader is exceptional. |
| Insight | The reading makes a distinction or choice easier to notice. | Diagnosis, prediction, or a generic self-help instruction. |

Affirmation is therefore acknowledgment, not approval of a person or outcome.
It must remain subordinate to evidence and agency. If the evidence supports
only a fact or a learning bridge, the product must not manufacture emotional
value through a personality claim.

## 5. Personalization architecture

The frozen architecture is:

```text
ChartFacts
    -> Semantic Composition
        -> Candidate Personal Themes
            -> Deterministic Theme Ranking
                -> 3–5 Core Personal Themes
                    -> Personal Editorial Rendering
                        -> WHY / LEARN / ASTROLOGER VIEW
```

### 5.1 ChartFacts and semantic composition

`ChartFacts` means facts explicitly supplied by a validated Engine result or
another separately approved authority boundary. The Web layer does not
recalculate positions, houses, aspects, rulers, transits, timing, or
confidence from a birth date, label, or fixture.

Semantic Composition consumes eligible Signals and Knowledge Canon semantics
under the existing interpretation contract. It may preserve a relationship
between facts, but it does not create a new scientific fact. A composition
must retain, as applicable:

- source fact references;
- Signal and rule identity;
- domain, direction, intensity, and confidence;
- school or method lens;
- authority and provenance state;
- temporal context and lifecycle state, when supplied;
- birth-time requirements;
- limitations and suppression reasons; and
- the question or product surface for which the theme is eligible.

### 5.2 Candidate Personal Themes

A Candidate Personal Theme is a structured semantic candidate, not prose. It
must be possible to inspect why it exists before any wording is produced.

The candidate may express a pattern in a life-question context, but it must
not silently convert a fact into an identity claim. A candidate that lacks a
supported source, a declared method, or a necessary authority state is not
eligible for personal rendering. It may remain fact-only, learn-only, or
omitted.

### 5.3 Deterministic theme ranking

Theme ranking is deterministic and reviewable. It may consider:

- structural centrality in the admitted semantic composition;
- repeated support from independent facts or rules;
- convergence across distinct evidence sources;
- meaningful tension or contradiction within the supported evidence;
- temporal relevance for the target Daily, Weekly, or Monthly surface;
- confidence and evidence quality;
- birth-time authority and unknown-time restrictions;
- redundancy suppression;
- supported life-question relevance; and
- the distinction between stable natal and current-sky context.

This document does not invent production weights. Existing Signal ranking
remains owned by the Interpretation System, and any separate Personal Theme
ranking contract must define its inputs, weights, tie-breaking, and review
status in a later bounded task. A language model, prose length, emotional
intensity, or visual prominence must not decide importance.

The target is three to five core themes. It is a ceiling-oriented editorial
target, not a promise. A result may contain fewer themes when evidence is
thin, overlapping, low-confidence, unavailable, or outside the surface's
authority. More facts do not require more visible themes.

## 6. Personal semantic signal contract

The personal layer preserves the existing Interpretation System vocabulary. It
does not add a new personal taxonomy.

### 6.1 Internal domains

The exact internal personal domains remain:

```text
SELF
EMOTIONAL
RELATIONSHIP
COMMUNICATION
WORK_CREATION
ACTION_DECISION
```

These are semantic domains, not a user-facing score or a claim that a chart
contains six measurable life compartments. The existing Content Value
Architecture's labels such as `LOVE & RELATIONSHIPS`, `MONEY & RESOURCES`,
`WORK & CREATION`, and `INNER STATE / MOOD` remain presentation-level content
categories where separately supported. They do not add enum values to this
internal contract. A future surface must define any display mapping without
changing the six-domain authority.

### 6.2 Direction, intensity, and confidence

The exact signal directions remain:

```text
SUPPORTIVE
CHALLENGING
MIXED
NEUTRAL
```

The qualitative intensity vocabulary is:

```text
SUBTLE
NOTICEABLE
STRONG
DOMINANT
```

The confidence vocabulary is:

```text
HIGH
MEDIUM
LOW
```

Confidence means structured evidence strength and completeness. It is not a
statistical probability, forecast likelihood, or guarantee. Intensity is
qualitative and must not be rendered as an internal strength percentage,
accuracy score, star rating, or “power” meter. Direction describes how the
admitted structure is being framed in the selected context; it is not a moral
judgment.

The existing Signal priority and normalized internal ranking metadata remain
internal. They may order a reading, but they must not be presented as an
objective percentage of the reader's life.

## 7. Life-question projection

The frozen projection is:

```text
ChartFacts
    -> Semantic Composition
        -> Personal Theme
            -> Life Question Projection
```

The permitted life-question families are:

| Life question | Primary personal domain | Bounded use |
| --- | --- | --- |
| Identity / self-direction | `SELF` | What kind of direction, agency, or self-definition may be worth noticing? |
| Emotional patterns | `EMOTIONAL` | How might response, rhythm, receptivity, or inner steadiness be explored without diagnosis? |
| Communication | `COMMUNICATION` | What may be worth noticing in naming, listening, exchange, or interpretation? |
| Relationships | `RELATIONSHIP` | What may be worth noticing about connection, boundaries, closeness, or friction? |
| Work / creation | `WORK_CREATION` | What may be worth noticing in making, sustaining, responsibility, or output? |
| Decisions / action | `ACTION_DECISION` | What may be worth noticing about initiative, pacing, choice, or pause? |

A theme is projected into a life question only when the source-backed meaning
adds distinct value in that context. The projection must not create a job,
relationship outcome, health claim, financial forecast, or deterministic event.
Money or resources language remains subject to the existing Content Value
Architecture policy and does not create a seventh personal signal domain.

## 8. WHY / EVIDENCE layer

`WHY THIS SHOWS UP` is the plain-language evidence layer after the personal
meaning. It is not a post-hoc explanation of a sentence drafted from a
stereotype. A personal theme is not ready for rendering if the Why layer
cannot answer the relevant questions below.

The Why layer should be able to answer:

| Reader question | Required answer shape |
| --- | --- |
| Which chart facts contributed? | Name the supplied placement, relationship, aspect, house, ruler, transit, or other admitted signal without inventing one. |
| Which relationship or composition rule was used? | Explain the admitted connection in ordinary language and preserve the named school/method boundary. |
| Is this natal, current-sky, transit, or temporal context? | State the context and avoid combining stable natal meaning with current timing as if they were one fact. |
| Is birth time required? | State whether the claim depends on exact birth time, houses, angles, or another time-sensitive authority. |
| What confidence/evidence strength applies? | Use the structured confidence and explain a material limitation; do not translate it into probability. |
| What school/policy boundary matters? | Name a material traditional/modern, method, scope, or source limitation without exposing internal governance jargon by default. |

The reader-facing Why layer should expose the useful reason before raw IDs. A
technical projection may expose fact paths, Signal identity, rule version,
configuration identity, and provenance when those values are genuinely
supplied. It must not fabricate metadata for polish.

Why also carries counterevidence and omission where relevant: another chart
factor may redirect the reading, a necessary fact may be unavailable, or the
same structure may support both momentum and friction. Limitations belong at
the same depth as the interpretation, not as a hidden legal footnote.

## 9. LEARN bridge

Personal interpretation links into the Knowledge Canon contextually:

```text
Personal theme
    -> WHY THIS SHOWS UP
        -> named chart fact
            -> Learn the relevant concept
                -> optional deeper astrology
```

The personal meaning comes first. Learn explains the astrology behind the
meaning and does not compete with personal value at the top of the page.

Knowledge and personal interpretation are two editorial projections of one
Canon:

| Projection | Job | Required character |
| --- | --- | --- |
| Knowledge Editorial | Explain astrology clearly. | Neutral, source-backed, school-aware, educational. |
| Personal Editorial | Explain why an admitted concept is relevant to this chart. | Selective, emotionally useful, constructive but not flattering, evidence-backed. |

Personal copy must not fork doctrine into a private canon. The Learn bridge
must link to an admitted concept and preserve its school, limitation, and
epistemic status. It must not promote a personal synthesis into a new
primitive, create a Planet × Sign matrix, or use a learning link to conceal a
missing chart fact.

The R2 Human Knowledge package remains a representative editorial package and
is still `RUNTIME_NOT_ADMITTED`. Its Moon, Mercury, Aries, Fixed, and Basic
Sign Rulership examples may inform a separately admitted future bridge, but
this architecture document does not import or admit them into runtime.

## 10. Temporal and lifecycle policy

The personal layer preserves this distinction:

```text
CALENDAR PERIOD != CELESTIAL CYCLE
```

Daily, Weekly, and Monthly are product period identities. A celestial cycle,
transit, ingress, phase, or other time-sensitive relationship requires a
separately supplied and authoritative temporal fact. A calendar label cannot
create one.

When a valid temporal source supplies a lifecycle window, future editorial
projections may use these states:

```text
UPCOMING
NEW
BUILDING
EXACT / PEAK
ACTIVE
SEPARATING / FADING
ENDED
```

The state describes the supplied window; it does not authorize Web-side
transit computation. A missing or unresolved time authority produces an
unavailable temporal claim, not a generic substitute.

## 11. Unknown birth time: fail-closed editorial behavior

Unknown birth time is a first-class authority state. It is not a prompt to
choose noon, midnight, an average time, or a guessed UTC instant.

Unknown birth time must never silently fabricate:

- ASC;
- MC;
- houses or house placements;
- house-based themes;
- angle relationships; or
- any time-sensitive chart fact whose authority requires an unavailable
  instant.

Personal interpretation must gracefully degrade to facts that remain
authoritative under the accepted authority model. A body or sign fact may be
used only when the source explicitly establishes that it is valid for the
available input. A rule that requires unavailable time authority is skipped;
the renderer does not replace it with softer language or a generic horoscope.

The visible result may therefore be:

```text
FACT_ONLY
FACT_PLUS_LEARN
FACT_PLUS_MEANING
FACT_PLUS_MEANING_PLUS_LEARN
```

only where the relevant authority and policy gates permit that state. It may
also be `TECHNICAL_ONLY` or omitted. Unknown-time limitations should be
explained once in humane language near the affected content, not repeated as
filler in every paragraph.

## 12. Surface application

This architecture is a shared policy. It does not implement any surface.
Future surface projections are:

| Surface | Personal editorial job | Context boundary |
| --- | --- | --- |
| My Chart | Stable, long-term personal themes and natal reference. | Natal facts first; no current chapter or transit implication without a separately supplied temporal context. |
| Weekly | The current chapter: selected natal relevance plus current-sky relevance. | Requires an admitted period identity and temporal evidence; must preserve the Weekly Reading Model's ownership and provenance. |
| Today | Lightweight immediate orientation. | Must remain thin and source-backed; no invented daily event or urgency. |
| Month | A slower, larger pattern or collectible artifact. | Requires a valid monthly period and source-backed windows; no calendar-to-celestial shortcut. |

These are future editorial projections, not route or UI authorization. The
current result and Weekly development contracts remain unchanged until a
separate implementation/admission task says otherwise.

## 13. AI boundary

The frozen boundary is:

```text
Engine / ChartFacts
    -> deterministic semantic synthesis
        -> structured personal themes
            -> AI may assist with bounded wording only
```

There is no AI integration in this task. If a later task separately authorizes
an AI language tool, it may:

- phrase an already admitted theme;
- vary rhythm or reading level;
- reduce repetition;
- provide a bounded explanation or educational adaptation; and
- preserve the supplied surface, locale, and style constraints.

It must not:

- infer a chart from a birthday or free-form birth input;
- invent a chart fact, placement, aspect, house, ruler, transit, timing
  window, or provenance identity;
- decide theme existence, importance, ranking, domain, direction, intensity,
  or confidence;
- override unknown-time restrictions;
- convert low-confidence evidence into certainty;
- add a flattering strength that is not supported by the same structure;
- add a new doctrine or personal taxonomy; or
- make a prediction, diagnosis, guarantee, or deterministic life claim.

The AI input, if ever approved, must be the structured admitted theme and its
bounded evidence excerpts, not raw birth input or an unfiltered Engine
payload. Output must preserve the semantic fields, omissions, limitations,
and authority state. Test mode, fixtures, locale, and style may change
observability or wording, but must not change product semantics.

## 14. Representative editorial examples

The examples below are policy demonstrations only. They are not runtime
content, do not expand the Knowledge Canon, and do not authorize a
Planet × Sign composition. They use abstract or already admitted structures.

### 14.1 Constructive interpretation

**Admitted structure:** a supported Moon factor in a personal chart.

**Bounded editorial rendering:**

> This part of the chart can be explored through familiar responses, rhythms,
> and what helps experience feel steady. It may be useful to notice which
> routines restore attention before a deliberate choice.

This leads with constructive potential while keeping the claim about a
bounded Moon question rather than a complete emotional identity.

### 14.2 Tension as trade-off

**Admitted structure:** an Aries sign layer used under the admitted Western
structural lens.

**Bounded editorial rendering:**

> An initiating emphasis can make a first move easier to recognize, while
> making pacing and listening worth attention. The same momentum can support
> action and create a trade-off around when to pause.

The tension comes from the same initiation structure. It does not attach a
random warning to a positive sentence.

### 14.3 Useful lever

**Context:** the initiating pattern above is creating a choice point.

**Bounded editorial rendering:**

> Before acting, name the first reversible step and the information still
> missing. That keeps initiative usable while making room for a deliberate
> check.

This is a bounded observation and adjustment derived from the tension. It is
not a promise that the step will produce a desired outcome and not a generic
instruction to optimize a personality.

### 14.4 Unacceptable flattering rewrite

> You are a brilliant, magnetic natural leader, and everyone will notice your
> confidence.

This fails because it is flattering, universal, identity-defining, and
outcome-promising. It does not name an admitted chart fact, method, modifier,
or limitation.

### 14.5 Unacceptable deterministic rewrite

> Your Moon makes you emotionally unstable, and the next transit guarantees a
> breakup.

This fails because it diagnoses, treats a single factor as a complete cause,
asserts a guaranteed future event, and may invent a transit relationship. No
amount of technical wording can repair those authority failures.

### 14.6 Corrected bounded rewrite

> A supported Moon emphasis may make recurring response, rhythm, and steadiness
> useful questions in this reading. Notice what helps a response settle before
> it becomes a decision; this is an observation to explore, not a diagnosis or
> a forecast. Other chart factors and lived context may change the emphasis.

This version names the bounded semantic layer, offers a useful observation,
preserves agency, and makes room for counterevidence without claiming that the
Moon explains the whole person.

## 15. Knowledge/personal boundary reconciliation

This document is internally consistent with the existing source-of-truth
documents as follows:

| Existing authority | Preserved decision | Personal-editorial refinement |
| --- | --- | --- |
| Interpretation System V1 | `FACT -> SIGNAL -> INTERPRETATION -> PRESENTATION`, deterministic Signal ranking, exact domains/directions/intensity/confidence, fail-closed unknown time, bounded AI containment. | Adds structured Personal Themes and editorial rendering after admitted semantic composition; does not change Signal contracts or weights. |
| Content Value Architecture V1 | Progressive depth, evidence chain, omission/deduplication, show-your-work ladder, contextual Learn, non-deterministic voice, AI boundary. | Freezes the personal reading order and planning bands; the existing value chain remains the broader authority. |
| Knowledge Canon V1 | Source/school policy, limitations, counterevidence, Barnum defense, epistemic status, one Canon. | Uses Canon semantics as inputs and forbids personal prose from becoming new doctrine. |
| My Chart + Contextual Learn V1 | ChartFacts authority, stable natal reference, contextual Learn, unknown-time omission, Stage A/Stage B separation. | Applies the personal narrative to future themes without changing current runtime admission or projection ownership. |
| Weekly Reading Model V1 | Period identity, Hero/Why/Timeline/Astrologer ownership, deterministic selection, development-only status. | Defines how future Weekly personal themes may project into it; it does not replace the Weekly model. |

No conflict requires overwriting an existing source-of-truth document. The
only apparent taxonomy difference is intentional: Content Value Architecture
has reader-facing life-domain labels, while Interpretation System owns the six
internal personal signal domains. This document does not add or merge enum
values.

## 16. Explicit non-goals

This freeze does not implement or authorize:

- broad personal synthesis or production interpretation generation;
- a Personal Theme runtime type, ranking weights, or new Signal rules;
- changes to Engine, ChartFacts, EngineClient, BFF, provider, astronomy,
  timezone, transit, houses, aspects, or rulership calculation;
- My Chart, Weekly, Today, or Month route/UI changes;
- any UI component, renderer, CSS, navigation, browser, or accessibility
  change;
- AI integration, prompt infrastructure, model selection, or generated
  personal prose at runtime;
- localization or a second personal content tree;
- a full Knowledge Canon rewrite, R2 scale admission, or Planet × Sign matrix;
- a database, cache, persistence, notification, subscription, or analytics
  change;
- a public horoscope fallback for missing personal evidence;
- diagnosis, health interpretation, financial prediction, relationship
  guarantee, or deterministic event forecasting; or
- modification of existing deterministic Chart Result interpretation behavior.

The current R2 representative package remains editorial research content and
`RUNTIME_NOT_ADMITTED`. This document does not change that status.

## 17. Future implementation gates

A separately scoped `PERSONAL_SYNTHESIS_POC` may proceed only when the
following gates remain explicit:

1. **Input authority:** every input is an accepted ChartFact, admitted Signal,
   or approved Knowledge Canon object with source, school, policy, and
   limitation metadata.
2. **Semantic authority:** composition is deterministic, traceable, and
   separate from prose; no language model selects facts or importance.
3. **Theme contract:** each candidate carries domain, direction, intensity,
   confidence, source references, context, and suppression/limitation state.
4. **Ranking contract:** selection has declared factors, stable tie-breaking,
   redundancy suppression, and a reviewable version; no invented weights are
   implied by this document.
5. **Editorial gate:** Recognition, constructive potential, same-structure
   tension, and bounded lever pass the Canon's anti-Barnum and
   non-determinism checks.
6. **WHY gate:** the selected theme can answer the fact, relationship, time
   context, birth-time, confidence, and school/policy questions in plain
   language.
7. **Learn gate:** every learning link resolves to the one Knowledge Canon or
   approved Foundations source; personal wording cannot create doctrine.
8. **Unknown-time gate:** ASC, MC, houses, house themes, angles, and other
   unavailable time-dependent facts are suppressed without fallback or
   substitution.
9. **Surface gate:** My Chart, Weekly, Today, and Month each provide the
   required period and authority context before they render time-sensitive
   themes.
10. **AI gate:** any AI use receives structured admitted themes only and is
    separately authorized, bounded, and checked for semantic preservation.
11. **Runtime gate:** research/fixture content remains clearly marked and no
    runtime import, production route, or provider assumption is introduced by
    the POC.
12. **Owner gate:** Product Owner review and the relevant implementation or
    browser acceptance gate are completed separately from this architecture
    freeze.

The architecture is ready to inform a bounded `PERSONAL_SYNTHESIS_POC` once
that task is separately opened and its input authority is explicit. It is not
ready for broad-scale synthesis, production personal interpretation, or a
runtime migration based on this document alone.

## 18. Final decision

```text
PERSONAL_EDITORIAL_ARCHITECTURE_V1
ARCHITECTURE_FROZEN_WITH_CONDITIONS
READY_FOR_BOUNDED_PERSONAL_SYNTHESIS_POC
NOT_READY_FOR_SCALE_OR_RUNTIME_ADMISSION
```

This freeze establishes one personal editorial authority above the existing
semantic contracts, preserves the existing Knowledge Canon and Learning
architecture, and keeps all implementation and admission work separately
gated.
