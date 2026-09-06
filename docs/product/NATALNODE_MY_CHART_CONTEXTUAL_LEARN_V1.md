# NatalNode My Chart + Contextual Learn V1

Task: WEB-P2-MY-CHART-CONTEXTUAL-LEARN-001
Decision: MY_CHART_CONTEXTUAL_LEARN_ARCHITECTURE_ADMITTED
Validation level: MODULE_PASS
Current runtime: DEVELOPMENT_RUNTIME_ONLY
Provider policy: PROVIDER DECISION DEFERRED

## 1. Executive thesis

My Chart is the stable personal natal reference surface. Its primary job is to
answer:

> What is stable about my natal astrology?

The product value path is:

    REAL NATAL FACT
        -> PERSONAL ASTROLOGY ANCHOR
            -> PLAIN-LANGUAGE MEANING
                -> WHY THIS MATTERS
                    -> LEARN THE CONCEPT
                        -> ASTROLOGER DETAIL

One experience should serve ordinary users, curious learners, skeptical users,
and experienced astrologers. The experience does this through progressive depth,
not through separate products or competing fact stores.

This architecture is stable-natal only. It does not define Today, Weekly,
Month, current Sky, transit interpretation, FOLLOW, relationship timing, or
financial prediction.

The architecture is admitted with a strict two-stage boundary:

- Stage A is a visibly development-only prototype that may use the current
  incomplete fixture to validate information architecture and reading behavior.
- Stage B is the authoritative product and requires a separately admitted
  Engine -> public contract -> BFF -> Web path.

Stage A schema conformity does not imply Stage B readiness.

## 2. Phase 0 — runtime authority finding

The current Web runtime was inspected before freezing this architecture.

### Current classification

DEVELOPMENT_RUNTIME_ONLY

### Current EngineClient binding

The current executable Web/BFF path binds MockEngineClient:

- server executable bindings construct MockEngineClient;
- public development dependencies construct MockEngineClient;
- the accepted executable mode is development-mock;
- the executable configuration rejects development-mock in production mode;
- the browser-facing client is HttpEngineClient, but the current executable BFF
  behind it remains development-mock.

### Current ChartResult authority facts

| Runtime question | Current finding |
| --- | --- |
| Current result source | MockEngineClient returning WEB_UI_FIXTURE_V1. |
| Calculation status | Preserved as INCOMPLETE_RESEARCH. |
| Scientific configuration identity | Null. |
| Provenance identity | Null. |
| Provider identity | No production provider identity is present in the Web runtime. |
| Fixture/mock status | Explicitly development-only and not scientific evidence. |
| Unknown-time input | ChartRequest can carry localTime = null, resolvedUtcInstant = null, and UNKNOWN_TIME, but MockEngineClient ignores the request and ChartResult does not carry the request back. Unknown-time state therefore does not currently survive as a ChartResult authority field. |
| Production authority | Not admitted. |

The current runtime is useful for Stage A composition only. It must never be
described as authoritative personal astrology.

## 3. Stage A and Stage B boundary

### Stage A — development product prototype

Stage A exists to validate:

- My Chart information architecture;
- personal evidence-anchor presentation;
- contextual learning behavior;
- technical inspection UX;
- unknown-time behavior;
- ordinary-reader comprehension.

Stage A may use INCOMPLETE_RESEARCH and WEB_UI_FIXTURE_V1 only when the
development boundary is explicit in the architecture and UI.

Stage A may not claim:

- authoritative personal astrology;
- production scientific authority;
- production-ready calculation;
- production provider validation;
- scientific validation merely because the result matches ChartResult shape.

The Stage A disclosure should use the existing project convention or an
equivalent clear label such as:

    DEVELOPMENT RESEARCH PREVIEW
    INCOMPLETE RESEARCH CALCULATION

### Stage B — authoritative product

Stage B requires an admitted path:

    Engine
        -> Public Contract
            -> BFF
                -> Web

The path must satisfy the applicable provider, rights, scientific
configuration, provenance, validation, and local/historical time-authority
gates.

The runtime must perform an authority check before rendering any production
claim. If required authority is absent or inconsistent, the product must fail
closed. It must not silently fall back to Stage A or a generic personal
interpretation.

## 4. My Chart page job

My Chart is:

- the user's stable natal reference;
- a factual astrology surface;
- a personal learning entry point;
- a progressive-depth inspection surface.

My Chart is not:

- Today;
- Weekly;
- Month;
- a current-sky forecast;
- transit interpretation;
- a generic dashboard;
- a mystical fortune surface.

The page should make the distinction between stable natal facts and temporal
content visible in its information architecture.

## 5. Core reading ladder

Every primary natal fact should be able to support this ladder:

| Depth | Reader question | Product response |
| --- | --- | --- |
| NOTICE | What is this? | Name the factual chart anchor in ordinary language. |
| USE | What does this mean for me? | Show only a bounded meaning when the interpretation is eligible. |
| EXPLORE | What other chart context is connected? | Link related placements, angles, houses, or aspects that actually exist. |
| UNDERSTAND | Why does astrology interpret it this way? | Open contextual Learn without leaving the current fact context. |
| GO DEEPER | What exact technical fact does the chart contain? | Reveal degree, house, aspect, orb, phase, motion, and authority detail when supplied. |

This is the My Chart application of the existing Progressive Depth model. Depth
must expose more evidence and explanation, not more unsupported certainty.

## 6. Canonical conceptual unit — Chart Evidence Item

The canonical conceptual unit is:

    CHART EVIDENCE ITEM

It is a presentation-neutral concept, not a runtime type in this task.

A Chart Evidence Item can represent:

1. a factual anchor and its structural reference;
2. authority state;
3. an ordinary-reader label;
4. personal-meaning eligibility;
5. contextual Learn hooks;
6. technical detail;
7. source traceability;
8. unknown-time applicability;
9. development-only disclosure when the current runtime is incomplete.

Conceptual example:

    [factual placement]
        -> [ordinary label]
            -> [bounded personal meaning, if eligible]
                -> [What is this concept?]
                    -> [existing Foundations lesson]
                        -> [technical chart detail]

The concept is generic. It must not be hardcoded around Mercury, a specific
planet, or any single interpretation.

The item must carry evidence state rather than manufacture meaning. It must not
recalculate astrology, assign importance, invent a fact identity, or turn a
fixture into authority.

## 7. Stable natal fact eligibility matrix

The matrix separates reader visibility, learning eligibility, technical depth,
unknown-time behavior, and current-runtime limits.

| Fact class | Ordinary-reader visible | Contextual Learn eligible | Astrologer detail eligible | Unknown-time behavior | Stage A current runtime |
| --- | --- | --- | --- | --- | --- |
| Body placement | Yes when supplied and valid | Yes | Yes | Conditional; show only if accepted authority explicitly says the fact remains valid without a known instant | DEVELOPMENT_RESEARCH_ONLY |
| Sign placement | Yes when supplied and valid | Yes | Yes | Conditional for the same reason; never infer time invariance from a fixture | DEVELOPMENT_RESEARCH_ONLY |
| House placement | Yes, usually expandable | Yes | Yes | Omit when birth time is unknown or house authority is not valid | DEVELOPMENT_RESEARCH_ONLY |
| Angles | Yes when applicable | Yes | Yes | Omit ASC, MC, ARMC, and related precision when birth time is unknown | DEVELOPMENT_RESEARCH_ONLY |
| Aspects | Yes for selected key relationships | Yes | Yes | Conditional; omit if the accepted input authority cannot establish the relationship | DEVELOPMENT_RESEARCH_ONLY |
| Orb / separation | Not default; expandable | Only for explaining technical reading | Yes | Omit if the underlying aspect is not valid | DEVELOPMENT_RESEARCH_ONLY |
| Aspect phase | Not default; expandable | Only when the concept is admitted | Yes | Omit if the underlying aspect or time authority is not valid | DEVELOPMENT_RESEARCH_ONLY |
| Motion / retrograde | Optional factual status | Yes for bounded education | Yes | Conditional on a valid time-dependent result | DEVELOPMENT_RESEARCH_ONLY |
| Warnings / authority limits | Yes as plain disclosure | Yes for explaining why content is limited | Yes | Show the unknown-time or incomplete-authority limit | DEVELOPMENT_RESEARCH_ONLY |
| Calculation / provenance metadata | Status visible; raw IDs not default | Learn about calculation authority, not astrology meaning | Yes | Show missing or suppressed authority explicitly | DEVELOPMENT_RESEARCH_ONLY |

The word “valid” means valid under the accepted authority model, not merely
present in a structurally conforming object.

## 8. Unknown birth time

Unknown birth time is a first-class product boundary, not an error state.

### 8.1 What remains

The page may still provide:

- general astrology education;
- the meaning of the unknown-time limitation;
- body or sign facts only when the accepted authority model explicitly
  certifies them as valid for the available input;
- eligible aspects only when the accepted authority model explicitly certifies
  them;
- calculation/status explanation;
- the existing Foundations entry points.

The current Web ChartResult contract does not carry a dedicated
time-independent-validity field. Therefore Stage A must not infer that a body,
sign, or aspect is time-independent merely because a fixture contains it.

### 8.2 What is omitted

When birth time is UNKNOWN, omit or suppress:

- ASC;
- MC;
- ARMC and related angles;
- houses and house placement;
- time-derived precision;
- orb, phase, motion, or aspects when the accepted authority cannot establish
  them for the available input.

### 8.3 Why it is omitted

The Engine expects normalized UTC input, while unknown-time input has no
resolved UTC instant. A mock result that ignores the request cannot establish
time authority. Showing time-dependent facts anyway would fabricate authority.

### 8.4 How the user learns why birth time matters

The page should show a concise explanation near the unavailable fact group:

    Birth time helps determine the horizon, angles, houses, and other
    time-sensitive chart detail. NatalNode has left those fields out because
    an exact birth time was not supplied.

The explanation should link to the existing calculation-details and
responsible-use Foundations hooks. It should not repeatedly shame or block the
user from general learning.

## 9. Personal Astrology Anchor

A PERSONAL ASTROLOGY ANCHOR is a factual chart-derived item that connects:

    ASTROLOGY -> THE USER -> MEANING -> LEARNING

An anchor must contain a real supplied chart fact. Examples include:

- a body in a supplied sign;
- a supplied natal aspect;
- an Ascendant when birth-time authority permits it;
- a house placement when house authority permits it.

The architecture must never invent an anchor because the page needs a hero,
because a fixture contains a convenient value, or because an interpretation
would be more engaging.

Every anchor has an authority state. Stage A anchors are explicitly
development/research anchors. Stage B anchors require an authoritative
ChartResult.

## 10. Astrology category recognition

My Chart is a primary astrology surface. Its first viewport should eventually
communicate all of the following without relying mainly on decoration:

1. this is the user's natal chart;
2. the page contains real chart-derived facts;
3. the facts can be understood in plain language;
4. the user can learn the astrology concepts behind them;
5. deeper technical detail is available;
6. the current authority state is visible.

Legitimate astrology/celestial visual identity may support the hierarchy, but
real chart facts should create the primary astrology identity. Do not use random
glyphs, decorative orbital geometry, or a mystical hero in place of evidence.

## 11. Fact, meaning, learning, and technical separation

The page must preserve four visible concepts:

| Concept | Example | Rule |
| --- | --- | --- |
| FACT | Mercury in Gemini | Must come from the supplied ChartResult/evidence source. |
| INTERPRETATION | NatalNode's bounded interpretation of that placement | Must be admitted by interpretation policy and labeled as interpretation. |
| LEARNING | What Mercury represents in astrology | Comes from the existing Foundations/glossary architecture. |
| TECHNICAL DETAIL | Degree, house, aspect, orb, phase, provenance | Shown only when supplied and appropriate for the authority stage. |

These must not be merged into one opaque prose paragraph. The reader should be
able to tell what the chart contains, what NatalNode means by it, what
astrology convention is being taught, and what technical evidence supports it.

Avoid free-floating words such as energy, invitation, cosmic message, destiny,
or alignment unless a specific admitted context requires them. My Chart should
feel astrological, personal, educational, and inspectable rather than like
spiritual fortune copy.

## 12. Contextual Learn model

Learning starts from something already visible in My Chart.

    user sees a Chart Evidence Item
        -> selects “What is this?”
            -> reads a short concept explanation in context
                -> sees why the concept matters to this item
                    -> opens an existing Foundations lesson if desired
                        -> returns to the same My Chart item

The first learning step should not force an immediate route change. A bounded
drawer, inline expansion, side panel, or equivalent progressive disclosure may
be chosen during implementation. The architecture does not freeze a component
technology.

Contextual Learn is an entry point and personal-context bridge into the existing
Learn architecture. It is not a second curriculum.

Personal language such as “in your chart” is permitted only when a real
personal anchor exists and its authority state allows the statement. General
Learn content must remain clearly general when a personal anchor is unavailable.

## 13. Learning hook matrix

| Hook type | Short contextual explanation | Deeper Learn destination | Personal context allowed | Authority prerequisite |
| --- | --- | --- | --- | --- |
| PLANET / BODY | What this celestial body represents in astrology. | Existing planet-overview or placement Foundations hook. | Yes only when the body fact is real and eligible. | Stage A disclosure or Stage B authoritative ChartResult. |
| SIGN | How signs describe style or mode in the existing curriculum. | Zodiac-structure or placement Foundations hook. | Yes only for a supplied sign placement. | Same as the body fact; no fixture promotion. |
| HOUSE | What a house describes as a chart area. | Houses-and-angles Foundations hook. | Yes only when birth time and house authority are valid. | Known-time authority; Stage B for authoritative claims. |
| ANGLE | Why ASC/MC and related angles matter. | Houses-and-angles or calculation-details hook. | Yes only when the angle is supplied and time-valid. | Known birth time and valid authority. |
| ASPECT | How a relationship between bodies is represented. | Major-aspects Foundations hook. | Yes only for a supplied eligible aspect. | Valid body states and admitted aspect semantics. |
| ORB | How distance from exactness is represented technically. | Major-aspects or calculation-details hook. | Usually technical context, not default personal meaning. | Valid aspect plus admitted configuration. |
| PHASE | What applying, exact, or separating means when supplied. | Major-aspects or calculation-details hook. | Only when the underlying aspect is valid. | Valid aspect and phase semantics. |
| MOTION / RETROGRADE | What the supplied motion state means in astrology convention. | Planet-overview or calculation-details hook. | Only when the motion state is authoritative for the result. | Valid time-dependent result and authority state. |
| UNKNOWN BIRTH TIME | Why houses, angles, and some precision are unavailable. | Calculation-details and responsible-use hook. | Yes as a limitation explanation, not as a fabricated placement. | Explicit UNKNOWN_TIME state or equivalent authoritative input state. |

Hook destination names remain aligned with existing Foundations hooks. No second
astrology curriculum or duplicate lesson identity is introduced.

## 14. Foundations reuse

Contextual Learn reuses:

- Foundations;
- the existing glossary/content identity;
- the learning architecture;
- existing chart-related hooks;
- responsible-use and calculation-boundary explanations.

It should bridge from a personal evidence item into an existing lesson, not
create a My Chart-only lesson set. The chart surface owns personal context; the
Learn surface owns reusable conceptual education.

## 15. Learning content authority

The following authorities remain separate:

| Layer | Responsibility | Must not become |
| --- | --- | --- |
| ASTROLOGY CONVENTION | Explain the established symbolic vocabulary used by the product. | A claim of empirical scientific validation. |
| NATALNODE INTERPRETATION POLICY | Define bounded, responsible meaning language. | A calculator or provider. |
| CALCULATION FACT | State what the admitted result contains. | A prose interpretation. |
| PERSONAL INTERPRETATION | Explain an eligible fact in the product's bounded voice. | A new chart fact or certainty claim. |
| SCIENTIFIC CLAIM | Describe calculation authority, validation, and provenance honestly. | Astrology convention or marketing language. |

Technical calculation rigor and empirical scientific validation are different
questions. The page must not merge them.

## 16. Personal meaning eligibility

Not every chart field deserves a prose interpretation. The conceptual
eligibility states are:

| Eligibility | Use |
| --- | --- |
| FACT_ONLY | Show the fact and authority state without personal prose. |
| FACT_PLUS_LEARN | Show the fact and general concept education. |
| FACT_PLUS_MEANING | Show a bounded personal meaning when policy admits it. |
| FACT_PLUS_MEANING_PLUS_LEARN | Show bounded meaning and the concept lesson together. |
| TECHNICAL_ONLY | Show the value only in expandable technical detail. |
| OMIT_FROM_ORDINARY_VIEW | Keep raw/internal/unsupported material out of the default reader view. |

Stage A may validate FACT_PLUS_MEANING behavior only as a clearly labelled
development research preview. Stage B may use it as authoritative product
meaning only when both the fact authority and interpretation policy gates are
closed.

The first implementation should prefer a small number of strong evidence items
over hundreds of weak interpretations.

## 17. Content prioritization

The initial product information hierarchy is:

    CORE IDENTITY
        -> PLANETS
            -> ANGLES / HOUSES WHEN VALID
                -> KEY ASPECTS
                    -> DEEPER CHART DETAIL

This is product IA, not a claim that one astrological category is universally
more important. Product IA decides default visibility, grouping, and progressive
disclosure. Future Signal/Interpretation semantics decide domain meaning,
direction, intensity, eligibility, and any cross-fact prioritization.

The UI must not invent importance by ordering fields, showing a badge, or
calling a placement “core” unless the relevant semantic authority supplies that
decision.

## 18. First-viewport model

The first viewport should communicate:

    MY NATAL CHART
    [current authority / development status]

    real chart overview or real chart identity

    CORE CHART ANCHORS
    [one or a small number of real Chart Evidence Items]

    What this means for me
    Learn the concept

    [technical details available progressively]

The first viewport must contain explicit astrology-domain language, a real
personal chart anchor when one exists, and an honest authority disclosure.
Generic dashboard language, mystical filler, or large decorative orbital art
must not replace the facts.

## 19. Real-chart visual role

The existing chart renderer may provide the strongest Type A factual visual
identity. This task does not redesign it.

The target architecture allows three levels of chart participation:

| Chart role | Purpose |
| --- | --- |
| Full chart | Establish the natal chart as a real inspectable object. |
| Chart overview | Show the chart relationship to the evidence-item hierarchy. |
| Highlighted chart element | Connect a selected evidence item to the real geometry when the renderer supports it. |

No fake chart fragment should be created. Future interactive highlighting is a
documented interaction possibility, not an implementation in this task.

## 20. Chart/content linking

The target interaction is:

    Chart Evidence Item <-> real chart location

Examples:

- selecting a body placement can highlight the actual body location;
- selecting an aspect can highlight the actual aspect line;
- selecting an angle can reveal the actual angle geometry when supplied.

Stage A may use result-local structural references for a deterministic prototype.
Stage A must not call them globally canonical identities.

Stage B requires a stable evidence path supplied by the admitted contract or
Engine. If the public contract still lacks per-fact identity, linking must
remain bounded to the current result and must not imply durable cross-system
identity.

## 21. Professional inspectability

The five-level model is:

| Level | Requirement | My Chart content that can reach it |
| --- | --- | --- |
| 1 | Named celestial source | Body, sign, house, angle, or aspect label. |
| 2 | Plain-language chart relationship | Bounded explanation of what the supplied relationship means. |
| 3 | Technical relationship | Degree, house, aspect type, or related structural detail. |
| 4 | Orb / phase / precise context | Orb, separation, applying/exact/separating phase, and valid time context. |
| 5 | Calculation metadata / provenance / configuration | Calculation status, configuration identity, provenance, provider and time authority. |

Stage A must visibly mark the development authority at every depth where it
appears. Stage B may expose only the levels actually supplied by the admitted
authority. No current development fixture may be presented as Level 5.

## 22. Authority and provenance UX

For ordinary users:

- show a short plain-language authority state;
- show DEVELOPMENT RESEARCH PREVIEW or equivalent in Stage A;
- explain why a fact is omitted when unknown-time or incomplete authority
  prevents it;
- avoid raw internal IDs by default;
- use expandable “calculation details” language for technical inspection.

For experienced astrologers and professionals:

- expose calculation status;
- expose configuration identity when actually supplied;
- expose provider/provenance identity only when actually supplied;
- expose missing or incomplete authority rather than hiding it.

No production metadata may be fabricated for visual polish.

## 23. Stage B runtime gate

Before Stage B can render authoritative personal astrology, the runtime must
establish all applicable items:

- non-fixture source;
- approved provider;
- valid calculation status;
- scientific configuration identity;
- provenance identity or an explicitly admitted complete provenance state;
- applicable local and historical time authority;
- required chart fact completeness;
- public contract and BFF binding;
- no stale or incompatible result authority.

If any required gate is absent, invalid, stale, or inconsistent:

    FAIL CLOSED

The product must not fall back to Stage A and must not substitute generic
interpretation for a missing personal anchor.

## 24. Presentation projection recommendation

A bounded presentation-neutral projection is justified between ChartResult and
My Chart UI.

Recommended conceptual name:

    MyChartEvidenceProjection

This is a recommendation only. No runtime type is implemented by this task.

The projection may:

- select safe factual excerpts;
- normalize reader-facing labels;
- carry authority state;
- carry unknown-time availability;
- attach contextual Learn hook types;
- carry technical inspection fields;
- carry result-local source references.

The projection must not:

- recalculate astrology;
- invent fact identity;
- rank facts without semantic authority;
- generate interpretation;
- duplicate the Engine schema wholesale;
- silently upgrade Stage A authority to Stage B;
- become a second source of truth.

The projection owns presentation selection and disclosure. ChartResult/Engine
owns calculation facts. Interpretation policy owns meaning. Foundations owns
general learning content.

## 25. Per-fact identity gap

The current Web ChartResult contract does not expose a stable per-fact canonical
identity field.

Impact:

- Stage A: NON_BLOCKING_FOR_STAGE_A. Result-local structural references such as
  body ID, angle ID, house number, or aspect body pair/type may support a bounded
  prototype, provided they are not presented as global IDs.
- Stage B: REQUIRED_BEFORE_STAGE_B for durable chart/content linking and
  professional evidence traceability, unless a separately frozen contract
  proves an equivalent stable reference.

The architecture must not invent a pseudo-ID, hash, or UI-generated identity and
call it canonical.

## 26. Minimum viable Stage A vertical slice

The smallest Stage A implementation that can validate the thesis contains:

1. one real structurally valid natal fact from the development ChartResult;
2. explicit DEVELOPMENT_RESEARCH_ONLY authority disclosure;
3. a human-readable factual anchor;
4. bounded meaning only where existing interpretation policy admits it;
5. at least one contextual Learn hook;
6. optional expandable technical inspection;
7. unknown-time-safe behavior;
8. no temporal content.

The deterministic development harness may select a fixture anchor, but the
architecture remains generic. It must not hardcode the product around Mercury,
the Sun, or any other individual planet.

The Stage A acceptance question is whether users can understand the relationship
between a real-looking chart fact, bounded meaning, and an existing lesson while
seeing that the result is research-only.

## 27. Future Product Owner/browser acceptance criteria

An astrology-naive user should be able to answer:

1. What astrology fact am I looking at?
2. What does it mean in ordinary language?
3. Why does NatalNode say this?
4. Can I learn what the astrology term means?
5. Can I see more technical detail if I want?
6. Is it obvious whether this is research-only or authoritative?

An experienced astrology user should be able to answer:

7. What exact chart fact produced this?
8. What technical values are available?
9. What is missing?
10. What authority state applies?

The acceptance test must include known birth time and unknown birth time, mobile
progressive disclosure, and an incomplete/development result. It must not require
desktop-only chart interaction to understand the core content.

## 28. Mobile and content density

The architecture supports:

- a 320px minimum width;
- progressive disclosure;
- chart/content stacking;
- no horizontal dependency for understanding;
- technical detail as opt-in.

Content roles are:

| Role | Default behavior |
| --- | --- |
| DEFAULT VISIBLE | Page job, authority state, one or a few core evidence items, and clear next learning action. |
| EXPANDABLE | Additional facts, related context, bounded meaning, and technical relationship. |
| ADVANCED | Orb, phase, motion, calculation details, configuration, and provenance when supplied. |
| INTERNAL | Raw IDs, operational traces, and implementation diagnostics not intended for ordinary readers. |

## 29. Explicit non-goals

This architecture does not implement or decide:

- current Sky;
- transits;
- Today;
- Weekly;
- Month;
- timing windows;
- Moon phase product behavior;
- FOLLOW or recurrence;
- compatibility or synastry;
- Love Style or relationship timing;
- financial astrology or money prediction;
- AI-generated facts, placements, aspects, houses, importance, identity, or
  Signal existence;
- React, Astro pages, CSS, routes, APIs, BFF bindings, Engine bindings,
  Signals, interpretation rules, learning runtime hooks, database fields,
  provider configuration, or fixtures;
- a chart renderer redesign;
- provider selection.

## 30. Preserved architecture

The following remain authoritative and unchanged:

- Engine boundary;
- ChartFacts/ChartResult contract boundary;
- Content Value Architecture;
- Content Evidence Gap Architecture;
- Interpretation System;
- Learning Architecture;
- Human Reading First;
- Progressive Depth;
- Adaptive Experience Architecture;
- Celestial Editorial Visual Language and Visual V1.1;
- Vault V1;
- Weekly V1/R2 research artifacts;
- PROVIDER DECISION DEFERRED.

No large refactor is required.

## 31. Recommended next task

WEB-P2-MY-CHART-CONTEXTUAL-LEARN-002 — Implement the Stage A
development-only Chart Evidence Item prototype and contextual Foundations
bridge.

Required boundary:

- use the conceptual projection only as a bounded development implementation;
- show DEVELOPMENT RESEARCH PREVIEW or equivalent;
- keep authority state visible;
- preserve unknown-time omission behavior;
- use one generic deterministic fixture anchor;
- do not add production claims, provider bindings, BFF changes, or Stage B
  semantics;
- stop if the implementation would need to invent fact identity or scientific
  authority.

Stage B remains blocked until the runtime authority gates are independently
closed.

## 32. Final decision

    MY_CHART_CONTEXTUAL_LEARN_ARCHITECTURE_ADMITTED
    MODULE_PASS
    DEVELOPMENT_RUNTIME_ONLY
    STAGE_A_DEVELOPMENT_PROTOTYPE_ALLOWED
    STAGE_B_PRODUCTION_AUTHORITY_BLOCKED
    PROVIDER DECISION DEFERRED
    NO_LARGE_REFACTOR_REQUIRED
    READY_FOR_MY_CHART_CONTEXTUAL_LEARN_STAGE_A
