import type {
  CreateCommunityAnswerApiRequest,
  CreateCommunityQuestionApiRequest,
  CreateCommunityReportApiRequest,
  ModerateCommunityContentApiRequest,
  SetCommunityAcceptedAnswerApiRequest,
  UpdateCommunityAnswerApiRequest,
  UpdateCommunityProfileApiRequest,
  UpdateCommunityQuestionApiRequest
} from '@natalnode/contracts';
import {
  COMMUNITY_MODERATION_REASON_CODES,
  isCommunityModerationAction,
  isCommunityModerationReasonCode,
  isCommunityOpaqueId,
  isCommunityReportCategory,
  isCommunityReportTargetType,
  isCommunityTopicId,
  isSafeCommunityText,
  isValidCommunityAnswerBody,
  isValidCommunityDisplayName,
  isValidCommunityQuestionBody,
  isValidCommunityQuestionTitle,
  isValidCommunityReportDetails,
  normalizeCommunityDisplayName,
  normalizeCommunityText
} from '../../community/community-domain.js';
import { isRecord } from './chart-request.js';

export const COMMUNITY_REQUEST_MAXIMUM_BYTES = 64 * 1_024;
export const COMMUNITY_MODERATION_NOTE_MAXIMUM_CHARACTERS = 1_000;

const COMMUNITY_MODERATION_NOTE_PATTERN =
  /[\u0000-\u001F\u007F-\u009F]/u;

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = []
): boolean {
  const keys = Object.keys(value);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);

  return (
    requiredKeys.every((key) => hasOwn(value, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function normalizeRequiredText(
  value: unknown,
  validator: (candidate: unknown) => candidate is string
): string | null {
  return validator(value) ? normalizeCommunityText(value) : null;
}

export function normalizeCommunityProfileRequest(
  value: unknown
): UpdateCommunityProfileApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['displayName']) ||
    !isValidCommunityDisplayName(value.displayName)
  ) {
    return null;
  }

  return { displayName: normalizeCommunityDisplayName(value.displayName) };
}

export function normalizeCreateCommunityQuestionRequest(
  value: unknown
): CreateCommunityQuestionApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['title', 'body', 'topicId']) ||
    !isCommunityTopicId(value.topicId)
  ) {
    return null;
  }

  const title = normalizeRequiredText(value.title, isValidCommunityQuestionTitle);
  const body = normalizeRequiredText(value.body, isValidCommunityQuestionBody);

  return title === null || body === null
    ? null
    : { title, body, topicId: value.topicId };
}

export function normalizeUpdateCommunityQuestionRequest(
  value: unknown
): UpdateCommunityQuestionApiRequest | null {
  return normalizeCreateCommunityQuestionRequest(value);
}

export function normalizeCreateCommunityAnswerRequest(
  value: unknown
): CreateCommunityAnswerApiRequest | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['body'])) {
    return null;
  }

  const body = normalizeRequiredText(value.body, isValidCommunityAnswerBody);
  return body === null ? null : { body };
}

export function normalizeUpdateCommunityAnswerRequest(
  value: unknown
): UpdateCommunityAnswerApiRequest | null {
  return normalizeCreateCommunityAnswerRequest(value);
}

export function normalizeSetCommunityAcceptedAnswerRequest(
  value: unknown
): SetCommunityAcceptedAnswerApiRequest | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['answerId'])) {
    return null;
  }

  if (value.answerId !== null && !isCommunityOpaqueId(value.answerId)) {
    return null;
  }

  return { answerId: value.answerId };
}

export function normalizeCreateCommunityReportRequest(
  value: unknown
): CreateCommunityReportApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['targetType', 'targetId', 'category'], ['details']) ||
    !isCommunityReportTargetType(value.targetType) ||
    !isCommunityOpaqueId(value.targetId) ||
    !isCommunityReportCategory(value.category)
  ) {
    return null;
  }

  if (value.details !== undefined && !isValidCommunityReportDetails(value.details)) {
    return null;
  }

  const details =
    value.details === undefined
      ? ''
      : normalizeCommunityText(value.details as string);

  return {
    targetType: value.targetType,
    targetId: value.targetId,
    category: value.category,
    details
  };
}

function isValidModerationNote(value: unknown): value is string {
  if (!isSafeCommunityText(value) || COMMUNITY_MODERATION_NOTE_PATTERN.test(value)) {
    return false;
  }

  return (
    Array.from(normalizeCommunityText(value)).length <=
    COMMUNITY_MODERATION_NOTE_MAXIMUM_CHARACTERS
  );
}

export function normalizeModerateCommunityContentRequest(
  value: unknown
): ModerateCommunityContentApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['action', 'reasonCode'], ['note', 'reportId']) ||
    !isCommunityModerationAction(value.action) ||
    !isCommunityModerationReasonCode(value.reasonCode)
  ) {
    return null;
  }

  if (value.note !== undefined && !isValidModerationNote(value.note)) {
    return null;
  }

  if (
    value.reportId !== undefined &&
    (!isCommunityOpaqueId(value.reportId) || value.action !== 'DISMISS_REPORT')
  ) {
    return null;
  }

  if (value.action === 'DISMISS_REPORT' && !isCommunityOpaqueId(value.reportId)) {
    return null;
  }

  return {
    action: value.action,
    reasonCode: value.reasonCode,
    ...(value.note !== undefined
      ? { note: normalizeCommunityText(value.note) }
      : {}),
    ...(value.reportId !== undefined ? { reportId: value.reportId } : {})
  };
}

export interface CommunityPageQuery {
  readonly limit: number;
  readonly cursor: string | null;
}

export function parseCommunityPageQuery(
  limitValue: string | undefined,
  cursorValue: string | undefined
): CommunityPageQuery | null {
  const limit =
    limitValue === undefined
      ? 20
      : /^\d+$/u.test(limitValue)
        ? Number(limitValue)
        : Number.NaN;

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    return null;
  }

  if (cursorValue === undefined || cursorValue.length === 0) {
    return { limit, cursor: null };
  }

  if (cursorValue.length > 512 || !/^[A-Za-z0-9_-]+$/u.test(cursorValue)) {
    return null;
  }

  return { limit, cursor: cursorValue };
}

export function isCommunityModerationReasonCodeValue(
  value: unknown
): value is (typeof COMMUNITY_MODERATION_REASON_CODES)[number] {
  return isCommunityModerationReasonCode(value);
}
