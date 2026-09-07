# NatalNode Personal Chart Coverage Architecture V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-PERSONAL-CHART-COVERAGE-001` |
| Baseline | `bb98a73203ac04c4776683babac27f6a5ae5ac13` |
| Status | `ARCHITECTURE_FROZEN_WITH_CONDITIONS` |
| Scope | Complete but selective future coverage for a natal chart |
| Runtime changes authorized by this document | `ZERO` |
| Engine repository changes authorized by this document | `ZERO` |
| Provider status | `PROVIDER DECISION DEFERRED` |
| Runtime admission | `RUNTIME_NOT_ADMITTED` |
| Broad-scale readiness | `NO` |

This document freezes the coverage architecture for a mature NatalNode
personal chart reading. It answers what a real natal chart may eventually need
to cover and how those facts become a small, useful set of personal themes. It
does not implement a broad astrology corpus, create a production PersonalTheme
runtime, calculate astronomy, choose a provider, or authorize a My Chart
release.

The machine-auditable capability matrix is
[`docs/research/personal-synthesis/PERSONAL_CHART_COVERAGE_MATRIX_V1.json`](../research/personal-synthesis/PERSONAL_CHART_COVERAGE_MATRIX_V1.json).
The review and gate record is
[`docs/research/personal-synthesis/PERSONAL_CHART_COVERAGE_ARCHITECTURE_V1_REVIEW.md`](../research/personal-synthesis/PERSONAL_CHART_COVERAGE_ARCHITECTURE_V1_REVIEW.md).

## 1. Decision boundary

The product principle is:

```text
CHART COVERAGE != READER-FACING CARD COUNT
```

A natal chart may contain many meaningful facts. The product should not expose
each fact as a primary card, repeat one keyword in several domains, or use
fluent prose to make incomplete evidence feel certain. The target future flow
is:

```text
MANY CHART FACTS
    -> SEMANTIC COMPOSITION
    -> THEME CANDIDATES
    -> RELATIONAL ENRICHMENT
    -> REDUNDANCY / COUNTEREVIDENCE / SUBSUMPTION
    -> SELECTED CORE THEMES
    -> WHY / LEARN / TECHNICAL DEPTH
```

This is a coverage architecture, not a second interpretation architecture. It
preserves the existing authority chain:

```text
Engine / approved ChartFacts
    -> Signal and semantic composition
    -> Candidate Personal Themes
    -> Deterministic selection
    -> Personal editorial projection
    -> WHY / LEARN / ASTROLOGER'S VIEW
    -> Product surface
```

The existing Fact → Signal → Interpretation → Presentation model remains the
system boundary. The current deterministic Chart Result path remains the
current chart-result owner. This document adds no competing source of truth.

## 2. Reconciled authorities and current proof

The architecture is constrained by the following existing authorities:

| Authority | Constraint retained here |
| --- | --- |
| `docs/product/NATALNODE_PERSONAL_EDITORIAL_ARCHITECTURE_V1.md` | Personal meaning is conditional, selective, traceable, and downstream of admitted semantics; runtime changes remain zero. |
| `docs/product/NATALNODE_CONTENT_VALUE_ARCHITECTURE_V1.md` | More content is not more value; one semantic meaning has one visible owner; progressive depth and omission over filler are required. |
| `docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md` | Fact, Signal, Interpretation, and Presentation stay separate; the six Signal domains and closed direction/intensity/confidence vocabularies remain authoritative. |
| `docs/product/NATALNODE_BODY_SIGN_COMPOSITION_METHOD_V1.md` | A placement is one evidence unit with distinct body/sign dimensions and derived sign layers; the method is representative and runtime-unadmitted. |
| `docs/product/NATALNODE_COMPOSITION_SIGNAL_POLICY_V1.md` | The seven targeted placement rules are bounded Signals with integrated domain derivation, `NEUTRAL`, `SUBTLE`, `LOW`, and fail-closed admission. |
| `docs/product/NATALNODE_BODY_ASPECT_BODY_COMPOSITION_METHOD_V1.md` | A relational fact preserves body A, body B, and the aspect operator as one relational unit over dependent roots. |
| `docs/product/NATALNODE_ASPECT_SIGNAL_POLICY_V1.md` | Four Moon–Mercury aspect rules are bounded research Signals; relation meaning does not create a new independent root. |
| `docs/research/personal-synthesis/PERSONAL_SYNTHESIS_POC_001_REVIEW.md` | Synthesis is deterministic, traceable, authority-aware, and separate from production. |
| `docs/research/personal-synthesis/SHARED_ROOT_RELATIONAL_SYNTHESIS_POC_001_REVIEW.md` | Relational enrichment can subsume shallow placements while retaining three semantic units and two unique astronomical roots. |
| `docs/research/personal-synthesis/RELATIONAL_MY_CHART_POC_001_REVIEW.md` | Human-first relational presentation is a development-only reader POC, not production My Chart. |
| `docs/research/astrology-knowledge-canon/primitives/PRIMITIVE_COVERAGE_MATRIX.md` | Primitive source and editorial readiness do not imply runtime readiness or professional/technical completeness. |
| `packages/contracts/src/chart.ts` | Web consumes supplied body, angle, house, and aspect facts; it does not calculate them. |
| `apps/web/src/features/my-chart/my-chart-evidence-projection.ts` | The current My Chart evidence projection is explicitly `DEVELOPMENT_RESEARCH_ONLY` and time-dependent facts are omitted in the unknown-time scenario. |

The repository has proved bounded research/dev slices, not a mature production
coverage system:

| Proven slice | What it proves | What it does not prove |
| --- | --- | --- |
| Body × Sign representative method | Seven targeted integrated placement meanings, one placement evidence unit, and cross-matrix differentiation. | A complete Planet × Sign matrix or production content. |
| Composition → Signal policy | Seven targeted placement Signals with integrated domain semantics, `NEUTRAL`, `SUBTLE`, `LOW`, and duplicate suppression. | Production Signal emission or a chart-level selector. |
| Body × Aspect × Body method | Four Moon–Mercury relational meanings with explicit root lineage. | A full aspect/body inventory or a universal orb/phase doctrine. |
| Aspect Signal policy | Four relational Signal rules with one semantic unit, three dimensions, and two roots. | Production aspect Signal wiring or all aspect pairs/types. |
| Personal Synthesis POC | Deterministic candidate handling, coherence checks, duplicate suppression, and bounded selection. | A mature chart-wide coverage selector or production authority. |
| Shared-root relational Synthesis POC | A conjunction can enrich and subsume two placement themes without evidence inflation. | Automatic enrichment for every relationship or a production synthesis service. |
| Relational My Chart POC | Human-first presentation with WHY, LEARN, and technical depth separated. | Production My Chart admission, provider authority, or runtime semantics. |
| Current My Chart evidence projection | A development-only fact/meaning/Learn/technical projection and unknown-time omission shape. | PersonalTheme selection or an authoritative natal reading. |

Research proof is therefore recorded as `BOUNDED_POC_ONLY` in the matrix. It
must not be rewritten as production readiness.

## 3. Mature coverage layers

The mature product target covers the following conceptual layers. “Needed” is a
product-coverage requirement; it is not a statement that the layer is admitted
today.

| Layer | Reader question | Main inputs | Future role |
| --- | --- | --- | --- |
| Core identity / orientation | What organizes direction and self-expression? | Sun placement, qualifying relations, context | Candidate theme or WHY support |
| Inner response / need | What recurring response, rhythm, or need is relevant? | Moon placement and relations | Candidate theme or WHY support |
| Thinking / naming | How are distinctions, meanings, and information handled? | Mercury placement and relations | Candidate theme or WHY support |
| Relating / valuing | How are value, preference, attraction, and relating explored? | Venus placement and relations | Candidate theme or WHY support |
| Action / desire | How are effort, assertion, pursuit, and adjustment explored? | Mars placement and relations | Candidate theme or WHY support |
| Angles / orientation to life | How is chart orientation framed through the horizon and meridian? | ASC, MC, angle relations | Conditional candidate or technical context |
| Houses / life context | Where does a supported pattern operate in the chart? | House system, cusps, body-in-house facts | Context modifier, not a generic house card |
| Planet–planet relationships | How do two functions interact? | Admitted aspects, body pair, orb/phase when authoritative | Relational unit and possible enrichment |
| Repeated themes / convergence | Which distinct facts point to a genuinely shared question? | Separate roots plus admitted semantic overlap | Promotion/selection consideration, never duplication |
| Relational enrichment | Does a relation explain coordination better than two shallow themes? | Placement units plus compatible relational unit | Subsume, enrich, or retain separately |
| Counterevidence / trade-offs | What qualifies, complicates, or narrows the lead theme? | Separately admitted semantic units | Tension, narrowing, support, split, or suppression |
| Life-domain synthesis | Which bounded life question does the integrated meaning serve? | Integrated composition and existing six domains | Domain label, never a domain quota |
| Personal editorial output | What is useful to read now? | Selected PersonalTheme candidates | Three-to-five core theme target plus depth |
| WHY / LEARN / ASTROLOGER'S VIEW | Why this theme, what can I learn, and what is technical? | Provenance, Canon, Foundations, facts, limits | Progressive depth without new claims |

## 4. Five independent readiness dimensions

No capability has one authoritative `ready` boolean. Every matrix row keeps
these dimensions independent:

1. **SOURCE READINESS** — reviewed Canon, Foundations, or contract support is
   sufficient for the stated layer. Source-ready does not mean that the
   interpretation method exists.
2. **SEMANTIC METHOD READINESS** — an admitted deterministic composition can
   combine the required dimensions without keyword concatenation or invented
   astronomy.
3. **SIGNAL POLICY READINESS** — the semantic result has a safe structured
   Signal policy with closed domains, direction/intensity/confidence, authority,
   provenance, and fail-closed rules.
4. **SYNTHESIS READINESS** — the existing deterministic Personal Synthesis
   boundary can use the unit correctly, including roots, duplicates,
   convergence, relational enrichment, counterevidence, and subsumption.
5. **PRODUCTION FACT AUTHORITY** — the production Engine/BFF/provider boundary
   can currently supply the required fact authoritatively for the intended
   use. A contract shape alone is not production authority.

The matrix records each dimension under `readiness` and also retains the
requested source, policy, implementation, and production state fields. In
particular:

```text
SOURCE READINESS != SEMANTIC METHOD READINESS
SEMANTIC READINESS != FACT AUTHORITY
EDITORIAL PRIORITY != INTERPRETIVE CONFIDENCE
```

The four original Moon/Mercury Body × Sign rules remain bounded-PoC-ready
through research synthesis. The targeted Sun/Venus/Mars expansion is currently
bounded-PoC-ready through source, semantic method, and Signal policy; its
chart-level synthesis remains intentionally pending. Production fact authority
remains unavailable because the provider/scientific configuration gate is open.

## 5. Mature chart data and semantic-unit model

The eventual chart input is grouped as follows:

```text
CHART FACTS
  A. identity / orientation facts
  B. personal-function placements
  C. houses / angles
  D. planet–planet aspects
  E. derived structural context

    -> SEMANTIC UNITS
       placement units
       relational units
       context units

    -> SYNTHESIS
       independent convergence
       relational enrichment
       redundancy
       subsumption
       counterevidence

    -> PERSONAL THEMES
    -> LIFE QUESTIONS
    -> READER EXPERIENCE
```

The Web never derives longitude, houses, aspects, angles, orb, phase, or a
time-sensitive fact. Those are supplied by the authoritative boundary. Derived
semantic context such as element, modality, and rulership remains explanatory
context inside an admitted composition; it is not a new astronomical root.

The accounting rules are frozen:

- one body × sign placement is one placement semantic unit and one placement
  evidence unit;
- one body × aspect × body Signal is one relational semantic unit with three
  semantic dimensions and two dependent position roots;
- body/sign dimensions, aspect operator, element, modality, and rulership do
  not become independent evidence merely because they are distinct concepts;
- independent convergence requires genuinely separate authoritative ChartFacts
  and an admitted semantic-overlap decision; and
- duplicate facts and repeated references are suppressed without silently
  choosing between conflicting facts.

## 6. Capability matrix contract

The matrix is the implementation-independent coverage registry for this
architecture. Every capability record includes:

```text
capabilityId
conceptualLayer
readerValue
requiredChartFacts
requiredSemanticMethod
requiredSignalPolicy
synthesisRole
birthTimeDependency
sourceSupport
policyAdmission
implementationState
productionAuthorityState
currentUsability
missingDependencies
recommendedNextGate
readiness
```

The rows intentionally include both already-proven representative slices and
future target layers. A future row may be source-ready while its method,
Signal, synthesis, or production authority fields remain `NOT_READY`.

### 6.1 Personal bodies

The current Canon package explicitly admits Sun, Moon, Mercury, Venus, and
Mars as bounded body functions with conditions. It does not admit an equivalent
personal-body package for Jupiter, Saturn, Uranus, Neptune, or Pluto in
`PERSONAL_BODIES.md`; those bodies are therefore not silently treated as
equally mature. The matrix records the outer-planet placement layer as future
scope rather than fabricating coverage.

Sun, Moon, Mercury, Venus, and Mars may eventually participate in Body × Sign,
Body × House, and relational compositions. The current Body × Sign method
contains the four original Moon/Mercury × Aries/Taurus records plus a targeted
Sun × Aries, Venus × Taurus, and Mars × Aries expansion. The existing Sun ×
Taurus material remains a comparison control. The three new records have
composition and placement-Signal policy coverage, but are not yet admitted to
chart-level synthesis or runtime.

### 6.2 Angles and houses

The chart contract contains body, angle, house, and aspect shapes, but the
contract is not proof that the production provider and scientific identity
chain are closed. ASC, MC, houses, and angle relations require resolved birth
time/location authority. Unknown time removes them; it never receives a noon,
midnight, average, or inferred substitute.

House placement is a context layer. A future `BODY × SIGN × HOUSE` method must
be admitted before a house can alter a personal theme. Generic house meanings
or one-card-per-house output are not admitted by this architecture.

### 6.3 Aspects

The current taxonomy contains the five major aspect IDs. The representative
Body × Aspect × Body and Aspect Signal packages admit only conjunction, trine,
square, and opposition for the Moon–Mercury pair. Sextile remains a taxonomy
fact with no new semantic policy in this task. The matrix marks it future
coverage; this architecture does not invent a sextile interpretation or orb
table.

Aspect count, house count, and orb tightness are not importance signals unless a
future structural-salience policy explicitly admits them. An aspect may enrich
two placement meanings, subsume them, remain a supporting relation, or be
suppressed; it does not automatically become a third card.

## 7. Theme selection and presentation budget

The default mature My Chart direction is **3–5 CORE PERSONAL THEMES**. This is
a product composition target, not a mathematical guarantee and not a minimum.

### 7.1 Three presentation levels

**Level 1 — Core Personal Themes**

The target is three to five themes that earn primary visibility through
specificity, personal relevance, semantic distinctness, sufficient support, and
synthesis value. A chart with insufficient authority or admitted semantics may
produce fewer than three. A chart with more than five good candidates must
select, merge, subsume, or move the rest to supporting depth.

**Level 2 — Supporting Threads**

Useful but non-primary factors may appear in a selected theme's WHY, in an
“also in your chart” section, or as a contextual sub-theme. A supporting thread
does not receive a primary card by default.

**Level 3 — Technical / Learning Depth**

Facts and concepts may be exposed through WHY, Learn, Astrologer's View,
provenance, and technical inspection. Technical visibility does not promote a
fact into a PersonalTheme.

### 7.2 Deterministic selector shape

The future selector uses ordinal gates and stable tie-breaking, not invented
numeric weights. It should evaluate, in order:

1. authority completeness and birth-time eligibility;
2. semantic validity and forbidden-inference checks;
3. candidate personal relevance to the My Chart question;
4. semantic distinctness and redundancy;
5. independent convergence where separate roots and admitted overlap exist;
6. relational enrichment and whether a deeper unit subsumes shallower units;
7. counterevidence and whether the theme should be qualified, split, or
   suppressed;
8. useful domain breadth as a quality consideration, without a domain quota;
9. completeness of WHY, LEARN, and provenance support; and
10. stable identity ordering for unresolved ties.

The selector must not add a new `themeScore = ...` formula merely to rank a
larger chart. The existing Signal foundation's ranking metadata remains an
internal Signal concern; it is not a mature chart-coverage weighting contract.

Promotion to primary visibility is not promotion of confidence, intensity, or
importance. A selected theme may remain `LOW` confidence and `SUBTLE`
intensity. Editorial priority and astrological evidence strength are separate
fields.

### 7.3 No shortcut hierarchies

Sun, Moon, and ASC may have navigational or educational relevance, but there is
no automatic “Sun card 1, Moon card 2, ASC card 3” rule. Likewise:

```text
aspect count != importance
house count != importance
orb tightness != importance
```

unless a separate, reviewed salience policy says otherwise. “Most important
planets” is not a coverage architecture.

## 8. Domains and content value

The six existing Signal domains remain exactly:

```text
SELF
EMOTIONAL
RELATIONSHIP
COMMUNICATION
WORK_CREATION
ACTION_DECISION
```

Domain is derived from integrated composition semantics. Body-only domain
lookup is forbidden. A mature chart should seek useful breadth across life
questions. Domain breadth is a quality consideration, not a one-per-domain
quota. Six domains do not mean six cards. If meaningful synthesis is
concentrated in two domains, the product keeps that result honest.

Each selected theme should be able to support, where the admitted evidence
allows it:

```text
RECOGNITION
CONSTRUCTIVE CAPACITY
PATTERN
TENSION
USEFUL LEVER
WHY THIS SHOWS UP
LEARN
ASTROLOGER'S VIEW
```

The theme is a synthesis object; not every input unit earns an independent
prose block. Good expansion adds a distinct life question, a real convergence,
relational explanation, counterevidence, context, or WHY depth. Bad expansion
repeats a planet/sign meaning, gives every fact a card, paraphrases the same
domain, treats one relation as several themes, or uses fluent language to fake
promotion.

## 9. Synthesis rules

### 9.1 Independent convergence

Independent convergence requires separate evidence root sets and an admitted
semantic overlap. Shared sign, shared domain, shared wording, or shared body
alone is not convergence. A duplicate placement or repeated aspect cannot
self-converge.

### 9.2 Relational enrichment and subsumption

Relationships describe how functions interact; placements describe each
function under its sign. A compatible relational unit may provide the more
useful theme, enrich WHY, or subsume two shallow placement themes. The
relational unit remains traceable and does not add a new independent root.

The accepted bounded example is:

```text
Moon placement unit
  + Mercury placement unit
  + Moon–Mercury aspect unit
  -> one relationally enriched theme
  -> three semantic units
  -> two unique astronomical roots
```

This is a subsumption choice, not a confidence or intensity promotion and not
a universal rule that every aspect becomes a theme.

### 9.3 Counterevidence and redundancy

Counterevidence is a separately admitted semantic unit that qualifies,
complicates, narrows, supports, splits, or suppresses a candidate. A
challenging aspect is not automatically counterevidence, and a “negative” word
is not a policy.

Redundancy suppression removes duplicate facts, duplicate semantic units,
repeated sign/body/relation explanations, and near-identical reader themes
while preserving full provenance in WHY and technical depth. Suppression must
not resolve an actual same-body/different-sign conflict by choosing one sign.

## 10. Unknown birth time

Unknown birth time is a first-class degradation state, not an invitation to
guess. A safe unknown-time result may retain authoritative, time-safe planetary
sign placements and their admitted bounded semantics. It must omit:

- ASC and MC;
- houses and house placements;
- angle relations;
- house-derived themes; and
- Moon-sensitive or other time-sensitive relationships unless the upstream
  authority explicitly certifies them.

The result may be useful but narrower. It must not fabricate noon, midnight, an
average time, a house system, an angle, a time-sensitive aspect, or a generic
substitute. Unknown-time scope and omitted facts belong in the structured
authority/provenance state and should be explained once in human language.

## 11. Production boundary and non-goals

This freeze does not:

- modify the Engine repository, EngineClient, BFF, provider, astronomy,
  timezone, or chart calculation;
- add a production PersonalTheme type, chart-wide selector, or broad Signal
  catalog;
- add Planet × Sign coverage for all bodies/signs;
- create a house library, aspect library, orb policy, or angle doctrine;
- wire research artifacts or development fixtures into the production
  interpretation index or My Chart route;
- change current deterministic Chart Result interpretation behavior;
- add a provider, dependency, AI generation path, UI route, or database; or
- claim production authority because a contract or fixture exists.

The provider decision and cleared scientific configuration remain deferred. The
matrix can therefore say that a chart fact shape is contract-supported while
`productionAuthorityState` remains unavailable. `READY_FOR_PRODUCTION_MY_CHART`
and `RUNTIME_ADMISSION` remain `NO`.

## 12. Prioritized next gates

The first targeted Body × Sign expansion is complete. The next coverage gates
should proceed in this order:

1. **Chart-level selector contract** — freeze the ordinal selector, theme
   hierarchy, cap behavior, redundancy/subsumption decisions, and the
   distinction between editorial priority and confidence.
2. **Targeted personal Body × Sign expansion** — continue only where a body/sign
   composition earns source and policy review; the current first expansion is
   Sun × Aries, Venus × Taurus, and Mars × Aries.
3. **Aspect coverage expansion** — admit additional body pairs and decide the
   sextile boundary through the existing taxonomy; retain orb/phase authority
   and relational-unit accounting.
4. **Counterevidence and chart-level convergence policy** — define how separate
   units qualify, split, support, or suppress a theme, then connect that policy
   to the selector and WHY trace.
5. **House composition method** — define a bounded `BODY × SIGN × HOUSE`
   method, house-system requirements, context limits, and unknown-time behavior
   before admitting house-based personal themes.

Provider/scientific authority, production fact identity, and production My
Chart admission remain separate later gates. They are not bypassed by
completing these research policies.

## 13. Frozen readiness result

This architecture is ready for targeted coverage expansion, not broad scale or
production My Chart:

```text
READY_FOR_TARGETED_COVERAGE_EXPANSION YES
READY_FOR_BROAD_SCALE NO
READY_FOR_PRODUCTION_MY_CHART NO
RUNTIME_ADMISSION NO
```
