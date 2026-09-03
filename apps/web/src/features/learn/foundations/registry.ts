import type { AstrologyGlossaryConceptId } from '../../../core/astrology-taxonomy/astrology-glossary.js';
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
  }),
  'foundations.chart_priorities': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.whole_chart': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  }),
  'foundations.responsible_astrology': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1
  })
});

type FoundationsLocalizedAdmission = Readonly<{
  contentRevision: number;
  canonicalContentRevision: number;
  shortDescription: string;
  learningObjectives: readonly [string, string];
  keyTakeaway: string;
}>;

const FOUNDATIONS_ADMITTED_ZH_HANT: Readonly<
  Partial<Record<FoundationsLessonId, FoundationsLocalizedAdmission>>
> = Object.freeze({
  'foundations.natal_chart': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 3,
    shortDescription: '建立本命盤作為結構化地圖的概念，並區分輸入、命盤事實與占星術詮釋。',
    learningObjectives: [
      '辨認命盤的天體、星座、宮位、角點與相位層次。',
      '區分計算結果、輸入脈絡、詮釋與不受支持的過度主張。'
    ] as const,
    keyTakeaway: '本命盤以特定出生輸入建立結構；詮釋為這個結構提供占星術語言，但不等於對完整個人的判決。'
  }),
  'foundations.zodiac_structure': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 2,
    shortDescription: '認識十二個黃道星座、元素與模式，並將傳統分類保持為詮釋提示而非人格定論。',
    learningObjectives: [
      '依照十二星座的元素與模式分類讀取黃道結構。',
      '說明黃道星座與天文星座的差異，以及元素與模式不能單獨確立什麼。'
    ] as const,
    keyTakeaway: '每個黃道星座都有一種元素與一種模式；兩者提供不同的傳統面向，但不會決定一個人。'
  }),
  'foundations.chart_calculation': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 2,
    shortDescription: '沿著出生日期、當地時間與地點到命盤呈現的路徑，理解時間規則、角點、宮位與未知時間限制。',
    learningObjectives: [
      '追蹤從出生輸入到位置、星座、角點、宮位系統與命盤呈現的高層次流程。',
      '說明為什麼出生時間未知會限制上升點、中天、宮位、宮頭與宮位詮釋。'
    ] as const,
    keyTakeaway: '命盤把記錄下來的當地出生時刻與地點轉換成結構化地圖；詮釋必須在受支持的結構建立並呈現之後進行。'
  }),
  'foundations.sun_moon': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1,
    shortDescription: '區分太陽與月亮作為命盤天體的不同詮釋問題，同時保留天文學分類與占星術慣例的分層。',
    learningObjectives: [
      '用有意識的取向、能動性與目的描述太陽的廣泛象徵問題。',
      '用反應、需求、習慣與熟悉感描述月亮的廣泛象徵問題，並加入受支持的脈絡。'
    ] as const,
    keyTakeaway: '太陽與月亮是不同的命盤天體象徵；星座、宮位與相位增加脈絡，但不會把任何一個光體變成決定論的判決。'
  }),
  'foundations.mercury_venus_mars': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1,
    shortDescription: '建立水星、金星與火星的初學功能詞彙，並避免把它們縮減為 IQ、浪漫或攻擊性的刻板印象。',
    learningObjectives: [
      '區分水星的資訊處理、金星的價值與關係互動，以及火星的追求、自我主張與行動。',
      '在加入星座、宮位或相位脈絡時，保持天體功能與詮釋的界線。'
    ] as const,
    keyTakeaway: '水星處理與交換資訊，金星探索價值與關係互動，火星探索追求、自我主張與行動；它們都需要脈絡與限定語言。'
  }),
  'foundations.jupiter_saturn_outer_planets': Object.freeze({
    contentRevision: 1,
    canonicalContentRevision: 1,
    shortDescription: '認識木星、土星與外行星的入門分組，並區分個人詮釋、世代脈絡與天文學分類。',
    learningObjectives: [
      '比較木星的擴展與意義、土星的結構與責任，以及外行星較慢的集體脈絡。',
      '說明冥王星作為命盤天體的占星術用法不會改變它在天文學上的矮行星分類。'
    ] as const,
    keyTakeaway: '木星開啟成長與意義的問題，土星關於結構與責任，外行星需要更廣脈絡；冥王星在天文學上仍是矮行星。'
  }),
  'foundations.houses_angles': Object.freeze({
    contentRevision: 3,
    canonicalContentRevision: 1,
    shortDescription: '理解十二宮位與 ASC、DSC、MC、IC 兩條軸線，並掌握出生時間與地點對這一層的限制。',
    learningObjectives: [
      '區分星座、天體、宮位、宮頭與角點，並辨認三種入門宮位系統。',
      '說明可靠出生時間未知時，為什麼不能猜出角點、宮位或宮頭。'
    ] as const,
    keyTakeaway: '宮位整理命盤空間脈絡，四個角點形成兩條對時間與地點敏感的軸線；未知時間不得被猜測填補。'
  }),
  'foundations.planet_sign_house': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 1,
    shortDescription: '用「天體 × 星座 × 宮位」作為有限的入門詮釋框架，先分層再把受支持的脈絡謹慎連結。',
    learningObjectives: [
      '按天體功能、星座風格與受支持的宮位脈絡順序閱讀一個落點。',
      '在宮位缺失或出生時間未知時，只討論受支持的天體與星座層次。'
    ] as const,
    keyTakeaway: '天體 × 星座 × 宮位是入門框架，不是完整公式、食譜，也不能取代更廣的命盤脈絡與可靠輸入。'
  }),
  'foundations.aspects': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 1,
    shortDescription: '認識五種主要相位、容許度與階段標籤，並將幾何關係與占星術詮釋保持在不同證據層。',
    learningObjectives: [
      '辨認 0°、60°、90°、120° 與 180° 的主要相位目標角度。',
      '說明容許度與 applying、exact、separating 是如何描述回傳關係，而不是好壞分數或預測。'
    ] as const,
    keyTakeaway: '相位是角度關係；容許度與階段標籤可以細化描述，但詮釋仍由天體與更廣脈絡形塑。'
  }),
  'foundations.chart_priorities': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 1,
    shortDescription: '建立從受支持事實到相關關係與綜合的透明閱讀順序，不建立主導行星分數或排名演算法。',
    learningObjectives: [
      '先確認輸入品質與回傳結構，再依照相關角點、重複主題與主要相位安排注意順序。',
      '說明顯著性可以引導詮釋注意，但不等於客觀重要性、因果或確定性。'
    ] as const,
    keyTakeaway: '優先順序是一種透明的詮釋安排：從受支持事實開始，限定結果，並排除不受支持的層次。'
  }),
  'foundations.whole_chart': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 1,
    shortDescription: '把受支持的命盤事實連結成少數有界線的線索，讓對照主題與未知狀態保持可見。',
    learningObjectives: [
      '依照事實、詮釋觀察、相關模式與有條件綜合的順序建立短而可追溯的閱讀。',
      '在證據、脈絡或出生時間不足時套用停止規則，不把整體命盤當成完整的人生解釋。'
    ] as const,
    keyTakeaway: '整體閱讀命盤，是把受支持的事實連結成有條件的線索，讓張力保持可見，並在證據用盡時停止。'
  }),
  'foundations.responsible_astrology': Object.freeze({
    contentRevision: 2,
    canonicalContentRevision: 1,
    shortDescription: '以相稱語言區分事實、慣例與不確定性，保護同意與隱私，並拒絕診斷及高風險確定性。',
    learningObjectives: [
      '辨認過度主張，將其改寫為保留方法、證據、限制與能動性的有界線語句。',
      '在要求診斷、敏感推論、捏造事實或高風險決策時，知道何時停止並指向合格支持。'
    ] as const,
    keyTakeaway: '負責任地使用占星術，意味著區分事實與慣例、保護同意與隱私、拒絕診斷或高風險確定性，並在要求不受支持時停止。'
  })
});

type FoundationsRemainingLocale = Exclude<SupportedLocale, 'en' | 'zh-Hant'>;

const FOUNDATIONS_ADMITTED_REMAINING_LOCALE_REVISIONS: Readonly<
  Record<FoundationsRemainingLocale, readonly number[]>
> = Object.freeze({
  es: Object.freeze([1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1]),
  fr: Object.freeze([1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1]),
  de: Object.freeze([1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1]),
  ja: Object.freeze([1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1]),
  ko: Object.freeze([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
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
    const admittedLocalized = locale === 'zh-Hant'
      ? FOUNDATIONS_ADMITTED_ZH_HANT[lesson.lessonId]
      : undefined;

    const admittedRemainingRevision = locale === 'zh-Hant'
      ? undefined
      : FOUNDATIONS_ADMITTED_REMAINING_LOCALE_REVISIONS[locale][lesson.order - 1];

    if (admittedRemainingRevision !== undefined) {
      const canonicalAdmission = FOUNDATIONS_ADMITTED_ENGLISH_REVISIONS[lesson.lessonId];
      const scaffold = ENGLISH_SCAFFOLDS[lesson.lessonId];

      return Object.freeze({
        courseId: FOUNDATIONS_COURSE_ID,
        courseVersion: FOUNDATIONS_COURSE_VERSION,
        lessonId: lesson.lessonId,
        canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
        locale,
        contentRevision: admittedRemainingRevision,
        canonicalContentRevision:
          canonicalAdmission?.canonicalContentRevision ?? FOUNDATIONS_INITIAL_CONTENT_REVISION,
        contentState: 'APPROVED',
        currentness: 'CURRENT',
        contentKind: 'CANONICAL',
        shortDescription: scaffold.shortDescription,
        learningObjectives: Object.freeze([...scaffold.learningObjectives]),
        sectionIds,
        keyTakeaway: scaffold.keyTakeaway
      });
    }

    if (admittedLocalized !== undefined) {
      return Object.freeze({
        courseId: FOUNDATIONS_COURSE_ID,
        courseVersion: FOUNDATIONS_COURSE_VERSION,
        lessonId: lesson.lessonId,
        canonicalLocale: FOUNDATIONS_CANONICAL_LOCALE,
        locale,
        contentRevision: admittedLocalized.contentRevision,
        canonicalContentRevision: admittedLocalized.canonicalContentRevision,
        contentState: 'APPROVED',
        currentness: 'CURRENT',
        contentKind: 'CANONICAL',
        shortDescription: admittedLocalized.shortDescription,
        learningObjectives: Object.freeze([...admittedLocalized.learningObjectives]),
        sectionIds,
        keyTakeaway: admittedLocalized.keyTakeaway
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
