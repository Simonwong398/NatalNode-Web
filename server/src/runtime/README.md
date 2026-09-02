# Server runtime composition

The runtime composition root is `createServerRuntimeDependencies(...)`.
`createApp(...)` remains application/framework assembly over an already-complete
`ServerDependencies` object.

`ServerDependencies.publicWebOrigin` is copied from the validated runtime
configuration. `createApp(...)` registers one outer middleware boundary for
unsafe `POST`, `PATCH`, and `DELETE` requests under `/api/*`; each must carry
the exact canonical public origin before route authentication or business
behavior runs. The boundary does not parse request bodies, trust host or
forwarded headers, add CORS, or implement CSRF tokens. `GET` and `HEAD` remain
unaffected.

The complete API middleware order is server-owned request ID and privacy-safe
completion logging, centralized API response headers, exact unsafe-request
Origin enforcement, process-local P0 staging rate limiting, then existing
route authentication and business behavior. Every `/api` and `/api/*` response
receives a newly generated `X-Request-Id` plus `Cache-Control: no-store`,
`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and
`X-Frame-Options: DENY`. Incoming request IDs are ignored, and no CORS or JSON
CSP is added.

The P0 limiter reads only the edge-overwritten `X-NatalNode-Client-IP` header.
It does not trust generic forwarding headers. Valid client addresses are used
transiently to derive per-process HMAC keys; raw addresses are neither logged
nor persisted. Missing or malformed values share `direct-or-unknown`. Fixed
staging defaults are 5 requests per 10 minutes for email-link request, 10 per
10 minutes for email-link completion, 20 per 10 minutes for chart calculation,
and 60 per 10 minutes for all existing Vault mutations. State expires lazily,
is capped at 10,000 client-policy keys, and rejects new identities when active
capacity is full. It is non-persistent and deliberately single-process:
multiple API replicas multiply effective limits and require a later
distributed/edge policy review.

Operational completion records contain only timestamp, level, bounded event,
server request ID, bounded method, bounded endpoint family, status, and
duration. Unhandled-error records omit the error object, message, stack, and
cause. Bodies, response payloads, query strings, dynamic resource IDs, headers,
cookies, tokens, email/birth/chart/Vault data, and client addresses are outside
the logging schema. Logging output failures do not change request behavior.

The composition root constructs internal clock, ID, token, expiration-policy,
cookie-policy, persistence, session-authenticator, and provider-neutral
magic-link URL-builder dependencies. It receives `SqlExecutor`, `EngineClient`,
and `EmailMagicLinkDelivery` as explicit external bindings; it does not select
providers or read environment configuration.

The concrete PostgreSQL runtime adapter is `PostgresSqlExecutor`. It adapts an
externally constructed `pg` `Pool` to the `SqlExecutor` boundary. Pool
construction, configuration, and lifecycle remain bootstrap responsibilities;
the composition root remains driver-neutral.

The PostgreSQL lifecycle chain is:

`PostgresPoolRuntimeConfig` → `createPostgresPoolRuntime` → owned `pg.Pool` →
`PostgresSqlExecutor` → `SqlExecutor` → server runtime composition.

`PostgresPoolRuntime` owns pool creation and shutdown while exposing the
`SqlExecutor` and dedicated account-export repository upward. Environment parsing, automatic migrations, readiness
checks, email delivery, provider selection, process/listener startup, and
signal handling remain separate boundaries. Future bootstrap code should make
this the single place where runtime dependencies are wired.

Runtime configuration has one environment boundary. Supported variables are:

- `NATALNODE_RUNTIME_MODE` — explicit `local`, `staging`, or `production`
  mode; production must be declared rather than inferred from `NODE_ENV`.
- `NATALNODE_RATE_LIMIT_AUTHORITY` — `process-local` for local or explicitly
  single-replica staging, or `distributed` for a future production/edge
  authority.
- `NATALNODE_SINGLE_REPLICA_CONFIRMED` — explicit staging/local confirmation
  when the process-local limiter is used.
- `HOST`
- `PORT`
- `DATABASE_URL`
- `DATABASE_SSL_ENABLED`
- `DATABASE_POOL_MAX`
- `DATABASE_IDLE_TIMEOUT_MS`
- `DATABASE_CONNECTION_TIMEOUT_MS`
- `AUTH_MAGIC_LINK_TTL_SECONDS`
- `AUTH_SESSION_TTL_SECONDS`
- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_SESSION_COOKIE_SECURE`
- `AUTH_EMAIL_ENABLED`
- `AUTH_GOOGLE_ENABLED`
- `GOOGLE_OIDC_ISSUER`, `GOOGLE_OIDC_CLIENT_ID`, and
  `GOOGLE_OIDC_CLIENT_SECRET` when Google Sign-In is enabled.
- `GOOGLE_OIDC_REDIRECT_URI` — optional exact-match assertion for the derived
  `/api/auth/google/callback` URI.
- `COMMUNITY_ENABLED` and `COMMUNITY_OPERATOR_CONFIGURED`
- `PRACTITIONER_ENABLED` and `PRACTITIONER_OPERATOR_CONFIGURED`
- `NATALNODE_OBSERVABILITY_DURABLE_SINK_CONFIGURED`
- `NATALNODE_PRIVACY_ACCESS_AUDIT_REQUIRED`
- `PUBLIC_WEB_ORIGIN` — the explicit public origin used for browser magic-link
  URLs; production uses HTTPS and local HTTP is limited to loopback origins.

`parseServerEnvironment(...)` is deterministic and constructs no infrastructure;
only `loadServerEnvironment()` reads `process.env`. Boolean values are strict.
Local mode defaults to the existing development-safe behavior; staging and
production require explicit operational evidence where a default could make a
deployment claim unsafe. Production rejects incomplete Auth, database/SSL,
origin, rate-limit, observability, audit, and mock-Engine boundaries. Secrets
are never logged. `PUBLIC_WEB_ORIGIN` is provider-neutral and is never inferred
from `HOST` or `PORT`. Resend credentials and sender identity are supplied
explicitly by the executable deployment composition rather than added to this
environment boundary.

## P0 Resend email delivery

P0 email delivery uses the official `resend@6.22.1` Node.js SDK. The deployment
composition edge supplies explicit `apiKey` and `from` values through this
chain:

```text
apiKey + from
  → createResendEmailMagicLinkDelivery(...)
  → EmailMagicLinkDelivery
  → ServerBootstrapBindings
```

The adapter receives the final application-generated magic-link URL, never a
raw token. It sends one provider request, adds no retry or application logging,
and reports provider or malformed-result failures as a generic infrastructure
error. Credentials and sender identity remain at the deployment edge; they are
not read from `process.env` here.

The installed SDK message options do not expose per-message open/click tracking
controls. Resend deployment configuration for `auth.natalnode.com` must
disable both tracking modes for authentication email. Domain verification,
DNS records, and tracking configuration are operational deployment work and
are not automated by this repository.

The complete bootstrap composition chain is:

`loadServerEnvironment` → `createPostgresPoolRuntime` →
`createServerRuntimeDependencies` → `createApp` → `ServerBootstrap`.

`ServerBootstrap` owns the PostgreSQL runtime and exposes only `app` and
`close()`. `EngineClient` and `EmailMagicLinkDelivery` are externally supplied
and borrowed; they have no bootstrap lifecycle here. Migration execution is
explicit and separate from bootstrap. Readiness checks, HTTP listener and
`HOST`/`PORT` configuration, signal handling, and concrete Engine/email
providers remain separate runtime boundaries.

The process runtime extends the chain:

`loadServerEnvironment` → `ServerBootstrap` → official Hono Node HTTP listener
→ `ServerProcessRuntime`.

`HOST` and `PORT` are explicit configuration with no defaults. The process
runtime closes the listener first and then the bootstrap, which closes
PostgreSQL. `runServerProcess()` and local composition share one opt-in signal
shutdown helper for `SIGINT` and `SIGTERM`; neither calls `process.exit()`.

Readiness policy and production astronomy-provider composition remain separate
runtime work.

## Executable commands

The repository compiles executable Node.js ESM with the existing TypeScript
compiler. The supported root commands are:

- `npm run server:start` — compile the server runtime and start the internal
  Hono listener through `runServerProcess(...)`.
- `npm run db:migrate` — compile the server runtime and run the existing
  PostgreSQL migration runner as a separate operation.
- `npm run dev:local` — build the static Astro artifact and server runtime, then
  start one local public edge plus the internal Hono listener.
- `npm run dev:public` — build the static Astro artifact and server runtime,
  then start one public-development local edge plus a reduced Hono listener
  that uses the existing development fixtures without PostgreSQL or email
  credentials.

`npm run server:start`, `npm run db:migrate`, and `npm run dev:local` use the
existing required server environment variables listed above. API and local
execution additionally require:

- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM`
- `ENGINE_CLIENT_MODE=development-mock`

The only accepted Engine mode is deliberately development-only and constructs
the existing `MockEngineClient`. It is not a production astronomy selection.
`PROVIDER DECISION DEFERRED` remains in force.

Local composition additionally requires `LOCAL_PUBLIC_PORT` and requires
`PUBLIC_WEB_ORIGIN` to equal `http://localhost:<LOCAL_PUBLIC_PORT>`. `HOST` and
`PORT` continue to identify only the internal Hono listener and `PORT` must
differ from `LOCAL_PUBLIC_PORT`. The local edge serves `apps/web/dist` for
normal routes and assets and proxies every `/api` and `/api/*` request without
adding CORS. Build and startup are separate from database migration execution.

Public-development composition is intentionally separate from the complete
local composition. It uses code-owned defaults and one canonical browser
origin:

```text
http://localhost:4321
```

The public edge listens on `localhost:4321` and proxies to a loopback-only
Hono listener on `127.0.0.1:4322`. `npm run dev` remains the Astro-only
frontend preview and does not provide BFF behavior. Public-development mode is
anonymous: `/api/auth/session` reports `authenticated: false`, protected
routes remain unauthorized, and magic-link authentication is unavailable.
Open the public-development runtime at the canonical localhost origin rather
than the internal API port or an alternate `127.0.0.1:4321` browser origin.

## Explicit PostgreSQL migration runtime

Deployments may call `runPostgresMigrations(postgresConfig, migrationsDirectory)`
explicitly, wait for its dedicated migration pool to close, and then start the
web process separately. Web startup never runs migrations automatically.

The runner uses one PostgreSQL session-level advisory lock to serialize
concurrent migration runners. Applied migrations are immutable by version,
filename, and full-artifact SHA-256 checksum; BOM and line-ending differences
are normalized before hashing. The current `0001`–`0003` files remain legacy
transaction-wrapped artifacts: the complete canonical artifact is checksummed,
and only a recognized outer `BEGIN;` / `COMMIT;` boundary is removed for
execution. The runner owns the per-migration transaction so schema effects and
tracking metadata commit atomically. Future migrations should omit transaction
wrappers. The runtime is forward-only; `npm run db:migrate` is the thin
executable edge over this existing migration behavior.
