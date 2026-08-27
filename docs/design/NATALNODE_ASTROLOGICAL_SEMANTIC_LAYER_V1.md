# NatalNode Astrological Semantic Layer V1

- Status: APPROVED PRODUCT / VISUAL DIRECTION
- Implementation status: IMPLEMENTATION TO PROCEED IN BOUNDED PATCHES
- Task: `WEB-BRAND-001A`
- Extends: frozen Visual V1.1 (`docs/design/NATALNODE_VISUAL_SYSTEM_V1.md`)
- Runtime changes authorized by this document: ZERO

## 1. Purpose and scope

This document freezes NatalNode's astrological semantic layer: the language,
notation, meaning states, density rules, and category cues that make the
product recognizably an astrology and natal-chart product. It is a governance
and design freeze extending frozen Visual V1.1, not replacing it. The semantic
system is layered on top of the accepted visual system and is additive; Visual
V1.1 remains accepted and frozen, and its decisions are not reopened by this
document.

This freeze authorizes bounded implementation planning and narrowly scoped
product patches. It does not authorize final chart geometry or SVG design,
architecture changes, provider selection, new scientific claims, decorative
rebranding, or any runtime change by itself.

## 2. Brand principle and category recognition

NatalNode does not modernize astrology by removing its language; it modernizes
it by making that language precise, inspectable, functional, and honest. The
internal concept is **MODERN OBSERVATORY ASTROLOGY**: NatalNode sits between a
scientific observatory interface and professional astrological notation. It is
not generic SaaS and it is not a decorative occult site.

### CATEGORY RECOGNITION THROUGH SEMANTICS

Within seconds, a first-time visitor should recognize NatalNode as an
astrology/natal-chart product through actual product semantics:

- real chart geometry;
- planetary and zodiac glyphs;
- aspect notation;
- house structure;
- astrology terms; and
- visible relationships between those terms and chart facts.

Recognition must come from meaningful chart language and relationships, not
from an atmospheric shortcut or an occult mood board.

## 3. Functional symbolism

Traditional symbols are approved only when they represent real data or a real
supported concept in the current UI. Every symbol must be real in the current
UI/data. A glyph must never imply a factor that the current calculation,
contract, or surface does not actually support.

The approved semantic vocabulary is:

| Domain | Approved V1 vocabulary |
| --- | --- |
| Planets | Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto |
| Zodiac | Aries through Pisces |
| Aspects | conjunction, opposition, square, trine, sextile, and later explicitly supported aspects |
| Houses | house numbers and/or Roman numerals |
| Angles | ASC, MC, and other supported angles |
| Nodes | Only when actual chart facts and scope support them |

Illustrative examples below are notation examples only, not runtime data:

- `☉ Sun`
- `♏ Scorpio · 17°42′`
- `House VII`
- `☉ △ ♄`
- `Sun trine Saturn`
- `Orb 0°38′ · Applying`

The governing pattern is **SYMBOL + HUMAN-READABLE LABEL + STRUCTURED VALUE**.
Examples are illustrative only; they must not be copied into runtime as if
they were calculated chart results. Glyph-only UI is prohibited.

## 4. Accessibility and semantic restraint

No meaning may depend on a symbol alone. Visible labels, `aria-label`, and
screen-reader text must be used as appropriate to the component and context.
Interfaces must remain understandable when glyphs are unavailable, enlarged,
de-emphasized, or read by assistive technology. Avoid symbol soup: semantic
notation should clarify relationships, not turn the interface into an
unlabeled field of marks.

### Decorative mysticism disallowed

The following are disallowed as generic category signaling or ungrounded
decoration: purple nebula backgrounds; crystal balls; tarot; mystical eyes;
unrelated alchemical decoration; parchment; pseudo-ancient manuscript
styling; excessive gold zodiac ornament; decorative constellation wallpaper;
random zodiac background symbols; occult iconography without meaning; glowing
glyph fields; decorative planet photography used only to signal space; and
generic cosmic particles.

The exact rule is: **SEMANTIC = ALLOWED** and **DECORATIVE WITHOUT PRODUCT MEANING = GENERALLY DISALLOWED**.

## 5. Chart geometry as the future brand asset

Chart geometry is the primary future brand asset. The semantic layer should
ultimately be expressed through chart rings, zodiac sectors, 12 houses,
ASC/MC axes, aspect geometry, planetary nodes/positions, concentric
calculation rings, and relationship lines derived from real structures.

This task does not design final geometry or SVG. It freezes the requirement
that future geometry be a truthful, inspectable representation of supported
structures rather than an ornamental substitute for them.

## 6. Visual V1.1 compatibility

Visual V1.1 remains accepted and frozen. Preserve its deep blue/black base,
restrained cyan, limited indigo active states, strong white type, fine grid,
negative space, quiet borders, and its Editorial and Observatory modes. This
semantic layer is additive: it adds recognizable astrological notation and
meaning states on top of those visual primitives.

This freeze does not introduce a new palette, gold/purple rebrand,
glassmorphism, decorative redesign, or heavy animation. It does not reopen
Visual V1.1, its mode boundaries, or its frozen anti-patterns. It does not
reopen the Calculate, Learn, or Tools visual reconstruction, global color
redesign, or decorative surface redesign.

## 7. Surface density policy

Density is set by surface, not by a universal dashboard preference:

| Surface | Density | Policy |
| --- | --- | --- |
| Calculate/Birth Input | LOW | Keep the task legible and trustworthy; expose only the semantic cues needed to enter, validate, and understand the request. |
| Chart Workspace | HIGH | This is the primary instrument surface; it may show chart structure, notation, relationships, status, and audit context together. |
| Interpretation | MEDIUM | Pair readable astrological language with enough structured notation to connect claims to placements and relationships without overwhelming the reading flow. |
| Calculation Details | LOW TO MEDIUM | Show provenance, values, and cross-references clearly; detail is available without making the audit surface a chart dashboard. |
| Learn | MEDIUM | Teach terminology and glyph support with editorial readability and meaningful examples. |
| Tools | MEDIUM TO HIGH where semantic | Use higher density only where the tool expresses real astrological relationships or calculations; otherwise retain focused utility. |
| Auth/Vault management/Feedback | LOW | These are trust, management, and communication surfaces; semantic decoration or chart notation must not compete with the user task. |
| About / Methodology | LOW | Explain the system and its boundaries plainly, with only the notation needed for comprehension. |

## 8. Epistemic status

Every meaningful chart statement or displayed state must be distinguishable by
epistemic status. The approved set is exactly:

### CALCULATED

A value produced from the authoritative calculation boundary. This is a
calculation status, not a meaning claim. Examples include planetary longitude
or latitude when supported, house cusp, ASC/MC, coordinates, and Engine facts.
Accurate astronomy is not proof of astrology.

### DERIVED

A deterministic relation computed from explicit calculated facts, such as an
aspect, orb, applying/separating state, house placement, or chart pattern.
Derived output must be reproducible from known inputs. It must not fabricate
Engine facts or imply that an unavailable input was calculated.

### INTERPRETED

An astrological meaning applied to calculated or derived material, such as a
placement, aspect, or emphasis. Use qualified language, represent the
interpretive nature plainly, and avoid fatalism, certainty theater, or claims
that a reading determines a person's life.

### UNKNOWN

Information is insufficient, unavailable, or unresolved. Unknown time must
remain explicit. Do not silently substitute 12:00, 00:00, an average, an
estimate, or any other invented value. Unavailable factors must be named as
unavailable.

### RESEARCH

A hypothesis, exploratory result, incomplete investigation, or experimental
feature. Research language must never be presented as production validated,
scientifically established, commercially proven, or “highest accuracy”
without evidence. Honesty is the requirement, not a marketing claim.

## 9. Science and astrology boundary

Rigor, provenance, explicit uncertainty, and a fixed calculation boundary may
improve the quality and inspectability of a calculation. They do not permit a
claim that astrology is scientifically proven or that modern science has
proved astrology. Accurate coordinates do not imply that astrological
interpretation is validated. Product language must preserve this boundary in
the UI, documentation, methodology, and future research work.

Approved internal positioning, for internal use only and not runtime copy:

- **Precise about the sky. Honest about the interpretation.**
- **Calculated with astronomy. Interpreted through astrology.**

## 10. Internal research reserve

Reserve the internal concept **NatalNode Research** for future exploration.
There is no `/research` route and no roadmap authorization in this freeze.
Potential research areas include astronomy and calculation methodology,
historical astrological conventions, evidence reviews, statistical
hypotheses, experimental findings, and limitations or null findings. These
areas must be separated with explicit labels:

`MEASURED` / `CONVENTIONAL` / `INTERPRETIVE` / `HYPOTHETICAL` /
`SUPPORTED` / `UNSUPPORTED`

The labels distinguish different kinds of claims: `MEASURED` identifies an
observed or calculated result; `CONVENTIONAL` identifies an adopted historical
or professional convention; `INTERPRETIVE` identifies an astrological meaning
applied to facts; `HYPOTHETICAL` identifies a proposition under examination;
`SUPPORTED` identifies a claim with the relevant evidence or approved
provenance for its stated scope; and `UNSUPPORTED` identifies a claim for
which that support is not established. These labels are governance
distinctions, not permission to expose a research surface or to imply
validation.

## 11. User journey

The intended recognition sequence is:

### FIRST IMPRESSION

“This is clearly an astrology / natal-chart product.”

The visitor sees meaningful chart vocabulary and a calm observatory-like
instrument rather than generic SaaS or decorative mysticism.

### SECOND

“This feels much more modern and precise than a typical astrology site.”

Labels, structured values, accessible naming, and restrained notation make the
system learnable without requiring prior glyph fluency.

### DEEPER USE

“I can tell what was calculated, what was interpreted, what is uncertain, and
where the result came from.”

The workspace, details, provenance, uncertainty, and interpretation remain
connected while preserving the science/astrology boundary.

## 12. Anti-patterns

- **Scientific SaaS overcorrection:** removing astrological language until the
  product no longer reads as astrology.
- **Occult decoration overcorrection:** adding mystical imagery or symbols
  without a supported product meaning.
- **Symbol soup:** presenting dense glyph fields without labels, values, or
  relationships.
- **Science-washing:** using observatory styling, astronomy facts, or precise
  coordinates to imply that astrological interpretation is scientifically
  proven.
- **Fake precision:** displaying exact-looking values, times, aspects, or
  confidence where the underlying input, calculation, or evidence is unknown.

## 13. Fixed boundary and implementation sequence

The fixed system boundary remains:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
```

This document does not change request/response contracts, persistence,
provenance semantics, security, or the calculation boundary.
`PROVIDER DECISION DEFERRED.` remains exactly authoritative.

Future bounded implementation should proceed in this sequence:

1. Chart Workspace notation, audit, and implementation.
2. Interpretation semantic notation.
3. Existing reference Tools notation.
4. Learn terminology and glyph support.
5. Calculation Details cross-reference refinements.
6. Final brand geometry exploration.
7. Whole-site visual review.

Calculate and Auth/Vault should receive semantic treatment only where it has
real product value; they are not targets for decorative notation.

The recommended next bounded task is **WEB-BRAND-001B — Apply Astrological
Semantic Notation to Chart Workspace**, with scope limited to Chart Workspace
notation, labels, structured values, accessibility, epistemic status, and
audit relationships supported by current UI/data. This is a recommendation,
not an implementation performed by this freeze.

## 14. Non-authorizations and validation expectations

Runtime changes are ZERO. This document authorizes no changes to
`apps/web/src`, `server/src`, `packages`, `server/db`, manifests, or lockfiles;
no image, SVG, font, or glyph library work; no provider decision or
provider-specific dependency; no roadmap change; and no `/research` route. It
does not authorize modifying the separate Visual V1.1 document.

Each later bounded patch must demonstrate that symbols correspond to real
current UI/data, labels and accessible names remain present, calculated and
derived values are reproducible, interpreted language is qualified, unknowns
are explicit, and no decorative mysticism has been introduced. Validation
should include focused UI/data inspection, accessibility checks, responsive
review appropriate to the surface, and targeted tests or builds for any code
that a separately authorized patch changes. A patch must report its exact
scope and preserve **PROVIDER DECISION DEFERRED**.
