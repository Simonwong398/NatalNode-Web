# NatalNode Body × Aspect × Body Composition Method V1

| Field | Value |
| --- | --- |
| Task | `WEB-P2-ASPECT-COMPOSITION-001` |
| Baseline | `aa64238340ec6abe403545ba6aed0c4536d2c8af` |
| Method status | `REPRESENTATIVE_ASPECT_COMPOSITION_METHOD_PASS` |
| Scope | Western Tropical Moon × Mercury relational research compositions |
| Source state | `SOURCE_SUPPORTED_WITH_CONDITIONS` |
| Epistemic status | `EDITORIAL_SYNTHESIS` |
| Policy state | `ADOPTED_WITH_CONDITIONS` |
| Runtime eligibility | `RUNTIME_NOT_ADMITTED` |
| Broad-scale readiness | `NO` |

This document freezes a bounded, deterministic method for composing two
accepted body functions through one admitted aspect relation. It defines
semantic research material only. It does not create production Signals,
PersonalThemes, ranking, intensity, confidence, a new astronomy calculation,
or a runtime authority.

## 1. Decision boundary

The method is a typed relational composition:

```text
BODY A FUNCTION
  -> BODY B FUNCTION
  -> ASPECT RELATIONAL OPERATOR
  -> STRUCTURAL INTERACTION
  -> BOUNDED CHART QUESTION
  -> CONSTRUCTIVE POTENTIAL / TRADE-OFF
  -> MODIFIERS AND LIMITATIONS
```

The aspect is an operator between two symbolic functions. It is not an
adjective attached to a keyword bundle, a cause, a personality verdict, or a
good/bad score.

The four records use one canonical pair only:

```text
body.moon <-> body.mercury
```

Moon is `bodyA` and Mercury is `bodyB` for stable IDs only. The ordering does
not establish causation, priority, or a one-way influence. The semantic
relation remains relational.

The exact representative inventory is:

1. Moon–Mercury conjunction
2. Moon–Mercury trine
3. Moon–Mercury square
4. Moon–Mercury opposition

Sextile, quincunx, minor aspects, declination aspects, nodes, angles, outer
planets, other body pairs, and aspect patterns are outside this package.

## 2. Reconciled authorities

| Authority | Constraint carried into this method |
| --- | --- |
| `docs/content/foundations/v1/en/09-aspects-relationships-between-planets.md` | Aspect geometry is distinct from interpretation; conjunction, opposition, square, trine, and sextile have cautious introductory vocabularies; no aspect type is inherently good, bad, causal, or complete. Orb and phase are returned technical qualifications, not values to reconstruct. |
| `docs/content/NATALNODE_ASTROLOGY_KNOWLEDGE_CANON_V1.md` | Aspect records retain participating bodies, geometry, orb/phase when available, calculation provenance, school, policy, limitations, and counterevidence. Planet × Planet through Aspect is a relationship to explore, not an outcome. |
| `packages/contracts/src/chart.ts` | The Web chart contract receives `firstBodyId`, `secondBodyId`, `type`, `orb`, and optional `phaseState`; Web does not calculate them. |
| `apps/web/src/features/interpretation/interpretation-content.ts` | Existing bounded presentation vocabulary distinguishes concentrated/merging, polarizing/balancing, flowing/reinforcing, friction-producing/developmental, and cooperative/opportunity-oriented language. This method narrows and audits four of those relations; it does not change the runtime helper. |
| `apps/web/src/core/astrology-taxonomy/chart-taxonomy.ts` | The existing aspect taxonomy admits the five major aspect IDs. This research inventory selects exactly four and does not create a parallel taxonomy. |
| `docs/research/astrology-knowledge-canon/primitives/bodies/PERSONAL_BODIES.md` | Moon and Mercury remain distinct bounded symbolic functions with anti-stereotype limits. |
| `docs/research/astrology-knowledge-canon/primitives/SOURCE_REGISTER.md` | Source classes, school labels, historical separation, and editorial-synthesis provenance remain explicit. |
| `docs/product/NATALNODE_BODY_SIGN_COMPOSITION_METHOD_V1.md` | Composition is ordered semantic structure, not keyword concatenation; distinct semantic dimensions do not automatically create independent evidence roots. |
| `docs/product/NATALNODE_PERSONAL_EDITORIAL_ARCHITECTURE_V1.md` | Personal meaning must remain conditional, source-backed, agency-preserving, and separate from facts, ranking, and prose. |
| `docs/product/NATALNODE_CONTENT_VALUE_ARCHITECTURE_V1.md` | A later projection may expose a supplied relationship through progressive depth, but missing authority removes content rather than inviting a guess. |
| `docs/research/personal-synthesis/PERSONAL_SYNTHESIS_POC_001_REVIEW.md` | Future synthesis requires stable fact references, independent-root accounting, limitations, birth-time eligibility, and explicit suppression; this method does not create a Signal. |

The repository contains no Moon–Mercury-specific historical doctrine record and
no universal numerical orb policy. Those gaps are preserved in the artifact;
the four integrated meanings are NatalNode `EDITORIAL_SYNTHESIS` from the
bounded inputs above.

## 3. Body function separation

Moon and Mercury answer different symbolic questions:

| Body | Bounded function | Not admitted from the body alone |
| --- | --- | --- |
| Moon | Recurring response, rhythm, receptivity, inner experience, memory, and needs | An emotions-only identity, diagnosis, family history, or complete personality |
| Mercury | Thinking, naming, language, interpretation, comparison, learning, reasoning, movement, and exchange | An intelligence score, communication verdict, or complete personality |

The method must preserve both functions in every record. The body pair is not
collapsed into “thoughts versus feelings,” “emotional intelligence,” or any
other imported cliché.

## 4. Aspect relation as operator

The relation field is separate from both body fields. It records the structural
interaction introduced by the aspect, not an automatic valence.

| Relation | Bounded structural operator | What it does not decide |
| --- | --- | --- |
| Conjunction | Co-presence, concentration, combination, and close coupling | Harmony, importance, strength, or a single merged function |
| Trine | Relatively easier circulation, flow, and compatibility where admitted | Talent, virtue, health, success, or effortless outcome |
| Square | Active friction, pressure, and a need for adjustment where admitted | Badness, failure, pathology, or inevitable conflict |
| Opposition | Polarity, facing, alternation, perspective, and negotiation where admitted | Split personality, relationship doom, or a required winner |

These terms are qualified vocabulary from the existing Foundations and
interpretation sources. They are not universal formulas. The aspect relation
must be expressed as a relationship between Moon and Mercury, not as a label
that replaces either body.

### 4.1 Conjunction school nuance

The current Web/Foundations vocabulary includes conjunction in the five major
aspect set and describes it through a near-zero relationship, concentration,
combination, or close merging. The repository does not contain a reviewed
historical source that resolves whether a named classical/Ptolemaic scheme
classifies conjunction in exactly the same way as the other geometrical
aspects. Therefore this method records the nuance as unresolved and uses the
existing broader `aspect relation` data shape without making a historical
classification claim.

Traditional/classical, early-modern, and modern/psychological material remain
named lenses. They are not silently flattened into one universal doctrine.

## 5. Four frozen relational compositions

The review dossier gives the full record-by-record audit. The method freezes
these distinctions:

| Composition | Structural interaction | Bounded question |
| --- | --- | --- |
| Conjunction | Moon response/need and Mercury naming/interpretation are concentrated in close coupling; each can make the other more immediate. | How can response and naming occupy the same field without one being mistaken for the whole of the other? |
| Trine | Moon response/need and Mercury naming/interpretation have a comparatively easier channel for circulation and mutual support. | Where can felt information and language move readily, and where does ease still need deliberate checking? |
| Square | Moon response/need and Mercury naming/interpretation meet through active friction that asks for translation, pacing, or adjustment. | What needs to be slowed, distinguished, or reworded when response and interpretation press against each other? |
| Opposition | Moon response/need and Mercury naming/interpretation face across a polarity that may alternate attention and invite negotiation. | How can felt response and interpretation be held as two perspectives in conversation without forcing one to win? |

The difference is not “strong / good / bad / conflict.” Each operator changes
the relationship structure while the two body functions remain constant.

## 6. Evidence lineage and independence accounting

An aspect is a relational fact with dependent position roots:

```text
Moon position root ------------------+
                                     +--> Moon–Mercury aspect relation
Mercury position root ---------------+
```

The semantic unit has three distinct dimensions — Moon function, Mercury
function, and aspect relation — but it does not have three independent
astronomical roots.

Every representative record MUST preserve:

- a stable `relationalFactId`;
- the two dependent position fact keys;
- the two underlying `evidenceRootKeys`;
- `independentRootCount = 2` for those roots;
- `relationalFactIsIndependentRoot = false`;
- `relationalFactAddsSemanticInformation = true`; and
- an accounting rule that prevents the relation from becoming a third
  confirmation when the same two position roots are already present.

This is the frozen distinction:

```text
SEMANTIC DISTINCTNESS != EVIDENCE ROOT INDEPENDENCE
```

The relation adds information about interaction that a simple placement does
not contain. It does not add a new independent astronomical root. A later
convergence layer must deduplicate root keys across placement and aspect
records before counting support.

## 7. Aspect fact authority

NatalNode-Web does not calculate astronomy for this method. A valid future
input assumes an admitted authoritative aspect fact from the Engine boundary.
The method does not derive an aspect from fake degrees, labels, signs, a
picture, or a synthetic angular separation.

The semantic record therefore requires:

- body pair and aspect type from the admitted fact;
- aspect authority and provenance from the upstream calculation boundary;
- an orb policy identity/result when the chosen method requires it; and
- phase state only when the upstream result supplies it.

The artifact does not claim that any research fixture is `AUTHORITATIVE_ENGINE`.
Development fixtures are suppressed for future aspect admission. The artifact
itself is a research semantic method, not a chart result.

## 8. Orb, phase, and modifier policy

No new universal orb number is introduced. The existing repository recognizes
orb as a method-qualified angular tolerance and the Chart contract supplies an
orb field, but no new aspect-specific table is admitted here.

Applying, exact, and separating are optional returned technical states. The
method does not infer phase from static positions, prose, or aspect type. The
four core compositions remain semantically valid when phase is unresolved.

Modifiers are explicit:

| Modifier | Status | Boundary |
| --- | --- | --- |
| Authoritative body-position roots | REQUIRED | Both positions must be supplied by an admitted chart result. |
| Authoritative aspect fact | REQUIRED | The relation must be returned/admitted; Web does not calculate it. |
| Aspect type | REQUIRED | Must be one of the four inventory records. |
| Orb policy identity/result | REQUIRED_FOR_ASPECT_ADMISSION; value optional in this method | No universal number is invented. |
| Applying/exact/separating | OPTIONAL_IF_RETURNED | Unresolved remains unresolved; no phase meaning is imported automatically. |
| Western Tropical model | REQUIRED | Sidereal or another model is not silently substituted. |
| School/method choice | REQUIRED_FOR_NARROWER_READING | Traditional/classical, early-modern, and modern/psychological lenses remain named. |
| Sign placements | OPTIONAL_FOR_CORE_RELATION | Required only when a narrower sign-qualified question uses them. |
| Houses and house system | OPTIONAL_FOR_CORE_RELATION; REQUIRED_FOR_HOUSE_READING | Never infer a house. |
| Exact geometry / degrees | OPTIONAL_IF_RETURNED | Must come from authority; this method does not calculate or intensify from it. |
| Other chart factors and counterevidence | REQUIRED_FOR_PERSONAL_NARROWING | The relation alone is not a whole-chart conclusion. |
| Birth-time authority | REQUIRED | Unknown time blocks the relation by default unless Engine authority certifies it. |
| Temporal context | NOT_APPLICABLE_TO_NATAL_CORE | No transit or forecast meaning is introduced. |

## 9. Unknown birth time

Unknown birth time is fail-closed for aspect eligibility by default. The Moon
position may materially change across an unknown-time window, and aspect
eligibility, orb, or exactness may therefore change. This method does not use
noon, midnight, a default time, an average, or a guessed aspect.

Only a future authoritative Engine result may certify that the aspect remains
valid under the available time uncertainty. Until then:

```text
UNKNOWN BIRTH TIME -> ASPECT ELIGIBILITY SUPPRESSED
```

This is stricter than the admitted placement-level Body × Sign behavior and
does not alter that earlier method.

## 10. Anti-stereotype and content-value boundary

The records are semantic material capable of supporting later Recognition,
Constructive Capacity, Pattern, Tension, and Lever work. They do not emit
“You are…” prose, diagnosis, prediction, guaranteed outcome, praise, or a
deterministic personality type.

At minimum, the artifact forbids these shortcuts:

- conjunction is not “says exactly what they feel,” “emotionally intelligent,”
  or guaranteed strong communication;
- trine is not gifted communication, natural eloquence, psychological health,
  or an easy childhood;
- square is not irrationality, anxiety, instability, poor communication,
  mental-health diagnosis, or “head versus heart” doctrine;
- opposition is not split personality, bipolarity, chronic indecision,
  relationship doom, or an inability to integrate thought and feeling.

The method retains a possible trade-off for every relation. Ease is not virtue;
friction is not badness; polarity is not pathology; concentration is not
automatic strength.

## 11. Personal Synthesis compatibility

These are composition objects, not Signals or PersonalThemes. A future aspect
Signal task would still need to define an admitted rule, domain, direction,
intensity, confidence, evidence accounting, provenance, suppression, WHY,
LEARN, and birth-time eligibility. This task intentionally assigns none of
those Signal values.

The future chain remains:

```text
AUTHORITATIVE ASPECT FACT
  -> ADMITTED ASPECT COMPOSITION
  -> FUTURE ASPECT SIGNAL RULE
  -> PERSONAL SYNTHESIS
```

No My Chart, Weekly, Engine, BFF, provider, AI, or runtime import is added.

## 12. Source gaps and unresolved boundaries

The artifact records these gaps rather than filling them:

| Gap | Result |
| --- | --- |
| No reviewed Moon–Mercury-specific historical doctrine in this repository | No historical pair-specific claim; integrated wording remains `EDITORIAL_SYNTHESIS`. |
| No admitted universal orb table for this aspect pair | No numeric orb value or strength rule. Upstream orb authority remains required. |
| No repository policy resolving applying/separating meaning for this composition | Phase remains optional and unresolved; no automatic semantic modifier. |
| No repository resolution of historical conjunction classification nuance | Nuance is recorded; the broader aspect-relation schema is used without claiming historical equivalence. |
| Unknown-time aspect authority | Fail closed unless a future Engine result explicitly certifies eligibility. |

## 13. Validation gates and readiness

The package must pass the targeted validation suite and record:

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
```

Readiness is explicitly bounded:

```text
READY_FOR_BOUNDED_ASPECT_COMPOSITION_ADMISSION YES
READY_FOR_ASPECT_SIGNAL_POLICY NO
READY_FOR_BROAD_SCALE NO
RUNTIME_ADMISSION NO
```

Passing this method does not map square to `CHALLENGING`, trine to
`SUPPORTIVE`, conjunction to `STRONG`, or opposition to `MIXED`.
