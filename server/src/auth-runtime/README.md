# Authentication runtime architecture

This directory is server-only. Its records are implementation-side security
shapes and are not shared through `@natalnode/contracts` or exposed to browser
code.

## P0 flow

Email Magic Link and Google authentication will both resolve to the same
website identity model:

```text
provider
→ identity resolution
→ UserAccount + AuthIdentity
→ opaque high-entropy session secret
→ future secure cookie
→ auth_sessions token hash
→ future RequestAuthenticator
→ AuthenticatedPrincipal.userId
```

`NodeSecureTokenGenerator` uses Node's built-in `node:crypto` CSPRNG to create
32 random bytes (256 bits), encoded as base64url. `Sha256TokenHasher` stores the
full SHA-256 digest as a stable hexadecimal value. Plaintext bearer secrets are
transient runtime material only; persistence receives only the hash.

`IdGenerator` remains for record identity and is not used for bearer secrets.
`issueAuthSession` receives trusted timestamps from orchestration and does not
choose a session lifetime or persist the record. The same token generator and
hasher can later support magic-link secrets without a second crypto
implementation.

Magic-link issuance normalizes email identity with trim plus lowercase only,
persists the challenge hash before returning transient plaintext, and consumes
presented tokens through the repository's atomic single-use operation. Challenge
lifetime remains caller policy.

Email Magic Link authentication now composes:

```text
magic-link challenge
→ atomic consume
→ atomic identity provisioning
→ secure session issuance
→ auth_sessions persistence
```

Invalid or unusable links resolve to `null`. Downstream infrastructure errors
propagate, and a consumed challenge is never rolled back or reused. The
orchestration returns transient session material only after its hash-bearing
record is persisted.

Session tokens are intended for a configured host-only HttpOnly cookie with
`SameSite=Lax` and an explicit deployment `Secure` policy. The server-side
session expiration remains authoritative. `SessionRequestAuthenticator` reads
only that opaque cookie, fails closed on duplicate cookies, hashes it before
lookup, and returns only `userId`.

The provider-neutral magic-link URL builder now constructs the configured
fragment-based completion URL before the delivery boundary receives it. The
Email Magic Link HTTP boundary supports:

```text
request challenge
→ build /auth/complete#token=... from the configured public origin
→ provider-neutral delivery boundary receives the final URL

present token by POST
→ complete authentication
→ HttpOnly session cookie
```

Those authentication responses are `no-store`, and request initiation does
not disclose whether an account exists. The concrete email provider and its
transport remain deferred. The public logout boundary revokes
the current unambiguous session token when present and always clears the
configured browser cookie. Google OAuth and OAuth state/PKCE remain deferred.

Expired sessions and challenges are eligible for periodic deletion later; no
cleanup job is defined here. Session repositories, magic-link repositories,
consumption logic, cookies, and provider integrations are also deferred to
subsequent patches.
