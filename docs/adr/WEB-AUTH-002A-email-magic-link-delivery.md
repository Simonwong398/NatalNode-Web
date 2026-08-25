# ADR: Email Magic Link Delivery Architecture

- Status: ACCEPTED — Resend selected for P0; provider-neutral replacement boundary preserved
- Task: `WEB-AUTH-002A`
- Date: 2026-08-25
- Provider review: COMPLETE
- Review date: 2026-08-25
- P0 provider: RESEND

## Context

The current server-side authentication flow is already provider-neutral:

```text
POST /api/auth/email/request
  → issueEmailMagicLinkChallenge(...)
  → EmailMagicLinkDelivery
  → POST /api/auth/email/complete
  → HttpOnly session cookie
```

`issueEmailMagicLinkChallenge(...)` creates an opaque token, persists only its
hash, and returns the plaintext token transiently to the request orchestration
layer. `completeEmailMagicLinkAuthentication(...)` consumes the token through
the repository's one-time operation before issuing the session. The completion
route returns a generic `401` for unknown, expired, or already-consumed links.

The current `EmailMagicLinkDeliveryRequest` contains `emailNormalized`,
`magicLinkUrl`, and `expiresAt`. The Astro application has a minimal
`/auth/complete` browser completion page. The Hono server has only the POST
completion route; no token-bearing GET callback exists.

## Decisions

1. Freeze a fragment-based browser handoff for P0.
2. Keep the completion endpoint POST-only and authoritative.
3. Make `PUBLIC_WEB_ORIGIN` an explicit provider-neutral runtime configuration
   boundary.
4. Keep magic-link URL construction outside concrete email providers.
5. Make providers receive a final URL rather than a raw authentication token.
6. Keep email content and authentication purpose provider-neutral.
7. Disable provider click tracking for authentication links.
8. Freeze Resend as the P0 concrete transactional email provider.
9. Use the official Resend Node.js SDK for the P0 transport adapter.
10. Use `auth.natalnode.com` as the preferred P0 authentication sending domain.
11. Disable both click tracking and open tracking for authentication email.

## Security invariants

The implementation that follows this ADR must preserve these invariants:

- A magic-link token is one-time and is consumed server-side.
- Plaintext token material exists only transiently during issuance and browser
  completion.
- Only the token hash is persisted.
- The browser receives an HttpOnly session cookie and never receives the
  session token as application data or frontend state.
- Completion remains a JSON `POST` to `/api/auth/email/complete`.
- Unknown, expired, and consumed tokens retain the same generic `401` response.
- Authentication responses remain `Cache-Control: no-store`.
- Tokens are never logged, persisted in browser storage, placed in analytics
  payloads, or passed to third-party scripts.

## Browser handoff

The email link will use this shape:

```text
https://<public-web-origin>/auth/complete#token=<opaque-token>
```

The completion page is an Astro route with a small client-side script. It:

1. Read the opaque token from `location.hash`.
2. Immediately remove the fragment from the visible URL and history with
   `history.replaceState(...)`.
3. POST `{ "token": "..." }` as JSON to the same-origin
   `/api/auth/email/complete` endpoint, with same-origin credentials.
4. Wait for the server response and its HttpOnly session-cookie set operation.
5. Redirect only to a fixed, safe post-login location chosen by the
   application.

The completion page and BFF API must be exposed under the same public web
origin for the P0 flow. Local development may use an explicit origin such as
`http://localhost:<port>` with the local BFF route available under that same
origin. Local HTTP is not a production security policy.

Resend does not own or modify this routing policy. The provider receives the
final application-generated link and does not choose the callback route or
browser navigation behavior.

The current Astro configuration supports Astro pages, React islands, and
client-side code, and the `/auth/complete` consumer uses a standalone
first-party shell with no third-party runtime code.

## Token, referrer, and history security

Fragments are not sent in the HTTP request target and are not included in the
normal HTTP `Referer` value. They are not risk-free: the completion page can
read the fragment, and any code running on that page could access it.

Therefore the completion page must consume and remove the fragment as its first
meaningful action. It must not load unnecessary third-party scripts before
consumption, log the token, write it to `localStorage` or `sessionStorage`, or
retain it after the POST attempt. One-time server-side consumption remains the
primary replay defense.

The following alternatives are rejected for P0:

- `GET /api/auth/complete?token=...`: exposes the bearer token in request
  targets, server/access logs, browser history, caches, and referrer paths.
- `/auth/callback/:token`: has the same path/log/history/referrer exposure and
  creates a token-bearing server GET route.
- Any query-string bearer-token format: does not preserve the POST-only
  completion boundary.
- `localStorage` or `sessionStorage`: persists a bearer credential beyond the
  immediate handoff and increases replay exposure.
- Frontend state containing the session token: conflicts with the HttpOnly
  session-cookie model.
- `Authorization: Bearer` for the session: would expose the session credential
  to frontend JavaScript and replace the current cookie boundary without a
  product requirement.

## Public web origin decision

The server now reads the required `PUBLIC_WEB_ORIGIN` through the existing
single environment boundary and stores its canonical `URL.origin` value in
`ServerRuntimeConfig.publicWebOrigin`. It is provider-neutral runtime policy,
not a Resend setting.

The configured value must:

- be an absolute URL;
- use `https` for production deployments;
- allow plain HTTP only for explicit loopback development origins such as
  `http://localhost:<port>`, `http://127.0.0.1:<port>`, or
  `http://[::1]:<port>`;
- contain no path, query, fragment, or credentials; and
- have no provider-specific meaning.

Ordinary remote HTTP origins are rejected. The parser never uses `NODE_ENV`,
`HOST`, `PORT`, forwarded host headers, request `Origin`, or `Referer` to
construct or weaken this policy. Listener binding and public browser origin
remain independent configuration concepts.

## Magic-link URL builder decision

Concrete providers must not build authentication URLs. The server now exposes a
provider-neutral `MagicLinkUrlBuilder` boundary with a concrete
`PublicWebOriginMagicLinkUrlBuilder` implementation. It owns URL construction
using:

```text
opaque token + explicit PublicWebOrigin
  → <origin>/auth/complete#token=<encoded-token>
```

The builder is constructed once at the runtime composition edge from the
validated public origin. An empty token is rejected without being included in
an error. Resend, Postmark, SES, or another adapter receives the final URL and
does not choose the callback route, query/fragment format, or navigation policy.

## EmailMagicLinkDelivery contract

The delivery contract now is:

```ts
interface EmailMagicLinkDeliveryRequest {
  readonly emailNormalized: string;
  readonly magicLinkUrl: string;
  readonly expiresAt: string;
}
```

The flow is:

```text
issue challenge
  → build URL from transient token
  → pass final URL to EmailMagicLinkDelivery
  → provider adapter sends the message
```

The issuance/orchestration path builds the final URL after the challenge is
persisted and before delivery is attempted. The raw token does not cross the
`EmailMagicLinkDelivery` boundary, so a concrete provider does not receive or
interpret token semantics. Routing and public-origin policy remain outside the
transport adapter.

## Email content and tracking

Authentication/application code or a small provider-neutral template function
owns the purpose and message content: subject, minimal plain text, and minimal
HTML. The message contains only:

- NatalNode sign-in intent;
- the sign-in link or button;
- an expiration notice; and
- an instruction to ignore the message if it was not requested.

There will be no marketing content, tracking pixels, analytics links,
advertising, or unnecessary remote images. Provider click tracking will be
disabled, and provider open tracking will also be disabled. The opaque
authentication credential must not be rewritten through a tracking redirect or
exposed through a tracking pixel.

The concrete provider adapter owns only provider request conversion and
transport. The Resend adapter sends once and returns success or throws an
infrastructure failure. If delivery definitively fails, the persisted
challenge is not rolled back and the endpoint must not return a false success.
Automatic retries are not added to the authentication request path because
provider timeouts can have ambiguous delivery outcomes and retries may produce
duplicate sign-in emails.

## Provider selection criteria

The P0 provider review used these criteria, in order:

1. Transactional email reliability.
2. Straightforward API integration.
3. Verified custom sending-domain support.
4. Low operational burden for a small product.
5. Suitability for one-time authentication links.
6. Clear failure semantics.
7. No heavyweight email-marketing platform requirement.
8. Reasonable initial low-volume cost.
9. Easy replacement behind `EmailMagicLinkDelivery`.

The architecture remains compatible with Resend, Postmark, and Amazon SES. No
multi-provider framework will be introduced.

## P0 provider selection

`P0 PROVIDER: RESEND`

`PROVIDER REVIEW: COMPLETE`

`REVIEW DATE: 2026-08-25`

Resend is selected for P0 transactional authentication email. This is not a
permanent vendor lock-in decision; the existing `EmailMagicLinkDelivery`
boundary must continue to allow replacement later.

The reviewed Resend facts are:

- Free transactional tier: 3,000 emails per month.
- Free-tier daily sending limit: 100 emails per day.
- Free tier includes 3 verified domains as of 2026-08-25.
- Pro plan: $20 per month for 50,000 emails per month.
- REST API and official Node.js SDK.
- Verified custom sending domains with SPF/DKIM support.
- Domain-level open and click tracking controls.
- Suitability for transactional application email and straightforward
  small-team integration.

NatalNode P0 currently needs low-volume, transactional, authentication-only
email rather than marketing automation, mass campaigns, or multi-provider
routing. Resend provides the best current balance for this scope across low
operational burden, low initial cost, simple Node integration, custom-domain
support, and replaceability behind the existing abstraction. This decision does
not claim objectively superior inbox placement versus all competitors.

## Reviewed alternatives

### Postmark

Postmark remains a valid future alternative. It is strongly transactional-email
oriented and provides a REST API, custom sending domains, and link tracking
whose default and explicit `None` setting disable tracking. Its reviewed free
Developer tier provides 100 emails per month, and its Basic paid tier starts at
$15 per month.

Postmark is architecturally strong and is not considered inferior or
unreliable. It was not selected for P0 because NatalNode's initial low-volume
requirements benefit more from Resend's larger free allowance with similarly
straightforward API integration.

### Amazon SES

Amazon SES remains a future scale/cost alternative. Its reviewed outbound
sending cost is approximately $0.10 per 1,000 emails, with highly scalable,
regional AWS infrastructure. New or sandbox accounts require additional
operational setup; sandbox limits include 200 messages per 24-hour period and 1
message per second until production access is granted.

SES was not selected for P0 because its operational and configuration burden is
unnecessary for the current authentication-email volume. It may be
reconsidered if future scale or cost requirements justify it. No AWS
integration plan is created by this ADR.

## P0 integration implementation choice

The P0 transport implementation is the official Resend Node.js SDK, installed
as the direct `resend` runtime dependency of `@natalnode/server`.

The official maintained Node client provides a typed API surface and handles
Resend API authentication and request details, reducing integration code while
keeping the provider isolated behind `EmailMagicLinkDelivery`.

## Resend boundary and inward dependency rule

The concrete adapter is:

```text
ResendEmailMagicLinkDelivery
        implements
EmailMagicLinkDelivery
```

Resend-specific types must not leak into `@natalnode/contracts`, application
authentication contracts, `EmailMagicLinkDelivery`, `ServerDependencies`,
routes, or frontend code. Only the concrete deployment/bootstrap edge may know
the Resend client, API key, and sender configuration.

## P0 sending domain

The preferred P0 authentication sending domain is:

```text
auth.natalnode.com
```

This isolates authentication-email sending reputation from unrelated future
mail categories. The preferred sender identity is conceptually:

```text
NatalNode <signin@auth.natalnode.com>
```

This is a deployment and DNS configuration decision. The sender must not be
hardcoded in application contracts; the concrete adapter configuration
receives it explicitly. No DNS changes are performed by this ADR.

Before production sending, the Resend sending domain must be verified with the
required DNS authentication, including SPF and DKIM. DMARC should also be
configured appropriately as part of production domain-email hygiene. DNS
automation is deferred.

## Provider credentials and bootstrap ownership

Provider API credentials, sender identity, and any provider-specific endpoint or
region belong at the executable/deployment composition edge. They must not be
added to `ServerRuntimeConfig` or the public non-secret policy objects in
`ServerEnvironmentConfig`. Deployment composition owns the Resend API key and
sender identity/configuration; neither is added to environment parsing or
repository configuration by this ADR.

The deployment composition direction is:

```text
explicit secret/provider configuration
  → concrete EmailMagicLinkDelivery
  + future concrete EngineClient
  → ServerBootstrapBindings
  → runServerProcess(...)
```

`createApp(...)` and the core runtime continue to depend only on the
provider-neutral delivery abstraction.

Replacing Resend later must not require rewriting magic-link token issuance,
the browser handoff, `/api/auth/email/complete`, session-cookie logic, auth
repositories, or frontend session semantics. Only the concrete
`EmailMagicLinkDelivery` adapter and deployment configuration should change.

## Deferred items

- Deployment composition, credentials, sender identity, DNS verification, and
  Resend domain configuration.
- Provider API failure typing and operational error policy.
- User-facing auth UI and Google OAuth.
- Production EngineClient and astronomy-provider decisions.

## Next implementation sequence

`WEB-AUTH-002E — Email sign-in request browser UX`

The browser handoff, URL-based delivery contract, provider-neutral template,
and P0 Resend adapter are implemented. The browser request experience remains
a separate patch.
