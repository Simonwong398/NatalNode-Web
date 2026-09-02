import type {
  PractitionerApplicationInput,
  PractitionerApplicationStatus,
  PractitionerPracticeAreaId,
  PractitionerProfileRevisionInput,
  PractitionerProfileRevisionStatus,
  PractitionerProfileStatus,
  PractitionerPublicContributionReference,
  PractitionerReportCategory,
  PractitionerReportState,
  PractitionerReviewAction,
  PractitionerReviewQueueStatus,
  PractitionerReviewReasonCode
} from '@natalnode/contracts';

export type PractitionerRetentionHold = 'NONE' | 'LEGAL' | 'SECURITY';

export interface PractitionerApplicationRecord extends PractitionerApplicationInput {
  readonly applicationId: string;
  readonly userId: string | null;
  readonly submittedAt: string;
  readonly status: PractitionerApplicationStatus;
  readonly version: number;
  readonly finalizedAt: string | null;
  readonly purgeEligibleAt: string | null;
  readonly retentionHold: PractitionerRetentionHold;
  readonly accountDeletedAt: string | null;
}

export interface PractitionerProfileRecord extends PractitionerProfileRevisionInput {
  readonly practitionerId: string;
  readonly applicationId: string;
  readonly userId: string | null;
  readonly displayName: string;
  readonly foundingPractitioner: boolean;
  readonly approvedAt: string;
  readonly profileStatus: PractitionerProfileStatus;
  readonly endedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PractitionerProfileRevisionRecord
  extends PractitionerProfileRevisionInput {
  readonly revisionId: string;
  readonly practitionerId: string;
  readonly submittedByUserId: string | null;
  readonly status: PractitionerProfileRevisionStatus;
  readonly submittedAt: string;
  readonly reviewedAt: string | null;
  readonly purgeEligibleAt: string;
  readonly retentionHold: PractitionerRetentionHold;
}

export interface PractitionerReviewProfileRevisionRecord
  extends PractitionerProfileRevisionRecord {
  readonly applicationId: string;
  readonly userId: string | null;
  readonly applicationVersion: number;
}

export interface PractitionerReviewEventRecord {
  readonly reviewEventId: string;
  readonly reviewerUserId: string | null;
  readonly applicationId: string;
  readonly revisionId: string | null;
  readonly action: PractitionerReviewAction;
  readonly reasonCode: PractitionerReviewReasonCode;
  readonly note: string | null;
  readonly applicationVersion: number;
  readonly createdAt: string;
  readonly purgeEligibleAt: string | null;
  readonly retentionHold: PractitionerRetentionHold;
}

export interface PractitionerReportRecord {
  readonly reportId: string;
  readonly reporterUserId: string | null;
  readonly practitionerId: string;
  readonly category: PractitionerReportCategory;
  readonly details: string;
  readonly state: PractitionerReportState;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly purgeEligibleAt: string | null;
  readonly retentionHold: PractitionerRetentionHold;
}

export interface PractitionerProfilePage {
  readonly profiles: readonly PractitionerProfileRecord[];
  readonly nextCursor: string | null;
}

export type PractitionerApplicationCreateOutcome =
  | { readonly outcome: 'created'; readonly application: PractitionerApplicationRecord }
  | { readonly outcome: 'duplicate' }
  | { readonly outcome: 'cooldown'; readonly availableAt: string };

export type PractitionerApplicationMutationOutcome =
  | { readonly outcome: 'updated'; readonly application: PractitionerApplicationRecord }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'conflict' };

export type PractitionerReviewOutcome =
  | { readonly outcome: 'updated'; readonly application: PractitionerApplicationRecord }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'stale' }
  | { readonly outcome: 'invalid-transition' };

export type PractitionerProfileRevisionOutcome =
  | { readonly outcome: 'created'; readonly revision: PractitionerProfileRevisionRecord }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'conflict' };

export type PractitionerProfileRevisionReviewOutcome =
  | { readonly outcome: 'updated'; readonly revision: PractitionerProfileRevisionRecord }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'stale' };

export type PractitionerReportCreateOutcome =
  | { readonly outcome: 'created'; readonly report: PractitionerReportRecord }
  | { readonly outcome: 'duplicate' }
  | { readonly outcome: 'invalid-target' };

export type PractitionerFoundingOutcome =
  | { readonly outcome: 'updated' }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not-found' };

export type PractitionerReportResolutionOutcome =
  | { readonly outcome: 'updated'; readonly report: PractitionerReportRecord }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'conflict' };

export interface PractitionerRetentionPurgeResult {
  readonly deletedApplications: number;
  readonly deletedProfiles: number;
  readonly deletedRevisions: number;
  readonly deletedReviewEvents: number;
  readonly deletedReports: number;
}

export interface PractitionerRepository {
  getApplicationForUser(userId: string): Promise<PractitionerApplicationRecord | null>;
  createApplication(input: {
    readonly applicationId: string;
    readonly userId: string;
    readonly application: PractitionerApplicationInput;
    readonly submittedAt: string;
  }): Promise<PractitionerApplicationCreateOutcome>;
  resubmitApplication(input: {
    readonly applicationId: string;
    readonly userId: string;
    readonly application: PractitionerApplicationInput;
    readonly submittedAt: string;
  }): Promise<PractitionerApplicationMutationOutcome>;
  withdrawApplication(input: {
    readonly applicationId: string;
    readonly userId: string;
    readonly finalizedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerApplicationMutationOutcome>;
  isReviewer(userId: string): Promise<boolean>;
  listReviewApplications(
    status: PractitionerReviewQueueStatus | null
  ): Promise<readonly PractitionerApplicationRecord[]>;
  listReviewEvents(
    applicationId: string
  ): Promise<readonly PractitionerReviewEventRecord[]>;
  listPendingProfileRevisions(): Promise<readonly PractitionerReviewProfileRevisionRecord[]>;
  reviewApplication(input: {
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
  }): Promise<PractitionerReviewOutcome>;
  getProfileForUser(userId: string): Promise<PractitionerProfileRecord | null>;
  getPublicProfile(practitionerId: string): Promise<PractitionerProfileRecord | null>;
  listPublicProfiles(input: {
    readonly limit: number;
    readonly cursor: string | null;
  }): Promise<PractitionerProfilePage>;
  listVisibleContributions(
    userId: string
  ): Promise<readonly PractitionerPublicContributionReference[]>;
  getPendingProfileRevision(
    userId: string
  ): Promise<PractitionerProfileRevisionRecord | null>;
  createProfileRevision(input: {
    readonly revisionId: string;
    readonly userId: string;
    readonly profile: PractitionerProfileRevisionInput;
    readonly submittedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerProfileRevisionOutcome>;
  reviewProfileRevision(input: {
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
  }): Promise<PractitionerProfileRevisionReviewOutcome>;
  setFoundingPractitioner(input: {
    readonly reviewerUserId: string;
    readonly practitionerId: string;
  }): Promise<PractitionerFoundingOutcome>;
  createProfileReport(input: {
    readonly reportId: string;
    readonly reporterUserId: string;
    readonly practitionerId: string;
    readonly category: PractitionerReportCategory;
    readonly details: string;
    readonly createdAt: string;
  }): Promise<PractitionerReportCreateOutcome>;
  listOpenProfileReports(): Promise<readonly PractitionerReportRecord[]>;
  resolveProfileReport(input: {
    readonly reviewerUserId: string;
    readonly reportId: string;
    readonly state: 'RESOLVED' | 'DISMISSED';
    readonly resolvedAt: string;
    readonly purgeEligibleAt: string;
  }): Promise<PractitionerReportResolutionOutcome>;
  purgeExpiredRetention(now: string): Promise<PractitionerRetentionPurgeResult>;
}

export type PractitionerPracticeArea = PractitionerPracticeAreaId;
