# Signal-backed My Chart Reading POC 001 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-MY-CHART-SIGNAL-001` |
| Baseline | `eec8a5a94d3aa1b3fe0b808fe21fb2d99c99ed94` |
| Input authority | `RESEARCH_REPRESENTATIVE_SIGNAL` / `INCOMPLETE_RESEARCH` |
| Synthesis authority | `DEVELOPMENT_ONLY` |
| Runtime | `RUNTIME_NOT_ADMITTED` |
| Route | `/dev/my-chart-contextual-learn/` |

This POC proves the first complete reader-facing development chain:

```text
research policy rule
  -> representative Signal input
  -> Personal Synthesis
  -> PersonalTheme
  -> human-first My Chart projection
```

The route consumes the four admitted representative policy rules from
`COMPOSITION_SIGNAL_REPRESENTATIVE_V1.json`, selects two coherent rules per
scenario, and passes them through the existing Signal → Personal Synthesis
adapter. The page does not construct fake themes or claim that the input came
from the Engine.

## Authority boundary

Every page projection is explicitly labelled:

- `RESEARCH_REPRESENTATIVE_SIGNAL`
- `INCOMPLETE_RESEARCH`
- `DEVELOPMENT_ONLY`

No `AUTHORITATIVE_ENGINE` value is created. The page remains isolated from
production My Chart, Vault, BFF, Engine, provider, and AI paths. The route is
development-only and uses `noindex,nofollow` metadata.

## Scenarios

### Scenario A — known-time research preview

Input:

- Moon × Aries
- Mercury × Taurus

The fixture is labelled `KNOWN` for scenario comparison only. The two admitted
Signals remain placement-level and do not add houses, ASC, MC, or any other
time-dependent evidence. The rendered result contains two differentiated
PersonalTheme candidates:

- `EMOTIONAL`: “A response that can begin without rushing itself”
- `COMMUNICATION`: “Ideas that become clearer when they take shape”

Both retain `NEUTRAL`, `SUBTLE`, and `LOW` internally. Neither placement
converges with the other, and neither creates extra themes.

### Scenario B — unknown-time research preview

Input:

- Moon × Taurus
- Mercury × Aries

Both Signals remain `UNKNOWN_TIME_SAFE`. The rendered result contains:

- `EMOTIONAL`: “Steadiness that still leaves room to respond”
- `COMMUNICATION`: “A first formulation that can stay open”

The page explains the unavailable time-sensitive layers without a warning wall.
No ASC, MC, houses, house-derived interpretation, noon, midnight, default time,
or fabricated time is introduced.

The scenarios never combine Moon Aries with Moon Taurus or Mercury Aries with
Mercury Taurus. The existing `CONFLICTING_BODY_SIGN_PLACEMENT` guard remains
upstream of this page projection.

## Old versus new semantic input

| Dimension | Old My Chart POC | Signal-backed POC |
| --- | --- | --- |
| Input | Primitive/synthetic fixture candidates | Admitted Body × Sign representative Signals |
| Synthesis path | Fixture candidate → PersonalTheme | Signal → Personal Synthesis → PersonalTheme |
| Reader recognition | Generic fixture theme language | Placement-specific Moon-in-sign / Mercury-in-sign recognition |
| WHY | Body/template-oriented explanation | Body function + sign conditions + integrated composition question |
| Traceability | Fixture fact and candidate trace | Signal ID, composition ID, rule, placement evidence, semantic basis, policy refs, birth-time eligibility |
| Restraint | Existing bounded editorial controls | Same controls plus visible `NEUTRAL / SUBTLE / LOW` internal preservation |
| Learn | Contextual lesson bridge | Body/sign-oriented bridge with duplicate lesson suppression |

The new rendered content is materially more specific because “Moon in Aries”
and “Mercury in Taurus” remain visible as the chart-shaped inputs while the
reader copy stays conditional. The richer result comes from semantic depth,
not from multiplying themes.

## Reader experience

The primary page order remains:

```text
YOUR CHART
  -> recognition
  -> constructive capacity
  -> pattern
  -> tension
  -> useful lever
  -> WHY THIS SHOWS UP
  -> LEARN
  -> collapsed ASTROLOGER'S VIEW
```

Signal IDs, evidence keys, intensity, confidence, policy refs, coherence, and
authority metadata are available only through collapsed technical inspection.
The primary prose uses conditional language such as “may,” “can,” and “worth
noticing”; it does not present a dominant trait, certainty, diagnosis, or
objective truth about the reader.

## WHY composition depth

Each rendered WHY trace preserves the semantic distinction:

- body supplies the subject/function, such as response or information;
- sign supplies operating conditions, such as initiation or embodiment;
- the integrated composition frames a question about how those dimensions meet.

For example, the Moon × Aries WHY trace keeps Moon response and Aries
initiation together, then preserves the admitted constructive capacity and
possible tension. It does not expose evidence-unit accounting or rule metadata
as primary interpretation prose.

## Learn bridge

The page selects relevant body/sign/element/modality references from the
representative Signal trace. Lesson destinations are deduplicated by lesson
identity. The current rendered scenarios expose relevant Moon or Mercury and
Aries or Taurus learning destinations without dumping every primitive link.

## Validation gates

```text
SIGNAL_BACKED_CONTENT PASS
PERSONAL_RELEVANCE PASS
SEMANTIC_FIDELITY PASS
NO_CONTENT_INFLATION PASS
WHY_COMPOSITION_DEPTH PASS
PROVENANCE_TRACEABILITY PASS
LEARN_BRIDGE PASS
UNKNOWN_TIME_AUTHORITY PASS
LOGICAL_CHART_COHERENCE PASS
NO_FAKE_ENGINE_AUTHORITY PASS
DEV_ONLY_ISOLATION PASS
```

## Targeted validation

```text
npm run test:my-chart-contextual-learn --workspace=apps/web
11 tests passed, 0 failed

npm run check --workspace=apps/web
0 errors
0 warnings
1 pre-existing hint in test/learn-foundations.test.mjs
```

Existing targeted Composition Signal synthesis evidence remains valid from the
unchanged upstream bridge:

```text
10 tests passed, 0 failed
```

No broad suite, production build, email delivery, provider call, or production
runtime admission was run for this POC.

## Local dev preview

The Astro dev server was started on port `4322` because the default port was
already occupied and the sandbox required local listen permission.

```text
known-time:
http://localhost:4322/dev/my-chart-contextual-learn/?scenario=known-time

unknown-time:
http://localhost:4322/dev/my-chart-contextual-learn/?scenario=unknown-time
```

Browser runtime inspection confirmed both scenario attributes, both pairs of
rendered theme titles, the unknown-time presentation marker, and zero browser
console errors or warnings. This is local dev runtime evidence, not owner
browser acceptance.

## Readiness

```text
MODULE_PASS
READY_FOR_OWNER_BROWSER_REVIEW YES
READY_FOR_PRODUCTION_MY_CHART NO
READY_FOR_PRODUCTION_SIGNAL_RUNTIME NO
READY_FOR_BROAD_SCALE NO
RUNTIME_ADMISSION NO
```

`OWNER_BROWSER_PASS` is intentionally not claimed; owner screenshot review
remains authoritative.
