# NATALNODE ASTROLOGY TERMINOLOGY OWNER REVIEW V1

**STATUS: OWNER REVIEW PACKET — NO PRODUCTION TERMS APPROVED**

- Task: WEB-LOCALIZATION-001M
- Evidence base: NATALNODE_MULTILINGUAL_ASTROLOGY_TERMINOLOGY_BENCHMARK_V1
- Baseline benchmark commit: 7753f60effb8178dc6e26622d9e218125da1589e
- Scope: only the benchmark's exact REVIEW_REQUIRED records
- Locales represented: es, fr, de, ja, ko, zh-Hant
- Current publication state for every term below: PROPOSED_NOT_APPROVED

## Purpose and decision boundary

WEB-LOCALIZATION-001L produced 306 P0 locale-concept records: 51 concepts across six target locales. It marked exactly 24 records as REVIEW_REQUIRED. This packet extracts only those 24 records and groups them into three record-bearing decision clusters, followed by non-recording cross-locale rules, so the owner can resolve the genuinely ambiguous terminology without rereading the full matrix.

This packet does not approve any term. No owner option is preselected. The words APPROVE, KEEP, USE, and REQUIRE in the option lists describe possible next decisions only. Until the owner makes and freezes a decision, every candidate remains PROPOSED_NOT_APPROVED.

The packet uses only the benchmark's candidates, alternatives, adaptation modes, source observations, and recommendations. It does not invent translations, aliases, abbreviations, semantic IDs, or professional terminology. It does not perform new broad terminology research.

## Exact review scope

The benchmark was counted directly before this packet was drafted:

| Locale | REVIEW_REQUIRED records |
|---|---:|
| es | 4 |
| fr | 4 |
| de | 4 |
| ja | 3 |
| ko | 4 |
| zh-Hant | 5 |
| **Total** | **24** |

The 24 records are:

- House-system records: es house_system.whole_sign; fr house_system.whole_sign; de house_system.whole_sign; de house_system.equal.
- Aspect-phase records: es applying, exact, separating; fr applying, exact, separating; de applying, separating; ja applying, exact, separating; ko applying, exact, separating; zh-Hant applying, exact, separating.
- Angle and cusp records: ko angle.midheaven; zh-Hant angle.midheaven; zh-Hant house.cusp.

High-confidence planet names, zodiac names, major-aspect names, Ascendant records, retrograde, natal chart, and the non-review bilingual-first-use records are intentionally not duplicated here.

## Decision option vocabulary

Each card uses only the following actionable option labels:

- **A. APPROVE RECOMMENDED CANDIDATE** — promote the listed candidate only after the owner explicitly accepts it.
- **B. APPROVE LISTED ALTERNATIVE** — promote one of the benchmark-listed alternatives only after the owner explicitly selects it.
- **C. KEEP CANONICAL ENGLISH FOR V1** — defer a locale-specific primary term and retain the English canonical label for the first production version.
- **D. USE BILINGUAL-FIRST-USE FORM** — show the local candidate with English or international notation at first use, where the card permits it.
- **E. REQUIRE MORE PROFESSIONAL REVIEW** — leave the record unapproved and request specialist terminology review.

For insufficient-evidence records, only C and E are offered. The owner is not asked to choose between unsupported translations.

## Cluster A — Whole Sign and Equal House product register

This cluster contains four records. Placidus is not in this review cluster because the benchmark consistently treats it as a retained proper name. The owner decision concerns the target-language display register for Whole Sign and Equal House, not the semantic identity of the house systems.

### Decision cards

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| SYS-ES-WS | house_system.whole_sign | es | Whole Sign | Recommended candidate=casas de signos enteros; Alternative candidates=Signos enteros, casas de signos completos; Recommended short form=Signos enteros; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=the descriptive Spanish phrase and the shorter system label both appear in the benchmark, so product length and register must be chosen; Best benchmark evidence=Astro.com observed Signos enteros, local observation casas de signos enteros, Cafe Astrology baseline Whole Sign; refs=S-ES-AS/S-EN-CA-WHOLE; NatalNode recommendation=keep casas de signos enteros as the proposed local-first candidate and retain Signos enteros as the compact candidate until the owner selects one; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |
| SYS-FR-WS | house_system.whole_sign | fr | Whole Sign | Recommended candidate=Signes entiers; Alternative candidates=Maison signe entier; Recommended short form=Signes entiers; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=French observations support Signes entiers while Astrotheme also exposes Maison signe entier, creating a wording and length choice; Best benchmark evidence=Astro.com and Astrotheme observed Signes entiers, Astrotheme local observation Maison = signe, Cafe Astrology baseline Whole Sign; refs=S-FR-AS/S-FR-AT-HOUSE/S-EN-CA-WHOLE; NatalNode recommendation=keep Signes entiers as the proposed neutral candidate and retain Maison signe entier as the benchmark alternative; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |
| SYS-DE-WS | house_system.whole_sign | de | Whole Sign | Recommended candidate=Ganzzeichenhäuser; Alternative candidates=Ganzzeichen, Häuser des Ganzen Zeichens; Recommended short form=Ganzzeichen; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=German usage contains both a compact label and two compound forms, so the preferred compound and capitalization need a product decision; Best benchmark evidence=Astro.com observed Ganzzeichenhäuser and Häuser des Ganzen Zeichens, local observation Ganzzeichen, Cafe Astrology baseline Whole Sign; refs=S-DE-AS/S-EN-CA-WHOLE; NatalNode recommendation=keep Ganzzeichenhäuser as the proposed technical candidate and retain Ganzzeichen and Häuser des Ganzen Zeichens as benchmark alternatives; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |
| SYS-DE-EQ | house_system.equal | de | Equal House | Recommended candidate=Äquale Häuser; Alternative candidates=gleich große Häuser; Recommended short form=Äqual; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=the benchmark records the technical form Äquale Häuser and the descriptive phrase gleich große Häuser, so register and adjective form need an owner choice; Best benchmark evidence=Astro.com observed äqual and Äquale Häuser, local observation gleich große Häuser, Cafe Astrology baseline Equal House; refs=S-DE-AS/S-EN-CA-WHOLE; NatalNode recommendation=keep Äquale Häuser as the proposed technical candidate and retain gleich große Häuser as the plain-language alternative; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |

### Cluster A owner decision

Choose the product register for the four records above without translating Placidus for symmetry. The semantic IDs remain house_system.whole_sign and house_system.equal. No decision here changes house calculation, chart data, or runtime behavior.

## Cluster B — Applying, Exact, and Separating as professional state labels

These records concern aspect-phase terminology, not aspect interpretation. The review must distinguish a professional state label from an ordinary grammatical adjective or verb. A literal translation alone is not sufficient evidence. The benchmark found the strongest recurring risk in applying and separating; exact is more usable but still needs a consistent state-versus-qualifier convention.

### Spanish phase decisions

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| PH-ES-APP | aspect_phase.applying | es | Applying | Recommended candidate=Aplicativo; Alternative candidates=aplicante; Recommended short form=aplic.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=split; Why review is required=the benchmark records aplicativo/aplicativa and a separate aplicante form, and Spanish gender and noun agreement may change the visible state label; Best benchmark evidence=bounded Spanish observations include aplicativo/aplicativa and the English applying baseline; refs=S-ES-AS/S-EN-CA-GLOSS; NatalNode recommendation=keep Aplicativo proposed, pair it with the canonical English concept at first use if the owner chooses bilingual display, and do not promote before the UI noun and gender are fixed; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-ES-EX | aspect_phase.exact | es | Exact | Recommended candidate=Exacto; Alternative candidates=partil; Recommended short form=exact.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=the benchmark records exacto/exacta and partil, but explicitly warns not to equate partil with every exact display; Best benchmark evidence=bounded Spanish observations include exacto/exacta and partil, Cafe Astrology baseline exact; refs=S-ES-AS/S-EN-CA-GLOSS; NatalNode recommendation=keep Exacto proposed and reserve partil as an alias candidate only until the owner defines whether the UI state means exact geometry or a narrower professional usage; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-ES-SEP | aspect_phase.separating | es | Separating | Recommended candidate=Separativo; Alternative candidates=separante; Recommended short form=separ.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=split; Why review is required=the benchmark records separativo/separativa and separante, and Spanish gender and noun agreement may change the visible state label; Best benchmark evidence=bounded Spanish observations include separativo/separativa and the English separating baseline; refs=S-ES-AS/S-EN-CA-GLOSS; NatalNode recommendation=keep Separativo proposed, pair it with the canonical English concept at first use if the owner chooses bilingual display, and do not promote before the UI noun and gender are fixed; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |

### French phase decisions

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| PH-FR-APP | aspect_phase.applying | fr | Applying | Recommended candidate=Appliquant; Alternative candidates=appliquante; Recommended short form=appl.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=Astrotheme exposes appliquant/appliquante, so the visible adjective must agree with the product noun and the state-label register; Best benchmark evidence=Astrotheme observed appliquant and appliquante in applying-aspect material; refs=S-FR-AT-PHASE/S-EN-CA-GLOSS; NatalNode recommendation=keep Appliquant proposed and use the owner-selected gendered form in a bilingual first-use presentation if needed; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-FR-EX | aspect_phase.exact | fr | Exact | Recommended candidate=Exact; Alternative candidates=partile; Recommended short form=exact; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=Astrotheme exposes exact while partile remains a benchmark alternative, so the product must decide whether Exact is the neutral state label; Best benchmark evidence=Astrotheme observed exact in the applying/separating material, Cafe Astrology baseline exact; refs=S-FR-AT-PHASE/S-EN-CA-GLOSS; NatalNode recommendation=keep Exact proposed and do not use partile as a universal synonym unless the owner explicitly accepts the narrower professional register; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-FR-SEP | aspect_phase.separating | fr | Separating | Recommended candidate=Séparant; Alternative candidates=séparante; Recommended short form=sép.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=Astrotheme exposes séparant/séparante, so the visible adjective must agree with the product noun and the state-label register; Best benchmark evidence=Astrotheme observed séparant and séparante in separating-aspect material; refs=S-FR-AT-PHASE/S-EN-CA-GLOSS; NatalNode recommendation=keep Séparant proposed and use the owner-selected gendered form in a bilingual first-use presentation if needed; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |

### German phase decisions

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| PH-DE-APP | aspect_phase.applying | de | Applying | Recommended candidate=Applikativ; Alternative candidates=applikative Phase; Recommended short form=appl.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=the benchmark observes applikative and applikativ, and German adjective inflection depends on the noun used by the UI; Best benchmark evidence=Astro.com FAQ and glossary observations include applikative/applikativ; refs=S-DE-AS/S-EN-CA-GLOSS; NatalNode recommendation=keep Applikativ proposed and settle the noun phrase before promoting the adjective; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-DE-SEP | aspect_phase.separating | de | Separating | Recommended candidate=Separativ; Alternative candidates=separative Phase; Recommended short form=sep.; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=the benchmark observes separative and separativ, and German adjective inflection depends on the noun used by the UI; Best benchmark evidence=Astro.com FAQ and glossary observations include separative/separativ; refs=S-DE-AS/S-EN-CA-GLOSS; NatalNode recommendation=keep Separativ proposed and settle the noun phrase before promoting the adjective; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |

### Japanese phase decisions

Japanese-first professional localization remains the recommendation. The benchmark's established Japanese body, sign, house, aspect, and motion terms must not be replaced by raw English merely to simplify implementation. These three rows are review-required because phase terminology is less convergent than the core vocabulary.

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| PH-JA-APP | aspect_phase.applying | ja | Applying | Recommended candidate=アプライング; Alternative candidates=アプライ; Recommended short form=app; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=insufficient; Why review is required=the benchmark records Japanese loanword forms but does not establish a single professional Japanese-first state label; Best benchmark evidence=Astro.com Japanese and additional Japanese terminology pages expose aspect and related loanword usage, while the benchmark preserves the phase as insufficient evidence; refs=S-JA-AS/S-JA-LOCAL/S-EN-CA-GLOSS; NatalNode recommendation=do not choose between the unsupported Japanese forms for production; keep canonical English for V1 or request professional review, with Japanese plus English only as a review-stage candidate; Owner options=C, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-JA-EX | aspect_phase.exact | ja | Exact | Recommended candidate=正確; Alternative candidates=イグザクト; Recommended short form=exact; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=Japanese usage includes a native descriptive term and a loanword, and the owner must decide whether the state label should lead with Japanese or technical English; Best benchmark evidence=bounded Japanese observations include 正確 and イグザクト; refs=S-JA-AS/S-JA-LOCAL/S-EN-CA-GLOSS; NatalNode recommendation=keep 正確 proposed with イグザクト as a first-use technical alias candidate, but require the owner to define the state-label register; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-JA-SEP | aspect_phase.separating | ja | Separating | Recommended candidate=セパレーティング; Alternative candidates=セパレート; Recommended short form=sep; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=insufficient; Why review is required=the benchmark records Japanese loanword forms but does not establish a single professional Japanese-first state label; Best benchmark evidence=Astro.com Japanese and additional Japanese terminology pages expose aspect and related loanword usage, while the benchmark preserves the phase as insufficient evidence; refs=S-JA-AS/S-JA-LOCAL/S-EN-CA-GLOSS; NatalNode recommendation=do not choose between the unsupported Japanese forms for production; keep canonical English for V1 or request professional review, with Japanese plus English only as a review-stage candidate; Owner options=C, E; Publication status=PROPOSED_NOT_APPROVED |

### Korean phase decisions

Korean-first hybrid professional localization remains the recommendation. The benchmark supports Korean body and sign terms and a mixed professional technical register. These phase rows remain review-required because Korean sources alternate between Hangul descriptions and loanwords, and the mapping is not sufficiently convergent for automatic approval.

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| PH-KO-APP | aspect_phase.applying | ko | Applying | Recommended candidate=어플라잉; Alternative candidates=수렴; Recommended short form=app; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=insufficient; Why review is required=the benchmark records 어플라잉 and 수렴 in mixed Korean professional usage but does not establish one safe primary state label; Best benchmark evidence=AstroWay and Ephemeris Sky observations show mixed technical terminology; refs=S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS; NatalNode recommendation=do not ask the owner to select between unsupported translations; keep canonical English for V1 or request professional review; Owner options=C, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-KO-EX | aspect_phase.exact | ko | Exact | Recommended candidate=정확; Alternative candidates=익젝트; Recommended short form=exact; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=the benchmark records a Korean descriptive term and a loanword, so the owner must decide which register leads in a technical control; Best benchmark evidence=bounded Korean professional sources expose 정확 and 익젝트 in mixed usage; refs=S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS; NatalNode recommendation=keep 정확 proposed with 익젝트 as a first-use technical alias candidate, and require an explicit Korean-first versus loanword-first decision; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-KO-SEP | aspect_phase.separating | ko | Separating | Recommended candidate=세퍼레이팅; Alternative candidates=발산; Recommended short form=sep; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=insufficient; Why review is required=the benchmark records 세퍼레이팅 and 발산 in mixed Korean professional usage but does not establish one safe primary state label; Best benchmark evidence=AstroWay and Ephemeris Sky observations show mixed technical terminology; refs=S-KO-AWAY/S-KO-ESKY/S-EN-CA-GLOSS; NatalNode recommendation=do not ask the owner to select between unsupported translations; keep canonical English for V1 or request professional review; Owner options=C, E; Publication status=PROPOSED_NOT_APPROVED |

### Traditional-Chinese phase decisions

The zh-Hant records use only independently checked genuine Traditional-Chinese evidence. No Simplified-Chinese conversion was used. The benchmark supports 入相, 精確, and 出相 as candidates but preserves insufficient evidence for applying and separating.

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| PH-ZH-APP | aspect_phase.applying | zh-Hant | Applying | Recommended candidate=入相; Alternative candidates=接近相位; Recommended short form=入相; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=insufficient; Why review is required=the benchmark independently observes 入相 but does not establish a sufficiently broad neutral Traditional-Chinese professional convention for the production state label; Best benchmark evidence=XingpanTong zh-TW exposes 入相, while the benchmark preserves insufficient evidence; refs=S-ZH-XPT/S-EN-CA-GLOSS; NatalNode recommendation=do not choose between unsupported local labels for production; keep canonical English for V1 or request Traditional-Chinese professional review; Owner options=C, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-ZH-EX | aspect_phase.exact | zh-Hant | Exact | Recommended candidate=精確; Alternative candidates=exact; Recommended short form=精確; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=moderate; Why review is required=the native term is observed, but the owner must decide whether 精確 is a state label or a numerical qualifier in the UI; Best benchmark evidence=Traditional-Chinese observations include 精確 and English exact notation; refs=S-ZH-XPT/S-ZH-WIKI/S-EN-CA-GLOSS; NatalNode recommendation=keep 精確 proposed and use exact only as a secondary technical alias if the owner confirms the state semantics; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| PH-ZH-SEP | aspect_phase.separating | zh-Hant | Separating | Recommended candidate=出相; Alternative candidates=離相; Recommended short form=出相; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=low; Consensus=insufficient; Why review is required=the benchmark independently observes 出相 and 離相 but does not establish a sufficiently broad neutral Traditional-Chinese professional convention for the production state label; Best benchmark evidence=XingpanTong zh-TW exposes 出相, while the benchmark preserves insufficient evidence; refs=S-ZH-XPT/S-EN-CA-GLOSS; NatalNode recommendation=do not choose between unsupported local labels for production; keep canonical English for V1 or request Traditional-Chinese professional review; Owner options=C, E; Publication status=PROPOSED_NOT_APPROVED |

## Cluster C — Angle and cusp display strategy

This cluster contains the two REVIEW_REQUIRED Midheaven records and the one REVIEW_REQUIRED Traditional-Chinese house-cusp record. The Ascendant is not a review record in the benchmark and is intentionally not reopened. ASC and MC remain international abbreviations; the decision is which local professional term leads and how the first-use pairing is shown.

### Decision cards

| Decision ID | semanticConceptId | Locale | Canonical English | Decision card |
|---|---|---|---|---|
| ANG-KO-MC | angle.midheaven | ko | Midheaven | Recommended candidate=중천점; Alternative candidates=미드헤븐/MC; Recommended short form=MC; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=split; Why review is required=Korean sources support both the descriptive Korean term and the established loanword or international abbreviation, so the locale-first register must be chosen; Best benchmark evidence=Astro-Seek exposes ASC & MC, KoreanAstrology.org and Ephemeris Sky expose 중천점 and MC, and other Korean professional tools expose 미드헤븐; refs=S-KO-AS/S-KO-KA/S-KO-ESKY/S-EN-CA-GLOSS; NatalNode recommendation=keep 중천점 as the proposed Korean-first term and pair it with MC at first technical use; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| ANG-ZH-MC | angle.midheaven | zh-Hant | Midheaven | Recommended candidate=中天; Alternative candidates=天頂/MC; Recommended short form=MC; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=yes; Confidence=medium; Consensus=split; Why review is required=Traditional-Chinese evidence shows regional variation between 中天 and 天頂, so a neutral V1 term and regional alias must be selected explicitly; Best benchmark evidence=Xinyi HK and Daybreak expose 中天 or 天頂 with MC as international notation; refs=S-ZH-XINYI/S-ZH-DAYBREAK/S-EN-CA-GLOSS; NatalNode recommendation=keep 中天 as the proposed neutral V1 term, retain 天頂 as the benchmarked regional alternative, and show MC as secondary notation if the owner accepts the hierarchy; Owner options=A, B, C, D, E; Publication status=PROPOSED_NOT_APPROVED |
| CUS-ZH | house.cusp | zh-Hant | House cusp | Recommended candidate=宮頭; Alternative candidates=宮位起點; Recommended short form=宮頭; Recommended adaptation mode=REVIEW_REQUIRED; Bilingual first use=no; Confidence=medium; Consensus=moderate; Why review is required=宮頭 is supported in professional Traditional-Chinese observations, but the owner must confirm that it is clear enough for a general audience versus the descriptive alternative 宮位起點; Best benchmark evidence=XingpanTong and Daybreak expose 宮頭 and related house-start wording; refs=S-ZH-XPT/S-ZH-DAYBREAK/S-EN-CA-GLOSS; NatalNode recommendation=keep 宮頭 proposed for professional display and retain 宮位起點 as the clarity alternative until owner review; Owner options=A, B, C, E; Publication status=PROPOSED_NOT_APPROVED |

### Scope exclusions inside the angle and house-display area

- angle.ascendant is high-confidence and not REVIEW_REQUIRED in the benchmark. It is not reopened here.
- house.1 through house.12 are high-confidence matrix records with a numbering-convention note, not REVIEW_REQUIRED records. To preserve the exact 24-record scope, no owner decision card is created for Arabic, ordinal, or Roman house display.
- The semantic IDs house.1 through house.12 remain unchanged. A future product display decision, if needed, must not become a semantic or glossary-taxonomy change.

## Cross-locale decision rules — no additional records

Cluster D does not add records. It makes the owner-facing rules explicit for the 24 cards above:

- Japanese: choose Japanese-first professional localization. For the three insufficient phase records, do not select an unsupported Japanese candidate; keep canonical English for V1 or require professional review. For Japanese exact, the owner may choose Japanese-first 正確 or the benchmarked bilingual technical form.
- Korean: choose Korean-first hybrid professional localization. For the Korean MC and exact records, a Korean term plus MC or a bilingual technical form is actionable. For Korean applying and separating, only canonical-English retention or more professional review is recommended by the evidence.
- zh-Hant: use only the benchmarked genuine Traditional-Chinese candidates and alternatives. Preserve regional alternatives as aliases or review options; do not create zh-Hant-TW or zh-Hant-HK.
- Aspect phases: the owner must decide whether the visible value is a professional state label, a grammatical adjective, or a bilingual technical label. Do not infer a professional convention from literal translation.
- House systems: Placidus remains a retained proper name. Whole Sign and Equal House decisions concern display register only.

## HIGH-CONFIDENCE NON-REVIEW QUEUE

This is a count-only summary of the benchmark records that are not in the 24-card owner-review packet. It intentionally does not reproduce the 306-row matrix and does not reopen high-consensus planet, sign, or major-aspect terms.

| Locale | Total P0 rows | High-confidence rows | Medium-confidence rows | Low or insufficient rows | REVIEW_REQUIRED rows |
|---|---:|---:|---:|---:|---:|
| es | 51 | 47 | 2 | 2 | 4 |
| fr | 51 | 46 | 5 | 0 | 4 |
| de | 51 | 46 | 5 | 0 | 4 |
| ja | 51 | 45 | 4 | 2 | 3 |
| ko | 51 | 43 | 6 | 2 | 4 |
| zh-Hant | 51 | 39 | 10 | 2 | 5 |

These records are **not production-approved yet**. They are candidates for later batch approval after the review-required decisions are resolved and the owner freezes the resulting locale terminology. The count-only summary is not an approval instruction.

## Source and copyright boundary

All source references in the cards are inherited from NATALNODE_MULTILINGUAL_ASTROLOGY_TERMINOLOGY_BENCHMARK_V1. No new broad web research was performed for this packet. The packet records only short terminology observations, notation, aliases, adaptation modes, and source pointers. It does not copy editorial articles, chart interpretations, explanations, or other long copyrighted prose.

## Production-admission plan — not executed

The recommended sequence after owner review is:

1. The owner resolves the 24 review-required decisions in this packet.
2. The resulting locale-specific terminology decisions are frozen as an explicit decision record.
3. Production locale variants are created only for owner-approved and high-confidence records under APPROVED plus CURRENT governance.
4. Glossary and runtime integration validation is run as a separate implementation task.

None of these production-admission steps is executed by WEB-LOCALIZATION-001M.

## Final non-production declaration

- Every card remains PROPOSED_NOT_APPROVED.
- No production glossary variant is created.
- No semantic ID or glossary taxonomy is changed.
- No benchmark row is modified.
- No runtime, UI, server, API, BFF, engine, test, migration, package, or configuration file is changed.
- The only intended output of this task is this owner-review document.
