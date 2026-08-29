import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProblemDetails,
  createProblemDetailsResponse,
  normalizeUnknownProblem,
  PROBLEM_DETAIL_BY_KEY,
  PROBLEM_DETAIL_MAXIMUM_CHARACTERS,
  PROBLEM_DETAILS_CONTENT_TYPE,
  PROBLEM_DETAILS_TYPE,
  PROBLEM_STATUS_BY_CODE,
  PROBLEM_TITLE_BY_STATUS
} from '../dist/app/problem-details/index.js';

const EXPECTED_STATUS_BY_CODE = {
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RECENT_AUTHENTICATION_REQUIRED: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PUSH_SUBSCRIPTION_UNAVAILABLE: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  CALCULATION_UNAVAILABLE: 503,
  NOTIFICATION_UNAVAILABLE: 503
};

const EXPECTED_TITLE_BY_STATUS = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};

test('exports the finite status and title mappings exhaustively', () => {
  assert.deepEqual(PROBLEM_STATUS_BY_CODE, EXPECTED_STATUS_BY_CODE);
  assert.deepEqual(PROBLEM_TITLE_BY_STATUS, EXPECTED_TITLE_BY_STATUS);

  for (const [code, status] of Object.entries(EXPECTED_STATUS_BY_CODE)) {
    const problem = createProblemDetails({ code });

    assert.equal(problem.status, status);
    assert.equal(problem.title, EXPECTED_TITLE_BY_STATUS[status]);
    assert.equal(problem.type, PROBLEM_DETAILS_TYPE);
    assert.equal(problem.code, code);
  }
});

test('creates the minimal canonical shape without legacy or correlation fields', () => {
  const problem = createProblemDetails({ code: 'INVALID_REQUEST' });

  assert.deepEqual(problem, {
    type: 'about:blank',
    title: 'Bad Request',
    status: 400,
    code: 'INVALID_REQUEST'
  });
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'detail'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'instance'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'requestId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'message'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'error'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'errors'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(problem, 'fields'), false);
  assert.equal(Object.isFrozen(problem), true);
});

test('uses only a centrally registered static detail for an allowed code', () => {
  const problem = createProblemDetails({
    code: 'INVALID_REQUEST',
    detailKey: 'INVALID_REQUEST'
  });

  assert.equal(problem.detail, PROBLEM_DETAIL_BY_KEY.INVALID_REQUEST);
  assert.equal(Object.isFrozen(PROBLEM_DETAIL_BY_KEY), true);
});

test('rejects dynamic, mismatched, and overlong detail keys without producing a response', () => {
  assert.throws(
    () =>
      createProblemDetails({
        code: 'INVALID_REQUEST',
        detailKey: 'private exception detail'.repeat(20)
      }),
    /Problem detail key is not allowed/u
  );

  assert.throws(
    () =>
      createProblemDetails({
        code: 'INVALID_REQUEST',
        detailKey: 'AUTHENTICATION_REQUIRED'
      }),
    /Problem detail key is not allowed/u
  );

  for (const detail of Object.values(PROBLEM_DETAIL_BY_KEY)) {
    assert.ok(Array.from(detail).length <= PROBLEM_DETAIL_MAXIMUM_CHARACTERS);
  }

  assert.throws(
    () =>
      createProblemDetails({
        code: 'INVALID_REQUEST',
        detailKey: 'x'.repeat(PROBLEM_DETAIL_MAXIMUM_CHARACTERS + 1)
      }),
    /Problem detail key is not allowed/u
  );
});

test('rejects unknown runtime problem codes', () => {
  assert.throws(
    () => createProblemDetails({ code: 'UNSUPPORTED_CODE' }),
    /Problem code is not allowed/u
  );
});

test('derives status from code and ignores arbitrary status/title overrides', () => {
  const problem = createProblemDetails({
    code: 'UNAUTHORIZED',
    status: 500,
    title: 'private exception text'
  });

  assert.equal(problem.status, 401);
  assert.equal(problem.title, 'Unauthorized');
  assert.equal(problem.code, 'UNAUTHORIZED');
});

test('normalizes every unknown thrown value to a sanitized internal problem', () => {
  for (const value of [
    new Error('private database detail'),
    'private provider detail',
    { message: 'private message', stack: 'private stack' },
    null,
    undefined
  ]) {
    assert.deepEqual(normalizeUnknownProblem(value), {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL_ERROR'
    });
  }
});

test('serializes a canonical response with matching status and media type', async () => {
  const response = createProblemDetailsResponse({
    code: 'RATE_LIMITED',
    detailKey: 'RATE_LIMITED'
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Content-Type'), PROBLEM_DETAILS_CONTENT_TYPE);
  assert.deepEqual(await response.json(), {
    type: 'about:blank',
    title: 'Too Many Requests',
    status: 429,
    code: 'RATE_LIMITED',
    detail: 'Too many requests. Please try again later.'
  });
});
