# Weekly Signal POC Review

> Product-owner review artifact. Development-only research proof; not a production Weekly reading, horoscope, API response, route, persistence model, notification, or AI-generated content system.

## Decision surface

- POC: `WEB-P2-WEEKLY-POC-001`
- Fixture authority: `DEVELOPMENT_FIXTURE`
- Output authority: `DEVELOPMENT_ONLY`
- Editorial contract: `NATALNODE_WEEKLY_EDITORIAL_V1@1.0.0`
- Rules contract: existing Interpretation signal rules version
- Locales proven: `en`, `zh-Hant`
- Required review result: `WEEKLY_CONTENT_POC_PASS`
- Production status: `NOT_PRODUCTION_WEEKLY_READY`

The POC proves a deterministic path from structured fact inputs to bounded
human-readable content. It does not claim that the Web currently has
production transit-to-natal authority, a production weekly provider, complete
time authority, or a production Weekly product.

## What was exercised

The implementation uses the existing Interpretation foundation in this order:

```text
development-only fact fixture
  → prerequisite-gated rule evaluation
  → explicit Signal metadata
  → deterministic ranking
  → mixed/theme composition
  → versioned editorial projection
  → traceability and editorial lint
```

The fixture contains no finished horoscope prose. The phrase libraries are
versioned editorial templates selected after Signal composition. No external
LLM, network request, astronomy dependency, browser route, persistence call,
notification, or production fallback is involved.

## Scenario matrix

| Scenario | What it proves | Result |
| --- | --- | --- |
| A — supportive communication | A clear primary theme plus a bounded action support theme | PASS |
| B — mixed relationship | Supportive and challenging evidence remain in one nuanced composition | PASS |
| C — action versus emotional tension | A useful action hero can coexist with a challenging emotional signal | PASS |
| D — background plus momentary | A longer weekly theme remains distinct from a short explicit timing window | PASS |
| E — unknown birth time | Placement-level content remains useful while timing, houses, and angles stay omitted | PASS |

Full en/zh-Hant snapshots are in `scenario-a.md` through `scenario-e.md` in
this directory.

## Representative editorial comparison

These are representative outputs from the same semantic scenarios. The locale
changes language, not source authority, Signal direction, ranking, or
traceability.

| Style | English proof | 繁體中文 proof | Review observation |
| --- | --- | --- | --- |
| CLEAR | “A clear center of gravity helps conversations move forward: name the point, then leave room for the response.” | 「清楚的重點，能讓對話更容易往前走：先說明要處理的事，也為對方留下回應的空間。」 | Strongest overall: direct, useful, and restrained. |
| CASUAL | “The green light is real; so is the urge to floor it.” | 「綠燈確實亮著——想直接踩到底的衝動也確實存在。」 | More personality without adding a forecast. |
| ASTROLOGER | “The placement-level signal remains useful when time-dependent chart authority is unavailable.” | 「即使時間相關的星盤權威不可用，配置層級訊號仍然有用。」 | Most explicit about method and limits; also the most caveat-sensitive. |
| SHARE | “Move with a reason.” / “Momentum works better when it leaves room for judgment.” | 「帶著理由前進。」／「保留判斷空間，動能才更有用。」 | Compact hook + insight + `natalnode.com`; not a full reading. |

## Semantic review

### Hero

The hero is chosen from the strongest meaningful composed theme. A purely
`MOMENTARY` group cannot displace a non-momentary group when one exists. This
is visible in Scenario D: `steady-progress` is the hero while
`decision-window` remains the Best Window and a timeline segment.

### Core themes

Up to three ranked theme groups are exposed. Each core theme retains direction,
intensity, confidence, source Signal IDs, source fact references, style, and
template version. The output does not flatten all Signals into one optimistic
paragraph.

### Timeline and Best Window

Timeline entries exist only when the source Signal has an explicit temporal
window. Labels are calculated in the fixture's canonical timezone
(`America/Los_Angeles`) rather than by accidentally displaying UTC day drift.
Best Window is omitted when timing evidence is absent, including all of
Scenario E. No day-level precision or event is fabricated.

### Mixed evidence

Scenario B retains both `SUPPORTIVE` and `CHALLENGING` relationship evidence in
the same `MIXED` composition. Its copy says that warmth and friction can be
held together, adds a Watch Out, and avoids a fixed relationship verdict.
Scenario C similarly keeps action support and emotional challenge visible.

### Unknown time

Scenario E uses only Sun and Mercury placement-level facts. It intentionally
has no timeline, Best Window, house placement, angle, ASC, MC, or equivalent
time-dependent claim. ASTROLOGER style explains the omission instead of
inventing a substitute authority.

### Watch Out, signature, and share

- Watch Out exists only for challenging or mixed evidence.
- Signature lines are short, bounded, and attached to the same source-backed
  projection; they are not promises.
- SHARE keeps a compact hook, one or more bounded insights, and a CTA. It omits
  long reading sections so a share card is not misrepresented as a complete
  Weekly product.

### Traceability, certainty, and invention controls

Every rendered block carries:

- `contentBlockId`
- source Signal IDs
- source fact references
- content style
- `NATALNODE_WEEKLY_EDITORIAL_V1@1.0.0`
- interpretation rules version
- `DEVELOPMENT_ONLY` fixture authority

The lint rejects empty heroes, duplicate prose, repeated core text, prohibited
certain-event wording, unsupported Best Windows, missing traceability,
technical identifiers in consumer prose, non-development authority, and
overlong share projections. The authored content does not claim that an event
will happen or that another person must respond.

## Product-owner questions

### A. Is the Signal → content path useful enough to review?

Yes. The five scenarios show a bounded deterministic path with visible
semantic inputs, direction, timing constraints, and source references. This is
content proof, not production acceptance.

### B. Which style is strongest today?

`CLEAR` is strongest. It has the best balance of editorial usefulness, direct
language, mixed-evidence restraint, and explicit limit handling.

### C. Which style is weakest today?

`ASTROLOGER` is weakest as a general consumer voice. It is valuable for method
review, but its usefulness depends on having an approved technical fact label;
with incomplete inputs it can become caveat-heavy. That is an editorial
calibration issue, not permission to add unsupported chart facts.

### D. Is CASUAL engaging without becoming spammy or predictive?

Within this small proof set, yes. It adds warmth and rhythm while staying
advice-shaped rather than forecast-shaped. More scenarios are still needed
before treating the voice as a production content policy.

### E. Does ASTROLOGER have real substance?

Yes, when the fixture supplies an approved technical anchor such as a body
position, an explicitly supplied aspect, or an explicit timing window. It names
the evidentiary boundary and does not use technical vocabulary as decorative
authority. Scenario E demonstrates the correct result when time authority is
unavailable.

### F. Is SHARE worth sharing?

Structurally, yes for review. A compact hook and insight can carry the theme,
mixed nuance, or known-boundary message without exposing private identity or
technical IDs. Brand, visual, and production share acceptance remain separate
work.

### G. Does the POC preserve mixed nuance?

Yes. Scenario B explicitly includes both directions in one relationship
composition and keeps the Watch Out. Scenario C keeps supportive action and
challenging emotion as separate visible themes.

### H. Is the copy varied enough across five scenarios?

Yes for this proof set: communication, relationship, action/emotion,
background/momentary timing, and unknown time produce visibly different
editorial decisions. The largest current limitation is the deliberately small
bounded phrase library; it is not evidence of production-scale content
coverage.

### I. Is the structure sufficient for a future two-to-four-page printable
reading?

Conditionally. The model has hero, themes, timeline, domain sections,
signature, share projection, style, and traceability, so it is structurally
reviewable. A printable product would still need production facts, content
length policy, privacy/redaction rules, layout work, and owner acceptance.

### J. Which semantic fields are still missing for production Weekly?

At minimum:

- authoritative transit-to-natal Signal facts and stable fact IDs;
- complete temporal evidence, including supported orb/phase and duration
  provenance where applicable;
- complete Moon/time authority and historical timezone authority;
- production provider identity and operational provenance;
- explicit content-policy version, exclusions, priority, and localization
  fallback semantics;
- a defined boundary for personal context and user-authored content;
- production observability and failure semantics for unavailable or stale
  authority.

The provider decision remains literally: `PROVIDER DECISION DEFERRED`.

## Legacy and scope boundary

The existing legacy `createDeterministicInterpretation` path remains the
current UI's authority for localized, fact-based Chart Result cards. It was not
deleted, migrated, or reused for Weekly prose. The new Weekly POC is a
research-only path, not a second production authority, and it has no page,
route, persistence, notification, or UI integration.

No Account Share/Print implementation was changed. The SHARE object was only
evaluated as a future projection shape. No Engine, provider, astronomy,
database, Auth/Vault, BFF, or production content system was modified.

## Review verdict

```text
WEEKLY_CONTENT_POC_PASS
MODULE_PASS
SIMULATED_INTEGRATION_PASS
DEVELOPMENT_ONLY
NOT_PRODUCTION_WEEKLY_READY
READY_FOR_PRODUCT_OWNER_WEEKLY_CONTENT_REVIEW
```

Recommended next action: Product Owner review of this file and the five
scenario snapshots. Do not begin Weekly UI or production Weekly generation
automatically from this POC.
