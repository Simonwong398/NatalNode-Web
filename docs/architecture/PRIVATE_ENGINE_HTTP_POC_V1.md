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

## Remaining Engine-to-Web result DTO gaps

The current raw Engine result must not be assigned or projected into Web
`ChartResult` without a separately admitted result adapter:

- Engine returns `provider`, `modelVersions`, and its complete `input`; the Web
  result has no matching fields for these. Dropping them would lose provenance.
- Engine body rows use `id`, `motion`, `speedLongitude`, `signDegree`, and
  numeric `house`, with optional latitude/distance. Web rows use
  `bodyId`, nullable `retrograde`, and nullable `house`; policy is needed for
  motion-to-retrograde conversion and for preserving or rejecting the extra
  Engine values.
- Engine angles are a numeric object containing ascendant, midheaven, ARMC and
  obliquity. Web angles are an array of longitude/sign facts. The target IDs,
  sign derivation and treatment of ARMC/obliquity are not mapped.
- Engine houses are always a `HouseResult` with numeric cusps. Web houses may
  be null and use numbered cusp facts. Completeness and nullability policy is
  not defined.
- Engine aspects contain `bodyA/bodyB`, exact angle, separation, orb limit and
  lower-case phase. Web aspects use `firstBodyId/secondBodyId`, upper-case
  phase state and omit exact angle, separation and orb limit. Field and phase
  mapping remains unadmitted.
- Engine warnings carry a typed code, subject and optional details. Web
  warnings carry severity. Severity and message policy is not defined.
- Engine metadata carries Engine calculation policy, scientific provenance,
  configuration-binding and provenance-envelope status. Web metadata is a
  separate complete/incomplete union with different identity fields. No
  scientific identity or certification may be inferred by copying these
  objects.

The HTTP round-trip proves that the actual Engine API ran and that its raw
result and provenance survived the development transport unchanged. It does
not certify synthetic facts, adapt Engine results to Web `ChartResult`, activate
the production chart endpoint, or establish production Engine admission.
