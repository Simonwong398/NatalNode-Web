# NatalNode Interpretation System V1

| Field | Value |
| --- | --- |
| Status | **ARCHITECTURE ADMITTED WITH CONDITIONS / FOUNDATION IMPLEMENTED** |
| Task | `WEB-P2-INTERPRETATION-001` |
| Source of truth | [`docs/PRD.md`](../PRD.md) |
| Web architecture | [`NATALNODE_WEB_PRODUCT_ARCHITECTURE_V2.md`](./NATALNODE_WEB_PRODUCT_ARCHITECTURE_V2.md) |
| Provider status | **PROVIDER DECISION DEFERRED** |
| Date | 2026-09-05 |
| Next bounded slice | `READY_FOR_WEEKLY_SIGNAL_POC` only after the conditions in this document remain true |

This document freezes the provider-neutral semantic architecture for a future
NatalNode Interpretation System. The current implementation is a small
deterministic Signal foundation: contracts, rule registration and prerequisite
gating, ranking, and conflict composition. It does not implement a Daily,
Weekly, Monthly, personal-transit, AI, route, or product surface.

Normative words in this document have their usual meanings: **MUST**, **MUST
NOT**, **SHOULD**, **SHOULD NOT**, **MAY**, **DEFERRED**, and **FROZEN**.

## 1. Scope and admission decision

The architecture is admitted with conditions because the Web has a usable
provider-neutral chart/Sky contract surface, while the production astronomy
provider, complete scientific identity chain, historical local-time authority,
and several temporal techniques remain open. The foundation is safe to build
because it consumes only explicitly supplied facts and refuses to promote
development or incomplete research inputs.

In scope:

- the four-layer Fact → Signal → Interpretation → Presentation model;
- a closed Signal vocabulary and typed provenance links;
- deterministic rule identity, registration, prerequisite checking, matching,
  and output materialization;
- deterministic internal ranking and directional composition;
- unknown-time, incomplete-research, fixture, locale, provider, cache, and
  failure semantics;
- structural contracts for future Daily, Weekly, and Monthly signal sets; and
- acceptance gates for a later product implementation.

Explicitly out of scope:

- astronomy, ephemeris, planetary positions, houses, aspects, transits, or
  timezone calculations in Web code;
- a new Engine endpoint, provider adapter, BFF route, database table, cache, or
  scheduled job;
- Daily/Weekly/Monthly UI, public horoscope pages, personal horoscope pages,
  notifications, or commercial gating;
- LLM calls, generated prose, runtime machine translation, or an AI provider;
- a compatibility score, synastry calculation, progression, solar arc, or
  return calculation; and
- any modification to `C:\NatalNode`.

## 2. System boundary and authority

The product boundary remains:

```text
NatalNode Platform
    -> NatalNode Engine
    -> NatalNode SDK / Public API
    -> NatalNode.com Website API / BFF
    -> Web presentation
```

For the current Web repository, the runtime dependency direction remains:

```text
Browser
    -> Website API / BFF
    -> EngineClient
    -> NatalNode Engine Public API
    -> AstronomyProvider
```

The browser never calls an astronomy provider or an Engine URL directly. The
Signal foundation described in this document was a bounded research POC. Its
runtime source and demo routes were retired by
`NN-WEB-FREE-BASELINE-CLEANUP-001`; this document and the research artifacts
remain historical policy evidence, not a claim that Signal code currently
ships in the website. The deterministic chart-result interpretation path
remains separate.

The existing `deterministic-interpretation.ts` remains the established current
chart-result UI interpretation path. This foundation does not silently replace
or redesign that P0/P1 presentation behavior. Future product work may adapt
supplied chart facts into this Signal contract through an explicitly reviewed
boundary.

## 3. Engine capability matrix

The matrix separates what the current contracts describe from what is safe to
use as production authority. `AVAILABLE_AUTHORITATIVE_CONTRACT` means the
Engine/Web contract has a supplied fact shape; it does not mean the production
provider or launch gate is closed. `AVAILABLE_DEVELOPMENT_ONLY` means the Web
surface is represented by a fixture or development path and is not production
scientific authority.

| Capability | Status | Evidence / condition |
| --- | --- | --- |
| Natal planetary positions | `AVAILABLE_AUTHORITATIVE_CONTRACT` | Engine `ChartResult` body results and Web `ChartResult.bodies` are supplied inputs; production provider readiness remains open. |
| Natal aspects | `AVAILABLE_AUTHORITATIVE_CONTRACT` | Engine aspect result includes body pair, type, separation, orb, limit, and phase; Web chart facts expose the bounded aspect shape. |
| Houses | `AVAILABLE_AUTHORITATIVE_CONTRACT` | Engine defines twelve house systems and supplied cusps/placements; Web consumes supplied houses only. |
| Ascendant (ASC) | `AVAILABLE_AUTHORITATIVE_CONTRACT` | Engine fundamental state and Web angle facts expose ASC as supplied data. |
| Midheaven (MC) | `AVAILABLE_AUTHORITATIVE_CONTRACT` | Engine fundamental state and Web angle facts expose MC as supplied data. |
| Transit positions | `AVAILABLE_DEVELOPMENT_ONLY` | Web `SkySnapshotResult` and the current Sky fixture have snapshot positions; the inspected Engine public chart contract has no production transit endpoint. |
| Transit-to-natal aspects | `BLOCKED_BY_ENGINE` | No authoritative Engine contract joins a Sky position to a natal chart. |
| Transit-to-natal angles | `BLOCKED_BY_ENGINE` | No authoritative Engine contract supplies this relationship. |
| Transit house placement | `BLOCKED_BY_ENGINE` | No authoritative natal-chart/time/location join is available for this technique. |
| Moon position / phase | `PARTIAL` | Moon position is in chart/Sky body contracts; phase/lunation vocabulary exists in the Web Sky contract, but a personal authoritative phase projection is not closed. |
| Applying / separating | `AVAILABLE_AUTHORITATIVE_CONTRACT` | Engine aspect phase and Web `AspectFact.phaseState` are supplied semantic fields. |
| Orb / distance | `PARTIAL` | Engine supplies separation and orb; the current Web chart contract exposes orb but not the full distance/separation pair. |
| Station / retrograde | `PARTIAL` | Engine body motion includes direct/station/retrograde; Web natal facts expose a retrograde boolean and Web Sky has a three-state development vocabulary. |
| Ingress | `AVAILABLE_DEVELOPMENT_ONLY` | Web Sky event types and fixtures include ingress-shaped events; no matching production Engine public API was inspected. |
| Returns | `BLOCKED_BY_ENGINE` | No return calculation contract is available. |
| Progressions | `BLOCKED_BY_ENGINE` | No progression calculation contract is available. |
| Solar arcs | `BLOCKED_BY_ENGINE` | No solar-arc calculation contract is available. |
| Historical timezone authority | `BLOCKED_BY_TIME_AUTHORITY` | Web carries IANA, offset, database-version, and ambiguity fields, but precise historical local-time resolution remains a separate open boundary. Engine `TimeAuthority` receives a canonical UTC instant and is not a Web timezone database. |
| Production scientific configuration identity | `BLOCKED_BY_PROVIDER` | Current production provider and cleared scientific configuration are not approved. |
| Stable per-fact identity | `UNRESOLVED` | The current Web chart contracts do not expose a stable `factId`; the foundation therefore requires a canonical result path and treats an Engine-supplied identity as optional. |

### 3.1 Current authoritative facts

The safe current fact inventory for a future adapter is limited to values
explicitly supplied by a validated Engine result or an approved boundary:

- body position/sign and, where present, house assignment;
- ASC and MC angle facts;
- house system/cusps;
- aspect type, orb, and applying/exact/separating state;
- Engine/Web scientific status and warnings; and
- canonical timezone and historical-time fields only when the relevant
  authority has explicitly resolved them.

The Signal layer may reference these facts. It must not reproduce their
calculation or create a replacement value from a label, taxonomy, date, or
locale.

### 3.2 Development-only and blocked facts

The current Web Sky snapshot/events contract, `WEB_UI_FIXTURE_V1`, Sky fixtures,
development location resolver, ingress/lunation event values, and three-state
motion examples remain development/research evidence. They are useful for
bounded UI and rule-engine characterization only. They must be marked
`DEVELOPMENT_ONLY` and must not acquire scientific configuration or provenance
identities.

Transit-to-natal relationships, returns, progressions, solar arcs, and precise
historical local-time-dependent windows remain blocked by the Engine/provider/
time-authority boundaries shown in the matrix. No rule may fire merely because
the vocabulary has a future value for it.

## 4. Four semantic layers

Every future interpretation flow MUST keep these layers separate:

| Layer | Owner | Meaning | Prohibited behavior |
| --- | --- | --- | --- |
| **FACT** | NatalNode Engine or an explicitly approved source boundary | A supplied, validated scientific or time fact. | Web calculation, inferred values, taxonomy promoted as fact, or fixture promotion. |
| **SIGNAL** | Web interpretation domain | A deterministic, rule-derived semantic candidate grounded in one or more Fact references. | Prose, prediction, arbitrary score, new astronomy, or an LLM-created signal. |
| **INTERPRETATION** | Future content/interpretation renderer | A bounded language transformation of an approved Signal set and approved fact excerpts. | New facts, new Signals, changed direction/confidence, or authority substitution. |
| **PRESENTATION** | Product feature and route | Daily, Weekly, Monthly, Share, Print, Collections, or Notifications composition. | Becoming the source of truth, silently changing authority, or treating cache/UI state as fact. |

The reusable Signal foundation and the bounded WeeklyReadingModel presentation
contract are implemented without expanding any layer into a product route. The
Reading Model is documented separately in
`NATALNODE_WEEKLY_READING_MODEL_V1.md`; it remains development-only and does
not replace the Signal or current Chart Result authority.

## 5. Signal vocabulary and contract

The exact Signal domains are:

```text
SELF
EMOTIONAL
RELATIONSHIP
COMMUNICATION
WORK_CREATION
ACTION_DECISION
```

The exact direction values are:

```text
SUPPORTIVE
CHALLENGING
MIXED
NEUTRAL
```

The exact intensity values are:

```text
SUBTLE
NOTICEABLE
STRONG
DOMINANT
```

The exact confidence values are:

```text
HIGH
MEDIUM
LOW
```

Confidence describes evidence quality. It is not a probability, forecast
likelihood, or guarantee. A Signal may carry an internal normalized strength
from `0` through `1`; that value is implementation metadata only and MUST NOT
be rendered as a user-facing percentage, scientific accuracy claim, or false
precision.

`InterpretationSignal` contains:

- a deterministic `signalId` in the interpretation namespace;
- one domain, direction, intensity, confidence, priority, and semantic theme;
- optional source-supplied temporal window;
- rule identity and normalized ranking metadata;
- a complete Web-side provenance link; and
- an authority classification of `AUTHORITATIVE` or `DEVELOPMENT_ONLY`.

`signalId` is not a scientific identity. It MUST NOT be used as a substitute
for an Engine fact ID, astronomy configuration ID, or provenance envelope ID.

Priority is limited to:

```text
BACKGROUND
THEMATIC
ACTIVE
MOMENTARY
```

Priority is meaningful only when source duration semantics support the
classification. The Signal layer does not infer a duration from a body name,
aspect name, or editorial intuition.

## 6. Fact references and provenance

`InterpretationFactReference` is deliberately narrow:

```text
factKind
canonicalPath
canonicalFactIdentity?              # only when Engine supplies it
scientificConfigurationIdentity?    # only when supplied
provenanceEnvelopeId?               # only when supplied
```

`canonicalPath` is the required pointer into the supplied canonical result,
for example a bounded path to a body or aspect. It is not a newly generated
scientific ID. If the Engine later supplies a stable fact identity, the adapter
may copy it without changing the Signal contract. Until then, the path is the
only required linkage.

`InterpretationSignalProvenance` preserves this chain:

```text
Interpretation
    -> Signal IDs
    -> Rule IDs and rule versions
    -> Fact references
    -> Engine result reference
    -> scientific configuration identity, when supplied
    -> Engine provenance envelope, when supplied
```

The Web layer MUST NOT duplicate or reconstruct the Engine provenance graph.
It MUST omit scientific and provenance identities when the source is a fixture
or `INCOMPLETE_RESEARCH`. A source authority of `DEVELOPMENT_FIXTURE` or
`INCOMPLETE_RESEARCH` always materializes to `DEVELOPMENT_ONLY`.

## 7. Deterministic rule-engine foundation

Rules are registered in an immutable `InterpretationSignalRuleRegistry`.
Registration returns a new registry, and evaluation does not mutate the rule
set or the supplied facts.

Each rule contains:

- `ruleId`;
- `ruleVersion`;
- the exact `interpretationRulesVersion`;
- required fact kinds;
- an optional known-birth-time prerequisite;
- an explicit allow-list of source authorities;
- a pure fact matcher; and
- a Signal draft factory that cannot declare its own authority.

Evaluation order is fixed:

```text
source-authority gate
    -> known-time gate
    -> required-fact availability gate
    -> deterministic fact match
    -> draft materialization
    -> source-authority-bound authority/provenance
    -> stable signal ordering
```

Missing prerequisites produce a skipped-rule diagnostic and no Signal. A rule
match error is also fail-closed. Duplicate rule IDs, duplicate Signal IDs,
foreign rule versions, empty fact paths, invalid normalized values, and
authority-inconsistent output are errors rather than reasons to manufacture a
fallback result.

No production astrology rule is registered by this task. The focused tests
register a small fixture-only rule to prove the deterministic foundation and
its safety gates. This keeps the current incomplete scientific surface from
being mistaken for a production interpretation catalog.

## 8. Ranking, composition, and conflicts

### 8.1 Ranking

Ranking consumes only explicit normalized Signal metadata. The current
foundation uses a versioned, reviewable deterministic weighting:

```text
priority weight             × 0.20
internal strength           × 0.10
base importance             × 0.30
evidence strength           × 0.25
temporal relevance          × 0.10
duration weight             × 0.05
repetition penalty          × -0.15
```

The result is clamped to `0..1` and is internal ordering metadata only. Ties
are resolved by internal strength and then lexicographic `signalId`. Ranking
does not inspect a chart, calculate an orb, compare longitudes, consult a
provider, or use a cache.

### 8.2 Composition

Composition returns a view over selected Signals rather than creating a new
scientific fact or silently replacing a source Signal. It preserves:

- every source Signal ID;
- supportive and challenging source IDs;
- the dominant Signal ID and supporting Signal IDs after deterministic ranking;
- every distinct source fact reference; and
- the directional composition.

Directional composition is:

```text
SUPPORTIVE + CHALLENGING -> MIXED
any MIXED source          -> MIXED
supportive only           -> SUPPORTIVE
challenging only          -> CHALLENGING
neutral only              -> NEUTRAL
neutral + one direction   -> that direction
```

Repeated Signals in the same theme remain explicit. A repeated theme is not
silently deduplicated into a stronger fact. A slow/background Signal and a
fast/momentary Signal remain separate and are ordered by the same deterministic
metadata rules. Equal-priority ties remain stable and reviewable.

### 8.3 Conflict test obligations

Any future production rule catalog MUST cover at least:

- supportive versus challenging Signals;
- multiple supportive Signals;
- repeated Signals with the same theme;
- slow/background versus fast/momentary priority;
- equal-priority and equal-score ties; and
- unavailable prerequisites.

## 9. Temporal windows and period identity

`startsAt`, `peaksAt`, and `endsAt` are optional semantic data only when the
source facts provide the corresponding timing. The Web MUST NOT estimate a
window from a natal position, make up an exact timestamp, or turn a snapshot
into an event.

The canonical period identities are:

| Period | Identity rule |
| --- | --- |
| Daily | One local calendar day in the canonical timezone. |
| Weekly | Monday through Sunday in the canonical timezone. |
| Monthly | One local calendar month in the canonical timezone. |

Every period identity carries a period key, canonical IANA timezone, and
source-supplied start/end boundary. Period identity is not a chart fact and is
not generated by the Signal ranking layer.

Unknown or unresolved timezone authority blocks a time-dependent period from
being presented as authoritative.

## 10. Unknown birth time, localization, and provider neutrality

Unknown birth time is an explicit state. The system MUST NOT substitute noon,
midnight, an average time, or a guessed UTC instant. Rules requiring known time
are skipped before fact matching.

With unknown birth time, no rule may emit a Signal that depends on:

- ASC or MC;
- houses or house placement;
- angles or angle relationships; or
- any temporal calculation requiring a missing instant.

Natal body/sign facts may be used only when an authoritative source has
actually supplied them with the required time semantics. The Signal layer
does not derive them from the local date.

Signal semantics are locale-neutral. Locale affects only a future content or
presentation renderer. Localizing a label MUST NOT alter Signal ID, domain,
direction, intensity, confidence, strength, priority, fact references, rule
identity, or provenance.

The implementation contains no provider import, provider selection, provider
name, provider URL, or provider-specific branch. The literal state remains:

```text
PROVIDER DECISION DEFERRED
```

## 11. Interpretation content styles and AI containment

Future content styles are exactly:

```text
CLEAR
CASUAL
ASTROLOGER
SHARE
```

The future renderer input is limited to:

```text
approvedSignals
approvedFactExcerpts
period
locale
style
contentPolicyVersion
```

It does not receive raw birth input, arbitrary Engine payloads, an unapproved
Signal pool, or a provider object. Approved fact excerpts remain tied to their
fact references.

If an AI language tool is introduced in a later task, its allowed operations
are bounded to wording, summarization, localization, shortening, expansion,
and tone transformation. It MUST NOT:

- create, delete, or alter a Fact reference;
- create or alter a Signal, domain, direction, intensity, confidence, priority,
  strength, or temporal window;
- invent a scientific configuration or provenance identity;
- calculate a transit, aspect, house, position, orb, phase, or score;
- replace an unavailable authority with prose; or
- produce a certain event prediction.

The following policies are frozen:

```text
NO FACT INVENTION
NO TRANSIT INVENTION
NO ASPECT INVENTION
NO HOUSE INVENTION
NO SCORE INVENTION
NO CERTAIN EVENT PREDICTION
```

## 12. Daily, Weekly, and Monthly structural contracts

These are data-shape contracts only. They authorize no route or product UI.

### 12.1 Daily

`DailySignalSet` contains:

- one Daily period identity;
- the selected Signal set;
- at most one `heroSignalId`;
- at most two `supportingSignalIds`;
- themes;
- watch-outs;
- action suggestions; and
- provenance for the selected result.

The hero and supporting slots reference existing Signals. They do not create
new facts. The daily result binds to the canonical timezone of its period and
cannot silently fall back to a generic horoscope.

### 12.2 Weekly

`WeeklySignalSet` contains:

- one Weekly period identity;
- one hero theme;
- three core themes;
- source-backed timeline segments;
- Relationship, Work/Creation, Inner State, and Action/Decision sections;
- a Watch Out section;
- an optional Best Window section;
- Astrologer View Signal references;
- an optional quote slot; and
- provenance.

Weekly composition MUST NOT be implemented as seven concatenated Daily
results. A future weekly rule set must choose its own approved Signals and
source-backed segments under the same authority rules.

### 12.3 Monthly

`MonthlySignalSet` contains:

- one Monthly period identity;
- a theme;
- major source-backed periods;
- Relationship, Work/Creation, Inner State, and Action/Decision sections;
- lunar-moment Signal references only when the source supplies them;
- a reflection-prompt slot; and
- provenance.

Monthly composition MUST NOT be implemented as four concatenated Weekly
results. A missing lunar or historical-time authority produces an unavailable
slot, not a guessed event.

## 13. Public horoscope and personal boundary

Public horoscope is a future simplified editorial/zodiac or Sun-sign surface
for acquisition and SEO. It is not a personal full-chart authority and must
not imply that a shared public statement is personally calculated.

Personal interpretation is a separate boundary. It requires the user's own
authoritative chart facts, explicit identity/ownership rules, and appropriate
privacy controls. Public copy cannot be promoted into personal Signal input,
and personal chart facts cannot be exposed through a public horoscope path.

No public horoscope route is added by this task.

## 14. Future Compatibility boundary

Public pairing content and deep personal compatibility are different products.
The future personal path is:

```text
Chart A + Chart B
    -> Engine-supplied synastry facts
    -> relationship Signals
    -> bounded Interpretation
```

The Web must not calculate synastry, infer relationship facts from two labels,
or expose a compatibility percentage. Compatibility remains future work and
does not extend this foundation's current fact inventory.

## 15. Cache and failure semantics

Cache is a performance layer, never an authority. A cache identity may include
the chart identity, period identity, scientific configuration identity when
available, interpretation rules version, locale, and style. A cache miss,
eviction, expiry, corruption, or outage must leave the authoritative path
correct.

The cache MUST NOT:

- create a Signal or Fact;
- provide a stale result when the authority identity is missing or mismatched;
- turn a fixture into production content; or
- replace an Engine result, rule evaluation, or provenance chain.

Authority-sensitive failure is closed:

- missing or incomplete scientific authority → no authoritative Signal set;
- missing historical-time authority → no authoritative time-dependent window;
- missing fact prerequisite → skipped rule;
- invalid or inconsistent provenance → no Signal;
- stale or mismatched cache → miss/failure, never a silent fallback;
- unavailable Engine/provider → explicit unavailable state, never generic LLM
  improvisation; and
- fixture input → development-only output or no output, never promotion.

## 16. Fixture safety

`WEB_UI_FIXTURE_V1`, Sky fixtures, and development location/time fixtures are
sanctioned characterization inputs only. A fixture rule may be explicitly
allowed to run against a fixture so the engine can be tested, but the registry
materializes the result as `DEVELOPMENT_ONLY` and clears scientific and
provenance identities.

The fixture's body/sign/aspect values are not new astronomy evidence. No UI
fixture may be stored, cached, cited, or presented as an authoritative
scientific result. No future test may pass merely because it observes a fixture
value where an Engine-supplied value is required.

## 17. Commercial and entitlement neutrality

Interpretation correctness is FREE-FIRST. There is no purchasable Pro
interpretation path in this foundation. A future entitlement layer may decide
whether a product surface is available, but it must not change Fact authority,
Signal correctness, failure semantics, provenance, or safety.

No paywall, ad decision, subscription lookup, billing provider, or entitlement
mutation is introduced here.

## 18. Research implementation status

The earlier bounded Signal implementation, its development demonstrations,
and its dedicated characterization tests were retired by
`NN-WEB-FREE-BASELINE-CLEANUP-001`. The policy and research documents remain
available as historical evidence. They do not describe modules or routes in
the current website and do not authorize runtime admission.

## 19. Acceptance gates for future product work

A future Daily/Weekly/Monthly implementation may proceed only if all of these
remain true:

1. every Signal is sourced from explicit Fact references;
2. every rule has a stable ID, rule version, and interpretation rules version;
3. authority and provenance are preserved without invented identities;
4. unknown time and unavailable prerequisites fail closed;
5. fixture/research data cannot be promoted;
6. ranking and composition are deterministic and testable;
7. locale changes presentation only;
8. cache is non-authoritative;
9. public horoscope and personal interpretation remain separate;
10. no provider-specific dependency or astronomy calculation enters Web;
11. AI, if later approved, remains a bounded language transformation; and
12. required Engine, provider, and historical-time gates are independently
    satisfied before a result is described as production authoritative.

The current foundation has `MODULE_PASS` and `SIMULATED_INTEGRATION_PASS`
evidence through focused tests. It is not a production interpretation launch
and it is not owner browser acceptance.

## 20. Deferred decisions and next task

No blocking Product Owner decision is required to admit this foundation. The
following decisions remain intentionally deferred to the relevant future
campaigns:

- production astronomy provider and scientific configuration;
- authoritative per-fact IDs, if the Engine contract adds them;
- exact production rule catalog and editorial approval;
- historical timezone/time-window authority;
- Daily/Weekly/Monthly product content and acceptance;
- personal transit and compatibility Engine contracts; and
- any AI content policy and provider, if separately authorized.

This task stops at the foundation boundary. The next exact bounded task is:

```text
WEB-P2-WEEKLY-001 — Weekly Signal POC
```

It must begin with the conditions and blockers in this document, must not
reopen provider selection, and must not silently turn development Sky or chart
fixtures into production authority.
