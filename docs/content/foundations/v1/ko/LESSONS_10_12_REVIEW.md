---
title: "Foundations V1 ko Lessons 10–12 Review Manifest"
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

# Foundations V1 ko Lessons 10–12 Review Manifest

## 범위와 상태

이 manifest는 한국어 Foundations V1의 마지막 batch인 차트 우선순위, 전체 차트 종합, 책임 있는 사용을 기록합니다. 세 lesson은 Class C 문서로 완성되었고 `WEB-LEARN-009`에 따라 Product Owner approval과 runtime admission이 완료되었습니다.

각 lesson은 `contentRevision: 1`, `canonicalContentRevision: 1`을 유지하며, `WEB-LEARN-009`에 따른 runtime admission 후 `contentState: APPROVED`, `currentness: CURRENT`, `runtimeAvailability: AVAILABLE`입니다.

## Lesson identity

| Lesson | Lesson ID | 한국어 제목 | Canonical revision | Adaptation | 상태 | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 10 | `foundations.chart_priorities` | 차트에서 먼저 볼 것은 무엇인가 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 11 | `foundations.whole_chart` | 차트 전체 읽기 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 12 | `foundations.responsible_astrology` | 책임 있게 점성술 사용하기 | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Canonical source는 `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md`, `11-reading-the-chart-as-a-whole.md`, `12-using-astrology-responsibly.md`입니다.

## 콘텐츠 계약 감사

- 각 lesson은 9개 top-level section, 정확히 2개의 이해도 확인 질문, 정답 2개와 해설 2개를 유지합니다.
- Lesson 10은 점수·순위·수치 가중치가 아니라 입력의 질과 사실, 지원되는 구조, 반복 주제, 가까운 애스펙트, 멈춤 규칙의 순서를 유지합니다.
- Lesson 11은 7단계 종합, 사실·주제·맥락의 구분, 중립적인 긴장, 근거 경계에서 멈추는 규칙을 유지합니다.
- Lesson 12는 사실·관습·불확실성, 진단과 고위험 판단의 거부, 동의, 사생활, 제3자, 어린이, 주체성, 전문성의 경계를 유지합니다.

## 용어 결정과 기록된 gap

| Concept | 적응 표현 | 경계 |
| --- | --- | --- |
| Prioritization / stopping rule | `우선순위` / `멈춤 규칙` | 관찰의 순서이지 점수가 아님. |
| Whole-chart synthesis / theme | `전체 차트 종합` / `주제` | 사실을 연결하지만 사람 전체를 설명하지 않음. |
| Tension / support | `긴장` / `지원` | 가능한 읽기를 중립적으로 표현함. |
| Fact / convention / uncertainty | `사실` / `관습` / `불확실성` | 세 층을 명시적으로 구분함. |
| Consent / privacy / agency | `동의` / `사생활` / `주체성` | 실제 실천과 자율성을 보호함. |

본문의 용어이며 runtime glossary의 ID, capability, hook, API field는 추가하지 않았습니다. `PROVIDER DECISION DEFERRED`.

## 전문성, 인식론, 기하학 리뷰

전문적인 편집과 인식론적 parity에 대해 독립적인 내부 검토를 실시했습니다. 독립 검토 이후 correction cycle은 `0`입니다. 우선순위를 score로 만들지 않았고, 종합을 키워드의 나열로 만들지 않았으며, Lesson 12의 책임 경계를 약화하지 않았습니다.

Lesson 10은 태양 황소자리 20°=50°, 달 사자자리 20°=140°, 90° 스퀘어의 합성 조각을 유지합니다. Lesson 11은 같은 기하와 태양 황소자리 20°, 달 사자자리 20°, 수성 쌍둥이자리 5°, 태양–달 스퀘어의 예시를 유지합니다. Lesson 12에는 새로운 도수를 추가하지 않았습니다.

출생 시각을 모를 때 하우스나 앵글을 만들지 않았습니다. 데이터를 더 강하게 보이게 하려는 조작, 진단, 감시, 압력, 타인을 대신한 결정도 추가하지 않았습니다.

## Final locale gate

열두 lesson 전체의 내부 editorial gate는 `READY_FOR_OWNER_APPROVAL`입니다.

| Finding | Result |
| --- | ---: |
| `BLOCKER` | 0 |
| `MAJOR` | 0 |
| `MINOR` | 0 |
| `EDITORIAL_NOTE` | 0 |
| 완료한 lesson | 12 / 12 |

이는 Product Owner review를 거쳐 승인된 상태를 뜻합니다. 한국어 Foundations V1 Lessons 01–12의 Product Owner approval은 `YES`, Runtime admission은 `YES`입니다. 기존 Foundations locale-aware path를 통해 모든 한국어 lesson은 `APPROVED / CURRENT / AVAILABLE`입니다. Assessment approval과 reward approval은 `NO`입니다.

## Source, correction, scope integrity

세 lesson의 canonical URL을 완전히 보존했습니다. 점성술 자료는 curriculum 맥락에 사용했고 외부 prose를 복사하지 않았습니다. 광범위한 web research도 수행하지 않았습니다. product canon, architecture, localization policy가 state, fallback, 공개를 통제합니다.

admission에서는 기존 Foundations locale-aware path의 content mapping과 imports만 확장했고, 새 loader, parallel registry, fallback, runtime translation layer는 추가하지 않았습니다. UI, CSS, server, API, BFF, database, migration, Auth, Vault, Commercial, Engine, provider, assessment, reward, renderer, 영어, 다른 locale은 변경하지 않았습니다. 자동 번역이나 P1/P2/P3 기능도 추가하지 않았습니다.

## Correction history와 exact files

- Adaptation revision: `1` (Lesson 10–12).
- 독립 내부 검토 이후 correction cycle: `0`.
- Product Owner approval: `YES` (한국어 Foundations V1 Lessons 01–12).
- Runtime admission: `YES`, runtime availability: `AVAILABLE`.

이 batch의 exact files:

1. `docs/content/foundations/v1/ko/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/ko/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/ko/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/ko/LESSONS_10_12_REVIEW.md`
