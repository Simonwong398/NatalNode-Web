---
title: "Foundations V1 zh-Hant Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: zh-Hant
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
---

# Foundations V1 zh-Hant Lessons 01–03 Review Manifest

## 適配範圍與狀態邊界

本 review manifest 記錄 Foundations V1 首批 `zh-Hant` Class C 專業內容適配，範圍**恰好**是前三課。這是供獨立雙語、編輯與專業審查使用的審查記錄，不是 Product Owner 核准記錄，也不是 runtime 內容。

三份適配稿都連結到固定的 `foundations.v1`、`v1`、`en` canonical identity，並以 `adaptationRevision: 1`（各 lesson 檔案的 `contentRevision: 1`）記錄本次適配。三份適配稿均為：

```text
contentState         = REVIEW
currentness          = CURRENT
runtime availability = UNAVAILABLE
```

`UNAVAILABLE` 是由 `REVIEW` 狀態推導出的非發布結果；本批不修改 Foundations runtime registry、content loader、fallback、locale detection 或任何路由。沒有 Product Owner approval，也沒有 runtime admission。

## 適配內容清單

| 順序 | Lesson ID | zh-Hant 標題 | Canonical English 標題 | Canonical source revision | Adaptation revision | Content state | Currentness | Runtime availability |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 1 | `foundations.natal_chart` | 本命盤究竟是什麼 | What a Natal Chart Actually Is | 3 | 1 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 2 | `foundations.zodiac_structure` | 黃道：元素與模式 | The Zodiac: Elements and Modes | 2 | 1 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 3 | `foundations.chart_calculation` | 天空如何成為命盤 | How the Sky Becomes a Chart | 2 | 1 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |

精確的來源與適配稿對應：

| Lesson ID | 精確的 zh-Hant 檔案 | Canonical English source |
| --- | --- | --- |
| `foundations.natal_chart` | `docs/content/foundations/v1/zh-Hant/01-what-a-natal-chart-actually-is.md` | `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md` |
| `foundations.zodiac_structure` | `docs/content/foundations/v1/zh-Hant/02-the-zodiac-structure.md` | `docs/content/foundations/v1/en/02-the-zodiac-structure.md` |
| `foundations.chart_calculation` | `docs/content/foundations/v1/zh-Hant/03-how-the-sky-becomes-a-chart.md` | `docs/content/foundations/v1/en/03-how-the-sky-becomes-a-chart.md` |

精確的 canonical revision 是：Lesson 01 為 `3`、Lesson 02 為 `2`、Lesson 03 為 `2`。沒有默默使用較舊的英文來源。

```text
foundations.natal_chart       canonicalContentRevision = 3
foundations.zodiac_structure  canonicalContentRevision = 2
foundations.chart_calculation canonicalContentRevision = 2
```

## 教學結構審計

Each adapted lesson preserves exactly this nine-section sequence:

1. 導讀 — Orientation
2. 核心概念 — Core Concept
3. 專業詞彙 — Professional Vocabulary
4. 範例 — Example
5. 我的命盤 — My Chart
6. 練習 — Practice
7. 理解檢核 — Check Understanding
8. 重點整理 — Key Takeaway
9. 來源與延伸閱讀 — Sources and Further Reading

Each lesson retains exactly two Check Understanding questions. The concept, answer options, correct answer, explanation, and difficulty intent of each canonical question are preserved; no new assessment or reward behavior is introduced.

## 適配方法與術語決策

This is an independently authored Traditional Chinese adaptation, not a literal sentence-by-sentence translation and not a runtime translation. It preserves the canonical educational objective, factual content, epistemic strength, responsible-use boundaries, examples, geometry, unknown-time rules, evidence lanes, and question intent.

The repository's frozen `zh-Hant` production glossary variants were used wherever an approved display term already exists. The runtime glossary files were not changed.

| Concept or source term | Adaptation decision | Boundary note |
| --- | --- | --- |
| Natal chart / chart type | `本命盤`；generic chart context uses `命盤` | Matches the frozen `chart_type.natal` Traditional Chinese variant. |
| Zodiac sign | `黃道星座` in explanatory prose; the twelve frozen sign names are `牡羊座`、`金牛座`、`雙子座`、`巨蟹座`、`獅子座`、`處女座`、`天秤座`、`天蠍座`、`射手座`、`摩羯座`、`水瓶座`、`雙魚座` | The phrase is explicitly separated from `天文星座（constellation）`; it does not create a new glossary ID. |
| Zodiac / tropical zodiac | `黃道` / `熱帶黃道` | `熱帶黃道` is the defensible Traditional Chinese adaptation for the current astrology-facing model; it does not describe a scientific reference frame. |
| Constellation | `天文星座` | Used only for official astronomical sky-region convention and kept distinct from equal sign sectors. |
| Element | `元素`；Fire/Earth/Air/Water as `火／土／風／水` | No frozen locale variant exists for the four `sign_element.*` labels; the choices are recorded here and are not runtime glossary changes. |
| Mode / modality / quality | `模式／模態`；Cardinal/Fixed/Mutable as `本位／固定／變動` | No frozen locale variant exists for the three `sign_modality.*` labels; the English labels remain in first-use professional notation where useful. |
| Ascendant | `上升點（ASC）` | Matches the frozen `angle.ascendant` variant and abbreviation. |
| Midheaven | `中天（MC）` | Uses the frozen primary `angle.midheaven` term; the lesson does not use `天頂` as a translation of MC. |
| Astronomical zenith | `天頂` | Deliberately reserved for the direction directly overhead so that `中天（MC）` and astronomical zenith remain distinct. |
| House / house cusp / house system | `宮位` / `宮頭` / `宮位系統` | `宮頭` matches the frozen `house.cusp` variant. |
| Placidus / Whole Sign / Equal House | `普拉西德制` / `整宮制` / `等宮制` | Matches the frozen Traditional Chinese system variants while retaining the canonical English names at first use. Only these three systems are mentioned. |
| Aspect / square | `相位` / `四分相` | `四分相` matches the frozen `aspect.square` variant; no new aspect type is introduced. |
| Chart fact / interpretation | `命盤事實` / `詮釋` | These remain separate: a returned calculation fact is not an astrological interpretation. These Class C/science-boundary phrases do not expand the runtime glossary. |
| Local civil time / timezone / DST | `當地民用時間` / `時區` / `日光節約時間（DST）` | Science and provenance terminology is adapted for comprehension; no timezone resolver or scientific data is added. |
| Ecliptic longitude | `黃經` | Used as the angular position around the ecliptic; numeric geometry is preserved as a science boundary. |

### Recorded glossary gaps

The frozen glossary has no approved/current Traditional Chinese locale variant for the element labels, modality labels, `zodiac`/`constellation` explanatory distinction, `ecliptic longitude`, `local civil time`, `timezone`/DST, `chart fact`, or `interpretation` prose. These are recorded as adaptation decisions above, with their science, provenance, or Class C boundaries intact. This batch does not create glossary entries, IDs, aliases, runtime labels, or approval records for those gaps.

The frozen Midheaven variant lists `天頂` as a historical/recognition alias, but this lesson's astronomy boundary requires `天頂` to mean zenith. The primary professional term `中天（MC）` is therefore used for Midheaven, and the distinction is stated explicitly in Lesson 03. This is a review note, not a runtime glossary edit.

## 繁體中文與專業品質審計

| 審計項目 | 結果 |
| --- | --- |
| 專業繁體中文 | PASS — 使用自然的編輯文體、穩定的術語，以及明確的技術區分。 |
| 簡體中文污染 | PASS — 人工檢視未在三份 lesson body 或本 manifest 中發現簡體中文文字。 |
| 直譯式機器翻譯風格 | PASS — 句序與連接語已按專業繁體中文調整，並非機械複製。 |
| 英文句法滲入 | PASS — 英文只保留在刻意使用的正式標題、來源名稱、URL、canonical enum/ID、縮寫或首次出現的專業標籤中。 |
| 占星術術語一致性 | PASS — 三份 lesson 與術語表使用相同的繁體中文詞彙。 |
| 天文學術語一致性 | PASS — ecliptic/黃經、當地民用時間、時區／DST 與天頂均保留為技術邊界詞彙。 |
| 術語表對等性 | PASS（已記錄缺口）— 已遵循現有 frozen variants，並避免無聲擴展。 |

本批不主張翻譯純度。專業正確性、語義穩定性、讀者理解，以及中性的 V1 `zh-Hant` locale 邊界，優先於機械式字詞替換。

## 跨課程的認識論與技術審計

### 認識論對等性

- Lesson 01 將 `may suggest` 保留為可能性（`可能`），維持詮釋作為慣例的定位，也不把象徵地圖轉成固定人格或診斷。
- Lesson 02 將元素與模式呈現為傳統面向與組合式提示，而不是經驗類別、刻板印象、決定論特質或預測。極性仍是簡短的學派層級可選說明，沒有被提升為主要軸線或產品欄位。
- Lesson 03 保持先計算、後詮釋的順序，並以可能性語言描述占星術主題。不把計算路徑轉成科學驗證主張，也沒有加入 provider／algorithm 主張。

沒有引入決定論式強化、本質化人格主張、行星力量因果主張或科學驗證強化。

### Lesson 01 的幾何與邊界

合成且非個人的範例完整保留修正後的幾何關係：太陽位於 `15° Taurus`（`金牛座 15°`）、月亮位於 `15° Leo`（`獅子座 15°`），兩者形成四分相（`四分相`）。範例仍明確不是任何真實人物的命盤，也不是 NatalNode 的計算結果。本課也保留計算事實與詮釋、黃道星座與天文星座、命盤結構與完整個人，以及未知時間不以中午／午夜替代之間的區分。

### Lesson 02 的結構與邊界

十二個黃道星座的順序、火／土／風／水元素框架、本位／固定／變動模式框架，以及元素 × 模式的組合均已保留。黃道星座與天文星座之間的邊界清楚明示。極性沒有被恢復為主要軸線、練習要求、產品欄位或 semantic ID。

### Lesson 03 的時間、角點、宮位與未知時間邊界

當地民用時間、UTC、歷史時區、DST、含糊／不存在的當地時間、地點、黃經、黃道對應、ASC／MC、宮位系統與詮釋的順序均已保留。`中天（MC）` 明確不等於天文學上的 `天頂（zenith）`。只提及 `普拉西德制（Placidus）`、`整宮制（Whole Sign）` 與 `等宮制（Equal House）`。未知出生時間仍維持未知；沒有捏造中午、午夜、估算的 ASC／MC、精確宮位或宮頭。

## 來源與證據分層

每份適配 lesson 都保留 canonical source 的標題、組織／作者、URL 與相關性角色；只有說明文字改以繁體中文適配。沒有新增來源，也沒有複製外部課程文字。

證據分層維持分離：

1. **天文／計算事實：** NASA、IAU、美國海軍天文台（U.S. Naval Observatory）與 IANA 的參考資料，以及 Web 已凍結的 contracts，支持黃道、天文星座、時間尺度、當地時間與歷史時間的說明。
2. **占星術慣例：** Faculty of Astrological Studies、Astrodienst、Skyscript 與 Astrology University 的參考資料，支持本批明確限定的命盤、星座、元素、模式、角點、宮位與相位詞彙。
3. **NatalNode 產品行為：** `docs/PRD.md`、`NATALNODE_FOUNDATIONS_V1.md`、`NATALNODE_LEARNING_ARCHITECTURE_V1.md`、`NATALNODE_ASTROLOGY_GLOSSARY_V1.md` 與 `NATALNODE_LOCALIZATION_PRODUCT_POLICY_V1.md`，支持 identity、content state、currentness、unknown-time、locale、fallback 與專業內容邊界。

廣泛網路研究：**NO**。狹義的外部術語驗證：**NO**。本適配只使用 canonical English lesson sources 與 repository-frozen product/glossary evidence。沒有使用自動轉換、瀏覽器翻譯或 runtime machine translation。

## 發布、回退與範圍安全

| 檢查項目 | 結果 |
| --- | --- |
| Product Owner approval claimed | NO |
| Runtime admission performed | NO |
| Fallback behavior changed | NO |
| Runtime machine translation introduced | NO |
| Automatic `zh-Hans` ↔ `zh-Hant` conversion performed | NO |
| Lessons 04–12 adapted or created | NO |
| Another locale adapted or changed | NO |
| English Lessons 01–12 changed | NO |
| Runtime Learn source, registry, loader, or route changed | NO |
| Runtime glossary changed | NO |
| UI/CSS/server/API/BFF/database/Auth/Vault/Commercial changed | NO |
| Assessment, progress, or reward behavior changed | NO |
| Engine, provider, astronomy calculation, or timezone resolver changed | NO |

## 本批適配檔案

Exactly these four documentation files are intended for this task:

1. `docs/content/foundations/v1/zh-Hant/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/zh-Hant/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/zh-Hant/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/zh-Hant/LESSONS_01_03_REVIEW.md`

No `.gitkeep`, runtime source, route, style, package, test, API, BFF, database, migration, Engine, provider, fallback, or other locale file belongs to this batch. `C:\NatalNode` is outside the repository and is not part of this task.
