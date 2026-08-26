# ADR: Private Feedback MVP Architecture

- Status: ACCEPTED — architecture frozen; implementation not started
- Task: `WEB-FEEDBACK-001A`
- Date: 2026-08-26
- Mode: Architecture / contract / documentation only
- Next task: `WEB-FEEDBACK-001B — Implement Private Feedback MVP Vertical Slice`

## Context and source-of-truth boundaries

The product source of truth remains `docs/PRD.md`. The accepted product
sequence remains in `docs/product/NATALNODE_PRODUCT_ROADMAP_V1.md`, and the
frozen visual constraints remain in
`docs/design/NATALNODE_VISUAL_SYSTEM_V1.md`.

Private Feedback is a NatalNode.com Web Product capability. It is independent
of production astronomy and the external Scientific Core, and it must preserve
this boundary:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
→ scientific core
```

Private Feedback stops at the Website API / BFF and PostgreSQL persistence. It
does not call the Engine Public API or cross into the Scientific Core.

The inspected repository establishes these implementation conventions:

- `apps/web/src/pages/vault.astro` and the Auth pages are static Astro routes
  that use `robots: 'noindex,nofollow'` for private surfaces.
- `apps/web/src/features/vault/vault-charts.ts` performs a browser-side session
  check and redirects an unauthenticated user to `/auth/sign-in`.
- `server/src/app/auth/require-authentication.ts` is the authoritative API
  authentication boundary and places the server-resolved principal in Hono
  context.
- `server/src/app/security/enforce-same-origin-unsafe-api-requests.ts` rejects
  missing or mismatched `Origin` headers for unsafe `/api/*` requests.
- `server/src/app/security/api-rate-limiting.ts` owns the current process-local
  P0 endpoint policies and never persists raw client addresses.
- `packages/contracts/src/api/vault.ts` demonstrates shared API request,
  response, and bounded error contracts.
- `server/src/app/validation/vault-chart.ts` and
  `server/src/app/validation/auth-email.ts` demonstrate explicit runtime type
  guards and rejection of unsupported object keys.
- `server/src/persistence/persistence-repositories.ts`, the dedicated
  repository interfaces, and `server/src/persistence/postgres/` establish the
  application repository plus PostgreSQL adapter pattern.
- `server/db/migrations/` contains numbered, forward-only SQL migrations. Per
  `server/src/runtime/README.md`, new migrations omit their own transaction
  wrapper because the migration runner owns the transaction.
- Existing user-owned tables reference `users (user_id)` with
  `ON DELETE CASCADE`.
- The repository currently has no test runner, automated test files, or
  browser-test dependency. The implementation patch must keep test additions
  focused and must not imply an existing test framework.

## Product decision

Private Feedback is an authenticated, private, non-indexed product-support
intake mechanism.

```text
AUTHENTICATED USERS ONLY
```

The frozen user flow is:

```text
Authenticated user
→ opens /feedback
→ selects one approved category
→ writes feedback
→ submits
→ receives an explicit success or failure state
```

The MVP accepts a submission and confirms whether the intake succeeded. It is
not a public discussion, support portal, ticket dashboard, chat system, inbox,
Community Question, Practitioner-contact feature, or public issue tracker.

## Route and authentication architecture

### Browser route

The browser route is:

```text
/feedback
```

The Astro application is currently a static build and has no server-rendered
page-authentication middleware. Therefore `/feedback` follows the established
Vault pattern:

1. Render only the non-sensitive form shell.
2. Request `GET /api/auth/session` with same-origin credentials and
   `cache: 'no-store'`.
3. If the user is not authenticated, replace browser navigation with
   `/auth/sign-in`.
4. If session state cannot be established, show a bounded generic failure
   state instead of exposing or accepting the form.

This browser redirect is user experience, not authorization. Loading the
static page never grants submission permission.

### API route

The only Feedback API route in the MVP is:

```text
POST /api/feedback
```

It uses `requireAuthentication(dependencies.authenticator)`. An absent,
invalid, or expired session receives the existing generic `401` response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  }
}
```

The route reads `authenticatedPrincipal.userId` from the server context and
binds that value as the persistence owner. The request contract contains no
`userId`, account ID, owner ID, or role field, so a caller cannot choose or
override ownership.

P0 requires Email Magic Link authentication only. Google Sign-In is not a
dependency of Private Feedback.

No `GET /api/feedback`, `/feedback/:id`, or user-facing history endpoint is
part of the MVP.

### Same-origin and CSRF boundary

The existing global middleware remains authoritative. `POST /api/feedback`
must carry an exact canonical `Origin` equal to `PUBLIC_WEB_ORIGIN`; absent,
non-canonical, or mismatched origins receive the existing generic `403`
response before route authentication or persistence.

The browser sends JSON with `Content-Type: application/json`,
`credentials: 'same-origin'`, and `cache: 'no-store'`. The existing host-only
HttpOnly session cookie, `SameSite=Lax`, and exact-Origin enforcement remain
the P0 CSRF architecture. No Feedback-specific CSRF token or cross-origin API
is introduced.

## Category contract

The stable machine contract is:

```ts
export type FeedbackCategory =
  | 'BUG'
  | 'SUGGESTION'
  | 'CALCULATION_CONCERN'
  | 'OTHER';
```

The UI label mapping is frozen exactly as follows:

| Machine value | Public/UI label |
| --- | --- |
| `BUG` | Bug |
| `SUGGESTION` | Suggestion |
| `CALCULATION_CONCERN` | Incorrect result / calculation concern |
| `OTHER` | Other |

No alias, fifth category, custom category, priority, or severity value is
accepted in the MVP.

## Submission contract

The smallest credible request has two fields:

```ts
export interface CreateFeedbackApiRequest {
  readonly category: FeedbackCategory;
  readonly message: string;
}
```

The response confirms intake without exposing an internal persistence ID:

```ts
export interface CreateFeedbackApiResponse {
  readonly submitted: true;
}
```

A successful insert returns HTTP `201` with `{ "submitted": true }`.

The bounded route error contract follows current package conventions:

```ts
export type FeedbackApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface FeedbackApiErrorResponse {
  readonly error: {
    readonly code: FeedbackApiErrorCode;
    readonly message: string;
  };
}
```

Global middleware may also reject an invalid origin with the existing
`FORBIDDEN` response.

There is an observed repository-level contract defect: `docs/PRD.md` requires
RFC 9457 Problem Details, while current Auth, Chart, Vault, security, rate-limit,
not-found, and unhandled-error responses use the custom `{ error: { code,
message } }` envelope. Private Feedback must not introduce a third dialect or
partially migrate only its route while global middleware still returns the old
shape. `WEB-FEEDBACK-001B` therefore uses the existing envelope consistently as
a bounded compatibility decision. Cross-API RFC 9457 alignment remains a
separate pre-production contract task and must migrate shared contracts,
middleware, and existing clients together.

The MVP deliberately omits:

- subject or title;
- source page or referrer path;
- saved chart reference;
- chart facts or birth data;
- attachments or screenshots;
- browser, device, or fingerprint data;
- application-level IP-address storage; and
- any caller-supplied owner or lifecycle state.

## Calculation-concern boundary

`CALCULATION_CONCERN` records the user's report as ordinary plain text. It does
not authorize the feature to:

- calculate or recalculate a chart;
- load a saved chart;
- inspect an astronomy provider;
- validate the report scientifically;
- generate scientific configuration or provenance identities; or
- make a production scientific claim.

The initial MVP has no saved-chart reference. Linking a report to a chart
would couple private support data to sensitive birth/chart data, introduce
additional ownership checks, and expand account-deletion and retention
semantics without being necessary for intake. Optional owned-chart linkage is
deferred to a separate privacy and product decision.

## Validation and normalization

Server validation is authoritative. The browser may mirror the limits for
immediate feedback but cannot weaken them.

The request boundary and validator must enforce all of the following:

1. Require `Content-Type: application/json`; otherwise return HTTP `415` with
   `UNSUPPORTED_MEDIA_TYPE`.
2. Reject a request body larger than 32 KiB before JSON parsing with HTTP `413`
   and `PAYLOAD_TOO_LARGE`.
3. The body is valid JSON and an object, not an array or `null`.
4. The object has exactly the own keys `category` and `message`.
5. `category` is one of the four frozen machine values.
6. `message` is a string.
7. Normalize CRLF and CR line endings to LF, then trim leading and trailing
   whitespace.
8. The normalized message contains at least 10 and at most 5,000 Unicode
   characters.
9. Reject NUL and other disallowed control characters; ordinary text and line
   breaks remain supported.
10. Treat the message as plain text, never as HTML.

Empty, whitespace-only, undersized, oversized, malformed, or extra-field
payloads receive HTTP `400` with:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid feedback request."
  }
}
```

Database, stack, validation implementation, and internal field details are
never returned. The route persists only the normalized message.

## Persistence model

### Table and migration

Implementation uses the next forward-only migration:

```text
server/db/migrations/0004_private_feedback.sql
```

The migration must omit `BEGIN` and `COMMIT`; the existing runner owns the
transaction. It creates one table:

```sql
CREATE TABLE feedback_submissions (
    feedback_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT feedback_submissions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT feedback_submissions_category_check
        CHECK (category IN (
            'BUG',
            'SUGGESTION',
            'CALCULATION_CONCERN',
            'OTHER'
    )),
    CONSTRAINT feedback_submissions_message_length_check
        CHECK (char_length(message) BETWEEN 10 AND 5000),
    CONSTRAINT feedback_submissions_message_line_endings_check
        CHECK (position(E'\r' in message) = 0)
);

CREATE INDEX feedback_submissions_user_id_idx
    ON feedback_submissions (user_id);
```

`feedback_id` uses the existing opaque `IdGenerator`; the current runtime
implementation produces UUIDs but the database contract remains `TEXT`,
consistent with existing website-owned identifiers. `created_at` uses the
existing server `Clock` and an ISO timestamp supplied to the repository.

The owner index supports the foreign-key deletion path and future authorized
owner-scoped operations. No speculative status, created-time review index,
full-text index, or public identifier is added.

### Lifecycle decision

The MVP does not persist a lifecycle status. There is no user-facing ticket
workflow, internal review interface, or status transition in this scope, so an
`OPEN`/`CLOSED` field would have no authoritative consumer.

Submissions are immutable after creation. Consequently the MVP also omits
`updated_at`. If authorized internal review tooling later requires status, it
must add a forward migration and the smallest state machine justified by that
tool; priority, severity, SLA, assignment, and escalation remain out of scope.

### Account lifecycle

The repository has no account-deletion endpoint today, so this ADR does not
invent one. The database relationship nevertheless must be unambiguous:

```text
feedback_submissions.user_id
→ users.user_id
→ ON DELETE CASCADE
```

This matches existing user-owned Vault and session data. A future authorized
account deletion therefore removes the user's private Feedback records rather
than orphaning, anonymizing, or retaining them implicitly. `RESTRICT` would
block deletion, and `SET NULL` would break the frozen ownership boundary.

## Contract and persistence ownership

Shared browser/server API contracts belong in:

```text
packages/contracts/src/feedback.ts
packages/contracts/src/api/feedback.ts
packages/contracts/src/api/index.ts
packages/contracts/src/index.ts
```

`FeedbackCategory` belongs in `feedback.ts`. The create request, create
response, and bounded API error types belong in `api/feedback.ts` and are
exported through the existing package-root barrel.

The internal persistence record is not part of the public package contract.
It belongs with a dedicated server repository:

```text
server/src/persistence/feedback-submission-repository.ts
server/src/persistence/postgres/postgres-feedback-submission-repository.ts
```

The repository surface is intentionally one operation:

```ts
interface FeedbackSubmissionRepository {
  create(submission: FeedbackSubmissionRecord): Promise<void>;
}
```

`FeedbackSubmissionRecord` contains only `feedbackId`, `userId`, `category`,
`message`, and `createdAt`. It remains server-internal because the browser
never receives the record.

The implementation adds the dedicated repository to
`PersistenceRepositories` and `createPostgresPersistence(...)`. The route must
not issue SQL directly, and no generic storage abstraction or ORM is added.

## Server flow and error behavior

The server flow is frozen as:

```text
POST /api/feedback
→ existing API observability/security/origin/edge-rate-limit middleware
→ requireAuthentication(...)
→ authenticated-account Feedback rate limit
→ media-type and body-size boundary
→ strict request validation and normalization
→ bind authenticatedPrincipal.userId
→ generate feedback ID and created timestamp
→ FeedbackSubmissionRepository.create(...)
→ 201 { submitted: true }
```

The route is registered from `server/src/app/create-app.ts`. It uses existing
`ServerDependencies` only: authenticator, persistence, ID generator, and
clock. It must not invoke `engineClient`, `emailMagicLinkDelivery`, Resend,
Community services, analytics, or any external network dependency.

`createApp(...)` continues to own the process-local limiter instance and passes
it to the Feedback route registration for the authenticated-account policy;
rate-limit state does not enter `ServerDependencies` or PostgreSQL.

Unhandled persistence failures flow through the existing generic `500`
handler. The browser receives a generic actionable failure message and retains
the category and normalized-safe message for retry. Server/database details
are not exposed.

`classifyApiEndpointFamily(...)` gains one bounded `feedback` family so
operational logs continue to contain only request ID, method, endpoint family,
status, and duration. Logs must not contain message text, category, user ID,
cookies, IP address, or request body.

## Abuse and rate-limit decision

Authentication and same-origin enforcement materially reduce anonymous spam,
but repeated submissions still need a small endpoint-specific bound. The
implementation reuses the existing process-local limiter for two bounded
policies:

```text
Edge backstop
Policy: FEEDBACK_SUBMISSION_EDGE
Limit: 20 attempts
Window: 10 minutes
Key: existing HMAC-derived trusted-edge client identity

Authenticated account limit
Policy: FEEDBACK_SUBMISSION_ACCOUNT
Limit: 5 attempts
Window: 60 minutes
Key: server-resolved authenticatedPrincipal.userId
```

The edge policy runs in the existing global rate-limit middleware before
authentication. The account policy runs after `requireAuthentication(...)`
and before request-body parsing. Attempts that reach either limiter consume its
bucket even if later validation fails; this prevents invalid payloads from
bypassing abuse controls. The account key is derived only from the authenticated
principal, never from request data. PostgreSQL row counts are not used as a
rate-limit store.

No raw IP address is written to the Feedback record, application logs, or
limiter map. The existing staging limitation remains: process-local limits are
not a production multi-replica policy.

No CAPTCHA, third-party anti-spam service, browser fingerprinting, device
telemetry, or AI classification is introduced.

## Frontend architecture and UX

The implementation shape is:

```text
apps/web/src/pages/feedback.astro
→ apps/web/src/features/feedback/private-feedback.ts
→ POST /api/feedback
```

The page uses `SiteLayout` in the existing restrained Editorial/Auth mode,
`nn-container--form`, `Surface`, and existing field, button, status, error, and
focus primitives. A small first-party TypeScript module is sufficient; the
MVP does not require a React island.

The visible hierarchy is limited to:

1. one page title and concise private-support explanation;
2. one required category control;
3. one required message textarea;
4. one primary submit button; and
5. one bounded status region.

The category control presents the four approved labels. The textarea uses the
10–5,000 character contract and may expose a quiet character-count helper.
Submitting disables duplicate submission until the request settles.

On success:

- clear the submitted message from browser state;
- replace or hide the form;
- show a clear focused success state;
- do not display the internal Feedback ID; and
- offer an explicit `Send another feedback` action that intentionally resets
  the form.

On validation failure:

- preserve category and message;
- identify the affected field with nearby accessible text;
- focus the first invalid field or linked error summary; and
- allow correction and resubmission.

On network, rate-limit, or server failure:

- preserve category and message;
- re-enable the submit action when safe;
- show actionable generic copy; and
- do not expose response internals, database facts, or stack details.

An API `401` redirects to `/auth/sign-in`, consistent with Vault. No unsafe
return URL or authentication-flow redesign is added.

The page has no hero art, celestial decoration, dashboard, sidebar, support
history, FAQ wall, or new visual vocabulary.

## Navigation recommendation

The smallest appropriate discovery point is the authenticated session area.
When signed in, `AuthSessionControl.astro` may expose one quiet `Feedback` link
alongside the existing session action. It is hidden for signed-out state and
must remain visually subordinate to the primary public product navigation.

Private Feedback is not added as a top-level peer of Learn, Tools, Calculate,
or Vault. It is not placed inside Vault because Feedback is product-wide, not
chart-storage functionality. The repository has no shared footer today, so
the MVP does not introduce a site-wide footer solely for this link.

## Privacy and Community separation

Feedback records are private product-support data:

- they are never publicly rendered;
- they are never returned from a public or unauthenticated API;
- ownership is tied to the authenticated user at the server boundary;
- they are not indexed or added to the sitemap;
- they are not copied into analytics or advertising profiles; and
- future server access is limited to separately authorized internal/team
  operations.

This ADR does not invent a retention duration, privacy-policy promise, staff
role model, admin permission system, or internal support console.

The hard product boundary is:

```text
PRIVATE FEEDBACK ≠ PUBLIC QUESTIONS
```

No Feedback record automatically becomes a Question, Answer, Learn article,
Practitioner content, Community content, public issue, or SEO page. Any future
promotion, quotation, or reuse requires a separate explicit product and
privacy decision.

## SEO and noindex policy

The page uses the existing private-route metadata convention:

```ts
{
  title: 'Feedback | NatalNode',
  description: 'Send private product feedback to NatalNode.',
  canonical: '/feedback',
  robots: 'noindex,nofollow'
}
```

It is excluded from any current or future sitemap. It receives no JSON-LD,
Q&A markup, public author metadata, index-oriented copy, or public canonical
discovery strategy. The ordinary canonical emitted by the existing
`SeoHead.astro` remains a URL-consistency mechanism, not an indexing signal.

## Accessibility requirements

The implementation must use native form semantics first and provide:

- a programmatic and visible label for the category control;
- a programmatic and visible label for the message textarea;
- native `required` state plus server-authoritative validation;
- keyboard-operable controls with existing visible focus treatment;
- `aria-invalid` and `aria-describedby` links for field errors;
- a bounded `role="alert"` or appropriate live region for submission failure;
- an accessible success announcement and a programmatically focusable success
  region;
- logical focus movement to the first invalid field on validation failure and
  to the success region after successful submission; and
- no meaning conveyed by color alone.

Decorative ARIA and custom select widgets are unnecessary. The category may
use a native `<select>` to preserve keyboard and screen-reader behavior.

## Read/history API decision

There is no user-facing Feedback list, history, detail page, or read API in the
MVP. The product requirement is intake only, and returning records would add
authorization, pagination, retention, status, and support-workflow semantics
without a P0 need.

Internal/team review is outside this architecture patch. The create-only
repository does not pre-design an admin read API.

## Recorded pre-production gates

These repository-level gaps do not block local implementation of the bounded
intake slice, but they must be resolved before production launch or any
internal support workflow:

- align the existing custom API error envelope with the PRD's RFC 9457
  requirement through one coordinated cross-API contract task;
- implement the PRD-required account/data deletion capability; this ADR only
  makes Feedback ownership cascade correctly when that capability exists;
- approve retention and authorized internal-access policy without inventing a
  duration or staff role in this task;
- replace or supplement process-local rate limiting before multi-replica
  production deployment; and
- establish the focused executable test harness required by the implementation
  sequence.

Deployment remains paused, so none of these gates authorizes Railway, Caddy,
DNS, production-secret, or infrastructure work.

## Testing architecture for the implementation patch

The repository currently has no automated test framework. `WEB-FEEDBACK-001B`
must keep verification focused and must not add a broad browser or application
test suite merely for this slice. Where automation is added, prefer Node's
built-in `node:test` and `node:assert/strict` against compiled server modules so
no third-party test framework is required.

Required contract/validation cases:

- each of the four valid categories is accepted;
- an unknown category is rejected;
- empty, whitespace-only, and fewer-than-10-character messages are rejected;
- a 5,000-character message is accepted and a larger message is rejected;
- line-ending and outer-whitespace normalization is deterministic;
- malformed JSON, wrong types, and unsupported fields are rejected;
- wrong media type returns `415`, and an over-32-KiB body returns `413` before
  persistence.

Required server cases using Hono request handling and fake dependencies:

- unauthenticated submission returns `401` and does not persist;
- missing or mismatched Origin is rejected by the existing global boundary;
- authenticated valid submission returns `201`;
- the persisted `userId` is the authenticated principal, never request data;
- the edge backstop and authenticated-account throttle independently return
  `429` with `Retry-After` after their frozen limits;
- different authenticated users do not share the account bucket;
- malformed payload returns the bounded `400` response;
- repository failure returns a generic `500`; and
- Engine, email delivery, and other external dependencies are never invoked.

Required persistence cases with the existing `SqlExecutor` boundary and, when
an operational test PostgreSQL database is explicitly available, the migration
runner:

- insert uses parameterized values for the five frozen fields;
- category and message constraints reject invalid stored data;
- the user foreign key enforces ownership;
- account deletion cascades to owned Feedback records; and
- no update, list, or delete method is exposed by the MVP repository.

Required frontend verification:

- signed-out state redirects to sign-in;
- valid submission reaches and focuses the success state;
- `Send another feedback` intentionally resets the form;
- validation and server failure preserve safe user input;
- all fields, errors, status announcements, and focus movement meet the
  accessibility requirements above; and
- the page has `noindex,nofollow` metadata.

Because no DOM/browser test runner exists, the implementation may verify pure
request/state helpers with focused built-in tests and must complete a targeted
manual keyboard/focus/announcement check for the rendered Astro form. Adding a
browser test framework requires a separate justified decision.

No broad unrelated test suite is required.

## Explicit MVP non-goals

The following are explicitly outside the MVP:

- anonymous feedback;
- attachments, screenshots, or uploads;
- public feedback or public issue pages;
- public roadmap voting;
- ticket inbox, history, or dashboard;
- replies or reply threads;
- support-agent console;
- email notifications or acknowledgements;
- Community or Questions integration;
- Practitioner integration or contact;
- moderation/admin UI;
- priority, severity, assignment, SLA, or escalation;
- AI classification or automatic bug triage;
- analytics, fingerprinting, or device telemetry;
- source-page capture or referrer persistence;
- saved-chart linkage;
- scientific verification or scientific claims;
- chart calculation or recalculation;
- resolver, Engine, or provider integration; and
- a new visual-system track.

## Non-binding future extension points

Only a later explicit product, privacy, and architecture decision may add:

- authorized internal review tooling;
- user-visible Feedback history;
- optional reference to an owned saved chart;
- email acknowledgement; or
- a minimal internal status workflow.

These are not implementation requirements for `WEB-FEEDBACK-001B`, and this
ADR intentionally does not design their schemas, routes, permissions, or UI.

## Bounded implementation sequence

The next task is:

```text
WEB-FEEDBACK-001B — Implement Private Feedback MVP Vertical Slice
```

Its bounded sequence is:

1. Add the shared category and create/error API contracts.
2. Add `0004_private_feedback.sql`, the create-only repository interface, and
   the PostgreSQL adapter/composition wiring.
3. Add strict validation and authenticated `POST /api/feedback`.
4. Add the narrow edge/account Feedback rate-limit policies and privacy-safe
   endpoint-family classification.
5. Add the static `/feedback` route and small first-party form controller.
6. Add the private/noindex metadata, session redirect, success/error/focus
   behavior, and existing Visual V1.1 primitives.
7. Add the quiet authenticated-session Feedback entry.
8. Add only the focused tests and manual accessibility verification defined in
   this ADR.

`WEB-FEEDBACK-001B` is not implemented by this architecture task.

## Frozen external boundaries

### Scientific Core

Private Feedback requires no Scientific Core completion. The implementation
must introduce no Engine call, astronomy calculation, provider dependency,
production chart logic, resolver change, scientific configuration ID, or
provenance generation. For calculation concerns, the system only stores the
user's report for later human review outside this feature.

`PROVIDER DECISION DEFERRED` remains authoritative.

### Deployment

```text
WEB DEPLOYMENT TRACK = PAUSED
```

Architecture and repository implementation may proceed locally. Railway,
Caddy, DNS, deployment workflows, production secrets, and the accepted
security/deployment sequence remain unchanged.

### Visual system

```text
NATALNODE VISUAL V1.1 FUNCTIONAL BASELINE = APPROVED
```

Private Feedback reuses existing typography, spacing, surface, field, button,
notice, status, responsive, and accessibility primitives. It does not add hero
art, celestial decoration, a dashboard, or a new visual language.

### Repository boundary

`C:\NatalNode` remains outside NatalNode-Web scope and is not required for this
feature.
