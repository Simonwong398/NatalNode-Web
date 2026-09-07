# Shared-Root Relational Synthesis POC Review

Task: `WEB-P2-SHARED-ROOT-SYNTHESIS-001`
Baseline: `65805841a497181d5fc2c1d0b2fbda33a964fc1a`
Status: `RESEARCH_POC_PASS`
Runtime status: `RUNTIME_NOT_ADMITTED`

## Scope

This POC consumes three already-structured representative Signals:

- Moon × Aries placement Signal;
- Mercury × Aries placement Signal;
- Moon conjunction Mercury Aspect Signal.

It reuses the existing placement Signal adapter and Personal Synthesis
coherence guard. It does not calculate astronomy, create ChartFacts, call a
provider, invoke AI, or export the adapter through the production interpretation
index. Every source remains `INCOMPLETE_RESEARCH` and `DEVELOPMENT_ONLY`.

The `KNOWN` flag used by the positive research scenario is a synthesis-scope
fixture flag only. It is not an Engine result or a fabricated timestamp. The
unknown-time scenario is separately checked and remains placement-only.

## Frozen accounting model

| Input | Semantic units | Semantic dimensions | Astronomical roots | New independent roots |
| --- | ---: | ---: | ---: | ---: |
| Moon × Aries placement | 1 | placement dimensions | Moon position | 1 |
| Mercury × Aries placement | 1 | placement dimensions | Mercury position | 1 |
| Moon conjunction Mercury Aspect | 1 relational unit | 3 | Moon + Mercury positions | 0 |
| Combined bundle | **3** | placement + relational dimensions | **2 unique roots** | **2 total** |

The Aspect relation is retained as one `BODY_ASPECT_BODY` semantic unit with
three dimensions. It is not counted as three units and does not create a third
astronomical root. Root deduplication, semantic-unit deduplication, and
relational enrichment are separate operations.

The positive result therefore changes semantic depth from two placement units to
three total semantic units while keeping `uniqueRootCount = 2`,
`independentEvidenceUnitCount = 2`, `relationalFactIndependentEvidenceIncrement
= 0`, `evidenceInflation = 0`, `confidence = LOW`, and `intensity = SUBTLE`.

## Compatibility and domain policy

Shared roots alone do not qualify for enrichment. The bounded compatibility rule
requires exactly one Moon placement, one Mercury placement, the admitted Moon
conjunction Mercury relation, the two expected position roots, and an integrated
semantic basis containing:

- `body.moon`;
- `body.mercury`;
- `aspect.relation.conjunction`.

The output is classified as `RELATIONAL_ENRICHMENT`, not
`INDEPENDENT_CONVERGENCE`. The relational unit adds interaction meaning over
the already-used roots; it does not increase evidence strength.

The enriched theme selects `COMMUNICATION` from the integrated question of how
Moon response and Mercury naming meet in close exchange. This is an explicit
`INTEGRATED_THEME_SEMANTICS` decision with `majorityVote = false`. It does not
use a universal body-to-domain lookup or a two-versus-one domain vote.

The enriched theme remains `NEUTRAL`, `SUBTLE`, and `LOW`. It subsumes the two
shallow placement themes and emits no standalone Aspect card.

## Scenario validation

| Scenario | Inputs | Result |
| --- | --- | --- |
| A | Moon Aries + Mercury Aries + Moon conjunction Mercury; known synthesis scope | 2 roots, 3 units, one enriched theme, two placement themes subsumed |
| B | Moon Aries + Mercury Aries | 2 roots, 2 units, two separate placement themes, no enrichment |
| C | A plus duplicate Aspect Signal | duplicate relational fact suppressed; 2 roots, 3 units, one enrichment, no promotion |
| D | Shared roots with a deliberately nonmatching semantic basis | `NO_RELATIONAL_ENRICHMENT`; no root-only convergence |
| E | Moon Aries + Moon Taurus, with or without relation | `CONFLICTING_BODY_SIGN_PLACEMENT`; no arbitrary sign selection or synthesis |
| F | Unknown-time Moon Taurus + Mercury Aries | two placement themes only; no Aspect enrichment, ASC, MC, houses, or fabricated time |

Duplicate and conflict remain different states:

- Moon Aries + Moon Aries is one surviving placement unit with duplicate suppression;
- Moon Aries + Moon Taurus is an invalid same-body placement conflict.

Different bodies may share Aries or occupy different signs. That does not create
a placement conflict.

## Provenance and editorial trace

The enriched theme keeps placement provenance in two separate placement chains
and Aspect provenance in a separate relational chain. Each chain preserves its
Signal ID, rule identity, source fact references, semantic unit, roots, WHY
references, and LEARN references. The enriched WHY trace records the three
source semantic units, the two unique roots, the compatibility rule, and the
zero evidence-inflation result.

Subsumption is explicit through `subsumedThemeIds` and
`SUBSUMES_PLACEMENT_THEMES`; it is not an untraceable replacement or a third
independent candidate.

## Gates

| Gate | Result |
| --- | --- |
| SHARED_ROOT_ACCOUNTING | PASS |
| SEMANTIC_UNIT_ACCOUNTING | PASS |
| ROOT_DEDUPLICATION | PASS |
| SEMANTIC_UNIT_DEDUPLICATION | PASS |
| RELATIONAL_ENRICHMENT | PASS |
| SEMANTIC_COMPATIBILITY | PASS |
| NO_FALSE_CONVERGENCE | PASS |
| NO_EVIDENCE_PROMOTION | PASS |
| NO_CONTENT_INFLATION | PASS |
| SUBSUMPTION_TRACEABILITY | PASS |
| DOMAIN_DERIVATION | PASS |
| SEMANTIC_FIDELITY | PASS |
| PROVENANCE_PRESERVATION | PASS |
| LOGICAL_CHART_COHERENCE | PASS |
| UNKNOWN_TIME_DEGRADATION | PASS |
| NO_FAKE_ENGINE_AUTHORITY | PASS |
| DETERMINISTIC_SYNTHESIS | PASS |

## Readiness

`READY_FOR_RELATIONAL_MY_CHART_POC YES`
`READY_FOR_PRODUCTION_SHARED_ROOT_SYNTHESIS NO`
`READY_FOR_BROAD_SCALE NO`
`RUNTIME_ADMISSION NO`
