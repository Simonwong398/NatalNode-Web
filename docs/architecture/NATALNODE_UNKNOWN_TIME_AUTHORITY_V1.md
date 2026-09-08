# NatalNode Unknown-Time Authority V1

**Status:** enforced Web/BFF request-result boundary; production interpretation
and runtime admission remain closed

**Scope:** this repository's request validation, EngineClient transport,
ChartResult certification, interpretation/rendering eligibility, and Vault
persistence/reload. This document does not make the Web an astronomy authority.

## Frozen authority chain

```text
BirthInput authority
  -> ChartRequest
  -> browser transport
  -> BFF validation
  -> EngineClient request
  -> ChartResult
  -> request-aware result certification
  -> interpretation eligibility
  -> renderer eligibility
  -> Vault persistence
  -> reload / future reader surfaces
```

The canonical time-authority source is the existing
`BirthRequest.ambiguityStatus`. No parallel `isUnknownTime`, guessed timestamp,
or presentation-only flag is authoritative.

The scientific authority boundary remains:

```text
NatalNode.com -> Website API / BFF -> NatalNode Engine Public API -> AstronomyProvider
```

`PROVIDER DECISION DEFERRED`. The Web/BFF validates categories and preserves
provenance; it does not calculate or infer astronomy.

## Request contract

The request validator rejects an authority-incoherent request before Engine
delegation:

| `ambiguityStatus` | Required time fields |
| --- | --- |
| `EXACT` | `localTime`, `resolvedUtcInstant`, and `utcOffsetSeconds` are present |
| `AMBIGUOUS` | `localTime` is present; resolved UTC and offset are null |
| `NONEXISTENT` | `localTime` is present; resolved UTC and offset are null |
| `UNKNOWN_TIME` | local time, resolved UTC, and offset are all null |

`houseSystem` must be non-empty. The BFF rejects unknown request fields rather
than accepting a client-supplied ASC, MC, house, or other authority override;
browser request builders introduce no such fields. The same canonical request
is passed to `EngineClient`; the BFF does not normalize an incoherent request
into a different authority state.

## Result certification

`certifyChartResultForRequest(request, result)` is the single Web-side
request/result category gate. Its policy identifier is
`REQUEST_RESULT_AUTHORITY_CERTIFICATION_V1` and its result is deterministic:

- `CERTIFIED` means only that the result categories are compatible with the
  request authority. It is not a scientific recalculation or provider claim.
- `REJECTED` identifies the incompatible category or the invalid request and
  is mapped to the existing generic calculation-unavailable boundary by the
  HTTP path. No sensitive result is printed.

For `EXACT`, the current Web contract accepts the supplied result categories
without changing Engine scientific metadata. For unresolved time
(`UNKNOWN_TIME`, and the same fail-closed category policy for
`AMBIGUOUS`/`NONEXISTENT`), the following are forbidden:

- angles, including ASC and MC;
- houses and body-to-house assignments;
- aspects, including angle relations.

Body positions are also rejected with
`UNSUPPORTED_UNKNOWN_TIME_FACT_CERTIFICATION` because the current
`ChartResult` contract contains no explicit upstream certification describing
which body positions are time-safe. The Web does not infer that a planet is
slow, that the Moon is safe, or that an aspect is safe from a timestamp alone.
An empty result with no time-dependent facts can be certified as an empty
category result; this does not certify missing body or aspect facts.

The certifier does not calculate longitude, inspect orb policy, estimate
motion, fabricate a time, mutate scientific provenance, or sanitize a rejected
result. Cache hits and fresh Engine results pass through the same gate.

## Interpretation and renderer eligibility

Interpretation consumes only a result that has crossed the request-aware
certification boundary. Presentation policy is derived from the request
authority, not from the presence of fields in a result. With unresolved time,
ASC/MC, houses, house interpretation, and aspects are unavailable; unknown or
malformed data cannot re-enable them. Core supplied body facts are not treated
as certified merely because the renderer received a result.

This is a boundary policy, not a new interpretation system. Existing
provenance, confidence, direction, provider, and research/runtime boundaries
remain unchanged.

## Vault authority

- An `INPUT_ONLY` unknown-time record may be saved with all time fields null,
  `timeAuthorityState = UNKNOWN_BIRTH_TIME`, and no authoritative result.
- A calculated record must retain the request authority, be structurally valid,
  and pass the same request-aware result certification before save.
- A stale known-time result cannot attach to a newly unknown input.
- Reload, list, duplicate, and metadata-return paths revalidate persisted
  authority and return `INVALID_STATE` on inconsistency. They never repair,
  infer, or silently rewrite persisted records.
- Development fixture records remain explicitly development-only and are not
  promoted to authoritative calculated records.

## Non-goals and readiness

This gate does not modify the Engine repository, select a provider, add
astronomy, calculate positions/houses/aspects, introduce an uncertainty
metadata field, or admit production interpretation. The existing
`DEV_ARTIFACT_BUILD_EXCLUSION` concern remains a separate pre-launch gate.

Current certification status:

```text
WEB_AUTHORITY_GATE_PASS_WITH_ENGINE_BLOCKER
UNKNOWN_TIME_BODY_FACT_AUTHORITY  BLOCKED_BY_ENGINE_CONTRACT
UNKNOWN_TIME_ASPECT_AUTHORITY     BLOCKED_BY_ENGINE_CONTRACT
MATERIAL_ENGINE_AUTHORITY_GAP     YES
MATERIAL_WEB_AUTHORITY_GAP        NO
READY_FOR_PRODUCTION_ENGINE_INTEGRATION  NO
READY_FOR_PRODUCTION_INTERPRETATION      NO
READY_FOR_PRODUCTION_MY_CHART             NO
READY_FOR_PUBLIC_LAUNCH                   NO
RUNTIME_ADMISSION                         NO
```

Targeted validation is exposed as:

```sh
npm run test:unknown-time-authority --workspace=server
```
