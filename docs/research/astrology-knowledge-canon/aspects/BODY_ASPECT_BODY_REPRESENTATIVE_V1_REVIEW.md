# Body × Aspect × Body Representative V1 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-ASPECT-COMPOSITION-001` |
| Baseline | `aa64238340ec6abe403545ba6aed0c4536d2c8af` |
| Review status | `REPRESENTATIVE_ASPECT_COMPOSITION_METHOD_PASS` |
| Scope | Western Tropical; Moon ↔ Mercury; exactly four major relations |
| Epistemic status | `EDITORIAL_SYNTHESIS` |
| Runtime status | `RUNTIME_NOT_ADMITTED` |
| Readiness | `READY_FOR_BOUNDED_ASPECT_COMPOSITION_ADMISSION YES` |

This dossier audits the representative artifact
`BODY_ASPECT_BODY_REPRESENTATIVE_V1.json`. It is a bounded research method,
not an astronomy result, Signal policy, Personal Synthesis implementation, or
runtime feature.

## 1. Review decision

The method is admitted only as a deterministic semantic composition of:

```text
Moon symbolic function
  + Mercury symbolic function
  + one admitted aspect relation
  -> integrated relational meaning
  -> bounded chart question
  -> constructive potential and possible trade-off
```

The aspect is a relational operator. It is not a body adjective, causal force,
personality verdict, moral score, or independent third confirmation.

Stable IDs use Moon as `bodyA` and Mercury as `bodyB`; this is canonical
ordering only. It does not make the relation directional or causal.

The exact admitted inventory is:

| Aspect | Stable composition ID | Operator boundary |
| --- | --- | --- |
| Conjunction | `body.moon_x_aspect.conjunction_x_body.mercury` | Co-presence, concentration, combination, close coupling |
| Trine | `body.moon_x_aspect.trine_x_body.mercury` | Relatively easier circulation and compatibility |
| Square | `body.moon_x_aspect.square_x_body.mercury` | Active friction, pressure, and adjustment |
| Opposition | `body.moon_x_aspect.opposition_x_body.mercury` | Polarity, facing, alternation, perspective, negotiation |

Sextile and all other aspect types, body pairs, patterns, angles, minor
aspects, and inferred geometry remain outside this package.

## 2. Authority reconciliation

The method is constrained by existing repository authorities rather than by a
new universal aspect doctrine:

| Existing authority | Applied constraint |
| --- | --- |
| `docs/content/foundations/v1/en/09-aspects-relationships-between-planets.md` | Geometry and interpretation remain separate; the four operators use cautious established vocabulary; orb and phase are technical returned values, not reconstructed values. |
| `docs/content/NATALNODE_ASTROLOGY_KNOWLEDGE_CANON_V1.md` | A relation retains bodies, type, calculation provenance, orb/phase when available, school, limitations, and counterevidence. |
| `packages/contracts/src/chart.ts` | `AspectFact` is received with body pair, type, orb, and optional phase; Web does not calculate the aspect. |
| `apps/web/src/core/astrology-taxonomy/chart-taxonomy.ts` | Existing aspect taxonomy is reused; this package selects four IDs and adds no parallel taxonomy. |
| `apps/web/src/features/interpretation/interpretation-content.ts` | Existing presentation vocabulary is treated as bounded reference language, not as a new Signal or runtime rule. |
| `docs/research/astrology-knowledge-canon/primitives/bodies/PERSONAL_BODIES.md` | Moon and Mercury remain distinct bounded body functions with anti-stereotype limits. |
| `docs/research/astrology-knowledge-canon/primitives/SOURCE_REGISTER.md` | Source classes, school labels, and editorial-synthesis status remain explicit. |
| `docs/product/NATALNODE_BODY_SIGN_COMPOSITION_METHOD_V1.md` | Semantic dimensions do not become independent evidence roots automatically. |
| `docs/product/NATALNODE_PERSONAL_EDITORIAL_ARCHITECTURE_V1.md` | Personal meaning remains conditional, agency-preserving, evidence-traceable, and non-diagnostic. |
| `docs/research/personal-synthesis/PERSONAL_SYNTHESIS_POC_001_REVIEW.md` | Any later synthesis must deduplicate roots, preserve provenance, and suppress missing authority. |

There is no repository source for a Moon–Mercury-specific historical doctrine,
universal numeric orb table, or aspect-phase interpretation rule. Those remain
explicit source gaps; no missing doctrine is silently invented.

## 3. Body-function separation

Both body functions are present in every record:

| Body | Function retained | Boundary |
| --- | --- | --- |
| Moon | Recurring response, rhythm, receptivity, inner experience, memory, and need | Not emotions-only identity, diagnosis, family history, or complete personality |
| Mercury | Thinking, naming, language, interpretation, comparison, learning, reasoning, movement, and exchange | Not intelligence score, communication verdict, or complete personality |

The method therefore does not reduce the pair to “head versus heart,”
“emotional intelligence,” or any fixed person type. The bodies remain semantic
dimensions; neither body causes, owns, or replaces the other.

## 4. Relation-function separation

The `aspectRelation` object is independent in schema from `bodyAFunction` and
`bodyBFunction`. It answers how the two functions are structurally considered
together:

| Relation | Integrated use | Explicit non-inference |
| --- | --- | --- |
| Conjunction | Concentrated co-presence can make response and naming more immediate to one another. | Not automatic harmony, importance, strength, or one merged function. |
| Trine | Comparatively easier circulation can let response and naming support one another. | Not talent, virtue, health, success, or effortless outcome. |
| Square | Friction can make translation, pacing, and adjustment more visible. | Not badness, pathology, failure, or inevitable conflict. |
| Opposition | Facing across polarity can make perspective, alternation, and negotiation more visible. | Not split identity, doom, or a required winner. |

Every relation keeps a constructive potential and a possible trade-off. This
prevents the operator from collapsing into a positive/negative label.

## 5. Four record audits

### 5.1 Moon conjunction Mercury

- Body A: Moon response, rhythm, receptivity, and need.
- Body B: Mercury naming, interpretation, learning, and exchange.
- Operator: co-presence, concentration, combination, and close coupling.
- Integrated meaning: response and naming may occupy a concentrated field;
  language can give recurring experience a form while experience keeps
  language connected to what is felt.
- Bounded chart question: “How can recurring response and naming occupy the
  same field without one being mistaken for the whole of the other?”
- Constructive potential: translate a response into words without closing it
  too quickly; let language clarify while receptivity remains available.
- Possible trade-off: an immediate response may be treated as a settled
  interpretation, or interpretation may move ahead of receptivity.
- Nearby distinctions: concentration is not trine-like ease, square-like
  adjustment pressure, or opposition-like alternation.
- Required modifiers: authoritative Moon and Mercury positions, an admitted
  conjunction fact, upstream orb policy identity, optional returned phase,
  named school, Western Tropical model, birth-time authority, and
  counterevidence for any narrower reading.
- Forbidden inferences: “says exactly what they feel,” “emotionally
  intelligent,” “strong communication,” complete personality, diagnosis, and
  guaranteed outcome.

### 5.2 Moon trine Mercury

- Body A: Moon response, rhythm, receptivity, and need.
- Body B: Mercury naming, interpretation, learning, and exchange.
- Operator: relatively easier circulation, flow, and compatibility.
- Integrated meaning: felt information and language may circulate with less
  friction, allowing mutual support while still requiring deliberate checking.
- Bounded chart question: “Where can felt information and language move
  readily, and where does ease still need deliberate checking?”
- Constructive potential: use the available channel to listen, name, compare,
  and revise without treating fluency as proof.
- Possible trade-off: ease may reduce checking; a familiar explanation may
  pass without asking whether it still fits the response.
- Nearby distinctions: ease is not conjunction-like concentration,
  square-like adjustment pressure, or opposition-like perspective work.
- Required modifiers: the same authority, orb, phase, school, model,
  birth-time, and counterevidence boundaries as the other relations.
- Forbidden inferences: gifted communication, natural eloquence, guaranteed
  psychological health, easy childhood, or inevitable success.

### 5.3 Moon square Mercury

- Body A: Moon response, rhythm, receptivity, and need.
- Body B: Mercury naming, interpretation, learning, and exchange.
- Operator: active friction, pressure, and adjustment.
- Integrated meaning: response and interpretation may press against one
  another, making translation, pacing, and revision more visible.
- Bounded chart question: “What needs to be slowed, distinguished, or
  reworded when response and interpretation press against each other?”
- Constructive potential: use mismatch as feedback; pause between response and
  explanation and distinguish what was felt from what was concluded.
- Possible trade-off: pressure can produce premature naming or retreat into
  explanation instead of staying with a response that needs attention.
- Nearby distinctions: friction is not conjunction-like closeness,
  trine-like ease, or opposition-like polarity.
- Required modifiers: the same authority, orb, phase, school, model,
  birth-time, and counterevidence boundaries as the other relations.
- Forbidden inferences: irrationality, anxiety, instability, poor
  communication, “head versus heart,” mental-health problem, pathology,
  diagnosis, or inevitable conflict.

### 5.4 Moon opposition Mercury

- Body A: Moon response, rhythm, receptivity, and need.
- Body B: Mercury naming, interpretation, learning, and exchange.
- Operator: polarity, facing, alternation, perspective, and negotiation.
- Integrated meaning: attention may alternate between felt need and
  interpretation, making it important to keep both perspectives in
  conversation.
- Bounded chart question: “How can felt response and interpretation be held
  as two perspectives in conversation without forcing one to win?”
- Constructive potential: name both the response and the explanation, then
  alternate listening and interpretation long enough to find a workable
  relationship.
- Possible trade-off: the relation may become a pendulum in which one
  perspective is pushed away, projected into the other, or treated as the
  only legitimate account.
- Nearby distinctions: polarity is not conjunction-like concentration,
  trine-like flow, or square-like adjustment pressure.
- Required modifiers: the same authority, orb, phase, school, model,
  birth-time, and counterevidence boundaries as the other relations.
- Forbidden inferences: split personality, bipolarity, chronic indecision,
  relationship conflict, inability to integrate thought and feeling,
  inevitable conflict, complete personality, or diagnosis.

## 6. Cross-aspect differentiation

The body pair is held constant while the operator changes. The six pairwise
comparisons below are required to remain distinct:

| Comparison | Distinction that must survive |
| --- | --- |
| Conjunction vs trine | Concentration is not relatively easy circulation. |
| Conjunction vs square | Co-presence is not active friction and adjustment. |
| Conjunction vs opposition | Close coupling is not facing across polarity. |
| Trine vs square | Ease is not pressure; neither is virtue or failure. |
| Trine vs opposition | Readily available connection is not alternation and negotiation. |
| Square vs opposition | Adjustment pressure is not polarity, and polarity is not inevitable conflict. |

No comparison assigns a moral value, outcome, diagnostic meaning, or Signal
priority.

## 7. Evidence lineage and no false independence

The authoritative relation depends on two position roots:

```text
body.moon.position  ------------------+
                                       +--> relational.body.moon_aspect.*_body.mercury
body.mercury.position ----------------+
```

Each artifact record therefore declares:

- `independentRootCount: 2`;
- `semanticDimensionCount: 3` (Moon, Mercury, aspect relation);
- `relationalFactIsIndependentRoot: false`;
- `relationalFactAddsSemanticInformation: true`;
- `relationalFactIndependentEvidenceIncrement: 0`; and
- `countsAsThreeIndependentRoots: false`.

The aspect relation is semantically new but not an independent astronomical
root. A future convergence layer must deduplicate the two position keys when
the same chart also contains placement records. Semantic distinctness is not
evidence independence.

## 8. Authority, orb, phase, and unknown time

The artifact requires an upstream `AUTHORITATIVE_ENGINE_REQUIRED` aspect fact
and suppresses development fixtures. It never labels a fixture
`AUTHORITATIVE_ENGINE`, invents degrees, reconstructs angular separation, or
selects a universal orb number.

Orb policy identity is required for admission, but its numeric value belongs to
the upstream method. Applying/exact/separating is optional only when returned;
no phase semantics are invented. Houses, signs, and other chart factors are
not inferred by this package.

Unknown birth time fails closed. The Moon position, exactness, and orb
eligibility may vary across the unknown window. No noon, midnight, default,
average, guessed time, fake degrees, or synthetic separation is allowed. Only
a future authoritative Engine result can certify eligibility under that
uncertainty.

## 9. Personal Synthesis and runtime boundary

These records are not Signals or PersonalThemes. They assign no domain,
direction, intensity, confidence, priority, or convergence promotion. A
future aspect Signal policy would need a separate admitted rule for all of
those fields, including lineage, suppression, provenance, WHY, and LEARN.

No Engine, BFF, provider, AI, My Chart, Weekly, or runtime imports are added.
The artifact and method remain research/development material only.

## 10. Source and school policy

The default lens is `MODERN_PSYCHOLOGICAL_WESTERN`. `TRADITIONAL_CLASSICAL`
and `EARLY_MODERN` are retained as named comparison lenses, not silently
merged. The repository's unresolved conjunction-classification nuance is
recorded instead of being resolved by assertion.

Pair-specific doctrine, universal orb numbers, phase interpretation, and
unknown-time certification remain explicit gaps. Those gaps are a reason to
limit admission, not a reason to fill the fields with generic astrology.

## 11. Readiness gates

```text
ASPECT_COMPOSITION_METHOD PASS
BODY_FUNCTION_SEPARATION PASS
ASPECT_RELATION_SEPARATION PASS
CROSS_ASPECT_DIFFERENTIATION PASS
NO_VALENCE_COLLAPSE PASS
ANTI_STEREOTYPE PASS
EVIDENCE_LINEAGE PASS
NO_FALSE_INDEPENDENCE PASS
ORB_AUTHORITY_BOUNDARY PASS
UNKNOWN_TIME_AUTHORITY PASS
SOURCE_TRACEABILITY PASS
SCHOOL_POLICY PASS
PERSONAL_SYNTHESIS_COMPATIBILITY PASS

READY_FOR_BOUNDED_ASPECT_COMPOSITION_ADMISSION YES
READY_FOR_ASPECT_SIGNAL_POLICY NO
READY_FOR_BROAD_SCALE NO
RUNTIME_ADMISSION NO
```
