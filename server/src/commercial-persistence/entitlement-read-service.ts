import type { SqlExecutor } from '../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialTimestamp
} from './commercial-domain.js';
import {
  assessEntitlementProjectionFreshness,
  createEntitlementProjection,
  createIndeterminateEntitlement,
  evaluateEffectiveEntitlement,
  evaluateEntitlementCapability,
  projectionToEffectiveEntitlement,
  toEffectiveEntitlementResult
} from './entitlement-domain.js';
import {
  EntitlementIntegrityError,
  EntitlementProjectionConflictError,
  EntitlementRevisionConflictError,
  CommercialPersistenceUnavailableError,
  CommercialRevisionConflictError
} from './commercial-persistence-errors.js';
import type {
  EffectiveEntitlementResult,
  EntitlementCapability,
  EntitlementCapabilityDecision,
  EntitlementProjectionRecord
} from './entitlement-types.js';
import type {
  CommercialAuthorityRecord,
  CommercialPersistenceRepositories
} from './repositories.js';
import { createPostgresCommercialPersistence } from './postgres/create-postgres-commercial-persistence.js';

const DATABASE_NOW_SQL = 'SELECT CURRENT_TIMESTAMP AS now';

interface DatabaseNowRow {
  now: Date | string;
}

export type EntitlementReadRepositories = Pick<
  CommercialPersistenceRepositories,
  | 'authorities'
  | 'paidBillingRelationships'
  | 'paidCoverages'
  | 'entitlementProjections'
>;

export interface EntitlementReadService {
  getEffectiveEntitlement(ownerId: string): Promise<EffectiveEntitlementResult>;
  rebuildEntitlementProjection(
    ownerId: string
  ): Promise<EffectiveEntitlementResult>;
  evaluateCapability(
    ownerId: string,
    capability: EntitlementCapability
  ): Promise<EntitlementCapabilityDecision>;
}

function failureResult(error: unknown): EffectiveEntitlementResult {
  if (
    error instanceof EntitlementIntegrityError ||
    error instanceof EntitlementProjectionConflictError
  ) {
    return createIndeterminateEntitlement('PROJECTION_INTEGRITY');
  }
  if (
    error instanceof EntitlementRevisionConflictError ||
    error instanceof CommercialRevisionConflictError
  ) {
    return createIndeterminateEntitlement('REVISION_CONFLICT', null, true);
  }
  if (error instanceof CommercialPersistenceUnavailableError) {
    return createIndeterminateEntitlement(
      'PERSISTENCE_UNAVAILABLE',
      null,
      true
    );
  }
  return createIndeterminateEntitlement('PERSISTENCE_UNAVAILABLE', null, true);
}

async function rollbackTransaction(
  executor: SqlExecutor,
  transactionError: unknown
): Promise<never> {
  try {
    await executor.query('ROLLBACK');
  } catch (rollbackError) {
    throw new AggregateError(
      [transactionError, rollbackError],
      'Entitlement transaction and rollback both failed.'
    );
  }
  throw transactionError;
}

/**
 * Runs the canonical read/rebuild flow over one transaction-bound executor.
 * The executor must use one checked-out database connection for the lifetime
 * of each call; the class is deliberately not wired to a provider or a web
 * route in D3.
 */
export class PostgresEntitlementReadService implements EntitlementReadService {
  private readonly repositories: EntitlementReadRepositories;

  public constructor(
    private readonly executor: SqlExecutor,
    repositories?: EntitlementReadRepositories
  ) {
    this.repositories =
      repositories ?? createPostgresCommercialPersistence(executor);
  }

  public async getEffectiveEntitlement(
    ownerIdInput: string
  ): Promise<EffectiveEntitlementResult> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    try {
      return await this.withTransaction(() =>
        this.readWithinTransaction(ownerId)
      );
    } catch (error) {
      return failureResult(error);
    }
  }

  public async rebuildEntitlementProjection(
    ownerIdInput: string
  ): Promise<EffectiveEntitlementResult> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    try {
      return await this.withTransaction(async () => {
        const authority = await this.repositories.authorities.lockForUpdate(
          ownerId
        );
        const authoritativeNow = await this.databaseNow();
        return this.rebuildWithinTransaction(
          ownerId,
          authority,
          authoritativeNow
        );
      });
    } catch (error) {
      return failureResult(error);
    }
  }

  public async evaluateCapability(
    ownerIdInput: string,
    capability: EntitlementCapability
  ): Promise<EntitlementCapabilityDecision> {
    const entitlement = await this.getEffectiveEntitlement(ownerIdInput);
    return evaluateEntitlementCapability(entitlement, capability);
  }

  private async readWithinTransaction(
    ownerId: string
  ): Promise<EffectiveEntitlementResult> {
    const authority = await this.repositories.authorities.lockForUpdate(ownerId);
    const authoritativeNow = await this.databaseNow();
    const projection =
      await this.repositories.entitlementProjections.getByAuthority(
        authority.commercialAuthorityId
      );

    if (projection !== null) {
      const freshness = assessEntitlementProjectionFreshness(
        projection,
        authority.entitlementRevision,
        authoritativeNow
      );
      if (freshness === 'INTEGRITY_CONFLICT') {
        return createIndeterminateEntitlement(
          'PROJECTION_INTEGRITY',
          authority.entitlementRevision
        );
      }
      if (freshness === 'CURRENT') {
        const result = projectionToEffectiveEntitlement(projection);
        if (result.determination === 'DETERMINATE') {
          return result;
        }
        return createIndeterminateEntitlement(
          'PROJECTION_INTEGRITY',
          authority.entitlementRevision
        );
      }
    }

    return this.rebuildWithinTransaction(ownerId, authority, authoritativeNow);
  }

  private async rebuildWithinTransaction(
    ownerId: string,
    authority: CommercialAuthorityRecord,
    authoritativeNow: string
  ): Promise<EffectiveEntitlementResult> {
    const relationships =
      await this.repositories.paidBillingRelationships.getByAuthority(
        ownerId,
        authority.commercialAuthorityId
      );
    const coverages = [];
    for (const relationship of relationships) {
      const relationshipCoverages =
        await this.repositories.paidCoverages.listByRelationship(
          ownerId,
          authority.commercialAuthorityId,
          relationship.paidRelationshipId
        );
      coverages.push(...relationshipCoverages);
    }

    const evaluation = evaluateEffectiveEntitlement({
      commercialAuthorityId: authority.commercialAuthorityId,
      entitlementRevision: authority.entitlementRevision,
      evaluatedAt: authoritativeNow,
      paidBillingRelationships: relationships,
      paidCoverages: coverages
    });
    const result = toEffectiveEntitlementResult(evaluation);
    if (evaluation.determination !== 'DETERMINATE') {
      // An indeterminate evaluation is transient read state. Leave any prior
      // deterministic projection intact instead of replacing it with FREE.
      return result;
    }

    const projection = createEntitlementProjection(evaluation, authoritativeNow);
    const savedProjection =
      await this.repositories.entitlementProjections.upsertAtRevision({
        ownerId,
        projection
      });
    const savedResult = projectionToEffectiveEntitlement(savedProjection);
    if (savedResult.determination !== 'DETERMINATE') {
      return createIndeterminateEntitlement(
        'PROJECTION_INTEGRITY',
        authority.entitlementRevision
      );
    }
    return savedResult;
  }

  private async databaseNow(): Promise<string> {
    const result = await this.executor.query<DatabaseNowRow>(DATABASE_NOW_SQL);
    const row = result.rows[0];
    if (row === undefined) {
      throw new EntitlementIntegrityError();
    }
    return assertCommercialTimestamp(row.now, 'authoritativeNow');
  }

  private async withTransaction<Result>(
    operation: () => Promise<Result>
  ): Promise<Result> {
    let transactionStarted = false;
    try {
      await this.executor.query('BEGIN');
      transactionStarted = true;
      const result = await operation();
      await this.executor.query('COMMIT');
      return result;
    } catch (error) {
      if (!transactionStarted) {
        throw error;
      }
      return rollbackTransaction(this.executor, error);
    }
  }
}

export function createPostgresEntitlementReadService(
  executor: SqlExecutor,
  repositories?: EntitlementReadRepositories
): PostgresEntitlementReadService {
  return new PostgresEntitlementReadService(executor, repositories);
}
