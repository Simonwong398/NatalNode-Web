import { createHash } from 'node:crypto';

export const COMMERCIAL_EVENT_TYPES = [
  'PAID_RELATIONSHIP_OPENED',
  'PAID_FIRST_PURCHASE_FAILED',
  'PAID_CANCELLATION_SCHEDULED',
  'PAID_RENEWAL_RESTORED',
  'PAID_RELATIONSHIP_ENDED',
  'PAID_PURCHASE_SUCCEEDED',
  'PAID_RENEWAL_SUCCEEDED',
  'PAID_RENEWAL_FAILED',
  'PAID_GRACE_EXPIRED',
  'PAID_COVERAGE_ENDED',
  'PAID_COVERAGE_REFUNDED',
  'PAID_COVERAGE_CHARGEBACKED',
  'REFERRAL_ATTRIBUTION_RECORDED',
  'REFERRAL_ATTRIBUTION_LOCKED',
  'REFERRAL_ATTRIBUTION_INVALIDATED',
  'REFERRAL_REWARD_PENDING',
  'REFERRAL_REWARD_CAP_REJECTED',
  'REFERRAL_REWARD_MATURED',
  'REFERRAL_REWARD_APPLIED',
  'REFERRAL_REWARD_CONSUMPTION_STARTED',
  'REFERRAL_REWARD_EXHAUSTED',
  'REFERRAL_REWARD_REVOKED',
  'GRANT_ISSUED',
  'GRANT_ACTIVATED',
  'GRANT_EXPIRED',
  'GRANT_EXHAUSTED',
  'GRANT_REVOKED',
  'COMMERCIAL_CORRECTION_RECORDED'
] as const;

export type CommercialEventType = (typeof COMMERCIAL_EVENT_TYPES)[number];

export const COMMERCIAL_SOURCE_TYPES = [
  'PAID',
  'REFERRAL',
  'PROMOTION',
  'ADMIN_GRANT',
  'SUPPORT_GRANT'
] as const;

export type CommercialSourceType = (typeof COMMERCIAL_SOURCE_TYPES)[number];

export const COMMERCIAL_ACTOR_CLASSES = [
  'USER',
  'PROVIDER',
  'OPERATOR',
  'SERVICE',
  'SYSTEM'
] as const;

export type CommercialActorClass = (typeof COMMERCIAL_ACTOR_CLASSES)[number];

export const PROVIDER_VERIFICATION_STATUSES = [
  'VERIFIED',
  'REJECTED',
  'INDETERMINATE'
] as const;

export type ProviderVerificationStatus =
  (typeof PROVIDER_VERIFICATION_STATUSES)[number];

export const PROVIDER_PROCESSING_STATUSES = [
  'PENDING',
  'PROCESSED',
  'RECONCILIATION_PENDING',
  'FAILED_TERMINAL'
] as const;

export type ProviderProcessingStatus =
  (typeof PROVIDER_PROCESSING_STATUSES)[number];

export const PROVIDER_RECEIPT_FAILURE_CLASSES = [
  'VERIFICATION',
  'ASSOCIATION',
  'NORMALIZATION',
  'RECONCILIATION',
  'PERSISTENCE'
] as const;

export type ProviderReceiptFailureClass =
  (typeof PROVIDER_RECEIPT_FAILURE_CLASSES)[number];

export const COMMERCIAL_EVENT_SCHEMA_VERSION = 1 as const;
export const MAX_COMMERCIAL_IDENTIFIER_LENGTH = 256;
export const MAX_COMMERCIAL_PROVIDER_EVENT_ID_LENGTH = 512;
export const MAX_COMMERCIAL_NAMESPACE_LENGTH = 64;
export const MAX_COMMERCIAL_ATTRIBUTES_BYTES = 8192;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const NAMESPACE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/u;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/u;
const ATTRIBUTE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/u;
const FORBIDDEN_ATTRIBUTE_KEY_PATTERN =
  /(?:^|_)(?:raw|payload|secret|token|password|card|birth|chart|planet|aspect|interpretation|notification_content)(?:_|$)/iu;
const MAX_ATTRIBUTE_DEPTH = 4;
const MAX_ATTRIBUTE_COLLECTION_SIZE = 32;
const MAX_ATTRIBUTE_NODE_COUNT = 256;
const MAX_ATTRIBUTE_STRING_LENGTH = 1024;

export type CommercialAttributePrimitive = null | boolean | number | string;
export type CommercialAttributeValue =
  | CommercialAttributePrimitive
  | readonly CommercialAttributeValue[]
  | CanonicalCommercialAttributes;
export interface CanonicalCommercialAttributes {
  readonly [key: string]: CommercialAttributeValue;
}

export class CommercialDomainValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CommercialDomainValidationError';
  }
}

function invalid(fieldName: string): never {
  throw new CommercialDomainValidationError(`${fieldName} is invalid.`);
}

function assertBoundedString(
  value: unknown,
  fieldName: string,
  maximumLength: number
): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maximumLength ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    return invalid(fieldName);
  }

  return value;
}

export function assertCommercialIdentifier(
  value: unknown,
  fieldName: string
): string {
  return assertBoundedString(
    value,
    fieldName,
    MAX_COMMERCIAL_IDENTIFIER_LENGTH
  );
}

export function assertCommercialNamespace(
  value: unknown,
  fieldName: string
): string {
  const namespace = assertBoundedString(
    value,
    fieldName,
    MAX_COMMERCIAL_NAMESPACE_LENGTH
  );
  if (!NAMESPACE_PATTERN.test(namespace)) {
    return invalid(fieldName);
  }

  return namespace;
}

export function assertProviderContext(value: unknown): string {
  return assertCommercialIdentifier(value, 'providerContext');
}

export function assertProviderEventId(value: unknown): string {
  return assertBoundedString(
    value,
    'providerEventId',
    MAX_COMMERCIAL_PROVIDER_EVENT_ID_LENGTH
  );
}

export function assertCommercialDigest(
  value: unknown,
  fieldName = 'operationDigest'
): string {
  if (typeof value !== 'string' || !DIGEST_PATTERN.test(value)) {
    return invalid(fieldName);
  }

  return value;
}

export function assertCommercialTimestamp(
  value: unknown,
  fieldName: string
): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value !== 'string') {
    return invalid(fieldName);
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return invalid(fieldName);
  }

  return new Date(parsed).toISOString();
}

export function assertOptionalCommercialTimestamp(
  value: unknown,
  fieldName: string
): string | null {
  return value === null || value === undefined
    ? null
    : assertCommercialTimestamp(value, fieldName);
}

export function assertCommercialRevision(value: unknown): string {
  const revision =
    typeof value === 'bigint'
      ? value.toString()
      : typeof value === 'number' && Number.isSafeInteger(value)
        ? value.toString()
        : value;

  if (
    typeof revision !== 'string' ||
    !/^(?:0|[1-9][0-9]*)$/u.test(revision) ||
    BigInt(revision) > 9223372036854775807n
  ) {
    return invalid('entitlementRevision');
  }

  return revision;
}

function isFrom<const Values extends readonly string[]>(
  values: Values,
  value: unknown
): value is Values[number] {
  return typeof value === 'string' && values.includes(value);
}

export function assertCommercialEventType(
  value: unknown
): CommercialEventType {
  return isFrom(COMMERCIAL_EVENT_TYPES, value)
    ? value
    : invalid('eventType');
}

export function assertCommercialSourceType(
  value: unknown
): CommercialSourceType {
  return isFrom(COMMERCIAL_SOURCE_TYPES, value)
    ? value
    : invalid('sourceType');
}

export function assertCommercialActorClass(
  value: unknown
): CommercialActorClass {
  return isFrom(COMMERCIAL_ACTOR_CLASSES, value)
    ? value
    : invalid('actorClass');
}

export function assertProviderVerificationStatus(
  value: unknown
): ProviderVerificationStatus {
  return isFrom(PROVIDER_VERIFICATION_STATUSES, value)
    ? value
    : invalid('verificationStatus');
}

export function assertProviderProcessingStatus(
  value: unknown
): ProviderProcessingStatus {
  return isFrom(PROVIDER_PROCESSING_STATUSES, value)
    ? value
    : invalid('processingStatus');
}

export function assertProviderReceiptFailureClass(
  value: unknown
): ProviderReceiptFailureClass {
  return isFrom(PROVIDER_RECEIPT_FAILURE_CLASSES, value)
    ? value
    : invalid('failureClass');
}

function normalizeAttributeValue(
  value: unknown,
  depth: number,
  state: { nodes: number }
): CommercialAttributeValue {
  state.nodes += 1;
  if (state.nodes > MAX_ATTRIBUTE_NODE_COUNT || depth > MAX_ATTRIBUTE_DEPTH) {
    return invalid('attributes');
  }

  if (value === null || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : invalid('attributes');
  }
  if (typeof value === 'string') {
    if (
      value.length > MAX_ATTRIBUTE_STRING_LENGTH ||
      CONTROL_CHARACTER_PATTERN.test(value)
    ) {
      return invalid('attributes');
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ATTRIBUTE_COLLECTION_SIZE) {
      return invalid('attributes');
    }
    return Object.freeze(
      value.map((item) => normalizeAttributeValue(item, depth + 1, state))
    );
  }
  if (typeof value !== 'object') {
    return invalid('attributes');
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return invalid('attributes');
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_ATTRIBUTE_COLLECTION_SIZE) {
    return invalid('attributes');
  }

  const normalized: Record<string, CommercialAttributeValue> = {};
  for (const [key, item] of entries.sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0
  )) {
    if (
      !ATTRIBUTE_KEY_PATTERN.test(key) ||
      FORBIDDEN_ATTRIBUTE_KEY_PATTERN.test(key)
    ) {
      return invalid('attributes');
    }
    normalized[key] = normalizeAttributeValue(item, depth + 1, state);
  }

  return Object.freeze(normalized);
}

export function assertCanonicalCommercialAttributes(
  value: unknown
): CanonicalCommercialAttributes {
  const normalized = normalizeAttributeValue(value, 0, { nodes: 0 });
  if (
    normalized === null ||
    Array.isArray(normalized) ||
    typeof normalized !== 'object'
  ) {
    return invalid('attributes');
  }

  const serialized = JSON.stringify(normalized);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_COMMERCIAL_ATTRIBUTES_BYTES) {
    return invalid('attributes');
  }

  return normalized as CanonicalCommercialAttributes;
}

/** Stable key-sorted digest helper for a caller's complete normalized operation. */
export function digestCanonicalCommercialOperation(value: unknown): string {
  const normalized = assertCanonicalCommercialAttributes(value);
  return createHash('sha256')
    .update(JSON.stringify(normalized), 'utf8')
    .digest('hex');
}

export function assertPositiveVersion(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 2147483647
  ) {
    return invalid(fieldName);
  }

  return value;
}
