---
title: "Foundations V1 zh-Hant Lessons 04–06 Review Manifest"
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

# Foundations V1 zh-Hant Lessons 04–06 Review Manifest

## 適配範圍與狀態邊界

本 review manifest 記錄 Foundations V1 `zh-Hant` Lessons 04–06 的 Class C 專業內容適配與獨立審查。本批範圍恰好是第四至第六課；它不是 Product Owner 核准記錄，也不是 runtime 內容。

三份適配稿都連結到固定的 `foundations.v1`、`v1`、`en` canonical identity，並以 `adaptationRevision: 1`（各 lesson 檔案的 `contentRevision: 1`）記錄本次適配。三份適配稿均為：

```text
contentState         = REVIEW
currentness          = CURRENT
runtime availability = UNAVAILABLE
```

`UNAVAILABLE` 是由 `REVIEW` 狀態推導出的非發布結果。本批不修改 Foundations runtime registry、content loader、fallback、locale detection、路由或 runtime glossary。沒有 Product Owner approval，也沒有 runtime admission。

## 適配內容清單

| 順序 | Lesson ID | zh-Hant 標題 | Canonical English 標題 | Canonical source revision | Adaptation revision | Content state | Currentness | Runtime availability |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 4 | `foundations.sun_moon` | 太陽與月亮 | The Sun and Moon | 1 | 1 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 5 | `foundations.mercury_venus_mars` | 水星、金星與火星 | Mercury, Venus, and Mars | 1 | 1 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 6 | `foundations.jupiter_saturn_outer_planets` | 木星、土星與外行星 | Jupiter, Saturn, and the Outer Planets | 1 | 1 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |

精確的來源與適配稿對應：

| Lesson ID | 精確的 zh-Hant 檔案 | Canonical English source |
| --- | --- | --- |
| `foundations.sun_moon` | `docs/content/foundations/v1/zh-Hant/04-the-sun-and-moon.md` | `docs/content/foundations/v1/en/04-the-sun-and-moon.md` |
| `foundations.mercury_venus_mars` | `docs/content/foundations/v1/zh-Hant/05-mercury-venus-and-mars.md` | `docs/content/foundations/v1/en/05-mercury-venus-and-mars.md` |
| `foundations.jupiter_saturn_outer_planets` | `docs/content/foundations/v1/zh-Hant/06-jupiter-saturn-and-the-outer-planets.md` | `docs/content/foundations/v1/en/06-jupiter-saturn-and-the-outer-planets.md` |

三份 lesson 的 `canonicalContentRevision` 均為 `1`。適配稿沒有默默使用較舊或未對應的英文來源。

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

每課恰好保留兩道理解檢核題：

| Lesson | Question 1 answer | Question 2 answer | Parity result |
| --- | --- | --- | --- |
| 04 | B | A | PASS |
| 05 | B | B | PASS |
| 06 | A | A | PASS |

各題的問題意圖、選項、正確答案與解釋均與 canonical English 對等；沒有新增 assessment、progress、reward 或 runtime 行為。

## 適配方法與術語決策

這是直接以專業繁體中文撰寫的 Class C 適配，不是逐句直譯，也不是 runtime 翻譯。它保留 canonical 的教學目的、天文事實、占星術慣例、認識論強度、負責任使用界線、範例、幾何、未知時間規則、證據分層與題目意圖。

現有 frozen `zh-Hant` production glossary variants 已在有核准詞彙時使用；本批沒有修改 runtime glossary，也沒有新增 glossary ID、alias、label 或 approval record。

| Concept or source term | 適配決策 | 邊界備註 |
| --- | --- | --- |
| Luminaries | `光體（luminaries）` / `光體` | 用作占星術對太陽與月亮可見配對的慣用稱呼，不宣稱它是天文學分類。 |
| Conscious orientation / agency | `有意識的取向` / `能動性` | 以開放的詮釋問題呈現，不轉成固定本質、人格判決或因果主張。 |
| Central identity | `核心認同` | 明確限定為可能的取向或自我組織主題，不是固定的「真正自我」。 |
| Instinctive pattern / internal regulation | `直覺模式` / `內在調節` | 保留象徵性與非臨床邊界，不作心理健康評估或診斷。 |
| Personal planets | `個人行星` | 是水星、金星、火星的初學教學分組，不是控制行為的主張。 |
| Reciprocity / assertion | `互惠` / `自我主張` | 保留給予與接受、界線與主動性的多面向意義，不縮減為浪漫、性別或攻擊性刻板印象。 |
| Social planets / outer planets | `社會行星` / `外行星` | 明確標示木星與土星、天王星與海王星與冥王星的教學分組，不建立階層或世代人格預測。 |
| Dwarf planet | `矮行星` | 冥王星的天文學分類與占星術作為命盤天體的慣例分層並列，互不改寫。 |
| Body / sign / house / aspect | `天體` / `星座` / `宮位` / `相位` | 維持「什麼功能／如何／在哪裡／關係或動態」的閱讀輔助，不當作絕對等式。 |

### 記錄的 glossary gaps

本批使用的 `光體`、`核心認同`、`直覺模式`、`內在調節`、`個人行星`、`互惠`、`自我主張`、`社會行星`、`外行星`、`矮行星` 與 `現代外行星實踐`，在目前的 frozen glossary 中沒有可直接套用的完整 `zh-Hant` runtime variant；它們作為本地化內容中的明確適配決策記錄於此，但沒有被靜默提升為 runtime glossary 設定。

天文學名稱 `恆星`、`天然衛星`、`矮行星` 與占星術名稱 `命盤天體`、`光體` 保持不同證據分層。沒有把 `planet` 的占星術命盤用法轉成現代天文學分類。

## 繁體中文與專業品質審計

| 審計項目 | 結果 |
| --- | --- |
| 專業繁體中文 | PASS — 句法、連接語與專業語氣按繁體中文編輯習慣重寫，並維持清楚的技術區分。 |
| 簡體中文污染 | PASS — 獨立人工檢視未在三份 lesson body 或本 manifest 發現簡體中文污染。 |
| 直譯式機器翻譯風格 | PASS — 內容不是逐句機械替換；教學語氣、限定語與段落銜接均按目標 locale 調整。 |
| 英文句法滲入 | PASS — 英文只保留在 canonical identity、縮寫、首次出現的專業標籤、來源名稱、URL 或固定 enum 中。 |
| 課內術語一致性 | PASS — 三課對 body、sign、house、aspect、context、interpretation 與 limitation 的用詞穩定。 |
| Glossary governance | PASS — 遵循 frozen variants，並將未覆蓋詞彙記錄為內容適配決策；沒有 runtime glossary 變更。 |

本批不主張翻譯純度。專業正確性、語義穩定性、讀者理解與中性的 V1 `zh-Hant` locale 邊界，優先於機械式字詞替換。

## 內容與認識論審計

### Lesson 04：太陽、月亮與光體

- 太陽保持有意識的取向、活力、能動性、目的、方向與有意識的自我表達；月亮保持情緒反應、直覺模式、需求、習慣、安全感、熟悉感與內在調節。
- `核心認同` 保持開放，沒有被改寫成不變本質或保證存在的「真正自我」；月亮的內在調節明確不是臨床語言或心理健康評估。
- 太陽與月亮的區分、星座／宮位／相位增加脈絡的順序，以及事實與詮釋的分離均保留。
- 天文學分層保留太陽為恆星、月亮為繞行地球的天然衛星；`光體` 沒有被寫成行星分類、物理因果力或經驗驗證的預測。
- 合成範例保留 `太陽 8° 巨蟹座 = 98°`、`月亮 8° 天秤座 = 188°`、相距 `90°` 且與四分相一致；沒有新增命盤事實。

### Lesson 05：水星、金星與火星

- 水星保持資訊的感知、思考、語言、溝通、學習與交換，不被縮減為 IQ 或固定能力。
- 金星保持價值、吸引、關係互動、審美偏好、愉悅與互惠；浪漫只是其中一種情境，且沒有性別刻板印象或伴侶預測。
- 火星保持自我主張、動力、追求、主動性、欲望、界線、衝突反應與行動；憤怒、性或男性刻板印象沒有被當作完整定義。
- 星座只提供可能的風格或表達方式，宮位與相位只在回傳時增加脈絡；沒有把任何一層寫成絕對等式或因果公式。
- 合成範例只提供水星處女座 12°、金星天秤座 12°、火星摩羯座 12°，沒有捏造宮位、相位或角點。

### Lesson 06：木星、土星與外行星

- 木星保持擴展、成長、意義、信心、機會、慷慨與世界觀；機會不是好運承諾。
- 土星保持限制、結構、責任、紀律、延遲、界線與整合；土星不是痛苦同義詞，也沒有被寫成懲罰或造成困難的物理因果。
- 天王星、海王星與冥王星的現代外行星詞彙保持多面向與有條件，沒有轉成古怪、通靈、超自然、創傷或病理診斷。
- 外行星緩慢運行與世代共享的區分保留；外行星星座是寬廣 cohort context，不是完整的個人檔案。
- 傳統七個肉眼可見命盤天體與現代外行星的歷史區分保留；1781、1846、1930 的發現年份未改動。
- 冥王星在天文學上仍是 `矮行星`，占星術可以在另外命名的慣例中使用它作為命盤天體；兩條證據分層沒有混合。

## 天文學、占星術與來源分層

三課都保留 canonical English 的完整來源標題、組織／作者、URL 與相關性角色；只有說明文字以繁體中文適配。沒有新增來源，也沒有複製外部課程文字。

| Lesson | Canonical URL count | zh-Hant URL count | URL parity |
| --- | ---: | ---: | --- |
| 04 | 5 | 5 | PASS |
| 05 | 4 | 4 | PASS |
| 06 | 6 | 6 | PASS |

證據分層維持分離：NASA／IAU 來源支持太陽、月亮、冥王星與天文分類或發現歷史；Faculty of Astrological Studies、Astrodienst、Astrology University 與 The Astrology School 來源支持入門占星術詞彙及學派脈絡。這些占星術來源不被呈現為科學驗證證據。

## My Chart、未知時間與責任邊界

- 三課都要求先從實際回傳的命盤天體與限制開始，再加入有條件的占星術詮釋。
- 沒有命盤時不得複製合成範例、猜測天體／宮位／相位或填入尚未回傳的落點。
- 出生時間未知時保留未知狀態；不得以中午、午夜或猜測補出時間敏感的宮位與角點，也不得把外行星星座或任何天體落點升格為個人判決。
- 三課均維持命盤事實與詮釋慣例的分離，沒有引入診斷、決定論、科學驗證、provider、algorithm 或 astronomy calculation 主張。

## 獨立審查結果與修正歷史

本批先完成適配，再以獨立 finding set 逐課重新開啟 canonical English 與 zh-Hant source 進行審查；評估期間未修改內容。結果如下：

| Finding level | Count | Result |
| --- | ---: | --- |
| `BLOCKER` | 0 | NONE |
| `MAJOR` | 0 | NONE |
| `MINOR` | 0 | NONE |
| `EDITORIAL_NOTE` | 0 | NONE |

`Correction cycles: 0`。沒有觸發第二輪修正，也沒有 lesson 的 adaptation revision 增加。04–06 批次獨立審查結論為 `PASS`，但內容仍保持 `REVIEW`、`CURRENT`、`UNAVAILABLE`，等待 Product Owner 的後續決策。

## 發布與範圍安全

| 檢查項目 | 結果 |
| --- | --- |
| Product Owner approval claimed | NO |
| Runtime admission performed | NO |
| Runtime Learn source、registry、loader、route changed | NO |
| Fallback behavior changed | NO |
| Runtime machine translation introduced | NO |
| Automatic `zh-Hans` ↔ `zh-Hant` conversion performed | NO |
| Lessons 01–03 changed | NO |
| Another locale adapted or changed | NO |
| English Lessons 01–12 changed | NO |
| Runtime glossary changed | NO |
| UI/CSS/server/API/BFF/database/Auth/Vault/Commercial changed | NO |
| Assessment、progress 或 reward behavior changed | NO |
| Engine、provider、astronomy calculation 或 timezone resolver changed | NO |
| `C:\NatalNode` accessed or modified | NO |

## 本批檔案與審查結論

本批恰好包含以下四份 documentation-only 檔案：

1. `docs/content/foundations/v1/zh-Hant/04-the-sun-and-moon.md`
2. `docs/content/foundations/v1/zh-Hant/05-mercury-venus-and-mars.md`
3. `docs/content/foundations/v1/zh-Hant/06-jupiter-saturn-and-the-outer-planets.md`
4. `docs/content/foundations/v1/zh-Hant/LESSONS_04_06_REVIEW.md`

**04–06 independent review: PASS**

這個 PASS 只表示本批已完成內容適配與內部審查，不表示 Product Owner approval，不表示 runtime availability，也不改變後續 full-locale gate 的必要性。
