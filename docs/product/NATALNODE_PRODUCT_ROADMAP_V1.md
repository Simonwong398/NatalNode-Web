# NatalNode Product Roadmap V1

- Status: ACCEPTED STRATEGIC ROADMAP
- Task: `WEB-ROADMAP-001`
- Date: 2026-08-25
- Scope: Post-V1 product-development blueprint
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
| `NEXT WEB PRODUCT TASK` | The next separately scoped Web Product task; it must remain within the Web/Engine boundary and does not authorize unrelated implementation. |
| `BLOCKED-BY-EXTERNAL-GATE` | Cannot proceed until an external rights, provider, or equivalent gate is resolved. |

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

`APPROVED FUTURE`  
`DEFERRED`

### Working concept

```text
Community
└── Questions
```

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

Community and Questions work remains gated by its own account, profile,
moderation, and privacy prerequisites. Scientific Core completion is not a
blanket prerequisite for non-scientific Community architecture, but production
scientific integration and production scientific claims remain externally
blocked.

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

`APPROVED FUTURE`  
`DEFERRED`

The preferred future identity architecture is:

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

The approved future concept is a public Practitioner profile. Potential fields
include:

- display or professional name;
- bio;
- languages;
- practice areas;
- website;
- professional or social links;
- articles;
- questions answered; and
- accepted answers.

All fields require later privacy and product design. No schema is authorized by
this roadmap.

### Practitioner application

An approved future flow may be titled:

`Become a NatalNode Practitioner`

Potential application information includes professional name, bio, languages,
practice areas, website or social presence, optional professional credentials,
and reason for joining.

Actual verification criteria remain:

`PRODUCT POLICY TO BE DESIGNED`

No application flow or verification implementation is authorized now.

Practitioner and Contributor work remains gated by Questions, profile,
moderation, and verification prerequisites. Scientific Core completion is not
a blanket prerequisite for non-scientific product architecture, but production
scientific integration and production scientific claims remain externally
blocked.

### Founding Practitioner

`APPROVED FUTURE`  
`DEFERRED`

NatalNode may invite a small, manually selected first cohort of professional
contributors before a broad Community launch.

`Founding Practitioner` represents early participation in NatalNode. It is not
scientific certification, professional competency certification, or a paid
rank. The badge or status must not be implemented yet.

## 5. Private Feedback

`APPROVED FUTURE`  
`NEXT WEB PRODUCT TASK`

Feedback must remain separate from public Community and should be private,
non-indexed, and product-support oriented.

Potential categories are:

- Bug;
- Suggestion;
- Incorrect result / calculation concern; and
- Other.

Personal birth-data support posts must not be mixed into public Questions. No
feedback system is part of this roadmap patch. The next task is to freeze the
Private Feedback MVP architecture before implementation.

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

| Phase | Direction | Status |
| --- | --- | --- |
| Phase A | Product UX Calibration V1.1 | `CURRENT / ACTIVE` |
| Phase B | Scientific Core Completion / Engine gates | `CURRENT / ACTIVE` in the separate Engine track |
| Phase C | Community & Practitioner Product Architecture | `APPROVED FUTURE` / `DEFERRED` |
| Phase D | Questions + Private Feedback MVP | `APPROVED FUTURE` / `NEXT WEB PRODUCT TASK` |
| Phase E | Practitioner Profiles / Application / Founding cohort | `APPROVED FUTURE` / `DEFERRED` |
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

## 12. Immediate next Web product task

```text
NEXT WEB PRODUCT TASK: Private Feedback MVP
```

The Web Product track is authorized to continue independently on non-scientific
work. The immediate next Web Product task is `Private Feedback MVP`: an
authenticated, private-by-default, non-indexed, product-support surface that
remains separate from public Community. Its categories remain exactly:

- Bug;
- Suggestion;
- Incorrect result / calculation concern; and
- Other.

The Private Feedback MVP does not require production astronomy, provider
selection, or Railway deployment. A live persistence implementation will
still require operational PostgreSQL; this roadmap clarification does not
change deployment status or authorize implementation by itself.

The visual V1.1 functional baseline is frozen. No additional decorative
visual reconstruction is the immediate next roadmap task. Scientific Core /
Engine completion remains a separate active dependency track and is not
implemented in NatalNode-Web.

The completed calibration scope was:

- locale-independent Birth Date UX;
- task-first Calculate/Birth Input simplification;
- visual luminosity and scientific-technology calibration; and
- preservation of all scientific and trust semantics.

Community/Questions may proceed only after its own account, profile,
moderation, and privacy prerequisites are satisfied. Practitioner/Contributor
work may proceed only after Questions, profile, moderation, and verification
prerequisites are satisfied. Neither sequence is a blanket freeze caused by
the Scientific Core track.

## 13. Roadmap guardrails

This document does not authorize unscoped:

- application, package, server, or deployment changes;
- changes to `ChartRequest`, `ChartResult`, `EngineClient`, or BFF boundaries;
- astronomy calculations or provider-specific dependencies;
- production provider selection or production scientific claims;
- current navigation changes;
- public Community, Practitioner, Feedback, or monetization surfaces;
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

Track B may continue through separately scoped Web Product tasks, including:

- Auth completion;
- Vault management;
- Private Feedback;
- technical SEO infrastructure;
- Learn and content architecture;
- legal and trust work after policy content is available;
- account and profile work;
- Community/Questions after its account, profile, moderation, and privacy
  prerequisites are satisfied; and
- Practitioner/Contributor work after Questions, profile, moderation, and
  verification prerequisites are satisfied.

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
