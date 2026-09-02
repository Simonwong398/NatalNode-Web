# NatalNode P0 External Gate Decision Pack V1

- **Status:** `AUTHORITATIVE WEB-P0-002A AUDIT / P0 PRODUCTION NOT READY`
- **Task:** `WEB-P0-002A`
- **Starting baseline:** `9ead48c3053e98d822bbf24dacdc16ff5ee50988`
- **Starting message:** `feat: refine public sky showcase instrument`
- **Audit date:** 2026-09-02
- **Audit mode:** `AUTONOMOUS GOVERNANCE / READINESS AUDIT`
- **Execution model:** `Luna Max`
- **Reasoning:** `MAX`
- **Deployment:** `PAUSED`
- **Production astronomy/provider:** `PROVIDER DECISION DEFERRED`

This is the single current Product Owner decision package for the Web P0
external-gate and production-readiness boundary. It records repository facts,
separates already-closed local work from unresolved launch gates, consolidates
the genuine Product Owner decisions, and defines the smallest safe follow-up
sequence. It does not implement a production gate, select an astronomy
provider, authorize deployment, or begin `WEB-P0-002B`.

## 1. Fixed boundary and audit rules

The system boundary is unchanged:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
    -> production astronomy provider
```

The Web repository does not contain the Engine scientific implementation and
must not access an astronomy provider directly. `C:\NatalNode` is outside this
audit and was not accessed. If provider selection becomes relevant, the only
permitted status is:

`PROVIDER DECISION DEFERRED`

The audit uses these classifications exactly:

| Classification | Meaning in this package |
| --- | --- |
| `PRODUCT_OWNER_DECISION` | A product, policy, launch-mode, or ownership choice requires explicit owner approval. |
| `LEGAL_EXTERNAL` | Legal counsel, public legal copy, processor terms, or jurisdictional evidence is required. |
| `SCIENTIFIC_EXTERNAL` | Engine, scientific configuration, provenance, astronomy authority, or scientific acceptance is external to this repository. |
| `OPERATIONS_EXTERNAL` | Hosting, database, backup, scheduling, observability, moderation, or live operational evidence is missing. |
| `CREDENTIAL_EXTERNAL` | A production secret, verified sender, OAuth project, redirect, or secret-management evidence is missing. |
| `LOCAL_IMPLEMENTATION_GAP` | A repository change is still required, but only after the governing external or Product Owner input is available. |
| `ALREADY_CLOSED` | The bounded local decision or implementation is present; this does not imply live-environment verification. |
| `NOT_P0` | The item is deliberately outside the current P0 launch gate. |

Repository facts are not treated as live-environment evidence. In particular,
an accepted contract, a local mock, a migration, or a maintenance executable
does not prove that production hosting, provider, credentials, backups,
retention, or operational ownership exists.

## 2. Executive decision

```text
P0 local Web implementation baseline       = COMPLETE FOR THE AUDITED BOUNDARY
P0 external launch readiness               = NOT READY
Production astronomy/provider              = PROVIDER DECISION DEFERRED
Deployment                               = PAUSED
Next action                               = resolve this package's decisions/evidence
WEB-P0-002B                               = NOT STARTED
UIQA                                      = CLOSED; DO NOT REOPEN
```

The current repository is suitable for continued local development and a
research-labeled fixture staging path. It is not evidence for a production
public astrology calculation release. The blocking set is cross-cutting:
scientific authority, production Engine connectivity, legal/public-copy
approval, credentials, data/backup policy, operational ownership, staging and
deployment evidence, and final certification remain open.

## 3. Source of truth inspected

The audit reconciled `docs/PRD.md` with the current Web source, accepted ADRs,
product policies, the historical P0 consolidation, and the current Git
baseline. The principal sources were:

- `docs/PRD.md` — system boundary, P0/P1 scope, privacy, Auth, data, observability, deployment, and release gates.
- `docs/ARCHITECTURE.md` — Web/Engine boundary, provider neutrality, and heuristic LOC guardrails.
- `docs/product/NATALNODE_P0_LAUNCH_READINESS_V1.md` — historical `WEB-P0-001` local-readiness consolidation and prior owner decision set.
- `docs/product/NATALNODE_P0_READINESS_CHECKPOINT_V1.md` — historical checkpoint and supersession history.
- `docs/product/NATALNODE_PRODUCT_ROADMAP_V1.md` — current roadmap, feature sequencing, deployment pause, and scientific dependency.
- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md` — legal/public-copy decisions and unresolved policy inputs.
- `docs/product/NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md` — typed audit core and deferred privileged-surface integration.
- `docs/product/NATALNODE_DATA_RETENTION_V1.md` — frozen local predicates and policy-required retention values.
- `docs/product/NATALNODE_OBSERVABILITY_V1.md` — bounded local event contract and external sink/retention/alert gates.
- `docs/product/NATALNODE_GOOGLE_SIGN_IN_V1.md` — local OIDC boundary and live credential/configuration gates.
- `docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md` — provider-neutral Sky direction and Engine ownership.
- `docs/product/NATALNODE_NOTIFICATION_PLATFORM_V1.md` — local notification foundation and explicitly deferred live delivery.
- `docs/product/NATALNODE_SUBSCRIPTION_ENTITLEMENT_REFERRAL_V1.md` — frozen Free/Pro meaning with billing architecture and implementation deferred.
- `docs/product/NATALNODE_COMMUNITY_QUESTIONS_V1.md` and `docs/product/NATALNODE_PRACTITIONER_CONTRIBUTOR_V1.md` — locally complete MVP boundaries and remaining moderation/reviewer gates.
- `docs/product/NATALNODE_FOUNDATIONS_V1.md` and `docs/product/NATALNODE_FOUNDATIONS_ASSESSMENT_REWARD_POLICY_GAPS_V1.md` — completed Foundations and reward boundaries.
- `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md` — accepted same-origin edge/API topology and unselected production host.
- `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md` — accepted Railway research/staging topology; not a deployment execution record.
- `docs/adr/WEB-AUTH-002A-email-magic-link-delivery.md` — accepted Resend technical boundary.
- `docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md` — private Feedback MVP boundary.

Current implementation evidence was inspected in:

- `server/src/executable/executable-server-config.ts` and `server/src/executable/create-executable-server-bindings.ts` — executable configuration and the mock-only Engine binding.
- `server/src/runtime/environment/parse-server-environment.ts` and `server/src/runtime/create-server-runtime-dependencies.ts` — database, origin, cookie, and runtime composition boundaries.
- `server/src/app/create-app.ts`, `server/src/app/routes/sky.ts`, `server/src/app/routes/account.ts`, and `server/src/app/routes/account-export.ts` — BFF route, error, Auth, Sky, erasure, and export surfaces.
- `server/src/app/observability/api-request-observability.ts` and `server/src/app/security/api-rate-limiting.ts` — bounded request records and process-local P0 staging limits.
- `server/src/maintenance/` and the corresponding executable entrypoints — callable Auth, Community, and Practitioner maintenance boundaries without scheduler provisioning.
- `server/src/community/`, `server/src/practitioner/`, and `server/src/persistence/` — role membership, retention predicates, account erasure, export, and PostgreSQL repositories.
- `server/src/runtime/postgres/migrations/0001*` through `0019*` — current migration history; no `0020` was created.
- `packages/engine-client/`, `apps/web/src/lib/engine-client.ts`, `apps/web/src/pages/index.astro`, and the chart/Public Sky features — provider-neutral client boundary and fixture-backed local experience.

## 4. P0 gates already closed locally

The following are closed for their bounded repository scope. “Closed” means
the local boundary is present and protected; it does not convert a mock or
local implementation into production scientific or operational evidence.

| Closed item | Evidence and boundary |
| --- | --- |
| Web/Engine architecture boundary | `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `packages/engine-client/` keep the Web provider-neutral. No astronomy dependency or direct provider access was added. |
| Astro/React/Tailwind and V1.1 visual baseline | The current frontend and the `WEB-P0-UIQA` history provide the accepted responsive Calculate, Chart Workspace, Learn, Tools, and Public Sky presentation baseline. The latest `9ead48c` change is bounded to the public experience/chart instrument. UIQA is not reopened by this audit. |
| Local chart calculation boundary | `MockEngineClient` returns `WEB_UI_FIXTURE_V1` asynchronously and the BFF exposes the fixture-backed local calculation boundary. The fixture is explicitly UI-development/research data, not production astronomy. |
| BFF safety boundary | Hono route composition, same-origin checks, secure headers, Problem Details, request IDs, bounded endpoint families, and cache metadata are present in `server/src/app/`. |
| Auth local tracks | Email Magic Link and Google Sign-In local contracts/flows, session handling, secure-cookie checks, anti-enumeration behavior, account deletion, and account export are implemented locally for their declared contracts. Live sender/OAuth/deployment evidence remains open. |
| Vault and account lifecycle | Owner-scoped Vault chart/note routes, transactional active-database erasure, and privacy-safe export projections exist. External backups, processor records, logs, and live operational claims remain outside the transaction. |
| Foundations and reward | Foundations content is complete at 12 lessons x 7 locales = 84/84; assessment and Reward V1 local boundaries are closed within the frozen Free/Pro semantics. |
| Feedback, Community, Practitioner | Local MVP routes, ownership checks, moderation/reviewer capability predicates, account-erasure interactions, and bounded retention predicates exist. Staffing, grants, legal wording, scheduler, and production rate-limit evidence remain open. |
| Privacy Access Audit core | The typed append-only PostgreSQL audit-event storage core is present. No privileged audit-read surface or complete mandatory hook integration is claimed. |
| Local observability and cache | One bounded API completion record and chart cache identity are present; a production sink, region, retention, access, and alerting policy is not selected. |
| Maintenance predicates and migration history | Auth, Community, and Practitioner one-shot maintenance executables exist; migrations through `0019` are present and no later migration is required or created by this audit. A scheduler and production cadence are not provisioned. |
| Notification foundation | The local notification platform through B4B4 is closed for its own foundation, including local integration acceptance. Live browser/Push Service delivery, production VAPID operation, and notification policy values remain deferred and are not a current P0 launch blocker. |
| Accepted staging decision | Railway/Caddy/private API/managed PostgreSQL is an accepted P0 research/staging topology in `WEB-DEPLOY-002A`. It is not evidence that the environment has been provisioned or publicly accepted. |

## 5. Master external-gate register

Each gate below has one classification. The `repo status` column describes what
is actually in this checkout. `Local unlock` is deliberately conditional; it
does not authorize implementation in `WEB-P0-002A`.

### 5.1 Scientific and production data gates

| ID / subject | Classification | Repo status | Why it matters / launch-blocking | Owner | Options / recommendation | Consequence / local unlock / evidence required |
| --- | --- | --- | --- | --- | --- | --- |
| **G-001 Astronomy provider and scientific authority** | `SCIENTIFIC_EXTERNAL` | Provider-neutral Web code; no approved production provider in this repository. | A production chart must have a real authoritative scientific source. **Blocking: YES** for production astrology. | Engine/Science owner with Product Owner acceptance. | A: keep production science blocked; B: approve an Engine-owned production authority; C: expose fixture/research only. **Recommend A until B has evidence; provider selection remains deferred.** | No production chart claim. Unlocks Engine integration and scientific certification only after approved authority, rights, configuration, and provenance evidence. |
| **G-002 Engine production connectivity** | `SCIENTIFIC_EXTERNAL` | `create-executable-server-bindings.ts` accepts only `development-mock`; `HttpEngineClient` is a client boundary, not a production server binding. | The BFF cannot calculate production charts without an authenticated, compatible Engine Public API. **Blocking: YES.** | Engine/Operations owner. | A: approved private/public Engine API with server-side credentials; B: keep mock/research mode. **Recommend A only after G-001/G-003.** | Production chart routes remain mock-only or unavailable. Unlocks a narrow production binding, readiness check, timeout/retry policy, and contract evidence. |
| **G-003 Scientific configuration and provenance identity** | `SCIENTIFIC_EXTERNAL` | Local fixture/cache identity is `UI_FIXTURE_V1`; no final production scientific configuration/provenance IDs are present. | Users and operators need truthful model/config/provenance identity and cache invalidation. **Blocking: YES.** | Engine/Science owner. | A: final opaque Engine-supplied identities; B: research/incomplete state with explicit label. **Recommend A for production, B for research only.** | No scientific result can be certified as production. Unlocks production cache identity, UI disclosure, observability fields, and contract acceptance after evidence. |
| **G-004 Public Sky production authority** | `SCIENTIFIC_EXTERNAL` | Current Sky is a local fixture-backed showcase and `/api/sky` calls the mock client; the domain policy keeps production science in the Engine. | A live Sky surface must not imply current astronomical truth without Engine authority. **Blocking: CONDITIONAL** on exposing live Sky. | Engine/Science + Product Owner. | A: keep fixture clearly research-labeled; B: expose approved shared-Sky Engine authority; C: hide live Sky until then. **Recommend A or C until B.** | The local showcase may remain non-production. Unlocks production Sky endpoints, cache rules, event authority, and disclosure after scientific evidence. |
| **G-005 Production chart E2E and contract certification** | `SCIENTIFIC_EXTERNAL` | Local fixture/rendering paths exist; no production Engine/provider E2E evidence exists. | The release gate requires a real end-to-end chart path and compatible contract. **Blocking: YES** for full P0. | Engine/Science + Web release owner. | A: certify approved staging then production path; B: release static/research-only Web. **Recommend A before full P0.** | Full Chart and Vault launch cannot be claimed. Unlocks final browser/API/chart contract certification after G-001 to G-003 and deployment evidence. |
| **G-006 Production data region** | `PRODUCT_OWNER_DECISION` | No production region or data-residency choice is recorded; staging ADR leaves the exact Railway region operational. | Region affects privacy, processors, backups, latency, residency, and legal wording. **Blocking: YES** for persistent production accounts. | Product Owner with Legal and Operations. | A: one explicit managed region with approved processors; B: multi-region policy; C: defer persistent production launch. **Recommend A with legal review.** | Unlocks processor/DPA review, DB/backup/observability placement, public disclosures, and deployment configuration. |

### 5.2 Staging, database, backup, and observability gates

| ID / subject | Classification | Repo status | Why it matters / launch-blocking | Owner | Options / recommendation | Consequence / local unlock / evidence required |
| --- | --- | --- | --- | --- | --- | --- |
| **G-007 Staging requirement** | `PRODUCT_OWNER_DECISION` | PRD and accepted deployment ADRs treat isolated staging as the promotion path; no exception is approved. | A research/mock staging environment is needed to exercise Web/BFF/DB/Auth/deployment boundaries before production. **Blocking: YES** for a full production release. | Product Owner + Operations. | A: mandatory isolated non-indexable staging; B: documented exception with reduced launch; C: no production promotion. **Recommend A.** | Unlocks the accepted staging campaign without changing topology; evidence is a provisioned isolated environment and acceptance record. |
| **G-008 Staging topology decision** | `ALREADY_CLOSED` | `WEB-DEPLOY-002A` accepts Railway staging, one HTTPS origin, Caddy edge, private API, Railway PostgreSQL, Resend, and `development-mock`; exact region/provisioning remain open. | Re-deciding the topology would create churn; provisioning is a separate operations task. **Blocking: CONDITIONAL** until staging is required. | Product Owner/Operations for provisioning. | Accepted option is Railway research/staging only. **Recommendation: preserve the ADR and do not reopen it.** | Unlocks deployment composition when explicitly authorized; evidence required is real Railway/Caddy/DNS/TLS/DB acceptance, not this ADR alone. |
| **G-009 Production PostgreSQL configuration** | `OPERATIONS_EXTERNAL` | Runtime parses `DATABASE_URL` and `DATABASE_SSL_ENABLED`; migrations through `0019` exist; no production database is configured. | Account, Vault, Feedback, Community, Practitioner, audit, and retention behavior depend on correctly isolated managed PostgreSQL. **Blocking: YES** for persistent production. | Operations/Database owner. | A: managed private PostgreSQL with strict TLS and least-privilege role; B: approved equivalent managed service; C: no persistent launch. **Recommend A or equivalent.** | Unlocks deployment variables, migration certification, connection/pool checks, and restore testing after G-006. |
| **G-010 Backup RPO** | `PRODUCT_OWNER_DECISION` | No production backup target or RPO value is selected in the repository. | Birth/chart/account data cannot be released with an undefined loss tolerance. **Blocking: YES** for persistent production. | Product Owner + Operations/Privacy. | A: explicit numeric RPO target; B: best-effort/no guarantee with reduced launch; C: defer persistence. **Recommend A; do not invent the number locally.** | Unlocks backup provider/configuration and release wording; evidence is a configured policy and observed backup result. |
| **G-011 Backup RTO** | `PRODUCT_OWNER_DECISION` | No production recovery-time target is selected. | Recovery obligations and incident response depend on an explicit target. **Blocking: YES** for persistent production. | Product Owner + Operations. | A: explicit numeric RTO target; B: best-effort reduced launch; C: defer persistence. **Recommend A; do not invent the number locally.** | Unlocks restore plan, staffing, and certification evidence; no local code can choose the target. |
| **G-012 Restore cadence** | `PRODUCT_OWNER_DECISION` | Retention policy requires backup/restore reconciliation; no cadence or completed production restore drill exists. | Backups without tested restoration do not establish recoverability. **Blocking: YES** for persistent production. | Product Owner + Operations. | A: scheduled restore drills; B: incident-only restore; C: defer persistence. **Recommend A with a prelaunch drill.** | Unlocks scheduler/runbook and evidence capture after G-010/G-011; no migration is changed here. |
| **G-013 Observability provider and region** | `OPERATIONS_EXTERNAL` | Local observability emits one bounded JSON record to stdout/stderr; no durable provider, region, or sink is configured. | Operators need privacy-safe durable request/error visibility in the target environment. **Blocking: YES** for production operations. | Operations/Security. | A: approved encrypted managed sink in the selected region; B: approved self-hosted sink; C: no production launch. **Recommend A or equivalent after G-006.** | Unlocks sink adapter/configuration and live request/error acceptance; provider and region evidence remain external. |
| **G-014 Observability retention** | `PRODUCT_OWNER_DECISION` | The contract marks retention as policy-required; no production duration is chosen. | Retention affects privacy, incident response, and erasure claims. **Blocking: YES** for production operations. | Product Owner + Privacy/Operations. | A: shortest period sufficient for operations; B: longer approved period; C: reduced launch without durable observability. **Recommend A; select an explicit value outside this audit.** | Unlocks sink retention settings, policy copy, and erasure reconciliation; do not infer downstream deletion. |
| **G-015 Alert ownership and escalation** | `PRODUCT_OWNER_DECISION` | No named production on-call, alert queue, response window, or escalation path is recorded. | A live service needs a human owner for failures, abuse, Auth, DB, and scientific incidents. **Blocking: YES** for a full production claim. | Product Owner assigns Operations owner. | A: named owner plus escalation rota; B: founder-only best effort; C: no live production claim. **Recommend A.** | Unlocks alert rules/runbooks and final certification; names and response targets require owner approval. |

### 5.3 Privacy, content operations, and role gates

| ID / subject | Classification | Repo status | Why it matters / launch-blocking | Owner | Options / recommendation | Consequence / local unlock / evidence required |
| --- | --- | --- | --- | --- | --- | --- |
| **G-016 Feedback retention** | `PRODUCT_OWNER_DECISION` | Feedback is authenticated, create-only, stored in PostgreSQL, and removed by active-account erasure; no Feedback TTL is selected and no cleanup job exists. | Stored private messages need an explicit retention and deletion policy before public operation. **Blocking: CONDITIONAL** on launching Feedback. | Product Owner + Privacy. | A: explicit shortest-sufficient retention; B: retain until account erasure/manual policy; C: do not launch Feedback. **Recommend A with legal/privacy review.** | Unlocks retention predicate, maintenance, copy, and export/erasure reconciliation; no duration is invented here. |
| **G-017 Feedback internal access** | `PRODUCT_OWNER_DECISION` | No internal reviewer route or Feedback privileged role exists. | Access to private messages changes privacy risk and audit obligations. **Blocking: CONDITIONAL** on internal review. | Product Owner + Privacy/Security. | A: no P0 staff access; B: named least-privilege support/reviewer role; C: do not launch Feedback. **Recommend A for P0.** | A keeps local create-only MVP bounded; B would unlock an authorized surface only after G-018 and legal/ops evidence. |
| **G-018 Privacy Access Audit authority** | `PRODUCT_OWNER_DECISION` | Typed append-only audit storage exists; Community Moderator and Practitioner Reviewer checks exist; no complete privileged audit-read surface or mandatory hook integration is claimed. | Privileged access to sensitive account, Feedback, Community, or Practitioner data needs an accountable authority and event policy. **Blocking: CONDITIONAL** on privileged operations. | Product Owner + Privacy/Security. | A: existing moderation/reviewer surfaces only, no Feedback access; B: add authorized Feedback/support access; C: defer privileged operations. **Recommend A for P0.** | Unlocks narrowly scoped hook integration and audit-read implementation if B is approved; evidence is role/authority policy plus access tests. |
| **G-019 Community moderation operations** | `OPERATIONS_EXTERNAL` | Local moderation endpoints and repository membership checks exist; no production staffing, queue ownership, SLA, or escalation evidence exists. | Public UGC cannot be responsibly launched without moderation operations. **Blocking: CONDITIONAL** on Community launch. | Operations/Community owner. | A: named moderator owner and queue process; B: staged/deferred Community; C: disable Community. **Recommend A or B according to owner capacity.** | Unlocks live moderation runbook and staging acceptance; no new Community features are needed. |
| **G-020 Practitioner reviewer operations** | `OPERATIONS_EXTERNAL` | Local reviewer predicates, application review, profile controls, and retention holds exist; no production reviewer roster or process evidence exists. | Practitioner disclosures and applications require accountable review. **Blocking: CONDITIONAL** on Practitioner launch. | Operations/Practitioner owner. | A: named reviewer roster/process; B: staged/deferred Practitioner; C: disable Practitioner. **Recommend A only with real capacity.** | Unlocks live reviewer grants and acceptance; no code expansion is implied. |
| **G-021 Moderator/reviewer role grants** | `OPERATIONS_EXTERNAL` | Runtime authorizes by persisted membership (`community_moderators` and `practitioner_reviewers`); no production grant/audit record is present. | Incorrect grants expose sensitive UGC/application data. **Blocking: CONDITIONAL** on those surfaces. | Security/Operations. | A: named least-privilege grants with review/revocation; B: no privileged surfaces; C: defer launch. **Recommend A only after G-019/G-020 and G-018.** | Unlocks controlled production seed/grant procedure and audit evidence; do not grant roles in this audit. |
| **G-022 Distributed production rate limiting** | `OPERATIONS_EXTERNAL` | `InMemoryP0StagingRateLimiter` is process-local and explicitly not a production traffic/SLA policy. | Multiple API replicas would multiply effective limits and weaken abuse controls. **Blocking: YES** unless production is single-replica with an explicit operational invariant. | Operations/Security. | A: shared atomic limiter or trusted edge limiter; B: one API replica with monitored cap; C: no public mutation launch. **Recommend A for scalable production.** | Unlocks a production limiter adapter/config or an explicitly certified single-replica deployment constraint; evidence is multi-instance acceptance. |
| **G-023 Auth production email** | `CREDENTIAL_EXTERNAL` | Resend is the selected technical adapter; executable config requires `RESEND_API_KEY` and `AUTH_EMAIL_FROM`; no live verified sender/delivery evidence is in the repo. | Email Magic Link is a P0 Auth path. **Blocking: YES** for Email Auth launch. | Auth/Operations owner. | A: verified Resend domain/sender and production secret; B: keep Auth disabled; C: approved alternate transactional provider. **Recommend A within the accepted Resend boundary.** | Unlocks live sender configuration and browser acceptance; no secret is committed or chosen here. |
| **G-024 Google OAuth production credentials and redirects** | `CREDENTIAL_EXTERNAL` | Google OIDC transaction and local flow boundaries exist; production client, redirect/origin registrations, JWKS/live exchange, and HTTPS evidence are absent. | Google Sign-In is a stated P0 path unless the owner explicitly narrows launch mode. **Blocking: YES** for full P0; **CONDITIONAL** for an Email-only release. | Auth/Operations owner. | A: configure approved Google project/client and exact origins/redirects; B: explicitly launch Email-only; C: defer Auth. **Recommend A for the PRD scope, otherwise document B.** | Unlocks production runtime injection and live state/PKCE/nonce/JWKS acceptance; credentials remain outside Git. |
| **G-025 Production secrets handling** | `CREDENTIAL_EXTERNAL` | Local code reads secrets from environment; no production secret manager, rotation, access review, or deployment evidence exists. | Engine, DB, email, OAuth, and observability credentials must not reach the browser or repository. **Blocking: YES** for production. | Operations/Security. | A: managed secret store with rotation/access audit; B: approved equivalent; C: no production launch. **Recommend A or equivalent.** | Unlocks deployment configuration and secret-injection acceptance; no environment variable is added by this audit. |

### 5.4 Legal, commercial, and release gates

| ID / subject | Classification | Repo status | Why it matters / launch-blocking | Owner | Options / recommendation | Consequence / local unlock / evidence required |
| --- | --- | --- | --- | --- | --- | --- |
| **G-026 Legal package** | `LEGAL_EXTERNAL` | Privacy/Terms policy is a technical/product baseline, not counsel-approved public legal copy; legal entity, contact, jurisdiction, and final notices are unresolved. | A public launch needs accurate controller/entity, privacy, terms, and applicable disclosures. **Blocking: YES.** | Legal counsel/Product Owner. | A: approve launch-specific legal package; B: restrict to non-account static content; C: no public launch. **Recommend A for P0.** | Unlocks approved copy and legal routes; no legal claims or invented entity details are added locally. |
| **G-027 Privacy, Terms, UGC, cookies, and Google disclosures** | `LEGAL_EXTERNAL` | `/privacy` and `/terms` are not currently implemented; UGC/moderation, Google, retention, cookies/consent, and account-rights wording are not approved public copy. | The active feature set determines mandatory disclosures and user rights. **Blocking: YES** for the corresponding feature set. | Legal counsel/Product Owner/Privacy. | A: approve a bounded P0 package for enabled surfaces; B: disable/defer surfaces lacking copy; C: no public launch. **Recommend A with feature flags matching actual scope.** | Unlocks G-035 legal route implementation and final content review; external evidence is signed/legal approval, not repository prose alone. |
| **G-028 Processor inventory and terms** | `LEGAL_EXTERNAL` | Resend, hosting, PostgreSQL, Google, and any future observability processor are referenced as boundaries; no complete production inventory/DPA/retention evidence is recorded. | Processor disclosure, region, deletion, and retention claims must be truthful. **Blocking: YES** for persistent production. | Legal/Privacy/Operations. | A: approved inventory and contracts; B: reduce processors/features; C: defer persistent launch. **Recommend A with G-006.** | Unlocks public disclosures and processor-specific configuration; no provider terms are inferred locally. |
| **G-029 Commercial launch mode** | `PRODUCT_OWNER_DECISION` | Free/Pro semantics and entitlement primitives are documented/local, but billing, checkout, subscription provider, and paid launch are not active. | Paid claims create payment, tax, refund, entitlement, privacy, and support obligations. **Blocking: CONDITIONAL** on monetization. | Product Owner + Legal/Operations. | A: FREE only; B: FREE plus non-purchasable Pro-compatible state; C: purchasable Pro. **Recommend A or B; do not choose C in this audit.** | A/B keep commercial implementation out of P0; C unlocks a separate billing architecture/provider/legal campaign, not `WEB-P0-002B` automatically. |
| **G-030 FREE/PRO production entitlement readiness** | `PRODUCT_OWNER_DECISION` | Local entitlement/reward projections exist within frozen semantics; no live billing source or production purchasable entitlement exists. | The public product must not imply paid capability that cannot be granted, reversed, supported, or legally described. **Blocking: CONDITIONAL** on Pro purchase. | Product Owner + Commercial/Legal. | A: Free-only; B: advertise no purchase and keep compatible projections dormant; C: complete paid entitlement track. **Recommend A or B.** | A/B require no paid implementation; C unlocks a separate commercial implementation after G-029, legal, provider, and operations decisions. |
| **G-031 Operational ownership** | `PRODUCT_OWNER_DECISION` | No single named owner is recorded for production release, incident response, privacy requests, retention, moderation, or scientific escalation. | A launch claim without accountable owners cannot be operated or certified. **Blocking: YES.** | Product Owner assigns named owners. | A: named functional owners and escalation map; B: limited launch with explicit owner coverage; C: no launch. **Recommend A.** | Unlocks runbooks, alerts, privacy requests, moderation/reviewer operation, and final sign-off; no names are invented here. |
| **G-032 Scheduled retention and maintenance** | `OPERATIONS_EXTERNAL` | Auth, Community, and Practitioner one-shot executables exist; no production scheduler, single-flight policy, cadence, or notification retention values are bound. | Expiry, purge, hold handling, and account lifecycle cannot rely on manual invocation for production claims. **Blocking: YES** for persistent production; **CONDITIONAL** for deferred surfaces. | Operations/Privacy. | A: one controlled scheduler with single-flight, metrics, and runbook; B: approved manual process for reduced launch; C: no persistence launch. **Recommend A.** | Unlocks scheduler invocation/config and maintenance acceptance after policy decisions; do not run or configure it here. |
| **G-033 Production deployment, DNS, TLS, and edge** | `OPERATIONS_EXTERNAL` | Accepted topology exists in ADRs; no deployment manifests, provisioned host, DNS, HTTPS, edge/API composition, or production promotion evidence exists. | The public origin, secure cookies, same-origin API, CSP, and private API path must be proven in target infrastructure. **Blocking: YES.** | Operations/Deployment owner. | A: provision accepted staging, then select and provision production host; B: static-only launch; C: no launch. **Recommend A for full P0.** | Unlocks staging implementation and deployment certification; production hosting remains unselected and no provider is selected. |
| **G-034 Final release evidence and certification** | `OPERATIONS_EXTERNAL` | Local source inspection is available; no target-environment browser, API, backup/restore, credential, rate-limit, observability, privacy, or scientific certification record exists. | A release gate must be evidence-based across the enabled feature set. **Blocking: YES.** | Release owner with all domain owners. | A: staged evidence pack followed by production go/no-go; B: reduced static/research release; C: no release. **Recommend A for full P0.** | Unlocks final certification only after all blocking dependencies close; this audit is not the certification. |
| **G-035 Public legal route implementation** | `LOCAL_IMPLEMENTATION_GAP` | Current route inventory has no `/privacy` or `/terms`. | Approved public legal copy needs reachable, indexable or appropriately linked routes. **Blocking: YES** for account/UGC production; **CONDITIONAL** for static-only release. | Web owner after Legal. | A: add routes from approved copy; B: keep affected features disabled; C: no public claim. **Recommend A after G-026/G-027.** | Legal approval unlocks a narrow local page change; no copy is invented in `WEB-P0-002A`. |
| **G-036 Privacy audit hook integration** | `LOCAL_IMPLEMENTATION_GAP` | Audit-event storage core exists, but current policy says mandatory hooks and privileged read surfaces are not complete. | If production grants privileged access, the actual surfaces must emit truthful audit events. **Blocking: CONDITIONAL** on G-018's selected authority. | Web/Security owner after Product/Privacy. | A: integrate only approved Community/Practitioner surfaces; B: keep privileged access disabled; C: defer those surfaces. **Recommend A or B.** | Unlocks a small bounded implementation after G-018; no new privileged surface is created here. |
| **G-037 Notification live delivery** | `NOT_P0` | Local notification platform through B4B4 is closed; live Web Push/VAPID/worker deployment and policy values are external/deferred. | Notifications are not required for the current P0 chart/learn/auth launch boundary. **Blocking: NO.** | Future Product/Operations owner. | A: leave deferred; B: later launch under separate policy/credential/operations gate. **Recommend A for P0.** | No P0 work is unlocked; do not start notification implementation in this audit. |
| **G-038 Current Transits** | `NOT_P0` | Current Transits remains P1 and no production scientific authority exists. | It is outside the current P0 launch gate and provider-dependent. **Blocking: NO.** | Future Product/Engine owner. | A: defer; B: later authorize after scientific contract. **Recommend A.** | No local work in `WEB-P0-002A`; provider status remains deferred. |
| **G-039 Ads, AI, PDF, paid billing, and other P1/P2/P3 expansion** | `NOT_P0` | Feature flags/contracts or deferred product policy may exist, but these capabilities are not current P0 launch requirements. | Expanding now would change legal, privacy, provider, and operations scope. **Blocking: NO** for current P0. | Product Owner for future roadmap. | A: preserve deferral; B: separately authorize one future track. **Recommend A.** | No implementation is unlocked by this audit; no speculative cleanup or product expansion is authorized. |

## 6. Consolidated Product Owner decision packet

These are the only cross-cutting Product Owner decisions recommended for the
current gate. They are intentionally policy-level, not micro implementation
questions. A decision does not close its related external evidence until the
named owner supplies proof.

### DP-01 — Production launch mode while provider authority is deferred

- **Question:** Which product mode is authorized while `PROVIDER DECISION DEFERRED` remains in force?
- **Option A:** Full P0 production astrology launch only after an approved Engine-owned scientific authority, production connectivity, provenance, and E2E evidence.
- **Option B:** Reduced static/editorial or research-labeled fixture launch with no production astrology claim.
- **Option C:** Launch production astrology using the current fixture or an unapproved provider.
- **Recommended default:** **A for a full P0 launch; B is the only safe reduced mode. Never C.**
- **Why:** The PRD requires truthful provenance and prohibits Web-owned astronomy; the current executable is mock-only.
- **What this unlocks:** A authorizes the later scientific/deployment evidence sequence. B authorizes only the static/research scope. Neither selects a provider.

### DP-02 — Isolated staging requirement

- **Question:** Is isolated, non-indexable staging mandatory before any production promotion?
- **Option A:** Mandatory Railway research/staging environment using the accepted `WEB-DEPLOY-002A` topology and `development-mock`.
- **Option B:** Documented reduced-launch exception with no full P0 promotion claim.
- **Option C:** No staging and no production promotion.
- **Recommended default:** **A.**
- **Why:** It separates research/mock behavior from production and provides the required target-environment evidence boundary.
- **What this unlocks:** A unlocks the future staging-composition/provisioning campaign without reopening the topology decision.

### DP-03 — Production data region and residency

- **Question:** Which explicit production data region and processor geography are approved for account, chart, Vault, feedback, UGC, audit, and backups?
- **Option A:** One explicit managed region with legal/processor approval and documented backup/observability placement.
- **Option B:** An approved multi-region policy with residency and failover rules.
- **Option C:** No persistent production account launch until a region is selected.
- **Recommended default:** **A.**
- **Why:** The current repository cannot truthfully describe residency, processor boundaries, or recovery placement without a selected target.
- **What this unlocks:** Database, backup, observability, processor, public-copy, and deployment configuration decisions.

### DP-04 — Backup RPO, RTO, and restore cadence

- **Question:** What explicit loss tolerance, recovery target, and restore-drill cadence govern production data?
- **Option A:** Approve explicit numeric RPO and RTO targets plus a scheduled restore drill.
- **Option B:** Approve best-effort targets and incident-only restoration for a reduced launch.
- **Option C:** Defer persistent production data until A is approved.
- **Recommended default:** **A; the numeric values must be selected by the owner and are not invented in this package.**
- **Why:** The retention policy requires these values, while the repository contains no production backup provider or restore evidence.
- **What this unlocks:** Backup configuration, restore runbook, maintenance ownership, legal wording, and final certification.

### DP-05 — Retention and observability policy values

- **Question:** What are the owner-approved values and owners for Feedback, audit events, operational logs, downstream processors, backups, and maintenance records?
- **Option A:** Shortest sufficient retention for each category, with explicit exceptions/holds and owner.
- **Option B:** Longer operational retention with documented privacy/legal justification.
- **Option C:** Disable the corresponding feature or durable operational claim.
- **Recommended default:** **A, with a separate value for each data class; do not copy a database TTL into downstream systems.**
- **Why:** Local predicates are present for some domains, but Feedback, audit, logs, processor records, backups, and scheduler cadence remain policy/external boundaries.
- **What this unlocks:** Retention registry, cleanup scheduling, observability settings, erasure reconciliation, and public disclosures.

### DP-06 — Privacy access and privileged review scope

- **Question:** Which roles may access Community, Practitioner, Feedback, account, or audit data in P0?
- **Option A:** Existing Community Moderator and Practitioner Reviewer surfaces only; no P0 Feedback staff access.
- **Option B:** Add a specifically authorized, least-privilege Feedback/support role with audit hooks.
- **Option C:** Defer all privileged review surfaces.
- **Recommended default:** **A.**
- **Why:** The local audit storage core is present, but a broader access surface would require new policy, legal, role, and audit evidence.
- **What this unlocks:** Only the selected role grants and narrowly scoped hook integration; it does not grant anyone automatically.

### DP-07 — Community and Practitioner operational mode

- **Question:** Are named moderation and reviewer operations available for the corresponding public surfaces?
- **Option A:** Launch with named owners, roster, queue/runbook, escalation, and retention process.
- **Option B:** Keep the local implementations staged or disabled until staffing exists.
- **Option C:** Remove the surfaces from the launch scope.
- **Recommended default:** **A only where real capacity exists; otherwise B.**
- **Why:** Local authorization predicates do not establish human operational coverage.
- **What this unlocks:** Production role grants, moderation/reviewer acceptance, and corresponding legal/public-copy enablement.

### DP-08 — Distributed rate-limit topology

- **Question:** What production control protects public and authenticated mutations across replicas?
- **Option A:** Shared atomic store or trusted edge limiter.
- **Option B:** One API replica with an explicit, monitored operational invariant.
- **Option C:** No public mutation launch.
- **Recommended default:** **A for production; B only for an explicitly constrained staging/reduced mode.**
- **Why:** The current limiter is process-local P0 staging protection and cannot be presented as a distributed production control.
- **What this unlocks:** A bounded production adapter/configuration or a certified single-replica deployment constraint.

### DP-09 — Auth launch matrix

- **Question:** Which Auth methods are included in the first live launch?
- **Option A:** Email Magic Link and Google Sign-In, with both live configurations and browser evidence.
- **Option B:** Email Magic Link only, with Google explicitly disabled and the reduced scope documented.
- **Option C:** No live account/Auth launch.
- **Recommended default:** **A for the PRD P0 scope; B only with explicit owner approval and matching public copy.**
- **Why:** Local boundaries exist, but sender, Google project, redirect/origin, HTTPS, and secret evidence are external.
- **What this unlocks:** Credential configuration, live acceptance, route flags, and legal disclosure matching the actual scope.

### DP-10 — Commercial launch mode

- **Question:** Is the P0 launch free-only, Free plus dormant Pro-compatible state, or purchasable Pro?
- **Option A:** FREE only.
- **Option B:** FREE plus a non-purchasable Pro-compatible projection with no paid checkout claim.
- **Option C:** Purchasable Pro with billing, tax/refund, entitlement, support, and legal readiness.
- **Recommended default:** **A or B; do not choose C in this gate.**
- **Why:** Free/Pro semantics are frozen, but billing/provider/legal/operations are not production-ready and Pro is P1/deferred in the PRD.
- **What this unlocks:** A/B avoid paid implementation in the P0 campaign. C requires a separate commercial architecture and provider campaign.

### DP-11 — Production operational ownership

- **Question:** Who owns release approval, incidents, privacy requests, retention, moderation, reviewer operations, and scientific escalation?
- **Option A:** Named functional owners plus an escalation map and handoff record.
- **Option B:** Limited-hours/best-effort operation with explicit reduced-scope claims.
- **Option C:** No production claim.
- **Recommended default:** **A.**
- **Why:** An unowned service cannot satisfy incident, access, deletion, or scientific trust obligations.
- **What this unlocks:** Runbooks, alerts, scheduler ownership, role grants, support process, and final certification.

## 7. Gate groups and required external evidence

### Legal external gates

`G-026`, `G-027`, and `G-028` are legal gates. Required evidence is the
approved entity/contact/jurisdiction package, Privacy and Terms copy, UGC and
moderation wording where enabled, cookie/consent position, Google disclosure,
account rights wording, processor inventory, region/retention treatment, and
any required contracts or DPAs. The policy documents are not substitutes for
counsel approval.

### Scientific external gates

`G-001` through `G-005` are scientific gates. Required evidence is an
Engine-owned production authority, approved scientific configuration and
provenance identity, compatible Public API contract, server-side connectivity,
rights/processor evidence where applicable, and a real staging/production
chart/Sky acceptance. No item authorizes selecting a provider here.

### Operations external gates

`G-007` through `G-022`, `G-031` through `G-034` are operations and release
gates. Required evidence includes provisioned isolated staging, selected
production region/host, PostgreSQL/TLS/least-privilege configuration,
backup/restore records, durable privacy-safe observability, alerts/on-call,
maintenance scheduler and single-flight behavior, moderation/reviewer staffing,
distributed rate limiting, DNS/TLS/edge acceptance, and a signed release
checklist.

### Credential external gates

`G-023` through `G-025` are credential gates. Required evidence is a verified
Resend sender and delivery result, Google project/client/origin/redirect/JWKS
configuration if Google is enabled, and a managed secret-injection/rotation
record. Secrets must remain server-side and outside Git/browser output.

## 8. Local implementation gaps unlocked after decisions

No local gap below is started by `WEB-P0-002A`. These are the smallest likely
repository changes after the governing decision and evidence dependencies are
closed:

| Local gap | Required prerequisite | Bounded future outcome |
| --- | --- | --- |
| `G-035` legal routes | `G-026` and `G-027` | Add only approved `/privacy` and `/terms` pages/links and their exact metadata. |
| `G-036` audit hook integration | `DP-06`, `G-018`, legal/role approval | Integrate mandatory events only into the explicitly authorized privileged surfaces. |
| Production Engine binding | `G-001` to `G-005`, `G-006`, `G-025`, deployment evidence | Add a server-side production Engine mode behind the existing `EngineClient` boundary; keep the browser provider-neutral. |
| Public Sky production path | `DP-01`, `G-001` to `G-004` | Either keep the current fixture showcase labeled or wire only the approved Engine-owned Sky authority. |
| Distributed rate limit | `DP-08`, selected deployment topology | Add a shared/edge control or enforce and certify the approved single-replica invariant. |
| Observability sink and alerts | `DP-05`, `DP-11`, `G-013` to `G-015` | Bind an approved sink/retention/alert path without logging birth data, chart facts, or credentials. |
| Retention scheduler | `DP-04`, `DP-05`, `DP-11`, `G-032` | Invoke existing bounded maintenance with explicit cadence, locking, metrics, and runbook. |
| Live Auth configuration | `DP-09`, `G-023` to `G-025` | Inject approved credentials and run target-environment email/Google acceptance. |
| Staging/deployment composition | `DP-02`, `G-006`, `G-009`, `G-023`, `G-025` | Implement/provision the already accepted Railway staging topology; do not re-decide it. |

## 9. What can and cannot launch while the provider decision is deferred

### Can proceed without production provider authority

Subject to separate legal, hosting, accessibility, performance, and operations
evidence, the following can remain available as non-scientific or explicitly
research-labeled scope:

- Static/editorial Web content such as Learn, About, methodology, and approved
  educational/SEO surfaces that do not claim live personal astronomy.
- The Astro/React visual shell, responsive chart/workspace presentation, and
  Public Sky/Chart Instrument showcase when its fixture/research status is
  explicit and no production scientific claim is made.
- Local development and isolated research staging using `development-mock` and
  `WEB_UI_FIXTURE_V1`, with no fake Auth or false production telemetry.
- Documentation, contracts, privacy-safe boundaries, and other provider-neutral
  local engineering that the PRD explicitly allows while waiting.

These are not an automatic deployment authorization. They still require the
selected launch mode, legal copy, target hosting, secrets, and appropriate
acceptance evidence.

### Cannot launch as production while the provider decision is deferred

- Production personal chart calculation, Full Chart E2E, or Vault experiences
  that imply authoritative chart facts.
- A live Public Sky or future Current Transits surface that claims current
  astronomical truth without Engine-owned scientific authority and provenance.
- Any Web-owned astronomy, provider-specific logic, provider SDK, scientific
  configuration interpretation, or direct provider request.
- Production scientific disclosure or trust claims that the current mock cannot
  support.

Current Transits, paid Pro purchase, Ads, AI, PDF, and other future expansion
remain outside this P0 decision boundary even after the provider decision is
made.

## 10. Roadmap reconciliation

The earlier `WEB-P0-001` document remains historical local-readiness evidence;
it is not a second current decision package. This document is the current
external-gate authority for `WEB-P0-002A`.

The roadmap is reconciled to the following sequence:

1. `WEB-P0-002A` — this audit and one consolidated decision/evidence pack.
2. Owner/legal/scientific/operations/credential decisions and evidence closure.
3. `WEB-P0-002B` — only the bounded local implementation and environment work
   explicitly unlocked by the closed decisions. **Not started here.**
4. Staging certification using the accepted Railway research topology.
5. Production deployment and final P0 certification only if scientific and all
   external gates pass.

Foundations, Feedback, Community, Practitioner, the notification foundation,
commercial semantics, UIQA, Public Sky showcase, and Chart Instrument remain
closed or deferred in their own scopes. They are not reopened by this audit.
Current Transits remains P1. The Engine scientific track remains separate.

The LOC thresholds referenced by the PRD and architecture guidance are
**heuristic guardrails**. They are not lint rules, automatic refactor triggers,
or a reason to add speculative cleanup to this campaign.

## 11. Recommended implementation sequence after approval

The smallest campaign structure is one decision/evidence closeout followed by
one bounded implementation/deployment campaign and one final certification
gate. Parallel work is safe only where its dependencies are already closed.

| Track | Sequence | Dependency |
| --- | --- | --- |
| **PRODUCT OWNER / POLICY** | Approve DP-01 through DP-11; record enabled launch mode, region, retention, backup targets, access scope, ownership, Auth matrix, and commercial mode. | Starts this package's closure; no code dependency. |
| **LEGAL** | Approve entity/privacy/terms/UGC/cookie/Google/account-rights/processor package and final public copy. | DP-03, DP-05, DP-06, DP-07, DP-09, DP-10. |
| **SCIENTIFIC** | Engine owner supplies authority/config/provenance/API compatibility and production acceptance; provider decision remains separately owned and deferred until explicitly resolved. | DP-01, G-001 to G-005, G-006. |
| **EXTERNAL CREDENTIAL** | Configure verified Resend, optional Google, Engine, DB, observability, and secret-manager material in target environments. | Legal/region/Engine/deployment decisions. |
| **OPERATIONS** | Provision staging, database, backups, restore drill, observability, alerts, moderation/reviewer coverage, scheduler, and rate limiting. | DP-02, DP-03, DP-04, DP-05, DP-07, DP-08, DP-11. |
| **LOCAL CODE/CONFIG** | Implement only G-035/G-036 and the approved production adapters/configuration; retain provider-neutral browser/BFF boundaries. | The corresponding decision plus external evidence; this is future `WEB-P0-002B` scope. |
| **DEPLOYMENT** | Deploy isolated non-indexable staging, run migration/release checks, verify same-origin HTTPS edge, then prepare a separately selected production host. | Staging, credentials, DB, Engine, legal, and operations evidence. |
| **FINAL CERTIFICATION** | Run the authorized target-environment browser/API/scientific/privacy/security/backup/operations matrix and record go/no-go. | Every blocking gate above; no unresolved conditional gate for an enabled feature. |

No provider-specific implementation, production deployment, migration, install,
build, or test campaign is authorized by this sequence.

## 12. Recommended `WEB-P0-002B` scope (not started)

`WEB-P0-002B` should be a bounded implementation-and-environment campaign,
not another product feature batch. It should consume the approved decision
record and implement only:

1. the approved legal routes/copy and any narrowly authorized privacy-audit
   hooks;
2. explicit production configuration interfaces for Engine, Auth, database,
   secrets, observability, and rate limiting, without putting credentials in
   the browser or selecting an astronomy provider in Web;
3. the accepted staging composition and target-environment configuration;
4. the approved maintenance scheduler/locking/observability binding; and
5. only the production Engine/Public Sky path for which the separate scientific
   authority and provenance evidence is already complete.

It must not reopen UIQA, add P1/P2/P3 features, change the PRD, create a new
migration without a separately approved schema need, or bypass
`PROVIDER DECISION DEFERRED`.

## 13. Audit conclusion

```text
WEB-P0-002A = COMPLETE AS A READINESS AUDIT / DECISION PACK
P0 production release = NOT READY
Local implementation blocker independent of a decision = NONE IDENTIFIED
External/policy/operations/scientific blockers = PRESENT
Current authoritative decision package = THIS DOCUMENT
WEB-P0-002B = NOT STARTED
```

This package makes no production-ready claim, makes no provider selection, and
does not access or modify `C:\NatalNode`.
