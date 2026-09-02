# NatalNode Privacy & Terms Product Policy Contract V1

**STATUS: PRODUCT POLICY BASELINE**
**NOT LEGAL COUNSEL**
**FINAL PUBLIC LEGAL COPY REQUIRES APPROVAL**

## 1. Purpose, authority, and use

This contract freezes the repository-supported product and data-processing facts that may inform a later NatalNode Privacy Policy and Terms of Service. It is not public legal copy, a legal opinion, a processor agreement, or approval to publish `/privacy` or `/terms`.

This contract is authoritative for product implementation planning until superseded by an explicitly approved decision or later verified implementation. Repository behavior remains authoritative where implementation changes after this baseline.

Every statement is classified as one of four non-interchangeable categories:

- **A. CONFIRMED CURRENT PRODUCT BEHAVIOR** — observed in the current repository at baseline `9f7d406aa8e581c741fa5cfaaf1150569463b4e1`.
- **B. APPROVED PRODUCT PRINCIPLES** — requirements frozen by the PRD, roadmap, or accepted ADRs; these are not proof that the requirement is implemented or operationally live.
- **C. UNRESOLVED POLICY DECISIONS** — facts or commitments that must be approved before corresponding public legal copy is written.
- **D. FUTURE / DEFERRED FEATURES** — not current processing and not safe to describe as active.

Status labels used below are precise:

- **IMPLEMENTED** — runtime or persistence code exists.
- **CONFIGURED ARCHITECTURE / NOT LIVE** — an architecture has been accepted, but repository and deployment evidence do not establish a live service.
- **PLANNED / DEFERRED** — product intent exists without current implementation.
- **UNKNOWN / POLICY DECISION REQUIRED** — the repository does not establish the fact or commitment.

The legal operating entity, legal controller identity, address, jurisdiction, minimum age, legal retention periods, arbitration, liability, indemnity, warranties, refunds, billing terms, copyright licenses, and processor contracts are not established by this repository and are not invented here.

## Current launch-readiness implementation amendment

The implementation and gap tables below are historical policy-baseline
language. Since that baseline, local Account Erasure, Account Export, Auth
cleanup, Google local boundaries, Privacy Access Audit durable core,
Foundations/Reward, Community, Practitioner, and notification persistence have
landed in bounded tracks. They do not establish legal approval, live provider
configuration, production operations, or final public copy. Remaining legal,
owner-policy, processor, backup/log, and scientific gates are consolidated in
[`NATALNODE_P0_LAUNCH_READINESS_V1.md`](./NATALNODE_P0_LAUNCH_READINESS_V1.md).

## A. Confirmed Current Product Behavior

### A.1 Current trust and data-flow boundary

The implemented browser-to-server boundary is same-origin:

```text
Browser
  -> NatalNode static Astro/React application
  -> same-origin Website API / BFF at /api/*
       -> PostgreSQL repositories for Auth, Vault, notes, and Feedback
       -> Resend email delivery when executable configuration is supplied
       -> EngineClient
```

The only executable Engine mode accepted by the current repository is the in-process `development-mock`. A guest or authenticated chart calculation sends a normalized chart request from the browser to same-origin `POST /api/chart`; the BFF passes that request to its `EngineClient`, and the current executable binds a `MockEngineClient`. No production Engine service or astronomy provider is selected or implemented here. **PROVIDER DECISION DEFERRED** remains authoritative.

The current location/timezone resolver is a browser-side development fixture. It does not call a geocoding or historical-timezone processor. It supplies fixed development coordinates and timezone metadata and is explicitly not production resolution.

Learn and Tools are public, indexable static content surfaces. Public pages may emit first-party `WebSite` or `Article` JSON-LD. The sitemap includes only approved public routes and published Learn content. Auth, Vault, Feedback, and API paths are disallowed by `robots.txt`; Auth, Vault, and Feedback pages also emit `noindex,nofollow`. Robots directives reduce search indexing; they are not access control. API authentication and owner scoping are the access-control boundaries.

### A.2 Factual data inventory

In this inventory, “owner/control” describes current product access or mutation control, not the unresolved legal-controller identity in P-01.

| Data category | Collected or generated today? | Transmitted today? | Persisted today? | Current purpose | Product owner/control | Deletion relationship | Application logging status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Email address | Yes. The sign-in request accepts an email, validates it, then normalizes it by trimming and lowercasing. | Browser -> same-origin BFF. The normalized address is sent to Resend with authentication-email content when the adapter is configured and invoked. | Yes. `email_magic_link_challenges.email_normalized` is written for each accepted challenge. After successful completion it is also the `EMAIL_MAGIC_LINK` identity's `provider_subject`. The original non-normalized input is not a database field. | Request and deliver a sign-in link; resolve an email identity to an account. | User supplies the address; Auth controls identity resolution and storage. Legal controller is unresolved. | No user-facing deletion. Identity rows would cascade from a future user-row deletion. Challenge rows have no user foreign key and no deletion method or cleanup job. | Not included in application operational logs. Provider and infrastructure logging/retention are unknown. |
| Authentication identity and provider | Yes, on successful magic-link completion. | Internal BFF/repository flow; current session responses expose only an authenticated boolean. | Yes: opaque identity ID, user ID, provider, provider subject, and timestamps. | Map a login identity to one website account. | Server-owned identity record associated with the account principal. | Database identity rows cascade if a user row is deleted, but no account-deletion route exists. | Not logged. |
| Account and opaque internal IDs | Yes. User, identity, chart, note, feedback, challenge, and request IDs are server-generated. | Relevant user-owned record IDs are returned only through authenticated Vault/note APIs; feedback ID is not returned. User ID is present in authenticated Vault/note response records. | Yes where part of account, Auth, Vault, note, or Feedback records. Request IDs are not database-persisted by the application. | Identity, ownership, record lookup, and request correlation. | Server-generated; user-owned records are scoped to the authenticated principal. | Chart and note IDs disappear with direct record deletion. User deletion is absent. Feedback deletion is absent. | Request ID is logged; account/user and dynamic resource IDs are not logged. |
| Magic-link token and challenge metadata | Yes. A high-entropy token, challenge ID, creation time, expiration time, and later consumption time are generated. | The final email contains a token-bearing fragment URL sent through Resend to the user. The browser reads the fragment, removes it from visible URL/history, and posts the token to same-origin completion. | Plaintext token: no. Only its hash is persisted with normalized email and challenge timestamps. | One-time authentication challenge. | Auth runtime controls issuance and atomic one-time consumption. | Technical expiry and consumption block use but do not delete the row. No cleanup job exists. | Token, URL fragment, email content, and request body are not logged by application logging. |
| Session identifier | Yes. A high-entropy session token is generated after successful authentication. | Server -> browser in an HttpOnly cookie; browser -> same-origin BFF in the cookie. | Plaintext token: only in the browser cookie. Database: only the token hash, user ID, creation time, and expiration time. | Authenticate subsequent requests. | Server owns session validity; the browser holds the host-only cookie. | Logout deletes only the matching current session row when the cookie is present and always clears that cookie. Technical expiry blocks authentication but does not delete an expired row. User-row deletion would cascade sessions, but account deletion is absent. | Cookie, token, token hash, and user ID are not logged. |
| Birth date | Yes, entered in the browser. | Included in normalized `ChartRequest` sent to same-origin `/api/chart`; also sent to `/api/vault/charts` when an authenticated user saves. | Guest calculation: no server persistence. Saved Vault chart: yes, inside `normalized_input` JSON. | Resolve birth input, request chart calculation, display a chart, optionally save it. | User supplies it; a saved chart is owner-scoped to the authenticated principal. | Guest page-memory state ends with page lifecycle. Saved value is removed by owner-scoped chart deletion; account-wide deletion is absent. | Not logged. |
| Birth time | Yes when known; otherwise represented as `null`. | Same as birth date. | Same as birth date when a chart is saved. | Resolve time-sensitive chart input and calculate a chart. | Same as birth date. | Same as birth date. | Not logged. |
| Unknown birth-time state | Yes, as `UNKNOWN_TIME` with a null local time and null time-resolution values. | Included in the normalized request. | Persisted only when that request is saved to Vault. | Preserve uncertainty and avoid silently substituting an exact time. | User selects the state; calculation contract preserves it. | Same as the saved chart containing it. | Not logged. |
| Birth-place label | Yes, entered in the browser. | Included in the normalized request. | Persisted only when saved to Vault. | Identify the supplied place and support birth-input resolution/display. | User supplies it. | Same as the saved chart containing it. | Not logged. |
| Latitude and longitude | Yes, currently generated by the browser-side development resolver rather than a production location service. | Included in normalized requests to the BFF. | Persisted only when a chart is saved. | Provide geographic input for chart calculation. | Derived resolution metadata attached to the user's chart input. | Same as the saved chart containing it. | Not logged. Raw coordinates are not included in operational logs. |
| IANA timezone and resolution metadata | Yes: IANA timezone, resolved UTC instant when available, UTC offset when available, timezone database version, resolution method, and ambiguity status. Current values come from development fixtures. | Included in normalized requests to the BFF. | Persisted only when a chart is saved. | Preserve explicit timezone-resolution context for calculation and trust display. | Derived resolution metadata attached to the user's chart input. | Same as the saved chart containing it. | Not logged. |
| Normalized chart request | Yes, assembled in the browser from resolved birth input plus house system. | Browser -> same-origin chart or Vault API; BFF -> current in-process EngineClient. No current external astronomy processor is established. | No for ordinary guest/authenticated calculation through `/api/chart`; yes for an authenticated Vault save. | Calculate and, when requested, reproduce the saved input snapshot. | In-memory request belongs to the current user interaction; saved request belongs to the authenticated Vault principal. | Saved request is removed with its chart. No account-wide deletion exists. | Request body is not logged. |
| Canonical chart result | Yes, returned by the current development-mock EngineClient. | BFF -> browser. On Vault save, BFF recalculates and then returns/persists the result. | No for `/api/chart`; yes for saved Vault records. | Display the chart and preserve the server-returned result snapshot. | Saved result belongs to the authenticated Vault principal. | Removed with the saved chart. | Response payload is not logged. |
| Chart facts | Yes, as bodies, angles, houses, aspects, warnings, and calculation status inside the canonical result. | Same as canonical result. | Persisted only as part of a saved canonical result. | Chart presentation, calculation details, and deterministic interpretation. | Same as canonical result. | Removed with the saved chart. | Not logged. |
| Scientific metadata | Yes, as engine version, schema version, configuration status, astronomy configuration ID when complete, provenance envelope ID when available, and incomplete-research reason/status. Calculation warnings are separate fields in the canonical chart result. | BFF -> browser; persisted on Vault save. | Yes for saved charts, including dedicated version/identity fields and the canonical result. | Provenance/trust display and saved-result traceability. | Same as the saved chart. | Removed with the saved chart. | Current operational logs do not include these values, even though the PRD permits a bounded subset. |
| Deterministic astrology interpretations | Yes, derived in the browser from returned chart facts. | No separate interpretation API or third-party transmission is implemented. | Not stored as a separate field in current persistence. | Present chart facts as interpretive astrology content. | Exists in the user's current browser experience. | Ends with page state; a saved result can later regenerate it. | Not logged. |
| Vault display name | Yes, supplied on save and editable. | Browser <-> authenticated Vault API. | Yes. | User-facing chart identification. | Authenticated chart owner. | Removed with chart or future user-row cascade. | Not logged. |
| Vault category | Yes: `SELF`, `PARTNER`, `FAMILY`, `FRIEND`, or `CLIENT`. | Browser <-> authenticated Vault API. | Yes. | Organize saved charts. | Authenticated chart owner. | Removed with chart or future user-row cascade. | Not logged. |
| Vault tags and favorite state | Yes, supplied on save and editable. | Browser <-> authenticated Vault API. | Yes. | Organize and mark saved charts. | Authenticated chart owner. | Removed with chart or future user-row cascade. | Not logged. |
| Chart notes | Yes, as owner-entered plain text. | Browser <-> authenticated, chart-owner-scoped note APIs. | Yes: note ID, chart ID, user ID, content, creation time, and update time. | Private notes attached to a saved chart. | Authenticated owner of the referenced chart; caller cannot select another owner. | Individual note deletion exists. Deleting its chart cascades the note. A future user-row deletion would also cascade notes. | Note content and IDs are not logged. |
| Private Feedback | Yes: category and normalized plain-text message. | Browser -> authenticated same-origin Feedback API. It is not sent to the Engine, Resend, analytics, advertising, or another external processor by this route. | Yes: opaque feedback ID, user ID, category, message, and creation time. | Private product-support intake. | Ownership is server-bound to the authenticated principal. The user has no read/history/update/delete interface after submission. | No direct Feedback deletion. A future user-row deletion would cascade Feedback, but no account-deletion capability exists. | Message, category, user ID, request body, and feedback ID are not logged. |
| Request IDs and operational request metadata | Yes. A fresh server request ID and timestamp are generated for each API request. | Request ID is returned in `X-Request-Id`; structured records are written to process stdout/stderr. | Not in application PostgreSQL. Any downstream log storage and retention are unknown. | Request correlation and operational diagnosis. | Server operational data; legal controller and authorized staff access are unresolved. | No application log-deletion interface or configured retention policy is established. | The log record itself contains timestamp, level, bounded event, request ID, bounded method, endpoint family, status, and optional duration only. |
| IP/network metadata | Raw client IP may reach a trusted edge and the API's dedicated `X-NatalNode-Client-IP` boundary. The application reads that header only for rate limiting. | Trusted edge -> private API when that topology is used. The current local edge overwrites inbound values from its direct socket peer. | Raw address: not persisted or logged by application code. A process-local salted HMAC-derived rate-limit key is kept only in fixed-window memory. Hosting/network access-log behavior is unknown. | Abuse-rate limiting. | Operational security boundary. | In-memory HMAC keys expire/prune with limiter windows or process lifetime. Downstream infrastructure handling is unknown. | Raw IP is not in application operational logs. |
| User-agent metadata | It can arrive as an ordinary HTTP header, but no inspected application module reads it for product behavior. | Normal HTTP transport may carry it to edge/API infrastructure. | Not persisted by application repositories. Infrastructure/access-log behavior is unknown. | No current application purpose. | UNKNOWN at infrastructure layer. | UNKNOWN at infrastructure layer. | Not in application operational logs. |
| Record timestamps | Yes: account, identity, challenge, session, chart, note, feedback, and request-event timestamps as applicable. | Returned with authenticated Vault/note records; operational timestamps are emitted to logs. | Yes with the associated database record; request-log persistence downstream is unknown. | Ordering, validity, update tracking, and operations. | Follows the associated record. | Follows the associated record; no global retention automation exists. | Only operational-event timestamp is logged. |

### A.3 Sensitive birth-data processing

Birth date, birth time, and birth place are sensitive personal data under the approved PRD rule. The normalized request additionally carries coordinates, IANA timezone, time-resolution metadata, ambiguity/unknown-time state, and a derived chart result containing chart facts and scientific metadata.

Current permitted functional purposes are limited to:

1. resolving birth input;
2. calculating a chart through the Website API / EngineClient boundary;
3. displaying the chart and its calculation details/interpretation; and
4. optionally saving the normalized request and canonical result for an authenticated Vault owner.

The unauthenticated chart route does not write the request or result to a repository. Browser request/result state exists only in the mounted React experience and is lost with page lifecycle. No current code writes guest charts to `localStorage`, `sessionStorage`, IndexedDB, or a server-side guest store.

### A.4 Authentication, session, and token behavior

Current authentication is Email Magic Link only:

1. The browser sends one email field to `POST /api/auth/email/request` using same-origin credentials and no-store caching.
2. The server validates the address, normalizes it by trim plus lowercase, creates a challenge, and persists the normalized email, token hash, and timestamps before delivery.
3. The configured Resend adapter receives the normalized recipient and a complete sign-in email containing the token-bearing application URL and expiration notice. Resend is not given a separate token field, but the final email content necessarily contains the sign-in URL credential.
4. The browser completion page reads the token from the URL fragment, removes the fragment with `history.replaceState`, and posts the token once to the same-origin completion endpoint. It does not write the token to browser storage.
5. The server hashes the presented token, atomically consumes an unexpired unused challenge, resolves or creates the `EMAIL_MAGIC_LINK` identity/account, generates a session token, persists only its hash, and sets the plaintext session token in a cookie.
6. The current-session endpoint returns only `{ authenticated: boolean }`.
7. Logout attempts to delete the current matching session-hash row and always emits a clearing cookie. It does not revoke other sessions and does not delete the account.

The cookie is host-only because no `Domain` attribute is set. It is `HttpOnly`, `SameSite=Lax`, and `Path=/`, with an expiration matching the configured session expiration. The `Secure` attribute is configuration-dependent in code; accepted staging architecture requires it to be enabled. There is no verified live production configuration.

Magic-link and session lifetimes are required positive-integer deployment settings. Their deployed values are not established in this repository and are not stated here. Technical expiry prevents authentication after expiry; it is not a deletion or legal-retention policy.

The shared `AuthProvider` type and database check permit `GOOGLE`, but no Google OAuth route, browser flow, OAuth state/PKCE handling, token exchange, or Google processor integration exists.

**Google Sign-In status: PLANNED / DEFERRED — P0 GAP.** Public copy must not claim Google processing is active.

### A.5 Vault ownership, fields, notes, and deletion

Vault APIs require a server-authenticated principal. A request cannot supply or override `userId`; routes derive it from the session. Every chart lookup, list, metadata update, and delete query is scoped by both `userId` and chart ID. No public-sharing route or public Vault rendering exists.

Each saved chart persists:

- opaque chart and user IDs;
- display name;
- category;
- tags;
- favorite state;
- complete normalized chart request, including birth and timezone-resolution input;
- complete canonical Engine result;
- engine version;
- chart schema version;
- astronomy configuration ID when available;
- provenance envelope ID when available; and
- creation/update timestamps.

The server recalculates a submitted request before saving and persists the server-returned canonical result rather than trusting a browser-supplied result.

Chart metadata fields—display name, category, tags, and favorite—are editable without mutating the saved normalized request or canonical result. There is no in-place edit API for the saved birth request/result snapshot.

Notes persist note ID, chart ID, user ID, plain-text content, and creation/update timestamps. Note list/create/update/delete first verifies ownership of the parent chart. Individual note deletion exists.

Individual chart deletion exists and is owner-scoped. The `chart_notes.chart_id -> charts.chart_id ON DELETE CASCADE` relationship deletes associated notes with the chart. User foreign keys for identities, sessions, charts, chart notes, and Feedback also specify `ON DELETE CASCADE`; those database semantics do not constitute an implemented account-deletion feature.

### A.6 Account deletion and export truth

- **Account deletion: NOT IMPLEMENTED — P0 PRIVACY IMPLEMENTATION GAP.** There is no route, repository deletion operation, browser flow, or verified manual mechanism.
- **Account-wide erasure: NOT IMPLEMENTED.** Existing cascades would remove user-linked identity, session, Vault, note, and Feedback rows if a user row were deleted, but no code performs that operation. Magic-link challenge rows are keyed by normalized email and have no user foreign key, so an account-deletion design must explicitly define their erasure relationship.
- **User data export: NOT IMPLEMENTED — P0 PRIVACY IMPLEMENTATION GAP — USER DATA EXPORT.** Vault reads are not a full-user export and Feedback has no user-facing read API.

Public copy must not say that users can delete their account, erase all data, or download all personal data today.

### A.7 Private Feedback boundary

Private Feedback is implemented as authenticated, create-only product-support intake at `/feedback` and `POST /api/feedback`. The page is `noindex,nofollow`, excluded from the sitemap, and renders only a non-sensitive form shell until browser-side session confirmation. API authentication is authoritative.

The only accepted categories are:

- `BUG` — Bug;
- `SUGGESTION` — Suggestion;
- `CALCULATION_CONCERN` — Incorrect result / calculation concern; and
- `OTHER` — Other.

The persisted record contains only feedback ID, authenticated user ID, category, normalized message, and creation time. The request cannot provide an owner. Feedback is not publicly rendered, and no read/history/detail/update/delete API exists.

No chart ID, saved chart, chart facts, birth data, source page, referrer, attachment, screenshot, browser/device fingerprint, user-agent, or application-level IP address is automatically attached. A calculation-concern submission is ordinary user-entered plain text; users may voluntarily type personal data into that text, so public form guidance must not claim that Feedback can never contain personal data.

### A.8 Logging, diagnostics, and privacy findings

The application emits privacy-bounded JSON operational records. Completion records contain only:

- timestamp;
- level;
- bounded event name;
- server-generated request ID;
- bounded HTTP method;
- bounded endpoint family rather than raw path/dynamic IDs;
- response status; and
- duration for completion records.

Unhandled-error records omit the error object, message, stack, and cause. The logging schema does not include query strings, headers, cookies, tokens, request/response bodies, email, birth data, coordinates, chart data, Vault metadata, note content, Feedback content/category, account ID, raw IP, or user-agent.

Application logs are written to process stdout/stderr. The repository does not establish who can access downstream logs, where a host stores them, or how long they are retained. Those are P-09 and launch-operations decisions.

**Confirmed P0 privacy retention implementation gap:**

- `server/db/migrations/0002_auth_runtime.sql` stores normalized email and token hash in `email_magic_link_challenges`, and stores session-token hashes in `auth_sessions`.
- `server/src/persistence/postgres/postgres-email-magic-link-challenge-repository.ts` supports create and consume only.
- `server/src/persistence/postgres/postgres-auth-session-repository.ts` deletes only by a presented current token hash during logout.
- No inspected job or repository operation purges expired/consumed challenges or expired sessions.

Risk: records that are technically unusable can accumulate after their active authentication use, including normalized email in challenge rows and one-way token/session hashes. Expiry is correctly enforced for authentication, so this is not evidence that expired credentials remain usable; it is a data-minimization risk and a verified retention-enforcement gap. The cleanup behavior and retention schedule require a separate bounded task and approved policy. No code is changed by this contract.

No unexpected sensitive-payload application logging was found. Infrastructure access logs, managed-database logs, Resend retention, and future hosting logs remain unknown and must not be represented as absent.

### A.9 Cookies and browser storage

| Mechanism | Current status | Current purpose and facts |
| --- | --- | --- |
| Essential authentication cookie | IMPLEMENTED | One opaque session credential; host-only, HttpOnly, `SameSite=Lax`, `Path=/`, expiration set. `Secure` depends on configuration and is required by accepted staging architecture. No JavaScript session-token state is used. |
| Magic-link URL fragment | TRANSIENT | Read once by the first-party completion page, removed from visible URL/history, then posted to same-origin BFF. Not a cookie and not written to browser storage. |
| `localStorage` | CURRENTLY ABSENT | No browser source use found. |
| `sessionStorage` | CURRENTLY ABSENT | No browser source use found. |
| IndexedDB | CURRENTLY ABSENT | No browser source use found. |
| Guest chart state | IN-MEMORY ONLY | Normalized request and returned result live in React state for the current mounted page. |
| Device local time | IN-MEMORY/DISPLAY ONLY | First-party shell reads device time to render ambient local-time UI; no inspected persistence or transmission. |
| Analytics/advertising cookies or browser identifiers | CURRENTLY ABSENT | No analytics, advertising, fingerprinting, or CMP implementation was found. |

The current cookie inventory is therefore essential-authentication-only at the application layer. Whether the eventual public policy needs a consent banner for that cookie, and how future non-essential technology changes the consent model, are policy/legal decisions; absence of a banner today is not a legal conclusion.

### A.10 Retention truth

No product/legal retention durations are approved or implemented. Current technical behavior is:

| Record/system | Current retention behavior | What must not be claimed |
| --- | --- | --- |
| User account and Auth identity | Persists with no automated expiry. No account deletion exists. | Do not claim an account-retention duration or user-controlled account deletion. |
| Magic-link challenge | Technically unusable after configured expiry and one-time consumption, but the row, normalized email, hash, and timestamps are not automatically deleted. | Do not say expired links or associated records are deleted at expiry. |
| Auth session | Server rejects a row after configured expiry. Logout deletes the current matching row. Expired rows have no cleanup job. | Do not equate session expiry with database erasure. |
| Vault chart | Persists until the owner deletes that individual chart or a future user-row deletion occurs. No inactivity expiry exists. | Do not publish a fixed period or promise account-wide erasure. |
| Chart note | Persists until individual deletion, parent-chart cascade, or future user-row deletion. | Do not publish a fixed period. |
| Private Feedback | Persists with no individual deletion interface or automated expiry; the schema would cascade on future user-row deletion. | Do not publish a fixed period or claim withdrawal/deletion is available. |
| Application operational logs | Emitted to stdout/stderr; downstream persistence and retention are unknown. | Do not claim logs are not stored or are deleted after a particular period. |
| Rate-limit state | Process-local, salted HMAC-derived fixed-window keys; raw addresses are not retained. Entries expire/prune in memory and disappear with process lifetime. | Do not generalize this to hosting/network access logs. |

### A.11 Current processor and integration status

| Processor/integration | Status | Current data boundary | Public-copy constraint |
| --- | --- | --- | --- |
| Resend | IMPLEMENTED ADAPTER / LIVE DEPLOYMENT NOT VERIFIED | When configured and called, receives normalized email and authentication email content, including the token-bearing sign-in URL and expiry notice. Repository code adds no application logging or retry. Provider-side storage, logs, contracts, and retention are unknown. | It may be described as current only for an actually configured live environment. Do not claim a DPA, location, retention term, or tracking setting is operationally verified. |
| PostgreSQL | IMPLEMENTED PERSISTENCE CATEGORY | Concrete repositories persist Auth, Vault, notes, and Feedback. | Managed provider, region, backup, encryption-at-rest configuration, and production status are unknown. |
| Railway | CONFIGURED ARCHITECTURE / NOT LIVE | Selected for a future P0 development/research staging edge, API, and managed PostgreSQL topology. No deployment composition/provisioning evidence establishes a live staging processor. | Do not describe Railway as current production hosting. Production hosting remains unselected. |
| Current EngineClient | IMPLEMENTED DEVELOPMENT MOCK | The BFF receives normalized requests and calls an in-process mock. | Do not claim production calculation, production scientific validation, or an external astronomy processor. |
| Production Engine / astronomy provider | PLANNED / DEFERRED | Future provider-neutral Engine Public API boundary only. | **PROVIDER DECISION DEFERRED.** Do not name or choose a scientific provider. |
| Google Sign-In | PLANNED / DEFERRED — P0 GAP | Enum/schema allowance only; no Google request or token processing. | Do not disclose Google as an active sign-in processor. |
| Sentry | PLANNED IN PRD / NOT IMPLEMENTED | No integration or dependency found. | Do not claim Sentry receives current data. |
| OpenTelemetry | OPTIONAL IN PRD / NOT IMPLEMENTED | No integration found. | Do not claim current telemetry export. |
| Analytics providers | NOT CURRENT | No analytics integration or browser storage found. | Any future provider/events/consent require P-11. |
| Advertising providers/CMP | NOT CURRENT | No ads, targeting integration, or CMP found. | Any future use requires P-12 and must preserve the approved birth/chart advertising prohibition. |
| Payment/subscription processor | NOT CURRENT | No subscription, billing, checkout, or payment processing implementation found. | Do not publish paid-plan, billing, cancellation, or refund claims. |

## B. Approved Product Principles

The following are approved product requirements. They must not be presented as implemented facts unless separately verified:

1. Birth date, birth time, and birth place are sensitive personal data. Coordinates, timezone-resolution context, and derived chart results must receive corresponding privacy-aware handling.
2. Birth processing is purpose-limited to resolving input, calculating and displaying a chart, and optionally saving it for an authenticated user.
3. User birth data, chart facts, and astrology interpretations must **not** be directly sent to advertising platforms as targeting profiles.
4. Advertising is not currently implemented. Calculate, Birth Input, Chart Workspace, Interpretation, Calculation Details, Vault, and Auth are frozen ad-free core surfaces. Learn and educational Tools are only potentially ad-eligible after separate monetization, privacy, consent, and CMP decisions.
5. Guest chart generation does not require an account. Guests receive no permanent cross-device Vault and no cloud-storage promise.
6. Private Feedback remains authenticated, private, non-indexed, product-support oriented, and separate from public Community/Questions. It does not automatically attach charts or birth data.
7. Privacy launch requirements include TLS in transit, encryption at rest, least privilege, account/data deletion, user data export, retention policy, and access audit. Current implementation/operations satisfy only parts of that list.
8. Security requirements include secure session cookies, SameSite policy, same-origin/CSRF protection where applicable, rate limits, input validation, safe database access, security headers, and secrets outside the repository.
9. The Web product remains provider-neutral and consumes scientific facts only through the EngineClient/Engine Public API boundary. Production scientific-provider and rights decisions remain external and deferred.
10. Public legal copy may describe only confirmed current behavior, approved principles that are accurately labeled as policy, and explicitly approved C decisions. It may not convert a requirement into a claim of present capability.

### B.1 Advertising boundary

The approved boundary is categorical:

```text
User birth data + chart facts + astrology interpretations
  MUST NOT be directly sent to advertising platforms as targeting profiles.
```

No advertising, ad SDK, analytics integration, targeting profile, or CMP exists today. Learn/Tools eligibility is a future surface decision, not consent to implement ads. Core ad-free status is a product principle independent of any future subscription tier.

## C. Unresolved Policy Decisions

All unresolved decisions are enumerated in `## Decisions Required Before Public Legal Copy`. Until approved, the repository truth is **UNKNOWN / POLICY DECISION REQUIRED**. Recommendations there are non-legal product defaults only; they are not final decisions or public commitments.

## D. Future / Deferred Features

The following must remain separate from current behavior:

- Google Sign-In: deferred implementation and current P0 Auth gap.
- Production Engine integration, production astronomy, production location/timezone data source, and scientific provider: deferred/external; **PROVIDER DECISION DEFERRED**.
- Analytics and observability vendors beyond current first-party structured logs: deferred.
- Advertising, ad targeting, and CMP/consent architecture: deferred.
- Pro subscriptions, paid plans, billing, payments, refunds, PDF/share export, and higher AI quota: not live and deferred.
- AI interpretation: P1/deferred; no unlimited-AI promise is allowed.
- Public Community/Questions, public user content, Practitioner profiles/network, practitioner marketplace, moderation, and content licensing: deferred and absent.
- Public chart sharing and cross-device guest recovery: absent and not approved as current behavior.
- Railway staging implementation/provisioning: deferred; accepted staging architecture is not evidence of a live deployment or a production host.

## User-Rights Product Capability Matrix

This matrix reports product mechanisms, not a legal determination of statutory rights.

| Capability | Product requirement | Implemented today | Gap | Launch requirement |
| --- | --- | --- | --- | --- |
| Access saved charts | Registered users can list/open their Vault | Yes, owner-scoped list and detail APIs/UI | No full-account export; API returns full saved records to authenticated owner | Keep authorization and private/noindex treatment verified |
| Edit Vault metadata | Rename, categorize, tag, favorite | Yes | Saved normalized birth request/canonical result are immutable snapshots | Current metadata capability is sufficient; correction semantics for snapshot data must be described accurately |
| Delete individual chart | Vault delete | Yes | None for individual chart | Verify note cascade and owner scoping remain intact |
| Delete chart notes | Notes management | Yes | None for individual note | Current capability implemented |
| Account deletion | PRD requires delete account/data | No | **P0 PRIVACY IMPLEMENTATION GAP**; no route/repository/UI/manual mechanism; challenge-email erasure relationship also unresolved | **P0 BEFORE PUBLIC LAUNCH** |
| Data export | PRD requires export user data | No | **P0 PRIVACY IMPLEMENTATION GAP — USER DATA EXPORT**; Feedback cannot be read by user | **P0 BEFORE PUBLIC LAUNCH** |
| Submit private Feedback | Private authenticated intake | Yes | Create-only; no user-visible record after success | Implemented intake may launch only with approved retention/access policy and truthful copy |
| Authentication logout | End current browser session | Yes | Revokes only current matching session; no all-session/account control | Current-session logout implemented; broader session management is not promised |
| Correct stored chart metadata | Edit display name/category/tags/favorite and note content | Yes | No in-place edit of saved normalized input/canonical result; user must delete/re-save to replace snapshot | Public copy must distinguish metadata edits from birth/result edits |
| Access submitted Feedback | Not required by current create-only MVP | No | No list/history/detail endpoint | Policy decision; P1 unless legal/launch review requires earlier capability |
| Correct/update submitted Feedback | Not defined | No | Immutable after creation | Policy decision; do not claim correction is available |
| Withdraw/delete private Feedback | Not defined; retention/deletion policy unresolved | No | No direct delete or withdrawal path | Resolve P-08; at minimum account-deletion semantics must be truthful before launch |
| Access Auth/account identity data | Account existence is represented by session boolean only in UI | No dedicated account/profile view | No self-service identity view or email correction/link management | Not a claimable current capability; scope after core P0 rights |

## Non-Legal Terms Product-Behavior Matrix

This is a product-behavior specification for later Terms drafting, not Terms language.

| Topic | Confirmed/approved product behavior | Safe product statement boundary | Unresolved or prohibited invention |
| --- | --- | --- | --- |
| Service nature | NatalNode provides astrology-oriented chart calculation, calculation details, and deterministic interpretation. Current executable results are development/research fixtures, not production astronomy. | Describe the actual astrology calculation and interpretive experience and clearly label the current research/development environment. | Do not claim production scientific validation or select a provider. Legal disclaimer wording remains for approval. |
| Interpretive character | Product content frames natal charts as symbolic/interpretive material for reflection and meaning-making; deterministic text is derived from chart facts. | Describe output as astrology calculation and interpretive/informational content. | Do not invent medical, financial, professional-advice, warranty, or liability clauses in this contract. |
| Current environment | The repository accepts only `development-mock` Engine mode and displays development/research warnings. Deployment is not established as production. | State that the current environment is development/research when shown publicly. | Do not imply production availability, accuracy, provider approval, or a completed release gate. |
| Account use | Email Magic Link creates/resolves an account identity and an opaque cookie session. Google is absent. | Describe Email Magic Link and current session behavior only. | Account-sharing, eligibility, suspension, termination, and identity-verification legal rules are unknown. |
| Vault | Authenticated users can privately save, view, organize, annotate, and delete charts. No public sharing exists. | Describe owner-scoped persistence and individual chart/note controls. | Do not promise account deletion, export, indefinite availability, backups, or public sharing. |
| User notes | Notes are private, user-owned within a saved chart, editable, and deletable. | State current private Vault-note behavior. | Copyright/license grants, prohibited-content rules, and legal moderation terms are unapproved. |
| Private Feedback | Authenticated create-only private support intake; not Community; no chart/birth data auto-attachment. | Describe intake and its private/non-public product boundary. | Do not promise response times, ticket tracking, deletion, confidentiality beyond verified controls, or a content license. |
| Public Community | No public Community, Questions, following, messaging, or public user-content system exists. | State that these features are not currently offered if needed. | Do not draft Community moderation, user-license, or acceptable-use commitments as current terms. |
| Practitioner marketplace | No marketplace or public Practitioner product exists. | State absence if relevant. | Do not create marketplace, verification, professional-services, commission, or transaction terms. |
| AI | AI interpretation is deferred, and product copy must not promise unlimited AI. | No current AI-service entitlement should appear. | No quota, fair-use, model, data-use, or availability promise is approved. |
| Subscriptions and paid plans | No subscription, payment, billing, or paid-plan implementation is live. Pricing is not frozen. | State no current paid service only if operationally accurate at publication. | Do not invent prices, billing cycles, taxes, renewals, refunds, cancellations, chargebacks, or payment processors. |
| Advertising | No advertising is implemented; core product surfaces are approved ad-free. | Describe current absence and approved core-surface boundary only. | Do not claim future Learn/Tools ads, consent behavior, or ad processors until P-12 is approved. |
| Abuse controls | Same-origin checks, input validation, and rate limits are implemented. | Terms may eventually refer to technically enforced limits after policy review. | No general prohibited-use/acceptable-use list, suspension right, or enforcement policy is approved. |
| Service availability | Performance goals and future architecture exist, but no production uptime or final Engine SLA is frozen. | Avoid availability commitments beyond actual status. | Do not invent uptime, continuity, backup, support, maintenance, warranty, or service-credit promises. |
| Intellectual property | Repository content and software exist, but no public Terms license grant is approved here. | Describe product function only. | Do not invent copyright ownership assertions, user-content licenses, feedback licenses, or reuse rights. |

## Decisions Required Before Public Legal Copy

Each entry remains open until an authorized owner records a decision. “Recommended product default” is a non-legal implementation recommendation and does not answer the legal question.

| Decision ID | Issue | Why it matters | Current repository truth | Safe available options | Recommended product default | Requires legal review? |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 | Legal operating entity / controller identity | Public privacy copy must identify the responsible legal party. | No approved legal entity or legal-controller identity is present. | Insert an actually formed/authorized entity after verification; or delay public legal copy until one is approved. | Do not publish an entity name inferred from the product name. | YES |
| P-02 | Contact address / privacy contact | Users need an approved channel for privacy and legal requests. | No approved postal address, privacy email, or verified request workflow is frozen. | Approve a monitored privacy email/form and any legally required address; or delay copy requiring those details. | Establish a monitored, auditable privacy-request channel before public launch. | YES |
| P-03 | Governing jurisdiction / law | Governing-law and forum clauses depend on the real entity and operations. | Unknown. | Use only counsel-approved jurisdiction tied to the actual entity/operations; omit until approved where legally permissible. | No product recommendation; counsel/entity decision required. | YES |
| P-04 | Minimum user age / child policy | Birth data can concern minors, and eligibility/consent rules are jurisdiction-sensitive. | No age gate, birth-subject age check, parental-consent flow, or approved age policy exists. | Approve an eligibility age and enforcement approach; approve a child/parental-consent model; or restrict launch as counsel advises. | Do not infer age from chart birth date and do not publish an age threshold without approval. | YES |
| P-05 | Account deletion mechanism | PRD requires deletion, but no mechanism exists and Auth challenges are not user-FK linked. | Not implemented. User-linked tables have cascades; magic-link challenge erasure needs explicit handling. | Authenticated self-service deletion with reauthentication/confirmation; verified manual request workflow; or both. Define sessions, challenges, backups, logs, and exception handling. | Implement authenticated self-service deletion plus a verified fallback and explicit cross-store erasure contract. | YES |
| P-06 | Data export mechanism | PRD requires export, and current Vault reads omit Auth/Feedback/full-account packaging. | Not implemented. | Authenticated machine-readable self-service export; verified manual export; or both. Define included records, format, identity verification, delivery security, and timing. | Implement one authenticated, machine-readable account export covering all user-linked product records. | YES |
| P-07 | Vault retention | Saved birth data and derived charts currently persist until individual deletion. | No duration or inactivity policy; no account deletion. | Retain while the account/record is active and user-controlled; or adopt an explicitly approved inactivity schedule and notice process. Define backups/exceptions separately. | Retain only while needed for user-directed Vault storage, with working chart/account deletion; approve any duration separately. | YES |
| P-08 | Feedback retention and withdrawal | Feedback can contain voluntarily entered personal/birth information and has no user deletion path. | No duration, history, update, delete, or withdrawal mechanism. | Purpose-limited schedule plus verified request deletion; account-lifetime retention plus deletion controls; or another counsel-approved support-retention model. | Approve a purpose-limited schedule and a verified deletion/withdrawal path before promising Feedback rights. | YES |
| P-09 | Application/infrastructure log retention and access | App logs are bounded, but downstream storage/access is unknown. | stdout/stderr emission only is known; host storage, access roles, and duration are unknown. | Approve an operations/security retention schedule, access roles, deletion process, and incident exceptions for every live environment/provider. | Use the shortest operationally sufficient, explicitly approved schedule with least-privilege access; do not select a number here. | YES |
| P-10 | Cookie/consent policy | Current application uses only an essential auth cookie, but legal treatment depends on deployment and jurisdiction; future features may add non-essential storage. | No CMP/banner. No analytics/ad storage. | Essential-only launch with approved notice; jurisdiction-appropriate consent control if required; introduce CMP only with approved non-essential purposes. | Keep application storage essential-only for launch and avoid adding a CMP until a real non-essential purpose is approved. | YES |
| P-11 | Future analytics | Analytics would create new events, identifiers, processors, and consent/retention questions. | No analytics integration. Sentry/OpenTelemetry are not implemented. | Keep absent; add privacy-minimized first-party metrics; or select an approved processor with event minimization and consent rules. | Keep analytics absent for initial public trust launch unless a separate inventory and approval is completed. | YES |
| P-12 | Future advertising / CMP | Ads can create targeting and tracking processing and must preserve the birth/chart prohibition. | Ads and CMP absent. Core surfaces approved ad-free; Learn/Tools only potentially eligible. | Defer ads; contextual ads without personal targeting after review; or an approved consent-based model that never uses prohibited birth/chart profiles. | Defer advertising. If later approved, start with contextual Learn/Tools-only design and a separate data-flow review. | YES |
| P-13 | Google Sign-In processor disclosure | Google OAuth would add provider identity, OAuth security, and processor disclosures. | Schema enum only; no Google integration. **DEFERRED / P0 GAP.** | Keep Google disabled; or implement through a separate security/privacy task with approved disclosure and token/data inventory. | Do not mention Google as active until implementation, operational configuration, and legal disclosure are approved. | YES |
| P-14 | Subscription/payment terms | Paid plans create billing, tax, renewal, cancellation, refund, processor, and entitlement obligations. | No paid plan, checkout, billing, payment processor, or frozen price. | Keep service unpaid; or approve commercial model/provider and complete dedicated terms/privacy decisions before launch of payment. | Do not publish paid-plan terms until the complete commercial and processor contract is approved. | YES |
| P-15 | User content/license terms if Community later launches | Public user content requires licenses, moderation, deletion, attribution, reuse, and complaint rules. | Community/Questions/Practitioner public content is absent and deferred. | Keep deferred; or approve a complete Community policy/licensing/moderation model before implementation. | Preserve private notes/Feedback boundaries and defer public user content. | YES |
| P-16 | Dispute/refund/cancellation policy if paid products launch | These are legal/commercial commitments tied to P-03 and P-14. | No paid products and no approved dispute/refund/cancellation rules. | Counsel-approved terms based on actual entity, jurisdiction, product, and billing flow; or keep paid products disabled. | Keep paid products disabled until all decisions are approved; no product-side clause recommendation. | YES |

## Product Engineering Gap Register

Policy decisions and engineering capabilities are separate. A decision does not make a feature exist, and a database cascade does not make a user-facing right operable.

### P0 BEFORE PUBLIC LAUNCH

| Gap ID | Verified gap | Exact boundary/risk | Dependency / completion evidence |
| --- | --- | --- | --- |
| E-P0-01 | Account deletion and account-wide erasure absent | No route, repository delete, UI, or verified manual mechanism. Existing user cascades omit standalone magic-link challenges. | Resolve P-05; implement and test owner authentication, cross-table/challenge handling, active sessions, failure atomicity, and truthful completion response. |
| E-P0-02 | Full user data export absent | Vault APIs are not a complete export; Auth and Feedback are not exportable by user. | Resolve P-06; implement authenticated export covering all approved categories and verify authorization/data completeness. |
| E-P0-03 | Expired Auth record cleanup absent — privacy retention implementation gap | `0002_auth_runtime.sql` plus current repositories retain expired/consumed challenges containing normalized email/hash and expired session hashes without purge. | Approve Auth retention semantics; implement bounded cleanup and verify technical validity remains independent from deletion. |
| E-P0-04 | Retention enforcement absent for Vault, Feedback, and logs | No approved durations, scheduled enforcement, or downstream log policy. | Resolve P-07, P-08, P-09; implement only the approved semantics and verify live-provider behavior. |
| E-P0-05 | Privacy access audit absent | PRD requires access audit; no `audit_events` table, access-audit repository, or equivalent mechanism exists. | Freeze a privacy-minimized audit contract and authorized access model before implementation. Do not log sensitive payloads. |
| E-P0-06 | Public Privacy and Terms routes/copy absent | `/privacy` and `/terms` are not implemented; unresolved decisions prevent accurate legal copy. | Approve required P decisions, obtain legal approval, then perform WEB-TRUST-001B with no unsupported claims. |
| E-P0-07 | Google Sign-In launch requirement missing | PRD lists Google at launch, but no OAuth implementation exists. | Keep classified **DEFERRED / P0 GAP** until separately implemented and reviewed; do not block truthful Email-only copy by claiming it exists. |
| E-P0-08 | Live privacy/security operations are unverified | TLS, encryption at rest, least privilege, backups, provider access, infrastructure logs, and `Secure` cookie deployment are requirements, not verified live facts. Railway staging architecture is not live; production host is unselected. | Before public launch, verify the actual environment and record evidence without exposing secrets. |

### P1 LATER

| Gap ID | Verified gap | Product impact | Dependency |
| --- | --- | --- | --- |
| E-P1-01 | Feedback access/history/update/delete absent | Users cannot review, correct, or withdraw an individual submission through the product. | P-08 and any approved support workflow. Promote to P0 if legal review requires it for launch. |
| E-P1-02 | Guest session/local temporary chart retention described by PRD is not implemented | Guest chart exists only in React memory; refresh/navigation loses it. This is privacy-minimizing but below the intended temporary-session UX. | Separate guest-storage threat model and consent/data-lifetime decision; do not add storage implicitly. |
| E-P1-03 | Saved birth/result snapshot cannot be corrected in place | Users can edit metadata/notes or delete and re-save, but not edit normalized input/canonical result. | Separate immutable-snapshot correction UX decision. |
| E-P1-04 | Account identity/profile management absent | No self-service identity view, email-link management, or all-session revocation. | Account/profile product scope after E-P0-01/E-P0-02. |

### DEFERRED WITH FEATURE

| Gap ID | Deferred feature | Required future privacy/trust work |
| --- | --- | --- |
| E-D-01 | Analytics/Sentry/OpenTelemetry | New data inventory, event minimization, processor status, access/retention, consent decision, and updated public copy before activation. |
| E-D-02 | Advertising/CMP | P-12, Learn/Tools-only eligibility decision, strict prohibition on birth/chart targeting, vendor/consent/retention review, and core ad-free verification. |
| E-D-03 | Community/Questions/Practitioners | Profiles, public/private classification, moderation, user rights, content license, deletion, indexing, safety, and processor review. |
| E-D-04 | Subscriptions/payments | P-14/P-16, payment processor inventory, billing/refund/cancellation decisions, security scope, and approved legal copy. |
| E-D-05 | AI interpretation | Input/output data-flow inventory, model/provider status, retention/training policy, consent if applicable, quotas, and preservation of the no-unlimited-AI rule. |
| E-D-06 | Production Engine/location/timezone integration | Provider-neutral contract, processor/data-transfer review, production rights and scientific gates, and updated disclosure. **PROVIDER DECISION DEFERRED.** |
| E-D-07 | Public sharing/export formats | Visibility, recipient access, embedded birth/chart fields, revocation, indexing, link security, and retention decisions before implementation. |

## Safe Public Copy Rules for WEB-TRUST-001B

WEB-TRUST-001B may publish only:

1. A facts that remain verified at implementation time;
2. B principles accurately framed as product policy, not as unverified capability; and
3. C decisions that have an explicit authorized approval record.

The controlling rule is:

```text
UNKNOWN POLICY -> DO NOT INVENT PUBLIC LEGAL CLAIM
```

Equivalently, with the required publication notation:

```text
UNKNOWN POLICY → DO NOT INVENT PUBLIC LEGAL CLAIM
```

Public copy must not:

- identify a legal entity, controller, address, jurisdiction, age threshold, or privacy contact that has not been approved;
- state retention periods that are not approved and operationally enforceable;
- equate technical session/magic-link expiry with record deletion;
- say users can delete accounts, erase all data, export all data, or delete Feedback before those mechanisms exist;
- say NatalNode never receives IP or user-agent/network metadata; application logging is bounded, but infrastructure behavior is unknown;
- say no third party receives authentication data when configured Resend delivery sends the recipient and token-bearing email content;
- name Google, Railway, Sentry, analytics, advertising, payment, or astronomy providers as active unless the publication environment is verified active;
- claim encryption at rest, TLS, least privilege, backup behavior, provider tracking configuration, or regional storage merely because architecture requires it;
- claim guest chart storage beyond current page memory;
- describe Feedback as incapable of containing personal data, because the user controls message text;
- promise production astronomy, scientific validation, uptime, service levels, unlimited AI, subscriptions, pricing, refunds, billing, Community, Practitioner services, public sharing, or marketplace behavior that is not live and approved;
- expose credential values, database URLs, raw tokens, token hashes, or unnecessary security-sensitive implementation detail; or
- turn an unresolved legal topic into placeholder language.

If accurate public copy depends on an unresolved P decision or missing E-P0 capability, route implementation must wait for that specific approval/capability. A narrow factual page may not hide a known P0 gap by replacing it with vague promises.

## Roadmap and scientific-boundary disposition

No roadmap change is required. The current roadmap already states that scientific-dependent work remains gated while non-scientific Web Product work—including legal and trust work after policy content is available—may proceed independently. It also keeps Community/Practitioner sequencing deferred and the large-file decomposition program outside current product work.

This contract does not access or modify the separate Scientific Core, choose an astronomy provider, change `ChartRequest`/`ChartResult`/`EngineClient`, or alter provenance behavior. **PROVIDER DECISION DEFERRED** is preserved.

## Evidence basis

This baseline was produced from the bounded sources required by WEB-TRUST-001A:

- Product/architecture: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/product/NATALNODE_PRODUCT_ROADMAP_V1.md`.
- Accepted ADRs: `docs/adr/WEB-AUTH-002A-email-magic-link-delivery.md`, `docs/adr/WEB-DEPLOY-001A-web-api-deployment-topology.md`, `docs/adr/WEB-DEPLOY-002A-railway-p0-staging-topology.md`, `docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md`.
- Auth contracts/browser/routes/runtime: `packages/contracts/src/auth.ts`, `packages/contracts/src/api/auth.ts`, `apps/web/src/features/auth/request-email-magic-link.ts`, `apps/web/src/features/auth/complete-email-magic-link.ts`, `apps/web/src/features/auth/auth-session-control.ts`, `server/src/app/validation/auth-email.ts`, `server/src/app/routes/auth-email.ts`, `server/src/app/routes/auth-session.ts`, `server/src/app/auth/session-request-authenticator.ts`, and relevant modules under `server/src/auth-runtime/`.
- Auth persistence/migrations: Auth identity, provisioning, session, challenge, and user repository interfaces/PostgreSQL adapters under `server/src/persistence/` and `server/src/persistence/postgres/`; `server/db/migrations/0001_auth_vault_baseline.sql`, `0002_auth_runtime.sql`, and `0003_auth_identity_provisioning_fk.sql`.
- Chart/Birth/Engine boundary: `packages/contracts/src/chart.ts`, `packages/contracts/src/api/chart-calculation.ts`, `apps/web/src/features/chart-input/types.ts`, `apps/web/src/features/chart-input/development-resolver.ts`, `apps/web/src/features/chart-input/useBirthInputResolution.ts`, `apps/web/src/features/chart-experience/ChartExperience.tsx`, `apps/web/src/features/chart-experience/chart-request.ts`, `apps/web/src/lib/engine-client.ts`, `packages/engine-client/src/http-engine-client.ts`, `packages/engine-client/src/mock-engine-client.ts`, `server/src/app/routes/chart.ts`, `server/src/app/validation/chart-request.ts`, and executable Engine binding/configuration modules.
- Vault/notes: `packages/contracts/src/vault.ts`, `packages/contracts/src/api/vault.ts`, relevant browser Vault clients under `apps/web/src/features/vault/`, `server/src/app/routes/vault-charts.ts`, `server/src/app/routes/vault-notes.ts`, Vault/note validation, repository interfaces/PostgreSQL adapters, and `server/db/migrations/0001_auth_vault_baseline.sql`.
- Private Feedback: `packages/contracts/src/feedback.ts`, `packages/contracts/src/api/feedback.ts`, `apps/web/src/pages/feedback.astro`, `apps/web/src/features/feedback/private-feedback.ts`, `server/src/app/routes/feedback.ts`, `server/src/app/validation/feedback.ts`, Feedback repository interface/PostgreSQL adapter, and `server/db/migrations/0004_private_feedback.sql`.
- Observability/security/deployment composition: `server/src/app/observability/api-request-observability.ts`, `server/src/app/create-app.ts`, `server/src/app/security/api-rate-limiting.ts`, `server/src/app/security/trusted-edge-client-identity.ts`, `server/src/executable/local-public-edge.ts`, `server/src/runtime/README.md`, executable composition/configuration, and Resend adapter modules.
- SEO/public content/storage search: `apps/web/src/lib/seo.ts`, `apps/web/src/layouts/SiteLayout.astro`, `apps/web/src/components/StructuredData.astro`, `apps/web/src/pages/robots.txt.ts`, `apps/web/src/pages/sitemap.xml.ts`, Learn route/content, Tools routes/taxonomy, and bounded browser searches for `localStorage`, `sessionStorage`, IndexedDB, analytics, advertising, and processor integrations.

No runtime source, test, migration, package manifest, lockfile, roadmap, PRD, architecture document, or ADR is modified by this contract.
