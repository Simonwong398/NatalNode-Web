/** The deliberately small Community / Questions V1 contract. */
export const COMMUNITY_TOPIC_IDS = [
  'FOUNDATIONS',
  'CHART_READING',
  'PLANETS_SIGNS_HOUSES',
  'ASPECTS',
  'BIRTH_TIME_AND_CALCULATION',
  'NATALNODE_PRODUCT',
  'OTHER'
] as const;

export type CommunityTopicId = (typeof COMMUNITY_TOPIC_IDS)[number];

export const COMMUNITY_CONTENT_STATUSES = [
  'VISIBLE',
  'HIDDEN',
  'DELETED'
] as const;

export type CommunityContentStatus =
  (typeof COMMUNITY_CONTENT_STATUSES)[number];

export const COMMUNITY_REPORT_CATEGORIES = [
  'SPAM',
  'HARASSMENT',
  'HATE_OR_ABUSE',
  'DANGEROUS_OR_HIGH_STAKES_ADVICE',
  'PRIVACY',
  'COPYRIGHT_OR_IP',
  'OTHER'
] as const;

export type CommunityReportCategory =
  (typeof COMMUNITY_REPORT_CATEGORIES)[number];

export const COMMUNITY_REPORT_TARGET_TYPES = ['QUESTION', 'ANSWER'] as const;
export type CommunityReportTargetType =
  (typeof COMMUNITY_REPORT_TARGET_TYPES)[number];

export const COMMUNITY_REPORT_STATES = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;
export type CommunityReportState = (typeof COMMUNITY_REPORT_STATES)[number];

export const COMMUNITY_MODERATION_ACTIONS = [
  'HIDE',
  'RESTORE',
  'DELETE',
  'DISMISS_REPORT'
] as const;

export type CommunityModerationAction =
  (typeof COMMUNITY_MODERATION_ACTIONS)[number];

export const COMMUNITY_MODERATION_REASON_CODES = [
  'SPAM',
  'HARASSMENT',
  'HATE_OR_ABUSE',
  'DANGEROUS_OR_HIGH_STAKES_ADVICE',
  'PRIVACY',
  'COPYRIGHT_OR_IP',
  'DUPLICATE',
  'CONTENT_POLICY',
  'OTHER'
] as const;

export type CommunityModerationReasonCode =
  (typeof COMMUNITY_MODERATION_REASON_CODES)[number];

/** Public author presentation. It intentionally has no account identifier. */
export interface CommunityPublicAuthor {
  readonly displayName: string;
}

export interface CommunityPublicQuestion {
  readonly questionId: string;
  readonly author: CommunityPublicAuthor;
  readonly title: string;
  readonly body: string;
  readonly topicId: CommunityTopicId;
  readonly status: 'VISIBLE';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommunityPublicAnswer {
  readonly answerId: string;
  readonly questionId: string;
  readonly author: CommunityPublicAuthor;
  readonly body: string;
  readonly status: 'VISIBLE';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommunityViewerCapabilities {
  readonly authenticated: boolean;
  readonly canEditQuestion: boolean;
  readonly canDeleteQuestion: boolean;
  readonly canAnswer: boolean;
  readonly canAcceptAnswer: boolean;
  readonly canReport: boolean;
  readonly isModerator: boolean;
  readonly answerCapabilities: Readonly<Record<string, {
    readonly canEdit: boolean;
    readonly canDelete: boolean;
  }>>;
}

export interface GetCommunityQuestionApiResponse {
  readonly question: CommunityPublicQuestion;
  readonly answers: readonly CommunityPublicAnswer[];
  readonly acceptedAnswerId: string | null;
  readonly viewer: CommunityViewerCapabilities;
}

export interface ListCommunityQuestionsApiResponse {
  readonly questions: readonly CommunityPublicQuestion[];
  readonly nextCursor: string | null;
}

export interface CreateCommunityQuestionApiRequest {
  readonly title: string;
  readonly body: string;
  readonly topicId: CommunityTopicId;
}

export interface UpdateCommunityQuestionApiRequest
  extends CreateCommunityQuestionApiRequest {}

export interface CreateCommunityQuestionApiResponse {
  readonly question: CommunityPublicQuestion;
}

export interface UpdateCommunityQuestionApiResponse {
  readonly question: CommunityPublicQuestion;
}

export interface CreateCommunityAnswerApiRequest {
  readonly body: string;
}

export interface CreateCommunityAnswerApiResponse {
  readonly answer: CommunityPublicAnswer;
}

export interface UpdateCommunityAnswerApiRequest {
  readonly body: string;
}

export interface UpdateCommunityAnswerApiResponse {
  readonly answer: CommunityPublicAnswer;
}

export interface DeleteCommunityContentApiResponse {
  readonly deleted: true;
}

export interface SetCommunityAcceptedAnswerApiRequest {
  readonly answerId: string | null;
}

export interface SetCommunityAcceptedAnswerApiResponse {
  readonly acceptedAnswerId: string | null;
}

export interface CommunityProfileApiResponse {
  readonly displayName: string | null;
}

export interface UpdateCommunityProfileApiRequest {
  readonly displayName: string;
}

export interface CreateCommunityReportApiRequest {
  readonly targetType: CommunityReportTargetType;
  readonly targetId: string;
  readonly category: CommunityReportCategory;
  readonly details?: string;
}

export interface CreateCommunityReportApiResponse {
  readonly reportId: string;
  readonly submitted: true;
}

export interface CommunityModerationReport {
  readonly reportId: string;
  readonly targetType: CommunityReportTargetType;
  readonly targetId: string;
  readonly category: CommunityReportCategory;
  readonly details: string;
  readonly state: CommunityReportState;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
}

export interface ListCommunityModerationReportsApiResponse {
  readonly reports: readonly CommunityModerationReport[];
}

export interface ModerateCommunityContentApiRequest {
  readonly action: CommunityModerationAction;
  readonly reasonCode: CommunityModerationReasonCode;
  readonly note?: string;
  readonly reportId?: string;
}

export interface ModerateCommunityContentApiResponse {
  readonly action: CommunityModerationAction;
  readonly targetType: CommunityReportTargetType;
  readonly targetId: string;
  readonly status: CommunityContentStatus | 'DISMISSED';
}
