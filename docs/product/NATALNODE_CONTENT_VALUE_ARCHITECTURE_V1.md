# NatalNode Content Value Architecture V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-CONTENT-VALUE-ARCH-001` |
| Status | `CONTENT_VALUE_ARCHITECTURE_ADMITTED` |
| Validation level | `MODULE_PASS` |
| Scope | Product, content, information, and governance architecture only |
| Product source of truth | [`docs/PRD.md`](../PRD.md) |
| Web implementation boundary | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) |
| Provider status | `PROVIDER DECISION DEFERRED` |
| Weekly R2 status | `DEVELOPMENT_RESEARCH_ARTIFACT` |
| Next bounded decision boundary | `READY_FOR_CONTENT_EVIDENCE_GAP_RECONCILIATION` |

This document defines how NatalNode turns authoritative astrology facts into
human value without collapsing facts, interpretation, education, or
presentation into one opaque paragraph. It is a platform-level content-value
model for future product work. It is not a route specification, a production
content policy, or an implementation authorization.

## 1. Admission, boundary, and non-goals

### 1.1 Admission

The admitted architecture is:

```text
CONTENT VALUE ARCHITECTURE V1
  = one product
  + one truth boundary
  + one content identity
  + progressive depth
  + explicit limits
```

The primary reader-facing model is **Progressive Depth**. A reader starts with
an understandable personal meaning, can explore relevant life domains and
timing, can open the explanation, and can continue to technical depth when
authoritative facts support it. Editorial, Observatory, and Starlight remain
presentation directions, not separate products, routes, preference systems, or
prose libraries.

### 1.2 System boundary

The existing authority chain is preserved:

```text
NatalNode.com
    ↓
Website API / BFF
    ↓
NatalNode Engine Public API
    ↓
AstronomyProvider
```

For content composition, the safe conceptual path is:

```text
Engine ChartFacts / TemporalFacts
    ↓
Astrological evidence
    ↓
Signals
    ↓
Interpretation
    ↓
ReadingModel
    ↓
Presentation policy
    ↓
Screen / share / print / learning context
```

The website may group, explain, localize, and present supplied facts. It must
not calculate astronomy, call a provider directly, promote fixtures, invent
timing, or turn a presentation tree into an authority tree.

### 1.3 Explicit non-goals

This architecture does not implement or authorize:

- Home, Today, This Week, This Month, Relationships, Collection, or a new
  Learn surface;
- Weekly R3, a production Weekly route, or a production content-generation
  system;
- new Signals, Engine facts, transits, timing calculations, or chart logic;
- a new route, database structure, analytics system, or notification path;
- UI components, visual redesign, browser behavior, or navigation migration;
- an AI provider, runtime machine translation, or a content-management system;
- a compatibility score, health prediction, gambling outcome, or investment
  prediction;
- any modification to the Engine repository or `C:\NatalNode`.

## 2. Working product thesis

NatalNode is being shaped as:

```text
PERSONAL ASTROLOGY INTELLIGENCE
```

This is a product architecture thesis, not a promise of prediction accuracy or
business performance. Its four jobs are:

| Job | Meaning | First reader question |
| --- | --- | --- |
| `KNOW` | Make the current personal emphasis legible. | What matters for me now? |
| `UNDERSTAND` | Explain why the product is making that claim. | Why are you telling me this? |
| `LEARN` | Teach the astrology concept in the reader's current context. | What does this mean in astrology, and in my chart? |
| `FOLLOW` | Help the reader notice supported change across periods. | What is changing, and what remains active? |

The value loop is therefore:

```text
KNOW → UNDERSTAND → LEARN → FOLLOW → KNOW
```

`FOLLOW` is only valid when period identity and temporal evidence support the
comparison. Editorial prose alone cannot create continuity.

## 3. User motivation model

The same content object must serve different depths of attention. It must not
become four separate products.

| User motivation | Typical question | What the product should provide | What must remain visible |
| --- | --- | --- | --- |
| Ordinary personal-outcome user | How is love, work, money, or my mood lately? | A short, plain, useful meaning connected to relevant life context and a practical next step. | This is a bounded interpretation of the available personal evidence, not a guarantee. |
| Professional / experienced astrology user | What facts, aspect, house, orb, phase, or timing produced this? | A show-your-work path with approved technical facts, method, provenance, and reproducibility when available. | Technical detail is optional depth; it cannot upgrade incomplete authority. |
| Curious learner | What is Mercury, a trine, a house, or an Ascendant? | A contextual explanation linked to the term the reader is already seeing. | Editorial explanation is not a new calculated fact. |
| Skeptical / evidence-seeking user | Why this claim? What is certain, uncertain, or unavailable? | Clear fact/interpretation separation, traceability, limits, and explicit unavailable states. | Missing authority must be disclosed rather than filled with confident language. |

These motivations share one progression:

```text
Life question
    ↓
Personal meaning
    ↓
Astrology evidence
    ↓
Learning context
    ↓
Technical inspection
```

The ordinary reader should not be required to understand `orb`, `house
system`, or `applying aspect` before receiving the first useful meaning. The
advanced reader must still be able to reach those details when the source
authority supports them.

## 4. Core content-value chain

The target chain is:

```text
Astrological fact
    ↓
Personal relevance
    ↓
Interpretation
    ↓
Timing
    ↓
Practical meaning
    ↓
Explanation
    ↓
Learning
    ↓
Technical depth
```

The chain is conditional. A missing or incomplete upstream authority removes
the dependent downstream claim; it does not create a softer substitute.

### 4.1 Semantic layers

| Layer | Owns | May contain | Must not do |
| --- | --- | --- | --- |
| `FACT` | Engine or an explicitly approved source boundary | Supplied chart facts, temporal facts, warnings, and authority metadata. | Calculate in Web code, infer from labels, or promote a fixture. |
| `PERSONAL RELEVANCE` | Content composition | Why a supplied fact or Signal matters to the reader's current question or domain. | Pretend every possible life domain is supported. |
| `SIGNAL` | Interpretation domain | A deterministic, source-backed meaning candidate with direction, priority, timing, and traceability. | Create astronomy, new timing, arbitrary scores, or LLM-created facts. |
| `INTERPRETATION` | Bounded content layer | Human wording and practical framing of an approved Signal set. | Change Signal direction, confidence, ranking, authority, or existence. |
| `EDUCATION` | Learn/content boundary | Traditional convention, NatalNode policy, calculation explanation, and editorial teaching. | Present contested convention as universal scientific fact. |
| `PRESENTATION` | Feature and route | Ordering, disclosure, density, style, locale, and medium-specific projection. | Become a second semantic or authority source. |

The ordinary first read should answer:

1. **What does this mean for me?**
2. **Why is NatalNode saying this?**
3. **Can I understand the astrology behind it?**

This order is a reader contract, not a requirement to expose every internal
field on every page.

### 4.2 Content identity

Meaning is authored and selected once, then projected through style and locale:

```text
Semantic meaning → editorial style → locale → medium
```

The system must not become a separate content tree for every combination of
meaning, presentation direction, locale, and medium. The existing
`WeeklyReadingModel` remains the reference for one semantic owner with screen,
share, and print projections.

## 5. Canonical life-domain taxonomy

The bounded user-facing taxonomy is:

| Domain | Permitted concern | Omission rule |
| --- | --- | --- |
| `LOVE & RELATIONSHIPS` | Connection, attraction, closeness, boundaries, friction, openness, and relationship movement. | Show only when a distinct source-backed relationship meaning exists. |
| `MONEY & RESOURCES` | Resources, spending attention, commitments, financial priorities, work-related opportunity themes, and constraints. | Show only when the source supports a bounded resources meaning. |
| `WORK & CREATION` | Work, making, responsibility, output, process, and constructive focus. | Omit when it adds no distinct context or action. |
| `INNER STATE / MOOD` | Emotional attention, inner pressure, mood, and reflective context. | Do not turn it into a diagnosis or repeat a generic mood summary. |
| `DECISIONS & ACTION` | Choice, pacing, boundaries, practical action, and when to pause or proceed. | Include only when it adds usable guidance. |
| `COMMUNICATION` | Conversation, expression, listening, clarity, and response space. | Include only when communication is a meaningful source-backed theme. |

Additional domains require a separate product and semantic justification. The
ordinary taxonomy must not grow because a page template has an empty slot.

### 5.1 Love / relationship policy

NatalNode may address ordinary interest in romance and connection, but it must
use bounded framing. Acceptable examples include:

- “Relationship themes are more prominent.”
- “Connection and friction may coexist.”
- “This period emphasizes closeness, boundaries, or communication.”

Unsupported deterministic claims such as “you will meet your soulmate,” a
romantic percentage, or “桃花爆棚” are not permitted. The domain describes
source-backed emphasis, not fate or a guaranteed outcome.

### 5.2 Money / resources policy

NatalNode may discuss resources, priorities, commitments, and constraints. It
must not imply guaranteed profit, investment success, lottery luck, a specific
return, or a numerical financial forecast. No “money score,” star rating, or
windfall promise is created to fill the domain.

### 5.3 Eligibility and prominence

Domain presence is categorical, not a user-facing numerical score:

```text
PROMINENT
PRESENT
BACKGROUND
NOT SUPPORTED / OMITTED
```

The interpretation layer may use internal priority for deterministic ordering,
but internal ranking is not a claim that a domain has an objective percentage
of importance. Omission is a valid editorial result and is preferable to a
padded or fabricated domain block.

## 6. Astrology anchors and professional inspectability

### 6.1 Astrology anchor requirement

Every major personal reading should eventually expose at least one real
astrology anchor whenever the authoritative path supports it. An anchor may be
a supplied:

- planet or body;
- sign placement;
- aspect;
- house or angle;
- transit or other valid temporal relationship; or
- supported timing relationship.

The anchor connects:

```text
Astrology → meaning → life
```

If the current authority does not supply a valid anchor, the content must say
less or remain unavailable. It must not create one from taxonomy, generic
horoscope copy, a fixture, or a visual motif.

### 6.2 Show-your-work ladder

| Level | Reader can inspect | Requirement |
| ---: | --- | --- |
| 1 | Named celestial source | The source is supplied and traceable. |
| 2 | Plain-language relationship | The content explains the source without requiring technical vocabulary. |
| 3 | Technical relationship | Aspect, house, angle, or timing relationship is explicitly supplied. |
| 4 | Technical context | Orb, phase, applying/separating state, duration, or precise context is supplied. |
| 5 | Calculation authority | Configuration identity, provenance, and reproducibility metadata are supplied. |

Only the levels supported by authoritative data may be shown. More technical
language is not automatically more credible, and a development or incomplete
result cannot be upgraded by exposing more labels.

### 6.3 Traceability contract

Every major interpretation should conceptually answer:

```text
What fact(s) support this?
Which Signal owns it?
Why was it prioritized?
What authority limit applies?
What is fact versus interpretation?
```

Internal IDs, rule IDs, fixture markers, and provenance IDs remain internal by
default. They may support inspection tooling or an owner-approved technical
surface, but they are not ordinary reader-facing copy.

## 7. Learn from your chart

The core learning model is contextual rather than a disconnected encyclopedia:

```text
Reader sees a supplied term or chart feature
    ↓
What is this?
    ↓
How does it work in astrology?
    ↓
Why is it relevant here?
    ↓
Optional deeper lesson
```

Examples include selecting Mercury to learn what Mercury represents, selecting
a supplied trine to learn the aspect concept, selecting a supported house to
learn its role, or asking why birth time matters for a supplied Ascendant.

### 7.1 Learning content layers

| Layer | Question | Boundary |
| --- | --- | --- |
| `TERM` | What is this? | Uses the canonical glossary or approved term identity. |
| `CONCEPT` | How does it work in astrology? | Explains convention and NatalNode terminology without claiming scientific validation. |
| `PERSONAL CONTEXT` | Why is it relevant in this chart or reading? | Requires an actual supplied chart/reading anchor; never infers one. |
| `DEEPER LESSON` | Where can I study this further? | Links to approved Learn content and stable lesson identity. |

The same Learn system should serve beginner education, ordinary curiosity, and
experienced reference. The existing Foundations and glossary architecture may
own editorial teaching; a personal hook must consume an existing chart boundary
and must not calculate or persist a fact from lesson content.

Learning content must distinguish:

- traditional astrology convention;
- NatalNode interpretation policy;
- calculation fact;
- editorial explanation; and
- unresolved or unavailable authority.

## 8. Recurring value and time

The target return loop is:

```text
TODAY
  ↓
THIS WEEK
  ↓
THIS MONTH
  ↓
WHAT CHANGED?
  ↓
WHAT'S COMING NEXT?
```

The loop is a product direction, not permission to fabricate recurring content.

### 8.1 Period rules

Daily, Weekly, and Monthly period identity must carry a canonical IANA timezone
and source-supplied boundaries. A period is not authoritative when its required
timezone or time authority is unresolved.

| Period | Product job | Minimum temporal rule |
| --- | --- | --- |
| Today | Immediate orientation. | One local calendar day and supported current evidence. |
| This Week | The current chapter. | Monday–Sunday identity in the canonical timezone and source-backed windows where present. |
| This Month | The larger developing pattern. | One local calendar month and period-specific evidence; not four Weekly summaries. |

### 8.2 What changed?

`What changed?` is a potential high-value return reason, but it requires:

- deterministic comparison;
- explicit period identity;
- semantic continuity between snapshots;
- source-backed change evidence; and
- no AI-authored historical narrative or false change claim.

Until those conditions are available, the product must not claim that a theme
started, faded, or changed merely because new editorial prose was generated.

### 8.3 Thin and constrained periods

When evidence is thin, the reading becomes shorter. It does not become more
decorated. When timing is absent, omit a Timeline and Best Window rather than
inventing precision. When birth time is unknown, keep supported placement-level
meaning and omit time-dependent houses, angles, and timing claims.

## 9. Page-job architecture

The target information architecture is one tree:

```text
HOME
├── TODAY
├── THIS WEEK
├── THIS MONTH
├── MY CHART
├── RELATIONSHIPS
├── COLLECTION
└── LEARN
```

The following matrix defines the job of each surface. It does not create routes
or change the current navigation.

| Surface | Primary user question | Primary value | Secondary value | Depth path | Astrology evidence expectation | Learning opportunity | Return motive |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `HOME` | What matters for me now? | A personal sky briefing that points to the most useful current reading. | Today, the active week/month, My Chart, and one contextual learning hook. | Notice → Use → open the relevant period. | Current personal authority and period identity when authenticated; public Home must not pretend to have personal authority. | Explain one selected anchor or method boundary. | A clear reason to return to the next relevant period. |
| `TODAY` | What matters today? | A light, momentary orientation with one or two meaningful themes. | One practical note, supported timing, and a path to This Week. | Notice → Use → Why Today? → optional evidence. | Current temporal evidence and canonical local day where available. | Explain one “why today” anchor. | Daily check-in or continuation to the week. |
| `THIS WEEK` | What is this week's chapter? | A dominant theme and usable, source-backed weekly reading. | Relevant domains, timing, explanation, learning, save/share/print. | Notice → Use → Explore → Understand → Go deeper. | Selected Signals, period identity, explicit windows, and anchors where authority supports them. | Learn from an anchor already present in the reading. | A meaningful recurring reading, not generic daily filler. |
| `THIS MONTH` | What larger pattern is developing? | Broader context, persistent themes, major shifts, and what builds or fades. | Links into the active week and reflection/collection. | Notice → Explore → Understand → optional technical depth. | Month-specific temporal authority and source-backed major periods. | Explain a longer-cycle concept when supplied. | Monthly chapter and supported continuity. |
| `MY CHART` | What is stable about my natal astrology? | A stable personal reference for supplied natal facts. | Baseline interpretation, learning, technical chart detail, and chart management. | Notice → Explore → Understand → Go deeper. | Authoritative natal bodies, signs, houses, angles, aspects, and time policy as supplied. | Term and feature hooks from the user's actual chart. | Revisit stable personal reference while reading current periods. |
| `RELATIONSHIPS` | How do relationship patterns work for me or between us? | Future relationship meaning grounded in supported relationship facts. | Compatibility or synastry exploration only when authority and privacy are complete. | Notice → Explore → Understand → technical relationship detail. | Relationship Signals from one or more authoritative charts; no inferred score. | Explain a relationship anchor or concept. | Revisit a relationship pattern or comparison when meaningfully updated. |
| `COLLECTION` | What has accumulated over time? | A memory of saved readings, editions, and share/print artifacts. | Reflection and period comparison when deterministic comparison exists. | Notice → Explore → compare → Understand. | Each artifact retains its own source authority and period identity. | Learn from previously saved anchors without rewriting history. | Review what was saved and what is actually changing. |
| `LEARN` | Can you teach me astrology using what I am already seeing? | Durable concepts, Foundations, glossary, and contextual explanation. | Public discovery, chart examples, and links back to relevant personal surfaces. | Term → Concept → Personal Context → Deeper Lesson. | Editorial content is valid for teaching; personal context requires a supplied chart boundary. | Learning is the primary job. | Continue a lesson, answer a chart question, or return to an active reading. |

### 9.1 Surface readiness

These readiness states separate architecture coherence from implementation and
production authority:

| Surface | Current readiness classification | Meaning |
| --- | --- | --- |
| `HOME` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` | The job is defined, but the current root remains Calculate-oriented and lacks the returning-reader briefing model. |
| `TODAY` | `SEMANTIC_ARCHITECTURE_READY` / `TEMPORAL_AUTHORITY_BLOCKED` | The job is clear; an authoritative personal current-day surface is not admitted. |
| `THIS WEEK` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` / `TEMPORAL_AUTHORITY_BLOCKED` | The ReadingModel and five-scenario POC provide structure, but current evidence is development-only and not production Weekly authority. |
| `THIS MONTH` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` / `TEMPORAL_AUTHORITY_BLOCKED` | The job is defined, but month-specific semantics and temporal authority are not closed. |
| `MY CHART` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` | Stable chart reference is defined; a complete target surface still depends on supplied authoritative facts and product composition. |
| `RELATIONSHIPS` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` / `REQUIRES_ENGINE_CAPABILITY` | The product job is clear, but comparison facts, privacy, and relationship content are not complete. |
| `COLLECTION` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` | The semantic distinction from technical Vault storage is defined; an edition/reading collection contract is not implemented. |
| `LEARN` | `SEMANTIC_ARCHITECTURE_READY` / `CONTENT_MODEL_PARTIAL` | Foundations, glossary, and editorial learning exist; a universal personal-context hook remains partial. |

No row above is a route authorization. `VISUAL_ONLY_READY` applies only to the
bounded Weekly R2 prototype described below, not to production content.

## 10. Public content and personal content

Public generalized horoscope, zodiac education, Discover, and share-safe cards
serve acquisition, education, and discovery. Personal interpretation is
chart-grounded content tied to the user's own authoritative inputs.

```text
Public content
  = generalized, clearly scoped, acquisition / education / discovery

Personal content
  = user's authority → Signals → bounded interpretation
```

These paths must never silently masquerade as one another. If personalization
is unavailable, the product says so. Public copy cannot become personal Signal
input, and personal chart facts cannot leak into a public horoscope path.

## 11. Progressive depth and category recognition

### 11.1 Progressive-depth mapping

| Depth | Reader question | Content value | Typical example |
| --- | --- | --- | --- |
| `NOTICE` | What is the point? | One dominant meaning and period label. | “What matters this week?” |
| `USE` | What should I carry? | One or more relevant domains and a practical direction. | “Name the point, then leave room for the response.” |
| `EXPLORE` | Where and when does this show up? | Conditional domains, timing windows, and distinctions such as background versus momentary. | A relationship section or labeled timing window. |
| `UNDERSTAND` | Why is this being said? | Source-backed explanation, composition rationale, and authority boundary. | “Why this week?” |
| `GO DEEPER` | What would an astrologer inspect? | Approved technical facts, learning links, method, and provenance where available. | Aspect, house, orb, phase, or calculation details. |

The levels expose more context, not a confidence slider. Unknown time,
incomplete authority, unsupported houses, missing timing, and unavailable
provenance remain truthful at every depth.

### 11.2 Astrology category recognition

Within the first viewport, a primary astrology surface should normally provide:

1. explicit astrology-domain language;
2. a legitimate celestial or astrological visual cue; and
3. a domain-specific astrology content anchor when authority supports it.

Random glyphs, fake wheels, pseudo-data, and purple mystical wallpaper are not
substitutes for astrology substance. A decorative visual may use brand
celestial motifs, but a data-like chart or sky must be supplied and traceable.

## 12. Content voice and credibility

Target content is:

```text
specific + plain + bounded + human + evidence-connected
```

It should be non-deterministic where the evidence does not justify certainty
and low in mystical filler. Words such as “energy,” “invitation,” “alignment,”
“signal,” “universe,” “destiny,” and “fate” are not automatically banned, but
each must carry a specific meaning and must not replace evidence.

Professional credibility is:

```text
accurate input handling
+ clear method
+ traceable facts
+ consistent semantics
+ limit disclosure
+ reproducibility
```

It is not produced by jargon density, mystery, complex graphics, or a larger
volume of prose.

## 13. AI boundary

The AI boundary remains:

```text
Engine facts → Signals → approved content boundary → AI wording support
```

AI may eventually assist with bounded wording, explanation, or educational
adaptation after deterministic content authority exists. AI must not create or
rank planets, signs, houses, aspects, transits, timing, Signal existence,
confidence, or domain prominence. AI must not replace missing provenance,
historical-time authority, or a failed Engine path.

## 14. Content volume, omission, and deduplication

More content is not more value. Two strong themes are preferable to six weak
generic domains. A reading may be short and still complete for its available
authority.

One semantic meaning has one visible owner. The existing Weekly ownership map
is the reference:

| Visible owner | Owns |
| --- | --- |
| Hero | One dominant meaning. |
| Overview / At-a-Glance | Up to three concise supporting themes. |
| Domain | New life context or practical meaning only when distinct. |
| Timeline | Explicit timing and background/momentary distinction. |
| Watch Out | At most one usable caution when supported. |
| Why | Explanation of selection, combination, omission, or limits. |
| Astrologer's View | Optional new technical context, not a restated summary. |
| Signature | Closing identity, not a second Hero. |
| Share | Compact public-safe projection, not a miniature full report. |

Every block must add a new meaning, context, timing distinction, practical
action, explanation, or emotional relevance. Otherwise it is merged or omitted.

## 15. Current capability-gap matrix

The status labels below are normalized for this document. `AVAILABLE_AUTHORITATIVE`
means that an Engine/Web contract can supply the fact; it does not mean that the
production astronomy provider, scientific configuration, or launch gate is
closed. `AVAILABLE_DEVELOPMENT_ONLY` means the repository has a fixture or
development representation that cannot be promoted.

| Capability | Status | Repository evidence and limitation |
| --- | --- | --- |
| Natal facts | `AVAILABLE_AUTHORITATIVE` | Chart body/sign facts are supplied through the Engine/Web chart contract; production provider readiness remains an external gate. |
| Houses | `AVAILABLE_AUTHORITATIVE` | Supplied house systems, cusps, and placements are part of the Engine contract; Web consumes them and does not calculate them. Unknown birth time blocks unsupported house claims. |
| Angles (ASC / MC) | `AVAILABLE_AUTHORITATIVE` | ASC and MC are supplied angle facts when valid time authority exists; Web must not infer them. |
| Aspects | `AVAILABLE_AUTHORITATIVE` | Supplied aspect shape includes body pair, type, separation/orb fields where available, and phase state. |
| Orb / distance | `PARTIAL` | Engine supplies separation and orb; the current Web chart contract exposes orb but not the complete distance/separation pair as one common surface. |
| Aspect phase (applying / exact / separating) | `AVAILABLE_AUTHORITATIVE` | Aspect phase is a supplied semantic field; it must not be inferred from prose or geometry. |
| Motion (direct / station / retrograde) | `PARTIAL` | Engine body motion includes the three-state concept; current Web natal facts expose a retrograde boolean and Sky motion vocabulary remains development-only. |
| Current Sky | `AVAILABLE_DEVELOPMENT_ONLY` | `SkySnapshotResult` and current Sky fixtures provide a bounded snapshot surface; production dynamic Sky authority is not closed by the inspected architecture. |
| Transit-to-natal | `BLOCKED` | No authoritative Engine contract currently joins a current-sky position to a natal chart. |
| Transit-to-house | `BLOCKED` | No authoritative Engine contract supplies the required transit, natal, house, and time-authority join. |
| Transit-to-angle | `BLOCKED` | No authoritative Engine contract supplies this relationship. |
| Moon phase / lunation | `PARTIAL` | Moon position and development lunation vocabulary exist; a personal authoritative phase projection is not closed. |
| Temporal windows | `PARTIAL` | The Interpretation and WeeklyReadingModel contracts preserve explicit source windows and the POC exercises them, but production time/provider/provenance authority remains incomplete. |
| Period-over-period comparison | `BLOCKED` | `What changed?` requires deterministic snapshots, period identity, and semantic continuity; no admitted comparison implementation exists. |
| Domain prominence | `PARTIAL` | Signals have bounded domains and deterministic internal ranking, while the user-facing categorical prominence/omission policy is a target content model rather than a complete product surface. |
| Learn-from-your-chart anchors | `PARTIAL` | Learn, Foundations, glossary, and chart teaching surfaces exist; a universal reading-to-personal-context contract remains incomplete and must consume supplied facts only. |

This matrix does not infer additional Engine capability from PRD vocabulary. A
future row may remain `UNKNOWN / NEEDS ENGINE REVIEW` when new evidence is not
available; terminology alone is never sufficient evidence.

## 16. Weekly R2 reconciliation

The Weekly R2 prototype is preserved and classified as:

```text
VISUAL COMPOSITION: PROMISING
HUMAN READING: PROMISING
ASTROLOGY CATEGORY RECOGNITION: INSUFFICIENT
ASTROLOGY EVIDENCE: INSUFFICIENT
CONTENT SUBSTANCE: INSUFFICIENT FOR PRODUCT ACCEPTANCE

WEEKLY R2 = DEVELOPMENT RESEARCH ARTIFACT
```

The R2 visual composition demonstrates a more mature reading frame, but its
presentation cannot substitute for real astrology evidence or production
content authority. It must not be marked `OWNER_BROWSER_PASS`, and this
architecture does not modify or rewrite it.

### 16.1 Current POC content coverage

The existing five-scenario POC is a development-only content proof. Coverage
means “enough semantic material to inform a future block,” not that the block
is production-ready or that every scenario should render it.

| Future Weekly block | Coverage | Editorial consequence |
| --- | --- | --- |
| Hero headline | `ENOUGH_FOR_POC` | Use one dominant hook. |
| Weekly overview | `ENOUGH_FOR_POC` | Keep it a short orientation, not a second report. |
| Three core themes | `ENOUGH_FOR_POC` | Up to three grouped themes; fewer is valid. |
| Relationship | `THIN` | Conditional; only when distinct relationship meaning exists. |
| Work / Creation | `ENOUGH_FOR_POC` | Conditional practical context. |
| Emotional / Inner State | `ENOUGH_FOR_POC` | Conditional and distinct from a repeated mood summary. |
| Action / Decision | `ENOUGH_FOR_POC` | Practical guidance, merged when it repeats a theme. |
| Timeline | `ENOUGH_FOR_POC` | Own explicit timing windows. |
| Watch Out | `THIN` | Only when a usable caution is not already present. |
| Best Window | `THIN` | Compact highlight or omit when Timeline owns the same fact. |
| Astrologer's View | `ENOUGH_FOR_POC` | Optional advanced depth, never default filler. |
| Signature line | `ENOUGH_FOR_POC` | Possible closing/share identity element. |
| Share card | `ENOUGH_FOR_POC` | Short hook-plus-insight projection, not a compressed report. |

## 17. Preservation and migration policy

The following existing boundaries are preserved:

| Existing authority / artifact | Decision |
| --- | --- |
| `NatalNode.com → Website API / BFF → NatalNode Engine Public API` | `PRESERVE` |
| Engine facts / `ChartFacts` / `SkySnapshotResult` | `PRESERVE` |
| Interpretation Signals and deterministic rule foundation | `PRESERVE` |
| `WeeklyInterpretationDraft` and `WeeklyReadingModel` | `PRESERVE` |
| Human Reading First and Progressive Depth | `PRESERVE` |
| Adaptive Experience Architecture | `PRESERVE` |
| Celestial / Editorial visual language | `PRESERVE` |
| Auth, Account, Vault, Location, BFF, and existing routes | `PRESERVE` |
| Visual System V1.1 and current Learn/Discover/Chart behavior | `PRESERVE` |
| Weekly R2 | `RESEARCH_ONLY` |
| Provider selection | `PROVIDER DECISION DEFERRED` |

This is an additive documentation boundary. No large refactor is required:

```text
NO_LARGE_REFACTOR_REQUIRED
```

The architecture does not require moving existing features, renaming routes,
creating empty future directories, adding a content service, or introducing a
second semantic authority. Future implementations should proceed only through
separately authorized slices with focused contracts and evidence.

## 18. Frozen Product Owner direction and implementation gates

The following six product and information-architecture decisions are already
approved source truth. They are not unresolved alternatives and must not be
reopened by future content or implementation work.

### 18.1 Approved authenticated period model

The approved target information architecture is:

```text
HOME
TODAY
THIS WEEK
THIS MONTH
MY CHART
RELATIONSHIPS
COLLECTION
LEARN
```

Its period model is:

```text
Month = broad context
Week  = current chapter
Today = current moment
```

The target IA is approved. Immediate navigation migration is still separately
gated; approval of the target does not authorize changing the current header
or route map in this documentation task.

### 18.2 Approved My Chart / Collection / Vault relationship

The semantic relationship is frozen as:

```text
MY CHART
  = stable natal chart / reference / management

COLLECTION
  = accumulated temporal and editorial artifacts

VAULT
  = current technical / historical storage concept
```

Vault V1 remains closed and preserved. No route rename or data migration is
authorized merely by this architecture.

### 18.3 Approved Community position

Community is not a future core primary-navigation pillar. It remains a
secondary and contextual public surface. Existing closed Community work is
preserved.

### 18.4 Approved Relationships position

Relationships is a future value pillar. Its primary-navigation and product
admission remain deferred until a genuinely mature relationship experience is
available, such as an admitted Love Style, Compatibility, or relationship
interpretation surface. Authority, privacy, semantic maturity, and useful
content are prerequisites. Relationships must not be promoted early.

This is an approved policy, not an unresolved binary choice between early
promotion and deferral.

### 18.5 Approved public horoscope position

Public horoscope and generalized zodiac content are approved as:

```text
ACQUISITION
SEO
DISCOVERY
EDUCATION
```

They are not the core authenticated product, a substitute for personal
chart-grounded interpretation, or a core authenticated navigation pillar.
There is no silent fallback from personal interpretation to generic
horoscope content.

### 18.6 Approved public and authenticated Home distinction

The semantic hierarchy is frozen as:

```text
PUBLIC HOME
  = acquisition-first

AUTHENTICATED HOME
  = personal-value-first
```

The two experiences may share a shell or implementation primitives. They are
not required to be two websites, but their user-state-dependent semantic jobs
are different. The current Calculate-oriented root may remain as
implementation history until migration, but it is not the approved target
authenticated Home model and is not an equal product-direction alternative.

### 18.7 What remains open

Only implementation, sequencing, and separately gated product questions remain
open, including:

- when to migrate current navigation toward the approved target IA;
- when Relationships has enough authority and content maturity for admission;
- when Collection receives its product contract and runtime;
- how public and authenticated Home share implementation primitives;
- which content-value surface should be implemented next given current
  authority gaps; and
- which future route migration requires explicit Product Owner approval.

These questions must be answered without reopening the approved product
direction above. The distinction is:

```text
PRODUCT DIRECTION = APPROVED
IMPLEMENTATION TIMING / MIGRATION = STILL GATED
```

No item in this section authorizes a route, UI, navigation migration, or
runtime implementation by itself.

## 19. Bounded next sequence

After this admission, the shortest evidence-led sequence is:

```text
1. Product Owner reviews the content-value and evidence gaps without reopening
   the frozen IA direction.
2. Reconcile the missing astrology anchors, authority fields, and content
   coverage needed for the next Weekly decision.
3. Produce or revise bounded Weekly UX work from the admitted semantic model.
4. Implement a production surface only after its authority and content gates
   are separately admitted.
```

Recommended exact next task:

```text
WEB-P2-CONTENT-EVIDENCE-GAP-001
Reconcile Weekly content evidence gaps against the admitted authority model
```

Do not begin that task automatically from this document.

## 20. Sources and evidence boundary

This architecture was prepared from the repository's current accepted
materials:

- [`docs/PRD.md`](../PRD.md);
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md);
- [`docs/architecture/NATALNODE_WEB_PRODUCT_ARCHITECTURE_V2.md`](../architecture/NATALNODE_WEB_PRODUCT_ARCHITECTURE_V2.md);
- [`docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md`](../architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md);
- [`docs/architecture/NATALNODE_WEEKLY_READING_MODEL_V1.md`](../architecture/NATALNODE_WEEKLY_READING_MODEL_V1.md);
- [`docs/architecture/NATALNODE_LEARNING_ARCHITECTURE_V1.md`](../architecture/NATALNODE_LEARNING_ARCHITECTURE_V1.md);
- [`docs/product/NATALNODE_ADAPTIVE_EXPERIENCE_ARCHITECTURE_V1.md`](NATALNODE_ADAPTIVE_EXPERIENCE_ARCHITECTURE_V1.md);
- [`docs/product/NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md`](NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md);
- [`docs/product/NATALNODE_WEEKLY_SKY_PORTRAIT_UX_V1.md`](NATALNODE_WEEKLY_SKY_PORTRAIT_UX_V1.md);
- [`docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md`](NATALNODE_PUBLIC_SKY_DOMAIN_V1.md);
- [`docs/product/NATALNODE_EDUCATIONAL_CHART_INSTRUMENT_V1.md`](NATALNODE_EDUCATIONAL_CHART_INSTRUMENT_V1.md);
- [`docs/research/weekly-signal-poc/WEEKLY_SIGNAL_POC_REVIEW.md`](../research/weekly-signal-poc/WEEKLY_SIGNAL_POC_REVIEW.md);
- [`docs/research/weekly-signal-poc/scenario-a.md`](../research/weekly-signal-poc/scenario-a.md) through
  [`scenario-e.md`](../research/weekly-signal-poc/scenario-e.md).

The POC scenarios are evidence for composition behavior only. They do not
establish a production provider, transit authority, production Weekly route,
scientific configuration, or production content policy. Existing code and
contracts remain the authority for what is currently implemented; this
document records a target content-value architecture and does not claim that
all target surfaces already exist.

```text
CONTENT_VALUE_ARCHITECTURE_ADMITTED
MODULE_PASS
NO_LARGE_REFACTOR_REQUIRED
WEEKLY_R2_REMAINS_RESEARCH_ONLY
READY_FOR_CONTENT_EVIDENCE_GAP_RECONCILIATION
```
