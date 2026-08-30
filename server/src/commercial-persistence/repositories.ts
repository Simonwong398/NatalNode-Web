import type {
  CanonicalCommercialAttributes,
  CommercialActorClass,
  CommercialEventType,
  CommercialSourceType,
  ProviderProcessingStatus,
  ProviderReceiptFailureClass,
  ProviderVerificationStatus
} from './commercial-domain.js';

export interface CommercialAuthorityRecord {
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
  readonly entitlementRevision: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EnsureCommercialAuthorityInput {
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
}

export type EnsureCommercialAuthorityResult =
  | {
      readonly outcome: 'CREATED';
      readonly authority: CommercialAuthorityRecord;
    }
  | {
      readonly outcome: 'EXISTING';
      readonly authority: CommercialAuthorityRecord;
    };

export interface AdvanceCommercialRevisionInput {
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
  readonly expectedRevision: string;
}

/**
 * Transaction-scoped authority primitives. Locking methods require a
 * caller-owned transaction and preserve live users root -> authority order.
 */
export interface CommercialAuthorityRepository {
  ensureAndLockForUpdate(
    input: EnsureCommercialAuthorityInput
  ): Promise<EnsureCommercialAuthorityResult>;
  lockForUpdate(ownerId: string): Promise<CommercialAuthorityRecord>;
  getByOwnerId(ownerId: string): Promise<CommercialAuthorityRecord | null>;
  advanceRevisionAfterLock(
    input: AdvanceCommercialRevisionInput
  ): Promise<CommercialAuthorityRecord>;
}

export interface CommercialEventRecord {
  readonly eventId: string;
  readonly commercialAuthorityId: string;
  readonly eventType: CommercialEventType;
  readonly sourceType: CommercialSourceType;
  readonly sourceEntityId: string;
  readonly sourceNamespace: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerEventId: string | null;
  readonly providerReceiptId: string | null;
  readonly idempotencyNamespace: string;
  readonly idempotencyKey: string;
  readonly operationDigest: string;
  readonly occurredAt: string | null;
  readonly effectiveAt: string;
  readonly ingestedAt: string;
  readonly causedByEventId: string | null;
  readonly correctsEventId: string | null;
  readonly reversesEventId: string | null;
  readonly attributes: CanonicalCommercialAttributes;
  readonly attributesVersion: number;
  readonly schemaVersion: 1;
  readonly actorClass: CommercialActorClass | null;
  readonly actorReference: string | null;
}

export interface AppendCommercialEventInput {
  readonly eventId: string;
  /** Guard-only live owner identity; not duplicated into CommercialEvent. */
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly eventType: CommercialEventType;
  readonly sourceType: CommercialSourceType;
  readonly sourceEntityId: string;
  readonly sourceNamespace: string;
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerEventId: string | null;
  readonly providerReceiptId: string | null;
  readonly idempotencyNamespace: string;
  readonly idempotencyKey: string;
  readonly operationDigest: string;
  readonly occurredAt: string | null;
  readonly effectiveAt: string;
  readonly causedByEventId: string | null;
  readonly correctsEventId: string | null;
  readonly reversesEventId: string | null;
  readonly attributes: unknown;
  readonly attributesVersion: number;
  readonly schemaVersion: 1;
  readonly actorClass: CommercialActorClass | null;
  readonly actorReference: string | null;
}

export type AppendCommercialEventResult =
  | {
      readonly outcome: 'APPENDED';
      readonly event: CommercialEventRecord;
    }
  | {
      readonly outcome: 'DUPLICATE';
      readonly event: CommercialEventRecord;
    };

/** Append-only journal surface; deliberately has no update/delete operation. */
export interface CommercialEventRepository {
  appendIdempotent(
    input: AppendCommercialEventInput
  ): Promise<AppendCommercialEventResult>;
  getByIdempotencyIdentity(
    idempotencyNamespace: string,
    idempotencyKey: string
  ): Promise<CommercialEventRecord | null>;
}

export interface ProviderIngestionReceiptRecord {
  readonly providerReceiptId: string;
  readonly providerNamespace: string;
  readonly providerContext: string;
  readonly providerEventId: string;
  readonly verificationStatus: ProviderVerificationStatus;
  readonly processingStatus: ProviderProcessingStatus;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly attemptCount: number;
  readonly normalizedEventType: CommercialEventType | null;
  readonly operationDigest: string;
  readonly failureClass: ProviderReceiptFailureClass | null;
  readonly processedAt: string | null;
  readonly reconciledAt: string | null;
}

export interface ClaimProviderIngestionReceiptInput {
  readonly providerReceiptId: string;
  readonly providerNamespace: string;
  readonly providerContext: string;
  readonly providerEventId: string;
  readonly operationDigest: string;
  readonly verificationStatus: ProviderVerificationStatus;
  readonly failureClass: ProviderReceiptFailureClass | null;
}

export type ClaimProviderIngestionReceiptResult =
  | {
      readonly outcome: 'CLAIMED';
      readonly receipt: ProviderIngestionReceiptRecord;
    }
  | {
      readonly outcome: 'DUPLICATE';
      readonly receipt: ProviderIngestionReceiptRecord;
    };

export interface TransitionProviderIngestionReceiptInput {
  readonly providerReceiptId: string;
  readonly expectedVerificationStatus: ProviderVerificationStatus;
  readonly expectedProcessingStatus: ProviderProcessingStatus;
  readonly nextVerificationStatus: ProviderVerificationStatus;
  readonly nextProcessingStatus: ProviderProcessingStatus;
  readonly normalizedEventType: CommercialEventType | null;
  readonly failureClass: ProviderReceiptFailureClass | null;
}

/**
 * Transaction-scoped provider receipt surface. Claiming precedes owner locks;
 * processing transitions compose with event append in the caller transaction.
 */
export interface ProviderIngestionReceiptRepository {
  claimIdempotent(
    input: ClaimProviderIngestionReceiptInput
  ): Promise<ClaimProviderIngestionReceiptResult>;
  transition(
    input: TransitionProviderIngestionReceiptInput
  ): Promise<ProviderIngestionReceiptRecord>;
  getByProviderIdentity(
    providerNamespace: string,
    providerContext: string,
    providerEventId: string
  ): Promise<ProviderIngestionReceiptRecord | null>;
}

export interface CommercialPersistenceRepositories {
  readonly authorities: CommercialAuthorityRepository;
  readonly events: CommercialEventRepository;
  readonly providerReceipts: ProviderIngestionReceiptRepository;
}
