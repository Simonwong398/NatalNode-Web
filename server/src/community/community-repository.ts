import type {
  CommunityContentStatus,
  CommunityModerationAction,
  CommunityModerationReasonCode,
  CommunityReportCategory,
  CommunityReportState,
  CommunityReportTargetType,
  CommunityTopicId
} from './community-domain.js';

export interface CommunityProfileRecord {
  readonly userId: string;
  readonly displayName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommunityQuestionRecord {
  readonly questionId: string;
  readonly authorUserId: string | null;
  readonly anonymizedAuthorLabel: string | null;
  readonly authorDisplayName: string;
  readonly title: string;
  readonly body: string;
  readonly topicId: CommunityTopicId;
  readonly status: CommunityContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
  readonly retentionExpiresAt: string | null;
  readonly retentionHold: 'NONE' | 'LEGAL' | 'SECURITY';
}

export interface CommunityAnswerRecord {
  readonly answerId: string;
  readonly questionId: string;
  readonly authorUserId: string | null;
  readonly anonymizedAuthorLabel: string | null;
  readonly authorDisplayName: string;
  readonly body: string;
  readonly status: CommunityContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
  readonly retentionExpiresAt: string | null;
  readonly retentionHold: 'NONE' | 'LEGAL' | 'SECURITY';
}

export interface CommunityQuestionDetailRecord {
  readonly question: CommunityQuestionRecord;
  readonly answers: readonly CommunityAnswerRecord[];
  readonly acceptedAnswerId: string | null;
}

export interface CommunityQuestionPage {
  readonly questions: readonly CommunityQuestionRecord[];
  readonly nextCursor: string | null;
}

export interface CommunityReportRecord {
  readonly reportId: string;
  readonly reporterUserId: string | null;
  readonly targetType: CommunityReportTargetType;
  readonly targetId: string;
  readonly category: CommunityReportCategory;
  readonly details: string;
  readonly state: CommunityReportState;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly retentionExpiresAt: string | null;
  readonly retentionHold: 'NONE' | 'LEGAL' | 'SECURITY';
}

export interface CommunityModerationEventRecord {
  readonly moderationEventId: string;
  readonly actorUserId: string | null;
  readonly targetType: CommunityReportTargetType;
  readonly targetId: string;
  readonly action: CommunityModerationAction;
  readonly reasonCode: CommunityModerationReasonCode;
  readonly note: string | null;
  readonly createdAt: string;
  readonly retentionExpiresAt: string;
  readonly retentionHold: 'NONE' | 'LEGAL' | 'SECURITY';
}

export type CommunityOwnershipOutcome =
  | 'updated'
  | 'deleted'
  | 'not-found'
  | 'forbidden';

export type CommunityReportCreateOutcome =
  | { readonly outcome: 'created'; readonly report: CommunityReportRecord }
  | { readonly outcome: 'duplicate' }
  | { readonly outcome: 'invalid-target' };

export type CommunityModerationOutcome =
  | {
      readonly outcome: 'updated';
      readonly targetType: CommunityReportTargetType;
      readonly targetId: string;
      readonly status: CommunityContentStatus | 'DISMISSED';
    }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'invalid-target' };

export interface CommunityRetentionPurgeResult {
  readonly deletedAnswers: number;
  readonly deletedQuestions: number;
  readonly deletedReports: number;
  readonly deletedModerationEvents: number;
}

export interface CommunityRepository {
  getProfile(userId: string): Promise<CommunityProfileRecord | null>;
  saveProfile(profile: CommunityProfileRecord): Promise<CommunityProfileRecord>;
  listVisibleQuestions(input: {
    readonly limit: number;
    readonly cursor: string | null;
  }): Promise<CommunityQuestionPage>;
  getQuestion(questionId: string): Promise<CommunityQuestionDetailRecord | null>;
  getQuestionRecord(questionId: string): Promise<CommunityQuestionRecord | null>;
  getAnswerRecord(answerId: string): Promise<CommunityAnswerRecord | null>;
  createQuestion(question: {
    readonly questionId: string;
    readonly authorUserId: string;
    readonly title: string;
    readonly body: string;
    readonly topicId: CommunityTopicId;
    readonly createdAt: string;
    readonly updatedAt: string;
  }): Promise<CommunityQuestionRecord | null>;
  updateQuestion(question: {
    readonly questionId: string;
    readonly authorUserId: string;
    readonly title: string;
    readonly body: string;
    readonly topicId: CommunityTopicId;
    readonly updatedAt: string;
  }): Promise<CommunityQuestionRecord | null>;
  deleteQuestion(input: {
    readonly questionId: string;
    readonly authorUserId: string;
    readonly deletedAt: string;
    readonly retentionExpiresAt: string;
  }): Promise<CommunityOwnershipOutcome>;
  createAnswer(answer: {
    readonly answerId: string;
    readonly questionId: string;
    readonly authorUserId: string;
    readonly body: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  }): Promise<CommunityAnswerRecord | null>;
  updateAnswer(answer: {
    readonly answerId: string;
    readonly authorUserId: string;
    readonly body: string;
    readonly updatedAt: string;
  }): Promise<CommunityAnswerRecord | null>;
  deleteAnswer(input: {
    readonly answerId: string;
    readonly authorUserId: string;
    readonly deletedAt: string;
    readonly retentionExpiresAt: string;
  }): Promise<CommunityOwnershipOutcome>;
  setAcceptedAnswer(input: {
    readonly questionId: string;
    readonly questionAuthorUserId: string;
    readonly answerId: string | null;
    readonly acceptedAt: string;
  }): Promise<CommunityOwnershipOutcome | 'accepted' | 'removed'>;
  createReport(report: {
    readonly reportId: string;
    readonly reporterUserId: string;
    readonly targetType: CommunityReportTargetType;
    readonly targetId: string;
    readonly category: CommunityReportCategory;
    readonly details: string;
    readonly createdAt: string;
  }): Promise<CommunityReportCreateOutcome>;
  isModerator(userId: string): Promise<boolean>;
  listOpenReports(): Promise<readonly CommunityReportRecord[]>;
  moderate(input: {
    readonly moderationEventId: string;
    readonly actorUserId: string;
    readonly targetType: CommunityReportTargetType;
    readonly targetId: string;
    readonly action: CommunityModerationAction;
    readonly reasonCode: CommunityModerationReasonCode;
    readonly note: string | null;
    readonly createdAt: string;
    readonly retentionExpiresAt: string;
    readonly reportId: string | null;
  }): Promise<CommunityModerationOutcome>;
  purgeExpiredRetention(now: string): Promise<CommunityRetentionPurgeResult>;
}
