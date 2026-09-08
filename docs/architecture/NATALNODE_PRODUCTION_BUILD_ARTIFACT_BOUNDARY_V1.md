# NatalNode Web Production Build Artifact Boundary V1

Status: accepted as a Web build boundary for the current route topology.

## Scope

This boundary applies to the Astro Web application in `apps/web`. It separates
the existence of development and research source from the files that may be
deployed as a production Web artifact.

Source may remain available for local previews, POC workflows, and tests. A
source file is not production-reachable merely because it exists in the
repository. Conversely, a route that is emitted into the static output is a
deployable user-addressable artifact and must satisfy production admission.

## Route classes

The current page topology is classified as follows:

- `PRODUCTION_ROUTE`: public product, legal, account, learn, discover, share,
  practitioner, tools, vault, sitemap, and robots routes. These remain emitted.
- `DEVELOPMENT_ROUTE`: the explicit root `/dev/**` pages and the localized
  `/{locale}/dev/**` current-sky alias. These remain in source and local route
  composition but are excluded from production output.
- `RESEARCH_PREVIEW_ROUTE`: a route containing a `research`, `preview`, or
  `poc` path segment. None currently exists in the Astro page tree; the class is
  reserved so a future preview cannot be emitted accidentally.
- `TEST_FIXTURE_ROUTE`: test-only material outside the Astro page tree. No
  current Web production page is in this class.
- `FUTURE_DISABLED_ROUTE`: unfinished routes follow the existing product policy
  and are not admitted by this boundary.

The classifier is intentionally topology-based and small. It does not create a
second list of hundreds of production routes.

## Production exclusion mechanism

`apps/web/astro.config.mjs` installs the Astro-native
`astro:build:done` integration from
`scripts/architecture/production-route-boundaries.config.mjs`.

When Astro is invoked with `mode=production` (the canonical `astro build`), the
integration:

1. identifies generated pages whose pathname contains an excluded route
   segment;
2. removes those route directories from `apps/web/dist`.

This is artifact exclusion, not a client-side 404 shell. The source pages are
not renamed, deleted, or hidden behind a runtime condition.

`astro dev` and `astro build --mode local-integration` do not run production
cleanup. Existing local development and POC route composition therefore stays
available.

## Sitemap and link boundary

The existing sitemap generator uses an explicit public/discover/share/learn
allowlist and does not add `/dev/**` routes. The artifact audit checks every
emitted sitemap and every admitted production HTML page for excluded route
links. `robots.txt` may provide indexing defense-in-depth, but it is not the
availability control.

## Enforcement

Run the focused command from the repository root:

```text
npm run test:production-build-boundaries
```

This command runs the real Web production build and then audits the resulting
`apps/web/dist` directory. The audit proves route exclusion, sitemap and link
boundaries, required production route preservation, deterministic classification,
local-mode retention, source POC preservation, and rejection of a synthetic
forbidden artifact.

The source dependency firewall remains a separate gate:

```text
npm run test:production-architecture-boundaries
```

The source firewall and this artifact firewall are complementary. Neither one
is a substitute for the other.

## Known limitations

- The audit covers the static Web output produced by Astro; it does not claim
  deployment-vendor routing behavior or server-side route policy.
- Exclusion is based on route path segments. A future research route using a
  different path marker must be classified before admission.
- Route-generated JS/CSS assets may remain in the static asset directory when
  Astro emits them for development pages. They are not referenced by admitted
  production HTML; source reachability and production page references remain
  governed by the separate source firewall and artifact audit.

## Future deployment implication

Deployment tooling must publish the canonical production output after the
artifact boundary command passes. Local-development and research builds must
not be substituted for the production artifact. This boundary does not admit
Engine integration, production interpretation, My Chart, or public launch.
