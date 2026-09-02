# NatalNode.com P0 Readiness Checkpoint V1

- Status: **HISTORICAL CHECKPOINT / SUPERSEDED FOR CURRENT LAUNCH STATUS**
- Task: `WEB-P0-READY-003` (historical); current consolidation: `WEB-P0-001`
- Baseline: `8aa89a72cd9082ee4c532cb264a95dff094bcd40`
- Baseline message: `docs: reconcile Web product roadmap after Practitioner V1`
- Date: 2026-09-01
- Mode: Historical product / architecture reconciliation; current launch status is maintained in [`NATALNODE_P0_LAUNCH_READINESS_V1.md`](./NATALNODE_P0_LAUNCH_READINESS_V1.md)
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

## Current launch-readiness supersession

`WEB-P0-001 — P0 Launch-Readiness Closure + Production Gate Consolidation`
is now the current launch-readiness authority. Its consolidated matrix and
packages are in [`NATALNODE_P0_LAUNCH_READINESS_V1.md`](./NATALNODE_P0_LAUNCH_READINESS_V1.md).
The historical rows below remain useful as decision history, but any statement
that says Community or Practitioner retention maintenance is absent, that the
Account Export matcher is unresolved, or that no local configuration gap can
be corrected is superseded by the current document. The current campaign did
not reopen closed product tracks; it added only the missing Community
maintenance wrapper, HTTPS/Secure-cookie validation, and the stale test
correction.

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
server build were run for the durable core implementation in its earlier
implementation task; they are not rerun by this documentation-only checkpoint.

## 3. Executive readiness statement

The repository is **P0 local-engineering substantially complete but not
production-release-ready**. Major bounded local application tracks are closed,
including account deletion/erasure, account export, Auth lifecycle cleanup,
RFC 9457 runtime errors, ChartResult caching, P0 observability, the public
local development runtime, Vault chart duplication, and the Google Sign-In
local implementation track through its final local review. The public local
development runtime is present and its accepted behavior is recorded without
rerunning browser acceptance.

The previously open Web-owned Vault chart duplicate operation is now closed.
Privacy-access auditing has an approved privacy-minimized technical contract,
and its typed append-only PostgreSQL core is now implemented. No current
privileged data-access surface exists; integration into real privileged
surfaces remains gated on approved authorization and operational policy.
The P0 data-retention technical contract is now frozen, but retention
enforcement remains a separate P0 gap dependent on policy values, owners,
scheduler/operations binding, and external controls. The P0 Google Sign-In
technical contract is frozen and its B1/B2/B3 bounded local implementation
plus the final `001C` review are closed, while live OAuth configuration,
privacy disclosure, and live verification remain separately gated. Public
legal pages, staging infrastructure, and production scientific truth remain
blocked or deferred. No astronomy provider is selected here. The historical
checkpoint is superseded for current launch status by
`NATALNODE_P0_LAUNCH_READINESS_V1.md`, which records the safe local gaps closed
by `WEB-P0-001` and the remaining external gates.

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
| I2. Retention enforcement | Auth, Community, and Practitioner frozen-predicate maintenance commands exist; Vault/Feedback/time-retention policy and any verified scheduled invocation remain open | `server/src/maintenance/`; `server/src/executable/`; `server/src/persistence/postgres/postgres-auth-lifecycle-cleanup-repository.ts`; `server/src/community/postgres-community-repository.ts`; `server/src/practitioner/postgres-practitioner-repository.ts`; current launch-readiness contract | Bind commands to operations only after approved policy values and owners; technical expiry is not deletion or a legal-retention policy | **LOCAL IMPLEMENTATION CLOSED; OPERATIONS/POLICY UNVERIFIED** |
| I3. Retention policy / external dependency | The contract records unresolved policy and external boundaries for Auth consumed challenges, Vault, Feedback, audit, observability, infrastructure logs, backups, Resend, and future OAuth | `docs/product/NATALNODE_DATA_RETENTION_V1.md`; `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`; erasure/export/observability contracts | Privacy/Product/Security/Operations owners must approve values, scope, exceptions, restore behavior, processor treatment, and scheduler ownership | **POLICY / EXTERNAL BLOCKED** |
| J1. Google Sign-In technical contract and implementation | `NATALNODE_GOOGLE_SIGN_IN_V1.md` freezes the subject-first identity model, server-controlled Authorization Code/OIDC flow, state/PKCE/nonce, collision-safe account resolution, existing-session integration, and live-gate boundary; B1 provides the provider boundary and pending transaction core, B2 provides the local start/callback, collision-safe account/session integration, and reviewed Google export representation, B3 provides the server-owned availability response plus minimal sign-in UI, and `001C` closed the final local adversarial review without source fixes | `docs/product/NATALNODE_GOOGLE_SIGN_IN_V1.md`; `server/src/auth-runtime/google-oidc-provider.ts`; `server/src/auth-runtime/google-oauth-transaction.ts`; `server/src/app/routes/google-auth.ts`; `server/src/app/routes/auth-session.ts`; `apps/web/src/features/auth/google-sign-in.ts`; `server/src/persistence/postgres/postgres-google-auth-account-session-lifecycle.ts`; `server/src/account/account-data-export.ts`; `server/db/migrations/0007_google_oauth_transactions.sql`; commits `30bed04`, `b1d2a53`, `f203bb6` | Real Google project/credentials, redirect and origin/domain configuration, live OIDC/JWKS behavior, HTTPS/Secure-cookie validation, privacy/security approval, deployment, configured-state visual review, and live browser verification remain open; `001D` must remain external-gated/not started | **CONTRACT FROZEN; B1 IMPLEMENTED / SECURITY REVIEW CLOSED; B2 IMPLEMENTED LOCALLY / SECURITY REVIEW CLOSED; B3 IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE COMPLETED FOR LEGITIMATE LOCAL STATES; 001C PASS / CLOSED; LIVE OAUTH EXTERNAL-GATED** |
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
9. Google Sign-In local implementation through B1, B2, B3, and the final
   `WEB-AUTH-GOOGLE-001C` local adversarial review.

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

The Google Sign-In local implementation track is likewise closed through
`WEB-AUTH-GOOGLE-001C`. Its final local adversarial review passed with no
source fixes and therefore has no implementation commit. Live Google
acceptance remains the separate external-gated `WEB-AUTH-GOOGLE-001D` boundary.

## 6. Retention and privacy-access interpretation

The repository now contains a bounded Auth lifecycle cleanup mechanism, but
that does not mean that a product/legal retention duration has been approved
or that all retention is enforced. These claims remain separate:

| Question | Current answer |
| --- | --- |
| Is there a retention technical contract? | **TECHNICAL CONTRACT FROZEN / POLICY VALUES REQUIRED / IMPLEMENTATION / OPERATIONS DEFERRED.** `NATALNODE_DATA_RETENTION_V1.md` freezes the category inventory, lifecycle distinctions, enforcement model, and policy registry without selecting policy durations. |
| Is retention enforcement complete? | **Not operationally.** Auth, Community, and Practitioner frozen-predicate maintenance commands are locally present, but scheduled/target-environment invocation is not verified; Vault, Feedback, and downstream application/infrastructure log enforcement remain policy/external gates. |
| Is the retention policy approved? | **No.** Duration, scope, exceptions, backup/restore handling, processor retention, and access roles remain policy/operations dependencies. |
| Is privacy-access auditing implemented? | **Partially.** B1 now provides the typed, bounded, append-only PostgreSQL storage core. No privileged data-access surface, reviewer access, retention enforcement, or operational workflow exists; operational request observability remains separate and is not access-audit evidence. |
| Is a privacy-access audit the same as an account deletion/export record? | **No.** Deletion/export records are bounded product operations; a privacy-access audit needs its own authorized-access model and retention decision. |

No duration is invented in this checkpoint. Technical Auth expiry and the
ephemeral ChartResult cache TTL remain distinct from retention policy, backup
retention, observability retention, audit retention, processor retention, and
account deletion. The current export path stores no server archive, so it does
not create an export-artifact retention value.

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
- Public-development Auth remains intentionally anonymous and fail-closed.
  Email Magic Link failure without PostgreSQL and Resend infrastructure is
  expected in this composition; it is not an Auth bug or an unblocked local
  implementation gap. Google Sign-In likewise has no fake provider, identity,
  or public-development live path.
- PostgreSQL and Resend are not needed for this public-development path.
- The complete local runtime and production executable remain isolated; the
  public-development composition rejects an explicit production marker and
  does not select a production Engine/provider.

This is not staging evidence, production evidence, or live astronomy
evidence. Browser acceptance is intentionally not rerun by this checkpoint.

## 8. Remaining P0 gaps by ownership

### 8.1 Google Sign-In local closure and live boundary

`WEB-RETENTION-001A` has frozen the P0 retention technical boundary. Retention
enforcement remains policy/operations gated: Auth expiry still needs
scheduler binding, consumed-challenge treatment needs a policy decision, and
category/external cleanup needs approved values and owners. The durable Privacy
Access Audit B1 core remains implemented, while privileged integration remains
policy-gated.

`WEB-AUTH-GOOGLE-001A` froze the collision-safe Google Sign-In technical
contract. The existing identity, session, cookie, and BFF boundaries support a
bounded local implementation with an injected provider boundary. The reviewed
Google identity presenter/schema extension is included in the B2 local
implementation. Live Google credentials, registration, privacy disclosure, and
live verification remain external-gated.

`WEB-AUTH-GOOGLE-001B1` is implemented and its B1-R1 security review is closed
as the bounded local provider abstraction and pending transaction/state/PKCE/
nonce core. `WEB-AUTH-GOOGLE-001B2` is implemented locally and its B2-R1
security review is closed; it provides Auth routes, injected-provider
integration, collision-safe account/session persistence, and the reviewed
Google export representation. `WEB-AUTH-GOOGLE-001B3` is implemented locally
with a server-owned capability field on the existing Auth/session response, a
minimal capability-gated sign-in action, and the fixed generic callback-failure
state. No provider network calls, credentials, or fake public-development Auth
were added.

Google Sign-In implementation status:

- `WEB-AUTH-GOOGLE-001A` — **CONTRACT FROZEN**
- `WEB-AUTH-GOOGLE-001B1` — **IMPLEMENTED / SECURITY REVIEW CLOSED**
- `WEB-AUTH-GOOGLE-001B2` — **IMPLEMENTED LOCALLY / SECURITY REVIEW CLOSED**
- `WEB-AUTH-GOOGLE-001B3` — **IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE COMPLETED FOR LEGITIMATE LOCAL STATES**
- `WEB-AUTH-GOOGLE-001C` — **PASS / CLOSED**; no fix required and no source commit exists
- **GOOGLE SIGN-IN LOCAL IMPLEMENTATION TRACK — CLOSED**
- `WEB-AUTH-GOOGLE-001D` live OAuth acceptance — **EXTERNAL-GATED / NOT STARTED**

No live Google Sign-In or production-readiness claim is made. The separate
`001D` boundary remains blocked until all of the following are supplied and
verified outside this repository:

- a real Google OAuth project and client ID/secret where applicable;
- registered redirect URIs and approved origin/domain configuration;
- live Google OIDC discovery/JWKS behavior;
- HTTPS and Secure-cookie behavior in the target environment;
- approved privacy/security treatment and public disclosure;
- deployment-environment configuration; and
- live configured-state browser acceptance.

The local capability-false, generic callback-failure, and legitimate local
capability-true UI states remain the only local Google evidence. This
checkpoint does not start `001D` or reopen the closed local track.

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
- Production observability sink/storage, retention, operations ownership/access
  controls, and deployed-environment verification; no logging vendor, APM,
  analytics, or audit system is selected.

These blockers must not be disguised as ordinary source edits or silently
resolved with invented policy text, credentials, providers, or deployment
configuration.

### 8.4 P0 decision register — no local implementation gap

**NO SAFE UNBLOCKED LOCAL P0 IMPLEMENTATION GAP IDENTIFIED**

The remaining P0 work requires an approved decision, legal input, external
credential/configuration, operations control, or production scientific
authority. The following register groups those inputs without assigning them
to people or inventing values:

| Group | Decision boundary | Current state |
| --- | --- | --- |
| A. Product / user policy | Confirm the remaining P0 launch criteria, whether time-based cleanup is desired for Vault charts, notes, or Feedback, and any approved user-facing scope/exception decisions for the existing Auth and Google Sign-In behavior | **POLICY REQUIRED**; no new product behavior is authorized by this checkpoint |
| B. Privacy / security policy | Approve privileged human/service authorization, reviewer authorization, audit retention, audit-record treatment when an account is deleted, any break-glass behavior only if ever approved, and the operational review workflow; keep the append-only audit core separate from ordinary observability | **POLICY-GATED**; no privileged non-owner surface or role/service policy exists |
| C. Legal / counsel | Supply the approved controller/legal entity, contact, jurisdiction, age/consent position, rights and retention representations, processor disclosures, and counsel review required before `/privacy` or `/terms` copy | **POLICY / LEGAL / EXTERNAL REQUIRED**; no legal text or compliance conclusion is invented |
| D. Operations / infrastructure | Decide Auth maintenance scheduler ownership, backup/restore lifecycle and reconciliation, infrastructure-log controls, observability sink/retention/access ownership, database grants/access, Resend processor behavior, staging/deployment environment, and live verification ownership | **EXTERNAL / OPERATIONS-GATED**; deployment remains paused and no provider is configured |
| E. External credential / provider configuration | For Google only, supply and verify the real OAuth project, client credentials, redirect URIs, origin/domain configuration, live OIDC/JWKS behavior, HTTPS/Secure-cookie deployment, approved privacy/security treatment, and configured-state live browser acceptance | **WEB-AUTH-GOOGLE-001D EXTERNAL-GATED / NOT STARTED**; do not mix this with AstronomyProvider selection |
| F. Scientific / Engine provider gate | Select and authorize the production Engine/AstronomyProvider, scientific authority, rights, configuration/provenance, resolver/timezone authority, and production Sky evidence | **PROVIDER DECISION DEFERRED**; this is not a website-local implementation gap |

The retention subset that blocks a complete P0 release claim is the approved
scope/owner/exception treatment for Auth consumed challenges, any intended
Vault/note/Feedback cleanup, Privacy Access Audit, observability,
infrastructure logs, backups, processors, and erasure residual reconciliation,
plus scheduler ownership. The authoritative registry remains section 5 of
`NATALNODE_DATA_RETENTION_V1.md`; technical Auth expiry, the ephemeral cache
TTL, and the current no-archive export boundary must not be relabeled as
retention-policy approval. No duration is selected here.

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
- Google Sign-In live enablement until external authorization gates, privacy
  disclosure, deployment configuration, and live verification land. B1, B2,
  B3, and the final `001C` local review are closed; the local implementation
  track is not reopened and this checkpoint does not start `001D`.
- Public legal pages until approved policy and counsel-reviewed copy exist.
- Railway/Caddy staging implementation while deployment is paused.
- Production astronomy, production resolver, and production Public Sky.
- Current Transits, `/sky` expansion, AI, Pro, Ads/CMP, PDF, subscriptions, and
  future expansion beyond the bounded Community/Questions V1,
  Practitioner/Contributor V1, and Private Feedback MVP remain deferred.
- Guest refresh/navigation persistence, Feedback history/delete, profile and
  identity-management expansion, and generic visual polish.
- Standalone large-file cleanup. LOC thresholds remain heuristic guardrails,
  not lint rules, automatic refactor triggers, or reasons to alter working
  code.

## 9.1 Later Web Product closure reconciliation

This P0 checkpoint remains authoritative for P0 release readiness. Since this
checkpoint's 2026-08-29 snapshot, the bounded Foundations, Private Feedback,
Community/Questions, and Practitioner/Contributor tracks have been verified
locally complete. Their remaining legal, privacy, reviewer, retention, and
operational requirements are launch gates, not missing local MVP
implementation. The reconciled roadmap records their current product-state
classification; no completed track is reopened by this note.

## 10. Do not do next

- Do not execute or recreate `WEB-PRIVACY-001A`.
- Do not reopen the closed deletion, export, Auth cleanup, Problem Details,
  cache, observability, public-local-runtime, or Vault chart duplication
  implementation tracks without a concrete regression or a separately
  authorized new boundary.
- Do not treat Auth cleanup code as proof of an approved retention duration or
  complete retention enforcement.
- Do not bind the retention commands to a production scheduler or activate
  policy-gated cleanup before the required policy/operations decisions exist.
  The Auth, Community, and Practitioner executable boundaries are now present;
  do not treat them as proof of scheduled enforcement. Do not begin
  `WEB-PRIVACY-AUDIT-001B2` without an approved privileged surface.
- Do not use operational request logs as a privacy-access audit.
- Do not add provider network wiring, legal copy, production astronomy, staging
  infrastructure, deployment configuration, or Google `001D` live acceptance
  from this checkpoint. Preserve the completed Google B1/B2/B3/001C local
  boundaries.
- Do not execute the recommended P0 decision checkpoint automatically.
- Do not start Current Transits or any other P1/P2/P3 work.
- Do not access or modify `C:\\NatalNode`.

## 11. Checkpoint decision

The repository has crossed several former P0 implementation gaps since the
previous checkpoint, and those closed tracks are now protected from stale-list
reopening. The remaining release picture is:

~~~
P0 local engineering readiness       = COMPLETE FOR THE WEB-P0-001 BOUNDARY; external launch gates remain
P0 implementation foundation        = STRONG
Closed implementation tracks        = PRESERVED, including Google local track through 001C
Retention technical contract        = FROZEN; POLICY VALUES REQUIRED; IMPLEMENTATION / OPERATIONS DEFERRED
Retention enforcement               = FROZEN LOCAL PREDICATES PRESENT; POLICY / EXTERNAL / OPERATIONS-GATED
Privacy Access Audit B1              = IMPLEMENTED; B2 POLICY-GATED / NOT STARTED
P0 observability local              = IMPLEMENTATION TRACK CLOSED
Google Sign-In 001A                 = CONTRACT FROZEN
Google Sign-In B1                   = IMPLEMENTED / SECURITY REVIEW CLOSED
Google Sign-In B2                   = IMPLEMENTED LOCALLY / SECURITY REVIEW CLOSED
Google Sign-In B3                   = IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE COMPLETED FOR LEGITIMATE LOCAL STATES
Google Sign-In 001C                 = PASS / CLOSED
Google Sign-In local track          = CLOSED
Google Sign-In 001D                 = EXTERNAL-GATED / NOT STARTED
Legal/public copy                  = NOT IMPLEMENTED; POLICY / LEGAL / EXTERNAL REQUIRED
Staging/deployment                 = PAUSED; EXTERNAL BLOCKED
Production observability           = EXTERNAL / OPERATIONS / POLICY-GATED
Production astronomy/provider      = PROVIDER DECISION DEFERRED
P0 production release readiness    = NOT READY; policy, legal, external, operations, deployment, and provider gates remain open
~~~

The historical recommended next action was **P0 POLICY / OPERATIONS DECISION
CHECKPOINT**. The current implementation/readiness campaign is recorded in
`NATALNODE_P0_LAUNCH_READINESS_V1.md`; its final classification is
`P0_MULTIPLE_EXTERNAL_GATES`. No new campaign is started automatically by this
historical checkpoint.

## 12. Post-checkpoint new scope: Notification Platform / Subscription Foundation

After `WEB-P0-READY-003`, the product owner introduced the new
**Notification Platform / Subscription Foundation** capability for future
proactive notification features. This is new scope, not a retroactive P0
implementation gap, and it does not reopen the checkpoint conclusion that no
safe unblocked local P0 gap was identified for the previously frozen scope.
Current launch status is instead maintained by
`NATALNODE_P0_LAUNCH_READINESS_V1.md`.

`WEB-NOTIFY-001A` freezes the provider-neutral technical contract at
`docs/product/NATALNODE_NOTIFICATION_PLATFORM_V1.md`. The bounded
`WEB-NOTIFY-001B1` implementation provides typed notification domain
primitives, owner-scoped preferences, and PushSubscription persistence.
`WEB-NOTIFY-001B2` now provides only the authenticated Consumer Web Push /
preference API and privacy-safe Account Export metadata. No service worker,
VAPID credential, worker, scheduler, subscription/payment logic, provider, or
dependency is introduced; `WEB-NOTIFY-001B3` remains **NOT STARTED**.

The historical P0 decision task `WEB-P0-POLICY-001A` remains **NOT EXECUTED /
DEFERRED**. It is not recreated or executed here; its additional policy and
external decision inputs are evaluated only after the notification foundation
is understood.
