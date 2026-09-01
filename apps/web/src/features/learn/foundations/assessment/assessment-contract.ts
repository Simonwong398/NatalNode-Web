export const FOUNDATIONS_FINAL_ASSESSMENT_ID = 'foundations.v1.final_check' as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_CANONICAL_LOCALE = 'en' as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_CONTENT_REVISION = 1 as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT = 10 as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD = 8 as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_RETRY_POLICY = 'unlimited' as const;

export type AssessmentAnswerId = 'A' | 'B' | 'C' | 'D';
export type AssessmentContentState = 'REVIEW' | 'APPROVED';
export type AssessmentCurrentness = 'CURRENT' | 'OUTDATED';
export type AssessmentRuntimeAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface FoundationsAssessmentOption {
  readonly id: AssessmentAnswerId;
  readonly text: string;
}

export interface FoundationsAssessmentQuestion {
  readonly number: number;
  readonly id: string;
  readonly linkedLessonIds: readonly string[];
  readonly prompt: string;
  readonly options: readonly FoundationsAssessmentOption[];
  readonly correctAnswerId: AssessmentAnswerId;
  readonly rationale: string;
}

export interface FoundationsAssessment {
  readonly title: string;
  readonly locale: string;
  readonly courseId: 'foundations.v1';
  readonly courseVersion: 'v1';
  readonly checkId: typeof FOUNDATIONS_FINAL_ASSESSMENT_ID;
  readonly canonicalLocale: typeof FOUNDATIONS_FINAL_ASSESSMENT_CANONICAL_LOCALE;
  readonly contentRevision: typeof FOUNDATIONS_FINAL_ASSESSMENT_CONTENT_REVISION;
  readonly contentState: AssessmentContentState;
  readonly currentness: AssessmentCurrentness;
  readonly runtimeAvailability: AssessmentRuntimeAvailability;
  readonly questionCount: typeof FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT;
  readonly passThreshold: typeof FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD;
  readonly retryPolicy: typeof FOUNDATIONS_FINAL_ASSESSMENT_RETRY_POLICY;
  readonly courseCompletionDependency: false;
  readonly coreReadinessDependency: false;
  readonly futureRewardEligibilityRelevance: true;
  readonly introduction: string;
  readonly questions: readonly FoundationsAssessmentQuestion[];
}

export type AssessmentAnswerMap = Readonly<Record<string, AssessmentAnswerId | null>>;

export interface FoundationsAssessmentResult {
  readonly score: number;
  readonly questionCount: typeof FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT;
  readonly passThreshold: typeof FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD;
  readonly passed: boolean;
  readonly answeredCount: number;
  readonly answers: AssessmentAnswerMap;
  readonly correctQuestionIds: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssessmentAnswerId(value: unknown): value is AssessmentAnswerId {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

function readFrontmatter(markdown: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(markdown);

  if (match === null) {
    throw new Error('Foundations assessment is missing frontmatter');
  }

  return match[1];
}

function readFrontmatterValue(frontmatter: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = new RegExp(`^${escapedKey}:\\s*(.+)$`, 'mu').exec(frontmatter);

  if (match === null) {
    throw new Error(`Foundations assessment is missing frontmatter field: ${key}`);
  }

  return match[1].trim();
}

function readStringField(frontmatter: string, key: string): string {
  const value = readFrontmatterValue(frontmatter, key);

  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value) as string;
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  return value;
}

function readBooleanField(frontmatter: string, key: string): boolean {
  const value = readFrontmatterValue(frontmatter, key);

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`Foundations assessment field is not boolean: ${key}`);
}

function readIntegerField(frontmatter: string, key: string): number {
  const value = readFrontmatterValue(frontmatter, key);
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(`Foundations assessment field is not an integer: ${key}`);
  }

  return parsed;
}

function readPassThreshold(frontmatter: string): number {
  const value = readStringField(frontmatter, 'passThreshold');
  const match = /^(\d+)\/(\d+)$/u.exec(value);

  if (match === null || Number(match[2]) !== FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT) {
    throw new Error('Foundations assessment pass threshold is invalid');
  }

  return Number(match[1]);
}

function readBacktickField(section: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = new RegExp('\\*\\*' + escapedLabel + ':\\*\\*\\s*`([^`]+)`', 'u').exec(section);

  if (match === null) {
    throw new Error(`Foundations assessment question is missing field: ${label}`);
  }

  return match[1];
}

function readLinkedLessonIds(section: string): readonly string[] {
  const match = /\*\*Linked lessons?:\*\*\s*([^\r\n]+)/u.exec(section);

  if (match === null) {
    throw new Error('Foundations assessment question is missing linked lesson field');
  }

  const lessonIds = [...match[1].matchAll(/`([^`]+)`/gu)].map((entry) => entry[1]);

  if (lessonIds.length === 0) {
    throw new Error('Foundations assessment question has no linked lesson ID');
  }

  return Object.freeze(lessonIds);
}

function readQuestionOptions(
  section: string,
  optionStart: number,
  correctAnswerStart: number
): readonly FoundationsAssessmentOption[] {
  const optionsSource = section.slice(optionStart, correctAnswerStart);
  const matches = [...optionsSource.matchAll(/^\*\*([A-D])\.\*\*\s*/gmu)];
  const options = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? optionsSource.length;
    const id = match[1];

    if (!isAssessmentAnswerId(id)) {
      throw new Error('Foundations assessment option has an invalid answer ID');
    }

    return Object.freeze({
      id,
      text: optionsSource.slice(start, end).trim()
    });
  });

  if (
    options.length !== 4 ||
    options.some((option, index) => option.id !== ['A', 'B', 'C', 'D'][index] || option.text === '')
  ) {
    throw new Error('Foundations assessment question must contain exactly A-D options');
  }

  return Object.freeze(options);
}

function readQuestionSection(
  section: string,
  number: number
): FoundationsAssessmentQuestion {
  const questionId = readBacktickField(section, 'Question ID');
  const linkedLessonIds = readLinkedLessonIds(section);
  const optionStart = section.indexOf('**A.**');
  const correctAnswerMatch = /\*\*Correct answer:\*\*\s*\*\*([A-D])\*\*/u.exec(section);
  const rationaleStart = section.indexOf('**Rationale:**');

  if (optionStart < 0 || correctAnswerMatch === null || rationaleStart < 0) {
    throw new Error(`Foundations assessment question is structurally incomplete: ${questionId}`);
  }

  const correctAnswerId = correctAnswerMatch[1];
  if (!isAssessmentAnswerId(correctAnswerId)) {
    throw new Error(`Foundations assessment question has an invalid answer key: ${questionId}`);
  }

  const linkedLessonField = /\*\*Linked lessons?:\*\*\s*[^\r\n]+/u.exec(section);
  const promptStart = (linkedLessonField?.index ?? 0) + (linkedLessonField?.[0].length ?? 0);
  const prompt = section.slice(promptStart, optionStart).trim();
  const rationale = section.slice(rationaleStart + '**Rationale:**'.length).trim();
  const options = readQuestionOptions(
    section,
    optionStart,
    correctAnswerMatch.index ?? section.length
  );

  if (prompt === '' || rationale === '') {
    throw new Error(`Foundations assessment question is missing prompt or rationale: ${questionId}`);
  }

  return Object.freeze({
    number,
    id: questionId,
    linkedLessonIds,
    prompt,
    options,
    correctAnswerId,
    rationale
  });
}

function readIntroduction(markdown: string, firstQuestionStart: number): string {
  const heading = /^# [^\r\n]+/mu.exec(markdown);

  if (heading === null) {
    throw new Error('Foundations assessment is missing its title heading');
  }

  const introduction = markdown
    .slice((heading.index ?? 0) + heading[0].length, firstQuestionStart)
    .split(/\r?\n\r?\n/gu)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
    .slice(0, 2)
    .join('\n\n');

  if (introduction === '') {
    throw new Error('Foundations assessment is missing its introduction');
  }

  return introduction;
}

/** Parses the committed Markdown assessment artifact without creating a second question source. */
export function parseFoundationsAssessment(markdown: string): FoundationsAssessment {
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    throw new TypeError('Foundations assessment Markdown must be a non-empty string');
  }

  const frontmatter = readFrontmatter(markdown);
  const questionMatches = [...markdown.matchAll(/^## Question (\d+) — ([^\r\n]+)$/gmu)];

  if (questionMatches.length !== FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT) {
    throw new Error('Foundations assessment must contain exactly ten questions');
  }

  const contentBoundaryStart = markdown.indexOf('\n## Content boundary');
  const firstQuestionStart = questionMatches[0].index ?? markdown.length;
  const questions = questionMatches.map((match, index) => {
    const number = Number(match[1]);
    const nextStart = questionMatches[index + 1]?.index ?? (contentBoundaryStart >= 0 ? contentBoundaryStart : markdown.length);

    if (number !== index + 1) {
      throw new Error('Foundations assessment question numbering is not sequential');
    }

    return readQuestionSection(
      markdown.slice((match.index ?? 0) + match[0].length, nextStart),
      number
    );
  });

  const questionIds = questions.map((question) => question.id);
  if (new Set(questionIds).size !== questionIds.length) {
    throw new Error('Foundations assessment question IDs must be unique');
  }

  const assessment = {
    title: readStringField(frontmatter, 'title'),
    locale: readStringField(frontmatter, 'locale'),
    courseId: readStringField(frontmatter, 'courseId'),
    courseVersion: readStringField(frontmatter, 'courseVersion'),
    checkId: readStringField(frontmatter, 'checkId'),
    canonicalLocale: readStringField(frontmatter, 'canonicalLocale'),
    contentRevision: readIntegerField(frontmatter, 'contentRevision'),
    contentState: readStringField(frontmatter, 'contentState'),
    currentness: readStringField(frontmatter, 'currentness'),
    runtimeAvailability: readStringField(frontmatter, 'runtimeAvailability'),
    questionCount: readIntegerField(frontmatter, 'questionCount'),
    passThreshold: readPassThreshold(frontmatter),
    retryPolicy: readStringField(frontmatter, 'retryPolicy'),
    courseCompletionDependency: readBooleanField(frontmatter, 'courseCompletionDependency'),
    coreReadinessDependency: readBooleanField(frontmatter, 'coreReadinessDependency'),
    futureRewardEligibilityRelevance: readBooleanField(frontmatter, 'futureRewardEligibilityRelevance'),
    introduction: readIntroduction(markdown, firstQuestionStart),
    questions: Object.freeze(questions)
  } as FoundationsAssessment;

  if (
    assessment.locale === '' ||
    assessment.courseId !== 'foundations.v1' ||
    assessment.courseVersion !== 'v1' ||
    assessment.checkId !== FOUNDATIONS_FINAL_ASSESSMENT_ID ||
    assessment.canonicalLocale !== FOUNDATIONS_FINAL_ASSESSMENT_CANONICAL_LOCALE ||
    assessment.contentRevision !== FOUNDATIONS_FINAL_ASSESSMENT_CONTENT_REVISION ||
    assessment.questionCount !== FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT ||
    assessment.passThreshold !== FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD ||
    assessment.retryPolicy !== FOUNDATIONS_FINAL_ASSESSMENT_RETRY_POLICY ||
    assessment.courseCompletionDependency !== false ||
    assessment.coreReadinessDependency !== false ||
    assessment.futureRewardEligibilityRelevance !== true
  ) {
    throw new Error('Foundations assessment frontmatter does not match the frozen contract');
  }

  return Object.freeze(assessment);
}

/** Requires the canonical artifact to be admitted before it can enter the runtime. */
export function parseApprovedFoundationsAssessment(markdown: string): FoundationsAssessment {
  const assessment = parseFoundationsAssessment(markdown);

  if (
    assessment.contentState !== 'APPROVED' ||
    assessment.currentness !== 'CURRENT' ||
    assessment.runtimeAvailability !== 'AVAILABLE'
  ) {
    throw new Error('Canonical Foundations assessment is not approved and available');
  }

  return assessment;
}

/** Scores only the selected answer IDs; client-provided score fields are ignored. */
export function scoreFoundationsAssessment(
  assessment: FoundationsAssessment,
  answers: Readonly<Record<string, unknown>>
): FoundationsAssessmentResult {
  if (!isRecord(answers)) {
    throw new TypeError('Foundations assessment answers must be an object');
  }

  const normalizedAnswers: Record<string, AssessmentAnswerId | null> = {};
  const correctQuestionIds: string[] = [];
  let score = 0;
  let answeredCount = 0;

  for (const question of assessment.questions) {
    const candidate = answers[question.id];
    const answer = isAssessmentAnswerId(candidate)
      ? candidate
      : null;

    normalizedAnswers[question.id] = answer;
    if (answer !== null) answeredCount += 1;
    if (answer === question.correctAnswerId) {
      score += 1;
      correctQuestionIds.push(question.id);
    }
  }

  return Object.freeze({
    score,
    questionCount: assessment.questionCount,
    passThreshold: assessment.passThreshold,
    passed: score >= assessment.passThreshold,
    answeredCount,
    answers: Object.freeze(normalizedAnswers),
    correctQuestionIds: Object.freeze(correctQuestionIds)
  });
}
