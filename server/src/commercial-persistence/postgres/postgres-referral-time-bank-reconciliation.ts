import { randomUUID } from 'node:crypto';

import type { SqlExecutor } from '../../db/index.js';
import {
  COMMERCIAL_EVENT_SCHEMA_VERSION,
  assertCommercialIdentifier,
  digestCanonicalCommercialOperation,
  type CommercialEventType
} from '../commercial-domain.js';
import { CommercialPersistenceIntegrityError } from '../commercial-persistence-errors.js';
import {
  settleReferralTimeBank,
  type ReferralConsumptionSegmentPlan,
  type ReferralRewardSettlement,
  type ReferralTimeBankSourceSnapshot
} from '../referral-time-bank-domain.js';
import { assertReferralTimestamp } from '../referral-domain.js';
import type {
  CommercialAuthorityRecord,
  CommercialAuthorityRepository,
  CommercialEventRepository,
  CommercialTimestampInput,
  ReferralTimeBankReconciliationService,
  ReferralRewardRecord
} from '../repositories.js';
import { incrementRevision } from './postgres-paid-persistence-shared.js';
import {
  PostgresReferralTimeBankRepository,
  type LoadedReferralTimeBankReward,
  type StoredReferralConsumptionSegment
} from './postgres-referral-time-bank-repository.js';

const EVENT_NAMESPACE = 'commercial.referral.time-bank.v1';
const IDEMPOTENCY_NAMESPACE = 'commercial.referral.time-bank.v1';
const ACTOR_REFERENCE = 'commercial.referral-time-bank';

export interface ReferralTimeBankRevocation {
  readonly referralRewardId: string;
  readonly revokedAt: CommercialTimestampInput;
  readonly revocationReason: string;
  readonly reversalEventId: string;
}

export interface ReconcileReferralTimeBankAfterLockInput {
  readonly ownerId: string;
  readonly authority: CommercialAuthorityRecord;
  readonly asOf: CommercialTimestampInput;
  readonly revocation?: ReferralTimeBankRevocation;
}

export interface ReconcileReferralTimeBankResult {
  readonly outcome: 'APPLIED' | 'NO_OP';
  readonly authority: CommercialAuthorityRecord;
  readonly rewards: readonly ReferralRewardRecord[];
  readonly source: ReferralTimeBankSourceSnapshot;
}

function sameReward(
  current: LoadedReferralTimeBankReward,
  planned: ReferralRewardSettlement
): boolean {
  const record = current.record;
  return (
    record.state === planned.state &&
    record.appliedAt === planned.appliedAt &&
    record.appliedDurationUs === planned.appliedDurationUs &&
    record.consumedDurationUs === planned.consumedDurationUs &&
    record.revokedDurationUs === planned.revokedDurationUs &&
    record.activeConsumptionStartedAt === planned.activeConsumptionStartedAt
  );
}

function sameSegments(
  current: readonly StoredReferralConsumptionSegment[],
  planned: readonly ReferralConsumptionSegmentPlan[]
): boolean {
  return (
    current.length === planned.length &&
    current.every((segment, index) => {
      const candidate = planned[index];
      return (
        candidate !== undefined &&
        segment.referralConsumptionSegmentId ===
          candidate.referralConsumptionSegmentId &&
        segment.referralRewardId === candidate.referralRewardId &&
        segment.consumedFrom === candidate.consumedFrom &&
        segment.consumedUntil === candidate.consumedUntil &&
        segment.consumedDurationUs === candidate.consumedDurationUs
      );
    })
  );
}

function existingSegmentsArePrefix(
  existing: readonly StoredReferralConsumptionSegment[],
  planned: readonly ReferralConsumptionSegmentPlan[]
): boolean {
  return (
    existing.length <= planned.length &&
    existing.every((segment, index) => {
      const candidate = planned[index];
      return (
        candidate !== undefined &&
        segment.referralConsumptionSegmentId ===
          candidate.referralConsumptionSegmentId &&
        segment.referralRewardId === candidate.referralRewardId &&
        segment.consumedFrom === candidate.consumedFrom &&
        segment.consumedUntil === candidate.consumedUntil &&
        segment.consumedDurationUs === candidate.consumedDurationUs
      );
    })
  );
}

function withSourceRevision(
  source: ReferralTimeBankSourceSnapshot,
  sourceRevision: string
): ReferralTimeBankSourceSnapshot {
  return Object.freeze({ ...source, sourceRevision });
}

export class PostgresReferralTimeBankReconciliation
  implements ReferralTimeBankReconciliationService
{
  public constructor(
    private readonly executor: SqlExecutor,
    private readonly authorities: CommercialAuthorityRepository,
    private readonly events: CommercialEventRepository,
    private readonly timeBank: PostgresReferralTimeBankRepository =
      new PostgresReferralTimeBankRepository(executor)
  ) {}

  /**
   * Reconciles after the live user root and CommercialAuthority are already
   * locked by the caller. All reads and writes use this instance's executor.
   */
  public async reconcileAfterAuthorityLock(
    input: ReconcileReferralTimeBankAfterLockInput
  ): Promise<ReconcileReferralTimeBankResult> {
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
    const commercialAuthorityId = assertCommercialIdentifier(
      input.authority.commercialAuthorityId,
      'commercialAuthorityId'
    );
    if (input.authority.ownerId !== ownerId) {
      throw new CommercialPersistenceIntegrityError();
    }
    const asOf = assertReferralTimestamp(input.asOf, 'asOf');
    const revocation =
      input.revocation === undefined
        ? null
        : Object.freeze({
            referralRewardId: assertCommercialIdentifier(
              input.revocation.referralRewardId,
              'referralRewardId'
            ),
            revokedAt: assertReferralTimestamp(
              input.revocation.revokedAt,
              'revokedAt'
            ),
            revocationReason: assertCommercialIdentifier(
              input.revocation.revocationReason,
              'revocationReason'
            ),
            reversalEventId: assertCommercialIdentifier(
              input.revocation.reversalEventId,
              'reversalEventId'
            )
          });

    // Authority serialization makes these source reads stable; source-row
    // order remains Paid before Referral before derived accounting rows.
    const paidBlockingIntervals =
      await this.timeBank.listPaidBlockingIntervals(commercialAuthorityId);
    const loadedRewards = await this.timeBank.lockRewards(
      ownerId,
      commercialAuthorityId
    );
    const existingSegments = await this.timeBank.lockSegments(
      commercialAuthorityId
    );
    if (
      revocation !== null &&
      !loadedRewards.some(
        (reward) => reward.record.referralRewardId === revocation.referralRewardId
      )
    ) {
      throw new CommercialPersistenceIntegrityError();
    }

    const settlement = settleReferralTimeBank({
      commercialAuthorityId,
      sourceRevision: input.authority.entitlementRevision,
      asOf,
      paidBlockingIntervals,
      rewards: loadedRewards.map((reward) =>
        revocation?.referralRewardId === reward.record.referralRewardId
          ? Object.freeze({
              ...reward.input,
              state: 'REVOKED' as const,
              revokedAt: revocation.revokedAt,
              activeConsumptionStartedAt: null
            })
          : reward.input
      )
    });

    const changedRewards = settlement.rewards.filter((planned) => {
      const current = loadedRewards.find(
        (reward) => reward.record.referralRewardId === planned.referralRewardId
      );
      return current === undefined || !sameReward(current, planned);
    });
    const segmentsChanged = !sameSegments(
      existingSegments,
      settlement.segments
    );
    if (changedRewards.length === 0 && !segmentsChanged) {
      return Object.freeze({
        outcome: 'NO_OP' as const,
        authority: input.authority,
        rewards: Object.freeze(loadedRewards.map((reward) => reward.record)),
        source: settlement.source
      });
    }

    const nextRevision = incrementRevision(input.authority.entitlementRevision);
    const applicationEventIds = new Map<string, string>();

    for (const planned of changedRewards) {
      const current = loadedRewards.find(
        (reward) => reward.record.referralRewardId === planned.referralRewardId
      );
      if (
        current !== undefined &&
        current.record.state === 'EARNED' &&
        planned.state === 'APPLIED'
      ) {
        if (planned.appliedAt === null) {
          throw new CommercialPersistenceIntegrityError();
        }
        const event = await this.appendEvent({
          ownerId,
          commercialAuthorityId,
          eventType: 'REFERRAL_REWARD_APPLIED',
          sourceEntityId: planned.referralRewardId,
          idempotencyKey: `apply:${planned.referralRewardId}`,
          effectiveAt: planned.appliedAt,
          attributes: {
            referral_reward_id: planned.referralRewardId,
            applied_duration_us: planned.appliedDurationUs
          }
        });
        applicationEventIds.set(planned.referralRewardId, event.eventId);
      }

      if (
        planned.activeConsumptionStartedAt !== null &&
        current?.record.activeConsumptionStartedAt !==
          planned.activeConsumptionStartedAt
      ) {
        await this.appendEvent({
          ownerId,
          commercialAuthorityId,
          eventType: 'REFERRAL_REWARD_CONSUMPTION_STARTED',
          sourceEntityId: planned.referralRewardId,
          idempotencyKey: `start:${planned.referralRewardId}:${planned.activeConsumptionStartedAt}`,
          effectiveAt: planned.activeConsumptionStartedAt,
          attributes: {
            referral_reward_id: planned.referralRewardId
          }
        });
      }

      if (
        current !== undefined &&
        BigInt(current.record.consumedDurationUs) <
          BigInt(current.record.earnedDurationUs) &&
        planned.consumedDurationUs === current.record.earnedDurationUs
      ) {
        const finalSegment = [...settlement.segments]
          .reverse()
          .find((segment) => segment.referralRewardId === planned.referralRewardId);
        if (finalSegment === undefined) {
          throw new CommercialPersistenceIntegrityError();
        }
        await this.appendEvent({
          ownerId,
          commercialAuthorityId,
          eventType: 'REFERRAL_REWARD_EXHAUSTED',
          sourceEntityId: planned.referralRewardId,
          idempotencyKey: `exhaust:${planned.referralRewardId}:${finalSegment.consumedUntil}`,
          effectiveAt: finalSegment.consumedUntil,
          attributes: {
            referral_reward_id: planned.referralRewardId,
            consumed_duration_us: planned.consumedDurationUs
          }
        });
      }
    }

    if (
      segmentsChanged &&
      existingSegments.length > 0 &&
      !existingSegmentsArePrefix(existingSegments, settlement.segments)
    ) {
      await this.appendEvent({
        ownerId,
        commercialAuthorityId,
        eventType: 'COMMERCIAL_CORRECTION_RECORDED',
        sourceEntityId: commercialAuthorityId,
        idempotencyKey: `replay:${commercialAuthorityId}:${input.authority.entitlementRevision}:${asOf}`,
        effectiveAt: asOf,
        attributes: {
          correction_class: 'PAID_PRECEDENCE_REPLAY',
          previous_segment_count: existingSegments.length,
          next_segment_count: settlement.segments.length
        }
      });
    }

    const updatedById = new Map<string, ReferralRewardRecord>();
    for (const planned of changedRewards) {
      const updated = await this.timeBank.updateReward(
        commercialAuthorityId,
        planned,
        applicationEventIds.get(planned.referralRewardId) ?? null,
        nextRevision,
        revocation?.referralRewardId === planned.referralRewardId
          ? revocation
          : null
      );
      updatedById.set(updated.referralRewardId, updated);
    }
    if (segmentsChanged) {
      await this.timeBank.replaceSegments(
        commercialAuthorityId,
        settlement.segments,
        nextRevision
      );
    }

    const authority = await this.authorities.advanceRevisionAfterLock({
      commercialAuthorityId,
      ownerId,
      expectedRevision: input.authority.entitlementRevision
    });
    if (authority.entitlementRevision !== nextRevision) {
      throw new CommercialPersistenceIntegrityError();
    }

    return Object.freeze({
      outcome: 'APPLIED' as const,
      authority,
      rewards: Object.freeze(
        loadedRewards.map(
          (reward) =>
            updatedById.get(reward.record.referralRewardId) ?? reward.record
        )
      ),
      source: withSourceRevision(settlement.source, nextRevision)
    });
  }

  private async appendEvent(input: {
    readonly ownerId: string;
    readonly commercialAuthorityId: string;
    readonly eventType: CommercialEventType;
    readonly sourceEntityId: string;
    readonly idempotencyKey: string;
    readonly effectiveAt: string;
    readonly attributes: Readonly<Record<string, string | number>>;
  }) {
    const operationDigest = digestCanonicalCommercialOperation({
      event_type: input.eventType,
      source_entity_id: input.sourceEntityId,
      effective_at: input.effectiveAt,
      attributes: input.attributes
    });
    const result = await this.events.appendIdempotent({
      eventId: randomUUID(),
      ownerId: input.ownerId,
      commercialAuthorityId: input.commercialAuthorityId,
      eventType: input.eventType,
      sourceType: 'REFERRAL',
      sourceEntityId: input.sourceEntityId,
      sourceNamespace: EVENT_NAMESPACE,
      providerNamespace: null,
      providerContext: null,
      providerEventId: null,
      providerReceiptId: null,
      idempotencyNamespace: IDEMPOTENCY_NAMESPACE,
      idempotencyKey: input.idempotencyKey,
      operationDigest,
      occurredAt: input.effectiveAt,
      effectiveAt: input.effectiveAt,
      causedByEventId: null,
      correctsEventId: null,
      reversesEventId: null,
      attributes: input.attributes,
      attributesVersion: 1,
      schemaVersion: COMMERCIAL_EVENT_SCHEMA_VERSION,
      actorClass: 'SYSTEM',
      actorReference: ACTOR_REFERENCE
    });
    return result.event;
  }
}
