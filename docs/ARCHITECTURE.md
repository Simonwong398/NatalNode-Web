# NatalNode.com Website Architecture and Governance

**Document status**: Implementation-oriented governance baseline

**Source of truth**: `docs/PRD.md` is the product source of truth. This document records the implementation boundary and module-growth policy for the website repository. It is not a repository audit or a broad architecture rewrite.

## Fixed System Boundary

The website boundary is fixed:

```text
NatalNode.com
    ↓
Website API / BFF
    ↓
NatalNode Engine Public API
```

NatalNode.com and the BFF consume Engine facts through the public API. Website code does not implement astronomy calculation, access an astronomy provider directly, or bind product behavior to a provider-specific implementation.

## Source Module Responsibility and Growth Policy

The primary metric is **cohesive responsibility**, not raw file size. A module should have a clear behavioral boundary and one understandable reason to change.

LOC thresholds are heuristic guardrails. They are not lint rules, automatic refactor triggers, or reasons to alter working code. This policy operates primarily as a Codex planning constraint to save engineering effort and token consumption, not to create process debt.

Current state:

```text
Proactive Large-File Decomposition Program
= PAUSED

Completed historical decomposition work remains accepted.
Remaining large-file audit candidates are NOT the active roadmap.
```

- Preferred behavioral-module size is roughly 100–300 LOC.
- Roughly 350 LOC is an architecture review trigger: reassess responsibility, cohesion, and the next feature boundary.
- Roughly 500 LOC is a hard growth gate for newly generated handwritten behavioral modules. If planned work would cross it, stop before generating the large implementation and redesign the semantic boundaries first; do not defer the redesign to cleanup.
- Existing oversized modules are grandfathered. Their size alone does not create a refactor or cleanup task. Dedicated decomposition is eligible only when product work is blocked, repeated defects or unsafe changes are demonstrated, a required feature would materially worsen responsibility overload, security/privacy/scientific correctness requires restructuring, or the user explicitly authorizes it.
- When product work legitimately touches an oversized module, make the smallest safe feature change and extract only a new cohesive responsibility when that boundary is natural and inexpensive.
- Feature planning should silently identify affected modules, the new responsibility, its owner, expected growth, and a safe decomposition point before a meaningful large implementation. Do not create a separate audit task or long report. Surface the boundary decision only for a possible >500 LOC module, genuinely competing designs, or public-contract/security/scientific-boundary impact.
- For a behavioral source file around or above 350 LOC, roughly 80 lines of clearly independent new responsibility should trigger a sibling-boundary review in the same feature patch. If the responsibility is inseparable, cohesion overrides arithmetic.
- Exclusions include generated code, lockfiles, static data, fixtures, migration SQL, schemas/data declarations, configuration, vendor/third-party content, and test files. Stylesheets require cascade/layer judgment; do not decompose global.css solely for line count, while feature-specific styling should use a natural local boundary when one exists.
- Large tests are organized by behavioral domain, fixture boundary, or harness responsibility rather than arbitrary LOC. The behavioral-module gate does not apply directly to test-file length.
- Characterization is risk-driven: add it for required high-risk behavior changes, real defects, security/privacy/scientific-boundary changes, or explicitly authorized refactors—not solely because a file is long.
- Use targeted validation proportional to change risk. Broader check/build/full behavioral matrices belong at meaningful milestones or when the affected boundary requires them; do not repeat them merely because code was reorganized.
- Do not create generic abstraction debt or premature abstraction to satisfy a threshold. A new module needs a real responsibility, clear contract, and demonstrated reuse or current feature value.

Do not continue ChartRenderer, global.css, SavedVaultChartExperience, local-public-edge, migration-runner, rate-limit module, Feedback, or other audit-ranked decompositions solely because of file size. Historical audit records remain reference material only and must not be deleted. Completed decomposition work remains accepted and must not be reverted, including the Vault management client, Vault component, Contracts chart extraction, and BirthInputForm decompositions.

Future priority order is: (1) product capability / MVP progress, (2) correctness and trust, (3) security/privacy, (4) user-visible quality and usability, (5) maintainability required by active work, (6) opportunistic structural cleanup, and (7) standalone cosmetic architecture cleanup. Standalone large-file cleanup is therefore lowest priority unless explicitly reauthorized.

This policy creates no mandatory architecture report, mandatory LOC report, CI gate, lint package, test framework, automatic file-size failure, repository-wide recurring audit, or extra ADR for each module extraction. Do not create a file-size checker, custom ESLint rule, pre-commit hook, CI workflow, architecture scanner, or dependency graph scanner. Automation may be considered later only if actual recurring violations justify it.

## Implementation Governance

Semantic boundaries come before large implementations. New behavior must remain behind the fixed Website API / BFF → Engine Public API boundary, and `docs/PRD.md` plus Git history remain the authoritative record for product and implementation decisions.

This policy does not authorize broad cleanup, unrelated refactors, an ADR, or changes outside the documentation and implementation scope explicitly requested for a task. The repository-wide proactive large-file decomposition program is paused and is not a mandatory execution backlog. It does not authorize a new manual large-file review or a continuation of the audit backlog.

## Engineering Integrity and Validation Authority

This section is the repository-owned engineering-integrity policy. It applies to
production code, tests, fixtures, local development, and campaign reports. It
complements `docs/PRD.md`, which remains the product source of truth.

### Correctness and test integrity

- Production behavior MUST NOT change solely to satisfy a test. A failing test
  requires fixing the real defect or correcting an invalid test. Hidden product
  paths whose purpose is assertion satisfaction MUST NOT be created.
- Tests MAY replace external I/O with deterministic dependencies, but test mode
  MUST NOT change validation, authority requirements, state transitions,
  correctness semantics, security behavior, retry semantics, cache truth,
  submission eligibility, or failure semantics.
- Tests MUST observe actual product semantics. They MUST NOT seed hidden
  correctness state, warm caches, retry or poll until an expected result appears,
  advance timers into an otherwise unreachable success state, or bypass required
  authority unless that exact mechanism is legitimate production behavior under
  test.
- Caches are performance layers only. Correctness MUST hold with a cache that is
  cold, empty, disabled, expired, evicted, or unavailable. Cache or shadow state
  MUST NOT fabricate authoritative correctness.
- Asynchronous work MUST NOT return authoritative success before authoritative
  work completes and rely on post-hoc reconciliation. Pending authority remains
  pending or unresolved.
- Development and test fixtures, mock engines, seeded stores, and synthetic
  transports MUST remain explicit and structurally separate. An authoritative
  provider failure MUST NOT silently fall back to fixture data or present mock
  success as product success.
- Authority-sensitive paths MUST fail closed. If required authoritative
  information is missing, inconsistent, or unavailable, the result is
  unavailable, unresolved, or pending; it MUST NOT be guessed or synthesized.

### Validation evidence

Validation levels are separate gates and MUST be reported precisely:

1. `MODULE_PASS` — module, unit, contract, or focused source-level evidence.
2. `SIMULATED_INTEGRATION_PASS` — composed components or services exercised
   with controlled doubles or synthetic transports.
3. `BUILT_RUNTIME_PASS` — the current built artifact exercised through its real
   local serving boundary.
4. `OWNER_BROWSER_PASS` — Product Owner evidence from the relevant real-browser
   environment; otherwise report `OWNER_BROWSER_QA_PENDING`.
5. `PRODUCT_ACCEPTED` — the required Product Owner acceptance gate is complete.

A successful static artifact, TypeScript build, or migration-file check is only
`BUILT_ARTIFACT_PASS`; it is not `BUILT_RUNTIME_PASS`. For persistence-backed
features, `BUILT_RUNTIME_PASS` requires the built server, a real PostgreSQL
schema migrated through the canonical migration runner, an authenticated API
request through the real local serving boundary, and a successful repository
round-trip. A server that starts against an incompatible schema does not meet
the built-runtime gate, even when source tests and static builds are green.

Lower validation levels MUST NOT substitute for a higher required gate. Source
tests, happy-dom, component mounting, and mock fetch do not prove that the
hydrated built browser artifact works. Built-runtime parity MUST be verified
separately when required. If real Product Owner browser behavior contradicts
synthetic tests, the reproducible browser evidence wins.

Development, test, local, and production differences MUST be explicit and
intentional. Diagnostics and tooling may differ, but correctness semantics MUST
NOT differ. Every implementation report MUST identify the strongest validation
level achieved, list material environment differences, distinguish external
owner gates from engineering blockers, and MUST NOT claim Product Accepted
without the required evidence.

### NatalNode authority boundaries

- Website code MUST NOT perform astronomy calculations, access an astronomy
  provider directly, or cross the fixed `NatalNode.com → Website API / BFF →
  NatalNode Engine Public API` boundary.
- GeoNames location resolution establishes place, coordinate, and IANA timezone
  identity only. A GeoNames numeric UTC offset MUST NOT be treated as historical
  birth-time authority.
- Web code MUST NOT fabricate historical time authority, production chart facts,
  or scientific results. Development astronomy fixtures MUST remain visibly
  labelled; fixture success is not production scientific correctness.
- Raw user location text is not location authority. Explicit candidate selection
  is required; location guessing and automatic selection are forbidden.
- Provider failures MUST NOT silently fall back to fixtures. Scientific accuracy
  MUST NOT be monetized or degraded by tier.
- `PROVIDER DECISION DEFERRED` remains authoritative until an approved product
  and architecture decision explicitly changes it.

### Codex workflow and automated guard

Codex should implement autonomously within approved policy, use targeted
validation, commit meaningful boundaries, and continue through large campaigns
instead of returning after every commit. It should stop only for a genuine
architecture, product, legal, or external blocker, and MUST NOT claim Product
Accepted without the required Product Owner evidence.

The repository guard `npm run test:engineering-integrity`, implemented by
`scripts/test-engineering-integrity.test.mjs`, is the automated alignment check
for explicit development doubles, fail-closed location and cache boundaries,
secret-safe startup behavior, and built local-runtime composition. The guard
supports this policy; it does not replace the validation ladder or owner
browser/product acceptance gates. The guard MUST remain low-noise and MUST NOT
be weakened by changing production semantics for its assertions.
