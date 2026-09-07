# Aspect Composition → Signal Representative V1 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-ASPECT-SIGNAL-001` |
| Baseline | `dbbc5d965defe881c0b6b6fa4237bc9c6bbd0613` |
| Review result | `REPRESENTATIVE_ASPECT_SIGNAL_POLICY_PASS` |
| Scope | Exactly four Western Tropical Moon ↔ Mercury aspect Signal rules |
| Source state | `SOURCE_SUPPORTED_WITH_CONDITIONS` |
| Policy state | `ADOPTED_WITH_CONDITIONS` |
| Runtime | `RUNTIME_NOT_ADMITTED` |

This dossier reviews the structured artifact
`ASPECT_SIGNAL_REPRESENTATIVE_V1.json`. It is a research-policy POC only. It
does not calculate an aspect, claim that a fixture is an Engine result, emit a
PersonalTheme, or authorize runtime wiring.

## 1. Frozen bridge and inventory

```text
AUTHORITATIVE ASPECT FACT
  -> ADMITTED BODY × ASPECT × BODY COMPOSITION
  -> ASPECT SIGNAL RULE
  -> STRUCTURED RELATIONAL SIGNAL
  -> later shared-root-aware Personal Synthesis
```

The exact inventory is:

| Rule | Composition | Domain | Direction | Intensity | Confidence |
| --- | --- | --- | --- | --- | --- |
| `aspect-signal.body.moon_x_aspect.conjunction_x_body.mercury` | Moon conjunction Mercury | `COMMUNICATION` | `NEUTRAL` | `SUBTLE` | `LOW` |
| `aspect-signal.body.moon_x_aspect.trine_x_body.mercury` | Moon trine Mercury | `COMMUNICATION` | `NEUTRAL` | `SUBTLE` | `LOW` |
| `aspect-signal.body.moon_x_aspect.square_x_body.mercury` | Moon square Mercury | `COMMUNICATION` | `NEUTRAL` | `SUBTLE` | `LOW` |
| `aspect-signal.body.moon_x_aspect.opposition_x_body.mercury` | Moon opposition Mercury | `COMMUNICATION` | `NEUTRAL` | `SUBTLE` | `LOW` |

No other aspect, body pair, or Signal rule is admitted.

## 2. Domain decision

`COMMUNICATION` is the eligible domain for this bounded pair because the
integrated life-question in every rule is about how Moon response/receptivity
and Mercury naming/interpretation are related in exchange, translation,
circulation, adjustment, or negotiation. Each rule's rationale names the
specific operator; the domain is not inherited from Mercury.

The policy explicitly freezes:

```text
BODY_ONLY_DOMAIN_MAPPING = FORBIDDEN
DOMAIN_FROM_COMPOSITION_SEMANTICS = REQUIRED
```

The same domain across the four rules is not a shortcut. It is the result of
the bounded relational question remaining a communication question while the
aspect operator changes its structure. `RELATIONSHIP` is not selected merely
because two symbolic functions are related. An ambiguous future composition
returns `NO_SIGNAL`; no seventh domain or body fallback is invented.

## 3. Direction, intensity, and confidence

All four candidate Signals are `NEUTRAL`. Trine is not automatically
`SUPPORTIVE`, square is not automatically `CHALLENGING`, opposition is not
automatically `MIXED`, and conjunction has no fixed direction. Constructive
capacity and possible tension remain visible without forcing `MIXED`.

All four candidate Signals are `SUBTLE`. `NOTICEABLE` requires a separately
admitted promotion; no such promotion exists in this package. `STRONG` and
`DOMINANT` are unavailable. Orb tightness cannot promote intensity.

All four candidate Signals are `LOW` interpretive confidence. The upstream
aspect fact may be authoritative while the editorial interpretation remains
bounded research meaning. Shared Moon and Mercury roots never count as three
independent confirmations and never promote confidence.

## 4. Relational semantics

The body functions remain distinct:

- Moon supplies response, rhythm, receptivity, inner experience, and need.
- Mercury supplies thinking, naming, interpretation, learning, reasoning, and
  exchange.

The aspect supplies the relation between them:

| Aspect | Signal semantic claim | Trade-off retained |
| --- | --- | --- |
| Conjunction | Close coupling can make response and naming more immediate to one another. | An immediate response can become a settled interpretation, or interpretation can move ahead of receptivity. |
| Trine | Relatively easier circulation can let response and naming move with less friction. | Familiar flow can reduce checking of what was omitted or assumed. |
| Square | Active friction can make translation, pacing, and adjustment more visible. | Pressure can produce premature naming or retreat into explanation. |
| Opposition | Polarity can make alternation, perspective, and negotiation more visible. | One perspective can be pushed away or treated as the only legitimate account. |

The differences are relational, not direction/intensity labels. None of the
four becomes stronger, more important, positive, negative, or diagnostic from
the aspect type alone.

## 5. Evidence lineage

The authoritative aspect relation depends on two position roots:

```text
body.moon.position  ------------------+
                                       +--> Moon–Mercury aspect Signal
body.mercury.position ----------------+
```

Each rule declares:

- exactly the two root keys `body.moon.position` and
  `body.mercury.position`;
- `independentRootCount: 2`;
- `semanticUnitCount: 3` for Moon, Mercury, and the relation;
- `relationalFactAddsSemanticInformation: true`;
- `relationalFactIndependentEvidenceIncrement: 0`; and
- `countsAsThreeIndependentRoots: false`.

Therefore:

```text
Moon placement Signal       roots: [Moon position]
Mercury placement Signal    roots: [Mercury position]
Moon–Mercury aspect Signal  roots: [Moon position, Mercury position]

unique astronomical roots = 2
semantic units = 3
```

The relation is semantically new without being a third independent ChartFact.
The future synthesis layer must preserve both facts rather than collapsing
them into a single counter.

## 6. Root deduplication and relational enrichment

The policy names four future-safe classifications:

| Classification | Required condition | Result in this policy |
| --- | --- | --- |
| `INDEPENDENT_CONVERGENCE` | Separate root sets plus an admitted semantic-overlap decision. | May be reviewed later; no automatic promotion. |
| `RELATIONAL_ENRICHMENT` | A relational semantic unit adds interaction meaning over already-used roots after an admitted compatibility decision. | Retain relation; do not promote confidence/intensity. |
| `REDUNDANCY` | Repeated relation adds no useful semantic meaning, including duplicate relational fact. | Suppress duplicate; no promotion. |
| `COUNTEREVIDENCE` | Separately admitted semantics qualify or complicate an existing theme. | Preserve qualification; no automatic negative direction. |

The concrete shared-root example has two unique roots and three semantic units.
It is not automatically convergent. A later layer must decide whether the
aspect relation is relevant to either placement theme, and whether that
relationship is enrichment, redundancy, counterevidence, or an independent
convergence with a genuinely separate root set.

Shared roots, same body, same domain, and same wording are not convergence.
This artifact does not implement broad synthesis or selection.

## 7. Duplicate and fail-closed behavior

The duplicate relation example uses the same `relationalFactId` twice. It is
classified as `REDUNDANCY` and returns
`DUPLICATE_RELATIONAL_FACT_SUPPRESSED`. It does not become a different aspect,
an additional root, or a second primary Signal.

The Signal is suppressed for missing authoritative aspect fact, missing
position lineage, non-admitted composition or rule, unsupported aspect or
zodiac model, incompatible school/policy, missing orb authority, uncertified
unknown time, duplicate relation, inconsistent body pair, unsupported
inference, or fake/development astronomy authority. There is no generic aspect
fallback.

## 8. Aspect authority, orb, and phase

The four rules require an upstream admitted `AspectFact`. Web does not calculate
the relation. Development fixtures are explicitly suppressed and do not claim
`AUTHORITATIVE_ENGINE`.

No numeric orb value is introduced. Upstream orb policy identity/result is
required for admission, but orb is not used for intensity. If phase is
returned, it is preserved as technical provenance only; applying/exact/
separating meaning is not inferred.

## 9. Unknown birth time

Unknown birth time fails closed:

```text
UNKNOWN BIRTH TIME -> NO ASPECT SIGNAL
```

Only a future authoritative Engine result can certify eligibility under time
uncertainty. No noon, midnight, average, guessed time, fake degree, synthetic
separation, ASC, MC, house, or house-derived domain is introduced.

## 10. Anti-stereotype and school boundaries

The artifact forbids the common shortcuts:

- conjunction is not `STRONG`, dominance, fused personality, emotional
  intelligence, or guaranteed communication;
- trine is not automatically `SUPPORTIVE`, talent, gift, virtue, success, or
  high confidence;
- square is not automatically `CHALLENGING`, badness, pathology, emotional
  instability, communication problem, or major life struggle; and
- opposition is not automatically `MIXED`, conflict, split personality,
  universal projection doctrine, or relationship problems.

Any projection language would require an explicitly named narrower school and
is absent from the default Signal semantics. The default lens is
`MODERN_PSYCHOLOGICAL_WESTERN`; Traditional/Classical, Early Modern, and a
named modern school remain separate comparison lenses.

## 11. WHY and LEARN

Every rule preserves:

```text
AspectFact
  -> relationalFactId
  -> dependent Moon/Mercury position roots
  -> compositionId
  -> ruleId / ruleVersion
  -> semantic basis
  -> authority, orb, and birth-time state
  -> source and policy references
```

WHY data is machine-facing trace metadata, not reader prose. LEARN references
reuse existing Moon, Mercury, and general aspect lessons. No public Learn page
or UI is created.

## 12. Personal Synthesis boundary

The policy is compatible with a future bounded shared-root Synthesis POC. That
POC would still own semantic-overlap decisions, root deduplication at input,
relational enrichment, redundancy, counterevidence, selection, and editorial
projection. This policy does not create PersonalThemes, rank themes, or wire
Signals into any runtime surface.

## 13. Gates and readiness

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

```text
READY_FOR_BOUNDED_ASPECT_SIGNAL_ADMISSION YES
READY_FOR_SHARED_ROOT_SYNTHESIS_POC YES
READY_FOR_BROAD_SCALE NO
RUNTIME_ADMISSION NO
```

Remaining gaps are intentionally bounded: no broader aspect/body inventory,
numeric orb policy, phase interpretation policy, school-specific pair doctrine,
shared-root synthesis implementation, or runtime admission.
