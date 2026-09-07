# Chart-Level Convergence and Counterevidence POC Review

Task: `WEB-P2-CHART-CONVERGENCE-COUNTEREVIDENCE-001`

Baseline: `6620b1979096bb290f854756c3fd7e427a4f82ee`

Status: `PASS / BOUNDED_MECHANISM_PROOF`

Runtime admission: `NO`

## Admission audit

The current bounded astrology inventory does not contain either of the two
positive cases required for a responsible chart-wide claim:

- `ASTROLOGY_INDEPENDENT_CONVERGENCE_CASE_ADMITTED = NO`
- `ASTROLOGY_COUNTEREVIDENCE_CASE_ADMITTED = NO`

The admitted placement questions are distinct, and the admitted square,
opposition, and conjunction relations reuse their participating position roots.
Same sign, same domain, similar wording, negative-sounding language, or a
shared root cannot be promoted into either classification.

The POC therefore uses only explicitly labelled
`MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE` candidates for positive convergence,
qualification, narrowing, and overbroad-claim suppression. The fixtures use
synthetic root names and carry no astrology or astronomy authority.

## Independent convergence

The classifier requires both:

1. pairwise-disjoint source root sets; and
2. an explicit deterministic `SHARED_LIFE_QUESTION` admission containing a
   question, integrated basis, and closed domain.

The output uses the unique set union of roots, preserves each source theme and
semantic unit, and marks the sources `CONVERGED_SUPPORTING_SOURCE`. It produces
one selector candidate, so the two sources plus the converged result do not
become three Core cards. `INDEPENDENTLY_SUPPORTED` is preserved as editorial
selection metadata only; direction, intensity, and confidence remain unchanged.

## Counterevidence

The classifier requires an explicit `QUALIFYING_LIFE_QUESTION`, a distinct
semantic unit, and at least one qualifier root not already contained by the
target root set. The POC proves:

- `QUALIFY` — keep one theme with a bounded condition;
- `NARROW` — replace an overbroad claim with a narrower claim; and
- `SUPPRESS_OVERBROAD` — suppress the visible claim while retaining the full
  source and decision provenance.

Each result remains one selector candidate. No negative score, confidence
decrease, intensity decrease, direction change, or second counterevidence card
is created.

If all qualifier roots are already inside the target root set, the result is
`RELATIONAL_ENRICHMENT` with `INTERNAL_TENSION` scope. This keeps square and
opposition semantics from becoming automatic counterevidence. Conflict,
duplicate, and redundancy remain separate classifications.

## Selector and provenance

The existing chart-level ordinal selector is reused. A synthesized result is
adapted into the selector's existing candidate contract and retains:

- source theme IDs;
- source semantic units and root sets;
- unique root accounting;
- overlap policy identity and decision;
- source theme states;
- claim-scope state;
- WHY references;
- source facts and Learn references; and
- runtime/authority boundaries.

No source theme is labelled relationally `SUBSUMED` for independent
convergence. The selector remains a maximum-five, no-hard-minimum, no-score
selection POC.

## Targeted scenario evidence

| Scenario | Expected result | Result |
| --- | --- | --- |
| Disjoint mechanism roots + explicit shared question | `INDEPENDENT_CONVERGENCE`, root union 2 | PASS |
| Same Aries/Taurus sign placements | Not convergence | PASS |
| Same domain with distinct questions | Not convergence | PASS |
| Same wording without admission | Not convergence | PASS |
| Existing Moon–Venus shared-root bundle | `RELATIONAL_ENRICHMENT`, not convergence | PASS |
| Mechanism qualifier with independent root | `COUNTEREVIDENCE` + `QUALIFY` | PASS |
| Mechanism qualifier with narrowing effect | `COUNTEREVIDENCE` + `NARROW` | PASS |
| Overbroad mechanism claim | `COUNTEREVIDENCE` + `SUPPRESS_OVERBROAD` | PASS |
| Same-root square/opposition tension | Not chart-level counterevidence | PASS |
| Moon Aries + Moon Taurus | `CONFLICT`, fail closed | PASS |
| Exact duplicate | `DUPLICATE`, no root growth | PASS |
| Equivalent reader meaning | `REDUNDANCY`, no root growth | PASS |
| Converged selector input | One Core candidate, source states preserved | PASS |
| Qualified selector input | One qualified Core candidate, no extra card | PASS |

## Gates

- `CLASSIFICATION_TAXONOMY` — PASS
- `INDEPENDENT_ROOT_REQUIREMENT` — PASS
- `SEMANTIC_OVERLAP_REQUIREMENT` — PASS
- `INDEPENDENT_CONVERGENCE` — PASS
- `RELATIONAL_ENRICHMENT_SEPARATION` — PASS
- `COUNTEREVIDENCE_ROOT_INDEPENDENCE` — PASS
- `COUNTEREVIDENCE_QUALIFICATION` — PASS
- `COUNTEREVIDENCE_NARROWING` — PASS
- `NO_NEGATIVE_ASPECT_SHORTCUT` — PASS
- `NO_FALSE_CONVERGENCE` — PASS
- `NO_EVIDENCE_INFLATION` — PASS
- `NO_CONFIDENCE_PROMOTION` — PASS
- `NO_INTENSITY_PROMOTION` — PASS
- `CONVERGED_SOURCE_STATE` — PASS
- `SELECTOR_INTEGRATION` — PASS
- `NO_CARD_EXPLOSION` — PASS
- `PROVENANCE_PRESERVATION` — PASS
- `DETERMINISTIC_POLICY` — PASS
- `ASTROLOGY_CASE_ADMISSION_INTEGRITY` — PASS

`READY_FOR_HOUSE_ANGLE_SEMANTIC_GATE YES`

`READY_FOR_PRODUCTION_CONVERGENCE NO`

`READY_FOR_PRODUCTION_COUNTEREVIDENCE NO`

`READY_FOR_PRODUCTION_MY_CHART NO`

`READY_FOR_BROAD_SCALE NO`

`RUNTIME_ADMISSION NO`
