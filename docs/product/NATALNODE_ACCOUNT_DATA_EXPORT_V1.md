# NatalNode Account Data Export V1

- **Status:** APPROVED TECHNICAL DIRECTION
- **Runtime implementation:** DEFERRED
- **Task:** WEB-PRIVACY-002A
- **Decision date:** 2026-08-27

This document freezes the P0 technical contract for **Download my data** / **Export my data**. It is an application-data disclosure contract, not legal copy, a database-dump specification, or an implementation.

The fixed trust boundary remains:

```text
Browser / NatalNode.com
  -> same-origin Website API / BFF
  -> NatalNode Engine Public API (calculation only; not involved in export)
```

`PROVIDER DECISION DEFERRED.`

## 1. Purpose

A successful account export gives the authenticated user a machine-readable snapshot of NatalNode application data associated with their account and appropriate for user disclosure.

The contract is designed to be:

- comprehensive for meaningful, persisted, account-owned application data;
- explicit about sensitive authentication artifacts that must never be disclosed;
- isolated to the authenticated account determined by the server;
- internally consistent across related account records;
- static and non-mutating;
- bounded enough for P0 without introducing a queue, archive format, or new dependency; and
- compatible with the account-erasure ownership graph without reopening account deletion.

The export is not a representation of every physical byte that NatalNode or an infrastructure processor may hold. It does not claim legal portability, retention, backup, or processor-log semantics.

## 2. Current-state audit

This direction is based on repository state at commit `3e0e25c15426a6e4067722471ffbba23026523d5` (`feat: add account deletion ux`). The current persisted account graph is defined by:

- `server/db/migrations/0001_auth_vault_baseline.sql`;
- `server/db/migrations/0002_auth_runtime.sql`;
- `server/db/migrations/0003_auth_identity_provisioning_fk.sql`; and
- `server/db/migrations/0004_private_feedback.sql`.

The bounded runtime audit also covered the current Auth, Vault, Feedback, session-authentication, PostgreSQL persistence, account-erasure, same-origin, API-header, rate-limit, and observability boundaries.

Observed current state:

- `users` is the account root.
- `auth_identities`, `auth_sessions`, `charts`, and `feedback_submissions` are linked to `users.user_id` with cascading account ownership.
- `chart_notes` belongs to both a chart and a user, and both links participate in owner isolation.
- `email_magic_link_challenges` is linked by normalized email rather than `user_id`; account erasure resolves owned Email Magic Link subjects and removes matching challenge rows in the erasure transaction.
- account erasure is already a dedicated, pool-owned PostgreSQL transaction boundary. Export must remain compatible with that graph but must not modify it.
- the authenticated principal is server-derived and contains immutable `userId` and `sessionCreatedAt` values.
- unsafe API requests already have an exact-Origin boundary.
- current API security headers already establish `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
- current observability is bounded to endpoint family, request identifier, status, and duration; payload logging is not part of that boundary.
- no account export endpoint, repository, schema, UI, test, migration, or runtime dependency currently exists.

The current account-linked storage graph is:

```text
users
├── auth_identities
├── auth_sessions
├── charts
│   └── chart_notes
└── feedback_submissions

auth_identities(provider = EMAIL_MAGIC_LINK)
└── email_magic_link_challenges (linked for erasure by normalized email)
```

The second relationship is an Auth-lifecycle cleanup relationship, not a reason to expose challenge records.

## 3. Account-linked export inventory

Classification labels used throughout this contract:

- **A — USER-FACING EXPORT DATA:** meaningful content or account facts the user supplied, created, or saved.
- **B — EXPORTABLE TECHNICAL METADATA:** safe lifecycle or provenance metadata needed to understand exported data.
- **C — SECURITY-SENSITIVE — MUST NOT EXPORT:** credentials, hashes, tokens, lock material, or equivalent security state.
- **D — OPERATIONAL / NOT ACCOUNT EXPORT DATA:** runtime infrastructure state with no direct user-export purpose.
- **E — POLICY DECISION REQUIRED:** data whose representation or disclosure requires a bounded policy decision before support.

| Entity | Storage | Ownership / linkage | User-facing significance | Sensitive fields | Classification | V1 export representation | Policy dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Account | `users` | Rooted at `users.user_id` | Establishes that the account exists and its lifecycle timestamps | `user_id` is an internal ownership key | A/B for lifecycle data; internal ID excluded | `account.createdAt`, `account.updatedAt` | None for technical implementation |
| Auth identity | `auth_identities` | `user_id -> users.user_id` | Identifies how the user signs in and, for Email Magic Link, the user's normalized email | `identity_id`, `user_id`, raw future provider subjects | A/B for approved safe representation; E for any future provider subject | Current Email Magic Link identity as `type`, `email`, `linkedAt`, `updatedAt` | A future provider requires a reviewed presenter |
| Auth session | `auth_sessions` | `user_id -> users.user_id` | No P0 account-export product need | `session_token_hash`; authentication lifecycle/state | C/D | Entire row excluded | None |
| Email Magic Link challenge | `email_magic_link_challenges` | Normalized email corresponds to an Email Magic Link identity; explicitly covered by erasure | No meaningful P0 user-facing history | `token_hash`, challenge state, consumption state | C/D | Entire row excluded | None |
| Saved chart | `charts` | `user_id -> users.user_id` | Primary Vault content: naming, organization, birth input, saved calculation snapshot, and provenance | `chart_id`, `user_id` are internal keys; birth data is sensitive payload | A/B | One object in `charts[]`, with notes nested under it | None |
| Chart note | `chart_notes` | `chart_id -> charts.chart_id` and `user_id -> users.user_id` | Private user-authored content associated with a saved chart | `note_id`, `chart_id`, `user_id` are internal keys | A/B | Nested in owning chart's `notes[]` with content and timestamps | None |
| Private Feedback | `feedback_submissions` | `user_id -> users.user_id` | User-submitted private Feedback content | `feedback_id`, `user_id` are internal keys | A/B | One object in top-level `feedback[]` | None |

No other account-linked persisted domain is present in the current migrations. In particular, the repository has no current subscription, billing, Google Sign-In implementation or Google-safe export presenter, AI-usage, export-job, export-audit, or provider-owned scientific record to add to V1.

## 4. Export classification matrix

The field-level policy is:

| Storage field / concept | Classification | Export rule |
| --- | --- | --- |
| `users.user_id` | Internal ownership key | Omit |
| `users.created_at` | A/B | Include as `account.createdAt` |
| `users.updated_at` | B | Include as `account.updatedAt` |
| `auth_identities.identity_id` | Internal database topology | Omit |
| `auth_identities.user_id` | Internal ownership key | Omit |
| Current `auth_identities.provider` | A/B | Include through public `identity.type`, currently `EMAIL_MAGIC_LINK` |
| Current Email Magic Link `provider_subject` | A, but sensitive personal data | Include through the user-meaningful `identity.email`; do not expose the storage-field name |
| A future provider's `provider_subject` | E | Exclude until an approved user-safe presenter is defined |
| Auth identity creation/update timestamps | B | Include as `linkedAt` and `updatedAt` |
| `auth_sessions` rows | C/D | Exclude all fields, including otherwise safe-looking timestamps |
| `email_magic_link_challenges` rows | C/D | Exclude all fields, including email and lifecycle timestamps |
| `charts.chart_id`, `charts.user_id` | Internal relationship/ownership keys | Use internally for joins and deterministic ordering; do not emit |
| Chart display name, category, tags, favorite | A | Include |
| `normalized_input` | A; sensitive birth data | Include as `normalizedChartRequest`; never log |
| `canonical_result` | A/B; saved scientific snapshot | Include as `canonicalChartResult` without recalculation or transformation |
| Engine/schema/configuration/provenance fields stored on chart | B | Include under `calculation` and preserve `null` exactly |
| Chart creation/update timestamps | B | Include |
| `chart_notes` internal IDs | Internal relationship/ownership keys | Use internally; do not emit |
| Chart-note content and timestamps | A/B | Include nested under owning chart |
| `feedback_submissions` internal IDs | Internal ownership/database keys | Use internally; do not emit |
| Feedback category, message, creation timestamp | A/B | Include |
| Rate-limit keys/counters | C/D | Exclude |
| Request IDs and observability events | D | Exclude |
| Processor logs and infrastructure backups | D/E | Outside direct application-account export |

## 5. Explicit export scope

V1 includes exactly these current domains:

1. Safe account lifecycle metadata.
2. Current Email Magic Link identity information in an approved user-facing representation.
3. Every saved Vault chart owned by the authenticated account.
4. Each chart's stored normalized birth/chart request.
5. Each chart's stored canonical `ChartResult` snapshot.
6. Each chart's stored Engine, chart-schema, astronomy-configuration, and provenance references.
7. Every private note owned by the account and associated with an exported chart.
8. Every owner-linked private Feedback submission.

The export reads stored facts only. It does not calculate, enrich, repair, normalize again, refresh, reinterpret, or fetch data from another service.

## 6. Explicit exclusions

V1 excludes:

- Auth sessions and session history;
- Email Magic Link challenge history;
- all raw database ownership and row identifiers;
- all credentials, secrets, hashes, tokens, and cookies;
- rate-limit state and keys;
- advisory-lock and transaction-lock material;
- request identifiers, internal errors, traces, and operational telemetry;
- Railway, PostgreSQL-provider, Resend, hosting, edge, or other processor logs;
- physical database backups and historical infrastructure snapshots;
- ephemeral guest data that never reached account persistence;
- Public Sky data, shared astronomical fixtures, reference datasets, and Engine assets;
- data belonging to another account;
- a refreshed chart result or any value newly derived from birth input;
- legal classifications, retention claims, or processor guarantees; and
- domains that do not exist in current repository persistence.

### NEVER EXPORT

The following are prohibited regardless of future payload-shape convenience:

- session token hashes;
- Email Magic Link token/challenge hashes;
- raw Auth tokens or links;
- session cookies or cookie values;
- password-equivalent material;
- rate-limit HMAC keys or raw rate-limit identity material;
- advisory-lock keys;
- encryption/signing keys;
- database credentials;
- API keys;
- Resend credentials;
- server and deployment secrets;
- internal SQL text or SQL errors;
- internal request IDs unrelated to user-visible content; and
- arbitrary future provider subjects without a reviewed safe representation.

## 7. Account identity representation

The V1 `account` object contains:

- `createdAt`: the account root's creation timestamp;
- `updatedAt`: the account root's current update timestamp; and
- `identities`: approved user-facing sign-in identity representations.

For the current Email Magic Link model, an identity contains:

- `type: "EMAIL_MAGIC_LINK"`;
- `email`: the normalized email already used as the identity subject;
- `linkedAt`: the identity creation timestamp; and
- `updatedAt`: the identity update timestamp.

The normalized email is included because it is both user-meaningful and the current account's sign-in identity. It is sensitive personal data and receives the same no-log/no-cache handling as the rest of the export.

The public representation must not contain `user_id`, `identity_id`, or the generic storage name `provider_subject`. Future provider support must define an explicit presenter that exposes only meaningful, approved fields. It must never fall back to serializing an `auth_identities` row.

The schema currently reserves `GOOGLE`, but Google Sign-In and an approved Google identity export presenter are not part of current P0 runtime. If future implementation encounters an unsupported identity provider, it must fail the complete export safely before success headers rather than silently omit the identity or dump its raw subject. Supporting that identity is a separately reviewed schema/policy change. `PROVIDER DECISION DEFERRED.`

## 8. Auth identities, sessions, and challenge secrets

Safe identity disclosure and authentication-infrastructure disclosure are different concerns.

- Email Magic Link identity type and normalized email are included through the public identity shape.
- Auth sessions are excluded in full. Although `created_at` and `expires_at` may look harmless in isolation, P0 has no session-history feature requiring them, and session rows are security/operational state centered on `session_token_hash`.
- Email Magic Link challenges are excluded in full. Their purpose is one-time authentication credential lifecycle, not account content. Excluding the whole row avoids exposing token hashes, challenge consumption state, or a misleading authentication-event history.
- Export never changes, revokes, extends, or creates sessions or challenges.

If a later product decision adds a user-visible security-history feature, it must define a separate safe event model. It must not reuse raw session or challenge records as export objects.

## 9. Vault chart representation

Each saved chart owned by the authenticated account is represented with:

- `displayName` from `display_name`;
- `category`;
- `tags`, preserving stored order and values;
- `favorite`;
- `normalizedChartRequest` from `normalized_input`;
- `canonicalChartResult` from `canonical_result`;
- `calculation.engineVersion`;
- `calculation.chartSchemaVersion`;
- `calculation.astronomyConfigurationId`;
- `calculation.provenanceEnvelopeId`;
- `createdAt`;
- `updatedAt`; and
- nested `notes`.

Nullable calculation metadata stays `null`; it must not be guessed, backfilled, or converted into stronger production metadata. Research/incomplete scientific metadata inside the stored canonical result remains unchanged.

Raw `chart_id` and `user_id` values are not emitted. They may be used inside the export repository to enforce ownership, join notes, paginate, and establish deterministic ordering.

V1 needs no export-local relationship IDs because notes are nested under charts and other collections do not cross-reference one another. If a future schema genuinely requires cross-references, it should introduce deterministic export-local references through a reviewed schema version instead of exposing database UUIDs.

### Birth data

The persisted normalized chart request is included because it is meaningful data stored for the account. It may contain sensitive birth date, time, and place information. Export generation must not place the request, any component birth field, or a derived summary into logs, metrics, analytics, audit records, filenames, error messages, or rate-limit keys.

### Stored ChartResult snapshot

The stored canonical result is included verbatim according to its persisted data contract because it is account-associated saved chart data. Export must not:

- call the NatalNode Engine;
- call any scientific provider;
- recalculate the chart;
- resolve time zones;
- update retrograde, aspect, house, sign, or planet facts;
- refresh versions or provenance;
- reinterpret content; or
- replace the snapshot with a newer schema.

Scientific identifiers and schema facts already embedded in the canonical domain snapshot are preserved as domain data. This does not override the prohibition on emitting database row identifiers.

## 10. Chart-note representation

All owner-linked private chart notes are included. Notes are nested under their owning chart:

```json
{
  "content": "User-authored note text",
  "createdAt": "2026-08-27T12:00:00.000Z",
  "updatedAt": "2026-08-27T12:00:00.000Z"
}
```

Nesting preserves the chart relationship without exposing `note_id` or `chart_id`. The query must require both the authenticated `user_id` and owning `chart_id`; possession of a chart identifier alone is never sufficient authority.

Notes are ordered by `created_at` ascending, with `note_id` as a non-emitted deterministic tie-breaker. Note text must pass only through JSON serialization, never string interpolation into JSON framing.

## 11. Private Feedback representation

Every Feedback submission linked to the authenticated account is included as:

```json
{
  "category": "...",
  "message": "User-submitted feedback text",
  "createdAt": "2026-08-27T12:00:00.000Z"
}
```

`feedback_id` and `user_id` are not emitted. Feedback is ordered by `created_at` ascending with `feedback_id` as a non-emitted deterministic tie-breaker.

The existing Feedback persistence surface is create-only. Future implementation must add a focused owner-scoped export read inside the account-export repository; it must not broaden the public Feedback API or add standalone Feedback history UI as part of server export work.

## 12. Guest, Public Sky, and scientific boundaries

### Guest data

Guest chart state held only in browser memory is outside a server-generated account export. The server cannot truthfully export data it never persisted. The UI must not imply otherwise.

If a guest later signs in and explicitly saves a chart, only the resulting persisted account-owned chart falls within this contract.

### Public Sky and shared science

Public Sky fixtures, global/reference astronomical datasets, scientific Engine assets, and other shared facts are not account-owned merely because the product displays or uses them. They are excluded.

The Website API/BFF must not call the Engine or a scientific provider during export. Export preserves only the stored account-owned chart request, result snapshot, and persisted calculation/provenance metadata.

`PROVIDER DECISION DEFERRED.`

## 13. P0 JSON schema direction

The only P0 format is UTF-8 JSON. The public shape is:

```ts
interface NatalNodeAccountDataExportV1 {
  readonly exportSchemaVersion: '1.0';
  readonly exportedAt: string;
  readonly account: {
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly identities: readonly EmailMagicLinkExportIdentityV1[];
  };
  readonly charts: readonly AccountChartExportV1[];
  readonly feedback: readonly FeedbackExportV1[];
}

interface EmailMagicLinkExportIdentityV1 {
  readonly type: 'EMAIL_MAGIC_LINK';
  readonly email: string;
  readonly linkedAt: string;
  readonly updatedAt: string;
}

interface AccountChartExportV1 {
  readonly displayName: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: ChartRequest;
  readonly canonicalChartResult: ChartResult;
  readonly calculation: {
    readonly engineVersion: string;
    readonly chartSchemaVersion: string;
    readonly astronomyConfigurationId: string | null;
    readonly provenanceEnvelopeId: string | null;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly notes: readonly ChartNoteExportV1[];
}

interface ChartNoteExportV1 {
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface FeedbackExportV1 {
  readonly category: string;
  readonly message: string;
  readonly createdAt: string;
}
```

An illustrative empty-account envelope is:

```json
{
  "exportSchemaVersion": "1.0",
  "exportedAt": "2026-08-27T12:00:00.000Z",
  "account": {
    "createdAt": "2026-08-01T12:00:00.000Z",
    "updatedAt": "2026-08-01T12:00:00.000Z",
    "identities": [
      {
        "type": "EMAIL_MAGIC_LINK",
        "email": "person@example.com",
        "linkedAt": "2026-08-01T12:00:00.000Z",
        "updatedAt": "2026-08-01T12:00:00.000Z"
      }
    ]
  },
  "charts": [],
  "feedback": []
}
```

All timestamps are server/storage-derived UTC ISO-8601 strings. `exportedAt` is generated once by the server when the repeatable-read snapshot is established; it is not accepted from the browser and is not a substitute for any record timestamp.

The top-level names are product-domain names, not raw table names. Data is not duplicated across sections. Empty collections are emitted as empty arrays rather than omitted.

## 14. Export schema versioning

`exportSchemaVersion` identifies the NatalNode account-export envelope. V1 is the exact string `"1.0"`.

This is distinct from:

- `calculation.chartSchemaVersion`; and
- any schema version contained inside `canonicalChartResult`.

Version rules:

- compatible additive fields may advance the minor version after contract review;
- removal, renaming, meaning changes, incompatible type changes, or nesting changes require a major version;
- a future identity type requires an explicit export presenter and a reviewed schema change;
- existing stored `ChartResult` values remain in their persisted scientific schema and are never upgraded merely because export schema changes; and
- the implementation must test the envelope version independently from scientific contracts.

JSON object member order is not semantic, but the writer should emit a stable order for readability and deterministic verification. Array ordering is defined below.

## 15. API contract

The P0 endpoint is:

```http
POST /api/account/export
```

Request contract:

- same-origin Website API/BFF endpoint;
- authenticated session cookie required;
- exact trusted Origin required through the existing unsafe-request policy;
- no request body;
- no query string;
- no `userId`, `accountId`, `ownerId`, email, identity, export timestamp, format selector, or other account selector;
- no Engine or provider input; and
- repeated requests are independent read operations, not mutations.

The route must reject any body, query parameter, or account-targeting input as `INVALID_REQUEST`. A bodyless `POST` keeps the request minimal, engages the repository's exact-Origin protection, and supports a native browser attachment response without inventing a CSRF token or download-job handshake.

`GET` is not selected because sensitive cross-site-triggerable downloads would not reliably pass through the existing exact-Origin policy for unsafe methods. No public/admin multi-account variant is part of V1.

The endpoint returns the streamed JSON attachment on success. It creates no export record, job, token, database mutation, or audit row.

## 16. Authentication and recent-auth policy

### Valid session

The existing server-side session authenticator is mandatory. The request target comes from `AuthenticatedPrincipal.userId`, never browser data. Missing, invalid, expired, or no-longer-account-backed sessions produce the existing bounded unauthorized behavior.

### Recent authentication decision

V1 **requires recent authentication**.

This is an independent export risk decision, not an automatic inheritance from deletion. The export contains the normalized sign-in email, complete persisted birth inputs, chart snapshots, private notes, and private Feedback. A stolen but otherwise valid long-lived session would expose the account's concentrated sensitive data in one response. That benefit outweighs the limited passwordless re-authentication cost for this infrequent action.

The implementation may reuse the current immutable, server-derived `AuthenticatedPrincipal.sessionCreatedAt` mechanism and server clock. Browser time and a client countdown are never authorities.

The approved export maximum age is **600 seconds**. It is intentionally the same duration as the current deletion policy after independent evaluation, but export must have an export-named policy boundary rather than importing deletion semantics by accident. A shared generic recent-auth evaluator is acceptable; a deletion-specific policy constant is not the export contract.

If recent authentication is too old, return `403 RECENT_AUTHENTICATION_REQUIRED`. Re-authentication must use the real Auth flow. This contract does not authorize mock login, virtual authentication, or a local bypass.

## 17. Authorization and account isolation

Authorization invariants for every read:

1. Authenticate the request.
2. Evaluate recent authentication from server timestamps.
3. Begin the export snapshot.
4. Verify the account root for `principal.userId` inside that snapshot.
5. Root identity, chart, note, and Feedback reads in that same `userId`.
6. Require both owner and parent-chart predicates for note reads.
7. Use internal IDs only inside the repository for joins, pagination, and tie-breaking.
8. Emit no data from rows that are not proven to belong to that principal.

The browser cannot choose an account. An email from a cookie-independent request value is not authority. A chart or note identifier alone is not authority. The normal user endpoint has no admin mode.

Focused implementation tests must prove that User A cannot receive User B account metadata, identities, charts, notes, or Feedback, including adversarial mixed-owner parent/child cases.

## 18. Snapshot and transaction model

V1 uses one dedicated, pool-owned account-export repository that owns one checked-out PostgreSQL client and one transaction for the complete export.

The transaction is:

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
```

The repository must establish the snapshot and verify the account root before sending success headers. All export queries execute on that same checked-out client and snapshot. Independent calls through existing pool-backed repositories are insufficient because they could observe different committed states.

The transaction provides a coherent account view while charts, notes, Feedback, or identity data are being changed concurrently. It must not:

- acquire the account-erasure advisory locks;
- use `FOR UPDATE` on the account root;
- write an export/audit row;
- hold an application-level deletion gate;
- call Engine; or
- transform stored scientific facts.

Rows are emitted in stable order:

- identities: `created_at ASC`, then `identity_id ASC` as a non-emitted tie-breaker;
- charts: `created_at ASC`, then `chart_id ASC` as a non-emitted tie-breaker;
- notes within a chart: `created_at ASC`, then `note_id ASC` as a non-emitted tie-breaker; and
- Feedback: `created_at ASC`, then `feedback_id ASC` as a non-emitted tie-breaker.

The transaction commits after the complete stream is successfully produced. On repository, serialization, stream, timeout, or client-disconnect failure, it rolls back/releases the transaction and checked-out client. Read-only commit versus rollback has no product mutation semantics.

## 19. Account-deletion race semantics

Export and `DELETE /api/account` remain independent operations. Export does not reopen or change account-erasure architecture.

The race rules are:

- **Deletion commits before export establishes and verifies its snapshot:** the account root is absent. Export returns the bounded `401 UNAUTHORIZED` response and emits no export payload.
- **Export establishes and verifies its repeatable-read snapshot before deletion commits:** export may finish the internally consistent pre-deletion snapshot it was already authorized to read. Concurrent deletion may proceed and commit; export takes no deletion lock and does not deliberately block it.
- **Deletion and export overlap:** the repeatable-read snapshot prevents a partially deleted graph. Export observes either the authorized snapshot or no account, never a mixture assembled from independently timed reads.
- **After either outcome:** export writes nothing, creates no tombstone, restores no row, extends no session, and cannot resurrect deleted data.

A snapshot already being disclosed can outlive the database rows it represents. That is a consequence of a user-authorized read that began before deletion committed, not data resurrection. The downloaded file is then controlled by the user/browser, outside account erasure.

## 20. Response and download behavior

Successful response:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="natalnode-data-export-YYYY-MM-DD.json"
Cache-Control: no-store
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

Rules:

- `YYYY-MM-DD` is the UTC date component of the server-generated `exportedAt` value.
- The filename is ASCII, deterministic, and server-controlled.
- Email, birth data, account IDs, identity IDs, and other user content never appear in the filename.
- A streaming response normally omits `Content-Length`.
- The response does not set, clear, or rotate the session cookie.
- No redirect, signed URL, CDN URL, public object-store URL, or downloadable export token is introduced.
- No app-generated ZIP or alternate format is negotiated.

The download is successful only when the complete, valid JSON document is delivered. A truncated stream is not a successful export.

## 21. Size, memory, and streaming strategy

### Current volume audit

Repository truth provides some per-field/request limits:

- saved chart display name: at most 120 characters;
- chart note content: at most 5,000 characters;
- Feedback message: 10 through 5,000 characters;
- Feedback request body: at most 32 KiB.

These do not bound the whole account. Current persistence has no explicit hard cap on:

- saved chart count;
- note count per chart or account;
- lifetime Feedback submission count;
- tag count or individual tag length beyond being a string array;
- cumulative normalized-input or canonical-result JSONB size; or
- total serialized export size.

Therefore, materializing the complete export object and one giant JSON string in application memory is not the V1 direction.

### Approved direct-stream strategy

V1 streams one UTF-8 JSON document from the read-only repeatable-read snapshot. It does not create a background job, queue, ZIP file, temporary public object, or new dependency.

Implementation requirements:

- write only fixed JSON structure/framing directly;
- serialize every user-controlled or stored value with safe JSON serialization;
- never interpolate note, Feedback, tag, email, birth, or chart content into raw JSON text;
- read ordered rows in bounded keyset batches where collections may grow;
- keep memory proportional to a bounded batch plus the largest single stored value, not the entire account;
- respect stream backpressure;
- cancel database work and release the checked-out client promptly when the browser disconnects;
- apply bounded server/transaction execution time through deployment-appropriate configuration without changing export contents; and
- avoid `Content-Length` precomputation that would require a second full pass or whole-payload buffering.

The batch size and infrastructure timeout are implementation tuning values for WEB-PRIVACY-002B, not product schema. A technical timeout must produce a bounded failure; it must not silently omit later records and call the file complete.

No arbitrary retention/delete limit or account-content cap is invented for export. A future hard response cap would make “full account export” incomplete and therefore requires separate product/privacy/security approval and an explicit user-visible failure contract.

### Stream failure semantics

- Before success headers begin, failures use the bounded JSON error envelope.
- After streaming begins, the server aborts the response and rolls back/releases the read transaction. It must not append an error object into the export or close a syntactically valid but incomplete document.
- The future browser UX must treat a network/truncated download as failed and allow a user-initiated retry.
- No idempotency key is required because the endpoint is read-only and creates no server state.

### Resource-abuse boundary

WEB-PRIVACY-002B must add a focused account-export rate-limit policy using the existing bounded P0 rate-limit architecture:

- at most **5 started export attempts per authenticated account per 10 minutes**; and
- the existing trusted-edge/client-identity backstop remains applicable before authentication.

The account key must be internal and must not be logged. Rate limiting is resource protection, not authorization, and process-local rate state is not treated as a security authority.

## 22. Bounded error model

Before response streaming begins, the endpoint uses the current bounded error-envelope style:

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | The request contained a body, query string, selector, or otherwise violated the empty request contract |
| 401 | `UNAUTHORIZED` | Authentication is missing/invalid/expired, or the account root is absent when the snapshot is verified |
| 403 | `RECENT_AUTHENTICATION_REQUIRED` | The server-derived session creation time is older than the export policy permits |
| 429 | `RATE_LIMITED` | A bounded export resource limit was reached |
| 500 | `INTERNAL_ERROR` | Export could not safely begin or complete before streaming started |

Errors must not disclose SQL, row counts, database topology, account existence for a browser-selected target, secret values, internal identifiers, or which specific collection failed.

Once a `200` stream has begun, HTTP status cannot be replaced reliably. A later failure aborts the stream. The implementation must never generate a valid-looking partial JSON success document.

The task does not introduce RFC 9457, a repository-wide error redesign, export job polling, or a persisted retry token.

## 23. Logging and observability policy

Allowed operational fields are limited to:

- bounded event/endpoint family such as `account.export`;
- request ID;
- HTTP status/outcome family;
- duration; and
- a bounded rate-limit or internal-failure event without data-domain detail.

Logs, traces, metrics labels, analytics, and error reports must not contain:

- normalized email;
- birth data or normalized chart request;
- canonical chart result or scientific details;
- chart names, categories, tags, or favorite state;
- chart-note content;
- Feedback category or message;
- export payload or payload fragments;
- export byte size or row counts tied to a user/request;
- user, identity, chart, note, Feedback, session, or challenge IDs;
- session tokens, cookies, hashes, or Auth challenge data; or
- database query results or SQL errors.

The JSON response must never be logged. P0 adds no persistent “export requested” audit table. Privacy-access auditing is separate governance work and must not be smuggled into implementation.

## 24. Caching and privacy headers

Account export responses are sensitive personalized data.

V1 freezes:

- **NO SHARED CACHE**;
- `Cache-Control: no-store` on success and error responses through the existing API security-header middleware;
- no browser/application export cache;
- no CDN, reverse-proxy, service-worker, or object-store caching of the payload;
- no ChartResult scientific cache involvement;
- no Redis; and
- no export URL that remains reusable after the request.

The existing `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY` headers remain in force. TLS and the normal same-origin session-cookie controls remain mandatory deployment assumptions; this document does not redesign them.

## 25. Security invariants

Future implementation must preserve all of these invariants:

1. The authenticated server-side principal exclusively determines the export target.
2. The request has no arbitrary account selector.
3. No cross-account account, identity, chart, note, or Feedback data is emitted.
4. Recent authentication is evaluated from immutable server timestamps.
5. Auth session and challenge records are not exported.
6. Credential hashes, tokens, cookies, and password-equivalent material are never exported.
7. Provider, database, API, deployment, and server secrets are never exported.
8. Internal IDs may support owner-scoped queries but are not emitted.
9. Sensitive payload data is never logged, traced, measured as identifying labels, or sent to analytics.
10. Success and error responses are not stored in shared caches.
11. Export creates no mutation and changes no account, session, Vault, Feedback, or Auth state.
12. Stored chart facts are not recalculated or fetched from Engine/provider services.
13. JSON values are safely serialized; arbitrary user text cannot alter JSON structure or response headers.
14. The download filename is fixed, server-controlled, and contains no user data.
15. A repeatable-read snapshot prevents a partially deleted or cross-time relationship graph.
16. Stream failures cannot masquerade as complete success.
17. Export cannot restore, recreate, or resurrect deleted data.

## 26. Privacy invariants

Future implementation must preserve all of these invariants:

1. Meaningful user-owned persisted account data is included.
2. Current normalized sign-in email is included in a user-meaningful identity representation.
3. Persisted birth/chart request data is included.
4. The stored canonical chart snapshot and its stored calculation/provenance metadata are included without alteration.
5. All owner-linked private chart notes are included.
6. All owner-linked private Feedback is included even though standalone Feedback history UI may remain P1.
7. Security-only Auth artifacts are excluded.
8. Guest in-memory data is outside a server account export.
9. Public Sky and shared scientific/reference data are outside an account export.
10. Processor logs, infrastructure logs, and backups are not falsely represented as direct export content.
11. Export is optional and never a prerequisite for account deletion.
12. The export does not make legal portability, retention, or processor-completeness claims.

## 27. Future Account UX direction

WEB-PRIVACY-002C should add the smallest account-management UX at `/account`:

```text
Your data
Download your data
```

The control belongs alongside account-management capabilities but visually separate from **Danger Zone**. It does not belong in a Vault chart card, Calculate result, Feedback form, or another product surface.

UX requirements:

- one explicit user action starts the download;
- the real authenticated/re-authenticated flow is used;
- current page semantics and accessible status/error handling are preserved;
- a successful operation downloads the JSON file;
- a failed/truncated operation is presented as failed and can be retried by the user;
- the browser should use a native streaming download path where practical rather than retaining a second complete payload in JavaScript memory; and
- export does not sign the user out or change account data.

The Account UI may neutrally suggest downloading data before deletion. It must not require, auto-start, or claim completion of export before enabling deletion.

## 28. Bounded implementation phases

### WEB-PRIVACY-002B — Server implementation and focused security tests

- Add the export envelope types and safe serializers.
- Add the dedicated pool-owned repeatable-read, read-only export repository.
- Add bounded keyset streaming for the account graph.
- Add `POST /api/account/export` with empty-request validation.
- Reuse exact-Origin, session authentication, server time, bounded errors, security headers, and observability boundaries.
- Add an export-named 600-second recent-auth policy and focused rate limit.
- Add focused unit/integration tests for schema, completeness, secret exclusion, cross-account isolation, safe user text, consistency, deletion races, stream failures, and headers.
- Do not add UI, migrations, providers, Engine calls, queues, archives, or dependencies without a separately approved need.

### WEB-PRIVACY-002C — `/account` download UX

- Add **Your data / Download your data** outside Danger Zone.
- Handle start, recent-auth-required, bounded error, interrupted download, and success states.
- Preserve deletion as an independent optional action.
- Use real Auth only; no mock login or virtual authentication.

### WEB-PRIVACY-002D — Live verification if needed

- Verify against real PostgreSQL with multiple charts, notes, and Feedback.
- Verify live session/recent-auth behavior and cross-account isolation.
- Verify native browser download, filename, headers, cancellation, truncation failure, and bounded memory behavior.
- Verify account-deletion races with the existing erasure transaction.

None of these phases is implemented by WEB-PRIVACY-002A.

## 29. Policy decision register

| Decision | Technical recommendation | Security / privacy rationale | Blocks implementation? | Policy owner / dependency |
| --- | --- | --- | --- | --- |
| Normalized email in export | Include as `account.identities[].email` for the current Email Magic Link identity | It is user-meaningful account data; protect it as sensitive payload and never log/cache it | No, once this contract is reviewed | Product/privacy owns any later user-facing policy wording |
| Safe Auth metadata | Include identity type plus linked/update timestamps; exclude all sessions/challenges | Gives understandable account identity context without exposing credential infrastructure | No | Security reviews future identity presenters |
| Recent authentication | Require a server-derived session age no greater than 600 seconds; reuse the generic mechanism, not deletion semantics | Concentrated disclosure of email, birth data, charts, notes, and Feedback warrants step-up protection | No, once this contract is reviewed | Security owns threshold changes; product owns re-auth UX |
| Download filename | `natalnode-data-export-YYYY-MM-DD.json`, using server UTC date | Deterministic and useful without email, birth data, or internal IDs | No | Product owns future display wording; security owns filename safety |
| Future provider identities | Require an explicit reviewed user-safe presenter; never dump `provider_subject` | Provider subjects may be opaque, sensitive, or misleading | Yes, for that future identity type only | Security/privacy/product; `PROVIDER DECISION DEFERRED` |
| Third-party processor, backup, and legal disclosures | Keep operational logs/backups outside this direct download; describe them only in separately approved policy material | Avoids false completeness/retention claims and avoids exposing infrastructure | No for server implementation; may be a separate launch-policy gate | Privacy/legal/product, when concrete processors and policy text are reviewed |
| Hard total export-size cap | Do not add an arbitrary cap in V1; stream in bounded batches and fail explicitly on technical timeout | A silent/truncated cap conflicts with full-account semantics; current total account volume is not hard-bounded | No | Security/operations must review any future hard cap with product/privacy |

This register isolates decisions without inventing legal conclusions. Review of this technical contract is the next gate before runtime implementation.

## 30. Prohibited anti-patterns

The following implementations are explicitly prohibited:

- **A.** Returning a database dump as the account export.
- **B.** Accepting browser-supplied `userId`, `accountId`, `ownerId`, or email as export authority.
- **C.** Exporting another user's account, identity, chart, note, or Feedback data.
- **D.** Exporting session hashes or Email Magic Link challenge hashes.
- **E.** Exporting raw tokens, cookies, links, credentials, lock material, or secrets.
- **F.** Exporting server, API, database, deployment, or processor credentials.
- **G.** Recalculating, refreshing, repairing, or reinterpreting Vault charts during export.
- **H.** Calling the Engine or any provider during export.
- **I.** Omitting chart notes because they are considered secondary.
- **J.** Omitting owner-linked Feedback because standalone Feedback history UI is P1.
- **K.** Logging, tracing, analyzing, or persisting the export payload.
- **L.** Shared/public caching or routing through the ChartResult cache.
- **M.** Including email, birth data, account IDs, or other user content in the filename.
- **N.** Requiring export before account deletion.
- **O.** Adding a background job, queue, polling contract, or export database table without demonstrated need.
- **P.** Adding ZIP, CSV-bundle, PDF, HTML-archive, image, or proprietary-format dependencies without an approved need.
- **Q.** Exposing raw tables, column names, internal IDs, or database topology as the public schema.
- **R.** Reopening or weakening the existing account-erasure implementation.
- **S.** Inventing legal portability, processor, backup, deletion, or retention claims.
- **T.** Treating rate limiting as authorization.
- **U.** Sending a syntactically valid partial export after a stream failure.
- **V.** Adding mock login or bypassing recent authentication for local convenience.
- **W.** Expanding into scheduled Auth cleanup, retention enforcement, privacy-access auditing, RFC 9457 migration, ChartResult caching, observability redesign, Google Sign-In, Vault duplicate, Privacy/Terms copy, staging, or deployment.

This document authorizes no runtime source, test, migration, package, lockfile, deployment, provider, legal-copy, or Account UI change.
