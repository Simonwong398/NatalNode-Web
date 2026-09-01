import assert from 'node:assert/strict';
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

test('content governance admits only approved canonical English lessons and never silently falls back', () => {
  assert.equal(isFoundationsCoreReady(), false);

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

    for (const locale of EXPECTED_LOCALES.slice(1)) {
      const variant = FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId][locale];
      assert.equal(variant.contentState, 'MISSING');
      assert.equal(variant.currentness, 'OUTDATED');
      assert.equal(getFoundationsContentAvailability(variant), 'UNAVAILABLE');
      assert.equal('learningObjectives' in variant, false);
      assert.notEqual(variant.locale, 'en');
    }
  }

  const english = getFoundationsContentVariant(EXPECTED_LESSON_IDS[0], 'en');
  const spanish = getFoundationsContentVariant(EXPECTED_LESSON_IDS[0], 'es');
  assert.equal(english.contentKind, 'CANONICAL');
  assert.equal(getFoundationsContentAvailability(english), 'AVAILABLE');
  assert.equal(getFoundationsContentAvailability(spanish), 'UNAVAILABLE');
  assert.notEqual(spanish.locale, 'en');

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
});

test('the final canonical-English batch is admitted without changing locale or course gates', () => {
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

    for (const locale of EXPECTED_LOCALES.slice(1)) {
      const localized = getFoundationsContentVariant(lessonId, locale);
      assert.equal(localized?.locale, locale);
      assert.equal(localized?.contentState, 'MISSING');
      assert.equal(localized?.currentness, 'OUTDATED');
      assert.equal(getFoundationsContentAvailability(localized), 'UNAVAILABLE');
    }
  }

  const canonicalEnglishCount = FOUNDATIONS_LESSONS.filter((lesson) => {
    const variant = getFoundationsContentVariant(lesson.lessonId, 'en');
    return variant?.contentKind === 'CANONICAL' && getFoundationsContentAvailability(variant) === 'AVAILABLE';
  }).length;

  assert.equal(canonicalEnglishCount, 12);
  assert.equal(FOUNDATIONS_COURSE.lessonCount, 12);
  assert.equal(isFoundationsCoreReady(), false);
  assert.equal(getFoundationsContentVariant(finalBatch[0], 'es')?.locale, 'es');
  assert.equal(getFoundationsContentAvailability(getFoundationsContentVariant(finalBatch[0], 'es')), 'UNAVAILABLE');
});

test('professional vocabulary resolves through the shared production glossary', () => {
  const sunLesson = FOUNDATIONS_LESSONS.find((lesson) => lesson.lessonId === 'foundations.sun_moon');
  assert.equal(sunLesson.glossaryConceptIds.includes('body.sun'), true);
  assert.equal(resolveAstrologyTerm('body.sun', 'es').displayTerm, 'Sol');
  assert.equal(resolveAstrologyTerm('body.sun', 'ja').displayTerm, '太陽');
  assert.equal(resolveAstrologyTerm('body.sun', 'ja').fallbackUsed, false);
  assert.equal(resolveAstrologyTerm('body.sun', 'ja').availability, 'LOCALIZED_APPROVED_CURRENT');
});
