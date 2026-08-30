# NatalNode Notification Platform Technical Contract V1

| Field | Value |
|---|---|
| Status | **PASS / CONTRACT AMENDMENT CLOSED / APPROVED TECHNICAL CONTRACT / B3 IMPLEMENTED LOCALLY / B4A FROZEN / B4B1 IMPLEMENTED LOCALLY / B4B2 IMPLEMENTED LOCALLY / B4B3 IMPLEMENTED LOCALLY / B4B3-R1 PASS / CONCURRENCY & SECURITY REVIEW CLOSED / B4B4 PASS / LOCAL POSTGRESQL INTEGRATION ACCEPTANCE CLOSED / LIVE WEB PUSH DELIVERY NOT IMPLEMENTED** |
| Task | `WEB-NOTIFY-001B4A-R1` |
| Reviewed baseline | `9d188bbe491d5f4038e49fe920cacd720c9a8d33` (`docs: define web push delivery contract`) |
| Date | 2026-08-29 |
| Scope | Consumer Web Push delivery, durable outbox, retry, and VAPID contract |
| Initial channel | Web Push, standards-based and provider-neutral |
| Production astronomy/provider | `PROVIDER DECISION DEFERRED` |
| Deployment | `PAUSED` / future external gates remain open |

This document freezes the technical/product boundary for the NatalNode
notification platform. B1 remains the local Consumer/account-owned
persistence foundation; B2 provides the authenticated Consumer Web Push
registration, removal, preference, and safe-export API boundary; B3 adds only
the local Account Notifications settings surface, explicit permission flow,
dedicated Service Worker, browser subscription choreography, server-owned
public-key capability, bounded payload/click handling, and safe account
switching behavior. B4A now freezes the Consumer delivery, outbox, retry,
fan-out, transport, and server-only VAPID contract, with the R1 amendment
  closing the remaining concurrency and database-shape ambiguities but adding
  no implementation.
Private VAPID credential management, workers, schedulers, migrations, live
delivery, payments, provider decisions, and Developer operational-notification
implementation remain deferred. This is an implementation handoff and product
foundation contract, not a legal notice, retention schedule, billing decision,
or production-readiness claim.

The platform deliberately separates:

    why an event exists
        -> whether the account is eligible
        -> whether the user wants it
        -> when it should be delivered
        -> which channel delivers it
        -> how the transport sends it

The fixed system boundary remains:

    NatalNode.com
        -> Website API / BFF
        -> NatalNode Engine Public API

No notification design in this document changes that boundary.

## 1. Scope

This contract covers the future website-owned notification domain and its
provider-neutral delivery boundary:

- bounded notification intent and type/category vocabulary;
- entitlement/eligibility separation from user preferences;
- owner-bound browser Push API subscriptions;
- user-initiated Web Push permission UX;
- a bounded service-worker responsibility;
- privacy-minimized payload and lock-screen behavior;
- durable outbox/delivery contract and bounded delivery state;
- deduplication, retry, invalid-subscription, and abuse boundaries;
- interaction with Auth, Account Settings, Account Export, Account Deletion,
  retention, Privacy Access Audit, and operational observability;
- public-development, deployment, live-browser, and credential gates; and
- bounded future implementation slices.

The initial delivery channel is Web Push. Email may be added later through a
separate channel adapter without changing intent, eligibility, preference,
planner, or outbox concepts. This is not a general messaging framework.

## 2. Current repository reality and bounded review

The following authoritative documents were read in full:

- `docs/PRD.md`;
- `docs/ARCHITECTURE.md`;
- `docs/product/NATALNODE_P0_READINESS_CHECKPOINT_V1.md`;
- `docs/product/NATALNODE_DATA_RETENTION_V1.md`;
- `docs/product/NATALNODE_PRIVACY_ACCESS_AUDIT_V1.md`; and
- `docs/product/NATALNODE_OBSERVABILITY_V1.md`.

The minimum relevant implementation boundaries inspected were:

- `server/src/app/auth/authenticated-context.ts`,
  `server/src/app/auth/require-authentication.ts`, and
  `server/src/app/auth/session-request-authenticator.ts`;
- `server/src/app/routes/auth-session.ts`;
- `server/src/app/routes/account.ts` and
  `server/src/app/routes/account-export.ts`;
- `apps/web/src/pages/account.astro` and
  `apps/web/src/features/auth/auth-session-control.ts`;
- `apps/web/src/features/vault/vault-management-client.ts`;
- `server/src/persistence/persistence-repositories.ts` and the current
  PostgreSQL adapters;
- `server/src/runtime/create-server-runtime-dependencies.ts` and
  `server/src/runtime/bootstrap/create-server-bootstrap.ts`;
- `server/src/executable/public-development-dependencies.ts`,
  `server/src/executable/public-development-config.ts`, and
  `server/src/executable/run-public-development-composition.ts`;
- `server/src/app/security/enforce-same-origin-unsafe-api-requests.ts`;
- `server/src/app/security/api-rate-limiting.ts`;
- `server/src/app/observability/api-request-observability.ts`;
- `server/src/maintenance/auth-lifecycle-maintenance.ts`;
- `apps/web/astro.config.mjs`, `apps/web/package.json`, the static
  Astro layout/pages, and existing browser-client patterns; and
- `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md` and
  `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`.

Current findings relevant to notifications:

- The authenticated principal is server-derived and contains `userId` and
  immutable `sessionCreatedAt`. Browser input is not an ownership authority.
- Auth uses an opaque session cookie. `GET /api/auth/session` reports
  server-owned state. The current Account page provides export and deletion,
  but no notification settings surface.
- Account Export is a bounded repeatable-read stream with no server archive.
  Account Deletion is an authenticated active-database transaction with
  owner-linked cascades. B2 adds only safe, owner-scoped notification metadata
  to the export; raw PushSubscription credentials remain excluded.
- Persistence uses typed repositories, PostgreSQL adapters, and numbered
  migrations. Runtime dependencies are composed at the bootstrap/executable
  boundary, not through global mutable state.
- Public-development uses Mock Engine, has no PostgreSQL or email
  infrastructure, and fails unsupported authenticated operations closed. It
  must not require push credentials, notification storage, a worker, or a
  browser permission prompt.
- Unsafe API mutations already use exact same-origin enforcement. Existing
  rate limiting is process-local P0 staging protection, not a production
  traffic or delivery SLA policy.
- Operational observability has one canonical bounded request-completion record.
  It is separate from Privacy Access Audit and excludes account, chart,
  credential, endpoint, and user-content data.
- The committed B1 foundation provides typed Consumer notification primitives,
  owner-scoped preferences, and account-owned PushSubscription persistence. B2
  provides authenticated account routes, safe metadata presentation, and safe
  Account Export projection. B3 now provides the Account Notifications UI,
  explicit user-gesture permission flow, root-scoped Service Worker, browser
  registration/removal choreography, server-owned public capability, and
  bounded click/payload policy. No private VAPID credential is configured, and
  no delivery worker, durable scheduler, or Developer operational-notification
  infrastructure exists. B4B2 adds only the server-internal readiness and
  transport foundation; B4A freezes the remaining future boundary. The only
  scheduler-like boundary is the short-lived Auth lifecycle maintenance
  executable; it is not notification infrastructure.
- The Web application is a static Astro artifact with React islands. B3 adds
  one narrow root-hosted notification Service Worker; it does not add a
  web-manifest, fetch/cache layer, offline behavior, or background delivery
  worker.
- The accepted deployment direction uses one browser-visible origin with static
  Astro content and `/api` traffic owned by the Website API/BFF. HTTPS,
  service-worker scope, credentials, background execution, and live browser
  acceptance are future gates.

The separate `C:\\NatalNode` repository was not accessed. No provider
decision is made here.

## 3. Product motivation

Future paid NatalNode products are expected to include proactive notification
features. A durable, provider-neutral notification platform is therefore a
subscription foundation, not a reason to reopen the historical P0 readiness
conclusion.

The platform should provide proactive events while preserving:

- Engine/application ownership of scientific facts and future triggers;
- explicit opt-in browser behavior rather than surprise permission prompts;
- future gating of bounded notification types by paid entitlements;
- separation of transport from billing, astronomy, and account policy; and
- minimized content because lock-screen and browser surfaces may be shared.

## 3A. Consumer and Developer notification domains

NatalNode Platform has two distinct product notification domains. They may
eventually share lower-level delivery infrastructure, but they do not share a
high-level recipient, entitlement, or business-policy model by default.

### Consumer notifications

**Consumer Notifications** are NatalNode.com product notifications for an
authenticated human account. Future concerns may include:

- astrology alerts;
- daily or personal sky updates;
- saved-chart reminders; and
- account or product messages.

The initial proactive Consumer channel is `WEB_PUSH`. Consumer notification
eligibility may eventually consume Consumer entitlement, but it remains
separate from Notification Platform delivery and preference enforcement.

### Developer operational notifications

**Developer Operational Notifications** are operational communications for the
NatalNode Developers hosted commercial API product. Future concerns may
include:

- quota or usage thresholds;
- billing;
- security;
- incidents;
- API deprecations; and
- maintenance.

These events may originate from an organization, project, API key,
subscription/usage system, or security/operations system. They are not
semantically equivalent to Consumer astrology or product notifications.

The event subject or context must be distinguished from the eventual human
recipient. For example:

    organization quota threshold reached
        -> future Developer notification policy
        -> authorized recipient member(s)
        -> channel preference/policy
        -> delivery

The organization is context for the event; it is not a browser
`PushSubscription` owner. Recipient resolution, authorization, member scope,
and policy are deferred. They must not be hard-coded to the Consumer
account-preference model, and no organization schema, role, or member
permission is defined here.

Developer operational channels may later include `DASHBOARD`, `EMAIL`,
optional `WEB_PUSH`, and future `WEBHOOK` or integration channels. This is a
direction only, not a frozen full channel enum, and it does not add `EMAIL` or
another channel to the B1 Consumer code.

No final Developer policy defaults are selected. In particular, billing or
security is not declared always-on, and no quota threshold such as 80% is
declared default-on. Mandatory-versus-optional behavior remains a future
Subscription/Developer product decision.

### B1 classification and additive evolution

`WEB-NOTIFY-001B1` is explicitly the **CONSUMER / ACCOUNT-OWNED WEB PUSH
FOUNDATION**. Its `ownerId`, `notification_channel_preferences`,
`notification_category_preferences`, `push_subscriptions`,
`ACCOUNT`/`SYSTEM`/`ASTROLOGY_ALERT` categories, and `WEB_PUSH` preference
are interpreted only inside this Consumer/account-owned scope.

The existing B1 schema and domain remain valid as the Consumer foundation.
`users(user_id)` remains the ownership root, and a Consumer
`PushSubscription` remains human-account scoped. No migration rollback,
organization ownership rewrite, table rename, or B1 code rewrite is required
to add a future Developer notification domain additively.

The current account-owned `NotificationIntent` is sufficient for Consumer
notification work; it is not required to become a universal supertype for
Developer operational events. A future Developer domain may reuse safe
lower-level primitives or define an organization-context intent that later
converges at delivery planning. Its high-level business-policy persistence
does not need to be unified with B1.

The existing account-owned PushSubscription persistence may later serve as a
delivery credential for an authenticated human recipient, including a
Developer member, when future Developer recipient policy resolves that member
to the same NatalNode account. This does not make an organization the owner or
change the B1 account-ownership rule.

The likely shared lower-level direction is:

    Consumer notification intent
    or Developer operational notification intent
        -> recipient resolution
        -> preference/policy
        -> shared delivery planner/outbox/channel adapter where compatible

Shared delivery infrastructure is acceptable. Shared business-policy schema
is not required.

Notification Platform remains separate from Billing Platform. Consumer
eligibility may consume Consumer entitlement, while Developer operational
policy may consume Developer subscription, usage/quota, or security/operations
state. Notification Platform is not the billing authority, and no Stripe or
other provider logic belongs here.

Future Subscription/Entitlement design must support independent product
families such as `CONSUMER` and `DEVELOPER` without making them mutually
exclusive. This contract freezes no plan names, prices, quotas, or billing
periods.

### B1 lifecycle and privacy distinction

Deleting a user removes that user's current B1 Consumer notification
preferences and PushSubscriptions through the existing account cascade.
Future Developer organization/member semantics may require separate
reassignment or organization-level operational-history decisions and are not
resolved here.

B2 adds only safe Consumer preference and PushSubscription metadata to Account
Export. Raw endpoint and credential fields are excluded. Future Developer
operational membership or configuration may have different export semantics;
no Developer export rule is frozen here.

No numeric retention duration is selected. Developer operational notification
history may have different retention requirements from Consumer preference and
PushSubscription state; future policy must treat them separately where
necessary.

Developer operational data such as organization names, API keys, quota
details, billing identifiers, or security-sensitive operations data must not
enter ordinary notification observability without a separately approved
bounded metadata contract.

**DEVELOPER OPERATIONAL NOTIFICATION DOMAIN — CONTRACT REQUIRED BEFORE
IMPLEMENTATION.** That future contract must resolve organization/project
context, member recipient resolution, authorization, channel policy,
mandatory-versus-optional messages, billing/security semantics, quota
threshold behavior, Account/Organization deletion, export/privacy, retention,
and operational ownership.

`WEB-NOTIFY-001B1-R1` should verify that the current persistence is safely
account-scoped, does not claim Organization ownership, does not turn the
current categories into a permanent universal Developer taxonomy, keeps
PushSubscription ownership human-account scoped, and permits future Developer
recipient resolution without rewriting active-endpoint security. B1-R1 is a
review criterion, not executed by this amendment.

## 4. Non-goals

This contract does not authorize:

- Stripe, another billing provider, plans, prices, checkout, subscriptions,
  webhooks, or an entitlement database;
- an astrology trigger engine, transit semantics, astronomy calculations,
  chart facts, provider selection, or access to `C:\\NatalNode`;
- a Web Push vendor, Firebase, Google notification service, OneSignal, Pusher,
  AWS SNS, or a specific npm Web Push library;
- live Web Push delivery, private VAPID key generation or management, a
  provider, or any automatic permission request;
- an in-app inbox/history for the initial Web Push foundation;
- arbitrary user-controlled title/body/URL dispatch;
- quiet hours, a delivery timezone, birth-chart timezone reuse, or a
  cron/cloud scheduler choice;
- a general queue, messaging bus, PWA/offline rewrite, or large localization
  framework; or
- runtime source, tests, migrations, dependencies, deployment configuration,
  P1/P2/P3 features, or unrelated UI in `WEB-NOTIFY-001B4A`.

## 5. Architecture

The conceptual architecture is:

    Trigger producer / application event
        -> Notification Intent
        -> Eligibility / entitlement decision
        -> User preference decision
        -> Delivery planner
        -> Durable notification delivery / outbox job
        -> Channel adapter
        -> Web Push transport
        -> Browser Push API / Service Worker

| Layer | Authority | Must not own |
|---|---|---|
| Trigger producer | Why a logical event exists | Transport, permission, or billing |
| Intent | Recipient, bounded type, references, delivery identity | Push endpoints, keys, provider payloads, arbitrary text |
| Eligibility | Whether the account/product may receive the type | User preference or browser permission |
| Preference | Whether the owner enabled the category/channel | Billing entitlement or astronomy trigger semantics |
| Planner | Whether and when delivery should be attempted | Provider-specific send behavior |
| Outbox/job | Durable state, retry, idempotency | Product meaning or arbitrary dispatch |
| Channel adapter | Maps an intent to a bounded channel message | Billing, trigger logic, account ownership |
| Transport | Protocol/provider interaction and sanitized outcome | Notification policy or account selection |

Focused modules and typed boundaries are sufficient. Do not create a generic
enterprise messaging framework before a real second channel justifies it.

## 6. Notification intent model

The internal provider-neutral intent is a server-created record describing why
a notification could exist. Its conceptual fields are:

    interface NotificationIntent {
      readonly intentId: string;
      readonly recipientAccountId: string;
      readonly category: NotificationCategory;
      readonly type: NotificationType;
      readonly createdAt: string;
      readonly deliverAt?: string;
      readonly dedupeKey?: string;
      readonly reference?: BoundedServerReference;
    }

The exact future TypeScript names may follow repository conventions. The rules
are frozen:

- identity, timestamps, and dedupe identity are server-created/resolved;
- category and type come from the bounded registry in section 7;
- `deliverAt` is a planning value, not a user timezone or a delivery promise;
- `reference` is optional, bounded, server-generated, and type-specific. It
  is not a generic user-supplied JSON map and must not contain ChartRequest,
  ChartResult, birth data, credentials, or provider response;
- dedupe identity is not a scientific ID, provider ID, endpoint, browser key,
  or transport message ID; and
- intent creation does not mean eligible, enabled, scheduled, delivered, or
  visible.

Transport fields must be absent: no Web Push endpoint, `p256dh`, `auth`,
VAPID material, browser subscription object, Firebase token, email provider
payload, or arbitrary rendered content.

## 7. Notification type/category model

Notification vocabulary is a finite server-owned registry. Production APIs must
reject or safely ignore arbitrary type strings supplied by untrusted callers.

V1 reserves these bounded categories:

    ACCOUNT
    SYSTEM
    ASTROLOGY_ALERT

The registry rules are:

- category is bounded and versioned by application code or approved contract;
- each category may have a finite set of server-owned types;
- `ASTROLOGY_ALERT` is reserved only; `B4A` freezes no astrology alert,
  transit event, aspect meaning, timing rule, or scientific trigger;
- no type is active merely because its category exists;
- activation requires a source-grounded product decision, server-owned
  content/template behavior, eligibility policy, and privacy review as needed;
- unknown values never fall through to arbitrary push content.

The registry is a notification vocabulary, not an astronomy schema. It must not
contain provider names, engine generations, scientific IDs, chart facts, or
user-entered labels.

## 8. Engine and trigger boundary

The notification platform does not calculate astronomy. A future application or
Engine-facing producer may make a bounded trigger decision:

    NatalNode Engine / approved application logic
        -> bounded trigger decision
        -> Notification Intent
        -> notification platform

The platform handles eligibility, preferences, planning, delivery, and
transport. It does not derive planets, signs, houses, aspects, retrograde
state, transits, chart timezones, or interpretation facts, and it does not call
an astronomy provider directly.

`ASTROLOGY_ALERT` is `ENGINE/TRIGGER-GATED` until a separate contract
defines producer semantics. No transit semantics are invented here.

## 9. Eligibility and entitlement model

A future application boundary is conceptually equivalent to:

    interface NotificationEligibilityService {
      isEligible(input: {
        readonly accountId: string;
        readonly notificationType: NotificationType;
      }): Promise<boolean>;
    }

Its contract is frozen:

- it answers whether trusted product/account context may receive a bounded type;
- it consumes entitlement state from a future product/billing boundary;
- it does not know endpoints, VAPID keys, browser permission, or transports;
- it does not accept a browser-supplied account ID or entitlement decision; and
- false or unavailable eligibility fails closed for delivery.

The platform does not freeze `FREE`, `PRO`, `PREMIUM`, or any other plan.
No price, plan, subscription table, checkout, webhook, or billing provider is
selected. `Notification Platform != Billing Platform`.

For proactive Consumer Web Push, B4A freezes the following fail-closed gate:

    trusted eligibility answer = true
    AND owner channel preference = true
    AND owner category preference = true
    AND at least one ACTIVE owner-bound PushSubscription exists

All four conditions are required at planning time. The worker revalidates the
owner, preferences, eligibility hook, and target subscription immediately
before transport. `null` is not an opt-in and is not silently converted to
either boolean value. Browser permission is capability state; an owner-bound
ACTIVE subscription is the server-side delivery prerequisite.

## 10. User preference model

Preferences are owner-scoped state and are distinct from entitlement. V1 keeps
the model small:

- global Web Push enabled/disabled state; and
- a bounded category preference for each exposed category.

A conceptual shape is:

    preferences[account].webPush.enabled
    preferences[account].categories[boundedCategory].enabled

The B1 Consumer implementation uses normalized account-scoped persistence for
these two preference classes. Each preference has three effective states:

- `null`: no explicit preference is stored; the UI presents `Not set`;
- `false`: explicitly Off; and
- `true`: explicitly On.

For proactive delivery, only `true` satisfies the channel/category gates.
`null` and `false` both prevent enqueue/send. No hidden default opt-in is
created, and `ACCOUNT` or `SYSTEM` is not treated as implicitly mandatory.
Do not add quiet hours, device-fingerprint, birth-timezone, or speculative
flags without a concrete requirement. Broader Developer policy and channel
preferences require their own future contract.

If local-time scheduling is later required, it needs a separate user
delivery-timezone contract and must not reuse a birth-chart timezone.

## 11. Initial delivery channels

Web Push is the only initial proactive channel:

    Notification Platform -> Web Push channel adapter -> Web Push transport

Email may be added later through a separate channel adapter. No SMS, in-app
inbox, mobile push, email provider, or third-party notification service is
selected by this contract.

## 12. Web Push transport boundary

The channel adapter must call a narrow provider-neutral boundary. B4A freezes
the conceptual shape; it is server-internal and is not a public API:

    interface WebPushTransport {
      send(input: {
        readonly subscription: {
          readonly endpoint: string;
          readonly p256dh: string;
          readonly auth: string;
        };
        readonly payload: WebPushPayloadV1;
      }): Promise<WebPushTransportOutcome>;
    }

The adapter is constructed with the already-validated server-only VAPID
configuration. A single attempt receives only the endpoint credentials and the
immutable bounded payload required for one Web Push send. It does not receive
an account ID, birth data, chart data, preference state, entitlement state,
raw event data, or an arbitrary provider payload.

For the current Consumer Web Push categories (`ACCOUNT`, `SYSTEM`, and
`ASTROLOGY_ALERT`), every transport attempt must request `TTL: 3600` seconds
(one hour) from the remote Push Service. Web Push TTL is the maximum retention
period requested after that service accepts a send. It is not NatalNode outbox
or database retention, retry delay or retry horizon, worker lease duration,
browser display/expiration behavior, guaranteed provider retention, or a
guaranteed delivery time; the Push Service may discard the notification
earlier. The value is fixed in the server transport, is not caller-, API-,
template-, browser-, or subscription-configurable. No per-category or
per-template TTL is defined, and the value remains `3600` for each separate
retry attempt. It is separate from the maximum five attempts and the 24-hour
retry horizon.

If a Push Service accepted a notification before a local channel Disable,
category Off, PushSubscription removal, or account deletion committed,
NatalNode cannot recall that remote notification. The one-hour TTL limits but
cannot eliminate that residual external-delivery window. The final-send
serialization contract still prevents new server-side transport attempts after
the relevant local authority mutation has committed; it does not claim remote
recall, exactly-once delivery, browser-enforced expiry, or deletion from third-
party Push Service infrastructure.

The bounded outcome classes are:

| Outcome | Meaning at the transport boundary | Delivery handling |
|---|---|---|
| `ACCEPTED` | The upstream protocol accepted the send request | Mark this target `DELIVERED`; this is not proof of display/read |
| `SUBSCRIPTION_INVALID` | Endpoint-specific evidence says the subscription is gone, expired, or its subscription credentials are invalid | Invalidate only that ACTIVE PushSubscription and stop this target |
| `THROTTLED` | Upstream asks the sender to slow down | Retry within the bounded policy |
| `TRANSIENT_UPSTREAM` | Bounded upstream/server failure with no invalid-subscription proof | Retry within the bounded policy |
| `TIMEOUT_AMBIGUOUS` | The attempt outcome is unknown after the local timeout | Retry as at-least-once-style work; a duplicate is possible |
| `PAYLOAD_INVALID` | The locally generated payload failed the adapter boundary | Mark terminal; do not invalidate the subscription |
| `CONFIGURATION_UNAVAILABLE` | The server-only VAPID configuration is absent, malformed, or mismatched | Worker is not ready; do not send or invalidate |
| `PERMANENT_FAILURE` | A bounded non-subscription failure cannot succeed by retry | Mark terminal; do not invalidate |

The adapter must map protocol/library details into these classes, preserve no
raw response body, and never promote transport-specific errors into public API
errors. `SUBSCRIPTION_INVALID` may be returned for 404/410-style endpoint
expiration and for 401/403-style subscription rejection only when the adapter
can attribute the evidence to that subscription; a sender-wide VAPID failure
is configuration/permanent failure instead. The boundary remains independent
from Stripe, Firebase, Google services, hosting providers, Web Push vendors,
and any specific npm library.

Local malformed persisted subscription material is not remote evidence that a
browser subscription expired. The B4B2 adapter therefore classifies that
boundary failure as `PERMANENT_FAILURE` and reserves `SUBSCRIPTION_INVALID`
for bounded remote endpoint evidence; B4B2 does not invalidate subscriptions.

No dependency is added now. Future selection criteria are standards support,
VAPID, payload encryption, Node/ESM compatibility, minimal dependency surface,
bounded error behavior, and active maintenance.

## 13. Push subscription model

A Push API subscription is an owner-bound delivery credential, not an account
selector. The future record is conceptually:

    subscriptionId
    ownerAccountId
    endpoint
    p256dh
    auth
    createdAt
    updatedAt
    lastSuccessAt              (optional, if justified)
    state: ACTIVE | INVALIDATED
    invalidatedAt              (optional)

The B1 Consumer implementation realizes this model with account-owned
`push_subscriptions` persistence. Any future Developer credential or recipient
policy must preserve the distinction between a human account's delivery
credential and an organization's event context. The frozen rules are:

- `endpoint`, `p256dh`, and `auth` use Push API terminology and are
  stored only for the server transport boundary;
- one authenticated account owns a record; multiple subscriptions may belong
  to that account;
- same-owner re-registration may refresh validated material without creating
  unbounded duplicates;
- no browser/device fingerprint, user-agent, IP, location, or speculative
  device metadata is added; and
- endpoint equality is not proof of account identity or permission.

Settings show only safe state, never the record or keys.

## 14. Push credential sensitivity

`endpoint`, `p256dh`, and `auth` are security/privacy-sensitive delivery
credentials. They must not appear in:

- operational logs, metrics labels, traces, or error messages;
- Privacy Access Audit events;
- raw Account Export output;
- URLs, query strings, notification payloads, or browser-visible settings;
- client debug output or HTML data attributes; or
- unauthorized support/review responses.

The browser may receive only public material required by the standards-based
subscription flow. VAPID/private signing/authentication material is server-only:
never commit, return, log, store in a notification record, or expose it to the
service worker. `B4A` creates no keys, secrets, or environment variables.

At-rest protection, database grants, backups, and rotation are later
security/operations/deployment decisions. They must not be replaced by a fake
local success state.

### 14.1 B4A private VAPID boundary

Live Web Push delivery requires a complete server-only configuration. The
conceptual runtime names are:

| Configuration | Required meaning | Exposure |
|---|---|---|
| `NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY` | Existing canonical base64url-encoded uncompressed P-256 public key (65 decoded bytes, `0x04` prefix) | May contribute to the browser capability response |
| `NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY` | New conceptual server configuration: canonical base64url-encoded P-256 private scalar (32 decoded bytes) | Server secret only |
| `NATALNODE_WEB_PUSH_VAPID_SUBJECT` | RFC 8292 subject/contact URI, bounded and validated as an approved `https:` or `mailto:` URI without credentials, query, or fragment | Server configuration only; never logged |

The names above define the future configuration boundary; B4A does not add
environment variables or a secret store integration. The public and private
keys are one pair: startup/readiness validation must derive the uncompressed
public point from the private scalar and compare its canonical encoding with
`NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY`. Length checks alone are insufficient.
The private scalar must be a valid non-zero P-256 scalar, and all three values
must be present together for delivery readiness. There is no generated,
fallback, or fake private key.

Delivery readiness has two fail-closed outcomes:

- `UNCONFIGURED`: no complete delivery configuration is supplied; and
- `INVALID_CONFIGURATION`: a supplied value is malformed, incomplete, or the
  public/private relationship does not match.

When a delivery worker is started, either outcome makes the worker unready and
prevents it from claiming or sending jobs. A runtime serving ordinary API
traffic may continue with delivery unavailable, but it must not claim live
delivery readiness. Configuration failures are reported only as a bounded
operational code; secret values, key material, subject values, parse details,
and library/provider errors are redacted. A later implementation may choose a
deployment-specific readiness endpoint, but it must not expose the private
configuration or turn a public capability response into a secret-bearing
diagnostic.

The existing public `webPushCapability.configured` field keeps its B3 meaning:
it reports only that the browser application-server public key is structurally
valid. B4A does not change that public API or require private delivery config
for browser capability. Complete private configuration is represented by a
separate server-internal delivery-readiness boundary. Thus a browser may see
a usable public key while the delivery worker remains unavailable; the
planner/worker must fail closed in that state.

Private VAPID material must remain in approved server secret configuration and
must never enter API responses, rendered HTML, browser bundles, the Service
Worker, database rows, Account Export, logs, metrics, traces, ordinary
observability, or Privacy Access Audit events. Hosted push providers and
provider-managed VAPID keys are not selected.

## 15. Subscription ownership and CSRF boundary

Registration, replacement, unsubscribe, and preference mutations require an
authenticated NatalNode account. The server derives ownership from the
authenticated principal. Requests never choose `userId`, `accountId`, or another
owner in a body or URL.

Future unsafe API mutations preserve:

- exact canonical `Origin` checking;
- secure/SameSite session-cookie policy for the environment;
- server-side authentication before ownership decisions; and
- existing bounded rate-limit middleware, with notification-specific policies
  selected later from real traffic needs.

This same-origin boundary is the minimum CSRF defense. If a route-specific
security review requires a server-issued CSRF token, it must be a narrow
additional decision; it cannot replace authentication or permit client-selected
ownership. No new token mechanism is chosen here.

Anonymous permanent PushSubscriptions are not supported for P0. Missing or
failed authentication fails closed without creating a record.

## 16. Cross-account endpoint behavior

An endpoint may appear in browser state for different application accounts over
time. The safe ownership rule is:

- an endpoint has at most one active NatalNode owner;
- endpoint equality never proves two accounts are the same person;
- a new account registration never auto-transfers an endpoint owned by another;
- an already-owned endpoint returns a bounded non-identifying conflict/unavailable
  result and does not reveal the old account; and
- explicit authenticated unsubscribe/release under the old account must occur
  before another account registers it.

No endpoint-only takeover, administrative guess, or automatic transfer is
allowed. Same-owner re-registration may refresh validated material.

## 17. Account switching behavior

The browser must not silently carry old-account push authorization into a new
account. The expected lifecycle is:

1. While the old account is active, request server-side unsubscribe/release and
   clear the browser PushSubscription where supported.
2. Sign out or change account context.
3. Require new authenticated, user-initiated opt-in and a server ownership check.
4. If cleanup fails or the endpoint remains owned, deliver nothing to the new
   account and keep registration unavailable without revealing the old owner.

The implementation must tolerate browser close, lost connectivity, and changing
subscriptions. It prefers no delivery over cross-account delivery.

## 18. Permission UX

Permission is never requested automatically:

- not on page load or first visit;
- not after login without explicit user action; and
- not as a side effect of opening settings.

The frozen direction is:

    authenticated user gesture
        -> NatalNode explanatory/soft-permission UI
        -> browser Notification permission request
        -> Push API subscription attempt, if supported and opted in

The explanatory UI is not the browser prompt. It must explain that browser
settings control the final permission and NatalNode cannot override denial.
Registration is initiated by the same explicit settings action or a closely
related user action. No silent background subscription is created.

## 19. Permission-state behavior

| State | Expected behavior |
|---|---|
| `default` / not asked | Explain Web Push and show opt-in; do not request until user acts |
| `granted` | Continue a user-initiated flow if Push API and authentication are available |
| `denied` | Show unavailable/blocked guidance; do not repeatedly prompt or harass |
| `unsupported` | Keep ordinary NatalNode usage functional; show unavailable without fake success |

Permission state is browser state, not entitlement, preference, or proof of a
server subscription. Granted permission with no valid owner-bound subscription
is not deliverable. Denied/unsupported browsers must not break ordinary product
use.

## 20. Service-worker boundary

The future service worker has one narrow role:

1. receive a push event;
2. validate a bounded server-owned payload;
3. display a browser notification; and
4. handle a click by navigating to an approved same-origin path.

It must not calculate/interpret astronomy, authenticate or choose an account,
mutate ownership, accept arbitrary title/body/URL, become a general offline/PWA
rewrite, add caching merely because it exists, call providers/billing/Engine,
or expose credentials.

The payload validator fails closed on unknown types, unexpected fields,
oversized values, malformed paths, and missing required fields.

B4A does not change this browser boundary. A delivery record may contain only
the server-owned V1 payload that the existing worker accepts; the worker does
not receive a template key, delivery state, attempt diagnostics, endpoint, or
VAPID material.

## 21. Notification-click/navigation policy

A notification action may navigate only to a server-generated or explicitly
allowlisted application path on the same origin. It may not accept arbitrary
external URLs, schemes, hostnames, query payloads, or redirect targets.

The click handler validates the path before opening it. Missing or invalid paths
fall back to a safe same-origin location or do nothing; they never open an
external target. Open redirects are prohibited.

## 22. Push payload and lock-screen privacy model

A future message contains only what is required to render a safe notification,
conceptually:

    bounded notification type
    server-owned short title
    privacy-minimized short body
    safe internal navigation path (optional)

Content is server-generated from bounded templates, not arbitrary user text.
Full ChartRequest, ChartResult, planetary positions, signs, houses, aspects,
interpretation, birth data, account details, email, provider responses, and
sensitive event data are not sent merely because push exists. Payloads contain
no endpoint, keys, VAPID material, or provider credential. The normative
delivery payload is the existing Service Worker-compatible shape:

    {
      version: 1,
      title: string,       // non-empty, at most 80 Unicode characters
      body: string,        // non-empty, at most 160 Unicode characters
      path?: string        // approved same-origin path, at most 256 characters
    }

The path is optional in the durable representation and falls back to `/` only
through the existing worker policy. Unknown keys, control characters, unsafe
paths, and oversized values are rejected before persistence. This is a
lock-screen-safe content budget, not permission to include personal chart or
birth information.

Data needed only after opening a protected page is fetched through the normal
authenticated application boundary. Lock screens/shared devices make minimized
content the default; richer content needs later product/privacy approval.

## 23. Server-side content authority and templates

Production dispatch is server-authoritative. Callers may request a bounded type
or create an approved intent, but may not submit arbitrary title, body,
navigation URL/path, or provider payload.

Each active type is backed by an application-owned template registry identified
by a bounded `templateKey` and integer `templateVersion`. The registry accepts
only a type-specific, server-generated bounded reference and renders the V1
payload before the enqueue transaction. B4A chooses to persist that immutable
rendered safe payload together with the template identity. Retries therefore
reuse exactly the same content even if application templates later change,
and no private event variables need to be reloaded or retained for retry.
Template identity is diagnostic metadata, not browser content. `ASTROLOGY_ALERT`
has no active template or trigger in this task; no astrology notification
content is invented.

The server-owned type/template boundary prevents push-spam relay behavior and
allows future localization without coupling transports to English text.
Template inputs are bounded and type-specific. Localization follows a
source-grounded user/application locale policy; no locale persistence or
translation system is invented here.

No general arbitrary-push API or user-facing test-push endpoint is authorized.

## 24. Delivery scheduling boundary

Intent creation and delivery scheduling are separate:

    trigger creates intent
        -> planner evaluates deliverAt and current gates
        -> outbox records an attemptable delivery

`deliverAt` is an optional server-side planning value. It is not a user
timezone, a browser timestamp, or a delivery promise. B4A freezes no cron,
cloud scheduler, database scheduler, queue vendor, or deployment topology.
Whatever later invokes the worker is operations-owned and must preserve the
bounded claiming, retry, multi-instance safety, and observability rules below.

No quiet hours or user-local schedule is defined. Birth-chart timezone is never
a generic notification delivery timezone.

## 25. Durable outbox and delivery model

`WEB-NOTIFY-001B4A` freezes a two-level PostgreSQL-owned model. One durable
logical `notification_intents` row represents the server-owned Consumer event;
one `notification_deliveries` row represents one attempted destination
subscription. The delivery rows are the outbox jobs. B4A does not create either
table or change migration `0008_notification_persistence_foundation.sql`.

The transaction boundary is:

    trusted trigger
        -> typed intent/enqueue service
        -> eligibility + preference + ACTIVE-subscription gate
        -> render and validate immutable safe payload
        -> insert one intent and one delivery per ACTIVE subscription
        -> commit
        -> separate worker claims delivery rows
        -> final owner/preference/subscription revalidation
        -> WebPushTransport

If any planning gate is false, null, unavailable, or has no ACTIVE owner-bound
subscription, the enqueue operation creates no intent or delivery rows and
returns a bounded not-enqueued result. A later subscription does not replay an
old event unless a separate product policy explicitly requests that behavior.

### 25.1 Proposed future PostgreSQL migration shape

The following is the implementation contract, not executable SQL. Names may
follow repository conventions, but the invariants may not be weakened.

`notification_intents` is proposed with:

| Field | Contract |
|---|---|
| `intent_id` | Opaque server-generated primary identifier |
| `owner_id` | Consumer account owner; `NOT NULL`, foreign key to `users(user_id)` with `ON DELETE CASCADE` |
| `category` | `ACCOUNT`, `SYSTEM`, or `ASTROLOGY_ALERT` only |
| `channel` | `WEB_PUSH` only in this Consumer slice |
| `notification_type_key` | Server-owned bounded registry key; never an arbitrary client string |
| `template_key`, `template_version` | Server-owned template identity, immutable for this intent |
| `payload_version`, `payload_json` | Immutable validated V1 safe payload; no credentials or raw event data |
| `dedupe_key` | `NOT NULL` bounded opaque typed event identity supplied by a trusted producer; it contains no raw private event data |
| `deliver_at` | Server-side planning timestamp; no user timezone semantics |
| `created_at`, `updated_at`, `completed_at` | Creation/update timestamps; `completed_at` is set only when all surviving child deliveries are terminal or approved cascades have removed the target work and no delivery work remains |

`notification_deliveries` is proposed with:

| Field | Contract |
|---|---|
| `delivery_id` | Opaque server-generated primary identifier and the job identity |
| `intent_id` | `NOT NULL` foreign key to `notification_intents(intent_id)` with `ON DELETE CASCADE` |
| `owner_id` | `NOT NULL` foreign key to `users(user_id)` with `ON DELETE CASCADE`; must match the intent owner and subscription owner |
| `subscription_id` | `NOT NULL` foreign key to `push_subscriptions(subscription_id)` with `ON DELETE CASCADE` |
| `state` | `PENDING`, `RETRYABLE`, `PROCESSING`, `DELIVERED`, `DEAD`, or `CANCELLED` |
| `attempt_count` | Non-negative bounded integer, maximum `5`; incremented when a claim starts an attempt |
| `next_attempt_at` | Due timestamp for `PENDING`/`RETRYABLE` work |
| `claim_token`, `claim_expires_at` | Nullable opaque worker lease fields; required together only for `PROCESSING` |
| `last_failure_class` | Finite sanitized failure class, never a raw provider/exception value |
| `cancel_reason` | Finite bounded reason only when `CANCELLED` |
| `created_at`, `updated_at`, `last_attempt_at` | Lifecycle timestamps |
| `delivered_at`, `terminal_at` | Completion timestamp for `DELIVERED` or terminal state |

The delivery row references the immutable payload through `intent_id`; it does
not duplicate or store `endpoint`, `endpoint_hash`, `p256dh`, `auth`, VAPID
material, or a provider token. The worker joins the current ACTIVE
PushSubscription record at delivery time. The owner and subscription checks
are repeated at send time so an old delivery row cannot select a credential
from another account.

The target relationship is intentionally exact: deleting a
`push_subscriptions` row cascades to every `notification_deliveries` row whose
`subscription_id` references it. A hard subscription removal therefore leaves
no pending or retryable work that requires the deleted browser/device target;
it may also erase that target's delivered, dead, or cancelled operational row
early. This is privacy-safe and creates no obligation to preserve per-device
delivery history after subscription removal. The parent
`notification_intents` row is not deleted merely because one target is
removed, and delivery rows for other devices are unaffected. Account deletion
continues to cascade all account-owned notification data from the `users` root.

Subscription invalidation is not a hard delete. Invalidating a
`PushSubscription` preserves its row, and the affected delivery may become
terminal under the invalid-subscription policy. Only actual deletion triggers
the foreign-key cascade. Completion bookkeeping must treat a cascaded target
row as removed work, never recreate or replay it, while retaining the parent
intent for its remaining targets and normal retention lifecycle.

The future migration must enforce, at minimum:

- foreign keys and `ON DELETE CASCADE` from account-owned intent/delivery state;
- bounded checks for category, channel, state, attempt count, timestamp order,
  claim-field shape, and terminal-field shape;
- an exact-payload application boundary plus database JSONB size/key checks
  sufficient to prevent an unbounded record;
- an ordinary database `UNIQUE` constraint or ordinary unique index over
  exactly `(owner_id, category, channel, notification_type_key, dedupe_key)`;
  `dedupe_key` is `NOT NULL`, so the uniqueness is unconditional and uses no
  predicate;
- an index on `(next_attempt_at, delivery_id)` for `PENDING`/`RETRYABLE`
  rows;
- an index on `(claim_expires_at, delivery_id)` for expired `PROCESSING`
  rows; and
- owner/state and subscription/state indexes for account erasure, preference
  revalidation, invalidation, and bounded cleanup.

No generic queue, Redis dependency, message bus, or provider-specific table is
introduced. The existing B1 `push_subscriptions` schema remains the credential
repository and is not rewritten by B4A.

### 25.2 Outbox state machine

`PENDING` means never-attempted due work. `RETRYABLE` means a prior bounded
attempt may be tried again at `next_attempt_at`. `PROCESSING` means an active
worker lease, not successful delivery. `DELIVERED` means the transport
accepted the send at its server boundary. `DEAD` is terminal work that cannot
be retried under the policy, including a transport attempt that proves its
target subscription invalid. `CANCELLED` is terminal work intentionally made
non-sendable by a local authority or lifecycle decision before transport, such
as a disabled gate or a target observed as already non-`ACTIVE`.

Legal transitions are:

    PENDING    -> PROCESSING | CANCELLED
    RETRYABLE  -> PROCESSING | CANCELLED
    PROCESSING -> DELIVERED | RETRYABLE | DEAD | CANCELLED
    PROCESSING --expired lease--> RETRYABLE | DEAD

`DELIVERED`, `DEAD`, and `CANCELLED` have no outgoing transitions. A lease
recovery transition uses the same bounded attempt policy; it does not create a
second delivery identity. `CANCELLED` is deliberately limited to local
lifecycle or authority decisions made before transport, not used to hide a
retryable or terminal transport failure.

`CANCELLED` is justified for delivery work that was once valid or planned but
became intentionally non-sendable before transport: the `WEB_PUSH` channel
preference is no longer explicitly `true`, the relevant category preference is
no longer explicitly `true`, trusted eligibility was revoked, or a still-
existing target `PushSubscription` is no longer `ACTIVE`. Account deletion and
hard PushSubscription deletion use database cascades instead of preserving a
`CANCELLED` row. A transport failure is never converted to `CANCELLED`;
transport outcomes remain `DELIVERED`, `RETRYABLE`, or `DEAD` under the bounded
failure taxonomy. In particular, endpoint-specific proof that a subscription
is invalid produces a terminal transport outcome and targeted invalidation,
not a policy cancellation.

### 25.3 PostgreSQL claim and lease protocol

The worker claims a bounded batch, at most `50` rows per transaction, using
PostgreSQL row locking with `FOR UPDATE SKIP LOCKED`. It selects due
`PENDING`/`RETRYABLE` rows and expired `PROCESSING` rows in deterministic
`next_attempt_at, delivery_id` order, then atomically sets:

- `state = PROCESSING`;
- a newly generated opaque `claim_token`;
- `claim_expires_at = now() + 2 minutes`;
- `attempt_count = attempt_count + 1`; and
- the corresponding update/attempt timestamps. The additive delivery field
  `first_attempt_at` is set exactly once on the first claim and remains the
  durable anchor for the 24-hour retry horizon.

The current sequential worker drain requests one due delivery per claim
transaction and completes that delivery before requesting the next one. The
`50` value remains the bounded recovery/drain ceiling and repository limit; it
is not a queue of sends waiting behind one lease. Lease-expiry checks,
lease-expiry arithmetic, and retry scheduling use the PostgreSQL wall clock
(`clock_timestamp()`), while each persisted event timestamp is evaluated at
its actual mutation time rather than the transaction start time.

The adapter attempt has a local timeout no longer than `30 seconds`, leaving a
bounded lease-recovery margin. Completion updates must match both
`delivery_id` and `claim_token`; a stale worker cannot overwrite a newer
claim. The worker never logs or returns the claim token. A worker that exits
without completing leaves a lease for recovery; recovery returns it to
`RETRYABLE` when attempts remain or to `DEAD` at the attempt limit. No two
workers intentionally process the same actively leased row. A transport
timeout or crash can still produce a duplicate at the protocol boundary, as
described below.

### 25.4 Final-send serialization and revalidation

The PostgreSQL claim phase and the final send phase are separate bounded
transactions. The claim phase atomically claims due rows, commits
`PROCESSING` plus a fresh `claim_token` and lease, and does not remain open
during transport. The final-send phase starts immediately before one delivery
attempt, acquires the authority locks below, revalidates claim ownership and
current local authority, performs the bounded transport attempt, records the
bounded outcome, and then releases the locks.

Every final-send transaction uses this deterministic logical lock order:

    1. owner `users` row
    2. `WEB_PUSH` channel-preference row
    3. relevant category-preference row
    4. target `PushSubscription` row
    5. claimed `notification_deliveries` row

The preferred PostgreSQL row-lock modes are:

    owner users row                 FOR KEY SHARE
    channel/category preference     FOR SHARE
    target PushSubscription         FOR UPDATE
    claimed delivery                FOR UPDATE

`FOR KEY SHARE` on the owner conflicts with the existing account-erasure
transaction's `FOR UPDATE` root lock. `FOR SHARE` on a preference row conflicts
with its status-changing `UPDATE`, and `FOR UPDATE` on a PushSubscription row
provides the strong target lock required for exact-target invalidation and
conflicts with its hard `DELETE` and status-changing `UPDATE`. The delivery row
uses `FOR UPDATE` so the worker can validate `PROCESSING` state and
`claim_token`, then persist the attempt outcome without allowing another claim
or completion update to interleave. If a required preference or subscription
row is absent, there is no row to lock; the worker fails closed and does not
send.

After acquiring all five locks and before calling `WebPushTransport`, the
worker must revalidate all authoritative local state: the owner still exists;
trusted eligibility is still true; the `WEB_PUSH` channel preference is
explicitly `true`; the relevant category preference is explicitly `true`; the
target subscription still exists, is owned by that account, and is `ACTIVE`;
the delivery remains `PROCESSING`; the `claim_token` still matches; and the
lease remains valid enough for the bounded attempt and its outcome update under
the frozen worker rules. Any missing row, `null` preference, `false` preference,
revoked eligibility, ownership mismatch, non-`ACTIVE` target, claim mismatch,
or insufficient lease fails closed and must not initiate transport. A delivery
that is still owned by the worker may be marked `CANCELLED` with a bounded
authority reason in that case; it must not be retried merely because local
consent or ownership disappeared.

The final-send transaction intentionally holds these row locks across the
external transport attempt because the product requires an orderable
consent/deletion boundary. The attempt timeout remains no more than
`30 seconds`, and no unbounded network call may occur while the locks are held.
The claim `2 minute` lease, claim-token fencing, and stale-claim recovery remain
in force. A stale worker must not overwrite a newer claim.

## 26. Fan-out, deduplication, and delivery semantics

B4A chooses fan-out model **A: one account-level intent expands into one
delivery row per ACTIVE PushSubscription** in the enqueue transaction.

This model is selected because it provides:

- retry isolation: one failing device does not delay another device;
- explicit multiple-device behavior: each active subscription receives its own
  bounded attempt and state;
- targeted invalidation: a gone endpoint invalidates only its own subscription;
- row-level concurrency control through `SKIP LOCKED` and one lease per target;
- per-target bounded outcome/latency observability without exposing credentials;
- direct account and subscription deletion semantics through foreign keys; and
- a maintainable path to another channel without embedding fan-out inside a
  provider-specific send call.

The fan-out snapshot is taken after all enqueue gates pass. A subscription
registered later does not receive that existing intent. If one device returns a
known invalid-subscription result, only that subscription is invalidated and
its delivery row becomes `DEAD` with the bounded `SUBSCRIPTION_INVALID` failure
class; other rows continue. This is a terminal transport outcome, not a
`CANCELLED` policy decision. Partial multi-device success is therefore
expected and unambiguous: an intent is complete when all of its surviving
delivery rows are terminal or have been removed by an approved account or hard
subscription cascade, and its outcome may be partial internally. There is no
delete-all-device behavior and no automatic transfer to another account.

Deduplication is supplied by the trusted server-side trigger/enqueue boundary.
Every trusted internal enqueue supplies a required, bounded, opaque typed
`dedupe_key`; the key is scoped by owner, category, channel, and notification
type. The ordinary unique constraint/index described above applies for the
whole time the intent row exists, including `DELIVERED`, `DEAD`, and
`CANCELLED` rows. A duplicate enqueue inside that uniqueness domain returns or
reuses the existing logical intent/result and does not re-render a payload or
re-fan-out delivery rows. Retention deletion of the old intent ends that
uniqueness lifetime, after which a later enqueue may begin a new lifecycle. No
raw event data, chart data, endpoint, browser key, or provider message ID is a
dedupe key.

Internal enqueue and claim transitions are idempotent within the database
identity. End-to-end browser delivery is not exactly once: Web Push transport
acceptance followed by a timeout, process crash, or lost completion update may
cause a later retry and a duplicate user-visible notification. The intended
guarantee is bounded best-effort, at-least-once-style transport with internal
duplicate suppression where possible. Idempotency ends at the transport
boundary; it does not claim browser display, OS delivery, or human read state.

## 27. Retry and backoff model

B4A freezes a simple bounded policy:

- maximum delivery attempts: `5` total, including the first attempt;
- no random jitter; the schedule is deterministic and bounded;
- after attempt 1, retry after `60` seconds;
- after attempt 2, retry after `300` seconds;
- after attempt 3, retry after `1,800` seconds; and
- after attempt 4, retry after `7,200` seconds; a retryable failure on attempt
  5 transitions to `DEAD`.

No retry is scheduled later than `24 hours` after the first attempt. If the
calculated next attempt would exceed that horizon, the row becomes `DEAD`.
`Retry-After` may be honored only when it parses to a bounded non-negative
delay; it is capped at `3,600` seconds and cannot extend the 24-hour horizon.
The effective delay is the greater of the policy delay and the capped valid
`Retry-After`, subject to the horizon. Invalid or oversized `Retry-After` is
ignored.

Only `THROTTLED`, `TRANSIENT_UPSTREAM`, and `TIMEOUT_AMBIGUOUS` outcomes are
retryable. Known invalid/expired subscriptions, malformed local payloads,
permanent non-subscription failures, and permanently disabled/ineligible work
are not retried. Missing or malformed VAPID configuration is an operational
readiness failure: the worker does not claim new work and does not fabricate a
successful attempt. There is no infinite retry and no delivery SLA claim.

## 28. Failure taxonomy and subscription invalidation

The transport adapter maps protocol/library details to the following bounded
classes and never exposes the raw remote response:

| Class | Examples | Delivery row | PushSubscription |
|---|---|---|---|
| `ACCEPTED` | Upstream accepted the send request | `DELIVERED` | Remains `ACTIVE`; update success timestamp only if justified |
| `SUBSCRIPTION_INVALID` | 404/410 gone/expired endpoint, or endpoint-specific proof of invalid subscription credentials | `DEAD` with bounded `SUBSCRIPTION_INVALID` failure class; no retry | Conditional `ACTIVE -> INVALIDATED` for that subscription only |
| `THROTTLED` | 429 or an explicit bounded throttling response | `RETRYABLE` under backoff | Remains `ACTIVE` |
| `TRANSIENT_UPSTREAM` | Bounded 5xx/upstream service failure | `RETRYABLE` or `DEAD` at limit | Remains `ACTIVE` |
| `TIMEOUT_AMBIGUOUS` | Local timeout or lost response with unknown acceptance | `RETRYABLE` or `DEAD` at limit | Remains `ACTIVE` |
| `CONFIGURATION_UNAVAILABLE` | Missing, malformed, or mismatched server-only VAPID config | No claim/send; readiness remains unavailable | Remains `ACTIVE` |
| `PAYLOAD_INVALID` | Locally generated payload fails exact V1 validation | `DEAD` | Remains `ACTIVE` |
| `PERMANENT_FAILURE` | Bounded non-subscription failure that cannot succeed by retry | `DEAD` | Remains `ACTIVE` |

401/403-style results are `SUBSCRIPTION_INVALID` only when the adapter can
attribute the evidence to the endpoint/subscription. A sender-wide VAPID
authorization or key mismatch is `CONFIGURATION_UNAVAILABLE` or a bounded
permanent configuration failure and must not invalidate every subscription.
No generic transport failure automatically invalidates a subscription. When a
transport attempt supplies endpoint-specific proof of invalidity, the worker
conditionally sets only the affected account-owned row to `INVALIDATED`,
prevents future delivery attempts to it, and records that delivery as terminal
`DEAD`; other devices and preferences remain unchanged. A local final-gate
observation that a still-existing target is already non-`ACTIVE` may instead
mark its delivery `CANCELLED` before transport. Thus transport failures use
`DELIVERED`, `RETRYABLE`, or `DEAD`; `CANCELLED` remains reserved for local
pre-transport authority decisions. Later explicit authenticated
re-subscription may create or refresh a valid owner-bound record.

## 29. Internal enqueue and worker boundary

Future product code calls an internal typed boundary conceptually equivalent to:

    enqueueConsumerNotification(input: {
      ownerId: ServerResolvedOwner;
      category: 'ACCOUNT' | 'SYSTEM' | 'ASTROLOGY_ALERT';
      notificationType: ServerOwnedNotificationType;
      dedupeKey: ServerOwnedDedupeIdentity;
      deliverAt?: ServerTimestamp;
      reference?: BoundedServerReference;
    }): Promise<BoundedEnqueueResult>

The owner, type, dedupe identity, reference, eligibility answer, and content
come from trusted server/application boundaries. An authenticated user API is
never an arbitrary-send interface and accepts no free-form title, body, path,
target account, endpoint, browser subscription, provider payload, or test-send
instruction. B4A adds no `/api/notifications/send`, test-push, admin-send, or
Developer-send endpoint. It also adds no astrology trigger semantics.

The enqueue transaction evaluates the future eligibility hook, the exact
`true` channel/category preferences, and the current ACTIVE subscriptions for
the same owner. It renders the server-owned template, validates the safe V1
payload, writes the intent and per-subscription delivery rows, and commits all
of them together. Preference values of `null` or `false`, unavailable
eligibility, and an empty active-subscription set produce no durable proactive
Web Push work.

Delivery is performed by a separate server-side worker/executable. The API
request/response process never performs live product notification delivery
synchronously. The worker discovers due rows through the indexes above, claims
at most 50 rows atomically, performs final account/eligibility/preference/
subscription checks, calls `WebPushTransport`, and records only the bounded
outcome. It stops claiming new work during graceful shutdown, allows each
already-started bounded attempt to finish, and leaves any uncommitted lease
for normal expiry recovery. Local execution must remain possible later, but no
cloud scheduler, hosted queue, or Railway-specific worker topology is frozen.

## 30. Account Deletion interaction

Account deletion remains the hard privacy boundary. The existing PostgreSQL
erasure transaction locks the `users` root and deletes it; B4 future tables
must use account ownership/cascades so the following active-database rows are
removed with that root:

- active and invalidated PushSubscriptions;
- notification preferences;
- notification intents;
- pending, retryable, claimed, delivered, dead, or cancelled delivery rows;
- any future account-owned delivery-attempt rows; and
- no separate account-owned delivery archive.

To close the race between a worker and successful deletion, the final-send
transaction uses the exact lock order and preferred modes in section 25.4:
owner `users` `FOR KEY SHARE`, then the channel and category preference rows
`FOR SHARE`, then the target `PushSubscription` `FOR UPDATE`, and finally the
claimed delivery `FOR UPDATE`. It holds that bounded transaction through the
transport attempt and its state update. The existing erasure transaction's
`FOR UPDATE` root lock therefore either wins first (the worker observes no
owner and sends nothing) or waits until the bounded send transaction finishes
(the send began before deletion could successfully commit). Account deletion
continues to acquire the owner root before cascading dependent data.

The same ordering is required of future local authority mutations: a channel
or category Disable/Off operation must serialize through the owner row before
updating its preference row, and PushSubscription removal or invalidation must
serialize through the owner row before changing or deleting its target row.
Their changed preference/target row must use an update/delete-conflicting lock
appropriate to the operation. This keeps preference updates, subscription
deletion, subscription invalidation, and account deletion compatible with the
final-send order and reduces deadlock risk; no distributed lock is introduced.

The ordering guarantee is precise: if the worker obtains and validates the
final-send locks first, a concurrent Disable/Off, subscription removal or
invalidation, or account deletion may wait for that strictly bounded send
attempt to finish. If the user mutation or account deletion commits first, a
later worker obtains the locks only after that commit and observes the changed
or missing authority state, so it must not initiate transport. Once a
Disable/Off, subscription-removal, or account-deletion operation has
successfully committed, no later worker may initiate transport based on the
stale state that existed before that commit.

This is a concurrency ordering guarantee for the active database, not a claim
that an already accepted Web Push notification can be recalled from a browser
or operating system. It does not revoke a notification accepted by the push
transport before Disable or deletion completed, and it does not claim exactly
once behavior. Provider history, operating-system notification surfaces, host
logs, backups, and external platform copies remain outside the transaction. No
notification is intentionally sent after successful account deletion, and no
backup-retention policy is invented here. Future Developer organization/member
semantics remain separate.

## 31. Account Export interaction

B4A adds no user-facing durable product data to Account Export. The current
export remains the bounded repeatable-read snapshot and may continue to include
only the existing safe Consumer notification metadata: channel/category
preferences and safe PushSubscription status/timestamps.

Account Export must continue to exclude endpoint, endpoint hash, `p256dh`,
`auth`, browser subscription JSON, private/public VAPID secret material,
template payloads, delivery rows, attempt counts, claim/lease data, failure
diagnostics, raw transport responses, and another account's state. No
delivery history or internal outbox state is exported merely because it is
durable. A future user-visible notification history would require its own
product, export, deletion, and retention contract.

## 32. Retention classification

`notification_intents` and `notification_deliveries` are account-scoped
operational delivery records whose purpose is bounded delivery processing and
diagnostics. Active/invalidated PushSubscriptions and preferences retain their
existing Consumer classification. Pending/retryable rows are kept only while
needed for bounded delivery correctness; delivered, dead, and cancelled rows
become deletable after their approved operational purpose ends. The approved
retention policy defines when completed operational rows may or must be
cleaned; cleanup may be deferred until that policy value is available. That
policy does not prevent earlier privacy-safe deletion caused by the account
erasure cascade or by a hard PushSubscription deletion cascading its
target-specific delivery rows.

The exact duration, owner, exceptions, backup behavior, and deletion treatment
remain `POLICY REQUIRED` under `NATALNODE_DATA_RETENTION_V1.md`. No numeric
retention period, hidden permanent-retention default, or backup erasure rule is
introduced by B4A. Retry correctness must not depend on indefinite retention;
the unique dedupe lifetime is only the lifetime of the active database record,
and hard target deletion may end the lifetime of its delivery row before
ordinary operational cleanup.
Account deletion remains immediate active-database cascade erasure as above.
Provider/platform copies and operational sinks require their own approved
retention/operations treatment. Developer operational history is not covered
by this Consumer contract.

## 33. Privacy Access Audit interaction

Ordinary owner registration, preference changes, enqueue planning, delivery
claims, transport attempts, invalidation, and safe settings views are product
operations, not privileged non-owner access. They are not added to
`PrivacyAccessAuditRepository` merely because endpoint credentials are
sensitive.

A future authorized staff/service surface reading, exporting, deleting, or
reviewing another account's notification data must use the separate Privacy
Access Audit contract: server-derived actor/subject, bounded
category/action/outcome, append-only handling, and approved fail-closed
behavior. No role, break-glass flow, or privileged notification-data surface
is created here.

## 34. Operational observability and provider errors

Worker and delivery observability may expose only a fixed, privacy-minimized
record with fields such as:

- `channel = WEB_PUSH`;
- bounded Consumer category and server-owned type key;
- bounded outcome/state class;
- attempt number within `1..5`;
- duration/latency bucket or bounded integer;
- retry scheduled yes/no; and
- subscription invalidated yes/no.

An opaque internal job/request correlation value may be used only when needed
for operations and must not be an account or endpoint identifier. Do not emit
endpoint, endpoint hash, `p256dh`, `auth`, VAPID material, provider
credentials, email, user/account ID, chart ID, birth data, location, timezone,
full title/body, payload, template variables, ChartRequest, ChartResult,
interpretation, URL/query, claim token, raw provider response, raw
exception/stack/SQL, retry secrets, arbitrary labels, or dynamic event names.

Transport errors map to the bounded classes in section 28. Raw remote
responses are not persisted, logged, returned, or reused as notification
content. Configuration errors reveal only a finite readiness/outcome code.
Delivery observability does not prove a user saw a notification and remains
separate from Privacy Access Audit. Developer organization names, API keys,
quota details, billing identifiers, and security-sensitive operational data
require a separately approved Developer observability contract.

## 35. User notification-settings direction

The minimal future surface is:

    Account / Settings
        -> Notifications

It may expose Web Push enabled/disabled state, supported categories, safely
detectable permission/capability state, whether a usable owner-bound
subscription exists without revealing credentials, and a truthful eligibility
explanation.

It must not show raw credentials, invent plan names, claim permission can be
overridden, or become a large dashboard. No UI is built in `B4A`; the current
Account page remains unchanged.

## 36. In-app notification center status

No current product requirement requires an inbox/history for the initial Web
Push foundation.

    IN-APP NOTIFICATION CENTER — DEFERRED / NOT REQUIRED FOR INITIAL WEB PUSH FOUNDATION

A later inbox needs its own content, retention, read-state, export, deletion,
access-control, and UI contract.

## 37. Paid-feature UX status

Future types may be shown as available, locked, or upgrade-required only after
a product decision. UI consumes server-owned eligibility and does not calculate
billing, expose an unapproved plan/price, or infer entitlement from a browser
flag.

No paywall, checkout, upgrade CTA, subscription plan, or paid type is
implemented or frozen here.

## 38. Billing and trigger separation

These separations are frozen:

    Notification Platform != Billing Platform
    Notification Platform != Astrology Trigger Engine
    Consumer notification policy != Developer operational notification policy

Billing/product systems decide entitlement. Notification Platform enforces the
supplied eligibility result and does not inspect payment-provider state or
implement checkout.

Consumer and Developer product families may supply different eligibility or
operational policy inputs, but neither makes Notification Platform the billing
authority.

The trigger producer decides that a logical event exists. Notification Platform
decides whether and how an eligible, opted-in user may receive it. Push code is
not astrology business logic.

## 39. Public-development behavior

Public-development must not require VAPID keys, a Web Push provider,
service-worker registration, PostgreSQL notification storage, a delivery worker,
a scheduler, or a browser permission request.

Future public-development notification behavior is unavailable/fail-closed by
default unless a later task explicitly justifies a safe, non-deceptive fixture.
It must not fabricate permission, PushSubscription, delivery, entitlement, or
an astrology trigger. Existing Calculate, Learn, Auth, Vault, and other flows
remain independent of notification availability.

Authenticated local development may later exercise real delivery when a
developer supplies legitimate local PostgreSQL, browser, Service Worker,
complete VAPID configuration, and other required runtime inputs. That mode
must use the same real ownership, payload, worker, and transport boundaries;
it must not fabricate a PushSubscription, private VAPID key, transport result,
or delivery success. No `DATABASE_URL`, mail credential, VAPID private key,
local credential, or `.env` secret is committed. Any live browser/provider
acceptance remains an external gate beyond the B4B4 local PostgreSQL closure
and must use explicit developer-owned configuration.

## 40. Deployment and live requirements

Live Web Push requires external/deployment gates for:

- HTTPS on the browser-visible origin;
- service-worker scope and static artifact deployment;
- server-only VAPID/private credential management and rotation;
- production persistence/access control for subscriptions, preferences, and
  delivery records;
- a background worker/scheduler invocation with bounded failure handling;
- same-origin, cookie, CSRF, rate-limit, and security-header behavior;
- browser acceptance for permission states, account switching, invalid endpoints,
  lock-screen minimization, and click routing;
- provider compatibility and sanitized errors; and
- retention, backup/restore, deletion, export, privacy, and operations approval.

Current deployment remains one-origin static Astro plus API, with deployment
paused and production hosting/provider choices distinct from this contract.
`B4A` configures none of these gates.

## 41. Provider-selection status

No Web Push provider is selected.

    WEB PUSH PROVIDER DECISION = DEFERRED
    PRODUCTION ASTRONOMY PROVIDER DECISION = DEFERRED

Provider names, URLs, credentials, response schemas, and provider-specific
feature flags must not enter website/domain behavior.

## 42. Dependency-selection status

No dependency is added by `B4A`. Future selection evaluates protocol and
payload-encryption support, VAPID, Node/ESM compatibility, minimal transitive
surface, bounded sanitizable errors, active maintenance/security posture, and
deployment compatibility.

The choice remains behind `WebPushTransport`. No provider-specific dependency
may leak into domain, browser bundle, or public API.

## 43. Deliberately small MVP scope

The first usable foundation is limited to:

- authenticated owner-bound Web Push registration/removal;
- small global/channel and category preferences;
- user-initiated permission UX;
- one provider-neutral Web Push channel;
- bounded type/category registry;
- narrow entitlement hook with no billing implementation;
- a frozen durable outbox/fan-out/claim/retry contract plus the bounded B4B2
  transport/readiness foundation; and
- privacy-minimized content and account lifecycle interaction.

It excludes inbox/history, arbitrary test messages, a general messaging bus,
astrology trigger semantics, paid plan logic, provider-specific UI, and live
delivery. B4A freezes the delivery contract only; B4B1 now provides the local
persistence and enqueue foundation, while B4B4 closes the separately
authorized local PostgreSQL integration acceptance gate.

## 44. Implementation-readiness matrix

Readiness identifies a future technical boundary; it is not launch or legal
approval.

| Boundary | Classification | Current state / precondition |
|---|---|---|
| Typed categories, intent, preferences | `IMPLEMENTED LOCALLY / CONSUMER ACCOUNT-OWNED FOUNDATION` | Focused provider-neutral domain; no billing or astrology types invented |
| Owner-bound PushSubscription persistence | `IMPLEMENTED LOCALLY / CONSUMER ACCOUNT-OWNED FOUNDATION` | Typed repository/migration slice; sensitive fields and account ownership fixed here |
| Registration/unsubscribe API boundary | `IMPLEMENTED LOCALLY / CONSUMER AUTHENTICATED API` | Auth principal, same-origin, bounded validation, account-key rate limiting, safe metadata |
| Permission UX/settings UI | `IMPLEMENTED LOCALLY / PRODUCT-OWNER VISUAL RE-ACCEPTANCE REQUIRED` | Account Notifications UI uses explicit user gestures and all supported/denied/unavailable states |
| Service worker | `IMPLEMENTED LOCALLY / PRODUCT-OWNER VISUAL RE-ACCEPTANCE REQUIRED` | Root-hosted narrow push/click worker; no fetch/cache/offline or public-development fake |
| Web Push adapter | `IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED` | Provider-neutral `web-push` protocol seam, complete server-only VAPID readiness, bounded outcomes, and redaction; no live send route |
| Durable outbox/worker | `IMPLEMENTED LOCALLY / CONCURRENCY & SECURITY REVIEW REQUIRED` | B4B1 persistence plus B4B3 bounded worker claim/recovery/final-send implementation; deployment invocation and live acceptance remain deferred |
| Entitlement integration | `FUTURE SUBSCRIPTION-GATED` | Approved product/billing entitlement source required |
| Astrology alert producers | `ENGINE/TRIGGER-GATED` | Separate source-grounded trigger/scientific contract required |
| Notification retention/enforcement | `POLICY-GATED / OPERATIONS-GATED` | Durations, owners, exceptions, backup/restore, deletion, scheduler |
| Account deletion/export integration | `CONTRACT COMPATIBILITY FROZEN / IMPLEMENTATION DEFERRED` | Future tables must use the documented account cascades and preserve the unchanged safe export |
| Privileged notification-data review | `POLICY-GATED / DEFERRED` | No role/surface exists; use separate audit contract later |
| Live browser/HTTPS/provider acceptance | `LIVE-EXTERNAL-GATED` | Deployment, credentials, browser matrix, provider behavior |

`LOCAL IMPLEMENTATION READY` identifies a safe future slice; it does not
authorize implementation automatically. Policy, operations, subscription,
trigger, and live gates must not be hidden in local code.

## 45. Future implementation slices

These are bounded candidates and are not executed by `WEB-NOTIFY-001B4A` or
this `WEB-NOTIFY-001B4A-R1` contract amendment:

Current implementation status:

- `WEB-NOTIFY-001B1` — **IMPLEMENTED LOCALLY / CONSUMER ACCOUNT-OWNED
  FOUNDATION**: typed domain primitives, owner-scoped preferences, and
  PostgreSQL PushSubscription persistence only. Runtime composition, routes,
  browser registration, and delivery remain deferred.
- `WEB-NOTIFY-001B1-R1` — **NOT STARTED**: focused ownership, concurrency, and
  sensitive-credential persistence review.
- `WEB-NOTIFY-001B2` — **IMPLEMENTED LOCALLY / CONSUMER AUTHENTICATED WEB
  PUSH / PREFERENCE API**: authenticated account routes, owner-scoped
  registration/removal, safe metadata responses, and privacy-safe Account
  Export projection. Browser permission and delivery remain deferred.
- `WEB-NOTIFY-001B3` — **IMPLEMENTED LOCALLY / PRODUCT-OWNER VISUAL RE-ACCEPTANCE REQUIRED /
  LIVE WEB PUSH DELIVERY NOT IMPLEMENTED**: Account Notifications settings,
  explicit permission flow, root-hosted Service Worker, browser
  registration/removal choreography, safe public-key capability, bounded
  payload/click handling, and conflict-safe account switching. No server
   delivery or private VAPID credential is implemented.
- `WEB-NOTIFY-001B4A-R1` — **PASS / CONTRACT AMENDMENT CLOSED**: closes the
  deduplication uniqueness, target foreign-key deletion, final-send
  preference/subscription/account race, lock-ordering, cancellation, claim
  phase, and retention-shape ambiguities without changing the deferred
  implementation boundary.
- `WEB-NOTIFY-001B4A` — **APPROVED TECHNICAL CONTRACT / IMPLEMENTATION
  DEFERRED**: Consumer delivery, outbox, fan-out, claim/lease, retry,
  invalidation, payload/template, transport, private VAPID, deletion/export,
  retention, and observability boundaries are frozen in this amendment. No
  runtime, migration, dependency, worker, or live-delivery implementation is
  included.
- `WEB-NOTIFY-001B4B1` — **IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED**:
  PostgreSQL persistence/repository, future-worker schema support, typed
  server-internal enqueue, eligibility/preference gates, immutable safe
  payload persistence, durable dedupe, and active-subscription fan-out only.
- `WEB-NOTIFY-001B4B2` — **IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED**:
  provider-neutral `WebPushTransport`, per-call VAPID configuration/readiness,
  P-256 public/private match validation, bounded protocol outcomes, and
  redaction. No worker or live send route exists.
- `WEB-NOTIFY-001B4B3` — **IMPLEMENTED LOCALLY / B4B3-R1 PASS /
  CONCURRENCY & SECURITY REVIEW CLOSED**: separate bounded consumer
  worker/executable, one-at-a-time due-row claim/send sequencing under the
  two-minute lease, wall-clock lease/retry arithmetic, expired-claim recovery,
  bounded retry scheduling, final authority serialization, current
  preference/eligibility revalidation, existing `WebPushTransport` invocation,
  delivery persistence, and exact-target subscription invalidation. Real
  PostgreSQL concurrency and live-delivery acceptance remain outside this
  local review and are not claimed here.
- `WEB-NOTIFY-001B4B4` — **PASS / LOCAL POSTGRESQL INTEGRATION ACCEPTANCE
  CLOSED**: the bounded local PostgreSQL acceptance contract is closed. Live
  browser/provider delivery, production deployment, scheduler operation,
  credentials, and retention values remain external/product gates.
- Developer operational notification domain — **CONTRACT REQUIRED BEFORE
  IMPLEMENTATION** after Subscription/Entitlement and Developer Organization
  architecture are frozen.

### `WEB-NOTIFY-001B1` — Consumer typed notification domain and owner state

This slice is implemented locally as the Consumer/account-owned foundation.
It contains the bounded registry, intent shape, minimal preferences, and
owner-bound PushSubscription repository/persistence contract. It contains no
billing plans, astrology trigger types, or delivery provider.

### `WEB-NOTIFY-001B2` — Registration/removal APIs and ownership security

This slice is implemented locally as the Consumer authenticated Web Push /
preference API. It provides same-origin, rate-limited registration/replacement,
unsubscribe, preference mutations, and safe Account Export metadata while
enforcing principal-derived ownership and the cross-account rule. It adds no
service worker or transport.

### `WEB-NOTIFY-001B3` — Service worker, permission UX, and settings

Implemented locally with product-owner visual re-acceptance still required. The Account
Notifications surface uses an explicit user-gesture-only permission flow,
separately detects Notification, Service Worker, and PushManager support,
registers the root-hosted worker only after permission is granted, maps only
the native endpoint and p256dh/auth keys to the B2 registration API, and keeps
account switching/disable conflicts fail-closed. The worker accepts only the
bounded V1 payload and approved same-origin paths, has no fetch/cache/offline
behavior, and uses a generic fallback for invalid payloads. No automatic
permission prompt, private VAPID credential, server delivery, provider, or
public-development fake is included. **PRODUCT-OWNER VISUAL RE-ACCEPTANCE REQUIRED.**

### `WEB-NOTIFY-001B4A` — Consumer Web Push delivery contract

**APPROVED TECHNICAL CONTRACT / IMPLEMENTATION DEFERRED.** This documentation
slice freezes the two-table account-owned outbox/fan-out model, bounded state
machine and PostgreSQL claim lease, best-effort delivery semantics, immutable
server-rendered payload, server-only VAPID boundary, provider-neutral transport
outcomes, failure classification, retry schedule, worker/enqueue separation,
account deletion/export/retention/observability rules, and future migration
shape. It creates no runtime code, dependency, migration, secret, worker, or
send endpoint.

### `WEB-NOTIFY-001B4B1` — Persistence and enqueue foundation

**IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED.** This slice implements only
the documented PostgreSQL tables, repositories, typed server-internal enqueue
transaction, eligibility/preference gates, server-owned template rendering,
immutable payload persistence, dedupe constraint, and account-deletion-
compatible foreign keys. Worker execution and live delivery remain deferred.

### `WEB-NOTIFY-001B4B2` — WebPushTransport and VAPID configuration

**IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED.** This slice adds the
provider-neutral transport boundary, a per-call `web-push@3.6.7` protocol
implementation, complete server-only VAPID readiness with P-256 key-pair
matching, bounded outcome classification, and secret/error redaction. It adds
no hosted provider, arbitrary send API, worker claim loop, or live delivery.
The implementation passes VAPID details per protocol call and owns a monotonic
wall-clock cancellation boundary no longer than the future worker's 30-second
attempt limit.

### `WEB-NOTIFY-001B4B2-R2` — One-hour Consumer Web Push TTL

**PASS / TTL CONTRACT AND IMPLEMENTATION CLOSED.** The Consumer Web Push
transport TTL is frozen at exactly `3600` seconds (one hour) for all current
Consumer categories. The server transport passes that value explicitly in
every generated protocol request, so it does not inherit `web-push@3.6.7`'s
28-day implicit default. The value is not caller-configurable and remains
separate from the five-attempt retry policy and 24-hour retry horizon. A remote
Push Service acceptance cannot be recalled after local Disable/Off,
PushSubscription removal, or account deletion; the one-hour TTL only bounds
that residual external-delivery window. No new dependency, worker, migration,
Service Worker, or live-send route is introduced.

### `WEB-NOTIFY-001B4B3` — Worker, retry, and invalidation

**IMPLEMENTED LOCALLY / B4B3-R1 PASS / CONCURRENCY & SECURITY REVIEW
CLOSED.** This slice adds the separate bounded consumer worker/executable,
one-at-a-time due-row claim/send sequencing under the two-minute lease,
additive `first_attempt_at` persistence for the exact 24-hour retry horizon,
wall-clock lease/retry arithmetic, expired-claim recovery, deterministic
retry/backoff, final-send lock ordering and authority revalidation, existing
`WebPushTransport` invocation, bounded delivery-state persistence, graceful
shutdown, and exact-target-only invalidation. The current eligibility source
remains a required server-internal dependency and the executable fails closed
when it is unavailable. Real PostgreSQL concurrency and live-delivery
acceptance remain outside this local review. No Developer notifications, new
astrology trigger semantics, or live provider acceptance is included; B4B4
records the separate local PostgreSQL acceptance closure.

### `WEB-NOTIFY-001B4B4` — Bounded integration validation

**PASS / LOCAL POSTGRESQL INTEGRATION ACCEPTANCE CLOSED.** Real PostgreSQL
acceptance covered migration `0010` and the `first_attempt_at` schema,
first-attempt persistence, two-claimer `FOR UPDATE SKIP LOCKED` behavior,
claim-token fencing, expired-claim recovery, Channel Off and Category Off
serialization, account-erasure and PushSubscription hard-delete
locking/cascade behavior, target-only subscription invalidation,
`clock_timestamp` wall-clock behavior, lease-sufficiency refusal before
transport, post-transport retry-time origin, `first_attempt_at` preservation,
the exact 24-hour retry horizon, ACCEPTED-then-local-rollback /
at-least-once ambiguity, multi-worker isolation, multi-device isolation, and
disposable fixture cleanup.

`WEB-NOTIFY-001B4B4` is closed locally. The authoritative current eligibility
integration, actual product notification trigger semantics, legitimate
production VAPID secret management, live browser/Push Service acceptance,
production deployment and scheduler operation, and retention-policy values
remain external/product/operational gates. They are not local B4 correctness
defects and are not implemented by this closure.

The defensive `CONFIGURATION_UNAVAILABLE` edge remains unchanged: if a READY
worker receives it after claim, it performs no subscription invalidation and
no DELIVERED mutation; the PROCESSING claim remains available for lease
recovery. The notification worker remains a separate executable; HTTP server,
`dev:local`, and `dev:public` do not start it automatically. No live Web Push
acceptance is implied.

Closure status:

- `WEB-NOTIFY-001B4B4` — **PASS / LOCAL POSTGRESQL INTEGRATION ACCEPTANCE CLOSED**
- `WEB-NOTIFY-001B4B3` — **CLOSED LOCALLY**
- `WEB-NOTIFY-001B4B3-R1` — **PASS / CONCURRENCY & SECURITY REVIEW CLOSED**
- Consumer Notification Platform V1 local engineering foundation — **CLOSED**

### `WEB-NOTIFY-001C` — Focused security/privacy/reliability review

Review ownership, CSRF/same-origin behavior, permission abuse, payload
validation, open redirects, lock-screen privacy, deletion/export, retention,
audit separation, observability, retry/idempotency, error sanitization, and
public-development fail-closed behavior.

### `WEB-NOTIFY-001D` — Live HTTPS/Web Push/VAPID/browser acceptance

Verify deployed HTTPS, scope, credentials, permission lifecycle, account
switching, invalid endpoints, click routing, privacy behavior, and provider
compatibility. This is a live gate, not a local substitute.

## 46. Future subscription compatibility

Paid subscriptions can gate notification types without rewriting the browser or
delivery foundation:

    Billing/entitlement source
        -> NotificationEligibilityService
        -> existing preference/planner/outbox/channel/transport path

A paid-feature change supplies a bounded eligibility answer. It does not change
browser permission, owner-bound PushSubscriptions, service-worker validation or
click routing, channel/transport isolation, dedupe identity, or outbox states.

Billing changes an eligibility input, not delivery mechanics. Downgrade/grace/
pending-work behavior remains a future product/policy decision; it must not
silently transfer subscriptions or rewrite browser authorization.

## 47. Explicit deferred decisions

The following remain open and receive no invented defaults:

1. active notification types, especially astrology/transit semantics;
2. entitlement policy, plan names, paid UX, and billing source;
3. future preference expansion, locale, quiet-hours, and delivery-timezone
   policy;
4. production service-worker cache scope and static deployment details beyond
   the narrow B3 root-hosted worker;
5. Web Push library/provider choice, browser compatibility, and deployment
   compatibility;
6. VAPID secret-store ownership, storage, rotation, grants, and backup access
   operations (the server-only configuration shape is frozen above);
7. exact future API route validation/rate-limit values and conflict responses
   outside the internal B4 boundary;
8. worker invocation/scheduler deployment topology and operational SLOs;
9. template registry contents, localization source, and any future payload
   budget change;
10. retention durations/owners, cleanup execution, provider copies, and
    backup/restore treatment;
11. privileged-data roles, audit review, and break-glass behavior;
12. any non-deceptive public-development fixture policy;
13. HTTPS/live browser/provider acceptance and production gates; and
14. any change to the historical P0 checkpoint or deferred P0 decision packet;
15. the Developer operational notification domain, including organization and
    project context, member recipient resolution, authorization, channels,
    mandatory/default policy, lifecycle, export/privacy, retention, and
    operational ownership.

Absent decisions result in unavailable/fail-closed behavior or a deferred slice,
not a guessed provider, plan, duration, timezone, or scientific meaning.

## 48. Historical P0 checkpoint treatment

Notification Platform / Subscription Foundation is **new scope introduced after
`WEB-P0-READY-003`**. It is not a retroactive P0 implementation gap and does
not falsify the checkpoint statement that no safe unblocked local P0 gap was
identified for the previously frozen scope.

The living checkpoint may point to this contract as a separate capability while
preserving:

- historical P0 readiness;
- `PROVIDER DECISION DEFERRED`;
- deployment pause and external gates; and
- `WEB-P0-POLICY-001A` as **NOT EXECUTED / DEFERRED** until notification
  policy/external inputs are understood.

This document does not create the deferred P0 decision packet or execute its
recommended policy checkpoint.

## 49. Recommended next action

After this local notification foundation closure, do not start another
implementation automatically. The next single task is:

**`WEB-BRAND-002B`**

Its deferred scope is the slow continuous inner-core Brand Instrument rotation
(approximately 24 seconds per full rotation, linear and transform-only), with
`prefers-reduced-motion` disabling motion, no hover acceleration, flashing,
wobble, or loading-spinner resemblance. Desktop should remain largely
unchanged; at 320px and 375px the Learn Hero Brand Instrument should move
modestly lower through responsive normal-flow spacing rather than absolute
positioning hacks, and the “1 published article” display should be removed.
Visual balance must be verified at both mobile widths. This task is only a
recommendation; `WEB-BRAND-002B` is not started by this closure.

## 50. Runtime-source, dependency, and migration integrity

`WEB-NOTIFY-001B4A` and `WEB-NOTIFY-001B4A-R1` are documentation-only
delivery-contract freezes. `WEB-NOTIFY-001B4B4` is a documentation closure
plus removal of its temporary untracked acceptance harness; it adds no
production runtime behavior. Their completion boundary is:

- no runtime source under `apps/web` or `server/src` changed;
- no package source, production test source, migration, package manifest,
  lockfile, Service Worker, environment file, or database changed;
- no outbox/delivery rows, worker, scheduler, transport, provider, private
  VAPID secret, or server-side push send implemented;
- no public arbitrary-send endpoint or Developer notification behavior;
- no EngineClient, HTTP, astronomy, chart, Auth, Vault, BFF, or unrelated
  implementation change; and
- no access to or modification of `C:\\NatalNode`.

The existing B1/B2/B3 persistence, API, browser, and public capability
contracts remain additive-compatible. Account Export, Account Deletion,
Privacy Access Audit, retention policy, and historical P0 documentation are
not modified by B4A or the B4B4 closure; this document records the
compatibility requirements for their future policy/operations work.

## 51. Validation boundary

This is documentation-only closure plus temporary harness removal. Validation
is limited to:

- `git diff --check`;
- `git diff --cached --check` before commit; and
- inspection of the staged documentation diff plus `git status --short`.

Tests, `npm run check`, builds, dependency installation, database/migration
commands, dev servers, browser automation, live Web Push, provider calls, and
unrelated source inspection are intentionally not run.

## 52. Freeze conclusion

    Notification Platform             = TECHNICAL CONTRACT FROZEN
    Initial channel                   = WEB PUSH / PROVIDER-NEUTRAL
    Notification vs Billing           = SEPARATE
    Notification vs Astrology Triggers = SEPARATE
    Subscription ownership             = AUTHENTICATED ACCOUNT / ONE ACTIVE OWNER
    Permission UX                      = EXPLICIT USER GESTURE ONLY
    Payload privacy                    = MINIMIZED / LOCK-SCREEN SAFE BY DEFAULT
    Delivery architecture              = TWO-TABLE PER-SUBSCRIPTION FAN-OUT + ASYNCHRONOUS WORKER / CONTRACT FROZEN
    In-app notification center         = DEFERRED / NOT REQUIRED FOR INITIAL FOUNDATION
    Provider/library selection          = DEFERRED BEHIND WebPushTransport
    VAPID delivery readiness             = SERVER-ONLY COMPLETE PUBLIC/PRIVATE/SUBJECT CONFIG; PUBLIC CAPABILITY SEMANTICS PRESERVED
    Delivery guarantee                  = BOUNDED BEST-EFFORT / AT-LEAST-ONCE-STYLE; NOT EXACTLY ONCE
    Billing/subscription implementation = DEFERRED
    Astrology trigger implementation    = DEFERRED
    Runtime implementation             = B3 LOCAL BROWSER FOUNDATION; B4B1 LOCAL PERSISTENCE/ENQUEUE FOUNDATION; B4B2 LOCAL VAPID/TRANSPORT FOUNDATION; B4B3 LOCAL WORKER FOUNDATION; B4B4 LOCAL POSTGRESQL ACCEPTANCE CLOSED; LIVE DELIVERY NOT IMPLEMENTED
    Live/deployment acceptance          = PRODUCT-OWNER VISUAL RE-ACCEPTANCE REQUIRED / LIVE EXTERNAL GATES OPEN
    Historical P0 status               = PRESERVED; NEW SCOPE AFTER WEB-P0-READY-003
    WEB-P0-POLICY-001A                 = NOT EXECUTED / DEFERRED
    WEB-NOTIFY-001B4A-R1               = PASS / CONTRACT AMENDMENT CLOSED
    WEB-NOTIFY-001B4A                  = APPROVED TECHNICAL CONTRACT / IMPLEMENTATION DEFERRED
    WEB-NOTIFY-001B4B1               = IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED
    WEB-NOTIFY-001B4B2               = IMPLEMENTED LOCALLY / SECURITY REVIEW REQUIRED
    WEB-NOTIFY-001B4B3               = IMPLEMENTED LOCALLY / B4B3-R1 PASS / CONCURRENCY & SECURITY REVIEW CLOSED
    WEB-NOTIFY-001B4B3-R1            = PASS / CONCURRENCY & SECURITY REVIEW CLOSED
    WEB-NOTIFY-001B4B4               = PASS / LOCAL POSTGRESQL INTEGRATION ACCEPTANCE CLOSED

The B3 foundation, B4B1 persistence/enqueue boundary, B4B2 VAPID/transport
foundation, and B4B3 bounded worker boundary are complete locally at their
respective implementation boundaries, while B4A remains complete at the
contract boundary and B4B4 is closed at the local PostgreSQL acceptance
boundary. No automatic browser permission is requested, no live external
notification is sent by local validation, no private secret is configured by
this document, and no subscription/payment/provider decision or live delivery
acceptance is implied by this document.
