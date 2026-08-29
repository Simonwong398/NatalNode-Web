# NatalNode Notification Platform Technical Contract V1

| Field | Value |
|---|---|
| Status | **APPROVED TECHNICAL CONTRACT / B3 IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE REQUIRED / LIVE WEB PUSH DELIVERY NOT IMPLEMENTED** |
| Task | `WEB-NOTIFY-001B3` |
| Reviewed baseline | `ce3a46400b704022a4456f92ac9ba82876e80246` (`fix: harden consumer notification APIs`) |
| Date | 2026-08-29 |
| Scope | Provider-neutral notification platform and future subscription foundation |
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
switching behavior. Live Web Push delivery, private VAPID credentials,
provider selection, workers, schedulers, payments, and Developer operational-
notification implementation remain outside this slice. This is an
implementation handoff and product foundation contract, not a legal notice,
retention schedule, billing decision, or production-readiness claim.

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
- durable outbox/delivery direction and bounded delivery state;
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
  bounded click/payload policy. No private VAPID, provider, delivery worker,
  scheduler, or Developer operational-notification infrastructure exists. The
  only scheduler-like boundary is the short-lived Auth lifecycle maintenance
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
  P1/P2/P3 features, or unrelated UI in `001A`.

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
- `ASTROLOGY_ALERT` is reserved only; `001A` freezes no astrology alert,
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

Delivery generally requires:

    eligible by product policy
    AND enabled by owner preference
    AND channel supported/granted
    AND owner-bound active channel subscription exists

## 10. User preference model

Preferences are owner-scoped state and are distinct from entitlement. V1 keeps
the model small:

- global Web Push enabled/disabled state; and
- a bounded category preference for each exposed category.

A conceptual shape is:

    preferences[account].webPush.enabled
    preferences[account].categories[boundedCategory].enabled

The B1 Consumer implementation uses normalized account-scoped persistence for
these two preference classes. Preferences are resolved from the authenticated
owner, and opt-in is the default direction. A disabled global channel or
category prevents delivery even when entitled. Do not add quiet hours,
device-fingerprint, birth-timezone, or speculative flags without a concrete
requirement. Broader Developer policy and channel preferences require their
own future contract.

If local-time scheduling is later required, it needs a separate user
delivery-timezone contract and must not reuse a birth-chart timezone.

## 11. Initial delivery channels

Web Push is the only initial proactive channel:

    Notification Platform -> Web Push channel adapter -> Web Push transport

Email may be added later through a separate channel adapter. No SMS, in-app
inbox, mobile push, email provider, or third-party notification service is
selected by this contract.

## 12. Web Push transport boundary

The channel adapter must call a narrow provider-neutral boundary:

    interface WebPushTransport {
      send(input: WebPushSendInput): Promise<WebPushSendOutcome>;
    }

The future boundary must:

- accept only a server-generated bounded message and server-side subscription
  material needed by Web Push;
- return bounded outcomes, including invalid/expired classification where known;
- sanitize remote/provider errors before they reach the domain, logs, storage,
  or user-facing responses;
- isolate protocol/vendor/library details inside the adapter; and
- remain independent from Stripe, Firebase, Google services, hosting provider,
  Web Push vendor, and specific npm library.

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
service worker. `001A` creates no keys, secrets, or environment variables.

At-rest protection, database grants, backups, and rotation are later
security/operations/deployment decisions. They must not be replaced by a fake
local success state.

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
no endpoint, keys, VAPID material, or provider credential.

Data needed only after opening a protected page is fetched through the normal
authenticated application boundary. Lock screens/shared devices make minimized
content the default; richer content needs later product/privacy approval.

## 23. Server-side content authority and templates

Production dispatch is server-authoritative. Callers may request a bounded type
or create an approved intent, but may not submit arbitrary title, body,
navigation URL/path, or provider payload.

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

`deliverAt` is an optional server-side planning value. No cron, cloud
scheduler, database scheduler, queue vendor, or worker fleet is selected.
Future scheduler invocation is operations-owned and requires bounded retries,
idempotent claiming, multi-instance safety as applicable, and failure
observability.

No quiet hours or user-local schedule is defined. Birth-chart timezone is never
a generic notification delivery timezone.

## 25. Durable outbox and delivery model

Preferred direction:

    application transaction
        -> durable Notification Intent / Delivery record
        -> asynchronous delivery worker
        -> channel adapter
        -> Web Push transport

A focused PostgreSQL delivery/outbox entity may follow typed repository and
numbered migration conventions. This document does not choose table name, SQL,
queue, scheduler, or worker topology.

Minimal bounded lifecycle:

    PENDING -> PROCESSING -> DELIVERED
                        -> FAILED
                        -> CANCELLED

Semantics:

- `PENDING` is attemptable after gates pass;
- `PROCESSING` is a bounded claim, not proof of delivery;
- `DELIVERED` means transport accepted the bounded send at its server boundary,
  not that a person read it;
- `FAILED` is a bounded terminal or retryable outcome, never raw provider
  exception text; and
- `CANCELLED` prevents a pending delivery when a valid lifecycle decision
  requires cancellation.

Retry bookkeeping is separate from user-visible meaning. An in-app inbox is
not required for the initial foundation.

## 26. Deduplication and idempotency

Future triggers may repeat. The platform requires:

- a server-created `intentId` for each logical intent;
- a bounded server-side `dedupeKey` under an approved event contract when
  repeated evaluation represents the same logical event;
- no unbounded equivalent pending deliveries for the same recipient/type scope;
- retries reuse existing intent/delivery identity.

The key must not encode an invented transit formula, raw chart data, endpoint,
browser key, or provider message ID. No astrology-specific formula is defined.
Exactly-once browser display is not claimed.

## 27. Retry model

Retries require bounded attempts, backoff, conditional/idempotent transitions,
no infinite loop, no retry after known invalid/expired subscription, no retry of
permanently ineligible or disabled deliveries, and bounded outcomes.

No numeric retry count, delay, SLA, or provider-specific response mapping is
frozen. Temporary transport failure must be distinct from invalid subscription,
and raw remote errors must not be serialized.

## 28. Invalid subscription handling

When transport establishes expired, gone, or invalid subscription:

1. mark that owner-bound record `INVALIDATED` or equivalent;
2. stop repeated delivery attempts to it;
3. record only a bounded internal outcome; and
4. allow later authenticated owner re-subscription through explicit UX.

Invalidation does not delete unrelated preferences, transfer the endpoint,
reveal provider text, or erase the account.

## 29. Rate-limit and abuse boundary

Future implementation defines bounded controls for subscription
registration/re-registration/removal, preference mutations, intent/dispatch
creation, and any internal diagnostic operation.

Controls use authenticated owner or the existing trusted edge/client boundary as
appropriate, keep credentials out of logs, and prevent notification floods.
Exact limits are not invented; existing P0 staging limits are not a production
delivery SLA.

There is no public arbitrary-push endpoint. A browser cannot supply recipient,
title, body, URL, payload, or provider target to make NatalNode send a message.

## 30. Account Deletion interaction

Future account deletion removes application-owned:

- active PushSubscriptions;
- notification preferences;
- pending intents/delivery jobs; and
- other pending application-owned notification state introduced later.

Ownership remains principal-derived. Deletion cannot claim synchronous erasure
from browser/system surfaces, provider history, hosting logs, backups, or a
notification already displayed on a lock screen.

Delivered operational history, if retained, follows separate approved retention
and erasure policy. No duration or deletion exception is invented. Notification
records require a coordinated successor update to the account-erasure contract.

The B1 account cascade covers the current Consumer preferences and
PushSubscriptions. Future Developer organization/member semantics may require
separate reassignment or organization-level operational-history decisions and
are not resolved here.

## 31. Account Export interaction

If approved, Account Export may include privacy-minimized Consumer metadata:

- channel type, such as Web Push;
- bounded enabled/disabled state;
- createdAt/updatedAt where justified;
- invalidated state where useful and safe; and
- bounded category preferences.

It must not include raw endpoint, `p256dh`, `auth`, VAPID material,
browser subscription JSON, provider responses, sensitive notification history,
or another account's state. The current no-archive export boundary is unchanged.

Future Developer operational membership or configuration may require a
separate export decision; this contract does not resolve it.

## 32. Retention questions

Before durable implementation, coordinated retention policy must decide scope,
owner, duration, exceptions, deletion/backup behavior for:

- active and invalidated subscriptions;
- preferences;
- pending intents and delivery jobs;
- delivery-attempt history;
- delivered history, if retained; and
- provider/platform copies and backup/restore reconciliation.

No duration is selected. This document does not modify
`NATALNODE_DATA_RETENTION_V1.md` or turn technical expiry/invalid state into
retention. Notification persistence requires a coordinated retention update.

Developer operational notification history may require a different retention
owner, duration, or deletion treatment from Consumer PushSubscription and
preference state. Those decisions require the separate Developer contract.

## 33. Privacy Access Audit interaction

Ordinary owner registration, replacement, unsubscribe, preference changes,
delivery attempts, and safe settings views are product operations, not
privileged non-owner access. They are not added to
`PrivacyAccessAuditRepository` merely because endpoint credentials are
sensitive.

A future authorized staff/service surface reading, exporting, deleting, or
reviewing another account's notification data must use the separate Privacy
Access Audit contract: server-derived actor/subject, bounded
category/action/outcome, append-only handling, and approved fail-closed
behavior. No role or privileged surface is created here.

## 34. Operational observability and provider errors

Notification request routes may use the existing canonical bounded
`api.request.completed` boundary. Future delivery operations may expose only
bounded internal metadata such as:

- channel (`WEB_PUSH`);
- bounded notification category/type;
- bounded delivery outcome/state;
- duration; and
- a permitted server request/job correlation value.

Never emit endpoint, keys, VAPID material, provider credentials, email,
user/account ID, chart ID, birth data, location, timezone, full title/body,
ChartRequest, ChartResult, interpretation, payload, URL/query, raw provider
response, raw exception/stack/SQL, retry secrets, arbitrary labels, or dynamic
event names.

Provider errors map to bounded internal classes. Raw remote responses are not
persisted, logged, returned, or used as notification content. Delivery
observability does not prove a user saw a notification.

Developer organization names, API keys, quota details, billing identifiers,
and security-sensitive operational data require a separately approved bounded
observability contract before entering notification telemetry.

## 35. User notification-settings direction

The minimal future surface is:

    Account / Settings
        -> Notifications

It may expose Web Push enabled/disabled state, supported categories, safely
detectable permission/capability state, whether a usable owner-bound
subscription exists without revealing credentials, and a truthful eligibility
explanation.

It must not show raw credentials, invent plan names, claim permission can be
overridden, or become a large dashboard. No UI is built in `001A`; the current
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
`001A` configures none of these gates.

## 41. Provider-selection status

No Web Push provider is selected.

    WEB PUSH PROVIDER DECISION = DEFERRED
    PRODUCTION ASTRONOMY PROVIDER DECISION = DEFERRED

Provider names, URLs, credentials, response schemas, and provider-specific
feature flags must not enter website/domain behavior.

## 42. Dependency-selection status

No dependency is added by `001A`. Future selection evaluates protocol and
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
- durable outbox direction with bounded states/retries; and
- privacy-minimized content and account lifecycle interaction.

It excludes inbox/history, arbitrary test messages, a general messaging bus,
astrology trigger semantics, paid plan logic, and provider-specific UI. Each
item remains deferred until its separately authorized slice and gates exist.

## 44. Implementation-readiness matrix

Readiness identifies a future technical boundary; it is not launch or legal
approval.

| Boundary | Classification | Current state / precondition |
|---|---|---|
| Typed categories, intent, preferences | `IMPLEMENTED LOCALLY / CONSUMER ACCOUNT-OWNED FOUNDATION` | Focused provider-neutral domain; no billing or astrology types invented |
| Owner-bound PushSubscription persistence | `IMPLEMENTED LOCALLY / CONSUMER ACCOUNT-OWNED FOUNDATION` | Typed repository/migration slice; sensitive fields and account ownership fixed here |
| Registration/unsubscribe API boundary | `IMPLEMENTED LOCALLY / CONSUMER AUTHENTICATED API` | Auth principal, same-origin, bounded validation, account-key rate limiting, safe metadata |
| Permission UX/settings UI | `IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE REQUIRED` | Account Notifications UI uses explicit user gestures and all supported/denied/unavailable states |
| Service worker | `IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE REQUIRED` | Root-hosted narrow push/click worker; no fetch/cache/offline or public-development fake |
| Web Push adapter | `OPERATIONS-GATED / PROVIDER-DEPENDENT` | Library/provider decision, credentials, error mapping, operations |
| Durable outbox/worker | `OPERATIONS-GATED` | Persistence, worker/scheduler ownership, claiming, retry, deployment |
| Entitlement integration | `FUTURE SUBSCRIPTION-GATED` | Approved product/billing entitlement source required |
| Astrology alert producers | `ENGINE/TRIGGER-GATED` | Separate source-grounded trigger/scientific contract required |
| Notification retention/enforcement | `POLICY-GATED / OPERATIONS-GATED` | Durations, owners, exceptions, backup/restore, deletion, scheduler |
| Account deletion/export integration | `POLICY-GATED` | Coordinated successor amendments to existing contracts required |
| Privileged notification-data review | `POLICY-GATED / DEFERRED` | No role/surface exists; use separate audit contract later |
| Live browser/HTTPS/provider acceptance | `LIVE-EXTERNAL-GATED` | Deployment, credentials, browser matrix, provider behavior |

`LOCAL IMPLEMENTATION READY` identifies a safe future slice; it does not
authorize implementation automatically. Policy, operations, subscription,
trigger, and live gates must not be hidden in local code.

## 45. Future implementation slices

These are bounded candidates and are not executed by `WEB-NOTIFY-001A`:

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
- `WEB-NOTIFY-001B3` — **IMPLEMENTED LOCALLY / VISUAL ACCEPTANCE REQUIRED /
  LIVE WEB PUSH DELIVERY NOT IMPLEMENTED**: Account Notifications settings,
  explicit permission flow, root-hosted Service Worker, browser
  registration/removal choreography, safe public-key capability, bounded
  payload/click handling, and conflict-safe account switching. No server
  delivery or private VAPID credential is implemented.
- `WEB-NOTIFY-001B4` — **NOT STARTED**: outbox, delivery worker, Web Push
  adapter, private VAPID operations, and live delivery remain deferred.
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

Implemented locally with visual acceptance still required. The Account
Notifications surface uses an explicit user-gesture-only permission flow,
separately detects Notification, Service Worker, and PushManager support,
registers the root-hosted worker only after permission is granted, maps only
the native endpoint and p256dh/auth keys to the B2 registration API, and keeps
account switching/disable conflicts fail-closed. The worker accepts only the
bounded V1 payload and approved same-origin paths, has no fetch/cache/offline
behavior, and uses a generic fallback for invalid payloads. No automatic
permission prompt, private VAPID credential, server delivery, provider, or
public-development fake is included. **VISUAL ACCEPTANCE REQUIRED.**

### `WEB-NOTIFY-001B4` — Outbox, worker, and Web Push adapter

**NOT STARTED.** Implement delivery records, bounded claiming, retries/backoff,
invalidation, server-owned templates, and an isolated standards-based adapter
only after operations/provider/credential decisions. No arbitrary dispatch API.

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
3. preference schema and locale/delivery-timezone policy;
4. production service-worker cache scope and static deployment details beyond
   the narrow B3 root-hosted worker;
5. Web Push library/provider and browser compatibility;
6. VAPID ownership, storage, rotation, and secret operations;
7. subscription encryption-at-rest, grants, and backup access;
8. exact API routes, validation, rate-limit values, and conflict responses;
9. durable table/migration shape, worker topology, scheduler, and claim lease;
10. retry counts, backoff, provider outcome mapping, and delivery SLA;
11. templates, localization source, and safe content lengths;
12. deletion/export treatment for every persisted notification field;
13. retention durations/owners for subscriptions, jobs, attempts, and history;
14. privileged-data roles, audit review, and break-glass behavior;
15. any non-deceptive public-development fixture policy;
16. HTTPS/live browser/provider acceptance and production gates; and
17. any change to the historical P0 checkpoint or deferred P0 decision packet;
18. the Developer operational notification domain, including organization and
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

After this local browser foundation, the next required action is:

**`PRODUCT-OWNER VISUAL ACCEPTANCE` — review desktop and mobile Account
Notifications states, including default, denied, and connected states only
when legitimately available.**

This is a visual/product gate for the local B3 surface. It does not authorize
B4 delivery, private VAPID credentials, a provider, an inbox, billing,
astrology-trigger work, or Developer operational notifications. Do not execute
`WEB-NOTIFY-001B4` automatically.

## 50. Runtime-source, dependency, and migration integrity

`WEB-NOTIFY-001B3` is a local browser-foundation implementation. Its completion
boundary is:

- additive server-owned public-key capability and notification response type;
- Account Notifications UI and browser orchestration only;
- one root-hosted static Service Worker with push/click handlers only;
- focused characterization tests without a new test framework;
- no new package dependency or lockfile change;
- no database migration or schema change;
- no delivery worker, scheduler, provider, private VAPID credential, or
  server-side push send;
- no EngineClient, HTTP, astronomy, chart, Auth, Vault, BFF, or unrelated page
  implementation change; and
- no access to or modification of `C:\\NatalNode`.

The existing B1/B2 persistence and API contracts remain additive-compatible;
Account Export, Account Deletion, Privacy Access Audit, and historical P0
documentation are not reopened by B3.

## 51. Validation boundary

This implementation uses only focused notification tests, source checks,
workspace checks/builds, the static worker artifact check, and:

- `npm run check`;
- focused browser and Service Worker characterization tests;
- focused server capability and notification-route tests;
- `npm run build:server` because server runtime configuration changed;
- `npm run build` because the Astro application changed; and
- `git diff --check`, `git diff --stat`, `git diff --name-status`, and
  `git status --short`.

Broad unrelated suites, database/migration commands, live Web Push delivery,
provider calls, and browser permission automation are intentionally not run.

## 52. Freeze conclusion

    Notification Platform             = TECHNICAL CONTRACT FROZEN
    Initial channel                   = WEB PUSH / PROVIDER-NEUTRAL
    Notification vs Billing           = SEPARATE
    Notification vs Astrology Triggers = SEPARATE
    Subscription ownership             = AUTHENTICATED ACCOUNT / ONE ACTIVE OWNER
    Permission UX                      = EXPLICIT USER GESTURE ONLY
    Payload privacy                    = MINIMIZED / LOCK-SCREEN SAFE BY DEFAULT
    Delivery architecture              = DURABLE OUTBOX + ASYNCHRONOUS WORKER DIRECTION
    In-app notification center         = DEFERRED / NOT REQUIRED FOR INITIAL FOUNDATION
    Provider/library selection          = DEFERRED
    Billing/subscription implementation = DEFERRED
    Astrology trigger implementation    = DEFERRED
    Runtime implementation             = B3 LOCAL BROWSER FOUNDATION; LIVE DELIVERY NOT IMPLEMENTED
    Live/deployment acceptance          = VISUAL ACCEPTANCE REQUIRED / LIVE EXTERNAL GATES OPEN
    Historical P0 status               = PRESERVED; NEW SCOPE AFTER WEB-P0-READY-003
    WEB-P0-POLICY-001A                 = NOT EXECUTED / DEFERRED
    WEB-NOTIFY-001B4                   = NOT STARTED

The B3 foundation is complete locally at the implementation boundary. No
automatic browser permission is requested, no notification is sent, and no
subscription/payment/provider decision or live delivery acceptance is implied
by this document.
