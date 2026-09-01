import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeFoundationsLesson,
  submitFoundationsAssessment,
  syncFoundationsProgress
} from '../dist/learn-foundations-authority-characterization/features/learn/foundations/authoritative-progress.js';
import {
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_LESSON_IDS,
  FOUNDATIONS_LESSONS
} from '../dist/learn-foundations-authority-characterization/features/learn/foundations/registry.js';
import {
  markFoundationsLessonComplete,
  markFoundationsLessonInProgress,
  readFoundationsProgress,
  writeFoundationsProgress
} from '../dist/learn-foundations-authority-characterization/features/learn/foundations/progress.js';

const ASSESSMENT_ID = 'foundations.v1.final_check';
const REWARD_SOURCE = 'LEARNING_FOUNDATIONS_V1';

function notEligibleReward() {
  return {
    status: 'NOT_ELIGIBLE',
    source: null,
    durationHours: null,
    grantedAt: null,
    startsAt: null,
    expiresAt: null
  };
}

function grantedReward() {
  return {
    status: 'GRANTED',
    source: REWARD_SOURCE,
    durationHours: 168,
    grantedAt: '2026-09-01T00:00:00.000Z',
    startsAt: '2026-09-01T00:00:00.000Z',
    expiresAt: '2026-09-08T00:00:00.000Z'
  };
}

function progressResponse(completedLessonIds = [], reward = notEligibleReward()) {
  return {
    authoritative: true,
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: 'v1',
    lessonCount: FOUNDATIONS_LESSONS.length,
    completedLessonIds,
    completedLessonCount: completedLessonIds.length,
    courseCompleted: completedLessonIds.length === FOUNDATIONS_LESSONS.length,
    passEver: reward.status === 'GRANTED',
    reward
  };
}

function attemptResponse(overrides = {}) {
  return {
    attemptId: 'attempt-1',
    courseId: FOUNDATIONS_COURSE_ID,
    assessmentId: ASSESSMENT_ID,
    assessmentRevision: 1,
    score: 8,
    correctCount: 8,
    passed: true,
    passEver: true,
    reward: notEligibleReward(),
    ...overrides
  };
}

function createStorage(initial = null) {
  let value = initial;
  return {
    getItem() {
      return value;
    },
    setItem(_key, next) {
      value = next;
    },
    value() {
      return value;
    }
  };
}

async function withBrowser(responses, callback, initialStorage = null) {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const storage = createStorage(initialStorage);
  const requests = [];
  let responseIndex = 0;

  globalThis.window = { localStorage: storage };
  globalThis.fetch = async (input, init = {}) => {
    requests.push({ input, init });
    const response = responses[responseIndex++];
    if (response === undefined) {
      throw new Error('Unexpected fetch request in characterization test.');
    }
    return new Response(
      response.body === undefined ? '' : JSON.stringify(response.body),
      {
        status: response.status ?? 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  };

  try {
    return await callback({ requests, storage });
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
    if (previousFetch === undefined) {
      delete globalThis.fetch;
    } else {
      globalThis.fetch = previousFetch;
    }
  }
}

function requestBody(request) {
  return JSON.parse(request.init.body);
}

test('anonymous synchronization remains browser-local and excludes in-progress lessons', async () => {
  await withBrowser(
    [{ body: { authenticated: false } }],
    async ({ requests, storage }) => {
      let progress = readFoundationsProgress();
      progress = markFoundationsLessonInProgress(progress, FOUNDATIONS_LESSON_IDS[0]);
      progress = markFoundationsLessonComplete(progress, FOUNDATIONS_LESSON_IDS[1]);
      writeFoundationsProgress(progress);

      const result = await syncFoundationsProgress();
      assert.equal(result.status, 'anonymous');
      assert.equal(result.authoritativeProgress, null);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].input, '/api/auth/session');
      assert.deepEqual(readFoundationsProgress().lessons, progress.lessons);
      assert.ok(storage.value());
    },
    null
  );
});

test('authenticated merge sends only local completed IDs and applies the server union after success', async () => {
  await withBrowser(
    [
      { body: { authenticated: true } },
      { body: progressResponse([FOUNDATIONS_LESSON_IDS[2]]) }
    ],
    async ({ requests }) => {
      let progress = readFoundationsProgress();
      progress = markFoundationsLessonInProgress(progress, FOUNDATIONS_LESSON_IDS[0]);
      progress = markFoundationsLessonComplete(progress, FOUNDATIONS_LESSON_IDS[1]);
      writeFoundationsProgress(progress);

      const result = await syncFoundationsProgress();
      const merge = requestBody(requests[1]);
      assert.equal(result.status, 'authenticated');
      assert.deepEqual(merge, {
        courseId: FOUNDATIONS_COURSE_ID,
        completedLessonIds: [FOUNDATIONS_LESSON_IDS[1]]
      });
      assert.deepEqual(result.authoritativeProgress.completedLessonIds, [FOUNDATIONS_LESSON_IDS[2]]);
      assert.equal(result.localProgress.lessons[FOUNDATIONS_LESSON_IDS[0]], 'IN_PROGRESS');
      assert.equal(result.localProgress.lessons[FOUNDATIONS_LESSON_IDS[1]], 'COMPLETED');
      assert.equal(result.localProgress.lessons[FOUNDATIONS_LESSON_IDS[2]], 'COMPLETED');
    },
    null
  );
});

test('failed authenticated merge does not overwrite the browser copy', async () => {
  await withBrowser(
    [{ body: { authenticated: true } }, { status: 503, body: {} }],
    async ({ storage }) => {
      let progress = readFoundationsProgress();
      progress = markFoundationsLessonComplete(progress, FOUNDATIONS_LESSON_IDS[3]);
      writeFoundationsProgress(progress);
      const before = storage.value();

      const result = await syncFoundationsProgress();
      assert.equal(result.status, 'unavailable');
      assert.equal(storage.value(), before);
      assert.equal(readFoundationsProgress().lessons[FOUNDATIONS_LESSON_IDS[3]], 'COMPLETED');
    },
    null
  );
});

test('authenticated completion sends no client authority fields and accepts only an authoritative response', async () => {
  await withBrowser(
    [
      {
        body: progressResponse([FOUNDATIONS_LESSON_IDS[4]], grantedReward())
      }
    ],
    async ({ requests }) => {
      const result = await completeFoundationsLesson(FOUNDATIONS_LESSON_IDS[4]);
      assert.deepEqual(requestBody(requests[0]), {
        courseId: FOUNDATIONS_COURSE_ID,
        lessonId: FOUNDATIONS_LESSON_IDS[4]
      });
      assert.equal(result.reward.status, 'GRANTED');
      assert.equal(readFoundationsProgress().lessons[FOUNDATIONS_LESSON_IDS[4]], 'COMPLETED');
    },
    null
  );
});

test('authenticated assessment submission sends stable answers only and preserves server score/pass/reward', async () => {
  await withBrowser(
    [{ body: attemptResponse({ reward: grantedReward() }) }],
    async ({ requests }) => {
      const answers = [
        { questionId: 'foundations.final_check.q01.chart_fact_interpretation', answerId: 'C' },
        { questionId: 'foundations.final_check.q02.sign_constellation_distinction', answerId: 'B' }
      ];
      const result = await submitFoundationsAssessment(answers);
      const body = requestBody(requests[0]);
      assert.deepEqual(body, {
        courseId: FOUNDATIONS_COURSE_ID,
        assessmentId: ASSESSMENT_ID,
        assessmentRevision: 1,
        answers
      });
      assert.equal(result.score, 8);
      assert.equal(result.passed, true);
      assert.equal(result.reward.source, REWARD_SOURCE);
      assert.equal(Object.hasOwn(body, 'userId'), false);
      assert.equal(Object.hasOwn(body, 'score'), false);
      assert.equal(Object.hasOwn(body, 'passed'), false);
      assert.equal(Object.hasOwn(body, 'rewardEligible'), false);
      assert.equal(Object.hasOwn(body, 'createdAt'), false);
    },
    null
  );
});

test('malformed authoritative responses are not accepted as browser authority', async () => {
  await withBrowser(
    [
      {
        body: progressResponse([FOUNDATIONS_LESSON_IDS[5]], {
          status: 'GRANTED',
          source: null,
          durationHours: null,
          grantedAt: null,
          startsAt: null,
          expiresAt: null
        })
      }
    ],
    async () => {
      await assert.rejects(
        completeFoundationsLesson(FOUNDATIONS_LESSON_IDS[5])
      );
    },
    null
  );
});
