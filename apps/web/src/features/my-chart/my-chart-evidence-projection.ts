import type { BodyFact, ChartResult } from '@natalnode/contracts';
import {
  getAstrologyGlossaryNotation,
  resolveAstrologyDomainTerm
} from '../../core/astrology-taxonomy/astrology-glossary.js';
import {
  SUPPORTED_PLANETS,
  type SupportedPlanet
} from '../../core/astrology-taxonomy/chart-taxonomy.js';
import {
  PLANET_MEANINGS,
  SIGN_STYLES
} from '../interpretation/interpretation-content.js';
import {
  getFoundationsContentAvailability,
  getFoundationsContentVariant,
  getFoundationsLessonById,
  type FoundationsLesson,
  type FoundationsLessonId
} from '../learn/foundations/registry.js';

export const MY_CHART_CONTEXTUAL_LEARN_SCENARIOS = ['default', 'unknown-time'] as const;
export type MyChartContextualLearnScenario =
  (typeof MY_CHART_CONTEXTUAL_LEARN_SCENARIOS)[number];

export type MyChartEvidenceProjection = Readonly<{
  authority: 'DEVELOPMENT_RESEARCH_ONLY';
  scenario: MyChartContextualLearnScenario;
  developmentDisclosure: Readonly<{
    label: 'DEVELOPMENT RESEARCH PREVIEW';
    evidence: 'SAMPLE / FIXTURE-BACKED / INCOMPLETE RESEARCH';
    engineVersion: string;
    calculationStatus: ChartResult['calculationStatus'];
  }>;
  primaryEvidence: Readonly<{
    kind: 'BODY_SIGN_PLACEMENT';
    bodyId: string;
    bodyLabel: string;
    bodyGlyph?: string;
    sign: string;
    signLabel: string;
    signGlyph?: string;
    longitude: number;
    house: number | null;
    retrograde: boolean | null;
    factIdentity: null;
  }> | null;
  meaning: Readonly<{
    eligibility: 'BOUNDED_EXISTING_CONTENT' | 'FACT_PLUS_LEARN';
    source: 'EXISTING_INTERPRETATION_CONTENT' | 'FOUNDATIONS_ONLY';
    text: string;
  }>;
  learn: Readonly<{
    lessonId: FoundationsLessonId | null;
    slug: string | null;
    title: string | null;
    hookId: string | null;
    contentAvailability: 'AVAILABLE' | 'UNAVAILABLE';
    description: string;
  }>;
  technical: Readonly<{
    bodyId: string | null;
    sign: string | null;
    longitude: number | null;
    house: number | null;
    retrograde: boolean | null;
    calculationStatus: ChartResult['calculationStatus'];
    schemaVersion: string;
    engineVersion: string;
    astronomyConfigurationId: string | null;
    provenanceEnvelopeId: string | null;
    housesOmitted: boolean;
    anglesOmitted: boolean;
  }>;
  unknownTime: Readonly<{
    presentationStatus: 'DEFAULT_PRESENTATION' | 'UNKNOWN_TIME_PRESENTATION';
    runtimePropagation: 'NOT_AVAILABLE';
    omittedFacts: readonly ('HOUSES' | 'ANGLES' | 'HOUSE_BASED_CONTEXT')[];
  }>;
}>;

function isSupportedPlanet(value: string): value is SupportedPlanet {
  return (SUPPORTED_PLANETS as readonly string[]).includes(value);
}

function selectPrimaryBody(chart: ChartResult): BodyFact | null {
  return chart.bodies.find((body) =>
    isSupportedPlanet(body.bodyId) &&
    Object.prototype.hasOwnProperty.call(SIGN_STYLES, body.sign)
  ) ?? null;
}

function lessonIdForBody(bodyId: string): FoundationsLessonId {
  if (bodyId === 'Sun' || bodyId === 'Moon') {
    return 'foundations.sun_moon';
  }

  if (bodyId === 'Mercury' || bodyId === 'Venus' || bodyId === 'Mars') {
    return 'foundations.mercury_venus_mars';
  }

  return 'foundations.jupiter_saturn_outer_planets';
}

function resolveLesson(bodyId: string): FoundationsLesson | null {
  return getFoundationsLessonById(lessonIdForBody(bodyId));
}

function createMeaning(body: BodyFact | null): MyChartEvidenceProjection['meaning'] {
  if (body !== null && isSupportedPlanet(body.bodyId)) {
    const planetMeaning = PLANET_MEANINGS[body.bodyId];
    const signStyle = SIGN_STYLES[body.sign];

    if (planetMeaning !== undefined && signStyle !== undefined) {
      return {
        eligibility: 'BOUNDED_EXISTING_CONTENT',
        source: 'EXISTING_INTERPRETATION_CONTENT',
        text: `Existing bounded language uses ${planetMeaning.focus.toLowerCase()} as a question for ${body.bodyId}, while ${body.sign} is described as ${signStyle.style}. In this preview, the combination is a learning prompt about how chart layers meet, not a conclusion about a person.`
      };
    }
  }

  return {
    eligibility: 'FACT_PLUS_LEARN',
    source: 'FOUNDATIONS_ONLY',
    text: 'A bounded meaning is not admitted for this sample combination. Use the linked Foundations lesson to learn the vocabulary without extending the supplied fact into a personal conclusion.'
  };
}

function createLearnProjection(body: BodyFact | null): MyChartEvidenceProjection['learn'] {
  if (body === null) {
    return {
      lessonId: null,
      slug: null,
      title: null,
      hookId: null,
      contentAvailability: 'UNAVAILABLE',
      description: 'No supplied placement is available for a contextual lesson link.'
    };
  }

  const lesson = resolveLesson(body.bodyId);
  if (lesson === null) {
    return {
      lessonId: null,
      slug: null,
      title: null,
      hookId: null,
      contentAvailability: 'UNAVAILABLE',
      description: 'The existing Foundations registry has no admitted lesson for this supplied body.'
    };
  }

  const content = getFoundationsContentVariant(lesson.lessonId, 'en');
  const contentAvailability = getFoundationsContentAvailability(content);

  return {
    lessonId: lesson.lessonId,
    slug: lesson.slug,
    title: lesson.title,
    hookId: lesson.myChartHook.hookId,
    contentAvailability,
    description: lesson.shortDescription
  };
}

export function projectMyChartEvidence(
  chart: ChartResult,
  scenario: MyChartContextualLearnScenario = 'default'
): MyChartEvidenceProjection {
  const primaryBody = selectPrimaryBody(chart);
  const showTimeDependentFacts = scenario !== 'unknown-time';
  const bodyLabel = primaryBody === null
    ? null
    : resolveAstrologyDomainTerm('body', primaryBody.bodyId, 'en')?.displayTerm ?? primaryBody.bodyId;
  const signLabel = primaryBody === null
    ? null
    : resolveAstrologyDomainTerm('sign', primaryBody.sign, 'en')?.displayTerm ?? primaryBody.sign;
  const primaryEvidence = primaryBody === null || bodyLabel === null || signLabel === null
    ? null
    : {
        kind: 'BODY_SIGN_PLACEMENT' as const,
        bodyId: primaryBody.bodyId,
        bodyLabel,
        bodyGlyph: getAstrologyGlossaryNotation('body', primaryBody.bodyId, 'glyph'),
        sign: primaryBody.sign,
        signLabel,
        signGlyph: getAstrologyGlossaryNotation('sign', primaryBody.sign, 'glyph'),
        longitude: primaryBody.longitude,
        house: showTimeDependentFacts ? primaryBody.house : null,
        retrograde: primaryBody.retrograde,
        factIdentity: null
      };
  const learn = createLearnProjection(primaryBody);

  return {
    authority: 'DEVELOPMENT_RESEARCH_ONLY',
    scenario,
    developmentDisclosure: {
      label: 'DEVELOPMENT RESEARCH PREVIEW',
      evidence: 'SAMPLE / FIXTURE-BACKED / INCOMPLETE RESEARCH',
      engineVersion: chart.engineVersion,
      calculationStatus: chart.calculationStatus
    },
    primaryEvidence,
    meaning: createMeaning(primaryBody),
    learn,
    technical: {
      bodyId: primaryBody?.bodyId ?? null,
      sign: primaryBody?.sign ?? null,
      longitude: primaryBody?.longitude ?? null,
      house: showTimeDependentFacts ? primaryBody?.house ?? null : null,
      retrograde: primaryBody?.retrograde ?? null,
      calculationStatus: chart.calculationStatus,
      schemaVersion: chart.schemaVersion,
      engineVersion: chart.engineVersion,
      astronomyConfigurationId: chart.metadata.astronomyConfigurationId,
      provenanceEnvelopeId: chart.metadata.provenanceEnvelopeId,
      housesOmitted: !showTimeDependentFacts,
      anglesOmitted: !showTimeDependentFacts
    },
    unknownTime: {
      presentationStatus: showTimeDependentFacts
        ? 'DEFAULT_PRESENTATION'
        : 'UNKNOWN_TIME_PRESENTATION',
      runtimePropagation: 'NOT_AVAILABLE',
      omittedFacts: showTimeDependentFacts ? [] : ['HOUSES', 'ANGLES', 'HOUSE_BASED_CONTEXT']
    }
  };
}
