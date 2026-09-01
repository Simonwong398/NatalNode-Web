import type {
  AuthenticatedPrincipal
} from '../app/auth/request-authenticator.js';
import type {
  CommunityModerationReport,
  CommunityPublicAnswer,
  CommunityPublicQuestion,
  CommunityViewerCapabilities,
  GetCommunityQuestionApiResponse
} from '@natalnode/contracts';
import type {
  CommunityAnswerRecord,
  CommunityQuestionDetailRecord,
  CommunityQuestionRecord,
  CommunityReportRecord
} from './community-repository.js';

export function presentCommunityQuestion(
  question: CommunityQuestionRecord
): CommunityPublicQuestion {
  return {
    questionId: question.questionId,
    author: { displayName: question.authorDisplayName },
    title: question.title,
    body: question.body,
    topicId: question.topicId,
    status: 'VISIBLE',
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

export function presentCommunityAnswer(
  answer: CommunityAnswerRecord
): CommunityPublicAnswer {
  return {
    answerId: answer.answerId,
    questionId: answer.questionId,
    author: { displayName: answer.authorDisplayName },
    body: answer.body,
    status: 'VISIBLE',
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt
  };
}

export function presentCommunityQuestionDetail(
  detail: CommunityQuestionDetailRecord,
  principal: AuthenticatedPrincipal | null,
  isModerator: boolean
): GetCommunityQuestionApiResponse {
  const answerCapabilities: Record<
    string,
    { readonly canEdit: boolean; readonly canDelete: boolean }
  > = {};

  for (const answer of detail.answers) {
    const ownsAnswer =
      principal !== null && answer.authorUserId === principal.userId;
    answerCapabilities[answer.answerId] = {
      canEdit: ownsAnswer,
      canDelete: ownsAnswer
    };
  }

  const ownsQuestion =
    principal !== null && detail.question.authorUserId === principal.userId;
  const viewer: CommunityViewerCapabilities = {
    authenticated: principal !== null,
    canEditQuestion: ownsQuestion,
    canDeleteQuestion: ownsQuestion,
    canAnswer: principal !== null,
    canAcceptAnswer: ownsQuestion,
    canReport: principal !== null,
    isModerator,
    answerCapabilities
  };

  return {
    question: presentCommunityQuestion(detail.question),
    answers: detail.answers.map(presentCommunityAnswer),
    acceptedAnswerId: detail.acceptedAnswerId,
    viewer
  };
}

export function presentCommunityModerationReport(
  report: CommunityReportRecord
): CommunityModerationReport {
  return {
    reportId: report.reportId,
    targetType: report.targetType,
    targetId: report.targetId,
    category: report.category,
    details: report.details,
    state: report.state,
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt
  };
}
