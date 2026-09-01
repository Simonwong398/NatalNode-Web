---
title: "Foundations V1 ja Lessons 10–12 Review Manifest"
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

# Foundations V1 ja Lessons 10–12 Review Manifest

## 対象範囲と状態

この manifest は、日本語 Foundations V1 の最終 batch、優先順位づけ、チャート全体の総合、責任を持った利用を記録します。三つの lesson は Class C の文書として完成していますが、Product Owner approval と runtime admission は保留です。

Lesson 10 と 12 は `contentRevision: 1`、Lesson 11 は質問 parity の限定的な correction 後の `contentRevision: 2` です。三つとも `canonicalContentRevision: 1`、`contentState: REVIEW`、`currentness: CURRENT`、`runtimeAvailability: UNAVAILABLE` を保ちます。`CURRENT` は英語 canon との整合を表し、公開を許可するものではありません。

## Lesson identity

| Lesson | Lesson ID | 日本語タイトル | Canonical revision | Adaptation | 状態 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 10 | `foundations.chart_priorities` | チャートで最初に見ること | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 11 | `foundations.whole_chart` | チャート全体を読む | 1 | 2 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 12 | `foundations.responsible_astrology` | 責任を持って占星術を使う | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Canonical source は `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md`、`11-reading-the-chart-as-a-whole.md`、`12-using-astrology-responsibly.md` です。

## コンテンツ契約の監査

- 各 lesson は9つのトップレベル section と、正確に2問の理解度チェック、正解、解説を保持します。
- Lesson 10 は、優先順位づけをスコア、ランキング、数値の重みづけではなく、入力品質と事実、裏づけのある層、繰り返しテーマ、近いアスペクト、停止ルールの順序として保持します。
- Lesson 11 は七段階の総合、事実・テーマ・文脈の区別、中立的な対照、根拠の境界で止まるルールを保持します。
- Lesson 12 は事実・慣例・不確実性、診断や高リスクの判断の拒否、同意、プライバシー、第三者、子ども、主体性、専門性の境界を保持します。

## 用語の決定と記録した gap

| Concept | 適応での表現 | 境界 |
| --- | --- | --- |
| Prioritization / stopping rule | `優先順位づけ` / `停止ルール` | 観察の順序であり、点数ではない。 |
| Whole-chart synthesis / theme | `総合` / `テーマ` | 事実を結び、人全体を説明しない。 |
| Tension / support | `緊張` / `支え` | 可能な読みを中立に表す。 |
| Fact / convention / uncertainty | `事実` / `慣例` / `不確実性` | 三つの層を明示する。 |
| Consent / privacy / agency | `同意` / `プライバシー` / `主体性` | 実践と自律性を守る。 |

これらは本文の用語であり、runtime glossary の ID、capability、hook、API field を増やしていません。`PROVIDER DECISION DEFERRED`。

## 専門性、認識論、幾何学のレビュー

専門的な編集と認識論的 parity について独立した内部レビューを実施しました。レビューで Lesson 11 の第二問の正解選択肢の並びのずれを検出し、限定的に修正して batch を再レビューしました。独立レビュー後の correction cycle は `1`（許容される最大値は 2）です。優先順位づけを score とせず、総合をキーワードの寄せ集めとせず、Lesson 12 の境界を弱めていないことを確認しました。

Lesson 10 は太陽 牡牛座20°＝50°、月 獅子座20°＝140°、90°のスクエアを保持します。Lesson 11 も同じ幾何学を、太陽 牡牛座20°、月 獅子座20°、水星 双子座5°、太陽–月スクエアの例で保持します。Lesson 12 は度数を追加していません。

出生時刻が不明なときに、ハウスやアングルを作っていません。データを強く見せるための捏造、診断、監視、圧力、他人の代わりの決定も行いません。

## Final locale gate

十二 lesson 全体の内部 editorial gate は `READY_FOR_OWNER_APPROVAL` です。

| Finding | Result |
| --- | ---: |
| `BLOCKER` | 0 |
| `MAJOR` | 0 |
| `MINOR` | 0 |
| `EDITORIAL_NOTE` | 0 |
| 完了した lesson | 12 / 12 |

これは Product Owner review に進める状態を示します。Product Owner approval ではありません：`NO`。Runtime admission でもありません：`NO`。すべての日本語 lesson は `REVIEW / CURRENT / UNAVAILABLE` のままです。

## Source、correction、scope integrity

三つの lesson の canonical URL を完全に保持しています。占星術の source は curriculum の文脈に使い、外部 prose はコピーしていません。広範な web research も行っていません。product canon、architecture、localization policy が state、fallback、公開を統括します。

UI、CSS、server、API、BFF、database、migration、Auth、Vault、Commercial、Engine、provider、assessment、reward、renderer、英語、他 locale は変更していません。自動翻訳や P1/P2/P3 機能も追加していません。

## Correction history と exact files

- Adaptation revision: `1`（Lesson 10 と 12）、`2`（Lesson 11、質問 parity の修正後）。
- Correction cycles after independent internal review: `1`。
- Product Owner approval: `NO`。
- Runtime admission: `NO`、runtime availability: `UNAVAILABLE`。

この batch の exact files:

1. `docs/content/foundations/v1/ja/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/ja/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/ja/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/ja/LESSONS_10_12_REVIEW.md`
