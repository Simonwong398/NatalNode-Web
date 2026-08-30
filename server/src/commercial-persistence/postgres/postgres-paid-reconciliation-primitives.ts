import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialTimestamp,
  assertPaidBillingInterval,
  assertPaidRelationshipEndReason,
  type CommercialEventType,
  type PaidRelationshipEndReason
} from '../commercial-domain.js';
import {
  CommercialAuthorityUnavailableError,
  CommercialPersistenceIntegrityError,
  PaidCoverageConflictError,
  PaidCoverageReversalConflictError,
  PaidRelationshipConflictError,
  PaidRelationshipTransitionConflictError
} from '../commercial-persistence-errors.js';
import type {
  CommercialAuthorityRecord,
  EndPaidCoverageOperationInput,
  EndPaidRelationshipInput,
  EnterPaidRecoveryInput,
  OpenPaidRelationshipInput,
  PaidBillingRelationshipRecord,
  PaidBillingRelationshipRepository,
  PaidCoverageOperationInput,
  PaidCoverageRecord,
  PaidCoverageRepository,
  PaidReconciliationContext,
  PaidReconciliationOutcome,
  PaidReconciliationPrimitives,
  PaidReconciliationResult,
  PaidRelationshipOperationInput,
  ReversePaidCoverageInput
} from '../repositories.js';
import { PostgresCommercialAuthorityRepository } from './postgres-commercial-authority-repository.js';
import { PostgresPaidBillingRelationshipRepository } from './postgres-paid-billing-relationship-repository.js';
import { PostgresPaidCoverageRepository } from './postgres-paid-coverage-repository.js';
import {
  assertCoverageInterval,
  assertGraceBoundary,
  exactGraceUntil,
  incrementRevision,
  requirePaidCommercialEvent
} from './postgres-paid-persistence-shared.js';

const RELATIONSHIP_OPENED_EVENTS: readonly CommercialEventType[] = [
  'PAID_RELATIONSHIP_OPENED'
];
const FIRST_PURCHASE_SUCCESS_EVENTS: readonly CommercialEventType[] = [
  'PAID_PURCHASE_SUCCEEDED'
];
const FIRST_PURCHASE_FAILURE_EVENTS: readonly CommercialEventType[] = [
  'PAID_FIRST_PURCHASE_FAILED'
];
const CANCELLATION_EVENTS: readonly CommercialEventType[] = [
  'PAID_CANCELLATION_SCHEDULED'
];
const RESTORE_EVENTS: readonly CommercialEventType[] = [
  'PAID_RENEWAL_RESTORED'
];
const RENEWAL_SUCCESS_EVENTS: readonly CommercialEventType[] = [
  'PAID_RENEWAL_SUCCEEDED'
];
const RENEWAL_FAILURE_EVENTS: readonly CommercialEventType[] = [
  'PAID_RENEWAL_FAILED'
];
const GRACE_EXPIRY_EVENTS: readonly CommercialEventType[] = [
  'PAID_GRACE_EXPIRED'
];
const RELATIONSHIP_END_EVENTS: readonly CommercialEventType[] = [
  'PAID_RELATIONSHIP_ENDED'
];
const COVERAGE_END_EVENTS: readonly CommercialEventType[] = [
  'PAID_COVERAGE_ENDED'
];
const REFUND_EVENTS: readonly CommercialEventType[] = [
  'PAID_COVERAGE_REFUNDED'
];
const CHARGEBACK_EVENTS: readonly CommercialEventType[] = [
  'PAID_COVERAGE_CHARGEBACKED'
];

interface PaidMutationDraft {
  readonly changed: boolean;
  readonly outcome: PaidReconciliationOutcome;
  readonly relationship: PaidBillingRelationshipRecord | null;
  readonly coverage: PaidCoverageRecord | null;
}

interface PaidMutationContext {
  readonly authority: CommercialAuthorityRecord;
  readonly event: {
    readonly eventId: string;
    readonly effectiveAt: string;
  };
  readonly nextRevision: () => string;
}

interface RelationshipMutationContext extends PaidMutationContext {
  readonly relationship: PaidBillingRelationshipRecord;
}

function duplicate(
  relationship: PaidBillingRelationshipRecord | null,
  coverage: PaidCoverageRecord | null = null
): PaidMutationDraft {
  return {
    changed: false,
    outcome: 'DUPLICATE',
    relationship,
    coverage
  };
}

function noOp(
  relationship: PaidBillingRelationshipRecord | null,
  coverage: PaidCoverageRecord | null = null
): PaidMutationDraft {
  return {
    changed: false,
    outcome: 'NO_OP',
    relationship,
    coverage
  };
}

function applied(
  relationship: PaidBillingRelationshipRecord | null,
  coverage: PaidCoverageRecord | null = null
): PaidMutationDraft {
  return {
    changed: true,
    outcome: 'APPLIED',
    relationship,
    coverage
  };
}

function relationshipScope(
  input: PaidRelationshipOperationInput
): {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly paidRelationshipId: string;
} {
  return {
    ownerId: assertCommercialIdentifier(input.ownerId, 'ownerId'),
    commercialAuthorityId: assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    ),
    paidRelationshipId: assertCommercialIdentifier(
      input.paidRelationshipId,
      'paidRelationshipId'
    )
  };
}

function context(input: PaidReconciliationContext): PaidReconciliationContext {
  return {
    ownerId: assertCommercialIdentifier(input.ownerId, 'ownerId'),
    commercialAuthorityId: assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    ),
    eventId: assertCommercialIdentifier(input.eventId, 'eventId')
  };
}

function providerValuesEqual(
  left: PaidBillingRelationshipRecord,
  right: OpenPaidRelationshipInput
): boolean {
  return (
    left.commercialAuthorityId === right.commercialAuthorityId &&
    left.providerNamespace === right.providerNamespace &&
    left.providerContext === right.providerContext &&
    left.providerRelationshipRef === right.providerRelationshipRef &&
    left.billingInterval === right.billingInterval
  );
}

function coverageValuesEqual(
  left: PaidCoverageRecord,
  right: PaidCoverageOperationInput,
  successEventId: string
): boolean {
  return (
    left.paidRelationshipId === right.paidRelationshipId &&
    left.commercialAuthorityId === right.commercialAuthorityId &&
    left.purchaseNamespace === right.purchaseNamespace &&
    left.purchaseIdentity === right.purchaseIdentity &&
    left.billingInterval === right.billingInterval &&
    left.coverageStartAt === assertCommercialTimestamp(
      right.coverageStartAt,
      'coverageStartAt'
    ) &&
    left.scheduledCoverageEndAt === assertCommercialTimestamp(
      right.scheduledCoverageEndAt,
      'scheduledCoverageEndAt'
    ) &&
    left.successEventId === successEventId
  );
}

/**
 * Owner-scoped normalized Paid reconciliation. The executor must already be
 * inside the caller's transaction; this class never begins or commits one.
 */
export class PostgresPaidReconciliationPrimitives
  implements PaidReconciliationPrimitives
{
  private readonly authorities: PostgresCommercialAuthorityRepository;
  private readonly relationships: PaidBillingRelationshipRepository;
  private readonly coverages: PaidCoverageRepository;

  public constructor(
    private readonly executor: SqlExecutor,
    authorities: PostgresCommercialAuthorityRepository =
      new PostgresCommercialAuthorityRepository(executor),
    relationships: PaidBillingRelationshipRepository =
      new PostgresPaidBillingRelationshipRepository(executor),
    coverages: PaidCoverageRepository = new PostgresPaidCoverageRepository(executor)
  ) {
    this.authorities = authorities;
    this.relationships = relationships;
    this.coverages = coverages;
  }

  public async openFirstPaidRelationship(
    input: OpenPaidRelationshipInput
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      paidRelationshipId: assertCommercialIdentifier(
        input.paidRelationshipId,
        'paidRelationshipId'
      ),
      providerNamespace: input.providerNamespace,
      providerContext: input.providerContext,
      providerRelationshipRef: input.providerRelationshipRef,
      billingInterval: assertPaidBillingInterval(input.billingInterval)
    };

    return this.runWithEvent(
      normalized,
      RELATIONSHIP_OPENED_EVENTS,
      async ({ authority, event, nextRevision }) => {
        const existing = await this.relationships.getById(
          normalized.paidRelationshipId
        );
        if (existing !== null) {
          if (
            existing.lastReconciledEventId === event.eventId &&
            providerValuesEqual(existing, normalized)
          ) {
            return duplicate(existing);
          }
          throw new PaidRelationshipConflictError();
        }

        const relationship = await this.relationships.createPending({
          ownerId: normalized.ownerId,
          commercialAuthorityId: normalized.commercialAuthorityId,
          paidRelationshipId: normalized.paidRelationshipId,
          providerNamespace: normalized.providerNamespace,
          providerContext: normalized.providerContext,
          providerRelationshipRef: normalized.providerRelationshipRef,
          billingInterval: normalized.billingInterval,
          lastReconciledEventId: event.eventId,
          sourceRevision: nextRevision()
        });
        return applied(relationship);
      }
    );
  }

  public async recordSuccessfulFirstPurchase(
    input: PaidCoverageOperationInput
  ): Promise<PaidReconciliationResult> {
    return this.recordSuccessfulCoverage(input, 'PENDING_FIRST_PAYMENT');
  }

  public async recordFailedFirstPurchase(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      ...relationshipScope(input)
    };
    return this.runWithRelationship(
      normalized,
      FIRST_PURCHASE_FAILURE_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        if (relationship.lifecycleState === 'FIRST_PAYMENT_FAILED') {
          if (relationship.lastReconciledEventId === event.eventId) {
            return duplicate(relationship);
          }
          throw new PaidRelationshipTransitionConflictError();
        }
        if (relationship.lifecycleState !== 'PENDING_FIRST_PAYMENT') {
          throw new PaidRelationshipTransitionConflictError();
        }

        const existingCoverage = await this.coverages.listByRelationship(
          normalized.ownerId,
          normalized.commercialAuthorityId,
          normalized.paidRelationshipId
        );
        if (existingCoverage.length > 0) {
          throw new CommercialPersistenceIntegrityError();
        }

        const next = nextRevision();
        const updated = await this.relationships.transition({
          ...relationshipScope(normalized),
          expectedLifecycleState: relationship.lifecycleState,
          expectedRenewalIntent: relationship.renewalIntent,
          nextLifecycleState: 'FIRST_PAYMENT_FAILED',
          nextRenewalIntent: 'ENABLED',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          graceStartedAt: null,
          graceUntil: null,
          failedRenewalIdentity: null,
          endedAt: null,
          endReason: null,
          lastReconciledEventId: event.eventId,
          sourceRevision: next
        });
        return applied(updated);
      }
    );
  }

  public async scheduleCancellation(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult> {
    const normalized = { ...context(input), ...relationshipScope(input) };
    return this.runWithRelationship(
      normalized,
      CANCELLATION_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        if (relationship.lifecycleState !== 'ACTIVE') {
          throw new PaidRelationshipTransitionConflictError();
        }
        if (relationship.renewalIntent === 'CANCEL_AT_PERIOD_END') {
          return relationship.lastReconciledEventId === event.eventId
            ? duplicate(relationship)
            : noOp(relationship);
        }
        const updated = await this.transitionRelationship(
          relationship,
          normalized,
          event.eventId,
          nextRevision(),
          {
            lifecycleState: 'ACTIVE',
            renewalIntent: 'CANCEL_AT_PERIOD_END',
            currentPeriodStart: relationship.currentPeriodStart,
            currentPeriodEnd: relationship.currentPeriodEnd,
            graceStartedAt: null,
            graceUntil: null,
            failedRenewalIdentity: relationship.failedRenewalIdentity,
            endedAt: null,
            endReason: null
          }
        );
        return applied(updated);
      }
    );
  }

  public async restoreRenewal(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult> {
    const normalized = { ...context(input), ...relationshipScope(input) };
    return this.runWithRelationship(
      normalized,
      RESTORE_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        if (relationship.lifecycleState !== 'ACTIVE') {
          throw new PaidRelationshipTransitionConflictError();
        }
        if (relationship.renewalIntent === 'ENABLED') {
          return relationship.lastReconciledEventId === event.eventId
            ? duplicate(relationship)
            : noOp(relationship);
        }
        const updated = await this.transitionRelationship(
          relationship,
          normalized,
          event.eventId,
          nextRevision(),
          {
            lifecycleState: 'ACTIVE',
            renewalIntent: 'ENABLED',
            currentPeriodStart: relationship.currentPeriodStart,
            currentPeriodEnd: relationship.currentPeriodEnd,
            graceStartedAt: null,
            graceUntil: null,
            failedRenewalIdentity: relationship.failedRenewalIdentity,
            endedAt: null,
            endReason: null
          }
        );
        return applied(updated);
      }
    );
  }

  public async recordSuccessfulRenewal(
    input: PaidCoverageOperationInput
  ): Promise<PaidReconciliationResult> {
    return this.recordSuccessfulCoverage(input, 'ACTIVE');
  }

  public async enterRenewalRecovery(
    input: EnterPaidRecoveryInput
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      ...relationshipScope(input),
      failedRenewalIdentity: assertCommercialIdentifier(
        input.failedRenewalIdentity,
        'failedRenewalIdentity'
      )
    };
    return this.runWithRelationship(
      normalized,
      RENEWAL_FAILURE_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        if (relationship.lifecycleState === 'RECOVERY_GRACE') {
          if (
            relationship.lastReconciledEventId === event.eventId &&
            relationship.failedRenewalIdentity === normalized.failedRenewalIdentity
          ) {
            return duplicate(relationship);
          }
          throw new PaidRelationshipTransitionConflictError();
        }
        if (
          relationship.lifecycleState !== 'ACTIVE' ||
          relationship.renewalIntent !== 'ENABLED' ||
          relationship.currentPeriodStart === null ||
          relationship.currentPeriodEnd === null
        ) {
          throw new PaidRelationshipTransitionConflictError();
        }

        const graceStartedAt = assertCommercialTimestamp(
          event.effectiveAt,
          'graceStartedAt'
        );
        const graceUntil = exactGraceUntil(graceStartedAt);
        const updated = await this.transitionRelationship(
          relationship,
          normalized,
          event.eventId,
          nextRevision(),
          {
            lifecycleState: 'RECOVERY_GRACE',
            renewalIntent: 'ENABLED',
            currentPeriodStart: relationship.currentPeriodStart,
            currentPeriodEnd: relationship.currentPeriodEnd,
            graceStartedAt,
            graceUntil,
            failedRenewalIdentity: normalized.failedRenewalIdentity,
            endedAt: null,
            endReason: null
          }
        );
        return applied(updated);
      }
    );
  }

  public async recoverFromRenewalRecovery(
    input: PaidCoverageOperationInput
  ): Promise<PaidReconciliationResult> {
    return this.recordSuccessfulCoverage(input, 'RECOVERY_GRACE');
  }

  public async expireRenewalRecovery(
    input: PaidRelationshipOperationInput
  ): Promise<PaidReconciliationResult> {
    const normalized = { ...context(input), ...relationshipScope(input) };
    return this.runWithRelationship(
      normalized,
      GRACE_EXPIRY_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        if (relationship.lifecycleState === 'ENDED') {
          if (relationship.lastReconciledEventId === event.eventId) {
            return duplicate(relationship);
          }
          throw new PaidRelationshipTransitionConflictError();
        }
        if (
          relationship.lifecycleState !== 'RECOVERY_GRACE' ||
          relationship.graceUntil === null
        ) {
          throw new PaidRelationshipTransitionConflictError();
        }
        await assertGraceBoundary(
          this.executor,
          relationship.paidRelationshipId,
          false
        );
        const updated = await this.transitionRelationship(
          relationship,
          normalized,
          event.eventId,
          nextRevision(),
          {
            lifecycleState: 'ENDED',
            renewalIntent: 'DISABLED',
            currentPeriodStart: relationship.currentPeriodStart,
            currentPeriodEnd: relationship.currentPeriodEnd,
            graceStartedAt: null,
            graceUntil: null,
            failedRenewalIdentity: relationship.failedRenewalIdentity,
            endedAt: event.effectiveAt,
            endReason: 'GRACE_EXPIRED'
          }
        );
        return applied(updated);
      }
    );
  }

  public async endPaidRelationship(
    input: EndPaidRelationshipInput
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      ...relationshipScope(input),
      endReason: assertPaidRelationshipEndReason(input.endReason)
    };
    return this.runWithRelationship(
      normalized,
      RELATIONSHIP_END_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        if (relationship.lifecycleState === 'ENDED') {
          if (relationship.lastReconciledEventId === event.eventId) {
            return duplicate(relationship);
          }
          throw new PaidRelationshipTransitionConflictError();
        }
        if (
          relationship.lifecycleState !== 'ACTIVE' &&
          relationship.lifecycleState !== 'RECOVERY_GRACE'
        ) {
          throw new PaidRelationshipTransitionConflictError();
        }
        const updated = await this.transitionRelationship(
          relationship,
          normalized,
          event.eventId,
          nextRevision(),
          {
            lifecycleState: 'ENDED',
            renewalIntent: 'DISABLED',
            currentPeriodStart: relationship.currentPeriodStart,
            currentPeriodEnd: relationship.currentPeriodEnd,
            graceStartedAt: null,
            graceUntil: null,
            failedRenewalIdentity: relationship.failedRenewalIdentity,
            endedAt: event.effectiveAt,
            endReason: normalized.endReason
          }
        );
        return applied(updated);
      }
    );
  }

  public async endPaidCoverage(
    input: EndPaidCoverageOperationInput
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      ...relationshipScope(input),
      paidCoverageId: assertCommercialIdentifier(
        input.paidCoverageId,
        'paidCoverageId'
      ),
      effectiveCoverageEndAt: assertCommercialTimestamp(
        input.effectiveCoverageEndAt,
        'effectiveCoverageEndAt'
      )
    };
    return this.runWithEvent(
      normalized,
      COVERAGE_END_EVENTS,
      async ({ authority, event, nextRevision }) => {
        const relationship = await this.relationships.lockForUpdate(normalized);
        const coverage = await this.coverages.lockForUpdate(normalized);
        if (coverage.coverageState === 'ENDED') {
          return noOp(relationship, coverage);
        }
        if (coverage.coverageState === 'REVERSED') {
          throw new PaidCoverageConflictError();
        }

        const next = nextRevision();
        const endedCoverage = await this.coverages.end({
          ...normalized,
          expectedCoverageState: coverage.coverageState,
          endedAt: event.effectiveAt,
          effectiveCoverageEndAt: normalized.effectiveCoverageEndAt,
          sourceRevision: next,
          eventId: event.eventId
        });
        const updatedRelationship =
          relationship.lifecycleState === 'ACTIVE'
            ? await this.touchActiveRelationship(
                relationship,
                normalized,
                event.eventId,
                next
              )
            : relationship;
        return applied(updatedRelationship, endedCoverage);
      }
    );
  }

  public async applyRefund(
    input: ReversePaidCoverageInput
  ): Promise<PaidReconciliationResult> {
    return this.applyCoverageReversal(input, REFUND_EVENTS, 'REFUND');
  }

  public async applyChargeback(
    input: ReversePaidCoverageInput
  ): Promise<PaidReconciliationResult> {
    return this.applyCoverageReversal(input, CHARGEBACK_EVENTS, 'CHARGEBACK');
  }

  private async recordSuccessfulCoverage(
    input: PaidCoverageOperationInput,
    expectedState: 'PENDING_FIRST_PAYMENT' | 'ACTIVE' | 'RECOVERY_GRACE'
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      ...relationshipScope(input),
      paidCoverageId: assertCommercialIdentifier(
        input.paidCoverageId,
        'paidCoverageId'
      ),
      purchaseNamespace: assertCommercialNamespace(
        input.purchaseNamespace,
        'purchaseNamespace'
      ),
      purchaseIdentity: assertCommercialIdentifier(
        input.purchaseIdentity,
        'purchaseIdentity'
      ),
      billingInterval: assertPaidBillingInterval(input.billingInterval),
      coverageStartAt: assertCommercialTimestamp(
        input.coverageStartAt,
        'coverageStartAt'
      ),
      scheduledCoverageEndAt: assertCommercialTimestamp(
        input.scheduledCoverageEndAt,
        'scheduledCoverageEndAt'
      )
    };
    assertCoverageInterval(
      normalized.coverageStartAt,
      normalized.scheduledCoverageEndAt,
      normalized.scheduledCoverageEndAt
    );

    return this.runWithRelationship(
      normalized,
      expectedState === 'PENDING_FIRST_PAYMENT'
        ? FIRST_PURCHASE_SUCCESS_EVENTS
        : RENEWAL_SUCCESS_EVENTS,
      async ({ relationship, event, nextRevision }) => {
        const existing = await this.coverages.getByPurchaseIdentity(
          normalized.commercialAuthorityId,
          normalized.purchaseNamespace,
          normalized.purchaseIdentity
        );
        if (existing !== null) {
          if (coverageValuesEqual(existing, normalized, event.eventId)) {
            return duplicate(relationship, existing);
          }
          throw new PaidCoverageConflictError();
        }
        if (relationship.lifecycleState !== expectedState) {
          throw new PaidRelationshipTransitionConflictError();
        }
        if (
          expectedState !== 'PENDING_FIRST_PAYMENT' &&
          relationship.currentPeriodEnd !== null &&
          Date.parse(normalized.coverageStartAt) <
            Date.parse(relationship.currentPeriodEnd)
        ) {
          throw new PaidRelationshipTransitionConflictError();
        }
        const next = nextRevision();
        const coverage = await this.coverages.createAttributable({
          ...normalized,
          effectiveCoverageEndAt: normalized.scheduledCoverageEndAt,
          sourceRevision: next,
          successEventId: event.eventId
        });
        const updated = await this.transitionRelationship(
          relationship,
          normalized,
          event.eventId,
          next,
          {
            lifecycleState: 'ACTIVE',
            renewalIntent: relationship.renewalIntent,
            currentPeriodStart: coverage.coverageStartAt,
            currentPeriodEnd: coverage.scheduledCoverageEndAt,
            graceStartedAt: null,
            graceUntil: null,
            failedRenewalIdentity: null,
            endedAt: null,
            endReason: null
          }
        );
        return applied(updated, coverage);
      }
    );
  }

  private async applyCoverageReversal(
    input: ReversePaidCoverageInput,
    eventTypes: readonly CommercialEventType[],
    reversalReason: 'REFUND' | 'CHARGEBACK'
  ): Promise<PaidReconciliationResult> {
    const normalized = {
      ...context(input),
      ...relationshipScope(input),
      paidCoverageId: assertCommercialIdentifier(
        input.paidCoverageId,
        'paidCoverageId'
      ),
      purchaseNamespace: assertCommercialNamespace(
        input.purchaseNamespace,
        'purchaseNamespace'
      ),
      purchaseIdentity: assertCommercialIdentifier(
        input.purchaseIdentity,
        'purchaseIdentity'
      ),
      effectiveCoverageEndAt: assertCommercialTimestamp(
        input.effectiveCoverageEndAt,
        'effectiveCoverageEndAt'
      )
    };
    return this.runWithEvent(
      normalized,
      eventTypes,
      async ({ event, nextRevision }) => {
        const relationship = await this.relationships.lockForUpdate(normalized);
        const coverageById = await this.coverages.getById(
          normalized.paidCoverageId
        );
        if (
          coverageById !== null &&
          (coverageById.commercialAuthorityId !==
            normalized.commercialAuthorityId ||
            coverageById.paidRelationshipId !== normalized.paidRelationshipId ||
            coverageById.purchaseNamespace !== normalized.purchaseNamespace ||
            coverageById.purchaseIdentity !== normalized.purchaseIdentity)
        ) {
          throw new PaidCoverageConflictError();
        }

        const coverage =
          coverageById ??
          (await this.coverages.getByPurchaseIdentity(
            normalized.commercialAuthorityId,
            normalized.purchaseNamespace,
            normalized.purchaseIdentity
          ));
        if (
          coverage !== null &&
          coverage.paidCoverageId !== normalized.paidCoverageId
        ) {
          throw new PaidCoverageConflictError();
        }
        if (coverage === null) {
          const pending = await this.coverages.getPendingReversal(
            normalized.commercialAuthorityId,
            normalized.purchaseNamespace,
            normalized.purchaseIdentity
          );
          if (pending !== null) {
            if (
              pending.reversalEventId === event.eventId &&
              pending.paidCoverageId === normalized.paidCoverageId &&
              pending.paidRelationshipId === normalized.paidRelationshipId
            ) {
              return duplicate(relationship);
            }
            throw new PaidCoverageReversalConflictError();
          }

          const next = nextRevision();
          await this.coverages.recordPendingReversal({
            ...normalized,
            paidCoverageReversalId: event.eventId,
            reversalReason,
            sourceRevision: next
          });
          const updatedRelationship =
            relationship.lifecycleState === 'ACTIVE'
              ? await this.touchActiveRelationship(
                  relationship,
                  normalized,
                  event.eventId,
                  next
                )
              : relationship;
          return applied(updatedRelationship);
        }

        const lockedCoverage = await this.coverages.lockForUpdate({
          ...normalized,
          paidCoverageId: coverage.paidCoverageId
        });
        if (lockedCoverage.reversalEventId === event.eventId) {
          return duplicate(relationship, lockedCoverage);
        }
        if (lockedCoverage.reversalEventId !== null) {
          throw new PaidCoverageReversalConflictError();
        }
        const next = nextRevision();
        const reversedCoverage = await this.coverages.applyReversal({
          ...normalized,
          paidCoverageId: lockedCoverage.paidCoverageId,
          expectedCoverageState: lockedCoverage.coverageState,
          reversalEventId: event.eventId,
          reversedAt: event.effectiveAt,
          reversalReason,
          effectiveCoverageEndAt: normalized.effectiveCoverageEndAt,
          sourceRevision: next
        });
        const updatedRelationship =
          relationship.lifecycleState === 'ACTIVE'
            ? await this.touchActiveRelationship(
                relationship,
                normalized,
                event.eventId,
                next
              )
            : relationship;
        return applied(updatedRelationship, reversedCoverage);
      }
    );
  }

  private async touchActiveRelationship(
    relationship: PaidBillingRelationshipRecord,
    input: PaidRelationshipOperationInput,
    eventId: string,
    sourceRevision: string
  ): Promise<PaidBillingRelationshipRecord> {
    return this.transitionRelationship(
      relationship,
      input,
      eventId,
      sourceRevision,
      {
        lifecycleState: 'ACTIVE',
        renewalIntent: relationship.renewalIntent,
        currentPeriodStart: relationship.currentPeriodStart,
        currentPeriodEnd: relationship.currentPeriodEnd,
        graceStartedAt: null,
        graceUntil: null,
        failedRenewalIdentity: relationship.failedRenewalIdentity,
        endedAt: null,
        endReason: null
      }
    );
  }

  private async transitionRelationship(
    relationship: PaidBillingRelationshipRecord,
    input: PaidRelationshipOperationInput,
    eventId: string,
    sourceRevision: string,
    next: {
      readonly lifecycleState: PaidBillingRelationshipRecord['lifecycleState'];
      readonly renewalIntent: PaidBillingRelationshipRecord['renewalIntent'];
      readonly currentPeriodStart: string | null;
      readonly currentPeriodEnd: string | null;
      readonly graceStartedAt: string | null;
      readonly graceUntil: string | null;
      readonly failedRenewalIdentity: string | null;
      readonly endedAt: string | null;
      readonly endReason: PaidRelationshipEndReason | null;
    }
  ): Promise<PaidBillingRelationshipRecord> {
    return this.relationships.transition({
      ...relationshipScope(input),
      expectedLifecycleState: relationship.lifecycleState,
      expectedRenewalIntent: relationship.renewalIntent,
      nextLifecycleState: next.lifecycleState,
      nextRenewalIntent: next.renewalIntent,
      currentPeriodStart: next.currentPeriodStart,
      currentPeriodEnd: next.currentPeriodEnd,
      graceStartedAt: next.graceStartedAt,
      graceUntil: next.graceUntil,
      failedRenewalIdentity: next.failedRenewalIdentity,
      endedAt: next.endedAt,
      endReason: next.endReason,
      lastReconciledEventId: eventId,
      sourceRevision
    });
  }

  private async runWithRelationship<T extends PaidRelationshipOperationInput>(
    input: T,
    eventTypes: readonly CommercialEventType[],
    mutate: (context: RelationshipMutationContext) => Promise<PaidMutationDraft>
  ): Promise<PaidReconciliationResult> {
    return this.runWithEvent(input, eventTypes, async (base) => {
      const relationship = await this.relationships.lockForUpdate(input);
      return mutate({ ...base, relationship });
    });
  }

  private async runWithEvent(
    input: PaidReconciliationContext,
    eventTypes: readonly CommercialEventType[],
    mutate: (context: PaidMutationContext) => Promise<PaidMutationDraft>
  ): Promise<PaidReconciliationResult> {
    const normalized = context(input);
    const authority = await this.authorities.lockForUpdate(normalized.ownerId);
    if (authority.commercialAuthorityId !== normalized.commercialAuthorityId) {
      throw new CommercialAuthorityUnavailableError();
    }
    const event = await requirePaidCommercialEvent(
      this.executor,
      normalized.eventId,
      normalized.commercialAuthorityId,
      eventTypes
    );
    let nextRevision: string | undefined;
    const draft = await mutate({
      authority,
      event,
      nextRevision: () => {
        nextRevision ??= incrementRevision(authority.entitlementRevision);
        return nextRevision;
      }
    });
    if (!draft.changed) {
      return Object.freeze({
        outcome: draft.outcome,
        authority,
        relationship: draft.relationship,
        coverage: draft.coverage
      });
    }
    if (nextRevision === undefined) {
      throw new CommercialPersistenceIntegrityError();
    }
    const advanced = await this.authorities.advanceRevisionAfterLock({
      commercialAuthorityId: authority.commercialAuthorityId,
      ownerId: authority.ownerId,
      expectedRevision: authority.entitlementRevision
    });
    if (advanced.entitlementRevision !== nextRevision) {
      throw new CommercialPersistenceIntegrityError();
    }
    return Object.freeze({
      outcome: draft.outcome,
      authority: advanced,
      relationship: draft.relationship,
      coverage: draft.coverage
    });
  }
}
