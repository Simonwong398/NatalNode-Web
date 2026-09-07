# Composition → Signal Representative V1 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-COMPOSITION-SIGNAL-001` |
| Baseline | `ce8ea09825dcc0d7063886249f3b07fcedc4e20d` |
| Review result | `REPRESENTATIVE_COMPOSITION_SIGNAL_POLICY_PASS` |
| Scope | Exactly four admitted Western Tropical Body × Sign compositions |
| Source state | `SOURCE_SUPPORTED_WITH_CONDITIONS` |
| Policy state | `ADOPTED_WITH_CONDITIONS` |
| Runtime | `RUNTIME_NOT_ADMITTED` |

This dossier reviews the bounded bridge from an authoritative placement fact to
a structured composition-derived Signal. It is a research-policy POC only. It
does not create a PersonalTheme and does not authorize My Chart, Weekly, Engine,
BFF, UI, provider, AI, or production runtime wiring.

## 1. Decision boundary

The frozen bridge is:

```text
AUTHORITATIVE CHART FACT
  -> ADMITTED BODY × SIGN COMPOSITION
  -> COMPOSITION SIGNAL RULE
  -> STRUCTURED SIGNAL
  -> later Personal Synthesis
```

Only these four rules are admitted:

| Rule | Composition | Primary domain | Direction | Candidate intensity | Candidate confidence |
| --- | --- | --- | --- | --- | --- |
| `composition-signal.body.moon_x_sign.aries` | `body.moon_x_sign.aries` | `EMOTIONAL` | `NEUTRAL` | `NOTICEABLE` | `LOW` |
| `composition-signal.body.mercury_x_sign.aries` | `body.mercury_x_sign.aries` | `COMMUNICATION` | `NEUTRAL` | `NOTICEABLE` | `LOW` |
| `composition-signal.body.moon_x_sign.taurus` | `body.moon_x_sign.taurus` | `EMOTIONAL` | `NEUTRAL` | `NOTICEABLE` | `LOW` |
| `composition-signal.body.mercury_x_sign.taurus` | `body.mercury_x_sign.taurus` | `COMMUNICATION` | `NEUTRAL` | `NOTICEABLE` | `LOW` |

No other Body × Sign rule is implied. A missing or non-admitted rule returns
`NO_SIGNAL`; it does not fall back to generic astrology, fixtures, or prose.

## 2. Evidence accounting

The authoritative evidence unit is one `BODY_SIGN_PLACEMENT` fact. Body and
sign remain distinct semantic dimensions of that placement, while element,
modality, and rulership remain derived sign layers:

```text
one Moon-in-Aries placement
  -> body dimension
  -> sign dimension
      -> element / modality / rulership derived layers
  -> one independent evidence unit
  -> at most one primary composition Signal
```

The artifact preserves `evidenceUnitCount = 1` and
`independentEvidenceUnits = 1` for every rule. Body plus sign is not two
evidences. Repeated references to the same placement cannot increase
confidence, intensity, priority, or convergence. The duplicate occupies no
additional primary Signal slot.

This is semantic independence without evidence independence: body and sign
answer different questions, but they are not separate authoritative
`ChartFact`s.

## 3. Signal contract and closed vocabulary

Each rule carries the stable rule identity and version, composition ID, required
fact type, placement evidence key, one eligible domain, direction, intensity
and confidence policies, structured semantic claim, constructive capacity,
possible tension, suppression conditions, authority requirements, birth-time
behavior, provenance, WHY references, LEARN references, runtime eligibility,
policy state, and editorial review state.

The artifact reuses the existing Signal vocabulary:

- domains: `SELF`, `EMOTIONAL`, `RELATIONSHIP`, `COMMUNICATION`,
  `WORK_CREATION`, `ACTION_DECISION`;
- directions: `SUPPORTIVE`, `CHALLENGING`, `MIXED`, `NEUTRAL`;
- intensities: `SUBTLE`, `NOTICEABLE`, `STRONG`, `DOMINANT`; and
- confidence: `HIGH`, `MEDIUM`, `LOW`.

There is no parallel taxonomy, numeric score, percentage, probability, or
production priority in this POC.

### Domain assignment

Moon rules use `EMOTIONAL` because Moon owns response, rhythm, receptivity,
inner experience, and needs. Mercury rules use `COMMUNICATION` because Mercury
owns naming, interpretation, comparison, learning, and exchange. Aries or
Taurus qualifies the body subject; it does not move the rule into an unrelated
domain. Exactly one candidate primary domain is assigned per composition.

### Direction

All four candidates are `NEUTRAL`. Constructive capacity and possible tension
are preserved as separate structured fields. Their coexistence does not force
`MIXED`, and no direction is inferred from positive, cautionary, or negative
tone.

### Intensity

The candidate value for one placement is `NOTICEABLE`, with a single-placement
range of `SUBTLE` through `NOTICEABLE`. `STRONG` requires separately admitted
independent evidence or structure; `DOMINANT` is not eligible from these four
rules. Intensity is not importance.

### Confidence

An authoritative Engine fact is required, but fact authority is not the same
as interpretive evidence strength. One placement therefore has candidate
confidence `LOW`. `HIGH` or `MEDIUM` requires separately admitted independent
evidence and a later synthesis decision. Confidence is not probability.

## 4. Suppression, time, and anti-stereotype controls

The rules fail closed for missing authoritative placement, non-admitted
composition or rule, unsupported zodiac model, incompatible school or policy,
duplicate same-placement Signal, insufficient authority, forbidden time
dependency, and unsupported semantic inference. No fake default, fixture, or
reader-facing filler is substituted.

The four rules are `UNKNOWN_TIME_SAFE` when the authoritative planetary sign
placement is available. They never infer ASC, MC, houses, house-derived
domains, angle prominence, noon/midnight, fabricated time, or temporal content.
Any later time-dependent rule needs its own admitted prerequisites.

The existing anti-stereotype boundary is copied into each structured rule.
Moon × Aries does not imply angry, impulsive, unstable, aggressive, or
excitement-seeking. Mercury × Aries does not imply blunt, fast-speaking,
argumentative, genius, or poor-listener. Moon × Taurus does not imply
stubborn, possessive, comfort-loving, sensual, or financially
security-oriented. Mercury × Taurus does not imply slow thinker, practical
thinker, good with money, or methodical communicator. Derived layers and
rulership do not import a complete ruler meaning.

## 5. Convergence and duplicate policy

`Moon in Aries + Mercury in Aries` has two distinct placement evidence keys and
may be reviewed for later convergence only if an admitted semantic overlap is
shown. Shared Aries alone does not merge the Signals. `Moon in Aries` repeated
twice has one evidence key, one evidence unit, one primary Signal, and a
suppressed duplicate. Different placements without semantic overlap remain
separate.

One placement cannot self-converge. A future Personal Synthesis layer must
apply its own semantic-overlap, redundancy, ranking, and editorial gates.

## 6. WHY / LEARN traceability

Every rule preserves:

```text
ChartFact
  -> placementEvidenceKey
  -> compositionId
  -> ruleId / ruleVersion
  -> semantic basis
  -> authority state / birth-time eligibility
  -> source and policy references
```

`whyReferences` is structured trace metadata, not final reader prose.
`learnReferences` points to the bounded body, sign, element, modality, and
rulership concepts for possible later explanation. No public Learn content is
created by this task.

## 7. Personal Synthesis compatibility

The structured output is compatible with the later Personal Synthesis POC when
it carries stable Signal identity, the existing closed vocabularies, the one
placement evidence key, semantic basis, provenance, suppression state,
WHY/LEARN references, and birth-time eligibility. It remains upstream input:
it is not a `PersonalTheme`, user-facing result, or production ranking.

## 8. Required gates and readiness

| Gate | Result |
| --- | --- |
| `SIGNAL_RULE_CONTRACT` | `PASS` |
| `PLACEMENT_EVIDENCE_PRESERVATION` | `PASS` |
| `ONE_PLACEMENT_ONE_PRIMARY_SIGNAL` | `PASS` |
| `DOMAIN_ASSIGNMENT` | `PASS` |
| `DIRECTION_POLICY` | `PASS` |
| `INTENSITY_POLICY` | `PASS` |
| `CONFIDENCE_POLICY` | `PASS` |
| `NO_SELF_CONVERGENCE` | `PASS` |
| `DUPLICATE_SUPPRESSION` | `PASS` |
| `UNKNOWN_TIME_AUTHORITY` | `PASS` |
| `ANTI_STEREOTYPE` | `PASS` |
| `WHY_TRACEABILITY` | `PASS` |
| `PERSONAL_SYNTHESIS_COMPATIBILITY` | `PASS` |

```text
READY_FOR_BOUNDED_SIGNAL_ADMISSION: YES
READY_FOR_MY_CHART_SIGNAL_POC: NO
READY_FOR_BROAD_SCALE: NO
RUNTIME_ADMISSION: NO
```

Remaining gaps are intentionally outside this POC: broader Body × Sign
coverage, separately admitted aspect/convergence rules, Personal Synthesis
selection, reader-facing editorial projection, and runtime admission.

## 9. Targeted validation evidence

The new policy regression suite passed:

```text
npm run test:composition-signal-policy
13 tests passed, 0 failed
```

The structured Signal artifact and root `package.json` also parse as valid JSON,
and `git diff --check` reports no whitespace errors. The existing Body × Sign
targeted suite was not rerun because neither its artifact nor its implementation
changed; its prior green evidence remains valid. No build, browser, runtime, or
production integration suite is required for this research-only, runtime-
excluded change.

## 10. Source authority

The policy is grounded in the admitted Body × Sign composition artifact and
method, existing Signal contracts and engine boundaries, the Personal
Synthesis POC contract, personal editorial/content-value architecture, and the
Human Knowledge R2 primitive/source policies. These remain the authorities for
their respective domains; this artifact adds no competing runtime authority.
