# NatalNode Product Roadmap V1

- Status: ACCEPTED STRATEGIC ROADMAP / RECONCILED PRODUCT-STATE CHECKPOINT
- Task: `WEB-ROADMAP-002`
- Date: 2026-09-01
- Current launch-readiness follow-up: `WEB-P0-001`
- Scope: Post-V1 product-development blueprint and current product-state checkpoint
- Mode: Documentation only

This document records the accepted post-V1 direction for NatalNode. It does
not authorize implementation of any roadmap item by itself. The current
product and architecture source of truth remains `docs/PRD.md`; the frozen
visual reconstruction constraints remain in
`docs/design/NATALNODE_VISUAL_SYSTEM_V1.md`; accepted architecture and
deployment decisions remain in `docs/adr/`.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `CURRENT / ACTIVE` | The current product or strategic track being actively advanced. |
| `APPROVED FUTURE` | Accepted product direction that may be designed later. |
| `DEFERRED` | Intentionally sequenced later or waiting for a later policy, design, or readiness decision. |
| `COMPLETED` | The bounded local product implementation or contract is complete. |
| `COMPLETED_WITH_EXTERNAL_GATE` | The bounded local implementation is complete; launch, legal, operational, or equivalent external gates remain. |
| `NEXT WEB PRODUCT MILESTONE` | The next separately scoped Web Product milestone; it must remain within the Web/Engine boundary and does not authorize unrelated implementation. |
| `BLOCKED-BY-EXTERNAL-GATE` | Cannot proceed until an external rights, provider, or equivalent gate is resolved. |

## Reconciled product state (WEB-ROADMAP-002)

This checkpoint reconciles the roadmap with the repository state at
`4ad6ebc071a338c524e31489129920a809f8ea27`. It records bounded work that is
already complete locally without converting launch, legal, operations, or
provider requirements into unfinished product implementation. A completed
bounded track must not be reopened by this roadmap.

| Product track | Current repository state | Roadmap classification | Remaining boundary |
| --- | --- | --- | --- |
| Foundations Core | `12 × 7 = 84/84` lessons are approved/current/available. | `COMPLETED` | No open implementation gap in the bounded Foundations Core track. |
| Foundations multilingual curriculum | The seven approved/current locales are available across the closed Foundations curriculum. | `COMPLETED` | Locale expansion or new course content remains separately scoped. |
| Foundations final assessment | Final assessment is `7/7 AVAILABLE` across the closed locales. | `COMPLETED` | No new assessment behavior is authorized by this checkpoint. |
| Foundations Reward V1 | Reward V1 is integrated with the existing FREE/PRO entitlement boundary. | `COMPLETED` | Paid billing/subscription launch remains separately deferred. |
| Private Feedback MVP | The bounded private, authenticated, non-indexed MVP is implemented locally. | `COMPLETED_WITH_EXTERNAL_GATE` | Retention, reviewer/access, privacy, legal, and operational launch decisions remain open. |
| Community / Questions V1 | The bounded public structured Questions and Answers MVP is implemented locally. | `COMPLETED_WITH_EXTERNAL_GATE` | Final jurisdiction-specific UGC Terms wording and production multi-replica rate limiting/operations remain open. |
| Practitioner / Contributor V1 | The bounded profile, application/review, and privacy lifecycle implementation is complete locally. | `COMPLETED_WITH_EXTERNAL_GATE` | Professional-identity/disclosure wording, reviewer operations/grants, retention scheduling, and production distributed rate limiting remain open. |

Notification Platform foundations are locally present, but live web push,
user-facing notification-center behavior, and product-level trigger/delivery
semantics remain deferred. Existing commercial persistence and entitlement
primitives, including Foundations Reward integration, do not constitute a
launched billing/subscription track. Public Sky runtime and Current Transits
remain provider/scientific-dependent and deferred; `PROVIDER DECISION
DEFERRED` remains authoritative.

## 1. Current and active priorities

### Product UX Calibration V1.1

`SUBSTANTIALLY COMPLETE: Product UX Calibration V1.1`

`NATALNODE VISUAL V1.1 FUNCTIONAL BASELINE = APPROVED`

The current V1.1 visual direction is frozen as a functional baseline. Manual
review has approved Calculate V1.1, Chart Workspace ambient propagation, Learn
Editorial Hero, Tools Hub, and Individual Tool pages. This approval records
those surfaces only; it does not approve unreviewed future pages.

The next major roadmap work is not additional visual reconstruction. Further
visual changes during active product development are limited to material
usability, accessibility, responsive, trust/provenance, or new-functional-
hierarchy needs. Decorative polish is deferred to a future dedicated phase.

The original Web implementation task for this calibration track was:

`WEB-VIS-007A — Calculate UX Calibration V1.1`

Manual visual review after completion of `NATALNODE_VISUAL_SYSTEM_V1` identified
three material product issues:

1. Birth Date currently relies on browser-native, locale-dependent date UI.
2. The dark treatment is too compressed and near-black, without enough
   scientific-technology luminosity.
3. Calculate / Birth Input exposes too much internal structural terminology and
   is not sufficiently task-first for ordinary users.

V1.1 is a focused calibration track, not a new product surface or a rewrite of
the Visual System.

The active dependency track remains Scientific Core / Engine completion in the
separate Engine repository. NatalNode-Web remains provider-neutral and must
not perform Engine work.

### V1.1 goals

#### A. Locale-independent Birth Date

Replace reliance on browser-native locale-dependent date presentation with an
explicit NatalNode-controlled birth-date interaction.

`ChartRequest` semantics must not change.

#### B. Task-first Calculate UX

The ordinary user workflow should be presented in this order:

```text
Birth date
Birth time
Birth place
Advanced chart settings
Calculate Chart
```

Internal concepts such as `GROUP 1`, `GROUP 2`, `GROUP 3`, and `Place &
Timezone Resolution` must not dominate the ordinary workflow. Scientific
resolution states remain explicit wherever they affect trust or chart
availability.

#### C. Visual luminosity calibration

Preserve NatalNode's dark-dominant identity while increasing:

- deep-space blue hierarchy;
- blue, violet, and cyan luminosity;
- scientific-instrument character; and
- spatial depth.

The calibration must avoid neon overload, cyberpunk or gaming-HUD treatment,
glassmorphism, and continuous animation. It must remain consistent with the
frozen visual-system identity and accessibility requirements.

## 2. Engine and scientific-core track

`CURRENT / ACTIVE`

### NatalNode Engine / Scientific Core Completion

The Engine and scientific-core completion effort is an active parallel track in
the separate Engine repository. NatalNode-Web remains a provider-neutral first-
party client and must not perform Engine work from this repository.

The Web boundary remains:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
```

Production astronomy remains:

```text
BLOCKED-BY-EXTERNAL-GATE
PROVIDER DECISION DEFERRED
```

The external gate includes provider rights, production selection, and the
scientific/provenance readiness required by the PRD production release gate.
No roadmap item authorizes provider-specific Web UI, astronomy calculation, or
provider dependency work.

## 3. Community and Questions

`COMPLETED_WITH_EXTERNAL_GATE`

### Working concept

```text
Community
└── Questions
```

The bounded Community / Questions V1 implementation is locally complete. Its
remaining launch gates are final jurisdiction-specific UGC Terms wording and
production multi-replica rate limiting/operations. The deferred items listed
below are future expansion, not missing V1 implementation.

The intended surface is a structured knowledge and support experience with:

- public read;
- authenticated write;
- question → answers;
- accepted answer;
- topic taxonomy;
- moderation;
- SEO-indexable public knowledge pages;
- structured Q&A markup only where semantically eligible; and
- NatalNode Team answers where appropriate.

This must not become a traditional open forum. Avoid general chat boards,
off-topic boards, anonymous posting, private messaging, and gamified forum
ranks.

Community and Questions V1 remains separate from the Scientific Core.
Production scientific integration and production scientific claims remain
externally blocked, but Scientific Core completion is not a prerequisite for
the locally completed non-scientific V1 implementation.

### Community positioning

Community should support questions about:

- charts;
- astrology concepts;
- NatalNode behavior;
- calculation differences; and
- interpretation concepts.

It should not be positioned primarily around fortune telling, personal destiny
prediction, relationship prediction, gambling-like prediction, or low-quality
“read my future” traffic.

The intended outcome is:

```text
structured astrology knowledge
+
chart understanding
+
product support and community knowledge
```

## 4. Practitioner and Contributor network

`COMPLETED_WITH_EXTERNAL_GATE`

The bounded V1 identity architecture is:

```text
Member
Contributor
Practitioner
NatalNode Team
```

NatalNode must not use `Beginner Astrologer`, `Intermediate Astrologer`, or
`Advanced Astrologer` as NatalNode-certified skill levels.

Keep these concepts separate:

- account role;
- verification; and
- reputation / contribution.

Potential contribution measures may eventually include answers, accepted
answers, and articles. No scoring system is approved for implementation yet.

### Public Practitioner profile

The bounded Practitioner / Contributor V1 implementation is locally complete,
including the approved-profile directory, private application/review boundary,
and privacy lifecycle. The implementation does not make the Practitioner
network production-launch ready: jurisdiction-specific identity/disclosure
wording, reviewer operations, retention scheduling, and distributed production
limits remain external or operational gates.

The bounded V1 public Practitioner profile uses the approved presentation
fields in `NATALNODE_PRACTITIONER_CONTRIBUTOR_V1.md`:

- display or professional name;
- bio;
- languages;
- practice areas;
- website;
- professional or social links;
- articles;
- questions answered; and
- accepted answers.

Any additional fields require later privacy and product design. No additional
schema is authorized by this roadmap.

### Practitioner application

The bounded V1 application flow is implemented under the approved policy. A
future broader flow may be titled:

`Become a NatalNode Practitioner`

The bounded application information includes professional name, bio, languages,
practice areas, website or social presence, optional professional credentials,
and reason for joining. Any broader application or verification flow remains
future and separately gated.

The bounded V1 admission and review criteria are frozen by
`NATALNODE_PRACTITIONER_CONTRIBUTOR_V1.md` and are implemented locally. Broader
verification, marketplace, and commercial policy remains outside V1.

The bounded Practitioner / Contributor V1 remains separate from the Scientific
Core. Production scientific integration and production scientific claims remain
externally blocked; broader network, verification, and commercial work remains
future and separately gated.

### Founding Practitioner

`COMPLETED_WITH_EXTERNAL_GATE`

NatalNode may invite a small, manually selected first cohort of professional
contributors before a broad Community launch.

`Founding Practitioner` represents early participation in NatalNode. It is not
scientific certification, professional competency certification, or a paid
rank. The bounded V1 `foundingPractitioner` label is server-controlled and
non-certifying; any broader cohort or badge program remains future and
deferred.

## 5. Private Feedback

`COMPLETED_WITH_EXTERNAL_GATE`

Feedback must remain separate from public Community and should be private,
non-indexed, and product-support oriented.

Potential categories are:

- Bug;
- Suggestion;
- Incorrect result / calculation concern; and
- Other.

Personal birth-data support posts must not be mixed into public Questions. The
bounded Private Feedback MVP is locally complete under
`docs/adr/WEB-FEEDBACK-001A-private-feedback-mvp-architecture.md`. Retention,
reviewer/access, broader privacy, legal, and operational launch decisions
remain external or policy-gated. Feedback history/delete and other broader
review tooling remain deferred.

## 6. NatalNode Knowledge Network

`APPROVED FUTURE`  
`DEFERRED`

The future integrated architecture is:

```text
NatalNode Knowledge Network
├── Learn
│   └── authoritative editorial knowledge
├── Questions
│   └── public structured Q&A
├── Practitioners
│   └── professional contributor identities
└── Feedback
    └── private product feedback
```

Potential growth loop:

```text
Question
→ high-value answers
→ accepted answer
→ repeated user demand
→ Learn article
→ product explanation / UX improvement
```

This is strategic direction, not implementation scope.

### Navigation direction

The following is a future hypothesis, not a frozen implementation change:

```text
Learn
Tools
Calculate
Community
Vault
```

Community may contain Questions and Practitioners. Current navigation must not
be modified by this roadmap document.

## 7. Practitioner outreach

`APPROVED FUTURE`  
`DEFERRED`

Targeted professional outreach may involve a limited number of relevant
astrologers, authors, educators, and creators in order to:

- recruit Founding Practitioners;
- seed high-quality answers;
- seed expert-authored educational content; and
- avoid an empty-community launch.

The quality policy is:

`TARGETED PROFESSIONAL OUTREACH`

not bulk scraped-email marketing. Sources, legal requirements, and privacy
requirements must be reviewed before operational outreach.

Do not implement outreach tooling, email harvesting, Facebook scraping, or
bulk-email functionality.

### Email reputation separation

Future `AUTH TRANSACTIONAL EMAIL` and `PARTNERSHIP / COMMUNITY OUTREACH` must
not automatically share the same sending identity or reputation. The current
Auth sending identity remains dedicated to transactional authentication. A
separate outreach identity requires a future operational decision.

No email code changes are authorized by this roadmap.

## 8. Editorial, SEO, and GEO direction

`APPROVED FUTURE`  
`DEFERRED`

Learn, Questions, Practitioner profiles, and expert-authored content are
future organic-discovery surfaces.

The content principle is:

- people-first;
- original;
- useful;
- author-attributed;
- structured; and
- internally connected.

NatalNode must not promise ranking, define arbitrary article-count thresholds,
or produce mass AI filler.

## 9. Monetization and privacy readiness

### Monetization

`FUTURE / DEFERRED`

Potential ad-eligible surfaces are Learn and educational Tools, evaluated in a
separate future decision.

The following surfaces remain frozen ad-free:

- Calculate;
- Birth Input;
- Chart Workspace;
- Interpretation;
- Calculation Details;
- Vault; and
- Auth.

No advertising is added by this roadmap.

### CMP, privacy, and legal

`DEFERRED`

Future launch or monetization-readiness work may include privacy policy, terms,
consent architecture, a CMP where required, and advertising/privacy
configuration. These pages and systems are not implemented or expanded here.

## 10. Deployment status

`DEFERRED`

```text
WEB DEPLOYMENT TRACK = PAUSED
```

Railway staging implementation remains intentionally deferred until the
scientific core is ready enough for meaningful staging. Accepted deployment
ADRs remain authoritative; no deployment files or infrastructure are changed
by this roadmap.

When deployment is explicitly resumed:

```text
WEB-SEC-002A-R1
must be completed before
WEB-DEPLOY-002B
```

The production hosting provider remains unselected. Production astronomy
remains blocked by the external gate and the provider decision remains
deferred.

## 11. Recommended strategic sequence

The accepted post-V1 sequence is:

The cross-cutting P0 launch-readiness milestone in section 12 is the next
decision boundary before any new future Web Product feature phase. Phase B
remains a separate Scientific Core / Engine track.

| Phase | Direction | Status |
| --- | --- | --- |
| Phase A | Product UX Calibration V1.1 | `COMPLETED` |
| Phase B | Scientific Core Completion / Engine gates | `CURRENT / ACTIVE` in the separate Engine track |
| Phase C | Community & Practitioner Product Architecture | `COMPLETED_WITH_EXTERNAL_GATE` |
| Phase D | Questions + Private Feedback MVP | `COMPLETED_WITH_EXTERNAL_GATE` |
| Phase E | Practitioner Profiles / Application / Founding cohort | `COMPLETED_WITH_EXTERNAL_GATE` |
| Phase F | Knowledge-network growth: Learn + Questions + Practitioners | `APPROVED FUTURE` / `DEFERRED` |
| Phase G | Staging / deployment when scientifically meaningful | `DEFERRED` |
| Phase H | SEO/GEO / practitioner outreach / monetization readiness | `APPROVED FUTURE` / `DEFERRED` |

This strategic sequence may evolve through later explicit decisions. It does
not override the PRD release gates, the visual-system reconstruction sequence,
or the accepted ADRs.

This table expresses product dependency sequencing, not a blanket freeze on
all NatalNode-Web work. Scientific Core gates apply to scientific-dependent
work; non-scientific Web Product work may proceed in parallel when its own
prerequisites are satisfied.

## 12. Immediate next Web product milestone

```text
NEXT WEB PRODUCT MILESTONE: P0 LAUNCH-READINESS CLOSURE
RECOMMENDED NEXT ACTION: P0_LAUNCH_READINESS
```

The Web Product track is authorized to continue independently on non-scientific
work, but the next milestone is not another feature implementation campaign.
The first authoritative, still-uncompleted Web Product milestone is a
P0 launch-readiness closure / policy and operations decision checkpoint. The
current P0 launch-readiness consolidation records the safe local gaps closed
by this campaign. Policy, legal, operations, deployment, processor, and
provider gates still prevent a production release claim. The current
consolidated readiness matrix is in
[`NATALNODE_P0_LAUNCH_READINESS_V1.md`](./NATALNODE_P0_LAUNCH_READINESS_V1.md).

The checkpoint must obtain explicit owner-approved decisions for the retention
registry and scheduler ownership, Privacy Access Audit authorization and
deletion interaction, legal/public-copy inputs, backup/restore reconciliation,
observability sink and retention ownership, processor boundaries, and the
remaining deployment/credential responsibilities. Its scope is decision-only
until those inputs are available.

The historical `WEB-P0-POLICY-001A` task remains not executed/deferred and must
not be recreated automatically. A new owner-assigned campaign identifier is
required before any P0 decision checkpoint begins.

The visual V1.1 functional baseline is frozen. No additional decorative
visual reconstruction is the immediate next roadmap task. Scientific Core /
Engine completion remains a separate active dependency track and is not
implemented in NatalNode-Web.

The completed calibration scope was:

- locale-independent Birth Date UX;
- task-first Calculate/Birth Input simplification;
- visual luminosity and scientific-technology calibration; and
- preservation of all scientific and trust semantics.

The bounded Community/Questions, Private Feedback, and
Practitioner/Contributor V1 tracks are locally complete and must not be
reopened as the next task. Their remaining legal, privacy, reviewer,
retention, and operational gates are launch-readiness concerns, not reasons to
reclassify the completed local MVPs as unfinished.

## 13. Roadmap guardrails

This document does not authorize unscoped:

- application, package, server, or deployment changes;
- changes to `ChartRequest`, `ChartResult`, `EngineClient`, or BFF boundaries;
- astronomy calculations or provider-specific dependencies;
- production provider selection or production scientific claims;
- current navigation changes;
- unscoped expansion or reopening of the bounded Community/Questions,
  Practitioner/Contributor, or Private Feedback V1 surfaces;
- unscoped monetization surfaces;
- email harvesting, scraping, or bulk outreach; or
- speculative schemas, scoring, verification, or privacy architecture.

`C:\NatalNode` remains outside the scope of NatalNode-Web work.

## 14. Two-track development clarification

NatalNode development is explicitly divided into two tracks. The tracks are
related by the public API boundary, but Scientific Core completion does not
freeze unrelated Web Product work.

### TRACK A — NatalNode Scientific Core

`EXTERNAL / PARALLEL TRACK`

`COMMERCIAL AUTHORIZATION / SCIENTIFIC CORE COMPLETION PENDING`

Track A is separate from NatalNode-Web and is responsible for:

- scientific astronomy and production chart calculation;
- scientific configuration and provenance readiness;
- final production resolver and scientific integration; and
- the production Engine Public API contract needed by the Web Product.

NatalNode-Web must not implement astronomy algorithms, provider bindings,
scientific configuration generation, scientific provenance identities, or
production scientific claims.

### TRACK B — NatalNode.com Web Product

`AUTHORIZED TO PROCEED INDEPENDENTLY ON NON-SCIENTIFIC WORK`

Track B's bounded local completions are recorded in the reconciliation table
above. Any work on their remaining launch gates requires its own authorization.
Remaining non-scientific directions include:

- Auth completion and live external enablement;
- Vault management;
- technical SEO infrastructure;
- Learn and content architecture;
- legal and trust work after policy content is available;
- account and profile expansion; and
- future Community/Questions or Practitioner/Contributor expansion after its
  own product, privacy, moderation, and operational prerequisites are satisfied.

Other non-scientific website functionality may proceed when its own
prerequisites are met. The preserved boundary is:

```text
NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API
→ scientific core
```

The following remain blocked by Track A:

- production Engine integration;
- production astronomy;
- production natal-chart facts;
- final scientific configuration and provenance identities;
- production birth-location/timezone resolution where it depends on the
  final approved scientific data source; and
- production scientific claims.

`PROVIDER DECISION DEFERRED` remains authoritative.
