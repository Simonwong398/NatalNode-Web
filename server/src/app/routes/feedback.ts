import type { Context, Hono } from 'hono';
import type {
  CreateFeedbackApiRequest,
  CreateFeedbackApiResponse
} from '@natalnode/contracts';
import type { FeedbackSubmissionRecord } from '../../persistence/index.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  enforceFeedbackAccountRateLimit,
  type InMemoryP0StagingRateLimiter
} from '../security/api-rate-limiting.js';
import { normalizeCreateFeedbackApiRequest } from '../validation/index.js';

export const FEEDBACK_REQUEST_MAXIMUM_BYTES = 32 * 1_024;

type BoundedBodyReadResult =
  | { readonly outcome: 'read'; readonly bytes: Uint8Array }
  | { readonly outcome: 'too-large' }
  | { readonly outcome: 'invalid' };

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
  return Number.isSafeInteger(byteLength) && byteLength > FEEDBACK_REQUEST_MAXIMUM_BYTES;
}

async function readBoundedRequestBody(request: Request): Promise<BoundedBodyReadResult> {
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

      if (byteLength > FEEDBACK_REQUEST_MAXIMUM_BYTES) {
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

async function parseFeedbackRequest(
  context: Context
): Promise<CreateFeedbackApiRequest | Response> {
  if (!isApplicationJson(context.req.raw)) {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  const body = await readBoundedRequestBody(context.req.raw);

  if (body.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (body.outcome === 'invalid') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  let payload: unknown;

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body.bytes);
    payload = JSON.parse(text) as unknown;
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return normalizeCreateFeedbackApiRequest(payload)
    ?? createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
}

export function registerFeedbackRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: InMemoryP0StagingRateLimiter
): void {
  app.post(
    '/api/feedback',
    requireAuthentication(dependencies.authenticator),
    enforceFeedbackAccountRateLimit(rateLimiter),
    async (context) => {
      const request = await parseFeedbackRequest(context);

      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      const submission: FeedbackSubmissionRecord = {
        feedbackId: dependencies.idGenerator.generate(),
        userId: principal.userId,
        category: request.category,
        message: request.message,
        createdAt: dependencies.clock.now()
      };

      await dependencies.persistence.feedbackSubmissions.create(submission);

      const response: CreateFeedbackApiResponse = { submitted: true };
      return context.json(response, 201);
    }
  );
}
