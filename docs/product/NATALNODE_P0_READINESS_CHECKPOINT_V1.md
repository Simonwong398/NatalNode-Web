# NatalNode.com P0 Readiness Checkpoint V1

- Status: **CURRENT PRODUCT READINESS CHECKPOINT**
- Task: `WEB-P0-READY-001`
- Baseline: `8b77fbc28f54a6f006d235dcbdf892cf7b2eb378`
- Baseline message: `fix: transition to chart result`
- Date: 2026-08-27
- Mode: Product / architecture readiness audit; documentation only
- Production astronomy: `PROVIDER DECISION DEFERRED`
- Deployment: `PAUSED`

## 1. Checkpoint purpose

This checkpoint records current repository truth against the P0 contract in
`docs/PRD.md`. It replaces mechanical continuation of historical task lists
with an evidence-based readiness view. It does not rewrite the PRD, approve a
provider, authorize deployment, or claim that repository implementation has
been verified in a live environment.

The classifications used here are:

- `IMPLEMENTED`
- `IMPLEMENTED BUT OPERATIONALLY UNVERIFIED`
- `MISSING / TRUE P0 GAP`
- `PROVIDER-DEPENDENT`
- `POLICY / CREDENTIAL BLOCKED`
- `DEPLOYMENT-PAUSED`
- `P1+ / NOT P0`
- `INTENTIONALLY DEFERRED`

Implementation evidence means the required boundary or capability is present
in the repository. Operational verification means that the real database,
email, DNS, TLS, hosting, credentials, provider behavior, and live browser
flow have been exercised in the target environment. Those are different
claims.

## 2. Sources and audit boundaries

Authoritative and relevant governance sources inspected in full:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`
- `docs/product/NATALNODE_PRODUCT_ROADMAP_V1.md`
- `docs/product/NATALNODE_PUBLIC_SKY_DOMAIN_V1.md`
- `docs/product/NATALNODE_RESULT_PROGRESSIVE_DISCLOSURE_V1.md`
- `docs/design/NATALNODE_ASTROLOGICAL_SEMANTIC_LAYER_V1.md`
- `docs/design/NATALNODE_VISUAL_SYSTEM_V1.md`
- `docs/adr/WEB-AUTH-002A-email-magic-link-delivery.md`
- `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`
- `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`
- `docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md`

Repository evidence was inspected under `apps/web`, `server`, `packages`, the
database migrations, workspace manifests, lockfile, and bounded Git history.
The separate `C:\NatalNode` repository was neither accessed nor required.

This audit did not run a build, test suite, live browser workflow, database,
email delivery, deployment, or production-provider integration. Its
operational conclusions are therefore deliberately conservative.

## 3. Frozen accepted product areas

The following accepted work is frozen unless a genuine regression is found:

1. **Homepage Public Sky V1.** The development-only homepage preview uses the
   accepted authentic chart geometry and explicit development boundary. This
   checkpoint does not reopen its visual design.
2. **Natal Result Progressive Disclosure V1.** Chart, Interpretation, and
   Details remain exclusive result modes. Chart is wheel-first, complete facts
   are disclosed on demand, Interpretation is progressively disclosed, and
   Save is contextual.
3. **Calculate to Result Transition V1.** A successful calculation moves focus
   and scroll context to the result shell. This checkpoint found no evidence
   requiring that transition to be redesigned.
4. **Visual V1.1 functional baseline.** The responsive shell, editorial and
   observatory modes, design primitives, and accepted Learn/Tools/Calculate/
   Vault treatments remain approved. Optional polish is not P0 work.

## 4. Executive readiness statement

NatalNode.com has a substantial P0 implementation foundation: the static Astro
product shell, responsive visual system, accessible Birth Input and historical
timezone-state UX, unknown-time policy, EngineClient boundaries, development
fixtures, same-origin Hono BFF, chart renderer, result workspace,
deterministic interpretation, Email Magic Link code path, owner-scoped Vault,
Private Feedback, Learn/Tools discovery surfaces, technical SEO, and bounded
application security/observability are present.

P0 is **not implementation-complete**. The primary Web-owned completion gaps
are account deletion/account-wide erasure, full account export, Auth-record
cleanup and retention enforcement, privacy access auditing, RFC 9457 error
alignment, the PRD ChartResult cache abstraction, complete PRD observability
fields, and the missing Vault duplicate operation. Google Sign-In and public
legal pages are also P0 gaps but require policy, credentials, legal approval,
or all three. Staging composition and verification remain explicitly paused.

Production astronomy and production birth-place/historical-timezone resolution
are external provider gates, not ordinary Web implementation gaps.

## 5. P0 readiness matrix

| Area | PRD/P0 requirement | Current repository status | Classification | Evidence/source location | External dependency/blocker | Recommended action | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Repository/product shell | Website repository and coherent product shell | npm workspaces, Astro app, packages, Hono server, shared layout, public/private routes, and local composition entry points exist | `IMPLEMENTED` | `package.json`; `apps/web/src/layouts/SiteLayout.astro`; `server/src/executable/` | None for repository structure | Preserve current boundaries | P0 complete |
| Design system | Reusable visual baseline | Tailwind, shared global primitives, Surface/Container, Editorial and Observatory modes are present; Visual V1.1 is approved | `IMPLEMENTED` | `apps/web/src/styles/global.css`; `apps/web/src/components/ui/Surface.astro`; `docs/design/NATALNODE_VISUAL_SYSTEM_V1.md` | None | Do not reopen cosmetic work | P0 complete |
| Responsive/accessibility shell | Responsive shell and baseline keyboard/focus semantics | Responsive navigation, skip link, visible focus primitives, semantic page structure, and 320px-oriented rules are present; no known P0 blocker was found in this bounded review | `IMPLEMENTED` | `apps/web/src/layouts/SiteLayout.astro`; `apps/web/src/styles/global.css`; result and form components | Not a full WCAG audit | Preserve and verify at a later release checkpoint | P0 complete |
| Birth Input | Date, time, place, coordinates/timezone context, house system, validation | Structured form and request-construction flow are implemented | `IMPLEMENTED` | `apps/web/src/features/chart-input/`; `apps/web/src/features/chart-experience/chart-request.ts` | Production resolver is separate | No new Birth Input task without a defect | P0 complete |
| Historical timezone UX | Exact, ambiguous, nonexistent, and user-selected occurrence behavior | UX states, candidate selection, blocking behavior, and explicit fixture provenance exist | `IMPLEMENTED` | `apps/web/src/features/chart-input/BirthResolutionFeedback.tsx`; `useBirthInputResolution.ts`; `types.ts` | Real facts require production resolver | Keep UX; treat real resolution as provider-dependent | P0 UX complete |
| Unknown birth time | No silent noon fallback; angles/houses/house interpretation unavailable | `UNKNOWN_TIME` is represented with null time-resolution facts and enforced by presentation policy | `IMPLEMENTED` | `packages/contracts/src/chart.ts`; `apps/web/src/features/chart-workspace/chart-presentation-policy.ts`; `ChartWorkspaceView.tsx` | Production Engine must honor the same contract | Preserve invariant | P0 complete |
| Engine client abstraction | Browser/BFF depend on provider-neutral EngineClient | Interface, HTTP browser client, mock, and BFF injection are present | `IMPLEMENTED` | `packages/engine-client/src/index.ts`; `http-engine-client.ts`; `server/src/app/dependencies.ts` | Production Engine binding deferred | Do not add provider logic to Web | P0 complete |
| Development MockEngineClient | Safe async UI fixture implementation | Chart and Sky fixtures are cloned per call; current executable accepts only `development-mock` | `IMPLEMENTED` | `packages/engine-client/src/mock-engine-client.ts`; `server/src/executable/create-executable-server-bindings.ts` | Not production astronomy | Retain explicit development labels | P0 complete |
| Website API / BFF | Same-origin chart, Auth, Vault, Feedback, and relevant Sky boundaries | Hono routes, strict request validation, Auth middleware, exact-Origin checks, security headers, rate limits, runtime/bootstrap, migrations, and local edge exist | `IMPLEMENTED BUT OPERATIONALLY UNVERIFIED` | `server/src/app/create-app.ts`; `server/src/app/routes/`; `server/src/runtime/`; `server/src/executable/` | Live PostgreSQL, Resend, edge, and target environment not exercised here | Verify only when deployment track resumes | P0 code complete |
| SVG Chart Renderer | Accessible SVG-first natal chart rendering | Renderer and geometry modules consume canonical ChartResult; accepted result architecture embeds it wheel-first | `IMPLEMENTED` | `apps/web/src/features/chart-renderer/`; `ChartWorkspaceView.tsx` | Production facts provider-dependent, renderer is not | Preserve accepted renderer | P0 complete |
| Chart Workspace | Chart/Interpretation/Details result shell and compact/full facts | Single-mode tab architecture, compact orientation, complete-fact disclosures, keyboard tab behavior, and contextual Save exist | `IMPLEMENTED` | `apps/web/src/features/chart-workspace/`; `docs/product/NATALNODE_RESULT_PROGRESSIVE_DISCLOSURE_V1.md` | None for UI architecture | Freeze accepted result UX | P0 complete |
| Calculation Details | Status, versions, configuration/provenance, warnings, house-system context | Details mode renders available facts and truthful unavailable/incomplete states | `IMPLEMENTED` | `apps/web/src/features/calculation-details/CalculationDetails.tsx` | Final scientific IDs require approved production Engine | Preserve unavailable-state honesty | P0 complete |
| Deterministic interpretation | Interpretation based only on returned chart facts | Deterministic mappings and source-fact context exist; unavailable house interpretation remains suppressed for unknown time | `IMPLEMENTED` | `apps/web/src/features/interpretation/` | Production facts provider-dependent, interpretation logic is not | Do not add AI to P0 | P0 complete |
| Guest | Calculate without an account; no permanent Vault | Unauthenticated calculation works and request/result state remains only in mounted page memory | `IMPLEMENTED` | `apps/web/src/features/chart-experience/ChartExperience.tsx`; privacy contract A.3/A.9 | None for current guest calculation | Keep page-memory behavior; broader temporary storage is governed P1 | P0 complete |
| Guest temporary retention | PRD describes session/local temporary chart behavior | Refresh/navigation persistence is absent; privacy governance explicitly records this as P1 and requires a threat-model/data-lifetime decision before adding storage | `P1+ / NOT P0` | `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`, E-P1-02 | Policy/consent if later pursued | Do not add browser storage implicitly | P1 |
| Auth — Email Magic Link | Request, delivery adapter, completion, session, logout | Token hashing, atomic challenge consumption, identity provisioning, HttpOnly cookie, current-session and logout paths, and Resend adapter exist | `IMPLEMENTED BUT OPERATIONALLY UNVERIFIED` | `server/src/auth-runtime/`; `server/src/app/routes/auth-email.ts`; `auth-session.ts`; `server/src/runtime/email/resend/`; Auth pages/features | Resend credential, sending-domain/DNS/tracking setup, live database/cookie verification | Keep code frozen; verify in an authorized environment later | P0 operational gate |
| Auth — Google Sign-In | Google at Launch | Only contract/schema allowance exists; no OAuth route, state/PKCE, token handling, browser flow, or provider adapter exists | `POLICY / CREDENTIAL BLOCKED` and `MISSING / TRUE P0 GAP` | `packages/contracts/src/auth.ts`; `server/db/migrations/0001_auth_vault_baseline.sql`; privacy gap E-P0-07/P-13 | OAuth credentials/configuration, security/privacy review, approved disclosure | Separate bounded Auth architecture/implementation track after policy authorization | P0 blocker |
| Auth minimization | Expired/consumed challenge and expired session cleanup | Expiry prevents authentication, but rows are not purged and challenge email rows are not user-linked | `MISSING / TRUE P0 GAP` | `server/src/auth-runtime/README.md`; `email-magic-link-challenge-repository.ts`; `auth-session-repository.ts`; privacy gap E-P0-03 | Approved retention semantics | Freeze retention semantics, then implement bounded cleanup | P0 blocker |
| Vault | Save, open/list, rename, category, tags, favorite, notes, delete, ownership, server recalculation, canonical snapshot | All listed operations except duplicate are implemented; server binds owner identity and recalculates before saving | `IMPLEMENTED` with one bounded P0 gap | `apps/web/src/features/vault/`; `server/src/app/routes/vault-charts.ts`; `vault-notes.ts`; persistence adapters; `0001_auth_vault_baseline.sql` | Live PostgreSQL/browser verification outstanding | Preserve current slice; add duplicate only in a bounded task | P0 mostly complete |
| Vault duplicate | PRD Chart Vault includes duplicate | No duplicate contract, route, repository operation, or UI action was found | `MISSING / TRUE P0 GAP` | `packages/contracts/src/api/vault.ts`; `server/src/app/routes/vault-charts.ts`; `apps/web/src/features/vault/` | None | Implement as a separate, owner-scoped bounded operation after higher-risk privacy contracts | P0 blocker, lower priority |
| Private Feedback | Authenticated private create-only intake | Contract, validation, rate limits, migration, repository, BFF route, noindex form, session gate, and accessible states exist | `IMPLEMENTED BUT OPERATIONALLY UNVERIFIED` | `packages/contracts/src/feedback.ts`; `server/db/migrations/0004_private_feedback.sql`; `server/src/app/routes/feedback.ts`; `apps/web/src/pages/feedback.astro` | Live PostgreSQL/browser verification; approved retention/access policy | Do not promote history/delete to P0 absent policy | P0 code complete |
| SEO Tools | Launch 2–4 SEO tools | Three public educational reference tools exist with explicit non-calculation positioning; current governance consistently treats these as educational Tools | `IMPLEMENTED` | `apps/web/src/lib/content-taxonomy.ts`; `apps/web/src/pages/tools/`; Visual System and privacy governance | Production calculators would require Engine/provider facts, but are not represented as current tool behavior | Accept current positioning; do not manufacture SEO microtasks | P0 complete under current accepted positioning |
| Learn foundation | Index, taxonomy/discovery, article template/content | Content collection, six-category taxonomy, index, one published foundation article, Article metadata, and approved hero exist | `IMPLEMENTED` | `apps/web/src/content.config.ts`; `apps/web/src/content/learn/`; `apps/web/src/pages/learn/` | Editorial expansion is ongoing product content, not a P0 implementation blocker | Preserve foundation | P0 complete |
| Technical SEO/trust | Canonical, robots, sitemap, social metadata, Article data, About, Methodology, trust nav, 404 | Required technical surfaces and metadata are present; private routes are excluded/noindex as appropriate | `IMPLEMENTED` | `SeoHead.astro`; `StructuredData.astro`; `robots.txt.ts`; `sitemap.xml.ts`; `about.astro`; `methodology.astro`; `404.astro`; `SiteLayout.astro` | Privacy/Terms pages are separately policy-blocked | No generic SEO cleanup task | P0 complete except legal pages |
| Error model | RFC 9457 Problem Details | APIs use a shared custom `{ error: { code, message } }` family, not RFC 9457; Feedback ADR records coordinated migration as a pre-production gate | `MISSING / TRUE P0 GAP` | `docs/PRD.md` section 29; `server/src/app/create-app.ts`; route contracts; Feedback ADR | Requires coordinated contracts/middleware/client change, not an external service | Execute one cross-API contract migration task | P0 blocker |
| ChartResult cache | Cache abstraction; complete ChartResult only; configuration-aware key; no hour-level shared planet cache | No application cache abstraction, cache key implementation, or ChartResult cache path was found | `MISSING / TRUE P0 GAP` | `docs/PRD.md` section 30; no cache module in `server/src` | Production key completeness depends on Engine metadata, but an abstraction can remain provider-neutral | Design and implement the smallest provider-neutral cache boundary; do not assume Redis | P0 blocker |
| Privacy/data rights | Deletion, export, retention, access audit, truthful public policy | Individual chart/note deletion and data minimization exist; account deletion, account-wide erasure, full export, retention enforcement, access audit, and public legal routes do not | `MISSING / TRUE P0 GAP` plus `POLICY / CREDENTIAL BLOCKED` | `docs/product/NATALNODE_PRIVACY_TERMS_POLICY_V1.md`, E-P0-01 through E-P0-06; repositories/migrations | P-01 through P-10 decisions and legal approval affect public copy/operations | Start with account-deletion technical contract; do not invent legal text | Highest P0 blocker family |
| Observability | All BFF request facts plus cache status; bounded Engine request facts | Server-generated request ID, method/endpoint family, status, duration, and privacy-minimized completion/error records exist. Cache status and Engine version/configuration/provenance/duration/warning count are absent | `MISSING / TRUE P0 GAP` (partial implementation) | `server/src/app/observability/api-request-observability.ts`; `docs/PRD.md` section 39 | Cache status follows cache implementation; production metadata follows Engine result | Extend only the approved privacy-minimized schema after cache/error boundaries are frozen | P0 blocker, sequenced |
| Staging/deployment | Staging deployment and release validation | Same-origin topology and Railway staging contract are accepted; repository-local executable/composition exists. Railway/Caddy composition, provisioning, DNS/configuration, migration run, deployment, and E2E validation are absent | `DEPLOYMENT-PAUSED` | Deploy ADRs; no Railway/Caddy implementation files found; roadmap/privacy/Feedback governance | Explicit deployment pause, credentials, DNS, Railway, PostgreSQL, Resend | Resume only by explicit authorization, then continue accepted sequence | P0 paused gate |
| Production astronomy | Production-approved Engine and scientific identities | Not implemented in Web and correctly not selected | `PROVIDER-DEPENDENT` | `docs/PRD.md` release gate; deploy ADRs; executable accepts only `development-mock` | Astronomy provider, rights, Engine production readiness, contract/E2E gates | Wait; do not implement provider logic in Web | External launch gate |
| Production resolver | Real location and historical timezone authority | Browser development fixture intentionally exercises all UX states; no production geocoder/timezone source exists | `PROVIDER-DEPENDENT` | `apps/web/src/features/chart-input/development-resolver.ts`; Public Sky/privacy/deploy governance | Data-source/provider decision and operational integration | Wait for approved source; preserve resolver interface | External launch gate |

## 6. True P0 blockers

Only the following gaps prevent the repository from being called P0
implementation-complete. External and paused items remain blockers to launch,
but are separated so they are not mistaken for ordinary coding tasks.

### 6.1 Account deletion and account-wide erasure

- **Why P0:** the PRD privacy baseline and privacy gap E-P0-01 require account
  and data deletion before public launch.
- **Ownership:** primarily Web-owned, with policy decisions governing
  confirmation, reauthentication, manual fallback, retention exceptions,
  backups, and completion claims.
- **Current gap:** there is no route, application service, repository delete,
  UI, or verified manual mechanism. `users` deletion would cascade identities,
  sessions, charts, notes, and Feedback, but standalone
  `email_magic_link_challenges` are not linked to a user and no deletion
  mechanism exists.
- **Next bounded action:** freeze an executable technical contract before
  runtime work. No such contract or implementation was found in current docs,
  source, migrations, or bounded Git history.

### 6.2 Full user-data export

- **Why P0:** privacy gap E-P0-02 explicitly records export as required before
  public launch.
- **Ownership:** Web-owned implementation, policy-gated by P-06 for format,
  verification, delivery, timing, and included categories.
- **Current gap:** Vault reads are not an account export; Auth identity and
  Feedback records are not available to the user.
- **Conceptual record set:** account timestamps/opaque identity, Auth identity
  provider/subject and timestamps, Vault chart metadata plus normalized input
  and canonical result/version/provenance fields, chart notes, and private
  Feedback submissions. Session/challenge credentials and hashes must not be
  exposed as reusable secrets; any non-secret lifecycle metadata requires an
  explicit contract decision.
- **Next bounded action:** freeze an authenticated machine-readable export
  contract after the higher-risk deletion lifecycle contract is established.

### 6.3 Retention, cleanup, and privacy access audit

- **Why P0:** privacy gaps E-P0-03 through E-P0-05 cover expired Auth-row
  cleanup, enforceable Vault/Feedback/log retention, and the PRD access-audit
  requirement.
- **Ownership:** mixed. Repository cleanup/audit mechanisms are Web-owned;
  durations, access roles, exceptions, infrastructure logs, and provider
  behavior require approved policy and target-environment facts.
- **Current gap:** expiry prevents credential use but does not purge rows;
  there is no approved/enforced retention schedule and no `audit_events` or
  equivalent privacy-access mechanism.
- **Next bounded action:** resolve each policy before implementation; keep
  audit data privacy-minimized and never copy sensitive payloads into logs.

### 6.4 API error, cache, and observability conformance

- **Why P0:** the PRD explicitly lists Error model, Cache abstraction, and
  Observability in Launch P0.
- **Ownership:** Web-owned and provider-neutral.
- **Current gap:** the custom error envelope is not RFC 9457; no complete
  ChartResult cache abstraction exists; observability omits cache status and
  the bounded Engine metadata/duration/warning fields required by the PRD.
- **Next bounded action:** use coordinated, bounded tasks in dependency order:
  error contract, cache boundary, then the fields that depend on those
  boundaries. No Redis or observability vendor is implied.

### 6.5 Google Sign-In

- **Why P0:** the PRD lists Email Magic Link and Google Sign-In for Launch.
- **Ownership:** Web implementation, but it requires OAuth security/privacy
  review, policy P-13, credentials, provider configuration, and truthful public
  disclosure.
- **Current gap:** schema allowance is not an implementation.
- **Next bounded action:** wait for explicit policy/credential authorization,
  then perform a dedicated Auth contract/security task. Do not claim Google is
  active.

### 6.6 Vault duplicate

- **Why P0:** the PRD Chart Vault capability list includes duplicate.
- **Ownership:** Web-owned.
- **Current gap:** no contract, route, repository operation, or UI action was
  found. Existing save/recalculate behavior must not be bypassed by a future
  implementation.
- **Next bounded action:** one owner-scoped operation after the higher-value
  privacy contract work; do not reopen the rest of Vault.

## 7. Provider-dependent items

- **Production astronomy:** production Engine/AstronomyProvider selection,
  commercial rights, runtime assets, final configuration/provenance identities,
  production deployment, and final Engine/Web E2E remain external gates.
- **Production resolver:** location resolution and historical timezone data
  authority remain deferred. The development fixture is intentional and is
  not production evidence.
- **Production Public Sky:** contracts, BFF routes, validation, development
  fixtures, instrument, and homepage preview exist. Production Sky facts still
  require the approved Engine/provider boundary.

No provider is selected by this checkpoint.

## 8. Waiting / external / policy blocked

- Google OAuth policy P-13, credentials, security review, and processor
  disclosure.
- Account deletion P-05 and export P-06 decisions, including identity
  verification, response guarantees, backup/log exceptions, and manual
  fallback.
- Vault, Feedback, Auth, and infrastructure-log retention decisions P-07
  through P-09.
- Approved legal entity/controller, privacy contact, jurisdiction, age policy,
  consent/cookie position, and final counsel-approved Privacy/Terms copy.
- Resend credential, verified sending identity, DNS/SPF/DKIM/DMARC, disabled
  tracking as required, and live delivery verification.
- Live PostgreSQL migrations/persistence, TLS, encryption at rest, least
  privilege, backups, infrastructure log handling, and target-environment
  cookie verification.

Public `/privacy` and `/terms` routes are P0 launch gaps, but writing pages
before these decisions are approved would create unsupported claims. They are
not safe placeholder-copy tasks.

## 9. Deployment-paused items

The accepted browser topology remains:

```text
browser
  -> one public HTTPS origin
       |-- normal routes/assets -> Astro static artifact
       `-- /api/*               -> Hono BFF
```

Current states are distinct:

- **Local full-stack runnable:** repository composition, executable, migration,
  and local edge commands exist; not rerun by this audit.
- **Staging deployable:** no. Railway/Caddy composition is not implemented.
- **Staging verified:** no. Resources, configuration, migrations, and the ADR
  E2E plan have not been exercised.
- **Production-ready:** no. Privacy/security, provider, resolver, and scientific
  release gates remain open.
- **Production deployed:** no evidence and no claim.

Deployment remains `PAUSED`. This checkpoint does not authorize
`WEB-DEPLOY-002B`, provisioning, DNS, secrets, migrations, or deployment.

## 10. Public Sky readiness

Implemented development/research foundation:

- provider-neutral Sky contracts and EngineClient methods;
- strict BFF request validation and snapshot/event routes;
- canonical development snapshot/event fixtures;
- result-shape/scientific-metadata validation;
- accessible Current Sky instrument; and
- development-gated homepage preview plus a private noindex development route.

Not production-ready or not P0:

- production Public Sky astronomy is `PROVIDER-DEPENDENT`;
- a public `/sky` product route is intentionally absent;
- lunar-phase authority and richer event timeline are future domain work; and
- Current Transits remains P1 in the current PRD.

The accepted homepage preview must not be mistaken for live sky data or used
to reopen homepage visual design.

## 11. Natal result and accessibility readiness

Repository evidence confirms the accepted result architecture:

- one active Chart/Interpretation/Details mode with native button-based tab
  controls, `tablist`/`tab`/`tabpanel` relationships, roving tab stops, arrow,
  Home, and End behavior;
- wheel-first Chart mode with compact orientation and separate complete-facts
  disclosure;
- deterministic Interpretation with bounded progressive disclosures and
  source-fact context;
- contextual, collapsed Save;
- Details with versions, status, configuration/provenance availability,
  warnings, and house-system context;
- unknown-time suppression of angles, houses, and house interpretation; and
- successful calculation focus/scroll transition to the result shell.

The shared shell also includes a skip link, semantic navigation, keyboard
mobile-menu behavior, and visible-focus primitives. This bounded readiness
review found **NO KNOWN P0 ACCESSIBILITY BLOCKER**. It is not a full WCAG audit
and does not create a speculative cleanup backlog.

## 12. Known architectural defects

### 12.1 Phantom web package dependency

`apps/web/src` directly imports `@natalnode/contracts` from multiple modules,
but `apps/web/package.json` and its lockfile workspace entry do not declare
that dependency. The package is currently available through workspace
hoisting/transitive dependencies, so this is not evidence that the current
monorepo build is broken. It is nevertheless a concrete package-integrity
defect that can fail under stricter isolated workspace installation or package
graph tooling.

Classification: **pre-release cleanup, not a P0 product-capability blocker**.
It is too small and low-risk to outrank account-level privacy work.

### 12.2 RFC 9457 mismatch

The custom API error envelope is internally consistent but conflicts with the
current PRD. A future fix must migrate shared contracts, middleware, routes,
and browser clients together; adding a third error dialect to one endpoint is
prohibited.

### 12.3 Cache and observability gap

No ChartResult cache abstraction exists, and the current privacy-safe request
record is narrower than the PRD observability contract. These are real P0
architecture gaps, not justification to add Redis, Sentry, OpenTelemetry, or
analytics.

### 12.4 Large-file governance

LOC thresholds remain heuristic guardrails, not lint rules or an autonomous
refactor backlog. The proactive decomposition program remains paused. No
active P0 capability was found to require a structural refactor, and this
checkpoint creates no LOC-derived work item.

## 13. P1+ / intentionally deferred

- Current Transits, public `/sky` expansion, lunar phase authority, richer Sky
  event timeline, and advanced predictive techniques.
- AI interpretation and AI quotas.
- Pro subscriptions, payments, billing, PDF export, ads, CMP, analytics, and
  monetization.
- Community, Questions, Practitioner profiles/network/marketplace, public user
  content, moderation, following, messaging, and outreach execution.
- Feedback history/detail/update/delete unless policy or legal review promotes
  a specific capability.
- Guest refresh/navigation persistence, account profile controls, identity
  management, all-session revocation, and saved chart-fact correction.
- Public chart sharing and cross-device guest recovery.
- Generic visual polish and proactive large-file decomposition.

These items do not influence the next P0 task.

## 14. Recommended next single task

```text
WEB-PRIVACY-001A — Freeze Account Deletion and Account-Wide Erasure Technical Contract
```

This is the highest-value next task because:

1. account deletion is an explicit PRD/privacy P0 launch requirement;
2. no executable technical contract or implementation has landed;
3. the Web team can define the application, persistence, Auth, Vault, notes,
   Feedback, session, and challenge boundaries without selecting an astronomy
   provider or resuming deployment;
4. deletion crosses the most sensitive persisted data and has greater
   irreversible-risk and trust value than a small package fix, Vault duplicate,
   cache optimization, or additional UI work; and
5. a contract-first task can identify and preserve unresolved policy/legal
   choices rather than silently inventing them in runtime code.

The contract task should freeze authentication/reconfirmation, owner binding,
cross-table and standalone challenge handling, active-session invalidation,
transaction/failure semantics, idempotency and response disclosure, manual
fallback boundary, backups/log/provider exclusions, verification evidence, and
the exact policy decisions that must be approved before implementation. It
must not implement deletion, write legal copy, or claim that erasure already
exists.

## 15. Do not do next

- Do not continue homepage/Public Sky visual polish.
- Do not reopen accepted Natal result or result-transition UX without a
  concrete regression.
- Do not build `/sky`, transits, lunar phase, or event expansion as a P0 proxy.
- Do not implement production astronomy or resolver/provider logic in Web.
- Do not select a provider or convert development fixtures into production
  claims.
- Do not invent Privacy, Terms, retention, deletion, export, or legal-policy
  text.
- Do not resume Railway/Caddy/DNS/deployment work while deployment is paused.
- Do not promote Feedback history/delete, profile controls, AI, monetization,
  Community, or Practitioner work into P0 without governance authorization.
- Do not resume generic LOC or large-file decomposition.
- Do not choose the phantom dependency cleanup merely because it is easy.
- Do not execute `WEB-PRIVACY-001A` automatically from this checkpoint.

## 16. Checkpoint decision

The repository is **P0 foundation-strong but not P0 implementation-complete**.
Accepted visual and result work should remain frozen. The next safe product
completion move is the single account deletion/account-wide erasure technical
contract above. All other P0 gaps remain recorded for sequencing after that
contract or for their required provider, policy, credential, legal, or
deployment gate.
