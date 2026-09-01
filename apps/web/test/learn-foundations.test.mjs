import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  FOUNDATIONS_CANONICAL_LOCALE,
  FOUNDATIONS_CONTENT_VARIANTS,
  FOUNDATIONS_COURSE,
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_COURSE_VERSION,
  FOUNDATIONS_INITIAL_CONTENT_REVISION,
  FOUNDATIONS_LESSON_COUNT,
  FOUNDATIONS_LESSON_IDS,
  FOUNDATIONS_LESSONS,
  FOUNDATIONS_SECTION_IDS,
  FOUNDATIONS_MY_CHART_HOOK_IDS,
  getFoundationsAdjacentLessons,
  getFoundationsContentAvailability,
  getFoundationsContentVariant,
  isFoundationsCoreReady
} from '../dist/learn-foundations-characterization/features/learn/foundations/registry.js';
import {
  FOUNDATIONS_PROGRESS_SCHEMA_VERSION,
  FOUNDATIONS_PROGRESS_STORAGE_KEY,
  createInitialFoundationsProgress,
  getFoundationsCompletedLessonCount,
  getFoundationsLessonProgressState,
  getFoundationsResumeLessonId,
  markFoundationsLessonComplete,
  markFoundationsLessonIncomplete,
  markFoundationsLessonInProgress,
  parseFoundationsProgress,
  readFoundationsProgress,
  serializeFoundationsProgress,
  writeFoundationsProgress
} from '../dist/learn-foundations-characterization/features/learn/foundations/progress.js';
import { resolveAstrologyTerm } from '../dist/learn-foundations-characterization/lib/astrology-glossary.js';
import {
  FOUNDATIONS_FINAL_ASSESSMENT_ID,
  FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD,
  FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT,
  parseApprovedFoundationsAssessment,
  parseFoundationsAssessment,
  scoreFoundationsAssessment
} from '../dist/learn-foundations-characterization/features/learn/foundations/assessment/assessment-contract.js';

const CANONICAL_ASSESSMENT_MARKDOWN = readFileSync(
  new URL('../../../docs/content/foundations/v1/en/FINAL_ASSESSMENT.md', import.meta.url),
  'utf8'
);

const EXPECTED_LESSON_IDS = [
  'foundations.natal_chart',
  'foundations.zodiac_structure',
  'foundations.chart_calculation',
  'foundations.sun_moon',
  'foundations.mercury_venus_mars',
  'foundations.jupiter_saturn_outer_planets',
  'foundations.houses_angles',
  'foundations.planet_sign_house',
  'foundations.aspects',
  'foundations.chart_priorities',
  'foundations.whole_chart',
  'foundations.responsible_astrology'
];

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const LOCALIZED_ASSESSMENT_LOCALES = EXPECTED_LOCALES.slice(1);
const EXPECTED_ASSESSMENT_IDS = [
  'foundations.final_check.q01.chart_fact_interpretation',
  'foundations.final_check.q02.sign_constellation_distinction',
  'foundations.final_check.q03.unknown_birth_time',
  'foundations.final_check.q04.local_time_and_timezone',
  'foundations.final_check.q05.planet_sign_house_synthesis',
  'foundations.final_check.q06.major_aspect_geometry',
  'foundations.final_check.q07.houses_angles_cusps',
  'foundations.final_check.q08.prioritization_and_synthesis',
  'foundations.final_check.q09.precision_is_not_validation',
  'foundations.final_check.q10.responsible_use'
];

function wrongAnswer(question) {
  return question.options.find((option) => option.id !== question.correctAnswerId).id;
}

test('the Foundations registry contains one course and the exact frozen lesson backbone', () => {
  assert.deepEqual(FOUNDATIONS_COURSE, {
    courseFamilyId: 'foundations',
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: FOUNDATIONS_COURSE_VERSION,
    canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
    initialContentRevision: 1,
    lessonCount: FOUNDATIONS_LESSON_COUNT
  });
  assert.equal(FOUNDATIONS_LESSON_COUNT, 12);
  assert.deepEqual(FOUNDATIONS_LESSON_IDS, EXPECTED_LESSON_IDS);
  assert.deepEqual(
    FOUNDATIONS_LESSONS.map(({ lessonId }) => lessonId),
    EXPECTED_LESSON_IDS
  );
  assert.equal(new Set(FOUNDATIONS_LESSON_IDS).size, 12);
  assert.equal(new Set(FOUNDATIONS_LESSONS.map(({ slug }) => slug)).size, 12);
  assert.deepEqual(
    FOUNDATIONS_LESSONS.map(({ order }) => order),
    Array.from({ length: 12 }, (_, index) => index + 1)
  );
  assert.deepEqual(FOUNDATIONS_SECTION_IDS, [
    'orientation',
    'core_concept',
    'professional_vocabulary',
    'example',
    'my_chart',
    'practice',
    'check_understanding',
    'key_takeaway'
  ]);
  assert.equal(FOUNDATIONS_MY_CHART_HOOK_IDS.length, 12);
  assert.equal(FOUNDATIONS_LESSONS.every((lesson) => !('prerequisiteLessonId' in lesson)), true);
});

test('previous and next lessons derive from the frozen order without access locks', () => {
  for (let index = 0; index < FOUNDATIONS_LESSONS.length; index += 1) {
    const lesson = FOUNDATIONS_LESSONS[index];
    const adjacent = getFoundationsAdjacentLessons(lesson.lessonId);

    assert.equal(adjacent.previous?.lessonId ?? null, EXPECTED_LESSON_IDS[index - 1] ?? null);
    assert.equal(adjacent.next?.lessonId ?? null, EXPECTED_LESSON_IDS[index + 1] ?? null);
    assert.equal(lesson.courseId, FOUNDATIONS_COURSE_ID);
    assert.equal(lesson.courseVersion, FOUNDATIONS_COURSE_VERSION);
  }

  assert.deepEqual(getFoundationsAdjacentLessons('unknown'), {
    previous: null,
    next: null
  });
});

test('locale changes presentation variants, never semantic lesson identity', () => {
  for (const lesson of FOUNDATIONS_LESSONS) {
    for (const locale of EXPECTED_LOCALES) {
      const variant = getFoundationsContentVariant(lesson.lessonId, locale);
      assert.equal(variant?.lessonId, lesson.lessonId);
      assert.equal(variant?.courseId, FOUNDATIONS_COURSE_ID);
      assert.equal(variant?.locale, locale);
    }
  }
});

test('anonymous progress starts untouched, opens explicitly, completes explicitly, and remains reversible', () => {
  const initial = createInitialFoundationsProgress();
  assert.equal(Object.keys(initial.lessons).length, 12);
  assert.equal(Object.values(initial.lessons).every((state) => state === 'NOT_STARTED'), true);
  assert.equal(getFoundationsCompletedLessonCount(initial), 0);
  assert.equal(getFoundationsResumeLessonId(initial), EXPECTED_LESSON_IDS[0]);

  const opened = markFoundationsLessonInProgress(initial, EXPECTED_LESSON_IDS[0]);
  assert.equal(getFoundationsLessonProgressState(opened, EXPECTED_LESSON_IDS[0]), 'IN_PROGRESS');
  assert.equal(getFoundationsCompletedLessonCount(opened), 0);
  assert.equal(getFoundationsResumeLessonId(opened), EXPECTED_LESSON_IDS[0]);

  const completed = markFoundationsLessonComplete(opened, EXPECTED_LESSON_IDS[0]);
  assert.equal(getFoundationsLessonProgressState(completed, EXPECTED_LESSON_IDS[0]), 'COMPLETED');
  assert.equal(getFoundationsCompletedLessonCount(completed), 1);
  assert.equal(getFoundationsResumeLessonId(completed), EXPECTED_LESSON_IDS[1]);

  const reopened = markFoundationsLessonIncomplete(completed, EXPECTED_LESSON_IDS[0]);
  assert.equal(getFoundationsLessonProgressState(reopened, EXPECTED_LESSON_IDS[0]), 'IN_PROGRESS');
  assert.equal(getFoundationsCompletedLessonCount(reopened), 0);
  assert.equal(markFoundationsLessonComplete(initial, 'unknown'), initial);
});

test('resume chooses first in-progress, then first not-started, then completed state', () => {
  let progress = createInitialFoundationsProgress();
  progress = markFoundationsLessonComplete(progress, EXPECTED_LESSON_IDS[0]);
  progress = markFoundationsLessonInProgress(progress, EXPECTED_LESSON_IDS[3]);
  progress = markFoundationsLessonInProgress(progress, EXPECTED_LESSON_IDS[1]);
  assert.equal(getFoundationsResumeLessonId(progress), EXPECTED_LESSON_IDS[1]);

  for (const lessonId of EXPECTED_LESSON_IDS.slice(1)) {
    progress = markFoundationsLessonComplete(progress, lessonId);
  }

  assert.equal(getFoundationsCompletedLessonCount(progress), 12);
  assert.equal(getFoundationsResumeLessonId(progress), null);
});

test('versioned local storage safely recovers malformed, partial, unknown, and mismatched records', () => {
  for (const raw of [null, '', 'not-json', '{}', '[]', JSON.stringify({ schemaVersion: 99 })]) {
    const recovered = parseFoundationsProgress(raw);
    assert.deepEqual(recovered, createInitialFoundationsProgress(), String(raw));
  }

  const partial = parseFoundationsProgress(JSON.stringify({
    schemaVersion: FOUNDATIONS_PROGRESS_SCHEMA_VERSION,
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: FOUNDATIONS_COURSE_VERSION,
    lessons: {
      [EXPECTED_LESSON_IDS[0]]: 'COMPLETED',
      [EXPECTED_LESSON_IDS[1]]: 'invalid',
      'foundations.removed_lesson': 'COMPLETED'
    },
    birthDate: '1990-01-01',
    chart: { fake: true }
  }));

  assert.equal(getFoundationsLessonProgressState(partial, EXPECTED_LESSON_IDS[0]), 'COMPLETED');
  assert.equal(getFoundationsLessonProgressState(partial, EXPECTED_LESSON_IDS[1]), 'NOT_STARTED');
  assert.equal(Object.keys(partial.lessons).includes('foundations.removed_lesson'), false);
  assert.equal(parseFoundationsProgress(JSON.stringify({
    schemaVersion: 1,
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: 'v0',
    lessons: { [EXPECTED_LESSON_IDS[0]]: 'COMPLETED' }
  })).lessons[EXPECTED_LESSON_IDS[0]], 'NOT_STARTED');
});

test('browser storage is best effort and serialization contains only minimal progress fields', () => {
  let storedKey = null;
  let storedValue = null;
  const storage = {
    getItem(key) {
      assert.equal(key, FOUNDATIONS_PROGRESS_STORAGE_KEY);
      return storedValue;
    },
    setItem(key, value) {
      storedKey = key;
      storedValue = value;
    }
  };

  let progress = markFoundationsLessonComplete(
    createInitialFoundationsProgress(),
    EXPECTED_LESSON_IDS[0]
  );
  assert.equal(writeFoundationsProgress(progress, storage), true);
  assert.equal(storedKey, FOUNDATIONS_PROGRESS_STORAGE_KEY);
  const persisted = JSON.parse(storedValue);
  assert.deepEqual(Object.keys(persisted).sort(), ['courseId', 'courseVersion', 'lessons', 'schemaVersion']);
  for (const forbiddenKey of [
    'birthDate',
    'birthTime',
    'birthPlace',
    'location',
    'timezone',
    'chart',
    'engineResponse',
    'entitlement'
  ]) {
    assert.equal(Object.hasOwn(persisted, forbiddenKey), false, forbiddenKey);
  }
  assert.deepEqual(readFoundationsProgress(storage), progress);

  const throwingStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    }
  };
  assert.deepEqual(readFoundationsProgress(throwingStorage), createInitialFoundationsProgress());
  assert.equal(writeFoundationsProgress(progress, throwingStorage), false);
  assert.deepEqual(JSON.parse(serializeFoundationsProgress(progress)), persisted);
});

test('content governance admits all frozen locales without silent fallback', () => {
  assert.equal(isFoundationsCoreReady(), true);

  const admittedRevisions = new Map([
    ['foundations.natal_chart', 3],
    ['foundations.zodiac_structure', 2],
    ['foundations.chart_calculation', 2],
    ['foundations.sun_moon', 1],
    ['foundations.mercury_venus_mars', 1],
    ['foundations.jupiter_saturn_outer_planets', 1],
    ['foundations.houses_angles', 1],
    ['foundations.planet_sign_house', 1],
    ['foundations.aspects', 1],
    ['foundations.chart_priorities', 1],
    ['foundations.whole_chart', 1],
    ['foundations.responsible_astrology', 1]
  ]);

  const admittedLocalizedRevisions = {
    es: [1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1],
    fr: [1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1],
    de: [1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1],
    ja: [1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1],
    ko: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  };

  assert.equal(
    FOUNDATIONS_LESSONS.find((lesson) => lesson.lessonId === 'foundations.zodiac_structure').title,
    'The Zodiac: Elements and Modes'
  );

  for (const lesson of FOUNDATIONS_LESSONS) {
    const english = FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId].en;
    assert.equal(english.contentState, 'APPROVED');
    assert.equal(english.currentness, 'CURRENT');
    assert.equal(getFoundationsContentAvailability(english), 'AVAILABLE');

    if (admittedRevisions.has(lesson.lessonId)) {
      assert.equal(english.contentRevision, admittedRevisions.get(lesson.lessonId));
      assert.equal(english.canonicalContentRevision, admittedRevisions.get(lesson.lessonId));
      assert.equal(english.contentKind, 'CANONICAL');
    } else {
      assert.equal(english.contentRevision, FOUNDATIONS_INITIAL_CONTENT_REVISION);
      assert.equal(english.canonicalContentRevision, FOUNDATIONS_INITIAL_CONTENT_REVISION);
      assert.equal(english.contentKind, 'SCAFFOLD');
    }

    for (const locale of EXPECTED_LOCALES.slice(1, -1)) {
      const variant = FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId][locale];
      assert.equal(variant.contentState, 'APPROVED');
      assert.equal(variant.currentness, 'CURRENT');
      assert.equal(variant.contentKind, 'CANONICAL');
      assert.equal(variant.contentRevision, admittedLocalizedRevisions[locale][lesson.order - 1]);
      assert.equal(variant.canonicalContentRevision, english.canonicalContentRevision);
      assert.equal(getFoundationsContentAvailability(variant), 'AVAILABLE');
      assert.equal('learningObjectives' in variant, true);
      assert.notEqual(variant.locale, 'en');
    }

    const zhHant = FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId]['zh-Hant'];
    assert.equal(zhHant.contentState, 'APPROVED');
    assert.equal(zhHant.currentness, 'CURRENT');
    assert.equal(zhHant.contentKind, 'CANONICAL');
    assert.equal(getFoundationsContentAvailability(zhHant), 'AVAILABLE');
    assert.equal(zhHant.locale, 'zh-Hant');
  }

  const english = getFoundationsContentVariant(EXPECTED_LESSON_IDS[0], 'en');
  const spanish = getFoundationsContentVariant(EXPECTED_LESSON_IDS[0], 'es');
  assert.equal(english.contentKind, 'CANONICAL');
  assert.equal(getFoundationsContentAvailability(english), 'AVAILABLE');
  assert.equal(spanish.contentKind, 'CANONICAL');
  assert.equal(getFoundationsContentAvailability(spanish), 'AVAILABLE');
  assert.notEqual(spanish.locale, 'en');

  const zhHant = getFoundationsContentVariant(EXPECTED_LESSON_IDS[0], 'zh-Hant');
  assert.equal(zhHant.contentKind, 'CANONICAL');
  assert.equal(getFoundationsContentAvailability(zhHant), 'AVAILABLE');

  for (const contentState of ['DRAFT', 'REVIEW', 'APPROVED']) {
    assert.equal(
      getFoundationsContentAvailability({ ...english, contentState, currentness: 'OUTDATED' }),
      'UNAVAILABLE'
    );
  }
  assert.equal(
    getFoundationsContentAvailability({ ...english, contentState: 'DRAFT', currentness: 'CURRENT' }),
    'UNAVAILABLE'
  );

  const availableMatrixCells = FOUNDATIONS_LESSONS.reduce(
    (count, lesson) => count + EXPECTED_LOCALES.filter((locale) => (
      getFoundationsContentAvailability(
        FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId][locale]
      ) === 'AVAILABLE'
    )).length,
    0
  );
  assert.equal(availableMatrixCells, 84);
});

test('the final canonical-English batch remains compatible with all admitted locale gates', () => {
  const finalBatch = [
    'foundations.chart_priorities',
    'foundations.whole_chart',
    'foundations.responsible_astrology'
  ];

  for (const lessonId of finalBatch) {
    const english = getFoundationsContentVariant(lessonId, 'en');
    assert.equal(english?.contentState, 'APPROVED');
    assert.equal(english?.currentness, 'CURRENT');
    assert.equal(english?.contentKind, 'CANONICAL');
    assert.equal(english?.contentRevision, 1);
    assert.equal(english?.canonicalContentRevision, 1);
    assert.equal(getFoundationsContentAvailability(english), 'AVAILABLE');

    for (const locale of EXPECTED_LOCALES.slice(1, -1)) {
      const localized = getFoundationsContentVariant(lessonId, locale);
      assert.equal(localized?.locale, locale);
      assert.equal(localized?.contentState, 'APPROVED');
      assert.equal(localized?.currentness, 'CURRENT');
      assert.equal(localized?.contentKind, 'CANONICAL');
      assert.equal(getFoundationsContentAvailability(localized), 'AVAILABLE');
    }

    const zhHant = getFoundationsContentVariant(lessonId, 'zh-Hant');
    assert.equal(zhHant?.contentState, 'APPROVED');
    assert.equal(zhHant?.currentness, 'CURRENT');
    assert.equal(zhHant?.contentKind, 'CANONICAL');
    assert.equal(getFoundationsContentAvailability(zhHant), 'AVAILABLE');
  }

  const canonicalEnglishCount = FOUNDATIONS_LESSONS.filter((lesson) => {
    const variant = getFoundationsContentVariant(lesson.lessonId, 'en');
    return variant?.contentKind === 'CANONICAL' && getFoundationsContentAvailability(variant) === 'AVAILABLE';
  }).length;

  assert.equal(canonicalEnglishCount, 12);
  assert.equal(FOUNDATIONS_COURSE.lessonCount, 12);
  assert.equal(isFoundationsCoreReady(), true);
  assert.equal(getFoundationsContentVariant(finalBatch[0], 'es')?.locale, 'es');
  assert.equal(getFoundationsContentAvailability(getFoundationsContentVariant(finalBatch[0], 'es')), 'AVAILABLE');
});

test('professional vocabulary resolves through the shared production glossary', () => {
  const sunLesson = FOUNDATIONS_LESSONS.find((lesson) => lesson.lessonId === 'foundations.sun_moon');
  assert.equal(sunLesson.glossaryConceptIds.includes('body.sun'), true);
  assert.equal(resolveAstrologyTerm('body.sun', 'es').displayTerm, 'Sol');
  assert.equal(resolveAstrologyTerm('body.sun', 'ja').displayTerm, '太陽');
  assert.equal(resolveAstrologyTerm('body.sun', 'ja').fallbackUsed, false);
  assert.equal(resolveAstrologyTerm('body.sun', 'ja').availability, 'LOCALIZED_APPROVED_CURRENT');
});

test('the approved canonical assessment is loaded from one artifact with the frozen contract', () => {
  const assessment = parseApprovedFoundationsAssessment(CANONICAL_ASSESSMENT_MARKDOWN);

  assert.equal(assessment.locale, 'en');
  assert.equal(assessment.checkId, FOUNDATIONS_FINAL_ASSESSMENT_ID);
  assert.equal(assessment.contentState, 'APPROVED');
  assert.equal(assessment.currentness, 'CURRENT');
  assert.equal(assessment.runtimeAvailability, 'AVAILABLE');
  assert.equal(assessment.questionCount, FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT);
  assert.equal(assessment.passThreshold, FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD);
  assert.equal(assessment.retryPolicy, 'unlimited');
  assert.deepEqual(assessment.questions.map((question) => question.id), EXPECTED_ASSESSMENT_IDS);
  assert.deepEqual(assessment.questions.map((question) => question.correctAnswerId), [
    'C', 'B', 'A', 'D', 'B', 'C', 'A', 'D', 'C', 'B'
  ]);
  assert.equal(assessment.questions.every((question) => question.options.length === 4), true);
  assert.equal(Object.isFrozen(assessment), true);
  assert.equal(Object.isFrozen(assessment.questions), true);
  assert.equal(Object.isFrozen(assessment.questions[0]), true);
  assert.equal(Object.isFrozen(assessment.questions[0].options), true);
});

test('assessment scoring enforces answer identity, threshold, retryability, and no lesson/Core side effects', () => {
  const assessment = parseApprovedFoundationsAssessment(CANONICAL_ASSESSMENT_MARKDOWN);
  const initialProgress = createInitialFoundationsProgress();
  const correctAnswers = Object.fromEntries(
    assessment.questions.map((question) => [question.id, question.correctAnswerId])
  );
  const sevenAnswers = Object.fromEntries(
    assessment.questions.map((question, index) => [
      question.id,
      index < 7 ? question.correctAnswerId : wrongAnswer(question)
    ])
  );
  const eightAnswers = Object.fromEntries(
    assessment.questions.map((question, index) => [
      question.id,
      index < 8 ? question.correctAnswerId : wrongAnswer(question)
    ])
  );

  assert.equal(scoreFoundationsAssessment(assessment, correctAnswers).score, 10);
  assert.equal(scoreFoundationsAssessment(assessment, correctAnswers).passed, true);
  assert.equal(scoreFoundationsAssessment(assessment, eightAnswers).score, 8);
  assert.equal(scoreFoundationsAssessment(assessment, eightAnswers).passed, true);
  assert.equal(scoreFoundationsAssessment(assessment, sevenAnswers).score, 7);
  assert.equal(scoreFoundationsAssessment(assessment, sevenAnswers).passed, false);
  assert.equal(scoreFoundationsAssessment(assessment, { score: 10 }).score, 0);
  assert.equal(scoreFoundationsAssessment(assessment, {}).answeredCount, 0);

  const firstAttempt = scoreFoundationsAssessment(assessment, sevenAnswers);
  const retryAttempt = scoreFoundationsAssessment(assessment, correctAnswers);
  assert.equal(firstAttempt.passed, false);
  assert.equal(retryAttempt.passed, true);
  assert.deepEqual(initialProgress, createInitialFoundationsProgress());
  assert.equal(Object.isFrozen(retryAttempt), true);
  assert.equal(Object.isFrozen(retryAttempt.answers), true);
  assert.equal(Object.isFrozen(retryAttempt.correctQuestionIds), true);
});

test('all localized assessment artifacts are approved, admitted, and served without fallback', () => {
  const canonical = parseApprovedFoundationsAssessment(CANONICAL_ASSESSMENT_MARKDOWN);
  const assessmentRoute = readFileSync(
    new URL('../src/pages/[locale]/learn/foundations/check/index.astro', import.meta.url),
    'utf8'
  );
  const assessmentContentRuntime = readFileSync(
    new URL('../src/features/learn/foundations/assessment/assessment-content.ts', import.meta.url),
    'utf8'
  );
  const assessmentExperience = readFileSync(
    new URL('../src/features/learn/foundations/assessment/FoundationsAssessmentExperience.tsx', import.meta.url),
    'utf8'
  );
  let totalQuestions = 0;
  let totalAnswerParities = 0;

  assert.match(assessmentRoute, /getFoundationsAssessment/u);
  assert.match(assessmentRoute, /englishAssessment=\{FOUNDATIONS_FINAL_ASSESSMENT\}/u);
  assert.match(assessmentRoute, /showEnglishContent/u);
  assert.match(assessmentRoute, /searchParams\.get\('contentLocale'\).*=== 'en'/u);
  assert.match(assessmentExperience, /finalAssessmentUnavailable/u);
  assert.match(assessmentContentRuntime, /assertCanonicalAnswerIdentity/u);
  assert.match(assessmentContentRuntime, /parseApprovedFoundationsAssessment/u);
  assert.match(assessmentContentRuntime, /runtimeAvailability === 'AVAILABLE'/u);
  assert.doesNotMatch(assessmentContentRuntime, /FOUNDATIONS_FINAL_ASSESSMENTS\.en\s*\|\|/u);

  for (const locale of LOCALIZED_ASSESSMENT_LOCALES) {
    const content = readFileSync(
      new URL(`../../../docs/content/foundations/v1/${locale}/FINAL_ASSESSMENT.md`, import.meta.url),
      'utf8'
    );
    const review = readFileSync(
      new URL(`../../../docs/content/foundations/v1/${locale}/FINAL_ASSESSMENT_REVIEW.md`, import.meta.url),
      'utf8'
    );
    const assessment = parseApprovedFoundationsAssessment(content);

    assert.equal(assessment.locale, locale);
    assert.equal(assessment.canonicalLocale, 'en');
    assert.equal(assessment.contentRevision, 1);
    assert.equal(assessment.contentState, 'APPROVED');
    assert.equal(assessment.currentness, 'CURRENT');
    assert.equal(assessment.runtimeAvailability, 'AVAILABLE');
    assert.equal(assessment.questionCount, 10);
    assert.equal(assessment.passThreshold, 8);
    assert.equal(assessment.retryPolicy, 'unlimited');
    assert.deepEqual(assessment.questions.map((question) => question.id), EXPECTED_ASSESSMENT_IDS);
    assert.deepEqual(
      assessment.questions.map((question) => question.correctAnswerId),
      canonical.questions.map((question) => question.correctAnswerId)
    );
    assert.deepEqual(
      assessment.questions.map((question) => question.linkedLessonIds),
      canonical.questions.map((question) => question.linkedLessonIds)
    );
    assert.equal(Object.isFrozen(assessment), true);
    assert.equal(Object.isFrozen(assessment.questions), true);

    assert.match(content, /^canonicalContentRevision: 1$/mu);
    assert.match(content, /^adaptationRevision: 1$/mu);
    assert.match(content, /^productOwnerApproval: YES$/mu);
    assert.match(content, /^runtimeAdmission: YES$/mu);
    assert.match(content, /^contentState: APPROVED$/mu);
    assert.match(content, /^runtimeAvailability: AVAILABLE$/mu);
    assert.doesNotMatch(content, /^(?:birthDate|birthTime|birthPlace|chart):/mu);

    assert.match(review, new RegExp(`^locale: ${locale}$`, 'mu'));
    assert.match(review, /^contentState: APPROVED$/mu);
    assert.match(review, /^currentness: CURRENT$/mu);
    assert.match(review, /^runtimeAvailability: AVAILABLE$/mu);
    assert.match(review, /^productOwnerApproval: YES$/mu);
    assert.match(review, /^runtimeAdmission: YES$/mu);
    assert.match(review, /^reviewType: FRESH_BILINGUAL_PROFESSIONAL_REVIEW$/mu);
    assert.match(review, /^reviewVerdict: PASS_WITHOUT_BLOCKERS$/mu);
    assert.match(review, /^finalVerdict: APPROVED_FOR_RUNTIME$/mu);
    assert.doesNotMatch(review, /^contentState: REVIEW$/mu);
    assert.doesNotMatch(review, /^runtimeAvailability: UNAVAILABLE$/mu);
    assert.doesNotMatch(review, /READY_FOR_CONSOLIDATED_OWNER_APPROVAL/u);

    totalQuestions += assessment.questions.length;
    totalAnswerParities += assessment.questions.filter(
      (question, index) => question.correctAnswerId === canonical.questions[index].correctAnswerId
    ).length;
  }

  assert.equal(totalQuestions, 60);
  assert.equal(totalAnswerParities, 60);
});
