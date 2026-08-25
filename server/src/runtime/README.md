# Server runtime composition

The runtime composition root is `createServerRuntimeDependencies(...)`.
`createApp(...)` remains application/framework assembly over an already-complete
`ServerDependencies` object.

The composition root constructs internal clock, ID, token, expiration-policy,
cookie-policy, persistence, and session-authenticator dependencies. It receives
`SqlExecutor`, `EngineClient`, and `EmailMagicLinkDelivery` as explicit external
bindings; it does not select providers or read environment configuration.

Environment parsing, a concrete database adapter, email delivery, provider
selection, and process/listener startup remain deferred. Future bootstrap code
should make this the single place where runtime dependencies are wired.
