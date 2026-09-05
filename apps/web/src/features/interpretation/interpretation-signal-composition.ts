import type {
  InterpretationFactReference,
  InterpretationSignal,
  InterpretationSignalComposition,
  InterpretationSignalDirection
} from './interpretation-signal-contracts.js';
import { rankInterpretationSignals } from './interpretation-signal-ranking.js';

function factReferenceKey(reference: InterpretationFactReference): string {
  return `${reference.factKind}|${reference.canonicalFactIdentity ?? reference.canonicalPath}`;
}

function composedDirection(
  directions: readonly InterpretationSignalDirection[]
): InterpretationSignalDirection {
  const directionSet = new Set(directions);
  const hasSupportive = directionSet.has('SUPPORTIVE');
  const hasChallenging = directionSet.has('CHALLENGING');

  if (hasSupportive && hasChallenging) {
    return 'MIXED';
  }

  if (directionSet.has('MIXED')) {
    return 'MIXED';
  }

  if (hasSupportive) {
    return 'SUPPORTIVE';
  }

  if (hasChallenging) {
    return 'CHALLENGING';
  }

  return 'NEUTRAL';
}

/**
 * Composes a selected signal group without creating a new scientific or
 * semantic fact. All source signal IDs and fact references remain explicit.
 */
export function composeInterpretationSignalGroup(
  signals: readonly InterpretationSignal[]
): InterpretationSignalComposition | null {
  if (signals.length === 0) {
    return null;
  }

  const ranked = rankInterpretationSignals(signals);
  const sourceSignalIds = ranked.map((entry) => entry.signal.signalId);
  const supportiveSignalIds = ranked
    .filter((entry) => entry.signal.direction === 'SUPPORTIVE')
    .map((entry) => entry.signal.signalId);
  const challengingSignalIds = ranked
    .filter((entry) => entry.signal.direction === 'CHALLENGING')
    .map((entry) => entry.signal.signalId);
  const sourceFactRefs: InterpretationFactReference[] = [];
  const seenFactRefs = new Set<string>();

  for (const entry of ranked) {
    for (const reference of entry.signal.provenance.sourceFactRefs) {
      const key = factReferenceKey(reference);
      if (!seenFactRefs.has(key)) {
        seenFactRefs.add(key);
        sourceFactRefs.push(reference);
      }
    }
  }

  return Object.freeze({
    direction: composedDirection(ranked.map((entry) => entry.signal.direction)),
    dominantSignalId: ranked[0].signal.signalId,
    supportingSignalIds: Object.freeze(
      ranked.slice(1).map((entry) => entry.signal.signalId)
    ),
    sourceSignalIds: Object.freeze(sourceSignalIds),
    supportiveSignalIds: Object.freeze(supportiveSignalIds),
    challengingSignalIds: Object.freeze(challengingSignalIds),
    sourceFactRefs: Object.freeze(sourceFactRefs)
  });
}
