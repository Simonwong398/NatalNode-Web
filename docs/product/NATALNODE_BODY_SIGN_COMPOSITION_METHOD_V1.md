# NatalNode Body × Sign Composition Method V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-COMPOSITION-001` |
| Baseline | `18e639e8118559c9efeca8716fa564e65672ae71` |
| Method status | `REPRESENTATIVE_COMPOSITION_METHOD_PASS` |
| Scope | Western Tropical body × sign research compositions |
| Source state | `SOURCE_SUPPORTED_WITH_CONDITIONS` |
| Epistemic status | `EDITORIAL_SYNTHESIS` |
| Policy state | `ADOPTED_WITH_CONDITIONS` |
| Runtime eligibility | `RUNTIME_NOT_ADMITTED` |
| Broad-scale readiness | `NO` |

This document freezes a source-backed, deterministic method for composing a
body function with a sign structure. It defines a bounded research artifact;
it does not create a production interpretation matrix, a PersonalTheme, or a
new runtime authority.

## 1. Decision boundary

The method is a typed link between two different questions:

- **BODY** supplies the symbolic function, process, or domain being discussed.
- **SIGN** supplies a structural context for how that function may be
  approached in the selected Western Tropical lens.

The composition must remain conditional, source-traceable, and open to chart
context. A single body × sign placement is not a whole-person description,
diagnosis, prediction, moral judgement, or scientific result.

The representative artifact is intentionally limited to exactly four new
compositions:

1. Moon × Aries
2. Mercury × Aries
3. Moon × Taurus
4. Mercury × Taurus

The existing Sun × Taurus package remains a comparison control. It is not
rewritten, copied into the new inventory, or silently promoted to runtime.

## 2. Frozen composition path

Every representative record follows this order:

```text
BODY FUNCTION
  -> SIGN CONDITIONS
  -> STRUCTURAL INTERACTION
  -> BOUNDED CHART QUESTION
  -> POTENTIAL EXPRESSION / TRADE-OFF
  -> MODIFIERS REQUIRED
```

The body and sign are not concatenated as keywords. The integrated meaning
must explain what the body contributes, what the sign contributes, and what
question becomes available at their intersection.

### 2.1 Layer ownership

| Layer | Owns | Does not own |
| --- | --- | --- |
| Body | Response, rhythm, receptivity, inner experience, needs (Moon); thinking, naming, interpreting, comparing, translating, learning, and exchange (Mercury) | The sign's operating context, a complete personality, or an intelligence/emotion score |
| Sign | Aries initiation, activation, assertion; Taurus embodiment, valuation, continuity, maintenance, tangibility | A person type, a guaranteed behavior, or the complete meaning of its ruler |
| Element | A broad field supplied by the sign: Fire for activation; Earth for embodiment and valuation | An independent second chart fact or a temperament test |
| Modality | An operating mode supplied by the sign: Cardinal for initiation; Fixed for continuation and consolidation | A synonym for the element or a behavior guarantee |
| Rulership | A named sign-to-planet relationship in a selected school | A strength score, causal force, co-ruler, dispositor chain, or import of the ruler's full semantics |

### 2.2 No semantic double counting

Aries, Fire, Cardinal, and traditional Mars are not four independent pieces of
evidence. Taurus, Earth, Fixed, and traditional Venus are not four independent
pieces of evidence. They are distinct descriptive layers of one sign structure.

The only independent inputs in a body × sign record are:

1. the authoritative body placement/fact; and
2. the authoritative sign placement/fact.

Element, modality, and rulership may clarify the sign, but they do not add
independent convergence. A later Personal Synthesis implementation may count
independent chart facts only when the source evidence really is separate.

## 3. Rulership boundary

The method uses the traditional seven-visible-planet mapping as the baseline:

- Aries → Mars
- Taurus → Venus

This records a named relation. It does not mean that Aries is Mars, that
Taurus is Venus, that Mars or Venus is located in the sign, or that the ruler
controls a person. It does not import the ruler's complete body function into
the sign composition.

Modern outer-planet assignments remain named alternatives only. No default
co-ruler, advanced dignity, dispositor, mutual reception, triplicity, bounds,
faces, exaltation, fall, or detriment doctrine is introduced by this method.

## 4. School, source, and epistemic policy

The admitted scope is Western Tropical natal astrology. The candidate default
personal lens is `MODERN_PSYCHOLOGICAL_WESTERN`. Traditional/classical and
early-modern material remains a labelled comparison or educational layer; it
is not silently merged into the default wording.

The structured artifact uses:

- `sourceStatus: SOURCE_SUPPORTED_WITH_CONDITIONS` for the registered body,
  sign, element, modality, and basic-rulership inputs;
- `epistemicStatus: EDITORIAL_SYNTHESIS` for the composed sentence and
  question; and
- `policyState: ADOPTED_WITH_CONDITIONS` for the bounded research projection.

No consulted source is represented as quoting a complete Moon × Aries,
Mercury × Aries, Moon × Taurus, or Mercury × Taurus sentence. The source refs
support the inputs and the policy boundary; the integrated wording is
NatalNode editorial synthesis.

The method inherits the Human Knowledge R2 reader rhythm for any later
reader-facing projection: WHAT, WHY, NEARBY DISTINCTION, CONCRETE EXAMPLE,
WHY IT MATTERS, ONE LIMIT, and NEXT LEARN. This task does not create public
Learn pages or runtime copy.

## 5. Record contract

Every representative composition record must contain at least:

```text
compositionId
bodyId
signId
bodyFunction
signContribution
elementContribution
modalityContribution
rulershipContext
integratedMeaning
boundedChartQuestion
constructivePotential
possibleTradeOff
nearbyDistinctions
modifierRequirements
forbiddenInferences
semanticDependencies
sourceRefs
schoolNotes
epistemicStatus
policyState
runtimeEligibility
editorialReviewStatus
```

The machine-auditable representative artifact is:

`docs/research/astrology-knowledge-canon/compositions/BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1.json`

Its `compositions` array contains exactly four records. The control sample,
comparison matrix, and validation gates are metadata outside that inventory;
they are not additional compositions.

### 5.1 Required modifier model

The body × sign fact can remain useful when the underlying placement is
authoritative, even when birth time is unknown. A narrower reading must stop
when the required authority is missing.

| Modifier | Status | Boundary |
| --- | --- | --- |
| Body and sign fact | REQUIRED | Must come from an authoritative chart result or explicitly admitted source fact |
| Western Tropical model | REQUIRED | Sidereal or another zodiac model is not silently substituted |
| School/method choice | REQUIRED_FOR_NARROWER_READING | Traditional/classical, modern/psychological, and named alternatives stay visible |
| House and house system | OPTIONAL_FOR_PLACEMENT_LEVEL; REQUIRED_FOR_HOUSE_READING | Never guess a house or house system |
| Aspects, orb, and phase | OPTIONAL_FOR_PLACEMENT_LEVEL; REQUIRED_WHEN_USED | Do not infer an aspect, orb, or phase |
| Degrees or decans | NOT_ADMITTED_UNLESS_SEPARATELY_REVIEWED | Do not intensify the composition from an unavailable technical layer |
| Other chart factors and counterevidence | REQUIRED_FOR_PERSONAL_NARROWING | They may reinforce, redirect, or complicate the question |
| Birth-time authority | CONDITIONAL | Unknown time permits authoritative body × sign only; it blocks ASC, MC, houses, and other time-dependent claims |
| Temporal context | NOT_APPLICABLE_TO_NATAL_PLACEMENT; REQUIRED_IF_LATER_INTRODUCED | Natal placement is not a transit or calendar forecast |
| Lived context and agency | REQUIRED_FOR_REFLECTIVE_USE | A symbolic question must not pretend to know the person's circumstances |

No noon, midnight, default time, guessed angle, or fabricated house may be
inserted to complete a missing chart fact.

## 6. Composition quality rules

A record passes only when it can answer all of the following:

1. What does the body function contribute independent of the sign?
2. What conditions does the sign contribute independent of the body?
3. How do those layers interact without becoming synonyms?
4. What bounded chart question follows from the interaction?
5. What constructive possibility and trade-off can be explored conditionally?
6. What does not follow from the placement?
7. Which chart, school, authority, and context facts are required for a
   narrower statement?

The four representative distinctions are frozen as follows:

| Composition | Distinct interaction |
| --- | --- |
| Moon × Aries | A response/rhythm/receptivity/need function meets initiation, activation, and assertion. The question concerns how what is received or needed is invited to take an initial form. |
| Mercury × Aries | An information-handling function meets initiation, activation, and assertion. The question concerns how a distinction, name, or interpretation enters a first move. |
| Moon × Taurus | A response/rhythm/receptivity/need function meets embodiment, valuation, continuity, and maintenance. The question concerns how a recurring inner pattern takes a tangible or sustained form. |
| Mercury × Taurus | An information-handling function meets embodiment, valuation, continuity, and maintenance. The question concerns how meaning or comparison becomes a tangible process that can be developed and revisited. |

The body contrast and the sign contrast must both remain legible. Cosmetic
synonym swaps do not satisfy the cross-matrix gate.

## 7. Forbidden inference policy

The following are explicit non-inferences for the four records:

- Moon × Aries does not entail emotionally impulsive, angry, impatient,
  aggressive, unstable, or excitement-seeking behaviour.
- Mercury × Aries does not entail fast, blunt, argumentative, genius, poor
  listening, or aggressive behaviour.
- Moon × Taurus does not entail stable, comfort-loving, possessive, stubborn,
  sensual, or financially security-oriented behaviour.
- Mercury × Taurus does not entail a slow or practical thinker, a stubborn
  thinker, good money, or a methodical communicator.

The general boundary also rejects complete personality, health, diagnostic,
relationship, career, wealth, moral, destiny, and scientific conclusions from
one placement.

## 8. Compatibility with Personal Synthesis

These objects are composition candidates, not final `PersonalTheme` records
and not production priorities. They may later be considered as a semantic
basis only if a separately admitted Signal rule supplies:

- an authoritative chart fact;
- an independent evidence key;
- an existing closed domain and direction vocabulary;
- source and rule provenance;
- explicit birth-time eligibility;
- a suppression/limitation path; and
- bounded WHY and LEARN references.

The composition method does not assign numeric strength, confidence,
priority, or user-facing ranking. It does not create an eligible runtime
signal by itself. Repeated references to Fire, Cardinal, Mars, Earth, Fixed,
or Venus must not be counted as independent convergence.

## 9. Validation gates

The representative package records the following gates:

| Gate | Required result |
| --- | --- |
| `COMPOSITION_METHOD` | `PASS` |
| `BODY_SIGN_SEPARATION` | `PASS` |
| `ELEMENT_MODALITY_SEPARATION` | `PASS` |
| `RULERSHIP_BOUNDARY` | `PASS` |
| `NO_SEMANTIC_DOUBLE_COUNTING` | `PASS` |
| `CROSS_MATRIX_DIFFERENTIATION` | `PASS` |
| `ANTI_STEREOTYPE` | `PASS` |
| `SOURCE_TRACEABILITY` | `PASS` |
| `SCHOOL_POLICY` | `PASS` |
| `UNKNOWN_TIME_COMPATIBILITY` | `PASS` |
| `PERSONAL_SYNTHESIS_COMPATIBILITY` | `PASS` |

Readiness is explicit:

```text
READY_FOR_BOUNDED_COMPOSITION_ADMISSION: YES
READY_FOR_BROAD_SCALE: NO
RUNTIME_ADMISSION: NO
```

This is a bounded research admission gate, not Product Owner production
approval. The existing Engine, BFF, provider, UI, My Chart, Weekly, auth,
vault, and AI paths remain unchanged.

## 10. Source and policy authority

This method reconciles:

- `docs/content/NATALNODE_ASTROLOGY_KNOWLEDGE_CANON_V1.md`
- `docs/research/astrology-knowledge-canon/primitives/SOURCE_REGISTER.md`
- `docs/research/astrology-knowledge-canon/primitives/bodies/PERSONAL_BODIES.md`
- `docs/research/astrology-knowledge-canon/primitives/elements/ELEMENTS.md`
- `docs/research/astrology-knowledge-canon/primitives/modalities/MODALITIES.md`
- `docs/research/astrology-knowledge-canon/primitives/rulership/RULERSHIP_POLICY.md`
- `docs/research/astrology-knowledge-canon/primitives/signs/SIGNS.md`
- `docs/research/astrology-knowledge-canon/content/CORE_PRIMITIVE_EN_R2_REVIEW.md`
- `docs/research/astrology-knowledge-canon/sun-taurus/POLICY_REVIEW.md`
- `docs/research/astrology-knowledge-canon/sun-taurus/SOURCE_MATRIX.md`
- `docs/research/astrology-knowledge-canon/sun-taurus/SUN_TAURUS_COMPOSITION.md`
- `docs/research/personal-synthesis/PERSONAL_SYNTHESIS_POC_001_REVIEW.md`

Those documents remain the authorities for their respective source, policy,
editorial, and synthesis boundaries. This document adds only the bounded
Body × Sign method and its four representative research records.
