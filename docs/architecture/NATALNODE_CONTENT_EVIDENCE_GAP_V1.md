# NatalNode Content Evidence Gap V1

Task: WEB-P2-CONTENT-EVIDENCE-GAP-001
Baseline: a686a5728223b474a2fec5ad1d04bbe6cfd9f28f
Decision: RECONCILED_WITH_CONDITIONS
Validation level: MODULE_PASS (documentation and evidence-map review)
Engine access: read-only
Provider decision: PROVIDER DECISION DEFERRED

## 1. Executive decision

The Content Value Architecture target is reconciled against the currently
inspectable Engine, public contracts, BFF, Web interpretation boundaries, and
presentation models. The result is conditional because the repository contains
useful semantic building blocks but does not yet close the production evidence
chain for temporal content, provider authority, or the current Web runtime.

The strongest next product direction is a bounded My Chart plus contextual
Learn-from-your-chart vertical slice. It should use stable natal chart facts,
show their authority state, and connect those facts to the existing Foundations
lessons. It must not claim current timing, transit interpretation, or production
astronomy while the provider and public Engine binding remain unresolved.

Authoritative audit conclusions:

- WEB-P2-CONTENT-EVIDENCE-GAP-001 is RECONCILED_WITH_CONDITIONS.
- ENGINE_MODIFIED_NO.
- NO_LARGE_REFACTOR_REQUIRED.
- PROVIDER DECISION DEFERRED remains unchanged.
- Current Web chart and sky runtime evidence is development-only because the
  executable server binds MockEngineClient.
- Weekly R2 remains a DEVELOPMENT RESEARCH ARTIFACT and is not promoted.

## 2. Scope and authority boundary

This is an evidence reconciliation document, not an implementation task. It
does not add facts, rules, APIs, routes, providers, migrations, UI behavior,
content generation, or persistence.

The fixed boundary remains:

    NatalNode.com
        -> Website API / BFF
            -> NatalNode Engine Public API

The Web must not call a provider directly. Engine internals are not public Web
authority. A fixture, cache, browser snapshot, or editorial draft is not an
authoritative substitute for a scientific result.

The audit covers the Content Value Architecture; My Chart and Learn-from-your-
chart; current and period content direction; Signal and ReadingModel
boundaries; public horoscope; recurring value; professional inspectability; and
learning readiness.

It intentionally does not implement or reopen Engine integration, provider
selection, BFF changes, birth input, location resolution, Signal rules,
interpretation copy, Weekly UI, authentication, Vault, Share, notifications,
database, deployment, or SEO.

## 3. Three-axis authority taxonomy

The R1 correction freezes three separate questions. A value must not be called
production scientific authority merely because a schema or computation path can
represent it.

### 3.1 Capability

Capability asks: can the inspected Engine domain represent or calculate the
fact?

| Capability status | Meaning |
| --- | --- |
| CAPABILITY_AVAILABLE | The inspected Engine/domain path defines the fact or transformation. |
| CAPABILITY_PARTIAL | Some required inputs or semantics exist, but the capability is incomplete. |
| CAPABILITY_MISSING | The required Engine capability was not found. |

### 3.2 Contract exposure

Contract exposure asks: is the fact available through the supported public
contract and Web/BFF path?

| Contract or binding status | Meaning |
| --- | --- |
| PUBLIC_CONTRACT_AVAILABLE | The public contract contains the fact with the required shape. |
| PUBLIC_CONTRACT_PARTIAL | The contract carries only part of the required fact or provenance. |
| PUBLIC_CONTRACT_BLOCKED | No admitted public contract carries the required fact. |
| WEB_BINDING_AVAILABLE | The Web/BFF runtime is bound to the admitted contract and authority. |
| WEB_BINDING_DEVELOPMENT_ONLY | A Web/BFF path exists, but it is explicitly development-only. |
| WEB_BINDING_MISSING | No Web/BFF binding for the required capability was found. |

### 3.3 Production authority

Production authority asks: may NatalNode currently treat the produced value as
production scientific authority?

| Production authority status | Meaning |
| --- | --- |
| PRODUCTION_AUTHORITY_ADMITTED | Provider, time, configuration, provenance, contract, and runtime gates are admitted. |
| PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Provider selection, rights, or operational provider identity is not closed. |
| PRODUCTION_AUTHORITY_BLOCKED_TIME_AUTHORITY | Required civil-time or historical-time authority is not closed. |
| PRODUCTION_AUTHORITY_BLOCKED_CONFIGURATION | Scientific configuration identity or release status is not closed. |
| PRODUCTION_AUTHORITY_BLOCKED_PROVENANCE | Provenance, validation, rights, or governance evidence is not closed. |
| DEVELOPMENT_RESEARCH_ONLY | The result may support a visibly bounded development/research prototype only. |
| FIXTURE_ONLY | The value exists only in a fixture or conformance artifact. |

Surface-readiness shorthand such as AVAILABLE_DEVELOPMENT_ONLY is not a
production authority status. Fixture inputs use the explicit production status
FIXTURE_ONLY. The authoritative production classification is the third axis
above.

| Gap | Meaning |
| --- | --- |
| G1 | Required Engine fact or calculation capability is missing. |
| G2 | Authority, provenance, configuration, or rights are not closed. |
| G3 | Public request/response contract does not expose required evidence. |
| G4 | Web/BFF execution path is missing, development-only, or unbound to required authority. |
| G5 | Signal domain semantics are missing or insufficiently admitted. |
| G6 | Interpretation rule/content authority is missing or development-only. |
| G7 | ReadingModel cannot represent required evidence truthfully. |
| G8 | Presentation does not expose evidence or authority at the required depth. |
| G9 | Product policy, eligibility, or recurring-value rules are not frozen. |

## 4. Evidence reviewed

### 4.1 Web documents

The audit used:

- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/product/NATALNODE_CONTENT_VALUE_ARCHITECTURE_V1.md
- docs/product/NATALNODE_ADAPTIVE_EXPERIENCE_ARCHITECTURE_V1.md
- docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md
- docs/product/NATALNODE_EDUCATIONAL_CHART_INSTRUMENT_V1.md
- docs/product/NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md
- docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md
- docs/architecture/NATALNODE_WEEKLY_READING_MODEL_V1.md
- docs/architecture/NATALNODE_LEARNING_ARCHITECTURE_V1.md
- docs/research/weekly-signal-poc/WEEKLY_SIGNAL_POC_REVIEW.md
- Weekly Signal POC scenarios A through E

### 4.2 Web implementation surfaces

The relevant implementation surfaces were:

- packages/contracts/src/chart.ts
- packages/contracts/src/api/chart-calculation.ts
- packages/contracts/src/sky.ts
- packages/engine-client/src/index.ts
- packages/engine-client/src/http-engine-client.ts
- packages/engine-client/src/mock-engine-client.ts
- packages/test-fixtures/src/index.ts
- server/src/executable/public-development-dependencies.ts
- server/src/executable/create-executable-server-bindings.ts
- server/src/executable/executable-server-config.ts
- server/src/app/routes/chart.ts
- server/src/app/routes/sky.ts
- server/src/app/cache/cached-chart-calculator.ts
- apps/web/src/lib/engine-client.ts
- apps/web/src/features/chart-experience/types.ts
- apps/web/src/features/interpretation/interpretation-signal-contracts.ts
- apps/web/src/features/interpretation/interpretation-signal-engine.ts
- apps/web/src/features/interpretation/deterministic-interpretation.ts
- apps/web/src/features/interpretation/weekly-interpretation-poc.ts
- apps/web/src/features/interpretation/weekly-editorial.ts
- apps/web/src/features/interpretation/weekly-reading-model.ts
- apps/web/src/features/interpretation/WeeklyReadingPrototypeR2.tsx
- apps/web/src/features/learn/educational-chart-source.ts
- apps/web/src/features/learn/educational-chart-model.ts
- apps/web/src/features/chart-workspace/ChartResultSummary.tsx
- apps/web/src/features/calculation-details/CalculationDetails.tsx
- apps/web/src/features/interpretation/InterpretationPanel.tsx
- apps/web/src/features/public-sky/CurrentSkyInstrument.tsx

### 4.3 Engine documents and source

The Engine was inspected read-only under C:\NatalNode only. The minimum
relevant set was:

- docs/engine/ENGINE_API_CONTRACT.md
- docs/engine/ASPECT_ORB_MODEL.md
- docs/engine/ENGINE_DOMAIN_MODEL.md
- docs/engine/ENGINE_RELEASE_GATES.md
- docs/engine/HOUSE_SYSTEMS.md
- packages/engine/src/domain/chart.ts
- packages/engine/src/domain/aspects.ts
- packages/engine/src/domain/houses.ts
- packages/engine/src/domain/metadata.ts
- packages/engine/src/domain/bodies.ts
- packages/engine/src/providers/astronomy-provider.ts
- packages/engine/src/time/authority.ts
- packages/engine/src/provenance/types.ts
- packages/engine/src/provenance/canonical.ts
- packages/engine/src/provenance/identity.ts
- packages/engine/src/provenance/runtime-binding.ts
- packages/engine/src/calculate.ts
- packages/engine/src/index.ts
- packages/engine-conformance/src/fixtures/fixture-provider.ts
- packages/engine-conformance/reports/conformance.md

No Engine file was modified. The Engine worktree was already dirty because it
contained the untracked file C:\NatalNode\CODEX_EPH_SPIKE_001.md. That file was
not opened, changed, deleted, staged, or committed.

## 5. Engine capability audit

The Engine is provider-independent. It performs semantic transformations and
validation around provider-supplied states; it is not itself an astronomy
provider. Its input contract requires normalized UTC and latitude/longitude.
Local civil time and timezone normalization are outside the Engine package.

| Fact or capability | Capability | Public contract | Web binding | Production authority | Evidence / condition |
| --- | --- | --- | --- | --- | --- |
| Body identity and longitude | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Ten canonical bodies and BodyFact fields exist; the executable path is mock-bound. |
| Sign and sign-degree mapping | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Provider-independent semantic transformation exists; a provider-backed state is not admitted. |
| House membership and cusps | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | BodyFact.house and HouseFacts exist; known-time and valid time authority remain required. |
| ASC, MC, ARMC, obliquity | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Angle result and AngleFact structures exist; no production binding exists. |
| Major aspects | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Type, bodies, separation, and phase exist; Web AspectFact does not expose a per-fact canonical identity. |
| Orb | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_CONFIGURATION | Engine orb semantics and Web AspectFact.orb exist; admitted scientific configuration is still open. |
| Phase | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Applying/exact/separating semantics exist; production body states are not admitted. |
| Motion / retrograde | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_PARTIAL | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Engine has richer speed/motion semantics; ChartResult exposes retrograde but not the full motion evidence. |
| Warnings | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Calculation warnings are diagnostic evidence, not independent scientific authority or interpretation rules. |
| Configuration metadata | CAPABILITY_PARTIAL | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_CONFIGURATION | Complete and INCOMPLETE_RESEARCH states are representable; no production configuration is approved. |
| Provenance metadata | CAPABILITY_PARTIAL | PUBLIC_CONTRACT_AVAILABLE | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVENANCE | Provenance identity structures exist; source, validation, rights, and governance gates remain open. |
| Normalized time context | CAPABILITY_AVAILABLE | PUBLIC_CONTRACT_PARTIAL | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_TIME_AUTHORITY | NATALNODE_TIME_POLICY_V1 handles normalized UTC-derived scales; local/historical authority remains outside this path. |
| Transit-to-natal relationships | CAPABILITY_MISSING | PUBLIC_CONTRACT_BLOCKED | WEB_BINDING_MISSING | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | No admitted Engine/public operation was found; do not infer temporal signals from natal facts. |
| House/angle transits | CAPABILITY_MISSING | PUBLIC_CONTRACT_BLOCKED | WEB_BINDING_MISSING | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | No admitted capability was found; requires a separately frozen calculation boundary. |
| Moon phase / lunation | CAPABILITY_PARTIAL | PUBLIC_CONTRACT_PARTIAL | WEB_BINDING_DEVELOPMENT_ONLY | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Web concepts and fixtures exist; production temporal authority is not admitted. |
| Production provider | CAPABILITY_PARTIAL | PUBLIC_CONTRACT_PARTIAL | WEB_BINDING_MISSING | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Provider interface exists, but no production provider implementation was found in the inspected package. |

The conformance fixture explicitly says it is not an astronomy model, has
undefined numerical accuracy, and has production selection NOT_SELECTED. Its
production authority status is FIXTURE_ONLY and it is never scientific
authority.

## 6. Public contract audit

| Contract | Carries | Public contract exposure | Gap / condition |
| --- | --- | --- | --- |
| BirthRequest | Local date/time, location resolution, coordinates, IANA timezone, UTC instant, offset, database version, method, ambiguity. | PUBLIC_CONTRACT_PARTIAL | Normalized input exists; historical/local-time authority is not fully demonstrated. |
| ChartRequest | BirthRequest plus house system. | PUBLIC_CONTRACT_AVAILABLE | The contract exists; runtime binding remains development-only. |
| ChartResult | Bodies, angles, houses, aspects, status, complete/incomplete metadata. | PUBLIC_CONTRACT_PARTIAL | No per-fact canonical identity; complete metadata depends on admitted provider/configuration/provenance. |
| Chart BFF | Chart response and bounded errors. | PUBLIC_CONTRACT_AVAILABLE | Current executable binding is not a production Engine result. |
| SkySnapshotRequest | atUtc point-in-time request. | PUBLIC_CONTRACT_PARTIAL | Shape exists; runtime is fixture-backed. |
| SkyEventsRequest | Start/end UTC interval and event response types. | PUBLIC_CONTRACT_PARTIAL | Production temporal authority is not closed. |
| Location resolution | Canonical location and timezone fields. | PUBLIC_CONTRACT_PARTIAL | Does not provide astronomy provider identity or historical-time authority. |
| Fact provenance | Signal refs may carry fact/configuration/provenance identity. | PUBLIC_CONTRACT_PARTIAL | ChartResult does not currently supply a stable per-fact identity path. |

The contracts can preserve INCOMPLETE_RESEARCH, which is correct. An incomplete
result is not evidence that authoritative science is available.

## 7. Web and BFF execution audit

The current path is:

1. Browser code constructs HttpEngineClient.
2. Chart and Sky BFF routes delegate through server dependencies.
3. Executable development bindings construct MockEngineClient.
4. MockEngineClient returns structured clones of WEB_UI_FIXTURE_V1 and Sky
   fixtures for supported fixture timestamps.
5. Executable configuration accepts only ENGINE_CLIENT_MODE=development-mock
   and rejects that mode as a production runtime.

The cache validates shape and engine identity but is not an authority. Its
development identity records UI_FIXTURE_V1. No cache, browser snapshot, or
development response may be promoted to scientific persistence.

Classification: AVAILABLE_DEVELOPMENT_ONLY. Gaps: G2, G3, G4.

The mock result is correctly labelled INCOMPLETE_RESEARCH with null
astronomyConfigurationId and provenanceEnvelopeId, engine version UI_FIXTURE_V1,
and explicit UI-development/not-scientific-evidence metadata. This is healthy
incomplete-state behavior, not a production content source.

### Web binding status

| Runtime path | Web binding status | Production authority status |
| --- | --- | --- |
| Browser HttpEngineClient to chart BFF | WEB_BINDING_DEVELOPMENT_ONLY | DEVELOPMENT_RESEARCH_ONLY |
| Browser HttpEngineClient to Sky BFF | WEB_BINDING_DEVELOPMENT_ONLY | FIXTURE_ONLY |
| Executable server chart dependency | WEB_BINDING_DEVELOPMENT_ONLY | FIXTURE_ONLY |
| Executable server Sky dependency | WEB_BINDING_DEVELOPMENT_ONLY | FIXTURE_ONLY |
| Production provider-backed Engine/BFF path | WEB_BINDING_MISSING | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER |

### Authoritative ChartResult

An authoritative ChartResult is not defined by structural schema conformity
alone. It must be produced through an admitted Engine -> public contract ->
BFF -> Web path and satisfy the applicable authority gates:

- the provider and its rights/operational identity are approved;
- the required local and historical time authority is valid;
- scientific configuration identity and release status are admitted;
- provenance, validation, rights, and governance evidence satisfy policy;
- the result is not a fixture, mock, or development snapshot;
- the result's calculation status and metadata truthfully express that state;
- the Web surface preserves the authority and incomplete-state semantics.

Only a result satisfying those conditions may be described as an
AUTHORITATIVE CHARTRESULT or authoritative personal astrology.

### Development/research ChartResult

A development or research ChartResult may conform to the same structural
schema while remaining DEVELOPMENT_RESEARCH_ONLY. WEB_UI_FIXTURE_V1 is the
current example: it has calculationStatus INCOMPLETE_RESEARCH, null scientific
configuration and provenance IDs, and explicit UI-development metadata. A
development result can support UI composition, content hierarchy, contextual
learning interaction, unknown-time behavior, and technical-inspection UX. It
cannot be described as authoritative personal astrology.

INCOMPLETE_RESEARCH is therefore a visible and architectural boundary. It must
remain visible in calculation details and downstream content, must not acquire
invented scientific or provenance IDs, and must never be silently promoted from
development to production authority.

## 8. Signal semantics audit

Signal contracts define SELF, EMOTIONAL, RELATIONSHIP, COMMUNICATION,
WORK_CREATION, and ACTION_DECISION domains; directions; intensity; confidence;
priority; fact kinds; source authority; and explicit temporal windows.

Safeguards already present:

- non-authoritative sources become DEVELOPMENT_ONLY signals;
- scientific and provenance IDs are null for non-authoritative sources;
- temporal windows come from an authoritative source and are not inferred;
- prerequisites can require known birth time and allowed source authority.

The missing part is an admitted production catalog of facts, rules, and
temporal evidence. No production natal or temporal rule registry was found.

Classification: PARTIAL. Gaps: G2, G5, G6.

The legacy deterministic chart interpretation path is a bounded current UI path;
its source facts are body/angle IDs and chart fields, not a production Signal
identity system.

## 9. ReadingModel and presentation audit

WeeklyReadingModel has a useful shape: hero, themes, domains, timeline, watch
out, why, astrologer view, actions, signature, share card, screen/print
presentation, and internal traceability. It is explicitly DEVELOPMENT_ONLY with
productionEligible false, and it transforms an editorial draft rather than
calculating facts.

Production gaps are authoritative current/period signals, stable per-fact
identity, provider/configuration/provenance identity, source freshness and
temporal validity, domain eligibility, recurring-content policy, and a truthful
distinction between natal anchors and current sky signals.

Classification: BLOCKED_READING_MODEL for production Weekly. Gaps: G2, G5, G6,
G7, G8, G9.

The R2 prototype is a presentation study. Its default presentation uses
generic celestial decoration and broad editorial categories; it does not expose
named traceable astrology evidence as a production horoscope.

## 10. Domain evidence matrix

| Domain | Stable natal evidence | Current/temporal evidence | Classification | Gaps |
| --- | --- | --- | --- | --- |
| LOVE & RELATIONSHIPS | Houses 5/7/8, Venus/Moon, and relationship aspects can be represented. | Transit-to-natal, current Venus/Mars/Moon timing, and windows are not admitted. | PARTIAL for static education; BLOCKED_SIGNAL_SEMANTICS for current readings. | G3, G5, G6, G8 |
| MONEY & RESOURCES | Houses 2/8, values/resource themes, and related placements/aspects can be described. | Current money windows and risk language lack temporal authority and policy. | PARTIAL for static education; BLOCKED_PUBLIC_CONTRACT for current guidance. | G3, G5, G6, G9 |
| WORK & CREATION | Houses 5/6/10, angles, planets, and aspects support stable chart education. | Current work/creation timing and action windows are not closed. | PARTIAL for My Chart/Learn; BLOCKED_SIGNAL_SEMANTICS for Weekly/Today. | G2, G5, G6, G9 |
| INNER STATE / MOOD | Moon, houses, aspects, and stable chart language support non-diagnostic reflection. | Current Moon position/phase and emotional windows are partial/fixture-backed. | PARTIAL. | G2, G3, G5, G9 |
| DECISIONS & ACTION | Mars, Saturn, angles, houses, and aspects are structurally available. | Current decision timing and warnings require temporal signals and policy. | PARTIAL for education; BLOCKED_TIME_AUTHORITY for temporal advice. | G2, G5, G6, G9 |
| COMMUNICATION | Mercury, house 3, angles, and aspects support stable explanations. | Current communication windows and recurrence are not authoritative. | PARTIAL for static education; BLOCKED_PUBLIC_CONTRACT for current content. | G3, G5, G6 |

This matrix identifies evidence requirements only; it does not authorize
prescriptive or deterministic language.

## 11. Stable natal versus current temporal evidence

### Stable natal evidence

Once an authoritative result is admitted, stable categories include body
position/sign/degree, house placement/cusps, ASC/MC and other angles, major
aspects with orb and phase, supported motion state, and calculation metadata.
These answer “what is in this chart?” They do not answer “what is active this
week?” or “what should happen today?”

### Current and temporal evidence

Temporal content requires current body positions at an explicit instant,
Moon/lunation evidence, transit-to-natal aspects, transit-to-angle/house
relationships, exactness and active windows, historical civil-time authority,
freshness, provider identity, configuration identity, and provenance.

The current repository does not close this chain. Natal facts must never be
relabelled as temporal signals to fill the gap.

## 12. My Chart readiness

Current three-axis status:

- Capability: CAPABILITY_AVAILABLE for the stable natal facts represented by
  the inspected Engine/domain path.
- Public contract: PUBLIC_CONTRACT_AVAILABLE for the core chart fields, with
  PUBLIC_CONTRACT_PARTIAL for richer motion/provenance identity.
- Web binding: WEB_BINDING_DEVELOPMENT_ONLY.
- Production authority: PRODUCTION_AUTHORITY_BLOCKED_PROVIDER, with
  configuration, provenance, and time-authority conditions still applicable.

The chart workspace and interpretation panel can present chart structure,
big-three summaries, planet sign/house placements, angles, aspects, calculation
details, an incomplete-research notice, and links into Foundations.

The current result is not production authority because the executable server is
mock-bound. A future bounded slice requires an authoritative ChartResult through
the BFF, known/unknown birth-time behavior, truthful configuration/provenance,
one target evidence projection, a runtime authority check, and no temporal
language in the static chart surface.

Gaps: G2, G3, G4, G8.

### Stage A — development product prototype

Stage A may use INCOMPLETE_RESEARCH only when the boundary is visible in both
the UI and the architecture. Its purpose is UI composition, content hierarchy,
contextual learning interaction, unknown-time behavior, and
technical-inspection UX. Stage A may not claim scientific authority,
authoritative personal astrology, or production-ready calculation.

Stage A must preserve the development/research status, null scientific and
provenance identities, and explicit fixture/mock labeling. It must not silently
become Stage B.

### Stage B — authoritative product

Stage B requires an admitted authoritative ChartResult path through:

    Engine -> public contract -> BFF -> Web

The path must satisfy provider, configuration, provenance, rights, validation,
and applicable local/historical time-authority requirements. A runtime authority
check is required before any production claim. Stage B must never be inferred
from Stage A schema conformity or from a successful fixture flow.

## 13. Learn-from-your-chart readiness

Foundations has hooks for chart structure, zodiac structure, calculation details,
luminaries, personal planets, planet overview, houses/angles, placements,
major aspects, chart priorities, whole-chart context, and responsible use.

The educational source intentionally creates MockEngineClient and uses fixture
values for development. Generic lessons and links are available, but a general
personal-authority contextual projection is not yet admitted.

Classification: PARTIAL. Gaps: G2, G4, G8, and later G7 if context is added
without a frozen projection contract.

My Chart plus contextual Learn is a safer next direction than temporal content
because it uses stable natal evidence and can remain honest for unknown birth
time.

## 14. Weekly readiness

The Weekly POC supplies five scenarios, four editorial voices, source traces,
timing/mixed-evidence fields, an unknown-birth-time scenario, and a
development-only ReadingModel shape.

It lacks production transit-to-natal evidence, complete temporal evidence,
production Moon/time authority, provider identity, operational provenance,
admitted production Signal rules, recurring-content policy, and a
production-eligible ReadingModel.

Classification: AVAILABLE_DEVELOPMENT_ONLY. Decision: WEEKLY R2 =
DEVELOPMENT RESEARCH ARTIFACT. Gaps: G1, G2, G3, G5, G6, G7, G8, G9.

## 15. Today readiness

Today needs a point-in-time sky request, current temporal authority, a period
boundary, and rules that distinguish current sky facts from natal anchors. Sky
contracts contain a conceptual snapshot request, but the runtime is fixture
backed and personal transit relationships are not exposed.

Classification: BLOCKED_PUBLIC_CONTRACT and PRODUCTION_AUTHORITY_BLOCKED_PROVIDER.
Gaps: G1, G2, G3, G4, G5, G6, G9.

No Today product may be inferred from a natal ChartResult or development Sky
fixture.

## 16. Month readiness

Month additionally requires event/window aggregation, deduplication, exactness
or active-window semantics, and policy for sparse or mixed evidence. Event
vocabulary exists, but production temporal authority and ReadingModel admission
do not.

Classification: BLOCKED_READING_MODEL. Gaps: G1, G2, G3, G5, G6, G7, G9.

## 17. Relationships and Love readiness

Relationships and Love can support bounded stable education around houses,
Venus, Moon, partnership placements, and aspects. Current or recurring guidance
requires temporal evidence, a clear distinction between charts, and stronger
content policy.

Relationships: PARTIAL for stable education; BLOCKED_SIGNAL_SEMANTICS for
current/recurring guidance. Gaps: G2, G3, G5, G6, G9.

Love: PARTIAL for stable education; BLOCKED_PUBLIC_CONTRACT for temporal
content. Gaps: G3, G5, G6, G9.

## 18. Money readiness

Money can be grounded in stable second/eighth-house themes and related
placements, but financial-sounding timing or risk language needs temporal
evidence and an explicit safety/content policy.

Classification: PARTIAL for education; BLOCKED_SIGNAL_SEMANTICS for current
guidance. Gaps: G3, G5, G6, G9. Deterministic financial claims are not
authorized.

## 19. Astrology Anchors

Astrology Anchors are stable, inspectable natal reference points: placements,
angles, houses, and major aspects. The chart workspace, calculation details,
interpretation panel, and Foundations can support a development anchor
experience.

Classification: AVAILABLE_DEVELOPMENT_ONLY. Its target contract state is
PUBLIC_CONTRACT_AVAILABLE, while its current Web binding is
WEB_BINDING_DEVELOPMENT_ONLY and its production authority is
PRODUCTION_AUTHORITY_BLOCKED_PROVIDER until the public result is admitted.
Anchors must not silently become a current-sky product.

## 20. Professional inspectability levels

| Level | Requirement |
| --- | --- |
| 1 | Surface names the subject and distinguishes chart fact, current sky, and interpretation. |
| 2 | User sees domain, source category, period, and incomplete/research state. |
| 3 | Material claims link to stable fact references and signal traceability. |
| 4 | Configuration, provider status, time authority, and provenance are inspectable. |
| 5 | Exact input/period, authority identity, validation evidence, rights, and versioned output are reproducible. |

| Surface | Highest level evidenced now | Reason |
| --- | --- | --- |
| My Chart | Level 3 in development | Details and source facts exist; runtime is fixture-backed and per-fact authority is not exposed. |
| Learn Foundations | Level 2 in development | Hooks and responsible-use context exist; personal evidence projection is not general or production-bound. |
| Weekly POC | Level 2 in development | Scenario traces exist; provider/time/Signal authority does not. |
| Public Sky | Level 2 in development | Body/aspect presentation exists; source is fixture-backed and not personal authority. |
| Today | Level 0–1 | No admitted production surface or temporal chain. |
| Month | Level 0–1 | No admitted event aggregation or temporal ReadingModel. |
| Relationships/Love/Money | Level 1 for static education | Stable categories can be explained; current guidance and policy are open. |

No current surface reaches professional inspectability Level 4 or 5 for
production science.

## 21. Learning readiness matrix

| Capability | Current evidence | Classification | Required condition |
| --- | --- | --- | --- |
| Chart structure | Fixture chart and workspace summaries | AVAILABLE_DEVELOPMENT_ONLY | Admit authoritative ChartResult. |
| Planets and signs | Body/sign fields and lesson hooks | AVAILABLE_DEVELOPMENT_ONLY | Preserve authority and incomplete state. |
| Houses and angles | Result fields and known-time prerequisite | PARTIAL | Close time authority and birth-time behavior. |
| Major aspects | Engine semantics and Web aspect facts | PARTIAL | Close configuration/provenance and fact references. |
| Calculation details | Status and research notice | AVAILABLE_DEVELOPMENT_ONLY | Bind to admitted metadata. |
| Personal chart context | Static lesson links | PARTIAL | Freeze a personal evidence projection. |
| Current sky/transits | Sky fixture and conceptual contract | FIXTURE_ONLY | Production sky and transit authority. |
| Time-dependent learning | Unknown-time suppression rules | PARTIAL | Authoritative local/historical timezone resolution. |
| Current-signal interpretation | Weekly Signal POC | AVAILABLE_DEVELOPMENT_ONLY | Production catalog, temporal evidence, and policy. |
| Responsible use | Existing lesson/context language | AVAILABLE_DEVELOPMENT_ONLY | Retain; do not use it as a substitute for evidence. |

## 22. ReadingModel evidence gaps

| Concern | Current state | Classification | Gap |
| --- | --- | --- | --- |
| Hero headline | Editorial draft field exists | AVAILABLE_DEVELOPMENT_ONLY | G6, G8 |
| Weekly overview | Model field exists | AVAILABLE_DEVELOPMENT_ONLY | G5, G6, G7 |
| Three core themes | Theme slots exist | AVAILABLE_DEVELOPMENT_ONLY | Domain evidence and prioritization open |
| Relationship/Work/Emotional domains | Domain slots exist | PARTIAL | Natal/temporal distinction and rules open |
| Timeline | Model field exists | BLOCKED_TIME_AUTHORITY | Needs authoritative windows |
| Watch out/Best window | Presentation slots exist | BLOCKED_SIGNAL_SEMANTICS | Needs evidence and policy |
| Astrologer view | Style exists | AVAILABLE_DEVELOPMENT_ONLY | Voice cannot create missing science |
| Share card | Model field exists | BLOCKED_PRESENTATION | Needs authority, privacy, and share policy |
| Traceability | Internal source traces exist | PARTIAL | Need stable public identities |
| Production eligibility | Explicitly false | BLOCKED_READING_MODEL | Correctly remains blocked |

The remedy is to close the evidence chain first, not to add more copy fields.

## 23. Weekly R2 root cause

The Weekly R2 limitation is primarily evidence, not layout:

1. Composition is strong, but default presentation exposes broad categories more
   clearly than named, traceable astrology evidence.
2. The POC uses development fixture signals and a fixed period.
3. Transit-to-natal, Moon/time authority, provider identity, and operational
   provenance are open.
4. Voice variants alter delivery but do not establish signal semantics.
5. The ReadingModel intentionally remains development-only.

The correct classification is DEVELOPMENT RESEARCH ARTIFACT, not another visual
polish pass or more placeholder prose.

## 24. Content voice and audience separation

The POC demonstrates CLEAR, CASUAL, ASTROLOGER, and SHARE presentation styles.
This is a useful presentation experiment, not production readiness. An admitted
ReadingModel must derive all styles from the same authoritative signal set and
preserve the same period/evidence identity across styles.

Source facts, authority, signal semantics, interpretation policy, audience voice,
and presentation/share formatting must remain separate. Duplicating content per
surface before source authority is closed would create competing truths.

## 25. Public horoscope readiness

Public horoscope requires a public temporal source, non-personal scope, period
and timezone semantics, provider/configuration/provenance identity, uncertainty
policy, stable rendering, share-safe presentation, and separation from natal
interpretation.

The current Public Sky contract and fixture do not close this. Classification:
BLOCKED_PUBLIC_CONTRACT and PRODUCTION_AUTHORITY_BLOCKED_PROVIDER. Gaps: G3, G5, G6, G8,
G9. No public horoscope implementation should start from the Weekly POC.

## 26. FOLLOW and recurrence readiness

FOLLOW/recurrence requires an admitted periodic source, immutable period identity
and deduplication, user-owned subscription state, missed/unavailable evidence
handling, privacy and notification policy, and an explanation of why the user
receives the item.

None may be inferred from the Weekly draft or ReadingModel. Classification:
PARTIAL for product direction, with G9 policy still open, plus G2, G5, and G7.

## 27. Product surface readiness summary

| Surface | Readiness | Safe claim now | Must not claim |
| --- | --- | --- | --- |
| My Chart | AVAILABLE_DEVELOPMENT_ONLY | Stable chart structure with research notice | Production science from UI_FIXTURE_V1 |
| Learn-from-your-chart | PARTIAL | Generic Foundations and prototype links | Personal authority without admitted ChartResult |
| Weekly | AVAILABLE_DEVELOPMENT_ONLY | Signal/editorial/ReadingModel composition | Production weekly horoscope |
| Today | BLOCKED_PUBLIC_CONTRACT | Future direction | Current personalized timing |
| Month | BLOCKED_READING_MODEL | Future direction | Authoritative event windows |
| Relationships | PARTIAL | Stable chart education | Recurring/current forecast |
| Love | PARTIAL | Stable chart education | Deterministic current claims |
| Money | PARTIAL | Careful stable resource symbolism | Financial prediction or current risk guidance |
| Astrology Anchors | AVAILABLE_DEVELOPMENT_ONLY | Stable reference categories | Temporal activity without temporal evidence |
| Public horoscope | PRODUCTION_AUTHORITY_BLOCKED_PROVIDER | Future acquisition surface | Production horoscope from fixtures |
| FOLLOW/recurrence | PARTIAL | Future behavior | Notifications from development drafts |

## 28. Option comparison and selected surface

| Option | Evidence dependency | Current risk | Decision |
| --- | --- | --- | --- |
| A — Weekly product | Full temporal Signal and ReadingModel authority | High; most critical gates are open | Do not select now |
| B — Public horoscope | Temporal provider, public contract, SEO/content policy | High; acquisition amplifies unverified claims | Do not select now |
| C — Today/Month | Current sky, event windows, time authority, aggregation | High; unresolved temporal chain | Do not select now |
| D — My Chart + contextual Learn | Stable natal facts, chart workspace, calculation details, Foundations hooks | Medium; requires authority gate but is bounded | Select conditionally |

Selected surface: Option D, My Chart plus contextual Learn. This is an
evidence-based selection, not permission to implement against a fixture.

## 29. Exact recommended next task

Proposed next task:

WEB-P2-MY-CHART-CONTEXTUAL-LEARN-001 — Freeze the target authoritative
chart-evidence projection, the development-only contextual Foundations
prototype boundary, and the runtime authority check required before any
production claim.

Preconditions and limits:

1. Confirm whether an admitted Engine/BFF ChartResult path exists. If it does
   not, the task may define and prototype the projection in Stage A only; it
   must not label the result authoritative while PROVIDER DECISION DEFERRED
   remains unresolved.
2. Define one target projection from ChartResult to personal Learn context; do
   not create a duplicate fact store or imply that the target projection is
   already a production authority.
3. Preserve INCOMPLETE_RESEARCH and unknown-birth-time states visibly.
4. Limit the first slice to stable natal evidence: structure, placements,
   houses/angles when birth time is known, major aspects, and calculation
   details.
5. Do not add transits, Weekly, Today, Month, public horoscope, recurring
   FOLLOW, or provider selection.

The task should stop if its authority precondition fails; it must not substitute
WEB_UI_FIXTURE_V1 or the development Sky fixture.

## 30. Gap-to-action map

| Gap | Evidence-backed action before product admission |
| --- | --- |
| G1 | Confirm missing Engine capability or narrow the product claim. |
| G2 | Close provider, rights, configuration, provenance, and time gates. |
| G3 | Freeze the smallest public BFF contract that exposes needed evidence. |
| G4 | Bind BFF and runtime to admitted authority; keep mock mode explicit. |
| G5 | Freeze domain signal semantics, eligibility, priority, and temporal windows. |
| G6 | Admit interpretation rules/content policy only after source evidence is authoritative. |
| G7 | Add ReadingModel fields only when backed by traceable evidence. |
| G8 | Design presentation around inspectability and visible incomplete states. |
| G9 | Freeze policy for recurring, consequential, public, and shareable content. |

## 31. Conditions for future production admission

- Chart or Sky result comes through the BFF, not directly from a provider.
- Provider selection, rights, and operational identity are approved.
- Configuration and provenance metadata are truthful and complete when marked
  complete.
- Incomplete results remain incomplete and are never silently promoted.
- Local and historical time semantics are authoritative for the surface.
- Signal rules distinguish stable natal facts from current/temporal facts.
- Temporal windows come from authoritative evidence, not the UI or ReadingModel.
- ReadingModel traces are stable and inspectable.
- Presentation exposes authority and uncertainty without overwhelming the reader.
- Public, share, and recurring surfaces have separately approved policy.

## 32. Change record and repository boundary

This reconciliation changes documentation only in C:\NatalNode-Web:

- this evidence-gap architecture document;
- one architecture-index link;
- no Engine, Web runtime, contract, test, fixture, migration, provider, or
  database changes;
- no provider selection;
- no start of the recommended next task.

The Engine repository was read-only. Its pre-existing untracked
C:\NatalNode\CODEX_EPH_SPIKE_001.md remains untouched. No Engine commit was
created.

## 33. Final decision

    WEB-P2-CONTENT-EVIDENCE-GAP-001
    RECONCILED_WITH_CONDITIONS
    MODULE_PASS
    ENGINE_READ_ONLY
    ENGINE_MODIFIED_NO
    PROVIDER DECISION DEFERRED
    NO_LARGE_REFACTOR_REQUIRED
    NEXT_PRODUCT_SURFACE_SELECTED_BY_EVIDENCE

The selected next product surface is the bounded My Chart plus contextual Learn
slice in section 29. Temporal content, public horoscope, FOLLOW, and recurring
value remain out of scope until their evidence and policy gates are independently
closed.
