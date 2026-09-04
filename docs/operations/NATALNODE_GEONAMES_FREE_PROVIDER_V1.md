# NatalNode GeoNames Free Provider V1

Status: approved first location-resolution provider for WEB-P1-LOCATION-002.

## Configuration

The server reads one server-only setting:

```text
GEONAMES_USERNAME
```

The value is a GeoNames account name, not a password or browser credential. It
must contain only the bounded account-name characters accepted by the runtime.
Do not commit a real account name, demo account, password, or token. If the
value is absent, location resolution is unavailable and a production chart
request remains fail-closed. Local public development keeps the fixed chart
fixture; a local GeoNames username may be supplied explicitly for testing the
location BFF without changing that fixture.

Production/free V1 HTTPS endpoint:

```text
https://secure.geonames.org
```

Both `searchJSON` and `timezoneJSON` use this secure origin. No HTTP fallback
is permitted.

## Server-only request flow

```text
Birth Location field
  -> POST /api/location/search
  -> GeoNames searchJSON (featureClass=P, maxRows=8)
  -> provider-neutral candidate list
  -> explicit candidate selection
  -> POST /api/location/resolve
  -> GeoNames timezoneJSON
  -> canonical location with timezoneId
```

The browser never calls GeoNames directly and never receives the username. The
server does not return raw GeoNames JSON, raw `geonameId`, provider offsets, or
provider error text. A candidate ID is only accepted after the server has
issued and remembered it for the current transient composition; an arbitrary
browser-supplied ID cannot create authority.

## Search and locale policy

The provider uses the official GeoNames search JSON service with a natural
query, `featureClass=P` for populated places, `isNameRequired=true`, `style=FULL`,
and at most eight results. The Web locale mapping is exactly:

```text
en      -> en
es      -> es
fr      -> fr
de      -> de
ja      -> ja
ko      -> ko
zh-Hant -> zh-Hant
```

No `zh-Hans` locale is accepted. Canonical display is assembled from populated
place, first administrative region, and country fields, preserving provider
diacritics and omitting duplicate labels. Raw query text remains editable UI
state and is never canonical authority.

## Timezone and historical time

The resolve step consumes the selected candidate coordinates and admits only a
valid GeoNames `timezoneId` as the IANA timezone identity. `rawOffset`,
`gmtOffset`, and `dstOffset` are not returned or promoted. A timezone ID is not
the same thing as a historical local-time calculation: precise historical
offset, ambiguity, and nonexistent-time evidence remains a separate authority
boundary and is not implemented by this provider.

## Reliability, privacy, and attribution

Requests use native server `fetch`, a bounded timeout, no retries, and generic
unavailable responses. The provider has no logging sink. Search queries,
coordinates, birth data, usernames, and provider payloads must not appear in
ordinary logs or persistent search history. Candidate and resolved records are
bounded, short-lived process memory only.

When a GeoNames-backed candidate or resolution is shown, the UI may display the
source attribution link:

```text
GeoNames — https://www.geonames.org/
```

Self-hosted or future provider changes must preserve the provider-neutral BFF
contract and the same no-guessing, explicit-selection, fail-closed behavior.
