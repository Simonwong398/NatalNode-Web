# NatalNode Web Product Architecture V2

Status: architecture baseline for `WEB-P1-ARCH-001`

Source of truth: [`docs/PRD.md`](../PRD.md)
Scope: NatalNode Web only

## 1. Architecture status

The target architecture is frozen for the current product runway:

```text
TARGET ARCHITECTURE = FROZEN
PHYSICAL MIGRATION = INCREMENTAL
```

This document is the Web product architecture ledger. It records the logical
boundaries that P1 and later work must follow, the physically normalized areas
that are already justified, and the deliberately deferred work. It does not
authorize a repository-wide rewrite or a new product feature.

The NatalNode Web P0 foundation remains frozen. The external P0 release gate is
still separate from this architecture campaign because scientific, provider,
and external production gates remain open. The provider status remains:

```text
PROVIDER DECISION DEFERRED
```

## 2. Repository and system context

The Web repository is `C:\NatalNode-Web`. The Engine repository is outside this
repository and outside this campaign. The immutable system direction is:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
    -> production scientific facts
```

The browser talks to same-origin Web/BFF boundaries. Web code may consume
contract-defined, Engine-supplied facts and may present curated editorial
content, taxonomy, and notation. Web code must not calculate astronomy or call a
provider directly.

## 3. Current architecture findings

The repository audit covered the PRD, architecture and product documents,
workspace configuration, current frontend sources and imports, Learn and
Foundations content, ChartRenderer consumers, Public Sky, Calculate/natal result
composition, localization, BFF routes, server modules, executable maintenance
operations, and targeted test harnesses.

### KEEP

- Existing Astro routes/pages, layouts, navigation, theme behavior, and visual
  system.
- Stable product features: Learn, chart input/experience/workspace,
  calculation details, Public Sky, Vault, Community, Practitioner, Account/Auth,
  Feedback, Notifications, and localization mechanics.
- `src/content/learn/` and the existing Foundations registry, lesson identity,
  progress, assessment, reward, and locale policy.
- Existing packages for contracts, Engine clients, and development fixtures.
- The current `server/src/app/routes/` BFF composition and its product,
  persistence, runtime, observability, security, and executable modules.
- Existing P0 behavior, including chart result disclosure, expanded chart
  geometry, Public Sky fixture authority, auth, Vault policy, and the dynamic
  brand instrument.

### NORMALIZE NOW

- Chart Instrument ownership: the reusable `ChartRenderer`, chart geometry,
  presentation policy, and chart UI formatting were consumed across multiple
  features while physically living under individual feature directories.
- Astrology taxonomy ownership: stable chart classifications and the shared
  glossary/glyph presentation boundary were distributed between `lib`, a
  component directory, and Interpretation.
- Import and characterization-test paths needed to follow those two ownership
  corrections without changing runtime behavior.

### DEFER

- A mass move of generic `components/` and mixed `lib/` contents into a new
  `shared/` tree.
- Renaming the current chart composition features into a new `calculate/`
  directory. Calculate is a product capability, but its existing physical
  composition is stable and a rename would create broad import churn.
- Separating all existing feature-to-feature orchestration, including the
  current chart experience/workspace/input composition and workspace-owned P0
  panels. These relationships are recorded as migration debt and should be
  addressed only by a bounded product slice that preserves behavior.
- A mass editorial/content migration beyond the existing Learn boundary.
- Physical BFF reorganization, new jobs packages, scheduler/queue work, and
  future product directories.

### DO NOT MOVE

- Auth, Google auth, magic link, Vault, Community, Practitioner, Feedback,
  Privacy Access Audit, Notifications, observability, rate limiting, runtime,
  migrations, or stable P0 server modules.
- Engine packages, scientific contracts, provider boundaries, or anything in
  `C:\NatalNode`.
- Learn lesson content or semantics merely to make the tree look uniform.

## 4. CURRENT PHYSICAL STATE

The following is the relevant physical state after the bounded normalization in
this campaign. It is an inventory, not a claim that every conceptual target
directory already exists.

```text
apps/web/src/
├── components/                         # Astro shell, brand, layout, UI pieces
├── core/
│   ├── astrology-taxonomy/              # Web taxonomy, glossary, glyph boundary
│   └── chart/                           # Chart Instrument and chart presentation
├── features/
│   ├── account/
│   ├── auth/
│   ├── calculation-details/
│   ├── chart-experience/                # Current Calculate composition boundary
│   ├── chart-input/
│   ├── chart-workspace/
│   ├── community/
│   ├── feedback/
│   ├── interpretation/                  # Curated Class C interpretation content
│   ├── learn/                           # Learn and Foundations product UX
│   ├── localization/
│   ├── notifications/
│   ├── practitioner/
│   ├── public-sky/
│   └── vault/
├── content/
│   └── learn/                           # Existing editorial content source
├── lib/                                 # Existing mixed utility/catalog boundary
├── pages/                               # Astro routes and page composition
└── styles/

packages/
├── contracts/
├── engine-client/
└── test-fixtures/

server/src/
├── app/routes/                          # Website API / BFF route boundary
├── account/, auth-runtime/, community/  # Product modules
├── learning/, notification-platform/    # Product modules
├── practitioner/, commercial-persistence/
├── persistence/ and db/                 # Storage and transaction boundaries
├── runtime/                             # Process, environment, HTTP, DB runtime
└── executable/                          # One-shot and local executable entrypoints
```

There are no physical `features/chart-renderer/` or `components/astrology/`
directories after this normalization. There are also no empty speculative
directories for Discover, Share, Personal Sky, Transits, Synastry, Weekly Sky
Brief, Journal, reports, or future AI.

## 5. TARGET LOGICAL STATE

The logical target is independent of the current directory names. The intended
browser product shape is:

```text
Browser Product
├── Routes / Pages
├── Product Features
│   ├── Learn
│   ├── Discover                         # future; create when implemented
│   ├── Calculate                         # current physical composition is split
│   ├── Public Sky
│   ├── Vault
│   ├── Share                             # future
│   ├── Community
│   ├── Practitioner
│   ├── Account / Auth
│   └── Personal Sky                      # future
├── Product Core
│   ├── Chart Instrument
│   ├── Astrology Taxonomy
│   ├── NatalNode-specific presentation semantics
│   └── genuinely cross-domain localization mechanics
├── Shared
│   ├── generic UI
│   ├── generic hooks
│   ├── generic utilities
│   └── generic types
└── Content
    ├── Learn
    ├── Discover                       # future editorial boundary
    ├── Legal
    └── other localized editorial content

Website API / BFF
├── Product Modules
└── Infrastructure Adapters

Future Scheduled Jobs
└── External Scheduler -> one-shot executable -> product services -> adapters

Engine Boundary
└── Engine Public API -> scientific authority
```

The logical arrow `A -> B` means that A may depend on B. This target must not be
implemented by creating empty folders. A future feature receives a physical
boundary when its own implementation campaign begins.

## 6. Product Features

A feature answers: “What product capability is the user using?” Feature code
may own feature-specific components, interaction state, workflows, policies,
orchestration, adapters, and view models.

Learn owns teaching and course UX. Public Sky owns its supplied-snapshot
experience. Calculate owns the birth-input and chart-result workflow, even
though the current physical implementation is represented by the established
chart input, chart experience, and chart workspace modules. Vault, Community,
Practitioner, Account/Auth, Feedback, and Notifications retain their existing
P0/P1 boundaries.

A feature must not own reusable NatalNode chart rendering or stable chart
taxonomy simply because it was the first consumer.

## 7. Product Core

Core answers: “What NatalNode-specific capability is shared by multiple product
features?” Core is product-domain-aware but feature-independent.

Core may own the Chart Instrument, chart geometry, chart symbol presentation,
chart presentation modes/policies, stable chart-specific presentation types,
the Web astrology taxonomy, and other genuinely shared NatalNode presentation
semantics. Core must not know that Learn, Discover, Calculate, Vault, or Personal
Sky exists.

Core must not own Learn copy, lesson links, account behavior, Vault behavior,
Community behavior, or scientific calculation.

## 8. Shared

Shared is for capabilities that are generic and not fundamentally NatalNode
business logic: generic UI primitives, generic hooks, generic utilities, and
generic types. Existing `components/` and `lib/` are not treated as permission
to dump business logic into Shared. Their mixed contents remain a documented
incremental migration area.

The existing `@/*` TypeScript/Astro alias is sufficient and remains unchanged.
No broad alias migration or new alias family is required by this baseline.

## 9. Content and localization

Feature code is interaction, workflow, and presentation orchestration. Content
is editorial/localized material. Learn already has a healthy `features/learn`
plus `content/learn` boundary; this campaign does not rewrite Foundations or
mass-migrate content.

The seven admitted runtime locales remain exactly:

```text
en, es, fr, de, ja, ko, zh-Hant
```

English remains the default. Existing `zh-Hant` mapping rules are preserved.
No `zh-Hans` runtime locale is introduced. The glossary is Product Core because
it supplies stable NatalNode terminology and notation; localized editorial
lesson content remains owned by Learn/content.

## 10. Dependency direction

The frozen conceptual direction is:

```text
shared
  ↑
core
  ↑
features
  ↑
routes / pages
```

Allowed dependency relationships:

- feature -> core;
- feature -> shared;
- core -> shared;
- route/page -> feature;
- route/page -> core only when page composition genuinely requires it.

Forbidden dependency relationships:

- core -> feature;
- shared -> core;
- shared -> feature;
- feature A -> feature B's internal implementation.

The current repository still contains bounded historical feature orchestration,
for example chart experience composing chart input/workspace and chart
workspace composing P0 result panels. Those are known exceptions in the
physical state, not additions to the target rule. Future changes must either
compose through an explicit feature boundary or extract a genuinely shared
capability into Core/Shared. Do not create abstractions solely to satisfy the
diagram.

## 11. Chart Instrument ownership

`apps/web/src/core/chart/` is the physical owner of the reusable Chart
Instrument capability:

- `ChartRenderer.tsx` owns the existing chart rendering and interaction
  behavior;
- `geometry.ts` owns its chart geometry helpers;
- `chart-presentation-policy.ts` owns presentation-mode policy;
- `chart-ui.ts` owns chart-specific display formatting;
- `index.ts` remains the focused public entry for the renderer.

The current consumers are natal chart/Calculate, Public Sky, and the workspace
result experience. The capability is prepared for future Learn Educational
Chart, Personal Sky, and transit visualization consumers without implementing
any of those features now.

The presentation dimension may support `embedded`, `workspace`, `expanded`, and
`showcase`. A future Learn campaign may add an orthogonal semantic focus such as
`none`, `planets`, `signs`, `houses`, or `aspects`; this campaign deliberately
does not add that speculative behavior.

Chart core consumes supplied `ChartResult`/`SkySnapshotResult` facts and
presentation metadata. It does not calculate positions, derive houses/aspects,
or import Learn.

## 12. Learn ownership

`apps/web/src/features/learn/` remains the Learn product boundary. It owns
course/lesson UX, progress UX, assessment UX, and the future Educational Chart
orchestration that will be implemented by `WEB-P1-LEARN-001`.

`apps/web/src/content/learn/` remains the editorial source boundary. Learn may
consume Chart Core and Astrology Taxonomy for teaching presentation, but Chart
Core must never import Learn, lesson copy, lesson links, assessment state, or
reward semantics.

This campaign does not alter lesson IDs, completion semantics, assessment
semantics, reward semantics, the Foundations 12x7 baseline, or localization
policy.

## 13. Astrology taxonomy ownership

`apps/web/src/core/astrology-taxonomy/` is the physical owner for stable
Web-facing astrology taxonomy and presentation notation:

- `astrology-glossary.ts` owns canonical domain terminology and resolver
  behavior;
- `astrology-glossary-production-variants.ts` owns the approved terminology
  variants used by that glossary;
- `AstrologyGlyph.tsx` owns the small shared glyph/notation adapter;
- `chart-taxonomy.ts` owns stable curated chart classifications and supported
  presentation sets.

The taxonomy includes stable curated classifications such as sign, element, and
modality relationships, zodiac sign identifiers, supported planet names,
supported major aspect names, and approved symbolic mappings. It does not
calculate anything.

Interpretation retains its Class C curated meanings and prose. Tools may use
those meanings where their current product contract requires them, but stable
classification sets are no longer owned by Interpretation. A future bounded
content/domain cleanup may separate the remaining mixed lookup content; it is
not part of this campaign.

Scientific facts such as “Moon in Gemini”, “ASC in Capricorn”, an exact aspect,
an orb, an `exactAt` timestamp, or a transit position remain Engine-supplied
facts. Taxonomy must never be used to synthesize those facts.

## 14. Science and Engine boundary

Web must never contain or own ephemeris, planetary-position, Moon, house-cusp,
astronomical-aspect, transit, or provider-specific production calculations. No
calculation, provider, networking, or Engine integration was added by this
architecture baseline.

The Web may render `ChartFacts`, `SkySnapshotResult`, and other contract-defined
supplied data; it may also present curated interpretation and taxonomy. The
Engine Public API remains the authority for dynamic astronomy. The exact status
is still:

```text
PROVIDER DECISION DEFERRED
```

## 15. Website API / BFF architecture

The current BFF is stable and was intentionally left physically in place. The
target model is:

```text
server/src/app/routes/
    -> product modules and application services
    -> persistence / infrastructure adapters
```

Current route and module areas cover chart, sky, Learn, auth, account, Vault,
feedback, community, practitioner, notifications, and related P0 security,
observability, persistence, and runtime concerns. The chart and sky routes use
the EngineClient boundary through server dependencies; they do not expose a
browser-to-Engine shortcut.

The long-term conceptual API grouping may include `auth`, `chart`, `vault`,
`learn`, `feedback`, `community`, `practitioner`, `privacy`, and future
`personal-sky`, `preferences`, and `notifications` product modules alongside
database, email, Engine-client, observability, and rate-limit infrastructure.
This is guidance, not authorization for a mass BFF migration.

## 16. Future jobs architecture

Future scheduled work follows this direction:

```text
External Scheduler
    -> one-shot executable / job
    -> Website product services
    -> Email / Engine / database adapters
```

This can cover Weekly Sky Brief, notification delivery, retention maintenance,
and existing maintenance operations where appropriate. The repository already
has executable and maintenance boundaries that can host one-shot behavior when
authorized. No `apps/jobs` package, in-process scheduler, cron library, queue,
or vendor was added. Weekly Sky Brief and notification product work remain
future tasks.

## 17. Physical migrations performed

Every move in this campaign has a concrete ownership reason: multiple current
or planned consumers, incorrect first-consumer ownership, duplicated taxonomy,
or a direct P1 runway dependency.

### Chart Instrument

The following were moved from feature-owned locations to Product Core:

- `features/chart-renderer/ChartRenderer.tsx` -> `core/chart/ChartRenderer.tsx`;
- `features/chart-renderer/geometry.ts` -> `core/chart/geometry.ts`;
- `features/chart-renderer/index.ts` -> `core/chart/index.ts`;
- `features/chart-experience/chart-ui.ts` -> `core/chart/chart-ui.ts`;
- `features/chart-workspace/chart-presentation-policy.ts` ->
  `core/chart/chart-presentation-policy.ts`.

All consumers and focused characterization harnesses were updated to the new
ownership paths. Renderer behavior, chart geometry, presentation modes, and
display strings remain unchanged.

### Astrology taxonomy

The following were moved to the coherent Product Core taxonomy boundary:

- `components/astrology/AstrologyGlyph.tsx` ->
  `core/astrology-taxonomy/AstrologyGlyph.tsx`;
- `lib/astrology-glossary.ts` ->
  `core/astrology-taxonomy/astrology-glossary.ts`;
- `lib/astrology-glossary-production-variants.ts` ->
  `core/astrology-taxonomy/astrology-glossary-production-variants.ts`.

Stable supported planet/aspect sets and sign classifications were extracted to
`core/astrology-taxonomy/chart-taxonomy.ts`. Interpretation prose remains in
`features/interpretation/interpretation-content.ts`; no scientific facts were
created or transformed.

## 18. Physical migrations deliberately deferred

- Do not create empty future feature directories. Discover, Share, Personal
  Sky, Transits, Synastry, Weekly Sky Brief, Journal, reports, and future AI
  will receive physical boundaries only when their implementation is
  authorized.
- Do not create a generic `shared/` tree without a concrete, bounded migration
  that demonstrates generic ownership and preserves imports.
- Do not mass-migrate `lib/`, components, Learn content, BFF modules, or stable
  P0 features.
- Do not move or redesign `ChartWorkspace`, chart input, Interpretation,
  CalculationDetails, Vault, or Public Sky merely to eliminate all historical
  orchestration in one batch.
- Do not add Educational Chart semantic focus, Learn content changes, or P1
  feature behavior in this campaign.

## 19. Future P1/P2 placement guidance

- `WEB-P1-LEARN-001`: implement the Educational Chart behavior inside the Learn
  feature, consuming `core/chart` and `core/astrology-taxonomy`.
- Discover: create a Discover feature and content boundary when that campaign
  starts; it may consume Core but Core must not import Discover.
- Shareable Astrology: create a Share feature when authorized; do not place
  share workflow in Chart Core.
- Personal Sky / Today and Transit experiences: create feature boundaries only
  after the Engine scientific authority is available and the product campaign
  is authorized.
- Jobs: use the external-scheduler/one-shot/service/adapter direction; do not
  introduce a scheduler into the browser or BFF process.

## 20. Architecture guardrails

The existing TypeScript alias, focused core entry point, and targeted
characterization tests provide useful low-maintenance boundaries. A new static
architecture scanner, regex-based import pseudo-linter, file-size checker, or
CI workflow was not added: that would be brittle or disproportionate to the
current repository and would produce false confidence without a maintained
import-graph mechanism.

The following invariants are therefore explicit review requirements until a
reliable existing-stack contract mechanism is justified:

- Core must not import feature internals.
- Shared utilities must not import Core or feature internals.
- Chart Core must not import Learn.
- Web must not add scientific calculation or provider modules.
- Dynamic chart and sky facts must remain contract/Engine supplied.
- `C:\NatalNode` must remain outside the Web build and runtime dependency.

Future architecture work may add a narrow Node contract test if it can parse the
actual module graph without new dependencies and without becoming a pseudo
linter. The decision is intentionally deferred here.

## 21. Correct ownership examples and anti-patterns

Correct examples:

- `core/chart/ChartRenderer.tsx` renders supplied chart facts for Calculate,
  Public Sky, and future Learn consumers.
- `features/learn/` owns lesson interaction, while `content/learn/` owns
  editorial lesson material.
- `core/astrology-taxonomy/chart-taxonomy.ts` maps a stable sign identifier to
  its curated element/modality classification.
- A route composes a feature and supplies the data/props required by that
  feature.
- A BFF route calls an EngineClient or product service rather than calculating
  astronomy in a request handler.

Anti-patterns:

- Adding `features/learn` imports to Chart Core.
- Putting Learn copy, lesson IDs, or assessment state in Chart Core.
- Calling a provider, ephemeris library, or direct Engine URL from browser
  code.
- Re-creating planet, sign, aspect, or glyph tables in each feature.
- Making one feature reach into another feature's internal components to avoid
  defining a genuine boundary.
- Creating empty future directories or a generic shared abstraction without a
  current consumer and ownership reason.
- Treating a curated taxonomy classification as a computed astronomical fact.

## 22. Behavior and change control

This architecture baseline is non-visual and non-feature work. Existing Learn,
Public Sky, natal result, expanded chart, light/dark theme, localization,
hover, and responsive behavior must remain equivalent. Any future campaign that
changes those behaviors must identify itself as a product/UI task and must not
silently hide the change inside architecture cleanup.

The next authorized product slice is `WEB-P1-LEARN-001`. It must consume this
frozen target and must not reverse the Core/Feature ownership established here.
