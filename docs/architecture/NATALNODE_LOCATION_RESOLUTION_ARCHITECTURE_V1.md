# NatalNode Location Resolution Architecture V1

Status: GeoNames Free Web Services integration for WEB-P1-LOCATION-002.

The Web contract remains provider-neutral. GeoNames Free Web Services is the
approved first provider binding behind that contract; future provider changes
remain separately governed and must not leak vendor-shaped data into the
browser or Engine boundary.

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

The Birth Location field exposes a typed query and can render the
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
deadline, clones/freeze-protects returned records, and keeps only bounded,
short-lived candidate and resolved selections needed by the current
composition. Invalid or unavailable provider output fails closed. The current
GeoNames implementation is server-only and is not visible to the browser as a
provider SDK or raw response.

The service is the only application boundary that knows the provider interface.
The runtime composition binds the approved GeoNames provider behind that
interface; the named provider remains server-only and does not cross the
browser or Engine boundary.

## 9. Timezone boundary authority

Geocoding establishes a canonical place and coordinates. Timezone resolution is
a separate authority boundary that consumes coordinates and returns an IANA zone;
the current GeoNames binding performs that step through its timezone endpoint.
The `ianaTimeZone` field in the canonical result is an identity, not a country
label or fixed numeric offset. It remains semantically separate from human-place
matching.

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

The server dependency is optional when no approved provider account is
configured. The absence of that dependency is an explicit unavailable state,
not a reason to activate the development resolver. The browser posts only to
the two same-origin BFF routes and cancels or ignores stale searches.

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

## 15. GeoNames Free Web Services provider binding

`GeoNamesWebProvider` is the first concrete `GeocodingProvider`. It uses the
official `searchJSON` endpoint with a natural query, the closed locale mapping,
`featureClass=P`, `isNameRequired=true`, `style=FULL`, and a maximum of eight
rows. Only populated-place records with valid provider coordinates are exposed
as opaque candidates. Duplicate provider records are removed before the
candidate list is returned.

An explicit candidate selection is resolved through the official GeoNames
timezone endpoint. Only the provider's `timezoneId` is admitted as the IANA
timezone field. Numeric offset fields are deliberately discarded because they
are not a date-specific historical time authority. Every source-backed result
includes a bounded GeoNames attribution link.

The provider uses the server-only `GEONAMES_USERNAME` configuration value,
native `fetch`, a bounded request deadline, no retry loop, and no logging of
queries, coordinates, credentials, or provider payloads. Candidate and
resolution authority is held in bounded process memory with a short TTL; it is
not persistent search history.

## 16. Non-goals

This campaign does not:

- choose or integrate an additional paid or public geocoder beyond the
  approved GeoNames Free Web Services binding;
- implement astronomy or a timezone/history engine;
- add manual timezone overrides;
- infer, title-case, or guess places;
- change the Engine repository or access `C:\NatalNode`;
- replace the development fixture with production behavior;
- add a second time engine, chart renderer, Share, or unrelated product feature;
- persist raw search text, birth input, or resolved coordinates in ordinary logs.

## 17. Provider substitution and historical-time boundary

`GEONAMES_FREE_V1` is the current provider decision. Any future substitution
must implement the same provider-neutral interface and preserve the opaque
authority, explicit selection, attribution, rate-limit, deadline, and privacy
rules. No paid provider or provider-specific browser dependency is implied.

GeoNames supplies a place identity, coordinates, and an IANA timezone ID. It
does not by itself close the separate precise historical local-time authority
boundary. Until an approved historical-time authority exists, that boundary
remains an explicit product and production-readiness blocker rather than a
reason to promote a fixed offset or current DST value.
