# Windows integrated Engine/Web local workflow

This is a Windows-only, loopback-only preproduction workflow. It does not admit the Engine Provider for science or production. The integrated default uses the archived R5 chart fixture; no Engine calculation occurs in fixture mode.

## One-command fixture browser workflow

From the Web repository root, configure `NATALNODE_ENGINE_CHECKOUT` for the verified Engine checkout, then run:

```powershell
npm run dev:windows-integrated-real-web-mvp:fixture
```

The command builds the existing server workspaces, starts the BFF and Astro on `127.0.0.1`, and prints the local `/dev/chart` URL. Search for Greenwich and select the result, enter `2000-01-01` at `12:00`, and leave the house system at Placidus. This exact context is required by the archived fixture. Location resolution is a fixed test fixture and does not query GeoNames. The page labels the chart as an archived research fixture, states that no calculation occurred, and shows the historical source provenance. It is not evidence of a new astronomy run.

The fixture-only command does not start the private Engine service. To run the full integrated *fixture* environment, use the same Engine checkout plus externally configured runtime manifest path, independently supplied manifest SHA-256, and private-service bearer token, then run:

```powershell
npm run dev:windows-integrated-real-web-mvp
```

The full command validates the committed Engine HEAD and tracked/staged state, verifies the runtime manifest closure, starts the existing private Engine service and the Website BFF/Astro, then makes one unauthenticated negative request to `/v1/chart/calculate`. The expected `401 UNAUTHORIZED` proves loopback reachability and that authentication precedes calculation admission. It is not an authenticated chart request. The browser still receives only the archived R5 fixture.

Secrets must be supplied through the existing external secret configuration and must not be stored in this repository, `.env`, the browser bundle, shell history, or logs. Required process variables for full mode are:

- `NATALNODE_ENGINE_CHECKOUT`
- `NATALNODE_PRIVATE_RUNTIME_MANIFEST_PATH`
- `NATALNODE_PRIVATE_RUNTIME_MANIFEST_SHA256`
- `NATALNODE_PRIVATE_SERVICE_BEARER_TOKEN`

The launcher does not echo secret values or private manifest paths. It binds both HTTP listeners only to IPv4 loopback and shuts down only the Astro and Engine child processes it started. Press Ctrl-C in that command window for controlled shutdown.

## Separately authorized single J2000 browser run

The real mode is disabled by default. Do not use it without a separate explicit owner authorization for exactly one J2000 chart. After that authorization only, inject the same external Engine configuration, set `NATALNODE_LOCAL_CHART_REAL_CALL_ENABLED=true` in the current PowerShell process, and run:

```powershell
npm run dev:windows-integrated-real-web-mvp:real
```

This starts the same local service composition but sends no chart automatically. In the browser, use only:

- local date/time: `2000-01-01`, `12:00`
- location: fixed Greenwich test location, latitude `51.4779`, longitude `-0.0015`, time zone `Europe/London`
- house system: Placidus
- expected UTC instant: `2000-01-01T12:00:00Z`

The BFF rejects requests outside this exact context, never falls back to a fixture or Fake Provider in real mode, and permits at most one valid calculation request per running BFF process. An unsuccessful or ambiguous attempt must not be retried by restarting the process; obtain fresh owner authorization before another attempt. The environment gate is a software guard, not a substitute for owner authorization.

For that separately authorized run, preserve a private sanitized evidence record outside the source tree with the Engine HEAD, verified runtime identity, service instance/request execution IDs, source-route verification, result counts, research/provenance status, and shutdown status. Do not retain or publish personal birth data, secrets, raw result payloads, local file paths, or native stack traces. Expected presentation shape is ten bodies, the contract's two angles, twelve house cusps, and the returned aspects; the result remains `RESEARCH_ONLY` / `INCOMPLETE_RESEARCH`. This is not scientific admission, Level-2, or production approval.
