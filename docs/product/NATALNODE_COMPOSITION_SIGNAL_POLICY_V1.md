# NatalNode Composition → Signal Policy V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-COMPOSITION-SIGNAL-001` |
| Baseline | `67ea9cb39c019bed2cb1453499695da01252c02e` |
| Policy status | `REPRESENTATIVE_COMPOSITION_SIGNAL_POLICY_R1_PASS` |
| Scope | Four admitted Body × Sign compositions only |
| Signal authority | Research policy; provider-neutral |
| Runtime eligibility | `RUNTIME_NOT_ADMITTED` |
| Broad-scale readiness | `NO` |

This document defines the bounded deterministic bridge from an authoritative
chart fact to a possible composition-derived Signal. It is a research-only
policy POC. It does not wire a Signal into My Chart, Weekly, the Engine, BFF,
UI, provider, AI, or production Personal Synthesis.

## 1. Bridge and decision boundary

The frozen bridge is:

```text
AUTHORITATIVE CHART FACT
  -> ADMITTED BODY × SIGN COMPOSITION
  -> COMPOSITION SIGNAL RULE
  -> STRUCTURED SIGNAL
  -> later Personal Synthesis
```

A composition does not automatically become a Signal. A Signal is emitted only
when its admitted rule matches all prerequisites. If no admitted rule exists,
the result is `NO_SIGNAL`; arbitrary composition prose is never converted into
a PersonalTheme.

The only admitted candidate rules are:

1. Moon × Aries
2. Mercury × Aries
3. Moon × Taurus
4. Mercury × Taurus

No other Body × Sign rule is created and no matrix expansion is implied.

## 2. One placement, one evidence unit, one primary Signal

The authoritative input is one placement fact:

```text
BODY_SIGN_PLACEMENT
  -> body semantic dimension
  -> sign semantic dimension
      -> element derived layer
      -> modality derived layer
      -> rulership derived layer
```

For a placement such as Moon in Aries:

- `evidenceUnitCount = 1`;
- body and sign remain distinct semantic dimensions;
- Fire, Cardinal, and Mars rulership are derived sign dimensions; and
- the placement can occupy at most one primary composition-derived Signal
  slot.

Repeating the same placement, or mentioning Moon, Aries, Fire, Cardinal, and
Mars separately, cannot increase confidence, intensity, priority, or
convergence. A duplicate placement Signal is suppressed.

This policy is evidence-level, not semantic-level: body and sign answer
different questions, but they do not become two independent ChartFacts.

## 3. Signal contract

The structured rule artifact uses the existing Interpretation Signal taxonomy;
it does not create a parallel one.

| Rule field | Contract |
| --- | --- |
| `ruleId` / `ruleVersion` | Stable composition Signal rule identity and revision |
| `compositionId` | One of the four admitted Body × Sign IDs |
| `requiredFactType` | `NATAL_BODY_POSITION` |
| `placementEvidenceKey` | Stable identity for the one authoritative placement fact |
| `eligibleDomain` | Exactly one existing domain per composition |
| `direction` | One existing direction; `NEUTRAL` when the composition does not establish orientation |
| `intensityPolicy` | Existing `SUBTLE`, `NOTICEABLE`, `STRONG`, `DOMINANT` vocabulary; single placement defaults to `SUBTLE` |
| `confidencePolicy` | Existing `HIGH`, `MEDIUM`, `LOW` vocabulary; single composition evidence is `LOW` interpretive strength |
| `semanticClaim` | Structured, source-backed editorial synthesis; not final reader prose |
| `constructiveCapacity` | Conditional capacity preserved as structured meaning |
| `possibleTension` | Conditional trade-off preserved without forcing `MIXED` direction |
| `suppressionConditions` | Fail-closed reasons for refusing a Signal |
| `authorityRequirements` | Required source authority and policy state |
| `birthTimeRequirement` | Explicit unknown-time behavior |
| `provenance` | Composition, method, source, and policy trace |
| `whyReferences` | Fact → composition → rule → semantic basis trace |
| `learnReferences` | Internal concept references for later Learn linking; no public page is created |
| `runtimeEligibility` | `RUNTIME_NOT_ADMITTED` |
| `policyState` | `ADOPTED_WITH_CONDITIONS` for this bounded research policy |
| `editorialReviewStatus` | Internal review state, not runtime approval |

The POC does not assign a numeric `internalStrength` or a production
`priority`. Existing ranking remains a later Personal Synthesis concern.
Confidence is structured interpretive evidence strength, not probability. Fact
authority and interpretation confidence are separate fields and must not be
collapsed.

## 4. Domain derivation

Each composition receives exactly one candidate primary domain only when its
integrated semantics map cleanly to one of the six existing domains. The
derivation is:

```text
BODY anchors the semantic subject
SIGN supplies operating conditions
INTEGRATED COMPOSITION determines the eligible primary domain
```

`BODY_ONLY_DOMAIN_MAPPING = FORBIDDEN` and
`DOMAIN_FROM_COMPOSITION_SEMANTICS = REQUIRED`. A body may constrain candidate
domains, but no universal `Body → Domain` lookup is authoritative. If a future
composition is ambiguous or cannot map cleanly to one closed domain, it fails
closed with `NO_SIGNAL`; it does not inherit the body's usual domain and no new
domain is invented.

| Composition | Domain | Reason |
| --- | --- | --- |
| Moon × Aries | `EMOTIONAL` | The integrated question is how response, rhythm, receptivity, or need meets Aries initiation; that specific life-question concerns an inner-response domain, not a universal Moon mapping. |
| Mercury × Aries | `COMMUNICATION` | The integrated question is how naming, comparison, or interpretation enters an Aries first move; that specific life-question concerns information exchange, not a universal Mercury mapping. |
| Moon × Taurus | `EMOTIONAL` | The integrated question is how response or need meets Taurus embodiment, valuation, and continuity; that specific life-question remains about inner response and needs. |
| Mercury × Taurus | `COMMUNICATION` | The integrated question is how meaning, naming, or comparison becomes tangible and sustained through Taurus conditions; that specific life-question concerns information exchange. |

No artificial domain diversity is introduced. A composition cannot change domain
because a later UI needs another section, and it cannot fall back to a body's
usual domain when its integrated semantics are unresolved.

## 5. Direction policy

All four representative rules use `NEUTRAL`.

The constructive capacity and possible tension are both retained as structured
fields, but their coexistence does not automatically mean `MIXED`. The
composition alone does not establish a supportive or challenging orientation;
it establishes a question and a possible trade-off. A future Signal may become
`SUPPORTIVE`, `CHALLENGING`, or `MIXED` only when a separately admitted rule and
evidence justify that direction.

No direction is inferred from warm, positive, cautionary, or negative tone.

## 6. Intensity policy

Intensity is not astrological importance and is never exposed as a score.

For a single placement rule:

- the default candidate value is `SUBTLE`;
- the four current rules have no admitted promotion beyond `SUBTLE`;
- `NOTICEABLE` requires an explicitly admitted promotion, such as structural
  salience, independently supported convergence, or another future rule;
- `STRONG` requires a separately admitted stronger structure and is unavailable
  from these four rules alone; and
- `DOMINANT` is unavailable from these four rules alone.

Intensity does not mean that a Signal exists or that a placement is important.
It is a bounded policy label, not a measurement of a person and not a numeric
weight.

## 7. Confidence policy

The policy distinguishes:

```text
FACT AUTHORITY != INTERPRETIVE EVIDENCE STRENGTH
```

An authoritative Engine fact can be high-authority while a single
composition-derived personal Signal remains `LOW` confidence because it has
one placement evidence unit and a conditional symbolic interpretation.

For these four rules:

- required source authority is `AUTHORITATIVE_ENGINE`;
- development fixtures and incomplete research are not eligible authorities;
- the admitted candidate confidence is `LOW`;
- `HIGH` or `MEDIUM` requires separately admitted independent evidence and a
  later policy decision; and
- no probability, percentage, accuracy, or statistical claim is created.

Repeated references to the same placement do not change confidence.

## 8. Admission and fail-closed suppression

A rule matches only when all of these are true:

1. the placement fact is available and authoritative;
2. the composition ID is one of the four admitted IDs;
3. the exact Signal rule is admitted and version-compatible;
4. the zodiac model is Western Tropical;
5. the school and policy state are compatible with the admitted rule;
6. no duplicate Signal already occupies the placement's primary slot; and
7. no unsupported semantic inference or forbidden time-dependent dependency
   is required.

At least the following conditions suppress the Signal:

- missing authoritative placement;
- composition not admitted;
- Signal rule not admitted;
- unsupported zodiac model;
- incompatible school or policy state;
- duplicate same-placement Signal;
- insufficient authority;
- forbidden time-dependent dependency; and
- unsupported semantic inference.

Suppression returns no Signal and does not substitute generic astrology,
fixtures, guessed houses, or prose fallback.

## 9. Unknown birth time

All four placement rules are `UNKNOWN_TIME_SAFE` only when the underlying
planetary sign placement remains authoritative. Unknown birth time does not
add or infer:

- ASC;
- MC;
- houses or house-derived domains;
- angle prominence;
- noon, midnight, default time, or fabricated time; or
- temporal/transit content.

The rule's required fact remains `NATAL_BODY_POSITION`; any later house,
aspect, degree, or angle rule needs its own admitted prerequisites.

## 10. Constructive asymmetry and anti-stereotype boundary

A Signal may preserve both a constructive capacity and a possible tension
without becoming flattering or `MIXED`. Neither field is final personal prose.

The four rules preserve the existing forbidden inferences:

- Moon × Aries: angry, impulsive, unstable, aggressive, or excitement-seeking
  claims are not admitted.
- Mercury × Aries: blunt, fast-speaking, argumentative, genius, or poor-listener
  claims are not admitted.
- Moon × Taurus: stubborn, possessive, comfort-loving, sensual, or financially
  security-oriented claims are not admitted.
- Mercury × Taurus: slow thinker, practical thinker, good with money, or
  methodical communicator claims are not admitted.

Softened synonyms do not bypass this boundary.

## 11. WHY and LEARN trace

Every candidate Signal rule preserves this chain:

```text
ChartFact
  -> placementEvidenceKey
  -> compositionId
  -> ruleId / ruleVersion
  -> semantic basis
  -> authority state / birth-time eligibility
  -> source and policy refs
```

`whyReferences` is machine-facing trace metadata. It is not reader-facing
wording. `learnReferences` points to the admitted body, sign, element,
modality, and rulership concepts that a future presentation could explain;
this task creates no public Learn content.

## 12. Personal Synthesis compatibility

The later Personal Synthesis layer may consume a Signal only when it receives:

- stable Signal identity;
- one existing domain and direction;
- existing intensity and confidence vocabulary;
- the one placement evidence key;
- semantic basis and provenance;
- suppression state;
- WHY / LEARN references; and
- birth-time eligibility.

A composition Signal is not a `PersonalTheme`, production priority, or user
facing result. One placement may produce at most one primary composition Signal.
Personal Synthesis must still apply its own ranking, redundancy, convergence,
and editorial gates.

## 13. Convergence policy

`Moon in Aries + Mercury in Aries` contains two different placement evidence
keys and therefore may be eligible for later convergence review if their
admitted semantic claims actually overlap. Sharing Aries alone is not
convergence. Their default domains also differ (`EMOTIONAL` and
`COMMUNICATION`), so this POC does not merge them automatically.

`Moon in Aries + Moon in Aries` contains one evidence key repeated twice. It
remains one placement evidence unit and one primary composition Signal; the
duplicate is suppressed.

Different placement facts are not automatically convergent either. A future
Personal Synthesis rule must establish semantic claim overlap before merging
them.

## 14. Validation gates

| Gate | Required result |
| --- | --- |
| `SIGNAL_RULE_CONTRACT` | `PASS` |
| `PLACEMENT_EVIDENCE_PRESERVATION` | `PASS` |
| `ONE_PLACEMENT_ONE_PRIMARY_SIGNAL` | `PASS` |
| `DOMAIN_ASSIGNMENT` | `PASS` |
| `DOMAIN_SEMANTICS` | `PASS` |
| `NO_BODY_ONLY_DOMAIN_COLLAPSE` | `PASS` |
| `DIRECTION_POLICY` | `PASS` |
| `INTENSITY_POLICY` | `PASS` |
| `INTENSITY_BOUNDARY` | `PASS` |
| `CONFIDENCE_POLICY` | `PASS` |
| `NO_SELF_CONVERGENCE` | `PASS` |
| `DUPLICATE_SUPPRESSION` | `PASS` |
| `UNKNOWN_TIME_AUTHORITY` | `PASS` |
| `ANTI_STEREOTYPE` | `PASS` |
| `WHY_TRACEABILITY` | `PASS` |
| `PERSONAL_SYNTHESIS_COMPATIBILITY` | `PASS` |

Readiness is bounded and explicit:

```text
READY_FOR_BOUNDED_SIGNAL_ADMISSION: YES
READY_FOR_MY_CHART_SIGNAL_POC: NO
READY_FOR_BROAD_SCALE: NO
RUNTIME_ADMISSION: NO
```

The structured rules remain research-only until a separately authorized
Personal Synthesis or My Chart task admits an integration boundary.

## 15. Source and policy authority

This policy reconciles:

- `docs/product/NATALNODE_BODY_SIGN_COMPOSITION_METHOD_V1.md`;
- `docs/research/astrology-knowledge-canon/compositions/BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1.json`;
- `docs/product/NATALNODE_PERSONAL_EDITORIAL_ARCHITECTURE_V1.md`;
- `docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md`;
- `docs/product/NATALNODE_CONTENT_VALUE_ARCHITECTURE_V1.md`;
- `docs/research/personal-synthesis/PERSONAL_SYNTHESIS_POC_001_REVIEW.md`;
- `apps/web/src/features/interpretation/interpretation-signal-contracts.ts`;
- `apps/web/src/features/interpretation/interpretation-signal-engine.ts`; and
- the Human Knowledge R2 and primitive source/policy packages.

These existing files remain the authorities for their respective architecture,
taxonomy, source, and runtime boundaries. This policy adds no parallel Signal
taxonomy and no runtime authority.
