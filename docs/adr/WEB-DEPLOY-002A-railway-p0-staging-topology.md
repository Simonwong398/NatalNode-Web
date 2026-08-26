# ADR: Railway P0 Staging Topology and Environment Contract

- Status: ACCEPTED — Railway selected for P0 development/research staging only
- Task: `WEB-DEPLOY-002A`
- Date: 2026-08-25
- P0 staging hosting provider: RAILWAY
- Production hosting provider: NOT SELECTED
- Public staging origin: `https://staging.natalnode.com`
- Production astronomy: `BLOCKED-BY-EXTERNAL-GATE` — `PROVIDER DECISION DEFERRED`

## STATUS

Accepted for P0 development/research staging. This ADR selects one executable
staging topology and environment contract. It does not select production
hosting, provision infrastructure, configure providers, or approve production
astronomy.

## CONTEXT

The repository now has a static Astro artifact, browser `HttpEngineClient` over
relative `/api/chart`, a Hono executable using `runServerProcess(...)`, exact
unsafe-request Origin enforcement, Resend delivery, PostgreSQL persistence, and
an explicit migration executable. Externally accessible development/research
staging is the next deployment gate, while production astronomy and production
birth location/timezone data sources remain deferred.

`WEB-DEPLOY-001A` remains authoritative for the provider-neutral single-origin
topology. This ADR preserves that decision and selects its Railway staging
composition.

## DECISION

Create one isolated Railway staging project/environment with one selected
region and three colocated services where supported:

```text
NatalNode
`-- staging
    |-- web-edge   public; Caddy + apps/web/dist
    |-- api        private; existing Hono executable
    `-- postgres   private; Railway PostgreSQL
```

Only `web-edge` receives `staging.natalnode.com`. The browser sees one HTTPS
origin. Caddy routes `/api` and `/api/*` over Railway private networking to the
API and serves every other route from the static Astro artifact. Resend is an
API-owned outbound external dependency.

The exact Railway region is an operational deployment parameter because the
product requirements do not select one. P0 staging is single-region; no
multi-region topology is introduced. Production secrets and future production
database data must not enter this staging environment.

## STAGING PROVIDER

`P0 STAGING HOSTING PROVIDER: RAILWAY`

This selection applies only to P0 development/research staging. It relies on
Railway custom-domain TLS, private service networking/internal DNS, managed
PostgreSQL with `DATABASE_URL`, monorepo services, and failing pre-deploy
commands blocking deployment. It is not a production-hosting decision.

`PRODUCTION HOSTING PROVIDER: NOT SELECTED`

## PUBLIC ORIGIN

The sole externally visible staging origin is:

```text
https://staging.natalnode.com
PUBLIC_WEB_ORIGIN=https://staging.natalnode.com
```

It is authoritative for browser navigation, relative `/api` requests,
magic-link completion URLs, unsafe-request Origin validation, and browser
session-cookie scope. There is no `api.staging.natalnode.com` and no separate
browser API origin.

`PUBLIC_WEB_ORIGIN` must not be inferred from `HOST`, `PORT`, `Host`,
`Forwarded`, `X-Forwarded-Host`, or `X-Forwarded-Proto`.

## SERVICE TOPOLOGY

```text
Internet
  -> Railway public TLS edge
  -> https://staging.natalnode.com
  -> web-edge / Caddy
       |-- /api and /api/*
       |    -> Railway private HTTP
       |    -> api / existing Hono process
       |         |-- EngineClient -> development-mock
       |         |-- Resend -> outbound external API
       |         `-- DATABASE_URL -> private Railway PostgreSQL
       `-- every other path -> apps/web/dist
```

`web-edge` owns transport and route composition only. It terminates public
HTTPS through Railway, serves static content, proxies API traffic, and applies
staging-only edge policy. It contains no application, Auth, Vault, astronomy,
or server-secret logic.

## PUBLIC / PRIVATE EXPOSURE

| Component | Exposure | Boundary |
| --- | --- | --- |
| `web-edge` | Public | Only service with `staging.natalnode.com`; HTTPS only |
| `api` | Private | Reachable from `web-edge` through Railway private networking only |
| `postgres` | Private | Reachable by the API through a generated `DATABASE_URL` reference |
| Resend | External outbound dependency | Called only by the API service |

The API has no public custom domain and should not retain or require a Railway
public domain after staging setup. If setup creates one, staging completion
requires removing it or leaving it unused so browser traffic flows only through
the same-origin edge. PostgreSQL must not be exposed publicly unless a later,
explicit, temporary debugging decision authorizes it.

## ROUTE OWNERSHIP

| Public path | Owner |
| --- | --- |
| `/api` and `/api/*`, including unknown API paths | Private Hono API through Caddy |
| `/`, `/auth/*`, `/vault`, `/vault/chart`, `/learn/*`, `/tools/*`, and static assets | Static Astro artifact through Caddy |

Caddy must preserve the request path, method, body, incoming `Origin`, cookies,
and relevant content headers, and preserve the API response status, body,
content headers, cookies, `Set-Cookie`, and cache headers. Unknown `/api` paths
must reach Hono's API not-found behavior and must never fall back to Astro HTML.
No CORS layer is introduced.

## STATIC ARTIFACT

Astro remains static. The current `apps/web` build produces `apps/web/dist`,
which `web-edge` serves for all non-API paths. Staging introduces no SSR,
Astro adapter, or server-side Astro runtime. The edge must provide a simple
static/public liveness target; its exact path belongs to staging-composition
implementation.

## API RUNTIME

The private `api` service runs the existing Hono executable and existing server
runtime through `runServerProcess(...)`; this executable is not redesigned.
Listener configuration remains separate from public identity:

```text
PUBLIC_WEB_ORIGIN=https://staging.natalnode.com
HOST=0.0.0.0
PORT=<Railway-injected internal service port>
```

The conceptual private edge upstream is:

```text
API_UPSTREAM=http://<api-private-domain>:<api-port>
```

`WEB-DEPLOY-002B` may expose `API_UPSTREAM` as one edge-only, non-secret,
server-side value assembled with Railway service reference variables. It must
not hardcode the private hostname or enter browser JavaScript. If Caddy can
consume the Railway references directly, no additional edge variable is
required. Internal edge-to-API HTTP is sufficient; internal TLS is not
required within this Railway environment.

## POSTGRESQL

P0 staging uses Railway PostgreSQL in the same staging project/environment and
selected region where supported. The API receives the Railway-generated
`DATABASE_URL` through a service/environment reference and prefers private
networking. The existing PostgreSQL pool and repository runtime is unchanged.
No production database decision is made here.

## MIGRATION LIFECYCLE

The API service uses Railway's pre-deploy lifecycle:

```text
API build succeeds
  -> pre-deploy: npm run db:migrate
  -> migration success is required
  -> new API deployment may start or be promoted
```

A failing migration must fail pre-deploy and prevent the new deployment from
proceeding. Migrations never run from application startup,
`createServerBootstrap(...)`, `runServerProcess(...)`, `/api/health`, or Caddy.

The current root `npm run db:migrate` is compatible: its npm lifecycle first
runs `build:server`, then invokes the explicit migration executable, which uses
the dedicated migration pool and closes it. Because that executable currently
calls `loadServerEnvironment()`, the pre-deploy phase must receive all current
parser-owned API variables in the environment table below even though the
migration runner consumes only the PostgreSQL configuration. No script change
is required by this decision.

## RESEND / EMAIL

Resend remains the P0 staging transactional email provider. `RESEND_API_KEY`
and `AUTH_EMAIL_FROM`, plus all auth runtime configuration below, belong only to
the API service. They must not enter Caddy, the Astro build, browser code, or
shared contracts.

The preferred authentication sending domain remains `auth.natalnode.com`, with
the conceptual sender `NatalNode <signin@auth.natalnode.com>`. Operational
prerequisites are a verified Resend sending identity, required DNS verification,
SPF, DKIM, appropriate DMARC, provider open/click tracking disabled as required
by `WEB-AUTH-002A`, and live staging magic-link delivery validation. This ADR
performs none of those operations.

## ENGINECLIENT MODE

The API service must set:

```text
ENGINE_CLIENT_MODE=development-mock
```

This is the only currently accepted executable mode and binds the existing
`MockEngineClient` behind the server's `EngineClient`. Browser calculation
still traverses `HttpEngineClient -> /api/chart -> Hono -> EngineClient`.
Staging is development/research only; this does not select a production Engine,
Engine URL, astronomy provider, or production scientific configuration.

Existing `UI DEVELOPMENT ONLY`, `NOT SCIENTIFIC EVIDENCE`,
`NOT PRODUCTION ASTRONOMY`, and `INCOMPLETE_RESEARCH` warnings remain mandatory
where supplied by the current result contract.

## BIRTH RESOLVER STATUS

Staging continues to use `DevelopmentBirthInputResolver` with its explicit
`UI DEVELOPMENT ONLY — NOT HISTORICAL TIMEZONE EVIDENCE — NOT PRODUCTION
RESOLUTION` provenance. Its fixtures and safe `UNKNOWN_TIME` presentation are
integration behavior, not production location or historical-timezone
resolution. No production geocoder or timezone provider is selected.

## ENVIRONMENT CONTRACT

Every name below except the permitted future edge-only `API_UPSTREAM` is the
exact current executable/parser name. Values marked optional are optional in
the current parser; all other API values are required.

| Variable or reference | Owner | Classification | Staging contract |
| --- | --- | --- | --- |
| `API_UPSTREAM` | Edge service only, if needed | Non-secret; server-side | Railway references resolving to private API domain and port; never browser/build-time public |
| `DATABASE_URL` | Postgres-generated reference -> API | Secret connection credential | Railway PostgreSQL private connection reference |
| `PUBLIC_WEB_ORIGIN` | API | Non-secret | `https://staging.natalnode.com` |
| `HOST` | API | Non-secret | `0.0.0.0` internal listener |
| `PORT` | API | Non-secret | Railway-injected/internal listener port |
| `DATABASE_SSL_ENABLED` | API | Non-secret | Strict `true` or `false` selected for the Railway database connection path |
| `DATABASE_POOL_MAX` | API | Non-secret, optional | Positive-integer pool tuning when required |
| `DATABASE_IDLE_TIMEOUT_MS` | API | Non-secret, optional | Non-negative-integer pool tuning when required |
| `DATABASE_CONNECTION_TIMEOUT_MS` | API | Non-secret, optional | Non-negative-integer pool tuning when required |
| `AUTH_MAGIC_LINK_TTL_SECONDS` | API | Non-secret | Positive-integer authentication policy |
| `AUTH_SESSION_TTL_SECONDS` | API | Non-secret | Positive-integer authentication policy |
| `AUTH_SESSION_COOKIE_NAME` | API | Non-secret | Non-empty server cookie name |
| `AUTH_SESSION_COOKIE_SECURE` | API | Non-secret | `true` |
| `RESEND_API_KEY` | API | Secret | Resend credential; API only |
| `AUTH_EMAIL_FROM` | API | Non-secret sender configuration | Verified authentication sender; API only |
| `ENGINE_CLIENT_MODE` | API | Non-secret | `development-mock` |
| Build-time public variables | Astro build/browser | None | No staging runtime value or secret is exposed to the static build |

`LOCAL_PUBLIC_PORT` is exclusively repository-local development composition.
It is not a Railway staging variable and must not be reused in staging.

## COOKIE / ORIGIN SECURITY

The effective staging session-cookie contract is:

- `HttpOnly`
- `Secure` through `AUTH_SESSION_COOKIE_SECURE=true`
- `SameSite=Lax`
- `Path=/`
- host-only, with no `Domain` attribute

`Domain=.natalnode.com`, `SameSite=None`, browser bearer tokens, and browser
session-token storage are prohibited.

For unsafe `POST`, `PATCH`, and `DELETE` requests under `/api/*`, Hono continues
to require the incoming canonical `Origin` to exactly equal
`PUBLIC_WEB_ORIGIN`, hence `https://staging.natalnode.com`. Caddy must forward
the incoming `Origin` unchanged. The check is not disabled for staging and no
CORS support is added.

## DNS / TLS

`staging.natalnode.com` attaches only to `web-edge`. Railway custom-domain
setup requires the DNS records Railway supplies; Railway manages the public TLS
certificate. This ADR makes no DNS changes and does not change production apex
behavior. Externally accessible staging is HTTPS-only. Railway may terminate
TLS at its public networking edge, while Caddy-to-API traffic uses private HTTP.

## STAGING INDEXING

Staging is globally non-indexable. The staging edge implementation must emit:

```text
X-Robots-Tag: noindex, nofollow
```

for all staging responses, including Learn/SEO pages. This is a staging-only
edge rule; frontend SEO behavior is not changed by this ADR.

## MINIMUM HARDENING GATE

Railway resources may be provisioned after this ADR, but broad externally
accessible staging validation must not be treated as ready until a minimum
public-staging hardening task evaluates and implements the required controls.
Current source does not comprehensively provide:

- rate limiting, particularly for `POST /api/auth/email/request`,
  `POST /api/auth/email/complete`, `POST /api/chart`,
  `POST /api/vault/charts`, and other mutations as appropriate;
- baseline security response headers and CSP;
- safe request correlation IDs; or
- minimal privacy-safe structured request/error logging that cannot leak birth,
  authentication, token, or chart payloads.

Exact limits require the hardening task; this ADR does not invent them or
select an observability vendor.

## HEALTH

- API: `GET /api/health` remains lightweight process liveness only. It is not
  dependency readiness and must not add PostgreSQL, Resend, migration, or
  Engine checks.
- Edge: `web-edge` must expose a simple static/public liveness target without
  application business logic.

## STAGING VALIDATION PLAN

After hardening, composition, provisioning, configuration, migration, and
deployment, validate in this order:

1. The HTTPS staging page loads.
2. Static Astro routes resolve.
3. An unknown `/api` path reaches Hono, not Astro.
4. `GET /api/health` succeeds.
5. A same-origin `POST /api/chart` reaches Hono.
6. A cross-origin unsafe API request is rejected.
7. Development/research chart-result warnings remain visible.
8. `UNKNOWN_TIME` presentation remains safe.
9. Email Magic Link request sends successfully.
10. The magic link completes on the staging origin.
11. The session cookie is HttpOnly, Secure, SameSite=Lax, and host-only.
12. The auth session endpoint succeeds.
13. Vault Save succeeds.
14. The server independently recalculates before persistence.
15. Vault List succeeds.
16. Vault Open loads the persisted canonical result.
17. Logout succeeds.
18. PostgreSQL persistence survives an application redeploy/restart.
19. If practical, migration failure prevents deployment in a controlled,
    non-destructive scenario.

This ADR performs none of these tests.

## WHAT STAGING VALIDATES

Staging can validate deployment topology, HTTPS, same-origin browser/API
routing, the HTTP `EngineClient` path, Hono process execution, Origin security,
cookie behavior, Resend integration, PostgreSQL persistence, migrations, Auth,
Vault, product navigation, and browser/BFF integration.

## WHAT STAGING DOES NOT VALIDATE

Staging does not validate production astronomy accuracy or licensing, a
production Engine provider, production scientific configuration identity,
production provenance completion, production birth-location resolution, a
production historical-timezone provider, final SEO launch state, or the
production hosting choice.

## DEFERRED PRODUCTION DECISIONS

```text
P0 STAGING HOSTING PROVIDER: RAILWAY
PRODUCTION HOSTING PROVIDER: NOT SELECTED

PRODUCTION ASTRONOMY: BLOCKED-BY-EXTERNAL-GATE
PROVIDER DECISION DEFERRED

Production birth location/timezone: DATA-SOURCE DECISION DEFERRED
DevelopmentBirthInputResolver: STAGING-ONLY DEVELOPMENT BEHAVIOR
```

## NEXT IMPLEMENTATION SEQUENCE

1. `WEB-DEPLOY-002A` topology/environment decision (this ADR).
2. Minimum public-staging security/operational hardening.
3. Railway staging composition implementation.
4. Railway resource provisioning.
5. DNS, Resend, and PostgreSQL configuration.
6. Explicit migrations.
7. Staging deploy.
8. Staging E2E validation.
9. Resolve the production location/timezone data source.
10. Resolve the production astronomy external gate.
11. Production launch architecture.

The immediate next task is:

`WEB-SEC-002A — P0 public staging security hardening`

Only after that gate is satisfied should `WEB-DEPLOY-002B` implement Railway
staging composition. Neither follow-up is implemented here.
