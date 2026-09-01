import {
  frontmatter as canonicalAssessmentFrontmatter,
  rawContent as readCanonicalAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/en/FINAL_ASSESSMENT.md';
import {
  frontmatter as spanishAssessmentFrontmatter,
  rawContent as readSpanishAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/es/FINAL_ASSESSMENT.md';
import {
  frontmatter as frenchAssessmentFrontmatter,
  rawContent as readFrenchAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/fr/FINAL_ASSESSMENT.md';
import {
  frontmatter as germanAssessmentFrontmatter,
  rawContent as readGermanAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/de/FINAL_ASSESSMENT.md';
import {
  frontmatter as japaneseAssessmentFrontmatter,
  rawContent as readJapaneseAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/ja/FINAL_ASSESSMENT.md';
import {
  frontmatter as koreanAssessmentFrontmatter,
  rawContent as readKoreanAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/ko/FINAL_ASSESSMENT.md';
import {
  frontmatter as traditionalChineseAssessmentFrontmatter,
  rawContent as readTraditionalChineseAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/zh-Hant/FINAL_ASSESSMENT.md';
import {
  parseApprovedFoundationsAssessment,
  parseFoundationsAssessment,
  type FoundationsAssessment
} from './assessment-contract.js';
import {
  SUPPORTED_LOCALES,
  type SupportedLocale
} from '../../../../lib/localization.js';

interface AssessmentDocument {
  readonly frontmatter: Record<string, unknown>;
  readonly rawContent: () => string;
}

function serializeFrontmatterValue(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function toAssessmentMarkdown(document: AssessmentDocument): string {
  return [
    '---',
    ...Object.entries(document.frontmatter).map(
      ([key, value]) => `${key}: ${serializeFrontmatterValue(value)}`
    ),
    '---',
    document.rawContent()
  ].join('\n');
}

const ASSESSMENT_DOCUMENTS: Readonly<Record<SupportedLocale, AssessmentDocument>> = {
  en: {
    frontmatter: canonicalAssessmentFrontmatter,
    rawContent: readCanonicalAssessmentBody
  },
  es: {
    frontmatter: spanishAssessmentFrontmatter,
    rawContent: readSpanishAssessmentBody
  },
  fr: {
    frontmatter: frenchAssessmentFrontmatter,
    rawContent: readFrenchAssessmentBody
  },
  de: {
    frontmatter: germanAssessmentFrontmatter,
    rawContent: readGermanAssessmentBody
  },
  ja: {
    frontmatter: japaneseAssessmentFrontmatter,
    rawContent: readJapaneseAssessmentBody
  },
  ko: {
    frontmatter: koreanAssessmentFrontmatter,
    rawContent: readKoreanAssessmentBody
  },
  'zh-Hant': {
    frontmatter: traditionalChineseAssessmentFrontmatter,
    rawContent: readTraditionalChineseAssessmentBody
  }
};

function parseAssessmentDocument(
  locale: SupportedLocale,
  document: AssessmentDocument
): FoundationsAssessment {
  const markdown = toAssessmentMarkdown(document);
  const assessment = locale === 'en'
    ? parseApprovedFoundationsAssessment(markdown)
    : parseFoundationsAssessment(markdown);

  if (assessment.locale !== locale) {
    throw new Error(`Foundations assessment locale mismatch: expected ${locale}`);
  }

  return assessment;
}

function assertCanonicalAnswerIdentity(
  canonical: FoundationsAssessment,
  localized: FoundationsAssessment
): void {
  if (localized.questions.length !== canonical.questions.length) {
    throw new Error(`Foundations assessment question count mismatch for ${localized.locale}`);
  }

  localized.questions.forEach((question, index) => {
    const canonicalQuestion = canonical.questions[index];
    const localizedOptionIds = question.options.map((option) => option.id);
    const canonicalOptionIds = canonicalQuestion.options.map((option) => option.id);

    if (
      question.id !== canonicalQuestion.id ||
      question.correctAnswerId !== canonicalQuestion.correctAnswerId ||
      JSON.stringify(question.linkedLessonIds) !== JSON.stringify(canonicalQuestion.linkedLessonIds) ||
      JSON.stringify(localizedOptionIds) !== JSON.stringify(canonicalOptionIds)
    ) {
      throw new Error(`Foundations assessment answer identity mismatch for ${localized.locale}`);
    }
  });
}

const parsedAssessments = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    locale,
    parseAssessmentDocument(locale, ASSESSMENT_DOCUMENTS[locale])
  ])
) as Record<SupportedLocale, FoundationsAssessment>;

const canonicalAssessment = parsedAssessments.en;
for (const locale of SUPPORTED_LOCALES) {
  if (locale !== 'en') {
    assertCanonicalAnswerIdentity(canonicalAssessment, parsedAssessments[locale]);
  }
}

/** All committed final-assessment artifacts, parsed through one contract. */
export const FOUNDATIONS_FINAL_ASSESSMENTS: Readonly<
  Record<SupportedLocale, FoundationsAssessment>
> = Object.freeze(parsedAssessments);

export function getFoundationsAssessment(
  locale: SupportedLocale
): FoundationsAssessment | null {
  const assessment = FOUNDATIONS_FINAL_ASSESSMENTS[locale];

  return assessment.contentState === 'APPROVED' &&
    assessment.currentness === 'CURRENT' &&
    assessment.runtimeAvailability === 'AVAILABLE'
    ? assessment
    : null;
}
