import type { Context, Hono } from 'hono';
import type {
  NotificationCategoryPreferenceApiRequest,
  NotificationChannelPreferenceApiRequest,
  RegisterPushSubscriptionApiRequest
} from '@natalnode/contracts';
import {
  assertServerIdentifier,
  NotificationDomainValidationError
} from '../../notification-platform/notification-domain.js';
import type { NotificationAccountService } from '../../notification-platform/notification-account-service.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  enforceNotificationMutationRateLimit,
  type InMemoryP0StagingRateLimiter
} from '../security/api-rate-limiting.js';
import {
  isNotificationCategoryPreferenceApiRequest,
  isNotificationChannelPreferenceApiRequest,
  isRegisterPushSubscriptionApiRequest,
  readBoundedNotificationJson
} from '../validation/notifications.js';

function serviceOrUnavailable(
  context: Context,
  dependencies: ServerDependencies
): NotificationAccountService | Response {
  return (
    dependencies.notificationAccountService ??
    createProblemDetailsContextResponse(context, {
      code: 'NOTIFICATION_UNAVAILABLE',
      detailKey: 'NOTIFICATION_UNAVAILABLE'
    })
  );
}

async function parseNotificationRequest<T>(
  context: Context,
  isRequest: (value: unknown) => value is T
): Promise<T | Response> {
  const parsed = await readBoundedNotificationJson(context.req.raw);

  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE',
      detailKey: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE',
      detailKey: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (parsed.outcome !== 'parsed' || !isRequest(parsed.value)) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST',
      detailKey: 'INVALID_REQUEST'
    });
  }

  return parsed.value;
}

function invalidRequest(context: Context): Response {
  return createProblemDetailsContextResponse(context, {
    code: 'INVALID_REQUEST',
    detailKey: 'INVALID_REQUEST'
  });
}

function internalError(context: Context): Response {
  return createProblemDetailsContextResponse(context, {
    code: 'INTERNAL_ERROR',
    detailKey: 'INTERNAL_ERROR'
  });
}

function isNotificationDomainInputError(error: unknown): boolean {
  return error instanceof NotificationDomainValidationError;
}

export function registerNotificationRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: InMemoryP0StagingRateLimiter
): void {
  app.get(
    '/api/account/notifications',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const service = serviceOrUnavailable(context, dependencies);

      if (service instanceof Response) {
        return service;
      }

      try {
        return context.json(
          await service.getNotificationState(
            context.get('authenticatedPrincipal').userId
          )
        );
      } catch (_error) {
        return internalError(context);
      }
    }
  );

  app.put(
    '/api/account/notifications/preferences/channel',
    requireAuthentication(dependencies.authenticator),
    enforceNotificationMutationRateLimit(rateLimiter),
    async (context) => {
      const service = serviceOrUnavailable(context, dependencies);

      if (service instanceof Response) {
        return service;
      }

      const request = await parseNotificationRequest<NotificationChannelPreferenceApiRequest>(
        context,
        isNotificationChannelPreferenceApiRequest
      );

      if (request instanceof Response) {
        return request;
      }

      try {
        return context.json(
          await service.setChannelPreference(
            context.get('authenticatedPrincipal').userId,
            request
          )
        );
      } catch (error) {
        return isNotificationDomainInputError(error)
          ? invalidRequest(context)
          : internalError(context);
      }
    }
  );

  app.put(
    '/api/account/notifications/preferences/category',
    requireAuthentication(dependencies.authenticator),
    enforceNotificationMutationRateLimit(rateLimiter),
    async (context) => {
      const service = serviceOrUnavailable(context, dependencies);

      if (service instanceof Response) {
        return service;
      }

      const request = await parseNotificationRequest<NotificationCategoryPreferenceApiRequest>(
        context,
        isNotificationCategoryPreferenceApiRequest
      );

      if (request instanceof Response) {
        return request;
      }

      try {
        return context.json(
          await service.setCategoryPreference(
            context.get('authenticatedPrincipal').userId,
            request
          )
        );
      } catch (error) {
        return isNotificationDomainInputError(error)
          ? invalidRequest(context)
          : internalError(context);
      }
    }
  );

  app.post(
    '/api/account/notifications/web-push/subscriptions',
    requireAuthentication(dependencies.authenticator),
    enforceNotificationMutationRateLimit(rateLimiter),
    async (context) => {
      const service = serviceOrUnavailable(context, dependencies);

      if (service instanceof Response) {
        return service;
      }

      const request = await parseNotificationRequest<RegisterPushSubscriptionApiRequest>(
        context,
        isRegisterPushSubscriptionApiRequest
      );

      if (request instanceof Response) {
        return request;
      }

      try {
        const result = await service.registerPushSubscription(
          context.get('authenticatedPrincipal').userId,
          request
        );

        if (result.outcome === 'conflict') {
          return createProblemDetailsContextResponse(context, {
            code: 'PUSH_SUBSCRIPTION_UNAVAILABLE',
            detailKey: 'PUSH_SUBSCRIPTION_UNAVAILABLE'
          });
        }

        return context.json(result.response);
      } catch (error) {
        return isNotificationDomainInputError(error)
          ? invalidRequest(context)
          : internalError(context);
      }
    }
  );

  app.delete(
    '/api/account/notifications/web-push/subscriptions/:subscriptionId',
    requireAuthentication(dependencies.authenticator),
    enforceNotificationMutationRateLimit(rateLimiter),
    async (context) => {
      const service = serviceOrUnavailable(context, dependencies);

      if (service instanceof Response) {
        return service;
      }

      let subscriptionId: string;

      try {
        subscriptionId = assertServerIdentifier(
          context.req.param('subscriptionId'),
          'subscriptionId'
        );
      } catch (_error) {
        return invalidRequest(context);
      }

      try {
        await service.removePushSubscription(
          context.get('authenticatedPrincipal').userId,
          subscriptionId
        );
        return context.body(null, 204);
      } catch (_error) {
        return internalError(context);
      }
    }
  );
}
