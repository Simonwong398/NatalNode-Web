import type { Context, Hono } from 'hono';
import type {
  FoundationsAssessmentAttemptApiRequest,
  FoundationsCompleteLessonApiRequest,
  FoundationsMergeProgressApiRequest
} from '@natalnode/contracts';
import {
  FoundationsLearningValidationError,
  type FoundationsLearningService
} from '../../learning/foundations/postgres-foundations-learning-service.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  isFoundationsAssessmentAttemptApiRequest,
  isFoundationsCompleteLessonApiRequest,
  isFoundationsMergeProgressApiRequest,
  readBoundedFoundationsLearningJson
} from '../validation/learn-foundations.js';

export const FOUNDATIONS_PROGRESS_ROUTE = '/api/learn/foundations/progress';
export const FOUNDATIONS_COMPLETE_LESSON_ROUTE =
  '/api/learn/foundations/progress/complete';
export const FOUNDATIONS_MERGE_PROGRESS_ROUTE =
  '/api/learn/foundations/progress/merge';
export const FOUNDATIONS_ASSESSMENT_ATTEMPT_ROUTE =
  '/api/learn/foundations/assessment/attempts';

function serviceOrUnavailable(
  context: Context,
  dependencies: ServerDependencies
): FoundationsLearningService | Response {
  return (
    dependencies.foundationsLearningService ??
    createProblemDetailsContextResponse(context, { code: 'INTERNAL_ERROR' })
  );
}

async function parseRequest<T>(
  context: Context,
  guard: (value: unknown) => value is T
): Promise<T | Response> {
  const parsed = await readBoundedFoundationsLearningJson(context.req.raw);
  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }
  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  if (parsed.outcome !== 'parsed' || !guard(parsed.value)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }
  return parsed.value;
}

function invalidRequest(context: Context): Response {
  return createProblemDetailsContextResponse(context, {
    code: 'INVALID_REQUEST'
  });
}

function internalError(context: Context): Response {
  return createProblemDetailsContextResponse(context, {
    code: 'INTERNAL_ERROR'
  });
}

function isLearningValidationError(error: unknown): boolean {
  return error instanceof FoundationsLearningValidationError;
}

function noStoreJson(context: Context, value: unknown): Response {
  context.header('Cache-Control', 'no-store');
  return context.json(value);
}

export function registerFoundationsLearningRoutes(
  app: Hono,
  dependencies: ServerDependencies
): void {
  app.get(
    FOUNDATIONS_PROGRESS_ROUTE,
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const service = serviceOrUnavailable(context, dependencies);
      if (service instanceof Response) {
        return service;
      }

      try {
        return noStoreJson(
          context,
          await service.getProgress(
            context.get('authenticatedPrincipal').userId
          )
        );
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.post(
    FOUNDATIONS_COMPLETE_LESSON_ROUTE,
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const request = await parseRequest<FoundationsCompleteLessonApiRequest>(
        context,
        isFoundationsCompleteLessonApiRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const service = serviceOrUnavailable(context, dependencies);
      if (service instanceof Response) {
        return service;
      }

      try {
        return noStoreJson(
          context,
          await service.completeLesson(
            context.get('authenticatedPrincipal').userId,
            request
          )
        );
      } catch (error) {
        return isLearningValidationError(error)
          ? invalidRequest(context)
          : internalError(context);
      }
    }
  );

  app.post(
    FOUNDATIONS_MERGE_PROGRESS_ROUTE,
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const request = await parseRequest<FoundationsMergeProgressApiRequest>(
        context,
        isFoundationsMergeProgressApiRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const service = serviceOrUnavailable(context, dependencies);
      if (service instanceof Response) {
        return service;
      }

      try {
        return noStoreJson(
          context,
          await service.mergeProgress(
            context.get('authenticatedPrincipal').userId,
            request
          )
        );
      } catch (error) {
        return isLearningValidationError(error)
          ? invalidRequest(context)
          : internalError(context);
      }
    }
  );

  app.post(
    FOUNDATIONS_ASSESSMENT_ATTEMPT_ROUTE,
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const request = await parseRequest<FoundationsAssessmentAttemptApiRequest>(
        context,
        isFoundationsAssessmentAttemptApiRequest
      );
      if (request instanceof Response) {
        return request;
      }

      const service = serviceOrUnavailable(context, dependencies);
      if (service instanceof Response) {
        return service;
      }

      try {
        return noStoreJson(
          context,
          await service.submitAssessment(
            context.get('authenticatedPrincipal').userId,
            request
          )
        );
      } catch (error) {
        return isLearningValidationError(error)
          ? invalidRequest(context)
          : internalError(context);
      }
    }
  );
}
