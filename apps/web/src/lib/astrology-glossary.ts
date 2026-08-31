import {
  DEFAULT_LOCALE,
  parseSupportedLocale,
  type SupportedLocale
} from './localization.js';

/** The closed V1 semantic identity set frozen by the glossary contract. */
export const ASTROLOGY_GLOSSARY_CONCEPT_IDS = Object.freeze([
  'body.sun',
  'body.moon',
  'body.mercury',
  'body.venus',
  'body.mars',
  'body.jupiter',
  'body.saturn',
  'body.uranus',
  'body.neptune',
  'body.pluto',
  'sign.aries',
  'sign.taurus',
  'sign.gemini',
  'sign.cancer',
  'sign.leo',
  'sign.virgo',
  'sign.libra',
  'sign.scorpio',
  'sign.sagittarius',
  'sign.capricorn',
  'sign.aquarius',
  'sign.pisces',
  'angle.ascendant',
  'angle.midheaven',
  'house.1',
  'house.2',
  'house.3',
  'house.4',
  'house.5',
  'house.6',
  'house.7',
  'house.8',
  'house.9',
  'house.10',
  'house.11',
  'house.12',
  'house.cusp',
  'house_system.placidus',
  'house_system.whole_sign',
  'house_system.equal',
  'aspect.conjunction',
  'aspect.opposition',
  'aspect.square',
  'aspect.trine',
  'aspect.sextile',
  'aspect.orb',
  'aspect_phase.applying',
  'aspect_phase.exact',
  'aspect_phase.separating',
  'motion.retrograde',
  'chart_type.natal',
  'sign_element.fire',
  'sign_element.earth',
  'sign_element.air',
  'sign_element.water',
  'sign_modality.cardinal',
  'sign_modality.fixed',
  'sign_modality.mutable',
  'motion.direct',
  'motion.stationary',
  'zodiac_model.tropical',
  'sky_event.ingress',
  'sky_event.station',
  'sky_event.lunation',
  'sky_event.eclipse',
  'lunar_phase.full_moon'
] as const);

export type AstrologyGlossaryConceptId =
  (typeof ASTROLOGY_GLOSSARY_CONCEPT_IDS)[number];

export type AstrologyGlossaryPriority = 'P0' | 'P1' | 'P2';

export type AstrologyGlossaryFamily =
  | 'celestial-body'
  | 'zodiac-sign'
  | 'sign-element'
  | 'sign-modality'
  | 'chart-angle'
  | 'house'
  | 'house-system'
  | 'major-aspect'
  | 'aspect-measurement'
  | 'aspect-phase'
  | 'motion-state'
  | 'chart-type'
  | 'zodiac-model'
  | 'sky-event'
  | 'lunar-phase';

export const ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION = '1.0' as const;
export const ASTROLOGY_GLOSSARY_CANONICAL_REVISION = 'v1' as const;

export interface AstrologyGlossaryNotation {
  readonly glyph?: string;
  readonly rendererAbbreviation?: string;
  readonly romanNumeral?: string;
}

export interface AstrologyGlossaryEntry {
  readonly semanticConceptId: AstrologyGlossaryConceptId;
  readonly family: AstrologyGlossaryFamily;
  readonly canonicalEnglishTerm: string;
  readonly canonicalTerminologyVersion: string;
  readonly canonicalTerminologyRevision: string;
  readonly priority: AstrologyGlossaryPriority;
  readonly shortForm?: string;
  readonly aliases?: readonly string[];
  readonly notation?: AstrologyGlossaryNotation;
}

type AstrologyGlossaryEntryOptions = Readonly<{
  shortForm?: string;
  aliases?: readonly string[];
  notation?: AstrologyGlossaryNotation;
}>;

function createEntry(
  semanticConceptId: AstrologyGlossaryConceptId,
  family: AstrologyGlossaryFamily,
  canonicalEnglishTerm: string,
  priority: AstrologyGlossaryPriority,
  options: AstrologyGlossaryEntryOptions = {}
): AstrologyGlossaryEntry {
  const aliases = options.aliases === undefined
    ? undefined
    : Object.freeze([...options.aliases]);
  const notation = options.notation === undefined
    ? undefined
    : Object.freeze({ ...options.notation });

  return Object.freeze({
    semanticConceptId,
    family,
    canonicalEnglishTerm,
    canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
    canonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION,
    priority,
    ...(options.shortForm === undefined ? {} : { shortForm: options.shortForm }),
    ...(aliases === undefined ? {} : { aliases }),
    ...(notation === undefined ? {} : { notation })
  });
}

/** One canonical English registry; locale variants never live in the UI Catalog. */
export const ASTROLOGY_GLOSSARY_REGISTRY = Object.freeze({
  'body.sun': createEntry('body.sun', 'celestial-body', 'Sun', 'P0', {
    notation: { glyph: '☉', rendererAbbreviation: 'Su' }
  }),
  'body.moon': createEntry('body.moon', 'celestial-body', 'Moon', 'P0', {
    notation: { glyph: '☽', rendererAbbreviation: 'Mo' }
  }),
  'body.mercury': createEntry('body.mercury', 'celestial-body', 'Mercury', 'P0', {
    notation: { glyph: '☿', rendererAbbreviation: 'Me' }
  }),
  'body.venus': createEntry('body.venus', 'celestial-body', 'Venus', 'P0', {
    notation: { glyph: '♀', rendererAbbreviation: 'Ve' }
  }),
  'body.mars': createEntry('body.mars', 'celestial-body', 'Mars', 'P0', {
    notation: { glyph: '♂', rendererAbbreviation: 'Ma' }
  }),
  'body.jupiter': createEntry('body.jupiter', 'celestial-body', 'Jupiter', 'P0', {
    notation: { glyph: '♃', rendererAbbreviation: 'Ju' }
  }),
  'body.saturn': createEntry('body.saturn', 'celestial-body', 'Saturn', 'P0', {
    notation: { glyph: '♄', rendererAbbreviation: 'Sa' }
  }),
  'body.uranus': createEntry('body.uranus', 'celestial-body', 'Uranus', 'P0', {
    notation: { glyph: '♅', rendererAbbreviation: 'Ur' }
  }),
  'body.neptune': createEntry('body.neptune', 'celestial-body', 'Neptune', 'P0', {
    notation: { glyph: '♆', rendererAbbreviation: 'Ne' }
  }),
  'body.pluto': createEntry('body.pluto', 'celestial-body', 'Pluto', 'P0', {
    notation: { glyph: '♇', rendererAbbreviation: 'Pl' }
  }),
  'sign.aries': createEntry('sign.aries', 'zodiac-sign', 'Aries', 'P0', {
    notation: { glyph: '♈' }
  }),
  'sign.taurus': createEntry('sign.taurus', 'zodiac-sign', 'Taurus', 'P0', {
    notation: { glyph: '♉' }
  }),
  'sign.gemini': createEntry('sign.gemini', 'zodiac-sign', 'Gemini', 'P0', {
    notation: { glyph: '♊' }
  }),
  'sign.cancer': createEntry('sign.cancer', 'zodiac-sign', 'Cancer', 'P0', {
    notation: { glyph: '♋' }
  }),
  'sign.leo': createEntry('sign.leo', 'zodiac-sign', 'Leo', 'P0', {
    notation: { glyph: '♌' }
  }),
  'sign.virgo': createEntry('sign.virgo', 'zodiac-sign', 'Virgo', 'P0', {
    notation: { glyph: '♍' }
  }),
  'sign.libra': createEntry('sign.libra', 'zodiac-sign', 'Libra', 'P0', {
    notation: { glyph: '♎' }
  }),
  'sign.scorpio': createEntry('sign.scorpio', 'zodiac-sign', 'Scorpio', 'P0', {
    notation: { glyph: '♏' }
  }),
  'sign.sagittarius': createEntry('sign.sagittarius', 'zodiac-sign', 'Sagittarius', 'P0', {
    notation: { glyph: '♐' }
  }),
  'sign.capricorn': createEntry('sign.capricorn', 'zodiac-sign', 'Capricorn', 'P0', {
    notation: { glyph: '♑' }
  }),
  'sign.aquarius': createEntry('sign.aquarius', 'zodiac-sign', 'Aquarius', 'P0', {
    notation: { glyph: '♒' }
  }),
  'sign.pisces': createEntry('sign.pisces', 'zodiac-sign', 'Pisces', 'P0', {
    notation: { glyph: '♓' }
  }),
  'angle.ascendant': createEntry('angle.ascendant', 'chart-angle', 'Ascendant', 'P0', {
    shortForm: 'ASC',
    aliases: ['ASC']
  }),
  'angle.midheaven': createEntry('angle.midheaven', 'chart-angle', 'Midheaven', 'P0', {
    shortForm: 'MC',
    aliases: ['MC']
  }),
  'house.1': createEntry('house.1', 'house', '1st House', 'P0', {
    aliases: ['House 1'],
    notation: { romanNumeral: 'I' }
  }),
  'house.2': createEntry('house.2', 'house', '2nd House', 'P0', {
    aliases: ['House 2'],
    notation: { romanNumeral: 'II' }
  }),
  'house.3': createEntry('house.3', 'house', '3rd House', 'P0', {
    aliases: ['House 3'],
    notation: { romanNumeral: 'III' }
  }),
  'house.4': createEntry('house.4', 'house', '4th House', 'P0', {
    aliases: ['House 4'],
    notation: { romanNumeral: 'IV' }
  }),
  'house.5': createEntry('house.5', 'house', '5th House', 'P0', {
    aliases: ['House 5'],
    notation: { romanNumeral: 'V' }
  }),
  'house.6': createEntry('house.6', 'house', '6th House', 'P0', {
    aliases: ['House 6'],
    notation: { romanNumeral: 'VI' }
  }),
  'house.7': createEntry('house.7', 'house', '7th House', 'P0', {
    aliases: ['House 7'],
    notation: { romanNumeral: 'VII' }
  }),
  'house.8': createEntry('house.8', 'house', '8th House', 'P0', {
    aliases: ['House 8'],
    notation: { romanNumeral: 'VIII' }
  }),
  'house.9': createEntry('house.9', 'house', '9th House', 'P0', {
    aliases: ['House 9'],
    notation: { romanNumeral: 'IX' }
  }),
  'house.10': createEntry('house.10', 'house', '10th House', 'P0', {
    aliases: ['House 10'],
    notation: { romanNumeral: 'X' }
  }),
  'house.11': createEntry('house.11', 'house', '11th House', 'P0', {
    aliases: ['House 11'],
    notation: { romanNumeral: 'XI' }
  }),
  'house.12': createEntry('house.12', 'house', '12th House', 'P0', {
    aliases: ['House 12'],
    notation: { romanNumeral: 'XII' }
  }),
  'house.cusp': createEntry('house.cusp', 'house', 'House cusp', 'P0', {
    aliases: ['Cusp']
  }),
  'house_system.placidus': createEntry('house_system.placidus', 'house-system', 'Placidus', 'P0'),
  'house_system.whole_sign': createEntry('house_system.whole_sign', 'house-system', 'Whole Sign', 'P0'),
  'house_system.equal': createEntry('house_system.equal', 'house-system', 'Equal House', 'P0', {
    aliases: ['Equal']
  }),
  'aspect.conjunction': createEntry('aspect.conjunction', 'major-aspect', 'Conjunction', 'P0', {
    notation: { glyph: '☌' }
  }),
  'aspect.opposition': createEntry('aspect.opposition', 'major-aspect', 'Opposition', 'P0', {
    notation: { glyph: '☍' }
  }),
  'aspect.square': createEntry('aspect.square', 'major-aspect', 'Square', 'P0', {
    notation: { glyph: '□' }
  }),
  'aspect.trine': createEntry('aspect.trine', 'major-aspect', 'Trine', 'P0', {
    notation: { glyph: '△' }
  }),
  'aspect.sextile': createEntry('aspect.sextile', 'major-aspect', 'Sextile', 'P0', {
    notation: { glyph: '✶' }
  }),
  'aspect.orb': createEntry('aspect.orb', 'aspect-measurement', 'Orb', 'P0'),
  'aspect_phase.applying': createEntry('aspect_phase.applying', 'aspect-phase', 'Applying', 'P0'),
  'aspect_phase.exact': createEntry('aspect_phase.exact', 'aspect-phase', 'Exact', 'P0'),
  'aspect_phase.separating': createEntry('aspect_phase.separating', 'aspect-phase', 'Separating', 'P0'),
  'motion.retrograde': createEntry('motion.retrograde', 'motion-state', 'Retrograde', 'P0'),
  'chart_type.natal': createEntry('chart_type.natal', 'chart-type', 'Natal chart', 'P0', {
    aliases: ['Birth chart']
  }),
  'sign_element.fire': createEntry('sign_element.fire', 'sign-element', 'Fire', 'P1'),
  'sign_element.earth': createEntry('sign_element.earth', 'sign-element', 'Earth', 'P1'),
  'sign_element.air': createEntry('sign_element.air', 'sign-element', 'Air', 'P1'),
  'sign_element.water': createEntry('sign_element.water', 'sign-element', 'Water', 'P1'),
  'sign_modality.cardinal': createEntry('sign_modality.cardinal', 'sign-modality', 'Cardinal', 'P1'),
  'sign_modality.fixed': createEntry('sign_modality.fixed', 'sign-modality', 'Fixed', 'P1'),
  'sign_modality.mutable': createEntry('sign_modality.mutable', 'sign-modality', 'Mutable', 'P1'),
  'motion.direct': createEntry('motion.direct', 'motion-state', 'Direct', 'P1'),
  'motion.stationary': createEntry('motion.stationary', 'motion-state', 'Stationary', 'P1'),
  'zodiac_model.tropical': createEntry('zodiac_model.tropical', 'zodiac-model', 'Tropical', 'P1'),
  'sky_event.ingress': createEntry('sky_event.ingress', 'sky-event', 'Ingress', 'P2'),
  'sky_event.station': createEntry('sky_event.station', 'sky-event', 'Station', 'P2'),
  'sky_event.lunation': createEntry('sky_event.lunation', 'sky-event', 'Lunation', 'P2'),
  'sky_event.eclipse': createEntry('sky_event.eclipse', 'sky-event', 'Eclipse', 'P2'),
  'lunar_phase.full_moon': createEntry('lunar_phase.full_moon', 'lunar-phase', 'Full Moon', 'P2')
} satisfies Readonly<Record<AstrologyGlossaryConceptId, AstrologyGlossaryEntry>>);

export const ASTROLOGY_GLOSSARY_ENTRIES = Object.freeze(
  ASTROLOGY_GLOSSARY_CONCEPT_IDS.map((conceptId) => ASTROLOGY_GLOSSARY_REGISTRY[conceptId])
);

export const ASTROLOGY_GLOSSARY_DEFERRED_CONCEPT_IDS = Object.freeze([
  'angle.descendant',
  'angle.imum_coeli',
  'technique.transit',
  'technique.profection',
  'technique.synastry',
  'technique.solar_return'
] as const);

export type AstrologyGlossaryApprovalState = 'DRAFT' | 'REVIEW' | 'APPROVED';
export type AstrologyGlossaryCurrentness = 'CURRENT' | 'OUTDATED';

export interface AstrologyGlossaryLocaleVariant {
  readonly semanticConceptId: AstrologyGlossaryConceptId;
  readonly locale: SupportedLocale;
  readonly professionalDisplayTerm: string;
  readonly shortForm?: string;
  readonly aliases?: readonly string[];
  readonly canonicalTerminologyVersion: string;
  readonly approvalState: AstrologyGlossaryApprovalState;
  readonly currentness: AstrologyGlossaryCurrentness;
  readonly reviewedAgainstCanonicalTerminologyRevision: string;
  readonly professionalEditorialNotes?: string;
}

export const ASTROLOGY_GLOSSARY_PRODUCTION_LOCALE_VARIANTS: readonly AstrologyGlossaryLocaleVariant[] = Object.freeze([]);

export interface AstrologyGlossaryRepository {
  readonly entries: Readonly<Record<AstrologyGlossaryConceptId, AstrologyGlossaryEntry>>;
  readonly localeVariants: readonly AstrologyGlossaryLocaleVariant[];
  readonly getEntry: (conceptId: AstrologyGlossaryConceptId) => AstrologyGlossaryEntry;
  readonly findLocaleVariant: (
    conceptId: AstrologyGlossaryConceptId,
    locale: SupportedLocale
  ) => AstrologyGlossaryLocaleVariant | undefined;
}

function freezeLocaleVariant(variant: AstrologyGlossaryLocaleVariant): AstrologyGlossaryLocaleVariant {
  const aliases = variant.aliases === undefined
    ? undefined
    : Object.freeze([...variant.aliases]);

  return Object.freeze({
    semanticConceptId: variant.semanticConceptId,
    locale: variant.locale,
    professionalDisplayTerm: variant.professionalDisplayTerm,
    ...(variant.shortForm === undefined ? {} : { shortForm: variant.shortForm }),
    ...(aliases === undefined ? {} : { aliases }),
    canonicalTerminologyVersion: variant.canonicalTerminologyVersion,
    approvalState: variant.approvalState,
    currentness: variant.currentness,
    reviewedAgainstCanonicalTerminologyRevision:
      variant.reviewedAgainstCanonicalTerminologyRevision,
    ...(variant.professionalEditorialNotes === undefined
      ? {}
      : { professionalEditorialNotes: variant.professionalEditorialNotes })
  });
}

function assertLocaleVariant(variant: AstrologyGlossaryLocaleVariant): void {
  if (!isAstrologyGlossaryConceptId(variant.semanticConceptId)) {
    throw new TypeError('Unknown astrology glossary concept ID in locale variant');
  }

  if (parseSupportedLocale(variant.locale) === null) {
    throw new TypeError('Unsupported locale in astrology glossary variant');
  }

  if (
    typeof variant.professionalDisplayTerm !== 'string' ||
    variant.professionalDisplayTerm.trim() === ''
  ) {
    throw new TypeError('Astrology glossary locale variant requires a display term');
  }

  if (
    typeof variant.canonicalTerminologyVersion !== 'string' ||
    variant.canonicalTerminologyVersion.trim() === ''
  ) {
    throw new TypeError('Astrology glossary locale variant requires a canonical version');
  }

  if (!['DRAFT', 'REVIEW', 'APPROVED'].includes(variant.approvalState)) {
    throw new TypeError('Invalid astrology glossary approval state');
  }

  if (!['CURRENT', 'OUTDATED'].includes(variant.currentness)) {
    throw new TypeError('Invalid astrology glossary currentness');
  }

  if (
    typeof variant.reviewedAgainstCanonicalTerminologyRevision !== 'string' ||
    variant.reviewedAgainstCanonicalTerminologyRevision.trim() === ''
  ) {
    throw new TypeError('Astrology glossary locale variant requires a canonical revision');
  }
}

export function createAstrologyGlossaryRepository(
  localeVariants: readonly AstrologyGlossaryLocaleVariant[] = []
): AstrologyGlossaryRepository {
  const seenVariantKeys = new Set<string>();
  const frozenVariants = Object.freeze(
    localeVariants.map((variant) => {
      assertLocaleVariant(variant);
      const variantKey = `${variant.semanticConceptId}\u0000${variant.locale}`;
      if (seenVariantKeys.has(variantKey)) {
        throw new TypeError('Duplicate astrology glossary locale variant');
      }
      seenVariantKeys.add(variantKey);
      return freezeLocaleVariant(variant);
    })
  );

  return Object.freeze({
    entries: ASTROLOGY_GLOSSARY_REGISTRY,
    localeVariants: frozenVariants,
    getEntry: (conceptId: AstrologyGlossaryConceptId) => getAstrologyGlossaryEntry(conceptId),
    findLocaleVariant: (conceptId: AstrologyGlossaryConceptId, locale: SupportedLocale) =>
      frozenVariants.find(
        (variant) => variant.semanticConceptId === conceptId && variant.locale === locale
      )
  });
}

export const ASTROLOGY_GLOSSARY_REPOSITORY = createAstrologyGlossaryRepository(
  ASTROLOGY_GLOSSARY_PRODUCTION_LOCALE_VARIANTS
);

export function isAstrologyGlossaryConceptId(
  value: unknown
): value is AstrologyGlossaryConceptId {
  return typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ASTROLOGY_GLOSSARY_REGISTRY, value);
}

export function getAstrologyGlossaryEntry(
  conceptId: AstrologyGlossaryConceptId
): AstrologyGlossaryEntry {
  if (!isAstrologyGlossaryConceptId(conceptId)) {
    throw new TypeError('Unknown astrology glossary concept ID');
  }

  return ASTROLOGY_GLOSSARY_REGISTRY[conceptId];
}

export type AstrologyGlossaryAvailability =
  | 'CANONICAL_ENGLISH'
  | 'LOCALIZED_APPROVED_CURRENT'
  | 'ENGLISH_FALLBACK';

export interface AstrologyTermResolution {
  readonly conceptId: AstrologyGlossaryConceptId;
  readonly requestedLocale: SupportedLocale;
  readonly resolvedLocale: SupportedLocale;
  readonly displayTerm: string;
  readonly shortForm?: string;
  readonly aliases?: readonly string[];
  readonly fallbackUsed: boolean;
  readonly availability: AstrologyGlossaryAvailability;
  readonly canonicalRevision: string;
}

/** Resolves one closed-set concept without ever using a cross-locale fallback. */
export function resolveAstrologyTerm(
  conceptId: AstrologyGlossaryConceptId,
  requestedLocale: SupportedLocale = DEFAULT_LOCALE,
  repository: AstrologyGlossaryRepository = ASTROLOGY_GLOSSARY_REPOSITORY
): AstrologyTermResolution {
  if (!isAstrologyGlossaryConceptId(conceptId)) {
    throw new TypeError('Unknown astrology glossary concept ID');
  }

  const locale = parseSupportedLocale(requestedLocale);
  if (locale === null) {
    throw new TypeError('Unsupported locale for astrology glossary resolution');
  }

  const entry = repository.getEntry(conceptId);
  const canonicalRevision = entry.canonicalTerminologyRevision;

  if (locale === DEFAULT_LOCALE) {
    return {
      conceptId,
      requestedLocale: locale,
      resolvedLocale: DEFAULT_LOCALE,
      displayTerm: entry.canonicalEnglishTerm,
      ...(entry.shortForm === undefined ? {} : { shortForm: entry.shortForm }),
      ...(entry.aliases === undefined ? {} : { aliases: entry.aliases }),
      fallbackUsed: false,
      availability: 'CANONICAL_ENGLISH',
      canonicalRevision
    };
  }

  const variant = repository.findLocaleVariant(conceptId, locale);
  const isPublishable = variant !== undefined &&
    variant.approvalState === 'APPROVED' &&
    variant.currentness === 'CURRENT' &&
    variant.canonicalTerminologyVersion === entry.canonicalTerminologyVersion &&
    variant.reviewedAgainstCanonicalTerminologyRevision === canonicalRevision;

  if (isPublishable && variant !== undefined) {
    return {
      conceptId,
      requestedLocale: locale,
      resolvedLocale: locale,
      displayTerm: variant.professionalDisplayTerm,
      ...(variant.shortForm === undefined ? {} : { shortForm: variant.shortForm }),
      ...(variant.aliases === undefined ? {} : { aliases: variant.aliases }),
      fallbackUsed: false,
      availability: 'LOCALIZED_APPROVED_CURRENT',
      canonicalRevision
    };
  }

  return {
    conceptId,
    requestedLocale: locale,
    resolvedLocale: DEFAULT_LOCALE,
    displayTerm: entry.canonicalEnglishTerm,
    ...(entry.shortForm === undefined ? {} : { shortForm: entry.shortForm }),
    ...(entry.aliases === undefined ? {} : { aliases: entry.aliases }),
    fallbackUsed: true,
    availability: 'ENGLISH_FALLBACK',
    canonicalRevision
  };
}

export function getAstrologyGlossaryAvailability(
  conceptId: AstrologyGlossaryConceptId,
  requestedLocale: SupportedLocale = DEFAULT_LOCALE,
  repository: AstrologyGlossaryRepository = ASTROLOGY_GLOSSARY_REPOSITORY
): AstrologyGlossaryAvailability {
  return resolveAstrologyTerm(conceptId, requestedLocale, repository).availability;
}

export type AstrologyGlossaryDomainKind =
  | 'body'
  | 'sign'
  | 'sign_element'
  | 'sign_modality'
  | 'angle'
  | 'house'
  | 'house_system'
  | 'aspect'
  | 'aspect_phase'
  | 'motion'
  | 'chart_type'
  | 'zodiac_model'
  | 'sky_event'
  | 'lunar_phase';

const DOMAIN_VALUE_MAPS = {
  body: {
    Sun: 'body.sun',
    Moon: 'body.moon',
    Mercury: 'body.mercury',
    Venus: 'body.venus',
    Mars: 'body.mars',
    Jupiter: 'body.jupiter',
    Saturn: 'body.saturn',
    Uranus: 'body.uranus',
    Neptune: 'body.neptune',
    Pluto: 'body.pluto'
  },
  sign: {
    Aries: 'sign.aries',
    Taurus: 'sign.taurus',
    Gemini: 'sign.gemini',
    Cancer: 'sign.cancer',
    Leo: 'sign.leo',
    Virgo: 'sign.virgo',
    Libra: 'sign.libra',
    Scorpio: 'sign.scorpio',
    Sagittarius: 'sign.sagittarius',
    Capricorn: 'sign.capricorn',
    Aquarius: 'sign.aquarius',
    Pisces: 'sign.pisces'
  },
  sign_element: {
    Fire: 'sign_element.fire',
    Earth: 'sign_element.earth',
    Air: 'sign_element.air',
    Water: 'sign_element.water'
  },
  sign_modality: {
    Cardinal: 'sign_modality.cardinal',
    Fixed: 'sign_modality.fixed',
    Mutable: 'sign_modality.mutable'
  },
  angle: {
    ASC: 'angle.ascendant',
    MC: 'angle.midheaven'
  },
  house_system: {
    Placidus: 'house_system.placidus',
    'Whole Sign': 'house_system.whole_sign',
    Equal: 'house_system.equal',
    'Equal House': 'house_system.equal',
    PLACIDUS: 'house_system.placidus',
    WHOLE_SIGN: 'house_system.whole_sign',
    EQUAL: 'house_system.equal'
  },
  aspect: {
    conjunction: 'aspect.conjunction',
    opposition: 'aspect.opposition',
    square: 'aspect.square',
    trine: 'aspect.trine',
    sextile: 'aspect.sextile',
    orb: 'aspect.orb'
  },
  aspect_phase: {
    APPLYING: 'aspect_phase.applying',
    EXACT: 'aspect_phase.exact',
    SEPARATING: 'aspect_phase.separating'
  },
  motion: {
    RETROGRADE: 'motion.retrograde',
    DIRECT: 'motion.direct',
    STATIONARY: 'motion.stationary'
  },
  chart_type: {
    natal: 'chart_type.natal'
  },
  zodiac_model: {
    TROPICAL: 'zodiac_model.tropical'
  },
  sky_event: {
    INGRESS: 'sky_event.ingress',
    STATION: 'sky_event.station',
    LUNATION: 'sky_event.lunation',
    ECLIPSE: 'sky_event.eclipse'
  },
  lunar_phase: {
    FULL_MOON: 'lunar_phase.full_moon'
  }
} as const satisfies Partial<
  Record<AstrologyGlossaryDomainKind, Readonly<Record<string, AstrologyGlossaryConceptId>>>
>;

const HOUSE_CONCEPT_IDS: Readonly<Record<number, AstrologyGlossaryConceptId>> = {
  1: 'house.1',
  2: 'house.2',
  3: 'house.3',
  4: 'house.4',
  5: 'house.5',
  6: 'house.6',
  7: 'house.7',
  8: 'house.8',
  9: 'house.9',
  10: 'house.10',
  11: 'house.11',
  12: 'house.12'
};

/** Maps current stable domain values to glossary IDs without using display labels as identity. */
export function getAstrologyGlossaryConceptId(
  kind: AstrologyGlossaryDomainKind,
  value: unknown
): AstrologyGlossaryConceptId | null {
  if (kind === 'house') {
    return typeof value === 'number' && Number.isInteger(value)
      ? HOUSE_CONCEPT_IDS[value] ?? null
      : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const valueMap = (
    DOMAIN_VALUE_MAPS as Partial<
      Record<AstrologyGlossaryDomainKind, Readonly<Record<string, AstrologyGlossaryConceptId>>>
    >
  )[kind];
  return valueMap?.[value] ?? null;
}

/** Resolves current domain values while leaving the underlying value untouched. */
export function resolveAstrologyDomainTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  requestedLocale: SupportedLocale = DEFAULT_LOCALE,
  repository: AstrologyGlossaryRepository = ASTROLOGY_GLOSSARY_REPOSITORY
): AstrologyTermResolution | null {
  const conceptId = getAstrologyGlossaryConceptId(kind, value);
  return conceptId === null
    ? null
    : resolveAstrologyTerm(conceptId, requestedLocale, repository);
}

export function getAstrologyGlossaryNotation(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  notation: keyof AstrologyGlossaryNotation
): string | undefined {
  const conceptId = getAstrologyGlossaryConceptId(kind, value);
  return conceptId === null
    ? undefined
    : getAstrologyGlossaryEntry(conceptId).notation?.[notation];
}
