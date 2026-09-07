# Personal Chart Coverage Architecture V1 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-PERSONAL-CHART-COVERAGE-001` |
| Baseline | `bb98a73203ac04c4776683babac27f6a5ae5ac13` |
| Review result | `PERSONAL_CHART_COVERAGE_ARCHITECTURE_PASS` |
| Matrix | [`PERSONAL_CHART_COVERAGE_MATRIX_V1.json`](./PERSONAL_CHART_COVERAGE_MATRIX_V1.json) |
| Runtime | `RUNTIME_NOT_ADMITTED` |
| Broad scale | `NO` |

## 1. Owner decision summary

The architecture passes as a selective coverage model for future NatalNode
personal chart work. It freezes the distinction between chart coverage and
reader-facing card count, records a complete target layer set, and keeps the
current representative POCs bounded.

The result is:

```text
READY_FOR_TARGETED_COVERAGE_EXPANSION YES
READY_FOR_BROAD_SCALE NO
READY_FOR_PRODUCTION_MY_CHART NO
RUNTIME_ADMISSION NO
```

This is a documentation and machine-auditable matrix change. It does not
modify Engine, BFF, provider, astronomy, chart contracts, My Chart runtime,
AI, or the existing interpretation path.

## 2. Coverage model audit

The matrix contains the requested mature conceptual layers:

1. core identity/orientation;
2. inner response/need;
3. thinking/naming;
4. relating/valuing;
5. action/desire;
6. angles/orientation to life;
7. houses/life context;
8. planet–planet relationships;
9. repeated themes/convergence;
10. relational enrichment;
11. counterevidence/trade-offs;
12. life-domain synthesis;
13. personal editorial output; and
14. WHY/LEARN/Astrologer's View.

Each capability records the required chart facts, semantic method, Signal
policy, synthesis role, birth-time dependency, source support, policy
admission, implementation state, production authority state, current usability,
missing dependencies, and next gate.

## 3. Current evidence versus target coverage

The following bounded evidence is reused without upgrading its authority:

| Evidence | Current state in matrix |
| --- | --- |
| Sun, Moon, Mercury, Venus, Mars primitive vocabulary | `SOURCE_READY`; the targeted Sun/Venus/Mars records now join the original Moon/Mercury Body × Sign proof without implying full matrix coverage. |
| Moon/Mercury × Aries/Taurus placement compositions | `BOUNDED_POC_ONLY`; four original placement units, one evidence unit each. |
| Sun × Aries, Venus × Taurus, Mars × Aries expansion | `BOUNDED_POC_ONLY`; three targeted placement units, one evidence unit each, with distinct body functions and derived sign layers. |
| Seven placement Signal rules | `BOUNDED_POC_ONLY`; `NEUTRAL`, `SUBTLE`, `LOW`, fail closed, and no chart-level selector admission. |
| Moon–Mercury conjunction/trine/square/opposition methods and Signals | `BOUNDED_POC_ONLY`; no broader pair or production catalog. |
| Shared-root relational synthesis | `BOUNDED_POC_ONLY`; one coherent conjunction bundle proves enrichment and subsumption. |
| Relational My Chart reader projection | `BOUNDED_POC_ONLY`; development-only route and research disclosure. |
| ASC, MC, houses, and aspect chart contract shapes | `CONTRACT_ONLY`; not a personal semantic method or production authority. |
| Jupiter through Pluto personal-body coverage | Not assumed; current `PERSONAL_BODIES.md` scope stops at Sun through Mars. |

The matrix deliberately distinguishes `SOURCE_READY`, `BOUNDED_POC_ONLY`,
`NOT_ADMITTED`, `FUTURE_SCOPE`, and `CONTRACT_ONLY`. No POC status is treated
as production readiness.

## 4. Five-dimension readiness audit

Every capability contains these separate fields:

```text
SOURCE_READINESS
SEMANTIC_METHOD_READINESS
SIGNAL_POLICY_READINESS
SYNTHESIS_READINESS
PRODUCTION_FACT_AUTHORITY
```

The representative Moon × Aries, Moon × Taurus, Mercury × Aries, and Mercury ×
Taurus rows remain bounded-ready through research synthesis. The targeted Sun ×
Aries, Venus × Taurus, and Mars × Aries rows are source, semantic-method, and
Signal-policy ready, while chart-level synthesis and production fact authority
remain unavailable because those gates are not closed.

The following distinctions are explicit and tested:

```text
source support != policy admission
semantic readiness != Signal readiness
semantic readiness != production fact authority
editorial priority != interpretive confidence
```

## 5. Primary theme budget and hierarchy

The mature My Chart target is **3–5 core themes**. It is neither a minimum nor
a quota:

- fewer than three is valid when authority or admitted semantics are
  insufficient, or when deduplication/subsumption leaves fewer distinct
  themes;
- more than five candidates are handled through deterministic selection,
  semantic merge only where admitted, relational subsumption, supporting
  threads, or redundancy suppression; and
- a theme selected for primary visibility does not become `HIGH`, `STRONG`, or
  `DOMINANT` merely because it was selected.

The three levels are:

1. `CORE_PERSONAL_THEMES` — primary, specific, distinct, supported themes;
2. `SUPPORTING_THREADS` — WHY, “also in your chart,” context, or secondary
   exploration; and
3. `TECHNICAL_LEARNING_DEPTH` — WHY, Learn, Astrologer's View, and provenance.

One fact is not one card. One domain is not one card. Sun, Moon, and ASC do not
automatically become three cards.

## 6. Selection and domain policy

The future selector is ordinal and deterministic. It gates authority,
eligibility, semantic distinctness, convergence, relational enrichment,
counterevidence, redundancy, useful domain breadth, and WHY/LEARN completeness,
then uses stable identity ordering for unresolved ties. No new arbitrary
numeric weights are frozen.

The existing six domains remain exactly:

```text
SELF
EMOTIONAL
RELATIONSHIP
COMMUNICATION
WORK_CREATION
ACTION_DECISION
```

Domain breadth is a quality consideration, not a one-per-domain quota. Domain
assignment must come from integrated composition semantics; a body-only lookup
is not accepted.

## 7. Synthesis, relational role, and redundancy

Independent convergence requires separate evidence roots plus admitted semantic
overlap. Shared sign, same domain, repeated words, or a duplicate fact is not
convergence.

Relational enrichment is a distinct synthesis operation:

```text
Moon placement unit
  + Mercury placement unit
  + Moon–Mercury aspect unit
  -> one enriched theme when compatibility is admitted
  -> three semantic units
  -> two unique astronomical roots
```

The relation can subsume shallow placement themes and retain their provenance
in WHY. It does not create a third root, confidence promotion, intensity
promotion, or a standalone aspect card by default.

Counterevidence is reserved for a separately admitted unit that qualifies,
complicates, narrows, supports, splits, or suppresses a candidate. The
architecture records the need and boundary, but does not pretend that a full
counterevidence policy is already implemented.

Redundancy suppression removes repeated reader meaning while keeping evidence
and method traceable. Conflict and duplicate remain distinct: a duplicate may
be suppressed; an inconsistent same-body/different-sign fixture must fail
closed rather than be deduped arbitrarily.

## 8. Unknown-time and production authority

Unknown time is explicit and first-class. A result may retain authoritative
time-safe body/sign placements, but it removes ASC, MC, houses, house themes,
angle relations, and uncertified time-sensitive aspects. No noon, midnight,
average, guessed, or fabricated time is allowed.

The Web chart contract can describe bodies, angles, houses, and aspects. That
is not equivalent to a closed production authority chain. The current provider
decision and scientific configuration remain deferred, and development/
research fixtures remain development-only. No matrix row authorizes Web-side
astronomy or production runtime wiring.

## 9. Prioritized next gate audit

The recommended order is:

1. chart-level ordinal selector contract;
2. personal Body × Sign expansion for admitted Sun through Mars scope;
3. bounded Body × Sign × House method and house-system policy;
4. aspect pair/type expansion with an explicit sextile decision; and
5. counterevidence and chart-level convergence policy.

These are research and semantic gates. Provider/scientific authority and
production My Chart remain later, independent gates.

## 10. Validation gates

| Gate | Result |
| --- | --- |
| `MATURE_COVERAGE_MODEL` | `PASS` |
| `READINESS_DIMENSION_SEPARATION` | `PASS` |
| `PRIMARY_THEME_BUDGET` | `PASS` |
| `SUPPORTING_THREAD_MODEL` | `PASS` |
| `NO_CARD_EXPLOSION` | `PASS` |
| `DOMAIN_BREADTH_WITHOUT_QUOTA` | `PASS` |
| `RELATIONAL_SYNTHESIS_ROLE` | `PASS` |
| `SUBSUMPTION_POLICY` | `PASS` |
| `REDUNDANCY_POLICY` | `PASS` |
| `COUNTEREVIDENCE_ARCHITECTURE` | `PASS` |
| `UNKNOWN_TIME_DEGRADATION` | `PASS` |
| `PRODUCTION_AUTHORITY_BOUNDARY` | `PASS` |
| `NEXT_GATE_PRIORITIZATION` | `PASS` |
| `READY_FOR_TARGETED_COVERAGE_EXPANSION` | `YES` |
| `READY_FOR_BROAD_SCALE` | `NO` |
| `READY_FOR_PRODUCTION_MY_CHART` | `NO` |
| `RUNTIME_ADMISSION` | `NO` |
