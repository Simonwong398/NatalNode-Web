# NatalNode Aspect Composition → Signal Policy V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-ASPECT-SIGNAL-001` |
| Baseline | `dbbc5d965defe881c0b6b6fa4237bc9c6bbd0613` |
| Policy status | `REPRESENTATIVE_ASPECT_SIGNAL_POLICY_PASS` |
| Scope | Four admitted Western Tropical Moon ↔ Mercury aspect compositions |
| Signal authority | Bounded research policy; provider-neutral |
| Runtime eligibility | `RUNTIME_NOT_ADMITTED` |
| Broad-scale readiness | `NO` |

This document defines a deterministic research bridge from an admitted
authoritative aspect fact to a structured relational Signal rule. It does not
calculate astronomy, create PersonalThemes, wire My Chart or Weekly, or change
the production interpretation runtime.

## 1. Decision boundary

The frozen bridge is:

```text
AUTHORITATIVE ASPECT FACT
  -> ADMITTED BODY × ASPECT × BODY COMPOSITION
  -> ASPECT SIGNAL RULE
  -> STRUCTURED RELATIONAL SIGNAL
  -> later shared-root-aware Personal Synthesis
```

The four and only four representative rules are:

1. Moon conjunction Mercury
2. Moon trine Mercury
3. Moon square Mercury
4. Moon opposition Mercury

All four rules use the canonical pair `body.moon` ↔ `body.mercury`. The stable
ordering of Moon as `bodyA` and Mercury as `bodyB` is not directional or
causal. Sextile, other aspects, other body pairs, patterns, angles, and
production Signal wiring remain outside this policy.

The purpose is relational meaning, not more cards. The Signal may carry close
coupling, easier circulation, adjustment pressure, or polarity/negotiation. It
must not turn those structures automatically into stronger, more important,
positive, negative, or diagnostic claims.

## 2. Required Signal contract

Each rule is a machine-auditable object with at least:

| Field | Policy |
| --- | --- |
| `ruleId` / `ruleVersion` | Stable research Signal identity and revision. |
| `compositionId` | One admitted Body × Aspect × Body composition ID. |
| `requiredFactType` | Existing `NATAL_ASPECT` fact vocabulary. |
| `relationalFactId` | Stable identity for the admitted Moon–Mercury relation. |
| `bodyAId` / `bodyBId` / `aspectType` | The two body functions and the returned relation. |
| `eligibleDomain` | One existing closed domain, derived from the integrated relation. |
| `direction` | `NEUTRAL` for all four current rules. |
| `intensityPolicy` | Single aspect composition defaults to `SUBTLE`; no promotion is admitted. |
| `confidencePolicy` | Candidate interpretation confidence is `LOW`; fact authority remains separate. |
| `relationalSemanticClaim` | Bounded integrated meaning preserving both bodies and the aspect operator. |
| `constructiveCapacity` / `possibleTension` | Conditional capacity and trade-off; neither changes direction automatically. |
| `evidenceLineage` | Two position roots, one relational semantic unit, zero new independent roots. |
| `suppressionConditions` | Explicit fail-closed admission and duplicate conditions. |
| `authorityRequirements` | Upstream Engine authority and composition/rule admission requirements. |
| `orbRequirements` | Upstream orb policy required; no local number or intensity inference. |
| `birthTimeRequirement` | Unknown-time suppression unless future Engine certification exists. |
| `provenance` | Composition, source, policy, and runtime trace. |
| `whyReferences` / `learnReferences` | Machine-facing evidence and concept traces; no new public Learn page. |
| `runtimeEligibility` / `policyState` / `editorialReviewStatus` | Explicit research-only boundary. |

The artifact also retains existing closed vocabularies:

```text
domains: SELF | EMOTIONAL | RELATIONSHIP | COMMUNICATION | WORK_CREATION | ACTION_DECISION
directions: SUPPORTIVE | CHALLENGING | MIXED | NEUTRAL
intensities: SUBTLE | NOTICEABLE | STRONG | DOMINANT
confidence: HIGH | MEDIUM | LOW
```

No numeric probability, score, priority, or pseudo-precision is introduced.

## 3. Domain policy

Domain is derived from the integrated composition, not assigned by a fixed
body lookup:

```text
BODY A semantic function
  + BODY B semantic function
  + ASPECT integrated relation
  -> specific bounded life-question
  -> eligible primary domain
```

The policy freezes:

```text
BODY_ONLY_DOMAIN_MAPPING = FORBIDDEN
DOMAIN_FROM_COMPOSITION_SEMANTICS = REQUIRED
```

For this Moon–Mercury relation set, all four current rules use
`COMMUNICATION`. This is not a Mercury-owned domain. The integrated questions
concern how Moon response/receptivity and Mercury naming/interpretation are
communicated, translated, circulated, adjusted, or negotiated under the
specific aspect operator. The domain rationale for each rule names that
operator and its distinct life-question.

`RELATIONSHIP` is not assigned merely because two symbolic functions are in a
relationship. If a future composition does not map cleanly to exactly one of
the six closed domains, it fails closed with `NO_SIGNAL`; it does not inherit a
body's usual domain and no seventh domain is invented.

## 4. Direction policy

Aspect type alone does not determine orientation:

```text
trine      != SUPPORTIVE by definition
square     != CHALLENGING by definition
opposition != MIXED by definition
conjunction != a fixed direction
```

The four rules use `NEUTRAL`. A constructive capacity and a possible tension
are both preserved as semantic fields, but that asymmetry does not become
`MIXED` automatically. A future direction promotion requires a separate
admitted rule with an explicit semantic basis.

## 5. Intensity policy

Aspect existence is not importance, strength, or prominence. The current
bounded default is:

```text
one aspect composition alone -> SUBTLE
```

`NOTICEABLE` requires a separately admitted promotion, such as structural
salience, independently supported convergence, or another explicit rule. No
such promotion is admitted here. `STRONG` and `DOMINANT` are unavailable from
these four rules alone. Orb tightness is never used as intensity without a
future explicit policy.

## 6. Confidence policy

The policy keeps fact authority and interpretive confidence separate:

```text
AUTHORITATIVE_ENGINE fact authority != LOW interpretive Signal confidence
```

An upstream aspect fact can be geometrically authoritative while its bounded
editorial Signal remains candidate confidence `LOW`. The presence of Moon
position, Mercury position, and their aspect does not create three independent
confirmations. No probability, percentage, or statistical accuracy claim is
created. `HIGH` or `MEDIUM` requires a separately admitted later policy.

## 7. Evidence lineage and shared roots

The critical model is:

```text
EVIDENCE ROOTS != SEMANTIC UNITS

body.moon.position  ------------------+
                                       +--> Moon–Mercury aspect Signal
body.mercury.position ----------------+
```

Every rule preserves:

- `evidenceRootKeys = [body.moon.position, body.mercury.position]`;
- `independentRootCount = 2`;
- `relationalFactAddsSemanticInformation = true`;
- `relationalFactIndependentEvidenceIncrement = 0`; and
- a relational semantic unit distinct from either placement semantic unit.

The aspect Signal adds interaction meaning but introduces no independent
position root. A future synthesis layer must maintain two separate operations:

```text
ROOT_DEDUPLICATION
  -> count unique astronomical roots

RELATIONAL_SEMANTIC_ENRICHMENT
  -> retain interaction meaning over already-used roots
```

For example:

```text
Moon placement Signal       roots: [Moon position]
Mercury placement Signal    roots: [Mercury position]
Moon–Mercury aspect Signal  roots: [Moon position, Mercury position]

unique root count = 2
semantic units = 3
```

No-new-root does not mean no-new-semantic-value. The relational unit may
enrich, constrain, reshape, or connect themes derived from the same roots,
but it cannot promote confidence or intensity by itself.

## 8. Future shared-root classification

The policy defines names for a later bounded synthesis decision without
implementing broad production synthesis:

| Classification | Meaning | Automatic promotion |
| --- | --- | --- |
| `INDEPENDENT_CONVERGENCE` | Separate root sets plus an admitted semantic-overlap decision. | None by this policy. |
| `RELATIONAL_ENRICHMENT` | A relational semantic unit adds interaction meaning over roots already used by placement semantics, after an admitted compatibility decision. | None. |
| `REDUNDANCY` | Repeated relational semantics add no useful new meaning, including a duplicate relational fact. | Suppress duplicate; no promotion. |
| `COUNTEREVIDENCE` | Separately admitted semantics qualify or complicate an existing theme. | No automatic negative direction or confidence change. |

Shared roots, shared body, shared domain, or shared theme wording do not by
themselves establish convergence. An Aspect Signal does not automatically
converge with either placement Signal. A later semantic overlap/compatibility
decision is required.

## 9. Relation-specific boundaries

The four structured claims preserve the admitted Aspect Composition meanings:

| Aspect | Relational claim | Forbidden shortcut |
| --- | --- | --- |
| Conjunction | Moon response and Mercury naming are in close coupling and concentration; each may make the other more immediate. | Not `STRONG`, dominant, fused personality, emotional intelligence, or guaranteed communication. |
| Trine | Moon response and Mercury naming have relatively easier circulation; ease remains a structure, not a reward. | Not automatically `SUPPORTIVE`, talent, gift, virtue, success, or high confidence. |
| Square | Moon response and Mercury naming meet through active friction, translation, pacing, and adjustment. | Not automatically `CHALLENGING`, badness, pathology, instability, or a major life struggle. |
| Opposition | Moon response and Mercury naming face across polarity, alternation, perspective, and negotiation. | Not automatically `MIXED`, conflict, split personality, projection doctrine, or relationship problems. |

If projection is ever used in a narrower school-specific reading, that school
must be named. It is not part of the default Signal semantics.

## 10. Orb, phase, and astronomy boundary

Aspect eligibility requires an admitted upstream aspect fact and upstream orb
policy identity/result. This policy:

- does not calculate astronomy in Web;
- does not invent numeric orb values;
- does not promote intensity from a tighter orb;
- does not infer applying or separating meaning; and
- preserves returned phase only as technical provenance unless a later rule
  explicitly admits semantic use.

Research fixtures are not `AUTHORITATIVE_ENGINE`. Missing, fake, or development
astronomy authority suppresses the Signal.

## 11. Unknown birth time

Unknown birth time is fail-closed for Aspect Signal eligibility:

```text
UNKNOWN BIRTH TIME -> NO ASPECT SIGNAL
```

Only a future authoritative Engine result may certify that the aspect remains
eligible under the time uncertainty. No default, noon, midnight, average, or
guessed time is substituted. No fabricated degrees, angular separation, ASC,
MC, houses, or house-derived domain is admitted.

## 12. Fail-closed admission and duplicate handling

Suppress the Signal for at least:

- missing authoritative aspect fact;
- missing Moon or Mercury position lineage;
- non-admitted aspect composition;
- non-admitted Signal rule or version;
- unsupported aspect type or zodiac model;
- incompatible school or policy;
- missing required orb authority;
- unknown time without explicit Engine certification;
- duplicate relational fact;
- inconsistent body pair;
- unsupported semantic inference; and
- fake or development-only astronomy authority.

There is no generic aspect fallback. A duplicate relational fact is not
deduped into a different relation and does not increase confidence, intensity,
priority, or convergence.

## 13. WHY and LEARN trace

Every Signal preserves this machine-facing trace:

```text
AspectFact
  -> relationalFactId
  -> dependent position roots
  -> compositionId
  -> Signal rule/version
  -> relational semantic basis
  -> authority/orb/time state
  -> source and policy references
```

Future reader-facing WHY may explain Moon, Mercury, the aspect, and their
integrated relation. This task creates no UI or reader-facing prose. LEARN
references reuse the existing Moon, Mercury, aspect, and general aspects
lessons; no new public Learn page is created.

## 14. Personal Synthesis boundary

The structured Signal is a bounded upstream candidate. A later shared-root
aware Personal Synthesis POC may consume it only after applying the root
deduplication, semantic-overlap, relational-enrichment, redundancy, and
counterevidence decisions above. This policy does not emit PersonalThemes,
select themes, rank candidates, or change confidence/intensity through shared
roots.

No Engine, BFF, provider, AI, My Chart, Weekly, or production runtime import is
added.

## 15. Source gaps and readiness

The following remain unresolved by design:

- no new numeric orb policy;
- no phase-to-meaning policy;
- no Moon–Mercury school-specific doctrine beyond the admitted composition
  synthesis;
- no broad aspect Signal taxonomy expansion;
- no shared-root Personal Synthesis implementation; and
- no production authority or runtime admission.

Required gates:

```text
ASPECT_SIGNAL_CONTRACT PASS
DOMAIN_SEMANTICS PASS
DIRECTION_POLICY PASS
INTENSITY_POLICY PASS
CONFIDENCE_POLICY PASS
EVIDENCE_LINEAGE_PRESERVATION PASS
ROOT_DEDUPLICATION PASS
RELATIONAL_SEMANTIC_ENRICHMENT PASS
NO_FALSE_CONVERGENCE PASS
NO_VALENCE_COLLAPSE PASS
ORB_AUTHORITY_BOUNDARY PASS
UNKNOWN_TIME_AUTHORITY PASS
ANTI_STEREOTYPE PASS
WHY_TRACEABILITY PASS
PERSONAL_SYNTHESIS_COMPATIBILITY PASS
```

Readiness is bounded:

```text
READY_FOR_BOUNDED_ASPECT_SIGNAL_ADMISSION YES
READY_FOR_SHARED_ROOT_SYNTHESIS_POC YES
READY_FOR_BROAD_SCALE NO
RUNTIME_ADMISSION NO
```
