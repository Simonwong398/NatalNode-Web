import type {
  CompleteEmailMagicLinkApiRequest,
  RequestEmailMagicLinkApiRequest
} from '@natalnode/contracts';
import { normalizeEmailAddress } from '../../auth-runtime/email-normalization.js';
import { isRecord } from './chart-request.js';

const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_PART_MAX_LENGTH = 64;
const EMAIL_MAGIC_LINK_TOKEN_MAX_LENGTH = 512;
const EMAIL_PART_PATTERN = /^[^\s@]+$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasOnlyKeys(value: Record<string, unknown>, key: string): boolean {
  return Object.keys(value).length === 1 && hasOwn(value, key);
}

function isPracticalEmailAddress(email: string): boolean {
  const normalized = normalizeEmailAddress(email);

  if (
    normalized.length === 0 ||
    normalized.length > EMAIL_MAX_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    return false;
  }

  const atIndex = normalized.indexOf('@');

  if (atIndex <= 0 || atIndex !== normalized.lastIndexOf('@') || atIndex === normalized.length - 1) {
    return false;
  }

  const localPart = normalized.slice(0, atIndex);
  const domainPart = normalized.slice(atIndex + 1);

  return (
    localPart.length <= EMAIL_LOCAL_PART_MAX_LENGTH &&
    EMAIL_PART_PATTERN.test(localPart) &&
    EMAIL_PART_PATTERN.test(domainPart) &&
    !localPart.startsWith('.') &&
    !localPart.endsWith('.') &&
    !localPart.includes('..') &&
    !domainPart.startsWith('.') &&
    !domainPart.endsWith('.') &&
    !domainPart.includes('..')
  );
}

export function isRequestEmailMagicLinkApiRequest(
  value: unknown
): value is RequestEmailMagicLinkApiRequest {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, 'email') &&
    typeof value.email === 'string' &&
    isPracticalEmailAddress(value.email)
  );
}

export function isCompleteEmailMagicLinkApiRequest(
  value: unknown
): value is CompleteEmailMagicLinkApiRequest {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, 'token') &&
    typeof value.token === 'string' &&
    value.token.trim().length > 0 &&
    value.token.length <= EMAIL_MAGIC_LINK_TOKEN_MAX_LENGTH &&
    !CONTROL_CHARACTER_PATTERN.test(value.token)
  );
}
