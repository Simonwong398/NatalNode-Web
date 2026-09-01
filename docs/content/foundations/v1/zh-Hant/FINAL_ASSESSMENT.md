---
title: "Foundations V1 最終評量"
locale: zh-Hant
courseId: foundations.v1
courseVersion: v1
checkId: foundations.v1.final_check
canonicalLocale: en
contentRevision: 1
canonicalContentRevision: 1
adaptationRevision: 1
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
documentKind: LOCALIZED_ASSESSMENT_CONTENT
questionCount: 10
passThreshold: "8/10"
retryPolicy: unlimited
certification: false
courseCompletionDependency: false
coreReadinessDependency: false
futureRewardEligibilityRelevance: true
productOwnerApproval: NO
runtimeAdmission: NO
---

# Foundations V1 最終評量

這是 Foundations V1 正規英文版最終檢核的繁體中文適配版本，用來評估學習者是否能區分星盤事實、占星詮釋、不確定性與負責任的使用方式。

評量恰好包含十題。答對 8/10 即為通過，重試次數不限。通過不代表取得認證，也不取代十二個課程單元的完成。本適配版本目前仍在審查中，在 Product Owner 完成一次整合決策前，不會於 runtime 提供。

本文件只包含評量內容，不定義 UI、runtime、持久化、帳戶狀態、獎勵、商業權益或伺服器邊界。

## Question 01 — 星盤事實與詮釋

**Question ID:** `foundations.final_check.q01.chart_fact_interpretation`

**Linked lesson:** `foundations.natal_chart`

回傳的星盤紀錄寫著：「太陽：14° 金牛座」。以下哪一項是星盤事實，而不是詮釋？

**A.** 這個配置保證當事人會偏好穩定的工作。

**B.** 因為金牛座是土象星座，所以這個人永遠都很謹慎。

**C.** 回傳結果列出太陽位於 14° 金牛座。

**D.** 這個配置證明當事人的身分是固定不變的。

**Correct answer:** **C**

**Rationale:** 回傳的配置是星盤所報告的一項數值。關於偏好、身分或保證的說法，都額外加入了詮釋性主張，因此應保留適當限定。

## Question 02 — 占星星座與天文學星座

**Question ID:** `foundations.final_check.q02.sign_constellation_distinction`

**Linked lesson:** `foundations.zodiac_structure`

哪一項最能區分占星學上的星座（sign）與天文學上的星座（constellation）？

**A.** 占星星座是太空中的物理物體，而天文星座是人格分類。

**B.** 占星星座是占星黃道框架中的 30 度區段；天文星座則是具有官方邊界的天文天空區域。名稱可能重疊，但邊界與用途不一定相同。

**C.** 十二個占星星座與 88 個天文星座是大小相同的完全一致分區。

**D.** 天文星座只是本命盤中宮位的另一個名稱。

**Correct answer:** **B**

**Rationale:** Foundations 將占星星座作為十二分的占星座標詞彙。天文星座是具有官方邊界且大小不一的天空區域，因此名稱相同不代表兩套系統可以互換。

## Question 03 — 出生時間未知

**Question ID:** `foundations.final_check.q03.unknown_birth_time`

**Linked lessons:** `foundations.chart_calculation`, `foundations.houses_angles`, `foundations.whole_chart`

某人知道出生日期與地點，卻不知道確切的出生時間。負責任的第一步是什麼？

**A.** 保留時間未知的狀態，省略或限定上升點、中天、宮位、宮頭及其他依賴時間的主張。

**B.** 使用中午，因為它是偏差最小的替代值。

**C.** 使用午夜，並把由此得到的角度呈現為精確結果。

**D.** 從當事人的個性反推出時間，讓星盤的每一層都完整。

**Correct answer:** **A**

**Rationale:** 未知時間是有效輸入，不代表可以自行填入一個方便的時間。缺少的輸入會限制可計算與可詮釋的內容，而這項限制必須保持可見。

## Question 04 — 當地民用時間、時區與歷史規則

**Question ID:** `foundations.final_check.q04.local_time_and_timezone`

**Linked lesson:** `foundations.chart_calculation`

以下哪種處理記錄上的出生時間方式符合 Foundations 的計算邊界？

**A.** 不論出生地為何，都把時鐘讀數當作 UTC。

**B.** 即使出生當時適用不同的歷史規則，仍使用該城市目前的時區偏移。

**C.** 選擇能產生最清楚詮釋的偏移量。

**D.** 先使用原始的當地民用日期、時間與地點，再套用適用的歷史時區與日光節約時間規則，以辨識對應時刻，同時讓模糊或不存在的讀數保持可見。

**Correct answer:** **D**

**Rationale:** 原始的當地民用紀錄與地點是起始輸入。歷史時間規則可能改變適用的時區偏移，因此模糊性應被報告，而不是為了方便而默默解決。

## Question 05 — 行星 × 星座 × 宮位

**Question ID:** `foundations.final_check.q05.planet_sign_house_synthesis`

**Linked lesson:** `foundations.planet_sign_house`

某個受支援的星盤結果顯示火星位於處女座第 10 宮。以下哪項是最合適、且範圍受到限定的初步詮釋？

**A.** 處女座第 10 宮的火星證明當事人一定會成為要求嚴格的主管。

**B.** 保持各層的區別：將火星探索為追求或行動的功能，將處女座探索為可能的精煉或實用風格，將第 10 宮探索為在明確方法中受支援的公共角色脈絡。

**C.** 忽略火星，把處女座讀成當事人的完整人格。

**D.** 把第 10 宮當作某個特定職涯結果必然發生的證據。

**Correct answer:** **B**

**Rationale:** 三個層次回答的是不同問題，只能在有適當限定的象徵性閱讀中結合。它們沒有任何一項能單獨建立固定特質或保證結果。

## Question 06 — 相位幾何

**Question ID:** `foundations.final_check.q06.major_aspect_geometry`

**Linked lesson:** `foundations.aspects`

結果顯示太陽在 10°、月亮在同一黃道圓的 100°。兩者最短的角距離是 90°。這個幾何關係對應哪個主要相位名稱？

**A.** 合相

**B.** 對分相

**C.** 四分相

**D.** 三分相

**Correct answer:** **C**

**Rationale:** 90° 的分離是四分相的目標幾何。相位名稱描述角度關係，本身不會決定詮釋是正面、負面或具有預測性。

## Question 07 — 宮位、角度與宮頭

**Question ID:** `foundations.final_check.q07.houses_angles_cusps`

**Linked lesson:** `foundations.houses_angles`

哪一項配對正確使用了 Foundations 的詞彙？

**A.** 上升點與中天是對時間和地點敏感的參考點；宮位是星盤空間的區段；宮頭是宮位的邊界或起點。

**B.** 占星星座與宮位是同一十二個分區的可互換名稱。

**C.** 中天就是天文學上的天頂，而上升點只是一個宮頭。

**D.** 空宮不屬於星盤，因此沒有區段或宮頭。

**Correct answer:** **A**

**Rationale:** 角度、宮位與宮頭是彼此相關但不同的星盤層次。它們也對時間和地點敏感，因此沒有可靠出生時間資料時，不能據此提出精確的宮位或角度主張。

## Question 08 — 優先順序與整體星盤整合

**Question ID:** `foundations.final_check.q08.prioritization_and_synthesis`

**Linked lessons:** `foundations.chart_priorities`, `foundations.whole_chart`

哪種閱讀計畫遵循 Foundations 的方法？

**A.** 為每顆行星分配數值強度，讓分數最高者解釋這個人。

**B.** 把所有注意力放在最戲劇化的關鍵字上，捨棄讓它變複雜的因素。

**C.** 把一個配置當作完整的身分陳述，讓整張星盤只有一個簡單答案。

**D.** 先檢查受支援的輸入與星盤結構，再考慮相關或重複出現的關係，只連結受支援的因素，限定地處理張力，並在證據用盡時停止；整張星盤不等於整個人。

**Correct answer:** **D**

**Rationale:** 優先順序是透明的說明順序，不是支配性分數。整體星盤整合會連結少數有依據的線索，同時讓不確定性、彼此競爭的主題，以及星盤與完整個人之間的界線保持可見。

## Question 09 — 天文精確度與科學驗證

**Question ID:** `foundations.final_check.q09.precision_is_not_validation`

**Linked lessons:** `foundations.chart_calculation`, `foundations.responsible_astrology`

計算使用了正確的當地時間、歷史時區規則、座標與天文位置，並精確報告一個相位。由此可以得到哪個結論？

**A.** 精確度證明象徵性詮釋會造成事件。

**B.** 星盤越精確，每一項詮釋就越具科學驗證。

**C.** 精確度可以提高回傳的天文資料與星盤幾何的忠實度，但不會對象徵性、因果性、人格性或預測性主張提供科學驗證。

**D.** 幾何關係精確之後，就不必再說明不確定性與方法。

**Correct answer:** **C**

**Rationale:** 計算與詮釋使用的是不同的證據路徑。精確處理輸入可以支持精確的星盤結果，但不會把占星慣例轉變為科學驗證。

## Question 10 — 負責任的使用與高風險主張

**Question ID:** `foundations.final_check.q10.responsible_use`

**Linked lesson:** `foundations.responsible_astrology`

使用者要求占星術診斷憂鬱症，並決定是否停止服用處方藥。以下哪個回應是負責任的？

**A.** 如果多個配置看起來一致，就提供肯定的診斷。

**B.** 拒絕診斷與高風險決策的權威，說明占星術不是臨床或醫療評估，鼓勵尋求合格的照護，並保護當事人的同意與隱私；如適當，只提供範圍較小的反思性問題。

**C.** 先要求第三方的出生資料並比較星盤，再回答問題。

**D.** 把星盤當作警告，但說明使用者仍須為決定負法律責任。

**Correct answer:** **B**

**Rationale:** 負責任的占星術拒絕診斷及高風險決策中的確定性。它保留當事人的自主權與隱私，並在錯誤後果嚴重時指向合格的支援。

## Content boundary

此繁體中文適配版本為 `REVIEW / CURRENT / UNAVAILABLE`，不會進入 runtime，也不會作為自動 fallback。它保留正規 revision 1、10 個 stable IDs、回答鍵、10°/100°/90° 幾何、未知出生時間的處理，以及科學、責任、同意和隱私邊界。不定義持久化、認證、獎勵、商業權益、帳戶、API、Engine 或 provider。
