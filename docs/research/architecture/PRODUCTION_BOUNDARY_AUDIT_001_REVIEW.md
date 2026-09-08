# Production Boundary Audit 001 Review

**Baseline:** `925790b2f07cfb47006685acce191e6cb69f17d4`

**Result:** `PASS` after narrow isolation fixes

## Production reachability findings

The initial source graph exposed four material classes of production leakage.
All were corrected before freezing the guard.

| Source | Target/path | Classification | Runtime reachable at baseline | Baseline violation | Disposition |
| --- | --- | --- | --- | --- | --- |
| normal home routes | `ChartExperience` -> `BirthInputForm` -> `DevelopmentBirthInputResolver` | `DEVELOPMENT_ONLY` | yes | yes | moved the chart experience to `/dev/chart`; normal home remains a production-safe current-sky/editorial surface |
| normal Learn routes | `educational-chart-source` -> `MockEngineClient` -> `test-fixtures` | development/test | yes | yes | moved fixture-backed chart rendering to `/dev/educational-chart`; normal Learn is text-only |
| production chart workspace via interpretation barrel | research Signal, Weekly, selector and synthesis POCs re-exported by `features/interpretation/index.ts` | `RESEARCH_ONLY` / `MECHANISM_ONLY` | yes | yes | removed research re-exports from the production barrel; research modules remain available by explicit dev/test imports |
| `server-main` and package consumers | development executable bindings and the engine-client root re-export of `MockEngineClient` | `DEVELOPMENT_ONLY` / `TEST_ONLY` | yes | yes | made `server:start` production-only and fail-closed; moved Mock to explicit `@natalnode/engine-client/mock` subpath |

Post-fix discovery covers 72 normal Web roots and 11 explicit production
server/feature/package roots. The graph contains 552 repository modules at this
revision. The final production audit reports zero forbidden reachable modules,
markers, unresolved internal runtime imports, or forbidden provider imports.

Development discovery contains the explicit `/dev` pages and the two server
development compositions. Test discovery covers current Web/server tests and
repository test scripts. The exact counts are asserted by topology rather than
frozen as product semantics, so adding a legitimate root does not require a
count-only config change.

## Current architecture answers

1. Non-dev user route reachable from a POC: **NO**.
2. Production server root reachable from research/dev-only code: **NO**.
3. Mechanism-only fixture reachable from normal runtime: **NO**.
4. `MockEngineClient` reachable from a production browser root: **NO**.
5. Web or BFF concrete astronomy provider import: **NO**.
6. Web/BFF authoritative astronomy calculation found: **NO**. Rendering and
   interpretation only consume supplied positions, aspects, orbs, and status.
7. Research interpretation artifacts registered into production: **NO**.
   Production interpretation admission remains `NONE / NOT_ADMITTED`.
8. `/dev` source reachability isolation: **PASS**. Production build artifact
   exclusion is not yet enforced; emitted unavailable shells remain separate
   pre-launch debt.
9. Test-only module isolation: **PASS**.
10. Current production admission violation: **NO**.
11. Pre-existing migration debt: **YES**, nine exact shared-layer edges.
12. Unknown-time propagation: **partially structurally protected**; a separate
    authority-hardening campaign is required before runtime admission.

## Engine and BFF audit

Production Web constructs `HttpEngineClient` only as the BFF transport and uses
the `EngineClient` interface. Server application dependencies receive an
`EngineClient`; chart/sky routes validate and delegate. No concrete astronomy
provider, Engine implementation, position/house/aspect/transit calculator, or
fixture fallback was found in the production-reachable graph.

`server:start` does not silently select a development mock. It parses explicit
production configuration and then fails closed because production EngineClient
composition is not admitted. Development mock composition remains explicit in
the local/public-development entrypoints. `PROVIDER DECISION DEFERRED`.

## Existing dependency debt

Nine existing `apps/web/src/lib` imports point upward into core/features. Their
exact source-target pairs are frozen in
`scripts/architecture/production-boundaries.config.mjs`. The guard accepts only
those exact edges and rejects any addition. This debt does not create a current
research/runtime leak and is not launch-blocking for this campaign. Future
removal should begin with characterization when product work naturally touches
those modules. No broad decomposition or unrelated large-file refactor occurred.

## Unknown-time audit

The input and Web request model can represent `UNKNOWN_TIME` with null local
time, resolved UTC instant, and offset. Presentation policy removes ASC, MC,
houses, and house interpretation. Vault input authority rejects inconsistent
draft/resolution combinations, and persisted chart state is validated on reload.

The BFF request validator currently validates constituent fields but does not
fully enforce all unknown-time cross-field combinations. Engine result
validation is also not correlated with the originating request and no per-fact
time-authority certification exists. This is not silently treated as complete.
It is not a current production-reachable blocker because production chart and
research interpretation admission are both absent, but it is a required
separate campaign before those admissions.

## Automated enforcement review

The guard is `npm run test:production-architecture-boundaries`. It parses the
actual import graph and includes synthetic negative cases A-N for direct and
transitive research reachability, mechanism fixtures, MockEngineClient,
provider imports, type-only EngineClient usage, exact debt baselining, new debt,
and repeatability. It adds no dependency and uses no production-source failure
fixture.

Current gates:

```text
PRODUCTION_ROOT_MODEL                         PASS
RESEARCH_CLASSIFICATION                      PASS
TRANSITIVE_REACHABILITY_GUARD                PASS
INTERPRETATION_ADMISSION_FIREWALL             PASS
MECHANISM_ONLY_FIREWALL                      PASS
DEV_ROUTE_ISOLATION                          PASS
TEST_ISOLATION                               PASS
MOCK_ENGINE_PRODUCTION_ISOLATION             PASS
ENGINE_PROVIDER_BOUNDARY                     PASS
NO_WEB_ASTRONOMY                             PASS
NO_BFF_RECOMPUTATION                         PASS
CORE_FEATURE_BOUNDARY_AUDIT                  PASS
BASELINE_DEBT_HANDLING                       PASS
UNKNOWN_TIME_ARCHITECTURE_AUDIT              PASS
DETERMINISTIC_ARCHITECTURE_GUARD             PASS

CURRENT_PRODUCTION_RESEARCH_LEAK              NO
MATERIAL_PREPROD_BLOCKER                      NO

READY_FOR_HOUSE_ANGLE_SEMANTIC_GATE           YES
READY_FOR_PRODUCTION_ENGINE_INTEGRATION       NO
READY_FOR_PRODUCTION_INTERPRETATION           NO
READY_FOR_PRODUCTION_MY_CHART                 NO
READY_FOR_PUBLIC_LAUNCH                       NO

RUNTIME_ADMISSION                             NO
```
