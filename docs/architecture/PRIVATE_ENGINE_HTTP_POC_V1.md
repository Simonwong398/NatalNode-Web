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

The adapter, child-process startup harness, and BFF route are all under
`server/test`; they are not connected to the normal chart route or production
server composition. Production Engine admission remains `NOT_ADMITTED` and
`PROVIDER DECISION DEFERRED`.

## Run the focused proof

Build the pinned Engine checkout using its normal package build, then run from
the Web repository:

```sh
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
in range; the bounded proof accepts the Placidus house-system option. Unknown
or absent time fails schema validation. There is no inferred instant, timezone
offset, location, or unknown-time support.

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

## DTO compatibility and remaining adapter work

There is intentionally no field-level Web-to-Engine mapper in this task.

- Web `ChartRequest` contains a `BirthRequest`: civil date/time, birthplace
  label and optional canonical location ID, coordinates, IANA zone, normalized
  UTC instant, offset, timezone database/resolution provenance, and ambiguity
  status, plus the Web house-system string.
- Engine `ChartInput` contains only a required UTC `instant`, latitude, and
  longitude; `ChartOptions` carries its typed house-system option. The Web
  request therefore cannot be passed through directly. A future adapter must
  consume already-authoritative Web resolution output and fail closed when
  `resolvedUtcInstant` is absent; timezone/place resolution belongs to Web.
- Engine `ChartResult` includes provider/model identity and the Engine input,
  uses an angles object and Engine house/result types, and carries Engine
  scientific provenance. Web `ChartResult` has a different union for
  calculation completeness, array-shaped angle facts, nullable Web house facts,
  and different scientific metadata. Direct assignment/projection has not been
  admitted. A separately reviewed field-level mapper must preserve or
  explicitly reject every semantic/provenance field.

The transport round-trip proves byte-JSON semantic preservation of the Engine
result only. It does not prove Web request compatibility, Web result
certification, unknown-time authority, production scientific validity, or
production readiness.
