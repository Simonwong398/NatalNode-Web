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

The plaintext session secret and plaintext magic-link secret are never stored.
The database stores only one-way token hashes. Magic-link challenges are
single-use and short-lived through `createdAt`, `expiresAt`, and `consumedAt`.

Server runtime code will later own ID and timestamp generation through its
`IdGenerator` and `Clock` boundaries. Session lifetime, email normalization
(currently limited to trim plus case normalization), cryptographic hashing,
secure-cookie policy, email delivery, Google OAuth, and OAuth state/PKCE remain
deferred.

Expired sessions and challenges are eligible for periodic deletion later; no
cleanup job is defined here. Session repositories, magic-link repositories,
consumption logic, cookies, login routes, and provider integrations are also
deferred to subsequent patches.
