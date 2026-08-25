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
