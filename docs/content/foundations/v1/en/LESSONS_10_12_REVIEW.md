---
title: "Foundations V1 Lessons 10–12 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
documentKind: CONTENT_REVIEW_MANIFEST
---

# Foundations V1 Lessons 10–12 Review Manifest

## Scope and state

This manifest records canonical-English authoring (`WEB-LEARN-004A`), independent final-batch editorial/professional/epistemic review (`WEB-LEARN-004B`), explicit Product Owner approval, and canonical-English runtime admission (`WEB-LEARN-004C`) for exactly three Class C Foundations lesson records.

All three records remain at `contentRevision: 1` and `canonicalContentRevision: 1`. They are `contentState: APPROVED` and `currentness: CURRENT`; under the frozen availability rule, each is runtime `AVAILABLE` through the existing canonical Markdown and Foundations registry path. Approval applies only to canonical English and is an authorization/admission event, not a content revision.

## Lesson identities

| Lesson | Registry identity | Title | Slug | My Chart hook | Capability | Birth-data requirement |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | `foundations.chart_priorities` | What Matters First in a Chart | `what-matters-first-in-a-chart` | `my_chart.chart_priorities` | `CHART_PRIORITIES` | `NOT_REQUIRED` |
| 11 | `foundations.whole_chart` | Reading the Chart as a Whole | `reading-the-chart-as-a-whole` | `my_chart.whole_chart` | `WHOLE_CHART` | `REQUIRED_FOR_TIME_DEPENDENT_FACTS` |
| 12 | `foundations.responsible_astrology` | Using Astrology Responsibly | `using-astrology-responsibly` | `my_chart.responsible_use` | `RESPONSIBLE_USE` | `NOT_REQUIRED` |

## Content contract audit

- The three drafts use the frozen nine-section sequence in this order: `Orientation`, `Core Concept`, `Professional Vocabulary`, `Example`, `My Chart`, `Practice`, `Check Understanding`, `Key Takeaway`, and `Sources and Further Reading`.
- Each lesson contains exactly two `Check Understanding` questions, two marked correct answers, and two explanations.
- Approximate body-word counts after authoring, excluding frontmatter, headings, and the `Sources and Further Reading` section, are:
  - Lesson 10: 1,647 words; guidance range 1,350–1,650.
  - Lesson 11: 1,687 words; guidance range 1,400–1,750.
  - Lesson 12: 1,590 words; guidance range 1,300–1,650.
- The counts are editorial guardrails, not quotas or runtime validation rules.

## Editorial coverage

### Lesson 10 — What Matters First in a Chart

- Presents prioritization as a transparent first-pass order, not a measure of a person's importance or a NatalNode ranking rule.
- Starts with supported returned facts and input quality, then discusses supported structure, angles when available, repeated sign/element/mode themes, relevant major aspects, and qualifying patterns.
- Explicitly rejects universal hierarchies, dominant-planet scores, points, weights, ranking algorithms, diagnosis, and forecast certainty.
- Treats slow outer-planet signs as broad cohort context and preserves the unknown-time boundary for ASC, MC, houses, cusps, and other angle-dependent facts.

### Lesson 11 — Reading the Chart as a Whole

- Distinguishes whole-chart synthesis from keyword accumulation.
- Teaches a bounded workflow: observe supported facts, separate facts from interpretation, identify related patterns, combine supported layers, name tensions, phrase a qualified synthesis, and stop at the evidence boundary.
- Keeps competing themes visible, applies stopping rules, and states that a whole chart is not a whole person.
- Preserves the unknown-time boundary and does not add houses or angles when they are unavailable.

### Lesson 12 — Using Astrology Responsibly

- Separates known chart facts, uncertain input, interpretive convention, and speculation.
- Maintains non-deterministic language, the astronomy/astrology trust boundary, and the distinction between precision and validation.
- Refuses diagnosis and high-stakes decision authority for medical, mental-health, legal, financial, safety, and related claims.
- Covers consent, privacy, third-party charts, public figures, children, agency, stopping conditions, and responsibility as a boundary rather than dismissal.

## Synthetic geometry audit

The only degree-based checks intentionally used in the lesson examples are:

- Lesson 10: 20° Taurus = 50° and 20° Leo = 140°; the smaller separation is 90°, consistent with the listed Sun–Moon square.
- Lesson 11: the same 50°/140° conversion and 90° separation support the listed Sun–Moon square.

These are checks of the supplied synthetic examples, not astronomy implementation, chart calculation, scoring, or scientific validation. Lesson 12 does not introduce a degree-based chart example.

## Evidence and research lanes

The drafts cite the existing internal Foundations product freeze, learning architecture, and—where relevant—the localization product policy. They reuse the existing public beginner source set: Faculty of Astrological Studies, Astrodienst, Astrology University, and The Astrology School. The sources are used for curriculum sequencing and situated interpretive context, not as scientific validation or copied text.

No broad research, new external dependency, or provider research was performed for this authoring pass. No source text was reproduced as lesson copy.

## Glossary and runtime compatibility

- No new runtime glossary IDs, capability IDs, hooks, or API fields were introduced. The existing Foundations registry and canonical Markdown importer were extended only to admit these three approved lesson records.
- Editorial terms such as salience, prioritization, synthesis thread, epistemic status, sensitive inference, and proportionate language are explained locally in the lessons; they do not expand the runtime glossary contract.
- The existing registry mapping for `chart_type.natal` remains the only relevant registry glossary mapping for this batch. Deferred angle mappings remain deferred and are not needed by these lessons.
- No lesson-side calculator, browser-side interpretation engine, AI behavior, chart score, or production metadata was added.

## Cross-lesson safety audit

PASS for the following negative checks:

- Lessons 01–09 are unchanged.
- Product Owner approval and canonical-English runtime admission were performed only for the exact revision-1 records in this batch.
- No translation, multilingual adaptation, or non-English locale publication was performed.
- No UI, CSS, API, BFF, commercial, database, migration, Engine, provider, or deployment source was changed.
- No final quiz, rewards, AI interpretation, chart scoring, advanced predictive technique, or P1/P2/P3 functionality was added.
- No astronomy or provider dependency was added.
- `C:\NatalNode` was not accessed.

## Exact review file set

1. `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/en/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/en/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/en/LESSONS_10_12_REVIEW.md`

## Approval and admission implementation file set

The focused implementation change is limited to the existing admission path
and its characterization coverage:

1. `apps/web/src/features/learn/foundations/registry.ts`
2. `apps/web/src/features/learn/foundations/FoundationsLessonContent.astro`
3. `apps/web/test/learn-foundations.test.mjs`

## Approval and canonical-English runtime gate

`WEB-LEARN-004B` passed the independent final-batch editorial/professional/epistemic gate with final verdict `READY_FOR_OWNER_APPROVAL` and no BLOCKER, MAJOR, MINOR, or EDITORIAL_NOTE findings. The Product Owner explicitly approved these exact canonical-English revisions for runtime admission:

- `foundations.chart_priorities` — revision `1`
- `foundations.whole_chart` — revision `1`
- `foundations.responsible_astrology` — revision `1`

The approval record does not invent a reviewer identity, name, email, account, or signature. It applies only to canonical English. It does not approve translations, a final quiz, quiz scoring, attempt persistence, rewards, AI interpretation, chart-prioritization/scoring runtime logic, or Foundations Core seven-locale readiness.

The three lesson files now declare `contentState = APPROVED` and `currentness = CURRENT` without changing their prose or either revision field. The existing Foundations registry admits exactly these revision-1 records, and the existing canonical Markdown importer maps their stable lesson IDs to the corresponding source files. Runtime availability remains derived solely from `APPROVED` plus `CURRENT`.

After admission, all twelve canonical-English Foundations lessons are approved/current and available. The seven-locale Core gate remains unsatisfied because non-English Class C variants for the full twelve-lesson set are not yet approved/current. This batch therefore completes canonical-English Foundations admission only; it does not make Foundations Core ready or authorize translation.
