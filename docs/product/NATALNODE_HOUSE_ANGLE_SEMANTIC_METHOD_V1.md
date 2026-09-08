# NatalNode House + Angle Semantic Method V1

| Field | Value |
| --- | --- |
| Status | `BOUNDED_SEMANTIC_METHOD_READY_WITH_SIGNAL_DEFERRED` |
| Baseline | `29d5a84f1d576e33c0055d875a5d059d1d5dce90` |
| Scope | Documentation and machine-auditable research proof only |
| House method | `ADMITTED_FOR_BOUNDED_RESEARCH_METHOD` |
| Angle method | `ADMITTED_FOR_BOUNDED_CONTEXT_BOUNDARY_ONLY` |
| House/angle Signal policy | `DEFERRED` |
| Runtime | `RUNTIME_NOT_ADMITTED` |
| Provider | `PROVIDER DECISION DEFERRED` |

This document defines how an already-admitted Body × Sign meaning may be
qualified by supplied house context, and how ASC/MC remain separate angle
contexts. It does not calculate houses or angles, create a Signal, register a
PersonalTheme, add a route, or admit production My Chart.

## 1. Three semantic questions

The method freezes this distinction:

```text
BODY  = what function is being explored
SIGN  = how / under what operating conditions
HOUSE = where / in what chart-space life context
```

This is a semantic scaffold, not a literal grammar or keyword concatenation
algorithm. A valid method must integrate the three supplied dimensions while
keeping their different questions visible:

```text
already-admitted BODY × SIGN meaning
    + supplied HOUSE CONTEXT
    -> HOUSE-CONTEXTUALIZED SEMANTIC UNIT
```

The house qualifies, locates, focuses, or contextualizes the placement. It does
not replace the body function, erase the sign condition, or generate a stock
“Body keyword + Sign keyword + House keyword” sentence.

## 2. House context and evidence accounting

The selected architecture is **A: house context modifies an existing placement
semantic unit**. It does not create a second standalone House Signal or a
one-house card.

For a supplied body-in-sign-in-house record:

| Accounting field | Frozen value |
| --- | --- |
| Semantic unit type | `BODY_SIGN_HOUSE_CONTEXT` |
| Semantic unit count | `1` |
| Semantic dimensions | `3`: body function, sign condition, house context |
| Base astronomical evidence root | `1`: the authoritative natal placement/geometry root |
| Independent evidence increment from house context | `0` by default |
| House cusp/system identity | Required context metadata, not an automatic extra root |
| Self-convergence | Not eligible |
| Duplicate placement references | Suppressed; no confidence/priority inflation |

The default root model is:

```text
authoritative body/sign/house assignment
  -> BODY dimension
  -> SIGN dimension
  -> HOUSE dimension
  -> one semantic unit / one evidence root
```

The house assignment, cusp data, and house-system identity are parts of the
same supplied natal chart geometry. They must not be counted as separate roots
simply because they are separate fields. An independently authoritative future
fact could require a separate policy, but no such policy is admitted here.

## 3. House-system boundary

The method consumes both:

```text
AUTHORITATIVELY_SUPPLIED_HOUSE_ASSIGNMENT
+ HOUSE_SYSTEM_IDENTITY
```

The identity must be preserved in provenance and reader/technical depth. The
method does not:

- calculate cusps or assignments;
- select a default system;
- switch systems;
- compare systems;
- infer a house from a sign;
- claim Placidus, Whole Sign, Equal House, or another system is universally
  correct.

The repository Foundations material currently teaches Placidus, Whole Sign,
and Equal House as named introductory conventions. This method records the
returned identity without changing that source policy or selecting one.

## 4. Unknown-time boundary

The hard invariant is:

```text
UNKNOWN_TIME -> NO HOUSE SEMANTICS
```

When birth time is unknown or the authoritative result omits the house layer,
the composition is suppressed. It must not use noon, midnight, an average time,
a default ASC, a guessed house, a “likely house,” or a whole-sign fallback.

This task preserves the prior open authority gate:

```text
UNKNOWN_TIME_PRODUCTION_CERTIFICATION = SEPARATE_PREPROD_GATE
```

The BFF cross-field authority and request-aware result certification campaign
is not solved here.

## 5. Representative method cases

The bounded artifact is
[`HOUSE_ANGLE_SEMANTIC_REPRESENTATIVE_V1.json`](../research/personal-synthesis/HOUSE_ANGLE_SEMANTIC_REPRESENTATIVE_V1.json).
It uses four already-admitted Body × Sign records and four contrasting houses:
1, 4, 7, and 10.

Each case preserves the placement meaning before house context, adds only the
repository-supported conventional life context, states what the house does not
add, and retains one semantic unit and one root. Each is eligible only for
`CONTEXT_MODIFIER` and `SUPPORTING_WHY` treatment. None creates a standalone
theme card or Signal.

The four cases are:

| Case | Existing placement | House context | Intended role |
| --- | --- | --- | --- |
| `sun-aries-house-1` | Sun central direction/agency meets Aries initiation | Presence, embodiment, immediate orientation, entering situations | Context modifier / supporting WHY |
| `moon-taurus-house-4` | Moon response/need meets Taurus embodiment and continuity | Home, roots, private foundation, family context, grounding | Context modifier / supporting WHY |
| `mercury-aries-house-7` | Mercury information work meets Aries initiation | One-to-one relating, partnership, agreement, encounter | Context modifier / supporting WHY |
| `venus-taurus-house-10` | Venus value/relating meets Taurus embodiment and continuity | Public role, visibility, responsibility, contribution | Context modifier / supporting WHY |

These are bounded reflective questions, not personality diagnoses, events,
occupations, relationship guarantees, or claims of success.

## 6. Angle boundaries

ASC and MC are not houses and are not merged with House 1 or House 10.

### ASC

The allowed research context is an **orientation interface**: a question about
direct orientation and entry into an environment when an authoritative ASC is
supplied. It is not “real personality,” mask, appearance, universal first
impression, or destiny.

### MC

The allowed research context is a **meridian/public-direction context**: a
question about public role, visibility, direction, or contribution when an
authoritative MC is supplied. “Vocation” is only a conventional domain label;
MC is not a job, career result, fame, status, destiny, or life-purpose verdict.

The angle source dossier records the current source state as partial for a full
personal method. A bounded contextual boundary is documented, but standalone
`ASC × SIGN` and `MC × SIGN` methods remain `DEFERRED`. No angle aspects or
planet–angle relations are admitted.

Each supplied ASC or MC may remain a distinct ChartFact. Shared sign or domain
language does not automatically create convergence with a body placement.
Future convergence requires independently admitted roots and an explicit
semantic-overlap rule.

## 7. Selector compatibility and card budget

House and angle context enter a future selector as one of:

```text
CONTEXT_MODIFIER
SUPPORTING_WHY
TECHNICAL_DEPTH
```

They do not default to `THEME_CANDIDATE`. A future selector may promote an
integrated contextualized theme only through its existing ordinal authority,
semantic distinctness, synthesis, and provenance gates. This document does not
modify that selector.

The method explicitly rejects:

- one house = one card;
- one angle = one card;
- one placement + house = two cards;
- house count as importance;
- an automatic Sun/Moon/ASC “Big Three” quota;
- a 12-house coverage quota;
- card multiplication for technical context.

## 8. Convergence and counterevidence

House context is not independent convergence by default. Two house contexts,
two different houses, or private/public contrast do not automatically create
counterevidence. A house difference may describe different contexts, but that
is not a contradiction or a separate evidence root by itself.

The existing chart-level policy remains authoritative for duplicate handling,
conflict handling, genuine independent convergence, relational enrichment, and
counterevidence. No house or angle rule changes confidence, intensity,
direction, or priority in this task.

## 9. Production and provider boundary

All new artifacts remain research/documentation only. No new executable POC,
production barrel export, user-facing route, Signal registration, Engine call,
BFF change, provider integration, or My Chart wiring is introduced.

The Web continues to consume supplied ChartFacts through the existing boundary;
it does not calculate house cusps, house assignment, angles, or astronomy.
`PROVIDER DECISION DEFERRED` remains unchanged.

## 10. Frozen readiness

```text
HOUSE_SEMANTIC_METHOD_ADMISSION           YES
ANGLE_SEMANTIC_METHOD_ADMISSION           YES (bounded context boundary only)
HOUSE_SIGNAL_POLICY_READY                 NO
ANGLE_SIGNAL_POLICY_READY                 NO
HOUSE_ANGLE_RUNTIME_POC_ADMISSION         NO
READY_FOR_PREPROD_UNKNOWN_TIME_AUTHORITY_GATE NO
READY_FOR_PRODUCTION_HOUSE_RUNTIME        NO
READY_FOR_PRODUCTION_ANGLE_RUNTIME        NO
READY_FOR_PRODUCTION_INTERPRETATION       NO
READY_FOR_PRODUCTION_MY_CHART             NO
READY_FOR_PUBLIC_LAUNCH                   NO
RUNTIME_ADMISSION                         NO
```
