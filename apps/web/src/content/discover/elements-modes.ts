import {
  SIGN_CLASSIFICATIONS,
  type SignElement,
  type SignId,
  type SignModality
} from '../../core/astrology-taxonomy/chart-taxonomy.js';
import {
  ZODIAC_ELEMENT_MEMBERS,
  ZODIAC_MODALITY_MEMBERS
} from './zodiac.js';

/**
 * Elements & Modes owns the structural view, while Core owns the underlying
 * classifications. The order is derived from the Core-backed member records.
 */
export const ELEMENT_ORDER = Object.freeze(
  Object.keys(ZODIAC_ELEMENT_MEMBERS) as SignElement[]
);

export const MODALITY_ORDER = Object.freeze(
  Object.keys(ZODIAC_MODALITY_MEMBERS) as SignModality[]
);

export interface CrossClassificationCell {
  readonly element: SignElement;
  readonly modality: SignModality;
  readonly signId: SignId;
}

function createCrossClassificationCell(
  element: SignElement,
  modality: SignModality
): CrossClassificationCell {
  const sign = SIGN_CLASSIFICATIONS.find(
    (candidate) => candidate.element === element && candidate.modality === modality
  );

  if (sign === undefined) {
    throw new Error(`Missing Core sign for ${element}/${modality}`);
  }

  return Object.freeze({ element, modality, signId: sign.id });
}

/** One cell per Core-defined element × modality intersection. */
export const ZODIAC_CROSS_CLASSIFICATION = Object.freeze(
  ELEMENT_ORDER.flatMap((element) =>
    MODALITY_ORDER.map((modality) => createCrossClassificationCell(element, modality))
  )
);

export function getCrossClassificationCell(
  element: SignElement,
  modality: SignModality
): CrossClassificationCell {
  const cell = ZODIAC_CROSS_CLASSIFICATION.find(
    (candidate) => candidate.element === element && candidate.modality === modality
  );

  if (cell === undefined) {
    throw new Error(`Missing cross-classification cell for ${element}/${modality}`);
  }

  return cell;
}
