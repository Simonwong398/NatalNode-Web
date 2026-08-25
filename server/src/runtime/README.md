# Server runtime composition

The runtime composition root is `createServerRuntimeDependencies(...)`.
`createApp(...)` remains application/framework assembly over an already-complete
`ServerDependencies` object.

The composition root constructs internal clock, ID, token, expiration-policy,
cookie-policy, persistence, and session-authenticator dependencies. It receives
`SqlExecutor`, `EngineClient`, and `EmailMagicLinkDelivery` as explicit external
bindings; it does not select providers or read environment configuration.

The concrete PostgreSQL runtime adapter is `PostgresSqlExecutor`. It adapts an
externally constructed `pg` `Pool` to the `SqlExecutor` boundary. Pool
construction, configuration, and lifecycle remain bootstrap responsibilities;
the composition root remains driver-neutral.

The PostgreSQL lifecycle chain is:

`PostgresPoolRuntimeConfig` → `createPostgresPoolRuntime` → owned `pg.Pool` →
`PostgresSqlExecutor` → `SqlExecutor` → server runtime composition.

`PostgresPoolRuntime` owns pool creation and shutdown while exposing only
`SqlExecutor` upward. Environment parsing, migrations, readiness checks, email
delivery, provider selection, process/listener startup, and signal handling
remain deferred. Future bootstrap code should make this the single place where
runtime dependencies are wired.

Runtime configuration has one environment boundary. Supported variables are:

- `DATABASE_URL`
- `DATABASE_SSL_ENABLED`
- `DATABASE_POOL_MAX`
- `DATABASE_IDLE_TIMEOUT_MS`
- `DATABASE_CONNECTION_TIMEOUT_MS`
- `AUTH_MAGIC_LINK_TTL_SECONDS`
- `AUTH_SESSION_TTL_SECONDS`
- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_SESSION_COOKIE_SECURE`

`parseServerEnvironment(...)` is deterministic and constructs no infrastructure;
only `loadServerEnvironment()` reads `process.env`. Booleans are strict, no
defaults are invented, and secrets are never logged. Engine, email, provider,
listener, and process bootstrap configuration remain deferred.
