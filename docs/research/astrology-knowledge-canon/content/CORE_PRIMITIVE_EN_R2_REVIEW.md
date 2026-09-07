# NatalNode Human Knowledge R2 — Representative Editorial Review

**Task:** `WEB-P2-CONTENT-R2-001`  
**Package:** `natalnode.human-knowledge-r2.representative-en`  
**Canonical locale:** English (`en`)  
**Content revision:** `r2.0`  
**Package state:** `EDITORIAL_REVIEW_PACKAGE`  
**Runtime:** `RUNTIME_NOT_ADMITTED`

This dossier audits the five-object representative package in
[CORE_PRIMITIVE_EN_R2.json](./CORE_PRIMITIVE_EN_R2.json). It is a new
editorial artifact, not a replacement for the 25-object V1 package. The
existing primitive canon, source register, school policy, and runtime freeze
remain authoritative.

## R2 learning rhythm

Every object follows the same reader-facing sequence:

1. **What** — name the idea in ordinary language.
2. **Why** — explain why astrologers group, distinguish, or use it.
3. **Nearby distinction** — separate the closest commonly confused concept.
4. **Concrete example** — teach the structure without reading a person.
5. **Why it matters in a chart** — state the bounded chart question.
6. **One necessary limit** — give one compact reader-facing boundary.
7. **Next learn** — point to the next concept or chart layer.

The machine-facing `limitations`, `sourceRefs`, `schoolNotes`, policy states,
and dependency metadata remain alongside the prose. All R2 prose fields are
marked at object level as `EDITORIAL_SYNTHESIS`; the source references support
the bounded claims but do not turn editorial wording into a direct quotation.

## Scope and authority

- Included exactly: Moon, Mercury, Aries, Fixed, and Basic sign rulership.
- The package uses the Western tropical boundary and the modern/psychological
  Western lens as the default candidate lens.
- Traditional/classical and named modern variants remain labelled rather than
  merged.
- The traditional seven-visible-planet rulership mapping remains the baseline.
  Pluto, Uranus, and Neptune remain named modern alternatives only.
- No default co-ruler, advanced dignity, dispositor, mutual reception,
  triplicity, bounds, faces, exaltation, fall, or detriment doctrine is added.
- No Planet × Sign composition, personal synthesis, My Chart, Weekly, Engine,
  BFF, UI runtime, localization, or AI generation is included.

## Internal editorial audit

`PASS` means the criterion is satisfied for the representative object at the
bounded canon depth. The audit is intentionally content-focused; it is not
Product Owner approval or runtime admission.

| Criterion | Moon | Mercury | Aries | Fixed | Rulership | Audit evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Human readability | PASS | PASS | PASS | PASS | PASS | What, example, and next-learn prose uses ordinary teaching language before technical detail. |
| Astrology WHY quality | PASS | PASS | PASS | PASS | PASS | Why fields explain traditional grouping or use, not NatalNode schema or governance design. |
| Nearby distinction clarity | PASS | PASS | PASS | PASS | PASS | Moon/Sun, Mercury/Sun and intelligence, Aries/Mars, Fixed/element and modes, and rulership/placement are explicit. |
| Concrete-example quality | PASS | PASS | PASS | PASS | PASS | Each object has one neutral example that teaches structure without a personal reading. |
| Why it matters in a chart | PASS | PASS | PASS | PASS | PASS | Each chartRelevance field states a bounded question and keeps sign, body, mode, ruler, and context distinct. |
| Source traceability | PASS | PASS | PASS | PASS | PASS | Every object preserves source status, epistemic status, policy state, source refs, school notes, and dependencies. |
| Anti-Barnum discipline | PASS | PASS | PASS | PASS | PASS | No second-person certainty, fixed person type, diagnosis, prediction, guaranteed outcome, or moral judgment is admitted. |
| Guardrail repetition | PASS | PASS | PASS | PASS | PASS | Each reader record has one compact limitation; repeated machine boundaries remain metadata rather than filler prose. |
| Governance-language leakage | PASS | PASS | PASS | PASS | PASS | Reader fields avoid schema, primitive, policy, evidence-object, runtime, and similar manual vocabulary. |
| School-policy integrity | PASS | PASS | PASS | PASS | PASS | Western tropical scope and traditional/modern distinctions remain named; no unrelated system or silent co-ruler is introduced. |
| **Overall** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | All five representatives pass the internal R2 audit. |

## Focused audit notes

### Moon

The R2 copy makes response, rhythm, receptivity, inner experience, and needs
the subject of the lesson instead of treating “Moon equals emotions” as the
lesson. The Sun comparison explains a nearby body distinction, while the
historical mother, gender, body, and medical boundary remains in policy
metadata and one compact reader limitation. Moon phase and current-Moon timing
remain excluded.

### Mercury

The R2 copy teaches information work through naming, comparison, translation,
learning, and exchange. It explicitly separates Mercury from both general
intelligence and the Sun, then uses a checklist example to demonstrate the
function without scoring the learner. Rulership of Gemini and Virgo remains a
separate relationship rather than an imported personality meaning.

### Aries

The R2 copy explains Fire, Cardinal, and Mars as different contributions to a
sign without turning them into interchangeable synonyms. The Mars distinction
is explicit, and the neutral starting-a-process example teaches initiation
without turning Aries into an “always leads” profile.

### Fixed

The R2 copy explains Fixed as continuation and consolidation within the
seasonal quadruplicity model, then contrasts mode with element. The four Fixed
signs are named with their different elements, and the maintained-process
example separates continuity from stubbornness. The existing Taurus exemplar
is preserved without creating a Fixed matrix.

### Basic sign rulership

The R2 copy distinguishes a sign-to-planet relationship from a planet being
located in a sign. The Aries/Mars and Taurus/Venus examples teach the baseline,
while Scorpio/Mars and modern Pluto are presented as a labelled alternative
without replacing the traditional mapping. Advanced technical doctrines stay
outside scope.

## Source and policy traceability

| Primitive | Source refs | Preserved policy boundary |
| --- | --- | --- |
| Moon | `PC-06`, `PC-07`, `PC-19` | Response/need vocabulary is bounded; historical body, parent, gender, medical, phase, and timing material is not default personal doctrine. |
| Mercury | `PC-06`, `PC-08`, `PC-13`, `PC-14`, `PC-19` | Thinking, language, learning, interpretation, exchange, movement, and commerce remain bounded; no intelligence or communication guarantee. |
| Aries | `PC-11`, `PC-12`, `PC-13`, `PC-14`, `PC-19` | Fire/Cardinal/Mars structure remains a Western tropical editorial synthesis; no person profile or Mars causal claim. |
| Fixed | `PC-01`, `PC-12`, `PC-19` | Continuation and stabilization remain distinct from stubbornness; historical solid language is labelled and no full Fixed matrix is created. |
| Basic sign rulership | `PC-13`, `PC-14`, `PC-19` | Seven-visible-planet mapping is the baseline; modern outer planets are named alternatives and default co-rulers remain unadmitted. |

## Decision

**Internal representative audit:** `PASS — 5/5`  
**R2 method result:** `REPRESENTATIVE_METHOD_PASS`  
**Scale decision:** Not granted by this artifact. The five examples pass the
method gate, but broader canon expansion still requires a separately scoped
editorial task and review.  
**Runtime decision:** `RUNTIME_NOT_ADMITTED`  
**Localization decision:** `NOT_IN_SCOPE`
