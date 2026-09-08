# NatalNode Production Runtime Composition V1

Status: implementation boundary frozen for `WEB-P0-PREPROD-RUNTIME-HARDENING-001`

Baseline: `79394b94f17addeb39b7f4bfaac3269682d74553`

## 1. Scope and current admission state

This document describes the Web repository runtime only. It does not access or
admit the NatalNode Engine, choose an astronomy provider, or integrate
`natalnode-app`.

The production Engine boundary is intentionally closed:

```text
PRODUCTION_ENGINE_CLIENT_ADMISSION = NOT_ADMITTED
```

Configuration being present is not equivalent to an Engine runtime being
admitted. `NATALNODE_ENGINE_URL`, when supplied to a preflight fixture, is
reported only as configured; it is never consumed to construct a client.

## 2. Runtime modes

The Web server keeps the existing environment values `local`, `staging`, and
`production` for compatibility. They map to three compositions:

| Composition | Entry point | Dependency policy |
| --- | --- | --- |
| `DEVELOPMENT` | `dev:public` | Code-owned public-development fixtures; no production claim, database, or email sender. |
| `LOCAL_INTEGRATION` | `dev:local` and the non-production executable mode | Explicit local PostgreSQL, process-local limiter, Resend adapter configuration, and `MockEngineClient`. |
| `PRODUCTION` | `server:start` | Explicit production configuration only; no mock, fixture, research, or local adapter admission. Current startup stops before listener creation because Engine composition is not admitted. |

There is no fallback from production to either non-production composition.

## 3. Executable and composition roots

The runtime graph is:

```text
server:start
  -> server-main
  -> loadProductionRuntimeConfig
  -> assertProductionRuntimeAdmission
  -> deterministic bounded failure (no listener)

dev:local
  -> build:local
  -> local-main
  -> loadServerEnvironment + local executable config
  -> explicit development bindings
  -> PostgreSQL schema compatibility preflight
  -> createApp
  -> Hono listener + local public edge
  -> one waitForProcessShutdown path

dev:public
  -> public-development-main
  -> code-owned public-development dependencies
  -> createApp
  -> Hono listener + local public edge
  -> one waitForProcessShutdown path

db:migrate
  -> migration-main
  -> explicit PostgreSQL migration runner
```

`createServerRuntimeDependencies(...)` remains the application composition
root for a complete PostgreSQL-backed server. It receives typed bindings; it
does not select providers or read environment variables. `server:start` does
not call it until a separately reviewed production Engine binding exists.

## 4. Canonical configuration boundary

`parseServerEnvironment(...)` owns the shared typed server environment:

- PostgreSQL URL, SSL, pool limits, and connection timeout;
- host and port;
- canonical `PUBLIC_WEB_ORIGIN`;
- authentication TTLs and cookie policy;
- Google configuration when enabled;
- operational, rate-limit, audit, observability, GeoNames, and Web Push state.

`parseProductionRuntimeConfig(...)` is the production-only extension. It calls
the shared parser once, requires `RESEND_API_KEY` and `AUTH_EMAIL_FROM`, rejects
obvious placeholder sender credentials, rejects development `ENGINE_CLIENT_MODE`,
and returns a typed production boundary. The secret-bearing values stay in the
typed boundary and are never included in diagnostics.

The production executable performs configuration parsing before any listener,
Pool, Engine client, email sender, or fallback can be constructed. Invalid
configuration is a startup/preflight error, not a later request error.

### Configuration classification

| Class | Repository truth |
| --- | --- |
| `REQUIRED_PRODUCTION` | `NATALNODE_RUNTIME_MODE=production`, `HOST`, `PORT`, `PUBLIC_WEB_ORIGIN` (HTTPS), `DATABASE_URL`, database SSL, auth TTL/cookie values, enabled production auth configuration, distributed rate-limit declaration, durable observability declaration, privacy-audit declaration, `RESEND_API_KEY`, and `AUTH_EMAIL_FROM`. Google fields are required when Google auth is enabled. |
| `OPTIONAL_PRODUCTION` | PostgreSQL pool tuning, GeoNames account, Web Push capability, exact Google redirect assertion, and an Engine URL as configuration metadata only. None silently supplies a provider or admission. |
| `DEVELOPMENT_ONLY` | `dev:public` fixture chart/sky composition, public-development unavailable auth/persistence methods, and all mock/fixture behavior. |
| `LOCAL_INTEGRATION_ONLY` | `ENGINE_CLIENT_MODE=development-mock`, local executable Resend configuration, `LOCAL_PUBLIC_PORT`, and the local public edge. |

The public origin is one normalized authority. It is the source for magic-link
URL construction and same-origin unsafe API enforcement; it is never inferred
from host headers, forwarded headers, or a separate browser setting.

## 5. Dependency admission

| Dependency | Configured state | Admission rule |
| --- | --- | --- |
| Engine | Optional metadata may be present. | `NOT_ADMITTED` in production. Mock and research clients are local-only. |
| PostgreSQL | Typed configuration is required in production; the real bootstrap owns a `pg.Pool`. | Pool creation and read-only schema compatibility are startup-owned. Preflight does not connect. Migration remains a separate command. |
| Cache | The existing chart cache is an in-process performance layer. No Redis authority is configured. | Cache misses, absence, expiry, or corruption cannot change correctness authority. |
| Rate limiting | Local composition is `process-local`; production declares `distributed`. | The current process-local implementation is never reported as distributed. Production HTTP admission remains closed until the distributed authority is actually bound. |
| Email | Production credentials are parsed but no production sender is constructed by the current entrypoint. | Local Resend construction is explicit and development-only for this boundary. No live delivery is performed by this patch. |
| Auth | Session auth is composed from PostgreSQL in the complete runtime; Google remains an optional external-gated binding. | No test/public auth adapter is production-admitted. Missing or incomplete provider bindings fail closed. |

## 6. Liveness and readiness

`GET /api/health` is liveness. It reports only that the app is functioning and
does not probe every dependency.

`GET /api/ready` is readiness. It returns `200` only for an explicitly
admitted non-production composition. A production composition without the
admitted Engine returns `503` with the bounded body `{ "status": "not_ready" }`.
The response does not expose reasons, credentials, URLs, stacks, or provider
details. The internal preflight report carries bounded reason codes.

The current production entrypoint stops before a listener exists, so it cannot
produce a false green readiness state. A future Engine admission must wire
the same runtime health contract and satisfy the production operational
boundary before listener startup.

## 7. Startup, preflight, errors, and shutdown

`npm run server:preflight` is a pure configuration/admission check. Select a
profile with `NATALNODE_PREFLIGHT_PROFILE=development`,
`local-integration`, or `production`. It never binds a port, contacts Engine,
sends email, creates a PostgreSQL pool, or runs a migration. Production
preflight can therefore distinguish:

```text
configurationStatus = VALID
runtimeAdmission   = NOT_ADMITTED
readiness           = NOT_READY
```

from invalid production configuration, without claiming production readiness.

Startup failure is deterministic and occurs before listener creation. The
executable boundary emits a bounded safe diagnostic; sensitive variable names
may identify the failed contract, but values, connection credentials, API
keys, tokens, stacks, and filesystem paths are redacted.

The existing global Hono error boundary continues to return canonical Problem
Details without stack traces or raw internal errors. Request completion logs
retain a generated request ID and bounded endpoint/status fields only.

The process runtime and local/public compositions have one signal path for
`SIGINT`/`SIGTERM`. Listener and bootstrap resources are closed only when
owned, in order, with memoized close promises; deep modules do not call
`process.exit()`.

## 8. External prelaunch gates

The code boundary is ready to receive, but does not create, the following
deployment-owned dependencies:

- production PostgreSQL provisioning, backups, restore verification, and
  secret injection;
- a distributed rate-limit/edge authority;
- verified production email sender/domain and Resend operational settings;
- Google OAuth credentials and callback registration;
- durable observability sink/vendor configuration;
- production DNS/TLS and public-origin deployment;
- a reviewed, authenticated, contract-compatible Engine API.

These are `PRELAUNCH_EXTERNAL_GATE` items. They remain separate from the
current Web code gate, and no live external service is contacted by this
change.
