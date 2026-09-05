# NatalNode Adaptive Experience Architecture V1

**Document status**: `ADAPTIVE_EXPERIENCE_ARCHITECTURE_ADMITTED`

**Scope**: Product, content, and presentation architecture. This document does
not authorize runtime implementation, visual redesign, new routes, or changes
to the Engine/BFF boundary.

**Product source of truth**: [`docs/PRD.md`](../PRD.md)

**Implementation boundary**: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)

**Related foundations**:

- [`NATALNODE_INTERPRETATION_SYSTEM_V1.md`](../architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md)
- [`NATALNODE_WEEKLY_READING_MODEL_V1.md`](../architecture/NATALNODE_WEEKLY_READING_MODEL_V1.md)
- [`NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md`](NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md)
- [`NATALNODE_WEEKLY_SKY_PORTRAIT_UX_V1.md`](NATALNODE_WEEKLY_SKY_PORTRAIT_UX_V1.md)
- [`NATALNODE_VISUAL_SYSTEM_V1.md`](../design/NATALNODE_VISUAL_SYSTEM_V1.md)

---

## 1. Executive summary

NatalNode should feel like one coherent product that can meet a reader at
different levels of attention and technical interest. The product therefore
freezes this formula:

```text
ONE PRODUCT / ONE TRUTH / ONE BRAND / ONE IA / ONE CONTENT IDENTITY
```

The primary user-facing model is **Progressive Depth**. A reader starts with a
clear human reading, can explore supporting themes and timing, can open the
reasoning boundary, and may continue to an astrologer-oriented technical view
when authoritative facts allow it. The reader does not choose between two
products called Observatory and Starlight.

The stable semantic path remains:

```text
NatalNode Engine
    → ChartFacts
    → Signals
    → Interpretation
    → ReadingModel
    → PresentationPolicy
    → Shared UI
```

`PresentationPolicy` is a future lightweight presentation boundary. It may
choose labels, density, disclosure level, visual treatment, and bounded
surface variants. It must never calculate astrology, change semantic ranking,
invent timing, soften an authority limitation, or become a second
Interpretation system.

The architecture admits a public product direction of **PERSONAL ASTROLOGY
INTELLIGENCE**: personal, evidence-conscious astrology presented with modern
human language, useful structure, and optional depth. It keeps the current
Visual System V1.1 as the approved functional baseline and records a future
Visual System V2 direction without implementing it here.

This is an architecture admission, not an implementation campaign. The
development Weekly prototype and its research snapshots remain preserved as a
structural baseline for future evaluation.

## 2. Why the former dual-mode idea is refined

The repository contains useful visual language for an Editorial presentation
and an Observatory presentation. Those names describe different emphases:

| Existing direction | Useful emphasis | Architectural interpretation |
| --- | --- | --- |
| Editorial | Human language, education, clarity, approachable reading | A presentation direction and default public/content tendency |
| Observatory | Chart facts, technical disclosure, inspectability | A presentation direction for optional depth and technical surfaces |
| Starlight | Expressive celestial atmosphere, acquisition, shareable identity | An internal art-direction direction for bounded public/share variants |

The risky interpretation would be to turn these directions into two user-facing
products. That would create duplicated routes, content systems, preferences,
semantic projections, and inconsistent trust signals. The refined decision is:

```text
Progressive Depth = the user-facing experience model
Editorial / Observatory / Starlight = internal presentation directions
```

The directions may influence a bounded surface or design token set, but they
are not user modes, account settings, onboarding questions, URL families, or
independent prose libraries. The existing Editorial/Observatory vocabulary in
the Visual System remains useful as internal design guidance and does not imply
an additional runtime authority.

## 3. Positioning

The product positioning frozen by this architecture is:

> **PERSONAL ASTROLOGY INTELLIGENCE**

In product terms, this means:

- personal: the reading is about the user’s available chart facts and current
  context, not generic horoscope identity;
- astrology: the product preserves astrology-specific facts, terminology, and
  uncertainty rather than replacing them with generic wellness copy;
- intelligence: the product organizes facts into understandable Signals and
  readings without presenting interpretation as scientific certainty.

The default expression is modern, human, editorial, astrological, and
intelligent. A more technical view is an available depth of the same product,
not a colder alternative product.

## 4. Commercial hypothesis

The following is a hypothesis to test, not a validated business result:

| Product capability | Hypothesized effect | Evidence still required |
| --- | --- | --- |
| Accessible first reading | Acquisition and activation | Completion, return, and qualitative comprehension evidence |
| Expressive public/share presentation | Sharing and discovery | Share starts, qualified visits, and content comprehension |
| Optional technical depth | Trust and future paid value | Depth expansion, trust feedback, and willingness-to-pay evidence |
| Useful recurring periods | Retention | Return frequency, reading completion, and qualitative usefulness |

No architecture decision in this document claims conversion, retention,
engagement, or revenue uplift. Productization requires a bounded experiment,
baseline measurement, cost estimate, and owner review.

## 5. Stable architecture

The existing authority chain remains the single product path:

```text
Engine facts
  → ChartFacts
    → Signals
      → Interpretation
        → ReadingModel
          → PresentationPolicy
            → Shared UI
```

Responsibilities are deliberately separate:

| Layer | Owns | Does not own |
| --- | --- | --- |
| Engine / ChartFacts | Authoritative calculated facts and provenance | Human prose or presentation style |
| Signals | Structured, source-backed meaning candidates, priority, timing, and authority | UI layout or user-facing mode selection |
| Interpretation | Semantic composition and bounded editorial meaning | Rendering, theme, or route identity |
| ReadingModel | Stable semantic ownership, ordering, disclosure, and projections | Astrology calculation or visual art direction |
| PresentationPolicy | How one ReadingModel is labeled, disclosed, spaced, and styled | New meaning, ranking, facts, timing, or authority |
| Shared UI | Accessible screen, share, and print presentation | A second semantic or data authority |

The website boundary remains:

```text
NatalNode.com → Website API / BFF → NatalNode Engine Public API
```

No presentation direction may bypass the BFF, read a provider, calculate
astronomy, or promote a fixture. `PROVIDER DECISION DEFERRED` remains in force.

## 6. Progressive Depth

Progressive Depth is the primary reader-facing model. It lets attention,
curiosity, and expertise determine how far a person goes without changing the
underlying reading.

| Depth | Reader question | Typical content | Default behavior |
| --- | --- | --- | --- |
| 0 — Notice | “What is the point?” | Hero headline, one useful takeaway, period label | Immediate and human-readable |
| 1 — Use | “What should I carry?” | At-a-glance themes, domain relevance, one action | Visible in the normal reading flow |
| 2 — Explore | “Where and when does this show up?” | Relationship/work/inner-state sections, Timeline, Watch Out | Expandable or progressively revealed |
| 3 — Understand | “Why is this being said?” | Source-backed explanation, authority disclosure, method boundary | Explicitly opened disclosure |
| 4 — Go deeper | “What would an astrologer inspect?” | Approved technical facts and technical interpretation | Optional, only when authority permits |

The depth model is not a confidence slider and does not change calculation
precision. Unknown birth time, incomplete scientific authority, missing timing,
and unsupported houses/angles remain visible at every depth.

## 7. PresentationPolicy

`PresentationPolicy` is the proposed small boundary between semantic reading
and shared presentation. It is a policy about expression, not a new domain
layer. It may be implemented later only when a real product surface needs it.

Conceptually, a policy may select:

- surface label and reading introduction;
- default progressive depth and disclosure state;
- content density and section pacing;
- whether technical explanation is inline, collapsed, or separate;
- celestial visual treatment, such as a chart-fact diagram or a clearly
  decorative brand motif;
- technical emphasis for an authenticated chart surface;
- bounded expressive variants for public, share, or print surfaces;
- share and print framing while retaining the same semantic identity.

It must not:

- calculate planets, signs, houses, aspects, transits, or timing;
- change Signal eligibility, meaning, ranking, ownership, or ordering;
- create or delete a Hero, Timeline, Best Window, or Watch Out;
- turn unknown or incomplete authority into a confident statement;
- invent a date, window, placement, chart geometry, or provenance claim;
- create another interpretation layer or another content identity;
- select an alternate provider or bypass the BFF;
- decide authentication, authorization, storage, or entitlement.

The future contract should be small and explicit, for example:

```text
ReadingModel
  + surface (home | today | weekly | monthly | chart | share | print)
  + locale
  + requestedDepth
  + presentationDirection (internal only)
      → PresentationPolicy
          + labels
          + density
          + disclosures
          + celestialTreatment
          + boundedVariant
```

This is a conceptual contract, not a request to add a TypeScript type in this
task. Any implementation must keep the ReadingModel and its authority chain
unchanged.

## 8. Observatory and Starlight directions

The names remain internal art direction references:

| Direction | Use it to guide | Do not use it to create |
| --- | --- | --- |
| Editorial | Human-first hierarchy, explanation, education, calm reading flow | A separate editorial content database |
| Observatory | Technical disclosure, chart inspection, fact visibility, precision | A user-facing “Observatory mode” switch |
| Starlight | Public atmosphere, acquisition, share/print expression, restrained celestial identity | A second semantic reading or prediction system |

A single Weekly reading may have an Editorial default, an optional
Observatory-inspired “why/technical” disclosure, and a Starlight-inspired share
cover. Those are views of one semantic artifact. They are not independent
outputs.

## 9. Editorial styles

The existing four editorial styles remain the content identity:

| Style | Role | Boundary |
| --- | --- | --- |
| `CLEAR` | Direct, useful, restrained default | Must remain understandable without technical vocabulary |
| `CASUAL` | Warmer, more conversational | Must not become predictive, spammy, or falsely certain |
| `ASTROLOGER` | Technical and method-aware | May expose approved facts and limits; may not add unsupported chart machinery |
| `SHARE` | Compact public/share projection | Must carry the same semantic week, authority, and privacy boundary |

These styles are editorial projections from the same Signals and ReadingModel.
There will be no Observatory prose library and no Starlight prose library.

## 10. Content boundary

The content system is ordered:

```text
Semantic Meaning → Editorial Style → Locale
```

Meaning is authored and selected once. Style changes voice, density, and
disclosure. Locale changes language and locale-specific presentation. The
system must not become a full cross-product of:

```text
meaning × Observatory × Starlight × locale
```

The Weekly POC demonstrates the intended bounded behavior: a Signal set is
composed first, then `CLEAR`, `CASUAL`, `ASTROLOGER`, and `SHARE` projections
are selected. The existing POC’s actual phrase libraries remain research
evidence, not a production content policy.

## 11. Formal Celestial Semiotics

Celestial language must distinguish authoritative fact from brand atmosphere.

| Type | Examples | Rule |
| --- | --- | --- |
| A — Factual celestial | Sun, Moon, planets, signs, zodiac glyphs, aspects, houses, angles, Moon phase, real chart geometry | Must be supplied by an authoritative fact path and remain traceable |
| B — Brand celestial motif | Abstract orbit/node geometry, generic star field, grid, restrained constellation-like pattern | Allowed as decoration when clearly not presented as the user’s chart or current sky |
| C — Forbidden pseudo-data | Random planet placement, fake wheel, random zodiac, fake Moon phase, fake aspect, fake transit, fake chart presented as user data | Never ship as if it were factual astrology |

The same surface may use Type A and Type B together, but it must keep their
roles visually and semantically distinct. A factual chart instrument requires
real data; a brand instrument must remain open, abstract, and visibly
decorative.

## 12. Data-Likeness Rule

If a normal reader could reasonably interpret a visual as “this represents my
real chart” or “this is the current sky,” the visual must be data-driven and
traceable. If it is not data-driven, it must be clearly decorative through
composition, labeling, accessibility treatment, and absence of pseudo-values.

This rule applies to backgrounds, hero instruments, share cards, print covers,
motion, and technical-looking ornament. Labels such as “illustration,”
“decorative,” or “not a chart” may support the boundary but do not excuse a
visual that otherwise masquerades as data.

## 13. Public and personal surfaces

The same truth can have different presentation emphasis:

| Surface tendency | Default expression | Permitted depth |
| --- | --- | --- |
| Public / acquisition | More expressive, editorial, Starlight-influenced, low-friction | Notice and Use first; compact Share projection |
| Authenticated personal | Human-first, calm, more context and optional Observatory-inspired inspection | Notice through astrologer depth where authority permits |
| Technical chart surface | Fact-forward, inspectable, still readable | Deeper levels without becoming a separate product |

Authenticated pages must not all become cold or technical. Personal trust is
served by clarity, provenance, and useful disclosure, not by maximizing data
density.

## 14. Single information architecture

The target product IA is one tree:

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

Utilities such as Account, Auth, Privacy, Terms, Settings, Tools, and support
remain secondary utility surfaces. This architecture does not authorize
creating or renaming routes. Existing PRD and Product Owner route decisions
remain the implementation gate.

## 15. Single URL and content identity

One semantic item has one canonical content identity. A Weekly item is one
Weekly item, regardless of whether it is viewed on screen, opened to deeper
technical disclosure, shared, or printed.

There must not be alternate route families such as:

```text
/observatory/week
/starlight/week
```

Nor should there be duplicate IDs, caches, saved records, or analytics events
that make the presentation direction appear to be a separate content object.

## 16. Component architecture

Reuse is the default. Components are classified by what must remain stable:

| Component class | Policy | Examples |
| --- | --- | --- |
| Core UI primitives | Shared | Buttons, disclosure, typography, spacing, status, focus behavior |
| Structural content | Highly shared | `ReadingSection`, `ContentBlock`, `TimelineContainer`, domain container, metadata |
| Presentation-sensitive | Bounded variant only when justified | `WeeklyHero`, `TimelineVisualization`, `ShareCard`, `PrintCover` |
| Surface composition | Shared semantic inputs, surface-specific arrangement | Home, Weekly, Chart, Share, Print |

Presentation-sensitive variants must consume the same semantic blocks and
traceability. They are not permission to fork content logic. Use design tokens,
policy values, and a small number of explicit variants instead of conditional
sprawl.

## 17. Semantic parity

The parity invariant is:

> The same `ReadingModel` must produce the same semantic owners, eligibility,
> ordering, timing, Signal references, authority status, and unknown-time
> behavior in every presentation direction.

Presentation can change:

- wording style within the approved editorial contract;
- density and disclosure;
- labels and headings;
- visual hierarchy and art direction;
- share/print framing.

Presentation cannot change what is true, important, available, timed, or
supported. If two surfaces require different semantics, they require a new
domain decision rather than another presentation preset.

## 18. Unknown-time and low-authority parity

Unknown or incomplete authority is a product fact, not a visual inconvenience.
Every direction must preserve the same constraints:

- no unsupported houses, angles, ASC, MC, or equivalent time-dependent facts;
- no fabricated timeline or Best Window when timing evidence is absent;
- no confident scientific result when the authority is incomplete;
- no visual chart precision that the semantic model does not have;
- no softer wording that hides the limitation from the reader;
- no technical disclosure that implies more authority than the source provides.

Scenario E in the Weekly POC is the reference case: placement-level content
remains useful, while timing and unsupported chart machinery remain omitted.

## 19. Enforcement

The future enforcement set should be small and targeted, not a large generic
lint framework:

| Contract | What it protects | Earliest useful form |
| --- | --- | --- |
| A — Semantic parity | Same ReadingModel semantics across variants | Focused model/projection test |
| B — Celestial integrity | Type A traceability and Type C exclusion | Review checklist plus targeted test for data-like components |
| C — Unknown-time parity | No authority inflation through presentation | Focused scenario test |
| D — Consumer boundary | No internal IDs, rule IDs, fixture markers, or provenance IDs in normal reader copy | Existing model invariant / focused lint |
| E — Variant justification | No unnecessary component forks | Review gate and bounded variant record |

These contracts should be introduced only when a concrete implementation
surface needs them. This document does not authorize a repository-wide lint
package, pre-commit hook, or visual scanner.

## 20. Visual System V2 direction

`NATALNODE_VISUAL_SYSTEM_V1.md` and its approved V1.1 functional baseline
remain current. This document records the direction for a future V2 without
replacing V1.1:

```text
Brand Core
  + Celestial Semiotics
  + Editorial Expression
  + Technical Expression
  + Appearance
```

- Brand Core owns NatalNode identity, typography, color relationships, spacing,
  surfaces, accessibility, and motion restraint.
- Celestial Semiotics owns the Type A/B/C boundary and the data-likeness rule.
- Editorial Expression owns human-first reading hierarchy and voice.
- Technical Expression owns inspectable facts and optional depth.
- Appearance remains independent of experience depth; do not create an
  Appearance × Experience matrix in V1.

V2 should be validated first through bounded Weekly presentation work. It does
not authorize a global theme rewrite, a new motion system, or a second brand.

## 21. Experience reach

The architecture does not apply equally to every surface:

| Reach | Surfaces | Implication |
| --- | --- | --- |
| High | Today, Weekly, Monthly, Home, Share, Collection | Primary Progressive Depth and visual-language validation |
| Medium | Relationships, My Chart interpretation | Reuse reading semantics; allow more technical depth where authoritative |
| Low | Learn, Tools | Preserve their focused editorial or utility purpose; do not force reading-mode controls |
| Brand / utility | Account, Auth, Privacy, Legal, Settings | Follow Brand Core and trust/accessibility rules; no adaptive content framework required |

“Reach” is prioritization for future validation, not an instruction to modify
all surfaces now.

## 22. Share, Print, and Collection

Share is a presentation projection of the same semantic artifact. It may use a
more expressive Starlight-influenced art direction and a compact hook, but it
must preserve:

- semantic meaning and ordering of the selected content;
- authority and uncertainty disclosures;
- privacy and redaction rules;
- canonical content identity and traceability;
- no fabricated astrology or pseudo-data.

The existing Weekly POC `SHARE` style is structural evidence only. It does not
authorize Account Share changes or production share UI.

### Print

Print may use a calmer, art-directed cover and different pagination, but it is
still the same Weekly semantic identity, ReadingModel, authority chain, and
privacy boundary. A print cover is not a second horoscope and must not introduce
visual Type C pseudo-data.

### Collection

Collection stores one semantic artifact, such as “Weekly #37,” rather than a
separate Editorial Weekly, Observatory Weekly, and Starlight Weekly. A reader
may reopen it with a different presentation surface while the saved identity,
meaning, and authority remain the same.

## 23. No user-facing toggle

V1 explicitly does not include:

- an Observatory/Starlight toggle;
- an account preference called `experiencePreference`;
- an onboarding question asking which product mode the reader prefers;
- alternate Observatory or Starlight routes;
- a global mode switch that changes all pages;
- separate mode-specific content systems.

Progressive disclosure is the interaction. A reader opens more depth when it is
useful; the product does not ask the reader to understand internal art
direction names first.

## 24. Internal experiments

Future internal A/B or multivariate experiments may compare bounded presentation
directions without exposing internal names to users. Any such experiment must
be hidden behind an explicit assignment boundary, preserve semantic parity,
and distinguish presentation evidence from product truth.

This task does not add assignment, analytics, experimentation infrastructure,
or runtime flags. An experiment cannot be used to smuggle a second content
system into production.

## 25. Kill framework

Before productizing a broader presentation direction:

1. establish a baseline for the existing surface;
2. define the smallest bounded prototype and the user decision it tests;
3. measure comprehension, completion, return, sharing, trust, or other relevant
   outcomes with a declared cost model;
4. review qualitative evidence for authority and accessibility regressions;
5. compare gains against implementation and content maintenance cost;
6. stop if there is no meaningful improvement or if complexity materially
   increases without a compensating product result.

Do not invent universal thresholds before the baseline exists. A result that
looks visually stronger but weakens semantic trust, accessibility, or
maintainability is not a successful experiment.

## 26. Content cost controls

The default production unit is:

```text
one semantic meaning + one editorial style + one locale
```

Presentation variants should reuse those blocks. A new variant needs a bounded
approval stating its user problem, semantic parity, authority behavior, owner,
locale implications, and removal/retirement condition. Content cost includes
translation, review, QA, maintenance, and future policy changes; it is not just
the number of files.

## 27. Impact matrix

This matrix records the architecture impact without authorizing implementation:

| System / artifact | Classification | Decision |
| --- | --- | --- |
| Engine | `NO_CHANGE` | Keep Engine-first boundary, facts, provenance, and provider neutrality |
| Signal system | `PRESERVE` | Preserve eligibility, priority, direction, timing, and traceability |
| Interpretation | `PRESERVE` | Preserve one semantic composition layer and existing editorial contracts |
| `WeeklyInterpretationDraft` | `PRESERVE` | Keep as input to the admitted Weekly model; no presentation fork |
| `WeeklyReadingModel` | `PRESERVE` | Remains the semantic contract for screen, share, and print projections |
| Human Reading Architecture | `PRESERVE` | Keep Human Reading First and the attention ladder |
| Visual System V1.1 | `PRESERVE` | Remains the approved functional visual baseline |
| Weekly Prototype | `RESEARCH_ONLY` | Preserve as the structural research baseline, not a final visual product |
| Auth | `PRESERVE` | No presentation mode preference or auth flow change |
| Account | `PRESERVE` | No account surface or privacy change |
| Vault | `PRESERVE` | Saved semantic artifacts retain one identity |
| Location | `PRESERVE` | Location authority remains owned by the existing resolution path |
| BFF | `NO_CHANGE` | No contract, route, or server boundary change |
| Navigation | `FUTURE_EXTENSION` | One IA target is frozen; route work remains separately gated |
| Share | `FUTURE_EXTENSION` | Same semantics with bounded expressive projection |
| Print | `FUTURE_EXTENSION` | Same semantic artifact with art-directed pagination |
| Collection | `FUTURE_EXTENSION` | Store one content identity, not mode-specific copies |
| Daily | `FUTURE_EXTENSION` | Apply Progressive Depth only after its semantic model is admitted |
| Monthly | `FUTURE_EXTENSION` | Apply the same model only after period-specific semantics are admitted |

The matrix is a governance record. It does not create routes, types, APIs,
database fields, feature flags, or visual components.

## 28. Weekly classification

The current Weekly work is classified as:

```text
WEEKLY STRUCTURAL UX PROTOTYPE V1
STRUCTURAL RESEARCH BASELINE
NOT FINAL VISUAL PRODUCT BASELINE
```

The classification applies to:

- `apps/web/src/features/interpretation/WeeklyReadingPrototype.tsx`;
- `apps/web/src/features/interpretation/weekly-reading-prototype.ts`;
- `apps/web/src/pages/dev/weekly-reading.astro`;
- the admitted `WeeklyReadingModel` and its development-only POC path;
- `docs/research/weekly-signal-poc/WEEKLY_SIGNAL_POC_REVIEW.md`;
- `docs/research/weekly-signal-poc/scenario-a.md` through `scenario-e.md`.

The prototype should be preserved as a structural baseline. It demonstrates
semantic ownership, attention order, Timeline behavior, mixed evidence,
unknown-time restraint, and inactive prototype actions. It should not be
visually polished into a final product baseline in this architecture campaign.

### Frozen research evidence

The five scenarios remain the current bounded evidence set:

| Scenario | Research question |
| --- | --- |
| A — Supportive Communication | Can a clear primary theme and bounded action support coexist? |
| B — Mixed Relationship | Can supportive and challenging evidence remain nuanced in one composition? |
| C — Action vs Emotional Tension | Can action support and emotional challenge remain visible without cancellation? |
| D — Background + Momentary | Can a short window remain distinct from the broader week? |
| E — Unknown Birth Time | Can placement-level usefulness remain while time-dependent claims are omitted? |

All are development-only fixture evidence. None establishes a production
provider, production transit authority, production Weekly route, or production
content policy.

## 29. Migration

Future work should proceed in this order:

1. freeze this adaptive experience architecture;
2. define shared celestial/editorial visual language;
3. create a bounded Weekly R2 prototype using the existing ReadingModel;
4. compare internal presentation directions without exposing a user toggle;
5. conduct Product Owner and user evaluation;
6. productize only the evidence-supported parts.

No migration of existing routes, content IDs, database records, or user
preferences is required by this document. If implementation later introduces a
presentation policy, it must be additive, preserve the existing semantic
contracts, and remove any temporary bridge after its defined lifecycle.

## 30. Recommended next task

`WEB-P2-EXPERIENCE-VISUAL-001 — Define shared celestial/editorial visual language`

That next task should remain bounded and architecture-aware: define and review
the shared Brand Core, Celestial Semiotics, Editorial Expression, and Technical
Expression language against the current Visual System V1.1. It should not
implement a global mode toggle, a full Visual System V2 rewrite, a second
content system, or new Weekly production routes.

## Admission decision

```text
ADAPTIVE_EXPERIENCE_ARCHITECTURE_ADMITTED
MODULE_PASS
NO_LARGE_REFACTOR_REQUIRED
WEEKLY_STRUCTURAL_BASELINE_PRESERVED
READY_FOR_CELESTIAL_EDITORIAL_VISUAL_LANGUAGE
```
