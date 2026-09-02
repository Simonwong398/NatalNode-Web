export const PRACTITIONER_APPLICATION_STATUSES = [
  'SUBMITTED',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'REVOKED'
] as const;

export type PractitionerApplicationStatus =
  (typeof PRACTITIONER_APPLICATION_STATUSES)[number];

export const PRACTITIONER_REVIEW_QUEUE_STATUSES = [
  'SUBMITTED',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'REVOKED'
] as const;

export type PractitionerReviewQueueStatus =
  (typeof PRACTITIONER_REVIEW_QUEUE_STATUSES)[number];

export const PRACTITIONER_PRACTICE_AREA_IDS = [
  'NATAL_ASTROLOGY',
  'CHART_INTERPRETATION',
  'ASTROLOGY_EDUCATION',
  'ASTROLOGY_RESEARCH',
  'RELATIONSHIP_ASTROLOGY',
  'TIMING_AND_CYCLES',
  'OTHER'
] as const;

export type PractitionerPracticeAreaId =
  (typeof PRACTITIONER_PRACTICE_AREA_IDS)[number];

export const PRACTITIONER_REVIEW_ACTIONS = [
  'APPROVE',
  'REQUEST_CHANGES',
  'REJECT',
  'REVOKE'
] as const;

export type PractitionerReviewAction =
  (typeof PRACTITIONER_REVIEW_ACTIONS)[number];

export const PRACTITIONER_REVIEW_REASON_CODES = [
  'ELIGIBILITY',
  'INCOMPLETE',
  'EVIDENCE',
  'MISREPRESENTATION',
  'HIGH_STAKES_CLAIM',
  'POLICY',
  'OTHER'
] as const;

export type PractitionerReviewReasonCode =
  (typeof PRACTITIONER_REVIEW_REASON_CODES)[number];

export const PRACTITIONER_REPORT_CATEGORIES = [
  'IMPERSONATION',
  'MISLEADING_CLAIM',
  'PRIVACY',
  'DANGEROUS_OR_HIGH_STAKES_ADVICE',
  'SPAM',
  'OTHER'
] as const;

export type PractitionerReportCategory =
  (typeof PRACTITIONER_REPORT_CATEGORIES)[number];

export const PRACTITIONER_PROFILE_STATUSES = [
  'APPROVED',
  'REVOKED',
  'WITHDRAWN',
  'DELETED'
] as const;

export type PractitionerProfileStatus =
  (typeof PRACTITIONER_PROFILE_STATUSES)[number];

export const PRACTITIONER_PROFILE_REVISION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED'
] as const;

export type PractitionerProfileRevisionStatus =
  (typeof PRACTITIONER_PROFILE_REVISION_STATUSES)[number];

export const PRACTITIONER_REPORT_STATES = [
  'OPEN',
  'RESOLVED',
  'DISMISSED'
] as const;

export type PractitionerReportState = (typeof PRACTITIONER_REPORT_STATES)[number];

export interface PractitionerApplicationInput {
  readonly requestedDisplayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly practiceStatement: string;
  readonly evidenceUrls: readonly string[];
  readonly consentToPublicProfile: true;
}

export interface PractitionerApplicationView extends PractitionerApplicationInput {
  readonly applicationId: string;
  readonly submittedAt: string;
  readonly status: PractitionerApplicationStatus;
  readonly version: number;
  readonly finalizedAt: string | null;
  readonly purgeEligibleAt: string | null;
  readonly contributor: boolean;
}

export interface PractitionerApplicationApiResponse {
  readonly application: PractitionerApplicationView | null;
}

export interface PractitionerPublicContributionReference {
  readonly kind: 'QUESTION' | 'ANSWER';
  readonly contributionId: string;
  readonly title: string;
  readonly href: string;
  readonly createdAt: string;
}

export interface PractitionerPublicProfile {
  readonly practitionerId: string;
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly foundingPractitioner: boolean;
  readonly approvedAt: string;
  readonly contributions: readonly PractitionerPublicContributionReference[];
}

export interface ListPractitionerProfilesApiResponse {
  readonly profiles: readonly PractitionerPublicProfile[];
  readonly nextCursor: string | null;
}

export interface GetPractitionerProfileApiResponse {
  readonly profile: PractitionerPublicProfile;
  readonly disclosure: string;
}

export interface PractitionerProfileRevisionInput {
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
}

export interface PractitionerProfileRevisionView extends PractitionerProfileRevisionInput {
  readonly revisionId: string;
  readonly practitionerId: string;
  readonly status: PractitionerProfileRevisionStatus;
  readonly submittedAt: string;
}

export interface PractitionerReviewHistoryEntry {
  readonly reviewEventId: string;
  readonly reviewerUserId: string | null;
  readonly action: PractitionerReviewAction;
  readonly reasonCode: PractitionerReviewReasonCode;
  readonly note: string | null;
  readonly applicationVersion: number;
  readonly createdAt: string;
}

export interface PractitionerReviewApplicationView extends PractitionerApplicationView {
  readonly userId: string;
  readonly reviewHistory: readonly PractitionerReviewHistoryEntry[];
}

export interface PractitionerReviewQueueApiResponse {
  readonly applications: readonly PractitionerReviewApplicationView[];
  readonly revisions: readonly PractitionerReviewProfileRevisionView[];
}

export interface PractitionerReviewProfileRevisionView
  extends PractitionerProfileRevisionView {
  readonly applicationId: string;
  readonly userId: string;
}

export interface PractitionerReviewApplicationApiRequest {
  readonly action: PractitionerReviewAction;
  readonly reasonCode: PractitionerReviewReasonCode;
  readonly note?: string;
  readonly version: number;
}

export interface PractitionerReviewResultApiResponse {
  readonly status: PractitionerApplicationStatus;
}

export interface PractitionerReviewProfileRevisionApiRequest {
  readonly action: 'APPROVE' | 'REJECT';
  readonly reasonCode: PractitionerReviewReasonCode;
  readonly note?: string;
  readonly version: number;
  readonly applicationId: string;
}

export interface PractitionerReportResolutionApiRequest {
  readonly state: 'RESOLVED' | 'DISMISSED';
}

export interface CreatePractitionerReportApiRequest {
  readonly practitionerId: string;
  readonly category: PractitionerReportCategory;
  readonly details?: string;
}

export interface CreatePractitionerReportApiResponse {
  readonly reportId: string;
  readonly submitted: true;
}

export interface PractitionerReviewReportView {
  readonly reportId: string;
  readonly practitionerId: string;
  readonly category: PractitionerReportCategory;
  readonly details: string;
  readonly state: PractitionerReportState;
  readonly createdAt: string;
}

export interface PractitionerReviewReportsApiResponse {
  readonly reports: readonly PractitionerReviewReportView[];
}

export interface PractitionerFoundingLabelApiResponse {
  readonly foundingPractitioner: true;
}
