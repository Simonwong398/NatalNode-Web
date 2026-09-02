# NatalNode Practitioner / Contributor V1 Policy

Status: Product Owner approved for local implementation

This document is the repository policy boundary for the Practitioner / Contributor V1
surface. It describes product semantics and privacy constraints; it is not
jurisdiction-specific legal advice. Final launch wording for professional identity,
public-profile consent, and evidence may receive a separate legal review.

## Identity model

- **Member** means an ordinary authenticated NatalNode account.
- **Contributor** is a descriptive relationship derived from visible Community
  Questions or Answers. It grants no permission, entitlement, rank, score, badge,
  verification, or moderation authority.
- **Practitioner** means an account whose application passed manual NatalNode review
  and whose public Practitioner profile is approved.
- **NatalNode Team** is an internal organizational identity. Practitioner review does
  not grant Team membership and Team identity is never exposed through this workflow.

Practitioner status does not mean certification, scientific validation, licensed
professional status, NatalNode employment, official astrologer status, guaranteed
competence, or endorsement of specific advice. Practitioner status is independent of
FREE / PRO entitlement.

## V1 boundary

V1 does not include a marketplace, booking, payments, commissions, revenue share,
paid rank, sponsored placement, ratings, client reviews, reputation, karma,
leaderboards, followers, direct messaging, availability, lead marketplace,
subscription, verification fee, AI verification, AI moderation, AI scoring, public
Member profiles, Practitioner search, Practitioner articles/CMS, or scientific/
provider integration. `PROVIDER DECISION DEFERRED` remains in force.

## Private application

An authenticated account may submit one active application. The application stores:

- `applicationId` and the server-derived `userId`;
- `requestedDisplayName`, `professionalHeadline`, `bio`;
- one or more controlled `practiceAreas`;
- user-declared `languages`;
- public `countryOrRegion`;
- at most one optional public `websiteUrl`;
- `practiceStatement`;
- one to five applicant-supplied public `evidenceUrls`;
- `consentToPublicProfile`, `submittedAt`, and `status`.

The application does not collect government or national identity documents, birth or
chart data, home address, phone number, payment data, or health data. Evidence is
URL-only. URLs are validated as safe HTTPS links, are not embedded, proxied, scraped,
or profiled automatically, and are visible only to authorized reviewers.

The only application statuses are `SUBMITTED`, `CHANGES_REQUESTED`, `APPROVED`,
`REJECTED`, `WITHDRAWN`, and `REVOKED`. The allowed lifecycle is:

```text
SUBMITTED -> APPROVED -> REVOKED
SUBMITTED -> CHANGES_REQUESTED -> SUBMITTED
SUBMITTED -> REJECTED
SUBMITTED or CHANGES_REQUESTED -> WITHDRAWN
```

There is no `UNDER_REVIEW` state. Reapplication creates a new application after a
30-day `REJECTED` cooldown or a 90-day `REVOKED` cooldown. Withdrawn applications
follow the private retention policy before minimization. An active duplicate
application is rejected.

Manual admission checks authentication, a Community-compatible display identity,
required fields, at least one accessible/relevant evidence source, reasonable
internal consistency, no misrepresentation as NatalNode staff, no obvious guaranteed
medical/legal/financial/high-stakes outcome claims in the professional presentation,
and acceptance of the public-profile/product terms. NatalNode does not require a
particular school certificate, score astrology skill, or judge prediction accuracy.
The product meaning is **Practitioner profile approved by NatalNode**, not
“Certified by NatalNode”.

## Reviewer authority

The only reviewer capability is the server-derived `PRACTITIONER_REVIEWER` capability.
It is checked against a server-side grant table. Browser flags, query parameters,
client role strings, and frontend email allowlists are not authority. A reviewer
cannot review their own application.

Reviewer actions are `APPROVE`, `REQUEST_CHANGES`, `REJECT`, and `REVOKE`. Each action
creates an append-only private review event with the event ID, reviewer ID,
application ID, action, reason code, bounded optional note, application version, and
timestamp. Reviewer identity and notes are never public or included in the ordinary
account export. Approval/rejection/revocation is always human-authorized; no AI or
automatic competency system is part of V1.

## Public profile and directory

Only an `APPROVED` profile is public. Its explicit public presentation fields are:

```text
practitionerId
displayName
professionalHeadline
bio
practiceAreas[]
languages[]
countryOrRegion
websiteUrl?
foundingPractitioner
approvedAt
contributions[] (eligible public Community references only)
```

Email, legal name, internal user ID, authentication provider, application ID,
evidence, practice statement, review history, reviewer data, retention data,
rejection/revocation history, and birth/chart data are private. There is no public
Member profile. Public profiles are available through the existing locale convention
at `/[locale]/practitioners` and `/[locale]/practitioners/:practitionerId`, with only
approved records, deterministic `displayName ASC, practitionerId ASC` ordering, and
cursor pagination defaulting to 20 and capped at 50. V1 has no search, ranking,
recommendations, sponsorship, or geographic filtering.

The detail context provides this localized disclosure equivalent:

> Practitioner status means this profile completed NatalNode’s application review.
> It does not constitute professional certification, scientific validation, or
> endorsement of specific advice.

The seven closed UI locales are `en`, `es`, `fr`, `de`, `ja`, `ko`, and `zh-Hant`.
There is no `zh-Hans` or silent locale fallback. Practitioner-owned prose is shown as
entered and is never machine-translated.

The controlled practice-area IDs are `NATAL_ASTROLOGY`, `CHART_INTERPRETATION`,
`ASTROLOGY_EDUCATION`, `ASTROLOGY_RESEARCH`, `RELATIONSHIP_ASTROLOGY`,
`TIMING_AND_CYCLES`, and `OTHER`. `TIMING_AND_CYCLES` is descriptive only and does
not create transit or Engine behavior. Languages are user-declared and not certified.
Only a public country/region is collected; no street, city, coordinates, or precise
location is required. A public website is one safe HTTPS URL with no iframe,
tracking proxy, or metadata scraping.

## Revisions, founding label, and contributions

Changes to public claims use one pending profile revision. The current approved
profile remains public while a revision is reviewed. Reviewer promotion atomically
replaces the approved fields, records bounded history, and clears the pending state;
there is no direct public-claim mutation path.

`foundingPractitioner` is a server-controlled historical early-cohort label. It is
not verification, certification, rank, entitlement, seniority, or a user-selectable
field. It does not change directory ordering. If the cohort closes, the historical
label remains unless separately removed by authorized administration.

An approved Practitioner may link eligible visible Community Questions and Answers.
The profile reuses the existing public Community author/URL presentation and does not
duplicate UGC bodies. Hidden and deleted content is excluded. No contribution score,
reputation, badge economy, or article/CMS system is created.

## Reporting and revocation

Authenticated users may privately report a Practitioner profile using exactly:
`IMPERSONATION`, `MISLEADING_CLAIM`, `PRIVACY`,
`DANGEROUS_OR_HIGH_STAKES_ADVICE`, `SPAM`, or `OTHER`. Reporter identity and details
remain private, one active duplicate report per reporter/profile is rejected, report
counts are not public, and reports never auto-revoke a profile. Manual reviewers may
revoke the profile; revocation immediately removes the directory/profile/indexing
surface but does not delete the author’s Community Questions or Answers.

## Deletion, export, and retention

Account deletion immediately removes the Practitioner public profile, directory entry,
and professional identity linkage. Private application/evidence and bounded history
follow retention. Community UGC continues through the existing `Deleted User`
anonymization behavior. No anonymized Practitioner profile is public.

An account export includes the account owner’s application fields, evidence URLs,
profile fields, status, and bounded status/history metadata. It excludes reviewer
identity and private reviewer notes.

Active `SUBMITTED`, `CHANGES_REQUESTED`, and `APPROVED` application records are held
while active. Final `REJECTED`, `WITHDRAWN`, and `REVOKED` applications are eligible
for purge 365 days after finalization. Historical profile revisions are eligible
after 90 days. Review audit metadata is eligible 365 days after the Practitioner
relationship ends. `LEGAL` and `SECURITY` holds block ordinary purge. Retention
metadata is explicit (`finalizedAt`, `purgeEligibleAt`, and `holdState` or an
equivalent), with no generalized compliance platform.

Approved directory/profile routes may be indexed. Applications, pending/rejected/
revoked/withdrawn profiles, evidence, review surfaces, and private data are
`noindex,nofollow`. Sitemap entries include approved profiles only when the existing
dynamic sitemap boundary can represent them safely. No regulated-professional
structured-data claim is emitted.

## Security, accessibility, and limits

All mutations derive the account from the authenticated session. Cross-account reads,
updates, self-review, client-supplied approval/founding flags, private-field leakage,
and revoked-profile exposure are denied. Forms use semantic labels, associated
errors, keyboard/focus support, live status messaging, and text-safe rendering.

The bounded staging limits are: application submit 3 per 24 hours; application
update/resubmit 10 per 24 hours; profile revision 10 per 24 hours; profile report 10
per hour and 30 per day. These are abuse guardrails, not product availability or SLA
claims.

