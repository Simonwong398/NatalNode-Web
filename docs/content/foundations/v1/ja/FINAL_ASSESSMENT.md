---
title: "Foundations V1 最終アセスメント"
locale: ja
courseId: foundations.v1
courseVersion: v1
checkId: foundations.v1.final_check
canonicalLocale: en
contentRevision: 1
canonicalContentRevision: 1
adaptationRevision: 1
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
documentKind: LOCALIZED_ASSESSMENT_CONTENT
questionCount: 10
passThreshold: "8/10"
retryPolicy: unlimited
certification: false
courseCompletionDependency: false
coreReadinessDependency: false
futureRewardEligibilityRelevance: true
productOwnerApproval: YES
runtimeAdmission: YES
---

# Foundations V1 最終アセスメント

これは Foundations V1 の正規英語版の最終チェックを日本語に適応したものです。チャート上の事実、占星術的な解釈、不確実性、責任ある利用を区別できるかを確認します。

問題は正確に10問です。8/10以上が合格で、再挑戦の回数に制限はありません。合格は認定資格を意味せず、12レッスンの完了に代わるものでもありません。この適応版は承認済みで runtime で利用できます。Product Owner の統合承認は、この revision 1 の日本語適応版に適用されます。

この文書はアセスメントのコンテンツだけを扱います。UI、runtime、永続化、アカウント状態、報酬、商用特典、サーバー境界は定義しません。

## Question 01 — チャート上の事実と解釈

**Question ID:** `foundations.final_check.q01.chart_fact_interpretation`

**Linked lesson:** `foundations.natal_chart`

返却されたチャート記録には「太陽：14°牡牛座」とあります。次のうち、解釈ではなくチャート上の事実なのはどれですか。

**A.** この配置は、その人が安定した仕事を好むことを保証する。

**B.** 牡牛座は地のサインなので、この人は永続的に慎重である。

**C.** 返却された結果には、太陽が14°牡牛座にあると記載されている。

**D.** この配置は、その人のアイデンティティが固定されていることを証明する。

**Correct answer:** **C**

**Rationale:** 返却された配置は、チャートに記録された値です。好み、アイデンティティ、保証についての主張は解釈を加えるため、断定を避けて扱う必要があります。

## Question 02 — サインと天文学上の星座

**Question ID:** `foundations.final_check.q02.sign_constellation_distinction`

**Linked lesson:** `foundations.zodiac_structure`

占星術上のサインと天文学上の星座を最も適切に区別している説明はどれですか。

**A.** サインは宇宙にある物理的な物体で、星座は人格のカテゴリーである。

**B.** サインは占星術の黄道体系における30度の区分であり、星座は公式な境界を持つ天文学上の空の領域である。名称が重なることはあっても、境界や目的が同じとは限らない。

**C.** 12サインと88星座は、同じ大きさの同一の区分である。

**D.** 星座はネイタルチャートにおけるハウスの別名にすぎない。

**Correct answer:** **B**

**Rationale:** Foundations では、サインを12分割された占星術上の座標語彙として扱います。天文学上の星座は公式に境界が定められた大きさの異なる空の領域なので、名称が共通していても両者を置き換えることはできません。

## Question 03 — 出生時刻が不明な場合

**Question ID:** `foundations.final_check.q03.unknown_birth_time`

**Linked lessons:** `foundations.chart_calculation`, `foundations.houses_angles`, `foundations.whole_chart`

ある人は出生年月日と出生地を知っていますが、正確な出生時刻を知りません。責任ある最初の対応はどれですか。

**A.** 時刻が不明であることを保ち、アセンダント、ミッドヘブン、ハウス、カスプ、その他の時刻依存の主張を省略するか、制約付きで扱う。

**B.** 最も偏りの少ない代替として正午を使う。

**C.** 真夜中を使い、そこから得られたアングルを正確なものとして示す。

**D.** すべてのチャート層を完成させるため、本人の性格から時刻を推定する。

**Correct answer:** **A**

**Rationale:** 不明な時刻は有効な入力であり、都合のよい時刻を挿入してよいという意味ではありません。入力の欠落は計算・解釈できる範囲を制限するため、その制限を見える状態に保つ必要があります。

## Question 04 — 現地の民用時刻、タイムゾーン、過去の規則

**Question ID:** `foundations.final_check.q04.local_time_and_timezone`

**Linked lesson:** `foundations.chart_calculation`

記録された出生時刻の扱いとして、Foundations の計算上の境界に沿っているのはどれですか。

**A.** 出生地にかかわらず、時計の表示を UTC として扱う。

**B.** 出生時に異なる過去の規則が適用されていても、その都市の現在のオフセットを使う。

**C.** 最も明快な解釈を生むオフセットを選ぶ。

**D.** 元の現地の民用日付・時刻・場所を起点にし、該当する過去のタイムゾーン規則と夏時間の規則を適用して時点を特定する。その際、曖昧または存在しない時刻の読み取りを見える状態に保つ。

**Correct answer:** **D**

**Rationale:** 元の現地の民用記録と場所が出発点の入力です。過去の時刻規則によって適用されるオフセットが変わる可能性があるため、曖昧さを都合よく黙って解決せず、報告する必要があります。

## Question 05 — 惑星 × サイン × ハウス

**Question ID:** `foundations.final_check.q05.planet_sign_house_synthesis`

**Linked lesson:** `foundations.planet_sign_house`

サポートされているチャート結果で、火星が乙女座の10ハウスにあるとします。最初の解釈として、最も適切に範囲を限定したものはどれですか。

**A.** 乙女座の10ハウスの火星は、その人が厳格な管理職になることを証明する。

**B.** 各層を区別する。火星は追求や行動の機能、乙女座は洗練や実用性の可能性のあるスタイル、10ハウスは名前の付いた手法の中でサポートされる公的役割の文脈として検討する。

**C.** 火星を無視し、乙女座をその人の完全な人格として読む。

**D.** 10ハウスを、特定のキャリア結果が必然である証拠として扱う。

**Correct answer:** **B**

**Rationale:** 3つの層は異なる問いに答えるものであり、条件付きの象徴的な読みとしてのみ組み合わせられます。どの層も、それだけで固定的な性質や保証された結果を定めるものではありません。

## Question 06 — アスペクトの幾何学

**Question ID:** `foundations.final_check.q06.major_aspect_geometry`

**Linked lesson:** `foundations.aspects`

同じ黄道円上で、太陽が10°、月が100°にあると結果に示されています。最短の角距離は90°です。この幾何学に対応するメジャーアスペクト名はどれですか。

**A.** コンジャンクション

**B.** オポジション

**C.** スクエア

**D.** トライン

**Correct answer:** **C**

**Rationale:** 90°の分離はスクエアの対象となる幾何学です。アスペクト名は角度関係を示しますが、それだけで解釈が肯定的、否定的、予測的だと決めるものではありません。

## Question 07 — ハウス、アングル、カスプ

**Question ID:** `foundations.final_check.q07.houses_angles_cusps`

**Linked lesson:** `foundations.houses_angles`

Foundations の用語を正しく使っている組み合わせはどれですか。

**A.** アセンダントとミッドヘブンは時刻と場所に依存する参照点であり、ハウスはチャート空間の区画であり、ハウスカスプはハウスの境界または起点である。

**B.** サインとハウスは、同じ12区分を指す交換可能な名称である。

**C.** ミッドヘブンは天文学上の天頂であり、アセンダントはハウスカスプにすぎない。

**D.** 空のハウスはチャートの一部ではないため、区画もカスプもない。

**Correct answer:** **A**

**Rationale:** アングル、ハウス、カスプは関連していますが別々のチャート層です。また時刻と場所に依存するため、裏付けのない出生時刻データからハウスやアングルについて精密な主張をすることはできません。

## Question 08 — 優先順位付けとチャート全体の統合

**Question ID:** `foundations.final_check.q08.prioritization_and_synthesis`

**Linked lessons:** `foundations.chart_priorities`, `foundations.whole_chart`

Foundations の方法に沿った読み方の計画はどれですか。

**A.** すべての惑星に数値の強さを割り当て、最も高い点数でその人を説明する。

**B.** 最も劇的なキーワードだけに注目し、それを複雑にする要素は捨てる。

**C.** 1つの配置を完全なアイデンティティの記述として扱い、チャート全体に単純な答えを1つ与える。

**D.** まず裏付けられた入力とチャート構造を確認し、次に関連する、または繰り返される関係を検討する。裏付けられた要素だけを結び、緊張関係は条件付きで扱い、根拠が尽きたところで止める。チャート全体はその人全体ではない。

**Correct answer:** **D**

**Rationale:** 優先順位付けは説明の透明な順序であり、優劣のスコアではありません。チャート全体の統合は、少数の裏付けられた筋道を結びながら、不確実性、競合するテーマ、その人全体との境界を見える状態に保ちます。

## Question 09 — 天文学的な精度と科学的な検証

**Question ID:** `foundations.final_check.q09.precision_is_not_validation`

**Linked lessons:** `foundations.chart_calculation`, `foundations.responsible_astrology`

正しい現地時刻、過去のタイムゾーン規則、座標、天文学上の位置を使って計算し、アスペクトを精密に報告したとします。そこから導ける結論はどれですか。

**A.** 精密さは、象徴的な解釈が出来事を引き起こすことを証明する。

**B.** チャートが精密であるほど、すべての解釈が科学的に検証されたことになる。

**C.** 精密さは返却される天文学上のデータやチャート幾何学の忠実度を高められるが、象徴的、因果的、人格的、予測的な主張を科学的に検証するものではない。

**D.** 幾何学が精密なら、不確実性や手法を示す必要はなくなる。

**Correct answer:** **C**

**Rationale:** 計算と解釈は異なる証拠の道筋に属します。入力を正確に扱うことで正確なチャート結果を支えられても、占星術上の慣習が科学的な検証に変わるわけではありません。

## Question 10 — 責任ある利用と重大な影響のある主張

**Question ID:** `foundations.final_check.q10.responsible_use`

**Linked lesson:** `foundations.responsible_astrology`

あるユーザーが、うつ病を診断し、処方薬をやめるべきか決めるために占星術を使ってほしいと求めています。責任ある応答はどれですか。

**A.** 複数の配置が一致しているように見えるなら、確信を持って診断する。

**B.** 診断や重大な意思決定の権限を断り、占星術は臨床的・医学的な評価ではないと説明する。適切な専門的支援を勧め、本人の同意とプライバシーを守り、必要ならより限定した内省的な問いだけを提案する。

**C.** 返答の前に第三者の出生データを尋ね、チャートを比較する。

**D.** チャートを警告として提示したうえで、決定について法的責任は本人にあると述べる。

**Correct answer:** **B**

**Rationale:** 責任ある占星術は、診断や重大な判断における確実性を拒みます。本人の自己決定とプライバシーを守り、間違えた場合の影響が深刻なときは適切な支援につなげます。

## Content boundary

この日本語適応版は `APPROVED / CURRENT / AVAILABLE` であり、runtime に正式に登録されます。自動 fallback としては使われません。正規英語版の revision 1、10個のID、回答キー、10°/100°/90°の幾何学、出生時刻不明の扱い、科学・責任・同意・プライバシーの境界を保持します。永続化、認定、報酬、商用特典、アカウント、API、Engine、provider は定義しません。
