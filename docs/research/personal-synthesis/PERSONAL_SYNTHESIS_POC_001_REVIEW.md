# NatalNode Personal Synthesis POC 001 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-PERSONAL-SYNTHESIS-001` |
| Baseline | `89b6c5a561af49ddc14b7530961f6df8ea6de742` |
| POC status | `DETERMINISTIC_SYNTHESIS_PASS` |
| Fixture authority | `DEVELOPMENT_ONLY` |
| Semantic basis status | `RUNTIME_NOT_ADMITTED` |
| Production runtime admission | `NO` |
| Next bounded decision | `READY_FOR_MY_CHART_POC` |

This dossier reviews the isolated Personal Synthesis POC. It proves a small
deterministic path from existing provider-neutral fact inputs to selected
personal themes and bounded editorial structure. It does not authorize a
production My Chart or Weekly integration.

## 1. Scope and authority

The implementation is isolated at:

```text
apps/web/src/features/interpretation/personal-synthesis-poc.ts
apps/web/test/personal-synthesis-poc.test.mjs
```

The POC reuses the existing:

- `InterpretationFactInput` fact shape;
- immutable `InterpretationSignalRuleRegistry`;
- closed domain, direction, intensity, and confidence vocabularies;
- deterministic Signal ranking; and
- Signal composition and provenance contracts.

The POC file is not exported from the production interpretation index and has
no UI, route, Engine, BFF, provider, AI, transport, cache, persistence, or
production content import.

The repository's `WEB_UI_FIXTURE_V1` is a single incomplete-research UI
fixture. It is not suitable as the sole source for all five cases without
mutating its topology or authority. The POC therefore uses explicit synthetic
`InterpretationFactInput` fixtures that conform to the existing provider-
neutral fact contract. Every fixture and result is marked `DEVELOPMENT_ONLY`;
none is presented as an astronomy observation.

The semantic basis allowlist is limited to the five representative Human
Knowledge R2 object IDs:

```text
body.moon
body.mercury
sign.aries
modality.fixed
rulership.basic
```

R2 remains `RUNTIME_NOT_ADMITTED`. The allowlist is a POC guard, not a canon
import or a broad-scale admission decision.

## 2. PersonalTheme contract

Every selected `PersonalSynthesisPersonalTheme` carries:

| Field | POC behavior |
| --- | --- |
| Stable identity | `personal-theme.<semanticThemeKey>` |
| Domain | Existing six-domain Signal vocabulary only. |
| Direction | `SUPPORTIVE`, `CHALLENGING`, `MIXED`, or `NEUTRAL`; derived from source Signals. |
| Intensity | Existing qualitative vocabulary; no user-facing score. |
| Confidence | Conservative minimum across contributing candidates; evidence quality, not probability. |
| Evidence | Deduplicated source ChartFact references. |
| Semantic basis | Allowlisted representative object ID. |
| Composition refs | Explicit POC rule IDs for the source-to-theme relation. |
| Authority | Always `DEVELOPMENT_ONLY`. |
| Birth-time dependency | Explicit `UNKNOWN_TIME_SAFE` or `REQUIRES_KNOWN`. |
| Ranking rationale | Ordinal categories and existing Signal rank tie-break only. |
| Convergence | Independent evidence keys and source Signal IDs. |
| Redundancy | Retained theme and suppressed alternatives. |
| Editorial projection | Recognition, Strength, Pattern, Tension, Lever, Why, Learn, and Deeper references. |

The POC output exposes no percentage, probability, accuracy score, or fake
importance number.

## 3. Deterministic synthesis policy

The implemented path is:

```text
ChartFacts / InterpretationFactInput
    -> immutable candidate rules
        -> evaluated Signals
            -> semantic theme grouping
                -> convergence and redundancy decisions
                    -> deterministic ranking
                        -> domain-aware 3–5 theme selection
                            -> bounded editorial projection
                                -> WHY / LEARN trace
```

### 3.1 Candidate admission

Before evaluation, every candidate must have:

- an allowlisted semantic basis;
- an explicit editorial template;
- an admitted Signal domain;
- a composition rule reference;
- a source fact reference;
- a convergence key;
- a redundancy key;
- an independent evidence key; and
- an explicit birth-time requirement.

Unsupported semantic bases fail closed before a Signal is created. Time-
sensitive fact kinds must require known birth time. Candidate prose is never
created directly from an arbitrary fact label.

### 3.2 Ranking order

The POC uses a deterministic ordinal comparison in this order:

1. `CORE` structural centrality before `SUPPORTING`.
2. Explicit user-question match when supplied.
3. Convergent independent evidence before single evidence.
4. Higher conservative confidence before lower confidence.
5. Mixed/tension evidence before single-direction evidence when the preceding
   categories tie.
6. Direct domain relevance before contextual relevance.
7. Themes safe without known birth time before themes requiring known time.
8. Existing deterministic Signal rank as an internal tie-break.
9. Stable lexical semantic-theme key as the final tie-break.

These are selection mechanics, not astrology truth or user-facing importance.
No new pseudo-scientific numeric score was introduced. The only numeric tie
break is the existing Signal rank already owned by the Interpretation System.

### 3.3 Domain-aware selection

The selector first retains the strongest eligible group for each materially
supported domain (`HIGH` or `MEDIUM` confidence), up to the maximum of five.
It then fills remaining slots by the same deterministic ranking order.

This prevents five near-identical themes in one domain when other materially
supported domains exist. It does not force weak diversity: `LOW`-confidence
domains do not create a seed, and a fixture with only one supported domain
remains concentrated.

### 3.4 Convergence versus redundancy

| Condition | Result |
| --- | --- |
| Same semantic theme, distinct independent evidence keys | One theme with `CONVERGENT` trace and all source evidence preserved. |
| Same semantic theme, repeated independent evidence key | One theme; repeated candidate is `MERGED_SAME_EVIDENCE` and does not increase convergence. |
| Different semantic theme keys, same redundancy key | Deterministically retain the clearest group and mark the alternative `SUPPRESSED_REDUNDANCY`. |
| Different themes and distinct redundancy keys | Remain separate when each is materially supported. |

### 3.5 Tension

Tension is emitted only when the composed group contains both supportive and
challenging source directions. The POC keeps both source Signal IDs, emits
`MIXED`, and uses one editorial template whose lever follows the same
initiation/continuation trade-off. It does not add a negative trait merely to
balance a positive paragraph.

## 4. Fixture review

### CASE A — `CASE_A_CONVERGENT_SUPPORT`

#### Input evidence

```text
/bodies/Mercury              Mercury placement
/aspects/Mercury-Venus       Mercury–Venus aspect
/bodies/Aries                Aries sign layer
/bodies/Saturn               Fixed-sign layer
```

There are three communication candidates. Two are independent (`Mercury`
placement and the Mercury–Venus aspect); one repeats the Mercury placement.

#### Candidate and selection trace

| Candidate | Decision | Reason |
| --- | --- | --- |
| `mercury-placement-clarity` | `SELECTED` | Representative communication candidate. |
| `mercury-aspect-clarity` | `MERGED_CONVERGENCE` | Independent supporting evidence. |
| `mercury-placement-repeat` | `MERGED_SAME_EVIDENCE` | Repeated underlying Mercury evidence. |
| `aries-self-direction` | `SELECTED` | Distinct supported SELF theme. |
| `fixed-work-continuity` | `SELECTED` | Distinct supported WORK_CREATION theme. |

#### Final themes and editorial output

| Theme | Signal state | Personal editorial structure |
| --- | --- | --- |
| `communication-clarity` | `COMMUNICATION / SUPPORTIVE / STRONG / MEDIUM / CONVERGENT` | **Recognition:** Mercury placement and Mercury–Venus evidence make clear exchange a useful question. **Strength/Pattern:** name the useful point before explanation expands; attention may gather around making a message legible and answerable. **Tension:** directness can become too much framing. **Lever:** name the point, then pause for the response. |
| `self-direction` | `SELF / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** the Aries sign layer makes self-direction a useful question. **Strength/Pattern:** identify a direction and give it a first form. **Tension:** a first direction can narrow the field too quickly. **Lever:** state the direction and the context that could revise the next step. |
| `work-continuity` | `WORK_CREATION / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** the Fixed-sign layer makes continuity and output a useful question. **Strength/Pattern:** keep a meaningful process in view long enough to develop it. **Tension:** continuity can become inertia. **Lever:** choose what to maintain and what would justify changing it. |

#### WHY / LEARN trace

The communication theme preserves both `/bodies/Mercury` and
`/aspects/Mercury-Venus`, two composition rule references, and two independent
evidence keys. Its Why explicitly says repeated copies count once and that no
mixed direction is claimed. Learn points to `body.mercury`; the other themes
point to `sign.aries` and `modality.fixed`. No fact is rendered as a separate
paragraph merely because it exists.

### CASE B — `CASE_B_MEANINGFUL_TENSION`

#### Input evidence

```text
/signs/Aries                 Aries sign layer
/modalities/Fixed            Fixed modality layer
/bodies/Moon                 Moon placement
```

The Aries and Fixed candidates share `action-pacing-tradeoff` and the
`ACTION_DECISION` domain, but carry opposite directions. The Moon evidence
supports separate relationship and emotional questions.

#### Candidate and selection trace

| Candidate | Decision | Reason |
| --- | --- | --- |
| `initiation-support` | `SELECTED` | Primary side of the action trade-off. |
| `continuation-challenge` | `MERGED_CONVERGENCE` | Independent challenging side retained in the same theme. |
| `relationship-boundary` | `SELECTED` | Distinct relationship domain. |
| `emotional-pacing` | `SELECTED` | Distinct emotional domain. |

#### Final themes and editorial output

| Theme | Signal state | Personal editorial structure |
| --- | --- | --- |
| `deliberate-action` | `ACTION_DECISION / MIXED / STRONG / MEDIUM / CONVERGENT` | **Recognition:** Aries and Fixed layers make the first useful step a live question. **Strength/Pattern:** begin or activate one defined move; attention gathers around momentum and pacing. **Tension:** momentum can outrun pacing while caution keeps a step in draft form. **Lever:** name the first reversible step and missing information. |
| `relationship-boundary` | `RELATIONSHIP / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** the Moon placement makes closeness and boundaries a useful question. **Strength/Pattern:** notice what keeps connection responsive. **Tension:** protecting steadiness can reduce openness. **Lever:** name the boundary and the connection it protects. |
| `emotional-pacing` | `EMOTIONAL / NEUTRAL / NOTICEABLE / MEDIUM` | **Recognition:** the Moon placement makes response, rhythm, and steadiness a useful question. **Strength/Pattern:** notice what helps a response settle. **Tension:** a familiar response can narrow choices. **Lever:** name the first response and allow one more observation. |

#### WHY / LEARN trace

`deliberate-action` has two source facts, two source Signal IDs, two
composition rules, and two independent evidence keys. Its Why marks the
direction as mixed and explicitly says supportive and challenging evidence
remain together. Learn points to `sign.aries` and `modality.fixed`. The Moon
themes each preserve `/bodies/Moon` and point to `body.moon`; they are not
treated as additional evidence for the action trade-off.

### CASE C — `CASE_C_REDUNDANCY`

#### Input evidence

```text
/bodies/Mercury              Mercury placement
/bodies/Aries                Aries sign layer
/modalities/Fixed            Fixed modality layer
```

Two communication candidates have different semantic theme keys but the same
`communication-claim` redundancy key and the same underlying Mercury evidence.

#### Candidate and selection trace

| Candidate | Decision | Reason |
| --- | --- | --- |
| `clarity-primary` | `SELECTED` | Higher deterministic representative rank. |
| `directness-restatement` | `SUPPRESSED_REDUNDANCY` | Same claim family and same underlying evidence. |
| `aries-self` | `SELECTED` | Distinct supported SELF theme. |
| `fixed-work` | `SELECTED` | Distinct supported WORK_CREATION theme. |

#### Final themes and editorial output

| Theme | Signal state | Personal editorial structure |
| --- | --- | --- |
| `communication-clarity` | `COMMUNICATION / SUPPORTIVE / STRONG / HIGH` | **Recognition:** Mercury placement makes clear exchange a useful question. **Strength/Pattern:** name the point before expanding the explanation. **Tension:** directness can remove room for response. **Lever:** make the point, then pause. |
| `self-direction` | `SELF / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** Aries makes self-direction a useful question. **Strength/Pattern:** identify a direction and give it a first form. **Tension:** the field can narrow too quickly. **Lever:** name context that could revise the next step. |
| `work-continuity` | `WORK_CREATION / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** Fixed modality makes continuity and output a useful question. **Strength/Pattern:** develop a meaningful process. **Tension:** continuity can become inertia. **Lever:** define what would justify changing it. |

#### WHY / LEARN trace

The final communication theme has one evidence path and explicitly reports
`SINGLE_EVIDENCE`; the suppressed candidate does not increase confidence or
convergence. Its Learn reference is `body.mercury`. The self and work themes
retain their own fact, composition, and Learn references. No reworded copy is
rendered as a second communication theme.

### CASE D — `CASE_D_UNKNOWN_BIRTH_TIME`

#### Input evidence

Available:

```text
/bodies/Mercury              Mercury placement
/bodies/Moon                 Moon placement
```

Unavailable or authority-blocked:

```text
/angles/ASC                  unavailable angle fact
/angles/MC                   unavailable angle fact
/bodies/Sun/house            unavailable house fact
```

The fixture's birth-time authority is `UNKNOWN`. The angle and house
candidates require known birth time and are skipped before matching.

#### Candidate and selection trace

| Candidate | Decision | Reason |
| --- | --- | --- |
| `unknown-safe-communication` | `SELECTED` | Placement-level evidence remains available. |
| `unknown-safe-emotional` | `SELECTED` | Placement-level evidence remains available. |
| `blocked-ascendant` | `SKIPPED_AUTHORITY` | `BIRTH_TIME_UNAVAILABLE`. |
| `blocked-house` | `SKIPPED_AUTHORITY` | `BIRTH_TIME_UNAVAILABLE`. |

#### Final themes and editorial output

| Theme | Signal state | Personal editorial structure |
| --- | --- | --- |
| `communication-clarity` | `COMMUNICATION / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** Mercury placement makes clear exchange a useful question. **Strength/Pattern:** name the point before explanation expands. **Tension:** directness can remove room for response. **Lever:** name the point and pause. |
| `emotional-pacing` | `EMOTIONAL / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** Moon placement makes response, rhythm, and steadiness a useful question. **Strength/Pattern:** notice what helps a response settle. **Tension:** familiar response can narrow choices. **Lever:** allow one more observation before deciding. |

#### WHY / LEARN trace

Every selected evidence reference is a placement-level reference. No final
theme contains `NATAL_ANGLE_POSITION`, `NATAL_HOUSE_PLACEMENT`, `/angles/`, or
`/house`. No noon, midnight, or guessed instant is inserted. The skipped
candidate records remain in the machine trace so the suppression is inspectable
without leaking forbidden facts into the personal output. Learn points to
`body.mercury` and `body.moon`.

### CASE E — `CASE_E_DOMAIN_PRIORITIES`

#### Input evidence

```text
/bodies/Aries                Aries sign layer
/bodies/Moon                 Moon placement
/bodies/Mercury              Mercury placement
/modalities/Fixed            Fixed modality layer
/aspects/Moon-Mercury        Moon–Mercury aspect
```

The fixture supplies materially supported candidates across five domains:
`SELF`, `EMOTIONAL`, `COMMUNICATION`, `WORK_CREATION`, and
`ACTION_DECISION`.

#### Candidate and selection trace

| Candidate | Decision | Reason |
| --- | --- | --- |
| `domain-self` | `SELECTED` | Domain seed and direct relevance. |
| `domain-emotional` | `SELECTED` | Domain seed and high confidence. |
| `domain-communication` | `SELECTED` | Domain seed and high confidence. |
| `domain-work` | `SELECTED` | Domain seed and direct relevance. |
| `domain-action` | `SELECTED` | Domain seed; neutral direction remains explicit. |

#### Final themes and editorial output

| Theme | Signal state | Personal editorial structure |
| --- | --- | --- |
| `self-direction` | `SELF / SUPPORTIVE / NOTICEABLE / HIGH` | **Recognition:** Aries makes self-direction a useful question. **Strength/Pattern:** identify a direction and first form. **Tension:** a direction can narrow the field. **Lever:** name context that could revise the next step. |
| `emotional-pacing` | `EMOTIONAL / SUPPORTIVE / NOTICEABLE / HIGH` | **Recognition:** Moon makes response and steadiness a useful question. **Strength/Pattern:** notice what settles a response. **Tension:** familiarity can narrow choices. **Lever:** allow another observation. |
| `communication-clarity` | `COMMUNICATION / SUPPORTIVE / NOTICEABLE / HIGH` | **Recognition:** Mercury makes clear exchange a useful question. **Strength/Pattern:** name the useful point. **Tension:** directness can over-frame. **Lever:** name the point and pause. |
| `work-continuity` | `WORK_CREATION / SUPPORTIVE / NOTICEABLE / MEDIUM` | **Recognition:** Fixed modality makes continuity and output a useful question. **Strength/Pattern:** develop a meaningful process. **Tension:** continuity can become inertia. **Lever:** define the signal that would justify change. |
| `deliberate-action` | `ACTION_DECISION / NEUTRAL / NOTICEABLE / MEDIUM` | **Recognition:** the Moon–Mercury evidence makes a first useful step a question. **Strength/Pattern:** identify one defined move. **Tension:** momentum and pacing can pull differently. **Lever:** name the reversible step and missing information. |

#### WHY / LEARN trace

The five final themes contain five distinct domain assignments and preserve the
five source fact paths. Each has one composition reference, one evidence key,
explicit direction/intensity/confidence, and contextual Learn references. The
selector did not create a low-confidence filler domain; every selected domain
was materially supported by the fixture.

## 5. Naive fact-dump comparison

For CASE A, a naive renderer would produce four adjacent fact paragraphs:

```text
Mercury placement
Mercury–Venus aspect
Aries sign layer
Fixed-sign layer
```

The POC produces three core themes:

```text
communication-clarity  <- two independent paths plus one repeated candidate merged
self-direction         <- Aries evidence
work-continuity        <- Fixed evidence
```

The communication evidence is explained once, the repeated Mercury candidate
does not create another paragraph, and the reader receives a bounded pattern,
trade-off, lever, Why explanation, and Learn bridge. This is materially more
useful than fact count while remaining traceable to the same source inputs.

## 6. Targeted acceptance results

| Decision | Result | Evidence |
| --- | --- | --- |
| `DETERMINISTIC_SYNTHESIS` | **PASS** | Same fixture produces byte-equivalent structured output on repeated runs. |
| `THEME_SELECTION` | **PASS** | Maximum five, domain-aware seeds, stable tie-break, no fact dump as the core output. |
| `REDUNDANCY_SUPPRESSION` | **PASS** | CASE A repeated evidence merges without convergence gain; CASE C alternative is suppressed. |
| `TENSION_MODEL` | **PASS** | CASE B preserves supportive and challenging Signal IDs and emits `MIXED`. |
| `UNKNOWN_TIME_AUTHORITY` | **PASS** | CASE D skips ASC/MC/house candidates with `BIRTH_TIME_UNAVAILABLE`. |
| `EVIDENCE_TRACEABILITY` | **PASS** | Every selected theme retains facts, Signals, basis IDs, rule refs, confidence, and Learn refs. |
| `PERSONAL_CONTENT_VALUE` | **PASS** | Bounded R/S/P/T/L structure is more selective and useful than primitive dumping. |
| `READY_FOR_MY_CHART_POC` | **YES** | Yes, for a separately gated bounded POC only. |
| Runtime admission | **NO** | All code and output remain development-only. |

## 7. Validation performed

Targeted command:

```text
npm run test:personal-synthesis-poc --workspace=@natalnode/web
```

Final result:

```text
9 tests passed
0 tests failed
```

The targeted test covers:

- repeatability;
- convergence;
- repeated-evidence non-convergence;
- redundancy suppression;
- mixed/tension handling;
- maximum-theme cap;
- evidence and Learn provenance;
- unknown birth time;
- no ASC/MC/house leakage into final themes;
- domain assignment;
- stable tie-breaking;
- unsupported semantic input fail-closed; and
- no AI, transport, UI, or production-index integration.

No broad build or unrelated suite was run because this is an isolated POC
change with a dedicated compile-and-test command and no dependency changes.

## 8. Unresolved gaps and boundary

- Production authoritative ChartFacts, per-fact identity, scientific
  configuration, and provenance remain separate gates.
- The POC composition rules, template set, and ranking policy are research
  artifacts; they are not production interpretation policy.
- Human Knowledge R2 remains `RUNTIME_NOT_ADMITTED`; no broad canon scaling was
  performed.
- No My Chart, Weekly, Today, Month, BFF, or UI integration was attempted.
- Temporal relevance and explicit user-question ranking are represented in the
  contract but are not materially exercised by these natal-only fixtures.
- A future My Chart POC must establish its own production/development source
  boundary and owner acceptance before consuming this harness.

This review does not claim production readiness, scientific validation, or
runtime admission.
