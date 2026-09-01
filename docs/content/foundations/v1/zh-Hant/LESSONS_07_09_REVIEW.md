---
title: "Foundations V1 zh-Hant Lessons 07–09 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: zh-Hant
adaptationRevision: 3
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
---

# Foundations V1 zh-Hant Lessons 07–09 Review Manifest

## 適配範圍與狀態邊界

本 review manifest 記錄 Foundations V1 `zh-Hant` Lessons 07–09 的 Class C 專業內容適配、獨立審查、兩次 bounded correction cycles 與修正後複審。本批範圍恰好是第七至第九課；它不是 Product Owner 核准記錄，也不是 runtime 內容。

三份適配稿都連結到固定的 `foundations.v1`、`v1`、`en` canonical identity。初始適配從 `contentRevision: 1` 開始；獨立審查後完成一次內容修正，full-locale gate 再完成一次跨課程術語對齊。因此 Lesson 07 目前為 `contentRevision: 3`，Lessons 08–09 為 `contentRevision: 2`，而三份的 `canonicalContentRevision` 均維持 `1`。三份適配稿均為：

```text
contentState         = REVIEW
currentness          = CURRENT
runtime availability = UNAVAILABLE
```

`UNAVAILABLE` 是由 `REVIEW` 狀態推導出的非發布結果。本批不修改 Foundations runtime registry、content loader、fallback、locale detection、路由或 runtime glossary。沒有 Product Owner approval，也沒有 runtime admission。

## 適配內容清單

| 順序 | Lesson ID | zh-Hant 標題 | Canonical English 標題 | Canonical source revision | Adaptation revision | Content state | Currentness | Runtime availability |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 7 | `foundations.houses_angles` | 十二宮位與角點 | The Twelve Houses and the Angles | 1 | 3 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 8 | `foundations.planet_sign_house` | 行星 × 星座 × 宮位 | Planet × Sign × House | 1 | 2 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |
| 9 | `foundations.aspects` | 相位：行星之間的關係 | Aspects: Relationships Between Planets | 1 | 2 | `REVIEW` | `CURRENT` | `UNAVAILABLE` |

精確的來源與適配稿對應：

| Lesson ID | 精確的 zh-Hant 檔案 | Canonical English source |
| --- | --- | --- |
| `foundations.houses_angles` | `docs/content/foundations/v1/zh-Hant/07-the-twelve-houses-and-the-angles.md` | `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md` |
| `foundations.planet_sign_house` | `docs/content/foundations/v1/zh-Hant/08-planet-sign-house.md` | `docs/content/foundations/v1/en/08-planet-sign-house.md` |
| `foundations.aspects` | `docs/content/foundations/v1/zh-Hant/09-aspects-relationships-between-planets.md` | `docs/content/foundations/v1/en/09-aspects-relationships-between-planets.md` |

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

核心概念的子段數也與 canonical 對等：Lesson 07 為 10 段，Lesson 08 為 8 段，Lesson 09 為 8 段。每課恰好保留兩道理解檢核題：

| Lesson | Question 1 answer | Question 2 answer | Parity result |
| --- | --- | --- | --- |
| 07 | B | C | PASS |
| 08 | B | C | PASS |
| 09 | B | B | PASS |

各題的問題意圖、選項、正確答案與解釋均與 canonical English 對等；沒有新增 assessment、progress、reward 或 runtime 行為。

## 適配方法與術語決策

這是直接以專業繁體中文撰寫的 Class C 適配，不是逐句直譯，也不是 runtime 翻譯。它保留 canonical 的教學目的、命盤層次、技術定義、幾何、未知時間規則、證據分層、責任邊界與題目意圖。

現有 frozen `zh-Hant` production glossary variants 已在有核准詞彙時使用；本批沒有修改 runtime glossary，也沒有新增 glossary ID、alias、label 或 approval record。

| Concept or source term | 適配決策 | 邊界備註 |
| --- | --- | --- |
| House / house cusp / house system | `宮位` / `宮頭` / `宮位系統` | `宮頭`與既有 frozen variant 對齊；宮位是命盤空間脈絡，不是天文物體或事件保證。 |
| Ascendant / Descendant | `上升點（ASC）` / `下降點（DSC）` | `上升點`與既有 frozen variant 對齊；`下降點`保留為內容適配詞，並明示它與 ASC 相對。 |
| Midheaven / Imum Coeli | `中天（MC）` / `天底（IC）` | `中天`使用既有 primary variant；`天底`作為 IC 的內容適配詞，兩者形成 MC–IC 軸線。 |
| Horizon / meridian / zenith | `地平線` / `子午線` / `天頂` | `天頂`只表示正上方的天文方向；`中天（MC）`不是天頂。 |
| Placidus / Whole Sign / Equal House | `普拉西德制` / `整宮制` / `等宮制` | 使用既有 frozen system variants；三者以中性方式說明，不宣稱任何一個是科學或普遍唯一正確。 |
| Empty house | `空宮` | 空宮仍是命盤區段，不是不存在、不重要或可以省略的生活領域。 |
| Planet / sign / house scaffold | `行星／命盤天體`、`星座`、`宮位`、`詮釋框架` | 保持天體功能、星座風格與宮位脈絡分開；「什麼／如何／在哪裡」不是科學方程式、食譜或普遍公式。 |
| Major aspects | `合相`、`對分相`、`四分相`、`三分相`、`六分相` | `四分相`與既有 frozen variant 對齊；五種目標角度與詮釋詞彙保持區分。 |
| Orb / phase labels | `容許度`、`入相`、`精確`、`離相` | 以內容層清楚定義回傳標籤，不創造 universal orb table、分數或 provider implementation rule。 |
| Bounded interpretation / chart fact | `有界線的詮釋` / `命盤事實` | 保持回傳的計算值與占星術詮釋分層；不把慣例寫成測量。 |

### 記錄的 glossary gaps

目前 frozen glossary 沒有可直接套用的完整 `zh-Hant` runtime variants for `angle.descendant`、`angle.imum_coeli`、`horizon`、`meridian`、`zenith`、`empty house`、多數主要相位、`orb`、phase labels、`interpretive scaffold`、`bounded interpretation`、`chart fact` 等內容詞彙。它們在本批作為明確的內容適配決策使用，並記錄於此，但沒有被靜默提升為 runtime glossary 設定。

角點名稱的邊界特別重要：`中天（MC）` 保持 Midheaven 的專業主詞；`天頂`只用於 astronomical zenith。這延續前一批 Lesson 03 的既有說明，不修改 glossary 中 deferred 的 alias 或 variant。

## 繁體中文與專業品質審計

| 審計項目 | 結果 |
| --- | --- |
| 專業繁體中文 | PASS — 句法、連接語與專業語氣按繁體中文編輯習慣調整，並維持清楚的技術區分。 |
| 簡體中文污染 | PASS — 獨立人工檢視未在三份 lesson body 或本 manifest 發現簡體中文污染。 |
| 直譯式機器翻譯風格 | PASS — 初始 finding 中的少量直譯式措辭已在一次 bounded correction cycle 中修正；修正後句法自然。 |
| 英文句法滲入 | PASS — 課文英文只保留在 canonical identity、縮寫、首次出現的專業標籤、來源名稱、URL 或固定 enum 中；`client` 殘留已改為 `用戶端`。 |
| 課內術語一致性 | PASS — 宮位／宮頭／角點、天體／星座／宮位框架，以及相位／容許度／階段標籤均保持穩定。 |
| Glossary governance | PASS — 遵循 frozen variants，並將未覆蓋詞彙記錄為內容適配決策；沒有 runtime glossary 變更。 |

本批不主張翻譯純度。專業正確性、語義穩定性、讀者理解與中性的 V1 `zh-Hant` locale 邊界，優先於機械式字詞替換。

## 技術與認識論審計

### Lesson 07：宮位、角點與時間／地點

- 宮位、星座、天體、宮頭與角點保持不同層次；宮位只提供生活領域脈絡，不保證結果。
- 十二宮位表以入門領域呈現，不把第七宮寫成婚姻決定、第十宮寫成職業保證，也不把第八或第十二宮寫成診斷。
- ASC／DSC 與 MC／IC 的兩條軸線保留；MC 是黃道與當地子午線的上中天關係，明確不等於天文學上的天頂。
- `普拉西德制`、`整宮制`與`等宮制`均以中性介紹；更換系統可能改變宮位歸屬，但不改變天體黃道位置。
- 星座不是宮位；牡羊座不等於第一宮，且自然黃道只可作教學助記。空宮仍是宮位，不需要以進階守護星方法改寫。
- 可靠出生時間與地點、約略時間、未知時間及不可用欄位的限制均保留；不以中午、午夜或猜測製造角點、宮頭或宮位。
- 合成範例保留 `ASC 雙子座 14°`、`DSC 射手座 14°`、`MC 水瓶座 3°`、`IC 獅子座 3°`與第六宮，且沒有加入其他命盤事實。

### Lesson 08：天體 × 星座 × 宮位框架

- 天體／功能、星座／風格與宮位／脈絡的三層順序保留；它是有限的 Foundations 教學框架，不是科學方程式、完整理論或 cookbook formula。
- 先辨識天體與功能，再辨識星座與風格、宮位與脈絡，最後謹慎結合並限定；命盤事實與詮釋使用不同分層。
- 卡片 A、B、C 只一次改變星座或宮位，保留「比較層次」的教學意圖，不產生人格保證、職業保證、預測或因果主張。
- 合成工作表保留水星處女座第三宮、金星天秤座第十宮、火星摩羯座第六宮的 body／sign／house 組合；沒有把句型擴大成完整閱讀。
- 宮位層不可用時只停留在受支持的天體／星座層；不得使用中午、午夜、校正猜測、姓名或星座填補宮位，也不得由 browser 或用戶端計算。

### Lesson 09：相位幾何與詮釋

- 先以 360° 黃經與最小角度分隔辨識幾何，再以具名占星術慣例討論可能意義；兩條分層沒有混合。
- 五種 Foundations 主要相位的目標角度完整保留：合相 0°、對分相 180°、四分相 90°、三分相 120°、六分相 60°。
- 相位詞彙維持有條件：四分相不自動是壞的或衝突，三分相不保證才能或成功，六分相不保證會被運用；沒有 good／bad 評分。
- 容許度保留 92° 與 90° 目標相差 2° 的例子，並說明不同實踐可能使用不同範圍；沒有透露或規定 implementation-specific orb rule。
- 入相、精確與離相只在結果回傳時閱讀；不從靜態圖表重建，也不把階段標籤寫成預測。
- 合成表格保留 50°／52°、10°／190°、105°／195°、132°／252°、65°／125° 的五組幾何與 2°／180°／90°／120°／60° 分隔；沒有加入其他相位或計算邏輯。
- 範圍明確排除小相位、諧波、赤緯平行、中點、相位型態、複雜加權、量化評分與無相位普遍規則。

## 來源與證據分層

三課都保留 canonical English 的完整來源標題、組織／作者、URL 與相關性角色；只有說明文字以繁體中文適配。沒有新增來源，也沒有複製外部課程文字。

| Lesson | Canonical URL count | zh-Hant URL count | URL parity |
| --- | ---: | ---: | --- |
| 07 | 6 | 6 | PASS |
| 08 | 4 | 4 | PASS |
| 09 | 4 | 4 | PASS |

NASA 來源用於天球、黃道與當地天空的高層次天文脈絡；Faculty of Astrological Studies、Astrodienst、Skyscript、Astrology University 與 The Astrology School 用於入門占星術詞彙與學派脈絡。占星術來源不被呈現為科學驗證證據。

## My Chart、未知時間與責任邊界

- 三課都要求先從實際回傳的命盤結果、輸入狀態、所選宮位系統或相位欄位開始，再加入有條件的占星術詮釋。
- 沒有命盤時不得複製合成範例、捏造個人落點、猜測宮位／角點／相位，或把瀏覽器／用戶端當作計算器。
- 出生時間未知時保留未知狀態；不得以中午、午夜或猜測補出 ASC、DSC、MC、IC、宮頭、宮位或時間敏感相位主張，也不得把省略的宮位視為空宮或無意義。
- 相位若未回傳，不得因圖像看起來接近就加入；若回傳 applying／exact／separating，則只描述為回傳階段狀態，不轉成預測。
- 三課均維持命盤事實、幾何事實與占星術詮釋慣例的分離，沒有引入診斷、決定論、科學驗證、provider、algorithm 或 astronomy calculation 主張。

## 獨立審查、修正歷史與最終結果

本批先完成適配，再以獨立 finding set 逐課重新開啟 canonical English 與 zh-Hant source 進行審查；評估期間先不修改內容。初始 finding set 如下：

| Finding level | Count | Finding summary |
| --- | ---: | --- |
| `BLOCKER` | 0 | NONE |
| `MAJOR` | 0 | NONE |
| `MINOR` | 4 | 07 的一處繁體中文詞界筆誤；08 的英文 `client` 殘留與句型標點／結構需本地化；09 的直譯式容許度措辭與一處幾何說明語序需修正。 |
| `EDITORIAL_NOTE` | 0 | NONE |

在兩次 correction cycles 中完成以下 bounded changes：

1. Lesson 07：將 `慣例性生活領域` 修正為自然且正確的 `慣例性的生活領域`。
2. Lesson 08：將 `client` 改為 `用戶端`，並將句型改為 `位於[星座]、[宮位]`，補足中文標點與語義邊界。
3. Lesson 09：將 `受控制的命盤詞彙` 改為 `受規範的命盤術語`，移除冗餘措辭，並將幾何句改為「與 0° 合相的目標角度相差 2°」以保持數學語義清楚。
4. Full-locale gate 的跨課程術語對齊：既有 Lesson 03 使用 `子午線`，而 Lesson 07 初稿使用 `子午圈`；將 Lesson 07 及本 manifest 的對應術語與審計說明統一為 `子午線`。

`Correction cycles: 2`（仍未超過每批最多兩次）。原始獨立審查 finding set 的 `MINOR 4` 加上 full-locale gate 發現的跨課程術語 `MINOR 1` 均已完成 bounded correction；修正後重新檢視三份 canonical English、zh-Hant source 與全課程術語矩陣，最終 finding set 為 `BLOCKER 0 / MAJOR 0 / MINOR 0 / EDITORIAL_NOTE 0`。Lesson 07 adaptation revision 因跨課程術語對齊提升至 `3`，Lessons 08–09 維持 `2`；canonical revision 沒有提升。

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

1. `docs/content/foundations/v1/zh-Hant/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/zh-Hant/08-planet-sign-house.md`
3. `docs/content/foundations/v1/zh-Hant/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/zh-Hant/LESSONS_07_09_REVIEW.md`

**07–09 independent review: PASS**

這個 PASS 只表示本批已完成內容適配、一次 bounded correction cycle 與修正後複審，不表示 Product Owner approval，不表示 runtime availability，也不改變後續 full-locale gate 的必要性。
