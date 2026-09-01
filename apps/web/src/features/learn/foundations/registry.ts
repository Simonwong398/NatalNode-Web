import type { AstrologyGlossaryConceptId } from '../../../lib/astrology-glossary.js';
import {
  parseSupportedLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale
} from '../../../lib/localization.js';

export const FOUNDATIONS_COURSE_FAMILY_ID = 'foundations' as const;
export const FOUNDATIONS_COURSE_ID = 'foundations.v1' as const;
export const FOUNDATIONS_COURSE_VERSION = 'v1' as const;
export const FOUNDATIONS_CANONICAL_LOCALE = 'en' as const;
export const FOUNDATIONS_INITIAL_CONTENT_REVISION = 1 as const;
export const FOUNDATIONS_LESSON_COUNT = 12 as const;

export const FOUNDATIONS_SECTION_IDS = [
  'orientation',
  'core_concept',
  'professional_vocabulary',
  'example',
  'my_chart',
  'practice',
  'check_understanding',
  'key_takeaway'
] as const;

export type FoundationsSectionId = (typeof FOUNDATIONS_SECTION_IDS)[number];

export const FOUNDATIONS_MY_CHART_HOOK_IDS = [
  'my_chart.chart_structure',
  'my_chart.zodiac_structure',
  'my_chart.calculation_details',
  'my_chart.luminaries',
  'my_chart.personal_planets',
  'my_chart.planet_overview',
  'my_chart.houses_angles',
  'my_chart.placement',
  'my_chart.major_aspects',
  'my_chart.chart_priorities',
  'my_chart.whole_chart',
  'my_chart.responsible_use'
] as const;

export type FoundationsMyChartHookId = (typeof FOUNDATIONS_MY_CHART_HOOK_IDS)[number];

export type FoundationsContentState = 'MISSING' | 'DRAFT' | 'REVIEW' | 'APPROVED';
export type FoundationsContentCurrentness = 'CURRENT' | 'OUTDATED';
export type FoundationsContentAvailability = 'AVAILABLE' | 'UNAVAILABLE';
export type FoundationsContentKind = 'SCAFFOLD' | 'CANONICAL';

export interface FoundationsMyChartHook {
  readonly hookId: FoundationsMyChartHookId;
  readonly capability:
    | 'CHART_STRUCTURE'
    | 'ZODIAC_STRUCTURE'
    | 'CALCULATION_DETAILS'
    | 'LUMINARIES'
    | 'PERSONAL_PLANETS'
    | 'PLANET_OVERVIEW'
    | 'HOUSES_AND_ANGLES'
    | 'PLANET_SIGN_HOUSE'
    | 'MAJOR_ASPECTS'
    | 'CHART_PRIORITIES'
    | 'WHOLE_CHART'
    | 'RESPONSIBLE_USE';
  readonly targetPath: '/' | '/methodology/';
  readonly birthTimeRequirement: 'NOT_REQUIRED' | 'REQUIRED_FOR_TIME_DEPENDENT_FACTS';
}

export interface FoundationsLesson {
  readonly lessonId: FoundationsLessonId;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly courseVersion: typeof FOUNDATIONS_COURSE_VERSION;
  readonly order: number;
  readonly slug: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly estimatedMinutes: number | null;
  readonly sectionIds: readonly FoundationsSectionId[];
  readonly myChartHook: FoundationsMyChartHook;
  readonly glossaryConceptIds: readonly AstrologyGlossaryConceptId[];
}

export interface FoundationsContentVariant {
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly courseVersion: typeof FOUNDATIONS_COURSE_VERSION;
  readonly lessonId: FoundationsLessonId;
  readonly canonicalLocale: typeof FOUNDATIONS_CANONICAL_LOCALE;
  readonly locale: SupportedLocale;
  readonly contentRevision: number;
  readonly canonicalContentRevision: number;
  readonly contentState: FoundationsContentState;
  readonly currentness: FoundationsContentCurrentness;
  readonly contentKind: FoundationsContentKind;
  readonly shortDescription?: string;
  readonly learningObjectives?: readonly string[];
  readonly sectionIds: readonly FoundationsSectionId[];
  readonly keyTakeaway?: string;
}

export interface FoundationsCourse {
  readonly courseFamilyId: typeof FOUNDATIONS_COURSE_FAMILY_ID;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly courseVersion: typeof FOUNDATIONS_COURSE_VERSION;
  readonly canonicalLocale: typeof FOUNDATIONS_CANONICAL_LOCALE;
  readonly initialContentRevision: typeof FOUNDATIONS_INITIAL_CONTENT_REVISION;
  readonly lessonCount: typeof FOUNDATIONS_LESSON_COUNT;
}

const sectionIds = Object.freeze([...FOUNDATIONS_SECTION_IDS]);

function createMyChartHook(
  hookId: FoundationsMyChartHookId,
  capability: FoundationsMyChartHook['capability'],
  targetPath: FoundationsMyChartHook['targetPath'],
  birthTimeRequirement: FoundationsMyChartHook['birthTimeRequirement']
): FoundationsMyChartHook {
  return Object.freeze({ hookId, capability, targetPath, birthTimeRequirement });
}

function createLesson(
  lessonId: FoundationsLessonId,
  order: number,
  slug: string,
  title: string,
  shortDescription: string,
  myChartHook: FoundationsMyChartHook,
  glossaryConceptIds: readonly AstrologyGlossaryConceptId[]
): FoundationsLesson {
  return Object.freeze({
    lessonId,
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: FOUNDATIONS_COURSE_VERSION,
    order,
    slug,
    title,
    shortDescription,
    estimatedMinutes: null,
    sectionIds,
    myChartHook,
    glossaryConceptIds: Object.freeze([...glossaryConceptIds])
  });
}

export const FOUNDATIONS_COURSE: FoundationsCourse = Object.freeze({
  courseFamilyId: FOUNDATIONS_COURSE_FAMILY_ID,
  courseId: FOUNDATIONS_COURSE_ID,
  courseVersion: FOUNDATIONS_COURSE_VERSION,
  canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
  initialContentRevision: FOUNDATIONS_INITIAL_CONTENT_REVISION,
  lessonCount: FOUNDATIONS_LESSON_COUNT
});

export const FOUNDATIONS_LESSON_IDS = [
  'foundations.natal_chart',
  'foundations.zodiac_structure',
  'foundations.chart_calculation',
  'foundations.sun_moon',
  'foundations.mercury_venus_mars',
  'foundations.jupiter_saturn_outer_planets',
  'foundations.houses_angles',
  'foundations.planet_sign_house',
  'foundations.aspects',
  'foundations.chart_priorities',
  'foundations.whole_chart',
  'foundations.responsible_astrology'
] as const;

export type FoundationsLessonId = (typeof FOUNDATIONS_LESSON_IDS)[number];

type FoundationsCanonicalEnglishAdmission = Readonly<{
  contentRevision: number;
  canonicalContentRevision: number;
}>;

const FOUNDATIONS_ADMITTED_ENGLISH_REVISIONS: Readonly<
  Partial<Record<FoundationsLessonId, FoundationsCanonicalEnglishAdmission>>
> = Object.freeze({
  'foundations.natal_chart': Object.freeze({
    contentRevision: 3,
    canonicalContentRevision: 3
  }),
  'foundations.zodiac_structure': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 2
  }),
  'foundations.chart_calculation': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 2
  }),
  'foundations.sun_moon': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.mercury_venus_mars': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.jupiter_saturn_outer_planets': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.houses_angles': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.planet_sign_house': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.aspects': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  })
});

export const FOUNDATIONS_LESSONS: readonly FoundationsLesson[] = Object.freeze([
  createLesson(
    'foundations.natal_chart',
    1,
    'what-a-natal-chart-actually-is',
    'What a Natal Chart Actually Is',
    'Establish the chart as a structured representation; name inputs, chart layers, and the calculation/interpretation boundary.',
    createMyChartHook('my_chart.chart_structure', 'CHART_STRUCTURE', '/', 'NOT_REQUIRED'),
    ['chart_type.natal']
  ),
  createLesson(
    'foundations.zodiac_structure',
    2,
    'the-zodiac-polarity-elements-and-modes',
    'The Zodiac: Elements and Modes',
    'Introduce the twelve-sign framework, elements, and modes without turning groupings into personality determinism.',
    createMyChartHook('my_chart.zodiac_structure', 'ZODIAC_STRUCTURE', '/', 'NOT_REQUIRED'),
    ['sign_element.fire', 'sign_element.earth', 'sign_element.air', 'sign_element.water', 'sign_modality.cardinal', 'sign_modality.fixed', 'sign_modality.mutable']
  ),
  createLesson(
    'foundations.chart_calculation',
    3,
    'how-the-sky-becomes-a-chart',
    'How the Sky Becomes a Chart',
    'Explain the high-level date/time/place input path, time-zone responsibility, chart notation, warnings, and research/incomplete states.',
    createMyChartHook('my_chart.calculation_details', 'CALCULATION_DETAILS', '/methodology/', 'NOT_REQUIRED'),
    ['chart_type.natal', 'zodiac_model.tropical']
  ),
  createLesson(
    'foundations.sun_moon',
    4,
    'the-sun-and-moon',
    'The Sun and Moon',
    'Introduce the luminaries as chart components and compare their roles within broad beginner vocabulary, without universalizing one school’s interpretation.',
    createMyChartHook('my_chart.luminaries', 'LUMINARIES', '/', 'NOT_REQUIRED'),
    ['body.sun', 'body.moon']
  ),
  createLesson(
    'foundations.mercury_venus_mars',
    5,
    'mercury-venus-and-mars',
    'Mercury, Venus, and Mars',
    'Build a first vocabulary for the personal planets and show how planet meaning remains distinct from sign and house context.',
    createMyChartHook('my_chart.personal_planets', 'PERSONAL_PLANETS', '/', 'NOT_REQUIRED'),
    ['body.mercury', 'body.venus', 'body.mars']
  ),
  createLesson(
    'foundations.jupiter_saturn_outer_planets',
    6,
    'jupiter-saturn-and-the-outer-planets',
    'Jupiter, Saturn, and the Outer Planets',
    'Introduce the social and outer-planet grouping used by the course, including the difference between broad cohort context and personal placement claims.',
    createMyChartHook('my_chart.planet_overview', 'PLANET_OVERVIEW', '/', 'NOT_REQUIRED'),
    ['body.jupiter', 'body.saturn', 'body.uranus', 'body.neptune', 'body.pluto']
  ),
  createLesson(
    'foundations.houses_angles',
    7,
    'the-twelve-houses-and-the-angles',
    'The Twelve Houses and the Angles',
    'Explain the twelve houses, ASC/MC, time sensitivity, and why house-based claims require supported birth-time input.',
    createMyChartHook('my_chart.houses_angles', 'HOUSES_AND_ANGLES', '/', 'REQUIRED_FOR_TIME_DEPENDENT_FACTS'),
    ['angle.ascendant', 'angle.midheaven', 'house.cusp']
  ),
  createLesson(
    'foundations.planet_sign_house',
    8,
    'planet-sign-house',
    'Planet × Sign × House',
    'Teach the three-layer synthesis pattern and how to write a bounded interpretation from explicit inputs.',
    createMyChartHook('my_chart.placement', 'PLANET_SIGN_HOUSE', '/', 'REQUIRED_FOR_TIME_DEPENDENT_FACTS'),
    ['body.sun', 'sign.aries', 'house.1']
  ),
  createLesson(
    'foundations.aspects',
    9,
    'aspects-relationships-between-planets',
    'Aspects: Relationships Between Planets',
    'Introduce the five major aspects, orb, and applying/exact/separating phase vocabulary; separate geometry from interpretation.',
    createMyChartHook('my_chart.major_aspects', 'MAJOR_ASPECTS', '/', 'NOT_REQUIRED'),
    ['aspect.conjunction', 'aspect.opposition', 'aspect.square', 'aspect.trine', 'aspect.sextile', 'aspect.orb', 'aspect_phase.applying', 'aspect_phase.exact', 'aspect_phase.separating']
  ),
  createLesson(
    'foundations.chart_priorities',
    10,
    'what-matters-first-in-a-chart',
    'What Matters First in a Chart',
    'Establish a prioritization method: input quality, chart structure, prominent/explicit facts, relationships, then synthesis.',
    createMyChartHook('my_chart.chart_priorities', 'CHART_PRIORITIES', '/', 'NOT_REQUIRED'),
    ['chart_type.natal']
  ),
  createLesson(
    'foundations.whole_chart',
    11,
    'reading-the-chart-as-a-whole',
    'Reading the Chart as a Whole',
    'Combine the course vocabulary into a repeatable whole-chart workflow and show how competing signals remain qualified.',
    createMyChartHook('my_chart.whole_chart', 'WHOLE_CHART', '/', 'REQUIRED_FOR_TIME_DEPENDENT_FACTS'),
    ['chart_type.natal']
  ),
  createLesson(
    'foundations.responsible_astrology',
    12,
    'using-astrology-responsibly',
    'Using Astrology Responsibly',
    'Close with epistemic status, uncertainty, multi-school humility, privacy, agency, and non-diagnostic/non-deterministic use.',
    createMyChartHook('my_chart.responsible_use', 'RESPONSIBLE_USE', '/methodology/', 'NOT_REQUIRED'),
    ['chart_type.natal']
  )
]);

interface EnglishScaffold {
  readonly shortDescription: string;
  readonly learningObjectives: readonly [string, string];
  readonly keyTakeaway: string;
}

const ENGLISH_SCAFFOLDS: Readonly<Record<FoundationsLessonId, EnglishScaffold>> = {
  'foundations.natal_chart': {
    shortDescription: FOUNDATIONS_LESSONS[0].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[0].shortDescription,
      'Label chart regions and sort examples into calculated versus interpreted.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[0].shortDescription
  },
  'foundations.zodiac_structure': {
    shortDescription: FOUNDATIONS_LESSONS[1].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[1].shortDescription,
      'Classify sign-group examples and explain what the grouping does and does not establish.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[1].shortDescription
  },
  'foundations.chart_calculation': {
    shortDescription: FOUNDATIONS_LESSONS[2].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[2].shortDescription,
      'Trace an input-to-chart flow and identify why an unknown birth time limits claims.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[2].shortDescription
  },
  'foundations.sun_moon': {
    shortDescription: FOUNDATIONS_LESSONS[3].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[3].shortDescription,
      'Compare two bounded placement examples and identify the supporting chart facts.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[3].shortDescription
  },
  'foundations.mercury_venus_mars': {
    shortDescription: FOUNDATIONS_LESSONS[4].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[4].shortDescription,
      'Identify the planet layer in short chart statements and keep interpretation qualified.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[4].shortDescription
  },
  'foundations.jupiter_saturn_outer_planets': {
    shortDescription: FOUNDATIONS_LESSONS[5].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[5].shortDescription,
      'Compare a planet-group label with a chart-specific fact; flag claims that need more context.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[5].shortDescription
  },
  'foundations.houses_angles': {
    shortDescription: FOUNDATIONS_LESSONS[6].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[6].shortDescription,
      'Match a house/angle notation example to its layer and identify unavailable unknown-time fields.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[6].shortDescription
  },
  'foundations.planet_sign_house': {
    shortDescription: FOUNDATIONS_LESSONS[7].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[7].shortDescription,
      'Complete a Planet × Sign × House synthesis using a provided example, not invented chart facts.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[7].shortDescription
  },
  'foundations.aspects': {
    shortDescription: FOUNDATIONS_LESSONS[8].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[8].shortDescription,
      'Classify aspect examples and explain why one aspect is not a complete reading.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[8].shortDescription
  },
  'foundations.chart_priorities': {
    shortDescription: FOUNDATIONS_LESSONS[9].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[9].shortDescription,
      'Rank a small set of chart facts and justify the order without adding unsupported techniques.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[9].shortDescription
  },
  'foundations.whole_chart': {
    shortDescription: FOUNDATIONS_LESSONS[10].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[10].shortDescription,
      'Produce a short structured reading outline from an approved example and cite its inputs.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[10].shortDescription
  },
  'foundations.responsible_astrology': {
    shortDescription: FOUNDATIONS_LESSONS[11].shortDescription,
    learningObjectives: [
      FOUNDATIONS_LESSONS[11].shortDescription,
      'Identify overclaims, repair them into bounded language, and complete the final-check preparation.'
    ],
    keyTakeaway: FOUNDATIONS_LESSONS[11].shortDescription
  }
};

function createContentVariant(
  lesson: FoundationsLesson,
  locale: SupportedLocale
): FoundationsContentVariant {
  if (locale !== FOUNDATIONS_CANONICAL_LOCALE) {
    return Object.freeze({
      courseId: FOUNDATIONS_COURSE_ID,
      courseVersion: FOUNDATIONS_COURSE_VERSION,
      lessonId: lesson.lessonId,
      canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
      locale,
      contentRevision: FOUNDATIONS_INITIAL_CONTENT_REVISION,
      canonicalContentRevision: FOUNDATIONS_INITIAL_CONTENT_REVISION,
      contentState: 'MISSING',
      currentness: 'OUTDATED',
      contentKind: 'SCAFFOLD',
      sectionIds
    });
  }

  const scaffold = ENGLISH_SCAFFOLDS[lesson.lessonId];
  const admittedRevision = FOUNDATIONS_ADMITTED_ENGLISH_REVISIONS[lesson.lessonId];

  if (admittedRevision !== undefined) {
    return Object.freeze({
      courseId: FOUNDATIONS_COURSE_ID,
      courseVersion: FOUNDATIONS_COURSE_VERSION,
      lessonId: lesson.lessonId,
      canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
      locale,
      contentRevision: admittedRevision.contentRevision,
      canonicalContentRevision: admittedRevision.canonicalContentRevision,
      contentState: 'APPROVED',
      currentness: 'CURRENT',
      contentKind: 'CANONICAL',
      shortDescription: scaffold.shortDescription,
      learningObjectives: Object.freeze([...scaffold.learningObjectives]),
      sectionIds,
      keyTakeaway: scaffold.keyTakeaway
    });
  }

  return Object.freeze({
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: FOUNDATIONS_COURSE_VERSION,
    lessonId: lesson.lessonId,
    canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
    locale,
    contentRevision: FOUNDATIONS_INITIAL_CONTENT_REVISION,
    canonicalContentRevision: FOUNDATIONS_INITIAL_CONTENT_REVISION,
    contentState: 'APPROVED',
    currentness: 'CURRENT',
    contentKind: 'SCAFFOLD',
    shortDescription: scaffold.shortDescription,
    learningObjectives: Object.freeze([...scaffold.learningObjectives]),
    sectionIds,
    keyTakeaway: scaffold.keyTakeaway
  });
}

type FoundationsContentVariantSet = Readonly<
  Record<SupportedLocale, FoundationsContentVariant>
>;

export const FOUNDATIONS_CONTENT_VARIANTS: Readonly<
  Record<FoundationsLessonId, FoundationsContentVariantSet>
> = Object.freeze(
  Object.fromEntries(
    FOUNDATIONS_LESSONS.map((lesson) => [
      lesson.lessonId,
      Object.freeze(
        Object.fromEntries(
          SUPPORTED_LOCALES.map((locale) => [locale, createContentVariant(lesson, locale)])
        ) as FoundationsContentVariantSet
      )
    ])
  ) as Record<FoundationsLessonId, FoundationsContentVariantSet>
);

export function getFoundationsLessonById(
  lessonId: unknown
): FoundationsLesson | null {
  return typeof lessonId === 'string'
    ? FOUNDATIONS_LESSONS.find((lesson) => lesson.lessonId === lessonId) ?? null
    : null;
}

export function getFoundationsLessonBySlug(slug: unknown): FoundationsLesson | null {
  return typeof slug === 'string'
    ? FOUNDATIONS_LESSONS.find((lesson) => lesson.slug === slug) ?? null
    : null;
}

export function getFoundationsContentVariant(
  lessonId: unknown,
  locale: unknown
): FoundationsContentVariant | null {
  const lesson = getFoundationsLessonById(lessonId);
  const parsedLocale = parseSupportedLocale(locale);

  return lesson === null || parsedLocale === null
    ? null
    : FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId][parsedLocale];
}

export function getFoundationsContentAvailability(
  variant: FoundationsContentVariant | null
): FoundationsContentAvailability {
  return variant?.contentState === 'APPROVED' && variant.currentness === 'CURRENT'
    ? 'AVAILABLE'
    : 'UNAVAILABLE';
}

export function isFoundationsCoreReady(): boolean {
  return FOUNDATIONS_LESSONS.every((lesson) =>
    SUPPORTED_LOCALES.every((locale) =>
      getFoundationsContentAvailability(
        FOUNDATIONS_CONTENT_VARIANTS[lesson.lessonId][locale]
      ) === 'AVAILABLE'
    )
  );
}

export function getFoundationsAdjacentLessons(
  lessonId: unknown
): { readonly previous: FoundationsLesson | null; readonly next: FoundationsLesson | null } {
  const index = FOUNDATIONS_LESSONS.findIndex((lesson) => lesson.lessonId === lessonId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: FOUNDATIONS_LESSONS[index - 1] ?? null,
    next: FOUNDATIONS_LESSONS[index + 1] ?? null
  };
}
