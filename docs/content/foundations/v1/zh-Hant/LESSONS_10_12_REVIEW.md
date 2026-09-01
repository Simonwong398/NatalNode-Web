---
title: "Foundations V1 zh-Hant Lessons 10–12 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: zh-Hant
adaptationRevision: 2
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
---

# Foundations V1 zh-Hant Lessons 10–12 Review Manifest

## 適配範圍與狀態邊界

本 review manifest 記錄 Foundations V1 `zh-Hant` Lessons 10–12 的 Class C 專業內容適配、獨立審查、一次 bounded correction cycle 與修正後複審。本批範圍恰好是第十至第十二課；它也記錄 `WEB-LEARN-007` 全課程 gate 後對 zh-Hant 01–12 的 Product Owner 核准，以及透過既有 runtime path 的 admission。

三份適配稿都連結到固定的 `foundations.v1`、`v1`、`en` canonical identity。初始適配從 `contentRevision: 1` 開始；獨立審查後完成一次內容／編輯修正，因此三份 lesson 目前均為 `contentRevision: 2`，而 `canonicalContentRevision` 均維持 `1`。三份適配稿均為：

```text
contentState         = APPROVED
currentness          = CURRENT
runtime availability = AVAILABLE
```

`AVAILABLE` 是由 `APPROVED` 與 `CURRENT` 狀態推導出的發布結果。核准範圍只涵蓋 `zh-Hant` Foundations Lessons 01–12 的當前適配版本；其他 locale、assessment/reward 與其他產品行為不在核准範圍內。

## Product Owner approval and runtime admission

`WEB-LEARN-007` 的 zh-Hant 全課程 01–12 gate 已通過，最終結果為 `READY_FOR_OWNER_APPROVAL`，且 `BLOCKER`、`MAJOR`、`MINOR` 與 `EDITORIAL_NOTE` 均為 0。Product Owner 明確核准 `zh-Hant` Foundations Lessons 01–12 的當前適配版本；本批對應的核准版本為 Lesson 10 revision `2`、Lesson 11 revision `2`、Lesson 12 revision `2`，其 canonical revisions 均為 `1`。

此核准只適用於 locale `zh-Hant`、course `foundations.v1` 的 12 課，不表示 `es`、`fr`、`de`、`ja` 或 `ko` 已獲核准，也不表示 assessment 或 reward 已獲核准。三課已透過現有 Foundations locale-aware runtime path admission；沒有新增 loader、renderer、fallback 或 runtime translation。

## 適配內容清單

| 順序 | Lesson ID | zh-Hant 標題 | Canonical English 標題 | Canonical source revision | Adaptation revision | Content state | Currentness | Runtime availability |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 10 | `foundations.chart_priorities` | 命盤中什麼應該先看 | What Matters First in a Chart | 1 | 2 | `APPROVED` | `CURRENT` | `AVAILABLE` |
| 11 | `foundations.whole_chart` | 整體閱讀命盤 | Reading the Chart as a Whole | 1 | 2 | `APPROVED` | `CURRENT` | `AVAILABLE` |
| 12 | `foundations.responsible_astrology` | 負責任地使用占星術 | Using Astrology Responsibly | 1 | 2 | `APPROVED` | `CURRENT` | `AVAILABLE` |

精確的來源與適配稿對應：

| Lesson ID | 精確的 zh-Hant 檔案 | Canonical English source |
| --- | --- | --- |
| `foundations.chart_priorities` | `docs/content/foundations/v1/zh-Hant/10-what-matters-first-in-a-chart.md` | `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md` |
| `foundations.whole_chart` | `docs/content/foundations/v1/zh-Hant/11-reading-the-chart-as-a-whole.md` | `docs/content/foundations/v1/en/11-reading-the-chart-as-a-whole.md` |
| `foundations.responsible_astrology` | `docs/content/foundations/v1/zh-Hant/12-using-astrology-responsibly.md` | `docs/content/foundations/v1/en/12-using-astrology-responsibly.md` |

## 教學結構與題目審計

三份適配 lesson 都保留固定的九段順序：

1. 導讀 — Orientation
2. 核心概念 — Core Concept
3. 專業詞彙 — Professional Vocabulary
4. 範例 — Example
5. 我的命盤 — My Chart
6. 練習 — Practice
7. 理解檢核 — Check Understanding
8. 重點整理 — Key Takeaway
9. 來源與延伸閱讀 — Sources and Further Reading

核心概念的子段數也與 canonical 對等：Lesson 10 為 9 段，Lesson 11 為 9 段，Lesson 12 為 9 段。每課恰好保留兩道理解檢核題：

| Lesson | Question 1 answer | Question 2 answer | Parity result |
| --- | --- | --- | --- |
| 10 | B | C | PASS |
| 11 | C | C | PASS |
| 12 | C | B | PASS |

各題的問題意圖、選項、正確答案與解釋均與 canonical English 對等；沒有新增 assessment、progress、reward 或 runtime 行為。

## 適配方法與術語決策

這是直接以專業繁體中文撰寫的 Class C 適配，不是逐句直譯，也不是 runtime 翻譯。它保留 canonical 的教學目的、優先順序與綜合方法、事實／詮釋／綜合的認識論分層、科學驗證邊界、未知時間限制、責任語言、同意與隱私、非診斷與高風險界線，以及題目意圖。

現有 frozen `zh-Hant` production glossary variants 已在有核准詞彙時使用；本批沒有修改 runtime glossary，也沒有新增 glossary ID、alias、label 或 approval record。

| Concept or source term | 適配決策 | 邊界備註 |
| --- | --- | --- |
| Prioritization / salience | `優先順序` / `顯著性` | 是可檢視的閱讀安排與詮釋注意程度，不是客觀重要性、主導權、力量分數或科學排名。 |
| Supported fact / repeated theme | `受支持的事實` / `重複主題` | 僅使用實際回傳的值、關係與重複詞彙；重複可引導注意，不證明心理事實或事件。 |
| Angularity / cohort context | `角點性` / `世代脈絡` | 角點性是某些方法給予角點的詮釋注意；慢速外行星星座只提供寬廣的世代脈絡。 |
| Whole-chart synthesis | `整體命盤綜合` | 連結多項受支持因素的有條件線索，不把任何落點當成完整解釋。 |
| Keyword accumulation | `關鍵詞堆疊` | 與可追溯的綜合線索區分，避免把象徵清單偽裝成結論。 |
| Observed fact / interpretive observation | `觀察到的事實` / `詮釋性觀察` | 前者回報結果，後者透過具名方法討論可能意義；兩者都不自動成為科學測量。 |
| Synthesis thread / competing theme | `綜合線索` / `對照主題` | 保持相關因素、張力與脈絡可見，不製造和諧或宣稱唯一真實認同。 |
| Stopping rule / bounded reading | `停止規則` / `有界線的閱讀` | 證據、脈絡或要求範圍不足時，明確停止、縮小或拒絕詮釋。 |
| Epistemic status / interpretive convention | `認識論狀態` / `詮釋慣例` | 先標示陳述類型與支持程度，再使用相稱的占星術語言。 |
| Agency / consent / sensitive inference | `能動性` / `同意` / `敏感推論` | 保留個人的選擇與變化，並禁止在沒有適當同意下對第三方猜測敏感私事。 |
| Proportionate language / responsible boundary | `相稱語言` / `責任邊界` | 讓語言的信心與範圍符合證據，並在診斷或高風險決策前停止。 |

### 記錄的 glossary gaps

目前 frozen glossary 沒有可直接套用的完整 `zh-Hant` runtime variants for `prioritization`、`salience`、`angularity`、`cohort context`、`whole-chart synthesis`、`keyword accumulation`、`observed fact`、`interpretive observation`、`synthesis thread`、`competing theme`、`stopping rule`、`bounded reading`、`epistemic status`、`interpretive convention`、`agency`、`consent`、`sensitive inference`、`proportionate language` 或 `responsible boundary`。它們在本批作為明確的內容適配決策使用，並記錄於此，但沒有被靜默提升為 runtime glossary 設定。

這些內容詞彙的適配不會建立診斷、評分、排序、推斷、第三方資料或 runtime 產品行為。`能動性`在本批與前面課程的非決定論語境一致。

## 繁體中文與專業品質審計

| 審計項目 | 結果 |
| --- | --- |
| 專業繁體中文 | PASS — 句法、連接語、詞彙與高風險邊界按繁體中文編輯習慣調整。 |
| 簡體中文污染 | PASS — 獨立人工檢視未在三份 lesson body 或本 manifest 發現簡體中文污染。 |
| 直譯式機器翻譯風格 | PASS — 初始 finding 中的直譯式措辭與中文句型問題已在一次 bounded correction cycle 中修正；修正後保留自然的目標 locale 文體。 |
| 英文句法滲入 | PASS — 課文英文只保留在 canonical identity、縮寫、首次出現的專業標籤、來源名稱、URL 或固定 enum 中；非必要 technical prose 已本地化。 |
| 課內術語一致性 | PASS — 優先順序、顯著性、事實／詮釋／綜合、能動性、同意與責任邊界均保持穩定。 |
| Glossary governance | PASS — 遵循 frozen variants，並將未覆蓋詞彙記錄為內容適配決策；沒有 runtime glossary 變更。 |

本批不主張翻譯純度。專業正確性、語義穩定性、讀者理解與中性的 V1 `zh-Hant` locale 邊界，優先於機械式字詞替換。

## 認識論、科學與責任審計

### Lesson 10：優先順序不是客觀排名

- 優先順序被呈現為一種透明、可檢視的第一輪詮釋方法，不是重要性衡量、主導行星結論、力量分數或 NatalNode ranking rule。
- 流程先確認受支持的命盤結構與核心天體，再在受支持時注意角點，考慮重複的星座／元素／模式、相關主要相位，最後比較能互相限定的因素；不同學派可以採用不同順序。
- 輸入品質是可考慮內容的門檻，不是隱藏分數。重複或顯著性可以引導敘事注意，但不能證明心理事實、因果機制、診斷或預測。
- 外行星星座保持為寬廣的世代脈絡；未知出生時間時移除 ASC、MC、宮位、宮頭與其他依賴角點的事實，不以猜測時間或宮位恢復。
- 合成範例保留太陽 20° 金牛座、金星 23° 金牛座、月亮 20° 獅子座、水星 18° 雙子座、ASC 14° 雙子座、天王星摩羯座與太陽／月亮四分相；50°／140° 的 90° 分隔沒有被改動。

### Lesson 11：事實、詮釋線索與整體命盤

- `觀察到的事實`、`詮釋性觀察`與`有條件的綜合`保持三個不同層次；第三層不會因為包含更多命盤詞彙就更接近事實。
- 流程保留七步：觀察受支持事實、分開事實與詮釋、辨識相關模式、結合受支持因素、說出張力與限定、表述有界線綜合，以及在證據邊界停止。
- 多個主題可以並存，對照或張力不需要被製造成和諧；不能從單一因素推導完整人格，也不能把整體命盤當成完整的人生、健康、關係或命運解釋。
- 未知或不完整輸入時只綜合受支持層次，讓研究中、資料不完整或未知狀態可見；缺失欄位不是需要完成的空白。
- 合成範例保留太陽金牛座第十宮、月亮獅子座第一宮、水星雙子座第十一宮與太陽／月亮四分相，並保留 50°／140°／90° 幾何；未知時間時移除所有宮位主張。

### Lesson 12：負責任的占星術

- 已知命盤事實、不確定輸入、詮釋慣例與推測保持分類；「以天文學計算。透過占星術詮釋。」不被寫成科學驗證。
- 精確的時間轉換、位置、座標幾何、宮位建構與相位分隔只支持計算忠實於輸入；它們不會證明象徵造成事件、測量人格或預測結果。
- 語言保留「可能」、「可以被解讀為」、「一種可能的詮釋」與「結果沒有確立」等相稱形式，並讓選擇、學習、環境、文化、關係、資源與情境保持能動性脈絡。
- 明確拒絕以占星術診斷心理健康、醫療狀況、創傷、神經多樣性、人格障礙、虐待、生育問題或疾病，也拒絕在醫療、心理健康、法律、財務、人身安全等高風險決策中取代合格指導。
- 第三方出生資料／命盤需適當同意與私下處理；不得作敏感推論，公眾人物不構成侵入性推測許可，兒童的發展不得被固定標籤或預測限制。
- 資料不可靠、必要時間缺失、欄位未回傳、資訊太薄或要求診斷／高風險確定性／捏造事實時，停止或縮小問題；責任不是否定反思。

## 來源與證據分層

三課都保留 canonical English 的完整來源標題、組織／作者、內部文件路徑、URL 與相關性角色；只有說明文字以繁體中文適配。沒有新增來源，也沒有複製外部課程文字。

| Lesson | Canonical source entries | Canonical URL count | zh-Hant URL count | URL parity |
| --- | ---: | ---: | ---: | --- |
| 10 | 6 | 4 | 4 | PASS |
| 11 | 6 | 4 | 4 | PASS |
| 12 | 7 | 4 | 4 | PASS |

Foundations、product freeze、learning architecture 與 localization policy 的內部文件支持產品課程順序、證據分層、My Chart 與未知時間邊界、內容治理及負責任適配規則；外部占星術來源支持入門詞彙與學派脈絡。沒有一項來源被呈現為占星術詮釋的科學驗證。

## My Chart、未知時間與責任邊界

- 三課都要求先從實際回傳的命盤結果、輸入狀態、可用欄位、所選系統與限制開始，再加入有條件的占星術詮釋。
- 沒有命盤時不得捏造個人優先順序、整體命盤故事、敏感私事或責任結論；合成範例只作教學工具。
- 出生時間未知時保留未知狀態；不得以中午、猜測或預設值補出 ASC、MC、宮位、宮頭、角點依賴主張或其他被抑制的時間敏感層。
- 不得讓課程、瀏覽器或用戶端計算、排名、生成整體命盤詮釋或取代合格的診斷／決策支持。
- 第三方命盤、兒童、公眾人物與高風險問題都必須在證據、同意、隱私、能動性與適當支持邊界內處理。

## 獨立審查、修正歷史與最終結果

本批先完成適配，再以獨立 finding set 逐課重新開啟 canonical English 與 zh-Hant source 進行審查；評估期間先不修改內容。初始 finding set 如下：

| Finding level | Count | Finding summary |
| --- | ---: | --- |
| `BLOCKER` | 0 | NONE |
| `MAJOR` | 0 | NONE |
| `MINOR` | 6 | 10 的合成例對比句需明示主張；10／11 來源說明的非必要英文 technical prose；11 的「按比例」直譯措辭、事實句型與 `競合主題` 術語；12 的支援語句搭配需本地化。 |
| `EDITORIAL_NOTE` | 0 | NONE |

在一次 correction cycle 中完成以下 bounded changes：

1. Lesson 10：明確改寫「不是金牛座比較強」的句法，並將來源說明中的非必要英文技術詞改為中文。
2. Lesson 11：將「按比例」改為「以相稱的方式」、重寫合成範例的事實句型、將 `競合主題` 改為 `對照主題`，並將來源說明中的非必要英文技術詞改為中文。
3. Lesson 12：將示例與理解檢核中不自然的支持語句統一為「合格的專業支持」。

`Correction cycles: 1`（低於每批最多兩次）。修正後重新檢視三份 canonical English 與 zh-Hant source，最終 finding set 為 `BLOCKER 0 / MAJOR 0 / MINOR 0 / EDITORIAL_NOTE 0`。三課 adaptation revision 因真實內容／編輯修正提升至 `2`；canonical revision 沒有提升。`WEB-LEARN-007` gate 與 Product Owner 核准後，本批狀態為 `APPROVED`、`CURRENT`、`AVAILABLE`。

## 發布與範圍安全

| 檢查項目 | 結果 |
| --- | --- |
| Product Owner approval claimed | YES — zh-Hant Lessons 01–12 only |
| Runtime admission performed | YES — existing Foundations locale-aware path |
| Runtime Learn source、registry、loader、route changed | YES — shared locale-aware path extended for zh-Hant only |
| Fallback behavior changed | NO |
| Runtime machine translation introduced | NO |
| Automatic `zh-Hans` ↔ `zh-Hant` conversion performed | NO |
| Lessons 01–09 changed | NO |
| Another locale adapted or changed | NO |
| English Lessons 01–12 changed | NO |
| Runtime glossary changed | NO |
| UI/CSS/server/API/BFF/database/Auth/Vault/Commercial changed | NO |
| Assessment、progress 或 reward behavior changed | NO |
| Engine、provider、astronomy calculation 或 timezone resolver changed | NO |
| `C:\NatalNode` accessed or modified | NO |

## 本批檔案與審查結論

本批恰好包含以下四份 documentation-only 檔案：

1. `docs/content/foundations/v1/zh-Hant/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/zh-Hant/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/zh-Hant/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/zh-Hant/LESSONS_10_12_REVIEW.md`

**10–12 approval and admission: PASS**

這個 PASS 表示本批已完成既有獨立審查、`WEB-LEARN-007` 全課程 gate、Product Owner 對 zh-Hant 01–12 的明確核准，以及現有 runtime path admission。它不表示其他 locale、assessment 或 reward 已獲核准。

**10–12 independent review: PASS**

這個 PASS 表示本批已完成內容適配、一次 bounded correction cycle、修正後複審、`WEB-LEARN-007` 全課程 gate、Product Owner 對 zh-Hant 01–12 的明確核准，以及現有 runtime path admission。它不表示其他 locale、assessment 或 reward 已獲核准。
