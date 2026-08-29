# NatalNode.com P0 Readiness Checkpoint V1

- Status: **CURRENT PRODUCT READINESS CHECKPOINT**
- Task: `WEB-P0-READY-002`
- Baseline: `8bcf25fd37187e6268077ed25539846679286dfd`
- Baseline message: `docs: define p0 data retention contract`
- Date: 2026-08-29
- Mode: Product / architecture readiness reconciliation; narrowly updated after the P0 Google Sign-In technical contract freeze
- Checkpoint strategy: **V1 updated in place**; V1 is the living checkpoint
- Production astronomy: `PROVIDER DECISION DEFERRED`
- Deployment: `PAUSED`

## 1. Checkpoint purpose

This living checkpoint reconciles the P0 contract in `docs/PRD.md` with the
current repository source and bounded Git history. It supersedes stale status
claims in the previous checkpoint snapshot, but it does not rewrite the PRD,
approve a provider, authorize deployment, or claim live-environment
verification.

The distinction between implementation closure and operational readiness is
deliberate:

- **Implementation closed** means the bounded code/documentation track is
  present in the repository and its stated boundary is complete.
- **Operationally verified** means the real database, email provider, DNS/TLS,
  hosting, credentials, production configuration, or browser flow has been
  exercised in its target environment.
- **Policy or external blocked** means a safe implementation or launch claim
  depends on an approved decision, credential, legal review, provider, or
  infrastructure that is not established here.

This checkpoint records the first claim when supported and keeps the second
claim separate. It performs no product implementation.

## 2. Sources and audit boundary

The following source-of-truth documents were read in full or inspected at the
current baseline as required by this reconciliation:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/product/NATALNODE_P0_READINESS_CHECKPOINT_V1.md`
- `docs/product/NATALNODE_GOOGLE_SIGN_IN_V1.md`
- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`
- `docs/product/NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md`
- `docs/product/NATALNODE_ACCOUNT_DATA_EXPORT_V1.md`
- `docs/product/NATALNODE_AUTH_LIFECYCLE_CLEANUP_V1.md`
- `docs/product/NATALNODE_API_PROBLEM_DETAILS_V1.md`
- `docs/product/NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md`
- `docs/product/NATALNODE_CHARTRESULT_CACHE_V1.md`
- `docs/product/NATALNODE_OBSERVABILITY_V1.md`
- `docs/product/NATALNODE_DATA_RETENTION_V1.md`
- `docs/product/NATALNODE_LOCAL_PUBLIC_DEVELOPMENT_RUNTIME_V1.md`
- `docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md`
- `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`
- `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`

Relevant current source was checked under `server/src`, `server/db/migrations`,
`apps/web/src`, and `packages`. Bounded Git history was checked for the
implementation commits that closed the tracks below. Some product contracts
retain their original pre-implementation status headers because they are
design handoff documents; current source and later implementation history are
the evidence used for this living checkpoint.

The fixed architecture boundary remains:

~~~
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
~~~

The separate `C:\\NatalNode` repository was not accessed. No live database,
email delivery, deployment, production-provider, or browser validation was run
for this checkpoint. The B1 focused persistence/schema test, server check, and
server build were run for the durable core implementation.

## 3. Executive readiness statement

The repository is **P0 foundation-strong but not P0 implementation-complete
or launch-ready**. The previously stale implementation-gap claims for account
deletion/erasure, account export, Auth lifecycle cleanup, RFC 9457 runtime
errors, ChartResult caching, and P0 observability are corrected below. The
public local development runtime is also present and its accepted behavior is
recorded without rerunning browser acceptance.

The previously open Web-owned Vault chart duplicate operation is now closed.
Privacy-access auditing has an approved privacy-minimized technical contract,
and its typed append-only PostgreSQL core is now implemented. No current
privileged data-access surface exists; integration into real privileged
surfaces remains gated on approved authorization and operational policy.
The P0 data-retention technical contract is now frozen, but retention
enforcement remains a separate P0 gap dependent on policy values, owners,
scheduler/operations binding, and external controls. The P0 Google Sign-In
technical contract is now frozen and its bounded local implementation is ready,
while runtime implementation, live OAuth configuration, privacy disclosure,
and live verification remain separately gated. Public legal pages, staging
infrastructure, and production scientific truth remain blocked or deferred.
No astronomy provider is selected here.

## 4. P0 readiness matrix

| Track | Current repository status | Evidence | Boundary that remains open | Classification |
| --- | --- | --- | --- | --- |
| A. Account deletion / account-wide erasure | Authenticated destructive route, recent-authentication gate, owner-bound transactional PostgreSQL erasure, cookie clearing, and Account UI are implemented | `server/src/app/routes/account.ts`; `server/src/persistence/postgres/postgres-account-erasure-repository.ts`; `apps/web/src/features/account/account-deletion.ts`; commits `de5df3575bc91af4b87ee7488c768d44ba7df732`, `3e0e25c15426a6e4067722471ffbba23026523d5` | Backup restore reconciliation, infrastructure-log retention, processor retention, live DB verification, and legal/public claims remain open | **IMPLEMENTATION TRACK CLOSED; OPERATIONALLY/POLICY UNVERIFIED** |
| B. Account export | Authenticated two-stage prepare/transfer flow, repeatable-read export snapshot, bounded streaming, browser UX, and Problem Details handling are implemented | `server/src/app/routes/account-export.ts`; `server/src/app/account-export-stream.ts`; `server/src/persistence/postgres/postgres-account-data-export-repository.ts`; `apps/web/src/features/account/account-export.ts`; commits `001a4172b6d988023671c835641e49ef0ee77549`, `41034a2ba300a09f7c69b9dfd4e2d03a4265b071`, `b5ec56ddb55776a48efd2981f4af81cc5cc3cf3b`, `f80a125de88d1b4cc45f47ef705eb8ca7bfc2f2c`, `cd1c90fc7246de279dd2d66e31e10e20d57ffe9f` | Live PostgreSQL snapshot/stream/browser delivery and policy completeness are not verified; export is not an access-audit event | **IMPLEMENTATION TRACK CLOSED; OPERATIONALLY/POLICY UNVERIFIED** |
| C. Auth lifecycle cleanup | Bounded cleanup phases for expired sessions, expired unconsumed challenges, and consumed challenges plus an explicit maintenance executable are implemented | `server/src/auth-runtime/auth-lifecycle-cleanup.ts`; `server/src/persistence/postgres/postgres-auth-lifecycle-cleanup-repository.ts`; `server/src/maintenance/auth-lifecycle-maintenance.ts`; commits `446204803879a6acb64a715fcac33573f159d85c`, `549661c916159b9d842e92dfd89a287ed3372692` | Scheduler/operational invocation, target-environment execution, and approved retention durations remain open | **IMPLEMENTATION TRACK CLOSED; ENFORCEMENT UNVERIFIED** |
| D. RFC 9457 / Problem Details | Current Hono API routes, security middleware, central error boundary, account/export paths, and first-party browser readers use the bounded Problem Details runtime | `server/src/app/problem-details/`; `server/src/app/create-app.ts`; current API route modules; commits `36f40b911e88e3a421ad1458a0d7cccde720bb43`, `fa211117a9374cc5f617d8262bb3cc3d76668d3b`, `87704778f8e60a5e483f1a51b4002a0996489c14`, `430b07d872bb10e3e096eb5bba7139ddc6a8bd57` | Unused legacy error-envelope type declarations remain in `packages/contracts/src/api/` as a later package-contract cleanup candidate; non-API HTML errors are outside this migration | **RUNTIME MIGRATION CLOSED; PACKAGE RESIDUE NON-BLOCKING** |
| E. ChartResult cache | Provider-neutral, process-local, bounded cache with canonical-input keying, generation/schema identity, TTL/LRU, clone-on-store/read, BFF integration, and internal cache outcomes is implemented | `server/src/app/cache/chart-result-cache.ts`; `server/src/app/cache/chart-result-cache-key.ts`; `server/src/app/cache/cached-chart-calculator.ts`; commits `a587b6f3649b5938bdf8a3f3c295766f3954ddd8`, `305644f887563566315100b7aa3b977aaf1ff991`, `0ecd07429a6531d5b2b1b1fba382972e3d459c57` | Production Engine/scientific configuration identity and live multi-instance behavior remain provider/deployment concerns; no hour-level shared planet cache exists | **IMPLEMENTATION TRACK CLOSED; PROVIDER/DEPLOYMENT CONTEXT DEFERRED** |
| F. P0 observability | `P0 OBSERVABILITY IMPLEMENTATION TRACK — CLOSED`: one canonical completion record carries bounded request facts, Problem Details code, cache status, Engine result generation, ChartResult contract version, scientific status, and Engine duration where applicable | `server/src/app/observability/api-request-observability.ts`; `server/src/app/observability/calculation-observability.ts`; current chart/cache composition; commits `09a71bf9b121bc976d0d00a5fa9f8fa40b2d4451`, `06f04999ba70b2447f0bd3821c844152f6b94d9e`, `43b7c3c093b3e734fc6afa9f74a96282e2d11acc` | Retention duration, privacy-access audit, production sink/vendor, warning-count bound, provenance status, and conditional scientific configuration ID remain deferred | **IMPLEMENTATION TRACK CLOSED; DEFERRED OPERATIONS/POLICY ITEMS PRESERVED** |
| G. Public local development runtime | The accepted local public-development composition is implemented: `npm run dev:public`, public `http://localhost:4321`, loopback Hono `127.0.0.1:4322`, static Astro edge, fixture Chart/Sky paths, signed-out session/Vault behavior, and production-marker isolation | `package.json`; `server/src/executable/run-public-development-composition.ts`; `server/src/executable/public-development-dependencies.ts`; `server/src/executable/public-development-config.ts`; commits `41319da055e59b03cc3380d7b48d66cbbf406a2d`, `6d617dce075db3d75e0192edda33aa2c8babe771` | This is local development, not external staging or production; accepted browser behavior is not rerun in this checkpoint | **LOCAL IMPLEMENTATION CLOSED; ACCEPTED BEHAVIOR NOT RERUN** |
| H. Privacy-access auditing | `NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md` freezes a provider-neutral, privacy-minimized event/repository/storage direction; the typed append-only PostgreSQL core is implemented, while no privileged data-access surface exists | `docs/PRD.md`; `docs/product/NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md`; `server/src/persistence/privacy-access-audit-repository.ts`; `server/src/persistence/postgres/postgres-privacy-access-audit-repository.ts`; `server/db/migrations/0006_privacy_access_audit.sql`; `server/test/privacy-access-audit.test.mjs`; current Auth/principal and route boundaries | Privileged-surface integration, reviewer access, retention, and operational workflow remain policy-gated | **B1 DURABLE CORE IMPLEMENTED; B2 POLICY-GATED / NOT STARTED** |
| I1. Retention technical contract | `NATALNODE_DATA_RETENTION_V1.md` freezes the P0 category inventory, lifecycle distinctions, enforcement classes, scheduler boundary, failure/privacy rules, readiness matrix, and policy-parameter registry without inventing durations | `docs/product/NATALNODE_DATA_RETENTION_V1.md`; `docs/product/NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md`; `docs/product/NATALNODE_ACCOUNT_DATA_EXPORT_V1.md`; `docs/product/NATALNODE_AUTH_LIFECYCLE_CLEANUP_V1.md`; `docs/product/NATALNODE_OBSERVABILITY_V1.md` | Policy values/owners, audit deletion interaction, backup/restore reconciliation, processor terms, and external log controls remain open | **CONTRACT FROZEN; POLICY / EXTERNAL GATES OPEN** |
| I2. Retention enforcement | Auth cleanup code and a maintenance command exist; no repository-wide Vault/Feedback/time-retention enforcement or verified scheduled invocation exists | `server/src/maintenance/`; `server/src/persistence/postgres/postgres-auth-lifecycle-cleanup-repository.ts`; `docs/product/NATALNODE_DATA_RETENTION_V1.md`; no configured scheduler or downstream log-retention control in repository source | Implement only after approved category semantics and owners; technical expiry is not deletion or a legal-retention policy | **INCOMPLETE / NOT OPERATIONALLY ENFORCED** |
| I3. Retention policy / external dependency | The contract records unresolved policy and external boundaries for Auth consumed challenges, Vault, Feedback, audit, observability, infrastructure logs, backups, Resend, and future OAuth | `docs/product/NATALNODE_DATA_RETENTION_V1.md`; `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`; erasure/export/observability contracts | Privacy/Product/Security/Operations owners must approve values, scope, exceptions, restore behavior, processor treatment, and scheduler ownership | **POLICY / EXTERNAL BLOCKED** |
| J1. Google Sign-In technical contract and implementation | `NATALNODE_GOOGLE_SIGN_IN_V1.md` freezes the subject-first identity model, server-controlled Authorization Code/OIDC flow, state/PKCE/nonce, collision-safe account resolution, existing-session integration, and live-gate boundary; runtime implementation is not present | `docs/product/NATALNODE_GOOGLE_SIGN_IN_V1.md`; `packages/contracts/src/auth.ts`; `server/db/migrations/0001_auth_vault_baseline.sql`; current Auth routes/cookies/persistence | Bounded local implementation slices, the reviewed Google export presenter, external configuration, privacy disclosure, and live verification remain open | **CONTRACT FROZEN; LOCAL IMPLEMENTATION READY; NOT IMPLEMENTED** |
| J2. Google OAuth credentials/configuration | No Google OAuth client credentials or deployment configuration is present or approved | `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md` decision P-13; current runtime configuration | OAuth credentials, redirect configuration, processor disclosure, and live verification are external gates | **EXTERNAL / CREDENTIAL AND POLICY BLOCKED** |
| K. Vault duplicate | Owner-scoped duplicate contract, route, server recalculation, canonical-result persistence, bounded metadata copy, UI action, and focused regression coverage are implemented | `packages/contracts/src/api/vault.ts`; `server/src/app/routes/vault-charts.ts`; `server/src/persistence/vault-chart-repository.ts`; `apps/web/src/features/vault/`; commit `ed6303640f759a33ee67998338c4bf9cbfb4262d` | Live PostgreSQL/browser verification remains outside this checkpoint; the implementation track must not be reopened without a concrete regression | **IMPLEMENTATION TRACK CLOSED; OPERATIONALLY UNVERIFIED** |
| L1. Legal/privacy copy implementation | `/privacy` and `/terms` are not present; no unsupported placeholder claims were added | `apps/web/src/pages/`; `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md` | Approved legal entity/controller, contact, jurisdiction, age, retention, rights, and counsel-reviewed copy are required | **NOT IMPLEMENTED / POLICY-BLOCKED P0 GAP** |
| L2. Legal/policy dependency | Product policy records unresolved legal and operational decisions; the policy document is not legal advice or final public copy | `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`, especially P-01 through P-16 | Legal/privacy/operations approval must precede publication and any unsupported commitment | **EXTERNAL / POLICY BLOCKED** |
| M1. Staging local readiness | Provider-neutral topology, executable server composition, migrations, local edge, public-development runtime, and security middleware foundations exist; Railway/Caddy staging composition is not implemented or verified | `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`; `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`; `server/src/executable/`; `server/src/runtime/` | Repository-local readiness is not a staging deployment; staging-specific edge, environment, and E2E work remains a separate authorized task | **PARTIAL / READY-TO-RESUME ONLY** |
| M2. Staging external infrastructure | Railway P0 research-staging topology is accepted, but provisioning, DNS/TLS, secrets, PostgreSQL/Resend configuration, deployment, migration execution, and staging E2E are absent | `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`; no Railway/Caddy deployment implementation in the repository | Deployment remains paused; do not start `WEB-DEPLOY-002B` from this checkpoint | **DEPLOYMENT-PAUSED / EXTERNAL BLOCKED** |
| N. Production astronomy/provider | Production Engine, AstronomyProvider, rights, scientific configuration, provenance, and production E2E are not selected or implemented in Web | `docs/PRD.md` release gate; deploy ADRs; `server/src/executable/create-executable-server-bindings.ts` accepts only explicit development-mock behavior | Approved production Engine/provider and scientific release gates are required | **PROVIDER-DEPENDENT / DEFERRED** |
| O. Resolver / production Sky | Development resolver and provider-neutral Public Sky fixtures/instrument exist; production location, historical-timezone, and Sky authority do not | `apps/web/src/features/chart-input/development-resolver.ts`; `docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md`; current Sky BFF/fixture source | Approved production data source/Engine remains required; Current Transits is P1 and is not started | **PROVIDER-DEPENDENT / DEFERRED** |

## 5. Closed implementation tracks and reopening protection

The following implementation tracks are closed at the repository boundary and
must not be mechanically reopened because the older checkpoint said they were
missing:

1. Account deletion and account-wide erasure implementation.
2. Account export implementation, including the two-stage browser delivery
   amendment.
3. Auth lifecycle cleanup implementation and maintenance command.
4. RFC 9457 Problem Details runtime migration across the API/BFF boundaries.
5. ChartResult cache abstraction and BFF integration.
6. `P0 OBSERVABILITY IMPLEMENTATION TRACK — CLOSED`, including request and
   calculation observability hardening.
7. Public local development runtime and its accepted signed-out/fixture
   behavior.
8. Vault chart duplication, including the owner-scoped server recalculation
   path and first-party UI boundary.

The accepted Calculate/Chart/Interpretation/Details result architecture,
Visual V1.1 foundation, and development Public Sky foundation also remain
frozen unless a concrete regression is found. This checkpoint does not reopen
visual polish, result UX, homepage design, or a repository-wide decomposition
program.

`WEB-PRIVACY-001A — Freeze Account Deletion and Account-Wide Erasure
Technical Contract` is a stale recommendation from the previous checkpoint.
The implementation track has landed; that task must not be executed or
recreated. Any remaining deletion work is limited to explicit operational,
backup, processor, legal, or policy gates recorded above.

## 6. Retention and privacy-access interpretation

The repository now contains a bounded Auth lifecycle cleanup mechanism, but
that does not mean that a product/legal retention duration has been approved
or that all retention is enforced. These claims remain separate:

| Question | Current answer |
| --- | --- |
| Is there a retention technical contract? | **Yes, technical boundary only.** `NATALNODE_DATA_RETENTION_V1.md` freezes the category inventory, lifecycle distinctions, enforcement model, and policy registry without selecting policy durations. |
| Is retention enforcement complete? | **No.** The Auth maintenance command is code-complete, but scheduled/target-environment invocation is not verified; Vault, Feedback, and downstream application/infrastructure log enforcement are not established. |
| Is the retention policy approved? | **No.** Duration, scope, exceptions, backup/restore handling, processor retention, and access roles remain policy/operations dependencies. |
| Is privacy-access auditing implemented? | **Partially.** B1 now provides the typed, bounded, append-only PostgreSQL storage core. No privileged data-access surface, reviewer access, retention enforcement, or operational workflow exists; operational request observability remains separate and is not access-audit evidence. |
| Is a privacy-access audit the same as an account deletion/export record? | **No.** Deletion/export records are bounded product operations; a privacy-access audit needs its own authorized-access model and retention decision. |

No duration is invented in this checkpoint. Technical expiration remains
distinct from deletion and from a legal retention promise.

## 7. Public local-development readiness

The accepted local behavior is recorded from current source/history and is not
rerun here:

- `npm run dev:public` builds the static Astro artifact and starts the
  `public-development` edge/runtime.
- The browser origin is `http://localhost:4321`.
- The Hono API listener is loopback-only at `127.0.0.1:4322`.
- Chart requests use the existing `CachedChartCalculator` and
  `MockEngineClient` fixture path through the BFF.
- Public Sky uses the existing provider-neutral development fixtures and
  retains its development/research disclosure.
- `GET /api/auth/session` is signed out, and protected Vault behavior fails
  closed/redirects through the existing boundary rather than fabricating a
  user or persistence store.
- PostgreSQL and Resend are not needed for this public-development path.
- The complete local runtime and production executable remain isolated; the
  public-development composition rejects an explicit production marker and
  does not select a production Engine/provider.

This is not staging evidence, production evidence, or live astronomy
evidence. Browser acceptance is intentionally not rerun by this checkpoint.

## 8. Remaining P0 gaps by ownership

### 8.1 Next action after the Google Sign-In contract freeze

`WEB-RETENTION-001A` has frozen the P0 retention technical boundary. Retention
enforcement remains policy/operations gated: Auth expiry still needs
scheduler binding, consumed-challenge treatment needs a policy decision, and
category/external cleanup needs approved values and owners. The durable Privacy
Access Audit B1 core remains implemented, while privileged integration remains
policy-gated.

`WEB-AUTH-GOOGLE-001A` has now frozen a collision-safe Google Sign-In
technical contract. The existing identity, session, cookie, and BFF boundaries
can support a bounded local implementation with an injected provider boundary;
live Google credentials, redirect registration, privacy disclosure, and live
verification remain external-gated. The current export presenter must remain
fail-closed until the reviewed Google identity presenter/schema extension lands
in the implementation slice.

The single next P0 action is the first bounded local Google implementation
slice:

~~~
WEB-AUTH-GOOGLE-001B1 — Implement the internal Google OIDC provider abstraction and the server-side pending transaction/state/PKCE/nonce boundary.
~~~

This is a recommendation only; this checkpoint does not start it.

### 8.2 Provider-dependent gaps

- Production Engine/AstronomyProvider selection, rights, runtime assets,
  scientific configuration, provenance, and production Full Chart E2E.
- Production location and historical-timezone authority behind the existing
  resolver boundary.
- Production Public Sky authority and any future Sky expansion.
- Any provider-specific generation/configuration needed to make production
  cache or observability claims.

`PROVIDER DECISION DEFERRED` remains authoritative. Development fixtures must
not be relabeled as live or production astronomy.

### 8.3 External, policy, credential, and deployment blockers

- Retention duration/scope for Auth, Vault, Feedback, application logs,
  infrastructure logs, backups, and processors.
- Privacy-access audit authorization/access roles, retention, reviewer access,
  and operational workflow; the technical event scope is now frozen.
- Google OAuth security/privacy approval, credentials, redirect configuration,
  processor disclosure, and live verification.
- Legal entity/controller, privacy contact, jurisdiction, age policy, rights,
  retention representations, and counsel-approved `/privacy` and `/terms`
  copy.
- Live PostgreSQL, TLS, encryption at rest, least privilege, backup/restore,
  Resend credentials/domain/DNS, and target-environment cookie verification.
- Railway/Caddy staging provisioning, DNS/TLS, secrets, migrations, and E2E;
  deployment remains paused.
- Production observability sink/vendor and downstream log retention/access;
  no logging vendor, APM, analytics, or audit system is selected.

These blockers must not be disguised as ordinary source edits or silently
resolved with invented policy text, credentials, providers, or deployment
configuration.

## 9. Deferred and non-P0 items

The following remain intentionally deferred and are not converted into work by
this checkpoint:

- Retention enforcement and privileged-surface audit integration until the
  policy/operations owners, approved values, scheduler, and real access
  surfaces are resolved. The privacy-access technical contract and B1 durable
  core are implemented; B2 remains policy-gated, while the retention technical
  boundary is now frozen.
- Observability `warningCount`, `provenanceStatus`, and conditional
  `astronomyConfigurationId` until bounded source-level semantics are
  approved; production sink/vendor selection remains deferred.
- Google Sign-In runtime implementation and live enablement until the bounded
  implementation slices, reviewed export presenter, and external authorization
  gates land. The technical contract is frozen and local work is ready; this
  checkpoint does not start it.
- Public legal pages until approved policy and counsel-reviewed copy exist.
- Railway/Caddy staging implementation while deployment is paused.
- Production astronomy, production resolver, and production Public Sky.
- Current Transits, `/sky` expansion, AI, Pro, Ads/CMP, PDF, subscriptions,
  Community, Practitioner, and other P1/P2/P3 work.
- Guest refresh/navigation persistence, Feedback history/delete, profile and
  identity-management expansion, and generic visual polish.
- Standalone large-file cleanup. LOC thresholds remain heuristic guardrails,
  not lint rules, automatic refactor triggers, or reasons to alter working
  code.

## 10. Do not do next

- Do not execute or recreate `WEB-PRIVACY-001A`.
- Do not reopen the closed deletion, export, Auth cleanup, Problem Details,
  cache, observability, public-local-runtime, or Vault chart duplication
  implementation tracks without a concrete regression or a separately
  authorized new boundary.
- Do not treat Auth cleanup code as proof of an approved retention duration or
  complete retention enforcement.
- Do not use operational request logs as a privacy-access audit.
- Do not add Google OAuth, legal copy, provider logic, production astronomy,
  staging infrastructure, or deployment configuration from this checkpoint.
- Do not start Current Transits or any other P1/P2/P3 work.
- Do not access or modify `C:\\NatalNode`.

## 11. Checkpoint decision

The repository has crossed several former P0 implementation gaps since the
previous checkpoint, and those closed tracks are now protected from stale-list
reopening. The remaining release picture is:

~~~
P0 implementation foundation       = STRONG
Closed implementation tracks       = PRESERVED
Retention technical contract       = FROZEN; policy values required
Google Sign-In technical contract  = FROZEN; local implementation ready
Unblocked local P0 work            = GOOGLE SIGN-IN 001B1; retention remains policy-gated
Privacy audit/retention completion = NOT COMPLETE; policy/operations gated
Google live OAuth/configuration     = EXTERNAL / CREDENTIAL AND POLICY GATED
Staging                             = PAUSED
Production astronomy/provider       = DEFERRED
Launch readiness                    = NOT COMPLETE
~~~

The single recommended next P0 action is `WEB-AUTH-GOOGLE-001B1`, the bounded
local provider-abstraction and pending-transaction/state/PKCE/nonce slice
described in section 8.1. It is a recommendation only; this checkpoint does
not start another task. Retention policy/operations approval, Privacy Access
Audit privileged integration, Google live configuration, legal/public copy,
staging, and production provider gates remain separately open.
`WEB-PRIVACY-AUDIT-001B2` remains policy-gated and is not started.
