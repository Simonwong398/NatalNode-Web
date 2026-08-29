# NatalNode P0 Privacy-Minimized Observability Contract V1

Task ID: WEB-OBS-001A

Review: WEB-OBS-001A-R1

Status: APPROVED TECHNICAL DIRECTION

Runtime status: RUNTIME IMPLEMENTATION DEFERRED

This document freezes the minimum privacy-minimized operational-observability
contract for the P0 Web API boundary. It is a design and implementation
handoff document. It does not authorize or contain runtime observability
changes.

The contract is intentionally narrower than a general analytics, audit, or
application-telemetry system. It is designed to answer whether the API is
available, whether bounded endpoint families are failing or slowing down,
whether calculation/cache behavior is working, and whether approved runtime
and scientific generations are compatible. It must not become a second copy
of a birth chart, a user account, a Vault record, or an Engine response.

## 1. Scope and non-goals

### In scope

- Operational request records emitted at the Website API / BFF boundary.
- A bounded endpoint-family taxonomy with no raw URL or query-string logging.
- Correlation with a server-generated request ID.
- HTTP outcome, elapsed API duration, and bounded error classification.
- A future, internal-only representation of cache and Engine outcomes.
- Privacy, cardinality, retention, export/deletion, and access-audit boundaries.
- A focused implementation and test handoff for WEB-OBS-001B1.

### Out of scope

- Runtime implementation in this task.
- HTTP or production Engine integration.
- Astronomy calculations or provider selection.
- Product analytics, behavioral tracking, advertising, or marketing events.
- Privacy-access audit records. Those are a separate security/audit stream.
- A log vendor, metrics vendor, APM agent, tracing backend, or exporter.
- Changes to the Problem Details response contract.
- Changes to the cache contract or public API response metadata.
- Any code or file under C:\NatalNode.

If provider selection becomes relevant, the decision remains:

PROVIDER DECISION DEFERRED

## 2. Source of truth and observed repository baseline

The repository baseline for this R1 review was:

- Commit: 2655dc0b856ba54458fb86dc4d1c2e13f288881a
- Message: docs: define p0 observability contract
- Working tree: clean before this documentation-only patch

The following sources were read in full or inspected at the minimum relevant
runtime boundary:

- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/product/NATALNODE_P0_READINESS_CHECKPOINT_V1.md
- docs/product/NATALNODE_CHARTRESULT_CACHE_V1.md
- server/src/app/observability/api-request-observability.ts
- server/src/app/create-app.ts
- server/src/app/security/api-security-headers.ts
- server/src/app/security/api-rate-limiting.ts
- server/src/app/security/enforce-same-origin-unsafe-api-requests.ts
- server/src/app/security/trusted-edge-client-identity.ts
- the current chart, sky, auth, account, export, feedback, Vault chart, and
  Vault note route registrations
- the current Problem Details registry and the chart/cache dependency boundary

### 2.1 Current implementation, exactly as observed

The current implementation in
server/src/app/observability/api-request-observability.ts has these
properties:

1. observeApiRequests generates a server-side random UUID for each request and
   exposes it in the response header X-Request-Id. It does not trust an
   incoming request ID as the canonical ID.
2. The middleware records the bounded method, a bounded endpointFamily, the
   numeric HTTP status, and a non-negative rounded duration measured with
   performance.now().
3. A normal request emits a JSON-lines completion record named
   api.request.completed.
4. An unhandled API error currently emits an auxiliary api.request.error record
   from the application error handler and can also be followed by the normal
   completion record. This is a current duplicate-accounting behavior, not the
   approved P0 target.
5. The current record level is info for a completion status below 500 and
   error for a completion status of 500 or above. The auxiliary error event is
   error. Expected 4xx and 429 outcomes are not currently elevated to error.
6. Informational records are written to standard output and error records are
   written to standard error. writeOperationalRecord serializes one JSON object
   followed by a newline and catches its own write/serialization failures.
7. The current record has no cacheStatus, problemCode, Engine metadata,
   scientific status, warning count, or Engine duration.
8. The current classifier does not retain a raw pathname, query string,
   request body, response body, exception text, client IP, Origin, or user
   identity in the operational record.
9. The current API security middleware applies no-store and other security
   headers to API responses. Same-origin rejection and rate limiting happen at
   the API boundary, but their raw inputs and limiter identities are not
   emitted by the observability middleware.
10. The current cache is server-internal. Cache hits return clones, misses
    call the configured EngineClient, and cache writes are best effort. Cache
    outcomes are not currently connected to the request record. The current
    cache API does not preserve enough outcome information to distinguish every
    operational error from a normal miss.

The current field names are preserved below. Future work may add bounded
fields, but must not silently rename endpointFamily, requestId, durationMs, or
the canonical completion event. The current auxiliary error event is
explicitly retired by the B1 decision above.

## 3. PRD gap matrix

The matrix distinguishes an observed implementation from an approved future
direction. A row marked partial or missing is not implemented by this task.

| PRD or P0 requirement | Current repository truth | Classification | Contract decision and future owner |
| --- | --- | --- | --- |
| Request ID for API requests | Server-generated UUID and X-Request-Id response header exist | IMPLEMENTED | Preserve server generation. Keep requestId as the only operational correlation key. B1 owns focused coverage. |
| HTTP method | Bounded known-method set with OTHER fallback exists | IMPLEMENTED | Preserve the allowlist and OTHER. Never log an unbounded method string. |
| Route or endpoint | Bounded endpointFamily classifier exists | PARTIAL | Treat endpointFamily as the canonical operational route dimension. Do not log raw URL, pathname, query, or route parameters. B1 owns coverage. |
| HTTP status | Completion and auxiliary error records include numeric status | IMPLEMENTED | Preserve actual response status. 429 and expected 4xx remain observable outcomes. |
| Request duration | Completion records include rounded durationMs; auxiliary error records currently omit it | PARTIAL | Require durationMs on the one canonical completion record. B1 removes the auxiliary error record rather than normalizing a duplicate. |
| Structured operational format | One JSON object per line is written to stdout/stderr | IMPLEMENTED | Preserve JSON-lines records and bounded schemas. No vendor-specific format is selected. |
| API failure visibility | 5xx completion level and a duplicate auxiliary error event exist | PARTIAL | Make api.request.completed the only canonical request event. B1 removes api.request.error. Add only bounded problemCode to completion records. |
| Error code | Problem Details has a finite ProblemCode registry, but the logger does not receive it | PARTIAL | B1 carries the typed code through request-local Hono context from the existing canonical response helper. Never parse detail or exception text. |
| Cache status | Cache behavior exists but is not instrumented | MISSING | Add optional internal-only cacheStatus on calculation-bearing chart paths in B2. First add typed cache outcome reporting; do not emit error until it is observable. Never expose it publicly or log a cache key. |
| Engine version or generation | Runtime/cache configuration has trusted generation information, but the logger does not receive it | MISSING | Use provider-neutral engineResultGeneration as the canonical bounded field. B2 owns propagation. |
| Chart schema version | ChartResult/cache configuration has a contract version, but the logger does not receive it | MISSING | Add optional chartResultContractVersion on calculation-bearing paths. B2 owns propagation. |
| Scientific status | ChartResult has a bounded calculationStatus field, but the logger does not receive a status projection | MISSING | Add scientificStatus only as a stable projection of ChartResult.calculationStatus, with source-defined values. B2 owns propagation. |
| Provenance status | ChartResult has provenance identifiers but no existing provenanceStatus field or shared status taxonomy | DEFERRED | Do not invent a new observability taxonomy. Defer provenanceStatus until a source-level contract exists; never emit provenanceEnvelopeId. |
| Engine request duration | Only whole API duration is currently measured | MISSING | Add optional engineDurationMs only at a trusted calculator/Engine boundary. Do not infer it from whole-request duration. B2 owns propagation. |
| Warning count | ChartResult warnings exist, but the current validator has no finite warning-array bound | MISSING | Defer warningCount until a finite source-level bound is defined. Do not emit an unbounded count merely because it is numeric. |
| Metrics | No metrics backend or exporter is installed | MISSING | Keep structured logs as the P0 transport. Define derived metric dimensions in implementation work only; do not add a vendor or exporter here. |
| Privacy minimization | Current middleware omits sensitive request and response data | PARTIAL | Freeze the prohibited-data table in this document. B1 and B2 must test it. |
| Retention | No operational-log retention duration is frozen in the inspected sources | DEFERRED | RETENTION DURATION DEFERRED TO RETENTION/POLICY TRACK. |
| Privacy access audit | Not implemented by request observability | INTENTIONALLY SEPARATE | Do not use operational request logs as access-audit evidence. Define a separate audit contract. |
| Account export and deletion | Routes exist and are operationally classifiable; content and identity are not logged | PARTIAL | Record bounded outcome and endpoint family only. Define legal, retention, and audit interaction separately. |
| Streaming/export truthfulness | The current middleware observes the response after the handler returns; it does not consume or verify the returned stream | PARTIAL | Describe only server response-boundary completion. Never claim stream consumption or client download. |
| Safe sink boundary | The current writer is private and directly selects process stdout/stderr; it is not injectable | MISSING | B1 adds only a narrow synchronous ObservabilitySink.write(record) boundary with a process-stream default. It is not a logging framework or delivery subsystem. |

## 4. Operational-observability objective

The P0 contract must allow an operator to answer the following without
recovering personal data:

- Is a bounded API endpoint family available?
- Are failures concentrated in a status class, endpoint family, or approved
  runtime generation?
- Is latency changing, and is the change at the API boundary or at the
  calculation boundary?
- Are compatible chart calculations using the cache?
- Are cache operational failures distinct from Engine calculation failures?
- Are validation, authentication, origin, and rate-limit outcomes visible
  without revealing the input that produced them?
- Are Engine-result contract, generation, and source-defined scientific-status
  differences visible in an approved bounded form? Warning-count visibility
  remains deferred until its source bound is defined.
- Can a request be correlated using a server-issued requestId without
  correlating it to a user identity?

The contract must not answer these questions by recording the request, the
chart, the Vault, or the account itself.

## 5. Core event contract

### 5.1 Canonical event names

The P0 canonical event-name set is exactly:

- api.request.completed

api.request.error is a legacy current implementation event, not a second P0
canonical event. B1 removes its emission. No endpoint-specific event names are
required for P0. A future metric or dashboard may group canonical completion
records by bounded fields; it must not invent uncontrolled event names from
URL paths, error text, provider names, or user input.

### 5.2 Completion record

Every observable API request must have exactly one canonical completion record
emission attempt, including success, expected client/security outcomes, cache
or calculation failures, and an unexpected API error converted by the central
Hono error boundary. A sink failure can suppress delivery, but it must never
create a duplicate or change the API result.

The completion record must contain these fields:

| Field | Required | Meaning |
| --- | --- | --- |
| timestamp | Yes | UTC ISO 8601 event timestamp generated by the server |
| level | Yes | info or error under the level policy below |
| event | Yes | api.request.completed |
| requestId | Yes | Server-generated UUID for this request |
| method | Yes | Allowlisted HTTP method or OTHER |
| endpointFamily | Yes | One value from the bounded taxonomy below |
| status | Yes | Numeric HTTP response status |
| durationMs | Yes | Non-negative integer for elapsed API request time |

The current implementation already provides this completion shape for the
completion event. The contract does not require the current response header to
be removed or changed.

Expected completion outcomes are:

| Outcome | Completion level | Status | Optional problemCode |
| --- | --- | --- | --- |
| Successful request | info | Actual 2xx/3xx status | Omit unless a canonical problem exists |
| Invalid request | info | 400 | INVALID_REQUEST |
| Unauthorized | info | 401 | UNAUTHORIZED |
| Forbidden, including origin rejection | info | 403 | FORBIDDEN |
| Not found | info | 404 | NOT_FOUND |
| Conflict | info | 409 only if a future route introduces it | No current 409 ProblemCode exists; do not infer one from status |
| Rate limited | info | 429 | RATE_LIMITED |
| Unexpected internal failure | error | 500 | INTERNAL_ERROR |
| Calculation unavailable | error | 503 | CALCULATION_UNAVAILABLE |

Status and level are separate dimensions. A client/security outcome is not a
server error merely because it is non-2xx.

### 5.3 Auxiliary error record decision

The current source emits api.request.error in app.onError and then can emit
api.request.completed when the middleware resumes. The current error record
contains no message, stack, constructor name, database text, provider text,
or request data, but it repeats the same bounded request facts.

R1 decision: api.request.error provides no necessary P0 value once the
canonical completion record contains final status, level, and typed
problemCode. B1 MUST remove its emission and the associated duplicate event
type. R1 does not remove runtime code.

After B1, exactly one completion event is the request-volume, request-error,
status, and latency accounting record. Any legacy api.request.error observed
during rollout must be treated as an auxiliary migration signal and excluded
from all request, 5xx, error, and latency counters. It must not be retained
as a second diagnostic channel merely for tradition.

### 5.4 Authoritative field decision table

This table is the field-level contract for future implementation. Optional
fields are internal operational fields, not public API response fields or
response headers.

| Field | Required or optional | Source and allowed form | Cardinality and privacy rule | Endpoint applicability | Current status |
| --- | --- | --- | --- | --- | --- |
| timestamp | Required | Server UTC ISO 8601 string | Time-shaped and bounded; no client-supplied timestamp | All API records | Implemented |
| level | Required | Allowlist: info, error | Two values only; no dynamic severity | All API records | Implemented |
| event | Required | Fixed value api.request.completed; legacy api.request.error is removed in B1 | One canonical value | All API records | Partial |
| requestId | Required | Server-generated UUID | High-cardinality correlation value; never joined to account/user identity | All API records | Implemented |
| method | Required | GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE, or OTHER | Eight bounded values | All API records | Implemented |
| endpointFamily | Required | Bounded taxonomy in section 6 | Low-cardinality operational dimension; never raw path | All API records | Implemented |
| status | Required | Numeric HTTP status | Low-cardinality bounded status outcome; no body or detail | All API records | Implemented |
| durationMs | Required on canonical completion | Server-measured non-negative integer | Numeric only; no timestamps or timing trace | All API records | Implemented for completion |
| problemCode | Optional | Finite ProblemCode registry, carried through request-local typed Hono context by the canonical response helper | Low-cardinality allowlist; no detail, title, stack, or raw error | Any API family returning a canonical problem | Future, B1 |
| cacheStatus | Optional | hit, miss, or error only after the B2 typed cache outcome extension; bypass is reserved | No key, digest, input, or cache payload | Calculation-bearing chart and Vault-create operations only | Future, B2 |
| engineResultGeneration | Optional | Trusted runtime/calculation generation, bounded and allowlisted | Low-cardinality deployment/scientific dimension; no provider-specific secret or URL | Calculation-bearing operations only | Future, B2 |
| chartResultContractVersion | Optional | Trusted ChartResult contract version | Bounded version string; no result body | Calculation-bearing operations only | Future, B2 |
| scientificStatus | Optional | Stable observability projection of ChartResult.calculationStatus: COMPLETE or INCOMPLETE_RESEARCH | Two source-defined values; no scientific details | Calculation-bearing operations only | Future, B2 |
| provenanceStatus | Deferred | No existing source-level field or shared taxonomy with this exact semantic | Do not invent a new status; provenanceEnvelopeId remains prohibited | Calculation-bearing operations only | Deferred |
| warningCount | Deferred | ChartResult.warnings exists, but the validator defines no finite warning-array bound | Do not emit an unbounded count; warning text is prohibited | Calculation-bearing operations only | Deferred |
| engineDurationMs | Optional | Trusted duration measured around the EngineClient call only | Non-negative integer; absent on cache hit; distinct from API duration | Calculation-bearing operations only | Future, B2 |
| astronomyConfigurationId | Deferred conditional | Only a trusted, bounded, non-user-controlled scientific configuration identifier approved by a later privacy review | Must not be a cache key, request-derived value, raw provider payload, or unrestricted identifier; omit until approved | Calculation-bearing operations only | Deferred; does not block B1 |

engineResultGeneration is the canonical provider-neutral replacement for a
free-form provider or engine label. A separate providerName, provider URL, or
credential-bearing engine field is not part of this contract.

The PRD permits an astronomyConfigurationId as ordinary operational metadata.
This R1 review keeps it explicitly deferred and not implementation-ready for
P0. A later implementation may emit it only after proving the bounded-source,
syntax, cardinality, and privacy conditions in the table. Until then, no
provenanceStatus substitute is invented and the safe projections are limited
to source-defined scientificStatus and the approved generation/version fields.

## 6. Endpoint-family taxonomy

endpointFamily is the canonical route dimension. The current classifier uses
these exact bounded values and route shapes:

| endpointFamily | Current route shape | Current method(s) | Operational meaning |
| --- | --- | --- | --- |
| health | /api/health | GET | Health/readiness boundary |
| chart | /api/chart | POST | Chart calculation request |
| sky.snapshot | /api/sky/snapshot | POST | Current Sky snapshot request |
| sky.events | /api/sky/events | POST | Current Sky events request |
| auth.email.request | /api/auth/email/request | POST | Magic-link request boundary |
| auth.email.complete | /api/auth/email/complete | POST | Magic-link completion boundary |
| auth.session | /api/auth/session | GET | Session inspection boundary |
| auth.logout | /api/auth/logout | POST | Session logout boundary |
| account.delete | /api/account | DELETE | Account deletion boundary |
| account.export.prepare | /api/account/export/prepare | POST | Export preparation/authentication boundary |
| account.export | /api/account/export | POST | Account export stream boundary |
| feedback | /api/feedback | POST | Authenticated feedback submission |
| vault.charts | /api/vault/charts | GET, POST | Vault chart collection/list/create boundary |
| vault.chart | /api/vault/charts/{chartId} | GET, PATCH, DELETE | Single Vault chart boundary |
| vault.notes | /api/vault/charts/{chartId}/notes or /api/vault/charts/{chartId}/notes/{noteId} | GET, POST, PATCH, DELETE | Vault note boundary |
| unknown-api | Any other /api/* route | Any | Bounded fallback for an unclassified API route |

The classifier must continue to test the more specific export-prepare route
before the export route and the notes patterns before the single-chart
fallback. Route parameters are represented only by the family. The literal
parameter values are never logged.

The optional calculation fields apply to a request operation, not blindly to
every method in a family. For example, a POST that creates a Vault chart may
carry calculation metadata in a future implementation, while a GET that
lists Vault charts must not manufacture it.

## 7. Request-ID policy

1. The server owns request ID generation using a cryptographically strong
   UUID source already used by the current middleware.
2. requestId is an operational correlation value, not an account, session,
   email, IP, or analytics identifier.
3. The response header remains X-Request-Id. A future implementation must not
   echo an arbitrary caller-supplied identifier as the canonical value.
4. Request IDs may be unique and therefore high-cardinality. They are
   permitted only for short-lived operational correlation and must not be
   used to join logs to user records.
5. Request IDs must not be placed in URLs, cookies, chart metadata, Vault
   records, exported account data, or public chart results.

## 8. HTTP method, status, and duration policy

### 8.1 Method

The known method allowlist is GET, HEAD, OPTIONS, POST, PUT, PATCH, and
DELETE. Any unexpected method is normalized to OTHER. Do not log the original
unbounded method token.

### 8.2 Status

status is the numeric HTTP response status observed at the API boundary.
Expected client outcomes are still operationally useful:

- 2xx and 3xx are normal outcomes unless a future contract says otherwise.
- 4xx, including 401, 403, 404, 413, 415, 422-style validation outcomes,
  and 429 rate limiting, are bounded client/security outcomes.
- 5xx are server or dependency failure outcomes.

The status field does not authorize logging the response body, Problem Details
detail, request payload, or dependency error.

### 8.3 Duration

durationMs is whole API request elapsed time measured by the request
middleware. It is a non-negative rounded integer. It is required on
api.request.completed, which is the only canonical P0 event after B1.

engineDurationMs, if implemented later, measures only a trusted
calculator/Engine boundary. It must not be substituted for durationMs or
treated as proof that a streamed export was received by a client.

Do not log raw start/end timestamps, high-resolution timing traces, payload
sizes, or per-operation spans as part of this P0 record.

## 9. Level and event-name policy

### 9.1 Level

The level allowlist remains info and error:

- Completion status below 500: info.
- Completion status 500 or above: error.

Expected 4xx and 429 responses must remain visible as status outcomes without
being mislabeled as server errors. No warn, debug, trace, or dynamically
constructed level is added to this P0 contract.

### 9.2 Event names

Event names are fixed constants:

- api.request.completed is the canonical request outcome.
- api.request.error is a legacy event removed by B1; it is not part of the P0
  event stream after B1.

Do not construct names from path segments, Problem Details titles, exception
messages, provider names, cache keys, or user input.

## 10. Problem Details and problemCode

The current repository has a finite ProblemCode registry:

- INVALID_REQUEST
- UNAUTHORIZED
- FORBIDDEN
- RECENT_AUTHENTICATION_REQUIRED
- NOT_FOUND
- PAYLOAD_TOO_LARGE
- UNSUPPORTED_MEDIA_TYPE
- RATE_LIMITED
- INTERNAL_ERROR
- CALCULATION_UNAVAILABLE

The current observability middleware does not receive the canonical code.
The implementation-ready B1 handoff is request-local typed Hono context:

1. The existing createProblemDetailsContextResponse helper sets a
   problemCode context variable from input.code before it creates the
   response.
2. The existing ProblemCode type is the only source of the context variable;
   no duplicate registry is created.
3. observeApiRequests reads the optional context variable when it emits the
   single completion record.
4. app.onError must use the canonical Problem Details context helper before
   returning its sanitized INTERNAL_ERROR response, so unexpected API errors
   also receive INTERNAL_ERROR without parsing a response body.
5. The context variable is request-local and typed. It is not global mutable
   state, a response-body parser, a string matcher, or a status-to-code
   guess.

This makes problemCode optional on successful records and present when a
canonical Problem Details response was selected. It must be one of the finite
registry values above.

The logger must not parse a Problem Details response body to discover the
code. It must not record type, title, detail, instance, response body, or
the internal ProblemDetailKey/detail registry. This document does not migrate
the current response envelope to another RFC version and does not change the
public API contract.

## 11. Error-sanitization and safe sink policy

Operational records may describe that a bounded endpoint family returned a
status or approved problemCode. They must not describe the sensitive reason
that may have produced it.

Allowed:

- requestId
- method
- endpointFamily
- status
- durationMs
- finite problemCode, when centrally sourced
- bounded cache/Engine fields approved in this document

Prohibited:

- raw exception message or stack
- SQL/database/provider response
- request body or response body
- validation detail or field values
- email, token, session, cookie, or credential material
- full URL, query string, Origin, Referer, or route parameters

Unexpected internal failures must remain sanitized at the public API boundary
and in the operational stream.

### 11.1 Safe sink boundary

The current writeOperationalRecord function is private, synchronous, and
directly selects process.stdout or process.stderr. It is not injectable, so
focused tests cannot use a repository-owned writer boundary without patching
process globals.

B1 adds the smallest safe boundary:

ObservabilitySink.write(record): void

The record argument is the typed, bounded operational record defined by this
document. The default implementation preserves the current stdout/stderr
selection and JSON-lines format. observeApiRequests accepts an optional sink
through its middleware options, defaulting to the process-stream
implementation. A focused test may inject a synchronous in-memory sink. The
interface must not grow into a generic logger, APM abstraction, async delivery
queue, retry engine, buffering subsystem, or global mutable sink.

The request middleware owns the fail-open call boundary. It catches a sink
throw and continues the authoritative request flow. The default sink also
serializes only the approved record fields; it does not accept arbitrary
objects and does not use a general redactor.

## 12. Cache-observability decision

The cache remains an internal optimization and compatibility boundary. Cache
observability is approved only as a bounded internal outcome; it is not public
response metadata.

The B2 cacheStatus vocabulary is:

- hit: a compatible cached ChartResult was returned to the calculator caller.
- miss: no usable compatible entry was available and the calculator proceeded
  toward a fresh Engine calculation without a cache operational failure.
- error: a cache read, clone, write, or equivalent cache operation had an
  operational failure, while the request could continue or fail separately.
  This value is not implementation-ready in the current APIs.
- bypass: a future explicitly supported path intentionally did not consult the
  cache. The current runtime has no general bypass mode and must not emit this
  value until one exists.

The current ChartResultCache APIs cannot truthfully distinguish all of these
states:

- get returns undefined both for an empty/stale/incompatible entry and after
  some clone failures;
- set returns false for a clone failure, but CachedChartCalculator currently
  ignores that boolean;
- key/clock failures can throw rather than return a typed cache outcome.

R1 decision: choose the minimal internal outcome extension in B2. B2 must add
a private discriminated cache outcome at the cache/calculator boundary, for
example a lookup result with hit, miss, and error variants and a store result
that distinguishes stored from error. The exact type name may follow the
repository convention, but it must be request-local, typed, and returned
through an internal calculation outcome. ChartResultCache remains free of
logging.

The B2 calculator outcome direction is:

1. ChartResultCache reports a typed lookup outcome. A compatible cloned entry
   is hit; a normal empty, stale, or incompatible entry is miss; an actual
   cache operation failure is error.
2. ChartResultCache reports whether a fresh-result store succeeded. A store
   failure changes the final cache outcome to error, rather than being
   silently discarded.
3. B2 adds a server-internal ChartCalculationOutcome and an internal
   calculateChartWithOutcome operation to the chart-calculation service.
   Existing calculateChart remains a ChartResult-returning compatibility
   operation that unwraps the outcome. Calculation-bearing routes use the
   outcome only to populate request-local observability context and continue
   returning only the ChartResult in public API responses.
4. No global mutable last-outcome state is used, and no low-level cache module
   emits a log.

Once the typed outcome exists, precedence and failure truthfulness are:

1. A compatible returned entry is hit.
2. A cache operational failure is error, even if a fresh calculation later
   succeeds.
3. A normal empty lookup followed by an Engine attempt is miss.
4. An Engine failure after a normal miss remains miss; the HTTP status and
   optional problemCode describe the separate calculation failure.
5. No cacheStatus is emitted on Sky, auth, feedback, account, export, or
   Vault read/note operations that do not calculate a chart.

Cache status must never include:

- the canonical cache key
- an input digest
- a request hash
- birth data
- a ChartRequest or ChartResult
- cache contents
- a user/account/session identity

Future owner: WEB-OBS-001B2, coordinated with the existing cache contract.

## 13. Engine-result metadata decision

Future calculation-bearing records may include the following bounded
projections:

| Field | Approved meaning | Source rule |
| --- | --- | --- |
| engineResultGeneration | Trusted result/runtime generation | Use the runtime-injected cache identity described below; never use request input or provider name |
| chartResultContractVersion | ChartResult contract version accepted by the calculator | Use the same runtime-injected cache identity used by CachedChartCalculator; do not hard-code a second version |
| scientificStatus | Stable observability projection of ChartResult.calculationStatus | Use exactly COMPLETE or INCOMPLETE_RESEARCH |
| provenanceStatus | No implementation-ready decision | Defer; no new observability taxonomy is introduced |
| warningCount | Count of result warnings | Defer until ChartResult validation defines a finite warning-array bound |
| engineDurationMs | Time spent in the actual EngineClient call | Measure only around the EngineClient call on a cache miss; omit on cache hit |
| astronomyConfigurationId | Conditional scientific configuration identity | Defer until a separate bounded-source/privacy decision |

The trusted pre-calculation source for engineResultGeneration and
chartResultContractVersion is the same runtime-injected
chartResultCacheIdentity used by CachedChartCalculator:

1. create-executable-server-bindings.ts supplies the provider-neutral
   chartResultCacheIdentity.
2. create-server-runtime-dependencies.ts passes that identity to
   CachedChartCalculator.
3. CachedChartCalculator uses engineResultGeneration to validate
   ChartResult.engineVersion and chartResultContractVersion to validate
   ChartResult.schemaVersion.
4. B2 reads the same trusted identity for observability; it does not duplicate
   or derive either value from the request or an unvalidated Engine response.

In the current development composition these values are UI_FIXTURE_V1 and
1.0.0. That is a development binding fact, not a production provider
decision.

These fields are not a license to serialize ChartResult metadata. In
particular, do not emit planets, signs, houses, aspects, retrograde state,
coordinates, calculation inputs, full warnings, provenanceEnvelopeId,
provider-specific response details, or a fabricated provenanceStatus.

scientificStatus is intentionally an observability field name whose source is
the existing ChartResult.calculationStatus field. It adds no new values or
scientific taxonomy.

No provider name, provider URL, API key, provider request ID, or provider
diagnostic payload is part of the P0 record. The generation field is intended
to reveal approved compatibility differences without disclosing provider
internals.

## 13.1 Trusted metadata string policy

Generation and version values are trusted runtime strings, not global
hard-coded logger allowlists. Before they can enter an operational record,
they must satisfy all of these conditions:

- sourced from the validated runtime composition/cache identity;
- non-empty and no longer than 256 characters, matching the current cache
  identity bound;
- free of control characters, line separators, and JSON delimiter injection;
- not supplied by request input or copied from an arbitrary provider payload;
- emitted as a single bounded field with no dynamic field names or labels.

Legitimate opaque deployments therefore do not require editing the logger for
each new generation, while unsafe or untrusted values are omitted/rejected at
the typed boundary.

## 14. Surface-specific observability policies

### 14.1 Sky

Sky request success/failure, status, duration, and bounded endpoint family may
be observed. Do not log snapshot payloads, event streams, timestamps supplied
by callers, celestial positions, provider responses, coordinates, or
scientific identifiers. Current Sky is not a chart-calculation cache path and
does not receive cacheStatus or chart-result metadata.

### 14.2 Vault

Vault chart and note operations may be observed as bounded endpoint outcomes.
Do not log chart IDs, user IDs, account IDs, display names, labels, tags,
favorite state, note IDs, note text, stored requests, stored results,
provenance data, or timestamps copied from Vault records.

A Vault chart creation calculation may receive the same future internal cache
and Engine projections as the chart calculation boundary. Vault reads,
updates, deletes, and note operations must not manufacture those fields.

### 14.3 Feedback

Feedback submission may be observed by endpoint family, status, duration, and
optional bounded problemCode. Never log feedback category, message, account
identity, request body, validation values, or persistence error text.

### 14.4 Authentication and anti-enumeration

Auth email request, email completion, session, and logout outcomes may be
observed through their bounded family and HTTP status. Do not log email
addresses, magic-link tokens, token hashes, cookies, session IDs, OAuth
material, user IDs, or raw authentication errors.

The observable status pattern must preserve the route's anti-enumeration
behavior. Operational logging must not add a signal that distinguishes
whether a particular email or account exists.

### 14.5 Account deletion

Account deletion may produce a bounded endpoint outcome and duration. It must
not log account identity, recent-authentication material, deletion payload,
chart/note contents, deletion counts, email, or erasure errors containing
record data. Operational logs do not prove that every downstream system has
been erased; deletion guarantees belong to the account/data-lifecycle
contract.

### 14.6 Account export

Export preparation and export streaming must remain separate endpoint
families. The current middleware emits its completion record after the export
handler returns a Response containing a ReadableStream. It does not consume
the stream and has no client-receipt signal. It must not log exported
contents, filenames derived from user data, account identity, chart/note
records, stream bytes, or response payloads.

For a streamed export, server-side request completion is not proof that the
client received or saved the complete download. No event name or field may
claim client-download success unless a separately designed client receipt
protocol exists.

### 14.7 Rate limiting

Rate-limited requests must remain visible through endpointFamily and status
429, with optional problemCode RATE_LIMITED when centrally available. Do not
log client IP, trusted-edge header value, HMAC identity, account identity,
limiter bucket key, counters, or raw rate-limit headers.

### 14.8 Origin rejection

Same-origin rejection may be observed through the bounded endpoint family,
method, status, and optional problemCode FORBIDDEN. Do not log raw Origin,
Referer, host comparison values, client IP, edge headers, or the rejected
URL.

## 15. Metrics, format, and cardinality

### 15.1 Metrics versus logs

Structured operational logs are the P0 transport already present in the
repository. This task does not install or select a metrics, tracing, APM, or
log-vendor backend.

Future dashboards may derive bounded counters and histograms from canonical
completion events, including:

- request count by endpointFamily, method, status class, and level
- latency distribution by endpointFamily
- error count by endpointFamily and problemCode
- cache hit/miss/error count on calculation-bearing operations
- compatibility count by approved generation or contract version
- scientific-status count by scientificStatus, when B2 approves that field

These are logical metric definitions, not implementation or exporter
requirements. They must not add unrestricted labels such as request body,
account, chart, URL, provider response, or exception message.

### 15.2 Structured format

The canonical format is one JSON object per line. JSON serialization is the
encoding boundary and must remain the final operation before writing. The
current channel split is preserved: info records go to standard output and
error records go to standard error.

The implementation must use fixed field names and allowlisted values. It must
not accept arbitrary metadata maps from routes.

### 15.3 Cardinality

| Dimension | Cardinality policy |
| --- | --- |
| timestamp | Required event time; bounded format but naturally time-varying |
| requestId | Permitted high-cardinality operational correlation only |
| method | Fixed allowlist |
| endpointFamily | Fixed taxonomy |
| status | Numeric HTTP status, operationally bounded |
| level/event | Fixed allowlists |
| problemCode | Finite registry |
| cacheStatus | hit, miss, or error after B2 outcome reporting; bypass is reserved and not emitted |
| engineResultGeneration | Trusted bounded allowlist |
| chartResultContractVersion | Bounded version value |
| scientificStatus | COMPLETE or INCOMPLETE_RESEARCH |
| provenanceStatus | Deferred; not an accepted dimension |
| warningCount/durations | Durations are numeric; warningCount is deferred until bounded |
| astronomyConfigurationId | Deferred and separately reviewed; omit |

No unrestricted request or account dimension is accepted as a label, field,
or dynamic event name.

## 16. Privacy and data-minimization boundary

The following table is normative. A future implementation must test both
normal and error paths against it.

| Data class | Ordinary operational logs | Safe alternative |
| --- | --- | --- |
| Birth date, local time, date precision, or time components | PROHIBITED | endpointFamily, status, durationMs |
| Birthplace text, latitude, longitude, altitude, or exact location | PROHIBITED | endpointFamily, status, bounded problemCode |
| Resolved timezone, offset, or timezone-resolution input | PROHIBITED | status only; no resolution detail |
| Full ChartRequest | PROHIBITED | cacheStatus and approved Engine projections |
| ChartResult body, planets, signs, houses, aspects, angles, retrograde state | PROHIBITED | chartResultContractVersion and scientificStatus; warningCount remains deferred |
| Interpretation text, labels, or generated content | PROHIBITED | status and duration |
| Vault chart IDs, note IDs, labels, tags, names, favorites, notes, requests, results | PROHIBITED | vault endpointFamily and status |
| Feedback category, message, request body, or account identity | PROHIBITED | feedback endpointFamily and status |
| Email address, user/account ID, session ID, magic-link token, cookie, OAuth material | PROHIBITED | auth/account endpointFamily and status |
| Raw client IP, trusted-edge client header, HMAC identity, User-Agent | PROHIBITED for this contract | bounded rate-limit/origin outcome only |
| Raw Origin, Referer, full URL, query string, route parameter | PROHIBITED | endpointFamily and method |
| Raw exception, stack, SQL error, provider response, credential, or secret | PROHIBITED | status and finite problemCode |
| Cache key, canonical input, digest, request hash, or cache payload | PROHIBITED | cacheStatus |
| provenanceEnvelopeId or unrestricted scientific identity | PROHIBITED | source-defined scientificStatus and approved generation/version only |
| Export contents, stream bytes, filename content, or client download state | PROHIBITED | export endpointFamily and server boundary status |
| Arbitrary metadata objects or unbounded labels | PROHIBITED | fixed schema and allowlists |

This table applies equally to successful responses, validation failures,
authentication failures, rate-limit failures, cache failures, Engine failures,
stream failures, and unexpected exceptions.

## 17. Retention, access, and data-lifecycle interaction

### 17.1 Retention

Operational records are still operational data and require a retention
decision. This contract intentionally does not invent a duration:

RETENTION DURATION DEFERRED TO RETENTION/POLICY TRACK

Retention policy must define duration, deletion behavior, backup handling,
access roles, and production sink behavior. A requestId is not a reason to
retain a record indefinitely.

### 17.2 Privacy-access-audit separation

Operational request observability answers whether the service handled a
request. It does not answer which person viewed which Vault record, chart, or
account data. Privacy-access auditing must be a separate contract with its own
purpose limitation, actor model, retention, access controls, and review path.

Do not add actor identity to this operational record to make it serve as an
audit record.

### 17.3 Account export and deletion

Operational logs are not part of the account export payload by default and
are not a substitute for an account deletion ledger. Whether operational
records containing request IDs or bounded outcomes are exported, deleted,
redacted, or retained under a legal/security exception is an external policy
decision. The implementation must not imply an answer by adding account
identifiers to the log.

Cache entries, operational records, and privacy-access audit records have
different ownership and lifecycle rules. A future account deletion
implementation must not assume that this observability contract makes those
systems user-addressable.

## 18. Log-injection and sink-failure policy

### 18.1 Log injection

Only constants and values passed through explicit allowlists may enter event,
level, method, endpointFamily, status-class, problemCode, cacheStatus,
scientific status, or generation fields. JSON serialization must encode
control characters and delimiters. No request-controlled string may be used
as a field name, event name, level, endpoint family, or label.

Do not concatenate raw exception, URL, header, body, or provider text into a
record. Do not rely on a downstream sink to sanitize untrusted values.

### 18.2 Observability failure behavior

Observability is non-authoritative. A serialization or sink write failure
must not change the API response, expose a new error to the caller, or cause
chart calculation, Vault persistence, auth, export, or deletion to fail.

Serialization failure and sink failure have the same fail-open result:

- Serialization receives only the fixed, bounded record object. If
  JSON.stringify fails, the emission attempt is dropped.
- If the process stream or injected ObservabilitySink.write throws, the
  emission attempt is dropped.
- Neither failure changes the authoritative response, retries, buffers, or
  writes sensitive fallback text.
- Logger failure is never recursively logged.

The current writer catches its own serialization/write failure. B1 preserves
that behavior at the narrow sink call boundary while making the sink
injectable for focused tests.

## 19. Future implementation slices

This task stops at the contract. The next locally implementable P0 slice is:

WEB-OBS-001B1 READY

### WEB-OBS-001B1 — Complete bounded request observability

Implement only the request-boundary portion:

- emit exactly one canonical api.request.completed record per observable API
  request
- remove api.request.error emission and its duplicate event type
- preserve the current JSON-lines transport and field names
- verify all endpoint families and fallback behavior
- verify server-generated request IDs and response header behavior
- set problemCode through the existing canonical Problem Details context
  helper and request-local typed Hono context
- add the narrow synchronous ObservabilitySink.write(record): void boundary
  with the current process-stream writer as the default
- keep all privacy exclusions and allowlists centralized
- do not add cache or Engine metadata
- do not modify route bodies merely to carry ProblemCode; the central response
  helper is the handoff point

### WEB-OBS-001B2 — Add calculation/cache/Engine projections

Coordinate with the existing chart result cache contract to add only:

- cacheStatus after the typed cache outcome extension, with bypass still
  non-emittable
- engineResultGeneration
- chartResultContractVersion
- scientificStatus
- engineDurationMs
- do not add provenanceStatus, warningCount, or astronomyConfigurationId
  unless their deferred source/boundary decisions are separately approved

Keep the fields internal and bounded. Do not modify the public ChartResult
or API response contract.

### WEB-OBS-001C — Focused privacy and security review

Review emitted records, failure paths, export streaming, auth
anti-enumeration, rate limiting, origin rejection, log injection, sink
failure, retention interaction, and access-audit separation. This is a
focused review, not a broad application audit.

## 20. Focused future test plan

No tests are added or run by WEB-OBS-001A-R1. The following tests are the
implementation handoff plan.

### Request-boundary tests

- Every observable API request emits exactly one canonical
  api.request.completed record when the sink is healthy.
- An unexpected API error is converted by the central error boundary and
  produces one completion record with status 500, level error, and
  problemCode INTERNAL_ERROR.
- No api.request.error record is emitted after B1.
- Every emitted record has the required fields for its event kind.
- requestId is server-generated, stable within a request, and returned in
  X-Request-Id.
- Incoming request ID values cannot replace the canonical server ID.
- method, endpointFamily, event, and level are allowlisted.
- status is the actual response status and durationMs is a non-negative
  integer on completion.
- unknown API paths map to unknown-api without retaining the path.

### Privacy and injection tests

- Birth data, coordinates, timezone values, ChartRequest, ChartResult,
  interpretation, Vault metadata, note text, feedback body, email, tokens,
  cookies, identities, raw Origin, URL/query, IP, raw exceptions, and cache
  keys cannot appear in serialized records.
- Problem Details detail and stack/message text are not logged.
- Control characters and delimiter-like input cannot create a second log
  record or alter fixed field names.
- Unrecognized method, event, level, family, problem, cache, and generation
  values are rejected, normalized, or omitted according to the typed boundary.

### Outcome tests

- 4xx and 429 remain observable without becoming server-error level records.
- 500 and 503 completion records are error level.
- 400, 401, 403, 404, and 429 completion records are info level.
- Canonical ProblemCode values are attached only through the typed context
  handoff; arbitrary body text cannot become problemCode.
- Auth outcomes preserve anti-enumeration behavior.
- Rate-limit and origin-rejection records contain no limiter identity or raw
  headers.

### Cache and Engine tests

- Cache hit and normal miss map to their approved cacheStatus values.
- Cache operational error maps to error only after B2 adds typed cache outcome
  reporting; the current APIs must not fabricate that value.
- bypass is never emitted until an explicit runtime bypass exists.
- Cache keys, digests, input, and result bodies never appear.
- Engine generation and ChartResult contract version come from trusted
  boundaries, not request input.
- scientificStatus is projected from ChartResult.calculationStatus using only
  COMPLETE or INCOMPLETE_RESEARCH.
- Deferred provenanceStatus and warningCount are not emitted.
- Engine duration is distinct from API duration.
- Provider name, provider URL, provider request ID, and response payload are
  absent.

### Surface and lifecycle tests

- Sky records contain no event payload or astronomical data.
- Vault and feedback records contain no stored/user content.
- Account export records do not claim complete client download.
- Account deletion and export records do not add account identity.
- A logging/sink failure does not change the endpoint response or cause
  calculation, persistence, auth, export, or deletion to fail.

## 21. Unresolved technical decisions

R1 resolves the implementation-critical B1/B2 architecture:

- Canonical accounting uses one completion event.
- api.request.error is removed in B1.
- ProblemCode uses the existing ProblemCode type through request-local typed
  Hono context set by the canonical Problem Details response helper.
- B1 uses a narrow synchronous ObservabilitySink.write(record): void boundary.
- B2 carries calculation metadata through a request-local internal calculation
  outcome; it does not use global mutable state or low-level cache logging.
- B2 first extends cache outcome reporting before emitting cacheStatus=error.
- Generation and ChartResult contract version use the existing trusted cache
  identity binding.
- scientificStatus uses ChartResult.calculationStatus.
- provenanceStatus, warningCount, and astronomyConfigurationId remain
  deferred and do not block B1.
- engineDurationMs is measured only around an actual EngineClient call and is
  absent on cache hit.

The remaining decisions are external or explicitly deferred policy items:

1. Production sink deployment, access control, and backup behavior.
2. Retention duration and operational-log deletion behavior.
3. The separate privacy-access-audit schema and its relationship to account
   export/deletion.
4. Whether a future metrics path derives from logs or a separate internal
   stream. No vendor is selected here.
5. Whether astronomyConfigurationId can satisfy the bounded identity
   conditions. Until approved, omit it.

These remaining items do not block B1 implementation. They block production
deployment claims beyond the current source and the approved bounded schema.

## 22. Anti-patterns expressly rejected

- Logging the full request or full response for debugging.
- Logging raw birth data, exact birthplace, coordinates, timezone, or chart
  contents.
- Logging Vault labels, notes, IDs, account IDs, email, tokens, cookies, or
  feedback.
- Logging cache keys, input digests, canonical inputs, or cached results.
- Logging raw URLs, query strings, route parameters, Origin, Referer, IP, or
  trusted-edge identity.
- Logging exception messages, stacks, SQL text, provider payloads, or secrets.
- Constructing event names, labels, levels, or field names from input.
- Treating request completion as proof of client export receipt.
- Treating operational logs as privacy-access audit records.
- Adding a third-party APM/logging/analytics dependency to solve this P0
  contract.
- Adding provider-specific observability fields before the provider decision.
- Changing the public Problem Details or chart response contract as part of
  observability.
- Adding runtime code, dependencies, tests, migrations, or configuration in
  WEB-OBS-001A-R1.

## 23. Integrity and completion boundary

WEB-OBS-001A-R1 is complete only when the following remain true:

- Runtime source under server/src is unchanged.
- Frontend source under apps/web/src is unchanged.
- packages/*, tests, migrations, package manifests, and lockfiles are
  unchanged.
- Brand files and scientific/provider logic are unchanged.
- C:\NatalNode is untouched.
- Only this contract document is modified by R1.
- No HTTP Engine integration, MockEngineClient change, chart calculation,
  Vault/Auth/feedback implementation, or P1/P2/P3 functionality is added.

Validation for this documentation-only task is limited to:

- git diff --check
- git diff --stat
- git diff --name-status
- git status --short

No test suite, application check, build, or install is part of this task
because no runtime or dependency change is authorized.

Recommended next action:

WEB-OBS-001B1 — Complete Privacy-Minimized Request Observability
