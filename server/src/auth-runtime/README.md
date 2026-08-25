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
lifetime remains caller policy. Identity resolution and session issuance are
separate deferred orchestration steps.

Secure-cookie policy, cookies, auth routes, `RequestAuthenticator`, email
delivery, Google OAuth, and OAuth state/PKCE remain deferred.

Expired sessions and challenges are eligible for periodic deletion later; no
cleanup job is defined here. Session repositories, magic-link repositories,
consumption logic, cookies, login routes, and provider integrations are also
deferred to subsequent patches.
