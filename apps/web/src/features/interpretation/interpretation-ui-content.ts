import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '../../lib/localization.js';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '../../lib/astrology-glossary.js';
import type {
  AspectDynamic,
  HouseDomain,
  PlanetMeaning,
  SignStyle,
  SupportedAspectType,
  SupportedPlanet
} from './interpretation-content.js';

type InterpretationCopyResult = {
  title: string;
  text: string;
  sourceContext: string;
};

export type InterpretationUiCopy = {
  planetInSign: (
    planet: SupportedPlanet,
    sign: string,
    meaning: PlanetMeaning,
    style: SignStyle
  ) => InterpretationCopyResult;
  ascendant: (sign: string, style: SignStyle, angleId: string) => InterpretationCopyResult;
  planetInHouse: (
    planet: SupportedPlanet,
    house: number,
    meaning: PlanetMeaning,
    domain: HouseDomain
  ) => InterpretationCopyResult;
  aspect: (
    firstPlanet: SupportedPlanet,
    secondPlanet: SupportedPlanet,
    aspectType: SupportedAspectType,
    orb: number,
    phaseState: string | null,
    firstMeaning: PlanetMeaning,
    secondMeaning: PlanetMeaning,
    dynamic: AspectDynamic
  ) => InterpretationCopyResult;
};

function displayTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  locale: SupportedLocale
): string {
  return resolveAstrologyDomainTerm(kind, value, locale)?.displayTerm ??
    (typeof value === 'string' ? value : String(value));
}

const ENGLISH_COPY: InterpretationUiCopy = {
  planetInSign: (planet, sign, meaning, style) => ({
    title: `${planet} in ${sign}`,
    text: `${meaning.focus} can take on a ${style.style} quality in ${sign}. This placement may show up as ${meaning.expression} while ${style.expression}.`,
    sourceContext: planet
  }),
  ascendant: (sign, style, angleId) => ({
    title: `Ascendant in ${sign}`,
    text: `The Ascendant can describe an outward approach rather than a fixed identity. In ${sign}, it may emphasize a ${style.style} way of entering situations, often ${style.expression}.`,
    sourceContext: angleId
  }),
  planetInHouse: (planet, house, meaning, domain) => ({
    title: `${planet} in House ${house}`,
    text: `House ${house} brings attention to ${domain.focus}. In this area, ${planet}'s ${meaning.focus.toLowerCase()} may show up as ${meaning.expression}, especially while ${domain.expression}.`,
    sourceContext: `${planet} — House ${house}`
  }),
  aspect: (
    firstPlanet,
    secondPlanet,
    aspectType,
    orb,
    phaseState,
    firstMeaning,
    secondMeaning,
    dynamic
  ) => {
    const phaseContext = phaseState ? ` — ${phaseState}` : '';

    return {
      title: `${firstPlanet} ${aspectType} ${secondPlanet}`,
      text: `${firstPlanet}'s ${firstMeaning.focus.toLowerCase()} and ${secondPlanet}'s ${secondMeaning.focus.toLowerCase()} can meet through a ${dynamic.quality} ${aspectType} dynamic. This aspect may show up as ${dynamic.expression}, giving both themes a place in the same pattern of response.`,
      sourceContext: `${firstPlanet} ${aspectType} ${secondPlanet} — orb ${orb}°${phaseContext}`
    };
  }
};

type LocalizedLanguage = {
  planetInSignTitle: (planet: string, sign: string) => string;
  planetInSignText: (planet: string, sign: string) => string;
  ascendantTitle: (angle: string, sign: string) => string;
  ascendantText: (sign: string) => string;
  planetInHouseTitle: (planet: string, house: string) => string;
  planetInHouseText: (planet: string, house: string) => string;
  aspectTitle: (firstPlanet: string, aspect: string, secondPlanet: string) => string;
  aspectText: (firstPlanet: string, secondPlanet: string, aspect: string) => string;
  aspectSourceContext: (
    firstPlanet: string,
    aspect: string,
    secondPlanet: string,
    orb: number,
    phase: string | null
  ) => string;
};

const LOCALIZED_LANGUAGES: Record<Exclude<SupportedLocale, 'en'>, LocalizedLanguage> = {
  es: {
    planetInSignTitle: (planet, sign) => `${planet} en ${sign}`,
    planetInSignText: (planet, sign) => `Esta posición relaciona el tema simbólico de ${planet} con la forma de expresión de ${sign}. Puede servir como punto de partida para observar cómo se manifiesta esta combinación, manteniendo separados los hechos calculados y la interpretación.`,
    ascendantTitle: (angle, sign) => `${angle} en ${sign}`,
    ascendantText: (sign) => `El Ascendente describe una forma de acercarse al entorno, no una identidad fija. En ${sign}, puede destacar el estilo de expresión asociado con este signo al entrar en nuevas situaciones.`,
    planetInHouseTitle: (planet, house) => `${planet} en ${house}`,
    planetInHouseText: (planet, house) => `La presencia de ${planet} en ${house} lleva su tema simbólico al ámbito de vida asociado con esta casa. Es una orientación interpretativa basada en el hecho de la carta, no un veredicto fijo.`,
    aspectTitle: (firstPlanet, aspect, secondPlanet) => `${firstPlanet} ${aspect} ${secondPlanet}`,
    aspectText: (firstPlanet, secondPlanet, aspect) => `La relación entre ${firstPlanet} y ${secondPlanet} se observa mediante ${aspect}. Puede servir como punto de partida para explorar cómo interactúan ambos temas dentro de un mismo patrón de respuesta, sin convertirlo en una conclusión fija.`,
    aspectSourceContext: (firstPlanet, aspect, secondPlanet, orb, phase) => `${firstPlanet} ${aspect} ${secondPlanet} — orbe ${orb}°${phase ? ` — ${phase}` : ''}`
  },
  fr: {
    planetInSignTitle: (planet, sign) => `${planet} en ${sign}`,
    planetInSignText: (planet, sign) => `Cette position relie le thème symbolique de ${planet} à la manière dont ${sign} s’exprime. Elle peut servir de point de départ pour observer cette combinaison tout en distinguant les faits calculés de l’interprétation.`,
    ascendantTitle: (angle, sign) => `${angle} en ${sign}`,
    ascendantText: (sign) => `L’Ascendant décrit une manière d’aborder le monde plutôt qu’une identité fixe. En ${sign}, il peut mettre en avant le style d’expression associé à ce signe lorsque de nouvelles situations se présentent.`,
    planetInHouseTitle: (planet, house) => `${planet} en ${house}`,
    planetInHouseText: (planet, house) => `La présence de ${planet} dans ${house} place son thème symbolique dans le domaine de vie associé à cette maison. Il s’agit d’une piste d’interprétation fondée sur le fait de la carte, et non d’un verdict définitif.`,
    aspectTitle: (firstPlanet, aspect, secondPlanet) => `${firstPlanet} ${aspect} ${secondPlanet}`,
    aspectText: (firstPlanet, secondPlanet, aspect) => `La relation entre ${firstPlanet} et ${secondPlanet} se lit à travers ${aspect}. Elle peut servir de point de départ pour explorer la manière dont ces deux thèmes interagissent dans un même schéma de réponse, sans en faire une conclusion fixe.`,
    aspectSourceContext: (firstPlanet, aspect, secondPlanet, orb, phase) => `${firstPlanet} ${aspect} ${secondPlanet} — orbe ${orb}°${phase ? ` — ${phase}` : ''}`
  },
  de: {
    planetInSignTitle: (planet, sign) => `${planet} in ${sign}`,
    planetInSignText: (planet, sign) => `Diese Position verbindet das symbolische Thema von ${planet} mit der Ausdrucksweise von ${sign}. Sie kann als Ausgangspunkt dienen, um diese Verbindung zu beobachten und berechnete Fakten von der Deutung getrennt zu halten.`,
    ascendantTitle: (angle, sign) => `${angle} in ${sign}`,
    ascendantText: (sign) => `Der Aszendent beschreibt eine Art, der Welt zu begegnen, und keine feste Identität. In ${sign} kann er die mit diesem Zeichen verbundene Ausdrucksweise beim Eintritt in neue Situationen hervorheben.`,
    planetInHouseTitle: (planet, house) => `${planet} im ${house}`,
    planetInHouseText: (planet, house) => `Die Position von ${planet} im ${house} bringt sein symbolisches Thema in den mit diesem Haus verbundenen Lebensbereich. Das ist ein Deutungsansatz auf Grundlage eines Kartenfakts, kein festes Urteil.`,
    aspectTitle: (firstPlanet, aspect, secondPlanet) => `${firstPlanet} ${aspect} ${secondPlanet}`,
    aspectText: (firstPlanet, secondPlanet, aspect) => `Die Beziehung zwischen ${firstPlanet} und ${secondPlanet} wird durch ${aspect} betrachtet. Sie kann als Ausgangspunkt dienen, um zu erkunden, wie beide Themen in einem Reaktionsmuster zusammenwirken, ohne daraus ein festes Ergebnis abzuleiten.`,
    aspectSourceContext: (firstPlanet, aspect, secondPlanet, orb, phase) => `${firstPlanet} ${aspect} ${secondPlanet} — Orbis ${orb}°${phase ? ` — ${phase}` : ''}`
  },
  ja: {
    planetInSignTitle: (planet, sign) => `${planet}（${sign}）`,
    planetInSignText: (planet, sign) => `この配置は、${planet}が示す象徴的なテーマと、${sign}での表現のしかたを結びつけます。計算された事実と解釈を分けたまま、この組み合わせがどのように表れるかを観察するための出発点として扱えます。`,
    ascendantTitle: (angle, sign) => `${angle}（${sign}）`,
    ascendantText: (sign) => `アセンダントは固定されたアイデンティティではなく、外界に向き合う方法を示します。${sign}では、新しい状況に入るときのこのサインの表現スタイルが強調されることがあります。`,
    planetInHouseTitle: (planet, house) => `${house}の${planet}`,
    planetInHouseText: (planet, house) => `${house}にある${planet}は、その象徴的なテーマをこのハウスに関連する生活領域へ持ち込みます。これはチャートの事実を起点にした解釈の方向性であり、固定的な判断ではありません。`,
    aspectTitle: (firstPlanet, aspect, secondPlanet) => `${firstPlanet}・${aspect}・${secondPlanet}`,
    aspectText: (firstPlanet, secondPlanet, aspect) => `${firstPlanet}と${secondPlanet}の関係は、${aspect}を通して読み取れます。これは、両方のテーマが一つの反応パターンの中でどのように関わるかを探るための出発点であり、固定的な結論ではありません。`,
    aspectSourceContext: (firstPlanet, aspect, secondPlanet, orb, phase) => `${firstPlanet}・${aspect}・${secondPlanet} — オーブ ${orb}°${phase ? `・${phase}` : ''}`
  },
  ko: {
    planetInSignTitle: (planet, sign) => `${sign}의 ${planet}`,
    planetInSignText: (planet, sign) => `이 배치는 ${planet}의 상징적 주제와 ${sign}이 표현되는 방식을 연결합니다. 계산된 사실과 해석을 구분한 상태에서 이 조합이 어떻게 나타나는지 살펴보는 출발점으로 사용할 수 있습니다.`,
    ascendantTitle: (angle, sign) => `${sign}의 ${angle}`,
    ascendantText: (sign) => `상승점은 고정된 정체성이 아니라 바깥세상에 접근하는 방식을 설명합니다. ${sign}에서는 새로운 상황에 들어갈 때 이 별자리가 지닌 표현 방식이 두드러질 수 있습니다.`,
    planetInHouseTitle: (planet, house) => `${house}의 ${planet}`,
    planetInHouseText: (planet, house) => `${house}에 있는 ${planet}은(는) 상징적 주제를 이 하우스와 연결된 삶의 영역으로 가져옵니다. 이는 차트 사실에 근거한 해석의 방향이며 고정된 판단이 아닙니다.`,
    aspectTitle: (firstPlanet, aspect, secondPlanet) => `${firstPlanet} ${aspect} ${secondPlanet}`,
    aspectText: (firstPlanet, secondPlanet, aspect) => `${firstPlanet}과(와) ${secondPlanet}의 관계는 ${aspect}(으)로 살펴볼 수 있습니다. 두 주제가 하나의 반응 패턴 안에서 어떻게 상호작용하는지 탐색하는 출발점이며, 고정된 결론을 뜻하지 않습니다.`,
    aspectSourceContext: (firstPlanet, aspect, secondPlanet, orb, phase) => `${firstPlanet} ${aspect} ${secondPlanet} — 오브 ${orb}°${phase ? ` — ${phase}` : ''}`
  },
  'zh-Hant': {
    planetInSignTitle: (planet, sign) => `${sign}的${planet}`,
    planetInSignText: (planet, sign) => `這項配置把${planet}所代表的象徵主題，連結到${sign}的表達方式。它可作為觀察這個組合如何呈現的起點，同時維持計算事實與詮釋之間的區分。`,
    ascendantTitle: (angle, sign) => `${sign}的${angle}`,
    ascendantText: (sign) => `上升點描述的是面對外界的方式，而不是固定不變的身分。在${sign}中，它可能突顯這個星座進入新情境時的表達風格。`,
    planetInHouseTitle: (planet, house) => `${house}的${planet}`,
    planetInHouseText: (planet, house) => `${planet}位於${house}，會把它的象徵主題帶入與此宮位相關的生活領域。這是以星盤事實為起點的詮釋方向，而不是固定結論。`,
    aspectTitle: (firstPlanet, aspect, secondPlanet) => `${firstPlanet} ${aspect} ${secondPlanet}`,
    aspectText: (firstPlanet, secondPlanet, aspect) => `${firstPlanet}與${secondPlanet}的關係可透過${aspect}來觀察。這是探索兩個主題如何在同一反應模式中互動的起點，不代表固定的結論。`,
    aspectSourceContext: (firstPlanet, aspect, secondPlanet, orb, phase) => `${firstPlanet} ${aspect} ${secondPlanet} — 容許度 ${orb}°${phase ? ` — ${phase}` : ''}`
  }
};

function createLocalizedCopy(
  locale: Exclude<SupportedLocale, 'en'>,
  language: LocalizedLanguage
): InterpretationUiCopy {
  const term = (kind: AstrologyGlossaryDomainKind, value: unknown) =>
    displayTerm(kind, value, locale);

  return {
    planetInSign: (planet, sign) => {
      const planetTerm = term('body', planet);
      const signTerm = term('sign', sign);

      return {
        title: language.planetInSignTitle(planetTerm, signTerm),
        text: language.planetInSignText(planetTerm, signTerm),
        sourceContext: planetTerm
      };
    },
    ascendant: (sign, _style, angleId) => {
      const signTerm = term('sign', sign);
      const angleTerm = term('angle', angleId);

      return {
        title: language.ascendantTitle(angleTerm, signTerm),
        text: language.ascendantText(signTerm),
        sourceContext: angleTerm
      };
    },
    planetInHouse: (planet, house) => {
      const planetTerm = term('body', planet);
      const houseTerm = term('house', house);

      return {
        title: language.planetInHouseTitle(planetTerm, houseTerm),
        text: language.planetInHouseText(planetTerm, houseTerm),
        sourceContext: `${planetTerm} — ${houseTerm}`
      };
    },
    aspect: (firstPlanet, secondPlanet, aspectType, orb, phaseState) => {
      const firstPlanetTerm = term('body', firstPlanet);
      const secondPlanetTerm = term('body', secondPlanet);
      const aspectTerm = term('aspect', aspectType);
      const phaseTerm = phaseState === null ? null : term('aspect_phase', phaseState);

      return {
        title: language.aspectTitle(firstPlanetTerm, aspectTerm, secondPlanetTerm),
        text: language.aspectText(firstPlanetTerm, secondPlanetTerm, aspectTerm),
        sourceContext: language.aspectSourceContext(
          firstPlanetTerm,
          aspectTerm,
          secondPlanetTerm,
          orb,
          phaseTerm
        )
      };
    }
  };
}

export function getInterpretationUiCopy(
  locale: SupportedLocale = DEFAULT_LOCALE
): InterpretationUiCopy {
  if (locale === DEFAULT_LOCALE) {
    return ENGLISH_COPY;
  }

  const localizedLocale = locale as Exclude<SupportedLocale, 'en'>;

  return createLocalizedCopy(localizedLocale, LOCALIZED_LANGUAGES[localizedLocale]);
}
