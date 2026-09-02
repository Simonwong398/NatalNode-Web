import type { Context } from 'hono';
import type { ServerDependencies } from '../dependencies.js';

/**
 * Records access to a restricted moderation/reviewer queue in the existing
 * AUDIT/REVIEW stream. The event intentionally carries no queue contents,
 * target IDs, report details, or account data.
 */
export async function appendPrivilegedSurfaceAuditReview(
  context: Context,
  dependencies: ServerDependencies,
  actorId: string
): Promise<void> {
  const repository = dependencies.persistence.privacyAccessAudit;

  if (repository === undefined) {
    if (dependencies.operationalConfig?.privacyAccessAuditRequired === true) {
      throw new Error('Privacy access audit is required for this runtime.');
    }

    return;
  }

  const requestId = context.get('requestId');
  await repository.append({
    auditEventId: dependencies.idGenerator.generate(),
    occurredAt: dependencies.clock.now(),
    actorType: 'HUMAN',
    actorId,
    action: 'REVIEW',
    resourceCategory: 'AUDIT',
    outcome: 'SUCCESS',
    ...(requestId === undefined ? {} : { requestId })
  });
}
