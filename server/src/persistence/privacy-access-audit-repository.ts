export type PrivacyAccessAuditActorType = 'HUMAN' | 'SERVICE';

export type PrivacyAccessAuditAction =
  | 'READ'
  | 'EXPORT'
  | 'DELETE'
  | 'REVIEW';

export type PrivacyAccessAuditResourceCategory =
  | 'ACCOUNT'
  | 'AUTH'
  | 'VAULT'
  | 'ACCOUNT_EXPORT'
  | 'ACCOUNT_DELETION'
  | 'FEEDBACK'
  | 'AUDIT';

export type PrivacyAccessAuditAccountResourceCategory = Exclude<
  PrivacyAccessAuditResourceCategory,
  'AUDIT'
>;

export type PrivacyAccessAuditOutcome = 'SUCCESS' | 'DENIED' | 'FAILED';

interface PrivacyAccessAuditEventBase {
  readonly auditEventId: string;
  readonly occurredAt: string;
  readonly actorType: PrivacyAccessAuditActorType;
  readonly actorId: string;
  readonly action: PrivacyAccessAuditAction;
  readonly outcome: PrivacyAccessAuditOutcome;
  readonly requestId?: string;
}

/**
 * Private server-side event shape for approved privileged privacy access.
 * Account-scoped categories require an opaque subject; multi-subject AUDIT
 * review may omit it. No client or product-content fields belong here.
 */
export type PrivacyAccessAuditEvent =
  | (PrivacyAccessAuditEventBase & {
      readonly subjectAccountId: string;
      readonly resourceCategory: PrivacyAccessAuditAccountResourceCategory;
    })
  | (PrivacyAccessAuditEventBase & {
      readonly subjectAccountId?: string;
      readonly resourceCategory: 'AUDIT';
    });

/** Durable append-only boundary for the restricted privacy audit stream. */
export interface PrivacyAccessAuditRepository {
  append(event: PrivacyAccessAuditEvent): Promise<void>;
}
