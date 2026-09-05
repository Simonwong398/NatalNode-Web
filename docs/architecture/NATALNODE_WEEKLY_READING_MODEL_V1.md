# NatalNode Weekly Reading Model V1

Status: WEEKLY_READING_MODEL_ADMITTED

Schema: NATALNODE_WEEKLY_READING_MODEL_V1@1.0.0

Transformation policy: NATALNODE_WEEKLY_READING_TRANSFORMATION_V1@1.0.0

This document freezes the bounded presentation-selection contract created by
WEB-P2-WEEKLY-READING-MODEL-001. It sits between the existing
WeeklyInterpretationDraft research/editorial output and future screen, print,
or share projections.

It does not authorize a Weekly route, Weekly UI, production Weekly content,
production interpretation authority, persistence, or a new calculation engine.

## 1. Boundary

The authoritative flow is:

~~~text
Engine facts
    ↓
Interpretation Signals
    ↓
WeeklyInterpretationDraft
    ↓
WeeklyReadingModel
    ↓
screen / print / share projections
~~~

The implementation lives in:

~~~text
apps/web/src/features/interpretation/weekly-reading-model.ts
~~~

The adapter is a pure, deterministic, side-effect-free transformation. It does
not import an Engine client, provider, HTTP library, database, route, Astro
context, React state, or LLM.

WeeklyReadingModel is a presentation-selection and editorial-composition
contract. It is not:

- astronomy authority;
- Signal authority;
- interpretation authority;
- UI component state;
- persistence authority;
- a second horoscope engine.

The model intentionally contains no raw signals collection. Future renderers
receive bounded fields that are already selected, ordered, deduplicated, and
visibility-classified.

## 2. Current Draft characterization

The existing WeeklyInterpretationDraft already owns:

- one development-only editorial style and locale;
- one Hero content block;
- up to three ranked core-theme projections;
- conditional domain blocks;
- editorial Timeline entries;
- optional Watch Out, Best Window, and Astrologer's View blocks;
- share and signature blocks;
- source Signal and fact references;
- editorial and rule version identities.

The smallest missing separation was birth-time authority. The Draft now carries
birthTimeAuthority copied from its source scenario. The Reading Model uses
that explicit value to:

- expose a humane unknown-time disclosure;
- omit time-dependent Timeline and Best Window content;
- reject unavailable house and angle fact references in advanced content.

No scientific meaning, Signal value, rule identity, or legacy Chart Result
interpretation path was changed.

## 3. Contract identity and authority

The model exports:

- WEEKLY_READING_MODEL_VERSION;
- WEEKLY_READING_TRANSFORMATION_VERSION;
- createWeeklyReadingModel;
- assertWeeklyReadingModelInvariants.

Every current model has:

~~~text
authority.status = DEVELOPMENT_ONLY
authority.productionEligible = false
~~~

The adapter fails closed if a draft, Signal, provenance source, or editorial
block is not explicitly development-only. DEVELOPMENT_ONLY is model
governance metadata and is not normal reader copy.

## 4. Canonical model fields

The public feature export is
apps/web/src/features/interpretation/index.ts. Its bounded model fields are:

- schemaVersion and transformationVersion;
- authority, locale, style, birthTimeAuthority;
- editorialVersion, rulesVersion;
- period;
- hero;
- atAGlance;
- domains;
- optional timeline;
- optional watchOut;
- why;
- disclosures;
- astrologerView;
- actions;
- signature;
- share;
- screen;
- print;
- internal traceability.

All constructed objects and arrays are copied and frozen. The transformation
does not mutate the supplied Draft or any source object.

## 5. Semantic ownership

Each meaning has one primary visible owner:

| Owner | Contract responsibility |
| --- | --- |
| Hero | One dominant primary weekly meaning |
| At-a-Glance | Up to three concise supporting themes |
| Domain | Deeper life-context meaning only when distinct |
| Timeline | All explicit timing and window emphasis |
| Watch Out | At most one supported caution |
| Why | Accessible explanation of selection and omission |
| Astrologer's View | Approved technical detail, advanced-only |
| Actions | Post-value action availability metadata |
| Signature | Closing/share identity, not a second Hero |
| Share | Compact public-safe projection |

The Hero's core-theme representation may remain in At-a-Glance when it has a
distinct core-theme block and copy. This preserves the approved editorial
hierarchy without copying the Hero sentence. A domain with the same theme and
source Signal identity is merged instead of displayed as a repeated domain
paragraph.

## 6. Deterministic selection and deduplication

Semantic identity is derived from existing editorial metadata:

~~~text
theme + sorted source Signal IDs
~~~

It is not inferred from arbitrary prose similarity. The adapter uses:

- source Signal IDs;
- source theme identity;
- editorial content role;
- explicit Timeline ownership;
- stable Draft ordering;
- source fact references.

String normalization is used only as a final defensive duplicate check.

Every candidate receives an internal review decision. Decisions are
INTERNAL_ONLY and retain source block references plus a review reason. The
supported outcomes are:

| Action | Meaning in V1 |
| --- | --- |
| KEEP | retain the bounded content in its owner |
| MERGE | source meaning is represented by an existing owner |
| DOWNGRADE | retain as subordinate metadata or Timeline emphasis |
| OMIT | do not expose unsupported, empty, absent, or duplicate content |
| ADVANCED_ONLY | retain only behind the advanced technical layer |

Current policy examples:

- Hero: KEEP;
- distinct core theme: KEEP;
- repeated domain: MERGE;
- Best Window matching Timeline: DOWNGRADE;
- unsupported or absent Watch Out: OMIT;
- Astrologer's View: ADVANCED_ONLY;
- Signature: DOWNGRADE.

There is no full visible Best Window card in V1. When a valid Best Window
exists, one matching Timeline entry receives emphasis BEST_WINDOW.

## 7. Visibility

The model freezes four visibility classes:

- VISIBLE_DEFAULT;
- EXPANDABLE;
- ADVANCED_ONLY;
- INTERNAL_ONLY.

The standard mapping is:

| Model field | Visibility |
| --- | --- |
| Hero | VISIBLE_DEFAULT |
| At-a-Glance | VISIBLE_DEFAULT |
| Domains | EXPANDABLE |
| Timeline | VISIBLE_DEFAULT |
| Watch Out | VISIBLE_DEFAULT |
| Why | EXPANDABLE |
| Astrologer's View | ADVANCED_ONLY |
| Actions | VISIBLE_DEFAULT |
| internal traceability and decisions | INTERNAL_ONLY |

Technical identifiers, rule IDs, fixture markers, and source paths are retained
only in internal traceability. The adapter checks that they do not enter normal
reader copy.

## 8. Hero and At-a-Glance

The Hero contains one non-empty human-facing sentence and one default-visible
owner. It does not manufacture a second headline or a separate summary from
the same sentence. A future renderer can use period.label as its period
identity and hero.text as the Hero meaning.

At-a-Glance is an ordered list of zero to three themes. Each theme contains:

- a localized human-facing label;
- existing editorial meaning;
- direction, intensity, and confidence copied from the editorial layer;
- source editorial, Signal, and fact traceability;
- default visibility.

The Hero theme is placed first when it has a core-theme representation. The
remaining themes retain their source editorial order. No filler theme is
created.

## 9. Conditional domains

The four bounded domain identities are:

- Love & relationships;
- Work & creation;
- Inner state;
- Decisions.

A domain is emitted only when its editorial source identity is distinct from
Hero and At-a-Glance and its copy is non-empty. Current POC domain blocks repeat
core themes, so they are recorded as MERGE decisions and omitted from the
visible domain list.

The model does not force one domain card for every possible domain.

## 10. Timeline and Best Window

The model creates Timeline entries only from explicit source
InterpretationTemporalWindow values already present in the Draft Timeline. It
does not infer dates, weekdays, durations, or timezone values.

Each entry carries:

- a stable local entry ID;
- a localized day or day-group label;
- the supplied start, peak, end, and canonical timezone;
- existing human meaning with the POC system preamble removed;
- source priority;
- BACKGROUND, CORE, or MOMENTARY category;
- optional BEST_WINDOW emphasis.

Entries are ordered chronologically by supplied start/end values with stable
source ordering for ties. Overlapping windows remain separate entries; they are
not cancelled, merged, or drawn into a UI geometry.

Timeline is the only primary timing owner. A supplied Best Window is downgraded
to one Timeline emphasis. No competing top-level Best Window content is
created.

If the Draft contains no explicit timing evidence, timeline is null. There is
no empty Timeline section, error card, fabricated window, or placeholder copy.
A compact SHARE Draft may also omit timing intentionally even when the source
Draft has timing; its Why explanation identifies that projection choice.

## 11. Watch Out and Why

Watch Out is emitted only when the supplied source Signals contain challenging
or mixed evidence. At most one primary Watch Out is supported by the Draft
shape. Unsupported or absent caution content is omitted.

Why is a bounded expandable explanation. It can explain:

- why mixed evidence remains together;
- why timing has one owner;
- why a repeated domain is omitted;
- why timing is absent;
- why unknown birth time limits the reading.

It does not expose Signal IDs, rule IDs, fixture identity, scientific
configuration identity, or governance vocabulary as reader copy.

Unknown birth time gets one humane disclosure. It does not create houses,
ASC, MC, angles, or time-dependent windows.

## 12. Astrologer's View

Astrologer's View is available only when the incoming Draft supplies its
advanced editorial block. The model marks the block ADVANCED_ONLY and copies
its text and existing source traceability; it does not create technical facts.

For unknown birth time, source fact references are restricted to supported
placement-level facts. House and angle fact references fail fast rather than
being guessed or substituted.

## 13. Screen, print, and share separation

The canonical model is not a layout model.

screen supplies semantic reading order:

~~~text
HERO
AT_A_GLANCE, when non-empty
DOMAINS, when non-empty
TIMELINE, when present
WATCH_OUT, when present
WHY
ASTROLOGER_VIEW, when available
ACTIONS
SIGNATURE
~~~

It contains no viewport, pixel, breakpoint, navigation, or component state.
This order supports content-first mobile and desktop renderers.

print selects period identity, Hero, a Hero-owned summary, themes, meaningful
domains, optional Timeline/Watch Out/Why/advanced detail, and signature. It has
no screen navigation state and no action controls. The Hero-owned summary is a
projection reference, not a second semantic owner.

share contains only:

- NatalNode identity;
- natalnode.com;
- one existing share hook;
- one existing share insight;
- an optional second line, currently null;
- the canonical call-to-action site.

It contains no private, account, birth-input, Signal, fact, rule, or fixture
metadata. No Account Share code or UI is changed.

## 14. Actions

The model exposes availability metadata only:

- Save: AVAILABLE;
- Share: AVAILABLE;
- Print: AVAILABLE;
- Collect: FUTURE.

No button, route, handler, persistence call, or Collection implementation is
created by this task.

## 15. Invariants

Development/test assertions fail fast for:

- one non-empty Hero;
- no more than three default themes;
- no empty visible domain;
- no duplicate visible semantic copy;
- no Timeline entry without explicit timing;
- stable Timeline ordering;
- no Timeline for unknown birth time;
- no unsupported Watch Out;
- no competing Best Window owner;
- no internal identifier leakage into reader copy;
- advanced-only Astrologer's View;
- no unsupported advanced fact reference;
- no fixture source promoted to production authority;
- canonical share site and compact share content;
- deterministic model identity and ordering.

The model remains traceable through:

~~~text
reading block
    ↓
editorial block
    ↓
Signal IDs
    ↓
fact references
~~~

Traceability is never a normal reader section.

## 16. Five development-only scenario evidence

The focused contract tests transform all existing POC scenarios through the
actual createWeeklyInterpretationDraft then createWeeklyReadingModel path.

| Scenario | Reading Model evidence |
| --- | --- |
| A — Supportive Communication | one communication Hero, two themes, two Timeline windows, one downgraded Best Window, no Watch Out |
| B — Mixed Relationship | one mixed theme, both overlapping windows, one Watch Out, advanced technical content only in ASTROLOGER style |
| C — Action vs Emotional Tension | action and emotion both visible, overlapping windows retained, one Watch Out, one Timeline-owned emphasis |
| D — Background + Momentary | broad steady-progress Hero first, momentary decision window remains subordinate, both timing layers retained |
| E — Unknown Birth Time | placement-level themes retained, Timeline and Best Window omitted, humane disclosure, no unsupported advanced facts |

All five scenarios remain DEVELOPMENT_ONLY. They are contract examples, not
production Weekly authority or production content.

## 17. Localization and legacy safety

Locale changes labels and editorial copy only. It cannot change:

- Hero owner;
- theme or domain selection;
- deduplication action;
- visibility;
- Timeline ownership;
- overlap retention;
- unknown-time omission;
- fixture authority.

createDeterministicInterpretation remains unchanged and remains the existing
Chart Result UI interpretation path. This task does not migrate Chart Result
UI, introduce a competing production authority, or add any route.

## 18. Admission

This contract is admitted for a future Weekly UI prototype:

~~~text
WEEKLY_READING_MODEL_ADMITTED
MODULE_PASS
SIMULATED_INTEGRATION_PASS
DEVELOPMENT_ONLY
NOT_PRODUCTION_WEEKLY_READY
~~~

The next task may consume this model to prototype Weekly UI projections. This
task itself stops at the contract and focused validation boundary.
