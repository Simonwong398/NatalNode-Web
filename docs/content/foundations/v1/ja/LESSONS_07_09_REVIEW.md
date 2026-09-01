---
title: "Foundations V1 ja Lessons 07–09 Review Manifest"
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

# Foundations V1 ja Lessons 07–09 Review Manifest

## 対象範囲と状態

この manifest は、日本語で適応した Lesson 07–09 を対象とします。十二ハウス、天体×サイン×ハウスの足場、アスペクトの幾何学を保ち、計算、renderer、チャートデータ、runtime logic は追加していません。

各 lesson は `contentRevision: 1`、`canonicalContentRevision: 1`、`contentState: REVIEW`、`currentness: CURRENT` であり、runtime availability は `UNAVAILABLE` です。

## Lesson identity

| Lesson | Lesson ID | 日本語タイトル | Canonical revision | Adaptation | 状態 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 07 | `foundations.houses_angles` | 十二ハウスとアングル | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 08 | `foundations.planet_sign_house` | 天体 × サイン × ハウス | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 09 | `foundations.aspects` | アスペクト：天体同士の関係 | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Canonical source は `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md`、`08-planet-sign-house.md`、`09-aspects-relationships-between-planets.md` です。

## コンテンツ契約の監査

- 各 lesson は9つのトップレベル section と、正確に2問の理解度チェック、正解、解説を保持します。
- Lesson 07 は十二ハウス、ハウスカスプ、ASC–DSC と MC–IC の軸、ASC・DSC・MC・IC の四つのアングルを保持します。
- MC は天文学上の天頂ではなく、Placidus・Whole Sign・Equal House はハウスを異なる形で配置しうることを明示します。
- Lesson 08 は「何を × どのように × どこで」、牡羊座の太陽・第1ハウス、天秤座の太陽・第1ハウス、牡羊座の太陽・第10ハウス、水星乙女座第3・金星天秤座第10・火星山羊座第6の練習例を保持します。
- Lesson 09 は0°コンジャンクション、60°セクスタイル、90°スクエア、120°トライン、180°オポジション、オーブ、アプライング、正確、セパレーティングを保持します。

## 用語の決定と記録した gap

| Concept | 適応での表現 | 境界 |
| --- | --- | --- |
| House / cusp / house system | `ハウス` / `ハウスカスプ` / `ハウスシステム` | モデル上の位置であり、原因ではない。 |
| Ascendant / Descendant | `アセンダント（ASC）` / `ディセンダント（DSC）` | 地平線の軸の両端。 |
| Midheaven / IC / zenith | `MC・ミッドヘブン` / `IC` / `天頂` | MC と天頂は交換できない。 |
| Planet × sign × house | `天体 × サイン × ハウス` | 何を×どのように×どこでの足場で、レシピではない。 |
| Aspect / orb / phase | `アスペクト` / `オーブ` / `位相` | オーブと位相は方法に依存する。 |
| Square / trine | `スクエア` / `トライン` | どちらも自動的に悪い・良いわけではない。 |

runtime glossary は拡張せず、新しいハウスやアスペクトの semantic ID も定義していません。`PROVIDER DECISION DEFERRED`。

## 専門性と認識論のレビュー

専門的な編集、用語、認識論的 parity について独立した内部レビューを実施しました。独立レビュー後の correction cycle は `0` です。cookbook astrology、ハウスの推測、アスペクトへの道徳的評価を避けています。

Lesson 09 の合成幾何は、50°–52°＝2°コンジャンクション、10°–190°＝180°オポジション、105°–195°＝90°スクエア、132°–252°＝120°トライン、65°–125°＝60°セクスタイルを正確に保持します。これは提示した幾何学の確認であり、製品計算や科学的証拠ではありません。

出生時刻が不明な場合、ハウス、カスプ、ASC、MCを正午、深夜、推定時刻から作っていません。

## Source と evidence lane

各 lesson の canonical URL を完全に保持しています。Faculty of Astrological Studies、Astrodienst、Skyscript、Astrology University、The Astrology School は伝統用語と学習順序、NASA は天体の基準系と黄道の文脈に使います。解釈の科学的検証を主張していません。

広範な web research、外部 prose のコピー、自動翻訳は行っていません。PRD と architecture/localization freeze が authority です。

## 公開 gate と runtime 非 admission

この batch の内部 editorial 結果は `READY_FOR_INTERNAL_LOCALE_REVIEW` です。Product Owner approval: `NO`。Runtime admission: `NO`。三つの lesson は `REVIEW / CURRENT / UNAVAILABLE` のままです。

Registry、loader、route、fallback、UI、CSS、server、API、BFF、database、migration、Auth、Vault、Commercial、Engine、provider、assessment、reward、renderer、他 locale は変更していません。

## Correction history と exact files

- Adaptation revision: `1`（Lesson 07–09）。
- Correction cycles after independent internal review: `0`。
- Product Owner approval: `NO`。
- Runtime admission: `NO`、runtime availability: `UNAVAILABLE`。

この batch の exact files:

1. `docs/content/foundations/v1/ja/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/ja/08-planet-sign-house.md`
3. `docs/content/foundations/v1/ja/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/ja/LESSONS_07_09_REVIEW.md`
