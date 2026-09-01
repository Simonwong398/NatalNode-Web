import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import {
  COMMUNITY_ANSWER_BODY_MAXIMUM_CHARACTERS,
  COMMUNITY_ANSWER_BODY_MINIMUM_CHARACTERS,
  COMMUNITY_DISPLAY_NAME_MAXIMUM_CHARACTERS,
  COMMUNITY_DISPLAY_NAME_MINIMUM_CHARACTERS,
  COMMUNITY_PAGE_DEFAULT_SIZE,
  COMMUNITY_PAGE_MAXIMUM_SIZE,
  COMMUNITY_MODERATION_REASON_CODES,
  COMMUNITY_REPORT_CATEGORIES,
  COMMUNITY_QUESTION_BODY_MAXIMUM_CHARACTERS,
  COMMUNITY_QUESTION_BODY_MINIMUM_CHARACTERS,
  COMMUNITY_QUESTION_TITLE_MAXIMUM_CHARACTERS,
  COMMUNITY_QUESTION_TITLE_MINIMUM_CHARACTERS,
  COMMUNITY_REPORT_DETAILS_MAXIMUM_CHARACTERS,
  COMMUNITY_TOPIC_IDS,
  isValidCommunityAnswerBody,
  isValidCommunityDisplayName,
  isValidCommunityQuestionBody,
  isValidCommunityQuestionTitle,
  isValidCommunityReportDetails,
  normalizeCommunityDisplayName,
  normalizeCommunityText
} from '../dist/community/community-domain.js';
import {
  normalizeCreateCommunityQuestionRequest,
  normalizeCreateCommunityReportRequest,
  normalizeUpdateCommunityQuestionRequest,
  parseCommunityPageQuery
} from '../dist/app/validation/community.js';
import {
  P0_STAGING_RATE_LIMIT_POLICIES,
  selectP0StagingRateLimitPolicy
} from '../dist/app/security/api-rate-limiting.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const SESSION_CREATED_AT = '2026-08-31T00:00:00.000Z';
const NOW = '2026-08-31T12:00:00.000Z';
const REPOSITORY_ROOT = new URL('../../', import.meta.url);

const PROBLEM_TITLE_BY_STATUS = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error'
};

function createQuestion(input, displayName) {
  return {
    questionId: input.questionId,
    authorUserId: input.authorUserId,
    anonymizedAuthorLabel: null,
    authorDisplayName: displayName,
    title: input.title,
    body: input.body,
    topicId: input.topicId,
    status: 'VISIBLE',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: null,
    retentionExpiresAt: null,
    retentionHold: 'NONE'
  };
}

function createAnswer(input, displayName) {
  return {
    answerId: input.answerId,
    questionId: input.questionId,
    authorUserId: input.authorUserId,
    anonymizedAuthorLabel: null,
    authorDisplayName: displayName,
    body: input.body,
    status: 'VISIBLE',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: null,
    retentionExpiresAt: null,
    retentionHold: 'NONE'
  };
}

function encodeCursor(question) {
  return Buffer.from(
    JSON.stringify({ createdAt: question.createdAt, questionId: question.questionId }),
    'utf8'
  ).toString('base64url');
}

function sortQuestions(questions) {
  return [...questions].sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      right.questionId.localeCompare(left.questionId)
  );
}

class InMemoryCommunityRepository {
  profiles = new Map();
  questions = new Map();
  answers = new Map();
  reports = new Map();
  accepted = new Map();
  moderators = new Set();
  moderationEvents = [];

  async getProfile(userId) {
    return this.profiles.get(userId) ?? null;
  }

  async saveProfile(profile) {
    this.profiles.set(profile.userId, profile);
    return profile;
  }

  async listVisibleQuestions({ limit, cursor }) {
    const questions = sortQuestions(
      [...this.questions.values()].filter((question) => question.status === 'VISIBLE')
    );
    let start = 0;

    if (cursor !== null) {
      let position;
      try {
        position = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      } catch (_error) {
        throw new Error('Community cursor is invalid.');
      }

      if (
        position === null ||
        typeof position !== 'object' ||
        typeof position.createdAt !== 'string' ||
        typeof position.questionId !== 'string'
      ) {
        throw new Error('Community cursor is invalid.');
      }

      start = questions.findIndex(
        (question) =>
          question.createdAt < position.createdAt ||
          (question.createdAt === position.createdAt &&
            question.questionId < position.questionId)
      );
      if (start === -1) {
        start = questions.length;
      }
    }

    const page = questions.slice(start, start + limit);
    return {
      questions: page,
      nextCursor:
        start + limit < questions.length && page.length > 0
          ? encodeCursor(page.at(-1))
          : null
    };
  }

  async getQuestion(questionId) {
    const question = this.questions.get(questionId);
    if (question === undefined || question.status !== 'VISIBLE') {
      return null;
    }

    const acceptedAnswerId = this.accepted.get(questionId) ?? null;
    const answers = [...this.answers.values()]
      .filter(
        (answer) => answer.questionId === questionId && answer.status === 'VISIBLE'
      )
      .sort(
        (left, right) =>
          Number(right.answerId === acceptedAnswerId) -
            Number(left.answerId === acceptedAnswerId) ||
          left.createdAt.localeCompare(right.createdAt) ||
          left.answerId.localeCompare(right.answerId)
      );

    return { question, answers, acceptedAnswerId };
  }

  async getQuestionRecord(questionId) {
    return this.questions.get(questionId) ?? null;
  }

  async getAnswerRecord(answerId) {
    return this.answers.get(answerId) ?? null;
  }

  async createQuestion(question) {
    const profile = this.profiles.get(question.authorUserId);
    if (profile === undefined || this.questions.has(question.questionId)) {
      return null;
    }

    const record = createQuestion(question, profile.displayName);
    this.questions.set(record.questionId, record);
    return record;
  }

  async updateQuestion(question) {
    const existing = this.questions.get(question.questionId);
    const profile = this.profiles.get(question.authorUserId);
    if (
      existing === undefined ||
      profile === undefined ||
      existing.authorUserId !== question.authorUserId ||
      existing.status === 'DELETED'
    ) {
      return null;
    }

    const updated = {
      ...existing,
      title: question.title,
      body: question.body,
      topicId: question.topicId,
      updatedAt: question.updatedAt,
      authorDisplayName: profile.displayName
    };
    this.questions.set(question.questionId, updated);
    return updated;
  }

  async deleteQuestion(input) {
    const existing = this.questions.get(input.questionId);
    if (existing === undefined) {
      return 'not-found';
    }
    if (existing.authorUserId !== input.authorUserId) {
      return 'forbidden';
    }

    this.questions.set(input.questionId, {
      ...existing,
      status: 'DELETED',
      deletedAt: existing.deletedAt ?? input.deletedAt,
      retentionExpiresAt: existing.retentionExpiresAt ?? input.retentionExpiresAt,
      updatedAt: input.deletedAt
    });
    this.accepted.delete(input.questionId);
    for (const answer of this.answers.values()) {
      if (answer.questionId === input.questionId && answer.status !== 'DELETED') {
        this.answers.set(answer.answerId, {
          ...answer,
          status: 'DELETED',
          deletedAt: input.deletedAt,
          retentionExpiresAt: input.retentionExpiresAt,
          updatedAt: input.deletedAt
        });
      }
    }
    return 'deleted';
  }

  async createAnswer(answer) {
    const question = this.questions.get(answer.questionId);
    const profile = this.profiles.get(answer.authorUserId);
    if (
      question === undefined ||
      question.status !== 'VISIBLE' ||
      profile === undefined ||
      this.answers.has(answer.answerId)
    ) {
      return null;
    }

    const record = createAnswer(answer, profile.displayName);
    this.answers.set(record.answerId, record);
    return record;
  }

  async updateAnswer(answer) {
    const existing = this.answers.get(answer.answerId);
    const profile = this.profiles.get(answer.authorUserId);
    if (
      existing === undefined ||
      profile === undefined ||
      existing.authorUserId !== answer.authorUserId ||
      existing.status === 'DELETED'
    ) {
      return null;
    }

    const updated = {
      ...existing,
      body: answer.body,
      updatedAt: answer.updatedAt,
      authorDisplayName: profile.displayName
    };
    this.answers.set(answer.answerId, updated);
    return updated;
  }

  async deleteAnswer(input) {
    const existing = this.answers.get(input.answerId);
    if (existing === undefined) {
      return 'not-found';
    }
    if (existing.authorUserId !== input.authorUserId) {
      return 'forbidden';
    }

    this.answers.set(input.answerId, {
      ...existing,
      status: 'DELETED',
      deletedAt: existing.deletedAt ?? input.deletedAt,
      retentionExpiresAt: existing.retentionExpiresAt ?? input.retentionExpiresAt,
      updatedAt: input.deletedAt
    });
    this.accepted.delete(existing.questionId);
    return 'deleted';
  }

  async setAcceptedAnswer(input) {
    const question = this.questions.get(input.questionId);
    if (question === undefined || question.status !== 'VISIBLE') {
      return 'not-found';
    }
    if (question.authorUserId !== input.questionAuthorUserId) {
      return 'forbidden';
    }
    if (input.answerId === null) {
      this.accepted.delete(input.questionId);
      return 'removed';
    }

    const answer = this.answers.get(input.answerId);
    if (
      answer === undefined ||
      answer.questionId !== input.questionId ||
      answer.status !== 'VISIBLE'
    ) {
      return 'not-found';
    }
    this.accepted.set(input.questionId, input.answerId);
    return 'accepted';
  }

  async createReport(report) {
    const target =
      report.targetType === 'QUESTION'
        ? this.questions.get(report.targetId)
        : this.answers.get(report.targetId);
    const targetQuestion =
      report.targetType === 'ANSWER' && target !== undefined
        ? this.questions.get(target.questionId)
        : null;
    if (
      target === undefined ||
      target.status !== 'VISIBLE' ||
      (targetQuestion !== null && targetQuestion?.status !== 'VISIBLE')
    ) {
      return { outcome: 'invalid-target' };
    }

    const duplicate = [...this.reports.values()].some(
      (existing) =>
        existing.reporterUserId === report.reporterUserId &&
        existing.targetType === report.targetType &&
        existing.targetId === report.targetId &&
        existing.state === 'OPEN'
    );
    if (duplicate) {
      return { outcome: 'duplicate' };
    }

    const record = {
      ...report,
      state: 'OPEN',
      resolvedAt: null,
      retentionExpiresAt: null,
      retentionHold: 'NONE'
    };
    this.reports.set(record.reportId, record);
    return { outcome: 'created', report: record };
  }

  async isModerator(userId) {
    return this.moderators.has(userId);
  }

  async listOpenReports() {
    return [...this.reports.values()]
      .filter((report) => report.state === 'OPEN')
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.reportId.localeCompare(right.reportId)
      );
  }

  async moderate(input) {
    if (!this.moderators.has(input.actorUserId)) {
      return { outcome: 'forbidden' };
    }

    let targetType = input.targetType;
    let targetId = input.targetId;
    if (input.action === 'DISMISS_REPORT') {
      const report = this.reports.get(input.reportId);
      if (report === undefined || report.state !== 'OPEN') {
        return { outcome: 'not-found' };
      }
      targetType = report.targetType;
      targetId = report.targetId;
      const dismissed = {
        ...report,
        state: 'DISMISSED',
        resolvedAt: input.createdAt,
        retentionExpiresAt: input.retentionExpiresAt
      };
      this.reports.set(report.reportId, dismissed);
      this.moderationEvents.push({ ...input, targetType, targetId });
      return { outcome: 'updated', targetType, targetId, status: 'DISMISSED' };
    }

    const target =
      targetType === 'QUESTION'
        ? this.questions.get(targetId)
        : this.answers.get(targetId);
    if (target === undefined) {
      return { outcome: 'not-found' };
    }
    if (target.status === 'DELETED' && (input.action === 'HIDE' || input.action === 'RESTORE')) {
      return { outcome: 'invalid-target' };
    }

    const status =
      input.action === 'HIDE'
        ? 'HIDDEN'
        : input.action === 'RESTORE'
          ? 'VISIBLE'
          : 'DELETED';
    const updated = {
      ...target,
      status,
      ...(status === 'DELETED'
        ? {
            deletedAt: target.deletedAt ?? input.createdAt,
            retentionExpiresAt: target.retentionExpiresAt ?? input.retentionExpiresAt
          }
        : {}),
      updatedAt: input.createdAt
    };
    if (targetType === 'QUESTION') {
      this.questions.set(targetId, updated);
      if (status !== 'VISIBLE') {
        this.accepted.delete(targetId);
      }
      if (status === 'DELETED') {
        for (const answer of this.answers.values()) {
          if (answer.questionId === targetId && answer.status !== 'DELETED') {
            this.answers.set(answer.answerId, {
              ...answer,
              status: 'DELETED',
              deletedAt: input.createdAt,
              retentionExpiresAt: input.retentionExpiresAt,
              updatedAt: input.createdAt
            });
          }
        }
      }
    } else {
      this.answers.set(targetId, updated);
      if (status !== 'VISIBLE') {
        this.accepted.delete(target.questionId);
      }
    }

    for (const report of this.reports.values()) {
      if (
        report.state === 'OPEN' &&
        report.targetType === targetType &&
        report.targetId === targetId
      ) {
        this.reports.set(report.reportId, {
          ...report,
          state: 'RESOLVED',
          resolvedAt: input.createdAt,
          retentionExpiresAt: input.retentionExpiresAt
        });
      }
    }
    this.moderationEvents.push({ ...input, targetType, targetId });
    return { outcome: 'updated', targetType, targetId, status };
  }

  async purgeExpiredRetention() {
    return {
      deletedAnswers: 0,
      deletedQuestions: 0,
      deletedReports: 0,
      deletedModerationEvents: 0
    };
  }
}

function createHarness() {
  const repository = new InMemoryCommunityRepository();
  let nextId = 0;
  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null
          ? null
          : { userId, sessionCreatedAt: SESSION_CREATED_AT };
      }
    },
    accountErasure: {},
    accountDataExport: {},
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts: {},
      chartNotes: {},
      notificationPreferences: {},
      pushSubscriptions: {},
      community: repository
    },
    engineClient: {
      async calculateChart() {
        throw new Error('Community must not call Engine.');
      }
    },
    chartCalculator: {},
    clock: {
      now() {
        return NOW;
      }
    },
    idGenerator: {
      generate() {
        nextId += 1;
        return `community-${nextId}`;
      }
    },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies, { observabilitySink: { write() {} } }),
    dependencies,
    repository
  };
}

function request(harness, method, pathname, options = {}) {
  const headers = new Headers(options.headers);
  if (options.origin !== null) {
    headers.set('origin', options.origin ?? PUBLIC_WEB_ORIGIN);
  }
  if (options.user !== undefined && options.user !== null) {
    headers.set('x-test-user', options.user);
  }
  if (options.ip !== undefined) {
    headers.set('x-natalnode-client-ip', options.ip);
  }

  let body;
  if (options.body !== undefined) {
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    headers.set('content-type', 'application/json');
  }

  return harness.app.request(pathname, { method, headers, body });
}

async function assertProblem(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('content-type'),
    'application/problem+json; charset=utf-8'
  );
  const payload = await response.json();
  if (status === 429) {
    assert.equal(payload.detail, 'Too many requests. Please try again later.');
    delete payload.detail;
  }
  assert.deepEqual(payload, {
    type: 'about:blank',
    title: PROBLEM_TITLE_BY_STATUS[status],
    status,
    code
  });
}

async function createProfile(harness, user = 'user-1', displayName = 'Aster') {
  const response = await request(harness, 'PUT', '/api/account/community-profile', {
    user,
    body: { displayName }
  });
  assert.equal(response.status, 200);
  return response;
}

async function createQuestionViaApi(harness, user = 'user-1', overrides = {}) {
  const response = await request(harness, 'POST', '/api/community/questions', {
    user,
    body: {
      title: overrides.title ?? 'A focused community question',
      body: overrides.body ?? 'This is a sufficiently detailed question body.',
      topicId: overrides.topicId ?? 'FOUNDATIONS'
    },
    ip: overrides.ip
  });
  assert.equal(response.status, 201);
  return (await response.json()).question;
}

test('Community domain and request contracts preserve the frozen seven-topic and plain-text boundaries', () => {
  assert.deepEqual(COMMUNITY_TOPIC_IDS, [
    'FOUNDATIONS',
    'CHART_READING',
    'PLANETS_SIGNS_HOUSES',
    'ASPECTS',
    'BIRTH_TIME_AND_CALCULATION',
    'NATALNODE_PRODUCT',
    'OTHER'
  ]);
  assert.equal(COMMUNITY_PAGE_DEFAULT_SIZE, 20);
  assert.equal(COMMUNITY_PAGE_MAXIMUM_SIZE, 50);
  assert.equal(COMMUNITY_QUESTION_TITLE_MINIMUM_CHARACTERS, 10);
  assert.equal(COMMUNITY_QUESTION_TITLE_MAXIMUM_CHARACTERS, 180);
  assert.equal(COMMUNITY_QUESTION_BODY_MINIMUM_CHARACTERS, 20);
  assert.equal(COMMUNITY_QUESTION_BODY_MAXIMUM_CHARACTERS, 10_000);
  assert.equal(COMMUNITY_ANSWER_BODY_MINIMUM_CHARACTERS, 10);
  assert.equal(COMMUNITY_ANSWER_BODY_MAXIMUM_CHARACTERS, 10_000);
  assert.equal(COMMUNITY_DISPLAY_NAME_MINIMUM_CHARACTERS, 3);
  assert.equal(COMMUNITY_DISPLAY_NAME_MAXIMUM_CHARACTERS, 40);
  assert.equal(COMMUNITY_REPORT_DETAILS_MAXIMUM_CHARACTERS, 1_000);

  assert.equal(normalizeCommunityText('  one\r\ntwo\rthree  '), 'one\ntwo\nthree');
  assert.equal(normalizeCommunityDisplayName('  星星  '), '星星');
  assert.equal(isValidCommunityDisplayName('🙂🙂🙂'), true);
  assert.equal(isValidCommunityDisplayName('ab'), false);
  assert.equal(isValidCommunityDisplayName('a'.repeat(41)), false);
  assert.equal(isValidCommunityDisplayName('A\u0000B'), false);
  assert.equal(isValidCommunityDisplayName('A<B'), false);
  assert.equal(isValidCommunityQuestionTitle('a'.repeat(9)), false);
  assert.equal(isValidCommunityQuestionTitle('a'.repeat(180)), true);
  assert.equal(isValidCommunityQuestionTitle('a'.repeat(181)), false);
  assert.equal(isValidCommunityQuestionBody('a'.repeat(19)), false);
  assert.equal(isValidCommunityQuestionBody('a'.repeat(10_000)), true);
  assert.equal(isValidCommunityQuestionBody(`safe${'\uD800'}`), false);
  assert.equal(isValidCommunityAnswerBody('a'.repeat(10)), true);
  assert.equal(isValidCommunityAnswerBody('a'.repeat(9)), false);
  assert.equal(isValidCommunityReportDetails('a'.repeat(1_000)), true);
  assert.equal(isValidCommunityReportDetails('a'.repeat(1_001)), false);

  assert.deepEqual(
    normalizeCreateCommunityQuestionRequest({
      title: '  A normalized question  ',
      body: '  A normalized question body.  ',
      topicId: 'OTHER'
    }),
    {
      title: 'A normalized question',
      body: 'A normalized question body.',
      topicId: 'OTHER'
    }
  );
  assert.equal(
    normalizeCreateCommunityQuestionRequest({
      title: 'Valid question title',
      body: 'Valid body with <markup>',
      topicId: 'OTHER'
    }),
    null
  );
  assert.equal(
    normalizeCreateCommunityQuestionRequest({
      title: 'Valid question title',
      body: 'Valid body',
      topicId: 'OTHER',
      authorUserId: 'attacker'
    }),
    null
  );
  assert.equal(
    normalizeUpdateCommunityQuestionRequest({
      title: 'Valid question title',
      body: 'Valid question body.',
      topicId: 'NOT_A_TOPIC'
    }),
    null
  );
  assert.equal(
    normalizeCreateCommunityReportRequest({
      targetType: 'QUESTION',
      targetId: 'question-1',
      category: 'UNKNOWN'
    }),
    null
  );
  assert.deepEqual(parseCommunityPageQuery(undefined, undefined), {
    limit: 20,
    cursor: null
  });
  assert.equal(parseCommunityPageQuery('0', undefined), null);
  assert.equal(parseCommunityPageQuery('51', undefined), null);
  assert.equal(parseCommunityPageQuery('20', 'invalid cursor'), null);
  assert.equal(parseCommunityPageQuery('20', 'valid_cursor-1')?.limit, 20);
  assert.deepEqual(COMMUNITY_REPORT_CATEGORIES, [
    'SPAM',
    'HARASSMENT',
    'HATE_OR_ABUSE',
    'DANGEROUS_OR_HIGH_STAKES_ADVICE',
    'PRIVACY',
    'COPYRIGHT_OR_IP',
    'OTHER'
  ]);
  assert.ok(COMMUNITY_MODERATION_REASON_CODES.includes('CONTENT_POLICY'));
});

test('Community writes require authentication, a display name, and server-derived ownership', async () => {
  const harness = createHarness();

  await assertProblem(
    await request(harness, 'POST', '/api/community/questions', {
      user: null,
      body: {
        title: 'A focused community question',
        body: 'This is a sufficiently detailed question body.',
        topicId: 'FOUNDATIONS'
      }
    }),
    401,
    'UNAUTHORIZED'
  );

  await assertProblem(
    await request(harness, 'POST', '/api/community/questions', {
      user: 'user-1',
      body: {
        title: 'A focused community question',
        body: 'This is a sufficiently detailed question body.',
        topicId: 'FOUNDATIONS'
      }
    }),
    409,
    'CONFLICT'
  );

  await assertProblem(
    await request(harness, 'PUT', '/api/account/community-profile', {
      user: 'user-1',
      body: { displayName: 'ab' }
    }),
    400,
    'INVALID_REQUEST'
  );

  await createProfile(harness, 'user-1', 'Aster');
  const question = await createQuestionViaApi(harness, 'user-1');
  assert.equal(question.author.displayName, 'Aster');
  assert.equal('authorUserId' in question, false);
  assert.equal('email' in question.author, false);

  await assertProblem(
    await request(harness, 'PATCH', `/api/community/questions/${question.questionId}`, {
      user: 'user-2',
      body: {
        title: 'An attacker cannot rewrite this',
        body: 'An attacker cannot rewrite this question body.',
        topicId: 'OTHER'
      }
    }),
    403,
    'FORBIDDEN'
  );

  await assertProblem(
    await request(harness, 'DELETE', `/api/community/questions/${question.questionId}`, {
      user: 'user-2'
    }),
    403,
    'FORBIDDEN'
  );
});

test('Questions use public visible reads, deterministic cursor pagination, and no deleted-body exposure', async () => {
  const harness = createHarness();
  await createProfile(harness, 'user-1', 'Aster');

  const first = await createQuestionViaApi(harness, 'user-1');
  const second = await createQuestionViaApi(harness, 'user-1');
  harness.repository.questions.set(first.questionId, {
    ...harness.repository.questions.get(first.questionId),
    createdAt: '2026-08-30T10:00:00.000Z',
    updatedAt: '2026-08-30T10:00:00.000Z'
  });
  harness.repository.questions.set(second.questionId, {
    ...harness.repository.questions.get(second.questionId),
    createdAt: '2026-08-31T10:00:00.000Z',
    updatedAt: '2026-08-31T10:00:00.000Z'
  });

  const firstPage = await request(harness, 'GET', '/api/community/questions?limit=1');
  assert.equal(firstPage.status, 200);
  const firstPayload = await firstPage.json();
  assert.deepEqual(firstPayload.questions.map((entry) => entry.questionId), [second.questionId]);
  assert.equal(typeof firstPayload.nextCursor, 'string');

  const secondPage = await request(
    harness,
    'GET',
    `/api/community/questions?limit=1&cursor=${encodeURIComponent(firstPayload.nextCursor)}`
  );
  assert.equal(secondPage.status, 200);
  const secondPayload = await secondPage.json();
  assert.deepEqual(secondPayload.questions.map((entry) => entry.questionId), [first.questionId]);

  await assertProblem(
    await request(harness, 'GET', '/api/community/questions?limit=51'),
    400,
    'INVALID_REQUEST'
  );
  await assertProblem(
    await request(harness, 'GET', '/api/community/questions?cursor=AAAA'),
    400,
    'INVALID_REQUEST'
  );
  await assertProblem(
    await request(harness, 'GET', '/api/community/questions/not-an-opaque-id'),
    404,
    'NOT_FOUND'
  );

  const detail = await request(
    harness,
    'GET',
    `/api/community/questions/${encodeURIComponent(first.questionId)}`
  );
  assert.equal(detail.status, 200);
  const detailPayload = await detail.json();
  assert.equal(detailPayload.question.title, first.title);
  assert.equal(detailPayload.viewer.authenticated, false);
  assert.equal('authorUserId' in detailPayload.question, false);

  await request(harness, 'DELETE', `/api/community/questions/${first.questionId}`, {
    user: 'user-1'
  });
  await assertProblem(
    await request(harness, 'GET', `/api/community/questions/${first.questionId}`),
    404,
    'NOT_FOUND'
  );
  const listAfterDelete = await request(harness, 'GET', '/api/community/questions');
  assert.deepEqual((await listAfterDelete.json()).questions.map((entry) => entry.questionId), [second.questionId]);
});

test('Answers preserve ownership, accepted-answer authority, ordering, and deletion integrity', async () => {
  const harness = createHarness();
  await createProfile(harness, 'user-1', 'Questioner');
  await createProfile(harness, 'user-2', 'Responder');
  const question = await createQuestionViaApi(harness, 'user-1');

  const firstAnswerResponse = await request(
    harness,
    'POST',
    `/api/community/questions/${question.questionId}/answers`,
    { user: 'user-2', body: { body: 'The first useful answer.' } }
  );
  assert.equal(firstAnswerResponse.status, 201);
  const firstAnswer = (await firstAnswerResponse.json()).answer;

  const secondAnswerResponse = await request(
    harness,
    'POST',
    `/api/community/questions/${question.questionId}/answers`,
    { user: 'user-1', body: { body: 'The second useful answer.' } }
  );
  assert.equal(secondAnswerResponse.status, 201);
  const secondAnswer = (await secondAnswerResponse.json()).answer;

  await assertProblem(
    await request(harness, 'PATCH', `/api/community/answers/${firstAnswer.answerId}`, {
      user: 'user-1',
      body: { body: 'A cross-user edit is denied.' }
    }),
    403,
    'FORBIDDEN'
  );

  const accept = await request(
    harness,
    'PUT',
    `/api/community/questions/${question.questionId}/accepted-answer`,
    { user: 'user-1', body: { answerId: firstAnswer.answerId } }
  );
  assert.equal(accept.status, 200);
  assert.deepEqual(await accept.json(), { acceptedAnswerId: firstAnswer.answerId });

  await assertProblem(
    await request(harness, 'PUT', `/api/community/questions/${question.questionId}/accepted-answer`, {
      user: 'user-2',
      body: { answerId: secondAnswer.answerId }
    }),
    403,
    'FORBIDDEN'
  );

  const replacement = await request(
    harness,
    'PUT',
    `/api/community/questions/${question.questionId}/accepted-answer`,
    { user: 'user-1', body: { answerId: secondAnswer.answerId } }
  );
  assert.deepEqual(await replacement.json(), { acceptedAnswerId: secondAnswer.answerId });

  const detail = await request(harness, 'GET', `/api/community/questions/${question.questionId}`);
  const detailPayload = await detail.json();
  assert.equal(detailPayload.acceptedAnswerId, secondAnswer.answerId);
  assert.deepEqual(
    detailPayload.answers.map((answer) => answer.answerId),
    [secondAnswer.answerId, firstAnswer.answerId]
  );

  const unaccept = await request(
    harness,
    'DELETE',
    `/api/community/questions/${question.questionId}/accepted-answer`,
    { user: 'user-1' }
  );
  assert.deepEqual(await unaccept.json(), { acceptedAnswerId: null });

  const deleteAnswer = await request(
    harness,
    'DELETE',
    `/api/community/answers/${firstAnswer.answerId}`,
    { user: 'user-2' }
  );
  assert.deepEqual(await deleteAnswer.json(), { deleted: true });
  const afterAnswerDelete = await request(harness, 'GET', `/api/community/questions/${question.questionId}`);
  const afterAnswerDeletePayload = await afterAnswerDelete.json();
  assert.deepEqual(
    afterAnswerDeletePayload.answers.map((answer) => answer.answerId),
    [secondAnswer.answerId]
  );
});

test('Reports keep reporter identity private, reject duplicates, and are visible only to server-authorized moderators', async () => {
  const harness = createHarness();
  await createProfile(harness, 'user-1', 'Reporter');
  const question = await createQuestionViaApi(harness, 'user-1');

  const report = await request(harness, 'POST', '/api/community/reports', {
    user: 'user-2',
    body: {
      targetType: 'QUESTION',
      targetId: question.questionId,
      category: 'SPAM',
      details: 'This is a private moderation detail.'
    }
  });
  assert.equal(report.status, 201);
  const reportPayload = await report.json();
  assert.equal(typeof reportPayload.reportId, 'string');
  assert.equal('reporterUserId' in reportPayload, false);

  await assertProblem(
    await request(harness, 'POST', '/api/community/reports', {
      user: 'user-2',
      body: {
        targetType: 'QUESTION',
        targetId: question.questionId,
        category: 'SPAM'
      }
    }),
    409,
    'CONFLICT'
  );

  await assertProblem(
    await request(harness, 'POST', '/api/community/reports', {
      user: 'user-1',
      body: {
        targetType: 'QUESTION',
        targetId: question.questionId,
        category: 'OTHER',
        details: 'x'.repeat(1_001)
      }
    }),
    400,
    'INVALID_REQUEST'
  );

  await assertProblem(
    await request(harness, 'GET', '/api/community/moderation/reports', { user: 'user-2' }),
    403,
    'FORBIDDEN'
  );
  harness.repository.moderators.add('moderator-1');
  const queue = await request(harness, 'GET', '/api/community/moderation/reports', {
    user: 'moderator-1'
  });
  assert.equal(queue.status, 200);
  const queuePayload = await queue.json();
  assert.equal(queuePayload.reports.length, 1);
  assert.equal('reporterUserId' in queuePayload.reports[0], false);
  assert.match(JSON.stringify(queuePayload), /private moderation detail/iu);
});

test('Moderation is server-authorized, append-only, and controls public visibility without automatic punishment', async () => {
  const harness = createHarness();
  await createProfile(harness, 'user-1', 'Questioner');
  const question = await createQuestionViaApi(harness, 'user-1');
  harness.repository.moderators.add('moderator-1');

  await assertProblem(
    await request(harness, 'PATCH', `/api/community/moderation/QUESTION/${question.questionId}`, {
      user: 'user-2',
      body: { action: 'HIDE', reasonCode: 'CONTENT_POLICY' }
    }),
    403,
    'FORBIDDEN'
  );

  const hidden = await request(
    harness,
    'PATCH',
    `/api/community/moderation/QUESTION/${question.questionId}`,
    {
      user: 'moderator-1',
      body: {
        action: 'HIDE',
        reasonCode: 'CONTENT_POLICY',
        note: 'Internal moderation note.'
      }
    }
  );
  assert.equal(hidden.status, 200);
  assert.deepEqual(await hidden.json(), {
    action: 'HIDE',
    targetType: 'QUESTION',
    targetId: question.questionId,
    status: 'HIDDEN'
  });
  assert.equal(harness.repository.moderationEvents.length, 1);
  assert.equal(harness.repository.moderationEvents[0].actorUserId, 'moderator-1');
  assert.equal(harness.repository.moderationEvents[0].note, 'Internal moderation note.');
  await assertProblem(
    await request(harness, 'GET', `/api/community/questions/${question.questionId}`),
    404,
    'NOT_FOUND'
  );

  const restored = await request(
    harness,
    'PATCH',
    `/api/community/moderation/QUESTION/${question.questionId}`,
    { user: 'moderator-1', body: { action: 'RESTORE', reasonCode: 'OTHER' } }
  );
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).status, 'VISIBLE');

  const deleted = await request(
    harness,
    'PATCH',
    `/api/community/moderation/QUESTION/${question.questionId}`,
    { user: 'moderator-1', body: { action: 'DELETE', reasonCode: 'CONTENT_POLICY' } }
  );
  assert.equal(deleted.status, 200);
  assert.equal((await deleted.json()).status, 'DELETED');
  await assertProblem(
    await request(harness, 'GET', `/api/community/questions/${question.questionId}`),
    404,
    'NOT_FOUND'
  );
  assert.equal(harness.repository.moderationEvents.length, 3);
  assert.equal(harness.repository.moderationEvents.every((event) => event.actorUserId === 'moderator-1'), true);
});

test('Community account-level limits are frozen and applied before mutation handlers', async () => {
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityQuestionCreateHour, {
    identifier: 'COMMUNITY_QUESTION_CREATE_HOUR',
    limit: 5,
    windowMs: 60 * 60 * 1_000
  });
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityQuestionCreateDay, {
    identifier: 'COMMUNITY_QUESTION_CREATE_DAY',
    limit: 20,
    windowMs: 24 * 60 * 60 * 1_000
  });
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityAnswerCreateHour, {
    identifier: 'COMMUNITY_ANSWER_CREATE_HOUR',
    limit: 20,
    windowMs: 60 * 60 * 1_000
  });
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityAnswerCreateDay, {
    identifier: 'COMMUNITY_ANSWER_CREATE_DAY',
    limit: 100,
    windowMs: 24 * 60 * 60 * 1_000
  });
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityReportHour, {
    identifier: 'COMMUNITY_REPORT_HOUR',
    limit: 10,
    windowMs: 60 * 60 * 1_000
  });
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityReportDay, {
    identifier: 'COMMUNITY_REPORT_DAY',
    limit: 30,
    windowMs: 24 * 60 * 60 * 1_000
  });
  assert.deepEqual(P0_STAGING_RATE_LIMIT_POLICIES.communityMutationAccount, {
    identifier: 'COMMUNITY_MUTATION_ACCOUNT',
    limit: 60,
    windowMs: 60 * 60 * 1_000
  });

  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/community/questions').identifier,
    'COMMUNITY_MUTATION_EDGE'
  );
  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/community/questions/q-1/answers').identifier,
    'COMMUNITY_MUTATION_EDGE'
  );
  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/community/reports').identifier,
    'COMMUNITY_MUTATION_EDGE'
  );
  assert.equal(
    selectP0StagingRateLimitPolicy('GET', '/api/community/questions'),
    null
  );

  const harness = createHarness();
  await createProfile(harness, 'user-1', 'Aster');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await createQuestionViaApi(harness, 'user-1', { ip: `203.0.113.${attempt + 1}` });
  }
  await assertProblem(
    await request(harness, 'POST', '/api/community/questions', {
      user: 'user-1',
      body: {
        title: 'A sixth focused question',
        body: 'This sixth question should be rate limited.',
        topicId: 'OTHER'
      },
      ip: '203.0.113.6'
    }),
    429,
    'RATE_LIMITED'
  );
});

test('Community migration freezes identity anonymization, accepted-answer integrity, retention, and report privacy', async () => {
  const migration = await readFile(
    new URL('server/db/migrations/0018_community_questions_v1.sql', REPOSITORY_ROOT),
    'utf8'
  );

  for (const table of [
    'community_profiles',
    'community_questions',
    'community_answers',
    'community_question_acceptances',
    'community_reports',
    'community_moderators',
    'community_moderation_events'
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE ${table}`, 'u'));
  }
  assert.match(migration, /CREATE UNIQUE INDEX community_reports_active_report_unique/u);
  assert.match(migration, /CREATE TRIGGER community_acceptance_guard/u);
  assert.match(migration, /answer_status IS DISTINCT FROM 'VISIBLE'/u);
  assert.match(migration, /CREATE TRIGGER community_question_acceptance_visibility_guard/u);
  assert.match(migration, /CREATE TRIGGER community_answer_acceptance_visibility_guard/u);
  assert.match(migration, /CREATE TRIGGER community_moderation_event_update_guard/u);
  assert.match(migration, /CREATE TRIGGER users_community_anonymization_guard/u);
  assert.match(migration, /anonymized_author_label = 'Deleted User'/u);
  assert.match(migration, /ON DELETE SET NULL/u);
  assert.match(migration, /retention_hold IN \('NONE', 'LEGAL', 'SECURITY'\)/u);
  assert.match(migration, /char_length\(details\) <= 1000/u);
});
