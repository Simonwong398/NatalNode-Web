# NatalNode Website API/BFF Problem Details Contract V1

**Task:** `WEB-API-001A`

**Contract status:** `APPROVED TECHNICAL DIRECTION`

**Runtime status:** `RUNTIME MIGRATION DEFERRED`

**Audited baseline:** `549661c916159b9d842e92dfd89a287ed3372692` (`feat: add auth lifecycle maintenance command`)

This document freezes the migration target for the NatalNode Website API / BFF
HTTP error boundary. It does not claim that the current runtime already emits
RFC 9457 responses. The current runtime remains on its bounded legacy JSON
envelope until a later, coordinated implementation sequence is approved.

## 1. Purpose and scope

The P0 readiness checkpoint identifies a repository-wide API error-contract gap:
the BFF currently has bounded error behavior, but its JSON representation is a
feature-specific envelope rather than RFC 9457 Problem Details. This contract
freezes one migration-compatible representation before runtime changes begin.

The contract applies to failures at the Website API / BFF boundary when a
normal HTTP response can still be produced. It covers:

- request validation and media-type failures;
- authentication, recent-authentication, and authorization failures;
- API route not-found behavior;
- rate limiting;
- Chart, Sky, and Vault calculation-availability failures;
- Feedback, account deletion, and account export pre-stream failures; and
- unexpected server failures that reach the central HTTP error boundary.

It does not redesign successful responses, domain or Engine scientific
contracts, persistence semantics, the public Sky contract, or the browser
HTML 404 experience.

## 2. Architectural boundary and non-goals

The system boundary remains:

```text
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
    -> AstronomyProvider
```

The Problem Details decision governs only the Website API / BFF HTTP
representation. Website code must continue to consume Engine facts through the
public API boundary. It must not access an astronomy provider directly or
expose provider, deployment, or scientific-library details.

This contract does not authorize:

- an `HttpEngineClient` or production Engine integration;
- a provider selection or provider-specific dependency;
- astronomy, timezone, chart, Sky, or scientific calculation work;
- changes to `ChartResult`, resolver behavior, or Engine contracts;
- a new API version solely for this migration;
- a new public documentation host or dereferenceable error URL;
- a generic validation framework, error-reporting vendor, or logging vendor;
- a new cache, queue, worker, deployment scheduler, or persistence model; or
- access to or modification of `C:\NatalNode`.

`PROVIDER DECISION DEFERRED.`

## 3. Authoritative sources and audit boundary

The contract is based on the following sources, read or inspected at the
audited baseline:

- [`docs/PRD.md`](../PRD.md), the product source of truth;
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md), the implementation boundary;
- [`NATALNODE_P0_READINESS_CHECKPOINT_V1.md`](./NATALNODE_P0_READINESS_CHECKPOINT_V1.md);
- [`NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md`](./NATALNODE_ACCOUNT_DELETION_ERASURE_V1.md);
- [`NATALNODE_ACCOUNT_DATA_EXPORT_V1.md`](./NATALNODE_ACCOUNT_DATA_EXPORT_V1.md); and
- [`NATALNODE_AUTH_LIFECYCLE_CLEANUP_V1.md`](./NATALNODE_AUTH_LIFECYCLE_CLEANUP_V1.md).

The runtime inspection was limited to the current Hono app boundary, API
security and Origin middleware, rate limiter, request observability, current
validation/error helpers, authentication middleware, Chart/Sky/Auth/Vault/
Feedback/account routes, current API error types, and the first-party browser
error-envelope readers. The local static-file adapter and ordinary Astro page
rendering are not API error surfaces and are not part of this migration.

## 4. Current repository truth

The current API error representation is:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Bounded non-sensitive message."
  }
}
```

The current runtime does not emit `application/problem+json`, and no shared
RFC 9457 type or response mapper exists in `packages/contracts` or
`server/src`. Current route-level constants are bounded and do not serialize
raw exceptions. The Hono `app.onError` response is also sanitized, but the
envelope is still the legacy shape.

The current request middleware generates a server-side UUID for each `/api/*`
request and exposes it in the `X-Request-Id` response header. It records a
bounded completion record and a bounded unhandled-error record. The request ID
is not currently placed in the JSON error body.

The current `/api/*` security middleware applies, where applicable:

- `Cache-Control: no-store`;
- `Referrer-Policy: no-referrer`;
- `X-Content-Type-Options: nosniff`; and
- `X-Frame-Options: DENY`.

The migration must preserve these facts rather than create a competing
security, correlation, or observability boundary.

## 5. Current error inventory

The following inventory records current repository behavior. It is not a new
runtime contract yet; it is the compatibility baseline that the migration must
replace deliberately.

### 5.1 Common API boundaries

| Boundary | Current HTTP status | Current code and body behavior | Correlation / retry behavior | Raw-error exposure observed |
| --- | ---: | --- | --- | --- |
| Unmatched API route | 404 | `NOT_FOUND`; `API route not found.` | `/api/*` request ID header; no `Retry-After` | No |
| Unhandled Hono/API error | 500 | `INTERNAL_ERROR`; `An unexpected server error occurred.` | `/api/*` request ID header; bounded error log | No |
| Exact-Origin rejection for unsafe API request | 403 | `FORBIDDEN`; `Request origin is not allowed.` | `/api/*` request ID header; no `Retry-After` | No |
| Edge or account rate limit | 429 | `RATE_LIMITED`; `Too many requests. Please try again later.` | `/api/*` request ID header and `Retry-After` seconds | No raw key/HMAC identity |

The Origin middleware rejects missing, malformed, multiple, credentialed,
non-root, query-bearing, hash-bearing, or otherwise non-canonical origins
according to its existing exact-origin policy. Normalizing the response media
type must not loosen that decision.

### 5.2 Feature API boundaries

| Feature surface | Current failure statuses and codes | Current message behavior | Success/streaming constraint |
| --- | --- | --- | --- |
| `POST /api/chart` | 400 `INVALID_REQUEST`; 503 `CALCULATION_UNAVAILABLE` | Invalid chart request; chart calculation currently unavailable | Successful `{ chart }` response is unchanged |
| Public Sky snapshot/events | 400 `INVALID_REQUEST`; 503 `CALCULATION_UNAVAILABLE` | Snapshot/events-specific invalid-request copy; Sky calculation currently unavailable | Successful Sky payloads are unchanged |
| Auth Magic Link request | 400 `INVALID_REQUEST` | Invalid authentication request | 202 `{ accepted: true }` is unchanged |
| Auth Magic Link completion | 400 `INVALID_REQUEST`; 401 `UNAUTHORIZED`; unexpected 500 | Invalid authentication request; invalid/expired link copy; generic internal copy | 200 `{ authenticated: true }` and cookie behavior are unchanged |
| Auth session/logout | 401 from authentication middleware where applicable; unexpected 500 | Authentication required; otherwise generic internal copy | Session and logout success bodies are unchanged |
| Vault chart save/update/read | 400 `INVALID_REQUEST`; 401 `UNAUTHORIZED`; 404 `NOT_FOUND`; 503 `CALCULATION_UNAVAILABLE`; unexpected 500 | Vault-chart-specific invalid/not-found/calculation copy; generic internal copy | Existing Vault success envelopes are unchanged |
| Vault chart notes | 400 `INVALID_REQUEST`; 401 `UNAUTHORIZED`; 404 `NOT_FOUND`; unexpected 500 | Chart-note-specific invalid/not-found copy; generic internal copy | Existing note success envelopes are unchanged |
| Private Feedback | 400 `INVALID_REQUEST`; 401 `UNAUTHORIZED`; 413 `PAYLOAD_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE`; 429 `RATE_LIMITED`; unexpected 500 | Feedback-specific bounded copy; rate limit uses `Retry-After` | 201 `{ submitted: true }` is unchanged |
| Account deletion | 400 `INVALID_REQUEST`; 401 `UNAUTHORIZED`; 403 `RECENT_AUTHENTICATION_REQUIRED`; 429 `RATE_LIMITED`; 500 `INTERNAL_ERROR` | Account-deletion-specific invalid copy; generic auth; recent-auth copy; generic internal copy | 204 empty response and cookie expiry are unchanged |
| Account export before stream start | 400 `INVALID_REQUEST`; 401 `UNAUTHORIZED`; 403 `FORBIDDEN` or `RECENT_AUTHENTICATION_REQUIRED`; 429 `RATE_LIMITED`; 500 `INTERNAL_ERROR` | Export-specific bounded copy; no attachment header on pre-stream failure | Must remain compatible with hidden iframe/native POST |
| Account export after 200 stream starts | No replacement HTTP response is possible | No second JSON/error response | Producer closes/truncates incomplete JSON; it never appends Problem Details |

Current messages are static route-level copy, not a public promise that raw
`Error.message` is safe. The future `detail` field may use an explicit
allow-list of equivalent safe copy, but a migration mapper must not copy a
runtime exception message automatically.

### 5.3 Current stable codes

The repository currently exposes these application codes in route responses or
browser-consumed contracts:

```text
CALCULATION_UNAVAILABLE
FORBIDDEN
INTERNAL_ERROR
INVALID_REQUEST
NOT_FOUND
PAYLOAD_TOO_LARGE
RATE_LIMITED
RECENT_AUTHENTICATION_REQUIRED
UNAUTHORIZED
UNSUPPORTED_MEDIA_TYPE
```

The current contracts in `packages/contracts/src/api/` remain unchanged by
this documentation-only task. A later migration may add a shared Problem
Details type or update route contracts, but it must do so as part of the
approved runtime sequence rather than silently mixing dialects.

## 6. Canonical Problem Details shape

After migration, every non-streaming Website API/BFF error response that can
be produced normally uses the RFC 9457 media type and this minimal top-level
shape:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "code": "INVALID_REQUEST",
  "detail": "Invalid chart request."
}
```

The minimum shape without safe user-facing copy is:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "code": "INVALID_REQUEST"
}
```

Field policy is:

| Member | V1 requirement | Rule |
| --- | --- | --- |
| `type` | Required | Always `about:blank` in V1; see the type decision below |
| `title` | Required | Fixed HTTP reason phrase for the actual status; never raw exception text |
| `status` | Required | Integer equal to the actual HTTP status sent on the wire |
| `detail` | Optional | Bounded, allow-listed, non-sensitive user-facing copy; omit when not useful or not safe |
| `instance` | Omitted in V1 | No public occurrence URI or internal identifier is needed for the current product |
| `code` | Required extension | Stable, bounded, upper-snake-case application code used with status for client control flow |

The legacy `error` wrapper and `message` member are not part of the canonical
V1 shape. A later migration must not add `errors`, `fields`, `requestId`,
`meta`, raw framework details, or other extensions merely because RFC 9457
allows extension members.

The Problem Details object is used only for an error response. Successful JSON
responses retain their existing response body and content type.

## 7. `type` strategy

V1 freezes:

```text
type = "about:blank"
```

No stable public error-documentation endpoint exists at this baseline. A
NatalNode URL would therefore be deceptive if it were presented as a
dereferenceable RFC type URI before that URL was actually deployed. The
standard `about:blank` value is the smallest truthful strategy. Its title is
the standard reason phrase for the HTTP status.

A future public documentation task may introduce stable type URIs per problem
family. That requires a separately reviewed contract decision and must not be
back-filled as a fake URL during runtime migration. Moving from `about:blank`
to typed URIs is not necessary for the first implementation slice.

## 8. `title` policy

`title` is fixed by HTTP status in V1, not by arbitrary route copy or raw error
text. The fixed title table is:

| HTTP status | Title |
| ---: | --- |
| 400 | `Bad Request` |
| 401 | `Unauthorized` |
| 403 | `Forbidden` |
| 404 | `Not Found` |
| 413 | `Payload Too Large` |
| 415 | `Unsupported Media Type` |
| 429 | `Too Many Requests` |
| 500 | `Internal Server Error` |
| 503 | `Service Unavailable` |

Titles are short, stable, human-readable, and non-sensitive. They must not
contain email addresses, user or chart identifiers, request payloads, SQL,
provider errors, stack traces, or server topology. Browser control flow must
not branch on `title`.

## 9. `status` policy

`status` is required and must equal the actual HTTP response status. The HTTP
status line and Problem Details member may not contradict each other. The
server must not return a 200 response containing a failure Problem Details
object.

The current mapping freezes only statuses that are used or explicitly needed
by the current BFF boundary:

| HTTP status | Current V1 code(s) | Meaning |
| ---: | --- | --- |
| 400 | `INVALID_REQUEST` | Malformed JSON, invalid request shape, or failed bounded request validation |
| 401 | `UNAUTHORIZED` | Missing, invalid, expired, consumed, or no-longer-account-backed authentication |
| 403 | `FORBIDDEN` | Exact-Origin protection rejected an unsafe API request |
| 403 | `RECENT_AUTHENTICATION_REQUIRED` | Authenticated session is outside the approved recent-auth window for a sensitive action |
| 404 | `NOT_FOUND` | API route or authorized resource is not found |
| 413 | `PAYLOAD_TOO_LARGE` | Feedback request exceeds the current bounded body limit |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Feedback request does not use the required media type |
| 429 | `RATE_LIMITED` | Existing edge/account/resource rate limit was reached |
| 500 | `INTERNAL_ERROR` | Unexpected or unsafe internal failure at a normal HTTP boundary |
| 503 | `CALCULATION_UNAVAILABLE` | Current Chart/Sky/Vault calculation dependency is unavailable or failed at the BFF boundary |

`409 Conflict` is not currently used by the API. There is no approved
deletion-in-progress, asynchronous conflict, or equivalent conflict state, so
409 is not part of this V1 mapping. `502 Bad Gateway` is also not currently
used. If a future domain or upstream distinction requires 409, 502, 504, or a
new 503 code, it needs an explicit contract decision rather than an ad hoc
route response.

## 10. `detail` policy

`detail` is optional. When present, it is product-facing copy, not diagnostic
output. It must be:

- from an explicit finite allow-list or a bounded constant;
- at most 256 characters;
- non-sensitive and understandable without internal context; and
- independent of the rejected payload and raw exception text.

The mapper should omit `detail` when the generic title and code are sufficient,
when copy would distinguish an account or authentication state that must remain
opaque, or when no reviewed safe message exists. Current static messages such
as `Invalid chart request.` and `Too many requests. Please try again later.`
are candidates for explicit migration allow-lists; their existence does not
authorize copying arbitrary `message` values.

### Central enforcement decision

The B1 helper must freeze the safer option: production callers provide either
no detail or a finite, centrally registered detail key/literal. The helper must
not expose an unconstrained `detail: string` input that route code could fill
from an exception or request value. Each registered key maps to one reviewed
static string, and the central helper enforces the 256-character maximum as a
defense-in-depth invariant. An arbitrary string under 256 characters is not
automatically approved. Any direct literal escape hatch used only by focused
tests must remain non-production and must still be bounded and sanitized.

The following are always prohibited in `detail`:

- raw `Error.message`, stack, cause, or framework diagnostics;
- SQL, database topology, query parameters, row counts, or filesystem paths;
- provider names, Engine URLs, provider credentials, or scientific-library
  details;
- email or normalized email;
- birth date, birth time, birth place, timezone input, chart request, or
  `ChartResult` data;
- chart names, notes, Feedback content, user IDs, identity IDs, chart IDs,
  note IDs, session IDs, challenge IDs, or database IDs; and
- token, hash, cookie, connection-string, or environment-variable material.

There is no V1 field-level validation payload. A detail must not be used as a
schema dump or a way to echo a rejected field.

## 11. `instance` policy

V1 omits `instance`.

The current request ID header already provides a useful bounded correlation
handle, while a public occurrence URI would not be dereferenceable at this
baseline. Turning `X-Request-Id` into a body URI would add another public
format without improving the current support workflow. No `instance` value
may contain a database row ID, user ID, session ID, challenge ID, chart ID, or
an invented public URL.

If a future support or public-documentation requirement makes `instance`
useful, it must be reviewed independently. It must not be introduced as an
implicit side effect of the first mapper implementation.

## 12. Machine-readable `code` policy

`code` is a required NatalNode extension member on every canonical API
Problem Details response. It preserves the existing stable application-code
capability without asking clients to parse prose.

Codes must be:

- `UPPER_SNAKE_CASE`;
- stable across copy revisions;
- finite and non-sensitive;
- semantically meaningful at the Website API boundary; and
- used together with the HTTP status.

First-party clients must branch on HTTP status plus `code`. They must not
branch on `title`, `detail`, field order, or the legacy `message` member.

The migration removes the legacy `{ error: ... }` wrapper from the canonical
response. A legacy-to-canonical mapping is conceptually:

```text
error.code    -> code
error.message -> optional allow-listed detail
```

The mapping is not permission to support two permanent public envelopes.

## 13. Error-code governance and current mapping

The following codes are frozen for the current Website API/BFF surfaces:

| Code | Status | Fixed title | Current use |
| --- | ---: | --- | --- |
| `INVALID_REQUEST` | 400 | `Bad Request` | Bounded JSON/body/shape validation across Chart, Sky, Auth, Vault, Feedback, account deletion, and account export |
| `UNAUTHORIZED` | 401 | `Unauthorized` | Missing/invalid/expired auth, invalid Magic Link completion, and account-not-found-as-auth-failure behavior |
| `FORBIDDEN` | 403 | `Forbidden` | Exact-Origin rejection for unsafe API requests; also available for the export pre-stream boundary when middleware rejects the request |
| `RECENT_AUTHENTICATION_REQUIRED` | 403 | `Forbidden` | Server-derived recent-authentication gate for account deletion and account export |
| `NOT_FOUND` | 404 | `Not Found` | API route not found and authorized Vault resource not found |
| `PAYLOAD_TOO_LARGE` | 413 | `Payload Too Large` | Feedback body exceeds the current 32 KiB request bound |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | `Unsupported Media Type` | Feedback request is not `application/json` |
| `RATE_LIMITED` | 429 | `Too Many Requests` | Existing edge, account, or resource rate limit |
| `INTERNAL_ERROR` | 500 | `Internal Server Error` | Unknown or unsafe internal failure at a normal HTTP boundary |
| `CALCULATION_UNAVAILABLE` | 503 | `Service Unavailable` | Current BFF handling of Chart/Sky/Vault calculation dependency failure |

The PRD also names Engine/domain-oriented codes such as
`INVALID_BIRTH_DATE`, `INVALID_LOCAL_TIME`, `AMBIGUOUS_LOCAL_TIME`,
`NONEXISTENT_LOCAL_TIME`, `LOCATION_NOT_FOUND`, `TIMEZONE_RESOLUTION_FAILED`,
`UNSUPPORTED_TIME_DOMAIN`, `CALCULATION_FAILED`, `CALCULATION_TIMEOUT`,
`ENGINE_CONFIGURATION_INCOMPLETE`, and `ENGINE_UNAVAILABLE`. They are not
currently emitted by the audited Website API runtime. This task does not add
them, infer them from validation behavior, or move them into the BFF contract.
If a future Engine/API boundary exposes one, it requires an explicit mapping
decision that remains provider-neutral.

The PRD's semantic phrase `RATE_LIMIT_EXCEEDED` does not override the current
public/browser-consumed repository code `RATE_LIMITED`. Renaming that code is
not part of this freeze and must not happen casually.

## 14. Authentication and anti-enumeration rules

Problem Details migration must preserve the current Auth and privacy semantics.

### 14.1 Unauthorized behavior

The following situations continue to map to `401 UNAUTHORIZED`:

- missing, malformed, expired, or no-longer-account-backed session;
- invalid, expired, unknown, or already-consumed Magic Link completion; and
- account deletion or export where the authenticated account root is absent.

These cases must use the same bounded response class regardless of whether an
email, account, or previous challenge exists. The response must not confirm or
deny account existence.

### 14.2 Recent authentication

`403 RECENT_AUTHENTICATION_REQUIRED` remains distinct from unauthenticated
access. It tells an already authenticated browser to complete the existing
passwordless re-authentication flow, without returning account data or
revealing persistence details. The server-derived session timestamp remains
authoritative; browser time and a client countdown are not.

### 14.3 Origin rejection

`403 FORBIDDEN` from exact-Origin protection remains a security decision and
must not be reused to reveal Auth or account state. Response normalization may
change only the representation, not the checks, middleware order, or rejection
conditions.

No Problem Details member may contain an email, normalized email, session
identifier, challenge identifier, token, hash, or account identifier.

## 15. Validation-error policy

V1 uses one bounded application code for invalid request data:

```text
400 INVALID_REQUEST
```

The first migration does not create a generic validation-error framework or a
field-error extension. The current validators and route-specific invalid
request boundaries already provide the needed P0 behavior. A safe static
`detail` may identify the broad request operation, such as `Invalid chart
request.`, but must not echo the payload, rejected value, schema internals,
Zod output, parser stack, or database error.

The existing `413 PAYLOAD_TOO_LARGE` and `415 UNSUPPORTED_MEDIA_TYPE` cases
remain distinct because they are transport/request-boundary conditions that
current Feedback behavior already exposes.

## 16. Rate-limit policy

The canonical representation of a current rate-limit rejection is:

```text
429 RATE_LIMITED
```

Where the existing rate limiter provides it, the response continues to include
the `Retry-After` HTTP header in seconds. The exact retry timing is not
duplicated inside JSON; the current UI has no requirement for a second timing
source.

The response must not expose raw client identity, HMAC material, rate-limit
keys, internal policy identifiers, bucket counters, or topology. The existing
process-local fixed-window policy and its security boundary are outside this
contract and remain unchanged.

## 17. Internal-error policy

The canonical generic internal response is:

```text
500 INTERNAL_ERROR
```

with a fixed `Internal Server Error` title and optional generic safe detail,
if any. Unknown thrown values, framework errors, persistence failures, and
unexpected provider/Engine failures must never become public `detail`.

The future central mapper must convert known bounded application outcomes to
their approved status/code pair and all unknown failures to
`500 INTERNAL_ERROR`. It must not expose:

- exception messages, stacks, causes, or serialized `Error` objects;
- SQL, query parameters, database connection details, or filesystem paths;
- environment variables, credentials, cookies, tokens, or hashes;
- provider names, Engine URLs, deployment topology, or scientific internals;
- internal IDs, row counts, or partial persistence state; or
- request payloads or response bodies.

Detailed diagnostics remain in the bounded server observability boundary only.

## 18. Chart, Sky, and upstream/BFF policy

The audited Chart and Sky routes currently collapse an `EngineClient` failure
to `503 CALCULATION_UNAVAILABLE`; Vault chart save has the same public
availability class. The current BFF does not distinguish upstream timeout,
unavailability, invalid upstream response, provider failure, or scientific
calculation failure as separate browser-facing codes.

V1 preserves that provider-neutral behavior:

- `CALCULATION_UNAVAILABLE` remains the only current calculation-availability
  code;
- the response does not identify a provider, Engine URL, deployment, or
  astronomy library;
- no request-derived chart facts are added to the error; and
- the response does not claim a specific scientific cause that the BFF did not
  establish.

Future distinctions such as timeout versus invalid upstream response require a
separate approved API decision. They must not be inferred from exception class
or provider behavior inside a route migration.

## 19. API 404 policy

API/BFF route and authorized-resource 404 responses migrate to Problem Details:

```text
404 NOT_FOUND
```

The stable code remains the client control-flow signal. A safe optional detail
may distinguish `API route not found.` from `Vault chart not found.` only if
that distinction is useful and does not reveal an unauthorized resource. For
ownership failures, the existing route behavior and account-isolation policy
remain authoritative.

Ordinary public Astro page 404 handling is explicitly outside this contract.
This document does not turn an HTML page fallback into a JSON error response.

The safest later routing boundary is an API-only not-found handler or an
explicit `/api` sub-application. If a Hono app is ever shared with a public
page adapter, the not-found normalization must be guarded by the API pathname
before producing `application/problem+json`; it must not globally replace page
404 handling with JSON.

## 20. Origin, CSRF-relevant, and security middleware behavior

The current exact-Origin middleware runs for unsafe API methods and rejects
non-canonical origins before route execution. It must continue to do so. A
future response helper may format an accepted rejection as
`application/problem+json`, but it must not:

- accept a missing, malformed, multiple, credentialed, non-root, query-bearing,
  hash-bearing, or otherwise invalid origin;
- move the check after authentication or route execution;
- replace exact-origin enforcement with a wildcard or referer heuristic; or
- introduce a browser-controlled account target.

This is the current CSRF-relevant origin boundary. No separate CSRF token
protocol is introduced by this contract.

Problem Details responses continue through the existing `/api/*` security
headers. No competing header framework is permitted.

If Problem Details serialization itself fails while handling an Origin
rejection, the request must remain rejected. Serialization failure must never
turn an Origin failure into route execution or a successful response.

## 21. Streaming-response exception

`POST /api/account/export` has a deliberate exception to normal Problem
Details handling.

Before the successful attachment response begins, validation, Origin,
authentication, recent-authentication, rate-limit, capacity, configuration,
snapshot, and initial database failures may return a normal Problem Details
response. They must not include the successful export's `Content-Disposition`
attachment header.

After the `200` streaming headers have started:

- the HTTP status cannot be replaced;
- a Problem Details object must not be appended;
- a JSON error object must not be appended;
- a second response must not be attempted; and
- the producer must close/truncate the body without the final JSON delimiters
  so an incomplete export cannot look like a valid complete export.

The stream producer remains responsible for catching failures before they
reach framework-default raw logging and for performing idempotent cleanup. The
request-completion record for this endpoint means “response initiated with the
recorded status,” not “the browser received a complete export.”

## 22. Account-export client compatibility

The current export UX uses a hidden same-origin iframe and native POST so a
download can begin without requiring fetch/blob conversion. The migration must
preserve that UX.

The route and `apps/web/src/features/account/account-export.ts` must be
migrated as one focused boundary. The future parser must read the canonical
Problem Details object and branch on its top-level `code` for:

- `UNAUTHORIZED`;
- `RECENT_AUTHENTICATION_REQUIRED`;
- `INVALID_REQUEST`;
- `RATE_LIMITED`; and
- `INTERNAL_ERROR`.

It may use the response status as a first filter, but it must not require
`title`, `detail`, or the legacy `error` wrapper. It must be able to inspect a
JSON Problem Details body returned through the iframe/native POST mechanism.

The current source reader uses
`frame.contentDocument?.body?.textContent?.trim()` followed by `JSON.parse`.
That is mechanically compatible with a textual JSON response and does not
depend on the legacy `error` member after the parser is updated. Source review
alone cannot prove how every supported browser navigates a hidden iframe for
`application/problem+json`, however. The existing `/api/*` security headers
also include `X-Frame-Options: DENY`, so source review cannot prove that a
pre-stream error body remains visible to the same-origin frame under actual
browser enforcement. `WEB-API-001B3` must therefore include a focused
same-origin browser verification covering the real security headers: a
pre-stream Problem Details response without `Content-Disposition` must remain
readable through the frame body, its top-level `code` must be parseable, and a
successful export must still download. If a browser treats the response as a
download or otherwise makes the body opaque, resolve that bounded
route/client boundary without weakening anti-framing security and without
converting the export UX to fetch/blob.

The export migration does not introduce a fetch/blob conversion, reusable
export URL, client-side export cache, or second public envelope. If a
deployment topology requires a temporary old-server/new-client overlap, any
legacy reader tolerance must be an explicitly bounded cutover detail with a
removal point; it is not the V1 contract.

Mid-stream truncation remains a transport outcome, not a parseable Problem
Details response.

## 23. Account-deletion client compatibility

The current deletion UX preserves 204 success, redirects on 401, and parses
`RECENT_AUTHENTICATION_REQUIRED` from the legacy error body for the 403
recent-authentication branch. The migration must retain those user-visible
semantics.

`apps/web/src/features/account/account-deletion.ts` must be updated in the
same implementation slice as the account route so its 403 parser reads the
canonical top-level `code`. It must not branch on title/detail. The 204 empty
success response, cookie expiry, exact-Origin behavior, and anti-enumeration
401 behavior remain unchanged.

## 24. Other first-party client migration inventory

The following browser boundaries currently parse or depend on the legacy
envelope and therefore require focused, coordinated updates. No such update is
part of this documentation task.

| Browser file | Current dependency | Required migration boundary |
| --- | --- | --- |
| `apps/web/src/features/account/account-deletion.ts` | Parses `payload.error.code` for recent-auth 403 | Read top-level Problem Details `code`; keep status and 204 semantics |
| `apps/web/src/features/account/account-export.ts` | Hidden iframe parser reads `payload.error.code` | Read `application/problem+json` top-level `code`; preserve native POST UX |
| `apps/web/src/features/vault/save-vault-chart.ts` | Parses 400 `payload.error.code` and `payload.error.message` | Branch on status + top-level `code`; use local UI copy rather than API detail |
| `apps/web/src/features/vault/vault-management-client.ts` | Mostly status-based 400/401/404 handling | Verify status + code compatibility; success parsing stays unchanged |
| `apps/web/src/features/vault/vault-charts.ts` | Status-based 401/404/non-200 handling | Verify status + code compatibility; success parsing stays unchanged |
| `apps/web/src/features/vault/SavedVaultChartExperience.tsx` | Status-based error handling | Verify status + code compatibility; success parsing stays unchanged |
| `apps/web/src/features/auth/request-email-magic-link.ts` | Status-based invalid/generic handling | Preserve 400 and 202 behavior; do not parse prose |
| `apps/web/src/features/auth/complete-email-magic-link.ts` | Status-based invalid/generic handling | Preserve 200 success and generic failure behavior |
| `apps/web/src/features/auth/auth-session-control.ts` | Status-based generic handling | Preserve session/logout success bodies and no-store policy |
| `apps/web/src/features/feedback/private-feedback.ts` | Status-based 401/400/429 handling | Preserve field UI and rate-limit behavior; avoid prose branching |

The client inventory is intentionally limited to current error-envelope readers
and status-sensitive API consumers. It is not authorization to redesign these
features or their success payloads.

## 25. Content-Type policy

Canonical Problem Details responses use:

```http
Content-Type: application/problem+json; charset=utf-8
```

This applies whenever a normal API error response can be produced, including
known route errors, middleware rejections, not-found responses, and central
internal errors. The implementation may use the installed framework's exact
charset serialization convention only if it remains semantically equivalent
to this frozen media type.

Successful JSON responses remain `application/json` and keep their existing
body shapes. A success response must not be relabeled as Problem Details.

An account export that has begun streaming retains its attachment content type;
it is not converted to Problem Details after headers begin.

## 26. Cache policy

All `/api/*` Problem Details responses use:

```http
Cache-Control: no-store
```

This is the single safe P0 rule for both public-looking and personalized API
errors. It prevents Auth, account, Vault, Feedback, and calculation failure
responses from being stored by browser, shared, CDN, reverse-proxy,
service-worker, or application caches.

The rule preserves the current API security-header middleware and the explicit
no-store behavior of Auth/account boundaries. Successful response caching is
not redesigned here.

## 27. Security-header policy

Problem Details responses continue through the existing API security-header
middleware and retain, where the current `/api/*` boundary applies:

```http
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

`Cache-Control: no-store` is part of the cache policy above. The migration must
reuse the existing header helper and must not create a second set of security
header constants or a route-specific bypass.

## 28. Request ID and correlation decision

V1 chooses the minimum useful strategy:

```text
X-Request-Id response header only
```

The existing server-generated request ID remains the public correlation
identifier. It is not echoed from an untrusted request header, and it is not
duplicated as a `requestId` extension or encoded as `instance` in the Problem
Details body.

The identifier is a bounded opaque UUID for support correlation. It must not be
used to expose trace topology, internal service names, database IDs, session
IDs, challenge IDs, or account IDs.

If a response is produced outside the existing observed `/api/*` boundary, a
future implementation must first establish that boundary deliberately. This
document does not invent a second request-ID system for static pages or
framework internals.

## 29. Observability policy

Problem Details migration must not reduce the current privacy-minimized
diagnostic quality. Existing bounded request records may retain:

- request ID;
- method;
- endpoint family;
- HTTP status; and
- duration.

The current unhandled-error record remains bounded to request ID, method,
endpoint family, and status. It does not serialize raw errors, messages,
stacks, causes, request bodies, response bodies, or Problem Details objects.

A later implementation may add a finite, bounded `errorCode` field to an
approved server log record if the observability contract is updated in the
same slice. That field is not required for this documentation freeze, and it
must never cause `detail` or raw exception data to be logged.

The following remain prohibited in logs, traces, metrics labels, analytics,
error reports, and rate-limit keys:

- complete or component birth data, precise location, timezone input, chart
  request, or `ChartResult`;
- normalized email, account identity, user, chart, note, session, or challenge
  identifiers;
- Vault notes, Feedback category/message, export content, or response bodies;
- SQL, query parameters, database results, row counts tied to a request, or
  database topology;
- cookies, session tokens, Magic Link tokens, token hashes, credentials, or
  environment variables; and
- provider errors, Engine URLs, filesystem paths, stack traces, or deployment
  topology.

## 30. Raw-error boundary

The following invariant is frozen for the future runtime mapper:

```text
raw thrown Error/value
    -> central bounded normalization boundary
    -> known approved status/code, or 500 INTERNAL_ERROR
    -> sanitized Problem Details response
```

Raw thrown values must never automatically become public `detail`. Known
application outcomes may carry a code and an explicitly reviewed safe message;
unknown failures always use the generic internal class.

The normal mapper must be the only place where arbitrary route/persistence
failures are converted to public error representation. Stream-producer errors
remain governed by the account-export stream lifecycle because they occur after
the normal response boundary.

## 31. Domain/application versus HTTP ownership

Ownership is deliberately split:

- domain and application layers expose bounded semantic outcomes or errors;
- repositories expose persistence results/errors and never construct Hono
  responses or Problem Details objects;
- route and middleware boundaries select the approved status/code mapping; and
- one HTTP response helper/mapper serializes the canonical Problem Details
  shape and headers.

Hono-specific `Response` types must not be injected into deep persistence,
Auth, Vault, Feedback, or scientific/Engine code. A route must not invent a
new envelope because a repository operation failed.

## 32. Privacy redaction policy

Problem Details must not increase data exposure. Public error responses are
explicitly prohibited from including:

- email or normalized email;
- birth date, birth time, birth place, timezone, or any birth-data component;
- chart request, `ChartResult`, scientific facts, or calculation payloads;
- Vault chart metadata, note content, or Feedback content;
- user, account, identity, chart, note, session, or challenge IDs;
- session cookies, token values, challenge values, or hashes;
- database IDs, SQL, query values, row counts, or persistence topology;
- provider credentials, provider names when not already approved public copy,
  Engine URLs, deployment URLs, filesystem paths, or environment variables; and
- stack traces, exception objects, framework internals, or raw request data.

This policy applies equally to `title`, `detail`, optional future extensions,
and any fallback serialization path.

## 33. Legal and copy boundary

Problem Details titles and details are bounded product error copy. They do not
create, change, or communicate legal policy. This contract does not modify the
Privacy Policy, Terms, consent language, retention policy, data-rights scope,
or deletion/export semantics. Generic API errors must not claim legal rights,
retention guarantees, or provider/compliance approvals.

## 34. Migration strategy

The migration must be decomposed into bounded slices. Do not convert every
route in one giant patch and do not add a third dialect to one endpoint.

### `WEB-API-001B1` — shared contract and mapper

Introduce the canonical Problem Details type, stable code mapping, response
helper, header behavior, and focused tests. Do not silently migrate every
feature route in this slice. The helper must support the current code table,
the no-store/security headers, and the raw-error invariant.

B1 is infrastructure-only. It must not wire a new Problem Details handler into
`createApp`, `app.onError`, or `app.notFound`, and it must not replace any
production route's current `context.json` response. Its expected production
route behavior change is **none**. B1 may test the mapper/helper directly with
focused unit tests (and test-only values), but it must not add a production
fixture route, change a Web client, introduce a migration, or add a dependency.

B1 must also enforce the central detail-key/static-literal rule and the
256-character bound. The first global/general error-boundary wiring belongs to
B2, where it can be reviewed together with the API-only 404 boundary.

### `WEB-API-001B2` — general boundary and Chart/BFF

Migrate the general API not-found/internal boundaries and Chart/Sky calculation
error paths, keeping success responses unchanged. Verify Engine/BFF errors
remain provider-neutral.

### `WEB-API-001B3` — Auth/account privacy boundaries and clients

Migrate Auth, account deletion, and account export pre-stream failures together
with their first-party browser readers. Preserve anti-enumeration, recent-auth,
native POST/iframe export, 204 deletion, and stream truncation behavior.

### `WEB-API-001B4` — Vault/Feedback and remaining API boundaries

Migrate Vault, Feedback, remaining middleware/route responses, and any
remaining first-party client readers. Preserve 413/415/rate-limit semantics
and all success payloads.

### `WEB-API-001C` — focused cross-route review

Review the complete migrated boundary for media types, status/code alignment,
client compatibility, privacy redaction, security headers, request IDs,
observability, and stream behavior. This is a focused contract review, not a
repository-wide cleanup program.

## 35. Backward-compatibility rule

P0 does not require the legacy `{ error: { code, message } }` envelope to be
preserved forever. It does require that first-party browser behavior not break
during migration.

The preferred strategy is an atomic route-plus-client update per slice:

1. change the route/middleware response to canonical Problem Details;
2. update every first-party reader that depends on that route in the same
   implementation boundary;
3. branch on status plus top-level `code`; and
4. keep success bodies, status semantics, cookies, downloads, and UI behavior
   unchanged.

Long-lived dual envelopes are prohibited. A temporary compatibility reader is
  permissible only for an explicitly bounded deployment overlap and must have
  a removal point; it is not a reason to keep server output in both shapes.

No API version is introduced solely to migrate the error envelope.

## 36. Type-URI and public documentation boundary

Public dereferenceable documentation for a Problem Details type is a later Web
documentation task. It must not be implied by a URL that is not deployed and
must not block runtime migration when `about:blank` remains sufficient.

If typed URLs are eventually approved, they must be stable, non-sensitive,
provider-neutral, and documented as real public resources. The first runtime
implementation must not create fake URLs, fake support pages, or SEO content
for errors.

## 37. Focused future test plan

The future implementation should add focused tests at the affected boundaries,
not a broad test framework. At minimum, verify:

### B1-only infrastructure checks

- the mapper/helper can be tested directly without constructing the production
  app or changing any route response;
- only an omitted detail or centrally registered static detail key/literal is
  accepted by the production helper;
- the 256-character detail bound is enforced centrally;
- an arbitrary exception/request string cannot enter `detail`; and
- B1 does not wire `app.onError`, `app.notFound`, Auth, Account, Chart, Sky,
  Vault, Feedback, or any Web client.

### Shape and headers

- every normal API error has `Content-Type: application/problem+json` with the
  agreed charset;
- `type`, `title`, `status`, and `code` are present;
- the body status equals the actual HTTP status;
- safe `detail` is optional and bounded;
- `instance`, `message`, the `error` wrapper, and unapproved extensions are not
  emitted;
- `Cache-Control: no-store` and existing security headers remain present; and
- `X-Request-Id` remains in the response header and is not duplicated in the
  body.

### Mapping and redaction

- each current status/code pair maps to the frozen table;
- unknown thrown values become `500 INTERNAL_ERROR`;
- raw exception message, stack, cause, SQL, IDs, payloads, and provider data
  never reach the response;
- Chart/Sky/Vault dependency failure remains `503
  CALCULATION_UNAVAILABLE`; and
- current 413, 415, and 429 behavior remains distinct.

### Auth and privacy

- invalid/expired/consumed Magic Links remain indistinguishable
  `401 UNAUTHORIZED` outcomes;
- missing account during deletion/export remains authentication failure rather
  than account-disclosing 404;
- recent-authentication remains `403
  RECENT_AUTHENTICATION_REQUIRED`; and
- exact-Origin rejection remains a strict 403 security decision.

### Client and stream compatibility

- account deletion still handles 204, 401, and recent-auth 403 correctly;
- account export's hidden iframe/native POST can read pre-stream Problem
  Details codes without fetch/blob conversion;
- export pre-stream failures carry no attachment header; and
- post-stream failures truncate/close without appending JSON or Problem
  Details.

## 38. Unresolved decisions

The following are intentionally recorded rather than guessed:

1. **Public typed `type` URIs:** no deployed documentation endpoint exists;
   V1 therefore uses `about:blank`. A later documentation decision may change
   this.
2. **Safe `detail` entries:** the production helper interface is frozen to
   centrally registered static detail keys/literals plus omission; the exact
   reviewed copy entries remain implementation work, and the 256-character
   bound must be enforced centrally rather than copying legacy messages
   generically.
3. **Future Engine distinctions:** the current BFF does not distinguish
   timeout, unavailable, invalid response, provider, and scientific errors.
   Any new public code/status requires a separate approved decision.
4. **409/502/504:** no current route uses these statuses. They remain
   unassigned until a real product/API condition requires them.
5. **Bounded error-code logging:** current observability is status-based. Adding
   a finite `errorCode` field is optional future observability work and must not
   widen privacy exposure.
6. **Deployment overlap:** a temporary legacy reader is only a release
   mechanics decision if an actual overlap requires it; it is not a permanent
   public contract.

These decisions do not block the next bounded type/mapper implementation when
the implementation follows this document. They must not be silently resolved
by a route-specific response.

## 39. Prohibited anti-patterns

The following are explicitly prohibited during migration:

- adding RFC 9457 to only one feature while leaving a third error dialect;
- returning `application/json` for a Problem Details error;
- changing successful response bodies or media types as part of error work;
- inventing public type URLs, support URLs, or SEO pages;
- making clients branch on `title`, `detail`, `message`, or localized copy;
- dumping schema internals, rejected payloads, field values, or raw exceptions;
- leaking Auth/account existence through 401/403/404 detail differences;
- putting request IDs, database IDs, user IDs, or session IDs into arbitrary
  Problem Details extensions;
- exposing provider, Engine, astronomy, deployment, SQL, credentials, or
  filesystem information;
- returning a second response or appending JSON after export streaming starts;
- converting the export UX to fetch/blob or introducing reusable export URLs;
- repositories or domain code constructing Hono responses;
- introducing a large cloning, validation, logging, networking, or dependency
  framework for this contract; or
- using this contract as justification for unrelated cleanup, P1/P2/P3 work,
  provider selection, deployment, or changes to `C:\NatalNode`.

## 40. Runtime, dependency, and migration boundary for `WEB-API-001A`

This task is documentation-only. It intentionally does not modify:

- `server/src/**`;
- `apps/web/src/**`;
- `packages/**`;
- database migrations or schema;
- tests or test configuration;
- `package.json`, workspace metadata, or lockfiles; or
- provider, Engine, deployment, or environment configuration.

The only intended repository change is this document:

```text
docs/product/NATALNODE_API_PROBLEM_DETAILS_V1.md
```

No test suite, typecheck, build, install, or runtime migration is part of this
task. The permitted validation is documentation-scope Git validation only.

## 41. Readiness and next boundary

The contract is ready for a focused implementation review because it defines:

- the current error surface and stable code inventory;
- a minimal RFC 9457 shape with a truthful `type` strategy;
- status, title, detail, instance, and code rules;
- Auth anti-enumeration and privacy behavior;
- validation, rate-limit, internal, BFF, 404, Origin, and security behavior;
- the account-export streaming exception;
- first-party browser migration boundaries;
- B1's no-global-handler/no-route-migration boundary;
- the focused browser verification required for native iframe export errors;
- cache, security-header, request-ID, and observability rules;
- domain-to-HTTP ownership;
- bounded migration slices and future focused tests; and
- explicit unresolved decisions and prohibited expansions.

The readiness decision is:

```text
WEB-API-001B1 READY
```

This means ready for a human/technical contract review before implementation,
not permission to begin that implementation in this task.

## 42. Approval boundary

Approval of this document freezes the technical direction only:

```text
APPROVED TECHNICAL DIRECTION
RUNTIME MIGRATION DEFERRED
```

The next action is:

```text
REVIEW WEB-API-001A CONTRACT BEFORE IMPLEMENTATION.
```

Do not begin `WEB-API-001B1` from this task without the required review and a
new implementation request.
