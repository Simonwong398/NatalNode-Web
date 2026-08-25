# Server runtime composition

The runtime composition root is `createServerRuntimeDependencies(...)`.
`createApp(...)` remains application/framework assembly over an already-complete
`ServerDependencies` object.

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

`PostgresPoolRuntime` owns pool creation and shutdown while exposing only
`SqlExecutor` upward. Environment parsing, automatic migrations, readiness
checks, email delivery, provider selection, process/listener startup, and
signal handling remain separate boundaries. Future bootstrap code should make
this the single place where runtime dependencies are wired.

Runtime configuration has one environment boundary. Supported variables are:

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
- `PUBLIC_WEB_ORIGIN` — the explicit public origin used for browser magic-link
  URLs; production uses HTTPS and local HTTP is limited to loopback origins.

`parseServerEnvironment(...)` is deterministic and constructs no infrastructure;
only `loadServerEnvironment()` reads `process.env`. Booleans are strict, no
defaults are invented, and secrets are never logged. `PUBLIC_WEB_ORIGIN` is
provider-neutral and is never inferred from `HOST` or `PORT`. Concrete email
provider configuration remains deferred.

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
PostgreSQL. `SIGINT` and `SIGTERM` handlers are installed only by the opt-in
`runServerProcess()` function; it never calls `process.exit()`.

An executable migration entrypoint or CLI, concrete EngineClient and email
provider, readiness policy, and startup/fatal logging remain deferred.

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
wrappers. The runtime is forward-only and does not include a migration CLI.
