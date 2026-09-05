# NatalNode Celestial + Editorial Visual Language V1

**Document status**: `CELESTIAL_EDITORIAL_VISUAL_LANGUAGE_ADMITTED`

**Task**: `WEB-P2-EXPERIENCE-VISUAL-001`

**Scope**: Brand Core, Celestial Semiotics, and presentation language. This is
a design-system and product-presentation governance document. It does not
implement Weekly R2, add runtime components, or replace the approved Visual
System V1.1 functional baseline.

**Product positioning**: `PERSONAL ASTROLOGY INTELLIGENCE`

**Architecture rule**:

```text
ONE PRODUCT / ONE TRUTH / ONE BRAND / ONE IA / ONE CONTENT IDENTITY
MULTIPLE READING DEPTHS / ADAPTIVE PRESENTATION
```

**Primary user-facing progression**:

```text
NOTICE → USE → EXPLORE → UNDERSTAND → GO DEEPER
```

**Authoritative references**:

- [`docs/PRD.md`](../PRD.md)
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`NATALNODE_ADAPTIVE_EXPERIENCE_ARCHITECTURE_V1.md`](../product/NATALNODE_ADAPTIVE_EXPERIENCE_ARCHITECTURE_V1.md)
- [`NATALNODE_VISUAL_SYSTEM_V1.md`](NATALNODE_VISUAL_SYSTEM_V1.md)
- [`NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md`](../product/NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md)
- [`NATALNODE_WEEKLY_SKY_PORTRAIT_UX_V1.md`](../product/NATALNODE_WEEKLY_SKY_PORTRAIT_UX_V1.md)
- [`NATALNODE_WEEKLY_READING_MODEL_V1.md`](../architecture/NATALNODE_WEEKLY_READING_MODEL_V1.md)

---

## Decision summary

The current Weekly structural prototype is readable, restrained, responsive,
and human-first. Its next visual challenge is domain recognition: a first-time
reader should recognize astrology without requiring astrology expertise and
without seeing decorative pseudo-data.

NatalNode’s visual language therefore combines:

```text
human readability
  + astrology identity
  + professional depth
  + celestial precision
```

The intended territory is:

```text
MODERN OBSERVATORY × EDITORIAL LIFESTYLE × ASTROLOGICAL SYMBOLISM
```

This is a synthesis of principles, not a reference to copy from another
astrology brand. The result must remain modern, human, editorial, astrological,
intelligent, premium, restrained, and recognizably NatalNode.

Editorial and technical expression are two presentation directions of one
brand. They are not user-facing modes. Observatory and Starlight remain
internal direction names only; there is no global toggle, `experiencePreference`,
separate route family, duplicate prose library, or second semantic truth.

## 1. Brand Core

Brand Core is the visual grammar that must survive both editorial and technical
surfaces.

| Invariant | Required behavior |
| --- | --- |
| Logo | Reuse the existing `BrandMark` geometry and `BrandLockup`; keep the circular structural outline, N linework, node details, and cyan signal as the identity anchor |
| Grid logic | Use the existing shell, editorial, workspace, form, and reading width roles; retain the shared gutter and avoid page-specific width improvisation |
| Spacing philosophy | Use the existing 4px-derived spacing roles with deliberate section, panel, field, and control relationships |
| Reading hierarchy | Lead with a clear human point, then evidence, context, timing, and optional technical depth |
| Interaction grammar | Shared focus, selected, hover, disclosure, error, loading, success, and disabled behavior across surfaces |
| Accessibility | Visible focus, semantic labels, non-color meaning, readable metadata, reduced motion, and 320px support remain non-negotiable |
| Celestial integrity | Type A visuals are fact-bound; Type B1/B2 motifs are visibly decorative; Type C pseudo-data is forbidden |
| Typography | One system-first type family with role-based scale; no separate “mystical” and “technical” type systems |
| Navigation | One shared shell and one IA; presentation direction never changes route identity |
| Content-first behavior | A person can understand the useful point before encountering technical terminology |

The existing repository already provides the core anchors:

- `BrandMark.astro` defines the 160-unit circular/N/signal geometry.
- `BrandLockup.astro` combines the mark with the NATALNODE wordmark.
- `global.css` defines semantic tokens, width roles, spacing, typography,
  states, motion, and appearance/daypart variables.
- `AstrologyGlyph.tsx` resolves symbols through the closed astrology glossary.
- `ChartRenderer.tsx` renders supplied chart facts through canonical geometry and
  semantic chart tokens.
- `Container.astro` provides the shared shell/editorial/workspace/form/reading
  width family.

Brand Core is therefore a reuse and governance rule, not a request for a new
visual framework.

## 2. Astrology-domain recognition strategy

Astrology recognition should come from a small number of meaningful cues used
in a deliberate hierarchy:

| Cue | Why it helps | Safety condition |
| --- | --- | --- |
| Planet glyph plus plain-language label | Immediately signals astrology while remaining legible | Must be bound to an authoritative fact when presented as personal/current-sky information |
| Zodiac glyph plus sign name | Provides recognizable astrological vocabulary | Must represent a supplied sign, not random wallpaper |
| Aspect geometry or aspect glyph | Signals professional astrological depth | Must map to a supplied aspect and remain secondary to the reading |
| Celestial timing window | Makes a Weekly/Todays reading feel like a sky reading | Must come from explicit timing evidence; no invented dates or peaks |
| Moon phase | Strong public recognition cue | Show only when authoritative; omit otherwise |
| Chart fragment or technical thumbnail | Communicates professional depth | Must be real chart-derived geometry, never a fabricated fragment |
| Life-domain label | Makes astrology usable to ordinary readers | Keep labels human; do not expose internal enums |

The first viewport must not become a glossary or a technical dashboard. One
well-labeled celestial cue is more valuable than a wall of symbols. Astrology
identity is established by meaningful evidence and hierarchy, not by adding
stars to every surface.

## 3. Celestial Semiotics

### TYPE A — FACTUAL CELESTIAL

Type A is factual and must be authoritative, traceable, and semantically owned.

Examples:

- planet and body glyphs;
- zodiac glyphs and sign labels;
- aspect glyphs, type, orb, and phase;
- house numbers and house cusps;
- ASC, MC, and other supported angles;
- Moon phase;
- real natal, sky, or transit geometry;
- authoritative planet-linked timing.

Rules:

1. Each Type A mark maps to a supplied fact or an explicitly admitted semantic
   fact reference.
2. The visual may not add precision that the fact does not contain.
3. Unknown-time and incomplete-authority gates apply before rendering.
4. Accessibility text must expose the same meaning without relying on the glyph.
5. Type A visual treatment must not be downgraded to decorative status merely
   because the surface is editorial or shareable.

### TYPE B — BRAND CELESTIAL MOTIF

Type B is non-factual brand language. It may support mood, recognition, and
composition on public/editorial surfaces, but it is never a source of
personalized or current-sky truth. Type B has two bounded subtypes:

#### B1 — DOMAIN-SIGNALING STRUCTURE

B1 establishes astrology-domain recognition and an observational/celestial
structure without supplying factual chart data.

Examples:

- abstract orbital arcs and open rings;
- node geometry;
- non-data aspect-inspired line work;
- a celestial grid;
- structured timing motifs with no factual dates or event claims.

B1 may communicate astrology domain, celestial structure, or observatory
language. It must not encode a hidden planet position, sign, aspect, house, or
timing claim.

#### B2 — DECORATIVE ATMOSPHERE

B2 is purely atmospheric and must remain clearly decorative.

Examples:

- a generic star field;
- abstract constellation-like texture;
- subtle celestial atmosphere;
- non-data editorial ornament.

B2 may support mood and composition, but it must not resemble a personalized
natal chart or current-sky snapshot.

Type B rules:

1. Type B must be clearly decorative in composition, labeling, semantics, or
   all three.
2. B1 and B2 must not be used to supply factual astrology or to replace Type A
   when a factual claim is being made.
3. If a B1/B2 treatment is sufficiently data-like that the distinction becomes
   ambiguous, it fails review and must be simplified or bound to Type A facts.
4. Type B may support a Starlight-inspired editorial treatment, but it cannot
   replace Type A when a factual claim is being made.

### TYPE C — FORBIDDEN PSEUDO-DATA

Type C is never a presentation option. The following are never acceptable as
“just visual polish”:

- a fake natal wheel;
- random zodiac positions;
- random Moon phase;
- random planetary placement;
- fake transit paths;
- fake aspect lines;
- fake house geometry;
- a decorative technical chart that a reasonable reader could mistake for real
  personal or current-sky data.

No exception is made for beauty, engagement, premium appearance, or share
performance.

## 4. Data-Likeness rule and review examples

The governing question is:

> If a normal reader could reasonably ask, “Is this showing my actual chart or
> sky?”, the visual must be Type A and data-driven.

If the answer is no, the visual must communicate decoration clearly enough that
it cannot be mistaken for a chart or current sky.

| Review result | Example | Why |
| --- | --- | --- |
| PASS | A real `ChartResult` crop showing the supplied Sun and Moon positions, with labels and an accessible description | The geometry is fact-bound, traceable, and semantically labeled |
| PASS | A clearly decorative B1 open orbit/node motif beside editorial copy, with no planet labels, degrees, aspect claims, or chart-like axes | It supports brand structure without pretending to be data |
| AMBIGUOUS | A B2 star field with three bright points placed like planets and a circular grid, but no label explaining whether it is a chart | A reader could infer personal/current-sky meaning; simplify it or bind it to Type A facts |
| AMBIGUOUS | A Moon-shaped icon in a timing card when current lunar authority is unavailable | Even if intended as decoration, placement and context imply a Moon phase |
| FAIL | A random zodiac wheel in a Weekly hero to make the page “feel astrological” | It resembles a personal chart but has no authoritative source |
| FAIL | Fake transit arcs or aspect lines behind a share card | Decorative geometry is presented where a reader can infer a real sky claim |

The review must consider the whole composition, not just the SVG `aria`
attributes. A disclaimer cannot rescue a visual that is otherwise designed to
masquerade as scientific data.

## 5. Domain-identity dosage model

Astrology identity is dosed by meaningful cues and disclosure, not by the
amount of decorative stars.

| Dosage | Reader experience | Acceptable cues | Not acceptable |
| --- | --- | --- | --- |
| LIGHT | “This is clearly astrology, even if I do not know the terminology.” | One fact-backed glyph/label, a human life-domain label, one restrained B1/B2 motif, a truthful period cue | Symbol walls, unexplained houses, random zodiac wallpaper |
| MODERATE | “There is real planetary/timing context underneath this reading.” | Multiple fact-backed body/sign cues, a labeled timing window, a concise Why section, a real chart fragment where available, or a restrained B1 structure | Dense technical metadata in the first viewport, unlabeled geometry |
| DEEP | “I can inspect the astrological method and evidence.” | Aspect type/orb/phase, house/angle detail where valid, technical chart context, source-backed disclosures | Unsupported precision, Type C Moon/transit detail, telemetry styling |

Dosage is a presentation decision inside Progressive Depth, not a user setting.

## 6. Editorial expression — Editorial / Starlight-inspired

Editorial expression is the default reading language for public, educational,
and human-first personal content. “Starlight-inspired” is a working art-
direction name, not a product mode.

Characteristics:

- strong editorial hierarchy and clear reading measure;
- expressive but restrained headings;
- warmer or softer surface transitions within existing semantic tokens;
- readable life-domain language;
- generous rhythm around the main point;
- social-readable share composition;
- illustrative framing that remains obviously B1 or B2 when decorative;
- enough celestial identity to avoid generic premium-report styling.

Editorial expression must remain premium, calm, non-childish, non-generic, and
NatalNode-specific. It must not use:

- pink-for-girls logic;
- zodiac-sticker spam;
- cheap gradients;
- crystal-ball visuals;
- magic-sparkle overload;
- tarot-shop aesthetics;
- prediction language disguised as lifestyle copy.

The default editorial sequence remains:

```text
human point → life-domain relevance → timing/context → why/evidence → optional depth
```

## 7. Technical expression — Observatory-inspired

Technical expression is the optional deeper presentation direction for chart
inspection and method-aware reading.

Characteristics:

- precision and measured density;
- canonical planet, zodiac, aspect, house, and angle glyphs;
- real geometry and technical anchors;
- cooler tonal emphasis within existing chart and brand tokens;
- controlled typography and tabular numeric alignment;
- explicit timing, orb, phase, and provenance where supported;
- progressive disclosure so ordinary readers are not blocked.

Technical expression must not become:

- a developer dashboard;
- telemetry UI;
- a terminal aesthetic;
- a data-table wall;
- scientific cosplay;
- jargon used as decorative authority.

The technical view remains readable by normal users. A technical label should be
paired with a plain-language explanation or a clear disclosure affordance.

## 8. Shared visual DNA

Editorial and technical expressions must remain recognizably NatalNode.

```text
                 BRAND CORE
       ┌─────────────┴─────────────┐
 EDITORIAL EXPRESSION       TECHNICAL EXPRESSION
       │                             │
 human pacing                 evidence pacing
       │                             │
       └──── same truth / same IA / same interaction grammar ────┘
```

Shared invariants:

- `BrandMark` and `BrandLockup` geometry;
- shell, editorial, workspace, form, and reading grid roles;
- spacing scale and responsive gutters;
- core typography roles;
- button, field, disclosure, focus, and status grammar;
- semantic color roles and state families;
- Type A factual, Type B1/B2 brand-motif, and Type C forbidden-pseudo-data rules;
- content-first hierarchy;
- the Progressive Depth sequence;
- accessibility thresholds and reduced-motion behavior;
- one URL/content identity and one authority chain.

The expressions may vary in density, framing, and disclosure, but they must not
look like unrelated brands.

## 9. Typography direction

The current system-first typography is sufficient for V1. It should be used as
one role-based system rather than split into two separate font families.

| Role | Direction | Current sufficiency |
| --- | --- | --- |
| Display | Large editorial headline, restrained negative tracking, strong line-height control | Sufficient with existing `nn-type-display` / page-title roles |
| Editorial heading | Clear section and card hierarchy, readable measure | Sufficient with existing section/card roles |
| Body reading | Comfortable 16–18px range, 1.55–1.7 line-height | Sufficient with existing body roles |
| Technical numeric | Tabular numbers for degrees, coordinates, dates, versions | Sufficient with existing numeric/mono tokens |
| Metadata | Minimum readable size, explicit status, no decorative uppercase overload | Sufficient with existing metadata role |
| Glyph | System symbol stack with stable baseline and a text label nearby when needed | Sufficient with existing astrology glyph stack |

Existing font direction remains:

```text
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

and a system monospace stack for compact machine-oriented values. No font,
remote asset, or licensing decision is added by this document. A future font
addition would require a role-based product reason, not a desire to make one
expression look more “mystical.”

## 10. Color direction

The current V1.1 semantic tokens remain authoritative. This document defines
their presentation roles; it does not introduce a new palette.

| Color family | Existing role | Visual-language use |
| --- | --- | --- |
| Brand Core | `--nn-brand-midnight`, `--nn-brand-cyan`, `--nn-brand-silver`, `--nn-brand-white` | Logo, brand instrument, stable identity accents |
| Core surfaces/text | `--nn-bg-*`, `--nn-surface-*`, `--nn-text-*`, `--nn-border-*` | Shared shell, reading rhythm, surface hierarchy |
| Editorial expression | `--nn-accent-primary`, `--nn-accent-supporting`, `--nn-ambient-*` | Selective editorial emphasis, calm atmospheric depth, links/focus |
| Technical expression | `--nn-chart-*` | Real chart facts, aspects, bodies, zodiac, houses, angles, selection |
| State | `--nn-status-success`, `--nn-status-warning`, `--nn-status-error`, `--nn-status-research`, `--nn-status-info` | Trust, workflow, authority, and operational state |
| Decorative celestial | Low-opacity `--nn-ambient-*` and approved brand cyan/silver | B1/B2 motifs only; never a hidden data channel |

Rules:

- Color is never the sole carrier of astrology meaning, state, or selection.
- Chart/data colors remain separate from success/warning/error colors.
- Editorial accents remain scarce; every surface does not need violet or cyan.
- Existing appearance/daypart infrastructure remains independent of experience
  depth.
- V1 does not promise or add a full Light/Dark × Editorial/Technical matrix.
- Any future appearance variant must preserve semantic token roles and contrast.

## 11. Astrology glyph policy

The canonical glossary and `AstrologyGlyph` primitive are the source for
symbolic notation. Glyphs are not wallpaper.

| Symbol family | Show at ordinary reading depth when | Pair with text when | Move to deeper view when |
| --- | --- | --- | --- |
| Planet/body | A supplied body fact anchors the reading | First use, unfamiliar locale, or any consumer-facing sentence | The glyph would distract from the human point |
| Zodiac/sign | A supplied sign is part of the relevant fact | Always in Notice/Use unless the sign name is already adjacent | A compact technical row can use glyph + label after first use |
| Aspect | The supplied aspect explains a theme or timing | Always in Explore/Understand; include type in plain language | Orb/phase belongs in Go Deeper unless central to the reader question |
| Angle | A valid known-time angle is relevant | Use ASC/MC with full label on first use | Technical view may show shorthand after explanation |
| House | A valid known-time house is relevant | Use house number and human context together | Roman numeral/compact notation belongs in Go Deeper |
| Motion | A supplied motion state is meaningful | Use “retrograde/direct/stationary” with the glyph if shown | Technical details can remain in Go Deeper |

Specific rules:

1. A glyph must be data-bound whenever it is presented as personal or
   current-sky meaning.
2. A glyph that is decorative must be marked decorative and must not imply a
   hidden value.
3. Ordinary readers get a word label; glyph-only presentation is reserved for
   repeated, well-labeled technical contexts.
4. Screen readers receive the canonical glossary term and relevant fact
   description. Decorative glyphs remain hidden from the accessibility tree.
5. Unknown birth time gates houses and angles through the existing presentation
   policy; a visual must not reintroduce them.
6. Locale text comes from the approved terminology path; a glyph never becomes
   a workaround for missing localization.

The current glossary includes P0 bodies/signs/aspects and explicit priority for
later sky/lunar concepts. Deferred glossary concepts remain unavailable until
their authority and terminology are admitted.

## 12. Moon and phase policy

Moon phase is a high-recognition cue with a high risk of false authority.

```text
AVAILABLE WHEN AUTHORITATIVE
OMIT OTHERWISE
```

The design system may define a future Moon Phase slot with:

- phase label and accessible text;
- a real phase visual when a trusted fact is present;
- a compact relationship to timing or current-sky context;
- a clear unavailable/omitted state when authority is missing.

Current production Moon authority is incomplete. Therefore:

- do not display a fake phase;
- do not use a crescent/full-disc icon in a context that implies the current
  phase when authority is unavailable;
- do not create a random lunar phase for decorative balance;
- a generic B1 circle may only be used when it is clearly not a phase and
  not placed as a current-sky fact.

## 13. Chart geometry policy

Chart geometry can be part of NatalNode’s identity only when its provenance is
clear.

| Geometry use | Allowed condition |
| --- | --- |
| Full natal chart | Real authoritative chart facts and supported time authority |
| Cropped chart fragment | Derived from the same real chart geometry; crop cannot imply missing facts |
| Aspect geometry | Supplied endpoints, type, orb, and phase are available |
| Orbital arc | B1 brand motif only, or Type A when it is a real supplied geometry |
| Technical thumbnail | Real chart/sky snapshot with appropriate labeling and accessibility |
| Background abstraction derived from real chart | Explicitly labeled and traceable; no loss of authority through decorative treatment |

The distinction is strict:

```text
REAL CHART-DERIVED GEOMETRY ≠ BRAND GEOMETRY
```

The existing `ChartRenderer` geometry and chart presentation policy remain the
authoritative implementation path for real chart and sky instruments. Visual
language work may skin or frame that geometry later, but may not re-calculate,
randomize, distort, or replace it. A fake chart fragment is Type C.

## 14. Timeline visual language

The Weekly Timeline is the main opportunity to make timing feel astrological
without turning the screen into a technical dashboard.

### Semantic timeline vocabulary

| Timeline concept | Visual treatment | Required label |
| --- | --- | --- |
| Background period | Quiet full-width lane or low-emphasis band | “Background” or a human equivalent |
| Core window | Clear vertical interval with stronger node/edge | Explicit date/window label |
| Momentary window | Short, bounded interval with distinct marker/pattern | “Short window” or equivalent |
| Overlap | Shared lane/stacked markers with readable separation | Each theme remains named; no color-only merge |
| Peak/emphasis | Stronger border/weight only when the model supplies an emphasis | Never infer a peak from visual position alone |
| Planet-linked timing | Glyph plus body name adjacent to the window | Only when authoritative timing/body evidence exists |

Conceptual structure:

```text
period header
  │
  ├─ background ────────────────┐
  │                             │
  ├─ core window ────────●─────┤  label + meaning
  │                   ◇         │
  └─ momentary ────────┴────────┘  short window / overlap
```

Rules:

- Mobile remains a vertically readable list or lane stack; no horizontal-
  scrolling dependency.
- Date labels, categories, and meaning remain visible without hover.
- Color is paired with label, stroke, weight, position, or pattern.
- Timeline ownership remains in `WeeklyReadingModel`; visual emphasis cannot
  create or delete timing.
- Planet-linked timing is shown only when the source evidence supports it.
- If there is no explicit timing evidence, omit the timeline rather than fill
  the space with decorative dates or a “best window.”
- Background and momentary evidence remain distinct; a short window must not
  become the whole week through visual dominance.

## 15. Life-domain visual language

Life domains make astrology usable to normal readers. They are human labels,
not internal Signal enums.

| Human-facing domain | Typical question | Possible evidence behind it |
| --- | --- | --- |
| Love & Relationships | “How might this show up with other people?” | Relationship Signals and supported timing |
| Work & Creation | “Where should I put attention or effort?” | Work/creation Signals and action context |
| Inner State | “What deserves reflection or pacing?” | Emotional/inner Signals and authority limits |
| Decisions | “What choice or next step is in view?” | Action/decision Signals and explicit windows |
| Communication | “What needs to be said or understood?” | Mercury/communication-related source facts where valid |
| Home & Belonging | “What concerns shared space or roots?” | Only when an admitted semantic rule supports it |

The surface shows the human label first. Technical planet, aspect, house, or
angle evidence can sit behind a Why/Technical disclosure. Do not expose enum
names such as `MIXED`, `MOMENTARY`, or `AUTHORITY_INCOMPLETE` as consumer copy;
translate them into readable status and explanation.

## 16. Progressive-depth visual mapping

| Depth | Visual payload | Astrology dosage | Guardrail |
| --- | --- | --- | --- |
| NOTICE | Hero, period label, one useful sentence, one celestial cue when fact-backed, one timing cue when available | LIGHT | No glossary dump, no fake chart, no unsupported Moon/planet visual |
| USE | One to three themes, human life-domain labels, restrained glyph + text pairs, practical action | LIGHT → MODERATE | Meaning remains primary; no technical wall |
| EXPLORE | Domain sections, Timeline, Watch Out, background/momentary distinction, selected real celestial cues | MODERATE | Timing and mixed evidence remain source-backed |
| UNDERSTAND | “Why this week?”, named body/sign/aspect evidence, authority and method disclosure | MODERATE → DEEP | Explain rather than decorate with jargon |
| GO DEEPER | Aspect detail, orb/phase, house/angle, technical chart context, provenance where valid | DEEP | Unknown-time and incomplete-authority gates remain active |

The visual rhythm follows the semantic attention ladder:

```text
main point → useful themes → where/when → why → technical context
```

The reader never has to pass through technical depth to understand the first
point.

## 17. Share visual language

Future share cards may use stronger editorial expression than the main personal
surface while remaining recognizably astrology and recognizably NatalNode.

Required invariants:

- one semantic identity and one source ReadingModel;
- a concise hook plus one or two bounded insights;
- one meaningful astrology cue when fact-backed, otherwise a clearly decorative
  B1 or B2 motif;
- no private birth date, birth time, location, account identity, or raw input;
- no fake zodiac, Moon, planet, aspect, transit, or chart geometry;
- canonical NatalNode identity and privacy-safe CTA;
- authority/unknown-time limits are not removed to make the card more attractive.

Share dosage should normally be LIGHT to MODERATE. The card should be
recognizable before it is technical. A real chart glyph may appear with a plain
language label; a glyph-only card is not the default.

No Share UI is implemented by this task.

## 18. Print visual language

Print may lean editorial, collectible, archival, or observatory-dossier-like,
but it remains a projection of the same semantic artifact.

Print must preserve:

- semantic truth and block ownership;
- chart identity and source authority;
- privacy and redaction rules;
- reader hierarchy and readable body text;
- unknown-time and incomplete-authority disclosures;
- Type A traceability, Type B1/B2 separation, and Type C exclusion.

A cover may use a restrained B1/B2 celestial motif or a real chart-derived
thumbnail. It may not introduce a fake chart simply because it is printed. No
Print UI or export implementation is authorized here.

## 19. Home visual language

Future authenticated Home should feel like a **personal sky briefing**, not
account software or a generic SaaS tile wall.

Candidate first-level composition:

```text
Today → This Week → Coming Up → This Month → My Chart
```

The first viewport should provide:

- one clear human orientation sentence;
- one truthful period or context label;
- one real celestial cue when the relevant authority exists;
- one next useful action after the value is understood.

Home may use Editorial/Starlight-inspired framing with optional technical depth,
but it must reuse the same Brand Core, IA, ReadingModel semantics, and trust
language. It must not become a dashboard of unrelated cards or a wall of
decorative planet imagery.

No Home redesign is implemented by this task.

## 20. Public surface language

Public/acquisition surfaces may be more expressive and share-friendly while
remaining trustworthy.

Allowed tendencies:

- zodiac culture and plain-language astrology vocabulary;
- editorial illustration and restrained B1/B2 celestial framing;
- short personal-insight examples that are clearly generalized or clearly
  based on supplied personal data;
- Moon/current-sky framing only when the corresponding authority exists;
- social-readable composition and a visible NatalNode identity.

The page must distinguish:

```text
generalized horoscope ≠ personal chart interpretation
```

Public expression must not become clickbait, guaranteed prediction, false
urgency, or a decorative technical chart. Any factual celestial cue still
follows Type A authority and Data-Likeness rules.

## 21. Authenticated surface language

Authenticated personal content should remain human, editorial, and warm enough
to read, while progressively exposing real astrology context and technical
detail.

The order is:

```text
personal point → life-domain usefulness → timing/context → evidence → technical depth
```

Authenticated does not mean “switch to a technical dark dashboard.” Technical
detail should be optional, legible, and justified by the user’s question.

Personal surfaces must keep:

- privacy and ownership cues;
- honest authority state;
- useful empty/loading/error states;
- the same chart and interpretation semantics as other surfaces;
- no user-facing Observatory/Starlight mode control.

## 22. Component implications

This is a component-family implication map, not an implementation plan.

| Component family | Classification | Responsibility boundary |
| --- | --- | --- |
| `BrandMark` | CORE | Stable NatalNode mark and signal geometry |
| `BrandLockup` | CORE | Mark + wordmark identity and accessible link |
| `CelestialGlyph` | CORE | Conceptual shared fact-backed glyph primitive; existing `AstrologyGlyph` is the current implementation path |
| `CelestialMarker` | CORE | A labeled fact marker with non-color state and accessible meaning |
| `ChartRenderer` | STRUCTURAL | Real chart/sky geometry, supplied facts, focus, and authority gates |
| `ChartFragment` | FUTURE | Real chart-derived crop only; never a fake decorative wheel |
| `ReadingHero` | STRUCTURAL | One semantic Hero with optional fact-backed cue and editorial framing |
| `TimelineVisualization` | STRUCTURAL | ReadingModel Timeline owner with expressive bounded styling |
| `DomainMarker` | STRUCTURAL | Human life-domain orientation; no internal enum exposure |
| `TechnicalEvidence` | STRUCTURAL | Source-backed fact/authority disclosure and technical labels |
| `MoonPhaseSlot` | FUTURE | Real Moon phase when authoritative; explicit omission otherwise |
| `ShareCard` | EXPRESSIVE_VARIANT | Privacy-safe share projection of the same semantic artifact |
| `PrintCover` | EXPRESSIVE_VARIANT | Art-directed print framing of the same semantic artifact |
| `PresentationPolicy` | FUTURE | Bounded presentation selection after ReadingModel; never semantic calculation |

Reuse is the default. A new expressive variant needs a concrete user problem,
semantic parity evidence, accessibility behavior, and content-cost owner.

## 23. Accessibility

Celestial identity is not complete unless it remains accessible.

### Glyphs and labels

- Decorative glyphs use `aria-hidden`/presentation semantics.
- Data glyphs expose the canonical term and relevant fact in accessible text.
- First use pairs a glyph with a plain-language label.
- Screen-reader output does not depend on a symbol font rendering correctly.
- Locale resolution uses the approved glossary and does not silently use a glyph
  as a localization fallback.

### Data and decorative SVG

- Data SVGs preserve `<title>`, `<desc>`, group labels, and fact descriptions.
- Decorative SVGs are excluded from the accessibility tree and cannot be the
  only carrier of a visible claim.
- Focus and selection are represented by structure, label, and state—not hue
  alone.

### Layout and interaction

- Maintain the existing 320 CSS px baseline and no page-level horizontal scroll.
- Keep hit targets approximately 44×44 CSS px.
- Preserve visible `:focus-visible` treatment and keyboard disclosure behavior.
- Support reflow and zoom without hiding labels or timing meaning.
- Keep Timeline readable as a vertical mobile sequence.
- Avoid hover-only interpretation or interaction.

### Contrast and motion

- Preserve the current AA-oriented contrast targets without claiming certification.
- Use border, pattern, label, position, or weight in addition to color.
- Honor `prefers-reduced-motion: reduce`; remove orbit, reveal, and emphasis
  motion without removing content.
- Do not use continuous particles, scroll hijacking, or animation that obscures
  chart facts or trust notices.

## 24. Visual anti-patterns

The following are explicit review failures:

- generic SaaS card wall;
- developer telemetry aesthetic;
- neon mystical overload;
- fake luxury through excessive gradients or glow;
- excessive glassmorphism or backdrop blur;
- random zodiac wallpaper;
- decorative fake natal chart;
- gradient-only hierarchy;
- “pink equals female entertainment” styling;
- technical jargon used as decoration;
- equal-weight module walls;
- star-field wallpaper with no hierarchy;
- crystal-ball, fortune-teller, or tarot-shop clichés;
- unexplained glyph-only copy for ordinary readers;
- a Moon icon that implies an unavailable phase;
- fake timelines, peaks, transit lines, or event markers;
- a rotating or filled central object that makes the brand mark look like a
  planet rather than a stable mark;
- a page that visually offers an Observatory/Starlight mode switch;
- a separate technical brand that requires a second IA.

## 25. Reference study

No external browsing or copied visual reference is required for this task. The
existing Product Owner research conclusions are sufficient as principle-level
context:

Professional astrology products tend to gain domain identity from:

- real chart geometry;
- planet and zodiac glyphs;
- aspect and orb visibility;
- ephemeris, timing, and transit context.

Consumer astrology products tend to gain accessibility from:

- life-domain framing;
- editorial illustration;
- short personal insights;
- Moon/current-sky framing when authoritative;
- social/share composition.

NatalNode should synthesize these principles through its own Brand Core,
authority rules, and Progressive Depth. It must not imitate a named astrology
site or copy its vocabulary, layout, or art direction.

## 26. Weekly R2 design brief

The current Weekly structural prototype remains the baseline. Weekly R2 should
change its visual language without changing its ReadingModel or making it a
production Weekly product.

### Preserve

- current Hero, at-a-glance, domain, Timeline, Watch Out, Why, Astrologer’s
  View, actions, and Signature reading architecture;
- Human Reading First attention order;
- mixed evidence and background/momentary distinctions;
- unknown-time omission behavior;
- responsive vertical readability and accessible disclosure;
- `DEVELOPMENT_ONLY` status and fixture boundary;
- inactive prototype Save/Share/Print representations;
- one semantic ReadingModel and one route identity.

### Add or strengthen

1. Add one meaningful celestial anchor at Notice/Use depth when a supplied fact
   exists: a glyph + plain-language term, a labeled timing cue, or a real
   chart-derived fragment.
2. If no authoritative cue exists, use a clearly decorative B1/B2 motif or
   omit the cue; never fill the gap with pseudo-data.
3. Give Timeline a distinctive astrology-aware structure through truthful
   timing categories, source-backed planet labels, and non-color markers.
4. Increase editorial personality through heading rhythm, human life-domain
   framing, and restrained Starlight-inspired composition.
5. Make the optional Why/Technical disclosure visibly connected to its
   evidence without placing technical identifiers in consumer copy.
6. Keep Progressive Depth visible in the hierarchy: main point first, technical
   depth later.
7. Keep all existing mobile behavior, reduced-motion behavior, and data
   integrity constraints.

### R2 non-goals

- no production Weekly route;
- no production transit provider or new astronomy authority;
- no new `PresentationPolicy` runtime type in this task;
- no fake Moon phase, chart, transit, aspect, or planet placement;
- no global Observatory/Starlight switch;
- no new content matrix;
- no Share, Print, Home, Account, Vault, or BFF implementation;
- no change to the Weekly semantic model.

## 27. Weekly R2 acceptance criteria

These are qualitative Product Owner review criteria, not claimed results. They
must be verified through browser review after R2 is implemented.

A first-time user should be able to say:

1. “This is clearly astrology.”
2. “This does not feel cheap or cliché.”
3. “I know where to look first.”
4. “I can understand the main point without astrology knowledge.”
5. “I can see there is real astrology underneath.”
6. “I can go deeper if I want.”
7. “The page feels distinctively NatalNode.”

Engineering review must additionally confirm:

- every personal/current-sky visual cue is Type A and traceable;
- B1/B2 motifs cannot be mistaken for a chart;
- Type C forbidden pseudo-data is absent;
- Timeline meaning does not depend only on color;
- unknown-time and incomplete-authority behavior is unchanged;
- mobile remains readable at 320 CSS px;
- reduced motion removes motion without removing meaning;
- the prototype remains `DEVELOPMENT_ONLY`.

No success claim is made by this document before Product Owner browser review.

## 28. Visual V1.1 reconciliation

`NATALNODE VISUAL V1.1 FUNCTIONAL BASELINE = APPROVED` remains unchanged.

### What remains Brand Core

- existing BrandMark/BrandLockup geometry and wordmark;
- shared semantic tokens and current appearance infrastructure;
- system-first typography roles;
- shell, width, gutter, spacing, surface, border, and state grammar;
- Editorial and Observatory page-family boundaries as internal presentation
  guidance;
- chart geometry immutability and `ChartRenderer` authority;
- astrology glossary and fact-backed glyph path;
- accessibility, responsive, reduced-motion, and performance rules;
- brand-art/data/atmosphere distinction;
- provider, Engine, BFF, Auth, Vault, and privacy boundaries.

### Candidate Visual V2 evolution

- explicit Celestial Semiotics and Data-Likeness review;
- dosage by Progressive Depth rather than page mode;
- stronger truthful astrology cues in Weekly and future period surfaces;
- shared Editorial/Technical expression language;
- bounded Share/Print/Home presentation framing;
- semantic glyph and Moon slots with authority-aware omission;
- Timeline visual identity for background/core/momentary timing.

### Experimental only

- Weekly R2 presentation prototype;
- bounded internal comparison of editorial and technical expression;
- real chart-derived fragments in appropriate surfaces;
- future share/print cover directions.

There is no global redesign admission in this task. V1.1 is not replaced and no
repository-wide decorative polish is authorized.

## 29. No runtime implementation

This campaign changes no application behavior. It must not add or modify:

- React components;
- Astro pages;
- CSS or design tokens;
- fonts or font dependencies;
- image or SVG assets;
- routes or navigation;
- theme switches;
- presentation runtime or `PresentationPolicy` code;
- Weekly R2 UI;
- Share UI;
- Print UI;
- Home redesign;
- interpretation, Signals, ReadingModel, chart, Engine, provider, BFF,
  authentication, Vault, database, or server code.

The only canonical artifact admitted by this task is this design-language
document. Any implementation must be a separately authorized task with its own
scope and validation.

## Recommended next task

`WEB-P2-WEEKLY-R2 — Implement bounded Weekly R2 celestial/editorial visual prototype`

The next task should use this document as its visual contract, preserve the
existing Weekly structural architecture, remain `DEVELOPMENT_ONLY`, and stop
at the Product Owner browser acceptance gate. It must not begin automatically
from this task.

## Admission decision

```text
CELESTIAL_EDITORIAL_VISUAL_LANGUAGE_ADMITTED
MODULE_PASS
VISUAL_V1_1_PRESERVED
READY_FOR_WEEKLY_R2_PROTOTYPE
```
