# ADR: Web / API Deployment Topology

- Status: ACCEPTED — one public origin; deployment edge owns the static/API route split
- Task: `WEB-DEPLOY-001A`
- Date: 2026-08-25
- Browser origin policy: SAME ORIGIN
- Static frontend owner: DEPLOYMENT EDGE
- Production hosting provider: NOT SELECTED
- P0 staging provider: selected separately by `WEB-DEPLOY-002A`
- Email provider: RESEND selected for P0
- Astronomy provider: PROVIDER DECISION DEFERRED

## STATUS

Accepted for P0. This ADR freezes the browser-visible topology and ownership
boundaries, which remain authoritative. Subsequent work implemented the
executable/local-composition foundation, and `WEB-DEPLOY-002A` separately
selects the P0 staging provider. This ADR does not select production hosting or
implement deployment.

## CONTEXT

The Astro application builds a static artifact and its hydrated browser code
calls relative `/api/...` endpoints with `credentials: 'same-origin'`. The Hono
application owns `/api/health`, chart, authentication, Vault, and Vault-note
routes. Authentication uses an HttpOnly, host-only, `SameSite=Lax` cookie.

The server provides environment parsing, PostgreSQL and migration runtimes,
Resend delivery, bootstrap/process/listener primitives, explicit `EngineClient`
and `EmailMagicLinkDelivery` bindings, a concrete executable/start command, and
a repository-local same-origin composition edge. Provider-specific staging
composition remains separate deployment work.

## DECISION

P0 uses one browser-visible public origin. The deployment composition edge owns
the path split:

- `/api/*` is routed to the Hono BFF process.
- All other public routes and assets are served from the Astro static artifact.

The static and API workloads may be separate internally, but that separation is
invisible to the browser. `createApp(...)` remains API-focused. Browser code
keeps relative `/api/...` URLs and no public API-origin setting is introduced.

## PUBLIC TOPOLOGY

```text
browser
  -> https://<public-origin>
       |-- normal routes/assets -> Astro static artifact
       `-- /api/*               -> Hono BFF
                                      |-- PostgreSQL
                                      |-- EmailMagicLinkDelivery
                                      `-- EngineClient
```

The public web origin and public API origin are identical. Internal process
addresses, ports, and service names are not browser contracts.

Existing browser flows remain unchanged:

- `/auth/sign-in` posts to `/api/auth/email/request`; the email link targets
  `PUBLIC_WEB_ORIGIN/auth/complete#token=...`; `/auth/complete` posts to
  `/api/auth/email/complete`; navigation and logout use the existing session
  endpoints.
- `/vault` and `/vault/chart?chartId=...` continue to call the existing
  same-origin Vault endpoints for save, list, and open operations.
- Browser chart calculation uses `HttpEngineClient` over the same-origin
  `/api/chart` BFF path. The current executable's explicitly development-only
  server binding uses `MockEngineClient` behind that API boundary.

## ROUTE OWNERSHIP

| Public path | Owner |
| --- | --- |
| `/`, `/auth/*`, `/vault`, `/vault/chart`, `/learn/*`, `/tools/*`, and static assets | Astro static artifact |
| `/api/*`, including unknown API paths | Hono BFF |

The deployment edge must route every `/api/*` request to Hono so the API's own
not-found and error behavior remains authoritative. An unknown `/api/*` path
must never fall through to a static page. Normal web paths must not be handled
as Hono business routes.

## STATIC FRONTEND OWNERSHIP

The frontend source is `apps/web`, and its deployment artifact is the current
Astro static build output. Astro remains static: no SSR output and no server
adapter are introduced.

The deployment edge serves and may cache the static artifact. Hono application
code does not know the artifact's filesystem path and does not serve frontend
files. A repository-local gateway used for development may serve or proxy the
artifact, but that gateway remains deployment composition outside
`createApp(...)`.

## API OWNERSHIP

`createApp(...)` continues to represent Website API/BFF behavior only. It owns
the `/api/*` route implementations and does not know about static files, CDN
behavior, proxy products, or hosting vendors.

`GET /api/health` remains lightweight process liveness. It does not check
PostgreSQL, migration state, Resend, or Engine readiness. Any readiness policy
or endpoint requires a separate explicit task.

## ORIGIN / CORS POLICY

The P0 browser/API contract is same-origin. Browser code continues to use
relative `/api/...` URLs; `PUBLIC_API_URL` is not introduced.

No general browser CORS support is provided. In particular, the API must not
emit wildcard origins or support a separate browser API origin. Internal path
routing does not require CORS. A future cross-origin browser API would require
a separate architecture and security review.

The Hono application does not derive security or URL identity from `Host`,
`Forwarded`, `X-Forwarded-Host`, or `X-Forwarded-Proto`. The public edge must
preserve `/api/*` paths, methods, request bodies, `Origin`, cookies, response
status, and response headers including `Set-Cookie` and `Cache-Control`.

## COOKIE / CSRF POLICY

The current session-cookie shape is preserved:

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- host-only, with no `Domain` attribute
- `Secure` enabled for externally accessible HTTPS staging and production

P0 does not use `SameSite=None`, browser bearer tokens, or session-token browser
storage.

Same-origin routing, `SameSite=Lax`, host-only cookies, and JSON request bodies
reduce CSRF exposure, but they are not the sole authorization boundary. Before
externally accessible staging, a small API-boundary security patch must require
the request `Origin` to exactly equal `PUBLIC_WEB_ORIGIN` for unsafe `/api/*`
methods (`POST`, `PATCH`, and `DELETE`) and reject absent or mismatched origins.
No CSRF-token framework is required for this P0 same-origin browser contract.

## PUBLIC_WEB_ORIGIN

`PUBLIC_WEB_ORIGIN` is the externally visible browser origin, for example
`https://natalnode.com` in production or
`http://localhost:<public-local-port>` locally. It remains authoritative for
magic-link browser URLs and is the expected origin for the required unsafe
request check.

It is not a database origin, internal API address, container name, or Hono bind
address. It must not be inferred from `HOST`, `PORT`, request host headers, or
forwarded headers.

`HOST` and `PORT` describe only the internal Node listener. A binding such as
`0.0.0.0:3000` does not define or imply the public browser origin. Current P0
application behavior does not require trusted forwarded headers.

## RUNTIME BINDINGS

The executable/deployment composition edge constructs concrete external
bindings and passes them through `ServerBootstrapBindings`:

```text
deployment secrets/configuration
  -> EmailMagicLinkDelivery (Resend for P0)
  +  EngineClient
  -> ServerBootstrapBindings
  -> runServerProcess(...)
```

Resend API credentials and sender configuration remain at that edge and do not
move into routes, contracts, or `ServerRuntimeConfig`.

The concrete `EngineClient` is also constructed at that edge. Staging may use
an explicitly development-only EngineClient while production astronomy is
unapproved. Production provider selection is not part of this decision.

## DATABASE / MIGRATION LIFECYCLE

Database configuration continues through the existing environment parser into
`PostgresPoolRuntime`. Server bootstrap owns the application pool and closes it
on shutdown. The pool and persistence abstractions are unchanged.

Migrations remain a separate release operation using the existing migration
runtime and its dedicated pool. They run before application start or promotion;
they are never invoked by `createServerBootstrap(...)`, `runServerProcess(...)`,
or `/api/health`.

The P0 release order is:

1. Provide validated environment configuration and provider secrets.
2. Run explicit database migrations and require success.
3. Build and deploy the Astro static artifact.
4. Construct concrete `EmailMagicLinkDelivery` and `EngineClient` bindings.
5. Start the Hono API process.
6. Route public `/api/*` traffic to Hono under the same public origin.
7. Validate `/api/health` liveness.
8. Perform staging end-to-end validation before promotion.

## LOCAL DEVELOPMENT

Local development must expose one browser-visible loopback origin. A
repository-supported local composition edge routes `/api/*` to an internal Hono
listener and all other routes/assets to the Astro development server or static
artifact. Separate internal ports or processes are allowed; the browser does
not call them directly.

`PUBLIC_WEB_ORIGIN` is the local public edge origin. The local composition is
responsible for preserving the production route split without requiring a
commercial hosting product. Local HTTP is limited to loopback development.

## STAGING

Staging preserves the production browser security model:

- one externally visible HTTPS origin;
- relative `/api/...` browser requests;
- `/api/*` routed to Hono and all other routes/assets to static Astro;
- host-only HttpOnly `SameSite=Lax` cookie with `Secure` enabled;
- explicit `PUBLIC_WEB_ORIGIN` matching the staging browser origin; and
- no general browser CORS support.

An explicitly labeled development/research EngineClient may be used until the
production astronomy gate is satisfied.

## PRODUCTION

Production uses the same logical topology and security contract as staging.
The deployment edge may be implemented by any provider-neutral path-routing
composition that serves the static artifact and privately reaches the Hono API
process. The browser-visible origin and route ownership do not change.

`HOSTING PROVIDER: NOT SELECTED`

`Astronomy provider: PROVIDER DECISION DEFERRED`

Production public chart calculation remains `BLOCKED-BY-EXTERNAL-GATE` until
the PRD's Engine production gates are satisfied.

## SECURITY INVARIANTS

- Browser API access remains same-origin and relative.
- Session credentials remain in a host-only HttpOnly cookie.
- No bearer session token or auth token is stored in browser storage.
- `PUBLIC_WEB_ORIGIN` is explicit and is not inferred from request headers.
- Unsafe API requests receive an exact-origin check before external staging.
- No general browser CORS support is enabled.
- Provider credentials exist only at the executable/deployment edge.
- Vault access remains authenticated and user-scoped.
- No production astronomy logic or provider credentials enter the browser or
  static frontend artifact.

## DEFERRED ITEMS

- Production-hosting selection and provider-specific staging deployment
  configuration.
- Provider-specific staging composition and externally accessible staging
  provisioning/validation.
- A separate readiness policy or endpoint.
- Production EngineClient and astronomy-provider selection:
  `PROVIDER DECISION DEFERRED`.

Implemented follow-through now includes the concrete API executable and package
scripts, explicit migration command, repository-local same-origin composition,
exact-origin middleware for unsafe `/api/*` methods, browser
`HttpEngineClient -> /api/chart`, and safe `UNKNOWN_TIME` presentation policy.

## FOLLOW-UP STATUS

The originally identified executable/composition foundation is implemented.
`WEB-DEPLOY-002A` selects the provider-specific P0 staging topology and
environment contract while preserving every architectural decision in this
ADR.

Future staging work must not re-decide the same-origin policy, route ownership,
cookie model, CORS policy, static ownership, or migration/start ordering. A
staging-provider selection remains distinct from production hosting and
production astronomy-provider decisions.
