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

export class CommercialPersistenceUnavailableError extends Error {
  public constructor() {
    super('Commercial persistence is unavailable.');
    this.name = 'CommercialPersistenceUnavailableError';
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
