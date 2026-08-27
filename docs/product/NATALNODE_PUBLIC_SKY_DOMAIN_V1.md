# NatalNode Public Sky Domain V1

- Status: **APPROVED PRODUCT / DOMAIN DIRECTION**
- Runtime status: **RUNTIME IMPLEMENTATION DEFERRED**
- Task: `WEB-SKY-001A`
- Date: 2026-08-27
- Product source of truth: `docs/PRD.md`
- Extends: `docs/ARCHITECTURE.md`, Visual V1.1, Astrological Semantic Layer V1, and the accepted product roadmap
- Runtime changes authorized by this document: **ZERO**

## 1. Purpose, authority, and scope

This document freezes the product and domain direction for a future public
Sky surface on NatalNode.com. It defines durable concepts, ownership,
scientific and interpretive boundaries, homepage direction, route
reservations, privacy and caching rules, and the sequence of later bounded
tasks. It is a governance freeze, not a runtime specification, API payload,
provider selection, visual implementation, or authorization to build Sky.

`docs/PRD.md` remains the website product source of truth. The accepted
website architecture, ADRs, Visual V1.1, Astrological Semantic Layer V1, and
roadmap remain authoritative in their respective scopes. This document MUST
be read as an additive domain decision and MUST NOT be used to override those
sources. If a future implementation choice conflicts with them, that choice
requires a separately scoped architecture decision.

Production scientific truth remains owned by the NatalNode Engine track. The
fixed system boundary remains:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
→ scientific core
```

The Web repository MUST NOT implement astronomy, access an astronomy provider
directly, or infer scientific facts that the Engine contract does not supply.

## 2. Frozen domain language

NatalNode has three distinct but related product domains:

| Domain | Frozen definition | Personal data required |
| --- | --- | --- |
| **NATAL** | The sky at a user's birth, resolved under an explicit birth-time, location, and calculation configuration. | Yes. Birth data is sensitive personal data. |
| **SKY** | The shared sky at a specified instant or over a specified interval. Initial Public Sky is not personalized and is location-independent. | No. |
| **TRANSITS** | Relationships between Sky facts and Natal facts. | Yes, because Natal facts are involved. |

The relationship is frozen as:

```text
SKY + NATAL → TRANSITS
```

Public Sky interpretation describes shared Sky facts and events. Personal
transit interpretation describes relationships between those Sky facts and a
particular Natal chart. These are distinct interpretive products and MUST NOT
be conflated. Public Sky MUST NOT imply that a shared event is personally
significant to a visitor. Personal transit interpretation is future scope.

## 3. One continuous Public Sky domain

Public Sky is one continuous temporal domain. Its two governing conceptual
queries are:

```text
SkySnapshot(t)
SkyEvents(start, end)
```

`SkySnapshot(t)` represents supported Sky facts at one instant.
`SkyEvents(start, end)` represents supported events within an interval. A
daily, weekly, monthly, quarterly, half-year, or annual user experience is a
view over those same concepts, not a separate scientific domain or Engine.

The following abstractions are explicitly prohibited:

- `WeeklyChartEngine`
- `MonthlyChartEngine`
- `QuarterlyChartEngine`
- `AnnualChartEngine`

Equivalent period-specific scientific engines, duplicated period contracts,
or Web-side calculation modules are also prohibited. Calendar and UI ranges
MUST be expressed as presentation windows over the continuous Sky domain.

## 4. Initial scientific frame

Initial Public Sky is frozen to this frame:

| Dimension | Initial decision |
| --- | --- |
| Origin / reference frame | Geocentric |
| Zodiac model | Tropical |
| Time | Explicitly timestamped in UTC |
| Location | Location-independent |
| Houses | Not included |
| Angles | No ASC, MC, or other location-derived angles |

The surface MUST label the timestamp and configuration/frame clearly. It MUST
NOT request or infer a visitor location for the initial frame. Houses, ASC,
MC, house cusps, and other location-derived angles MUST NOT appear in initial
Public Sky facts or geometry.

A future topocentric or location-specific Sky view would be a separately
governed treatment. It MUST require an explicit location, MUST identify its
reference frame, and MUST NOT silently replace or contaminate the initial
location-independent geocentric view.

## 5. Initial body set

The initial Public Sky body set is exactly:

1. Sun
2. Moon
3. Mercury
4. Venus
5. Mars
6. Jupiter
7. Saturn
8. Uranus
9. Neptune
10. Pluto

The Nodes, Chiron, asteroids, fixed stars, hypothetical points, and any other
bodies or points are deferred. A fixture, design, editorial surface, or
future implementation MUST NOT imply support for a deferred body. Expanding
the set requires a later explicit contract and product decision.

## 6. Provider-neutral `SkySnapshot` concept

`SkySnapshot` is a conceptual domain shape, not a TypeScript interface, JSON
schema, endpoint payload, or provider mapping. A future frozen contract SHOULD
represent these provider-neutral concepts:

| Concept | Governance requirement |
| --- | --- |
| `atUtc` | The exact UTC instant represented by the snapshot. |
| Calculation/configuration metadata | Opaque Engine and scientific-configuration identity sufficient for truth, compatibility, and cache invalidation. |
| Zodiac model | The model used, initially tropical. |
| Reference frame/origin | The frame and origin where relevant, initially geocentric. |
| Body positions | Authoritative positions for the supported body set. |
| Motion state | Engine-supplied motion state where supported, such as direct, retrograde, or station state. |
| Supported aspects | Only Engine-supplied, contract-supported aspect facts. |
| Warnings | Scientific limitations, incomplete states, and other Engine warnings. |
| Provenance | Truthful Engine provenance identity or an explicit unavailable/research state. |

The future contract MUST remain provider-neutral. It MUST NOT expose provider
IDs, provider algorithms, dataset-specific structures, kernel identities,
provider-specific error semantics, or Web behavior coupled to a provider.
Scientific configuration and provenance identities MAY be represented as
opaque contract values, consistent with the PRD, but the Web MUST NOT decode
them into provider assumptions.

## 7. `SkyEvent` taxonomy and conceptual fields

The initial Public Sky event taxonomy is exactly:

| Event type | Domain meaning |
| --- | --- |
| `INGRESS` | A supported body crosses a supported zodiac boundary. |
| `STATION` | A supported body's Engine-defined motion state reaches a supported station event. |
| `EXACT_MAJOR_ASPECT` | A supported major aspect between supported bodies reaches exactness. |
| `LUNATION` | A supported New Moon or Full Moon event. |
| `LUNAR_PHASE` | A supported lunar phase event or phase transition distinct from the narrower lunation category. |
| `ECLIPSE` | An Engine-supported eclipse event. |

No additional event family is implied by this freeze. A future event contract
SHOULD be able to represent:

- event type;
- actors or bodies;
- active-window start and end, when scientifically meaningful and supplied;
- `exactAt`;
- orb, when supplied;
- applying or separating state, when supplied;
- motion state;
- zodiac transition;
- configuration and provenance identity; and
- warnings.

These are conceptual fields only. Optionality, units, schemas, versioning,
error semantics, and exact scientific ownership require the later contract
freeze. The Engine owns the scientific determination of events, exactness,
orbs, applying/separating state, motion, transitions, and active windows. Web
and BFF code MUST NOT derive, interpolate, predict, or repair them.

## 8. Natural cycles and human-selected windows

Natural cycles and UI windows are different concepts and MUST remain visibly
and architecturally separate.

| Category | Non-equivalent examples |
| --- | --- |
| Natural cycles or phenomena | Lunar phase; lunation; solar zodiac passage; station / retrograde cycle; synodic cycle; long-term planetary cycle; eclipse seasons, when Engine-supported. |
| Human-selected UI windows | `7d`; `30d`; `3m`; `6m`; `1y`; another calendar or custom range. |

The categories are independent, and the examples are not row mappings.
`7d`, `30d`, `3m`, `6m`, and `1y` are convenient viewing intervals, not
intrinsic celestial cycles, and MUST NOT be labeled, modeled, or marketed as
though they were.

Recommended user timescales are:

```text
NOW / 7D / 30D / 3M / 1Y
```

Possible future natural views are:

```text
LUNAR / LUNATION / PLANETARY / LONG CYCLES
```

These labels communicate domain intent only. This document does not freeze
tab names, control labels, URL parameters, or navigation design, and does not
authorize tabs.

## 9. Astrological event salience

**ASTROLOGICAL EVENT SALIENCE IS NOT SCIENTIFIC IMPORTANCE.**

Salience is a transparent product/editorial decision about which valid Engine
events are most useful to foreground in a constrained surface. It MUST NOT be
presented as an empirical law, scientific ranking, probability, confidence,
astronomical importance, or universal personal significance.

Allowed initial display categories are:

| Category | Intended use |
| --- | --- |
| `MAJOR` | A limited set of valid events selected for the strongest product prominence. |
| `NOTABLE` | Valid events worth surfacing without the highest prominence. |
| `FAST-MOVING` | Valid events whose cadence or short duration requires distinct presentation treatment. |

NatalNode MUST NOT show a fake numeric salience score such as `92/100`.
NatalNode MUST NOT claim scientifically established weights, and this freeze
defines no numeric weights.

Candidate product/editorial factors MAY include:

- event family;
- bodies involved;
- speed or duration;
- exactness;
- station state;
- ingress significance under an explicitly adopted editorial convention;
- lunation or eclipse status;
- repeat passes; and
- active-window duration.

Selection rules MUST remain inspectable and explainable. They MUST operate
only over authoritative Engine events. They MUST NOT create an event, alter an
exact time, convert a non-event into an event, or imply a personal transit.

## 10. Epistemic mapping and claim integrity

Public Sky MUST preserve the Astrological Semantic Layer V1 distinctions and
the science/astrology boundary.

| Output or state | Required mapping |
| --- | --- |
| Sky position | `CALCULATED` |
| Exact event | `CALCULATED` or `ENGINE-DERIVED`, according to actual ownership frozen in the future Engine contract |
| Salience | `EDITORIAL / PRODUCT SELECTION`; this is selection provenance, not a scientific fact status or a replacement for the approved epistemic set |
| Astrological meaning | `INTERPRETED` |
| Unavailable information | `UNKNOWN` |
| Experimental or incomplete material | `RESEARCH` |

The Web MUST NOT guess whether an exact event is `CALCULATED` or
`ENGINE-DERIVED`; the future contract MUST make actual ownership clear. Where
a deterministic relation is contractually classified as derived, it remains
an Engine-owned derivation for Public Sky, not permission for Web astronomy.

Accurate current positions do not prove an astrological interpretation.
Precise facts and honest astrology are both required. Interpretation MUST be
qualified, MUST cite or remain traceable to the facts it interprets, and MUST
NOT turn astronomical precision into science-washing, certainty theater, or
personal claims.

## 11. Homepage product principle

The homepage direction is:

> **Category recognition before personal calculation.**

A visitor SHOULD recognize NatalNode as an astrology and natal-chart product
through authentic Sky geometry, planetary notation, real facts, and restrained
astrological language before being asked to complete the full personal
calculation flow. Public Sky is a real product surface, not decorative
wallpaper or a disguised input funnel.

The existing Natal product remains primary or co-primary. Public Sky is
additive and MUST NOT displace, demote, or redefine the core Natal product by
default. The recommended homepage framing is:

```text
YOUR SKY AT BIRTH
+
THE SKY NOW
```

Public Sky MUST never fabricate personal facts. Without an actual Natal
calculation, the homepage MUST NOT show a natal placement, house, ASC, MC,
personal transit, personal meaning, or language such as “your current
transit.”

## 12. Future homepage desktop direction

The desktop concept has two product zones:

| Zone | Direction |
| --- | --- |
| `YOUR NATAL CHART` | Preserve the existing Birth Input as the action for personal calculation. |
| `CURRENT SKY` | A visually strong, truthful preview of the shared current Sky. |

The future `CURRENT SKY` zone SHOULD contain:

- one real current zodiac wheel;
- a visible timestamp;
- a clear configuration and frame label;
- planetary notation for supported bodies;
- lunar phase;
- restrained supported major aspects; and
- a future path to the full Sky surface once that destination exists.

This direction does not authorize a homepage redesign now. It does not freeze
grid proportions, component hierarchy, copy, controls, or implementation
technology.

## 13. Future homepage mobile sequence

The mobile information sequence is frozen conceptually as:

1. H1 and product identity.
2. Compact Current Sky preview.
3. A very small set of high-value Sky facts or events.
4. Birth Input.

The mobile homepage MUST NOT force a visitor through the complete Birth Input
before showing a truthful astrology signal. Birth Input remains the personal
calculation action and MUST remain easy to reach.

The concept MUST support a 320 CSS px viewport without page-level horizontal
scrolling, in alignment with Visual V1.1. Exact layout, breakpoints, component
behavior, and responsive implementation are deferred.

## 14. Authentic Current Sky geometry

The Current Sky visual MUST be authentic chart geometry based on Engine facts:

- zodiac ring;
- supported body placements; and
- restrained supported aspect relationships.

It MUST NOT include houses, house cusps, ASC, MC, or other
location-dependent angles. It MUST NOT display a fabricated Natal chart,
randomized geometry, generic space wallpaper presented as data, or decorative
marks that resemble unsupported facts.

This freeze does not authorize or prescribe an SVG implementation, final
geometry, renderer architecture, interaction model, animation, or visual
asset. It reserves the truthful semantic geometry only.

## 15. Homepage event selection

`NEXT IN THE SKY` is the working product concept for a restrained upcoming
event preview. The surface SHOULD normally show no more than two or three
qualifying events, but this is not a fixed quota or promised count.

- If only one event qualifies, show one.
- If no event qualifies under the transparent selection rules, showing none
  is preferable to filler.
- The surface MUST NOT invent, duplicate, or promote low-value events merely
  to fill a layout.
- Every displayed event MUST remain traceable to an authoritative Engine
  event and its true time/configuration context.

Exact section naming, count, layout, and editorial copy remain deferred.

## 16. Lunar phase and longer cycles

Lunar phase is suitable for Public Sky because it is observable, continuous,
a natural rhythm, and does not require birth data. A later implementation MAY
show the current phase, time to the next phase, and the next phase only when
those values are authoritative Engine values. The Web MUST NOT calculate,
estimate, round into existence, or independently schedule them.

Longer cycles belong mainly on the future full Sky surface, including:

- stations and retrogrades;
- slow ingresses;
- slow-planet aspects; and
- eclipses, when supported.

The homepage MAY show a longer-cycle event only when it qualifies under the
transparent salience policy. It MUST NOT create permanent per-planet blocks
or imply that every planet always needs homepage content.

## 17. Reserved full Sky surface and route governance

`/sky` is reserved for a future full Public Sky surface. It is not implemented
or authorized by this document. Its future responsibilities are:

- Sky Now;
- event timeline;
- human-selected time windows;
- natural-cycle filters or views;
- event details; and
- long-cycle visibility.

The following separate route families are explicitly prohibited:

- `/sky/daily`
- `/sky/weekly`
- `/sky/monthly`
- `/sky/half-year`
- `/sky/yearly`

Aliases or equivalent route proliferation by period are also prohibited.
Time windows belong within one `/sky` domain surface and route model. Event or
educational detail routes, if ever justified, require a later SEO/content and
route decision; they are not approved here.

No runtime navigation change is authorized. `SKY` MAY become a first-level
navigation item only when `/sky` exists as a useful implemented destination.
The current site MUST NOT expose a dead link or placeholder navigation item.

## 18. Future Transits boundary

Future personal transits are conceptually:

```text
transiting Sky facts × Natal facts → personal transit relationships
```

The Engine contract MUST own the scientific relationship facts and their
scientific metadata. Interpretation of those relationships is a distinct,
qualified personal-astrology layer. Public Sky content MUST NOT be reused as
though it were a personal transit result.

A possible future CTA is:

> See how the current sky interacts with your natal chart.

This wording is a product direction, not approved runtime copy. This document
authorizes no transit route, calculation, contract, persistence, CTA,
interpretation, or UI implementation.

## 19. Authentication, retention, and future personal value

Public Sky MUST be useful without authentication and MUST never be
login-gated. The ability to inspect the shared current Sky or public event
timeline MUST NOT depend on an account, saved Natal chart, subscription, or
birth-data submission.

Future saved Natal data combined with current or future Sky may create
persistent personal transit value. That future value belongs to the personal
Transit domain and requires separate authorization, privacy review, retention
semantics, authorization controls, and contract freezing. It MUST NOT be used
to justify authentication or personal tracking on Public Sky.

## 20. Ownership and trust boundary

| Owner | MUST own | MUST NOT own |
| --- | --- | --- |
| NatalNode Engine Public API | Scientific Sky facts; positions; motion; supported aspects; events; exactness and active windows where supported; scientific configuration; provenance; scientific warnings. | Website presentation order, editorial copy, authentication, or personal-product UX. |
| Website API / BFF | Engine orchestration; response validation at the boundary; public cache policy; presentation window; visibility; UX ordering support; transparent salience/display selection; editorial orchestration. | Astronomy, provider access, independent positions, aspects, stations, phases, event exactness, or scientific repair. |
| NatalNode.com UI | Presentation; accessible notation; responsive hierarchy; clear labels; transparent display of Engine facts, limitations, and interpretation. | Scientific calculation, fabricated live facts, hidden provider assumptions, or personal facts without a Natal calculation. |

The BFF MAY select which valid facts or events to expose on a constrained
surface and MAY order them according to transparent product rules. It MUST
preserve the underlying Engine values, warnings, configuration identity, and
provenance semantics required by the future contract.

There is no Web astronomy exception for convenience, latency, animation,
fallback, testing, SEO, cache fill, or provider outage.

## 21. Conceptual API direction

The only conceptual operations frozen here are:

```text
GetSkySnapshot(atUtc)
GetSkyEvents(startUtc, endUtc)
```

These names describe domain capabilities only. They are not endpoint names,
HTTP methods, RPC methods, TypeScript signatures, schemas, provider payloads,
or versioning decisions. This document deliberately specifies no endpoint,
URL, transport payload, field serialization, provider identifier, algorithm,
or storage model.

The current website contract and `EngineClient` capability are natal-chart
oriented and do not contain this Sky domain. They MUST NOT be silently widened
or overloaded. A future separately scoped extension and contract freeze is
required before runtime work. That freeze MUST preserve the existing boundary:

```text
NatalNode.com → Website API / BFF → Engine Public API
```

## 22. Caching and persistence semantics

Public Sky contains no personal data and is suitable for shared caching. The
cache policy MUST distinguish snapshots from timelines:

| Material | Direction |
| --- | --- |
| Snapshot | Short cache appropriate to a timestamped current-state view. |
| Event timeline | Longer cache appropriate to an interval whose event facts change less frequently. |
| Personal Transit | Separate personal-data policy; no public-cache assumptions. |

This freeze sets no exact TTL. Cache identity and invalidation MUST be tied to
the relevant Engine version, schema/contract version, scientific
configuration identity, and other provenance identity required by the future
contract. A stale cache MUST NOT survive a materially different scientific
configuration as if it were equivalent.

Public Sky caching is not authorization to persist a visitor profile,
location, identifier, or inferred interests. This document authorizes no new
database table, migration, browser storage, retention schedule, or analytics
event.

## 23. Privacy separation

Public Sky requests MUST NOT require or include birth date, birth time, birth
place, saved-chart identifiers, account identifiers, or other personal
identifiers as scientific inputs. Public Sky MUST remain useful without those
values.

Future Transit inherits Natal privacy because it combines shared Sky facts
with sensitive Natal facts. Personal Transit requires the same or stronger
access, retention, deletion, export, logging, and advertising boundaries as
saved Natal data.

Public Sky cache keys MUST NEVER be shared with personal Natal or Transit cache
keys. Public cached responses MUST NOT vary by or embed private Natal facts.
Personal results MUST NOT enter a public CDN, shared public cache namespace,
or anonymous Public Sky response.

## 24. SEO and explanatory content reservation

Authoritative explanatory detail for events, lunar phases, stations, and
related concepts may become a useful future editorial or SEO surface. Such
content MUST be people-first, original, useful, honest about interpretation,
and connected to authoritative facts when it describes a specific event.

This freeze authorizes no route or content generation. NatalNode MUST NOT
create thin autogenerated event pages, mass date pages, period-route farms,
or pages whose only purpose is search coverage. A later content and route
decision is required before any event-detail or educational route family.

## 25. Provider and scientific-readiness gate

PROVIDER DECISION DEFERRED.

Provider-neutral deterministic fixtures MAY support domain, contract, visual,
responsive, and interaction development in separately authorized future
tasks. Fixtures MUST be clearly and persistently labeled as deterministic
development material, including the substance of:

```text
UI DEVELOPMENT ONLY
NOT SCIENTIFIC EVIDENCE
NOT PRODUCTION ASTRONOMY
```

Fixtures MUST NOT claim to be the live sky, current production positions,
production-validated events, or commercially cleared science. A timestamp in
a fixture MUST NOT make it “live.”

Production Public Sky requires an approved production Engine, production
scientific configuration and provenance readiness, a frozen Web/Engine Sky
contract, boundary validation, and the applicable PRD release gates. There is
no fake-live-sky production mode and no silent fallback from an unavailable
production Engine to deterministic fixture data.

## 26. Visual and semantic continuity

Public Sky MUST preserve Visual V1.1, Astrological Semantic Layer V1, and the
**MODERN OBSERVATORY ASTROLOGY** direction. Category recognition comes from
authentic geometry, planetary and zodiac notation, supported aspects,
explicit time/configuration, and honest meaning states.

Public Sky MUST reject:

- purple/gold occult styling;
- generic space or constellation wallpaper used as product meaning;
- fake charts or randomized chart-like geometry;
- glyph-only symbol soup;
- decorative mysticism without product meaning;
- fake telemetry or precision; and
- atmosphere that competes with facts or accessibility.

The system MUST use human-readable labels with symbols and structured values
where notation is shown. Accurate facts, uncertainty, research status, and
interpretation MUST remain distinguishable. This document does not reopen
Visual V1.1, prescribe final art direction, or authorize SVG, image, font,
glyph-library, motion, or renderer work.

## 27. Phased delivery, not automatic implementation

This direction is sequenced through separately scoped tasks:

| Phase | Scope | Current authorization |
| --- | --- | --- |
| `SKY-001B` | Website Sky contracts/BFF boundary plus deterministic fixtures | Deferred; requires separate scope and contract freeze. |
| `SKY-001C` | Isolated Current Sky visualization | Deferred; requires authoritative contract or clearly labeled fixtures. |
| `SKY-001D` | Homepage Current Sky preview | Deferred; no homepage redesign is authorized now. |
| `SKY-002` | `/sky` Observatory MVP | Deferred; route, navigation, event timeline, windows, filters, and details require separate authorization. |
| `TRANSIT-001A` | Personal Transit contract freeze | Deferred; must preserve Natal privacy and the Sky/Natal boundary. |

Completion of one phase does not automatically authorize the next. Each phase
MUST preserve the provider-neutral Engine boundary, validate the affected
trust boundary, and report its exact runtime and data scope.

## 28. Explicit non-authorizations

Runtime changes are **ZERO** for `WEB-SKY-001A`.

This document authorizes no current change to:

- application code;
- server or BFF code;
- packages or contracts;
- `EngineClient`;
- API endpoints or payloads;
- database schemas, migrations, persistence, or retention;
- authentication or authorization;
- current routes or navigation;
- homepage runtime or layout;
- chart renderers or SVG;
- styles, images, fonts, glyph assets, or manifests;
- dependencies, package manifests, or lockfiles;
- deployment or environment configuration; or
- production Engine/provider configuration.

No current app, server, package, database, manifest, or lockfile
implementation is authorized. This document MUST NOT be cited as permission
to begin a phase listed in Section 27.

## 29. Review and acceptance checklist

A future Public Sky proposal or patch is acceptable only when every applicable
item below is satisfied.

### Domain and time

- [ ] It models Public Sky as one continuous domain using snapshot and event
  interval concepts.
- [ ] It does not create period-specific Engines, contracts, or duplicated
  astronomy modules.
- [ ] It distinguishes natural cycles from human-selected `7d`, `30d`, `3m`,
  `6m`, and `1y` windows.
- [ ] It does not claim that a UI window is an intrinsic celestial cycle.

### Scientific truth and provider gate

- [ ] All positions, motion, aspects, phases, events, exactness, windows,
  warnings, configuration, and provenance come from the approved Engine
  contract.
- [ ] No Web, BFF, renderer, SEO, or fixture code duplicates astronomy.
- [ ] No salience language implies scientific importance, probability,
  confidence, or scientifically established weights.
- [ ] No fake numeric salience score is present.
- [ ] No deterministic fixture is presented as live or production Sky.
- [ ] The production provider decision remains deferred until separately
  approved, and no provider-specific payload or behavior leaks into Web.
- [ ] Research or unavailable scientific identity is explicit; no fake IDs or
  claims are generated.

### Frame, geometry, and body scope

- [ ] Initial Public Sky is geocentric, tropical, timestamped, and
  location-independent.
- [ ] Houses, ASC, MC, house cusps, and other location-dependent angles are
  absent.
- [ ] A future topocentric/location view, if proposed, requires explicit
  location and separate governance.
- [ ] Only the ten frozen initial bodies are implied as supported.
- [ ] Displayed geometry is authentic and traceable to Engine facts; it is not
  wallpaper, random, or a fabricated Natal chart.

### Product, auth, privacy, and Transit

- [ ] Public Sky is useful unauthenticated and is not login-gated.
- [ ] Public Sky requests and cache keys contain no birth data or personal
  identifiers.
- [ ] Public Sky and personal Natal/Transit cache namespaces remain separate.
- [ ] The surface does not fabricate or imply personal facts.
- [ ] No personal transit relationship, interpretation, CTA, persistence, or
  route is implemented under Public Sky authorization.
- [ ] Any future Transit proposal treats `Sky × Natal` as a separate personal
  contract and inherits Natal privacy.

### Routes, content, and runtime scope

- [ ] `/sky` is introduced only as one useful domain surface after separate
  authorization.
- [ ] No daily, weekly, monthly, half-year, or yearly Sky route family is
  introduced.
- [ ] Navigation contains no dead `SKY` link.
- [ ] No thin autogenerated event/date pages or period-route proliferation is
  introduced.
- [ ] Runtime changes are limited to the separately authorized phase and do
  not cite this document as implementation permission.
- [ ] Visual V1.1 and the Astrological Semantic Layer remain preserved.

## 30. Frozen conclusion

```text
NATAL = SKY AT USER BIRTH
SKY = SHARED SKY AT A TIME OR INTERVAL
SKY + NATAL = TRANSITS

PUBLIC SKY DOMAIN DIRECTION = APPROVED
PUBLIC SKY RUNTIME IMPLEMENTATION = DEFERRED
PRODUCTION SCIENTIFIC TRUTH = ENGINE TRACK
WEB ASTRONOMY = PROHIBITED
```

Public Sky is an additive, unauthenticated, provider-neutral NatalNode product
surface. It gives visitors truthful category recognition and a coherent view
of the shared Sky without inventing personal facts or fragmenting time into
separate Engines and routes. Runtime work begins only through the later
bounded phases and only after their own contract, provider, privacy, and
release gates are satisfied.
