import type { Context, Hono } from 'hono';
import type {
  CreatePractitionerReportApiRequest,
  PractitionerApplicationInput,
  PractitionerReviewProfileRevisionApiRequest,
  PractitionerProfileRevisionInput,
  PractitionerReportResolutionApiRequest,
  PractitionerReviewApplicationApiRequest
} from '@natalnode/contracts';
import {
  addPractitionerRetentionDays,
  normalizePractitionerTimestamp
} from '../../practitioner/practitioner-domain.js';
import {
  presentPractitionerApplication,
  presentPractitionerProfile,
  presentPractitionerProfileRevision,
  presentPractitionerReport,
  presentPractitionerReviewApplication,
  presentPractitionerReviewProfileRevision,
  PRACTITIONER_PUBLIC_DISCLOSURE
} from '../../practitioner/practitioner-presenters.js';
import type { PractitionerProfileRecord } from '../../practitioner/practitioner-repository.js';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import {
  enforcePractitionerAccountRateLimit,
  type RateLimitAuthority
} from '../security/api-rate-limiting.js';
import { appendPrivilegedSurfaceAuditReview } from '../security/privileged-surface-audit.js';
import {
  normalizeCreatePractitionerReportRequest,
  normalizePractitionerApplicationRequest,
  normalizePractitionerProfileRevisionRequest,
  normalizePractitionerProfileRevisionReviewRequest,
  normalizePractitionerReportResolutionRequest,
  normalizePractitionerReviewApplicationRequest,
  parsePractitionerPageQuery,
  parsePractitionerReviewQueueStatus
} from '../validation/practitioner.js';
import {
  parsePractitionerJson,
  practitionerConflict,
  practitionerForbidden,
  practitionerInternalError,
  practitionerNotFound,
  practitionerProblem,
  practitionerRepository,
  practitionerRouteId
} from './practitioner-route-helpers.js';

function applicationNow(dependencies: ServerDependencies): string {
  return normalizePractitionerTimestamp(dependencies.clock.now());
}

async function contributorFor(
  dependencies: ServerDependencies,
  userId: string | null
): Promise<boolean> {
  if (userId === null) {
    return false;
  }
  const contributions = await practitionerRepository(dependencies).listVisibleContributions(userId);
  return contributions.length > 0;
}

async function publicProfileResponse(
  dependencies: ServerDependencies,
  profile: PractitionerProfileRecord
) {
  const contributions = await practitionerRepository(dependencies).listVisibleContributions(profile.userId ?? '');
  return presentPractitionerProfile(profile, contributions);
}

function authMiddleware(dependencies: ServerDependencies) {
  return requireAuthentication(
    dependencies.authenticator,
    (context) => practitionerProblem(context, 'UNAUTHORIZED')
  );
}

export function registerPractitionerRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: RateLimitAuthority
): void {
  const repository = practitionerRepository(dependencies);

  app.get('/api/practitioners', async (context) => {
    const query = parsePractitionerPageQuery(
      context.req.query('limit'),
      context.req.query('cursor')
    );
    if (query === null) {
      return practitionerProblem(context, 'INVALID_REQUEST');
    }

    try {
      const page = await repository.listPublicProfiles(query);
      const profiles = await Promise.all(
        page.profiles.map((profile) => publicProfileResponse(dependencies, profile))
      );
      return context.json({ profiles, nextCursor: page.nextCursor });
    } catch (error) {
      return error instanceof Error && error.message === 'Practitioner cursor is invalid.'
        ? practitionerProblem(context, 'INVALID_REQUEST')
        : practitionerInternalError(context);
    }
  });

  app.get('/api/practitioners/:practitionerId', async (context) => {
    const practitionerId = practitionerRouteId(context, 'practitionerId');
    if (practitionerId instanceof Response) {
      return practitionerId;
    }

    try {
      const profile = await repository.getPublicProfile(practitionerId);
      if (profile === null) {
        return practitionerNotFound(context);
      }
      return context.json({
        profile: await publicProfileResponse(dependencies, profile),
        disclosure: PRACTITIONER_PUBLIC_DISCLOSURE
      });
    } catch (_error) {
      return practitionerInternalError(context);
    }
  });

  app.get('/api/practitioner/application', authMiddleware(dependencies), async (context) => {
    try {
      const principal = context.get('authenticatedPrincipal');
      const application = await repository.getApplicationForUser(principal.userId);
      return context.json({
        application: application === null
          ? null
          : presentPractitionerApplication(
              application,
              await contributorFor(dependencies, principal.userId)
            )
      });
    } catch (_error) {
      return practitionerInternalError(context);
    }
  });

  app.post(
    '/api/practitioner/application',
    authMiddleware(dependencies),
    enforcePractitionerAccountRateLimit(rateLimiter, 'application-submit'),
    async (context) => {
      const request = await parsePractitionerJson<PractitionerApplicationInput>(
        context,
        normalizePractitionerApplicationRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        const now = applicationNow(dependencies);
        const result = await repository.createApplication({
          applicationId: dependencies.idGenerator.generate(),
          userId: principal.userId,
          application: request,
          submittedAt: now
        });
        if (result.outcome === 'duplicate' || result.outcome === 'cooldown') {
          return practitionerConflict(context);
        }
        return context.json({
          application: presentPractitionerApplication(
            result.application,
            await contributorFor(dependencies, principal.userId)
          )
        }, 201);
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.patch(
    '/api/practitioner/application/:applicationId',
    authMiddleware(dependencies),
    enforcePractitionerAccountRateLimit(rateLimiter, 'application-update'),
    async (context) => {
      const applicationId = practitionerRouteId(context, 'applicationId');
      if (applicationId instanceof Response) {
        return applicationId;
      }
      const request = await parsePractitionerJson<PractitionerApplicationInput>(
        context,
        normalizePractitionerApplicationRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        const result = await repository.resubmitApplication({
          applicationId,
          userId: principal.userId,
          application: request,
          submittedAt: applicationNow(dependencies)
        });
        if (result.outcome !== 'updated') {
          return result.outcome === 'forbidden'
            ? practitionerForbidden(context)
            : practitionerNotFound(context);
        }
        return context.json({
          application: presentPractitionerApplication(
            result.application,
            await contributorFor(dependencies, principal.userId)
          )
        });
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.post(
    '/api/practitioner/application/:applicationId/withdraw',
    authMiddleware(dependencies),
    enforcePractitionerAccountRateLimit(rateLimiter, 'application-update'),
    async (context) => {
      const applicationId = practitionerRouteId(context, 'applicationId');
      if (applicationId instanceof Response) {
        return applicationId;
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        const now = applicationNow(dependencies);
        const result = await repository.withdrawApplication({
          applicationId,
          userId: principal.userId,
          finalizedAt: now,
          purgeEligibleAt: addPractitionerRetentionDays(now, 365)
        });
        if (result.outcome !== 'updated') {
          return result.outcome === 'forbidden'
            ? practitionerForbidden(context)
            : practitionerNotFound(context);
        }
        return context.json({
          application: presentPractitionerApplication(
            result.application,
            await contributorFor(dependencies, principal.userId)
          )
        });
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.get('/api/practitioner/profile', authMiddleware(dependencies), async (context) => {
    try {
      const principal = context.get('authenticatedPrincipal');
      const profile = await repository.getProfileForUser(principal.userId);
      if (profile === null) {
        return practitionerNotFound(context);
      }
      const pendingRevision = await repository.getPendingProfileRevision(principal.userId);
      return context.json({
        profile: await publicProfileResponse(dependencies, profile),
        pendingRevision: pendingRevision === null
          ? null
          : presentPractitionerProfileRevision(pendingRevision)
      });
    } catch (_error) {
      return practitionerInternalError(context);
    }
  });

  app.post(
    '/api/practitioner/profile/revision',
    authMiddleware(dependencies),
    enforcePractitionerAccountRateLimit(rateLimiter, 'profile-revision'),
    async (context) => {
      const request = await parsePractitionerJson<PractitionerProfileRevisionInput>(
        context,
        normalizePractitionerProfileRevisionRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        const submittedAt = applicationNow(dependencies);
        const result = await repository.createProfileRevision({
          revisionId: dependencies.idGenerator.generate(),
          userId: principal.userId,
          profile: request,
          submittedAt,
          purgeEligibleAt: addPractitionerRetentionDays(submittedAt, 90)
        });
        if (result.outcome !== 'created') {
          if (result.outcome === 'not-found') {
            return practitionerNotFound(context);
          }
          return practitionerConflict(context);
        }
        return context.json({
          revision: presentPractitionerProfileRevision(result.revision)
        }, 201);
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.post(
    '/api/practitioner/reports',
    authMiddleware(dependencies),
    enforcePractitionerAccountRateLimit(rateLimiter, 'profile-report'),
    async (context) => {
      const request = await parsePractitionerJson<CreatePractitionerReportApiRequest>(
        context,
        normalizeCreatePractitionerReportRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        const result = await repository.createProfileReport({
          reportId: dependencies.idGenerator.generate(),
          reporterUserId: context.get('authenticatedPrincipal').userId,
          practitionerId: request.practitionerId,
          category: request.category,
          details: request.details ?? '',
          createdAt: applicationNow(dependencies)
        });
        if (result.outcome === 'invalid-target') {
          return practitionerNotFound(context);
        }
        if (result.outcome === 'duplicate') {
          return practitionerConflict(context);
        }
        return context.json({ reportId: result.report.reportId, submitted: true as const }, 201);
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.get('/api/practitioner/review/applications', authMiddleware(dependencies), async (context) => {
    const requestedStatus = context.req.query('status');
    const status = parsePractitionerReviewQueueStatus(requestedStatus);
    if (requestedStatus !== undefined && status === null) {
      return practitionerProblem(context, 'INVALID_REQUEST');
    }
    try {
      const principal = context.get('authenticatedPrincipal');
      if (!(await repository.isReviewer(principal.userId))) {
        return practitionerForbidden(context);
      }
      const applications = await repository.listReviewApplications(status);
      const applicationViews = await Promise.all(
        applications.map(async (application) =>
          presentPractitionerReviewApplication(
            application,
            await contributorFor(dependencies, application.userId),
            await repository.listReviewEvents(application.applicationId)
          )
        )
      );
      const revisions = await repository.listPendingProfileRevisions();
      await appendPrivilegedSurfaceAuditReview(
        context,
        dependencies,
        principal.userId
      );
      return context.json({
        applications: applicationViews,
        revisions: revisions.map(presentPractitionerReviewProfileRevision)
      });
    } catch (_error) {
      return practitionerInternalError(context);
    }
  });

  app.patch(
    '/api/practitioner/review/applications/:applicationId',
    authMiddleware(dependencies),
    async (context) => {
      const applicationId = practitionerRouteId(context, 'applicationId');
      if (applicationId instanceof Response) {
        return applicationId;
      }
      const request = await parsePractitionerJson<PractitionerReviewApplicationApiRequest>(
        context,
        normalizePractitionerReviewApplicationRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        const now = applicationNow(dependencies);
        const result = await repository.reviewApplication({
          reviewerUserId: principal.userId,
          applicationId,
          action: request.action,
          reasonCode: request.reasonCode,
          note: request.note ?? null,
          version: request.version,
          reviewEventId: dependencies.idGenerator.generate(),
          practitionerId: dependencies.idGenerator.generate(),
          reviewedAt: now,
          purgeEligibleAt: addPractitionerRetentionDays(now, 365)
        });
        if (result.outcome === 'forbidden') {
          return practitionerForbidden(context);
        }
        if (result.outcome === 'not-found') {
          return practitionerNotFound(context);
        }
        if (result.outcome === 'stale' || result.outcome === 'invalid-transition') {
          return practitionerConflict(context);
        }
        await appendPrivilegedSurfaceAuditReview(
          context,
          dependencies,
          principal.userId
        );
        return context.json({ status: result.application.status });
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.patch(
    '/api/practitioner/review/revisions/:revisionId',
    authMiddleware(dependencies),
    async (context) => {
      const revisionId = practitionerRouteId(context, 'revisionId');
      if (revisionId instanceof Response) {
        return revisionId;
      }
      const request = await parsePractitionerJson<PractitionerReviewProfileRevisionApiRequest>(
        context,
        normalizePractitionerProfileRevisionReviewRequest
      );
      if (request instanceof Response) {
        return request;
      }

      try {
        const principal = context.get('authenticatedPrincipal');
        const now = applicationNow(dependencies);
        const result = await repository.reviewProfileRevision({
          reviewerUserId: principal.userId,
          revisionId,
          applicationId: request.applicationId,
          action: request.action,
          reasonCode: request.reasonCode,
          note: request.note ?? null,
          version: request.version,
          reviewEventId: dependencies.idGenerator.generate(),
          reviewedAt: now,
          purgeEligibleAt: addPractitionerRetentionDays(now, 365)
        });
        if (result.outcome === 'forbidden') {
          return practitionerForbidden(context);
        }
        if (result.outcome === 'not-found') {
          return practitionerNotFound(context);
        }
        if (result.outcome === 'stale') {
          return practitionerConflict(context);
        }
        await appendPrivilegedSurfaceAuditReview(
          context,
          dependencies,
          principal.userId
        );
        return context.json({ revision: presentPractitionerProfileRevision(result.revision) });
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.get('/api/practitioner/review/reports', authMiddleware(dependencies), async (context) => {
    try {
      const principal = context.get('authenticatedPrincipal');
      if (!(await repository.isReviewer(principal.userId))) {
        return practitionerForbidden(context);
      }
      const reports = await repository.listOpenProfileReports();
      await appendPrivilegedSurfaceAuditReview(
        context,
        dependencies,
        principal.userId
      );
      return context.json({
        reports: reports.map(presentPractitionerReport)
      });
    } catch (_error) {
      return practitionerInternalError(context);
    }
  });

  app.patch(
    '/api/practitioner/review/reports/:reportId',
    authMiddleware(dependencies),
    async (context) => {
      const reportId = practitionerRouteId(context, 'reportId');
      if (reportId instanceof Response) {
        return reportId;
      }
      const request = await parsePractitionerJson<PractitionerReportResolutionApiRequest>(
        context,
        normalizePractitionerReportResolutionRequest
      );
      if (request instanceof Response) {
        return request;
      }
      try {
        const now = applicationNow(dependencies);
        const result = await repository.resolveProfileReport({
          reviewerUserId: context.get('authenticatedPrincipal').userId,
          reportId,
          state: request.state,
          resolvedAt: now,
          purgeEligibleAt: addPractitionerRetentionDays(now, 365)
        });
        if (result.outcome === 'forbidden') {
          return practitionerForbidden(context);
        }
        if (result.outcome === 'not-found') {
          return practitionerNotFound(context);
        }
        if (result.outcome === 'conflict') {
          return practitionerConflict(context);
        }
        await appendPrivilegedSurfaceAuditReview(
          context,
          dependencies,
          context.get('authenticatedPrincipal').userId
        );
        return context.json({ report: presentPractitionerReport(result.report) });
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );

  app.post(
    '/api/practitioner/review/profiles/:practitionerId/founding',
    authMiddleware(dependencies),
    async (context) => {
      const practitionerId = practitionerRouteId(context, 'practitionerId');
      if (practitionerId instanceof Response) {
        return practitionerId;
      }
      try {
        const result = await repository.setFoundingPractitioner({
          reviewerUserId: context.get('authenticatedPrincipal').userId,
          practitionerId
        });
        if (result.outcome === 'forbidden') {
          return practitionerForbidden(context);
        }
        if (result.outcome === 'not-found') {
          return practitionerNotFound(context);
        }
        await appendPrivilegedSurfaceAuditReview(
          context,
          dependencies,
          context.get('authenticatedPrincipal').userId
        );
        return context.json({ foundingPractitioner: true as const });
      } catch (_error) {
        return practitionerInternalError(context);
      }
    }
  );
}
