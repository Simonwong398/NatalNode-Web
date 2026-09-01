import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import { classifyApiEndpointFamily } from '../dist/app/observability/api-request-observability.js';
import {
  P0_STAGING_RATE_LIMIT_POLICIES,
  selectP0StagingRateLimitPolicy
} from '../dist/app/security/api-rate-limiting.js';
import {
  FEEDBACK_CATEGORIES,
  normalizeCreateFeedbackApiRequest
} from '../dist/app/validation/feedback.js';
import { PostgresFeedbackSubmissionRepository } from '../dist/persistence/postgres/postgres-feedback-submission-repository.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const VALID_MESSAGE = 'A valid feedback message.';
const PROBLEM_TITLE_BY_STATUS = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};

function createHarness({ failPersistence = false } = {}) {
  const submissions = [];
  const externalCalls = {
    engine: 0,
    email: 0
  };
  let nextId = 0;

  const dependencies = {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null ? null : { userId };
      }
    },
    idGenerator: {
      generate() {
        nextId += 1;
        return `feedback-${nextId}`;
      }
    },
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {
        async create(submission) {
          if (failPersistence) {
            throw new Error('private database detail');
          }

          submissions.push(submission);
        }
      },
      vaultCharts: {},
      chartNotes: {}
    },
    engineClient: {
      async calculateChart() {
        externalCalls.engine += 1;
        throw new Error('Feedback must not call Engine.');
      }
    },
    clock: {
      now() {
        return '2026-08-26T12:00:00.000Z';
      }
    },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {
      async sendMagicLink() {
        externalCalls.email += 1;
        throw new Error('Feedback must not send email.');
      }
    },
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: {}
  };

  return {
    app: createApp(dependencies),
    submissions,
    externalCalls
  };
}

function postFeedback(app, {
  body = JSON.stringify({ category: 'BUG', message: VALID_MESSAGE }),
  contentType = 'application/json',
  origin = PUBLIC_WEB_ORIGIN,
  userId = 'user-1',
  edgeIp = '203.0.113.10'
} = {}) {
  const headers = {
    Origin: origin,
    'Content-Type': contentType,
    'X-NatalNode-Client-IP': edgeIp
  };

  if (userId !== null) {
    headers['X-Test-User'] = userId;
  }

  return app.request('/api/feedback', {
    method: 'POST',
    headers,
    body
  });
}

async function assertProblemResponse(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  const payload = await response.json();
  assert.deepEqual(payload, {
    type: 'about:blank',
    title: PROBLEM_TITLE_BY_STATUS[status],
    status,
    code
  });
  assert.equal('error' in payload, false);
  assert.equal('message' in payload, false);
  assert.equal('instance' in payload, false);
  assert.equal('requestId' in payload, false);
}

test('Feedback contract accepts exactly the four frozen categories', () => {
  assert.deepEqual(FEEDBACK_CATEGORIES, [
    'BUG',
    'SUGGESTION',
    'CALCULATION_CONCERN',
    'OTHER'
  ]);

  for (const category of FEEDBACK_CATEGORIES) {
    assert.deepEqual(
      normalizeCreateFeedbackApiRequest({ category, message: VALID_MESSAGE }),
      { category, message: VALID_MESSAGE }
    );
  }
});

test('Feedback validation rejects malformed, unsupported, and unsafe payloads', () => {
  assert.equal(normalizeCreateFeedbackApiRequest(null), null);
  assert.equal(normalizeCreateFeedbackApiRequest([]), null);
  assert.equal(normalizeCreateFeedbackApiRequest({ message: VALID_MESSAGE }), null);
  assert.equal(normalizeCreateFeedbackApiRequest({ category: 'BUG' }), null);
  assert.equal(
    normalizeCreateFeedbackApiRequest({ category: 'BUG', message: 12 }),
    null
  );
  assert.equal(
    normalizeCreateFeedbackApiRequest({ category: 'UNKNOWN', message: VALID_MESSAGE }),
    null
  );
  assert.equal(normalizeCreateFeedbackApiRequest({ category: 'BUG', message: '' }), null);
  assert.equal(normalizeCreateFeedbackApiRequest({ category: 'BUG', message: '          ' }), null);
  assert.equal(normalizeCreateFeedbackApiRequest({ category: 'BUG', message: '123456789' }), null);
  assert.equal(
    normalizeCreateFeedbackApiRequest({
      category: 'BUG',
      message: VALID_MESSAGE,
      userId: 'attacker-selected-owner'
    }),
    null
  );
  assert.equal(
    normalizeCreateFeedbackApiRequest({ category: 'BUG', message: 'valid\u0000message' }),
    null
  );
  assert.equal(
    normalizeCreateFeedbackApiRequest({ category: 'BUG', message: 'valid\tmessage' }),
    null
  );
  assert.equal(
    normalizeCreateFeedbackApiRequest({ category: 'BUG', message: `valid text${'\uD800'}` }),
    null
  );
});

test('Feedback validation normalizes line endings and counts Unicode characters', () => {
  assert.deepEqual(
    normalizeCreateFeedbackApiRequest({
      category: 'SUGGESTION',
      message: '  first line\r\nsecond line\rthird line  '
    }),
    {
      category: 'SUGGESTION',
      message: 'first line\nsecond line\nthird line'
    }
  );

  assert.notEqual(
    normalizeCreateFeedbackApiRequest({ category: 'OTHER', message: '🙂'.repeat(10) }),
    null
  );
  assert.notEqual(
    normalizeCreateFeedbackApiRequest({ category: 'OTHER', message: 'a'.repeat(5_000) }),
    null
  );
  assert.equal(
    normalizeCreateFeedbackApiRequest({ category: 'OTHER', message: 'a'.repeat(5_001) }),
    null
  );
});

test('POST /api/feedback independently requires authentication', async () => {
  const harness = createHarness();
  const response = await postFeedback(harness.app, { userId: null });

  await assertProblemResponse(response, 401, 'UNAUTHORIZED');
  assert.equal(harness.submissions.length, 0);
});

test('POST /api/feedback requires the exact configured Origin', async () => {
  const harness = createHarness();
  const response = await postFeedback(harness.app, {
    origin: 'https://attacker.example'
  });

  await assertProblemResponse(response, 403, 'FORBIDDEN');
  assert.equal(harness.submissions.length, 0);
});

test('POST /api/feedback rejects wrong media type and malformed JSON', async () => {
  const mediaTypeHarness = createHarness();
  const mediaTypeResponse = await postFeedback(mediaTypeHarness.app, {
    contentType: 'text/plain'
  });
  await assertProblemResponse(mediaTypeResponse, 415, 'UNSUPPORTED_MEDIA_TYPE');
  assert.equal(mediaTypeHarness.submissions.length, 0);

  const malformedHarness = createHarness();
  const malformedResponse = await postFeedback(malformedHarness.app, {
    body: '{not-json'
  });
  await assertProblemResponse(malformedResponse, 400, 'INVALID_REQUEST');
  assert.equal(malformedHarness.submissions.length, 0);
});

test('POST /api/feedback rejects more than 32 KiB before JSON parsing', async () => {
  const harness = createHarness();
  const response = await postFeedback(harness.app, {
    body: `{${'x'.repeat(32 * 1_024)}`
  });

  await assertProblemResponse(response, 413, 'PAYLOAD_TOO_LARGE');
  assert.equal(harness.submissions.length, 0);
});

test('authenticated valid Feedback binds owner, normalizes text, and returns only 201 confirmation', async () => {
  const harness = createHarness();
  const response = await postFeedback(harness.app, {
    userId: 'authenticated-owner',
    body: JSON.stringify({
      category: 'CALCULATION_CONCERN',
      message: '  Incorrect result\r\nobserved here.  '
    })
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { submitted: true });
  assert.deepEqual(harness.submissions, [{
    feedbackId: 'feedback-1',
    userId: 'authenticated-owner',
    category: 'CALCULATION_CONCERN',
    message: 'Incorrect result\nobserved here.',
    createdAt: '2026-08-26T12:00:00.000Z'
  }]);
  assert.deepEqual(harness.externalCalls, { engine: 0, email: 0 });
});

test('Feedback persistence failure returns the bounded generic 500 response', async () => {
  const harness = createHarness({ failPersistence: true });
  const response = await postFeedback(harness.app);
  const responseText = await response.text();

  assert.equal(response.status, 500);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/problem+json; charset=utf-8'
  );
  assert.deepEqual(JSON.parse(responseText), {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR'
  });
  assert.doesNotMatch(responseText, /"(?:error|message|instance|requestId)"/u);
  assert.doesNotMatch(responseText, /private database detail|valid feedback/iu);
});

test('authenticated account throttle runs before payload parsing and is isolated by user', async () => {
  const harness = createHarness();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await postFeedback(harness.app, {
      body: '{malformed',
      userId: 'limited-user',
      edgeIp: `203.0.113.${attempt}`
    });
    assert.equal(response.status, 400);
  }

  const limitedResponse = await postFeedback(harness.app, {
    body: '{malformed',
    userId: 'limited-user',
    edgeIp: '203.0.113.6'
  });
  await assertProblemResponse(limitedResponse, 429, 'RATE_LIMITED');
  assert.ok(Number(limitedResponse.headers.get('Retry-After')) >= 1);

  const otherUserResponse = await postFeedback(harness.app, {
    body: '{malformed',
    userId: 'other-user',
    edgeIp: '203.0.113.7'
  });
  assert.equal(otherUserResponse.status, 400);
});

test('Feedback edge throttle is integrated before authentication', async () => {
  const harness = createHarness();

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const response = await postFeedback(harness.app, {
      userId: null,
      edgeIp: '198.51.100.20'
    });
    assert.equal(response.status, 401);
  }

  const limitedResponse = await postFeedback(harness.app, {
    userId: null,
    edgeIp: '198.51.100.20'
  });
  await assertProblemResponse(limitedResponse, 429, 'RATE_LIMITED');
  assert.equal(
    selectP0StagingRateLimitPolicy('POST', '/api/feedback'),
    P0_STAGING_RATE_LIMIT_POLICIES.feedbackSubmissionEdge
  );
});

test('Feedback persistence adapter performs one parameterized five-field insert', async () => {
  const calls = [];
  const repository = new PostgresFeedbackSubmissionRepository({
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [] };
    }
  });
  const submission = {
    feedbackId: 'feedback-1',
    userId: 'user-1',
    category: 'BUG',
    message: VALID_MESSAGE,
    createdAt: '2026-08-26T12:00:00.000Z'
  };

  await repository.create(submission);

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO feedback_submissions/u);
  assert.match(calls[0].sql, /VALUES \(\$1, \$2, \$3, \$4, \$5\)/u);
  assert.deepEqual(calls[0].params, Object.values(submission));
  assert.deepEqual(
    Object.getOwnPropertyNames(PostgresFeedbackSubmissionRepository.prototype).sort(),
    ['constructor', 'create']
  );
});

test('Feedback migration freezes ownership, value, and normalization constraints', async () => {
  const migration = await readFile(
    new URL('server/db/migrations/0004_private_feedback.sql', REPOSITORY_ROOT),
    'utf8'
  );

  assert.match(migration, /CREATE TABLE feedback_submissions/u);
  assert.match(migration, /REFERENCES users \(user_id\)[\s\S]*ON DELETE CASCADE/u);
  assert.match(migration, /'BUG'[\s\S]*'SUGGESTION'[\s\S]*'CALCULATION_CONCERN'[\s\S]*'OTHER'/u);
  assert.match(migration, /char_length\(message\) BETWEEN 10 AND 5000/u);
  assert.match(migration, /position\(E'\\r' in message\) = 0/u);
  assert.match(migration, /CREATE INDEX feedback_submissions_user_id_idx/u);
  assert.doesNotMatch(migration, /\b(?:status|priority|severity|updated_at)\b/iu);
  assert.doesNotMatch(migration, /\b(?:BEGIN|COMMIT)\b/iu);
});

test('Feedback frontend is private, semantic, bounded, and create-only', async () => {
  const page = await readFile(
    new URL('apps/web/src/pages/feedback.astro', REPOSITORY_ROOT),
    'utf8'
  );
  const controller = await readFile(
    new URL('apps/web/src/features/feedback/private-feedback.ts', REPOSITORY_ROOT),
    'utf8'
  );
  const route = await readFile(
    new URL('server/src/app/routes/feedback.ts', REPOSITORY_ROOT),
    'utf8'
  );

  assert.match(page, /robots: 'noindex,nofollow'/u);
  assert.match(page, /<label[^>]*for="feedback-category"/u);
  assert.match(page, /<label[^>]*for="feedback-message"/u);
  assert.match(page, /<select[\s\S]*?required/u);
  assert.match(page, /<textarea[\s\S]*?required/u);
  assert.doesNotMatch(page, /<(?:textarea)[^>]*(?:minlength|maxlength)=/u);
  assert.match(page, /data-feedback-success[\s\S]*?aria-live="polite"[\s\S]*?tabindex="-1"/u);
  assert.match(page, /data-feedback-submit-another/u);
  assert.match(controller, /credentials: 'same-origin'/u);
  assert.match(controller, /cache: 'no-store'/u);
  assert.match(controller, /getLocalizedCurrentPath[\s\S]*SIGN_IN_PATH/u);
  assert.doesNotMatch(route, /engineClient|emailMagicLink|AstronomyProvider|resolver/iu);
  assert.equal(classifyApiEndpointFamily('/api/feedback'), 'feedback');
});
