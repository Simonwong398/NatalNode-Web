---
title: "Foundations V1 ko Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: ko
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
---

# Foundations V1 ko Lessons 01–03 Review Manifest

## 범위와 상태

이 manifest는 Foundations V1 Lesson 01–03의 한국어 Class C 전문 적응을 기록합니다. 내용은 독립적으로 작성했으며 runtime 자동 번역이 아닙니다. `foundations.v1`의 canonical identity, `en`의 canonical provenance, 천문학·계산·해석·책임 있는 사용의 경계를 보존합니다.

세 lesson은 모두 `contentRevision: 1`이며 canonical revision은 각각 3, 2, 2입니다. 상태는 `contentState: REVIEW`, `currentness: CURRENT`, `runtimeAvailability: UNAVAILABLE`입니다. `CURRENT`는 현재 canon과의 정합성만 나타내며 Product Owner 승인이나 runtime admission을 의미하지 않습니다.

## Lesson identity

| Lesson | Lesson ID | 한국어 제목 | Canonical revision | Adaptation | 상태 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 01 | `foundations.natal_chart` | 네이털 차트란 실제로 무엇인가 | 3 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 02 | `foundations.zodiac_structure` | 황도의 구조: 원소와 모드 | 2 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 03 | `foundations.chart_calculation` | 하늘이 차트가 되는 과정 | 2 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Canonical source는 `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md`, `02-the-zodiac-structure.md`, `03-how-the-sky-becomes-a-chart.md`입니다. 영어 파일은 변경하지 않았습니다.

## 콘텐츠 계약 감사

- 각 lesson은 `오리엔테이션`, `핵심 개념`, `전문 용어`, `예시`, `내 차트`, `연습`, `이해도 확인`, `핵심 정리`, `출처 및 추가 읽기`의 9개 top-level section을 이 순서로 유지합니다.
- 각 lesson에는 이해도 확인 질문이 정확히 2개 있고 정답 표기와 해설이 각각 2개 있습니다.
- 차트의 층, 계산된 사실과 해석의 구분, 열두 사인, 원소와 모드, 사인과 별자리의 구분, 현지 시간에서 황경으로 이어지는 계산 경로, ASC·MC·하우스의 데이터 의존성을 유지합니다.
- 점수, 예측, 진단, 결정론적 행동 주장, 계산 로직, 자동 번역, 새로운 차트 데이터는 추가하지 않았습니다.

## 용어 결정과 기록된 gap

| Concept | 적응 표현 | 경계 |
| --- | --- | --- |
| Natal chart / chart fact / interpretation | `네이털 차트(출생 차트)` / `차트 사실` / `해석` | 세 층을 서로 섞지 않음. |
| Zodiac sign / constellation | `황도 사인` / `천문학적 별자리` | 규칙적인 점성술 구간과 천문학적 영역을 구분함. |
| Element / mode | `불·흙·공기·물` / `기본·고정·변화` | 전통적 분류이지 측정값이나 고정 유형이 아님. |
| Ecliptic / ecliptic longitude | `황도` / `황경` | 기하학을 설명하는 말이며 해석의 과학적 검증이 아님. |
| Ascendant / Midheaven / house | `어센던트(ASC)` / `미드헤븐(MC)` / `하우스` | MC와 천정을 구분하고 하우스는 시각에 의존함. |
| Local civil time / timezone / DST | `현지 민간 시간` / `시간대` / `일광 절약 시간(DST)` | resolver나 시간 데이터는 추가하지 않음. |

본문 안에서 지역 용어를 설명했지만 runtime glossary의 ID, alias, UI label, production field는 추가하지 않았습니다.

## 전문성 및 인식론 리뷰

전문적인 한국어, 용어, 인식론적 parity에 대해 독립적인 내부 검토를 실시했습니다. 독립 검토 이후 correction cycle은 `0`입니다. 기계적인 직역이 아니라 초보자가 읽을 수 있는 editorial style로 작성했고, 가능성 표현, 관습과 사실의 구분, 결정론의 부재를 확인했습니다.

Lesson 01은 실제 인물이 아닌 태양 황소자리 15°·달 사자자리 15°의 합성 예시와 스퀘어를 유지합니다. Lesson 02는 열두 사인, 원소×모드, 사인·별자리 경계를 유지합니다. Lesson 03은 현지 민간 시간, UTC, 역사적 규칙, 황경, 사인, ASC/MC, Placidus·Whole Sign·Equal House의 순서를 유지합니다.

출생 시각을 모르는 상태는 그대로입니다. 정오, 자정, 추정 시각으로 ASC, MC, 하우스 커스프, 하우스를 만들지 않았습니다. 기하와 계산 결과는 모델 안의 사실로 표시하고, 해석은 가능한 읽기로 다룹니다.

## Source와 evidence lane

Canonical URL은 완전히 보존했습니다. Faculty of Astrological Studies, Astrodienst, Skyscript, Astrology University는 점성술 학습 순서와 전통 어휘에 사용했고, NASA·IAU·U.S. Naval Observatory·IANA는 천문학·시간·기준 체계의 맥락에 사용했습니다. identity, state, locale, fallback, runtime authority는 내부 PRD와 동결 문서에 남아 있습니다.

광범위한 web research, 외부 prose 복사, 자동 번역은 수행하지 않았습니다. `PROVIDER DECISION DEFERRED`.

## 공개 gate와 runtime 비 admission

이 batch의 내부 editorial 결과는 `READY_FOR_INTERNAL_LOCALE_REVIEW`이며 Product Owner approval이 아닙니다. Product Owner approval: `NO`. Runtime admission: `NO`. 이 한국어 적응의 규칙은 `REVIEW + CURRENT = UNAVAILABLE`입니다.

Registry, loader, route, fallback, UI, CSS, server, API, BFF, database, migration, Auth, Vault, Engine, provider, assessment, reward, 영어 본문은 변경하지 않았습니다.

## Correction history와 exact files

- Adaptation revision: `1`.
- 독립 내부 검토 이후 correction cycle: `0`.
- Product Owner approval: `NO`.
- Runtime admission: `NO`, runtime availability: `UNAVAILABLE`.

이 batch의 exact files:

1. `docs/content/foundations/v1/ko/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/ko/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/ko/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/ko/LESSONS_01_03_REVIEW.md`
