# NatalNode Location Resolution Architecture V1

Status: provider-neutral foundation for WEB-P1-PLATFORM-001.

Provider selection and production provider binding remain deferred to
`EXT-LOCATION-001`. This document defines the Web contract and safety boundary;
it is not a geocoder integration plan for a named vendor.

## 1. Product purpose

Birthplace is a human place-selection problem, not a string-formatting problem.
The future product flow is:

```text
human place input
  -> bounded search
  -> candidate list
  -> explicit selection
  -> canonical place identity + coordinates
  -> IANA timezone boundary
  -> historical local-time resolution
  -> chart request
```

The purpose of this foundation is to make that authority chain explicit while
keeping the current deterministic development chart flow available and clearly
labelled as development-only.

**NO LOCATION GUESSING**

**RAW LOCATION TEXT IS NOT LOCATION AUTHORITY**

## 2. Raw input versus resolved location

The raw query is exactly what the user typed. It is useful for search and for
returning the form to an editable state, but it has no geographic authority.
`"LA USA"`, `"Shanghai China"`, `"Paris"`, and `"Springfield"` do not become
canonical places merely because they are non-empty strings.

A selected canonical location is a separate object with a stable opaque
`resolutionId`, authority identity, canonical display, and authoritative
coordinates. Display text is supplied by the resolution authority. The Web does
not title-case, transliterate, or otherwise manufacture a canonical place name
from the raw query.

The browser-facing state keeps `rawQuery` and `selectedLocation` in separate
fields. Server code does not persist or log the raw query as part of ordinary
observability.

## 3. Resolution state machine

The shared provider-neutral state vocabulary is:

```text
EMPTY -> SEARCHING -> CANDIDATES -> RESOLVED
                         |
                         +-> AMBIGUOUS -> RESOLVED after explicit selection
                         +-> UNRESOLVED

SEARCHING / CANDIDATES / AMBIGUOUS / UNRESOLVED -> ERROR when the boundary fails
```

`RESOLVED` requires a selected canonical record. `AMBIGUOUS` requires user
choice; it is never collapsed into the first result. `UNRESOLVED` and `ERROR`
cannot submit a production calculation. The API search response deliberately
uses only the provider-neutral `CANDIDATES` or `UNRESOLVED` outcomes; the
browser derives `AMBIGUOUS` when more than one candidate is present.

## 4. Canonical location model

`packages/contracts/src/location.ts` defines the provider-neutral model:

- `resolutionId`: opaque stable identity for the resolved selection;
- `canonicalDisplayName`;
- optional `locality` and `region`;
- `country` and optional country code;
- finite `latitude` and `longitude`;
- IANA `ianaTimeZone` on a resolved record;
- `status: RESOLVED`;
- `authority: { kind: GEOCODING, sourceId, recordId }`;
- nullable source and dataset version metadata.

Search candidates use the same place identity fields but are not authoritative
until selected. A candidate may have no coordinates until the authority can
resolve it. A resolved record must have coordinates and an IANA timezone.

The generic contract carries opaque authority and version fields rather than
vendor-shaped payloads. No secrets, API credentials, vendor SDK objects, or
country-string timezone guesses cross the browser contract.

## 5. Search and selection UX

The future Birth Location field exposes a typed query and can render the
following provider-neutral states without pretending that a live provider is
connected:

- searching status;
- candidate buttons;
- selected canonical display, coordinates, and IANA timezone;
- ambiguous selection-required status;
- localized unresolved/error status.

The candidate button is an explicit user action. Until it is followed by a
successful resolution, the chart submission boundary has no selected location
authority. Canonical names are shown as returned by the authority; the UI does
not maintain a city-name dictionary.

## 6. Ambiguity policy

Multiple candidates produce `AMBIGUOUS` in the browser state. The UI must ask the
user to select one. It must not choose the first result, infer from country
strings, or continue calculation with the raw query. A production submission
with no matching resolved identity is rejected.

## 7. Unresolved policy

No established candidate produces a localized `UNRESOLVED` state. Provider
unavailability or invalid provider data produces the bounded
`LOCATION_RESOLUTION_UNAVAILABLE` problem response at the BFF boundary. Neither
case returns a guessed city, fixed coordinates, or the development New York
fixture.

## 8. Geocoding authority

`GeocodingProvider` is a server-side, provider-neutral interface:

```text
search(query, locale) -> LocationCandidate[]
resolve(candidateId, locale) -> CanonicalResolvedLocation | null
```

`LocationResolutionService` validates inputs and provider output, applies a
deadline, clones/freeze-protects returned records, and keeps only transient
resolved selections needed by the current composition. Invalid or unavailable
provider output fails closed.

The service is the only application boundary that knows the provider interface.
No named provider is selected or imported in this campaign.

## 9. Timezone boundary authority

Geocoding establishes a canonical place and coordinates. Timezone resolution is
a separate authority boundary that consumes coordinates and returns an IANA zone.
The `ianaTimeZone` field in the canonical result is an identity, not a country
label or fixed numeric offset. A future composition may place the timezone
authority behind `LocationResolutionService`, but it must remain semantically
separate from human-place matching.

The contract therefore does not permit `UTC+8`, `UTC-7`, or a country string to
stand in for an IANA timezone authority. No user-facing manual timezone override
is added here.

## 10. Historical time authority

Historical time resolution is a third boundary:

```text
IANA zone + local date/time
  -> valid / ambiguous / nonexistent local time
  -> historical UTC instant and date-dependent offset
```

The existing birth-input time contract remains the place for ambiguity status,
UTC instant, offset, timezone database version, and resolution method. This Web
foundation does not add a second time engine or calculate DST/rule history.
Historical offsets are date-dependent and are never promoted to canonical
timezone identity.

## 11. Browser, BFF, and provider dependency

The intended dependency direction is:

```text
BirthLocationField
  -> Website API / BFF
  -> LocationResolutionService
  -> GeocodingProvider
```

The bounded BFF surfaces are `POST /api/location/search` and
`POST /api/location/resolve`. Their request/response shapes are exported from
`@natalnode/contracts` and contain no vendor schema. The browser never calls a
third-party geocoder directly and never receives provider credentials.

The server dependency is optional until an approved provider is bound. The
absence of that dependency is an explicit unavailable state, not a reason to
activate the development resolver.

## 12. Development fixture behavior

`DevelopmentBirthInputResolver` remains a deterministic UI development fixture.
It preserves the user-entered `locationLabel` for form demonstration but returns
fixed New York coordinates/timezone metadata for the existing chart fixture.
Its UI notice remains explicit:

```text
UI DEVELOPMENT ONLY — NOT HISTORICAL TIMEZONE EVIDENCE — NOT PRODUCTION RESOLUTION
```

The fixture is not a `GeocodingProvider`, does not resolve arbitrary places, and
does not calculate timezone or DST data. A test or local development flow may
exercise it, but it must never be described as a resolved user location.

## 13. Production fail-closed behavior

When `operationalConfig.runtimeMode` is `production`, the chart route requires:

- an injected `LocationResolutionService`;
- a non-empty opaque `locationResolutionId`;
- a stored `RESOLVED` record with the same ID;
- exact agreement between the selected record's coordinates/timezone and the
  chart request.

If the service is absent, the route returns
`LOCATION_RESOLUTION_UNAVAILABLE`. If the ID is absent, it returns
`LOCATION_RESOLUTION_REQUIRED`. A stale, mismatched, ambiguous, unresolved, or
fixture-backed request is not calculated. Production never silently invokes
`DevelopmentBirthInputResolver` and never falls back to New York.

## 14. Privacy and logging

Raw birthplace queries, complete birth date/time, and birth-associated
coordinates are sensitive product input. The location routes use the existing
bounded request reader and return generic problem details. The ordinary
observability record contains request ID, method, endpoint family, status, and
duration; it does not include request bodies or location payloads.

The location service logs nothing. Provider errors are caught at the BFF and are
not copied into response details or operational logs. Future non-sensitive
events may distinguish statuses such as search success, no results, resolve
success, and resolve error, but must not carry raw location or birth data.

## 15. Future provider integration point

`EXT-LOCATION-001` is the next external-authority decision point. It may select
and bind a provider behind `GeocodingProvider`, add the separately governed
timezone authority, and establish production operational configuration. That
work must preserve opaque authority metadata, the BFF boundary, rate limits,
deadlines, privacy rules, and explicit selection semantics.

Until then, the provider status is `PROVIDER DECISION DEFERRED` and no vendor
dependency, SDK, environment variable, credential, attribution, or logo is
authorized by this foundation.

## 16. Non-goals

This campaign does not:

- choose or integrate Google, Mapbox, HERE, GeoNames, Nominatim, or another
  provider;
- implement astronomy or a timezone/history engine;
- add manual timezone overrides;
- infer, title-case, or guess places;
- change the Engine repository or access `C:\NatalNode`;
- replace the development fixture with production behavior;
- add a second time engine, chart renderer, Share, or unrelated product feature;
- persist raw search text, birth input, or resolved coordinates in ordinary logs.
