import type {
  InterpretationPriority,
  InterpretationSignal
} from './interpretation-signal-contracts.js';

const PRIORITY_WEIGHTS: Readonly<Record<InterpretationPriority, number>> = Object.freeze({
  BACKGROUND: 0.35,
  THEMATIC: 0.55,
  ACTIVE: 0.8,
  MOMENTARY: 1
});

export interface RankedInterpretationSignal {
  readonly signal: InterpretationSignal;
  /** Internal ordering value; never a user-facing certainty or percentage. */
  readonly rankingScore: number;
  readonly rank: number;
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function rankingScore(signal: InterpretationSignal): number {
  const metadata = signal.ranking;
  const score =
    PRIORITY_WEIGHTS[signal.priority] * 0.2 +
    signal.internalStrength * 0.1 +
    metadata.baseImportance * 0.3 +
    metadata.evidenceStrength * 0.25 +
    metadata.temporalRelevance * 0.1 +
    metadata.durationWeight * 0.05 -
    metadata.repetitionPenalty * 0.15;

  return clampUnit(score);
}

/**
 * Ranks already-created signals using only their explicit normalized metadata.
 * No chart facts, dates, providers, or inferred values enter this ordering.
 */
export function rankInterpretationSignals(
  signals: readonly InterpretationSignal[]
): readonly RankedInterpretationSignal[] {
  const ranked = signals
    .map((signal) => ({ signal, rankingScore: rankingScore(signal), rank: 0 }))
    .sort((left, right) => {
      if (right.rankingScore !== left.rankingScore) {
        return right.rankingScore - left.rankingScore;
      }

      if (right.signal.internalStrength !== left.signal.internalStrength) {
        return right.signal.internalStrength - left.signal.internalStrength;
      }

      return left.signal.signalId.localeCompare(right.signal.signalId);
    })
    .map((entry, index) => Object.freeze({ ...entry, rank: index + 1 }));

  return Object.freeze(ranked);
}
