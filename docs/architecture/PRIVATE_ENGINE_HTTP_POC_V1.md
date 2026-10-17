# Private Engine HTTP POC V1

**Status:** development/test integration proof only; not production-admitted.

## Purpose and authority

This isolated test harness proves the transport path:

```text
Web BFF test harness
  -> loopback HTTP client
  -> private Engine HTTP adapter
  -> injected Engine public API
  -> unchanged Engine ChartResult
```

It uses the delivered Engine checkout pinned at
`a6125470edda64fb297c0e848f212fe215137bb2` and the existing deterministic
`FakeAstronomyProvider` test fixture. Every successful calculation response carries separate transport
metadata marking it `ENGINEERING TEST DATA`, `NOT PERFORMED` for scientific
validation, and `NOT REAL ASTRONOMICAL OUTPUT`. The Engine `chart` object is not
rewritten. This synthetic output is never a production fallback.

The private HTTP transport adapter, child-process startup harness, and BFF
route are under `server/test`; they are not connected to the normal chart
route or production server composition. The separate typed Web request mapper
is server-side code and is only invoked by the test BFF in this task.
Production Engine admission remains `NOT_ADMITTED` and
`PROVIDER DECISION DEFERRED`.

## Run the focused proof

Build the pinned Engine package and its deterministic test fixture first. From
the Web repository, build the contracts/server, run the adapter tests, then run
the HTTP integration:

```sh
npm run build --workspace=@natalnode/contracts
npm run build --workspace=@natalnode/server
node --test server/test/engine-request-adapter.test.mjs
NATALNODE_ENGINE_CHECKOUT="$HOME/Downloads/natalnode-engine-handoff" \
  node --test server/test/engine-result-adapter.test.mjs
NATALNODE_ENGINE_CHECKOUT="$HOME/Downloads/natalnode-engine-handoff" \
  node --test server/test/private-engine-http.integration.test.mjs
```

The test checks the checkout commit and tracked-file cleanliness before loading
the package's public root export. It does not install or declare an Engine
dependency, inspect environment files, or add the checkout to the browser or
production build graph. The Downloads path is a local proof input, not a
deployment configuration.

## HTTP contract

`POST /v1/chart/calculate` accepts only the delivered Engine DTO shape used by
this proof:

```json
{
  "input": {
    "instant": "2000-01-01T00:00:00Z",
    "latitude": 27.95,
    "longitude": -82.46
  },
  "options": { "houseSystem": "placidus" }
}
```

The instant must be an explicit UTC timestamp; coordinates must be finite and
in range; the test transport accepts `placidus`, `whole-sign`, or `equal`.
Unknown or absent time fails schema validation. There is no inferred instant,
timezone offset, location, or unknown-time support.

Success is `{ "chart": <unchanged Engine ChartResult>, "transport": ... }`.
Errors use `{ "error": { "code": ..., "message": ... } }` and do not include
exception text, stack traces, request fields, or provider credentials. The
adapter rejects non-POST methods, non-JSON requests, malformed DTOs, and bodies
over 16 KiB; serialized responses are bounded to 512 KiB. Both listeners bind
to `127.0.0.1` on ephemeral ports and are closed by the test.

The adapter has a deadline for asynchronous Engine adapters and the HTTP client
has an abort deadline. The delivered `calculateChart` API is synchronous, so a
same-thread deadline cannot preempt a CPU-bound synchronous call. Hard
cancellation of such work is not established by this POC and would require an
isolated worker/process boundary. The test's deterministic server-timeout case
uses a never-settling asynchronous test double; it is not evidence of hard
cancellation of Engine CPU work.

Before any production service-to-service use, separately define and admit
service authentication, deployment/network isolation, operational timeout and
cancellation semantics, and production Engine/provider composition. This POC
does not implement public authentication or a public endpoint.

## Development-only Web request adapter

The internal server module at `server/src/engine-request-adapter` now accepts a
validated Web `ChartRequest` and the existing `BirthTimeResolutionService`.
For every calculation it freshly resolves the submitted local date/time through
the live canonical location owner. The browser's UTC instant, offset, tzdb
version and method are checked as claims against that result; they cannot issue
the Engine instant. The adapter takes the Engine instant and coordinates from
the server-issued `VerifiedUtcInstant`. It rejects missing/stale location IDs,
binding mismatches, forged time claims, fixture-backed locations, unknown time,
gaps, unresolved overlaps, unsupported dates and unsupported house systems.

For an overlap, the authority first returns its ordered candidates with
`REJECT`. A Web request marked exact can select a candidate only when its UTC
and offset match that server-produced candidate and its rules metadata matches
the current profile. The BFF then asks the same authority to issue a fresh
proof for that explicit earlier/later choice. An unresolved Web overlap remains
rejected. The browser cannot introduce a candidate or a timezone rule.

The supported Web-to-Engine house mapping is `Placidus` → `placidus`,
`Whole Sign` → `whole-sign`, and `Equal` → `equal`. These are the three systems
exposed by the Web input type and implemented by the pinned Engine. No custom
calculation options are exposed by Web `ChartRequest`; the adapter sends only
`houseSystem`, leaving Engine-owned optional calculation defaults and
scientific configuration in Engine control. A temporary TypeScript check in
the pinned HTTP integration test verifies the adapter payload against the
actual Engine source `ChartInput` and `ChartOptions` definitions.

The test-only BFF route at `/_test/private-engine/chart` performs verification,
adaptation and the loopback HTTP call in one request. It is not registered in
`createApp`, executable bindings or production runtime composition. It uses
only the isolated canonical-location fixtures and `FakeAstronomyProvider`.
The private Engine HTTP schema was extended only for the three mapped house
systems. The response returns the unmodified raw Engine `ChartResult` and marks
the surrounding transport as engineering test data.

The current browser form and production `/api/chart` composition are not wired
to this test flow. The form still uses its development resolver unless a
separate approved resolver is supplied, and the production route still uses
the existing Web `EngineClient`/cached-calculator contract. This test proves
the server-side authority-to-Engine request boundary with a canonical
server-owned fixture; it does not make the form's development result
authoritative or admit a production geocoding/provider composition.

## Bounded Engine result inspection adapter

The pinned Engine source defines `ChartResult` in
`packages/engine/src/domain/chart.ts`; its public package root exports that type
and the body, angle, house, aspect, warning, configuration, and provenance
contracts. The Web source of truth is `packages/contracts/src/chart.ts` plus
`chart-authority.ts`. Similar field names are not treated as proof of matching
meaning.

### Source-derived field matrix

`Mapping` is a structural/semantic mapping classification. Scientific
admission remains a separate status and is **NOT_ADMITTED for every row** in
this synthetic proof.

| Engine field / fact | Web target or inspection form | Mapping | Source-grounded rule / limitation |
| --- | --- | --- | --- |
| `schemaVersion`, `engineVersion` | Inspection `engineIdentity` | EXACT | Accept only Engine schema `1.0.0` and engine `0.1.0-foundation`; matching Web strings do not make the DTOs interchangeable. |
| Request identity | None | UNSUPPORTED | Engine echoes `input`; it has no Web/request identifier. No identifier is invented. |
| `input.instant` | `requestBinding.input.instant` | EXACT | RFC 3339 UTC from the verified Web-to-Engine request; must exactly equal the submitted Engine instant. No civil-time reinterpretation occurs here. |
| `input.latitude/longitude` | `requestBinding.input` | EXACT | Finite, in-range coordinates must exactly equal the submitted request. The canonical location/time-zone proof is not part of Engine `ChartResult`. |
| Engine `houses.system` and `metadata.houseSystem` | Inspection house-system ID | LOSSLESS_TRANSFORMATION | Must both equal the submitted, already-mapped `placidus`, `whole-sign`, or `equal` option. The Web request adapter owns the explicit label-to-ID mapping. |
| Ten body records and body order | Inspection `bodies` | EXACT | Require each Engine `BODY_IDS` entry exactly once and in Engine order: Sun through Pluto. |
| Body `id` | Inspection `bodyId` | EXACT | Copy the Engine enum without case conversion or inferred aliases. |
| Body `longitude` | Inspection longitude | EXACT | Degrees in `[0, 360)`; Engine normalizes longitude at its boundary. No Web recomputation. |
| Body `sign`, `signDegree` | Engine metadata/raw result; inspection sign | EXACT | Engine supplies these using its own `signForLongitude` boundary policy. Web does not derive or correct signs. `signDegree` stays in the unchanged raw result. |
| Body `motion`, `speedLongitude` | Inspection `engineMotion`; raw result | SUPPORTED_WITH_RESTRICTION | Engine distinguishes `direct`, `station`, and `retrograde`; Web `retrograde: boolean \| null` cannot preserve the full state. The projection does not collapse station to false. |
| Body `house` | Inspection body house | SUPPORTED_WITH_RESTRICTION | Require 1–12 and the requested house system to match. Do not independently recompute membership or claim more than the Engine supplied. |
| ASC / MC | Inspection `angles` as ASC/MC degree values | SUPPORTED_WITH_RESTRICTION | Engine returns normalized degree longitudes in `[0, 360)`. Web `AngleFact` additionally requires a sign, which Engine `ChartResult` does not supply for angles; this projection is not `AngleFact`. |
| ARMC / obliquity | Preserved in raw result only | UNSUPPORTED | They have no corresponding Web `AngleFact` identity/meaning and are not dropped from the raw Engine result. |
| Twelve Engine house cusps | Inspection numbered cusps 1–12 | LOSSLESS_TRANSFORMATION | Require exactly twelve finite normalized longitudes; array index is the Engine house number. Preserve raw array and system. No cusp or house assignment is recalculated. |
| Aspect `bodyA/bodyB` | `firstBodyId/secondBodyId` | LOSSLESS_TRANSFORMATION | Preserve endpoint order and require both IDs to reference the ten validated bodies. |
| Aspect type | Inspection `type` | EXACT | Require one of Engine's eleven exported aspect IDs. |
| `orb` | Inspection `orb` | SUPPORTED_WITH_RESTRICTION | Engine source defines orb as absolute angular separation from the exact angle. Preserve `exactAngle`, `separation`, and `orbLimit` in the raw result; Web has no admitted production orb configuration. |
| Aspect `phase` | `phaseState` | LOSSLESS_TRANSFORMATION | Enum capitalization only (`applying/exact/separating` → uppercase). Engine computes phase from relative velocity; the adapter does not recompute it. |
| Engine warnings | `engineWarnings` in Engine-native shape | UNSUPPORTED | Engine has code/subject/message/details; Web requires a severity that Engine does not provide. No severity is guessed. |
| `provider`, `modelVersions` | Inspection source identity | EXACT | Preserve both directly; Web `ChartResult` has no corresponding fields. |
| Scientific configuration IDs/status and provenance | `engineMetadata`, unchanged | SCIENTIFIC_AUTHORITY_BLOCKED | Validate required shape and preserve exact IDs/status/provenance. Engine `COMPLETE` describes its configuration binding, not provider/scientific admission. The fixture's provider is explicitly synthetic/reference-only. |
| Precision / quality | Raw provenance only | UNSUPPORTED | `accuracyProfile` is provider provenance text, not a Web quality field or a numeric precision guarantee. |
| Civil-time authority evidence | None in Engine result | UNSUPPORTED | The Web `VerifiedUtcInstant` stays in-process. Only the exact UTC instant and coordinates sent to Engine are compared. The proof/token is not returned. |
| Web `calculationStatus` / result certification | No Web `ChartResult` is created | SEMANTIC_CONFLICT | Engine configuration status is not Web result completeness. Engine has warnings but no overall partial-result status. Copying either Engine status or IDs into Web certification would overstate authority. |

### Validator and projection behavior

`server/src/development/engine-result-adapter/engine-result-adapter.ts` is a
pure, deterministic, development-only boundary. It pins the DTO version and
rejects unknown fields/variants; validates provider and model identity, all
ten unique ordered bodies, finite values and Engine ranges/enums, exact four
angle keys, twelve cusps, aspect endpoint references, warning structure,
scientific configuration status/identity shape, and non-empty provenance.
It checks that `modelVersions` exactly matches the model IDs/versions in the
returned provenance, plus result instant/coordinates and both house-system
declarations against the exact submitted Engine request. It performs no astronomical calculations,
does not verify a fingerprint from unavailable identity documents, and does
not treat a well-formed SHA256-shaped ID as scientific proof.

Failures are closed with stable adapter codes (including unsupported version,
request mismatch, invalid body/angle/house/aspect structure, missing scientific
configuration/provenance, and forged production-admission metadata). Unknown
production/certification claims are rejected rather than copied.

The successful `ENGINE_RESULT_INSPECTION_V1` projection carries fixed statuses:
`STRUCTURALLY_VALID`, `PARTIAL`, `NOT_ADMITTED`, `ENGINEERING TEST DATA`,
`NOT REAL ASTRONOMICAL OUTPUT`, `NOT_PERFORMED`, and `NOT_CREATED`. It exposes
only the bounded inspection view above and explicit contract-gap codes. It is
not assignable to Web `ChartResult`, and is not passed to `ChartRenderer`, the
production `/api/chart` / cached calculator, My Chart, or Vault. Those continue
to require their existing Web `ChartResult` and authority/certification
contracts.

The existing test-only `/_test/private-engine/chart` BFF now validates and
returns both the unchanged `chart` and this separate `projection`. Its
integration assertion independently asks the actual Engine package to
calculate the same request and compares the returned raw result and projected
fields. No canned Engine result substitutes for the HTTP calculation. The
adapter is explicitly classified `DEVELOPMENT_ONLY`; production reachability
and browser import remain prohibited by the architecture firewall. No route is
added to production composition.

### Remaining material gaps and gates

`MATERIAL_RESULT_CONTRACT_GAP` remains for Web `AngleFact.sign`, warning
severity, station-preserving Web motion, provider/model provenance, complete
aspect details, civil-time evidence, precision/quality, and a result status
that can distinguish structural completeness from scientific admission. This
task intentionally does not change Web `ChartResult` or its certification
policy to close those gaps. A later contract decision is required before any
production result projection.

The raw HTTP round-trip proves that the actual pinned Engine API ran and that
its result/provenance survived unchanged. The new inspector proves structural
validation and a partial, isolated mapping only. It does not validate the
synthetic science, certify facts, activate the production chart endpoint,
admit a provider, or establish production Engine use. An async deadline still
cannot interrupt same-thread synchronous Engine CPU work; hard cancellation
requires a separately admitted worker/process boundary.
