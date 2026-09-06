# Sun / Taurus Product Policy Review

Status: POLICY_REVIEW_REQUIRED

Research package: WEB-P2-ASTROLOGY-KNOWLEDGE-RESEARCH-001

This document proposes a small number of bundled Product Owner decisions. It
does not silently admit a school, a runtime record, or a personal-reading
default.

## 1. Decision boundary

The source research is sufficient to review the structural primitives and a
bounded Sun/Taurus composition. It is not a license to merge classical,
early-modern, and modern language into one universal meaning.

The decision must preserve these lanes:

| Lane | Meaning | Product treatment |
| --- | --- | --- |
| Astronomy / chart fact | Calculated Sun, sign, house, aspects, and authority metadata | Engine and chart-result contract; not changed here |
| Astrology convention | Earth, Fixed, Venus-ruled, solid, triplicity, and named solar significations | Source-labelled and school-scoped |
| Interpretation tradition | Historical, early-modern, or modern psychological meaning | Never merged without a named lens |
| NatalNode policy | Eligibility, limitation, disclosure, and suppression rules | Product Owner authority |
| Scientific claim | Evidence-based science | Astrology wording must not occupy this lane |

## 2. Recommended policy package

### Package A: bounded plural lens (recommended)

1. Use modern Western/psychological vocabulary as the default educational
   lens only after explicitly naming it.
2. Admit Earth, Fixed, and Venus-ruled as structural conventions with
   conditions, not as scientific or deterministic traits.
3. Keep traditional and early-modern material available as labelled historical
   comparison, not as hidden defaults.
4. Permit a conditional Sun/Taurus synthesis using continuity, tangible or
   embodied values, and sustained expression.
5. Keep authority, honour, father/masculine, medical, status, luxury, wealth,
   relationship, career, and destiny claims educational-only, contested, or
   rejected unless a later bounded review admits one explicitly.
6. Require house, aspects, method, chart context, and birth-time authority
   before specific personal language.

Result if accepted: the research package can be converted into a small
structured canon subset, but only after the exact admitted wording and
metadata are recorded.

## 3. Alternative policy packages

### Package B: modern-first with historical sidecar

Admit only the modern Earth/Fixed/Venus and Sun identity/self-development
vocabulary into reflective content. Retain Ptolemy, Lilly, and Alan Leo
strictly in a learn/history sidecar.

Tradeoff: simpler product voice and lower school-conflict risk, but less
transparent about the historical development of the terms.

### Package C: research-only until broader technical review

Keep all Sun/Taurus personal interpretation out of canon. Allow only neutral
structural vocabulary and history lessons while separately researching house,
aspect, dignity, dispositor, degree, phase, and modifier policy.

Tradeoff: strongest authority boundary, but no near-term personal
interpretation value from this package.

## 4. Bundled Product Owner decisions

| Decision | Recommendation | What must be frozen |
| --- | --- | --- |
| D1 Default lens | Package A, with modern vocabulary named | Whether modern Western/psychological language may serve as the default reflective lens |
| D2 Taurus structure | Admit Earth, Fixed, and Venus-ruled with conditions | Whether these labels may appear in personal interpretation and which disclosure accompanies them |
| D3 Sun vocabulary | Admit vitality, central organization, self-development, and expression with modern-lens labels | Whether identity/selfhood is allowed as bounded modern vocabulary rather than a universal definition |
| D4 Historical material | Keep Ptolemy, Lilly, and Alan Leo as labelled comparison/history | Whether authority/honour or other historical terms have any non-history eligibility |
| D5 Composition | Admit the conditional Sun/Taurus synthesis for a future canon subset | Whether continuity, tangible value, embodiment, sustained expression, and revision questions are acceptable product language |

These five decisions replace a long list of micro-decisions. They do not
approve UI, localization, AI generation, runtime migration, or provider
selection.

## 5. Proposed eligibility matrix

| Claim family | Source state | Proposed policy state | Proposed content eligibility |
| --- | --- | --- | --- |
| Sun as life force / vitality | SOURCE_SUPPORTED_WITH_CONDITIONS | ADOPTED_WITH_CONDITIONS | Modern or comparative education; non-scientific disclosure |
| Sun as identity / self-development | SOURCE_SUPPORTED_WITH_CONDITIONS | ADOPTED_WITH_CONDITIONS | Named modern lens; whole-chart limit |
| Sun as authority / honour | SOURCE_SUPPORTED_WITH_CONDITIONS | EDUCATIONAL_ONLY or SUPPORTED_AS_ALTERNATIVE | Traditional comparison |
| Sun as father / masculine | CONTESTED | EDUCATIONAL_ONLY | Historical comparison only |
| Taurus Earth / Fixed / Venus | SOURCE_SUPPORTED_WITH_CONDITIONS | ADOPTED_WITH_CONDITIONS | Structural vocabulary with lens label |
| Taurus solid / triplicity | SOURCE_SUPPORTED_WITH_CONDITIONS | EDUCATIONAL_ONLY or SUPPORTED_AS_ALTERNATIVE | Historical technical comparison |
| Taurus continuity / embodiment / tangible value | SOURCE_SUPPORTED_WITH_CONDITIONS | ADOPTED_WITH_CONDITIONS | Conditional editorial synthesis |
| Taurus stubbornness / possessiveness / inertia | CONTESTED or SOURCE_RESEARCH_REQUIRED | UNRESOLVED | Tension question only if separately admitted |
| Sun/Taurus conditional composition | SOURCE_SUPPORTED_WITH_CONDITIONS | UNRESOLVED pending D5 | Research projection; no runtime |
| Wealth / luxury / guaranteed success | REJECTED | REJECTED | Never admitted from this package |

## 6. Required guardrails after admission

Any admitted record must:

- retain source refs and the selected tradition or lens;
- distinguish chart fact from symbolic convention;
- disclose that one placement is not the whole chart;
- expose or suppress house and aspect language according to authority;
- suppress birth-time-dependent details when birth time is unknown;
- include at least one constructive possibility, one tension, and one limit;
- avoid deterministic, medical, gender, financial, relationship, career, and
  destiny claims unless separately reviewed;
- remain separate from UI strings until canonical English is approved.

## 7. Current policy decision

No bundled Product Owner decision is recorded in this task. The recommended
Package A is a proposal only.

Current state: RESEARCH_COMPLETE_WITH_UNRESOLVED_POLICY.

The next task may admit a bounded subset, choose an alternative package, or
keep the entire composition research-only. It must not infer approval from
source research completion.
