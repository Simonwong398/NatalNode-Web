# NatalNode Production Admission Firewall V1

**Status:** enforced pre-production architecture boundary

**Scope:** this repository only. It does not admit research interpretation,
production astronomy, a provider, or a production Engine composition.

## Frozen principle

```text
RESEARCH EXISTENCE != PRODUCTION ADMISSION

SOURCE READY
!= SEMANTIC READY
!= SIGNAL READY
!= SYNTHESIS READY
!= PRODUCTION RUNTIME READY
```

The production dependency graph is an admission boundary. A production root may
transitively reach only `PRODUCTION_ELIGIBLE` executable modules. A safe-looking
facade does not hide an inadmissible dependency.

## Roots and admission classes

Production roots are discovered from every normal Astro page below
`apps/web/src/pages`, excluding a path segment named `dev`, plus the explicitly
registered production feature, package, Hono application, server executable,
worker, maintenance, and migration entrypoints in
`scripts/architecture/production-boundaries.config.mjs`.

Development roots are `/dev` Astro pages and the local/public-development server
entrypoints. Test roots are the Web and server tests plus repository test
scripts. Development and test roots may consume research, fixture, mock, and
mechanism modules.

The minimal admission taxonomy is:

- `PRODUCTION_ELIGIBLE`
- `DEVELOPMENT_ONLY`
- `RESEARCH_ONLY`
- `TEST_ONLY`
- `MECHANISM_ONLY`

Explicit classifications complement source reachability; path names alone are
not the security model. Existing values such as `INCOMPLETE_RESEARCH` may occur
in production contracts and validators so they can reject or visibly present an
upstream authority state. That does not admit the research implementation that
creates such content.

## Runtime admission rules

The allowed production rule is exactly:

```text
PRODUCTION ROOT -> PRODUCTION_ELIGIBLE = allowed
PRODUCTION ROOT -> any other admission class = forbidden
```

The repository currently has no production-admitted Signal, synthesis,
representative Body x Sign, representative Aspect, shared-root, chart selector,
counterevidence, or relational My Chart interpretation path. Production
interpretation admission is `NONE / NOT_ADMITTED`.

Anything classified `MECHANISM_ONLY`, including an artifact carrying
`MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE`, is unconditionally forbidden from a
production root. The same applies transitively to runtime source containing the
bounded research markers registered by the firewall.

`MockEngineClient` is available only from the explicit
`@natalnode/engine-client/mock` subpath. It remains available to development and
tests and is absent from the production package root. `server:start` is a
production-only, fail-closed entrypoint until a production EngineClient
composition is separately admitted. Local mock composition remains owned by
`dev:local` and `dev:public`.

## Engine and scientific authority

The fixed boundary remains:

```text
NatalNode.com
  -> Website API / BFF
  -> NatalNode Engine Public API
  -> AstronomyProvider
```

Web and BFF may consume the `EngineClient` contract. They must not import a
concrete astronomy provider or Engine implementation, calculate positions,
houses, aspects, transits, or production orb facts, or replace missing facts.
The BFF may validate, authenticate, authorize, orchestrate, persist, delegate to
`EngineClient`, and return supplied Engine facts. Known provider package
boundaries are rejected statically. `PROVIDER DECISION DEFERRED`.

## Layer direction and historical debt

The conceptual direction remains `shared <- core <- features <- routes`.
`core -> feature`, `shared -> core`, and `shared -> feature` are forbidden new
edges. Nine exact pre-existing `apps/web/src/lib` edges are recorded as debt in
the machine-readable config. They do not authorize similar edges, and any new
edge fails the guard. Their removal is a future characterization/refactor task,
not part of this firewall patch.

## Unknown-time authority

`UNKNOWN_TIME` must remain explicit from input through request, Engine result,
presentation eligibility, interpretation eligibility, and Vault persistence and
reload. It means no ASC, no MC, no houses, and no uncertified time-sensitive
interpretation.

Current source preserves the nullable time/UTC/offset input shape, uses a
presentation policy to hide angle and house output, and validates persisted
Vault state. The BFF request validator is not yet a complete cross-field
unknown-time authority validator, and result validation is not request-aware.
Those gaps require a separate campaign before production Engine or
interpretation admission. Because the chart workflow and research
interpretation remain outside production admission, they are not a current
production-reachable material blocker.

## Deterministic enforcement

Run:

```sh
npm run test:production-architecture-boundaries
```

The guard uses the repository's existing TypeScript parser. It reads runtime
static imports, static re-exports, CommonJS literal `require`, literal dynamic
imports, and Astro frontmatter/script imports across `.ts`, `.tsx`, `.mts`,
`.mjs`, `.js`, `.jsx`, and `.astro`. It resolves repository-relative imports,
the Web `@/` alias, and registered workspace package/subpath aliases.

Non-literal computed module loading is outside the analyzer's scope; none is
used by the audited production graph. External package internals are not
traversed, so known provider/Engine implementation package prefixes are denied
at the import boundary. Asset and content files are not executable graph nodes.

Current enforced state: no production-to-research/dev/test/mechanism reachability
and no newly introduced layer debt. Explicit `/dev` source roots are isolated
from production roots. Astro still emits unavailable `/dev` route shells in a
production static build; deployment-level artifact exclusion is a separate
pre-launch hardening gate.
