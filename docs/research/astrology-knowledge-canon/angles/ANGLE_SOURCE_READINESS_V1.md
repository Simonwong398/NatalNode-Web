# Angle Source Readiness V1

| Field | Value |
| --- | --- |
| Scope | ASC and MC source, semantic-boundary, and future method audit |
| Baseline | `29d5a84f1d576e33c0055d875a5d059d1d5dce90` |
| Source state | `SOURCE_PARTIAL_FOR_PERSONAL_METHOD` |
| Bounded context method | `READY_FOR_RESEARCH_DOCUMENTATION_ONLY` |
| Standalone ASC × Sign / MC × Sign method | `DEFERRED` |
| Signal status | `DEFERRED` |
| Runtime status | `RUNTIME_NOT_ADMITTED` |
| Provider status | `PROVIDER DECISION DEFERRED` |

## Source lanes

| Lane | Repository authority | Supported claim |
| --- | --- | --- |
| Astronomical/chart fact | `packages/contracts/src/chart.ts` | `AngleFact` supplies an angle ID, longitude, and sign; the contract does not calculate or certify the fact. |
| Chart geometry teaching | `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md` | ASC is the ecliptic/eastern-horizon reference; MC is the ecliptic/local-meridian upper-culmination reference; MC is not the astronomical zenith. |
| Bounded interpretive teaching | `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md` | Returned ASC/MC may orient a reading when supported; attention is a method, not proof of greater strength. |
| Whole-chart limitation | `docs/content/foundations/v1/en/11-reading-the-chart-as-a-whole.md` | Angles may be connected only when returned; unknown time removes the layer. |
| Product coverage | `docs/product/NATALNODE_PERSONAL_CHART_COVERAGE_ARCHITECTURE_V1.md` | Angles are a future orientation layer and do not create an automatic Sun/Moon/ASC theme quota. |
| Runtime boundary | `docs/architecture/NATALNODE_PRODUCTION_ADMISSION_FIREWALL_V1.md` | Research and semantic documentation cannot enter a production interpretation path. |

These sources support a bounded structural and contextual vocabulary. They do
not provide a complete personal ASC/MC canon, a Signal policy, a house-system
doctrine, or production time certification. Therefore the personal-method
source state remains `SOURCE_PARTIAL`, even though the bounded boundary method
can be documented.

## ASC boundary

The allowed research role is:

```text
ASC = horizon/orientation interface
    = a bounded question about direct orientation and entry into an environment
```

This is a contextual modifier or technical explanation, not a complete person
description. The following shortcuts remain forbidden:

- ASC = real personality;
- ASC = mask;
- ASC = appearance;
- ASC = how everyone sees the person;
- ASC = first-impression destiny.

ASC is not House 1. House 1 is a chart-space context; ASC is an angle fact tied
to the local horizon. They may be discussed together only when both facts are
supplied and the distinction is preserved.

## MC boundary

The allowed research role is:

```text
MC = meridian/public-direction context
   = a bounded question about public role, visibility, direction, or contribution
```

“Vocation” may appear only as a conventional domain label and never as an
occupation or outcome claim. The following shortcuts remain forbidden:

- MC = career;
- MC = job;
- MC = destiny;
- MC = fame;
- MC = social-status outcome;
- MC = life-purpose certainty.

MC is not House 10. House 10 is a chart-space context; MC is a meridian angle
fact. They may be discussed together only as distinct supplied layers.

## Angle/sign and relational disposition

The current sources support the identities and bounded contextual roles above,
but do not support a standalone `ASC × SIGN` or `MC × SIGN` personal composition
method. Those methods remain `DEFERRED`.

No planet–ASC, planet–MC, angle aspect, or angle-relational Signal is admitted.
Those are future relational coverage and require independent source, semantic,
Signal, and authority review.

ASC and MC may be distinct authoritative ChartFacts when supplied. A shared
sign or shared domain does not automatically create independent convergence with
a body placement. Future convergence requires independently admitted roots and
an explicit semantic-overlap policy.

## Unknown-time and Big Three boundaries

Both angles require authoritative birth time and location. Therefore:

```text
UNKNOWN_TIME -> suppress ASC, MC, angle/sign composition, and angle-based themes
```

No noon, midnight, average time, default ASC, likely angle, or whole-sign
fallback is allowed.

Sun, Moon, and ASC may be educationally prominent, but there is no automatic
“Big Three” three-card rule. Any future ASC contribution may be `CORE`,
`SUPPORTING`, `WHY`, technical depth, or omitted according to an admitted
selector—not according to body identity.

## Readiness disposition

The audit passes for source classification and semantic boundary definition.
It does not admit an angle Signal, angle/sign POC, personal angle card, or
production interpretation. `ANGLE_SIGNAL_POLICY_READY = NO`,
`ANGLE_SEMANTIC_METHOD_ADMISSION = YES` only for this bounded, documentation-only
context boundary, and `HOUSE_ANGLE_RUNTIME_POC_ADMISSION = NO`.
