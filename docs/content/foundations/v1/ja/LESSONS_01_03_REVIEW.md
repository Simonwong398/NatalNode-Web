---
title: "Foundations V1 ja Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: ja
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
---

# Foundations V1 ja Lessons 01–03 Review Manifest

## 対象範囲と状態

この manifest は、Foundations V1 の Lesson 01–03 に対する日本語の Class C 専門適応を記録します。内容は独立して執筆したものであり、runtime の自動翻訳ではありません。`foundations.v1` の正規 identity、`en` の canonical provenance、天文学・計算・解釈・責任ある利用の境界を保っています。

三つの lesson はすべて `contentRevision: 1` で、canonical revision はそれぞれ 3、2、2 です。状態は `contentState: REVIEW`、`currentness: CURRENT`、`runtimeAvailability: UNAVAILABLE` のままです。`CURRENT` は現行 canon との整合を示すだけで、Product Owner の承認や runtime admission ではありません。

## Lesson identity

| Lesson | Lesson ID | 日本語タイトル | Canonical revision | Adaptation | 状態 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 01 | `foundations.natal_chart` | ネイタルチャートとは実際には何か | 3 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 02 | `foundations.zodiac_structure` | 黄道の構造：エレメントとモダリティ | 2 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 03 | `foundations.chart_calculation` | 空がチャートになるまで | 2 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Canonical source は `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md`、`02-the-zodiac-structure.md`、`03-how-the-sky-becomes-a-chart.md` です。英語ファイルは変更していません。

## コンテンツ契約の監査

- 各 lesson は、`オリエンテーション`、`中心となる考え方`、`専門用語`、`例`、`マイチャート`、`練習`、`理解度チェック`、`要点`、`参考資料とさらに読むために` の9つのトップレベル section をこの順序で保持します。
- 各 lesson には理解度チェックの問題が正確に2問あり、正解マーカー2つと解説2つがあります。
- 層としてのチャート、計算された事実と解釈の区別、十二サイン、エレメントとモダリティ、サインと星座の区別、現地時刻から黄経までの計算経路、ASC・MC・ハウスのデータ依存性を保持しています。
- 点数、予測、診断、決定論的な行動主張、計算ロジック、自動翻訳、新しいチャートデータは追加していません。

## 用語の決定と記録した gap

| Concept | 適応での表現 | 境界 |
| --- | --- | --- |
| Natal chart / chart fact / interpretation | `ネイタルチャート（出生図）` / `チャート上の事実` / `解釈` | 三つの層を混同しない。 |
| Zodiac sign / constellation | `黄道サイン` / `星座` | 規則的な占星術区分と天文学上の領域を区別する。 |
| Element / modality | `火・地・風・水` / `活動宮・固定宮・柔軟宮` | 伝統的分類であり、測定値やステレオタイプではない。 |
| Ecliptic / ecliptic longitude | `黄道` / `黄経` | 幾何学を説明する語で、解釈の科学的検証ではない。 |
| Ascendant / Midheaven / house | `アセンダント（ASC）` / `MC・ミッドヘブン` / `ハウス` | MC と天頂を区別し、ハウスは時刻に依存する。 |
| Local civil time / timezone / DST | `現地の市民時刻` / `タイムゾーン` / `夏時間（DST）` | resolver や時間データは追加していない。 |

ローカル用語は本文内で説明していますが、runtime glossary の ID、alias、UI label、production field は増やしていません。

## 専門性と認識論のレビュー

専門的な日本語、用語、認識論的 parity について独立した内部レビューを実施しました。独立レビュー後の correction cycle は `0` です。機械的な逐語訳ではなく、初学者が読める editorial style とし、「かもしれない」などの可能性表現、慣例と事実の区別、決定論の不在を確認しました。

Lesson 01 は、実在の人物ではない太陽 牡牛座15°／月 獅子座15°の合成例とスクエアを保持します。Lesson 02 は十二サイン、エレメント×モダリティ、サイン／星座の境界を保持します。Lesson 03 は現地時刻、UTC、歴史的規則、黄経、サイン、ASC/MC、Placidus・Whole Sign・Equal House の順序を保持します。

出生時刻が分からない状態はそのままです。正午、深夜、推定時刻で ASC、MC、ハウスカスプ、ハウスを作っていません。幾何学と計算結果はモデル上の事実として示し、解釈は可能な読み方として扱います。

## Source と evidence lane

Canonical URL は完全に保持しています。Faculty of Astrological Studies、Astrodienst、Skyscript、Astrology University は占星術の学習順序と伝統語彙、NASA・IAU・U.S. Naval Observatory・IANA は天文学・時間・基準系の文脈に使っています。identity、state、locale、fallback、runtime の authority は内部の PRD と凍結済み文書です。

広範な web research、外部 prose のコピー、自動翻訳は行っていません。`PROVIDER DECISION DEFERRED`。

## 公開 gate と runtime 非 admission

この batch の内部 editorial 結果は `READY_FOR_INTERNAL_LOCALE_REVIEW` であり、Product Owner approval ではありません。Product Owner approval: `NO`。Runtime admission: `NO`。この日本語適応のルールは `REVIEW + CURRENT = UNAVAILABLE` です。

Registry、loader、route、fallback、UI、CSS、server、API、BFF、database、migration、Auth、Vault、Engine、provider、assessment、reward、英語本文は変更していません。他の locale はこの manifest の範囲外です。

## Correction history と exact files

- Adaptation revision: `1`。
- Correction cycles after independent internal review: `0`。
- Product Owner approval: `NO`。
- Runtime admission: `NO`、runtime availability: `UNAVAILABLE`。

この batch の exact files:

1. `docs/content/foundations/v1/ja/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/ja/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/ja/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/ja/LESSONS_01_03_REVIEW.md`
