import type { Context, Hono } from 'hono';
import type {
  CreateCommunityAnswerApiRequest,
  CreateCommunityQuestionApiRequest,
  CreateCommunityReportApiRequest,
  ModerateCommunityContentApiRequest,
  SetCommunityAcceptedAnswerApiRequest,
  UpdateCommunityAnswerApiRequest,
  UpdateCommunityProfileApiRequest,
  UpdateCommunityQuestionApiRequest
} from '@natalnode/contracts';
import {
  addRetentionDays,
  isCommunityOpaqueId,
  isCommunityReportTargetType,
  normalizeCommunityTimestamp
} from '../../community/community-domain.js';
import {
  presentCommunityAnswer,
  presentCommunityModerationReport,
  presentCommunityQuestion,
  presentCommunityQuestionDetail
} from '../../community/community-presenters.js';
import type { CommunityRepository } from '../../community/community-repository.js';
import { requireAuthentication } from '../auth/index.js';
import type { AuthenticatedPrincipal } from '../auth/request-authenticator.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import { appendPrivilegedSurfaceAuditReview } from '../security/privileged-surface-audit.js';
import {
  enforceCommunityAccountRateLimit,
  type CommunityAccountRateLimitBucket,
  type RateLimitAuthority
} from '../security/api-rate-limiting.js';
import {
  normalizeCommunityProfileRequest,
  normalizeCreateCommunityAnswerRequest,
  normalizeCreateCommunityQuestionRequest,
  normalizeCreateCommunityReportRequest,
  normalizeModerateCommunityContentRequest,
  normalizeSetCommunityAcceptedAnswerRequest,
  normalizeUpdateCommunityAnswerRequest,
  normalizeUpdateCommunityQuestionRequest,
  parseCommunityPageQuery,
  COMMUNITY_REQUEST_MAXIMUM_BYTES
} from '../validation/community.js';

type CommunityRequest =
  | CreateCommunityAnswerApiRequest
  | CreateCommunityQuestionApiRequest
  | CreateCommunityReportApiRequest
  | ModerateCommunityContentApiRequest
  | SetCommunityAcceptedAnswerApiRequest
  | UpdateCommunityAnswerApiRequest
  | UpdateCommunityProfileApiRequest
  | UpdateCommunityQuestionApiRequest;

type BodyReadResult =
  | { readonly outcome: 'read'; readonly bytes: Uint8Array }
  | { readonly outcome: 'too-large' }
  | { readonly outcome: 'invalid' };

function problem(context: Context, code: Parameters<typeof createProblemDetailsContextResponse>[1]['code']): Response {
  return createProblemDetailsContextResponse(context, { code });
}

function isInvalidCommunityCursor(error: unknown): boolean {
  return error instanceof Error && error.message === 'Community cursor is invalid.';
}

function isApplicationJson(request: Request): boolean {
  const contentType = request.headers.get('content-type');

  if (contentType === null) {
    return false;
  }

  const [mediaType] = contentType.split(';', 1);
  return mediaType?.trim().toLowerCase() === 'application/json';
}

function hasOversizedDeclaredLength(request: Request): boolean {
  const contentLength = request.headers.get('content-length');

  if (contentLength === null || !/^\d+$/u.test(contentLength)) {
    return false;
  }

  const byteLength = Number(contentLength);
  return (
    Number.isSafeInteger(byteLength) &&
    byteLength > COMMUNITY_REQUEST_MAXIMUM_BYTES
  );
}

async function readBoundedBody(request: Request): Promise<BodyReadResult> {
  if (hasOversizedDeclaredLength(request)) {
    return { outcome: 'too-large' };
  }

  if (request.body === null) {
    return { outcome: 'read', bytes: new Uint8Array() };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        break;
      }

      byteLength += chunk.value.byteLength;

      if (byteLength > COMMUNITY_REQUEST_MAXIMUM_BYTES) {
        try {
          await reader.cancel();
        } catch (_error) {
          // The bounded response remains authoritative if stream cancellation fails.
        }

        return { outcome: 'too-large' };
      }

      chunks.push(chunk.value);
    }
  } catch (_error) {
    return { outcome: 'invalid' };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { outcome: 'read', bytes };
}

async function parseCommunityRequest<T extends CommunityRequest>(
  context: Context,
  normalize: (value: unknown) => T | null
): Promise<T | Response> {
  if (!isApplicationJson(context.req.raw)) {
    return problem(context, 'UNSUPPORTED_MEDIA_TYPE');
  }

  const body = await readBoundedBody(context.req.raw);

  if (body.outcome === 'too-large') {
    return problem(context, 'PAYLOAD_TOO_LARGE');
  }

  if (body.outcome === 'invalid') {
    return problem(context, 'INVALID_REQUEST');
  }

  let payload: unknown;

  try {
    payload = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(body.bytes)
    ) as unknown;
  } catch (_error) {
    return problem(context, 'INVALID_REQUEST');
  }

  return normalize(payload) ?? problem(context, 'INVALID_REQUEST');
}

function notFound(context: Context): Response {
  return problem(context, 'NOT_FOUND');
}

function forbidden(context: Context): Response {
  return problem(context, 'FORBIDDEN');
}

function conflict(context: Context): Response {
  return problem(context, 'CONFLICT');
}

function internalError(context: Context): Response {
  return problem(context, 'INTERNAL_ERROR');
}

function invalid(context: Context): Response {
  return problem(context, 'INVALID_REQUEST');
}

function communityRepository(dependencies: ServerDependencies): CommunityRepository {
  return dependencies.persistence.community;
}

function routeId(context: Context, name: string): string | Response {
  const value = context.req.param(name);
  return isCommunityOpaqueId(value) ? value : invalid(context);
}

async function optionalPrincipal(
  dependencies: ServerDependencies,
  request: Request
): Promise<AuthenticatedPrincipal | null> {
  try {
    return await dependencies.authenticator.authenticate(request);
  } catch (_error) {
    return null;
  }
}

async function moderatorState(
  repository: CommunityRepository,
  principal: AuthenticatedPrincipal | null
): Promise<boolean> {
  return principal === null ? false : repository.isModerator(principal.userId);
}

async function moderateContent(
  context: Context,
  dependencies: ServerDependencies,
  input: {
    readonly targetType: 'QUESTION' | 'ANSWER';
    readonly targetId: string;
    readonly request: ModerateCommunityContentApiRequest;
  }
): Promise<Response> {
  const principal = context.get('authenticatedPrincipal');
  const repository = communityRepository(dependencies);

  if (!(await repository.isModerator(principal.userId))) {
    return forbidden(context);
  }

  if (input.request.action === 'DISMISS_REPORT') {
    return invalid(context);
  }

  const now = normalizeCommunityTimestamp(dependencies.clock.now());
  const result = await repository.moderate({
    moderationEventId: dependencies.idGenerator.generate(),
    actorUserId: principal.userId,
    targetType: input.targetType,
    targetId: input.targetId,
    action: input.request.action,
    reasonCode: input.request.reasonCode,
    note: input.request.note ?? null,
    createdAt: now,
    retentionExpiresAt: addRetentionDays(now, 365),
    reportId: null
  });

  if (result.outcome === 'forbidden') {
    return forbidden(context);
  }
  if (result.outcome === 'not-found') {
    return notFound(context);
  }
  if (result.outcome === 'invalid-target') {
    return conflict(context);
  }

  await appendPrivilegedSurfaceAuditReview(
    context,
    dependencies,
    principal.userId
  );

  return context.json({
    action: input.request.action,
    targetType: result.targetType,
    targetId: result.targetId,
    status: result.status
  });
}

export function registerCommunityRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: RateLimitAuthority
): void {
  const repository = communityRepository(dependencies);

  app.get('/api/community/questions', async (context) => {
    const query = parseCommunityPageQuery(
      context.req.query('limit'),
      context.req.query('cursor')
    );

    if (query === null) {
      return invalid(context);
    }

    try {
      const page = await repository.listVisibleQuestions(query);
      return context.json({
        questions: page.questions.map(presentCommunityQuestion),
        nextCursor: page.nextCursor
      });
    } catch (error) {
      return isInvalidCommunityCursor(error)
        ? invalid(context)
        : internalError(context);
    }
  });

  app.get('/api/community/questions/:questionId', async (context) => {
    const questionId = routeId(context, 'questionId');
    if (questionId instanceof Response) {
      return questionId;
    }

    try {
      const detail = await repository.getQuestion(questionId);
      if (detail === null) {
        return notFound(context);
      }

      const principal = await optionalPrincipal(dependencies, context.req.raw);
      const isModerator = await moderatorState(repository, principal);
      return context.json(
        presentCommunityQuestionDetail(detail, principal, isModerator)
      );
    } catch (_error) {
      return internalError(context);
    }
  });

  app.get(
    '/api/account/community-profile',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      try {
        const profile = await repository.getProfile(
          context.get('authenticatedPrincipal').userId
        );
        return context.json({ displayName: profile?.displayName ?? null });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.put(
    '/api/account/community-profile',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const request = await parseCommunityRequest(
        context,
        normalizeCommunityProfileRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const existing = await repository.getProfile(principal.userId);
        const now = normalizeCommunityTimestamp(dependencies.clock.now());
        const profile = await repository.saveProfile({
          userId: principal.userId,
          displayName: request.displayName,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now
        });
        return context.json({ displayName: profile.displayName });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.post(
    '/api/community/questions',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'question-create'),
    async (context) => {
      const request = await parseCommunityRequest(
        context,
        normalizeCreateCommunityQuestionRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const profile = await repository.getProfile(principal.userId);
        if (profile === null) {
          return conflict(context);
        }

        const now = normalizeCommunityTimestamp(dependencies.clock.now());
        const question = await repository.createQuestion({
          questionId: dependencies.idGenerator.generate(),
          authorUserId: principal.userId,
          title: request.title,
          body: request.body,
          topicId: request.topicId,
          createdAt: now,
          updatedAt: now
        });
        return question === null
          ? conflict(context)
          : context.json(
              { question: presentCommunityQuestion(question) },
              201
            );
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.patch(
    '/api/community/questions/:questionId',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const questionId = routeId(context, 'questionId');
      if (questionId instanceof Response) {
        return questionId;
      }

      const request = await parseCommunityRequest<UpdateCommunityQuestionApiRequest>(
        context,
        normalizeUpdateCommunityQuestionRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const existing = await repository.getQuestionRecord(questionId);
        if (existing === null || existing.status !== 'VISIBLE') {
          return notFound(context);
        }
        if (existing.authorUserId !== principal.userId) {
          return forbidden(context);
        }

        const question = await repository.updateQuestion({
          questionId,
          authorUserId: principal.userId,
          title: request.title,
          body: request.body,
          topicId: request.topicId,
          updatedAt: normalizeCommunityTimestamp(dependencies.clock.now())
        });
        return question === null
          ? conflict(context)
          : context.json({ question: presentCommunityQuestion(question) });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.delete(
    '/api/community/questions/:questionId',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const questionId = routeId(context, 'questionId');
      if (questionId instanceof Response) {
        return questionId;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const existing = await repository.getQuestionRecord(questionId);
        if (existing === null) {
          return notFound(context);
        }
        if (existing.authorUserId !== principal.userId) {
          return forbidden(context);
        }

        const deletedAt = normalizeCommunityTimestamp(dependencies.clock.now());
        const result = await repository.deleteQuestion({
          questionId,
          authorUserId: principal.userId,
          deletedAt,
          retentionExpiresAt: addRetentionDays(deletedAt, 90)
        });
        return result === 'forbidden'
          ? forbidden(context)
          : result === 'not-found'
            ? notFound(context)
            : context.json({ deleted: true as const });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.post(
    '/api/community/questions/:questionId/answers',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'answer-create'),
    async (context) => {
      const questionId = routeId(context, 'questionId');
      if (questionId instanceof Response) {
        return questionId;
      }

      const request = await parseCommunityRequest(
        context,
        normalizeCreateCommunityAnswerRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const question = await repository.getQuestionRecord(questionId);
        const profile = await repository.getProfile(principal.userId);
        if (question === null || question.status !== 'VISIBLE') {
          return notFound(context);
        }
        if (profile === null) {
          return conflict(context);
        }

        const now = normalizeCommunityTimestamp(dependencies.clock.now());
        const answer = await repository.createAnswer({
          answerId: dependencies.idGenerator.generate(),
          questionId,
          authorUserId: principal.userId,
          body: request.body,
          createdAt: now,
          updatedAt: now
        });
        return answer === null
          ? conflict(context)
          : context.json({ answer: presentCommunityAnswer(answer) }, 201);
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.patch(
    '/api/community/answers/:answerId',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const answerId = routeId(context, 'answerId');
      if (answerId instanceof Response) {
        return answerId;
      }

      const request = await parseCommunityRequest<UpdateCommunityAnswerApiRequest>(
        context,
        normalizeUpdateCommunityAnswerRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const existing = await repository.getAnswerRecord(answerId);
        if (existing === null || existing.status !== 'VISIBLE') {
          return notFound(context);
        }
        if (existing.authorUserId !== principal.userId) {
          return forbidden(context);
        }
        const parentQuestion = await repository.getQuestionRecord(existing.questionId);
        if (parentQuestion === null || parentQuestion.status !== 'VISIBLE') {
          return notFound(context);
        }

        const answer = await repository.updateAnswer({
          answerId,
          authorUserId: principal.userId,
          body: request.body,
          updatedAt: normalizeCommunityTimestamp(dependencies.clock.now())
        });
        return answer === null
          ? conflict(context)
          : context.json({ answer: presentCommunityAnswer(answer) });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.delete(
    '/api/community/answers/:answerId',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const answerId = routeId(context, 'answerId');
      if (answerId instanceof Response) {
        return answerId;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const existing = await repository.getAnswerRecord(answerId);
        if (existing === null) {
          return notFound(context);
        }
        if (existing.authorUserId !== principal.userId) {
          return forbidden(context);
        }

        const deletedAt = normalizeCommunityTimestamp(dependencies.clock.now());
        const result = await repository.deleteAnswer({
          answerId,
          authorUserId: principal.userId,
          deletedAt,
          retentionExpiresAt: addRetentionDays(deletedAt, 90)
        });
        return result === 'forbidden'
          ? forbidden(context)
          : result === 'not-found'
            ? notFound(context)
            : context.json({ deleted: true as const });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.put(
    '/api/community/questions/:questionId/accepted-answer',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const questionId = routeId(context, 'questionId');
      if (questionId instanceof Response) {
        return questionId;
      }

      const request = await parseCommunityRequest<SetCommunityAcceptedAnswerApiRequest>(
        context,
        normalizeSetCommunityAcceptedAnswerRequest
      );
      if (request instanceof Response) {
        return request;
      }

      return setAcceptedAnswer(context, dependencies, questionId, request);
    }
  );

  app.delete(
    '/api/community/questions/:questionId/accepted-answer',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'mutation'),
    async (context) => {
      const questionId = routeId(context, 'questionId');
      if (questionId instanceof Response) {
        return questionId;
      }

      return setAcceptedAnswer(context, dependencies, questionId, {
        answerId: null
      });
    }
  );

  app.post(
    '/api/community/reports',
    requireAuthentication(dependencies.authenticator),
    enforceCommunityAccountRateLimit(rateLimiter, 'report'),
    async (context) => {
      const request = await parseCommunityRequest(
        context,
        normalizeCreateCommunityReportRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      try {
        const result = await repository.createReport({
          reportId: dependencies.idGenerator.generate(),
          reporterUserId: principal.userId,
          targetType: request.targetType,
          targetId: request.targetId,
          category: request.category,
          details: request.details ?? '',
          createdAt: normalizeCommunityTimestamp(dependencies.clock.now())
        });

        if (result.outcome === 'duplicate') {
          return conflict(context);
        }
        if (result.outcome === 'invalid-target') {
          return notFound(context);
        }

        return context.json(
          { reportId: result.report.reportId, submitted: true as const },
          201
        );
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.get(
    '/api/community/moderation/reports',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      try {
        const principal = context.get('authenticatedPrincipal');
        if (!(await repository.isModerator(principal.userId))) {
          return forbidden(context);
        }
        const reports = await repository.listOpenReports();
        await appendPrivilegedSurfaceAuditReview(
          context,
          dependencies,
          principal.userId
        );
        return context.json({
          reports: reports.map(presentCommunityModerationReport)
        });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.patch(
    '/api/community/moderation/:targetType/:targetId',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const targetType = context.req.param('targetType');
      const targetId = routeId(context, 'targetId');
      if (
        !isCommunityReportTargetType(targetType) ||
        targetId instanceof Response
      ) {
        return invalid(context);
      }

      const request = await parseCommunityRequest(
        context,
        normalizeModerateCommunityContentRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        return await moderateContent(context, dependencies, {
          targetType,
          targetId,
          request
        });
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.post(
    '/api/community/moderation/reports/:reportId/dismiss',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const reportId = routeId(context, 'reportId');
      if (reportId instanceof Response) {
        return reportId;
      }

      const request = await parseCommunityRequest(
        context,
        normalizeModerateCommunityContentRequest
      );
      if (request instanceof Response) {
        return request;
      }
      if (
        request.action !== 'DISMISS_REPORT' ||
        request.reportId !== reportId
      ) {
        return invalid(context);
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        if (!(await repository.isModerator(principal.userId))) {
          return forbidden(context);
        }
        const now = normalizeCommunityTimestamp(dependencies.clock.now());
        const result = await repository.moderate({
          moderationEventId: dependencies.idGenerator.generate(),
          actorUserId: principal.userId,
          targetType: 'QUESTION',
          targetId: reportId,
          action: request.action,
          reasonCode: request.reasonCode,
          note: request.note ?? null,
          createdAt: now,
          retentionExpiresAt: addRetentionDays(now, 365),
          reportId
        });

        if (result.outcome === 'forbidden') {
          return forbidden(context);
        }
        if (result.outcome === 'not-found') {
          return notFound(context);
        }
        if (result.outcome === 'invalid-target') {
          return conflict(context);
        }

        await appendPrivilegedSurfaceAuditReview(
          context,
          dependencies,
          principal.userId
        );

        return context.json({
          action: request.action,
          targetType: result.targetType,
          targetId: result.targetId,
          status: result.status
        });
      } catch (_error) {
        return internalError(context);
      }
    }
  );
}

async function setAcceptedAnswer(
  context: Context,
  dependencies: ServerDependencies,
  questionId: string,
  request: SetCommunityAcceptedAnswerApiRequest
): Promise<Response> {
  const repository = communityRepository(dependencies);
  const principal = context.get('authenticatedPrincipal');

  try {
    const result = await repository.setAcceptedAnswer({
      questionId,
      questionAuthorUserId: principal.userId,
      answerId: request.answerId,
      acceptedAt: normalizeCommunityTimestamp(dependencies.clock.now())
    });

    if (result === 'forbidden') {
      return forbidden(context);
    }
    if (result === 'not-found') {
      return notFound(context);
    }

    return context.json({
      acceptedAnswerId: request.answerId
    });
  } catch (_error) {
    return internalError(context);
  }
}
