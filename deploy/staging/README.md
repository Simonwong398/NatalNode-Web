# NatalNode P0 staging edge contract

This directory contains the repository-local Caddy composition for the
accepted Railway research/staging topology. It is a deployment handoff, not a
claim that Railway, DNS, TLS, PostgreSQL, or an external scheduler has been
provisioned.

The edge is the only public service. It serves `apps/web/dist` and proxies
`/api` and `/api/*` to the private API service. The API and PostgreSQL services
must not receive public browser traffic or production credentials.

Required non-secret edge environment:

- `PORT` — the internal listener port supplied by the staging platform.
- `API_UPSTREAM` — a platform-resolved private API origin; it must never enter
  the Astro build or browser code.

The edge always emits:

- `X-Robots-Tag: noindex, nofollow`;
- `X-NatalNode-Environment: staging`;
- the minimum artifact-compatible CSP and security headers in the Caddyfile.

For API proxy requests, Caddy removes and overwrites the inbound
`X-NatalNode-Client-IP` value with the direct edge peer address, and removes
that internal header from the response. It preserves the request method, path,
query, body, origin, cookies, and API response status/body/headers needed by the
same-origin Web flow.

The API service uses the existing environment contract with these staging
constraints:

- `NATALNODE_RUNTIME_MODE=staging`;
- `PUBLIC_WEB_ORIGIN=https://staging.natalnode.com`;
- `AUTH_SESSION_COOKIE_SECURE=true`;
- `ENGINE_CLIENT_MODE=development-mock`;
- `AUTH_GOOGLE_ENABLED=false` until a separate provider credential/binding gate
  is complete;
- `COMMUNITY_OPERATOR_CONFIGURED=true` and
  `PRACTITIONER_OPERATOR_CONFIGURED=true` only when the staging operator has
  been explicitly assigned; otherwise the corresponding operational surfaces
  remain fail-closed;
- a separate staging `DATABASE_URL`, auth configuration, and Resend secret;
- no production database data or production secret is copied into staging.

The API health endpoint is `/api/health`. Unknown `/api` routes must remain API
Problem Details responses and must not fall through to the static Astro 404.
The pre-deploy migration command is the existing explicit `npm run db:migrate`
contract and is run only by the externally configured staging lifecycle.

Evidence still required outside this repository includes Railway service
creation, region confirmation, private-network verification, DNS/TLS,
separate secret stores, migration execution, Resend delivery, browser smoke
tests, and scheduler/backup/observability verification.
