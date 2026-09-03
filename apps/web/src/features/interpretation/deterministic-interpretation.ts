import type { AngleFact, AspectFact, BodyFact, ChartResult } from '@natalnode/contracts';
import type { SupportedLocale } from '@/lib/localization';
import {
  SUPPORTED_PLANETS,
  type SupportedAspectType,
  type SupportedPlanet
} from '@/core/astrology-taxonomy/chart-taxonomy';
import {
  ASPECT_DYNAMICS,
  HOUSE_DOMAINS,
  PLANET_MEANINGS,
  SIGN_STYLES
} from './interpretation-content';
import {
  getInterpretationUiCopy,
  type InterpretationUiCopy
} from './interpretation-ui-content.js';
import type { ChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';

export type InterpretationItem = {
  id: string;
  title: string;
  text: string;
  sourceFacts: string[];
  sourceContext?: string;
};

export type InterpretationResult = {
  bigThree: InterpretationItem[];
  planetsInSigns: InterpretationItem[];
  planetsInHouses: InterpretationItem[];
  majorAspects: InterpretationItem[];
};

const BIG_THREE_PLANETS = ['Sun', 'Moon'] as const satisfies readonly SupportedPlanet[];

function findBody(chart: ChartResult, bodyId: SupportedPlanet): BodyFact | undefined {
  return chart.bodies.find((body) => body.bodyId === bodyId);
}

function findAngle(chart: ChartResult, angleId: string): AngleFact | undefined {
  return chart.angles.find((angle) => angle.angleId === angleId);
}

function findSupportedBody(chart: ChartResult, bodyId: string) {
  const body = chart.bodies.find((candidate) => candidate.bodyId === bodyId);
  const planet = SUPPORTED_PLANETS.find((candidate) => candidate === body?.bodyId);

  return body && planet ? { body, planet } : null;
}

function createPlanetItem(
  body: BodyFact,
  planet: SupportedPlanet,
  idPrefix: string,
  copy: InterpretationUiCopy
): InterpretationItem | null {
  const meaning = PLANET_MEANINGS[planet];
  const style = SIGN_STYLES[body.sign];

  if (!style) {
    return null;
  }

  const content = copy.planetInSign(planet, body.sign, meaning, style);

  return {
    id: `${idPrefix}-${planet.toLowerCase()}`,
    ...content,
    sourceFacts: [body.bodyId]
  };
}

function createPlanetInHouseItem(
  body: BodyFact,
  planet: SupportedPlanet,
  copy: InterpretationUiCopy
): InterpretationItem | null {
  const house = body.house;

  if (typeof house !== 'number' || !Number.isInteger(house) || house < 1 || house > 12) {
    return null;
  }

  const domain = HOUSE_DOMAINS[house];
  const meaning = PLANET_MEANINGS[planet];

  if (!domain) {
    return null;
  }

  const content = copy.planetInHouse(planet, house, meaning, domain);

  return {
    id: `planet-in-house-${planet.toLowerCase()}`,
    ...content,
    sourceFacts: [body.bodyId],
  };
}

function isSupportedAspectType(type: string): type is SupportedAspectType {
  return Object.prototype.hasOwnProperty.call(ASPECT_DYNAMICS, type);
}

function isSupportedPhaseState(phaseState: AspectFact['phaseState']): boolean {
  return (
    phaseState === null ||
    phaseState === 'APPLYING' ||
    phaseState === 'EXACT' ||
    phaseState === 'SEPARATING'
  );
}

function createAspectItem(
  chart: ChartResult,
  aspect: AspectFact,
  copy: InterpretationUiCopy
): InterpretationItem | null {
  if (!isSupportedAspectType(aspect.type) || !Number.isFinite(aspect.orb) || aspect.orb < 0) {
    return null;
  }

  if (!isSupportedPhaseState(aspect.phaseState)) {
    return null;
  }

  const firstBody = findSupportedBody(chart, aspect.firstBodyId);
  const secondBody = findSupportedBody(chart, aspect.secondBodyId);

  if (!firstBody || !secondBody) {
    return null;
  }

  const content = copy.aspect(
    firstBody.planet,
    secondBody.planet,
    aspect.type,
    aspect.orb,
    aspect.phaseState,
    PLANET_MEANINGS[firstBody.planet],
    PLANET_MEANINGS[secondBody.planet],
    ASPECT_DYNAMICS[aspect.type]
  );

  return {
    id: `aspect-${aspect.firstBodyId.toLowerCase()}-${aspect.type}-${aspect.secondBodyId.toLowerCase()}`,
    ...content,
    sourceFacts: [aspect.firstBodyId, aspect.secondBodyId],
  };
}

function createAscendantItem(angle: AngleFact, copy: InterpretationUiCopy): InterpretationItem | null {
  const style = SIGN_STYLES[angle.sign];

  if (!style) {
    return null;
  }

  const content = copy.ascendant(angle.sign, style, angle.angleId);

  return {
    id: 'big-three-ascendant',
    ...content,
    sourceFacts: [angle.angleId]
  };
}

export function createDeterministicInterpretation(
  chart: ChartResult,
  presentationPolicy: ChartPresentationPolicy,
  locale?: SupportedLocale
): InterpretationResult {
  const copy = getInterpretationUiCopy(locale);
  const bigThree = BIG_THREE_PLANETS.flatMap((planet) => {
    const body = findBody(chart, planet);
    const item = body ? createPlanetItem(body, planet, 'big-three', copy) : null;

    return item ? [item] : [];
  });

  const ascendant = presentationPolicy.showAngles ? findAngle(chart, 'ASC') : undefined;
  const ascendantItem = ascendant ? createAscendantItem(ascendant, copy) : null;

  if (ascendantItem) {
    bigThree.push(ascendantItem);
  }

  const planetsInSigns = SUPPORTED_PLANETS.flatMap((planet) => {
    const body = findBody(chart, planet);
    const item = body ? createPlanetItem(body, planet, 'planet-in-sign', copy) : null;

    return item ? [item] : [];
  });

  const planetsInHouses = presentationPolicy.showHouseInterpretation
    ? SUPPORTED_PLANETS.flatMap((planet) => {
        const body = findBody(chart, planet);
        const item = body ? createPlanetInHouseItem(body, planet, copy) : null;

        return item ? [item] : [];
      })
    : [];

  const majorAspects = chart.aspects.flatMap((aspect) => {
    const item = createAspectItem(chart, aspect, copy);

    return item ? [item] : [];
  });

  return {
    bigThree,
    planetsInSigns,
    planetsInHouses,
    majorAspects
  };
}
