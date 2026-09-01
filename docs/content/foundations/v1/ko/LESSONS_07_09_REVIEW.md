---
title: "Foundations V1 ko Lessons 07–09 Review Manifest"
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

# Foundations V1 ko Lessons 07–09 Review Manifest

## 범위와 상태

이 manifest는 Foundations V1 Lesson 07–09의 한국어 Class C 전문 적응을 기록합니다. 하우스와 앵글, 행성×사인×하우스 발판, 애스펙트 기하의 순서를 독립적으로 적응했으며 runtime 자동 번역은 사용하지 않았습니다.

세 lesson은 모두 `contentRevision: 1`, `canonicalContentRevision: 1`을 유지합니다. `WEB-LEARN-009`에 따른 runtime admission 후 상태는 `APPROVED / CURRENT / AVAILABLE`입니다.

## Lesson identity

| Lesson | Lesson ID | 한국어 제목 | Canonical revision | Adaptation | 상태 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 07 | `foundations.houses_angles` | 열두 하우스와 앵글 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 08 | `foundations.planet_sign_house` | 행성 × 사인 × 하우스 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 09 | `foundations.aspects` | 애스펙트: 행성 사이의 관계 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Canonical source는 `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md`, `08-planet-sign-house.md`, `09-aspects-relationships-between-planets.md`입니다. 영어 파일은 변경하지 않았습니다.

## 콘텐츠 계약 감사

- 각 lesson은 9개 top-level section과 정확히 2개의 이해도 확인 질문, 정답 2개와 해설 2개를 유지합니다.
- 하우스와 사인의 차이, ASC·DSC·MC·IC, Placidus·Whole Sign·Equal House, 빈 하우스, 행성×사인×하우스의 무엇·어떻게·어디에서 발판을 보존합니다.
- 애스펙트의 0°·180°·90°·120°·60° 목표, 오브, 어플라이잉·정확·세퍼레이팅, 기하와 해석의 분리를 보존합니다.
- 알려지지 않은 출생 시각에 정오나 자정을 대입하지 않고, 지원되지 않는 하우스·앵글·애스펙트를 만들지 않습니다.

## 용어 결정과 기록된 gap

| Concept | 적응 표현 | 경계 |
| --- | --- | --- |
| House / cusp / house system | `하우스` / `커스프` / `하우스 시스템` | 차트 공간의 관습이며 사건을 보장하지 않음. |
| Ascendant / Midheaven / zenith | `어센던트(ASC)` / `미드헤븐(MC)` / `천정` | MC와 천정을 구분하고 앵글은 시각·장소에 의존함. |
| Planet × Sign × House | `행성 × 사인 × 하우스` | 과학적 방정식이 아닌 제한된 학습 발판. |
| Aspect / orb | `애스펙트` / `오브` | 각도 관계와 허용 오차를 설명하며 보편적 점수가 아님. |
| Applying / exact / separating | `어플라이잉` / `정확` / `세퍼레이팅` | 결과가 반환할 때만 사용하는 단계 라벨. |

본문 안에서 지역 용어를 설명했지만 runtime glossary의 ID, alias, UI label, production field는 추가하지 않았습니다.

## 전문성 및 인식론 리뷰

전문적인 한국어, 기하학적 정확성, 인식론적 parity에 대해 독립적인 내부 검토를 실시했습니다. 독립 검토 이후 correction cycle은 `0`입니다. 하우스·앵글은 현지 시각과 장소에 의존하며, 애스펙트 각도는 차트 기하의 사실이고 의미는 관습적 해석이라는 경계를 유지했습니다.

Lesson 07은 ASC 쌍둥이자리 14°, DSC 사수자리 14°, MC 물병자리 3°, IC 사자자리 3°, 6하우스의 합성 예시를 보존합니다. Lesson 08은 수성 처녀자리 3하우스, 금성 천칭자리 10하우스, 화성 염소자리 6하우스의 워크시트를 보존합니다. Lesson 09는 2°, 180°, 90°, 120°, 60°의 애스펙트 표를 보존합니다.

## Source와 evidence lane

Canonical URL은 완전히 보존했습니다. 점성술 자료는 관습적 학습 맥락으로, NASA 자료는 황도·천구의 천문학적 맥락으로 사용했습니다. 외부 prose 복사, 자동 번역, lesson-side 계산은 수행하지 않았습니다. `PROVIDER DECISION DEFERRED`.

## 공개 gate와 runtime admission

이 batch의 내부 editorial 결과는 `READY_FOR_OWNER_APPROVAL`이었고, 한국어 Foundations V1 Lessons 01–12는 `WEB-LEARN-009` 범위에서 Product Owner의 승인을 받았습니다. Product Owner approval: `YES`. Runtime admission: `YES`. 기존 Foundations locale-aware path를 통해 세 lesson은 `APPROVED / CURRENT / AVAILABLE`입니다. Assessment approval과 reward approval은 `NO`입니다.

admission에서는 기존 Foundations locale-aware path의 content mapping과 imports만 확장했습니다. parallel loader, parallel registry, silent fallback, runtime translation layer는 만들지 않았습니다. Registry, route, UI, CSS, server, API, BFF, database, migration, Auth, Vault, Engine, provider, assessment, reward, 영어 본문은 변경하지 않았습니다.

## Correction history와 exact files

- Adaptation revision: `1`.
- 독립 내부 검토 이후 correction cycle: `0`.
- Product Owner approval: `YES` (한국어 Foundations V1 Lessons 01–12).
- Runtime admission: `YES`, runtime availability: `AVAILABLE`.

이 batch의 exact files:

1. `docs/content/foundations/v1/ko/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/ko/08-planet-sign-house.md`
3. `docs/content/foundations/v1/ko/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/ko/LESSONS_07_09_REVIEW.md`
