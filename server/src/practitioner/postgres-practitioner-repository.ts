import type { SqlExecutor, TransactionRunner } from '../db/index.js';
import {
  addPractitionerRetentionDays,
  practitionerApplicationTransitionIsAllowed,
  isPractitionerFinalApplicationStatus
} from './practitioner-domain.js';
import type {
  PractitionerApplicationInput,
  PractitionerProfileRevisionInput,
  PractitionerReviewAction,
  PractitionerReviewReasonCode
} from '@natalnode/contracts';
import type {
  PractitionerApplicationCreateOutcome,
  PractitionerApplicationMutationOutcome,
  PractitionerFoundingOutcome,
  PractitionerProfilePage,
  PractitionerProfileRevisionOutcome,
  PractitionerProfileRevisionReviewOutcome,
  PractitionerReportCreateOutcome,
  PractitionerReportResolutionOutcome,
  PractitionerReportRecord,
  PractitionerRepository,
  PractitionerRetentionPurgeResult,
  PractitionerReviewOutcome
} from './practitioner-repository.js';
import {
  decodePractitionerProfileCursor,
  encodePractitionerProfileCursor,
  mapPractitionerApplication,
  mapPractitionerProfile,
  mapPractitionerReport,
  mapPractitionerRevision,
  mapPractitionerReviewEvent,
  type PractitionerApplicationRow,
  type PractitionerContributionRow,
  type PractitionerFinalApplicationRow,
  type PractitionerPendingRevisionRow,
  type PractitionerProfileRow,
  type PractitionerProfileRevisionRow,
  type PractitionerReportRow,
  type PractitionerReviewEventRow,
  type PractitionerRevisionLockRow
} from './practitioner-postgres-support.js';
import {
  DELETE_EXPIRED_ENDED_PRACTITIONER_PROFILES_SQL,
  DELETE_EXPIRED_PRACTITIONER_APPLICATIONS_SQL,
  DELETE_EXPIRED_PRACTITIONER_REPORTS_SQL,
  DELETE_EXPIRED_PRACTITIONER_REVISIONS_SQL,
  DELETE_EXPIRED_PRACTITIONER_REVIEW_EVENTS_SQL,
  DUPLICATE_PRACTITIONER_REPORT_SQL,
  FIND_ACTIVE_PRACTITIONER_APPLICATION_SQL,
  FIND_LATEST_FINAL_PRACTITIONER_APPLICATION_SQL,
  FIND_PRACTITIONER_APPLICATION_FOR_USER_SQL,
  GET_PENDING_PRACTITIONER_PROFILE_REVISION_FOR_USER_SQL,
  GET_PRACTITIONER_PROFILE_FOR_USER_SQL,
  GET_PUBLIC_PRACTITIONER_PROFILE_SQL,
  INSERT_PRACTITIONER_APPLICATION_SQL,
  INSERT_PRACTITIONER_PROFILE_FROM_APPLICATION_SQL,
  INSERT_PRACTITIONER_PROFILE_REVISION_SQL,
  INSERT_PRACTITIONER_REPORT_SQL,
  INSERT_PRACTITIONER_REVIEW_EVENT_SQL,
  LIST_OPEN_PRACTITIONER_REPORTS_SQL,
  LIST_PRACTITIONER_CONTRIBUTIONS_SQL,
  LIST_PENDING_PRACTITIONER_PROFILE_REVISIONS_SQL,
  LIST_PRACTITIONER_REVIEW_EVENTS_SQL,
  LIST_PRACTITIONER_REVIEW_APPLICATIONS_SQL,
  LIST_PUBLIC_PRACTITIONER_PROFILES_SQL,
  LOCK_PRACTITIONER_APPLICATION_SQL,
  LOCK_PRACTITIONER_PROFILE_FOR_USER_SQL,
  LOCK_PRACTITIONER_PROFILE_REVISION_SQL,
  LOCK_PRACTITIONER_PROFILE_SQL,
  LOCK_PRACTITIONER_REPORT_SQL,
  PRACTITIONER_REVIEWER_EXISTS_SQL,
  PROMOTE_PRACTITIONER_PROFILE_REVISION_SQL,
  RESUBMIT_PRACTITIONER_APPLICATION_SQL,
  SET_PRACTITIONER_FOUNDING_LABEL_SQL,
  UPDATE_PRACTITIONER_PROFILE_REVISION_SQL,
  UPDATE_PRACTITIONER_REPORT_SQL,
  UPDATE_REVOKED_PRACTITIONER_PROFILE_SQL,
  UPDATE_REVIEWED_PRACTITIONER_APPLICATION_SQL,
  WITHDRAW_PRACTITIONER_APPLICATION_SQL
} from './practitioner-queries.js';

function applicationParams(
  application: PractitionerApplicationInput
): readonly unknown[] {
  return [
    application.requestedDisplayName,
    application.professionalHeadline,
    application.bio,
    application.practiceAreas,
    application.languages,
    application.countryOrRegion,
    application.websiteUrl ?? null,
    application.practiceStatement,
    application.evidenceUrls,
    application.consentToPublicProfile
  ];
}

function applicationInputParams(
  id: string,
  userId: string,
  application: PractitionerApplicationInput,
  submittedAt: string
): readonly unknown[] {
  return [id, userId, ...applicationParams(application), submittedAt];
}

function practitionerCursorParams(cursor: string | null): readonly unknown[] {
  const position = decodePractitionerProfileCursor(cursor);
  return position === null
    ? [null, null]
    : [position.displayName, position.practitionerId];
}

/** PostgreSQL boundary for the complete Practitioner / Contributor V1 surface. */
export class PostgresPractitionerRepository implements PractitionerRepository {
  public constructor(
    private readonly executor: SqlExecutor,
    private readonly transactionRunner: TransactionRunner
  ) {}

  public async getApplicationForUser(userId: string) {
    const result = await this.executor.query<PractitionerApplicationRow>(
      FIND_PRACTITIONER_APPLICATION_FOR_USER_SQL,
      [userId]
    );
    const row = result.rows[0];
    return row === undefined ? null : mapPractitionerApplication(row);
  }

  public async createApplication(input: {
    readonly applicationId: string;
    readonly userId: string;
    readonly application: PractitionerApplicationInput;
    readonly submittedAt: string;
  }): Promise<PractitionerApplicationCreateOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const active = await executor.query<{ application_id: string }>(
        FIND_ACTIVE_PRACTITIONER_APPLICATION_SQL,
        [input.userId]
      );
      if (active.rows.length > 0) {
        return { outcome: 'duplicate' };
      }

      const latest = await executor.query<PractitionerFinalApplicationRow>(
        FIND_LATEST_FINAL_PRACTITIONER_APPLICATION_SQL,
        [input.userId]
      );
      const previous = latest.rows[0];
      if (previous !== undefined) {
        if (previous.retention_hold !== 'NONE') {
          // Keep hold state private while preventing reapplication from
          // bypassing an active legal or security hold.
          return { outcome: 'duplicate' };
        }
        const cooldownDays = previous.status === 'REJECTED' ? 30 : previous.status === 'REVOKED' ? 90 : 0;
        const availableAt = addPractitionerRetentionDays(
          previous.finalized_at instanceof Date
            ? previous.finalized_at.toISOString()
            : previous.finalized_at,
          cooldownDays
        );
        if (Date.parse(input.submittedAt) < Date.parse(availableAt)) {
          return { outcome: 'cooldown', availableAt };
        }
      }

      const result = await executor.query<PractitionerApplicationRow>(
        INSERT_PRACTITIONER_APPLICATION_SQL,
        applicationInputParams(
          input.applicationId,
          input.userId,
          input.application,
          input.submittedAt
        )
      );
      const row = result.rows[0];
      return row === undefined
        ? { outcome: 'duplicate' }
        : { outcome: 'created', application: mapPractitionerApplication(row) };
    });
  }

  public async resubmitApplication(input: {
    readonly applicationId: string;
    readonly userId: string;
    readonly application: PractitionerApplicationInput;
    readonly submittedAt: string;
  }): Promise<PractitionerApplicationMutationOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const result = await executor.query<PractitionerApplicationRow>(
        RESUBMIT_PRACTITIONER_APPLICATION_SQL,
        applicationInputParams(
          input.applicationId,
          input.userId,
          input.application,
          input.submittedAt
        )
      );
      const row = result.rows[0];
      return row === undefined
        ? { outcome: 'not-found' }
        : { outcome: 'updated', application: mapPractitionerApplication(row) };
    });
  }

  public async withdrawApplication(input: {
    readonly applicationId: string;
    readonly userId: string;
    readonly finalizedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerApplicationMutationOutcome> {
    const result = await this.executor.query<PractitionerApplicationRow>(
      WITHDRAW_PRACTITIONER_APPLICATION_SQL,
      [
        input.applicationId,
        input.userId,
        input.finalizedAt,
        input.purgeEligibleAt
      ]
    );
    const row = result.rows[0];
    return row === undefined
      ? { outcome: 'not-found' }
      : { outcome: 'updated', application: mapPractitionerApplication(row) };
  }

  public async isReviewer(userId: string): Promise<boolean> {
    const result = await this.executor.query<{ user_id: string }>(
      PRACTITIONER_REVIEWER_EXISTS_SQL,
      [userId]
    );
    return result.rows.length > 0;
  }

  public async listReviewApplications(status: PractitionerApplicationRow['status'] | null) {
    const result = await this.executor.query<PractitionerApplicationRow>(
      LIST_PRACTITIONER_REVIEW_APPLICATIONS_SQL,
      [status]
    );
    return result.rows.map(mapPractitionerApplication);
  }

  public async listReviewEvents(applicationId: string) {
    const result = await this.executor.query<PractitionerReviewEventRow>(
      LIST_PRACTITIONER_REVIEW_EVENTS_SQL,
      [applicationId]
    );
    return result.rows.map(mapPractitionerReviewEvent);
  }

  public async listPendingProfileRevisions() {
    const result = await this.executor.query<PractitionerPendingRevisionRow>(
      LIST_PENDING_PRACTITIONER_PROFILE_REVISIONS_SQL
    );
    return result.rows.map((row) => ({
      ...mapPractitionerRevision(row),
      applicationId: row.application_id,
      userId: row.profile_user_id,
      applicationVersion: row.application_version
    }));
  }

  public async reviewApplication(input: {
    readonly reviewerUserId: string;
    readonly applicationId: string;
    readonly action: PractitionerReviewAction;
    readonly reasonCode: PractitionerReviewReasonCode;
    readonly note: string | null;
    readonly version: number;
    readonly reviewEventId: string;
    readonly practitionerId: string;
    readonly reviewedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerReviewOutcome> {
    return this.transactionRunner.run(async (executor) => {
      if (!(await this.isReviewerWithExecutor(executor, input.reviewerUserId))) {
        return { outcome: 'forbidden' };
      }

      const lockedResult = await executor.query<PractitionerApplicationRow>(
        LOCK_PRACTITIONER_APPLICATION_SQL,
        [input.applicationId]
      );
      const application = lockedResult.rows[0];
      if (application === undefined) {
        return { outcome: 'not-found' };
      }
      if (application.user_id === input.reviewerUserId) {
        return { outcome: 'forbidden' };
      }
      if (application.version !== input.version) {
        return { outcome: 'stale' };
      }

      const currentStatus = application.status;
      const nextStatus: PractitionerApplicationRow['status'] =
        input.action === 'APPROVE'
          ? 'APPROVED'
          : input.action === 'REQUEST_CHANGES'
            ? 'CHANGES_REQUESTED'
            : input.action === 'REJECT'
              ? 'REJECTED'
              : 'REVOKED';

      if (!practitionerApplicationTransitionIsAllowed(currentStatus, nextStatus)) {
        return { outcome: 'invalid-transition' };
      }

      if (input.action === 'APPROVE') {
        const profile = await executor.query<PractitionerProfileRow>(
          INSERT_PRACTITIONER_PROFILE_FROM_APPLICATION_SQL,
          [input.applicationId, input.practitionerId, input.reviewedAt]
        );
        if (profile.rows.length !== 1) {
          return { outcome: 'invalid-transition' };
        }
      }

      if (input.action === 'REVOKE') {
        const profile = await executor.query<{ practitioner_id: string }>(
          UPDATE_REVOKED_PRACTITIONER_PROFILE_SQL,
          [input.applicationId, input.reviewedAt]
        );
        if (profile.rows.length !== 1) {
          return { outcome: 'invalid-transition' };
        }
      }

      const finalizedAt = isPractitionerFinalApplicationStatus(nextStatus)
        ? input.reviewedAt
        : null;
      const purgeEligibleAt = isPractitionerFinalApplicationStatus(nextStatus)
        ? input.purgeEligibleAt
        : null;
      const updatedResult = await executor.query<PractitionerApplicationRow>(
        UPDATE_REVIEWED_PRACTITIONER_APPLICATION_SQL,
        [input.applicationId, nextStatus, finalizedAt, purgeEligibleAt]
      );
      const updated = updatedResult.rows[0];
      if (updated === undefined) {
        return { outcome: 'stale' };
      }

      await executor.query(INSERT_PRACTITIONER_REVIEW_EVENT_SQL, [
        input.reviewEventId,
        input.reviewerUserId,
        input.applicationId,
        null,
        'APPLICATION',
        input.action,
        input.reasonCode,
        input.note,
        input.version,
        input.reviewedAt,
        purgeEligibleAt
      ]);

      return { outcome: 'updated', application: mapPractitionerApplication(updated) };
    });
  }

  private async isReviewerWithExecutor(
    executor: SqlExecutor,
    userId: string
  ): Promise<boolean> {
    const result = await executor.query<{ user_id: string }>(
      PRACTITIONER_REVIEWER_EXISTS_SQL,
      [userId]
    );
    return result.rows.length > 0;
  }

  public async getProfileForUser(userId: string) {
    const result = await this.executor.query<PractitionerProfileRow>(
      GET_PRACTITIONER_PROFILE_FOR_USER_SQL,
      [userId]
    );
    const row = result.rows[0];
    return row === undefined ? null : mapPractitionerProfile(row);
  }

  public async getPublicProfile(practitionerId: string) {
    const result = await this.executor.query<PractitionerProfileRow>(
      GET_PUBLIC_PRACTITIONER_PROFILE_SQL,
      [practitionerId]
    );
    const row = result.rows[0];
    return row === undefined ? null : mapPractitionerProfile(row);
  }

  public async listPublicProfiles(input: {
    readonly limit: number;
    readonly cursor: string | null;
  }): Promise<PractitionerProfilePage> {
    const result = await this.executor.query<PractitionerProfileRow>(
      LIST_PUBLIC_PRACTITIONER_PROFILES_SQL,
      [...practitionerCursorParams(input.cursor), input.limit + 1]
    );
    const rows = result.rows.slice(0, input.limit);
    const profiles = rows.map(mapPractitionerProfile);
    const last = profiles[profiles.length - 1];
    return {
      profiles,
      nextCursor:
        result.rows.length > input.limit && last !== undefined
          ? encodePractitionerProfileCursor({
              displayName: last.displayName,
              practitionerId: last.practitionerId
            })
          : null
    };
  }

  public async listVisibleContributions(userId: string) {
    const result = await this.executor.query<PractitionerContributionRow>(
      LIST_PRACTITIONER_CONTRIBUTIONS_SQL,
      [userId]
    );
    return result.rows.map((row) => ({
      kind: row.kind,
      contributionId: row.contribution_id,
      title: row.title,
      href: `/community/question?id=${encodeURIComponent(row.question_id)}`,
      createdAt: new Date(row.created_at).toISOString()
    }));
  }

  public async getPendingProfileRevision(userId: string) {
    const result = await this.executor.query<PractitionerProfileRevisionRow>(
      GET_PENDING_PRACTITIONER_PROFILE_REVISION_FOR_USER_SQL,
      [userId]
    );
    const row = result.rows[0];
    return row === undefined ? null : mapPractitionerRevision(row);
  }

  public async createProfileRevision(input: {
    readonly revisionId: string;
    readonly userId: string;
    readonly profile: PractitionerProfileRevisionInput;
    readonly submittedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerProfileRevisionOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const profileResult = await executor.query<PractitionerProfileRow>(
        LOCK_PRACTITIONER_PROFILE_FOR_USER_SQL,
        [input.userId]
      );
      const profile = profileResult.rows[0];
      if (profile === undefined) {
        return { outcome: 'not-found' };
      }

      const pending = await executor.query<PractitionerProfileRevisionRow>(
        GET_PENDING_PRACTITIONER_PROFILE_REVISION_FOR_USER_SQL,
        [input.userId]
      );
      if (pending.rows.length > 0) {
        return { outcome: 'conflict' };
      }

      const result = await executor.query<PractitionerProfileRevisionRow>(
        INSERT_PRACTITIONER_PROFILE_REVISION_SQL,
        [
          input.revisionId,
          profile.practitioner_id,
          input.userId,
          input.profile.displayName,
          input.profile.professionalHeadline,
          input.profile.bio,
          input.profile.practiceAreas,
          input.profile.languages,
          input.profile.countryOrRegion,
          input.profile.websiteUrl ?? null,
          input.submittedAt,
          input.purgeEligibleAt
        ]
      );
      const revision = result.rows[0];
      return revision === undefined
        ? { outcome: 'conflict' }
        : { outcome: 'created', revision: mapPractitionerRevision(revision) };
    });
  }

  public async reviewProfileRevision(input: {
    readonly reviewerUserId: string;
    readonly revisionId: string;
    readonly applicationId: string;
    readonly action: 'APPROVE' | 'REJECT';
    readonly reasonCode: PractitionerReviewReasonCode;
    readonly note: string | null;
    readonly version: number;
    readonly reviewEventId: string;
    readonly reviewedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerProfileRevisionReviewOutcome> {
    return this.transactionRunner.run(async (executor) => {
      if (!(await this.isReviewerWithExecutor(executor, input.reviewerUserId))) {
        return { outcome: 'forbidden' };
      }

      const locked = await executor.query<PractitionerRevisionLockRow>(
        LOCK_PRACTITIONER_PROFILE_REVISION_SQL,
        [input.revisionId]
      );
      const revision = locked.rows[0];
      if (revision === undefined) {
        return { outcome: 'not-found' };
      }
      if (revision.profile_user_id === input.reviewerUserId) {
        return { outcome: 'forbidden' };
      }
      if (
        revision.application_id !== input.applicationId ||
        revision.status !== 'PENDING' ||
        revision.application_version !== input.version
      ) {
        return { outcome: 'stale' };
      }

      if (input.action === 'APPROVE') {
        const promoted = await executor.query<PractitionerProfileRow>(
          PROMOTE_PRACTITIONER_PROFILE_REVISION_SQL,
          [input.revisionId, input.reviewedAt]
        );
        if (promoted.rows.length !== 1) {
          return { outcome: 'stale' };
        }
      }

      const updated = await executor.query<PractitionerProfileRevisionRow>(
        UPDATE_PRACTITIONER_PROFILE_REVISION_SQL,
        [input.revisionId, input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED', input.reviewedAt]
      );
      const updatedRevision = updated.rows[0];
      if (updatedRevision === undefined) {
        return { outcome: 'stale' };
      }

      await executor.query(INSERT_PRACTITIONER_REVIEW_EVENT_SQL, [
        input.reviewEventId,
        input.reviewerUserId,
        input.applicationId,
        input.revisionId,
        'PROFILE_REVISION',
        input.action,
        input.reasonCode,
        input.note,
        revision.application_version,
        input.reviewedAt,
        null
      ]);

      return { outcome: 'updated', revision: mapPractitionerRevision(updatedRevision) };
    });
  }

  public async setFoundingPractitioner(input: {
    readonly reviewerUserId: string;
    readonly practitionerId: string;
  }): Promise<PractitionerFoundingOutcome> {
    if (!(await this.isReviewer(input.reviewerUserId))) {
      return { outcome: 'forbidden' };
    }

    const result = await this.executor.query<{ practitioner_id: string }>(
      SET_PRACTITIONER_FOUNDING_LABEL_SQL,
      [input.practitionerId]
    );
    return result.rows.length === 0 ? { outcome: 'not-found' } : { outcome: 'updated' };
  }

  public async createProfileReport(input: {
    readonly reportId: string;
    readonly reporterUserId: string;
    readonly practitionerId: string;
    readonly category: PractitionerReportRecord['category'];
    readonly details: string;
    readonly createdAt: string;
  }): Promise<PractitionerReportCreateOutcome> {
    return this.transactionRunner.run(async (executor) => {
      const profile = await executor.query<{ practitioner_id: string }>(
        LOCK_PRACTITIONER_PROFILE_SQL,
        [input.practitionerId]
      );
      if (profile.rows.length === 0) {
        return { outcome: 'invalid-target' };
      }

      const existing = await executor.query<{ report_id: string }>(
        DUPLICATE_PRACTITIONER_REPORT_SQL,
        [input.reporterUserId, input.practitionerId]
      );
      if (existing.rows.length > 0) {
        return { outcome: 'duplicate' };
      }

      const result = await executor.query<PractitionerReportRow>(
        INSERT_PRACTITIONER_REPORT_SQL,
        [
          input.reportId,
          input.reporterUserId,
          input.practitionerId,
          input.category,
          input.details,
          input.createdAt
        ]
      );
      const row = result.rows[0];
      return row === undefined
        ? { outcome: 'duplicate' }
        : { outcome: 'created', report: mapPractitionerReport(row) };
    });
  }

  public async listOpenProfileReports() {
    const result = await this.executor.query<PractitionerReportRow>(
      LIST_OPEN_PRACTITIONER_REPORTS_SQL
    );
    return result.rows.map(mapPractitionerReport);
  }

  public async resolveProfileReport(input: {
    readonly reviewerUserId: string;
    readonly reportId: string;
    readonly state: 'RESOLVED' | 'DISMISSED';
    readonly resolvedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerReportResolutionOutcome> {
    return this.transactionRunner.run(async (executor) => {
      if (!(await this.isReviewerWithExecutor(executor, input.reviewerUserId))) {
        return { outcome: 'forbidden' };
      }
      const locked = await executor.query<PractitionerReportRow>(
        LOCK_PRACTITIONER_REPORT_SQL,
        [input.reportId]
      );
      const report = locked.rows[0];
      if (report === undefined) {
        return { outcome: 'not-found' };
      }
      if (report.state !== 'OPEN') {
        return { outcome: 'conflict' };
      }
      const updated = await executor.query<PractitionerReportRow>(
        UPDATE_PRACTITIONER_REPORT_SQL,
        [
          input.reportId,
          input.state,
          input.resolvedAt,
          input.reviewerUserId,
          input.purgeEligibleAt
        ]
      );
      const row = updated.rows[0];
      return row === undefined
        ? { outcome: 'conflict' }
        : { outcome: 'updated', report: mapPractitionerReport(row) };
    });
  }

  public async purgeExpiredRetention(
    now: string
  ): Promise<PractitionerRetentionPurgeResult> {
    return this.transactionRunner.run(async (executor) => {
      const reports = await executor.query(DELETE_EXPIRED_PRACTITIONER_REPORTS_SQL, [now]);
      const events = await executor.query(DELETE_EXPIRED_PRACTITIONER_REVIEW_EVENTS_SQL, [now]);
      const revisions = await executor.query(DELETE_EXPIRED_PRACTITIONER_REVISIONS_SQL, [now]);
      const profiles = await executor.query(DELETE_EXPIRED_ENDED_PRACTITIONER_PROFILES_SQL, [now]);
      const applications = await executor.query(DELETE_EXPIRED_PRACTITIONER_APPLICATIONS_SQL, [now]);

      return {
        deletedApplications: applications.rows.length,
        deletedProfiles: profiles.rows.length,
        deletedRevisions: revisions.rows.length,
        deletedReviewEvents: events.rows.length,
        deletedReports: reports.rows.length
      };
    });
  }
}
