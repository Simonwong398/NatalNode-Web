# NatalNode Chart-Level Convergence and Counterevidence Policy V1

Status: `ARCHITECTURE_FROZEN_WITH_CONDITIONS`

Task: `WEB-P2-CHART-CONVERGENCE-COUNTEREVIDENCE-001`

Runtime admission: `NO`

This policy freezes two bounded chart-level synthesis mechanisms for the
development/research POC: `INDEPENDENT_CONVERGENCE` and `COUNTEREVIDENCE`.
It extends the existing Personal Synthesis and ordinal selector boundaries; it
does not create a second selector, calculate astronomy, or authorize My Chart
or production interpretation.

## 1. Current admission audit

The currently admitted astrology inventory was audited before the mechanisms
were constructed.

- `ASTROLOGY_INDEPENDENT_CONVERGENCE_CASE_ADMITTED = NO`: the admitted Body ×
  Sign candidates have distinct explicit life-questions. Same sign, same
  domain, similar words, or a shared body do not constitute an admitted
  overlap. Existing relational Signals reuse their participating roots.
- `ASTROLOGY_COUNTEREVIDENCE_CASE_ADMITTED = NO`: current square and opposition
  semantics describe relational tension over their own participating roots.
  No separately rooted qualifying semantic unit is currently admitted.
- Positive classifier demonstrations therefore use explicit
  `MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE` inputs. They are not astrology claims,
  ChartFacts, provider results, or production evidence.

This is an epistemic boundary, not a missing test. The mechanism is proved
without inventing a positive astrology case.

## 2. Classification boundary

The deterministic precedence is:

```text
CONFLICT
  -> DUPLICATE
  -> REDUNDANCY
  -> COUNTEREVIDENCE
  -> RELATIONAL_ENRICHMENT
  -> INDEPENDENT_CONVERGENCE
  -> DISTINCT
```

The meanings remain separate:

| Classification | Required condition | Effect |
| --- | --- | --- |
| `INDEPENDENT_CONVERGENCE` | Pairwise-disjoint source root sets plus an explicitly admitted shared life-question. | One synthesized theme; source themes remain `CONVERGED_SUPPORTING_SOURCE`. |
| `RELATIONAL_ENRICHMENT` | An admitted relational semantic unit over roots already used by the bundle. | Deeper explanation; no independent evidence increment. |
| `COUNTEREVIDENCE` | An explicitly admitted qualifying life-question plus at least one qualifier root not already contained by the target. | `QUALIFY`, `NARROW`, or `SUPPRESS_OVERBROAD`. |
| `REDUNDANCY` | Different candidate identities with materially identical reader meaning. | Suppress visible repetition. |
| `DUPLICATE` | Same fact identity. | Suppress without root or epistemic inflation. |
| `CONFLICT` | Same natal body, different sign, same placement scope/type. | Fail closed; never interpret as counterevidence. |
| `DISTINCT` | No admitted relation, or an admitted relation that fails its root/authority requirements. | Keep source meanings separate. |

## 3. Semantic overlap

Semantic overlap is a deterministic, inspectable policy decision. It concerns a
shared personal question, not vocabulary. An admission must identify:

- `SHARED_LIFE_QUESTION`, `QUALIFYING_LIFE_QUESTION`,
  `DISTINCT_LIFE_QUESTION`, or `REDUNDANT_MEANING`;
- the shared question when one exists;
- the integrated semantic basis;
- one closed selected domain; and
- a policy ID/version and human-readable reason.

The following are explicitly insufficient on their own:

```text
same sign
same domain
same body
same wording
same aspect type
same element
same modality
shared roots
```

No vector similarity, embedding threshold, LLM judgment, numeric score, or
free-text classifier is permitted.

## 4. Root accounting

Independent convergence requires pairwise-disjoint source root sets. The
output root support is the unique set union, never the candidate count.

Relational enrichment is different: a relation may add one relational semantic
unit while adding zero independent roots. Shared roots therefore cannot qualify
as independent convergence.

Counterevidence requires a separately admitted semantic unit and an independent
root contribution. The exact rule is:

```text
qualifierRoots.some(root => !targetRoots.has(root)) == true
```

If every qualifier root is already contained by the target, the default is
same-root relational/internal tension, not chart-level counterevidence.

## 5. Counterevidence effects

Counterevidence changes claim scope, not arithmetic strength.

- `QUALIFY` keeps the theme and adds a bounded condition or trade-off.
- `NARROW` replaces an overbroad claim with the portion still supported.
- `SUPPRESS_OVERBROAD` withholds the misleading candidate while preserving the
  full decision trace and provenance.

Counterevidence does not automatically change direction, intensity, or
confidence. `NEGATIVE-SOUNDING SEMANTICS != COUNTEREVIDENCE`; square,
opposition, `CHALLENGING`, tension language, and disagreement between paraphrases
are not sufficient.

## 6. Selector integration

The existing ordinal selector consumes one synthesized candidate for a valid
convergence or qualified/narrowed result. The source themes remain visible in
`sourceThemeIds`, `sourceRootSets`, `sourceThemeStates`, WHY references, and
provenance. They are not marked as relationally `SUBSUMED`.

`INDEPENDENTLY_SUPPORTED` is an editorial-selection state only. It does not
promote confidence or intensity. A qualified or narrowed result remains one
candidate, so counterevidence adds nuance without creating a second Core card.

The selector remains a ceiling-based ordinal selector. No numeric score,
domain quota, or automatic three-card output is introduced.

## 7. Unknown time and authority

This policy consumes already-admitted structured candidates. It does not create
facts, certify aspects, infer time, add ASC/MC/houses, or promote research
fixtures to `AUTHORITATIVE_ENGINE`. Any source requiring known time remains
`REQUIRES_KNOWN`; absent authority fails closed.

## 8. Readiness

- `CLASSIFICATION_TAXONOMY` — PASS
- `INDEPENDENT_ROOT_REQUIREMENT` — PASS
- `SEMANTIC_OVERLAP_REQUIREMENT` — PASS
- `INDEPENDENT_CONVERGENCE` — PASS (mechanism-only positive fixture)
- `RELATIONAL_ENRICHMENT_SEPARATION` — PASS
- `COUNTEREVIDENCE_ROOT_INDEPENDENCE` — PASS (mechanism-only positive fixtures)
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
