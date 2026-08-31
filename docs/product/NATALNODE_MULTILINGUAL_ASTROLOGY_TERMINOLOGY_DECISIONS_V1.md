# NatalNode Multilingual Astrology Terminology Decisions V1

| Field | Value |
|---|---|
| Status | **OWNER-APPROVED P0 TERMINOLOGY DECISION FREEZE** |
| Task | `WEB-LOCALIZATION-001N` |
| Baseline | `9e8049b19f52ecc2f6ba28d6febb356c2fbc5dab` (`docs: prepare astrology terminology owner review`) |
| Product source | `docs/PRD.md` |
| Scope | 51 P0 concepts × 6 target locales: `es`, `fr`, `de`, `ja`, `ko`, `zh-Hant` |
| Provider status | **PROVIDER DECISION DEFERRED** |
| Runtime status | **NOT IMPLEMENTED** |
| Output boundary | This document only; no production locale variants are created |

This document is the authoritative owner-approved decision record for the
multilingual P0 Professional Astrology Terminology benchmark. It freezes
deterministic locale decisions for later production admission; it does not
create runtime glossary data, locale catalogs, translation code, or
professional content.

The approval state in the matrix is deliberately named
`APPROVED_FOR_PRODUCTION_ADMISSION`. That means a later implementation task
may admit the decision after its own runtime contract and publication checks.
It does not mean that any localized term is already present in production
runtime.

The fixed system boundary remains:

```text
NatalNode.com
    → Website API / BFF
    → NatalNode Engine Public API
```

No decision in this document authorizes Engine work, provider selection,
astronomy calculations, timezone or place-resolution behavior, API/BFF
changes, or access to `C:\\NatalNode`. `PROVIDER DECISION DEFERRED` remains
in force.

## 1. Authoritative inputs and decision scope

The freeze was prepared against these five authoritative documents:

- `docs/product/NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`
- `docs/architecture/NATALNODE_LOCALIZATION_ARCHITECTURE_V1.md`
- `docs/product/NATALNODE_ASTROLOGY_GLOSSARY_V1.md`
- `docs/product/NATALNODE_MULTILINGUAL_ASTROLOGY_TERMINOLOGY_BENCHMARK_V1.md`
- `docs/product/NATALNODE_ASTROLOGY_TERMINOLOGY_OWNER_REVIEW_V1.md`

The owner authorization in `WEB-LOCALIZATION-001N` resolves exactly the 24
benchmark records whose adaptation mode was `REVIEW_REQUIRED`. All other
P0 records use the benchmark candidate as the batch-approved decision when
the record passed the non-review safety gate.

This is a documentation-only freeze. It does not modify the benchmark,
owner-review packet, glossary taxonomy, contracts, runtime sources, tests,
server, Engine, migrations, package metadata, or UI.

## 2. Decision and publication semantics

Each matrix row is one locale-specific presentation decision attached to one
stable language-neutral glossary concept:

- `semanticConceptId` remains the identity; localized labels, short forms,
  aliases, glyphs, and historical names remain presentation metadata.
- `approvedPrimary` is the deterministic professional display term for the
  locale.
- `shortForm` is a reviewed compact form where the benchmark supplied one.
- `aliases` contains only benchmark-supported or owner-approved recognition
  forms for the same concept.
- `glyph/notation` preserves benchmark-supported notation and never replaces
  accessible localized text.
- `latin/historicalAlias` remains a cross-reference alias, never a new ID.
- `adaptationMode` preserves the benchmark mode for batch rows; owner-
  resolved rows use the approved local register selected by this freeze.
- `bilingualFirstUse` preserves the benchmark recommendation (`yes` or
  `no`). First-use pairing is presentation guidance, not a concatenated
  semantic ID.
- `benchmarkConfidence` and `benchmarkConsensus` retain the evidence
  assessment used for the decision.
- `approvalBasis` is either `BENCHMARK_BATCH` or
  `OWNER_RESOLVED_REVIEW`.
- `decisionStatus` is `APPROVED_FOR_PRODUCTION_ADMISSION` for every P0
  row and is not a runtime publication state.

Batch approval is limited to non-review records with an evidence-grounded
candidate, high or medium benchmark confidence, no insufficient consensus,
and no invented terminology. The benchmark's non-review presentation notes
remain evidence context; the benchmark's explicit `REVIEW_REQUIRED` mode is
the review gate, and those 24 rows are the only rows resolved through owner
review.

## 3. Exact owner-resolved review decisions (24)

The following table records the owner-approved primary, short form, aliases,
adaptation mode, and bilingual-first-use guidance. The decision IDs are the
corresponding cards in the owner-review packet.

| Decision ID | Locale | semanticConceptId | Canonical English | Approved primary | Short | Approved aliases / restrictions | Adaptation mode | Bilingual first use | Decision note |
|---|---|---|---|---|---|---|---|---|---|
| SYS-ES-WS | es | house_system.whole_sign | Whole Sign | Signos enteros | Signos enteros | casas de signos enteros | NATIVE_TERM | no | Primary is the concise approved product label; the explanatory alias is retained. Do not use casas de signos completos. |
| SYS-FR-WS | fr | house_system.whole_sign | Whole Sign | Signes entiers | Signes entiers | Maison signe entier | NATIVE_TERM | no | The shorter neutral primary is approved; do not replace it with the longer alias. |
| SYS-DE-WS | de | house_system.whole_sign | Whole Sign | Ganzzeichenhäuser | Ganzzeichen | Häuser des Ganzen Zeichens | NATIVE_TERM | no | The compound technical term leads; the compact form is the short form. |
| SYS-DE-EQ | de | house_system.equal | Equal House | Äquale Häuser | Äqual | gleich große Häuser | NATIVE_TERM | no | The technical term leads; the plain-language phrase remains an alias. |
| PH-ES-APP | es | aspect_phase.applying | Applying | Aplicativo | aplic. | Applying | NATIVE_TERM | yes | Applying is the canonical English alias; do not promote aplicante. |
| PH-ES-EX | es | aspect_phase.exact | Exact | Exacto | exact. | partil | NATIVE_TERM | no | partil is a reference alias only and is not universally identical to every Exact state. |
| PH-ES-SEP | es | aspect_phase.separating | Separating | Separativo | separ. | Separating | NATIVE_TERM | yes | Separating is the canonical English alias; do not promote separante. |
| PH-FR-APP | fr | aspect_phase.applying | Applying | Appliquant | appl. | appliquante | NATIVE_TERM | yes | The masculine state-label form is the approved product register; do not make identity depend on arbitrary UI noun inflection. |
| PH-FR-EX | fr | aspect_phase.exact | Exact | Exact | exact | partile | NATIVE_TERM | no | partile is a professional reference alias only and is not a universal replacement. |
| PH-FR-SEP | fr | aspect_phase.separating | Separating | Séparant | sép. | séparante | NATIVE_TERM | yes | The masculine state-label form is the approved product register; the gendered alternative is not primary. |
| PH-DE-APP | de | aspect_phase.applying | Applying | Applikativ | appl. | applikative Phase | NATIVE_TERM | yes | The explanatory phrase is optional; the approved primary remains Applikativ. |
| PH-DE-SEP | de | aspect_phase.separating | Separating | Separativ | sep. | separative Phase | NATIVE_TERM | yes | The explanatory phrase is optional; the approved primary remains Separativ. |
| PH-JA-APP | ja | aspect_phase.applying | Applying | アプライ | app | Applying | ESTABLISHED_LOANWORD | yes | Japanese-first; bilingual first use is recommended in educational or explanatory contexts. Do not use アプライング as canonical primary. |
| PH-JA-EX | ja | aspect_phase.exact | Exact | イグザクト | exact | Exact | ESTABLISHED_LOANWORD | yes | Japanese-first; 正確なアスペクト may explain the meaning, but 正確 is not the canonical state label. |
| PH-JA-SEP | ja | aspect_phase.separating | Separating | セパレート | sep | Separating | ESTABLISHED_LOANWORD | yes | Japanese-first; bilingual first use is recommended in educational or explanatory contexts. Do not use セパレーティング as canonical primary. |
| PH-KO-APP | ko | aspect_phase.applying | Applying | 어플라잉 | app | Applying | ESTABLISHED_LOANWORD | yes | Korean-first hybrid; bilingual first use is recommended in educational contexts. Do not use 수렴 as canonical primary. |
| PH-KO-EX | ko | aspect_phase.exact | Exact | 정확 | exact | Exact/익젝트 | NATIVE_TERM | yes | Korean-first hybrid; 익젝트 is a technical alias and bilingual first use is recommended where mapping helps. |
| PH-KO-SEP | ko | aspect_phase.separating | Separating | 세퍼레이팅 | sep | Separating | ESTABLISHED_LOANWORD | yes | Korean-first hybrid; bilingual first use is recommended in educational contexts. Do not use 발산 as canonical primary. |
| PH-ZH-APP | zh-Hant | aspect_phase.applying | Applying | 入相 | 入相 | Applying | NATIVE_TERM | yes | Neutral zh-Hant; English is a canonical alias and ordinary Traditional-Chinese prose may explain the meaning. Do not use 接近相位 as primary. |
| PH-ZH-EX | zh-Hant | aspect_phase.exact | Exact | 精確 | 精確 | Exact | NATIVE_TERM | yes | Neutral zh-Hant; Exact is a technical alias. |
| PH-ZH-SEP | zh-Hant | aspect_phase.separating | Separating | 出相 | 出相 | 離相/Separating | NATIVE_TERM | yes | Neutral zh-Hant; 離相 remains an alias and Separating is the canonical English alias. |
| ANG-KO-MC | ko | angle.midheaven | Midheaven | 중천점 | MC | 미드헤븐 | NATIVE_TERM | yes | First technical use: 중천점 · MC. Dense chart notation may use MC; do not make 미드헤븐 primary. |
| ANG-ZH-MC | zh-Hant | angle.midheaven | Midheaven | 中天 | MC | 天頂 | NATIVE_TERM | yes | First technical use: 中天 · MC. 天頂 is a regional/search alias, not the canonical primary; do not collapse it with scientific zenith. |
| CUS-ZH | zh-Hant | house.cusp | House cusp | 宮頭 | 宮頭 | 宮位起點 | NATIVE_TERM | no | 宮頭 is the professional chart label; 宮位起點 is explanatory only and must not replace the primary. |

The exact owner decisions are also represented in the complete matrix below,
with `OWNER_RESOLVED_REVIEW` and the corresponding owner-review card in
`evidenceRef`. The matrix is the authoritative machine-auditable set.

## 4. Batch-approval safety audit

The benchmark and owner-review documents were audited before this freeze:

| Audit item | Result |
|---|---:|
| Benchmark P0 records | 306 |
| Benchmark rows per locale | 51 × 6 |
| Benchmark `REVIEW_REQUIRED` records | 24 |
| Owner-resolved review records | 24 |
| Non-review benchmark records batch-approved | 282 |
| Non-review low-confidence records | 0 |
| Non-review insufficient-consensus records | 0 |
| Non-review missing-candidate records | 0 |
| Duplicate locale + semanticConceptId pairs | 0 |

No low/insufficient non-review row was silently promoted. All records with
the benchmark's low/insufficient review signal are within the 24 owner-
resolved rows. No new term, semantic ID, region-specific locale, scientific
identity, or provider decision was invented.

## 5. Locale adaptation profiles and presentation invariants

### Japanese (`ja`)

Japanese professional presentation is Japanese-first:

1. established Japanese native professional term;
2. established Japanese katakana professional loanword;
3. international abbreviation or glyph;
4. bilingual first use in educational/high-risk contexts;
5. canonical English fallback only when no approved Japanese convention
   exists.

Raw full-word English is a secondary alias, not a routine P0 primary.
For the resolved phase rows, `アプライ`, `イグザクト`, and
`セパレート` are the approved dense-chart labels. The explanatory phrase
`正確なアスペクト` may be used for learning context, but `正確` is not
the canonical exact-state label.

### Korean (`ko`)

Korean professional presentation is Korean-first hybrid:

1. established Korean professional term;
2. established Korean transliteration or loanword;
3. international abbreviation or glyph;
4. bilingual first use where technically useful;
5. canonical English fallback when no approved Korean convention exists.

Raw English is selective secondary notation, never the default for core
bodies, signs, or main chart labels. The approved Midheaven display is
`중천점`, with `MC` as the international short form and `미드헤븐` as
a technical alias. The first technical presentation is `중천점 · MC`;
dense chart notation may use `MC`.

### Traditional Chinese (`zh-Hant`)

`zh-Hant` remains one neutral V1 locale:

- use genuine Traditional-Chinese professional usage;
- keep the neutral primary terms frozen here;
- retain regional alternatives as aliases where approved;
- do not perform Simplified-to-Traditional conversion;
- do not add `zh-TW`, `zh-HK`, or another regional product split.

For Midheaven, `中天` is the canonical primary, `MC` is the international
short form, and `天頂` is a regional/search alias. This alias must not
collapse astrological Midheaven with the scientific concept of zenith.

### Shared notation and display rules

- ASC and MC remain international abbreviations attached to their existing
  semantic concepts. They are not separate semantic IDs; no
  `angle.asc` or `angle.mc` is created.
- Placidus remains a proper name in every locale. It is not translated for
  symmetry; only benchmarked transliteration/aliases remain secondary.
- Benchmark-supported planet, zodiac, aspect, and retrograde glyphs, plus
  Latin/historical aliases, remain notation or cross-reference metadata.
- Bilingual first use keeps fields separate. For example, `中天` plus
  `MC` may be presented as `中天（MC）` in educational context, while
  the matrix still stores primary `中天` and short `MC`.
- Dense professional chart UI favors concise approved primary/short notation.
  Educational, Learn, and first-use contexts may pair the approved local term
  with its international or English alias when useful.
- These display rules do not change chart facts, scientific provenance,
  epistemic status, interpretation identity, cache identity, or commercial
  state.

## 6. P1/P2 and production boundary

P1 and P2 remain **NOT APPROVED BY 001N**. They are intentionally absent from
the matrix:

- P1: `sign_element.*`, `sign_modality.*`, `motion.direct`,
  `motion.stationary`, `zodiac_model.tropical`.
- P2: `sky_event.*` and `lunar_phase.full_moon`.

This decision record does not create production locale variants. It does not
authorize runtime glossary admission, catalog generation, UI changes,
machine translation, professional content publication, SEO work, or any
implementation task. Canonical English fallback remains the safe runtime
behavior for terms not yet implemented or approved in a later publication
contract.

## 7. Complete P0 decision matrix

The matrix is delimited explicitly for structural auditing. It contains
exactly 51 decisions for each of `es`, `fr`, `de`, `ja`, `ko`, and
`zh-Hant`.

<!-- P0_MATRIX_START -->

### es

| semanticConceptId | locale | canonicalEnglish | approvedPrimary | shortForm | aliases | glyph/notation | latin/historicalAlias | adaptationMode | bilingualFirstUse | benchmarkConfidence | benchmarkConsensus | approvalBasis | evidenceRef | decisionStatus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| body.sun | es | Sun | Sol | Sol | — | ☉ | Sol | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.moon | es | Moon | Luna | Luna | — | ☽ | Luna | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mercury | es | Mercury | Mercurio | Mercurio | — | ☿ | Mercurius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.venus | es | Venus | Venus | Venus | — | ♀ | Venus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mars | es | Mars | Marte | Marte | — | ♂ | Mars | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.jupiter | es | Jupiter | Júpiter | Júpiter | — | ♃ | Iuppiter | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.saturn | es | Saturn | Saturno | Saturno | — | ♄ | Saturnus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.uranus | es | Uranus | Urano | Urano | — | ♅ | Uranus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.neptune | es | Neptune | Neptuno | Neptuno | — | ♆ | Neptunus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.pluto | es | Pluto | Plutón | Plutón | — | ♇ | Pluto | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aries | es | Aries | Aries | Aries | — | ♈ | Aries | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.taurus | es | Taurus | Tauro | Tauro | — | ♉ | Taurus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.gemini | es | Gemini | Géminis | Géminis | — | ♊ | Gemini | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.cancer | es | Cancer | Cáncer | Cáncer | — | ♋ | Cancer | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.leo | es | Leo | Leo | Leo | — | ♌ | Leo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.virgo | es | Virgo | Virgo | Virgo | — | ♍ | Virgo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.libra | es | Libra | Libra | Libra | — | ♎ | Libra | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.scorpio | es | Scorpio | Escorpio | Escorpio | — | ♏ | Scorpio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.sagittarius | es | Sagittarius | Sagitario | Sagitario | — | ♐ | Sagittarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.capricorn | es | Capricorn | Capricornio | Capricornio | — | ♑ | Capricornus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aquarius | es | Aquarius | Acuario | Acuario | — | ♒ | Aquarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.pisces | es | Pisces | Piscis | Piscis | — | ♓ | Pisces | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.ascendant | es | Ascendant | Ascendente | ASC | ascendente | ASC | Ascendens | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.midheaven | es | Midheaven | Medio Cielo | MC | MC/Medium Coeli | MC | Medium Coeli | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.1 | es | 1st house | Casa 1 | Casa 1 | Casa I | I | domus I | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.2 | es | 2nd house | Casa 2 | Casa 2 | Casa II | II | domus II | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.3 | es | 3rd house | Casa 3 | Casa 3 | Casa III | III | domus III | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.4 | es | 4th house | Casa 4 | Casa 4 | Casa IV | IV | domus IV | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.5 | es | 5th house | Casa 5 | Casa 5 | Casa V | V | domus V | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.6 | es | 6th house | Casa 6 | Casa 6 | Casa VI | VI | domus VI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.7 | es | 7th house | Casa 7 | Casa 7 | Casa VII | VII | domus VII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.8 | es | 8th house | Casa 8 | Casa 8 | Casa VIII | VIII | domus VIII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.9 | es | 9th house | Casa 9 | Casa 9 | Casa IX | IX | domus IX | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.10 | es | 10th house | Casa 10 | Casa 10 | Casa X | X | domus X | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.11 | es | 11th house | Casa 11 | Casa 11 | Casa XI | XI | domus XI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.12 | es | 12th house | Casa 12 | Casa 12 | Casa XII | XII | domus XII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.cusp | es | House cusp | cúspide de la casa | cúspide | cúspide | cusp | cuspis domus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.placidus | es | Placidus | Placidus | Placidus | sistema Placidus | Placidus | Placidus | PROPER_NAME_RETAINED | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.whole_sign | es | Whole Sign | Signos enteros | Signos enteros | casas de signos enteros | WSH | domus signorum integrorum | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ES-AS/S-EN-CA-WHOLE; OWNER_REVIEW:SYS-ES-WS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.equal | es | Equal House | casas iguales | Iguales | casas de igual tamaño | EH | domus aequales | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.conjunction | es | Conjunction | Conjunción | Conj. | — | ☌ | conjunctio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.opposition | es | Opposition | Oposición | Opos. | — | ☍ | oppositio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.square | es | Square | Cuadratura | Cuad. | cuadrado | □ | quadratura | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.trine | es | Trine | Trígono | Trig. | — | △ | trigonum | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.sextile | es | Sextile | Sextil | Sext. | — | ✶ | sextile | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.orb | es | Orb | Orbe | Orbe | orbe de aplicación | °/orb | orbis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.applying | es | Applying | Aplicativo | aplic. | Applying | app | applicans | NATIVE_TERM | yes | low | split | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS; OWNER_REVIEW:PH-ES-APP | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.exact | es | Exact | Exacto | exact. | partil | exact | exactus | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS; OWNER_REVIEW:PH-ES-EX | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.separating | es | Separating | Separativo | separ. | Separating | sep | separans | NATIVE_TERM | yes | low | split | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ES-AS/S-EN-CA-GLOSS; OWNER_REVIEW:PH-ES-SEP | APPROVED_FOR_PRODUCTION_ADMISSION |
| motion.retrograde | es | Retrograde | Retrógrado | Rx/℞ | movimiento retrógrado | ℞ | retrogradus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| chart_type.natal | es | Natal chart | carta natal | natal | carta astral/horóscopo natal | natal | horoscopus natalis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ES-AS/S-ES-AS-UI/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |

### fr

| semanticConceptId | locale | canonicalEnglish | approvedPrimary | shortForm | aliases | glyph/notation | latin/historicalAlias | adaptationMode | bilingualFirstUse | benchmarkConfidence | benchmarkConsensus | approvalBasis | evidenceRef | decisionStatus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| body.sun | fr | Sun | Soleil | Soleil | — | ☉ | Sol | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.moon | fr | Moon | Lune | Lune | — | ☽ | Luna | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mercury | fr | Mercury | Mercure | Mercure | — | ☿ | Mercurius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.venus | fr | Venus | Vénus | Vénus | — | ♀ | Venus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mars | fr | Mars | Mars | Mars | — | ♂ | Mars | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.jupiter | fr | Jupiter | Jupiter | Jupiter | — | ♃ | Iuppiter | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.saturn | fr | Saturn | Saturne | Saturne | — | ♄ | Saturnus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.uranus | fr | Uranus | Uranus | Uranus | — | ♅ | Uranus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.neptune | fr | Neptune | Neptune | Neptune | — | ♆ | Neptunus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.pluto | fr | Pluto | Pluton | Pluton | — | ♇ | Pluto | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aries | fr | Aries | Bélier | Bélier | — | ♈ | Aries | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.taurus | fr | Taurus | Taureau | Taureau | — | ♉ | Taurus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.gemini | fr | Gemini | Gémeaux | Gémeaux | — | ♊ | Gemini | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.cancer | fr | Cancer | Cancer | Cancer | — | ♋ | Cancer | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.leo | fr | Leo | Lion | Lion | — | ♌ | Leo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.virgo | fr | Virgo | Vierge | Vierge | — | ♍ | Virgo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.libra | fr | Libra | Balance | Balance | — | ♎ | Libra | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.scorpio | fr | Scorpio | Scorpion | Scorpion | — | ♏ | Scorpio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.sagittarius | fr | Sagittarius | Sagittaire | Sagittaire | — | ♐ | Sagittarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.capricorn | fr | Capricorn | Capricorne | Capricorne | — | ♑ | Capricornus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aquarius | fr | Aquarius | Verseau | Verseau | — | ♒ | Aquarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.pisces | fr | Pisces | Poissons | Poissons | — | ♓ | Pisces | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.ascendant | fr | Ascendant | Ascendant | ASC | ASC | ASC | Ascendens | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.midheaven | fr | Midheaven | Milieu du Ciel | MC | Medium Coeli | MC | Medium Coeli | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.1 | fr | 1st house | Maison 1 | Maison 1 | Maison I | I | domus I | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.2 | fr | 2nd house | Maison 2 | Maison 2 | Maison II | II | domus II | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.3 | fr | 3rd house | Maison 3 | Maison 3 | Maison III | III | domus III | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.4 | fr | 4th house | Maison 4 | Maison 4 | Maison IV | IV | domus IV | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.5 | fr | 5th house | Maison 5 | Maison 5 | Maison V | V | domus V | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.6 | fr | 6th house | Maison 6 | Maison 6 | Maison VI | VI | domus VI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.7 | fr | 7th house | Maison 7 | Maison 7 | Maison VII | VII | domus VII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.8 | fr | 8th house | Maison 8 | Maison 8 | Maison VIII | VIII | domus VIII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.9 | fr | 9th house | Maison 9 | Maison 9 | Maison IX | IX | domus IX | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.10 | fr | 10th house | Maison 10 | Maison 10 | Maison X | X | domus X | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.11 | fr | 11th house | Maison 11 | Maison 11 | Maison XI | XI | domus XI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.12 | fr | 12th house | Maison 12 | Maison 12 | Maison XII | XII | domus XII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.cusp | fr | House cusp | cuspide | cuspide | pointe de maison | cusp | cuspis domus | NATIVE_TERM | no | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.placidus | fr | Placidus | Placidus | Placidus | système Placidus | Placidus | Placidus | PROPER_NAME_RETAINED | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.whole_sign | fr | Whole Sign | Signes entiers | Signes entiers | Maison signe entier | WSH | domus signorum integrorum | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-WHOLE; OWNER_REVIEW:SYS-FR-WS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.equal | fr | Equal House | Maisons égales | Maisons égales | maisons equal | EH | domus aequales | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.conjunction | fr | Conjunction | Conjonction | Conj. | — | ☌ | conjunctio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-PHASE/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.opposition | fr | Opposition | Opposition | Opp. | — | ☍ | oppositio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-PHASE/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.square | fr | Square | Carré | Carré | quadrature | □ | quadratura | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-PHASE/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.trine | fr | Trine | Trigone | Trig. | — | △ | trigonum | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-PHASE/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.sextile | fr | Sextile | Sextile | Sext. | — | ✶ | sextile | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-PHASE/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.orb | fr | Orb | Orbe | Orbe | orbe d'application | °/orb | orbis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-FR-AT-PHASE/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.applying | fr | Applying | Appliquant | appl. | appliquante | app | applicans | NATIVE_TERM | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-FR-AT-PHASE/S-EN-CA-GLOSS; OWNER_REVIEW:PH-FR-APP | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.exact | fr | Exact | Exact | exact | partile | exact | exactus | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-FR-AT-PHASE/S-EN-CA-GLOSS; OWNER_REVIEW:PH-FR-EX | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.separating | fr | Separating | Séparant | sép. | séparante | sep | separans | NATIVE_TERM | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-FR-AT-PHASE/S-EN-CA-GLOSS; OWNER_REVIEW:PH-FR-SEP | APPROVED_FOR_PRODUCTION_ADMISSION |
| motion.retrograde | fr | Retrograde | Rétrograde | Rx/℞ | mouvement rétrograde | ℞ | retrogradus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| chart_type.natal | fr | Natal chart | Thème natal | natal | thème astral/horoscope de naissance | natal | horoscopus natalis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-FR-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |

### de

| semanticConceptId | locale | canonicalEnglish | approvedPrimary | shortForm | aliases | glyph/notation | latin/historicalAlias | adaptationMode | bilingualFirstUse | benchmarkConfidence | benchmarkConsensus | approvalBasis | evidenceRef | decisionStatus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| body.sun | de | Sun | Sonne | Sonne | — | ☉ | Sol | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.moon | de | Moon | Mond | Mond | — | ☽ | Luna | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mercury | de | Mercury | Merkur | Merkur | — | ☿ | Mercurius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.venus | de | Venus | Venus | Venus | — | ♀ | Venus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mars | de | Mars | Mars | Mars | — | ♂ | Mars | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.jupiter | de | Jupiter | Jupiter | Jupiter | — | ♃ | Iuppiter | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.saturn | de | Saturn | Saturn | Saturn | — | ♄ | Saturnus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.uranus | de | Uranus | Uranus | Uranus | — | ♅ | Uranus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.neptune | de | Neptune | Neptun | Neptun | — | ♆ | Neptunus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.pluto | de | Pluto | Pluto | Pluto | — | ♇ | Pluto | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aries | de | Aries | Widder | Widder | — | ♈ | Aries | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.taurus | de | Taurus | Stier | Stier | — | ♉ | Taurus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.gemini | de | Gemini | Zwillinge | Zwillinge | — | ♊ | Gemini | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.cancer | de | Cancer | Krebs | Krebs | — | ♋ | Cancer | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.leo | de | Leo | Löwe | Löwe | — | ♌ | Leo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.virgo | de | Virgo | Jungfrau | Jungfrau | — | ♍ | Virgo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.libra | de | Libra | Waage | Waage | — | ♎ | Libra | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.scorpio | de | Scorpio | Skorpion | Skorpion | — | ♏ | Scorpio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.sagittarius | de | Sagittarius | Schütze | Schütze | — | ♐ | Sagittarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.capricorn | de | Capricorn | Steinbock | Steinbock | — | ♑ | Capricornus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aquarius | de | Aquarius | Wassermann | Wassermann | — | ♒ | Aquarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.pisces | de | Pisces | Fische | Fische | — | ♓ | Pisces | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.ascendant | de | Ascendant | Aszendent | AC | ASC/AS/Asc | ASC | Ascendens | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.midheaven | de | Midheaven | Medium Coeli | MC | Himmelsmitte | MC | Medium Coeli | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.1 | de | 1st house | 1. Haus | 1. Haus | Haus I | I | domus I | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.2 | de | 2nd house | 2. Haus | 2. Haus | Haus II | II | domus II | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.3 | de | 3rd house | 3. Haus | 3. Haus | Haus III | III | domus III | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.4 | de | 4th house | 4. Haus | 4. Haus | Haus IV | IV | domus IV | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.5 | de | 5th house | 5. Haus | 5. Haus | Haus V | V | domus V | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.6 | de | 6th house | 6. Haus | 6. Haus | Haus VI | VI | domus VI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.7 | de | 7th house | 7. Haus | 7. Haus | Haus VII | VII | domus VII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.8 | de | 8th house | 8. Haus | 8. Haus | Haus VIII | VIII | domus VIII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.9 | de | 9th house | 9. Haus | 9. Haus | Haus IX | IX | domus IX | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.10 | de | 10th house | 10. Haus | 10. Haus | Haus X | X | domus X | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.11 | de | 11th house | 11. Haus | 11. Haus | Haus XI | XI | domus XI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.12 | de | 12th house | 12. Haus | 12. Haus | Haus XII | XII | domus XII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.cusp | de | House cusp | Häuserspitze | Spitze | Hausspitze | cusp | cuspis domus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.placidus | de | Placidus | Placidus | Placidus | Placidus-System | Placidus | Placidus | PROPER_NAME_RETAINED | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.whole_sign | de | Whole Sign | Ganzzeichenhäuser | Ganzzeichen | Häuser des Ganzen Zeichens | WSH | domus signorum integrorum | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-DE-AS/S-EN-CA-WHOLE; OWNER_REVIEW:SYS-DE-WS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.equal | de | Equal House | Äquale Häuser | Äqual | gleich große Häuser | EH | domus aequales | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-DE-AS/S-EN-CA-WHOLE; OWNER_REVIEW:SYS-DE-EQ | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.conjunction | de | Conjunction | Konjunktion | Konj. | — | ☌ | conjunctio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.opposition | de | Opposition | Opposition | Opp. | — | ☍ | oppositio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.square | de | Square | Quadrat | Quadr. | — | □ | quadratura | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.trine | de | Trine | Trigon | Trig. | — | △ | trigonum | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.sextile | de | Sextile | Sextil | Sext. | — | ✶ | sextile | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.orb | de | Orb | Orbis | Orbis | Orb | °/orb | orbis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.applying | de | Applying | Applikativ | appl. | applikative Phase | app | applicans | NATIVE_TERM | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS; OWNER_REVIEW:PH-DE-APP | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.exact | de | Exact | Exakt | exakt | genau | exact | exactus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.separating | de | Separating | Separativ | sep. | separative Phase | sep | separans | NATIVE_TERM | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS; OWNER_REVIEW:PH-DE-SEP | APPROVED_FOR_PRODUCTION_ADMISSION |
| motion.retrograde | de | Retrograde | Rückläufig | Rx/℞ | rückläufige Bewegung | ℞ | retrogradus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| chart_type.natal | de | Natal chart | Geburtshoroskop | Radix | Radix/Natalhoroskop | natal | horoscopus natalis | NATIVE_TERM | no | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-DE-AS/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |

### ja

| semanticConceptId | locale | canonicalEnglish | approvedPrimary | shortForm | aliases | glyph/notation | latin/historicalAlias | adaptationMode | bilingualFirstUse | benchmarkConfidence | benchmarkConsensus | approvalBasis | evidenceRef | decisionStatus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| body.sun | ja | Sun | 太陽 | 太陽 | Sun | ☉ | Sol | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.moon | ja | Moon | 月 | 月 | Moon | ☽ | Luna | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mercury | ja | Mercury | 水星 | 水星 | Mercury | ☿ | Mercurius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.venus | ja | Venus | 金星 | 金星 | Venus | ♀ | Venus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mars | ja | Mars | 火星 | 火星 | Mars | ♂ | Mars | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.jupiter | ja | Jupiter | 木星 | 木星 | Jupiter | ♃ | Iuppiter | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.saturn | ja | Saturn | 土星 | 土星 | Saturn | ♄ | Saturnus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.uranus | ja | Uranus | 天王星 | 天王星 | Uranus | ♅ | Uranus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.neptune | ja | Neptune | 海王星 | 海王星 | Neptune | ♆ | Neptunus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.pluto | ja | Pluto | 冥王星 | 冥王星 | Pluto | ♇ | Pluto | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aries | ja | Aries | 牡羊座 | 牡羊座 | Aries | ♈ | Aries | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.taurus | ja | Taurus | 牡牛座 | 牡牛座 | Taurus | ♉ | Taurus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.gemini | ja | Gemini | 双子座 | 双子座 | Gemini | ♊ | Gemini | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.cancer | ja | Cancer | 蟹座 | 蟹座 | Cancer | ♋ | Cancer | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.leo | ja | Leo | 獅子座 | 獅子座 | Leo | ♌ | Leo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.virgo | ja | Virgo | 乙女座 | 乙女座 | Virgo | ♍ | Virgo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.libra | ja | Libra | 天秤座 | 天秤座 | Libra | ♎ | Libra | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.scorpio | ja | Scorpio | 蠍座 | 蠍座 | Scorpio | ♏ | Scorpio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.sagittarius | ja | Sagittarius | 射手座 | 射手座 | Sagittarius | ♐ | Sagittarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.capricorn | ja | Capricorn | 山羊座 | 山羊座 | Capricorn | ♑ | Capricornus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aquarius | ja | Aquarius | 水瓶座 | 水瓶座 | Aquarius | ♒ | Aquarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.pisces | ja | Pisces | 魚座 | 魚座 | Pisces | ♓ | Pisces | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.ascendant | ja | Ascendant | アセンダント | ASC | 上昇点 | ASC | Ascendens | ESTABLISHED_LOANWORD | yes | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-AK/S-JA-PEARL/S-JA-LOCAL/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.midheaven | ja | Midheaven | ミッドヘブン | MC | メディウム・コエリ/MC | MC | Medium Coeli | ESTABLISHED_LOANWORD | yes | medium | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-AK/S-JA-PEARL/S-JA-LOCAL/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.1 | ja | 1st house | 1ハウス | 1H | 1室 | I | domus I | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.2 | ja | 2nd house | 2ハウス | 2H | 2室 | II | domus II | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.3 | ja | 3rd house | 3ハウス | 3H | 3室 | III | domus III | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.4 | ja | 4th house | 4ハウス | 4H | 4室 | IV | domus IV | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.5 | ja | 5th house | 5ハウス | 5H | 5室 | V | domus V | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.6 | ja | 6th house | 6ハウス | 6H | 6室 | VI | domus VI | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.7 | ja | 7th house | 7ハウス | 7H | 7室 | VII | domus VII | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.8 | ja | 8th house | 8ハウス | 8H | 8室 | VIII | domus VIII | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.9 | ja | 9th house | 9ハウス | 9H | 9室 | IX | domus IX | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.10 | ja | 10th house | 10ハウス | 10H | 10室 | X | domus X | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.11 | ja | 11th house | 11ハウス | 11H | 11室 | XI | domus XI | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.12 | ja | 12th house | 12ハウス | 12H | 12室 | XII | domus XII | ESTABLISHED_LOANWORD | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.cusp | ja | House cusp | カスプ | カスプ | ハウスカスプ | cusp | cuspis domus | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HOSHI/S-JA-PEARL/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.placidus | ja | Placidus | プラシーダス | Placidus | Placidus/プラシーダス式 | Placidus | Placidus | TRANSLITERATION_STANDARD | yes | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-AK/S-JA-HOSHI/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.whole_sign | ja | Whole Sign | ホールサインハウス | ホールサイン | Whole Sign/ホールサイン | WSH | domus signorum integrorum | ESTABLISHED_LOANWORD | yes | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-AK/S-JA-HOSHI/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.equal | ja | Equal House | イコールハウス | イコール | Equal House/イコール | EH | domus aequales | ESTABLISHED_LOANWORD | yes | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-AK/S-JA-HOSHI/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.conjunction | ja | Conjunction | コンジャンクション | コンジャ. | 合 | ☌ | conjunctio | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.opposition | ja | Opposition | オポジション | オポ | 衝 | ☍ | oppositio | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.square | ja | Square | スクエア | スクエア | 矩 | □ | quadratura | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.trine | ja | Trine | トライン | トライン | 三分 | △ | trigonum | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.sextile | ja | Sextile | セクスタイル | セクスタ | 六分 | ✶ | sextile | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-HEX/S-JA-LOCAL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.orb | ja | Orb | オーブ | orb | 許容度 | °/orb | orbis | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-HEX/S-JA-LOCAL/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.applying | ja | Applying | アプライ | app | Applying | app | applicans | ESTABLISHED_LOANWORD | yes | low | insufficient | OWNER_RESOLVED_REVIEW | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLOSS; OWNER_REVIEW:PH-JA-APP | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.exact | ja | Exact | イグザクト | exact | Exact | exact | exactus | ESTABLISHED_LOANWORD | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLOSS; OWNER_REVIEW:PH-JA-EX | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.separating | ja | Separating | セパレート | sep | Separating | sep | separans | ESTABLISHED_LOANWORD | yes | low | insufficient | OWNER_RESOLVED_REVIEW | BENCHMARK:S-JA-AS/S-JA-LOCAL/S-EN-CA-GLOSS; OWNER_REVIEW:PH-JA-SEP | APPROVED_FOR_PRODUCTION_ADMISSION |
| motion.retrograde | ja | Retrograde | 逆行 | ℞ | レトログレード | ℞ | retrogradus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-PEARL/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| chart_type.natal | ja | Natal chart | 出生図 | ネイタル | ネイタルチャート/出生ホロスコープ | natal | horoscopus natalis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-JA-AS/S-JA-AK/S-JA-HEX/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |

### ko

| semanticConceptId | locale | canonicalEnglish | approvedPrimary | shortForm | aliases | glyph/notation | latin/historicalAlias | adaptationMode | bilingualFirstUse | benchmarkConfidence | benchmarkConsensus | approvalBasis | evidenceRef | decisionStatus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| body.sun | ko | Sun | 태양 | 태양 | Sun | ☉ | Sol | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.moon | ko | Moon | 달 | 달 | Moon | ☽ | Luna | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mercury | ko | Mercury | 수성 | 수성 | Mercury | ☿ | Mercurius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.venus | ko | Venus | 금성 | 금성 | Venus | ♀ | Venus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mars | ko | Mars | 화성 | 화성 | Mars | ♂ | Mars | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.jupiter | ko | Jupiter | 목성 | 목성 | Jupiter | ♃ | Iuppiter | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.saturn | ko | Saturn | 토성 | 토성 | Saturn | ♄ | Saturnus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.uranus | ko | Uranus | 천왕성 | 천왕성 | Uranus | ♅ | Uranus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.neptune | ko | Neptune | 해왕성 | 해왕성 | Neptune | ♆ | Neptunus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.pluto | ko | Pluto | 명왕성 | 명왕성 | Pluto | ♇ | Pluto | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-KA/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aries | ko | Aries | 양자리 | 양자리 | Aries | ♈ | Aries | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-KO-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.taurus | ko | Taurus | 황소자리 | 황소자리 | Taurus | ♉ | Taurus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-KO-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.gemini | ko | Gemini | 쌍둥이자리 | 쌍둥이자리 | Gemini | ♊ | Gemini | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.cancer | ko | Cancer | 게자리 | 게자리 | Cancer | ♋ | Cancer | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.leo | ko | Leo | 사자자리 | 사자자리 | Leo | ♌ | Leo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.virgo | ko | Virgo | 처녀자리 | 처녀자리 | Virgo | ♍ | Virgo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.libra | ko | Libra | 천칭자리 | 천칭자리 | Libra | ♎ | Libra | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.scorpio | ko | Scorpio | 전갈자리 | 전갈자리 | Scorpio | ♏ | Scorpio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.sagittarius | ko | Sagittarius | 궁수자리 | 궁수자리 | Sagittarius | ♐ | Sagittarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-KO-AS/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.capricorn | ko | Capricorn | 염소자리 | 염소자리 | Capricorn | ♑ | Capricornus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aquarius | ko | Aquarius | 물병자리 | 물병자리 | Aquarius | ♒ | Aquarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.pisces | ko | Pisces | 물고기자리 | 물고기자리 | Pisces | ♓ | Pisces | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.ascendant | ko | Ascendant | 상승점 | ASC | 어센던트/상승궁 | ASC | Ascendens | NATIVE_TERM | yes | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-PRO/S-KO-KA/S-KO-BY/S-KO-ATUM/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.midheaven | ko | Midheaven | 중천점 | MC | 미드헤븐 | MC | Medium Coeli | NATIVE_TERM | yes | medium | split | OWNER_RESOLVED_REVIEW | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-EN-CA-GLOSS; OWNER_REVIEW:ANG-KO-MC | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.1 | ko | 1st house | 1하우스 | 1H | 제1하우스 | I | domus I | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.2 | ko | 2nd house | 2하우스 | 2H | 제2하우스 | II | domus II | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.3 | ko | 3rd house | 3하우스 | 3H | 제3하우스 | III | domus III | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.4 | ko | 4th house | 4하우스 | 4H | 제4하우스 | IV | domus IV | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.5 | ko | 5th house | 5하우스 | 5H | 제5하우스 | V | domus V | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.6 | ko | 6th house | 6하우스 | 6H | 제6하우스 | VI | domus VI | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.7 | ko | 7th house | 7하우스 | 7H | 제7하우스 | VII | domus VII | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.8 | ko | 8th house | 8하우스 | 8H | 제8하우스 | VIII | domus VIII | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.9 | ko | 9th house | 9하우스 | 9H | 제9하우스 | IX | domus IX | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.10 | ko | 10th house | 10하우스 | 10H | 제10하우스 | X | domus X | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.11 | ko | 11th house | 11하우스 | 11H | 제11하우스 | XI | domus XI | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.12 | ko | 12th house | 12하우스 | 12H | 제12하우스 | XII | domus XII | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.cusp | ko | House cusp | 하우스 커스프 | 커스프 | 커스프 | cusp | cuspis domus | ESTABLISHED_LOANWORD | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-BY/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.placidus | ko | Placidus | 플라시두스 | Placidus | 플라시두스 하우스 | Placidus | Placidus | TRANSLITERATION_STANDARD | yes | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-AWAY/S-KO-ESKY/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.whole_sign | ko | Whole Sign | 홀사인 하우스 | 홀사인 | Whole Sign | WSH | domus signorum integrorum | ESTABLISHED_LOANWORD | yes | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.equal | ko | Equal House | 이퀄 하우스 | 이퀄 | Equal House | EH | domus aequales | ESTABLISHED_LOANWORD | yes | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-ESKY/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.conjunction | ko | Conjunction | 합 | 합 | 컨정션/콘정션 | ☌ | conjunctio | MIXED_PROFESSIONAL_USAGE | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.opposition | ko | Opposition | 충 | 충 | 오포지션 | ☍ | oppositio | MIXED_PROFESSIONAL_USAGE | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.square | ko | Square | 사각 | 사각 | 스퀘어 | □ | quadratura | MIXED_PROFESSIONAL_USAGE | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.trine | ko | Trine | 삼각 | 삼각 | 트라인 | △ | trigonum | MIXED_PROFESSIONAL_USAGE | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.sextile | ko | Sextile | 육각 | 육각 | 섹스타일 | ✶ | sextile | MIXED_PROFESSIONAL_USAGE | no | high | split | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-KA/S-KO-ESKY/S-KO-ATUM/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.orb | ko | Orb | 오브 | orb | 오비스 | °/orb | orbis | ESTABLISHED_LOANWORD | yes | medium | split | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-PRO/S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.applying | ko | Applying | 어플라잉 | app | Applying | app | applicans | ESTABLISHED_LOANWORD | yes | low | insufficient | OWNER_RESOLVED_REVIEW | BENCHMARK:S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS; OWNER_REVIEW:PH-KO-APP | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.exact | ko | Exact | 정확 | exact | Exact/익젝트 | exact | exactus | NATIVE_TERM | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS; OWNER_REVIEW:PH-KO-EX | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.separating | ko | Separating | 세퍼레이팅 | sep | Separating | sep | separans | ESTABLISHED_LOANWORD | yes | low | insufficient | OWNER_RESOLVED_REVIEW | BENCHMARK:S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS; OWNER_REVIEW:PH-KO-SEP | APPROVED_FOR_PRODUCTION_ADMISSION |
| motion.retrograde | ko | Retrograde | 역행 | ℞ | 역행 운동 | ℞ | retrogradus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-BY/S-KO-ESKY/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| chart_type.natal | ko | Natal chart | 출생 차트 | 네이탈 | 네이탈 차트/출생 차트 | natal | horoscopus natalis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-KO-AS/S-KO-PRO/S-KO-BY/S-KO-KA/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |

### zh-Hant

| semanticConceptId | locale | canonicalEnglish | approvedPrimary | shortForm | aliases | glyph/notation | latin/historicalAlias | adaptationMode | bilingualFirstUse | benchmarkConfidence | benchmarkConsensus | approvalBasis | evidenceRef | decisionStatus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| body.sun | zh-Hant | Sun | 太陽 | 太陽 | Sun | ☉ | Sol | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.moon | zh-Hant | Moon | 月亮 | 月亮 | 月 | ☽ | Luna | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mercury | zh-Hant | Mercury | 水星 | 水星 | Mercury | ☿ | Mercurius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.venus | zh-Hant | Venus | 金星 | 金星 | Venus | ♀ | Venus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.mars | zh-Hant | Mars | 火星 | 火星 | Mars | ♂ | Mars | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.jupiter | zh-Hant | Jupiter | 木星 | 木星 | Jupiter | ♃ | Iuppiter | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.saturn | zh-Hant | Saturn | 土星 | 土星 | Saturn | ♄ | Saturnus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.uranus | zh-Hant | Uranus | 天王星 | 天王星 | Uranus | ♅ | Uranus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.neptune | zh-Hant | Neptune | 海王星 | 海王星 | Neptune | ♆ | Neptunus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| body.pluto | zh-Hant | Pluto | 冥王星 | 冥王星 | Pluto | ♇ | Pluto | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aries | zh-Hant | Aries | 牡羊座 | 牡羊座 | Aries | ♈ | Aries | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.taurus | zh-Hant | Taurus | 金牛座 | 金牛座 | Taurus | ♉ | Taurus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.gemini | zh-Hant | Gemini | 雙子座 | 雙子座 | Gemini | ♊ | Gemini | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.cancer | zh-Hant | Cancer | 巨蟹座 | 巨蟹座 | Cancer | ♋ | Cancer | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.leo | zh-Hant | Leo | 獅子座 | 獅子座 | Leo | ♌ | Leo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.virgo | zh-Hant | Virgo | 處女座 | 處女座 | Virgo | ♍ | Virgo | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.libra | zh-Hant | Libra | 天秤座 | 天秤座 | Libra | ♎ | Libra | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.scorpio | zh-Hant | Scorpio | 天蠍座 | 天蠍座 | Scorpio | ♏ | Scorpio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.sagittarius | zh-Hant | Sagittarius | 射手座 | 射手座 | Sagittarius | ♐ | Sagittarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.capricorn | zh-Hant | Capricorn | 摩羯座 | 摩羯座 | Capricorn | ♑ | Capricornus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.aquarius | zh-Hant | Aquarius | 水瓶座 | 水瓶座 | Aquarius | ♒ | Aquarius | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| sign.pisces | zh-Hant | Pisces | 雙魚座 | 雙魚座 | Pisces | ♓ | Pisces | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-NEWTON/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.ascendant | zh-Hant | Ascendant | 上升點 | ASC | 上升 | ASC | Ascendens | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-XINYI/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| angle.midheaven | zh-Hant | Midheaven | 中天 | MC | 天頂 | MC | Medium Coeli | NATIVE_TERM | yes | medium | split | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ZH-XINYI/S-ZH-DAYBREAK/S-EN-CA-GLOSS; OWNER_REVIEW:ANG-ZH-MC | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.1 | zh-Hant | 1st house | 第1宮 | 1宮 | 第一宮 | I | domus I | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-DAYBREAK/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.2 | zh-Hant | 2nd house | 第2宮 | 2宮 | 第二宮 | II | domus II | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.3 | zh-Hant | 3rd house | 第3宮 | 3宮 | 第三宮 | III | domus III | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.4 | zh-Hant | 4th house | 第4宮 | 4宮 | 第四宮 | IV | domus IV | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.5 | zh-Hant | 5th house | 第5宮 | 5宮 | 第五宮 | V | domus V | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.6 | zh-Hant | 6th house | 第6宮 | 6宮 | 第六宮 | VI | domus VI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.7 | zh-Hant | 7th house | 第7宮 | 7宮 | 第七宮 | VII | domus VII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.8 | zh-Hant | 8th house | 第8宮 | 8宮 | 第八宮 | VIII | domus VIII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.9 | zh-Hant | 9th house | 第9宮 | 9宮 | 第九宮 | IX | domus IX | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.10 | zh-Hant | 10th house | 第10宮 | 10宮 | 第十宮 | X | domus X | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.11 | zh-Hant | 11th house | 第11宮 | 11宮 | 第十一宮 | XI | domus XI | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.12 | zh-Hant | 12th house | 第12宮 | 12宮 | 第十二宮 | XII | domus XII | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-EN-CA-HOUSE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house.cusp | zh-Hant | House cusp | 宮頭 | 宮頭 | 宮位起點 | cusp | cuspis domus | NATIVE_TERM | no | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ZH-XPT/S-ZH-DAYBREAK/S-EN-CA-GLOSS; OWNER_REVIEW:CUS-ZH | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.placidus | zh-Hant | Placidus | 普拉西德制 | 普拉西德 | 普拉西度/Placidus | Placidus | Placidus | TRANSLITERATION_STANDARD | yes | medium | split | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-DAYBREAK/S-ZH-DCARD/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.whole_sign | zh-Hant | Whole Sign | 整宮制 | 整宮 | 整個星座宮制/Whole Sign | WSH | domus signorum integrorum | NATIVE_TERM | yes | medium | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-DAYBREAK/S-ZH-DCARD/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| house_system.equal | zh-Hant | Equal House | 等宮制 | 等宮 | 等宮位制/Equal House | EH | domus aequales | NATIVE_TERM | yes | medium | moderate | BENCHMARK_BATCH | BENCHMARK:S-ZH-DAYBREAK/S-EN-CA-WHOLE | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.conjunction | zh-Hant | Conjunction | 合相 | 合 | 合 | ☌ | conjunctio | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-XINYI/S-ZH-WIKI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.opposition | zh-Hant | Opposition | 對分相 | 對分 | 對沖 | ☍ | oppositio | NATIVE_TERM | no | medium | split | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-XINYI/S-ZH-WIKI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.square | zh-Hant | Square | 四分相 | 四分 | 刑相 | □ | quadratura | NATIVE_TERM | no | medium | split | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-XINYI/S-ZH-WIKI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.trine | zh-Hant | Trine | 三分相 | 三分 | 拱相 | △ | trigonum | NATIVE_TERM | no | medium | split | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-XINYI/S-ZH-WIKI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.sextile | zh-Hant | Sextile | 六分相 | 六分 | 六合 | ✶ | sextile | NATIVE_TERM | no | medium | split | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-XINYI/S-ZH-WIKI/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect.orb | zh-Hant | Orb | 容許度 | 容許度 | 容許範圍/orb | °/orb | orbis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-WIKI/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.applying | zh-Hant | Applying | 入相 | 入相 | Applying | app | applicans | NATIVE_TERM | yes | low | insufficient | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ZH-XPT/S-EN-CA-GLOSS; OWNER_REVIEW:PH-ZH-APP | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.exact | zh-Hant | Exact | 精確 | 精確 | Exact | exact | exactus | NATIVE_TERM | yes | medium | moderate | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ZH-XPT/S-ZH-WIKI/S-EN-CA-GLOSS; OWNER_REVIEW:PH-ZH-EX | APPROVED_FOR_PRODUCTION_ADMISSION |
| aspect_phase.separating | zh-Hant | Separating | 出相 | 出相 | 離相/Separating | sep | separans | NATIVE_TERM | yes | low | insufficient | OWNER_RESOLVED_REVIEW | BENCHMARK:S-ZH-XPT/S-EN-CA-GLOSS; OWNER_REVIEW:PH-ZH-SEP | APPROVED_FOR_PRODUCTION_ADMISSION |
| motion.retrograde | zh-Hant | Retrograde | 逆行 | ℞ | 逆行運動 | ℞ | retrogradus | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-LNKA/S-ZH-XPT/S-EN-CA-GLYPH | APPROVED_FOR_PRODUCTION_ADMISSION |
| chart_type.natal | zh-Hant | Natal chart | 本命盤 | 本命 | 本命星盤/出生星盤 | natal | horoscopus natalis | NATIVE_TERM | no | high | convergent | BENCHMARK_BATCH | BENCHMARK:S-ZH-XPT/S-ZH-LNKA/S-ZH-XINYI/S-EN-CA-GLOSS | APPROVED_FOR_PRODUCTION_ADMISSION |

<!-- P0_MATRIX_END -->

## 8. Invariants and closure

- The 306 rows retain the 51 P0 semantic IDs from
  `NATALNODE_ASTROLOGY_GLOSSARY_V1.md`; no concept was added, removed, or
  renamed.
- All six target locales remain within the frozen V1 locale registry.
- No P1 or P2 record is approved by this task.
- No locale code, runtime glossary source, translation catalog, or production
  variant is created.
- No astronomy, provider, timezone, place-resolution, Engine, API/BFF,
  server, Auth, Vault, notification, commercial, SEO, or database behavior
  is changed.
- The fixed boundary remains `NatalNode.com → Website API / BFF →
  NatalNode Engine Public API`.
- `PROVIDER DECISION DEFERRED` remains unchanged.

This document closes `WEB-LOCALIZATION-001N` at the decision-documentation
boundary. The next production-admission task must be separately scoped and
must not be started here.
