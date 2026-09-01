---
title: "Foundations V1 ja Lessons 04–06 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: ja
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
---

# Foundations V1 ja Lessons 04–06 Review Manifest

## 対象範囲と状態

この manifest は、Foundations V1 の Lesson 04–06 に対する日本語の Class C 専門適応を記録します。正規 identity、canonical English の epistemic strength、天文学と解釈の境界を保ち、新しい content track や runtime translation layer は作成していません。

Lesson 04–05 は `contentRevision: 1`、Lesson 06 は質問 parity の限定的な correction 後の `contentRevision: 2` です。三つとも `canonicalContentRevision: 1` を保ち、`WEB-LEARN-009` による runtime admission 後の状態は `APPROVED / CURRENT / AVAILABLE` です。

## Lesson identity

| Lesson | Lesson ID | 日本語タイトル | Canonical revision | Adaptation | 状態 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 04 | `foundations.sun_moon` | 太陽と月 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 05 | `foundations.mercury_venus_mars` | 水星・金星・火星 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 06 | `foundations.jupiter_saturn_outer_planets` | 木星・土星・外惑星 | 1 | 2 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Canonical source は `docs/content/foundations/v1/en/04-the-sun-and-moon.md`、`05-mercury-venus-and-mars.md`、`06-jupiter-saturn-and-the-outer-planets.md` です。

## コンテンツ契約の監査

- 各 lesson は canonical sequence の9 section と、正確に2問の理解度チェック、2つの正解、2つの解説を保持します。
- Lesson 04 は太陽＝恒星、月＝天然衛星という天文学上の違いと、方向性・主体性・生命力／反応・ニーズ・習慣という可能な解釈テーマを保持します。
- Lesson 05 は水星・金星・火星をコミュニケーション／価値づけ／行動についての焦点として扱い、IQ、恋愛だけの意味、性別ステレオタイプを拒否します。
- Lesson 06 は木星の拡大、土星の境界、外惑星のコホート文脈、冥王星の天文学上の準惑星分類を保持します。

## 用語の決定と記録した gap

| Concept | 適応での表現 | 境界 |
| --- | --- | --- |
| Luminary / Sun / Moon | `ルミナリー` / `太陽` / `月` | 恒星と天然衛星を区別する。 |
| Orientation, agency, vitality | `方向性、主体性、生命力` | 可能な解釈テーマで、能力の保証ではない。 |
| Response, needs, habits | `反応、ニーズ、習慣` | 診断や感情生活全体の説明ではない。 |
| Communication, values, action | `コミュニケーション、価値づけ、行動` | 文脈のある開かれた問いにする。 |
| Outer planets / cohort | `外惑星` / `コホート` | 遅い動きは個人の経験を決めない。 |
| Dwarf planet | `準惑星` | 科学的分類と象徴的な使い方を分ける。 |

これらは本文内の説明であり、runtime glossary の新しい ID、alias、UI label、production metadata は作っていません。

## 専門性と認識論のレビュー

編集、専門用語、認識論的 parity について独立した内部レビューを実施しました。レビューで Lesson 06 の質問の順序と正解選択肢の parity のずれを検出し、限定的に修正して batch を再レビューしました。独立レビュー後の correction cycle は `1`（許容される最大値は 2）です。惑星の関連づけを物理的原因、予測、診断、個人分類として示していません。

Lesson 04 の合成幾何は、太陽 蟹座8°＝98°、月 天秤座8°＝188°、正確な90°のスクエアを保持します。これはチャート上の事実であり、意味は後の解釈です。Lesson 05–06 には計算や新しい科学データを追加していません。

木星は幸運を保証せず、土星は罰ではありません。外惑星の遅い位置は世代的な文脈になりえますが、個人を十分に説明しません。冥王星は引用資料上の準惑星です。`PROVIDER DECISION DEFERRED`。

## Source と evidence lane

各 lesson の canonical URL を完全に保持しています。Faculty of Astrological Studies、Astrodienst、Astrology University、The Astrology School は curriculum と伝統の文脈、NASA は太陽・月・太陽系・冥王星の天文学的事実、IAU は分類の文脈に使っています。解釈の科学的検証を主張する資料ではありません。

広範な web research、外部 prose のコピー、自動翻訳は行っていません。凍結済みの product・architecture 文書が authority です。

## 公開 gate と runtime admission

Batch の内部 editorial 結果は `READY_FOR_OWNER_APPROVAL` でした。日本語 Foundations V1 Lessons 01–12 は `WEB-LEARN-009` の範囲で Product Owner に承認されました。Product Owner approval: `YES`。Runtime admission: `YES`。既存の Foundations locale-aware path により、三つの lesson は `APPROVED / CURRENT / AVAILABLE` です。Assessment approval と reward approval は `NO` です。

admission では既存の Foundations locale-aware path の content mapping と imports だけを拡張しました。新しい loader、parallel registry、fallback、runtime translation layer は作成していません。UI、CSS、server、API、BFF、database、migration、Auth、Vault、Commercial、Engine、provider、assessment、reward、他 locale は変更していません。

## Correction history と exact files

- Adaptation revision: `1`（Lesson 04–05）、`2`（Lesson 06、質問 parity の修正後）。
- Correction cycles after independent internal review: `1`。
- Product Owner approval: `YES`（日本語 Foundations V1 Lessons 01–12）。
- Runtime admission: `YES`、runtime availability: `AVAILABLE`。

この batch の exact files:

1. `docs/content/foundations/v1/ja/04-the-sun-and-moon.md`
2. `docs/content/foundations/v1/ja/05-mercury-venus-and-mars.md`
3. `docs/content/foundations/v1/ja/06-jupiter-saturn-and-the-outer-planets.md`
4. `docs/content/foundations/v1/ja/LESSONS_04_06_REVIEW.md`
