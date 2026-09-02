# NatalNode Community / Questions V1

Status: `PRODUCT OWNER APPROVED / LOCAL IMPLEMENTATION AUTHORITY`

This document is the repository source of truth for the approved Community /
Questions V1 implementation. It narrows the product to public, structured
Questions and Answers and does not authorize a general forum or social network.

## Scope

The V1 concepts are Question, Answer, Accepted Answer, Topic, and Report.
Comments, votes, reputation, badges, followers, direct messages, social-feed
ranking, AI answers, AI moderation, practitioner profiles or verification,
Community notifications or email, search, and NatalNode Team answers remain
deferred.

Questions and Answers have the statuses `VISIBLE`, `HIDDEN`, and `DELETED`.
Visible Questions are public; visible Answers are public only through their
visible Question. Hidden and deleted content is not rendered as original public
UGC. A Question contains a server-generated ID, authenticated author
relationship, title, body, fixed topic ID, status, and server timestamps. An
Answer contains a server-generated ID, parent Question ID, authenticated author
relationship, body, status, and server timestamps.

## Current launch-readiness implementation amendment

Community / Questions V1 remains a completed local product track. Its frozen
90-day deleted-content and 365-day resolved-evidence retention predicates are
now callable through the bounded Community maintenance executable; legal UGC
wording, reviewer operations, scheduler binding, and production distributed
rate limiting remain external gates. No Community feature expansion was added.
See [`NATALNODE_P0_EXTERNAL_GATE_DECISION_PACK_V1.md`](./NATALNODE_P0_EXTERNAL_GATE_DECISION_PACK_V1.md).

## Public identity

Community adds one account-scoped display name. It is not a username, handle,
globally unique identity, legal name, or public profile. It is normalized by
line-ending and outer-whitespace normalization and must contain 3–40 Unicode
characters, with no malformed Unicode, NUL, disallowed controls, or markup
semantics. It is editable from the authenticated account surface. Public DTOs
never include email, internal user IDs, authentication-provider identifiers,
birth data, chart data, avatar, biography, or a profile route.

When an account is deleted, retained public contributions lose their active
identity relationship and render as the localized equivalent of `Deleted User`.
The selected display name is never translated and no public recovery path to the
deleted account remains.

## Topics and content rules

The fixed topic IDs are:

`FOUNDATIONS`, `CHART_READING`, `PLANETS_SIGNS_HOUSES`, `ASPECTS`,
`BIRTH_TIME_AND_CALCULATION`, `NATALNODE_PRODUCT`, and `OTHER`.

Question titles are 10–180 Unicode characters. Question bodies are 20–10,000
Unicode characters. Answer bodies are 10–10,000 Unicode characters. Report
details are optional plain text up to 1,000 Unicode characters. All submitted
content is normalized for line endings and outer whitespace, stored, and
displayed in its submitted language. V1 does not auto-translate, browser
translate, or LLM-translate UGC. Content is plain text; raw HTML, embedded
media, iframes, and arbitrary embeds are not supported.

Question authors may edit or delete their own Questions. Answer authors may edit
or delete their own Answers. Created timestamps remain stable and edited content
updates `updatedAt`; public revision history is not provided. Deleting content
immediately removes its public rendering and indexing eligibility. Deleting an
Answer clears an accepted relationship atomically. Answers never become
independently public when their Question is unavailable.

Only the Question author may accept, change, or remove one accepted visible
Answer. The accepted Answer must belong to the Question. Public wording is
`Accepted by question author`; acceptance is not verification, official status,
scientific correctness, or NatalNode approval. The public boundary is:
`Community answers are user-generated and are not NatalNode professional or
scientific advice.`

## Reports and moderation

Authenticated users may report a Question or Answer with one of `SPAM`,
`HARASSMENT`, `HATE_OR_ABUSE`, `DANGEROUS_OR_HIGH_STAKES_ADVICE`, `PRIVACY`,
`COPYRIGHT_OR_IP`, or `OTHER`. Reporter identity and report details are private
to the authorized moderation boundary. One account cannot create duplicate
active reports for the same content item; reports from different accounts are
not merged and report counts are never public. A report does not automatically
punish anyone.

Moderation uses the narrow server-side `COMMUNITY_MODERATOR` capability. It is
not granted by browser state, query parameters, client role strings, or email
allowlists. The only V1 actions are `HIDE`, `RESTORE`, `DELETE`, and
`DISMISS_REPORT`. There is no ban, suspension, shadowban, warning, appeal,
automatic deletion, threshold auto-hide, or AI moderation.

Every moderation action creates an append-only internal event containing an
event ID, actor account relationship, target type and ID, action, bounded reason
code, optional bounded internal note, and server timestamp. Moderator identity,
internal notes, and report records are never public.

## Account deletion and retention

Account deletion continues to remove the existing private account graph. Within
that same erasure transaction, Community identity relationships are removed and
eligible Questions and Answers remain only in anonymized form. Other users'
Answers are preserved. Content explicitly deleted before account deletion stays
deleted, and no internal deleted account identifier is disclosed by public APIs.

Visible UGC is retained while published. User-deleted or moderator-deleted
content is public immediately as unavailable and its original body is retained
only internally for 90 days, unless an open moderation case, legal hold, or
security hold exists. After the threshold it is purge-eligible. Open reports are
retained while unresolved. Resolved report and moderation evidence is retained
for 365 days after resolution, then is purge-eligible unless held. The schema
records hold state without introducing a general compliance platform; the
maintenance operation is deterministic and respects open cases and holds.

## Privacy, SEO, and operational boundaries

Public reads return presentation DTOs only. They never expose account IDs,
emails, auth identifiers, birth or chart data, reporter or moderator identity,
internal notes, retained deleted bodies, IP addresses, or user-agent data.
Visible listing and detail pages are indexable through the existing Web SEO
boundary. Hidden and deleted pages are not indexable. Q&A structured data is
emitted only when the visible Question page displays eligible visible content;
accepted status never makes an answer official.

The existing process-local rate-limit gate remains in place while production
multi-replica enforcement remains an operations gate. Community account limits
are: Questions 5/hour and 20/day; Answers 20/hour and 100/day; Reports
10/hour and 30/day; combined edit/delete/accept mutations 60/hour.

Users retain ownership of their UGC. Publishing grants NatalNode a
non-exclusive, worldwide, royalty-free license, sublicensable only as
operationally necessary, to host, store, reproduce, format, display, and
distribute the content solely to operate, moderate, promote, and improve
NatalNode Community. The license continues for lawfully retained anonymized
content after account deletion. This is product-policy semantics, not final
jurisdiction-specific Terms language; final legal wording remains a launch
review gate.

No Community code calls the Engine, reads chart data, accesses `C:\NatalNode`,
selects a provider, or adds scientific logic. `PROVIDER DECISION DEFERRED`.
