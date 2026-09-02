# NatalNode P0 Launch Readiness V1

- **Status:** `HISTORICAL WEB-P0-001 LOCAL READINESS CONSOLIDATION / SUPERSEDED FOR CURRENT EXTERNAL GATE STATUS`
- **Task:** `WEB-P0-001`
- **Starting baseline:** `8aa89a72cd9082ee4c532cb264a95dff094bcd40`
- **Starting message:** `docs: reconcile Web product roadmap after Practitioner V1`
- **Date:** 2026-09-01
- **Scope:** P0 Web launch-readiness closure and production-gate consolidation
- **Deployment:** `PAUSED`
- **Production astronomy/provider:** `PROVIDER DECISION DEFERRED`

This document is the historical local-readiness consolidation for the
`WEB-P0-001` campaign. It records repository evidence, closes safe local
readiness gaps, and separates the gates known at that earlier baseline. The
current external-gate register and Product Owner decision package are in
[`NATALNODE_P0_EXTERNAL_GATE_DECISION_PACK_V1.md`](./NATALNODE_P0_EXTERNAL_GATE_DECISION_PACK_V1.md)
for `WEB-P0-002A`. Neither document authorizes a production launch, selects a
provider, or reopens a closed product track.

The fixed boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
    -> Production astronomy provider
```

The Web repository does not access or contain the Engine's scientific
implementation. `C:\NatalNode` is outside this campaign and was not accessed.
If provider selection becomes relevant, the decision remains exactly:

`PROVIDER DECISION DEFERRED`

## Current successor amendment — WEB-P0-002B

The historical `WEB-P0-001` consolidation is superseded for current status by
the external-gate decision pack and the
[`NATALNODE_P0_NON_SCIENTIFIC_CLOSURE_V1.md`](./NATALNODE_P0_NON_SCIENTIFIC_CLOSURE_V1.md)
successor record. `WEB-P0-002B` is complete for the authorized local,
provider-independent, non-scientific closure boundary. It does not claim live
staging, production credentials, legal approval, managed backup/restore,
durable observability, distributed rate-limit provisioning, or scientific
authority. Overall P0 production remains `NOT READY`; `WEB-P0-002C` has not
started.

## 1. Campaign outcome

The repository is locally ready for the bounded P0 implementation and
configuration work covered here, but it is not production-release-ready. The
remaining gates are not one missing feature: they are a combined owner-policy,
legal, production-operations, external-processor, and scientific-provider
package.

The campaign closed these locally resolvable items:

1. Community's already-frozen retention predicates now have a short-lived
   server maintenance boundary and executable entrypoint, matching the
   existing Auth and Practitioner maintenance pattern.
2. HTTPS public origins now fail configuration parsing when the session cookie
   is not configured as `Secure`; local loopback HTTP remains supported.
3. The pre-existing Account Export regression was identified as a stale test
   selector and corrected to scope the matcher to the export form. Product
   behavior was unchanged.
4. The retention registry, scheduler contract, backup/restore contract,
   processor registry, legal-input package, owner decision package, and
   deterministic readiness matrix are consolidated here.

No new user-facing feature, provider, scheduler vendor, billing integration,
staff authority, retention duration, RPO, RTO, or scientific implementation was
introduced.

## 2. Verified product state preserved

The following states remain authoritative and were not reopened as feature
tracks:

| Product track | Verified state | Launch-readiness interpretation |
| --- | --- | --- |
| Foundations Core | `COMPLETED`; `12 x 7 = 84/84` | No new course implementation is part of this campaign. |
| Foundations assessments | `7/7 AVAILABLE` | No new assessment behavior is part of this campaign. |
| Foundations Reward V1 | `COMPLETE` | Existing grant/entitlement behavior is not billing. |
| Private Feedback MVP | `COMPLETED_WITH_EXTERNAL_GATE` | Retention, access authorization, audit, and operations remain gated. |
| Community / Questions V1 | `COMPLETED_WITH_EXTERNAL_GATE` | Local implementation remains closed; production operations and legal wording remain gated. |
| Practitioner / Contributor V1 | `COMPLETED_WITH_EXTERNAL_GATE` | Local implementation remains closed; reviewer operations, disclosure, retention scheduling, and production controls remain gated. |
| Notification Platform foundation | Locally present; live delivery deferred | No current P0 flow requires forced production Web Push delivery. |

Public Sky and Current Transits remain outside this P0 closure. Current
Transits is P1. No Learn, Community, Practitioner, Commercial, AI, social,
marketplace, astronomy, or notification feature expansion was performed.

## 3. Classification vocabulary

Every readiness requirement in the matrix uses exactly one of these
classifications in its `BLOCKER_TYPE` column:

| Classification | Meaning in this document |
| --- | --- |
| `LOCAL_IMPLEMENTATION` | Safe repository code or a provider-neutral executable boundary was required and added or remains the explicitly bounded local work item. |
| `LOCAL_CONFIGURATION` | The repository can validate or represent the configuration without containing a secret or environment-specific deployment fact. |
| `OWNER_POLICY` | Product Owner, Privacy Owner, Security Owner, or an authorized policy decision is required; no value is invented here. |
| `LEGAL_COUNSEL` | Counsel review or jurisdiction-specific public/legal language is required. |
| `PRODUCTION_OPERATIONS` | Deployment, database, scheduler, backup, secrets, edge, monitoring, or live-environment work is required. |
| `EXTERNAL_PROCESSOR` | A processor or externally managed capability must be selected, contracted, configured, or verified. |
| `PROVIDER_SCIENTIFIC` | Engine, resolver, timezone, astronomy rights, scientific configuration, provenance, or production provider authority is unresolved. |
| `ALREADY_COMPLETE` | The bounded local implementation or contract is already complete for the stated scope; remaining live verification is recorded separately. |
| `NOT_P0` | The item is intentionally outside this P0 launch-readiness campaign. |

These labels do not convert an external gate into an application defect. A
local implementation can be complete while its live deployment remains
unverified.

## 4. Deterministic P0 launch-readiness matrix

| DOMAIN | LOCAL_STATE | PRODUCTION_REQUIREMENT | OWNER | BLOCKER_TYPE | EVIDENCE | NEXT_ACTION |
| --- | --- | --- | --- | --- | --- | --- |
| Web build | Astro application and current frontend check/build boundary are present; no new product surface was added. | Build the approved static artifact in the target environment and publish it behind the one-origin edge. | DEPLOYMENT_OPERATOR | `ALREADY_COMPLETE` | `apps/web/package.json`; `apps/web/astro.config.mjs`; validation recorded by this campaign. | Run the approved release build in the release environment and retain artifact evidence. |
| Server build | TypeScript server source and build configuration are present; new Community maintenance source compiles. | Build the exact release artifact with production configuration and dependency lockfile. | DEPLOYMENT_OPERATOR | `ALREADY_COMPLETE` | `server/tsconfig.build.json`; `server/src/`; `npm run check --workspace=server` passed during this campaign. | Run the release build as part of deployment preparation. |
| DB migration | Migrations through `0019_practitioner_contributor_v1.sql` are repository history; no migration was changed or added by this campaign. | Provision the authoritative production PostgreSQL database, apply migrations in order, and record schema/version evidence. | DATABASE_OPERATOR | `PRODUCTION_OPERATIONS` | `server/db/migrations/0001_*.sql` through `0019_*.sql`; migration executable under `server/src/runtime/postgres/migrations/`. | Apply and verify in the target environment; do not create `0020` from this document. |
| Auth | Email Magic Link, sessions, owner erasure, bounded lifecycle cleanup, Google local boundary, and fail-closed errors exist locally. | Configure a real HTTPS origin, email sender/processor, session policy, secret material, and live acceptance; Google remains a separate live gate. | AUTH_OWNER / DEPLOYMENT_OPERATOR | `PRODUCTION_OPERATIONS` | `server/src/auth-runtime/`; `server/src/maintenance/auth-lifecycle-maintenance.ts`; `server/src/runtime/environment/parse-server-environment.ts`. | Configure and exercise only after policy, privacy, legal, and environment approval. |
| OAuth | Google OIDC start/callback and collision-safe account/session boundary are local code; no live credentials are stored. | Approve Google processor/privacy disclosure, create client credentials, configure exact redirect/origin/domain values, and run live OIDC verification. | AUTH_OWNER / PRIVACY_OWNER | `EXTERNAL_PROCESSOR` | `server/src/app/routes/google-auth.ts`; `server/src/auth-runtime/google-oidc-provider.ts`; `docs/product/NATALNODE_GOOGLE_SIGN_IN_V1.md`. | Keep live OAuth externally gated until credentials, disclosure, HTTPS, and acceptance exist. |
| Email | Resend adapter and bounded auth-email contract exist; credentials are required at runtime and absent from the repository. | Verify sender/domain, processor terms, delivery behavior, bounce/failure handling, and secret rotation in the chosen environment. | DEPLOYMENT_OPERATOR / PRIVACY_OWNER | `EXTERNAL_PROCESSOR` | `server/src/runtime/email/resend/`; `server/src/executable/executable-server-config.ts`; `docs/adr/WEB-AUTH-002A-email-magic-link-delivery.md`. | Configure Resend only in an approved environment and record processor evidence. |
| Database | PostgreSQL repositories, transactions, foreign keys, retention queries, and account erasure graph are present. | Use encrypted transport/storage, least-privilege roles, backups, restore controls, monitoring, and target-region configuration. | DATABASE_OPERATOR | `PRODUCTION_OPERATIONS` | `server/src/runtime/postgres/`; `server/db/migrations/`; account erasure and repository tests. | Freeze production role, backup, region, and restore procedures before launch. |
| Backup | No provider-specific backup command or secret is in the repository. | Create encrypted backups/snapshots, define access, retention, restore verification, and erasure reconciliation. | DATABASE_OPERATOR / DEPLOYMENT_OPERATOR | `PRODUCTION_OPERATIONS` | This contract, §11; deployment ADRs intentionally do not establish production backup evidence. | Implement and evidence the provider-neutral controls in the target environment. |
| Restore | No live restore exercise is claimed; repository code cannot make an old backup privacy-safe by itself. | Restore into isolation, reconcile deletions/purges/holds before serving, verify schema/app compatibility, and record outcome. | DATABASE_OPERATOR / PRIVACY_OWNER | `PRODUCTION_OPERATIONS` | This contract, §12; active account erasure has no durable deletion ledger in the repository. | Establish an operational reconciliation record and run a restore test before launch. |
| Retention executable boundary | Auth, Community, and Practitioner cleanup boundaries are represented by bounded repository entrypoints with generic JSONL outcomes; no scheduler is activated here. | Build and deploy the approved maintenance artifact before any production schedule is bound. | DEPLOYMENT_OPERATOR | `LOCAL_IMPLEMENTATION` | `server/src/executable/*retention*`; `server/src/maintenance/`; targeted maintenance tests passed during this campaign. | Retain the executable boundary and verify it in the target environment. |
| Retention | Auth and Practitioner maintenance exist; Community maintenance was added for frozen Community predicates. Unresolved policy classes remain fail-closed. | Schedule and monitor the commands; approve unresolved retention, exception, backup, log, and processor treatment. | PRIVACY_OWNER / DEPLOYMENT_OPERATOR | `OWNER_POLICY` | `server/src/maintenance/`; `server/src/executable/*retention*`; §6 and §7. | Approve values/owners, then bind single-flight operations scheduling. |
| Privacy audit | Typed append-only PostgreSQL audit core exists; no privileged data-access surface or reviewer workflow is implemented. | Approve staff authority, integrate audit events at approved privileged surfaces, set retention/access review, and verify operations. | PRIVACY_OWNER / SECURITY_OWNER | `OWNER_POLICY` | `server/src/persistence/privacy-access-audit-repository.ts`; migration `0006_privacy_access_audit.sql`; `docs/product/NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md`. | Decide smallest approved capability and event integration scope; do not create staff authority implicitly. |
| Erasure | Current active PostgreSQL account graph covers Auth/Vault/notes/Feedback, Foundations, Reward/commercial authority, notifications, Community anonymization, and Practitioner anonymization/retention behavior. | Verify live database cascades/triggers and reconcile backups, infrastructure logs, processors, audit records, and user-held exports. | PRIVACY_OWNER / DATABASE_OPERATOR | `PRODUCTION_OPERATIONS` | `server/src/persistence/postgres/postgres-account-erasure-repository.ts`; migrations `0017`–`0019`; `apps/web/src/features/account/account-deletion.ts`. | Execute a target-environment erasure drill and document external residual handling. |
| Export | Account export schema `1.2`, snapshot/stream boundary, safe notification metadata, Feedback, and Practitioner presentation exist locally. | Verify live snapshot/stream delivery and decide whether additional account-owned domains are legally/product-required in the export. | PRIVACY_OWNER / PRODUCT_OWNER | `OWNER_POLICY` | `server/src/account/account-data-export.ts`; `server/src/persistence/postgres/postgres-account-data-export-repository.ts`; `apps/web/test/account-export.test.mjs`. | Approve any scope amendment before adding Foundations, Community, Reward/commercial, delivery history, or audit data. |
| Feedback | Private authenticated create-only MVP remains locally complete. | Define retention, authorized internal access, audit event integration, erasure/export treatment, and operational review path. | PRODUCT_OWNER / PRIVACY_OWNER | `OWNER_POLICY` | `server/src/app/routes/feedback.ts`; `docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md`; §9. | Resolve the Feedback decision package without adding ticketing, reply, assignment, or SLA behavior. |
| Community | Questions/Answers, moderation roles, hold-aware purge query, and new maintenance entrypoint are present. | Verify production role/rate-limit operation, legal UGC wording, retention scheduling, and live DB behavior. | COMMUNITY_OWNER / LEGAL_COUNSEL / DEPLOYMENT_OPERATOR | `LEGAL_COUNSEL` | `server/src/community/`; `server/src/maintenance/community-retention-maintenance.ts`; §6. | Complete legal/operations gates; do not reopen Community features. |
| Practitioner | Profile/application/review implementation and hold-aware maintenance are present. | Verify reviewer operations/grants, identity/disclosure language, scheduling, and production distributed limits. | REVIEW_OPERATIONS / LEGAL_COUNSEL / DEPLOYMENT_OPERATOR | `LEGAL_COUNSEL` | `server/src/practitioner/`; `server/src/maintenance/practitioner-retention-maintenance.ts`; `docs/product/NATALNODE_PRACTITIONER_CONTRIBUTOR_V1.md`. | Approve disclosure and reviewer operations; do not expand the product surface. |
| Commercial | FREE/PRO entitlement and local grant/referral primitives exist; no live billing or payment provider exists. | Product Owner must select the exact P0 mode and, only for purchasable PRO, separately approve billing/provider/legal implementation. | PRODUCT_OWNER | `OWNER_POLICY` | `server/src/commercial-persistence/`; `server/db/migrations/0011`–`0016`; `docs/product/NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md`. | Choose A, B, or C in §14; do not imply PRO can be purchased before a dedicated track. |
| Observability | One bounded completion record is emitted; payloads and sensitive chart/account content are excluded. | Select/configure restricted encrypted sink, retention, region, alerts, access review, and failure handling. | SECURITY_OWNER / DEPLOYMENT_OPERATOR | `PRODUCTION_OPERATIONS` | `server/src/app/observability/api-request-observability.ts`; `server/src/app/observability/calculation-observability.ts`; §13. | Configure a sink and operational alerting without adding analytics or raw request logging. |
| Rate limiting | Process-local bounded fixed-window limiter covers current P0 mutation surfaces and uses HMAC-derived keys. | Multi-replica production requires a shared atomic enforcement/store boundary; provider and limits must be approved and operationally monitored. | SECURITY_OWNER / DEPLOYMENT_OPERATOR | `PRODUCTION_OPERATIONS` | `server/src/app/security/api-rate-limiting.ts`; `docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md`; §15. | Select a compatible store/capability and verify edge identity trust; do not assume process-local state is production distributed protection. |
| Legal | Product-policy facts exist; final `/privacy` and `/terms` copy and jurisdiction-specific commitments are not approved. | Counsel review and approved public copy for privacy, terms, UGC, Practitioner disclosure, rights, retention, and processors. | LEGAL_COUNSEL | `LEGAL_COUNSEL` | `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`; §16. | Supply the legal-input package and publish only approved copy. |
| Engine | Executable server accepts explicit `ENGINE_CLIENT_MODE=development-mock`; the Web BFF/EngineClient boundary is provider-neutral. | Configure and verify production Engine URL/service identity/timeout/retry/schema compatibility/readiness; no scientific implementation belongs here. | ENGINE_OWNER / DEPLOYMENT_OPERATOR | `PROVIDER_SCIENTIFIC` | `server/src/executable/create-executable-server-bindings.ts`; `packages/engine-client/`; `docs/PRD.md`. | Resolve the Engine owner/provider contract in a separate authorized gate; preserve the boundary. |
| Resolver/timezone | Browser development resolver and provider-neutral input contract exist; production location/historical-timezone authority is not selected. | Select lawful production authority, accuracy/provenance policy, failure behavior, and live verification. | ENGINE_OWNER / PRODUCT_OWNER | `PROVIDER_SCIENTIFIC` | `apps/web/src/features/chart-input/development-resolver.ts`; `docs/PRD.md`. | Keep development fixtures isolated; do not add production geocoding/timezone logic here. |
| Astronomy provider | No production astronomy provider or rights decision is selected by Web. | Establish provider rights, scientific configuration, provenance, compatibility, and Engine integration evidence. | ENGINE_OWNER / LEGAL_COUNSEL | `PROVIDER_SCIENTIFIC` | `docs/PRD.md`; current EngineClient boundary; deploy ADRs. | Resolve externally; retain `PROVIDER DECISION DEFERRED` until authorized. |
| Processor inventory | Resend is selected for P0 auth email; Railway is selected for P0 research/staging only; production host, sink, limiter store, backup store, OAuth, and astronomy providers are not selected. | Complete processor/subprocessor contracts, regions, security review, and public disclosure for every selected capability. | PRIVACY_OWNER / LEGAL_COUNSEL / DEPLOYMENT_OPERATOR | `EXTERNAL_PROCESSOR` | §17; `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`; `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`. | Complete registry decisions; do not infer production provider choices from staging. |
| Staging | Provider-neutral local composition and accepted Railway P0 staging topology exist; no live provisioning or E2E is claimed. | Provision isolated staging, configure DNS/TLS/secrets/database/email, apply migrations, and run smoke/E2E acceptance. | DEPLOYMENT_OPERATOR | `PRODUCTION_OPERATIONS` | `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`; `server/src/executable/`. | Execute the separate paused deployment gate only after owner/legal/provider inputs are ready. |
| Production deployment | One-origin topology is accepted; production host/provider is not selected. | Select host/edge, deploy static artifact and API, set rollout/rollback/health checks, and prove same-origin routing. | DEPLOYMENT_OPERATOR | `PRODUCTION_OPERATIONS` | `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`. | Produce a deployment plan and live evidence; no deployment was performed here. |
| Secrets | Parser requires bounded database/auth/origin/host/port values; executable config requires Resend and explicit development mock mode; VAPID secrets are server-only when delivery is enabled. | Provision secret manager, rotation, access, environment separation, and redaction for staging/production. | DEPLOYMENT_OPERATOR / SECURITY_OWNER | `PRODUCTION_OPERATIONS` | `server/src/runtime/environment/`; `server/src/executable/executable-server-config.ts`; §18. | Populate only approved environment secret stores; never commit values. |
| HTTPS configuration validation | Repository environment parsing now rejects an insecure session-cookie setting when the public origin is HTTPS; loopback HTTP remains explicit local configuration. | Preserve this fail-closed configuration rule in staging/production and verify the effective cookie/header behavior at the edge. | SECURITY_OWNER | `LOCAL_CONFIGURATION` | `server/src/runtime/environment/parse-server-environment.ts`; `server/test/migration-environment.test.mjs`. | Keep the parser guard; obtain live deployment evidence separately. |
| HTTPS | HTTPS origins now require `AUTH_SESSION_COOKIE_SECURE=true`; API headers include no-store, no-referrer, nosniff, and frame denial. | Configure DNS/TLS, HSTS/CSP at the deployment edge where approved, certificate renewal, and live cookie/header verification. | DEPLOYMENT_OPERATOR / SECURITY_OWNER | `PRODUCTION_OPERATIONS` | `server/src/runtime/environment/parse-server-environment.ts`; `server/src/app/security/api-security-headers.ts`; staging ADR. | Run an HTTPS smoke test in the target edge; do not add an unreviewed CSP in this campaign. |
| Public Sky / Current Transits | Development fixture/instrument only; Current Transits remains P1. | No P0 launch action. | PRODUCT_OWNER / ENGINE_OWNER | `NOT_P0` | `docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md`; `docs/PRD.md`. | Do not implement in this campaign. |

The matrix is deterministic about what is locally complete and what is not.
The overall classification remains `P0_MULTIPLE_EXTERNAL_GATES` because the
remaining gates span more than one external owner and cannot be resolved by
additional local code alone.

## 5. Retention registry

The registry below is authoritative for the launch-readiness audit. “Policy
required” means no fallback duration is selected. A technical expiry or a
business grant window is not silently converted into a legal retention period.

| Data class | Owner / visibility | Active retention | Post-delete retention | Purge threshold | Hold behavior | Account-erasure interaction | Storage / processor | Actual mechanism | Scheduler |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Users and Auth identities | Auth/account; private | Active account lifetime; no time expiry is frozen | `POLICY REQUIRED` for any residual identity rule | None | No automatic active-account purge | User root deletion cascades identities and sessions | PostgreSQL; no separate processor row | Account erasure transaction | No time scheduler; erasure is user-triggered |
| Auth sessions | Auth/account; private security metadata | Valid only while `expires_at > now`; configured session TTL is validity, not retention | Active row is removed with the user; external copies unresolved | `auth_sessions.expires_at <= now` | No legal/security hold behavior is encoded for expired sessions; operations must not delete active rows | User cascade | PostgreSQL | `maintenance:auth-cleanup` expired-session phase | Operations must schedule; frequency not frozen |
| Expired-unconsumed Email Magic Link challenges | Auth; private | Until source-defined `expires_at` | No separate post-delete duration | `consumed_at IS NULL AND expires_at <= now` | No active challenge may be shortened | Erasure explicitly deletes normalized-email challenge rows | PostgreSQL; email processor records external | `maintenance:auth-cleanup` expired challenge phase | Operations must schedule; frequency not frozen |
| Consumed Email Magic Link challenges | Auth; private | Invalid immediately after committed consumption | `AUTH_CONSUMED_CHALLENGE_RETENTION` is `POLICY REQUIRED` | Consumed-row cleanup predicate exists, activation needs policy | No duration or grace interval invented | Erasure explicitly deletes rows matching owned normalized emails | PostgreSQL; email processor records external | Auth maintenance consumed phase is implemented but policy-gated | Operations must not activate without policy |
| Vault charts | Account-owned; private birth/chart data | No automatic time cleanup; user-directed storage | `POLICY REQUIRED` only if future time cleanup is desired | None | No time purge | `users` cascade removes charts | PostgreSQL | Owner delete and account erasure | No time scheduler |
| Vault notes | Account-owned; private | No automatic time cleanup | `POLICY REQUIRED` if future time cleanup is desired | None | No time purge | User/chart cascades remove notes | PostgreSQL | Owner delete and account erasure | No time scheduler |
| Foundations lesson completions | Account-owned; private progress | No time purge policy | Account erasure via user FK | None | No hold field; preserve append-only semantics | User cascade | PostgreSQL | User-root cascade | No time scheduler |
| Foundations assessment attempts | Account-owned; private learning history | No time purge policy | Account erasure via user FK | None | No hold field; preserve append-only semantics | User cascade | PostgreSQL | User-root cascade | No time scheduler |
| Foundations Reward / commercial grant credits | Account-linked authority; private entitlement state | Existing grant window includes a 7-day reward business rule; this is not a retention policy | No separate residual duration is frozen | Business `ends_at` controls entitlement validity, not deletion | Commercial authority rules; no new hold semantics | Commercial authority and grant rows cascade from account ownership | PostgreSQL | Authority/account cascade; entitlement evaluator reads validity | No retention scheduler |
| Private Feedback | Account-owned; private message | `FEEDBACK_RETENTION` is `POLICY REQUIRED` | Account deletion cascade for active row; external copies unresolved | None | Internal access and legal/security exceptions are not frozen | User FK cascade removes active submission | PostgreSQL; no external processor from route | No standalone purge; account erasure only | No scheduler until policy |
| Community questions and answers | Public UGC with account relationship | Deleted UGC retains bounded metadata/content state for 90 days | Public identity is anonymized on account deletion; retained rows follow frozen rule | `retention_expires_at <= now`, hold `NONE`, and no blocking open report/evidence relation | `LEGAL`, `SECURITY`, and open moderation/report relationships block ordinary purge | Account deletion removes active author link and renders `Deleted User`; public UGC semantics stay frozen | PostgreSQL; no provider-specific UGC processor | `CommunityRepository.purgeExpiredRetention()` in one transaction | `maintenance:community-retention`; frequency not frozen |
| Community reports and moderation evidence | Restricted moderation data; details/notes private | Resolved evidence retains 365 days | Account actor identity is anonymized/set null as schema dictates; evidence rule remains | Resolved/dismissed row eligible at `retention_expires_at <= now`, hold `NONE`; open reports are not purged | `LEGAL`, `SECURITY`, or open report state blocks ordinary purge | User-linked actor fields set null/anonymized; active evidence relationship controls purge | PostgreSQL | Community purge transaction | Same Community maintenance command |
| Practitioner applications | Restricted review data; evidence URLs and application fields | Final rejected/withdrawn/revoked application retention is 365 days | Account deletion anonymizes relationship and applies frozen final-application rule | `purge_eligible_at <= now`, hold `NONE`, with relationship constraints | `LEGAL` and `SECURITY` holds block ordinary purge | User FK is set null; application state/retention semantics remain | PostgreSQL; evidence URLs are not proxied/scraped | `PostgresPractitionerRepository.purgeExpiredRetention()` | `maintenance:practitioner-retention`; frequency not frozen |
| Practitioner profile revisions | Restricted review history; public-profile data plus review state | Historical profile revisions eligible after 90 days | Account deletion preserves only approved public semantics required by contract; identity link is removed | `purge_eligible_at <= now`, hold `NONE`, and dependent review conditions allow | `LEGAL` and `SECURITY` holds block ordinary purge | Submitter identity set null; public profile anonymization is trigger-controlled | PostgreSQL | Practitioner purge transaction | Same Practitioner maintenance command |
| Practitioner review events and profile reports | Restricted moderation/review evidence | Review audit and resolved report evidence use frozen 365-day semantics where `purge_eligible_at` is set | Reviewer/reporter/resolver identity set null where schema requires | Eligible timestamp, hold `NONE`, and dependent application/revision/report conditions | `LEGAL`, `SECURITY`, and open report dependencies block ordinary purge | Identity fields set null; retained evidence remains subject to holds | PostgreSQL | Practitioner purge transaction | Same Practitioner maintenance command |
| Notification preferences and push subscriptions | Account-owned; private | No time purge policy for active preference state; invalid subscription cleanup duration unresolved | User cascade for active rows | None currently selected for preference state | No hold semantics selected | User FK cascade removes rows | PostgreSQL; Web Push transport external when delivery enabled | Account erasure cascade; B4 delivery worker is separate | No retention scheduler currently selected |
| Notification intents/deliveries/outbox | Account-owned operational state; payload must be minimized | `NOTIFICATION_DELIVERY_RETENTION` is `POLICY REQUIRED`; delivery operational history is not silently purged | Account cascade for active rows; external transport copies unresolved | No policy threshold selected | Cancellation/terminal state is domain state, not retention approval | User FK cascade removes current rows | PostgreSQL; browser push service external | Delivery worker state machine; no retention purge command in current P0 | Scheduler/worker retention is external and policy-gated |
| Privacy-access audit events | Restricted security/audit data; no content | `AUDIT_RETENTION_DURATION` is `POLICY REQUIRED` | Account-deletion fate and reconciliation are `POLICY REQUIRED` | No purge mechanism implemented | Security/legal hold behavior needs owner policy | No user FK by intentional design; must not claim cascade | PostgreSQL; sink copies if any are external | Append-only storage core only | No scheduler until policy |
| Account export artifacts | User-owned disclosure; no server archive currently | No persisted artifact exists; future `EXPORT_ARTIFACT_RETENTION` is policy-gated | Browser-held file is outside application control | None | No server artifact hold | No server artifact to erase | Streamed from PostgreSQL; browser storage external to app | Two-stage stream, no export row/job/archive | No scheduler |
| Application observability logs | Operational; bounded metadata, not user content | `OBSERVABILITY_RETENTION` is `POLICY REQUIRED` | Erasure is not synchronous in downstream log systems | External sink/platform threshold unresolved | Incident hold/exception policy required | Not an active DB participant; no erasure claim | stdout/stderr then deployment sink | One bounded completion record per API request | Operations-owned sink policy |
| Infrastructure/security logs | Operational; provider-controlled | `INFRASTRUCTURE_LOG_RETENTION` is external/policy required | External provider behavior unresolved | Provider configuration threshold unresolved | Incident/legal hold required | Not controlled by account transaction | Hosting/edge/database processors, provider unresolved | No repository-controlled mechanism | Operations-owned |
| PostgreSQL backups/snapshots | Operations; may contain account data | `BACKUP_RETENTION` is external/policy required | Restore reconciliation required before serving | Provider snapshot policy unresolved | Backup/legal/security hold policy required | Active deletion does not physically erase historical copies automatically | External backup capability; provider unresolved | No repository-controlled mechanism | Operations-owned |
| Resend records | Processor-held auth email data | `EMAIL_PROCESSOR_RETENTION` is external/processor policy required | No verified synchronous provider deletion | Processor policy threshold unresolved | Processor/legal hold policy required | App erasure does not claim Resend deletion | Resend selected for P0 auth email | Provider request only; no app-side archive | Processor/operations-owned |

The frozen numeric values are only those already present in product/runtime
contracts: Community deleted UGC `90 days`, Community resolved evidence `365
days`, Practitioner profile history `90 days`, Practitioner final application
data `365 days`, and Practitioner review audit `365 days`. The 7-day reward
grant is an entitlement business window and is intentionally not listed as a
retention duration.

## 6. Retention execution and scheduler contract

### 6.1 Executable inventory

| Command | Scope | Status | Result contract | Required environment |
| --- | --- | --- | --- | --- |
| `npm run maintenance:auth-cleanup --workspace=server` | Expired sessions, expired unconsumed challenges, and a separately policy-gated consumed-challenge phase | Locally implemented | Bounded JSON result; no row IDs, emails, tokens, or content; generic failure codes | `DATABASE_URL`, `DATABASE_SSL_ENABLED`, pool settings as applicable, and valid server environment |
| `npm run maintenance:community-retention --workspace=server` | Frozen Community deleted-content and moderation-evidence predicates | Added in `WEB-P0-001` | One short-lived transaction, counts only, generic JSONL success/error, no private content | Same PostgreSQL server environment |
| `npm run maintenance:practitioner-retention --workspace=server` | Frozen Practitioner application/revision/review/report predicates | Locally implemented before this campaign | One short-lived transaction, counts only, generic JSONL success/error, no evidence URLs/notes | Same PostgreSQL server environment |

The Community command uses the server clock, normalizes the timestamp through
the existing domain boundary, calls only `CommunityRepository`'s frozen purge
operation, and closes the PostgreSQL runtime even on a failure. It does not
accept account selectors or calculate retention dates from request input.

### 6.2 Operations contract

- **Invocation:** one process invocation per command; no browser route and no
  user request depends on successful background cleanup for authorization.
- **Minimum frequency:** Operations must set and evidence the minimum
  frequency before launch. This repository does not freeze a numeric cadence.
  An at-least-daily target for expired/retention jobs is a recommendation only,
  not an approved policy value.
- **Concurrency:** the scheduler should enforce single-flight per environment.
  The repository operations are predicate-based and intended to be idempotent,
  but this command does not provide a distributed scheduler lock.
- **Batching:** Auth and Practitioner existing repository boundaries remain
  bounded. Community purge runs its existing short transaction and reports
  counts; no unbounded scan or content export is introduced.
- **Failure:** non-zero exit with generic JSONL on stderr; never expose database
  details, record IDs, email addresses, content, URLs, or secrets.
- **Retry:** Operations may retry a failed invocation after the underlying
  configuration/database problem is corrected. Predicate-based eligible rows
  may be encountered again safely.
- **Observability:** capture command success/failure, duration, bounded counts
  where approved, and generic failure phase. Do not add raw SQL, row payloads,
  or private identifiers to logs.
- **Dry run:** no dry-run mode is implemented. Do not represent a dry run as
  an available safety control.
- **Policy gate:** the consumed-challenge phase, Feedback, audit, logs,
  backups, processors, and notification delivery history do not receive
  invented purge values from this contract.

## 7. Privacy-access audit and authorization

The typed append-only audit storage core is locally implemented. It is not
evidence that privileged access is currently authorized or that a privileged
surface exists.

### 7.1 Capability decision

| Domain | Current capability | What may be accessed | Audit status | Decision |
| --- | --- | --- | --- | --- |
| Account self-service export/erasure | Authenticated account owner | Own account data or own erasure request | These are owner operations, not privileged staff-audit events | No new staff capability required by this campaign |
| Community moderation | `COMMUNITY_MODERATOR` | Community reports, moderation notes, and moderation actions within the frozen Community contract | Current core does not automatically emit privacy-access events for these operations | Keep capability; decide/integrate audit events before claiming P0 privileged accountability |
| Practitioner review | `PRACTITIONER_REVIEWER` | Practitioner applications, evidence URLs, profile revisions, reports, and review notes within the frozen review contract | Current core does not automatically emit privacy-access events for these operations | Keep capability; decide/integrate audit events before claiming P0 privileged accountability |
| Private Feedback | No frozen internal reviewer capability | No current staff/private Feedback read surface exists | No access event exists because no access is authorized | Product Owner/Privacy Owner must decide whether any capability exists; do not create one here |
| Privacy/account operations | No break-glass or support impersonation capability | No current non-owner data access route | No access event exists | Require explicit policy and security design before implementation |

### 7.2 Required event shape when authorized

If a future authorized privileged surface is approved, the event must include
the existing contract's bounded fields: actor type and opaque actor ID,
optional opaque subject account ID, action, resource class, purpose/reason,
timestamp, request ID, and bounded outcome. The event must not include birth
data, chart payloads, Feedback messages, Community bodies, report details,
Practitioner application text, evidence URLs, reviewer/moderator notes,
tokens, OAuth secrets, or raw IP addresses. Access to the audit stream itself
requires a separate least-privilege review policy.

The smallest unresolved authorization decision is: **whether Private Feedback
has any internal reviewer capability at P0, and if so which role, purpose,
approval path, event integration, and retention apply.** Existing Community and
Practitioner capabilities must not be generalized into a new staff role.

## 8. Private Feedback launch gates

Private Feedback remains a completed local MVP. The P0 gates are limited to:

1. approved retention/withdrawal/erasure treatment;
2. approved internal access capability, if any;
3. privacy-access audit integration for that approved access;
4. operational review ownership and access controls; and
5. truthful legal/privacy copy.

No ticketing workflow, status, assignment, reply, email, support SLA, CRM,
review queue, or notification feature was added.

## 9. Account erasure and export coverage

### 9.1 Erasure coverage

The current active PostgreSQL erasure graph is account-rooted at `users` and
covers the current P0 application graph:

- Auth identities, sessions, and user-linked rows are removed through the
  existing root transaction/cascades; Email Magic Link challenge rows are
  explicitly matched by the owned normalized identity because they do not have
  a user foreign key.
- Vault charts and notes are user-owned and cascade.
- Feedback is user-owned and cascades.
- Foundations completions and assessment attempts are user-owned and cascade.
- Reward/commercial authority and grant rows follow their frozen account
  ownership/cascade rules.
- Notification preferences, push subscriptions, intents, and deliveries are
  user-linked and cascade where current migrations define that relationship.
- Community public contributions preserve the frozen anonymization semantics;
  active author identity is detached and public rendering uses the deleted-user
  boundary rather than silently changing Community policy.
- Practitioner profile/application/review relationships use the frozen
  trigger/FK behavior, including identity detachment and retention metadata.
- Privacy-access audit events intentionally have no user FK; their erasure
  fate is an unresolved policy/operations decision and is not falsely claimed
  as cascaded.

External backups, infrastructure logs, Resend records, any future processor
copy, and a file already delivered to a browser are not synchronously erased by
the active PostgreSQL transaction.

### 9.2 Export coverage

The current account export contract/schema `1.2` covers the reviewed account,
current identities, Vault charts, notes, Feedback, privacy-minimized
notification metadata, and Practitioner application/profile/revision
presentations. It excludes session/challenge secrets, reviewer/moderator
identity and notes, push endpoints/keys, raw internal IDs, rate-limit state,
logs, provider records, and other users' data.

The current export does not include Community authored UGC, Foundations
progress or assessment attempts, Reward/commercial state, notification delivery
history, or privacy-access audit events. These are policy/schema decisions, not
silently added in this campaign. Before adding any of them, Product/Privacy
must define safe presentation, related-user handling, internal-field
exclusions, erasure interaction, and a reviewed export schema amendment.

The pre-existing Account Export test failure was a **stale test**: its broad
regular expression began at an earlier Community profile form and later found
the export marker. The matcher now scopes the opening `<form>` to the
`data-account-export-form` attribute. No product behavior or export contract
was changed.

## 10. Observability contract

The current API observability implementation emits one bounded completion
record per API request. The record may contain request ID, method, endpoint
family, HTTP status, duration, bounded Problem Details code, cache status,
Engine result generation, ChartResult contract version, scientific status, and
Engine duration where applicable.

The following are prohibited from application observability: birth date/time/
place, normalized chart requests, ChartResult payloads, interpretation text,
Feedback messages, Community UGC bodies, report details, Practitioner
application text, evidence URLs unless a future explicitly approved bounded
resource-class event requires otherwise, reviewer/moderator notes, auth
tokens, OAuth secrets, raw IP addresses, and unrestricted URLs/query strings.

The event schema is separate from the sink. A production sink, if selected,
must provide:

- least-privilege access and separate operator/security review access;
- encryption in transit and at rest;
- an explicit retention/deletion schedule approved by Privacy/Operations;
- an approved region and processor/subprocessor treatment;
- alerting for server failures, auth failures, rate-limit events, database
  failures, provider failures, and retention-job failures without logging
  sensitive payloads; and
- redaction and access-review evidence.

No observability vendor is selected by this document.

## 11. Backup contract

The production backup contract is provider-neutral because production hosting
and database provider are not selected here.

- The active production PostgreSQL database is the authoritative live source.
- Backups must cover the active database state required to restore the P0
  application, including schema and account-owned rows, subject to approved
  encryption and access policy.
- Backup creation, storage, transport, key ownership, operator access,
  expiration, and incident holds must be controlled by Operations.
- Backups must be encrypted at rest and in transit, isolated by environment,
  and inaccessible to the ordinary application runtime role.
- A backup is not evidence that account deletion, privacy erasure, UGC purge,
  or retention expiry has been physically applied to historical copies.
- RPO, RTO, backup retention, backup region, and restore-test cadence are not
  frozen in the repository. They require an owner/operations decision.

## 12. Restore and erasure reconciliation contract

An older restore must not permanently resurrect data that the current system
has already deleted, anonymized, privacy-erased, or hard-purged.

The required provider-neutral sequence is:

1. Restore into an isolated, non-serving environment.
2. Verify migration/schema compatibility and block public traffic.
3. Obtain the current authoritative account-erasure, privacy-erasure,
   Community/Practitioner purge, and hold state needed for reconciliation.
4. Apply deterministic deletion/anonymization/suppression to the restored copy
   before it can become serving state.
5. Re-run account ownership, public identity, retention-hold, and no-resurrection
   checks, then record the operator/privacy approval.
6. Keep the restored environment quarantined if the reconciliation input is
   unavailable or ambiguous.

The repository currently has no durable deletion ledger that independently
captures every post-backup erasure/purge event. Therefore an operations design
must preserve the reconciliation input outside the backup or use the current
authoritative system as the source for a verified restore reconciliation. The
application must not claim that restoring a PostgreSQL backup automatically
satisfies privacy deletion.

## 13. Database authority and grants

The current runtime uses the configured PostgreSQL connection and does not
embed production passwords or role grants. Production must separate:

| Role | Required authority |
| --- | --- |
| Application runtime | DML required by active request paths; no schema DDL and no migration ownership. |
| Migration operator | DDL/migration authority only during controlled migration execution; not exposed to ordinary request handling. |
| Maintenance operator | Narrow DML required for the approved cleanup commands; no general application or human-admin authority. |
| Human/operator | Provider/database administrative access only through approved, audited, least-privilege procedures. |

Exact role names, credentials, network policies, grants, region, and rotation
are deployment-specific Operations work. No grant SQL or secret was invented
in this campaign.

## 14. Commercial launch decision package

### Current facts

- FREE/PRO semantics, entitlement evaluation, commercial authority, referral,
  promotional and Foundations Reward primitives exist locally.
- The 7-day Reward grant window is a business entitlement period, not a
  retention schedule.
- No payment checkout, subscription billing, payment processor, price, tax,
  refund, cancellation, or chargeback implementation exists.
- Existing commercial migrations `0011`–`0016` are current repository history;
  no migration is changed here.

### Decision required

The Product Owner must choose one P0 launch mode:

| Option | Meaning | Consequence | Recommended default | What it blocks |
| --- | --- | --- | --- | --- |
| A | FREE only | Hide or defer any PRO purchase/activation claim; simplest truthful launch. | Safest if launch scope is not yet commercial. | PRO messaging and any PRO-only launch claim. |
| B | FREE plus non-purchasable PRO architecture | Preserve entitlement-aware code and approved internal grants, but do not sell PRO. | Recommended technical default until billing is separately approved. | Purchasable PRO, pricing, checkout, and payment claims. |
| C | Purchasable PRO | Requires a separate billing/provider/security/legal implementation and live processor verification. | Not recommended without a dedicated approved track. | P0 launch until complete. |

No option is silently selected by this document. Current status is
**commercial mode unresolved; billing is not launch-ready**.

## 15. Rate-limit production contract

The current limiter is an in-memory fixed-window implementation with bounded
key capacity and HMAC-derived client identities. It covers the current Auth,
Chart, Feedback, Account, Notification, Community, Practitioner, and Vault
mutation surfaces through the established middleware boundary.

It is appropriate for local/P0 staging protection, not distributed production
enforcement. A multi-replica deployment requires a shared atomic capability
that:

- receives only the trusted edge identity boundary, not arbitrary browser IP
  headers;
- supports atomic increment/check/expiry behavior across replicas;
- has bounded key/cardinality behavior and failure policy;
- does not store raw birth/chart/Feedback/UGC content;
- provides operator metrics and abuse alerts without raw sensitive values; and
- has a selected processor, region, encryption, access, retention, and outage
  decision.

No Redis, vendor, or replacement store is selected here. Production
multi-replica enforcement is a `PRODUCTION_OPERATIONS` gate.

## 16. Legal/counsel input package

The repository contains product policy, not legal advice or final public copy.
Before publishing or claiming launch readiness, Owner/Legal must provide or
approve:

- legal entity/controller identity and registered or notice address;
- privacy contact and monitored rights-request channel;
- target launch jurisdictions and governing law;
- minimum-age/age-gating position;
- data-rights language and response process;
- active and post-delete retention statements, including backups, logs,
  processors, holds, and Community/Practitioner records;
- processor/subprocessor list, role, region, transfer basis, and contract
  status;
- Community UGC license, moderation, complaint, removal, and attribution
  language;
- Practitioner professional-identity, profile consent, evidence, disclosure,
  and non-endorsement language;
- Feedback and internal-access disclosure;
- commercial, entitlement, refund, and billing language if Option C is chosen;
  and
- any required DPO, representative, consumer notice, or sector-specific input.

No jurisdiction, entity, address, age threshold, or legal conclusion is
invented here.

## 17. Processor decision registry

| Capability | Required capability | Selected provider | Current status | Legal review |
| --- | --- | --- | --- | --- |
| P0 auth email | Transactional email delivery for Magic Link | Resend | Selected for P0 technical boundary; live configuration and terms unverified | Required |
| P0 staging hosting/edge | Isolated single-origin staging edge/API/static composition | Railway selected for P0 research/staging only; Caddy/private edge composition remains deployment work | Not provisioned or live-verified | Required |
| PostgreSQL production | Durable encrypted relational storage | Not selected | Required capability; production host/region/provider unresolved | Required |
| Production hosting/edge | Static artifact, API routing, TLS, health/rollout | Not selected | Required capability; production host unresolved | Required |
| Google OAuth | OIDC authorization-code processor | Google is present only as a local code boundary; live product processor/configuration not approved here | External-gated | Required |
| Observability sink | Restricted encrypted operational log storage/alerting | Not selected | Required capability; sink/region/retention unresolved | Required |
| Distributed rate-limit store | Shared atomic multi-replica abuse control | Not selected | Required for production multi-replica deployment | Required |
| Backup storage | Encrypted backup/snapshot retention and restore | Not selected | Required capability; provider and region unresolved | Required |
| Web Push transport | Browser push delivery when notification delivery is enabled | Browser push service is an external transport; no provider-specific replacement selected | Not required for current P0 feature flow; live delivery deferred | Required if enabled |
| Production astronomy | Scientific calculation authority and rights | Not selected | Deferred; must remain provider-neutral | Required |
| Production resolver/timezone | Lawful location and historical-timezone authority | Not selected | Development fixture only | Required |
| Payment/subscription | Purchasable PRO billing | Not selected | Not required for FREE or non-purchasable PRO mode | Required if Option C |

The registry distinguishes a selected P0 staging provider from a production
provider. It does not imply that Railway is production hosting or that Google,
Web Push, or any astronomy provider is approved for live use.

## 18. Environment and secret inventory

Values below are names and classes only. No secret value is committed.

| Variable / class | Classification | Local/test use | Staging/production requirement |
| --- | --- | --- | --- |
| `DATABASE_URL` | `DATABASE` / `SECRET` | Test/local database connection as configured outside source | Secret-manager value, TLS/role/region/backup policy, rotation |
| `DATABASE_SSL_ENABLED` | `DATABASE` / `LOCAL_CONFIGURATION` | Strict boolean parser | Must be true where deployment requires encrypted DB transport |
| `DATABASE_POOL_MAX`, `DATABASE_IDLE_TIMEOUT_MS`, `DATABASE_CONNECTION_TIMEOUT_MS` | `DATABASE` / `LOCAL_CONFIGURATION` | Optional bounded pool settings | Capacity reviewed against deployment and export/maintenance workload |
| `PUBLIC_WEB_ORIGIN` | `PUBLIC_CONFIG` / `DEPLOYMENT` | Loopback HTTP allowed only for explicit local hosts | Exact HTTPS origin; no path/query/fragment; same-origin contract |
| `HOST`, `PORT` | `DEPLOYMENT` | Local listener values | Provider/service listener values; not browser API origin |
| `AUTH_MAGIC_LINK_TTL_SECONDS`, `AUTH_SESSION_TTL_SECONDS` | `AUTH` / `OWNER_POLICY` | Required positive values; validity policy already bounded | Approved policy/configuration; not a physical retention promise |
| `AUTH_SESSION_COOKIE_NAME` | `AUTH` / `LOCAL_CONFIGURATION` | Required cookie name | Approved host-only cookie name and rotation plan |
| `AUTH_SESSION_COOKIE_SECURE` | `AUTH` / `LOCAL_CONFIGURATION` | `false` allowed only for explicit local HTTP; HTTPS now rejects false | Must be `true` for HTTPS public origins |
| `RESEND_API_KEY` | `EMAIL` / `SECRET` / `EXTERNAL_PROCESSOR` | Injected only when delivery is exercised | Secret-manager injection, rotation, sender/domain verification |
| `AUTH_EMAIL_FROM` | `EMAIL` / `PROCESSOR` | Bounded sender config | Verified sender identity and processor policy |
| `ENGINE_CLIENT_MODE` | `ENGINE` / `LOCAL_CONFIGURATION` | Current executable accepts only `development-mock` | Production mode/base URL/service identity contract is unresolved; do not invent value |
| Google OAuth client/configuration | `AUTH` / `SECRET` / `EXTERNAL_PROCESSOR` | No credential in repository | Client ID/secret, redirect/origin/domain configuration and legal approval external |
| `NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY` | `PUBLIC_CONFIG` / `PROCESSOR` | Optional capability boundary | Public capability only when notification delivery is enabled |
| `NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY` | `SECRET` / `PROCESSOR` | Never browser-exposed | Server-only secret manager value; delivery remains deferred |
| `NATALNODE_WEB_PUSH_VAPID_SUBJECT` | `PROCESSOR` / `PUBLIC_CONFIG` | Validated capability input | Approved contact subject if delivery is enabled |
| Distributed rate-limit store credentials | `RATE_LIMIT` / `SECRET` | Not present | Required only for production multi-replica selection; provider unresolved |
| Observability sink credentials | `OBSERVABILITY` / `SECRET` | stdout/stderr local boundary | Restricted sink credentials/region/retention; provider unresolved |
| Backup credentials/keys | `DEPLOYMENT` / `SECRET` | Not present | Operations-owned backup key and access policy; provider unresolved |
| Edge-only upstream routing | `DEPLOYMENT` / `PUBLIC_CONFIG` | Not an application browser secret | Deployment edge may route `/api`; no browser-exposed API origin is added |

There are no browser/build secrets, astronomy artifacts, provider credentials,
or production passwords in this inventory.

## 19. Engine, resolver, and scientific-provider gate package

### What Web is ready to consume

- Same-origin browser requests terminate at the Website API/BFF.
- The BFF depends on `EngineClient`, not an astronomy library.
- The current executable uses `MockEngineClient` only under explicit
  `ENGINE_CLIENT_MODE=development-mock`.
- Stored chart/export/cache boundaries preserve provider-neutral contract
  identities and do not calculate in the browser.
- Public Sky development fixtures and the location/timezone development
  resolver remain isolated from production claims.

### What remains blocked

- Production Engine base URL and service identity.
- Request timeout, retry, health/readiness, and failure semantics for the
  production Engine.
- ChartResult schema compatibility and scientific provenance evidence.
- Production astronomy provider rights and scientific configuration.
- Production location/geocoding and historical-timezone authority.
- Public Sky authority and Current Transits provider/scientific contract.

No Engine URL, provider, astronomy dependency, resolver, timezone service, or
scientific code was added. `PROVIDER DECISION DEFERRED` remains authoritative.

## 20. Notification boundary

The notification platform foundation contains local persistence and delivery
contracts, but infrastructure existence is not product completion. No current
P0 user flow requires live notification delivery for a truthful launch claim.
Therefore this campaign does not configure VAPID credentials, run a worker,
select a push provider, or add a notification center. If a later P0 decision
requires delivery, its processor, retention, scheduler, live-browser, and
privacy gates must be completed separately.

## 21. Owner decision package

The following package is consolidated so decisions are precise rather than
open-ended.

### Decision 1 — Private Feedback retention

- **Current facts:** create-only authenticated rows are stored in PostgreSQL;
  account erasure cascades them; no standalone purge exists.
- **Why required:** the repository cannot choose a purpose-limited or
  support-history duration for potentially sensitive user-submitted content.
- **Options:** (A) retain while needed for the approved product purpose and
  erase on account deletion; (B) approve a bounded post-submission duration
  with hold exceptions; (C) do not retain new Feedback until review policy is
  ready.
- **Consequence:** determines purge mechanism, access workflow, legal copy,
  audit events, and operational ownership.
- **Recommended default:** Product/Privacy approve the shortest purpose-limited
  policy compatible with the MVP; no numeric default is selected here.
- **What it blocks:** truthful public privacy copy and any scheduled Feedback
  purge.

### Decision 2 — Private Feedback internal access

- **Current facts:** no frozen internal reviewer capability or current private
  Feedback read route exists.
- **Why required:** adding staff access would create a new trust boundary.
- **Options:** (A) no internal access at P0; (B) named least-privilege reviewer
  capability with purpose, approval, and audit; (C) a separate support process
  outside the product with documented processor/access controls.
- **Consequence:** determines whether the privacy audit core is integrated at
  Feedback access and which operators can see message content.
- **Recommended default:** A until Product/Privacy/Security explicitly approve
  B or C.
- **What it blocks:** any claim that Feedback has an operational review path.

### Decision 3 — Privacy-access audit authority

- **Current facts:** `COMMUNITY_MODERATOR` and `PRACTITIONER_REVIEWER` are
  already frozen for their respective domains; the durable audit core exists;
  no event integration is claimed.
- **Why required:** an audit record without an approved actor/resource model
  does not authorize access.
- **Options:** (A) integrate only at existing Community/Practitioner
  privileged routes; (B) include an explicitly approved Private Feedback role;
  (C) defer all privileged access and keep only the durable core.
- **Consequence:** determines event volume, retention, access review, and
  launch claims.
- **Recommended default:** A plus C for Feedback until a separate decision.
- **What it blocks:** privileged review launch and audit-complete claims.

### Decision 4 — Commercial launch mode

- **Current facts:** FREE/PRO architecture and Reward grants exist; billing does
  not.
- **Why required:** UI/copy cannot truthfully imply purchasable PRO without a
  billing contract.
- **Options:** A FREE only; B FREE plus non-purchasable PRO architecture; C
  purchasable PRO with a separate billing track.
- **Consequence:** determines public copy, entitlement exposure, legal terms,
  processor inventory, and launch scope.
- **Recommended default:** B technically, or A if Product wants no PRO surface.
- **What it blocks:** any paid conversion or billing claim.

### Decision 5 — Backup RPO/RTO and restore cadence

- **Current facts:** no repository source freezes RPO, RTO, backup retention,
  region, or restore-test cadence.
- **Why required:** production operations need measurable recovery expectations.
- **Options:** approve explicit targets; classify the service as best-effort with
  documented limits; or delay launch until targets exist.
- **Consequence:** determines provider tier, cost, alerting, restore drills,
  and user-facing availability claims.
- **Recommended default:** Operations and Product set values based on real
  service expectations; no number is invented here.
- **What it blocks:** production recovery readiness claim.

### Decision 6 — Observability retention and region

- **Current facts:** application event schema is bounded; sink/provider is not
  selected.
- **Why required:** logs may still contain opaque identifiers and operational
  metadata subject to privacy/access policy.
- **Options:** select an approved regional encrypted sink with a bounded
  schedule; retain only platform-local logs under operations policy; or delay
  production until the sink is approved.
- **Consequence:** determines processor disclosure, incident investigation,
  access review, and erasure residual handling.
- **Recommended default:** shortest operationally sufficient schedule with
  least-privilege access; no numeric value is selected here.
- **What it blocks:** production observability claim and final privacy copy.

### Decision 7 — Production data region and staging requirement

- **Current facts:** Railway is selected only for P0 research/staging; production
  host/region is not selected; staging topology is accepted but not live.
- **Why required:** region affects processor/legal review, latency, backup,
  restore, and operational evidence.
- **Options:** require isolated staging before any production launch; approve a
  documented staging exception; select production/staging regions and providers
  through the deployment/legal process.
- **Consequence:** determines processor registry, contracts, DNS/TLS, and
  environment secrets.
- **Recommended default:** require isolated staging and an explicit production
  region/provider decision before launch.
- **What it blocks:** production deployment and processor sign-off.

## 22. External production-operations package

The following actions are real external work and were not claimed as complete:

1. Choose production host/edge, database provider/region, sink, backup store,
   and distributed limiter capability.
2. Provision isolated staging and production environments with separate
   credentials and access.
3. Configure DNS, TLS, certificate renewal, HTTPS origin, `Secure` cookies,
   edge routing, approved HSTS/CSP policy, and security headers.
4. Populate secret stores and rotation for database, Auth, Resend, OAuth,
   observability, backups, and any later notification/limiter capability.
5. Apply migrations in order and record migration/schema evidence.
6. Configure encrypted backups, restore drills, RPO/RTO, retention, and
   restore/erasure reconciliation.
7. Bind Auth, Community, and Practitioner maintenance commands to a monitored
   single-flight scheduler with an approved cadence.
8. Configure restricted observability sink, alerts, access review, and
   retention.
9. Deploy distributed rate limiting for any multi-replica production topology.
10. Configure Resend and, if approved, Google OAuth with live redirect/origin
    verification.
11. Run live smoke tests for same-origin routing, Auth, erasure, export,
    Community/Practitioner boundaries, security headers, maintenance failures,
    and rollback behavior.

None of these operations has been run or represented as live evidence by this
campaign.

## 23. Internal review

The campaign performed one focused correction cycle after the local gap audit.
Maximum allowed correction cycles for this task were two.

- **BLOCKER:** None found in the local repository after the targeted code/type
  review. This does not remove external launch gates.
- **MAJOR:** Production cannot be claimed without owner/privacy decisions,
  legal inputs, backup/restore reconciliation, scheduler binding, distributed
  rate limiting for multi-replica deployment, production Engine/scientific
  authority, and processor/environment verification. Export completeness for
  Community/Foundations/Reward/delivery/audit data remains a policy decision.
- **MINOR:** Several historical design handoff documents retain their original
  pre-implementation status language. Current-state amendments in this
  campaign point to repository evidence without rewriting their historical
  decision record.
- **EDITORIAL_NOTE:** LOC thresholds in the PRD are heuristic guardrails, not
  lint rules or automatic refactor triggers. The classification vocabulary
  deliberately separates local code readiness from external launch readiness.

## 24. Closed-track protection

Foundations, Feedback, Community, and Practitioner were not reopened. The only
changes touching a closed-track boundary are launch-readiness corrections:
Community gained its missing executable wrapper for already-frozen purge
semantics, and the Account Export test's stale selector was corrected. FREE/PRO
semantics were not changed. No Engine or scientific source was changed.

## 25. Campaign decision

Overall P0 classification:

`P0_MULTIPLE_EXTERNAL_GATES`

The local engineering baseline is complete for the bounded scope of this
campaign. The repository must not be described as production-ready until the
owner-policy, legal, operations, processor, environment, and scientific gates
are separately resolved and evidenced.

Current successor:

`WEB-P0-002A — P0 External Gate Decision Pack`

The successor is decision-and-evidence led: resolve the consolidated
owner/legal/operations/credential/scientific package, then perform only the
environment work authorized by those decisions. `WEB-P0-002B` must not begin
until that package is closed, and it must not become another feature campaign.
