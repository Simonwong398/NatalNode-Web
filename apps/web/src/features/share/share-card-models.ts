import {
  getAstrologyGlossaryNotation,
  resolveAstrologyDomainTerm
} from '../../core/astrology-taxonomy/astrology-glossary.js';
import {
  SIGN_CLASSIFICATIONS,
  type SignElement,
  type SignId,
  type SignModality
} from '../../core/astrology-taxonomy/chart-taxonomy.js';
import {
  getElementPairContent,
  getModalityPairContent
} from '../../content/discover/sign-match.js';
import {
  getZodiacElementContent,
  getZodiacModalityContent,
  getZodiacSignContent,
  ZODIAC_ELEMENT_MEMBERS,
  ZODIAC_MODALITY_MEMBERS
} from '../../content/discover/zodiac.js';
import {
  canonicalizeShareMatchPair,
  getDiscoverMatchPathForShare,
  getShareElementModeConcept,
  getShareElementsModesPath,
  getShareMatchPath,
  getShareSignPath,
  parseShareSignId,
  type ShareElementModeConcept,
  type ShareSignMatchPair
} from '../../lib/share-links.js';
import { getLocalizedPath, type SupportedLocale } from '../../lib/localization.js';
import { formatUiMessage, getUiMessage, type UiMessageKey } from '../../lib/ui-catalog.js';

export type ShareCardKind = 'sign' | 'sign-match' | 'elements-modes';

export interface ShareCardBase {
  readonly kind: ShareCardKind;
  readonly locale: SupportedLocale;
  readonly routePath: string;
  readonly canonicalPath: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly sourceLabel: string;
  readonly disclosure: string;
  readonly ctaHref: string;
  readonly ctaLabel: string;
  readonly shareText: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
}

export interface SignCardModel extends ShareCardBase {
  readonly kind: 'sign';
  readonly signId: SignId;
  readonly signName: string;
  readonly glyph?: string;
  readonly elementName: string;
  readonly modalityName: string;
  readonly summary: string;
  readonly chartFunctionLabel: string;
  readonly chartFunction: string;
}

export interface ShareSignDetail {
  readonly id: SignId;
  readonly name: string;
  readonly glyph?: string;
  readonly elementName: string;
  readonly modalityName: string;
}

export interface SignMatchCardModel extends ShareCardBase {
  readonly kind: 'sign-match';
  readonly pair: ShareSignMatchPair;
  readonly signs: readonly [ShareSignDetail, ShareSignDetail];
  readonly elementRelationshipLabel: string;
  readonly elementRelationship: string;
  readonly modalityRelationshipLabel: string;
  readonly modalityRelationship: string;
}

export interface ElementsModesCardModel extends ShareCardBase {
  readonly kind: 'elements-modes';
  readonly concept: ShareElementModeConcept;
  readonly conceptName: string;
  readonly dimensionLabel: string;
  readonly description: string;
  readonly memberSigns: readonly ShareSignDetail[];
  readonly memberSignsLabel: string;
}

export type ShareCardModel =
  | SignCardModel
  | SignMatchCardModel
  | ElementsModesCardModel;

function ui(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

function localizedSignName(signId: SignId, locale: SupportedLocale): string {
  const sign = SIGN_CLASSIFICATIONS.find((candidate) => candidate.id === signId);
  if (sign === undefined) {
    throw new TypeError('Unknown Core sign identity');
  }

  return resolveAstrologyDomainTerm('sign', sign.label, locale)?.displayTerm ?? sign.label;
}

function getSignDetail(signId: SignId, locale: SupportedLocale): ShareSignDetail {
  const sign = SIGN_CLASSIFICATIONS.find((candidate) => candidate.id === signId);
  if (sign === undefined) {
    throw new TypeError('Unknown Core sign identity');
  }

  return Object.freeze({
    id: sign.id,
    name: localizedSignName(sign.id, locale),
    glyph: getAstrologyGlossaryNotation('sign', sign.label, 'glyph'),
    elementName: getZodiacElementContent(sign.element, locale).label,
    modalityName: getZodiacModalityContent(sign.modality, locale).label
  });
}

function seoTitle(title: string): string {
  return `${title} | NatalNode`;
}

export function createSignCardModel(
  locale: SupportedLocale,
  signId: SignId
): SignCardModel {
  const parsedSignId = parseShareSignId(signId);
  if (parsedSignId === null) {
    throw new TypeError('Unknown Share sign identity');
  }

  const sign = SIGN_CLASSIFICATIONS.find((candidate) => candidate.id === parsedSignId);
  if (sign === undefined) {
    throw new TypeError('Unknown Core sign identity');
  }

  const signName = localizedSignName(parsedSignId, locale);
  const content = getZodiacSignContent(parsedSignId, locale);
  const elementName = getZodiacElementContent(sign.element, locale).label;
  const modalityName = getZodiacModalityContent(sign.modality, locale).label;
  const title = formatUiMessage(locale, 'share.sign.title', { sign: signName });
  const routePath = `/share/sign/${parsedSignId}/`;

  return Object.freeze({
    kind: 'sign',
    locale,
    routePath,
    canonicalPath: getShareSignPath(locale, parsedSignId),
    eyebrow: ui(locale, 'share.eyebrow'),
    title,
    subtitle: ui(locale, 'share.sign.subtitle'),
    sourceLabel: ui(locale, 'share.source'),
    disclosure: ui(locale, 'share.disclosure'),
    ctaHref: getLocalizedPath(locale, `/discover/zodiac/${parsedSignId}/`),
    ctaLabel: formatUiMessage(locale, 'share.sign.cta', { sign: signName }),
    shareText: `${title} — ${content.summary}`,
    seoTitle: seoTitle(title),
    seoDescription: `${content.summary} ${content.chartFunction}`,
    signId: parsedSignId,
    signName,
    glyph: getAstrologyGlossaryNotation('sign', sign.label, 'glyph'),
    elementName,
    modalityName,
    summary: content.summary,
    chartFunctionLabel: ui(locale, 'share.sign.chartFunction'),
    chartFunction: content.chartFunction
  });
}

export function createSignMatchCardModel(
  locale: SupportedLocale,
  pairInput: ShareSignMatchPair
): SignMatchCardModel {
  const pair = canonicalizeShareMatchPair(pairInput.signA, pairInput.signB);
  if (pair === null) {
    throw new TypeError('Unknown Share sign match identity');
  }

  const first = SIGN_CLASSIFICATIONS.find((sign) => sign.id === pair.signA);
  const second = SIGN_CLASSIFICATIONS.find((sign) => sign.id === pair.signB);
  if (first === undefined || second === undefined) {
    throw new TypeError('Unknown Core sign match identity');
  }

  const signAName = localizedSignName(first.id, locale);
  const signBName = localizedSignName(second.id, locale);
  const title = formatUiMessage(locale, 'share.match.title', {
    signA: signAName,
    signB: signBName
  });
  const elementRelationship = getElementPairContent(first.element, second.element, locale);
  const modalityRelationship = getModalityPairContent(first.modality, second.modality, locale);
  const routePath = `/share/match/${pair.signA}--${pair.signB}/`;

  return Object.freeze({
    kind: 'sign-match',
    locale,
    routePath,
    canonicalPath: getShareMatchPath(locale, pair),
    eyebrow: ui(locale, 'share.eyebrow'),
    title,
    subtitle: ui(locale, 'share.match.subtitle'),
    sourceLabel: ui(locale, 'share.source'),
    disclosure: ui(locale, 'share.disclosure'),
    ctaHref: getDiscoverMatchPathForShare(locale, pair),
    ctaLabel: ui(locale, 'share.match.cta'),
    shareText: `${title} — ${elementRelationship}`,
    seoTitle: seoTitle(title),
    seoDescription: `${elementRelationship} ${modalityRelationship}`,
    pair,
    signs: Object.freeze([
      getSignDetail(first.id, locale),
      getSignDetail(second.id, locale)
    ]) as readonly [ShareSignDetail, ShareSignDetail],
    elementRelationshipLabel: ui(locale, 'share.match.elementRelationship'),
    elementRelationship,
    modalityRelationshipLabel: ui(locale, 'share.match.modalityRelationship'),
    modalityRelationship
  });
}

export function createElementsModesCardModel(
  locale: SupportedLocale,
  conceptInput: ShareElementModeConcept | string
): ElementsModesCardModel {
  const concept = getShareElementModeConcept(conceptInput);
  if (concept === null) {
    throw new TypeError('Unknown Share elements-and-modes identity');
  }

  const isElement = concept.kind === 'element';
  const conceptName = isElement
    ? getZodiacElementContent(concept.value as SignElement, locale).label
    : getZodiacModalityContent(concept.value as SignModality, locale).label;
  const description = isElement
    ? getZodiacElementContent(concept.value as SignElement, locale).description
    : getZodiacModalityContent(concept.value as SignModality, locale).description;
  const memberIds = isElement
    ? ZODIAC_ELEMENT_MEMBERS[concept.value as SignElement]
    : ZODIAC_MODALITY_MEMBERS[concept.value as SignModality];
  const memberSigns = Object.freeze(memberIds.map((signId) => getSignDetail(signId, locale)));
  const title = formatUiMessage(locale, 'share.elements.title', { concept: conceptName });
  const routePath = `/share/elements-modes/${concept.slug}/`;

  return Object.freeze({
    kind: 'elements-modes',
    locale,
    routePath,
    canonicalPath: getShareElementsModesPath(locale, concept),
    eyebrow: ui(locale, 'share.eyebrow'),
    title,
    subtitle: ui(locale, 'share.elements.subtitle'),
    sourceLabel: ui(locale, 'share.source'),
    disclosure: ui(locale, 'share.disclosure'),
    ctaHref: getLocalizedPath(locale, '/discover/elements-modes/'),
    ctaLabel: ui(locale, 'share.elements.cta'),
    shareText: `${title} — ${description}`,
    seoTitle: seoTitle(title),
    seoDescription: description,
    concept,
    conceptName,
    dimensionLabel: isElement
      ? ui(locale, 'share.elements.element')
      : ui(locale, 'share.elements.modality'),
    description,
    memberSigns,
    memberSignsLabel: ui(locale, 'share.elements.memberSigns')
  });
}
