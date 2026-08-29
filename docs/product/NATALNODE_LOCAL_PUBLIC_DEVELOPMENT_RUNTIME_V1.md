# NatalNode Public Local Development Runtime V1

- Status: **APPROVED TECHNICAL DIRECTION / IMPLEMENTATION DEFERRED**
- Task: `WEB-LOCAL-DEV-001A`
- Date: 2026-08-28
- Product source of truth: `docs/PRD.md`
- Architecture boundary: `NatalNode.com → Website API / BFF → NatalNode Engine Public API`
- Runtime implementation authorized by this document: **ZERO**

## 1. Purpose and problem statement

The repository currently has two different local-development shapes:

1. `npm run dev` starts Astro in `apps/web` on the familiar browser origin
   `http://localhost:4321`. It is a frontend-only preview. It does not start
   Hono and it does not provide the Website API / BFF.
2. `npm run dev:local` builds the Web artifact and starts the local public edge
   plus the complete Hono runtime. The complete runtime currently requires the
   full server environment, PostgreSQL, Resend, and local origin/port
   configuration.

The frontend already contains API-backed Calculate, Public Sky, and signed-out
session flows. Opening the Astro-only preview therefore produces misleading
feature failures: the browser is pointed at a static frontend origin while
the API paths belong to Hono.

The smallest safe solution is an additive, explicitly named public-development
runtime that serves the built Astro artifact through the existing local edge,
proxies `/api/*` to a reduced Hono composition, and supplies only the existing
development fixtures and stateless unauthenticated behavior. It is not a
replacement for `npm run dev:local` and does not create a fake authenticated
environment.

This document freezes that direction. It does not implement the command,
runtime composition, adapters, route changes, or UI changes.

## 2. Source-proven current topology

The current topology is:

```text
npm run dev
    → npm --workspace=apps/web run dev
    → Astro only, normally http://localhost:4321
    → no Hono listener and no apps/web/src/pages/api/* routes

npm run dev:local
    → root predev:local runs npm run build
    → server local executable
    → loadServerEnvironment
    → loadExecutableServerConfig
    → createServerProcessRuntime
    → createServerBootstrap
    → PostgreSQL pool + complete ServerDependencies
    → Hono internal listener
    → existing local public edge
    → built apps/web/dist for normal routes, /api/* proxy to Hono
```

The relevant source boundaries are:

- `package.json` owns the current root `dev`, `dev:local`, `predev:local`, and
  build scripts.
- `server/src/executable/run-local-development-composition.ts` owns the
  complete local composition.
- `server/src/executable/local-public-edge.ts` already serves static Astro
  output and proxies `/api` and `/api/*` to an internal Hono listener. It
  listens on `localhost` and overwrites the trusted edge client-IP header from
  the socket address before forwarding.
- `server/src/runtime/create-server-runtime-dependencies.ts` eagerly creates
  PostgreSQL persistence and the full session authenticator. This is the
  current global-bootstrap coupling; it is not evidence that every public
  route needs PostgreSQL.
- `server/src/app/create-app.ts` owns the Hono middleware boundary, public
  health/chart/Sky/session routes, protected routes, Problem Details handling,
  request IDs, security headers, origin enforcement, and P0 rate limits.
- `apps/web/src/lib/engine-client.ts` uses the browser-side
  `HttpEngineClient`, which calls the same-origin BFF. The browser is not
  intended to call `MockEngineClient` directly.

The current Calculate UI is the Astro page `apps/web/src/pages/index.astro`
and is served at `/`. The repository does not currently contain
`apps/web/src/pages/calculate.astro`, so `/calculate` is not a current static
route. This runtime design does not invent a route alias. A future route
decision is required if `/calculate` must become a separate canonical URL.

The current Sky UI calls the existing client method with `POST
/api/sky/snapshot`. The server registers `POST /api/sky/snapshot` and `POST
/api/sky/events`; it does not register a GET snapshot route. The diagnostic
`GET /api/sky/snapshot` failure is therefore both an Astro-only topology
failure and, when sent to Hono, a method/route mismatch. This design reuses
the existing POST contract and does not add a GET alias.

## 3. Exact causes of the current failures

### 3.1 `GET /api/auth/session` returns 404 in the Astro-only preview

`apps/web` has no Astro API page for this path. The authoritative route is
registered by Hono in `server/src/app/routes/auth-session.ts`. Since
`npm run dev` starts only Astro, the request never reaches Hono and Astro
returns its normal not-found response. Through the complete Hono app the route
exists and currently computes the answer through the configured session
authenticator.

### 3.2 `GET /api/sky/snapshot` returns 404

In the Astro-only preview there is no Hono listener and no Astro API page, so
the request is not handled. Even through Hono, the current server contract is
`POST /api/sky/snapshot`, with a JSON body containing `atUtc`; no GET route is
registered. The existing `CurrentSkyInstrument` uses the POST client path.
The public runtime must make that existing POST path work; it must not silently
change the Sky contract.

### 3.3 `POST /api/chart` fails in the Astro-only preview

`apps/web` has no Astro API page for `/api/chart`. The Hono route is registered
in `server/src/app/create-app.ts` and delegates to the supplied
`ChartCalculationService`. The request never reaches that route when only
Astro is running, so the browser cannot reach the BFF or the development
`MockEngineClient`.

## 4. Endpoint dependency matrix

The matrix distinguishes endpoint behavior from the fact that the current
complete executable constructs all dependencies eagerly.

| Endpoint / operation | Database required by endpoint logic? | Email required? | Auth repository required? | Engine required? | Sky fixture required? | Can run without full persistence? |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /api/chart` | No | No | No | Yes, through `chartCalculator` | No | Yes |
| `POST /api/sky/snapshot` (current route) | No | No | No | Yes, through `engineClient.getSkySnapshot` | Yes, for the approved development request | Yes |
| `POST /api/sky/events` (current route) | No | No | No | Yes, through `engineClient.getSkyEvents` | Yes, for the approved development interval | Yes |
| `GET /api/auth/session` | No for a public unauthenticated composition; yes indirectly with the current full `SessionRequestAuthenticator` | No | Full mode: yes; public mode: no, it uses a stateless authenticator that always returns no principal | No | No | Yes, with the explicit public authenticator |
| Vault protected read/write routes | The authenticated data path requires persistence; the signed-out path stops before it | No | Yes for authentication in the full contract; public mode deliberately returns no principal | Save/create also needs the chart calculator | No | The endpoint can return canonical `401 UNAUTHORIZED` without persistence, but authenticated Vault data cannot run |
| Diagnostic `GET /api/sky/snapshot` | No route | No | No | No route | No route | No; it remains unsupported until a separate contract decision |

The endpoint-level conclusion is:

- Chart and Sky route logic do not require PostgreSQL, Resend, or an
  authenticated user. They require the existing provider-neutral EngineClient
  capabilities and, for fixture requests, the existing fixtures.
- The full executable currently requires PostgreSQL because
  `createServerRuntimeDependencies(...)` constructs `createPostgresPersistence`
  and a `SessionRequestAuthenticator` before `createApp(...)` is returned.
  This is composition coupling, not a Chart/Sky scientific dependency.
- The session endpoint can safely answer signed-out when the public composition
  injects an authenticator that always returns `null`. The full session
  authenticator remains unchanged for the complete runtime.
- Vault persistence is never available in public-development mode. A request
  with no principal must terminate in `requireAuthentication(...)` before any
  Vault repository call.

## 5. Architecture options reviewed

### Option A — Separate public-development runtime composition

Add one additive command and executable composition that constructs the
public-development Hono app, the existing development EngineClient/cache, the
existing local edge, and the built static Web artifact. It does not call the
full environment loader or PostgreSQL bootstrap.

This gives the public features a real BFF path, keeps the full runtime intact,
and makes the development boundary visible at the process entry point.

### Option B — Make the full runtime lazy or globally optional

Change the complete runtime and its global dependency contract so that
PostgreSQL, Auth, and email are conditionally created only when a route needs
them.

This would broaden the full `ServerDependencies` contract, increase the
number of states the production composition must support, and invite route
branches or accidental partial production startup. It solves a local
composition problem by weakening the invariant of the complete runtime.
Option B is rejected.

### Option C — Explicit unavailable Auth/persistence adapters at a development
composition boundary

Use a public-development composition with an authenticator that always returns
no principal and explicit fail-closed/no-send adapters for the dependency
slots required by the existing app assembly. These adapters must not store
users, sessions, challenges, charts, notes, or other records. Protected routes
remain registered behind the normal authentication middleware and return
canonical unauthorized responses before persistence is touched.

This is the safety mechanism used together with Option A. It is not an
in-memory database and not a fake Auth implementation.

### Option D — New Astro API or second proxy

Add API pages inside `apps/web` or create another local proxy/backend.

This would duplicate the BFF boundary, bypass server-owned middleware, and
make the Astro app responsible for API semantics. Option D is rejected. The
existing local edge and Hono app are the repository-native boundaries.

## 6. Selected architecture

Select **Option A + Option C**:

> An explicit `public-development` runtime composition that reuses the
> existing Hono application boundary, local public edge, MockEngineClient,
> ChartResult cache, and Sky fixture path, while injecting stateless
> signed-out/fail-closed Auth behavior and no persistence implementation.

The future bounded implementation should:

1. Build the existing Astro artifact and server artifact using the repository’s
   normal build convention.
2. Construct a `MockEngineClient` from `@natalnode/engine-client`, not a new
   fixture client and not a provider client.
3. Construct the existing `CachedChartCalculator` with the current development
   cache identity:

   ```text
   runtimeNamespace: development-mock
   engineResultGeneration: UI_FIXTURE_V1
   chartResultContractVersion: 1.0.0
   ```

4. Construct pure runtime helpers needed by the app boundary, including a
   clock and session-cookie policy, without loading PostgreSQL or Resend.
5. Inject a public-development `RequestAuthenticator` that always returns
   `null`. It must never manufacture a principal, user ID, or session.
6. Supply explicit fail-closed/no-send Auth and persistence adapters only where
   the current `ServerDependencies` shape requires them for app assembly. They
   must not retain records or expose an authenticated path. If the existing
   dependency shape makes this adapter set unnecessarily broad, B1 may add a
   narrow public-composition factory or route-registration profile; it must not
   make the complete production dependency contract globally optional.
7. Reuse `createApp(...)` so the public runtime receives the same API
   observability, security headers, exact unsafe-request Origin enforcement,
   Problem Details handling, and P0 rate limiting.
8. Start the internal Hono listener, then pass its host/port and the built
   `apps/web/dist` directory to `startLocalPublicEdge(...)`.
9. Use the existing process shutdown boundary so the edge and Hono listener
   close cleanly together.

No route-level `NODE_ENV` branches are required. Public behavior is selected
once at the composition boundary.

## 7. Security boundary and signed-out semantics

The public-development runtime is intentionally anonymous:

- `GET /api/auth/session` returns HTTP `200` with the existing response shape
  `{ "authenticated": false }` and `Cache-Control: no-store`.
- The authenticator ignores any presented session as a source of identity; it
  never turns a cookie into a principal. The runtime therefore cannot become
  authenticated merely because a browser retains a cookie from another local
  run.
- `POST /api/auth/logout` may clear the configured cookie without persistence.
  If a cookie is presented, its removal path must remain a stateless no-op at
  the public boundary; it must not require or create a database record.
- Email magic-link request/complete operations are unsupported in this mode.
  No Resend request, console email, token disclosure, accepted magic-link
  success, email verification, or session creation is allowed. The future
  implementation must fail closed using the repository’s existing Problem
  Details/error conventions.
- `requireAuthentication(...)` remains the authorization boundary. Signed-out
  Vault, feedback, account, export, and other protected operations return the
  existing canonical `401 UNAUTHORIZED` response before protected repositories
  are called.
- There is no fake user, hard-coded user ID, mock signed-in session, test-login
  bypass, automatic Vault ownership, or in-memory record store.

This preserves the frontend’s current distinction. The Vault frontend treats a
valid `200 { authenticated: false }` session response as signed out and
redirects to `/auth/sign-in`; it treats a non-200 session response as a load
failure. The public runtime therefore fixes the misleading Astro-only session
404 without changing Vault UI code or pretending that Vault data is present.

## 8. Supported public-development behavior

The future command is intended to support only the following:

- `GET /` serving the current Calculate page and normal static navigation.
- `POST /api/chart` with a valid development request returning the existing
  `WEB_UI_FIXTURE_V1` result through Hono, `CachedChartCalculator`, and
  `MockEngineClient`.
- `POST /api/sky/snapshot` with the existing approved fixture timestamp
  `2026-09-01T12:00:00.000Z`, returning the existing Sky development fixture.
- `POST /api/sky/events` with the existing approved fixture interval, when the
  current UI or focused runtime check uses it.
- `GET /api/auth/session` returning the signed-out shape.
- `GET /api/health` returning the existing Hono health response.
- The built static Astro routes and assets, including the current Sky preview
  and `/dev/current-sky` development page where present in the build.

The current Sky fixture disclosure remains authoritative:

```text
UI DEVELOPMENT ONLY
NOT SCIENTIFIC EVIDENCE
NOT PRODUCTION ASTRONOMY
```

The public runtime does not claim that a fixed fixture timestamp is live Sky.

`/calculate` is not listed as a supported current page because the repository
does not currently emit that route. The current Calculate surface is `/`.
Adding an alias or changing the canonical route is outside this runtime design.

## 9. Unsupported full-stack behavior

The public-development runtime must not promise or partially emulate:

- magic-link login or real email delivery;
- Google OAuth;
- authenticated session creation;
- Vault records, CRUD, notes, ownership, or cross-device persistence;
- account export, account deletion, or feedback persistence;
- PostgreSQL-backed data access;
- production Engine access or scientific calculations;
- production provider selection, provider disclosure, or production readiness;
- future `/sky` product routing, Current Transits, or other P1/P2/P3 work.

`npm run dev:local` remains the complete local environment for real Auth,
email, PostgreSQL, and authenticated Vault development. Its required
environment variables and real dependency requirements must not be weakened or
removed.

## 10. Cache, observability, and edge integrity

### Cache

The public runtime reuses `CachedChartCalculator`; it does not create a second
cache. The existing in-process cache remains keyed and identified with the
development identity shown above. A Chart request should therefore exercise
the same cache hit/miss boundary as the complete local runtime while still
using only the fixture EngineClient.

Public Sky continues to use the existing MockEngine fixture path. This task
does not introduce a shared Sky cache, a new Sky cache namespace, or a
scientific derivation.

### Observability and security

The public runtime must reuse `createApp(...)` middleware in its existing
order:

```text
request completion observability
→ API security headers
→ exact unsafe-request Origin enforcement
→ P0 staging rate limits
→ route authentication and business behavior
```

Request IDs, `api.request.completed`, canonical Problem Details, no-store API
headers, `Referrer-Policy`, `nosniff`, `X-Frame-Options`, Origin enforcement,
and trusted edge client-IP handling remain active. This task does not redesign
or extend observability.

### Local edge

Reuse `server/src/executable/local-public-edge.ts`. It already:

- serves the built `apps/web/dist` artifact for normal browser routes/assets;
- proxies `/api` and `/api/*` with the original path and query string;
- preserves request bodies and methods;
- removes any incoming trusted edge client-IP header and replaces it from the
  local socket address;
- forwards the internal API Host header expected by the proxy target.

No Astro API files and no second proxy are authorized.

## 11. Command, ports, and origin

Freeze one future command:

```text
npm run dev:public
```

The command should be an additive root script with the existing repository
orchestration convention: build the static Web/server artifacts, start the
public-development Hono composition, start the existing local public edge, and
keep one browser origin. A future server workspace script may be the thin
executable edge behind the root command; no implementation is added by this
document.

Code-owned default topology:

| Boundary | Default |
| --- | --- |
| Canonical browser/public edge | `localhost:4321` |
| Canonical public origin | `http://localhost:4321` |
| Internal Hono listener | `127.0.0.1:4322` |
| Browser API path | same-origin `/api/*`, never the internal port |

The edge continues to listen using the existing `localhost` convention, while
the Hono listener is loopback-only on `127.0.0.1`. The internal port is not a
public browser endpoint. These defaults avoid adding mandatory secrets or
environment variables for ordinary public fixture development. Optional port
overrides may be considered in B1 only if they preserve the same explicit
origin validation and do not re-use the full-runtime environment parser.

Developers should open exactly:

```text
http://localhost:4321
```

They should not use `http://127.0.0.1:4321` for this command. The existing
unsafe-request Origin policy compares against the canonical public origin, so
mixing host spellings can produce a legitimate `403` even though both names
reach the same machine. The internal API port should never be opened in the
browser.

The existing `npm run dev` remains the Astro-only preview and must be described
as such. It may render static UI, but it does not prove API-backed Calculate,
Sky, or session behavior. The new command uses the built static artifact on
port 4321; developers should not run both servers on that port concurrently.

## 12. Development identity and production isolation

The mode identity is:

```text
public-development
```

It must not be named `production`, `authenticated-dev`, or `mock-user`.

Production isolation is enforced at the executable/composition boundary, not
by comments and not by scattered route checks. B1 must use all of these
properties:

1. A separate executable entry point and separate `dev:public` script; the
   production `server-main` and `server:start` path never import or select it.
2. A literal development fixture identity and `MockEngineClient` construction
   in that composition, with no provider-selection input.
3. Loopback-only API binding and the explicit HTTP localhost public origin.
4. A startup assertion at the public-development entry point that rejects an
   explicit production environment marker such as `NODE_ENV=production` and
   refuses non-loopback/publicly deployable configuration.
5. No auth, database, email, or Engine provider configuration path that can
   silently promote the public composition into a production-like runtime.

The complete `npm run dev:local` and production executable retain their own
existing composition and requirements. `PROVIDER DECISION DEFERRED` remains in
force.

## 13. Optional UI guardrail

No UI change is required for this runtime decision. The command and the
distinction between Astro-only preview and public full-stack fixture runtime
are the primary guardrail.

A later, separately scoped development-only diagnostic may detect repeated
API 404/network failures and say:

```text
API backend unavailable — use npm run dev:public
```

It must not hide API errors, alter production UI, or become a prerequisite for
the runtime. It is deferred.

## 14. Bounded future implementation slices

### `WEB-LOCAL-DEV-001B1` — Implement Public Local Development Runtime

Implement the additive `public-development` composition and the single
`npm run dev:public` command. Reuse the existing edge, Hono app middleware,
MockEngineClient, cache, and Sky fixtures. Supply explicit stateless
signed-out/fail-closed Auth dependencies without PostgreSQL, Resend, or a fake
database. Preserve `npm run dev:local` unchanged.

### `WEB-LOCAL-DEV-001B2` — Signed-out session and protected-route safety

If B1 cannot fully express these semantics at the composition boundary, make a
focused follow-up that verifies:

- session returns the canonical signed-out response;
- no cookie or request can create a principal;
- email operations cannot send or complete authentication;
- protected routes return canonical unauthorized/unavailable responses before
  persistence;
- logout clears local cookie state without requiring persistence.

This slice must not create a fake user, memory store, or test login.

### `WEB-LOCAL-DEV-001C` — Focused browser/runtime validation

Run the bounded browser/runtime checks only after B1/B2:

- Calculate reaches Hono and renders the fixture result;
- Sky resolves through the current POST BFF route and retains its disclosure;
- Vault sees signed-out state rather than a session-load error;
- protected APIs remain unauthorized;
- the command starts without database or email credentials;
- the canonical origin and edge proxy are correct.

No `WEB-OBS-001B2`, P1/P2/P3 feature, or production integration is included.

## 15. Focused future test plan

The implementation slices should add only targeted coverage appropriate to the
new runtime boundary:

### Runtime and isolation

- Public composition starts without `DATABASE_URL`.
- Public composition starts without `RESEND_API_KEY` and
  `AUTH_EMAIL_FROM`.
- The full `dev:local` composition still retains its real dependency
  requirements.
- No public-development request creates an authenticated session.
- Production-marked startup rejects the reduced composition.

### Chart

- A valid `POST /api/chart` reaches `MockEngineClient` through the BFF.
- The returned result is the existing `WEB_UI_FIXTURE_V1` development result.
- A repeat request exercises the existing cache boundary.
- Request IDs, completion observability, security headers, Origin enforcement,
  rate limits, and Problem Details remain present.

### Sky

- The existing `POST /api/sky/snapshot` succeeds for the approved fixture
  timestamp.
- The existing `POST /api/sky/events` succeeds for the approved fixture
  interval where exercised.
- The disclosure and incomplete/research metadata remain unchanged.
- No GET alias or second Sky implementation appears.

### Auth and Vault

- `GET /api/auth/session` returns `200` and `authenticated: false`.
- Email request/complete cannot send, verify, or create a session.
- Signed-out Vault reads/writes return canonical unauthorized behavior.
- No fake records, user IDs, session rows, challenges, or in-memory Vault
  persistence are created.
- The Vault page can follow its existing signed-out redirect behavior.

### Edge and origin

- `http://localhost:4321` serves the built Web artifact.
- `/api/*` reaches the Hono listener through the existing edge.
- The edge and Hono ports remain distinct.
- Unsafe same-origin requests succeed from the canonical localhost origin;
  alternate origin spellings do not silently bypass the policy.

## 16. Implementation-readiness conclusion

This design is locally implementable without touching `C:\NatalNode`, adding
an astronomy/provider dependency, changing contracts, adding migrations, or
weakening the complete local runtime. The implementation boundary is narrow:
one new executable composition, one root command/build hook, and explicit
public-development dependency wiring, followed by focused runtime validation.

The only current route facts that B1 must preserve are:

- Calculate’s current page is `/`, not `/calculate`.
- Sky’s current BFF operation is `POST /api/sky/snapshot`, not GET.

Those facts do not require a runtime implementation in this task, but they
must not be silently “fixed” by adding duplicate API routes or speculative
frontend pages. Any change to either public route contract needs its own
decision.

```text
WEB-LOCAL-DEV-001A = APPROVED TECHNICAL DIRECTION
WEB-LOCAL-DEV-001B1 = IMPLEMENTATION READY
IMPLEMENTATION IN THIS TASK = DEFERRED
```
