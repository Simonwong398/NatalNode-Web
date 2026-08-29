# NatalNode Google Sign-In V1

- Status: **APPROVED TECHNICAL CONTRACT / LOCAL IMPLEMENTATION READY / LIVE OAUTH CONFIGURATION EXTERNAL-GATED**
- Task: `WEB-AUTH-GOOGLE-001A`
- Date: 2026-08-29
- Scope: P0 authentication contract freeze only
- Public/runtime status: Google Sign-In is **not implemented or active** by this document
- Production astronomy status: `PROVIDER DECISION DEFERRED`

This document freezes the first-party Web/BFF technical and security boundary
for Google Sign-In. It does not implement OAuth/OIDC, add credentials, select a
provider SDK, add a migration, change runtime configuration, or make a live
Google, deployment, legal, or privacy claim.

The fixed product boundary remains:

~~~
NatalNode.com
    -> Website API / BFF
    -> NatalNode Engine Public API
~~~

Google is an authentication identity provider at the Website API / BFF
boundary. It is unrelated to production astronomy-provider selection. The
website must not call the Engine or an astronomy provider as part of Google
authentication.

## 1. Scope

P0 Google Sign-In is limited to:

- server-controlled Google OpenID Connect sign-in;
- resolving one verified Google identity to the existing NatalNode user/account
  model;
- creating the existing first-party session;
- collision-safe behavior when an email is already used by another NatalNode
  identity;
- minimal sign-in-page availability;
- bounded security, error, observability, deletion, export, and retention
  integration.

P0 does not include a Google profile product, account settings redesign, linked
account dashboard, Google API access, background synchronization, or account
merging.

The current privacy/terms contract may continue to describe Google as planned
or deferred until implementation, external configuration, and approved
disclosure are complete. This technical freeze is not evidence that Google
processing is active.

## 2. Current Auth baseline

The current repository has one Website Auth model. Google must enter that model
through the existing boundaries rather than creating a Google-only account or
session subsystem.

### 2.1 User/account

The canonical account root is the users table and the provider-neutral
UserAccount contract. It contains an opaque userId plus server-owned creation
and update timestamps. The current root does not contain a primary email
column.

### 2.2 Auth identity

AuthIdentity contains:

- identityId;
- userId;
- provider;
- providerSubject;
- createdAt; and
- updatedAt.

The current AuthProvider contract and database check allow
EMAIL_MAGIC_LINK and GOOGLE. The database uniqueness constraint is
provider + providerSubject, and identities reference users with a cascading
foreign key. This is sufficient for one NatalNode user to own multiple
provider identities; it is not permission to auto-link those identities by
email.

### 2.3 Existing Email Magic Link behavior

The current flow is:

1. The browser posts an email to POST /api/auth/email/request.
2. The server trims and lowercases the email for the Email Magic Link
   identity subject, persists a one-time challenge hash and bounded expiry,
   and sends the application-generated completion URL through the explicit
   email-delivery boundary.
3. The completion page removes the URL fragment and posts the token once to
   POST /api/auth/email/complete.
4. The server hashes and atomically consumes the challenge, resolves or
   creates an EMAIL_MAGIC_LINK identity, issues a fresh session secret, stores
   only its hash, and sets the session cookie.
5. The browser uses the existing authenticated session and is redirected to
   the current fixed success destination.

Email identity resolution is serialized with the existing normalized-email
PostgreSQL lifecycle lock. Invalid, expired, consumed, or unknown completion
tokens use the bounded unauthorized behavior and do not disclose account
existence.

### 2.4 Session and principal

The current auth_sessions record stores only:

- a one-way sessionTokenHash;
- the owning userId;
- createdAt; and
- expiresAt.

SessionRequestAuthenticator reads the configured opaque cookie, rejects
duplicate configured cookies, hashes the presented value, verifies the
server-side active row, and returns AuthenticatedPrincipal.userId plus the
immutable server-side session creation time. Recent-authentication decisions
use that server timestamp, not browser time.

### 2.5 Cookie security

The current session cookie is:

- host-only because no Domain attribute is set;
- HttpOnly;
- SameSite=Lax;
- Path=/;
- bounded by the server-selected session expiry; and
- Secure when the configured environment policy requires it.

Google must issue this same first-party session cookie. A Google access token,
refresh token, ID token, authorization code, state value, nonce, or PKCE
verifier is never a browser session credential.

## 3. Identity model

### 3.1 Authoritative Google identity key

The authoritative external identity tuple is:

~~~
provider       = GOOGLE
providerSubject = verified Google OIDC subject (sub)
~~~

The verified Google subject is the stable mapping key. It must be non-empty,
obtained only after successful OIDC verification, and treated as opaque. The
implementation must not construct, transform, hash for identity lookup, or
derive a scientific or product identifier from it.

The unique database tuple (GOOGLE, providerSubject) resolves to exactly one
NatalNode user. A browser cannot select userId or identityId.

### 3.2 Email is an attribute, not identity authority

The Google email claim is a verified provider attribute, not the external
identity primary key and not account-merge authority.

For the P0 flow, the provider adapter must request the email scope and fail
closed unless the ID token contains a non-empty email with
email_verified=true. The value may be normalized using the existing
trim-plus-lowercase convention only for the bounded collision check. This
requirement does not change the rule that subject, not email, owns the
Google-to-NatalNode mapping.

The verified email may not:

- reassign an existing Google subject;
- prove that two existing NatalNode accounts may be merged;
- silently attach a new Google subject to an Email Magic Link account;
- update an existing Email Magic Link subject;
- create an EMAIL_MAGIC_LINK identity; or
- be treated as a durable NatalNode profile field when the current account
  model has no such field.

If Google later changes the account email, the Google subject mapping remains
authoritative and the current NatalNode account email identity remains
unchanged. No silent profile synchronization is part of P0.

### 3.3 One user model

The target sequence is:

~~~
verified external Google identity
    -> existing AuthIdentity boundary
    -> existing users/UserAccount root
    -> existing auth_sessions/session cookie
    -> existing AuthenticatedPrincipal
~~~

There is no parallel Google user table, Google session table, Google browser
credential, or provider-specific account model.

## 4. OAuth/OIDC flow

The implementation will use a server-controlled Authorization Code flow with
OpenID Connect identity validation:

1. A signed-out user selects the Google action on the existing sign-in page.
2. The first-party browser submits an empty same-origin request to
   POST /api/auth/google/start.
3. The BFF confirms the request origin and that the request is an anonymous
   sign-in attempt. It generates state, a PKCE verifier/challenge, nonce, and
   a short-lived browser transaction binding.
4. The BFF persists the bounded pending transaction, sets the short-lived
   host-only transaction correlation cookie, and returns a 303 redirect to the
   configured Google authorization endpoint.
5. The authorization request uses response_type=code, the exact
   environment-specific redirect URI, the S256 PKCE challenge, state, nonce,
   and the minimal OIDC scopes.
6. Google redirects the browser to
   GET /api/auth/google/callback with a one-time authorization code and state,
   or with a provider error.
7. The BFF atomically claims the pending transaction before doing provider
   work. It rejects missing, duplicated, expired, already-claimed, or
   browser-unbound state.
8. The BFF exchanges the code server-side with the configured Google OIDC
   boundary, supplying the exact redirect URI and the stored PKCE verifier.
   Client secrets never reach browser code.
9. The BFF verifies the returned ID token and extracts only the verified
   subject and the approved email attribute. It then resolves or creates the
   existing NatalNode identity/account and issues the existing first-party
   session in one database transaction.
10. On success, the BFF clears the transaction cookie, sets the existing
    session cookie, and returns a 303 redirect to the current fixed
    post-auth destination, /.

The callback is a browser navigation boundary, not a generic provider
parameter route. There is no P0 route that accepts an arbitrary provider name.

## 5. State, PKCE, and nonce

### 5.1 State

State is:

- generated only by the server using the existing CSPRNG boundary;
- high entropy and opaque;
- sent to Google only as transient callback correlation data;
- stored server-side by a one-way state hash;
- bound to the pending transaction and its browser binding;
- single-use;
- bounded by a security expiry; and
- atomically claimed before account or session mutation.

The implementation must not accept a browser-supplied state as authoritative,
reuse a state after a failed or successful callback, put account/user data in
state, or log state.

### 5.2 PKCE

PKCE with S256 is mandatory even though the BFF is a confidential server-side
client. It is defense in depth against authorization-code interception and
misbinding.

The server generates the code verifier, derives the S256 challenge, stores the
recoverable verifier only inside the pending transaction boundary, and sends
only the challenge to Google. The verifier must never be sent to browser code,
placed in a URL, logged, or retained after the transaction reaches a terminal
state.

### 5.3 OIDC nonce

Nonce is mandatory. The server generates it, binds it to the pending
transaction, sends it in the authorization request, and compares it with the
verified ID-token nonce before identity resolution. The stored nonce may be
represented by a one-way hash; the raw value is transient only. A missing,
duplicated, mismatched, expired, or replayed nonce fails closed.

A nonce-free or decoded-JWT-only shortcut is not approved.

## 6. Pending OAuth transaction model

### 6.1 Storage boundary

Pending Google transactions require a server-side, short-lived transaction
store. A future implementation may add one narrow PostgreSQL persistence
boundary, or an equivalently approved server-side store, but it must not add a
parallel session system.

The minimum record is technical state only:

- one-way state hash;
- recoverable PKCE verifier protected as transient secret material;
- one-way nonce hash;
- one-way browser-binding hash;
- createdAt;
- expiresAt;
- fixed flow kind (Google login, not arbitrary provider input);
- fixed post-auth destination;
- transaction status such as pending, claimed, completed, or failed; and
- bounded terminal timestamp.

The record must not contain access tokens, refresh tokens, raw ID tokens,
authorization codes, email as a durable account record, chart data, birth
data, or arbitrary return URLs.

The transaction store must provide an atomic claim operation. A callback may
claim a pending transaction only once. A claim is terminal for replay
purposes, including when the provider exchange or verification subsequently
fails; the user starts a new transaction for a retry.

### 6.2 Browser binding

Because an anonymous user has no existing Auth session at initiation, the BFF
also sets a short-lived, opaque, host-only transaction correlation cookie. It
is not a login credential and does not authenticate a user. It carries no
provider token or account data, is HttpOnly, uses SameSite=Lax, is Secure when
the environment policy requires it, has no Domain attribute, and is cleared on
callback completion or terminal failure.

The callback must match both the server-side state transaction and the
correlation cookie. A valid state copied from another browser is therefore not
enough to complete login. If a future authenticated linking flow is approved,
it must bind to the authenticated session as well as the browser transaction;
that flow is outside P0.

### 6.3 Transaction lifecycle

The required state sequence is:

~~~
PENDING -> CLAIMED -> COMPLETED
                   \-> FAILED
PENDING -> EXPIRED
~~~

Claim, completion, failure, and expiry are server-owned. A transaction is
never resurrected after claim, and the callback never accepts a second code
for the same state.

### 6.4 Pending transaction expiry

No source-defined exact Google OAuth transaction TTL exists at this freeze.
Implementation must use a required, positive, bounded security configuration
for the pending transaction lifetime, for example a future
AUTH_GOOGLE_OAUTH_TRANSACTION_TTL_SECONDS binding reviewed at implementation
time. This is a technical replay window, not a legal, business, or processor
retention period.

Expired and terminal pending transactions are eligible for bounded cleanup
through the Auth lifecycle maintenance boundary in a future implementation.
The absence of a product retention value must not be hidden with an invented
legal or long-term storage period.

## 7. Account creation, resolution, and linking

All account outcomes below are based on verified ID-token claims. Identity
resolution, new-user creation, and session persistence are server-owned.

### A. Google subject already exists

If (GOOGLE, verified subject) already exists:

- resolve its single existing NatalNode user;
- issue a fresh existing-style first-party session;
- do not create another user or identity;
- do not change ownership based on the current email claim;
- do not update the Email Magic Link identity; and
- do not synchronize profile fields.

If the verified Google email now matches a different Email Magic Link account,
the existing Google subject still wins for this provider mapping. The
implementation must not merge the two accounts or move either identity.

### B. New Google subject and no existing NatalNode account uses the email

If the verified Google subject is new and no EMAIL_MAGIC_LINK identity uses
the normalized verified Google email:

- create one server-generated users root;
- create one GOOGLE AuthIdentity with the verified subject;
- do not create an EMAIL_MAGIC_LINK identity from the Google email; and
- create the first-party auth session for the new user.

The user, Google identity, and session record are committed atomically. No
browser-selected identifier participates in creation.

The existing normalized-email lifecycle lock must protect the email collision
check and creation path so a concurrent Email Magic Link operation cannot
produce an unsafe race. The provider-subject uniqueness constraint remains the
final duplicate-subject guard.

### C. New Google subject and existing NatalNode account uses the email

This is a hard no-auto-link boundary:

~~~
Google email match -> automatic link/merge/takeover
~~~

is not allowed.

If an existing EMAIL_MAGIC_LINK identity owns the normalized verified email
and the Google subject is not already linked:

- do not create a user;
- do not create a Google identity;
- do not update either existing identity;
- do not create or replace a session;
- do not reveal which account, provider, or email caused the result; and
- return the generic bounded Google authentication/linking failure outcome.

For the browser this outcome uses the fixed sign-in failure redirect defined
in section 12. The future user may first authenticate with the existing
trusted Email Magic Link flow, but P0 does not automatically link Google
after that sign-in.

### D. Explicit owner linking

P0 requires Google Sign-In, not linked-account management. Explicit linking is
deferred. No signed-out callback may be interpreted as a linking request, and
no Google action is exposed as a silent account switch for an authenticated
browser.

If a later task adds linking, it must use a separate clearly named route and
flow requiring:

- an already authenticated owner session;
- a recent-authentication or equivalent explicit owner-proof gate;
- a new state/PKCE/nonce transaction bound to that session;
- the same verified-subject uniqueness check;
- the same email collision prohibition; and
- an explicit, reviewed owner action.

The later task must not retrofit account merging into the P0 login callback.

## 8. Existing-email collision behavior

The collision policy is resolved and does not block local implementation:

1. Verify the Google ID token, including subject and verified email.
2. Acquire the existing normalized-email Auth lifecycle lock.
3. Resolve the Google subject first.
4. If the subject is new, check for an EMAIL_MAGIC_LINK identity using that
   normalized email.
5. On a match, complete no account/identity/session mutation and return the
   same generic outward failure class used for other unusable Google
   authentications.
6. On no match, create the new Google identity/account/session atomically.

No response, redirect parameter, log record, metric label, or browser message
may distinguish:

- existing Email Magic Link account;
- Google-only account;
- unknown Google subject;
- newly created account;
- existing Google subject;
- provider denial; or
- failed provider verification.

The future implementation may use an internal bounded outcome such as
link-required for control flow, but it must not add a public account-existence
oracle or a new public error envelope without a separate contract review.

## 9. Session integration

After a verified and collision-safe Google outcome, the implementation must
reuse issueAuthSession, AuthSessionRepository, the existing session expiration
policy, and the existing SessionRequestAuthenticator path.

The success transaction must:

- resolve or create the existing user/identity;
- generate a fresh high-entropy first-party session token;
- persist only the session token hash;
- bind the session to the resolved userId;
- commit identity/account/session work atomically; and
- return transient session material only after the persistence commit succeeds.

The authorization code, Google tokens, subject, email, state, nonce, and PKCE
verifier are never accepted as a NatalNode session credential.

If a valid NatalNode session exists at callback time for an anonymous login
transaction, the callback must fail closed or redirect generically rather than
silently replace that active session or reinterpret the flow as linking. An
explicit linking flow is a later boundary.

## 10. Token handling

### 10.1 Access and refresh tokens

P0 uses Google only to authenticate. It does not require Google API access.
Therefore:

- do not persist access_token;
- do not persist refresh_token;
- do not request offline access solely for sign-in;
- do not place either token in a browser cookie, URL, export, cache, or log;
- do not create a Google token revocation or synchronization subsystem; and
- do not claim that NatalNode deletes or manages Google's own account data.

Provider responses containing tokens are transient adapter material and must
be discarded after the identity/session boundary completes.

### 10.2 Raw ID token

Do not persist raw Google ID tokens or raw token claim sets as account data.
Extract only:

- verified subject;
- verified email attribute required by this contract; and
- the nonce match needed to complete validation.

The raw token, decoded claims, and provider response are not logged or
included in account export.

### 10.3 Authorization code

The callback accepts exactly one bounded authorization code on a successful
provider response. It is exchanged server-side once, never logged, never
persisted as account data, never placed in a follow-up URL, and never returned
in an error redirect. A duplicate or late callback is a generic failed
transaction.

## 11. Security validation

The provider adapter and callback must fail closed unless all relevant checks
pass:

- the callback route is the exact configured route;
- the authorization code is present once, bounded, and exchanged with the
  exact redirect URI;
- state is present once, matches the claimed server transaction, matches the
  browser binding, is unexpired, and is single-use;
- the stored PKCE verifier produces the sent S256 challenge;
- the ID-token signature verifies through the approved OIDC key boundary;
- issuer matches the configured Google OIDC issuer exactly;
- audience contains the configured client ID and multi-audience handling
  validates azp where required;
- token expiry and applicable not-before/issued-at bounds pass;
- nonce matches the transaction nonce;
- subject is present, non-empty, and treated as opaque;
- email is present, non-empty, and email_verified=true before it is consumed;
- the authorization response is tied to the configured Google client and
  redirect URI; and
- no active session is overwritten by an anonymous login transaction.

A decoded JWT is not a verified ID token. Wrong issuer, wrong audience,
missing signature, expired token, invalid nonce, invalid PKCE, malformed
response, provider denial, and provider/network/key failures all fail closed.

### 11.1 JWKS and key verification

Use a standards-compliant OIDC discovery/JWKS verification boundary selected
in the implementation task. The boundary must:

- use the configured exact issuer and its approved discovery metadata;
- validate signatures with the provider's current published keys;
- bound and cache key material according to a reviewed operational policy;
- refresh safely for a legitimate key rotation; and
- fail closed when discovery, key retrieval, parsing, or signature validation
  is unavailable or ambiguous.

Do not implement custom cryptography, vendor Google keys in the repository, or
accept arbitrary issuer/JWKS URLs from a browser request.

## 12. Error and anti-enumeration semantics

### 12.1 Public error taxonomy

The current canonical API taxonomy is RFC 9457 Problem Details with bounded
codes such as INVALID_REQUEST, UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, and
INTERNAL_ERROR. This contract does not add a legacy { error: ... } envelope or
a Google-specific public code.

For the first-party start route:

| Condition | Boundary behavior |
| --- | --- |
| Non-empty/malformed start request | 400 INVALID_REQUEST |
| Failed exact-Origin check | 403 FORBIDDEN |
| Existing Auth initiation rate limit | 429 RATE_LIMITED with Retry-After |
| Google not configured or provider infrastructure unavailable before redirect | 500 INTERNAL_ERROR with bounded generic detail |
| Successful transaction creation | 303 redirect to Google |

For the browser-only callback route, success is a 303 redirect to the fixed
same-origin path /. Provider denial, state/cookie mismatch, replay, expiry,
PKCE failure, nonce failure, verification failure, email collision, expired
token, wrong issuer/audience, JWKS failure, authorization-code failure, and
other expected callback failures all use a 303 redirect to the fixed
same-origin path:

~~~
/auth/sign-in#google-auth-failed
~~~

The fragment is a fixed UI state and is never sent back to the server. It
contains no provider detail, code, state, email, subject, token, or account
identifier. The future minimal sign-in UI may render one generic message for
that fragment. A callback failure is not a supported API client contract; if a
future implementation needs a non-browser callback caller, it must reuse the
same Problem Details and privacy rules through a separately reviewed boundary.

All Auth success and failure responses remain no-store. The callback must not
echo provider error_description, error_uri, raw response bodies, authorization
codes, client secrets, or provider URLs containing transient credentials.

### 12.2 Anti-enumeration

Outward behavior must not reveal:

- whether an email has a NatalNode account;
- whether the account uses Email Magic Link;
- whether a Google subject exists;
- whether the callback created a new account;
- which account owns an email collision; or
- whether the failure was caused by provider denial versus invalid local
  correlation.

The collision path and invalid/replayed/expired callback path therefore share
the same bounded browser failure behavior. Internal control flow may retain
typed outcomes, but no typed outcome may become a public enumeration oracle.

### 12.3 Open redirect prevention

Current Auth has no return URL feature. P0 Google Sign-In does not add one.
Both successful and failed callbacks use fixed first-party destinations.

If a later contract adds a return destination, it must accept only a
server-allowlisted same-origin path with no scheme, host, credentials, or
external origin. An arbitrary redirect query parameter is not approved.

## 13. Rate-limit and middleware expectations

### 13.1 Rate limits

The first implementation should reuse the existing P0 Auth rate-limit
classes, not invent a new quota:

- POST /api/auth/google/start uses the current Auth initiation policy class,
  currently AUTH_EMAIL_REQUEST at 5 attempts per 10 minutes in the
  process-local P0 staging defaults;
- GET /api/auth/google/callback uses the current Auth completion policy class,
  currently AUTH_EMAIL_COMPLETE at 10 attempts per 10 minutes in the
  process-local P0 staging defaults.

These are existing staging defaults, not a production SLA or a claim about
provider limits. The limiter remains the current bounded edge-identity
mechanism and must not log raw client addresses or OAuth material. Provider
retry behavior must not bypass the edge limit; one-use transaction claiming
prevents callback replay.

If an implementation later needs distinct low-cardinality policy identifiers,
it must preserve equivalent bounded behavior through a reviewed policy
change. It must not use Google email or subject as a raw limiter key.

### 13.2 Same-origin start and callback exception

POST /api/auth/google/start creates server state and therefore follows the
existing exact canonical Origin middleware. The empty request must carry the
exact configured PUBLIC_WEB_ORIGIN; missing, malformed, credentialed,
non-canonical, or alternate origins receive FORBIDDEN before business logic.
No CORS is added.

GET /api/auth/google/callback is a legitimate third-party browser redirect
and must not be rejected merely because its Origin is absent or Google is the
navigation referrer. It is protected by the claimed state, transaction
cookie, exact redirect URI, PKCE, nonce, and OIDC verification instead. The
callback remains under the normal API security headers, no-store policy, and
static endpoint-family observability.

The implementation must not accept host or forwarded headers as the public
origin and must not expose a generic provider parameter.

## 14. Frontend minimum

The minimum P0 UI change is one Google Sign-In action on the existing
/auth/sign-in experience alongside the current Email Magic Link form.

It must:

- use real HTML/first-party behavior rather than a Google frontend SDK;
- submit the empty start request to the fixed Google route;
- preserve the current heading hierarchy and Email Magic Link behavior;
- show one bounded generic failure state from the fixed callback fragment;
- avoid account-management or OAuth diagnostics UI; and
- respect existing focus-visible, no-store, and accessible form/button
  patterns.

No Google profile image, avatar, name, contacts, birthday, locale, gender,
calendar, Drive, Gmail, or other profile/API enrichment is part of P0.

Google branding or button requirements that Google later imposes are external
implementation constraints. This documentation task does not download
Google assets or change the frozen NatalNode visual system.

## 15. Unconfigured and public-development behavior

Google is optional until external configuration and live acceptance are
complete.

When Google is not configured:

- the server must not fail the entire local/public runtime at startup merely
  because Google is optional;
- the sign-in page should hide the Google action rather than present a
  broken clickable control;
- a stale or directly invoked start request must fail with a bounded generic
  unavailable/internal response; and
- no fake Google authorization, fake provider response, fake Google identity,
  or fake authenticated session may be created.

The public-development runtime at http://localhost:4321 remains anonymous and
usable without Google credentials. Existing signed-out session behavior and
Email Magic Link-disabled behavior remain unchanged. Public-development may
use an injected provider test double only in a separately authorized local
test boundary; it must not pretend to be live Google or alter the public
development fixture semantics.

## 16. Account deletion, export, retention, and privacy

### 16.1 Account deletion

The completed account-erasure contract deletes the users root in a
transaction, allowing owned auth_identities and auth_sessions rows to be
removed through existing cascading foreign keys. A Google identity therefore
follows the same owner-scoped deletion path.

Google account deletion by NatalNode is not implied. NatalNode does not claim
to delete Google's external account, provider records, Google consent, or
provider-side logs. Pending anonymous OAuth transactions are independent
technical state and must be expired/invalidated by their own bounded
lifecycle; a later fresh Google sign-in is a new authentication attempt.

No Google identity or session may survive a committed deletion of its
NatalNode user through a hidden parallel store.

### 16.2 Account export

The current Account Data Export V1 is not a generic provider-row dump. Its
public identity shape currently supports only EMAIL_MAGIC_LINK, and its
presenter intentionally fails closed when it sees an unsupported provider.
It must not silently omit GOOGLE or serialize provider_subject.

Before a production Google identity can be persisted and the export success
path enabled, a future implementation slice must add a narrow, explicitly
reviewed Google identity presenter/schema extension. The minimum safe
representation is the fact of a GOOGLE identity plus approved link/update
timestamps. P0 does not persist a Google email as a profile field and does
not export a raw or generic external subject reference. A future portability
decision may define a bounded external-subject representation only through a
successor export review; it may never fall back to raw provider_subject.

Provider access tokens, refresh tokens, raw ID tokens, authorization codes,
state, nonce, PKCE verifier, session material, and provider responses are
never exported. Until the presenter extension is implemented, the existing
export preflight must continue to fail closed for any Google identity rather
than claim a complete export.

### 16.3 Retention

Pending OAuth transaction expiry is a technical security control for replay
and secret minimization. It is separate from:

- Auth identity lifecycle;
- account deletion;
- legal/business retention;
- infrastructure-log retention;
- backup/restore reconciliation; and
- Google processor/provider retention.

The retention category inventory and policy registry remain governed by
NATALNODE_DATA_RETENTION_V1.md. No Google processor retention duration,
deletion guarantee, backup rule, or legal commitment is invented here.
Provider-side retention remains EXTERNAL / PROCESSOR POLICY REQUIRED.

Future OAuth transaction cleanup should use the existing bounded Auth
lifecycle maintenance boundary and its explicit scheduler/operations gate.
Technical expiry does not by itself prove physical deletion or policy
compliance.

### 16.4 Privacy Access Audit

Ordinary owner Google Sign-In is not privileged access to another person's
data. It must not append a Privacy Access Audit event, and it must not use
the audit repository as an authentication log.

Account deletion/export and ordinary session creation remain distinct
product/operational events. Any future privileged access surface requires
the separate Privacy Access Audit authorization, event, retention, and
reviewer policy.

### 16.5 Operational observability privacy

Google Auth endpoint records may carry only the existing bounded request facts:
timestamp, level, static event, request ID, bounded method, static endpoint
family, status, duration, allowed Problem Details code, and other already
approved low-cardinality outcomes.

They must not include:

- email or normalized email;
- Google subject;
- userId or identityId;
- authorization code;
- access or refresh token;
- raw ID-token claims;
- state;
- nonce;
- PKCE verifier;
- cookie or session secret/hash;
- provider response/body/URL;
- raw client address; or
- arbitrary return target.

No new observability implementation is part of this freeze.

## 17. External configuration and live gates

No values are created or committed by this task. Future deployment bindings
must supply, through the existing explicit runtime/deployment composition:

- a Google OAuth/OIDC client ID;
- a server-only client secret where the selected flow requires it;
- the exact environment-specific callback URI;
- the exact allowed NatalNode public origin(s);
- the approved Google OIDC issuer/discovery/JWKS configuration;
- environment separation for local, staging, and production;
- a Google Cloud/OAuth project and consent-screen configuration;
- domain/origin authorization and redirect registration; and
- secret storage, rotation, and access controls outside the repository.

Illustrative names such as GOOGLE_OIDC_CLIENT_ID,
GOOGLE_OIDC_CLIENT_SECRET, and GOOGLE_OIDC_REDIRECT_URI are future
configuration concepts only. They are not current environment variables and
are not added by this task.

Live Google readiness additionally requires:

- approved security/privacy and processor disclosure;
- correct Google project/client configuration;
- exact callback and origin verification;
- production DNS/TLS and secure-cookie verification;
- live authorization-code exchange and JWKS/key-rotation verification;
- account creation, existing-subject, collision, deletion, and export
  acceptance in the target environment; and
- approved public copy before describing Google as active.

Staging/deployment work, Railway/Caddy configuration, DNS/TLS, credentials,
and live browser acceptance are not started by this contract freeze.

## 18. Provider adapter and dependency boundary

The future implementation should expose one narrow internal provider-neutral
boundary to the application layer, conceptually:

~~~
createAuthorizationRequest(...)
exchangeAuthorizationCode(...)
verifyIdentity(...)
~~~

The exact names may follow current source style. Routes must depend on this
internal boundary rather than importing provider SDK types, constructing raw
Google URLs throughout the app, or receiving provider responses directly in
account repositories.

No SDK or dependency is selected by this document. Implementation review must
evaluate:

- standards-compliant OIDC discovery and ID-token verification;
- mandatory S256 PKCE;
- nonce support;
- safe JWKS retrieval/cache and rotation;
- bounded error handling and no raw-provider leakage;
- small dependency surface; and
- compatibility with the current Node ESM/runtime conventions.

No Google frontend SDK, Google API client, networking layer, or provider
astronomy dependency is required or approved for P0.

## 19. Security threat matrix

| Threat | Required control | Result |
| --- | --- | --- |
| Login CSRF / attacker identity injected into victim browser | Same-origin POST initiation, server state, browser-binding cookie, anonymous-flow session check, and fixed callback correlation | Victim cannot complete an attacker-started callback without the victim's transaction binding |
| State replay | One-way state lookup, atomic claim, expiry, terminal status, and one-use callback | Replayed state is rejected and cannot create another session |
| Nonce replay or token substitution | Server nonce bound to transaction and verified against the ID token | An ID token from another transaction is rejected |
| PKCE verifier leakage/interception | Server-generated verifier, S256 challenge, server-side transient storage, no browser/log/URL exposure | Intercepted code is unusable without the verifier |
| Authorization-code leakage | Server-only exchange, no logging, no persistence, no error echo, exact redirect URI | Code is not retained or exposed after exchange |
| Provider-token leakage | No access/refresh-token persistence, no cookies/export/logs, discard adapter response | NatalNode does not become a Google API token store |
| Raw ID-token leakage | Verify transiently and extract only approved attributes | Raw claims/token are not account or operational data |
| Open redirect | Fixed success/failure destinations; no P0 return URL | Callback cannot redirect to an attacker-controlled origin |
| Existing-email account takeover | Verified email only for collision detection; no email-only link/merge; generic failure | Existing Email Magic Link account is not silently taken over |
| Cross-account email/subject collision | Subject-first resolution, normalized-email lifecycle lock, no merge, explicit ownership rules | Provider email changes cannot move an existing subject |
| Duplicate Google subject | Database unique(provider, providerSubject), atomic resolution, no new user for existing subject | One Google subject maps to one NatalNode user |
| Provider denial or network failure | Bounded adapter errors, no raw provider response, retry through a new transaction | Failure is sanitized and state is not reused |
| JWKS/signature failure | Exact configured issuer/discovery boundary, verified signature, fail closed | Untrusted or unverifiable tokens cannot authenticate |
| Expired/not-yet-valid token | Server claim-time validation and bounded clock policy | Expired or otherwise invalid tokens are rejected |
| Wrong issuer or audience | Exact issuer and client audience checks, azp handling for multi-audience tokens | Tokens minted for another client/provider are rejected |
| Session fixation or account switching | Fresh first-party session secret, server hash, active-session check, no provider credential as session | Google cannot select or retain a caller-controlled session |
| Partial persistence failure | Transactional user/identity/session commit, rollback on failure, no distributed transaction with Google | No orphaned identity/account/session is accepted |
| Provider email change | Subject remains authoritative; email identity is not rewritten or silently synchronized | Email changes do not reassign the NatalNode account |
| Pending transaction secret retention | Bounded technical expiry, terminal claim, cleanup boundary, no business data in record | OAuth correlation material has a limited security lifetime |
| Enumeration through errors/logs | Shared generic callback redirect, canonical bounded errors, static observability fields | Provider/account state is not disclosed |

## 20. Implementation-readiness matrix

| Question | Decision | Evidence or remaining boundary |
| --- | --- | --- |
| Can local route/state/PKCE/nonce/verification logic be implemented with an injected provider boundary? | Yes | Existing server composition uses explicit provider-neutral bindings; a test double can be supplied without live Google credentials |
| Can identity/account/session resolution reuse the current model? | Yes | AuthProvider already allows GOOGLE; auth_identities is unique by provider/subject and links to users; auth_sessions and the principal are provider-neutral |
| Is the existing-email collision policy safe and resolved? | Yes | New-subject email matches stop with no mutation and generic failure; there is no email-only auto-link path |
| Does the current export presenter need a coordinated narrow change? | Yes | Current V1 presenter supports only EMAIL_MAGIC_LINK and fails closed for unknown providers; a reviewed Google presenter/schema extension is required before enabling successful Google-account export |
| Do live routes require real Google credentials? | No for local implementation | Local implementation may use an injected/mock provider boundary; live acceptance does require external credentials and configuration |
| Are deployment, legal, processor, or live browser gates closed? | No | Google project/client, redirect/origin registration, privacy disclosure, target-environment configuration, and live verification remain external-gated |
| Is a material user/session data-model redesign required? | No | One Google AuthIdentity joins the existing users/session model; one bounded pending-transaction store is a normal implementation boundary, not a parallel account model |

Therefore the contract status is:

~~~
APPROVED TECHNICAL CONTRACT
LOCAL IMPLEMENTATION READY
LIVE OAUTH CONFIGURATION EXTERNAL-GATED
~~~

This status does not call Google Sign-In implemented. It means the safe local
technical boundary is sufficiently resolved for the next authorized coding
slice, while live provider operation remains blocked by external gates.

## 21. Future implementation slices

The following slices are intentionally not executed by this task:

### WEB-AUTH-GOOGLE-001B1

Implement the narrow internal Google OIDC provider abstraction and the
server-side pending transaction/state/PKCE/nonce store. Add only the migration
and runtime wiring required by that boundary. Keep provider SDK types private
and keep live credentials external.

### WEB-AUTH-GOOGLE-001B2

Implement POST /api/auth/google/start and
GET /api/auth/google/callback, exact-origin/callback middleware behavior,
OIDC verification, safe subject/email collision resolution, atomic
user/identity/session creation, existing session protection, and the reviewed
Google Account Data Export presenter/schema extension required before an
export success path can include Google identities.

### WEB-AUTH-GOOGLE-001B3

Add the minimal existing sign-in-page Google action and generic fixed-fragment
failure state. Validate the local injected/mock boundary without claiming
live Google behavior or adding fake public-development Auth.

### WEB-AUTH-GOOGLE-001C

Perform a focused adversarial Auth review covering this matrix, especially
login CSRF, state/browser binding, duplicate-subject races, existing-email
collision, token leakage, session fixation, and partial persistence.

### WEB-AUTH-GOOGLE-001D

Perform credential/configuration-aware staging/live acceptance only after the
external Google, security/privacy, deployment, legal, cookie, export, and
DNS/TLS gates are approved. Do not execute this from the contract freeze.

## 22. Live acceptance gates

Google cannot be described as active until all of the following are evidenced
outside this documentation-only task:

1. approved Google OAuth/OIDC project and client;
2. server-only secret storage and rotation;
3. exact per-environment callback URI and public-origin registration;
4. approved OIDC issuer/discovery/JWKS behavior;
5. secure production cookie and HTTPS behavior;
6. local/staging/live verification of state, PKCE, nonce, code, signature,
   issuer, audience, expiry, and collision failure paths;
7. account creation and existing-subject session behavior;
8. export presenter behavior for Google identities;
9. account deletion cascade behavior;
10. no raw OAuth material in operational records;
11. approved privacy/processor disclosure and public copy; and
12. target-environment browser evidence.

No credential, redirect URI value, provider response, or live verification is
recorded in this repository by this task.

## 23. Explicit non-goals

This contract does not:

- implement OAuth/OIDC or any route;
- add Google credentials, environment variables, secrets, or deployment
  configuration;
- add a database migration, SDK, HTTP client, or networking dependency;
- modify server source, frontend source, packages, scripts, tests, lockfiles,
  or runtime configuration;
- implement explicit account linking or account merging;
- auto-link by email;
- implement a Google profile, avatar, or Google API integration;
- persist Google access, refresh, or raw ID tokens;
- add a second user, account, session, or cookie system;
- change Email Magic Link behavior;
- change account deletion, export, retention, observability, or Privacy Access
  Audit code in this task;
- add legal/privacy pages or claim compliance;
- configure staging, DNS, TLS, Railway, Caddy, or production;
- select an astronomy provider or access C:\NatalNode;
- implement astronomy, timezone, resolver, chart, Sky, Vault, or scientific
  logic;
- start Current Transits or any P1/P2/P3 work; or
- execute the recommended next implementation slice automatically.

The safe collision decision is intentionally explicit: an existing NatalNode
email account is not silently linked to a new Google subject. The next task
must preserve this boundary.
