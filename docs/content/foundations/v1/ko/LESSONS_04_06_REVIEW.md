---
title: "Foundations V1 ko Lessons 04–06 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: ko
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
---

# Foundations V1 ko Lessons 04–06 Review Manifest

## 범위와 상태

이 manifest는 Foundations V1 Lesson 04–06의 한국어 Class C 전문 적응을 기록합니다. 내용은 독립적으로 작성했으며 runtime 자동 번역이 아닙니다. 루미너리, 개인 행성, 사회 행성, 외행성의 차이와 천문학·점성술의 별도 evidence lane을 보존합니다.

세 lesson은 모두 `contentRevision: 1`, `canonicalContentRevision: 1`을 유지합니다. `WEB-LEARN-009`에 따른 runtime admission 후 상태는 `APPROVED / CURRENT / AVAILABLE`입니다.

## Lesson identity

| Lesson | Lesson ID | 한국어 제목 | Canonical revision | Adaptation | 상태 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 04 | `foundations.sun_moon` | 태양과 달 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 05 | `foundations.mercury_venus_mars` | 수성, 금성, 화성 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 06 | `foundations.jupiter_saturn_outer_planets` | 목성, 토성, 외행성 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Canonical source는 `docs/content/foundations/v1/en/04-the-sun-and-moon.md`, `05-mercury-venus-and-mars.md`, `06-jupiter-saturn-and-the-outer-planets.md`입니다. 영어 파일은 변경하지 않았습니다.

## 콘텐츠 계약 감사

- 각 lesson은 9개 top-level section, 정확히 2개의 이해도 확인 질문, 정답 2개와 해설 2개를 유지합니다.
- 태양·달의 구분, 수성·금성·화성의 기능, 목성·토성·외행성의 관습적 그룹, 사인·하우스·애스펙트의 역할을 보존합니다.
- 천문학적 태양·달·명왕성의 분류, 외행성의 느린 이동과 코호트 맥락, 결정론·성별 고정관념·진단의 금지를 유지합니다.
- IQ 순위, 연애나 공격성의 고정 관념, 예측, 계산 로직, 자동 번역, 새로운 차트 데이터는 추가하지 않았습니다.

## 용어 결정과 기록된 gap

| Concept | 적응 표현 | 경계 |
| --- | --- | --- |
| Luminaries | `루미너리` | 태양·달을 묶는 점성술 용어이지 천문학적 분류가 아님. |
| Personal planets | `개인 행성` | 수성·금성·화성의 초보자용 그룹이며 행동을 통제한다는 뜻이 아님. |
| Social planets / outer planets | `사회 행성` / `외행성` | 목성·토성과 천왕성·해왕성·명왕성의 관습적 그룹. |
| Chart body / astronomy | `차트 천체` / `천문학적 분류` | 차트 상징과 물리적 분류를 서로 바꾸지 않음. |
| Cohort context | `코호트 맥락` | 느린 외행성 사인을 개인 프로필로 과장하지 않음. |
| Reciprocity / agency | `상호성` / `주체성` | 관계와 선택을 존중하고 고정된 결과를 만들지 않음. |

본문 안에서 지역 용어를 설명했지만 runtime glossary의 ID, alias, UI label, production field는 추가하지 않았습니다.

## 전문성 및 인식론 리뷰

전문적인 한국어와 인식론적 parity에 대해 독립적인 내부 검토를 실시했습니다. 독립 검토 이후 correction cycle은 `0`입니다. 태양은 항성, 달은 자연 위성, 명왕성은 왜행성이라는 천문학적 사실을 점성술적 상징과 분리했고, 점성술적 의미는 가능한 읽기로만 표현했습니다.

Lesson 04는 태양 게자리 8°와 달 천칭자리 8°, 경도 98°·188°, 90° 스퀘어의 합성 예시를 보존합니다. Lesson 05는 수성 처녀자리 12°, 금성 천칭자리 12°, 화성 염소자리 12°를 보존합니다. Lesson 06은 외행성의 코호트 맥락과 천왕성 1781년, 해왕성 1846년, 명왕성 1930년 발견 연도를 보존합니다.

## Source와 evidence lane

Canonical URL은 완전히 보존했습니다. 점성술 학습 자료와 NASA·IAU 천문학 자료를 서로 다른 evidence lane으로 유지했으며 외부 prose를 복사하지 않았습니다. `PROVIDER DECISION DEFERRED`.

## 공개 gate와 runtime admission

이 batch의 내부 editorial 결과는 `READY_FOR_OWNER_APPROVAL`이었고, 한국어 Foundations V1 Lessons 01–12는 `WEB-LEARN-009` 범위에서 Product Owner의 승인을 받았습니다. Product Owner approval: `YES`. Runtime admission: `YES`. 기존 Foundations locale-aware path를 통해 세 lesson은 `APPROVED / CURRENT / AVAILABLE`입니다. Assessment approval과 reward approval은 `NO`입니다.

admission에서는 기존 Foundations locale-aware path의 content mapping과 imports만 확장했습니다. 새 loader, parallel registry, fallback, runtime translation layer는 만들지 않았습니다. UI, CSS, server, API, BFF, database, migration, Auth, Vault, Engine, provider, assessment, reward, 영어 본문은 변경하지 않았습니다.

## Correction history와 exact files

- Adaptation revision: `1`.
- 독립 내부 검토 이후 correction cycle: `0`.
- Product Owner approval: `YES` (한국어 Foundations V1 Lessons 01–12).
- Runtime admission: `YES`, runtime availability: `AVAILABLE`.

이 batch의 exact files:

1. `docs/content/foundations/v1/ko/04-the-sun-and-moon.md`
2. `docs/content/foundations/v1/ko/05-mercury-venus-and-mars.md`
3. `docs/content/foundations/v1/ko/06-jupiter-saturn-and-the-outer-planets.md`
4. `docs/content/foundations/v1/ko/LESSONS_04_06_REVIEW.md`
