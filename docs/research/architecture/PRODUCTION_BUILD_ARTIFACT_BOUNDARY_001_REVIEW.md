# PRODUCTION_BUILD_ARTIFACT_BOUNDARY_001 REVIEW

Status: `REVISION_REQUIRED` at baseline; implementation supplied by this
revision.

Baseline: `e87b40fa24d265ca730fbe973640185e05942057`

## Finding

The baseline Astro static build emitted 14 development route HTML artifacts:

- seven root `/dev/**` preview routes; and
- seven localized `/{locale}/dev/current-sky/` variants for `en`, `es`, `fr`,
  `de`, `ja`, `ko`, and `zh-Hant`.

Those pages rendered an unavailable shell in a production-mode build, but the
route files still existed in the deployable output. That did not satisfy the
artifact boundary.

No research/demo/preview page route outside the `/dev` namespace was present in
the current Astro page tree. Research and POC source remains under the Web
source and documentation trees for local/test use.

## Decision

Use a small Astro `astro:build:done` integration rather than moving the page
tree or introducing a route-management framework. The integration is enabled
only for `mode=production`; it removes excluded route directories and their
generated HTML artifacts after Astro has generated the static output.

This preserves:

- `astro dev` route access;
- `local-integration` route access used by local development composition;
- POC source modules and focused tests; and
- the existing production source dependency firewall.

It does not alter product content, scientific contracts, provider behavior,
interpretation policy, authentication, vault behavior, or deployment vendor
configuration.

## Evidence contract

`npm run test:production-build-boundaries` is the deterministic artifact gate.
It builds the actual Web output, verifies that no excluded route HTML remains,
checks sitemap and production HTML links, checks representative product/legal/
learn/calculation routes, verifies local-mode retention, and injects a synthetic
forbidden route to prove the audit fails closed.

`npm run test:production-architecture-boundaries` remains the independent source
reachability gate. A passing artifact audit must not be interpreted as source
firewall or production-readiness acceptance.

## Non-goals

- no Engine access or integration;
- no `natalnode-app` access;
- no astronomy provider selection or provider change;
- no broad Astro route migration;
- no client-side 404 substitute;
- no robots-only protection;
- no public-launch or runtime admission decision.
