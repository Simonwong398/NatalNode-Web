---
title: "Foundations V1 Lessons 04–06 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
documentKind: CONTENT_REVIEW_MANIFEST
---

# Foundations V1 Lessons 04–06 Review Manifest

## Review status and admission boundary

This manifest records the canonical-English authoring, independent review, Product Owner approval, and runtime-admission boundary for exactly three Class C Foundations lessons. The batch covers the planet/body layer after Lessons 01–03: the luminaries in Lesson 04, the personal planets in Lesson 05, and Jupiter, Saturn, and the outer planets in Lesson 06.

All three records are approved canonical-English content with `contentState = APPROVED`, `currentness = CURRENT`, and `contentRevision = 1`. `CURRENT` identifies the current approved record for this lesson identity. Under the frozen availability rule, `APPROVED` + `CURRENT` content is available through the existing runtime path. `WEB-LEARN-002B` passed the independent editorial/professional gate with final verdict `READY_FOR_OWNER_APPROVAL` and no BLOCKER, MAJOR, MINOR, or actionable EDITORIAL_NOTE findings. The Product Owner explicitly approved these exact canonical-English revisions for runtime admission. No translation or multilingual adaptation was performed.

The existing Foundations registry and canonical Markdown importer were extended to admit Lessons 04–06 through the same path already used for Lessons 01–03. The focused Learn characterization test was updated for the approved revisions. No second registry, loader, content-state resolver, route, UI, glossary runtime, API/BFF, server, database, migration, Engine, provider, Auth, Vault, Feedback, Notification, Commercial, or deployment mechanism was created. Lessons 01–03 remain unchanged, and Lessons 07–12 were not started.

## Canonical English inventory

| Order | Lesson ID | Canonical title | Source path | Content revision | Approximate body words | Content state | Currentness | Runtime availability |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 4 | `foundations.sun_moon` | The Sun and Moon | `docs/content/foundations/v1/en/04-the-sun-and-moon.md` | 1 | ~1,575 | `APPROVED` | `CURRENT` | `AVAILABLE` |
| 5 | `foundations.mercury_venus_mars` | Mercury, Venus, and Mars | `docs/content/foundations/v1/en/05-mercury-venus-and-mars.md` | 1 | ~1,600 | `APPROVED` | `CURRENT` | `AVAILABLE` |
| 6 | `foundations.jupiter_saturn_outer_planets` | Jupiter, Saturn, and the Outer Planets | `docs/content/foundations/v1/en/06-jupiter-saturn-and-the-outer-planets.md` | 1 | ~1,590 | `APPROVED` | `CURRENT` | `AVAILABLE` |

The file titles follow the frozen repository registry, which uses **The Sun and Moon** for Lesson 04. The task shorthand “Sun and Moon” refers to the same semantic lesson identity. Each lesson contains the established nine-section sequence: Orientation; Core Concept; Professional Vocabulary; Example; My Chart; Practice; Check Understanding; Key Takeaway; Sources and Further Reading. Each contains exactly two Check Understanding questions with a correct answer and concise explanation.

## Curriculum and editorial boundary

The lesson sequence is intentionally bounded. Lesson 04 differentiates Sun and Moon functions, adds only a brief sign/house/aspect context reminder, and separates luminary terminology from astronomical classification. Lesson 05 teaches Mercury, Venus, and Mars as distinct symbolic functions and reinforces the body/sign/house/aspect reading map. Lesson 06 differentiates Jupiter and Saturn, introduces Uranus, Neptune, and Pluto, explains the slow-moving/cohort distinction, and separates the traditional seven-body framework from modern outer-planet practice.

Advanced dignity systems, sect, rulership schemes, dispositors, reception, antiscia, bounds, decans, condition scoring, midpoint theory, predictive techniques, synastry, transits, and school-specific graduate-level methods were intentionally omitted. The batch does not attempt full-chart synthesis; that belongs to later Foundations lessons.

## Curriculum benchmark research

The public astrology curriculum sources already used in WEB-LEARN-001C were reused for beginner sequencing and terminology. No uncontrolled broad research project was performed, and no external course prose was copied.

| Benchmark | Public source | How it informed this batch |
| --- | --- | --- |
| Faculty of Astrological Studies — Foundation Course | https://astrology.org.uk/astrology-learning-options/foundation-course/ | Beginner progression from chart foundations into planets, signs, houses, and interpretation. |
| Astrology University — Beginning Astrology: A Language of Life | https://www.astrologyuniversity.com/shop/search-by-astrologer/robert-blaschke-1/beginning-astrology-a-language-of-life/ | Introductory sequencing and accessible planet/body vocabulary. |
| Astrodienst — A Brief Introduction to Astrology | https://www.astro.com/astrology/in_intro_e.htm?nhor=1190 | Reference framing for planets, signs, houses, aspects, and astrology as a symbolic language. |
| The Astrology School — Hellenistic Astrology Course | https://courses.theastrologyschool.com/courses/hellenistic-astrology-course | Historical and school-level distinction between traditional planet vocabulary and later developments. |

## Public source and evidence-lane matrix

| Lesson | Astrology education/reference sources | Astronomy/history sources | NatalNode internal sources |
| --- | --- | --- | --- |
| 04 | Faculty Foundation Course; Astrodienst; Astrology University | NASA, Our Sun: Facts; NASA, Moon Facts | PRD; Foundations V1 product; Learning Architecture V1; Astrology Glossary V1 |
| 05 | Faculty Foundation Course; Astrodienst; Astrology University; The Astrology School | None beyond the existing course astronomy boundary | PRD; Foundations V1 product; Learning Architecture V1; Astrology Glossary V1 |
| 06 | Faculty Foundation Course; Astrodienst; The Astrology School | NASA Solar System history; NASA Uranus, Neptune, and Pluto references; IAU astronomy FAQ | PRD; Foundations V1 product; Learning Architecture V1; Astrology Glossary V1 |

The evidence lanes remain separate:

1. **Astronomy facts:** NASA and IAU sources support the Sun/star, Moon/satellite, discovery-history, and Pluto/dwarf-planet statements.
2. **Astrology conventions:** professional astrology education and reference sources support the bounded beginner vocabulary for luminaries, personal planets, social planets, and outer planets. These sources do not establish scientific validation.
3. **NatalNode product behavior:** the PRD and frozen Foundations/learning/glossary documents support lesson identity, revision fields, unknown-time boundaries, content states, and runtime-admission rules. The learner-facing drafts do not expose internal IDs or implementation ownership.

## Lesson-specific research and editorial notes

### Lesson 04 — `foundations.sun_moon`

- Sun themes are framed through conscious orientation, vitality, agency, purpose, direction, and central identity as an open interpretive theme rather than a fixed personality or “true self” statement.
- Moon themes are framed through emotional responses, instinctive patterns, needs, habits, security, familiarity, and internal regulation without diagnosis or clinical implication.
- The Sun/Moon distinction is repeated as two different interpretive questions, not as a rigid psychological binary.
- “Luminaries” is explained as astrological convention, while the astronomy lane states that the Sun is a star and the Moon is Earth’s natural satellite.
- The synthetic example uses 8° Cancer and 8° Libra with a listed square; the 90° separation was checked for internal consistency. No house or aspect data beyond the stated example is invented.
- Sign, house, and aspect material remains a short context reminder and does not duplicate the later houses or aspects lessons.

### Lesson 05 — `foundations.mercury_venus_mars`

- Mercury is differentiated as processing and exchanging information, including perception, thinking, communication, learning, and information exchange, without intelligence or IQ ranking.
- Venus is differentiated as valuation, attraction, relating, aesthetic preference, pleasure, and reciprocity, without reducing it to romance or a gender stereotype.
- Mars is differentiated as pursuit, assertion, initiative, conflict response, desire, and action, without reducing it to aggression, sex, or a gender stereotype.
- The body/function, sign/style, house/context, and aspect/dynamic shorthand is explicitly presented as a learning aid rather than an absolute equation.
- The synthetic example supplies body and sign positions but no unsupported houses, angles, or aspects.

### Lesson 06 — `foundations.jupiter_saturn_outer_planets`

- Jupiter is framed through expansion, growth, meaning, confidence, opportunity, and worldview; the “luck” shortcut is rejected.
- Saturn is framed through limits, structure, responsibility, discipline, delay, and consolidation; the “suffering” shortcut is rejected.
- Uranus, Neptune, and Pluto receive multidimensional modern-practice vocabulary without “weird,” “psychic,” or trauma-diagnostic definitions.
- The slow-moving/generational distinction is explicit: broad-period outer-planet signs may be shared by many people, so houses, angles, aspects, and faster-body relationships are needed for more specific claims when reliable data supports them.
- The history boundary states that the traditional seven-body framework predates the telescopic discoveries of Uranus, Neptune, and Pluto; it does not imply that ancient astrology used modern outer planets.
- Pluto is identified as an astronomical dwarf planet while remaining available as an astrological chart body in traditions that use it.

## Cross-lesson safety audit

| Check | Result |
| --- | --- |
| Nine-section pedagogical structure preserved | PASS |
| Exactly two Check Understanding questions per lesson | PASS |
| Body/planet layer kept distinct from sign, house, and aspect layers | PASS |
| Calculation facts kept distinct from interpretation | PASS |
| Sun and Moon roles differentiated without a rigid binary | PASS |
| Luminary terminology separated from astronomy taxonomy | PASS |
| Mercury/Venus/Mars functions differentiated without stereotypes | PASS |
| Jupiter/Saturn functions differentiated without luck/suffering shortcuts | PASS |
| Outer-planet generational/cohort boundary included | PASS |
| Pluto dwarf-planet classification handled in the astronomy lane | PASS |
| Traditional seven-body and modern outer-planet history boundary preserved | PASS |
| Unknown birth time remains unknown; no noon/midnight substitution | PASS |
| Houses and aspects kept introductory and deferred to later lessons | PASS |
| Synthetic examples used; stated degree geometry checked where applicable | PASS |
| Deterministic or essentialist personality language | NO |
| Diagnosis, trauma claim, or causal planetary force | NO |
| Scientific-validation implication | NO |
| Famous-person chart speculation | NO |
| External course prose copied | NO |
| Translation or runtime localization performed | NO |
| Product Owner approval claimed | NO |
| Runtime admission performed | NO |
| Lessons 01–03 modified | NO |
| Lessons 07–12 started | NO |
| P1/P2/P3 or unrelated product work performed | NO |

## Product Owner approval, publication, and runtime gate

The three lesson files declare `canonicalLocale = en`, `contentRevision = 1`, `canonicalContentRevision = 1`, `contentState = APPROVED`, and `currentness = CURRENT`. These are the approved professional canonical records for their lesson identities; the revision number is not copied from the approved Lessons 01–03.

The frozen availability rule requires `contentState = APPROVED` and `currentness = CURRENT`. These records therefore have derived runtime availability `AVAILABLE` through the existing Foundations registry and Markdown content path. Product Owner approval applies only to canonical English revisions 1 for Lessons 04–06. It does not approve translations, multilingual adaptations, Lessons 07–12, or Foundations Core seven-locale readiness.

## Approval and admission record

- `WEB-LEARN-002B` independent editorial/professional gate passed with final verdict `READY_FOR_OWNER_APPROVAL` and zero BLOCKER, MAJOR, MINOR, or actionable EDITORIAL_NOTE findings.
- The Product Owner explicitly approved `foundations.sun_moon` revision `1`, `foundations.mercury_venus_mars` revision `1`, and `foundations.jupiter_saturn_outer_planets` revision `1` for canonical-English runtime admission.
- The approval event did not change any lesson title, slug, canonical prose, source, Practice section, Check Understanding question, or content revision.
- Admission uses the existing Foundations registry and canonical Markdown importer used by Lessons 01–03; no parallel admission system was introduced.
- This approval does not apply to non-English content, multilingual adaptation, Lessons 07–12, the final check, rewards, or any unrelated product boundary.

## Files in this review and admission batch

Exactly these seven files belong to this approval/admission batch:

1. `docs/content/foundations/v1/en/04-the-sun-and-moon.md`
2. `docs/content/foundations/v1/en/05-mercury-venus-and-mars.md`
3. `docs/content/foundations/v1/en/06-jupiter-saturn-and-the-outer-planets.md`
4. `docs/content/foundations/v1/en/LESSONS_04_06_REVIEW.md`
5. `apps/web/src/features/learn/foundations/registry.ts`
6. `apps/web/src/features/learn/foundations/FoundationsLessonContent.astro`
7. `apps/web/test/learn-foundations.test.mjs`

No other runtime, UI, CSS, glossary implementation, server, API/BFF, database, migration, Engine, provider, Auth, Vault, Feedback, Notification, Commercial, translation, or deployment file belongs to this batch. Lessons 01–03 canonical prose was not modified. Lessons 07–12 were not started. `C:\NatalNode` was not accessed or modified.
