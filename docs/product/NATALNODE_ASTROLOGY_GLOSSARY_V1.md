# NatalNode Astrology Glossary V1

**Status:** FROZEN V1 PROFESSIONAL TERMINOLOGY INVENTORY + GOVERNANCE CONTRACT
**Task:** `WEB-LOCALIZATION-001I`
**Source of truth:** [`docs/PRD.md`](../PRD.md)
**Related frozen policy:** [`NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`](./NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md)
**Related frozen architecture:** [`NATALNODE_LOCALIZATION_ARCHITECTURE_V1.md`](../architecture/NATALNODE_LOCALIZATION_ARCHITECTURE_V1.md)
**Scope:** `NatalNode-Web` only. No Engine changes, runtime glossary implementation, localized translations, or locale additions are included.

This document freezes the V1 semantic taxonomy and governance rules for professional astrology terminology used or represented by the Web. It is an inventory and a future implementation contract, not a runtime glossary, translation catalog, or scientific calculation specification.

Normative words in this document have their usual meanings: **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**, **DEFERRED**, **FROZEN**, and **REVIEW REQUIRED**.

## 1. Purpose and scope

The purpose of this document is to establish one reviewable, language-neutral identity for the professional astrology concepts already evidenced in the current Web and its public chart/current-sky contracts. It prevents future localization work from treating display strings, glyphs, interpretive prose, or scientific metadata as interchangeable concepts.

V1 covers:

- the bodies, zodiac signs, chart angles, houses, house cusps, house systems, major aspects, orb, aspect phase, motion states, natal-chart type, and the astrology-facing tropical zodiac model currently represented in Web code or fixtures;
- a small set of current-sky event vocabulary that is present in the contract/fixture boundary but not yet rendered as a user-facing event surface;
- stable semantic IDs, canonical English terms, aliases/display notation, locale-variant governance, approval/currentness, fallback, and review rules.

V1 does **not** implement localization. It does not add translations, change `SupportedLocale`, introduce a UI Catalog, change Engine or domain contracts, or change any product surface.

### V1 inventory counts

| Inventory bucket | Count | Meaning |
| --- | ---: | --- |
| Current concepts | 66 | Concepts admitted to the V1 inventory and backed by current Web code, public contracts, or current fixtures |
| P0 concepts | 51 | Core chart terminology already central to current chart/result surfaces |
| P1 concepts | 10 | Active supporting terminology or current-sky model/state vocabulary |
| P2 concepts | 5 | Contract/fixture-backed current-sky event vocabulary not yet rendered by the current-sky UI |
| Deferred individual concept IDs | 6 | Explicitly named concepts retained for later review, but not admitted to the V1 inventory |

The 66 current concepts are counted once by semantic ID. Aliases, abbreviations, glyphs, ordinal forms, Roman numerals, and raw-code spellings do not create additional concepts. The six deferred IDs are not included in the 66.

## 2. Relationship to Class A and Class C

The localization policy distinguishes ordinary product UI from professional/domain terminology:

- **Class A — ordinary product UI:** navigation, actions, state labels, form labels, account/security wording, and other general interface language. Examples include Save, Delete, Calculate, Workspace, Vault, Loading, Try again, Birth details, Date, Time, Place, and Settings. Class A is not entered in this glossary.
- **Class B — professional/domain terminology:** stable astrology concepts, labels, values, notation, and terminology whose meaning must remain professionally correct across locales. This is the scope of this glossary.
- **Class C — interpretation/editorial prose:** explanations, educational sentences, headings, and narrative meaning. Class C may provide evidence that a concept exists, but prose is not converted into glossary entries. Meaning text MUST remain separate from the professional term and MUST NOT be used to infer an unapproved terminology expansion.

Examples of the boundary:

- `House system` is an ordinary form label (Class A), while `Placidus`, `Whole Sign`, and `Equal House` are Class B system values.
- `Natal Chart` is admitted as a chart-type term because it identifies the chart being shown, while `Chart facts at a glance` and `Major aspects` are surrounding product labels and are not glossary concepts.
- A sentence such as “the Ascendant in ...” or interpretive prose about a planet being direct is Class C evidence/context; `Ascendant` and `Direct` are separately governed Class B terms where current product contracts/surfaces support them.

## 3. Frozen V1 scope and admission rules

An individual concept MAY enter this V1 inventory only when at least one of the following is true:

1. it is a stable value or field in a current public Web-facing contract;
2. it is rendered or selected by an active Web chart, workspace, calculation-details, Tools, Learn, or Current Sky surface;
3. it is represented by the current canonical UI/dev fixture used to prove a current surface.

Evidence is recorded at the family or concept row. A source occurrence alone does not authorize a new feature, a new calculation, or a new translation.

The inventory is intentionally minimal. It is not an astrology encyclopedia and does not pre-admit every possible planet point, house system, aspect, technique, dignity, condition, lunar phase, or forecasting term.

The following are explicit V1 decisions:

- The ten current chart/current-sky bodies are admitted as celestial-body concepts.
- All twelve zodiac signs are admitted even where a particular fixture instance does not contain every sign, because the Web contracts and active Tools/notation surfaces represent the complete sign set.
- `Ascendant` and `Midheaven` are admitted because `ASC` and `MC` are current angle fields/labels. Descendant and Imum Coeli are deferred because no current Web contract or surface represents them.
- Houses 1–12 and house cusp are admitted. House numbers, ordinal spellings, and Roman numerals are display forms of those concepts, not new IDs.
- Only the three current house-system options are admitted: Placidus, Whole Sign, and Equal House. No additional system is assumed from general astrology knowledge.
- Only the five current major aspects are admitted: conjunction, opposition, square, trine, and sextile.
- Orb and the three current aspect phases are admitted because current contracts and notation render them.
- Retrograde is P0 because chart results expose it. Direct and stationary are P1 because the Current Sky contract/UI exposes the three-state motion vocabulary.
- Natal chart is admitted as a chart type. Transit, profection, synastry, and solar return are deferred; they are not inferred from editorial language or roadmap possibility.
- The tropical zodiac model is admitted as an astrology-facing current-sky model. The geocentric reference frame is not a glossary concept; it belongs to the scientific/provenance boundary.
- Current-sky event terms are P2 when they are contract/fixture-backed but lack a current rendered event surface. P2 admission does not imply that an event UI is being implemented.

## 4. Semantic identity rules

Every glossary concept MUST have exactly one stable, language-neutral semantic ID in this V1 taxonomy.

Semantic IDs:

- MUST be ASCII, lowercase, deterministic, and reviewable;
- MUST use the form `family.member` or another equally explicit stable namespace;
- MUST NOT contain localized display strings, locale codes, glyphs, abbreviations that obscure the concept, or user-facing copy;
- MUST NOT change merely because a canonical English display term, alias, typography choice, or translation changes;
- MUST NOT be reused for a different concept after publication;
- SHOULD describe semantic identity rather than implementation property names;
- MUST be emitted/consumed as identity by future domain/UI boundaries, while localized labels remain presentation data.

The concept ID is not a scientific ID, database ID, provider ID, event ID, or generated chart identifier. The glossary does not create scientific identifiers.

One concept has one canonical English term per terminology revision. Aliases and abbreviations are additional presentation or recognition forms and MUST NOT become competing semantic IDs. A future locale MAY have a professional display term, short form, and aliases, but those values remain attached to the same semantic ID.

## 5. Frozen terminology families

The V1 families are:

1. `body` — chart/current-sky celestial bodies represented by the Web.
2. `sign` — the twelve zodiac signs.
3. `sign_element` — the four active element terms used by the sign lookup Tool.
4. `sign_modality` — the three active modality terms used by the sign lookup Tool.
5. `angle` — chart angles currently represented by the Web.
6. `house` — house numbers and house cusp terminology.
7. `house_system` — house-system values currently selectable/represented by the Web.
8. `aspect` — major aspect types and orb.
9. `aspect_phase` — applying, exact, and separating states.
10. `motion` — retrograde, direct, and stationary states.
11. `chart_type` — the current natal chart type.
12. `zodiac_model` — the astrology-facing zodiac model currently exposed by Current Sky.
13. `sky_event` — current-sky event kinds represented by the public contract/fixture.
14. `lunar_phase` — a narrowly admitted current-sky lunation value, not a complete lunar-phase taxonomy.

No separate V1 family is created for science, provenance, epistemic status, ordinary UI, or interpretation prose. Those boundaries are governed in Sections 15 and 16.

## 6. Current Web inventory and evidence

The inventory was checked against the current Web repository at the 001I baseline. The most direct evidence is:

| Surface/boundary | Evidence used | Inventory implication |
| --- | --- | --- |
| Chart contracts | `packages/contracts/src/chart.ts` (`BodyFact`, `AngleFact`, `HouseCusp`, `HouseFacts`, `AspectPhaseState`, `AspectFact`, `ChartResult`) | Bodies, angles, house/cusp/system values, aspects, orb, and aspect phase are stable chart concepts |
| Canonical chart fixture | `packages/test-fixtures/src/index.ts` | Ten bodies, signs, `ASC`/`MC`, Placidus, house cusps, five aspects, orb, phase, and retrograde are current fixture evidence |
| Workspace notation | `apps/web/src/features/chart-workspace/AstrologicalNotation.tsx` | Body/sign/aspect notation, angle terms, house forms, retrograde, orb, and phase are rendered or formatted |
| Chart renderer | `apps/web/src/core/chart/ChartRenderer.tsx` | Twelve signs, body abbreviations, five aspect styles, house cusps, bodies, angles, and retrograde accessibility text are represented |
| Workspace view | `apps/web/src/features/chart-workspace/ChartWorkspaceView.tsx` | Natal Chart, Ascendant/Midheaven, houses, and major-aspect context are current; ordinary surrounding labels remain Class A |
| Birth advanced settings | `apps/web/src/features/chart-input/BirthAdvancedSettings.tsx` and `apps/web/src/features/chart-input/types.ts` | Placidus, Whole Sign, and Equal are current selectable system values |
| Calculation details | `apps/web/src/features/calculation-details/CalculationDetails.tsx` | House System and Requested House System values are represented; the surrounding labels are ordinary UI |
| Tools | `apps/web/src/lib/aspect-lookup.ts`, `apps/web/src/lib/sign-lookup.ts`, and `apps/web/src/lib/house-lookup.ts` | Five aspects, ten planets, twelve signs, four elements, three modalities, and twelve house labels are active Tool vocabulary |
| Interpretation source data | `apps/web/src/features/interpretation/interpretation-content.ts` and `deterministic-interpretation.ts` | Body/sign/aspect/house concepts provide Class C evidence; interpretation sentences are not glossary entries |
| Current Sky UI | `apps/web/src/features/public-sky/CurrentSkyInstrument.tsx` | Ten bodies, signs, five aspects, orb/phase, retrograde/direct/stationary, and `TROPICAL` are current snapshot vocabulary; surrounding “Sky highlights”/“Current aspects” labels remain Class A |
| Sky contract/fixture | `packages/contracts/src/sky.ts` and `packages/test-fixtures/src/sky.ts` | Motion, zodiac model, five aspects, and event kinds are contract/fixture evidence; event terms remain P2 until a product surface exists |
| Methodology | `apps/web/src/pages/methodology.astro` | Positions, signs, ASC/MC, houses, aspects, orb, phase, motion, and warnings are explicitly separated as Engine facts/trust-boundary evidence |
| Learn editorial evidence | `apps/web/src/content/learn/what-is-a-natal-chart.md` | Natal chart, Ascendant, Midheaven, houses, bodies/signs, aspects, orb, and phase are editorially evidenced; prose is excluded from entry extraction |

The inventory records what the Web currently represents. It does not authorize changes to any of these source files.

## 7. Canonical English terminology table

The following table is the complete set of 66 current V1 concepts. The canonical English term is the deterministic professional term for the current terminology revision. Raw code spellings, glyphs, and abbreviations are modeled separately in Section 8.

### P0 — core chart terminology (51 concepts)

| # | Semantic ID | Family | Canonical English term | Current evidence / note |
| ---: | --- | --- | --- | --- |
| 1 | `body.sun` | Celestial body | Sun | Current chart and sky body set |
| 2 | `body.moon` | Celestial body | Moon | Current chart and sky body set |
| 3 | `body.mercury` | Celestial body | Mercury | Current chart and sky body set |
| 4 | `body.venus` | Celestial body | Venus | Current chart and sky body set |
| 5 | `body.mars` | Celestial body | Mars | Current chart and sky body set |
| 6 | `body.jupiter` | Celestial body | Jupiter | Current chart and sky body set |
| 7 | `body.saturn` | Celestial body | Saturn | Current chart and sky body set |
| 8 | `body.uranus` | Celestial body | Uranus | Current chart and sky body set |
| 9 | `body.neptune` | Celestial body | Neptune | Current chart and sky body set |
| 10 | `body.pluto` | Celestial body | Pluto | Current chart and sky body set |
| 11 | `sign.aries` | Zodiac sign | Aries | Twelve-sign Web contract/Tool set |
| 12 | `sign.taurus` | Zodiac sign | Taurus | Twelve-sign Web contract/Tool set |
| 13 | `sign.gemini` | Zodiac sign | Gemini | Twelve-sign Web contract/Tool set |
| 14 | `sign.cancer` | Zodiac sign | Cancer | Twelve-sign Web contract/Tool set |
| 15 | `sign.leo` | Zodiac sign | Leo | Twelve-sign Web contract/Tool set |
| 16 | `sign.virgo` | Zodiac sign | Virgo | Twelve-sign Web contract/Tool set |
| 17 | `sign.libra` | Zodiac sign | Libra | Twelve-sign Web contract/Tool set |
| 18 | `sign.scorpio` | Zodiac sign | Scorpio | Twelve-sign Web contract/Tool set |
| 19 | `sign.sagittarius` | Zodiac sign | Sagittarius | Twelve-sign Web contract/Tool set |
| 20 | `sign.capricorn` | Zodiac sign | Capricorn | Twelve-sign Web contract/Tool set |
| 21 | `sign.aquarius` | Zodiac sign | Aquarius | Twelve-sign Web contract/Tool set |
| 22 | `sign.pisces` | Zodiac sign | Pisces | Twelve-sign Web contract/Tool set |
| 23 | `angle.ascendant` | Chart angle | Ascendant | Current angle ID/label `ASC` |
| 24 | `angle.midheaven` | Chart angle | Midheaven | Current angle ID/label `MC` |
| 25 | `house.1` | House | 1st House | Current house lookup and notation |
| 26 | `house.2` | House | 2nd House | Current house lookup and notation |
| 27 | `house.3` | House | 3rd House | Current house lookup and notation |
| 28 | `house.4` | House | 4th House | Current house lookup and notation |
| 29 | `house.5` | House | 5th House | Current house lookup and notation |
| 30 | `house.6` | House | 6th House | Current house lookup and notation |
| 31 | `house.7` | House | 7th House | Current house lookup and notation |
| 32 | `house.8` | House | 8th House | Current house lookup and notation |
| 33 | `house.9` | House | 9th House | Current house lookup and notation |
| 34 | `house.10` | House | 10th House | Current house lookup and notation |
| 35 | `house.11` | House | 11th House | Current house lookup and notation |
| 36 | `house.12` | House | 12th House | Current house lookup and notation |
| 37 | `house.cusp` | House | House cusp | Current `HouseCusp` contract and renderer |
| 38 | `house_system.placidus` | House system | Placidus | Current selectable/fixture value |
| 39 | `house_system.whole_sign` | House system | Whole Sign | Current selectable value |
| 40 | `house_system.equal` | House system | Equal House | Current raw option is `Equal`; canonical professional term is `Equal House` |
| 41 | `aspect.conjunction` | Major aspect | Conjunction | Current five-aspect set |
| 42 | `aspect.opposition` | Major aspect | Opposition | Current five-aspect set |
| 43 | `aspect.square` | Major aspect | Square | Current five-aspect set |
| 44 | `aspect.trine` | Major aspect | Trine | Current five-aspect set |
| 45 | `aspect.sextile` | Major aspect | Sextile | Current five-aspect set |
| 46 | `aspect.orb` | Aspect measurement | Orb | Current aspect result/notation |
| 47 | `aspect_phase.applying` | Aspect phase | Applying | Current `AspectPhaseState` and notation |
| 48 | `aspect_phase.exact` | Aspect phase | Exact | Current `AspectPhaseState` and notation |
| 49 | `aspect_phase.separating` | Aspect phase | Separating | Current `AspectPhaseState` and notation |
| 50 | `motion.retrograde` | Motion state | Retrograde | Current chart boolean and sky state |
| 51 | `chart_type.natal` | Chart type | Natal chart | Current Calculate/workspace/Learn product concept; not an action label |

### P1 — active supporting terminology (10 concepts)

| # | Semantic ID | Family | Canonical English term | Current evidence / note |
| ---: | --- | --- | --- | --- |
| 52 | `sign_element.fire` | Sign element | Fire | Active sign-lookup Tool term |
| 53 | `sign_element.earth` | Sign element | Earth | Active sign-lookup Tool term |
| 54 | `sign_element.air` | Sign element | Air | Active sign-lookup Tool term |
| 55 | `sign_element.water` | Sign element | Water | Active sign-lookup Tool term |
| 56 | `sign_modality.cardinal` | Sign modality | Cardinal | Active sign-lookup Tool term |
| 57 | `sign_modality.fixed` | Sign modality | Fixed | Active sign-lookup Tool term |
| 58 | `sign_modality.mutable` | Sign modality | Mutable | Active sign-lookup Tool term |
| 59 | `motion.direct` | Motion state | Direct | Current Sky three-state motion vocabulary |
| 60 | `motion.stationary` | Motion state | Stationary | Current Sky three-state motion vocabulary |
| 61 | `zodiac_model.tropical` | Zodiac model | Tropical | Current Sky astrology-facing model; raw contract value is `TROPICAL` |

### P2 — contract/fixture-backed current-sky event vocabulary (5 concepts)

These concepts are admitted as P2 inventory because the public Sky contract and/or current fixture represents them, but the current `CurrentSkyInstrument` renders a snapshot rather than an event timeline or event detail surface.

| # | Semantic ID | Family | Canonical English term | Current evidence / note |
| ---: | --- | --- | --- | --- |
| 62 | `sky_event.ingress` | Sky event | Ingress | `SkyEventType` value; no current rendered event UI |
| 63 | `sky_event.station` | Sky event | Station | `SkyEventType` value; current fixture associates a station with retrograde motion |
| 64 | `sky_event.lunation` | Sky event | Lunation | `SkyEventType` value; current fixture includes a full-moon lunation |
| 65 | `sky_event.eclipse` | Sky event | Eclipse | `SkyEventType` value; no current rendered event UI |
| 66 | `lunar_phase.full_moon` | Lunation value | Full Moon | Current fixture uses `FULL_MOON`; not a complete lunar-phase inventory |

`NEW_MOON` exists as a sibling value in the current `SkyLunationKind` contract, but no current fixture/UI evidence admits `lunar_phase.new_moon` as an individual V1 concept. First quarter and last quarter are likewise not admitted as individual glossary concepts. This is a deliberate minimal-scope decision, not a claim that those terms are professionally invalid.

## 8. Aliases, abbreviations, and display notation

Aliases are recognition/presentation forms. They MUST remain attached to the canonical semantic ID and MUST NOT create alternate concepts.

| Semantic ID or family | Canonical term | Current alias/display forms | Governance |
| --- | --- | --- | --- |
| `angle.ascendant` | Ascendant | `ASC` | `ASC` is a current contract/UI abbreviation; future locale handling requires professional review |
| `angle.midheaven` | Midheaven | `MC` | `MC` is a current contract/UI abbreviation; future locale handling requires professional review |
| `body.*` | Body canonical terms | Glyphs `☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇`; renderer abbreviations `Su/Mo/Me/Ve/Ma/Ju/Sa/Ur/Ne/Pl` | Display notation only; never a semantic ID or automatic localized alias |
| `sign.*` | Twelve sign names | Zodiac glyphs in workspace/renderer notation | Display notation only; future locale aliases require approval |
| `house.1`–`house.12` | `1st House`–`12th House` | `House 1`–`House 12`, numeric values `1`–`12`, Roman numerals `I`–`XII` | Formatting variants of the same house ID; locale selection must be deliberate |
| `house.cusp` | House cusp | Cusp | Short form only when context makes the house-cusp meaning unambiguous |
| `house_system.equal` | Equal House | Current raw option `Equal` | Raw option is not the canonical professional term; the future catalog may preserve it as a source alias |
| `chart_type.natal` | Natal chart | Birth chart | Alias requires the same chart-type meaning; it must not imply a different calculation mode |
| `aspect.*` | Five major aspect names | Glyphs `☌ ☍ □ △ ✶` | Display notation only; no glyph is a translation |
| `aspect.orb` | Orb | Degree value suffix/notation such as `orb ...°` | Degree formatting belongs to presentation/science boundaries, not a new concept |
| `aspect_phase.*` | Applying, Exact, Separating | Lowercase runtime/display spellings from current sky/notation formatting | Case and display casing are non-semantic; meaning is preserved |
| `motion.*` | Retrograde, Direct, Stationary | Lowercase/current-state spellings in Current Sky; boolean retrograde indicator in chart result | A boolean field is not a replacement taxonomy; future presentation maps it to the proper semantic concept |

Future locale catalogs MUST NOT be forced to retain English abbreviations or glyphs where local professional practice uses another form. Any localized short form or alias needs the same professional review and currentness linkage as the primary display term.

## 9. Future locale variant contract

This task freezes the shape and governance expectations for future locale variants. It does not create locale data.

Each locale variant SHOULD be addressable by at least the following fields:

| Field | Requirement |
| --- | --- |
| `semanticConceptId` | REQUIRED; references one frozen concept ID from this document |
| `locale` | REQUIRED; a supported locale identifier, with `zh-Hant` as the sole neutral Traditional Chinese locale in V1 |
| `professionalDisplayTerm` | REQUIRED for a candidate/published variant; the professionally reviewed display term |
| `shortForm` | OPTIONAL; a reviewed short form or abbreviation, not an alternate concept |
| `aliases` | OPTIONAL; reviewed recognition forms for the same concept |
| `approvalState` | REQUIRED governance state; exact implementation enum is deferred, but only `APPROVED` can publish |
| `canonicalTerminologyVersion` | REQUIRED linkage to the canonical terminology version |
| `canonicalTerminologyRevision` | REQUIRED linkage to the semantic revision against which the term was approved |
| `currentness` | REQUIRED governance state; only `CURRENT` can publish |
| `professionalEditorialNotes` | OPTIONAL; notes for reviewer rationale, usage, ambiguity, or notation constraints |

The future lookup boundary is concept-first:

```text
semanticConceptId + SupportedLocale
  -> APPROVED and CURRENT locale variant, when one exists
  -> canonical English term, otherwise
```

Runtime/UI code MUST NOT resolve official professional labels by arbitrary raw translation files, key-name guessing, or hardcoded ad hoc strings once the runtime glossary is implemented. Domain and Engine boundaries continue to emit stable IDs/values, not localized names. This document does not change those contracts.

## 10. Approval, currentness, and publishability

Approval and currentness are separate checks:

- `APPROVED` means a language-capable reviewer who understands the relevant professional astrology usage has approved the locale term for the linked canonical revision.
- `CURRENT` means the variant is still valid for the current canonical terminology meaning/revision and has not been superseded.
- A variant may be approved but `OUTDATED` after a material canonical meaning revision.
- A candidate may be `DRAFT` or `REVIEW` and remain visible to internal tooling, but it is not an official localized professional term.
- `MISSING`, `DRAFT`, `REVIEW`, and `OUTDATED` variants are nonpublishable. Exact implementation enums and storage are deferred.

The publication gate is deliberately strict:

```text
publishable localized professional term
  = approvalState == APPROVED
  AND currentness == CURRENT
```

No locale is considered complete merely because a string exists. A deterministic primary term MUST be selected for each published locale/concept pair. Competing regional or reviewer suggestions belong in review notes, not in an ambiguous runtime fallback.

## 11. Versioning semantics

Canonical terminology has both a version and a semantic revision relationship.

### Material semantic meaning revision

A change is material when it changes what the concept means, its professional scope, its relationship to another concept, or the interpretation of a value. Examples include splitting one concept into two, merging distinct concepts, redefining a term, changing whether a value is an aspect phase versus an aspect type, or changing the canonical identity of a house-system value.

For a material change:

- the canonical terminology revision MUST advance;
- affected locale variants MUST be treated as `OUTDATED` until re-reviewed;
- semantic IDs MUST be preserved only when the identity remains the same; otherwise a new ID and explicit migration decision are required;
- no automatic translation or silent relabeling is allowed.

### Non-semantic display edit

A correction to capitalization, punctuation, spacing, typographic style, or an equivalent presentation detail MAY remain on the same semantic revision when meaning is unchanged. The edit MUST still be recorded against the canonical version/revision and reviewed for its effect on locale variants.

Cosmetic edits MUST NOT be used to conceal a material terminology change. Locale approval always links to the canonical revision, not only to a string value.

## 12. Direct English fallback

The fallback order is deterministic and intentionally short:

1. request the selected supported locale;
2. use its locale variant only when it is both `APPROVED` and `CURRENT`;
3. otherwise use the canonical English term from this taxonomy.

There is no intermediate locale fallback. A missing or nonpublishable localized term MUST NOT fall through to another locale, a regional sibling, a machine translation, a browser translation, or an inferred alias.

The fallback does not alter semantic IDs, chart facts, scientific values, trust statuses, or interpretation meaning. English is the direct professional fallback, not a signal that a missing locale is complete.

## 13. Machine translation and runtime translation policy

Official professional terminology MUST NOT be produced at runtime by:

- an LLM or other generative model;
- a machine-translation API;
- an automatic translation package;
- browser translation;
- an automatic `zh-Hans` to `zh-Hant` or `zh-Hant` to `zh-Hans` conversion;
- an unreviewed string transformation or locale heuristic.

Human or otherwise explicitly accountable professional review is required before a localized professional term can become `APPROVED` and `CURRENT`. Runtime implementation is not part of 001I.

## 14. Regional, loanword, and disagreement policy

V1 defines `zh-Hant` as the sole neutral Traditional Chinese locale. V1 does not add `zh-TW`, `zh-HK`, `zh-MO`, `zh-Hans`, or other region-specific products. Regional usage differences MUST be handled through professional/editorial notes and review decisions within the supported locale model, not by silently adding locale variants.

English loanwords, transliterations, and established English professional usage MAY intentionally be preserved in a locale when that is the clearest and most correct professional choice. Translation purity is subordinate to professional correctness, semantic stability, and reader comprehension.

When reviewers disagree:

1. retain the stable semantic ID and canonical meaning;
2. record the competing proposal and rationale in review notes;
3. appoint or identify an accountable language-capable reviewer with astrology knowledge through the project’s future governance process;
4. select one deterministic primary term for publication, or keep the variant nonpublishable until the disagreement is resolved;
5. do not expose multiple unranked “official” terms in runtime UI.

No named reviewer, vendor, translation provider, or regional authority is frozen by this document.

## 15. Science and provenance boundary

Scientific, calculation, provider, and provenance metadata are not glossary concepts. They may be localized as ordinary explanatory or interface text in a future policy, but they MUST NOT be converted into astrology professional term IDs merely because they appear beside chart facts.

| Boundary category | Current examples | V1 treatment |
| --- | --- | --- |
| Numeric/geometry values | Longitude, degrees, latitude, coordinates, house cusp longitude | Science/formatting boundary; not glossary IDs |
| Time and timezone | Date/time values, UTC/instant, IANA timezone, timezone resolution method/database | Science/provenance boundary; not glossary IDs |
| Reference frame/configuration | `GEOCENTRIC`, astronomical longitude, calculation configuration | Science boundary; `GEOCENTRIC` is explicitly excluded |
| Ephemeris/provider | Ephemeris, provider, provider identity, provider version | Provenance boundary; not glossary IDs |
| Calculation/schema metadata | `engineVersion`, `schemaVersion`, `calculationStatus`, `configurationStatus`, precision | Trust/provenance boundary; not glossary IDs |
| Resolution/warnings | Resolver status, timezone status, warnings, incomplete/research metadata | Trust/epistemic/provenance boundary; not glossary IDs |
| Astrology-facing model | `TROPICAL` / Tropical | Admitted as `zodiac_model.tropical` because it is an astrology-facing model exposed by Current Sky; this exception does not admit the scientific frame `GEOCENTRIC` |

`House System` as a form label remains ordinary UI. The values `Placidus`, `Whole Sign`, and `Equal House` remain Class B because they identify professional house-system choices.

## 16. Epistemic-status boundary

The following statuses remain trust/epistemic identities and are not automatically glossary concepts:

- `CALCULATED`
- `DERIVED`
- `INTERPRETED`
- `UNKNOWN`
- `RESEARCH`
- `INCOMPLETE_RESEARCH` and similar research/incompleteness markers

Localization MUST NOT change the strength, provenance, uncertainty, or epistemic category of a result. A localized explanation of a status may be governed elsewhere, but the status itself is not an astrology terminology entry. In particular, `INTERPRETED` does not authorize extracting every concept appearing in interpretation prose, and `RESEARCH` does not become a professional term merely because it is visible in a methodology or calculation-details surface.

## 17. Current raw-English glossary locations

The following locations were inventoried as raw-English or source-value evidence. They are listed to make future implementation reviewable; no runtime source was changed for 001I.

| File | Symbols/terms observed | Role |
| --- | --- | --- |
| `apps/web/src/features/chart-workspace/AstrologicalNotation.tsx` | `PLANET_GLYPHS`, `ZODIAC_GLYPHS`, `ASPECT_LABELS`, `ASC`, `MC`, house forms, `retrograde`, orb, phase | Workspace professional notation and display evidence |
| `apps/web/src/core/chart/ChartRenderer.tsx` | `ZODIAC_SIGNS`, body abbreviations, `renderHouseCusp`, `renderBody`, `renderAngle`, aspect styles, `ASC`, `MC`, `retrograde` | Chart visual/accessible professional notation evidence |
| `apps/web/src/features/chart-workspace/ChartWorkspaceView.tsx` | `Natal Chart`, `Ascendant`, `Midheaven`, houses, `Major aspects` | Workspace terminology; surrounding product labels excluded |
| `apps/web/src/features/chart-input/BirthAdvancedSettings.tsx` | `House system`, `Placidus`, `Whole Sign`, `Equal` | System option evidence; form label is Class A |
| `apps/web/src/features/calculation-details/CalculationDetails.tsx` | `House System`, `Requested House System`, system values | Calculation-details evidence; metadata labels remain boundary terms |
| `apps/web/src/lib/aspect-lookup.ts` | five aspect options and supported planet labels | Active Tools terminology |
| `apps/web/src/lib/sign-lookup.ts` | twelve signs, `ELEMENT_MEANINGS`, `MODALITY_MEANINGS` | Active Tools terminology |
| `apps/web/src/lib/house-lookup.ts` | `1st House` through `12th House` | Active Tools terminology |
| `apps/web/src/features/public-sky/CurrentSkyInstrument.tsx` | bodies, signs, aspects, orb, phase, `retrograde`, `stationary`, `direct`, `TROPICAL` | Current Sky snapshot terminology; surrounding section labels excluded |
| `apps/web/src/features/interpretation/interpretation-content.ts` | body/sign/aspect source arrays and interpretive prose | Domain evidence; prose is Class C and excluded as entries |
| `apps/web/src/features/interpretation/deterministic-interpretation.ts` | sentences such as Ascendant/planet/house/aspect phrasing | Class C meaning evidence; no sentence-level entries |
| `apps/web/src/content/learn/what-is-a-natal-chart.md` | natal chart, Ascendant, Midheaven, houses, planets/signs, aspects, orb, phase | Editorial evidence only; prose excluded |
| `apps/web/src/pages/methodology.astro` | positions, signs, ASC/MC, houses, aspects, orb, applying/exact/separating, retrograde/direct, warnings | Trust-boundary evidence; warnings/metadata excluded |
| `packages/contracts/src/chart.ts` | body/angle/house/aspect fields and `AspectPhaseState` | Stable public chart contract values |
| `packages/contracts/src/sky.ts` | body/sign/motion/aspect/event/model enums | Stable public sky contract values |
| `packages/test-fixtures/src/index.ts` | canonical UI chart bodies, signs, angles, house system/cusps, aspects, phases, retrograde | Current canonical chart fixture evidence |
| `packages/test-fixtures/src/sky.ts` | snapshot states and event fixture values | Current sky fixture evidence; event terms remain P2 |

Raw English is evidence, not automatically authoritative terminology. Future runtime work MUST map through semantic IDs and this governance contract instead of scraping arbitrary strings.

## 18. Priority model

Priority is a delivery ordering for future glossary/localization implementation, not a statement of professional importance.

### P0 — 51 concepts

P0 contains the ten bodies, twelve signs, Ascendant, Midheaven, houses 1–12, house cusp, the three active house systems, five major aspects, orb, applying/exact/separating, retrograde, and natal chart. These are the core terms already needed to explain or render current chart/workspace/Tools/learn evidence.

### P1 — 10 concepts

P1 contains Fire/Earth/Air/Water, Cardinal/Fixed/Mutable, Direct, Stationary, and Tropical. These are current supporting Tool or Current Sky model/state terms, but they are not the entire chart-result surface.

### P2 — 5 concepts

P2 contains Ingress, Station, Lunation, Eclipse, and Full Moon. These are contract/fixture-backed current-sky event terms that require a future product surface before they should be promoted to user-facing glossary priority.

Priority MUST NOT be used to implement the next product feature automatically. It only preserves the order for a future, separately scoped localization/runtime task.

## 19. Deferred terminology

The following six individual IDs are explicitly deferred and are not part of the 66-concept V1 inventory:

| Deferred ID | Canonical English proposal | Reason for deferral |
| --- | --- | --- |
| `angle.descendant` | Descendant | No current Web contract or active surface represents this angle |
| `angle.imum_coeli` | Imum Coeli | No current Web contract or active surface represents this angle |
| `technique.transit` | Transit | No current Web product surface/contract evidence for the technique |
| `technique.profection` | Profection | No current Web product surface/contract evidence for the technique |
| `technique.synastry` | Synastry | No current Web product surface/contract evidence for the technique |
| `technique.solar_return` | Solar Return | No current Web product surface/contract evidence for the technique |

The following families are **not admitted** rather than enumerated as speculative individual deferred IDs: dignity/condition (domicile, detriment, exaltation, fall), angular/succedent/cadent classifications, sect/dispositor/reception, minor aspects, unrepresented house systems such as Koch, additional lunar-phase values, and other advanced techniques. They require concrete Web contract/product evidence and a later scope decision.

Promotion from deferred/not-admitted status requires a new task or explicit contract decision. It MUST NOT happen because a term appears in general astrology knowledge, an external provider, an Engine repository, or an unscoped future idea.

## 20. Open professional-review questions

The taxonomy is frozen for V1, but the following questions remain **REVIEW REQUIRED** before localized professional variants are authored:

1. Which accountable language-capable reviewers, with astrology knowledge, will approve terms for each supported locale? No person or vendor is named here.
2. Should `ASC` and `MC` remain unchanged in every future locale, or should a locale-specific short form be approved alongside the canonical display term?
3. Should the published English term for `house_system.equal` remain `Equal House` while preserving the current raw option `Equal` as a source alias?
4. Will Current Sky receive a user-facing event timeline/detail surface that promotes the P2 event vocabulary?
5. Which house display style—ordinal, number, Roman numeral, or a locale-specific professional convention—should be selected per supported locale?
6. Does a future localized `Tropical` term need a professional/editorial note to distinguish the astrology-facing model from scientific reference-frame metadata?
7. How should reviewer disagreement and regionally common alternatives be recorded without creating unsupported regional locale products?
8. When a future UI needs an abbreviated body, sign, aspect, angle, or house label, which forms are professionally approved for that locale rather than mechanically copied from English?

These questions do not block the V1 semantic inventory. They block publication of any future localized variant that lacks a defensible professional decision.

## 21. Consistency audit

The V1 inventory and governance contract satisfy the following checks:

| Check | Result |
| --- | --- |
| Class A ordinary UI contamination | NO |
| Class C interpretation sentence contamination | NO |
| Scientific/provenance terms mislabeled as astrology terms | NO |
| Semantic IDs depend on locale | NO |
| Aliases or glyphs create duplicate concepts | NO |
| Non-English translations authored | NO |
| Direct English fallback is deterministic | YES |
| Machine/browser translation allowed for official terms | NO |
| Region-specific locale products added | NO |
| Engine/domain/public contracts changed | NO |
| Dignity/condition/advanced techniques speculatively admitted | NO |
| Inventory matches current Web evidence | YES |
| Counts reconcile to 66 current concepts | YES |

Count reconciliation:

```text
P0 51 + P1 10 + P2 5 = 66 current concepts
deferred individual IDs = 6, excluded from the current total
```

## 22. Implementation gate and closure

This document freezes the V1 professional glossary taxonomy and governance contract only.

```text
GLOSSARY TAXONOMY FROZEN
RUNTIME GLOSSARY LOCALIZATION NOT IMPLEMENTED
```

001I MUST close without:

- a runtime glossary lookup or UI Catalog;
- locale JSON/data files or professional translations;
- changes to `SupportedLocale` or the locale preference contract;
- changes to chart/sky contracts, Engine code, providers, or scientific logic;
- tests, migrations, dependencies, or generated component libraries.

Future implementation work may use this document as the semantic and governance boundary. It MUST preserve the Engine/public API boundary, direct English fallback, `APPROVED` + `CURRENT` publication gate, and the distinction between professional terminology, ordinary UI, interpretation, science, provenance, and epistemic status.
