# NatalNode Account Data Export V1

- **Status:** APPROVED TECHNICAL DIRECTION
- **Runtime implementation:** DEFERRED
- **Task:** WEB-PRIVACY-002A
- **Decision date:** 2026-08-27

This document freezes the P0 technical contract for **Download my data** / **Export my data**. It is an application-data disclosure contract, not legal copy, a database-dump specification, or an implementation.

### WEB-NOTIFY-001B2 additive notification metadata amendment

The account-owned Consumer notification state introduced by
`WEB-NOTIFY-001B2` is included as a privacy-minimized top-level `notifications`
section. The amendment contains only safe preference and subscription
metadata, remains owner-scoped inside the existing repeatable-read snapshot,
and never exports push endpoints, endpoint hashes, or browser push keys.

### WEB-PRACTITIONER-001 additive Practitioner metadata amendment

The account-owned Practitioner relationship is included as a privacy-minimized
top-level `practitioner` section. It contains the user's submitted application
fields, evidence URLs, status history, approved/revoked profile data, and
bounded profile-revision history. Reviewer identity, reviewer notes, retention
holds, and other reviewer-only fields are never exported.

### WEB-API-001B3B-R1 delivery revision

The browser delivery contract below supersedes the earlier single-request
assumption that a hidden iframe could both initiate the native attachment and
reliably expose pre-stream Problem Details to the parent page. A bounded
same-origin negotiation request now handles user-actionable preflight errors;
the existing native streaming request remains the attachment transfer target.
The negotiation response is advisory only and creates no capability, permit,
reservation, export snapshot, or persistent state. Runtime implementation is
deferred to `WEB-API-001B3B-R2`.

The fixed trust boundary remains:

```text
Browser / NatalNode.com
  -> same-origin Website API / BFF
  -> NatalNode Engine Public API (calculation only; not involved in export)
```

`PROVIDER DECISION DEFERRED.`

## Current launch-readiness implementation amendment

The original header records the contract's pre-runtime handoff state. The
current repository contains the reviewed account export schema `1.2`,
repeatable-read snapshot/stream implementation, safe notification metadata,
Feedback, and Practitioner presentation. It does not persist an export archive
and does not silently add Community, Foundations progress, assessment attempts,
Reward/commercial state, delivery history, or privacy-audit events. The current
launch-readiness scope decision and the historical Account Export matcher
correction are recorded in
[`NATALNODE_P0_EXTERNAL_GATE_DECISION_PACK_V1.md`](./NATALNODE_P0_EXTERNAL_GATE_DECISION_PACK_V1.md).

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
- the existing Consumer notification persistence foundation is linked to `users.user_id` and is included in export only through the reviewed safe metadata projection below.
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

### Security / feasibility review notes

WEB-PRIVACY-002A-R1 adversarially reviewed this contract against the current PostgreSQL pool/client ownership, Hono `4.13.4`, `@hono/node-server` `2.1.1`, Auth principal, exact-Origin, rate-limit, observability, Vault, Feedback, and account-erasure implementations.

The review confirmed the export scope, secret exclusions, JSON format, owner authority, `REPEATABLE READ READ ONLY` direction, and export/deletion race semantics. It also found material implementation gaps in the original wording and hardens them below:

- every deterministic security/representation check must finish before a streaming `200` response is constructed;
- direct streaming is retained, but transaction lifetime and simultaneous active exports are now explicitly bounded;
- Hono/Node backpressure and cancellation capabilities are source-verified, while live cancellation and connection-release behavior remain a WEB-PRIVACY-002D verification item;
- read-only transaction completion must occur before the final JSON delimiters are emitted;
- mid-stream errors are owned by the stream producer and must not reach Hono's default raw-error console path;
- legacy/unexpected persisted JSONB is exported safely and completely rather than reinterpreted or silently omitted; and
- generic request observability is not treated as proof that a streamed download completed.

With these corrections, the source architecture is ready for WEB-PRIVACY-002B. Live PostgreSQL, HTTP-stream, browser-download, cancellation, and deployment-edge behavior are not represented as verified by this documentation review.

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
| Consumer notification state | `notification_channel_preferences`, `notification_category_preferences`, `push_subscriptions` | `user_id -> users.user_id` | Account notification choices and safe subscription lifecycle metadata | `subscription_id`, endpoint, endpoint hash, `p256dh`, `auth`, `user_id` | A/B with credential fields C | Safe objects in top-level `notifications` collections; invalidated history may be retained as safe metadata | WEB-NOTIFY-001B2 |

No other account-linked persisted domain is in scope for this export. Billing,
Google-safe identity presentation, AI usage, export jobs, export audit, and
provider-owned scientific records remain outside this contract.

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
9. The account's safe Consumer notification preferences and PushSubscription
   lifecycle metadata, without browser push credentials.

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
- `email`: the normalized email already used as the identity subject, produced by the current Auth boundary's `trim()` plus lowercase normalization;
- `linkedAt`: the identity creation timestamp; and
- `updatedAt`: the identity update timestamp.

The normalized email is included because it is both user-meaningful and the current account's sign-in identity. The original casing and surrounding whitespace are not persisted and therefore cannot be reconstructed for export. The normalized value is sensitive personal data and receives the same no-log/no-cache handling as the rest of the export.

The public representation must not contain `user_id`, `identity_id`, or the generic storage name `provider_subject`. Future provider support must define an explicit presenter that exposes only meaningful, approved fields. It must never fall back to serializing an `auth_identities` row.

The schema currently reserves `GOOGLE`, but Google Sign-In and an approved Google identity export presenter are not part of current P0 runtime. Before constructing a success response, the export repository must query the snapshot for any identity whose provider lacks an approved presenter. If one exists, it must fail the complete export through the bounded internal-error path rather than silently omit the identity or dump its raw subject. A future identity-provider rollout must land its reviewed presenter and export-schema decision before it can persist that provider for users. This fail-closed preflight therefore prevents unsafe disclosure without making a correctly sequenced future rollout unexpectedly break export. `PROVIDER DECISION DEFERRED.`

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

Nesting preserves the chart relationship without exposing `note_id` or `chart_id`. The query must require both `note.user_id = authenticated user` and an owning chart whose `charts.user_id = authenticated user`. Querying by `chart_id` alone, or by the note's `user_id` without verifying the chart owner, is insufficient because the current schema has no composite constraint proving that both owner columns match.

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

### WEB-NOTIFY-001B2 Consumer notification metadata

The additive top-level export section is shaped as:

```json
{
  "notifications": {
    "channelPreferences": [
      { "channel": "WEB_PUSH", "enabled": true, "createdAt": "...", "updatedAt": "..." }
    ],
    "categoryPreferences": [
      { "category": "ACCOUNT", "enabled": false, "createdAt": "...", "updatedAt": "..." }
    ],
    "pushSubscriptions": [
      {
        "subscriptionId": "server-owned-id",
        "channel": "WEB_PUSH",
        "status": "ACTIVE",
        "createdAt": "...",
        "updatedAt": "...",
        "lastSuccessAt": null,
        "invalidatedAt": null
      }
    ]
  }
}
```

The export includes only the authenticated account's rows. Empty collections
remain empty arrays. `endpoint`, `endpointHash`, `p256dh`, and `auth` are never
selected by the export projection and never appear in the exported response.
The ordinary notification state API remains active-only; export may include
safe retained invalidated history because it is lifecycle metadata, not a
transport credential.

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
type JsonPrimitive = null | boolean | number | string;
type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

interface NatalNodeAccountDataExportV1 {
  readonly exportSchemaVersion: '1.2';
  readonly exportedAt: string;
  readonly account: {
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly identities: readonly EmailMagicLinkExportIdentityV1[];
  };
  readonly charts: readonly AccountChartExportV1[];
  readonly feedback: readonly FeedbackExportV1[];
  readonly notifications: NotificationsExportV1;
  readonly practitioner: PractitionerExportV1;
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
  readonly normalizedChartRequest: JsonValue;
  readonly canonicalChartResult: JsonValue;
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

interface NotificationsExportV1 {
  readonly channelPreferences: readonly NotificationChannelPreferenceExportV1[];
  readonly categoryPreferences: readonly NotificationCategoryPreferenceExportV1[];
  readonly pushSubscriptions: readonly NotificationPushSubscriptionExportV1[];
}

interface NotificationChannelPreferenceExportV1 {
  readonly channel: 'WEB_PUSH';
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface NotificationCategoryPreferenceExportV1 {
  readonly category: 'ACCOUNT' | 'SYSTEM' | 'ASTROLOGY_ALERT';
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface NotificationPushSubscriptionExportV1 {
  readonly subscriptionId: string;
  readonly channel: 'WEB_PUSH';
  readonly status: 'ACTIVE' | 'INVALIDATED';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSuccessAt: string | null;
  readonly invalidatedAt: string | null;
}

interface PractitionerExportV1 {
  readonly application: PractitionerApplicationExportV1 | null;
  readonly profile: PractitionerProfileExportV1 | null;
  readonly profileRevisions: readonly PractitionerProfileRevisionExportV1[];
}

interface PractitionerApplicationExportV1 {
  readonly requestedDisplayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly practiceStatement: string;
  readonly evidenceUrls: readonly string[];
  readonly consentToPublicProfile: true;
  readonly submittedAt: string;
  readonly status: string;
  readonly statusHistory: readonly {
    readonly status: string;
    readonly changedAt: string;
  }[];
  readonly finalizedAt: string | null;
  readonly purgeEligibleAt: string | null;
}

interface PractitionerProfileExportV1 {
  readonly practitionerId: string;
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly foundingPractitioner: boolean;
  readonly approvedAt: string;
  readonly profileStatus: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface PractitionerProfileRevisionExportV1 {
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly status: string;
  readonly submittedAt: string;
  readonly reviewedAt: string | null;
}
```

For records produced by the current application, `normalizedChartRequest` is expected to conform to `ChartRequest` and `canonicalChartResult` is expected to conform to `ChartResult`. The export authority, however, is the persisted JSONB snapshot—not whichever scientific parser happens to be current when the user downloads it.

PostgreSQL JSONB is syntactically valid JSON. If a legacy or unexpected stored request/result no longer conforms to current runtime contracts, V1 exports that safe persisted JSON value without scientific validation, normalization, repair, or omission. The exporter must still serialize it through a standard JSON serializer. If any persisted field cannot be safely represented or serialized, the entire export fails; no record is silently dropped and no repair pipeline is introduced.

An illustrative empty-account envelope is:

```json
{
  "exportSchemaVersion": "1.2",
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
  "feedback": [],
  "notifications": {
    "channelPreferences": [],
    "categoryPreferences": [],
    "pushSubscriptions": []
  },
  "practitioner": {
    "application": null,
    "profile": null,
    "profileRevisions": []
  }
}
```

All timestamps are server/storage-derived UTC ISO-8601 strings. `exportedAt` is generated once by the server when the repeatable-read snapshot is established; it is not accepted from the browser and is not a substitute for any record timestamp.

The top-level names are product-domain names, not raw table names. Data is not duplicated across sections. Empty collections are emitted as empty arrays rather than omitted.

## 14. Export schema versioning

`exportSchemaVersion` identifies the NatalNode account-export envelope. The
current additive V1.2 representation is the exact string `"1.2"`; it preserves
all V1.1 fields and adds the reviewed top-level `practitioner` section.

This is distinct from:

- `calculation.chartSchemaVersion`; and
- any schema version contained inside `canonicalChartResult`.

Version rules:

- compatible additive fields may advance the minor version after contract review; the Consumer notification metadata amendment advanced V1 from `1.0` to `1.1`, and the Practitioner metadata amendment advances it to `1.2`;
- removal, renaming, meaning changes, incompatible type changes, or nesting changes require a major version;
- a future identity type requires an explicit export presenter and a reviewed schema change;
- existing stored `ChartResult` values remain in their persisted scientific schema and are never upgraded merely because export schema changes; and
- the implementation must test the envelope version independently from scientific contracts.

A newly persisted account-owned application field does not automatically enter an existing export version. It remains intentionally omitted until a reviewed classification, explicit public presenter/schema field, compatibility decision, and focused coverage evolve this contract. Export code must select named fields and must never raw-spread a database row or generic persistence object. This forward-safe omission rule does not authorize omitting any field already approved by the current V1 inventory.

JSON object member order is not semantic, but the writer should emit a stable order for readability and deterministic verification. Array ordering is defined below.

## 15. API contract

Account export uses a two-stage browser delivery protocol. The stages have
different jobs and neither stage introduces a reusable export URL or a second
public payload format.

### Stage 1: bounded negotiation

The negotiation endpoint is:

```http
POST /api/account/export/prepare
```

This is a bounded, same-origin request made by the Account page with `fetch`.
It is an **advisory eligibility/preflight check only**. A successful response
does not authorize, reserve, or guarantee a later transfer. It creates no
export snapshot, PostgreSQL transaction, active-export capacity lease,
permit, token, export record, job, audit row, or other persistent state.

Stage 1 checks:

1. exact trusted-Origin enforcement;
2. the separate prepare edge/client rate-limit bucket;
3. session authentication and server-derived principal;
4. server-derived recent authentication; and
5. the exactly empty request framing and query contract.

It does not verify the account root, identity presenters, export
representation, PostgreSQL capacity, or export snapshot. Those checks belong
to Stage 2 and can fail after a successful negotiation.

Eligible Stage 1 response:

```http
HTTP/1.1 204 No Content
Cache-Control: no-store
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

The response has no body, `Content-Disposition`, account data, permit, token,
or completion claim. Route-owned Stage 1 failures use the canonical bounded
Problem Details contract for `400 INVALID_REQUEST`, `401 UNAUTHORIZED`,
`403 RECENT_AUTHENTICATION_REQUIRED` (and other applicable `403`), `429
RATE_LIMITED`, or `500 INTERNAL_ERROR`. Shared Origin/edge middleware may
retain its existing rejection representation during migration; the first-party
client must not depend on those shared middleware bodies.

The prepare request uses the same empty-request shape as the transfer:

```http
POST /api/account/export/prepare
```

Request contract:

- same-origin Website API/BFF endpoint;
- authenticated session cookie required;
- exact trusted Origin required through the existing unsafe-request policy;
- no request body;
- no query string;
- `Content-Length` may be absent or exactly `0`; any other, duplicate, malformed, or non-zero value is invalid;
- any `Transfer-Encoding` request header is invalid;
- no `Content-Type` is required, and a present `Content-Type` does not authorize non-empty content;
- `Accept: application/problem+json` may be sent by the bounded fetch client;
- no `userId`, `accountId`, `ownerId`, email, identity, export timestamp, format selector, or other account selector;
- no Engine or provider input; and
- repeated requests are independent read operations, not mutations.

The prepare route must reject any body byte, query component, body-framing
ambiguity, or account-targeting input as `INVALID_REQUEST`. Its request
handling is independently bounded and does not hold any export resource while
the client is waiting for the response.

### Stage 2: native transfer

The transfer endpoint remains:

```http
POST /api/account/export
```

After Stage 1 returns `204`, the page submits a native empty `POST` form to a
hidden iframe. The iframe is a **transfer target only**. The parent page must
never read or parse its body, and must not treat iframe load as proof that the
download completed. Stage 2 may also be called directly: Stage 1 is advisory
and creates no capability or evidence that Stage 2 must accept.

Stage 2 independently performs all authoritative work: exact Origin and
transfer edge checks, authentication, the authenticated-account transfer
attempt limit, recent authentication, empty-request validation, active export
capacity, the pool-owned read-only repeatable-read snapshot, account-root
verification, identity-presenter verification, and the account/identity
representation checks required before attachment headers.

The native form uses the same request framing as Stage 1 but sends no custom
headers. It has no body, query string, account selector, Engine input, or
provider input. Invalid framing is rejected before the stream is started. The
Stage 2 lifecycle deadline begins before body validation and covers the full
stream, backpressure, transaction end, and cleanup as defined below.

`GET` is not selected because sensitive cross-site-triggerable downloads would not reliably pass through the existing exact-Origin policy for unsafe methods. No public/admin multi-account variant is part of V1.

Stage 2 returns the streamed JSON attachment on success. Across both stages,
the protocol creates no export record, job, token, database mutation, or audit
row.

### Stage 2 pre-header gate

The Stage 2 implementation must complete all deterministic checks that can
choose a non-`200` response before constructing/returning the streaming
success response or emitting attachment headers:

1. apply API security headers and exact-Origin enforcement;
2. apply the trusted-edge/client-identity transfer rate-limit backstop;
3. authenticate the session and derive the principal;
4. apply the authenticated-account transfer-attempt limit;
5. evaluate recent authentication from server timestamps;
6. start the endpoint lifecycle deadline and validate the exactly empty body and exactly empty query component;
7. acquire active-export capacity;
8. check out one PostgreSQL client and begin the bounded read-only repeatable-read transaction;
9. establish the snapshot and verify the `users` root for the principal;
10. verify that every identity provider in the snapshot has the approved V1 presenter; and
11. prepare/validate the account and identity representation needed to start the envelope.

Stage 1 route-owned failures and Stage 2 pre-stream failures return bounded
Problem Details with no `Content-Disposition` attachment header. The Stage 2
native iframe is not an error API: the page does not rely on being able to read
those errors. Failures discovered only while reading later chart/note/Feedback
batches follow the mid-stream truncation rule.

## 16. Authentication and recent-auth policy

### Valid session

The existing server-side session authenticator is mandatory for both stages.
The request target comes from `AuthenticatedPrincipal.userId`, never browser
data. Missing, invalid, expired, or no-longer-account-backed sessions produce
the bounded unauthorized behavior. Stage 1 authentication is only an
eligibility signal; Stage 2 authenticates again and is authoritative for the
transfer.

### Recent authentication decision

V1 **requires recent authentication at both stages**.

This is an independent export risk decision, not an automatic inheritance from deletion. The export contains the normalized sign-in email, complete persisted birth inputs, chart snapshots, private notes, and private Feedback. A stolen but otherwise valid long-lived session would expose the account's concentrated sensitive data in one response. That benefit outweighs the limited passwordless re-authentication cost for this infrequent action.

The implementation may reuse the current immutable, server-derived `AuthenticatedPrincipal.sessionCreatedAt` mechanism and server clock. Browser time and a client countdown are never authorities.

The approved export maximum age is **600 seconds**. It is intentionally the same duration as the current deletion policy after independent evaluation, but export must have an export-named policy boundary rather than importing deletion semantics by accident. A shared generic recent-auth evaluator is acceptable; a deletion-specific policy constant is not the export contract.

If recent authentication is too old, either stage returns
`403 RECENT_AUTHENTICATION_REQUIRED`. Stage 1 does not reserve the recent-auth
decision, so Stage 2 must re-evaluate it immediately before export work.
Re-authentication must use the real Auth flow. This contract does not authorize
mock login, virtual authentication, or a local bypass.

## 17. Authorization and account isolation

Authorization invariants for every stage and read:

1. Authenticate the request.
2. Evaluate recent authentication from server timestamps.
3. Stage 1 performs no account-target selection beyond deriving the principal;
   it does not open an export snapshot.
4. Stage 2 begins the export snapshot and verifies the account root for
   `principal.userId` inside that snapshot.
5. Stage 2 roots identity, chart, note, and Feedback reads in that same
   `userId`.
6. Stage 2 requires both owner and parent-chart predicates for note reads.
7. Use internal IDs only inside the repository for joins, pagination, and
   tie-breaking.
8. Emit no data from rows that are not proven to belong to that principal.

The browser cannot choose an account. An email from a cookie-independent request value is not authority. A chart or note identifier alone is not authority. The normal user endpoint has no admin mode.

Focused implementation tests must prove that User A cannot receive User B account metadata, identities, charts, notes, or Feedback, including adversarial mixed-owner parent/child cases.

## 18. Snapshot and transaction model

Stage 1 may perform the existing bounded Auth persistence work required to
authenticate the session. In the current runtime, that is a short-lived
pool-backed lookup of the active `auth_sessions` row; it supplies the
server-derived `userId`, `createdAt`, and `expiresAt` values used to construct
the authenticated principal. This ordinary Auth access is allowed and is not
an Account Export transfer resource.

Stage 1 opens no Account Export snapshot or export transaction, does not hold a
dedicated PostgreSQL client across the browser round trip, and holds no export
resource while the browser transitions to Stage 2. It does not acquire an
active-export capacity lease, serialize export data, or persist negotiation
state.

Stage 2 uses one dedicated, pool-owned account-export repository that owns one
checked-out PostgreSQL client and one transaction for the complete export.

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

Each keyset query must continue lexicographically after the previous internal cursor—for example, `(created_at, chart_id) > ($cursorCreatedAt, $cursorId)`—with the same ascending `ORDER BY` tuple and a bounded `LIMIT`. Equivalent predicates are acceptable. Timestamp-only cursors are prohibited because timestamps can collide. Because every query uses the same repeatable-read snapshot, concurrent inserts/updates/deletes cannot create duplicate, missing, or cross-time pages. Cursor IDs remain internal and never enter the JSON.

Successful stream completion uses this order:

1. emit the envelope and every selected value except the final JSON closing delimiters;
2. execute `COMMIT` for the read-only transaction;
3. release the checked-out client and active-export capacity;
4. emit the fixed final delimiters that make the JSON document syntactically complete; and
5. close the response stream normally.

This ordering means a transaction-end failure cannot leave the browser with a syntactically complete export that the server simultaneously classified as failed. On repository, serialization, backpressure, timeout, or client-disconnect failure before commit, stop producing values, omit the final delimiters, roll back, and release resources. Read-only commit versus rollback has no product mutation semantics, but explicit `COMMIT` is the normal successful repository convention.

Cleanup is idempotent and owned by one stream-lifecycle boundary. If `ROLLBACK` or transaction-state cleanup fails, the client must be released with an error/discarded rather than returned to the pool in uncertain transaction state. No path may leave a checked-out client idle in transaction.

## 19. Account-deletion race semantics

Export and `DELETE /api/account` remain independent operations. Export does not reopen or change account-erasure architecture.

The race rules are:

- **Stage 1 succeeds and deletion commits before Stage 2 establishes its
  snapshot:** Stage 1 held no account snapshot or resource lease. Stage 2
  revalidates the principal and account root, observes the missing root, and
  returns bounded `401 UNAUTHORIZED` without an export payload.
- **Deletion commits before export establishes and verifies its snapshot:** the account root is absent. Export returns the bounded `401 UNAUTHORIZED` response and emits no export payload.
- **Export establishes and verifies its repeatable-read snapshot before deletion commits:** export may finish the internally consistent pre-deletion snapshot it was already authorized to read. Concurrent deletion may proceed and commit; an ordinary PostgreSQL MVCC read does not take the account-erasure advisory lock or a row lock and does not require deletion to wait for export.
- **Deletion and export overlap:** the repeatable-read snapshot prevents a partially deleted graph. Export observes either the authorized snapshot or no account, never a mixture assembled from independently timed reads.
- **After either outcome:** export writes nothing, creates no tombstone, restores no row, extends no session, and cannot resurrect deleted data.

A snapshot already being disclosed can outlive the database rows it represents. That is a consequence of a user-authorized read that began before deletion committed, not data resurrection. The downloaded file is then controlled by the user/browser, outside account erasure.

The tradeoff is that PostgreSQL must retain row versions needed by the open snapshot until export ends. The active-export concurrency gate and hard transaction deadline below bound that vacuum/MVCC pressure; export must not add a separate erasure/export coordination service.

## 20. Response and download behavior

Successful Stage 1 response:

```http
HTTP/1.1 204 No Content
Cache-Control: no-store
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

It has no body, attachment header, account data, token, permit, or completion
claim. It only signals that the Account page may start the native Stage 2
transfer; Stage 2 remains authoritative.

Successful Stage 2 response:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="natalnode-data-export-YYYY-MM-DD.json"
Cache-Control: no-store
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

Stage 2 rules:

- `YYYY-MM-DD` is the UTC date component of the server-generated `exportedAt` value.
- The filename is ASCII, deterministic, and server-controlled.
- Email, birth data, account IDs, identity IDs, and other user content never appear in the filename.
- A streaming response normally omits `Content-Length`.
- The response does not set, clear, or rotate the session cookie.
- No redirect, signed URL, CDN URL, public object-store URL, or downloadable export token is introduced.
- No app-generated ZIP or alternate format is negotiated.

The server can establish response status and produce a complete document, but
it cannot prove that a browser retained the file. A transfer is complete only
when the browser receives the complete valid JSON document; a truncated stream
is not a successful export, even if HTTP status `200` was emitted before the
failure. The initiating page does not read the hidden iframe body and therefore
must not claim download completion from iframe load or the `200` status alone.

`Content-Security-Policy` is not added specifically for this non-rendered JSON attachment. The existing API security headers, attachment disposition, JSON content type, `nosniff`, exact Origin, authentication, and no-store boundary are the relevant controls.

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

Stage 1 is not a stream and has no snapshot, capacity lease, serialization
work, or export payload. It is a bounded eligibility response only.

Stage 2 streams one UTF-8 JSON document from the read-only repeatable-read
snapshot. It does not create a background job, queue, ZIP file, temporary
public object, or new dependency.

**Streaming verdict: KEEP STREAMING.** Whole-account materialization is not safe because collection counts and cumulative JSONB size are materially unbounded. Direct streaming is feasible in the installed runtime: Hono's streaming writer awaits a `TransformStream` writer, and the installed Node adapter pauses Web-stream reads when the Node response crosses its writable high-water mark until `drain`. The adapter also cancels the response reader when the outgoing response closes/errors; Hono exposes that cancellation through `StreamingApi.onAbort`.

That source capability is necessary but not sufficient by itself. Hono's current streaming `write()` catches writer failures, and an asynchronous stream callback executes after the route has already returned its `Response`. The preferred implementation is therefore a small pull-driven native `ReadableStream`/async-iterator body whose `pull` advances at most one serialized chunk and whose `cancel` signals the shared producer cleanup. This preserves adapter backpressure while keeping error/cancel propagation explicit. Hono's helper may be used only if focused tests prove equivalent behavior through `onAbort` and explicit cancellation state. The producer must not rely on a rejected Hono helper `write()`, route-level `app.onError`, or Hono's default stream callback logging for cleanup or safe error handling.

Implementation requirements:

- write only fixed JSON structure/framing directly;
- pass **every user-controlled value through a standard JSON serializer**; this includes email, names, categories, tags, birth/request JSON values, result JSON values, notes, and Feedback;
- never interpolate note, Feedback, tag, email, birth, or chart content into raw JSON text;
- read ordered rows in bounded keyset batches where collections may grow;
- keep memory proportional to a bounded batch plus the largest single stored value, not the entire account;
- await each stream write so downstream backpressure limits further database reads/serialization;
- use one-row or byte-aware chart batches because one row contains complete JSONB snapshots; ordinary bounded row-count batches are acceptable for notes, identities, and Feedback;
- stop scheduling new queries/serialization when the browser disconnects, then end the transaction and release the checked-out client;
- bound pool checkout with the existing PostgreSQL `connectionTimeoutMillis`/`DATABASE_CONNECTION_TIMEOUT_MS` configuration, set to a positive value shorter than the endpoint deadline; do not begin checkout unless the remaining deadline exceeds that configured timeout, and if an additional application race can lose first, attach cleanup that immediately releases any client delivered afterward;
- bound an in-flight PostgreSQL query with transaction-local `statement_timeout`, because the current `pg` query interface does not accept the response cancellation signal;
- use a transaction-local `idle_in_transaction_session_timeout` as a database backstop, while treating the application lifecycle as the primary cleanup owner; and
- avoid `Content-Length` precomputation that would require a second full pass or whole-payload buffering.

The P0 application deadline is **120 seconds**, measured with a monotonic server clock from immediately before empty-request stream validation until final stream completion or cleanup. It includes request-stream validation, pool wait, preflight, all snapshot queries, serialization, downstream backpressure waits, transaction end, and cleanup. `statement_timeout` and `idle_in_transaction_session_timeout` must be finite and configured not to outlive the remaining application deadline. The exact batch sizes and shorter per-statement timeout are WEB-PRIVACY-002B tuning values, not export schema. Timeout produces a bounded pre-header failure or a truncated mid-stream failure; it must never silently omit records and call the file complete.

No arbitrary retention/delete limit or account-content cap is invented for export. A future hard response cap would make “full account export” incomplete and therefore requires separate product/privacy/security approval and an explicit user-visible failure contract.

### Stream failure semantics

- Before Stage 2 success headers begin, failures use bounded Problem Details;
  Stage 1 route-owned failures use the same canonical error contract through
  the normal fetch response.
- After streaming begins, any internal error, deadline, or cancellation stops production, omits the fixed final delimiters, and ends the transport as a truncated/invalid JSON document. It must not append an error object, attempt a second response, or synthesize a syntactically complete partial export.
- The stream producer catches raw errors before they reach framework default logging, emits at most a bounded non-sensitive failure event, and performs idempotent cleanup.
- A cancellation callback may initiate cleanup, but the producer's shared `finally`/cleanup promise remains authoritative so asynchronous abort subscribers cannot race a second rollback/release.
- The future browser UX must treat a network/truncated download as failed and allow a user-initiated retry.
- No idempotency key is required because the endpoint is read-only and creates no server state.

### Resource-abuse boundary

The two stages use distinct rate-limit semantics within the existing bounded
P0 rate-limit architecture:

- Stage 1 uses a separate prepare edge/client-identity bucket, initially at
  most **20 prepare requests per 10 minutes** per trusted-edge/client identity.
  A prepare request does not consume an authenticated-account transfer
  attempt and does not reserve capacity.
- Stage 2 retains the transfer edge/client-identity backstop and allows at
  most **5 started transfer attempts per authenticated account per 10 minutes**.
  One Stage 2 request counts as one transfer attempt whether or not it was
  preceded by Stage 1; a normal click is not charged twice to the same account
  export quota.
- Shared edge/origin middleware may reject before a route-owned Problem Details
  response is selected. The first-party client must not depend on those shared
  response bodies.

Attempt rate limiting alone does not bound simultaneous long-lived snapshots.
P0 therefore requires a simple process-local active-export gate for Stage 2
only:

- at most **2 active export transactions per server process**;
- at most **1 active export per authenticated account per server process**;
- active-capacity rejection occurs before PostgreSQL checkout and returns bounded `429 RATE_LIMITED` with `Retry-After`;
- the account key is an ephemeral process-local HMAC-derived value, not a raw logged/persisted identifier;
- the gate is released exactly once on pre-header failure, normal completion, timeout, cancellation, or cleanup failure;
- runtime configuration must provide a PostgreSQL pool maximum of at least **4**, preserving at least two pool slots for ordinary application work while both export slots are occupied; and
- the existing PostgreSQL connection-timeout setting must be positive and shorter than the endpoint deadline, and checkout must not begin when less time remains, so a queued checkout cannot outlive lifecycle cleanup.

No distributed lock, permit, token, or database export-state row is
introduced. In a multi-process deployment, each process enforces its own
active cap; the trusted-edge and account attempt limits remain the
cross-request abuse backstops. Stage 2 is authoritative on whichever process
receives it. Rate limiting and concurrency gating are resource protection,
never account authority.

## 22. Bounded error model

Stage 1 is the user-actionable error channel. Its route-owned failures use
canonical Problem Details that the top-level Account page can read through its
bounded `fetch` request:

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | The prepare request contained a body, query string, selector, or otherwise violated the empty request contract |
| 401 | `UNAUTHORIZED` | Authentication is missing, invalid, expired, or no longer account-backed |
| 403 | `FORBIDDEN` | Exact trusted-Origin enforcement failed before route execution, when owned by the route |
| 403 | `RECENT_AUTHENTICATION_REQUIRED` | The server-derived session creation time is older than the export policy permits |
| 429 | `RATE_LIMITED` | The prepare edge limit or another route-owned negotiation limit was reached |
| 500 | `INTERNAL_ERROR` | Negotiation could not safely complete without exposing internal details |

Stage 2 uses the same canonical Problem Details contract for route-owned
pre-stream failures, including:

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | The transfer request violated the empty request contract |
| 401 | `UNAUTHORIZED` | Authentication is missing/invalid/expired, or the account root is absent when the snapshot is verified |
| 403 | `FORBIDDEN` | Exact trusted-Origin enforcement failed before route execution, when owned by the route |
| 403 | `RECENT_AUTHENTICATION_REQUIRED` | The server-derived session creation time is older than the export policy permits |
| 429 | `RATE_LIMITED` | Transfer edge/account attempt limits or active-export capacity were reached |
| 500 | `INTERNAL_ERROR` | Export could not safely begin, including snapshot/preflight failure or an unsupported identity presenter |

Errors must not disclose SQL, row counts, database topology, account existence for a browser-selected target, secret values, internal identifiers, or which specific collection failed.

The Stage 1 client may classify only the bounded status/top-level `code` it
receives from its fetch response. It must not require `title`, `detail`, or a
legacy nested `error` member. Stage 2 errors may be canonical on the wire, but
the native hidden iframe is a transfer target and the initiating page does not
read or parse its body; its UI therefore uses generic transfer-start/error
semantics rather than pretending to classify the response.

Once the Stage 2 `200` stream has begun, HTTP status cannot be replaced
reliably. A later failure truncates the stream without final delimiters; no
second JSON error response is attempted. The implementation must never
generate a valid-looking partial JSON success document.

The revised protocol does not introduce export job polling, a permit, a
persisted retry token, a second payload envelope, or a repository-wide error
redesign beyond the separately frozen Problem Details migration.

## 23. Logging and observability policy

Allowed operational fields are limited to:

- bounded event/endpoint family `account.export.prepare` or `account.export`;
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

The current Hono request middleware records `api.request.completed` when the
route returns its `Response`, before a streaming body necessarily finishes.
For Stage 1, `204` means **negotiation response initiated**, not transfer
authorization or download success. For Stage 2, the record means **transfer
response initiated with the recorded HTTP status**, not “the browser received
a complete export.” Neither event is a data-rights completion audit or success
proof.

Errors raised inside the asynchronous stream producer do not reliably pass through `app.onError`. The producer must catch them, avoid framework/default `console.error(error)` paths, and emit at most a bounded non-sensitive stream outcome such as `completed`, `cancelled`, `timed-out`, or `failed`. Raw error objects, messages, stacks, causes, SQL, and query parameters must not be serialized into operational output.

## 24. Caching and privacy headers

Both account-export stages concern sensitive personalized data or access to its
delivery.

V1 freezes:

- **NO SHARED CACHE**;
- `Cache-Control: no-store` on Stage 1 and Stage 2 success and error responses through the existing API security-header middleware;
- no browser/application export cache;
- no CDN, reverse-proxy, service-worker, or object-store caching of the payload;
- no ChartResult scientific cache involvement;
- no Redis; and
- no export URL that remains reusable after the request.

The existing `Referrer-Policy: no-referrer`, `X-Content-Type-Options:
nosniff`, and `X-Frame-Options: DENY` headers remain in force for both stages.
The top-level page uses fetch for Stage 1, so no framing exception is needed;
the Stage 2 iframe is only a transfer target. TLS and the normal same-origin
session-cookie controls remain mandatory deployment assumptions; this document
does not redesign them.

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
18. Stage 1 has no snapshot, capacity lease, permit, or success guarantee; Stage 2 independently completes every deterministic origin, request, Auth, rate/capacity, account-root, identity-presenter, and transaction check before success headers.
19. Keyset cursors use timestamp plus internal-ID tie-breakers inside one snapshot; cursor IDs are never emitted.
20. At most two export transactions are active per process and at most one per account/process.
21. A 120-second monotonic deadline, bounded pool checkout, and database-local timeouts bound request-stream validation, snapshot lifetime, queries, backpressure, and cleanup; a late checkout can never leak its client.
22. Cancellation stops new work and always ends/discards the transaction client; no connection remains idle in transaction.
23. Successful `COMMIT` and client release occur before the final JSON delimiters are emitted.
24. Stream errors are caught inside the producer and never enter raw framework logging.
25. The Stage 2 hidden iframe is never used as a Problem Details reader, and
    the page never claims transfer completion from its load event or `200`
    status alone.

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

- one explicit user action starts the bounded Stage 1 negotiation;
- a successful Stage 1 `204` starts the native Stage 2 form submission to the
  hidden iframe;
- Stage 1 `401`, `403`, `400`, and route-owned `429` responses can be mapped by
  the top-level page using status plus top-level Problem Details `code`;
- Stage 2 remains a native transfer target and its iframe body is never read;
- the UI may say negotiating, starting, initiated, failed, or retryable, but
  must not claim that a download completed from the `204`, iframe load, or
  `200` status alone;
- the real authenticated/re-authenticated flow is used;
- current page semantics and accessible status/error handling are preserved;
- a successful transfer delivers the JSON file through the native browser
  download path;
- a failed/truncated operation is presented as failed and can be retried by the user;
- the browser should use a native streaming download path where practical rather than retaining a second complete payload in JavaScript memory; and
- export does not sign the user out or change account data.

The Account UI may neutrally suggest downloading data before deletion. It must not require, auto-start, or claim completion of export before enabling deletion.

## 28. Bounded implementation phases

### WEB-API-001B3B-R2 — Browser-compatible two-stage delivery and Problem Details migration

This is the next bounded implementation slice for the revised delivery
contract. It should:

- add `POST /api/account/export/prepare` as a bounded same-origin negotiation
  endpoint returning `204` on advisory eligibility only;
- add the top-level Account-page fetch client for Stage 1 Problem Details
  status/code handling;
- retain `POST /api/account/export` as the native empty-form streaming transfer
  and revalidate every authoritative Stage 2 gate;
- remove the hidden-iframe body/error parser and never use fetch/blob for the
  export payload;
- keep Stage 1 stateless, with no permit, token, export snapshot, capacity
  lease, or persistent state; and
- add focused route/client tests for the two stages, TOCTOU/deletion races,
  rate semantics, native transfer behavior, and post-header truncation.

It must not begin live PostgreSQL/browser/deployment verification, add a
provider or Engine integration, or expand into `WEB-API-001B4`.

### WEB-PRIVACY-002B — Server implementation and focused security tests

- Add the export envelope types and safe serializers.
- Add the dedicated pool-owned repeatable-read, read-only export repository.
- Add bounded tuple-keyset streaming for the account graph, with one-row/byte-aware chart batches.
- Add the authoritative Stage 2 `POST /api/account/export` with empty-request validation and native streaming.
- Reuse exact-Origin, session authentication, server time, bounded errors, security headers, and observability boundaries.
- Add an export-named 600-second recent-auth policy, the separate prepare and transfer edge limits, the transfer account-attempt limit, and the two-global/one-account process-local active gate for Stage 2.
- Add the 120-second lifecycle deadline, transaction-local statement/idle timeouts, cancellation signal, idempotent transaction cleanup, and poisoned-client discard behavior.
- Validate all pre-header gates before constructing the stream; commit before emitting the final JSON delimiters.
- Add focused unit/integration tests for schema, completeness, secret exclusion, cross-account isolation, safe Unicode/user text, legacy JSONB, unsupported identities, tuple-keyset collisions, consistency, deletion races, backpressure, cancellation, deadline, pool-checkout timeout/late resolution, pool-capacity rejection, cleanup, stream failures, and headers.
- Do not add UI, migrations, providers, Engine calls, queues, archives, or dependencies without a separately approved need.

### WEB-PRIVACY-002C — `/account` download UX

- Add **Your data / Download your data** outside Danger Zone.
- Start with Stage 1 fetch negotiation, then submit the native Stage 2 transfer; handle recent-auth-required, bounded negotiation errors, interrupted transfer, and generic transfer-start states without claiming download completion.
- Preserve deletion as an independent optional action.
- Use real Auth only; no mock login or virtual authentication.

### WEB-PRIVACY-002D — Live verification if needed

- Verify against real PostgreSQL with multiple charts, notes, and Feedback.
- Verify live session/recent-auth behavior and cross-account isolation.
- Verify repeatable-read behavior during concurrent chart/note/Feedback mutations and account deletion.
- Verify large JSONB streaming, tuple-keyset collision behavior, backpressure, the 120-second deadline, and bounded process memory.
- Verify native browser attachment handling, filename, cancellation, invalid truncation on failure, no-store behavior through the actual edge, and no second response after headers.
- Verify every completion/cancellation/failure path ends the PostgreSQL transaction, releases or discards the client, and releases active-export capacity.

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
| Direct-stream resource controls | 120-second deadline; two active exports/process; one/account/process; PostgreSQL pool maximum at least four; positive connection timeout shorter than the endpoint deadline | Bounds connection starvation, late-checkout leaks, long MVCC snapshots, slow clients, and concurrent heap pressure without deleting or omitting user data | No | Security/operations may lower concurrency or timeout only through a reviewed contract change |
| Browser delivery protocol | Stage 1 advisory `POST /api/account/export/prepare` with fetch and `204`; Stage 2 native empty-form `POST /api/account/export` to a hidden iframe; no permit or persistent state | Makes user-actionable Problem Details browser-readable while preserving native streaming and X-Frame-Options `DENY`; Stage 2 remains authoritative | No, once R1 is reviewed | Security/privacy/product; implementation is `WEB-API-001B3B-R2` |

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
- **X.** Returning the streaming response before all deterministic pre-header gates and identity-presenter checks finish.
- **Y.** Using timestamp-only keyset pagination or emitting internal cursor IDs.
- **Z.** Emitting the final JSON delimiters before the read-only transaction commits and its client is safely released.
- **AA.** Holding an export transaction without the 120-second deadline, database timeout backstops, and active-export gate.
- **AB.** Relying on Hono's swallowed stream-write errors, generic `app.onError`, or raw default console logging for cancellation/error cleanup.
- **AC.** Continuing database reads or serialization after response cancellation.
- **AD.** Returning a PostgreSQL client to the pool when rollback/transaction state is uncertain.
- **AE.** Silently omitting malformed, legacy, or future account-owned fields, or raw-spreading newly added database columns into the public export.
- **AF.** Reusing the Stage 2 hidden-iframe response body as the Account page's Problem Details API.
- **AG.** Treating a Stage 1 `204` as authorization, a transfer guarantee, a permit, or a capacity reservation.
- **AH.** Charging a normal prepare-plus-transfer click twice to the same account export-attempt quota.
- **AI.** Relabeling Problem Details as `text/html` or weakening global `X-Frame-Options: DENY` to make an iframe parser work.

This document authorizes no runtime source, test, migration, package, lockfile, deployment, provider, legal-copy, or Account UI change.

## 31. Source verification, live verification, and readiness

### Source / architecture verified

- the current migrations contain the complete audited account-linked graph;
- all approved V1 source fields exist and all current credential/security fields remain excluded;
- PostgreSQL `REPEATABLE READ READ ONLY` provides one coherent MVCC snapshot for account, identity, chart, note, and Feedback reads;
- the existing pool runtime can own a dedicated checked-out-client repository like account erasure;
- the existing pool environment/configuration boundary supports a finite `connectionTimeoutMillis` for both queued checkout and new connections;
- current Hono/Node source provides awaited Web-stream backpressure, Node writable `drain` handling, response-reader cancellation, and Hono abort notification;
- exact-Origin middleware covers `POST` and precedes route execution;
- `SessionRequestAuthenticator` hashes the configured session cookie and uses
  the pool-backed `PostgresAuthSessionRepository.findActiveByTokenHash` lookup;
  that lookup returns the server-persisted `userId`, `createdAt`, and
  `expiresAt` values used to construct the principal;
- `requireAuthentication` stores that principal in the request context, and
  the export recent-auth policy compares its immutable `sessionCreatedAt` with
  the server clock;
- `AuthenticatedPrincipal.sessionCreatedAt` and the server clock support the frozen recent-auth policy;
- the existing process-local HMAC limiter can support account attempt keys without persisting or logging raw user IDs; and
- export requires no write, migration, Engine call, provider dependency, archive dependency, or account-erasure redesign.

### Browser feasibility boundary

`WEB-API-001B3B-R1` accepted the focused browser result that invalidates the
earlier single-request error-reader assumption. In the selected Chromium-based
browser (Chrome 151 user agent), a native POST reached the temporary same-origin
fixture server. A pre-stream `application/problem+json` response remained an
unreadable/empty iframe navigation under `X-Frame-Options: DENY`; changing the
control to `SAMEORIGIN` did not make that Problem Details body readable. A
`text/html` control was readable only when anti-framing was removed, while
`text/html` plus `DENY` was blocked. This is evidence for the delivery contract,
not production deployment verification. It confirms that the security header
must not be weakened and that Stage 1 must carry actionable error handling.

### Live PostgreSQL / HTTP stream not yet verified

`WEB-API-001B3B-R1` did not run production PostgreSQL or the repository HTTP
server. `WEB-PRIVACY-002D` must verify the actual repeatable-read snapshot,
large JSONB behavior, backpressure, cancellation propagation, query timeout,
transaction/client cleanup, active-gate cleanup, export/delete overlap,
browser attachment handling across supported browsers, and edge no-store
behavior. Those live checks remain a separate verification boundary; they do
not authorize changing the delivery contract or weakening anti-framing
security.

### Readiness decision

The prior single-request hidden-iframe Problem Details assumption is retired.
The revised two-stage protocol is ready for the bounded runtime implementation
review, while runtime and deployment behavior remain deferred.

```text
WEB-API-001B3B-R2 READY
```
