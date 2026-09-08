# Unknown-Time Authority Gate 001 Review

**Baseline:** `1d91dba3b6199810b20a4f5abe122c1a55c8eb5c`

**Result:** `WEB_AUTHORITY_GATE_PASS_WITH_ENGINE_BLOCKER`

## Review conclusion

The Web now preserves the canonical `BirthRequest.ambiguityStatus` from input
through browser request, BFF validation, EngineClient transport, result
certification, interpretation/rendering eligibility, and Vault reload. Invalid
cross-field combinations and time-dependent result categories fail closed.

The current Web/Engine contract cannot authoritatively certify body positions
or aspects for an unresolved birth time: `ChartResult` has no upstream
uncertainty/certification field. This is an explicit Engine authority gap, not
a Web inference opportunity.

## Evidence reviewed

| Boundary | Evidence | Result |
| --- | --- | --- |
| Canonical request authority | `packages/contracts/src/chart-authority.ts`, `server/src/app/validation/chart-request.ts` | `ambiguityStatus` is the only authority source; contradictory fields reject |
| Browser to BFF | `ChartExperience.tsx`, chart request validator, `test/unknown-time-authority.test.mjs` | `UNKNOWN_TIME` remains null-field authority and extra authority fields reject |
| BFF to EngineClient | `cached-chart-calculator.ts`, `http-engine-client.ts` | same request is preserved; cache hits and fresh results are certified |
| Result categories | `certifyChartResultForRequest` | angles/houses/assignments/aspects reject; body facts are blocked by missing Engine certification |
| Interpretation/renderer | chart presentation policy, deterministic interpretation, ChartRenderer, workspace summaries | unavailable categories cannot be displayed or interpreted |
| Vault save/reload | `vault-record-domain.ts`, `vault-charts.ts` | input-only unknown saves; calculated results certify; stale/incoherent records return `INVALID_STATE` |
| Production boundary | `npm run test:production-architecture-boundaries` | no provider/Engine implementation admission is introduced |

## Targeted validation matrix

The focused test file covers the required matrix through the following cases:

| Case | Expected authority result | Covered |
| --- | --- | --- |
| A. exact request + full result | certified category compatibility | `PASS` |
| B. unknown request + empty result | certified as no time-dependent facts only | `PASS` |
| B. unknown request + body positions | blocked; no upstream basis | `BLOCKED_BY_ENGINE_CONTRACT` |
| C. unknown + houses/house assignments | reject | `PASS` |
| D. unknown + angles / ASC / MC | reject | `PASS` |
| E. unknown + aspects / angle relations | blocked/rejected; no upstream basis | `BLOCKED_BY_ENGINE_CONTRACT` |
| F. stale known result attached to unknown input | reject | `PASS` |
| G. input-only unknown Vault save | allowed with null time fields | `PASS` |
| H. persisted authority inconsistency | fail closed with `INVALID_STATE` | `PASS` |

Additional assertions cover unknown request serialization, extra client fields,
cache-hit certification, provenance immutability, fixture isolation, and the
absence of Web astronomy/fallback-time terms in the authority implementation.

## Gates

```text
CANONICAL_TIME_AUTHORITY_SOURCE             PASS
REQUEST_CROSS_FIELD_VALIDATION              PASS
BROWSER_BFF_AUTHORITY_PRESERVATION         PASS
BFF_ENGINECLIENT_AUTHORITY_PRESERVATION    PASS
REQUEST_AWARE_RESULT_CERTIFICATION         PASS
UNKNOWN_TIME_ANGLE_REJECTION               PASS
UNKNOWN_TIME_HOUSE_REJECTION               PASS
UNKNOWN_TIME_ASPECT_AUTHORITY               BLOCKED_BY_ENGINE_CONTRACT
UNKNOWN_TIME_BODY_FACT_AUTHORITY            BLOCKED_BY_ENGINE_CONTRACT
NO_TIME_FABRICATION                         PASS
NO_WEB_SCIENTIFIC_INFERENCE                 PASS
PROVENANCE_INTEGRITY                        PASS
INTERPRETATION_AUTHORITY_GATE               PASS
RENDERER_AUTHORITY_GATE                    PASS
VAULT_INPUT_ONLY_AUTHORITY                 PASS
VAULT_CALCULATED_AUTHORITY                 PASS
VAULT_STALE_RESULT_PROTECTION              PASS
VAULT_RELOAD_AUTHORITY                     PASS
PRODUCTION_FIREWALL_COMPATIBILITY          PASS
PROVIDER_BOUNDARY                           PASS
MATERIAL_ENGINE_AUTHORITY_GAP              YES
MATERIAL_WEB_AUTHORITY_GAP                 NO

READY_FOR_PRODUCTION_ENGINE_INTEGRATION    NO
READY_FOR_PRODUCTION_INTERPRETATION        NO
READY_FOR_PRODUCTION_MY_CHART              NO
READY_FOR_PUBLIC_LAUNCH                    NO
RUNTIME_ADMISSION                          NO
```

`DEV_ARTIFACT_BUILD_EXCLUSION` remains a separate pre-launch gate and is not
reclassified by this task. `PROVIDER DECISION DEFERRED` remains unchanged.
