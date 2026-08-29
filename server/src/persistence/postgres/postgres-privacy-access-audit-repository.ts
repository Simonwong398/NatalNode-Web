import type { SqlExecutor } from '../../db/index.js';
import type {
  PrivacyAccessAuditAction,
  PrivacyAccessAuditActorType,
  PrivacyAccessAuditEvent,
  PrivacyAccessAuditOutcome,
  PrivacyAccessAuditRepository,
  PrivacyAccessAuditResourceCategory
} from '../privacy-access-audit-repository.js';

const MAX_OPAQUE_IDENTIFIER_LENGTH = 256;

const PRIVACY_ACCESS_AUDIT_ACTOR_TYPES = [
  'HUMAN',
  'SERVICE'
] as const satisfies readonly PrivacyAccessAuditActorType[];

const PRIVACY_ACCESS_AUDIT_ACTIONS = [
  'READ',
  'EXPORT',
  'DELETE',
  'REVIEW'
] as const satisfies readonly PrivacyAccessAuditAction[];

const PRIVACY_ACCESS_AUDIT_RESOURCE_CATEGORIES = [
  'ACCOUNT',
  'AUTH',
  'VAULT',
  'ACCOUNT_EXPORT',
  'ACCOUNT_DELETION',
  'FEEDBACK',
  'AUDIT'
] as const satisfies readonly PrivacyAccessAuditResourceCategory[];

const PRIVACY_ACCESS_AUDIT_OUTCOMES = [
  'SUCCESS',
  'DENIED',
  'FAILED'
] as const satisfies readonly PrivacyAccessAuditOutcome[];

const INSERT_PRIVACY_ACCESS_AUDIT_EVENT_SQL = `
  INSERT INTO audit_events (
    audit_event_id,
    occurred_at,
    actor_type,
    actor_id,
    subject_account_id,
    action,
    resource_category,
    outcome,
    request_id
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

function invalidEventField(field: string): never {
  throw new Error(`Privacy access audit ${field} is invalid.`);
}

function assertOpaqueIdentifier(
  value: unknown,
  field: string,
  required = true
): asserts value is string | undefined {
  if (value === undefined && !required) {
    return;
  }

  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_OPAQUE_IDENTIFIER_LENGTH ||
    value.trim() !== value ||
    /[\u0000-\u001F\u007F]/u.test(value)
  ) {
    invalidEventField(field);
  }
}

function assertUtcTimestamp(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    invalidEventField('occurredAt');
  }

  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== value) {
    invalidEventField('occurredAt');
  }
}

function assertBoundedValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  field: string
): asserts value is T {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    invalidEventField(field);
  }
}

function assertValidPrivacyAccessAuditEvent(
  event: PrivacyAccessAuditEvent
): void {
  if (typeof event !== 'object' || event === null) {
    throw new Error('Privacy access audit event is invalid.');
  }

  assertOpaqueIdentifier(event.auditEventId, 'auditEventId');
  assertUtcTimestamp(event.occurredAt);
  assertBoundedValue(
    event.actorType,
    PRIVACY_ACCESS_AUDIT_ACTOR_TYPES,
    'actorType'
  );
  assertOpaqueIdentifier(event.actorId, 'actorId');
  assertBoundedValue(
    event.action,
    PRIVACY_ACCESS_AUDIT_ACTIONS,
    'action'
  );
  assertBoundedValue(
    event.resourceCategory,
    PRIVACY_ACCESS_AUDIT_RESOURCE_CATEGORIES,
    'resourceCategory'
  );
  assertBoundedValue(event.outcome, PRIVACY_ACCESS_AUDIT_OUTCOMES, 'outcome');

  if (event.resourceCategory === 'AUDIT') {
    assertOpaqueIdentifier(event.subjectAccountId, 'subjectAccountId', false);
    if (event.action !== 'REVIEW') {
      invalidEventField('action/resourceCategory');
    }
  } else {
    assertOpaqueIdentifier(event.subjectAccountId, 'subjectAccountId');
    if (event.action === 'REVIEW') {
      invalidEventField('action/resourceCategory');
    }
  }

  assertOpaqueIdentifier(event.requestId, 'requestId', false);
}

export class PostgresPrivacyAccessAuditRepository
  implements PrivacyAccessAuditRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async append(event: PrivacyAccessAuditEvent): Promise<void> {
    assertValidPrivacyAccessAuditEvent(event);

    await this.executor.query<never>(INSERT_PRIVACY_ACCESS_AUDIT_EVENT_SQL, [
      event.auditEventId,
      event.occurredAt,
      event.actorType,
      event.actorId,
      event.subjectAccountId ?? null,
      event.action,
      event.resourceCategory,
      event.outcome,
      event.requestId ?? null
    ]);
  }
}
