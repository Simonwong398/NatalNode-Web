# ADR: Email Magic Link Delivery Architecture

- Status: ACCEPTED — provider-independent architecture frozen; provider selection deferred
- Task: `WEB-AUTH-002A`
- Date: 2026-08-25

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

The current `EmailMagicLinkDeliveryRequest` contains `emailNormalized`, `token`,
and `expiresAt`. The current Astro application has no `/auth/complete` page and
no browser callback route. The Hono server has only the POST completion route;
no token-bearing GET callback exists.

## Decisions

1. Freeze a fragment-based browser handoff for P0.
2. Keep the completion endpoint POST-only and authoritative.
3. Make public web origin an explicit future configuration boundary.
4. Keep magic-link URL construction outside concrete email providers.
5. Refine the delivery contract in a later implementation patch so providers
   receive a final URL rather than a raw authentication token.
6. Keep email content and authentication purpose provider-neutral.
7. Disable provider click tracking for authentication links.
8. Defer selection of Resend, Postmark, or Amazon SES until an external,
   current-market review is completed.

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

The completion page will be an Astro route with a small client-side island or
script. It will:

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

The current Astro configuration already supports Astro pages, React islands,
and client-side code, so this handoff fits the repository. The `/auth/complete`
page and client behavior are intentionally deferred to the next implementation
patch.

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

Future configuration will provide an explicit provider-neutral value such as
`PUBLIC_WEB_ORIGIN`, preferably through a typed `PublicWebOrigin` boundary. It
is not added to the environment parser in this decision-only task.

The future value must:

- be an absolute URL;
- use `https` for production deployments;
- allow explicitly configured `http://localhost:<port>` for local development;
- contain no path, query, fragment, or credentials; and
- have no provider-specific meaning.

The origin must never be inferred from an incoming `Host` header. Production
versus local transport policy must be explicit in the future deployment
configuration and must not be derived implicitly from `NODE_ENV`.

## Magic-link URL builder decision

Concrete providers must not build authentication URLs. A future
provider-neutral boundary such as `MagicLinkUrlBuilder` or
`createEmailMagicLinkUrl(...)` will own URL construction using:

```text
opaque token + explicit PublicWebOrigin
  → <origin>/auth/complete#token=<encoded-token>
```

The builder belongs at the application/runtime configuration edge. Resend,
Postmark, SES, or another adapter will receive the final URL and will not
choose the callback route, query/fragment format, or navigation policy.

## EmailMagicLinkDelivery future contract

The current contract remains unchanged in this ADR and no code is modified.
The next implementation boundary should refine it to:

```ts
interface EmailMagicLinkDeliveryRequest {
  readonly emailNormalized: string;
  readonly magicLinkUrl: string;
  readonly expiresAt: string;
}
```

The future flow will be:

```text
issue challenge
  → build URL from transient token
  → pass final URL to EmailMagicLinkDelivery
  → provider adapter sends the message
```

This prevents a concrete provider from receiving or interpreting raw token
semantics and keeps routing/security policy outside the transport adapter.

## Email content and click tracking

Authentication/application code or a small provider-neutral template function
will own the purpose and message content: subject, minimal plain text, and
minimal HTML. The future message will contain only:

- NatalNode sign-in intent;
- the sign-in link or button;
- an expiration notice; and
- an instruction to ignore the message if it was not requested.

There will be no marketing content, tracking pixels, analytics links,
advertising, or unnecessary remote images. Provider click tracking will be
disabled so the opaque authentication credential is not rewritten through a
tracking redirect.

The provider adapter will own only provider request conversion and transport.
If delivery definitively fails, the existing request remains an infrastructure
failure: the persisted challenge is not rolled back and the endpoint must not
return a false success. Automatic retries are not added to the authentication
request path because provider timeouts can have ambiguous delivery outcomes.

## Provider selection criteria

The first P0 provider will be evaluated against these criteria, in order:

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

## Provider decision required

PROVIDER DECISION REQUIRES EXTERNAL CURRENT-MARKET REVIEW

Repository inspection cannot responsibly select among Resend, Postmark, and
Amazon SES without current pricing, deliverability, sending-domain, and
operational information. No current vendor facts are fabricated in this ADR.

For the eventual first adapter, prefer direct HTTP with built-in `fetch` and a
small typed provider adapter to avoid an unnecessary dependency and keep the
boundary easy to replace. An official SDK may be reconsidered only after the
selected provider and its current API requirements are reviewed. No provider
SDK is installed by this task.

## Provider credentials and bootstrap ownership

Provider API credentials, sender identity, and any provider-specific endpoint or
region belong at the executable/deployment composition edge. They must not be
added to `ServerRuntimeConfig` or the public non-secret policy objects in
`ServerEnvironmentConfig`.

The future composition direction is:

```text
explicit secret/provider configuration
  → concrete EmailMagicLinkDelivery
  + future concrete EngineClient
  → ServerBootstrapBindings
  → runServerProcess(...)
```

`createApp(...)` and the core runtime continue to depend only on the
provider-neutral delivery abstraction.

## Deferred items

- Current-market provider review and P0 provider selection.
- Explicit public-origin configuration and validation.
- `MagicLinkUrlBuilder` implementation.
- The future URL-based `EmailMagicLinkDeliveryRequest` contract.
- The Astro `/auth/complete` page and client handoff behavior.
- Provider adapter implementation, credentials, sender identity, and email
  template implementation.
- Provider API failure typing and deployment composition.
- User-facing auth UI and Google OAuth.
- Production EngineClient and astronomy-provider decisions.

## Next patch

`WEB-AUTH-002A-R1 — Current email provider market review`

After provider selection is complete, implement the frozen browser handoff and
URL-based delivery boundary in a focused follow-up patch.
