# PREPROD RUNTIME HARDENING 001 REVIEW

Status: `PASS` for the bounded Web runtime hardening scope

Baseline: `79394b94f17addeb39b7f4bfaac3269682d74553`

Scope is limited to `/Users/simon/Projects/NatalNode-Web`. Engine, provider
selection, `natalnode-app`, deployment, production secrets, live email, and
destructive migrations are out of scope.

## Runtime audit

- `server:start` enters `server-main` and the production-only executable. It
  parses the canonical production configuration and stops at the explicit
  Engine non-admission boundary; it does not start a listener or fall back to
  a mock.
- `dev:local` owns the local PostgreSQL/MockEngineClient composition and the
  local public edge. It has an explicit non-production engine mode.
- `dev:public` owns the public-development fixture composition with unavailable
  auth/persistence operations and no PostgreSQL or email sender.
- `db:migrate` remains a separate migration executable.
- Existing request ID, Problem Details, security-header, listener close, and
  process signal boundaries were retained.

## Review findings and disposition

| Area | Disposition |
| --- | --- |
| Runtime modes | Existing `local`/`staging`/`production` values are mapped onto the three explicit compositions `DEVELOPMENT`, `LOCAL_INTEGRATION`, and `PRODUCTION`; no implicit promotion or fallback exists. |
| Production composition root | `loadProductionRuntimeConfig` is the single production config edge; `assertProductionRuntimeAdmission` stops before dependency/listener construction. |
| Configuration | Shared server config is parsed once by the production boundary; production-only email and development-mode checks are validated there. |
| Engine | `PRODUCTION_ENGINE_CLIENT_ADMISSION=NOT_ADMITTED`; no Engine URL is consumed, and no Engine repository was accessed. |
| Public origin | Existing strict normalized origin parser remains authoritative for auth URLs and unsafe-request origin checks. |
| Database | Production configuration is required and typed; preflight does not connect; real bootstrap retains schema compatibility preflight; migrations remain explicit. |
| Cache | Existing cache remains non-authoritative. Preflight reports `correctnessAuthority=false`. |
| Email/auth | Production config can be validated without activating a sender or fake auth. Local/public adapters remain explicitly bounded. |
| Rate limits | `process-local` is not represented as distributed; production requires a distributed declaration but remains unadmitted until its implementation is bound. |
| Health/readiness | `/api/health` remains liveness; `/api/ready` is a bounded readiness endpoint and cannot return ready for a production state with Engine non-admission. |
| Lifecycle | Existing memoized shutdown path is retained; preflight and startup perform no partial listener startup. |

## Targeted gates

```text
RUNTIME_MODE_MODEL                         PASS
PRODUCTION_COMPOSITION_ROOT                PASS
CONFIGURATION_CONTRACT                     PASS
CONFIG_FAIL_CLOSED                         PASS
MOCK_RUNTIME_ISOLATION                     PASS
RESEARCH_RUNTIME_ISOLATION                 PASS
ENGINE_NON_ADMISSION                       PASS
PUBLIC_ORIGIN_AUTHORITY                    PASS
SECRET_REDACTION                           PASS
STARTUP_DIAGNOSTICS                        PASS
LIVENESS_MODEL                             PASS
READINESS_MODEL                            PASS
NO_FAKE_READY_STATE                        PASS
DATABASE_RUNTIME_BOUNDARY                  PASS
CACHE_CORRECTNESS_BOUNDARY                 PASS
EMAIL_RUNTIME_BOUNDARY                    PASS
AUTH_RUNTIME_BOUNDARY                      PASS
RATE_LIMIT_CLASSIFICATION                  PASS
GLOBAL_ERROR_BOUNDARY                      PASS
GRACEFUL_SHUTDOWN                          PASS
NO_PARTIAL_STARTUP                         PASS
PREFLIGHT_TESTABILITY                      PASS
SOURCE_FIREWALL_COMPATIBILITY              PASS
BUILD_ARTIFACT_FIREWALL_COMPATIBILITY      PASS
NO_ENGINE_ACCESS                            PASS
NATALNODE_APP_IGNORED                       PASS
PROVIDER_BOUNDARY                            PASS
```

```text
MATERIAL_WEB_RUNTIME_BLOCKER               NO
MATERIAL_EXTERNAL_DEPLOYMENT_GAP           YES
READY_FOR_PREPROD_OPERATIONS_GATE          YES
READY_FOR_PRODUCTION_ENGINE_INTEGRATION    NO
READY_FOR_PRODUCTION_INTERPRETATION        NO
READY_FOR_PRODUCTION_MY_CHART              NO
READY_FOR_PUBLIC_LAUNCH                    NO
RUNTIME_ADMISSION                          NO
```

`READY_FOR_PREPROD_OPERATIONS_GATE=YES` means the Web code boundary and
deterministic diagnostics are prepared for the next operations gate. It does
not claim external infrastructure or production launch readiness.
