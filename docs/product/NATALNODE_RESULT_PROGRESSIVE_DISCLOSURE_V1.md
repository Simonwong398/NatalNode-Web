# NatalNode Result Progressive Disclosure V1

- Status: **APPROVED PRODUCT UX DIRECTION**
- Implementation status: **IMPLEMENTATION DEFERRED TO BOUNDED PATCHES**
- Task: `WEB-RESULT-001A`
- Date: 2026-08-27
- Product source of truth: `docs/PRD.md`
- Extends: `docs/ARCHITECTURE.md`, Visual System V1.1, and Astrological Semantic Layer V1
- Runtime changes authorized by this document: **ZERO**

## 1. Purpose, authority, and scope

This document freezes the V1 information architecture for the Natal chart
result experience after a successful calculation. It governs presentation
order, result-mode responsibilities, progressive disclosure, trust
visibility, Vault action placement, responsive behavior, and accessibility.
It does not implement those decisions.

`docs/PRD.md` remains the product source of truth. The architecture, visual
system, and Astrological Semantic Layer remain authoritative in their own
scopes. This document refines the result-specific information hierarchy. Its
future three-mode visibility policy replaces the current result surface's
simultaneous desktop presentation, but it does not replace visual tokens,
chart geometry, scientific ownership, semantic notation, or established
system boundaries.

The fixed boundary remains:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
→ scientific core
```

No provider decision is made here. `PROVIDER DECISION DEFERRED.`

This governance task does not authorize changes to the deterministic
interpretation corpus, scientific contracts, Engine clients, resolver,
astronomy, houses, aspects, orbs, BFF behavior, Vault ownership, Public Sky,
or the homepage composition.

## 2. Product problem and governing principle

The current result contains useful chart facts, interpretation, provenance,
warnings, and persistence controls. The problem is not a lack of information.
It is the amount of information presented at the same visual priority and the
lack of a sufficiently intentional reading journey.

One Calculate action must not immediately ask a user to consume the wheel,
complete notation lists, a save form, every interpretation paragraph, and
technical calculation metadata as one continuous result.

The frozen principle is:

```text
FAST ORIENTATION
→ MEANINGFUL SUMMARY
→ OPTIONAL DEPTH
→ TECHNICAL INSPECTABILITY
```

Progressive disclosure must reduce cognitive and visual density without
hiding limitations, severing interpretation from source facts, or making
technical provenance inaccessible.

## 3. Repository-truth audit

### 3.1 New calculation render composition

The current successful calculation path is:

```text
apps/web/src/pages/index.astro
└── ChartExperience (React island)
    ├── BirthInputForm
    ├── development Engine Client disclosure
    └── ChartWorkspace                      [only after a snapshot exists]
        └── ChartWorkspaceView
            ├── result header/status badges
            ├── unknown-time trust notice  [when applicable]
            ├── Chart / Interpretation / Details navigation [below lg only]
            ├── Chart panel
            │   ├── ChartRenderer
            │   ├── AstrologicalNotation
            │   └── SaveChartPanel          [injected as children]
            ├── Interpretation panel
            │   └── InterpretationPanel
            │       ├── Big Three or Core placements
            │       ├── Planets in Signs
            │       ├── Planets in Houses   [only when available]
            │       └── Major Aspects
            └── Details panel
                └── CalculationDetails
```

`ChartExperience` conditionally mounts `ChartWorkspace` only after a
successful snapshot exists. The birth form and development disclosure remain
above the result. The development disclosure currently contains:

- `UI DEVELOPMENT ONLY`;
- `NOT SCIENTIFIC EVIDENCE`;
- `NOT PRODUCTION ASTRONOMY`.

Those statements are development trust disclosures, not interpretation or
technical-detail content.

### 3.2 Result shell and visibility behavior

`ChartWorkspaceView` is the current result shell. It owns:

- the result heading and status badges;
- the unknown-time availability notice;
- the `Chart`, `Interpretation`, and `Details` section state;
- accessible keyboard handling for the narrow-screen tab list;
- placement of the three result panels;
- placement of the injected save surface.

The active section defaults to `chart`.

Below the `lg` breakpoint, inactive panels receive the CSS `hidden` class and
the active panel receives `block`. The three panel component trees are still
mounted; they are visually hidden rather than conditionally rendered.

At `lg` and above, every panel receives `lg:block`, regardless of the active
section. The section navigation itself is `lg:hidden`. Desktop therefore
shows Chart and Interpretation simultaneously, with Details spanning below.
The active-section state has no visible desktop mode-switching role.

### 3.3 Content ownership

| Concern | Current owner | Current presentation consequence |
| --- | --- | --- |
| Chart wheel and scientific SVG geometry | `ChartRenderer` | The primary instrument is visible in Chart. |
| Body and major-aspect notation lists | `AstrologicalNotation` | Complete fact lists appear directly below the wheel. |
| Deterministic interpretation grouping and prose | `InterpretationPanel` and `deterministic-interpretation.ts` | Every available section and item is expanded. |
| Calculation/configuration/provenance metadata and warnings | `CalculationDetails` | One native `details` disclosure, closed by default. |
| New-result Vault persistence | `ChartWorkspace` injects `SaveChartPanel` | A complete save form appears below the Chart instrument. |
| Result section navigation | `ChartWorkspaceView` | Available only on narrow screens. |
| Unknown-time presentation availability | `chart-presentation-policy.ts` | Angles, houses, and house interpretation are suppressed. |
| Development disclosure | `ChartExperience` | Appears before the conditionally mounted result. |

`ChartRenderer` must remain the owner of the wheel and its geometry.
`AstrologicalNotation` must remain the owner of readable chart-fact notation.
`InterpretationPanel` must remain the owner of deterministic interpretation
presentation. `CalculationDetails` must remain the owner of technical
metadata and the complete warning list. Progressive disclosure must compose
these owners; it must not move scientific or persistence responsibilities
merely to achieve a layout.

### 3.4 Interpretation density

`InterpretationPanel` currently renders all non-empty interpretation arrays
in sequence. Each item immediately displays its title, full deterministic
paragraph, and source-fact metadata. There is no section-level or item-level
disclosure. A complete chart therefore exposes all available Big Three,
Planets in Signs, Planets in Houses, and Major Aspects paragraphs at once.

The interpretation generator already returns explicit arrays for those four
approved groups. Their lengths are the authoritative source for concise
section counts; no new summary generator is needed.

### 3.5 Calculation Details density

`CalculationDetails` already uses a native `details` element without the
`open` attribute, so its technical body is closed by default. When opened it
exposes Engine version, chart schema, calculation status, configuration
status, astronomy configuration, provenance envelope, house-system context,
research-configuration limitations, and warnings.

This is the correct technical ownership and inspectability. The future
top-level Details mode must avoid adding a redundant closed disclosure that
requires a user to choose Details and then choose Calculation Details again.

### 3.6 Vault ownership and the saved-chart path

For a newly calculated chart, `ChartWorkspace` passes `SaveChartPanel` into
`ChartWorkspaceView`, where the full save form is placed after the Chart
instrument. This gives persistence the weight of a primary reading surface
before the user expresses save intent.

The saved-chart route is different. `SavedVaultChartExperience` reuses
`ChartWorkspaceView` inside `VaultChartManagement`. Saved-chart metadata,
notes, and deletion management remain outside the result workspace. The
future result-shell policy must not pull those management concerns into the
three result modes or change Vault security and ownership semantics.

## 4. Frozen top-level result architecture

V1 has exactly three top-level result modes:

1. **CHART**
2. **INTERPRETATION**
3. **DETAILS**

No fourth top-level mode is approved. Vault is an action and persistence
workflow, not a result mode. Warnings are trust state, not a result mode.
Astrological notation is part of Chart. Calculation Details is the content of
Details, not a second concept competing with it.

Only the active mode's primary content is visually presented at every
viewport width. Inactive modes must be hidden from the accessibility tree and
must not remain interactive. An implementation may keep inactive components
mounted to preserve local disclosure state, or conditionally render them,
provided accessibility, focus, and performance requirements are met. The
current `lg:block` override for all panels is not the target architecture.

The result shell owns:

- compact result identity and status;
- concise global limitation/trust state;
- the three-mode navigation and active mode;
- the contextual Save action for a newly calculated chart;
- focus and announcement behavior when the active mode changes.

Individual mode owners retain their domain responsibilities.

## 5. Mode responsibilities

### 5.1 Chart

Chart answers:

> What is in my chart?

Chart is the default mode after a successful calculation. It contains:

- the natal wheel as the immediately visible primary instrument;
- essential chart identity and calculation availability state supplied by
  the result shell;
- a compact chart-fact orientation summary derived only from available chart
  facts;
- readable astrological notation;
- one clear path to complete body and aspect fact lists.

Chart must not contain full interpretation prose or technical diagnostics.
The chart-fact summary may state explicit counts or availability, such as the
number of supplied bodies and major aspects and whether houses/angles are
available. It must not generate qualitative scores, pattern claims, or
interpretive conclusions.

The current wheel plus complete body list plus complete aspect list is too
dense for the default Chart surface. V1 should keep the wheel immediate and
present a compact notation orientation, with the complete notation list
available through one section-level disclosure. That disclosure is the
second and final meaningful depth level within Chart.

### 5.2 Interpretation

Interpretation answers:

> What does this chart mean within NatalNode's interpretation framework?

It contains only approved deterministic interpretation categories:

- Big Three, or Core placements when angles are unavailable;
- Planets in Signs;
- Planets in Houses when structurally available;
- Major Aspects.

The interpretation corpus, fact eligibility rules, and source-fact
relationships remain unchanged. Interpretation must remain visibly distinct
from calculated and derived chart facts. No AI summary, generated overview,
new pattern category, or unsupported emphasis claim is approved.

### 5.3 Details

Details answers:

> How was this result calculated, configured, and qualified?

It contains:

- Engine version;
- chart schema;
- calculation status;
- configuration status;
- astronomy configuration;
- provenance envelope;
- calculated or requested house-system context;
- research/incomplete configuration data;
- the complete warning list with available code, severity, and message.

Details must remain fully inspectable and copy/reference friendly. It must not
contain interpretation prose or duplicate ordinary chart notation. Selecting
Details is itself the user's intentional technical-disclosure action, so the
technical body should be visible without a redundant second closed summary.
Subgroups may use headings or at most one further disclosure where a warning
or raw metadata list is genuinely long.

## 6. Default post-calculation journey

The V1 journey is frozen as:

1. Calculation succeeds and the result shell is introduced and announced.
2. The compact result header communicates result identity, status, and any
   global limitation.
3. Chart is active by default.
4. The wheel provides immediate orientation.
5. Compact chart facts provide a readable bridge from instrument to data.
6. The user may disclose complete chart facts without leaving Chart.
7. The user intentionally enters Interpretation.
8. Big Three, or Core placements, is already expanded as the first meaningful
   summary.
9. Deeper interpretation sections advertise explicit available counts and
   open on demand.
10. The user intentionally enters Details for configuration, provenance, and
    complete warnings.

The result must not automatically scroll the user through every layer. The
user decides when to move from facts to meaning and from meaning to technical
inspectability.

## 7. Interpretation disclosure architecture

### 7.1 Default state

On first entry to Interpretation:

- **Big Three** is expanded when Sun, Moon, and Ascendant are available;
- **Core placements** is expanded when exact birth time is unknown and the
  approved result contains only the available core placements;
- **Planets in Signs** is collapsed;
- **Planets in Houses** is collapsed only when structurally available;
- **Major Aspects** is collapsed.

Big Three/Core placements is the immediate high-value summary. The user must
be able to understand the existence and character of NatalNode's
interpretation within one screen or a short scroll without exposing every
paragraph.

Disclosure state should persist while the current result remains mounted.
Switching to another mode and back must not unexpectedly collapse a section
the user opened.

### 7.2 Section summaries

Collapsed sections must expose a readable heading and a concise fact-based
summary. The implementation must use the existing deterministic
interpretation arrays as the source of truth.

Approved summary forms include:

```text
Planets in Signs
10 placements

Planets in Houses
10 placements

Major Aspects
7 major aspects
```

Counts must reflect the actual array presented. They must not be inferred
from an expected body set, fixture assumptions, or requested configuration.
No quality score, interpretation score, AI text, or synthetic synopsis is
allowed.

For an available category with no supported items, use a truthful empty-state
sentence rather than an expandable zero-length panel. For a category that is
structurally unavailable, use the limitation policy in section 13 rather than
an ordinary zero count.

### 7.3 Section and item behavior

Section-level expansion is the V1 pattern. Opening Planets in Signs, Planets
in Houses, or Major Aspects reveals that section's complete existing item
list. Individual interpretation cards are not accordions in V1.

Multiple sections may remain open. One-open-at-a-time behavior is prohibited
because it interferes with comparison, scanning, deep reading, and
copy/reference use without providing a necessary product benefit.

The maximum meaningful depth is:

```text
Interpretation mode
→ section disclosure
→ visible item list
```

There must not be a category accordion followed by planet accordions,
paragraph accordions, and source-fact accordions. A future bounded “show
more” treatment may be evaluated only if measured list length still creates a
problem after section-level disclosure; it is not approved by this document.

### 7.4 Source-fact transparency

Every interpretation item keeps its existing source-fact relationship. The
relationship remains visible when the item is visible, including forms such
as:

- `Source fact — Sun`;
- `Source fact — Sun — House 11`;
- `Source fact — Sun opposition Moon — orb …`.

Source-fact content is secondary metadata beneath or adjacent to the
interpretation prose. It should use the visual system's metadata hierarchy,
not a competing card title or primary badge. It must remain readable, copyable,
and available without another disclosure.

Source facts are not a substitute for Details. They explain which chart fact
supports a specific interpretation; Details explains configuration,
provenance, and qualification of the whole calculation.

## 8. Result header policy

The result shell should have one compact, non-dashboard header. It may include:

- `Natal Chart` as result identity;
- calculation/configuration status in concise form;
- one global availability or research limitation when present;
- the secondary Save action for a newly calculated chart;
- the `Chart / Interpretation / Details` navigation.

House system may appear only when it materially orients the ordinary user and
the label accurately distinguishes a calculated system from a requested
system. It must not cause configuration metadata from Details to be repeated
in the header.

The header is persistent in the sense that it belongs to the result shell and
does not change identity between modes. V1 does not require a sticky viewport
header. Sticky behavior is deferred unless later responsive acceptance finds
a demonstrated navigation problem. A giant dashboard toolbar, status matrix,
or duplicated technical metadata is prohibited.

## 9. Result navigation policy

`Chart`, `Interpretation`, and `Details` form one accessible top-level mode
control on desktop and mobile.

The navigation must:

- show all three labels without horizontal scrolling;
- expose one unambiguous active state;
- use tab semantics or an equivalently correct single-page mode pattern;
- support keyboard activation and Arrow/Home/End behavior when implemented
  as tabs;
- associate each control with its panel;
- keep inactive content out of the accessibility tree and tab order;
- preserve disclosure state during mode changes;
- avoid adding a browser-history entry for each ordinary mode change.

Mode changes are local result navigation, not route navigation. Browser Back
must not unexpectedly cycle through result modes. URL deep-linking is not
part of V1.

On desktop, a mode change should preserve the user's result context rather
than jump to the top of the document. On mobile, activation should align the
result panel heading or result-shell content start into view when needed and
move focus or announce the new panel without creating a disorienting page
jump. The exact scroll implementation belongs to responsive acceptance; a
blind `scrollTo(0, 0)` is not approved.

## 10. Warning and trust policy

Progressive disclosure must not hide a limitation that changes whether the
result can be understood or safely used.

### 10.1 Globally visible state

The result shell keeps a concise, deduplicated statement for:

- unknown birth time when it removes angles, houses, or house interpretation;
- a calculation error or critical result qualification;
- research/incomplete configuration when it materially qualifies the result;
- other Engine-supplied state that changes content availability.

Development disclosures remain truthful and visible in development. The
existing `UI DEVELOPMENT ONLY`, `NOT SCIENTIFIC EVIDENCE`, and
`NOT PRODUCTION ASTRONOMY` statements must not be moved into a closed Details
panel merely to reduce density.

### 10.2 Details state

Details owns the complete warning inventory, including available warning
codes, severities, messages, unavailable configuration identities, and
provenance qualifications. Ordinary informational warnings may live only in
Details when they do not alter the interpretation of visible content.

A section-specific limitation may also appear at the affected section entry,
but wording should be concise and must not create multiple visually competing
copies of the same warning. The result shell communicates consequence;
Details preserves full evidence.

## 11. Vault Save policy

For a newly calculated chart, Save to Vault is a secondary contextual action
in the compact result header/action area. It remains reachable from every
result mode without competing with the wheel or interpretation.

The full display-name/category form should appear only after explicit Save
intent, using an accessible inline disclosure or other bounded existing
surface. Opening it must not change Vault authorization, ownership,
validation, guest sign-in, or persistence behavior. Saving must not become a
fourth result mode, a primary hero action, or a full form permanently inserted
between chart orientation and interpretation.

The result may retain the user's current mode when Save is opened or
completed. Save success and error feedback must be announced and remain near
the action that caused it.

For an already saved chart, `VaultChartManagement` continues to own saved
metadata, notes, and deletion outside the result modes. This policy does not
duplicate “Save to Vault” in that management flow.

## 12. Responsive policy

### 12.1 Desktop

Desktop uses available width to improve legibility, not to expose all modes
at once. The selected mode remains the primary reading surface.

Within Chart, the wheel may retain an observatory-style wide instrument
composition with a compact facts rail or summary when it does not compete
with the instrument. Within Interpretation, width may improve line length and
section scanning, but must not become a matrix of equally weighted dashboard
cards. Details may use definition-list columns where that improves technical
inspection.

The existing visual system's hierarchy remains:

- instrument primary;
- interpretation editorial and secondary to scientific facts;
- technical details tertiary until intentionally selected;
- Save contextual and subordinate.

No giant multi-column dashboard, sticky command center, or simultaneous full
Chart/Interpretation/Details layout is approved.

### 12.2 Mobile

Mobile is content-first and mode-led:

```text
compact result header and global limitation
→ three-mode navigation
→ active mode content
```

Chart opens first. The wheel remains first within Chart, followed by compact
facts and optional complete notation. Interpretation opens with Big
Three/Core placements and collapsed deeper categories. Details is reachable
directly without scrolling through interpretation.

At 320px and above:

- all three mode labels must fit without horizontal overflow;
- navigation must not require a horizontally scrolling tab strip;
- controls and disclosure summaries must retain accessible target sizes;
- headings, glyphs, counts, and status text must wrap safely;
- no giant fixed header may consume the reading viewport;
- no nested card or accordion structure may create unusable indentation;
- changing modes must not leave focus in hidden content.

The chart may resize or crop only according to the existing renderer's
truth-preserving responsive contract. Progressive disclosure must not alter
scientific geometry.

## 13. Unknown birth time

The invariant remains:

```text
localTime = null
```

when exact birth time is unknown. No noon, midnight, or other fallback time is
allowed.

The presentation consequences are:

- Ascendant is absent;
- Midheaven is absent;
- houses and house cusps are absent;
- house-based interpretation is absent;
- Big Three becomes the existing truthful Core placements treatment;
- the result shell keeps a concise global availability limitation;
- Chart fact summaries state that time-dependent facts are unavailable;
- Details distinguishes requested house-system context from a calculated
  house system.

Planets in Houses must not appear as an ordinary collapsed section with
`0 placements`. Zero would imply a completed calculation with an empty
result. The category should instead be omitted from ordinary disclosures and
represented once with a clear non-expandable limitation, for example:

```text
Planets in Houses
Unavailable without an exact birth time
```

This limitation is not an interpretation item and must not be counted as one.

## 14. Astrological Semantic Layer compatibility

The approved Modern Observatory Astrology direction remains unchanged.
Chart and Interpretation may continue to use planet, zodiac, aspect, and
house notation when those symbols communicate an actual chart fact.

Every meaningful symbol must retain a readable label or structured value.
Collapsed section summaries use plain language first; they must not become
glyph-only controls or decorative symbol clusters. Technical Details stays at
low-to-medium astrological-symbol density. No decorative mysticism, zodiac
ornament, or unsupported symbolism is introduced by progressive disclosure.

## 15. Epistemic boundaries

The result experience must preserve these distinct concepts:

| Status | Result meaning and placement |
| --- | --- |
| `CALCULATED` | Engine-supplied chart facts; primary in Chart and inspectable in Details. |
| `DERIVED` | Deterministic presentation derived from explicit facts; labeled and never presented as a new Engine observation. |
| `INTERPRETED` | Deterministic interpretation prose; confined to Interpretation and tied to visible source facts. |
| `UNKNOWN` | Data or time-dependent facts that are unavailable; shown as unavailable, never filled by fallback. |
| `RESEARCH` | Incomplete scientific/configuration state; visibly qualifies the result and remains inspectable. |

Calculated astronomy and interpreted astrological meaning must not receive
identical visual status. The presence of accurate calculation provenance does
not turn interpretation into scientific evidence. Progressive disclosure
must preserve, not blur, that distinction.

## 16. Accessibility requirements

Future bounded implementation must preserve or improve:

- one programmatic result heading and a logical heading hierarchy per mode;
- an accessible name for mode navigation and each panel;
- keyboard-operable mode and disclosure controls;
- visible focus indicators from the visual system;
- accurate `aria-selected`, `aria-controls`, `aria-expanded`, and hidden
  states where those semantics apply;
- inactive panels outside the accessibility tree and tab order;
- screen-reader announcement of calculation completion, active-mode changes,
  Save feedback, and material limitations without duplicate verbosity;
- semantic lists and definition lists for facts and technical metadata;
- source-fact metadata that remains textual, selectable, and readable;
- motion-independent operation;
- minimum practical target sizes and safe wrapping at 320px.

Native `details`/`summary` is acceptable for section disclosure when styled
and named accessibly. A custom disclosure must reproduce the relevant
keyboard and state semantics. Opening one section must not force another
section closed.

## 17. Explicit anti-patterns

The following are prohibited:

### A. EVERYTHING EXPANDED BY DEFAULT

Do not expose every fact list, interpretation paragraph, save field, warning,
and technical record at the same priority after Calculate.

### B. DASHBOARD OVERCORRECTION

Do not replace the long result with a giant grid, KPI toolbar, or dense set of
equally weighted cards. NatalNode remains an observatory/editorial hybrid.

### C. DEEPLY NESTED ACCORDIONS

Do not nest category, item, paragraph, and source-fact accordions. V1 permits
at most two meaningful disclosure levels.

### D. HIDING TRUST WARNINGS TO REDUCE DENSITY

Do not move critical availability, research, development, or scientific
limitations into closed technical content.

### E. AI-GENERATED SUMMARY AS A SUBSTITUTE FOR STRUCTURE

Do not add AI prose, synthetic scores, or generated synopsis to compensate
for weak information hierarchy.

### F. REMOVING SOURCE FACT TRANSPARENCY

Do not detach interpretation from the explicit chart fact that supports it.

### G. DUPLICATING CONTENT ACROSS CHART / INTERPRETATION / DETAILS

Do not repeat full fact lists, interpretation prose, or technical metadata in
multiple modes. Each mode has one responsibility.

### H. USING MOBILE HORIZONTAL OVERFLOW FOR RESULT NAVIGATION

Do not require a scrolling tab strip or clipped labels to access the three
result modes.

### I. REFACTORING SCIENTIFIC OWNERSHIP TO SOLVE PRESENTATION

Do not move chart calculation, geometry, eligibility, provider, or contract
logic into presentation components to implement disclosure.

## 18. Bounded implementation phases

This document does not authorize these patches automatically. Each phase
requires its own task, source review, targeted validation, and acceptance.

### WEB-RESULT-001B — Result shell and Interpretation disclosure

- make `Chart / Interpretation / Details` the real top-level mode hierarchy
  at all viewport widths;
- remove the desktop `lg:block` simultaneous-mode behavior;
- preserve accessible navigation and disclosure state;
- introduce Interpretation section summaries from existing arrays;
- default Big Three/Core placements open and deeper sections closed;
- implement truthful unknown-time category availability;
- do not change interpretation text or fact eligibility.

### WEB-RESULT-001C — Chart fact density and Vault action

- keep the wheel immediate;
- create a compact fact orientation from existing result facts;
- move complete notation behind one section-level disclosure;
- place Save as a secondary result-shell action;
- reveal the existing save workflow only after intent;
- do not change Vault persistence or security semantics.

### WEB-RESULT-001D — Details presentation refinement

- make Details content fully visible when its top-level mode is selected;
- remove redundant nested disclosure if 001B leaves one;
- preserve complete configuration, provenance, and warning inspection;
- keep concise global trust state outside Details;
- do not change scientific or contract data.

This phase may be skipped if 001B already satisfies the Details contract
without expanding scope.

### WEB-RESULT-001E — Mobile and responsive acceptance

- verify the complete journey at 320px and representative larger widths;
- correct focus, announcement, wrapping, target-size, and panel-scroll issues;
- verify no horizontal mode-navigation overflow;
- verify unknown-time and research states in every mode;
- make only bounded acceptance corrections, not a redesign.

## 19. Runtime and governance integrity

This document changes no runtime source, dependency, lockfile, fixture,
contract, Engine client, BFF, scientific behavior, homepage Current Sky,
Public Sky contract, or `/sky` roadmap.

The repository's LOC thresholds are heuristic guardrails. They are not lint
rules and do not require a speculative split of this cohesive governance
document. Responsibility boundaries, readability, and change risk remain the
governing criteria. No production source file is enlarged or refactored by
this task, and the paused standalone large-file audit is not restarted.

## 20. Acceptance freeze

Future result work conforms to V1 only when all of the following remain true:

1. Chart, Interpretation, and Details are the only top-level result modes.
2. Chart is first and the wheel is immediate.
3. Interpretation opens with Big Three/Core placements, not every section.
4. Deeper interpretation sections advertise explicit available counts.
5. One section disclosure reveals its complete item list.
6. Source facts remain visible and subordinate to interpretation prose.
7. Details remains intentionally selected and fully inspectable.
8. Critical limitations remain globally visible.
9. Save is a secondary action and the form follows explicit intent.
10. Desktop does not show all result modes simultaneously.
11. Mobile does not require horizontal navigation overflow or endless
    interpretation scrolling.
12. Unknown time never receives a fallback time or misleading zero-count
    house category.
13. `CALCULATED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, and `RESEARCH` remain
    distinguishable.
14. Astrological symbols remain semantic and paired with readable language.
15. Scientific, provider, contract, BFF, and Vault ownership do not move to
    solve presentation.

Implementation remains deferred to the bounded phases above.
