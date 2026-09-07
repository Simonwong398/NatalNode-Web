# Core Primitive English Content V1 — Migration Readiness

**Task:** `WEB-P2-ASTROLOGY-KNOWLEDGE-CONTENT-EXPANSION-003`
**Current package:** `natalnode.core-primitive-english-content.v1`
**Migration status:** `RUNTIME_NOT_ADMITTED`
**Provider policy:** `PROVIDER DECISION DEFERRED`

This note separates content-package readiness from runtime migration readiness. The package is ready for Product Owner editorial review; no application path may import it as production interpretation content until a later contract and admission task explicitly authorizes that change.

## Authoritative package artifacts

| Artifact | Role | Status |
| --- | --- | --- |
| `docs/research/astrology-knowledge-canon/content/CORE_PRIMITIVE_EN_V1.json` | Structured canonical-English package for 25 admitted primitives | `EDITORIAL_REVIEW_PACKAGE` |
| `docs/research/astrology-knowledge-canon/content/CORE_PRIMITIVE_EN_V1_REVIEW.md` | Human review dossier with verbatim representative prose and audits | `PRODUCT_OWNER_REVIEW_REQUIRED` |
| `docs/research/astrology-knowledge-canon/primitives/primitive-canon.v1.json` | Admitted primitive object and source-policy boundary | Existing authority; unchanged |

The JSON package deliberately records `RUNTIME_NOT_ADMITTED` at package and object level. The review dossier is an editorial artifact, not a runtime data source.

## Existing content and taxonomy inventory

| Existing path | Classification | Migration decision and boundary |
| --- | --- | --- |
| `apps/web/src/core/astrology-taxonomy/astrology-glossary.ts` | `REUSABLE` | Reuse stable IDs, canonical English names, glyphs, element/mode families, and notation only. Do not treat the glossary as a source of interpretive doctrine. |
| `apps/web/src/features/interpretation/interpretation-content.ts` — `PLANET_MEANINGS` | `REPLACE_WITH_CANON_LATER` | Existing focus/expression strings are shallow runtime-adjacent editorial content. They must not be silently promoted or merged. A future task must define the runtime contract and replace this path deliberately after owner approval. |
| `apps/web/src/features/interpretation/interpretation-content.ts` — `SIGN_STYLES` | `REPLACE_WITH_CANON_LATER` | Existing sign strings are not the canonical package. Replace deliberately only after a separate runtime admission and localization decision. |
| `apps/web/src/features/interpretation/interpretation-content.ts` — `HOUSE_DOMAINS`, `ASPECT_DYNAMICS` | `KEEP_AS_EDITORIAL_ONLY` | Houses and aspects are outside this 25-object package and remain separate until their own source, policy, and content admission. |
| `docs/content/foundations/v1/en/` | `REUSABLE` | Reuse course sequencing, educational boundaries, and existing examples as editorial context. Do not automatically promote lesson prose into primitive canon or runtime authority. |
| `apps/web/src/features/my-chart/my-chart-evidence-projection.ts` | `KEEP_AS_EDITORIAL_ONLY` | Development-only, fixture-backed projection. It is not a production authority and must not import this package as a silent fixture replacement. |
| `apps/web/src/features/my-chart/MyChartContextualLearnStageA.tsx` | `KEEP_AS_EDITORIAL_ONLY` | Development presentation path only. No import or runtime wiring is part of this task. |
| `apps/web/src/content/learn/` | `KEEP_AS_EDITORIAL_ONLY` | Existing Learn editorial structure may inform future presentation. No canonical semantic promotion or localization is implied. |

## Required gates before any migration

The following are intentionally blocked by this task boundary:

1. Product Owner approval of the English prose and limitations.
2. A separate runtime content contract identifying the authoritative source and lifecycle.
3. A decision on which admitted fields may be exposed to production interpretation.
4. A separate localization admission; this package is English-only.
5. A separate body-plus-sign composition decision. No full Planet × Sign matrix is generated here.
6. A separate deeper-research admission for Scorpio, Aquarius, and Pisces.
7. A separate provider decision; provider selection remains deferred.

## Forbidden migration behavior

- Do not import `CORE_PRIMITIVE_EN_V1.json` from Astro, React, server, or Engine code.
- Do not replace runtime strings opportunistically while “keeping compatibility.”
- Do not treat the JSON package as a production fallback, test fixture, or authoritative scientific result.
- Do not infer missing houses, aspects, birth-time authority, degrees, timing, or personal conclusions from these primitives.
- Do not create localization files from the English package before localization is separately admitted.
- Do not add new runtime dependencies, provider configuration, or Engine integration.

## Current readiness statement

The editorial package is complete enough for Product Owner content review: quick, plain, and learner projections exist for all 25 admitted objects, with explicit limitations and source references. Runtime migration is not ready and is intentionally not started. The next safe action is content review, followed only by a separately authorized runtime-admission task if the owner approves.

**Status:** `CONTENT_PACKAGE_READY` / `RUNTIME_MIGRATION_BLOCKED`
**Provider:** `PROVIDER DECISION DEFERRED`
