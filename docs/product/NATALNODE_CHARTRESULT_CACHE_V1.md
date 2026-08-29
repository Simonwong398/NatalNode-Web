# NatalNode ChartResult Cache V1

- Status: **APPROVED TECHNICAL DIRECTION**
- Runtime implementation: **DEFERRED**
- Scope: provider-neutral caching of complete natal-chart ChartResult values at the Website API / BFF boundary
- Production provider: **PROVIDER DECISION DEFERRED**

This document freezes the P0 ChartResult cache contract. It does not
implement a cache, add a dependency, add a migration, or authorize a
provider-specific integration.

## 1. Purpose and non-goals

The cache exists to reduce redundant equivalent calls to the server
EngineClient while preserving the exact semantics of a fresh calculation.
It is an operational optimization only. Calculate correctness, request
security, validation, authorization, and scientific output remain
authoritative outside the cache.

This contract does not authorize:

- astronomy calculations or partial recomputation in the Website repository;
- a browser, localStorage, service-worker, CDN, or proxy ChartResult cache;
- reconstruction or merging of partial results;
- provider-specific normalization or provider-specific website behavior;
- caching interpretation fragments, HTML, React/Astro output, or browser
  derived science;
- a production astronomy-provider selection;
- runtime implementation in this task.

The cache covers the natal-chart ChartResult boundary. Public Sky snapshots
and event timelines have a separate domain contract and must not reuse this
personal-result cache namespace.

## 2. Current repository architecture

### 2.1 Calculate flow

The current Calculate path is:

~~~
BirthInputForm
  -> BirthInputResolver
  -> toChartRequest(...)
  -> browser HttpEngineClient.calculateChart(...)
  -> same-origin POST /api/chart
  -> Hono BFF validation
  -> server EngineClient.calculateChart(...)
  -> { chart: ChartResult }
  -> browser ChartWorkspace / renderer / interpretation / details
~~~

Current repository evidence:

- apps/web/src/features/chart-input/BirthInputForm.tsx owns editable
  browser input and uses the development resolver by default.
- apps/web/src/features/chart-experience/chart-request.ts copies the
  resolved input into the normalized ChartRequest sent to the client.
- apps/web/src/lib/engine-client.ts constructs the browser HttpEngineClient.
- packages/engine-client/src/http-engine-client.ts sends POST /api/chart
  with { chart: request }, same-origin credentials, and cache: no-store. It
  validates the complete response shape before returning ChartResult.
- server/src/app/create-app.ts installs API middleware and registers
  POST /api/chart.
- server/src/app/routes/chart.ts parses JSON, validates
  ChartCalculationApiRequest, calls the injected server EngineClient, and
  returns the unchanged { chart } response shape.
- server/src/app/dependencies.ts receives the provider-neutral EngineClient
  abstraction.
- server/src/executable/create-executable-server-bindings.ts currently
  binds MockEngineClient only for the explicit development-mock mode.
  Production Engine binding remains deferred.

There is currently no ChartResult cache abstraction, cache key helper, cache
storage path, or cache status in the server repository. The current API
observability middleware creates a request ID, classifies the endpoint, and
records bounded request facts and duration, but does not yet record cache
status or Engine metadata.

### 2.2 Middleware and request boundary

The current createApp order for /api/* is:

1. observeApiRequests();
2. applyApiSecurityHeaders();
3. enforceSameOriginUnsafeApiRequests(...);
4. enforceP0StagingRateLimits(...);
5. route-level JSON framing and request validation;
6. route business behavior.

server/src/app/security/api-security-headers.ts applies
Cache-Control: no-store to API responses. The chart route currently has no
cache lookup between validation and its EngineClient call.

### 2.3 Result and Vault boundaries

packages/contracts/src/chart.ts defines ChartRequest and the complete
ChartResult union. A complete result contains:

- calculation status;
- chart schema version;
- Engine version;
- all returned body facts;
- all returned angle facts;
- houses or an explicit null;
- all returned aspects;
- warnings; and
- complete or incomplete-research scientific metadata.

apps/web/src/features/chart-workspace/ChartWorkspace.tsx passes the
server-returned result to the chart view, renderer, interpretation, and
calculation-details components. Those consumers present the result; they do
not become a source of scientific facts.

The authenticated POST /api/vault/charts route currently recalculates the
submitted normalized request through the server EngineClient, then persists
the returned complete result as charts.canonical_result alongside the
normalized input and scientific metadata. server/src/persistence/postgres/
uses PostgreSQL for user-owned Auth, Vault, note, and Feedback records. No
cache table exists.

## 3. Terminology

For this contract:

- **Complete ChartResult** means a valid value of the current ChartResult
  contract containing the complete result envelope. It does not mean that
  the scientific configuration is production-complete.
- A valid calculationStatus: INCOMPLETE_RESEARCH result is still a complete
  ChartResult payload for development/research use. Its status, warnings,
  unavailable identities, and other metadata must remain unchanged.
- **Cache hit** means a compatible, unexpired complete result was returned
  without calling EngineClient for that request.
- **Cache miss** means no compatible entry was used and the normal
  EngineClient calculation was attempted.
- **Cache bypass** means the cache was deliberately not used, such as for an
  unconfigured namespace or a non-cacheable result.
- **Cache error** means a cache read or write operation failed. It is not an
  Engine calculation error and must not become a user-visible calculation
  failure when a fresh calculation can proceed.

## 4. Selected P0 cache location

The P0 location is a **server/BFF-owned, process-local, in-memory cache**
around the complete calculation boundary.

The future implementation may expose a provider-neutral cache service or
decorator to the BFF calculation composition. It must not move the cache into
the browser HttpEngineClient, the MockEngineClient, or a provider-specific
Engine client. The same boundary may serve the ordinary public chart route
and the server-side calculation performed before a Vault save, subject to the
route-specific security boundaries described below.

This choice is based on current repository truth:

- the server already owns the BFF calculation call and has a process-local
  in-memory rate limiter;
- no cache helper or cache table exists;
- PostgreSQL is currently composed for user-owned persistence, not transient
  calculation caching;
- the PRD mentions managed Redis as a future infrastructure option, but no
  Redis dependency or runtime is present and this task does not authorize
  introducing one.

P0 therefore adds no Redis, Memcached, external KV, CDN cache, object store,
or new persistence model. PostgreSQL charts.canonical_result remains the
user-owned Vault snapshot and is not repurposed as a shared cache.

### 4.1 Multi-request and multi-user behavior

Within one server process, scientifically equivalent requests may share a
cache entry when their canonical input and cache namespace match. The entry
is not owned by an account and contains no account-specific presentation
state.

The process-local design is intentionally not globally coherent:

- misses on different instances are acceptable;
- there is no cross-instance invalidation requirement;
- correctness never depends on a cache hit;
- restart eviction is acceptable and expected;
- a new process starts with an empty cache.

If a future task requires shared or restart-persistent caching, it must create
a separate architecture decision rather than silently changing this contract.

### 4.2 Future module placement

WEB-CACHE-001B1 owns a small, internal server module under
`server/src/app/cache/`, with `chart-result-cache.ts` as the boundary for the
`ChartResultCache` abstraction. That module owns the explicit canonical-input
adapter, deterministic serializer, versioned key derivation, bounded Map,
Clock-based TTL, LRU/expiry behavior, and clone-on-store/read. A separate
purpose-built key helper may be a sibling in the same directory only if the
implementation's responsibility boundary requires it.

The module is Website API/BFF infrastructure. It must not live in
`packages/engine-client`, `MockEngineClient`, `HttpEngineClient`, browser
feature code, or scientific/provider code. B1 may expose the abstraction to
focused tests and future server composition, but it does not add a cache field
to `ServerDependencies`, change route registration, or integrate a lookup;
those are B2 responsibilities.

## 5. Correctness invariant

The frozen invariant is:

> **A cache hit MUST be semantically equivalent to a fresh
> EngineClient.calculateChart call for the same canonical calculation input
> and cache version.**

A hit may return the stored complete ChartResult only when:

1. request-level security and route boundaries have already run;
2. the request has passed current framing and validation;
3. the canonical input is identical;
4. the cache format, runtime namespace, Engine result generation, and
   ChartResult contract version are compatible;
5. the entry is unexpired; and
6. the stored result is a complete, valid result for that namespace.

The cache cannot override or replace input validation, Origin checks, rate
limiting, Auth, request framing, or the scientific contract. A cache hit is
not permission to bypass any middleware.

## 6. Cached object and cacheability

The cached scientific value is exactly the **complete provider-neutral
ChartResult returned by the server EngineClient boundary**.

The cache must not store or return:

- partial planetary positions;
- partial houses or aspects;
- individual calculated facts;
- render fragments or serialized HTML;
- React/Astro components;
- independently assembled interpretation text;
- browser-local derived science;
- raw birth input as a second stored payload;
- account, Vault, session, or presentation metadata.

A future in-memory entry may have a small operational envelope containing the
opaque map key, creation/expiry information, compatibility dimensions, and
the complete ChartResult payload. The scientific payload remains the
unchanged ChartResult; the envelope must not become a second scientific
serialization format.

Only successful responses containing a valid complete ChartResult are
cacheable. Errors and malformed or incompatible values are never cacheable.
A successful INCOMPLETE_RESEARCH result may be cached only in its explicit
development/research namespace, with its research status and warnings
unchanged. It must never cross into a production namespace or be upgraded
into production metadata.

## 7. Canonical calculation input

The cache identity is based on the normalized calculation input reaching
EngineClient.calculateChart, not on browser form state.

The current canonical input contains these fields in a fixed order:

1. localDate
2. localTime (string or null)
3. latitude
4. longitude
5. ianaTimeZone
6. resolvedUtcInstant (string or null)
7. utcOffsetSeconds (number or null)
8. timezoneDatabaseVersion
9. timezoneResolutionMethod
10. ambiguityStatus
11. houseSystem

Conceptually, the key input object is:

~~~json
{
  "localDate": "...",
  "localTime": "...",
  "latitude": 0,
  "longitude": 0,
  "ianaTimeZone": "...",
  "resolvedUtcInstant": "...",
  "utcOffsetSeconds": 0,
  "timezoneDatabaseVersion": "...",
  "timezoneResolutionMethod": "...",
  "ambiguityStatus": "...",
  "houseSystem": "..."
}
~~~

The values above are illustrative only; the runtime must use the actual
validated request values.

Any future calculation option that can change ChartResult must be added to
this canonical object before runtime use. A presentation-only field must not
be added merely because it is present in a browser form.

The source boundary is concrete in the current repository. The BFF type gate
is `isChartCalculationApiRequest` in
`server/src/app/validation/chart-request.ts`; after that gate,
`createChartRoute` in `server/src/app/routes/chart.ts` passes `payload.chart`
unchanged to `dependencies.engineClient.calculateChart(...)`. The browser
producer is `toChartRequest` in
`apps/web/src/features/chart-experience/chart-request.ts`, which copies all
normalized birth and house-system fields into that request shape. There is no
server-side re-resolution or scientific normalization between validation and
the EngineClient call. B1 therefore receives the exact `ChartRequest` at this
BFF boundary, not browser form state, a returned ChartResult, or a second
browser-derived representation. The authenticated Vault route has the same
normalized request shape and remains a separate B2 integration boundary.

### 7.1 Place-label decision

locationLabel is intentionally excluded from scientific cache identity under
the current contract.

The current resolver preserves the user-entered label while supplying
resolved latitude, longitude, timezone, and resolution metadata. The current
ChartResult contract does not contain that label, and the chart API response
contains only { chart }. Therefore, two labels that resolve to the same
canonical scientific inputs may share a result.

The label remains part of the normalized request used by the current
presentation and Vault boundaries. Excluding it from the cache key does not
authorize changing, hiding, or rewriting the label. If a future Engine
contract makes the label result-affecting or returns it inside an
identity-sensitive result, the cache input and cache version must be revised
before runtime integration.

### 7.2 Unknown birth time

Unknown birth time is a hard semantic boundary. Under the current contract it
is represented by:

- localTime: null;
- ambiguityStatus: UNKNOWN_TIME;
- resolvedUtcInstant: null; and
- utcOffsetSeconds: null.

The key includes the explicit state and all of these fields. Known-time
requests and unknown-time requests must never share an entry.

The cache must not convert unknown time to noon, midnight, 12:00, 00:00, or
any other fallback. The presentation policy that suppresses ASC, MC, houses,
and house-based interpretation for unknown time is not a substitute for
correct cache identity.

The same rule applies if a request carries another ambiguity state. The
current browser flow resolves an ambiguous selection before calculation, but
the server key must not assume a state that is not present in the validated
request.

### 7.3 Timezone and local civil time

The key includes local civil date/time and the timezone-resolution context.
It must not key only on a derived UTC instant.

The following are identity-bearing under the current ChartRequest and
EngineClient boundary:

- local date;
- local time or explicit null;
- IANA timezone;
- resolved UTC instant or explicit null;
- UTC offset or explicit null;
- timezone database version;
- timezone resolution method; and
- ambiguity/unknown-time status.

The Website layer must not invent historical timezone normalization, resolve
ambiguous times, or substitute a timezone policy during cache lookup.

### 7.4 Coordinates and numeric canonicalization

Latitude and longitude use the exact finite numeric representation already
normalized and passed to EngineClient. The cache introduces no scientific
tolerance and no coordinate rounding.

The current BFF guard rejects `NaN`, positive infinity, and negative infinity
for latitude, longitude, and the nullable UTC offset. The B1 canonicalizer
must assert that same finite-number precondition before serialization as a
fail-closed invariant. It must not rely on `JSON.stringify` converting an
invalid number to `null`, and it must not add date, coordinate-range, or other
scientific validation that is not part of this cache boundary.

The deterministic serializer must:

- reject non-finite values through the existing request boundary before key
  derivation;
- construct a new object in the explicit field order above rather than
  relying on caller object insertion order;
- serialize strings, null, and numbers in a locale-independent, whitespace-
  free JSON form;
- use the ECMAScript/JSON numeric representation of the received finite
  number without decimal rounding or truncation; and
- canonicalize every numeric canonical-input field with
  `Object.is(value, -0) ? 0 : value` before serialization. This includes
  latitude, longitude, and a non-null UTC offset. The resulting JSON token is
  numeric `0`, since the current numeric contract treats negative zero as the
  same coordinate/offset value.

No new geographic precision rule or scientific equivalence tolerance is
introduced by this cache.

### 7.5 House system

houseSystem is always included in the key. It is a calculation option in the
current ChartRequest and affects houses when birth time is known.

For unknown birth time, the UI suppresses houses and house interpretation,
but the cache still includes the supplied house-system value. The cache must
not deduplicate unknown-time requests by assuming that the house system is
irrelevant unless a future Engine contract proves that equivalence and bumps
the relevant cache version.

## 8. Versioned cache-key derivation

The key is a versioned, deterministic hash identity:

~~~text
canonicalInput = {
  localDate: birth.localDate,
  localTime: birth.localTime,
  latitude: normalizeNegativeZero(birth.latitude),
  longitude: normalizeNegativeZero(birth.longitude),
  ianaTimeZone: birth.ianaTimeZone,
  resolvedUtcInstant: birth.resolvedUtcInstant,
  utcOffsetSeconds: normalizeNullableNegativeZero(birth.utcOffsetSeconds),
  timezoneDatabaseVersion: birth.timezoneDatabaseVersion,
  timezoneResolutionMethod: birth.timezoneResolutionMethod,
  ambiguityStatus: birth.ambiguityStatus,
  houseSystem: request.houseSystem
}

canonicalInputJson = JSON.stringify(canonicalInput)

inputDigest =
  SHA-256(UTF-8(canonicalInputJson)), represented as lowercase hexadecimal

cacheKey =
  v1:<runtime-namespace>:<engine-result-generation>:<chart-result-contract-version>:<inputDigest>
~~~

The conceptual dimensions are separate:

| Dimension | Purpose |
| --- | --- |
| CACHE_FORMAT_VERSION (v1) | Changes when the cache entry/key representation changes. |
| runtimeNamespace | Explicit server-composition identity that separates development/research, staging, and production cache populations. It is internal, stable for a deployment, and not provider-specific. |
| engineResultGeneration | Explicit pre-calculation, provider-neutral generation for the Engine/result configuration used by the deployment. It changes when result-producing Engine, scientific configuration, provenance, or time-policy semantics change. |
| chartResultContractVersion | Expected `ChartResult.schemaVersion` compatibility value. It changes when the result shape or meaning changes. |
| inputDigest | SHA-256 of the canonical calculation input only. |

`canonicalInput` is a newly constructed object with the property order shown
above. `JSON.stringify` is used with no pretty-printing or locale-dependent
formatting; the Node/platform crypto implementation consumes that exact
string as UTF-8. B1 must not recursively sort arbitrary caller objects, use a
locale formatter, or serialize the whole request as an implicit identity.
`normalizeNegativeZero` and its nullable equivalent first assert finite
numbers and then apply the `Object.is(value, -0)` rule. An invalid number is a
canonicalization invariant violation, not a serializable cache miss.

The cache constructor receives one explicit internal identity/configuration
object before the first lookup:

~~~ts
{
  runtimeNamespace: string;
  engineResultGeneration: string;
  chartResultContractVersion: string;
}
~~~

The server deployment composition owns these values; they are not derived
from a request, a random value, a browser, or a post-calculation result. Each
value must be non-empty and stable for the lifetime of the composed
deployment. A missing or invalid value is a configuration/invariant error,
not permission to fall back to a shared namespace.

The current executable has one accepted mode,
`ENGINE_CLIENT_MODE=development-mock`. Its composition maps that mode to
`runtimeNamespace: "development-mock"`,
`engineResultGeneration: "UI_FIXTURE_V1"` (the current
`MockEngineClient`/fixture identity), and
`chartResultContractVersion: "1.0.0"` (the current fixture's
`ChartResult.schemaVersion`). `UI_FIXTURE_V1` is therefore only the explicit
mock-generation discriminator; it is not the generic production cache
architecture. A future production-approved binding must supply a distinct
production runtime namespace and its own provider-neutral generation before
lookup. Provider selection remains:

PROVIDER DECISION DEFERRED

Because the current EngineClient interface exposes the result's
engineVersion and scientific metadata after a call rather than exposing a
pre-call configuration identity, the future BFF composition must supply the
expected generation as internal configuration. This is the smallest new
server-owned configuration concept needed by the current source; the
repository has no existing `NODE_ENV`, deployment identity, or scientific
configuration object that can safely substitute for it. `PUBLIC_WEB_ORIGIN`
is not used as a cache identity. On a fresh result, the B2 integration must
verify compatibility with the configured generation and contract version
before storing it. A mismatch is a cache bypass/miss, never an opportunity
to infer, repair, or rewrite scientific metadata.

The PRD's illustrative cache dimensions (`engineVersion`,
`chartSchemaVersion`, and `astronomyConfigurationId`) are therefore mapped as
follows: `chartResultContractVersion` reuses the current
`ChartResult.schemaVersion`, while the pre-call `engineResultGeneration` is
the Website-side compatibility namespace that must change whenever the
Engine version or returned scientific configuration/provenance/time-policy
identity changes. `astronomyConfigurationId` is currently returned only
inside complete scientific metadata and is not independently available before
the Engine call, so it must not be read after the fact to construct a lookup
key or be fabricated into the request.

This versioned form provides an invalidation path without storing raw birth
data in the key. A change to cache format, result contract, or result
generation produces a new namespace/key family; old in-memory entries are
also removed on process restart.

### 8.1 Version and namespace change ownership

The invalidation decision belongs to the responsibility that changed:

| Value | Owner | Bump/change rule |
| --- | --- | --- |
| `CACHE_FORMAT_VERSION` | B1 cache-module maintainers | Bump when key representation, canonical serialization, or cache-entry envelope/storage semantics change. |
| `runtimeNamespace` | Server deployment composition | Change when a deployment population or development/production isolation boundary changes. It is not a scientific/provider version. |
| `engineResultGeneration` | Engine binding and scientific-configuration owner at the deployment boundary | Bump whenever the same canonical request may produce different valid results because of Engine generation, scientific configuration, provenance semantics, or time-policy semantics. The new value must be known before lookup. |
| `chartResultContractVersion` | Website contract owner maintaining `packages/contracts/src/chart.ts` and the result producers | Bump the `ChartResult.schemaVersion` compatibility value when ChartResult structure or meaning changes. |

If one change crosses more than one responsibility, every affected value is
updated before the cache is used. Ordinary implementation changes that do not
alter any of those identities do not require an arbitrary cache flush.

### 8.2 Hash collision behavior

SHA-256 via the Node/platform `createHash('sha256')` API is sufficient for P0
process-local cache identity under normal cryptographic engineering
assumptions. It requires no new dependency and no new secret. The digest stays
inside the process, is not logged or exposed, and the cache does not persist
the raw canonical input for collision-resolution comparison. A practical
collision-resolution store is not justified for this bounded, transient
cache.

If an entry's compatibility envelope or result validation is inconsistent,
the entry is treated as incompatible and ignored. The implementation must not
serve a result based on an invalid or partially matching entry.

## 9. Key privacy and identity policy

The key must not directly expose:

- birth date;
- birth time;
- latitude or longitude;
- timezone;
- place label;
- user ID;
- email; or
- chart name.

P0 uses plain SHA-256 of the canonicalized scientific input and introduces
**no new configured secret**. This is the lowest-risk choice for the
selected process-local design because keys are not persisted, returned,
placed in URLs, or written to logs. The existing rate-limit HMAC salt and
authentication/email secrets must not be reused for cache identity.

The digest is not a reason to log the input: neither the unhashed canonical
input nor the digest may be logged. A future persistent or shared cache would
change the exposure model and must receive a new privacy/key review before
adoption, including reconsideration of keyed hashing and key management.

### 9.1 User identity

userId, email, session ID, Vault name, and account metadata are excluded from
scientific cache identity and cache entries.

Scientifically identical anonymous and authenticated calculations may share a
complete result because the current ChartResult contains no account-specific
annotations. Authentication remains authoritative for any route that
requires it, and user-owned presentation state never comes from this cache.

If a future result includes account-specific or private annotations, it is
not eligible for this shared identity-independent cache unless a separate
scoped contract is approved.

### 9.2 Development and production isolation

Development MockEngineClient results must never contaminate a future
production cache. The runtime namespace is therefore mandatory:

- development/research mock calculations use a development/research
  namespace; in the current executable this is the explicit
  `development-mock` value;
- production-approved calculations use a distinct production namespace; and
- a namespace is selected by server deployment composition, not by a browser
  request.

The current mock result keeps engineVersion: UI_FIXTURE_V1,
calculationStatus: INCOMPLETE_RESEARCH, and its existing warning/metadata
values. The cache must preserve those values inside the development namespace
and must not treat them as production evidence.

No production provider name is part of this generic contract. Provider
selection remains:

PROVIDER DECISION DEFERRED

## 10. TTL, capacity, and eviction

### 10.1 TTL

P0 freezes a **15-minute fixed TTL**. The future cache module owns this as a
code-level default (`15 * 60 * 1000` milliseconds), with a narrow constructor
override for focused tests or internal composition. The override must remain
a finite positive integer; production composition retains the P0 default. It
is never exposed to browsers or API consumers and does not require a new
environment variable.

The TTL is an operational freshness, memory, and privacy bound, not a
scientific time-decay rule. Fifteen minutes is a conservative technical
default for deduplicating repeated equivalent calculations during a short
interaction window while limiting transient retention of derived chart data.
It also bounds stale occupancy while versioned namespaces handle semantic
contract changes.

TTL begins when an entry is stored. A cache hit does not extend the expiry
(sliding expiry is not used). Expired entries are not served and are removed
as part of ordinary lookup/prune activity.

### 10.2 Capacity and eviction

Each server process has a hard maximum of **512 complete ChartResult entries**.
The future cache module owns `512` as its code-level default, with a narrow
constructor override for focused tests or internal composition. The override
may lower the bound for focused tests, but must be a positive integer no
greater than the P0 hard cap of 512. It uses the following exact insertion
behavior:

1. remove all entries whose `expiresAt` is at or before the current Clock
   value;
2. remove an existing entry for the same key before replacement;
3. while the map is at capacity, remove the least-recently-used entry; and
4. insert the cloned replacement only after space exists.

The map therefore never transiently exceeds the configured hard cap, even
when expired entries are present or the same key is overwritten. A successful
overwrite is one entry, becomes most-recently-used, and receives a new fixed
TTL beginning at that store operation.

On `get`, an encountered expired entry is deleted and treated as a miss. On a
compatible hit, the entry is moved to the most-recently-used position, but
its existing `expiresAt` is unchanged. A full opportunistic expiry sweep is
performed before any LRU eviction; no background timer is needed.

The map must not grow without bound. There is no persistent-storage budget
because P0 does not persist the cache. The current WEB_UI_FIXTURE_V1
representative result contains 10 body facts, 2 angle facts, 12 house cusps,
7 aspects, and warnings in a JSON-compatible shape; no repository benchmark
was run or found. The 512-entry limit is a conservative count bound, not a
claim about a production result-size SLA. Material result-size growth
requires a focused capacity review rather than silent truncation.

Restart clears all entries. No cross-instance eviction or invalidation is
required.

### 10.3 Clock and cleanup lifecycle

B1 uses the existing server `Clock` abstraction from
`server/src/app/creation-boundaries.ts`, whose current `SystemClock`
implementation returns an ISO timestamp string. The cache converts
`clock.now()` to epoch milliseconds, rejects a non-finite/invalid clock value
as an invariant error, and uses that value for both `storedAt` and
`expiresAt`. It must not call `Date.now()` directly, so focused tests can
control expiry with a fake Clock.

Cleanup is lazy and bounded: `get` removes an encountered expired entry, and
`set` sweeps the at-most-512-entry map before performing LRU eviction. There
is no `setInterval`, scheduler, background worker, or other cache lifecycle
timer that could keep Node alive.

## 11. Errors, negative caching, and cache failure

### 11.1 Negative caching

Errors are not cached by default and do not become ChartResult entries. This
includes:

- 400 INVALID_REQUEST;
- 401 UNAUTHORIZED;
- 403 FORBIDDEN;
- 404;
- 429 RATE_LIMITED;
- 500 INTERNAL_ERROR;
- 503 CALCULATION_UNAVAILABLE; and
- any Engine rejection, timeout, malformed response, or incompatible result.

Only a successful complete result is eligible. A successful
INCOMPLETE_RESEARCH result is eligible only within its isolated
development/research namespace as described above.

### 11.2 Cache failure

The cache is an optimization and must fail open to a normal EngineClient
calculation where safe:

- a cache read error is recorded as an internal cache error and treated as a
  miss;
- a corrupt, expired, or incompatible entry is evicted or discarded and
  treated as a miss;
- a clone failure while storing a successful result skips the cache write and
  does not fail the user response;
- a clone failure while reading an entry evicts that entry, exposes no
  internal object, and is treated as a miss;
- a cache write error after a successful calculation does not fail the user
  response;
- a fresh EngineClient failure keeps the current calculation error behavior;
  and
- cache infrastructure failure must not be converted into a 503 when a fresh
  calculation can proceed.

The cache must not silently return a stale or partially readable result merely
to avoid a miss.

The store-side clone and compatibility checks occur before eviction or map
mutation. A failed write therefore cannot partially replace an entry or evict
an unrelated least-recently-used entry. The read-side clone is the only value
returned to a caller; the internal stored clone is never exposed.

Canonicalization invariant failures and invalid cache-constructor identity or
capacity values are different from operational cache failures. They indicate
a programmer/configuration defect and must fail closed (for example, by
throwing the invariant error through the existing internal-error boundary),
not be hidden as endless cache misses. B1 must not call EngineClient with an
input whose key cannot be constructed deterministically.

### 11.3 Result compatibility boundary

B1 owns cache-envelope compatibility, cloning, and the exact configured
namespace/version comparisons. It does not interpret astronomy or invent a
scientific validator. B2, at the EngineClient integration boundary, must
confirm before `set` that the fresh value is structurally a complete
`ChartResult`, that its `schemaVersion` matches the configured
`chartResultContractVersion`, and that the active Engine binding's configured
generation is compatible with the returned result metadata. For the current
mock this preserves `engineVersion: "UI_FIXTURE_V1"`,
`calculationStatus: "INCOMPLETE_RESEARCH"`, null scientific IDs, the research
reason, and all warnings unchanged. Future production validation remains
provider-neutral and must not rewrite or upgrade metadata.

The current structural response guard is private to
`packages/engine-client/src/http-engine-client.ts`, while the server chart
route trusts its injected `EngineClient`. That is not a reason to add route
work in B1: B2 owns the focused structural compatibility check or a small
shared guard before cache storage. An incompatible fresh result is never
cached and never repaired.

## 12. Concurrency and cancellation

### 12.1 In-flight deduplication

P0 **defers single-flight/in-flight deduplication**. Concurrent identical
misses may each call EngineClient. This keeps the first implementation small
and avoids shared promise lifecycle, caller-cancellation, and failure
poisoning complexity.

If a later task adds single-flight behavior, it must ensure that one caller's
cancellation does not incorrectly cancel every waiter, a failed call cannot
populate the result cache, and in-flight state is bounded and cleaned up.

### 12.2 Request cancellation

The current EngineClient.calculateChart contract has no AbortSignal, and the
current HttpEngineClient does not pass one. This cache contract does not add
a signal or change the current interface.

A hit should return immediately. A miss must keep the current EngineClient
lifecycle authoritative and must not store abandoned request state. If
cancellation is added in a future contract, a cancelled or failed calculation
must not populate the cache, and cache operations must not extend the
lifetime of request-specific objects.

## 13. Middleware and rate-limit ordering

The future cache lookup occurs only after the existing request boundaries:

~~~
observe request / assign request ID
  -> apply security headers, including Cache-Control: no-store
  -> enforce exact Origin for unsafe requests
  -> enforce request-level rate limit
  -> parse request body and validate ChartRequest
  -> derive canonical input and cache key
  -> cache lookup
  -> EngineClient call on miss
~~~

For authenticated routes, route authentication remains before the route's
calculation/cache use. A cache entry must never bypass Auth, Origin, request
framing, validation, or rate limiting.

Current POST /api/chart traffic uses the process-local CHART_CALCULATION
rate-limit policy (20 requests per 10-minute window in the current P0 staging
defaults). Cache hits still count as requests because the limiter protects
the endpoint from abuse, not only Engine compute cost. The cache must not
make hits unlimited.

## 14. Vault interaction

A cache hit or miss must not change what Vault receives.

The future server-side calculation boundary may use the same cache service
before POST /api/vault/charts persists a chart, but it must preserve all
current Vault rules:

- the route authenticates the request and derives userId from the session;
- the request is validated before calculation;
- the server obtains the complete result through the EngineClient boundary;
- the user-owned normalized request remains distinct from the result;
- Vault persists the complete server-returned ChartResult, not a browser
  result and not a cache-row reference; and
- display name, category, tags, favorite state, notes, and other Vault
  metadata never enter the shared scientific cache.

On a hit, Vault receives the same complete result payload it would receive
after a fresh equivalent calculation. A cache failure must not cause Vault to
persist a partial result or fail open to browser-supplied science.

## 15. Serialization and mutability

The current `ChartResult` contract is structurally JSON-compatible: its
declared fields are strings, booleans, nullable values, numbers, and arrays or
objects composed of those same JSON-shaped values. It contains no `Date`,
`BigInt`, `Map`, `Set`, function, `undefined`, or open `unknown` field. The
fixture is representative evidence, but this conclusion is based on the
contract in `packages/contracts/src/chart.ts`, not on the fixture alone. A
future non-JSON field would require a ChartResult contract-version change and
a fresh cache compatibility decision. Runtime number values must still be
finite; the existing structural result guard checks that property, and B2
must retain that check before storage because TypeScript's `number` type alone
does not exclude `NaN` or infinity.

The cache uses the existing ChartResult object shape and must not create a
second scientific serialization format or omit fields that are part of the
contract. Because the repository already uses the platform `structuredClone`
in `MockEngineClient` and targets ES2022/Node runtime types, B1 uses native
`structuredClone` for both directions. It does not use a JSON round-trip, so
it does not silently convert `undefined`, Date, BigInt, or special numeric
values. The B2 result-compatibility boundary still rejects malformed or
non-contract values before storage.

The current TypeScript types contain mutable arrays even though the result is
conceptually a snapshot. The future in-memory implementation must use
clone-on-store and clone-on-read:

- clone the complete result before placing it in the cache;
- return a fresh clone on every cache hit; and
- never expose the internal stored object to route enrichment, response
  preparation, Vault preparation, renderer code, or browser adaptation.

The cache must not rely on current consumers happening not to mutate a value.
No heavyweight cloning library is required. A clone failure is a cache error
and must fail open to a fresh calculation when possible. Deep freezing is not
required: the private Map is never exposed, and clone-on-store/read is the
smallest sufficient immutability boundary.

## 16. HTTP/browser cache distinction

The server-side ChartResult cache is distinct from HTTP, browser, service
worker, reverse-proxy, and CDN caching.

The current API security policy remains:

~~~text
Cache-Control: no-store
~~~

This header must not change for a cache hit or miss. The browser
HttpEngineClient must continue using cache: no-store for API requests. A
server-side hit does not authorize a browser, proxy, or CDN to retain a
private calculation response.

## 17. Privacy, retention, and account erasure

The cache is transient operational data, separate from:

- user-owned Vault data;
- Auth records;
- private Feedback;
- account deletion/export data; and
- application operational logs.

Cache entries must not contain email, userId, session ID, account metadata,
Vault name, note, Feedback, IP, request ID, or any other account-linked
metadata. The key is an internal digest, and the raw canonical input is not
stored as a companion value.

Even without an account identifier, a derived ChartResult can be sensitive
personal data in context. The P0 design minimizes exposure through:

- process-local memory only;
- a fixed 15-minute TTL;
- a hard 512-entry bound;
- no browser or CDN cache;
- no raw-input or key logging; and
- restart eviction.

Technically, because the cache is identity-independent and contains no
account linkage, account deletion does not require scanning the cache by
user. This is a storage/linkage behavior statement, not a legal conclusion
that TTL alone satisfies every possible erasure obligation. If an approved
privacy policy later requires deletion of identity-independent derived
results, a separate cache-retention decision must provide a safe process-wide
purge or revised storage design before production use.

The cache must not be treated as an account record and must not become a
reason to weaken the account deletion, export, Auth cleanup, Vault retention,
Feedback retention, or operational-log policies.

## 18. Observability

Cache observability remains server-internal and bounded. B1 adds no
production logger dependency and emits no cache logs. The B2 route
integration may extend the existing request record with:

- cacheStatus: hit, miss, bypass, or error;
- endpoint family: existing chart classification;
- existing request ID;
- existing response status; and
- existing duration.

Where separately approved by the observability contract, bounded Engine
metadata such as Engine version, ChartResult schema version, scientific
configuration identity, provenance status, and warning count may be recorded.
This task does not implement that observability extension. B1 tests may
inspect cache return state, but production cache code does not own logging.

Never log:

- cache key or input digest;
- canonical input;
- raw birth data;
- coordinates;
- timezone;
- place label;
- ChartResult;
- user/account identity; or
- Vault or session data.

Observability failure must not change authoritative request behavior.

## 19. Public response behavior

Cache hits and misses return the same public success contract:

~~~json
{
  "chart": {
    "...": "complete ChartResult"
  }
}
~~~

No cached, cacheAge, cacheKey, or other cache metadata is added to the public
response. cacheStatus is internal observability only. Existing request ID
and Cache-Control: no-store behavior remains unchanged.

The PRD's illustrative response metadata does not alter the current
ChartCalculationApiResponse contract. Any future public metadata would
require a separate API contract decision.

## 20. Database and migration decision

P0 selects process-local memory. Therefore:

- **NO MIGRATION REQUIRED**;
- no cache table is added;
- no cache payload is written to PostgreSQL;
- no cache rows participate in account deletion or Vault ownership;
- no Redis, Memcached, external KV, CDN cache, or object storage is added;
  and
- PostgreSQL remains the persistence layer for current Auth, Vault, notes,
  and Feedback records only.

The existing Vault canonical_result JSONB snapshot is durable user-owned data,
not an ephemeral cache entry and not a substitute for this abstraction.

## 21. Public Sky separation

This contract is limited to personal natal-chart ChartResult values. Public
Sky snapshot/event caching, if implemented under its separate domain contract,
must use separate cache keys and namespaces. A Public Sky cache must never
share keys with personal Natal or Transit results, and personal results must
never enter a public CDN or anonymous Sky response.

No Sky cache runtime work is authorized by this document.

## 22. Future implementation slices

The following bounded slices are intentionally deferred:

### WEB-CACHE-001B1

Implement the provider-neutral canonical input adapter, the exact ordered
serializer, versioned key derivation, and bounded process-local
`ChartResultCache` abstraction under `server/src/app/cache/`. It receives the
explicit namespace/generation/ChartResult compatibility identity and existing
Clock at construction, uses code-owned P0 TTL/capacity defaults, and provides
clone-safe storage. Add only the focused unit tests listed in section 23.

This slice must not integrate the cache into `/api/chart` or Vault routes,
modify `ServerDependencies`/route middleware, change any EngineClient, add
HTTP behavior, add infrastructure, or expose cache metadata publicly.

### WEB-CACHE-001B2

Integrate the cache boundary into the Chart BFF calculation path and the
server-side Vault calculation composition where approved. Add focused route
tests proving middleware/rate-limit ordering, hit/miss response equivalence,
error behavior, and unchanged Cache-Control: no-store.

This slice must not add a provider, alter ChartResult semantics, or expose
cache metadata publicly.

### WEB-CACHE-001C

Perform a focused privacy, concurrency, cancellation, compatibility, and
operational review of the implemented cache. Review actual representative
result sizes and confirm the development/production namespace boundary before
any production deployment claim.

No slice above is started by this contract task.

## 23. Future focused test plan

Tests are not implemented by this documentation task. Future tests must
remain targeted to the cache boundary.

### 23.1 Key tests

- identical canonical inputs produce identical keys;
- every canonical field is explicit and a one-field difference changes the
  canonical JSON/key;
- known and unknown birth time produce different keys;
- deterministic serialization does not depend on source object insertion
  order or locale;
- coordinate serialization does not introduce rounding/tolerance;
- negative zero is serialized as numeric zero;
- reachable non-finite numbers are rejected rather than converted to JSON
  `null`;
- SHA-256 is deterministic and requires no dependency or secret;
- cache format, runtime namespace, Engine generation, and ChartResult
  contract-version changes each produce a different key family; and
- no raw input value appears in a key.

### 23.2 Cache tests

- an empty cache returns a miss;
- set then get returns a compatible hit;
- a compatible hit avoids an EngineClient call;
- a miss calls EngineClient normally;
- a successful complete result populates the cache;
- clone-on-store prevents mutation of the caller's result from changing the
  stored value;
- clone-on-read prevents mutation of one hit from changing a later hit;
- a hit updates LRU recency but does not extend its expiry;
- TTL expiration causes a miss;
- expired entries are removed;
- the hard maximum of 512 entries is never exceeded, including during rapid
  insertion when expired entries exist;
- least-recently-used eviction is bounded and deterministic;
- overwriting a key does not increase size;
- restart starts with an empty process-local cache;
- no background timer or scheduler is created; and
- development and production namespaces remain isolated.

### 23.3 B1 failure tests

- a corrupt/incompatible entry is evicted and becomes a miss;
- a clone failure on write skips the write without corrupting the cache;
- a clone failure on read evicts the entry and exposes no internal object;
- a cache read/write failure fails open where a fresh calculation can
  proceed; and
- canonicalization/configuration invariant failures are surfaced rather than
  hidden as cache misses.

### 23.4 HTTP and security tests

- hit and miss success payloads are identical;
- Cache-Control: no-store remains present;
- rate limits still apply on hits;
- Origin, request framing, input validation, and Auth boundaries still run;
- no public cached, cacheAge, or cacheKey field is introduced; and
- fresh CALCULATION_UNAVAILABLE behavior remains unchanged.

### 23.5 Privacy tests

- no user, email, session, Vault, note, Feedback, IP, or request ID is stored
  in an entry;
- no key, canonical input, coordinates, timezone, or result is logged;
- place-label changes alone do not create scientifically separate entries under
  the current contract; and
- account deletion does not depend on finding identity-independent cache
  entries.

## 24. Frozen implementation boundaries and remaining deferrals

The implementation-critical choices required by B1 are now frozen:

1. B1 owns `server/src/app/cache/chart-result-cache.ts` and the internal
   `ChartResultCache` abstraction;
2. the cache receives explicit `runtimeNamespace`,
   `engineResultGeneration`, and `chartResultContractVersion` values before
   lookup, with current mock values mapped from
   `ENGINE_CLIENT_MODE=development-mock` as documented in section 8;
3. the canonical serializer is the explicit ordered `JSON.stringify` object
   in section 8, with finite-number and negative-zero invariants;
4. `Clock`, code-owned 15-minute/512-entry defaults, lazy expiry cleanup, and
   hard-cap-before-insert behavior are fixed in section 10; and
5. clone-on-store/read, operational fail-open behavior, and B1/B2 result
   compatibility ownership are fixed in sections 11 and 15.

The following remain intentionally deferred and do not reopen those B1
choices:

- route and Vault integration, public response behavior, and cache
  observability extension (B2);
- any future AbortSignal/single-flight behavior; and
- measured capacity changes or a future shared/persistent cache review.

No provider name, raw-input storage, shared persistent cache, mandatory cache
environment variable, or public cache metadata may be selected as a shortcut.

## 25. Prohibited anti-patterns

The following are explicitly prohibited under this contract:

- browser localStorage or session storage as an authoritative calculation
  cache;
- CDN, reverse-proxy, browser, or service-worker caching of ChartResult
  responses;
- changing Cache-Control from no-store;
- an unbounded Map;
- caching errors or negative responses;
- using userId as scientific identity without a separate approved need;
- logging raw birth details or cache keys;
- noon/midnight normalization for unknown birth time;
- a provider-specific cache API or provider-specific public cache contract;
- recomputing partial astronomy in the Website layer;
- persistent cache entries with no version namespace;
- sharing development MockEngineClient results with production;
- adding Redis or another external cache for P0;
- adding a cache dependency without a demonstrated need;
- making Calculate correctness depend on cache availability;
- making cache hits bypass Auth, Origin, validation, request framing, or rate
  limits; and
- accessing or modifying C:/NatalNode.

## 26. Frozen decision summary

| Decision | P0 contract |
| --- | --- |
| Cached value | Complete provider-neutral ChartResult only |
| Location | BFF/server process-local bounded memory |
| Cache format | Versioned v1 key family |
| Input identity | Complete canonical calculation input, excluding current presentation-only place label |
| Unknown time | Explicit null/UNKNOWN_TIME; no fallback time |
| Coordinates | Exact normalized finite numbers; no rounding/tolerance |
| House system | Always part of key |
| Hash | SHA-256 of deterministic canonical JSON |
| New secret | None |
| User identity | Not part of scientific cache identity |
| Runtime identity | Explicit server-composition `runtimeNamespace`; current mock value `development-mock`, future production value must be distinct |
| Engine generation | Explicit pre-call `engineResultGeneration`; current mock value `UI_FIXTURE_V1`, future production value is provider-neutral and deployment-owned |
| ChartResult compatibility | `ChartResult.schemaVersion`; current value `1.0.0` |
| TTL | 15-minute fixed, internal/configurable |
| Capacity | 512 entries per process with TTL + LRU |
| Expiry clock | Existing server `Clock`; no direct `Date.now()` |
| Errors | Never cached |
| In-flight deduplication | Deferred |
| Cache failure | Fail open to fresh EngineClient calculation |
| Mutability | Clone on store and clone on read |
| HTTP behavior | Cache-Control: no-store unchanged |
| Database | No cache table; no migration |
| Provider | PROVIDER DECISION DEFERRED |

## 27. Status

This document is the single P0 ChartResult cache contract:

~~~text
APPROVED TECHNICAL DIRECTION
RUNTIME IMPLEMENTATION DEFERRED
~~~

No runtime changes, migrations, dependency changes, tests, builds, provider
selection, or access to C:/NatalNode are part of WEB-CACHE-001A.
