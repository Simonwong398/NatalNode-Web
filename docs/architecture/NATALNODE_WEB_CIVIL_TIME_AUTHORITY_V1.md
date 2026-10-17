# NatalNode Web Civil-Time Authority V1

Task: `NN-WEB-TIME-AUTHORITY-IMPLEMENT-001`

Decision: `NATALNODE_WEB_TIME_AUTHORITY_DECISION_001.md` (owner-approved, 2026-10-18)

Web baseline: `f13eb6b0f316120dcbe8f629762cdcc3bca5c12c`

## Implemented boundary

The server now exposes `createBirthTimeResolutionService` through its internal
BFF interface and server package root. It validates civil input, obtains the
live record from the existing `LocationResolutionService`, binds the selected
identity/coordinates/zone, and recomputes UTC under one pinned rules profile.

This task implements the internal service portion of the approved decision.
The report's later HTTP preview endpoint, form integration, chart/cache
orchestration and Web-to-Engine request adaptation are deferred. There is no
new endpoint, automatic runtime binding, Engine call, result certification or
persistence change. The optional `ServerDependencies.birthTimeResolutionService`
is an explicit composition seam for the next integration task.

The existing `BirthRequest` and request/result category certifier are unchanged.
Category compatibility does not establish civil-time authority. The existing
unknown-time input-only and Vault workflows remain intact.

## Dependency admission and reproducibility

| Identity | Frozen value |
|---|---|
| Civil-time policy | `NATALNODE_WEB_CIVIL_TIME_V1` |
| Resolver profile / future normalized method | `NN_WEB_CIVIL_TIME_JS_JODA_6.3.0_TZ_3.1.0_FULL_2026e_1970_2100_V1` |
| Core package | `@js-joda/core@6.3.0` |
| Zone package | `@js-joda/timezone@3.1.0` |
| Embedded IANA data | `2026e` |
| Bundle | Full package root, `dist/js-joda-timezone.js` |
| Full runtime artifact bytes | `742934` |
| SHA-256 | `38e0555a127a04afa0e357bd95cd1a4e7271dd722a547f297aaffd071f90404d` |
| Licenses | BSD-3-Clause, applicable Moment-Timezone MIT notices, IANA data notices |

The SHA is dependency integrity metadata, not a scientific fingerprint. Exact
package versions and npm SHA-512 integrity records are committed in the normal
lockfile. No unrelated dependency was upgraded, no install script was run,
and the timezone package's declared core peer (`>=5.7.0`) is satisfied by the
single deduplicated `6.3.0` instance. The only new packages are these two.

Construction verifies both installed package identities/versions, the selected
full entry path and its bytes, the same core resolution for consumer/provider,
the **actual loaded** `getTzdbData().version`, and independent London unique,
gap and overlap sentinels. The plugin's data hook has a narrow local runtime
shape check; no unpublished class is imported. Construction throws
`CivilTimeAuthorityError` with `TIME_AUTHORITY_DATA_INVALID` if admission fails.
It does not silently use ICU, reduced data, a fixture, an older profile or an
external service. No data reload method is exposed by the service.

Only server files import the library. The public contracts contain types only;
the architecture regression traverses all browser source runtime graphs and
rejects a server module or `@js-joda/*` dependency in that graph. No tzdb or
time library is introduced into browser dependencies.

The consumer packages are JavaScript, with no native runtime addon or host
zoneinfo requirement. The resolver uses portable Node APIs and explicit zone
rules. Node 24.18.0 ESM operation was executed on macOS, including child
processes under different `TZ` settings. No Linux runtime was available in
this session: Mac/Linux source compatibility follows from this implementation
and package format, while actual Linux parity execution remains unclaimed.
Use the same locked artifacts and acceptance matrix in a Linux deployment
gate; do not alter Node or substitute ICU merely to obtain a green result.

Sources: [timezone package metadata](https://registry.npmjs.org/@js-joda%2ftimezone/3.1.0),
[core metadata](https://registry.npmjs.org/@js-joda%2fcore/6.3.0),
[published full distribution](https://registry.npmjs.org/@js-joda/timezone/-/timezone-3.1.0.tgz),
[upstream documentation](https://github.com/js-joda/js-joda/blob/8c0a3b1b555bc09fced243dac13fdf5ef9746dc7/packages/timezone/README.md).
Redistribution notices are retained in
[THIRD_PARTY_TIME_RESOLUTION_NOTICES.md](../operations/THIRD_PARTY_TIME_RESOLUTION_NOTICES.md).

## Contracts and trust

Public, serializable DTOs live in
`packages/contracts/src/time-resolution.ts`:

- `CivilBirthTime`: ISO Gregorian `YYYY-MM-DD`, minute-precision `HH:mm` or
  explicit unknown null; no timezone or offset inside the local-time string.
- `CivilTimeResolutionApiRequest`: civil fields, selected resolution ID,
  asserted coordinates and IANA name, explicit `REJECT`/`EARLIER`/`LATER`,
  and nullable expected tzdb version.
- `TimeResolutionEvidence`: immutable civil tuple, server-derived location
  identity/source/coordinates/zone binding, exact rules profile, selected UTC,
  integer offset seconds and any explicit overlap choice/candidates.
- `TimeResolutionError`: closed structured code/field outcomes.

Server-only types live in `server/src/time-resolution`. `VerifiedUtcInstant`
is nominal and guarded by a private issuance `WeakSet`. Only successful
resolution can issue it; a string, matching method name, TypeScript cast,
serialized evidence object, spread copy or `verified: true` does not pass
`assertVerifiedUtcInstant`. Evidence is a whitelisted deep immutable snapshot;
it does not mutate the canonical record or retain mutable client input.

Every `resolve` re-reads the selected canonical record. The service does not
search from a label, perform another geocoding/timezone network call, or keep
a second location/time cache. Missing, expired, evicted or unavailable records
fail closed. A client cannot replace the server record with a snapshot.
Recognized development fixture source markers are rejected. Unknown input
fields and browser-supplied UTC, offset, resolution metadata, evidence or token
fields are rejected before issuing any value.

Canonical validation reuses the existing owner's shape validator. The new
export does not change that validator's semantics. Browser coordinate/zone
assertions must exactly match the live record; there is no tolerance, silent
manual override, identity merge, timezone-as-city interpretation or default
location. Separate valid Greenwich/London-centre records sharing
`Europe/London` produce the same 2025 UTC while preserving their own bindings.

## Civil interpretation and range

- Dates are parsed strictly under the Gregorian calendar, preserving the
  existing four-digit years 0001–9999 syntax before range admission. Invalid
  dates, overflow normalization, `24:00`, seconds/offset suffixes, an empty
  time or another calendar are not accepted.
- Minute precision sets local seconds/nanos to zero; it does not assert that
  the actual birth occurred exactly on that minute boundary.
- Named zone/link IDs must exist in the loaded pinned registry with exact
  spelling. `Europe/London` is valid; `Europe London`, case-repaired names,
  numeric offsets or unknown names do not acquire validity from syntax alone.
- Offset seconds preserve `local = UTC + offset`, including historical
  sub-minute values. Coordinates are finite degrees, east-positive longitude.
- Both local date and every resulting UTC candidate are admitted only in
  **1970 through 2100**, inclusive. UTC bounds are
  `[1970-01-01T00:00:00.000Z, 2101-01-01T00:00:00.000Z)`.
  Out-of-domain candidates are not filtered to manufacture uniqueness.

This is initial bounded admission, not a permanent product limit or an
assertion that all earlier IANA entries are wrong. The approved decision
defers pre-1970 historical-location/source admission. The Engine's wider
1800–2100 domain cannot override the Web gate. Future rule predictions remain
conditional on the pinned release; no claim of historical or scientific
infallibility is made. [IANA historical accuracy limits](https://data.iana.org/time-zones/tzdb-2026e/theory.html#accuracy)

## DST policy

The implementation calls `validOffsets`, not a convenience API that chooses
an occurrence or shifts a gap:

| Valid offsets | Result |
|---|---|
| 0 | `NONEXISTENT_LOCAL_TIME`; no shifted instant |
| 1 | Verified unique time (`selection.kind = UNAMBIGUOUS` in the approved contract) |
| 2 | `AMBIGUOUS_LOCAL_TIME` until explicit earlier/later and current non-null rules version |

Each candidate converts through the same zone back to exactly the original
civil tuple, with its reported offset checked at that instant. Duplicated or
unexpected candidate sets fail as data errors. UTC candidates are sorted
chronologically, independent of offset magnitude, locale or host timezone.
An earlier/later choice on a unique time is rejected as stale/inapplicable.
Neither a half-hour transition nor a skipped civil day is treated as a fixed
one-hour DST adjustment.

Unknown time produces `UNKNOWN_BIRTH_TIME` with no UTC, offset or facts.
Noon, midnight, current time or an example instant is never substituted.

## Errors and lifecycle

The internal result discriminates `VERIFIED` from `REJECTED`; no HTTP behavior
was added in this task. Principal emitted codes are:

| Condition | Code |
|---|---|
| Malformed/extra ordinary input | `INVALID_REQUEST` |
| Invalid date/time/zone/coordinates | Specific `INVALID_*` field code |
| No selected ID | `LOCATION_RESOLUTION_REQUIRED` |
| Missing/expired/unavailable live record | `LOCATION_RESOLUTION_UNAVAILABLE` |
| Selected tuple differs from server record | `LOCATION_BINDING_MISMATCH` |
| Corrupt server record, rules or failed round-trip | `TIME_AUTHORITY_DATA_INVALID` |
| Gap / unresolved overlap | `NONEXISTENT_LOCAL_TIME` / `AMBIGUOUS_LOCAL_TIME` |
| Old tzdb / missing choice version | `TZDB_VERSION_MISMATCH` / `DISAMBIGUATION_VERSION_REQUIRED` |
| Choice does not apply | `DISAMBIGUATION_NOT_APPLICABLE` |
| Pre-1970, after 2100 or UTC crossing the range | `UNSUPPORTED_TIME_RANGE` with explicit reason |
| Unknown time | `UNKNOWN_BIRTH_TIME` |
| Browser UTC/metadata/proof | `CLIENT_TIME_AUTHORITY_FORBIDDEN` |
| Fixture-backed canonical source | `DEVELOPMENT_FIXTURE_REJECTED` |
| Unissued evidence passed to assertion | `UNVERIFIED_UTC_INSTANT` exception |

No input, dependency path, underlying exception or credential is included in
runtime errors. The broader approved error union also retains unavailable and
legacy-claim codes for the later composition/adapter task; it does not imply
those integration paths already exist.

The issued object is for the current server flow. Plain evidence may later be
returned or stored as provenance, but cannot be rehydrated into authority.
There is no certificate endpoint, signing key, token database, expiration job
or clock/random-ID dependency. Existing saved records are not rewritten.
Data/library/policy changes require a new resolver profile and targeted
acceptance; neither saved records nor browser version strings select a new
or older rules source.

## Next adapter contract

The next task must invoke this service freshly before any real calculation
and before cache access. It must preserve the live-bound verified context,
check the issued object, and use the server result's UTC/coordinates. When
mapping existing `BirthRequest` projections, the tzdb version comes from
`value.authority.timezoneDatabaseVersion`, the method from
`value.authority.profileId`, and location fields from `value.location`.

The adapter must not infer authority from the unchanged public `ChartRequest`
shape, browser timestamps, a cache hit or Vault metadata. It must preserve
unknown-time rejection and the explicit overlap choice. It must not mutate
Engine scientific identities or promote raw Engine output to a certified Web
result. This task constructs no Engine request and performs no Engine test.

## Validation actually executed

- `npm run test:civil-time-authority --workspace=@natalnode/server`: **20/20**;
  includes dependency/license/lock/artifact and loaded-data checks, London
  unique/gap/overlap/choices, alternate coordinates, stale canonical TTL,
  forgery, unknown time, range, Kathmandu/Lord Howe/Apia/Monrovia expectations,
  deterministic immutable evidence, distinct process timezones, and negative
  data-version/artifact-integrity admission.
- `node --test server/test/location-resolution.test.mjs
  server/test/geonames-location-provider.test.mjs
  server/test/unknown-time-authority.test.mjs
  server/test/production-runtime-hardening.test.mjs`: **39/39**.
- `npm run test:production-architecture-boundaries`: **13/13**, including the
  new traversal proving server-only dependencies stay out of browser graphs.
  Its first run exposed a test-only dependency-graph record access mistake;
  that access was corrected and this failed target was rerun successfully.
- Affected contracts and server NodeNext builds and server no-emit typecheck
  passed. `npm ls` confirms one deduplicated exact core/timezone pair.

The repeated successful resolver/regression checks were not rerun after
documentation-only changes. No broad full suite or Astro rebuild was needed:
there are no browser runtime edits; the source firewall covers dependency
reachability. No external timezone/geocoding/astronomy provider call, production
database mutation, deployment or Engine execution was performed.

Independent London expectations follow the pinned
[IANA Europe rules](https://data.iana.org/time-zones/tzdb-2026e/europe);
the second-preserving Monrovia case follows
[IANA Africa rules](https://data.iana.org/time-zones/tzdb-2026e/africa).
Local civil time `2025-10-22 10:52 Europe/London` resolves to
`2025-10-22T09:52:00.000Z`, offset `3600`.

```text
SERVER_RESOLVER_IMPLEMENTED = YES
REQUEST_ADAPTER_READY = YES
REQUEST_ADAPTER_IMPLEMENTED = NO
PRODUCTION_ENGINE_ADMISSION = NO
REAL_PROVIDER_CALLS = 0
FORMAL_P1 = NO-GO
LEVEL_2 = NOT ESTABLISHED
PRODUCTION = NOT APPROVED
PROVIDER DECISION DEFERRED
```
