import {
  COMMUNITY_CONTENT_STATUSES,
  COMMUNITY_MODERATION_ACTIONS,
  COMMUNITY_MODERATION_REASON_CODES,
  COMMUNITY_REPORT_CATEGORIES,
  COMMUNITY_REPORT_STATES,
  COMMUNITY_REPORT_TARGET_TYPES,
  COMMUNITY_TOPIC_IDS,
  type CommunityContentStatus,
  type CommunityModerationAction,
  type CommunityModerationReasonCode,
  type CommunityReportCategory,
  type CommunityReportState,
  type CommunityReportTargetType,
  type CommunityTopicId
} from '@natalnode/contracts';

export {
  COMMUNITY_CONTENT_STATUSES,
  COMMUNITY_MODERATION_ACTIONS,
  COMMUNITY_MODERATION_REASON_CODES,
  COMMUNITY_REPORT_CATEGORIES,
  COMMUNITY_REPORT_STATES,
  COMMUNITY_REPORT_TARGET_TYPES,
  COMMUNITY_TOPIC_IDS
};

export type {
  CommunityContentStatus,
  CommunityModerationAction,
  CommunityModerationReasonCode,
  CommunityReportCategory,
  CommunityReportState,
  CommunityReportTargetType,
  CommunityTopicId
};

export const COMMUNITY_QUESTION_TITLE_MINIMUM_CHARACTERS = 10;
export const COMMUNITY_QUESTION_TITLE_MAXIMUM_CHARACTERS = 180;
export const COMMUNITY_QUESTION_BODY_MINIMUM_CHARACTERS = 20;
export const COMMUNITY_QUESTION_BODY_MAXIMUM_CHARACTERS = 10_000;
export const COMMUNITY_ANSWER_BODY_MINIMUM_CHARACTERS = 10;
export const COMMUNITY_ANSWER_BODY_MAXIMUM_CHARACTERS = 10_000;
export const COMMUNITY_REPORT_DETAILS_MAXIMUM_CHARACTERS = 1_000;
export const COMMUNITY_DISPLAY_NAME_MINIMUM_CHARACTERS = 3;
export const COMMUNITY_DISPLAY_NAME_MAXIMUM_CHARACTERS = 40;
export const COMMUNITY_PAGE_DEFAULT_SIZE = 20;
export const COMMUNITY_PAGE_MAXIMUM_SIZE = 50;
export const COMMUNITY_DELETED_CONTENT_RETENTION_DAYS = 90;
export const COMMUNITY_RESOLVED_EVIDENCE_RETENTION_DAYS = 365;
export const COMMUNITY_ANONYMIZED_AUTHOR_LABEL = 'Deleted User';

const DISALLOWED_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
const DISALLOWED_DISPLAY_NAME_CHARACTER_PATTERN =
  /[\u0000-\u001F\u007F-\u009F]/u;
const DISALLOWED_MARKUP_CHARACTER_PATTERN = /[<>]/u;

function isUnicodeScalarString(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);

      if (
        index + 1 >= value.length ||
        nextCodeUnit < 0xdc00 ||
        nextCodeUnit > 0xdfff
      ) {
        return false;
      }

      index += 1;
      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
}

export function normalizeCommunityText(value: string): string {
  return value.replace(/\r\n?/gu, '\n').trim();
}

export function isSafeCommunityText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    isUnicodeScalarString(value) &&
    !DISALLOWED_CONTROL_CHARACTER_PATTERN.test(value) &&
    !DISALLOWED_MARKUP_CHARACTER_PATTERN.test(value)
  );
}

export function isValidCommunityDisplayName(value: unknown): value is string {
  if (!isSafeCommunityText(value)) {
    return false;
  }

  const normalized = normalizeCommunityText(value).normalize('NFC');
  const characters = Array.from(normalized).length;

  return (
    !DISALLOWED_DISPLAY_NAME_CHARACTER_PATTERN.test(normalized) &&
    characters >= COMMUNITY_DISPLAY_NAME_MINIMUM_CHARACTERS &&
    characters <= COMMUNITY_DISPLAY_NAME_MAXIMUM_CHARACTERS
  );
}

export function normalizeCommunityDisplayName(value: string): string {
  return normalizeCommunityText(value).normalize('NFC');
}

export function isValidCommunityQuestionTitle(value: unknown): value is string {
  if (!isSafeCommunityText(value)) {
    return false;
  }

  const normalized = normalizeCommunityText(value);
  const characters = Array.from(normalized).length;

  return (
    characters >= COMMUNITY_QUESTION_TITLE_MINIMUM_CHARACTERS &&
    characters <= COMMUNITY_QUESTION_TITLE_MAXIMUM_CHARACTERS
  );
}

export function isValidCommunityQuestionBody(value: unknown): value is string {
  if (!isSafeCommunityText(value)) {
    return false;
  }

  const characters = Array.from(normalizeCommunityText(value)).length;
  return (
    characters >= COMMUNITY_QUESTION_BODY_MINIMUM_CHARACTERS &&
    characters <= COMMUNITY_QUESTION_BODY_MAXIMUM_CHARACTERS
  );
}

export function isValidCommunityAnswerBody(value: unknown): value is string {
  if (!isSafeCommunityText(value)) {
    return false;
  }

  const characters = Array.from(normalizeCommunityText(value)).length;
  return (
    characters >= COMMUNITY_ANSWER_BODY_MINIMUM_CHARACTERS &&
    characters <= COMMUNITY_ANSWER_BODY_MAXIMUM_CHARACTERS
  );
}

export function isValidCommunityReportDetails(value: unknown): value is string {
  if (!isSafeCommunityText(value)) {
    return false;
  }

  return (
    Array.from(normalizeCommunityText(value)).length <=
    COMMUNITY_REPORT_DETAILS_MAXIMUM_CHARACTERS
  );
}

export function isCommunityTopicId(value: unknown): value is CommunityTopicId {
  return COMMUNITY_TOPIC_IDS.some((topicId) => topicId === value);
}

export function isCommunityContentStatus(
  value: unknown
): value is CommunityContentStatus {
  return COMMUNITY_CONTENT_STATUSES.some((status) => status === value);
}

export function isCommunityReportCategory(
  value: unknown
): value is CommunityReportCategory {
  return COMMUNITY_REPORT_CATEGORIES.some((category) => category === value);
}

export function isCommunityReportTargetType(
  value: unknown
): value is CommunityReportTargetType {
  return COMMUNITY_REPORT_TARGET_TYPES.some((targetType) => targetType === value);
}

export function isCommunityReportState(
  value: unknown
): value is CommunityReportState {
  return COMMUNITY_REPORT_STATES.some((state) => state === value);
}

export function isCommunityModerationAction(
  value: unknown
): value is CommunityModerationAction {
  return COMMUNITY_MODERATION_ACTIONS.some((action) => action === value);
}

export function isCommunityModerationReasonCode(
  value: unknown
): value is CommunityModerationReasonCode {
  return COMMUNITY_MODERATION_REASON_CODES.some(
    (reasonCode) => reasonCode === value
  );
}

export function isCommunityOpaqueId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 256 &&
    value === value.trim() &&
    !/[\u0000-\u001F\u007F-\u009F]/u.test(value)
  );
}

export function addRetentionDays(timestamp: string, days: number): string {
  const milliseconds = Date.parse(timestamp);

  if (!Number.isFinite(milliseconds)) {
    throw new Error('Community retention timestamp is invalid.');
  }

  return new Date(milliseconds + days * 24 * 60 * 60 * 1_000).toISOString();
}

export function normalizeCommunityTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
