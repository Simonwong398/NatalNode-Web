# NATALNODE_VISUAL_SYSTEM_V1

- Status: FROZEN — implementation specification; V1.1 functional baseline approved
- Task: `WEB-VIS-001B`
- Date: 2026-08-25
- Product baseline: `docs/PRD.md`
- Applies to: NatalNode.com visual reconstruction V1
- Theme decision: DARK-DOMINANT; no light theme, switcher, or automatic theme
- Deployment: `WEB DEPLOYMENT TRACK = PAUSED`

This document is the visual-track source of truth. It freezes system roles,
hierarchy, constraints, and approximate implementation values. It does not
authorize changes to scientific facts, product contracts, persistence,
security boundaries, or deployment.

## 1. REPOSITORY FIT

Observed at the `WEB-VIS-001B` baseline:

| Observation | V1 consequence |
| --- | --- |
| Tailwind v4 is already loaded through `@import "tailwindcss"` and a small `@theme` block. | Extend Tailwind v4 semantic tokens; do not replace the styling stack. |
| The site is dark-only. `global.css` names `Inter`, but no font asset or font dependency is provisioned in the inspected frontend. | Use a system-first stack and do not claim or require Inter. |
| Page families repeat `w-[calc(100%-2rem)]` with unrelated `max-w-*` values. | Replace incrementally with the width and gutter roles in this document. |
| The shared header keeps desktop links in one compressing row. | A collapsed, accessible mobile navigation is required. |
| `body` currently has `min-w-80`. | Do not preserve a global minimum-width rule; support a 320 CSS px viewport without page-level horizontal scrolling. |
| Feature components and the SVG renderer contain raw colors and local component recipes. | Migrate by reconstruction task; do not require one giant cleanup patch. |
| The renderer isolates a canonical 640-unit view box and geometry helpers from presentation. | Keep all geometry and source facts immutable; skin only visual tokens and presentation attributes. |
| Save-to-Vault currently precedes the chart grid in workspace DOM order. | Reorder it in the workspace reconstruction so the chart instrument is encountered first and Save remains contextual. |

These are observations, not authorization to edit those files in this task.

## 2. IDENTITY AND MODES

The identity formula is frozen:

| Influence | Share | Operational meaning |
| --- | ---: | --- |
| Scientific Data Interface | 40% | Facts, labels, provenance, explicit state, legible controls |
| Modern Editorial | 25% | Reading rhythm, clear hierarchy, restrained composition |
| Celestial Data Visualization | 20% | The chart wheel and meaningful astronomical/astrological data marks |
| Premium Space Atmosphere | 10% | Sparse depth, light, grain, and stars behind content |
| Futuristic HUD | 5% | Only useful ticks, focus marks, framing, and measurement cues |

`DATA IS THE SKELETON. INSTRUMENT UI IS THE MUSCLE. SPACE ATMOSPHERE IS THE SKIN.`

NatalNode is scientific, precise, premium, calm, modern, celestial,
intelligent, and trustworthy. It is not cyberpunk, a crypto dashboard, a game
HUD, generic AI SaaS, a mystical/fantasy horoscope blog, neon-heavy,
glassmorphism-heavy, continuously animated, or decorative at the expense of
data.

Editorial and Observatory are presentation modes of one brand, not separate
themes.

| Dimension | Editorial Mode | Observatory Mode |
| --- | --- | --- |
| Primary routes | Learn, educational Tools, Auth, general content shell | Calculate/Birth Input, Chart Workspace, Saved Chart, Vault |
| Purpose | Reading, education, SEO, discovery, trust | Calculation, analysis, inspection, provenance, saved work |
| Density | Low–medium | Medium–high |
| Canvas | `background.canvas` | `background.observatory` |
| Width emphasis | Reading measure and editorial columns | Wide instrument grid and compact metadata |
| Spacing | More section space; fewer boundaries | Tighter panel rhythm; stronger surface hierarchy |
| Decoration | Minimal atmospheric cue | Controlled chart/instrument atmosphere |
| Shared rules | Palette, type families, spacing scale, borders, states, trust language, accessibility, shell | Same |

Dark-dominant means dark Editorial Mode, not a second light website. V1 must
not add a light palette, theme switcher, system-theme branching, or unnecessary
theme architecture.

## 3. COLOR SYSTEM

### 3.1 Foundation roles

Values are V1 implementation targets. Components consume semantic roles, not
literal values.

| Semantic role | Approximate value | Use |
| --- | --- | --- |
| `background.canvas` | `#070910` | Editorial/global page canvas |
| `background.observatory` | `#0A0D16` | Observatory workspace canvas |
| `surface.base` | `#0E1220` | First elevated surface above the canvas; the V1 elevated-surface anchor |
| `surface.elevated` | `#141A2B` | Level 2 panel/instrument surface |
| `surface.interactive` | `#182238` | Hoverable/interactive surface |
| `surface.selected` | `#1D2850` | Selected/current surface; never selection's only cue |
| `border.subtle` | `#222A3B` | Dividers and quiet boundaries |
| `border.default` | `#34405A` | Cards, fields, and standard panels |
| `border.strong` | `#64738F` | Selected boundaries and high-value structure |
| `text.primary` | `#F5F7FF` | Titles, values, primary copy |
| `text.secondary` | `#CBD3E4` | Supporting copy and labels |
| `text.muted` | `#A2AEC3` | Secondary explanations |
| `text.faint` | `#8491AA` | Tertiary text only; never disabled-by-low-contrast metadata |
| `accent.primary` | `#9A8CFF` | Spectral violet: selection and primary brand emphasis |
| `accent.secondary` | `#5B9CFF` | Celestial blue: interactive emphasis and active instruments |
| `accent.supporting` | `#76D7E8` | Soft cyan: focus, precise data emphasis, links where needed |

Accents are scarce. Violet owns brand/selection emphasis, blue owns active
interaction, and cyan supports focus/data precision. They may light a selected
state, focused scientific object, meaningful chart mark, or primary
interaction. They must not make every card violet, every border glow, or every
link compete with the primary action.

### 3.2 UI status families

Status colors are not chart-data colors. Each family provides a foreground
base plus a soft surface at approximately 12% and a border at approximately
35%; text/icon labels remain explicit.

| Status role | Base | Meaning |
| --- | --- | --- |
| `status.success` | `#76C69D` | Completed, saved, resolved |
| `status.warning` | `#D8B16B` | Action needed, ambiguity, recoverable limitation |
| `status.error` | `#DD849A` | Invalid input, failed operation, blocking user/system error |
| `status.research` | `#879EFF` | Development fixture or incomplete research configuration |
| `status.info` | `#77B9E6` | Neutral information and guidance |

Research/development is periwinkle-blue, carries the literal label
`Research`, `Development`, or equivalent, and must not resemble the rose error
family. Unknown time is a trust/data-limitation state, not a fatal error.

### 3.3 Chart/data roles

The chart layer has a dedicated namespace. UI success/warning/error tokens
must never encode aspect or body meaning.

| Chart role | Approximate value | Secondary encoding |
| --- | --- | --- |
| `chart.aspect.harmonious` | `#70C7A7` | Aspect-specific dash pattern and weight |
| `chart.aspect.dynamic` | `#E18A9B` | Aspect-specific dash pattern and weight |
| `chart.aspect.neutral` | `#C9D1E3` | Solid/neutral line treatment |
| `chart.aspect.minor` | `#7895BE` | Lower opacity plus distinct dash; only when supported facts exist |
| `chart.body.primary` | `#F0F3FF` | Larger marker/label weight |
| `chart.body.secondary` | `#9EB7E8` | Marker/label weight remains legible |
| `chart.angle` | `#F0CD7D` | Heavier radial line plus `ASC`/`MC` text |
| `chart.house` | `#7F8DA8` | Thin cusp line plus house number |
| `chart.zodiac` | `#AFB9CC` | Sector boundary plus sign label |
| `chart.selection` | `#9A8CFF` | Halo, stronger stroke, and persistent selected state |
| `chart.focus` | `#76D7E8` | Focus ring/target mark and visible keyboard cue |

Raw-color governance is frozen:

```text
visual-system token -> semantic role -> component or SVG presentation
```

New feature-component styling must not add arbitrary hexadecimal values. The
SVG renderer may consume chart-specific visual tokens. Existing raw values are
migrated only as each visual reconstruction task touches their component; no
repository-wide color rewrite is required.

## 4. TYPOGRAPHY

### 4.1 Font policy and functional roles

No paid, remote, or new font dependency is allowed in V1 without a later
explicit decision. Use:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Use the platform monospace stack only for compact IDs and machine-oriented
values:

```css
ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace
```

| Functional role | Use | Rule |
| --- | --- | --- |
| Editorial | Articles, page titles, explanations | Comfortable measure and line-height; restrained tracking |
| Observatory UI | Navigation, controls, workspace headings, instrument labels | Compact, precise hierarchy; sans-serif by default |
| Data/Numeric | Degrees, coordinates, timestamps, versions, readable IDs | `font-variant-numeric: tabular-nums`; monospace only when alignment/shape helps |
| Metadata/Source Fact | Provenance, status, configuration, source labels | Minimum 12 CSS px; ordinary case by default; uppercase only for short labels |

### 4.2 Type scale

Sizes are approximate responsive targets, not page-specific pixel locks.

| Token | Size | Weight | Line height | Use |
| --- | --- | ---: | ---: | --- |
| `type.display` | `40–72px` via `clamp()` | 600 | `0.98–1.05` | Rare home/editorial hero |
| `type.page-title` | `32–56px` | 600 | `1.05–1.12` | Route title |
| `type.section-title` | `24–28px` | 600 | `1.18–1.25` | Major section |
| `type.card-title` | `18–20px` | 600 | `1.25–1.35` | Card/panel title |
| `type.body` | `16–18px` | 400 | `1.55–1.7` | Editorial and explanatory copy |
| `type.body-small` | `14px` | 400 | `1.5–1.65` | Compact panel copy |
| `type.label` | `14px` | 550–600 | `1.35–1.5` | Form/control labels |
| `type.metadata` | `12–13px` | 500–600 | `1.45–1.6` | Status, source facts, provenance |
| `type.numeric` | `13–16px` | 500–600 | `1.35–1.5` | Degrees, time, coordinates, versions |

Negative tracking is limited to `display` and large titles (approximately
`-0.02em` to `-0.045em`). Uppercase metadata uses no more than approximately
`0.06em–0.1em` tracking and cannot substitute for hierarchy. Outside the SVG,
no meaningful metadata is smaller than 12 CSS px. SVG secondary labels may be
10–12 units at the canonical 640 view box only when their rendered size stays
legible and the same fact remains available in accessible text/details.

## 5. LAYOUT, WIDTH, AND RESPONSIVENESS

### 5.1 Width roles and gutters

| Width role | Maximum | Use |
| --- | ---: | --- |
| `shell.max` | `1440px / 90rem` | Header, footer, and outer route frame |
| `editorial.max` | `1120px / 70rem` | Learn/Tools indexes and editorial compositions |
| `workspace.max` | `1440px / 90rem` | Chart and saved-chart workspace |
| `form.max` | `768px / 48rem` | Birth Input and focused task forms |
| `reading.max` | `720px / 45rem` | Long-form prose |

One shared inline gutter applies to all page families:

| Viewport | Gutter per side |
| --- | ---: |
| Base/mobile, `<640px` | `16px` |
| Medium, `640–1023px` | `24px` |
| Desktop, `1024–1439px` | `32px` |
| Wide, `>=1440px` | `40px` |

Implement a shared container primitive or semantic utility; do not repeat
`w-[calc(...)]` expressions. Width roles can nest, but a page must choose one
outer role and use `reading.max` only for prose measure.

### 5.2 Responsive behavior

The system is mobile-first and uses only meaningful layout transitions.

| Range | Behavior | Density |
| --- | --- | --- |
| Base/mobile `<640px` | Single primary column; collapsed navigation; chart fits container; mobile workspace section navigation | Editorial low; Observatory medium |
| Medium `640–1023px` | Larger gutters; selective two-column forms/cards; workspace still uses section navigation rather than an endless stack | Editorial low–medium; Observatory medium |
| Desktop `1024–1439px` | Chart/interpretation grid; persistent primary navigation; denser metadata | Observatory medium–high |
| Wide `>=1440px` | Max-width breathing room and wider instrument allocation; no indiscriminate font/spacing growth | Same information density as desktop |

The supported baseline is 320 CSS px with no page-level horizontal scrolling.
Do not set a global body minimum width. Controls, long IDs, and metadata must
wrap or scroll only inside an explicitly appropriate local region. The SVG
uses `width: 100%`, a square intrinsic ratio, and its canonical view box; it
must not change scientific coordinates to fit.

## 6. SPACING, SURFACES, AND ELEVATION

Use the existing Tailwind-compatible 4px foundation, restricted to this useful
set: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`. Do not create a token for every
one-off margin.

| Relationship | Editorial target | Observatory target |
| --- | --- | --- |
| Page section gap | `48px` mobile; `64px` desktop | `32px` mobile; `40px` desktop |
| Panel gap | `20–24px` | `16–24px` |
| Card/panel padding | `20–32px` | `16–24px` |
| Form field group gap | `20–24px` | `16–20px` |
| Label to control/helper | `8px` | `8px` |
| Metadata row gap | `8–12px` | `8px` |
| Inline control gap | `8–12px` | `8px` |

### 6.1 Surface hierarchy

| Level | Token | Purpose | Boundary |
| --- | --- | --- | --- |
| 0 | `background.canvas` or `background.observatory` | Page/canvas | No card treatment |
| 1 | `surface.base` | Primary content region or editorial card | Subtle/default border |
| 2 | `surface.elevated` | Instrument, panel, active task region | Default border; restrained shadow only if separation is needed |
| 3 | `surface.interactive` / `surface.selected` | Hover, focus, selected/current state | Strong border plus non-color cue |

The Chart Instrument is the strongest workspace surface through area,
contrast, and hierarchy—not through a giant shadow. Interpretation can share a
continuous Level 1/2 frame. Calculation Details is tertiary and collapsible.
Do not turn every subsection into a floating card.

### 6.2 Borders, radius, shadow, and glow

| Primitive | Approximate value | Rule |
| --- | --- | --- |
| Border default | `1px` | Low contrast; use subtle/default role |
| Border strong/focus | `1–2px` | Selected, focused, or structurally important only |
| `radius.small` | `6px` | Compact controls, small internal regions |
| `radius.medium` | `10px` | Fields, buttons, panels |
| `radius.large` | `16px` | Major cards/instruments only |
| Pill | `9999px` | Badges, status, compact segmented controls only |
| Shadow low | `0 8px 24px rgb(0 0 0 / 0.16)` | Optional Level 2 separation |
| Shadow raised | `0 16px 40px rgb(0 0 0 / 0.24)` | Dialog/popover or singular focal surface; not every card |
| Semantic glow | approximately `0 0 24px` at `<=18%` accent opacity | Focused object, selected node, active instrument, or minimal hero only |

Instrument panels may use sharper borders than editorial cards. No glowing
default border, fully rounded primary content container, pervasive pill,
heavy blur/backdrop stack, or decorative paragraph glow.

## 7. ATMOSPHERE, HUD, AND MOTION

Atmosphere remains approximately 10% of identity and always sits visually
behind content and chart geometry. Permitted treatments are one broad,
low-opacity violet/blue radial light field, sparse static stars, faint spatial
grain, and minimal gradient depth. Decorative layers should normally remain
around `4–12%` opacity; stars may be locally brighter but never reduce label or
control contrast.

Do not use particle systems, continuous star motion, WebGL backgrounds, large
animated nebulae, scroll-reactive parallax, excessive lens flare, or effects
that intercept pointer/focus behavior. Atmosphere cannot obscure text, chart
lines, labels, controls, or trust notices.

HUD influence remains approximately 5%. Precision ticks, restrained focus
marks, compact scientific labels, measurement rules, and subtle instrument
framing are allowed only when they represent data or improve orientation. No
fake telemetry, meaningless grids/numbers, repeated sci-fi corners, rotating
radar, or cyberpunk glyphs.

Motion communicates state:

| Motion | Target | Reduced motion |
| --- | ---: | --- |
| Hover/focus/color | `120–180ms`, ease-out | Instant |
| Panel reveal | `180–240ms`, ease-out | Instant; content remains available |
| Chart focus/selection | `160–240ms`, ease-out | Instant state change |

No continuous rotation, constant chart animation, looping glow, particle
motion, or scroll hijacking. Every meaningful motion added later must honor
`prefers-reduced-motion: reduce`.

## 8. SHARED PRIMITIVES AND STATES

The minimum shared inventory is:

`Button`, `Field`, `Input`, `Select`, `Checkbox/Toggle`, `Card/Surface`,
`Notice`, `Badge`, `Status`, `Tabs`, `EmptyState`, `ErrorState`, `LoadingState`,
and `SectionHeader`.

This is not authorization for a large component library. Add variants only
when two real consumers share semantics.

### 8.1 Common component states

| State | Required visual/semantic treatment |
| --- | --- |
| Default | Default border/surface and clear label |
| Hover | Small surface/border change; never the only indication of interactivity |
| Focus-visible | 2px cyan/blue ring or outline with at least 2px separation; never suppressed |
| Active/pressed | Slightly stronger surface; preserve label and target size |
| Selected/current | `surface.selected`, strong border, and icon/marker/`aria-current` or selected semantics |
| Disabled | Lower emphasis without illegibility; disabled cursor and native semantics; no hover response |
| Readonly | Legible value on quiet surface plus explicit readonly affordance; not styled as disabled |
| Loading | Preserve control dimensions; concise status text; set `aria-busy`/live status as appropriate |
| Error | Error family plus text/icon and programmatic error association |
| Empty | Quiet Level 1 surface, explanation, and at most one ranked recovery action |
| Success | Success family plus explicit completion text; do not rely on green alone |

Interactive controls target at least 44 by 44 CSS px. Compact controls may
look smaller only when their hit target still meets that target.

### 8.2 Buttons

| Role | Use | Treatment |
| --- | --- | --- |
| Primary | One highest-value action per task region, e.g. Calculate | Solid primary accent; scarce |
| Secondary | Supporting action, e.g. Save after result | Surface/border treatment; lower contrast than Primary |
| Quiet/Ghost | Navigation, dismiss, disclosure, tertiary action | Transparent/quiet surface with visible hover/focus |
| Danger | Genuine destructive action only | Error family; require clear destructive wording |

Do not create arbitrary button recipes. Save must not compete with Calculate
or the resulting chart, and destructive styling must not be used for ordinary
validation.

### 8.3 Fields and birth-time resolution

Fields have a persistent visible label, optional helper, and reserved nearby
error/status region. Placeholder text never replaces the label.

| Field/resolution state | Treatment |
| --- | --- |
| Focus | Strong focus ring and border; label remains stable |
| Invalid | Error border plus specific error text linked with `aria-describedby`; `aria-invalid=true` |
| Disabled | Lower emphasis and unavailable semantics; still readable |
| Readonly/resolved | Quiet surface, readable value, and explicit resolved/readonly label |
| Exact | Success status with resolved location, timezone, and UTC offset |
| `UNKNOWN_TIME` | Selected checkbox/toggle plus trust/data-limitation notice; never error red |
| `AMBIGUOUS` | Warning/action-needed notice and explicit earlier/later choice; no silent default |
| `NONEXISTENT` | Blocking correction notice with an Edit time action; no invented time |
| Resolution failure | User/system error notice with recovery copy; distinct from research state |

No visual simplification may hide a scientifically important resolution state.

### 8.4 Notice hierarchy

| Notice | Family | Volume and behavior |
| --- | --- | --- |
| User action/error | `status.error` or `status.warning` according to severity | Local, direct, recovery-oriented; alert semantics when blocking |
| Trust/data limitation | `status.warning` or neutral surface | Low visual volume, high semantic clarity; persists near affected data |
| Development/research | `status.research` | Explicit fixture/research wording; integrated trust metadata, not repeated catastrophic banners |
| Information | `status.info` | Guidance only; quiet and dismissible only if no longer needed |

`UNKNOWN_TIME` is trust/data limitation. `INCOMPLETE_RESEARCH` and development
fixture warnings remain honest until their scientific gates close, but appear
once at the relevant workspace/input boundary and remain subordinate to the
chart instrument. Their actual meaning must never be hidden or softened.

## 9. GLOBAL SHELL AND PAGE FAMILIES

All reconstructed routes use one shared shell with the `shell.max` container,
shared gutters, a shared header, consistent active-route state, and an
optional shared footer. Home, Auth, Learn, Tools, and Vault must not retain
unrelated document-shell styling after their reconstruction.

At mobile widths the header shows brand plus a simple menu button. The button
uses `aria-expanded` and `aria-controls`; the revealed navigation is keyboard
reachable, closes predictably, returns focus when appropriate, and marks the
active route with `aria-current="page"` plus a non-color visual cue. At desktop
widths the same links are persistent. Do not let desktop links compress
indefinitely, and do not default to an animated full-screen menu.

Page-family rules:

| Family | Frozen visual policy |
| --- | --- |
| Birth Input / Calculate | Observatory; grouped task; Calculate is clearly primary |
| Chart Workspace / Saved Chart | Observatory; instrument-first; trust visible; details tertiary |
| Vault | Observatory; calm, secure, organized, instrument-adjacent; shared cards; no feature expansion |
| Auth | Shared dark shell/primitives; simple trust/privacy surface; minimal celestial decoration |
| Learn | Editorial; content-first, readable, search-friendly; `reading.max` prose |
| Educational Tools | Editorial shell with a focused task surface; never a dashboard by default |

Vault and Auth are ad-free. Auth has no unnecessary decoration around
credential/sign-in actions. Saved Chart reuses Observatory Mode.

## 10. CHART WORKSPACE

The information/action hierarchy is frozen:

1. **Primary:** Chart Instrument.
2. **Secondary:** Interpretation.
3. **Tertiary:** Calculation Details and provenance.
4. **Trust:** unknown-time, research, development, and data limitations,
   visible once near the affected context.
5. **Action:** Save to Vault, contextual and visually subordinate.

Desktop (`>=1024px`) uses a rational grid with approximately 60–65% of the
main workspace width allocated to the chart instrument and 35–40% to
Interpretation. This ratio may flex for content and container size; it is not a
fixed pixel layout. Calculation Details spans below and is collapsed by
default. Save appears after the primary instrument in reading/DOM order and
uses Secondary treatment.

Below desktop, use an accessible section-navigation/tabs treatment with
`Chart`, `Interpretation`, and `Details`. `Chart` is first and selected by
default. Tabs follow keyboard and selected-state semantics. One trust notice
sits before or adjacent to the section navigation and is not copied into each
panel. Mobile must not become an undifferentiated endless stack.

Provenance remains compact, precise, and break-safe. IDs may use the data font,
wrap safely, and expose copy behavior later if separately required. Unavailable
IDs display `Unavailable` and a truthful reason; they are never synthesized.

## 11. CHART LAYERS AND SCIENTIFIC BOUNDARY

### 11.1 Layer order

| Back to front | Layer | Allowed presentation work |
| ---: | --- | --- |
| 0 | Atmosphere | Static center glow, low-opacity field, sparse stars, minimal depth |
| 1 | Instrument frame | Canvas fill, rings, boundary weights, precision ticks |
| 2 | Zodiac | Sector fill contrast, ring weight, sign-label hierarchy |
| 3 | Houses | Cusp stroke/opacity, number hierarchy; only when policy permits |
| 4 | Aspects | Color token, dash, weight, opacity, focus density |
| 5 | Bodies | Marker size/style, labels, restrained node halos |
| 6 | Angles | ASC/MC stroke and label emphasis; only when policy permits |
| 7 | Interaction | Hover, focus, selected, related, de-emphasized overlays |
| Semantic | Accessibility | Preserve SVG title/description and accessible scientific facts independent of decoration |

Atmosphere is always behind scientific geometry. SVG remains first choice;
WebGL is not allowed for P0.

### 11.2 Immutable scientific geometry and semantics

Visual reconstruction must not change or reinterpret:

- Engine-provided longitude values;
- the current longitude-to-angle convention;
- zodiac sector structure;
- house cusp positions or house ordering;
- planet/body positions;
- ASC/MC positions;
- aspect endpoints, type, orb, or phase;
- `UNKNOWN_TIME` visibility semantics; or
- accessible descriptions of scientific facts.

It also must not add scientific calculation, hide valid facts for aesthetics,
or invent selection semantics. Geometry tests remain authoritative for
presentation refactors.

Permitted visual-instrument changes are stroke widths, opacities, ring weight,
label hierarchy, marker size/style, restrained glow, precision ticks, node
halos, selection emphasis, aspect dash patterns, focus trails, and subtle
orbital framing. A galaxy or spiral may be an atmospheric skin or visual
mapping only; it can never replace or distort the authoritative 360-degree
wheel.

### 11.3 Aspect density

Aspect lines are meaningful but subordinate to body placement. Preserve every
scientifically valid aspect unless an already-authorized product filter says
otherwise.

| Aspect mapping | Color role | Approximate line recipe |
| --- | --- | --- |
| Conjunction | `chart.aspect.neutral` | Solid, `1.4px`, opacity `0.58` |
| Opposition | `chart.aspect.dynamic` | `8 4` dash, `1.3px`, opacity `0.68` |
| Square | `chart.aspect.dynamic` | `6 3 1 3` dash, `1.25px`, opacity `0.62` |
| Trine | `chart.aspect.harmonious` | Solid, `1.25px`, opacity `0.62` |
| Sextile | `chart.aspect.harmonious` | `2 4` dash, `1.1px`, opacity `0.56` |
| Authorized minor aspect | `chart.aspect.minor` | Distinct dash, `1px`, opacity `0.42–0.5` |

The patterns, weights, labels/accessibility text, and focus state are secondary
encodings; color is never the sole encoding. Do not produce a uniformly bright
“laser web.”

### 11.4 Data interaction states

| State | Chart treatment |
| --- | --- |
| Default | Role color and default weight/opacity |
| Hover | Modest weight/opacity increase and related marker response; no persistent semantic claim |
| Focus-visible | Cyan focus mark/halo and clear keyboard-visible target |
| Selected | Persistent violet halo/stronger stroke plus explicit selected semantics |
| Related | Moderate emphasis connecting selected object to valid related facts |
| De-emphasized | Reduce to approximately `0.22–0.38` opacity; do not remove valid geometry or accessible facts |

Interaction behavior itself is deferred. These recipes only future-proof the
visual states.

## 12. BIRTH INPUT

Reconstruction groups the task in this order:

1. Birth record: date, time, and the adjacent unknown-time control.
2. Location and time resolution: place, timezone, offset, and ambiguity state.
3. Calculation option: house system, visibly subordinate to required birth
   resolution.
4. Primary action: Calculate/resolve-and-calculate, with one clear progress
   state.
5. Development/research trust metadata: explicit but outside the primary
   action hierarchy.

The design reduces perceived density with grouping and progressive layout, not
by concealing scientific state. `UNKNOWN_TIME`, ambiguous earlier/later
selection, nonexistent local time, location/timezone status, and important
errors remain visible and understandable. Development fixture instructions
must not dominate the form. House-system selection remains available without
competing with Calculate.

## 13. EDITORIAL, ADS, PRIVACY, AND TRUST

Learn and educational Tools are content-first, readable, search-friendly, and
less dense than Observatory surfaces. Use a restrained editorial hierarchy,
`reading.max` for prose, limited cards, and only subtle brand atmosphere. Do
not turn education pages into dashboards.

Advertising boundaries for this visual system are frozen:

| Ad-free | Future ad-eligible, separately authorized |
| --- | --- |
| Chart Workspace and chart instrument | Learn pages |
| Birth Input primary task area | Educational Tools outside the primary tool interaction |
| Interpretation | — |
| Calculation Details/provenance | — |
| Vault and Saved Chart | — |
| Auth | — |

Ads are not part of this task. Future ads must not obscure content, interrupt
calculation, resemble controls, enter instrument surfaces, or displace trust
notices. Birth data, chart facts, and interpretations must never become ad
targeting profiles.

Trust warnings have low visual volume but high semantic clarity. Scientific
metadata may be dense but is tertiary. Actions remain few and ranked.

## 14. ACCESSIBILITY AND PERFORMANCE

V1 targets an AA contrast baseline without claiming WCAG certification:

- normal text targets at least `4.5:1`; large text and meaningful non-text
  boundaries target at least `3:1`;
- keyboard focus is always visible and is not color-only;
- form fields have semantic labels and programmatic helper/error associations;
- headings follow a meaningful hierarchy;
- selected, aspect, trust, and status meaning always has a second encoding;
- metadata outside SVG is at least 12 CSS px;
- the chart preserves `<title>`, `<desc>`, group labels, and accessible facts;
- mobile navigation and workspace tabs are keyboard accessible;
- targets are approximately 44 by 44 CSS px;
- reduced-motion behavior follows Section 7; and
- trust states remain understandable without hue.

Visual performance does not relax the PRD baseline (`LCP <2.5s p75`, `CLS
<0.1`, `INP <200ms p75`, typical chart interaction frame under 16ms). Prefer
SVG and CSS. Avoid WebGL for P0, continuous particles, large blur/backdrop
stacks, and broad SVG filters. Use an SVG filter only for a focused/selected
element and only after measuring it. Chart clarity and responsiveness outrank
atmosphere.

## 15. TOKEN AND IMPLEMENTATION STRATEGY

Canonical token names use semantic roles:

```text
--nn-bg-canvas
--nn-bg-observatory
--nn-surface-base
--nn-surface-elevated
--nn-surface-interactive
--nn-surface-selected
--nn-border-subtle
--nn-border-default
--nn-border-strong
--nn-text-primary
--nn-text-secondary
--nn-text-muted
--nn-text-faint
--nn-accent-primary
--nn-accent-secondary
--nn-status-warning
--nn-chart-aspect-harmonious
--nn-chart-body-primary
--nn-space-panel-gap
--nn-radius-medium
```

Pattern: `--nn-{domain}-{semantic-role}`. Never name a semantic token for its
literal hue (`purple-500`) or for one page. State modifiers append purpose,
such as `--nn-status-error-surface` or `--nn-chart-focus-ring`.

Implementation is frozen as:

```text
global semantic CSS variables
  -> Tailwind v4 @theme aliases/utilities
  -> small shared primitive layer
  -> feature components

chart-specific semantic variables
  -> SVG presentation attributes
```

Do not introduce CSS-in-JS, a new styling framework, a theme library, or a
Tailwind replacement. Keep one dark value set in V1. A future approved theme
can add values without changing component semantics, but V1 must not build
that architecture speculatively.

shadcn compatibility is permitted only where it reduces duplication and
preserves accessible behavior. Do not install a large component set or allow
shadcn defaults to define NatalNode's palette, radius, density, or identity.
Every adopted primitive consumes NatalNode tokens.

## 16. RECONSTRUCTION SEQUENCE

Each task is a narrow implementation boundary. Do not combine the sequence
into a broad rewrite.

| Phase | Frozen reconstruction boundary |
| ---: | --- |
| 1 | Shared Visual Foundation |
| 2 | Observatory / Chart Workspace, including the separate chart-instrument skin task |
| 3 | Birth Input |
| 4 | Vault + Auth |
| 5 | Editorial Learn + Tools |
| 6 | Responsive, accessibility, motion, and performance polish |

| Order | Task | Scope |
| ---: | --- | --- |
| 1 | `WEB-VIS-002A — Establish shared visual foundation` | Semantic tokens, system font policy, width/gutter utilities, shared primitives, base shell and accessible mobile-nav foundation |
| 2 | `WEB-VIS-002B — Reconstruct Chart Workspace observatory hierarchy` | Instrument-first grid/tabs, trust placement, Interpretation/Details hierarchy, Save DOM/action order |
| 3 | `WEB-VIS-002C — Skin SVG chart instrument` | Chart tokens and allowed visual layers only; geometry and facts unchanged |
| 4 | `WEB-VIS-003A — Reconstruct Birth Input` | Grouping, field/resolution states, action ranking, development metadata placement |
| 5 | `WEB-VIS-004A — Align Vault and Auth` | Observatory/private Vault and simple trust-focused Auth using shared primitives |
| 6 | `WEB-VIS-005A — Apply Editorial Mode to Learn and Tools` | Reading widths, editorial density, focused tool surfaces, shared shell |
| 7 | `WEB-VIS-006A — Responsive and accessibility completion` | Cross-family responsive QA, navigation/tabs, focus, contrast, reduced motion, and measured performance polish |

## 17. FROZEN NON-VISUAL BOUNDARIES

Future visual work must not reopen or change:

- `ChartRequest`, `EngineClient`, `HttpEngineClient`, or `ChartResult`;
- Birth Input resolution semantics;
- `chart-presentation-policy` or `UNKNOWN_TIME` behavior;
- Save payload or server verification/recalculation;
- Vault persistence;
- Auth/session semantics;
- same-origin security, rate limiting, or request logging/privacy;
- production provider selection;
- Engine facts, astronomy logic, provider-neutrality, or provenance truth; or
- any production release gate in the PRD.

`PROVIDER DECISION DEFERRED` remains authoritative. Visual work must not add
provider-specific UI or infer/fake unavailable scientific identities.

## 18. DEPLOYMENT PAUSE

```text
WEB DEPLOYMENT TRACK = PAUSED
Railway staging implementation = INTENTIONALLY DEFERRED
Visual reconstruction track = AUTHORIZED TO PROCEED
```

The accepted deployment ADRs remain architectural source of truth, but their
implementation sequence is paused by this visual-track decision. Do not take
`WEB-SEC-002A-R1` or `WEB-DEPLOY-002B` as the immediate next task. No Railway
change belongs in this visual track.

When deployment is explicitly resumed, `WEB-SEC-002A-R1` must complete before
`WEB-DEPLOY-002B`.

The original next task after this V1 specification was:

`WEB-VIS-002A — Establish shared visual foundation`

The V1.1 functional-baseline freeze below supersedes that historical pointer
for current product development. It does not authorize a new decorative
reconstruction sequence.

## 19. VISUAL V1.1 FUNCTIONAL BASELINE FREEZE

```text
NATALNODE VISUAL V1.1 FUNCTIONAL BASELINE = APPROVED
MODE = FUNCTIONAL BASELINE; DECORATIVE POLISH DEFERRED
```

This is an approval of the current functional visual direction, not an
authorization for continued page-by-page decorative refinement. Future product
work may add or restructure modules, so visual changes during active product
development are limited to material usability, accessibility, responsive,
trust, or hierarchy needs caused by real functionality.

### 19.1 Approved page-family direction

| Page family | Approved V1.1 direction |
| --- | --- |
| Observatory | Task-first; scientific/instrument surfaces; Temporal Ambient; the real chart is the primary celestial visual; no decorative large planet or background art. |
| Editorial | Content-first; open composition; restrained brand atmosphere; Learn may use the approved half-planet brand art; Tools use Editorial Utility treatment without copying the Learn hero. |

### 19.2 Manual approvals recorded

Manual visual review has approved these surfaces only:

- Calculate V1.1;
- Chart Workspace ambient propagation;
- Vault visual foundation;
- Learn Editorial Hero;
- Tools Hub; and
- Individual Tool pages.

This approval does not extend to unreviewed future pages or future product
modules.

### 19.3 Frozen anti-patterns

Do not propagate or reintroduce:

- the Calculate micro-grid globally;
- the Learn half-planet hero globally;
- detached celestial orbit backgrounds;
- HUD decoration across Editorial pages;
- visual telemetry without real data;
- decorative planets behind the real Chart Workspace; or
- repeated page-by-page visual carving during active feature development.

### 19.4 Active-development visual policy

New functional modules should first reuse the existing V1.1 primitives and
boundaries:

- typography;
- spacing;
- surfaces;
- buttons;
- fields;
- notices;
- badges and status treatments;
- Editorial and Observatory mode boundaries; and
- responsive and accessibility primitives.

Feature work must not create a new visual vocabulary for each module. Narrow
visual changes are authorized only when required for usability,
accessibility, responsive layout, trust/provenance clarity, new functional
hierarchy, or a confirmed manual-review regression. Aesthetic polishing alone
is not sufficient justification during active product development.

## 20. DEFERRED FINAL VISUAL CARVING / BRAND POLISH

`FINAL VISUAL CARVING / BRAND POLISH` is a future dedicated phase. It is not
scheduled or implemented by this freeze. When explicitly authorized later, it
may include:

- spacing refinement;
- micro-interactions;
- final card and surface calibration;
- icon consistency;
- final image crops;
- typography tuning;
- final visual hierarchy review; and
- final animation decisions, if justified.

## 21. PERFORMANCE IMPLEMENTATION RULE

Prefer CSS, static SVG, optimized raster assets, and Astro-rendered HTML.
Avoid WebGL, Three.js, canvas visual effects, video backgrounds, particle
systems, and heavy runtime animation by default. A future product requirement
must materially justify any exception.

## 22. BRAND ART, DATA, AND ATMOSPHERE DISTINCTION

These categories remain separate and must not be substituted for one another:

| Category | Example | Role |
| --- | --- | --- |
| Brand art | Learn half-planet hero | Approved editorial identity cue; route-scoped. |
| Scientific data visualization | Canonical Natal Chart | Truthful representation of Engine-backed chart facts. |
| Decorative atmosphere | Temporal Ambient and subtle gradients | Restrained depth behind content; never a substitute for data. |

## 23. ADS AND MONETIZATION BOUNDARY

The following surfaces remain ad-free:

- Calculate;
- Birth Input;
- Chart Workspace;
- Interpretation;
- Calculation Details;
- Vault; and
- Auth.

Learn and educational Tools remain future ad-eligible surfaces only under a
separate authorization. No ads are implemented by this freeze, and advertising
must never obscure core actions, trust information, or chart data.

## 24. ROADMAP AND RELEASE GUARDRAILS

Product UX Calibration V1.1 is substantially complete at this baseline. The
next major roadmap work is not additional visual reconstruction. Scientific
Core / Engine completion remains the separate active dependency track, while
Community and Practitioner implementation remain governed by the accepted
roadmap phase order.

`WEB DEPLOYMENT TRACK = PAUSED` remains unchanged. Production astronomy
remains externally gated and `PROVIDER DECISION DEFERRED` remains authoritative.
