# House Source Readiness V1

| Field | Value |
| --- | --- |
| Scope | Bounded conventional house-context vocabulary for future research composition |
| Baseline | `29d5a84f1d576e33c0055d875a5d059d1d5dce90` |
| Source status | `SOURCE_READY_FOR_BOUNDED_CONTEXT` |
| Semantic method status | `BOUNDED_METHOD_READY_FOR_RESEARCH` |
| Signal status | `DEFERRED` |
| Runtime status | `RUNTIME_NOT_ADMITTED` |
| Provider status | `PROVIDER DECISION DEFERRED` |

## Scope and evidence lanes

This dossier audits source already present in the repository. It does not add
generic internet astrology as silent authority, choose a house system, calculate
a house, or turn an introductory convention into a personal verdict.

The source lanes remain separate:

| Lane | Repository authority | What it supports here |
| --- | --- | --- |
| Astronomical/chart fact | `packages/contracts/src/chart.ts` | A supplied `HouseFacts` value, twelve cusp records, a house-system identity, and a supplied body house assignment. This is a contract shape, not proof of production scientific authority. |
| Astrology convention | `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md` | Twelve conventional chart-space contexts, with explicit language that these are inquiry domains rather than deterministic outcomes. |
| Interpretive teaching scaffold | `docs/content/foundations/v1/en/08-planet-sign-house.md` | Body = focus/function, sign = style/conditions, house = supported chart context; the “what/how/where” shorthand is not a universal formula. |
| Whole-chart limitation | `docs/content/foundations/v1/en/11-reading-the-chart-as-a-whole.md` | A house can add context to a supported fact; synthesis must stop when the house layer is absent or unsupported. |
| NatalNode policy | `docs/product/NATALNODE_PERSONAL_CHART_COVERAGE_ARCHITECTURE_V1.md`, `docs/product/NATALNODE_PERSONAL_EDITORIAL_ARCHITECTURE_V1.md`, `docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md` | Context modifier, evidence separation, selective presentation, unknown-time suppression, and no runtime admission. |
| Existing body method | `docs/research/astrology-knowledge-canon/compositions/BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1.json` | The five selected body × sign records are already bounded; this task does not create new body × sign meanings. |

The Foundations lesson is marked `APPROVED` and `CURRENT`, but that status is
for canonical educational content. It does not make house semantics production
content or close time authority.

## House-by-house readiness

`SOURCE_READY` below means source-ready for a cautious, conventional context
question only. It does not mean a complete personal method, Signal rule,
professional doctrine, or production interpretation.

| House | Source state | Bounded context supported by repository source | Explicit limit |
| ---: | --- | --- | --- |
| 1 | `SOURCE_READY` | Presence, embodiment, immediate orientation, entering situations | Not personality, appearance, dominance, or a guaranteed first impression |
| 2 | `SOURCE_READY` | Resources, possessions, values, support, what is held | Not wealth, financial security, ownership, or material outcome |
| 3 | `SOURCE_READY` | Communication, learning, nearby movement, exchange, familiar networks | Not intelligence, fluency, or a guaranteed relationship with siblings/neighbours |
| 4 | `SOURCE_READY` | Home, roots, private foundation, family context, grounding | Not a fixed family biography, ancestry claim, or domestic event prediction |
| 5 | `SOURCE_READY` | Creativity, play, pleasure, expression, making | Not guaranteed romance, children, fame, or creative success |
| 6 | `SOURCE_READY` | Daily practice, routine, service, maintenance, ordinary needs | Not illness, employment outcome, servitude, or moral judgment about work |
| 7 | `SOURCE_READY` | One-to-one relating, partnership, agreement, encounter | Not marriage, compatibility, or a guaranteed partner/event |
| 8 | `SOURCE_READY` | Shared resources, trust, obligations, dependence, transition | Not death, trauma, debt, inheritance, or psychological diagnosis |
| 9 | `SOURCE_READY` | Higher learning, travel, worldview, meaning, wider frameworks | Not guaranteed travel, belief, education, or spiritual status |
| 10 | `SOURCE_READY` | Public role, vocation as a conventional domain, visibility, responsibility, contribution | Not occupation, career success, fame, status, or destiny |
| 11 | `SOURCE_READY` | Friends, groups, networks, shared projects, collective participation | Not popularity, social reach, or a guaranteed future community |
| 12 | `SOURCE_READY` | Retreat, solitude, hidden or liminal processes, release, less-visible context | Not isolation, secrecy, pathology, confinement, or a hidden event |

The four representative method houses are **1, 4, 7, and 10**. They are
contrasting and are all `SOURCE_READY` at the bounded conventional level. The
remaining eight houses are not promoted into the representative method by
coverage pressure; their source state is recorded without creating a 12-house
corpus.

## What this source package does not support

The repository sources do not support any of the following as a default NatalNode
personal claim:

- one fixed meaning for every school or house system;
- one house producing one reader-facing card;
- event timing or deterministic life events;
- medical, financial, legal, relationship, family, or career conclusions;
- a house replacing the body function or sign condition;
- a house-system comparison or claim that one system is universally correct;
- house semantics when the result does not supply an authoritative assignment.

The source gap is not “no house vocabulary.” The remaining gaps are a complete
house-specific personal semantic canon, professional/technical depth, a
reviewed Signal policy, chart-level synthesis admission, and production time
authority.

## Readiness disposition

The house layer is source-ready for the following bounded method:

```text
already-admitted BODY × SIGN meaning
    + authoritatively supplied HOUSE assignment
    + explicit HOUSE SYSTEM identity
    -> one contextualized semantic unit
```

This disposition does not admit a House Signal. `HOUSE_SIGNAL_ADMISSION =
DEFERRED`. Unknown birth time remains a hard suppression boundary, and
`UNKNOWN_TIME_PRODUCTION_CERTIFICATION = SEPARATE_PREPROD_GATE` remains open.
