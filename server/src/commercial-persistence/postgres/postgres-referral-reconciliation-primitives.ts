import { randomUUID } from 'node:crypto';
import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  digestCanonicalCommercialOperation,
  type CommercialEventType
} from '../commercial-domain.js';
import {
  CommercialAuthorityUnavailableError,
  CommercialPersistenceIntegrityError,
  ReferralAttributionConflictError,
  ReferralAttributionNotFoundError,
  ReferralNotEligibleError,
  ReferralRewardConflictError,
  ReferralRewardNotFoundError,
  ReferralRewardNotRevocableError,
  ReferralSelfReferralError
} from '../commercial-persistence-errors.js';
import {
  REFERRAL_REWARD_CAP,
  getReferralGiveOfferEligibility,
  type ReferralGiveOfferEligibility
} from '../referral-domain.js';
import type {
  CommercialAuthorityRecord,
  CommercialEventRepository,
  EstablishReferralAttributionResult,
  GetReferralGiveOfferEligibilityInput,
  MatureEligibleReferralRewardsInput,
  MatureEligibleReferralRewardsResult,
  QualifyReferralFirstPurchaseInput,
  QualifyReferralFirstPurchaseResult,
  ReferralAttributionRecord,
  ReferralAttributionRepository,
  ReferralPublicIdentityRepository,
  ReferralReconciliationService,
  ReferralRewardRecord,
  ReferralRewardRepository,
  RevokeReferralRewardForPaidReversalInput,
  RevokeReferralRewardResult
} from '../repositories.js';
import { PostgresCommercialAuthorityRepository } from './postgres-commercial-authority-repository.js';
import { PostgresCommercialEventRepository } from './postgres-commercial-event-repository.js';
import { PostgresReferralAttributionRepository } from './postgres-referral-attribution-repository.js';
import { PostgresReferralPublicIdentityRepository } from './postgres-referral-public-identity-repository.js';
import { PostgresReferralRewardRepository } from './postgres-referral-reward-repository.js';
import { incrementRevision } from './postgres-paid-persistence-shared.js';
import {
  databaseNow,
  findAuthorityOwner,
  hasOtherSuccessfulFirstPurchase,
  hasSuccessfulFirstPurchase,
  lockReferralOwners,
  lockReferralPaidCoverages,
  requirePaidPurchaseSuccessEvent,
  requirePaidReversalEvent,
  type LockedReferralOwner
} from './postgres-referral-locking.js';

const REFERRAL_EVENT_SOURCE_NAMESPACE = 'referral.v1';
const REFERRAL_EVENT_IDEMPOTENCY_NAMESPACE = 'commercial.referral.v1';
const REFERRAL_ACTOR_REFERENCE = 'referral-reconciliation';
const DEFAULT_MATURATION_BATCH_SIZE = 32;

interface ReferralEventDraft {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
  readonly eventType: CommercialEventType;
  readonly sourceEntityId: string;
  readonly idempotencyKey: string;
  readonly effectiveAt: string;
  readonly occurredAt: string | null;
  readonly causedByEventId: string | null;
  readonly attributes: Record<string, unknown>;
}

function ownerAuthority(
  lockedOwners: readonly LockedReferralOwner[],
  ownerId: string
): CommercialAuthorityRecord {
  const owner = lockedOwners.find((candidate) => candidate.ownerId === ownerId);
  if (owner === undefined) {
    throw new CommercialPersistenceIntegrityError();
  }
  return owner.authority;
}

function sameAttributionLinkage(
  attribution: ReferralAttributionRecord,
  input: {
    readonly referralAttributionId: string;
    readonly referralPublicIdentityId: string;
    readonly referrerAuthorityId: string;
  }
): boolean {
  return (
    attribution.referralAttributionId === input.referralAttributionId &&
    attribution.referralPublicIdentityId === input.referralPublicIdentityId &&
    attribution.referrerAuthorityId === input.referrerAuthorityId
  );
}

function sortRewards(
  rewards: readonly ReferralRewardRecord[]
): readonly ReferralRewardRecord[] {
  return [...rewards].sort((left, right) => {
    const maturity = Date.parse(left.maturesAt) - Date.parse(right.maturesAt);
    return maturity !== 0
      ? maturity
      : left.referralRewardId < right.referralRewardId
        ? -1
        : left.referralRewardId > right.referralRewardId
          ? 1
          : 0;
  });
}

function assertOwnerMatch(actual: string | null, expected: string): void {
  if (actual === null || actual !== expected) {
    throw new CommercialAuthorityUnavailableError();
  }
}

/**
 * D4A Referral orchestration. The executor is caller-owned: this class never
 * starts, commits, or rolls back a transaction and never contacts a provider.
 */
export class PostgresReferralReconciliationPrimitives
  implements ReferralReconciliationService
{
  public constructor(
    private readonly executor: SqlExecutor,
    private readonly authorities: PostgresCommercialAuthorityRepository =
      new PostgresCommercialAuthorityRepository(executor),
    private readonly events: CommercialEventRepository =
      new PostgresCommercialEventRepository(executor),
    private readonly identities: PostgresReferralPublicIdentityRepository =
      new PostgresReferralPublicIdentityRepository(executor),
    private readonly attributions: PostgresReferralAttributionRepository =
      new PostgresReferralAttributionRepository(executor),
    private readonly rewards: PostgresReferralRewardRepository =
      new PostgresReferralRewardRepository(executor)
  ) {}

  public async establishAttribution(input: {
    readonly referrerOwnerId: string;
    readonly referredOwnerId: string;
    readonly referralAttributionId: string;
    readonly referralPublicIdentityId: string;
    readonly campaignReference?: string | null;
  }): Promise<EstablishReferralAttributionResult> {
    const referrerOwnerId = assertCommercialIdentifier(
      input.referrerOwnerId,
      'referrerOwnerId'
    );
    const referredOwnerId = assertCommercialIdentifier(
      input.referredOwnerId,
      'referredOwnerId'
    );
    const referralAttributionId = assertCommercialIdentifier(
      input.referralAttributionId,
      'referralAttributionId'
    );
    const referralPublicIdentityId = assertCommercialIdentifier(
      input.referralPublicIdentityId,
      'referralPublicIdentityId'
    );
    if (referrerOwnerId === referredOwnerId) {
      throw new ReferralSelfReferralError();
    }

    const lockedOwners = await lockReferralOwners(this.executor, [
      referrerOwnerId,
      referredOwnerId
    ]);
    const referrerAuthority = ownerAuthority(lockedOwners, referrerOwnerId);
    const referredAuthority = ownerAuthority(lockedOwners, referredOwnerId);
    if (
      referrerAuthority.commercialAuthorityId ===
      referredAuthority.commercialAuthorityId
    ) {
      throw new ReferralSelfReferralError();
    }

    const identity = await this.identities.getById(referralPublicIdentityId);
    if (
      identity === null ||
      identity.status !== 'ACTIVE' ||
      identity.commercialAuthorityId !== referrerAuthority.commercialAuthorityId
    ) {
      throw new ReferralAttributionConflictError();
    }

    const existing = await this.attributions.lockByReferredAuthority(
      referredAuthority.commercialAuthorityId
    );
    if (existing !== null) {
      if (
        existing.state !== 'INVALIDATED' &&
        sameAttributionLinkage(existing, {
          referralAttributionId,
          referralPublicIdentityId,
          referrerAuthorityId: referrerAuthority.commercialAuthorityId
        })
      ) {
        return Object.freeze({
          outcome: 'DUPLICATE',
          referrerAuthority,
          referredAuthority,
          attribution: existing
        });
      }
      throw new ReferralAttributionConflictError();
    }

    if (await hasSuccessfulFirstPurchase(this.executor, referredAuthority.commercialAuthorityId)) {
      throw new ReferralNotEligibleError();
    }

    const attributedAt = await databaseNow(this.executor);
    const event = await this.appendReferralEvent({
      ownerId: referredOwnerId,
      commercialAuthorityId: referredAuthority.commercialAuthorityId,
      eventType: 'REFERRAL_ATTRIBUTION_RECORDED',
      sourceEntityId: referralAttributionId,
      idempotencyKey: `referral.attribution.record.v1:${referralAttributionId}`,
      effectiveAt: attributedAt,
      occurredAt: attributedAt,
      causedByEventId: null,
      attributes: {
        referral_attribution_id: referralAttributionId,
        referral_public_identity_id: referralPublicIdentityId
      }
    });
    const attribution = await this.attributions.establish({
      referrerOwnerId,
      referredOwnerId,
      referralAttributionId,
      referralPublicIdentityId,
      referrerAuthorityId: referrerAuthority.commercialAuthorityId,
      referredAuthorityId: referredAuthority.commercialAuthorityId,
      attributedAt,
      campaignReference: input.campaignReference ?? null,
      lastEventId: event.eventId,
      sourceRevision: referredAuthority.entitlementRevision
    });
    return Object.freeze({
      outcome: 'APPLIED',
      referrerAuthority,
      referredAuthority,
      attribution
    });
  }

  public async getGiveOfferEligibility(
    input: GetReferralGiveOfferEligibilityInput
  ): Promise<ReferralGiveOfferEligibility> {
    const referredOwnerId = assertCommercialIdentifier(
      input.referredOwnerId,
      'referredOwnerId'
    );
    const authority = await this.authorities.getByOwnerId(referredOwnerId);
    if (authority === null) {
      throw new CommercialAuthorityUnavailableError();
    }
    const attribution = await this.attributions.getByReferredAuthority(
      authority.commercialAuthorityId
    );
    const hasPurchase = await hasSuccessfulFirstPurchase(
      this.executor,
      authority.commercialAuthorityId
    );
    return getReferralGiveOfferEligibility({
      attributionState: attribution?.state ?? null,
      qualifyingPaidCoverageId: attribution?.qualifyingPaidCoverageId ?? null,
      hasSuccessfulFirstPurchase: hasPurchase,
      billingInterval: input.billingInterval
    });
  }

  public async qualifyFirstPurchase(
    input: QualifyReferralFirstPurchaseInput
  ): Promise<QualifyReferralFirstPurchaseResult> {
    const referrerOwnerId = assertCommercialIdentifier(
      input.referrerOwnerId,
      'referrerOwnerId'
    );
    const referredOwnerId = assertCommercialIdentifier(
      input.referredOwnerId,
      'referredOwnerId'
    );
    const referralAttributionId = assertCommercialIdentifier(
      input.referralAttributionId,
      'referralAttributionId'
    );
    const qualifyingPaidCoverageId = assertCommercialIdentifier(
      input.qualifyingPaidCoverageId,
      'qualifyingPaidCoverageId'
    );
    if (referrerOwnerId === referredOwnerId) {
      throw new ReferralSelfReferralError();
    }

    const preflightAttribution = await this.attributions.getById(
      referralAttributionId
    );
    if (preflightAttribution === null) {
      throw new ReferralAttributionNotFoundError();
    }
    const resolvedReferrerOwnerId = await findAuthorityOwner(
      this.executor,
      preflightAttribution.referrerAuthorityId
    );
    const resolvedReferredOwnerId = await findAuthorityOwner(
      this.executor,
      preflightAttribution.referredAuthorityId
    );
    assertOwnerMatch(resolvedReferrerOwnerId, referrerOwnerId);
    assertOwnerMatch(resolvedReferredOwnerId, referredOwnerId);

    const lockedOwners = await lockReferralOwners(this.executor, [
      referrerOwnerId,
      referredOwnerId
    ]);
    const referrerAuthority = ownerAuthority(lockedOwners, referrerOwnerId);
    const referredAuthority = ownerAuthority(lockedOwners, referredOwnerId);
    if (
      referrerAuthority.commercialAuthorityId !==
        preflightAttribution.referrerAuthorityId ||
      referredAuthority.commercialAuthorityId !==
        preflightAttribution.referredAuthorityId
    ) {
      throw new ReferralAttributionConflictError();
    }

    // Fixed source-row order starts with PaidCoverage, then Attribution, then
    // ReferralReward. The qualifying coverage is locked before any mutation.
    const coverages = await lockReferralPaidCoverages(this.executor, [
      qualifyingPaidCoverageId
    ]);
    const coverage = coverages[0];
    if (
      coverage === undefined ||
      coverage.commercialAuthorityId !== referredAuthority.commercialAuthorityId
    ) {
      throw new ReferralNotEligibleError();
    }
    const purchaseEvent = await requirePaidPurchaseSuccessEvent(
      this.executor,
      coverage.successEventId,
      referredAuthority.commercialAuthorityId
    );
    if (coverage.coverageState === 'REVERSED') {
      throw new ReferralNotEligibleError();
    }

    const attribution = await this.attributions.lockForUpdate(
      referralAttributionId
    );
    if (attribution === null) {
      throw new ReferralAttributionNotFoundError();
    }
    if (
      attribution.referrerAuthorityId !== referrerAuthority.commercialAuthorityId ||
      attribution.referredAuthorityId !== referredAuthority.commercialAuthorityId
    ) {
      throw new ReferralAttributionConflictError();
    }

    const existingAttributionForCoverage =
      await this.attributions.getByQualifyingPaidCoverage(
        qualifyingPaidCoverageId
      );
    if (
      existingAttributionForCoverage !== null &&
      existingAttributionForCoverage.referralAttributionId !==
        referralAttributionId
    ) {
      throw new ReferralAttributionConflictError();
    }

    const existingReward = await this.rewards.getByAttribution(
      referralAttributionId
    );
    if (attribution.state === 'LOCKED') {
      if (
        attribution.qualifyingPaidCoverageId !== qualifyingPaidCoverageId
      ) {
        throw new ReferralAttributionConflictError();
      }
      if (existingReward !== null) {
        const lockedReward = await this.rewards.lockForUpdate(
          existingReward.referralRewardId,
          referrerAuthority.commercialAuthorityId
        );
        if (lockedReward === null) {
          throw new ReferralRewardNotFoundError();
        }
        return Object.freeze({
          outcome: 'DUPLICATE',
          referrerAuthority,
          referredAuthority,
          attribution,
          reward: lockedReward
        });
      }
      const capEvent = await this.events.getByIdempotencyIdentity(
        REFERRAL_EVENT_IDEMPOTENCY_NAMESPACE,
        `referral.reward.cap.v1:${referralAttributionId}:${qualifyingPaidCoverageId}`
      );
      if (
        capEvent !== null &&
        capEvent.commercialAuthorityId === referrerAuthority.commercialAuthorityId &&
        capEvent.eventType === 'REFERRAL_REWARD_CAP_REJECTED'
      ) {
        return Object.freeze({
          outcome: 'CAP_REJECTED',
          referrerAuthority,
          referredAuthority,
          attribution,
          reward: null
        });
      }
      throw new CommercialPersistenceIntegrityError();
    }
    if (attribution.state !== 'ATTRIBUTED') {
      throw new ReferralNotEligibleError();
    }
    if (attribution.qualifyingPaidCoverageId !== null) {
      throw new ReferralAttributionConflictError();
    }
    if (existingReward !== null) {
      throw new ReferralRewardConflictError();
    }
    if (Date.parse(attribution.attributedAt) > Date.parse(purchaseEvent.effectiveAt)) {
      throw new ReferralNotEligibleError();
    }
    if (
      await hasOtherSuccessfulFirstPurchase(
        this.executor,
        referredAuthority.commercialAuthorityId,
        qualifyingPaidCoverageId
      )
    ) {
      throw new ReferralNotEligibleError();
    }

    const capRows = await this.rewards.lockCapWindow(
      referrerAuthority.commercialAuthorityId,
      purchaseEvent.effectiveAt
    );
    const lockedAt = await databaseNow(this.executor);
    const referredNextRevision = incrementRevision(
      referredAuthority.entitlementRevision
    );
    const attributionLockEvent = await this.appendReferralEvent({
      ownerId: referredOwnerId,
      commercialAuthorityId: referredAuthority.commercialAuthorityId,
      eventType: 'REFERRAL_ATTRIBUTION_LOCKED',
      sourceEntityId: referralAttributionId,
      idempotencyKey: `referral.attribution.lock.v1:${referralAttributionId}:${qualifyingPaidCoverageId}`,
      effectiveAt: purchaseEvent.effectiveAt,
      occurredAt: lockedAt,
      causedByEventId: purchaseEvent.eventId,
      attributes: {
        referral_attribution_id: referralAttributionId,
        qualifying_paid_coverage_id: qualifyingPaidCoverageId
      }
    });
    const lockedAttribution = await this.attributions.attachQualifyingPurchase({
      referredOwnerId,
      referredAuthorityId: referredAuthority.commercialAuthorityId,
      referralAttributionId,
      qualifyingPaidCoverageId,
      lockedAt,
      lastEventId: attributionLockEvent.eventId,
      sourceRevision: referredNextRevision
    });

    if (capRows.length >= REFERRAL_REWARD_CAP) {
      await this.appendReferralEvent({
        ownerId: referrerOwnerId,
        commercialAuthorityId: referrerAuthority.commercialAuthorityId,
        eventType: 'REFERRAL_REWARD_CAP_REJECTED',
        sourceEntityId: referralAttributionId,
        idempotencyKey: `referral.reward.cap.v1:${referralAttributionId}:${qualifyingPaidCoverageId}`,
        effectiveAt: purchaseEvent.effectiveAt,
        occurredAt: lockedAt,
        causedByEventId: purchaseEvent.eventId,
        attributes: {
          decision: 'CAP_REJECTED',
          referral_attribution_id: referralAttributionId,
          qualifying_paid_coverage_id: qualifyingPaidCoverageId
        }
      });
      const advancedReferredAuthority = await this.advanceAuthority(
        referredOwnerId,
        referredAuthority,
        referredNextRevision
      );
      return Object.freeze({
        outcome: 'CAP_REJECTED',
        referrerAuthority,
        referredAuthority: advancedReferredAuthority,
        attribution: lockedAttribution,
        reward: null
      });
    }

    const referralRewardId = randomUUID();
    const pendingEvent = await this.appendReferralEvent({
      ownerId: referrerOwnerId,
      commercialAuthorityId: referrerAuthority.commercialAuthorityId,
      eventType: 'REFERRAL_REWARD_PENDING',
      sourceEntityId: referralRewardId,
      idempotencyKey: `referral.reward.pending.v1:${referralAttributionId}:${qualifyingPaidCoverageId}`,
      effectiveAt: purchaseEvent.effectiveAt,
      occurredAt: lockedAt,
      causedByEventId: purchaseEvent.eventId,
      attributes: {
        referral_reward_id: referralRewardId,
        referral_attribution_id: referralAttributionId,
        qualifying_paid_coverage_id: qualifyingPaidCoverageId
      }
    });
    const referrerNextRevision = incrementRevision(
      referrerAuthority.entitlementRevision
    );
    const reward = await this.rewards.createPending({
      referrerOwnerId,
      referrerAuthorityId: referrerAuthority.commercialAuthorityId,
      referralRewardId,
      referralAttributionId,
      qualifyingPaidCoverageId,
      qualifyingPaymentAt: purchaseEvent.effectiveAt,
      pendingEventId: pendingEvent.eventId,
      sourceRevision: referrerNextRevision
    });
    const advancedReferredAuthority = await this.advanceAuthority(
      referredOwnerId,
      referredAuthority,
      referredNextRevision
    );
    const advancedReferrerAuthority = await this.advanceAuthority(
      referrerOwnerId,
      referrerAuthority,
      referrerNextRevision
    );
    return Object.freeze({
      outcome: 'APPLIED',
      referrerAuthority: advancedReferrerAuthority,
      referredAuthority: advancedReferredAuthority,
      attribution: lockedAttribution,
      reward
    });
  }

  public async matureEligibleRewards(
    input: MatureEligibleReferralRewardsInput
  ): Promise<MatureEligibleReferralRewardsResult> {
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
    const limit = input.limit ?? DEFAULT_MATURATION_BATCH_SIZE;
    const candidates = await this.rewards.listMaturationCandidates(ownerId, limit);
    const authorityBeforeLock = await this.authorities.getByOwnerId(ownerId);
    if (authorityBeforeLock === null) {
      throw new CommercialAuthorityUnavailableError();
    }
    if (candidates.length === 0) {
      return Object.freeze({ outcome: 'NO_OP', authority: authorityBeforeLock, rewards: [] });
    }

    const lockedOwners = await lockReferralOwners(this.executor, [
      ownerId,
      ...candidates.map((candidate) => candidate.referredOwnerId)
    ]);
    const referrerAuthority = ownerAuthority(lockedOwners, ownerId);
    if (
      referrerAuthority.commercialAuthorityId !==
      authorityBeforeLock.commercialAuthorityId
    ) {
      throw new CommercialAuthorityUnavailableError();
    }

    const coverageIds = candidates.map(
      (candidate) => candidate.qualifyingPaidCoverageId
    );
    const coverageRows = await lockReferralPaidCoverages(
      this.executor,
      coverageIds
    );
    const coverages = new Map(
      coverageRows.map((coverage) => [coverage.paidCoverageId, coverage])
    );
    const ownerByAuthorityId = new Map(
      lockedOwners.map((owner) => [owner.authority.commercialAuthorityId, owner.ownerId])
    );
    const attributions = new Map(
      (
        await this.attributions.lockByIds(
          candidates.map((candidate) => candidate.referralAttributionId)
        )
      ).map((attribution) => [
        attribution.referralAttributionId,
        attribution
      ])
    );
    const candidatesByRewardId = new Map(
      candidates.map((candidate) => [candidate.referralRewardId, candidate])
    );
    const rewards = sortRewards(
      await this.rewards.lockByIds(
        candidates.map((candidate) => candidate.referralRewardId),
        referrerAuthority.commercialAuthorityId
      )
    );
    const now = await databaseNow(this.executor);
    let nextRevision: string | undefined;
    const changedRewards: ReferralRewardRecord[] = [];

    for (const reward of rewards) {
      if (reward.state !== 'PENDING') {
        continue;
      }
      const attribution = attributions.get(reward.referralAttributionId);
      const coverage = coverages.get(reward.qualifyingPaidCoverageId);
      const candidate = candidatesByRewardId.get(reward.referralRewardId);
      if (
        attribution === undefined ||
        coverage === undefined ||
        candidate === undefined ||
        candidate.referredAuthorityId !== attribution.referredAuthorityId ||
        candidate.referredOwnerId !== ownerByAuthorityId.get(
          attribution.referredAuthorityId
        ) ||
        attribution.state !== 'LOCKED' ||
        attribution.qualifyingPaidCoverageId !== reward.qualifyingPaidCoverageId
      ) {
        throw new CommercialPersistenceIntegrityError();
      }

      nextRevision ??= incrementRevision(referrerAuthority.entitlementRevision);
      if (coverage.coverageState === 'REVERSED') {
        if (coverage.reversalEventId === null) {
          throw new CommercialPersistenceIntegrityError();
        }
        await requirePaidReversalEvent(
          this.executor,
          coverage.reversalEventId,
          attribution.referredAuthorityId
        );
        await this.appendReferralEvent({
          ownerId,
          commercialAuthorityId: referrerAuthority.commercialAuthorityId,
          eventType: 'REFERRAL_REWARD_REVOKED',
          sourceEntityId: reward.referralRewardId,
          idempotencyKey: `referral.reward.revoke.v1:${reward.referralRewardId}:${coverage.reversalEventId}`,
          effectiveAt: now,
          occurredAt: now,
          causedByEventId: coverage.reversalEventId,
          attributes: {
            referral_reward_id: reward.referralRewardId,
            referral_attribution_id: reward.referralAttributionId,
            qualifying_paid_coverage_id: reward.qualifyingPaidCoverageId,
            reversal_event_id: coverage.reversalEventId,
            reason: 'QUALIFYING_PURCHASE_REVERSED'
          }
        });
        changedRewards.push(
          await this.rewards.revoke({
            referrerOwnerId: ownerId,
            referrerAuthorityId: referrerAuthority.commercialAuthorityId,
            referralRewardId: reward.referralRewardId,
            revokedAt: now,
            revocationReason: 'QUALIFYING_PURCHASE_REVERSED',
            reversalEventId: coverage.reversalEventId,
            sourceRevision: nextRevision
          })
        );
        continue;
      }
      if (Date.parse(now) < Date.parse(reward.maturesAt)) {
        continue;
      }
      const maturationEvent = await this.appendReferralEvent({
        ownerId,
        commercialAuthorityId: referrerAuthority.commercialAuthorityId,
        eventType: 'REFERRAL_REWARD_MATURED',
        sourceEntityId: reward.referralRewardId,
        idempotencyKey: `referral.reward.mature.v1:${reward.referralRewardId}`,
        effectiveAt: now,
        occurredAt: now,
        causedByEventId: reward.pendingEventId,
        attributes: {
          referral_reward_id: reward.referralRewardId,
          referral_attribution_id: reward.referralAttributionId,
          qualifying_paid_coverage_id: reward.qualifyingPaidCoverageId,
          matures_at: reward.maturesAt
        }
      });
      changedRewards.push(
        await this.rewards.mature({
          referrerOwnerId: ownerId,
          referrerAuthorityId: referrerAuthority.commercialAuthorityId,
          referralRewardId: reward.referralRewardId,
          maturationEventId: maturationEvent.eventId,
          earnedAt: now,
          sourceRevision: nextRevision
        })
      );
    }

    if (nextRevision === undefined || changedRewards.length === 0) {
      return Object.freeze({ outcome: 'NO_OP', authority: referrerAuthority, rewards: [] });
    }
    const advancedAuthority = await this.advanceAuthority(
      ownerId,
      referrerAuthority,
      nextRevision
    );
    return Object.freeze({
      outcome: 'APPLIED',
      authority: advancedAuthority,
      rewards: Object.freeze(changedRewards)
    });
  }

  public async revokeForPaidReversal(
    input: RevokeReferralRewardForPaidReversalInput
  ): Promise<RevokeReferralRewardResult> {
    const referrerOwnerId = assertCommercialIdentifier(
      input.referrerOwnerId,
      'referrerOwnerId'
    );
    const referralRewardId = assertCommercialIdentifier(
      input.referralRewardId,
      'referralRewardId'
    );
    const preflightReward = await this.rewards.getById(referralRewardId);
    if (preflightReward === null) {
      throw new ReferralRewardNotFoundError();
    }
    const preflightAttribution = await this.attributions.getById(
      preflightReward.referralAttributionId
    );
    if (preflightAttribution === null) {
      throw new CommercialPersistenceIntegrityError();
    }
    const resolvedReferrerOwnerId = await findAuthorityOwner(
      this.executor,
      preflightReward.referrerAuthorityId
    );
    const resolvedReferredOwnerId = await findAuthorityOwner(
      this.executor,
      preflightAttribution.referredAuthorityId
    );
    assertOwnerMatch(resolvedReferrerOwnerId, referrerOwnerId);
    if (resolvedReferredOwnerId === null) {
      throw new CommercialAuthorityUnavailableError();
    }
    const lockedOwners = await lockReferralOwners(this.executor, [
      referrerOwnerId,
      resolvedReferredOwnerId
    ]);
    const referrerAuthority = ownerAuthority(lockedOwners, referrerOwnerId);
    const referredAuthority = ownerAuthority(lockedOwners, resolvedReferredOwnerId);
    if (
      referrerAuthority.commercialAuthorityId !== preflightReward.referrerAuthorityId ||
      referredAuthority.commercialAuthorityId !== preflightAttribution.referredAuthorityId
    ) {
      throw new CommercialPersistenceIntegrityError();
    }

    const coverageRows = await lockReferralPaidCoverages(this.executor, [
      preflightReward.qualifyingPaidCoverageId
    ]);
    const coverage = coverageRows[0];
    const attribution = await this.attributions.lockForUpdate(
      preflightReward.referralAttributionId
    );
    const reward = await this.rewards.lockForUpdate(
      referralRewardId,
      referrerAuthority.commercialAuthorityId
    );
    if (coverage === undefined || attribution === null || reward === null) {
      throw new CommercialPersistenceIntegrityError();
    }
    if (
      coverage.commercialAuthorityId !== referredAuthority.commercialAuthorityId ||
      coverage.paidCoverageId !== reward.qualifyingPaidCoverageId ||
      attribution.referralAttributionId !== reward.referralAttributionId ||
      attribution.qualifyingPaidCoverageId !== reward.qualifyingPaidCoverageId
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
    if (
      coverage.coverageState !== 'REVERSED' ||
      coverage.reversalEventId === null
    ) {
      throw new ReferralRewardNotRevocableError();
    }
    await requirePaidReversalEvent(
      this.executor,
      coverage.reversalEventId,
      referredAuthority.commercialAuthorityId
    );

    if (reward.state === 'REVOKED') {
      if (reward.reversalEventId !== coverage.reversalEventId) {
        throw new ReferralRewardConflictError();
      }
      return Object.freeze({
        outcome: 'DUPLICATE',
        authority: referrerAuthority,
        reward
      });
    }
    if (
      reward.state === 'APPLIED' ||
      reward.appliedDurationUs !== '0' ||
      reward.consumedDurationUs !== '0'
    ) {
      throw new ReferralRewardNotRevocableError();
    }
    if (reward.state !== 'PENDING' && reward.state !== 'EARNED') {
      throw new ReferralRewardNotRevocableError();
    }

    const now = await databaseNow(this.executor);
    const nextRevision = incrementRevision(referrerAuthority.entitlementRevision);
    await this.appendReferralEvent({
      ownerId: referrerOwnerId,
      commercialAuthorityId: referrerAuthority.commercialAuthorityId,
      eventType: 'REFERRAL_REWARD_REVOKED',
      sourceEntityId: reward.referralRewardId,
      idempotencyKey: `referral.reward.revoke.v1:${reward.referralRewardId}:${coverage.reversalEventId}`,
      effectiveAt: now,
      occurredAt: now,
      causedByEventId: coverage.reversalEventId,
      attributes: {
        referral_reward_id: reward.referralRewardId,
        referral_attribution_id: reward.referralAttributionId,
        qualifying_paid_coverage_id: reward.qualifyingPaidCoverageId,
        reversal_event_id: coverage.reversalEventId,
        reason: 'QUALIFYING_PURCHASE_REVERSED'
      }
    });
    const revoked = await this.rewards.revoke({
      referrerOwnerId,
      referrerAuthorityId: referrerAuthority.commercialAuthorityId,
      referralRewardId: reward.referralRewardId,
      revokedAt: now,
      revocationReason: 'QUALIFYING_PURCHASE_REVERSED',
      reversalEventId: coverage.reversalEventId,
      sourceRevision: nextRevision
    });
    const authority = await this.advanceAuthority(
      referrerOwnerId,
      referrerAuthority,
      nextRevision
    );
    return Object.freeze({ outcome: 'APPLIED', authority, reward: revoked });
  }

  private async appendReferralEvent(
    draft: ReferralEventDraft
  ): Promise<Awaited<ReturnType<CommercialEventRepository['appendIdempotent']>>['event']> {
    const attributes = draft.attributes;
    const operationDigest = digestCanonicalCommercialOperation({
      event_type: draft.eventType,
      source_entity_id: draft.sourceEntityId,
      effective_at: draft.effectiveAt,
      caused_by_event_id: draft.causedByEventId,
      attributes
    });
    const result = await this.events.appendIdempotent({
      eventId: randomUUID(),
      ownerId: draft.ownerId,
      commercialAuthorityId: draft.commercialAuthorityId,
      eventType: draft.eventType,
      sourceType: 'REFERRAL',
      sourceEntityId: draft.sourceEntityId,
      sourceNamespace: REFERRAL_EVENT_SOURCE_NAMESPACE,
      providerNamespace: null,
      providerContext: null,
      providerEventId: null,
      providerReceiptId: null,
      idempotencyNamespace: REFERRAL_EVENT_IDEMPOTENCY_NAMESPACE,
      idempotencyKey: draft.idempotencyKey,
      operationDigest,
      occurredAt: draft.occurredAt,
      effectiveAt: draft.effectiveAt,
      causedByEventId: draft.causedByEventId,
      correctsEventId: null,
      reversesEventId: null,
      attributes,
      attributesVersion: 1,
      schemaVersion: 1,
      actorClass: 'SYSTEM',
      actorReference: REFERRAL_ACTOR_REFERENCE
    });
    return result.event;
  }

  private async advanceAuthority(
    ownerId: string,
    authority: CommercialAuthorityRecord,
    expectedRevision: string
  ): Promise<CommercialAuthorityRecord> {
    const advanced = await this.authorities.advanceRevisionAfterLock({
      commercialAuthorityId: authority.commercialAuthorityId,
      ownerId,
      expectedRevision: authority.entitlementRevision
    });
    if (advanced.entitlementRevision !== expectedRevision) {
      throw new CommercialPersistenceIntegrityError();
    }
    return advanced;
  }
}
