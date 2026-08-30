export class CommercialOwnerNotFoundError extends Error {
  public constructor() {
    super('Commercial owner is unavailable.');
    this.name = 'CommercialOwnerNotFoundError';
  }
}

export class CommercialAuthorityUnavailableError extends Error {
  public constructor() {
    super('Commercial authority is unavailable.');
    this.name = 'CommercialAuthorityUnavailableError';
  }
}

export class CommercialRevisionConflictError extends Error {
  public constructor() {
    super('Commercial authority revision changed concurrently.');
    this.name = 'CommercialRevisionConflictError';
  }
}

export class CommercialIdempotencyConflictError extends Error {
  public constructor() {
    super('Commercial idempotency identity conflicts with the prior operation.');
    this.name = 'CommercialIdempotencyConflictError';
  }
}

export class ProviderReceiptConflictError extends Error {
  public constructor() {
    super('Provider event identity conflicts with the prior receipt.');
    this.name = 'ProviderReceiptConflictError';
  }
}

export class ProviderReceiptNotFoundError extends Error {
  public constructor() {
    super('Provider ingestion receipt is unavailable.');
    this.name = 'ProviderReceiptNotFoundError';
  }
}

export class InvalidCommercialStateTransitionError extends Error {
  public constructor() {
    super('Commercial persistence state transition is invalid.');
    this.name = 'InvalidCommercialStateTransitionError';
  }
}

export class CommercialPersistenceIntegrityError extends Error {
  public constructor() {
    super('Commercial persistence integrity validation failed.');
    this.name = 'CommercialPersistenceIntegrityError';
  }
}

export class PaidCommercialEventNotFoundError extends Error {
  public constructor() {
    super('Paid reconciliation event is unavailable.');
    this.name = 'PaidCommercialEventNotFoundError';
  }
}

export class PaidRelationshipNotFoundError extends Error {
  public constructor() {
    super('Paid billing relationship is unavailable.');
    this.name = 'PaidRelationshipNotFoundError';
  }
}

export class PaidRelationshipConflictError extends Error {
  public constructor() {
    super('Paid billing relationship conflicts with existing source state.');
    this.name = 'PaidRelationshipConflictError';
  }
}

export class PaidRelationshipTransitionConflictError extends Error {
  public constructor() {
    super('Paid billing relationship transition conflicts with current state.');
    this.name = 'PaidRelationshipTransitionConflictError';
  }
}

export class PaidCoverageNotFoundError extends Error {
  public constructor() {
    super('Paid coverage is unavailable.');
    this.name = 'PaidCoverageNotFoundError';
  }
}

export class PaidCoverageConflictError extends Error {
  public constructor() {
    super('Paid coverage conflicts with existing source state.');
    this.name = 'PaidCoverageConflictError';
  }
}

export class PaidCoverageReversalConflictError extends Error {
  public constructor() {
    super('Paid coverage reversal conflicts with existing source state.');
    this.name = 'PaidCoverageReversalConflictError';
  }
}

export class ReferralPublicIdentityConflictError extends Error {
  public constructor() {
    super('Referral public identity conflicts with existing source state.');
    this.name = 'ReferralPublicIdentityConflictError';
  }
}

export class ReferralAttributionNotFoundError extends Error {
  public constructor() {
    super('Referral attribution is unavailable.');
    this.name = 'ReferralAttributionNotFoundError';
  }
}

export class ReferralAttributionConflictError extends Error {
  public constructor() {
    super('Referral attribution conflicts with existing source state.');
    this.name = 'ReferralAttributionConflictError';
  }
}

export class ReferralSelfReferralError extends Error {
  public constructor() {
    super('Referral self-attribution is not eligible.');
    this.name = 'ReferralSelfReferralError';
  }
}

export class ReferralNotEligibleError extends Error {
  public constructor() {
    super('Referral operation is not eligible.');
    this.name = 'ReferralNotEligibleError';
  }
}

export class ReferralRewardNotFoundError extends Error {
  public constructor() {
    super('Referral reward is unavailable.');
    this.name = 'ReferralRewardNotFoundError';
  }
}

export class ReferralRewardConflictError extends Error {
  public constructor() {
    super('Referral reward conflicts with existing source state.');
    this.name = 'ReferralRewardConflictError';
  }
}

export class ReferralRewardNotRevocableError extends Error {
  public constructor() {
    super('Referral reward is not revocable in the current D4A state.');
    this.name = 'ReferralRewardNotRevocableError';
  }
}

export class CommercialPersistenceUnavailableError extends Error {
  public constructor() {
    super('Commercial persistence is unavailable.');
    this.name = 'CommercialPersistenceUnavailableError';
  }
}

export class EntitlementProjectionConflictError extends Error {
  public constructor() {
    super('Entitlement projection conflicts with a newer derived revision.');
    this.name = 'EntitlementProjectionConflictError';
  }
}

export class EntitlementRevisionConflictError extends Error {
  public constructor() {
    super('Entitlement projection revision does not match its authority.');
    this.name = 'EntitlementRevisionConflictError';
  }
}

export class EntitlementIntegrityError extends Error {
  public constructor() {
    super('Entitlement projection integrity validation failed.');
    this.name = 'EntitlementIntegrityError';
  }
}

interface PostgresErrorLike {
  readonly code?: unknown;
}

export function postgresErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const code = (error as PostgresErrorLike).code;
  return typeof code === 'string' ? code : null;
}

export function mapCommercialPersistenceFailure(error: unknown): Error {
  if (
    error instanceof CommercialOwnerNotFoundError ||
    error instanceof CommercialAuthorityUnavailableError ||
    error instanceof CommercialRevisionConflictError ||
    error instanceof CommercialIdempotencyConflictError ||
    error instanceof ProviderReceiptConflictError ||
    error instanceof ProviderReceiptNotFoundError ||
    error instanceof InvalidCommercialStateTransitionError ||
    error instanceof CommercialPersistenceIntegrityError ||
    error instanceof PaidCommercialEventNotFoundError ||
    error instanceof PaidRelationshipNotFoundError ||
    error instanceof PaidRelationshipConflictError ||
    error instanceof PaidRelationshipTransitionConflictError ||
    error instanceof PaidCoverageNotFoundError ||
    error instanceof PaidCoverageConflictError ||
    error instanceof PaidCoverageReversalConflictError ||
    error instanceof ReferralPublicIdentityConflictError ||
    error instanceof ReferralAttributionNotFoundError ||
    error instanceof ReferralAttributionConflictError ||
    error instanceof ReferralSelfReferralError ||
    error instanceof ReferralNotEligibleError ||
    error instanceof ReferralRewardNotFoundError ||
    error instanceof ReferralRewardConflictError ||
    error instanceof ReferralRewardNotRevocableError ||
    error instanceof EntitlementProjectionConflictError ||
    error instanceof EntitlementRevisionConflictError ||
    error instanceof EntitlementIntegrityError ||
    error instanceof CommercialPersistenceUnavailableError
  ) {
    return error;
  }

  const code = postgresErrorCode(error);
  if (code === '23503' || code === '23514' || code === '22P02') {
    return new CommercialPersistenceIntegrityError();
  }

  return new CommercialPersistenceUnavailableError();
}
